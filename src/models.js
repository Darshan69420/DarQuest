// Procedural low-poly models. Every model faces +Z and stands on y = 0.
// Swap these out for real 3D art (glTF) later without touching game logic.
import * as THREE from 'three';

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...opts }));
  }
  return matCache.get(key);
}
export function glowMat(color, intensity = 1.6) {
  return mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
}

function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------- Wizards

export function makeWizard({ robe = 0x3355ff, hat = robe, trim = 0xf2c14e, skin = 0xf1c9a5, gem = trim, beard = false } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);

  body.add(mesh(new THREE.ConeGeometry(0.62, 1.5, 10), mat(robe), 0, 0.75, 0));
  body.add(mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.12, 10), mat(trim), 0, 0.98, 0));
  // cape collar
  body.add(mesh(new THREE.CylinderGeometry(0.26, 0.42, 0.25, 10), mat(robe), 0, 1.38, 0));
  // head + eyes
  body.add(mesh(new THREE.SphereGeometry(0.3, 14, 12), mat(skin, { flatShading: false }), 0, 1.68, 0));
  const eye = mat(0x1d1a2b);
  body.add(mesh(new THREE.SphereGeometry(0.045, 6, 6), eye, -0.1, 1.72, 0.27));
  body.add(mesh(new THREE.SphereGeometry(0.045, 6, 6), eye, 0.1, 1.72, 0.27));
  if (beard) {
    const b = mesh(new THREE.ConeGeometry(0.22, 0.7, 8), mat(0xeeeeee), 0, 1.35, 0.2);
    b.rotation.x = Math.PI;
    body.add(b);
  }
  // hat: brim, band, floppy cone
  body.add(mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 18), mat(hat), 0, 1.9, 0));
  body.add(mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.12, 14), mat(trim), 0, 1.98, 0));
  const tip = new THREE.Group();
  tip.position.set(0, 1.95, 0);
  const cone = mesh(new THREE.ConeGeometry(0.34, 1.0, 12), mat(hat), 0, 0.5, 0);
  tip.add(cone);
  tip.rotation.x = -0.25;
  tip.rotation.z = 0.12;
  body.add(tip);
  // staff
  const staff = new THREE.Group();
  staff.position.set(0.58, 0, 0.15);
  staff.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.95, 6), mat(0x6b4a2b), 0, 0.98, 0));
  const gemMesh = mesh(new THREE.OctahedronGeometry(0.14), glowMat(gem, 2.2), 0, 2.05, 0);
  staff.add(gemMesh);
  body.add(staff);

  g.userData = {
    body, gem: gemMesh, hatTip: tip,
    anim(t, moving) {
      body.position.y = moving ? Math.abs(Math.sin(t * 10)) * 0.12 : Math.sin(t * 2) * 0.02;
      body.rotation.z = moving ? Math.sin(t * 10) * 0.05 : 0;
      tip.rotation.z = 0.12 + Math.sin(t * 3) * 0.06;
      gemMesh.rotation.y = t * 2;
    },
  };
  return g;
}

// ---------------------------------------------------------------- Enemies

function sprig() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  body.add(mesh(new THREE.DodecahedronGeometry(0.6), mat(0x2b3324), 0, 0.75, 0));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const spike = mesh(new THREE.ConeGeometry(0.1, 0.7, 5), mat(0x3d2f24), Math.cos(a) * 0.45, 1.05, Math.sin(a) * 0.45);
    spike.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
    body.add(spike);
  }
  const leaf = mesh(new THREE.ConeGeometry(0.25, 0.6, 4), mat(0x6a2c8a), 0, 1.5, 0);
  body.add(leaf);
  body.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), glowMat(0xc07bff, 3), -0.2, 0.85, 0.5));
  body.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), glowMat(0xc07bff, 3), 0.2, 0.85, 0.5));
  g.userData.anim = (t, moving) => {
    body.position.y = Math.abs(Math.sin(t * (moving ? 8 : 3))) * (moving ? 0.35 : 0.08);
    body.rotation.y = Math.sin(t * 1.5) * 0.2;
  };
  return g;
}

