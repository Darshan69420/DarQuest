// Side quests: optional jobs from townsfolk, running alongside the main story.
//   objective types:
//     bring  { item, count }   hand the items over (they are taken from your bag)
//     gather { item, count }   gather this many after accepting
//     craft  { recipe, count } craft this many after accepting
//     defeat { enemy, count }  defeat this many after accepting (enemy: 'any' counts everything)
//     skill  { skill, level }  reach a skill level ('total' = total level)
//     talk   { npc }           just go and talk to someone
//   after: another side quest that must be finished first · minLevel: character level needed
import { ITEMS, bagCount, removeItem, addItem } from './items.js';
import { skillLevel, totalLevel, SKILLS, addSkillXp, RECIPES } from './skills.js';
import { ENEMIES, NPCS, GEAR } from './data.js';

export const SIDE_QUESTS = [
  // ---------------- The Gatherers' Guild (Brisa, Millbrook Meadow) ----------------
  {
    id: 'guild1', name: 'A Fresh Start', giver: 'brisa', turnIn: 'brisa',
    objective: { type: 'bring', item: 'logs', count: 5 },
    offer: 'Welcome to Millbrook Meadow, the home of the Gatherers\' Guild! Every great wizard needs more than spells. Take your axe to the trees here and bring me 5 Logs.',
    done: 'Nice clean cuts! You\'ll make a woodcutter yet. Keep those, and take this for your trouble.',
    reward: { xp: 60, gold: 25, skillXp: { woodcutting: 40 } },
  },
  {
    id: 'guild2', after: 'guild1', name: 'Rock Solid', giver: 'brisa', turnIn: 'brisa',
    objective: { type: 'bring', item: 'copper_ore', count: 5 },
    offer: 'The quarry is on the east side of the meadow. Copper is the softest ore: perfect for a beginner. Mine 5 Copper Ore for me.',
    done: 'Good, honest copper. Now, let\'s see if you can do something with it...',
    reward: { xp: 80, gold: 40, skillXp: { mining: 60 }, items: { copper_ore: 3 } },
  },
  {
    id: 'guild3', after: 'guild2', name: 'Hot Metal', giver: 'brisa', turnIn: 'brisa',
    objective: { type: 'craft', recipe: 'copper_bar', count: 3 },
    offer: 'Take your ore to the furnace by the crafting yard and smelt 3 Copper Bars. Then you can forge them into tools and amulets at the anvil.',
    done: 'Your first bars! Every smith remembers theirs. Keep smelting and you\'ll be forging dragonite one day.',
    reward: { xp: 100, gold: 50, skillXp: { smithing: 80 } },
  },
  {
    id: 'guild4', after: 'guild3', name: 'Gone Fishin\'', giver: 'brisa', turnIn: 'brisa',
    objective: { type: 'bring', item: 'cooked_minnow', count: 4 },
    offer: 'Fighting makes a wizard hungry. Catch some minnows at the pond, cook them at the range, and bring me 4 Grilled Minnows. Food heals you: press F to eat!',
    done: 'Mmm, smoky. You\'ll never go hungry out in the wilds now.',
    reward: { xp: 120, gold: 60, skillXp: { fishing: 60, cooking: 60 }, items: { cooked_trout: 3 } },
  },
  {
    id: 'guild5', after: 'guild4', name: 'Herbal Remedies', giver: 'brisa', turnIn: 'brisa',
    objective: { type: 'craft', recipe: 'healing_potion', count: 2 },
    offer: 'Moonleaf grows all over the meadow. Pick some and brew 2 Healing Potions at the alchemy table. Madame Fizz will be jealous!',
    done: 'Perfectly bubbly. Alchemy will get you elixirs of might, stoneskin, even dragonfire wards if you stick with it.',
    reward: { xp: 150, gold: 80, skillXp: { alchemy: 100, foraging: 60 } },
  },
  {
    id: 'guild6', after: 'guild5', name: 'Guild Apprentice', giver: 'brisa', turnIn: 'brisa',
    objective: { type: 'skill', skill: 'total', level: 60 },
    offer: 'You have tried every craft. Now get good at them! Reach a total skill level of 60 across your 8 skills and I will make you a proper Guild Apprentice.',
    done: 'Total level 60! Here: iron tools, straight from the guild forge. Use them well.',
    reward: { xp: 400, gold: 200, items: { iron_pickaxe: 1, iron_axe: 1, herb_shears: 1 } },
  },
  {
    id: 'guild7', after: 'guild6', name: 'Deep Veins', giver: 'brisa', turnIn: 'brisa',
    objective: { type: 'bring', item: 'silver_ore', count: 8 },
    offer: 'Silver runs deep in the quarry\'s north face. Bring me 8 Silver Ore and I will let you in on a secret: the best ore in the world lies in the Dragonspire Peaks.',
    done: 'Beautiful. The secret? Dragons sleep on beds of dragonite. Brave or foolish, you\'ll have to find out yourself.',
    reward: { xp: 600, gold: 350, skillXp: { mining: 400, smithing: 200 }, items: { gold_pickaxe: 1 } },
  },
];
export const SIDE = Object.fromEntries(SIDE_QUESTS.map(q => [q.id, q]));

