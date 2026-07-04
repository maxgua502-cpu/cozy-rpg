// Сборка сторон боя из данных — чистая логика (без Phaser, без загрузки файлов).
// Реестр видов передаётся аргументом, поэтому модуль тестируется юнитами.

// Превращает список {species, count} в ростер боевых существ.
// count === null → безлимитный вид (charges: null).
function toRoster(entries, registry) {
  return entries.map((e) => {
    const sp = registry[e.species];
    if (!sp) throw new Error(`неизвестный вид: ${e.species}`);
    return {
      id: sp.id,
      name: sp.name,
      type: sp.type,
      attack: sp.attack,
      defense: sp.defense,
      school: sp.school ?? null,
      charges: e.count, // число или null (безлимит)
    };
  });
}

// Ростер игрока: базовые виды (безлимитные) + купленные с их численностью.
export function buildPlayerSide(gameState, registry) {
  const base = Object.values(registry)
    .filter((s) => s.base)
    .map((s) => ({ species: s.id, count: null }));
  const owned = Object.entries(gameState.creatures).map(([species, count]) => ({ species, count }));
  return {
    hp: gameState.hero.hp,
    maxHp: gameState.hero.maxHp,
    roster: toRoster([...base, ...owned], registry),
  };
}

// Ростер моба целиком из его данных.
export function buildEnemySide(mob, registry) {
  return {
    hp: mob.hp,
    maxHp: mob.hp,
    roster: toRoster(mob.creatures, registry),
  };
}
