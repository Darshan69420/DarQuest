// Repeatable contracts share the existing world and enemies. All choices are
// derived from a saved seed, so reloading cannot reroll a difficult stage.
import { ENEMIES, SPAWNS } from './data.js';

export const RIFT_STAGES = 3;
export const RIFT_BOONS = {
  emberheart: { name: 'Emberheart', description: '+14% spell damage', stats: { dmg: 14 } },
  ironbark: { name: 'Ironbark', description: '+100 maximum health', stats: { hp: 100 } },
  starward: { name: 'Starward', description: '+10% damage resistance', stats: { resist: 10 } },
  quicksilver: { name: 'Quicksilver', description: '+12% spell haste', stats: { pip: 12 } },
  keeneye: { name: 'Keen Eye', description: '+12% critical chance', stats: { acc: 12 } },
  lifebloom: { name: 'Lifebloom', description: '+15% healing power', stats: { heal: 15 } },
};

function hash(seed, stage) {
  let n = (seed ^ Math.imul(stage + 1, 0x9e3779b9)) >>> 0;
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  return n >>> 0;
}

export function stageTarget(run, level) {
  const zone = run.zone;
  const inZone = [...new Set(SPAWNS.filter(s => (s.x > 350 ? 'emberfall' : 'academy') === zone)
    .map(s => s.enemy))].filter(id => !ENEMIES[id].boss);
  const pool = inZone
    .filter(id => ENEMIES[id].level <= Math.max(1, level + run.stage));
  // A migrated or unusual save may unlock Emberfall before level 8.
  const eligible = pool.length ? pool : [inZone[0]];
  return eligible[hash(run.seed, run.stage) % eligible.length];
}

export function boonChoices(run) {
  const available = Object.keys(RIFT_BOONS).filter(id => !run.boons.includes(id));
  const start = hash(run.seed, run.stage) % available.length;
  return [0, 1, 2].map(i => available[(start + i) % available.length]);
}

export function startRift(p, seed = Date.now()) {
  if (p.rift) return false;
  const run = {
    seed: seed >>> 0, zone: p.quest.index >= 7 && (seed & 1) ? 'emberfall' : 'academy',
    stage: 0, target: '', kills: 0, status: 'choice', boons: [], rewardLevel: p.level,
  };
  run.target = stageTarget(run, p.level);
  p.rift = run;
  return true;
}

export function chooseBoon(p, id) {
  const run = p.rift;
  if (!run || run.status !== 'choice' || !boonChoices(run).includes(id)) return false;
  run.boons.push(id);
  run.status = 'active';
  return true;
}

export function riftKill(p, enemyId) {
  const run = p.rift;
  if (!run || run.status !== 'active' || run.target !== enemyId) return false;
  run.kills++;
  if (run.kills >= run.stage + 2) {
    run.status = run.stage === RIFT_STAGES - 1 ? 'claim' : 'choice';
    if (run.status === 'choice') {
      run.stage++;
      run.kills = 0;
      run.target = stageTarget(run, p.level);
    }
  }
  return true;
}

export function claimRift(p) {
  if (p.rift?.status !== 'claim') return null;
  const run = p.rift;
  const level = run.rewardLevel || p.level;
  const depth = RIFT_STAGES;
  // Each completed stage after the first adds 15% to the contract payout.
  const multiplier = 1 + 0.15 * (depth - 1);
  const reward = {
    xp: Math.round((120 + 60 * level) * multiplier),
    gold: Math.round((30 + 12 * level) * multiplier),
    wins: (p.riftWins || 0) + 1,
  };
  reward.summary = p.lastRunSummary = {
    kind: 'Rift Contract', outcome: 'completed', depth, totalDepth: RIFT_STAGES,
    seed: run.seed, boons: [...run.boons], xp: reward.xp, gold: reward.gold,
  };
  p.rift = null;
  p.riftWins = reward.wins;
  return reward;
}

export function endRift(p, outcome = 'abandoned') {
  const hadRun = !!p.rift;
  if (p.rift) p.lastRunSummary = {
    kind: 'Rift Contract', outcome, depth: p.rift.status === 'claim' ? RIFT_STAGES : p.rift.stage,
    totalDepth: RIFT_STAGES, seed: p.rift.seed, boons: [...p.rift.boons], xp: 0, gold: 0,
  };
  p.rift = null;
  return hadRun;
}

export function riftText(p) {
  const run = p.rift;
  if (!run) return `No active contract · ${p.riftWins || 0} completed`;
  if (run.status === 'claim') return 'All stages cleared! Return to the Riftkeeper for your reward.';
  if (run.status === 'choice') return `Stage ${run.stage + 1}/${RIFT_STAGES}: return to the Riftkeeper and choose a boon.`;
  return `Stage ${run.stage + 1}/${RIFT_STAGES} · ${run.zone === 'academy' ? 'Hollow Lane' : 'Emberfall'}: defeat ${ENEMIES[run.target].name} (${run.kills}/${run.stage + 2})${run.stage ? ` · Rift foes +${run.stage * 15}% damage` : ''}`;
}
