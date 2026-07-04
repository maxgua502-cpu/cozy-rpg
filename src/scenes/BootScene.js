import Phaser from 'phaser';

// Boot: точка первичной загрузки. Пока ассетов нет — сразу уходим в мир.
// Позже здесь будет прелоад атласов, шрифтов и загрузка сейва.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // ассеты появятся на M1/M6
  }

  create() {
    this.scene.start('World');
  }
}
