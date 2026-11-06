/* Capture the actual first rendered frames while navigating from a tier page. */
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

for (const width of [390, 1440]) {
  test(`${engine}, ${width}px: tier-to-main button stays stable before and after script initialization`, async () => {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    try {
      await context.route("**/*", async route => {
        if (new URL(route.request().url()).origin !== new URL(baseURL).origin) return route.abort();
        // Expose the pre-JavaScript paint even when navigation assets are cached.
        if (/\/script\.js\?/.test(route.request().url())) await new Promise(resolve => setTimeout(resolve, 600));
        return route.continue();
      });
      await context.addInitScript(() => {
        window.quizFrames = [];
        let firstPaint;
        function sample() {
          const text = document.querySelector(".quizFab__text");
          if (text) {
            firstPaint ??= performance.now();
            const rect = text.getBoundingClientRect();
            const style = getComputedStyle(text);
            const buttonStyle = getComputedStyle(text.parentElement);
            window.quizFrames.push({
              ready: Boolean(document.querySelector(".carouselControls")),
              text: text.textContent, x: rect.x, y: rect.y, width: rect.width, height: rect.height,
              opacity: style.opacity, spacing: style.letterSpacing, transform: style.transform,
              buttonOpacity: buttonStyle.opacity, visibility: buttonStyle.visibility,
              animated: text.getAnimations().length
            });
          }
          if (!firstPaint || performance.now() - firstPaint < 2200) requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      for (const tier of ["navigate", "elevate", "relevate"]) {
        await page.goto(new URL(`${tier}.html`, baseURL).href, { waitUntil: "networkidle" });
        await page.locator(".brand").click();
        await page.waitForTimeout(1600);
        const frames = await page.evaluate(() => window.quizFrames);
        assert(frames.some(frame => !frame.ready), "Must include the pre-initialization paint");
        assert(frames.some(frame => frame.ready), "Must include the initialized page");
        const first = frames[0];
        for (const frame of frames) {
          assert.equal(frame.text, "DOBIERZ PAKIET");
          assert.equal(frame.opacity, "1");
          assert.equal(frame.buttonOpacity, "1");
          assert.equal(frame.visibility, "visible");
          assert.equal(frame.animated, 0);
          assert.equal(frame.spacing, first.spacing);
          assert.equal(frame.transform, first.transform);
          for (const key of ["x", "y", "width", "height"]) {
            assert(Math.abs(frame[key] - first[key]) < 0.5, `${tier}: label ${key} shifted during initialization`);
          }
        }
        assert.equal(await page.locator(".quizFab.is-expanded").count(), 0);
      }
      // The intentional five-second prompt still expands and then returns to the compact label.
      await page.waitForFunction(() => performance.now() >= 5700);
      if (width <= 680) {
        assert.equal(await page.locator("[data-quiz-dock] > .quizFab").count(), 1);
        assert.equal(await page.locator(".quizFab.is-expanded").count(), 0, "The hero button must stay compact");
        await page.evaluate(() => window.scrollTo({ top: document.getElementById("sygnaly").offsetTop, behavior: "instant" }));
        await page.waitForFunction(() => document.querySelector(".quizFab.is-expanded"));
        await page.waitForTimeout(600);
      }
      assert.equal(await page.locator(".quizFab.is-expanded").count(), 1);
      assert.equal(await page.locator("[data-quiz-prompt]").getAttribute("aria-hidden"), "false");
      const fit = await page.locator(".quizFab").evaluate(button => {
        const prompt = button.querySelector("[data-quiz-prompt]");
        const box = button.getBoundingClientRect();
        const text = prompt.getBoundingClientRect();
        const style = getComputedStyle(button);
        return {
          extraWidth: box.width - text.width - 2 * parseFloat(style.getPropertyValue("--quiz-prompt-inline")) - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth),
          extraHeight: box.height - text.height - 2 * parseFloat(style.getPropertyValue("--quiz-prompt-block")) - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth),
          fits: prompt.scrollWidth <= prompt.clientWidth + 1 && prompt.scrollHeight <= prompt.clientHeight + 1,
          insideViewport: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight
        };
      });
      assert(fit.extraWidth >= -0.1 && fit.extraWidth < 1.1, "Expanded width must fit the text and padding without extra space");
      assert(fit.extraHeight >= -0.1 && fit.extraHeight < 1.1, "Expanded height must fit the text and padding without extra space");
      assert(fit.fits && fit.insideViewport);
      await page.waitForFunction(() => !document.querySelector(".quizFab.is-expanded"), null, { timeout: 6000 });
      await page.waitForTimeout(500);
      assert.equal(await page.locator(".quizFab.is-expanded").count(), 0);
      assert.equal(await page.locator(".quizFab__text").getAttribute("aria-hidden"), "false");
      await page.locator(".quizFab").click();
      assert.equal(await page.locator("[data-quiz-panel]").getAttribute("aria-hidden"), "false");
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}
