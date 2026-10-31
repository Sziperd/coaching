(() => {
  "use strict";
  const config = window.RELEVATEME_REFERRALS_CONFIG || {};
  const params = new URL(location.href).searchParams;
  const identifier = value => typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value);
  const owns = (object, key) => Object.hasOwn(object || {}, key);
  const unique = key => params.getAll(key).length === 1 ? params.get(key) : null;
  const rawSource = unique("from");
  const rawMentor = unique("mentor");
  const sourceKey = identifier(rawSource) && owns(config.sourceAliases, rawSource) ? config.sourceAliases[rawSource] : rawSource;
  const mentorKey = identifier(rawMentor) && owns(config.mentorAliases, rawMentor) ? config.mentorAliases[rawMentor] : rawMentor;
  const mentorId = identifier(mentorKey) && owns(config.mentors, mentorKey) ? mentorKey : "";
  const invalidMentor = params.has("mentor") && !mentorId;
  const sourceId = identifier(sourceKey) && owns(config.sources, sourceKey) ? sourceKey :
    !params.has("from") && mentorId ? "mentor-referral" : "";
  const mentor = mentorId ? Object.freeze({ id: mentorId, ...config.mentors[mentorId] }) : null;
  const pages = new Set(["index.html", "navigate.html", "elevate.html", "relevate.html", "kontakt.html"]);

  function analyticsProperties() {
    const result = {};
    const source = config.sources?.[sourceId];
    if (source) {
      result.link_source = sourceId;
      for (const [field, property] of Object.entries({ source: "utm_source", medium: "utm_medium", placement: "utm_content", campaign: "utm_campaign" })) {
        if (identifier(source[field])) result[property] = source[field];
      }
    }
    if (mentorId) result.referral_mentor = mentorId;
    return result;
  }
  function decorateUrl(value) {
    if (!value || value.startsWith("#") || (!sourceId && !mentorId)) return value;
    let url; try { url = new URL(value, location.href); } catch { return value; }
    const current = new URL(location.href);
    const directory = current.pathname.slice(0, current.pathname.lastIndexOf("/") + 1);
    const targetDirectory = url.pathname.slice(0, url.pathname.lastIndexOf("/") + 1);
    const filename = url.pathname.split("/").pop() || "index.html";
    if (url.origin !== current.origin || url.protocol !== current.protocol || directory !== targetDirectory || !pages.has(filename)) return value;
    // An explicit target attribution takes precedence over the current link context.
    if (sourceId && !url.searchParams.has("from")) url.searchParams.set("from", sourceId);
    if (mentorId && !url.searchParams.has("mentor")) url.searchParams.set("mentor", mentorId);
    return url.href;
  }
  function submissionError() {
    return invalidMentor ? "Ten link zawiera nieprawidłowy identyfikator mentora. Poproś o poprawny link lub skorzystaj z kontaktu ogólnego." : "";
  }
  function decorateLinks(root = document) {
    root.querySelectorAll("a[href]").forEach(anchor => {
      const value = anchor.getAttribute("href");
      const decorated = decorateUrl(value);
      if (decorated !== value) anchor.setAttribute("href", decorated);
    });
  }
  function prepareForms() {
    document.querySelectorAll("#contactForm").forEach(form => {
      if ((!mentor && !invalidMentor) || form.querySelector("[data-referral-mentor]")) return;
      const note = document.createElement("p");
      note.className = "mentorContext";
      note.dataset.referralMentor = "";
      note.textContent = mentor ? `Wybrany ekspert: ${mentor.name}` : submissionError();
      if (invalidMentor) { note.setAttribute("role", "alert"); note.classList.add("mentorContext--error"); }
      form.prepend(note);
    });
  }
  function init() {
    decorateLinks(); prepareForms();
    document.addEventListener("click", event => {
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      const decorated = decorateUrl(anchor.getAttribute("href"));
      if (decorated) anchor.setAttribute("href", decorated);
    }, true);
    if ("MutationObserver" in window) {
      new MutationObserver(() => { decorateLinks(); prepareForms(); }).observe(document.body, { childList: true, subtree: true });
    }
  }
  window.SiteReferral = Object.freeze({
    getContext: () => ({ sourceId, mentorId, invalidMentor }),
    getMentor: () => mentor,
    analyticsProperties, decorateUrl, submissionError,
    formPayload: () => ({ sourceId, mentor: mentorId }),
    serverError: code => code === "mentor_unavailable" ? "Kontakt z tym ekspertem jest chwilowo niedostępny. Napisz na kontakt@relevateme.pl lub spróbuj ponownie później." :
      code === "mentor_unknown" ? "Nie rozpoznaliśmy wybranego mentora. Poproś o poprawny link." : ""
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
