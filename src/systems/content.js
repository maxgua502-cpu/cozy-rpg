// Загрузчик контента: собирает реестры видов и мобов из JSON-файлов.
// Добавить существо/моба = добавить JSON-файл, код менять не нужно
// (столп «контент = данные»; import.meta.glob подхватывает файлы автоматически).
import { t } from './i18n.js';

const speciesFiles = import.meta.glob('../data/creatures/*.json', { eager: true });
const mobFiles = import.meta.glob('../data/mobs/*.json', { eager: true });

export const speciesRegistry = {};
for (const path in speciesFiles) {
  const sp = speciesFiles[path].default;
  speciesRegistry[sp.id] = {
    ...sp,
    name: t(`creature.${sp.id}`, sp.id),
    school: sp.school ?? null,
    base: sp.base ?? false,
  };
}

export const mobRegistry = {};
for (const path in mobFiles) {
  const m = mobFiles[path].default;
  mobRegistry[m.id] = { ...m, name: t(`mob.${m.id}`, m.id) };
}

export const baseSpeciesIds = Object.values(speciesRegistry)
  .filter((s) => s.base)
  .map((s) => s.id);
