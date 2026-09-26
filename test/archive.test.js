import test from 'node:test';
import assert from 'node:assert/strict';
import { newPlayer, save, load, recalc } from '../src/state.js';
import { ENEMIES, PORTALS, ZONES, zoneAt } from '../src/data.js';
import { Combat } from '../src/combat.js';
import { ARCHIVE_ROOMS, ARCHIVE_MODIFIERS, ARCHIVE_RUNES, ARCHIVE_EVENTS, archiveModifier, archiveRuneChoices, archiveEvent, archiveWave, startArchive, archiveKill, chooseArchiveEvent, advanceArchive, restArchive, claimArchive, endArchive } from '../src/archive.js';

test('all seeded encounters use real foes and reachable rooms', () => {
  for (let seed = 0; seed < 1200; seed++) {
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
      if (room === 1) {
        assert.equal(p.archive.status, 'event');
        assert.equal(advanceArchive(p), false);
        assert.equal(chooseArchiveEvent(p, seed % 2 ? 'seal' : 'plunder'), true);
        assert.equal(chooseArchiveEvent(p, 'seal'), false);
      }
      assert.ok(ZONES.archive.regions.some(r => Math.hypot(r.x - 1400, r.z - (ARCHIVE_ROOMS[room].z - 7)) < r.r));
      assert.ok(PORTALS.some(pt => pt.id === `archive_door_${room}` && zoneAt(pt.x) === 'archive'));
      assert.ok(PORTALS.some(pt => pt.id === `portal_archive_out_${room}` &&
        ZONES.archive.regions.some(r => Math.hypot(pt.x - r.x, pt.z - r.z) < r.r) &&
        zoneAt(pt.to.x) === 'academy'), `Room ${room} needs a reachable return gate`);
      if (room < 3) assert.equal(advanceArchive(p), true);
    }
    assert.equal(claimArchive(p).wins, 1);
    assert.equal(claimArchive(p), null);
    assert.equal(p.archive, null);
  }
});

test('seeded room rules and rune offers vary while remaining stable', () => {
  const seen = new Set();
  for (let seed = 0; seed < 1200; seed++) {
    const p = newPlayer('Explorer', 'arcane');
    startArchive(p, seed);
    const first = archiveModifier(p.archive);
    const next = archiveModifier(p.archive, 1);
    seen.add(first);
    assert.ok(ARCHIVE_MODIFIERS[first] && ARCHIVE_MODIFIERS[next]);
    assert.equal(archiveModifier(p.archive), first);
    assert.ok(ARCHIVE_EVENTS.includes(archiveEvent(p.archive)));
    assert.equal(archiveEvent(p.archive), archiveEvent(p.archive));
    assert.equal(archiveRuneChoices(p.archive).length, 2);
    assert.equal(new Set(archiveRuneChoices(p.archive)).size, 2);
    assert.ok(archiveRuneChoices(p.archive).every(id => ARCHIVE_RUNES[id]));
  }
  assert.deepEqual(seen, new Set(Object.keys(ARCHIVE_MODIFIERS)));
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
    assert.equal(chooseArchiveEvent(resumed, 'seal'), true);
    advanceArchive(resumed);
    resumed.hp = 1;
    assert.equal(restArchive(resumed, 'heal'), true);
    assert.ok(resumed.hp > 1);
    assert.equal(restArchive(resumed, 'scroll'), false);
  } finally { globalThis.localStorage = prior; }
});

