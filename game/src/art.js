/* Every shape in Gravy Break is drawn here from canvas primitives, in one flat autumn style with a
   warm ink outline. The game logic never touches fillStyle: it hands this module a scene and this
   module puts it on screen, which keeps the look consistent and the rules testable. */

import { PALETTE as P } from './config.js';

const TAU = Math.PI * 2;

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry, fill, stroke = null, lineWidth = 3) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function drawShadow(ctx, x, y, rx, ry, alpha = 0.25) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ellipse(ctx, x, y + 2, rx, ry, '#2a1a10');
  ctx.restore();
}

/* ---------------------------------------------------------------- ground */

export function drawGround(ctx, stage, cam) {
  const { w, h } = stage.bounds;
  if (stage.floor === 'tile') {
    ctx.fillStyle = P.tile;
    ctx.fillRect(0, 0, w, h);
    const cell = 120;
    ctx.strokeStyle = 'rgba(30,38,36,0.35)';
    ctx.lineWidth = 2;
    for (let gx = 0; gx < w; gx += cell) {
      for (let gy = 0; gy < h; gy += cell) {
        const checker = ((gx / cell) + (gy / cell)) % 2 === 0;
        ctx.fillStyle = checker ? P.tile : P.tileDark;
        ctx.fillRect(gx, gy, cell, cell);
        ctx.strokeRect(gx, gy, cell, cell);
      }
    }
    // A warm wash from the ovens and the hanging lamps keeps the stone from reading as a grid.
    const warm = ctx.createLinearGradient(0, 0, 0, h);
    warm.addColorStop(0, 'rgba(226,150,60,0.22)');
    warm.addColorStop(0.5, 'rgba(120,60,30,0.10)');
    warm.addColorStop(1, 'rgba(20,30,30,0.28)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);
    drawPath(ctx, stage);
    return;
  }
  ctx.fillStyle = stage.floor === 'orchard' ? P.groundDark : P.ground;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let y = 0; y < h; y += 72) {
    ctx.fillStyle = (y / 72) % 2 === 0 ? P.groundLight : P.groundDark;
    ctx.fillRect(0, y, w, 30);
  }
  ctx.restore();
  const rngProps = stage.floorMarks || [];
  for (const mark of rngProps) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ellipse(ctx, mark.x, mark.y, mark.r, mark.r * 0.55, mark.dark ? P.groundDark : P.groundLight);
    ctx.restore();
  }
  if (stage.floor === 'orchard') {
    ctx.save();
    ctx.globalAlpha = 0.22;
    for (const leaf of stage.leaves || []) {
      ellipse(ctx, leaf.x, leaf.y, 7, 3.5, P.leaf);
    }
    ctx.restore();
  }
  drawPath(ctx, stage);
}

/* The worn track from the barn door to the way out: the game's one piece of level signage, so a
   player always has a sense of which way the escape lies before the arrow appears. */
function drawPath(ctx, stage) {
  const points = stage.path;
  if (!points || points.length < 2) return;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = P.pathEdge;
  ctx.lineWidth = 104;
  strokePolyline(ctx, points);
  ctx.strokeStyle = P.path;
  ctx.lineWidth = 92;
  strokePolyline(ctx, points);
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = P.pathEdge;
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 22]);
  strokePolyline(ctx, points);
  ctx.restore();
}

function strokePolyline(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
}

export function drawPumpkin(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  drawShadow(ctx, 0, 4, p.r + 3, 6, 0.22);
  for (let i = -1; i <= 1; i += 1) {
    ellipse(ctx, i * (p.r * 0.5), 0, p.r * 0.55, p.r * 0.72, i === 0 ? P.pumpkin : P.pumpkinDark, P.ink, 2);
  }
  ctx.strokeStyle = '#5c7a35';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -p.r * 0.7);
  ctx.quadraticCurveTo(3, -p.r - 6, 7, -p.r - 8);
  ctx.stroke();
  ctx.restore();
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/* ---------------------------------------------------------------- turkey */

