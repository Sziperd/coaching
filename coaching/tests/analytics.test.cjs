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
    mode: "cookieless", ...options.config
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


test("cookieless starts without popup or storage writes", () => {
 const e=environment(); assert.equal(e.document.body.children.length,0);
 assert.equal(e.document.head.children.length,1);
 const o=e.loadSdk(); assert.equal(o.cookieless_mode,"always");
 assert.equal(o.disable_persistence,true); assert.equal(o.persistence,"memory");
 assert.equal(o.disable_session_recording,true); assert.equal(o.person_profiles,"never");
 assert.equal(e.captures.filter(x=>x.event==="$pageview").length,1);
 assert.deepEqual(Object.keys(e.localStorage),[]); assert.deepEqual(Object.keys(e.sessionStorage),[]);
 assert.ok(!e.calls.includes("opt_in")); assert.ok(!e.calls.includes("replay_start"));
});
test("events exclude identity, arbitrary properties, URLs and replay",()=>{
 const e=environment(); const o=e.loadSdk();
 const event=o.before_send({event:"form_started",properties:{form:"consultation",distinct_id:"old-id",$device_id:"device",$session_id:"session",email:"secret@example.com",$snapshot_data:"secret"}});
 assert.equal(event.properties.distinct_id,"$posthog_cookieless");
 assert.equal(event.properties.$cookieless_mode,true);
 for(const k of ["$device_id","$session_id","email","$snapshot_data"])assert.equal(event.properties[k],undefined);
 assert.equal(event.properties.$current_url,"https://relevateme.pl/index.html");
 assert.equal(o.before_send({event:"$snapshot",properties:{}}),null);
 assert.equal(o.before_send({event:"$identify",properties:{}}),null);
 assert.equal(o.before_send({event:"analytics_consent_updated",properties:{}}),null);
});
test("invalid configuration and browser privacy signals fail closed",()=>{
 for(const options of [{dnt:"1"},{gpc:true},{config:{enabled:false}},{config:{projectToken:""}},{config:{mode:"other"}},{config:{apiHost:"https://untrusted.example"}},{url:"file:///tmp/index.html"},{url:"https://staging.example/"},{url:"http://localhost:4173/"}]){
 const e=environment(options);assert.equal(e.document.head.children.length,0);assert.equal(e.document.body.children.length,0);
 }
});
test("legacy identifiers are removed without touching unrelated storage",()=>{
 const e=environment({storage:{"ph_relevateme_posthog":"old","unrelated":"keep"}});
 assert.equal(e.localStorage.getItem("ph_relevateme_posthog"),null);assert.equal(e.localStorage.getItem("unrelated"),"keep");
});
test("known referral labels remain available for aggregate breakdowns",()=>{
 const e=environment({referral:{getContext:()=>({sourceId:"linkedin-featured"}),analyticsProperties:()=>({link_source:"linkedin-featured",email:"private@example.com"})}});
 e.loadSdk();assert.equal(e.captures[0].properties.link_source,"linkedin-featured");assert.equal(e.captures[0].properties.email,undefined);
});
test("SDK failure is nonfatal",()=>{const e=environment();e.document.head.children[0].onerror();assert.equal(e.api.getStatus().error,"sdk_load_failed");});
