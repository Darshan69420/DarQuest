// The great foes, each built to be recognised from across a battlefield: the blighted
// Thornmother, the Frozen Queen Sylvara and Malvoren, the Pale Magister. Same toon style and
// ink outlines as every other model; animated parts live in their own groups.
import * as THREE from 'three';
import { add, limb, group, dyn, finish, makeFace, flame, sph, V3, mat, glowMat, basic } from './models.js';

// ---------------------------------------------------------------- the Thornmother
// The Elder Mother's blighted heart, risen: a tree-woman with a bark mask, an antler crown in
// poisoned bloom, vines for hair, a skirt of roots and pods of blight pulsing on her back.
export function thornmotherBoss() {
  const g = new THREE.Group();
  const body = group(g);
  const bark = mat(0x5a4652), bark2 = mat(0x3a2b35), bark3 = mat(0x72586a);
  const moss = mat(0x4a5a30), leafA = mat(0x6a3a8a), leafB = mat(0x8a4aaa), petal = mat(0xc070e0);
  const blight = glowMat(0xd06aff, 2.2), bloomM = glowMat(0xe070ff, 2.6);
  const podM = mat(0x7a3a9a, { emissive: 0xd06aff, emissiveIntensity: 0.55 });

  // a skirt of roots gripping the ground
  add(body, new THREE.CylinderGeometry(0.75, 1.25, 1.6, 12), bark2, 0, 0.8, 0);
  const roots = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + 0.2, c = Math.cos(a), s = Math.sin(a);
    const r = group(body, c * 0.9, 0.5, s * 0.9);
    limb(r, V3(0, 0, 0), V3(c * 0.9, -0.45, s * 0.9), 0.24, 0.1, bark, 7);
    limb(r, V3(c * 0.9, -0.45, s * 0.9), V3(c * 1.55, -0.5, s * 1.55), 0.1, 0.03, bark2, 5);
    roots.push(r);
  }

  // a twisted trunk of a body, bark ridges spiralling round it
  const torso = group(body, 0, 1.6, 0);
  add(torso, new THREE.CylinderGeometry(0.5, 0.72, 1.9, 10), bark, 0, 0.95, 0);
  for (let k = 0; k < 7; k++) {
    const a = k * 0.9;
    add(torso, new THREE.BoxGeometry(0.09, 1.5, 0.08), bark3, Math.cos(a) * 0.62, 0.95, Math.sin(a) * 0.62, { ry: -a, rz: 0.25, noOutline: true });
  }
  for (const [x, y, rz] of [[0.2, 0.6, 0.4], [-0.25, 1.1, -0.5], [0.12, 1.5, 0.2], [-0.05, 0.3, -0.3]]) {
    add(torso, new THREE.BoxGeometry(0.05, 0.45, 0.03), blight, x, y, 0.64, { rz, noOutline: true, shadow: false });
  }
  // the blighted heart glowing through a knot in her chest
  add(torso, new THREE.TorusGeometry(0.26, 0.08, 6, 14), bark3, 0, 1.15, 0.52);
  const heart = dyn(add(torso, sph(0.2, 12, 10), bloomM, 0, 1.15, 0.52, { shadow: false }));
  for (const s of [-1, 1]) {
    add(torso, new THREE.IcosahedronGeometry(0.42, 0), leafA, s * 0.62, 1.75, 0);
    add(torso, new THREE.IcosahedronGeometry(0.3, 0), leafB, s * 0.82, 1.95, -0.15);
    add(torso, new THREE.IcosahedronGeometry(0.22, 0), moss, s * 0.5, 1.5, 0.3);
  }

  // the bark mask: hollow sockets with a violet light in them
  const head = group(torso, 0, 2.3, 0.08);
  limb(head, V3(0, -0.5, 0), V3(0, -0.05, 0), 0.3, 0.24, bark, 8);
  add(head, sph(0.56, 16, 12), bark3, 0, 0.38, 0.02, { s: [0.85, 1.12, 0.78] });
  // a heavy brow of bark over deep sockets, and a jagged split for a mouth
  for (const s of [-1, 1]) {
    add(head, new THREE.BoxGeometry(0.34, 0.1, 0.16), bark, s * 0.17, 0.6, 0.38, { rz: s * -0.25 });
    add(head, sph(0.13, 10, 8), basic(0x120a10), s * 0.18, 0.44, 0.39, { s: [1.2, 0.85, 0.5], shadow: false });
    add(head, sph(0.065, 8, 6), basic(0xf4b0ff), s * 0.18, 0.44, 0.45, { shadow: false });
    add(head, new THREE.BoxGeometry(0.05, 0.4, 0.04), bark2, s * 0.36, 0.2, 0.34, { rz: s * 0.2, noOutline: true });
  }
  add(head, new THREE.BoxGeometry(0.3, 0.07, 0.05), basic(0x120a10), 0, 0.12, 0.43, { shadow: false });
  for (const x of [-0.1, 0, 0.1]) add(head, new THREE.ConeGeometry(0.03, 0.08, 4), bark3, x, 0.14, 0.45, { rx: Math.PI, noOutline: true });

  // an antler crown of thorny branches, each tipped with a poisoned bloom
  const blooms = [];
  const bloom = (p, r) => {
    const b = dyn(group(head, p.x, p.y, p.z));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      add(b, sph(r, 8, 6), petal, Math.cos(a) * r * 0.9, 0, Math.sin(a) * r * 0.9, { s: [1, 0.45, 0.6], ry: -a });
    }
    add(b, sph(r * 0.6, 8, 6), bloomM, 0, r * 0.2, 0, { shadow: false });
    blooms.push(b);
  };
  for (let k = 0; k < 5; k++) {
    const a = -0.95 + k * 0.475;
    const base = V3(Math.sin(a) * 0.3, 0.8, -0.05);
    const tip = V3(Math.sin(a) * 1.25, 1.95 + (k === 2 ? 0.45 : 0) - Math.abs(a) * 0.2, -0.2 + Math.cos(a) * 0.1);
    limb(head, base, tip, 0.11, 0.04, bark, 6);
    for (const [t, side] of [[0.45, 1], [0.7, -1]]) {
      const mid = base.clone().lerp(tip, t);
      const fork = mid.clone().add(V3(Math.sin(a + side * 0.9) * 0.45, 0.35, 0.05));
      limb(head, mid, fork, 0.05, 0.015, bark, 4);
      if (k % 2 === 0 && side > 0) bloom(fork, 0.07);
    }
    for (let t = 0.2; t < 0.9; t += 0.25) {
      const p = base.clone().lerp(tip, t);
      add(head, new THREE.ConeGeometry(0.03, 0.16, 4), bark2, p.x, p.y, p.z + 0.06, { rx: 1.2, noOutline: true });
    }
    bloom(tip, 0.1);
  }
  // a mane of blighted leaves behind the mask
  for (let k = 0; k < 9; k++) {
    const a = -1.5 + k * (3 / 8);
    add(head, new THREE.IcosahedronGeometry(0.26 + (k % 2) * 0.08, 0), k % 2 ? leafA : leafB, Math.sin(a) * 0.62, 0.5 + Math.cos(a) * 0.55, -0.32);
  }

  // vines for hair, hanging down her back
  const vines = [];
  for (let k = 0; k < 5; k++) {
    const v = group(head, (k - 2) * 0.2, 0.55, -0.4);
    const len = 1.5 + (k % 2) * 0.5, sway = (k - 2) * 0.12;
    limb(v, V3(0, 0, 0), V3(sway, -len * 0.5, -0.3), 0.07, 0.05, moss, 5);
    limb(v, V3(sway, -len * 0.5, -0.3), V3(sway * 1.6, -len, -0.25), 0.05, 0.02, moss, 5);
    for (const t of [0.35, 0.75]) add(v, new THREE.IcosahedronGeometry(0.1, 0), k % 2 ? leafA : leafB, sway * t * 1.6, -len * t, -0.36);
    vines.push(v);
  }

  // long branch arms ending in three-twig claws
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = group(torso, s * 0.65, 1.65, 0.05);
    limb(arm, V3(0, 0, 0), V3(s * 0.55, -0.8, 0.35), 0.22, 0.14, bark, 8);
    const fore = group(arm, s * 0.55, -0.8, 0.35);
    limb(fore, V3(0, 0, 0), V3(s * 0.2, -0.9, 0.55), 0.14, 0.08, bark, 7);
    for (const f of [-0.35, 0, 0.35]) limb(fore, V3(s * 0.2, -0.9, 0.55), V3(s * (0.2 + f * 0.6), -1.5, 0.82 + Math.abs(f) * 0.1), 0.06, 0.01, bark2, 5);
    add(fore, new THREE.IcosahedronGeometry(0.16, 0), leafB, s * 0.1, -0.35, 0.25);
    arms.push({ arm, fore });
  }

  // pods of blight swelling on her back
  const pods = [];
  for (const [x, y, z, r] of [[0.35, 1.3, -0.58, 0.24], [-0.32, 0.85, -0.62, 0.2], [0.05, 1.85, -0.5, 0.17]]) {
    const pod = dyn(group(torso, x, y, z));
    add(pod, sph(r, 12, 10), podM, 0, 0, 0, { s: [1, 1.25, 1] });
    for (let k = 0; k < 4; k++) add(pod, new THREE.TorusGeometry(r * 1.01, r * 0.08, 4, 14), bark2, 0, 0, 0, { ry: k * Math.PI / 4, s: [1, 1.25, 1], noOutline: true });
    add(pod, new THREE.ConeGeometry(r * 0.3, r * 0.7, 5), bark2, 0, r * 1.35, 0);
    pods.push(pod);
  }
  const spores = [];
  for (let k = 0; k < 10; k++) spores.push(dyn(add(g, sph(0.05, 6, 4), basic(0xe0a8ff), 0, 0, 0, { shadow: false })));

  g.userData.anim = (t, moving) => {
    body.position.y = moving ? Math.abs(Math.sin(t * 3)) * 0.06 : 0;
    torso.rotation.z = Math.sin(t * 0.7) * 0.04;
    torso.rotation.y = Math.sin(t * 0.5) * 0.06;
    head.rotation.x = Math.sin(t * 0.9) * 0.05;
    arms.forEach(({ arm, fore }, i) => {
      arm.rotation.x = moving ? Math.sin(t * 3 + i * Math.PI) * 0.3 : -0.2 + Math.sin(t * 1.1 + i) * 0.12;
      fore.rotation.x = -0.3 + Math.sin(t * 1.3 + i) * 0.15;
    });
    vines.forEach((v, i) => { v.rotation.x = Math.sin(t * 1.4 + i) * 0.08; v.rotation.z = Math.sin(t * 1.1 + i * 0.7) * 0.06; });
    roots.forEach((r, i) => { r.rotation.y = Math.sin(t * 0.8 + i) * 0.05; });
    heart.scale.setScalar(1 + Math.max(0, Math.sin(t * 3)) * 0.25);
    pods.forEach((m, i) => m.scale.setScalar(1 + Math.sin(t * 3 + i * 1.7) * 0.14));
    blooms.forEach((b, i) => { b.rotation.y = t * 0.6 + i; b.scale.setScalar(1 + Math.sin(t * 2.5 + i) * 0.1); });
    spores.forEach((m, i) => {
      const a = t * 0.4 + i * 0.63, h = (t * 0.25 + i * 0.1) % 1, rr = 1.4 + (i % 3) * 0.4;
      m.position.set(Math.cos(a) * rr, 0.5 + h * 4.5, Math.sin(a) * rr);
      m.scale.setScalar(1 - h * 0.6);
    });
  };
  g.scale.setScalar(2.05);
  g.userData.bodyWidth = 8;
  return finish(g, 0.035, 0.08);
}

