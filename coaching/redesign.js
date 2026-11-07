window.RelevateUI = (() => {
  const escape = (value = "") => String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const link = (href, text, extra = "") => `<a class="btn btn--primary" href="${href}" ${extra}>${text}</a>`;
  const cardDetailsStates = new WeakMap();

  function setCardDetailsOpen(details, open, { keepControlVisible = false } = {}) {
    if (!details) return;
    let state = cardDetailsStates.get(details);
    if (!state) {
      state = { targetOpen: details.open, animation: null };
      cardDetailsStates.set(details, state);
    }
    state.keepControlVisible = keepControlVisible;
    if (state.targetOpen === open && (state.animation || details.open === open)) return;

    const container = details.closest(".expertProfileText") || details;
    const startHeight = container.getBoundingClientRect().height;
    container.style.height = `${startHeight}px`;
    state.animation?.cancel();
    state.animation = null;
    state.targetOpen = open;
    const summary = details.querySelector("summary");
    const content = details.querySelector(":scope > div");
    summary?.setAttribute("aria-expanded", String(open));
    if (content) content.inert = !open;

    const finish = () => {
      details.open = state.targetOpen;
      container.style.height = "";
      container.style.overflow = "";
      summary?.removeAttribute("aria-expanded");
      state.animation?.cancel();
      state.animation = null;
      if (!state.targetOpen && state.keepControlVisible && container !== details) {
        const headerBottom = document.querySelector(".siteHeader")?.getBoundingClientRect().bottom || 0;
        if (summary.getBoundingClientRect().top < headerBottom) {
          container.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
        }
      }
    };

    if (!startHeight || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    // Measure the target's natural height, including the package's closed preview.
    details.open = open;
    container.style.height = "auto";
    const endHeight = container.getBoundingClientRect().height;
    // Keep the content rendered until the closing animation finishes.
    details.open = true;
    container.style.height = `${startHeight}px`;
    container.style.overflow = "hidden";
    const animation = container.animate([
      { height: `${startHeight}px` },
      { height: `${endHeight}px` }
    ], { duration: 320, easing: "cubic-bezier(.22,.68,.2,1)" });
    state.animation = animation;
    animation.onfinish = () => {
      if (state.animation === animation) finish();
    };
  }

  function initCardDetails() {
    document.querySelectorAll(".expertMore, .packageCard__more").forEach(details => {
      details.querySelector("summary")?.addEventListener("click", event => {
        event.preventDefault();
        const open = cardDetailsStates.get(details)?.targetOpen ?? details.open;
        setCardDetailsOpen(details, !open, { keepControlVisible: open });
      });
    });
  }

  function initPackageCardSizing() {
    const grid = document.querySelector("[data-packages-grid]");
    const cards = Array.from(grid?.querySelectorAll(".packageCard") || []);
    if (!grid || !cards.length) return;
    const mobile = window.matchMedia("(max-width: 680px)");
    const rows = ["heading", "tagline", "includes", "more", "price", "link"];
    let measuredWidth = null;

    function update(force = false) {
      const width = grid.getBoundingClientRect().width;
      if (!width || (!force && measuredWidth === width)) return;
      measuredWidth = width;

      // Measure inert, collapsed copies so an open card never sets the shared sizes.
      const measure = document.createElement("div");
      measure.inert = true;
      measure.setAttribute("aria-hidden", "true");
      measure.style.cssText = "position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;contain:layout style paint";
      grid.parentElement.append(measure);
      try {
        const heights = rows.map(() => 0);
        cards.forEach(card => {
          const copy = card.cloneNode(true);
          copy.removeAttribute("id");
          copy.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
          copy.style.width = `${card.getBoundingClientRect().width}px`;
          const details = copy.querySelector("details");
          details.open = false;
          details.style.height = "";
          details.style.overflow = "";
          const label = ".packageCard__includesHeading > .eyebrow";
          copy.querySelector(label).style.display = window.getComputedStyle(card.querySelector(label)).display;
          measure.append(copy);
          rows.forEach((row, index) => {
            const element = copy.querySelector(`.packageCard__${row}`);
            const style = window.getComputedStyle(element);
            const height = element.getBoundingClientRect().height
              + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
            heights[index] = Math.max(heights[index], height);
          });
        });
        rows.forEach((row, index) => {
          grid.style.setProperty(`--package-row-${row}`, `${Math.ceil(heights[index] * 100) / 100}px`);
        });
      } finally {
        measure.remove();
      }
    }

    update(true);
    document.fonts?.ready.then(() => update(true));
    mobile.addEventListener("change", () => update(true));
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => update()).observe(grid);
    } else {
      window.addEventListener("resize", () => update());
    }
  }
  function flipCard({ id, icon: symbol, title, text, number = "", className = "" }) {
    return `<article class="flipCard ${className}">
      <button class="flipCard__toggle" type="button" aria-expanded="false" aria-controls="${id}-details" data-flip-card>
        <span class="flipCard__inner">
          <span class="flipCard__face flipCard__front">
            ${symbol ? `<span class="outlineIcon">${icon(symbol)}</span>` : ""}
            ${number ? `<span class="flipCard__number">${escape(number)}</span>` : ""}
            <span class="flipCard__title">${escape(title)}</span>
            <span class="flipCard__hint">Zobacz szczegóły ${icon("arrow-up-right")}</span>
          </span>
          <span class="flipCard__face flipCard__back" id="${id}-details" aria-hidden="true">
            <span class="flipCard__title">${escape(title)}</span>
            <span class="flipCard__description">${escape(text)}</span>
          </span>
        </span>
      </button>
    </article>`;
  }
  function initFlipCards() {
    document.querySelectorAll("[data-flip-card]").forEach(button => {
      button.addEventListener("click", () => {
        const open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        button.querySelector(".flipCard__front").setAttribute("aria-hidden", String(open));
        button.querySelector(".flipCard__back").setAttribute("aria-hidden", String(!open));
      });
      button.addEventListener("keydown", event => {
        if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
          event.preventDefault();
          button.click();
        }
      });
    });
  }
  function linkedin(expert, compact = false) {
    const label = `LinkedIn: ${expert.name}`;
    const classes = compact ? "expertLinkedin linkedinIcon" : "btn btn--secondary expertLinkedin";
    // Filled brand glyph from Bootstrap Icons; see LICENSES/bootstrap-icons.txt.
    const contents = `<svg class="linkedinBrand" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zM4.943 13.394V6.169H2.542v7.225zM3.743 5.182c.837 0 1.358-.554 1.358-1.248-.015-.709-.521-1.248-1.342-1.248S2.4 3.225 2.4 3.934c0 .694.521 1.248 1.327 1.248zm9.715 8.212V9.251c0-2.22-1.185-3.252-2.766-3.252-1.274 0-1.845.7-2.165 1.193V6.169H6.126c.031.678 0 7.225 0 7.225h2.401V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.217.662 1.217 1.633v3.866z"/></svg>` + (compact ? "" : " LinkedIn");
    const content = compact ? contents : contents.replace(" LinkedIn", '<span class="linkedinLabel">LinkedIn</span>');
    return expert.linkedin
      ? `<a class="${classes}" href="${escape(expert.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(label)}">${content}</a>`
      : `<button class="${classes}" type="button" disabled aria-label="${escape(label)}" title="Link do profilu wkrótce">${content}</button>`;
  }
  const order = ["navigate", "elevate", "relevate"];
  const common = [
    ["user-round-check", "Ekspert dobrany do Ciebie"], ["monitor", "Spotkania 1:1 online"],
    ["files", "Materiały po każdej sesji"], ["route", "Kolejne kroki i plan na następną sesję"],
    ["map-pin", "Praca na Twoich realnych sytuacjach"], ["lock-keyhole", "Pełna poufność"]
  ];
  function header(isPackage = false) {
    const home = isPackage ? "index.html" : "";
    const options = order.map(key => {
      const p = window.packageContent[key];
      return `<a href="${key}.html" style="--package-color:${p.color}"><span class="packageDotColor"></span><span><strong>${p.name}</strong><small>${p.kind}</small></span></a>`;
    }).join("");
    const navigation = `<a href="${home}#o-nas">O nas</a>
      <details class="offerMenu"><summary>Oferta ${icon("chevron-down")}</summary><div class="offerMenu__panel">${options}<a href="${home}#pakiety">Porównaj pakiety ${icon("arrow-right")}</a></div></details>
      <a href="${home}#jak-zaczynamy">Jak działamy</a><a href="${home}#eksperci">Eksperci</a><a href="${home}#faq">FAQ</a>
      <a href="${isPackage ? "index.html#wspolpraca" : "#wspolpraca"}" ${isPackage ? "" : 'data-open-modal="cooperation"'}>Dołącz do zespołu</a>`;
    return `<div class="container nav__inner"><a class="brand" href="${home || "#home"}" aria-label="RelevateMe, strona główna"><img class="brand__logo" src="pictures/relevateme-header.png" alt="RelevateMe" /></a>
      <nav class="nav__links" aria-label="Nawigacja">${navigation}</nav><div class="nav__actions"><a class="btn btn--primary nav__cta" href="${isPackage ? "#konsultacja" : "#kontakt"}">Umów bezpłatną konsultację</a>
      <button class="nav__toggle" id="navToggle" type="button" aria-label="Otwórz menu" aria-expanded="false" aria-controls="drawer"><span></span><span></span><span></span></button></div></div>
      <div class="drawer" id="drawer" aria-hidden="true"><button class="drawer__backdrop" id="drawerBackdrop" aria-label="Zamknij menu" type="button"></button><nav class="drawer__panel" aria-label="Nawigacja mobilna">
      <a class="drawer__link" href="${home}#o-nas">O nas</a><span class="drawer__label">Oferta</span><div class="drawer__packages">${options}</div>
      <a class="drawer__link" href="${home}#jak-zaczynamy">Jak działamy</a><a class="drawer__link" href="${home}#eksperci">Eksperci</a><a class="drawer__link" href="${home}#faq">FAQ</a>
      <a class="drawer__link" href="${isPackage ? "index.html#wspolpraca" : "#wspolpraca"}" ${isPackage ? "" : 'data-open-modal="cooperation"'}>Dołącz do zespołu</a>${link(isPackage ? "#konsultacja" : "#kontakt", "Umów bezpłatną konsultację")}</nav></div>`;
  }
  function privacy() {
    const info = window.siteContent.modals.privacy;
    return `<details class="consentDetails"><summary>Pokaż pełną informację RODO</summary><div>${info.sections.map(s => `<h4>${escape(s.title)}</h4><p>${escape(s.text)}</p>`).join("")}</div></details>`;
  }
  function form(packageName = "") {
    return `<label>IMIĘ *<input type="text" name="name" autocomplete="given-name" placeholder="Twoje imię" required maxlength="150" /></label>
      <label>E-MAIL *<input type="email" name="email" autocomplete="email" placeholder="twoj@email.pl" required maxlength="254" /></label>
      ${packageName ? `<input type="hidden" name="package" value="${packageName}" />` : `<fieldset class="packageOptions"><legend>Który pakiet Cię interesuje?</legend>${["Navigate", "Elevate", "Relevate", "Nie mam pewności"].map((name, i) => `<label><input type="radio" name="package" value="${name}" /><span style="--option-color:${["#8bbf9f", "#c49958", "#1e2f4e", "#bfb8aa"][i]}">${name}</span></label>`).join("")}</fieldset>`}
      <input class="formHoneypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <label class="contactConsent"><input type="checkbox" name="privacyConsent" required /><span>${escape(window.siteContent.contact.fields.consent)}</span></label>${privacy()}
      <button class="btn btn--primary btn--wide" type="submit" data-contact-submit disabled>Umów bezpłatną konsultację</button><p class="formStatus" id="formStatus" role="status" aria-live="polite"></p>`;
  }
  function faq(items) {
    return `<div class="faqList">${items.map((f, i) => `<details ${i === 0 ? "open" : ""}><summary>${escape(f.question || f.q)}<span><i data-lucide="plus" class="faqPlus" aria-hidden="true"></i><i data-lucide="minus" class="faqMinus" aria-hidden="true"></i></span></summary><div><p>${escape(f.answer || f.a)}</p>${f.extra ? `<p>${escape(f.extra)}</p>` : ""}</div></details>`).join("")}</div>`;
  }
  function packageMore(p) {
    return `<details class="packageCard__more"><summary><span>Jak pracujemy i co zyskasz</span>${icon("chevron-down")}<span class="packageCard__preview" aria-hidden="true">${escape(p.context)}</span></summary><div><p>${escape(p.context)}</p><ul>${p.focus.map(t => `<li>${escape(t)}</li>`).join("")}</ul><h4>Efekt</h4><p>${escape(p.result)}</p></div></details>`;
  }
  function footer(isPackage = false) {
    const home = isPackage ? "index.html" : "";
    const experts = window.siteContent.experts.items.map(expert => `<div class="footer__mentor"><span>${escape(expert.name)}</span>${linkedin(expert, true)}</div>`).join("");
    return `<div class="container footer__inner">
      <div class="footer__identity"><img src="pictures/relevateme-footer.png" alt="RelevateMe" />
        <a href="mailto:kontakt@relevateme.pl">kontakt@relevateme.pl</a>${experts}</div>
      <div class="footer__bottom"><p>© <span id="year">${new Date().getFullYear()}</span> RelevateMe</p>
        <div class="footer__links"><a href="${home}#faq">FAQ</a>
          <a href="${home}#prywatnosc" ${isPackage ? "" : 'data-open-modal="privacy"'}>Polityka prywatności i RODO</a>
          <a href="${home}#wspolpraca" ${isPackage ? "" : 'data-open-modal="cooperation"'}>Dołącz do zespołu</a>
          <a href="#${isPackage ? "top" : "home"}">Wróć na górę ${icon("arrow-up")}</a></div></div></div>`;
  }
  function refreshIcons() { window.lucide?.createIcons({ attrs: { "stroke-width": 1.7 } }); }
  function initMenus(isPackage = false) {
    const drawerElement = document.getElementById("drawer");
    const drawerToggle = document.getElementById("navToggle");
    drawerElement.inert = true;
    new MutationObserver(() => {
      const open = drawerElement.getAttribute("aria-hidden") === "false";
      drawerElement.inert = !open;
      drawerToggle.setAttribute("aria-label", open ? "Zamknij menu" : "Otwórz menu");
      if (open) drawerElement.querySelector("a")?.focus({ preventScroll: true });
    }).observe(drawerElement, { attributes: true, attributeFilter: ["aria-hidden"] });
    drawerElement.addEventListener("keydown", event => {
      if (event.key !== "Tab") return;
      const links = [...drawerElement.querySelectorAll("a,button")].filter(el => el.offsetParent !== null);
      const first = links[0], last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    document.querySelectorAll(".offerMenu").forEach(menu => {
      document.addEventListener("click", event => { if (!menu.contains(event.target)) menu.open = false; });
      menu.addEventListener("keydown", event => { if (event.key === "Escape") { menu.open = false; menu.querySelector("summary").focus(); } });
    });
    if (isPackage) {
      const toggle = document.getElementById("navToggle");
      const drawer = document.getElementById("drawer");
      const close = () => { drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); toggle.setAttribute("aria-expanded", "false"); document.body.classList.remove("drawer-open"); };
      toggle.addEventListener("click", () => {
        if (drawer.classList.contains("is-open")) return close();
        drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); toggle.setAttribute("aria-expanded", "true"); document.body.classList.add("drawer-open");
      });
      document.getElementById("drawerBackdrop").addEventListener("click", close);
      drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
      document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    }
    refreshIcons();
  }
  return { escape, icon, link, flipCard, initFlipCards, setCardDetailsOpen, initCardDetails, initPackageCardSizing, linkedin, common, order, header, privacy, form, faq, packageMore, footer, refreshIcons, initMenus };
})();

