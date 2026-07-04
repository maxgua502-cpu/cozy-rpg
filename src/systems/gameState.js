// Единый источник состояния (столп №3). Пока живёт в памяти сессии;
// сохранение в localStorage и экспорт/импорт придут в задаче 3.6.
import balance from '../data/balance.json';

export function createInitialState() {
  return {
    hero: {
      level: 1,
      xp: 0,
      hp: balance.hero.startHp,
      maxHp: balance.hero.startHp,
      gold: balance.hero.startGold,
    },
    // Купленные виды: id → численность (заряды на бой). Базовые виды безлимитны
    // и в этом списке не хранятся.
    creatures: {
      flame_dragon: 3,
      guard_dama: 2,
      bold_knight: 2,
      storm_dragon: 2,
      mist_dama: 2,
    },
    clearedMobs: [], // iid добытых мобов на карте
    playerPos: null, // сохраняется перед боем, чтобы вернуться на то же место
  };
}

let state = createInitialState();

export function getState() {
  return state;
}

export function resetState() {
  state = createInitialState();
}
