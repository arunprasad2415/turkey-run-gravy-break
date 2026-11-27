/* The three legible stages and the geometry rules over them: what blocks a body, what blocks a
   sight line, and where the corn, the tall grass and the way out are. Stage data is plain numbers;
   every prop that can be bumped into contributes a solid rectangle, so the farmer, the knives and
   the turkey all agree on what the farm is made of. */

import { makeRng, hashString } from './random.js';

const STAGE_BLUEPRINTS = [
  {
    name: 'The Farmyard',
    subtitle: 'Cross the yard before the farmer spots you',
    floor: 'grass',
    bounds: { w: 2240, h: 1440 },
    start: { x: 180, y: 760 },
    exit: { x: 2080, y: 760, w: 96, h: 110 },
    path: [
      { x: 140, y: 760 }, { x: 700, y: 760 }, { x: 940, y: 560 },
      { x: 1300, y: 780 }, { x: 1680, y: 600 }, { x: 2090, y: 760 },
    ],
    decor: [
      { type: 'pumpkin', x: 640, y: 980, r: 16 }, { type: 'pumpkin', x: 680, y: 1006, r: 11 },
      { type: 'pumpkin', x: 1340, y: 400, r: 14 }, { type: 'pumpkin', x: 1900, y: 200, r: 17 },
      { type: 'pumpkin', x: 1500, y: 1180, r: 13 },
    ],
    farmer: {
      x: 1240, y: 420,
      waypoints: [
        { x: 1240, y: 420 }, { x: 1700, y: 520 }, { x: 1560, y: 980 },
        { x: 900, y: 1040 }, { x: 620, y: 520 }, { x: 1240, y: 760 },
      ],
    },
    props: [
      { type: 'hay', x: 760, y: 700, w: 118, h: 86 },
      { type: 'hay', x: 1480, y: 800, w: 118, h: 86 },
      { type: 'hay', x: 1820, y: 1080, w: 96, h: 72 },
      { type: 'fence', x: 420, y: 300, w: 360, h: 46 },
      { type: 'fence', x: 420, y: 1180, w: 300, h: 46 },
      { type: 'fence', x: 1180, y: 180, w: 420, h: 46 },
      { type: 'fence', x: 1640, y: 1240, w: 300, h: 46 },
      { type: 'barrel', x: 1020, y: 340, w: 52, h: 56 },
      { type: 'barrel', x: 1960, y: 460, w: 52, h: 56 },
    ],
    grass: [
      { x: 520, y: 620, r: 84 },
      { x: 1120, y: 900, r: 96 },
      { x: 1620, y: 380, r: 78 },
      { x: 1940, y: 980, r: 88 },
    ],
    corn: [
      { x: 420, y: 880 }, { x: 700, y: 420 }, { x: 980, y: 620 },
      { x: 1300, y: 1120 }, { x: 1600, y: 620 }, { x: 1760, y: 300 },
      { x: 1880, y: 1200 }, { x: 560, y: 1240 },
    ],
    knives: { rate: 0, max: 0 },
    ovens: [],
  },
  {
    name: 'Cider Orchard',
    subtitle: 'Knives are falling, keep moving between the trees',
    floor: 'orchard',
    bounds: { w: 2400, h: 1520 },
    start: { x: 190, y: 760 },
    exit: { x: 2230, y: 760, w: 96, h: 110 },
    path: [
      { x: 150, y: 760 }, { x: 620, y: 900 }, { x: 1120, y: 660 },
      { x: 1600, y: 900 }, { x: 1980, y: 780 }, { x: 2240, y: 760 },
    ],
    decor: [
      { type: 'pumpkin', x: 520, y: 520, r: 15 }, { type: 'pumpkin', x: 1000, y: 1180, r: 12 },
      { type: 'pumpkin', x: 1560, y: 260, r: 16 }, { type: 'pumpkin', x: 2140, y: 980, r: 14 },
    ],
    farmer: {
      x: 1300, y: 760,
      waypoints: [
        { x: 1300, y: 760 }, { x: 1760, y: 340 }, { x: 2020, y: 760 },
        { x: 1620, y: 1200 }, { x: 1000, y: 1120 }, { x: 760, y: 520 },
      ],
    },
    props: [
      { type: 'tree', x: 600, y: 420, w: 60, h: 60 },
      { type: 'tree', x: 600, y: 1080, w: 60, h: 60 },
      { type: 'tree', x: 1000, y: 300, w: 60, h: 60 },
      { type: 'tree', x: 1080, y: 820, w: 60, h: 60 },
      { type: 'tree', x: 1460, y: 500, w: 60, h: 60 },
      { type: 'tree', x: 1520, y: 1120, w: 60, h: 60 },
      { type: 'tree', x: 1900, y: 320, w: 60, h: 60 },
      { type: 'tree', x: 1960, y: 1040, w: 60, h: 60 },
      { type: 'fence', x: 300, y: 260, w: 260, h: 46 },
      { type: 'fence', x: 820, y: 1300, w: 320, h: 46 },
      { type: 'fence', x: 1780, y: 620, w: 300, h: 46 },
      { type: 'barrel', x: 1320, y: 260, w: 52, h: 56 },
      { type: 'barrel', x: 2200, y: 1220, w: 52, h: 56 },
    ],
    grass: [
      { x: 360, y: 1000, r: 92 },
      { x: 840, y: 620, r: 88 },
      { x: 1240, y: 1180, r: 96 },
      { x: 1700, y: 880, r: 90 },
      { x: 2100, y: 480, r: 84 },
    ],
    corn: [
      { x: 380, y: 560 }, { x: 780, y: 900 }, { x: 1180, y: 480 },
      { x: 1360, y: 1000 }, { x: 1700, y: 300 }, { x: 1840, y: 820 },
      { x: 2080, y: 1120 }, { x: 900, y: 1180 },
    ],
    knives: { rate: 2.1, max: 3 },
    ovens: [],
  },
  {
    name: 'The Kitchen',
    subtitle: 'Past the ovens, out the back before the door is shut',
    floor: 'tile',
    bounds: { w: 2160, h: 1400 },
    start: { x: 170, y: 700 },
    exit: { x: 2000, y: 700, w: 96, h: 110 },
    path: [
      { x: 130, y: 700 }, { x: 640, y: 700 }, { x: 1040, y: 560 },
      { x: 1460, y: 840 }, { x: 1760, y: 700 }, { x: 2010, y: 700 },
    ],
    decor: [],
    farmer: {
      x: 1080, y: 380,
      waypoints: [
        { x: 1080, y: 380 }, { x: 1500, y: 380 }, { x: 1700, y: 900 },
        { x: 1200, y: 1040 }, { x: 760, y: 900 }, { x: 700, y: 400 },
      ],
    },
    props: [
      { type: 'barrel', x: 520, y: 420, w: 56, h: 60 },
      { type: 'barrel', x: 520, y: 1000, w: 56, h: 60 },
      { type: 'barrel', x: 1580, y: 300, w: 56, h: 60 },
      { type: 'barrel', x: 1240, y: 940, w: 56, h: 60 },
      { type: 'counter', x: 900, y: 200, w: 300, h: 70 },
      { type: 'counter', x: 1500, y: 1200, w: 300, h: 70 },
      { type: 'counter', x: 1980, y: 400, w: 70, h: 260 },
      { type: 'counter', x: 300, y: 760, w: 70, h: 320 },
    ],
    grass: [
      { x: 860, y: 720, r: 70 },
      { x: 1380, y: 620, r: 70 },
    ],
    corn: [
      { x: 640, y: 260 }, { x: 760, y: 1120 }, { x: 1060, y: 620 },
      { x: 1340, y: 880 }, { x: 1560, y: 620 }, { x: 1860, y: 980 },
      { x: 1900, y: 220 }, { x: 900, y: 480 },
    ],
    knives: { rate: 1.7, max: 4 },
    ovens: [
      { x: 700, y: 60, w: 130, h: 90, angle: Math.PI / 2 },
      { x: 1120, y: 60, w: 130, h: 90, angle: Math.PI / 2 },
      { x: 700, y: 1250, w: 130, h: 90, angle: -Math.PI / 2 },
      { x: 1120, y: 1250, w: 130, h: 90, angle: -Math.PI / 2 },
    ],
  },
];

