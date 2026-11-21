// Velvet Vault — tiny WebAudio blips, no audio files.
// The context is created on the first user gesture so the browser allows it.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = "sine", gain = 0.12, when = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function blipPickup() {
  tone(880, 0.09, "triangle", 0.14);
  tone(1318, 0.14, "triangle", 0.12, 0.07);
}

export function blipAlertTick() {
  tone(1175, 0.06, "square", 0.05);
}

export function blipCaught() {
  tone(392, 0.18, "sawtooth", 0.14);
  tone(311, 0.22, "sawtooth", 0.14, 0.14);
  tone(233, 0.34, "sawtooth", 0.14, 0.3);
}

export function blipWin() {
  tone(523, 0.12, "triangle", 0.13);
  tone(659, 0.12, "triangle", 0.13, 0.11);
  tone(784, 0.12, "triangle", 0.13, 0.22);
  tone(1046, 0.24, "triangle", 0.13, 0.33);
}

export function blipClick() {
  tone(660, 0.05, "sine", 0.08);
}

export function blipStep(gain) {
  if (!ctx || muted || gain <= 0.02) return;
  tone(140, 0.05, "sine", 0.05 * gain);
}
