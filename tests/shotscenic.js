// Scenic shot: teleport to a spot, face a heading, let the world settle.
//   node tests/run.cjs tests/shotscenic.js --low --q="x=700&z=60&h=0" --shot=scenic
const qs = new URLSearchParams(location.search);
const X = +(qs.get('x') || 0), Z = +(qs.get('z') || 0), H = +(qs.get('h') || 0);
const w = dq.world, p = dq.player;
await sleep(700); dq.UI.closeDialog();
p.level = 30; (await import('./src/state.js')).recalc(p); p.hp = p.maxHp;
w.teleport({ x: X, z: Z, heading: H }); w.mode = 'explore';
for (let i = 0; i < 14; i++) { w.simulate(0.2); await sleep(60); }
document.querySelector('#toasts')?.replaceChildren();
document.querySelector('#hint')?.classList.add('hidden');
log.push('scenic at ' + X + ',' + Z + ' zone=' + (await import('./src/data.js')).zoneAt(X));
