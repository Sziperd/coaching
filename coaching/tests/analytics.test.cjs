const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../analytics.js"), "utf8");

class Target {
  constructor() { this.listeners = {}; }
  addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); }
  emit(name, event = {}) { for (const listener of this.listeners[name] || []) listener({ target: this, ...event }); }
}
class Element extends Target {
  constructor(tag = "div") {
    super(); this.tag = tag; this.fields = {}; this.children = []; this.dataset = {};
    this.attributes = {}; this.classList = { contains: () => false }; this.parentElement = null;
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] || null; }
  hasAttribute(name) { return name in this.attributes; }
  querySelector(selector) { return this.fields[selector] ||= new Element("control"); }
  querySelectorAll() { return []; }
  append(element) { this.children.push(element); }
  closest() { return null; }
  matches() { return false; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit("close"); }
  focus() {}
}
function storage(values = {}) {
  const result = { ...values };
  Object.defineProperties(result, {
    getItem: { value: key => result[key] ?? null },
    setItem: { value: (key, value) => { result[key] = String(value); } },
    removeItem: { value: key => { delete result[key]; } }
  });
  return result;
}
function environment(options = {}) {
  const observations = [];
  class Observer {
    constructor(callback) { this.callback = callback; this.elements = []; observations.push(this); }
    observe(element) { this.elements.push(element); }
    disconnect() { this.elements = []; }
  }
  const document = new Target();
  document.readyState = "loading"; document.visibilityState = "visible";
  document.head = new Element("head"); document.body = new Element("body");
  document.documentElement = { scrollHeight: 5000 };
  document.referrer = "https://search.example/path?email=private@example.com";
  document.activeElement = new Element("button");
  document.createElement = tag => new Element(tag);
  document.querySelectorAll = selector => selector === "main section" ? options.sections || [] : options.slides || [];
  const window = new Target();
  const localStorage = storage(options.storage);
  const sessionStorage = storage();
  let nextTimer = 0;
  const timers = new Map();
  const context = vm.createContext({
    window, document, Element, URL, Set, Map, WeakSet, Object, Date, JSON,
    localStorage, sessionStorage,
    location: new URL(options.url || "https://relevateme.pl/index.html?email=secret@example.com#private"),
    navigator: { doNotTrack: options.dnt, globalPrivacyControl: options.gpc },
    innerWidth: 390, innerHeight: 844, scrollY: 0,
    setTimeout: callback => { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout: timer => timers.delete(timer)
  });
  window.localStorage = localStorage; window.sessionStorage = sessionStorage;
  if (options.referral) window.SiteReferral = options.referral;
  if (options.page) document.body.dataset.page = options.page;
  if (options.observe) { window.IntersectionObserver = Observer; context.IntersectionObserver = Observer; }
  window.RELEVATEME_ANALYTICS_CONFIG = {
    enabled: true, projectToken: "phc_test_token", apiHost: "https://eu.i.posthog.com",
    allowedHosts: ["relevateme.pl"], allowLocalhost: false, sessionReplay: true,
    consentVersion: 1, consentMaxAgeDays: 180, ...options.config
  };
  vm.runInContext(source, context);
  document.emit("DOMContentLoaded");
  const dialog = document.body.children[0];
  const api = window.SiteAnalytics;
  const captures = [];
  const calls = [];
  function loadSdk() {
    const sdkOptions = window.posthog._i[0][1];
    const sdk = {
      capture: (event, properties = {}) => {
        const value = sdkOptions.before_send({ event, properties: { token: "phc_test_token", distinct_id: "random-id", ...properties } });
        if (value) captures.push(value);
      },
      opt_in_capturing: () => calls.push("opt_in"),
      opt_out_capturing: () => calls.push("opt_out"),
      startSessionRecording: () => calls.push("replay_start"),
      stopSessionRecording: () => calls.push("replay_stop"),
      set_config: value => calls.push(value)
    };
    window.posthog = sdk;
    sdkOptions.loaded(sdk);
    return sdkOptions;
  }
  const flushTimers = () => { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); };
  return { window, document, api, dialog, localStorage, sessionStorage, captures, calls, context, timers, observations, loadSdk, flushTimers };
}
function storedConsent(analytics, replay = false, extra = {}) {
  return { "relevateme.analytics-consent": JSON.stringify({ analytics, replay, version: 1, savedAt: Date.now(), ...extra }) };
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }

test("no vendor request or PostHog global before consent; events are not queued", () => {
  const env = environment();
  assert.equal(env.dialog.open, true);
  env.api.track("quiz_started");
  assert.equal(env.document.head.children.length, 0);
  assert.equal(env.window.posthog, undefined);
  assert.equal(env.api.getStatus().analytics, false);
  assert.deepEqual(Object.keys(env.localStorage), []);
});

test("rejection does not load SDK and clears only this integration's persistence", () => {
  const env = environment({ storage: { ph_relevateme_posthog: "old-id", unrelated: "keep" } });
  env.dialog.querySelector("[data-consent-reject]").emit("click");
  assert.equal(env.document.head.children.length, 0);
  assert.equal(env.api.getStatus().analytics, false);
  assert.equal(env.localStorage.ph_relevateme_posthog, undefined);
  assert.equal(env.localStorage.unrelated, "keep");
  assert.equal(JSON.parse(env.localStorage.getItem("relevateme.analytics-consent")).analytics, false);
});

test("analytics-only acceptance starts SDK with replay disabled and captures one sanitized pageview", () => {
  const env = environment();
  const analytics = env.dialog.querySelector('[name="analytics"]');
  analytics.checked = true; analytics.emit("change");
  env.dialog.querySelector("[data-consent-save]").emit("click");
  assert.equal(env.document.head.children.length, 1);
  assert.equal(env.document.head.children[0].src, "https://eu-assets.i.posthog.com/static/array.js");
  assert.equal(env.api.getStatus().sdkLoaded, false);
  const options = env.loadSdk();
  assert.equal(options.autocapture, false);
  assert.equal(options.person_profiles, "never");
  assert.equal(options.session_recording.maskAllInputs, true);
  assert.equal(options.session_recording.maskTextSelector, "*");
  assert.equal(options.session_recording.recordBody, false);
  assert.equal(options.session_recording.recordHeaders, false);
  assert.equal(env.api.getStatus().replay, false);
  assert.ok(!env.calls.includes("replay_start"));
  const pageviews = env.captures.filter(value => value.event === "$pageview");
  assert.equal(pageviews.length, 1);
  assert.equal(pageviews[0].properties.$current_url, "https://relevateme.pl/index.html");
  assert.equal(pageviews[0].properties.$referrer, "https://search.example");
  assert.equal(pageviews[0].properties.$geoip_disable, true);
  assert.equal(pageviews[0].properties.token, "phc_test_token");
  assert.equal(pageviews[0].properties.distinct_id, "random-id");
  assert.equal(options.before_send({ event: "$snapshot", properties: { $snapshot_data: [] } }), null);
});

test("explicit replay consent starts recording; withdrawal gates every capture and allows re-consent", () => {
  const env = environment();
  env.dialog.querySelector("[data-consent-all]").emit("click");
  const options = env.loadSdk();
  assert.equal(env.api.getStatus().replay, true);
  assert.ok(env.calls.includes("replay_start"));
  assert.ok(options.before_send({ event: "$snapshot", properties: { $snapshot_data: [] } }));
  env.api.openPreferences();
  env.dialog.querySelector("[data-consent-reject]").emit("click");
  const count = env.captures.length;
  env.api.track("quiz_started");
  assert.equal(env.captures.length, count);
  assert.equal(options.before_send({ event: "$pageview", properties: {} }), null);
  assert.ok(env.calls.includes("opt_out"));
  assert.equal(env.api.getStatus().replay, false);
  env.api.openPreferences(); env.dialog.querySelector("[data-consent-all]").emit("click");
  assert.equal(env.document.head.children.length, 1);
  assert.equal(env.api.getStatus().analytics, true);
  assert.equal(env.captures.filter(value => value.event === "$pageview").length, 2);
});

