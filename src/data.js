// All of DarQuest's game content lives here: schools, spells, enemies, NPCs and quests.
// Tweak numbers here to rebalance the game without touching engine code.

export const SCHOOLS = {
  blaze:   { name: 'Blaze',   color: 0xff6a2b, css: '#ff6a2b', icon: '🔥', acc: 0.75, baseHp: 500,
             desc: 'Wild fire magic. Big hits and burning damage over time.', role: 'Burst damage' },
  frost:   { name: 'Frost',   color: 0x6fd3ff, css: '#6fd3ff', icon: '❄️', acc: 0.80, baseHp: 620,
             desc: 'Patient and tough. The most health and the best wards.', role: 'Tank' },
  tempest: { name: 'Tempest', color: 0xb46bff, css: '#b46bff', icon: '⚡', acc: 0.70, baseHp: 450,
             desc: 'Raw lightning. The hardest hitters and the most fragile.', role: 'Glass cannon' },
  verdant: { name: 'Verdant', color: 0x5fdc6a, css: '#5fdc6a', icon: '🌿', acc: 0.90, baseHp: 560,
             desc: 'Life and growth. Powerful healers who outlast anything.', role: 'Healer' },
  umbral:  { name: 'Umbral',  color: 0x9a8cff, css: '#9a8cff', icon: '💀', acc: 0.85, baseHp: 520,
             desc: 'Shadow magic that drains the life from foes to heal yourself.', role: 'Life drain' },
  arcane:  { name: 'Arcane',  color: 0xf2c14e, css: '#f2c14e', icon: '✨', acc: 0.85, baseHp: 540,
             desc: 'The balance of all things. Blades, traps and hits on every foe.', role: 'Crowd control' },
  // Astral spells can be learned by every school.
  astral:  { name: 'Astral',  color: 0xe8e4ff, css: '#e8e4ff', icon: '🌙', acc: 0.95, baseHp: 500,
             desc: 'Universal support magic.', hidden: true },
};

export const PLAYABLE_SCHOOLS = Object.keys(SCHOOLS).filter(k => !SCHOOLS[k].hidden);