function rat() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const torso = mesh(new THREE.SphereGeometry(0.5, 10, 8), mat(0x8a3a1c), 0, 0.55, 0);
  torso.scale.set(1, 0.85, 1.5);
  body.add(torso);
  const head = mesh(new THREE.SphereGeometry(0.33, 10, 8), mat(0x9c4522), 0, 0.72, 0.75);
  head.scale.set(1, 0.9, 1.25);
  body.add(head);
  body.add(mesh(new THREE.SphereGeometry(0.07, 6, 6), mat(0x1a0d08), 0, 0.72, 1.15));
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.13, 0.3, 6), mat(0xff8a3d), s * 0.2, 1.0, 0.62);
    body.add(ear);
    body.add(mesh(new THREE.SphereGeometry(0.06, 6, 6), glowMat(0xffd23d, 3), s * 0.15, 0.82, 1.0));
  }
  const tail = mesh(new THREE.CylinderGeometry(0.03, 0.08, 1.1, 5), glowMat(0xff6a2b, 1.5), 0, 0.6, -1.1);
  tail.rotation.x = Math.PI / 2.6;
  body.add(tail);
  // embers along the back
  for (let i = 0; i < 4; i++) body.add(mesh(new THREE.ConeGeometry(0.08, 0.25, 4), glowMat(0xff8a2b, 2.5), 0, 0.98 - i * 0.03, 0.3 - i * 0.25));
  g.userData.anim = (t, moving) => {
    body.position.y = moving ? Math.abs(Math.sin(t * 14)) * 0.1 : 0;
    tail.rotation.z = Math.sin(t * 6) * 0.4;
  };
  return g;
}

function wisp() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const core = mesh(new THREE.IcosahedronGeometry(0.5, 0), glowMat(0x9fe6ff, 1.2), 0, 1.4, 0);
  core.material = new THREE.MeshStandardMaterial({ color: 0x9fe6ff, emissive: 0x3fb8ff, emissiveIntensity: 1.2, transparent: true, opacity: 0.85, flatShading: true });
  body.add(core);
  body.add(mesh(new THREE.IcosahedronGeometry(0.22, 0), glowMat(0xffffff, 3), 0, 1.4, 0));
  const shards = [];
  for (let i = 0; i < 5; i++) {
    const s = mesh(new THREE.OctahedronGeometry(0.12), glowMat(0xbff2ff, 2), 0, 1.4, 0);
    shards.push(s); body.add(s);
  }
  for (const s of [-1, 1]) body.add(mesh(new THREE.SphereGeometry(0.07, 6, 6), mat(0x0b2a44), s * 0.17, 1.5, 0.43));
  g.userData.anim = (t) => {
    body.position.y = Math.sin(t * 2) * 0.2;
    core.rotation.y = t * 0.8;
    shards.forEach((s, i) => {
      const a = t * 1.8 + (i / shards.length) * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.85, 1.4 + Math.sin(a * 2) * 0.25, Math.sin(a) * 0.85);
      s.rotation.x = t * 3;
    });
  };
  return g;
}

