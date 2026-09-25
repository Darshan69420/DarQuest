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
import { ENEMIES, NPCS, GEAR, foeName } from './data.js';

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

  // ---------------- Glacierreach ----------------
  {
    id: 'frost1', mainQuest: 24, name: 'Warm Hands', giver: 'frida', turnIn: 'frida',
    objective: { type: 'bring', item: 'frostbloom', count: 6 },
    offer: 'Frostbloom only grows in the coldest places, and it makes the warmest mittens. Pick 6 for me around Frostholm and the north road.',
    done: 'Perfect petals! Here: a cloak lined with the first batch. It will keep the blizzard out.',
    reward: { xp: 3500, gold: 400, skillXp: { foraging: 600 }, gear: ['frostfur_cloak'] },
  },
  {
    id: 'frost2', after: 'frost1', name: 'Lake Supper', giver: 'frida', turnIn: 'frida',
    objective: { type: 'bring', item: 'cooked_frostcod', count: 5 },
    offer: 'The whole town is hungry, and the Mirror Lake is full of frostcod. Fish through the ice holes, cook the catch at the hearth, and bring 5 Frostcod Fillets.',
    done: 'The smell alone brought half of Frostholm running! Thank you.',
    reward: { xp: 4000, gold: 500, skillXp: { fishing: 700, cooking: 700 }, items: { hearty_stew: 3 } },
  },
  {
    id: 'frost3', mainQuest: 25, name: 'The Whole Pack', giver: 'halvard', turnIn: 'halvard',
    objective: { type: 'defeat', enemy: 'snow_wolf', count: 12 },
    offer: 'The wolves keep coming back. Their den must be huge. Thin the pack properly: 12 Snowfang Wolves.',
    done: 'Twelve! The watch will sleep tonight. Take these boots: they never slip on ice.',
    reward: { xp: 6000, gold: 700, gear: ['rimewalker_boots'] },
  },

  // ---------------- Stormspire ----------------
  {
    id: 'storm1', mainQuest: 31, name: 'Ship Parts', giver: 'breck', turnIn: 'breck',
    objective: { type: 'bring', item: 'starmetal_ore', count: 8 },
    offer: 'Our airships need starmetal for their engines, and Voltaris\'s storm wrecked half of them. Bring me 8 Starmetal Ore; there is some on Thunder Isle.',
    done: 'That will get two ships flying again. You have a sailor\'s heart, wizard.',
    reward: { xp: 6500, gold: 700, skillXp: { mining: 1200 }, items: { storm_elixir: 2 } },
  },
  {
    id: 'storm2', mainQuest: 32, name: 'Calm Winds', giver: 'tavi', turnIn: 'tavi',
    objective: { type: 'defeat', enemy: 'gale_sprite', count: 10 },
    offer: 'The Gale Sprites keep knocking the wind vanes crooked, and then the rods misfire. Calm 10 of them for me.',
    done: 'The vanes point true again. Here, the Stormcallers sew this for friends.',
    reward: { xp: 8000, gold: 800, gear: ['stormcaller_hood'] },
  },
  {
    id: 'storm3', mainQuest: 33, name: 'Cloud Catch', giver: 'aeris', turnIn: 'aeris',
    objective: { type: 'bring', item: 'raw_skyray', count: 4 },
    offer: 'Sky Rays swim through the clouds just off Skyport\'s edge. Catching one takes a master angler (Fishing 70). Bring me 4 and I will give you my own rod.',
    done: 'Four sky rays! You fish like an old sky-sailor. The rod is yours.',
    reward: { xp: 9000, gold: 900, skillXp: { fishing: 2000 }, items: { skyoak_rod: 1 } },
  },

  // ---------------- Thornwood ----------------
  {
    id: 'thorn1', mainQuest: 38, name: 'Mushroom Forager', giver: 'moss', turnIn: 'moss',
    objective: { type: 'bring', item: 'glowcap', count: 10 },
    offer: 'Glowcaps light up the Glowcap Hollow, west of the glade. I dye my best cloth with them. Bring me 10.',
    done: 'Such a lovely blue. This robe was dyed with the last batch; it is yours.',
    reward: { xp: 10000, gold: 1000, skillXp: { foraging: 2500 }, gear: ['barkskin_robe'] },
  },
  {
    id: 'thorn2', mainQuest: 40, name: 'Pixie Dust', giver: 'wren', turnIn: 'wren',
    objective: { type: 'defeat', enemy: 'pixie', count: 10 },
    offer: 'Some pixies are still enchanted, and they keep leading travellers into the thorns. Break the spell on 10 more.',
    done: 'The glade is safe for travellers again. Here, a heart of green glass, from the pixie queen herself.',
    reward: { xp: 12000, gold: 1100, gear: ['verdant_heart'] },
  },
  {
    id: 'thorn3', mainQuest: 42, name: 'A Gift for the Elder Mother', giver: 'rowan', turnIn: 'rowan',
    objective: { type: 'bring', item: 'heartwood_logs', count: 5 },
    offer: 'Heartwood trees are the Elder Mother\'s children. A master woodcutter (level 80) may take their fallen branches. Bring 5 Heartwood Logs, and we will carve something worthy of you.',
    done: 'The Elder Mother trembles with joy. Take this: our carvers made it from her own bark.',
    reward: { xp: 14000, gold: 1300, skillXp: { woodcutting: 3000 }, gear: ['heartwood_staff'] },
  },

  // ---------------- the Hollow Deep ----------------
  {
    id: 'deep1', mainQuest: 45, name: 'Bones for Mott', giver: 'mott', turnIn: 'mott',
    objective: { type: 'defeat', enemy: 'deathless', count: 10 },
    offer: 'The Deathless keep wandering into the Refuge at night. I bury them, they dig themselves out. Put 10 of them down properly.',
    done: 'Ten graves, and all of them staying shut. Here, boots from an old friend who does not need them any more.',
    reward: { xp: 14000, gold: 1300, gear: ['deepwalker_boots'] },
  },
  {
    id: 'deep2', mainQuest: 46, name: 'Soul Supper', giver: 'mott', turnIn: 'mott',
    objective: { type: 'bring', item: 'soulfish_stew', count: 3 },
    offer: 'Soulfish swim in the glowing rivers. Cook them with nightshade (Cooking 85) and the stew warms even a ghost. Bring me 3 bowls for the Refuge.',
    done: 'Even Sir Aldric smiled. That has not happened in thirty years.',
    reward: { xp: 16000, gold: 1500, skillXp: { cooking: 4000, fishing: 3000 }, items: { void_draught: 2 } },
  },
  {
    id: 'deep3', mainQuest: 48, name: 'Colossal Problem', giver: 'aldric', turnIn: 'aldric',
    objective: { type: 'defeat', enemy: 'bone_colossus', count: 2 },
    offer: 'Two Bone Colossi guard the path north of the Ossuary. They stomp the ground around them, so hit them and step back. Bring them both down.',
    done: 'The path is clear. Take this sigil. It was mine, before the Hollow took me.',
    reward: { xp: 18000, gold: 1800, gear: ['deep_sigil'] },
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
    case 'defeat': return `Defeat ${o.count} ${o.enemy === 'any' ? 'enemies' : foeName(o.enemy, o.count)} ${n}`;
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
