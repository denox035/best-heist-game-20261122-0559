// guards.js — patrolling guards with vision cones.
// A guard walks its waypoints back and forth. Its cone is a range + half-angle
// around its facing; the thief is seen only with a clear line of sight.
// A loud noise or a tossed coin makes the nearest guard investigate the spot.

import { moveCircle, segmentBlocked } from './world.js';

export const CONE_RANGE = 175;
export const CONE_HALF = 0.62; // ~35 degrees each side

export function createGuards(routes) {
  return routes.map((route) => ({
    name: route.name,
    x: route.points[0].x,
    y: route.points[0].y,
    r: 13,
    speed: route.speed,
    points: route.points,
    leg: 0, // index of the waypoint being walked toward
    forward: 1,
    angle: 0, // facing, radians
    mode: 'patrol', // patrol | investigate | alert
    investigate: null, // {x, y, until}
    lastSeen: null, // {x, y, at}
    pause: 0, // seconds left standing at a waypoint
  }));
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this guard see the point? Cone + range + line of sight.
export function guardSees(guard, tx, ty) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return { seen: false, dist };
  const toThief = Math.atan2(dy, dx);
  if (dist < 34) {
    // Bumped into: the guard feels the thief even outside the cone.
    if (segmentBlocked(guard.x, guard.y, tx, ty)) return { seen: false, dist };
    return { seen: true, dist };
  }
  if (Math.abs(angleDiff(toThief, guard.angle)) > CONE_HALF) return { seen: false, dist };
  if (segmentBlocked(guard.x, guard.y, tx, ty)) return { seen: false, dist };
  return { seen: true, dist };
}

export function updateGuards(guards, dt, now, thief, noise) {
  for (const g of guards) {
    // A fresh noise pulls the nearest guard off patrol to investigate.
    if (noise && g.mode === 'patrol') {
      const d = Math.hypot(noise.x - g.x, noise.y - g.y);
      if (d < noise.radius) {
        g.mode = 'investigate';
        g.investigate = { x: noise.x, y: noise.y, until: now + 4 };
      }
    }

    if (g.mode === 'investigate' && g.investigate) {
      if (now > g.investigate.until) {
        g.mode = 'patrol';
        g.investigate = null;
      } else {
        walkToward(g, g.investigate.x, g.investigate.y, g.speed * 1.15, dt);
        const d = Math.hypot(g.investigate.x - g.x, g.investigate.y - g.y);
        if (d < 14) {
          g.mode = 'patrol';
          g.investigate = null;
          g.pause = 1.2;
        }
        continue;
      }
    }

    if (g.mode === 'alert' && g.lastSeen) {
      walkToward(g, g.lastSeen.x, g.lastSeen.y, g.speed * 1.45, dt);
      // Hunt the last seen spot until the trail goes cold (3 s unseen).
      if (now - g.lastSeen.at > 3) {
        g.mode = 'patrol';
        g.lastSeen = null;
      }
      continue;
    }

    // Patrol: walk the route, pause briefly at each waypoint, look around.
    if (g.pause > 0) {
      g.pause -= dt;
      g.angle += dt * 0.9; // glance around while waiting
      continue;
    }
    const target = g.points[g.leg];
    const arrived = walkToward(g, target.x, target.y, g.speed, dt);
    if (arrived) {
      g.pause = 0.8;
      g.leg += g.forward;
      if (g.leg >= g.points.length) {
        g.leg = g.points.length - 2;
        g.forward = -1;
      } else if (g.leg < 0) {
        g.leg = 1;
        g.forward = 1;
      }
    }
  }
}

// Walk toward a point; returns true when close enough to count as arrived.
function walkToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) return true;
  const step = Math.min(dist, speed * dt);
  const ux = dx / dist;
  const uy = dy / dist;
  g.angle = angleTo(0, 0, ux, uy);
  moveCircle(g, ux * step, uy * step);
  return false;
}
