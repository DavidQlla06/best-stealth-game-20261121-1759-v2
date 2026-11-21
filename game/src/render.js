// Velvet Vault — canvas rendering: floor, cones, guards, burglar, HUD.
// Vision cones are drawn from the engine's raycast polygon, so what
// you see clipped by a crate is exactly what the guard cannot see.

import { VIEW_W, VIEW_H, HUD_H, COLORS, PLAYER_R, GUARD_R } from "./config.js";
import { visionPolygon, formatTime, gemsLeft } from "./engine.js";

export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawButton(ctx, btn, hovered) {
  ctx.fillStyle = hovered ? "#3d5a99" : "#2b3c63";
  roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8);
  ctx.fill();
  ctx.strokeStyle = "#7fa0e0";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 17px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 1);
}

function drawFloor(ctx, rng) {
  const tile = 64;
  for (let ty = 0; ty < 432; ty += tile) {
    for (let tx = 0; tx < VIEW_W; tx += tile) {
      const odd = ((tx / tile) + (ty / tile)) % 2 === 0;
      ctx.fillStyle = odd ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx, ty + HUD_H, tile, tile);
    }
  }
  // Faint carpet diamonds so the hall reads as a museum, not a void.
  ctx.fillStyle = "rgba(120, 90, 180, 0.10)";
  for (let i = 0; i < 26; i++) {
    const x = 40 + rng() * (VIEW_W - 80);
    const y = HUD_H + 30 + rng() * 372;
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + 9, y);
    ctx.lineTo(x, y + 9);
    ctx.lineTo(x - 9, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y + HUD_H, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y + HUD_H, w.w, Math.min(5, w.h));
  }
}

function drawCrates(ctx, level) {
  for (const c of level.crates) {
    const y = c.y + HUD_H;
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(c.x, y, c.w, c.h);
    ctx.strokeStyle = COLORS.crateDark;
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x + 2, y + 2, c.w - 4, c.h - 4);
    ctx.beginPath();
    ctx.moveTo(c.x, y);
    ctx.lineTo(c.x + c.w, y + c.h);
    ctx.moveTo(c.x + c.w, y);
    ctx.lineTo(c.x, y + c.h);
    ctx.lineWidth = 2;
    ctx.stroke();
    // A pale top edge marks crates as cover you can hide behind.
    ctx.fillStyle = "rgba(255, 226, 160, 0.55)";
    ctx.fillRect(c.x, y, c.w, 4);
  }
}

function drawExit(ctx, level, open) {
  const e = level.exit;
  const y = e.y + HUD_H;
  ctx.fillStyle = open ? "#14532d" : "#3a3f4d";
  ctx.fillRect(e.x, y, e.w, e.h);
  ctx.strokeStyle = open ? COLORS.exit : "#6b7280";
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x + 2, y + 2, e.w - 4, e.h - 4);
  ctx.fillStyle = open ? "#7dffa8" : "#9aa4bd";
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXIT", e.x + e.w / 2, y + e.h / 2 - 6);
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillText(open ? "GO!" : "LOCKED", e.x + e.w / 2, y + e.h / 2 + 10);
}