test('a chosen rune changes stats through reload and leaves after claiming', () => {
  const storage = new Map();
  const prior = globalThis.localStorage;
  globalThis.localStorage = { setItem: (k, v) => storage.set(k, v), getItem: k => storage.get(k) ?? null };
  try {
    const p = newPlayer('Scholar', 'blaze');
    startArchive(p, 88);
    for (let room = 0; room < 2; room++) {
      for (let i = 0; i < archiveWave(88, room).length; i++) archiveKill(p, i);
      if (room === 1) chooseArchiveEvent(p, 'seal');
      advanceArchive(p);
    }
    const rune = archiveRuneChoices(p.archive)[0];
    assert.equal(restArchive(p, 'rune', 'invalid'), false);
    assert.equal(restArchive(p, 'rune', rune), true);
    assert.equal(restArchive(p, 'rune', rune), false);
    recalc(p);
    assert.equal(p.stats[Object.keys(ARCHIVE_RUNES[rune].stats)[0]], Object.values(ARCHIVE_RUNES[rune].stats)[0]);
    save(p);
    const resumed = load();
    assert.equal(resumed.archive.rune, rune);
    advanceArchive(resumed);
    archiveKill(resumed, 0);
    assert.ok(claimArchive(resumed));
    recalc(resumed);
    assert.deepEqual(resumed.stats, { hp: 0, dmg: 0, acc: 0, resist: 0, pip: 0, heal: 0 });
  } finally { globalThis.localStorage = prior; }
});

test('leaving or losing a run removes its Rune without taking persistent progress', () => {
  const p = newPlayer('Runner', 'arcane');
  p.gold = 321;
  startArchive(p, 9);
  for (let room = 0; room < 2; room++) {
    archiveWave(9, room).forEach((_, i) => archiveKill(p, i));
    if (room === 1) chooseArchiveEvent(p, 'plunder');
    advanceArchive(p);
  }
  const rune = archiveRuneChoices(p.archive)[0];
  assert.equal(restArchive(p, 'rune', rune), true);
  recalc(p);
  assert.ok(Object.values(p.stats).some(v => v > 0));
  assert.equal(endArchive(p), true);
  recalc(p);
  assert.equal(p.archive, null);
  assert.equal(p.gold, 321);
  assert.ok(Object.values(p.stats).every(v => v === 0));
  assert.equal(endArchive(p), false);
  assert.equal(startArchive(p, 9), true);
  assert.equal(p.archive.room, 0);
});

test('the Folio decision survives reload, changes guardian combat and pays once on victory', () => {
  const storage = new Map();
  const prior = globalThis.localStorage;
  globalThis.localStorage = { setItem: (k, v) => storage.set(k, v), getItem: k => storage.get(k) ?? null };
  try {
    const seed = Array.from({ length: 100 }, (_, i) => i).find(i => archiveModifier({ seed: i, room: 3 }) === 'frenzy');
    const world = { time: 10, player: { position: { x: 1400, z: 108 } }, enemies: [],
      float() {}, hitReact() {}, burst() {}, chest() { return {}; }, shake() {} };
    const combat = new Combat({ world });
    const boss = () => ({ dungeon: true, def: ENEMIES.archive_curator,
      model: { position: { x: 1400, z: 109 }, visible: true }, state: 'idle' });
    const reachFolio = (p) => {
      startArchive(p, seed);
      for (let room = 0; room < 2; room++) {
        archiveWave(seed, room).forEach((_, i) => archiveKill(p, i));
        if (room === 0) advanceArchive(p);
      }
      assert.equal(p.archive.status, 'event');
      assert.equal(chooseArchiveEvent(p, 'invalid'), false);
    };

    const sealed = newPlayer('Sealer', 'blaze');
    reachFolio(sealed);
    chooseArchiveEvent(sealed, 'seal');
    advanceArchive(sealed); restArchive(sealed, 'heal'); advanceArchive(sealed);
    combat.p = sealed;
    const weaker = boss();
    combat.initEnemy(weaker);
    assert.equal(weaker.maxHp, Math.round(ENEMIES.archive_curator.hp * 0.8));

    const plunderer = newPlayer('Reader', 'frost');
    reachFolio(plunderer);
    const bonus = archiveEvent(plunderer.archive).bonusGold;
    assert.equal(chooseArchiveEvent(plunderer, 'plunder'), true);
    save(plunderer);
    const resumed = load();
    assert.equal(resumed.archive.eventChoice, 'plunder');
    assert.equal(chooseArchiveEvent(resumed, 'seal'), false);
    advanceArchive(resumed); restArchive(resumed, 'heal'); advanceArchive(resumed);
    resumed.hp = resumed.maxHp = 10000;
    combat.p = resumed;
    const stronger = boss();
    combat.initEnemy(stronger);
    assert.equal(stronger.maxHp, ENEMIES.archive_curator.hp);
    combat.hitHero(100, 'arcane', 0xffffff, stronger);
    assert.equal(resumed.hp, 9875);
    archiveKill(resumed, 0);
    assert.equal(claimArchive(resumed).gold, 175 + bonus);
    assert.equal(claimArchive(resumed), null);
  } finally { globalThis.localStorage = prior; }
});

