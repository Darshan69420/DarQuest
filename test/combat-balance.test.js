import test from 'node:test';
import assert from 'node:assert/strict';
import { Combat } from '../src/combat.js';
import { newPlayer, gainXp, xpToNext } from '../src/state.js';
import { ENEMIES, PLAYABLE_SCHOOLS } from '../src/data.js';

// A bounded combat model, not a browser playtest: no gear, pets or trained
// spells; basic attack + starter Mend; three consecutive solo pulls, one
// potion maximum. 65% of incoming attacks get a correctly timed dodge attempt
// (the real cooldown still applies). Travel, collision and input errors aren't
// represented. Projectiles retain travel time and all damage uses Combat.
function quest(id, level, school, seed, group = false) {
  let randomState = seed;
  const random = () => ((randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0) / 4294967296);
  const priorRandom = Math.random;
  Math.random = random;
  try {
    const p = newPlayer('Balance model', school);
    while (p.level < level) gainXp(p, xpToNext(p.level));
    p.potions = 1;
    const noop = () => {};
    const events = [];
    let taken = 0, kills = 0, active;
    const w = { time: 1, invulnUntil: 0, heading: 0, camYawOffset: 0, player: { position: { x: 0, z: 2.4 } }, enemies: [],
      setTargetRing: noop, castPose: noop, aura: noop, shake: noop, burst: noop, hitReact: noop, faceEnemy: noop, defeat: noop,
      chest: () => ({}),
      float: (model, text, type) => { if (model === w.player && type.startsWith('dmg')) taken += Number(text.slice(1)); },
      dash: () => { w.invulnUntil = w.time + 0.32; return true; },
      moveEnemy: noop,
    };
    const c = new Combat({ world: w, onKill: () => kills++ });
    c.setPlayer(p);
    function flight(from, to, speed = 18) {
      const duration = Math.hypot(from.position.x - to.position.x, from.position.z - to.position.z) / speed;
      if (to === w.player && random() < 0.65) events.push({ at: w.time + Math.max(0, duration - 0.1), run: () => c.dodge() });
      return { then: run => events.push({ at: w.time + duration, run }) };
    }
    w.projectile = (from, to, color, size, speed) => flight(from, to, speed);
    w.meteor = to => flight(active.model, to, 8);
    function spawn() {
      active = { def: ENEMIES[id], state: 'idle', home: { x: 0, z: 0 }, wanderR: 0, model: { visible: true, position: { x: 0, z: 0 } } };
      w.enemies = group ? [...w.enemies, active] : [active];
      c.initEnemy(active);
      c.setTarget(active);
      c.aggro(active);
    }
    spawn();
    if (group) { spawn(); spawn(); }
    while (kills < 3 && p.hp > 0 && w.time < 181) {
      w.time += 0.05;
      for (const enemy of w.enemies) if (enemy.cast && !enemy.cast.dodgeDecided && enemy.def.range <= 3) {
        enemy.cast.dodgeDecided = true;
        if (random() < 0.65) events.push({ at: w.time + Math.max(0, enemy.cast.dur - enemy.cast.t - 0.1), run: () => c.dodge() });
      }
      for (let i = events.length - 1; i >= 0; i--) if (events[i].at <= w.time) events.splice(i, 1)[0].run();
      if (p.hp < p.maxHp * 0.35) c.drinkPotion();
      if (p.hp < p.maxHp * 0.7) c.castSlot(1);
      c.castSlot(0);
      c.update(0.05);
      if (!group && active.state === 'dead' && kills < 3) spawn();
    }
    return { grossPct: 100 * taken / p.maxHp, netPct: 100 * (p.maxHp - p.hp) / p.maxHp, seconds: w.time - 1, potions: 1 - p.potions, died: p.hp <= 0, completed: kills === 3 };
  } finally { Math.random = priorRandom; }
}

test('three Chapter-one solo quest fights remain survivable with starter tools across six schools', t => {
  for (const group of [false, true]) for (const [id, level] of [['frost_wisp', 5], ['hollow_knight', 6], ['storm_crow', 7]]) {
    const results = PLAYABLE_SCHOOLS.flatMap(school => Array.from({ length: 12 }, (_, i) => quest(id, level, school, 1200 + i, group)));
    const avg = key => results.reduce((sum, r) => sum + r[key], 0) / results.length;
    t.diagnostic(`${id} ${group ? 'group' : 'solo'} n=${results.length}: gross=${avg('grossPct').toFixed(1)}% maxHP, net=${avg('netPct').toFixed(1)}%, duration=${avg('seconds').toFixed(1)}s, potion avg=${avg('potions').toFixed(2)}, deaths=${results.filter(r => r.died).length}`);
    assert.ok(results.every(r => r.completed && !r.died), `${id} model must finish alive`);
    assert.ok(results.every(r => r.potions <= 1));
  }
});
