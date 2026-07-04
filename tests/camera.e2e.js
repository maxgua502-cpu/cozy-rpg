import { test, expect } from '@playwright/test';

// 1.4 verify: карта больше экрана, камера следует за персонажем → есть скролл.
test('камера прокручивается вслед за персонажем', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__gameReady === true, { timeout: 15_000 });
  const start = await page.evaluate(() => window.__camScroll);

  // Идём вниз — мир (1200px) выше видимой области, камера должна поехать.
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(900);
  await page.keyboard.up('ArrowDown');

  const after = await page.evaluate(() => window.__camScroll);
  expect(after.y).toBeGreaterThan(start.y + 60);
});
