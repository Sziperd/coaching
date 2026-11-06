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
  let initialized = false, loaded = false, error = "";
  let pageCaptured = false, observers = [], timers = new Set();
  const pendingSections = new Map();
  let observedSections = new Set(), observedSlides = new Set(), depths = new Set();
  const startedForms = new WeakSet();

  function allowed() { return configured && config.mode === "cookieless" && !protectedBrowser(); }
  function replayAllowed() { return false; }
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
    if (!["$pageview", "$pageleave", ...Object.keys(events)].includes(event.event) || event.event === "analytics_consent_updated") return null;
    const properties = cleanProperties(event.event, event.properties);
    for (const [key, value] of Object.entries(event.properties || {})) {
      if (["token", "$lib", "$lib_version", "$insert_id", "$time"].includes(key)) properties[key] = value;
    }
    properties.distinct_id = "$posthog_cookieless";
    properties.$cookieless_mode = true;
    properties.$pathname = "/" + (page() === "home" ? "index" : page() === "contact" ? "kontakt" : page()) + ".html";
    properties.$current_url = location.origin + properties.$pathname;
    properties.$referrer = referrer();
    properties.$referring_domain = referrer() ? new URL(referrer()).hostname : "";
    properties.$geoip_disable = true;
    properties.$process_person_profile = false;
    properties.site_page = page();
    properties.site_environment = local ? "development" : "production";
    const attribution = window.SiteReferral?.analyticsProperties() || {};
    for (const key of ["link_source", "utm_source", "utm_medium", "utm_content", "utm_campaign", "referral_mentor", "post_date"]) {
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
  function initSdk() {
    if (!allowed()) return;
    if (initialized) {
      capturePage();
      return;
    }
    if (window.posthog) { error = "existing_sdk"; return; }
    // Official queue protocol; cookieless mode also requires the project setting.
    const sdk = [];
    sdk.people = [];
    sdk.toString = () => "posthog (stub)";
    sdk._i = []; sdk.__SV = 1;
    sdk.init = (token, options) => {
      for (const name of ["capture"]) {
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
      cookieless_mode: "always",
      persistence: "memory", disable_persistence: true, persistence_name: "relevateme_posthog",
      consent_persistence_name: "relevateme_posthog_consent",
      cross_subdomain_cookie: false, cookie_expiration: 180,
      opt_out_capturing_by_default: false, opt_out_persistence_by_default: true,
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
        if (!allowed()) return;
        capturePage();
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
        for (const key of Object.keys(storage)) if (key === storageKey || key.includes("relevateme_posthog")) storage.removeItem(key);
      } catch { /* Storage can be unavailable in private or restricted contexts. */ }
    }
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
  function init() {
    clearAnalyticsStorage();
    document.addEventListener("click", event => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[data-analytics-preferences]")) return;
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
      if (event.persisted && allowed()) { pageCaptured = false; initSdk(); startObservation(); }
    });
    if (allowed()) { initSdk(); startObservation(); }
  }
  window.SiteAnalytics = Object.freeze({
    track,
    getStatus: () => ({ configured, sdkLoaded: loaded, analytics: allowed(), replay: replayAllowed(), browserProtection: protectedBrowser(), error })
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