// Spell types:
//   damage  {min,max,target:'one'|'all', dot?:{total,rounds}}
//   drain   {min,max,heal (fraction healed), target}
//   dot     {total,rounds}
//   heal    {amount}          hot {total,rounds}
//   blade   {pct}  (self: next damage spell stronger)
//   shield  {pct}  (self: next damage taken reduced)
//   trap    {pct}  (enemy: next damage taken increased)
//   weakness{pct}  (enemy: next damage dealt reduced)
// `level` = level required to learn from the tutor. `enemy: true` = enemy-only spell.
export const SPELLS = {
  // ---------- Blaze ----------
  ember_imp:      { name: 'Ember Imp',       school: 'blaze', pips: 1, type: 'damage', min: 70,  max: 110, target: 'one', level: 1 },
  kindle:         { name: 'Kindle',          school: 'blaze', pips: 2, type: 'dot', total: 240, rounds: 3, level: 2 },
  searing_blade:  { name: 'Searing Blade',   school: 'blaze', pips: 0, type: 'blade', pct: 0.40, level: 4 },
  fire_serpent:   { name: 'Fire Serpent',    school: 'blaze', pips: 3, type: 'damage', min: 250, max: 310, target: 'one', level: 5 },
  phoenix_rush:   { name: 'Phoenix Rush',    school: 'blaze', pips: 4, type: 'damage', min: 360, max: 440, target: 'one', dot: { total: 150, rounds: 3 }, level: 8 },
  magma_colossus: { name: 'Magma Colossus',  school: 'blaze', pips: 5, type: 'damage', min: 540, max: 620, target: 'one', level: 12 },
  inferno_wyrm:   { name: 'Inferno Wyrm',    school: 'blaze', pips: 6, type: 'damage', min: 320, max: 380, target: 'all', dot: { total: 240, rounds: 3 }, level: 16 },

  // ---------- Frost ----------
  frost_sprite:   { name: 'Frost Sprite',    school: 'frost', pips: 1, type: 'damage', min: 60,  max: 100, target: 'one', level: 1 },
  glacial_ward:   { name: 'Glacial Ward',    school: 'frost', pips: 0, type: 'shield', pct: 0.50, level: 2 },
  ice_golem:      { name: 'Ice Golem',       school: 'frost', pips: 3, type: 'damage', min: 230, max: 290, target: 'one', level: 4 },
  rime_trap:      { name: 'Rime Trap',       school: 'frost', pips: 0, type: 'trap', pct: 0.35, level: 5 },
  frost_giant:    { name: 'Frost Giant',     school: 'frost', pips: 4, type: 'damage', min: 380, max: 450, target: 'one', level: 8 },
  blizzard:       { name: 'Blizzard',        school: 'frost', pips: 5, type: 'damage', min: 300, max: 360, target: 'all', level: 12 },
  winter_titan:   { name: 'Winter Titan',    school: 'frost', pips: 6, type: 'damage', min: 620, max: 720, target: 'one', level: 16 },

  // ---------- Tempest ----------
  thunder_sprite: { name: 'Thunder Sprite',  school: 'tempest', pips: 1, type: 'damage', min: 85,  max: 135, target: 'one', level: 1 },
  static_trap:    { name: 'Static Trap',     school: 'tempest', pips: 0, type: 'trap', pct: 0.40, level: 2 },
  lightning_bats: { name: 'Lightning Bats',  school: 'tempest', pips: 2, type: 'damage', min: 120, max: 170, target: 'all', level: 4 },
  storm_shark:    { name: 'Storm Shark',     school: 'tempest', pips: 3, type: 'damage', min: 290, max: 370, target: 'one', level: 5 },
  thunder_roc:    { name: 'Thunder Roc',     school: 'tempest', pips: 4, type: 'damage', min: 430, max: 530, target: 'one', level: 8 },
  tempest_serpent:{ name: 'Tempest Serpent', school: 'tempest', pips: 5, type: 'damage', min: 380, max: 460, target: 'all', level: 12 },
  sky_leviathan:  { name: 'Sky Leviathan',   school: 'tempest', pips: 6, type: 'damage', min: 720, max: 840, target: 'one', level: 16 },

  // ---------- Verdant ----------
  seedling:       { name: 'Seedling',        school: 'verdant', pips: 1, type: 'damage', min: 65,  max: 95,  target: 'one', level: 1 },
  blossom_mend:   { name: 'Blossom Mend',    school: 'verdant', pips: 2, type: 'heal', amount: 320, level: 2 },
  thornling:      { name: 'Thornling',       school: 'verdant', pips: 2, type: 'damage', min: 150, max: 200, target: 'one', level: 4 },
  sprite_circle:  { name: 'Sprite Circle',   school: 'verdant', pips: 2, type: 'hot', total: 390, rounds: 3, level: 5 },
  grove_warden:   { name: 'Grove Warden',    school: 'verdant', pips: 4, type: 'damage', min: 370, max: 430, target: 'one', level: 8 },
  rebirth:        { name: 'Rebirth',         school: 'verdant', pips: 5, type: 'heal', amount: 950, level: 12 },
  ancient_treant: { name: 'Ancient Treant',  school: 'verdant', pips: 5, type: 'damage', min: 500, max: 580, target: 'one', level: 16 },

  // ---------- Umbral ----------
  shade_bite:     { name: 'Shade Bite',      school: 'umbral', pips: 1, type: 'drain', min: 60,  max: 95,  heal: 0.5, target: 'one', level: 1 },
  wither:         { name: 'Wither',          school: 'umbral', pips: 2, type: 'dot', total: 250, rounds: 3, level: 2 },
  ghoul_claw:     { name: 'Ghoul Claw',      school: 'umbral', pips: 3, type: 'drain', min: 190, max: 240, heal: 0.5, target: 'one', level: 4 },
  dread_hex:      { name: 'Dread Hex',       school: 'umbral', pips: 0, type: 'trap', pct: 0.40, level: 5 },
  banshee_wail:   { name: 'Banshee Wail',    school: 'umbral', pips: 4, type: 'damage', min: 390, max: 450, target: 'one', level: 8 },
  reaper:         { name: 'Reaper',          school: 'umbral', pips: 5, type: 'drain', min: 430, max: 510, heal: 0.5, target: 'one', level: 12 },
  void_horror:    { name: 'Void Horror',     school: 'umbral', pips: 6, type: 'drain', min: 360, max: 420, heal: 0.3, target: 'all', level: 16 },

  // ---------- Arcane ----------
  arcane_bolt:    { name: 'Arcane Bolt',     school: 'arcane', pips: 1, type: 'damage', min: 70,  max: 100, target: 'one', level: 1 },
  keen_blade:     { name: 'Keen Blade',      school: 'arcane', pips: 0, type: 'blade', pct: 0.30, level: 2 },
  hex_trap:       { name: 'Hex Trap',        school: 'arcane', pips: 0, type: 'trap', pct: 0.30, level: 3 },
  scarab_swarm:   { name: 'Scarab Swarm',    school: 'arcane', pips: 2, type: 'damage', min: 110, max: 150, target: 'all', level: 4 },
  sphinx_sands:   { name: 'Sphinx Sands',    school: 'arcane', pips: 3, type: 'damage', min: 250, max: 310, target: 'one', level: 6 },
  starfall:       { name: 'Starfall',        school: 'arcane', pips: 5, type: 'damage', min: 330, max: 400, target: 'all', level: 10 },
  celestial_titan:{ name: 'Celestial Titan', school: 'arcane', pips: 6, type: 'damage', min: 660, max: 770, target: 'one', level: 16 },

  // ---------- Astral (anyone can learn) ----------
  minor_mend:     { name: 'Minor Mend',      school: 'astral', pips: 1, type: 'heal', amount: 160, level: 1 },
  moon_ward:      { name: 'Moon Ward',       school: 'astral', pips: 0, type: 'shield', pct: 0.30, level: 3 },
  star_edge:      { name: 'Star Edge',       school: 'astral', pips: 0, type: 'blade', pct: 0.25, level: 5 },
  sap_strength:   { name: 'Sap Strength',    school: 'astral', pips: 1, type: 'weakness', pct: 0.30, level: 7 },
  greater_mend:   { name: 'Greater Mend',    school: 'astral', pips: 3, type: 'heal', amount: 480, level: 10 },

  // ---------- Enemy-only ----------
  twig_lash:      { name: 'Twig Lash',       school: 'umbral',  pips: 1, type: 'damage', min: 45,  max: 70,  target: 'one', enemy: true },
  gnaw:           { name: 'Gnaw',            school: 'blaze',   pips: 1, type: 'damage', min: 55,  max: 80,  target: 'one', enemy: true },
  chill_touch:    { name: 'Chill Touch',     school: 'frost',   pips: 1, type: 'damage', min: 60,  max: 90,  target: 'one', enemy: true },
  rusted_slash:   { name: 'Rusted Slash',    school: 'umbral',  pips: 1, type: 'damage', min: 80,  max: 115, target: 'one', enemy: true },
  peck_bolt:      { name: 'Peck Bolt',       school: 'tempest', pips: 1, type: 'damage', min: 85,  max: 125, target: 'one', enemy: true },
  hollow_strike:  { name: 'Hollow Strike',   school: 'umbral',  pips: 2, type: 'damage', min: 150, max: 190, target: 'one', enemy: true },
  grave_mend:     { name: 'Grave Mend',      school: 'umbral',  pips: 2, type: 'heal', amount: 250, enemy: true },
  imp_flare:      { name: 'Imp Flare',       school: 'blaze',   pips: 1, type: 'damage', min: 95,  max: 135, target: 'one', enemy: true },
  ash_bite:       { name: 'Ash Bite',        school: 'blaze',   pips: 1, type: 'damage', min: 110, max: 150, target: 'one', enemy: true },
  howl:           { name: 'Howl',            school: 'blaze',   pips: 0, type: 'blade', pct: 0.30, enemy: true },
  rock_slam:      { name: 'Rock Slam',       school: 'arcane',  pips: 2, type: 'damage', min: 200, max: 250, target: 'one', enemy: true },
  stone_skin:     { name: 'Stone Skin',      school: 'arcane',  pips: 0, type: 'shield', pct: 0.40, enemy: true },
  molten_wave:    { name: 'Molten Wave',     school: 'blaze',   pips: 3, type: 'damage', min: 230, max: 290, target: 'all', enemy: true },
  magma_mend:     { name: 'Magma Mend',      school: 'blaze',   pips: 3, type: 'heal', amount: 600, enemy: true },
  eruption:       { name: 'Eruption',        school: 'blaze',   pips: 5, type: 'damage', min: 420, max: 500, target: 'one', dot: { total: 180, rounds: 3 }, enemy: true },

  // ---------- Pet spells (cast for free when a pet "may-casts") ----------
  pet_mend:       { name: 'Pet: Mossy Mend', school: 'verdant', pips: 0, type: 'heal', amount: 140, pet: true },
  pet_flame:      { name: 'Pet: Drake Flame', school: 'blaze',  pips: 0, type: 'damage', min: 100, max: 150, target: 'one', pet: true },
  pet_zap:        { name: 'Pet: Beetle Zap', school: 'tempest', pips: 0, type: 'damage', min: 110, max: 170, target: 'one', pet: true },
  pet_ward:       { name: 'Pet: Frost Ward', school: 'frost',   pips: 0, type: 'shield', pct: 0.35, pet: true },
  pet_edge:       { name: 'Pet: Owl Edge',   school: 'arcane',  pips: 0, type: 'blade', pct: 0.25, pet: true },
  pet_leech:      { name: 'Pet: Bat Leech',  school: 'umbral',  pips: 0, type: 'drain', min: 80, max: 120, heal: 0.6, target: 'one', pet: true },
};

