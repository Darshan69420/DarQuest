// Zone builders: Millbrook Meadow (the skilling area next to the academy) and the
// Emberfall Wilds (Chapter 2), a volcanic canyon far to the east.
import * as THREE from 'three';
import {
  makeFountain, makeTent, makeCampfire, makeLavaPool, makeSpire, makeFireTree, makeCliff,
  makeThrone, makeRock, makeLamp, glowMat, makeGate, makeTree, makePond, makeFence, makeWindmill,
  makeSignpost, makeHayBale, makeFlowers, makeRoundTree, makeWordWall, makeBones, makeNest, makeSnowPine,
  makePeak, makeFloatingRock, makeBanner, makeTent as tent, makeCampfire as campfire, makeMount,
  makeHouse, makeIceCrystal, makeIceTower, makeIceWall, makeIceThrone, makeAurora,
  makeSkyIsland, makeAirship, makeRopeBridge, makeLightningRod, makeStormCloud, makeCrystal,
  makeGiantTree, makeRootHouse, makeThornBush, makeMushroom, makeStalagmites, makePaleSpire, makeGrave, makeTorch,
} from './models.js';
import { EMBER_X as X, DRAGON_X as D, GLACIER_X as GX, STORM_X as SX, THORN_X as TX, DEEP_X as DX, NPCS } from './data.js';
import { HOME_X as HX, BS } from './homestead.js';

// Word Walls: each teaches the first word of a dragon shout.
export const WORD_WALLS = [
  { id: 'wall_sprint', shout: 'sprint', x: 7.2, z: 136, rot: -Math.PI / 2, color: 0xe8e4ff },
  { id: 'wall_fire', shout: 'fire', x: 707.4, z: 150, rot: -Math.PI / 2, color: 0xff6a2b },
  { id: 'wall_force', shout: 'force', x: D - 16.5, z: 2, rot: Math.PI / 2, color: 0x9fd6ff },
  { id: 'wall_frost', shout: 'frost', x: D - 17.5, z: 100, rot: Math.PI / 2, color: 0x9fe6ff },
  { id: 'wall_ethereal', shout: 'ethereal', x: D + 99, z: 108, rot: -Math.PI / 2, color: 0xb0e8ff },
  { id: 'wall_rend', shout: 'rend', x: D + 89.6, z: 160, rot: -Math.PI / 2, color: 0xffd23d },
];

// Builds every Word Wall (and its colliders) into the world.
export function buildWordWalls(world) {
  for (const w of WORD_WALLS) {
    const m = makeWordWall(w.color);
    world.add(m, w.x, w.z, w.rot);
    w.model = m;
    for (const k of [-2.6, 0, 2.6]) world.colliders.push({ x: w.x + Math.cos(w.rot) * k, z: w.z - Math.sin(w.rot) * k, r: 1.2 });
    w.label = world.addLabel(m, '<div class="name">🐉 Word Wall</div><div class="sub">Ancient dragon runes</div>', 'npc wordwall', 5);
  }
}

