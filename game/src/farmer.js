/* The farmer. He walks his round, and the moment the turkey crosses his cone with something solid
   behind it he gives chase; if it breaks the line he slows to a search around the last place he saw
   it, then walks back to his round. The states are deliberately few and readable, because a chase
   the player can predict is a chase the player can beat. */

import { FARMER } from './config.js';
import { angleDelta, dist2 } from './random.js';
import { sightBlocked, inTallGrass, slideMove } from './world.js';

const STATE = {
  PATROL: 'patrol',
  INVESTIGATE: 'investigate',
  CHASE: 'chase',
  SEARCH: 'search',
};

export class Farmer {
  constructor(stage) {
    this.x = stage.farmer.x;
    this.y = stage.farmer.y;
    this.radius = FARMER.radius;
    this.facing = 0;
    this.step = 0;
    this.state = STATE.PATROL;
    this.waypoint = 0;
    this.waypoints = stage.farmer.waypoints;
    this.lastSeen = null;
    this.lostTimer = 0;
    this.searchTimer = 0;
    this.searchAngle = 0;
    this.pauseTimer = 0;
    this.alert = 'patrol';
    this.spotTimer = 0;
  }

  reset(stage) {
    this.x = stage.farmer.x;
    this.y = stage.farmer.y;
    this.state = STATE.PATROL;
    this.waypoint = 0;
    this.lastSeen = null;
    this.lostTimer = 0;
    this.searchTimer = 0;
    this.alert = 'patrol';
  }

  canSee(stage, player) {
    if (player.hidden) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < FARMER.nearSense && !inTallGrass(stage, player.x, player.y)) return true;
    if (distance > FARMER.visionRange) return false;
    const angle = Math.atan2(dy, dx);
    if (Math.abs(angleDelta(this.facing, angle)) > FARMER.visionHalfAngle) return false;
    return !sightBlocked(stage, this.x, this.y - 10, player.x, player.y);
  }

  update(dt, stage, player, audio) {
    const events = { spotted: false, caught: false, lost: false };
    const sees = this.canSee(stage, player);
    const distance = Math.sqrt(dist2(this.x, this.y, player.x, player.y));

    if (sees) {
      if (this.state !== STATE.CHASE) {
        this.spotTimer = FARMER.spottedGrowlSeconds;
        events.spotted = true;
        audio.spotted();
      }
      this.state = STATE.CHASE;
      this.lastSeen = { x: player.x, y: player.y };
      this.lostTimer = 0;
      this.alert = 'chase';
    } else if (this.state === STATE.CHASE) {
      this.lostTimer += dt;
      if (this.lostTimer > FARMER.loseSightAfter) {
        this.state = STATE.SEARCH;
        this.searchTimer = FARMER.searchTime;
        this.searchAngle = this.facing;
        this.alert = 'search';
        events.lost = true;
      }
    }

    const target = this.pickTarget(stage, player, distance);
    const speed = this.speedFor();
    if (target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const length = Math.hypot(dx, dy) || 1;
      const wanted = Math.atan2(dy, dx);
      this.facing += angleDelta(this.facing, wanted) * Math.min(1, dt * (this.state === STATE.CHASE ? 9 : 4.5));
      const stepX = (dx / length) * speed * dt;
      const stepY = (dy / length) * speed * dt;
      const beforeX = this.x;
      const beforeY = this.y;
      slideMove(stage, this, stepX, stepY);
      const moved = Math.hypot(this.x - beforeX, this.y - beforeY);
      this.step += moved / 26;
      if (moved < 0.6 && this.state === STATE.PATROL) {
        // Stuck on a fence corner: take the next waypoint instead of shouldering it forever.
        this.waypoint = (this.waypoint + 1) % this.waypoints.length;
      }
    } else if (this.state === STATE.SEARCH) {
      this.searchAngle += dt * 1.4;
      this.facing += angleDelta(this.facing, this.searchAngle) * Math.min(1, dt * 3);
    }

    if (this.state === STATE.SEARCH) {
      this.searchTimer -= dt;
      if (this.searchTimer <= 0) {
        this.state = STATE.PATROL;
        this.alert = 'patrol';
        this.waypoint = this.nearestWaypoint();
      }
    }

    if (this.spotTimer > 0) this.spotTimer -= dt;
    if (distance < FARMER.catchRange && this.state === STATE.CHASE) events.caught = true;
    return events;
  }

  pickTarget(stage, player, distance) {
    if (this.state === STATE.CHASE) return { x: player.x, y: player.y };
    if (this.state === STATE.SEARCH) {
      if (!this.lastSeen) return null;
      if (Math.hypot(this.lastSeen.x - this.x, this.lastSeen.y - this.y) < 26) return null;
      return this.lastSeen;
    }
    if (this.state === STATE.INVESTIGATE) {
      return this.lastSeen;
    }
    const point = this.waypoints[this.waypoint];
    if (Math.hypot(point.x - this.x, point.y - this.y) < 22) {
      this.waypoint = (this.waypoint + 1) % this.waypoints.length;
      return this.waypoints[this.waypoint];
    }
    return point;
  }

  speedFor() {
    if (this.state === STATE.CHASE) return FARMER.chaseSpeed;
    if (this.state === STATE.SEARCH) return FARMER.searchSpeed;
    if (this.state === STATE.INVESTIGATE) return FARMER.searchSpeed;
    return FARMER.patrolSpeed;
  }

  nearestWaypoint() {
    let best = 0;
    let bestDistance = Infinity;
    this.waypoints.forEach((point, index) => {
      const d = dist2(point.x, point.y, this.x, this.y);
      if (d < bestDistance) {
        bestDistance = d;
        best = index;
      }
    });
    return best;
  }

  /* A gobble carries: it pulls the farmer toward the noise even when he cannot see the bird. */
  hearGobble(point) {
    if (this.state === STATE.CHASE) return;
    this.state = STATE.INVESTIGATE;
    this.alert = 'search';
    this.lastSeen = { x: point.x, y: point.y };
    this.searchTimer = FARMER.searchTime;
  }
}