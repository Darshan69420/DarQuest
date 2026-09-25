// Gathering and crafting skills, RuneScape style: every skill levels from 1 to 99 on its own.
// Gather from resource nodes out in the world, then turn what you find into bars, food,
// potions, tools and gear at crafting stations.
import { ITEMS, addItem, removeItem, bagCount, bestTool } from './items.js';

export const SKILLS = {
  mining:      { name: 'Mining',      icon: '⛏️', color: '#b0a8c0', desc: 'Break ore, stone and gems out of rocks. Needs a pickaxe.' },
  woodcutting: { name: 'Woodcutting', icon: '🪓', color: '#9a6a3a', desc: 'Chop logs from trees. Needs an axe.' },
  fishing:     { name: 'Fishing',     icon: '🎣', color: '#6fd3ff', desc: 'Catch fish from ponds, rivers and even lava. Needs a rod.' },
  foraging:    { name: 'Foraging',    icon: '🌿', color: '#5fdc6a', desc: 'Pick herbs, mushrooms and berries.' },
  cooking:     { name: 'Cooking',     icon: '🍳', color: '#ff9a3d', desc: 'Cook fish and meals at a range. Food heals you (F).' },
  smithing:    { name: 'Smithing',    icon: '🔨', color: '#8f98a8', desc: 'Smelt bars at a furnace and forge tools and jewellery at an anvil.' },
  alchemy:     { name: 'Alchemy',     icon: '⚗️', color: '#b46bff', desc: 'Brew potions and elixirs from herbs.' },
  woodworking: { name: 'Woodworking', icon: '🪚', color: '#c9a24a', desc: 'Carve planks, rods, wands and staffs at a workbench.' },
};
export const MAX_SKILL = 99;

// RuneScape's experience curve, scaled down so level 99 is a long but reachable goal.
export const XP_TABLE = [0, 0];
{
  let pts = 0;
  for (let l = 1; l < MAX_SKILL; l++) {
    pts += Math.floor(l + 300 * Math.pow(2, l / 7));
    XP_TABLE[l + 1] = Math.floor(pts / 24);
  }
}

export function levelFromXp(xp) {
  let l = 1;
  while (l < MAX_SKILL && xp >= XP_TABLE[l + 1]) l++;
  return l;
}

export function skillXp(p, skill) { return p.skills?.[skill] || 0; }
export function skillLevel(p, skill) { return levelFromXp(skillXp(p, skill)); }
export function totalLevel(p) { return Object.keys(SKILLS).reduce((n, s) => n + skillLevel(p, s), 0); }

// Adds XP and returns how many levels were gained.
export function addSkillXp(p, skill, xp) {
  const before = skillLevel(p, skill);
  p.skills[skill] = skillXp(p, skill) + Math.round(xp);
  return skillLevel(p, skill) - before;
}

// ------------------------------------------------------------ resource nodes
//   deplete: chance each success empties the node · respawn: seconds until it grows back
//   model: what the world builds for it (see world.addNode)

const rock = (level, item, xp, time, deplete, respawn, vein) => ({ skill: 'mining', verb: 'Mine', level, item, xp, time, deplete, respawn, model: { kind: 'rock', vein } });
const tree = (level, item, xp, time, deplete, respawn, kind) => ({ skill: 'woodcutting', verb: 'Chop', level, item, xp, time, deplete, respawn, model: { kind } });
const fish = (level, item, xp, time, water) => ({ skill: 'fishing', verb: 'Fish at', level, item, xp, time, deplete: 0, respawn: 0, model: { kind: 'fish', water } });
const herb = (level, item, xp, time, deplete, respawn, kind, color) => ({ skill: 'foraging', verb: 'Pick', level, item, xp, time, deplete, respawn, model: { kind, color } });

