// main.js — Silent Vault game loop and state machine.
// States: title → playing → caught | won. The loop runs on requestAnimationFrame
// with a clamped delta so a tab switch never teleports the thief.
// ?shot=start|cover|tense|win|caught poses a fixed scene for screenshots
// (photo mode: patrols freeze so the frame is exactly composed).

import { createCameras, cameraSees, updateCameras } from './cameras.js';
import { createGuards, guardSees, updateGuards } from './guards.js';
import { createInput } from './input.js';
import { createAlarm, resetAlarm, updateAlarm } from './alarm.js';
import { createAudio } from './audio.js';
import { render } from './render.js';
import { createThief, lootInReach, resetThief, updateThief } from './thief.js';
import { CAMERA_MOUNTS, EXIT, GUARD_ROUTES, LOOT, VIEW_H, VIEW_W } from './world.js';

const TIME_LIMIT = 240; // 4 minutes a run

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

const input = createInput(canvas);
const audio = createAudio();

const game = {
  state: 'title', // title | playing | caught | won
  thief: createThief(),
  guards: createGuards(GUARD_ROUTES),
  cameras: createCameras(CAMERA_MOUNTS),
  alarm: createAlarm(),
  now: 0,
  timeLeft: TIME_LIMIT,
  elapsed: 0,
  score: 0,
  winTime: 0,
  nearLoot: null,
  photo: false, // frozen scene for screenshots
  lastTickSecond: -1,
};

function resetRun() {
  resetThief(game.thief);
  game.guards = createGuards(GUARD_ROUTES);
  game.cameras = createCameras(CAMERA_MOUNTS);
  resetAlarm(game.alarm);
  game.timeLeft = TIME_LIMIT;
  game.elapsed = 0;
  game.score = 0;
  game.winTime = 0;
  game.nearLoot = null;
  game.lastTickSecond = -1;
}

function startPlaying() {
  resetRun();
  game.state = 'playing';
  audio.ensure();
}

function onPickup(kind) {
  if (kind === 'vault') {
    game.score += LOOT.vault.value;
    audio.pickup();
  } else if (kind === 'painting') {
    game.score += LOOT.painting.value;
    audio.pickup();
  }
}

function exitReached() {
  const t = game.thief;
  return (
    t.x > EXIT.x - 6 && t.x < EXIT.x + EXIT.w + 6 &&
    t.y > EXIT.y - 6 && t.y < EXIT.y + EXIT.h + 6
  );
}

function update(dt) {
  if (game.state !== 'playing') return;
  game.now += dt;
  game.elapsed += dt;
  game.timeLeft = Math.max(0, TIME_LIMIT - game.elapsed);
  if (game.timeLeft <= 0) {
    game.state = 'caught';
    audio.caught();
    return;
  }

  updateThief(game.thief, input, dt, game.now, onPickup);
  game.nearLoot = lootInReach(game.thief);

  // Who sees the thief this frame?
  let guardSeen = false;
  let guardDist = Infinity;
  for (const g of game.guards) {
    const s = guardSees(g, game.thief.x, game.thief.y);
    if (s.seen) {
      guardSeen = true;
      guardDist = Math.min(guardDist, s.dist);
    }
  }
  let camSeen = false;
  for (const c of game.cameras) {
    if (cameraSees(c, game.thief.x, game.thief.y).seen) camSeen = true;
  }

  // A guard that sees the thief stops patrolling and hunts the spot at once;
  // a brief sighting alone should not let it stroll on through the thief.
  if (guardSeen) {
    for (const g of game.guards) {
      if (guardSees(g, game.thief.x, game.thief.y).seen && g.mode === 'patrol') {
        g.mode = 'alert';
        g.lastSeen = { x: game.thief.x, y: game.thief.y, at: game.now };
      }
    }
  }

  const caught = updateAlarm(
    game.alarm,
    dt,
    {
      guardSeen,
      guardDist,
      camSeen,
      sneaking: game.thief.sneaking,
      thiefPos: { x: game.thief.x, y: game.thief.y },
    },
    game.now,
    game.guards,
  );
  if (game.alarm.value > 70) {
    const sec = Math.floor(game.now);
    if (sec !== game.lastTickSecond) {
      game.lastTickSecond = sec;
      audio.alarmTick();
    }
  }
  if (caught) {
    game.state = 'caught';
    audio.caught();
    return;
  }

  updateGuards(game.guards, dt, game.now, game.thief, game.thief.noise);
  updateCameras(game.cameras, dt, game.now);

  // Getaway: reach the service door carrying the vault gold.
  if (game.thief.hasVault && exitReached()) {
    game.state = 'won';
    game.winTime = game.elapsed;
    game.score += Math.round(game.timeLeft) * 2 + game.thief.coins * 50;
    audio.win();
  }
}

