import test from 'node:test';
import assert from 'node:assert/strict';
import { newPlayer, save, load } from '../src/state.js';
import { ENEMIES, PORTALS, ZONES, zoneAt } from '../src/data.js';
import { ARCHIVE_ROOMS, archiveWave, startArchive, archiveKill, advanceArchive, restArchive, claimArchive } from '../src/archive.js';

test('all seeded encounters use real foes and reachable rooms', () => {
  for (let seed = 0; seed < 300; seed++) {
    const p = newPlayer('Explorer', 'blaze');
    assert.equal(startArchive(p, seed), true);
    for (let room = 0; room < ARCHIVE_ROOMS.length; room++) {
      const wave = archiveWave(seed, room);
      if (room === 2) {
        assert.equal(p.archive.status, 'rest');
        assert.equal(restArchive(p, 'heal'), true);
      } else {
        assert.ok(wave.length);
        for (let i = wave.length - 1; i >= 0; i--) {
          assert.ok(ENEMIES[wave[i]]);
          assert.equal(archiveKill(p, i), true);
          assert.equal(archiveKill(p, i), false);
        }
      }
      assert.ok(ZONES.archive.regions.some(r => Math.hypot(r.x - 1400, r.z - (ARCHIVE_ROOMS[room].z - 7)) < r.r));
      assert.ok(PORTALS.some(pt => pt.id === `archive_door_${room}` && zoneAt(pt.x) === 'archive'));
      if (room < 3) assert.equal(advanceArchive(p), true);
    }
    assert.equal(claimArchive(p).wins, 1);
    assert.equal(claimArchive(p), null);
    assert.equal(p.archive, null);
  }
});

test('reload keeps exact defeated foe indices and rest can only be taken once', () => {
  const storage = new Map();
  const prior = globalThis.localStorage;
  globalThis.localStorage = { setItem: (k, v) => storage.set(k, v), getItem: k => storage.get(k) ?? null };
  try {
    const p = newPlayer('Explorer', 'frost');
    startArchive(p, 41);
    assert.equal(archiveKill(p, 1), true);
    save(p);
    const resumed = load();
    assert.deepEqual(resumed.archive.defeated, [1]);
    assert.equal(archiveKill(resumed, 1), false);
    assert.equal(archiveKill(resumed, 0), true);
    assert.equal(advanceArchive(resumed), true);
    for (let i = 0; i < archiveWave(41, 1).length; i++) archiveKill(resumed, i);
    advanceArchive(resumed);
    resumed.hp = 1;
    assert.equal(restArchive(resumed, 'heal'), true);
    assert.ok(resumed.hp > 1);
    assert.equal(restArchive(resumed, 'scroll'), false);
  } finally { globalThis.localStorage = prior; }
});
