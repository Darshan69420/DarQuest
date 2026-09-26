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
  p.archive = { seed, room: 0, kills: 0, defeated: [], status: 'active' };
  return true;
}
export function archiveKill(p, index) {
  const run = p.archive;
  if (!run || run.status !== 'active' || !archiveWave(run.seed, run.room)[index] || run.defeated.includes(index)) return false;
  run.defeated.push(index);
  run.kills = run.defeated.length;
  if (run.kills === archiveWave(run.seed, run.room).length) run.status = run.room === 3 ? 'claim' : 'cleared';
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
  const reward = { xp: 420, gold: 175, wins: ++p.archiveWins };
  p.archive = null;
  return reward;
}
export function archiveText(p) {
  const run = p.archive;
  if (!run) return '';
  const room = ARCHIVE_ROOMS[run.room];
  if (run.status === 'active') return `${room.name} · ${run.kills}/${archiveWave(run.seed, run.room).length} foes · ${ARCHIVE_MODIFIERS[archiveModifier(run)].name}${run.rune ? ` · ${ARCHIVE_RUNES[run.rune].name}` : ''}`;
  return `${room.name} · ${run.status === 'claim' ? 'claim your prize' : run.status === 'rest' ? 'choose a respite' : 'door open'}${run.rune ? ` · ${ARCHIVE_RUNES[run.rune].name}` : ''}`;
}
