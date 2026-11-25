const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
const root = path.join(__dirname, "..");
let browser;
before(async () => {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
});
after(async () => { await browser?.close(); });

async function checkConsentPreview(form, selector) {
  const text = form.locator(selector);
  const toggle = form.locator("[data-consent-toggle]");
  const checkbox = form.locator(".consentPreview input");
  const isClipped = () => text.evaluate(el => el.scrollHeight > el.clientHeight);
  const waitForMotion = () => text.evaluate(el => Promise.allSettled(el.getAnimations().map(animation => animation.finished)));
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  assert.equal(await isClipped(), true);
  await toggle.press("Enter");
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await waitForMotion();
  assert.equal(await isClipped(), false);
  assert.equal(await checkbox.isChecked(), false);
  await toggle.press("Space");
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await waitForMotion();
  assert.equal(await isClipped(), true);
}

for (const width of [390, 1440]) {
  test(`${width}px: complete legal text and consent work on every form`, async () => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.route(/^https?:/, route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      for (const name of ["index", "navigate", "elevate", "relevate", "kontakt"]) {
        await page.goto(pathToFileURL(path.join(root, `${name}.html`)).href);
        const form = page.locator(".contactForm");
        await form.waitFor();
        const consent = form.locator(".contactConsent span");
        assert.equal(await consent.textContent(), await page.evaluate(() => window.RelevateLegal.consent));
        const bounds = await consent.boundingBox();
        assert(bounds.x >= 0 && bounds.x + bounds.width <= width, "Consent must fit the viewport");
        assert.equal(await consent.evaluate(el => el.scrollWidth <= el.clientWidth), true);
        await checkConsentPreview(form, ".contactConsent span");
        assert.equal(await form.locator("[data-contact-submit]").isDisabled(), true);
        await form.locator('input[name="name"]').fill("Test Testowy");
        await form.locator('input[name="email"]').fill("test@example.com");
        await form.locator('input[name="privacyConsent"]').check();
        assert.equal(await form.locator("[data-contact-submit]").isEnabled(), true);
        await form.locator(".consentDetails summary").click();
        assert.equal(await form.locator(".legalDocument > p").count(), 21);
        assert.match(await form.locator(".legalDocument").textContent(), /Stanisława Moniuszki 1A/);
        assert.equal(await page.locator('.footer a[href="regulamin.html"]').count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        if (name === "kontakt" && process.env.PLAYWRIGHT_ARTIFACT_DIR) {
          fs.mkdirSync(process.env.PLAYWRIGHT_ARTIFACT_DIR, { recursive: true });
          await form.screenshot({ path: path.join(process.env.PLAYWRIGHT_ARTIFACT_DIR, `consent-${width}.png`) });
        }
      }
      await page.goto(pathToFileURL(path.join(root, "index.html")).href + "#wspolpraca");
      const cooperation = page.locator("[data-cooperation-form]");
      await cooperation.waitFor({ state: "visible" });
      assert.equal(await cooperation.locator(".modalConsent span").textContent(), await page.evaluate(() => window.RelevateLegal.consent));
      await checkConsentPreview(cooperation, ".modalConsent span");
      await page.emulateMedia({ reducedMotion: "reduce" });
      const reduced = await cooperation.locator("[data-consent-toggle]").evaluate(button => {
        button.click();
        const copy = document.getElementById(button.getAttribute("aria-controls"));
        return { expanded: copy.scrollHeight === copy.clientHeight, animations: copy.getAnimations().length };
      });
      assert.deepEqual(reduced, { expanded: true, animations: 0 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await cooperation.locator(".consentDetails summary").click();
      assert.equal(await cooperation.locator(".legalDocument > p").count(), 21);
      await page.goto(pathToFileURL(path.join(root, "index.html")).href + "#prywatnosc");
      await page.reload();
      await page.locator(".modalPrivacy").waitFor({ state: "visible" });
      assert.equal(await page.locator(".modalPrivacy table tbody tr").count(), 3);
      assert.match(await page.locator(".modalPrivacy").textContent(), /PostHog/);
      for (const name of ["klauzula-informacyjna", "polityka-prywatnosci", "polityka-cookies", "regulamin"]) {
        await page.goto(pathToFileURL(path.join(root, `${name}.html`)).href);
        assert.equal(await page.locator("h1").count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        assert.equal(await page.locator(".legalLinks a[aria-current=page]").count(), 1);
        if (name === "polityka-prywatnosci" && process.env.PLAYWRIGHT_ARTIFACT_DIR) {
          await page.screenshot({ path: path.join(process.env.PLAYWRIGHT_ARTIFACT_DIR, `privacy-${width}.png`), fullPage: true });
        }
      }
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test("consent expands and reverses from its current height when toggled quickly", async () => {
  const page = await browser.newPage();
  try {
    await page.route(/^https?:/, route => route.abort());
    await page.goto(pathToFileURL(path.join(root, "kontakt.html")).href);
    const heights = await page.locator("[data-consent-toggle]").evaluate(button => {
      const copy = document.getElementById(button.getAttribute("aria-controls"));
      const height = () => copy.getBoundingClientRect().height;
      const closed = height();
      button.click();
      const expand = copy.getAnimations().find(animation => animation.effect.getKeyframes()[0].maxBlockSize);
      expand.currentTime = 120;
      const middle = height();
      button.click();
      return { closed, middle, reversed: height(), full: copy.scrollHeight };
    });
    assert(heights.closed < heights.middle && heights.middle < heights.full);
    assert(Math.abs(heights.middle - heights.reversed) < 1);
  } finally { await page.close(); }
});
