import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { BattleScene } from './scenes/BattleScene.js';

// Точка входа. Логика игры живёт в src/systems (чистый JS, без Phaser);
// сцены отвечают только за отображение и ввод (см. CLAUDE.md, столп архитектуры №1).
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#3a5a40', // тёплая трава-плейсхолдер
  scale: {
    mode: Phaser.Scale.RESIZE, // заполняем экран телефона/ПК целиком
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  render: {
    pixelArt: true,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene, WorldScene, BattleScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