export const NODE_TYPES = {
  stone_rock:     { name: 'Stone Rock',      ...rock(1, 'stone', 5, 1.8, 0.3, 6, 0x8a8494) },
  copper_rock:    { name: 'Copper Rock',     ...rock(1, 'copper_ore', 8, 2.2, 0.5, 8, 0xd4803a) },
  iron_rock:      { name: 'Iron Rock',       ...rock(10, 'iron_ore', 16, 2.6, 0.6, 12, 0x8f98a8) },
  silver_rock:    { name: 'Silver Rock',     ...rock(20, 'silver_ore', 24, 3, 0.7, 16, 0xdfe6f0) },
  gold_rock:      { name: 'Gold Rock',       ...rock(30, 'gold_ore', 35, 3.2, 0.8, 22, 0xf2c14e) },
  emberite_rock:  { name: 'Emberite Rock',   ...rock(35, 'emberite_ore', 45, 3.4, 0.8, 25, 0xff5a1a) },
  starmetal_rock: { name: 'Starmetal Rock',  ...rock(45, 'starmetal_ore', 60, 3.6, 0.85, 35, 0x9fd6ff) },
  dragonite_rock: { name: 'Dragonite Rock',  ...rock(60, 'dragonite_ore', 90, 4, 0.9, 50, 0x9a4dff) },

  tree:           { name: 'Tree',            ...tree(1, 'logs', 8, 2, 0.25, 10, 'pine') },
  oak:            { name: 'Oak Tree',        ...tree(10, 'oak_logs', 16, 2.4, 0.2, 14, 'oak') },
  willow:         { name: 'Willow Tree',     ...tree(20, 'willow_logs', 24, 2.6, 0.18, 16, 'willow') },
  moonwood:       { name: 'Moonwood Tree',   ...tree(30, 'moonwood_logs', 35, 3, 0.2, 20, 'moonwood') },
  emberwood:      { name: 'Emberwood Tree',  ...tree(35, 'emberwood_logs', 45, 3.2, 0.2, 24, 'emberwood') },
  elder:          { name: 'Elder Tree',      ...tree(50, 'elder_logs', 70, 3.6, 0.15, 30, 'elder') },
  dragonwood:     { name: 'Dragonwood Tree', ...tree(60, 'dragonwood_logs', 90, 4, 0.15, 40, 'dragonwood') },

  fish_minnow:    { name: 'Minnow Shoal',    ...fish(1, 'raw_minnow', 8, 2.4, 'water') },
  fish_trout:     { name: 'Trout Pool',      ...fish(10, 'raw_trout', 16, 2.8, 'water') },
  fish_salmon:    { name: 'Salmon Run',      ...fish(20, 'raw_salmon', 24, 3, 'water') },
  fish_lava:      { name: 'Lavafish Vent',   ...fish(35, 'raw_lavafish', 45, 3.2, 'lava') },
  fish_frost:     { name: 'Frostcod Hole',   ...fish(45, 'raw_frostcod', 60, 3.4, 'ice') },
  fish_eel:       { name: 'Dragon Eel Pool', ...fish(60, 'raw_dragoneel', 90, 3.8, 'lava') },

  berry_bush:     { name: 'Berry Bush',      ...herb(1, 'wildberries', 5, 1.4, 0.34, 15, 'berry', 0x6a5ad0) },
  herb_moonleaf:  { name: 'Moonleaf',        ...herb(1, 'moonleaf', 8, 1.6, 0.5, 12, 'herb', 0x9fe6c0) },
  herb_sunpetal:  { name: 'Sunpetal',        ...herb(10, 'sunpetal', 16, 1.8, 0.5, 14, 'herb', 0xffd23d) },
  herb_glowcap:   { name: 'Glowcap',         ...herb(20, 'glowcap', 24, 2, 0.5, 16, 'mushroom', 0x6fd3ff) },
  herb_emberroot: { name: 'Emberroot',       ...herb(30, 'emberroot', 38, 2.2, 0.55, 20, 'herb', 0xff5a1a) },
  herb_frostbloom:{ name: 'Frostbloom',      ...herb(40, 'frostbloom', 52, 2.4, 0.55, 24, 'herb', 0xdff6ff) },
  herb_dragons_tongue: { name: "Dragon's Tongue", ...herb(55, 'dragons_tongue', 75, 2.6, 0.6, 30, 'herb', 0xe8455c) },
};
for (const [id, n] of Object.entries(NODE_TYPES)) n.id = id;

