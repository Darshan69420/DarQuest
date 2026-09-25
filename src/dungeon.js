// The Hollow Undercroft: a hand-built dungeon beneath the crypt at the end of Hollow Lane.
// Iron gates join its rooms, and each gate opens when you solve its room: pull a lever, step on
// rune plates in the order the tablet flashes, turn mirrors to guide a beam of light, survive
// the guard hall, run the blade gauntlet, and break the Pale Warden's ward by shattering two
// soul pylons. Foes scale to your level. Heroic mode (after your first clear) is tougher and
// pays better.
import * as THREE from 'three';
import { ENEMIES, GEAR, UNDER_X as UX, UNDER_ROOMS } from './data.js';
import { ITEMS, addItem } from './items.js';
import {
  mat, mergeGeometries, makeTorch, makePortal, makeChest, makeLever, makePlate, makeRuneTablet, makeMirror,
  makeEmitter, makeReceiver, makePortcullis, makePendulum, makePylon, makeSarcophagus, makeBones, makeCrystal, makeCryptStair,
} from './models.js';

export const CRYPT_DOOR = { x: 5.4, z: 118, r: 3.6 };
export const WARDEN_SET = ['wardens_cowl', 'wardens_shroud', 'bonebound_boots', 'soulglass_orb'];

// Gates across the corridors (local x, world z). `open` is the state at the start of a run.
const GATES = [
  { id: 'lever', z: 16, w: 4 },
  { id: 'plates', z: 44, w: 4 },
  { id: 'beam', z: 76, w: 4 },
  { id: 'guardBack', z: 84, w: 4, open: true },
  { id: 'guard', z: 104, w: 6 },
  { id: 'bossBack', z: 134, w: 6, open: true },
];

// The rune plates and their colours (blaze, frost, verdant, umbral).
const PLATES = [
  { x: -5.5, z: 30, color: 0xff6a2b, name: 'Flame' },
  { x: 5.5, z: 30, color: 0x6fd3ff, name: 'Frost' },
  { x: -5.5, z: 38, color: 0x5fdc6a, name: 'Leaf' },
  { x: 5.5, z: 38, color: 0x9a8cff, name: 'Shadow' },
];

// The light-beam room. '/' sends a beam going +x toward +z; '\' sends it toward -z.
const EMITTER = { x: -11.2, z: 58, dx: 1, dz: 0 };
const RECEIVER = { x: 11.2, z: 62 };
const MIRRORS = [
  { x: -3, z: 58, start: '\\' },
  { x: -3, z: 70, start: '\\' },
  { x: 7, z: 70, start: '/' },
  { x: 7, z: 62, start: '/' },
];

const BLADES = [110, 116, 122, 128].map((z, i) => ({ z, phase: i * 1.3, period: 2.6 }));
const BOSS_POS = { x: 0, z: 158 };

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Scales a foe to the level of this run.
export function underFoe(baseId, level, { elite = false, boss = false, heroic = false } = {}) {
  const b = ENEMIES[baseId];
  const eff = level + (elite ? 2 : 0) + (boss ? 3 : 0) + (heroic ? 3 : 0);
  const k = eff - b.level;
  const d = { ...b, id: b.id, level: eff, dungeon: true, night: false };
  d.hp = Math.round(b.hp * Math.max(0.6, 1 + k * 0.12) * (heroic ? 1.5 : 1));
  d.dmgMult = Math.max(0.6, 1 + k * 0.08) * (heroic ? 1.25 : 1);
  d.xp = Math.round(b.xp * Math.max(0.5, 1 + k * 0.1));
  d.gold = [Math.round(b.gold[0] * (1 + k * 0.05)), Math.round(b.gold[1] * (1 + k * 0.05))];
  if (elite) {
    d.elite = 'warden';
    d.name = `Crypt-Sworn ${b.name}`;
    d.hp = Math.round(d.hp * 1.6);
    d.dmgMult *= 1.2;
    d.xp *= 3;
    d.scale = 1.25;
  }
  if (boss) {
    d.phases = [
      { at: 0.75, say: 'Rise, my servants! Guard the Magister\'s secrets!' },
      { at: 0.5, say: 'You cannot touch me. The pylons feed my ward!' },
      { at: 0.25, say: 'The Pale Magister will hear of this... ENOUGH!', blade: 0.4 },
    ];
  }
  return d;
}

