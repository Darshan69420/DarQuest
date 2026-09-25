// Quest objectives beyond "defeat": using things in the world (thaw a lamp, smash a totem),
// holding ground against waves of foes, and finding places. Their props exist only while
// the quest is active.
import * as THREE from 'three';
import { ENEMIES } from './data.js';
import { makeLamp, makeBanner, makeDeadTree, makeOak, makeCrystal, mat, glowMat } from './models.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const mesh = (geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; return o; };
const see = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });

// ------------------------------------------------------------ props
// Each returns a group with userData.done(instant) (switch to the used look) and
// optionally userData.anim(t, done).

function frozenLamp() {
  const g = new THREE.Group();
  g.add(makeLamp(0xffd27a));
  const ice = new THREE.Group();
  const iceMat = new THREE.MeshStandardMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.78, roughness: 0.15, emissive: 0x3a7aa0, emissiveIntensity: 0.35 });
  ice.add(mesh(new THREE.IcosahedronGeometry(0.62, 0), iceMat, 0.56, 2.95, 0));
  ice.add(mesh(new THREE.IcosahedronGeometry(0.7, 0), iceMat, 0, 0.35, 0));
  for (let i = 0; i < 5; i++) {
    const c = mesh(new THREE.ConeGeometry(0.07, 0.4 + Math.random() * 0.3, 5), iceMat, 0.3 + i * 0.13, 2.25, (i % 2) * 0.15 - 0.07);
    c.rotation.x = Math.PI;
    ice.add(c);
  }
  g.add(ice);
  const glow = mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffc86a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0.56, 2.9, 0);
  g.add(glow);
  g.userData.fxY = 2.9;
  g.userData.color = 0xbfeaff;
  g.userData.done = () => { ice.visible = false; };
  g.userData.anim = (t, done) => { glow.material.opacity = done ? 0.35 + Math.sin(t * 3) * 0.08 : 0; };
  return g;
}

function ashTotem() {
  const g = new THREE.Group();
  const body = new THREE.Group();
  const stone = mat(0x3a2e2a), dark = mat(0x241c1a);
  body.add(mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.5, 7), dark, 0, 0.25, 0));
  const eyes = [];
  for (let i = 0; i < 3; i++) {
    const y = 0.9 + i * 0.85;
    body.add(mesh(new THREE.BoxGeometry(0.9 - i * 0.12, 0.75, 0.8 - i * 0.1), i % 2 ? dark : stone, 0, y, 0));
    for (const s of [-1, 1]) {
      const e = mesh(new THREE.BoxGeometry(0.16, 0.08, 0.05), glowMat(0xff5a1a, 2.6), s * 0.18, y + 0.1, 0.42 - i * 0.05);
      eyes.push(e);
      body.add(e);
    }
    body.add(mesh(new THREE.BoxGeometry(0.4, 0.06, 0.05), mat(0x120a08), 0, y - 0.15, 0.42 - i * 0.05));
  }
  for (const s of [-1, 1]) {
    const horn = mesh(new THREE.ConeGeometry(0.12, 0.7, 6), mat(0xd8c8b0), s * 0.35, 3.3, 0);
    horn.rotation.z = -s * 0.5;
    body.add(horn);
  }
  g.add(body);
  g.userData.fxY = 2;
  g.userData.color = 0xff7a2a;
  let fall = -1;
  g.userData.done = (instant) => {
    for (const e of eyes) e.material = mat(0x2a2020);
    fall = instant ? 1 : 0;
    if (instant) { body.rotation.z = 1.35; body.position.y = -0.2; }
  };
  g.userData.anim = (t, done, dt) => {
    if (fall >= 0 && fall < 1) {
      fall = Math.min(1, fall + dt * 1.6);
      body.rotation.z = 1.35 * fall * fall;
      body.position.y = -0.2 * fall;
    }
  };
  return g;
}