export function drawTurkey(ctx, t) {
  const { x, y, facing, step, hidden, flash, dashGlow, wobble = 0 } = t;
  const dir = facing;
  const bob = Math.sin(step * 12) * 2 + wobble;
  ctx.save();
  ctx.translate(x, y + bob);

  if (flash) ctx.globalAlpha = 0.45;
  if (hidden) ctx.globalAlpha = 0.62;

  drawShadow(ctx, 0, 4, 20, 8, hidden ? 0.12 : 0.22);

  // Tail fan sits behind the bird, opposite its facing.
  const fanSpread = 0.95;
  const fanDir = dir + Math.PI;
  for (let i = -2; i <= 2; i += 1) {
    const a = fanDir + i * (fanSpread / 2) * 0.62;
    const len = 30 - Math.abs(i) * 4;
    ctx.save();
    ctx.translate(Math.cos(a) * 8, Math.sin(a) * 5 - 8);
    ctx.rotate(a);
    ellipse(ctx, len * 0.5, 0, len * 0.52, 7 - Math.abs(i) * 0.8, i % 2 === 0 ? P.turkeyFan : P.turkeyWing, P.ink, 2);
    ctx.restore();
  }

  // Legs
  const legSwing = Math.sin(step * 12) * 4;
  ctx.strokeStyle = '#d8a24a';
  ctx.lineWidth = 4;
  line(ctx, -6, 6, -7, 16 + legSwing * 0.4);
  line(ctx, 6, 6, 7, 16 - legSwing * 0.4);
  line(ctx, -7, 16 + legSwing * 0.4, -12, 18 + legSwing * 0.4);
  line(ctx, 7, 16 - legSwing * 0.4, 12, 18 - legSwing * 0.4);

  // Body
  ellipse(ctx, 0, -2, 19, 16, P.turkeyBody, P.ink, 3);
  ellipse(ctx, -3, -8, 11, 7, 'rgba(255,255,255,0.10)');

  // Wings
  const flap = Math.sin(step * 12) * 0.14;
  ctx.save();
  ctx.rotate(-flap);
  ellipse(ctx, -13, -4, 7, 10, P.turkeyWing, P.ink, 2);
  ctx.restore();
  ctx.save();
  ctx.rotate(flap);
  ellipse(ctx, 13, -4, 7, 10, P.turkeyWing, P.ink, 2);
  ctx.restore();

  // Head on a neck, turned toward the facing vector.
  const hx = Math.cos(dir) * 15;
  const hy = Math.sin(dir) * 9 - 18;
  ctx.strokeStyle = P.turkeyHead;
  ctx.lineWidth = 6;
  line(ctx, 0, -10, hx * 0.6, hy + 4);
  ellipse(ctx, hx, hy, 8, 8, P.turkeyHead, P.ink, 2.5);
  // Snood and wattle
  ellipse(ctx, hx + Math.cos(dir) * 3, hy + 5, 3.4, 5, P.wattle, P.ink, 1.5);
  ellipse(ctx, hx + Math.cos(dir) * 6, hy - 3, 3, 2.4, '#f0e0cf', P.ink, 1.2);
  // Beak
  ctx.beginPath();
  ctx.moveTo(hx + Math.cos(dir) * 7, hy + Math.sin(dir) * 4);
  ctx.lineTo(hx + Math.cos(dir) * 13, hy + Math.sin(dir) * 4 + 2);
  ctx.lineTo(hx + Math.cos(dir) * 7, hy + 5);
  ctx.closePath();
  ctx.fillStyle = '#e6b23c';
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Eye
  ellipse(ctx, hx + Math.cos(dir) * 2, hy - 1, 1.9, 1.9, P.ink);

  if (dashGlow > 0) {
    ctx.globalAlpha = Math.min(0.5, dashGlow);
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 21, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- farmer */

export function drawFarmer(ctx, f) {
  const { x, y, facing, step, alert, cornered } = f;
  ctx.save();
  ctx.translate(x, y);
  drawShadow(ctx, 0, 6, 22, 9, 0.28);
  const bob = Math.sin(step * 9) * 1.6;
  ctx.translate(0, bob);

  const legSwing = Math.sin(step * 9) * 5;
  ctx.strokeStyle = '#43301f';
  ctx.lineWidth = 7;
  line(ctx, -8, 8, -9, 22 + legSwing);
  line(ctx, 8, 8, 9, 22 - legSwing);
  ctx.fillStyle = '#33251a';
  roundRect(ctx, -16, 20 + legSwing, 14, 7, 3);
  ctx.fill();
  roundRect(ctx, 2, 20 - legSwing, 14, 7, 3);
  ctx.fill();

  // Dungarees
  ellipse(ctx, 0, -4, 20, 21, P.overalls, P.ink, 3);
  ctx.fillStyle = P.shirt;
  roundRect(ctx, -17, -22, 34, 18, 7);
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = P.overalls;
  roundRect(ctx, -10, -24, 20, 22, 6);
  ctx.fill();
  ctx.stroke();
  ellipse(ctx, -10, -20, 2.4, 2.4, '#e8d9a8');
  ellipse(ctx, 10, -20, 2.4, 2.4, '#e8d9a8');

  // Arms and pitchfork
  const arm = Math.sin(step * 9) * 0.25;
  ctx.save();
  ctx.translate(18, -12);
  ctx.rotate(-0.35 + arm);
  ctx.strokeStyle = P.shirt;
  ctx.lineWidth = 8;
  line(ctx, 0, 0, 16, 6);
  ctx.strokeStyle = '#8a5a34';
  ctx.lineWidth = 4;
  line(ctx, 10, 2, 34, -16);
  ctx.strokeStyle = P.metal;
  ctx.lineWidth = 3;
  line(ctx, 34, -16, 46, -26);
  line(ctx, 40, -22, 50, -14);
  line(ctx, 44, -24, 52, -20);
  ctx.restore();
  ctx.strokeStyle = P.shirt;
  ctx.lineWidth = 8;
  line(ctx, -18, -10, -26, 2 - arm * 10);

  // Head, hat
  ellipse(ctx, 0, -30, 12, 12, P.skin, P.ink, 2.5);
  ctx.fillStyle = '#3b2a1c';
  roundRect(ctx, -4, -31, 8, 4, 2);
  ctx.fill();
  ellipse(ctx, 0, -41, 19, 6, '#d9b96a', P.ink, 2.5);
  ellipse(ctx, 0, -45, 10, 7, '#c99f4d', P.ink, 2.5);
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -41, 19, Math.PI, TAU);
  ctx.stroke();

  if (alert === 'spotted' || alert === 'chase') {
    ctx.fillStyle = P.danger;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -58);
  } else if (alert === 'search') {
    ctx.fillStyle = '#6b4b2a';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', 0, -56);
  }
  if (cornered) {
    ctx.globalAlpha = 0.35;
    ellipse(ctx, 0, 0, 34, 30, '#ffe08a');
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- props */

export function drawHayBale(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  drawShadow(ctx, 0, b.h * 0.42, b.w * 0.44, 8, 0.2);
  ctx.fillStyle = P.straw;
  roundRect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 8);
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = P.strawDark;
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i += 1) {
    const yy = -b.h / 2 + (b.h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(-b.w / 2 + 6, yy);
    ctx.bezierCurveTo(-b.w / 6, yy - 5, b.w / 6, yy + 5, b.w / 2 - 6, yy);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8c6a33';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, -b.h / 2 + 2);
  ctx.lineTo(-6, b.h / 2 - 2);
  ctx.moveTo(8, -b.h / 2 + 2);
  ctx.lineTo(8, b.h / 2 - 2);
  ctx.stroke();
  ctx.restore();
}

export function drawFence(ctx, f) {
  ctx.save();
  ctx.translate(f.x, f.y);
  const posts = Math.max(2, Math.round(f.w / 34));
  ctx.strokeStyle = '#a8794a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(f.w, -10);
  ctx.moveTo(0, 16);
  ctx.lineTo(f.w, 16);
  ctx.stroke();
  for (let i = 0; i <= posts; i += 1) {
    const px = (f.w / posts) * i;
    ctx.fillStyle = '#8a5a34';
    roundRect(ctx, px - 4, -22, 9, 46, 3);
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTree(ctx, tree) {
  ctx.save();
  ctx.translate(tree.x, tree.y);
  drawShadow(ctx, 5, 8, 30, 12, 0.25);
  ctx.fillStyle = '#6b4526';
  roundRect(ctx, -7, -34, 14, 42, 5);
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ellipse(ctx, 0, -48, 40, 34, P.leafDeep);
  ellipse(ctx, -14, -58, 24, 20, P.leaf);
  ellipse(ctx, 16, -52, 22, 18, '#d98b3c');
  ellipse(ctx, 2, -66, 18, 14, '#e0a24a');
  ellipse(ctx, 6, -34, 3.5, 3.5, P.wattle);
  ellipse(ctx, -12, -30, 3.5, 3.5, P.wattle);
  ctx.restore();
}

export function drawGrassPatch(ctx, g, time) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#6f7f3d';
  ctx.beginPath();
  ctx.ellipse(g.x, g.y, g.r, g.r * 0.74, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = '#93a552';
  ctx.lineWidth = 2.5;
  const blades = 22;
  for (let i = 0; i < blades; i += 1) {
    const a = (i / blades) * TAU + (g.seed || 0);
    const rr = g.r * (0.25 + ((i * 37) % 100) / 140);
    const bx = g.x + Math.cos(a) * rr;
    const by = g.y + Math.sin(a) * rr * 0.74;
    const sway = Math.sin(time * 2 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(bx, by + 4);
    ctx.quadraticCurveTo(bx + sway, by - 6, bx + sway * 1.8, by - 14);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCorn(ctx, c, time) {
  ctx.save();
  ctx.translate(c.x, c.y);
  const float = Math.sin(time * 3 + c.x * 0.01) * 3;
  ctx.translate(0, float);
  ctx.globalAlpha = 0.9;
  ellipse(ctx, 0, 12, 13, 5, 'rgba(42,26,16,0.25)');
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.rotate(Math.sin(time * 2 + c.y) * 0.12);
  ellipse(ctx, 0, 0, 9, 17, '#f2c14a', P.ink, 2.5);
  ctx.strokeStyle = '#c9972c';
  ctx.lineWidth = 1.4;
  for (let i = -3; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-7, i * 4);
    ctx.lineTo(7, i * 4);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-6, -12);
  ctx.quadraticCurveTo(0, -24, 6, -12);
  ctx.strokeStyle = '#7ba24a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  if (c.combo > 0) {
    ctx.fillStyle = 'rgba(255,240,190,0.85)';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`+${c.value}`, 0, -26);
  }
  ctx.restore();
}

export function drawBarrel(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  drawShadow(ctx, 0, 4, b.w * 0.46, 8, 0.22);
  ctx.fillStyle = '#8c5a2f';
  roundRect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#5c3a1c';
  ctx.lineWidth = 4;
  line(ctx, -b.w / 2 + 3, -b.h * 0.22, b.w / 2 - 3, -b.h * 0.22);
  line(ctx, -b.w / 2 + 3, b.h * 0.22, b.w / 2 - 3, b.h * 0.22);
  ctx.restore();
}

export function drawOven(ctx, o, heat) {
  ctx.save();
  ctx.translate(o.x, o.y);
  // Body
  ctx.fillStyle = '#5b5f66';
  roundRect(ctx, 0, 0, o.w, o.h, 8);
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#3a3d42';
  roundRect(ctx, 10, 12, o.w - 20, o.h - 24, 6);
  ctx.fill();
  // Glow through the door, brighter as the jet builds
  const glow = 0.25 + heat * 0.75;
  const g = ctx.createRadialGradient(o.w / 2, o.h / 2, 4, o.w / 2, o.h / 2, o.h * 0.6);
  g.addColorStop(0, `rgba(255,190,90,${glow})`);
  g.addColorStop(1, 'rgba(210,70,30,0.05)');
  ctx.fillStyle = g;
  roundRect(ctx, 10, 12, o.w - 20, o.h - 24, 6);
  ctx.fill();
  ctx.strokeStyle = '#9aa1ab';
  ctx.lineWidth = 3;
  line(ctx, 12, o.h / 2, o.w - 12, o.h / 2);
  ctx.fillStyle = '#b9c0c9';
  for (let i = 0; i < 4; i += 1) {
    ellipse(ctx, 18 + i * 14, o.h - 6, 3, 3, '#b9c0c9');
  }
  ctx.restore();
}

export function drawKnife(ctx, k) {
  ctx.save();
  ctx.translate(k.x, k.y);
  if (k.phase === 'telegraph') {
    const p = k.timer / k.telegraph;
    ctx.globalAlpha = 0.55 + Math.sin(p * 20) * 0.2;
    ctx.strokeStyle = '#c9d2dd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26 - p * 8, 13 - p * 4, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(42,26,16,0.3)';
    ellipse(ctx, 0, 0, 16, 8, 'rgba(42,26,16,0.28)');
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#e8eef6';
    ctx.lineWidth = 2;
    line(ctx, 0, -140 * (1 - p), 0, -20);
  } else if (k.phase === 'fall') {
    const drop = k.fallProgress;
    ctx.translate(0, -190 * (1 - drop));
    ctx.rotate(0.15);
    ctx.fillStyle = P.metal;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(9, -6);
    ctx.lineTo(0, 6);
    ctx.lineTo(-9, -6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#5c3a1c';
    roundRect(ctx, -4, 4, 8, 16, 3);
    ctx.fill();
  } else {
    ctx.globalAlpha = Math.max(0, 1 - k.timer / k.life);
    ctx.translate(0, -18);
    ctx.rotate(-0.2);
    ctx.fillStyle = P.metal;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(9, -6);
    ctx.lineTo(0, 6);
    ctx.lineTo(-9, -6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = P.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#5c3a1c';
    roundRect(ctx, -4, 4, 8, 16, 3);
    ctx.fill();
  }
  ctx.restore();
}

export function drawJet(ctx, jet, strength) {
  ctx.save();
  ctx.translate(jet.x, jet.y);
  ctx.rotate(jet.angle);
  const len = jet.length * strength;
  const grad = ctx.createLinearGradient(0, 0, len, 0);
  grad.addColorStop(0, `rgba(255,235,150,${0.85 * strength})`);
  grad.addColorStop(0.5, `rgba(246,160,42,${0.6 * strength})`);
  grad.addColorStop(1, 'rgba(210,60,20,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -jet.halfWidth * 0.4);
  ctx.quadraticCurveTo(len * 0.5, -jet.halfWidth, len, -jet.halfWidth * 0.2);
  ctx.quadraticCurveTo(len, jet.halfWidth * 0.2, len * 0.5, jet.halfWidth);
  ctx.quadraticCurveTo(len * 0.3, 0, 0, jet.halfWidth * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawExit(ctx, gate, open) {
  ctx.save();
  ctx.translate(gate.x, gate.y);
  const w = gate.w;
  const h = gate.h;
  // A gap in the hedgerow with a hand-lettered sign
  ctx.fillStyle = '#4b6b2f';
  roundRect(ctx, -w / 2 - 26, -h + 10, 30, h, 8);
  ctx.fill();
  roundRect(ctx, w / 2 - 4, -h + 10, 30, h, 8);
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = open ? 0.95 : 0.4;
  ctx.fillStyle = '#f6e3c5';
  roundRect(ctx, -w / 2 - 4, -h, w + 8, h, 6);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = P.barnRed;
  ctx.lineWidth = 4;
  ctx.strokeRect(-w / 2 - 4, -h, w + 8, h);
  ctx.fillStyle = P.barnRed;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', 0, -h + 26);
  ctx.fillStyle = P.ink;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(open ? 'run for it' : 'blocked', 0, -h + 46);
  // Arrow sweeping forward
  ctx.save();
  ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 260) * 0.3;
  ctx.fillStyle = '#7ba24a';
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.lineTo(12, -6);
  ctx.lineTo(12, 0);
  ctx.lineTo(24, 0);
  ctx.lineTo(0, 16);
  ctx.lineTo(-12, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

export function drawTruck(ctx, truck, escaped) {
  ctx.save();
  ctx.translate(truck.x, truck.y);
  drawShadow(ctx, 0, 6, 58, 14, 0.28);
  ctx.fillStyle = '#c94f3d';
  roundRect(ctx, -54, -40, 108, 46, 10);
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#f7e7c8';
  roundRect(ctx, 20, -58, 34, 24, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8fb3c9';
  roundRect(ctx, 24, -54, 26, 16, 4);
  ctx.fill();
  ctx.fillStyle = '#2a1a10';
  ellipse(ctx, -30, 8, 12, 12, '#2a1a10');
  ellipse(ctx, 26, 8, 12, 12, '#2a1a10');
  ellipse(ctx, -30, 8, 5, 5, '#8f97a3');
  ellipse(ctx, 26, 8, 5, 5, '#8f97a3');
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(escaped ? 'GOBBLE GOBBLE' : 'TO MARKET', -14, -18);
  ctx.restore();
}

export function drawVisionCone(ctx, origin, angle, range, halfAngle, hot) {
  ctx.save();
  ctx.translate(origin.x, origin.y);
  ctx.rotate(angle);
  const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, range);
  grad.addColorStop(0, hot ? 'rgba(226,86,60,0.28)' : 'rgba(255,230,160,0.20)');
  grad.addColorStop(1, 'rgba(255,230,160,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, range, -halfAngle, halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function vignette(ctx) {
  const g = ctx.createRadialGradient(640, 360, 260, 640, 360, 780);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(40,20,10,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
}