function entry(p, id) { return p.side?.[id]; }

export function isDone(p, id) { return entry(p, id)?.state === 'done'; }
export function isActive(p, id) { return entry(p, id)?.state === 'active'; }

export function isAvailable(p, q) {
  if (entry(p, q.id)) return false;
  if (q.after && !isDone(p, q.after)) return false;
  if (q.minLevel && p.level < q.minLevel) return false;
  if (q.mainQuest != null && Math.max(p.quest.index, p.storyMax || 0) < q.mainQuest) return false;
  return true;
}

export function progress(p, q) {
  const o = q.objective;
  switch (o.type) {
    case 'bring': return { have: Math.min(o.count, bagCount(p, o.item)), need: o.count };
    case 'skill': return { have: Math.min(o.level, o.skill === 'total' ? totalLevel(p) : skillLevel(p, o.skill)), need: o.level };
    case 'talk': return { have: 0, need: 1 };
    default: return { have: Math.min(o.count, entry(p, q.id)?.progress || 0), need: o.count };
  }
}

export function isReady(p, q) {
  if (!isActive(p, q.id)) return false;
  if (q.objective.type === 'talk') return true;
  const pr = progress(p, q);
  return pr.have >= pr.need;
}

export function goalText(p, q) {
  const o = q.objective, pr = progress(p, q);
  const n = `(${pr.have}/${pr.need})`;
  switch (o.type) {
    case 'bring': return `Bring ${o.count} ${ITEMS[o.item].name} ${n}`;
    case 'gather': return `Gather ${o.count} ${ITEMS[o.item].name} ${n}`;
    case 'craft': return `Make ${o.count} × ${RECIPES[o.recipe].out.item ? ITEMS[RECIPES[o.recipe].out.item].name : RECIPES[o.recipe].out.gear ? GEAR[RECIPES[o.recipe].out.gear].name : 'Healing Potion'} ${n}`;
    case 'defeat': return `Defeat ${o.count} ${o.enemy === 'any' ? 'enemies' : ENEMIES[o.enemy].name + (o.count > 1 ? 's' : '')} ${n}`;
    case 'skill': return `Reach ${o.skill === 'total' ? 'total skill level' : SKILLS[o.skill].name + ' level'} ${o.level} ${n}`;
    case 'talk': return `Talk to ${NPCS[o.npc].name}`;
  }
  return '';
}

export function accept(p, q) {
  p.side[q.id] = { state: 'active', progress: 0 };
}

// Something happened in the world (gathered, crafted, defeated). Returns quests that just became ready.
export function sideEvent(p, type, key, n = 1) {
  const ready = [];
  for (const q of SIDE_QUESTS) {
    if (!isActive(p, q.id) || q.objective.type !== type) continue;
    const o = q.objective;
    const match = type === 'gather' ? o.item === key : type === 'craft' ? o.recipe === key : type === 'defeat' ? (o.enemy === key || o.enemy === 'any') : false;
    if (!match) continue;
    const was = isReady(p, q);
    p.side[q.id].progress = Math.min(o.count, (p.side[q.id].progress || 0) + n);
    if (!was && isReady(p, q)) ready.push(q);
  }
  return ready;
}

// Hands in a finished quest. The caller shows toasts and applies XP (so level-ups are announced).
export function complete(p, q) {
  if (q.objective.type === 'bring') removeItem(p, q.objective.item, q.objective.count);
  p.side[q.id] = { state: 'done' };
  const r = q.reward || {};
  const skillLevels = [];
  for (const [s, xp] of Object.entries(r.skillXp || {})) if (addSkillXp(p, s, xp)) skillLevels.push(s);
  for (const [id, n] of Object.entries(r.items || {})) addItem(p, id, n);
  return { skillLevels };
}

export function rewardText(q) {
  const r = q.reward || {};
  const parts = [];
  if (r.xp) parts.push(`+${r.xp} XP`);
  if (r.gold) parts.push(`+${r.gold} gold`);
  for (const [s, xp] of Object.entries(r.skillXp || {})) parts.push(`+${xp} ${SKILLS[s].name} XP`);
  for (const [id, n] of Object.entries(r.items || {})) parts.push(`${n}× ${ITEMS[id].name}`);
  for (const id of r.gear || []) parts.push(GEAR[id].name);
  return parts.join(' · ');
}

// Side quests this NPC can offer or take back right now.
export function npcSideQuests(p, npcId) {
  return {
    ready: SIDE_QUESTS.filter(q => q.turnIn === npcId && isReady(p, q)),
    offers: SIDE_QUESTS.filter(q => q.giver === npcId && isAvailable(p, q)),
    active: SIDE_QUESTS.filter(q => q.giver === npcId && isActive(p, q.id) && !isReady(p, q)),
  };
}

export function activeSideQuests(p) {
  return SIDE_QUESTS.filter(q => isActive(p, q.id));
}
