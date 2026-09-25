// The Endless Rift: a roguelike dungeon. Every floor is generated fresh: rooms joined by
// corridors, foes that get tougher the deeper you go, treasure, traps, shrines that grant
// run-only boons, and a boss every 5 floors. Fall and the run ends; you keep half your
// Rift Shards. Spend shards on permanent upgrades with Warden Nyx.
import * as THREE from 'three';
import { ENEMIES, GEAR, RULES } from './data.js';
import { ITEMS, addItem } from './items.js';
import { mat, glowMat, mergeGeometries, makeChest, makeShrine, makeCrystal, makeTorch, makePortal, makeFountain, makeWizard, makeRock } from './models.js';
import { insideShape } from './world.js';

export const RIFT_X = -1400;
const C = 3;           // world units per grid cell
const W = 44, H = 44;  // grid size in cells
const OX = RIFT_X - (W * C) / 2, OZ = -(H * C) / 2;

// ------------------------------------------------------------ data

export const BOONS = {
  ember_heart:   { name: 'Ember Heart',     icon: '❤️‍🔥', rarity: 'common', desc: '+15% damage',                                   mods: { dmg: 0.15 } },
  glass_soul:    { name: 'Glass Soul',      icon: '🔮', rarity: 'rare',   desc: '+40% damage, but −25% max health',             mods: { dmg: 0.4, hp: -0.25 } },
  vamp_sigil:    { name: 'Vampiric Sigil',  icon: '🩸', rarity: 'rare',   desc: 'Heal for 6% of the damage you deal',           mods: { lifesteal: 0.06 } },
  thunder_chain: { name: 'Thunder Chain',   icon: '⚡', rarity: 'rare',   desc: 'Hits have a 25% chance to arc to another foe for half damage', mods: { chain: 0.25 } },
  frost_step:    { name: 'Frost Step',      icon: '❄️', rarity: 'common', desc: 'Dodging blasts nearby foes with a frost nova', mods: { nova: 1 } },
  swift_boots:   { name: 'Swift Boots',     icon: '👟', rarity: 'common', desc: '+20% move speed',                               mods: { speed: 0.2 } },
  battery:       { name: 'Arcane Battery',  icon: '🔋', rarity: 'common', desc: 'Spells cost 25% less mana',                     mods: { cost: -0.25 } },
  quickening:    { name: 'Quickening',      icon: '⏳', rarity: 'rare',   desc: 'Cooldowns recover 18% faster',                  mods: { cd: -0.18 } },
  iron_skin:     { name: 'Iron Skin',       icon: '🛡️', rarity: 'common', desc: 'Take 12% less damage',                         mods: { taken: -0.12 } },
  clover:        { name: 'Lucky Clover',    icon: '🍀', rarity: 'common', desc: '+10% critical hit chance',                      mods: { crit: 0.1 } },
  executioner:   { name: 'Executioner',     icon: '🪓', rarity: 'rare',   desc: '+50% damage to foes below 30% health',          mods: { execute: 0.5 } },
  phoenix:       { name: 'Phoenix Feather', icon: '🪶', rarity: 'epic',   desc: 'The first time you fall, rise again with 50% health', mods: { revive: 1 } },
  gold_rush:     { name: 'Gold Rush',       icon: '💰', rarity: 'common', desc: '+60% gold from foes',                           mods: { gold: 0.6 } },
  shard_magnet:  { name: 'Shard Magnet',    icon: '🧲', rarity: 'common', desc: '+35% Rift Shards',                              mods: { shards: 0.35 } },
  giant_slayer:  { name: 'Giant Slayer',    icon: '🗡️', rarity: 'rare',   desc: '+35% damage to elites and bosses',              mods: { big: 0.35 } },
  thorns:        { name: 'Bramble Ward',    icon: '🌵', rarity: 'common', desc: 'Attackers take 30% of the damage they deal you', mods: { thorns: 0.3 } },
  second_heart:  { name: 'Second Heart',    icon: '💗', rarity: 'common', desc: '+20% max health',                               mods: { hp: 0.2 } },
  mana_spring:   { name: 'Mana Spring',     icon: '💧', rarity: 'common', desc: 'Mana regenerates twice as fast',                mods: { mana: 1 } },
  troll_blood:   { name: 'Troll Blood',     icon: '🧌', rarity: 'rare',   desc: 'Regenerate 1.2% health per second, even in battle', mods: { regen: 0.012 } },
  cinder_touch:  { name: 'Cinder Touch',    icon: '🔥', rarity: 'common', desc: 'Your basic attack also burns for 60% more over 3 seconds', mods: { burn: 0.6 } },
  starfall_combo:{ name: 'Starfall Combo',  icon: '🌠', rarity: 'epic',   desc: 'Combo strikes call down a meteor on every nearby foe', mods: { comboMeteor: 1 } },
  berserker:     { name: 'Berserker',       icon: '😤', rarity: 'epic',   desc: 'Up to +60% damage the lower your health',       mods: { berserk: 0.6 } },
};
for (const [id, b] of Object.entries(BOONS)) b.id = id;
export const RARITY = { common: { color: '#cfc6ee', weight: 60 }, rare: { color: '#6fb8ff', weight: 30 }, epic: { color: '#c542ff', weight: 10 } };