function cultBanner() {
  const g = new THREE.Group();
  const b = makeBanner(0x5a1a2a);
  g.add(b);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = mesh(new THREE.ConeGeometry(0.45, 1.3, 7), flameMat, 0, 2.8, 0.1);
  flame.visible = false;
  g.add(flame);
  g.userData.fxY = 2.8;
  g.userData.color = 0xff8a2a;
  let burn = -1;
  g.userData.done = (instant) => {
    burn = instant ? 3 : 0;
    if (instant) { b.rotation.x = 1.45; b.position.y = 0.1; }
  };
  g.userData.anim = (t, done, dt) => {
    if (burn < 0 || burn >= 3) { flame.visible = false; return; }
    burn += dt;
    flame.visible = true;
    flame.scale.set(1 + Math.sin(t * 20) * 0.1, 1 + Math.sin(t * 13) * 0.2, 1);
    flameMat.opacity = Math.max(0, 0.9 - burn * 0.3);
    if (burn > 1.2) { const k = Math.min(1, (burn - 1.2) / 0.8); b.rotation.x = 1.45 * k * k; b.position.y = 0.1 * k; flame.position.y = 2.8 - 2.2 * k; }
  };
  return g;
}

function spiritBrazier() {
  const g = new THREE.Group();
  const iron = mat(0x2e3440);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.5, 5), iron, Math.cos(a) * 0.35, 0.7, Math.sin(a) * 0.35);
    leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25);
    g.add(leg);
  }
  g.add(mesh(new THREE.CylinderGeometry(0.75, 0.4, 0.45, 10), iron, 0, 1.55, 0));
  const snow = mesh(new THREE.SphereGeometry(0.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf2f8ff), 0, 1.7, 0);
  snow.scale.y = 0.45;
  g.add(snow);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x7affd0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [0, 1, 2].map(i => { const f = mesh(new THREE.ConeGeometry(0.32 - i * 0.07, 1.1 + i * 0.3, 7), flameMat, (i - 1) * 0.18, 2.25 + i * 0.12, 0); f.visible = false; g.add(f); return f; });
  g.userData.fxY = 2;
  g.userData.color = 0x7affd0;
  g.userData.done = () => { snow.visible = false; for (const f of flames) f.visible = true; };
  g.userData.anim = (t, done) => {
    if (!done) return;
    flames.forEach((f, i) => { f.scale.set(1 + Math.sin(t * 9 + i) * 0.12, 1 + Math.sin(t * 7 + i * 2) * 0.2, 1); f.rotation.y = t * (i + 1); });
  };
  return g;
}

function stormRod() {
  const g = new THREE.Group();
  const iron = mat(0x4a4a5a);
  g.add(mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.6, 8), mat(0x6a6078), 0, 0.3, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.14, 6, 8), iron, 0, 3.3, 0));
  for (const y of [2, 3.5, 5]) { const r = mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 14), mat(0xb08a3a), 0, y, 0); r.rotation.x = Math.PI / 2; g.add(r); }
  const gem = mesh(new THREE.OctahedronGeometry(0.4), mat(0x55506a), 0, 6.6, 0);
  gem.scale.set(0.7, 1.4, 0.7);
  g.add(gem);
  const arcMat = new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const arcs = [0, 1, 2].map(() => { const a = mesh(new THREE.TorusGeometry(0.6, 0.025, 4, 12, Math.PI * 0.8), arcMat, 0, 6.6, 0); a.visible = false; g.add(a); return a; });
  g.userData.fxY = 6.4;
  g.userData.color = 0x9fd8ff;
  g.userData.done = () => { gem.material = glowMat(0x9fd8ff, 2.8); for (const a of arcs) a.visible = true; };
  g.userData.anim = (t, done) => {
    if (!done) return;
    arcs.forEach((a, i) => { a.rotation.set(t * (3 + i), t * (2 + i * 1.7), i); a.visible = Math.sin(t * 17 + i * 5) > -0.3; });
  };
  return g;
}

function sickTree() {
  const g = new THREE.Group();
  const dead = makeDeadTree(1.25, false);
  g.add(dead);
  const blight = new THREE.Group();
  const bm = glowMat(0x9a3aff, 0.9);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1;
    const s = mesh(new THREE.SphereGeometry(0.22 + (i % 3) * 0.08, 8, 6), bm, Math.cos(a) * 0.45, 0.4 + i * 0.35, Math.sin(a) * 0.45);
    blight.add(s);
  }
  g.add(blight);
  const oak = makeOak(1.1);
  oak.visible = false;
  g.add(oak);
  g.userData.fxY = 1.8;
  g.userData.color = 0x7aff8a;
  let grow = -1;
  g.userData.done = (instant) => {
    dead.visible = false;
    blight.visible = false;
    oak.visible = true;
    grow = instant ? 1 : 0;
    oak.scale.setScalar(instant ? 1 : 0.2);
  };
  g.userData.anim = (t, done, dt) => {
    if (!done) { blight.children.forEach((s, i) => s.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.15)); return; }
    if (grow < 1) { grow = Math.min(1, grow + dt * 1.2); const k = 1 - (1 - grow) ** 3; oak.scale.setScalar(0.2 + 0.8 * k); }
  };
  return g;
}

