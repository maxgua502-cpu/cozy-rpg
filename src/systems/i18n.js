// Минимальная локализация: ключ → русский текст (задел на языки без библиотек).
// Тексты игры живут в data/i18n/ru.json, идентификаторы в коде — английские.
import ru from '../data/i18n/ru.json';

export function t(key, fallback) {
  return ru[key] ?? fallback ?? key;
}
