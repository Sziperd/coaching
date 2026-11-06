const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const configSource = fs.readFileSync(path.join(__dirname, "../referral-config.js"), "utf8");
const source = fs.readFileSync(path.join(__dirname, "../referral.js"), "utf8");
function load(query = "", pathname = "/index.html") {
  const window = {};
  // No cookie/storage APIs are provided: attribution must not depend on them.
  const context = vm.createContext({ window, location: new URL(`https://relevateme.pl${pathname}${query}`), URL,
    document: { readyState: "loading", addEventListener() {} } });
  vm.runInContext(configSource, context); vm.runInContext(source, context);
  return window.SiteReferral;
}
const plain = value => JSON.parse(JSON.stringify(value));

test("LinkedIn placements have distinct, allowlisted campaign properties", () => {
  for (const placement of ["featured", "about", "contact", "experience"]) {
    const api = load(`?from=linkedin-${placement}`);
    assert.deepEqual(plain(api.analyticsProperties()), {
      link_source: `linkedin-${placement}`, utm_source: "linkedin", utm_medium: "social", utm_content: placement, utm_campaign: "profile"
    });
    assert.equal(api.getContext().sourceId, `linkedin-${placement}`);
  }
});

test("short source aliases normalize to canonical source IDs", () => {
  assert.equal(load("?from=featured").getContext().sourceId, "linkedin-featured");
  assert.equal(load("?from=about").getContext().sourceId, "linkedin-about");
});

test("unknown, duplicate and personal source values are not captured", () => {
  for (const query of ["?from=secret@example.com", "?from=unknown", "?from=featured&from=about", "?from=__proto__", "?utm_source=private@example.com", "?from=%3Cscript%3E"]) {
    assert.deepEqual(plain(load(query).analyticsProperties()), {});
  }
});

test("mentor links select a public profile, not an email recipient", () => {
  const api = load("?mentor=milosz", "/kontakt.html");
  assert.equal(api.getMentor().name, "Miłosz Stawecki");
  assert.deepEqual(plain(api.formPayload()), { sourceId: "mentor-referral", mentor: "milosz-stawecki" });
  assert.equal(api.analyticsProperties().referral_mentor, "milosz-stawecki");
  assert.ok(!JSON.stringify(api.getMentor()).includes("@"));
});

test("source and mentor can be combined without overriding the LinkedIn placement", () => {
  const api = load("?mentor=paulina-mackiewicz&from=linkedin-about", "/kontakt.html");
  assert.equal(api.getContext().sourceId, "linkedin-about");
  assert.equal(api.getMentor().id, "paulina-mackiewicz");
});

test("malformed or unknown mentor links fail explicitly", () => {
  for (const query of ["?mentor=missing", "?mentor=", "?mentor=__proto__", "?mentor=private@example.com", "?mentor=milosz&mentor=paulina", "?mentor=milosz%0ABcc:attacker@example.com"]) {
    const api = load(query, "/kontakt.html");
    assert.equal(api.getMentor(), null); assert.equal(api.getContext().invalidMentor, true);
    assert.ok(api.submissionError()); assert.equal(api.formPayload().mentor, "");
  }
});

test("internal cross-page navigation carries attribution without browser storage", () => {
  const api = load("?from=linkedin-featured&mentor=milosz-stawecki");
  const decorated = new URL(api.decorateUrl("elevate.html#konsultacja"));
  assert.equal(decorated.searchParams.get("from"), "linkedin-featured");
  assert.equal(decorated.searchParams.get("mentor"), "milosz-stawecki");
  assert.equal(decorated.hash, "#konsultacja");
  assert.equal(api.decorateUrl("#kontakt"), "#kontakt");
});

test("external, executable, server endpoint and other-directory links remain untouched", () => {
  const api = load("?from=linkedin-featured&mentor=milosz");
  for (const value of ["https://other.example/kontakt.html", "mailto:kontakt@example.com", "javascript:alert(1)", "send-form.php", "/other/index.html"]) {
    assert.equal(api.decorateUrl(value), value);
  }
});

test("explicit attribution on a target URL takes precedence", () => {
  const api = load("?from=linkedin-featured&mentor=milosz");
  const target = new URL(api.decorateUrl("kontakt.html?mentor=paulina-mackiewicz&from=linkedin-contact"));
  assert.equal(target.searchParams.get("mentor"), "paulina-mackiewicz");
  assert.equal(target.searchParams.get("from"), "linkedin-contact");
});

test("subdirectory deployment preserves only pages within that directory", () => {
  const api = load("?from=linkedin-about", "/coaching/index.html");
  assert.equal(new URL(api.decorateUrl("navigate.html")).pathname, "/coaching/navigate.html");
  assert.equal(api.decorateUrl("/index.html"), "/index.html");
});

test("ordinary visits do not get synthetic referral tags", () => {
  const api = load();
  assert.deepEqual(plain(api.analyticsProperties()), {});
  assert.equal(api.decorateUrl("navigate.html"), "navigate.html");
  assert.equal(api.submissionError(), "");
});

test("all requested short links and bracket links are supported", () => {
  for (const placement of ["featured", "about", "contact", "experience", "dm"]) {
    for (const query of [`?from=${placement}`, `?from[${placement}]`]) {
      const api = load(query);
      assert.equal(api.analyticsProperties().utm_content, placement);
      assert.equal(api.analyticsProperties().utm_source, "linkedin");
      assert.equal(new URL(api.decorateUrl("navigate.html")).searchParams.get("from"), `linkedin-${placement}`);
    }
  }
});

test("dated posts retain their date across pages without accepting arbitrary labels", () => {
  for (const query of ["?from=post-2026-10-31", "?from[post-2026-10-31]"]) {
    const api = load(query);
    assert.equal(api.analyticsProperties().link_source, "post-2026-10-31");
    assert.equal(api.analyticsProperties().post_date, "2026-10-31");
    assert.equal(api.analyticsProperties().utm_content, "post");
    assert.equal(new URL(api.decorateUrl("kontakt.html")).searchParams.get("from"), "post-2026-10-31");
  }
  for (const query of ["?from=post-2026-02-30", "?from=post-2026-13-01", "?from=post-private", "?from[dm]&from[about]", "?from=about&from[dm]", "?from[dm]=secret@example.com"]) {
    assert.deepEqual(plain(load(query).analyticsProperties()), {});
  }
});