function blightPod() {
  const g = new THREE.Group();
  const pod = new THREE.Group();
  const skin = glowMat(0x7a2aa8, 1.1);
  pod.add(mesh(new THREE.SphereGeometry(1.2, 14, 10), skin, 0, 1.2, 0));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const v = mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 5), mat(0x3a2a30), Math.cos(a) * 1.4, 0.5, Math.sin(a) * 1.4);
    v.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
    pod.add(v);
  }
  g.add(pod);
  g.userData.fxY = 1.2;
  g.userData.color = 0xc542ff;
  g.userData.done = () => { pod.visible = false; };
  g.userData.anim = (t, done) => { if (!done) pod.children[0].scale.setScalar(1 + Math.sin(t * 2.6) * 0.07 + Math.max(0, Math.sin(t * 2.6 + 0.4)) * 0.05); };
  return g;
}

const PROPS = { lamp: frozenLamp, totem: ashTotem, banner: cultBanner, brazier: spiritBrazier, rod: stormRod, tree: sickTree, pod: blightPod };
const NAMES = { lamp: 'Frozen Lamp', totem: 'Ash Totem', banner: 'Cult Banner', brazier: 'Spirit Brazier', rod: 'Lightning Rod', tree: 'Sick Tree', pod: 'Heart of the Blight' };
const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

// A ward circle for "hold this place" objectives: a glowing ring, rune stones round the edge
// and a crystal in the middle. Plain (not additive) colours so it reads on snow as well as rock.
function defendRing(r) {
  const g = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xe8901f, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, fog: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.3, r, 64), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.09;
  const fillMat = see(0xf2a93b, 0.1);
  const fill = new THREE.Mesh(new THREE.CircleGeometry(r - 0.3, 48), fillMat);
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.07;
  g.add(ring, fill, makeCrystal(0xf2c14e, 1.1));
  const runeMat = glowMat(0xffc050, 2.2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const st = mesh(new THREE.BoxGeometry(0.45, 1.1, 0.3), mat(0x5a5068), Math.cos(a) * r, 0.55, Math.sin(a) * r);
    st.rotation.y = -a;
    g.add(st);
    const rune = mesh(new THREE.BoxGeometry(0.2, 0.3, 0.05), runeMat, Math.cos(a) * (r - 0.17), 0.7, Math.sin(a) * (r - 0.17));
    rune.rotation.y = -a + Math.PI / 2;
    g.add(rune);
  }
  g.userData = { ringMat, fillMat, fxY: 1 };
  return g;
}

// ------------------------------------------------------------ the objectives

export class Objectives {
  // hooks: { player(), quest(), sfx(name), message(text), toast(html, cls), changed(), addFoe(e), useHint() }
  constructor(world, combat, hooks) {
    this.world = world;
    this.combat = combat;
    this.hooks = hooks;
    this.built = null;      // key of the quest the props belong to
    this.props = [];        // { model, label, i, done }
    this.ring = null;
    this.channel = null;    // { i, t, dur, from }
    this.defense = null;    // { t, spawnT, foes, outside }
    this.t = 0;
    world.extraInteractables = [...(world.extraInteractables || []), () => this.interactables()];
  }

  objective() {
    const p = this.hooks.player(), q = this.hooks.quest();
    return p && q && p.quest.state === 'active' ? q.objective : null;
  }