export const UPGRADES = {
  vigor:      { name: 'Rift Vigor',     icon: '❤️', cost: [20, 40, 70, 110, 160], desc: '+8% max health in the Rift per rank' },
  potency:    { name: 'Rift Potency',   icon: '⚔️', cost: [20, 40, 70, 110, 160], desc: '+6% damage in the Rift per rank' },
  flask:      { name: 'Keeper\'s Flask', icon: '🧪', cost: [30, 60, 100], desc: 'Start every run with +1 healing potion per rank' },
  fortune:    { name: 'Shard Fortune',  icon: '🔮', cost: [25, 50, 90, 140], desc: '+15% Rift Shards per rank' },
  insight:    { name: 'Shrine Insight', icon: '👁️', cost: [120], desc: 'Shrines offer 4 boons instead of 3' },
  reroll:     { name: 'Fickle Fate',    icon: '🎲', cost: [60, 120], desc: 'Reroll a shrine\'s offer once per run per rank' },
  secondwind: { name: 'Second Wind',    icon: '🕊️', cost: [250], desc: 'Once per run, survive a killing blow with 40% health' },
  deepstart:  { name: 'Deep Delver',    icon: '🪜', cost: [150, 300], requires: [10, 15], desc: 'Start runs 5 floors deeper per rank (best floor 10, then 15)' },
  voidling:   { name: 'Voidling',       icon: '👁️', cost: [200], pet: 'voidling', desc: 'Adopt a little void creature that follows you and zaps foes' },
};

// Deeper floors draw foes from every land you can visit (older foes drop out as new ones arrive).
const POOL = [
  { from: 1, to: 14, ids: ['gloomsprig', 'cinder_rat', 'frost_wisp'] },
  { from: 3, to: 18, ids: ['hollow_knight', 'storm_crow'] },
  { from: 5, to: 22, ids: ['lava_imp', 'cinderhound', 'ashen_shaman'] },
  { from: 8, to: 26, ids: ['obsidian_golem', 'magma_serpent', 'magma_guard'] },
  { from: 12, to: 32, ids: ['wyrmling', 'drake', 'dragon_cultist'] },
  { from: 16, to: 38, ids: ['snow_wolf', 'frost_wraith', 'yeti', 'ice_golem'] },
  { from: 20, ids: ['gale_sprite', 'stormhorn', 'skyraider', 'tempest_golem'] },
  { from: 25, ids: ['briar_stalker', 'pixie', 'spore_shambler', 'treant', 'blight_horror'] },
  { from: 30, ids: ['sorrowshade', 'deathless', 'bone_magus', 'pale_templar'] },
];
// A guardian every 5 floors; deeper floors can call up the great bosses of later lands.
const BOSSES = [
  { base: 'lord_hollowmere', name: 'Echo of Hollowmere' },
  { base: 'pyrrhon', name: 'Shade of Pyrrhon' },
  { base: 'obsidian_golem', name: 'The Rift Colossus', scale: 2.2 },
  { base: 'sylvara', name: 'Rift-Frozen Queen', from: 15 },
  { base: 'ice_golem', name: 'The Glacier Titan', scale: 2.4, from: 15 },
  { base: 'thunder_roc', name: 'The Rift Roc', scale: 1.8, from: 20 },
  { base: 'treant', name: 'The Rotting Elder', scale: 2.2, from: 25 },
  { base: 'bone_colossus', name: 'The Ossuary King', scale: 1.6, from: 30 },
];
const ELITES = {
  vicious:   { name: 'Vicious',   dmg: 1.5 },
  armored:   { name: 'Armored',   hp: 1.8, taken: 0.8 },
  swift:     { name: 'Swift',     speed: 1.5, rate: 0.7 },
  vampiric:  { name: 'Vampiric',  drain: 0.5 },
  explosive: { name: 'Explosive', explode: true },
};

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];

// Scales a normal enemy to the floor you are on (and your level).
function riftFoe(baseId, floor, playerLevel, { elite = null, boss = null } = {}) {
  const b = ENEMIES[baseId];
  const eff = Math.max(1, Math.round(Math.max(b.level, playerLevel * 0.85) + floor * 0.55));
  const k = eff - b.level;
  const d = { ...b, id: b.id, level: eff, rift: true };
  d.hp = Math.round(b.hp * Math.max(0.6, 1 + k * 0.11));
  d.dmgMult = Math.max(0.6, 1 + k * 0.075);
  d.xp = Math.round(b.xp * Math.max(0.5, 1 + k * 0.1) * 0.8);
  d.gold = [Math.round(b.gold[0] * (1 + floor * 0.05)), Math.round(b.gold[1] * (1 + floor * 0.05))];
  if (elite) {
    const a = ELITES[elite];
    d.elite = elite;
    d.name = `${a.name} ${b.name}`;
    d.level += 2;
    d.hp = Math.round(d.hp * (a.hp || 1.4));
    d.dmgMult *= a.dmg || 1.15;
    d.takenMult = a.taken || 1;
    d.speed = b.speed * (a.speed || 1);
    d.attackRate = b.attackRate * (a.rate || 1);
    d.drainHit = a.drain || 0;
    d.explode = !!a.explode;
    d.xp *= 3;
    d.scale = 1.25;
  }
  if (boss) {
    d.name = boss.name;
    d.boss = true;
    d.level += 3;
    d.hp = Math.round(d.hp * (b.boss ? 1.3 : 6));
    d.dmgMult *= b.boss ? 1 : 1.3;
    d.xp *= b.boss ? 1 : 8;
    d.gold = [d.gold[0] * 4, d.gold[1] * 4];
    d.scale = boss.scale || 1;
    d.speed = b.speed * 0.6;
    d.aggro = 14;
    if (!b.boss) d.phases = [{ at: 0.5, say: 'The Rift makes me stronger!', blade: 0.4, shield: 0.3 }];
    d.drops = (b.drops || []).map(x => ({ ...x, chance: x.chance * 0.35 }));
  }
  return d;
}

