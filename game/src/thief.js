// thief.js — the thief: movement, sneaking, loot grabs and the coin toss.
// Walk with keys or click-to-move. Shift sneaks: slower, quieter, harder to
// spot. Coins are a tool at a cost: 3 per run, each toss draws the nearest
// guard to the clink. E grabs loot; the vault takes a 2.5 s crack.

import { ENTRY, LOOT, moveCircle } from './world.js';

export const WALK_SPEED = 150;
export const SNEAK_SPEED = 85;
export const NOISE_RUN_RADIUS = 95;
export const NOISE_SNEAK_RADIUS = 26;

export function createThief() {
  return {
    x: ENTRY.x,
    y: ENTRY.y,
    r: 12,
    facing: 0,
    sneaking: false,
    moving: false,
    // Loot state.
    hasVault: false,
    hasPainting: false,
    crackProgress: 0, // 0..1 while holding E at the vault
    coins: 3,
    coin: null, // a coin in flight / ringing: {x, y, until}
    // Noise event the guards hear this frame (or null).
    noise: null,
  };
}

export function resetThief(thief) {
  const fresh = createThief();
  Object.assign(thief, fresh);
}

// Distance to the nearest loot the thief can reach right now, or null.
export function lootInReach(thief) {
  if (!thief.hasVault) {
    const d = Math.hypot(LOOT.vault.x - thief.x, LOOT.vault.y - thief.y);
    if (d < LOOT.vault.r + thief.r + 14) return 'vault';
  }
  if (!thief.hasPainting) {
    const d = Math.hypot(LOOT.painting.x - thief.x, LOOT.painting.y - thief.y);
    if (d < LOOT.painting.r + thief.r + 14) return 'painting';
  }
  return null;
}

export function updateThief(thief, input, dt, now, onPickup) {
  thief.noise = null;
  const vec = input.moveVector();
  thief.sneaking = input.sneaking();
  const speed = thief.sneaking ? SNEAK_SPEED : WALK_SPEED;
  thief.moving = false;

  if (vec) {
    thief.facing = Math.atan2(vec.y, vec.x);
    moveCircle(thief, vec.x * speed * dt, vec.y * speed * dt);
    thief.moving = true;
    input.clickTarget = null; // keys override click-to-move
  } else if (input.clickTarget) {
    const dx = input.clickTarget.x - thief.x;
    const dy = input.clickTarget.y - thief.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      input.clickTarget = null;
    } else {
      thief.facing = Math.atan2(dy, dx);
      const step = Math.min(dist, speed * dt);
      moveCircle(thief, (dx / dist) * step, (dy / dist) * step);
      thief.moving = true;
    }
  }

  // Running is loud: guards nearby hear it and come looking.
  if (thief.moving && !thief.sneaking) {
    thief.noise = { x: thief.x, y: thief.y, radius: NOISE_RUN_RADIUS };
  }

  // Coin toss: right-click, or Q to toss ahead of the thief. Costs one of
  // three coins; the clink draws the nearest guard to the spot.
  if (input.wasPressed('q') && thief.coins > 0) {
    const tx = Math.max(48, Math.min(912, thief.x + Math.cos(thief.facing) * 100));
    const ty = Math.max(104, Math.min(592, thief.y + Math.sin(thief.facing) * 100));
    thief.coins -= 1;
    thief.coin = { x: tx, y: ty, until: now + 1.6 };
    thief.noise = { x: tx, y: ty, radius: 135 };
  }
  if (input.coinToss && thief.coins > 0) {
    const p = input.coinToss;
    thief.coins -= 1;
    thief.coin = { x: p.x, y: p.y, until: now + 1.6 };
    thief.noise = { x: p.x, y: p.y, radius: 135 };
    input.coinToss = null;
  } else {
    input.coinToss = null;
  }
  if (thief.coin && now > thief.coin.until) thief.coin = null;

  // Loot: E near a target. The painting is instant; the vault takes a crack.
  const near = lootInReach(thief);
  const holdingE = input.keys.has('e');
  if (near === 'painting' && holdingE) {
    thief.hasPainting = true;
    thief.crackProgress = 0;
    onPickup('painting');
  } else if (near === 'vault' && holdingE) {
    thief.crackProgress += dt / LOOT.vault.needHold;
    if (thief.crackProgress >= 1) {
      thief.hasVault = true;
      thief.crackProgress = 0;
      onPickup('vault');
    }
    // Cracking is fiddly work: a soft clink every second draws nearby guards.
    if (Math.floor(now * 1) !== Math.floor((now - dt) * 1)) {
      thief.noise = { x: thief.x, y: thief.y, radius: 60 };
    }
  } else {
    thief.crackProgress = 0;
  }
}