for (const [id, s] of Object.entries(SPELLS)) s.id = id;

export function describe(s) {
  const school = SCHOOLS[s.school].name;
  const all = s.target === 'all' ? ' to all enemies' : '';
  const pct = Math.round((s.pct || 0) * 100);
  switch (s.type) {
    case 'damage': return `${s.min}–${s.max} ${school} damage${all}` + (s.dot ? `, then ${s.dot.total} over ${s.dot.rounds} rounds` : '');
    case 'drain':  return `${s.min}–${s.max} ${school} damage${all}. Heal ${Math.round(s.heal * 100)}% of it`;
    case 'dot':    return `${s.total} ${school} damage over ${s.rounds} rounds`;
    case 'heal':   return `Heal ${s.amount} health`;
    case 'hot':    return `Heal ${s.total} over ${s.rounds} rounds`;
    case 'blade':  return `+${pct}% to your next damage spell`;
    case 'shield': return `−${pct}% to the next hit you take`;
    case 'trap':   return `Enemy takes +${pct}% from the next hit`;
    case 'weakness': return `Enemy's next hit deals −${pct}%`;
  }
  return '';
}

// Which spell types need an enemy target.
export const OFFENSIVE = new Set(['damage', 'drain', 'dot', 'trap', 'weakness']);

// Real-time combat: the old pip cost becomes mana and a cooldown.
export function spellCost(s) { return s.pips === 0 ? 10 : s.pips * 12; }
export function spellCooldown(s) { return s.pips === 0 ? 9 : 1.4 + s.pips * 1.7; }
export const BASIC_COOLDOWN = 1.1;


// Chapter 2 lives far to the east of the academy in the same 3D scene.
export const EMBER_X = 700;

// `drops`: chance of each gear item (or pet) dropping after a victory.
// `phases`: one-time boss events when its health falls below `at`.
// `reactions`: the boss answers when it is hit by a spell of that school.
export const ENEMIES = {
  // ---------------- Chapter 1: Hollow Lane ----------------
  gloomsprig: {
    name: 'Gloomsprig', school: 'umbral', level: 1, hp: 170, xp: 30, gold: [3, 8], model: 'sprig',
    spells: ['twig_lash', 'twig_lash', 'shade_bite'], resist: { umbral: 0.25 }, boost: { blaze: 0.15 },
    speed: 2.2, aggro: 6,
    drops: [{ item: 'twig_wand', chance: 0.15 }, { item: 'soft_boots', chance: 0.12 }, { item: 'apprentice_hat', chance: 0.12 }],
  },
  cinder_rat: {
    name: 'Cinder Rat', school: 'blaze', level: 2, hp: 230, xp: 40, gold: [5, 10], model: 'rat',
    spells: ['gnaw', 'gnaw', 'ember_imp', 'kindle'], resist: { blaze: 0.3 }, boost: { frost: 0.2 },
    speed: 3.0, aggro: 7,
    drops: [{ item: 'woven_robe', chance: 0.12 }, { item: 'sprigwood_wand', chance: 0.08 }],
  },
  frost_wisp: {
    name: 'Frostbitten Wisp', school: 'frost', level: 3, hp: 290, xp: 55, gold: [6, 12], model: 'wisp',
    spells: ['chill_touch', 'chill_touch', 'frost_sprite', 'glacial_ward'], resist: { frost: 0.3 }, boost: { blaze: 0.2 },
    speed: 2.4, aggro: 6,
    drops: [{ item: 'wisp_charm', chance: 0.12 }, { item: 'woven_robe', chance: 0.08 }],
  },
  hollow_knight: {
    name: 'Hollow Knight', school: 'umbral', level: 5, hp: 470, xp: 90, gold: [10, 20], model: 'knight',
    spells: ['rusted_slash', 'rusted_slash', 'hollow_strike', 'wither'], resist: { umbral: 0.3 }, boost: { verdant: 0.15 },
    speed: 2.0, aggro: 6,
    drops: [{ item: 'lanternweave_robe', chance: 0.12 }, { item: 'crowfeather_boots', chance: 0.08 }],
  },
  storm_crow: {
    name: 'Storm Crow', school: 'tempest', level: 6, hp: 380, xp: 100, gold: [12, 22], model: 'crow',
    spells: ['peck_bolt', 'peck_bolt', 'thunder_sprite', 'lightning_bats', 'static_trap'], resist: { tempest: 0.3 }, boost: { frost: 0.15 },
    speed: 3.2, aggro: 8,
    drops: [{ item: 'crowfeather_boots', chance: 0.12 }, { item: 'ember_cowl', chance: 0.06 }, { pet: 'storm_beetle', chance: 0.03 }],
  },
  lord_hollowmere: {
    name: 'Lord Hollowmere', school: 'umbral', level: 8, hp: 1500, xp: 600, gold: [120, 160], model: 'boss', boss: true,
    spells: ['hollow_strike', 'hollow_strike', 'ghoul_claw', 'wither', 'banshee_wail', 'dread_hex', 'grave_mend'],
    resist: { umbral: 0.35 }, boost: {}, speed: 0, aggro: 6, powerPipChance: 0.5,
    phases: [{ at: 0.5, say: 'The Hollow cannot be defeated!', blade: 0.35, pips: 2 }],
    drops: [{ item: 'hollowmere_locket', chance: 1 }, { item: 'hollow_blade', chance: 0.6 }, { item: 'knightsilk_robe', chance: 0.4 }, { pet: 'bat_familiar', chance: 0.25 }],
  },

  // ---------------- Chapter 2: Emberfall Wilds ----------------
  lava_imp: {
    name: 'Lava Imp', school: 'blaze', level: 8, hp: 560, xp: 130, gold: [14, 24], model: 'imp',
    spells: ['imp_flare', 'imp_flare', 'kindle', 'ember_imp', 'searing_blade'], resist: { blaze: 0.4 }, boost: { frost: 0.25 },
    speed: 3.4, aggro: 7,
    drops: [{ item: 'ember_cowl', chance: 0.1 }, { item: 'ashwalkers', chance: 0.05 }, { pet: 'ember_drake', chance: 0.02 }],
  },
  cinderhound: {
    name: 'Cinderhound', school: 'blaze', level: 9, hp: 650, xp: 150, gold: [15, 26], model: 'hound',
    spells: ['ash_bite', 'ash_bite', 'howl', 'fire_serpent'], resist: { blaze: 0.4 }, boost: { frost: 0.2 },
    speed: 4.2, aggro: 9,
    drops: [{ item: 'ashwalkers', chance: 0.1 }, { item: 'knightsilk_robe', chance: 0.08 }, { pet: 'frost_pup', chance: 0.02 }],
  },
  ashen_shaman: {
    name: 'Ashen Shaman', school: 'umbral', level: 9, hp: 600, xp: 160, gold: [16, 28], model: 'shaman',
    spells: ['shade_bite', 'ghoul_claw', 'wither', 'grave_mend', 'dread_hex'], resist: { umbral: 0.35 }, boost: { verdant: 0.15 },
    speed: 2.0, aggro: 6,
    drops: [{ item: 'stormcaller_hood', chance: 0.1 }, { item: 'ember_heart', chance: 0.05 }, { pet: 'moss_sprite', chance: 0.02 }],
  },
  obsidian_golem: {
    name: 'Obsidian Golem', school: 'arcane', level: 10, hp: 1000, xp: 190, gold: [18, 32], model: 'golem',
    spells: ['rock_slam', 'rock_slam', 'stone_skin', 'hex_trap', 'sphinx_sands'], resist: { arcane: 0.35, blaze: 0.25 }, boost: { tempest: 0.2 },
    speed: 1.6, aggro: 5,
    drops: [{ item: 'obsidian_rod', chance: 0.08 }, { item: 'cinderguard_robe', chance: 0.08 }],
  },
  magma_serpent: {
    name: 'Magma Serpent', school: 'blaze', level: 11, hp: 800, xp: 210, gold: [20, 35], model: 'serpent',
    spells: ['fire_serpent', 'kindle', 'phoenix_rush', 'imp_flare'], resist: { blaze: 0.45 }, boost: { frost: 0.25 },
    speed: 2.6, aggro: 7,
    drops: [{ item: 'cinderguard_robe', chance: 0.1 }, { item: 'ember_heart', chance: 0.07 }],
  },
  magma_guard: {
    name: 'Magma Guard', school: 'blaze', level: 11, hp: 800, xp: 220, gold: [25, 40], model: 'guard',
    spells: ['ash_bite', 'rock_slam', 'stone_skin', 'kindle'], resist: { blaze: 0.45 }, boost: { frost: 0.2 },
    speed: 0, aggro: 5,
    drops: [{ item: 'obsidian_rod', chance: 0.1 }],
  },
  pyrrhon: {
    name: 'Pyrrhon, the Molten King', school: 'blaze', level: 13, hp: 3600, xp: 1500, gold: [300, 400], model: 'pyrrhon', boss: true,
    spells: ['fire_serpent', 'phoenix_rush', 'eruption', 'molten_wave', 'kindle', 'searing_blade', 'magma_mend'],
    resist: { blaze: 0.5 }, boost: { frost: 0.2 }, speed: 0, aggro: 7, powerPipChance: 0.6,
    phases: [
      { at: 0.66, say: 'You think fire can be put out? I AM the fire!', shield: 0.5, cast: 'molten_wave' },
      { at: 0.33, say: 'Then we burn TOGETHER!', blade: 0.5, pips: 3, heal: 800 },
    ],
    reactions: [{ school: 'frost', say: 'Ice?! You DARE bring ice before the Molten King?', cast: 'kindle' }],
    drops: [{ item: 'molten_crown', chance: 1 }, { item: 'robe_of_pyrrhon', chance: 0.6 }, { item: 'kings_scepter', chance: 0.5 }, { pet: 'ember_drake', chance: 1 }],
  },
};
for (const [id, e] of Object.entries(ENEMIES)) e.id = id;