export class Undercroft {
  constructor({ world, combat, getPlayer, hooks }) {
    this.world = world;
    this.combat = combat;
    this.getPlayer = getPlayer;
    this.hooks = hooks;   // toast, message, sfx, fade, giveGear(id, rarity), onClear(summary)
    this.run = null;
    this.objects = [];
    this.anims = [];
    this.props = [];
    world.underWalk = (x, z) => this.walkable(x, z);
    // the stairwell down, beside Hollow Lane
    const door = world.add(makeCryptStair(), CRYPT_DOOR.x, CRYPT_DOOR.z, -Math.PI / 2);
    world.colliders.push({ x: CRYPT_DOOR.x + 0.4, z: CRYPT_DOOR.z, r: 1.4 });
    world.addLabel(door, '<div class="name">⚰️ Hollow Undercroft</div><div class="sub">Dungeon · puzzles and a boss</div>', 'npc', 4.6);
    world.extraInteractables = [...(world.extraInteractables || []), () => this.interactables()];
  }

  get active() { return !!this.run; }

  // ---------------- walking: inside the rooms (with a little clearance) and not through a closed gate
  walkable(x, z) {
    const lx = x - UX, m = 0.5;
    const inAny = (px, pz) => UNDER_ROOMS.some(r => r.type === 'circle'
      ? (px - r.x) ** 2 + (pz - r.z) ** 2 < r.r * r.r
      : px >= r.x0 && px <= r.x1 && pz >= r.z0 && pz <= r.z1);
    if (!inAny(lx - m, z - m) || !inAny(lx + m, z - m) || !inAny(lx - m, z + m) || !inAny(lx + m, z + m)) return false;
    if (this.run) for (const g of this.run.gates) if (!g.open && Math.abs(z - g.z) < 0.9 && Math.abs(lx) < g.w / 2 + 0.5) return false;
    for (const c of this.world.colliders) if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return false;
    return true;
  }

  // ---------------- run lifecycle
  start(heroic = false) {
    const p = this.getPlayer();
    const level = Math.max(10, p.level);
    this.clear();
    this.run = {
      heroic, level, t0: this.world.time, kills: 0,
      gates: GATES.map(g => ({ ...g, open: !!g.open })),
      seq: shuffle([0, 1, 2, 3]), step: 0, onPlate: -1, showing: false, platesDone: false,
      mirrors: MIRRORS.map(m => m.start), beamDone: false,
      guard: 'idle', wave: [], bossState: 'idle', boss: null, ward: false, wardDone: false, summons: new Set(),
      bladeHit: BLADES.map(() => 0), bladeWarned: BLADES.map(() => -1),
    };
    this.build();
    this.world.teleport({ x: UX, z: 5, heading: 0 });
    p.hp = p.maxHp;
    p.mana = p.maxMana;
    this.hooks.message(heroic ? '💀 HEROIC: the Undercroft\'s guardians are stronger, and so are its rewards.' : 'A cold draught rises from below. Pull the lever to open the way.');
  }

  // reason: 'clear' · 'leave' · 'death'
  end(reason) {
    const r = this.run;
    if (!r) return null;
    const summary = { reason, heroic: r.heroic, time: this.world.time - r.t0, kills: r.kills };
    this.run = null;
    this.clear();
    return summary;
  }

  clear() {
    const w = this.world;
    for (const o of this.objects) { w.scene.remove(o); o.traverse?.(c => { if (c.isMesh && !c.userData.shared) c.geometry.dispose(); }); }
    for (const e of [...w.enemies]) if (e.def.dungeon) w.removeEnemy(e);
    for (const pr of this.props) pr.label?.el.remove();
    w.labels = w.labels.filter(l => !this.props.some(pr => pr.label === l));
    this.combat.setTarget(null);
    this.objects = [];
    this.anims = [];
    this.props = [];
    this.beam = null;
  }

  // ---------------- building
  addObj(obj, lx, z, rot = 0) {
    obj.position.set(UX + lx, 0, z);
    obj.rotation.y = rot;
    this.world.scene.add(obj);
    this.objects.push(obj);
    if (obj.userData.anim) this.anims.push(obj);
    return obj;
  }

  addProp(kind, obj, lx, z, label, labelY = 2.2, r = 2.6, rot = 0) {
    this.addObj(obj, lx, z, rot);
    const pr = { id: `x:uc:${this.props.length}`, kind, obj, x: UX + lx, z, r, used: false };
    if (label) pr.label = this.world.addLabel(obj, label, 'npc', labelY);
    this.props.push(pr);
    return pr;
  }

