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
export function restArchive(p, choice) {
  if (p.archive?.room !== 2 || p.archive.status !== 'rest' || !['heal', 'scroll'].includes(choice)) return false;
  p.archive.status = 'cleared';
  if (choice === 'heal') { p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp * 0.5)); p.mana = p.maxMana; }
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
  if (run.status === 'active') return `${room.name} · ${run.kills}/${archiveWave(run.seed, run.room).length} foes`;
  return `${room.name} · ${run.status === 'claim' ? 'claim your prize' : run.status === 'rest' ? 'choose a respite' : 'door open'}`;
}
