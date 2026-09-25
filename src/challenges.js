// Weekly challenges: three goals that change every Monday. The same week gives everyone the
// same challenges (they are picked with a seeded random roll). Progress counts from the moment
// the week's challenges are first seen.
import { ENEMIES } from './data.js';
import { storyIndex } from './state.js';

const DAY = 86400000;
// Weeks start on Monday (1 January 1970 was a Thursday).
export function weekNumber(now = Date.now()) { return Math.floor((now / DAY + 3) / 7); }
export function weekEndsIn(now = Date.now()) { return (weekNumber(now) + 1) * 7 * DAY - 3 * DAY - now; }

const sumBestiary = (p, test) => Object.entries(p.bestiary || {}).reduce((s, [id, n]) => s + (ENEMIES[id] && test(ENEMIES[id]) ? n : 0), 0);

// stat(p) is a counter that only goes up; the goal is to raise it by n this week.
export const CHALLENGES = {
  hunt:     { icon: '⚔️', name: 'Monster Hunt',     text: n => `Defeat ${n} foes`,                      n: [60, 100, 150], stat: p => p.stats_log.kills || 0 },
  bosses:   { icon: '👑', name: 'Boss Rush',        text: n => `Defeat ${n} bosses (the Rift and the Undercroft count)`, n: [2, 3, 5], stat: p => sumBestiary(p, d => d.boss) },
  dragons:  { icon: '🐉', name: 'Dragon Hunt',      text: n => `Slay ${n} dragons`,                     n: [5, 8, 12], stat: p => sumBestiary(p, d => d.dragon), need: p => storyIndex(p) >= 14 },
  gather:   { icon: '⛏️', name: 'Honest Work',      text: n => `Gather ${n} resources`,                 n: [80, 150, 250], stat: p => p.stats_log.gathered || 0 },
  craft:    { icon: '🔨', name: 'Master Crafter',   text: n => `Craft ${n} items`,                      n: [15, 30, 50], stat: p => p.stats_log.crafted || 0 },
  delve:    { icon: '⚰️', name: 'Tomb Delver',      text: n => `Clear the Hollow Undercroft ${n > 1 ? `${n} times` : 'once'}`, n: [1, 2], stat: p => (p.undercroft?.clears || 0) + (p.undercroft?.heroicClears || 0), need: p => storyIndex(p) >= 7 || p.level >= 10 },
  shards:   { icon: '🔮', name: 'Rift Diver',       text: n => `Earn ${n} Rift Shards`,                 n: [60, 120, 200], stat: p => p.rift?.totalShards || 0 },
  arena:    { icon: '🏟️', name: 'Crowd Pleaser',    text: n => `Win ${n} arena duels`,                  n: [2, 3, 5], stat: p => p.arena?.wins || 0 },
  slayer:   { icon: '💀', name: 'On Assignment',    text: n => `Finish ${n} Slayer task${n > 1 ? 's' : ''}`, n: [1, 2, 3], stat: p => p.slayer?.tasks || 0 },
  night:    { icon: '🌙', name: 'Night Watch',      text: n => `Defeat ${n} night spirits`,             n: [10, 20, 30], stat: p => p.stats_log.nightKills || 0 },
  souls:    { icon: '✨', name: 'Soul Collector',   text: n => `Absorb ${n} dragon souls`,              n: [3, 6], stat: p => p.stats_log.souls || 0, need: p => p.dragon?.voice },
};
for (const [id, c] of Object.entries(CHALLENGES)) c.id = id;

// A small seeded random number generator, so a week always rolls the same challenges.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Makes sure the player's challenges are for this week; returns them.
export function weekly(p, now = Date.now()) {
  const week = weekNumber(now);
  if (p.weekly?.week === week) return p.weekly;
  const r = rng(week * 7919 + 17);
  const pool = Object.values(CHALLENGES).filter(c => !c.need || c.need(p));
  const picks = [];
  while (picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  p.weekly = {
    week,
    list: picks.map(c => ({ id: c.id, n: c.n[Math.floor(r() * c.n.length)], base: c.stat(p), claimed: false })),
    bonus: false,
  };
  return p.weekly;
}

export function progress(p, ch) { return Math.min(ch.n, Math.max(0, CHALLENGES[ch.id].stat(p) - ch.base)); }
export function isDone(p, ch) { return progress(p, ch) >= ch.n; }

export function weeklyReward(p) {
  return { gold: 250 + p.level * 30, xp: 400 + p.level * 150 };
}
