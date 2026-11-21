// Velvet Vault — pure simulation: movement, patrols, vision, detection.
// No DOM in here, so Node tests can import the same rules the browser runs.

import {
  PLAYER_R, PLAYER_SPEED, PLAYER_SNEAK_SPEED, GUARD_R,
  CONE_RANGE, CONE_HALF_ANGLE, CONE_RAYS,
  ALERT_FILL, ALERT_DECAY, SNEAK_FACTOR, COVER_FACTOR, COVER_DIST,
  GEM_SCORE, GHOST_BONUS, LEVEL_BONUS,
} from "./config.js";

export function pointInRect(px, py, r, pad = 0) {
  return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad;
}

export function distToRect(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

export function circleHitsRect(cx, cy, rad, r) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < rad * rad;
}

export function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment pass through the rectangle?
  let tMin = 0;
  let tMax = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

export function lineOfSightClear(x1, y1, x2, y2, solids) {
  for (const r of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  }
  return true;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function guardSeesPoint(guard, px, py, solids) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return false;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, guard.facing)) > CONE_HALF_ANGLE) return false;
  return lineOfSightClear(guard.x, guard.y, px, py, solids);
}

export function visionPolygon(guard, solids) {
  const pts = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= CONE_RAYS; i++) {
    const a = guard.facing - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / CONE_RAYS;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    let d = CONE_RANGE;
    for (let s = 6; s <= CONE_RANGE; s += 6) {
      const x = guard.x + ca * s;
      const y = guard.y + sa * s;
      let hit = false;
      for (const r of solids) {
        if (pointInRect(x, y, r)) { hit = true; break; }
      }
      if (hit) { d = s; break; }
    }
    pts.push({ x: guard.x + ca * d, y: guard.y + sa * d });
  }
  return pts;
}

export function playerNearCover(player, crates) {
  for (const c of crates) {
    if (distToRect(player.x, player.y, c) <= COVER_DIST) return true;
  }
  return false;
}

export function createWorld(level, levelIndex = 0) {
  const solids = [...level.walls, ...level.crates];
  return {
    levelIndex,
    level,
    solids,
    player: { x: level.start.x, y: level.start.y, facing: -Math.PI / 2, sneaking: false, moving: false },
    guards: level.guards.map((g) => ({
      x: g.waypoints[0][0],
      y: g.waypoints[0][1],
      facing: 0,
      wpIndex: 1 % g.waypoints.length,
      waypoints: g.waypoints,
      speed: g.speed,
      pauseT: 0,
      suspicion: 0,
      stepT: 0,
    })),
    gems: level.gems.map((g) => ({ x: g.x, y: g.y, taken: false })),
    alert: 0,
    seenNow: false,
    peakAlert: 0,
    time: 0,
    score: 0,
    caught: false,
    won: false,
    events: [],
  };
}

function moveCircle(body, dx, dy, rad, solids) {
  // Slide along walls: try the x axis, then the y axis.
  let nx = body.x + dx;
  let blocked = false;
  for (const r of solids) {
    if (circleHitsRect(nx, body.y, rad, r)) { blocked = true; break; }
  }
  if (!blocked) body.x = nx;
  let ny = body.y + dy;
  blocked = false;
  for (const r of solids) {
    if (circleHitsRect(body.x, ny, rad, r)) { blocked = true; break; }
  }
  if (!blocked) body.y = ny;
}

function turnToward(current, target, maxStep) {
  const d = angleDiff(target, current);
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}

function updateGuard(world, guard, dt) {
  if (guard.pauseT > 0) {
    guard.pauseT -= dt;
    return;
  }
  const [tx, ty] = guard.waypoints[guard.wpIndex];
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) {
    guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
    guard.pauseT = 0.7;
    return;
  }
  const want = Math.atan2(dy, dx);
  guard.facing = turnToward(guard.facing, want, 2.6 * dt);
  const step = Math.min(dist, guard.speed * dt);
  moveCircle(guard, Math.cos(want) * step, Math.sin(want) * step, GUARD_R, world.solids);
  guard.stepT += dt;
  if (guard.stepT > 0.42) {
    guard.stepT = 0;
    const pd = Math.hypot(world.player.x - guard.x, world.player.y - guard.y);
    world.events.push({ type: "step", gain: Math.max(0, 1 - pd / 520) });
  }
}

export function stepWorld(world, input, dt) {
  if (world.caught || world.won) return world;
  world.events = [];
  world.time += dt;
  const p = world.player;
  p.sneaking = !!input.sneak;
  let mx = input.moveX || 0;
  let my = input.moveY || 0;
  const mag = Math.hypot(mx, my);
  p.moving = mag > 0.01;
  if (p.moving) {
    mx /= mag;
    my /= mag;
    const speed = p.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
    moveCircle(p, mx * speed * dt, my * speed * dt, PLAYER_R, world.solids);
    p.facing = Math.atan2(my, mx);
  }

  for (const g of world.guards) updateGuard(world, g, dt);

  // Detection: any guard with a clear cone view fills the alert meter.
  let seen = false;
  let nearest = Infinity;
  for (const g of world.guards) {
    if (guardSeesPoint(g, p.x, p.y, world.solids)) {
      seen = true;
      const d = Math.hypot(p.x - g.x, p.y - g.y);
      if (d < nearest) nearest = d;
      g.suspicion = Math.min(1, g.suspicion + dt * 1.4);
    } else {
      g.suspicion = Math.max(0, g.suspicion - dt * 0.5);
    }
  }
  world.seenNow = seen;
  if (seen) {
    let rate = ALERT_FILL * (1.25 - nearest / CONE_RANGE);
    if (p.sneaking) rate *= SNEAK_FACTOR;
    if (playerNearCover(p, world.level.crates)) rate *= COVER_FACTOR;
    world.alert = Math.min(1, world.alert + rate * dt);
  } else {
    world.alert = Math.max(0, world.alert - ALERT_DECAY * dt);
  }
  world.peakAlert = Math.max(world.peakAlert, world.alert);
  if (world.alert >= 1) {
    world.caught = true;
    world.events.push({ type: "caught" });
    return world;
  }

  for (const gem of world.gems) {
    if (!gem.taken && Math.hypot(p.x - gem.x, p.y - gem.y) < 22) {
      gem.taken = true;
      world.score += GEM_SCORE;
      world.events.push({ type: "gem" });
    }
  }

  const allGems = world.gems.every((g) => g.taken);
  if (allGems && pointInRect(p.x, p.y, world.level.exit)) {
    world.won = true;
    world.score += LEVEL_BONUS;
    if (world.peakAlert < 0.35) world.score += GHOST_BONUS;
    world.events.push({ type: "win" });
  }
  return world;
}

export function gemsLeft(world) {
  return world.gems.filter((g) => !g.taken).length;
}

export function formatTime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