test("personal values, arbitrary events and URL query strings are rejected", () => {
  const env = environment({ storage: storedConsent(true, true) });
  const options = env.loadSdk();
  env.api.track("form_submit_succeeded", { form: "consultation", email: "secret@example.com", name: "Jane", message: "private" });
  const event = env.captures.at(-1);
  assert.equal(event.properties.form, "consultation");
  for (const key of ["email", "name", "message"]) assert.equal(event.properties[key], undefined);
  const filtered = options.before_send({ event: "quiz_step_answered", properties: { step: 2, answer: "private", $initial_current_url: "https://example.com/?secret=yes", $ip: "127.0.0.1", $set: { email: "private" } } });
  assert.equal(filtered.properties.step, 2);
  for (const key of ["answer", "$initial_current_url", "$ip", "$set"]) assert.equal(filtered.properties[key], undefined);
  assert.equal(options.before_send({ event: "$autocapture", properties: {} }), null);
  assert.equal(options.before_send({ event: "unknown", properties: {} }), null);
  const request = options.session_recording.maskCapturedNetworkRequestFn({ name: "https://relevateme.pl/?email=x#secret", requestBody: "private", responseBody: "private", requestHeaders: "private" });
  assert.equal(request.name, "https://relevateme.pl/");
  assert.equal(request.requestBody, undefined);
  assert.equal(request.responseBody, undefined);
  assert.equal(request.requestHeaders, undefined);
});

test("no token, wrong host, file URL, kill switch and invalid API host all fail closed", () => {
  for (const options of [
    { config: { projectToken: "" } }, { config: { enabled: false } },
    { config: { apiHost: "https://untrusted.example" } }, { url: "https://staging.example/index.html" },
    { url: "file:///tmp/index.html" }, { url: "http://localhost:4173/index.html" }
  ]) {
    const env = environment({ ...options, storage: storedConsent(true, true) });
    assert.equal(env.api.getStatus().configured, false);
    assert.equal(env.document.head.children.length, 0);
  }
});

test("DNT and GPC override stored or newly granted consent", () => {
  for (const options of [{ dnt: "1" }, { gpc: true }]) {
    const env = environment({ ...options, storage: storedConsent(true, true) });
    assert.equal(env.api.getStatus().analytics, false);
    env.api.openPreferences(); env.dialog.querySelector("[data-consent-all]").emit("click");
    assert.equal(env.document.head.children.length, 0);
    assert.equal(env.api.getStatus().replay, false);
  }
});

test("expired, future, malformed and old-version consent require a fresh choice", () => {
  for (const value of [
    storedConsent(true, true, { savedAt: Date.now() - 181 * 86400000 }),
    storedConsent(true, true, { savedAt: Date.now() + 100000 }),
    storedConsent(true, true, { version: 0 }),
    { "relevateme.analytics-consent": "broken" }
  ]) {
    const env = environment({ storage: value });
    assert.equal(env.dialog.open, true);
    assert.equal(env.document.head.children.length, 0);
  }
});

test("revocation in another tab stops recording and drops events", () => {
  const env = environment({ storage: storedConsent(true, true) });
  const options = env.loadSdk();
  env.localStorage.setItem("relevateme.analytics-consent", storedConsent(false)["relevateme.analytics-consent"]);
  env.window.emit("storage", { key: "relevateme.analytics-consent" });
  assert.equal(env.api.getStatus().analytics, false);
  assert.equal(options.before_send({ event: "$snapshot", properties: {} }), null);
  assert.ok(env.calls.includes("opt_out"));
});

test("revocation while SDK is downloading prevents a late loaded callback from collecting", () => {
  const env = environment();
  env.dialog.querySelector("[data-consent-all]").emit("click");
  env.api.openPreferences(); env.dialog.querySelector("[data-consent-reject]").emit("click");
  env.loadSdk();
  assert.equal(env.captures.length, 0);
  assert.ok(!env.calls.includes("replay_start"));
  assert.ok(env.calls.includes("opt_out"));
});

test("network failure remains non-fatal and exposes a diagnostic status", () => {
  const env = environment({ storage: storedConsent(true) });
  env.document.head.children[0].onerror();
  assert.equal(env.api.getStatus().error, "sdk_load_failed");
  assert.equal(env.api.getStatus().sdkLoaded, false);
  assert.deepEqual(plain(env.api.getStatus()).browserProtection, false);
});