// Chance of a successful gather each swing: better with levels above the requirement and better tools.
export function gatherChance(p, node) {
  const lvl = skillLevel(p, node.skill);
  const tool = bestTool(p, node.skill)?.tool.power || 0;
  return Math.max(0.2, Math.min(0.95, 0.4 + (lvl - node.level) * 0.018 + tool * 0.08));
}

// Seconds per swing: better tools are faster.
export function gatherTime(p, node) {
  const tool = bestTool(p, node.skill)?.tool.power || 0;
  return node.time * (1 - Math.min(0.4, tool * 0.07));
}

export function needsTool(node) { return ['mining', 'woodcutting', 'fishing'].includes(node.skill); }

// Mining sometimes turns up a gem.
export function rollGem() {
  if (Math.random() > 0.025) return null;
  const r = Math.random();
  return r < 0.5 ? 'sapphire' : r < 0.8 ? 'emerald' : r < 0.95 ? 'ruby' : 'diamond';
}

// ------------------------------------------------------------ crafting stations & recipes

export const STATION_TYPES = {
  furnace:   { name: 'Furnace',       icon: '🔥', skill: 'smithing',    verb: 'Smelt' },
  anvil:     { name: 'Anvil',         icon: '🔨', skill: 'smithing',    verb: 'Forge' },
  range:     { name: 'Cooking Range', icon: '🍳', skill: 'cooking',     verb: 'Cook' },
  alchemy:   { name: 'Alchemy Table', icon: '⚗️', skill: 'alchemy',     verb: 'Brew' },
  workbench: { name: 'Workbench',     icon: '🪚', skill: 'woodworking', verb: 'Carve' },
};

// out: { item, n } | { gear } | { potions } — burn: cooking can fail until you out-level it.
const R = (station, level, xp, inputs, out, extra = {}) => ({ station, level, xp, inputs, out, ...extra });