// ------------------------------------------------------------ floor generation

function generate(floor) {
  const grid = new Int16Array(W * H).fill(-2);   // -2 wall · -1 corridor · n room index
  const rooms = [];
  const boss = floor % 5 === 0;
  if (boss) {
    rooms.push({ x: 4, z: 17, w: 6, h: 6 });
    rooms.push({ x: 18, z: 12, w: 16, h: 16 });
  } else {
    const target = Math.min(11, 6 + Math.floor(floor / 3));
    for (let tries = 0; tries < 400 && rooms.length < target; tries++) {
      const w = 5 + rnd(4), h = 5 + rnd(4);
      const x = 1 + rnd(W - w - 2), z = 1 + rnd(H - h - 2);
      if (rooms.some(r => x < r.x + r.w + 3 && x + w + 3 > r.x && z < r.z + r.h + 3 && z + h + 3 > r.z)) continue;
      rooms.push({ x, z, w, h });
    }
  }
  rooms.forEach((r, i) => {
    r.id = i;
    r.cx = r.x + r.w / 2;
    r.cz = r.z + r.h / 2;
    for (let j = r.z; j < r.z + r.h; j++) for (let k = r.x; k < r.x + r.w; k++) grid[j * W + k] = i;
  });
  // connect every room (minimum spanning tree) plus a couple of loops
  const edges = [];
  const inTree = new Set([0]);
  while (inTree.size < rooms.length) {
    let best = null;
    for (const a of inTree) for (const b of rooms) {
      if (inTree.has(b.id)) continue;
      const d = Math.hypot(rooms[a].cx - b.cx, rooms[a].cz - b.cz);
      if (!best || d < best.d) best = { a, b: b.id, d };
    }
    edges.push([best.a, best.b]);
    inTree.add(best.b);
  }
  if (!boss) for (let n = 0; n < 2; n++) {
    const a = rnd(rooms.length), b = rnd(rooms.length);
    if (a !== b && !edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) edges.push([a, b]);
  }
  const carve = (x, z) => { for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const i = (z + dz) * W + x + dx; if (x + dx < W - 1 && z + dz < H - 1 && grid[i] === -2) grid[i] = -1; } };
  for (const [a, b] of edges) {
    let x = Math.floor(rooms[a].cx), z = Math.floor(rooms[a].cz);
    const tx = Math.floor(rooms[b].cx), tz = Math.floor(rooms[b].cz);
    const xFirst = Math.random() < 0.5;
    const stepX = () => { while (x !== tx) { carve(x, z); x += Math.sign(tx - x); } };
    const stepZ = () => { while (z !== tz) { carve(x, z); z += Math.sign(tz - z); } };
    if (xFirst) { stepX(); stepZ(); } else { stepZ(); stepX(); }
    carve(x, z);
  }
  // start in one corner room, exit in the room furthest away along the corridors
  const adj = rooms.map(() => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  const start = boss ? 0 : rooms.reduce((best, r) => (r.cx + r.cz < best.cx + best.cz ? r : best), rooms[0]).id;
  const dist = rooms.map(() => Infinity);
  dist[start] = 0;
  const q = [start];
  while (q.length) { const a = q.shift(); for (const b of adj[a]) if (dist[b] === Infinity) { dist[b] = dist[a] + 1; q.push(b); } }
  const exit = boss ? 1 : rooms.reduce((best, r) => (dist[r.id] > dist[best.id] || (dist[r.id] === dist[best.id] && Math.hypot(r.cx - rooms[start].cx, r.cz - rooms[start].cz) > Math.hypot(best.cx - rooms[start].cx, best.cz - rooms[start].cz)) ? r : best), rooms[0]).id;
  // room types
  const others = rooms.filter(r => r.id !== start && r.id !== exit).sort(() => Math.random() - 0.5);
  for (const r of rooms) r.type = 'combat';
  rooms[start].type = 'start';
  rooms[exit].type = boss ? 'boss' : 'exit';
  const assign = (type) => { const r = others.shift(); if (r) r.type = type; };
  if (!boss) {
    if (others.length >= 2) assign('shrine');
    assign('treasure');
    if (floor >= 3 && others.length >= 3) assign('trap');
    if (floor % 3 === 0 && others.length >= 3) assign('merchant');
    if (others.length >= 4) assign('fountain');
    if (floor >= 6 && others.length >= 4 && Math.random() < 0.5) assign('shrine');
    if (others.length >= 4 && Math.random() < 0.5) assign('treasure');
  }
  return { grid, rooms, start, exit, boss };
}

// ------------------------------------------------------------ the rift