function drawGems(ctx, world, t) {
  for (const gem of world.gems) {
    if (gem.taken) continue;
    const y = gem.y + HUD_H;
    const bob = Math.sin(t * 2.4 + gem.x * 0.05) * 2;
    ctx.save();
    ctx.translate(gem.x, y + bob);
    ctx.fillStyle = COLORS.gem;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(9, -3);
    ctx.lineTo(0, 12);
    ctx.lineTo(-9, -3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(5, -3);
    ctx.lineTo(-5, -3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "rgba(94, 231, 255, 0.18)";
    ctx.beginPath();
    ctx.arc(gem.x, y + bob, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCones(ctx, world) {
  for (const g of world.guards) {
    const poly = visionPolygon(g, world.solids);
    const hot = g.suspicion > 0.55;
    const warn = g.suspicion > 0.15;
    ctx.fillStyle = hot ? COLORS.coneHot : warn ? COLORS.coneWarn : COLORS.coneCalm;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y + HUD_H);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y + HUD_H);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGuard(ctx, g) {
  const y = g.y + HUD_H;
  ctx.fillStyle = COLORS.guardBody;
  ctx.beginPath();
  ctx.arc(g.x, y, GUARD_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#10182c";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim points the way the guard faces.
  ctx.fillStyle = COLORS.guardCap;
  ctx.beginPath();
  ctx.arc(g.x, y, GUARD_R - 3, g.facing - 1.1, g.facing + 1.1);
  ctx.lineTo(g.x, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffd76e";
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.facing) * 6, y + Math.sin(g.facing) * 6, 2.5, 0, Math.PI * 2);
  ctx.fill();
  if (g.suspicion > 0.12) {
    ctx.fillStyle = g.suspicion > 0.55 ? "#ff5040" : "#ffb020";
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(g.suspicion > 0.55 ? "!" : "?", g.x, y - GUARD_R - 8);
  }
}

function drawPlayer(ctx, p) {
  const y = p.y + HUD_H;
  ctx.fillStyle = COLORS.playerBody;
  ctx.beginPath();
  ctx.arc(p.x, y, PLAYER_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.playerTrim;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hood peak toward facing, plus a loot sack dot behind.
  ctx.fillStyle = COLORS.playerTrim;
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 7, y + Math.sin(p.facing) * 7, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c9a86a";
  ctx.beginPath();
  ctx.arc(p.x - Math.cos(p.facing) * 9, y - Math.sin(p.facing) * 9, 4.5, 0, Math.PI * 2);
  ctx.fill();
  if (p.sneaking) {
    ctx.strokeStyle = "rgba(55, 217, 154, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, y, PLAYER_R + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, world, totalScore, muted) {
  ctx.fillStyle = "#141926";
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = "#2a3350";
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`VELVET VAULT — ${world.level.name}`, 14, 24);
  ctx.font = "15px system-ui, sans-serif";
  const left = gemsLeft(world);
  ctx.fillText(`Gems left: ${left}`, 560, 24);
  ctx.fillText(`Time ${formatTime(world.time)}`, 700, 24);
  ctx.fillText(`Score ${totalScore + world.score}`, 820, 24);
  // Alert meter: green calm, amber noticed, red about to be caught.
  ctx.fillText("Alert", 990, 24);
  ctx.fillStyle = "#2a3350";
  roundRect(ctx, 1040, 16, 150, 16, 8);
  ctx.fill();
  const a = world.alert;
  ctx.fillStyle = a > 0.7 ? "#ff5040" : a > 0.35 ? "#ffb020" : "#37d99a";
  if (a > 0.01) {
    roundRect(ctx, 1042, 18, Math.max(10, 146 * a), 12, 6);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.muted;
  ctx.font = "13px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(muted ? "M: sound off" : "M: sound on", VIEW_W - 14, 24);
}

export function drawWorld(ctx, world, opts) {
  const { totalScore = 0, muted = false, time = 0, seed = 1 } = opts || {};
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, seededRandom(seed));
  const open = gemsLeft(world) === 0;
  drawExit(ctx, world.level, open);
  drawGems(ctx, world, time);
  drawCones(ctx, world);
  drawWalls(ctx, world.level);
  drawCrates(ctx, world.level);
  for (const g of world.guards) drawGuard(ctx, g);
  drawPlayer(ctx, world.player);
  if (world.alert > 0.55) {
    ctx.fillStyle = `rgba(255, 40, 30, ${(world.alert - 0.55) * 0.35})`;
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  }
  drawHud(ctx, world, totalScore, muted);
}

export function drawDim(ctx, alpha = 0.62) {
  ctx.fillStyle = `rgba(8, 10, 18, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawCenterText(ctx, lines) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let y = lines.y;
  for (const line of lines.items) {
    ctx.fillStyle = line.color || COLORS.text;
    ctx.font = line.font || "18px system-ui, sans-serif";
    ctx.fillText(line.text, VIEW_W / 2, y);
    y += line.gap || 30;
  }
}
