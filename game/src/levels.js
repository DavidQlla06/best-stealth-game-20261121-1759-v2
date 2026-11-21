// Velvet Vault — the three museum wings you rob, as plain data.
// Coordinates live in world space: 1280 x 432, origin top-left.
// walls and crates are both solid; crates double as hiding cover.

function borderWalls() {
  return [
    { x: 0, y: 0, w: 1280, h: 14 },
    { x: 0, y: 418, w: 1280, h: 14 },
    { x: 0, y: 0, w: 14, h: 432 },
    { x: 1266, y: 0, w: 14, h: 432 },
  ];
}

export const LEVELS = [
  {
    name: "Wing 1 — Gallery",
    blurb: "Two gems, three patrols. Learn the cones.",
    start: { x: 70, y: 370 },
    exit: { x: 1188, y: 28, w: 64, h: 48 },
    walls: [
      ...borderWalls(),
      { x: 430, y: 14, w: 16, h: 250 },
      { x: 850, y: 168, w: 16, h: 250 },
    ],
    crates: [
      { x: 250, y: 180, w: 48, h: 48 },
      { x: 620, y: 200, w: 48, h: 48 },
      { x: 1000, y: 240, w: 48, h: 48 },
      { x: 150, y: 300, w: 48, h: 48 },
      { x: 720, y: 110, w: 48, h: 48 },
    ],
    gems: [
      { x: 640, y: 70 },
      { x: 1120, y: 360 },
    ],
    guards: [
      { waypoints: [[120, 70], [380, 70], [380, 150], [120, 150]], speed: 62 },
      { waypoints: [[520, 90], [790, 90], [790, 340], [520, 340]], speed: 58 },
      { waypoints: [[950, 110], [1200, 110], [1200, 200], [950, 200]], speed: 66 },
    ],
  },
  {
    name: "Wing 2 — Sculpture Hall",
    blurb: "Plinths everywhere. Use them, or be seen.",
    start: { x: 70, y: 70 },
    exit: { x: 1188, y: 356, w: 64, h: 48 },
    walls: [
      ...borderWalls(),
      { x: 320, y: 120, w: 16, h: 298 },
      { x: 640, y: 14, w: 16, h: 260 },
      { x: 960, y: 158, w: 16, h: 260 },
      { x: 336, y: 120, w: 180, h: 16 },
      { x: 800, y: 290, w: 160, h: 16 },
    ],
    crates: [
      { x: 180, y: 220, w: 48, h: 48 },
      { x: 460, y: 320, w: 48, h: 48 },
      { x: 760, y: 90, w: 48, h: 48 },
      { x: 1080, y: 180, w: 48, h: 48 },
      { x: 460, y: 250, w: 48, h: 48 },
      { x: 1120, y: 300, w: 48, h: 48 },
    ],
    gems: [
      { x: 470, y: 70 },
      { x: 800, y: 360 },
      { x: 1140, y: 80 },
    ],
    guards: [
      { waypoints: [[80, 330], [270, 330], [270, 180], [80, 180]], speed: 66 },
      { waypoints: [[400, 200], [580, 200], [580, 380], [400, 380]], speed: 62 },
      { waypoints: [[720, 200], [900, 200], [900, 260], [720, 260]], speed: 70 },
      { waypoints: [[1030, 90], [1210, 90], [1210, 140], [1030, 140]], speed: 64 },
    ],
  },
  {
    name: "Wing 3 — The Vault",
    blurb: "The crown jewels. Faster boots, tighter halls.",
    start: { x: 640, y: 386 },
    exit: { x: 608, y: 28, w: 64, h: 48 },
    walls: [
      ...borderWalls(),
      { x: 240, y: 14, w: 16, h: 250 },
      { x: 1024, y: 168, w: 16, h: 250 },
      { x: 480, y: 150, w: 16, h: 268 },
      { x: 784, y: 14, w: 16, h: 250 },
      { x: 496, y: 150, w: 200, h: 16 },
    ],
    crates: [
      { x: 120, y: 140, w: 48, h: 48 },
      { x: 340, y: 240, w: 48, h: 48 },
      { x: 600, y: 240, w: 48, h: 48 },
      { x: 880, y: 120, w: 48, h: 48 },
      { x: 1120, y: 260, w: 48, h: 48 },
      { x: 880, y: 260, w: 48, h: 48 },
    ],
    gems: [
      { x: 120, y: 60 },
      { x: 1160, y: 70 },
      { x: 640, y: 110 },
    ],
    guards: [
      { waypoints: [[70, 220], [190, 220], [190, 360], [70, 360]], speed: 74 },
      { waypoints: [[300, 80], [430, 80], [430, 330], [300, 330]], speed: 70 },
      { waypoints: [[560, 330], [720, 330], [720, 200], [560, 200]], speed: 78 },
      { waypoints: [[850, 90], [970, 90], [970, 330], [850, 330]], speed: 72 },
      { waypoints: [[1090, 140], [1210, 140], [1210, 360], [1090, 360]], speed: 76 },
    ],
  },
];
