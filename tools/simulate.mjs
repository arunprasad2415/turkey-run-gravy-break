// Headless checks for the parts of Gravy Break that are pure logic: the stage geometry, the seeded
// generator, the turkey's movement and the farmer's state machine. No browser and no dependency, so
// `node tools/simulate.mjs` is the entry's own test and runs anywhere Node 22 does.
//
// Every check prints PASS or FAIL and the script exits non-zero on the first failure's count.

import { buildStage, stageCount, blockedAt, inTallGrass, slideMove, sightBlocked } from '../game/src/world.js';
import { Player } from '../game/src/player.js';
import { Farmer } from '../game/src/farmer.js';

const audio = { dash() {}, gobble() {}, spotted() {}, knifeHit() {}, corn() {} };
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
}

// 1. Every stage is sane: the turkey starts on open ground, the gate is standable, and no cob of
//    corn is buried inside a hay bale or a tree where it could never be collected.
for (let i = 0; i < stageCount(); i += 1) {
  const stage = buildStage(i);
  check(`stage ${i + 1} builds`, Boolean(stage), stage?.name);
  check(`stage ${i + 1} start is open`, !blockedAt(stage, stage.start.x, stage.start.y, 16));
  const gate = stage.exit;
  const gateOpen = !blockedAt(stage, gate.x, gate.y - 20, 16) || !blockedAt(stage, gate.x, gate.y, 16);
  check(`stage ${i + 1} exit is reachable ground`, gateOpen);
  const buried = stage.corn.filter((c) => blockedAt(stage, c.x, c.y, 8));
  check(`stage ${i + 1} corn lies in the open`, buried.length === 0, `${stage.corn.length} cobs`);
  const grassOffMap = stage.grass.filter((g) => g.x < g.r || g.y < g.r
    || g.x > stage.bounds.w - g.r || g.y > stage.bounds.h - g.r);
  check(`stage ${i + 1} grass patches sit inside the map`, grassOffMap.length === 0);
}

// 2. The seeded generator: the same stage index must build the same farm twice, or a run cannot be
//    replayed from its stage number.
const a = buildStage(1);
const b = buildStage(1);
const fingerprint = (s) => JSON.stringify({
  corn: s.corn.map((c) => [c.x, c.y]),
  solids: s.solids,
  grass: s.grass.map((g) => [g.x, g.y, Math.round(g.seed * 1000)]),
});
check('stage building is deterministic', fingerprint(a) === fingerprint(b));

// 3. Movement: a turkey pushed into a wall for a second must end up inside the map, not through it.
{
  const stage = buildStage(0);
  const player = new Player(stage);
  const fakeInput = {
    axis: () => ({ x: 0, y: -1 }),
    down: () => true,
    pressed: () => false,
  };
  for (let f = 0; f < 240; f += 1) player.update(1 / 60, fakeInput, stage, audio);
  check('walking into the fence keeps the turkey on the farm',
    player.y >= 16 && player.y <= stage.bounds.h - 16, `y=${Math.round(player.y)}`);
  check('sprinting spends breath', player.stamina < 100, `${Math.round(player.stamina)}`);
}

// 4. The farmer: he sees a turkey in front of him in the open, and loses it in the grass.
{
  const stage = buildStage(0);
  const player = new Player(stage);
  const farmer = new Farmer(stage);
  farmer.x = 900; farmer.y = 760; farmer.facing = 0;
  player.x = 1050; player.y = 760; player.hidden = false;
  check('farmer sees an exposed turkey', farmer.canSee(stage, player));
  const events = farmer.update(1 / 60, stage, player, audio);
  check('seeing the turkey starts a chase', farmer.state === 'chase' && events.spotted === true);

  const patch = stage.grass[0];
  player.x = patch.x; player.y = patch.y;
  player.hidden = true;
  check('tall grass hides the turkey', farmer.canSee(stage, player) === false);
  check('grass is detected at its centre', Boolean(inTallGrass(stage, patch.x, patch.y)));
}

// 5. Sight lines: a hay bale between the farmer and the turkey blocks the view.
{
  const stage = buildStage(0);
  const hay = stage.props.find((p) => p.type === 'hay');
  const left = { x: hay.x - 120, y: hay.y };
  const right = { x: hay.x + 120, y: hay.y };
  check('a hay bale blocks the sight line', sightBlocked(stage, left.x, left.y, right.x, right.y));
  check('open ground does not', !sightBlocked(stage, 300, 300, 300, 900));
}

// 6. A chase that reaches the turkey is a catch.
{
  const stage = buildStage(0);
  const player = new Player(stage);
  const farmer = new Farmer(stage);
  farmer.x = 900; farmer.y = 900; farmer.facing = 0; farmer.state = 'chase';
  player.x = 915; player.y = 900; player.hidden = false;
  const events = farmer.update(1 / 60, stage, player, audio);
  check('the farmer catches at arm\'s length', events.caught === true);
}

// 7. Sliding along a bale instead of sticking: both axes are tried independently.
{
  const stage = buildStage(0);
  const body = { x: 700, y: 700, radius: 16 };
  const hay = stage.props.find((p) => p.type === 'hay');
  body.x = hay.x - hay.w / 2 - 20;
  body.y = hay.y;
  const startY = body.y;
  slideMove(stage, body, 4, 40);
  check('a body pressed against a bale still slides along it', body.y > startY, `dy=${Math.round(body.y - startY)}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exit(1);