// Big attacks that are drawn on the ground first, so you can step out of them (or dodge through).
//   circle { r, inner?, at: 'self' | (player), count?, spread? } · cone { r, angle } · line { len, width }
const AOE = {
  hollow_knight:   { hollow_strike: { shape: 'cone', r: 4.4, angle: 1.7, dur: 0.95 } },
  storm_crow:      { lightning_bats: { shape: 'circle', r: 2.8, dur: 1.1 } },
  lord_hollowmere: {
    banshee_wail: { shape: 'circle', at: 'self', inner: 5, r: 19, dur: 1.9 },   // run IN to the boss!
    ghoul_claw: { shape: 'cone', r: 12, angle: 0.75, dur: 1.2 },
    hollow_strike: { shape: 'circle', r: 3, count: 3, spread: 5, dur: 1.25 },
  },
  cinderhound:     { fire_serpent: { shape: 'line', len: 11, width: 2.2, dur: 1 } },
  obsidian_golem:  { rock_slam: { shape: 'circle', r: 4, at: 'self', dur: 1.1 }, sphinx_sands: { shape: 'circle', r: 3.2, dur: 1.2 } },
  magma_serpent:   { fire_serpent: { shape: 'line', len: 15, width: 2.4, dur: 1.1 }, phoenix_rush: { shape: 'circle', r: 3.6, dur: 1.3 } },
  magma_guard:     { rock_slam: { shape: 'circle', r: 4.2, at: 'self', dur: 1.1 } },
  pyrrhon: {
    eruption: { shape: 'circle', r: 3.2, count: 5, spread: 6, dur: 1.5 },
    molten_wave: { shape: 'circle', r: 6, dur: 1.5 },
    fire_serpent: { shape: 'line', len: 20, width: 3, dur: 1.2 },
    phoenix_rush: { shape: 'circle', r: 4, dur: 1.3 },
  },
};
for (const [id, a] of Object.entries(AOE)) ENEMIES[id].aoe = a;

// How far away each foe attacks from. Everything else fights up close.
const RANGED = { frost_wisp: 11, storm_crow: 12, lava_imp: 11, ashen_shaman: 12, magma_serpent: 14, lord_hollowmere: 14, pyrrhon: 16 };
for (const e of Object.values(ENEMIES)) {
  e.range = RANGED[e.id] ?? 2.6;
  e.attackRate = e.boss ? 1.9 : 2.4;
}
ENEMIES.magma_guard.speed = 2.2;
ENEMIES.magma_serpent.speed = 0;

