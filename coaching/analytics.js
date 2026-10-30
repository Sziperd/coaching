(() => {
  "use strict";
  const config = window.RELEVATEME_ANALYTICS_CONFIG || {};
  const storageKey = "relevateme.analytics-consent";
  const packages = ["navigate", "elevate", "relevate"];
  const events = {
    section_viewed: ["section"], scroll_depth_reached: ["percent"],
    carousel_slide_viewed: ["carousel", "slide"], navigation_clicked: ["target", "placement"],
    consultation_cta_clicked: ["placement"], package_details_clicked: ["package", "placement"],
    contact_link_clicked: ["channel", "placement"], faq_opened: ["question", "placement"],
    form_started: ["form"], form_submit_started: ["form"],
    form_submit_succeeded: ["form"], form_submit_failed: ["form"],
    quiz_started: [], quiz_step_answered: ["step"], quiz_completed: ["questions"],
    analytics_consent_updated: ["analytics", "replay", "notice_version"],
    referral_landing: []
  };
  const safeSdkKeys = new Set([
    "token", "distinct_id", "$device_id", "$session_id", "$window_id", "$insert_id", "$time",
    "$lib", "$lib_version", "$browser", "$browser_version", "$os", "$os_version",
    "$device_type", "$screen_height", "$screen_width", "$viewport_height", "$viewport_width",
    "$session_entry_timestamp", "$session_entry_pathname", "$session_entry_host", "$host",
    "$pageview_id", "$prev_pageview_id", "$prev_pageview_duration", "$prev_pageview_last_scroll",
    "$prev_pageview_last_scroll_percentage", "$prev_pageview_max_scroll", "$prev_pageview_max_scroll_percentage",
    "$prev_pageview_last_content", "$prev_pageview_last_content_percentage", "$prev_pageview_max_content",
    "$prev_pageview_max_content_percentage", "$is_identified", "$config_defaults",
    "$sdk_debug_replay_internal_buffer_length", "$snapshot_bytes", "$snapshot_data", "$snapshot_source"
  ]);
  const knownSections = new Set([
    "home", "sygnaly", "historie", "pakiety", "kazdy-pakiet", "jak-zaczynamy",
    "eksperci", "o-nas", "formula", "kontakt", "faq", "top", "konsultacja", "faq-pakietu",
    "packageAudience", "sessionsSection", "packageChanges", "packageExperts"
  ]);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const protectedBrowser = () => navigator.globalPrivacyControl === true ||
    [navigator.doNotTrack, window.doNotTrack].some(value => value === "1" || value === "yes");
  const hostAllowed = (config.allowedHosts || []).includes(location.hostname) || (local && config.allowLocalhost === true);
  const configured = config.enabled === true && /^phc_[a-zA-Z0-9_-]+$/.test(config.projectToken || "") &&
    ["https://eu.i.posthog.com", "https://us.i.posthog.com"].includes(config.apiHost) &&
    /^https?:$/.test(location.protocol) && hostAllowed;
  let consent = readConsent();
  let initialized = false, loaded = false, error = "", dialog, returnFocus;
  let pageCaptured = false, observers = [], timers = new Set();
  const pendingSections = new Map();
  let observedSections = new Set(), observedSlides = new Set(), depths = new Set();
  const startedForms = new WeakSet();

  function readConsent() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey));
      if (value?.version !== config.consentVersion || !Number.isFinite(value.savedAt) ||
          value.savedAt > Date.now() || Date.now() - value.savedAt > (config.consentMaxAgeDays || 180) * 86400000) return null;
      if (typeof value.analytics !== "boolean" || typeof value.replay !== "boolean") return null;
      return { ...value, replay: value.analytics && value.replay };
    } catch { return null; }
  }
  function allowed() { return configured && consent?.analytics === true && !protectedBrowser(); }
  function replayAllowed() { return allowed() && config.sessionReplay === true && consent?.replay === true; }
  function page() { return document.body?.dataset.page === "contact" ? "contact" : packages.includes(document.body?.dataset.package) ? document.body.dataset.package : "home"; }
  function cleanUrl(value) {
    try { const url = new URL(value, location.href); return url.origin + url.pathname; }
    catch { return ""; }
  }
  function referrer() {
    try { return document.referrer ? new URL(document.referrer).origin : ""; }
    catch { return ""; }
  }
  function cleanProperties(name, properties = {}) {
    const result = {};
    for (const key of events[name] || []) {
      const value = properties[key];
      if (typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) result[key] = value;
      // Property values are identifiers, never element text, field values or arbitrary URLs.
      else if (typeof value === "string" && /^[a-z0-9_:-]{1,64}$/.test(value)) result[key] = value;
    }
    return result;
  }
  function beforeSend(event) {
    if (!event || !allowed()) return null;
    const snapshot = event.event === "$snapshot";
    if (snapshot && !replayAllowed()) return null;
    if (!snapshot && !["$pageview", "$pageleave", ...Object.keys(events)].includes(event.event)) return null;
    const properties = cleanProperties(event.event, event.properties);
    for (const [key, value] of Object.entries(event.properties || {})) {
      if (safeSdkKeys.has(key)) properties[key] = value;
    }
    properties.$current_url = cleanUrl(location.href);
    properties.$pathname = location.pathname;
    properties.$referrer = referrer();
    properties.$referring_domain = referrer() ? new URL(referrer()).hostname : "";
    properties.$geoip_disable = true;
    properties.$process_person_profile = false;
    properties.site_page = page();
    properties.site_environment = local ? "development" : "production";
    const attribution = window.SiteReferral?.analyticsProperties() || {};
    for (const key of ["link_source", "utm_source", "utm_medium", "utm_content", "utm_campaign", "referral_mentor"]) {
      if (typeof attribution[key] === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(attribution[key])) properties[key] = attribution[key];
    }
    event.properties = properties;
    return event;
  }
  function track(name, properties = {}) {
    if (!allowed() || !loaded || !Object.hasOwn(events, name)) return;
    window.posthog.capture(name, cleanProperties(name, properties));
  }
  function capturePage() {
    if (pageCaptured || !loaded || !allowed()) return;
    pageCaptured = true;
    window.posthog.capture("$pageview");
    const referral = window.SiteReferral?.getContext();
    if (referral?.sourceId || referral?.mentorId) track("referral_landing");
  }
  function syncReplay() {
    if (!loaded) return;
    window.posthog.set_config({ disable_session_recording: !replayAllowed() });
    if (replayAllowed()) window.posthog.startSessionRecording();
    else window.posthog.stopSessionRecording();
  }
  function initSdk() {
    if (!allowed()) return;
    if (initialized) {
      if (loaded) { window.posthog.opt_in_capturing({ captureEventName: false }); syncReplay(); }
      capturePage();
      return;
    }
    if (window.posthog) { error = "existing_sdk"; return; }
    // Official array.js queue protocol; the vendor SDK is requested only after consent.
    const sdk = [];
    sdk.people = [];
    sdk.toString = () => "posthog (stub)";
    sdk._i = []; sdk.__SV = 1;
    sdk.init = (token, options) => {
      for (const name of ["capture", "opt_in_capturing", "opt_out_capturing", "set_config", "startSessionRecording", "stopSessionRecording"]) {
        sdk[name] = (...args) => sdk.push([name, ...args]);
      }
      sdk._i.push([token, options, "posthog"]);
    };
    window.posthog = sdk;
    initialized = true;
    sdk.init(config.projectToken, {
      api_host: config.apiHost,
      ui_host: config.apiHost === "https://eu.i.posthog.com" ? "https://eu.posthog.com" : "https://us.posthog.com",
      defaults: "2026-08-30",
      autocapture: false, capture_pageview: false, capture_pageleave: false,
      capture_heatmaps: false, capture_dead_clicks: false, rageclick: false,
      capture_performance: false, capture_exceptions: false,
      disable_surveys: true, enable_recording_console_log: false,
      disable_conversations: true, disable_product_tours: true, disable_web_experiments: true,
      advanced_disable_feature_flags: true, feature_flag_refresh_interval_ms: 0,
      save_campaign_params: false, save_referrer: false,
      person_profiles: "never", respect_dnt: true, ip: false,
      internal_or_test_user_hostname: null, capture_webmcp: false, opt_in_site_apps: false,
      disable_capture_url_hashes: true,
      persistence: "localStorage", persistence_name: "relevateme_posthog",
      consent_persistence_name: "relevateme_posthog_consent",
      cross_subdomain_cookie: false, cookie_expiration: 180,
      opt_out_capturing_by_default: true, opt_out_persistence_by_default: true,
      disable_session_recording: true,
      session_recording: {
        maskAllInputs: true, maskTextSelector: "*",
        blockSelector: "form, .quizWidget, .siteModal, [data-analytics-private], .analyticsConsent",
        recordBody: false, recordHeaders: false, recordCrossOriginIframes: false,
        recordCanvas: false, captureJsonLd: false,
        maskCapturedNetworkRequestFn: request => ({ ...request, name: cleanUrl(request.name), requestBody: undefined, responseBody: undefined, requestHeaders: undefined, responseHeaders: undefined })
      },
      before_send: beforeSend,
      loaded: instance => {
        loaded = true;
        if (!allowed()) { instance.stopSessionRecording(); instance.opt_out_capturing(); return; }
        instance.opt_in_capturing({ captureEventName: false });
        syncReplay();
        capturePage();
        track("analytics_consent_updated", { analytics: true, replay: replayAllowed(), notice_version: config.consentVersion });
        startObservation();
      }
    });
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = config.apiHost.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
    script.onerror = () => { error = "sdk_load_failed"; };
    document.head.append(script);
  }
  function stopObservation() {
    observers.forEach(observer => observer.disconnect()); observers = [];
    timers.forEach(timer => clearTimeout(timer)); timers.clear();
    pendingSections.clear();
  }
  function clearAnalyticsStorage() {
    for (const name of ["localStorage", "sessionStorage"]) {
      try {
        const storage = window[name];
        for (const key of Object.keys(storage)) if (key.includes("relevateme_posthog")) storage.removeItem(key);
      } catch { /* Storage can be unavailable in private or restricted contexts. */ }
    }
  }
  function setConsent(analytics, replay) {
    const previous = allowed();
    consent = { version: config.consentVersion, savedAt: Date.now(), analytics: Boolean(analytics) && !protectedBrowser(), replay: Boolean(analytics && replay && config.sessionReplay) && !protectedBrowser() };
    try { localStorage.setItem(storageKey, JSON.stringify(consent)); } catch { /* Keep this visit's choice in memory. */ }
    if (allowed()) {
      initSdk();
      if (!previous) startObservation();
      track("analytics_consent_updated", { analytics: true, replay: consent.replay, notice_version: config.consentVersion });
    } else {
      stopObservation(); pageCaptured = false;
      observedSections.clear(); observedSlides.clear(); depths.clear();
      if (initialized) {
        window.posthog.stopSessionRecording();
        window.posthog.opt_out_capturing({ clear_persistence: true });
      }
      clearAnalyticsStorage();
    }
    dialog?.close();
  }
  function placement(element) {
    if (element.closest("header, .drawer")) return "header";
    if (element.closest(".footer")) return "footer";
    const section = element.closest("section");
    if (knownSections.has(section?.id)) return section.id;
    for (const key of ["packageHero", "packageChanges", "packageExperts", "packageConsultation"]) if (section?.classList.contains(key)) return key.toLowerCase();
    return "content";
  }
  function formName(form) { return form?.matches("[data-cooperation-form]") ? "cooperation" : "consultation"; }
  function startObservation() {
    stopObservation();
    if (!allowed() || !loaded || !("IntersectionObserver" in window)) return;
    const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      const section = entry.target.dataset.analyticsSection || entry.target.id;
      if (!entry.isIntersecting) {
        const pending = pendingSections.get(section);
        clearTimeout(pending); timers.delete(pending); pendingSections.delete(section);
        return;
      }
      if (observedSections.has(section) || pendingSections.has(section)) return;
      const timer = setTimeout(() => {
        timers.delete(timer);
        pendingSections.delete(section);
        const rect = entry.target.getBoundingClientRect();
        const visible = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
        if (!allowed() || document.visibilityState !== "visible" || visible < Math.min(180, rect.height * 0.5)) return;
        observedSections.add(section); track("section_viewed", { section: section.toLowerCase() });
      }, 1000);
      timers.add(timer);
      pendingSections.set(section, timer);
    }), { threshold: [0, 0.1, 0.25, 0.5] });
    document.querySelectorAll("main section").forEach(section => {
      let key = section.id;
      if (!key) key = [...knownSections].find(name => section.classList.contains(name));
      if (knownSections.has(key)) { section.dataset.analyticsSection = key; sectionObserver.observe(section); }
    });
    const slideObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || !allowed() || document.visibilityState !== "visible") return;
      const element = entry.target;
      const rect = element.getBoundingClientRect();
      const visibleWidth = Math.min(rect.right, innerWidth) - Math.max(rect.left, 0);
      const visibleHeight = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
      if (visibleWidth < rect.width * 0.6 || visibleHeight < Math.min(180, rect.height * 0.5)) return;
      const group = element.closest("[data-stories-grid], [data-packages-grid], [data-experts-track], [data-formula-mobile-track]");
      if (!group) return;
      const carousel = group.hasAttribute("data-stories-grid") ? "stories" : group.hasAttribute("data-packages-grid") ? "packages" : group.hasAttribute("data-experts-track") ? "experts" : "formula";
      const slide = [...group.querySelectorAll("[data-story-card], .packagePath, .expertSlide, .formulaMobileSlide")].indexOf(element) + 1;
      const key = `${carousel}:${slide}`;
      if (!observedSlides.has(key)) { observedSlides.add(key); track("carousel_slide_viewed", { carousel, slide }); }
    }), { threshold: [0, 0.1, 0.25, 0.55, 0.8] });
    document.querySelectorAll("[data-story-card], .packagePath, .expertSlide, .formulaMobileSlide").forEach(el => slideObserver.observe(el));
    observers.push(sectionObserver, slideObserver);
  }
  function buildConsentDialog() {
    dialog = document.createElement("dialog");
    dialog.className = "analyticsConsent ph-no-capture";
    dialog.setAttribute("aria-labelledby", "analyticsConsentTitle");
    dialog.innerHTML = `<h2 id="analyticsConsentTitle">Twoja prywatność</h2>
      <p>Za Twoją zgodą korzystamy z PostHog, żeby sprawdzać, które części strony są pomocne i gdzie pojawiają się trudności.</p>
      <label class="analyticsConsent__option"><input type="checkbox" name="analytics"><span><strong>Statystyki korzystania ze strony</strong><small>Odsłony, przewijanie i kliknięcia. Bez danych wpisanych do formularzy i bez odpowiedzi ankiety.</small></span></label>
      <label class="analyticsConsent__option"><input type="checkbox" name="replay"><span><strong>Odtwarzanie wizyt</strong><small>Przewijanie i ruchy kursora. Teksty są maskowane, a formularze i ankieta wyłączone z nagrania.</small></span></label>
      <p class="analyticsConsent__note" role="status"></p>
      <p class="analyticsConsent__legal">Wybór jest dobrowolny. Możesz go zmienić w stopce przez „Ustawienia prywatności”.</p>
      <details class="analyticsConsent__policy"><summary>Polityka prywatności</summary><div></div></details>
      <div class="analyticsConsent__actions"><button type="button" data-consent-reject>Odrzuć opcjonalne</button><button type="button" data-consent-save>Zapisz wybór</button><button type="button" data-consent-all>Zaakceptuj wszystkie</button></div>`;
    const policy = dialog.querySelector(".analyticsConsent__policy div");
    for (const section of window.siteContent?.modals?.privacy?.sections || []) {
      const heading = document.createElement("h3"); heading.textContent = section.title;
      const paragraph = document.createElement("p"); paragraph.textContent = section.text;
      policy.append(heading); policy.append(paragraph);
    }
    document.body.append(dialog);
    const analytics = dialog.querySelector('[name="analytics"]');
    const replay = dialog.querySelector('[name="replay"]');
    analytics.addEventListener("change", () => { if (!analytics.checked) replay.checked = false; replay.disabled = !analytics.checked || !config.sessionReplay; });
    dialog.querySelector("[data-consent-reject]").addEventListener("click", () => setConsent(false, false));
    dialog.querySelector("[data-consent-save]").addEventListener("click", () => setConsent(analytics.checked, replay.checked));
    dialog.querySelector("[data-consent-all]").addEventListener("click", () => setConsent(true, true));
    dialog.addEventListener("cancel", event => { event.preventDefault(); setConsent(false, false); });
    dialog.addEventListener("close", () => returnFocus?.focus({ preventScroll: true }));
  }
  function openPreferences() {
    if (!dialog) return;
    returnFocus = document.activeElement;
    const analytics = dialog.querySelector('[name="analytics"]');
    const replay = dialog.querySelector('[name="replay"]');
    analytics.checked = allowed(); analytics.disabled = !configured || protectedBrowser();
    replay.checked = replayAllowed(); replay.disabled = !allowed() || !config.sessionReplay;
    dialog.querySelector("[data-consent-all]").disabled = !configured || protectedBrowser();
    dialog.querySelector(".analyticsConsent__note").textContent = !configured ? "Analityka nie jest aktywna na tym adresie. Żadne dane nie są wysyłane do PostHog." : protectedBrowser() ? "Respektujemy ustawienie Do Not Track / Global Privacy Control Twojej przeglądarki. Analityka i nagrywanie są wyłączone." : "Dane analityczne są łączone z losowym identyfikatorem przeglądarki, zapisywanym dopiero po zgodzie.";
    dialog.showModal();
  }
  function init() {
    if (!allowed()) clearAnalyticsStorage();
    buildConsentDialog();
    document.addEventListener("click", event => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[data-analytics-preferences]")) { openPreferences(); return; }
      const summary = event.target.closest(".faqList summary");
      if (summary && !summary.parentElement.open) {
        const item = summary.parentElement;
        track("faq_opened", { question: [...item.parentElement.children].indexOf(item) + 1, placement: placement(item) });
      }
      const anchor = event.target.closest("a[href]");
      if (!anchor || anchor.closest(".analyticsConsent")) return;
      const source = placement(anchor);
      const raw = anchor.getAttribute("href");
      if (/^(mailto:|tel:)/.test(raw)) { track("contact_link_clicked", { channel: raw.startsWith("mailto:") ? "email" : "phone", placement: source }); return; }
      let url; try { url = new URL(raw, location.href); } catch { return; }
      if (url.origin !== location.origin) return;
      if (["#kontakt", "#konsultacja"].includes(url.hash)) track("consultation_cta_clicked", { placement: source });
      const tier = url.pathname.split("/").pop().replace(/\.html$/, "");
      if (packages.includes(tier)) track("package_details_clicked", { package: tier, placement: source });
      const target = knownSections.has(url.hash.slice(1)) ? url.hash.slice(1) : packages.includes(tier) ? tier : null;
      if (target) track("navigation_clicked", { target, placement: source });
    });
    document.addEventListener("focusin", event => {
      const form = event.target.closest?.("#contactForm, [data-cooperation-form]");
      if (!allowed() || !loaded || !form || startedForms.has(form)) return;
      startedForms.add(form); track("form_started", { form: formName(form) });
    });
    let scrollTimer;
    window.addEventListener("scroll", () => {
      clearTimeout(scrollTimer);
      if (!allowed() || !loaded) return;
      scrollTimer = setTimeout(() => {
        const height = document.documentElement.scrollHeight;
        const percent = height > innerHeight ? Math.min(100, (scrollY + innerHeight) / height * 100) : 100;
        [25, 50, 75, 90].forEach(depth => { if (percent >= depth && !depths.has(depth)) { depths.add(depth); track("scroll_depth_reached", { percent: depth }); } });
      }, 200);
    }, { passive: true });
    window.addEventListener("pagehide", () => { if (allowed() && loaded) window.posthog.capture("$pageleave"); });
    window.addEventListener("pageshow", event => {
      if (!event.persisted) return;
      consent = readConsent(); pageCaptured = false;
      if (allowed()) { initSdk(); startObservation(); }
      else { stopObservation(); if (loaded) { window.posthog.stopSessionRecording(); window.posthog.opt_out_capturing({ clear_persistence: true }); } }
    });
    window.addEventListener("storage", event => {
      if (event.key !== storageKey && event.key !== null) return;
      consent = readConsent();
      if (allowed()) { initSdk(); startObservation(); }
      else { stopObservation(); pageCaptured = false; if (initialized) { window.posthog.stopSessionRecording(); window.posthog.opt_out_capturing({ clear_persistence: true }); } clearAnalyticsStorage(); }
    });
    if (allowed()) { initSdk(); startObservation(); }
    else if (configured && !consent && !protectedBrowser()) openPreferences();
  }
  window.SiteAnalytics = Object.freeze({
    track, openPreferences,
    getStatus: () => ({ configured, sdkLoaded: loaded, analytics: allowed(), replay: replayAllowed(), browserProtection: protectedBrowser(), error })
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
