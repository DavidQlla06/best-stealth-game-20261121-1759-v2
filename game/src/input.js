// Velvet Vault — keyboard and mouse input.
// Keys drive movement directly; a click sets a walk-to target the
// burglar follows until a key takes over or the target is reached.

import { HUD_H } from "./config.js";

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    clickTarget: null,
    clicks: [],
    pressed: new Set(),
  };

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
    if (!keys.has(k)) state.pressed.add(k);
    keys.add(k);
    state.clickTarget = null;
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
  });

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    state.clicks.push({ x, y });
    if (y >= HUD_H) {
      state.clickTarget = { x, y: y - HUD_H };
    }
  });

  return state;
}

export function readMove(input, player) {
  let moveX = 0;
  let moveY = 0;
  const k = input.keys;
  if (k.has("a") || k.has("arrowleft")) moveX -= 1;
  if (k.has("d") || k.has("arrowright")) moveX += 1;
  if (k.has("w") || k.has("arrowup")) moveY -= 1;
  if (k.has("s") || k.has("arrowdown")) moveY += 1;
  if (moveX === 0 && moveY === 0 && input.clickTarget) {
    const dx = input.clickTarget.x - player.x;
    const dy = input.clickTarget.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      input.clickTarget = null;
    } else {
      moveX = dx / d;
      moveY = dy / d;
    }
  }
  return {
    moveX,
    moveY,
    sneak: k.has("shift"),
  };
}

export function takePress(input, key) {
  if (input.pressed.has(key)) {
    input.pressed.delete(key);
    return true;
  }
  return false;
}

export function clearPresses(input) {
  input.pressed.clear();
}
