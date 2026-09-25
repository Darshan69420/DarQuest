// The Arena of Stars: duel rival wizards one-on-one, climb from Bronze to Starfall Champion,
// and spend Arena Tokens with Arenamaster Vex. Rivals cast real spells, dodge, and fill the
// floor with area attacks.
import * as THREE from 'three';
import { SCHOOLS, SPELLS, PLAYABLE_SCHOOLS } from './data.js';
import { makeWizard, makeCampfire, makeBanner } from './models.js';

export const ARENA_X = -4200;

export const ARENA_RANKS = [
  { name: 'Bronze', icon: '🥉', duels: 3, lvl: 0, color: '#d4803a' },
  { name: 'Silver', icon: '🥈', duels: 3, lvl: 2, color: '#dfe6f0' },
  { name: 'Gold', icon: '🥇', duels: 3, lvl: 4, color: '#f2c14e' },
  { name: 'Platinum', icon: '💠', duels: 3, lvl: 6, color: '#9fd6ff' },
  { name: 'Starfall Champion', icon: '🏆', duels: 1, lvl: 9, color: '#c542ff' },
];

export const ARENA_SHOP = [
  { id: 'gladiator_helm', cost: 30 },
  { id: 'gladiator_robe', cost: 45 },
  { id: 'gladiator_boots', cost: 30 },
  { id: 'champions_orb', cost: 80 },
];

const FIRST = ['Kael', 'Mira', 'Thorne', 'Vesper', 'Rook', 'Isolde', 'Fenwick', 'Seraphine', 'Dax', 'Luma', 'Oberon', 'Nyssa'];
const EPITHET = ['the Swift', 'Stormhand', 'the Unbroken', 'Moonblade', 'the Clever', 'Ironwill', 'the Radiant', 'Duskwalker', 'the Bold', 'Frostfang', 'the Wise', 'Emberheart'];

// The rival you face for a given rank and duel number.
export function rivalFor(rank, duel, playerLevel) {
  const r = ARENA_RANKS[rank];
  const champion = rank === ARENA_RANKS.length - 1;
  const i = rank * 3 + duel;
  const school = champion ? 'arcane' : PLAYABLE_SCHOOLS[(i * 5 + 1) % PLAYABLE_SCHOOLS.length];
  const level = Math.max(3, playerLevel - 1 + r.lvl);
  const spells = Object.values(SPELLS).filter(s => !s.enemy && !s.pet && (s.school === school || s.school === 'astral') && s.level <= level).map(s => s.id);
  const sc = SCHOOLS[school];
  const def = {
    id: 'rival', rival: true, name: champion ? 'Grand Magus Elyndra' : `${FIRST[i % FIRST.length]} ${EPITHET[(i * 7) % EPITHET.length]}`,
    school, level, model: 'rival', boss: champion,
    hp: Math.round((sc.baseHp + (level - 1) * 50) * (1.7 + r.lvl * 0.12)),
    dmgMult: 0.7 + r.lvl * 0.06, xp: 40 + level * 25, gold: [0, 0],
    spells, resist: { [school]: 0.2 }, boost: {}, speed: 3.2, aggro: 60, range: 11, attackRate: 2.2 - r.lvl * 0.08,
    evade: 0.1 + r.lvl * 0.015, drops: [],
  };
  // their biggest spells hit an area you must step out of
  def.aoe = {};
  for (const id of spells) {
    const s = SPELLS[id];
    if (s.target === 'all') def.aoe[id] = { shape: 'circle', r: 4.2, dur: 1.2 };
    else if (s.pips >= 5) def.aoe[id] = { shape: 'circle', r: 3.4, count: 3, spread: 5, dur: 1.4 };
    else if (s.pips >= 4) def.aoe[id] = { shape: 'line', len: 13, width: 2.4, dur: 1.1 };
  }
  def.buildModel = () => makeRival(def);
  def.look = { robe: champion ? 0xf2f0ff : sc.color, hat: champion ? 0xf2c14e : new THREE.Color(sc.color).multiplyScalar(0.45).getHex(), trim: champion ? 0xc542ff : 0x2a2a34, gem: sc.color, hair: [0x2a1a14, 0xe0702a, 0xf2f0ff, 0x6b4226][i % 4], eyeColor: sc.color };
  return def;
}

