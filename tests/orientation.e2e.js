import { test, expect } from '@playwright/test';

// 1.5 verify: играбельно в портрете и ландшафте — канвас заполняет экран
// в любой ориентации (Scale.RESIZE подгоняет размер под окно).
const BASE = 'http://localhost:5173';

async function expectFills(browser, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, baseURL: BASE });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.waitForFunction(() => window.__gameReady === true, { timeout: 15_000 });
  const box = await page.locator('canvas').boundingBox();
  expect(box.width).toBeGreaterThan(w - 4);
  expect(box.height).toBeGreaterThan(h - 4);
  await ctx.close();
}

test('канвас заполняет экран в портрете', async ({ browser }) => {
  await expectFills(browser, 393, 851);
});

test('канвас заполняет экран в ландшафте', async ({ browser }) => {
  await expectFills(browser, 851, 393);
});
