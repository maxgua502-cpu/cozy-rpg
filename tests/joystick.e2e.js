import { test, expect } from '@playwright/test';

// 1.3 verify (в браузере): виртуальный джойстик двигает персонажа.
// Полное подтверждение «на телефоне» — за управляющим; здесь гоняем указателем
// в левой половине экрана (Phaser унифицирует тач и мышь).
test('джойстик слева ведёт персонажа', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__gameReady === true, { timeout: 15_000 });
  const start = await page.evaluate(() => window.__playerPos);

  // Нажать в левой половине и потянуть вверх — джойстик активируется и держит вектор.
  await page.mouse.move(110, 700);
  await page.mouse.down();
  await page.mouse.move(110, 600); // тянем вверх → движение вверх
  await page.waitForTimeout(700);
  await page.mouse.up();

  const after = await page.evaluate(() => window.__playerPos);
  expect(after.y).toBeLessThan(start.y - 60);
  expect(Math.abs(after.x - start.x)).toBeLessThan(8);
});
