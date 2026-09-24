// Chapter 2 zone: the Emberfall Wilds, a volcanic canyon east of the academy.
import * as THREE from 'three';
import {
  makeFountain, makeTent, makeCampfire, makeLavaPool, makeSpire, makeFireTree, makeCliff,
  makeThrone, makeRock, makeLamp, glowMat,
} from './models.js';
import { EMBER_X as X, NPCS } from './data.js';

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