// Where enemies live in the world. `r` = wander radius around the spawn point.
const X = EMBER_X;
export const SPAWNS = [
  { enemy: 'gloomsprig', x: -4, z: 52, r: 4 },
  { enemy: 'gloomsprig', x: 4,  z: 58, r: 4 },
  { enemy: 'gloomsprig', x: -3, z: 64, r: 4 },
  { enemy: 'cinder_rat', x: 4,  z: 70, r: 4 },
  { enemy: 'cinder_rat', x: -4, z: 75, r: 4 },
  { enemy: 'cinder_rat', x: 3,  z: 80, r: 4 },
  { enemy: 'frost_wisp', x: -4, z: 88, r: 4 },
  { enemy: 'frost_wisp', x: 4,  z: 94, r: 4 },
  { enemy: 'frost_wisp', x: -2, z: 100, r: 4 },
  { enemy: 'hollow_knight', x: 4,  z: 106, r: 3 },
  { enemy: 'hollow_knight', x: -4, z: 112, r: 3 },
  { enemy: 'hollow_knight', x: 3,  z: 118, r: 3 },
  { enemy: 'storm_crow', x: -4, z: 124, r: 4 },
  { enemy: 'storm_crow', x: 4,  z: 130, r: 4 },
  { enemy: 'storm_crow', x: 0,  z: 134, r: 3 },
  { enemy: 'lord_hollowmere', x: 0, z: 144, r: 0 },

  { enemy: 'lava_imp', x: X - 4, z: 28, r: 4 },
  { enemy: 'lava_imp', x: X + 4, z: 34, r: 4 },
  { enemy: 'lava_imp', x: X - 2, z: 42, r: 4 },
  { enemy: 'cinderhound', x: X + 4, z: 52, r: 4 },
  { enemy: 'cinderhound', x: X - 4, z: 58, r: 4 },
  { enemy: 'cinderhound', x: X + 2, z: 66, r: 4 },
  { enemy: 'ashen_shaman', x: X - 4, z: 76, r: 3 },
  { enemy: 'ashen_shaman', x: X + 4, z: 84, r: 3 },
  { enemy: 'ashen_shaman', x: X - 1, z: 92, r: 3 },
  { enemy: 'obsidian_golem', x: X + 4, z: 102, r: 2 },
  { enemy: 'obsidian_golem', x: X - 4, z: 110, r: 2 },
  { enemy: 'obsidian_golem', x: X + 1, z: 118, r: 2 },
  { enemy: 'magma_serpent', x: X - 4, z: 127, r: 3 },
  { enemy: 'magma_serpent', x: X + 4, z: 135, r: 3 },
  { enemy: 'magma_serpent', x: X, z: 143, r: 3 },
  { enemy: 'magma_guard', x: X - 4.5, z: 167, r: 0 },
  { enemy: 'magma_guard', x: X + 4.5, z: 167, r: 0 },
  { enemy: 'pyrrhon', x: X, z: 171, r: 0 },
];

export const NPCS = {
  orvyn: {
    name: 'Headmaster Orvyn', title: 'Headmaster', x: 0, z: -22, robe: 0x3b2d7a, hat: 0x2a1f5c, trim: 0xf2c14e, beard: true, hair: 0xe8e8f0, skin: 0xf0c8a8, eyeColor: 0x6a4aa0,
    lines: ['Starfall Academy has stood for a thousand years. It will stand for a thousand more, if its students are brave.',
            'Magic is like a deck of cards, young one. What matters is how you play the hand you are dealt.',
            'East through the side gate lies Millbrook Meadow. The Gatherers\' Guild there will teach you to chop, mine, fish and craft. A wise wizard does not live on spells alone.'],
  },
  mirabel: {
    name: 'Mirabel Quill', title: 'Spell Tutor', x: -15, z: -6, robe: 0x2e7d6b, hat: 0x1f5c4f, trim: 0xe0f2e9, service: 'tutor', hair: 0xa0432a, glasses: true, eyeColor: 0x2e7d6b,
    lines: ['Every level you gain earns you a Training Point. Bring them to me and I will teach you new spells.'],
  },
  fizz: {
    name: 'Madame Fizz', title: 'Potions & Pets', x: 15, z: -6, robe: 0xa0346a, hat: 0x6e1f47, trim: 0xffc3e1, service: 'shop', hair: 0xff7ab8, goggles: true, skin: 0xe8b894, eyeColor: 0xa0346a,
    lines: ['Bubble, bubble! A potion in your pack is worth two in the cauldron.', 'My pet eggs hatch into loyal little friends. They even cast spells for you!'],
  },
  brannoc: {
    name: 'Captain Brannoc', title: 'Lane Watch', x: 7, z: 36, robe: 0x5a5f6b, hat: 0x9aa0b0, trim: 0xc9a24a, hatStyle: 'helmet', hair: 0x2a1a14, skin: 0xc68a5e, eyeColor: 0x3a2a20,
    lines: ['Hollow Lane was a cheerful street once. Now the shadows have moved in.'],
  },
  kestra: {
    name: 'Ranger Kestra', title: 'Emberfall Scout', x: X - 7, z: 6, robe: 0x7a4a24, hat: 0x3d5a2a, trim: 0xe0c080, hatStyle: 'hood', hair: 0xe0702a, eyeColor: 0x2e7d3b, quiver: true,
    lines: ['The canyon runs north to the Molten Throne. Everything between here and there wants to cook you.',
            'Frost magic works wonders on these fire beasts. Just saying.'],
  },
  brisa: {
    name: 'Forewoman Brisa', title: 'Gatherers\' Guild', x: 42, z: 4, robe: 0x5a7a3a, hat: 0x3a4a24, trim: 0xd8b060, service: 'guild', hatStyle: 'hood', backpack: true, hair: 0x6a3a1a, skin: 0xc68a5e, eyeColor: 0x3a6a2a,
    lines: ['Trees, rocks, fish and flowers: the whole meadow is a treasure chest if you know how to open it.',
            'Every skill goes all the way to 99. Nobody has ever mastered them all. Yet!',
            'Chop, mine, fish and pick here, then use the stations in the crafting yard to make something of it.'],
  },
  tumblewick: {
    name: 'Old Tumblewick', title: 'Wandering Outfitter', x: X + 8, z: 3, robe: 0x4a3a6b, hat: 0x2a2040, trim: 0xff9a3d, beard: true, service: 'gear', backpack: true, hair: 0xb0b0b8, skin: 0xd8a888,
    lines: ['Robes, hats, wands! Good gear keeps a wizard alive out here.', 'Found something shiny out there? I buy everything. Mostly.'],
  },
};

