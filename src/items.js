// Stackable things that live in your materials bag: ores, bars, logs, fish, herbs, food,
// potions, gems, tools and building blocks. (Hats, robes, wands... are gear, in data.js.)
//   type: ore | bar | log | plank | fish | food | herb | potion | gem | tool | block | junk | misc
//   value: gold when sold · heal: health restored when eaten · tool: { skill, power }

const chip = (icon, color, extra = {}) => ({ icon, color, ...extra });

export const ITEMS = {
  // ---------- mining ----------
  stone:          { name: 'Stone',           type: 'ore', value: 1,  ...chip('🪨', '#8a8494') },
  copper_ore:     { name: 'Copper Ore',      type: 'ore', value: 3,  ...chip('🪨', '#d4803a') },
  iron_ore:       { name: 'Iron Ore',        type: 'ore', value: 6,  ...chip('🪨', '#8f98a8') },
  silver_ore:     { name: 'Silver Ore',      type: 'ore', value: 10, ...chip('🪨', '#dfe6f0') },
  gold_ore:       { name: 'Gold Ore',        type: 'ore', value: 16, ...chip('🪨', '#f2c14e') },
  emberite_ore:   { name: 'Emberite Ore',    type: 'ore', value: 22, ...chip('🪨', '#ff5a1a') },
  starmetal_ore:  { name: 'Starmetal Ore',   type: 'ore', value: 32, ...chip('🪨', '#9fd6ff') },
  dragonite_ore:  { name: 'Dragonite Ore',   type: 'ore', value: 50, ...chip('🪨', '#9a4dff') },

  copper_bar:     { name: 'Copper Bar',      type: 'bar', value: 8,   ...chip('🧱', '#d4803a') },
  iron_bar:       { name: 'Iron Bar',        type: 'bar', value: 16,  ...chip('🧱', '#8f98a8') },
  silver_bar:     { name: 'Silver Bar',      type: 'bar', value: 26,  ...chip('🧱', '#dfe6f0') },
  gold_bar:       { name: 'Gold Bar',        type: 'bar', value: 40,  ...chip('🧱', '#f2c14e') },
  emberite_bar:   { name: 'Emberite Bar',    type: 'bar', value: 55,  ...chip('🧱', '#ff5a1a') },
  starmetal_bar:  { name: 'Starmetal Bar',   type: 'bar', value: 80,  ...chip('🧱', '#9fd6ff') },
  dragonite_bar:  { name: 'Dragonite Bar',   type: 'bar', value: 125, ...chip('🧱', '#9a4dff') },

  sapphire:       { name: 'Sapphire',        type: 'gem', value: 40,  ...chip('💎', '#3a7ae0') },
  emerald:        { name: 'Emerald',         type: 'gem', value: 60,  ...chip('💎', '#2ecc71') },
  ruby:           { name: 'Ruby',            type: 'gem', value: 90,  ...chip('💎', '#e8455c') },
  diamond:        { name: 'Diamond',         type: 'gem', value: 150, ...chip('💎', '#e8f8ff') },

  // ---------- woodcutting ----------
  logs:           { name: 'Logs',            type: 'log', value: 2,  ...chip('🪵', '#9a6a3a') },
  oak_logs:       { name: 'Oak Logs',        type: 'log', value: 5,  ...chip('🪵', '#b8864a') },
  willow_logs:    { name: 'Willow Logs',     type: 'log', value: 9,  ...chip('🪵', '#8aa060') },
  moonwood_logs:  { name: 'Moonwood Logs',   type: 'log', value: 14, ...chip('🪵', '#d36fae') },
  emberwood_logs: { name: 'Emberwood Logs',  type: 'log', value: 20, ...chip('🪵', '#ff7a3d') },
  elder_logs:     { name: 'Elder Logs',      type: 'log', value: 30, ...chip('🪵', '#6a4aa0') },
  dragonwood_logs:{ name: 'Dragonwood Logs', type: 'log', value: 46, ...chip('🪵', '#c0392b') },

  planks:         { name: 'Planks',          type: 'plank', value: 5,  ...chip('🟫', '#b8864a') },
  fine_planks:    { name: 'Fine Planks',     type: 'plank', value: 18, ...chip('🟫', '#8aa060') },

  // ---------- fishing & cooking ----------
  raw_minnow:     { name: 'Raw Minnow',      type: 'fish', value: 2,  ...chip('🐟', '#9fd6ff') },
  raw_trout:      { name: 'Raw Trout',       type: 'fish', value: 5,  ...chip('🐟', '#8ab07a') },
  raw_salmon:     { name: 'Raw Salmon',      type: 'fish', value: 9,  ...chip('🐟', '#ff9a8a') },
  raw_lavafish:   { name: 'Raw Lavafish',    type: 'fish', value: 18, ...chip('🐟', '#ff5a1a') },
  raw_frostcod:   { name: 'Raw Frostcod',    type: 'fish', value: 26, ...chip('🐟', '#dff6ff') },
  raw_dragoneel:  { name: 'Raw Dragon Eel',  type: 'fish', value: 40, ...chip('🐟', '#9a4dff') },

  raw_moonfish:   { name: 'Raw Moonfish',    type: 'fish', value: 14, ...chip('🐟', '#e0e8ff') },
  cooked_moonfish:{ name: 'Moonfish Supper',  type: 'food', value: 26, heal: 320, regen: true, ...chip('🍢', '#e0e8ff') },
  cooked_minnow:  { name: 'Grilled Minnow',  type: 'food', value: 4,  heal: 70,  ...chip('🍢', '#9fd6ff') },
  cooked_trout:   { name: 'Baked Trout',     type: 'food', value: 9,  heal: 160, ...chip('🍢', '#8ab07a') },
  cooked_salmon:  { name: 'Seared Salmon',   type: 'food', value: 16, heal: 260, ...chip('🍢', '#ff9a8a') },
  cooked_lavafish:{ name: 'Smoky Lavafish',  type: 'food', value: 30, heal: 420, ...chip('🍢', '#ff5a1a') },
  cooked_frostcod:{ name: 'Frostcod Fillet', type: 'food', value: 42, heal: 540, ...chip('🍢', '#dff6ff') },
  cooked_dragoneel:{ name: 'Dragon Eel Steak', type: 'food', value: 64, heal: 750, ...chip('🍢', '#9a4dff') },
  berry_tart:     { name: 'Berry Tart',      type: 'food', value: 12, heal: 200, ...chip('🥧', '#8a5ad0') },
  hearty_stew:    { name: 'Hearty Stew',     type: 'food', value: 35, heal: 480, regen: true, ...chip('🍲', '#c9a24a') },
  wildberries:    { name: 'Wildberries',     type: 'food', value: 1,  heal: 35,  ...chip('🫐', '#6a5ad0') },
  burnt_food:     { name: 'Burnt Something', type: 'junk', value: 0,  ...chip('🦴', '#3a3040') },

  // ---------- foraging & alchemy ----------
  moonleaf:       { name: 'Moonleaf',        type: 'herb', value: 3,  ...chip('🌿', '#9fe6c0') },
  sunpetal:       { name: 'Sunpetal',        type: 'herb', value: 6,  ...chip('🌼', '#ffd23d') },
  glowcap:        { name: 'Glowcap',         type: 'herb', value: 10, ...chip('🍄', '#6fd3ff') },
  emberroot:      { name: 'Emberroot',       type: 'herb', value: 18, ...chip('🌶️', '#ff5a1a') },
  frostbloom:     { name: 'Frostbloom',      type: 'herb', value: 26, ...chip('❄️', '#dff6ff') },
  dragons_tongue: { name: "Dragon's Tongue", type: 'herb', value: 40, ...chip('🌺', '#e8455c') },

  mana_tonic:     { name: 'Mana Tonic',        type: 'potion', value: 15, use: 'mana', amount: 0.6, ...chip('🧪', '#3a7ae0') },
  greater_potion: { name: 'Greater Healing',   type: 'potion', value: 40, use: 'heal', amount: 0.8, ...chip('🧪', '#ff5fa2') },
  elixir_might:   { name: 'Elixir of Might',   type: 'potion', value: 30, use: 'buff', buff: 'might', ...chip('⚗️', '#ff6a2b') },
  elixir_stone:   { name: 'Elixir of Stone',   type: 'potion', value: 40, use: 'buff', buff: 'stone', ...chip('⚗️', '#8f98a8') },
  swift_draught:  { name: 'Swiftness Draught', type: 'potion', value: 25, use: 'buff', buff: 'swift', ...chip('⚗️', '#5fdc6a') },
  sage_brew:      { name: "Sage's Brew",       type: 'potion', value: 45, use: 'buff', buff: 'sage', ...chip('⚗️', '#b46bff') },
  dragonfire_ward:{ name: 'Dragonfire Ward',   type: 'potion', value: 90, use: 'buff', buff: 'dragonward', ...chip('⚗️', '#c0392b') },

  // ---------- tools (best one in your bag is used automatically) ----------
  copper_pickaxe: { name: 'Copper Pickaxe',  type: 'tool', value: 10,  tool: { skill: 'mining', power: 1 },      ...chip('⛏️', '#d4803a') },
  iron_pickaxe:   { name: 'Iron Pickaxe',    type: 'tool', value: 60,  tool: { skill: 'mining', power: 2 },      ...chip('⛏️', '#8f98a8') },
  gold_pickaxe:   { name: 'Gold Pickaxe',    type: 'tool', value: 180, tool: { skill: 'mining', power: 3 },      ...chip('⛏️', '#f2c14e') },
  dragonite_pickaxe: { name: 'Dragonite Pickaxe', type: 'tool', value: 600, tool: { skill: 'mining', power: 5 }, ...chip('⛏️', '#9a4dff') },
  copper_axe:     { name: 'Copper Axe',      type: 'tool', value: 10,  tool: { skill: 'woodcutting', power: 1 }, ...chip('🪓', '#d4803a') },
  iron_axe:       { name: 'Iron Axe',        type: 'tool', value: 60,  tool: { skill: 'woodcutting', power: 2 }, ...chip('🪓', '#8f98a8') },
  gold_axe:       { name: 'Gold Axe',        type: 'tool', value: 180, tool: { skill: 'woodcutting', power: 3 }, ...chip('🪓', '#f2c14e') },
  dragonite_axe:  { name: 'Dragonite Axe',   type: 'tool', value: 600, tool: { skill: 'woodcutting', power: 5 }, ...chip('🪓', '#9a4dff') },
  twig_rod:       { name: 'Twig Fishing Rod', type: 'tool', value: 8,  tool: { skill: 'fishing', power: 1 },     ...chip('🎣', '#9a6a3a') },
  willow_rod:     { name: 'Willow Rod',      type: 'tool', value: 60,  tool: { skill: 'fishing', power: 2 },     ...chip('🎣', '#8aa060') },
  moonwood_rod:   { name: 'Moonwood Rod',    type: 'tool', value: 180, tool: { skill: 'fishing', power: 3 },     ...chip('🎣', '#d36fae') },
  dragonwood_rod: { name: 'Dragonwood Rod',  type: 'tool', value: 600, tool: { skill: 'fishing', power: 5 },     ...chip('🎣', '#c0392b') },
  herb_shears:    { name: 'Herb Shears',     type: 'tool', value: 60,  tool: { skill: 'foraging', power: 2 },    ...chip('✂️', '#8f98a8') },
  silver_sickle:  { name: 'Silver Sickle',   type: 'tool', value: 200, tool: { skill: 'foraging', power: 3 },    ...chip('🌙', '#dfe6f0') },

  // ---------- building blocks (place them at your Homestead with G) ----------
  block_wood:     { name: 'Wood Block',      type: 'block', value: 2,  ...chip('🟫', '#b8864a') },
  block_log:      { name: 'Log Block',       type: 'block', value: 2,  ...chip('🪵', '#7a5230') },
  block_leaves:   { name: 'Leaf Block',      type: 'block', value: 2,  ...chip('🍃', '#4f9a4a') },
  block_stone:    { name: 'Stone Brick',     type: 'block', value: 2,  ...chip('🧱', '#8a8494') },
  block_brick:    { name: 'Red Brick',       type: 'block', value: 3,  ...chip('🧱', '#a04a3a') },
  block_glass:    { name: 'Glass Block',     type: 'block', value: 4,  ...chip('🪟', '#bfe8ff') },
  block_door:     { name: 'Door Block',      type: 'block', value: 4,  ...chip('🚪', '#6a4a2a') },
  block_lantern:  { name: 'Lantern Block',   type: 'block', value: 8,  ...chip('🏮', '#ffd27a') },
  block_moon:     { name: 'Moonwood Block',  type: 'block', value: 6,  ...chip('🌸', '#d36fae') },
  block_ember:    { name: 'Emberwood Block', type: 'block', value: 8,  ...chip('🔥', '#ff6a2b') },
  block_gold:     { name: 'Gold Block',      type: 'block', value: 30, ...chip('🟨', '#f2c14e') },
  block_crystal:  { name: 'Crystal Block',   type: 'block', value: 15, ...chip('💠', '#6fb8ff') },
  block_ice:      { name: 'Ice Block',       type: 'block', value: 8,  ...chip('🧊', '#dff6ff') },
  block_dragon:   { name: 'Dragonscale Block', type: 'block', value: 30, ...chip('🐉', '#a0202a') },

  // ---------- trophies & misc ----------
  dragon_scale:   { name: 'Dragon Scale',    type: 'misc', value: 60,  ...chip('🛡️', '#c0392b') },
  dragon_bone:    { name: 'Dragon Bone',     type: 'misc', value: 45,  ...chip('🦴', '#f0e6d0') },
  rift_shard:     { name: 'Rift Shard',      type: 'misc', value: 0,   ...chip('🔮', '#b46bff') },
};
for (const [id, it] of Object.entries(ITEMS)) it.id = id;

