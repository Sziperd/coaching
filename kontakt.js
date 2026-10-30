(() => {
  const ui = window.RelevateUI;
  const content = window.siteContent;
  const referral = window.SiteReferral;
  const mentor = referral.getMentor();
  const invalid = referral.submissionError();
  const expert = mentor ? content.experts.items[mentor.expertIndex] : null;
  document.title = mentor ? `Kontakt: ${mentor.name} | RelevateMe` : "Kontakt | RelevateMe";
  document.getElementById("siteHeader").innerHTML = ui.header(true);
  document.querySelector("main").innerHTML = `<section class="section directContact" id="konsultacja"><div class="container directContact__grid">
    <div><p class="eyebrow">Kontakt</p><h1>Umów bezpłatną konsultację.</h1><p>Pierwsza rozmowa trwa 60 minut i odbywa się online. Napisz, z czym przychodzisz. Odpowiemy w ciągu 24 godzin.</p>
      ${mentor ? `<div class="directContact__expert">${expert?.photo ? `<img src="${ui.escape(expert.photo)}" alt="${ui.escape(mentor.name)}" />` : `<span class="directContact__initials" aria-hidden="true">${ui.escape(mentor.name.split(" ").map(word => word[0]).join(""))}</span>`}<div><h2>${ui.escape(mentor.name)}</h2><p>${ui.escape(mentor.role)}</p></div></div><p>Twoje zapytanie trafi do wybranego eksperta.</p>` : `<p>Dobierzemy eksperta do Twojej sytuacji.</p>`}
      ${invalid ? `<p class="mentorContext mentorContext--error" role="alert">${ui.escape(invalid)}</p><a class="textLink" href="kontakt.html" data-referral-reset>Przejdź do kontaktu ogólnego ${ui.icon("arrow-right")}</a>` : ""}
      <a class="textLink" href="index.html#pakiety">Porównaj pakiety ${ui.icon("arrow-right")}</a>
    </div><form class="contactForm" id="contactForm">${ui.form()}</form></div></section>`;
  document.querySelector(".footer").innerHTML = ui.footer(true);
  ui.initMenus(true);
  const form = document.getElementById("contactForm");
  const label = document.createElement("label");
  label.innerHTML = 'WIADOMOŚĆ (OPCJONALNIE)<textarea name="message" rows="4" maxlength="5000" placeholder="Opowiedz krótko, z czym przychodzisz."></textarea>';
  form.querySelector(".contactConsent").before(label);
  const consent = form.elements.privacyConsent;
  const button = form.querySelector("[data-contact-submit]");
  const status = form.querySelector(".formStatus");
  let sending = false;
  const sync = () => { button.disabled = sending || !consent.checked || Boolean(invalid); };
  consent.addEventListener("change", sync); sync();
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (sending || invalid || !form.reportValidity()) return;
    if (location.protocol === "file:") { status.textContent = content.contact.status.localOnly; return; }
    sending = true; sync(); status.textContent = content.contact.status.sending;
    window.SiteAnalytics?.track("form_submit_started", { form: "consultation" });
    const data = new FormData(form);
    try {
      const response = await fetch("send-form.php", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({
        type: "contact", name: data.get("name"), email: data.get("email"),
        message: `Prośba o bezpłatną konsultację. Pakiet: ${data.get("package") || "Nie mam pewności"}.\n\n${String(data.get("message") || "").trim()}`.trim(),
        consent: consent.checked, website: data.get("website"), ...referral.formPayload()
      }) });
      const result = await response.json();
      if (!response.ok || !result.ok) { status.textContent = referral.serverError(result.code) || content.contact.status.error; throw new Error("submission_failed"); }
      status.textContent = content.contact.status.success; form.reset();
      window.SiteAnalytics?.track("form_submit_succeeded", { form: "consultation" });
    } catch {
      if (status.textContent === content.contact.status.sending) status.textContent = content.contact.status.error;
      window.SiteAnalytics?.track("form_submit_failed", { form: "consultation" });
    } finally { sending = false; sync(); }
  });
})();