  // Build or clear the props so they match the current quest. Cheap to call often.
  sync() {
    const p = this.hooks.player(), q = this.hooks.quest();
    const o = q?.objective;
    // used props stay (in their used look) until the quest is handed in; the defend ring goes at once
    const st = p?.quest.state;
    const live = p && q && ['use', 'defend', 'visit'].includes(o.type) && (st === 'active' || (st === 'ready' && o.type !== 'defend'));
    const key = live ? `${q.id}${o.type === 'defend' ? ':' + st : ''}` : null;
    if (key === this.built) return;
    this.clear();
    this.built = key;
    if (!live) return;
    if (o.type === 'use') {
      p.quest.used = (p.quest.used || []).filter(i => i < o.spots.length);
      p.quest.progress = p.quest.used.length;
      o.spots.forEach(([x, z], i) => {
        const model = PROPS[o.kind]();
        model.position.set(x, 0, z);
        model.rotation.y = (i * 2.1) % (Math.PI * 2);
        this.world.scene.add(model);
        const done = p.quest.used.includes(i);
        if (done) model.userData.done(true);
        const label = done ? null : this.world.addLabel(model, `<div class="name quest-obj">✦ ${NAMES[o.kind]}</div>`, 'npc', (model.userData.fxY || 2) + 1.4);
        this.props.push({ model, label, i, done });
      });
    }
    if (o.type === 'visit' && o.kind) {
      const model = PROPS[o.kind]();
      model.position.set(o.x, 0, o.z);
      this.world.scene.add(model);
      const done = st === 'ready';
      if (done) model.userData.done(true);
      this.props.push({ model, label: null, i: 0, done });
    }
    if (o.type === 'defend') {
      this.ring = defendRing(o.r);
      this.ring.position.set(o.x, 0, o.z);
      this.world.scene.add(this.ring);
    }
  }

  clear() {
    for (const pr of this.props) {
      this.world.scene.remove(pr.model);
      if (pr.label) { pr.label.el.remove(); this.world.labels = this.world.labels.filter(l => l !== pr.label); }
    }
    this.props = [];
    if (this.ring) { this.world.scene.remove(this.ring); this.ring = null; }
    this.channel = null;
    this.endDefense(false);
  }

  interactables() {
    const o = this.objective();
    if (!o || o.type !== 'use') return [];
    return this.props.filter(pr => !pr.done).map(pr => ({ id: 'q:use:' + pr.i, x: pr.model.position.x, z: pr.model.position.z, r: 2.8, label: o.label }));
  }

  // Where the quest wants you now: the nearest unused prop, the ring, or the place.
  targets() {
    const o = this.objective();
    if (!o) return null;
    if (o.type === 'use') return this.props.filter(pr => !pr.done).map(pr => ({ x: pr.model.position.x, z: pr.model.position.z }));
    if (o.type === 'defend' || o.type === 'visit') return [{ x: o.x, z: o.z }];
    return null;
  }

  interact(id) {
    if (!id.startsWith('q:use:')) return false;
    const o = this.objective();
    const pr = this.props.find(x => 'q:use:' + x.i === id);
    if (!o || !pr || pr.done || this.channel) return true;
    const pp = this.world.player.position;
    this.channel = { pr, t: 0, dur: o.channel || 1.4, from: pp.clone() };
    this.world.dismount?.();
    this.world.castPose(this.world.player);
    this.hooks.sfx('cast');
    return true;
  }

  progress() {
    const c = this.channel, o = this.objective();
    return c && o ? { icon: '✦', label: o.verb, k: Math.min(1, c.t / c.dur) } : null;
  }

  // The HUD's goal line while a defense is running.
  trackerGoal() {
    const o = this.objective(), d = this.defense;
    if (!o || o.type !== 'defend') return null;
    if (!d) return `Stand in the golden ring at ${o.place} to begin`;
    const left = Math.max(0, Math.ceil(o.time - d.t));
    return d.outside > 0 ? `Get back into the ring! (${Math.ceil(6 - d.outside)}s)` : `${o.goal}: ${left}s left`;
  }