function flatPlane(scene, geo, color, x, z, y = 0.02) {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

// ------------------------------------------------------------ Millbrook Meadow

export function buildMeadow(world) {
  const scene = world.scene;
  // ground: meadow grass, dirt paths, quarry gravel
  flatPlane(scene, new THREE.PlaneGeometry(98, 94), 0x4f8a45, 84, 0, 0.012);
  flatPlane(scene, new THREE.PlaneGeometry(40, 5), 0x9a8060, 44, 0, 0.025);
  flatPlane(scene, new THREE.PlaneGeometry(48, 4), 0x9a8060, 86, 0, 0.026);
  flatPlane(scene, new THREE.PlaneGeometry(4, 30), 0x9a8060, 70, -15, 0.027);
  flatPlane(scene, new THREE.PlaneGeometry(4, 12), 0x9a8060, 84, 9, 0.027);
  flatPlane(scene, new THREE.CircleGeometry(16, 28), 0x8a8494, 117, 2, 0.028);

  // the east gate out of the courtyard
  const gate = makeGate();
  gate.scale.setScalar(0.5);
  world.add(gate, 31, 0, Math.PI / 2);
  world.colliders.push({ x: 31, z: -4.75, r: 0.9 }, { x: 31, z: 4.75, r: 0.9 });
  world.add(makeSignpost(), 38, -5.5, 0.3, 0.3);

  // fences around the meadow (with a gap for the gate)
  const fence = (x, z, len, rot) => world.add(makeFence(len), x, z, rot);
  for (let x = 36; x < 132; x += 12) { fence(x, -46, 12, 0); fence(x, 46, 12, 0); }
  for (let z = -46; z < 46; z += 12) fence(132, z, 12, -Math.PI / 2);
  for (let z = -46; z < -4; z += 10.5) fence(36, z, 10.5, -Math.PI / 2);
  for (let z = 4; z < 46; z += 10.5) fence(36, z, 10.5, -Math.PI / 2);

  // crafting yard by the gate
  world.addStation('furnace', 47, -10.5, 0);
  world.addStation('anvil', 53, -9.5, 0.2);
  world.addStation('workbench', 59, -10, 0);
  world.addStation('range', 47, 10, 0);
  world.addStation('alchemy', 54, 10.5, Math.PI);

  // woodcutting grove (north)
  for (const [x, z] of [[64, -22], [68, -31], [62, -39], [75, -40], [79, -27], [85, -36]]) world.addNode('tree', x, z);
  for (const [x, z] of [[91, -21], [97, -32], [89, -42], [103, -24]]) world.addNode('oak', x, z);
  for (const [x, z] of [[109, -38], [113, -26]]) world.addNode('moonwood', x, z);
  world.addNode('elder', 123, -38);

  // the pond (fishing, willows, glowcaps)
  world.add(makePond(9), 84, 24, 0);
  world.colliders.push({ x: 84, z: 24, r: 8.7 });
  world.addNode('fish_minnow', 77, 27);
  world.addNode('fish_minnow', 80, 17.3);
  world.addNode('fish_trout', 90.7, 19);
  world.addNode('fish_trout', 91, 28.5);
  world.addNode('fish_salmon', 84, 31.4);
  for (const [x, z] of [[72, 35], [96, 35], [98, 14]]) world.addNode('willow', x, z);
  world.addNode('herb_glowcap', 99.5, 38);
  world.addNode('herb_glowcap', 74.5, 39);

  // quarry (east)
  for (const [x, z] of [[106, -8], [110, -13], [126, -10]]) world.addNode('stone_rock', x, z);
  for (const [x, z] of [[108, 4], [112, 10], [116, -4], [104, 14]]) world.addNode('copper_rock', x, z);
  for (const [x, z] of [[120, 2], [124, 10], [118, 15]]) world.addNode('iron_rock', x, z);
  for (const [x, z] of [[126, -2], [128.5, 6]]) world.addNode('silver_rock', x, z);
  world.addNode('gold_rock', 121, -12.5);
  world.addNode('starmetal_rock', 128.5, 16);
  for (const [x, z, s] of [[102, -16, 2.2], [130, -18, 2.6], [100, 20, 1.8], [131, 24, 2.4]]) world.add(makeRock(s, 0x6c6776), x, z, Math.random() * 6, s);

  // herbs & berries (south-west)
  for (const [x, z] of [[58, 24], [62, 32], [50, 38], [66, 41], [44, 29]]) world.addNode('herb_moonleaf', x, z);
  for (const [x, z] of [[41, 40], [56, 43], [70, 21]]) world.addNode('berry_bush', x, z);
  for (const [x, z] of [[104, 31], [110, 39], [118, 27]]) world.addNode('herb_sunpetal', x, z);

  // Juno's stables
  for (const [x, z, len, rot] of [[64, -14, 12, 0], [76, -14, 8, -Math.PI / 2]]) world.add(makeFence(len), x, z, rot);
  for (const [x, z, r] of [[65, -12, 0.2], [66.5, -12.4, 1.4]]) world.add(makeHayBale(), x, z, r, 0.7);
  const horse = makeMount('steed');
  world.add(horse, 73, -10, 2.4, 1);
  const wolf = makeMount('wolf');
  world.add(wolf, 71, -12.5, 1.9, 0.9);

  // farm corner and decorations
  world.add(makeWindmill(), 123, 36, -0.5, 2.6);
  for (const [x, z, r] of [[112, 42, 0.3], [115.5, 41, 1.2], [109, 44, 2]]) world.add(makeHayBale(), x, z, r, 0.7);
  const petals = [0xffc3e1, 0xfff4b0, 0xc9b0ff, 0xff9a8a, 0x9fd6ff];
  for (let i = 0; i < 26; i++) {
    const x = 40 + Math.random() * 88, z = -44 + Math.random() * 88;
    if (Math.abs(z) < 4 || (x < 62 && Math.abs(z) < 14) || Math.hypot(x - 84, z - 24) < 11 || Math.hypot(x - 117, z - 2) < 16) continue;
    world.add(makeFlowers(petals[i % petals.length]), x, z, Math.random() * 6);
  }
  // a wall of trees around the outside of the fence
  for (let i = 0; i < 70; i++) {
    const side = i % 3;
    const x = side === 0 ? 34 + Math.random() * 104 : side === 1 ? 138 + Math.random() * 16 : 34 + Math.random() * 104;
    const z = side === 0 ? -50 - Math.random() * 16 : side === 1 ? -60 + Math.random() * 120 : 50 + Math.random() * 16;
    world.add(Math.random() < 0.8 ? makeTree(1.2 + Math.random() * 1.1, 0x2f6b3c) : makeRoundTree(1.1, 0xf29a6b), x, z, Math.random() * 6);
  }
}

// ------------------------------------------------------------ Dragonspire Peaks

export function buildDragonspire(world) {
  const scene = world.scene;
  flatPlane(scene, new THREE.PlaneGeometry(700, 700), 0x6a7080, D + 60, 90, 0);
  // packed snow on the walkable ground, and drifts all around
  flatPlane(scene, new THREE.CircleGeometry(23, 40), 0xdfe6f0, D, 0, 0.02);
  flatPlane(scene, new THREE.PlaneGeometry(17, 78), 0xc8d0dc, D, 54, 0.021);
  flatPlane(scene, new THREE.CircleGeometry(23, 40), 0x9a9080, D, 105, 0.022);
  flatPlane(scene, new THREE.PlaneGeometry(58, 17), 0xc8d0dc, D + 42, 105, 0.023);
  flatPlane(scene, new THREE.CircleGeometry(20, 40), 0xdfe6f0, D + 84, 105, 0.024);
  flatPlane(scene, new THREE.PlaneGeometry(15, 56), 0xc8d0dc, D + 84, 145, 0.025);
  flatPlane(scene, new THREE.CircleGeometry(27, 44), 0x4a3a3a, D + 84, 192, 0.026);
  flatPlane(scene, new THREE.RingGeometry(24, 25.5, 44), 0xff5a10, D + 84, 192, 0.03);
  for (let i = 0; i < 40; i++) {
    const m = flatPlane(scene, new THREE.CircleGeometry(4 + Math.random() * 10, 16), 0xeef2fa, D - 60 + Math.random() * 220, -40 + Math.random() * 280, 0.015);
    m.scale.set(1, 0.6 + Math.random() * 0.6, 1);
  }

  // Skyhold Camp
  const spring = makeFountain();
  spring.scale.setScalar(0.8);
  world.add(spring, D - 9, 12, 0, 2.9);
  world.add(campfire(), D + 3, 3, 0, 1.3);
  world.addStation('range', D + 3, 3, 0, false);
  world.addStation('anvil', D + 15, -3, -0.8);
  world.add(tent(0x5a2a2a), D + 15, 9, -0.9, 2.4);
  world.add(tent(0x3a4a6a), D - 15, -11, 0.8, 2.4);
  world.add(tent(0x6a5a3a), D + 12, -15, -2.3, 2.4);
  for (const [dx, dz] of [[-6, 17], [6, 17], [-19, 5], [19, 2]]) world.add(makeBanner(0x8a1a1a), D + dx, dz, 0, 0.3);
  for (const [dx, dz] of [[-10, -17], [10, 15]]) world.add(makeLamp(0xffb070), D + dx, dz, 0, 0.4);
  world.add(makeBones(true), D + 30, -24, 0.6);

  // the mountain path and the Bone Field
  for (let z = 20; z <= 88; z += 8) {
    for (const s of [-1, 1]) world.add(makeCliff(6 + Math.random() * 3, 7 + Math.random() * 8, 7, [0x5a5a6a, 0x6a6a7a, 0x4a4a5a][Math.floor(Math.random() * 3)]), D + s * (12 + Math.random() * 3), z, Math.random());
  }
  for (let k = 0; k < 10; k++) world.add(makeSnowPine(1 + Math.random() * 0.6), D + (k % 2 ? 1 : -1) * (19 + Math.random() * 8), 20 + k * 7);
  world.add(makeBones(true), D + 10, 96, -0.8);
  world.add(makeBones(true), D - 12, 118, 2.2);
  for (const [dx, dz, r] of [[-6, 92, 0.3], [14, 118, 1.2], [3, 124, 2]]) world.add(makeBones(false), D + dx, dz, r);
  for (const [dx, dz, n] of [[-14, 108, 3], [8, 124, 4], [16, 100, 2]]) world.add(makeNest(n), D + dx, dz, Math.random() * 6, 1.6);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2) < 0.4 || Math.abs(a - Math.PI * 1.5) < 0.35 || Math.abs(a) < 0.35) continue;
    world.add(makeCliff(8, 10 + Math.random() * 10, 8, 0x5a5a6a), D + Math.sin(a) * 27, 105 + Math.cos(a) * 27, Math.random());
  }

  // the cult ridge (east) and Wyvern Cliffs
  for (let x = D + 20; x <= D + 66; x += 9) {
    for (const s of [-1, 1]) world.add(makeCliff(6, 8 + Math.random() * 6, 6, 0x5a5060), x + Math.random() * 3, 105 + s * (12 + Math.random() * 2), Math.random());
  }
  for (const [dx, dz] of [[24, 99], [44, 111], [58, 99]]) { world.add(makeBanner(0x3a0a14), D + dx, dz, 0, 0.3); world.add(campfire(), D + dx + 3, dz + (dz > 105 ? -2 : 2), 0, 1.2); }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    if (Math.abs(Math.sin(a) + 1) < 0.35 || Math.cos(a) > 0.8) continue;
    world.add(makeCliff(8, 12 + Math.random() * 12, 8, 0x4a4a5a), D + 84 + Math.sin(a) * 24, 105 + Math.cos(a) * 24, Math.random());
  }
  for (const [dx, dz, s] of [[70, 88, 1.2], [100, 92, 1], [96, 124, 1.4], [66, 126, 0.9], [110, 110, 1.1]]) world.add(makeFloatingRock(s), D + dx, dz, Math.random() * 6);
  world.add(makeNest(2), D + 92, 99, 0, 1.6);

  // the climb to the Roost, and the Roost itself
  for (let z = 122; z <= 168; z += 8) for (const s of [-1, 1]) world.add(makeCliff(6, 10 + Math.random() * 8, 6, 0x4a4a5a), D + 84 + s * (11 + Math.random() * 2), z, Math.random());
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    if (Math.cos(a) < -0.85) continue;  // the way in from the south
    world.add(makeCliff(9, 14 + Math.random() * 14, 9, 0x3a3038), D + 84 + Math.sin(a) * 31, 192 + Math.cos(a) * 31, Math.random());
  }
  world.add(makeBones(true), D + 70, 200, 1.4);
  world.add(makeBones(true), D + 98, 182, -0.6);
  world.add(makeNest(5), D + 84, 212, 0, 2);
  for (const [dx, dz] of [[-15, 185], [15, 200], [-10, 208]]) { world.add(makeLavaPool(2.2), D + 84 + dx, dz, 0, 2); }

  // skilling on the mountain
  for (const [dx, dz] of [[-15, 96], [15, 112], [-9, 124]]) world.addNode('dragonite_rock', D + dx, dz);
  world.addNode('dragonite_rock', D + 95, 185);
  world.addNode('dragonite_rock', D + 73, 180);
  world.addNode('starmetal_rock', D + 17, 96);
  world.addNode('starmetal_rock', D - 5, 22);
  for (const [dx, dz] of [[76, 90], [96, 118], [-18, -4]]) world.addNode('dragonwood', D + dx, dz);
  world.addNode('elder', D + 18, 15);
  for (const [dx, dz] of [[92, 94], [74, 117], [86, 124]]) world.addNode('herb_dragons_tongue', D + dx, dz);
  for (const [dx, dz] of [[-6, -17], [17, -10], [-7, 28]]) world.addNode('herb_frostbloom', D + dx, dz);
  for (const [dx, dz] of [[-15, 185], [15, 200]]) world.addNode('fish_eel', D + 84 + dx, dz);
  const ice = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, roughness: 0.3, emissive: 0x204060, emissiveIntensity: 0.3 }));
  ice.rotation.x = -Math.PI / 2;
  ice.position.set(D + 7, 0.04, -15);
  scene.add(ice);
  world.colliders.push({ x: D + 7, z: -15, r: 2.8 });
  world.addNode('fish_frost', D + 7, -15);

  // mountains all around
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    world.add(makePeak(35 + Math.random() * 25, 70 + Math.random() * 60), D + 40 + Math.sin(a) * 175, 100 + Math.cos(a) * 190, Math.random());
  }
  for (let i = 0; i < 50; i++) {
    const x = D - 50 + Math.random() * 200, z = -40 + Math.random() * 280;
    if (world.walkable(x, z) || world.walkable(x + 4, z) || world.walkable(x - 4, z) || world.walkable(x, z + 4) || world.walkable(x, z - 4)) continue;
    world.add(makeSnowPine(1.1 + Math.random() * 0.9), x, z, Math.random() * 6);
  }
  // falling snow
  for (let k = 0; k < 80; k++) {
    const m = new THREE.Mesh(world.sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    m.scale.setScalar(0.06);
    m.userData.base = new THREE.Vector3(D - 20 + Math.random() * 130, 1 + Math.random() * 8, -20 + Math.random() * 230);
    m.userData.phase = Math.random() * 10;
    scene.add(m);
    world.motes.push(m);
  }
  return { spring };
}

