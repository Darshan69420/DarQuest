// Random-action fuzzer: presses keys, clicks menus, teleports, fights and runs scripted scenarios
// (quests, the Rift, the Undercroft, duels, quest objects, New Game+, building), checking that the
// player state stays valid. Reports every runtime error with the actions that led to it.
// Random-action fuzzer. Query: seed, n (actions), start (quest index), level.
const qs = new URLSearchParams(location.search);
const SEED = +(qs.get('seed') || 1), N = +(qs.get('n') || 300), START = +(qs.get('start') || 0), LEVEL = +(qs.get('level') || 1);
let a = SEED >>> 0;
const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const w = dq.world, c = dq.combat;
const st = await import('./src/state.js');
const data = await import('./src/data.js');
const zoneAt = data.zoneAt;
const maps = await import('./src/maps.js');
await sleep(600);
dq.UI.closeDialog();
const p = dq.player;
p.level = LEVEL; p.gold = 50000; p.potions = 5;
if (START) { p.quest = { index: START, state: 'available', progress: 0 }; p.storyMax = START; }
if (LEVEL >= 20) { p.known.push(...Object.keys(data.SPELLS).filter(id => data.SPELLS[id].school === p.school || data.SPELLS[id].school === 'astral').slice(0, 12)); p.mounts = ['steed']; p.activeMount = 'steed'; p.dragon.voice = true; }
st.recalc(p); p.hp = p.maxHp;
const actions = [];
const errors = [];
window.addEventListener('error', (e) => errors.push({ msg: e.message, stack: e.error?.stack?.split('\n').slice(0, 4).join(' | '), last: actions.slice(-6) }));
window.addEventListener('unhandledrejection', (e) => errors.push({ msg: 'rejection: ' + (e.reason?.message || e.reason), stack: e.reason?.stack?.split('\n').slice(0, 4).join(' | '), last: actions.slice(-6) }));
const origErr = console.error;
console.error = (...args) => { errors.push({ msg: 'console.error: ' + args.map(String).join(' ').slice(0, 200), last: actions.slice(-6) }); origErr(...args); };

const KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Space', 'Tab', 'KeyH', 'KeyF', 'KeyR', 'KeyX', 'KeyN', 'KeyB', 'KeyC', 'KeyK', 'KeyI', 'KeyJ', 'KeyG', 'F1', 'Escape', 'KeyE', 'KeyE', 'KeyE', 'Digit0'];
const MOVE = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
const BAD = /quit|delete|export|import|reset|new game\+|begin new game|erase|wipe/i;
const key = (code, up = true) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code.replace(/^Key|^Digit/, '').toLowerCase(), bubbles: true }));
  if (up) window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
};
const spots = () => {
  const list = [];
  for (const n of w.npcs) list.push({ x: n.model.position.x, z: n.model.position.z + 2.5, why: 'npc ' + n.id });
  for (const pt of data.PORTALS) list.push({ x: pt.x, z: pt.z + 2, why: 'portal ' + pt.id });
  for (const ws of data.WAYSTONES) list.push({ x: ws.x, z: ws.z + 2, why: 'waystone' });
  for (const ww of maps.WORD_WALLS) list.push({ x: ww.x, z: ww.z + 3, why: 'wall' });
  for (const nd of w.nodes.slice(0, 200)) list.push({ x: nd.x + 1.5, z: nd.z + 1.5, why: 'node ' + nd.def.name });
  for (const e of w.enemies.filter(e => e.state !== 'dead').slice(0, 300)) list.push({ x: e.model.position.x, z: e.model.position.z - 5, why: 'foe ' + e.def.id });
  for (const s of dq.objectives.targets() || []) list.push({ x: s.x, z: s.z + 2, why: 'objective' });
  list.push({ x: 21, z: 19, why: 'rift gate' }, { x: 5.4, z: 116, why: 'undercroft stair' });
  return list;
};
const clickText = (re) => { const b = [...document.querySelectorAll('#dialog:not(.hidden) button, #modal:not(.hidden) button, #result:not(.hidden) button')].find(b => re.test(b.textContent) && !b.disabled); if (b) b.click(); return !!b; };
const inside = () => dq.rift.active || dq.undercroft.active || zoneAt(w.player.position.x) === 'arena';
const goTo = (x, z) => { if (inside()) return; dq.UI.closeDialog(); dq.UI.closeModal?.(); w.teleport({ x, z, heading: Math.PI }); w.mode = 'explore'; w.simulate(0.2); };
const npcAt = (id) => w.npcs.find(n => n.id === id)?.model.position;
const home = (await import('./src/homestead.js')).HOME_X;
const SCEN = {
  quest: async () => {
    if (inside()) return 'inside';
    const q = st.currentQuest(p);
    if (!q) return 'no quest';
    const id = p.quest.state === 'available' ? q.giver : q.turnIn;
    const at = npcAt(id); if (!at) return 'no npc';
    goTo(at.x, at.z + 2.5); key('KeyE'); await sleep(50);
    const ok = clickText(/accept|complete/i);
    return `talk ${id} ${ok ? 'clicked' : 'nothing'} -> ${p.quest.state}`;
  },
  rift: async () => {
    if (dq.rift.active) { key('Escape'); await sleep(30); return 'abandon? ' + clickText(/abandon/i); }
    goTo(21, 19); key('KeyE'); await sleep(50);
    return 'enter rift ' + clickText(/enter|descend|begin/i);
  },
  under: async () => {
    if (dq.undercroft.active) { key('Escape'); await sleep(30); return 'leave ' + clickText(/leave the undercroft/i); }
    p.level = Math.max(p.level, 10);
    goTo(5.4, 119); key('KeyE'); await sleep(50);
    return 'undercroft ' + clickText(rnd() < 0.3 ? /heroic/i : /descend/i);
  },
  duel: async () => {
    if (inside()) return 'inside';
    const at = npcAt('vex'); if (!at) return 'no vex';
    goTo(at.x, at.z + 2.5); key('KeyE'); await sleep(50);
    clickText(/arena/i); await sleep(50);
    return 'duel ' + clickText(/enter the arena|duel|challenge/i);
  },
  objective: async () => {
    if (inside()) return 'inside';
    const idx = pick(data.QUESTS.map((q, i) => (['use', 'defend', 'visit'].includes(q.objective.type) ? i : -1)).filter(i => i >= 0));
    p.quest = { index: idx, state: 'active', progress: 0 };
    dq.objectives.sync();
    const t = pick(dq.objectives.targets() || [{ x: 0, z: 0 }]);
    goTo(t.x, t.z + 2.2); key('KeyE'); w.simulate(1.8);
    return `objective q${idx + 1} -> ${p.quest.state} ${p.quest.progress}`;
  },
  ngplus: async () => {
    if (inside()) return 'inside';
    p.quest = { index: data.QUESTS.length, state: 'available', progress: 0 }; p.storyMax = data.QUESTS.length;
    const at = npcAt('orvyn'); goTo(at.x, at.z + 2.5); key('KeyE'); await sleep(50);
    const ok = clickText(/new game\+/i); await sleep(50);
    const ok2 = clickText(/begin|yes|start/i);
    return `ng+ ${ok} ${ok2} -> ngplus ${p.ngplus} quest ${p.quest.index}`;
  },
  build: async () => {
    if (inside()) return 'inside';
    goTo(home, 12); w.simulate(0.3); key('KeyG');
    for (let k = 0; k < 4; k++) { const x = innerWidth * (0.3 + rnd() * 0.4), y = innerHeight * (0.4 + rnd() * 0.3); dq.homestead.click?.(x, y, rnd() < 0.3); }
    key('Digit' + (1 + Math.floor(rnd() * 5))); key('KeyG');
    return 'build ' + p.home.blocks.length;
  },
  travel: async () => {
    key('KeyN'); await sleep(40);
    const b = pick([...document.querySelectorAll('#modal:not(.hidden) button')].filter(b => !BAD.test(b.textContent)));
    if (b) b.click();
    return 'atlas ' + (b?.textContent.trim().slice(0, 20) || '-');
  },
};
let lockedFor = 0;
const check = (what) => {
  const pp = w.player.position;
  const bad = [];
  for (const [k, v] of Object.entries({ hp: p.hp, maxHp: p.maxHp, mana: p.mana, gold: p.gold, xp: p.xp, x: pp.x, z: pp.z, y: pp.y })) if (!Number.isFinite(v)) bad.push(k + '=' + v);
  if (p.hp > p.maxHp + 1) bad.push('hp>max');
  if (p.gold < 0) bad.push('gold<0');
  for (const e of w.enemies) if (e.hp !== undefined && !Number.isFinite(e.hp)) { bad.push('foe hp ' + e.def.id + '=' + e.hp); break; }
  if (w.mode === 'locked') { lockedFor ||= performance.now(); } else lockedFor = 0;
  if (lockedFor && performance.now() - lockedFor > 9000) { bad.push('locked for 9s (result open: ' + !document.querySelector('#result').classList.contains('hidden') + ', dialog: ' + dq.UI.isDialogOpen() + ')'); lockedFor = 0; }
  if (bad.length) errors.push({ msg: 'invariant: ' + bad.join(', '), last: actions.slice(-6) });
};

