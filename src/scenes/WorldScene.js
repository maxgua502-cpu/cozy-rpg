import Phaser from 'phaser';
import meadow from '../data/zones/meadow.json';
import { VirtualJoystick } from '../ui/VirtualJoystick.js';
import { getState } from '../systems/gameState.js';
import { mobRegistry } from '../systems/content.js';

// World: топ-даун мир. Карта берётся из JSON-зоны (контент = данные).
// Сцена отвечает только за отображение и ввод; боевая/прочая логика — в systems.
const PLAYER_SIZE = 28;
const TREE_SIZE = 44;
const SPEED = 220; // пикселей в секунду

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('World');
  }

  create() {
    const zone = meadow;
    this.zone = zone;

    // Границы мира — карта больше экрана, значит будет скролл камеры.
    this.physics.world.setBounds(0, 0, zone.width, zone.height);

    this.drawGround(zone);

    // Деревья-препятствия: статические тела из данных зоны.
    this.trees = [];
    for (const t of zone.trees) {
      const tree = this.add.rectangle(t.x, t.y, TREE_SIZE, TREE_SIZE, 0x2f4a2f);
      tree.setStrokeStyle(3, 0x1e301e);
      this.physics.add.existing(tree, true); // true = статическое тело
      this.trees.push(tree);
    }

    // Мобы на карте (кроме уже добытых). Наступил — начинается бой.
    this.spawnMobs(zone);

    // Персонаж-плейсхолдер. Появляется на сохранённом месте (после боя) или на спавне.
    const start = getState().playerPos ?? zone.spawn;
    this.player = this.add.rectangle(start.x, start.y, PLAYER_SIZE, PLAYER_SIZE, 0xf4c430);
    this.player.setStrokeStyle(3, 0x9c6b1f);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(PLAYER_SIZE, PLAYER_SIZE);

    this.physics.add.collider(this.player, this.trees);
    this.physics.add.overlap(this.player, this.mobSprites, this.onMobTouch, null, this);

    // Камера следует за персонажем в пределах карты.
    this.cameras.main.setBounds(0, 0, zone.width, zone.height);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    // Ввод: клавиатура (стрелки + WASD) и виртуальный джойстик для тача.
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
    });
    this.joystick = new VirtualJoystick(this);

    this.buildHud();
    this.scale.on('resize', this.onResize, this);

    // Маркеры для smoke- и движение-тестов Playwright.
    window.__gameReady = true;
    window.__scene = 'World';
    window.__state = getState();
    window.__world = {
      spawn: { ...zone.spawn },
      trees: zone.trees.map((t) => ({ x: t.x, y: t.y })),
      treeSize: TREE_SIZE,
      playerSize: PLAYER_SIZE,
    };
    this.updatePlayerMarker();
  }

  // Мобы-плейсхолдеры (красные квадраты с именем). Добытые в этой сессии не появляются.
  spawnMobs(zone) {
    const cleared = getState().clearedMobs;
    this.mobSprites = this.physics.add.group();
    for (const spot of zone.mobs ?? []) {
      if (cleared.includes(spot.iid)) continue;
      const def = mobRegistry[spot.mob];
      const sprite = this.add.rectangle(spot.x, spot.y, 40, 40, 0xb5443a);
      sprite.setStrokeStyle(3, 0x7a2822);
      sprite.iid = spot.iid;
      sprite.mobId = spot.mob;
      this.mobSprites.add(sprite);
      this.add
        .text(spot.x, spot.y - 32, def ? def.name : spot.mob, {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#f5efe0',
          backgroundColor: '#00000055',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(0.5);
    }
  }

  onMobTouch(player, mob) {
    if (this.battleStarting) return;
    this.battleStarting = true;
    // Сохраняем позицию, чтобы вернуться на то же место, и уходим в бой.
    getState().playerPos = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    this.player.body.setVelocity(0, 0);
    this.scene.start('Battle', { mobId: mob.mobId, iid: mob.iid });
  }

  // Земля-плейсхолдер: заливка + сетка для ощущения скролла + рамка мира.
  drawGround(zone) {
    const g = this.add.graphics();
    g.fillStyle(0x3a5a40, 1).fillRect(0, 0, zone.width, zone.height);
    g.lineStyle(1, 0x2f4a34, 0.6);
    for (let x = 0; x <= zone.width; x += zone.tile) {
      g.lineBetween(x, 0, x, zone.height);
    }
    for (let y = 0; y <= zone.height; y += zone.tile) {
      g.lineBetween(0, y, zone.width, y);
    }
    g.lineStyle(4, 0x24361f, 1).strokeRect(0, 0, zone.width, zone.height);
    g.setDepth(-10);
  }

  // HUD прикреплён к камере (setScrollFactor 0), поэтому не уезжает с картой.
  buildHud() {
    this.hint = this.add
      .text(12, 12, 'Стрелки / WASD — идти\nтелефон: тап-и-веди слева', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#f5efe0',
        backgroundColor: '#00000055',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(900);
  }

  onResize() {
    // HUD и джойстик работают в экранных координатах — камера сама
    // подстраивает вьюпорт под новый размер/ориентацию. Дополнительных
    // действий не требуется, метод оставлен как точка расширения.
  }

  inputVector() {
    let x = 0;
    let y = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) x -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) x += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) y -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) y += 1;

    if (x !== 0 || y !== 0) {
      const len = Math.hypot(x, y); // нормализуем диагональ, чтобы не быстрее
      return { x: x / len, y: y / len };
    }
    return this.joystick.getVector(); // джойстик уже нормализован
  }

  update() {
    const v = this.inputVector();
    this.player.body.setVelocity(v.x * SPEED, v.y * SPEED);
    this.updatePlayerMarker();
  }

  updatePlayerMarker() {
    window.__playerPos = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    const cam = this.cameras.main;
    window.__camScroll = { x: Math.round(cam.scrollX), y: Math.round(cam.scrollY) };
  }
}
