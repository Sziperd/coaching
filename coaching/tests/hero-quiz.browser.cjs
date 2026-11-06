/* Mobile collage, single quiz button, docking, and quiz state regressions.
 * Uses the same Playwright environment variables as quiz-navigation.browser.cjs. */
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

async function openPage(width, height = 900, reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width <= 680, reducedMotion });
  await context.route("**/*", route => new URL(route.request().url()).origin === new URL(baseURL).origin
    ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { window.originalQuizToggle = document.querySelector("[data-quiz-toggle]"); });
  return { context, page, errors };
}

async function scroll(page, destination) {
  await page.evaluate(destination => window.scrollTo({
    top: destination === "top" ? 0 : document.querySelector(destination).offsetTop,
    behavior: "instant"
  }), destination);
  await page.waitForTimeout(850);
}

async function assertSingleButton(page, docked) {
  assert.equal(await page.locator("[data-quiz-toggle]").count(), 1);
  assert.equal(await page.evaluate(() => document.querySelector("[data-quiz-toggle]") === window.originalQuizToggle), true);
  assert.equal(await page.locator(docked ? "[data-quiz-dock] > .quizFab" : "[data-quiz-widget] > .quizFab").count(), 1);
  assert.equal(await page.locator("[data-quiz-toggle]").evaluate(element => getComputedStyle(element).opacity), "1");
}