// The quest chain. Each quest is offered by `giver` and handed in to `turnIn`.
export const QUESTS = [
  {
    id: 'q1', name: 'A New Apprentice', giver: 'orvyn', turnIn: 'mirabel',
    objective: { type: 'talk', npc: 'mirabel' },
    offer: 'Welcome to Starfall Academy, young wizard! You have a rare spark. Go and see Mirabel Quill, our Spell Tutor, on the west side of the courtyard.',
    done: 'Ah, the new apprentice! Orvyn told me about you. I have a Training Point for you. Spend it at my spell table whenever you like.',
    reward: { xp: 40, gold: 10, tp: 1 },
  },
  {
    id: 'q2', name: 'Weeds of Shadow', giver: 'mirabel', turnIn: 'mirabel',
    objective: { type: 'defeat', enemy: 'gloomsprig', count: 3 },
    offer: 'Shadowy weeds called Gloomsprigs have sprouted in Hollow Lane, south through the gate. Defeat 3 of them and prove your magic is ready.',
    done: 'Splendid! Your spells are growing stronger. Take these coins, and a potion from Madame Fizz\'s stock.',
    reward: { xp: 100, gold: 25, potions: 1 },
  },
  {
    id: 'q3', name: 'Sparks in the Lane', giver: 'brannoc', turnIn: 'brannoc',
    objective: { type: 'defeat', enemy: 'cinder_rat', count: 4 },
    offer: 'You\'re the new apprentice? Good. Cinder Rats are setting the lane on fire. Put out 4 of them for me.',
    done: 'Ha! That\'s the smell of victory. Or scorched rat. Either way, well done.',
    reward: { xp: 150, gold: 40 },
  },
  {
    id: 'q4', name: 'A Chill in the Air', giver: 'brannoc', turnIn: 'brannoc',
    objective: { type: 'defeat', enemy: 'frost_wisp', count: 3 },
    offer: 'Further down the lane, Frostbitten Wisps are freezing the lamp posts. Shatter 3 of them.',
    done: 'The lamps are glowing again. You\'re a natural, apprentice.',
    reward: { xp: 200, gold: 50 },
  },
  {
    id: 'q5', name: 'The Hollow Guard', giver: 'brannoc', turnIn: 'brannoc',
    objective: { type: 'defeat', enemy: 'hollow_knight', count: 3 },
    offer: 'Hollow Knights, empty armor animated by dark magic, patrol near the old crypt. Defeat 3 of them. Be careful!',
    done: 'Empty armor, emptier threats. Someone is controlling them, though. I\'m sure of it.',
    reward: { xp: 300, gold: 70, potions: 1 },
  },
  {
    id: 'q6', name: 'Storm Omens', giver: 'brannoc', turnIn: 'orvyn',
    objective: { type: 'defeat', enemy: 'storm_crow', count: 3 },
    offer: 'Storm Crows circle the crypt, a bad omen. Clear 3 of them, then report to Headmaster Orvyn.',
    done: 'Storm Crows… then it is as I feared. Lord Hollowmere has awakened in the crypt.',
    reward: { xp: 350, gold: 80 },
  },
  {
    id: 'q7', name: 'Lord of the Hollow', giver: 'orvyn', turnIn: 'orvyn',
    objective: { type: 'defeat', enemy: 'lord_hollowmere', count: 1 },
    offer: 'Lord Hollowmere was a student here long ago, until he chose the shadows. Go to the crypt at the end of Hollow Lane and end his reign. Stock up on potions first!',
    done: 'You did it! Hollow Lane is free, and Starfall Academy has a true hero. Please, take this little owl. It hatched the night you arrived, and it seems to have chosen you.',
    reward: { xp: 800, gold: 200, tp: 1, pet: 'spark_owl' },
  },
  // ---------------- Chapter 2 ----------------
  {
    id: 'q8', name: 'The Spiral Door', giver: 'orvyn', turnIn: 'kestra',
    objective: { type: 'talk', npc: 'kestra' },
    offer: 'Hollowmere\'s fall woke something older. Our scouts in the Emberfall Wilds have gone silent. I have opened the Spiral Door on the west side of the courtyard. Step through and find Ranger Kestra.',
    done: 'A wizard from Starfall! Finally. The wilds are burning, and it isn\'t natural. Something at the end of this canyon is stoking the flames.',
    reward: { xp: 200, gold: 30 },
  },
  {
    id: 'q9', name: 'Imp Trouble', giver: 'kestra', turnIn: 'kestra',
    objective: { type: 'defeat', enemy: 'lava_imp', count: 4 },
    offer: 'First things first: Lava Imps are swarming the canyon mouth, just north of camp. Knock out 4 of them. They hit harder than they look!',
    done: 'Not bad at all. Most apprentices come back singed. You came back smiling.',
    reward: { xp: 500, gold: 60 },
  },
  {
    id: 'q10', name: 'Hounds of Ash', giver: 'kestra', turnIn: 'kestra',
    objective: { type: 'defeat', enemy: 'cinderhound', count: 4 },
    offer: 'Cinderhounds hunt in packs further up. They howl to power each other up, so strike fast. Defeat 4.',
    done: 'The howling has stopped. I can finally hear myself think.',
    reward: { xp: 600, gold: 70, potions: 1 },
  },
  {
    id: 'q11', name: 'The Ashen Circle', giver: 'tumblewick', turnIn: 'tumblewick',
    objective: { type: 'defeat', enemy: 'ashen_shaman', count: 3 },
    offer: 'Eh? Ah, a Starfall wizard. The Ashen Shamans are chanting in the canyon, feeding the flames with shadow magic. They heal each other, so take them down quickly. Stop 3 of them.',
    done: 'Ha! The chanting has stopped. Here, a Training Point\'s worth of old wisdom for you.',
    reward: { xp: 700, gold: 80, tp: 1 },
  },
  {
    id: 'q12', name: 'Hearts of Stone', giver: 'tumblewick', turnIn: 'tumblewick',
    objective: { type: 'defeat', enemy: 'obsidian_golem', count: 3 },
    offer: 'Obsidian Golems guard the middle of the canyon. Tough as anvils, and they shrug off fire. Crack 3 of them open. Lightning works well.',
    done: 'Obsidian shards! I\'ll make some fine wands from these.',
    reward: { xp: 800, gold: 90 },
  },
  {
    id: 'q13', name: 'Serpents Rising', giver: 'kestra', turnIn: 'kestra',
    objective: { type: 'defeat', enemy: 'magma_serpent', count: 3 },
    offer: 'Magma Serpents rise out of the lava near the throne. They are the last thing between us and whatever rules this place. Defeat 3.',
    done: 'The path to the Molten Throne is open. I think you know who is waiting there.',
    reward: { xp: 900, gold: 100, potions: 1 },
  },
  {
    id: 'q14', name: 'The Molten King', giver: 'kestra', turnIn: 'orvyn',
    objective: { type: 'defeat', enemy: 'pyrrhon', count: 1 },
    offer: 'Pyrrhon, the Molten King, sits on his throne at the end of the canyon with two Magma Guards. He is weak to Frost, but he hates it. Expect him to fight back. Heal up, stock up, and end this. Then tell Orvyn the news.',
    done: 'Pyrrhon defeated?! The Emberfall Wilds are saved, and word of your deeds will spread across every world. Chapter 2 is complete, archmage. And yet… I sense your story has only just begun.',
    reward: { xp: 2000, gold: 400, tp: 2 },
  },
];