// Fixed scenes for screenshots (?shot=...). Positions are chosen so one frame
// shows the thief, guards, cones, cameras, loot and the alarm meter together.
function applyShot(shot) {
  game.photo = true;
  if (shot === 'start') {
    game.state = 'title';
    return;
  }
  if (shot === 'win') {
    startPlaying();
    game.thief.hasVault = true;
    game.thief.hasPainting = true;
    game.score = 800;
    game.winTime = 96.4;
    game.state = 'won';
    return;
  }
  if (shot === 'caught') {
    startPlaying();
    game.alarm.value = 100;
    game.alarm.spottedBy = 'guard';
    game.state = 'caught';
    return;
  }
  // cover: mid-crossing, thief between pedestals, a cone brushing past.
  // tense: thief at the painting with a guard cone closing in.
  startPlaying();
  if (shot === 'tense') {
    game.thief.x = 216;
    game.thief.y = 166;
    game.thief.facing = -Math.PI / 2;
    game.thief.hasVault = true;
    game.alarm.value = 58;
    game.guards[0].x = 300;
    game.guards[0].y = 200;
    game.guards[0].angle = Math.PI / 4;
    game.guards[2].x = 560;
    game.guards[2].y = 210;
    game.guards[2].angle = Math.PI;
    game.cameras[0].angle = Math.PI / 2 + 0.5;
  } else {
    // cover (default shot)
    game.thief.x = 420;
    game.thief.y = 420;
    game.thief.facing = Math.PI / 4;
    game.thief.sneaking = true;
    game.alarm.value = 32;
    game.guards[0].x = 300;
    game.guards[0].y = 420;
    game.guards[0].angle = 0;
    game.guards[1].x = 820;
    game.guards[1].y = 380;
    game.guards[1].angle = Math.PI / 2;
    game.guards[2].x = 560;
    game.guards[2].y = 180;
    game.guards[2].angle = Math.PI / 2;
    game.cameras[0].angle = Math.PI / 2 - 0.4;
    game.cameras[1].angle = Math.PI - 0.3;
  }
  // Freeze the patrols: the screenshot frame stays exactly composed.
  game.state = 'playing';
}

function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - (frame.last ?? timestamp)) / 1000);
  frame.last = timestamp;
  if (!game.photo) update(dt);

  if (input.wasPressed('enter') && game.state === 'title') startPlaying();
  if (input.wasPressed('r') && (game.state === 'caught' || game.state === 'won')) startPlaying();
  if (input.wasPressed('m')) audio.muted = !audio.muted;
  // Clicking the title screen also starts.
  if (game.state === 'title' && input.clickTarget) {
    input.clickTarget = null;
    startPlaying();
  }
  // Clicking the end screens retries.
  if ((game.state === 'caught' || game.state === 'won') && input.clickTarget) {
    input.clickTarget = null;
    startPlaying();
  }

  render(ctx, game);
  input.endFrame();
  requestAnimationFrame(frame);
}

// Photo mode must not advance the clock: in shot mode we render the posed
// frame and skip update() entirely (see frame()).
// Test hook: lets an automated play-test read the live game state.
// Harmless in play; the game never reads it back.
window.__game = game;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) applyShot(shot);
requestAnimationFrame(frame);