// ------------------------------------------------------------ Your Homestead (a floating island)

export function buildHomestead(world) {
  const scene = world.scene;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(31, 24, 4, 40), new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 }));
  top.position.set(HX, -2, 0);
  scene.add(top);
  const under = new THREE.Mesh(new THREE.ConeGeometry(24, 34, 12), new THREE.MeshStandardMaterial({ color: 0x5a5060, roughness: 1, flatShading: true }));
  under.rotation.x = Math.PI;
  under.position.set(HX, -21, 0);
  scene.add(under);
  flatPlane(scene, new THREE.CircleGeometry(31, 48), 0x5fa84a, HX, 0, 0.005);
  const grid = new THREE.GridHelper(26 * BS, 26, 0x3a6a2a, 0x4a8a3a);
  grid.position.set(HX, 0.03, 0);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);
  flatPlane(scene, new THREE.PlaneGeometry(4, 12), 0x9a8060, HX, 22, 0.02);

  // crafting ring, a spring, and a little garden to gather from
  world.addStation('workbench', HX - 22, -12, Math.PI / 2 - 0.5);
  world.addStation('furnace', HX - 25, 2, Math.PI / 2);
  world.addStation('anvil', HX - 22, 12, Math.PI / 2 + 0.5);
  world.addStation('range', HX + 22, 13, 0);
  world.addStation('alchemy', HX + 25, 2, -Math.PI / 2);
  const spring = makeFountain();
  spring.scale.setScalar(0.7);
  world.add(spring, HX + 21, -13, 0, 2.5);
  world.addNode('tree', HX + 12, -25);
  world.addNode('oak', HX - 12, -25);
  world.addNode('stone_rock', HX - 26, -8);
  world.addNode('copper_rock', HX + 26, -6);
  world.addNode('herb_moonleaf', HX + 16, 22);
  world.addNode('herb_moonleaf', HX - 16, 22);
  world.addNode('berry_bush', HX + 19, 19);
  world.add(makeSignpost(), HX - 4, 24, 0.2, 0.3);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    if (Math.abs(a - Math.PI / 2) < 0.2) continue;  // gap for the path to the portal
    const x = HX + Math.cos(a) * 29.8, z = Math.sin(a) * 29.8;
    const f = makeFence(5.2);
    f.position.set(x, 0, z);
    f.rotation.y = -a - Math.PI / 2;
    scene.add(f);
  }
  for (const [dx, dz, s] of [[-45, -30, 1.3], [48, -20, 1.1], [40, 35, 1.5], [-42, 30, 1.2], [0, -55, 1.6]]) world.add(makeFloatingRock(s), HX + dx, dz, Math.random() * 6);
  // clouds drifting below the island
  for (let i = 0; i < 18; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const m = new THREE.Mesh(world.sphereGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }));
      m.scale.set(4 + Math.random() * 4, 2 + Math.random() * 1.5, 3 + Math.random() * 3);
      m.position.set(k * 4 - 6, Math.random(), Math.random() * 3);
      c.add(m);
    }
    const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 60;
    c.position.set(HX + Math.cos(a) * r, -8 - Math.random() * 20, Math.sin(a) * r);
    scene.add(c);
  }
}

// ------------------------------------------------------------ Emberfall Wilds

