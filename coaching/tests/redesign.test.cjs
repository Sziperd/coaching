const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
function load(context, name) {
  vm.runInContext(fs.readFileSync(path.join(root, name), "utf8"), context, { filename: name });
}
function environment() {
  const context = vm.createContext({ window: {}, Date });
  for (const name of ["content.js", "package-content.js", "redesign-content.js", "redesign.js"]) load(context, name);
  return context;
}

test("LinkedIn placeholders remain accessible buttons without invented destinations", () => {
  const { window } = environment();
  const markup = window.RelevateUI.linkedin({ name: "Miłosz Stawecki", linkedin: "" }, true);
  assert.match(markup, /<button/);
  assert.match(markup, /disabled/);
  assert.match(markup, /aria-label="LinkedIn: Miłosz Stawecki"/);
  assert.doesNotMatch(markup, /href=/);
});

test("LinkedIn links escape attributes and protect new tabs", () => {
  const { window } = environment();
  const markup = window.RelevateUI.linkedin({ name: 'Test "Name"', linkedin: "https://www.linkedin.com/in/test/" });
  assert.match(markup, /rel="noopener noreferrer"/);
  assert.match(markup, /Test &quot;Name&quot;/);
  assert.match(markup, /class="linkedinBrand"/);
  assert.match(markup, /fill="currentColor"/);
  assert.match(markup, /<span class="linkedinLabel">LinkedIn<\/span>/);
  assert.doesNotMatch(markup, /data-lucide="linkedin"/);
});

test("mobile navigation retains three menu strokes and a single consultation CTA", () => {
  const { window } = environment();
  const markup = window.RelevateUI.header();
  assert.match(markup, /aria-controls="drawer"><span><\/span><span><\/span><span><\/span>/);
  const drawer = markup.slice(markup.indexOf('class="drawer"'));
  assert.doesNotMatch(drawer, /data-open-quiz/);
  assert.equal((drawer.match(/class="btn btn--primary"/g) || []).length, 1);
});

test("compact expert introductions do not replace the full biographies", () => {
  const { window } = environment();
  for (const expert of window.siteContent.experts.items) {
    assert.ok(expert.shortBio.length > 80 && expert.shortBio.length < 180);
    assert.equal(expert.bio.length, 3);
  }
  assert.equal(window.siteContent.modals.cooperation.fields.namePlaceholder, "Imię i nazwisko");
});

test("footer renders a LinkedIn control beside each mentor", () => {
  const { window } = environment();
  const markup = window.RelevateUI.footer();
  assert.equal((markup.match(/class="footer__mentor"/g) || []).length, 2);
  assert.equal((markup.match(/class="expertLinkedin linkedinIcon"/g) || []).length, 2);
});

for (const key of ["navigate", "elevate", "relevate"]) {
  test(`${key} renders the shared package layout without losing form or FAQ controls`, () => {
    const context = environment();
    const styles = new Map();
    const main = {};
    const header = {};
    const footer = {};
    const status = {};
    const button = {};
    const consent = { addEventListener() {} };
    const form = {
      elements: { privacyConsent: consent },
      querySelector: selector => selector === "[data-contact-submit]" ? button : status,
      addEventListener() {}
    };
    context.document = {
      body: { dataset: { package: key }, style: { setProperty: (name, value) => styles.set(name, value) } },
      querySelector: selector => ({ main, ".footer": footer, 'meta[name="description"]': {} })[selector],
      getElementById: id => id === "siteHeader" ? header : form
    };
    context.window.RelevateUI.initMenus = () => {};
    load(context, "package-page.js");
    assert.match(main.innerHTML, /class="container faqLayout"/);
    assert.match(main.innerHTML, /class="packageExperts__footer"/);
    assert.equal((main.innerHTML.match(/class="expertLinkedin linkedinIcon"/g) || []).length, 2);
    assert.match(main.innerHTML, /name="privacyConsent"/);
    assert.match(main.innerHTML, /<form class="contactForm"/);
    assert.equal(styles.get("--package-on-color"), context.window.packageContent[key].onColor);
    if (key === "relevate") assert.equal(styles.get("--package-highlight"), "#8a6a35");
  });
}

test("cooperation copy and statistics retain the design's actual meaning", () => {
  const { window } = environment();
  assert.equal(window.siteContent.modals.cooperation.title, "Porozmawiajmy o współpracy");
  assert.equal(window.siteContent.modals.cooperation.fields.linkedin, "LinkedIn (opcjonalnie)");
  const maximumTeam = window.siteContent.experts.items[0].stats[3];
  assert.equal(maximumTeam.prefix, "do ");
  assert.equal(maximumTeam.suffix, " osób");
});

test("package disclosure keeps a faded preview separate from its complete accessible content", () => {
  const { window } = environment();
  for (const p of window.siteContent.packages.items) {
    const markup = window.RelevateUI.packageMore(p);
    assert.match(markup, /<details class="packageCard__more">/);
    assert.match(markup, /class="packageCard__preview" aria-hidden="true"/);
    assert.ok(markup.includes(`<p>${window.RelevateUI.escape(p.context)}</p>`));
    assert.ok(markup.includes(`<p>${window.RelevateUI.escape(p.result)}</p>`));
    assert.doesNotMatch(markup, /<details[^>]+\sopen/);
  }
  const markup = window.RelevateUI.packageMore({ context: '<img src=x>', focus: ['<tag>'], result: '& done' });
  assert.doesNotMatch(markup, /<img|<tag>/);
  assert.match(markup, /&lt;img src=x&gt;/);
});
