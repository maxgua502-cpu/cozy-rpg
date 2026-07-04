import { test, expect } from '@playwright/test';

// M0 verify (0.5): сцена загрузилась и в консоли нет ошибок.
test('игровая сцена загружается без ошибок консоли', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');

  // WorldScene выставляет window.__gameReady = true в create().
  await page.waitForFunction(() => window.__gameReady === true, { timeout: 15_000 });

  // Канвас Phaser отрисован.
  await expect(page.locator('canvas')).toBeVisible();

  expect(errors, `Ошибки в консоли:\n${errors.join('\n')}`).toHaveLength(0);
});