export function buildEmberfall(world) {
  const scene = world.scene;
  const flat = (geo, color, x, z, y = 0.02, emissive = 0) => {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1, emissive: emissive ? color : 0, emissiveIntensity: emissive }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };

  // ground
  flat(new THREE.PlaneGeometry(520, 520), 0x2a1a18, X, 80, 0);
  flat(new THREE.CircleGeometry(21, 48), 0x5a4234, X, 0);
  flat(new THREE.PlaneGeometry(20, 148), 0x4a3028, X, 84);
  flat(new THREE.CircleGeometry(16, 48), 0x3a2220, X, 165, 0.03);
  flat(new THREE.RingGeometry(13, 14, 48), 0xff5a10, X, 165, 0.04, 1.2);

  // camp
  const spring = makeFountain();
  spring.scale.setScalar(0.8);
  world.add(spring, X - 9, -7, 0, 2.9);
  world.add(makeCampfire(), X, 4, 0, 1.3);
  world.add(makeTent(0x7a4a24), X - 13, 8, 0.6, 2.4);
  world.add(makeTent(0x4a5a2a), X + 13, 9, -0.6, 2.4);
  world.add(makeTent(0x6a3a5a), X + 12, -8, -2.2, 2.4);
  for (const [dx, dz] of [[-8, 14], [8, 14], [-16, 0], [16, 0]]) world.add(makeLamp(0xffa050), X + dx, dz, 0, 0.4);
  // Tumblewick's gear rack
  const rack = new THREE.Group();
  rack.add(new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 1), new THREE.MeshStandardMaterial({ color: 0x5a3d24 })));
  rack.children[0].position.y = 1;
  for (let i = 0; i < 4; i++) {
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 8), new THREE.MeshStandardMaterial({ color: [0x8c2a1a, 0x4a2a7a, 0xc9a24a, 0x2a2f45][i] }));
    hat.position.set(-1.1 + i * 0.73, 1.4, 0);
    rack.add(hat);
  }
  world.add(rack, NPCS.tumblewick.x + 1.5, NPCS.tumblewick.z - 2, -0.5, 1.6);

  // canyon walls, spires, lava and burning trees
  for (let z = 14; z <= 158; z += 9) {
    for (const s of [-1, 1]) {
      const h = 8 + Math.random() * 10;
      world.add(makeCliff(6 + Math.random() * 3, h, 8, [0x3a2420, 0x44291f, 0x2f1d1a][Math.floor(Math.random() * 3)]), X + s * (15 + Math.random() * 3), z, Math.random());
    }
  }
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const r = 30 + Math.random() * 8;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (z > 12 && Math.abs(x) < 16) continue;
    world.add(makeCliff(8, 10 + Math.random() * 10, 8), X + x, z, Math.random());
  }
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    if (Math.cos(a) < -0.6) continue;  // leave the canyon entrance open
    world.add(makeCliff(9, 14 + Math.random() * 8, 9, 0x2a1a18), X + Math.sin(a) * 25, 165 + Math.cos(a) * 25, Math.random());
  }
  for (let k = 0; k < 18; k++) {
    const s = Math.random() > 0.5 ? 1 : -1;
    world.add(makeSpire(3 + Math.random() * 5), X + s * (10.5 + Math.random() * 3), 18 + Math.random() * 135, Math.random() * 6);
  }
  for (let k = 0; k < 10; k++) {
    const s = k % 2 ? 1 : -1;
    world.add(makeLavaPool(1.5 + Math.random() * 1.5), X + s * (11.5 + Math.random() * 2), 20 + k * 13 + Math.random() * 5, 0);
  }
  for (let k = 0; k < 8; k++) world.add(makeFireTree(0.9 + Math.random() * 0.4), X + (k % 2 ? 1 : -1) * 10.5, 25 + k * 16, Math.random() * 6);
  for (let k = 0; k < 12; k++) world.add(makeRock(0.4 + Math.random() * 0.6, 0x3a2a2a), X + (Math.random() > 0.5 ? 1 : -1) * (9.5 + Math.random()), 20 + Math.random() * 130);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    if (Math.cos(a) < -0.7) continue;  // keep the entrance clear
    world.add(makeLavaPool(1.8), X + Math.sin(a) * 11, 165 + Math.cos(a) * 11, 0, 2);
  }
  world.add(makeThrone(), X, 178, 0);

  // skilling in the wilds: emberwood, emberite, gold, lavafish and emberroot
  world.addNode('emberwood', X - 16.5, -4);
  world.addNode('emberwood', X + 17, 5);
  world.addNode('emberite_rock', X - 6.5, -12.5);
  world.addNode('emberite_rock', X + 6.5, -12.5);
  world.addNode('emberite_rock', X - 7.6, 64);
  world.addNode('gold_rock', X + 7.6, 100);
  for (const [dx, z] of [[-9.6, 33], [9.6, 71], [-9.6, 112]]) {
    world.add(makeLavaPool(1.7), X + dx, z, 0, 1.5);
    world.addNode('fish_lava', X + dx, z);
  }
  for (const [dx, z] of [[-7.6, 45], [7.6, 88], [-7.6, 124]]) world.addNode('herb_emberroot', X + dx, z);
  world.addStation('range', X, 4, 0, false);
  world.addStation('anvil', X + 7, -5, -0.4);

  // distant volcano
  const volcano = new THREE.Mesh(new THREE.ConeGeometry(90, 110, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a1614, flatShading: true }));
  volcano.position.set(X, 40, 330);
  scene.add(volcano);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(18, 16), glowMat(0xff5a10, 3));
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(X, 94, 330);
  scene.add(glow);

  // drifting embers
  for (let k = 0; k < 60; k++) {
    const m = new THREE.Mesh(world.sphereGeo, new THREE.MeshBasicMaterial({ color: [0xff7a1a, 0xffc040, 0xff4a10][k % 3] }));
    m.scale.setScalar(0.07);
    m.userData.base = new THREE.Vector3(X + (Math.random() - 0.5) * 30, 1 + Math.random() * 6, Math.random() * 170);
    m.userData.phase = Math.random() * 10;
    scene.add(m);
    world.motes.push(m);
  }

  return { spring };
}

// ------------------------------------------------------------ Glacierreach (Chapter 4)

