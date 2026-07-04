import Phaser from 'phaser';
import { createBattle, resolveRound, randomEnemyPick, picksFor, TYPES } from '../systems/combat.js';
import { buildPlayerSide, buildEnemySide } from '../systems/party.js';
import { applyBattleOutcome } from '../systems/outcome.js';
import { getState } from '../systems/gameState.js';
import { speciesRegistry, mobRegistry } from '../systems/content.js';
import { t } from '../systems/i18n.js';

// Пошаговый бой на отдельной сцене. Обе стороны выбирают вид (тип решает
// треугольник), урон идёт в HP героя. Существа не гибнут — тратятся заряды.
// UI полностью перерисовывается из состояния боя (this.battle) — просто и без
// рассинхрона; состояние живёт в сцене и не теряется при перерисовке.
const OUTCOME_TEXT = { player: 'вы победили', enemy: 'враг победил', draw: 'ничья' };

export class BattleScene extends Phaser.Scene {
  constructor() {
    super('Battle');
  }

  init(data) {
    this.mobId = data.mobId;
    this.iid = data.iid;
  }

  create() {
    const state = getState();
    this.mob = mobRegistry[this.mobId];
    this.battle = createBattle({
      player: buildPlayerSide(state, speciesRegistry),
      enemy: buildEnemySide(this.mob, speciesRegistry),
    });
    this.summary = null;

    this.buildUI();
    this.scale.on('resize', this.buildUI, this);

    // Маркеры/API для e2e-тестов.
    window.__scene = 'Battle';
    window.__battleAPI = {
      pickFirst: () => this.pickFirstAvailable(),
      pickType: (type) => this.pickTypeAvailable(type),
      continue: () => this.scene.start('World'),
      snapshot: () => ({
        over: this.battle.over,
        winner: this.battle.winner,
        playerHp: this.battle.player.hp,
        enemyHp: this.battle.enemy.hp,
      }),
    };
  }

  buildUI() {
    this.children.removeAll(true);
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x2a2320);

    // Враг сверху.
    this.text(W / 2, 18, this.mob.name, 20).setOrigin(0.5, 0);
    this.drawHpBar(W / 2, 54, W - 48, this.battle.enemy.hp, this.battle.enemy.maxHp);

    // Лог раундов.
    const log = this.text(24, 88, this.logLines(), 14).setColor('#d9d0bc');
    log.setWordWrapWidth(W - 48);

    // Герой снизу: HP + панель зверинца.
    const panelTop = Math.max(H - 250, 180);
    this.drawHpBar(W / 2, panelTop - 26, W - 48, this.battle.player.hp, this.battle.player.maxHp);
    if (!this.battle.over) {
      this.text(W / 2, panelTop - 6, t('battle.pickHint'), 13).setOrigin(0.5, 0).setColor('#c9bfa8');
    }
    this.buildMenagerie(panelTop + 18, W);

