const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const engine = process.env.PLAYWRIGHT_BROWSER || 'chromium';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8766/coaching/';
const artifacts = process.env.PLAYWRIGHT_ARTIFACT_DIR;
let browser;
before(async () => {
  browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true,
    ...(engine === 'chromium' && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
  if (artifacts) fs.mkdirSync(artifacts, { recursive: true });
});
after(async () => browser?.close());

async function openPage(width, height, reducedMotion = 'reduce') {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

for (const [width, height] of [[681, 900], [700, 768], [768, 1024], [900, 900], [1023, 768], [1024, 768], [1280, 720], [1440, 900], [1920, 1080], [1366, 600]]) {
  test(`${engine}, ${width}x${height}: desktop duet fills the first screen and fits every outcome`, async () => {
    const page = await openPage(width, height);
    try {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const geometry = await page.evaluate(() => {
        const rect = selector => {
          const box = document.querySelector(selector).getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
        };
        return { title: rect('.hero__title'), card: rect('.hero__aside'), action: rect('.hero__actions'),
          footer: rect('.hero__footer'), signals: rect('#sygnaly'), overflow: document.documentElement.scrollWidth - innerWidth };
      });
      assert.equal(geometry.overflow, 0);
      assert(geometry.signals.y >= height - 1, 'The next section must begin below the first screen');
      assert(geometry.title.right + (width < 1024 ? 16 : 24) < geometry.card.x, 'The heading and card must remain separate columns');
      assert(geometry.action.bottom < height - 24, 'The consultation CTA must be visible on the first screen');
      if (height >= 720) assert(geometry.footer.bottom <= height + 1, 'Normal laptop/desktop screens should fit the entire hero');
      assert.equal(await page.locator('.hero__leadDefault').isVisible(), false);
      assert.equal(await page.locator('.hero__leadDesktop').isVisible(), true);
      assert.equal(await page.locator('.hero__consultationNote').isVisible(), true);
      assert.equal(await page.locator('.hero__audience').isVisible(), false);
      assert.equal(await page.locator('.hero__actions a').getAttribute('href'), '#kontakt');
      if (artifacts) await page.screenshot({ path: path.join(artifacts, `${engine}-duet-${width}-${height}.png`) });
      for (let goal = 0; goal < 4; goal++) {
        assert.equal(await page.locator('[data-goal-text]').evaluate(element => {
          const text = element.getBoundingClientRect();
          const label = element.parentElement.querySelector('.quoteCard__label').getBoundingClientRect();
          return element.scrollWidth <= element.clientWidth + 1 && text.bottom < label.y;
        }), true, 'Every goal must fit above its counter without overlap');
        await page.locator('[data-goal-card]').click();
      }
      assert.equal(await page.locator('[data-goal-label]').textContent(), '1');
      if (width === 1440) {
        await page.locator('.hero__scroll').click();
        await page.waitForFunction(() => document.querySelector('#sygnaly').getBoundingClientRect().top <= 110);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.locator('.hero__actions a').click();
        await page.waitForFunction(() => document.querySelector('#kontakt').getBoundingClientRect().top <= 110);
      }
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  });
}

test(`${engine}: rapid desktop clicks advance every card without waiting for the full animation`, async () => {
  const page = await openPage(1440, 900, 'no-preference');
  try {
    await page.waitForTimeout(500);
    const box = await page.locator('[data-goal-card]').boundingBox();
    for (let tap = 0; tap < 3; tap++) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForFunction(() => document.querySelector('[data-goal-label]').textContent === '3', null, { timeout: 600 });
    assert.equal(await page.locator('[data-goal-card]').evaluate(element => element.classList.contains('is-cycling')), true);
    await page.waitForFunction(() => !document.querySelector('[data-goal-card]').classList.contains('is-cycling'));
    assert.equal(await page.locator('[data-goal-label]').textContent(), '4');
  } finally { await page.close(); }
});
