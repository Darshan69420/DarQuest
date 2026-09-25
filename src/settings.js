// Player settings (sound, graphics, controls and key bindings). Saved apart from the save slots,
// so they apply to every wizard.
const KEY = 'darquest-settings';

// Every rebindable action and its default key. Arrow keys always work for movement too.
export const ACTIONS = {
  forward:   { label: 'Move forward',          key: 'KeyW' },
  back:      { label: 'Move back',             key: 'KeyS' },
  left:      { label: 'Move / turn left',      key: 'KeyA' },
  right:     { label: 'Move / turn right',     key: 'KeyD' },
  interact:  { label: 'Talk / gather / use',   key: 'KeyE' },
  dodge:     { label: 'Dodge',                 key: 'Space' },
  target:    { label: 'Next target',           key: 'Tab' },
  slot1:     { label: 'Basic attack',          key: 'Digit1' },
  slot2:     { label: 'Spell 2',               key: 'Digit2' },
  slot3:     { label: 'Spell 3',               key: 'Digit3' },
  slot4:     { label: 'Spell 4',               key: 'Digit4' },
  slot5:     { label: 'Spell 5',               key: 'Digit5' },
  shout:     { label: 'Dragon shout',          key: 'KeyR' },
  potion:    { label: 'Drink potion',          key: 'KeyH' },
  eat:       { label: 'Eat food',              key: 'KeyF' },
  spellbook: { label: 'Spellbook',             key: 'KeyB' },
  character: { label: 'Character & gear',      key: 'KeyC' },
  skills:    { label: 'Skills',                key: 'KeyK' },
  bag:       { label: 'Materials bag',         key: 'KeyI' },
  journal:   { label: 'Quest journal',         key: 'KeyJ' },
  map:       { label: 'World map',             key: 'KeyN' },
  build:     { label: 'Build mode (homestead)', key: 'KeyG' },
  mount:     { label: 'Ride / dismount',       key: 'KeyX' },
  mute:      { label: 'Sound on/off',          key: 'KeyM' },
  help:      { label: 'Help',                  key: 'F1' },
};

const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

const DEFAULTS = {
  master: 0.8,
  music: 0.6,
  sfx: 0.9,
  quality: coarse ? 'medium' : 'high',
  controls: 'modern',     // modern: camera-relative movement · classic: W/S walk, A/D turn
  camSens: 1,
  shake: 1,
  showFps: false,
  autoCam: true,          // camera drifts behind you while walking forward (modern controls)
  damageNumbers: true,
  worldScaling: false,    // foes everywhere grow with your level (always on in New Game+)
  keys: {},
};

export const settings = structuredClone(DEFAULTS);
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  Object.assign(settings, saved, { keys: { ...(saved.keys || {}) } });
} catch { /* storage unavailable */ }

const listeners = [];
export function onSettings(fn) { listeners.push(fn); }

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

export function setSetting(k, v) {
  settings[k] = v;
  persist();
  for (const fn of listeners) fn(k, v);
}

export function resetSettings() {
  const keep = settings.keys;
  Object.assign(settings, structuredClone(DEFAULTS));
  settings.keys = keep;
  persist();
  for (const fn of listeners) fn('*');
}

// ------------------------------------------------------------ key bindings

export function keyFor(action) {
  return settings.keys[action] || ACTIONS[action]?.key;
}

export function bindKey(action, code) {
  // a key can only do one thing: whatever had it before swaps to this action's old key
  const old = keyFor(action);
  for (const a of Object.keys(ACTIONS)) if (a !== action && keyFor(a) === code) settings.keys[a] = old;
  settings.keys[action] = code;
  persist();
  for (const fn of listeners) fn('keys');
}

export function resetKeys() {
  settings.keys = {};
  persist();
  for (const fn of listeners) fn('keys');
}

export function actionOf(code) {
  for (const a of Object.keys(ACTIONS)) if (keyFor(a) === code) return a;
  return null;
}

// "KeyW" → "W", "Digit1" → "1", "Space" → "Space"
export function keyLabel(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[code];
  return { Space: 'Space', Tab: 'Tab', ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', ControlLeft: 'L-Ctrl', Backquote: '`', Slash: '/', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=' }[code] || code;
}

export const QUALITY = {
  low:    { label: 'Low',    pixelRatio: 0.75, shadows: 0,    particles: 0.4, antialias: false },
  medium: { label: 'Medium', pixelRatio: 1.25, shadows: 1024, particles: 0.7, antialias: true },
  high:   { label: 'High',   pixelRatio: 2,    shadows: 2048, particles: 1,   antialias: true },
};