function knight(scale = 1, boss = false) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const steel = mat(boss ? 0x2a2438 : 0x55586a, { roughness: 0.5, metalness: 0.4 });
  const dark = mat(0x1a1822);
  const eyeC = boss ? 0xc542ff : 0x7de0ff;
  for (const s of [-1, 1]) body.add(mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.85, 6), dark, s * 0.2, 0.43, 0));
  body.add(mesh(new THREE.BoxGeometry(0.85, 0.9, 0.5), steel, 0, 1.3, 0));
  body.add(mesh(new THREE.BoxGeometry(1.1, 0.22, 0.55), steel, 0, 1.7, 0));
  const helm = mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.55, 8), steel, 0, 2.08, 0);
  body.add(helm);
  body.add(mesh(new THREE.BoxGeometry(0.4, 0.07, 0.05), glowMat(eyeC, 3), 0, 2.1, 0.31));
  if (boss) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      body.add(mesh(new THREE.ConeGeometry(0.07, 0.35, 4), glowMat(0xc542ff, 1.5), Math.cos(a) * 0.3, 2.5, Math.sin(a) * 0.3));
    }
  } else {
    body.add(mesh(new THREE.ConeGeometry(0.06, 0.45, 4), mat(0x6b1f2a), 0, 2.55, 0));
  }
  // cape
  const cape = mesh(new THREE.PlaneGeometry(0.9, 1.5), mat(boss ? 0x4a1466 : 0x2c2230, { side: THREE.DoubleSide }), 0, 1.0, -0.3);
  cape.rotation.x = 0.12;
  body.add(cape);
  // sword arm
  const arm = new THREE.Group();
  arm.position.set(0.55, 1.55, 0.1);
  arm.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 6), steel, 0, -0.35, 0));
  const blade = mesh(new THREE.BoxGeometry(0.1, 1.3, 0.04), boss ? glowMat(0x9a4dff, 1.2) : mat(0xb8bcc8, { metalness: 0.6, roughness: 0.3 }), 0, -0.3, 0.7);
  blade.rotation.x = Math.PI / 2;
  arm.add(blade);
  body.add(arm);
  g.scale.setScalar(scale);
  g.userData.anim = (t, moving) => {
    body.position.y = moving ? Math.abs(Math.sin(t * 7)) * 0.08 : 0;
    arm.rotation.x = Math.sin(t * (moving ? 7 : 1.5)) * 0.2;
    cape.rotation.x = 0.12 + Math.sin(t * 2.5) * 0.08;
  };
  return g;
}

function crow() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const b = mesh(new THREE.SphereGeometry(0.4, 10, 8), mat(0x1e1b2a), 0, 1.5, 0);
  b.scale.set(0.9, 0.9, 1.4);
  body.add(b);
  body.add(mesh(new THREE.SphereGeometry(0.28, 10, 8), mat(0x241f33), 0, 1.75, 0.45));
  const beak = mesh(new THREE.ConeGeometry(0.09, 0.35, 5), mat(0xf2c14e), 0, 1.72, 0.8);
  beak.rotation.x = Math.PI / 2;
  body.add(beak);
  for (const s of [-1, 1]) body.add(mesh(new THREE.SphereGeometry(0.05, 6, 6), glowMat(0xd08bff, 3), s * 0.13, 1.82, 0.66));
  const wings = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.3, 1.6, 0);
    const w = mesh(new THREE.BoxGeometry(1.1, 0.05, 0.55), mat(0x2d2640), s * 0.55, 0, 0);
    pivot.add(w);
    // sparks on wing tips
    pivot.add(mesh(new THREE.OctahedronGeometry(0.08), glowMat(0xb46bff, 3), s * 1.1, 0, 0));
    wings.push({ pivot, s });
    body.add(pivot);
  }
  const tail = mesh(new THREE.BoxGeometry(0.35, 0.04, 0.5), mat(0x2d2640), 0, 1.45, -0.7);
  body.add(tail);
  g.userData.anim = (t) => {
    body.position.y = Math.sin(t * 3) * 0.15;
    for (const w of wings) w.pivot.rotation.z = w.s * Math.sin(t * 9) * 0.6;
  };
  return g;
}

export function makeEnemy(kind) {
  switch (kind) {
    case 'sprig': return sprig();
    case 'rat': return rat();
    case 'wisp': return wisp();
    case 'knight': return knight(1);
    case 'crow': return crow();
    case 'boss': return knight(1.7, true);
  }
  return sprig();
}

// ---------------------------------------------------------------- Scenery

export function makeTree(scale = 1, leaf = 0x3f8a4a) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.6, 6), mat(0x6b4a2b), 0, 0.8, 0));
  g.add(mesh(new THREE.ConeGeometry(1.6, 2.4, 7), mat(leaf), 0, 2.5, 0));
  g.add(mesh(new THREE.ConeGeometry(1.25, 2.0, 7), mat(leaf), 0, 3.5, 0));
  g.add(mesh(new THREE.ConeGeometry(0.85, 1.6, 7), mat(leaf), 0, 4.4, 0));
  g.scale.setScalar(scale);
  return g;
}

