/* The two authors of "dinner": carving knives falling out of the ceiling on a telegraph, and the
   ovens breathing a jet of heat across the kitchen floor. Both announce themselves before they hurt,
   so a run is lost to a bad read and not to a surprise. */

import { KNIFE, OVEN } from './config.js';
import { randomOpenPoint } from './world.js';

export class Knives {
  constructor(stage, rng) {
    this.stage = stage;
    this.rng = rng;
    this.items = [];
    this.timer = stage.knives.rate > 0 ? stage.knives.rate * 0.8 : Infinity;
  }

  update(dt, player, audio) {
    const stage = this.stage;
    if (stage.knives.rate > 0) {
      this.timer -= dt;
      if (this.timer <= 0 && this.items.filter((k) => k.phase !== 'idle').length < stage.knives.max) {
        const spot = randomOpenPoint(stage, this.rng, player, 150, 430);
        this.items.push({
          x: spot.x,
          y: spot.y,
          phase: 'telegraph',
          timer: KNIFE.telegraph,
          telegraph: KNIFE.telegraph,
          fallProgress: 0,
        });
        audio.knifeWarn();
        this.timer = stage.knives.rate * this.rng.range(0.75, 1.35);
      }
    }

    let hit = null;
    for (const knife of this.items) {
      if (knife.phase === 'telegraph') {
        knife.timer -= dt;
        if (knife.timer <= 0) {
          knife.phase = 'fall';
          knife.fallProgress = 0;
        }
      } else if (knife.phase === 'fall') {
        knife.fallProgress += dt / KNIFE.fall;
        if (knife.fallProgress >= 1) {
          knife.phase = 'idle';
          knife.timer = KNIFE.life;
          audio.knifeHit();
          if (Math.hypot(knife.x - player.x, knife.y - player.y) < KNIFE.hitRadius + player.radius) {
            hit = knife;
          }
        }
      } else {
        knife.timer -= dt;
      }
    }
    this.items = this.items.filter((k) => k.phase !== 'idle' || k.timer > 0);
    return hit;
  }

  clear() {
    this.items.length = 0;
  }
}

export class Ovens {
  constructor(stage) {
    this.ovens = stage.ovens.map((oven, index) => ({ ...oven, offset: index * 0.85 }));
    this.hummed = new Map();
    this.time = 0;
  }

  /* Each oven runs the same cycle with its own phase: a warning glow, then the jet, then rest. */
  update(dt, player, audio) {
    this.time += dt;
    let hit = false;
    for (let i = 0; i < this.ovens.length; i += 1) {
      const oven = this.ovens[i];
      const local = (this.time + oven.offset) % OVEN.cycle;
      const warnStart = OVEN.cycle - OVEN.warn - OVEN.jet;
      oven.strength = 0;
      if (local > warnStart && local <= warnStart + OVEN.warn) {
        oven.strength = (local - warnStart) / OVEN.warn;
        oven.phase = 'warn';
      } else if (local > warnStart + OVEN.warn) {
        const t = (local - warnStart - OVEN.warn) / OVEN.jet;
        oven.strength = Math.sin(Math.min(1, t) * Math.PI) * 1.1 + 0.2;
        oven.phase = 'jet';
        if (!this.hummed.get(i)) {
          audio.flame();
          this.hummed.set(i, true);
        }
        if (this.playerInJet(oven, player)) hit = true;
      } else {
        oven.phase = 'rest';
        if (local < 0.1) this.hummed.set(i, false);
        if (this.hummed.get(i) && local > 0.1) this.hummed.set(i, false);
      }
    }
    return hit;
  }

  playerInJet(oven, player) {
    const cx = oven.x + oven.w / 2;
    const cy = oven.y + oven.h / 2;
    const dx = player.x - cx;
    const dy = player.y - cy;
    const along = dx * Math.cos(oven.angle) + dy * Math.sin(oven.angle);
    const across = -dx * Math.sin(oven.angle) + dy * Math.cos(oven.angle);
    return along > 20 && along < OVEN.jetLength + 30 && Math.abs(across) < OVEN.jetHalfWidth + player.radius * 0.5;
  }

  jetOf(oven) {
    const cx = oven.x + oven.w / 2;
    const cy = oven.y + oven.h / 2;
    return {
      x: cx + Math.cos(oven.angle) * 16,
      y: cy + Math.sin(oven.angle) * 16,
      angle: oven.angle,
      length: OVEN.jetLength,
      halfWidth: OVEN.jetHalfWidth,
    };
  }
}