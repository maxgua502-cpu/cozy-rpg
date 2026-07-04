// Чистая математика виртуального джойстика — без Phaser, тестируется юнитами.
// Принимает смещение пальца от центра (dx, dy) и радиус зоны джойстика,
// возвращает позицию «шляпки» (ограниченную радиусом) и нормализованное
// направление движения с силой наклона от 0 до 1.
export function joystickVector(dx, dy, radius) {
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || radius <= 0) {
    return { thumbX: 0, thumbY: 0, dirX: 0, dirY: 0, magnitude: 0 };
  }
  const clamped = Math.min(dist, radius);
  const nx = dx / dist;
  const ny = dy / dist;
  return {
    thumbX: nx * clamped, // шляпка не вылезает за пределы кольца
    thumbY: ny * clamped,
    dirX: nx, // единичное направление
    dirY: ny,
    magnitude: clamped / radius, // 0 в центре, 1 у края — плавная скорость
  };
}
