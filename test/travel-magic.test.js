import test from 'node:test';
import assert from 'node:assert/strict';
import { newPlayer, giveScroll, spendScroll, scrollCount, buyMount, selectMount, rollLoot, save, load } from '../src/state.js';
import { Combat } from '../src/combat.js';
import { MOUNTS, RULES, ENEMIES, SPELLS } from '../src/data.js';

test('scroll capacity, one-use consumption and old save migration', () => {
  const player = newPlayer('Scribe', 'frost');
  for (let i = 0; i < RULES.maxScrolls; i++) assert.equal(giveScroll(player, 'mend'), true);
  assert.equal(giveScroll(player, 'mend'), false);
  assert.equal(scrollCount(player), RULES.maxScrolls);
  assert.equal(spendScroll(player, 'mend'), true);
  assert.equal(scrollCount(player), RULES.maxScrolls - 1);
  assert.equal(spendScroll(player, 'unknown'), false);
  const storage = new Map();
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  delete player.scrolls;
  delete player.mounts;
  delete player.activeMount;
  delete player.mounted;
  save(player);
  const restored = load();
  assert.equal(scrollCount(restored), 0);
  assert.deepEqual(restored.mounts, []);
  assert.equal(restored.mounted, false);
  delete globalThis.localStorage;
});

test('mount ownership gates travel and persists a selected mount', () => {
  const player = newPlayer('Rider', 'blaze');
  assert.equal(buyMount(player, 'moonstag'), false);
  player.level = MOUNTS.moonstag.level;
  player.gold = MOUNTS.moonstag.price;
  assert.equal(buyMount(player, 'moonstag'), true);
  assert.equal(player.gold, 0);
  assert.equal(buyMount(player, 'moonstag'), false);
  assert.equal(selectMount(player, 'emberstag'), false);
  player.mounted = true;
  const storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  save(player);
  const restored = load();
  assert.equal(restored.activeMount, 'moonstag');
  assert.equal(restored.mounted, true);
  delete globalThis.localStorage;
});

test('enemy drops can award a scroll through the normal loot pipeline', () => {
  const player = newPlayer('Forager', 'arcane');
  const random = Math.random;
  try {
    Math.random = () => 0;
    const loot = rollLoot(player, [ENEMIES.gloomsprig]);
    assert.ok(loot.scrolls.includes('mend'));
    assert.equal(player.scrolls.mend, 1);
  } finally {
    Math.random = random;
  }
});

test('scroll casting preserves mana and rejects an unavailable target or mounted hero', () => {
  const player = newPlayer('Caster', 'verdant');
  player.hp = 100;
  player.mana = 0;
  giveScroll(player, 'mend');
  giveScroll(player, 'ember');
  const hero = { position: { x: 0, z: 0 } };
  const world = {
    time: 10, mounted: false, player: hero, enemies: [],
    castPose: () => {}, aura: () => {}, float: () => {}, setTargetRing: () => {},
    projectile: () => new Promise(() => {}),
  };
  const combat = new Combat({ world });
  combat.setPlayer(player);
  assert.equal(combat.castScroll('ember'), false);
  assert.equal(player.scrolls.ember, 1);
  assert.equal(combat.castScroll('mend'), true);
  assert.equal(player.mana, 0);
  assert.ok(player.hp > 100);
  assert.equal(player.scrolls.mend, undefined);
  assert.equal(combat.castScroll('mend'), false);
  world.time = 12;
  world.mounted = true;
  assert.equal(combat.castScroll('ember'), false);
  assert.equal(player.scrolls.ember, 1);
  world.mounted = false;
  const foe = { state: 'idle', def: { reactions: [] }, model: { position: { x: 4, z: 0 } } };
  combat.target = foe;
  assert.equal(combat.castScroll('ember'), true);
  assert.equal(player.scrolls.ember, undefined);
});

test('Astral Pulse hits only nearby enemies without requiring a target', () => {
  const player = newPlayer('Nova', 'arcane');
  player.mana = 100;
  const world = {
    time: 5, mounted: false, player: { position: { x: 0, z: 0 } }, enemies: [],
    castPose: () => {}, shockwave: () => {}, burst: () => {}, chest: () => ({ x: 0, y: 1, z: 0 }),
  };
  const combat = new Combat({ world });
  combat.setPlayer(player);
  world.enemies = [4, 10].map(x => ({ state: 'idle', model: { visible: true, position: { x, z: 0 } } }));
  const hits = [];
  combat.damageEnemy = enemy => hits.push(enemy);
  assert.equal(combat.castSpell(SPELLS.astral_pulse), true);
  assert.deepEqual(hits, [world.enemies[0]]);
  assert.equal(player.mana, 64);
});
