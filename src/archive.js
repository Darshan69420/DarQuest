// Seeded, resumable four-room dungeon. Pure transitions keep rewards and reloads predictable.
export const ARCHIVE_X = 1400;
export const ARCHIVE_ROOMS = [
  { name: 'Whispering Stacks', z: 0, kind: 'fight' },
  { name: 'Broken Index', z: 36, kind: 'fight' },
  { name: 'The Quiet Alcove', z: 72, kind: 'rest' },
  { name: 'The Last Page', z: 108, kind: 'boss' },
];
const POOLS = [
  [['frost_wisp', 'hollow_knight'], ['storm_crow', 'hollow_knight'], ['gloomsprig', 'obsidian_golem']],
  [['ashen_shaman', 'obsidian_golem', 'storm_crow'], ['cinderhound', 'ashen_shaman', 'lava_imp'], ['hollow_knight', 'obsidian_golem', 'frost_wisp']],
];
export const ARCHIVE_MODIFIERS = {
  fragile: { name: 'Fractured Ink', description: 'Foes have 20% less health but deal 20% more damage.' },
  frenzy: { name: 'Quickened Pages', description: 'Foes attack 25% faster; your combat mana regenerates 50% faster.' },
  resonance: { name: 'Arcane Echo', description: 'Your spells deal 20% more damage; foes deal 15% more damage.' },
};
export const ARCHIVE_RUNES = {
  starlight: { name: 'Starlight Rune', description: '+18% spell damage until you leave.', stats: { dmg: 18 } },
  stone: { name: 'Stone Rune', description: '+14% damage resistance until you leave.', stats: { resist: 14 } },
  swift: { name: 'Swift Rune', description: '+15% spell haste until you leave.', stats: { pip: 15 } },
  heart: { name: 'Heart Rune', description: '+120 maximum health until you leave.', stats: { hp: 120 } },
};
export const ARCHIVE_EVENTS = [
  { name: 'The Torn Ledger', bonusGold: 80, line: 'Its loose pages describe the Curator\'s debts.' },
  { name: 'The Gilded Index', bonusGold: 110, line: 'Gold ink runs through its forbidden index.' },
  { name: 'The Starless Folio', bonusGold: 140, line: 'Its margins promise a treasure no scholar claimed.' },
];
export function archiveEvent(run) {
  if (!run || !Number.isSafeInteger(run.seed)) return null;
  return ARCHIVE_EVENTS[((run.seed ^ 0x51f15e) >>> 0) % ARCHIVE_EVENTS.length];
}
export function archiveModifier(run, room = run?.room) {
  if (!run || !Number.isSafeInteger(run.seed) || !Number.isInteger(room) || room < 0 || room >= ARCHIVE_ROOMS.length) return null;
  const ids = Object.keys(ARCHIVE_MODIFIERS);
  return ids[((run.seed ^ Math.imul(room + 1, 0x9e3779b9)) >>> 0) % ids.length];
}
export function archiveRuneChoices(run) {
  if (!run || !Number.isSafeInteger(run.seed)) return [];
  const ids = Object.keys(ARCHIVE_RUNES);
  const start = ((run.seed ^ 0x6d2b79f5) >>> 0) % ids.length;
  return [ids[start], ids[(start + 1) % ids.length]];
}
export function archiveWave(seed, room) {
  if (room === 3) return ['archive_curator'];
  if (room < 0 || room > 1 || !Number.isSafeInteger(seed)) return [];
  return POOLS[room][(seed + room * 7) % POOLS[room].length];
}
export function startArchive(p, seed = Math.floor(Math.random() * 1000000000)) {
  if (p.archive || !Number.isSafeInteger(seed) || seed < 0) return false;
  p.archive = { seed, room: 0, kills: 0, defeated: [], status: 'active', eventChoice: null, rewardLevel: p.level };
  return true;
}
export function archiveKill(p, index) {
  const run = p.archive;
  if (!run || run.status !== 'active' || !archiveWave(run.seed, run.room)[index] || run.defeated.includes(index)) return false;
  run.defeated.push(index);
  run.kills = run.defeated.length;
  if (run.kills === archiveWave(run.seed, run.room).length) run.status = run.room === 3 ? 'claim' : run.room === 1 ? 'event' : 'cleared';
  return true;
}
export function chooseArchiveEvent(p, choice) {
  const run = p.archive;
  if (!run || run.room !== 1 || run.status !== 'event' ||
      !['seal', 'plunder'].includes(choice) || run.eventChoice) return false;
  run.eventChoice = choice;
  run.status = 'cleared';
  return true;
}
export function advanceArchive(p) {
  const run = p.archive;
  if (!run || run.status !== 'cleared' || run.room >= 3) return false;
  run.room++;
  run.kills = 0;
  run.defeated = [];
  run.status = run.room === 2 ? 'rest' : 'active';
  return true;
}
export function restArchive(p, choice, rune = null) {
  if (p.archive?.room !== 2 || p.archive.status !== 'rest' ||
      !['heal', 'scroll', 'rune'].includes(choice) ||
      (choice === 'rune' && !archiveRuneChoices(p.archive).includes(rune))) return false;
  p.archive.status = 'cleared';
  if (choice === 'heal') { p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp * 0.5)); p.mana = p.maxMana; }
  if (choice === 'rune') p.archive.rune = rune;
  return true;
}
export function claimArchive(p) {
  if (p.archive?.room !== 3 || p.archive.status !== 'claim') return null;
  const run = p.archive;
  const bonusGold = run.eventChoice === 'plunder' ? archiveEvent(run).bonusGold : 0;
  const depth = ARCHIVE_ROOMS.length;
  const multiplier = 1 + 0.15 * (depth - 1);
  const levelBonus = Math.max(0, (run.rewardLevel || p.level) - 5);
  const reward = {
    xp: Math.round((420 + 30 * levelBonus) * multiplier),
    gold: Math.round((175 + 6 * levelBonus) * multiplier) + bonusGold,
    bonusGold, wins: (p.archiveWins || 0) + 1,
  };
  reward.summary = p.lastRunSummary = {
    kind: 'Shattered Archive', outcome: 'completed', depth, totalDepth: ARCHIVE_ROOMS.length,
    seed: run.seed, rune: run.rune || null, event: run.eventChoice || null,
    xp: reward.xp, gold: reward.gold,
  };
  p.archiveWins = reward.wins;
  p.archive = null;
  return reward;
}
export function endArchive(p, outcome = 'abandoned') {
  if (!p.archive) return false;
  const run = p.archive;
  const clearedCurrent = ['cleared', 'event', 'claim'].includes(run.status);
  p.lastRunSummary = {
    kind: 'Shattered Archive', outcome, depth: run.room + (clearedCurrent ? 1 : 0),
    totalDepth: ARCHIVE_ROOMS.length, seed: run.seed, rune: run.rune || null,
    event: run.eventChoice || null, xp: 0, gold: 0,
  };
  p.archive = null;
  return true;
}
export function archiveText(p) {
  const run = p.archive;
  if (!run) return '';
  const room = ARCHIVE_ROOMS[run.room];
  const decision = run.eventChoice === 'seal' ? ' · Curator weakened' :
    run.eventChoice === 'plunder' ? ` · Risk +${archiveEvent(run).bonusGold} gold` : '';
  const rune = run.rune ? ` · ${ARCHIVE_RUNES[run.rune].name}` : '';
  if (run.status === 'active') return `${room.name} · ${run.kills}/${archiveWave(run.seed, run.room).length} foes · ${ARCHIVE_MODIFIERS[archiveModifier(run)].name}${decision}${rune}`;
  return `${room.name} · ${run.status === 'claim' ? 'claim your prize' : run.status === 'rest' ? 'choose a respite' : run.status === 'event' ? 'decide the Folio\'s fate' : 'door open'}${decision}${rune}`;
}
