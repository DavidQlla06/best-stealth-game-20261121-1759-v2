// Velvet Vault — game shell: states, loop, buttons, screenshot poses.
// Steal every gem in the wing, then slip out the EXIT unseen.
// WASD/arrows or click to move · Shift sneak · P pause · R restart · M mute.

import { LEVELS } from "./levels.js";
import { createWorld, stepWorld, formatTime } from "./engine.js";
import { drawWorld, drawDim, drawCenterText, drawButton } from "./render.js";
import { createInput, readMove, takePress, clearPresses } from "./input.js";
import { ensureAudio, setMuted, isMuted, blipPickup, blipCaught, blipWin, blipClick, blipStep, blipAlertTick } from "./audio.js";
import { COLORS } from "./config.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const input = createInput(canvas);

const params = new URLSearchParams(window.location.search);
const shotName = params.get("shot");
const seed = Number(params.get("seed") || 1) || 1;

let state = "title";
let levelIndex = 0;
let world = createWorld(LEVELS[0], 0);
let totalScore = 0;
let totalTime = 0;
let lastTs = 0;
let alertTickT = 0;
let hoverBtn = null;

const TITLE_BUTTONS = [
  { id: "start", label: "Start the heist", x: 490, y: 300, w: 300, h: 48 },
  { id: "howto", label: "How to play", x: 490, y: 360, w: 300, h: 48 },
];
const PAUSE_BUTTONS = [
  { id: "resume", label: "Resume", x: 515, y: 250, w: 250, h: 44 },
  { id: "restart", label: "Restart wing", x: 515, y: 306, w: 250, h: 44 },
  { id: "title", label: "Back to title", x: 515, y: 362, w: 250, h: 44 },
];
const CAUGHT_BUTTONS = [
  { id: "retry", label: "Try again", x: 515, y: 300, w: 250, h: 44 },
  { id: "title", label: "Back to title", x: 515, y: 356, w: 250, h: 44 },
];
const WIN_BUTTONS = [
  { id: "next", label: "Next wing", x: 515, y: 310, w: 250, h: 44 },
  { id: "title", label: "Back to title", x: 515, y: 366, w: 250, h: 44 },
];
const VICTORY_BUTTONS = [
  { id: "again", label: "Play again", x: 515, y: 320, w: 250, h: 44 },
];

function buttonsForState() {
  if (state === "title" || state === "howto") return state === "title" ? TITLE_BUTTONS : [{ id: "back", label: "Back", x: 515, y: 390, w: 250, h: 44 }];
  if (state === "paused") return PAUSE_BUTTONS;
  if (state === "caught") return CAUGHT_BUTTONS;
  if (state === "levelwin") return WIN_BUTTONS;
  if (state === "victory") return VICTORY_BUTTONS;
  return [];
}

function startRun() {
  levelIndex = 0;
  totalScore = 0;
  totalTime = 0;
  world = createWorld(LEVELS[0], 0);
  state = "playing";
}

function restartWing() {
  world = createWorld(LEVELS[levelIndex], levelIndex);
  state = "playing";
}

function nextWing() {
  totalScore += world.score;
  totalTime += world.time;
  levelIndex += 1;
  if (levelIndex >= LEVELS.length) {
    state = "victory";
  } else {
    world = createWorld(LEVELS[levelIndex], levelIndex);
    state = "playing";
  }
}

function handleButton(id) {
  ensureAudio();
  blipClick();
  if (id === "start") startRun();
  else if (id === "howto") state = "howto";
  else if (id === "back") state = "title";
  else if (id === "resume") state = "playing";
  else if (id === "restart" || id === "retry") restartWing();
  else if (id === "title") { state = "title"; world = createWorld(LEVELS[0], 0); }
  else if (id === "next") nextWing();
  else if (id === "again") startRun();
}

