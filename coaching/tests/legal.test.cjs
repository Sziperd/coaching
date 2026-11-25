const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
function environment() {
  const context = vm.createContext({ window: {}, Date });
  for (const file of ["content.js", "package-content.js", "legal-content.js", "redesign-content.js", "redesign.js"]) {
    vm.runInContext(read(file), context, { filename: file });
  }
  return context.window;
}

test("all four static documents contain the full approved blocks, including the legal-bases table", () => {
  const { RelevateLegal: legal } = environment();
  for (const [key, count] of Object.entries({ notice: 22, privacy: 50, cookies: 20, terms: 52 })) {
    assert.equal(legal.docs[key].blocks.length, count);
    const page = read(legal.pages[key]);
    assert.equal(page.match(/<main class="legalDocument">\s*([\s\S]*?)\s*<\/main>/)[1], legal.render(key, { includeTitle: true }));
    assert.doesNotMatch(page, /DO UZUPEŁNIENIA|kontakt@twojadomena/);
    assert.match(page, /NIP: 6341408171, REGON: 387628336/);
    if (key !== "notice") assert.match(page, /01 września 2026 roku/);
  }
  assert.match(legal.render("privacy"), /<th scope="col">Podstawa prawna \(RODO\)<\/th>/);
  assert.match(legal.render("privacy"), /PostHog/);
  assert.match(legal.render("privacy"), /Cyber_Folks/);
});

test("every entry point loads the shared legal documents before the content overrides", () => {
  for (const name of ["index", "navigate", "elevate", "relevate", "kontakt"]) {
    const page = read(`${name}.html`);
    assert.match(page, /legal\.css\?v=legal-20261125-v1/);
    const legal = page.indexOf('src="legal-content.js');
    assert(legal > 0 && legal < page.indexOf('src="redesign-content.js'));
  }
});

test("consultation and cooperation checkboxes share the supplied complete consent", () => {
  const { siteContent: c, RelevateLegal: legal, RelevateUI: ui } = environment();
  assert.equal(c.contact.fields.consent, legal.consent);
  assert.equal(c.modals.cooperation.consent, legal.consent);
  assert.match(legal.consent, /^Wyrażam zgodę na skontaktowanie się ze mną/);
  assert.match(legal.consent, /ulica Rybnicka 10\/8, 40-038 Katowice/);
  assert.match(legal.consent, /w celu i zakresie niezbędnym .* bezpłatnej pierwszej konsultacji/);
  assert.match(legal.consent, /Oświadczam, że zapoznałem się z Klauzulą informacyjną RODO\.$/);
  assert.doesNotMatch(legal.consent, /google\.com|Akceptuję kontakt/);
  assert.match(ui.form(), /autocomplete="name"/);
  assert.match(ui.form(), /Wyrażam zgodę/);
  assert.match(ui.form(), /name="privacyConsent" required/);
  assert.match(ui.form(), /data-contact-submit disabled/);
});

test("full RODO notice is shown at the forms and every legal link resolves locally", () => {
  const { RelevateLegal: legal, RelevateUI: ui, siteContent: c } = environment();
  const notice = ui.privacy();
  assert(notice.includes(legal.render("notice")));
  assert.match(notice, /Stanisława Moniuszki 1A/);
  assert.match(notice, /prawo do cofnięcia tej zgody/);
  assert.equal(c.modals.privacy.document, "privacy");
  assert.equal(c.modals.privacy.sections, undefined);
  for (const key of Object.keys(legal.pages)) {
    for (const markup of [ui.footer(), ui.footer(true), legal.navigation(), notice]) {
      assert(markup.includes(`href="${legal.pages[key]}"`));
    }
    assert(fs.existsSync(path.join(root, legal.pages[key])));
  }
  assert.match(legal.render("privacy"), /href="polityka-cookies.html"/);
  assert.match(legal.render("terms"), /href="polityka-prywatnosci.html"/);
});
