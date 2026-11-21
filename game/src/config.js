// Velvet Vault — shared tuning constants for the museum heist.
// One place for sizes, speeds and detection numbers so the engine,
// the renderer and the tests all agree on the same world.

export const VIEW_W = 1280;
export const VIEW_H = 480;
export const HUD_H = 48;
export const WORLD_W = 1280;
export const WORLD_H = 432;

export const PLAYER_R = 12;
export const PLAYER_SPEED = 168;
export const PLAYER_SNEAK_SPEED = 92;
export const GUARD_R = 12;

export const CONE_RANGE = 196;
export const CONE_HALF_ANGLE = 0.62;
export const CONE_RAYS = 26;

export const ALERT_FILL = 0.85;
export const ALERT_DECAY = 0.22;
export const SNEAK_FACTOR = 0.5;
export const COVER_FACTOR = 0.42;
export const COVER_DIST = 30;

export const GEM_SCORE = 100;
export const GHOST_BONUS = 250;
export const LEVEL_BONUS = 150;

export const COLORS = {
  floorA: "#232838",
  floorB: "#1d2230",
  wall: "#39415c",
  wallTop: "#4a5478",
  crate: "#8a5a2e",
  crateDark: "#6d4522",
  coneCalm: "rgba(255, 214, 110, 0.30)",
  coneWarn: "rgba(255, 150, 60, 0.38)",
  coneHot: "rgba(255, 70, 60, 0.42)",
  guardBody: "#2f4d8f",
  guardCap: "#1c2f57",
  playerBody: "#173d2c",
  playerTrim: "#37d99a",
  gem: "#5ee7ff",
  exit: "#2ecc71",
  text: "#eef1f8",
  muted: "#9aa4bd",
};