function handleClicks() {
  const btns = buttonsForState();
  for (const c of input.clicks) {
    ensureAudio();
    for (const b of btns) {
      if (c.x >= b.x && c.x <= b.x + b.w && c.y >= b.y && c.y <= b.y + b.h) {
        handleButton(b.id);
        break;
      }
    }
  }
  input.clicks = [];
}

canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  hoverBtn = null;
  for (const b of buttonsForState()) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) hoverBtn = b.id;
  }
});

function handleKeys() {
  if (takePress(input, "m")) {
    setMuted(!isMuted());
  }
  if (state === "playing") {
    if (takePress(input, "p") || takePress(input, "escape")) state = "paused";
    if (takePress(input, "r")) restartWing();
  } else if (state === "paused") {
    if (takePress(input, "p") || takePress(input, "escape") || takePress(input, "enter")) state = "playing";
    if (takePress(input, "r")) restartWing();
  } else if (state === "title") {
    if (takePress(input, "enter") || takePress(input, " ")) startRun();
  } else if (state === "caught") {
    if (takePress(input, "enter") || takePress(input, "r")) restartWing();
  } else if (state === "levelwin") {
    if (takePress(input, "enter")) nextWing();
  } else if (state === "victory") {
    if (takePress(input, "enter")) startRun();
  } else if (state === "howto") {
    if (takePress(input, "escape") || takePress(input, "enter")) state = "title";
  }
  clearPresses(input);
}

function playEvents() {
  for (const ev of world.events) {
    if (ev.type === "gem") blipPickup();
    else if (ev.type === "caught") blipCaught();
    else if (ev.type === "win") blipWin();
    else if (ev.type === "step") blipStep(ev.gain);
  }
}

function update(dt) {
  handleClicks();
  handleKeys();
  if (state !== "playing") return;
  const move = readMove(input, world.player);
  stepWorld(world, move, dt);
  playEvents();
  if (world.seenNow) {
    alertTickT += dt;
    if (alertTickT > 0.28) {
      alertTickT = 0;
      blipAlertTick();
    }
  } else {
    alertTickT = 0;
  }
  if (world.caught) state = "caught";
  else if (world.won) state = levelIndex + 1 >= LEVELS.length ? "levelwin" : "levelwin";
}

function drawTitle() {
  drawWorld(ctx, world, { totalScore: 0, muted: isMuted(), time: 0, seed });
  drawDim(ctx, 0.58);
  drawCenterText(ctx, {
    y: 150,
    items: [
      { text: "VELVET VAULT", font: "bold 64px system-ui, sans-serif", color: "#ffd76e", gap: 52 },
      { text: "A museum heist in three wings — steal the gems, dodge the cones, vanish.", font: "18px system-ui, sans-serif", gap: 34 },
      { text: "WASD / arrows or click to move · Shift sneak · P pause · R restart · M mute", font: "15px system-ui, sans-serif", color: COLORS.muted, gap: 30 },
    ],
  });
  for (const b of TITLE_BUTTONS) drawButton(ctx, b, hoverBtn === b.id);
}

function drawHowto() {
  drawWorld(ctx, world, { totalScore: 0, muted: isMuted(), time: 0, seed });
  drawDim(ctx, 0.72);
  drawCenterText(ctx, {
    y: 120,
    items: [
      { text: "HOW TO PLAY", font: "bold 36px system-ui, sans-serif", color: "#ffd76e", gap: 44 },
      { text: "Guards patrol with flashlight cones. Crates and walls block their sight —", font: "17px system-ui, sans-serif", gap: 26 },
      { text: "hide behind cover and the cone is clipped where you stand.", font: "17px system-ui, sans-serif", gap: 34 },
      { text: "Sneak (Shift) and hugging cover slow the Alert meter. Break line of sight", font: "17px system-ui, sans-serif", gap: 26 },
      { text: "and it drains. Full meter means caught. Listen for footsteps nearby.", font: "17px system-ui, sans-serif", gap: 34 },
      { text: "Grab every gem, then reach the EXIT. Finish unseen for the Ghost bonus.", font: "17px system-ui, sans-serif", gap: 30 },
    ],
  });
  drawButton(ctx, { id: "back", label: "Back", x: 515, y: 390, w: 250, h: 44 }, hoverBtn === "back");
}

