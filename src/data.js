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

  // ---------- higher spells (levels 20-48): the second half of every school ----------
  meteor_strike:    { name: 'Meteor Strike',     school: 'blaze',   pips: 5, type: 'damage', min: 780,  max: 900,  target: 'one', level: 22 },
  sunfire_nova:     { name: 'Sunfire Nova',      school: 'blaze',   pips: 6, type: 'damage', min: 560,  max: 640,  target: 'all', level: 30 },
  dragonfire:       { name: 'Dragonfire',        school: 'blaze',   pips: 6, type: 'damage', min: 1100, max: 1260, target: 'one', dot: { total: 500, rounds: 3 }, level: 40 },
  phoenix_ascension:{ name: 'Phoenix Ascension', school: 'blaze',   pips: 7, type: 'damage', min: 900,  max: 1040, target: 'all', dot: { total: 400, rounds: 3 }, level: 48 },
  glacier_lance:    { name: 'Glacier Lance',     school: 'frost',   pips: 5, type: 'damage', min: 740,  max: 860,  target: 'one', level: 22 },
  frozen_fortress:  { name: 'Frozen Fortress',   school: 'frost',   pips: 0, type: 'shield', pct: 0.7, level: 30 },
  absolute_zero:    { name: 'Absolute Zero',     school: 'frost',   pips: 6, type: 'damage', min: 620,  max: 700,  target: 'all', level: 40 },
  frost_leviathan:  { name: 'Frost Leviathan',   school: 'frost',   pips: 7, type: 'damage', min: 1500, max: 1700, target: 'one', level: 48 },
  ball_lightning:   { name: 'Ball Lightning',    school: 'tempest', pips: 5, type: 'damage', min: 800,  max: 940,  target: 'one', level: 22 },
  chain_storm:      { name: 'Chain Storm',       school: 'tempest', pips: 6, type: 'damage', min: 600,  max: 700,  target: 'all', level: 30 },
  thunder_god:      { name: 'Thunder God',       school: 'tempest', pips: 6, type: 'damage', min: 1250, max: 1450, target: 'one', level: 40 },
  tempest_titan:    { name: 'Tempest Titan',     school: 'tempest', pips: 7, type: 'damage', min: 1050, max: 1200, target: 'all', level: 48 },
  bramble_titan:    { name: 'Bramble Titan',     school: 'verdant', pips: 5, type: 'damage', min: 700,  max: 800,  target: 'one', level: 22 },
  lifebloom:        { name: 'Lifebloom',         school: 'verdant', pips: 5, type: 'heal', amount: 1800, level: 30 },
  world_serpent:    { name: 'World Serpent',     school: 'verdant', pips: 6, type: 'damage', min: 1100, max: 1260, target: 'one', level: 40 },
  gaias_wrath:      { name: 'Gaia\'s Wrath',     school: 'verdant', pips: 7, type: 'damage', min: 950,  max: 1100, target: 'all', level: 48 },
  soul_leech:       { name: 'Soul Leech',        school: 'umbral',  pips: 5, type: 'drain', min: 700,  max: 800,  heal: 0.5, target: 'one', level: 22 },
  night_terror:     { name: 'Night Terror',      school: 'umbral',  pips: 6, type: 'drain', min: 520,  max: 600,  heal: 0.3, target: 'all', level: 30 },
  lich_lord:        { name: 'Lich Lord',         school: 'umbral',  pips: 6, type: 'drain', min: 1050, max: 1200, heal: 0.5, target: 'one', level: 40 },
  oblivion:         { name: 'Oblivion',          school: 'umbral',  pips: 7, type: 'drain', min: 900,  max: 1050, heal: 0.3, target: 'all', level: 48 },
  astral_lance:     { name: 'Astral Lance',      school: 'arcane',  pips: 5, type: 'damage', min: 760,  max: 880,  target: 'one', level: 22 },
  mana_surge:       { name: 'Mana Surge',        school: 'arcane',  pips: 0, type: 'blade', pct: 0.55, level: 30 },
  constellation:    { name: 'Constellation',     school: 'arcane',  pips: 6, type: 'damage', min: 620,  max: 720,  target: 'all', level: 40 },
  cosmic_titan:     { name: 'Cosmic Titan',      school: 'arcane',  pips: 7, type: 'damage', min: 1550, max: 1750, target: 'one', level: 48 },
  sanctuary:        { name: 'Sanctuary',         school: 'astral',  pips: 4, type: 'heal', amount: 1200, level: 20 },
  starshield:       { name: 'Starshield',        school: 'astral',  pips: 0, type: 'shield', pct: 0.6, level: 32 },
  empower:          { name: 'Empower',           school: 'astral',  pips: 0, type: 'blade', pct: 0.5, level: 44 },

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

  // ---------- Dragons (Chapter 3) ----------
  wyrm_bite:      { name: 'Wyrm Bite',       school: 'blaze',   pips: 1, type: 'damage', min: 170, max: 220, target: 'one', enemy: true },
  ember_spit:     { name: 'Ember Spit',      school: 'blaze',   pips: 2, type: 'damage', min: 230, max: 290, target: 'one', dot: { total: 120, rounds: 3 }, enemy: true },
  drake_charge:   { name: 'Drake Charge',    school: 'arcane',  pips: 3, type: 'damage', min: 320, max: 390, target: 'one', enemy: true },
  scorch_breath:  { name: 'Scorching Breath', school: 'blaze',  pips: 3, type: 'damage', min: 300, max: 360, target: 'one', dot: { total: 160, rounds: 3 }, enemy: true },
  wyvern_dive:    { name: 'Wyvern Dive',     school: 'tempest', pips: 3, type: 'damage', min: 340, max: 410, target: 'one', enemy: true },
  fireball_rain:  { name: 'Fireball Rain',   school: 'blaze',   pips: 3, type: 'damage', min: 290, max: 350, target: 'one', enemy: true },
  venom_sting:    { name: 'Venom Sting',     school: 'verdant', pips: 2, type: 'damage', min: 200, max: 260, target: 'one', dot: { total: 180, rounds: 3 }, enemy: true },
  cult_flame:     { name: 'Cultist Flame',   school: 'blaze',   pips: 2, type: 'damage', min: 250, max: 310, target: 'one', enemy: true },
  dragon_blessing:{ name: 'Dragon Blessing', school: 'blaze',   pips: 0, type: 'blade', pct: 0.35, enemy: true },
  cult_mend:      { name: 'Cult Mend',       school: 'umbral',  pips: 3, type: 'heal', amount: 700, enemy: true },
  dragon_claw:    { name: 'Dragon Claw',     school: 'blaze',   pips: 3, type: 'damage', min: 430, max: 510, target: 'one', enemy: true },
  tail_sweep:     { name: 'Tail Sweep',      school: 'arcane',  pips: 3, type: 'damage', min: 390, max: 460, target: 'one', enemy: true },
  inferno_breath: { name: 'Inferno Breath',  school: 'blaze',   pips: 5, type: 'damage', min: 640, max: 760, target: 'one', dot: { total: 300, rounds: 3 }, enemy: true },
  sky_fire:       { name: 'Sky Fire',        school: 'blaze',   pips: 4, type: 'damage', min: 440, max: 520, target: 'one', enemy: true },
  landing_quake:  { name: 'Landing Quake',   school: 'arcane',  pips: 4, type: 'damage', min: 480, max: 560, target: 'one', enemy: true },

  // ---------- Glacierreach (Chapter 4) ----------
  frost_bite:     { name: 'Frost Bite',      school: 'frost',   pips: 1, type: 'damage', min: 230, max: 290, target: 'one', enemy: true },
  howl_of_winter: { name: 'Howl of Winter',  school: 'frost',   pips: 0, type: 'blade', pct: 0.4, enemy: true },
  soul_chill:     { name: 'Soul Chill',      school: 'frost',   pips: 2, type: 'drain', min: 260, max: 320, heal: 0.5, target: 'one', enemy: true },
  avalanche:      { name: 'Avalanche',       school: 'arcane',  pips: 3, type: 'damage', min: 420, max: 500, target: 'one', enemy: true },
  yeti_smash:     { name: 'Yeti Smash',      school: 'arcane',  pips: 2, type: 'damage', min: 360, max: 430, target: 'one', enemy: true },
  glacier_slam:   { name: 'Glacier Slam',    school: 'frost',   pips: 3, type: 'damage', min: 440, max: 520, target: 'one', enemy: true },
  frost_breath:   { name: 'Frost Breath',    school: 'frost',   pips: 4, type: 'damage', min: 520, max: 620, target: 'one', dot: { total: 200, rounds: 3 }, enemy: true },
  ice_lance:      { name: 'Ice Lance',       school: 'frost',   pips: 3, type: 'damage', min: 480, max: 560, target: 'one', enemy: true },
  blizzard_storm: { name: 'Blizzard Storm',  school: 'frost',   pips: 5, type: 'damage', min: 560, max: 660, target: 'one', enemy: true },
  frozen_tomb:    { name: 'Frozen Tomb',     school: 'frost',   pips: 0, type: 'shield', pct: 0.6, enemy: true },
  winters_mend:   { name: 'Winter\'s Mend',  school: 'frost',   pips: 3, type: 'heal', amount: 1600, enemy: true },

  // ---------- the Hollow Undercroft ----------
  soul_rend:      { name: 'Soul Rend',       school: 'umbral',  pips: 3, type: 'damage', min: 150, max: 190, target: 'one', enemy: true },
  bone_storm:     { name: 'Bone Storm',      school: 'umbral',  pips: 4, type: 'damage', min: 170, max: 210, target: 'one', enemy: true },
  grave_nova:     { name: 'Grave Nova',      school: 'umbral',  pips: 4, type: 'damage', min: 190, max: 230, target: 'one', enemy: true },
  warden_mend:    { name: 'Warden\'s Mend',  school: 'umbral',  pips: 3, type: 'heal', amount: 500, enemy: true },

  // ---------- Stormspire (Chapter 5) ----------
  gust:            { name: 'Gust',             school: 'tempest', pips: 1, type: 'damage', min: 250, max: 310, target: 'one', enemy: true },
  static_charge:   { name: 'Static Charge',    school: 'tempest', pips: 0, type: 'blade', pct: 0.4, enemy: true },
  thunder_stomp:   { name: 'Thunder Stomp',    school: 'tempest', pips: 3, type: 'damage', min: 440, max: 520, target: 'one', enemy: true },
  stag_charge:     { name: 'Stag Charge',      school: 'tempest', pips: 3, type: 'damage', min: 420, max: 500, target: 'one', enemy: true },
  chain_lightning: { name: 'Chain Lightning',  school: 'tempest', pips: 3, type: 'damage', min: 480, max: 560, target: 'one', enemy: true },
  conductor_pulse: { name: 'Conductor Pulse',  school: 'tempest', pips: 4, type: 'damage', min: 520, max: 600, target: 'one', enemy: true },
  pirate_shot:     { name: 'Pirate Shot',      school: 'tempest', pips: 2, type: 'damage', min: 320, max: 380, target: 'one', enemy: true },
  storm_bomb:      { name: 'Storm Bomb',       school: 'tempest', pips: 4, type: 'damage', min: 520, max: 600, target: 'one', enemy: true },
  sky_dive:        { name: 'Sky Dive',         school: 'tempest', pips: 4, type: 'damage', min: 560, max: 640, target: 'one', enemy: true },
  thunderclap:     { name: 'Thunderclap',      school: 'tempest', pips: 3, type: 'damage', min: 500, max: 580, target: 'one', enemy: true },
  storm_call:      { name: 'Storm Call',       school: 'tempest', pips: 5, type: 'damage', min: 620, max: 720, target: 'one', enemy: true },
  lightning_strike:{ name: 'Lightning Strike', school: 'tempest', pips: 4, type: 'damage', min: 520, max: 600, target: 'one', enemy: true },
  raider_grog:     { name: 'Raider\'s Grog',   school: 'verdant', pips: 3, type: 'heal', amount: 1400, enemy: true },

  // ---------- Thornwood (Chapter 6) ----------
  thorn_lash:      { name: 'Thorn Lash',       school: 'verdant', pips: 2, type: 'damage', min: 380, max: 440, target: 'one', enemy: true },
  pounce:          { name: 'Pounce',           school: 'verdant', pips: 3, type: 'damage', min: 480, max: 560, target: 'one', enemy: true },
  pixie_bolt:      { name: 'Pixie Bolt',       school: 'verdant', pips: 1, type: 'damage', min: 300, max: 360, target: 'one', enemy: true },
  glamour:         { name: 'Glamour',          school: 'verdant', pips: 0, type: 'weakness', pct: 0.3, enemy: true },
  spore_cloud:     { name: 'Spore Cloud',      school: 'verdant', pips: 3, type: 'damage', min: 420, max: 480, target: 'one', dot: { total: 360, rounds: 3 }, enemy: true },
  treant_slam:     { name: 'Treant Slam',      school: 'verdant', pips: 3, type: 'damage', min: 540, max: 620, target: 'one', enemy: true },
  root_snare:      { name: 'Root Snare',       school: 'verdant', pips: 4, type: 'damage', min: 580, max: 660, target: 'one', enemy: true },
  blight_bite:     { name: 'Blight Bite',      school: 'umbral',  pips: 2, type: 'drain', min: 440, max: 500, heal: 0.5, target: 'one', enemy: true },
  blight_nova:     { name: 'Blight Nova',      school: 'umbral',  pips: 4, type: 'damage', min: 600, max: 680, target: 'one', enemy: true },
  mother_wrath:    { name: 'Mother\'s Wrath',  school: 'verdant', pips: 5, type: 'damage', min: 720, max: 820, target: 'one', enemy: true },
  pod_mend:        { name: 'Seed Mend',        school: 'verdant', pips: 2, type: 'heal', amount: 1800, enemy: true },

  // ---------- the Hollow Deep (Chapter 7) ----------
  sorrow_wail:     { name: 'Sorrow Wail',      school: 'umbral',  pips: 2, type: 'drain', min: 470, max: 530, heal: 0.5, target: 'one', enemy: true },
  bone_cleave:     { name: 'Bone Cleave',      school: 'umbral',  pips: 2, type: 'damage', min: 500, max: 560, target: 'one', enemy: true },
  bone_spear:      { name: 'Bone Spear',       school: 'umbral',  pips: 3, type: 'damage', min: 580, max: 660, target: 'one', enemy: true },
  bone_prison:     { name: 'Bone Prison',      school: 'umbral',  pips: 4, type: 'damage', min: 640, max: 720, target: 'one', enemy: true },
  colossus_stomp:  { name: 'Colossus Stomp',   school: 'arcane',  pips: 4, type: 'damage', min: 680, max: 760, target: 'one', enemy: true },
  templar_smite:   { name: 'Templar Smite',    school: 'arcane',  pips: 3, type: 'damage', min: 620, max: 700, target: 'one', enemy: true },
  pale_ward:       { name: 'Pale Ward',        school: 'arcane',  pips: 0, type: 'shield', pct: 0.5, enemy: true },
  anchor_pulse:    { name: 'Anchor Pulse',     school: 'umbral',  pips: 1, type: 'damage', min: 320, max: 380, target: 'one', enemy: true },
  pale_bolt:       { name: 'Pale Bolt',        school: 'umbral',  pips: 3, type: 'damage', min: 720, max: 820, target: 'one', enemy: true },
  void_rain:       { name: 'Void Rain',        school: 'umbral',  pips: 5, type: 'damage', min: 780, max: 880, target: 'one', enemy: true },
  soul_drain:      { name: 'Soul Drain',       school: 'umbral',  pips: 3, type: 'drain', min: 660, max: 740, heal: 0.5, target: 'one', enemy: true },
  unmaking:        { name: 'The Unmaking',     school: 'umbral',  pips: 5, type: 'damage', min: 950, max: 1050, target: 'one', enemy: true },

  // ---------- Pet spells (cast for free when a pet "may-casts") ----------
  pet_mend:       { name: 'Pet: Mossy Mend', school: 'verdant', pips: 0, type: 'heal', amount: 140, pet: true },
  pet_flame:      { name: 'Pet: Drake Flame', school: 'blaze',  pips: 0, type: 'damage', min: 100, max: 150, target: 'one', pet: true },
  pet_zap:        { name: 'Pet: Beetle Zap', school: 'tempest', pips: 0, type: 'damage', min: 110, max: 170, target: 'one', pet: true },
  pet_ward:       { name: 'Pet: Frost Ward', school: 'frost',   pips: 0, type: 'shield', pct: 0.35, pet: true },
  pet_edge:       { name: 'Pet: Owl Edge',   school: 'arcane',  pips: 0, type: 'blade', pct: 0.25, pet: true },
  pet_leech:      { name: 'Pet: Bat Leech',  school: 'umbral',  pips: 0, type: 'drain', min: 80, max: 120, heal: 0.6, target: 'one', pet: true },
  pet_void:       { name: 'Pet: Void Gaze',  school: 'umbral',  pips: 0, type: 'damage', min: 150, max: 210, target: 'one', pet: true },
  pet_aurora:     { name: 'Pet: Aurora Mend', school: 'frost',  pips: 0, type: 'heal', amount: 260, pet: true },
  pet_bloom:      { name: 'Pet: Bloom',      school: 'verdant', pips: 0, type: 'heal', amount: 340, pet: true },
  pet_bolt:       { name: 'Pet: Thunder Peep', school: 'tempest', pips: 0, type: 'damage', min: 240, max: 320, target: 'one', pet: true },
  pet_skyfire:    { name: 'Pet: Skyfire',    school: 'tempest', pips: 0, type: 'damage', min: 200, max: 280, target: 'one', pet: true },
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
    drops: [{ item: 'hollowmere_locket', chance: 1 }, { item: 'hollow_blade', chance: 0.6 }, { item: 'knightsilk_robe', chance: 0.4 }, { item: 'hollow_signet', chance: 0.35 }, { pet: 'bat_familiar', chance: 0.25 }],
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
    drops: [{ item: 'cinderguard_robe', chance: 0.1 }, { item: 'ember_heart', chance: 0.07 }, { item: 'ember_mantle', chance: 0.05 }],
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
    drops: [{ item: 'molten_crown', chance: 1 }, { item: 'robe_of_pyrrhon', chance: 0.6 }, { item: 'kings_scepter', chance: 0.5 }, { item: 'molten_band', chance: 0.4 }, { item: 'grimoire_of_ash', chance: 0.3 }, { pet: 'ember_drake', chance: 1 }],
  },

  // ---------------- night-only ----------------
  lane_wraith: {
    name: 'Lane Wraith', school: 'umbral', level: 6, hp: 540, xp: 150, gold: [14, 24], model: 'shade', night: true,
    spells: ['shade_bite', 'shade_bite', 'wither'], resist: { umbral: 0.4 }, boost: { arcane: 0.2 },
    speed: 2.6, aggro: 8,
    drops: [{ item: 'starweave_cloak', chance: 0.05 }, { mat: 'moonleaf', chance: 0.4, n: 2 }],
  },
  meadow_wisp: {
    name: 'Will-o\'-the-Wisp', school: 'verdant', level: 3, hp: 280, xp: 70, gold: [6, 12], model: 'meadow_wisp', night: true,
    spells: ['twig_lash', 'chill_touch'], resist: { verdant: 0.3 }, boost: { blaze: 0.2 },
    speed: 2.4, aggro: 6,
    drops: [{ mat: 'glowcap', chance: 0.3 }, { mat: 'sunpetal', chance: 0.3 }],
  },

  // ---------------- Chapter 3: Dragonspire Peaks ----------------
  wyrmling: {
    name: 'Wyrmling', school: 'blaze', level: 14, hp: 950, xp: 280, gold: [22, 36], model: 'wyrmling', dragon: true,
    spells: ['wyrm_bite', 'wyrm_bite', 'ember_spit'], resist: { blaze: 0.35 }, boost: { frost: 0.2 },
    speed: 3.8, aggro: 8,
    drops: [{ mat: 'dragon_scale', chance: 0.25 }, { item: 'wyrmscale_hood', chance: 0.05 }],
  },
  drake: {
    name: 'Bone Drake', school: 'arcane', level: 16, hp: 1500, xp: 380, gold: [28, 44], model: 'drake_foe', dragon: true, soul: 0.2,
    spells: ['drake_charge', 'scorch_breath', 'wyrm_bite'], resist: { arcane: 0.3, blaze: 0.2 }, boost: { tempest: 0.2 },
    speed: 2.8, aggro: 8,
    drops: [{ mat: 'dragon_scale', chance: 0.5 }, { mat: 'dragon_bone', chance: 0.4 }, { item: 'drakehide_robe', chance: 0.06 }],
  },
  dragon_cultist: {
    name: 'Scaled Cultist', school: 'umbral', level: 17, hp: 1150, xp: 400, gold: [30, 50], model: 'cultist',
    spells: ['cult_flame', 'cult_flame', 'dragon_blessing', 'cult_mend', 'dread_hex'], resist: { umbral: 0.3 }, boost: { arcane: 0.15 },
    speed: 2.2, aggro: 7,
    drops: [{ item: 'dragonbone_wand', chance: 0.06 }, { item: 'elder_codex', chance: 0.03 }, { mat: 'dragons_tongue', chance: 0.3 }],
  },
  wyvern: {
    name: 'Stormwing Wyvern', school: 'tempest', level: 18, hp: 1350, xp: 450, gold: [32, 52], model: 'wyvern', dragon: true, soul: 0.35,
    spells: ['wyvern_dive', 'fireball_rain', 'venom_sting'], resist: { tempest: 0.35 }, boost: { umbral: 0.2 },
    speed: 3.4, aggro: 9,
    drops: [{ mat: 'dragon_scale', chance: 0.5 }, { item: 'wyvern_wing_boots', chance: 0.06 }, { item: 'wyvern_cape', chance: 0.05 }, { item: 'storm_orb', chance: 0.04 }, { pet: 'stormwing', chance: 0.02 }],
  },
  // ---------------- the Hollow Undercroft (scaled to your level when you enter) ----------------
  pale_warden: {
    name: 'Morvain, the Pale Warden', school: 'umbral', level: 12, hp: 2600, xp: 1500, gold: [200, 260], model: 'pale_warden', boss: true, dungeon: true,
    spells: ['soul_rend', 'bone_storm', 'soul_rend', 'grave_nova', 'wither', 'warden_mend'],
    resist: { umbral: 0.4 }, boost: { arcane: 0.2 }, speed: 1.6, aggro: 16, powerPipChance: 0.5,
    drops: [],
  },

  // ---------------- Chapter 7: the Hollow Deep ----------------
  sorrowshade: {
    name: 'Sorrowshade', school: 'umbral', level: 42, hp: 4800, xp: 2300, gold: [130, 180], model: 'sorrowshade',
    spells: ['sorrow_wail', 'sorrow_wail', 'bone_spear'], resist: { umbral: 0.45 }, boost: { arcane: 0.25 },
    speed: 2.8, aggro: 9,
    drops: [{ item: 'deepwalker_hood', chance: 0.05 }, { mat: 'glowcap', chance: 0.4, n: 2 }],
  },
  deathless: {
    name: 'Deathless Legionnaire', school: 'umbral', level: 43, hp: 5600, xp: 2450, gold: [140, 190], model: 'deathless',
    spells: ['bone_cleave', 'bone_cleave', 'pale_ward'], resist: { umbral: 0.45, arcane: 0.2 }, boost: { blaze: 0.25 },
    speed: 2.6, aggro: 8,
    drops: [{ item: 'deepwalker_boots', chance: 0.05 }, { mat: 'silver_ore', chance: 0.4, n: 2 }],
  },
  bone_magus: {
    name: 'Bone Magus', school: 'umbral', level: 44, hp: 4600, xp: 2550, gold: [150, 200], model: 'bone_magus',
    spells: ['bone_spear', 'bone_prison', 'bone_spear', 'sorrow_wail'], resist: { umbral: 0.45 }, boost: { arcane: 0.3 },
    speed: 2.4, aggro: 10,
    drops: [{ item: 'soulreaver_staff', chance: 0.05 }, { item: 'deep_sigil', chance: 0.04 }],
  },
  bone_colossus: {
    name: 'Bone Colossus', school: 'arcane', level: 45, hp: 9000, xp: 3600, gold: [220, 300], model: 'bone_colossus', elite: 'colossus',
    spells: ['colossus_stomp', 'bone_cleave', 'colossus_stomp'], resist: { arcane: 0.4, umbral: 0.3 }, boost: { verdant: 0.25 },
    speed: 1.6, aggro: 7,
    drops: [{ item: 'deepwalker_robe', chance: 0.12 }, { mat: 'diamond', chance: 0.25 }],
  },
  pale_templar: {
    name: 'Pale Templar', school: 'arcane', level: 46, hp: 6200, xp: 2800, gold: [170, 230], model: 'pale_templar',
    spells: ['templar_smite', 'bone_cleave', 'pale_ward', 'templar_smite'], resist: { arcane: 0.45, umbral: 0.2 }, boost: { umbral: 0.25 },
    speed: 2.6, aggro: 9,
    drops: [{ item: 'deepwalker_robe', chance: 0.05 }, { mat: 'gold_ore', chance: 0.4, n: 2 }],
  },
  soul_anchor: {
    name: 'Soul Anchor', school: 'umbral', level: 48, hp: 2600, xp: 400, gold: [20, 40], model: 'soul_anchor',
    spells: ['anchor_pulse'], resist: {}, boost: { arcane: 0.3, blaze: 0.2 }, speed: 0, aggro: 40, drops: [],
  },
  malvoren: {
    name: 'Malvoren, the Pale Magister', school: 'umbral', level: 50, hp: 42000, xp: 30000, gold: [5000, 6500], model: 'malvoren', boss: true,
    spells: ['pale_bolt', 'void_rain', 'soul_drain', 'pale_bolt', 'unmaking', 'pale_ward'],
    resist: { umbral: 0.5, arcane: 0.3 }, boost: { blaze: 0.15, verdant: 0.15 }, speed: 1.8, aggro: 20, powerPipChance: 0.65,
    flySpell: 'void_rain', flyColor: 0xd06aff, flyMsg: 'Malvoren rises into the air on wings of shadow! Dodge the void, or use Dragonrend to pull him down.',
    phases: [
      { at: 0.75, say: 'You think you can unmake ME? I wrote the rules you fight by! Anchors, hold my ward!', summon: ['soul_anchor', 'soul_anchor', 'soul_anchor', 'soul_anchor'], event: 'anchors' },
      { at: 0.5, say: 'Then watch the sky fall on you.', fly: { dur: 16, radius: 13 }, blade: 0.3 },
      { at: 0.25, say: 'ENOUGH! Legion, rise! I will unmake everything!', summon: ['deathless', 'bone_magus'], blade: 0.5, cast: 'unmaking' },
    ],
    reactions: [{ school: 'arcane', say: 'Arcane? I taught Orvyn that spell!', cast: 'pale_bolt' }],
    drops: [{ item: 'malvorens_crown', chance: 1 }, { item: 'magisters_staff', chance: 0.7 }, { item: 'pale_mantle', chance: 0.6 }, { item: 'grimoire_of_ages', chance: 0.5 }, { item: 'void_ring', chance: 0.5 }, { mat: 'diamond', chance: 1, n: 8 }, { pet: 'pale_wisp', chance: 0.7 }],
  },

  // ---------------- Chapter 6: Thornwood ----------------
  briar_stalker: {
    name: 'Briar Stalker', school: 'verdant', level: 34, hp: 3800, xp: 1500, gold: [90, 130], model: 'briar_stalker',
    spells: ['thorn_lash', 'thorn_lash', 'pounce'], resist: { verdant: 0.4 }, boost: { blaze: 0.25 },
    speed: 4.4, aggro: 9,
    drops: [{ item: 'rootwalker_boots', chance: 0.05 }, { mat: 'moonleaf', chance: 0.35, n: 2 }],
  },
  pixie: {
    name: 'Pixie Trickster', school: 'verdant', level: 35, hp: 3000, xp: 1550, gold: [95, 140], model: 'pixie',
    spells: ['pixie_bolt', 'pixie_bolt', 'glamour', 'pixie_bolt'], resist: { verdant: 0.4, arcane: 0.2 }, boost: { blaze: 0.25 },
    speed: 3.6, aggro: 10, evade: 0.12,
    drops: [{ item: 'thornweave_hood', chance: 0.05 }, { mat: 'sunpetal', chance: 0.35, n: 2 }],
  },
  spore_shambler: {
    name: 'Spore Shambler', school: 'verdant', level: 36, hp: 4600, xp: 1700, gold: [100, 145], model: 'spore_shambler',
    spells: ['spore_cloud', 'thorn_lash', 'spore_cloud'], resist: { verdant: 0.4, umbral: 0.2 }, boost: { blaze: 0.3 },
    speed: 2.2, aggro: 7,
    drops: [{ item: 'verdant_heart', chance: 0.04 }, { mat: 'glowcap', chance: 0.5, n: 3 }],
  },
  treant: {
    name: 'Blightbark Treant', school: 'verdant', level: 37, hp: 5600, xp: 1850, gold: [110, 160], model: 'treant',
    spells: ['treant_slam', 'root_snare', 'thorn_lash'], resist: { verdant: 0.5 }, boost: { blaze: 0.35 },
    speed: 1.9, aggro: 7,
    drops: [{ item: 'barkskin_robe', chance: 0.05 }, { mat: 'elder_logs', chance: 0.4, n: 2 }],
  },
  blight_horror: {
    name: 'Blight Horror', school: 'umbral', level: 38, hp: 5200, xp: 2000, gold: [120, 170], model: 'blight_horror',
    spells: ['blight_bite', 'blight_nova', 'blight_bite'], resist: { umbral: 0.4, verdant: 0.3 }, boost: { arcane: 0.25, blaze: 0.2 },
    speed: 2.6, aggro: 8,
    drops: [{ item: 'heartwood_staff', chance: 0.05 }, { mat: 'diamond', chance: 0.1 }],
  },
  blight_pod: {
    name: 'Blight Pod', school: 'verdant', level: 38, hp: 1600, xp: 300, gold: [10, 20], model: 'blight_pod',
    spells: ['pod_mend'], resist: {}, boost: { blaze: 0.5 }, speed: 0, aggro: 40, drops: [],
  },
  thornmother: {
    name: 'The Thornmother', school: 'verdant', level: 40, hp: 28000, xp: 18000, gold: [2400, 3200], model: 'thornmother', boss: true,
    spells: ['mother_wrath', 'treant_slam', 'root_snare', 'blight_nova', 'thorn_lash'],
    resist: { verdant: 0.55, umbral: 0.3 }, boost: { blaze: 0.3 }, speed: 1.4, aggro: 18, powerPipChance: 0.6,
    phases: [
      { at: 0.75, say: 'Grow, my seedlings! Feed your mother!', summon: ['blight_pod', 'blight_pod', 'blight_pod'] },
      { at: 0.5, say: 'The Magister\'s blight is my sap now. It will cover the world!', summon: ['treant'], blade: 0.3 },
      { at: 0.25, say: 'ROOTS! THORNS! DEVOUR THEM!', summon: ['blight_pod', 'blight_pod', 'blight_pod'], blade: 0.45 },
    ],
    reactions: [{ school: 'blaze', say: 'FIRE? Not in MY forest!', cast: 'root_snare' }],
    drops: [{ item: 'thornmother_crown', chance: 1 }, { item: 'blossom_mantle', chance: 0.6 }, { item: 'seed_of_life', chance: 0.5 }, { item: 'briar_band', chance: 0.4 }, { mat: 'diamond', chance: 1, n: 5 }, { pet: 'sproutling', chance: 0.6 }],
  },

  // ---------------- Chapter 5: Stormspire ----------------
  gale_sprite: {
    name: 'Gale Sprite', school: 'tempest', level: 28, hp: 2300, xp: 980, gold: [60, 90], model: 'gale_sprite',
    spells: ['gust', 'gust', 'static_charge', 'chain_lightning'], resist: { tempest: 0.4 }, boost: { verdant: 0.25 },
    speed: 4.2, aggro: 9,
    drops: [{ item: 'windstep_boots', chance: 0.05 }, { mat: 'glowcap', chance: 0.3, n: 2 }],
  },
  stormhorn: {
    name: 'Stormhorn Stag', school: 'tempest', level: 29, hp: 3300, xp: 1080, gold: [65, 95], model: 'stormhorn',
    spells: ['stag_charge', 'thunder_stomp', 'gust'], resist: { tempest: 0.4 }, boost: { verdant: 0.25 },
    speed: 3.6, aggro: 8,
    drops: [{ item: 'stormcaller_hood', chance: 0.05 }, { mat: 'moonwood_logs', chance: 0.3, n: 2 }],
  },
  tempest_golem: {
    name: 'Tempest Golem', school: 'tempest', level: 31, hp: 4200, xp: 1250, gold: [75, 110], model: 'tempest_golem',
    spells: ['conductor_pulse', 'chain_lightning', 'static_charge'], resist: { tempest: 0.5, arcane: 0.2 }, boost: { verdant: 0.3 },
    speed: 1.9, aggro: 6,
    drops: [{ item: 'thunderstaff', chance: 0.05 }, { mat: 'starmetal_ore', chance: 0.4, n: 2 }, { mat: 'diamond', chance: 0.08 }],
  },
  skyraider: {
    name: 'Skyraider', school: 'tempest', level: 30, hp: 3000, xp: 1150, gold: [90, 130], model: 'skyraider',
    spells: ['pirate_shot', 'pirate_shot', 'storm_bomb', 'raider_grog'], resist: { tempest: 0.3 }, boost: { verdant: 0.2 },
    speed: 3, aggro: 9,
    drops: [{ item: 'stormcaller_robe', chance: 0.05 }, { item: 'storm_sigil', chance: 0.04 }],
  },
  thunder_roc: {
    name: 'Thunder Roc', school: 'tempest', level: 32, hp: 4400, xp: 1400, gold: [80, 120], model: 'thunder_roc',
    spells: ['sky_dive', 'chain_lightning', 'gust'], resist: { tempest: 0.5 }, boost: { verdant: 0.3 },
    speed: 3.4, aggro: 10,
    drops: [{ item: 'stormfeather_ring', chance: 0.05 }, { pet: 'thunderchick', chance: 0.02 }],
  },
  voltaris: {
    name: 'Voltaris, the Storm Herald', school: 'tempest', level: 35, hp: 22000, xp: 13000, gold: [1800, 2400], model: 'voltaris', boss: true,
    spells: ['chain_lightning', 'thunderclap', 'storm_call', 'chain_lightning', 'gust'],
    resist: { tempest: 0.55 }, boost: { verdant: 0.25 }, speed: 2.2, aggro: 18, powerPipChance: 0.6,
    flySpell: 'lightning_strike', flyColor: 0x9ff0ff, flyMsg: 'Voltaris rides the storm! Dodge the lightning, or use Dragonrend to drag him down.',
    phases: [
      { at: 0.75, say: 'The Magister gave me the sky. You will never touch it!', fly: { dur: 15, radius: 14 } },
      { at: 0.5, say: 'Winds! Tear this wizard from my island!', summon: ['gale_sprite', 'gale_sprite'], blade: 0.3 },
      { at: 0.25, say: 'I AM THE STORM!', fly: { dur: 14, radius: 12 }, blade: 0.45 },
    ],
    reactions: [{ school: 'verdant', say: 'Roots and mud? Pathetic!', cast: 'thunderclap' }],
    drops: [{ item: 'crown_of_thunder', chance: 1 }, { item: 'voltaris_mantle', chance: 0.6 }, { item: 'heart_of_the_storm', chance: 0.5 }, { item: 'stormfeather_ring', chance: 0.4 }, { mat: 'diamond', chance: 1, n: 4 }, { pet: 'thunderchick', chance: 0.6 }],
  },

  // ---------------- Chapter 4: Glacierreach ----------------
  snow_wolf: {
    name: 'Snowfang Wolf', school: 'frost', level: 22, hp: 1900, xp: 620, gold: [40, 60], model: 'snow_wolf',
    spells: ['frost_bite', 'frost_bite', 'howl_of_winter'], resist: { frost: 0.4 }, boost: { blaze: 0.25 },
    speed: 4.4, aggro: 9,
    drops: [{ item: 'rimewalker_boots', chance: 0.05 }, { mat: 'frostbloom', chance: 0.25 }],
  },
  frost_wraith: {
    name: 'Frost Wraith', school: 'frost', level: 23, hp: 1800, xp: 680, gold: [42, 64], model: 'frost_wraith',
    spells: ['soul_chill', 'soul_chill', 'ice_lance'], resist: { frost: 0.4, umbral: 0.2 }, boost: { blaze: 0.2 },
    speed: 2.8, aggro: 8,
    drops: [{ item: 'frostweave_hood', chance: 0.05 }, { mat: 'raw_frostcod', chance: 0.3 }],
  },
  yeti: {
    name: 'Mountain Yeti', school: 'arcane', level: 24, hp: 3000, xp: 780, gold: [50, 75], model: 'yeti',
    spells: ['yeti_smash', 'yeti_smash', 'avalanche', 'howl_of_winter'], resist: { frost: 0.4, arcane: 0.2 }, boost: { blaze: 0.25 },
    speed: 2.6, aggro: 8,
    drops: [{ item: 'glacial_robe', chance: 0.05 }, { mat: 'starmetal_ore', chance: 0.3, n: 2 }],
  },
  ice_golem: {
    name: 'Rime Golem', school: 'frost', level: 25, hp: 3400, xp: 820, gold: [55, 80], model: 'ice_golem',
    spells: ['glacier_slam', 'glacier_slam', 'frozen_tomb', 'ice_lance'], resist: { frost: 0.5, arcane: 0.2 }, boost: { blaze: 0.3 },
    speed: 1.8, aggro: 6,
    drops: [{ item: 'icicle_staff', chance: 0.05 }, { mat: 'diamond', chance: 0.08 }],
  },
  frost_drake: {
    name: 'Frost Dragon', school: 'frost', level: 26, hp: 3600, xp: 900, gold: [60, 90], model: 'frost_drake', dragon: true, soul: 0.45,
    spells: ['frost_breath', 'glacier_slam', 'frost_bite'], resist: { frost: 0.5 }, boost: { blaze: 0.3 },
    speed: 3, aggro: 10,
    drops: [{ mat: 'dragon_scale', chance: 0.6, n: 2 }, { item: 'aurora_cloak', chance: 0.05 }, { pet: 'aurora_wisp', chance: 0.02 }],
  },
  sylvara: {
    name: 'Queen Sylvara of the Frozen Crown', school: 'frost', level: 28, hp: 16000, xp: 9000, gold: [1200, 1600], model: 'frost_queen', boss: true,
    spells: ['ice_lance', 'blizzard_storm', 'glacier_slam', 'ice_lance', 'winters_mend', 'frozen_tomb'],
    resist: { frost: 0.55 }, boost: { blaze: 0.25 }, speed: 2, aggro: 18, powerPipChance: 0.6,
    phases: [
      { at: 0.7, say: 'You dare trespass in my eternal winter? KNEEL!', summon: ['ice_golem'], shield: 0.4 },
      { at: 0.45, say: 'My dragons! Tear them apart!', summon: ['frost_drake', 'frost_drake'] },
      { at: 0.2, say: 'The Magister promised me forever... I will not melt!', blade: 0.5, heal: 2500 },
    ],
    reactions: [{ school: 'blaze', say: 'FIRE? In MY palace?!', cast: 'blizzard_storm' }],
    drops: [{ item: 'crown_of_winter', chance: 1 }, { item: 'sylvaras_mirror', chance: 0.6 }, { item: 'aurora_cloak', chance: 0.45 }, { mat: 'diamond', chance: 1, n: 3 }, { pet: 'aurora_wisp', chance: 0.6 }],
  },
  vorathrax: {
    name: 'Vorathrax, the Sky Tyrant', school: 'blaze', level: 22, hp: 9500, xp: 4000, gold: [600, 800], model: 'elder_dragon', boss: true, dragon: true, soul: 1, souls: 3,
    spells: ['dragon_claw', 'tail_sweep', 'inferno_breath', 'dragon_claw', 'magma_mend'],
    resist: { blaze: 0.45 }, boost: { frost: 0.25 }, speed: 2.4, aggro: 16, powerPipChance: 0.6,
    phases: [
      { at: 0.72, say: 'You crawl, little wizard. I RULE THE SKY!', fly: { dur: 16, radius: 13 } },
      { at: 0.45, say: 'Wyrmlings! To your mother!', summon: ['wyrmling', 'wyrmling'], blade: 0.3 },
      { at: 0.25, say: 'Enough! I will burn this mountain to ash!', fly: { dur: 14, radius: 11 }, blade: 0.4 },
    ],
    reactions: [{ school: 'frost', say: 'Frost?! My fire will swallow your cold!', cast: 'tail_sweep' }],
    drops: [{ item: 'crown_of_the_sky', chance: 1 }, { item: 'tyrant_robe', chance: 0.6 }, { item: 'fang_of_vorathrax', chance: 0.5 }, { item: 'dragonwing_cloak', chance: 0.45 }, { item: 'tyrant_ring', chance: 0.35 }, { item: 'eye_of_vorathrax', chance: 0.3 }, { mat: 'dragon_scale', chance: 1, n: 6 }, { mat: 'dragon_bone', chance: 1, n: 3 }, { pet: 'stormwing', chance: 0.5 }],
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
  wyrmling:        { ember_spit: { shape: 'circle', r: 2.4, dur: 1 } },
  drake:           { drake_charge: { shape: 'line', len: 11, width: 2.6, dur: 1.1, charge: true }, scorch_breath: { shape: 'cone', r: 9, angle: 0.95, dur: 1.2, breath: true } },
  wyvern:          { wyvern_dive: { shape: 'line', len: 14, width: 2.6, dur: 1.2, charge: true }, fireball_rain: { shape: 'circle', r: 2.8, count: 3, spread: 5, dur: 1.3 } },
  yeti:            { avalanche: { shape: 'circle', r: 3.6, count: 3, spread: 5, dur: 1.3 }, yeti_smash: { shape: 'cone', r: 5, angle: 1.4, dur: 0.9 } },
  ice_golem:       { glacier_slam: { shape: 'circle', at: 'self', r: 5, dur: 1.2 }, ice_lance: { shape: 'line', len: 14, width: 2, dur: 1 } },
  frost_wraith:    { ice_lance: { shape: 'line', len: 14, width: 2, dur: 1.1 } },
  frost_drake:     { frost_breath: { shape: 'cone', r: 12, angle: 0.9, dur: 1.3, breath: true }, glacier_slam: { shape: 'circle', at: 'self', r: 6, dur: 1.2 } },
  deathless:       { bone_cleave: { shape: 'cone', r: 4.5, angle: 1.4, dur: 0.9 } },
  bone_magus:      { bone_spear: { shape: 'line', len: 16, width: 2.2, dur: 1.1 }, bone_prison: { shape: 'circle', r: 3, count: 3, spread: 5, dur: 1.3 } },
  bone_colossus:   { colossus_stomp: { shape: 'circle', at: 'self', r: 6.5, dur: 1.3 } },
  pale_templar:    { templar_smite: { shape: 'cone', r: 7, angle: 1.1, dur: 1 } },
  sorrowshade:     { bone_spear: { shape: 'line', len: 14, width: 2, dur: 1.1 } },
  malvoren: {
    pale_bolt: { shape: 'line', len: 24, width: 2.6, dur: 1.1 },
    void_rain: { shape: 'circle', r: 3.4, count: 8, spread: 11, dur: 1.6 },
    unmaking: { shape: 'circle', at: 'self', inner: 6, r: 22, dur: 2.1 },
    landing_quake: { shape: 'circle', at: 'self', r: 7, dur: 0.8 },
  },
  briar_stalker:   { pounce: { shape: 'line', len: 11, width: 2.4, dur: 1, charge: true } },
  spore_shambler:  { spore_cloud: { shape: 'circle', r: 4, dur: 1.2 } },
  treant:          { treant_slam: { shape: 'circle', at: 'self', r: 5, dur: 1.2 }, root_snare: { shape: 'circle', r: 3, count: 3, spread: 5, dur: 1.3 } },
  blight_horror:   { blight_nova: { shape: 'circle', at: 'self', r: 6, dur: 1.3 } },
  thornmother: {
    mother_wrath: { shape: 'circle', r: 3.4, count: 7, spread: 11, dur: 1.6 },
    treant_slam: { shape: 'cone', r: 12, angle: 1.2, dur: 1.2 },
    root_snare: { shape: 'circle', r: 3.2, count: 4, spread: 7, dur: 1.4 },
    blight_nova: { shape: 'circle', at: 'self', inner: 6, r: 20, dur: 2 },
  },
  gale_sprite:     { chain_lightning: { shape: 'line', len: 14, width: 2, dur: 1.1 } },
  stormhorn:       { stag_charge: { shape: 'line', len: 12, width: 2.6, dur: 1.1, charge: true }, thunder_stomp: { shape: 'circle', at: 'self', r: 4.5, dur: 1.1 } },
  tempest_golem:   { conductor_pulse: { shape: 'circle', at: 'self', r: 5.5, dur: 1.3 }, chain_lightning: { shape: 'line', len: 16, width: 2, dur: 1.1 } },
  skyraider:       { storm_bomb: { shape: 'circle', r: 3, count: 3, spread: 5, dur: 1.3 } },
  thunder_roc:     { sky_dive: { shape: 'line', len: 14, width: 2.6, dur: 1.2, charge: true }, chain_lightning: { shape: 'line', len: 16, width: 2, dur: 1.1 } },
  voltaris: {
    chain_lightning: { shape: 'line', len: 22, width: 2.6, dur: 1.1 },
    thunderclap: { shape: 'circle', at: 'self', r: 8, dur: 1.3 },
    storm_call: { shape: 'circle', r: 3.2, count: 7, spread: 10, dur: 1.6 },
    lightning_strike: { shape: 'circle', r: 3.4, count: 4, spread: 7, dur: 1.4 },
    landing_quake: { shape: 'circle', at: 'self', r: 7, dur: 0.8 },
  },
  pale_warden: {
    soul_rend: { shape: 'line', len: 18, width: 2.4, dur: 1.1 },
    bone_storm: { shape: 'circle', r: 3, count: 5, spread: 8, dur: 1.4 },
    grave_nova: { shape: 'circle', at: 'self', inner: 5, r: 16, dur: 1.8 },
  },
  sylvara: {
    ice_lance: { shape: 'line', len: 22, width: 2.4, dur: 1.1 },
    blizzard_storm: { shape: 'circle', r: 3.4, count: 6, spread: 9, dur: 1.6 },
    glacier_slam: { shape: 'circle', at: 'self', inner: 6, r: 20, dur: 2 },
  },
  vorathrax: {
    dragon_claw: { shape: 'cone', r: 8, angle: 1.5, dur: 1 },
    tail_sweep: { shape: 'circle', at: 'self', r: 9, dur: 1.3 },
    inferno_breath: { shape: 'cone', r: 20, angle: 0.8, dur: 1.6, breath: true },
    sky_fire: { shape: 'circle', r: 3.4, count: 4, spread: 7, dur: 1.4 },
    landing_quake: { shape: 'circle', at: 'self', r: 7, dur: 0.8 },
  },
  pyrrhon: {
    eruption: { shape: 'circle', r: 3.2, count: 5, spread: 6, dur: 1.5 },
    molten_wave: { shape: 'circle', r: 6, dur: 1.5 },
    fire_serpent: { shape: 'line', len: 20, width: 3, dur: 1.2 },
    phoenix_rush: { shape: 'circle', r: 4, dur: 1.3 },
  },
};
for (const [id, a] of Object.entries(AOE)) ENEMIES[id].aoe = a;

