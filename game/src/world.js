// world.js — the museum hall: walls, cover, routes, loot spots and spawn points.
// One single-screen room (960x640 canvas, HUD strip on top). Every coordinate here is
// the room the thief crosses; guards and cameras read these same tables.

export const VIEW_W = 960;
export const VIEW_H = 640;
export const HUD_H = 56;

// Outer room bounds (interior the thief can walk in).
export const ROOM = { x: 32, y: 88, w: 896, h: 520 };

// Solid rectangles. Walls block movement, sight and camera cones.
export const WALLS = [
  // Outer shell (four sides).
  { x: 16, y: 72, w: 928, h: 16 }, // north
  { x: 16, y: 608, w: 928, h: 16 }, // south
  { x: 16, y: 72, w: 16, h: 552 }, // west
  { x: 928, y: 72, w: 16, h: 552 }, // east
  // Mid wall splitting north hall from south hall, with a vent gap at x 430..490.
  { x: 32, y: 250, w: 398, h: 16 },
  { x: 490, y: 250, w: 110, h: 16 },
];

// Cover the thief can hide behind. Pedestals block sight; the vent gap is the
// quiet route north, the open east end of the mid wall is the exposed route.
export const COVER = [
  { x: 180, y: 320, w: 60, h: 60, kind: 'pedestal', label: 'VASE' },
  { x: 340, y: 320, w: 60, h: 60, kind: 'pedestal', label: 'BUST' },
  { x: 500, y: 320, w: 60, h: 60, kind: 'pedestal', label: 'URN' },
  { x: 120, y: 480, w: 70, h: 44, kind: 'planter', label: '' },
  { x: 770, y: 480, w: 70, h: 44, kind: 'planter', label: '' },
  // The vault block itself (north-east). Its door faces south.
  { x: 640, y: 88, w: 240, h: 112, kind: 'vault', label: 'VAULT' },
];

// Everything solid: walls + cover.
export const SOLIDS = [...WALLS, ...COVER];

// The vent gap in the mid wall (drawn as a grate the thief slips through).
export const VENT = { x: 430, y: 250, w: 60, h: 16 };

// Loot targets.
export const LOOT = {
  vault: { x: 760, y: 216, r: 30, name: 'Gold bars', value: 500, needHold: 2.5 },
  painting: { x: 200, y: 112, r: 28, name: 'The Gilded Fox', value: 300, needHold: 0 },
};

export const ENTRY = { x: 72, y: 560 };
export const EXIT = { x: 872, y: 560, w: 56, h: 48, label: 'SERVICE DOOR' };

// Guard patrol waypoints (each guard walks its list back and forth).
export const GUARD_ROUTES = [
  { name: 'Rook', points: [{ x: 120, y: 420 }, { x: 700, y: 420 }], speed: 62 },
  { name: 'Bishop', points: [{ x: 820, y: 300 }, { x: 820, y: 520 }], speed: 55 },
  { name: 'Knight', points: [{ x: 560, y: 140 }, { x: 560, y: 330 }], speed: 58 },
];

// Wall cameras: mount point, base facing angle (radians), sweep half-range.
export const CAMERA_MOUNTS = [
  { name: 'CAM-1', x: 420, y: 88, baseAngle: Math.PI / 2, sweep: 0.8 },
  { name: 'CAM-2', x: 928, y: 420, baseAngle: Math.PI, sweep: 0.7 },
];

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Circle (thief/guard) against a rectangle: true when they overlap.
export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function circleHitsSolids(x, y, r) {
  for (const s of SOLIDS) if (circleHitsRect(x, y, r, s)) return true;
  return false;
}

// Line of sight: sample along the segment; blocked if any sample lands in a solid.
export function segmentBlocked(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    for (const s of SOLIDS) {
      if (pointInRect(px, py, s)) return true;
    }
  }
  return false;
}

// Move a circle with axis-separated collision so it slides along walls.
export function moveCircle(e, dx, dy) {
  const nx = e.x + dx;
  if (!circleHitsSolids(nx, e.y, e.r)) e.x = nx;
  const ny = e.y + dy;
  if (!circleHitsSolids(e.x, ny, e.r)) e.y = ny;
  e.x = Math.max(ROOM.x + e.r, Math.min(ROOM.x + ROOM.w - e.r, e.x));
  e.y = Math.max(ROOM.y + e.r, Math.min(ROOM.y + ROOM.h - e.r, e.y));
}
