// Sound effects and music generated with the Web Audio API, so there are no audio files.
import { settings, onSettings } from './settings.js';

let ctx = null;
let master, sfxBus, musicBus;
let muted = false;
let musicMode = null;
let musicTimer = null;
let beat = 0;

try { muted = localStorage.getItem('darquest-muted') === '1'; } catch { /* ignore */ }

// Browsers only allow audio after a click or key press, so call this from one.
export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.connect(ctx.destination);
  sfxBus = ctx.createGain();
  sfxBus.connect(master);
  musicBus = ctx.createGain();
  applyVolumes();
  // a little echo makes the music feel magical
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.33;
  const fb = ctx.createGain();
  fb.gain.value = 0.35;
  musicBus.connect(master);
  musicBus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(master);
  if (musicMode) startMusic(musicMode);
}

export function isMuted() { return muted; }

// Master, music and effects volumes come from the settings menu.
export function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(muted ? 0 : 0.7 * settings.master, t, 0.05);
  sfxBus.gain.setTargetAtTime(settings.sfx, t, 0.05);
  musicBus.gain.setTargetAtTime(0.36 * settings.music, t, 0.05);
}
onSettings(() => applyVolumes());

export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('darquest-muted', muted ? '1' : '0'); } catch { /* ignore */ }
  applyVolumes();
  return muted;
}

function tone(freq, dur, { type = 'sine', vol = 0.25, attack = 0.01, when = 0, slide = 0, bus = sfxBus } = {}) {
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let noiseBuf = null;
function noise(dur, { vol = 0.3, when = 0, freq = 1200, type = 'lowpass', sweep = 0 } = {}) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + when;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweep) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(sfxBus);
  src.start(t);
  src.stop(t + dur + 0.05);
}

const SCHOOL_ROOT = { blaze: 220, frost: 330, tempest: 294, verdant: 262, umbral: 196, arcane: 247, astral: 392 };
const note = (root, semis) => root * Math.pow(2, semis / 12);

