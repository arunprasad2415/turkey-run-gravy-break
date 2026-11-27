/* The run itself: the state machine from title to ending, the camera, scoring, and the order things
   are drawn in. It owns the stage, the turkey, the farmer and the hazards, and it is the only place
   that decides a stage is over. */

import { VIEW, FLOW, SCORE, PALETTE as P } from './config.js';
import { clamp, lerp } from './random.js';
import { buildStage, stageCount, distanceToExit } from './world.js';
import { Player } from './player.js';
import { Farmer } from './farmer.js';
import { Knives, Ovens } from './hazards.js';
import { drawGround, drawGrassPatch, drawCorn, drawHayBale, drawFence, drawTree, drawBarrel,
  drawOven, drawKnife, drawJet, drawExit, drawTurkey, drawFarmer, drawVisionCone, drawShadow,
  drawPumpkin, vignette } from './art.js';
import { drawHud } from './hud.js';
import { drawTitle, drawStageCard, drawStageClear, drawEnd, drawPause } from './screens.js';

const STATE = {
  TITLE: 'title',
  STAGE_CARD: 'stagecard',
  PLAYING: 'playing',
  STAGE_CLEAR: 'stageclear',
  ENDED: 'ended',
  PAUSED: 'paused',
};

export class Game {
  constructor(ctx, canvas, input, audio) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.input = input;
    this.audio = audio;
    this.time = 0;
    this.state = STATE.TITLE;
    this.camera = { x: VIEW.w / 2, y: VIEW.h / 2 };
    this.shake = 0;
    this.bestScore = 0;
    this.resetToTitle();
  }

  resetToTitle() {
    this.state = STATE.TITLE;
    this.time = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.runTime = 0;
    this.totalDistance = 0;
    this.totalCorn = 0;
    this.totalCornTotal = 0;
    this.lifeBonus = 0;
    this.outcome = null;
    this.endTimer = 0;
    this.recap = null;
    this.stage = buildStage(0);
    this.player = new Player(this.stage);
    this.farmer = new Farmer(this.stage);
    this.knives = new Knives(this.stage, this.stage.rng);
    this.ovens = new Ovens(this.stage);
    this.camera.x = this.stage.start.x;
    this.camera.y = this.stage.start.y;
    this.alert = 'patrol';
  }

  startRun() {
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.runTime = 0;
    this.totalDistance = 0;
    this.totalCorn = 0;
    this.totalCornTotal = 0;
    this.lifeBonus = 0;
    this.outcome = null;
    this.endTimer = 0;
    this.recap = null;
    this.player = new Player(buildStage(0));
    this.player.lives = 3;
    this.loadStage(0);
    this.audio.ui();
  }

  loadStage(index) {
    const stage = buildStage(index);
    this.stage = stage;
    this.player.resetTo(stage, stage.start);
    this.player.invuln = 0.6;
    this.farmer = new Farmer(stage);
    this.knives = new Knives(stage, stage.rng);
    this.ovens = new Ovens(stage);
    this.cornTaken = 0;
    this.cornTotal = stage.corn.length;
    this.stageTime = 0;
    this.cardTimer = FLOW.stageIntro;
    this.alert = 'patrol';
    this.state = STATE.STAGE_CARD;
    this.camera.x = clamp(stage.start.x, VIEW.w / 2, stage.bounds.w - VIEW.w / 2);
    this.camera.y = clamp(stage.start.y, VIEW.h / 2, stage.bounds.h - VIEW.h / 2);
    this.audio.gobble();
  }

  nextStage() {
    if (this.stage.index + 1 >= stageCount()) {
      this.finish('escaped');
      return;
    }
    this.loadStage(this.stage.index + 1);
  }

  finish(outcome) {
    this.outcome = outcome;
    this.state = STATE.ENDED;
    this.endTimer = 0;
    if (outcome === 'escaped') {
      this.lifeBonus = this.player.lives * SCORE.lifeLeft;
      this.score += this.lifeBonus;
      this.audio.escape();
    } else {
      this.audio.caught();
    }
  }

  update(dt) {
    this.time += dt;
    const input = this.input;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3.5);

    if (input.pressed('mute')) {
      const muted = this.audio.toggle();
      this.lastMessage = muted ? 'sound off' : 'sound on';
    }

    switch (this.state) {
      case STATE.TITLE:
        if (input.pressed('start') || input.pressed('dash') || input.pointer.clicked) {
          this.startRun();
        }
        break;
      case STATE.STAGE_CARD: {
        this.cardTimer -= dt;
        this.updateCamera(dt, true);
        if (this.cardTimer <= 0 || input.pressed('start') || input.pointer.clicked) {
          this.state = STATE.PLAYING;
        }
        break;
      }
      case STATE.PLAYING:
        this.updatePlaying(dt);
        break;
      case STATE.STAGE_CLEAR:
        this.recap.timer -= dt;
        if (this.recap.timer <= 0 || input.pressed('start') || input.pressed('dash') || input.pointer.clicked) {
          this.nextStage();
        }
        break;
      case STATE.ENDED:
        this.endTimer += dt;
        if (this.endTimer > FLOW.endDelay && (input.pressed('restart') || input.pointer.clicked || input.pressed('start'))) {
          this.startRun();
        }
        break;
      case STATE.PAUSED:
        if (input.pressed('pause')) {
          this.state = STATE.PLAYING;
          this.audio.ui();
        } else if (input.pressed('restart')) {
          this.startRun();
        }
        break;
      default:
        break;
    }

    input.endFrame();
  }

  updatePlaying(dt) {
    const input = this.input;
    if (input.pressed('pause')) {
      this.state = STATE.PAUSED;
      this.audio.ui();
      return;
    }
    if (input.pressed('restart')) {
      this.startRun();
      return;
    }

    this.runTime += dt;
    this.stageTime += dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    const travelled = this.player.distance;
    const reachedExit = this.player.update(dt, input, this.stage, this.audio);
    const moved = Math.max(0, this.player.distance - travelled);
    this.score += moved / SCORE.distancePerPoint;
    this.totalDistance += moved;

    if (input.pressed('gobble')) {
      this.audio.gobble();
      this.farmer.hearGobble({ x: this.player.x, y: this.player.y });
    }

    this.farmer.update(dt, this.stage, this.player, this.audio);
    this.alert = this.farmer.state === 'chase' ? 'chase' : this.farmer.alert;
    if (this.farmer.state === 'investigate' && this.farmer.lastSeen
      && Math.hypot(this.farmer.lastSeen.x - this.farmer.x, this.farmer.lastSeen.y - this.farmer.y) < 30) {
      this.farmer.state = 'search';
      this.farmer.alert = 'search';
    }

    const knifeHit = this.knives.update(dt, this.player, this.audio);
    if (knifeHit) this.damage(knifeHit);

    const ovenHit = this.ovens.update(dt, this.player, this.audio);
    if (ovenHit) this.damage({ x: this.player.x - 20, y: this.player.y });

    if (this.farmer.state === 'chase'
      && Math.hypot(this.farmer.x - this.player.x, this.farmer.y - this.player.y) < 38) {
      if (this.damage({ x: this.farmer.x, y: this.farmer.y })) {
        this.player.resetTo(this.stage, this.stage.start);
        this.farmer.reset(this.stage);
      }
    }

    this.collectCorn();
    this.updateCamera(dt, false);

    if (reachedExit && this.state === STATE.PLAYING) this.clearStage();
  }

  damage(from) {
    if (!this.player.takeHit(this.stage, from, this.audio)) return false;
    this.combo = 0;
    this.shake = 1;
    this.flashDamage = 0.35;
    if (this.player.lives <= 0) this.finish('caught');
    return true;
  }

  collectCorn() {
    for (const corn of this.stage.corn) {
      if (corn.taken) continue;
      if (Math.hypot(corn.x - this.player.x, corn.y - this.player.y) > 32) continue;
      corn.taken = true;
      this.cornTaken += 1;
      this.totalCorn += 1;
      this.combo = this.combo > 0 && this.comboTimer > 0 ? Math.min(5, this.combo + 1) : 1;
      this.comboTimer = SCORE.comboWindow;
      const value = Math.round(SCORE.corn * (1 + (this.combo - 1) * SCORE.comboStep));
      corn.value = value;
      corn.combo = this.combo;
      this.score += value;
      this.audio.corn();
    }
  }

  clearStage() {
    const timeBonus = Math.max(0, Math.round(SCORE.timeBonusMax - this.stageTime * 4));
    const bonus = SCORE.stageClear + timeBonus;
    this.score += bonus;
    this.audio.stageClear();
    this.recap = {
      corn: this.cornTaken,
      cornTotal: this.cornTotal,
      bonus,
      time: this.stageTime,
      last: this.stage.index + 1 >= stageCount(),
      timer: FLOW.stageClearHold,
    };
    this.state = STATE.STAGE_CLEAR;
  }

  updateCamera(dt, snap) {
    const targetX = clamp(this.player.x, VIEW.w / 2, this.stage.bounds.w - VIEW.w / 2);
    const targetY = clamp(this.player.y - 30, VIEW.h / 2, this.stage.bounds.h - VIEW.h / 2);
    const k = snap ? 1 : 1 - Math.pow(1 - FLOW.cameraLag, dt * 60);
    this.camera.x = lerp(this.camera.x, targetX, k);
    this.camera.y = lerp(this.camera.y, targetY, k);
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, VIEW.w, VIEW.h);
    const shakeX = this.shake > 0 ? Math.sin(this.time * 70) * this.shake * 9 : 0;
    const shakeY = this.shake > 0 ? Math.cos(this.time * 61) * this.shake * 7 : 0;
    ctx.translate(VIEW.w / 2 - this.camera.x + shakeX, VIEW.h / 2 - this.camera.y + shakeY);

    drawGround(ctx, this.stage, this.camera);
    for (const patch of this.stage.grass) drawGrassPatch(ctx, patch, this.time);

    this.drawScene();

    ctx.restore();

    if (this.state === STATE.TITLE) {
      drawTitle(ctx, this);
    } else {
      drawHud(ctx, this);
      if (this.state === STATE.STAGE_CARD) drawStageCard(ctx, this);
      if (this.state === STATE.STAGE_CLEAR) drawStageClear(ctx, this);
      if (this.state === STATE.ENDED) drawEnd(ctx, this);
      if (this.state === STATE.PAUSED) drawPause(ctx, this);
    }
    vignette(ctx);
  }

  /* One sorted pass for everything with a foot position, so the bird walks in front of the hay bale
     it just came around and behind the next one. */
  drawScene() {
    const ctx = this.ctx;
    const drawables = [];
    const push = (y, fn) => drawables.push({ y, fn });

    for (const prop of this.stage.props) {
      push(prop.y + (prop.h || 40) / 2, () => {
        if (prop.type === 'hay') drawHayBale(ctx, prop);
        else if (prop.type === 'fence') drawFence(ctx, prop);
        else if (prop.type === 'tree') drawTree(ctx, prop);
        else if (prop.type === 'barrel') drawBarrel(ctx, prop);
        else if (prop.type === 'counter') {
          drawShadow(ctx, prop.x + prop.w / 2, prop.y + prop.h, prop.w / 2, 12, 0.2);
          ctx.fillStyle = '#7a4c28';
          ctx.fillRect(prop.x, prop.y, prop.w, prop.h);
          ctx.strokeStyle = P.ink;
          ctx.lineWidth = 3;
          ctx.strokeRect(prop.x, prop.y, prop.w, prop.h);
          ctx.fillStyle = '#9c6a3a';
          ctx.fillRect(prop.x + 6, prop.y + 6, prop.w - 12, 14);
        }
      });
    }

    for (const oven of this.ovens.ovens) {
      push(oven.y + oven.h * 0.5, () => {
        drawOven(ctx, oven, oven.strength || 0);
        if (oven.strength > 0.05) {
          drawJet(ctx, this.ovens.jetOf(oven), Math.min(1.2, oven.strength));
        }
      });
    }

    for (const corn of this.stage.corn) {
      if (corn.taken) continue;
      push(corn.y, () => drawCorn(ctx, corn, this.time));
    }

    for (const decor of this.stage.decor || []) {
      push(decor.y, () => drawPumpkin(ctx, decor));
    }

    if (this.state !== STATE.ENDED || this.outcome === 'escaped') {
      push(this.stage.exit.y + 40, () => drawExit(ctx, this.stage.exit, true));
    }

    for (const knife of this.knives.items) {
      push(knife.y - 2, () => drawKnife(ctx, knife));
    }

    push(this.farmer.y, () => {
      drawVisionCone(ctx, { x: this.farmer.x, y: this.farmer.y - 10 }, this.farmer.facing,
        this.farmer.state === 'chase' ? 250 : 336, 0.62, this.farmer.state === 'chase');
      drawFarmer(ctx, {
        x: this.farmer.x,
        y: this.farmer.y,
        facing: this.farmer.facing,
        step: this.farmer.step,
        alert: this.farmer.state === 'chase' ? 'chase' : this.farmer.alert,
      });
    });

    push(this.player.y, () => {
      for (const ghost of this.player.trail) {
        ctx.save();
        ctx.globalAlpha = ghost.life * 1.6;
        ctx.fillStyle = '#f7e7c8';
        ctx.beginPath();
        ctx.ellipse(ghost.x, ghost.y, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      drawTurkey(ctx, {
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
        step: this.player.step,
        hidden: this.player.hidden,
        flash: this.player.flash,
        dashGlow: this.player.dashTimer > 0 ? 0.5 : 0,
        wobble: this.player.moving ? 0 : Math.sin(this.time * 2) * 1.2,
      });
    });

    drawables.sort((a, b) => a.y - b.y);
    for (const item of drawables) item.fn();

    if (this.state === STATE.PLAYING || this.state === STATE.STAGE_CLEAR) {
      const away = distanceToExit(this.stage, this.player.x, this.player.y);
      if (away > 240) this.drawExitArrow(away);
    }
  }

  /* A chalk arrow at the screen edge pointing at the way out, so a player who has wandered off a
     stage never has to guess which way the escape lies. */
  drawExitArrow(distance) {
    const ctx = this.ctx;
    const gate = this.stage.exit;
    const angle = Math.atan2(gate.y - this.player.y, gate.x - this.player.x);
    const radius = 300;
    const x = this.player.x + Math.cos(angle) * radius;
    const y = this.player.y + Math.sin(angle) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#f7e7c8';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#f7e7c8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(distance)}m to the way out`, x, y + 24);
    ctx.restore();
  }
}