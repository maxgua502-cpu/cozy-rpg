// Ядро боя — чистая логика без Phaser (столп архитектуры №1).
// Пошаговый бой «дракон-дама-рыцарь»: обе стороны выбирают вид существа,
// тип решает треугольник, урон идёт в HP героя проигравшей стороны.
// Существа не гибнут — тратятся только заряды (численность вида на бой).

export const TYPES = ['dragon', 'dama', 'knight'];

// Треугольник (решение №4): Дракон бьёт Даму, Дама — Рыцаря, Рыцарь — Дракона.
const BEATS = { dragon: 'dama', dama: 'knight', knight: 'dragon' };

// Исход раунда по типам: 'player' | 'enemy' | 'draw'. Ничья = одинаковый тип.
export function judgeRound(playerType, enemyType) {
  if (playerType === enemyType) return 'draw';
  return BEATS[playerType] === enemyType ? 'player' : 'enemy';
}

// Урон = атака существа-победителя − защита существа проигравшего, минимум 1.
export function roundDamage(winner, loser) {
  return Math.max(1, winner.attack - loser.defense);
}

// Существо в ростере: { id, name, type, attack, defense, charges, school? }.
// charges === null → безлимитный вид (базовая тройка, защита от софтлока).
function cloneSide(side) {
  return {
    hp: side.hp,
    maxHp: side.maxHp,
    roster: side.roster.map((c) => ({ ...c })),
  };
}

export function createBattle({ player, enemy }) {
  return {
    player: cloneSide(player),
    enemy: cloneSide(enemy),
    round: 0,
    log: [],
    over: false,
    winner: null, // 'player' | 'enemy'
  };
}

// Виды, доступные для хода: с зарядами или безлимитные.
export function picksFor(side) {
  return side.roster.filter((c) => c.charges === null || c.charges > 0);
}

function takeAvailable(side, id) {
  const c = side.roster.find((x) => x.id === id);
  if (!c) throw new Error(`вид ${id} не найден в ростере`);
  if (c.charges !== null && c.charges <= 0) throw new Error(`у вида ${id} нет зарядов`);
  if (c.charges !== null) c.charges -= 1; // безлимитные не тратятся
  return c;
}

// Разрешить один раунд: обе стороны назвали id вида. Мутирует battle
// (единый источник состояния боя) и возвращает описание результата.
export function resolveRound(battle, playerId, enemyId) {
  if (battle.over) throw new Error('бой уже завершён');

  const pc = takeAvailable(battle.player, playerId);
  const ec = takeAvailable(battle.enemy, enemyId);
  battle.round += 1;

  const outcome = judgeRound(pc.type, ec.type);
  let damage = 0;
  if (outcome === 'player') {
    damage = roundDamage(pc, ec);
    battle.enemy.hp = Math.max(0, battle.enemy.hp - damage);
  } else if (outcome === 'enemy') {
    damage = roundDamage(ec, pc);
    battle.player.hp = Math.max(0, battle.player.hp - damage);
  }

  const result = {
    round: battle.round,
    outcome,
    damage,
    playerPick: { id: pc.id, type: pc.type },
    enemyPick: { id: ec.id, type: ec.type },
  };
  battle.log.push(result);

  if (battle.enemy.hp <= 0) {
    battle.over = true;
    battle.winner = 'player';
  } else if (battle.player.hp <= 0) {
    battle.over = true;
    battle.winner = 'enemy';
  }
  return result;
}

// ИИ врага в MVP — случайный доступный вид (решение №24: без чтения хода игрока).
export function randomEnemyPick(battle, rng = Math.random) {
  const picks = picksFor(battle.enemy);
  return picks[Math.floor(rng() * picks.length)].id;
}
