// Sound effects and music generated with the Web Audio API, so there are no audio files.
import { settings, onSettings } from './settings.js';

let ctx = null;
let master, sfxBus, musicBus;
let muted = false;
let musicMode = null;

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
  // a little echo and a soft hall make the music feel magical
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.33;
  delayNode = delay;
  const fb = ctx.createGain();
  fb.gain.value = 0.3;
  const echo = ctx.createGain();
  echo.gain.value = 0.55;
  musicBus.connect(master);
  musicBus.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(echo);
  echo.connect(master);
  const hall = makeReverb(), wet = ctx.createGain();
  wet.gain.value = 0.35;
  musicBus.connect(hall);
  hall.connect(wet);
  wet.connect(master);
  if (musicMode) startMusic(musicMode);
}

export function isMuted() { return muted; }

// Master, music and effects volumes come from the settings menu.
export function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(muted ? 0 : 0.7 * settings.master, t, 0.05);
  sfxBus.gain.setTargetAtTime(settings.sfx, t, 0.05);
  musicBus.gain.setTargetAtTime(0.42 * settings.music, t, 0.05);
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
function noiseBuffer() {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function noise(dur, { vol = 0.3, when = 0, freq = 1200, type = 'lowpass', sweep = 0 } = {}) {
  const t = ctx.currentTime + when;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
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
// Every land has its own little piece of written music: a chord progression, a bass line,
// an accompaniment, a melody (or two) and, in battle, drums. A look-ahead sequencer schedules
// the notes on the audio clock, so the timing stays tight even when the game is busy, and
// themes crossfade when you walk from one place to another.

// chords: "<root in semitones from the key><kind>", e.g. "9m" is the minor chord on the 6th
const KINDS = { M: [0, 4, 7], m: [0, 3, 7], d: [0, 3, 6], a: [0, 4, 8], s: [0, 5, 7], D7: [0, 4, 7, 10], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11] };

// Melodies are written bar by bar ("|"), one note per token: semitones from the key, and
// ":beats" when a note is not one beat long. "-" is a rest.
const THEMES = {
  academy: {
    vol: 1.5, bpm: 108, beats: 3, key: 262, chords: '0M 9m 5M 7M 0M 4m 5M 7D7', bass: 'waltz', comp: 'waltz', pad: 0.5, lead: 'bell',
    melodies: [
      '7 12 11 | 9:2 7 | 5 9 12 | 11:3 | 12 16 14 | 11:2 7 | 9 5 9 | 7:3',
      '16 14 12 | 14:2 9 | 12 11 9 | 7:3 | 5 7 9 | 11 12 14 | 16:2 14 | 11:2 7',
    ],
  },
  meadow: {
    vol: 1.05, bpm: 96, beats: 4, key: 294, chords: '0M 7M 9m 5M 0M 7M 5M 7M', bass: 'half', comp: 'arp8', pad: 0.4, lead: 'flute', drums: 'shaker',
    melodies: [
      '12:1.5 11:.5 12 14 | 14:2 11 7 | 9:1.5 11:.5 12 16 | 12:4 | 12:1.5 11:.5 12 14 | 14:2 19 16 | 17:1.5 16:.5 14 12 | 14:4',
      '- 7 9 11 | 11:3 9 | 7:2 4 7 | 9:4 | - 7 9 11 | 11:2 14 16 | 14 12 11 9 | 7:4',
    ],
  },
  ember: {
    bpm: 84, beats: 4, key: 220, chords: '0m 1M 0m 10M 0m 1M 3M 1M', bass: 'half', comp: 'pulse', pad: 0.6, lead: 'brass', drums: 'taiko',
    melodies: ['0:1.5 1:.5 0:2 | 1 5 8:2 | 7:1.5 5:.5 3 1 | 0:4 | 12:1.5 13:.5 12 10 | 8:2 5:2 | 7 8 10 7 | 5:2 1:2', null],
  },
  dragon: {
    bpm: 72, beats: 4, key: 147, chords: '0m 8M 3M 10M 0m 8M 10M 7M', bass: 'whole', comp: 'pad', pad: 0.8, lead: 'horn', leadOct: 12, drums: 'toms',
    melodies: [
      '0:2 3 5 | 8:3 7 | 3:2 2 0 | 2:4 | 0:2 3 5 | 8:2 10 12 | 10:2 8 7 | 7:4',
      { inst: 'choir', line: '12:4 | 12:2 15:2 | 15:2 14:2 | 14:4 | 12:4 | 15:2 17:2 | 17:2 15 14 | 13:4' },
    ],
  },
  frost: {
    vol: 1.15, bpm: 64, beats: 4, key: 330, chords: '0m 5m 8M 7m 0m 5m 3M 7M', bass: 'whole', comp: 'bells', pad: 0.7, lead: 'glass',
    melodies: ['7:2 12:2 | 8:3 - | 12:2 15 14 | 14:4 | 7:2 12:2 | 17:3 15 | 15:2 14 12 | 11:4', null],
  },
  storm: {
    vol: 1.2, bpm: 112, beats: 4, key: 247, chords: '0M 2M 0M 2M 9m 4m 2M 7M', bass: 'pulse8', comp: 'arp16', pad: 0.5, lead: 'flute', drums: 'tick',
    melodies: [
      '7 9 11:2 | 14:3 11 | 12:2 9:2 | 6:4 | 12 14 16 14 | 11:2 7:2 | 9:2 6 9 | 11:4',
      '- 19 18 16 | 14:4 | - 16 14 12 | 11:4 | - 19 18 16 | 19:3 16 | 18:2 16 14 | 14:4',
    ],
  },
  forest: {
    bpm: 80, beats: 4, key: 294, chords: '0m 5M 0m 5M 0m 5M 10M 7m', bass: 'half', comp: 'harp', pad: 0.5, lead: 'flute',
    melodies: ['0 3 5 7 | 9:2 7:2 | 5 3 2 0 | 2:4 | 0 3 5 7 | 9:1.5 10:.5 12:2 | 10 9 7 5 | 7:4', null],
  },
  deep: {
    bpm: 58, beats: 4, key: 131, chords: '0m 1M 0m 6d 0m 8M 7M 7M', bass: 'whole', comp: 'pad', pad: 0.9, lead: 'bell', leadOct: 0, drums: 'heart',
    melodies: ['12:4 | 13:4 | 12:2 15:2 | 12:4 | 19:4 | 20:2 19:2 | 19:2 18:2 | 19:4', null],
  },
  crypt: {
    vol: 1.9, bpm: 76, beats: 3, key: 147, chords: '0m 7m 5m 7D7 0m 10M 5m 7D7', bass: 'waltz', comp: 'waltz', pad: 0.6, lead: 'musicbox', leadOct: 12,
    melodies: ['12 15 14 | 14:2 10 | 8 12 8 | 7:3 | 12 15 17 | 19:2 17 | 15 14 12 | 13:3', null],
  },
  rift: {
    vol: 1.2, bpm: 96, beats: 4, key: 185, chords: '0a 2a 4a 2a 0a 2a 4a 6a', bass: 'half', comp: 'arp16', pad: 0.5, lead: 'glass', drums: 'tick',
    melodies: ['12 16 20 16 | 14:2 18:2 | 16 20 24 20 | 22:4 | 24 20 16 12 | 14:2 10:2 | 12:2 16:2 | 14:4', null],
  },
  home: {
    bpm: 84, beats: 4, key: 175, chords: '0M 4m 5M 7M 0M 9m 2m 7D7', bass: 'walk', comp: 'arp8', pad: 0.4, lead: 'flute', leadOct: 12,
    melodies: ['12:1.5 14:.5 16 12 | 11:2 7:2 | 9 12 17 16 | 14:4 | 12:1.5 14:.5 16 19 | 21:2 19 16 | 17 16 14 12 | 11:2 7:2', null],
  },
  battle: {
    bpm: 138, beats: 4, key: 196, chords: '0m 8M 10M 0m 0m 8M 5m 7M', bass: 'pulse8', comp: 'stab', pad: 0.3, lead: 'brass', drums: 'battle',
    melodies: ['0:.5 0:.5 3:.5 5:.5 7 7 | 8:1.5 7:.5 5 3 | 5:.5 5:.5 7:.5 10:.5 12:2 | 10 7 3:2 | 0:.5 0:.5 3:.5 5:.5 7 12 | 15:1.5 14:.5 12 8 | 10 8 7 5 | 7:2 11:2', null],
  },
  boss: {
    bpm: 150, beats: 4, key: 175, chords: '0m 1M 0m 11d 0m 1M 8M 7M', bass: 'pulse8', comp: 'stab', pad: 0.6, lead: 'brass', drums: 'boss',
    melodies: ['0 0:.5 1:.5 0 -1 | 1:2 5:2 | 0 3 7 6 | 5:2 2:2 | 12 12:.5 13:.5 12 11 | 13:2 17:2 | 15 12 8 12 | 11:4', null],
  },
};

function parseLine(str, beats) {
  const map = new Map();
  str.split('|').forEach((bar, bi) => {
    let beat = bi * beats;
    for (const tok of bar.trim().split(/\s+/)) {
      if (!tok) continue;
      const [n, d] = tok.split(':');
      const dur = d ? parseFloat(d) : 1;
      if (n !== '-') map.set(Math.round(beat * 4), { semi: +n, dur });
      beat += dur;
    }
  });
  return map;
}

for (const th of Object.values(THEMES)) {
  th.prog = th.chords.split(' ').map(c => { const m = c.match(/^(-?\d+)(\w+)$/); return { root: +m[1], tones: KINDS[m[2]] }; });
  th.lines = th.melodies.map(m => (m ? { inst: m.inst || th.lead, notes: parseLine(m.line || m, th.beats) } : null));
}

// ----- instruments (every one plays at an exact audio-clock time `t`)

let theme = null;      // { th, out, next, step }
let seqTimer = null;
let delayNode = null;

const hz = (key, semi) => key * Math.pow(2, semi / 12);

function voice(type, f, t, out, detune = 0) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  o.detune.value = detune;
  o.connect(out);
  return o;
}

