import test from 'node:test';
import assert from 'node:assert/strict';
import { newPlayer, recalc, save, load } from '../src/state.js';
import { ENEMIES } from '../src/data.js';
import { startRift, chooseBoon, boonChoices, riftKill, claimRift, endRift, RIFT_STAGES } from '../src/rifts.js';

test('a contract runs three stages with saved targets, unique boons, and one payout', () => {
  const player = newPlayer('Tester', 'blaze');
  assert.equal(startRift(player, 42), true);
  assert.equal(startRift(player, 43), false);
  for (let stage = 0; stage < RIFT_STAGES; stage++) {
    const run = player.rift;
    assert.equal(run.stage, stage);
    assert.equal(run.status, 'choice');
    assert.ok(ENEMIES[run.target]);
    const offered = boonChoices(run);
    assert.equal(offered.length, 3);
    assert.ok(offered.every(id => !run.boons.includes(id)));
    assert.equal(chooseBoon(player, 'bogus'), false);
    assert.equal(chooseBoon(player, offered[0]), true);
    assert.equal(chooseBoon(player, offered[0]), false);
    recalc(player);
    assert.equal(riftKill(player, 'pyrrhon'), false);
    const target = run.target;
    for (let count = 0; count < stage + 2; count++) assert.equal(riftKill(player, target), true);
    assert.equal(riftKill(player, target), false);
  }
  assert.equal(player.rift.status, 'claim');
  assert.equal(player.rift.boons.length, 3);
  const reward = claimRift(player);
  assert.ok(reward.xp > 0 && reward.gold > 0);
  assert.equal(player.riftWins, 1);
  assert.equal(claimRift(player), null);
  recalc(player);
  assert.equal(player.stats.hp, 0);
});

test('contract progress survives reload, and losing removes temporary stats', () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  const player = newPlayer('Survivor', 'frost');
  startRift(player, 51);
  const target = player.rift.target;
  const chosen = boonChoices(player.rift)[0];
  assert.equal(chooseBoon(player, chosen), true);
  recalc(player);
  riftKill(player, target);
  save(player);
  const restored = load();
  assert.equal(restored.rift.target, target);
  assert.equal(restored.rift.kills, 1);
  assert.deepEqual(restored.rift.boons, player.rift.boons);
  assert.equal(endRift(restored), true);
  recalc(restored);
  assert.equal(restored.stats.hp, 0);
  assert.equal(endRift(restored), false);
  delete globalThis.localStorage;
});

test('an older character save opens with an empty Rift record', () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  const original = newPlayer('Veteran', 'arcane');
  delete original.rift;
  delete original.riftWins;
  save(original);
  const restored = load();
  assert.equal(restored.rift, null);
  assert.equal(restored.riftWins, 0);
  assert.equal(startRift(restored, 8), true);
  delete globalThis.localStorage;
});
