import { describe, it, expect } from 'vitest';
import { rollGold, applyBattleOutcome } from '../src/systems/outcome.js';

const mob = { xp: 20, drop: { gold: [5, 12] } };

function freshState() {
  return { hero: { hp: 30, maxHp: 60, gold: 100, xp: 0 }, clearedMobs: [], playerPos: { x: 1, y: 2 } };
}

describe('rollGold', () => {
  it('в границах диапазона включительно', () => {
    expect(rollGold([5, 12], () => 0)).toBe(5);
    expect(rollGold([5, 12], () => 0.999)).toBe(12);
  });
});

describe('applyBattleOutcome — победа', () => {
  const s = freshState();
  const r = applyBattleOutcome(s, { winner: 'player', mob, iid: 'm1', playerHp: 22 }, () => 0);
  it('золото и опыт начислены', () => {
    expect(s.hero.gold).toBe(105); // 100 + 5
    expect(s.hero.xp).toBe(20);
    expect(r.gold).toBe(5);
  });
  it('урон боя сохраняется', () => {
    expect(s.hero.hp).toBe(22);
  });
  it('моб помечен добытым', () => {
    expect(s.clearedMobs).toContain('m1');
  });
});

describe('applyBattleOutcome — поражение', () => {
  const s = freshState();
  const r = applyBattleOutcome(s, { winner: 'enemy', mob, iid: 'm1', playerHp: 0 });
  it('−10% золота на руках', () => {
    expect(s.hero.gold).toBe(90); // 100 - 10
    expect(r.penalty).toBe(10);
  });
  it('HP восстановлен, лагерь (позиция сброшена)', () => {
    expect(s.hero.hp).toBe(60);
    expect(s.playerPos).toBe(null);
  });
  it('моб НЕ помечен добытым', () => {
    expect(s.clearedMobs).not.toContain('m1');
  });
});