export function makeRival(def) {
  const m = makeWizard(def.look);
  m.scale.setScalar(def.boss ? 1.15 : 1);
  return m;
}

export function arenaRewards(rank, level) {
  return { gold: 60 + level * 15 + rank * 50, tokens: 5 + rank * 3, xp: 80 + level * 30 };
}

// Builds the colosseum far to the west.
export function buildArena(world) {
  const scene = world.scene;
  const X = ARENA_X;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(24, 48), new THREE.MeshStandardMaterial({ color: 0xd8c090, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(X, 0.01, 0);
  floor.receiveShadow = true;
  scene.add(floor);
  const ring = new THREE.Mesh(new THREE.RingGeometry(10, 11, 48), new THREE.MeshStandardMaterial({ color: 0xb8a070, roughness: 1 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(X, 0.02, 0);
  scene.add(ring);
  const star = new THREE.Mesh(new THREE.CircleGeometry(3, 5), new THREE.MeshStandardMaterial({ color: 0xc542ff, emissive: 0x6a2a9a, emissiveIntensity: 0.5 }));
  star.rotation.x = -Math.PI / 2;
  star.position.set(X, 0.03, 0);
  scene.add(star);
  // walls and tiers of seats
  const stone = new THREE.MeshStandardMaterial({ color: 0x9a8a78, roughness: 1, side: THREE.DoubleSide });
  const stone2 = new THREE.MeshStandardMaterial({ color: 0x7a6a5a, roughness: 1, side: THREE.DoubleSide });
  for (let t = 0; t < 5; t++) {
    const r = 25 + t * 2.4, h = 1.6 + t * 1.3;
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(r + 2.4, r + 2.4, h, 48, 1, true), t % 2 ? stone : stone2);
    tier.position.set(X, h / 2, 0);
    scene.add(tier);
    const top = new THREE.Mesh(new THREE.RingGeometry(r, r + 2.4, 48), t % 2 ? stone2 : stone);
    top.rotation.x = -Math.PI / 2;
    top.position.set(X, h, 0);
    scene.add(top);
  }
  // a cheering crowd
  const crowdGeo = new THREE.SphereGeometry(0.45, 8, 6);
  const crowd = new THREE.InstancedMesh(crowdGeo, new THREE.MeshStandardMaterial({ roughness: 1 }), 420);
  const cols = [0xff6a2b, 0x6fd3ff, 0xb46bff, 0x5fdc6a, 0x9a8cff, 0xf2c14e, 0xe8455c, 0xffffff];
  const seats = [];
  for (let k = 0; k < 420; k++) {
    const t = k % 5, a = Math.random() * Math.PI * 2, r = 26.2 + t * 2.4;
    seats.push({ x: Math.cos(a) * r, y: 1.6 + t * 1.3 + 0.5, z: Math.sin(a) * r, ph: Math.random() * 10 });
    crowd.setColorAt(k, new THREE.Color(cols[k % cols.length]));
  }
  scene.add(crowd);
  const m4 = new THREE.Matrix4();
  crowd.userData.anim = (t) => {
    const cheer = world.arenaCheer || 0;
    seats.forEach((s, k) => { m4.makeTranslation(s.x, s.y + Math.abs(Math.sin(t * (3 + cheer * 6) + s.ph)) * (0.1 + cheer * 0.5), s.z); crowd.setMatrixAt(k, m4); });
    crowd.instanceMatrix.needsUpdate = true;
  };
  crowd.position.set(X, 0, 0);
  crowd.userData.anim(0);
  crowd.frustumCulled = false;
  world.animated.push(crowd);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    world.add(makeBanner([0xc542ff, 0xf2c14e][i % 2]), X + Math.cos(a) * 24, Math.sin(a) * 24, -a + Math.PI / 2);
    const fire = makeCampfire();
    fire.scale.setScalar(0.8);
    world.add(fire, X + Math.cos(a + 0.4) * 23, Math.sin(a + 0.4) * 23, 0, 1);
  }
}