export function makeRoundTree(scale = 1, leaf = 0xd36fae) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.2, 6), mat(0x5a3d24), 0, 1.1, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(1.5, 0), mat(leaf), 0, 3.2, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(1.0, 0), mat(leaf), 0.9, 2.7, 0.3));
  g.add(mesh(new THREE.IcosahedronGeometry(1.0, 0), mat(leaf), -0.8, 2.8, -0.2));
  g.scale.setScalar(scale);
  return g;
}

export function makeDeadTree(scale = 1) {
  const g = new THREE.Group();
  const wood = mat(0x3a2e2a);
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.35, 3.2, 5), wood, 0, 1.6, 0));
  const branches = [[0.6, 2.4, 0.7], [-0.7, 2.8, -0.6], [0.3, 3.2, -0.9], [-0.4, 2.0, 0.8]];
  for (const [x, y, rz] of branches) {
    const b = mesh(new THREE.CylinderGeometry(0.05, 0.12, 1.5, 4), wood, x, y, 0);
    b.rotation.z = rz;
    g.add(b);
  }
  g.scale.setScalar(scale);
  return g;
}

export function makeLamp(color = 0xffd27a) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.2, 6), mat(0x2b2733), 0, 1.6, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.1, 6), mat(0x2b2733), 0, 3.2, 0));
  g.add(mesh(new THREE.OctahedronGeometry(0.25), glowMat(color, 2.5), 0, 3.5, 0));
  g.add(mesh(new THREE.ConeGeometry(0.3, 0.3, 6), mat(0x2b2733), 0, 3.85, 0));
  return g;
}

export function makeHouse({ w = 6, d = 6, h = 4, wall = 0xd9c7a3, roof = 0x7b3f5e, lit = true, tilt = 0 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, h, d), mat(wall), 0, h / 2, 0));
  const roofMesh = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.9, 4), mat(roof), 0, h + h * 0.45, 0);
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.rotation.z = tilt;
  g.add(roofMesh);
  g.add(mesh(new THREE.BoxGeometry(1.1, 2, 0.1), mat(0x4a2e1f), 0, 1, d / 2 + 0.05));
  const winMat = lit ? glowMat(0xffc86b, 1.4) : mat(0x1c1a24);
  for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.9, 0.9, 0.1), winMat, s * w * 0.3, h * 0.62, d / 2 + 0.05));
  // chimney
  g.add(mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), mat(0x6b5f5a), w * 0.25, h + 1.0, -d * 0.15));
  return g;
}

export function makeTower({ r = 4, h = 16, wall = 0xcfc3e8, roof = 0x3b2d7a } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 12), mat(wall), 0, h / 2, 0));
  g.add(mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, 0.6, 12), mat(0xf2c14e), 0, h, 0));
  g.add(mesh(new THREE.ConeGeometry(r * 1.25, r * 2.4, 12), mat(roof), 0, h + r * 1.2, 0));
  g.add(mesh(new THREE.OctahedronGeometry(r * 0.2), glowMat(0xf2c14e, 2), 0, h + r * 2.6, 0));
  const win = glowMat(0xffd98a, 1.3);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    for (let lvl = 0; lvl < 2; lvl++) {
      const m = mesh(new THREE.BoxGeometry(0.8, 1.4, 0.2), win, Math.sin(a) * r, h * (0.45 + lvl * 0.3), Math.cos(a) * r);
      m.rotation.y = a;
      g.add(m);
    }
  }
  return g;
}

export function makeFountain() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.7, 20), mat(0xb7ad9a), 0, 0.35, 0));
  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 0.1, 20),
    new THREE.MeshStandardMaterial({ color: 0x4fb3ff, emissive: 0x1a5fa8, emissiveIntensity: 0.6, transparent: true, opacity: 0.85, roughness: 0.1 }));
  water.position.y = 0.62;
  g.add(water);
  g.add(mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.2, 10), mat(0xb7ad9a), 0, 1.4, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.2, 0.6, 0.3, 14), mat(0xb7ad9a), 0, 2.5, 0));
  const orb = mesh(new THREE.IcosahedronGeometry(0.55, 1), glowMat(0x7fe3ff, 2.2), 0, 3.3, 0);
  g.add(orb);
  g.userData.anim = (t) => { orb.position.y = 3.3 + Math.sin(t * 1.5) * 0.15; orb.rotation.y = t; };
  return g;
}

