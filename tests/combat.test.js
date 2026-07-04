import { describe, it, expect } from 'vitest';
import {
  TYPES,
  judgeRound,
  roundDamage,
  createBattle,
  resolveRound,
  picksFor,
  randomEnemyPick,
} from '../src/systems/combat.js';

// 2.1 verify: тесты покрывают все 9 исходов раунда (3×3 типа).
describe('judgeRound — все 9 исходов треугольника', () => {
  const expected = {
    'dragon,dragon': 'draw',
    'dragon,dama': 'player',
    'dragon,knight': 'enemy',
    'dama,dragon': 'enemy',
    'dama,dama': 'draw',
    'dama,knight': 'player',
    'knight,dragon': 'player',
    'knight,dama': 'enemy',
    'knight,knight': 'draw',
  };
  for (const p of TYPES) {
    for (const e of TYPES) {
      it(`${p} vs ${e} → ${expected[`${p},${e}`]}`, () => {
        expect(judgeRound(p, e)).toBe(expected[`${p},${e}`]);
      });
    }
  }
});

describe('roundDamage', () => {
  it('атака минус защита', () => {
    expect(roundDamage({ attack: 10 }, { defense: 4 })).toBe(6);
  });
  it('не меньше 1, даже если защита больше атаки', () => {
    expect(roundDamage({ attack: 3 }, { defense: 99 })).toBe(1);
  });
});

function side(hp, roster) {
  return { hp, maxHp: hp, roster };
}
const dragon = (id, over = {}) => ({ id, name: id, type: 'dragon', attack: 8, defense: 3, charges: null, ...over });
const dama = (id, over = {}) => ({ id, name: id, type: 'dama', attack: 8, defense: 3, charges: null, ...over });
const knight = (id, over = {}) => ({ id, name: id, type: 'knight', attack: 8, defense: 3, charges: null, ...over });

describe('resolveRound', () => {
  it('победа игрока бьёт по HP врага', () => {
    const b = createBattle({ player: side(50, [dragon('d')]), enemy: side(50, [dama('m')]) });
    const r = resolveRound(b, 'd', 'm');
    expect(r.outcome).toBe('player');
    expect(r.damage).toBe(5); // 8 - 3
    expect(b.enemy.hp).toBe(45);
    expect(b.player.hp).toBe(50);
  });

  it('победа врага бьёт по HP игрока', () => {
    const b = createBattle({ player: side(50, [dragon('d')]), enemy: side(50, [knight('k')]) });
    const r = resolveRound(b, 'd', 'k');
    expect(r.outcome).toBe('enemy');
    expect(b.player.hp).toBe(45);
    expect(b.enemy.hp).toBe(50);
  });

  it('ничья — никто не теряет HP', () => {
    const b = createBattle({ player: side(50, [dragon('d')]), enemy: side(50, [dragon('e')]) });
    const r = resolveRound(b, 'd', 'e');
    expect(r.outcome).toBe('draw');
    expect(b.player.hp).toBe(50);
    expect(b.enemy.hp).toBe(50);
  });

  it('заряды тратятся, безлимитные — нет', () => {
    const limited = dragon('lim', { charges: 1 });
    const b = createBattle({ player: side(50, [limited, dama('base')]), enemy: side(50, [dama('m')]) });
    resolveRound(b, 'lim', 'm');
    const after = b.player.roster.find((c) => c.id === 'lim');
    expect(after.charges).toBe(0);
    expect(picksFor(b.player).map((c) => c.id)).toEqual(['base']); // выдохшийся вид ушёл
    expect(b.player.roster.find((c) => c.id === 'base').charges).toBe(null);
  });

  it('нельзя ходить видом без зарядов', () => {
    const b = createBattle({ player: side(50, [dragon('d', { charges: 0 })]), enemy: side(50, [dama('m')]) });
    expect(() => resolveRound(b, 'd', 'm')).toThrow();
  });

  it('бой завершается победой при HP врага ≤ 0', () => {
    const b = createBattle({ player: side(50, [dragon('d', { attack: 100 })]), enemy: side(5, [dama('m')]) });
    resolveRound(b, 'd', 'm');
    expect(b.over).toBe(true);
    expect(b.winner).toBe('player');
  });

  it('бой завершается поражением при HP игрока ≤ 0', () => {
    const b = createBattle({ player: side(5, [dragon('d')]), enemy: side(50, [knight('k', { attack: 100 })]) });
    resolveRound(b, 'd', 'k');
    expect(b.over).toBe(true);
    expect(b.winner).toBe('enemy');
  });

  it('после завершения раунд не разрешается', () => {
    const b = createBattle({ player: side(5, [dragon('d')]), enemy: side(1, [dama('m')]) });
    resolveRound(b, 'd', 'm');
    expect(() => resolveRound(b, 'd', 'm')).toThrow();
  });
});

describe('randomEnemyPick', () => {
  it('выбирает только из доступных видов', () => {
    const b = createBattle({
      player: side(50, [dragon('d')]),
      enemy: side(50, [dama('m', { charges: 0 }), knight('k')]),
    });
    // при любом rng вернётся доступный вид (k), выдохшийся (m) исключён
    expect(randomEnemyPick(b, () => 0)).toBe('k');
    expect(randomEnemyPick(b, () => 0.99)).toBe('k');
  });
});