  update(dt) {
    this.t += dt;
    const o = this.objective();
    for (const pr of this.props) pr.model.userData.anim?.(this.t, pr.done, dt);
    if (!o) return;
    const pp = this.world.player.position;

    if (this.channel) {
      const c = this.channel;
      if (pp.distanceTo(c.from) > 1.2) { this.channel = null; this.hooks.message('Interrupted!'); }
      else {
        c.t += dt;
        if (c.t >= c.dur) { this.channel = null; this.use(c.pr, o); }
      }
    }

    if (o.type === 'visit' && Math.hypot(pp.x - o.x, pp.z - o.z) < o.r) {
      const p = this.hooks.player();
      p.quest.state = 'ready';
      for (const pr of this.props) {
        pr.done = true;
        pr.model.userData.done(false);
        this.world.burst(V(o.x, pr.model.userData.fxY, o.z), pr.model.userData.color, 40, 7);
      }
      // arrival should feel like arriving: a gold ring rolling out and a banner over the hero
      this.world.shockwave(V(o.x, 0, o.z), 0xffe9a8, 8);
      this.world.float(this.world.player, `✦ ${o.place || 'You have arrived'}`, 'status');
      this.world.shake(0.4);
      this.hooks.sfx('shrine');
      this.hooks.arrived(o);
      this.hooks.changed();
    }

    if (o.type === 'defend') this.updateDefense(o, dt, pp);
  }

  use(pr, o) {
    const p = this.hooks.player();
    pr.done = true;
    pr.model.userData.done(false);
    if (pr.label) { pr.label.el.remove(); this.world.labels = this.world.labels.filter(l => l !== pr.label); pr.label = null; }
    const at = V(pr.model.position.x, pr.model.userData.fxY || 2, pr.model.position.z);
    this.world.burst(at, pr.model.userData.color, 30, 5);
    this.hooks.sfx('shrine');
    p.quest.used = [...(p.quest.used || []), pr.i];
    p.quest.progress = p.quest.used.length;
    const n = p.quest.progress, count = o.spots.length;
    this.world.float(this.world.player, `✦ ${n}/${count}`, 'status');
    if (o.ambush?.on.includes(n)) this.ambush(o.ambush, pr.model.position);
    else this.extraAmbush(o, n, count, pr.model.position);
    if (n >= count) p.quest.state = 'ready';
    this.hooks.changed();
  }

  // Even quiet spots bite back: a lone scout may spot you early, and the last spot
  // always calls a fight, so a use-quest never ends in a shrug.
  extraAmbush(o, n, count, at) {
    const p = this.hooks.player();
    if (n === 1 && count >= 3 && Math.random() < 0.6) {
      const id = o.ambush?.enemy || this.localFoe(at);
      if (id) this.ambush({ enemy: id, count: 1, scout: true }, at);
      return;
    }
    if (n === count) {
      const id = o.ambush?.enemy || this.localFoe(at);
      if (id) this.ambush({ enemy: id, count: Math.min(3, (o.ambush?.count || 1) + (p.level >= 30 ? 1 : 0)) }, at);
    }
  }

  // The creature most likely to object to your meddling: the nearest local foe's kind.
  localFoe(at) {
    let best = null, bd = 80;
    for (const e of this.world.enemies) {
      if (e.def.boss || e.def.elite || !e.home) continue;
      const d = Math.hypot(e.home.x - at.x, e.home.z - at.z);
      if (d < bd) { bd = d; best = e.def.id; }
    }
    return best;
  }

  // Foes that come running when you meddle with their things.
  ambush(a, at) {
    const def = ENEMIES[a.enemy];
    for (let k = 0; k < a.count; k++) {
      const pos = this.spawnPoint(at.x, at.z, 9 + k * 2, k);
      if (!pos) continue;
      const e = this.world.addEnemy(def, pos.x, pos.z, 3);
      this.hooks.addFoe(e);
      this.combat.aggro(e);
      this.world.puff(pos.x, 0.6, pos.z, 0x2a1a3a, 12, 3);
    }
    this.hooks.message(a.scout ? `⚠️ A ${def.name} scout spots you!` : `⚠️ ${def.name}${a.count > 1 ? 's' : ''} ${a.count > 1 ? 'come' : 'comes'} to stop you!`);
    this.hooks.sfx('warn');
  }

  spawnPoint(x, z, dist, seed = 0) {
    for (let i = 0; i < 16; i++) {
      const a = seed * 2.4 + i * 0.9 + Math.random() * 0.4;
      const px = x + Math.cos(a) * dist, pz = z + Math.sin(a) * dist;
      if (this.world.walkable(px, pz)) return { x: px, z: pz };
    }
    return null;
  }