export function makeGate() {
  const g = new THREE.Group();
  const stone = mat(0x8c8398);
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(1.6, 7, 1.6), stone, s * 9.5, 3.5, 0));
    g.add(mesh(new THREE.OctahedronGeometry(0.5), glowMat(0xb46bff, 2), s * 9.5, 7.7, 0));
  }
  g.add(mesh(new THREE.BoxGeometry(20.6, 1.1, 1.4), stone, 0, 7.2, 0));
  g.add(mesh(new THREE.BoxGeometry(6, 1.3, 0.3), mat(0x3b2d7a), 0, 6.1, 0.75));
  return g;
}

export function makeCrypt() {
  const g = new THREE.Group();
  const stone = mat(0x3d3947);
  g.add(mesh(new THREE.BoxGeometry(18, 8, 8), stone, 0, 4, 0));
  const roof = mesh(new THREE.ConeGeometry(12.5, 5, 4), mat(0x2a2633), 0, 10.5, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.5;
  g.add(roof);
  g.add(mesh(new THREE.BoxGeometry(4, 5.5, 0.4), glowMat(0x6a1fa8, 1.2), 0, 2.75, 4.05));
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.5, 0.6, 7, 8), mat(0x544f60), s * 3, 3.5, 4.4));
    g.add(mesh(new THREE.OctahedronGeometry(0.4), glowMat(0xc542ff, 2.5), s * 3, 7.4, 4.4));
  }
  return g;
}

export function makeGrave() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.8, 1.1, 0.25), mat(0x6f6a78), 0, 0.55, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 10, 1, false, 0, Math.PI), mat(0x6f6a78), 0, 1.1, 0));
  g.children[1].rotation.x = Math.PI / 2;
  g.children[1].rotation.z = Math.PI / 2;
  g.rotation.z = (Math.random() - 0.5) * 0.2;
  return g;
}

export function makeRock(scale = 1, color = 0x6c6776) {
  const r = mesh(new THREE.DodecahedronGeometry(1, 0), mat(color));
  r.scale.set(scale * 1.2, scale * 0.8, scale);
  r.rotation.y = Math.random() * Math.PI;
  return r;
}

export function makeStall(color = 0xa0346a) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(3.2, 1.1, 1.3), mat(0x7a5236), 0, 0.55, 0));
  for (const x of [-1.5, 1.5]) g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 3, 5), mat(0x5a3d24), x, 1.5, -0.5));
  const awning = mesh(new THREE.BoxGeometry(3.6, 0.12, 1.9), mat(color), 0, 3.0, -0.1);
  awning.rotation.x = 0.2;
  g.add(awning);
  const colors = [0xff5fa2, 0x5fdc6a, 0x6fd3ff, 0xf2c14e, 0xb46bff];
  colors.forEach((c, i) => g.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), glowMat(c, 1.5), -1.2 + i * 0.6, 1.3, 0.2)));
  return g;
}

export function makeBookStand() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(2.6, 3.2, 0.8), mat(0x5a3d24), 0, 1.6, -0.6));
  const bookColors = [0x7b3f5e, 0x2e7d6b, 0x3b2d7a, 0xc9a24a, 0x8a3a1c];
  for (let shelf = 0; shelf < 3; shelf++) {
    for (let i = 0; i < 7; i++) {
      g.add(mesh(new THREE.BoxGeometry(0.28, 0.7, 0.5), mat(bookColors[(i + shelf) % 5]), -1.0 + i * 0.33, 0.55 + shelf * 0.95, -0.25));
    }
  }
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.3, 1.1, 6), mat(0x5a3d24), 0, 0.55, 1));
  const book = mesh(new THREE.BoxGeometry(0.8, 0.1, 0.6), glowMat(0x9fe6ff, 0.8), 0, 1.15, 1);
  book.rotation.x = -0.3;
  g.add(book);
  return g;
}