for (const width of [320, 390, 480, 680]) {
  test(`${engine}, ${width}px: mobile hero keeps one quiz button while scrolling and opening the quiz`, async () => {
    const { context, page, errors } = await openPage(width);
    try {
      await assertSingleButton(page, true);
      assert.equal(await page.locator(".hero__lead").isVisible(), false);
      assert.equal(await page.locator(".hero__audience").isVisible(), true);
      assert.equal(await page.locator(".heroQuiz__caption").textContent(), "6 krótkich pytań");
      const heroHeight = await page.locator(".hero").evaluate(element => element.getBoundingClientRect().height);
      const anchor = await page.locator("[data-quiz-dock]").boundingBox();
      const button = await page.locator("[data-quiz-toggle]").boundingBox();
      assert(Math.abs(anchor.x - button.x) < 1 && Math.abs(anchor.y - button.y) < 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);

      // Opening the fixed panel must leave the same visible button in the hero.
      await page.locator("[data-quiz-toggle]").click();
      await page.waitForTimeout(400);
      assert.equal(await page.locator("[data-quiz-panel]").getAttribute("aria-hidden"), "false");
      await assertSingleButton(page, true);
      const openButton = await page.locator("[data-quiz-toggle]").boundingBox();
      // The existing hover effect lifts the button by 3px without relocating it.
      assert(Math.abs(openButton.x - button.x) < 1 && Math.abs(openButton.y - button.y) <= 3.1
        && Math.abs(openButton.width - button.width) < 1 && Math.abs(openButton.height - button.height) < 1,
        "Opening the quiz must not move the hero button");
      assert.equal(await page.locator("[data-quiz-toggle]").getAttribute("aria-expanded"), "true");
      const panel = await page.locator("[data-quiz-panel]").boundingBox();
      assert(panel.x >= 0 && panel.x + panel.width <= width + 1 && panel.y >= 0 && panel.y + panel.height <= 901);
      const firstMessage = await page.locator(".quizMessage").first().textContent();
      await page.locator("[data-quiz-close]").click();
      await page.waitForTimeout(450);
      await assertSingleButton(page, true);
      assert(Math.abs(await page.locator(".hero").evaluate(element => element.getBoundingClientRect().height) - heroHeight) < 1);

      await scroll(page, "#sygnaly");
      await assertSingleButton(page, false);
      const floating = await page.locator("[data-quiz-toggle]").boundingBox();
      assert(Math.abs(width - floating.x - floating.width - 12) < 1);
      assert(Math.abs(900 - floating.y - floating.height - 12) < 1);
      assert.equal(await page.locator("[data-quiz-dock]").evaluate(element => element.getBoundingClientRect().height), 54);
      assert(Math.abs(await page.locator(".hero").evaluate(element => element.getBoundingClientRect().height) - heroHeight) < 1);
      await page.locator("[data-quiz-toggle]").click();
      assert.equal(await page.locator(".quizMessage").first().textContent(), firstMessage, "Moving the button must not reset quiz state");
      await page.locator("[data-quiz-close]").click();
      await page.waitForTimeout(450);
      await assertSingleButton(page, false);
      if (artifacts && width === 390) await page.screenshot({ path: path.join(artifacts, `${engine}-hero-floating.png`) });
      await scroll(page, "top");
      await assertSingleButton(page, true);
      if (width === 320 || width === 390) {
        for (let index = 0; index < 4; index++) {
          await page.locator("[data-goal-card]").click();
          await page.waitForFunction(index => document.querySelector("[data-goal-label]").textContent === String((index + 1) % 4 + 1), index);
          await page.waitForFunction(() => !document.querySelector("[data-goal-card]").classList.contains("is-cycling"));
          assert.equal(await page.locator("[data-goal-text]").evaluate(element => element.scrollWidth <= element.clientWidth + 1), true);
        }
        assert.equal(await page.locator("[data-goal-label]").textContent(), "1");
      }
      if (artifacts) await page.screenshot({ path: path.join(artifacts, `${engine}-hero-${width}.png`) });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test(`${engine}: mobile hero defers the five-second prompt until floating and cancels it when returning`, async () => {
  const { context, page, errors } = await openPage(390);
  try {
    await page.waitForFunction(() => performance.now() >= 5800);
    await assertSingleButton(page, true);
    assert.equal(await page.locator(".quizFab.is-expanded").count(), 0);
    await scroll(page, "#sygnaly");
    assert.equal(await page.locator(".quizFab.is-expanded").count(), 1);
    await scroll(page, "top");
    await assertSingleButton(page, true);
    assert.equal(await page.locator(".quizFab.is-expanded").count(), 0);
    await scroll(page, "#sygnaly");
    await assertSingleButton(page, false);
    assert.equal(await page.locator(".quizFab.is-expanded").count(), 0, "The one-time prompt must not repeat");
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test(`${engine}: hero docking survives resize, quick reversals, and the footer`, async () => {
  const { context, page, errors } = await openPage(390);
  try {
    await scroll(page, "#sygnaly");
    const returnFrames = await page.evaluate(() => new Promise(resolve => {
      const started = performance.now();
      const frames = [];
      window.scrollTo({ top: 0, behavior: "instant" });
      function sample() {
        const button = document.querySelector("[data-quiz-toggle]");
        const box = button.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        if (x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight) {
          frames.push({ visible: button.contains(document.elementFromPoint(x, y)), opacity: getComputedStyle(button).opacity,
            elapsed: performance.now() - started, moving: button.getAnimations().some(animation => animation.playState === "running" && Number.isFinite(animation.effect.getTiming().iterations)) });
        }
        if (performance.now() - started < 850) requestAnimationFrame(sample);
        else resolve(frames);
      }
      requestAnimationFrame(sample);
    }));
    assert(returnFrames.length > 1);
    assert(returnFrames.every(frame => frame.visible && frame.opacity === "1"), "The moving button must not clip or blink while returning to the hero");
    assert(returnFrames.some(frame => frame.elapsed >= 400 && frame.elapsed <= 550 && frame.moving),
      "The relocation should still be moving after 400ms, rather than rushing to the destination");
    assert.equal(returnFrames.at(-1).moving, false, "The relocation should finish smoothly within 850ms");
    await assertSingleButton(page, true);
    await scroll(page, "#sygnaly");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(80);
    await scroll(page, "#sygnaly");
    await assertSingleButton(page, false);
    await scroll(page, "top");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(850);
    await assertSingleButton(page, false);
    assert.equal(await page.locator(".hero__lead").isVisible(), true);
    assert.equal(await page.locator(".hero__audience").isVisible(), false);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.waitForTimeout(450);
    await assertSingleButton(page, true);
    await page.locator(".footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(450);
    assert.equal(await page.locator(".quizFab").evaluate(element => getComputedStyle(element).visibility), "hidden");
    await scroll(page, "top");
    await assertSingleButton(page, true);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test(`${engine}: the hero quiz still completes all six questions with reduced motion`, async () => {
  const { context, page, errors } = await openPage(390, 900, "reduce");
  try {
    await page.locator("[data-quiz-toggle]").click();
    for (let index = 0; index < 6; index++) {
      const answer = page.locator(".quizAnswers").last().locator(".quizAnswer:not(:disabled)").first();
      await answer.waitFor();
      await answer.click();
    }
    await page.locator(".quizMessage--result").waitFor();
    await page.locator("[data-quiz-close]").click();
    await assertSingleButton(page, true);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