export const SHOP = {
  potion: { name: 'Healing Potion', price: 25, desc: 'Restores 50% of your health. Drink one any time with the H key.' },
  egg: { name: 'Mystery Pet Egg', price: 150, desc: 'Hatches a random pet that follows you and casts spells to help in fights.' },
};

export const RULES = {
  hotbarSlots: 4,
  potionCooldown: 8,
  maxPotions: 5,
  hpPerLevel: 50,
  inventoryMax: 30,
};

// ---------------------------------------------------------------- difficulty

export const DIFFICULTIES = {
  normal: {
    name: 'Normal', icon: '🙂', hp: 1, dmg: 0, reward: 1, drop: 1, smart: false, speed: 1,
    desc: 'The intended adventure. Fair fights and forgiving enemies.',
  },
  heroic: {
    name: 'Heroic', icon: '😤', hp: 1.5, dmg: 0.3, reward: 1.3, drop: 1.5, smart: true, speed: 1.15,
    desc: 'Enemies have +50% health, hit 30% harder, attack faster and play smarter. Better loot.',
  },
  legendary: {
    name: 'Legendary', icon: '💀', hp: 2.2, dmg: 0.6, reward: 1.7, drop: 2, smart: true, speed: 1.3,
    desc: 'For true archmages. Enemies have over double health, hit 60% harder and attack much faster.',
  },
};

// ---------------------------------------------------------------- gear

export const SLOTS = { hat: '🎩 Hat', robe: '👘 Robe', boots: '👢 Boots', wand: '🪄 Wand', amulet: '📿 Amulet' };
export const STAT_NAMES = { hp: 'Health', dmg: 'Damage', acc: 'Crit Chance', resist: 'Resist', pip: 'Haste', heal: 'Healing' };

// Stats: hp (flat), dmg / acc / resist / pip / heal (percent).
// `color` recolours your wizard's hat or robe.
export const GEAR = {
  apprentice_hat:    { name: 'Apprentice Hat',      slot: 'hat',    level: 1,  stats: { hp: 25 }, color: 0x3a4a8c },
  ember_cowl:        { name: 'Ember Cowl',          slot: 'hat',    level: 6,  stats: { hp: 70, dmg: 4 }, color: 0x8c2a1a, price: 180 },
  stormcaller_hood:  { name: 'Stormcaller Hood',    slot: 'hat',    level: 9,  stats: { hp: 110, dmg: 6, pip: 3 }, color: 0x4a2a7a },
  molten_crown:      { name: 'Molten Crown',        slot: 'hat',    level: 13, stats: { hp: 180, dmg: 9, pip: 6 }, color: 0xffa020 },

  woven_robe:        { name: 'Woven Robe',          slot: 'robe',   level: 2,  stats: { hp: 45, resist: 2 }, color: 0x6b5a8a },
  lanternweave_robe: { name: 'Lanternweave Robe',   slot: 'robe',   level: 5,  stats: { hp: 90, resist: 4 }, color: 0xc9a24a, price: 110 },
  knightsilk_robe:   { name: 'Knightsilk Robe',     slot: 'robe',   level: 8,  stats: { hp: 150, resist: 6, heal: 5 }, color: 0x2a2f45 },
  cinderguard_robe:  { name: 'Cinderguard Robe',    slot: 'robe',   level: 10, stats: { hp: 230, resist: 8, dmg: 4 }, color: 0x7a2a1a },
  robe_of_pyrrhon:   { name: 'Robe of Pyrrhon',     slot: 'robe',   level: 13, stats: { hp: 320, resist: 11, dmg: 6 }, color: 0xd9481a },

  soft_boots:        { name: 'Soft Boots',          slot: 'boots',  level: 1,  stats: { hp: 15, acc: 1 } },
  crowfeather_boots: { name: 'Crowfeather Boots',   slot: 'boots',  level: 6,  stats: { hp: 55, acc: 3, resist: 2 }, price: 140 },
  ashwalkers:        { name: 'Ashwalkers',          slot: 'boots',  level: 9,  stats: { hp: 95, acc: 4, resist: 4 }, price: 260 },

  twig_wand:         { name: 'Twig Wand',           slot: 'wand',   level: 1,  stats: { dmg: 2 } },
  sprigwood_wand:    { name: 'Sprigwood Wand',      slot: 'wand',   level: 3,  stats: { dmg: 4, acc: 2 }, price: 70 },
  hollow_blade:      { name: 'Hollow Blade',        slot: 'wand',   level: 7,  stats: { dmg: 7, pip: 3 } },
  obsidian_rod:      { name: 'Obsidian Rod',        slot: 'wand',   level: 10, stats: { dmg: 9, acc: 3, pip: 4 }, price: 380 },
  kings_scepter:     { name: 'King\'s Scepter',     slot: 'wand',   level: 13, stats: { dmg: 13, pip: 6, acc: 2 } },

  wisp_charm:        { name: 'Wisp Charm',          slot: 'amulet', level: 3,  stats: { hp: 35, heal: 8 } },
  hollowmere_locket: { name: 'Hollowmere\'s Locket', slot: 'amulet', level: 8, stats: { hp: 90, dmg: 5, resist: 5 } },
  ember_heart:       { name: 'Ember Heart',         slot: 'amulet', level: 11, stats: { hp: 160, heal: 12, pip: 3 } },

  // ---------- crafted (Smithing at the anvil, Woodworking at the workbench) ----------
  copper_amulet:     { name: 'Copper Amulet',       slot: 'amulet', level: 1,  stats: { hp: 30 }, crafted: true },
  iron_ward:         { name: 'Iron Ward',           slot: 'amulet', level: 5,  stats: { hp: 60, resist: 3 }, crafted: true },
  ironshod_boots:    { name: 'Ironshod Boots',      slot: 'boots',  level: 6,  stats: { hp: 60, resist: 3, acc: 1 }, crafted: true },
  silver_locket:     { name: 'Silver Locket',       slot: 'amulet', level: 8,  stats: { hp: 90, heal: 8, resist: 2 }, crafted: true },
  sunburst_amulet:   { name: 'Sunburst Amulet',     slot: 'amulet', level: 11, stats: { hp: 130, dmg: 5, acc: 2 }, crafted: true },
  emberite_greaves:  { name: 'Emberite Greaves',    slot: 'boots',  level: 13, stats: { hp: 130, resist: 6, acc: 3 }, crafted: true },
  emberite_pendant:  { name: 'Emberite Pendant',    slot: 'amulet', level: 14, stats: { hp: 170, dmg: 7, pip: 3 }, crafted: true },
  starmetal_circlet: { name: 'Starmetal Circlet',   slot: 'hat',    level: 18, stats: { hp: 220, dmg: 8, acc: 4 }, color: 0x9fd6ff, crafted: true },
  starmetal_amulet:  { name: 'Starmetal Amulet',    slot: 'amulet', level: 19, stats: { hp: 240, dmg: 9, heal: 6 }, crafted: true },
  dragonite_amulet:  { name: 'Dragonite Amulet',    slot: 'amulet', level: 25, stats: { hp: 340, dmg: 12, resist: 6 }, crafted: true },
  dragonscale_boots: { name: 'Dragonscale Boots',   slot: 'boots',  level: 26, stats: { hp: 300, resist: 10, acc: 5 }, crafted: true },
  oak_wand:          { name: 'Oak Wand',            slot: 'wand',   level: 3,  stats: { dmg: 4, acc: 1 }, crafted: true },
  willow_wand:       { name: 'Willow Wand',         slot: 'wand',   level: 7,  stats: { dmg: 6, acc: 2, pip: 1 }, crafted: true },
  moonwood_staff:    { name: 'Moonwood Staff',      slot: 'wand',   level: 11, stats: { dmg: 9, acc: 3, pip: 3 }, crafted: true },
  emberwood_staff:   { name: 'Emberwood Staff',     slot: 'wand',   level: 14, stats: { dmg: 11, pip: 4, acc: 2 }, crafted: true },
  elder_staff:       { name: 'Elder Staff',         slot: 'wand',   level: 20, stats: { dmg: 15, pip: 5, acc: 3 }, crafted: true },
  dragonwood_staff:  { name: 'Dragonwood Staff',    slot: 'wand',   level: 26, stats: { dmg: 19, pip: 6, acc: 5 }, crafted: true },
};
for (const [id, g] of Object.entries(GEAR)) {
  g.id = id;
  g.sell = 8 + g.level * 7;
}
export const GEAR_SHOP = ['sprigwood_wand', 'lanternweave_robe', 'crowfeather_boots', 'ember_cowl', 'ashwalkers', 'obsidian_rod'];

