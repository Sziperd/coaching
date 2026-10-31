window.RelevateUI = (() => {
  const escape = (value = "") => String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const link = (href, text, extra = "") => `<a class="btn btn--primary" href="${href}" ${extra}>${text}</a>`;
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
  return { escape, icon, link, linkedin, common, order, header, privacy, form, faq, packageMore, footer, refreshIcons, initMenus };
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
  document.querySelector(".hero__title").innerHTML = c.hero.title.split("\n").map(line => `<span>${ui.escape(line)}</span>`).join("");
  document.querySelector(".hero__actions").innerHTML = ui.link("#kontakt", c.nav.cta);
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
    ["messages-square", "Bezpłatna konsultacja", "60 minut online. Opowiadasz, z czym przychodzisz, a my proponujemy pakiet i eksperta."],
    ["map", "Plan współpracy", "Ustalamy cel, priorytety i to, od czego zaczynamy."],
    ["chart-no-axes-combined", "Sesje 1:1", "Po każdej sesji dostajesz materiały, konkretne kroki i plan na następne spotkanie, więc wiesz, od czego zacząć jutro."]
  ];
  start.innerHTML = `<p class="eyebrow">Jak zaczynamy</p><h3>Trzy kroki do pierwszej sesji</h3><div class="startSteps__grid">${steps.map(([ic, title, text], i) => `<article><span class="outlineIcon">${ui.icon(ic)}</span><span class="eyebrow">0${i + 1}</span><h4>${title}</h4><p>${text}</p></article>`).join("")}</div>`;
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
    slides.forEach(slide => { if (slide !== next) slide.querySelector(".expertMore")?.removeAttribute("open"); });
    track.scrollTo({ left: next.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }));
  document.querySelectorAll(".expertSlide").forEach((slide, i) => {
    const expert = c.experts.items[i];
    const bio = slide.querySelector(".expertBio");
    const role = document.createElement("p"); role.className = "expertRole"; role.textContent = expert.role; bio.querySelector("h3").after(role);
    const paragraphs = [...bio.querySelectorAll("p:not(.expertRole)")];
    paragraphs.forEach(paragraph => paragraph.classList.add("expertDesktopBio"));
    const intro = document.createElement("p");
    intro.className = "expertMobileIntro";
    intro.textContent = expert.shortBio;
    const more = document.createElement("details");
    more.className = "expertMore";
    more.innerHTML = `<summary>Pełny profil ${ui.icon("chevron-down")}</summary><div>${paragraphs.map(paragraph => `<p>${ui.escape(paragraph.textContent)}</p>`).join("")}<dl class="expertMoreStats">${expert.stats.map(stat => `<div><dt>${ui.escape(stat.label)}</dt><dd>${ui.escape(`${stat.prefix || ""}${stat.value}${stat.suffix || ""}`)}</dd></div>`).join("")}</dl></div>`;
    bio.append(intro, more);
    const actions = document.createElement("div"); actions.className = "expertActions";
    actions.innerHTML = ui.link("#kontakt", `<span class="expertCtaDesktop">${ui.escape(c.nav.cta)}</span><span class="expertCtaMobile">Umów konsultację</span>`) + ui.linkedin(expert);
    bio.append(actions);
    slide.querySelector(".expertStats")?.style.setProperty("--expert-stat-columns", expert.stats.length);
  });
  const join = document.createElement("p"); join.className = "expertJoin";
  join.innerHTML = 'Pracujesz jako coach, mentor albo trener? <a href="#wspolpraca" data-open-modal="cooperation">Dołącz do zespołu ' + ui.icon("arrow-right") + '</a>';
  document.querySelector(".experts").append(join);
  const about = document.createElement("section"); about.className = "section aboutSection"; about.id = "o-nas";
  const values = [
    ["target", "Konkret", "Pracujemy na Twoich decyzjach. Po spotkaniu masz materiały, kolejne kroki i plan."],
    ["handshake", "Doświadczenie z pierwszej ręki", "Nasi mentorzy sami prowadzili firmy."],
    ["sliders-horizontal", "Dopasowanie", "Eksperta, tempo i materiały dobieramy do Twojej sytuacji."],
    ["compass", "Kierownica po Twojej stronie", "Decyzje podejmujesz Ty. My pokazujemy, co widać z boku."]
  ];
  about.innerHTML = `<div class="container aboutContent">
    <header class="aboutHeading"><p class="eyebrow">O nas</p><h2>Jak powstało RelevateMe</h2></header>
    <div class="aboutIntro"><div class="aboutIntro__copy"><p>Duże firmy od lat dają swoim prezesom coachów i mentorów. Właściciele małych i średnich firm zwykle zostają z decyzjami sami. RelevateMe powstało, żeby to zmienić. Dziś budujemy zespół coachów i mentorów z doświadczeniem w biznesie, z którymi pracujesz 1:1 i online.</p></div>
      <figure class="aboutQuote"><span class="aboutQuote__mark" aria-hidden="true">„</span><blockquote>Nie musisz wybierać między firmą a życiem.</blockquote></figure>
    </div>
    <div class="valuesGrid">${values.map(([ic, title, text]) => `<article><span class="outlineIcon">${ui.icon(ic)}</span><h3>${title}</h3><p>${text}</p></article>`).join("")}</div>
  </div>`;
  document.getElementById("eksperci").after(about);
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
  ui.initMenus();
  const footerObserver = new IntersectionObserver(entries => {
    document.querySelector(".quizWidget")?.classList.toggle("is-footer-visible", entries[0].isIntersecting);
  });
  footerObserver.observe(document.querySelector(".footer"));
  window.addEventListener("DOMContentLoaded", () => {
    const modal = { "#wspolpraca": "cooperation", "#prywatnosc": "privacy" }[window.location.hash];
    if (modal) document.querySelector(`[data-open-modal="${modal}"]`)?.click();
  });
};