export function buildGlacier(world) {
  const scene = world.scene;
  const G = GX;
  flatPlane(scene, new THREE.PlaneGeometry(520, 520), 0xdfe8f4, G + 40, 100, 0);
  // packed-snow roads, the frozen Mirror Lake, the Rime Caverns and the castle courtyard
  flatPlane(scene, new THREE.CircleGeometry(24, 44), 0xf2f6fc, G, 0, 0.02);
  flatPlane(scene, new THREE.CircleGeometry(9, 32), 0xc8b8a0, G, 0, 0.021);
  flatPlane(scene, new THREE.PlaneGeometry(15, 68), 0xc8d4e4, G, 51, 0.021);
  const lake = new THREE.Mesh(new THREE.CircleGeometry(24, 48), new THREE.MeshStandardMaterial({ color: 0xa8d8f8, roughness: 0.15, metalness: 0.2, emissive: 0x1a3a5a, emissiveIntensity: 0.25 }));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(G, 0.022, 105);
  lake.receiveShadow = true;
  scene.add(lake);
  flatPlane(scene, new THREE.RingGeometry(24, 26.5, 48), 0xf2f6fc, G, 105, 0.023);
  // cracks in the ice
  const crackM = new THREE.LineBasicMaterial({ color: 0xf0faff, transparent: true, opacity: 0.8 });
  for (let k = 0; k < 14; k++) {
    const pts = [];
    let x = G + (Math.random() - 0.5) * 30, z = 105 + (Math.random() - 0.5) * 30, a = Math.random() * 6;
    for (let i = 0; i < 6; i++) { pts.push(new THREE.Vector3(x, 0.04, z)); a += (Math.random() - 0.5) * 1.2; x += Math.cos(a) * 2; z += Math.sin(a) * 2; }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), crackM));
  }
  flatPlane(scene, new THREE.PlaneGeometry(44, 15), 0xc8d4e4, G + 40, 105, 0.024);
  flatPlane(scene, new THREE.CircleGeometry(18, 40), 0x6a7a98, G + 76, 105, 0.025);
  flatPlane(scene, new THREE.PlaneGeometry(13, 52), 0xb8c8dc, G + 76, 144, 0.026);
  flatPlane(scene, new THREE.CircleGeometry(24, 48), 0xd8ecfa, G + 76, 190, 0.027);
  flatPlane(scene, new THREE.RingGeometry(9, 10, 48), 0x7affd0, G + 76, 190, 0.03);
  for (let i = 0; i < 40; i++) {
    const m = flatPlane(scene, new THREE.CircleGeometry(4 + Math.random() * 10, 16), 0xffffff, G - 60 + Math.random() * 200, -40 + Math.random() * 280, 0.015);
    m.scale.set(1, 0.6 + Math.random() * 0.6, 1);
  }

  // Frostholm: snowy cottages around a great hearth
  const hearth = campfire();
  hearth.scale.setScalar(2.2);
  world.add(hearth, G, 0, 0, 2.2);
  world.addStation('range', G, 0, 0, false);
  const houses = [[-17, 8, 1.2], [17, 9, -1.6], [-18, -9, 1.9], [18, -12, -1.2], [-9, -19, 0.2], [10, -19, -0.2]];
  houses.forEach(([dx, dz, r], i) => world.add(makeHouse({ w: 6, d: 6, h: 3.6, wall: [0x8a6a4a, 0x9a7a5a, 0x7a5a44][i % 3], roof: 0xf2f6fc }), G + dx, dz, r, 3.8));
  world.addStation('anvil', G + 14, 14, -2.2);
  world.addStation('furnace', G + 18, 2, -1.6);
  world.addStation('alchemy', G - 13, -7, 1.2);
  world.addStation('workbench', G - 14, 15, 2.4);
  for (const [dx, dz] of [[-7, 18], [7, 18], [-20, 0], [20, -3], [-4, -21], [4, -21]]) world.add(makeLamp(0x9fe6ff), G + dx, dz, 0, 0.4);
  for (const [dx, dz] of [[-10, 20], [10, 20]]) world.add(makeBanner(0x3a6ea5), G + dx, dz, 0, 0.3);
  world.addNode('herb_frostbloom', G - 20, 12);
  world.addNode('herb_frostbloom', G + 21, 14);
  world.addNode('starmetal_rock', G + 21, -18);
  world.addNode('elder', G - 21, -16);

  // the north road, lined with pines and icy cliffs
  for (let z = 22; z <= 82; z += 8) {
    for (const s of [-1, 1]) {
      world.add(makeCliff(5 + Math.random() * 3, 6 + Math.random() * 6, 6, [0x9ab0c8, 0xb8cce0, 0x8aa0b8][Math.floor(Math.random() * 3)]), G + s * (11 + Math.random() * 3), z, Math.random());
    }
  }
  for (let k = 0; k < 10; k++) world.add(makeSnowPine(1 + Math.random() * 0.7), G + (k % 2 ? 1 : -1) * (17 + Math.random() * 8), 22 + k * 7);
  for (const [dx, dz] of [[-6, 34], [6, 58], [-6, 70]]) world.add(makeIceCrystal(0.8), G + dx, dz, Math.random() * 6, 0.8);

  // the Mirror Lake: fishing holes, crystals and a ring of cliffs
  for (const [dx, dz] of [[-10, 96], [9, 118], [-2, 114]]) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20), new THREE.MeshStandardMaterial({ color: 0x1a4a7a, roughness: 0.1 }));
    hole.rotation.x = -Math.PI / 2;
    hole.position.set(G + dx, 0.035, dz);
    scene.add(hole);
    world.addNode('fish_frost', G + dx, dz);
  }
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    if (Math.abs(a - Math.PI) < 0.35 || Math.abs(a - Math.PI / 2) < 0.3) continue;  // road in (south) and path east
    world.add(makeCliff(8, 9 + Math.random() * 10, 8, 0x9ab0c8), G + Math.sin(a) * 29, 105 + Math.cos(a) * 29, Math.random());
  }
  for (const [dx, dz, s] of [[-19, 92, 1.3], [18, 124, 1.1], [-16, 122, 1.5], [20, 90, 0.9]]) world.add(makeIceCrystal(s), G + dx, dz, Math.random() * 6, s);

  // the pass east (yetis) and the Rime Caverns (golems)
  for (let x = G + 20; x <= G + 60; x += 8) {
    for (const s of [-1, 1]) world.add(makeCliff(6, 8 + Math.random() * 8, 6, 0x8aa0b8), x + Math.random() * 3, 105 + s * (11.5 + Math.random() * 2), Math.random());
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    if (Math.abs(a - Math.PI * 1.5) < 0.4 || Math.abs(a) < 0.4) continue;  // west entrance and the stair north
    world.add(makeCliff(8, 12 + Math.random() * 10, 8, 0x4a5a78), G + 76 + Math.sin(a) * 21, 105 + Math.cos(a) * 21, Math.random());
  }
  for (const [dx, dz, s, c] of [[64, 95, 1.4, 0x9fe6ff], [88, 97, 1.2, 0x7affd0], [90, 114, 1.6, 0x9fe6ff], [62, 115, 1.1, 0x9a8cff], [76, 92, 1, 0x7affd0]]) world.add(makeIceCrystal(s, c), G + dx, dz, Math.random() * 6, s);
  world.addNode('starmetal_rock', G + 66, 104);
  world.addNode('dragonite_rock', G + 86, 106);
  world.addNode('starmetal_rock', G + 44, 99);

  // the castle stair
  for (let z = 122; z <= 166; z += 8) {
    for (const s of [-1, 1]) world.add(makeCliff(6, 10 + Math.random() * 8, 6, 0x8aa0b8), G + 76 + s * (10.5 + Math.random() * 2), z, Math.random());
  }
  for (let z = 128; z <= 164; z += 12) for (const s of [-1, 1]) world.add(makeLamp(0x7affd0), G + 76 + s * 5.5, z, 0, 0.4);

  // Sylvara's Ice Castle
  const C = { x: G + 76, z: 190 };
  const R = 26;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
    if (Math.cos(a) < -0.9) continue;  // the gate faces south, toward the stair
    const w = makeIceWall(2 * R * Math.sin(Math.PI / 16) + 0.6, 7);
    world.add(w, C.x + Math.sin(a) * R, C.z + Math.cos(a) * R, a + Math.PI / 2);
    world.colliders.push({ x: C.x + Math.sin(a) * R, z: C.z + Math.cos(a) * R, r: 3 });
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    world.add(makeIceTower({ r: 2.6, h: 12 + (i % 2) * 3 }), C.x + Math.sin(a + Math.PI / 8) * (R + 0.5), C.z + Math.cos(a + Math.PI / 8) * (R + 0.5), 0, 3);
  }
  // the great keep behind the throne
  world.add(makeIceTower({ r: 7, h: 26 }), C.x, C.z + 36, 0);
  for (const s of [-1, 1]) world.add(makeIceTower({ r: 4, h: 20 }), C.x + s * 13, C.z + 33, 0);
  world.add(makeIceThrone(), C.x, C.z + 17, Math.PI, 4.5);
  for (const [dx, dz] of [[-12, 8], [12, 8], [-14, -6], [14, -6]]) world.add(makeIceCrystal(1.3, 0x7affd0), C.x + dx, C.z + dz, Math.random() * 6, 1.2);
  for (const [dx, dz] of [[-7, -20], [7, -20]]) world.add(makeBanner(0x9fd6ff), C.x + dx, C.z + dz, 0, 0.3);

  // mountains, forests and the aurora
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    world.add(makePeak(35 + Math.random() * 25, 70 + Math.random() * 60), G + 40 + Math.sin(a) * 175, 100 + Math.cos(a) * 190, Math.random());
  }
  for (let i = 0; i < 60; i++) {
    const x = G - 50 + Math.random() * 200, z = -40 + Math.random() * 280;
    if (world.walkable(x, z) || world.walkable(x + 4, z) || world.walkable(x - 4, z) || world.walkable(x, z + 4) || world.walkable(x, z - 4)) continue;
    world.add(Math.random() < 0.8 ? makeSnowPine(1.1 + Math.random() * 0.9) : makeIceCrystal(1 + Math.random()), x, z, Math.random() * 6);
  }
  const aurora = makeAurora(world);
  aurora.position.set(G, 0, 60);
  const anim = aurora.userData.anim;
  aurora.userData.anim = (t) => {
    const pp = world.player?.position;
    if (pp && pp.x > 1950) aurora.position.set(pp.x, 0, pp.z);  // the bands float far to the north
    anim(t);
  };
  world.add(aurora, G, 60);
  for (let k = 0; k < 80; k++) {
    const m = new THREE.Mesh(world.sphereGeo, new THREE.MeshBasicMaterial({ color: k % 5 ? 0xffffff : 0x9fe6ff }));
    m.scale.setScalar(0.06);
    m.userData.base = new THREE.Vector3(G - 20 + Math.random() * 130, 1 + Math.random() * 8, -20 + Math.random() * 230);
    m.userData.phase = Math.random() * 10;
    scene.add(m);
    world.motes.push(m);
  }
  return { hearth };
}

// ------------------------------------------------------------ Stormspire (Chapter 5)

