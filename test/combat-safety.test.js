import test from 'node:test';
import assert from 'node:assert/strict';
import { Combat } from '../src/combat.js';
import { ENEMIES, SPELLS } from '../src/data.js';

function setup(id = 'hollow_knight', positions = [0]) {
  const enemies = positions.map(x => ({ def: ENEMIES[id], state: 'idle', home: { x, z: 0 }, wanderR: 0, model: { visible: true, position: { x, z: 0 } } }));
  const noop = () => {};
  const world = { time: 10, invulnUntil: 0, enemies, player: { position: { x: 0, z: 3 } }, float: noop, hitReact: noop, burst: noop, shake: noop, castPose: noop, aura: noop, shockwave: noop, dangerZone: noop, faceEnemy: noop, setTargetRing: noop, chest: () => ({}), moveEnemy: (e, p) => { e.model.position.x = p.x; e.model.position.z = p.z; } };
  const combat = new Combat({ world });
  const player = { level: 6, hp: 1000, maxHp: 1000, mana: 100, maxMana: 100, stats: {}, difficulty: 'normal' };
  combat.setPlayer(player);
  return { combat, world, player, enemies };
}

test('a pull recruits only the closest two and does not recruit passive underlevel foes', () => {
  const { combat, enemies } = setup('hollow_knight', [0, 6, 2, 4, 3]);
  combat.aggro(enemies[0]);
  assert.deepEqual(enemies.map(e => e.state), ['aggro', 'idle', 'aggro', 'idle', 'aggro']);
  combat.p.level = 9;
  for (const e of enemies) e.state = 'idle';
  combat.aggro(enemies[0]);
  assert.equal(enemies.filter(e => e.state === 'aggro').length, 1);
});

test('underlevel enemies stay passive until attacked; a 30-unit retreat leashes and restores them', () => {
  const { combat, world, player, enemies: [e] } = setup();
  player.level = 9;
  combat.update(0.1);
  assert.equal(e.state, 'idle');
  combat.damageEnemy(e, 20, 'blaze', 0);
  assert.equal(e.state, 'aggro');
  world.player.position.z = 30;
  combat.update(0.1);
  assert.equal(e.state, 'return');
  assert.equal(combat.damageEnemy(e, 100, 'blaze', 0), 0);
  combat.update(0.1);
  assert.equal(e.state, 'idle');
  assert.equal(e.hp, e.maxHp);
});

test('dodging consumes enemy blades while preserving player shields; blades cap at three', () => {
  const { combat, world, player, enemies: [e] } = setup();
  for (let i = 0; i < 17; i++) combat.enemySpell(e, SPELLS.searing_blade);
  assert.equal(e.mods.blades.length, 3);
  combat.hero.shields = [0.5];
  world.invulnUntil = 11;
  combat.hitHero(100, 'blaze', 0, e);
  assert.equal(player.hp, 1000);
  assert.deepEqual(e.mods.blades, []);
  assert.deepEqual(combat.hero.shields, [0.5]);
});

test('boss marks lock to the ground and cycle through three patterns with recovery windows', () => {
  for (const id of ['lord_hollowmere', 'pyrrhon']) {
    const { combat, world, player, enemies: [e] } = setup(id);
    combat.aggro(e);
    assert.equal(e.nextAttack, 12.5);
    const names = new Set();
    for (let i = 0; i < 3; i++) {
      world.player.position.z = 3;
      combat.startAttack(e);
      names.add(e.cast.pattern.name);
      const cast = e.cast;
      world.player.position.z = 20;
      combat.resolvePattern(e, cast);
      assert.equal(player.hp, 1000);
      assert.ok(e.nextAttack > world.time + cast.dur);
    }
    assert.equal(names.size, 3);
  }
});

test('distant AI is suspended and a stranded aggro enemy resets home', () => {
  const { combat, world, enemies: [e] } = setup();
  let moves = 0;
  world.moveEnemy = () => moves++;
  world.player.position.z = 100;
  combat.update(0.1);
  assert.equal(moves, 0);
  e.state = 'aggro';
  e.hp = 1;
  e.model.position.x = 5;
  combat.update(0.1);
  assert.equal(e.state, 'idle');
  assert.equal(e.hp, e.maxHp);
  assert.equal(e.model.position.x, 0);
});
