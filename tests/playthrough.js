// Scripted story playthrough: accepts, completes and hands in `count` quests from `start`
// (from a later start the wizard is levelled to 50 so bosses fall quickly).
const w = dq.world, c = dq.combat;
await sleep(900); dq.UI.closeDialog(); await sleep(200); w.mode = 'explore';
const p = dq.player;
const START = +(new URLSearchParams(location.search).get('start') || 0), COUNT = +(new URLSearchParams(location.search).get('count') || 8);
if (START) { p.quest = { index: START, state: 'available', progress: 0 }; p.storyMax = START; p.level = 50; (await import('./src/state.js')).recalc(p); p.hp = p.maxHp; p.known.push('meteor_strike','sunfire_nova','dragonfire','phoenix_ascension'); p.hotbar = ['meteor_strike','sunfire_nova','dragonfire','phoenix_ascension']; p.dragon.voice = true; }
const btn = (txt) => [...document.querySelectorAll('#dialog button')].find(b => b.textContent.includes(txt));
const talkTo = async (id, pick) => {
  const n = w.npcs.find(x => x.id === id);
  w.teleport({ x: n.model.position.x, z: n.model.position.z + 2.5, heading: Math.PI }); w.mode = 'explore'; w.simulate(0.2);
  w.onInteract(id); await sleep(250);
  const b = pick ? btn(pick) : document.querySelector('#dialog button.primary');
  const label = b?.textContent;
  b?.click(); await sleep(250);
  dq.UI.closeDialog(); dq.UI.closeModal?.(); await sleep(50);
  return label;
};
const killAll = async (id, n) => {
  let k = 0;
  for (const e of w.enemies.filter(e => (e.def.id === id || e.def.questAs === id) && e.state !== 'dead')) {
    if (k >= n) break;
    w.teleport({ x: e.model.position.x, z: e.model.position.z - 4, heading: 0 }); w.mode = 'explore'; w.invulnUntil = 1e9; w.simulate(0.2);
    for (let t = 0; t < (e.def.boss ? 900 : 300) && e.state !== "dead"; t++) { c.setTarget(e); for (let i = 0; i < 5; i++) c.castSlot(i); w.simulate(0.2); p.mana = p.maxMana; if (e.fly) { e.fly.forced = true; } await sleep(0); }
    if (e.state === 'dead') k++;
  }
  return k;
};
const steps = [];
for (let qi = 0; qi < COUNT; qi++) {
  p.mana = p.maxMana;
  const q = dq.QUESTS ? dq.QUESTS[p.quest.index] : null;
  const cur = (await import('./src/state.js')).currentQuest(p);
  if (!cur) break;
  let r = '';
  if (p.quest.state === 'available') r += 'accept:' + await talkTo(cur.giver, 'Accept') + ' ';
  if (cur.objective.type === 'shout') { (await import('./src/state.js')).recordShout(p, cur.objective.shout); r += 'shout ' + p.quest.state + ' '; }
  if (cur.objective.type === 'defeat') r += 'killed ' + await killAll(cur.objective.enemy, cur.objective.count) + '/' + cur.objective.count + ' ';
  const o = cur.objective;
  if (o.type === 'use') {
    for (let i = 0; i < o.spots.length; i++) {
      const [x, z] = o.spots[i];
      w.teleport({ x, z: z + 2.2, heading: Math.PI }); w.mode = 'explore'; w.invulnUntil = 1e9; w.simulate(0.2); await sleep(0);
      dq.UI.closeDialog(); w.onInteract('q:use:' + i);
      for (let t = 0; t < 12; t++) { w.simulate(0.2); await sleep(0); }
    }
    r += 'used ' + (p.quest.used || []).length + '/' + o.spots.length + ' foes=' + w.enemies.filter(e => e.state === 'aggro').length + ' ';
  }
  if (o.type === 'visit') {
    w.teleport({ x: o.x, z: o.z + 1, heading: Math.PI }); w.mode = 'explore'; w.simulate(0.2); await sleep(300);
    r += 'visited:' + p.quest.state + ' "' + (document.querySelector('#dialog')?.textContent || '').slice(0, 40) + '" ';
    dq.UI.closeDialog(); await sleep(50);
  }
  if (o.type === 'defend') {
    w.teleport({ x: o.x, z: o.z, heading: Math.PI }); w.mode = 'explore'; w.invulnUntil = 1e9;
    let peak = 0, spawned = 0;
    for (let t = 0; t < (o.time + 4) / 0.2 && p.quest.state === 'active'; t++) {
      w.player.position.set(o.x, 0, o.z);
      w.simulate(0.2); p.hp = p.maxHp; await sleep(0);
      peak = Math.max(peak, w.enemies.filter(e => e.state === 'aggro').length);
      if (t % 25 === 0) r += '[' + (document.querySelector('#quest-goal')?.textContent || '') + '] ';
    }
    r += 'defend:' + p.quest.state + ' peak=' + peak + ' ';
  }
  r += 'turnin:' + await talkTo(cur.turnIn, 'Complete');
  steps.push(cur.id + ' [' + p.quest.state + '] ' + r + ' -> level ' + p.level);
}
log.push(steps.join('\n'));
log.push('final quest index ' + p.quest.index + ' deaths ' + p.stats_log.deaths);