function envGain(t, attack, peak, hold, release, out) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.setTargetAtTime(0.0001, t + attack + hold, release);
  g.connect(out);
  return g;
}

function play(oscs, t, end) { for (const o of oscs) { o.start(t); o.stop(end); } }

const INSTRUMENTS = {
  pluck(f, t, d, v, out) {
    const g = envGain(t, 0.005, v, 0.02, Math.min(0.35, d * 0.4), out);
    play([voice('triangle', f, t, g)], t, t + d + 1.2);
  },
  bell(f, t, d, v, out) {
    const g = envGain(t, 0.004, v, 0.02, 0.9, out);
    const g2 = envGain(t, 0.004, v * 0.25, 0.01, 0.35, out);
    play([voice('sine', f, t, g), voice('sine', f * 2.76, t, g2)], t, t + 4);
  },
  glass(f, t, d, v, out) {
    const g = envGain(t, 0.01, v, 0.05, 1.3, out);
    const g2 = envGain(t, 0.01, v * 0.2, 0.02, 0.6, out);
    play([voice('sine', f * 2, t, g), voice('sine', f * 4.2, t, g2)], t, t + 5);
  },
  musicbox(f, t, d, v, out) {
    const g = envGain(t, 0.003, v, 0.01, 0.45, out);
    play([voice('triangle', f * 2, t, g), voice('sine', f * 4, t, envGain(t, 0.003, v * 0.2, 0.01, 0.2, out))], t, t + 2.5);
  },
  flute(f, t, d, v, out) {
    const g = envGain(t, 0.07, v, Math.max(0.05, d - 0.1), 0.12, out);
    const o = voice('sine', f, t, g), o2 = voice('triangle', f, t, envGain(t, 0.07, v * 0.3, Math.max(0.05, d - 0.1), 0.12, out));
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    lfo.frequency.value = 5.2;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(f * 0.007, t + 0.35);
    lfo.connect(depth);
    depth.connect(o.frequency);
    depth.connect(o2.frequency);
    play([o, o2, lfo], t, t + d + 0.8);
  },
  brass(f, t, d, v, out) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2;
    lp.frequency.setValueAtTime(f * 1.5, t);
    lp.frequency.exponentialRampToValueAtTime(f * 5, t + 0.04);
    lp.frequency.setTargetAtTime(f * 2.5, t + 0.05, 0.2);
    lp.connect(envGain(t, 0.025, v, Math.max(0.03, d * 0.8 - 0.05), 0.08, out));
    play([voice('sawtooth', f, t, lp), voice('sawtooth', f, t, lp, 7)], t, t + d + 0.6);
  },
  horn(f, t, d, v, out) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(f * 1.2, t);
    lp.frequency.linearRampToValueAtTime(f * 3.2, t + 0.12);
    lp.connect(envGain(t, 0.1, v, Math.max(0.05, d - 0.15), 0.2, out));
    play([voice('sawtooth', f, t, lp), voice('triangle', f / 2, t, lp)], t, t + d + 1);
  },
  choir(f, t, d, v, out) {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 1.2;
    bp.connect(envGain(t, 0.35, v * 1.6, Math.max(0.1, d - 0.3), 0.4, out));
    play([voice('sawtooth', f, t, bp, -8), voice('sawtooth', f, t, bp, 8), voice('sawtooth', f / 2, t, bp)], t, t + d + 2);
  },
  pad(freqs, t, d, v, out) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;
    lp.connect(envGain(t, 0.6, v, Math.max(0.1, d - 0.6), 0.5, out));
    play(freqs.flatMap(f => [voice('triangle', f, t, lp), voice('sawtooth', f, t, lp, 9)]), t, t + d + 2.5);
  },
  bass(f, t, d, v, out, saw = false) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = saw ? 500 : 900;
    lp.connect(envGain(t, 0.01, v, Math.max(0.05, d - 0.08), 0.08, out));
    play([voice(saw ? 'sawtooth' : 'triangle', f, t, lp)], t, t + d + 0.6);
  },
  kick(t, v, out) {
    const g = envGain(t, 0.002, v, 0.02, 0.09, out);
    const o = voice('sine', 150, t, g);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    play([o], t, t + 0.6);
  },
  tom(t, v, out, f = 110) {
    const g = envGain(t, 0.003, v, 0.03, 0.18, out);
    const o = voice('sine', f, t, g);
    o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.3);
    play([o], t, t + 1);
    hit(t, v * 0.3, out, 600, 0.06);
  },
  snare(t, v, out) { hit(t, v, out, 1800, 0.12, 'highpass'); INSTRUMENTS.tom(t, v * 0.35, out, 190); },
  hat(t, v, out) { hit(t, v, out, 7000, 0.03, 'highpass'); },
  shaker(t, v, out) { hit(t, v, out, 5000, 0.06, 'bandpass'); },
};

