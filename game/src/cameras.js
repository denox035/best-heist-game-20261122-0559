// cameras.js — wall cameras with sweeping cones.
// A camera sits on a wall and sweeps its cone back and forth around a base
// angle. It sees like a guard (range + half-angle + line of sight) but never
// moves; the player reads the sweep and times the crossing.

import { segmentBlocked } from './world.js';

export const CAM_RANGE = 205;
export const CAM_HALF = 0.5; // ~28 degrees each side

export function createCameras(mounts) {
  return mounts.map((m) => ({
    name: m.name,
    x: m.x,
    y: m.y,
    baseAngle: m.baseAngle,
    sweep: m.sweep,
    phase: Math.random() * Math.PI * 2,
    angle: m.baseAngle,
    speed: 0.55, // radians per second of sweep
  }));
}

export function updateCameras(cameras, dt, now) {
  for (const c of cameras) {
    c.angle = c.baseAngle + Math.sin(now * c.speed + c.phase) * c.sweep;
  }
}

export function cameraSees(cam, tx, ty) {
  const dx = tx - cam.x;
  const dy = ty - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAM_RANGE) return { seen: false, dist };
  const toThief = Math.atan2(dy, dx);
  let diff = toThief - cam.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAM_HALF) return { seen: false, dist };
  if (segmentBlocked(cam.x, cam.y, tx, ty)) return { seen: false, dist };
  return { seen: true, dist };
}