export function sfx(name, school = 'arcane') {
  if (!ctx || muted) return;
  const root = SCHOOL_ROOT[school] || 262;
  switch (name) {
    case 'click': tone(880, 0.06, { type: 'triangle', vol: 0.08 }); break;
    case 'cast':
      [0, 4, 7, 12].forEach((s, i) => tone(note(root, s), 0.35, { type: 'triangle', vol: 0.12, when: i * 0.05 }));
      noise(0.4, { vol: 0.06, freq: 2000, type: 'highpass' });
      break;
    case 'hit':
      noise(0.25, { vol: 0.35, freq: 900, sweep: 0.3 });
      tone(120, 0.2, { type: 'square', vol: 0.12, slide: 0.5 });
      break;
    case 'bighit':
      noise(0.8, { vol: 0.5, freq: 600, sweep: 0.2 });
      tone(70, 0.7, { type: 'sine', vol: 0.4, slide: 0.4 });
      break;
    case 'heal':
      [0, 4, 7, 11, 14].forEach((s, i) => tone(note(523, s), 0.5, { vol: 0.1, when: i * 0.07 }));
      break;
    case 'buff':
      tone(note(root, 12), 0.5, { type: 'triangle', vol: 0.12, slide: 1.5 });
      break;
    case 'fizzle':
      tone(400, 0.5, { type: 'sawtooth', vol: 0.06, slide: 0.3 });
      noise(0.4, { vol: 0.08, freq: 3000, type: 'highpass' });
      break;
    case 'victory':
      [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => tone(note(392, s), i === 6 ? 0.9 : 0.25, { type: 'triangle', vol: 0.15, when: i * 0.13 }));
      break;
    case 'defeat':
      [0, -3, -7, -12].forEach((s, i) => tone(note(330, s), 0.6, { type: 'triangle', vol: 0.14, when: i * 0.3 }));
      break;
    case 'levelup':
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(note(392, s), 0.4, { type: 'square', vol: 0.06, when: i * 0.07 }));
      break;
    case 'quest': [0, 7, 12].forEach((s, i) => tone(note(523, s), 0.4, { type: 'triangle', vol: 0.12, when: i * 0.1 })); break;
    case 'loot': [0, 12, 19].forEach((s, i) => tone(note(784, s), 0.3, { vol: 0.1, when: i * 0.06 })); break;
    case 'warp':
      tone(200, 1.2, { type: 'sine', vol: 0.2, slide: 6 });
      noise(1.2, { vol: 0.15, freq: 400, sweep: 8, type: 'bandpass' });
      break;
    case 'drink': [0, 3, 7].forEach((s, i) => tone(note(600, s), 0.12, { vol: 0.12, when: i * 0.08 })); break;
    case 'boss':
      tone(55, 1.5, { type: 'sawtooth', vol: 0.2, slide: 0.8 });
      noise(1.2, { vol: 0.3, freq: 300, sweep: 0.3 });
      break;
    case 'pet': tone(1200, 0.15, { type: 'triangle', vol: 0.1, slide: 1.6 }); tone(1500, 0.15, { type: 'triangle', vol: 0.08, when: 0.1, slide: 1.4 }); break;
    case 'dodge': noise(0.25, { vol: 0.2, freq: 1800, sweep: 0.4, type: 'bandpass' }); break;
    case 'warn': tone(660, 0.12, { type: 'square', vol: 0.05 }); tone(660, 0.12, { type: 'square', vol: 0.05, when: 0.16 }); break;
    case 'crit': tone(1320, 0.18, { type: 'triangle', vol: 0.1, slide: 1.5 }); noise(0.2, { vol: 0.2, freq: 3000, type: 'highpass' }); break;
    case 'combo': [0, 7, 12, 19].forEach((s, i) => tone(note(root * 2, s), 0.18, { type: 'triangle', vol: 0.08, when: i * 0.04 })); break;
    case 'chop': noise(0.12, { vol: 0.35, freq: 700, sweep: 0.5 }); tone(160, 0.1, { type: 'square', vol: 0.06, slide: 0.6 }); break;
    case 'mine': tone(1800, 0.12, { type: 'square', vol: 0.05, slide: 0.7 }); noise(0.15, { vol: 0.25, freq: 2500, type: 'highpass' }); break;
    case 'splash': noise(0.5, { vol: 0.25, freq: 900, sweep: 2.5, type: 'bandpass' }); break;
    case 'pick': [0, 5].forEach((s, i) => tone(note(880, s), 0.1, { type: 'triangle', vol: 0.07, when: i * 0.05 })); break;
    case 'craft': [0, 4, 7].forEach((s, i) => tone(note(440, s), 0.2, { type: 'square', vol: 0.05, when: i * 0.07 })); noise(0.2, { vol: 0.15, freq: 1500 }); break;
    case 'eat': [0, 1, 2].forEach(i => noise(0.08, { vol: 0.2, freq: 1200, when: i * 0.12 })); break;
    case 'coin': tone(1568, 0.08, { type: 'square', vol: 0.05 }); tone(2093, 0.25, { type: 'square', vol: 0.05, when: 0.07 }); break;
    case 'fail': tone(200, 0.3, { type: 'sawtooth', vol: 0.06, slide: 0.6 }); break;
    case 'skill': [0, 4, 7, 12].forEach((s, i) => tone(note(523, s), 0.5, { type: 'triangle', vol: 0.1, when: i * 0.1 })); tone(note(523, 24), 0.8, { vol: 0.06, when: 0.4 }); break;
    case 'chest': [0, 4, 7, 11, 14, 19].forEach((s, i) => tone(note(659, s), 0.3, { vol: 0.08, when: i * 0.05 })); break;
    case 'shrine': [0, 7, 12, 16].forEach((s, i) => tone(note(330, s), 1.2, { vol: 0.08, attack: 0.1, when: i * 0.15 })); break;
    case 'door': tone(90, 0.8, { type: 'sawtooth', vol: 0.08, slide: 0.7 }); noise(0.8, { vol: 0.12, freq: 300 }); break;
    case 'place': tone(300, 0.08, { type: 'square', vol: 0.06, slide: 0.8 }); noise(0.06, { vol: 0.15, freq: 800 }); break;
    case 'break': noise(0.2, { vol: 0.3, freq: 1200, sweep: 0.3 }); break;
    case 'roar':
      tone(90, 1.4, { type: 'sawtooth', vol: 0.25, slide: 0.55 });
      tone(135, 1.2, { type: 'sawtooth', vol: 0.15, slide: 0.6, when: 0.05 });
      noise(1.4, { vol: 0.35, freq: 500, sweep: 0.4 });
      break;
    case 'shout':
      tone(110, 0.9, { type: 'sawtooth', vol: 0.2, slide: 0.7 });
      noise(0.9, { vol: 0.4, freq: 400, sweep: 3, type: 'bandpass' });
      tone(220, 0.6, { type: 'square', vol: 0.08, slide: 0.5, when: 0.05 });
      break;
    case 'flap': noise(0.3, { vol: 0.25, freq: 250, sweep: 0.5 }); break;
    case 'thunder':
      noise(2.5, { vol: 0.5, freq: 180, sweep: 0.4 });
      noise(1.2, { vol: 0.35, freq: 600, sweep: 0.2, when: 0.1 });
      tone(45, 2, { type: 'sine', vol: 0.25, slide: 0.7 });
      break;
  }
}