window.prepareRedesign = () => {
  const ui = window.RelevateUI;
  const c = window.siteContent;
  document.body.classList.add("redesign");
  document.querySelector(".ambient")?.remove();
  document.getElementById("siteHeader").innerHTML = ui.header();
  document.querySelector(".nav__actions > .btn").classList.add("nav__cta");
  document.getElementById("coaching")?.remove();
  document.querySelector(".heroLogo")?.remove();
  document.querySelector(".hero__title").innerHTML = c.hero.title.split("\n").map(line => `<span>${ui.escape(line).replace(/życia\.$/, '<em class="hero__life">życia.</em>')}</span>`).join("");
  document.querySelectorAll("[data-goal-label],[data-next-goal-label]").forEach(label => {
    label.dataset.goalCount = c.hero.goals.length;
  });
  document.querySelector(".hero__actions").innerHTML = ui.link("#kontakt", `${ui.escape(c.nav.cta)}<span class="hero__ctaArrow">${ui.icon("arrow-up-right")}</span>`);
  document.querySelector("[data-goal-card]").title = "Kolejna karta";
  document.querySelectorAll("[data-goal-face],[data-next-goal-face]").forEach(face => {
    const hint = document.createElement("span");
    hint.className = "quoteCard__hint";
    hint.setAttribute("aria-hidden", "true");
    hint.innerHTML = ui.icon("arrow-right");
    face.append(hint);
  });
  document.querySelectorAll(".storyCard").forEach((card, i) => {
    const recommendation = card.querySelector(".storyCard__recommendation");
    const target = ["navigate", "elevate", "relevate"][i];
    if (recommendation) {
      const a = document.createElement("a");
      a.href = `#pakiet-${target}`;
      a.className = recommendation.className;
      const details = window.packageContent[target];
      a.innerHTML = `<span>Najczęściej zaczyna od pakietu</span><span class="storyCard__package"><span class="packageDotColor" style="--package-color:${details.color}"></span><strong>${details.name}</strong><span>· ${ui.escape(details.kind)}</span>${ui.icon("arrow-right")}</span>`;
      recommendation.replaceWith(a);
    }
  });
  document.querySelectorAll("[data-stories-dots],[data-packages-dots],[data-experts-dots],[data-formula-dots]").forEach(dots => dots.removeAttribute("aria-hidden"));
  const packageGrid = document.querySelector("[data-packages-grid]");
  const common = document.createElement("div");
  common.id = "kazdy-pakiet";
  common.className = "packageCommon";
  common.innerHTML = `<p class="eyebrow">Każdy pakiet zawiera</p><ul>${ui.common.map(([icon, text]) => `<li><span class="outlineIcon">${ui.icon(icon)}</span><span>${icon === "map-pin" ? 'Praca na Twoich<br><span class="nowrap">realnych sytuacjach</span>' : ui.escape(text)}</span></li>`).join("")}</ul>`;
  packageGrid.before(common);
  packageGrid.querySelectorAll(".packagePath").forEach((card, i) => {
    const p = c.packages.items[i];
    const details = window.packageContent[p.slug];
    card.id = `pakiet-${p.slug}`;
    card.classList.add("packageCard");
    card.style.setProperty("--package-color", details.color);
    card.innerHTML = `<div class="packageCard__heading"><div class="packageCard__meta"><span class="packageCard__number">${p.step}</span>${i === 2 ? `<span class="flagship">${ui.icon("sparkles")} Pakiet flagowy</span>` : ""}</div>
      <p class="packageCard__type"><span class="packageDotColor"></span>${ui.escape(p.type.replace("|", "·"))}</p><h3>${p.name}</h3></div>
      <p class="packageCard__tagline">${p.tagline}</p><div class="packageCard__context"><span class="eyebrow">Jak pracujemy</span><p>${p.context}</p></div>
      <ul class="packageCard__tags">${p.focus.map(t => `<li>${t}</li>`).join("")}</ul><div class="packageCard__includes"><div class="packageCard__includesHeading"><span class="eyebrow">W pakiecie</span>${i === 2 ? `<span class="flagship flagship--includes">${ui.icon("sparkles")} Pakiet flagowy</span>` : ""}</div><ul>${p.includes.map(t => `<li>${t}</li>`).join("")}</ul></div>
      <div class="packageCard__result"><span class="eyebrow">Efekt</span><p>${p.result}</p></div>
      ${ui.packageMore(p)}
      <p class="packageCard__price">${ui.escape(p.price).replace("netto / h*", '<small>netto / h*</small>')}</p><a class="packageCard__link" href="${p.slug}.html">Zobacz szczegóły ${ui.icon("arrow-right")}</a>`;
  });
  const note = document.createElement("p");
  note.className = "packagePriceNote";
  note.textContent = "* Stawki są orientacyjne, dokładny plan i koszt całego procesu ustalamy na bezpłatnej konsultacji.";
  document.querySelector("[data-packages-dots]").after(note);
  const start = document.createElement("div");
  start.id = "jak-zaczynamy";
  start.className = "startSteps";
  const steps = [
    ["messages-square", "Bezpłatna konsultacja", "60 minut online, żeby przyjrzeć się Twojej sytuacji. Rozmawiamy o tym, co Cię blokuje i jakiej zmiany potrzebujesz. Proponujemy pakiet i eksperta, a Ty sprawdzasz, czy ten sposób pracy Ci odpowiada."],
    ["map", "Plan współpracy", "Przekładamy ogólny cel na konkretne priorytety. Ustalamy, czym zajmiemy się najpierw, jak często będziemy się spotykać i po czym poznamy postęp. Wiesz, nad czym pracujesz i jaki będzie pierwszy krok."],
    ["chart-no-axes-combined", "Sesje 1:1", "Pracujemy na Twoich bieżących decyzjach i sytuacjach z firmy lub życia. Między spotkaniami sprawdzasz ustalone działania w praktyce. Po każdej sesji dostajesz materiały i kolejne kroki, a na następnej omawiamy, co zadziałało i co wymaga zmiany."]
  ];
  start.innerHTML = `<p class="eyebrow">Jak zaczynamy</p><h3>Trzy kroki do pierwszej sesji</h3><div class="startSteps__grid">${steps.map(([ic, title, text], i) => ui.flipCard({ id: `start-step-${i + 1}`, icon: ic, title, text, number: `0${i + 1}` })).join("")}</div>`;
  document.querySelector(".packagesCta").replaceWith(start);
  const quizCta = document.createElement("div");
  quizCta.className = "packageQuizCta";
  quizCta.innerHTML = '<p><strong>Wolisz najpierw sprawdzić kierunek?</strong> Odpowiedz na 6 krótkich pytań.</p><button class="btn btn--secondary" data-open-quiz type="button">Dobierz pakiet</button>';
  start.after(quizCta);
  document.querySelector(".processSection")?.remove();
  const expertHead = document.querySelector("#eksperci .sectionHead");
  const expertDivider = document.createElement("span"); expertDivider.className = "sectionDivider"; expertDivider.setAttribute("aria-hidden", "true"); expertHead.querySelector("h2").after(expertDivider);
  const lead = document.createElement("p"); lead.textContent = c.experts.lead; expertHead.append(lead);
  const controls = document.createElement("div"); controls.className = "carouselControls";
  controls.innerHTML = `<button type="button" aria-label="Poprzedni ekspert" title="Poprzedni ekspert">${ui.icon("arrow-left")}</button><button type="button" aria-label="Następny ekspert" title="Następny ekspert">${ui.icon("arrow-right")}</button>`;
  expertHead.append(controls);
  const dots = document.querySelector("[data-experts-dots]");
  const pager = document.createElement("div"); pager.className = "expertPager";
  dots.before(pager);
  const pagerArrows = [...controls.querySelectorAll("button")].map(button => {
    const arrow = button.cloneNode(true); arrow.className = "expertPager__arrow"; return arrow;
  });
  pager.append(pagerArrows[0], dots, pagerArrows[1]);
  [...controls.querySelectorAll("button"), ...pagerArrows].forEach((button, i) => button.addEventListener("click", () => {
    const track = document.querySelector("[data-experts-track]");
    const slides = [...track.children];
    const current = slides.reduce((best, slide, idx) => Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft) < Math.abs(slides[best].offsetLeft - track.offsetLeft - track.scrollLeft) ? idx : best, 0);
    const next = slides[(current + (i % 2 ? 1 : -1) + slides.length) % slides.length];
    slides.forEach(slide => { if (slide !== next) ui.setCardDetailsOpen(slide.querySelector(".expertMore"), false); });
    track.scrollTo({ left: next.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }));
  document.querySelectorAll(".expertSlide").forEach((slide, i) => {
    const expert = c.experts.items[i];
    const bio = slide.querySelector(".expertBio");
    const role = document.createElement("p"); role.className = "expertRole"; role.textContent = expert.role; bio.querySelector("h3").after(role);
    const paragraphs = [...bio.querySelectorAll("p:not(.expertRole)")];
    const profileText = document.createElement("div");
    profileText.className = "expertProfileText";
    const text = document.createElement("div");
    text.className = "expertMore__text";
    text.id = `expert-profile-${i + 1}`;
    text.append(...paragraphs);
    const more = document.createElement("details");
    more.className = "expertMore";
    more.innerHTML = `<summary aria-controls="${text.id}"><span>Pełny profil</span>${ui.icon("chevron-down")}</summary><div><dl class="expertMoreStats">${expert.stats.map(stat => `<div><dt>${ui.escape(stat.label)}</dt><dd>${ui.escape(`${stat.prefix || ""}${stat.value}${stat.suffix || ""}`)}</dd></div>`).join("")}</dl></div>`;
    profileText.append(text, more);
    bio.append(profileText);
    const actions = document.createElement("div"); actions.className = "expertActions";
    actions.innerHTML = ui.link("#kontakt", `<span class="expertCtaDesktop">${ui.escape(c.nav.cta)}</span><span class="expertCtaMobile">Umów konsultację</span>`) + ui.linkedin(expert);
    bio.append(actions);
    slide.querySelector(".expertStats")?.style.setProperty("--expert-stat-columns", expert.stats.length);
  });
  const join = document.createElement("p"); join.className = "expertJoin";
  join.innerHTML = 'Pracujesz jako coach, mentor, trener lub doradca? <a href="#wspolpraca" data-open-modal="cooperation">Dołącz do zespołu ' + ui.icon("arrow-right") + '</a>';
  document.querySelector(".experts").append(join);
  const about = document.createElement("section"); about.className = "section aboutSection"; about.id = "o-nas";
  const values = [
    ["target", "Konkret", "Zaczynamy od sytuacji, która wymaga decyzji: zaległego tematu, trudnej rozmowy lub nadmiaru obowiązków. Porządkujemy opcje i kończymy spotkanie ustaleniem, co zrobisz, kiedy i po czym poznasz postęp."],
    ["handshake", "Doświadczenie z pierwszej ręki", "Nasi mentorzy sami prowadzili firmy, budowali zespoły i podejmowali trudne decyzje. Pomagają sprawdzić założenia, dostrzec ryzyka i porównać możliwe rozwiązania z realiami Twojej firmy."],
    ["sliders-horizontal", "Dopasowanie", "Na konsultacji pytamy o Twój cel, obecną sytuację i możliwości czasowe. Na tej podstawie proponujemy eksperta i sposób pracy. Tempo oraz zadania między sesjami dopasowujemy do Twoich priorytetów."],
    ["compass", "Kierownica po Twojej stronie", "Pomagamy oddzielić fakty od założeń, nazwać ryzyka i zobaczyć dostępne opcje. Możesz skonfrontować swój pomysł z inną perspektywą, ale o kierunku i kolejnych krokach decydujesz Ty."]
  ];
  about.innerHTML = `<div class="container aboutContent">
    <header class="aboutHeading"><p class="eyebrow">O nas</p><h2>Jak powstało RelevateMe</h2></header>
    <div class="aboutIntro"><div class="aboutIntro__copy"><p>Duże firmy od lat dają swoim prezesom coachów i mentorów. Właściciele małych i średnich firm zwykle zostają z decyzjami sami. RelevateMe powstało, żeby to zmienić. Dziś budujemy zespół coachów i mentorów z doświadczeniem w biznesie, z którymi pracujesz 1:1 i online.</p></div>
      ${ui.flipCard({ id: "about-balance", className: "aboutBalance", title: "Nie musisz wybierać między firmą a życiem.", text: "Pracujemy 1:1 i online. Eksperta, tempo i materiały dobieramy do Twojej sytuacji. Pomagamy uporządkować decyzje, a kierownica pozostaje po Twojej stronie." })}
    </div>
    <div class="valuesGrid">${values.map(([ic, title, text], i) => ui.flipCard({ id: `about-value-${i + 1}`, icon: ic, title, text })).join("")}</div>
  </div>`;
  document.getElementById("eksperci").after(about);
  ui.initFlipCards();
  about.after(document.getElementById("formula"));
  const formula = document.getElementById("formula");
  formula.querySelector("h2").innerHTML = 'Ty prowadzisz.<br>My widzimy<br><span class="nowrap">zakręt wcześniej.</span>';
  const formulaDivider = document.createElement("span"); formulaDivider.className = "sectionDivider"; formulaDivider.setAttribute("aria-hidden", "true"); formula.querySelector("h2").after(formulaDivider);
  const opening = "Wyobraź sobie, że jesteś kierowcą Formuły 1.";
  const formulaLead = c.formula.lead.replace("Siedzisz sam za kierownicą", "Siedzisz za kierownicą");
  if (formulaLead.startsWith(opening)) formula.querySelector(".formula__lead").innerHTML = `<strong>${ui.escape(opening).replace("Formuły 1.", '<span class="nowrap">Formuły 1.</span>')}</strong>${ui.escape(formulaLead.slice(opening.length))}`;
  formula.querySelectorAll(".formulaMobileSlide h3").forEach(title => {
    title.innerHTML = ui.escape(title.textContent).replace("Formuły 1.", '<span class="nowrap">Formuły 1.</span>');
  });
  const contactForm = document.getElementById("contactForm");
  contactForm.innerHTML = ui.form();
  document.querySelector(".contactCards")?.remove();
  document.querySelector(".contact__actions")?.remove();
  const faq = document.createElement("section"); faq.className = "section faqSection"; faq.id = "faq";
  faq.innerHTML = `<div class="container faqLayout"><div><h2>Najczęściej zadawane pytania o współpracę z nami</h2></div><div>${ui.faq(c.modals.faq.items)}</div></div>`;
  document.getElementById("kontakt").after(faq);
  document.querySelector(".footer").innerHTML = ui.footer();
  ui.initCardDetails();
  ui.initMenus();
  ui.initPackageCardSizing();
  const footerObserver = new IntersectionObserver(entries => {
    document.querySelector(".quizWidget")?.classList.toggle("is-footer-visible", entries[0].isIntersecting);
  });
  footerObserver.observe(document.querySelector(".footer"));
  window.addEventListener("DOMContentLoaded", () => {
    const modal = { "#wspolpraca": "cooperation", "#prywatnosc": "privacy" }[window.location.hash];
    if (modal) document.querySelector(`[data-open-modal="${modal}"]`)?.click();
  });
};
