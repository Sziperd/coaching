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
  for (const name of ["content.js", "package-content.js", "legal-content.js", "redesign-content.js", "redesign.js"]) load(context, name);
  return context;
}

test("homepage and package pages share the Polish package labels", () => {
  const { window } = environment();
  const kinds = ["coaching decyzyjny", "coaching biznesowo-życiowy", "mentoring biznesowo-życiowy"];
  for (const [i, key] of ["navigate", "elevate", "relevate"].entries()) {
    const pack = window.packageContent[key];
    assert.equal(pack.kind, kinds[i]);
    assert.equal(pack.label.toLowerCase(), kinds[i]);
    assert.equal(window.siteContent.packages.items[i].type.split(" | ")[1], kinds[i]);
    assert.equal(window.siteContent.stories.items[i].packageDetail, kinds[i]);
  }
  assert.equal(window.siteContent.footer.name, "RelevateMe");
  assert.equal(window.siteContent.signals.eyebrow, "Efekty współpracy");
  assert.equal(window.siteContent.formula.eyebrow, "Wsparcie z boksu");
  assert.equal(window.siteContent.formula.eyebrow, window.siteContent.formula.mobileSlides[0].eyebrow);
});

test("all seven signals show the matching before and after texts together", () => {
  const context = environment();
  function element() {
    return {
      children: [], attributes: {}, style: { setProperty() {} }, classList: { toggle() {} },
      append(...children) { this.children.push(...children); },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(type, handler) { this[type] = handler; }
    };
  }
  const index = element(), before = element(), after = element();
  context.document = {
    getElementById: () => ({
      querySelector: selector => ({
        ".signalsIndex": index, "[data-signals-before]": before, "[data-signals-after]": after
      })[selector]
    }),
    createElement: element
  };
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  vm.runInContext(script.slice(script.indexOf("function renderSignals("), script.indexOf("function renderStories(")), context);
  const { signals } = context.window.siteContent;
  context.renderSignals(signals);
  const buttons = index.children.slice(0, 7);
  const [previous, next] = index.children.slice(7);
  assert.equal(buttons.length, 7);
  assert.equal(previous.hidden, true);
  assert.equal(next.hidden, false);
  next.click();
  assert.equal(buttons[1].attributes["aria-pressed"], "true");
  assert.equal(previous.hidden, false);
  previous.click();
  assert.equal(buttons[0].attributes["aria-pressed"], "true");
  assert.equal(index.children[0].attributes["aria-pressed"], "true");
  buttons.forEach((button, i) => {
    assert.equal(button.textContent, String(i + 1).padStart(2, "0"));
    button.click();
    assert.deepEqual(index.children.filter(b => b.attributes["aria-pressed"] === "true"), [button]);
    for (const [column, copy] of [[before, signals.items], [after, signals.outcomes]]) {
      assert.equal(column.children[i].textContent, copy[i]);
      assert.deepEqual(column.children.filter(p => p.attributes["aria-hidden"] === "false"), [column.children[i]]);
    }
  });
  assert.equal(next.hidden, true);
  assert.equal(buttons[6].hidden, false);
  previous.click();
  assert.equal(buttons[5].attributes["aria-pressed"], "true");
});

test("mission copy and all three story illustrations are present locally", () => {
  const { window } = environment();
  assert.equal(window.siteContent.mission.length, 4);
  assert.match(window.siteContent.mission[1], /Miłosz Stawecki/);
  for (const item of window.siteContent.stories.items) {
    assert.match(item.photo, /^pictures\/story-.*\.jpg$/);
    assert.ok(fs.statSync(path.join(root, item.photo)).size > 0);
  }
  for (const file of ["signals-before.jpg", "signals-after.jpg", "consultation.jpg"]) {
    assert.ok(fs.statSync(path.join(root, "pictures", file)).size > 0);
  }
});

test("mentors without a LinkedIn URL do not get a placeholder control", () => {
  const { window } = environment();
  assert.equal(window.RelevateUI.linkedin(window.siteContent.experts.items[1], true), "");
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

test("footer keeps both mentors and links only to Miłosz's LinkedIn profile", () => {
  const { window } = environment();
  const markup = window.RelevateUI.footer();
  assert.equal((markup.match(/class="footer__mentor"/g) || []).length, 2);
  assert.equal((markup.match(/class="expertLinkedin linkedinIcon"/g) || []).length, 1);
  assert(markup.includes('href="https://pl.linkedin.com/in/mi%C5%82osz-stawecki-1a55a4198"'));
  assert.doesNotMatch(markup, /LinkedIn: Paulina/);
});

test("both mentors use their own initials while official photos are unavailable", () => {
  const { window } = environment();
  const { items } = window.siteContent.experts;
  assert(items.every(expert => !expert.photo));
  assert.deepEqual(Array.from(items, expert => window.RelevateUI.initials(expert.name)), ["MS", "PM"]);
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
    assert.deepEqual(Array.from(main.innerHTML.matchAll(/class="miniExpert__initials" aria-hidden="true">([A-Z]+)</g), match => match[1]), ["MS", "PM"]);
    assert.equal((main.innerHTML.match(/class="expertLinkedin linkedinIcon"/g) || []).length, 1);
    assert.doesNotMatch(main.innerHTML, /LinkedIn: Paulina/);
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
