// Gear items are instances of a base piece from data.js (GEAR), rolled with a rarity:
// common → uncommon → rare → epic → legendary. Better rarities scale the base stats,
// add random bonus stats, and legendaries carry a special power.
//   instance: { b: baseId, r: rarity, x: { stat: bonus }, p?: legendaryPowerId }
import { GEAR, STAT_NAMES } from './data.js';

export const RARITIES = {
  common:    { label: 'Common',    color: '#d8d0f0', mult: 1,    affixes: 0, sell: 1 },
  uncommon:  { label: 'Uncommon',  color: '#5fdc6a', mult: 1.08, affixes: 1, sell: 1.6 },
  rare:      { label: 'Rare',      color: '#4d9fff', mult: 1.16, affixes: 2, sell: 2.6 },
  epic:      { label: 'Epic',      color: '#c542ff', mult: 1.28, affixes: 3, sell: 4 },
  legendary: { label: 'Legendary', color: '#ff9a1a', mult: 1.4,  affixes: 3, sell: 8 },
};
export const RARITY_ORDER = Object.keys(RARITIES);

export const LEGENDARY = {
  phoenix:   { name: 'of the Phoenix',  desc: 'Heal for 4% of the damage you deal',          mods: { lifesteal: 0.04 } },
  storm:     { name: 'of the Storm',    desc: '20% chance for hits to arc to another foe',   mods: { chain: 0.2 } },
  reaper:    { name: 'of the Reaper',   desc: '+30% damage to foes under 30% health',        mods: { execute: 0.3 } },
  giants:    { name: 'of Giants',       desc: '+20% damage to elites and bosses',            mods: { big: 0.2 } },
  brambles:  { name: 'of Brambles',     desc: 'Attackers take 25% of the damage they deal',  mods: { thorns: 0.25 } },
  troll:     { name: 'of the Troll',    desc: 'Regenerate 0.8% health per second in battle', mods: { regen: 0.008 } },
  frostfire: { name: 'of Frostfire',    desc: 'Dodging blasts nearby foes with frost',       mods: { nova: 1 } },
  wind:      { name: 'of the Wind',     desc: '+15% move speed and 20% faster dodges',       mods: { speed: 0.15, dodgeCd: 0.2 } },
  archmage:  { name: 'of the Archmage', desc: 'Spells cost 20% less and cool down 10% faster', mods: { cost: -0.2, cd: -0.1 } },
  titan:     { name: 'of the Titan',    desc: '+15% max health',                             mods: { hpPct: 0.15 } },
  fury:      { name: 'of Fury',         desc: 'Critical hits deal +35% more damage',          mods: { critDmg: 0.35 } },
  dragon:    { name: 'of the Dragon',   desc: 'Shouts recharge 30% faster',                   mods: { shoutCd: 0.3 } },
};

const AFFIX = {
  hp:     { prefix: 'Sturdy',   roll: (l) => 10 + l * 6 },
  dmg:    { prefix: 'Fierce',   roll: (l) => 1 + l * 0.3 },
  acc:    { prefix: 'Keen',     roll: (l) => 1 + l * 0.15 },
  resist: { prefix: 'Warded',   roll: (l) => 1 + l * 0.2 },
  pip:    { prefix: 'Swift',    roll: (l) => 1 + l * 0.15 },
  heal:   { prefix: 'Soothing', roll: (l) => 2 + l * 0.3 },
};

const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Chooses a rarity. `luck` above 0 makes better rarities more likely (bosses, hard modes, deep rifts).
export function rollRarity(luck = 0) {
  const w = { common: 55, uncommon: 28 * (1 + luck), rare: 12 * (1 + luck), epic: 4 * (1 + luck * 1.5), legendary: 1 * (1 + luck * 2) };
  let roll = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const r of RARITY_ORDER) { roll -= w[r]; if (roll <= 0) return r; }
  return 'common';
}

// Crafted gear is better the more your skill exceeds the recipe.
export function craftRarity(over) {
  const r = Math.random(), o = Math.max(0, over);
  if (r < 0.002 + o * 0.0005) return 'legendary';
  if (r < 0.012 + o * 0.0015) return 'epic';
  if (r < 0.05 + o * 0.004) return 'rare';
  if (r < 0.2 + o * 0.01) return 'uncommon';
  return 'common';
}

export function makeItem(baseId, rarity = 'common') {
  const g = GEAR[baseId];
  const inst = { b: baseId, r: rarity, x: {} };
  const n = RARITIES[rarity].affixes;
  const pool = Object.keys(AFFIX).filter(k => g.slot !== 'wand' || k !== 'hp');
  for (let i = 0; i < n; i++) {
    const k = pick(pool);
    const v = AFFIX[k].roll(g.level) * (0.7 + Math.random() * 0.6);
    inst.x[k] = (inst.x[k] || 0) + Math.max(1, Math.round(v));
  }
  if (rarity === 'legendary') inst.p = pick(Object.keys(LEGENDARY));
  return inst;
}

// Older saves stored plain ids: turn them into common items.
export function normalize(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return GEAR[entry] ? { b: entry, r: 'common', x: {} } : null;
  return GEAR[entry.b] ? entry : null;
}

export const base = (inst) => GEAR[inst.b];

export function itemStats(inst) {
  const g = GEAR[inst.b], r = RARITIES[inst.r] || RARITIES.common;
  const s = {};
  for (const [k, v] of Object.entries(g.stats || {})) s[k] = Math.round(v * r.mult);
  for (const [k, v] of Object.entries(inst.x || {})) s[k] = (s[k] || 0) + v;
  return s;
}

export function itemName(inst) {
  const g = GEAR[inst.b];
  if (inst.p) return `${g.name} ${LEGENDARY[inst.p].name}`;
  const main = Object.entries(inst.x || {}).sort((a, b) => b[1] - a[1])[0];
  return main && inst.r !== 'common' ? `${AFFIX[main[0]].prefix} ${g.name}` : g.name;
}

export function itemColor(inst) { return (RARITIES[inst.r] || RARITIES.common).color; }
export function itemValue(inst) { return Math.round(GEAR[inst.b].sell * (RARITIES[inst.r] || RARITIES.common).sell); }

// Total stats and special powers from everything you wear.
export function gearTotals(equipped) {
  const stats = {}, mods = {};
  for (const inst of Object.values(equipped || {})) {
    if (!inst) continue;
    for (const [k, v] of Object.entries(itemStats(inst))) stats[k] = (stats[k] || 0) + v;
    if (inst.p) for (const [k, v] of Object.entries(LEGENDARY[inst.p].mods)) mods[k] = (mods[k] || 0) + v;
  }
  return { stats, mods };
}

// "+20 Health ▲ · −2% Damage ▼" compared with what you wear in that slot now.
export function compareText(inst, worn) {
  const a = itemStats(inst), b = worn ? itemStats(worn) : {};
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  return keys.map(k => {
    const d = (a[k] || 0) - (b[k] || 0);
    if (!d) return '';
    const unit = k === 'hp' ? '' : '%';
    return `<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${Math.abs(d)}${unit} ${STAT_NAMES[k]} ${d > 0 ? '▲' : '▼'}</span>`;
  }).filter(Boolean).join(' ');
}
