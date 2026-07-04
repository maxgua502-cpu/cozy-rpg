import Phaser from 'phaser';

// World: топ-даун мир. На M0 — пустая сцена-заглушка (трава + подпись),
// на M1 сюда придут карта, персонаж, движение и камера.
export class WorldScene extends Phaser.Scene {
  constructor() {
    super('World');
  }

  create() {
    const { width, height } = this.scale;

    this.label = this.add
      .text(width / 2, height / 2, 'Уютная RPG\nМир загружен', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#f5efe0',
        align: 'center',
      })
      .setOrigin(0.5);

    // Перецентровка подписи при изменении размера окна/повороте телефона.
    this.scale.on('resize', this.onResize, this);

    // Маркер для smoke-теста Playwright: сцена реально создалась.
    window.__gameReady = true;
  }

  onResize(gameSize) {
    if (this.label) {
      this.label.setPosition(gameSize.width / 2, gameSize.height / 2);
    }
  }
}
