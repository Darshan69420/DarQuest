import test from 'node:test';
import assert from 'node:assert/strict';
import { newPlayer, save, load } from '../src/state.js';
import { startRift, chooseBoon, boonChoices, riftKill, claimRift, endRift } from '../src/rifts.js';
import { startArchive, archiveWave, archiveKill, chooseArchiveEvent, advanceArchive, restArchive, claimArchive, endArchive, archiveRuneChoices } from '../src/archive.js';

test('completed Rift pays depth bonus once and records choices at its starting level', () => {
  const p = newPlayer('Runner', 'frost');
  p.level = 5;
  startRift(p, 41);
  p.level = 6;
  for (let stage = 0; stage < 3; stage++) {
    chooseBoon(p, boonChoices(p.rift)[0]);
    const target = p.rift.target;
    for (let i = 0; i < stage + 2; i++) riftKill(p, target);
  }
  const reward = claimRift(p);
  assert.equal(reward.xp, 546);
  assert.equal(reward.gold, 117);
  assert.equal(reward.summary.depth, 3);
  assert.equal(reward.summary.boons.length, 3);
  assert.equal(reward.summary.seed, 41);
  assert.deepEqual(p.lastRunSummary, reward.summary);
  assert.equal(claimRift(p), null);
});

test('Archive reward scales above level five and summary survives save/reload', () => {
  const prior = globalThis.localStorage;
  const data = new Map();
  globalThis.localStorage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  try {
    const p = newPlayer('Delver', 'blaze');
    p.level = 8;
    startArchive(p, 17);
    for (let room = 0; room < 2; room++) {
      archiveWave(17, room).forEach((_, i) => archiveKill(p, i));
      if (room === 1) chooseArchiveEvent(p, 'seal');
      advanceArchive(p);
    }
    const rune = archiveRuneChoices(p.archive)[0];
    restArchive(p, 'rune', rune);
    advanceArchive(p);
    archiveKill(p, 0);
    const reward = claimArchive(p);
    assert.equal(reward.xp, 740);
    assert.equal(reward.gold, 280);
    assert.equal(reward.summary.depth, 4);
    assert.equal(reward.summary.rune, rune);
    assert.equal(reward.summary.event, 'seal');
    save(p);
    assert.deepEqual(load().lastRunSummary, reward.summary);
    assert.equal(claimArchive(p), null);
  } finally { globalThis.localStorage = prior; }
});

test('abandoned and defeated runs record completed depth and award nothing', () => {
  const p = newPlayer('Returner', 'frost');
  startRift(p, 5);
  chooseBoon(p, boonChoices(p.rift)[0]);
  const target = p.rift.target;
  riftKill(p, target); riftKill(p, target);
  assert.equal(endRift(p, 'defeated'), true);
  assert.equal(p.lastRunSummary.depth, 1);
  assert.equal(p.lastRunSummary.outcome, 'defeated');
  assert.equal(p.lastRunSummary.xp, 0);
  assert.equal(p.lastRunSummary.gold, 0);
  startArchive(p, 9);
  archiveWave(9, 0).forEach((_, i) => archiveKill(p, i));
  endArchive(p);
  assert.equal(p.lastRunSummary.depth, 1);
  assert.equal(p.lastRunSummary.outcome, 'abandoned');
  assert.equal(p.lastRunSummary.xp, 0);
  assert.equal(p.lastRunSummary.gold, 0);
});