  // ------------------------------------------------------------ holding ground

  updateDefense(o, dt, pp) {
    const inside = Math.hypot(pp.x - o.x, pp.z - o.z) < o.r + 0.5;
    const g = this.ring;
    if (g) {
      const k = this.defense ? 0.8 + Math.sin(this.t * 6) * 0.15 : 0.6 + Math.sin(this.t * 2.5) * 0.2;
      g.userData.ringMat.opacity = k;
      g.userData.ringMat.color.setHex(this.defense ? 0xff6a1a : 0xe8901f);
      g.userData.fillMat.opacity = this.defense ? 0.18 : 0.1;
    }
    if (!this.defense) {
      if (inside) this.startDefense(o);
      return;
    }
    const d = this.defense;
    d.foes = d.foes.filter(e => e.state !== 'dead' && this.world.enemies.includes(e));
    if (inside) { d.outside = 0; d.t += dt; }
    else {
      d.outside += dt;
      if (d.outside > 6) {
        this.hooks.message(`You left ${o.place}. The foes slip past!`);
        this.hooks.sfx('fail');
        this.endDefense(false);
        this.hooks.changed();
        return;
      }
    }
    d.spawnT -= dt;
    if (d.spawnT <= 0 && d.t < o.time - 3) {
      d.spawnT = o.every;
      // every third wave is a surge: one extra foe, a horn, and a warning with a direction
      const surge = d.wave > 0 && d.wave % 3 === 2;
      const cap = (o.max || 6) + (surge ? 1 : 0);
      let sx = 0, sz = 0, made = 0;
      for (let k = 0; k < o.per + (surge ? 1 : 0) && d.foes.length < cap; k++) {
        const def = ENEMIES[o.waves[(d.wave + k) % o.waves.length]];
        const pos = this.spawnPoint(o.x, o.z, o.r + 11, d.wave * 3 + k * 5);
        if (!pos) continue;
        const e = this.world.addEnemy(def, pos.x, pos.z, 3);
        this.hooks.addFoe(e);
        this.combat.aggro(e);
        this.world.puff(pos.x, 0.6, pos.z, 0x2a1a3a, 12, 3);
        d.foes.push(e);
        sx += pos.x - o.x; sz += pos.z - o.z; made++;
      }
      if (made && Math.hypot(sx, sz) > 2) {
        const dir = COMPASS[Math.round(((Math.atan2(sx, -sz) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8];
        if (surge) { this.hooks.message(`⚠️ They press harder from the ${dir}!`); this.hooks.sfx('horn'); }
        else if (d.wave % 2 === 0) this.hooks.message(`Foes come from the ${dir}!`);
      }
      d.wave++;
    }
    if (d.t >= o.time) {
      const p = this.hooks.player();
      this.endDefense(true);
      p.quest.state = 'ready';
      this.world.shockwave(V(o.x, 0, o.z), 0xf2c14e, 6);
      this.world.burst(V(o.x, 1, o.z), 0xf2c14e, 40, 7);
      this.hooks.sfx('victory');
      this.hooks.toast(`🛡️ <b>You held ${o.place}!</b> The rest of them flee.`, 'good');
      this.hooks.changed();
    }
  }

  startDefense(o) {
    this.defense = { t: 0, spawnT: 1.5, foes: [], outside: 0, wave: 0 };
    this.hooks.sfx('boss');
    this.hooks.message(`🛡️ ${o.goal} for ${o.time} seconds!`);
    this.world.shockwave(V(o.x, 0, o.z), 0xff9a3d, 5);
  }

  // Waves melt away when a defense ends, won or lost.
  endDefense() {
    const d = this.defense;
    this.defense = null;
    if (!d) return;
    for (const e of d.foes) {
      if (e.state === 'dead' || !this.world.enemies.includes(e)) continue;
      e.state = 'dead';
      this.world.puff(e.model.position.x, 0.8, e.model.position.z, 0x2a1a3a, 10, 2);
      this.world.removeEnemy(e);
    }
    this.combat.target && !this.world.enemies.includes(this.combat.target) && this.combat.setTarget(null);
  }

  // A fall in battle resets any defense in progress.
  reset() {
    if (this.defense) this.endDefense();
    this.channel = null;
  }
}
