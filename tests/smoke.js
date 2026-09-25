// Smoke test: boots the game (runner does that) and visits every land's spawn point,
// letting the world render a moment in each place. Any console error fails the run.
//   node tests/run.cjs tests/smoke.js --low --shot=smoke
// Gallery boot check (no game start):
//   node tests/run.cjs --low --page=gallery.html --notitle --shot=gallery
const w = dq.world;
const data = await import('./src/data.js');
await sleep(600); dq.UI.closeDialog(); await sleep(200);
w.mode = 'explore'; w.invulnUntil = 1e9;
for (const [id, z] of Object.entries(data.ZONES)) {
  const sp = z.spawn || { x: 0, z: 0 };
  w.teleport({ x: sp.x, z: sp.z, heading: sp.heading || 0 });
  w.mode = 'explore';
  w.simulate(0.5);
  await sleep(250); // let a few real frames render (labels, culling, atmosphere)
  const bad = [];
  if (!Number.isFinite(w.player.position.x) || !Number.isFinite(w.player.position.z)) bad.push('player position');
  log.push(`${id}: zone=${data.zoneAt(w.player.position.x)} enemies=${w.enemies.filter(e => e.state === 'aggro').length} fps=${w.fps?.toFixed(0) || '?'}${bad.length ? ' BAD: ' + bad.join(',') : ''}`);
}
// The Rift gate and Undercroft stairs render too (no entry — just stand there).
w.teleport({ x: 21, z: 19, heading: 0 }); w.simulate(0.3); await sleep(200);
w.teleport({ x: 5.4, z: 116, heading: 0 }); w.simulate(0.3); await sleep(200);
log.push('smoke done, mode=' + w.mode);