function hit(t, v, out, freq, dur, type = 'lowpass') {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  src.connect(f);
  f.connect(envGain(t, 0.002, v, 0.005, dur, out));
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur * 6);
}

// ----- the sequencer: sixteenth-note steps

function scheduleStep(seq, t) {
  const { th, out } = seq;
  const I = INSTRUMENTS, spb = 60 / th.bpm, S = th.beats * 4;
  const bar = Math.floor(seq.step / S), s = seq.step % S;
  const chord = th.prog[bar % th.prog.length];
  const phrase = Math.floor(bar / th.prog.length);
  const hum = () => 0.88 + Math.random() * 0.24;
  const low = th.key / 2;
  // chord tones folded into one octave, so the harmony moves smoothly
  const tones = chord.tones.map(iv => (chord.root + iv) % 12);
  let bassF = hz(th.key, (chord.root % 12) - 24);
  while (bassF < 42) bassF *= 2;

  // bass
  const b = th.bass;
  if (b === 'whole' && s === 0) I.bass(bassF, t, th.beats * spb, 0.11, out);
  if (b === 'half' && s % (S / 2) === 0) I.bass(s ? bassF * 1.5 : bassF, t, (th.beats / 2) * spb * 0.95, 0.1, out);
  if (b === 'waltz' && s === 0) I.bass(bassF, t, spb * 0.9, 0.1, out);
  if (b === 'pulse8' && s % 2 === 0) I.bass(s === S - 2 ? bassF * 2 : bassF, t, spb * 0.42, 0.08, out, true);
  if (b === 'walk' && s % 4 === 0) I.bass(bassF * [1, 1.5, 2, 1.5][(s / 4) % 4], t, spb * 0.9, 0.09, out);

  // accompaniment
  const c = th.comp;
  if (c === 'waltz' && (s === 4 || s === 8)) for (const n of tones) I.pluck(hz(low, n + 12), t, spb * 0.8, 0.025 * hum(), out);
  if (c === 'arp8' && s % 2 === 0) { const n = [0, 1, 2, 1][(s / 2) % 4]; I.pluck(hz(low, tones[n % tones.length] + 12), t, spb * 0.6, 0.045 * hum(), out); }
  if (c === 'arp16') { const seqN = [0, 1, 2, 3, 2, 1, 0, 1]; const k = seqN[s % 8]; I.pluck(hz(th.key, tones[k % tones.length] + (k >= tones.length ? 12 : 0)), t, spb * 0.3, 0.022 * hum(), out); }
  if (c === 'harp' && s % 2 === 0) { const k = [0, 1, 2, 3, 4, 3, 2, 1][(s / 2) % 8]; I.pluck(hz(low, tones[k % tones.length] + 12 * Math.floor(k / tones.length) + 12), t, spb, 0.04 * hum(), out); }
  if (c === 'bells' && [0, 6, 10].includes(s) && Math.random() < 0.8) I.glass(hz(th.key, tones[Math.floor(Math.random() * tones.length)]), t, spb, 0.03, out);
  if (c === 'pulse' && s % 2 === 0) I.pluck(hz(low, (s % 4 ? tones[2] : tones[0])), t, spb * 0.4, 0.05 * hum(), out);
  if (c === 'stab' && [2, 6, 10, 14].includes(s)) for (const n of tones) I.brass(hz(low, n + 12), t, spb * 0.2, 0.018, out);
  if ((c === 'pad' || th.pad) && s === 0) I.pad(tones.map(n => hz(low, n)), t, th.beats * spb, 0.035 * (th.pad || 0.6), out);

  // melody: phrases take turns (the second is often left out, to let the land breathe)
  const line = th.lines[phrase % th.lines.length];
  const ev = line?.notes.get(seq.step % (th.prog.length * S));
  if (ev) I[line.inst](hz(th.key, ev.semi + (th.leadOct || 0)), t, ev.dur * spb, (line.inst === 'brass' ? 0.05 : line.inst === 'choir' ? 0.035 : 0.075) * hum(), out);

  // drums
  const d = th.drums;
  if (d === 'battle' || d === 'boss') {
    if (s === 0 || s === 8 || (d === 'boss' && (s === 3 || s === 11))) I.kick(t, 0.32, out);
    if (s === 4 || s === 12) I.snare(t, 0.2, out);
    if (s % 2 === 0) I.hat(t, s % 4 ? 0.05 : 0.08, out);
    if (d === 'boss' && s === 0 && bar % 4 === 0) hit(t, 0.12, out, 3000, 0.6, 'highpass');
  }
  if (d === 'taiko' && (s === 0 || s === 8 || s === 14)) I.tom(t, s === 0 ? 0.3 : 0.18, out, s === 14 ? 140 : 90);
  if (d === 'toms' && [0, 6, 8].includes(s)) I.tom(t, s === 0 ? 0.3 : 0.2, out, s === 6 ? 120 : 80);
  if (d === 'tick' && s % 4 === 2) I.hat(t, 0.035, out);
  if (d === 'shaker' && s % 2 === 1) I.shaker(t, s % 4 === 3 ? 0.05 : 0.025, out);
  if (d === 'heart' && (s === 0 || s === 3)) I.kick(t, s ? 0.12 : 0.18, out);
}

