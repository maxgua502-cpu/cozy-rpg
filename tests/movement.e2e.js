import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await page.waitForFunction(() => window.__gameReady === true, { timeout: 15_000 });
  return page.evaluate(() => window.__playerPos);
}

const pos = (page) => page.evaluate(() => window.__playerPos);

// 1.2 verify (движение): клавиши двигают персонажа.
test('движение вверх по стрелке меняет позицию', async ({ page }) => {
  const start = await ready(page);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(700);
  await page.keyboard.up('ArrowUp');
  const after = await pos(page);
  expect(after.y).toBeLessThan(start.y - 80); // заметно поднялся
  expect(Math.abs(after.x - start.x)).toBeLessThan(6); // вбок не уехал
});

// 1.2 verify (коллизии): персонаж не проходит сквозь дерево.
// В карте есть дерево прямо на восток от точки спавна (940, 600).
test('персонаж упирается в дерево и не проходит насквозь', async ({ page }) => {
  await ready(page);
  const world = await page.evaluate(() => window.__world);
  const tree = { x: 940, y: 600 };
  const treeLeft = tree.x - world.treeSize / 2; // 918
  const playerHalf = world.playerSize / 2; // 14

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1500); // с запасом, чтобы упереться
  await page.keyboard.up('ArrowRight');
  const after = await pos(page);

  // Правый край персонажа не должен зайти за левый край дерева (+пара px допуска).
  expect(after.x + playerHalf).toBeLessThanOrEqual(treeLeft + 3);
  // При этом он реально дошёл до дерева, а не застрял на старте (800).
  expect(after.x).toBeGreaterThan(860);
  expect(Math.abs(after.y - tree.y)).toBeLessThan(12);
});
