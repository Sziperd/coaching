/* Run against the local preview with the same Playwright environment as expert-progress.browser.cjs. */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { chromium, webkit } = require("playwright");

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8000/";
const engine = process.env.PLAYWRIGHT_BROWSER || "chromium";
let browser;
before(async () => {
  browser = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    ...(engine === "chromium" && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {})
  });
});
after(async () => { await browser?.close(); });

async function openContext(width) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } });
  await context.route("**/*", route => new URL(route.request().url()).origin === new URL(baseURL).origin
    ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  return { context, page, errors };
}

const active = page => page.locator("#eksperci .expertsDot.is-active").getAttribute("data-expert-dot");

for (const width of [681, 1440]) {
  test(`${engine}, ${width}px: desktop experts wait for manual navigation`, async () => {
    const { context, page, errors } = await openContext(width);
    try {
      await page.goto(baseURL, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: ".quizWidget{visibility:hidden!important}" });
      await page.locator("#eksperci").scrollIntoViewIfNeeded();
      const initial = await active(page);
      const track = page.locator("[data-experts-track]");
      const initialScroll = await track.evaluate(element => element.scrollLeft);
      await page.waitForTimeout(8500);
      assert.equal(await active(page), initial);
      assert.equal(await track.evaluate(element => element.scrollLeft), initialScroll);
      assert.equal(await page.locator("#eksperci .expertsDot.is-loading").count(), 0);
      assert.equal(await page.locator("#eksperci .expertsDot.is-active span")
        .evaluate(element => getComputedStyle(element).animationName), "none");

      await page.locator(".carouselControls button").last().click();
      await page.waitForTimeout(800);
      assert.notEqual(await active(page), initial);
      const next = await active(page);
      await page.waitForTimeout(8500);
      assert.equal(await active(page), next, "A manually selected expert must stay selected");
      await page.locator("#eksperci [data-expert-dot]").nth(Number(initial)).click();
      await page.waitForTimeout(800);
      assert.equal(await active(page), initial, "Dots must still select experts manually");
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test(`${engine}: resizing stops desktop autoplay and restores mobile autoplay`, async () => {
  const { context, page, errors } = await openContext(390);
  try {
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: ".quizWidget{visibility:hidden!important}" });
    await page.locator("#eksperci").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector("#eksperci .is-loading"));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator("#eksperci").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const selected = await active(page);
    assert.equal(await page.locator("#eksperci .expertsDot.is-loading").count(), 0);
    // A queued animation-end event from the former mobile countdown must be ignored.
    await page.locator("#eksperci .expertsDot.is-active span").evaluate(element => {
      element.dispatchEvent(new AnimationEvent("animationend", { bubbles: true, animationName: "expertDotLoad" }));
    });
    await page.waitForTimeout(8500);
    assert.equal(await active(page), selected);
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.locator("#eksperci").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector("#eksperci .is-loading"));
    const mobileSelected = await active(page);
    await page.waitForFunction(index => document.querySelector("#eksperci .expertsDot.is-active")?.dataset.expertDot !== index,
      mobileSelected, { timeout: 10000 });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
