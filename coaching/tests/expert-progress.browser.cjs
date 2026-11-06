/*
 * Browser regressions for the expert countdown's full paused indicator.
 * Preview: python3 -m http.server 8000 --directory coaching
 * Run with Playwright installed: node --test coaching/tests/expert-progress.browser.cjs
 * PLAYWRIGHT_BASE_URL overrides the preview URL; PLAYWRIGHT_BROWSER=webkit
 * also runs the same checks with WebKit. PLAYWRIGHT_CHROMIUM_EXECUTABLE can
 * select an installed Chrome. PLAYWRIGHT_ARTIFACT_DIR enables screenshots.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium, webkit } = require("playwright");

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8000/";
const engine = process.env.PLAYWRIGHT_BROWSER || "chromium";
const artifacts = process.env.PLAYWRIGHT_ARTIFACT_DIR;
let browser;

before(async () => {
  browser = await (engine === "webkit" ? webkit : chromium).launch({
    headless: true,
    ...(engine === "chromium" && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {})
  });
  if (artifacts) fs.mkdirSync(artifacts, { recursive: true });
});
after(async () => { await browser?.close(); });

async function openPage(width, reducedMotion = "no-preference") {
  const context = await browser.newContext({
    viewport: { width, height: 900 }, hasTouch: true, reducedMotion
  });
  await context.route("**/*", route => new URL(route.request().url()).origin === new URL(baseURL).origin
    ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.locator("body.redesign").waitFor();
  await page.addStyleTag({ content: ".quizWidget{visibility:hidden!important}" });
  await page.locator("#eksperci").scrollIntoViewIfNeeded();
  if (width <= 680 && reducedMotion !== "reduce") {
    await page.waitForFunction(() => document.querySelector("#eksperci .expertsDot.is-loading"));
  }
  return { context, page, errors };
}

async function progress(fill) {
  return fill.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m11);
}

