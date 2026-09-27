import * as UI from './ui.js';
import * as Audio from './audio.js';

const KEY = 'solquest-settings-v1';
const ACTIONS = { KeyW: 'Forward', KeyS: 'Back', KeyA: 'Left', KeyD: 'Right', KeyE: 'Interact', Space: 'Dodge', Tab: 'Target', KeyH: 'Potion', Digit1: 'Basic attack', Digit2: 'Spell 2', Digit3: 'Spell 3', Digit4: 'Spell 4', Digit5: 'Spell 5', KeyB: 'Spellbook', KeyC: 'Character', KeyR: 'Scrolls', KeyF: 'Mount' };
const defaults = () => ({ quality: matchMedia('(pointer: coarse)').matches ? 'medium' : 'high', smooth: true, textSize: 'normal', danger: false, master: 1, music: 0.65, effects: 1, bindings: Object.fromEntries(Object.keys(ACTIONS).map(key => [key, key])) });
export const settings = defaults();
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved) {
    for (const key of ['quality', 'textSize']) if (typeof saved[key] === 'string') settings[key] = saved[key];
    for (const key of ['smooth', 'danger']) if (typeof saved[key] === 'boolean') settings[key] = saved[key];
    for (const key of ['master', 'music', 'effects']) if (Number.isFinite(saved[key])) settings[key] = Math.max(0, Math.min(1, saved[key]));
    if (saved.bindings && Object.keys(ACTIONS).every(k => typeof saved.bindings[k] === 'string') && new Set(Object.values(saved.bindings)).size === Object.keys(ACTIONS).length) settings.bindings = Object.fromEntries(Object.keys(ACTIONS).map(k => [k, saved.bindings[k]]));
  }
} catch { /* A malformed preference does not affect saved characters. */ }
if (!['low', 'medium', 'high'].includes(settings.quality)) settings.quality = 'high';
if (!['normal', 'large'].includes(settings.textSize)) settings.textSize = 'normal';

export function resolveKey(code) {
  const match = Object.entries(settings.bindings).find(([, physical]) => physical === code);
  return match ? match[0] : ACTIONS[code] ? null : code;
}
export function keyLabel(code) { return (settings.bindings[code] || code).replace(/^Key|^Digit/, '').replace('Space', 'Space'); }
export function applySettings(world) {
  world.setQuality?.(settings.quality);
  world.setAutoQuality?.(settings.smooth);
  world.colorBlindDanger = settings.danger;
  world.inputCode = resolveKey;
  document.documentElement.dataset.textSize = settings.textSize;
  document.documentElement.dataset.danger = settings.danger ? 'accessible' : 'standard';
  Audio.setVolumes(settings);
}
function persist(world) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { UI.toast('Settings could not be saved on this device.'); }
  applySettings(world);
}

let capture = null;
window.addEventListener('keydown', e => {
  if (!capture) return;
  if (!document.querySelector('#modal [data-bind]')) { capture = null; return; }
  e.preventDefault(); e.stopImmediatePropagation();
  const { code, world } = capture;
  if (e.code === 'Escape') { capture = null; openSettings(world); return; }
  if (!/^(Key[A-Z]|Digit[0-9]|Space|Tab)$/.test(e.code) || ['KeyM', 'KeyV', 'KeyI'].includes(e.code)) return;
  const other = Object.keys(ACTIONS).find(k => settings.bindings[k] === e.code);
  if (other) settings.bindings[other] = settings.bindings[code];
  settings.bindings[code] = e.code;
  capture = null; persist(world); openSettings(world);
}, true);

export function openSettings(world) {
  capture = null;
  UI.openModal('Settings', `<div class="settings-grid">
    <section><h3>Sound</h3>${['master', 'music', 'effects'].map(key => `<label class="setting-row">${key[0].toUpperCase() + key.slice(1)} <input aria-label="${key} volume" data-volume="${key}" type="range" min="0" max="100" value="${Math.round(settings[key] * 100)}"></label>`).join('')}</section>
    <section><h3>Display</h3><label class="setting-row">Quality <select id="quality">${['low', 'medium', 'high'].map(q => `<option ${q === settings.quality ? 'selected' : ''}>${q}</option>`).join('')}</select></label>
    <label class="setting-row"><input id="smooth" type="checkbox" ${settings.smooth ? 'checked' : ''}> Keep it smooth</label><p class="modal-note">Lowers detail during slow frames. Your chosen quality stays saved.</p>
    <label class="setting-row">Text <select id="text-size"><option value="normal" ${settings.textSize === 'normal' ? 'selected' : ''}>Normal</option><option value="large" ${settings.textSize === 'large' ? 'selected' : ''}>Large</option></select></label>
    <label class="setting-row"><input id="danger" type="checkbox" ${settings.danger ? 'checked' : ''}> High-contrast danger zones</label></section>
    <section class="key-settings"><h3>Controls</h3><p class="modal-note">Select a key, then press its replacement. Escape cancels. Conflicting keys swap.</p><div class="binding-grid">${Object.entries(ACTIONS).map(([code, name]) => `<label>${name}<button class="btn small" data-bind="${code}">${UI.esc(keyLabel(code))}</button></label>`).join('')}</div></section>
    </div>`, body => {
      body.querySelectorAll('[data-volume]').forEach(input => input.addEventListener('input', () => { settings[input.dataset.volume] = +input.value / 100; persist(world); }));
      for (const [id, key] of [['quality', 'quality'], ['text-size', 'textSize'], ['smooth', 'smooth'], ['danger', 'danger']]) body.querySelector(`#${id}`).addEventListener('change', e => { settings[key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; persist(world); });
      body.querySelectorAll('[data-bind]').forEach(button => button.addEventListener('click', () => { capture = { code: button.dataset.bind, world }; button.textContent = 'Press key…'; }));
    });
}
