const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const engine = process.env.PLAYWRIGHT_BROWSER || 'chromium';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8766/coaching/';
let browser;
before(async () => {
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true,
    ...(engine === 'chromium' && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
});
after(async () => browser?.close());

async function openPage(width, height, reducedMotion = 'no-preference') {
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, reducedMotion });
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  return page;
}

async function assertFullscreen(page) {
  // Even reduced-motion transitions need a paint before their final transform.
  await page.waitForFunction(() => {
    const panel = document.querySelector('[data-quiz-panel]');
    const rect = panel.getBoundingClientRect();
    return Math.abs(rect.x) < 1 && Math.abs(rect.y) < 1
      && Math.abs(rect.width - innerWidth) < 1 && Math.abs(rect.height - innerHeight) < 1
      && getComputedStyle(panel).opacity === '1';
  }, null, { timeout: 2000 });
  const panel = await page.locator('[data-quiz-panel]').boundingBox();
  const viewport = page.viewportSize();
  assert(Math.abs(panel.x) < 1 && Math.abs(panel.y) < 1, 'The panel must reach both top corners');
  assert(Math.abs(panel.width - viewport.width) < 1 && Math.abs(panel.height - viewport.height) < 1,
    'The panel must fill the complete viewport');
  const close = page.locator('[data-quiz-close]');
  assert.equal(await close.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  }), true, 'The close button must sit above the site navigation');
  assert.equal(await page.locator('body').evaluate(element => getComputedStyle(element).overflowY), 'hidden');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
}

for (const [width, height] of [[320, 568], [390, 844], [680, 900], [660, 360]]) {
  test(`${engine}, ${width}x${height}: quiz covers the screen from the hero and floating button`, async () => {
    const page = await openPage(width, height);
    try {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.locator('[data-quiz-toggle]').click();
      await page.waitForTimeout(450);
      await assertFullscreen(page);
      const scrollBefore = await page.evaluate(() => scrollY);
      await page.mouse.move(20, 20);
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => scrollY), scrollBefore, 'The page behind the quiz must not scroll');
      await page.locator('[data-quiz-close]').click();
      await page.waitForTimeout(400);
      assert.equal(await page.locator('body').evaluate(element => getComputedStyle(element).overflowY), 'auto');
      await page.evaluate(() => window.scrollTo({ top: document.querySelector('#sygnaly').offsetTop, behavior: 'instant' }));
      await page.waitForTimeout(850);
      const scrolled = await page.evaluate(() => scrollY);
      await page.locator('[data-quiz-toggle]').click();
      await page.waitForTimeout(450);
      await assertFullscreen(page);
      await page.setViewportSize({ width, height: height + 80 });
      await page.waitForTimeout(200);
      await assertFullscreen(page);
      await page.locator('[data-quiz-close]').click();
      assert(Math.abs(await page.evaluate(() => scrollY) - scrolled) < 1, 'Closing must preserve the underlying page position');
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  });
}

test(`${engine}: six answers stay scrollable; resizing to desktop and back keeps quiz progress`, async () => {
  const page = await openPage(390, 720, 'reduce');
  try {
    await page.locator('[data-quiz-toggle]').click();
    for (let index = 0; index < 6; index++) {
      const answer = page.locator('.quizAnswers').last().locator('.quizAnswer:not(:disabled)').first();
      await answer.waitFor();
      await answer.click();
      await assertFullscreen(page);
    }
    await page.locator('.quizMessage--result').waitFor();
    assert.equal(await page.locator('[data-quiz-messages]').evaluate(element => element.scrollHeight > element.clientHeight), true);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);
    const desktop = await page.locator('[data-quiz-panel]').boundingBox();
    assert(desktop.width <= 420 && desktop.height < 900 && desktop.y > 0);
    assert.equal(await page.locator('body').evaluate(element => getComputedStyle(element).overflowY), 'auto');
    await page.setViewportSize({ width: 390, height: 600 });
    await page.waitForTimeout(200);
    await assertFullscreen(page);
    assert.equal(await page.locator('.quizMessage--result').count(), 1);
    await page.locator('[data-quiz-close]').click();
    await page.locator('[data-quiz-toggle]').click();
    await assertFullscreen(page);
    assert.equal(await page.locator('.quizMessage--result').count(), 1);
  } finally { await page.close(); }
});
