/* The turkey the player drives: a walk, a sprint that spends stamina, a flap-dash that buys a body
   length of daylight, and the small state a hit leaves behind (a flash and a moment of immunity).
   It reads input, never the canvas, and reports what it touched so the game can score it. */

import { PLAYER } from './config.js';
import { clamp } from './random.js';
import { slideMove, inTallGrass, insideExit, blockedAt } from './world.js';

export class Player {
  constructor(stage) {
    this.x = stage.start.x;
    this.y = stage.start.y;
    this.radius = PLAYER.radius;
    this.facing = 0;
    this.step = 0;
    this.stamina = PLAYER.staminaMax;
    this.lives = 3;
    this.invuln = 0;
    this.flash = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.hidden = false;
    this.sprinting = false;
    this.moving = false;
    this.distance = 0;
    this.trail = [];
  }

  get alive() {
    return this.lives > 0;
  }

  place(stage, point) {
    this.x = point.x;
    this.y = point.y;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.invuln = 1.1;
    this.trail.length = 0;
  }

  update(dt, input, stage, audio) {
    const axis = input.axis();
    const wantsSprint = input.down('sprint') && this.stamina > 1;
    const dashing = this.dashTimer > 0;

    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.invuln > 0) this.invuln -= dt;

    if (input.pressed('dash') && this.dashCooldown <= 0 && this.stamina >= PLAYER.dashCost) {
      this.dashTimer = PLAYER.dashTime;
      this.dashCooldown = PLAYER.dashCooldown;
      this.stamina -= PLAYER.dashCost;
      audio.dash();
      audio.gobble();
    }

    let speed = wantsSprint && this.stamina > 0 ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
    if (this.dashTimer > 0) speed = PLAYER.dashSpeed;
    if (this.invuln > 0.55) speed *= 0.55;

    this.sprinting = wantsSprint && (axis.x !== 0 || axis.y !== 0) && this.dashTimer <= 0;
    if (this.sprinting) {
      this.stamina = clamp(this.stamina - PLAYER.sprintCost * dt, 0, PLAYER.staminaMax);
    } else {
      this.stamina = clamp(this.stamina + PLAYER.staminaRegen * dt, 0, PLAYER.staminaMax);
    }

    const before = { x: this.x, y: this.y };
    if (axis.x !== 0 || axis.y !== 0) {
      this.facing = Math.atan2(axis.y, axis.x);
      this.moving = true;
      slideMove(stage, this, axis.x * speed * dt, axis.y * speed * dt);
      this.step += dt * (speed / PLAYER.walkSpeed);
    } else {
      this.moving = false;
    }
    const travelled = Math.hypot(this.x - before.x, this.y - before.y);
    this.distance += travelled;

    if (this.dashTimer > 0) {
      this.trail.unshift({ x: this.x, y: this.y, life: 0.22 });
      if (this.trail.length > 8) this.trail.pop();
    }
    for (const ghost of this.trail) ghost.life -= dt;
    this.trail = this.trail.filter((ghost) => ghost.life > 0);

    const patch = inTallGrass(stage, this.x, this.y);
    this.hidden = Boolean(patch) && !this.sprinting;
    this.flash = this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0;

    const gate = stage.exit;
    if (blockedAt(stage, gate.x, gate.y, 1)) {
      // A gate can never be bricked in; this only guards a bad blueprint at load time.
      stage.exit.x = gate.x;
    }
    return insideExit(stage, this.x, this.y);
  }

  takeHit(stage, from, audio) {
    if (this.invuln > 0 || !this.alive) return false;
    this.lives -= 1;
    this.invuln = PLAYER.hitInvuln;
    this.dashTimer = 0;
    const angle = Math.atan2(this.y - from.y, this.x - from.x);
    slideMove(stage, this, Math.cos(angle) * PLAYER.caughtShove * 0.1, Math.sin(angle) * PLAYER.caughtShove * 0.1);
    audio.knifeHit();
    return true;
  }

  resetTo(stage, point) {
    this.x = point.x;
    this.y = point.y;
    this.stamina = PLAYER.staminaMax;
    this.invuln = 1.4;
    this.trail.length = 0;
  }
}