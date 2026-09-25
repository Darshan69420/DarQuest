// Zone builders: Millbrook Meadow (the skilling area next to the academy) and the
// Emberfall Wilds (Chapter 2), a volcanic canyon far to the east.
import * as THREE from 'three';
import {
  makeFountain, makeTent, makeCampfire, makeLavaPool, makeSpire, makeFireTree, makeCliff,
  makeThrone, makeRock, makeLamp, glowMat, makeGate, makeTree, makePond, makeFence, makeWindmill,
  makeSignpost, makeHayBale, makeFlowers, makeRoundTree,
} from './models.js';
import { EMBER_X as X, NPCS } from './data.js';

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