    if (this.battle.over) this.buildResult(W, H);
  }

  // Панель зверинца: виды сгруппированы по типам, у каждого счётчик зарядов.
  buildMenagerie(top, W) {
    const colW = (W - 16) / 3;
    TYPES.forEach((type, ci) => {
      const cx = 8 + colW * ci + colW / 2;
      this.text(cx, top, t(`type.${type}`), 13).setOrigin(0.5, 0).setColor('#c9bfa8');
      const species = this.battle.player.roster.filter((c) => c.type === type);
      species.forEach((c, i) => {
        this.speciesButton(cx, top + 34 + i * 42, colW - 10, c);
      });
    });
  }

  speciesButton(cx, cy, w, creature) {
    const usable = !this.battle.over && (creature.charges === null || creature.charges > 0);
    const label = `${creature.name}\n${creature.charges === null ? '∞' : '×' + creature.charges}`;

    const box = this.add
      .rectangle(cx, cy, w, 38, usable ? 0x4a5d3a : 0x3a352f)
      .setStrokeStyle(2, 0x6b7d54)
      .setAlpha(usable ? 1 : 0.5);
    this.add
      .text(cx, cy, label, { fontFamily: 'sans-serif', fontSize: '12px', color: '#f5efe0', align: 'center' })
      .setOrigin(0.5)
      .setAlpha(usable ? 1 : 0.5);

    if (usable) {
      box.setInteractive({ useHandCursor: true });
      box.on('pointerup', () => this.onPick(creature.id));
    }
  }

  onPick(playerId) {
    if (this.battle.over) return;
    const enemyId = randomEnemyPick(this.battle);
    resolveRound(this.battle, playerId, enemyId);
    if (this.battle.over) {
      this.summary = applyBattleOutcome(getState(), {
        winner: this.battle.winner,
        mob: this.mob,
        iid: this.iid,
        playerHp: this.battle.player.hp,
      });
      const s = getState();
      window.__lastOutcome = { winner: this.battle.winner, ...this.summary, gold: s.hero.gold, xp: s.hero.xp };
    }
    this.buildUI();
  }

  // Для e2e: тапнуть первый доступный вид.
  pickFirstAvailable() {
    if (this.battle.over) return false;
    const picks = picksFor(this.battle.player);
    if (!picks.length) return false;
    this.onPick(picks[0].id);
    return true;
  }

  pickTypeAvailable(type) {
    if (this.battle.over) return false;
    const c = picksFor(this.battle.player).find((x) => x.type === type);
    if (!c) return false;
    this.onPick(c.id);
    return true;
  }

  logLines() {
    const names = this.nameMap();
    return this.battle.log
      .slice(-6)
      .map((r) => {
        const dmg = r.outcome === 'draw' ? '' : ` (${r.damage})`;
        return `${r.round}: ${names[r.playerPick.id]} › ${names[r.enemyPick.id]} — ${OUTCOME_TEXT[r.outcome]}${dmg}`;
      })
      .join('\n');
  }

  nameMap() {
    const m = {};
    for (const c of this.battle.player.roster) m[c.id] = c.name;
    for (const c of this.battle.enemy.roster) m[c.id] = c.name;
    return m;
  }

  buildResult(W, H) {
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65);
    const win = this.battle.winner === 'player';
    this.text(W / 2, H / 2 - 70, win ? t('battle.youWin') : t('battle.youLose'), 32)
      .setOrigin(0.5)
      .setColor(win ? '#f4c430' : '#d98a8a');

    const detail = win
      ? `+${this.summary.gold} ${t('battle.rewardGold')}   +${this.summary.xp} ${t('battle.rewardXp')}`
      : `−${this.summary.penalty} ${t('battle.penaltyGold')}`;
    this.text(W / 2, H / 2 - 20, detail, 16).setOrigin(0.5);

    const btn = this.add.rectangle(W / 2, H / 2 + 50, 200, 52, 0x4a5d3a).setStrokeStyle(2, 0x6b7d54);
    btn.setInteractive({ useHandCursor: true });
    this.text(W / 2, H / 2 + 50, t('battle.continue'), 18).setOrigin(0.5);
    btn.on('pointerup', () => this.scene.start('World'));
  }

  // — помощники отрисовки —
  text(x, y, s, size) {
    return this.add.text(x, y, s, { fontFamily: 'sans-serif', fontSize: `${size}px`, color: '#f5efe0' });
  }

  drawHpBar(cx, cy, w, hp, maxHp) {
    const ratio = Math.max(0, hp / maxHp);
    this.add.rectangle(cx, cy, w, 20, 0x1c1712).setStrokeStyle(2, 0x000000);
    const color = ratio > 0.5 ? 0x8bbf5a : ratio > 0.25 ? 0xd9b44a : 0xcc5b4a;
    this.add.rectangle(cx - w / 2, cy, w * ratio, 16, color).setOrigin(0, 0.5);
    this.add
      .text(cx, cy, `${Math.max(0, Math.ceil(hp))} / ${maxHp}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}