// How far away each foe attacks from. Everything else fights up close.
const RANGED = { sorrowshade: 11, bone_magus: 12, soul_anchor: 30, malvoren: 14, pixie: 12, blight_pod: 30, thornmother: 9, skyraider: 12, voltaris: 14, thunder_roc: 5, gale_sprite: 10, pale_warden: 13, frost_wraith: 12, sylvara: 15, frost_drake: 4.5, frost_wisp: 11, storm_crow: 12, lava_imp: 11, ashen_shaman: 12, magma_serpent: 14, lord_hollowmere: 14, pyrrhon: 16, dragon_cultist: 12, wyvern: 13, vorathrax: 7.5, drake: 3.6 };
for (const e of Object.values(ENEMIES)) {
  e.range = RANGED[e.id] ?? 2.6;
  e.attackRate = e.boss ? 1.9 : 2.4;
}
ENEMIES.magma_guard.speed = 2.2;
ENEMIES.vorathrax.attackRate = 1.7;
ENEMIES.sylvara.attackRate = 1.6;
ENEMIES.voltaris.attackRate = 1.6;
ENEMIES.thornmother.attackRate = 1.6;
ENEMIES.blight_pod.attackRate = 4;
ENEMIES.malvoren.attackRate = 1.5;
ENEMIES.soul_anchor.attackRate = 3.2;
ENEMIES.magma_serpent.speed = 0;

