// The Bestiary (every foe you have met, with lore and hunter bonuses) and Achievements
// (goals across the whole game that reward gold and titles).
import { ENEMIES, PETS, WAYSTONES, SLOTS, SPELLS } from './data.js';
import { setProgress } from './gear.js';
import { SKILLS, skillLevel, totalLevel } from './skills.js';
import { SIDE_QUESTS } from './sidequests.js';
import { SHOUTS } from './shouts.js';

export const LORE = {
  gloomsprig: 'A weed that drank from a puddle of shadow. It giggles when it bites.',
  cinder_rat: 'Rats that nested in a chimney too long. Their tails are still smouldering.',
  frost_wisp: 'A little winter spirit that forgot it was supposed to melt in spring.',
  hollow_knight: 'Empty armour, filled with Hollowmere\'s will instead of a knight.',
  storm_crow: 'Crows that roost in thunderclouds. Seeing one is bad luck; seeing three is worse.',
  lord_hollowmere: 'Once Starfall\'s brightest student, he traded his heart for the shadows.',
  lava_imp: 'Mischief-makers born from bubbles in the lava. They think setting things on fire is hilarious.',
  cinderhound: 'Pack hunters of the Emberfall Wilds. Their howl makes the whole pack stronger.',
  ashen_shaman: 'Cultists of flame who chant to keep the volcano angry.',
  obsidian_golem: 'Cooled lava given life. Fire slides right off; lightning cracks it.',
  magma_serpent: 'Serpents that swim through lava as easily as fish through water.',
  magma_guard: 'Pyrrhon\'s personal guard, forged from the heart of the volcano.',
  pyrrhon: 'The Molten King, who believed the whole world should burn as brightly as he did.',
  lane_wraith: 'At night the old residents of Hollow Lane come back to walk their street.',
  meadow_wisp: 'Harmless little lights... until you follow one off the path.',
  wyrmling: 'Freshly hatched dragons. Small, fast and very, very hungry.',
  drake: 'Wingless dragons that nest among the bones of their ancestors.',
  dragon_cultist: 'Wizards of the Scaled Cult, who worship dragons and wake them from their sleep.',
  wyvern: 'Two-legged storm dragons that dive from the clouds like falling stars.',
  vorathrax: 'The Sky Tyrant. Three centuries asleep, and she woke up angry.',
  snow_wolf: 'They hunt in packs along the Frostholm road, and their howl sharpens their bite.',
  frost_wraith: 'The frozen dead of the Mirror Lake. They remember the Queen\'s cold, and share it.',
  yeti: 'Shaggy giants from the high peaks. Surprisingly gentle, when nobody is watching.',
  ice_golem: 'Rime Golems, carved by the Queen herself. A pale crystal beats where a heart should be.',
  frost_drake: 'Dragons of the far north, with breath so cold it freezes spells in the air.',
  pale_warden: 'Morvain kept the Pale Magister\'s vault for a hundred years, and forgot how to do anything else.',
  sylvara: 'The Queen of the Frozen Crown. Once kind. Then the Pale Magister came to court.',
};

// Hunter's knowledge: the more of a kind you defeat, the harder you hit them.
export function hunterBonus(kills) { return kills >= 100 ? 0.1 : kills >= 50 ? 0.07 : kills >= 20 ? 0.04 : kills >= 5 ? 0.02 : 0; }
export function hunterRank(kills) { return kills >= 100 ? 'Master' : kills >= 50 ? 'Expert' : kills >= 20 ? 'Adept' : kills >= 5 ? 'Novice' : ''; }

const kills = (p) => p.stats_log?.kills || 0;
const bossKilled = (p, id) => (p.bestiary?.[id] || 0) > 0;
const maxSkill = (p) => Math.max(...Object.keys(SKILLS).map(s => skillLevel(p, s)));
const allGear = (p) => [...p.inventory, ...Object.values(p.equipped || {})];

