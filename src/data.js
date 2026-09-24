// All of DarQuest's game content lives here: schools, spells, enemies, NPCs and quests.
// Tweak numbers here to rebalance the game without touching engine code.

export const SCHOOLS = {
  blaze:   { name: 'Blaze',   color: 0xff6a2b, css: '#ff6a2b', icon: '🔥', acc: 0.75, baseHp: 500,
             desc: 'Wild fire magic. Big hits and burning damage over time.' },
  frost:   { name: 'Frost',   color: 0x6fd3ff, css: '#6fd3ff', icon: '❄️', acc: 0.80, baseHp: 620,
             desc: 'Patient and tough. The most health and the best wards.' },
  tempest: { name: 'Tempest', color: 0xb46bff, css: '#b46bff', icon: '⚡', acc: 0.70, baseHp: 450,
             desc: 'Raw lightning. The hardest hitters, but they miss more often.' },
  verdant: { name: 'Verdant', color: 0x5fdc6a, css: '#5fdc6a', icon: '🌿', acc: 0.90, baseHp: 560,
             desc: 'Life and growth. Powerful healers who rarely miss.' },
  umbral:  { name: 'Umbral',  color: 0x9a8cff, css: '#9a8cff', icon: '💀', acc: 0.85, baseHp: 520,
             desc: 'Shadow magic that drains the life from foes to heal yourself.' },
  arcane:  { name: 'Arcane',  color: 0xf2c14e, css: '#f2c14e', icon: '✨', acc: 0.85, baseHp: 540,
             desc: 'The balance of all things. Blades, traps and hits on every foe.' },
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

export const ENEMIES = {
  gloomsprig: {
    name: 'Gloomsprig', school: 'umbral', level: 1, hp: 170, xp: 30, gold: [3, 8], model: 'sprig',
    spells: ['twig_lash', 'twig_lash', 'shade_bite'], resist: { umbral: 0.25 }, boost: { blaze: 0.15 },
    speed: 2.2, aggro: 6,
  },
  cinder_rat: {
    name: 'Cinder Rat', school: 'blaze', level: 2, hp: 230, xp: 40, gold: [5, 10], model: 'rat',
    spells: ['gnaw', 'gnaw', 'ember_imp', 'kindle'], resist: { blaze: 0.3 }, boost: { frost: 0.2 },
    speed: 3.0, aggro: 7,
  },
  frost_wisp: {
    name: 'Frostbitten Wisp', school: 'frost', level: 3, hp: 290, xp: 55, gold: [6, 12], model: 'wisp',
    spells: ['chill_touch', 'chill_touch', 'frost_sprite', 'glacial_ward'], resist: { frost: 0.3 }, boost: { blaze: 0.2 },
    speed: 2.4, aggro: 6,
  },
  hollow_knight: {
    name: 'Hollow Knight', school: 'umbral', level: 5, hp: 470, xp: 90, gold: [10, 20], model: 'knight',
    spells: ['rusted_slash', 'rusted_slash', 'hollow_strike', 'wither'], resist: { umbral: 0.3 }, boost: { verdant: 0.15 },
    speed: 2.0, aggro: 6,
  },
  storm_crow: {
    name: 'Storm Crow', school: 'tempest', level: 6, hp: 380, xp: 100, gold: [12, 22], model: 'crow',
    spells: ['peck_bolt', 'peck_bolt', 'thunder_sprite', 'lightning_bats', 'static_trap'], resist: { tempest: 0.3 }, boost: { frost: 0.15 },
    speed: 3.2, aggro: 8,
  },
  lord_hollowmere: {
    name: 'Lord Hollowmere', school: 'umbral', level: 8, hp: 1500, xp: 600, gold: [120, 160], model: 'boss', boss: true,
    spells: ['hollow_strike', 'hollow_strike', 'ghoul_claw', 'wither', 'banshee_wail', 'dread_hex', 'grave_mend'],
    resist: { umbral: 0.35 }, boost: {}, speed: 0, aggro: 6, powerPipChance: 0.5,
  },
};
for (const [id, e] of Object.entries(ENEMIES)) e.id = id;

// Where enemies live in the world. `r` = wander radius around the spawn point.
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
];

export const NPCS = {
  orvyn: {
    name: 'Headmaster Orvyn', title: 'Headmaster', x: 0, z: -22, robe: 0x3b2d7a, hat: 0x2a1f5c, trim: 0xf2c14e, beard: true,
    lines: ['Starfall Academy has stood for a thousand years. It will stand for a thousand more, if its students are brave.',
            'Magic is like a deck of cards, young one. What matters is how you play the hand you are dealt.'],
  },
  mirabel: {
    name: 'Mirabel Quill', title: 'Spell Tutor', x: -15, z: -6, robe: 0x2e7d6b, hat: 0x1f5c4f, trim: 0xe0f2e9, service: 'tutor',
    lines: ['Every level you gain earns you a Training Point. Bring them to me and I will teach you new spells.'],
  },
  fizz: {
    name: 'Madame Fizz', title: 'Potion Maker', x: 15, z: -6, robe: 0xa0346a, hat: 0x6e1f47, trim: 0xffc3e1, service: 'shop',
    lines: ['Bubble, bubble! A potion in your pack is worth two in the cauldron.'],
  },
  brannoc: {
    name: 'Captain Brannoc', title: 'Lane Watch', x: 7, z: 36, robe: 0x5a5f6b, hat: 0x383c45, trim: 0xc9a24a,
    lines: ['Hollow Lane was a cheerful street once. Now the shadows have moved in.'],
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
    done: 'You did it! Hollow Lane is free, and Starfall Academy has a true hero. This is only the beginning of your story, wizard…',
    reward: { xp: 800, gold: 200, tp: 1 },
  },
];

export const SHOP = {
  potion: { name: 'Healing Potion', price: 25, desc: 'Restores 50% of your health. Use it in battle or with the H key.' },
};

export const RULES = {
  handSize: 7,
  maxPips: 7,
  deckMax: 24,
  maxCopies: 6,
  maxPotions: 5,
  hpPerLevel: 50,
};
