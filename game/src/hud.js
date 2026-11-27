/* The strip along the top and bottom of the screen: where the turkey is in the story, what it has
   scored, how much breath is left, and the one warning that matters. Drawn last, in screen space,
   so it never scrolls with the farm. */

import { PALETTE as P, STAMINA_BAR } from './config.js';
import { roundRect } from './art.js';

function hearts(ctx, x, y, lives, total) {
  for (let i = 0; i < total; i += 1) {
    const filled = i < lives;
    const cx = x + i * 30;
    ctx.save();
    ctx.translate(cx, y);
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-13, -4, -9, -14, 0, -7);
    ctx.bezierCurveTo(9, -14, 13, -4, 0, 6);
    ctx.closePath();
    ctx.fillStyle = filled ? P.danger : 'rgba(42,26,16,0.35)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = P.ink;
    ctx.stroke();
    ctx.restore();
  }
}

export function drawHud(ctx, game) {
  const { player, stage, score, cornTaken, cornTotal, alert, distance } = game;

  // Top bar
  ctx.save();
  const bar = ctx.createLinearGradient(0, 0, 0, 96);
  bar.addColorStop(0, 'rgba(36,22,14,0.82)');
  bar.addColorStop(1, 'rgba(36,22,14,0)');
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, 1280, 96);
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText(stage.name, 34, 44);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(247,231,200,0.72)';
  ctx.fillText(`STAGE ${stage.index + 1} OF 3  ·  ${stage.subtitle}`, 34, 68);

  // Score, distance, corn
  ctx.textAlign = 'right';
  ctx.fillStyle = P.cream;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(`${Math.round(score).toLocaleString('en-US')}`, 1246, 46);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(247,231,200,0.72)';
  ctx.fillText('SCORE', 1246, 64);

  ctx.textAlign = 'left';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillStyle = '#f2c14a';
  ctx.fillText(`CORN ${cornTaken}/${cornTotal}`, 470, 40);
  ctx.fillStyle = 'rgba(247,231,200,0.8)';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(`${Math.round(distance)} m`, 470, 64);

  hearts(ctx, 640, 40, player.lives, 3);
  ctx.fillStyle = 'rgba(247,231,200,0.55)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LIVES', 640 + 30, 62);

  // Stamina, bottom left
  const x = 40;
  const y = 660;
  ctx.fillStyle = 'rgba(36,22,14,0.72)';
  roundRect(ctx, x - 8, y - 20, STAMINA_BAR.w + 16, 40, 10);
  ctx.fill();
  ctx.fillStyle = 'rgba(247,231,200,0.65)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BREATH', x, y - 6);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundRect(ctx, x, y, STAMINA_BAR.w, STAMINA_BAR.h, 7);
  ctx.fill();
  const ratio = Math.max(0, Math.min(1, player.stamina / 100));
  const colour = ratio > 0.4 ? '#7dc26a' : ratio > 0.18 ? '#e8b23c' : '#d2452f';
  ctx.fillStyle = colour;
  roundRect(ctx, x, y, STAMINA_BAR.w * ratio, STAMINA_BAR.h, 7);
  ctx.fill();

  // Dash cooldown pip
  ctx.fillStyle = player.dashCooldown <= 0 ? '#a8d8f0' : 'rgba(255,255,255,0.22)';
  roundRect(ctx, x + STAMINA_BAR.w + 14, y - 2, 26, 18, 6);
  ctx.fill();
  ctx.fillStyle = P.ink;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FLAP', x + STAMINA_BAR.w + 27, y + 11);

  // Hidden state
  if (player.hidden) {
    ctx.fillStyle = 'rgba(125,194,106,0.9)';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HIDDEN IN THE GRASS', x + STAMINA_BAR.w + 56, y + 12);
  }

  // The alert banner
  if (alert === 'chase') {
    const pulse = 0.55 + Math.sin(game.time * 14) * 0.25;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = P.danger;
    roundRect(ctx, 500, 108, 280, 40, 10);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = P.cream;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED! RUN!', 640, 136);
  } else if (alert === 'search') {
    ctx.fillStyle = 'rgba(232,178,60,0.85)';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('he is looking for you', 640, 128);
  }

  // Combo
  if (game.combo > 1) {
    ctx.fillStyle = '#ffe08a';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CORN COMBO x${game.combo}`, 640, 176);
  }
}