  build() {
    const run = this.run;
    const scene = this.world.scene;
    // floor tiles and walls from a 1-unit grid over every room
    const X0 = -14, X1 = 20, Z0 = -2, Z1 = 172;
    const inside = (lx, z) => UNDER_ROOMS.some(r => r.type === 'circle' ? (lx - r.x) ** 2 + (z - r.z) ** 2 < r.r * r.r : lx > r.x0 && lx < r.x1 && z > r.z0 && z < r.z1);
    const inCircle = (lx, z) => { const c = UNDER_ROOMS.find(r => r.type === 'circle'); return (lx - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r; };
    const floor = (i, j) => inside(i + 0.5, j + 0.5);
    const pos = [], col = [];
    const tA = new THREE.Color(0x3a3448), tB = new THREE.Color(0x443e54);
    for (let j = Z0; j < Z1; j++) for (let i = X0; i < X1; i++) {
      if (!floor(i, j)) continue;
      const x0 = UX + i, z0 = j, x1 = x0 + 1, z1 = z0 + 1;
      pos.push(x0, 0.02, z0, x0, 0.02, z1, x1, 0.02, z1, x0, 0.02, z0, x1, 0.02, z1, x1, 0.02, z0);
      const c = (Math.floor(i / 2) + Math.floor(j / 2)) % 2 ? tA : tB;
      const v = 0.88 + Math.random() * 0.24;
      for (let n = 0; n < 6; n++) col.push(c.r * v, c.g * v, c.b * v);
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    fg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    fg.computeVertexNormals();
    const floorMesh = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    this.objects.push(floorMesh);
    // straight walls on rectangular rooms; the boss hall gets a round wall
    const walls = [], caps = [];
    const wallGeo = new THREE.BoxGeometry(1.6, 4.2, 0.8), capGeo = new THREE.BoxGeometry(1.8, 0.35, 1);
    const m4 = (x, y, z, rot) => new THREE.Matrix4().makeRotationY(rot).setPosition(x, y, z);
    const torches = [];
    for (let j = Z0; j < Z1; j++) for (let i = X0; i < X1; i++) {
      if (!floor(i, j) || inCircle(i + 0.5, j + 0.5)) continue;
      for (const [di, dj, rot] of [[1, 0, Math.PI / 2], [-1, 0, Math.PI / 2], [0, 1, 0], [0, -1, 0]]) {
        if (floor(i + di, j + dj)) continue;
        const x = UX + i + 0.5 + di * 0.5, z = j + 0.5 + dj * 0.5;
        walls.push({ geo: wallGeo, matrix: m4(x, 2.1, z, rot) });
        caps.push({ geo: capGeo, matrix: m4(x, 4.3, z, rot) });
        if (Math.abs(i) > 2 && (i + j) % 7 === 0 && Math.random() < 0.5) torches.push({ x: i + 0.5 - di * 0.1, z: j + 0.5 - dj * 0.1, rot: Math.atan2(-di, -dj) });
      }
    }
    const bossRoom = UNDER_ROOMS.find(r => r.type === 'circle');
    for (let k = 0; k < 64; k++) {
      const a = (k / 64) * Math.PI * 2;
      const x = bossRoom.x + Math.sin(a) * (bossRoom.r + 0.3), z = bossRoom.z + Math.cos(a) * (bossRoom.r + 0.3);
      if (z < bossRoom.z && Math.abs(x) < 3.2) continue;   // the way in
      walls.push({ geo: wallGeo, matrix: m4(UX + x, 2.1, z, a + Math.PI / 2) });
      caps.push({ geo: capGeo, matrix: m4(UX + x, 4.3, z, a + Math.PI / 2) });
      if (k % 8 === 4) torches.push({ x: x - Math.sin(a) * 0.5, z: z - Math.cos(a) * 0.5, rot: a + Math.PI });
    }
    for (const [items, color] of [[walls, 0x4e465e], [caps, 0x6a6280]]) {
      const mesh = new THREE.Mesh(mergeGeometries(items), mat(color));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      this.objects.push(mesh);
    }
    for (const t of torches.slice(0, 46)) this.addObj(makeTorch(), t.x, t.z, t.rot);

    // gates
    for (const g of run.gates) {
      const m = this.addObj(makePortcullis(g.w), 0, g.z);
      m.userData.snap(g.open);
      g.model = m;
    }

    // entry hall: the way out and the lever
    this.addProp('exit', makePortal(0x7affd0), -6.6, 8, '<div class="name">🌀 Crypt Stair</div><div class="sub">Leave the Undercroft</div>', 6.4, 3.4, Math.PI / 2);
    const lever = this.addProp('lever', makeLever(), 5.5, 13, '<div class="name">🕹️ Old Lever</div>', 2.4);
    for (const [x, z, r] of [[5.5, 4.5, 0], [-5.5, 13.5, Math.PI / 2]]) this.addObj(makeSarcophagus(), x, z, r);
    this.addObj(makeBones(false), -3, 13, 1.2);
    this.lever = lever;

    // rune plates
    this.plates = PLATES.map((pl, i) => { const m = this.addObj(makePlate(pl.color), pl.x, pl.z); return { ...pl, i, model: m }; });
    this.tablet = this.addProp('tablet', makeRuneTablet(), 0, 42.8, '<div class="name">📜 Rune Tablet</div><div class="sub">Read the order</div>', 4.2, 3.2, Math.PI);
    this.addObj(makeBones(false), 7.5, 26, 0.4);
    this.addObj(makeCrystal(0x7affd0, 1), -8.5, 42, 0.3);

    // the light-beam room
    this.addObj(makeEmitter(0xfff0a0), EMITTER.x, EMITTER.z, 0);
    this.receiver = this.addObj(makeReceiver(), RECEIVER.x, RECEIVER.z, 0);
    this.mirrors = MIRRORS.map((mm, i) => {
      const pr = this.addProp('mirror', makeMirror(), mm.x, mm.z, '<div class="name">🪞 Mirror</div><div class="sub">Turn it</div>', 3, 2.4);
      pr.mirror = i;
      return pr;
    });
    for (const [x, z] of [[-10, 74], [10, 54], [-10, 66]]) this.addObj(makeCrystal(0x9a8cff, 0.9), x, z, Math.random() * 6);
    this.updateBeam();

    // guard hall
    for (const [x, z] of [[-9, 88], [9, 88], [-9, 100], [9, 100]]) this.addObj(makeSarcophagus(), x, z, 0);
    this.addObj(makeBones(true), 0, 95, 0.4);

    // blade gauntlet
    this.blades = BLADES.map(b => this.addObj(makePendulum(6), 0, b.z));

    // the Warden's hall
    for (const [x, z] of [[-10, 146], [10, 146], [-12, 160], [12, 160]]) this.addObj(makeCrystal(0x7affd0, 1.2), x, z, Math.random() * 6);
    this.pylons = [-11, 11].map(x => {
      const pr = this.addProp('pylon', makePylon(), x, 152, '<div class="name">🔮 Soul Pylon</div><div class="sub">Shatter it!</div>', 5.4, 2.8);
      pr.hidden = true;
      pr.obj.visible = false;
      return pr;
    });

    // foes
    const L = run.level, H = run.heroic;
    const spawn = (id, x, z, opts = {}, wander = 2.5) => {
      const e = this.world.addEnemy(underFoe(id, L, { ...opts, heroic: H }), UX + x, z, wander);
      return e;
    };
    spawn('hollow_knight', -5, 34);
    spawn('lane_wraith', 5, 34);
    spawn('hollow_knight', 0, 62, {}, 3);
    spawn('storm_crow', 8, 56);
    spawn('lane_wraith', -8, 70);
    const boss = spawn('pale_warden', BOSS_POS.x, BOSS_POS.z, { boss: true }, 0);
    run.boss = boss;
  }

  // ---------------- interactions
  interactables() {
    const out = [];
    const p = this.getPlayer();
    if (!p) return out;
    if (!this.run) {
      out.push({ id: 'x:uc:door', x: CRYPT_DOOR.x, z: CRYPT_DOOR.z, r: CRYPT_DOOR.r, label: 'enter the Hollow Undercroft' });
      return out;
    }
    const labels = { exit: 'leave the Undercroft', lever: 'pull the lever', tablet: 'read the rune tablet', mirror: 'turn the mirror', pylon: 'shatter the soul pylon', chest: 'open the chest' };
    for (const pr of this.props) {
      if (pr.used || pr.hidden) continue;
      if (pr.kind === 'mirror' && this.run.beamDone) continue;
      if (pr.kind === 'tablet' && this.run.platesDone) continue;
      out.push({ id: pr.id, x: pr.x, z: pr.z, r: pr.r, label: labels[pr.kind] });
    }
    return out;
  }

  interact(id) {
    if (id === 'x:uc:door') { this.hooks.openEntrance(); return true; }
    const pr = this.props.find(x => x.id === id);
    if (!pr || pr.used || !this.run) return false;
    const w = this.world;
    switch (pr.kind) {
      case 'exit': this.hooks.leave(); break;
      case 'lever':
        pr.used = true;
        pr.obj.userData.set(true);
        pr.label?.el.classList.add('used');
        this.openGate('lever', 'The lever groans… and the gate rises!');
        break;
      case 'tablet': this.showSequence(); break;
      case 'mirror': {
        const i = pr.mirror;
        this.run.mirrors[i] = this.run.mirrors[i] === '/' ? '\\' : '/';
        this.hooks.sfx('click');
        this.updateBeam();
        break;
      }
      case 'pylon':
        pr.used = true;
        pr.obj.userData.set(false);
        pr.label?.el.classList.add('used');
        w.groundBurst(pr.x, pr.z, 0x7affd0, 24, 6);
        w.shake(0.3);
        this.hooks.sfx('bighit');
        if (this.pylons.every(x => x.used)) this.breakWard();
        else this.hooks.message('One pylon shattered! Break the other one!');
        break;
      case 'chest': this.openChest(pr); break;
    }
    return true;
  }

  openGate(id, msg) {
    const g = this.run.gates.find(x => x.id === id);
    if (!g || g.open) return;
    g.open = true;
    g.model.userData.set(true);
    this.world.shake(0.2);
    this.hooks.sfx('door');
    if (msg) this.hooks.message(msg);
  }

  closeGate(id) {
    const g = this.run.gates.find(x => x.id === id);
    if (!g || !g.open) return;
    g.open = false;
    g.model.userData.set(false);
    this.world.shake(0.3);
    this.hooks.sfx('door');
    // anyone standing in the gateway is pushed out of it
    const pp = this.world.player.position;
    if (Math.abs(pp.z - g.z) < 1 && Math.abs(pp.x - UX) < g.w / 2 + 0.5) pp.z = g.z + 1.2;
  }

  // ---------------- the rune plates
  showSequence() {
    const r = this.run;
    if (r.showing) return;
    r.showing = true;
    this.hooks.sfx('shrine');
    const tab = this.tablet.obj.userData;
    r.seq.forEach((pi, k) => {
      setTimeout(() => { if (this.run === r) { tab.setGem(k, PLATES[pi].color); this.hooks.sfx('click'); } }, 400 + k * 800);
      setTimeout(() => { if (this.run === r && !r.platesDone) tab.setGem(k, null); }, 400 + k * 800 + 650);
    });
    setTimeout(() => { if (this.run === r) r.showing = false; }, 400 + 4 * 800);
    this.hooks.message('The tablet flashes four runes, left to right. Step on the plates in that order.');
  }

  updatePlates() {
    const r = this.run, pp = this.world.player.position;
    let on = -1;
    for (const pl of this.plates) if (Math.hypot(pp.x - (UX + pl.x), pp.z - pl.z) < 1.4) on = pl.i;
    if (on === r.onPlate) return;
    r.onPlate = on;
    if (on < 0 || r.platesDone) return;
    const want = r.seq[r.step];
    if (on === want) {
      this.plates[on].model.userData.set('lit');
      this.tablet.obj.userData.setGem(r.step, PLATES[on].color);
      r.step++;
      this.hooks.sfx('click');
      if (r.step === 4) {
        r.platesDone = true;
        this.tablet.label?.el.classList.add('used');
        this.openGate('plates', 'The runes blaze in order, and the gate opens!');
      }
    } else if (r.step > 0 && r.seq.slice(0, r.step).includes(on)) {
      // stepping back onto a plate you already lit is fine
    } else {
      r.step = 0;
      for (const pl of this.plates) pl.model.userData.set('idle');
      for (let k = 0; k < 4; k++) this.tablet.obj.userData.setGem(k, null);
      const w = this.world;
      w.groundBurst(pp.x, pp.z, 0xb0a8c0, 14, 4);
      this.combat.envHit(this.getPlayer().maxHp * 0.08, 'arcane');
      this.hooks.sfx('fail');
      this.hooks.message('Wrong rune! Spikes jab up and the plates go dark. Read the tablet again.');
    }
  }

  // ---------------- the light beam
  traceBeam() {
    const r = this.run;
    const pts = [{ x: EMITTER.x, z: EMITTER.z }];
    let x = EMITTER.x, z = EMITTER.z, dx = EMITTER.dx, dz = EMITTER.dz, hit = false;
    const room = UNDER_ROOMS.find(q => q.id === 'beam');
    for (let bounce = 0; bounce < 8; bounce++) {
      let best = null, bestD = Infinity;
      MIRRORS.forEach((m, i) => {
        const d = dx ? (m.x - x) * dx : (m.z - z) * dz;
        const aligned = dx ? Math.abs(m.z - z) < 0.01 : Math.abs(m.x - x) < 0.01;
        if (aligned && d > 0.01 && d < bestD) { best = { kind: 'mirror', i, x: m.x, z: m.z }; bestD = d; }
      });
      const rd = dx ? (RECEIVER.x - x) * dx : (RECEIVER.z - z) * dz;
      const ra = dx ? Math.abs(RECEIVER.z - z) < 0.01 : Math.abs(RECEIVER.x - x) < 0.01;
      if (ra && rd > 0.01 && rd < bestD) { best = { kind: 'receiver', x: RECEIVER.x, z: RECEIVER.z }; bestD = rd; }
      if (!best) {
        // off to the wall
        const wx = dx > 0 ? room.x1 - 0.4 : dx < 0 ? room.x0 + 0.4 : x;
        const wz = dz > 0 ? room.z1 - 0.4 : dz < 0 ? room.z0 + 0.4 : z;
        pts.push({ x: wx, z: wz });
        break;
      }
      pts.push({ x: best.x, z: best.z });
      if (best.kind === 'receiver') { hit = true; break; }
      x = best.x; z = best.z;
      const s = r.mirrors[best.i];
      [dx, dz] = s === '/' ? [dz, dx] : [-dz, -dx];
    }
    return { pts, hit };
  }

  updateBeam() {
    const r = this.run;
    const { pts, hit } = this.traceBeam();
    this.mirrors.forEach((pr, i) => pr.obj.userData.setAngle(r.mirrors[i] === '/' ? -Math.PI / 4 : Math.PI / 4));
    if (this.beam) { this.world.scene.remove(this.beam); this.beam.geometry.dispose(); this.objects = this.objects.filter(o => o !== this.beam); }
    const items = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1];
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 0.01) continue;
      const geo = new THREE.BoxGeometry(0.16, 0.16, len);
      const m = new THREE.Matrix4().makeRotationY(Math.atan2(b.x - a.x, b.z - a.z)).setPosition(UX + (a.x + b.x) / 2, 1.75, (a.z + b.z) / 2);
      items.push({ geo, matrix: m });
    }
    if (items.length) {
      this.beam = new THREE.Mesh(mergeGeometries(items), new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.85, fog: false }));
      this.world.scene.add(this.beam);
      this.objects.push(this.beam);
    }
    this.receiver.userData.set(hit);
    if (hit && !r.beamDone) {
      r.beamDone = true;
      for (const pr of this.mirrors) pr.label?.el.classList.add('used');
      this.hooks.sfx('shrine');
      this.openGate('beam', 'The light strikes the crystal socket. The gate opens!');
    }
  }

  // ---------------- the guard hall
  startGuard() {
    const r = this.run;
    r.guard = 'wave1';
    this.closeGate('guardBack');
    this.hooks.message('⚔️ The gate slams shut behind you! The crypt guard awakens!');
    this.hooks.sfx('boss');
    this.spawnWave([['hollow_knight', -6, 96, true], ['lane_wraith', 6, 96], ['storm_crow', 0, 100]]);
  }

  spawnWave(list) {
    const r = this.run;
    r.wave = list.map(([id, x, z, elite]) => {
      const e = this.world.addEnemy(underFoe(id, r.level, { elite: !!elite, heroic: r.heroic }), UX + x, z, 3);
      this.combat.initEnemy?.(e);
      e.state = 'aggro';
      e.nextAttack = (this.combat.now || 0) + 1.5;
      this.world.aura(e.model, 0x7affd0);
      return e;
    });
  }

  updateGuard() {
    const r = this.run;
    if (r.guard === 'idle') {
      const pp = this.world.player.position;
      if (pp.z > 86.5 && pp.z < 103) this.startGuard();
      return;
    }
    if (r.guard === 'done' || r.wave.some(e => e.state !== 'dead')) return;
    if (r.guard === 'wave1') {
      r.guard = 'wave2';
      this.hooks.message('More of them rise from the sarcophagi!');
      this.spawnWave([['hollow_knight', -8, 90, true], ['obsidian_golem', 8, 90, true], ['lane_wraith', 0, 98]]);
      return;
    }
    r.guard = 'done';
    this.openGate('guardBack');
    this.openGate('guard', 'The guard hall falls silent. The gate ahead grinds open. Beware the blades beyond!');
    this.addProp('chest', makeChest(0xb08a3a), 0, 92, '<div class="name">🎁 Guard\'s Coffer</div>', 1.8, 2.6, Math.PI).small = true;
  }

  // ---------------- the blade gauntlet
  updateBlades() {
    const r = this.run, w = this.world, t = w.time, pp = w.player.position;
    const near = Math.abs(pp.x - UX) < 20 && pp.z > 96 && pp.z < 140;
    BLADES.forEach((b, i) => {
      const a = Math.sin((t / b.period) * Math.PI * 2 + b.phase) * 1.15;
      this.blades[i].userData.setAngle(a);
      if (!near) return;
      // warn a moment before the blade sweeps through the middle
      const theta = (t / b.period) * Math.PI * 2 + b.phase;
      const k = Math.ceil(theta / Math.PI);
      const tc = ((k * Math.PI - b.phase) / (Math.PI * 2)) * b.period;
      if (tc - t < 0.65 && r.bladeWarned[i] !== k) {
        r.bladeWarned[i] = k;
        w.telegraph({ shape: 'line', x: UX - 3, z: b.z, dir: Math.PI / 2, len: 6, width: 1.7, dur: Math.max(0.2, tc - t), color: 0xd0d8e8 });
      }
      if (Math.abs(a) < 0.3 && Math.abs(pp.z - b.z) < 0.95 && Math.abs(pp.x - UX) < 3 && t - r.bladeHit[i] > 0.9) {
        r.bladeHit[i] = t;
        this.combat.envHit(this.getPlayer().maxHp * (r.heroic ? 0.16 : 0.12), 'arcane');
        this.hooks.sfx('bighit');
        pp.z = b.z + (pp.z < b.z ? -1.4 : 1.4);
      }
    });
  }

  // ---------------- the Pale Warden
  updateBoss() {
    const r = this.run, e = r.boss, pp = this.world.player.position;
    if (!e) return;
    if (r.bossState === 'idle' && pp.z > 138.5) {
      r.bossState = 'fight';
      this.closeGate('bossBack');
      this.combat.initEnemy?.(e);
      this.combat.aggro?.(e);
      this.hooks.message('Morvain, the Pale Warden: "Another thief in the Magister\'s vault? Your bones will guard it with mine."');
      this.hooks.sfx('boss');
      return;
    }
    if (r.bossState !== 'fight') return;
    if (e.state === 'dead') { this.bossDown(); return; }
    const frac = e.hp / e.maxHp;
    if (frac < 0.75 && !r.summons.has(1)) { r.summons.add(1); this.summonAdds(2); }
    if (frac < 0.25 && !r.summons.has(2)) { r.summons.add(2); this.summonAdds(r.heroic ? 3 : 2); }
    if (frac < 0.5 && !r.ward && !r.wardDone) {
      r.ward = true;
      e.def.takenMult = 0.05;
      for (const pr of this.pylons) { pr.hidden = false; pr.obj.visible = true; }
      this.world.aura(e.model, 0x7affd0);
      this.hooks.message('🛡️ A ward of souls surrounds the Warden! Shatter both Soul Pylons (E) to break it.');
    }
    if (r.ward) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.004 * (this.lastDt || 0.016));
  }

  summonAdds(n) {
    const r = this.run, e = r.boss;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const add = this.world.addEnemy(underFoe(k % 2 ? 'lane_wraith' : 'hollow_knight', r.level, { heroic: r.heroic }), e.model.position.x + Math.cos(a) * 5, e.model.position.z + Math.sin(a) * 5, 3);
      this.combat.initEnemy?.(add);
      add.state = 'aggro';
      add.nextAttack = (this.combat.now || 0) + 1.5;
      this.world.aura(add.model, 0x7affd0);
    }
  }

  breakWard() {
    const r = this.run, e = r.boss;
    r.ward = false;
    r.wardDone = true;
    e.def.takenMult = 1;
    e.nextAttack = (this.combat.now || 0) + 3;
    this.world.shake(0.6);
    this.world.aura(e.model, 0xffffff);
    this.world.float(e.model, 'Ward broken!', 'status');
    this.hooks.message('💥 The ward shatters! The Warden reels. Strike now!');
  }

  bossDown() {
    const r = this.run;
    r.bossState = 'done';
    this.openGate('bossBack');
    for (const pr of this.pylons) { pr.hidden = true; pr.obj.visible = false; }
    this.addProp('chest', makeChest(r.heroic ? 0xc542ff : 0xf2c14e), 0, 150, `<div class="name">🎁 ${r.heroic ? 'Heroic ' : ''}Warden's Hoard</div><div class="sub">Claim it and return home</div>`, 1.8, 2.8, Math.PI);
    this.hooks.toast('🏆 <b>Morvain, the Pale Warden</b> is defeated! Open his hoard to claim your reward.', 'good');
  }

  openChest(pr) {
    const r = this.run, p = this.getPlayer();
    pr.used = true;
    pr.obj.userData.use?.();
    pr.label?.el.classList.add('used');
    const lines = [];
    const L = r.level;
    if (pr.small) {
      const gold = Math.round((30 + L * 8) * (r.heroic ? 1.5 : 1));
      p.gold += gold;
      lines.push(`+${gold} gold`);
      const m = pick(['iron_ore', 'silver_ore', 'gold_ore', 'glowcap', 'moonleaf', 'sapphire']);
      addItem(p, m, 2);
      lines.push(`2× ${ITEMS[m].name}`);
      if (Math.random() < 0.5) lines.push(`🎁 ${this.hooks.giveGear(this.gearNear(L), r.heroic ? 'epic' : 'rare')}`);
    } else {
      const gold = Math.round((120 + L * 30) * (r.heroic ? 1.6 : 1));
      p.gold += gold;
      lines.push(`+${gold} gold`);
      for (let k = 0; k < 2; k++) {
        const rar = r.heroic ? (Math.random() < 0.3 ? 'legendary' : 'epic') : (Math.random() < 0.35 ? 'epic' : 'rare');
        lines.push(`🎁 ${this.hooks.giveGear(this.gearNear(L), rar)}`);
      }
      if (Math.random() < (r.heroic ? 1 : 0.5)) lines.push(`🎁 ${this.hooks.giveGear(pick(WARDEN_SET), r.heroic ? 'epic' : 'rare')}`);
      if (Math.random() < (r.heroic ? 0.35 : 0.12)) lines.push(`👑 ${this.hooks.giveGear('morvains_crown', r.heroic ? 'legendary' : 'epic')}`);
      addItem(p, 'diamond', r.heroic ? 2 : 1);
      lines.push(`${r.heroic ? 2 : 1}× Diamond`);
      const summary = this.end('clear');
      pr.used = true;
      this.hooks.onClear?.(summary, lines);
      return;
    }
    this.world.aura(pr.obj, 0xf2c14e);
    this.hooks.sfx('chest');
    this.hooks.toast(`🎁 <b>Coffer</b><br>${lines.join(' · ')}`, 'good');
  }

  gearNear(level) {
    const gear = Object.values(GEAR).filter(g => g.level <= level + 1 && g.level >= level - 7 && !g.arena && !g.slayer);
    return (gear.length ? pick(gear) : pick(Object.values(GEAR))).id;
  }

  // ---------------- per-frame
  update(dt) {
    if (!this.run) return;
    this.lastDt = dt;
    const w = this.world, pp = w.player.position;
    for (const o of this.anims) if (Math.abs(o.position.x - pp.x) + Math.abs(o.position.z - pp.z) < 70) o.userData.anim(w.time);
    if (!this.run.platesDone) this.updatePlates();
    this.updateGuard();
    if (!this.run) return;
    this.updateBlades();
    this.updateBoss();
    for (const e of w.enemies) if (e.def.dungeon && e.state === 'dead' && !e.counted) { e.counted = true; if (this.run) this.run.kills++; }
  }
}

// A time like 4:07.
export function clock(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