export class Rift {
  constructor({ world, combat, getPlayer, hooks }) {
    this.world = world;
    this.combat = combat;
    this.getPlayer = getPlayer;
    this.hooks = hooks;   // toast, message, sfx, openBoons, onFloor, onMods, fade
    this.run = null;
    this.floor = null;
    this.objects = [];
    this.props = [];
    this.anims = [];
    this.trapT = 0;
    this.seenT = 0;
    world.riftWalk = (x, z) => this.walkable(x, z);
    world.extraInteractables = [...(world.extraInteractables || []), () => this.interactables()];
    world.minimapHook = (ctx, sx, sz, scale, px, pz) => this.drawMinimap(ctx, sx, sz, scale, px, pz);
  }

  get active() { return !!this.run; }

  // ---------------- modifiers from boons and upgrades
  mods() {
    if (!this.run) return null;
    const p = this.getPlayer();
    const m = {};
    const addMods = (obj, k = 1) => { for (const [key, v] of Object.entries(obj)) m[key] = (m[key] || 0) + v * k; };
    for (const id of this.run.boons) addMods(BOONS[id].mods);
    const up = p.rift.upgrades;
    addMods({ hp: 0.08 }, up.vigor || 0);
    addMods({ dmg: 0.06 }, up.potency || 0);
    addMods({ shards: 0.15 }, up.fortune || 0);
    m.revive = Math.max(0, (m.revive || 0) - this.run.revivesUsed);
    return m;
  }

  // ---------------- run lifecycle
  start() {
    const p = this.getPlayer();
    const up = p.rift.upgrades;
    const deep = (up.deepstart || 0) * 5;
    this.run = { floor: 1 + deep, startFloor: 1 + deep, shards: 0, gold: 0, xp: 0, kills: 0, boons: [], rerolls: up.reroll || 0, revivesUsed: 0, secondWind: (up.secondwind || 0) > 0, chests: 0 };
    p.rift.runs++;
    p.potions = Math.min(RULES.maxPotions + (up.flask || 0), p.potions + (up.flask || 0));
    this.hooks.onMods();
    this.buildFloor();
    p.hp = p.maxHp;
    p.mana = p.maxMana;
    this.save();
  }

  // Keeps an in-progress run on the save file so a closed tab can be settled fairly.
  save() {
    const p = this.getPlayer();
    p.rift.run = this.run ? { floor: this.run.floor, shards: this.run.shards } : null;
  }

  descend() {
    this.run.floor++;
    this.hooks.sfx('warp');
    this.hooks.fade(() => { this.buildFloor(); this.save(); });
  }

  // reason: 'exit' (keep everything) · 'death' / 'abandon' (keep half)
  end(reason) {
    const p = this.getPlayer();
    const r = this.run;
    if (!r) return null;
    const keep = reason === 'exit' ? 1 : 0.5;
    const shards = Math.floor(r.shards * keep);
    p.rift.shards += shards;
    p.rift.totalShards = (p.rift.totalShards || 0) + shards;
    const reached = r.floor;
    const newBest = reached > p.rift.best;
    if (newBest) p.rift.best = reached;
    recordBoard(p, reached);
    const summary = { reason, floor: reached, startFloor: r.startFloor, kills: r.kills, shards: r.shards, kept: shards, gold: r.gold, xp: r.xp, boons: [...r.boons], newBest, chests: r.chests };
    this.run = null;
    this.clearFloor();
    p.rift.run = null;
    this.hooks.onMods();
    return summary;
  }

  addShards(n) {
    const m = this.mods();
    const got = Math.max(1, Math.round(n * (1 + (m?.shards || 0))));
    this.run.shards += got;
    this.save();
    return got;
  }

  // ---------------- building a floor
  clearFloor() {
    const w = this.world;
    for (const o of this.objects) { w.scene.remove(o); o.traverse?.(c => { if (c.isMesh) c.geometry.dispose(); }); }
    for (const e of [...w.enemies]) if (e.def.rift) w.removeEnemy(e);
    for (const pr of this.props) pr.label?.el.remove();
    w.labels = w.labels.filter(l => !this.props.some(pr => pr.label === l));
    this.combat.setTarget(null);
    this.objects = [];
    this.props = [];
    this.anims = [];
    this.floor = null;
  }

  buildFloor() {
    this.clearFloor();
    const g = generate(this.run.floor);
    this.floor = { ...g, seen: new Uint8Array(W * H), roomSeen: new Set(), exitOpen: false, cleared: new Set() };
    this.buildMeshes(g);
    this.populate(g);
    const s = g.rooms[g.start];
    const pos = this.cellPos(s.cx - 0.5, s.cz - 0.5);
    this.world.teleport({ x: pos.x, z: pos.z, heading: 0 });
    this.hooks.onFloor(this.run.floor, g.boss);
  }

  cellPos(i, j) { return { x: OX + (i + 0.5) * C, z: OZ + (j + 0.5) * C }; }

  cellAt(x, z) {
    const i = Math.floor((x - OX) / C), j = Math.floor((z - OZ) / C);
    if (i < 0 || j < 0 || i >= W || j >= H) return -2;
    return this.floor.grid[j * W + i];
  }

  walkable(x, z) {
    if (!this.floor) return false;
    const m = 0.55;
    return this.cellAt(x - m, z - m) > -2 && this.cellAt(x + m, z - m) > -2 && this.cellAt(x - m, z + m) > -2 && this.cellAt(x + m, z + m) > -2;
  }