export function buildStormspire(world) {
  const scene = world.scene;
  const S = SX;
  // a sea of clouds far below the islands
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0xc8c0e8, roughness: 1 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(S + 30, -38, 90);
  scene.add(sea);
  for (let i = 0; i < 40; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const m = new THREE.Mesh(world.sphereGeo, new THREE.MeshStandardMaterial({ color: k % 2 ? 0xe8e0ff : 0xd8d0f0, roughness: 1 }));
      m.scale.set(6 + Math.random() * 6, 3 + Math.random() * 2, 5 + Math.random() * 4);
      m.position.set(k * 6 - 9, Math.random() * 2, Math.random() * 4);
      c.add(m);
    }
    const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 170;
    c.position.set(S + 30 + Math.cos(a) * r, -30 - Math.random() * 8, 90 + Math.sin(a) * r);
    scene.add(c);
  }

  // islands (a little wider than where you can walk) and the rope bridges between them
  const isles = [
    [0, 0, 22, 0x5a9a4a], [0, 62, 16, 0x6aaa5a], [60, 62, 16, 0x4a7a5a], [60, 120, 16, 0x5a6a8a], [0, 120, 16, 0x7a8a4a], [0, 180, 22, 0x4a4a6a],
  ];
  for (const [dx, dz, r, grass] of isles) world.add(makeSkyIsland(r + 1.4, { grass, rock: dz > 150 ? 0x4a4058 : 0x6a6078 }), S + dx, dz, Math.random() * 6);
  world.add(makeRopeBridge(29, 5.2), S, 34, 0);
  world.add(makeRopeBridge(33, 5.2), S + 30, 62, Math.PI / 2);
  world.add(makeRopeBridge(31, 5.2), S + 60, 91, 0);
  world.add(makeRopeBridge(33, 5.2), S + 30, 120, Math.PI / 2);
  world.add(makeRopeBridge(27, 5.2), S, 147, 0);

  // Skyport: a harbour town with airships moored at its edge
  const fountain = makeFountain();
  fountain.scale.setScalar(0.85);
  world.add(fountain, S, 0, 0, 3.1);
  const houses = [[-16, 8, 1.3], [16, 9, -1.7], [-17, -9, 1.9], [17, -12, -1.3], [-9, -17, 0.3]];
  houses.forEach(([dx, dz, r], i) => world.add(makeHouse({ w: 6, d: 6, h: 3.8, wall: [0xe8dcc8, 0xd8c8b0, 0xc8d0e0][i % 3], roof: [0x3a4a8a, 0x5a3a8a, 0x2a5a7a][i % 3] }), S + dx, dz, r, 3.8));
  world.addStation('anvil', S + 13, 15, -2.3);
  world.addStation('furnace', S + 19, 1, -1.6);
  world.addStation('alchemy', S - 13, -3, 1.3);
  world.addStation('range', S - 13, 14, 2.3);
  world.addStation('workbench', S + 9, -18, -0.3);
  for (const [dx, dz] of [[-6, 19], [6, 19], [-20, 3], [20, -4], [-4, -20], [5, -21]]) world.add(makeLamp(0xc8b8ff), S + dx, dz, 0, 0.4);
  for (const [dx, dz] of [[-8, 20], [8, 20]]) world.add(makeBanner(0x3a4a8a), S + dx, dz, 0, 0.3);
  const dock1 = makeAirship(0x3a4a8a);
  world.add(dock1, S - 31, 6, Math.PI / 2 + 0.2);
  dock1.position.y = 1.5;
  const dock2 = makeAirship(0xc0392b);
  world.add(dock2, S + 30, -14, -Math.PI / 2 - 0.3);
  dock2.position.y = 2;
  world.add(makeWindmill(), S - 14, 19.5, 0.5, 2.5);

  // the Isle of Winds: windmills and wildflowers
  world.add(makeWindmill(), S - 11, 56, 0.9, 2.5);
  world.add(makeWindmill(), S + 11, 70, -0.6, 2.5);
  for (let k = 0; k < 6; k++) world.add(makeFlowers(), S + (Math.random() - 0.5) * 20, 55 + Math.random() * 16, Math.random() * 6);
  world.addNode('elder', S - 12, 68);
  world.addNode('skyoak', S + 13, 64);
  world.addNode('skyoak', S - 6, 51);
  world.addNode('herb_starbloom', S + 4, 76);
  world.addNode('fish_skyray', S - 24.5, -6);
  world.addNode('fish_skyray', S + 23.5, 7);
  world.addNode('herb_glowcap', S + 12, 55);
  world.addNode('herb_glowcap', S - 3, 74);

  // Thunder Isle: a ring of lightning rods
  const rods = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const x = S + 60 + Math.cos(a) * 11.5, z = 62 + Math.sin(a) * 11.5;
    if (Math.abs(z - 62) < 3 && x < S + 60) continue;   // keep the bridge end clear
    world.add(makeLightningRod(), x, z, 0, 0.7);
    rods.push({ x, z, y: 6.6 });
  }
  world.add(makeRock(1.2, 0x6a6078), S + 60, 62, 0.4, 1.4);
  world.addNode('starmetal_rock', S + 69, 56);
  world.addNode('dragonite_rock', S + 52, 70);

  // the Crystal Spire
  const spire = makeCrystal(0xb46bff, 6);
  world.add(spire, S + 60, 120, 0.3, 3.4);
  for (const [dx, dz, sc] of [[-8, -6, 1.6], [7, 7, 1.8], [8, -7, 1.3], [-7, 8, 1.5]]) world.add(makeCrystal(0x9ff0ff, sc), S + 60 + dx, 120 + dz, Math.random() * 6, 0.9);
  for (const [dx, dz] of [[-12, 0], [12, 3]]) { world.add(makeLightningRod(), S + 60 + dx, 120 + dz, 0, 0.7); rods.push({ x: S + 60 + dx, z: 120 + dz, y: 6.6 }); }
  world.addNode('starmetal_rock', S + 69, 128);
  world.addNode('stormglass_rock', S + 52, 128);
  world.addNode('stormglass_rock', S + 70, 67);
  world.addNode('herb_starbloom', S + 66, 110);

  // Raiders' Roost: tents, a campfire and a wrecked airship
  world.add(tent(0x8a1a1a), S - 10, 116, 1.2, 2.4);
  world.add(tent(0x3a3a5a), S + 10, 126, -2, 2.4);
  world.add(campfire(), S + 2, 118, 0, 1.3);
  world.addStation('range', S + 2, 118, 0, false);
  const wreck = makeAirship(0x8a1a1a);
  world.add(wreck, S - 20, 128, 2.6);
  wreck.rotation.z = 0.35;
  wreck.position.y = -3;
  for (const [dx, dz] of [[-7, 108], [8, 109]]) world.add(makeBanner(0x1a1a1a), S + dx, dz, 0, 0.3);

  // the Eye of the Storm: broken pillars, rods and a vortex of cloud overhead
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    if (Math.cos(a) < -0.9) continue;
    world.add(makeCliff(1.6, 3 + Math.random() * 5, 1.6, 0x5a5070), S + Math.sin(a) * 19, 180 + Math.cos(a) * 19, Math.random(), 1.1);
  }
  for (const [dx, dz] of [[-10, 172], [10, 172], [-12, 190], [12, 190]]) { world.add(makeLightningRod(), S + dx, dz, 0, 0.7); rods.push({ x: S + dx, z: dz, y: 6.6 }); }
  const vortex = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(14 + k * 7, 2.2 + k, 8, 32), new THREE.MeshStandardMaterial({ color: k % 2 ? 0x4a4a6a : 0x3a3a58, roughness: 1 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 34 + k * 5;
    vortex.add(ring);
  }
  vortex.userData.anim = (t) => { vortex.rotation.y = t * 0.15; };
  world.add(vortex, S, 180);

  // storm clouds, and lightning that strikes the rods now and then
  for (let i = 0; i < 14; i++) world.add(makeStormCloud(1 + Math.random() * 0.8), S - 40 + Math.random() * 140, -20 + Math.random() * 220, Math.random() * 6).position.y = 26 + Math.random() * 14;
  const boltMat = new THREE.LineBasicMaterial({ color: 0xe8e0ff, transparent: true, opacity: 1, fog: false });
  const bolt = new THREE.Line(new THREE.BufferGeometry(), boltMat);
  bolt.visible = false;
  bolt.frustumCulled = false;
  const striker = new THREE.Group();
  striker.add(bolt);
  let next = 3, until = 0;
  striker.userData.anim = (t) => {
    const pp = world.player?.position;
    if (pp) striker.position.set(pp.x, 0, pp.z);
    if (t > until) bolt.visible = false;
    if (t < next || !pp || pp.x < 2850) return;
    next = t + 2.5 + Math.random() * 4;
    const rod = rods[Math.floor(Math.random() * rods.length)];
    const pts = [];
    let x = rod.x + (Math.random() - 0.5) * 8, z = rod.z + (Math.random() - 0.5) * 8;
    for (let k = 0; k <= 8; k++) {
      const y = 40 - (k / 8) * (40 - rod.y);
      const f = k / 8;
      pts.push(new THREE.Vector3(x + (rod.x - x) * f + (k < 8 ? (Math.random() - 0.5) * 2.4 : 0) - pp.x, y, z + (rod.z - z) * f + (k < 8 ? (Math.random() - 0.5) * 2.4 : 0) - pp.z));
    }
    bolt.geometry.dispose();
    bolt.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    bolt.visible = true;
    until = t + 0.18;
    world.groundBurst?.(rod.x, rod.z, 0xc8b8ff, 8, 2);
  };
  world.add(striker, S, 0);
  // drifting sparks
  for (let k = 0; k < 60; k++) {
    const m = new THREE.Mesh(world.sphereGeo, new THREE.MeshBasicMaterial({ color: k % 3 ? 0xc8b8ff : 0x9ff0ff }));
    m.scale.setScalar(0.06);
    m.userData.base = new THREE.Vector3(S - 20 + Math.random() * 100, 1 + Math.random() * 8, -20 + Math.random() * 220);
    m.userData.phase = Math.random() * 10;
    scene.add(m);
    world.motes.push(m);
  }
  return { fountain };
}