test("visible sections and carousel cards are measured once, including the first F1 slide", () => {
  const section = new Element(); section.id = "historie";
  section.getBoundingClientRect = () => ({ top: 0, bottom: 500, height: 500 });
  const slide = new Element();
  slide.getBoundingClientRect = () => ({ left: 20, right: 350, width: 330, top: 40, bottom: 650, height: 610 });
  const group = new Element(); group.querySelectorAll = () => [slide];
  slide.closest = () => group;
  const env = environment({ storage: storedConsent(true), observe: true, sections: [section], slides: [slide] });
  assert.equal(env.observations.length, 0);
  env.loadSdk();
  const [sections, slides] = env.observations;
  sections.callback([{ isIntersecting: true, target: section }]); env.flushTimers();
  sections.callback([{ isIntersecting: true, target: section }]); env.flushTimers();
  slides.callback([{ isIntersecting: true, target: slide }]);
  slides.callback([{ isIntersecting: true, target: slide }]);
  const seen = env.captures.filter(value => value.event === "section_viewed");
  assert.equal(seen.length, 1); assert.equal(seen[0].properties.section, "historie");
  const cards = env.captures.filter(value => value.event === "carousel_slide_viewed");
  assert.equal(cards.length, 1); assert.equal(cards[0].properties.carousel, "formula");
  assert.equal(cards[0].properties.slide, 1);
});

test("invisible sections do not count and depth milestones are deduplicated", () => {
  const section = new Element(); section.id = "historie";
  section.getBoundingClientRect = () => ({ top: 900, bottom: 1400, height: 500 });
  const env = environment({ storage: storedConsent(true), observe: true, sections: [section] });
  env.loadSdk(); env.observations[0].callback([{ isIntersecting: true, target: section }]); env.flushTimers();
  assert.equal(env.captures.filter(value => value.event === "section_viewed").length, 0);
  env.context.scrollY = 3200;
  env.window.emit("scroll"); env.flushTimers(); env.window.emit("scroll"); env.flushTimers();
  assert.deepEqual(env.captures.filter(value => value.event === "scroll_depth_reached").map(value => value.properties.percent), [25, 50, 75]);
});

test("a form start contains no input value and is captured only once", () => {
  const env = environment({ storage: storedConsent(true) }); env.loadSdk();
  const form = new Element("form");
  const field = new Element("input"); field.value = "secret@example.com"; field.closest = () => form;
  env.document.emit("focusin", { target: field }); env.document.emit("focusin", { target: field });
  const started = env.captures.filter(value => value.event === "form_started");
  assert.equal(started.length, 1); assert.equal(started[0].properties.form, "consultation");
  assert.ok(!JSON.stringify(started).includes("secret@example.com"));
});

test("allowlisted referral attribution is attached to events but arbitrary properties are dropped", () => {
  const env = environment({ storage: storedConsent(true), page: "contact", referral: {
    getContext: () => ({ sourceId: "linkedin-featured", mentorId: "milosz-stawecki" }),
    analyticsProperties: () => ({ link_source: "linkedin-featured", utm_source: "linkedin", utm_content: "featured", referral_mentor: "milosz-stawecki", email: "private@example.com", utm_term: "private" })
  } });
  env.loadSdk(); env.api.track("form_started", { form: "consultation" });
  const event = env.captures.at(-1);
  assert.equal(event.properties.link_source, "linkedin-featured");
  assert.equal(event.properties.referral_mentor, "milosz-stawecki");
  assert.equal(event.properties.site_page, "contact");
  assert.equal(event.properties.email, undefined); assert.equal(event.properties.utm_term, undefined);
  assert.equal(env.captures.filter(value => value.event === "referral_landing").length, 1);
  assert.ok(!event.properties.$current_url.includes("?"));
});

test("referral events remain consent-gated", () => {
  const env = environment({ referral: {
    getContext: () => ({ sourceId: "linkedin-featured" }),
    analyticsProperties: () => ({ link_source: "linkedin-featured" })
  } });
  env.api.track("referral_landing");
  assert.equal(env.captures.length, 0); assert.equal(env.document.head.children.length, 0);
});
