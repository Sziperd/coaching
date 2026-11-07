// Frame-by-frame regression for the collage/duet deck's physical layer handoff.
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

test(`${engine}: every rapid mobile tap advances a card; reduced motion and desktop still advance`, async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, hasTouch: true });
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  try {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    const card = page.locator('[data-goal-card]');
    await card.waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
    const bounds = await card.boundingBox();
    // Send actual pointer events without locator actionability waits between taps.
    for (let tap = 0; tap < 3; tap++) await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.waitForFunction(() => document.querySelector('[data-goal-label]').textContent === '3', null, { timeout: 600 });
    assert.equal(await page.locator('[data-goal-card]').evaluate(element => element.classList.contains('is-cycling')), true,
      'The third card must start leaving before the first normal cycle would finish');
    await page.waitForFunction(() => !document.querySelector('[data-goal-card]').classList.contains('is-cycling'));
    assert.equal(await page.locator('[data-goal-label]').textContent(), '4', 'No rapid taps may be dropped');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelector('[data-goal-card]').click());
    assert.equal(await page.locator('[data-goal-label]').textContent(), '2');
    assert.equal(await page.locator('[data-goal-card]').evaluate(element => element.classList.contains('is-cycling')), false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('[data-goal-card]').click();
    await page.waitForFunction(() => !document.querySelector('[data-goal-card]').classList.contains('is-cycling'));
    assert.equal(await page.locator('[data-goal-label]').textContent(), '2');
    assert.equal(await page.locator('[data-goal-face]').evaluate(element => getComputedStyle(element).opacity), '1');
  } finally { await page.close(); }
});
after(async () => browser?.close());

test(`${engine}: a second tap preserves every layer pose and starts the next card promptly`, async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, hasTouch: true });
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  try {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelector('[data-goal-card]').click());
    await page.waitForTimeout(200);
    const { before, after } = await page.evaluate(() => {
      const card = document.querySelector('[data-goal-card]');
      const snapshot = () => [...card.querySelectorAll('.quoteCard__face,.quoteCard__nextFace,.quoteCard__layer')].map(element => {
        const rect = element.getBoundingClientRect();
        return [rect.x, rect.y, rect.width, rect.height, Number(getComputedStyle(element).opacity)];
      });
      const before = snapshot();
      card.click();
      return { before, after: snapshot() };
    });
    assert(before.every((layer, index) => layer.every((value, dimension) => Math.abs(value - after[index][dimension]) < 1)),
      'Clicking during a transition must not snap layers back to their resting poses');
    await page.waitForFunction(() => document.querySelector('[data-goal-label]').textContent === '2', null, { timeout: 400 });
    assert.equal(await page.locator('[data-goal-card]').evaluate(element => element.classList.contains('is-cycling')), true);
    await page.waitForFunction(() => !document.querySelector('[data-goal-card]').classList.contains('is-cycling'));
    assert.equal(await page.locator('[data-goal-label]').textContent(), '3');
  } finally { await page.close(); }
});

for (const width of [320, 390, 680, 768, 1023, 1440]) test(`${engine}, ${width}px: every card advances continuously into the layer above`, async () => {
  const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  try {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    for (let cycle = 0; cycle < 3; cycle++) {
      const frames = await page.evaluate(() => new Promise(resolve => {
        const card = document.querySelector('[data-goal-card]');
        const label = document.querySelector('[data-goal-label]');
        const initial = label.textContent;
        const selectors = ['.quoteCard__face', '.quoteCard__nextFace', '.quoteCard__layer--middle', '.quoteCard__layer--back'];
        const frames = [];
        const start = performance.now();
        card.click();
        function sample() {
          const rear = getComputedStyle(card, '::before');
          frames.push({ label: label.textContent, elapsed: performance.now() - start,
            rear: { opacity: Number(rear.opacity), display: rear.display, transform: rear.transform },
            layers: selectors.map(selector => {
              const element = card.querySelector(selector);
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, transform: style.transform, opacity: Number(style.opacity), color: style.backgroundColor.match(/[\d.]+/g).map(Number) };
            }) });
          if (label.textContent !== initial && !card.classList.contains('is-cycling')) resolve(frames);
          else if (performance.now() - start > 2000) resolve(frames);
          else requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      }));
      const before = frames.at(-2), after = frames.at(-1);
      assert.notEqual(before.label, after.label, 'The goal must advance on the final animation frame');
      assert(after.elapsed > (width >= 681 ? 800 : 1000) && after.elapsed < 1400, 'The CSS animation must finish before the recovery timeout');
      assert(frames.every(frame => frame.rear.display !== 'none'), 'The replenishing rear card must exist throughout the animation');
      assert(frames.some(frame => frame.elapsed > 150 && frame.elapsed < 700 && frame.rear.opacity > .1), 'The rear card must appear while the stack moves');
      assert(before.rear.opacity > .99, 'The replacement rear card must be fully present before the handoff');
      for (let layer = 0; layer < 3; layer++) {
        for (const dimension of ['x', 'y', 'width', 'height']) {
          assert(Math.abs(before.layers[layer + 1][dimension] - after.layers[layer][dimension]) < 1,
            `Handoff must not jump: layer ${layer}, ${dimension}`);
        }
        assert(before.layers[layer + 1].color.every((value, index) => Math.abs(value - after.layers[layer].color[index]) <= 1),
          `Handoff must not flash a different card color: layer ${layer}`);
      }
      const matrix = value => value.match(/-?\d*\.?\d+/g).map(Number);
      const rear = matrix(before.rear.transform), back = matrix(after.layers[3].transform);
      assert(rear.every((value, index) => Math.abs(value - back[index]) < .02), 'The new rear card must occupy exactly the previous rear layer position');
      assert.equal(after.layers[0].opacity, 1);
    }
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});