for (const width of [320, 390, 680]) {
  test(`${engine}, ${width}px: an expanded profile animates its indicator to full and keeps it full`, async () => {
    const { context, page, errors } = await openPage(width);
    try {
      assert.equal(await page.locator(".expertPlayback").count(), 0);
      const active = await page.locator("#eksperci [data-expert-dot].is-active").getAttribute("data-expert-dot");
      const fill = page.locator("#eksperci [data-expert-dot]").nth(Number(active)).locator("span");
      const details = page.locator(".expertSlide").nth(Number(active)).locator(".expertMore");
      const profile = page.locator(".expertSlide").nth(Number(active)).locator(".expertProfileText");
      const text = profile.locator(".expertMore__text");
      const originalParagraphs = await text.locator("p").allTextContents();
      assert.equal(originalParagraphs.length, 3);
      assert.deepEqual(originalParagraphs, await page.evaluate(index => window.siteContent.experts.items[index].bio, Number(active)));
      assert.equal(await page.locator(".expertMobileIntro,.expertMore__preview").count(), 0);
      assert.equal(await details.locator("p").count(), 0, "The expander must not contain a repeated biography");
      assert.match(await text.evaluate(element => getComputedStyle(element).maskImage), /linear-gradient/);
      const closedHeight = await profile.evaluate(element => element.getBoundingClientRect().height);
      assert(await text.evaluate(element => element.scrollHeight > element.clientHeight), "Closed text must be clipped");
      if (artifacts && width === 390) {
        await page.locator(".expertSlide").nth(Number(active)).locator(".expertProfile").screenshot({
          path: path.join(artifacts, `${engine}-${width}-faded-profile.png`)
        });
      }
      await page.waitForTimeout(1000);
      // Sample in the page so browser/driver latency cannot skip the short transition.
      await details.evaluate(element => {
        window.profileExpansionFrames = new Promise(resolve => {
          element.querySelector("summary").addEventListener("click", () => {
            const started = performance.now();
            const samples = [];
            const profile = element.closest(".expertProfileText");
            const fill = document.querySelector("#eksperci .expertsDot.is-active span");
            function sample() {
              samples.push({
                fill: new DOMMatrixReadOnly(getComputedStyle(fill).transform).m11,
                height: profile.getBoundingClientRect().height
              });
              if (performance.now() - started < 500) requestAnimationFrame(sample);
              else resolve(samples);
            }
            requestAnimationFrame(sample);
          }, { once: true });
        });
      });
      await details.locator("summary").click();
      const samples = await page.evaluate(() => window.profileExpansionFrames);
      assert(samples.some(sample => sample.fill > samples[0].fill + 0.01 && sample.fill < 0.999),
        "The indicator must render intermediate fill levels");
      const expandedHeight = await profile.evaluate(element => element.getBoundingClientRect().height);
      assert(samples.some(sample => sample.height > closedHeight + 1 && sample.height < expandedHeight - 1),
        "The same text must expand smoothly");
      assert.equal(await text.evaluate(element => getComputedStyle(element).maskImage), "none");
      assert.deepEqual(await text.locator("p").allTextContents(), originalParagraphs);
      assert(await text.evaluate(element => element.scrollHeight <= element.clientHeight + 1));
      assert(Math.abs(await progress(fill) - 1) < 0.001, "Paused indicator must be completely full");

      // The completed animation must not be the only thing holding the full appearance.
      await fill.evaluate(element => element.getAnimations().forEach(animation => animation.cancel()));
      assert(Math.abs(await progress(fill) - 1) < 0.001, "Full paused state must survive animation cancellation");
      await page.locator("#home").scrollIntoViewIfNeeded();
      await page.locator(".expertPager").scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      assert(Math.abs(await progress(fill) - 1) < 0.001, "Scrolling away and back must not empty the dot");
      if (artifacts) {
        await page.locator(".expertPager").screenshot({
          path: path.join(artifacts, `${engine}-${width}-paused-full.png`)
        });
      }

      if (width === 390) {
        await page.waitForTimeout(8500);
        assert.equal(await page.locator("#eksperci [data-expert-dot].is-active").getAttribute("data-expert-dot"), active);
        assert(Math.abs(await progress(fill) - 1) < 0.001, "Indicator must stay full beyond the normal countdown");
      }

      await details.locator("summary").click();
      await page.waitForFunction(index => !document.querySelectorAll(".expertMore")[index].open, Number(active));
      assert.match(await text.evaluate(element => getComputedStyle(element).maskImage), /linear-gradient/);
      assert.deepEqual(await text.locator("p").allTextContents(), originalParagraphs);
      assert(Math.abs(await profile.evaluate(element => element.getBoundingClientRect().height) - closedHeight) < 1);
      await page.waitForFunction(() => document.querySelector("#eksperci .expertsDot.is-loading"), null, { timeout: 2000 });
      assert.equal(await fill.evaluate(element => getComputedStyle(element).animationDuration), "8s");
      assert(await progress(fill) < 0.2, "Collapsing must start a fresh countdown");

      if (width === 390) {
        await page.waitForFunction(index => document.querySelector("#eksperci [data-expert-dot].is-active")?.dataset.expertDot !== index,
          active, { timeout: 10000 });
      }

      const current = Number(await page.locator("#eksperci [data-expert-dot].is-active").getAttribute("data-expert-dot"));
      await page.locator(".expertSlide").nth(current).locator(".expertMore summary").click();
      await page.waitForTimeout(550);
      await page.locator(".expertPager__arrow").last().click();
      await page.waitForTimeout(750);
      assert.equal(await page.locator(".expertMore[open]").count(), 0);
      const nextFill = page.locator("#eksperci [data-expert-dot].is-active span");
      assert(await progress(nextFill) < 0.3, "The next expert must have a normal countdown, not a stuck full dot");
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test(`${engine}: reduced motion fills the paused indicator immediately`, async () => {
  const { context, page, errors } = await openPage(390, "reduce");
  try {
    await page.locator(".expertMore summary").first().click();
    await page.waitForTimeout(50);
    const fill = page.locator("#eksperci [data-expert-dot].is-active span");
    assert(Math.abs(await progress(fill) - 1) < 0.001);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test(`${engine}: desktop profiles show each complete biography once`, async () => {
  const { context, page, errors } = await openPage(1440);
  try {
    assert.equal(await page.locator(".expertMobileIntro,.expertMore__preview").count(), 0);
    for (let index = 0; index < 2; index++) {
      const profile = page.locator(".expertProfileText").nth(index);
      const text = profile.locator(".expertMore__text");
      assert.deepEqual(await text.locator("p").allTextContents(),
        await page.evaluate(index => window.siteContent.experts.items[index].bio, index));
      assert.equal(await text.evaluate(element => getComputedStyle(element).maskImage), "none");
      assert(await text.evaluate(element => element.scrollHeight <= element.clientHeight + 1));
      assert.equal(await profile.locator(".expertMore").isVisible(), false);
    }
    await page.locator(".carouselControls button").last().click();
    await page.waitForTimeout(800);
    assert.equal(await page.locator("#eksperci .expertsDot.is-active").getAttribute("data-expert-dot"), "1");
    assert.equal(await page.locator("#eksperci .expertsDot.is-loading").count(), 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
