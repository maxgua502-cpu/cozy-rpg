import { describe, it, expect } from 'vitest';
import { buildPlayerSide, buildEnemySide } from '../src/systems/party.js';

const registry = {
  base_dragon: { id: 'base_dragon', name: 'Дракончик', type: 'dragon', attack: 6, defense: 4, base: true },
  base_dama: { id: 'base_dama', name: 'Дама', type: 'dama', attack: 6, defense: 4, base: true },
  flame_dragon: { id: 'flame_dragon', name: 'Огнедракон', type: 'dragon', attack: 10, defense: 5, school: 'chaos' },
  bold_knight: { id: 'bold_knight', name: 'Дерзкий рыцарь', type: 'knight', attack: 11, defense: 4 },
};

describe('buildPlayerSide', () => {
  const gs = { hero: { hp: 60, maxHp: 60 }, creatures: { flame_dragon: 3 } };
  const side = buildPlayerSide(gs, registry);

  it('HP берётся у героя', () => {
    expect(side.hp).toBe(60);
  });
  it('базовые виды добавлены безлимитными', () => {
    const base = side.roster.filter((c) => c.charges === null).map((c) => c.id);
    expect(base).toContain('base_dragon');
    expect(base).toContain('base_dama');
  });
  it('купленный вид получает численность как заряды', () => {
    const flame = side.roster.find((c) => c.id === 'flame_dragon');
    expect(flame.charges).toBe(3);
    expect(flame.attack).toBe(10);
  });
});

describe('buildEnemySide', () => {
  it('строит ростер моба из его данных', () => {
    const mob = { hp: 45, creatures: [{ species: 'base_dama', count: null }, { species: 'bold_knight', count: 3 }] };
    const side = buildEnemySide(mob, registry);
    expect(side.hp).toBe(45);
    expect(side.roster).toHaveLength(2);
    expect(side.roster.find((c) => c.id === 'bold_knight').charges).toBe(3);
    expect(side.roster.find((c) => c.id === 'base_dama').charges).toBe(null);
  });
  it('падает на неизвестном виде', () => {
    expect(() => buildEnemySide({ hp: 1, creatures: [{ species: 'ghost', count: 1 }] }, registry)).toThrow();
  });
});
