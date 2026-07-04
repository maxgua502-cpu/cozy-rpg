import { test, expect } from '@playwright/test';

// Заводим бой: идём влево от спавна в моба m1 (луговой слизень на одной линии).
async function enterBattle(page) {
  await page.goto('/');
  await page.waitForFunction(() => window.__gameReady === true, { timeout: 15_000 });
  expect(await page.evaluate(() => window.__scene)).toBe('World');
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => window.__scene === 'Battle', { timeout: 10_000 });
  await page.keyboard.up('ArrowLeft');
}

// Играем раундами, выбирая заданный тип, пока бой не закончится.
async function playWith(page, type) {
  for (let i = 0; i < 80; i++) {
    const over = await page.evaluate((t) => {
      if (!window.__battleAPI.snapshot().over) window.__battleAPI.pickType(t);
      return window.__battleAPI.snapshot().over;
    }, type);
    if (over) break;
  }
  return page.evaluate(() => window.__battleAPI.snapshot());
}

// 2.2 verify (переход туда-обратно) + 2.4 verify (победа: XP и лут).
// Слизень ходит только Рыцарем → Дамой выигрываем каждый раунд.
test('победа: награда начислена, возврат в мир, моб добыт', async ({ page }) => {
  await enterBattle(page);
  const goldBefore = await page.evaluate(() => window.__lastOutcome ?? null);
  expect(goldBefore).toBe(null); // боя ещё не было

  const snap = await playWith(page, 'dama');
  expect(snap.over).toBe(true);
  expect(snap.winner).toBe('player');

  const outcome = await page.evaluate(() => window.__lastOutcome);
  expect(outcome.gold).toBeGreaterThan(50); // стартовое золото 50 + дроп
  expect(outcome.xp).toBe(12);

  await page.evaluate(() => window.__battleAPI.continue());
  await page.waitForFunction(() => window.__scene === 'World', { timeout: 10_000 });
  const state = await page.evaluate(() => ({
    cleared: window.__state.clearedMobs,
    gold: window.__state.hero.gold,
  }));
  expect(state.cleared).toContain('m1');
  expect(state.gold).toBeGreaterThan(50);
});

// 2.4 verify (поражение: лагерь и −10% золота).
// Слизень-Рыцарь бьёт нашего Дракона каждый раунд → проигрыш.
test('поражение: −10% золота, HP восстановлен, моб не добыт', async ({ page }) => {
  await enterBattle(page);
  const snap = await playWith(page, 'dragon');
  expect(snap.over).toBe(true);
  expect(snap.winner).toBe('enemy');

  await page.evaluate(() => window.__battleAPI.continue());
  await page.waitForFunction(() => window.__scene === 'World', { timeout: 10_000 });
  const state = await page.evaluate(() => ({
    cleared: window.__state.clearedMobs,
    gold: window.__state.hero.gold,
    hp: window.__state.hero.hp,
    maxHp: window.__state.hero.maxHp,
  }));
  expect(state.gold).toBe(45); // 50 − 10%
  expect(state.hp).toBe(state.maxHp); // очнулся в лагере с полным HP
  expect(state.cleared).not.toContain('m1');
});