function tick() {
  const seq = theme;
  if (!ctx || !seq) return;
  const now = ctx.currentTime;
  // after the tab was hidden, skip ahead instead of playing every missed note at once
  if (seq.next < now - 0.2) seq.next = now + 0.05;
  const step = 60 / seq.th.bpm / 4;
  while (seq.next < now + 0.18) {
    if (!muted) scheduleStep(seq, seq.next);
    seq.next += step;
    seq.step++;
  }
}

function startMusic(mode) {
  if (!ctx) return;
  const now = ctx.currentTime;
  // the old theme fades out while the new one fades in
  if (theme) {
    const old = theme.out;
    old.gain.cancelScheduledValues(now);
    old.gain.setTargetAtTime(0.0001, now, 0.35);
    setTimeout(() => old.disconnect(), 3000);
    theme = null;
  }
  const th = THEMES[mode];
  if (!th) return;
  const out = ctx.createGain();
  const fast = mode === 'battle' || mode === 'boss';
  out.gain.setValueAtTime(0.0001, now);
  out.gain.setTargetAtTime(th.vol || 1, now, fast ? 0.08 : 0.7);
  out.connect(musicBus);
  theme = { th, out, next: now + 0.06, step: 0 };
  // the echo lands on the off-beat of each theme's own tempo
  delayNode?.delayTime.setTargetAtTime(Math.min(0.9, (60 / th.bpm) * 0.75), now, 0.1);
  if (!seqTimer) seqTimer = setInterval(tick, 25);
}

// A soft hall reverb for the music, built from decaying noise (no audio files).
function makeReverb() {
  const len = Math.floor(ctx.sampleRate * 2.4);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

export function setMusic(mode) {
  if (mode === musicMode) return;
  musicMode = mode;
  startMusic(mode);
}