// ------------------------------------------------------------ Thornwood (Chapter 6)

export function buildThornwood(world) {
  const scene = world.scene;
  const T = TX;
  flatPlane(scene, new THREE.PlaneGeometry(560, 560), 0x3a5a2a, T - 20, 100, 0);
  // mossy paths, the village green, the glowing hollow and the blight
  flatPlane(scene, new THREE.CircleGeometry(24, 44), 0x5a8a3a, T, 0, 0.02);
  flatPlane(scene, new THREE.CircleGeometry(8, 32), 0x8a7a5a, T, 0, 0.021);
  flatPlane(scene, new THREE.PlaneGeometry(11, 44), 0x7a6a4a, T, 41, 0.021);
  flatPlane(scene, new THREE.CircleGeometry(18, 40), 0x4a8a3a, T, 76, 0.022);
  flatPlane(scene, new THREE.PlaneGeometry(34, 11), 0x6a5a3a, T - 30, 76, 0.023);
  flatPlane(scene, new THREE.CircleGeometry(18, 40), 0x1a2a3a, T - 60, 76, 0.024);
  flatPlane(scene, new THREE.PlaneGeometry(11, 42), 0x5a4a3a, T, 110, 0.025);
  flatPlane(scene, new THREE.CircleGeometry(20, 40), 0x3a2a3a, T, 146, 0.026);
  flatPlane(scene, new THREE.PlaneGeometry(11, 30), 0x3a2a34, T, 176, 0.027);
  flatPlane(scene, new THREE.CircleGeometry(24, 44), 0x2a1a2a, T, 210, 0.028);
  flatPlane(scene, new THREE.RingGeometry(9, 10, 48), 0xd06aff, T, 210, 0.03);
  for (let i = 0; i < 30; i++) {
    const m = flatPlane(scene, new THREE.CircleGeometry(3 + Math.random() * 7, 14), [0x4a7a3a, 0x3a6a2a, 0x5a8a4a][i % 3], T - 90 + Math.random() * 180, -30 + Math.random() * 270, 0.015);
    m.scale.set(1, 0.6 + Math.random() * 0.6, 1);
  }

  // Greenhollow, among the roots of the Elder Mother
  world.add(makeGiantTree(1.7), T, -46, 0.4, 9);
  const spring = makeFountain();
  spring.scale.setScalar(0.8);
  world.add(spring, T, 0, 0, 2.9);
  const homes = [[-17, 8, 1.3, 0x2e7d3b], [17, 9, -1.7, 0xc0392b], [-18, -10, 1.9, 0x3a6ea5], [18, -12, -1.3, 0xf2c14e]];
  for (const [dx, dz, r, door] of homes) world.add(makeRootHouse(door), T + dx, dz, r, 3.8);
  world.addStation('anvil', T + 14, 14, -2.3);
  world.addStation('furnace', T + 21, 1, -1.6);
  world.addStation('alchemy', T - 13, -3, 1.3);
  world.addStation('range', T - 13, 14, 2.3);
  world.addStation('workbench', T + 8, -18, -0.3);
  for (const [dx, dz] of [[-6, 20], [6, 20], [-21, 1], [21, -4], [-5, -21], [6, -21]]) world.add(makeLamp(0x9fff7a), T + dx, dz, 0, 0.4);
  for (let k = 0; k < 8; k++) world.add(makeFlowers([0xff8ad0, 0xffd23d, 0x9fe6ff][k % 3]), T + (Math.random() - 0.5) * 36, (Math.random() - 0.5) * 36, Math.random() * 6);
  world.addNode('herb_moonleaf', T - 20, 12);
  world.addNode('herb_sunpetal', T + 20, 13);
  world.addNode('elder', T - 21, -14);
  world.addNode('berry_bush', T + 21, -16);

  // giant trees line every path
  const giants = [];
  for (let z = 28; z <= 190; z += 16) for (const s of [-1, 1]) giants.push([s * (16 + Math.random() * 6), z]);
  for (const [dx, dz] of [[-28, 60], [-30, 92], [-60, 50], [-60, 102], [-86, 76], [28, 76], [28, 146], [-28, 146], [30, 210], [-30, 210], [0, 246]]) giants.push([dx, dz]);
  for (const [dx, dz] of giants) {
    const x = T + dx, z = dz;
    if (world.walkable(x, z) || world.walkable(x + 7, z) || world.walkable(x - 7, z)) continue;
    const blight = dz > 125;
    world.add(makeGiantTree(0.7 + Math.random() * 0.4, { blight, leaf: [0x3f7a3a, 0x4a8a3a, 0x356a34][Math.floor(Math.random() * 3)] }), x, z, Math.random() * 6);
  }
  // undergrowth, logs and stones
  for (let i = 0; i < 60; i++) {
    const x = T - 90 + Math.random() * 180, z = -30 + Math.random() * 270;
    if (world.walkable(x, z) || world.walkable(x + 3, z) || world.walkable(x - 3, z)) continue;
    const r = Math.random();
    world.add(r < 0.5 ? makeTree(0.9 + Math.random() * 0.6, 0x3f7a3a) : r < 0.8 ? makeRoundTree(0.9 + Math.random() * 0.4, 0x4f8a44) : makeRock(0.6 + Math.random() * 0.6, 0x6a6a5a), x, z, Math.random() * 6);
  }

  // the Mossy Glade: a pond and flowers
  world.add(makePond(4), T + 9, 84, 0, 3.8);
  world.addNode('fish_trout', T + 9, 84);
  for (let k = 0; k < 6; k++) world.add(makeFlowers([0xff8ad0, 0xffd23d, 0xb46bff][k % 3]), T + (Math.random() - 0.5) * 26, 66 + Math.random() * 20, Math.random() * 6);
  world.addNode('herb_glowcap', T - 12, 70);

  // the Glowcap Hollow: giant glowing mushrooms
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, r = 14 + Math.random() * 3;
    if (Math.cos(a) > 0.85) continue;   // the way in from the east
    const m = makeMushroom([0x6fd3ff, 0xb46bff, 0x9fff7a][k % 3]);
    m.scale.setScalar(4 + Math.random() * 3);
    world.add(m, T - 60 + Math.cos(a) * r, 76 + Math.sin(a) * r, Math.random() * 6, 1.4);
  }
  for (let k = 0; k < 12; k++) world.add(makeMushroom([0x6fd3ff, 0xb46bff][k % 2]), T - 60 + (Math.random() - 0.5) * 24, 76 + (Math.random() - 0.5) * 24, Math.random() * 6);
  world.addNode('herb_glowcap', T - 52, 84);
  world.addNode('herb_glowcap', T - 68, 72);
  world.addNode('silver_rock', T - 64, 88);
  world.addNode('heartwood_tree', T + 12, 72);
  world.addNode('heartwood_tree', T - 13, 150);

  // the Blighted Grove and the Heartwood
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, r = 15 + Math.random() * 3;
    if (Math.abs(Math.sin(a)) > 0.93) continue;   // paths north and south
    world.add(makeThornBush(1 + Math.random() * 0.8), T + Math.cos(a) * r, 146 + Math.sin(a) * r, Math.random() * 6, 1);
  }
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2;
    if (Math.sin(a) < -0.93) continue;
    world.add(makeThornBush(1.3 + Math.random()), T + Math.cos(a) * 22.5, 210 + Math.sin(a) * 22.5, Math.random() * 6, 1.2);
  }
  const heart = makeGiantTree(1.5, { blight: true });
  world.add(heart, T, 250, 0, 9);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), new THREE.MeshBasicMaterial({ color: 0xd06aff }));
  core.position.set(T, 9, 245);
  core.userData.anim = (t) => { const k = 1 + Math.sin(t * 2.2) * 0.12; core.scale.setScalar(k); core.rotation.y = t * 0.5; };
  world.add(core, T, 245).position.y = 9;
  // fireflies (and blight motes deeper in)
  for (let k = 0; k < 110; k++) {
    const deep = k > 80;
    const m = new THREE.Mesh(world.sphereGeo, new THREE.MeshBasicMaterial({ color: deep ? 0xd06aff : k % 3 ? 0xeaff8a : 0x9fff7a }));
    m.scale.setScalar(0.07);
    m.userData.base = new THREE.Vector3(T - 70 + Math.random() * 100, 0.6 + Math.random() * 4, deep ? 130 + Math.random() * 100 : -20 + Math.random() * 150);
    if (!deep && Math.random() < 0.3) m.userData.base.x = T - 70 + Math.random() * 25;
    m.userData.phase = Math.random() * 10;
    scene.add(m);
    world.motes.push(m);
  }
  return { spring };
}

