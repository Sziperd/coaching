/*
 * Browser regressions for equal closed tiers and independent expansion.
 * Start a preview: python3 -m http.server 8000 --directory coaching
 * Run: node --test coaching/tests/package-layout.browser.cjs
 * Requires Playwright. Set PLAYWRIGHT_BASE_URL for another preview URL and
 * PLAYWRIGHT_CHROMIUM_EXECUTABLE to use an installed Chrome/Chromium binary.
 * Set PLAYWRIGHT_ARTIFACT_DIR to save screenshots.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium, webkit } = require("playwright");
const engine = process.env.PLAYWRIGHT_BROWSER || "chromium";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8000/";
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

async function openPage(width) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width <= 680 });
  await context.route("**/*", route => new URL(route.request().url()).origin === new URL(baseURL).origin
    ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("body.redesign").waitFor();
  // This suite tests card geometry, independently of the timed floating CTA.
  await page.addStyleTag({ content: ".quizWidget{visibility:hidden!important}" });
  return { context, page, errors };
}

async function geometry(page) {
  return page.locator(".packageCard").evaluateAll(cards => cards.map(card => {
    const box = card.getBoundingClientRect();
    return {
      height: box.height,
      linkBottom: card.querySelector(".packageCard__link").getBoundingClientRect().bottom - box.top,
      includesTop: card.querySelector(".packageCard__includes").getBoundingClientRect().top - box.top
    };
  }));
}

function assertEqualClosed(cards, message) {
  for (const key of ["height", "linkBottom", "includesTop"]) {
    const values = cards.map(card => card[key]);
    assert(Math.max(...values) - Math.min(...values) < 1,
      `${message}: ${key} must align, got ${values.join(" / ")}`);
  }
}

async function screenshot(page, name) {
  if (artifacts) await page.locator("[data-packages-grid]").screenshot({ path: path.join(artifacts, name) });
}

for (const width of [320, 390, 480, 680]) {
  test(`${width}px: equal initial tiers, independent animated expansion, and auto-collapse`, async () => {
    const { context, page, errors } = await openPage(width);
    try {
      assertEqualClosed(await geometry(page), "Before fonts finish loading");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(100);
      const baseline = await geometry(page);
      assertEqualClosed(baseline, "After fonts finish loading");
      await screenshot(page, `tiers-${width}-closed.png`);

      for (let index = 0; index < 3; index++) {
        await page.locator("[data-package-dot]").nth(index).click();
        await page.waitForTimeout(600);
        const details = page.locator(".packageCard__more").nth(index);
        await details.locator("summary").click();
        await page.waitForTimeout(100);
        const during = await geometry(page);
        await page.waitForTimeout(300);
        const expanded = await geometry(page);
        assert(during[index].height > baseline[index].height + 1, "Opening must animate");
        assert(during[index].height < expanded[index].height - 1, "Opening must have intermediate sizes");
        assert(expanded[index].height > baseline[index].height + 20, "Selected tier must expand");
        for (let other = 0; other < 3; other++) {
          if (other !== index) assert(Math.abs(expanded[other].height - baseline[other].height) < 1,
            `Opening tier ${index} resized tier ${other}`);
        }
        await screenshot(page, `tiers-${width}-expanded-${index}.png`);

        await page.locator("[data-package-dot]").nth((index + 1) % 3).click();
        await page.waitForTimeout(100);
        const closing = await geometry(page);
        assert(closing[index].height < expanded[index].height - 1, "Auto-collapse must animate");
        assert(closing[index].height > baseline[index].height + 1, "Closing must have intermediate sizes");
        await page.waitForTimeout(500);
        assert.equal(await details.getAttribute("open"), null);
        assertEqualClosed(await geometry(page), "After automatic collapse");
      }

      // Swipe/trackpad scrolling must also close the previous tier at the end of the track.
      await page.locator("[data-package-dot]").nth(1).click();
      await page.waitForTimeout(600);
      await page.locator(".packageCard__more").nth(1).locator("summary").click();
      await page.waitForTimeout(400);
      await page.locator("[data-packages-grid]").evaluate(grid => grid.scrollTo({
        left: grid.scrollWidth, behavior: "instant"
      }));
      await page.waitForTimeout(750);
      assert.equal(await page.locator(".packageCard__more[open]").count(), 0);
      assertEqualClosed(await geometry(page), "After swiping to the last tier");

      // Reversing an unfinished animation must not leave a stale fixed height.
      const last = page.locator(".packageCard__more").last();
      await last.locator("summary").click();
      await page.waitForTimeout(60);
      await last.locator("summary").click();
      await page.waitForTimeout(400);
      assert.equal(await last.getAttribute("open"), null);
      assert.equal(await last.evaluate(details => details.style.height), "");
      assertEqualClosed(await geometry(page), "After rapid toggling");
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test("resizing with a tier open measures only closed content and preserves the open state", async () => {
  const { context, page, errors } = await openPage(390);
  try {
    await page.evaluate(() => document.fonts.ready);
    const first = page.locator(".packageCard__more").first();
    await first.locator("summary").click();
    await page.waitForTimeout(400);
    for (const width of [320, 480, 680, 1440, 900, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      assert.equal(await first.getAttribute("open"), "");
      const cards = await geometry(page);
      assertEqualClosed(cards.slice(1), `Closed siblings after resizing to ${width}px`);
      assert(cards[0].height > cards[1].height + 20, "The open card must stay expanded");
    }
    await first.locator("summary").click();
    await page.waitForTimeout(400);
    assertEqualClosed(await geometry(page), "Collapsed after resizing");
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

for (const width of [900, 1440]) test(`${width}px: desktop tiers collapse independently and align when closed`, async () => {
  const { context, page, errors } = await openPage(width);
  try {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);
    const baseline = await geometry(page);
    assertEqualClosed(baseline, "Desktop");
    if (width === 1440) assert(baseline[0].height < 800, "Desktop tiers must be substantially shorter than the former 1009px cards");
    for (let index = 0; index < 3; index++) {
      const details = page.locator(".packageCard__more").nth(index);
      assert.equal(await details.isVisible(), true);
      const preview = details.locator(".packageCard__preview");
      assert.equal(await preview.isVisible(), true);
      assert.match(await preview.evaluate(element => getComputedStyle(element).maskImage), /linear-gradient/);
      await details.locator("summary").click();
      await page.waitForTimeout(400);
      const expanded = await geometry(page);
      assert(expanded[index].height > baseline[index].height + 20);
      assert.equal(await preview.isVisible(), false);
      for (let sibling = 0; sibling < 3; sibling++) {
        if (sibling !== index) assert(Math.abs(expanded[sibling].height - baseline[sibling].height) < 1,
          "An expanded desktop tier must not stretch its siblings");
      }
      await details.locator("summary").click();
      await page.waitForTimeout(400);
      assert.equal(await preview.isVisible(), true);
      assertEqualClosed(await geometry(page), "Desktop after collapsing");
    }
    await screenshot(page, `tiers-${engine}-${width}-closed.png`);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