// Timed buffs from elixirs. `stats` are added to your character like gear.
export const BUFFS = {
  might:      { name: 'Might',           icon: '💪', dur: 240, stats: { dmg: 15 } },
  stone:      { name: 'Stoneskin',       icon: '🪨', dur: 240, stats: { resist: 12 } },
  swift:      { name: 'Swiftness',       icon: '💨', dur: 240, speed: 0.25 },
  sage:       { name: "Sage's Focus",    icon: '🔮', dur: 240, stats: { pip: 10, acc: 5 } },
  dragonward: { name: 'Dragonfire Ward', icon: '🐉', dur: 300, stats: { resist: 20 }, fireResist: 0.4 },
  regen:      { name: 'Well Fed',        icon: '🍲', dur: 60 },
};

// ------------------------------------------------------------ bag helpers

export function bagCount(p, id) { return p.bag?.[id] || 0; }

export function addItem(p, id, n = 1) {
  if (!ITEMS[id] || n <= 0) return;
  p.bag[id] = (p.bag[id] || 0) + n;
}

export function removeItem(p, id, n = 1) {
  if (bagCount(p, id) < n) return false;
  p.bag[id] -= n;
  if (p.bag[id] <= 0) delete p.bag[id];
  return true;
}

// The best tool you own for a skill (power 0 means bare hands).
export function bestTool(p, skill) {
  let best = null;
  for (const id of Object.keys(p.bag || {})) {
    const t = ITEMS[id]?.tool;
    if (t && t.skill === skill && (!best || t.power > ITEMS[best].tool.power)) best = id;
  }
  return best ? ITEMS[best] : null;
}

// Food sorted so the one that fits your missing health best comes first.
export function pickFood(p) {
  const missing = p.maxHp - p.hp;
  const foods = Object.keys(p.bag || {}).map(id => ITEMS[id]).filter(it => it?.type === 'food');
  if (!foods.length) return null;
  const fits = foods.filter(f => f.heal <= missing * 1.15).sort((a, b) => b.heal - a.heal);
  return fits[0] || foods.sort((a, b) => a.heal - b.heal)[0];
}