// ---------------------------------------------------------------- Queen Sylvara
// The Frozen Queen: tall in a flared gown hemmed with ice, a high collar of frost behind her,
// silver hair to her waist, a crown of ice and a snowflake sceptre.
export function frostQueenBoss() {
  const g = new THREE.Group();
  const body = group(g);
  const gown = mat(0xf2faff), gown2 = mat(0x9fcdf0), deep = mat(0x3d6aa8), trim = mat(0xbfe4f6);
  const skin = mat(0xdce8f8), hairM = mat(0xc4dcf4), capeM = mat(0x3d6aa8, { side: THREE.DoubleSide }), collarM = mat(0xd8f2ff);
  const ice = glowMat(0x9fe6ff, 2.2);

  // the gown, flaring to a hem of ice
  add(body, new THREE.CylinderGeometry(0.34, 1.05, 2.1, 20), gown2, 0, 1.05, 0);
  add(body, new THREE.CylinderGeometry(1.06, 1.1, 0.16, 20), deep, 0, 0.08, 0);
  // a white front panel with silver clasps, and deep blue seams down the sides
  const shell = (a, w, material) => add(body, new THREE.CylinderGeometry(0.355, 1.07, 2.08, 6, 1, true, a - w / 2, w), material, 0, 1.06, 0, { noOutline: true });
  shell(0, 0.62, gown);
  for (const a of [-1.1, 1.1, Math.PI - 0.5, Math.PI + 0.5]) shell(a, 0.1, deep);
  for (const y of [0.45, 0.85, 1.25, 1.65]) add(body, new THREE.OctahedronGeometry(0.06), basic(0xffffff), 0, y, 0.34 + (2.1 - y) * 0.338 + 0.05, { shadow: false });
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    add(body, new THREE.OctahedronGeometry(0.12), ice, Math.cos(a) * 1.04, 0.24, Math.sin(a) * 1.04, { s: [0.7, 1.9, 0.7] });
  }
  // a cape of winter blue behind her
  const cape = add(body, new THREE.CylinderGeometry(0.42, 1.25, 2.6, 16, 1, true, Math.PI * 0.62, Math.PI * 0.76), capeM, 0, 1.45, -0.05);
  // a great snowflake worked into the cape, and a hem of frost along its edge
  const sigil = group(body, 0, 1.75, -0.8);
  sigil.rotation.x = 0.31;
  for (let r = 0; r < 3; r++) add(sigil, new THREE.BoxGeometry(0.75, 0.06, 0.03), basic(0xe8f6ff), 0, 0, 0, { rz: r * Math.PI / 3, shadow: false });
  for (let r = 0; r < 6; r++) add(sigil, new THREE.OctahedronGeometry(0.06), basic(0xffffff), Math.cos(r * Math.PI / 3) * 0.38, Math.sin(r * Math.PI / 3) * 0.38, 0, { shadow: false });
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * 0.66 + k * (Math.PI * 0.68 / 8);
    add(body, new THREE.OctahedronGeometry(0.1), ice, Math.sin(a) * 1.24, 0.2, Math.cos(a) * 1.24 - 0.05, { s: [0.7, 1.7, 0.7] });
  }
  // bodice and a silver waist band
  add(body, new THREE.CylinderGeometry(0.29, 0.35, 0.72, 12), gown2, 0, 2.35, 0);
  add(body, new THREE.TorusGeometry(0.34, 0.05, 6, 18), trim, 0, 2.02, 0, { rx: Math.PI / 2 });
  for (const s of [-1, 1]) add(body, sph(0.17, 10, 8), trim, s * 0.33, 2.62, 0, { s: [1.2, 0.7, 1] });
  // a standing collar of frost blades, framing the head from behind
  for (let k = 0; k < 9; k++) {
    const a = -1.2 + k * (2.4 / 8), len = 0.8 - Math.abs(a) * 0.22;
    add(body, new THREE.ConeGeometry(0.11, len, 4), collarM, Math.sin(a) * (0.42 + len / 2), 2.72 + Math.cos(a) * (0.3 + len / 2), -0.24, { rz: -a, s: [1, 1, 0.35] });
  }

  // head, silver hair, and a crown of ice
  const head = group(body, 0, 3.02, 0);
  add(head, sph(0.3, 16, 12), skin, 0, 0, 0, { s: [0.92, 1.05, 0.92] });
  head.add(makeFace(0.29, { eyeR: 0.048, gap: 0.1, eyeY: 0.02, iris: 0x4dc8ff, brows: 'angry', browColor: 0x7a9ac0, mouth: 'flat', mouthY: -0.11, mouthW: 0.045 }));
  // silver hair: swept back from the brow, two locks in front, the rest to her waist
  add(head, new THREE.SphereGeometry(0.335, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), hairM, 0, 0.01, -0.01, { rx: -0.6, s: [0.96, 1.06, 1] });
  for (const s of [-1, 1]) { limb(head, V3(s * 0.25, 0.05, 0.06), V3(s * 0.33, -0.4, 0.2), 0.065, 0.05, hairM, 6); limb(head, V3(s * 0.33, -0.4, 0.2), V3(s * 0.27, -0.85, 0.26), 0.05, 0.015, hairM, 6); }
  for (let k = 0; k < 6; k++) limb(head, V3((k - 2.5) * 0.09, -0.05, -0.24), V3((k - 2.5) * 0.13, -1.4 - (k % 2) * 0.2, -0.44), 0.09, 0.04, hairM, 6);
  const crown = group(head, 0, 0.31, 0);
  add(crown, new THREE.TorusGeometry(0.24, 0.035, 5, 18), ice, 0, 0, 0, { rx: Math.PI / 2 });
  for (let k = 0; k < 7; k++) {
    const a = -1.3 + k * (2.6 / 6);
    add(crown, new THREE.ConeGeometry(0.045, 0.3 + (k === 3 ? 0.28 : k % 2 ? 0.05 : 0.14), 5), ice, Math.sin(a) * 0.24, 0.16 + (k === 3 ? 0.12 : 0), Math.cos(a) * 0.24);
  }
  add(crown, new THREE.OctahedronGeometry(0.06), basic(0xffffff), 0, 0.1, 0.25, { shadow: false });

  // slender arms: one open, one holding the sceptre
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = group(body, s * 0.34, 2.58, 0);
    limb(arm, V3(0, 0, 0), V3(s * 0.28, -0.62, 0.18), 0.1, 0.075, gown2, 8);
    add(arm, new THREE.ConeGeometry(0.16, 0.34, 10, 1, true), gown, s * 0.28, -0.62, 0.18, { rx: Math.PI });
    add(arm, sph(0.075, 8, 6), skin, s * 0.3, -0.82, 0.22);
    arms.push(arm);
  }
  const sceptre = group(arms[1], 0.32, -0.85, 0.24);
  limb(sceptre, V3(0, -0.9, 0), V3(0, 1.1, 0), 0.035, 0.03, trim, 6);
  const flake = dyn(group(sceptre, 0, 1.25, 0));
  for (let r = 0; r < 3; r++) add(flake, new THREE.BoxGeometry(0.5, 0.05, 0.05), ice, 0, 0, 0, { rz: r * Math.PI / 3 });
  add(flake, new THREE.OctahedronGeometry(0.1), basic(0xffffff), 0, 0, 0, { shadow: false });

  // shards of ice circling her
  const shards = [];
  for (let i = 0; i < 6; i++) shards.push(dyn(add(g, new THREE.OctahedronGeometry(0.2, 0), ice, 0, 2, 0, { s: [0.6, 1.6, 0.6], shadow: false })));

  g.userData.anim = (t, moving) => {
    body.position.y = Math.sin(t * 1.3) * 0.04;
    cape.rotation.y = Math.sin(t * 0.9) * 0.05;
    head.rotation.y = Math.sin(t * 0.6) * 0.12;
    arms[0].rotation.x = moving ? Math.sin(t * 4) * 0.3 : -0.1 + Math.sin(t * 1.1) * 0.08;
    arms[1].rotation.x = moving ? -Math.sin(t * 4) * 0.2 : -0.35;
    flake.rotation.z = t * 1.5;
    crown.children.forEach((c, i) => { if (i) c.scale.setScalar(1 + Math.max(0, Math.sin(t * 3 + i)) * 0.12); });
    shards.forEach((m, i) => {
      const a = t * 0.8 + (i / 6) * Math.PI * 2;
      m.position.set(Math.cos(a) * 1.5, 1.8 + Math.sin(t * 2 + i) * 0.3, Math.sin(a) * 1.5);
      m.rotation.y = t * 2;
    });
  };
  g.scale.setScalar(1.4);
  return finish(g, 0.03, 0.07);
}