// ------------------------------------------------------------ music

const SCALES = {
  academy: { root: 262, steps: [0, 2, 4, 7, 9, 12, 14, 16], tempo: 420, bass: [0, -5, -3, -7] },
  ember:   { root: 220, steps: [0, 3, 5, 7, 10, 12, 15], tempo: 400, bass: [0, -2, -4, -5] },
  battle:  { root: 196, steps: [0, 3, 5, 7, 8, 12, 15], tempo: 230, bass: [0, 0, -4, -2] },
  boss:    { root: 175, steps: [0, 1, 5, 6, 7, 12, 13], tempo: 200, bass: [0, 0, 1, 0] },
  meadow:  { root: 294, steps: [0, 2, 4, 7, 9, 12, 14], tempo: 380, bass: [0, 5, -3, 7] },
  rift:    { root: 185, steps: [0, 2, 4, 6, 8, 10, 12], tempo: 460, bass: [0, 6, 0, 4] },
  dragon:  { root: 196, steps: [0, 2, 3, 5, 7, 9, 10, 12], tempo: 360, bass: [0, -2, -5, -4] },
  home:    { root: 349, steps: [0, 2, 4, 6, 7, 9, 11, 12], tempo: 440, bass: [0, 4, 5, 7] },
  frost:   { root: 330, steps: [0, 2, 3, 7, 8, 12, 14], tempo: 480, bass: [0, -4, -5, -7] },
  crypt:   { root: 147, steps: [0, 1, 3, 6, 7, 10, 12], tempo: 540, bass: [0, -1, -5, -6] },
};

function startMusic(mode) {
  clearInterval(musicTimer);
  if (!ctx || !mode) return;
  const sc = SCALES[mode];
  beat = 0;
  musicTimer = setInterval(() => {
    if (muted) return;
    const battle = mode === 'battle' || mode === 'boss';
    if (beat % 8 === 0) {
      const b = sc.bass[(beat / 8) % sc.bass.length];
      tone(note(sc.root / 2, b), battle ? 1.6 : 3.2, { type: battle ? 'sawtooth' : 'triangle', vol: battle ? 0.07 : 0.1, attack: 0.05, bus: musicBus });
    }
    if (battle && beat % 2 === 0) tone(note(sc.root / 4, sc.bass[Math.floor(beat / 8) % sc.bass.length]), 0.18, { type: 'square', vol: 0.05, bus: musicBus });
    if (Math.random() < (battle ? 0.6 : 0.45)) {
      const s = sc.steps[Math.floor(Math.random() * sc.steps.length)];
      tone(note(sc.root, s), battle ? 0.35 : 1.4, { type: battle ? 'square' : 'sine', vol: battle ? 0.035 : 0.07, attack: battle ? 0.01 : 0.08, bus: musicBus });
    }
    beat++;
  }, sc.tempo);
}

export function setMusic(mode) {
  if (mode === musicMode) return;
  musicMode = mode;
  startMusic(mode);
}
