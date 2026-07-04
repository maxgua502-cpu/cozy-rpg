import { joystickVector } from '../systems/joystick.js';

// Экранный джойстик для тача. Появляется в точке касания в левой части экрана
// и следует за пальцем; отпустили — прячется. Математика — в systems/joystick.js.
// getVector() отдаёт {x, y} в диапазоне [-1, 1] (сила = наклон), для клавиатуры
// используется отдельный путь — джойстик её не блокирует.
const RADIUS = 60; // радиус кольца, шляпка = 28px → тач-цель ≥ 44px

export class VirtualJoystick {
  constructor(scene) {
    this.scene = scene;
    this.radius = RADIUS;
    this.pointerId = null;
    this.vec = { x: 0, y: 0 };

    this.base = scene.add
      .circle(0, 0, RADIUS, 0xffffff, 0.12)
      .setStrokeStyle(2, 0xffffff, 0.35)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);
    this.thumb = scene.add
      .circle(0, 0, 28, 0xf5efe0, 0.5)
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false);

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
  }

  // Активируем джойстик только в левой половине экрана — правая свободна под
  // будущие кнопки действий; клавиатурный игрок джойстик не трогает.
  onDown(pointer) {
    if (this.pointerId !== null) return;
    if (pointer.x > this.scene.scale.width / 2) return;
    this.pointerId = pointer.id;
    this.originX = pointer.x;
    this.originY = pointer.y;
    this.base.setPosition(pointer.x, pointer.y).setVisible(true);
    this.thumb.setPosition(pointer.x, pointer.y).setVisible(true);
    this.update(pointer);
  }

  onMove(pointer) {
    if (pointer.id !== this.pointerId) return;
    this.update(pointer);
  }

  onUp(pointer) {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.vec = { x: 0, y: 0 };
    this.base.setVisible(false);
    this.thumb.setVisible(false);
  }

  update(pointer) {
    const r = joystickVector(pointer.x - this.originX, pointer.y - this.originY, this.radius);
    this.thumb.setPosition(this.originX + r.thumbX, this.originY + r.thumbY);
    this.vec = { x: r.dirX * r.magnitude, y: r.dirY * r.magnitude };
  }

  getVector() {
    return this.vec;
  }

  get active() {
    return this.pointerId !== null;
  }
}