// ---------------------------------------------------------------- Malvoren
// The Pale Magister, Orvyn's brightest student: tall and hovering, in pale robes that fray to
// nothing, a dark mantle with a high spiked collar, a crooked hat, a halo of runes at his back,
// a staff caging a void, black fire in his open hand, and his stolen books circling him.
export function malvorenBoss() {
  const g = new THREE.Group();
  const body = group(g, 0, 0.35, 0);
  const robe = mat(0xe4e0ee), robe2 = mat(0xb8b0cc), mantle = mat(0x2a1a3a), mantle2 = mat(0x3d2852), trim = mat(0xd06aff);
  const skin = mat(0xd8d4e0), beard = mat(0xf4f2ff), wood = mat(0x2a1a20);
  const voidM = glowMat(0xd06aff, 2.6);

  // the robe, fraying away into points above the ground
  add(body, new THREE.CylinderGeometry(0.4, 0.82, 2.3, 16), robe, 0, 1.15, 0);
  add(body, new THREE.CylinderGeometry(0.83, 0.85, 0.14, 16), mantle2, 0, 0.1, 0);
  const hem = group(body, 0, 0, 0);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    add(hem, new THREE.ConeGeometry(0.15, 0.38 + (k % 3) * 0.14, 4), robe2, Math.cos(a) * 0.74, -0.12, Math.sin(a) * 0.74, { rx: Math.PI, ry: -a });
  }
  // folds, a front panel set with void stones, and a sash at the waist
  const shell = (a, w, material) => add(body, new THREE.CylinderGeometry(0.41, 0.835, 2.2, 4, 1, true, a - w / 2, w), material, 0, 1.2, 0, { noOutline: true });
  shell(0, 0.34, mantle2);
  for (const a of [-1.2, -0.7, 0.7, 1.2, 2.2, -2.2]) shell(a, 0.05, robe2);
  for (const y of [0.45, 0.95, 1.45]) add(body, new THREE.OctahedronGeometry(0.065), voidM, 0, y, 0.4 + (2.3 - y) * 0.183 + 0.04, { shadow: false });
  add(body, new THREE.TorusGeometry(0.48, 0.06, 6, 20), mantle2, 0, 1.92, 0, { rx: Math.PI / 2 });
  for (const s of [-1, 1]) add(body, new THREE.BoxGeometry(0.1, 0.7, 0.04), mantle2, s * 0.14, 1.55, 0.53, { rx: -0.18, rz: s * 0.08 });
  // a dark mantle behind him, and a high collar of spikes
  add(body, new THREE.CylinderGeometry(0.5, 1.05, 2.5, 16, 1, true, Math.PI * 0.6, Math.PI * 0.8), mat(0x2a1a3a, { side: THREE.DoubleSide }), 0, 1.3, -0.04);
  for (let k = 0; k < 7; k++) {
    const a = -1.1 + k * (2.2 / 6);
    add(body, new THREE.ConeGeometry(0.07, 0.55 - Math.abs(a) * 0.15, 5), mantle, Math.sin(a) * 0.42, 2.72, -0.12 - Math.cos(a) * 0.1, { rz: -a * 0.8, rx: -0.2 });
  }
  // the Magister's sigil worked into the back of the mantle
  add(body, new THREE.TorusGeometry(0.3, 0.035, 5, 24), voidM, 0, 1.75, -0.74, { rx: 0.216, noOutline: true, shadow: false });
  add(body, new THREE.OctahedronGeometry(0.14), voidM, 0, 1.75, -0.75, { rx: 0.216, s: [0.7, 1.6, 0.3], noOutline: true, shadow: false });
  for (const s of [-1, 1]) {
    add(body, new THREE.SphereGeometry(0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mantle2, s * 0.46, 2.3, 0, { s: [1.15, 0.75, 1.05], rz: -s * 0.25 });
    for (const z of [-0.14, 0.02, 0.18]) add(body, new THREE.ConeGeometry(0.05, 0.3 - Math.abs(z) * 0.4, 5), mantle, s * 0.66, 2.44, z, { rz: -s * 0.9 });
    add(body, new THREE.OctahedronGeometry(0.08), voidM, s * 0.5, 2.54, 0.12, { s: [0.7, 1.6, 0.7], rz: -s * 0.3 });
  }

  // a long pale face with burning slits for eyes, and a beard to his chest
  const head = group(body, 0, 2.72, 0.02);
  add(head, sph(0.3, 16, 12), skin, 0, 0, 0, { s: [0.82, 1.05, 0.9] });
  for (const s of [-1, 1]) {
    add(head, sph(0.085, 10, 6), basic(0x2a1a3a), s * 0.1, 0.03, 0.22, { s: [1.5, 0.8, 0.5], shadow: false });
    add(head, sph(0.06, 10, 6), basic(0xf8e4ff), s * 0.1, 0.03, 0.26, { s: [1.8, 0.45, 0.4], shadow: false });
    add(head, new THREE.BoxGeometry(0.15, 0.035, 0.03), basic(0x1a1030), s * 0.1, 0.12, 0.26, { rz: s * 0.4, shadow: false });
    add(head, new THREE.ConeGeometry(0.045, 0.34, 5), beard, s * 0.1, -0.13, 0.25, { rz: s * 2.3 });
  }
  add(head, new THREE.ConeGeometry(0.04, 0.14, 4), skin, 0, -0.03, 0.29, { rx: Math.PI / 2 });
  add(head, new THREE.ConeGeometry(0.22, 1.15, 8), beard, 0, -0.62, 0.16, { rx: Math.PI + 0.12 });
  // the crooked hat, tipped back off his brow
  const hat = group(head, 0, 0, -0.02);
  hat.rotation.x = -0.18;
  add(hat, new THREE.CylinderGeometry(0.5, 0.52, 0.06, 18), mantle, 0, 0.24, 0);
  add(hat, new THREE.CylinderGeometry(0.22, 0.32, 0.62, 14), mantle, 0, 0.56, -0.02);
  add(hat, new THREE.CylinderGeometry(0.325, 0.33, 0.1, 14), trim, 0, 0.31, -0.02);
  add(hat, new THREE.ConeGeometry(0.22, 0.75, 12), mantle2, 0.02, 1.12, -0.18, { rx: -0.55 });
  add(hat, new THREE.OctahedronGeometry(0.07), voidM, 0, 0.33, 0.32, { shadow: false });

  // a halo of runes at his back
  const halo = dyn(group(body, 0, 2.75, -0.55));
  add(halo, new THREE.TorusGeometry(1.0, 0.035, 6, 48), voidM, 0, 0, 0);
  add(halo, new THREE.TorusGeometry(0.82, 0.015, 4, 40), basic(0xe8c0ff), 0, 0, 0);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    add(halo, new THREE.OctahedronGeometry(0.075), basic(0xf4d8ff), Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0, { shadow: false });
  }

  // arms in wide sleeves: the staff in one hand, black fire in the other
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = group(body, s * 0.45, 2.3, 0.02);
    add(arm, new THREE.ConeGeometry(0.26, 0.9, 10, 1, true), robe, s * 0.18, -0.38, 0.12, { rz: s * 0.4 });
    add(arm, sph(0.09, 8, 6), skin, s * 0.36, -0.78, 0.2);
    arms.push(arm);
  }
  const staff = group(arms[1], 0.38, -0.8, 0.22);
  limb(staff, V3(0, -2, 0), V3(0, 1.3, 0), 0.05, 0.04, wood, 6);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    limb(staff, V3(0, 1.25, 0), V3(Math.cos(a) * 0.2, 1.55, Math.sin(a) * 0.2), 0.02, 0.02, wood, 4);
    limb(staff, V3(Math.cos(a) * 0.2, 1.55, Math.sin(a) * 0.2), V3(0, 1.9, 0), 0.02, 0.015, wood, 4);
  }
  const orb = dyn(add(staff, sph(0.17, 14, 10), voidM, 0, 1.57, 0, { shadow: false }));
  add(staff, sph(0.07, 8, 6), basic(0xffffff), 0, 1.57, 0, { shadow: false });
  const fire = flame(arms[0], -0.38, -0.55, 0.25, 0.9, [0x2a0a3a, 0x8a2aff, 0xe8c0ff]);

  // his stolen books, and runes turning on the ground below him
  const books = [];
  for (let i = 0; i < 3; i++) {
    const b = dyn(group(g, 0, 2, 0));
    add(b, new THREE.BoxGeometry(0.42, 0.08, 0.32), mat([0x3a1a4a, 0x1a2a4a, 0x4a1a1a][i]));
    add(b, new THREE.BoxGeometry(0.38, 0.06, 0.3), mat(0xf0e6d0), 0.01, 0.01, 0);
    add(b, new THREE.OctahedronGeometry(0.06), voidM, 0, 0.07, 0);
    books.push(b);
  }
  const runes = [];
  for (let i = 0; i < 5; i++) runes.push(dyn(add(g, new THREE.TorusGeometry(0.14, 0.025, 4, 10), basic(0xe8c0ff), 0, 0, 0, { shadow: false })));

  g.userData.anim = (t, moving) => {
    body.position.y = 0.35 + Math.sin(t * 1.6) * 0.1;
    hem.rotation.y = Math.sin(t * 0.8) * 0.12;
    halo.rotation.z = t * 0.35;
    orb.scale.setScalar(1 + Math.sin(t * 4) * 0.1);
    fire.userData.flicker?.(t);
    arms[0].rotation.x = -0.35 + Math.sin(t * 1.4) * 0.1;
    arms[1].rotation.x = moving ? Math.sin(t * 3) * 0.12 : Math.sin(t * 0.9) * 0.05;
    head.rotation.y = Math.sin(t * 0.5) * 0.15;
    books.forEach((b, i) => {
      const a = t * 0.9 + (i / 3) * Math.PI * 2;
      b.position.set(Math.cos(a) * 1.5, 2.3 + Math.sin(t * 2 + i) * 0.2, Math.sin(a) * 1.5);
      b.rotation.set(Math.sin(t + i) * 0.3, -a, 0);
    });
    runes.forEach((r, i) => {
      const a = -t * 1.4 + (i / 5) * Math.PI * 2;
      r.position.set(Math.cos(a) * 1.1, 0.12, Math.sin(a) * 1.1);
      r.rotation.x = Math.PI / 2;
    });
  };
  g.scale.setScalar(1.42);
  return finish(g, 0.03, 0.07);
}