// ------------------------------------------------------------ the Hollow Deep (Chapter 7)

export function buildHollowDeep(world) {
  const scene = world.scene;
  const H = DX;
  flatPlane(scene, new THREE.PlaneGeometry(520, 520), 0x14101c, H + 30, 100, 0);
  // stone floors, the bone road, the ghostly river and the Spire's courtyard
  flatPlane(scene, new THREE.CircleGeometry(20, 40), 0x3a3448, H, 0, 0.02);
  flatPlane(scene, new THREE.PlaneGeometry(11, 38), 0xcfc3a6, H, 34, 0.021);
  flatPlane(scene, new THREE.CircleGeometry(16, 40), 0x2a2438, H, 66, 0.022);
  flatPlane(scene, new THREE.PlaneGeometry(34, 11), 0x3a3448, H + 30, 66, 0.023);
  flatPlane(scene, new THREE.CircleGeometry(16, 40), 0x4a4040, H + 60, 66, 0.024);
  flatPlane(scene, new THREE.PlaneGeometry(11, 32), 0x3a3448, H + 60, 95, 0.025);
  flatPlane(scene, new THREE.CircleGeometry(16, 40), 0x2a2040, H + 60, 124, 0.026);
  flatPlane(scene, new THREE.RingGeometry(14, 15, 40), 0xd06aff, H + 60, 124, 0.03);
  flatPlane(scene, new THREE.PlaneGeometry(34, 11), 0x3a3448, H + 30, 124, 0.027);
  flatPlane(scene, new THREE.CircleGeometry(16, 40), 0x4a4458, H, 124, 0.028);
  flatPlane(scene, new THREE.PlaneGeometry(11, 30), 0xe8e4f0, H, 152, 0.029);
  flatPlane(scene, new THREE.CircleGeometry(24, 48), 0xd8d4e0, H, 188, 0.03);
  flatPlane(scene, new THREE.RingGeometry(20, 21.5, 48), 0xd06aff, H, 188, 0.032);
  // rivers of souls: glowing water with drifting light
  const river = (x, z, w, len, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), new THREE.MeshBasicMaterial({ color: 0x7a5aff, transparent: true, opacity: 0.6 }));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = rot;
    m.position.set(x, 0.035, z);
    m.userData.anim = (t) => { m.material.opacity = 0.5 + Math.sin(t * 1.5 + x) * 0.12; };
    return world.add(m, x, z);
  };
  river(H - 22, 66, 8, 70, 0.1);
  river(H + 22, 96, 7, 60, -0.4);
  river(H + 30, 160, 8, 80, 1.2);

  // the Last Refuge: tents and lanterns around a wellspring
  const spring = makeFountain();
  spring.scale.setScalar(0.8);
  world.add(spring, H, 0, 0, 2.9);
  world.add(tent(0x3a2a4a), H - 14, 9, 1.2, 2.4);
  world.add(tent(0x2a3a4a), H + 14, 10, -1.6, 2.4);
  world.add(tent(0x4a2a2a), H - 15, -10, 1.9, 2.4);
  world.add(campfire(), H + 4, 12, 0, 1.2);
  world.addStation('range', H + 4, 12, 0, false);
  world.addStation('anvil', H + 15, -4, -1.6);
  world.addStation('alchemy', H - 13, -3, 1.3);
  world.addStation('furnace', H + 10, -15, -0.6);
  for (const [dx, dz] of [[-6, 17], [6, 17], [-18, 2], [18, -3], [-4, -18], [5, -18]]) world.add(makeLamp(0x7affd0), H + dx, dz, 0, 0.4);
  world.addNode('silver_rock', H - 17, 5);
  world.addNode('gold_rock', H + 17, 4);

  // the Bone Road: graves and bones on both sides
  for (let z = 20; z <= 50; z += 5) for (const s of [-1, 1]) world.add(Math.random() < 0.5 ? makeGrave() : makeBones(false), H + s * (7.5 + Math.random() * 2), z, Math.random() * 6);
  // the Ossuary: piles of bones and sarcophagi
  for (const [dx, dz] of [[-10, -8], [10, 8], [-9, 9], [8, -10]]) world.add(makeBones(true), H + 60 + dx, 66 + dz, Math.random() * 6);
  world.addNode('dragonite_rock', H + 70, 60);
  world.addNode('voidstone_rock', H + 50, 70);
  world.addNode('voidstone_rock', H + 66, 76);
  world.addNode('voidstone_rock', H - 17, -6);
  world.addNode('herb_nightshade', H + 9, 76);
  world.addNode('herb_nightshade', H - 11, 118);
  world.addNode('fish_soul', H - 18.5, 66);
  world.addNode('fish_soul', H - 17.5, 58);
  // the Echo Halls: pillars in a ring
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    if (Math.abs(Math.sin(a)) > 0.95 || Math.cos(a) < -0.95) continue;
    world.add(makeCliff(1.6, 7, 1.6, 0x4a4458), H + 60 + Math.cos(a) * 17.5, 124 + Math.sin(a) * 17.5, 0, 1.1);
  }
  // the Pale Gate: white pillars and banners
  for (const [dx, dz] of [[-5, 139], [5, 139]]) { world.add(makeCliff(2, 9, 2, 0xe8e4f0), H + dx - Math.sign(dx) * 2.5, dz, 0, 1.2); world.add(makeBanner(0xd06aff), H + dx, dz - 2, 0, 0.3); }
  // the Pale Spire behind its courtyard
  world.add(makePaleSpire(), H, 226, Math.PI, 10);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    if (Math.sin(a) < -0.9) continue;
    const t = makeTorch();
    t.scale.setScalar(1.3);
    world.add(t, H + Math.cos(a) * 22.5, 188 + Math.sin(a) * 22.5, -a - Math.PI / 2);
  }

  // stalagmites and cave walls everywhere you cannot walk
  for (let i = 0; i < 140; i++) {
    const x = H - 60 + Math.random() * 180, z = -30 + Math.random() * 280;
    if (world.walkable(x, z) || world.walkable(x + 3, z) || world.walkable(x - 3, z) || world.walkable(x, z + 3) || world.walkable(x, z - 3)) continue;
    world.add(makeStalagmites(0.8 + Math.random() * 1.2, [0x3a3444, 0x2a2438, 0x4a4058][i % 3]), x, z, Math.random() * 6);
  }
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    world.add(makePeak(30 + Math.random() * 20, 60 + Math.random() * 40, false), H + 30 + Math.sin(a) * 160, 100 + Math.cos(a) * 170, Math.random());
  }
  // drifting souls
  for (let k = 0; k < 90; k++) {
    const m = new THREE.Mesh(world.sphereGeo, new THREE.MeshBasicMaterial({ color: k % 3 ? 0xd8c8ff : 0x7affd0 }));
    m.scale.setScalar(0.07);
    m.userData.base = new THREE.Vector3(H - 25 + Math.random() * 100, 0.8 + Math.random() * 6, -20 + Math.random() * 220);
    m.userData.phase = Math.random() * 10;
    scene.add(m);
    world.motes.push(m);
  }
  return { spring };
}
