/* Full-screen states that are not the game: the title card, the stage card between rounds, the
   recap when a stage is beaten, and the two endings (caught for dinner, or off the farm). They take
   the same context the play view does and write over it, so the game's state machine stays in one
   place. */

import { PALETTE as P } from './config.js';
import { drawFarmer, drawTruck, drawTurkey, roundRect } from './art.js';

function panel(ctx, x, y, w, h, alpha = 0.86) {
  ctx.save();
  ctx.fillStyle = `rgba(36,22,14,${alpha})`;
  roundRect(ctx, x, y, w, h, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(247,231,200,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function centred(ctx, text, x, y, font, colour) {
  ctx.fillStyle = colour;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

export function drawTitle(ctx, game) {
  const pulse = 0.5 + Math.sin(game.time * 2.2) * 0.5;

  ctx.save();
  ctx.fillStyle = 'rgba(36,22,14,0.52)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.restore();

  // Title plate
  panel(ctx, 300, 92, 680, 250, 0.9);
  ctx.save();
  ctx.translate(640, 190);
  ctx.rotate(-0.02);
  centred(ctx, 'GRAVY BREAK', 0, 0, 'bold 76px Georgia, serif', P.cream);
  centred(ctx, 'a turkey escape', 2, 42, 'italic 26px Georgia, serif', '#f2c14a');
  ctx.restore();
  centred(ctx, 'One bird. Three hundred yards of farm. One very determined farmer.',
    640, 282, '16px system-ui, sans-serif', 'rgba(247,231,200,0.8)');

  // The bird, big, and the farmer behind it
  drawFarmer(ctx, { x: 1006, y: 470, facing: Math.PI, step: game.time, alert: 'patrol' });
  drawTurkey(ctx, {
    x: 900,
    y: 470,
    facing: Math.PI,
    step: game.time * 1.4,
    hidden: false,
    flash: false,
    dashGlow: pulse * 0.4,
    wobble: Math.sin(game.time * 3) * 2,
  });

  // Controls
  panel(ctx, 196, 392, 560, 250, 0.82);
  ctx.textAlign = 'left';
  const rows = [
    ['WASD / ARROWS', 'slip through the farm'],
    ['SHIFT', 'sprint (spends breath)'],
    ['SPACE', 'flap-dash, and gobble to distract'],
    ['P · M', 'pause · mute'],
  ];
  rows.forEach(([key, what], i) => {
    const y = 440 + i * 38;
    ctx.fillStyle = '#f2c14a';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(key, 236, y);
    ctx.fillStyle = 'rgba(247,231,200,0.86)';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(what, 396, y);
  });
  centred(ctx, 'HIDE in tall grass to break his line of sight. Reach the EXIT gate.',
    476, 606, 'italic 13px system-ui, sans-serif', 'rgba(247,231,200,0.62)');

  // Start prompt
  ctx.save();
  ctx.globalAlpha = 0.55 + pulse * 0.45;
  panel(ctx, 470, 654, 340, 52, 0.9);
  ctx.restore();
  centred(ctx, 'PRESS SPACE OR CLICK TO RUN', 640, 688, 'bold 19px Georgia, serif', P.cream);
}

export function drawStageCard(ctx, game) {
  const t = game.cardTimer;
  const fade = Math.min(1, Math.min(t, 0.35) / 0.35);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = 'rgba(36,22,14,0.58)';
  ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, 340, 250, 600, 210, 0.92);
  centred(ctx, `STAGE ${game.stage.index + 1}`, 640, 300, 'bold 18px system-ui, sans-serif', '#f2c14a');
  centred(ctx, game.stage.name, 640, 366, 'bold 54px Georgia, serif', P.cream);
  centred(ctx, game.stage.subtitle, 640, 408, 'italic 18px Georgia, serif', 'rgba(247,231,200,0.8)');
  centred(ctx, `lives ${game.player.lives}  ·  score ${Math.round(game.score)}`, 640, 440,
    '15px system-ui, sans-serif', 'rgba(247,231,200,0.6)');
  ctx.restore();
}

export function drawStageClear(ctx, game) {
  const recap = game.recap;
  ctx.save();
  ctx.fillStyle = 'rgba(36,22,14,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, 340, 200, 600, 320, 0.92);
  centred(ctx, 'CLEARED', 640, 258, 'bold 18px system-ui, sans-serif', '#7dc26a');
  centred(ctx, game.stage.name, 640, 320, 'bold 50px Georgia, serif', P.cream);
  const lines = [
    [`corn gathered`, `${recap.corn}/${recap.cornTotal}`],
    [`stage bonus`, `+${recap.bonus}`],
    [`time`, `${recap.time.toFixed(1)}s`],
  ];
  ctx.textAlign = 'left';
  lines.forEach(([label, value], i) => {
    const y = 380 + i * 34;
    ctx.fillStyle = 'rgba(247,231,200,0.75)';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(label, 430, y);
    ctx.fillStyle = P.cream;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(value, 850, y);
    ctx.textAlign = 'left';
  });
  centred(ctx, recap.last ? 'the truck is running out back' : 'next: the way out is further in',
    640, 500, 'italic 15px Georgia, serif', 'rgba(247,231,200,0.65)');
  ctx.restore();
}

export function drawEnd(ctx, game) {
  const escaped = game.outcome === 'escaped';
  const fade = Math.min(1, game.endTimer / 0.5);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = escaped ? 'rgba(24,20,12,0.72)' : 'rgba(40,16,10,0.74)';
  ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, 268, 96, 744, 528, 0.94);

  if (escaped) {
    drawTruck(ctx, { x: 1010, y: 220 }, true);
    ctx.textAlign = 'left';
  } else {
    drawFarmer(ctx, { x: 1010, y: 226, facing: Math.PI, step: 0, alert: 'chase' });
  }
  drawTurkey(ctx, {
    x: 300,
    y: 226,
    facing: 0,
    step: escaped ? 0.4 : 0,
    hidden: false,
    flash: false,
    dashGlow: 0,
    wobble: escaped ? -2 : 2,
  });

  centred(ctx, escaped ? 'ESCAPED!' : 'CAUGHT!', 640, 214,
    'bold 62px Georgia, serif', escaped ? '#7dc26a' : '#e0604a');
  centred(ctx,
    escaped ? 'The truck door slams. Somewhere, an oven goes cold.' : 'The farmer has you by the wing. Say hello to the oven.',
    640, 256, 'italic 17px Georgia, serif', 'rgba(247,231,200,0.82)');

  const rows = [
    ['SCORE', Math.round(game.score).toLocaleString('en-US')],
    ['CORN', `${game.totalCorn}/${game.totalCornTotal}`],
    ['DISTANCE', `${Math.round(game.totalDistance)} m`],
    ['STAGES', `${escaped ? 3 : game.stage.index} of 3`],
    ['TIME', `${game.runTime.toFixed(1)}s`],
  ];
  let y = 316;
  for (const [label, value] of rows) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(247,231,200,0.66)';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(label, 430, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = P.cream;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(String(value), 850, y);
    y += 34;
  }

  if (escaped) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2c14a';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`life bonus +${game.lifeBonus}`, 640, 492);
  }
  const pulse = 0.55 + Math.sin(game.time * 3) * 0.45;
  ctx.globalAlpha = fade * pulse;
  centred(ctx, 'PRESS R OR CLICK TO RUN AGAIN', 640, 574, 'bold 19px Georgia, serif', P.cream);
  ctx.restore();
}

export function drawPause(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(36,22,14,0.62)';
  ctx.fillRect(0, 0, 1280, 720);
  panel(ctx, 440, 292, 400, 136, 0.92);
  centred(ctx, 'PAUSED', 640, 352, 'bold 40px Georgia, serif', P.cream);
  centred(ctx, 'P to carry on · R to start over', 640, 392, '14px system-ui, sans-serif', 'rgba(247,231,200,0.7)');
  ctx.restore();
}