function drawOverlay(title, lines, btns) {
  drawDim(ctx, 0.6);
  drawCenterText(ctx, {
    y: 170,
    items: [
      { text: title, font: "bold 44px system-ui, sans-serif", color: "#ffd76e", gap: 46 },
      ...lines.map((t) => ({ text: t, font: "18px system-ui, sans-serif", gap: 30 })),
    ],
  });
  for (const b of btns) drawButton(ctx, b, hoverBtn === b.id);
}

function draw() {
  if (state === "title") { drawTitle(); return; }
  if (state === "howto") { drawHowto(); return; }
  drawWorld(ctx, world, { totalScore, muted: isMuted(), time: world.time, seed });
  if (state === "paused") drawOverlay("PAUSED", [`${world.level.name} — take a breath.`], PAUSE_BUTTONS);
  else if (state === "caught") drawOverlay("CAUGHT!", ["A guard spotted you. The wing resets — patience wins."], CAUGHT_BUTTONS);
  else if (state === "levelwin") {
    const last = levelIndex + 1 >= LEVELS.length;
    drawOverlay(last ? "VAULT EMPTIED!" : "WING CLEARED!", [
      `Time ${formatTime(world.time)} · Wing score ${world.score}`,
      world.peakAlert < 0.35 ? "Ghost bonus earned — barely a whisper." : "You were nearly seen. Sneak more next wing.",
    ], last ? VICTORY_BUTTONS.map((b) => ({ ...b, id: "again" })) : WIN_BUTTONS);
  } else if (state === "victory") {
    drawOverlay("MASTER THIEF!", [
      `All three wings robbed. Final score ${totalScore + world.score}.`,
      `Total time ${formatTime(totalTime + world.time)}. The Velvet Vault is yours.`,
    ], VICTORY_BUTTONS);
  }
}

// --- Screenshot poses: ?shot=<name>&seed=1 freezes a posed scene. ---
function poseShot(name) {
  world = createWorld(LEVELS[0], 0);
  if (name === "title") {
    state = "title";
    return;
  }
  if (name === "play") {
    state = "playing";
    world.player.x = 600;
    world.player.y = 270;
    world.player.facing = -Math.PI / 2;
    world.player.sneaking = true;
    world.gems[0].taken = true;
    world.score = 100;
    world.time = 47;
    world.alert = 0.22;
    world.guards[0].x = 250; world.guards[0].y = 110; world.guards[0].facing = 0;
    world.guards[1].x = 520; world.guards[1].y = 200; world.guards[1].facing = Math.PI / 2;
    world.guards[2].x = 1080; world.guards[2].y = 150; world.guards[2].facing = Math.PI;
    return;
  }
  if (name === "alert") {
    state = "playing";
    world.player.x = 560;
    world.player.y = 150;
    world.player.facing = 0;
    world.gems[0].taken = true;
    world.score = 100;
    world.time = 83;
    world.alert = 0.86;
    world.peakAlert = 0.86;
    world.seenNow = true;
    world.guards[0].x = 250; world.guards[0].y = 110; world.guards[0].facing = 0.4;
    world.guards[1].x = 500; world.guards[1].y = 150; world.guards[1].facing = 0;
    world.guards[1].suspicion = 0.9;
    world.guards[2].x = 1080; world.guards[2].y = 150; world.guards[2].facing = Math.PI;
    return;
  }
  if (name === "victory") {
    state = "victory";
    totalScore = 850;
    totalTime = 240;
    world.time = 95;
    world.score = 300;
    for (const g of world.gems) g.taken = true;
    world.player.x = 1220;
    world.player.y = 52;
    return;
  }
  state = "title";
}

if (shotName) {
  poseShot(shotName);
  draw();
} else {
  const loop = (ts) => {
    const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
    lastTs = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