for (let i = 0; i < N; i++) {
  const r = rnd();
  let act = '';
  try {
    const open = document.querySelector('#result:not(.hidden) .btn, #dialog:not(.hidden) .btn, #modal:not(.hidden) .btn');
    if (open && r < 0.55) {
      const btns = [...document.querySelectorAll('#result:not(.hidden) button, #dialog:not(.hidden) button, #modal:not(.hidden) button, #modal:not(.hidden) [data-tab], #modal:not(.hidden) .card')].filter(b => !BAD.test(b.textContent) && !b.disabled);
      const b = pick(btns);
      if (b) { act = 'click "' + b.textContent.trim().slice(0, 30) + '"'; b.click(); }
    } else if (r < 0.1) {
      const name = pick(Object.keys(SCEN));
      act = 'scenario ' + name + ': ' + await SCEN[name]();
    } else if (r < 0.2) {
      const s = pick(spots());
      act = 'teleport ' + s.why;
      if (w.mode !== 'locked' && !inside()) { dq.UI.closeDialog(); dq.UI.closeModal?.(); w.teleport({ x: s.x, z: s.z, heading: rnd() * 6.28 }); w.mode = 'explore'; }
    } else if (r < 0.55) {
      const code = pick(KEYS);
      act = 'key ' + code;
      key(code);
    } else if (r < 0.7) {
      const code = pick(MOVE);
      act = 'walk ' + code;
      key(code, false);
      w.simulate(0.3 + rnd());
      window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
    } else if (r < 0.8) {
      act = 'fight';
      const e = c.alive?.().find(e => Math.hypot(e.model.position.x - w.player.position.x, e.model.position.z - w.player.position.z) < 25);
      if (e) { c.setTarget(e); for (let k = 0; k < 4; k++) { c.castSlot(Math.floor(rnd() * 5)); w.simulate(0.3); } }
    } else if (r < 0.85) {
      act = 'tap world';
      const cv = document.querySelector('#game');
      const x = rnd() * innerWidth, y = rnd() * innerHeight;
      cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, pointerId: 1, button: 0, bubbles: true }));
      cv.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, pointerId: 1, button: 0, bubbles: true }));
    } else if (r < 0.88) {
      act = 'hud button';
      const b = pick([...document.querySelectorAll('.hud-buttons .btn, #hotbar .hb, #prompt, #hint')]);
      if (b) { act += ' ' + (b.id || b.className); b.click(); }
    } else if (r < 0.9) {
      act = 'night toggle';
      w.skyCycle.time = rnd();
    } else if (r < 0.92) {
      act = 'hurt self';
      p.hp = Math.max(1, Math.floor(p.hp * 0.3));
    } else {
      act = 'wait';
      w.simulate(0.5 + rnd() * 2);
    }
  } catch (err) {
    errors.push({ msg: 'thrown: ' + err.message, stack: err.stack?.split('\n').slice(0, 4).join(' | '), last: [...actions.slice(-5), act] });
  }
  actions.push(`${i}:${act}`);
  w.simulate(0.15);
  if (i % 4 === 0) await sleep(w.mode === 'locked' ? 120 : 0);
  check(act);
  if (errors.length > 12) break;
}
log.push(`seed ${SEED} start ${START} level ${LEVEL}: ${actions.length} actions, quest ${p.quest.index} ${p.quest.state}, zone ${data.zoneAt(w.player.position.x)}, mode ${w.mode}, rift ${dq.rift.active}, under ${dq.undercroft.active}`);
const seen = new Set();
for (const e of errors) {
  const k = e.msg + (e.stack || '').slice(0, 80);
  if (seen.has(k)) continue;
  seen.add(k);
  log.push('ERROR ' + e.msg + '\n   at ' + (e.stack || '-') + '\n   after ' + e.last.join(' ; '));
}
if (!errors.length) log.push('no errors');
log.push('scenarios: ' + actions.filter(x => x.includes('scenario')).map(x => x.split('scenario ')[1]).join(' / ').slice(0, 1500));
