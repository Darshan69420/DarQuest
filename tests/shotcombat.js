// Busy combat scene for screenshots: pulls half a dozen Emberfall foes and opens up.
//   node tests/run.cjs tests/shotcombat.js --low --shot=combat
const w = dq.world, c = dq.combat, p = dq.player;
await sleep(600); dq.UI.closeDialog();
p.level = 30; (await import('./src/state.js')).recalc(p); p.hp = p.maxHp; p.mana = p.maxMana;
if (!p.known.includes('meteor_strike')) p.known.push('meteor_strike');
p.hotbar = ['meteor_strike'];
w.teleport({ x: 1400, z: 100, heading: 0 }); w.mode = 'explore'; w.invulnUntil = 1e9; w.simulate(0.3);
const near = w.enemies.filter(e => e.state !== 'dead' && Math.hypot(e.model.position.x - 1400, e.model.position.z - 100) < 30).slice(0, 6);
for (const e of near) c.aggro(e);
if (near[0]) { c.setTarget(near[0]); c.castSlot(0); }
w.simulate(0.25);
await sleep(120);
log.push('combat shot: ' + near.length + ' foes aggro');