// title: the title this achievement unlocks (shown after your name).
const A = (id, name, icon, desc, check, reward = {}) => ({ id, name, icon, desc, check, reward });
export const ACHIEVEMENTS = [
  // battle
  A('first_blood', 'First Spark', '✨', 'Defeat your first foe', p => kills(p) >= 1, { gold: 10 }),
  A('hunter_100', 'Hunter', '🏹', 'Defeat 100 foes', p => kills(p) >= 100, { gold: 150 }),
  A('hunter_500', 'Monster Bane', '⚔️', 'Defeat 500 foes', p => kills(p) >= 500, { gold: 600, title: 'the Monster Bane' }),
  A('hunter_2000', 'Legend of the Wilds', '🗡️', 'Defeat 2,000 foes', p => kills(p) >= 2000, { gold: 2000, title: 'the Unstoppable' }),
  A('hollowmere', 'Out of the Shadows', '💀', 'Defeat Lord Hollowmere', p => bossKilled(p, 'lord_hollowmere'), { title: 'the Brave' }),
  A('pyrrhon', 'Flamebreaker', '🔥', 'Defeat Pyrrhon, the Molten King', p => bossKilled(p, 'pyrrhon'), { title: 'Flamebreaker' }),
  A('vorathrax', 'Dragonslayer', '🐉', 'Slay Vorathrax, the Sky Tyrant', p => bossKilled(p, 'vorathrax'), { title: 'the Dragonborn' }),
  A('sylvara', 'Winter\'s End', '👑', 'Free Queen Sylvara from the Magister\'s spell', p => bossKilled(p, 'sylvara'), { gold: 1000, title: 'the Thaw' }),
  A('frost_dragons', 'Wings of Winter', '❄️', 'Slay 10 Frost Dragons', p => (p.bestiary?.frost_drake || 0) >= 10, { gold: 600, title: 'Frostwing' }),
  A('undercroft', 'Into the Undercroft', '⚰️', 'Conquer the Hollow Undercroft', p => (p.undercroft?.clears || 0) + (p.undercroft?.heroicClears || 0) >= 1, { gold: 400 }),
  A('undercroft_heroic', 'Heroic Delver', '🗝️', 'Conquer the Hollow Undercroft on Heroic', p => (p.undercroft?.heroicClears || 0) >= 1, { gold: 1200, title: 'the Tomb Breaker' }),
  A('undercroft_fast', 'Speed Delver', '⏱️', 'Clear the Undercroft in under 6 minutes', p => [p.undercroft?.best, p.undercroft?.bestHeroic].some(t => t && t < 360), { gold: 600 }),
  A('level_50', 'Grand Archmage', '🌟', 'Reach the level cap (50)', p => p.level >= 50, { gold: 3000, title: 'the Grand Archmage' }),
  A('arch_10', 'Beyond the Cap', '✦', 'Reach Archmage rank 10', p => (p.arch || 0) >= 10, { gold: 2000 }),
  A('ngplus', 'Once More, With Feeling', '⭐', 'Begin New Game+', p => (p.ngplus || 0) >= 1, { gold: 1000, title: 'the Returned' }),
  A('ngplus_3', 'Eternal', '♾️', 'Begin New Game+ 3', p => (p.ngplus || 0) >= 3, { gold: 5000, title: 'the Eternal' }),
  A('weekly_all', 'Weekly Warrior', '📅', 'Finish all three weekly challenges in one week', p => (p.stats_log?.weeklyAll || 0) >= 1, { gold: 800 }),
  A('second_school', 'Dual Scholar', '📚', 'Learn a spell from your second school', p => !!p.second && p.known.some(id => SPELLS[id]?.school === p.second), { gold: 300, title: 'the Versatile' }),
  A('set_full', 'Dressed for the Part', '🔗', 'Wear every piece of a gear set', p => setProgress(p.equipped).some(s => s.count >= s.set.pieces.length), { gold: 500 }),
  A('combo_50', 'Combo Artist', '🌠', 'Land 50 combo strikes', p => (p.stats_log.combos || 0) >= 50, { gold: 200 }),
  A('night_20', 'Night Watch', '🌙', 'Defeat 20 night spirits', p => (p.stats_log.nightKills || 0) >= 20, { gold: 300, title: 'the Night Stalker' }),
  A('hunter_master', 'Know Thy Enemy', '📖', 'Reach Master hunter rank on any foe (100 defeats)', p => Object.values(p.bestiary || {}).some(n => n >= 100), { gold: 500 }),
  A('bestiary_all', 'Naturalist', '🦋', 'Fill in every page of the Bestiary', p => Object.keys(ENEMIES).every(id => (p.bestiary?.[id] || 0) > 0), { gold: 1500, title: 'the Naturalist' }),
  // growing up
  A('level_5', 'Apprentice No More', '⭐', 'Reach level 5', p => p.level >= 5, { gold: 50 }),
  A('level_10', 'Journeyman', '🌟', 'Reach level 10', p => p.level >= 10, { gold: 200 }),
  A('level_20', 'Archmage', '💫', 'Reach level 20', p => p.level >= 20, { gold: 800, title: 'the Archmage' }),
  A('talent_cap', 'Mastery', '🌳', 'Learn a capstone talent', p => Object.entries(p.talents || {}).some(([id, r]) => r > 0 && ['supernova', 'phoenix_soul', 'living_flame', 'glacial_fortress', 'absolute_zero', 'northern_wind', 'skyfall', 'superconductor', 'eye_wall', 'world_tree', 'strangler_vine', 'beastmaster', 'deaths_door', 'doom', 'void_walker', 'starfall_combo', 'archmage', 'arcane_bulwark'].includes(id)), { gold: 300 }),
  // skills
  A('skill_10', 'Handy', '🔨', 'Reach level 10 in any skill', p => maxSkill(p) >= 10, { gold: 50 }),
  A('skill_30', 'Skilled', '🛠️', 'Reach level 30 in any skill', p => maxSkill(p) >= 30, { gold: 300 }),
  A('skill_50', 'Expert', '🏅', 'Reach level 50 in any skill', p => maxSkill(p) >= 50, { gold: 1000, title: 'the Expert' }),
  A('skill_99', 'Mastered', '👑', 'Reach level 99 in any skill', p => maxSkill(p) >= 99, { gold: 10000, title: 'the Grandmaster' }),
  A('total_100', 'Well Rounded', '🎯', 'Reach a total skill level of 100', p => totalLevel(p) >= 100, { gold: 300 }),
  A('total_300', 'Jack of All Trades', '🃏', 'Reach a total skill level of 300', p => totalLevel(p) >= 300, { gold: 1500, title: 'of All Trades' }),
  A('gather_500', 'Busy Hands', '🪓', 'Gather 500 resources', p => (p.stats_log.gathered || 0) >= 500, { gold: 400 }),
  A('craft_100', 'Maker', '⚒️', 'Craft 100 things', p => (p.stats_log.crafted || 0) >= 100, { gold: 400, title: 'the Maker' }),
  A('guild_all', 'Guild Member', '🌾', 'Finish every Gatherers\' Guild quest', p => SIDE_QUESTS.filter(q => q.giver === 'brisa').every(q => p.side?.[q.id]?.state === 'done'), { gold: 500, title: 'of the Guild' }),
  A('slayer_20', 'Slayer', '💀', 'Reach Slayer level 20', p => skillLevel(p, 'slayer') >= 20, { gold: 500, title: 'the Slayer' }),
  // the rift
  A('rift_5', 'Into the Rift', '🌀', 'Reach floor 5 of the Endless Rift', p => p.rift.best >= 5, { gold: 200 }),
  A('rift_10', 'Deep Diver', '🕳️', 'Reach floor 10 of the Endless Rift', p => p.rift.best >= 10, { gold: 600 }),
  A('rift_20', 'Rift Walker', '🌌', 'Reach floor 20 of the Endless Rift', p => p.rift.best >= 20, { gold: 2000, title: 'the Rift Walker' }),
  A('rift_runs', 'Glutton for Punishment', '🔁', 'Start 10 Rift runs', p => p.rift.runs >= 10, { gold: 300 }),
  // dragons
  A('first_shout', 'Thu\'um', '🗣️', 'Learn your first dragon shout', p => Object.keys(p.dragon?.shouts || {}).length >= 1, { gold: 200 }),
  A('all_shouts', 'Voice of the Mountain', '⛰️', 'Learn all six dragon shouts', p => Object.keys(SHOUTS).every(s => (p.dragon?.shouts?.[s] || 0) > 0), { gold: 1500, title: 'Voice of the Mountain' }),
  A('souls_10', 'Soul Eater', '👻', 'Absorb 10 dragon souls (spent or not)', p => (p.stats_log.souls || 0) >= 10, { gold: 800 }),
  // exploring & collecting
  A('waystones', 'Wayfarer', '🗿', 'Discover every waystone', p => WAYSTONES.every(w => p.waystones?.includes(w.id)), { gold: 500, title: 'the Wayfarer' }),
  A('pets_5', 'Beastmaster', '🐾', 'Own 5 pets', p => p.pets.length >= 5, { gold: 500, title: 'the Beastmaster' }),
  A('mounts_3', 'Stable Keeper', '🐴', 'Own 3 mounts', p => (p.mounts?.length || 0) >= 3, { gold: 500 }),
  A('legendary', 'Legendary', '🧡', 'Own a legendary item', p => allGear(p).some(g => g?.r === 'legendary'), { gold: 500, title: 'the Legendary' }),
  A('full_kit', 'Dressed for Adventure', '🎒', 'Wear something in all 8 gear slots', p => Object.keys(SLOTS).every(s => p.equipped?.[s]), { gold: 300 }),
  A('blocks_100', 'Builder', '🧱', 'Have 100 blocks placed at your Homestead', p => (p.home?.blocks?.length || 0) >= 100, { gold: 300 }),
  A('blocks_500', 'Architect', '🏛️', 'Have 500 blocks placed at your Homestead', p => (p.home?.blocks?.length || 0) >= 500, { gold: 1500, title: 'the Architect' }),
  A('arena_gold', 'Crowd Favourite', '🥇', 'Reach Gold rank in the Arena of Stars', p => (p.arena?.rank || 0) >= 2, { gold: 800 }),
  A('arena_champion', 'Arena Champion', '🏆', 'Defeat Grand Magus Elyndra and become Starfall Champion', p => !!p.arena?.champion, { gold: 3000, title: 'the Champion' }),
  A('companion', 'Better Together', '🤝', 'Hire a companion', p => (p.companions?.length || 0) >= 1, { gold: 100 }),
  A('rich', 'Fat Purse', '💰', 'Hold 10,000 gold at once', p => p.gold >= 10000, { title: 'the Wealthy' }),
];
export const ACH = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

// Checks every achievement and returns the ones just earned (the caller hands out rewards).
export function checkAchievements(p) {
  const got = [];
  for (const a of ACHIEVEMENTS) {
    if (p.achievements[a.id]) continue;
    try { if (a.check(p)) { p.achievements[a.id] = Date.now(); got.push(a); } } catch { /* data not there yet */ }
  }
  return got;
}

export function unlockedTitles(p) {
  return ACHIEVEMENTS.filter(a => a.reward.title && p.achievements[a.id]).map(a => a.reward.title);
}

// "Nova the Brave", "Nova of the Guild", or "Nova, Flamebreaker".
export function displayName(p) {
  if (!p.title) return p.name;
  return /^(the|of) /.test(p.title) ? `${p.name} ${p.title}` : `${p.name}, ${p.title}`;
}

export const PET_COUNT = Object.keys(PETS).length;