// ---------------------------------------------------------------- pets

export const PETS = {
  spark_owl:    { name: 'Spark Owl',    school: 'arcane',  kind: 'owl',    color: 0xf2c14e, spell: 'pet_edge',  chance: 0.22, stats: { hp: 40 } },
  moss_sprite:  { name: 'Moss Sprite',  school: 'verdant', kind: 'sprite', color: 0x5fdc6a, spell: 'pet_mend',  chance: 0.22, stats: { heal: 5 } },
  ember_drake:  { name: 'Ember Drake',  school: 'blaze',   kind: 'drake',  color: 0xff6a2b, spell: 'pet_flame', chance: 0.22, stats: { dmg: 3 } },
  frost_pup:    { name: 'Frost Pup',    school: 'frost',   kind: 'pup',    color: 0x9fe6ff, spell: 'pet_ward',  chance: 0.22, stats: { resist: 3 } },
  bat_familiar: { name: 'Bat Familiar', school: 'umbral',  kind: 'bat',    color: 0x9a8cff, spell: 'pet_leech', chance: 0.22, stats: { hp: 30, dmg: 1 } },
  storm_beetle: { name: 'Storm Beetle', school: 'tempest', kind: 'beetle', color: 0xb46bff, spell: 'pet_zap',   chance: 0.22, stats: { acc: 3 } },
};
for (const [id, p] of Object.entries(PETS)) p.id = id;

// ---------------------------------------------------------------- zones

// Walkable regions for each zone (also drawn on the minimap).
export const ZONES = {
  academy: {
    name: 'Starfall Academy',
    regions: [
      { type: 'circle', x: 0, z: 0, r: 31 }, { type: 'rect', x0: -8.5, x1: 8.5, z0: 24, z1: 146 },
      // Millbrook Meadow, east through the courtyard's side gate
      { type: 'rect', x0: 27, x1: 40, z0: -4, z1: 4 }, { type: 'rect', x0: 36, x1: 132, z0: -46, z1: 46 },
    ],
    spawn: { x: 0, z: -14, heading: Math.PI },
    atmosphere: { fog: 0x4a3468, top: 0x140f38, mid: 0x5b3a8c, bottom: 0xf29a6b, hemi: 0xc4b5ff },
    music: 'academy',
  },
  emberfall: {
    name: 'Emberfall Wilds',
    regions: [
      { type: 'circle', x: X, z: 0, r: 20 },
      { type: 'rect', x0: X - 9, x1: X + 9, z0: 12, z1: 156 },
      { type: 'circle', x: X, z: 165, r: 15 },
    ],
    spawn: { x: X, z: -3, heading: 0 },
    atmosphere: { fog: 0x6a2a18, top: 0x240a10, mid: 0x8c3a2a, bottom: 0xffa050, hemi: 0xffb080 },
    music: 'ember',
  },
};
export function zoneAt(x) { return x > 350 ? 'emberfall' : 'academy'; }

// Named places inside a zone: they get their own title card and music.
export const AREAS = [
  { id: 'meadow', name: 'Millbrook Meadow', x0: 34, x1: 160, z0: -70, z1: 70, music: 'meadow' },
  { id: 'lane', name: 'Hollow Lane', x0: -12, x1: 12, z0: 30, z1: 170, music: 'academy' },
];
export function areaAt(x, z) {
  for (const a of AREAS) if (x > a.x0 && x < a.x1 && z > a.z0 && z < a.z1) return a;
  const zone = zoneAt(x);
  return { id: zone, name: ZONES[zone].name, music: ZONES[zone].music };
}

// Portals between zones. `unlock` = quest index needed to use it.
export const PORTALS = [
  { id: 'portal_academy', x: -26, z: 10, to: { x: X, z: -3, heading: 0 }, dest: 'Emberfall Wilds', unlock: 7 },
  { id: 'portal_ember', x: X, z: -17, to: { x: -13, z: 10, heading: Math.PI / 2 }, dest: 'Starfall Academy', unlock: 0 },
];

// Healing fountains.
export const FOUNTAINS = [
  { id: 'fountain', name: 'Wellspring', x: 0, z: 0, r: 5.2 },
  { id: 'spring_ember', name: 'Cooling Spring', x: X - 9, z: -7, r: 4.5 },
];
