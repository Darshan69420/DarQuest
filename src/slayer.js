// Slayer (RuneScape style): Slayer Master Grimm assigns you a kind of monster and a number to
// defeat. Kills on task give Slayer XP and hit harder; finishing a task earns Slayer Points
// to spend on gear. Higher Slayer levels unlock tougher assignments.
import { ENEMIES } from './data.js';
import { skillLevel, addSkillXp } from './skills.js';

export const SLAYER_TIERS = [
  { level: 1, ids: ['gloomsprig', 'cinder_rat', 'frost_wisp'] },
  { level: 5, ids: ['hollow_knight', 'storm_crow'] },
  { level: 12, ids: ['lava_imp', 'cinderhound', 'ashen_shaman'] },
  { level: 20, ids: ['obsidian_golem', 'magma_serpent'] },
  { level: 30, ids: ['wyrmling', 'dragon_cultist'] },
  { level: 40, ids: ['drake', 'wyvern'] },
  { level: 50, ids: ['snow_wolf', 'frost_wraith', 'yeti'] },
  { level: 60, ids: ['ice_golem', 'frost_drake'] },
  { level: 70, ids: ['gale_sprite', 'stormhorn', 'skyraider'] },
  { level: 80, ids: ['tempest_golem', 'thunder_roc'] },
  { level: 85, ids: ['briar_stalker', 'pixie', 'spore_shambler'] },
  { level: 90, ids: ['treant', 'blight_horror'] },
  { level: 95, ids: ['sorrowshade', 'deathless', 'bone_magus', 'pale_templar'] },
];

export const SLAYER_SHOP = [
  { id: 'slayer_helm', cost: 120, desc: 'Hit your slayer target 15% harder while you wear it' },
  { id: 'slayer_band', cost: 200, desc: 'A ring for seasoned hunters' },
  { id: 'reaper_cloak', cost: 350, desc: 'Woven from the shadows of a thousand tasks' },
  { id: 'hunters_codex', cost: 500, desc: 'Every monster, and how to kill it' },
];

export function slayerOptions(p) {
  const lvl = skillLevel(p, 'slayer');
  return SLAYER_TIERS.filter(t => lvl >= t.level).flatMap(t => t.ids).filter(id => ENEMIES[id].level <= p.level + 4);
}

export function assignTask(p) {
  const opts = slayerOptions(p);
  const pool = opts.length ? opts : ['gloomsprig'];
  const id = pool[Math.floor(Math.random() * pool.length)];
  const count = 10 + Math.floor(Math.random() * 11) + Math.floor(skillLevel(p, 'slayer') / 5);
  p.slayer.task = { enemy: id, count, done: 0 };
  return p.slayer.task;
}

// A kill: returns { xp, levels, finished } when it counted toward the task, else null.
export function slayerKill(p, def) {
  const t = p.slayer.task;
  if (!t || t.enemy !== def.id) return null;
  t.done++;
  const xp = Math.round(def.level * 4 + def.hp / 40);
  const levels = addSkillXp(p, 'slayer', xp);
  let finished = null;
  if (t.done >= t.count) {
    p.slayer.streak = (p.slayer.streak || 0) + 1;
    const points = 10 + Math.min(40, p.slayer.streak * 2) + Math.floor(ENEMIES[t.enemy].level / 2);
    p.slayer.points += points;
    p.slayer.tasks = (p.slayer.tasks || 0) + 1;
    const bonusXp = Math.round(xp * t.count * 0.3);
    addSkillXp(p, 'slayer', bonusXp);
    finished = { points, bonusXp, gold: 20 * ENEMIES[t.enemy].level };
    p.gold += finished.gold;
    p.slayer.task = null;
  }
  return { xp, levels, finished };
}

// Extra damage against your current slayer target.
export function slayerBonus(p, def) {
  if (p.slayer?.task?.enemy !== def.id) return 0;
  return 0.1 + (p.equipped?.hat?.b === 'slayer_helm' ? 0.15 : 0);
}