export const RECIPES = {
  // furnace
  copper_bar:     R('furnace', 1, 6, { copper_ore: 1 }, { item: 'copper_bar' }),
  iron_bar:       R('furnace', 10, 12, { iron_ore: 1 }, { item: 'iron_bar' }),
  silver_bar:     R('furnace', 20, 18, { silver_ore: 1 }, { item: 'silver_bar' }),
  gold_bar:       R('furnace', 30, 28, { gold_ore: 1 }, { item: 'gold_bar' }),
  emberite_bar:   R('furnace', 35, 36, { emberite_ore: 1, stone: 1 }, { item: 'emberite_bar' }),
  starmetal_bar:  R('furnace', 45, 50, { starmetal_ore: 1, iron_ore: 1 }, { item: 'starmetal_bar' }),
  dragonite_bar:  R('furnace', 60, 80, { dragonite_ore: 2, emberite_ore: 1 }, { item: 'dragonite_bar' }),

  // anvil
  copper_pickaxe: R('anvil', 1, 10, { copper_bar: 1 }, { item: 'copper_pickaxe' }),
  copper_axe:     R('anvil', 1, 10, { copper_bar: 1 }, { item: 'copper_axe' }),
  copper_amulet:  R('anvil', 3, 20, { copper_bar: 2 }, { gear: 'copper_amulet' }),
  copper_ring:    R('anvil', 5, 22, { copper_bar: 2 }, { gear: 'copper_ring' }),
  silver_ring:    R('anvil', 24, 70, { silver_bar: 2, sapphire: 1 }, { gear: 'silver_ring' }),
  gold_ring:      R('anvil', 34, 105, { gold_bar: 2, ruby: 1 }, { gear: 'gold_ring' }),
  emberite_band:  R('anvil', 39, 130, { emberite_bar: 2, ruby: 1 }, { gear: 'emberite_band' }),
  starmetal_ring: R('anvil', 49, 190, { starmetal_bar: 2, diamond: 1 }, { gear: 'starmetal_ring' }),
  dragonite_ring: R('anvil', 63, 330, { dragonite_bar: 2, diamond: 1 }, { gear: 'dragonite_ring' }),
  iron_pickaxe:   R('anvil', 10, 26, { iron_bar: 2 }, { item: 'iron_pickaxe' }),
  iron_axe:       R('anvil', 10, 26, { iron_bar: 2 }, { item: 'iron_axe' }),
  herb_shears:    R('anvil', 12, 18, { iron_bar: 1 }, { item: 'herb_shears' }),
  iron_ward:      R('anvil', 13, 40, { iron_bar: 3 }, { gear: 'iron_ward' }),
  ironshod_boots: R('anvil', 16, 45, { iron_bar: 3, copper_bar: 1 }, { gear: 'ironshod_boots' }),
  silver_locket:  R('anvil', 22, 60, { silver_bar: 2, sapphire: 1 }, { gear: 'silver_locket' }),
  silver_sickle:  R('anvil', 25, 40, { silver_bar: 2 }, { item: 'silver_sickle' }),
  gold_pickaxe:   R('anvil', 30, 60, { gold_bar: 2 }, { item: 'gold_pickaxe' }),
  gold_axe:       R('anvil', 30, 60, { gold_bar: 2 }, { item: 'gold_axe' }),
  sunburst_amulet:R('anvil', 32, 95, { gold_bar: 3, ruby: 1 }, { gear: 'sunburst_amulet' }),
  emberite_greaves:R('anvil', 36, 110, { emberite_bar: 3 }, { gear: 'emberite_greaves' }),
  emberite_pendant:R('anvil', 38, 120, { emberite_bar: 2, ruby: 1 }, { gear: 'emberite_pendant' }),
  starmetal_circlet:R('anvil', 46, 170, { starmetal_bar: 3, diamond: 1 }, { gear: 'starmetal_circlet' }),
  starmetal_amulet:R('anvil', 48, 180, { starmetal_bar: 3, sapphire: 1 }, { gear: 'starmetal_amulet' }),
  dragonite_pickaxe:R('anvil', 60, 260, { dragonite_bar: 3 }, { item: 'dragonite_pickaxe' }),
  dragonite_axe:  R('anvil', 60, 260, { dragonite_bar: 3 }, { item: 'dragonite_axe' }),
  dragonite_amulet:R('anvil', 62, 320, { dragonite_bar: 3, diamond: 1 }, { gear: 'dragonite_amulet' }),
  dragonscale_boots:R('anvil', 64, 340, { dragonite_bar: 2, dragon_scale: 3 }, { gear: 'dragonscale_boots' }),

  // cooking range
  cooked_minnow:  R('range', 1, 8, { raw_minnow: 1 }, { item: 'cooked_minnow' }, { burn: true }),
  cooked_trout:   R('range', 10, 16, { raw_trout: 1 }, { item: 'cooked_trout' }, { burn: true }),
  berry_tart:     R('range', 15, 22, { wildberries: 4 }, { item: 'berry_tart' }, { burn: true }),
  cooked_salmon:  R('range', 20, 24, { raw_salmon: 1 }, { item: 'cooked_salmon' }, { burn: true }),
  hearty_stew:    R('range', 25, 40, { raw_salmon: 1, glowcap: 1, moonleaf: 1 }, { item: 'hearty_stew' }, { burn: true }),
  cooked_lavafish:R('range', 35, 45, { raw_lavafish: 1 }, { item: 'cooked_lavafish' }, { burn: true }),
  cooked_frostcod:R('range', 45, 60, { raw_frostcod: 1 }, { item: 'cooked_frostcod' }, { burn: true }),
  cooked_dragoneel:R('range', 60, 90, { raw_dragoneel: 1 }, { item: 'cooked_dragoneel' }, { burn: true }),

  // alchemy table
  healing_potion: R('alchemy', 1, 10, { moonleaf: 2 }, { potions: 1 }),
  mana_tonic:     R('alchemy', 8, 16, { sunpetal: 2 }, { item: 'mana_tonic' }),
  swift_draught:  R('alchemy', 14, 22, { moonleaf: 1, sunpetal: 1 }, { item: 'swift_draught' }),
  elixir_might:   R('alchemy', 20, 30, { glowcap: 1, sunpetal: 2 }, { item: 'elixir_might' }),
  greater_potion: R('alchemy', 28, 40, { glowcap: 2, moonleaf: 2 }, { item: 'greater_potion' }),
  elixir_stone:   R('alchemy', 32, 45, { emberroot: 1, glowcap: 1 }, { item: 'elixir_stone' }),
  sage_brew:      R('alchemy', 42, 60, { frostbloom: 1, sunpetal: 2 }, { item: 'sage_brew' }),
  dragonfire_ward:R('alchemy', 55, 85, { dragons_tongue: 1, frostbloom: 1, emberroot: 1 }, { item: 'dragonfire_ward' }),

  // workbench
  planks:         R('workbench', 1, 6, { logs: 1 }, { item: 'planks' }),
  twig_rod:       R('workbench', 1, 10, { logs: 2 }, { item: 'twig_rod' }),
  oak_wand:       R('workbench', 5, 24, { oak_logs: 2 }, { gear: 'oak_wand' }),
  fine_planks:    R('workbench', 20, 20, { willow_logs: 1 }, { item: 'fine_planks' }),
  willow_rod:     R('workbench', 20, 30, { willow_logs: 2 }, { item: 'willow_rod' }),
  willow_wand:    R('workbench', 22, 40, { willow_logs: 3 }, { gear: 'willow_wand' }),
  moonwood_rod:   R('workbench', 30, 45, { moonwood_logs: 2 }, { item: 'moonwood_rod' }),
  moonwood_staff: R('workbench', 32, 60, { moonwood_logs: 3, sapphire: 1 }, { gear: 'moonwood_staff' }),
  emberwood_staff:R('workbench', 37, 80, { emberwood_logs: 3, ruby: 1 }, { gear: 'emberwood_staff' }),
  elder_staff:    R('workbench', 52, 130, { elder_logs: 3, emerald: 1 }, { gear: 'elder_staff' }),
  dragonwood_rod: R('workbench', 60, 150, { dragonwood_logs: 3 }, { item: 'dragonwood_rod' }),
  dragonwood_staff:R('workbench', 64, 240, { dragonwood_logs: 4, diamond: 1, dragon_scale: 1 }, { gear: 'dragonwood_staff' }),
};
for (const [id, r] of Object.entries(RECIPES)) r.id = id;

