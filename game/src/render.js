// render.js — all canvas drawing for Silent Vault.
// Style: a night museum in deep teal and brass. Safe cover reads dark, danger
// reads warm: guard cones are amber, camera cones are red, loot is gold. The
// whole room fits one frame so the player reads every threat before moving.

import { COVER, EXIT, HUD_H, LOOT, ROOM, SOLIDS, VENT, VIEW_H, VIEW_W } from './world.js';
import { CAM_HALF, CAM_RANGE } from './cameras.js';
import { CONE_HALF, CONE_RANGE } from './guards.js';

const FLOOR_A = '#17262e';
const FLOOR_B = '#142029';
const WALL_C = '#2c3e50';
const WALL_EDGE = '#d4a94e';

function drawCone(ctx, x, y, angle, range, half, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawRect(ctx, r, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
}

function drawFloor(ctx) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  const tile = 56;
  for (let y = HUD_H; y < VIEW_H; y += tile) {
    for (let x = 0; x < VIEW_W; x += tile) {
      if (((x / tile) | 0) % 2 === ((y / tile) | 0) % 2) {
        ctx.fillStyle = FLOOR_B;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  // Faint carpet runner down the middle of the south hall.
  ctx.fillStyle = 'rgba(120, 40, 50, 0.25)';
  ctx.fillRect(32, 470, 896, 70);
}

function drawWalls(ctx) {
  for (const s of SOLIDS) {
    if (s.kind === 'vault') continue; // the vault gets its own drawing
    if (s.kind) continue; // cover pieces are drawn separately
    drawRect(ctx, s, WALL_C, WALL_EDGE);
  }
  // Vent grate in the mid wall gap.
  ctx.fillStyle = '#0d151b';
  ctx.fillRect(VENT.x, VENT.y, VENT.w, VENT.h);
  ctx.strokeStyle = '#7a8b99';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(VENT.x + 6 + i * 13, VENT.y + 2);
    ctx.lineTo(VENT.x + 6 + i * 13, VENT.y + VENT.h - 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#9fb4c4';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VENT', VENT.x + VENT.w / 2, VENT.y + VENT.h + 12);
}

function drawCover(ctx) {
  for (const c of COVER) {
    if (c.kind === 'vault') {
      drawRect(ctx, c, '#3a2f1a', '#d4a94e');
      // Vault door: brass double doors with a dial.
      ctx.fillStyle = '#d4a94e';
      ctx.fillRect(c.x + c.w / 2 - 22, c.y + c.h - 14, 44, 14);
      ctx.strokeStyle = '#2c2110';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h - 7, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f5e6b8';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VAULT', c.x + c.w / 2, c.y + 26);
      continue;
    }
    if (c.kind === 'pedestal') {
      drawRect(ctx, c, '#22303c', '#5b7186');
      ctx.fillStyle = '#e8e2d0';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9fb4c4';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h + 12);
    } else {
      // Planter.
      drawRect(ctx, c, '#1d3a2a', '#3f7a52');
      ctx.fillStyle = '#4caf6d';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(c.x + 10 + i * 13, c.y + 14, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawLoot(ctx, game) {
  // The painting on the north wall (taken = empty frame).
  ctx.fillStyle = '#6b4f1d';
  ctx.fillRect(LOOT.painting.x - 34, LOOT.painting.y - 20, 68, 40);
  if (!game.thief.hasPainting) {
    ctx.fillStyle = '#c96f2e';
    ctx.fillRect(LOOT.painting.x - 28, LOOT.painting.y - 14, 56, 28);
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(LOOT.painting.x - 8, LOOT.painting.y - 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e6b4f';
    ctx.fillRect(LOOT.painting.x + 4, LOOT.painting.y + 2, 16, 10);
  } else {
    ctx.fillStyle = '#241a08';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fb4c4';
    ctx.fillText('TAKEN', LOOT.painting.x, LOOT.painting.y + 4);
  }
  // Gold bars by the vault door (taken = gone).
  if (!game.thief.hasVault) {
    ctx.fillStyle = '#f2c14e';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(LOOT.vault.x - 24 + i * 16, LOOT.vault.y + 8 - i * 4, 14, 8);
    }
    ctx.strokeStyle = '#8a6a1f';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.strokeRect(LOOT.vault.x - 24 + i * 16, LOOT.vault.y + 8 - i * 4, 14, 8);
    }
  }
  // Crack progress ring while holding E at the vault.
  if (game.thief.crackProgress > 0) {
    ctx.beginPath();
    ctx.arc(LOOT.vault.x, LOOT.vault.y, 26, -Math.PI / 2, -Math.PI / 2 + game.thief.crackProgress * Math.PI * 2);
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}

function drawExit(ctx, game) {
  drawRect(ctx, { x: EXIT.x, y: EXIT.y, w: EXIT.w, h: EXIT.h }, '#1d3a2a', '#4caf6d');
  ctx.fillStyle = '#8be0a4';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 3);
  if (game.thief.hasVault) {
    ctx.strokeStyle = '#8be0a4';
    ctx.lineWidth = 2;
    ctx.strokeRect(EXIT.x - 4, EXIT.y - 4, EXIT.w + 8, EXIT.h + 8);
  }
}

function drawGuards(ctx, guards, spotted) {
  for (const g of guards) {
    const alert = g.mode !== 'patrol';
    drawCone(ctx, g.x, g.y, g.angle, CONE_RANGE, CONE_HALF, alert ? 'rgba(255, 90, 40, 0.30)' : 'rgba(242, 193, 78, 0.20)');
    // Body: navy uniform, brass badge, facing tick.
    ctx.fillStyle = '#274b63';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4a94e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#f2f2f2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * (g.r + 6), g.y + Math.sin(g.angle) * (g.r + 6));
    ctx.stroke();
    ctx.fillStyle = '#f2c14e';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y - g.r - 6);
    if (alert) {
      ctx.fillStyle = '#ff5a28';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('!', g.x, g.y - g.r - 18);
    }
  }
  void spotted;
}

function drawCameras(ctx, cameras) {
  for (const c of cameras) {
    drawCone(ctx, c.x, c.y, c.angle, CAM_RANGE, CAM_HALF, 'rgba(255, 60, 60, 0.22)');
    // Wall mount + lens.
    ctx.fillStyle = '#3a3f44';
    ctx.fillRect(c.x - 9, c.y - 7, 18, 14);
    ctx.fillStyle = '#ff3c3c';
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.angle) * 10, c.y + Math.sin(c.angle) * 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb3b3';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.name, c.x, c.y - 14);
  }
}

function drawThief(ctx, thief, now) {
  // Noise ring while running loud.
  if (thief.moving && !thief.sneaking) {
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 34 + Math.sin(now * 6) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // Hooded figure: dark cloak, gold mask, facing tick.
  ctx.fillStyle = '#101418';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = thief.sneaking ? '#4caf6d' : '#f2c14e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(thief.x + Math.cos(thief.facing) * 5, thief.y + Math.sin(thief.facing) * 5, 4, 0, Math.PI * 2);
  ctx.fill();
  if (thief.sneaking) {
    ctx.fillStyle = '#8be0a4';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', thief.x, thief.y - thief.r - 6);
  }
  // Tossed coin, ringing.
  if (thief.coin) {
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(thief.coin.x, thief.coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(thief.coin.x, thief.coin.y, 12 + Math.sin(now * 10) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(242, 193, 78, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#0d151b';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SILENT VAULT', 16, 34);
  ctx.fillStyle = '#9fb4c4';
  ctx.font = '12px sans-serif';
  ctx.fillText('Gallery heist — Room 1', 170, 33);

  // Alarm meter.
  const ax = 380;
  const aw = 220;
  ctx.fillStyle = '#1d2b34';
  ctx.fillRect(ax, 18, aw, 20);
  const frac = game.alarm.value / 100;
  const col = frac < 0.4 ? '#4caf6d' : frac < 0.75 ? '#f2a541' : '#ff3c3c';
  ctx.fillStyle = col;
  ctx.fillRect(ax, 18, aw * frac, 20);
  ctx.strokeStyle = '#5b7186';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, 18, aw, 20);
  ctx.fillStyle = '#f2f2f2';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 14);
  if (game.alarm.spottedBy) {
    ctx.fillStyle = '#ff5a28';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!', ax + aw / 2, 52);
  }

  // Loot + coins + timer, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = game.thief.hasVault ? '#f2c14e' : '#5b7186';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`VAULT ${game.thief.hasVault ? '✓' : '○'}`, 700, 24);
  ctx.fillStyle = game.thief.hasPainting ? '#f2c14e' : '#5b7186';
  ctx.fillText(`FOX ${game.thief.hasPainting ? '✓' : '○'}`, 700, 42);
  ctx.fillStyle = '#f2f2f2';
  ctx.fillText(`COINS ${game.thief.coins}`, 790, 24);
  const t = Math.max(0, game.timeLeft);
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(Math.floor(t % 60)).padStart(2, '0');
  ctx.textAlign = 'right';
  ctx.fillText(`${mm}:${ss}`, 940, 42);
  ctx.fillStyle = '#9fb4c4';
  ctx.font = '11px sans-serif';
  ctx.fillText(`SCORE ${game.score}`, 940, 24);
}

function drawPrompt(ctx, game) {
  if (game.state !== 'playing') return;
  const near = game.nearLoot;
  if (!near) return;
  ctx.fillStyle = 'rgba(13, 21, 27, 0.85)';
  const msg = near === 'vault'
    ? (game.thief.hasVault ? '' : 'HOLD E — CRACK THE VAULT')
    : 'PRESS E — TAKE THE PAINTING';
  if (!msg) return;
  ctx.font = 'bold 14px sans-serif';
  const w = ctx.measureText(msg).width + 24;
  ctx.fillRect(VIEW_W / 2 - w / 2, VIEW_H - 40, w, 28);
  ctx.fillStyle = '#f2c14e';
  ctx.textAlign = 'center';
  ctx.fillText(msg, VIEW_W / 2, VIEW_H - 21);
}

function drawOverlay(ctx, game) {
  ctx.fillStyle = 'rgba(8, 13, 17, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  if (game.state === 'title') {
    ctx.fillStyle = '#f2c14e';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('SILENT VAULT', VIEW_W / 2, 190);
    ctx.fillStyle = '#e8e2d0';
    ctx.font = '18px sans-serif';
    ctx.fillText('One night. One gallery. Two treasures. No alarms.', VIEW_W / 2, 232);
    ctx.fillStyle = '#9fb4c4';
    ctx.font = '15px sans-serif';
    ctx.fillText('WASD / arrows or click to move · SHIFT to sneak · E to grab loot', VIEW_W / 2, 300);
    ctx.fillText('Q or right-click tosses a coin (3 per run) to lure a guard away', VIEW_W / 2, 326);
    ctx.fillText('Dodge the amber guard cones and the red camera sweeps.', VIEW_W / 2, 352);
    ctx.fillText('Crack the vault, take the painting, slip out the service door.', VIEW_W / 2, 378);
    ctx.fillStyle = '#f2c14e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', VIEW_W / 2, 448);
  } else if (game.state === 'caught') {
    ctx.fillStyle = '#ff3c3c';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('CAUGHT!', VIEW_W / 2, 220);
    ctx.fillStyle = '#e8e2d0';
    ctx.font = '18px sans-serif';
    ctx.fillText('The alarm hit 100 — the guards closed in.', VIEW_W / 2, 262);
    ctx.fillText('Read the cones first, sneak the crossings, toss a coin to lure.', VIEW_W / 2, 292);
    ctx.fillStyle = '#f2c14e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('PRESS R TO TRY THE ROOM AGAIN', VIEW_W / 2, 360);
  } else if (game.state === 'won') {
    ctx.fillStyle = '#f2c14e';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('CLEAN GETAWAY!', VIEW_W / 2, 200);
    ctx.fillStyle = '#e8e2d0';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Loot: ${game.thief.hasVault ? 'gold bars' : '—'}${game.thief.hasPainting ? ' + The Gilded Fox' : ''}`, VIEW_W / 2, 250);
    ctx.fillText(`Time: ${game.winTime.toFixed(1)}s · Coins left: ${game.thief.coins} · Score: ${game.score}`, VIEW_W / 2, 284);
    ctx.fillStyle = '#9fb4c4';
    ctx.font = '15px sans-serif';
    ctx.fillText('The vault is empty, the fox is gone, and nobody saw a thing.', VIEW_W / 2, 330);
    ctx.fillStyle = '#f2c14e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('PRESS R TO RUN IT AGAIN', VIEW_W / 2, 396);
  }
}

export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx);
  drawWalls(ctx);
  drawCover(ctx);
  drawLoot(ctx, game);
  drawExit(ctx, game);
  drawGuards(ctx, game.guards, game.alarm.spottedBy);
  drawCameras(ctx, game.cameras);
  drawThief(ctx, game.thief, game.now);
  drawHud(ctx, game);
  drawPrompt(ctx, game);
  if (game.state !== 'playing') drawOverlay(ctx, game);
  // Red edge flash while spotted.
  if (game.state === 'playing' && game.alarm.spottedBy) {
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.55)';
    ctx.lineWidth = 5;
    ctx.strokeRect(3, HUD_H + 3, VIEW_W - 6, VIEW_H - HUD_H - 6);
  }
}