  buildMeshes(g) {
    const scene = this.world.scene;
    const depth = this.run.floor;
    const hue = (0.72 + depth * 0.037) % 1;
    const floorCol = new THREE.Color().setHSL(hue, 0.25, 0.22), floorCol2 = new THREE.Color().setHSL(hue, 0.22, 0.28);
    const wallColor = new THREE.Color().setHSL(hue, 0.25, 0.3).getHex();
    // floor: one quad per cell, gently checkered
    const pos = [], col = [];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (g.grid[j * W + i] === -2) continue;
      const x0 = OX + i * C, z0 = OZ + j * C, x1 = x0 + C, z1 = z0 + C;
      pos.push(x0, 0.02, z0, x0, 0.02, z1, x1, 0.02, z1, x0, 0.02, z0, x1, 0.02, z1, x1, 0.02, z0);
      const c = (i + j) % 2 ? floorCol : floorCol2;
      const v = 0.9 + Math.random() * 0.2;
      for (let n = 0; n < 6; n++) col.push(c.r * v, c.g * v, c.b * v);
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    fg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    fg.computeVertexNormals();
    const floorMesh = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
    floorMesh.receiveShadow = true;
    floorMesh.userData.riftOwned = true;
    scene.add(floorMesh);
    this.objects.push(floorMesh);
    // walls on every edge between floor and rock
    const walls = [], caps = [];
    const wallGeo = new THREE.BoxGeometry(C + 0.8, 3.2, 0.8), capGeo = new THREE.BoxGeometry(C + 1, 0.3, 1);
    const isFloor = (i, j) => i >= 0 && j >= 0 && i < W && j < H && g.grid[j * W + i] > -2;
    const m4 = (x, y, z, rot) => new THREE.Matrix4().makeRotationY(rot).setPosition(x, y, z);
    const torches = [];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (!isFloor(i, j)) continue;
      const cx = OX + (i + 0.5) * C, cz = OZ + (j + 0.5) * C;
      for (const [di, dj, rot] of [[1, 0, Math.PI / 2], [-1, 0, Math.PI / 2], [0, 1, 0], [0, -1, 0]]) {
        if (isFloor(i + di, j + dj)) continue;
        const x = cx + di * C / 2, z = cz + dj * C / 2;
        walls.push({ geo: wallGeo, matrix: m4(x, 1.6, z, rot) });
        caps.push({ geo: capGeo, matrix: m4(x, 3.3, z, rot) });
        if (g.grid[j * W + i] >= 0 && Math.random() < 0.07) torches.push({ x: x - di * 0.55, z: z - dj * 0.55, rot: Math.atan2(-di, -dj) });
      }
    }
    for (const [items, color] of [[walls, wallColor], [caps, new THREE.Color(wallColor).multiplyScalar(1.35).getHex()]]) {
      const mesh = new THREE.Mesh(mergeGeometries(items), mat(color));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.riftOwned = true;
      scene.add(mesh);
      this.objects.push(mesh);
    }
    for (const t of torches.slice(0, 40)) this.addObj(makeTorch(), t.x, t.z, t.rot);
    // crystals and rubble for atmosphere
    const crystal = [0x9a4dff, 0x4dc8ff, 0xff4df2][depth % 3];
    for (const r of g.rooms) {
      for (let n = 0; n < 2; n++) {
        const cx = r.x + (n ? r.w - 0.8 : 0.8), cz = r.z + (Math.random() < 0.5 ? 0.8 : r.h - 0.8);
        const p = this.cellPos(cx - 0.5, cz - 0.5);
        this.addObj(makeCrystal(crystal, 0.8 + Math.random() * 0.6), p.x, p.z, Math.random() * 6);
      }
      if (Math.random() < 0.5) {
        const p = this.cellPos(r.x + 1 + rnd(Math.max(1, r.w - 2)), r.z + 1 + rnd(Math.max(1, r.h - 2)));
        this.addObj(makeRock(0.5 + Math.random() * 0.4, 0x4a4058), p.x, p.z, Math.random() * 6);
      }
    }
  }

  addObj(obj, x, z, rot = 0) {
    obj.position.set(x, 0, z);
    obj.rotation.y = rot;
    this.world.scene.add(obj);
    this.objects.push(obj);
    if (obj.userData.anim) this.anims.push(obj);
    return obj;
  }

  addProp(kind, room, model, x, z, labelHTML, labelY = 2) {
    const obj = this.addObj(model, x, z);
    const pr = { id: `x:rift:${this.props.length}`, kind, room, obj, x, z, used: false, r: 2.6 };
    if (labelHTML) pr.label = this.world.addLabel(obj, labelHTML, 'npc', labelY);
    this.props.push(pr);
    return pr;
  }

  populate(g) {
    const p = this.getPlayer();
    const floor = this.run.floor;
    const pool = POOL.filter(t => floor >= t.from && floor <= (t.to ?? Infinity)).flatMap(t => t.ids);
    const center = (r) => this.cellPos(r.cx - 0.5, r.cz - 0.5);
    const randIn = (r) => this.cellPos(r.x + 1 + Math.random() * (r.w - 3), r.z + 1 + Math.random() * (r.h - 3));
    for (const r of g.rooms) {
      r.foes = [];
      const c = center(r);
      const spawn = (def, pos) => { const e = this.world.addEnemy(def, pos.x, pos.z, 2.5); e.room = r.id; r.foes.push(e); return e; };
      if (r.type === 'combat' || r.type === 'exit' || r.type === 'treasure' || r.type === 'trap') {
        const n = r.type === 'treasure' ? 2 : Math.min(6, 2 + Math.floor(floor / 3) + rnd(2));
        for (let k = 0; k < n; k++) {
          const eliteChance = r.type === 'exit' && k === 0 ? 1 : 0.06 + floor * 0.015;
          const elite = Math.random() < eliteChance ? pick(Object.keys(ELITES)) : null;
          spawn(riftFoe(pick(pool), floor, p.level, { elite }), randIn(r));
        }
      }
      if (r.type === 'boss') {
        const bosses = BOSSES.filter(b => floor >= (b.from || 0));
        const b = floor < 20 ? bosses[(Math.floor(floor / 5) - 1) % bosses.length] : bosses[Math.floor(Math.random() * bosses.length)];
        const e = spawn(riftFoe(b.base, floor, p.level, { boss: b }), c);
        e.wanderR = 0;
      }
      if (r.type === 'exit' || r.type === 'boss') {
        const pos = r.type === 'boss' ? this.cellPos(r.x + r.w - 2, r.cz - 0.5) : c;
        const portal = this.addProp('exit', r.id, makePortal(0x9a4dff), pos.x, pos.z, '<div class="name">🌀 Rift Portal</div><div class="sub">Sealed: defeat the guardians</div>', 6.4);
        portal.r = 3.5;
        this.floor.exitProp = portal;
        if (r.type === 'boss') {
          const lp = this.cellPos(r.x + r.w - 2, r.z + 1.5);
          const leave = this.addProp('leave', r.id, makePortal(0xf2c14e), lp.x, lp.z, '<div class="name">✨ Rift Exit</div><div class="sub">Leave with all your shards</div>', 6.4);
          leave.r = 3.5;
          leave.hidden = true;
          leave.obj.visible = false;
          this.floor.leaveProp = leave;
        }
      }
      if (r.type === 'treasure') this.addProp('chest', r.id, makeChest(floor >= 10 ? 0xc542ff : 0xf2c14e), c.x, c.z, '<div class="name">🎁 Rift Chest</div>', 1.8);
      if (r.type === 'shrine') this.addProp('shrine', r.id, makeShrine(), c.x, c.z, '<div class="name">✨ Boon Shrine</div><div class="sub">Choose a blessing</div>', 3.4);
      if (r.type === 'fountain') {
        const f = makeFountain();
        f.scale.setScalar(0.6);
        this.addProp('fountain', r.id, f, c.x, c.z, '<div class="name">💧 Rift Spring</div><div class="sub">Heals once</div>', 3.2).r = 3.4;
      }
      if (r.type === 'merchant') {
        const m = makeWizard({ robe: 0x3a2a5a, hat: 0x1a1030, trim: 0x9a4dff, gem: 0x9a4dff, hatStyle: 'hood', backpack: true, skin: 0xb8a0d0, eyeColor: 0x9a4dff });
        const pr = this.addProp('merchant', r.id, m, c.x, c.z, '<div class="name">🛒 Rift Peddler</div><div class="sub">Boons for gold</div>', 3);
        pr.stock = this.rollBoons(3);
      }
    }
  }

  // ---------------- boons
  rollBoons(n) {
    const run = this.run;
    const out = [];
    const avail = Object.values(BOONS).filter(b => !(b.id === 'phoenix' && run.boons.includes('phoenix')));
    while (out.length < n && out.length < avail.length) {
      const total = avail.reduce((s, b) => s + (out.includes(b.id) ? 0 : RARITY[b.rarity].weight), 0);
      let roll = Math.random() * total;
      for (const b of avail) {
        if (out.includes(b.id)) continue;
        roll -= RARITY[b.rarity].weight;
        if (roll <= 0) { out.push(b.id); break; }
      }
    }
    return out;
  }

  grantBoon(id) {
    this.run.boons.push(id);
    this.hooks.onMods();
    this.hooks.toast(`${BOONS[id].icon} <b>${BOONS[id].name}</b>: ${BOONS[id].desc}`, 'good');
    this.hooks.sfx('shrine');
    this.world.aura(this.world.player, 0xc542ff);
  }

  offerBoons(pr) {
    const p = this.getPlayer();
    const n = 3 + (p.rift.upgrades.insight || 0);
    const show = (choices) => this.hooks.openBoons(choices, {
      rerolls: this.run.rerolls,
      onPick: (id) => { pr.used = true; this.markUsed(pr); this.grantBoon(id); },
      onReroll: () => { this.run.rerolls--; show(this.rollBoons(n)); },
    });
    show(this.rollBoons(n));
  }

  markUsed(pr) {
    if (pr.label) pr.label.el.classList.add('used');
    if (pr.obj.userData.use) pr.obj.userData.use();
  }

  // ---------------- interactions
  interactables() {
    if (!this.floor) return [];
    const out = [];
    for (const pr of this.props) {
      if (pr.used || pr.hidden) continue;
      const labels = { chest: 'open the chest', shrine: 'pray at the shrine', fountain: 'drink from the spring', merchant: 'trade with the Rift Peddler', exit: this.floor.exitOpen ? 'descend deeper' : 'the portal is sealed', leave: 'leave the Rift' };
      out.push({ id: pr.id, x: pr.x, z: pr.z, r: pr.r, label: labels[pr.kind] });
    }
    return out;
  }

  interact(id) {
    const pr = this.props.find(x => x.id === id);
    if (!pr || pr.used) return false;
    const p = this.getPlayer(), w = this.world;
    switch (pr.kind) {
      case 'chest': this.openChest(pr); break;
      case 'shrine': this.offerBoons(pr); break;
      case 'fountain':
        pr.used = true;
        this.markUsed(pr);
        p.hp = p.maxHp;
        p.mana = p.maxMana;
        w.aura(w.player, 0x7fe3ff);
        this.hooks.sfx('heal');
        this.hooks.toast('💧 The Rift Spring restores you completely.', 'good');
        break;
      case 'merchant': this.hooks.openMerchant(pr); break;
      case 'exit':
        if (!this.floor.exitOpen) { this.hooks.message('The portal is sealed. Defeat the guardians of this room!'); this.hooks.sfx('fail'); break; }
        this.descend();
        break;
      case 'leave': this.hooks.leave(); break;
    }
    return true;
  }

  openChest(pr) {
    const p = this.getPlayer();
    const floor = this.run.floor;
    const room = this.floor.rooms[pr.room];
    if (room.foes.some(e => e.state !== 'dead')) { this.hooks.message('Guardians still watch the chest!'); this.hooks.sfx('fail'); return; }
    pr.used = true;
    this.markUsed(pr);
    this.run.chests++;
    const gold = Math.round((20 + floor * 12) * (1 + (this.mods()?.gold || 0)));
    p.gold += gold;
    this.run.gold += gold;
    const shards = this.addShards(4 + floor);
    const lines = [`+${gold} gold`, `+${shards} 🔮`];
    // materials from deeper floors are rarer
    const mats = floor < 5 ? ['copper_ore', 'iron_ore', 'moonleaf', 'sunpetal', 'oak_logs'] : floor < 10 ? ['iron_ore', 'silver_ore', 'gold_ore', 'glowcap', 'willow_logs', 'sapphire'] : ['gold_ore', 'emberite_ore', 'starmetal_ore', 'emberroot', 'frostbloom', 'ruby', 'emerald'];
    for (let k = 0; k < 2; k++) { const m = pick(mats); const n = 1 + rnd(3); addItem(p, m, n); lines.push(`${n}× ${ITEMS[m].name}`); }
    if (Math.random() < 0.08 + floor * 0.01) { addItem(p, 'diamond'); lines.push('1× Diamond'); }
    // a piece of gear around your level
    if (Math.random() < 0.45) {
      const gear = Object.values(GEAR).filter(gd => gd.level <= p.level + 2 && gd.level >= p.level - 6);
      if (gear.length) { const gd = pick(gear); lines.push(`🎁 ${this.hooks.giveGear(gd.id, floor)}`); }
    }
    this.world.aura(pr.obj, 0xf2c14e);
    this.hooks.sfx('chest');
    this.hooks.toast(`🎁 <b>Rift Chest</b><br>${lines.join(' · ')}`, 'good');
  }

  // Called by the game when a rift foe falls.
  onKill(e) {
    if (!this.run) return;
    const d = e.def;
    this.run.kills++;
    const got = this.addShards(d.boss ? 25 + this.run.floor * 2 : d.elite ? 3 + this.run.floor / 3 : 1 + this.run.floor / 5);
    this.world.float(e.model, `+${got} 🔮`, 'xp');
    if (d.explode) {
      const pos = e.model.position;
      const spec = { shape: 'circle', x: pos.x, z: pos.z, r: 3.6, dur: 1.1, color: 0xff7a1a };
      this.world.telegraph(spec);
      this.hooks.sfx('warn');
      setTimeout(() => {
        if (!this.run) return;
        this.world.groundBurst(spec.x, spec.z, 0xff7a1a, 30, 7);
        this.world.shake(0.4);
        this.hooks.sfx('bighit');
        const pp = this.world.player.position;
        if (insideShape(spec, pp.x, pp.z)) this.combat.envHit(this.getPlayer().maxHp * 0.18, 'blaze');
      }, 1100);
    }
    if (d.boss) {
      this.hooks.toast(`🏆 <b>${d.name}</b> is defeated! The Rift Exit has opened. Leave with every shard, or dive deeper…`, 'good');
      if (this.floor.leaveProp) { this.floor.leaveProp.hidden = false; this.floor.leaveProp.obj.visible = true; }
      const c = this.floor.rooms[e.room];
      const pos = this.cellPos(c.cx - 0.5, c.cz + 1.5);
      this.addProp('chest', e.room, makeChest(0xc542ff), pos.x, pos.z, '<div class="name">🎁 Guardian\'s Hoard</div>', 1.8);
    }
  }

  // ---------------- per-frame
  update(dt) {
    if (!this.run || !this.floor) return;
    const w = this.world, pp = w.player.position, f = this.floor;
    for (const o of this.anims) if (Math.abs(o.position.x - pp.x) + Math.abs(o.position.z - pp.z) < 60) o.userData.anim(w.time);
    // exploring reveals the minimap
    this.seenT -= dt;
    if (this.seenT <= 0) {
      this.seenT = 0.25;
      const ci = Math.floor((pp.x - OX) / C), cj = Math.floor((pp.z - OZ) / C);
      for (let j = cj - 5; j <= cj + 5; j++) for (let i = ci - 5; i <= ci + 5; i++) if (i >= 0 && j >= 0 && i < W && j < H) f.seen[j * W + i] = 1;
      const room = this.cellAt(pp.x, pp.z);
      if (room >= 0 && !f.roomSeen.has(room)) {
        f.roomSeen.add(room);
        const r = f.rooms[room];
        for (let j = r.z - 1; j <= r.z + r.h; j++) for (let i = r.x - 1; i <= r.x + r.w; i++) if (i >= 0 && j >= 0 && i < W && j < H) f.seen[j * W + i] = 1;
        if (r.type === 'shrine') this.hooks.message('A shrine hums with power here…');
        if (r.type === 'trap') this.hooks.message('⚠️ The floor here is trapped: watch your step!');
        if (r.type === 'merchant') this.hooks.message('A Rift Peddler waves you over.');
      }
    }
    // rooms cleared, the exit unsealing
    for (const r of f.rooms) {
      if (!r.foes.length || f.cleared.has(r.id) || r.foes.some(e => e.state !== 'dead')) continue;
      f.cleared.add(r.id);
      if (r.type === 'exit' || r.type === 'boss') {
        f.exitOpen = true;
        if (f.exitProp?.label) f.exitProp.label.el.querySelector('.sub').textContent = 'Open: descend deeper';
        this.hooks.sfx('door');
        this.hooks.toast('🌀 The Rift Portal opens! The way down is clear.', 'good');
      } else if (r.type === 'combat') {
        const got = this.addShards(2);
        this.hooks.message(`Room cleared! +${got} 🔮`);
      }
    }
    // trap rooms spit spikes at you
    const room = this.cellAt(pp.x, pp.z);
    if (room >= 0 && f.rooms[room].type === 'trap') {
      this.trapT -= dt;
      if (this.trapT <= 0) {
        this.trapT = 2.4 - Math.min(1, this.run.floor * 0.05);
        const r = f.rooms[room];
        for (let n = 0; n < 3; n++) {
          const pos = n === 0 ? { x: pp.x, z: pp.z } : this.cellPos(r.x + Math.random() * r.w - 0.5, r.z + Math.random() * r.h - 0.5);
          const spec = Math.random() < 0.3
            ? { shape: 'line', x: pos.x - 6, z: pos.z, dir: Math.PI / 2, len: 12, width: 1.6, dur: 1.1, color: 0xb0a8c0 }
            : { shape: 'circle', x: pos.x, z: pos.z, r: 1.8, dur: 1.0, color: 0xb0a8c0 };
          w.telegraph(spec);
          setTimeout(() => {
            if (!this.run) return;
            w.groundBurst(spec.shape === 'line' ? spec.x + 6 : spec.x, spec.z, 0xdddddd, 10, 4);
            const q = w.player.position;
            if (insideShape(spec, q.x, q.z)) this.combat.envHit(this.getPlayer().maxHp * 0.1, 'arcane');
          }, spec.dur * 1000);
        }
      }
    }
  }

  // ---------------- minimap
  drawMinimap(ctx, sx, sz, scale, px, pz) {
    if (!this.floor) return false;
    const f = this.floor;
    const s = C * scale + 0.6;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const v = f.grid[j * W + i];
      if (v === -2 || !f.seen[j * W + i]) continue;
      const x = OX + i * C, z = OZ + j * C;
      if (Math.abs(x - px) > 70 || Math.abs(z - pz) > 70) continue;
      ctx.fillStyle = v >= 0 ? (f.rooms[v].type === 'trap' ? '#6a4a5a' : '#5d4a88') : '#4a3c6a';
      ctx.fillRect(sx(x), sz(z), s, s);
    }
    for (const pr of this.props) {
      if (pr.used || pr.hidden || !f.seen[this.cellIndex(pr.x, pr.z)]) continue;
      ctx.fillStyle = { chest: '#f2c14e', shrine: '#c542ff', fountain: '#6fd3ff', merchant: '#9fffb0', exit: f.exitOpen ? '#b46bff' : '#6a5a7a', leave: '#f2c14e' }[pr.kind];
      ctx.beginPath();
      ctx.arc(sx(pr.x), sz(pr.z), pr.kind === 'exit' ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return true;
  }

  cellIndex(x, z) {
    const i = Math.floor((x - OX) / C), j = Math.floor((z - OZ) / C);
    return Math.max(0, Math.min(W * H - 1, j * W + i));
  }
}

// The best runs across every save slot on this device.
function recordBoard(p, floor) {
  try {
    const board = JSON.parse(localStorage.getItem('darquest-rift-board') || '[]');
    board.push({ name: p.name, school: p.school, level: p.level, floor, date: Date.now() });
    board.sort((a, b) => b.floor - a.floor || a.date - b.date);
    localStorage.setItem('darquest-rift-board', JSON.stringify(board.slice(0, 10)));
  } catch { /* ignore */ }
}

export function riftBoard() {
  try { return JSON.parse(localStorage.getItem('darquest-rift-board') || '[]'); } catch { return []; }
}