/* A prop's solid rectangle: the part of it a body cannot walk through. Trees and barrels block a
   core smaller than their art, so the turkey can brush past the edges without sticking. */
function solidOf(prop) {
  switch (prop.type) {
    case 'hay':
      return { x: prop.x - prop.w / 2 + 6, y: prop.y - prop.h / 2 + 6, w: prop.w - 12, h: prop.h - 12 };
    case 'fence':
      return { x: prop.x, y: prop.y - 18, w: prop.w, h: 40 };
    case 'tree':
      return { x: prop.x - 20, y: prop.y - 26, w: 40, h: 44 };
    case 'barrel':
      return { x: prop.x - prop.w / 2 + 5, y: prop.y - prop.h / 2 + 5, w: prop.w - 10, h: prop.h - 10 };
    case 'counter':
      return { x: prop.x, y: prop.y, w: prop.w, h: prop.h };
    default:
      return null;
  }
}

function stageMarks(rng, bounds, count) {
  const marks = [];
  for (let i = 0; i < count; i += 1) {
    marks.push({
      x: rng.range(40, bounds.w - 40),
      y: rng.range(40, bounds.h - 40),
      r: rng.range(14, 40),
      dark: rng.chance(0.5),
    });
  }
  return marks;
}

export function buildStage(index) {
  const source = STAGE_BLUEPRINTS[index];
  if (!source) return null;
  const rng = makeRng(hashString(source.name) ^ 0x5bf03635);
  const stage = {
    ...source,
    index,
    solids: source.props.map(solidOf).filter(Boolean),
    floorMarks: stageMarks(rng, source.bounds, 22),
    leaves: source.floor === 'orchard'
      ? Array.from({ length: 46 }, () => ({
        x: rng.range(20, source.bounds.w - 20),
        y: rng.range(20, source.bounds.h - 20),
      }))
      : [],
    rng,
  };
  stage.corn = stage.corn.map((c) => ({ ...c, taken: false, value: 0, combo: 0, hop: rng.range(0, 6.28) }));
  stage.grass = stage.grass.map((g) => ({ ...g, seed: rng.range(0, 6.28) }));
  return stage;
}

