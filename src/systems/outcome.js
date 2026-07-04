// Исход боя → изменение состояния (столп №3). Чистая логика, тестируется юнитами.
import balance from '../data/balance.json';

export function rollGold(range, rng = Math.random) {
  const [a, b] = range;
  return a + Math.floor(rng() * (b - a + 1)); // включительно
}

// Применяет итог боя к состоянию. Возвращает сводку для экрана результата.
export function applyBattleOutcome(state, { winner, mob, iid, playerHp }, rng = Math.random) {
  if (winner === 'player') {
    const gold = rollGold(mob.drop.gold, rng);
    state.hero.gold += gold;
    state.hero.xp += mob.xp;
    state.hero.hp = Math.max(1, playerHp); // урон боя сохраняется, но не добивает
    if (!state.clearedMobs.includes(iid)) state.clearedMobs.push(iid);
    return { winner, gold, xp: mob.xp };
  }
  // Поражение (решение №7): очнулся в лагере, HP восстановлен, −10% золота на руках.
  const penalty = Math.floor(state.hero.gold * balance.defeat.goldPenalty);
  state.hero.gold -= penalty;
  state.hero.hp = state.hero.maxHp;
  state.playerPos = null; // вернуться на спавн-лагерь
  return { winner, penalty };
}