// Echoes of past bosses in Malvoren's Echo Halls: the old fights, remembered at level 46.
// Every echo counts as a 'magister_echo' for quests.
for (const [id, base, name] of [['echo_hollowmere', 'lord_hollowmere', 'Echo of Hollowmere'], ['echo_pyrrhon', 'pyrrhon', 'Echo of Pyrrhon'], ['echo_sylvara', 'sylvara', 'Echo of Sylvara']]) {
  const b = ENEMIES[base], L = 46, k = L - b.level;
  ENEMIES[id] = {
    ...b, id, name, level: L, questAs: 'magister_echo', hp: 11000, xp: 4200, gold: [260, 340], aggro: 8, dmgMult: 1 + k * 0.075,
    phases: [{ at: 0.5, say: 'The Magister... remembers... me...', blade: 0.4 }], drops: [{ mat: 'diamond', chance: 0.5 }], reactions: [],
  };
}

// Where enemies live in the world. `r` = wander radius around the spawn point.
const X = EMBER_X;
const GX = 2300; // Glacierreach (see GLACIER_X)
const SX = 3300; // Stormspire (see STORM_X)
const TX = 4400; // Thornwood (see THORN_X)
const HX2 = 5500; // the Hollow Deep (see DEEP_X)

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

  // Dragonspire Peaks
  ...[[-4, 32], [4, 40], [-3, 50], [4, 60], [-4, 70], [3, 80]].map(([dx, z]) => ({ enemy: 'wyrmling', x: 1400 + dx, z, r: 4 })),
  ...[[-8, 100], [8, 110], [-4, 118], [10, 96]].map(([dx, z]) => ({ enemy: 'drake', x: 1400 + dx, z, r: 4 })),
  { enemy: 'wyrmling', x: 1402, z: 106, r: 4 },
  ...[[26, 103], [38, 108], [50, 102], [62, 107]].map(([dx, z]) => ({ enemy: 'dragon_cultist', x: 1400 + dx, z, r: 3 })),
  ...[[78, 100], [90, 112], [86, 96], [76, 114], [84, 132]].map(([dx, z]) => ({ enemy: 'wyvern', x: 1400 + dx, z, r: 4 })),
  { enemy: 'dragon_cultist', x: 1481, z: 146, r: 2 },
  { enemy: 'dragon_cultist', x: 1487, z: 152, r: 2 },
  { enemy: 'vorathrax', x: 1484, z: 198, r: 0 },

  // Glacierreach
  ...[[-4, 30], [4, 40], [-3, 52], [4, 62], [-4, 74]].map(([dx, z]) => ({ enemy: 'snow_wolf', x: GX + dx, z, r: 4 })),
  ...[[-14, 100], [12, 112], [-6, 118], [14, 94], [0, 104]].map(([dx, z]) => ({ enemy: 'frost_wraith', x: GX + dx, z, r: 5 })),
  ...[[28, 103], [42, 108], [54, 101]].map(([dx, z]) => ({ enemy: 'yeti', x: GX + dx, z, r: 3 })),
  ...[[70, 100], [82, 110], [78, 96], [72, 113]].map(([dx, z]) => ({ enemy: 'ice_golem', x: GX + dx, z, r: 2 })),
  ...[[76, 134], [73, 150], [79, 162]].map(([dx, z]) => ({ enemy: 'frost_drake', x: GX + dx, z, r: 3 })),
  { enemy: 'sylvara', x: GX + 76, z: 198, r: 0 },

  // Stormspire
  ...[[-6, 56], [6, 60], [-4, 68], [8, 70], [0, 64]].map(([dx, z]) => ({ enemy: 'gale_sprite', x: SX + dx, z, r: 4 })),
  ...[[54, 56], [66, 58], [58, 70], [66, 68]].map(([dx, z]) => ({ enemy: 'stormhorn', x: SX + dx, z, r: 4 })),
  ...[[54, 116], [66, 114], [58, 126], [64, 124]].map(([dx, z]) => ({ enemy: 'tempest_golem', x: SX + dx, z, r: 2 })),
  ...[[-6, 114], [6, 116], [-4, 126], [7, 126], [0, 120]].map(([dx, z]) => ({ enemy: 'skyraider', x: SX + dx, z, r: 3 })),
  ...[[0, 140], [0, 150], [-6, 166]].map(([dx, z]) => ({ enemy: 'thunder_roc', x: SX + dx, z, r: 2 })),
  { enemy: 'voltaris', x: SX, z: 186, r: 0 },

  // Thornwood
  ...[[-3, 34], [3, 46], [-3, 56], [-8, 72], [9, 82]].map(([dx, z]) => ({ enemy: 'briar_stalker', x: TX + dx, z, r: 4 })),
  ...[[-6, 70], [6, 76], [0, 86], [-10, 80], [10, 70]].map(([dx, z]) => ({ enemy: 'pixie', x: TX + dx, z, r: 4 })),
  ...[[-54, 70], [-66, 80], [-60, 88], [-68, 68]].map(([dx, z]) => ({ enemy: 'spore_shambler', x: TX + dx, z, r: 3 })),
  ...[[-2, 102], [2, 114], [-2, 124], [8, 136]].map(([dx, z]) => ({ enemy: 'treant', x: TX + dx, z, r: 2 })),
  ...[[-8, 146], [8, 150], [0, 158], [-10, 156]].map(([dx, z]) => ({ enemy: 'blight_horror', x: TX + dx, z, r: 3 })),
  { enemy: 'thornmother', x: TX, z: 218, r: 0 },

  // the Hollow Deep
  ...[[-6, 60], [6, 64], [-4, 74], [8, 72], [0, 56]].map(([dx, z]) => ({ enemy: 'sorrowshade', x: HX2 + dx, z, r: 4 })),
  ...[[-3, 30], [3, 42], [52, 60], [66, 62], [58, 74]].map(([dx, z]) => ({ enemy: 'deathless', x: HX2 + dx, z, r: 3 })),
  ...[[54, 68], [66, 72], [60, 58], [62, 78]].map(([dx, z]) => ({ enemy: 'bone_magus', x: HX2 + dx, z, r: 3 })),
  ...[[57, 92], [63, 104]].map(([dx, z]) => ({ enemy: 'bone_colossus', x: HX2 + dx, z, r: 2 })),
  { enemy: 'echo_hollowmere', x: HX2 + 52, z: 120, r: 0 },
  { enemy: 'echo_pyrrhon', x: HX2 + 68, z: 120, r: 0 },
  { enemy: 'echo_sylvara', x: HX2 + 60, z: 134, r: 0 },
  ...[[-6, 118], [6, 120], [-4, 130], [7, 130]].map(([dx, z]) => ({ enemy: 'pale_templar', x: HX2 + dx, z, r: 3 })),
  { enemy: 'malvoren', x: HX2, z: 196, r: 0 },
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
  nyx: {
    name: 'Warden Nyx', title: 'Keeper of the Rift', x: 14, z: 21, robe: 0x2a1a44, hat: 0x1a1030, trim: 0xc542ff, service: 'rift', hatStyle: 'hood', hair: 0xe8e8f0, skin: 0xb8a0d0, eyeColor: 0xc542ff, gem: 0xc542ff,
    lines: ['The Rift is never the same twice. Every floor is new, and every floor is deeper.',
            'Fall in there and you keep half your shards. Leave through a Rift Exit and you keep them all.',
            'Shrines in the Rift grant boons. They fade when your run ends, but the shards do not.'],
  },
  rosalind: {
    name: 'Innkeeper Rosalind', title: 'The Starfall Inn', x: -19, z: 17, robe: 0xa0603a, hat: 0x6a3a20, trim: 0xf0d8a0, service: 'inn', hatStyle: 'hood', hair: 0xc0392b, skin: 0xf0c8a8, eyeColor: 0x3a6ea5,
    lines: ['Travelling alone is for heroes in songs. Real adventurers bring friends!',
            'My regulars will fight at your side, for a fee. They do love a good brawl.'],
  },
  vex: {
    name: 'Arenamaster Vex', title: 'Arena of Stars', x: 19, z: -17, robe: 0x5a1a4a, hat: 0x2a0a24, trim: 0xf2c14e, service: 'arena', hatStyle: 'helmet', hair: 0x1a1010, skin: 0xc68a5e, eyeColor: 0xc542ff,
    lines: ['The crowd wants blood! Well, sparkles. Magical sparkles. Close enough.',
            'Win duels to climb the ranks: Bronze, Silver, Gold, Platinum... and then the Champion herself.'],
  },
  grimm: {
    name: 'Slayer Master Grimm', title: 'Monster Hunter', x: -9.5, z: 22.5, robe: 0x2a2a34, hat: 0x3a3a48, trim: 0xc0392b, service: 'slayer', hatStyle: 'helmet', beard: true, hair: 0x3a3a3a, skin: 0xb88a6a, eyeColor: 0x8a1a1a,
    lines: ['Every monster has a weakness. Mine is that I cannot stop hunting them.',
            'Take a task, kill what I tell you, come back for points. Simple as that.'],
  },
  juno: {
    name: 'Stablemaster Juno', title: 'Millbrook Stables', x: 69, z: -8, robe: 0x8a5a3a, hat: 0x5a3a20, trim: 0xf0d8a0, service: 'stable', hatStyle: 'hood', hair: 0xd8a040, skin: 0xe0b890, eyeColor: 0x5a8a3a,
    lines: ['A good mount is worth ten pairs of boots. Press X to ride, and it will carry you twice as fast.',
            'Mounts get spooked in battle, so you will hop off when a fight starts.'],
  },
  brisa: {
    name: 'Forewoman Brisa', title: 'Gatherers\' Guild', x: 42, z: 4, robe: 0x5a7a3a, hat: 0x3a4a24, trim: 0xd8b060, service: 'guild', hatStyle: 'hood', backpack: true, hair: 0x6a3a1a, skin: 0xc68a5e, eyeColor: 0x3a6a2a,
    lines: ['Trees, rocks, fish and flowers: the whole meadow is a treasure chest if you know how to open it.',
            'Every skill goes all the way to 99. Nobody has ever mastered them all. Yet!',
            'Chop, mine, fish and pick here, then use the stations in the crafting yard to make something of it.'],
  },
  kael: {
    name: 'Dragonwarden Kael', title: 'Skyhold Camp', x: 1406, z: 7, robe: 0x5a2a2a, hat: 0x8a8f9a, trim: 0xd8b060, hatStyle: 'helmet', hair: 0xd8d8e0, skin: 0xc68a5e, eyeColor: 0x6a4a2a, quiver: true,
    lines: ['The dragons came back three winters ago. We have been holding this camp ever since.',
            'Watch the ground when a dragon breathes in. If it glows, MOVE.',
            'A wizard with the Voice... I never thought I would see one.'],
  },
  vaelith: {
    name: 'Sage Vaelith', title: 'Keeper of Words', x: 1391, z: -4, robe: 0x2a3a5a, hat: 0x1a2a44, trim: 0x9fd6ff, beard: true, hair: 0xe8e8f0, skin: 0xe0c0a8, eyeColor: 0x4dc8ff, gem: 0x4dc8ff,
    lines: ['Dragons do not speak. They SHOUT. Every word they know is carved into the Word Walls.',
            'Slay a great dragon and its soul becomes yours. With souls, you can learn deeper words.',
            'Press R to shout. Choose which shout you use in your spellbook.'],
  },
  hesk: {
    name: 'Quartermaster Hesk', title: 'Dragonforged Gear', x: 1411, z: -7, robe: 0x4a4a5a, hat: 0x2a2a34, trim: 0xff7a1a, service: 'gear', hatStyle: 'helmet', beard: true, hair: 0x5a3a2a, skin: 0xd8a888,
    stock: ['wyrmscale_hood', 'drakehide_robe', 'frostfur_cloak', 'dragonbone_wand', 'dragonheart_amulet'],
    lines: ['Dragon scale turns a blade. Dragon bone holds an enchantment. I buy and sell both kinds of gear.'],
  },
  lyra: {
    name: 'Lyra Duskmantle', title: 'Runaway Apprentice', x: 5500 + 7, z: 6, robe: 0xe8e4f0, hat: 0x3a2a4a, trim: 0xd06aff, hatStyle: 'hood', hair: 0xd8d0e8, skin: 0xe8d0c0, eyeColor: 0xd06aff,
    lines: ['I was Malvoren\'s apprentice for ten years. I know his tricks. I just never had the courage to face him.',
            'Down here, the dead remember everything. Malvoren made sure of it.'],
  },
  aldric: {
    name: 'Sir Aldric', title: 'the Redeemed Knight', x: 5500 - 8, z: -2, robe: 0x707894, hat: 0x2d2a3a, trim: 0xf2c14e, hatStyle: 'helmet', beard: true, hair: 0x8a6a4a, skin: 0xe0b890, eyeColor: 0x7de0ff,
    lines: ['I was a Hollow Knight once, bound to Hollowmere\'s will. When you broke him, you broke my chains too.',
            'Arcane and fire burn bone well. The Magister\'s own magic, less so.'],
  },
  mott: {
    name: 'Gravekeeper Mott', title: 'Refuge Outfitter', x: 5500 + 12, z: -8, robe: 0x3a3a3a, hat: 0x1a1a1a, trim: 0x7affd0, service: 'gear', hatStyle: 'wizard', beard: true, hair: 0xaaaaaa, skin: 0xc8b8a8,
    stock: ['deepwalker_hood', 'deepwalker_robe', 'deepwalker_boots', 'soulreaver_staff', 'deep_sigil'],
    lines: ['Clothes for the deep dark. They fit the living just as well as the dead.'],
  },
  rowan: {
    name: 'Elder Rowan', title: 'Greenhollow Druid', x: 4400 + 7, z: 6, robe: 0x3a6a3a, hat: 0x6b4a2b, trim: 0xf2c14e, hatStyle: 'hood', beard: true, hair: 0xe8e0d0, skin: 0xc89878, eyeColor: 0x5fdc6a,
    lines: ['The Elder Mother has sheltered Greenhollow for a thousand years. Now purple rot creeps up her roots.',
            'The forest remembers every footstep. Walk kindly.'],
  },
  wren: {
    name: 'Wren Thistledown', title: 'Thornwood Ranger', x: 4400 - 8, z: -2, robe: 0x5a7a3a, hat: 0x3a4a2a, trim: 0xc0392b, hatStyle: 'hood', hair: 0xc05a2a, skin: 0xf0c8a8, eyeColor: 0x2e7d3b, backpack: true,
    lines: ['Fire burns blight away. So does a sharp arrow. I prefer arrows; the trees prefer that too.',
            'The pixies used to guide travellers home. Now they lead them into the thorns.'],
  },
  moss: {
    name: 'Moss Underbough', title: 'Greenhollow Outfitter', x: 4400 + 12, z: -8, robe: 0x6b4a2b, hat: 0x4f8a44, trim: 0xff8ad0, service: 'gear', hatStyle: 'wizard', beard: true, hair: 0x8a8a6a, skin: 0xd8a888,
    stock: ['thornweave_hood', 'barkskin_robe', 'rootwalker_boots', 'heartwood_staff', 'verdant_heart'],
    lines: ['Bark that turns a blade, thorns that turn a curse. Every stitch grown, not sewn.'],
  },
  aeris: {
    name: 'Captain Aeris Windward', title: 'Skyport Harbourmaster', x: 3300 + 7, z: 6, robe: 0x3a5a8a, hat: 0x1a2a4a, trim: 0xf2c14e, goggles: true, hair: 0xe8c070, skin: 0xe8b890, eyeColor: 0x4dc8ff, backpack: true,
    lines: ['Welcome to Skyport, the highest harbour in the world! Mind the edge. It is a long way down.',
            'Since Voltaris came, no ship dares leave the harbour. The storm follows us wherever we fly.'],
  },
  tavi: {
    name: 'Stormcaller Tavi', title: 'Keeper of the Lightning Rods', x: 3300 - 8, z: -2, robe: 0xb46bff, hat: 0x3a1a6a, trim: 0x9ff0ff, hair: 0xf2f0ff, skin: 0xc89878, eyeColor: 0x9ff0ff, glasses: true,
    lines: ['The rods drink the lightning and keep the islands afloat. If the storm breaks them, Skyport falls.',
            'Earth grounds a storm. Verdant magic hits these foes hard.'],
  },
  breck: {
    name: 'Breck Cloudhammer', title: 'Skyport Outfitter', x: 3300 + 12, z: -8, robe: 0x6a4a2a, hat: 0x3a2a1a, trim: 0xb46bff, service: 'gear', hatStyle: 'helmet', beard: true, hair: 0x8a4a2a, skin: 0xe0a880,
    stock: ['stormcaller_hood', 'stormcaller_robe', 'windstep_boots', 'thunderstaff', 'storm_sigil'],
    lines: ['Lightning-proof cloth, wind-proof boots, and a staff that sings in a thunderstorm. What will it be?'],
  },
  pennywhistle: {
    name: 'Pennywhistle', title: 'Starfall Bank', x: -9, z: -15, robe: 0x2a5a3a, hat: 0x1a3a2a, trim: 0xf2c14e, service: 'bank', hatStyle: 'wizard', glasses: true, beard: true, hair: 0xe8e0d0, skin: 0xf0c8a8,
    lines: ['Gold, gear, the odd enchanted sock: the Starfall Bank keeps it all safe. There is a vault chest at your Homestead too.'],
  },
  halvard: {
    name: 'Warden Halvard', title: 'Frostholm Watch', x: 2300 + 6, z: 6, robe: 0x5a6a8a, hat: 0xb8c8e0, trim: 0x9fd6ff, hatStyle: 'helmet', beard: true, hair: 0xe8d8a0, skin: 0xe8c0a0, eyeColor: 0x3a6ea5,
    lines: ['Frostholm has stood in the snow for five hundred years. It has never been this cold.',
            'The Queen used to be kind, you know. Then the Pale Magister came to her court.'],
  },
  ingrid: {
    name: 'Seer Ingrid', title: 'Frostholm Seer', x: 2300 - 9, z: -3, robe: 0x7affd0, hat: 0x2a6a5a, trim: 0xf8fcff, hair: 0xf8fcff, skin: 0xf0d8c0, eyeColor: 0x7affd0, glasses: true,
    lines: ['The aurora whispers at night. It speaks of a pale hand pulling every string: Hollowmere, Pyrrhon, the dragons, and now our Queen.',
            'Fire magic is strong here. Ice melts; that is the one law even a queen must obey.'],
  },
  frida: {
    name: 'Frida Snowglove', title: 'Frostholm Outfitter', x: 2300 + 10, z: -8, robe: 0x8a3a3a, hat: 0xf8fcff, trim: 0xf2c14e, service: 'gear', hatStyle: 'hood', hair: 0xf0a040, skin: 0xf0c8a8,
    stock: ['frostweave_hood', 'glacial_robe', 'rimewalker_boots', 'icicle_staff', 'winterheart'],
    lines: ['Wool, fur, and a little enchantment. That is how we stay warm up here.'],
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
  // ---------------- Chapter 3: Wings of Ruin ----------------
  {
    id: 'q15', name: 'Shadows in the Sky', giver: 'orvyn', turnIn: 'kael',
    objective: { type: 'talk', npc: 'kael' },
    offer: 'Last night a dragon flew over the Academy. A DRAGON! None have been seen here in three hundred years. I have opened a new Spiral Door on the west side of the courtyard, next to the old one. It leads to the Dragonspire Peaks. Find Dragonwarden Kael at Skyhold Camp.',
    done: 'You came through the Spiral Door? Then Orvyn sent you. Good. We need every wand we can get. The dragons are waking, and their queen of queens, Vorathrax, rules the peak.',
    reward: { xp: 1500, gold: 150 },
  },
  {
    id: 'q16', name: 'The Voice in the Stone', giver: 'kael', turnIn: 'vaelith',
    objective: { type: 'talk', npc: 'vaelith' },
    offer: 'Before you fight a dragon, you should meet Sage Vaelith. She reads the old Word Walls, the carvings where dragons wrote their shouts. She says a wizard like you might be able to learn them.',
    done: 'So you are the one. Yes... I can see the Voice in you. The Word Wall behind me holds FUS, the first word of Unrelenting Force. Go and touch it. When you learn a shout, press R to use it.',
    reward: { xp: 1500, gold: 100, voice: true },
  },
  {
    id: 'q17', name: 'Words of Power', giver: 'vaelith', turnIn: 'vaelith',
    objective: { type: 'shout', shout: 'force' },
    offer: 'Walk up to the Word Wall and read it. The word will burn itself into your mind. Then come back and tell me what you heard.',
    done: '"FUS." Force. Now you can knock a charging wyrmling off its feet. Every dragon you slay grants a soul, and every soul can teach you a deeper word. Find more Word Walls: I have heard of one in Hollow Lane, one near the Molten Throne, and three more on this mountain.',
    reward: { xp: 1800, gold: 150, tp: 1 },
  },
  {
    id: 'q18', name: 'The Hatchery', giver: 'kael', turnIn: 'kael',
    objective: { type: 'defeat', enemy: 'wyrmling', count: 5 },
    offer: 'Wyrmlings have hatched all along the mountain path north of camp. They are small, fast and they bite. Clear 5 of them so our scouts can move.',
    done: 'Five fewer teeth on the mountain. Well done. But the big ones are next.',
    reward: { xp: 2200, gold: 180, potions: 1 },
  },
  {
    id: 'q19', name: 'The Bone Field', giver: 'kael', turnIn: 'kael',
    objective: { type: 'defeat', enemy: 'drake', count: 4 },
    offer: 'At the top of the path lies the Bone Field, where old dragons went to die. Bone Drakes nest there now. They charge in a straight line and breathe fire in a cone. Watch the ground and get out of the way. Defeat 4.',
    done: 'You faced drakes and you are still standing. Most of my rangers cannot say that.',
    reward: { xp: 2600, gold: 220, tp: 1 },
  },
  {
    id: 'q20', name: 'The Scaled Cult', giver: 'vaelith', turnIn: 'vaelith',
    objective: { type: 'defeat', enemy: 'dragon_cultist', count: 4 },
    offer: 'Wizards who worship the dragons call themselves the Scaled Cult. They are the ones waking the dragons, feeding them with dark magic. They camp on the ridge east of the Bone Field. Stop 4 of them.',
    done: 'Their chanting has stopped. Among their scrolls I found a name: Vorathrax. And another name I did not expect... Hollowmere.',
    reward: { xp: 2800, gold: 260 },
  },
  {
    id: 'q21', name: 'Wings over the Cliffs', giver: 'kael', turnIn: 'kael',
    objective: { type: 'defeat', enemy: 'wyvern', count: 3 },
    offer: 'Stormwing Wyverns guard the cliffs below the Roost. They dive at you in a straight line and rain fire from above. Bring down 3 of them.',
    done: 'The cliffs are quiet. Only the Roost is left, and the tyrant who lives there.',
    reward: { xp: 3000, gold: 300, potions: 1 },
  },
  {
    id: 'q22', name: 'Dragonrend', giver: 'vaelith', turnIn: 'vaelith',
    objective: { type: 'shout', shout: 'rend' },
    offer: 'Vorathrax will take to the sky and burn you from above. There is one shout that forces a dragon to land: Dragonrend. Its wall stands at the foot of the Roost. Learn it, and when she flies, SHOUT.',
    done: 'JOOR. "Mortal." A word no dragon can understand, and so it drags them out of the sky. Equip it in your spellbook (B) and shout (R) when she takes flight.',
    reward: { xp: 3200, gold: 300, tp: 1 },
  },
  {
    id: 'q23', name: 'Vorathrax, the Sky Tyrant', giver: 'kael', turnIn: 'orvyn',
    objective: { type: 'defeat', enemy: 'vorathrax', count: 1 },
    offer: 'This is it. Vorathrax waits at the Dragon\'s Roost on the peak. She breathes fire in a long cone, sweeps her tail around her, and flies when she is hurt. Use Dragonrend to bring her down. Stock up on food and potions. Then tell Orvyn the dragon is dead.',
    done: 'Vorathrax... slain? And you took her soul? Then the stories are true: you are dragonborn as well as a wizard. Chapter 3 is complete! But the cult\'s scrolls speak of Hollowmere, and of a master behind them all. Rest now. When the next Spiral Door opens, we will need you again.',
    reward: { xp: 8000, gold: 1000, tp: 3 },
  },
  // ---------------- Chapter 4: The Frozen Crown ----------------
  {
    id: 'q24', name: 'The Frozen Door', giver: 'orvyn', turnIn: 'halvard',
    objective: { type: 'talk', npc: 'halvard' },
    offer: 'A fourth Spiral Door froze solid overnight: the one in the north-west corner of the courtyard. Beyond it lies Glacierreach, the kingdom of Queen Sylvara. Her messengers have stopped coming. Go to the town of Frostholm and find Warden Halvard.',
    done: 'A Starfall wizard! Thank the aurora. The Queen has sealed herself in her ice castle and the whole land is freezing solid. Wolves prowl right up to our gates.',
    reward: { xp: 4000, gold: 300 },
  },
  {
    id: 'q25', name: 'Wolves at the Gate', giver: 'halvard', turnIn: 'halvard',
    objective: { type: 'defeat', enemy: 'snow_wolf', count: 5 },
    offer: 'Snowfang Wolves hunt along the road north of town. They are fast, and they hit harder after they howl. Drive off 5 of them.',
    done: 'The road is safe again, for now. Seer Ingrid wants to speak with you about the lake.',
    reward: { xp: 5000, gold: 350, potions: 1 },
  },
  {
    id: 'q26', name: 'Voices Under the Ice', giver: 'ingrid', turnIn: 'ingrid',
    objective: { type: 'defeat', enemy: 'frost_wraith', count: 4 },
    offer: 'Frost Wraiths rise from the frozen Mirror Lake: the spirits of those the Queen froze. They throw lances of ice in straight lines. Lay 4 of them to rest.',
    done: 'Before they faded, the spirits spoke one name: "the Pale Magister". He came to court a year ago, and the Queen changed after that.',
    reward: { xp: 5500, gold: 400, tp: 1 },
  },
  {
    id: 'q27', name: 'The Walking Mountain', giver: 'halvard', turnIn: 'halvard',
    objective: { type: 'defeat', enemy: 'yeti', count: 3 },
    offer: 'Yetis came down from the peaks and blocked the pass east of the lake. They are big, tough, and they drop avalanches on you. Clear 3 of them.',
    done: 'Three yetis! The children of Frostholm will sing about you. Badly, but loudly.',
    reward: { xp: 6000, gold: 450 },
  },
  {
    id: 'q28', name: 'Hearts of Ice', giver: 'ingrid', turnIn: 'ingrid',
    objective: { type: 'defeat', enemy: 'ice_golem', count: 4 },
    offer: 'The Queen\'s Rime Golems guard the caverns before her castle. Their slam freezes everything around them. Shatter 4 of them.',
    done: 'Inside one golem\'s heart I found a pale crystal carved with the same rune as Hollowmere\'s locket. It is all connected.',
    reward: { xp: 6500, gold: 500, tp: 1 },
  },
  {
    id: 'q29', name: 'Wings of Winter', giver: 'halvard', turnIn: 'halvard',
    objective: { type: 'defeat', enemy: 'frost_drake', count: 3 },
    offer: 'Frost Dragons circle the castle stair, north of the caverns. Their breath freezes a wizard mid-spell. Bring down 3 and the path to the Queen is clear.',
    done: 'Dragons of ice... you really are dragonborn. The stair is open. Seer Ingrid has one more thing to tell you before you go.',
    reward: { xp: 7000, gold: 550, potions: 1 },
  },
  {
    id: 'q30', name: 'The Frozen Crown', giver: 'ingrid', turnIn: 'orvyn',
    objective: { type: 'defeat', enemy: 'sylvara', count: 1 },
    offer: 'Queen Sylvara waits in her throne hall. She will summon golems and dragons, bury the floor in blizzards, and ring herself in ice where only standing close is safe. Break the Magister\'s hold on her. Then go home and tell Orvyn everything.',
    done: 'Sylvara is free, and Glacierreach begins to thaw. And the Pale Magister... so he was behind Hollowmere, Pyrrhon, the dragons and the Queen. Chapter 4 is complete, archmage. Wherever he hides, the next Spiral Door will lead us to him. Rest and grow stronger. You will need everything you have.',
    reward: { xp: 16000, gold: 2500, tp: 3 },
  },
  // ---------------- Chapter 5: Eye of the Storm ----------------
  {
    id: 'q31', name: 'A Letter from the Sky', giver: 'orvyn', turnIn: 'aeris',
    objective: { type: 'talk', npc: 'aeris' },
    offer: 'An airship dropped a letter in the courtyard this morning, sealed with a lightning bolt. Captain Aeris of Skyport begs for help: a storm-creature has trapped her city in the clouds. A Spiral Door has opened in the north-west of the courtyard. Go to Stormspire.',
    done: 'You came through the Door? Then Starfall answered! Voltaris, the Storm Herald, has wrapped our islands in a storm that never ends. Nothing can fly in or out.',
    reward: { xp: 6000, gold: 400 },
  },
  {
    id: 'q32', name: 'Winds Unbound', giver: 'aeris', turnIn: 'aeris',
    objective: { type: 'defeat', enemy: 'gale_sprite', count: 5 },
    offer: 'Cross the bridge north to the Isle of Winds. Gale Sprites have taken over the windmills and blow travellers off the bridges. Calm 5 of them.',
    done: 'The windmills are turning again! Stormcaller Tavi has been waiting to meet you.',
    reward: { xp: 7000, gold: 450, potions: 1 },
  },
  {
    id: 'q33', name: 'Stormhorn Stampede', giver: 'tavi', turnIn: 'tavi',
    objective: { type: 'defeat', enemy: 'stormhorn', count: 4 },
    offer: 'East of the Isle of Winds is Thunder Isle, where our lightning rods stand. Stormhorn Stags charge the rods and knock them down. Drive off 4 of them.',
    done: 'The rods stand tall again. And look: one stag carried a pale rune on its collar. The Magister\'s mark, again.',
    reward: { xp: 7500, gold: 500, tp: 1 },
  },
  {
    id: 'q34', name: 'Conductors', giver: 'tavi', turnIn: 'tavi',
    objective: { type: 'defeat', enemy: 'tempest_golem', count: 4 },
    offer: 'North of Thunder Isle, the Crystal Spire hums with stolen lightning. Tempest Golems guard it and pulse with power. Shatter 4 of them before they overload the islands.',
    done: 'The Spire is quiet. Now only the pirates stand between us and the storm\'s eye.',
    reward: { xp: 8000, gold: 550 },
  },
  {
    id: 'q35', name: 'Pirates of the Upper Air', giver: 'aeris', turnIn: 'aeris',
    objective: { type: 'defeat', enemy: 'skyraider', count: 5 },
    offer: 'The Skyraiders made a deal with Voltaris: he lets them fly, and they rob everyone else. Their roost is west of the Crystal Spire. Take down 5 of them.',
    done: 'Ha! The Skyraiders won\'t forget you. Their captain\'s logbook says Voltaris answers to someone called the Pale Magister.',
    reward: { xp: 8500, gold: 700, potions: 1 },
  },
  {
    id: 'q36', name: 'Wings of Thunder', giver: 'aeris', turnIn: 'aeris',
    objective: { type: 'defeat', enemy: 'thunder_roc', count: 3 },
    offer: 'The last bridge leads north to the Eye of the Storm, and Thunder Rocs guard it. They dive like falling lightning. Bring down 3 of them.',
    done: 'The way to the Eye is open. Tavi says there is one last thing you should know before you go.',
    reward: { xp: 9000, gold: 750, tp: 1 },
  },
  {
    id: 'q37', name: 'Eye of the Storm', giver: 'tavi', turnIn: 'orvyn',
    objective: { type: 'defeat', enemy: 'voltaris', count: 1 },
    offer: 'Voltaris waits in the Eye of the Storm. He flies up into the clouds and rains lightning, calls storms across the ground, and claps thunder around himself. Dodge, bring him down, and end this storm. Then tell Orvyn what you have learned.',
    done: 'The storm is over, and Skyport is free... And the Pale Magister has a name at last: Malvoren. He was my student, long ago. The brightest I ever had, and the hungriest. Chapter 5 is complete. I fear the next Door will lead us to him.',
    reward: { xp: 22000, gold: 3500, tp: 3 },
  },
  // ---------------- Chapter 6: The Blighted Heart ----------------
  {
    id: 'q38', name: 'The Green Door', giver: 'orvyn', turnIn: 'rowan',
    objective: { type: 'talk', npc: 'rowan' },
    offer: 'A Spiral Door wrapped in vines has opened on the east side of the courtyard. It leads to Thornwood, the oldest forest in the world, and its druids are calling for help. Malvoren\'s blight has reached it. Find Elder Rowan in Greenhollow.',
    done: 'A wizard of Starfall, at last. Look up: the Elder Mother is wilting. The blight comes from the Heartwood, deep in the forest, and it is spreading.',
    reward: { xp: 9000, gold: 600 },
  },
  {
    id: 'q39', name: 'Briar Patch', giver: 'rowan', turnIn: 'rowan',
    objective: { type: 'defeat', enemy: 'briar_stalker', count: 5 },
    offer: 'Briar Stalkers prowl the path north to the Mossy Glade. They were gentle forest cats once; the blight turned their fur to thorns. Stop 5 of them.',
    done: 'The path is safe. Wren has been tracking something stranger in the glade.',
    reward: { xp: 10000, gold: 650, potions: 1 },
  },
  {
    id: 'q40', name: 'Tricksy Lights', giver: 'wren', turnIn: 'wren',
    objective: { type: 'defeat', enemy: 'pixie', count: 5 },
    offer: 'The pixies in the Mossy Glade are enchanted: they dodge, weaken you with glamours, and pelt you from afar. Break the spell on 5 of them.',
    done: 'They flew off giggling, back to their old selves. One left a trail of glowing dust to the west, toward the Glowcap Hollow.',
    reward: { xp: 10500, gold: 700, tp: 1 },
  },
  {
    id: 'q41', name: 'Mushroom Madness', giver: 'wren', turnIn: 'wren',
    objective: { type: 'defeat', enemy: 'spore_shambler', count: 4 },
    offer: 'West of the glade, the Glowcap Hollow is full of Spore Shamblers. Their spore clouds poison you over time, so do not stand in them. Clear 4.',
    done: 'The Hollow glows blue again instead of purple. That is a good sign.',
    reward: { xp: 11000, gold: 750 },
  },
  {
    id: 'q42', name: 'Old Bark', giver: 'rowan', turnIn: 'rowan',
    objective: { type: 'defeat', enemy: 'treant', count: 4 },
    offer: 'North of the glade, the old treants have woken in a rage. They slam the ground around them and call roots up under your feet. Put 4 of them back to sleep.',
    done: 'They sleep. When the blight is gone they will wake kind again. I hope.',
    reward: { xp: 11500, gold: 800, potions: 1 },
  },
  {
    id: 'q43', name: 'Into the Blight', giver: 'rowan', turnIn: 'rowan',
    objective: { type: 'defeat', enemy: 'blight_horror', count: 4 },
    offer: 'Beyond the treants lies the Blighted Grove, where the rot is thickest. Blight Horrors guard it. Destroy 4, and the way to the Heartwood will open.',
    done: 'You have walked through the worst of it. Wren has something to tell you before you face the heart of this.',
    reward: { xp: 12000, gold: 850, tp: 1 },
  },
  {
    id: 'q44', name: 'The Blighted Heart', giver: 'wren', turnIn: 'orvyn',
    objective: { type: 'defeat', enemy: 'thornmother', count: 1 },
    offer: 'The Thornmother guards the Heartwood. She was the forest\'s protector until Malvoren poisoned her. She grows Blight Pods that heal her, so cut them down fast. Watch for her Blight Nova: get close to her when the ring appears. End it, then tell Orvyn.',
    done: 'The Heartwood is clean, and the Elder Mother blooms again... And in the Thornmother\'s roots, a path of black stone goes down, and down. Into the Hollow Deep, where Malvoren waits. Chapter 6 is complete. When you are ready, archmage, the last Door will open.',
    reward: { xp: 30000, gold: 4500, tp: 3 },
  },
  // ---------------- Chapter 7: The Pale Magister ----------------
  {
    id: 'q45', name: 'The Last Door', giver: 'orvyn', turnIn: 'lyra',
    objective: { type: 'talk', npc: 'lyra' },
    offer: 'The last Spiral Door has opened, black as ink, on the east side of the courtyard near the Rift Gate. It leads down into the Hollow Deep, to Malvoren\'s tower. Someone waits on the other side: a girl who escaped him. Find her.',
    done: 'You came. I\'m Lyra, I was Malvoren\'s apprentice. His Pale Spire stands at the bottom of the Deep. Between here and there: the dead he enslaved, echoes of every monster he made, and his Templars.',
    reward: { xp: 12000, gold: 800 },
  },
  {
    id: 'q46', name: 'Sorrow on the Shore', giver: 'lyra', turnIn: 'lyra',
    objective: { type: 'defeat', enemy: 'sorrowshade', count: 5 },
    offer: 'Past the Bone Road lies the Weeping Shore, where Sorrowshades drain the life from anyone who passes. Set 5 of them free.',
    done: 'Listen: the shore is quiet. Sir Aldric has been waiting to march on the Ossuary.',
    reward: { xp: 13000, gold: 850, potions: 1 },
  },
  {
    id: 'q47', name: 'The Deathless Legion', giver: 'aldric', turnIn: 'aldric',
    objective: { type: 'defeat', enemy: 'deathless', count: 5 },
    offer: 'Malvoren raised an army of skeletons: the Deathless Legion. They march the Bone Road and guard the Ossuary to the east. Break 5 of them.',
    done: 'Five fewer. I fought beside some of them, long ago. Rest well, brothers.',
    reward: { xp: 13500, gold: 900, tp: 1 },
  },
  {
    id: 'q48', name: 'The Bone Magi', giver: 'aldric', turnIn: 'aldric',
    objective: { type: 'defeat', enemy: 'bone_magus', count: 4 },
    offer: 'The Bone Magi in the Ossuary raise the Legion again and again. Their bone spears fly in straight lines, and their prisons fall in circles. Destroy 4.',
    done: 'The Ossuary is silent at last. North of it lie the Echo Halls. Lyra knows what waits there.',
    reward: { xp: 14000, gold: 950 },
  },
  {
    id: 'q49', name: 'Echoes of the Past', giver: 'lyra', turnIn: 'lyra',
    objective: { type: 'defeat', enemy: 'magister_echo', count: 3 },
    offer: 'In the Echo Halls, Malvoren keeps echoes of every champion he corrupted: Hollowmere, Pyrrhon and Queen Sylvara, stronger than you remember. Defeat all three echoes.',
    done: 'The echoes are gone. They looked almost... grateful. Only the Pale Gate stands between you and the Spire now.',
    reward: { xp: 15000, gold: 1000, tp: 1 },
  },
  {
    id: 'q50', name: 'The Pale Gate', giver: 'aldric', turnIn: 'aldric',
    objective: { type: 'defeat', enemy: 'pale_templar', count: 4 },
    offer: 'Malvoren\'s Pale Templars hold the gate west of the Echo Halls. They smite in wide arcs and raise wards. Cut through 4 of them.',
    done: 'The gate is open. Go, and end this. Lyra will tell you his weaknesses.',
    reward: { xp: 16000, gold: 1100, potions: 1 },
  },
  {
    id: 'q51', name: 'The Pale Magister', giver: 'lyra', turnIn: 'orvyn',
    objective: { type: 'defeat', enemy: 'malvoren', count: 1 },
    offer: 'At three-quarters health he hides behind a ward held by four Soul Anchors: destroy them. At half, he rises into the air and rains void: dodge, or use Dragonrend. At the end he calls up his Legion and casts the Unmaking, a ring of death: get close to him. You have beaten every one of his creations. Now beat him.',
    done: 'It is over. Malvoren is gone, the Spiral Doors are safe, and every land you freed is healing... You came to Starfall as an apprentice. You leave it as a legend. The Chronicle is complete, archmage. Thank you. (New Game+ is waiting whenever you want to live it again.)',
    reward: { xp: 50000, gold: 10000, tp: 5 },
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
  inventoryMax: 40,
  maxLevel: 50,
  bankMax: 80,
  secondSchoolLevel: 10,   // pick a second school at this level
  secondSpellDelay: 5,     // its spells unlock this many levels later than for its own students
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

export const SLOTS = { hat: '🎩 Hat', robe: '👘 Robe', cloak: '🧣 Cloak', boots: '👢 Boots', wand: '🪄 Wand', offhand: '📕 Offhand', amulet: '📿 Amulet', ring: '💍 Ring' };
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

  // ---------- dragon gear (Chapter 3) ----------
  wyrmscale_hood:    { name: 'Wyrmscale Hood',      slot: 'hat',    level: 15, stats: { hp: 200, dmg: 8, resist: 4 }, color: 0xc0392b, price: 900 },
  drakehide_robe:    { name: 'Drakehide Robe',      slot: 'robe',   level: 16, stats: { hp: 380, resist: 12, dmg: 5 }, color: 0x6a7a3a, price: 1100 },
  wyvern_wing_boots: { name: 'Wyvern-Wing Boots',   slot: 'boots',  level: 17, stats: { hp: 150, acc: 6, resist: 5, pip: 3 } },
  dragonbone_wand:   { name: 'Dragonbone Wand',     slot: 'wand',   level: 18, stats: { dmg: 16, pip: 6, acc: 3 }, price: 1600 },
  dragonheart_amulet:{ name: 'Dragonheart Amulet',  slot: 'amulet', level: 19, stats: { hp: 260, dmg: 9, heal: 10 }, price: 1400 },
  crown_of_the_sky:  { name: 'Crown of the Sky Tyrant', slot: 'hat', level: 22, stats: { hp: 320, dmg: 13, pip: 8, acc: 4 }, color: 0x8a1a1a },
  tyrant_robe:       { name: 'Robe of the Tyrant',  slot: 'robe',   level: 22, stats: { hp: 520, resist: 16, dmg: 8 }, color: 0x5a0a14 },
  fang_of_vorathrax: { name: 'Fang of Vorathrax',   slot: 'wand',   level: 22, stats: { dmg: 21, pip: 8, acc: 5 } },

  // ---------- the Hollow Deep (Chapter 7) ----------
  deepwalker_hood:   { name: 'Deepwalker Hood',     slot: 'hat',     level: 42, stats: { hp: 540, dmg: 18, resist: 9 }, color: 0x2a2038, price: 9600 },
  deepwalker_robe:   { name: 'Deepwalker Robe',     slot: 'robe',    level: 43, stats: { hp: 960, resist: 22, dmg: 8 }, color: 0x3a2a4a, price: 10800 },
  deepwalker_boots:  { name: 'Deepwalker Boots',    slot: 'boots',   level: 42, stats: { hp: 400, acc: 11, pip: 7 }, price: 8800 },
  soulreaver_staff:  { name: 'Soulreaver Staff',    slot: 'wand',    level: 45, stats: { dmg: 35, pip: 11, acc: 8 }, price: 12400 },
  deep_sigil:        { name: 'Sigil of the Deep',   slot: 'amulet',  level: 44, stats: { hp: 640, dmg: 18, resist: 10 }, price: 11200 },
  malvorens_crown:   { name: 'Malvoren\'s Crown',   slot: 'hat',     level: 50, stats: { hp: 760, dmg: 26, pip: 12, acc: 10 }, color: 0xe8e4f0 },
  magisters_staff:   { name: 'Staff of the Magister', slot: 'wand',  level: 50, stats: { dmg: 42, pip: 13, acc: 10 }, color: 0xd06aff },
  pale_mantle:       { name: 'Pale Mantle',         slot: 'cloak',   level: 50, stats: { hp: 700, dmg: 16, resist: 14 }, color: 0xe8e4f0 },
  grimoire_of_ages:  { name: 'Grimoire of Ages',    slot: 'offhand', level: 50, stats: { dmg: 28, acc: 11, heal: 12 }, color: 0x3a1a4a },
  void_ring:         { name: 'Void Ring',           slot: 'ring',    level: 48, stats: { dmg: 18, acc: 10, hp: 280 } },

  // ---------- Thornwood (Chapter 6) ----------
  thornweave_hood:   { name: 'Thornweave Hood',     slot: 'hat',     level: 36, stats: { hp: 460, dmg: 16, resist: 8 }, color: 0x3a6a3a, price: 6400 },
  barkskin_robe:     { name: 'Barkskin Robe',       slot: 'robe',    level: 37, stats: { hp: 820, resist: 20, heal: 8 }, color: 0x6b4a2b, price: 7200 },
  rootwalker_boots:  { name: 'Rootwalker Boots',    slot: 'boots',   level: 36, stats: { hp: 340, acc: 10, pip: 6 }, price: 5800 },
  heartwood_staff:   { name: 'Heartwood Staff',     slot: 'wand',    level: 38, stats: { dmg: 31, pip: 10, acc: 7 }, price: 8400 },
  verdant_heart:     { name: 'Verdant Heart',       slot: 'amulet',  level: 38, stats: { hp: 560, dmg: 16, heal: 10 }, price: 7600 },
  thornmother_crown: { name: 'Thornmother\'s Crown', slot: 'hat',    level: 40, stats: { hp: 620, dmg: 22, pip: 11, acc: 8 }, color: 0x6a3a8a },
  blossom_mantle:    { name: 'Blossom Mantle',      slot: 'cloak',   level: 40, stats: { hp: 560, dmg: 14, heal: 12 }, color: 0xff8ad0 },
  seed_of_life:      { name: 'Seed of Life',        slot: 'offhand', level: 40, stats: { dmg: 24, acc: 9, heal: 10 }, color: 0x9fff7a },
  briar_band:        { name: 'Briar Band',          slot: 'ring',    level: 39, stats: { dmg: 15, acc: 9, hp: 220 } },

  // ---------- Stormspire (Chapter 5) ----------
  stormcaller_hood:  { name: 'Stormcaller Hood',    slot: 'hat',     level: 29, stats: { hp: 380, dmg: 14, resist: 7 }, color: 0x3a3a7a, price: 4200 },
  stormcaller_robe:  { name: 'Stormcaller Robe',    slot: 'robe',    level: 30, stats: { hp: 680, resist: 18, dmg: 6 }, color: 0x4a3a8a, price: 4800 },
  windstep_boots:    { name: 'Windstep Boots',      slot: 'boots',   level: 29, stats: { hp: 280, acc: 9, pip: 5 }, price: 3800 },
  thunderstaff:      { name: 'Thunderstaff',        slot: 'wand',    level: 31, stats: { dmg: 27, pip: 9, acc: 6 }, price: 5600 },
  storm_sigil:       { name: 'Storm Sigil',         slot: 'amulet',  level: 31, stats: { hp: 460, dmg: 14, resist: 9 }, price: 5000 },
  crown_of_thunder:  { name: 'Crown of Thunder',    slot: 'hat',     level: 35, stats: { hp: 520, dmg: 19, pip: 10, acc: 7 }, color: 0x9ff0ff },
  voltaris_mantle:   { name: 'Voltaris\' Mantle',   slot: 'cloak',   level: 35, stats: { hp: 460, dmg: 12, resist: 10 }, color: 0x2a2a5a },
  heart_of_the_storm:{ name: 'Heart of the Storm',  slot: 'offhand', level: 35, stats: { dmg: 22, acc: 8, heal: 6 }, color: 0xb46bff },
  stormfeather_ring: { name: 'Stormfeather Ring',   slot: 'ring',    level: 33, stats: { dmg: 13, acc: 8, hp: 180 } },

  // ---------- the Hollow Undercroft (Warden's set) ----------
  wardens_cowl:      { name: 'Warden\'s Cowl',      slot: 'hat',     level: 14, stats: { hp: 200, dmg: 9, resist: 5 }, color: 0x2a2438 },
  wardens_shroud:    { name: 'Warden\'s Shroud',    slot: 'robe',    level: 15, stats: { hp: 380, resist: 12, heal: 6 }, color: 0x2a2438 },
  bonebound_boots:   { name: 'Bonebound Boots',     slot: 'boots',   level: 14, stats: { hp: 160, acc: 6, pip: 4 } },
  soulglass_orb:     { name: 'Soulglass Orb',       slot: 'offhand', level: 16, stats: { dmg: 12, acc: 5, heal: 6 }, color: 0x7affd0 },
  morvains_crown:    { name: 'Morvain\'s Bone Crown', slot: 'hat',   level: 20, stats: { hp: 320, dmg: 14, pip: 8, acc: 5 }, color: 0xf0e6d0 },

  // ---------- frost gear (Chapter 4) ----------
  frostweave_hood:   { name: 'Frostweave Hood',     slot: 'hat',     level: 22, stats: { hp: 300, dmg: 11, resist: 6 }, color: 0x9fd6ff, price: 2400 },
  glacial_robe:      { name: 'Glacial Robe',        slot: 'robe',    level: 23, stats: { hp: 560, resist: 16, heal: 8 }, color: 0xdff6ff, price: 2800 },
  rimewalker_boots:  { name: 'Rimewalker Boots',    slot: 'boots',   level: 22, stats: { hp: 220, acc: 7, resist: 7, pip: 4 }, price: 2000 },
  icicle_staff:      { name: 'Icicle Staff',        slot: 'wand',    level: 24, stats: { dmg: 22, pip: 8, acc: 5 }, price: 3200 },
  aurora_cloak:      { name: 'Aurora Cloak',        slot: 'cloak',   level: 25, stats: { hp: 360, dmg: 9, heal: 8 }, color: 0x7affd0 },
  crown_of_winter:   { name: 'Crown of Winter',     slot: 'hat',     level: 28, stats: { hp: 420, dmg: 16, pip: 9, acc: 6 }, color: 0xf8fcff },
  sylvaras_mirror:   { name: 'Sylvara\'s Mirror',   slot: 'offhand', level: 28, stats: { dmg: 18, acc: 7, heal: 10 }, color: 0x9fe6ff },
  winterheart:       { name: 'Winterheart Amulet',  slot: 'amulet',  level: 24, stats: { hp: 380, dmg: 12, resist: 8 }, price: 3000 },

  // ---------- rings, cloaks and offhands ----------
  hollow_signet:     { name: 'Hollow Signet',       slot: 'ring',    level: 8,  stats: { dmg: 4, acc: 3 } },
  molten_band:       { name: 'Molten Band',         slot: 'ring',    level: 13, stats: { dmg: 6, pip: 4 } },
  tyrant_ring:       { name: 'Tyrant\'s Ring',      slot: 'ring',    level: 22, stats: { dmg: 10, acc: 6, hp: 120 } },
  traveler_cloak:    { name: 'Traveler\'s Cloak',   slot: 'cloak',   level: 3,  stats: { hp: 40, resist: 2 }, color: 0x6a4a2a, price: 90 },
  starweave_cloak:   { name: 'Starweave Cloak',     slot: 'cloak',   level: 8,  stats: { hp: 90, resist: 4, heal: 4 }, color: 0x3b2d7a, price: 320 },
  ember_mantle:      { name: 'Ember Mantle',        slot: 'cloak',   level: 12, stats: { hp: 140, dmg: 4, resist: 5 }, color: 0xa0301a },
  frostfur_cloak:    { name: 'Frostfur Cloak',      slot: 'cloak',   level: 16, stats: { hp: 200, resist: 8 }, color: 0xdff6ff, price: 1000 },
  wyvern_cape:       { name: 'Wyvern Cape',         slot: 'cloak',   level: 19, stats: { hp: 220, pip: 5, acc: 3 }, color: 0x3a5a8a },
  dragonwing_cloak:  { name: 'Dragonwing Cloak',    slot: 'cloak',   level: 22, stats: { hp: 300, dmg: 8, resist: 8 }, color: 0x8a1a1a },
  apprentice_tome:   { name: 'Apprentice\'s Tome',  slot: 'offhand', level: 2,  stats: { dmg: 2, heal: 3 }, color: 0x7a3a2a, price: 60 },
  crystal_orb:       { name: 'Crystal Orb',         slot: 'offhand', level: 7,  stats: { dmg: 4, acc: 3 }, color: 0x9fd6ff, price: 260 },
  grimoire_of_ash:   { name: 'Grimoire of Ash',     slot: 'offhand', level: 12, stats: { dmg: 7, pip: 3 }, color: 0x5a2a1a },
  storm_orb:         { name: 'Storm Orb',           slot: 'offhand', level: 16, stats: { dmg: 9, acc: 4 }, color: 0xb46bff },
  elder_codex:       { name: 'Elder Codex',         slot: 'offhand', level: 20, stats: { dmg: 11, heal: 8, pip: 4 }, color: 0x6a4aa0 },
  eye_of_vorathrax:  { name: 'Eye of Vorathrax',    slot: 'offhand', level: 22, stats: { dmg: 14, acc: 6 }, color: 0xffd23d },
  gladiator_helm:    { name: 'Gladiator Helm',      slot: 'hat',     level: 10, stats: { hp: 150, dmg: 6, resist: 4 }, color: 0xc0a040 },
  gladiator_robe:    { name: 'Gladiator Robe',      slot: 'robe',    level: 12, stats: { hp: 260, resist: 8, dmg: 4 }, color: 0x8a1a3a },
  gladiator_boots:   { name: 'Gladiator Boots',     slot: 'boots',   level: 10, stats: { hp: 90, acc: 4, pip: 3 } },
  champions_orb:     { name: 'Champion\'s Orb',     slot: 'offhand', level: 18, stats: { dmg: 12, acc: 5, heal: 5 }, color: 0xc542ff },
  slayer_helm:       { name: 'Slayer Helm',         slot: 'hat',     level: 8,  stats: { hp: 110, dmg: 6, acc: 3 }, color: 0x3a3a48 },
  slayer_band:       { name: 'Slayer\'s Band',      slot: 'ring',    level: 12, stats: { dmg: 7, acc: 5 } },
  reaper_cloak:      { name: 'Reaper Cloak',        slot: 'cloak',   level: 16, stats: { hp: 190, dmg: 7, pip: 4 }, color: 0x1a1020 },
  hunters_codex:     { name: 'Hunter\'s Codex',     slot: 'offhand', level: 18, stats: { dmg: 10, acc: 6, pip: 3 }, color: 0x6a3a1a },
  copper_ring:       { name: 'Copper Ring',         slot: 'ring',    level: 2,  stats: { acc: 2, hp: 15 }, crafted: true },
  silver_ring:       { name: 'Silver Ring',         slot: 'ring',    level: 9,  stats: { acc: 4, heal: 5 }, crafted: true },
  gold_ring:         { name: 'Gold Ring',           slot: 'ring',    level: 13, stats: { dmg: 5, acc: 3 }, crafted: true },
  emberite_band:     { name: 'Emberite Band',       slot: 'ring',    level: 15, stats: { dmg: 6, pip: 4 }, crafted: true },
  starmetal_ring:    { name: 'Starmetal Ring',      slot: 'ring',    level: 19, stats: { acc: 6, dmg: 6, resist: 3 }, crafted: true },
  dragonite_ring:    { name: 'Dragonite Ring',      slot: 'ring',    level: 25, stats: { dmg: 10, acc: 6, pip: 4 }, crafted: true },

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
  stormglass_ring:   { name: 'Stormglass Ring',     slot: 'ring',   level: 38, stats: { dmg: 14, acc: 9, pip: 6 }, crafted: true },
  skyoak_staff:      { name: 'Skyoak Staff',        slot: 'wand',   level: 40, stats: { dmg: 30, pip: 9, acc: 7 }, crafted: true },
  voidforged_boots:  { name: 'Voidforged Boots',    slot: 'boots',  level: 46, stats: { hp: 520, resist: 14, acc: 8 }, crafted: true },
  void_amulet:       { name: 'Void Amulet',         slot: 'amulet', level: 48, stats: { hp: 720, dmg: 20, resist: 12 }, crafted: true },
  heartwood_greatstaff: { name: 'Heartwood Greatstaff', slot: 'wand', level: 50, stats: { dmg: 40, pip: 12, acc: 9 }, crafted: true },
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
export const GEAR_SHOP = ['sprigwood_wand', 'apprentice_tome', 'traveler_cloak', 'lanternweave_robe', 'crowfeather_boots', 'crystal_orb', 'ember_cowl', 'starweave_cloak', 'ashwalkers', 'obsidian_rod'];

// ---------------------------------------------------------------- pets

export const PETS = {
  spark_owl:    { name: 'Spark Owl',    school: 'arcane',  kind: 'owl',    color: 0xf2c14e, spell: 'pet_edge',  chance: 0.22, stats: { hp: 40 } },
  moss_sprite:  { name: 'Moss Sprite',  school: 'verdant', kind: 'sprite', color: 0x5fdc6a, spell: 'pet_mend',  chance: 0.22, stats: { heal: 5 } },
  ember_drake:  { name: 'Ember Drake',  school: 'blaze',   kind: 'drake',  color: 0xff6a2b, spell: 'pet_flame', chance: 0.22, stats: { dmg: 3 } },
  frost_pup:    { name: 'Frost Pup',    school: 'frost',   kind: 'pup',    color: 0x9fe6ff, spell: 'pet_ward',  chance: 0.22, stats: { resist: 3 } },
  bat_familiar: { name: 'Bat Familiar', school: 'umbral',  kind: 'bat',    color: 0x9a8cff, spell: 'pet_leech', chance: 0.22, stats: { hp: 30, dmg: 1 } },
  storm_beetle: { name: 'Storm Beetle', school: 'tempest', kind: 'beetle', color: 0xb46bff, spell: 'pet_zap',   chance: 0.22, stats: { acc: 3 } },
  pale_wisp:    { name: 'Pale Wisp',    school: 'umbral',  kind: 'sprite', color: 0xe8e0ff, spell: 'pet_void', chance: 0.3, stats: { dmg: 8, hp: 80 } },
  sproutling:   { name: 'Sproutling',   school: 'verdant', kind: 'sprite', color: 0x9fff7a, spell: 'pet_bloom', chance: 0.25, stats: { heal: 12, hp: 60 } },
  thunderchick: { name: 'Thunderchick', school: 'tempest', kind: 'owl', color: 0x9ff0ff, spell: 'pet_bolt', chance: 0.25, stats: { dmg: 6, acc: 4 } },
  aurora_wisp:  { name: 'Aurora Wisp',  school: 'frost',   kind: 'sprite', color: 0x7affd0, spell: 'pet_aurora', chance: 0.25, stats: { heal: 10, resist: 4 } },
  stormwing:    { name: 'Stormwing Wyrmling', school: 'tempest', kind: 'drake', color: 0x4dc8ff, spell: 'pet_skyfire', chance: 0.25, stats: { dmg: 5, acc: 3 } },
  voidling:     { name: 'Voidling',     school: 'umbral',  kind: 'voidling', color: 0xc542ff, spell: 'pet_void', chance: 0.25, stats: { dmg: 4, hp: 20 }, special: 'Rift upgrade from Warden Nyx' },
};
for (const [id, p] of Object.entries(PETS)) p.id = id;

// ---------------------------------------------------------------- zones

// Walkable regions for each zone (also drawn on the minimap).
// The Hollow Undercroft: a hand-built dungeon beneath Hollow Lane's crypt (see dungeon.js).
// Rooms in local coordinates (x relative to UNDER_X).
export const UNDER_X = -6000;
export const UNDER_ROOMS = [
  { id: 'entry',    type: 'rect', x0: -8,  x1: 8,  z0: 0,   z1: 16 },
  { id: 'c1',       type: 'rect', x0: -2,  x1: 2,  z0: 16,  z1: 24 },
  { id: 'plates',   type: 'rect', x0: -10, x1: 10, z0: 24,  z1: 44 },
  { id: 'c2',       type: 'rect', x0: -2,  x1: 2,  z0: 44,  z1: 52 },
  { id: 'beam',     type: 'rect', x0: -12, x1: 12, z0: 52,  z1: 76 },
  { id: 'c3',       type: 'rect', x0: -2,  x1: 2,  z0: 76,  z1: 84 },
  { id: 'guard',    type: 'rect', x0: -12, x1: 12, z0: 84,  z1: 104 },
  { id: 'gauntlet', type: 'rect', x0: -3,  x1: 3,  z0: 104, z1: 137 },
  { id: 'boss',     type: 'circle', x: 0, z: 152, r: 18 },
];

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
  dragonspire: {
    name: 'Dragonspire Peaks',
    regions: [
      { type: 'circle', x: 1400, z: 0, r: 22 },
      { type: 'rect', x0: 1392, x1: 1408, z0: 16, z1: 92 },
      { type: 'circle', x: 1400, z: 105, r: 22 },
      { type: 'rect', x0: 1414, x1: 1470, z0: 97, z1: 113 },
      { type: 'circle', x: 1484, z: 105, r: 19 },
      { type: 'rect', x0: 1477, x1: 1491, z0: 118, z1: 172 },
      { type: 'circle', x: 1484, z: 192, r: 26 },
    ],
    spawn: { x: 1400, z: -10, heading: 0 },
    atmosphere: { fog: 0x6a7a94, top: 0x1a2440, mid: 0x5a6a8c, bottom: 0xffb080, hemi: 0xd0dcff, fogNear: 45, fogFar: 190 },
    music: 'dragon',
  },
  arena: {
    name: 'Arena of Stars',
    regions: [{ type: 'circle', x: -4200, z: 0, r: 23.5 }],
    spawn: { x: -4200, z: 16, heading: Math.PI },
    atmosphere: { fog: 0x3a2050, top: 0x0a0620, mid: 0x3a2060, bottom: 0xff9a5a, hemi: 0xffd8c0, fogNear: 60, fogFar: 200 },
    music: 'academy',
  },
  homestead: {
    name: 'Your Homestead',
    regions: [{ type: 'circle', x: -2800, z: 0, r: 30 }],
    walk: 'homeWalk',
    freeCam: true,
    spawn: { x: -2800, z: 20, heading: Math.PI },
    atmosphere: { fog: 0x9ab8e0, top: 0x3a6ac0, mid: 0x8ab8f0, bottom: 0xffc0a0, hemi: 0xe0ecff, fogNear: 60, fogFar: 240 },
    music: 'home',
  },
  glacier: {
    name: 'Glacierreach',
    regions: [
      { type: 'circle', x: 2300, z: 0, r: 24 },
      { type: 'rect', x0: 2300 - 8, x1: 2300 + 8, z0: 18, z1: 84 },
      { type: 'circle', x: 2300, z: 105, r: 26 },
      { type: 'rect', x0: 2300 + 18, x1: 2300 + 62, z0: 97, z1: 113 },
      { type: 'circle', x: 2300 + 76, z: 105, r: 18 },
      { type: 'rect', x0: 2300 + 69, x1: 2300 + 83, z0: 118, z1: 170 },
      { type: 'circle', x: 2300 + 76, z: 190, r: 24 },
    ],
    spawn: { x: 2300, z: -10, heading: 0 },
    atmosphere: { fog: 0x8ab0d8, top: 0x0a1a40, mid: 0x4a7ab8, bottom: 0xc8e8ff, hemi: 0xe0f0ff, fogNear: 40, fogFar: 190 },
    music: 'frost',
  },
  hollowdeep: {
    name: 'The Hollow Deep',
    regions: [
      { type: 'circle', x: 5500, z: 0, r: 20 },
      { type: 'rect', x0: 5500 - 6, x1: 5500 + 6, z0: 16, z1: 52 },
      { type: 'circle', x: 5500, z: 66, r: 16 },
      { type: 'rect', x0: 5500 + 14, x1: 5500 + 46, z0: 60, z1: 72 },
      { type: 'circle', x: 5500 + 60, z: 66, r: 16 },
      { type: 'rect', x0: 5500 + 54, x1: 5500 + 66, z0: 80, z1: 110 },
      { type: 'circle', x: 5500 + 60, z: 124, r: 16 },
      { type: 'rect', x0: 5500 + 14, x1: 5500 + 46, z0: 118, z1: 130 },
      { type: 'circle', x: 5500, z: 124, r: 16 },
      { type: 'rect', x0: 5500 - 6, x1: 5500 + 6, z0: 138, z1: 166 },
      { type: 'circle', x: 5500, z: 188, r: 24 },
    ],
    spawn: { x: 5500, z: -8, heading: 0 },
    atmosphere: { fog: 0x1a1428, top: 0x05030a, mid: 0x2a1a3a, bottom: 0x4a3a5a, hemi: 0xb8a8d8, fogNear: 25, fogFar: 130, hemiI: 1.15, sunI: 1.25 },
    music: 'deep',
  },
  thornwood: {
    name: 'Thornwood',
    regions: [
      { type: 'circle', x: 4400, z: 0, r: 24 },
      { type: 'rect', x0: 4400 - 6, x1: 4400 + 6, z0: 20, z1: 62 },
      { type: 'circle', x: 4400, z: 76, r: 18 },
      { type: 'rect', x0: 4400 - 46, x1: 4400 - 14, z0: 70, z1: 82 },
      { type: 'circle', x: 4400 - 60, z: 76, r: 18 },
      { type: 'rect', x0: 4400 - 6, x1: 4400 + 6, z0: 90, z1: 130 },
      { type: 'circle', x: 4400, z: 146, r: 20 },
      { type: 'rect', x0: 4400 - 6, x1: 4400 + 6, z0: 162, z1: 190 },
      { type: 'circle', x: 4400, z: 210, r: 24 },
    ],
    spawn: { x: 4400, z: -10, heading: 0 },
    atmosphere: { fog: 0x5a7a5a, top: 0x1a3a2a, mid: 0x4a8a5a, bottom: 0xc8e0a8, hemi: 0xd8ffd0, fogNear: 30, fogFar: 160 },
    music: 'forest',
  },
  stormspire: {
    name: 'Stormspire',
    regions: [
      { type: 'circle', x: 3300, z: 0, r: 22 },
      { type: 'rect', x0: 3300 - 2.6, x1: 3300 + 2.6, z0: 20, z1: 48 },
      { type: 'circle', x: 3300, z: 62, r: 16 },
      { type: 'rect', x0: 3300 + 14, x1: 3300 + 46, z0: 59.4, z1: 64.6 },
      { type: 'circle', x: 3300 + 60, z: 62, r: 16 },
      { type: 'rect', x0: 3300 + 57.4, x1: 3300 + 62.6, z0: 76, z1: 106 },
      { type: 'circle', x: 3300 + 60, z: 120, r: 16 },
      { type: 'rect', x0: 3300 + 14, x1: 3300 + 46, z0: 117.4, z1: 122.6 },
      { type: 'circle', x: 3300, z: 120, r: 16 },
      { type: 'rect', x0: 3300 - 2.6, x1: 3300 + 2.6, z0: 134, z1: 160 },
      { type: 'circle', x: 3300, z: 180, r: 22 },
    ],
    spawn: { x: 3300, z: -10, heading: 0 },
    atmosphere: { fog: 0x7a7aaa, top: 0x1a1a4a, mid: 0x5a5a9a, bottom: 0xd0c8f0, hemi: 0xe0d8ff, fogNear: 60, fogFar: 240 },
    music: 'storm',
  },
  undercroft: {
    name: 'The Hollow Undercroft',
    regions: UNDER_ROOMS.map(r => r.type === 'circle' ? { ...r, x: UNDER_X + r.x } : { ...r, x0: UNDER_X + r.x0, x1: UNDER_X + r.x1 }),
    walk: 'underWalk',
    freeCam: true,
    spawn: { x: UNDER_X, z: 5, heading: 0 },
    atmosphere: { fog: 0x12101c, top: 0x040308, mid: 0x1a1428, bottom: 0x2a2238, hemi: 0xa8b8d8, fogNear: 20, fogFar: 78, hemiI: 1.05, sunI: 1.1 },
    music: 'crypt',
  },
  // the Endless Rift is rebuilt for every floor (see rift.js)
  rift: {
    name: 'The Endless Rift',
    regions: [],
    grid: true,
    walk: 'riftWalk',
    freeCam: true,
    spawn: { x: -1400, z: 0, heading: 0 },
    atmosphere: { fog: 0x1a0a2e, top: 0x05020a, mid: 0x2a1045, bottom: 0x5a2a8a, hemi: 0xb09aff, fogNear: 22, fogFar: 80, hemiI: 1.1, sunI: 1.2 },
    music: 'rift',
  },
};
export const DRAGON_X = 1400;
export const GLACIER_X = 2300;
export const STORM_X = 3300;
export const THORN_X = 4400;
export const DEEP_X = 5500;
export function zoneAt(x) { return x < -5000 ? 'undercroft' : x < -3500 ? 'arena' : x < -2100 ? 'homestead' : x < -1000 ? 'rift' : x > 4950 ? 'hollowdeep' : x > 3850 ? 'thornwood' : x > 2850 ? 'stormspire' : x > 1950 ? 'glacier' : x > 1050 ? 'dragonspire' : x > 350 ? 'emberfall' : 'academy'; }

// Named places inside a zone: they get their own title card and music.
export const AREAS = [
  { id: 'meadow', name: 'Millbrook Meadow', x0: 34, x1: 160, z0: -70, z1: 70, music: 'meadow' },
  { id: 'lane', name: 'Hollow Lane', x0: -12, x1: 12, z0: 30, z1: 170, music: 'academy' },
  { id: 'bonefield', name: 'The Bone Field', x0: 1370, x1: 1430, z0: 84, z1: 130, music: 'dragon' },
  { id: 'cliffs', name: 'Wyvern Cliffs', x0: 1462, x1: 1506, z0: 84, z1: 125, music: 'dragon' },
  { id: 'roost', name: "The Dragon's Roost", x0: 1455, x1: 1515, z0: 165, z1: 225, music: 'dragon' },
  { id: 'refuge', name: 'The Last Refuge', x0: 5500 - 22, x1: 5500 + 22, z0: -22, z1: 18, music: 'deep' },
  { id: 'weeping', name: 'The Weeping Shore', x0: 5500 - 18, x1: 5500 + 18, z0: 48, z1: 84, music: 'deep' },
  { id: 'ossuary', name: 'The Ossuary', x0: 5500 + 42, x1: 5500 + 78, z0: 48, z1: 84, music: 'crypt' },
  { id: 'echohalls', name: 'The Echo Halls', x0: 5500 + 42, x1: 5500 + 78, z0: 106, z1: 142, music: 'battle' },
  { id: 'palegate', name: 'The Pale Gate', x0: 5500 - 18, x1: 5500 + 18, z0: 106, z1: 142, music: 'deep' },
  { id: 'palespire', name: 'The Pale Spire', x0: 5500 - 26, x1: 5500 + 26, z0: 162, z1: 214, music: 'boss' },
  { id: 'greenhollow', name: 'Greenhollow', x0: 4400 - 26, x1: 4400 + 26, z0: -26, z1: 20, music: 'forest' },
  { id: 'mossyglade', name: 'The Mossy Glade', x0: 4400 - 18, x1: 4400 + 18, z0: 58, z1: 94, music: 'forest' },
  { id: 'glowcap', name: 'The Glowcap Hollow', x0: 4400 - 78, x1: 4400 - 42, z0: 58, z1: 94, music: 'forest' },
  { id: 'blightgrove', name: 'The Blighted Grove', x0: 4400 - 20, x1: 4400 + 20, z0: 126, z1: 166, music: 'crypt' },
  { id: 'heartwood', name: 'The Heartwood', x0: 4400 - 24, x1: 4400 + 24, z0: 186, z1: 234, music: 'boss' },
  { id: 'skyport', name: 'Skyport', x0: 3300 - 24, x1: 3300 + 24, z0: -24, z1: 20, music: 'storm' },
  { id: 'windisle', name: 'The Isle of Winds', x0: 3300 - 18, x1: 3300 + 18, z0: 46, z1: 80, music: 'storm' },
  { id: 'thunderisle', name: 'Thunder Isle', x0: 3300 + 42, x1: 3300 + 78, z0: 44, z1: 80, music: 'storm' },
  { id: 'crystalspire', name: 'The Crystal Spire', x0: 3300 + 42, x1: 3300 + 78, z0: 102, z1: 138, music: 'storm' },
  { id: 'raidersroost', name: 'Raiders\' Roost', x0: 3300 - 18, x1: 3300 + 18, z0: 102, z1: 138, music: 'battle' },
  { id: 'stormeye', name: 'The Eye of the Storm', x0: 3300 - 24, x1: 3300 + 24, z0: 158, z1: 204, music: 'boss' },
  { id: 'frostholm', name: 'Frostholm', x0: 2300 - 26, x1: 2300 + 26, z0: -26, z1: 20, music: 'frost' },
  { id: 'mirrorlake', name: 'The Mirror Lake', x0: 2300 - 28, x1: 2300 + 28, z0: 80, z1: 132, music: 'frost' },
  { id: 'caverns', name: 'The Rime Caverns', x0: 2300 + 58, x1: 2300 + 95, z0: 86, z1: 124, music: 'frost' },
  { id: 'icecastle', name: "Sylvara's Ice Castle", x0: 2300 + 50, x1: 2300 + 102, z0: 165, z1: 216, music: 'boss' },
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
  { id: 'portal_dragon', x: -26, z: -4, to: { x: 1400, z: -8, heading: 0 }, dest: 'Dragonspire Peaks', unlock: 14, rot: Math.PI / 2, color: 0x4dc8ff },
  { id: 'portal_dragon_back', x: 1400, z: -19, to: { x: -13, z: -4, heading: Math.PI / 2 }, dest: 'Starfall Academy', unlock: 0, color: 0xb46bff },
  { id: 'portal_glacier', x: -22, z: -19, to: { x: 2300, z: -8, heading: 0 }, dest: 'Glacierreach', unlock: 23, rot: 0.86, color: 0xdff6ff },
  { id: 'portal_deep', x: 24, z: 8, to: { x: 5500, z: -6, heading: 0 }, dest: 'The Hollow Deep', unlock: 44, rot: -1.89, color: 0x3a1a4a },
  { id: 'portal_deep_back', x: 5500, z: -18, to: { x: 20.5, z: 6.5, heading: -1.89 }, dest: 'Starfall Academy', unlock: 0, color: 0xb46bff },
  { id: 'portal_thorn', x: 25, z: -10, to: { x: 4400, z: -8, heading: 0 }, dest: 'Thornwood', unlock: 37, rot: -1.19, color: 0x7aff7a },
  { id: 'portal_thorn_back', x: 4400, z: -20, to: { x: 21.5, z: -8.5, heading: -1.19 }, dest: 'Starfall Academy', unlock: 0, color: 0xb46bff },
  { id: 'portal_storm', x: -17, z: 25, to: { x: 3300, z: -8, heading: 0 }, dest: 'Stormspire', unlock: 30, rot: 2.54, color: 0xc8b8ff },
  { id: 'portal_storm_back', x: 3300, z: -18, to: { x: -14.5, z: 21.5, heading: 2.54 }, dest: 'Starfall Academy', unlock: 0, color: 0xb46bff },
  { id: 'portal_glacier_back', x: 2300, z: -20, to: { x: -18, z: -15, heading: 0.86 }, dest: 'Starfall Academy', unlock: 0, color: 0xb46bff },
  { id: 'portal_home', x: 64, z: 16, to: { x: -2800, z: 21, heading: Math.PI }, dest: 'Your Homestead', unlock: 0, color: 0x7affb0 },
  { id: 'portal_home_back', x: -2800, z: 26, to: { x: 64, z: 12, heading: Math.PI }, dest: 'Millbrook Meadow', unlock: 0, color: 0x7affb0 },
];
PORTALS[0].rot = Math.PI / 2;
PORTALS[0].color = 0xff7a3d;

// ---------------------------------------------------------------- mounts & travel

// Press X to ride (outside of battle). speed: extra movement speed while mounted.
export const MOUNTS = {
  steed:     { name: 'Starfall Steed', icon: '🐴', speed: 0.6,  price: 500,  level: 3,  desc: 'A gentle lavender horse from the academy stables.' },
  wolf:      { name: 'Dire Wolf',      icon: '🐺', speed: 0.7,  price: 1200, level: 8,  desc: 'Fast, loyal, and only a little bitey.' },
  emberback: { name: 'Emberback',      icon: '🦎', speed: 0.75, price: 1800, level: 12, desc: 'A fire lizard from Emberfall. Warm to ride.' },
  elk:       { name: 'Frost Elk',      icon: '🦌', speed: 0.8,  price: 2600, level: 16, desc: 'Sure-footed on the snowiest mountain path.' },
  stalker:   { name: 'Void Stalker',   icon: '🐈‍⬛', speed: 0.85, price: 0, level: 1, unlock: 'rift', desc: 'Earned by reaching floor 20 of the Endless Rift.' },
  drake:     { name: 'Sky Drake',      icon: '🐉', speed: 0.9,  price: 0, level: 1, unlock: 'vorathrax', desc: 'Earned by slaying Vorathrax, the Sky Tyrant.' },
  nightmare: { name: 'Pale Nightmare', icon: '🐎', speed: 1.0,  price: 0, level: 1, unlock: 'malvoren', desc: 'Earned by defeating Malvoren, the Pale Magister.' },
};

// Waystones: touch one to remember it, then fast-travel back from the World Atlas (N).
export const WAYSTONES = [
  { id: 'ws_academy', name: 'Starfall Courtyard', zone: 'academy', x: 8, z: -13 },
  { id: 'ws_lane', name: 'Hollow Lane Gate', zone: 'academy', x: -5, z: 33 },
  { id: 'ws_meadow', name: 'Millbrook Meadow', zone: 'academy', x: 61, z: 5.5 },
  { id: 'ws_ember', name: 'Emberfall Camp', zone: 'emberfall', x: 695, z: 10 },
  { id: 'ws_skyhold', name: 'Skyhold Camp', zone: 'dragonspire', x: 1396, z: 10 },
  { id: 'ws_bonefield', name: 'The Bone Field', zone: 'dragonspire', x: 1395, z: 89 },
  { id: 'ws_roost', name: 'Roost Approach', zone: 'dragonspire', x: 1480, z: 124 },
  { id: 'ws_home', name: 'Your Homestead', zone: 'homestead', x: -2792, z: 22 },
  { id: 'ws_refuge', name: 'The Last Refuge', zone: 'hollowdeep', x: 5500 - 5, z: 11 },
  { id: 'ws_ossuary', name: 'The Ossuary', zone: 'hollowdeep', x: 5500 + 52, z: 76 },
  { id: 'ws_palegate', name: 'The Pale Gate', zone: 'hollowdeep', x: 5500 + 9, z: 132 },
  { id: 'ws_greenhollow', name: 'Greenhollow', zone: 'thornwood', x: 4400 - 5, z: 12 },
  { id: 'ws_glade', name: 'The Mossy Glade', zone: 'thornwood', x: 4400 + 9, z: 66 },
  { id: 'ws_grove', name: 'Blighted Grove', zone: 'thornwood', x: 4400 + 10, z: 134 },
  { id: 'ws_skyport', name: 'Skyport', zone: 'stormspire', x: 3300 - 5, z: 12 },
  { id: 'ws_spire', name: 'The Crystal Spire', zone: 'stormspire', x: 3300 + 52, z: 112 },
  { id: 'ws_eye', name: 'Eye of the Storm Bridge', zone: 'stormspire', x: 3300 + 9, z: 166 },
  { id: 'ws_frostholm', name: 'Frostholm', zone: 'glacier', x: 2300 - 4, z: 12 },
  { id: 'ws_lake', name: 'The Mirror Lake', zone: 'glacier', x: 2300 - 6, z: 82 },
  { id: 'ws_castle', name: 'Castle Stair', zone: 'glacier', x: 2300 + 72, z: 124 },
];

// Spirits that rise at dusk and fade at dawn.
export const NIGHT_SPAWNS = [
  { enemy: 'lane_wraith', x: -3, z: 60, r: 5 }, { enemy: 'lane_wraith', x: 3, z: 92, r: 5 }, { enemy: 'lane_wraith', x: 0, z: 118, r: 5 },
  { enemy: 'meadow_wisp', x: 72, z: -12, r: 6 }, { enemy: 'meadow_wisp', x: 102, z: 32, r: 6 }, { enemy: 'meadow_wisp', x: 62, z: 38, r: 6 },
];

// Healing fountains.
export const FOUNTAINS = [
  { id: 'spring_dragon', name: 'Skyhold Spring', x: 1391, z: 12, r: 4.5 },
  { id: 'fountain', name: 'Wellspring', x: 0, z: 0, r: 5.2 },
  { id: 'spring_ember', name: 'Cooling Spring', x: X - 9, z: -7, r: 4.5 },
  { id: 'hearth_glacier', name: 'Frostholm Hearth', x: GLACIER_X, z: 0, r: 5.5 },
  { id: 'fountain_storm', name: 'Skyport Fountain', x: STORM_X, z: 0, r: 5.2 },
  { id: 'well_thorn', name: 'Greenhollow Spring', x: THORN_X, z: 0, r: 5.2 },
  { id: 'font_deep', name: 'Refuge Wellspring', x: DEEP_X, z: 0, r: 5.2 },
];
