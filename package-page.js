(() => {
  const ui = window.RelevateUI;
  const key = document.body.dataset.package;
  const p = window.packageContent[key];
  if (!p) return;
  const e = ui.escape;
  const c = window.siteContent;
  document.title = p.title;
  document.querySelector('meta[name="description"]').content = p.desc;
  document.body.style.setProperty("--package-color", p.color);
  document.body.style.setProperty("--package-wash", p.hero);
  document.body.style.setProperty("--package-ink", p.ink);
  document.body.style.setProperty("--package-highlight", key === "relevate" ? "#8a6a35" : p.ink);
  document.body.style.setProperty("--package-on-color", p.onColor);
  document.getElementById("siteHeader").innerHTML = ui.header(true);
  document.querySelector("main").innerHTML = `
    <section class="packageHero" id="top"><div class="container packageHero__grid"><div class="packageHero__copy">
      <div class="packageHero__labels"><p class="eyebrow"><span class="packageDotColor"></span>${p.label}</p>${p.flag ? `<span class="flagship">${ui.icon("sparkles")} Pakiet flagowy</span>` : ""}</div>
      <h1>${p.name}</h1><p class="packageHero__sub">${p.sub}</p><p class="packageHero__desc">${p.desc}</p>${ui.link("#konsultacja", c.nav.cta)}
      </div><div class="packageHero__facts"><div class="factsPanel"><p class="eyebrow">W skrócie</p><dl>${p.facts.map(f => `<div><dt>${f.l}</dt><dd>${f.v}</dd></div>`).join("")}</dl></div><p>* Stawka orientacyjna. Całkowitą inwestycję znajdziesz w <a href="#faq-pakietu">FAQ niżej</a>.</p></div></div></section>
    <nav class="packageTabs" aria-label="Pakiety"><div class="container">${ui.order.map(k => { const t = window.packageContent[k]; return `<a href="${k}.html" ${k === key ? 'aria-current="page"' : ""} style="--package-color:${t.color};--package-wash:${t.hero}"><span class="packageDotColor"></span><small>${t.num}</small>${t.name}</a>`; }).join("")}</div></nav>
    <section class="section packageAudience"><div class="container"><p class="eyebrow">Dla kogo</p><h2>${p.mA} <span style="color:var(--package-highlight)">${p.mB}</span> ${p.mC}</h2><div class="packageAudience__points">${p.points.map(text => `<article><span class="checkMark">${ui.icon("check")}</span><p>${text}</p></article>`).join("")}</div></div></section>
    <section class="section sessionsSection"><div class="container"><p class="eyebrow">Co dostajesz</p><h2>Co jest w pakiecie i jak wyglądają sesje</h2><div class="sessionsGrid"><div class="inPackage"><p class="eyebrow">W pakiecie</p><ul>${p.inPkg.map(text => `<li>${text}</li>`).join("")}</ul><p>W każdym pakiecie masz też eksperta dobranego do Ciebie, spotkania 1:1 online, pracę na Twoich realnych sytuacjach i pełną poufność. <a href="index.html#kazdy-pakiet">Zobacz pełną listę ${ui.icon("arrow-right")}</a></p></div><div class="sessionSteps"><p class="eyebrow">Jak przebiegają sesje</p>${p.steps.map(s => `<article><span>${s.n}</span><div><h3>${s.t}</h3><p>${s.d}</p></div></article>`).join("")}</div></div></div></section>
    <section class="section packageChanges"><div class="container"><p class="eyebrow">Efekt</p><h2>${p.chHead}</h2><div class="changesGrid">${p.changes.map(ch => `<article><h3>${ch.t}</h3><p>${ch.d}</p></article>`).join("")}</div><div class="changesCta">${ui.link("#konsultacja", c.nav.cta)}<p>Pierwsza rozmowa jest bezpłatna i trwa 60 minut.</p></div></div></section>
    <section class="section packageExperts"><div class="container"><p class="eyebrow">Z kim pracujesz</p><div class="miniExperts">${c.experts.items.map((expert, i) => `<article class="miniExpert">${expert.photo ? `<img src="${expert.photo}" alt="${e(expert.name)}" loading="lazy"/>` : '<span class="miniExpert__initials" aria-hidden="true">PM</span>'}<div class="miniExpert__copy"><div class="miniExpert__heading"><h3>${e(expert.name)}</h3>${ui.linkedin(expert, true)}</div><p class="eyebrow">${i ? "Executive coach" : "Mentor biznesowy, założyciel RelevateMe"}</p><p>${i ? "Od ponad 20 lat pracuje z liderami i firmami w momentach zmiany." : "Od 31 lat zarządza firmami i zespołami, w siedmiu branżach."}</p></div></article>`).join("")}</div><div class="packageExperts__footer"><p>${c.experts.lead}</p><a class="textLink" href="index.html#eksperci">Poznaj nasz zespół na stronie głównej ${ui.icon("arrow-right")}</a></div></div></section>
    <section class="section faqSection" id="faq-pakietu"><div class="container faqLayout"><div><p class="eyebrow">FAQ</p><h2>Najczęściej zadawane pytania o ${p.name}</h2></div><div>${ui.faq(p.faq)}<a class="textLink" href="index.html#faq">Wszystkie pytania na stronie głównej ${ui.icon("arrow-right")}</a></div></div></section>
    <section class="section packageConsultation" id="konsultacja"><div class="container packageConsultation__grid"><div><h2>${p.ctaHead}</h2><p>${p.ctaText}</p><div class="packageConsultation__other"><span>Nie masz pewności, czy to dla Ciebie?</span><a href="${p.next}.html">Zobacz ${window.packageContent[p.next].name} ${ui.icon("arrow-right")}</a><a href="index.html#pakiety">Porównaj wszystkie trzy ścieżki na stronie głównej ${ui.icon("arrow-right")}</a></div></div><form class="contactForm" id="contactForm">${ui.form(p.name)}</form></div></section>`;
  document.querySelector(".footer").innerHTML = ui.footer(true);
  ui.initMenus(true);
  const form = document.getElementById("contactForm");
  const consent = form.elements.privacyConsent;
  const button = form.querySelector("[data-contact-submit]");
  const status = form.querySelector(".formStatus");
  let sending = false;
  consent.addEventListener("change", () => { button.disabled = sending || !consent.checked; });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    if (window.SiteReferral?.submissionError()) { status.textContent = window.SiteReferral.submissionError(); return; }
    if (location.protocol === "file:") { status.textContent = c.contact.status.localOnly; return; }
    sending = true; button.disabled = true; status.textContent = c.contact.status.sending;
    window.SiteAnalytics?.track("form_submit_started", { form: "consultation" });
    const data = new FormData(form);
    try {
      const response = await fetch("send-form.php", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ type: "contact", name: data.get("name"), email: data.get("email"), message: `Prośba o bezpłatną konsultację. Pakiet: ${p.name}.`, consent: consent.checked, website: data.get("website"), ...window.SiteReferral?.formPayload() }) });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        const routingError = window.SiteReferral?.serverError(result.code);
        if (routingError) { status.textContent = routingError; window.SiteAnalytics?.track("form_submit_failed", { form: "consultation" }); return; }
        throw new Error("Form submission failed");
      }
      status.textContent = c.contact.status.success; form.reset();
      window.SiteAnalytics?.track("form_submit_succeeded", { form: "consultation" });
    } catch {
      status.textContent = c.contact.status.error;
      window.SiteAnalytics?.track("form_submit_failed", { form: "consultation" });
    }
    finally { sending = false; button.disabled = !consent.checked; }
  });
})();