export function stageCount() {
  return STAGE_BLUEPRINTS.length;
}

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function blockedAt(stage, x, y, r) {
  for (const solid of stage.solids) {
    if (circleHitsRect(x, y, r, solid)) return true;
  }
  return false;
}

/* Move a circle by (dx, dy), sliding along whatever it meets instead of stopping dead: each axis is
   tried on its own, so a turkey pressed against a hay bale still slips along it. */
export function slideMove(stage, body, dx, dy) {
  const bounds = stage.bounds;
  const r = body.radius;
  let nx = body.x + dx;
  if (nx - r < 8 || nx + r > bounds.w - 8 || blockedAt(stage, nx, body.y, r)) nx = body.x;
  let ny = body.y + dy;
  if (ny - r < 8 || ny + r > bounds.h - 8 || blockedAt(stage, nx, ny, r)) ny = body.y;
  body.x = nx;
  body.y = ny;
}

export function inTallGrass(stage, x, y) {
  for (const patch of stage.grass) {
    const dx = (x - patch.x) / patch.r;
    const dy = (y - patch.y) / (patch.r * 0.74);
    if (dx * dx + dy * dy <= 1) return patch;
  }
  return null;
}

/* Sight is blocked by solids and by tall grass: the farmer cannot see into a patch, which is what
   makes hiding worth the detour. Sampled along the segment at a coarse step, which is enough at
   these speeds and costs a handful of rectangle tests a frame. */
export function sightBlocked(stage, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy);
  const steps = Math.max(3, Math.ceil(length / 34));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const px = ax + dx * t;
    const py = ay + dy * t;
    for (const solid of stage.solids) {
      if (pointInRect(px, py, solid)) return true;
    }
    if (inTallGrass(stage, px, py)) return true;
  }
  return false;
}

export function distanceToExit(stage, x, y) {
  const gate = stage.exit;
  return Math.hypot(x - gate.x, y - gate.y);
}

export function insideExit(stage, x, y) {
  const gate = stage.exit;
  return Math.abs(x - gate.x) < gate.w * 0.42 && Math.abs(y - gate.y) < gate.h * 0.42;
}

export function randomOpenPoint(stage, rng, awayFrom, minDistance, maxDistance) {
  for (let tries = 0; tries < 40; tries += 1) {
    const angle = rng.range(0, Math.PI * 2);
    const distance = rng.range(minDistance, maxDistance);
    const x = awayFrom.x + Math.cos(angle) * distance;
    const y = awayFrom.y + Math.sin(angle) * distance;
    if (x < 40 || y < 40 || x > stage.bounds.w - 40 || y > stage.bounds.h - 40) continue;
    if (blockedAt(stage, x, y, 30)) continue;
    return { x, y };
  }
  return { x: awayFrom.x + minDistance, y: awayFrom.y };
}