export function recipesFor(station) {
  return Object.values(RECIPES).filter(r => r.station === station).sort((a, b) => a.level - b.level);
}

export function canCraft(p, r) {
  if (skillLevel(p, STATION_TYPES[r.station].skill) < r.level) return false;
  return Object.entries(r.inputs).every(([id, n]) => bagCount(p, id) >= n);
}

export function maxCrafts(p, r) {
  return Math.min(...Object.entries(r.inputs).map(([id, n]) => Math.floor(bagCount(p, id) / n)));
}

// Cooking can burn food until you are well above the recipe's level.
export function burnChance(p, r) {
  if (!r.burn) return 0;
  return Math.max(0, 0.45 - (skillLevel(p, 'cooking') - r.level) * 0.03);
}

// Crafts once. Returns { ok, burnt, levels, out } — the caller hands out gear/potions.
export function craftOnce(p, r) {
  if (!canCraft(p, r)) return { ok: false };
  for (const [id, n] of Object.entries(r.inputs)) removeItem(p, id, n);
  const skill = STATION_TYPES[r.station].skill;
  if (Math.random() < burnChance(p, r)) {
    addItem(p, 'burnt_food');
    return { ok: true, burnt: true, levels: addSkillXp(p, skill, r.xp * 0.2) };
  }
  if (r.out.item) addItem(p, r.out.item, r.out.n || 1);
  return { ok: true, burnt: false, levels: addSkillXp(p, skill, r.xp), out: r.out };
}

export function outputName(r, GEAR) {
  if (r.out.item) return ITEMS[r.out.item].name;
  if (r.out.gear) return GEAR[r.out.gear].name;
  return 'Healing Potion';
}