test('older Archive saves can finish while malformed event choices are discarded', () => {
  const storage = new Map();
  const prior = globalThis.localStorage;
  globalThis.localStorage = { setItem: (k, v) => storage.set(k, v), getItem: k => storage.get(k) ?? null };
  try {
    const p = newPlayer('Veteran', 'arcane');
    startArchive(p, 23);
    archiveWave(23, 0).forEach((_, i) => archiveKill(p, i));
    advanceArchive(p);
    archiveWave(23, 1).forEach((_, i) => archiveKill(p, i));
    delete p.archive.eventChoice;
    p.archive.status = 'cleared'; // a save from before the Folio event was added
    save(p);
    const old = load();
    assert.equal(old.archive.eventChoice, null);
    assert.equal(advanceArchive(old), true);
    old.archive.eventChoice = 'impossible';
    save(old);
    assert.equal(load().archive, null);
  } finally { globalThis.localStorage = prior; }
});

test('fragile and resonance rules change actual combat numbers', () => {
  const seedFor = (id) => Array.from({ length: 100 }, (_, i) => i).find(seed => archiveModifier({ seed, room: 0 }) === id);
  const world = { time: 10, player: { position: { x: 1400, z: 0 } }, enemies: [],
    float() {}, hitReact() {}, burst() {}, chest() { return {}; }, shake() {}, defeat() {} };
  const combat = new Combat({ world });
  const p = newPlayer('Combatant', 'arcane');
  p.hp = 10000;
  p.maxHp = 10000;
  combat.p = p;
  const makeFoe = () => ({ dungeon: true, def: ENEMIES.hollow_knight,
    model: { position: { x: 1400, z: 1 }, visible: true }, state: 'idle' });
  startArchive(p, seedFor('fragile'));
  p.rift = { status: 'active', stage: 2, target: 'hollow_knight', boons: [] };
  const fragile = makeFoe();
  world.enemies = [fragile];
  combat.initEnemy(fragile);
  assert.equal(fragile.maxHp, Math.round(fragile.def.hp * 0.8));
  assert.equal(combat.hitHero(100, 'arcane', 0xffffff, fragile), undefined);
  assert.equal(p.hp, 9880);
  p.rift = null;
  p.archive = null;
  startArchive(p, seedFor('resonance'));
  const echo = makeFoe();
  world.enemies = [echo];
  combat.initEnemy(echo);
  assert.equal(echo.maxHp, echo.def.hp);
  assert.equal(combat.damageEnemy(echo, 100, 'blaze', 0xffffff), 120);
  assert.equal(p.archive.status, 'active');
});

test('quickened pages actually shortens enemy attack intervals', () => {
  const seed = Array.from({ length: 100 }, (_, i) => i).find(i => archiveModifier({ seed: i, room: 0 }) === 'frenzy');
  const world = { time: 10, enemies: [], player: { position: { x: 1400, z: 0 } } };
  const combat = new Combat({ world });
  const p = newPlayer('Caster', 'frost');
  startArchive(p, seed);
  combat.p = p;
  combat.chooseSpell = () => null;
  const e = { dungeon: true, def: ENEMIES.hollow_knight };
  const random = Math.random;
  try {
    Math.random = () => 0.5;
    combat.startAttack(e);
    assert.equal(e.nextAttack, 10 + e.def.attackRate / 1.25);
    e.dungeon = false;
    combat.startAttack(e);
    assert.equal(e.nextAttack, 10 + e.def.attackRate);
  } finally { Math.random = random; }
});
