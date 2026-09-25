// Procedural, toon-shaded models. Every model faces +Z and stands on y = 0.
// Style: cel shading, ink outlines, big expressive eyes and chunky proportions.
// Swap these out for real 3D art (glTF) later without touching game logic.
import * as THREE from 'three';
import { thornmotherBoss, frostQueenBoss, malvorenBoss } from './models_bosses.js';

const INK = 0x1a1030;
const UP = new THREE.Vector3(0, 1, 0);
const FWD = new THREE.Vector3(0, 0, 1);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sph = (r, w = 12, h = 9) => new THREE.SphereGeometry(r, w, h);
const darker = (hex, k = 0.7) => new THREE.Color(hex).multiplyScalar(k).getHex();
const lighter = (hex, k = 0.35) => new THREE.Color(hex).lerp(new THREE.Color(0xffffff), k).getHex();
const rnd = (a, b) => a + Math.random() * (b - a);

// ---------------------------------------------------------------- materials

let ramp = null;
function toonRamp() {
  if (!ramp) {
    ramp = new THREE.DataTexture(new Uint8Array([150, 200, 242, 255]), 4, 1, THREE.RedFormat);
    ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
    ramp.generateMipmaps = false;
    ramp.needsUpdate = true;
  }
  return ramp;
}

const cache = new Map();
// Cel-shaded material, shared between models with the same settings.
export function mat(color, opts = {}) {
  const key = 't' + color + JSON.stringify(opts);
  if (!cache.has(key)) {
    const { roughness, metalness, flatShading, ...rest } = opts;
    cache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: toonRamp(), ...rest }));
  }
  return cache.get(key);
}
// Glowing parts keep their colour: a dark base lit by a strong emissive.
export function glowMat(color, intensity = 1.6) {
  return mat(darker(color, 0.35), { emissive: color, emissiveIntensity: Math.min(1.3, 0.55 + intensity * 0.3) });
}
// Unlit material: eyes, ink details and bright magic bits.
export function basic(color, opts = {}) {
  const key = 'b' + color + JSON.stringify(opts);
  if (!cache.has(key)) cache.set(key, new THREE.MeshBasicMaterial({ color, ...opts }));
  return cache.get(key);
}
// A material this model animates on its own, so it must not be shared.
function ownMat(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: toonRamp(), ...opts });
}

const hullMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

// ---------------------------------------------------------------- building helpers

function add(parent, geo, material, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  if (o.rx || o.ry || o.rz) m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
  if (o.s !== undefined) {
    if (typeof o.s === 'number') m.scale.setScalar(o.s);
    else m.scale.set(o.s[0], o.s[1], o.s[2]);
  }
  m.castShadow = o.shadow !== false;
  m.receiveShadow = true;
  if (o.noOutline) m.userData.noOutline = true;
  parent.add(m);
  return m;
}

// A tapered cylinder from point a (radius rA) to point b (radius rB).
function limb(parent, a, b, rA, rB, material, seg = 10) {
  const dir = b.clone().sub(a);
  const m = add(parent, new THREE.CylinderGeometry(rB, rA, dir.length(), seg), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}

// A tube along smooth points (tails, horns). Tubes are not outlined.
function tube(parent, points, radius, material, seg = 20) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => V3(...p)));
  return add(parent, new THREE.TubeGeometry(curve, seg, radius, 8, false), material, 0, 0, 0, { noOutline: true });
}

function group(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

// the building helpers, shared with the boss models in models_bosses.js
export { add, limb, tube, group, dyn, finish, makeFace, makeEye, flame, sph, V3, darker, lighter, INK };

// Ink outline ("inverted hull"): a slightly larger back-face copy of each part.
export function outline(root, width = 0.026, minSize = 0.07) {
  const targets = [];
  root.traverse((o) => {
    if (!o.isMesh || o.userData.noOutline || o.userData.isHull) return;
    const m = o.material;
    if (!m || m.isMeshBasicMaterial || m.transparent || m.side === THREE.DoubleSide) return;
    targets.push(o);
  });
  const size = V3(), c = V3();
  for (const o of targets) {
    const geo = o.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    geo.boundingBox.getSize(size);
    if (Math.max(size.x * Math.abs(o.scale.x), size.y * Math.abs(o.scale.y), size.z * Math.abs(o.scale.z)) < minSize) continue;
    geo.boundingBox.getCenter(c);
    const hull = new THREE.Mesh(geo, hullMat);
    hull.userData.isHull = true;
    const k = (axisSize, s) => 1 + (2 * width / Math.abs(s)) / Math.max(axisSize, 0.03);
    hull.scale.set(k(size.x, o.scale.x), k(size.y, o.scale.y), k(size.z, o.scale.z));
    hull.position.set(c.x * (1 - hull.scale.x), c.y * (1 - hull.scale.y), c.z * (1 - hull.scale.z));
    hull.raycast = () => {};
    o.add(hull);
  }
  return root;
}

// Marks a mesh that the model's animation moves, so it is never merged away.
function dyn(m) {
  m.userData.dynamic = true;
  return m;
}

// Joins many geometries (each with its own transform) into one, for one draw call.
export function mergeGeometries(items) {
  const parts = [];
  let total = 0;
  for (const { geo, matrix } of items) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(matrix);
    if (matrix.determinant() < 0) {
      // mirrored parts would turn inside out: flip each triangle back
      for (const name of ['position', 'normal', 'uv']) {
        const a = g.attributes[name];
        if (!a) continue;
        const n = a.itemSize, arr = a.array;
        for (let t = 0; t < a.count; t += 3) {
          for (let k = 0; k < n; k++) {
            const i1 = (t + 1) * n + k, i2 = (t + 2) * n + k;
            const tmp = arr[i1]; arr[i1] = arr[i2]; arr[i2] = tmp;
          }
        }
      }
    }
    parts.push(g);
    total += g.attributes.position.count;
  }
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of parts) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array.subarray(0, c * 2), o * 2);
    o += c;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  out.computeBoundingBox();
  return out;
}

// Merges a model's non-moving parts into one mesh per material.
// `flatten`: the whole model is static, so every part is merged into the root.
export function optimize(root, flatten = false) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4();
  const containers = [];
  if (flatten) containers.push(root);
  else root.traverse(o => { if (!o.isMesh) containers.push(o); });
  for (const node of containers) {
    const meshes = [];
    if (flatten) {
      node.traverse(o => { if (o.isMesh && !o.userData.isHull && !o.userData.dynamic) meshes.push(o); });
    } else {
      for (const c of node.children) {
        if (c.isMesh && !c.userData.dynamic && c.children.every(k => k.userData.isHull)) meshes.push(c);
      }
    }
    if (meshes.length < 2) continue;
    inv.copy(node.matrixWorld).invert();
    const buckets = new Map();
    const push = (obj, receive, cast) => {
      const key = obj.material.uuid + (receive ? '|r' : '|n');
      if (!buckets.has(key)) buckets.set(key, { material: obj.material, receive, cast: false, items: [] });
      const b = buckets.get(key);
      b.cast ||= cast;
      b.items.push({ geo: obj.geometry, matrix: new THREE.Matrix4().multiplyMatrices(inv, obj.matrixWorld) });
    };
    for (const m of meshes) {
      push(m, m.receiveShadow, m.castShadow);
      for (const h of m.children) if (h.userData.isHull) push(h, false, false);
    }
    for (const m of meshes) m.parent.remove(m);
    for (const b of buckets.values()) {
      const merged = new THREE.Mesh(mergeGeometries(b.items), b.material);
      merged.castShadow = b.cast;
      merged.receiveShadow = b.receive;
      merged.userData.merged = true;
      if (b.material === hullMat) merged.userData.isHull = true;
      node.add(merged);
    }
  }
  if (flatten) root.userData.static = true;
  return root;
}

// Outline, then merge. Every model builder ends here.
function finish(root, width, minSize, isStatic = false) {
  outline(root, width, minSize);
  return optimize(root, isStatic);
}

// ---------------------------------------------------------------- faces

function makeEye(r, { iris = null, pupil = INK, glow = null } = {}) {
  const g = new THREE.Group();
  if (glow) {
    add(g, sph(r, 16, 10), basic(glow), 0, 0, 0, { shadow: false });
    add(g, sph(r * 0.3, 8, 6), basic(0xffffff), r * 0.3, r * 0.3, r * 0.78, { shadow: false });
    return g;
  }
  add(g, sph(r * 1.13, 12, 8), hullMat, 0, 0, 0, { shadow: false });
  add(g, sph(r, 14, 10), basic(0xffffff), 0, 0, 0, { shadow: false });
  const cap = (rr, theta, color) => add(g, new THREE.SphereGeometry(rr, 14, 4, 0, Math.PI * 2, 0, theta), basic(color), 0, 0, 0, { rx: Math.PI / 2, shadow: false });
  if (iris) cap(r * 1.012, 0.72, iris);
  cap(r * 1.024, iris ? 0.4 : 0.55, pupil);
  add(g, sph(r * 0.21, 8, 6), basic(0xffffff), r * 0.3, r * 0.32, r * 0.92, { shadow: false });
  add(g, sph(r * 0.1, 6, 4), basic(0xffffff), -r * 0.22, -r * 0.24, r * 0.97, { shadow: false });
  return g;
}

// A face that hugs the front of a sphere of radius R centred on the group's origin.
function makeFace(R, o = {}) {
  const {
    eyeR = R * 0.2, gap = R * 0.36, eyeY = R * 0.06, iris = null, pupil = INK, glow = null,
    brows = null, browColor = INK, mouth = 'smile', mouthY = -R * 0.34, mouthW = R * 0.15,
    cheeks = false, cheekColor = 0xff8fa3,
  } = o;
  const g = new THREE.Group();
  const surf = (x, y) => Math.sqrt(Math.max(0.0001, R * R - x * x - y * y));
  const eyePair = group(g, 0, eyeY, 0);
  for (const s of [-1, 1]) {
    const x = s * gap;
    const e = makeEye(eyeR, { iris, pupil, glow });
    e.position.set(x, 0, surf(x, eyeY) - eyeR * 0.4);
    e.rotation.set(-Math.asin(eyeY / R) * 0.7, Math.asin(x / R) * 0.7, 0);
    eyePair.add(e);
    if (brows) {
      const by = eyeY + eyeR * (brows === 'bushy' ? 1.35 : 1.5);
      const bx = x * 1.04;
      const bushy = brows === 'bushy';
      const b = add(g, new THREE.CapsuleGeometry(eyeR * (bushy ? 0.32 : 0.2), eyeR * (bushy ? 1.3 : 1.05), 4, 8),
        bushy ? mat(browColor) : basic(browColor), bx, by, surf(bx, by) + (bushy ? -0.01 : 0.004), { shadow: false, noOutline: true });
      const tilt = brows === 'angry' ? 0.5 : brows === 'worried' ? -0.4 : brows === 'happy' ? -0.18 : 0;
      b.rotation.set(-Math.asin(by / R) * 0.7, Math.asin(bx / R) * 0.7, Math.PI / 2 + s * tilt);
    }
    if (cheeks) {
      const cx = x * 1.3, cy = eyeY - eyeR * 1.4;
      add(g, sph(eyeR * 0.6, 12, 8), basic(cheekColor), cx, cy, surf(cx, cy) - eyeR * 0.12,
        { s: [1, 0.62, 0.3], ry: Math.asin(cx / R), shadow: false });
    }
  }
  const mz = surf(0, mouthY) + 0.004;
  const pitch = Math.asin(-mouthY / R);
  const dark = basic(0x3a0c1c);
  const white = basic(0xffffff);
  const o2 = { rx: pitch, shadow: false };
  switch (mouth) {
    case 'smile':
      add(g, new THREE.TorusGeometry(mouthW, mouthW * 0.2, 6, 16, Math.PI), basic(INK), 0, mouthY + mouthW * 0.35, mz + mouthW * 0.12, { rx: pitch, rz: Math.PI, shadow: false });
      break;
    case 'frown':
      add(g, new THREE.TorusGeometry(mouthW, mouthW * 0.2, 6, 16, Math.PI), basic(INK), 0, mouthY - mouthW * 0.4, mz + mouthW * 0.12, o2);
      break;
    case 'open':
      add(g, new THREE.CircleGeometry(mouthW, 18, Math.PI, Math.PI), dark, 0, mouthY + mouthW * 0.4, mz + 0.01, o2);
      add(g, new THREE.CircleGeometry(mouthW * 0.55, 14, Math.PI, Math.PI), basic(0xff6a8a), 0, mouthY - mouthW * 0.05, mz + 0.013, o2);
      break;
    case 'grin': {
      const w = mouthW * 1.3;
      add(g, new THREE.CircleGeometry(w, 20, Math.PI, Math.PI), dark, 0, mouthY + w * 0.4, mz + 0.01, o2);
      for (let k = -1.5; k <= 1.5; k++) {
        add(g, new THREE.ConeGeometry(w * 0.15, w * 0.34, 3), white, k * w * 0.42, mouthY + w * 0.4 - w * 0.16, mz + 0.018, { rx: Math.PI + pitch, shadow: false });
      }
      break;
    }
    case 'fangs':
      add(g, new THREE.TorusGeometry(mouthW, mouthW * 0.2, 6, 16, Math.PI), basic(INK), 0, mouthY + mouthW * 0.35, mz + mouthW * 0.12, { rx: pitch, rz: Math.PI, shadow: false });
      for (const s of [-1, 1]) add(g, new THREE.ConeGeometry(mouthW * 0.2, mouthW * 0.5, 4), white, s * mouthW * 0.55, mouthY - mouthW * 0.25, mz + mouthW * 0.1, { rx: Math.PI + pitch, shadow: false });
      break;
    case 'o':
      add(g, sph(mouthW * 0.6, 12, 8), dark, 0, mouthY, mz - mouthW * 0.1, { s: [0.8, 1, 0.35], rx: pitch, shadow: false });
      break;
    case 'flat':
      add(g, new THREE.CapsuleGeometry(mouthW * 0.14, mouthW * 1.2, 4, 8), basic(INK), 0, mouthY, mz, { rx: pitch, rz: Math.PI / 2, shadow: false });
      break;
  }
  optimize(eyePair, true);
  g.userData.eyes = [eyePair];
  return g;
}

// Blinks every few seconds.
function blinker(eyes) {
  let next = rnd(0.5, 3.5);
  return (t) => {
    if (t < next - 10) next = t + rnd(1, 3); // clock went backwards
    const phase = t - next;
    let s = 1;
    if (phase > 0 && phase < 0.13) s = 0.12;
    else if (phase >= 0.13) next = t + rnd(1.8, 5);
    for (const e of eyes) e.scale.y = s;
  };
}

// A doorway / window shape: a rectangle with a round top, extruded forward.
function archGeo(w, h, depth) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h - w / 2);
  s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false);
  s.lineTo(-w / 2, 0);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 14 });
}

// A zig-zag lightning bolt.
function boltGeo(size = 1) {
  const s = new THREE.Shape();
  const p = [[0, 0], [0.09, 0.2], [0.03, 0.2], [0.12, 0.44], [-0.02, 0.2], [0.04, 0.2], [-0.05, 0]];
  s.moveTo(p[0][0] * size, p[0][1] * size);
  for (const [x, y] of p.slice(1)) s.lineTo(x * size, y * size);
  return new THREE.ExtrudeGeometry(s, { depth: 0.04 * size, bevelEnabled: false });
}

function batWingGeo(w = 0.7, h = 0.5) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(w * 0.45, h * 0.55);
  s.lineTo(w, h * 0.38);
  s.quadraticCurveTo(w * 0.86, h * 0.05, w * 0.9, -h * 0.28);
  s.quadraticCurveTo(w * 0.72, -h * 0.1, w * 0.62, -h * 0.42);
  s.quadraticCurveTo(w * 0.46, -h * 0.16, w * 0.32, -h * 0.46);
  s.quadraticCurveTo(w * 0.2, -h * 0.16, 0, -h * 0.22);
  s.lineTo(0, 0);
  return new THREE.ShapeGeometry(s, 8);
}

// A flame: three nested cones in one mesh (vertex colours) that flickers.
const flameGeos = new Map();
const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true });
function flameGeo(colors) {
  const key = colors.join(',');
  if (!flameGeos.has(key)) {
    const items = colors.map((c, i) => {
      const cone = new THREE.ConeGeometry(0.16 * (1 - i * 0.28), 0.5 * (1 - i * 0.2), 8);
      cone.translate(0, 0.25 * (1 - i * 0.2) + i * 0.02, i * 0.035);
      return { geo: cone, matrix: new THREE.Matrix4() };
    });
    const geo = mergeGeometries(items);
    const col = new Float32Array(geo.attributes.position.count * 3);
    let o = 0;
    items.forEach(({ geo: cone }, i) => {
      const c = new THREE.Color(colors[i]);
      const n = cone.index ? cone.index.count : cone.attributes.position.count;
      for (let k = 0; k < n; k++, o++) col.set([c.r, c.g, c.b], o * 3);
    });
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    flameGeos.set(key, geo);
  }
  return flameGeos.get(key);
}
function flame(parent, x, y, z, size = 1, colors = [0xff4a10, 0xffa020, 0xffe680]) {
  const f = group(parent, x, y, z);
  const m = dyn(add(f, flameGeo(colors), flameMat, 0, 0, 0, { shadow: false, noOutline: true, s: size }));
  f.userData.flicker = (t) => m.scale.set(size * (1 + Math.sin(t * 17 + x * 3) * 0.08), size * (1 + Math.sin(t * 13 + z * 3) * 0.2), size);
  return f;
}

// ---------------------------------------------------------------- wizards

export function makeWizard(o = {}) {
  const {
    robe = 0x3355ff, hat = robe, trim = 0xf2c14e, skin = 0xf6cfae, hair = 0x6b4226, gem = trim,
    eyeColor = 0x3a6ea5, beard = false, glasses = false, goggles = false, backpack = false,
    hatStyle = 'wizard', tip = gem,
  } = o;
  const g = new THREE.Group();
  const body = group(g);
  const robeM = mat(robe), trimM = mat(trim), skinM = mat(skin), hairM = mat(hair), hatM = mat(hat);

  // robe, trim, belt, collar
  const profile = [[0, 0], [0.74, 0], [0.79, 0.07], [0.69, 0.3], [0.53, 0.68], [0.41, 1.0], [0.44, 1.2], [0.41, 1.38], [0.28, 1.52], [0.13, 1.6], [0, 1.62]];
  add(body, new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 20), robeM);
  add(body, new THREE.TorusGeometry(0.755, 0.05, 6, 24), trimM, 0, 0.07, 0, { rx: Math.PI / 2 });
  add(body, new THREE.TorusGeometry(0.42, 0.06, 6, 24), mat(0x4a2e1f), 0, 1.0, 0, { rx: Math.PI / 2 });
  add(body, new THREE.BoxGeometry(0.17, 0.15, 0.07), mat(0xf2c14e), 0, 1.0, 0.47);
  add(body, new THREE.TorusGeometry(0.25, 0.08, 6, 22), trimM, 0, 1.5, 0, { rx: Math.PI / 2 });
  add(body, sph(0.04, 10, 8), trimM, 0, 1.2, 0.45);
  add(body, sph(0.04, 10, 8), trimM, 0, 1.32, 0.43);
  for (const s of [-1, 1]) add(body, sph(0.16), mat(0x3a2418), s * 0.22, 0.08, 0.72, { s: [1, 0.6, 1.45] });

  // arms with bell sleeves
  const makeArm = (side, hand) => {
    const sh = V3(side * 0.36, 1.38, 0.02);
    const grp = group(body, sh.x, sh.y, sh.z);
    const rel = hand.clone().sub(sh);
    const wrist = rel.clone().multiplyScalar(0.8);
    limb(grp, V3(), wrist, 0.11, 0.2, robeM);
    const cuff = add(grp, new THREE.TorusGeometry(0.19, 0.045, 6, 20), trimM, wrist.x, wrist.y, wrist.z);
    cuff.quaternion.setFromUnitVectors(FWD, wrist.clone().normalize());
    add(grp, sph(0.12, 14, 10), skinM, rel.x, rel.y, rel.z);
    return { grp, rel };
  };
  const armL = makeArm(-1, V3(-0.6, 0.93, 0.2));
  const armR = makeArm(1, V3(0.74, 0.98, 0.3));

  // staff with a curled head cradling a glowing gem
  const staff = group(armR.grp, armR.rel.x, armR.rel.y, armR.rel.z);
  const wood = mat(0x7a5230);
  add(staff, new THREE.CylinderGeometry(0.04, 0.05, 2.02, 8), wood, 0, 0.02, 0);
  add(staff, new THREE.TorusGeometry(0.052, 0.02, 6, 12), mat(0x5a3a20), 0, 0.42, 0, { rx: Math.PI / 2 });
  add(staff, new THREE.TorusGeometry(0.14, 0.042, 6, 20, Math.PI * 1.5), wood, 0, 1.16, 0, { rz: -Math.PI * 0.25 });
  const gemMesh = dyn(add(staff, new THREE.OctahedronGeometry(0.14, 0), glowMat(gem, 2.2), 0, 1.16, 0));
  const sparks = [0, 1].map(() => dyn(add(staff, new THREE.OctahedronGeometry(0.045), basic(lighter(gem, 0.5)), 0, 1.16, 0, { shadow: false })));

  // head
  const head = group(body, 0, 1.97, 0.03);
  const R = 0.43;
  add(head, sph(R, 16, 10), skinM);
  for (const s of [-1, 1]) add(head, sph(0.1, 12, 10), skinM, s * 0.41, -0.02, -0.02, { s: [0.55, 1, 0.8] });
  add(head, sph(0.055, 12, 10), mat(darker(skin, 0.93)), 0, -0.07, R - 0.01);
  const face = makeFace(R, {
    eyeR: 0.095, gap: 0.155, eyeY: 0.02, iris: eyeColor,
    brows: beard ? 'bushy' : 'happy', browColor: beard ? 0xf4f4f4 : darker(hair, 0.75),
    mouth: beard ? 'none' : 'smile', mouthY: -0.17, mouthW: 0.065, cheeks: true,
  });
  head.add(face);

  // hair
  if (hatStyle !== 'helmet') {
    if (hatStyle !== 'hood') add(head, sph(R * 1.04, 16, 10), hairM, 0, 0.04, -0.08, { s: [1.02, 0.95, 0.95] });
    for (const [x, y, z, r] of [[-0.2, 0.27, 0.3, 0.13], [0.0, 0.31, 0.31, 0.14], [0.2, 0.27, 0.3, 0.13]]) add(head, sph(r, 14, 10), hairM, x, y, z);
    for (const s of [-1, 1]) add(head, sph(0.13, 14, 10), hairM, s * 0.37, -0.1, -0.04, { s: [0.75, 1.35, 0.9] });
  }

  // headwear
  const joints = [];
  if (hatStyle === 'wizard') {
    const hatG = group(head, 0, 0.31, -0.03);
    hatG.rotation.set(-0.12, 0, 0.07);
    add(hatG, new THREE.CylinderGeometry(0.62, 0.86, 0.08, 18), hatM);
    add(hatG, new THREE.CylinderGeometry(0.43, 0.45, 0.15, 18), trimM, 0, 0.1, 0);
    add(hatG, new THREE.OctahedronGeometry(0.08), glowMat(tip, 1.4), 0, 0.1, 0.46, { s: [1, 1.2, 0.45] });
    add(hatG, new THREE.CylinderGeometry(0.27, 0.44, 0.58, 18), hatM, 0, 0.33, 0);
    const j1 = group(hatG, 0, 0.6, 0);
    add(j1, new THREE.CylinderGeometry(0.14, 0.27, 0.46, 18), hatM, 0, 0.22, 0);
    const j2 = group(j1, 0, 0.44, 0);
    add(j2, new THREE.ConeGeometry(0.14, 0.4, 20), hatM, 0, 0.19, 0);
    add(j2, new THREE.OctahedronGeometry(0.08), glowMat(tip, 2), 0, 0.43, 0);
    joints.push(j1, j2);
    if (goggles) {
      for (const s of [-1, 1]) {
        add(hatG, new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), mat(0xc9a24a), s * 0.12, 0.13, 0.42, { rx: Math.PI / 2 });
        add(hatG, new THREE.CircleGeometry(0.06, 16), basic(0x9fe6ff), s * 0.12, 0.13, 0.465, { shadow: false });
      }
    }
  } else if (hatStyle === 'helmet') {
    const steel = mat(hat);
    add(head, new THREE.SphereGeometry(R * 1.1, 20, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), steel, 0, 0.03, 0);
    add(head, new THREE.TorusGeometry(0.46, 0.045, 6, 24), trimM, 0, 0.15, 0, { rx: Math.PI / 2 });
    add(head, new THREE.BoxGeometry(0.07, 0.24, 0.06), steel, 0, 0.1, R + 0.04);
    const plumeM = mat(0xc0392b);
    add(head, sph(0.13, 12, 10), plumeM, 0, 0.52, 0.02, { s: [0.55, 1, 1.3] });
    add(head, sph(0.12, 12, 10), plumeM, 0, 0.52, -0.2, { s: [0.55, 1, 1.3] });
    add(head, sph(0.1, 12, 10), plumeM, 0, 0.44, -0.38, { s: [0.55, 1, 1.3] });
  } else if (hatStyle === 'hood') {
    // an open-fronted cowl: outer shell, darker lining, and a floppy point at the back
    const open = 0.8;
    const shell = (r, material) => new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12, Math.PI / 2 + open, Math.PI * 2 - open * 2, 0, Math.PI * 0.74), material);
    const outer = shell(0.53, hatM);
    const lining = shell(0.5, mat(darker(hat, 0.5), { side: THREE.BackSide }));
    for (const m of [outer, lining]) { m.position.set(0, 0.07, -0.05); m.castShadow = true; head.add(m); }
    lining.userData.noOutline = true;
    add(head, new THREE.ConeGeometry(0.2, 0.6, 16), hatM, 0, 0.3, -0.55, { rx: -2.1 });
    add(head, sph(0.1, 12, 10), trimM, 0, 0.02, -0.82);
  }

  if (glasses) {
    const frame = basic(0x3a2418);
    for (const s of [-1, 1]) add(head, new THREE.TorusGeometry(0.118, 0.014, 6, 20), frame, s * 0.155, 0.02, 0.47, { shadow: false });
    add(head, new THREE.BoxGeometry(0.08, 0.016, 0.016), frame, 0, 0.04, 0.47, { shadow: false });
  }
  if (beard) {
    const bm = mat(0xf2f2f2);
    add(head, new THREE.ConeGeometry(0.3, 0.85, 20), bm, 0, -0.52, 0.24, { rx: Math.PI + 0.3 });
    add(head, sph(0.22, 16, 10), bm, 0, -0.26, 0.3, { s: [1.3, 0.9, 0.8] });
    for (const s of [-1, 1]) add(head, sph(0.1, 12, 10), bm, s * 0.1, -0.14, R - 0.02, { s: [1.5, 0.65, 0.8], rz: s * 0.35 });
  }
  if (o.quiver) {
    const q = group(body, 0.2, 1.3, -0.42);
    q.rotation.set(0.25, 0, -0.45);
    add(q, new THREE.CylinderGeometry(0.13, 0.11, 0.8, 12), mat(0x6b4a2b));
    add(q, new THREE.TorusGeometry(0.13, 0.03, 6, 14), trimM, 0, 0.38, 0, { rx: Math.PI / 2 });
    for (const [x, z] of [[-0.05, 0.02], [0.05, -0.03], [0, 0.05]]) {
      add(q, new THREE.CylinderGeometry(0.015, 0.015, 0.5, 5), mat(0xd8c090), x, 0.55, z);
      add(q, new THREE.ConeGeometry(0.05, 0.14, 3), mat(0xc0392b), x, 0.82, z);
    }
  }
  // cloak: a curved cape behind the shoulders
  let capeMesh = null;
  if (o.cape != null) {
    capeMesh = dyn(add(body, new THREE.CylinderGeometry(0.46, 0.82, 1.4, 14, 1, true, Math.PI * 0.62, Math.PI * 0.76), mat(o.cape, { side: THREE.DoubleSide }), 0, 0.78, -0.02, { noOutline: true }));
    add(body, new THREE.TorusGeometry(0.3, 0.05, 6, 16, Math.PI), mat(darker(o.cape, 0.7)), 0, 1.47, -0.02, { rx: Math.PI / 2, rz: Math.PI });
  }
  // offhand: a glowing orb or tome floating by the left hand
  let orbMesh = null;
  if (o.orb != null) {
    orbMesh = dyn(add(armL.grp, new THREE.OctahedronGeometry(0.14, 1), glowMat(o.orb, 1.6), armL.rel.x - 0.08, armL.rel.y + 0.35, armL.rel.z + 0.15, { shadow: false }));
  }
  if (backpack) {
    const bp = group(body, 0, 1.15, -0.46);
    add(bp, new THREE.BoxGeometry(0.66, 0.78, 0.4), mat(0x7a5230));
    add(bp, new THREE.BoxGeometry(0.68, 0.28, 0.42), mat(0x5a3a20), 0, 0.3, 0.01);
    add(bp, new THREE.CylinderGeometry(0.14, 0.14, 0.8, 14), mat(0xa0346a), 0, 0.52, -0.02, { rz: Math.PI / 2 });
    add(bp, sph(0.13), mat(0x3a3a44), 0.42, -0.15, 0);
    add(bp, new THREE.CylinderGeometry(0.07, 0.07, 0.16, 8), glowMat(0xffc86b, 2), -0.42, -0.1, 0);
  }

  head.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
  const blink = blinker(face.userData.eyes);
  g.userData = {
    body, head, gem: gemMesh,
    anim(t, moving) {
      blink(t);
      const w = Math.sin(t * 10);
      body.position.y = moving ? Math.abs(w) * 0.1 : 0;
      body.rotation.x = moving ? 0.07 : 0;
      body.rotation.z = moving ? w * 0.04 : Math.sin(t * 1.1) * 0.012;
      body.scale.y = moving ? 1 : 1 + Math.sin(t * 2.2) * 0.012;
      armL.grp.rotation.x = moving ? w * 0.55 : Math.sin(t * 2.2) * 0.05;
      armR.grp.rotation.x = moving ? -w * 0.2 : 0;
      head.rotation.y = moving ? 0 : Math.sin(t * 0.6) * 0.15;
      head.rotation.z = Math.sin(t * 1.3) * 0.035;
      if (joints.length) {
        joints[0].rotation.set(-0.32 + Math.sin(t * 2.4) * 0.05 - (moving ? 0.12 : 0), 0, 0.1 + Math.sin(t * 1.7) * 0.06);
        joints[1].rotation.set(-0.62 + Math.sin(t * 2.4 + 0.8) * 0.1 - (moving ? 0.2 : 0), 0, Math.sin(t * 1.7 + 0.5) * 0.1);
      }
      gemMesh.rotation.y = t * 2;
      if (capeMesh) capeMesh.rotation.x = moving ? -0.25 - Math.abs(w) * 0.1 : -0.04 + Math.sin(t * 1.5) * 0.03;
      if (orbMesh) { orbMesh.position.y = armL.rel.y + 0.35 + Math.sin(t * 2.5) * 0.06; orbMesh.rotation.y = t * 1.5; }
      sparks.forEach((s, i) => {
        const a = t * 3 + i * Math.PI;
        s.position.set(Math.cos(a) * 0.26, 1.16 + Math.sin(a * 1.5) * 0.1, Math.sin(a) * 0.26);
      });
    },
  };
  return finish(g, 0.026, 0.07);
}

// ---------------------------------------------------------------- Chapter 1 enemies

// A mischievous shadow bulb with leafy hair and a toothy grin.
function sprig() {
  const g = new THREE.Group();
  const body = group(g);
  const bulb = group(body, 0, 0.74, 0);
  const R = 0.56;
  add(bulb, sph(R, 16, 10), mat(0x3d2656), 0, 0, 0, { s: [1, 0.94, 1] });
  for (const [x, y, z] of [[-0.42, 0.18, -0.25], [0.38, -0.12, -0.32], [0.05, 0.3, -0.48], [-0.3, -0.3, -0.35]]) {
    add(bulb, sph(0.09, 10, 8), mat(0x7a4aa8), x, y, z, { s: [1, 1, 0.4] });
  }
  // faintly glowing spore freckles on its cheeks and back
  for (const [x, y, z, r] of [[-0.3, -0.05, 0.42, 0.045], [0.34, 0.12, 0.4, 0.035], [0.15, -0.32, 0.42, 0.04], [-0.1, 0.35, -0.42, 0.05]]) {
    add(bulb, sph(r, 8, 6), glowMat(0xb46bff, 1.5), x, y, z, { shadow: false });
  }
  const face = makeFace(R, { eyeR: 0.15, gap: 0.2, eyeY: 0.1, iris: 0xc07bff, brows: 'angry', browColor: 0x14081e, mouth: 'grin', mouthY: -0.16, mouthW: 0.14 });
  bulb.add(face);
  const crown = group(bulb, 0, R * 0.85, 0);
  const leaves = [[0, 0.75, 0x3e8a4c, 1], [2.1, 0.8, 0x2f7040, 1.35], [4.2, 0.7, 0x7a3aa0, 1], [1.05, 0.35, 0x4ea85c, 1]];
  for (const [a, tilt, c, big] of leaves) {
    const p = group(crown);
    p.rotation.set(tilt, a, 0, 'YXZ');
    add(p, sph(0.2 * big, 14, 10), mat(c), 0, 0.3 * big, 0, { s: [0.55, 1.5, 0.2] });
    if (big > 1) add(p, sph(0.05, 8, 6), glowMat(0xd08bff, 1.4), 0, 0.62 * big, 0, { shadow: false });
  }
  add(crown, new THREE.CylinderGeometry(0.03, 0.05, 0.35, 6), mat(0x2f5a34), 0, 0.15, 0);
  const bud = dyn(add(crown, sph(0.1, 12, 10), glowMat(0xd08bff, 1.4), 0, 0.36, 0));
  const twig = mat(0x5a3a24);
  for (const s of [-1, 1]) {
    const hand = V3(s * 0.88, 0.95, 0.15);
    limb(body, V3(s * 0.5, 0.7, 0.05), hand, 0.05, 0.035, twig, 6);
    for (const k of [-1, 0, 1]) limb(body, hand, hand.clone().add(V3(s * 0.12, 0.08 + k * 0.08, k * 0.06)), 0.03, 0.015, twig, 5);
    add(body, sph(0.14, 12, 10), mat(0x4a3024), s * 0.24, 0.07, 0.14, { s: [1, 0.5, 1.4] });
  }
  const blink = blinker(face.userData.eyes);
  g.userData.anim = (t, moving) => {
    blink(t);
    const h = Math.abs(Math.sin(t * (moving ? 8 : 3.2)));
    body.position.y = h * (moving ? 0.35 : 0.1);
    const sq = 1 - (1 - h) * (moving ? 0.12 : 0.05);
    bulb.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    crown.rotation.z = Math.sin(t * 3) * 0.15;
    bud.scale.setScalar(1 + Math.sin(t * 4) * 0.15);
    body.rotation.y = Math.sin(t * 1.5) * 0.15;
  };
  return finish(g, 0.026, 0.07);
}

// A chubby, grumpy rat with a burning tail.
function rat() {
  const g = new THREE.Group();
  const body = group(g);
  const fur = mat(0x8c3b22), pale = mat(0xe8b07a);
  add(body, sph(0.55, 16, 10), fur, 0, 0.56, -0.05, { s: [0.95, 0.8, 1.2] });
  add(body, sph(0.45, 16, 10), pale, 0, 0.44, 0.18, { s: [0.8, 0.65, 1] });
  for (const [x, z] of [[-0.3, 0.42], [0.3, 0.42], [-0.32, -0.42], [0.32, -0.42]]) add(body, sph(0.11), mat(0xd08070), x, 0.08, z, { s: [1, 0.6, 1.35] });
  const head = group(body, 0, 0.88, 0.62);
  add(head, sph(0.4, 16, 10), fur);
  for (const s of [-1, 1]) add(head, sph(0.17), pale, s * 0.22, -0.12, 0.14);
  const snout = dyn(add(head, sph(0.2, 16, 10), pale, 0, -0.11, 0.33, { s: [1, 0.8, 1.2] }));
  const nose = dyn(add(head, sph(0.07, 12, 10), mat(0xff6a8a), 0, -0.05, 0.56));
  const face = makeFace(0.4, { eyeR: 0.1, gap: 0.15, eyeY: 0.09, iris: 0xffb020, brows: 'angry', browColor: 0x3a1a10, mouth: 'none' });
  head.add(face);
  for (const s of [-1, 1]) add(head, new THREE.BoxGeometry(0.06, 0.09, 0.03), basic(0xffffff), s * 0.033, -0.25, 0.5, { shadow: false });
  const whisk = basic(0x3a1a10);
  for (const s of [-1, 1]) for (const k of [-1, 1]) limb(head, V3(s * 0.13, -0.12, 0.48), V3(s * 0.46, -0.1 + k * 0.07, 0.4), 0.007, 0.004, whisk, 4);
  const ears = [];
  for (const s of [-1, 1]) {
    const p = group(head, s * 0.27, 0.3, -0.05);
    p.rotation.z = -s * 0.35;
    add(p, new THREE.CylinderGeometry(0.21, 0.21, 0.05, 18), fur, 0, 0.12, 0, { rx: Math.PI / 2 });
    add(p, new THREE.CylinderGeometry(0.13, 0.13, 0.02, 16), mat(0xff9aa8), 0, 0.12, 0.03, { rx: Math.PI / 2 });
    ears.push(p);
  }
  for (const [y, z] of [[1.0, 0.15], [1.02, -0.15], [0.98, -0.45]]) add(body, new THREE.ConeGeometry(0.08, 0.26, 5), glowMat(0xff8a2b, 2.2), 0, y, z, { shadow: false });
  // ember-cracked hide: glowing seams along the flanks
  for (const s of [-1, 1]) for (const [z, rz] of [[0.28, 0.3], [-0.05, -0.25], [-0.38, 0.35]]) {
    add(body, new THREE.BoxGeometry(0.03, 0.22, 0.05), basic(0xff8a2a), s * 0.5, 0.62, z, { rz: s * rz, rx: 0.2, shadow: false, noOutline: true });
  }
  const tail = group(body, 0, 0.5, -0.62);
  tube(tail, [[0, 0, 0], [0, 0.1, -0.35], [0.1, 0.4, -0.6], [0.05, 0.75, -0.55]], 0.05, mat(0xc07060));
  const fire = flame(tail, 0.05, 0.75, -0.55, 1.1);
  const blink = blinker(face.userData.eyes);
  g.userData.anim = (t, moving) => {
    blink(t);
    body.position.y = moving ? Math.abs(Math.sin(t * 14)) * 0.1 : Math.sin(t * 2.5) * 0.015;
    head.rotation.x = Math.sin(t * 1.7) * 0.06;
    nose.scale.setScalar(1 + Math.max(0, Math.sin(t * 9)) * 0.2);
    snout.rotation.y = Math.sin(t * 9) * 0.04;
    tail.rotation.z = Math.sin(t * 3) * 0.25;
    ears.forEach((e, i) => { e.rotation.x = Math.sin(t * 5 + i) * 0.1; });
    fire.userData.flicker(t);
  };
  return finish(g, 0.026, 0.07);
}

// A shy little ice ghost with an icicle crown.
function wisp() {
  const g = new THREE.Group();
  const body = group(g);
  const ice = mat(0xcaf2ff, { emissive: 0x3aa8ff, emissiveIntensity: 0.3 });
  const head = group(body, 0, 1.5, 0);
  add(head, sph(0.55, 16, 10), ice);
  const tail = group(body, 0, 1.2, -0.05);
  const tails = [[0.42, 0, -0.18, -0.05], [0.3, 0, -0.5, -0.2], [0.19, 0, -0.74, -0.38], [0.1, 0, -0.9, -0.52]].map(([r, x, y, z]) => dyn(add(tail, sph(r, 16, 10), ice, x, y, z)));
  const face = makeFace(0.55, { eyeR: 0.15, gap: 0.2, eyeY: 0.02, iris: 0x2a7ad0, brows: 'worried', browColor: 0x2a5a8a, mouth: 'o', mouthY: -0.2, mouthW: 0.1, cheeks: true, cheekColor: 0x8fd0ff });
  head.add(face);
  const crown = group(head, 0, 0.42, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const c = add(crown, new THREE.ConeGeometry(0.07, i % 2 ? 0.26 : 0.36, 6), glowMat(0xe8fbff, 0.9), Math.cos(a) * 0.26, 0.12, Math.sin(a) * 0.26);
    c.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35);
  }
  const arms = [-1, 1].map(s => dyn(add(head, sph(0.14, 14, 10), ice, s * 0.55, -0.2, 0.1, { s: [0.7, 1, 0.7] })));
  const flakes = [];
  for (let i = 0; i < 4; i++) flakes.push(dyn(add(body, new THREE.OctahedronGeometry(0.07), basic(0xffffff), 0, 1.5, 0, { shadow: false })));
  const blink = blinker(face.userData.eyes);
  g.userData.anim = (t) => {
    blink(t);
    body.position.y = Math.sin(t * 2) * 0.18;
    tail.rotation.z = Math.sin(t * 2.4) * 0.25;
    tail.rotation.x = Math.sin(t * 1.7) * 0.15;
    tails.forEach((s, i) => { s.position.x = Math.sin(t * 3 - i * 0.8) * 0.06 * i; });
    arms.forEach((a, i) => { a.position.y = -0.2 + Math.sin(t * 3 + i * Math.PI) * 0.06; });
    crown.rotation.y = t * 0.6;
    flakes.forEach((f, i) => {
      const a = t * 1.6 + (i / 4) * Math.PI * 2;
      f.position.set(Math.cos(a) * 0.95, 1.4 + Math.sin(a * 2) * 0.3, Math.sin(a) * 0.95);
      f.rotation.set(t * 2, t * 3, 0);
    });
  };
  return finish(g, 0.026, 0.07);
}

// Chunky enchanted armour; `boss` makes it Lord Hollowmere.
function knight({ armor = 0x707894, dark = 0x2d2a3a, accent = 0x9a2a3a, eye = 0x7de0ff, boss = false } = {}) {
  const g = new THREE.Group();
  const body = group(g);
  const A = mat(armor), D = mat(dark), acc = mat(accent), lite = mat(lighter(armor, 0.25));
  const legs = [-1, 1].map(s => {
    const leg = group(body, s * 0.23, 0.78, 0);
    limb(leg, V3(), V3(0.01 * s, -0.58, 0), 0.14, 0.12, D);
    add(leg, sph(0.18, 14, 10), A, 0, -0.66, 0.06, { s: [1, 0.62, 1.45] });
    add(leg, sph(0.13, 12, 10), A, 0, -0.3, 0.1, { s: [1, 1, 0.7] });
    return leg;
  });
  add(body, new THREE.CylinderGeometry(0.44, 0.52, 0.38, 18), D, 0, 0.88, 0);
  add(body, new THREE.TorusGeometry(0.46, 0.05, 6, 24), boss ? mat(0xf2c14e) : A, 0, 1.04, 0, { rx: Math.PI / 2 });
  add(body, sph(0.56, 16, 10), A, 0, 1.4, 0, { s: [1, 1.05, 0.82] });
  add(body, sph(0.46, 16, 10), lite, 0, 1.44, 0.14, { s: [0.9, 0.95, 0.72] });
  add(body, new THREE.OctahedronGeometry(0.11), glowMat(boss ? 0xc542ff : accent, 1.8), 0, 1.5, 0.48, { s: [1, 1.3, 0.5] });
  add(body, sph(0.24, 14, 10), basic(0x0a0414), 0, 1.9, 0);
  for (const s of [-1, 1]) {
    add(body, new THREE.SphereGeometry(0.32, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), A, s * 0.58, 1.72, 0, { rz: -s * 0.4 });
    add(body, new THREE.TorusGeometry(0.31, 0.04, 6, 22), boss ? mat(0xf2c14e) : D, s * 0.58, 1.72, 0, { rx: Math.PI / 2, ry: -s * 0.4 });
    if (boss) for (let k = 0; k < 3; k++) add(body, new THREE.ConeGeometry(0.06, 0.3, 5), mat(0xf2c14e), s * (0.5 + k * 0.1), 1.95 - k * 0.04, -0.1 + k * 0.1, { rz: -s * 0.5 });
  }
  // helmet with glowing eyes in the dark
  const helm = group(body, 0, 2.16, 0);
  add(helm, new THREE.CylinderGeometry(0.35, 0.38, 0.6, 18), A);
  add(helm, new THREE.SphereGeometry(0.35, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), A, 0, 0.3, 0);
  add(helm, new THREE.BoxGeometry(0.52, 0.1, 0.12), basic(0x0a0414), 0, 0.02, 0.33, { shadow: false });
  add(helm, new THREE.BoxGeometry(0.1, 0.3, 0.1), basic(0x0a0414), 0, -0.14, 0.34, { shadow: false });
  const eyes = [-1, 1].map(s => dyn(add(helm, sph(0.055, 10, 8), basic(eye), s * 0.12, 0.02, 0.37, { shadow: false })));
  if (boss) {
    add(helm, new THREE.TorusGeometry(0.34, 0.05, 6, 24), mat(0xf2c14e), 0, 0.42, 0, { rx: Math.PI / 2 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      add(helm, new THREE.ConeGeometry(0.065, 0.32, 5), mat(0xf2c14e), Math.cos(a) * 0.33, 0.6, Math.sin(a) * 0.33);
      add(helm, new THREE.OctahedronGeometry(0.05), glowMat(0xc542ff, 2.5), Math.cos(a) * 0.33, 0.78, Math.sin(a) * 0.33, { shadow: false });
    }
    // a tall front spike and swept-back horns: a crown that reads from across the lane
    add(helm, new THREE.ConeGeometry(0.09, 0.62, 5), mat(0xf2c14e), 0, 0.75, 0.26, { rx: 0.25 });
    add(helm, new THREE.OctahedronGeometry(0.075), glowMat(0xc542ff, 2.8), 0, 1.06, 0.33, { shadow: false });
    for (const s of [-1, 1]) {
      tube(helm, [[s * 0.3, 0.45, -0.05], [s * 0.52, 0.62, -0.18], [s * 0.6, 0.9, -0.4]], 0.055, mat(0xf2c14e), 10);
      add(helm, new THREE.ConeGeometry(0.05, 0.18, 5), mat(0xf2c14e), s * 0.6, 0.95, -0.43, { rx: -0.5, rz: -s * 0.3 });
    }
  } else {
    add(helm, new THREE.BoxGeometry(0.07, 0.3, 0.62), acc, 0, 0.58, -0.02);
  }
  // sword arm
  const armR = group(body, 0.62, 1.62, 0);
  limb(armR, V3(), V3(0.14, -0.58, 0.3), 0.12, 0.11, A);
  add(armR, sph(0.15, 14, 10), D, 0.14, -0.6, 0.32);
  const sword = group(armR, 0.14, -0.6, 0.32);
  sword.rotation.set(0.35, 0, -0.45);
  add(sword, new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), mat(0x4a2e1f), 0, -0.02, 0);
  add(sword, new THREE.BoxGeometry(0.38, 0.07, 0.08), boss ? mat(0xf2c14e) : D, 0, 0.14, 0);
  const bladeM = boss ? glowMat(0xa04dff, 1.5) : mat(0xd0d6e4);
  add(sword, new THREE.BoxGeometry(0.13, 1.25, 0.04), bladeM, 0, 0.8, 0);
  add(sword, new THREE.ConeGeometry(0.092, 0.22, 4), bladeM, 0, 1.53, 0, { ry: Math.PI / 4, s: [1, 1, 0.3] });
  // shield arm
  const armL = group(body, -0.62, 1.62, 0);
  limb(armL, V3(), V3(-0.12, -0.55, 0.3), 0.12, 0.11, A);
  add(armL, sph(0.15, 14, 10), D, -0.12, -0.57, 0.32);
  add(armL, new THREE.CylinderGeometry(0.44, 0.44, 0.08, 18), boss ? mat(0x3a2a5a) : mat(0x5a3a2a), -0.14, -0.55, 0.46, { rx: Math.PI / 2 });
  add(armL, new THREE.TorusGeometry(0.44, 0.05, 6, 24), boss ? mat(0xf2c14e) : A, -0.14, -0.55, 0.48);
  add(armL, new THREE.OctahedronGeometry(0.13), boss ? glowMat(0xc542ff, 1.8) : acc, -0.14, -0.55, 0.53, { s: [1, 1.3, 0.4] });
  // the boss wears a tattered royal cloak, cut into ragged points
  let capeGeo = new THREE.PlaneGeometry(0.95, 1.45, 1, 4);
  if (boss) {
    const s = new THREE.Shape();
    s.moveTo(-0.68, 0);
    s.lineTo(0.68, 0);
    s.lineTo(0.64, -1.3);
    s.lineTo(0.42, -1.05);
    s.lineTo(0.24, -1.62);
    s.lineTo(0, -1.2);
    s.lineTo(-0.26, -1.7);
    s.lineTo(-0.44, -1.1);
    s.lineTo(-0.66, -1.42);
    s.lineTo(-0.68, 0);
    capeGeo = new THREE.ShapeGeometry(s, 4);
  }
  const cape = dyn(add(body, capeGeo, mat(boss ? 0x4a1466 : 0x3a2440, { side: THREE.DoubleSide }), 0, boss ? 1.62 : 1.05, -0.44, { rx: 0.12 }));
  if (boss) add(body, new THREE.TorusGeometry(0.3, 0.045, 6, 18, Math.PI), mat(0xf2c14e), 0, 1.62, -0.42, { rx: Math.PI / 2, rz: Math.PI });
  // a ring of hollow magic that breathes under the boss's feet
  let aura = null;
  if (boss) {
    aura = dyn(add(g, new THREE.RingGeometry(0.9, 1.3, 28), new THREE.MeshBasicMaterial({ color: 0x8a3ae0, transparent: true, opacity: 0.4, side: THREE.DoubleSide }), 0, 0.06, 0, { rx: -Math.PI / 2, shadow: false, noOutline: true }));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      add(aura, new THREE.OctahedronGeometry(0.09), glowMat(0xc542ff, 2.2), Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1, { shadow: false, noOutline: true });
    }
  }
  const wisps = [];
  if (boss) for (let i = 0; i < 3; i++) wisps.push(flame(body, 0, 1.6, 0, 0.7, [0x7a2ad0, 0xc542ff, 0xf0c8ff]));
  g.userData.anim = (t, moving) => {
    const w = Math.sin(t * 7);
    body.position.y = moving ? Math.abs(w) * 0.08 : Math.sin(t * 1.6) * 0.02;
    legs.forEach((l, i) => { l.rotation.x = moving ? (i ? w : -w) * 0.4 : 0; });
    armR.rotation.x = moving ? -w * 0.2 : Math.sin(t * 1.5) * 0.12;
    armL.rotation.x = moving ? w * 0.2 : 0;
    helm.rotation.y = Math.sin(t * 0.8) * 0.12;
    cape.rotation.x = 0.12 + Math.sin(t * 2.5) * 0.08 + (moving ? 0.25 : 0);
    const glow = 1 + Math.sin(t * 5) * 0.2;
    eyes.forEach(e => e.scale.setScalar(glow));
    wisps.forEach((f, i) => {
      const a = t * 1.2 + (i / 3) * Math.PI * 2;
      f.position.set(Math.cos(a) * 1.25, 1.5 + Math.sin(t * 2 + i) * 0.25, Math.sin(a) * 1.25);
      f.userData.flicker(t);
    });
    if (aura) {
      const p = 1 + Math.sin(t * 2.2) * 0.1;
      aura.scale.set(p, p, 1);
      aura.rotation.z = t * 0.5;
      aura.material.opacity = 0.3 + Math.sin(t * 2.2) * 0.14;
    }
  };
  return finish(g, 0.028, 0.07);
}

// A round, cranky storm bird with a lightning crest.
function crow() {
  const g = new THREE.Group();
  const body = group(g, 0, 1.45, 0);
  const feather = mat(0x2c2a4c), belly = mat(0x5c5a92), tipM = mat(0x8a5ad0);
  add(body, sph(0.52, 16, 10), feather);
  add(body, sph(0.4, 16, 10), belly, 0, -0.12, 0.2, { s: [1, 1, 0.8] });
  const face = makeFace(0.52, { eyeR: 0.14, gap: 0.2, eyeY: 0.12, iris: 0xffd23d, brows: 'angry', browColor: 0x120a24, mouth: 'none' });
  body.add(face);
  add(body, new THREE.ConeGeometry(0.12, 0.36, 4), mat(0xffa020), 0, -0.05, 0.62, { rx: Math.PI / 2, ry: Math.PI / 4 });
  add(body, new THREE.ConeGeometry(0.07, 0.2, 4), mat(0xd07010), 0, -0.13, 0.55, { rx: Math.PI / 2 + 0.3, ry: Math.PI / 4 });
  const bolt = glowMat(0xffe14d, 2);
  const crest = group(body, 0, 0.42, -0.02);
  for (const [x, rz, sz] of [[-0.13, 0.55, 0.8], [0, 0.05, 1.05], [0.13, -0.45, 0.8]]) {
    const b = add(crest, boltGeo(sz), bolt, x, 0, -0.02, { rz });
    b.userData.noOutline = false;
  }
  // wings: a fan of long flat feathers, dark near the body and purple at the tips
  const wings = [-1, 1].map(s => {
    const p = group(body, s * 0.4, 0.1, -0.05);
    for (let k = 0; k < 4; k++) {
      const ang = -s * (1.35 + k * 0.32);
      const len = 0.62 - k * 0.07;
      const dir = V3(-Math.sin(ang), Math.cos(ang), 0);
      const f = add(p, sph(0.2, 14, 10), k < 2 ? feather : tipM, dir.x * len * 0.5, dir.y * len * 0.5, -k * 0.04, { s: [0.42, len / 0.4, 0.16], rz: ang });
      f.renderOrder = k;
    }
    return { p, s };
  });
  for (let k = -1; k <= 1; k++) add(body, new THREE.CapsuleGeometry(0.07, 0.35, 4, 8), k ? feather : tipM, k * 0.1, -0.3, -0.5, { rx: -1.0, rz: k * 0.35 });
  // a little lightning bolt woven into the tail feathers
  add(body, boltGeo(0.55), bolt, 0.05, -0.42, -0.62, { rx: -2.6, rz: 0.5, shadow: false });
  for (const s of [-1, 1]) {
    limb(body, V3(s * 0.15, -0.45, 0.05), V3(s * 0.17, -0.8, 0.1), 0.025, 0.025, mat(0xffa020), 5);
    for (const k of [-1, 0, 1]) limb(body, V3(s * 0.17, -0.8, 0.1), V3(s * 0.17 + k * 0.07, -0.85, 0.22), 0.02, 0.015, mat(0xffa020), 4);
  }
  const sparks = [];
  for (let i = 0; i < 3; i++) sparks.push(dyn(add(body, new THREE.OctahedronGeometry(0.06), basic(0xfff27a), 0, 0, 0, { shadow: false })));
  const blink = blinker(face.userData.eyes);
  g.userData.anim = (t) => {
    blink(t);
    body.position.y = 1.45 + Math.sin(t * 3) * 0.15;
    body.rotation.z = Math.sin(t * 1.5) * 0.05;
    for (const w of wings) w.p.rotation.z = w.s * (Math.sin(t * 9) * 0.55 - 0.1);
    crest.scale.setScalar(1 + Math.sin(t * 12) * 0.06);
    sparks.forEach((s, i) => {
      const a = t * 4 + i * 2.1;
      s.visible = Math.sin(t * 7 + i * 3) > -0.2;
      s.position.set(Math.cos(a) * 0.75, 0.3 + Math.sin(a * 1.7) * 0.4, Math.sin(a) * 0.75);
    });
  };
  return finish(g, 0.026, 0.07);
}

// ---------------------------------------------------------------- Chapter 2 enemies

// A pot-bellied fire devil with a tiny trident.
function imp() {
  const g = new THREE.Group();
  const body = group(g, 0, 0.25, 0);
  const red = mat(0xd83a2a), tum = mat(0xffa06a), horn = mat(0x3a1a14);
  add(body, sph(0.44, 16, 10), red, 0, 0.82, 0, { s: [1, 1.05, 0.95] });
  add(body, sph(0.33, 16, 10), tum, 0, 0.76, 0.2, { s: [1, 1, 0.75] });
  const head = group(body, 0, 1.42, 0.02);
  add(head, sph(0.4, 16, 10), red);
  const face = makeFace(0.4, { eyeR: 0.13, gap: 0.16, eyeY: 0.06, iris: 0xffd23d, brows: 'angry', browColor: 0x2a0a08, mouth: 'grin', mouthY: -0.17, mouthW: 0.12 });
  head.add(face);
  for (const s of [-1, 1]) {
    tube(head, [[s * 0.2, 0.28, 0], [s * 0.32, 0.45, -0.02], [s * 0.3, 0.62, -0.1]], 0.05, horn, 10);
    add(head, new THREE.ConeGeometry(0.05, 0.14, 8), horn, s * 0.3, 0.66, -0.12, { rz: -s * 0.2, rx: -0.3 });
    add(head, new THREE.ConeGeometry(0.08, 0.28, 8), red, s * 0.44, 0.06, -0.02, { rz: -s * (Math.PI / 2 + 0.3) });
  }
  const wingM = mat(0x7a1a14, { side: THREE.DoubleSide });
  const wings = [-1, 1].map(s => {
    const p = group(body, s * 0.25, 1.05, -0.28);
    p.scale.x = s;
    add(p, batWingGeo(0.75, 0.55), wingM, 0, 0, 0);
    return { p, s };
  });
  const arms = [-1, 1].map(s => {
    const a = group(body, s * 0.38, 0.95, 0.05);
    limb(a, V3(), V3(s * 0.2, -0.28, 0.2), 0.07, 0.06, red, 8);
    add(a, sph(0.09, 12, 10), red, s * 0.2, -0.3, 0.22);
    return a;
  });
  const fork = group(arms[1], 0.2, -0.3, 0.22);
  add(fork, new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6), mat(0x3a2a2a), 0, 0.15, 0);
  for (const k of [-1, 0, 1]) add(fork, new THREE.ConeGeometry(0.035, 0.22, 6), glowMat(0xff8a2b, 1.8), k * 0.08, 0.82, 0, { rz: -k * 0.2 });
  add(fork, new THREE.BoxGeometry(0.22, 0.04, 0.04), mat(0x3a2a2a), 0, 0.72, 0);
  for (const s of [-1, 1]) {
    limb(body, V3(s * 0.18, 0.5, 0), V3(s * 0.2, 0.08, 0.03), 0.08, 0.07, red, 8);
    add(body, sph(0.1, 12, 10), horn, s * 0.2, 0.04, 0.08, { s: [1, 0.6, 1.3] });
  }
  const tail = group(body, 0, 0.62, -0.38);
  tube(tail, [[0, 0, 0], [0, -0.15, -0.3], [0.1, 0.05, -0.55], [0.05, 0.35, -0.6]], 0.04, red, 16);
  add(tail, new THREE.ConeGeometry(0.1, 0.22, 4), glowMat(0xff8a2b, 1.8), 0.05, 0.45, -0.6, { s: [1, 1, 0.4] });
  const blink = blinker(face.userData.eyes);
  g.userData.anim = (t, moving) => {
    blink(t);
    body.position.y = 0.25 + Math.sin(t * 5) * 0.12;
    body.rotation.x = moving ? 0.2 : 0;
    for (const w of wings) w.p.rotation.y = w.s * (0.45 + Math.sin(t * 14) * 0.45);
    tail.rotation.z = Math.sin(t * 4) * 0.35;
    head.rotation.z = Math.sin(t * 2) * 0.08;
    arms[0].rotation.x = Math.sin(t * 5) * 0.25;
    fork.rotation.x = Math.sin(t * 2.5) * 0.12;
  };
  return finish(g, 0.026, 0.07);
}

// A fiery hound with a burning mane and a spiked collar.
function hound() {
  const g = new THREE.Group();
  const body = group(g);
  const fur = mat(0x5a3e3a), pale = mat(0x8a6660);
  add(body, new THREE.CapsuleGeometry(0.37, 0.8, 8, 18), fur, 0, 0.95, -0.05, { rx: Math.PI / 2 });
  for (const s of [-1, 1]) for (const z of [0.25, -0.05, -0.35]) {
    add(body, new THREE.BoxGeometry(0.03, 0.3, 0.07), basic(0xff8a2a), s * 0.37, 1.0, z, { rz: s * 0.2, rx: 0.3, shadow: false, noOutline: true });
  }
  add(body, sph(0.4, 16, 10), pale, 0, 1.0, 0.45, { s: [1, 1, 0.8] });
  const head = group(body, 0, 1.38, 0.8);
  add(head, sph(0.34, 16, 10), fur);
  add(head, new THREE.CapsuleGeometry(0.15, 0.22, 6, 12), pale, 0, -0.1, 0.3, { rx: Math.PI / 2 });
  add(head, sph(0.075, 12, 10), mat(0x140a0a), 0, -0.04, 0.53);
  const face = makeFace(0.34, { eyeR: 0.1, gap: 0.14, eyeY: 0.1, iris: 0xff7a1a, brows: 'angry', browColor: 0xff6a1a, mouth: 'none' });
  head.add(face);
  for (const s of [-1, 1]) {
    add(head, new THREE.ConeGeometry(0.03, 0.1, 5), basic(0xffffff), s * 0.08, -0.25, 0.4, { rx: Math.PI, shadow: false });
    add(head, new THREE.ConeGeometry(0.11, 0.32, 8), fur, s * 0.2, 0.32, -0.05, { rz: -s * 0.3, rx: -0.2 });
    add(head, new THREE.ConeGeometry(0.06, 0.2, 8), glowMat(0xff6a1a, 1.5), s * 0.2, 0.32, -0.02, { rz: -s * 0.3, rx: -0.2 });
  }
  add(head, new THREE.TorusGeometry(0.28, 0.06, 6, 22), mat(0x8a1a1a), 0, -0.28, -0.12, { rx: Math.PI / 2 + 0.4 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    add(head, new THREE.ConeGeometry(0.035, 0.12, 5), mat(0xc0c0c8), Math.cos(a) * 0.3, -0.28 + Math.sin(a) * 0.1, -0.12 + Math.sin(a) * 0.26, { rx: Math.PI / 2 });
  }
  const legs = [[-0.24, 0.45], [0.24, 0.45], [-0.24, -0.5], [0.24, -0.5]].map(([x, z]) => {
    const l = group(body, x, 0.82, z);
    limb(l, V3(), V3(0, -0.7, 0.02), 0.11, 0.09, fur, 8);
    add(l, sph(0.12, 12, 10), pale, 0, -0.74, 0.06, { s: [1, 0.7, 1.3] });
    return l;
  });
  const mane = [];
  for (let i = 0; i < 7; i++) mane.push(flame(body, (i % 2 ? 0.08 : -0.08), 1.25 - i * 0.02, 0.6 - i * 0.18, 1.5 - i * 0.12));
  mane.forEach(m => { m.rotation.x = -0.6; });
  const tail = group(body, 0, 1.05, -0.62);
  tube(tail, [[0, 0, 0], [0, 0.2, -0.3], [0, 0.55, -0.4]], 0.06, fur, 12);
  const tailFire = flame(tail, 0, 0.55, -0.4, 1.2);
  const blink = blinker(face.userData.eyes);
  g.userData.anim = (t, moving) => {
    blink(t);
    const sp = moving ? 14 : 2;
    legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(t * sp + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.55 : 0; });
    body.position.y = moving ? Math.abs(Math.sin(t * sp)) * 0.1 : Math.sin(t * 2) * 0.02;
    head.rotation.x = Math.sin(t * 1.5) * 0.08;
    tail.rotation.z = Math.sin(t * (moving ? 12 : 6)) * 0.35;
    mane.forEach(m => m.userData.flicker(t));
    tailFire.userData.flicker(t);
  };
  return finish(g, 0.026, 0.07);
}

// A hunched shaman in ash robes, hiding behind a painted bone mask.
function shaman() {
  const g = new THREE.Group();
  const body = group(g);
  body.rotation.x = 0.12;
  const robeM = mat(0x5a4e5e), bone = mat(0xece0c4);
  const prof = [[0, 0], [0.7, 0], [0.62, 0.35], [0.5, 0.9], [0.42, 1.35], [0.34, 1.62], [0, 1.7]];
  add(body, new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 24), robeM);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    add(body, new THREE.ConeGeometry(0.1, 0.25, 4), robeM, Math.cos(a) * 0.66, 0.02, Math.sin(a) * 0.66, { rx: Math.PI });
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + ((i - 3) / 7) * 1.8;
    add(body, new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6), bone, Math.sin(-a - Math.PI / 2) * 0.36, 1.48 - Math.abs(i - 3) * -0.01, Math.cos(a + Math.PI / 2) * 0.36 + 0.02);
  }
  const head = group(body, 0, 2.0, 0);
  add(head, sph(0.46, 16, 10), mat(0x4a3e4e), 0, 0, -0.05);
  add(head, new THREE.ConeGeometry(0.22, 0.6, 14), mat(0x4a3e4e), 0, 0.3, -0.45, { rx: -2.1 });
  add(head, sph(0.37, 16, 10), basic(0x120a18), 0, -0.02, 0.1, { shadow: false });
  const mask = group(head, 0, 0, 0.35);
  add(mask, sph(0.3, 16, 10), bone, 0, 0, 0, { s: [1, 1.25, 0.42] });
  for (const s of [-1, 1]) {
    add(mask, sph(0.075, 12, 10), basic(0x120a18), s * 0.11, 0.08, 0.1, { s: [1, 1.2, 0.5], shadow: false });
    add(mask, sph(0.035, 8, 6), basic(0xe08bff), s * 0.11, 0.08, 0.13, { shadow: false });
    add(mask, new THREE.BoxGeometry(0.05, 0.2, 0.02), basic(0xc0392b), s * 0.18, -0.08, 0.1, { rz: s * 0.2, shadow: false });
  }
  for (let k = -2; k <= 2; k++) add(mask, new THREE.BoxGeometry(0.04, 0.06, 0.02), basic(0x120a18), k * 0.055, -0.2, 0.1, { shadow: false });
  for (const [x, c, rz] of [[-0.18, 0xc0392b, 0.4], [0, 0xff8a2b, 0], [0.18, 0xc0392b, -0.4]]) add(head, sph(0.1, 10, 8), mat(c), x, 0.45, -0.1, { s: [0.45, 1.7, 0.2], rz });
  const staff = group(body, 0.55, 0, 0.35);
  add(staff, new THREE.CylinderGeometry(0.04, 0.055, 2.4, 7), mat(0x3a2418), 0, 1.2, 0);
  add(staff, sph(0.17, 16, 10), bone, 0, 2.5, 0);
  add(staff, new THREE.BoxGeometry(0.16, 0.08, 0.12), bone, 0, 2.36, 0.05);
  for (const s of [-1, 1]) add(staff, sph(0.045, 8, 6), basic(0xe08bff), s * 0.06, 2.53, 0.15, { shadow: false });
  for (const s of [-1, 1]) add(staff, sph(0.05, 8, 6), glowMat(0x9a4dff, 2), s * 0.12, 2.1, 0.05);
  limb(body, V3(0.32, 1.45, 0.05), V3(0.55, 1.2, 0.35), 0.1, 0.16, robeM);
  add(body, sph(0.1, 12, 10), mat(0x8a7a6a), 0.55, 1.18, 0.35);
  limb(body, V3(-0.32, 1.45, 0.05), V3(-0.45, 1.0, 0.3), 0.1, 0.16, robeM);
  add(body, sph(0.1, 12, 10), mat(0x8a7a6a), -0.45, 0.96, 0.32);
  const orbs = [0, 1, 2].map(() => dyn(add(g, sph(0.11, 12, 10), glowMat(0x9a4dff, 2.4), 0, 1.4, 0, { shadow: false })));
  g.userData.anim = (t) => {
    body.position.y = Math.sin(t * 1.8) * 0.05;
    body.rotation.z = Math.sin(t * 0.9) * 0.05;
    head.rotation.y = Math.sin(t * 0.7) * 0.2;
    staff.rotation.z = Math.sin(t * 1.8) * 0.05;
    orbs.forEach((o, i) => {
      const a = t * 2 + (i / 3) * Math.PI * 2;
      o.position.set(Math.cos(a) * 1.0, 1.4 + Math.sin(t * 3 + i) * 0.25, Math.sin(a) * 1.0);
    });
  };
  return finish(g, 0.026, 0.07);
}

// A lumbering rock giant with a single glowing eye.
function golem({ lava = false, scale = 1, helm = false, ice = false, bone = false } = {}) {
  const g = new THREE.Group();
  const body = group(g);
  const rock = mat(lava ? 0x5e3a30 : ice ? 0x8ab8d8 : bone ? 0xcfc3a6 : 0x4a4268), rock2 = mat(lava ? 0x74483a : ice ? 0xc8e4f8 : bone ? 0xe8dcc0 : 0x5e5684);
  const glowC = lava ? 0xff6a1a : ice ? 0x4dc8ff : bone ? 0xd06aff : 0xb46bff;
  const glow = glowMat(glowC, 2.4);
  add(body, new THREE.DodecahedronGeometry(0.85, 1), rock, 0, 1.55, 0, { s: [1.15, 1, 0.9] });
  add(body, sph(0.22, 16, 10), glow, 0, 1.6, 0.7);
  add(body, new THREE.TorusGeometry(0.26, 0.06, 6, 16), rock2, 0, 1.6, 0.72);
  for (const [x, y, rz, len] of [[-0.35, 1.9, 0.6, 0.35], [0.4, 1.25, -0.7, 0.3], [-0.45, 1.3, 1.2, 0.25], [0.3, 2.0, -0.3, 0.25]]) {
    add(body, new THREE.BoxGeometry(0.05, len, 0.04), glow, x, y, 0.72, { rz, shadow: false, noOutline: true });
  }
  const head = group(body, 0, 2.48, 0.12);
  add(head, new THREE.DodecahedronGeometry(0.4, 0), rock2);
  const eye = makeEye(0.22, { iris: glowC });
  eye.position.set(0, 0.02, 0.26);
  head.add(eye);
  add(head, new THREE.BoxGeometry(0.46, 0.1, 0.14), rock, 0, 0.2, 0.3, { rx: 0.2 });
  if (helm) {
    for (let i = 0; i < 5; i++) add(head, new THREE.ConeGeometry(0.07, 0.35, 5), mat(0x241816), -0.28 + i * 0.14, 0.42, -0.02, { rz: (i - 2) * -0.2 });
  }
  const arms = [-1, 1].map(s => {
    add(body, new THREE.DodecahedronGeometry(0.38, 0), rock2, s * 0.98, 2.05, 0);
    const a = group(body, s * 1.0, 1.95, 0);
    add(a, new THREE.DodecahedronGeometry(0.3, 0), rock, s * 0.05, -0.4, 0.05);
    add(a, new THREE.DodecahedronGeometry(0.5, 1), rock2, s * 0.08, -1.0, 0.15);
    add(a, new THREE.BoxGeometry(0.3, 0.05, 0.04), glow, s * 0.08, -0.95, 0.63, { shadow: false, noOutline: true });
    return a;
  });
  for (const s of [-1, 1]) {
    add(body, new THREE.DodecahedronGeometry(0.36, 0), rock, s * 0.42, 0.45, 0);
    add(body, new THREE.BoxGeometry(0.5, 0.2, 0.62), rock2, s * 0.44, 0.1, 0.08);
  }
  for (const [x, y, z, rz] of [[-0.45, 2.2, -0.45, 0.4], [0.2, 2.35, -0.5, -0.2], [0.55, 2.1, -0.35, -0.6]]) {
    add(body, new THREE.ConeGeometry(0.12, 0.55, 5), glowMat(glowC, 1.2), x, y, z, { rz, rx: -0.4 });
  }
  g.scale.setScalar(scale);
  const blinkEye = blinker([eye]);
  g.userData.anim = (t, moving) => {
    blinkEye(t);
    arms.forEach((a, i) => { a.rotation.x = Math.sin(t * (moving ? 5 : 1.2) + i * Math.PI) * 0.25; });
    body.rotation.z = moving ? Math.sin(t * 5) * 0.06 : Math.sin(t * 0.8) * 0.02;
    body.position.y = Math.sin(t * 1.6) * 0.03;
    head.rotation.y = Math.sin(t * 0.5) * 0.2;
  };
  return finish(g, 0.03, 0.07);
}

// A lava serpent rearing up out of its pool.
function serpent() {
  const g = new THREE.Group();
  const scaleA = mat(0xd8502a), scaleB = mat(0xb03a1a), fin = glowMat(0xff8a2b, 1.8);
  const pool = dyn(add(g, new THREE.CircleGeometry(1.2, 24), glowMat(0xff5a10, 1.5), 0, 0.04, 0, { rx: -Math.PI / 2, shadow: false }));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    add(g, new THREE.DodecahedronGeometry(0.22, 0), mat(0x2a1a18), Math.cos(a) * 1.25, 0.08, Math.sin(a) * 1.25, { s: [1, 0.55, 1] });
  }
  const segs = [];
  for (let i = 0; i < 7; i++) {
    const r = 0.44 - i * 0.03;
    const s = dyn(add(g, sph(r, 16, 10), i % 2 ? scaleB : scaleA, 0, 0.3 + i * 0.36, 0));
    add(s, new THREE.ConeGeometry(0.08, 0.22, 5), mat(0x2a1a18), 0, r * 0.7, -r * 0.7, { rx: -0.8 });
    // a glowing heat seam on each segment's belly
    if (i > 0) add(s, sph(r * 0.5, 10, 8), basic(0xff8a2a), 0, -r * 0.55, r * 0.62, { s: [0.8, 0.35, 0.5], shadow: false, noOutline: true });
    segs.push(s);
  }
  const head = group(g);
  add(head, sph(0.36, 16, 10), scaleA, 0, 0, 0.12, { s: [1, 0.82, 1.3] });
  const jaw = group(head, 0, -0.12, 0.05);
  add(jaw, sph(0.27, 16, 10), mat(0xffb070), 0, -0.05, 0.25, { s: [1, 0.45, 1.3] });
  add(head, sph(0.22, 14, 10), basic(0x3a0c1c), 0, -0.1, 0.4, { s: [1, 0.4, 0.8], shadow: false });
  for (const s of [-1, 1]) {
    add(head, new THREE.ConeGeometry(0.04, 0.14, 5), basic(0xffffff), s * 0.12, -0.12, 0.54, { rx: Math.PI, shadow: false });
    const e = makeEye(0.11, { iris: 0xffd23d });
    e.position.set(s * 0.22, 0.14, 0.3);
    e.rotation.y = s * 0.5;
    head.add(e);
    add(head, new THREE.BoxGeometry(0.2, 0.05, 0.05), basic(0x2a0a08), s * 0.22, 0.27, 0.34, { rz: s * 0.45, ry: s * 0.5, shadow: false });
    add(head, new THREE.ConeGeometry(0.06, 0.35, 6), mat(0x2a1a18), s * 0.18, 0.25, -0.2, { rx: -1.1, rz: -s * 0.3 });
    add(head, new THREE.ConeGeometry(0.14, 0.45, 4), fin, s * 0.36, 0.02, -0.02, { rz: -s * 1.4, s: [1, 1, 0.3] });
  }
  const eyes = head.children.filter(c => c.isGroup && c !== jaw);
  const blink = blinker(eyes);
  g.userData.anim = (t) => {
    blink(t);
    segs.forEach((s, i) => {
      s.position.x = Math.sin(t * 2.5 - i * 0.6) * 0.18 * i * 0.4;
      s.position.z = Math.cos(t * 2 - i * 0.5) * 0.08 * i;
    });
    const top = segs[segs.length - 1].position;
    head.position.set(top.x, top.y + 0.35, top.z + 0.1);
    head.rotation.x = Math.sin(t * 2) * 0.12 + 0.15;
    head.rotation.z = Math.sin(t * 1.3) * 0.1;
    jaw.rotation.x = 0.1 + Math.max(0, Math.sin(t * 1.6)) * 0.25;
    pool.scale.setScalar(1 + Math.sin(t * 3) * 0.04);
  };
  return finish(g, 0.026, 0.07);
}

// The Molten King: a towering magma giant with a fiery crown and beard.
function pyrrhon() {
  const g = new THREE.Group();
  const body = group(g);
  const rock = mat(0x553330), rock2 = mat(0x6e4234), gold = mat(0xf2c14e);
  const magma = basic(0xff7a1a);
  for (const s of [-1, 1]) {
    add(body, new THREE.DodecahedronGeometry(0.5, 1), rock, s * 0.55, 0.62, 0);
    add(body, new THREE.BoxGeometry(0.62, 0.26, 0.8), rock2, s * 0.58, 0.13, 0.1);
  }
  add(body, new THREE.DodecahedronGeometry(1.1, 1), rock, 0, 2.0, 0, { s: [1.2, 1.05, 0.95] });
  add(body, sph(0.45, 16, 10), basic(0xff5a10), 0, 1.9, 0.82, { s: [1, 1, 0.5] });
  const core = dyn(add(body, sph(0.28, 16, 10), basic(0xffd040), 0, 1.9, 0.98, { s: [1, 1, 0.4] }));
  for (const [x, y, rz, len] of [[-0.6, 2.4, 0.5, 0.6], [0.65, 2.3, -0.6, 0.55], [-0.75, 1.6, 1.3, 0.4], [0.7, 1.55, -1.2, 0.45], [0, 1.25, 0, 0.35], [-0.35, 2.8, -0.2, 0.4], [0.3, 2.85, 0.3, 0.35], [-1.0, 2.1, 0.2, 0.4], [1.0, 2.0, -0.2, 0.4]]) {
    add(body, new THREE.BoxGeometry(0.07, len, 0.05), magma, x, y, 0.9, { rz, shadow: false, noOutline: true });
  }
  const pauldrons = [];
  for (const s of [-1, 1]) {
    add(body, new THREE.DodecahedronGeometry(0.55, 1), rock2, s * 1.35, 2.62, 0);
    for (let k = 0; k < 3; k++) pauldrons.push(flame(body, s * (1.2 + k * 0.15), 3.0 - k * 0.05, -0.1 + k * 0.12, 1.1 - k * 0.15));
  }
  const head = group(body, 0, 3.22, 0.22);
  add(head, new THREE.DodecahedronGeometry(0.58, 1), rock2);
  add(head, new THREE.BoxGeometry(0.8, 0.14, 0.25), rock, 0, 0.14, 0.44, { rx: 0.25 });
  for (const s of [-1, 1]) {
    const e = makeEye(0.12, { glow: 0xffd23d });
    e.position.set(s * 0.2, 0.0, 0.5);
    head.add(e);
    add(head, new THREE.BoxGeometry(0.3, 0.08, 0.08), rock, s * 0.2, 0.15, 0.52, { rz: s * 0.45 });
  }
  add(head, new THREE.CircleGeometry(0.2, 16, Math.PI, Math.PI), basic(0xffa020), 0, -0.2, 0.57, { shadow: false });
  const beard = [];
  for (const [x, len, c] of [[-0.3, 0.55, 0xff4a10], [-0.15, 0.75, 0xff7a1a], [0, 0.9, 0xffa020], [0.15, 0.75, 0xff7a1a], [0.3, 0.55, 0xff4a10]]) {
    beard.push(dyn(add(head, new THREE.ConeGeometry(0.11, len, 8), basic(c), x, -0.32 - len / 2, 0.42, { rx: Math.PI + 0.2, shadow: false, noOutline: true })));
  }
  const crown = group(head, 0, 0.5, 0);
  add(crown, new THREE.CylinderGeometry(0.44, 0.48, 0.2, 18, 1, true), gold, 0, 0, 0);
  add(crown, new THREE.TorusGeometry(0.47, 0.05, 6, 24), gold, 0, -0.1, 0, { rx: Math.PI / 2 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    add(crown, new THREE.ConeGeometry(0.09, 0.42, 5), gold, Math.cos(a) * 0.44, 0.28, Math.sin(a) * 0.44);
    add(crown, new THREE.OctahedronGeometry(0.07), glowMat(0xff3a2a, 2.2), Math.cos(a) * 0.46, 0.05, Math.sin(a) * 0.46, { shadow: false });
  }
  // great obsidian horns framing the crown
  for (const s of [-1, 1]) {
    tube(head, [[s * 0.42, 0.28, -0.05], [s * 0.78, 0.5, -0.2], [s * 0.95, 0.92, -0.42]], 0.12, rock, 12);
    add(head, new THREE.ConeGeometry(0.1, 0.3, 6), glowMat(0xff5a10, 1.6), s * 0.98, 1.02, -0.48, { rx: -0.6, rz: -s * 0.4 });
  }
  const crownFire = [flame(crown, 0, 0.1, 0, 1.3), flame(crown, 0.18, 0.08, 0.1, 0.9), flame(crown, -0.18, 0.08, -0.1, 0.9)];
  const arms = [-1, 1].map(s => {
    const a = group(body, s * 1.38, 2.4, 0);
    add(a, new THREE.DodecahedronGeometry(0.42, 1), rock, s * 0.05, -0.5, 0.05);
    add(a, new THREE.DodecahedronGeometry(0.66, 1), rock2, s * 0.1, -1.25, 0.2);
    add(a, new THREE.BoxGeometry(0.42, 0.06, 0.05), magma, s * 0.1, -1.15, 0.85, { shadow: false, noOutline: true });
    return a;
  });
  const cape = dyn(add(body, new THREE.PlaneGeometry(2.4, 2.6, 1, 6), mat(0x8a1a08, { emissive: 0xc02a08, emissiveIntensity: 0.7, side: THREE.DoubleSide }), 0, 1.7, -0.95, { rx: 0.1 }));
  const orbit = [0, 1, 2, 3].map(() => dyn(add(g, new THREE.DodecahedronGeometry(0.22, 0), mat(0x6e4234, { emissive: 0xff4a10, emissiveIntensity: 0.6 }), 0, 2, 0)));
  // the ground melts where the Molten King stands: a breathing ring of lava
  const auraM = new THREE.MeshBasicMaterial({ color: 0xff5a10, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const aura = dyn(add(g, new THREE.RingGeometry(1.7, 2.35, 32), auraM, 0, 0.06, 0, { rx: -Math.PI / 2, shadow: false, noOutline: true }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    add(aura, new THREE.DodecahedronGeometry(0.16, 0), mat(0x241816), Math.cos(a) * 2.5, -0.04, Math.sin(a) * 2.5, { s: [1, 0.5, 1], noOutline: true });
  }
  // molten drool that falls from his fists and reforms
  const drips = [];
  for (const sx of [-1.48, 1.48]) for (let k = 0; k < 2; k++) {
    drips.push({ m: dyn(add(body, sph(0.09, 8, 6), basic(0xffa020), sx, 1.1, 0.25, { shadow: false, noOutline: true })), off: k * 0.5 + (sx > 0 ? 0.25 : 0) });
  }
  // glowing cracks down his legs
  for (const s of [-1, 1]) {
    add(body, new THREE.BoxGeometry(0.06, 0.5, 0.05), magma, s * 0.55, 0.65, 0.48, { rz: s * 0.2, shadow: false, noOutline: true });
    add(body, new THREE.BoxGeometry(0.06, 0.35, 0.05), magma, s * 0.62, 0.4, 0.46, { rz: -s * 0.35, shadow: false, noOutline: true });
  }
  g.scale.setScalar(1.25);
  g.userData.anim = (t, moving) => {
    body.position.y = Math.sin(t * 1.4) * 0.05;
    arms.forEach((a, i) => { a.rotation.x = Math.sin(t * (moving ? 5 : 1.1) + i * Math.PI) * 0.2; });
    head.rotation.y = Math.sin(t * 0.5) * 0.15;
    cape.rotation.x = 0.1 + Math.sin(t * 2) * 0.08;
    beard.forEach((b, i) => { b.scale.set(1, 1 + Math.sin(t * 11 + i * 1.7) * 0.15, 1); });
    core.scale.set(1 + Math.sin(t * 3) * 0.08, 1 + Math.sin(t * 3) * 0.08, 0.4);
    [...pauldrons, ...crownFire].forEach(f => f.userData.flicker(t));
    orbit.forEach((r, i) => {
      const a = t * 1.1 + (i / 4) * Math.PI * 2;
      r.position.set(Math.cos(a) * 2.2, 2.4 + Math.sin(t * 2 + i) * 0.4, Math.sin(a) * 2.2);
      r.rotation.set(t, t * 1.3, 0);
    });
    const ap = 1 + Math.sin(t * 1.8) * 0.07;
    aura.scale.set(ap, ap, 1);
    auraM.opacity = 0.42 + Math.sin(t * 1.8) * 0.12;
    drips.forEach((d) => {
      const k = (t * 0.7 + d.off) % 1;
      d.m.position.y = 1.15 - k * 1.0;
      d.m.scale.setScalar(0.6 + k * 0.7);
    });
  };
  return finish(g, 0.03, 0.07);
}

export function makeEnemy(kind) {
  switch (kind) {
    case 'sprig': return sprig();
    case 'rat': return rat();
    case 'wisp': return wisp();
    case 'knight': return knight();
    case 'crow': { const c = crow(); c.scale.setScalar(1.15); return c; }
    case 'boss': {
      const k = knight({ armor: 0x453466, dark: 0x1e1430, accent: 0xc542ff, eye: 0xe0a0ff, boss: true });
      k.scale.setScalar(1.6);
      return k;
    }
    case 'imp': return imp();
    case 'hound': { const h = hound(); h.scale.setScalar(1.15); return h; }
    case 'shaman': return shaman();
    case 'golem': return golem();
    case 'guard': return golem({ lava: true, scale: 1.2, helm: true });
    case 'serpent': return serpent();
    case 'pyrrhon': return pyrrhon();
    case 'wyrmling': return makeDragon({ color: 0xd9481a, belly: 0xffc060, horn: 0xf0e6d0, wings: 1, size: 0.62, spikes: true });
    case 'drake_foe': return makeDragon({ color: 0x6a7a3a, belly: 0xd8c890, horn: 0xe8dcc0, wings: 0, size: 1.05, frill: true, eye: 0xff7a1a });
    case 'wyvern': return makeDragon({ color: 0x3a5a8a, belly: 0x9fd6ff, wing: 0x2a3a6a, horn: 0xdff6ff, legs: 2, wings: 2, hover: 2.2, size: 0.95, eye: 0x4dc8ff });
    case 'elder_dragon': return makeDragon({ color: 0x8a1a1a, belly: 0xe0a040, wing: 0x4a0a14, horn: 0x2a1a1a, wings: 2, size: 2.6, frill: true, fierce: true, eye: 0xffe040 });
    case 'cultist': return cultist();
    case 'snow_wolf': { const w = quadruped({ color: 0xe8eef8, mane: 0xb8c8e0, ears: 'wolf', tail: 'bushy', legLen: 0.95, neck: 0.55, glow: 0x6fd3ff, saddle: false }); w.scale.setScalar(1.1); return w; }
    case 'frost_wraith': return shade(0xa8d8f0, 0xffffff);
    case 'ice_golem': return golem({ ice: true, scale: 1.15 });
    case 'yeti': return yeti();
    case 'frost_drake': return makeDragon({ color: 0x9fd6ff, belly: 0xffffff, wing: 0x4d7ab0, horn: 0xdff6ff, wings: 2, size: 1.35, eye: 0x4dc8ff, frill: true });
    case 'frost_queen': return frostQueenBoss();
    case 'pale_warden': return paleWarden();
    case 'gale_sprite': return galeSprite();
    case 'stormhorn': { const s = quadruped({ color: 0x5a5a8a, dark: 0x3a3a5a, mane: 0xb46bff, antlers: true, glow: 0xb46bff, legLen: 1.2, neck: 0.95, tail: 'hair', saddle: false }); s.scale.setScalar(1.15); return s; }
    case 'skyraider': return makeWizard({ robe: 0x3a5a8a, hat: 0x8a1a1a, trim: 0xf2c14e, gem: 0xb46bff, hatStyle: 'hood', goggles: true, backpack: true, hair: 0x6a3a1a, skin: 0xe8b890, eyeColor: 0xb46bff });
    case 'tempest_golem': { const gm = golem({ scale: 1.2 }); const body = gm.children[0]; for (const [x, y, z, r] of [[0.7, 2.6, -0.2, 0.4], [-0.7, 2.6, -0.2, -0.4], [0, 2.9, -0.4, 0], [0.4, 2.2, -0.6, 0.6]]) add(body, new THREE.OctahedronGeometry(0.28), glowMat(0xb46bff, 2.6), x, y, z, { s: [0.7, 1.8, 0.7], rz: r }); return gm; }
    case 'thunder_roc': return thunderbird({ size: 0.85 });
    case 'voltaris': return thunderbird({ size: 1.6, boss: true });
    case 'briar_stalker': { const c = quadruped({ ears: 'cat', color: 0x4a6a3a, dark: 0x2a3a22, mane: 0x6a3a8a, tail: 'bushy', legLen: 0.85, neck: 0.5, glow: 0x9fff7a, saddle: false }); const body = c.children[0]; for (let k = 0; k < 6; k++) add(body, new THREE.ConeGeometry(0.06, 0.4, 4), mat(0x2a1a2a), 0, 1.75, -0.6 + k * 0.25, { rx: -0.4 }); c.scale.setScalar(1.1); return c; }
    case 'treant': return treant({ size: 1.1 });
    case 'spore_shambler': return shroom();
    case 'pixie': return pixie();
    case 'blight_horror': return blightHorror();
    case 'thornmother': return thornmotherBoss();
    case 'deathless': return skeleton('warrior');
    case 'bone_magus': return skeleton('mage');
    case 'sorrowshade': return shade(0x4a3a6a, 0xd06aff);
    case 'bone_colossus': return golem({ scale: 1.35, bone: true });
    case 'pale_templar': { const k = knight({ armor: 0xe8e4f0, dark: 0x3a3048, accent: 0xd06aff, eye: 0xd06aff }); k.scale.setScalar(1.15); return k; }
    case 'malvoren': return malvorenBoss();
    case 'soul_anchor': return soulAnchor();
    case 'blight_pod': { const pod = new THREE.Group(); add(pod, sph(0.7, 14, 10), mat(0x6a3a8a, { emissive: 0xd06aff, emissiveIntensity: 0.5 }), 0, 0.8, 0, { s: [1, 1.3, 1] }); for (let k = 0; k < 5; k++) add(pod, new THREE.ConeGeometry(0.08, 0.5, 4), mat(0x2a1a2a), Math.cos(k * 1.26) * 0.6, 0.4, Math.sin(k * 1.26) * 0.6, { rz: -Math.cos(k * 1.26) * 0.8, rx: Math.sin(k * 1.26) * 0.8 }); pod.userData.anim = (t) => { pod.scale.setScalar(1 + Math.sin(t * 4) * 0.06); }; return finish(pod, 0.03, 0.08); }
    case 'shade': return shade();
    case 'meadow_wisp': { const w = shade(0x3a7a6a, 0xb0ffd0); w.scale.setScalar(0.75); return w; }
  }
  return sprig();
}

// ---------------------------------------------------------------- pets

export function makePet(kind, color) {
  const g = new THREE.Group();
  const body = group(g);
  const c = mat(color), cream = mat(0xfff0d0);
  const wings = [];
  let face;
  let flies = true;
  switch (kind) {
    case 'owl': {
      add(body, sph(0.3, 16, 10), c, 0, 0, 0, { s: [1, 1.05, 0.95] });
      add(body, sph(0.22, 16, 10), cream, 0, -0.06, 0.12, { s: [1, 1, 0.8] });
      face = makeFace(0.3, { eyeR: 0.11, gap: 0.12, eyeY: 0.07, iris: 0xff9a1a, mouth: 'none' });
      body.add(face);
      add(body, new THREE.ConeGeometry(0.05, 0.12, 6), mat(0xff9a1a), 0, -0.03, 0.31, { rx: Math.PI / 2 + 0.6 });
      for (const s of [-1, 1]) {
        add(body, new THREE.ConeGeometry(0.06, 0.18, 6), c, s * 0.17, 0.3, 0, { rz: -s * 0.4 });
        const p = group(body, s * 0.27, 0, 0);
        add(p, sph(0.14, 14, 10), mat(darker(color, 0.8)), s * 0.05, -0.03, 0, { s: [0.35, 1, 0.8] });
        wings.push({ p, s, axis: 'z' });
      }
      break;
    }
    case 'sprite': {
      add(body, sph(0.15, 16, 10), glowMat(color, 0.8), 0, -0.1, 0);
      add(body, sph(0.2, 16, 10), mat(0xc8f5d0), 0, 0.18, 0);
      const hd = group(body, 0, 0.18, 0);
      face = makeFace(0.2, { eyeR: 0.075, gap: 0.08, eyeY: 0.02, iris: 0x2a8a3a, mouth: 'smile', mouthW: 0.03, mouthY: -0.08, cheeks: true });
      hd.add(face);
      add(hd, new THREE.ConeGeometry(0.16, 0.32, 14), mat(0x3d9a4a), 0, 0.26, -0.02, { rx: -0.3 });
      const wm = mat(0xe8fff0, { transparent: true, opacity: 0.55, side: THREE.DoubleSide });
      for (const s of [-1, 1]) {
        const p = group(body, s * 0.08, 0.05, -0.12);
        p.scale.x = s;
        add(p, new THREE.CircleGeometry(0.18, 14), wm, 0.14, 0.08, 0, { s: [1, 0.55, 1], rz: 0.4 });
        add(p, new THREE.CircleGeometry(0.13, 14), wm, 0.11, -0.08, 0, { s: [1, 0.5, 1], rz: -0.4 });
        wings.push({ p, s, axis: 'y' });
      }
      break;
    }
    case 'drake': {
      add(body, sph(0.27, 16, 10), c, 0, 0, 0);
      add(body, sph(0.2, 16, 10), cream, 0, -0.05, 0.12, { s: [1, 1, 0.8] });
      const hd = group(body, 0, 0.3, 0.14);
      add(hd, sph(0.22, 16, 10), c);
      add(hd, sph(0.12, 14, 10), c, 0, -0.05, 0.2, { s: [1, 0.8, 1.1] });
      face = makeFace(0.22, { eyeR: 0.085, gap: 0.09, eyeY: 0.06, iris: 0xffd23d, mouth: 'none' });
      hd.add(face);
      for (const s of [-1, 1]) add(hd, new THREE.ConeGeometry(0.04, 0.14, 6), cream, s * 0.1, 0.2, -0.06, { rx: -0.5 });
      const wm = mat(darker(color, 0.75), { side: THREE.DoubleSide });
      for (const s of [-1, 1]) {
        const p = group(body, s * 0.15, 0.12, -0.12);
        p.scale.x = s;
        add(p, batWingGeo(0.38, 0.3), wm);
        wings.push({ p, s, axis: 'y' });
      }
      tube(body, [[0, -0.05, -0.22], [0, -0.1, -0.4], [0.05, 0, -0.55]], 0.05, c, 10);
      g.userData.tailFire = flame(body, 0.05, 0, -0.58, 0.35);
      break;
    }
    case 'pup': {
      flies = false;
      add(body, sph(0.26, 16, 10), c, 0, 0.3, 0, { s: [1, 0.9, 1.1] });
      const hd = group(body, 0, 0.58, 0.2);
      add(hd, sph(0.24, 16, 10), c);
      add(hd, sph(0.1, 14, 10), mat(0xffffff), 0, -0.07, 0.2, { s: [1.2, 0.8, 1] });
      add(hd, sph(0.04, 10, 8), mat(0x1a1030), 0, -0.03, 0.29);
      face = makeFace(0.24, { eyeR: 0.085, gap: 0.1, eyeY: 0.05, iris: 0x2a6ad0, mouth: 'open', mouthY: -0.14, mouthW: 0.04, cheeks: true });
      hd.add(face);
      for (const s of [-1, 1]) add(hd, sph(0.12, 12, 10), mat(0x6ab0e0), s * 0.25, 0.02, 0.02, { s: [0.45, 1.25, 0.8], rz: s * 0.45 });
      for (const [x, z] of [[-0.14, 0.14], [0.14, 0.14], [-0.14, -0.16], [0.14, -0.16]]) add(body, sph(0.08, 12, 10), c, x, 0.07, z, { s: [1, 1.1, 1.1] });
      add(body, new THREE.TorusGeometry(0.16, 0.035, 6, 18), mat(0x2a6ad0), 0, 0.45, 0.14, { rx: Math.PI / 2 + 0.5 });
      add(body, new THREE.OctahedronGeometry(0.06), glowMat(0xffffff, 1.5), 0, 0.37, 0.3);
      tube(body, [[0, 0.3, -0.26], [0, 0.45, -0.38], [0.05, 0.6, -0.32]], 0.045, c, 8);
      break;
    }
    case 'bat': {
      add(body, sph(0.22, 16, 10), c);
      face = makeFace(0.22, { eyeR: 0.085, gap: 0.085, eyeY: 0.04, iris: 0xff4d6d, mouth: 'fangs', mouthY: -0.1, mouthW: 0.035 });
      body.add(face);
      for (const s of [-1, 1]) {
        add(body, new THREE.ConeGeometry(0.08, 0.26, 8), c, s * 0.12, 0.25, 0, { rz: -s * 0.3 });
        add(body, new THREE.ConeGeometry(0.045, 0.15, 8), mat(0xff9ac0), s * 0.12, 0.25, 0.035, { rz: -s * 0.3 });
      }
      const wm = mat(0x3a2a55, { side: THREE.DoubleSide });
      for (const s of [-1, 1]) {
        const p = group(body, s * 0.15, 0.05, -0.05);
        p.scale.x = s;
        add(p, batWingGeo(0.45, 0.34), wm);
        wings.push({ p, s, axis: 'y' });
      }
      break;
    }
    case 'voidling': {
      add(body, sph(0.3, 18, 12), mat(0x2a1a44), 0, 0, 0);
      add(body, sph(0.2, 16, 10), basic(0xffffff), 0, 0.02, 0.17, { s: [1, 1, 0.6], shadow: false });
      add(body, sph(0.11, 12, 8), glowMat(color, 2.4), 0, 0.02, 0.27, { s: [1, 1, 0.5], shadow: false });
      add(body, sph(0.05, 8, 6), basic(0x1a1030), 0, 0.02, 0.32, { shadow: false });
      for (const s of [-1, 1]) add(body, new THREE.ConeGeometry(0.06, 0.25, 6), mat(0x4a2a7a), s * 0.18, 0.28, -0.02, { rz: -s * 0.5 });
      const tent = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const t = group(body, Math.cos(a) * 0.14, -0.2, Math.sin(a) * 0.14);
        add(t, new THREE.ConeGeometry(0.05, 0.4, 6), glowMat(color, 1), 0, -0.18, 0, { rx: Math.PI });
        tent.push(t);
      }
      g.userData.tentacles = tent;
      break;
    }
    case 'beetle': {
      add(body, new THREE.SphereGeometry(0.28, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), c, 0, 0, -0.02, { s: [1, 0.9, 1.15] });
      add(body, new THREE.CylinderGeometry(0.28, 0.28, 0.05, 18), mat(darker(color, 0.6)), 0, 0, -0.02, { s: [1, 1, 1.15] });
      for (const [x, z] of [[-0.12, 0.05], [0.13, -0.08], [0.02, -0.18], [-0.1, -0.12]]) add(body, sph(0.045, 10, 8), glowMat(0xfff27a, 1.6), x, 0.22 - Math.abs(z) * 0.3, z, { s: [1, 0.5, 1] });
      body.rotation.x = -0.25;
      const hd = group(body, 0, 0.06, 0.3);
      add(hd, sph(0.17, 16, 10), mat(0x5a4a8a));
      face = makeFace(0.17, { eyeR: 0.075, gap: 0.075, eyeY: 0.04, iris: 0x3aa0ff, mouth: 'smile', mouthW: 0.028, mouthY: -0.08, cheeks: true });
      hd.add(face);
      for (const s of [-1, 1]) {
        limb(hd, V3(s * 0.05, 0.12, 0), V3(s * 0.14, 0.34, 0.08), 0.012, 0.01, basic(0x2a1a44), 4);
        add(hd, sph(0.04, 10, 8), glowMat(0xfff27a, 2), s * 0.14, 0.35, 0.08);
      }
      const wm = mat(0xd8c8ff, { transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      for (const s of [-1, 1]) {
        const p = group(body, s * 0.1, 0.2, -0.1);
        p.scale.x = s;
        add(p, new THREE.CircleGeometry(0.22, 14), wm, 0.18, 0.02, 0, { s: [1, 0.45, 1], rz: 0.2 });
        wings.push({ p, s, axis: 'y' });
      }
      for (let k = -1; k <= 1; k++) for (const s of [-1, 1]) limb(body, V3(s * 0.2, -0.02, k * 0.12), V3(s * 0.3, -0.15, k * 0.16), 0.018, 0.012, basic(0x2a1a44), 4);
      break;
    }
  }
  const blink = face ? blinker(face.userData.eyes) : () => {};
  g.userData.anim = (t, moving) => {
    blink(t);
    if (flies) body.position.y = 0.95 + Math.sin(t * 3) * 0.15;
    else {
      body.position.y = moving ? Math.abs(Math.sin(t * 12)) * 0.12 : 0;
      body.rotation.z = moving ? 0 : Math.sin(t * 2) * 0.03;
    }
    for (const w of wings) {
      if (w.axis === 'z') w.p.rotation.z = w.s * Math.sin(t * 16) * 0.6;
      else w.p.rotation.y = w.s * (0.5 + Math.sin(t * 16) * 0.5);
    }
    g.userData.tailFire?.userData.flicker(t);
    g.userData.tentacles?.forEach((tt, i) => { tt.rotation.x = Math.sin(t * 5 + i) * 0.4; tt.rotation.z = Math.cos(t * 4 + i) * 0.3; });
  };
  return finish(g, 0.02, 0.07);
}

// ---------------------------------------------------------------- scenery: academy & lane

export function makeTree(scale = 1, leaf = 0x3f8a4a) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.22, 0.34, 1.6, 8), mat(0x6b4a2b), 0, 0.8, 0);
  const tiers = [[1.7, 2.3, 2.3], [1.35, 2.0, 3.35], [0.95, 1.7, 4.3], [0.55, 1.2, 5.1]];
  tiers.forEach(([r, h, y], i) => {
    const t = add(g, new THREE.ConeGeometry(r, h, 12), mat(i % 2 ? leaf : lighter(leaf, 0.08)), 0, y, 0);
    t.rotation.y = i * 0.4;
  });
  g.scale.setScalar(scale);
  g.rotation.z = rnd(-0.04, 0.04);
  return finish(g, 0.04, 0.4, true);
}

export function makeRoundTree(scale = 1, leaf = 0xd36fae) {
  const g = new THREE.Group();
  const bark = mat(0x5a3d24);
  add(g, new THREE.CylinderGeometry(0.2, 0.32, 2.3, 8), bark, 0, 1.15, 0);
  limb(g, V3(0, 1.7, 0), V3(0.6, 2.5, 0.1), 0.12, 0.07, bark, 6);
  limb(g, V3(0, 1.9, 0), V3(-0.55, 2.6, -0.1), 0.12, 0.07, bark, 6);
  const L = mat(leaf), L2 = mat(lighter(leaf, 0.18));
  for (const [x, y, z, r, m] of [[0, 3.3, 0, 1.3, L], [0.9, 2.8, 0.2, 0.9, L2], [-0.85, 2.9, -0.1, 0.95, L], [0.2, 2.7, 0.8, 0.8, L2], [-0.2, 2.8, -0.8, 0.85, L2]]) {
    add(g, new THREE.IcosahedronGeometry(r, 1), m, x, y, z);
  }
  for (let i = 0; i < 6; i++) add(g, sph(0.1, 8, 6), basic(0xfff4f8), rnd(-1.1, 1.1), rnd(2.6, 4), rnd(-1, 1), { shadow: false });
  g.scale.setScalar(scale);
  return finish(g, 0.04, 0.4, true);
}

// Twisted dead tree; some of them have a spooky face.
export function makeDeadTree(scale = 1, spooky = Math.random() < 0.4) {
  const g = new THREE.Group();
  const wood = mat(0x3e302c);
  limb(g, V3(0, 0, 0), V3(0.2, 1.6, 0), 0.38, 0.26, wood, 7);
  limb(g, V3(0.2, 1.55, 0), V3(-0.1, 3.1, 0.1), 0.27, 0.14, wood, 7);
  const branches = [[V3(0.1, 2.2, 0), V3(1.1, 3.0, 0.2)], [V3(0, 2.6, 0), V3(-1.0, 3.3, -0.2)], [V3(-0.05, 2.9, 0.05), V3(0.4, 3.9, -0.4)], [V3(0.2, 1.8, 0), V3(-0.8, 2.3, 0.5)]];
  for (const [a, b] of branches) {
    limb(g, a, b, 0.1, 0.04, wood, 5);
    limb(g, b, b.clone().add(V3(b.x > 0 ? 0.3 : -0.3, 0.35, 0)), 0.04, 0.015, wood, 4);
  }
  for (const s of [-1, 1]) limb(g, V3(0, 0.25, 0), V3(s * 0.6, 0, 0.3 * s), 0.14, 0.05, wood, 5);
  if (spooky) {
    for (const s of [-1, 1]) add(g, sph(0.09, 10, 8), basic(0xffd27a), 0.15 + s * 0.13, 1.25, 0.3, { s: [1, 1.3, 0.5], shadow: false });
    add(g, sph(0.13, 12, 8), basic(0x120a18), 0.15, 0.9, 0.3, { s: [1.4, 0.7, 0.5], shadow: false });
  }
  g.scale.setScalar(scale);
  return finish(g, 0.035, 0.3, true);
}

export function makeLamp(color = 0xffd27a) {
  const g = new THREE.Group();
  const iron = mat(0x2b2733);
  add(g, new THREE.CylinderGeometry(0.28, 0.35, 0.3, 8), iron, 0, 0.15, 0);
  add(g, new THREE.CylinderGeometry(0.07, 0.1, 3.2, 8), iron, 0, 1.75, 0);
  add(g, new THREE.TorusGeometry(0.28, 0.04, 6, 16, Math.PI), iron, 0.28, 3.35, 0, { rz: Math.PI * 0.05 });
  const lantern = group(g, 0.56, 3.15, 0);
  add(lantern, new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4), iron, 0, 0.12, 0);
  add(lantern, new THREE.ConeGeometry(0.22, 0.18, 6), iron, 0, 0, 0);
  add(lantern, new THREE.CylinderGeometry(0.15, 0.13, 0.36, 6), glowMat(color, 2.4), 0, -0.26, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    add(lantern, new THREE.BoxGeometry(0.025, 0.38, 0.025), iron, Math.cos(a) * 0.155, -0.26, Math.sin(a) * 0.155);
  }
  add(lantern, new THREE.CylinderGeometry(0.17, 0.12, 0.06, 6), iron, 0, -0.46, 0);
  // lamps are static so the renderer can batch them
  return finish(g, 0.03, 0.3, true);
}

export function makeHouse({ w = 6, d = 6, h = 4, wall = 0xd9c7a3, roof = 0x7b3f5e, lit = true, tilt = 0 } = {}) {
  const g = new THREE.Group();
  const beam = mat(0x4a3024), wallM = mat(wall), stone = mat(0x7a7280), roofM = mat(roof);
  add(g, new THREE.BoxGeometry(w, h, d), wallM, 0, h / 2, 0);
  add(g, new THREE.BoxGeometry(w + 0.3, 0.6, d + 0.3), stone, 0, 0.3, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, new THREE.BoxGeometry(0.28, h, 0.28), beam, sx * w / 2, h / 2, sz * d / 2);
  add(g, new THREE.BoxGeometry(w + 0.12, 0.22, d + 0.12), beam, 0, h * 0.5, 0);
  add(g, new THREE.BoxGeometry(w + 0.12, 0.22, d + 0.12), beam, 0, h - 0.1, 0);
  // gable roof
  const rh = h * 0.7;
  const roofG = group(g, 0, h, 0);
  roofG.rotation.z = tilt;
  const tri = new THREE.Shape();
  tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, rh * 0.96); tri.closePath();
  add(roofG, new THREE.ExtrudeGeometry(tri, { depth: d, bevelEnabled: false }), wallM, 0, 0, -d / 2);
  const half = w / 2 + 0.55;
  const slant = Math.hypot(half, rh), ang = Math.atan2(rh, half);
  for (const s of [-1, 1]) add(roofG, new THREE.BoxGeometry(slant + 0.15, 0.28, d + 1.1), roofM, s * half / 2, rh / 2 - 0.05, 0, { rz: -s * ang });
  add(roofG, new THREE.CylinderGeometry(0.16, 0.16, d + 1.2, 8), mat(darker(roof, 0.75)), 0, rh + 0.05, 0, { rx: Math.PI / 2 });
  add(roofG, new THREE.CylinderGeometry(0.36, 0.36, 0.1, 16), lit ? glowMat(0xffc86b, 1.4) : mat(0x1c1a24), 0, rh * 0.4, d / 2 + 0.02, { rx: Math.PI / 2 });
  add(roofG, new THREE.TorusGeometry(0.38, 0.07, 6, 16), beam, 0, rh * 0.4, d / 2 + 0.05);
  // chimney
  const ch = group(roofG, w * 0.25, rh * 0.45, -d * 0.2);
  ch.rotation.z = rnd(-0.12, 0.12);
  add(ch, new THREE.BoxGeometry(0.7, 2.0, 0.7), mat(0x7a6a64), 0, 0.6, 0);
  add(ch, new THREE.BoxGeometry(0.9, 0.2, 0.9), stone, 0, 1.6, 0);
  // door
  const doorM = mat(0x6b3a24);
  add(g, archGeo(1.5, 2.5, 0.12), beam, 0, 0.3, d / 2 - 0.04);
  add(g, archGeo(1.22, 2.32, 0.12), doorM, 0, 0.3, d / 2);
  for (const x of [-0.3, 0, 0.3]) add(g, new THREE.BoxGeometry(0.04, 1.9, 0.03), beam, x, 1.25, d / 2 + 0.13, { shadow: false, noOutline: true });
  add(g, sph(0.08, 10, 8), mat(0xf2c14e), 0.42, 1.2, d / 2 + 0.16);
  // windows with frames, crossbars and flower boxes
  const glass = lit ? glowMat(0xffc86b, 1.4) : mat(0x1c1a24);
  const windowAt = (x, y, z, ry) => {
    const wg = group(g, x, y, z);
    wg.rotation.y = ry;
    add(wg, new THREE.BoxGeometry(1.15, 1.15, 0.12), beam);
    add(wg, new THREE.BoxGeometry(0.9, 0.9, 0.1), glass, 0, 0, 0.03);
    add(wg, new THREE.BoxGeometry(0.07, 0.9, 0.12), beam, 0, 0, 0.05);
    add(wg, new THREE.BoxGeometry(0.9, 0.07, 0.12), beam, 0, 0, 0.05);
    add(wg, new THREE.BoxGeometry(1.2, 0.25, 0.3), mat(0x6b4a2b), 0, -0.7, 0.12);
    for (let k = -1; k <= 1; k++) add(wg, sph(0.1, 8, 6), mat([0xff5fa2, 0xf2c14e, 0xb46bff][k + 1]), k * 0.35, -0.52, 0.14);
  };
  for (const s of [-1, 1]) windowAt(s * w * 0.3, h * 0.66, d / 2 + 0.04, 0);
  for (const s of [-1, 1]) windowAt(s * (w / 2 + 0.04), h * 0.66, 0, s * Math.PI / 2);
  return finish(g, 0.045, 0.35, true);
}

export function makeTower({ r = 4, h = 16, wall = 0xcfc3e8, roof = 0x3b2d7a } = {}) {
  const g = new THREE.Group();
  const gold = mat(0xf2c14e);
  add(g, new THREE.CylinderGeometry(r * 1.12, r * 1.2, 1.2, 18), mat(0x8c8398), 0, 0.6, 0);
  add(g, new THREE.CylinderGeometry(r, r * 1.06, h, 18), mat(wall), 0, h / 2, 0);
  add(g, new THREE.TorusGeometry(r * 1.03, 0.25, 6, 24), gold, 0, h * 0.55, 0, { rx: Math.PI / 2 });
  add(g, new THREE.CylinderGeometry(r * 1.18, r * 1.1, 0.7, 18), gold, 0, h, 0);
  // curved witch-hat roof
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(r * 1.32 * Math.pow(1 - t, 1.7) + 0.02, r * 2.7 * t));
  }
  add(g, new THREE.LatheGeometry(pts, 18), mat(roof), 0, h + 0.3, 0);
  add(g, new THREE.OctahedronGeometry(r * 0.2), glowMat(0xf2c14e, 2), 0, h + 0.3 + r * 2.85, 0);
  const win = glowMat(0xffd98a, 1.3), frame = mat(darker(wall, 0.55));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    for (let lvl = 0; lvl < 2; lvl++) {
      const y = h * (0.3 + lvl * 0.38);
      const rr = r * (1 + 0.06 * (1 - y / h)) - 0.12;
      const wg = group(g, Math.sin(a) * rr, y, Math.cos(a) * rr);
      wg.rotation.y = a;
      add(wg, archGeo(1.1, 2.0, 0.24), frame, 0, -1.0, 0);
      add(wg, archGeo(0.82, 1.78, 0.26), win, 0, -0.9, 0.02);
      add(wg, new THREE.BoxGeometry(0.06, 1.7, 0.3), frame, 0, -0.1, 0.02, { noOutline: true });
    }
  }
  const bannerM = mat(roof, { side: THREE.DoubleSide });
  for (const a of [Math.PI / 6, -Math.PI / 6]) {
    const bg = group(g, Math.sin(a) * (r + 0.1), h * 0.88, Math.cos(a) * (r + 0.1));
    bg.rotation.y = a;
    add(bg, new THREE.PlaneGeometry(1.1, 2.6), bannerM, 0, -1.2, 0.05);
    add(bg, new THREE.OctahedronGeometry(0.28), gold, 0, -1.0, 0.1, { s: [1, 1, 0.3] });
  }
  return finish(g, 0.05, 0.5, true);
}

export function makeFountain() {
  const g = new THREE.Group();
  const stone = mat(0xc4bca8), stone2 = mat(0xa39a86);
  const basin = [[0, 0], [3.3, 0], [3.4, 0.1], [3.35, 0.75], [3.1, 0.85], [2.95, 0.8], [2.95, 0.3], [0, 0.3]];
  add(g, new THREE.LatheGeometry(basin.map(([x, y]) => new THREE.Vector2(x, y)), 36), stone);
  const waterM = new THREE.MeshToonMaterial({ color: 0x5fc3ff, emissive: 0x1a6fc8, emissiveIntensity: 0.6, gradientMap: toonRamp(), transparent: true, opacity: 0.88 });
  const water = add(g, new THREE.CircleGeometry(2.95, 36), waterM, 0, 0.66, 0, { rx: -Math.PI / 2, shadow: false });
  add(g, new THREE.CylinderGeometry(0.4, 0.6, 2.2, 14), stone2, 0, 1.4, 0);
  add(g, new THREE.TorusGeometry(0.45, 0.1, 6, 18), stone, 0, 1.2, 0, { rx: Math.PI / 2 });
  const bowl = [[0, 0], [0.5, 0], [1.3, 0.3], [1.4, 0.45], [1.25, 0.45], [0, 0.25]];
  add(g, new THREE.LatheGeometry(bowl.map(([x, y]) => new THREE.Vector2(x, y)), 28), stone, 0, 2.35, 0);
  add(g, new THREE.CircleGeometry(1.2, 24), waterM, 0, 2.77, 0, { rx: -Math.PI / 2, shadow: false });
  const orb = dyn(add(g, new THREE.IcosahedronGeometry(0.55, 2), glowMat(0x7fe3ff, 2.2), 0, 3.5, 0));
  const ring = dyn(add(g, new THREE.TorusGeometry(0.85, 0.05, 6, 24), glowMat(0xf2c14e, 1.8), 0, 3.5, 0, { rx: Math.PI / 2 }));
  const drops = [];
  for (let i = 0; i < 10; i++) drops.push(dyn(add(g, sph(0.07, 8, 6), basic(0xbff0ff), 0, 0, 0, { shadow: false })));
  g.userData.anim = (t) => {
    orb.position.y = 3.5 + Math.sin(t * 1.5) * 0.15;
    ring.rotation.set(Math.PI / 2 + Math.sin(t) * 0.3, t * 0.7, 0);
    ring.position.y = orb.position.y;
    waterM.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.15;
    drops.forEach((d, i) => {
      const k = ((t * 0.8 + i / drops.length) % 1);
      const a = (i / drops.length) * Math.PI * 2;
      const rr = 1.3 + k * 1.2;
      d.position.set(Math.cos(a) * rr, 2.75 + k * 0.4 - k * k * 2.3, Math.sin(a) * rr);
    });
  };
  return finish(g, 0.045, 0.3);
}

export function makeGate() {
  const g = new THREE.Group();
  const stone = mat(0x8c8398), stone2 = mat(0x6c6478);
  for (const s of [-1, 1]) {
    add(g, new THREE.BoxGeometry(2, 0.6, 2), stone2, s * 9.5, 0.3, 0);
    add(g, new THREE.BoxGeometry(1.6, 6.5, 1.6), stone, s * 9.5, 3.5, 0);
    add(g, new THREE.BoxGeometry(2, 0.5, 2), stone2, s * 9.5, 6.9, 0);
    add(g, new THREE.ConeGeometry(1.2, 1.4, 4), mat(0x3b2d7a), s * 9.5, 7.85, 0, { ry: Math.PI / 4 });
    add(g, new THREE.OctahedronGeometry(0.45), glowMat(0xb46bff, 2), s * 9.5, 8.9, 0);
  }
  add(g, new THREE.TorusGeometry(9.5, 0.55, 6, 24, Math.PI), stone, 0, 5.5, 0, { s: [1, 0.36, 1] });
  const sign = group(g, 0, 7.6, 0.4);
  add(sign, new THREE.BoxGeometry(5.4, 1.2, 0.25), mat(0x3b2d7a));
  add(sign, new THREE.BoxGeometry(5.8, 0.18, 0.3), mat(0xf2c14e), 0, 0.62, 0);
  add(sign, new THREE.BoxGeometry(5.8, 0.18, 0.3), mat(0xf2c14e), 0, -0.62, 0);
  add(sign, new THREE.OctahedronGeometry(0.3), glowMat(0xc59bff, 2), 0, 0, 0.18, { s: [1, 1, 0.4] });
  return finish(g, 0.05, 0.4, true);
}

export function makeCrypt() {
  const g = new THREE.Group();
  const stone = mat(0x6e6882), stone2 = mat(0x575170);
  for (let i = 0; i < 3; i++) add(g, new THREE.BoxGeometry(20 - i * 1.2, 0.4, 10 - i * 0.8), stone2, 0, 0.2 + i * 0.4, 0.8 - i * 0.2);
  add(g, new THREE.BoxGeometry(16, 7, 7), stone, 0, 4.7, -0.5);
  const tri = new THREE.Shape();
  tri.moveTo(-9, 0); tri.lineTo(9, 0); tri.lineTo(0, 3.4); tri.closePath();
  add(g, new THREE.ExtrudeGeometry(tri, { depth: 8.4, bevelEnabled: false }), stone2, 0, 8.2, -4.6);
  add(g, new THREE.SphereGeometry(2.4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x4a3e66), 0, 11.2, -0.5);
  add(g, new THREE.OctahedronGeometry(0.5), glowMat(0xc542ff, 2.5), 0, 14, -0.5);
  for (const x of [-6.5, -3.2, 3.2, 6.5]) {
    add(g, new THREE.CylinderGeometry(0.55, 0.6, 7, 12), mat(0x5a5566), x, 4.7, 3.6);
    add(g, new THREE.BoxGeometry(1.4, 0.4, 1.4), stone2, x, 8.3, 3.6);
    add(g, new THREE.BoxGeometry(1.4, 0.4, 1.4), stone2, x, 1.35, 3.6);
  }
  add(g, archGeo(4.8, 6.6, 0.3), stone2, 0, 1.2, 2.95);
  add(g, archGeo(3.9, 6.0, 0.3), glowMat(0x7a2ad0, 1.4), 0, 1.2, 3.05);
  const skull = group(g, 0, 9.4, 3.95);
  add(skull, sph(0.55, 16, 10), mat(0xd8cdb8), 0, 0, 0, { s: [1, 0.9, 0.6] });
  for (const s of [-1, 1]) add(skull, sph(0.14, 10, 8), glowMat(0xc542ff, 2.5), s * 0.2, 0.02, 0.28, { shadow: false });
  const candles = [];
  for (const x of [-4.8, -1.6, 1.6, 4.8]) {
    add(g, new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8), mat(0xe8e0d0), x, 1.45, 4.3);
    candles.push(flame(g, x, 1.7, 4.3, 0.4, [0x9a4dff, 0xc542ff, 0xf0c8ff]));
  }
  g.userData.anim = (t) => candles.forEach(c => c.userData.flicker(t));
  return finish(g, 0.06, 0.5);
}

export function makeGrave() {
  const g = new THREE.Group();
  const stone = mat(0x7a7488);
  add(g, sph(0.6, 12, 8), mat(0x3a3028), 0, 0, 0.6, { s: [0.9, 0.25, 1.4] });
  if (Math.random() < 0.35) {
    add(g, new THREE.BoxGeometry(0.22, 1.3, 0.2), stone, 0, 0.65, 0);
    add(g, new THREE.BoxGeometry(0.8, 0.22, 0.2), stone, 0, 0.92, 0);
  } else {
    add(g, new THREE.BoxGeometry(0.8, 0.8, 0.22), stone, 0, 0.45, 0);
    add(g, new THREE.CylinderGeometry(0.4, 0.4, 0.22, 16, 1, false, 0, Math.PI), stone, 0, 0.85, 0, { rx: Math.PI / 2, rz: Math.PI / 2 });
    add(g, new THREE.BoxGeometry(0.4, 0.06, 0.03), basic(0x3a3448), 0, 0.7, 0.12, { shadow: false });
    add(g, new THREE.BoxGeometry(0.3, 0.06, 0.03), basic(0x3a3448), 0, 0.55, 0.12, { shadow: false });
  }
  add(g, sph(0.14, 8, 6), mat(0x5a8a4a), 0.3, 0.08, 0.1, { s: [1.4, 0.6, 1] });
  g.rotation.z = rnd(-0.12, 0.12);
  return finish(g, 0.03, 0.2, true);
}

export function makeRock(scale = 1, color = 0x6c6776) {
  const g = new THREE.Group();
  add(g, new THREE.DodecahedronGeometry(1, 0), mat(color), 0, 0.3, 0, { s: [1.2, 0.8, 1] });
  add(g, new THREE.DodecahedronGeometry(0.45, 0), mat(lighter(color, 0.1)), 0.9, 0.1, 0.3);
  g.scale.setScalar(scale);
  g.rotation.y = Math.random() * Math.PI;
  return finish(g, 0.04, 0.2, true);
}

export function makeStall(color = 0xa0346a) {
  const g = new THREE.Group();
  const wood = mat(0x7a5236);
  add(g, new THREE.BoxGeometry(3.2, 1.1, 1.3), wood, 0, 0.55, 0);
  add(g, new THREE.BoxGeometry(3.4, 0.12, 1.5), mat(0x5a3a24), 0, 1.12, 0);
  for (const x of [-1.5, 1.5]) for (const z of [-0.55, 0.55]) add(g, new THREE.CylinderGeometry(0.07, 0.07, 3, 6), mat(0x5a3d24), x, 1.5, z);
  const stripes = [mat(color), mat(0xfff0f6)];
  for (let i = 0; i < 6; i++) add(g, new THREE.BoxGeometry(0.62, 0.1, 2.0), stripes[i % 2], -1.55 + i * 0.62, 3.0, 0, { rx: 0.25 });
  for (let i = 0; i < 6; i++) add(g, new THREE.ConeGeometry(0.31, 0.3, 3), stripes[i % 2], -1.55 + i * 0.62, 2.6, 1.0, { rx: Math.PI });
  const colors = [0xff5fa2, 0x5fdc6a, 0x6fd3ff, 0xf2c14e, 0xb46bff];
  colors.forEach((c, i) => {
    const b = group(g, -1.2 + i * 0.6, 1.18, 0.2);
    add(b, sph(0.17, 12, 10), glowMat(c, 1.2), 0, 0.17, 0);
    add(b, new THREE.CylinderGeometry(0.05, 0.06, 0.16, 8), mat(0xe8f4ff), 0, 0.38, 0);
    add(b, new THREE.CylinderGeometry(0.06, 0.06, 0.05, 8), mat(0x7a5236), 0, 0.48, 0);
  });
  add(g, new THREE.CylinderGeometry(0.45, 0.35, 0.6, 14), mat(0x2a2a34), -1.9, 0.3, 0.9);
  add(g, new THREE.CircleGeometry(0.38, 14), glowMat(0x5fdc6a, 1.6), -1.9, 0.61, 0.9, { rx: -Math.PI / 2, shadow: false });
  return finish(g, 0.035, 0.25, true);
}

export function makeBookStand() {
  const g = new THREE.Group();
  const wood = mat(0x5a3d24);
  add(g, new THREE.BoxGeometry(2.6, 3.3, 0.8), wood, 0, 1.65, -0.6);
  add(g, new THREE.BoxGeometry(2.8, 0.15, 0.9), mat(0x4a2e1f), 0, 3.35, -0.6);
  const bookColors = [0x7b3f5e, 0x2e7d6b, 0x3b2d7a, 0xc9a24a, 0x8a3a1c, 0x3a6ea5];
  for (let shelf = 0; shelf < 3; shelf++) {
    add(g, new THREE.BoxGeometry(2.4, 0.06, 0.6), mat(0x4a2e1f), 0, 0.22 + shelf * 0.98, -0.3);
    let x = -1.05;
    for (let i = 0; x < 1.0; i++) {
      const bw = 0.18 + ((i * 7 + shelf * 3) % 4) * 0.04;
      const bh = 0.55 + ((i * 5 + shelf) % 3) * 0.1;
      add(g, new THREE.BoxGeometry(bw, bh, 0.5), mat(bookColors[(i + shelf * 2) % bookColors.length]), x + bw / 2, 0.25 + shelf * 0.98 + bh / 2, -0.28, { rz: i % 5 === 4 ? 0.2 : 0 });
      x += bw + 0.02;
    }
  }
  add(g, new THREE.CylinderGeometry(0.08, 0.3, 1.1, 8), wood, 0, 0.55, 1);
  add(g, new THREE.BoxGeometry(0.8, 0.08, 0.6), wood, 0, 1.12, 1, { rx: -0.3 });
  for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(0.36, 0.04, 0.5), mat(0xfff4dc), s * 0.19, 1.18, 1, { rx: -0.3, rz: -s * 0.08 });
  const glow = dyn(add(g, sph(0.12, 12, 10), glowMat(0x9fe6ff, 2), 0, 1.5, 1.05, { shadow: false }));
  const candle = group(g, -0.9, 3.45, -0.5);
  add(candle, new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8), mat(0xfff4dc), 0, 0.15, 0);
  const fl = flame(candle, 0, 0.3, 0, 0.35);
  g.userData.anim = (t) => {
    glow.position.y = 1.5 + Math.sin(t * 2) * 0.08;
    fl.userData.flicker(t);
  };
  return finish(g, 0.035, 0.25);
}

// ---------------------------------------------------------------- scenery: Emberfall

export function makePortal(color = 0xb46bff) {
  const g = new THREE.Group();
  const stone = mat(0x6c6280), stone2 = mat(0x4e465e);
  for (const s of [-1, 1]) {
    add(g, new THREE.BoxGeometry(1.3, 0.5, 1.3), stone2, s * 2.4, 0.25, 0);
    add(g, new THREE.BoxGeometry(0.9, 4.6, 0.9), stone, s * 2.4, 2.8, 0);
    for (let k = 0; k < 3; k++) add(g, new THREE.BoxGeometry(0.3, 0.3, 0.05), glowMat(color, 2), s * 2.4, 1.4 + k * 1.1, 0.47, { rz: Math.PI / 4, shadow: false });
  }
  add(g, new THREE.TorusGeometry(2.4, 0.45, 6, 24, Math.PI), stone, 0, 5.0, 0);
  add(g, new THREE.OctahedronGeometry(0.4), glowMat(color, 2.4), 0, 7.4, 0);
  const ring = dyn(add(g, new THREE.TorusGeometry(1.8, 0.14, 6, 24), glowMat(color, 2.5), 0, 2.9, 0));
  const swirlM = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const swirl = dyn(add(g, new THREE.CircleGeometry(1.7, 32), swirlM, 0, 2.9, 0, { shadow: false }));
  add(g, new THREE.CircleGeometry(1.0, 28), new THREE.MeshBasicMaterial({ color: lighter(color, 0.6), transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 2.9, 0.01, { shadow: false });
  const inner = group(g, 0, 2.9, 0.03);
  for (let k = 0; k < 3; k++) add(inner, new THREE.TorusGeometry(0.4 + k * 0.35, 0.05, 6, 24, Math.PI * 0.9), basic(0xffffff), 0, 0, 0, { rz: k * 2.1, shadow: false });
  const sparks = [];
  for (let i = 0; i < 10; i++) sparks.push(dyn(add(g, new THREE.OctahedronGeometry(0.1), basic(0xffffff), 0, 0, 0, { shadow: false })));
  g.userData.anim = (t) => {
    ring.rotation.z = t;
    inner.rotation.z = -t * 2.2;
    swirlM.opacity = 0.45 + Math.sin(t * 3) * 0.15;
    swirl.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
    sparks.forEach((s, i) => {
      const a = -t * 2 + (i / sparks.length) * Math.PI * 2;
      const r = 1.2 + Math.sin(t * 3 + i) * 0.4;
      s.position.set(Math.cos(a) * r, 2.9 + Math.sin(a) * r, 0.1);
    });
  };
  return finish(g, 0.045, 0.4);
}

export function makeTent(color = 0x7a4a24) {
  const g = new THREE.Group();
  const stripes = [mat(color), mat(lighter(color, 0.45))];
  for (let i = 0; i < 8; i++) {
    add(g, new THREE.ConeGeometry(2.6, 3.2, 8, 1, false, (i / 8) * Math.PI * 2, Math.PI / 4), stripes[i % 2], 0, 1.6, 0);
  }
  add(g, new THREE.BoxGeometry(1.1, 1.5, 0.1), mat(0x2a1a14), 0, 0.75, 2.2, { rx: -0.45 });
  add(g, new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6), mat(0x5a3d24), 0, 3.6, 0);
  const flag = dyn(add(g, new THREE.PlaneGeometry(0.7, 0.4), mat(0xf2c14e, { side: THREE.DoubleSide }), 0.37, 4.0, 0));
  g.userData.anim = (t) => { flag.rotation.y = Math.sin(t * 3 + color) * 0.3; };
  return finish(g, 0.04, 0.4);
}

export function makeCampfire() {
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    add(g, new THREE.DodecahedronGeometry(0.28, 0), mat(0x5a5560), Math.cos(a) * 0.85, 0.15, Math.sin(a) * 0.85);
  }
  for (let i = 0; i < 3; i++) add(g, new THREE.CylinderGeometry(0.11, 0.11, 1.3, 7), mat(0x4a2e1f), 0, 0.2, 0, { rz: Math.PI / 2, ry: (i / 3) * Math.PI });
  const fires = [flame(g, 0, 0.25, 0, 1.6), flame(g, 0.22, 0.2, 0.1, 1.0), flame(g, -0.2, 0.2, -0.1, 1.1)];
  const embers = [];
  for (let i = 0; i < 6; i++) embers.push(dyn(add(g, sph(0.04, 6, 4), basic(0xffc040), 0, 0, 0, { shadow: false })));
  g.userData.anim = (t) => {
    fires.forEach(f => f.userData.flicker(t));
    embers.forEach((e, i) => {
      const k = (t * 0.6 + i / embers.length) % 1;
      e.position.set(Math.sin(i * 2.3 + t) * 0.3 * k, 0.5 + k * 2.2, Math.cos(i * 1.7 + t) * 0.3 * k);
      e.scale.setScalar(1 - k);
    });
  };
  return finish(g, 0.035, 0.2);
}

export function makeLavaPool(r = 3) {
  const g = new THREE.Group();
  const lavaM = ownMat(0xff5a10, { emissive: 0xff3a00, emissiveIntensity: 1.6 });
  add(g, new THREE.CircleGeometry(r, 24), lavaM, 0, 0.05, 0, { rx: -Math.PI / 2, shadow: false });
  add(g, new THREE.CircleGeometry(r * 0.55, 20), glowMat(0xffc040, 2.2), 0, 0.06, 0, { rx: -Math.PI / 2, shadow: false });
  const n = Math.round(r * 5);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    add(g, new THREE.DodecahedronGeometry(rnd(0.25, 0.45), 0), mat(0x241816), Math.cos(a) * (r + 0.1), 0.1, Math.sin(a) * (r + 0.1), { s: [1, 0.6, 1] });
  }
  const bubbles = [0, 1, 2].map(() => dyn(add(g, sph(0.18, 10, 8), glowMat(0xffa040, 2), 0, 0, 0, { shadow: false })));
  g.userData.anim = (t) => {
    lavaM.emissiveIntensity = 1.4 + Math.sin(t * 2 + r) * 0.4;
    bubbles.forEach((b, i) => {
      const k = (t * 0.5 + i / 3 + r) % 1;
      b.position.set(Math.cos(i * 2.1 + r) * r * 0.5, 0.05 + k * 0.2, Math.sin(i * 2.1 + r) * r * 0.5);
      b.scale.setScalar(k < 0.8 ? k : (1 - k) * 4);
    });
  };
  return finish(g, 0.035, 0.3);
}

export function makeSpire(h = 5) {
  const g = new THREE.Group();
  const obs = mat(0x3c3252), vein = glowMat(0xff5a10, 2);
  add(g, new THREE.ConeGeometry(h * 0.24, h, 6), obs, 0, h / 2, 0, { rz: rnd(-0.1, 0.1) });
  add(g, new THREE.ConeGeometry(h * 0.13, h * 0.55, 6), obs, h * 0.22, h * 0.27, 0.1, { rz: -0.35 });
  add(g, new THREE.ConeGeometry(h * 0.1, h * 0.4, 6), obs, -h * 0.18, h * 0.2, -0.1, { rz: 0.4 });
  add(g, new THREE.BoxGeometry(0.07, h * 0.45, 0.07), vein, h * 0.06, h * 0.3, h * 0.12, { rz: 0.1, shadow: false, noOutline: true });
  return finish(g, 0.04, 0.3, true);
}

export function makeFireTree(scale = 1) {
  const g = makeDeadTree(scale, false);
  const leafs = [];
  for (const [x, y, z] of [[1.1, 3.0, 0.2], [-1.0, 3.3, -0.2], [0.4, 3.9, -0.4], [-0.8, 2.3, 0.5], [0.2, 3.2, 0.1]]) {
    leafs.push(flame(g, x, y - 0.3, z, 2.0));
  }
  g.userData.anim = (t) => leafs.forEach(l => l.userData.flicker(t));
  return g;
}

export function makeCliff(w, h, d, color = 0x3a2420) {
  const g = new THREE.Group();
  const c = mat(color), c2 = mat(lighter(color, 0.14)), c3 = mat(lighter(color, 0.3));
  const rw = (w + d) / 4;
  // stacked, slightly twisted rock prisms with a craggy cap
  add(g, new THREE.CylinderGeometry(rw * 1.0, rw * 1.2, h * 0.45, 6), c, 0, h * 0.225, 0, { ry: rnd(0, 1) });
  add(g, new THREE.CylinderGeometry(rw * 0.82, rw * 1.0, h * 0.32, 6), c2, rnd(-0.3, 0.3), h * 0.6, rnd(-0.3, 0.3), { ry: rnd(0, 1) });
  add(g, new THREE.CylinderGeometry(rw * 0.55, rw * 0.8, h * 0.22, 5), c, rnd(-0.3, 0.3), h * 0.86, rnd(-0.3, 0.3), { ry: rnd(0, 1) });
  add(g, new THREE.DodecahedronGeometry(rw * 0.6, 0), c3, 0, h * 0.98, 0, { s: [1, 0.45, 1] });
  for (let i = 0; i < 4; i++) {
    const a = rnd(0, Math.PI * 2);
    add(g, new THREE.DodecahedronGeometry(rnd(0.5, 1.0), 0), i % 2 ? c2 : c3, Math.cos(a) * rw * 1.15, rnd(0.2, 0.8), Math.sin(a) * rw * 1.15, { s: [1, 0.7, 1] });
  }
  return finish(g, 0.05, 0.5, true);
}

export function makeThrone() {
  const g = new THREE.Group();
  const rock = mat(0x4e3434), rock2 = mat(0x684440), gold = mat(0xf2c14e);
  const fires = [];
  add(g, new THREE.BoxGeometry(7, 0.6, 5), rock2, 0, 0.3, 0);
  add(g, new THREE.BoxGeometry(6, 1, 4), rock, 0, 1.1, -0.2);
  add(g, new THREE.BoxGeometry(4.8, 7.5, 1.2), rock, 0, 5, -1.6);
  add(g, new THREE.BoxGeometry(5.2, 0.4, 1.4), gold, 0, 8.8, -1.6);
  for (const s of [-1, 1]) {
    add(g, new THREE.BoxGeometry(0.9, 2.6, 3.2), rock2, s * 2.5, 2.4, -0.2);
    add(g, sph(0.5, 14, 10), gold, s * 2.5, 3.8, 1.1);
    fires.push(flame(g, s * 2.5, 4.0, -0.2, 2.6));
  }
  fires.push(flame(g, 0, 9.0, -1.6, 4.2));
  add(g, new THREE.CircleGeometry(1.2, 20), basic(0xff7a1a), 0, 5.2, -0.98, { shadow: false });
  add(g, new THREE.CircleGeometry(0.7, 20), basic(0xffd040), 0, 5.2, -0.96, { shadow: false });
  g.userData.anim = (t) => fires.forEach(f => f.userData.flicker(t));
  return finish(g, 0.06, 0.4);
}

// A lava vent: a cracked obsidian mound that huffs flame and embers.
export function makeLavaVent(scale = 1) {
  const g = new THREE.Group();
  const obs = mat(0x2f1d1a), obs2 = mat(0x44291f);
  add(g, new THREE.ConeGeometry(1.1, 1.5, 7), obs, 0, 0.7, 0, { s: [1, 1, 0.85] });
  add(g, new THREE.ConeGeometry(0.55, 0.9, 6), obs2, 0.7, 0.4, 0.35, { rz: -0.3 });
  add(g, new THREE.ConeGeometry(0.45, 0.7, 6), obs2, -0.65, 0.32, -0.2, { rz: 0.35 });
  // the glowing throat and cracks
  add(g, new THREE.CircleGeometry(0.34, 14), basic(0xffc040), 0, 1.42, 0, { rx: -Math.PI / 2, shadow: false, noOutline: true });
  add(g, new THREE.CircleGeometry(0.44, 14), basic(0xff5a10), 0, 1.41, 0, { rx: -Math.PI / 2, shadow: false, noOutline: true });
  for (const [x, z, rz, len] of [[0.5, 0.55, 0.7, 0.5], [-0.55, 0.4, -0.5, 0.4], [0.1, -0.75, 0.15, 0.45], [-0.3, -0.5, -0.9, 0.35]]) {
    add(g, new THREE.BoxGeometry(0.05, len, 0.04), basic(0xff6a1a), x, 0.55, z, { rz, rx: 0.5, shadow: false, noOutline: true });
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    add(g, new THREE.DodecahedronGeometry(rnd(0.18, 0.3), 0), obs2, Math.cos(a) * 1.05, 0.08, Math.sin(a) * 1.0, { s: [1, 0.55, 1] });
  }
  const jet = flame(g, 0, 1.38, 0, 0.75);
  // dark smoke that swells as it rises, and embers that spit higher and fade
  const smoke = [0, 1, 2].map(() => dyn(add(g, sph(0.22, 10, 8), mat(0x544846, { transparent: true, opacity: 0.55, depthWrite: false }), 0, 1.6, 0, { shadow: false, noOutline: true })));
  const embers = [0, 1, 2, 3].map(() => dyn(add(g, new THREE.OctahedronGeometry(0.05), basic(0xffc040), 0, 1.5, 0, { shadow: false, noOutline: true })));
  g.scale.setScalar(scale);
  g.userData.anim = (t) => {
    jet.userData.flicker(t * 1.4);
    // every few seconds the vent coughs: the flame leaps up, then settles
    const cough = Math.max(0, Math.sin(t * 0.8)) ** 6;
    jet.scale.set(1 + cough * 0.3, 1 + cough * 1.4, 1 + cough * 0.3);
    smoke.forEach((m, i) => {
      const k = (t * 0.22 + i / 3) % 1;
      m.position.set(Math.sin(i * 5 + t * 0.3) * 0.25 + k * 0.4, 1.7 + k * 2.4, Math.cos(i * 3 + t * 0.2) * 0.2);
      m.scale.setScalar((0.5 + k * 1.6) * (k > 0.8 ? (1 - k) * 5 : 1));
      m.rotation.set(t * 0.3 + i, t * 0.2, 0);
    });
    embers.forEach((m, i) => {
      const k = (t * 0.6 + i * 0.27) % 1;
      m.position.set(Math.sin(i * 7) * 0.3 * k, 1.6 + k * 2.8, Math.cos(i * 11) * 0.3 * k);
      m.scale.setScalar(1 - k * 0.8);
    });
  };
  return finish(g, 0.04, 0.3);
}

// A ruined obsidian pillar of the old Emberfall court, runes still warm.
export function makeRuinedPillar(h = 4, broken = Math.random() < 0.6) {
  const g = new THREE.Group();
  const stone = mat(0x3a2420), stone2 = mat(0x4a2e26), rune = glowMat(0xff6a1a, 1.8);
  add(g, new THREE.CylinderGeometry(0.85, 1.0, 0.5, 8), stone2, 0, 0.25, 0);
  add(g, new THREE.CylinderGeometry(0.62, 0.72, h, 8), stone, 0, 0.5 + h / 2, 0, { ry: 0.4 });
  if (broken) {
    add(g, new THREE.ConeGeometry(0.62, 0.7, 8), stone, 0, 0.5 + h + 0.3, 0, { rx: Math.PI, ry: 0.4, s: [1, 1, 0.9] });
    // the fallen top, half sunk beside it
    add(g, new THREE.CylinderGeometry(0.6, 0.6, 1.4, 8), stone2, 1.15, 0.35, 0.5, { rz: 1.25, ry: 0.7 });
  } else {
    add(g, new THREE.BoxGeometry(1.5, 0.35, 1.5), stone2, 0, 0.6 + h, 0, { ry: 0.4 });
    add(g, new THREE.OctahedronGeometry(0.2), glowMat(0xff8a2b, 2.2), 0, 0.95 + h, 0, { shadow: false });
  }
  // glowing glyph bands
  for (const y of [1.1, h * 0.55 + 0.4]) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      add(g, new THREE.BoxGeometry(0.16, 0.22, 0.03), rune, Math.cos(a) * 0.68, y, Math.sin(a) * 0.68, { ry: -a + Math.PI / 2, shadow: false, noOutline: true });
    }
  }
  return finish(g, 0.045, 0.3, true);
}

// ---------------------------------------------------------------- skilling: resource nodes

export function makeOreRock(vein = 0xd4803a) {
  const g = new THREE.Group();
  const base = 0x6c6776;
  add(g, new THREE.DodecahedronGeometry(0.95, 0), mat(base), 0, 0.55, 0, { s: [1.25, 0.85, 1.05], ry: rnd(0, 3) });
  add(g, new THREE.DodecahedronGeometry(0.55, 0), mat(darker(base, 0.85)), 0.8, 0.3, 0.35);
  add(g, new THREE.DodecahedronGeometry(0.45, 0), mat(lighter(base, 0.12)), -0.8, 0.28, -0.25);
  const ore = mat(vein, { emissive: vein, emissiveIntensity: 0.3 });
  for (const [x, y, z, r] of [[0.35, 1.05, 0.45, 0.17], [-0.45, 0.85, 0.62, 0.14], [0.85, 0.62, 0.55, 0.13], [-0.1, 1.2, -0.25, 0.15], [0.55, 0.6, -0.7, 0.13], [-0.9, 0.55, 0.25, 0.12], [0.1, 0.5, 0.95, 0.12]]) {
    add(g, new THREE.OctahedronGeometry(r), ore, x, y, z, { ry: x * 3, rx: y * 2 });
  }
  return finish(g, 0.035, 0.12, true);
}

export function makeRubble() {
  const g = new THREE.Group();
  const c = mat(0x5a5664);
  for (const [x, z, r] of [[0, 0, 0.45], [0.55, 0.3, 0.3], [-0.5, -0.2, 0.35], [0.2, -0.55, 0.25]]) add(g, new THREE.DodecahedronGeometry(r, 0), c, x, r * 0.5, z, { s: [1, 0.6, 1] });
  return finish(g, 0.03, 0.12, true);
}

export function makeStump(bark = 0x6b4a2b) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.38, 0.5, 0.55, 9), mat(bark), 0, 0.27, 0);
  add(g, new THREE.CylinderGeometry(0.34, 0.34, 0.04, 9), mat(0xd8b884), 0, 0.56, 0);
  add(g, new THREE.TorusGeometry(0.2, 0.02, 4, 12), mat(0xa88454), 0, 0.585, 0, { rx: Math.PI / 2, noOutline: true });
  for (const s of [-1, 1]) limb(g, V3(0, 0.15, 0), V3(s * 0.65, 0, s * 0.2), 0.14, 0.05, mat(bark), 5);
  return finish(g, 0.03, 0.12, true);
}

export function makeOak(scale = 1) {
  const g = new THREE.Group();
  const bark = mat(0x5e4028);
  limb(g, V3(0, 0, 0), V3(0, 2.2, 0), 0.45, 0.32, bark, 9);
  limb(g, V3(0, 1.8, 0), V3(0.9, 2.9, 0.2), 0.2, 0.12, bark, 7);
  limb(g, V3(0, 2, 0), V3(-0.85, 3.0, -0.2), 0.2, 0.12, bark, 7);
  for (const s of [-1, 1]) limb(g, V3(0, 0.3, 0), V3(s * 0.75, 0, s * 0.3), 0.18, 0.06, bark, 5);
  const L = mat(0x4f8a3a), L2 = mat(0x5f9d44), L3 = mat(0x437a32);
  for (const [x, y, z, r, m] of [[0, 3.6, 0, 1.55, L], [1.2, 3.2, 0.3, 1.1, L2], [-1.1, 3.3, -0.2, 1.15, L3], [0.3, 3.1, 1.1, 1.0, L2], [-0.3, 3.2, -1.1, 1.0, L], [0.2, 4.5, 0.1, 1.0, L2]]) {
    add(g, new THREE.IcosahedronGeometry(r, 1), m, x, y, z);
  }
  for (let i = 0; i < 5; i++) add(g, sph(0.12, 8, 6), mat(0x8a5a2a), rnd(-1.3, 1.3), rnd(2.6, 3.6), rnd(-1.2, 1.2), { shadow: false });
  g.scale.setScalar(scale);
  return finish(g, 0.04, 0.4, true);
}

export function makeWillow(scale = 1) {
  const g = new THREE.Group();
  const bark = mat(0x6a5a40);
  limb(g, V3(0, 0, 0), V3(0.2, 2.8, 0), 0.4, 0.26, bark, 8);
  const L = mat(0x8ab060), L2 = mat(0x9cc070);
  add(g, new THREE.IcosahedronGeometry(1.5, 1), L, 0.2, 3.5, 0, { s: [1.25, 0.7, 1.25] });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    add(g, new THREE.ConeGeometry(0.34, 2.4, 6), i % 2 ? L : L2, 0.2 + Math.cos(a) * 1.4, 2.35, Math.sin(a) * 1.4, { rx: Math.PI + Math.sin(a) * 0.15, rz: Math.cos(a) * 0.15 });
  }
  g.scale.setScalar(scale);
  return finish(g, 0.04, 0.4, true);
}

export function makeElder(scale = 1) {
  const g = new THREE.Group();
  const bark = mat(0x3a2a3a);
  limb(g, V3(0, 0, 0), V3(0.3, 3, 0), 0.75, 0.45, bark, 9);
  limb(g, V3(0.3, 2.6, 0), V3(1.7, 4.2, 0.3), 0.3, 0.16, bark, 7);
  limb(g, V3(0.2, 2.8, 0), V3(-1.5, 4.4, -0.3), 0.3, 0.16, bark, 7);
  limb(g, V3(0.3, 3, 0), V3(0.2, 5.1, 0.8), 0.26, 0.14, bark, 7);
  for (const [x, z] of [[1.2, 0.4], [-1.1, 0.5], [0.3, -1.2], [-0.4, 1.1]]) limb(g, V3(0, 0.5, 0), V3(x, 0, z), 0.3, 0.08, bark, 6);
  const L = mat(0x5a3a8a), L2 = mat(0x7a4ab0), L3 = mat(0x4a2a70);
  for (const [x, y, z, r, m] of [[0.3, 5.2, 0.2, 1.7, L], [1.8, 4.5, 0.4, 1.3, L2], [-1.6, 4.7, -0.3, 1.35, L3], [0.4, 4.4, 1.5, 1.2, L2], [0, 4.5, -1.4, 1.2, L], [0.4, 6.3, 0.2, 1.1, L2]]) {
    add(g, new THREE.IcosahedronGeometry(r, 1), m, x, y, z);
  }
  for (let i = 0; i < 10; i++) add(g, sph(0.09, 8, 6), basic(0xe0b8ff), rnd(-2, 2), rnd(3.8, 6.8), rnd(-1.8, 1.8), { shadow: false });
  g.scale.setScalar(scale);
  return finish(g, 0.045, 0.4, true);
}

export function makeDragonwood(scale = 1) {
  const g = new THREE.Group();
  const bark = mat(0x5a1a1a);
  limb(g, V3(0, 0, 0), V3(-0.2, 3.2, 0.1), 0.55, 0.3, bark, 8);
  limb(g, V3(-0.2, 2.8, 0.1), V3(1.2, 4.3, 0.2), 0.22, 0.1, bark, 6);
  limb(g, V3(-0.2, 3.0, 0.1), V3(-1.3, 4.5, -0.2), 0.22, 0.1, bark, 6);
  const L = mat(0xa0202a), L2 = mat(0xc0392b);
  for (const [x, y, z, r, m] of [[-0.2, 4.6, 0.1, 1.4, L], [1.3, 4.3, 0.2, 1.0, L2], [-1.4, 4.5, -0.2, 1.05, L2], [0, 5.6, 0, 0.9, L]]) {
    add(g, new THREE.OctahedronGeometry(r, 1), m, x, y, z, { ry: x });
  }
  // thorny spikes along the trunk
  for (let i = 0; i < 7; i++) {
    const a = i * 2.1, y = 0.6 + i * 0.35;
    add(g, new THREE.ConeGeometry(0.08, 0.45, 5), mat(0xf0e0c0), Math.cos(a) * 0.42, y, Math.sin(a) * 0.42, { rz: -Math.cos(a) * 1.2, rx: Math.sin(a) * 1.2 });
  }
  for (let i = 0; i < 6; i++) add(g, sph(0.1, 8, 6), basic(0xffb040), rnd(-1.6, 1.6), rnd(3.8, 6), rnd(-1.2, 1.2), { shadow: false });
  g.scale.setScalar(scale);
  return finish(g, 0.045, 0.4, true);
}

export function makeHerb(color = 0x9fe6c0) {
  const g = new THREE.Group();
  const leaf = mat(0x4f9a4a), leaf2 = mat(0x6ab85a);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    add(g, sph(0.2, 8, 6), i % 2 ? leaf : leaf2, Math.cos(a) * 0.22, 0.18, Math.sin(a) * 0.22, { s: [0.7, 0.35, 1.4], ry: -a, rx: 0.3 });
  }
  const bloom = mat(color, { emissive: color, emissiveIntensity: 0.35 });
  for (const [x, z, h] of [[0, 0, 0.55], [0.18, 0.1, 0.42], [-0.15, -0.12, 0.46], [0.05, -0.2, 0.38]]) {
    add(g, new THREE.CylinderGeometry(0.018, 0.018, h, 4), leaf, x, h / 2, z, { noOutline: true });
    add(g, sph(0.08, 8, 6), bloom, x, h + 0.04, z);
  }
  return finish(g, 0.02, 0.1, true);
}

export function makeMushroom(color = 0x6fd3ff) {
  const g = new THREE.Group();
  const stem = mat(0xf0e6d0), cap = mat(color, { emissive: color, emissiveIntensity: 0.55 });
  for (const [x, z, s] of [[0, 0, 1], [0.32, 0.15, 0.7], [-0.28, 0.2, 0.6], [0.1, -0.3, 0.55]]) {
    add(g, new THREE.CylinderGeometry(0.07 * s, 0.09 * s, 0.4 * s, 8), stem, x, 0.2 * s, z);
    add(g, new THREE.SphereGeometry(0.22 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cap, x, 0.38 * s, z);
    add(g, sph(0.035 * s, 6, 4), basic(0xffffff), x + 0.08 * s, 0.52 * s, z + 0.08 * s, { shadow: false });
  }
  return finish(g, 0.02, 0.08, true);
}

export function makeBerryBush(full = true) {
  const g = new THREE.Group();
  const L = mat(0x3f7a3a), L2 = mat(0x4f8a44);
  for (const [x, y, z, r, m] of [[0, 0.45, 0, 0.55, L], [0.4, 0.35, 0.15, 0.4, L2], [-0.38, 0.35, -0.1, 0.42, L2], [0.05, 0.3, 0.42, 0.38, L]]) {
    add(g, new THREE.IcosahedronGeometry(r, 1), m, x, y, z);
  }
  if (full) {
    const berry = mat(0x6a5ad0, { emissive: 0x3a2a90, emissiveIntensity: 0.4 });
    for (let i = 0; i < 12; i++) {
      const a = rnd(0, Math.PI * 2), y = rnd(0.25, 0.9), r = 0.5 - Math.abs(y - 0.5) * 0.3;
      add(g, sph(0.07, 8, 6), berry, Math.cos(a) * r, y, Math.sin(a) * r, { shadow: false, noOutline: true });
    }
  }
  return finish(g, 0.025, 0.12, true);
}

export function makeSprout() {
  const g = new THREE.Group();
  add(g, sph(0.3, 10, 6), mat(0x5a4230), 0, 0, 0, { s: [1, 0.35, 1] });
  for (const s of [-1, 1]) add(g, sph(0.08, 8, 6), mat(0x6ab85a), s * 0.06, 0.15, 0, { s: [1.4, 0.4, 0.7], rz: s * 0.5 });
  return finish(g, 0.02, 0.1, true);
}

// Ripples and a fish that leaps now and then. water: 'water' | 'lava' | 'ice'
export function makeFishSpot(water = 'water') {
  const g = new THREE.Group();
  const color = water === 'lava' ? 0xffc040 : water === 'ice' ? 0xffffff : water === 'cloud' ? 0xf0e8ff : water === 'soul' ? 0xe8c0ff : 0xdff6ff;
  const rings = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.58, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.13;
    g.add(m);
    return m;
  });
  const fish = group(g);
  const fc = water === 'lava' ? 0xff5a1a : water === 'ice' ? 0xbfe8ff : water === 'cloud' ? 0xc8b8ff : water === 'soul' ? 0xd06aff : 0x7ab0d0;
  add(fish, sph(0.16, 10, 8), mat(fc), 0, 0, 0, { s: [0.55, 0.8, 1.6] });
  add(fish, new THREE.ConeGeometry(0.14, 0.25, 4), mat(darker(fc, 0.8)), 0, 0, -0.32, { rx: -Math.PI / 2, s: [0.3, 1, 1] });
  const bubbles = [0, 1, 2, 3].map(() => add(g, sph(0.05, 6, 4), basic(color), 0, 0, 0, { shadow: false }));
  const seed = Math.random() * 10;
  g.userData.anim = (t) => {
    rings.forEach((r, i) => {
      const k = (t * 0.5 + i / 3 + seed) % 1;
      r.scale.setScalar(0.6 + k * 2.2);
      r.material.opacity = 0.65 * (1 - k);
    });
    const j = (t * 0.3 + seed) % 1;
    fish.visible = j < 0.12;
    if (fish.visible) {
      const k = j / 0.12;
      fish.position.set(Math.sin(seed) * 0.4, 0.1 + Math.sin(k * Math.PI) * 0.9, -0.6 + k * 1.2);
      fish.rotation.x = -1.2 + k * 2.4;
    }
    bubbles.forEach((b, i) => {
      const k = (t * 0.8 + i / 4 + seed) % 1;
      b.position.set(Math.cos(i * 1.7 + seed) * 0.35, 0.1 + k * 0.25, Math.sin(i * 2.3 + seed) * 0.35);
      b.scale.setScalar(k < 0.85 ? 1 : 0.01);
    });
  };
  return g;
}

// ---------------------------------------------------------------- skilling: crafting stations

export function makeFurnace() {
  const g = new THREE.Group();
  const brick = mat(0x8a6a5a), brick2 = mat(0x6e5446), dark = mat(0x2a2020);
  add(g, new THREE.BoxGeometry(2.4, 2.2, 2), brick, 0, 1.1, 0);
  add(g, new THREE.BoxGeometry(2.6, 0.3, 2.2), brick2, 0, 2.35, 0);
  add(g, new THREE.CylinderGeometry(0.4, 0.5, 2.2, 8), brick2, 0.5, 3.5, -0.4);
  add(g, new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8), dark, 0.5, 4.6, -0.4);
  add(g, archGeo(1.1, 1.3, 0.1), dark, 0, 0.4, 0.97);
  add(g, archGeo(0.9, 1.05, 0.05), basic(0xff7a1a), 0, 0.45, 1.02, { shadow: false });
  for (let i = 0; i < 5; i++) add(g, new THREE.BoxGeometry(0.5, 0.24, 0.1), brick2, rnd(-0.9, 0.9), rnd(0.3, 2.0), 1.01, { noOutline: true });
  const fires = [flame(g, 0, 0.45, 0.85, 1.4), flame(g, 0.25, 0.45, 0.8, 0.9), flame(g, -0.25, 0.45, 0.8, 1.0)];
  const smoke = [0, 1, 2].map(() => dyn(add(g, sph(0.25, 8, 6), mat(0x9a9aa8, { transparent: true, opacity: 0.5 }), 0.5, 4.8, -0.4, { shadow: false })));
  g.userData.anim = (t) => {
    fires.forEach(f => f.userData.flicker(t));
    smoke.forEach((s, i) => {
      const k = (t * 0.35 + i / 3) % 1;
      s.position.set(0.5 + Math.sin(t + i) * 0.3 * k, 4.8 + k * 2.5, -0.4 + k * 0.4);
      s.scale.setScalar(0.6 + k * 1.6);
      s.material.opacity = 0.5 * (1 - k);
    });
  };
  return finish(g, 0.04, 0.2);
}

export function makeAnvil() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.55, 0.65, 0.9, 10), mat(0x6b4a2b), 0, 0.45, 0);
  const iron = mat(0x3a3a48), iron2 = mat(0x55556a);
  add(g, new THREE.BoxGeometry(0.5, 0.35, 0.4), iron, 0, 1.07, 0);
  add(g, new THREE.BoxGeometry(1.2, 0.3, 0.55), iron2, 0, 1.38, 0);
  add(g, new THREE.ConeGeometry(0.2, 0.6, 8), iron2, -0.85, 1.38, 0, { rz: Math.PI / 2 });
  const hammer = group(g, 0.35, 1.58, 0.15);
  hammer.rotation.y = 0.6;
  add(hammer, new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), mat(0x7a5230), 0, 0.05, 0, { rz: Math.PI / 2 });
  add(hammer, new THREE.BoxGeometry(0.16, 0.2, 0.2), iron, 0.35, 0.05, 0);
  add(g, new THREE.BoxGeometry(0.5, 0.08, 0.14), glowMat(0xff7a1a, 1.5), 0.2, 1.57, -0.15);
  return finish(g, 0.035, 0.1, true);
}

export function makeRange() {
  const g = new THREE.Group();
  const stone = mat(0x6a6470);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    add(g, new THREE.DodecahedronGeometry(0.3, 0), stone, Math.cos(a) * 0.9, 0.2, Math.sin(a) * 0.9);
  }
  for (let i = 0; i < 3; i++) add(g, new THREE.CylinderGeometry(0.1, 0.1, 1.2, 7), mat(0x4a2e1f), 0, 0.18, 0, { rz: Math.PI / 2, ry: (i / 3) * Math.PI });
  const iron = mat(0x2b2733);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    limb(g, V3(Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1), V3(0, 2.1, 0), 0.04, 0.04, iron, 5);
  }
  add(g, new THREE.CylinderGeometry(0.015, 0.015, 0.7, 4), iron, 0, 1.75, 0, { noOutline: true });
  add(g, new THREE.SphereGeometry(0.5, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), iron, 0, 1.35, 0);
  add(g, new THREE.TorusGeometry(0.5, 0.05, 6, 18), iron, 0, 1.35, 0, { rx: Math.PI / 2 });
  const soup = dyn(add(g, new THREE.CircleGeometry(0.46, 18), mat(0xd08a3a, { emissive: 0x6a3010, emissiveIntensity: 0.4 }), 0, 1.3, 0, { rx: -Math.PI / 2, shadow: false }));
  const fires = [flame(g, 0, 0.2, 0, 1.3), flame(g, 0.2, 0.18, 0.1, 0.9), flame(g, -0.2, 0.18, -0.1, 0.9)];
  g.userData.anim = (t) => { fires.forEach(f => f.userData.flicker(t)); soup.position.y = 1.3 + Math.sin(t * 5) * 0.015; };
  return finish(g, 0.035, 0.12);
}

function table(g, w = 2.2, d = 1.1, h = 1.0, color = 0x7a5236) {
  const wood = mat(color), leg = mat(darker(color, 0.8));
  add(g, new THREE.BoxGeometry(w, 0.14, d), wood, 0, h, 0);
  for (const x of [-w / 2 + 0.15, w / 2 - 0.15]) for (const z of [-d / 2 + 0.12, d / 2 - 0.12]) add(g, new THREE.BoxGeometry(0.12, h, 0.12), leg, x, h / 2, z);
}

export function makeAlchemyTable() {
  const g = new THREE.Group();
  table(g, 2.2, 1.1, 1.0, 0x5a3d6a);
  const glass = [0xff5fa2, 0x3a7ae0, 0x5fdc6a, 0xf2c14e];
  glass.forEach((c, i) => {
    const x = -0.85 + i * 0.28;
    add(g, sph(0.12, 10, 8), mat(c, { emissive: c, emissiveIntensity: 0.6 }), x, 1.2, 0.25);
    add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.16, 6), mat(0xdff6ff), x, 1.36, 0.25, { noOutline: true });
  });
  add(g, new THREE.CylinderGeometry(0.28, 0.22, 0.4, 10), mat(0x2b2733), 0.55, 1.28, -0.05);
  const liquid = dyn(add(g, new THREE.CircleGeometry(0.25, 14), basic(0x9aff6a), 0.55, 1.47, -0.05, { rx: -Math.PI / 2, shadow: false }));
  const bubbles = [0, 1, 2].map(() => dyn(add(g, sph(0.05, 6, 4), basic(0xc8ffb0), 0.55, 1.5, -0.05, { shadow: false })));
  add(g, new THREE.BoxGeometry(0.5, 0.08, 0.35), mat(0x8a3a3a), -0.2, 1.11, -0.25, { ry: 0.3 });
  add(g, new THREE.BoxGeometry(0.46, 0.04, 0.3), mat(0xf0e6d0), -0.2, 1.17, -0.25, { ry: 0.3, noOutline: true });
  g.userData.anim = (t) => {
    liquid.scale.setScalar(1 + Math.sin(t * 4) * 0.05);
    bubbles.forEach((b, i) => {
      const k = (t * 0.9 + i / 3) % 1;
      b.position.set(0.55 + Math.cos(i * 2) * 0.12, 1.48 + k * 0.4, -0.05 + Math.sin(i * 2) * 0.12);
      b.scale.setScalar(1 - k);
    });
  };
  return finish(g, 0.03, 0.1);
}

export function makeWorkbench() {
  const g = new THREE.Group();
  table(g, 2.4, 1.1, 0.95, 0x8a6236);
  add(g, new THREE.BoxGeometry(0.9, 0.08, 0.35), mat(0xc9a06a), -0.4, 1.07, 0.15, { ry: 0.15 });
  const saw = group(g, 0.55, 1.1, 0.1);
  saw.rotation.set(-Math.PI / 2, 0, 0.3);
  add(saw, new THREE.BoxGeometry(0.7, 0.22, 0.02), mat(0xb8bcc8));
  add(saw, new THREE.BoxGeometry(0.2, 0.26, 0.06), mat(0x7a3a2a), -0.42, 0.02, 0);
  for (let i = 0; i < 3; i++) add(g, new THREE.CylinderGeometry(0.16, 0.16, 1.1, 8), mat(0x9a6a3a), 1.6, 0.18 + (i === 2 ? 0.28 : 0), -0.2 + i * 0.3 - (i === 2 ? 0.45 : 0), { rx: Math.PI / 2 });
  add(g, new THREE.BoxGeometry(0.2, 0.3, 0.3), mat(0x3a3a48), -1.0, 1.2, -0.3);
  return finish(g, 0.035, 0.1, true);
}

// ---------------------------------------------------------------- meadow scenery

export function makePond(r = 9) {
  const g = new THREE.Group();
  add(g, new THREE.CircleGeometry(r + 0.6, 36), mat(0x7a6a4a), 0, 0.03, 0, { rx: -Math.PI / 2, shadow: false });
  add(g, new THREE.CircleGeometry(r, 36), mat(0x3a8ac0, { emissive: 0x103050, emissiveIntensity: 0.4 }), 0, 0.06, 0, { rx: -Math.PI / 2, shadow: false });
  add(g, new THREE.CircleGeometry(r * 0.6, 30), mat(0x2a6aa0), 0, 0.07, 0, { rx: -Math.PI / 2, shadow: false });
  const n = Math.round(r * 2.4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(-0.1, 0.1);
    add(g, new THREE.DodecahedronGeometry(rnd(0.25, 0.5), 0), mat(0x7c7684), Math.cos(a) * (r + 0.4), 0.12, Math.sin(a) * (r + 0.4), { s: [1, 0.6, 1] });
  }
  for (let i = 0; i < 7; i++) {
    const a = rnd(0, Math.PI * 2), rr = rnd(r * 0.3, r * 0.85);
    add(g, new THREE.CircleGeometry(0.45, 12, 0.3, Math.PI * 1.8), mat(0x4f9a4a), Math.cos(a) * rr, 0.09, Math.sin(a) * rr, { rx: -Math.PI / 2, shadow: false });
    if (i % 2) add(g, sph(0.1, 8, 6), mat(0xffc3e1), Math.cos(a) * rr, 0.14, Math.sin(a) * rr, { shadow: false });
  }
  for (let i = 0; i < 16; i++) {
    const a = rnd(0, Math.PI * 2);
    add(g, new THREE.ConeGeometry(0.06, rnd(0.8, 1.5), 4), mat(0x6a8a3a), Math.cos(a) * (r - 0.2), 0.5, Math.sin(a) * (r - 0.2), { rz: rnd(-0.2, 0.2), noOutline: true });
  }
  return finish(g, 0.03, 0.2, true);
}

// A wooden fence running `len` along +X.
export function makeFence(len = 10) {
  const g = new THREE.Group();
  const wood = mat(0x8a6236), wood2 = mat(0x7a5230);
  const posts = Math.max(2, Math.round(len / 2.2) + 1);
  for (let i = 0; i < posts; i++) add(g, new THREE.BoxGeometry(0.2, 1.3, 0.2), wood2, (i / (posts - 1)) * len, 0.65, 0);
  for (const y of [0.5, 1.0]) add(g, new THREE.BoxGeometry(len, 0.12, 0.08), wood, len / 2, y, 0);
  return finish(g, 0.025, 0.1, true);
}

export function makeWindmill() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(1.6, 2.4, 7, 8), mat(0xe8dcc0), 0, 3.5, 0);
  add(g, new THREE.ConeGeometry(2.1, 2.2, 8), mat(0x8a3a2a), 0, 8.1, 0);
  add(g, archGeo(1, 1.8, 0.1), mat(0x5a3a20), 0, 0, 2.3);
  for (const y of [3.5, 5.5]) add(g, new THREE.BoxGeometry(0.7, 0.7, 0.1), glowMat(0xffd27a, 1), 0, y, 1.9);
  const hub = group(g, 0, 6.2, 2.1);
  add(hub, new THREE.CylinderGeometry(0.3, 0.3, 0.5, 10), mat(0x5a3a20), 0, 0, 0, { rx: Math.PI / 2 });
  const blades = group(hub, 0, 0, 0.3);
  for (let i = 0; i < 4; i++) {
    const b = group(blades);
    b.rotation.z = (i / 4) * Math.PI * 2;
    add(b, new THREE.BoxGeometry(0.2, 4.2, 0.1), mat(0x7a5230), 0, 2.2, 0);
    add(b, new THREE.BoxGeometry(1.1, 3.4, 0.05), mat(0xf5ecd8), 0.6, 2.5, 0.03);
  }
  dyn(blades);
  g.userData.anim = (t) => { blades.rotation.z = t * 0.6; };
  return finish(g, 0.04, 0.3);
}

export function makeSignpost() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.1, 0.12, 2.6, 6), mat(0x7a5230), 0, 1.3, 0);
  add(g, new THREE.BoxGeometry(1.6, 0.4, 0.1), mat(0xc9a06a), 0.6, 2.2, 0);
  add(g, new THREE.ConeGeometry(0.28, 0.35, 3), mat(0xc9a06a), 1.52, 2.2, 0, { rz: -Math.PI / 2, s: [1, 1, 0.3] });
  add(g, new THREE.BoxGeometry(1.4, 0.36, 0.1), mat(0xb8905a), -0.5, 1.7, 0, { ry: 0.2 });
  return finish(g, 0.025, 0.1, true);
}

export function makeHayBale() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.6, 0.6, 1.1, 14), mat(0xe0c060), 0, 0.6, 0, { rz: Math.PI / 2 });
  for (const x of [-0.25, 0.25]) add(g, new THREE.TorusGeometry(0.61, 0.03, 4, 16), mat(0xa08030), x, 0.6, 0, { ry: Math.PI / 2, noOutline: true });
  return finish(g, 0.03, 0.1, true);
}

export function makeFlowers(color = 0xffc3e1) {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const x = rnd(-0.6, 0.6), z = rnd(-0.6, 0.6), h = rnd(0.2, 0.45);
    add(g, new THREE.CylinderGeometry(0.015, 0.015, h, 4), mat(0x4f8a3a), x, h / 2, z, { noOutline: true, shadow: false });
    add(g, sph(0.07, 8, 6), mat(i % 3 ? color : 0xfff4b0), x, h, z, { shadow: false, noOutline: true });
  }
  return finish(g, 0.02, 0.5, true);
}

// Builds the right model for a resource node (or its depleted look).
export function makeNode(model, depleted = false) {
  switch (model.kind) {
    case 'rock': return depleted ? makeRubble() : makeOreRock(model.vein);
    case 'pine': return depleted ? makeStump(0x6b4a2b) : makeTree(0.9);
    case 'oak': return depleted ? makeStump(0x5e4028) : makeOak(0.95);
    case 'willow': return depleted ? makeStump(0x6a5a40) : makeWillow(1);
    case 'moonwood': return depleted ? makeStump(0x5a3d24) : makeRoundTree(1.05, 0xd36fae);
    case 'emberwood': return depleted ? makeStump(0x3e302c) : makeFireTree(1.05);
    case 'elder': return depleted ? makeStump(0x3a2a3a) : makeElder(1.1);
    case 'dragonwood': return depleted ? makeStump(0x5a1a1a) : makeDragonwood(1.05);
    case 'skyoak': return depleted ? makeStump(0x6a6a8a) : makeRoundTree(1.1, 0x8ab0e8);
    case 'heartwood': return depleted ? makeStump(0x4a3020) : makeRoundTree(1.25, 0x9fff7a);
    case 'herb': return depleted ? makeSprout() : makeHerb(model.color);
    case 'mushroom': return depleted ? makeSprout() : makeMushroom(model.color);
    case 'berry': return makeBerryBush(!depleted);
    case 'fish': return makeFishSpot(model.water);
  }
  return makeRock();
}

export function makeStation(type) {
  switch (type) {
    case 'furnace': return makeFurnace();
    case 'anvil': return makeAnvil();
    case 'range': return makeRange();
    case 'alchemy': return makeAlchemyTable();
    case 'workbench': return makeWorkbench();
  }
  return makeAnvil();
}

// ---------------------------------------------------------------- the Endless Rift

export function makeChest(trim = 0xf2c14e) {
  const g = new THREE.Group();
  const wood = mat(0x7a4a2a), band = mat(trim);
  add(g, new THREE.BoxGeometry(1.4, 0.8, 0.9), wood, 0, 0.4, 0);
  for (const x of [-0.5, 0.5]) add(g, new THREE.BoxGeometry(0.12, 0.84, 0.94), band, x, 0.4, 0);
  const lid = group(g, 0, 0.8, -0.45);
  add(lid, new THREE.CylinderGeometry(0.45, 0.45, 1.4, 12, 1, false, 0, Math.PI), wood, 0, 0, 0.45, { rz: Math.PI / 2, ry: 0 });
  for (const x of [-0.5, 0.5]) add(lid, new THREE.CylinderGeometry(0.47, 0.47, 0.13, 12, 1, false, 0, Math.PI), band, x, 0, 0.45, { rz: Math.PI / 2 });
  add(g, new THREE.BoxGeometry(0.25, 0.3, 0.1), band, 0, 0.7, 0.47);
  const glow = dyn(add(g, sph(0.3, 10, 8), basic(0xfff0a0), 0, 0.9, 0, { shadow: false }));
  glow.visible = false;
  let opened = -1;
  g.userData.use = () => { opened = 0; glow.visible = true; };
  g.userData.anim = (t) => {
    if (opened < 0) { lid.rotation.x = Math.sin(t * 3) * 0.02; return; }
    opened = Math.min(1, opened + 0.05);
    lid.rotation.x = -opened * 1.9;
    glow.scale.setScalar(1 + opened * 1.5);
    glow.material.opacity = 1 - opened;
  };
  glow.material = new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true });
  return finish(g, 0.03, 0.1);
}

export function makeShrine() {
  const g = new THREE.Group();
  const stone = mat(0x5a5070), stone2 = mat(0x7a6a90);
  add(g, new THREE.CylinderGeometry(1.2, 1.4, 0.4, 8), stone2, 0, 0.2, 0);
  add(g, new THREE.CylinderGeometry(0.5, 0.7, 1.4, 8), stone, 0, 1.1, 0);
  add(g, new THREE.CylinderGeometry(0.8, 0.6, 0.25, 8), stone2, 0, 1.9, 0);
  const gem = dyn(add(g, new THREE.OctahedronGeometry(0.45, 0), glowMat(0xc542ff, 2.4), 0, 2.9, 0, { s: [1, 1.5, 1] }));
  const ring = dyn(add(g, new THREE.TorusGeometry(0.8, 0.04, 6, 30), basic(0xe0b8ff), 0, 2.9, 0, { rx: Math.PI / 2, shadow: false }));
  let used = false;
  g.userData.use = () => { used = true; };
  g.userData.anim = (t) => {
    gem.position.y = 2.9 + Math.sin(t * 2) * 0.15;
    gem.rotation.y = t * (used ? 0.3 : 1.5);
    gem.scale.setScalar(used ? 0.5 : 1);
    ring.rotation.z = t;
    ring.visible = !used;
  };
  return finish(g, 0.035, 0.1);
}

export function makeCrystal(color = 0x9a4dff, scale = 1) {
  const g = new THREE.Group();
  const m = mat(color, { emissive: color, emissiveIntensity: 0.7 });
  for (const [x, z, h, rz, rx] of [[0, 0, 1.6, 0, 0], [0.35, 0.1, 1.0, -0.4, 0.1], [-0.3, 0.15, 1.1, 0.35, -0.1], [0.05, -0.35, 0.8, 0.1, 0.4]]) {
    add(g, new THREE.OctahedronGeometry(0.28, 0), m, x, h * 0.45, z, { s: [1, h * 2.2, 1], rz, rx });
  }
  add(g, new THREE.DodecahedronGeometry(0.4, 0), mat(0x3a3048), 0, 0.1, 0, { s: [1.3, 0.5, 1.3] });
  g.scale.setScalar(scale);
  return finish(g, 0.03, 0.1, true);
}

export function makeTorch() {
  const g = new THREE.Group();
  const iron = mat(0x2b2733);
  add(g, new THREE.BoxGeometry(0.15, 0.4, 0.1), iron, 0, 2.1, -0.05);
  limb(g, V3(0, 2.0, 0), V3(0, 2.35, 0.35), 0.035, 0.035, iron, 5);
  add(g, new THREE.CylinderGeometry(0.1, 0.06, 0.25, 6), mat(0x5a3a20), 0, 2.45, 0.38);
  const f = flame(g, 0, 2.55, 0.38, 1.2, [0x9a4dff, 0xc590ff, 0xffffff]);
  g.userData.anim = (t) => f.userData.flicker(t);
  return finish(g, 0.02, 0.1);
}

// ---------------------------------------------------------------- dragons

// One builder for every dragon: wyrmlings, drakes, wyverns and the elder dragon.
//   legs: 4 or 2 · wings: 0 (none), 1 (small), 2 (big) · hover: height the body flies at
export function makeDragon(o = {}) {
  const {
    color = 0xc0392b, belly = 0xf2c14e, wing = null, horn = 0xf0e6d0, eye = 0xffd23d,
    legs = 4, wings = 2, hover = 0, size = 1, spikes = true, frill = false, fierce = false,
  } = o;
  const g = new THREE.Group();
  const root = group(g, 0, hover, 0);
  const body = group(root);
  const C = mat(color), C2 = mat(darker(color, 0.75)), B = mat(belly), H = mat(horn), W = mat(wing ?? darker(color, 0.6), { side: THREE.DoubleSide });
  const legH = legs === 4 ? 1.0 : 1.2;
  // torso
  add(body, sph(0.75, 18, 12), C, 0, legH + 0.2, 0, { s: [1, 0.85, 1.55] });
  add(body, sph(0.62, 16, 10), B, 0, legH + 0.02, 0.15, { s: [0.9, 0.7, 1.4] });
  // neck + head
  const neck = group(body, 0, legH + 0.45, 0.85);
  limb(neck, V3(0, 0, 0), V3(0, 0.75, 0.55), 0.36, 0.26, C, 10);
  add(neck, sph(0.22, 12, 8), B, 0, 0.3, 0.38, { s: [1, 1.5, 0.6] });
  const head = group(neck, 0, 0.95, 0.72);
  add(head, sph(0.38, 16, 12), C, 0, 0, 0, { s: [1, 0.85, 1.1] });
  add(head, sph(0.28, 14, 10), C, 0, -0.06, 0.42, { s: [0.95, 0.7, 1.45] });
  for (const s of [-1, 1]) add(head, sph(0.05, 8, 6), basic(0x1a1030), s * 0.1, 0.04, 0.83, { shadow: false });
  const jaw = group(head, 0, -0.14, 0.12);
  add(jaw, sph(0.24, 12, 8), B, 0, -0.06, 0.3, { s: [0.85, 0.45, 1.45] });
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) add(jaw, new THREE.ConeGeometry(0.035, 0.1, 4), basic(0xffffff), s * (0.12 - k * 0.015), 0.02, 0.22 + k * 0.11, { shadow: false, noOutline: true });
  const mouth = new THREE.Object3D();
  mouth.position.set(0, -0.1, 0.8);
  head.add(mouth);
  for (const s of [-1, 1]) {
    const e = makeEye(0.085, { glow: eye });
    e.position.set(s * 0.22, 0.12, 0.3);
    head.add(e);
    add(head, new THREE.BoxGeometry(0.2, 0.05, 0.06), C2, s * 0.22, 0.22, 0.3, { rz: s * 0.35 });
    add(head, new THREE.ConeGeometry(0.09, 0.6, 7), H, s * 0.2, 0.32, -0.2, { rx: -1.1, rz: s * 0.25 });
    add(head, new THREE.ConeGeometry(0.05, 0.3, 6), H, s * 0.3, 0.05, -0.25, { rx: -1.3, rz: s * 0.8 });
  }
  if (frill) for (let k = -2; k <= 2; k++) add(head, new THREE.ConeGeometry(0.06, 0.4, 5), mat(belly), k * 0.08, 0.35, -0.3, { rx: -0.8, rz: k * 0.25 });
  // fierce: an old wild dragon, not a friend. Slit pupils under a heavy brow, long swept-back
  // horns, spikes down the cheeks and fangs over the lip.
  if (fierce) {
    for (const s of [-1, 1]) {
      add(head, new THREE.BoxGeometry(0.025, 0.13, 0.02), basic(0x120808), s * 0.22, 0.12, 0.39, { shadow: false });
      add(head, new THREE.BoxGeometry(0.3, 0.09, 0.14), C2, s * 0.2, 0.2, 0.33, { rz: s * 0.45 });
      const h0 = V3(s * 0.22, 0.3, -0.15), h1 = V3(s * 0.42, 0.55, -0.6), h2 = V3(s * 0.5, 0.62, -1.15);
      limb(head, h0, h1, 0.11, 0.07, H, 8);
      limb(head, h1, h2, 0.07, 0.015, H, 8);
      for (const t of [0.35, 0.7]) add(head, new THREE.TorusGeometry(0.1 - t * 0.04, 0.018, 4, 10), C2, ...h0.clone().lerp(h1, t).toArray(), { rx: 1.1, noOutline: true });
      for (let k = 0; k < 3; k++) add(head, new THREE.ConeGeometry(0.04, 0.24 - k * 0.04, 5), H, s * (0.32 + k * 0.02), -0.05 - k * 0.07, -0.02 - k * 0.1, { rz: s * 1.6, rx: -0.4 });
      add(head, new THREE.ConeGeometry(0.03, 0.14, 5), basic(0xfff4e0), s * 0.1, -0.2, 0.62, { rx: Math.PI, shadow: false });
    }
  }
  // back spikes
  if (spikes) for (let k = 0; k < 6; k++) add(body, new THREE.ConeGeometry(0.1 - k * 0.008, 0.36, 5), H, 0, legH + 0.82 - k * 0.04, 0.7 - k * 0.32, { rx: -0.35 });
  // legs
  const legGroups = [];
  const legAt = legs === 4 ? [[0.5, 0.55], [-0.5, 0.55], [0.5, -0.6], [-0.5, -0.6]] : [[0.45, -0.25], [-0.45, -0.25]];
  for (const [x, z] of legAt) {
    const lg = group(body, x, legH + 0.1, z);
    limb(lg, V3(0, 0, 0), V3(x * 0.2, -legH * 0.55, z > 0 ? 0.15 : -0.1), 0.2, 0.15, C, 8);
    limb(lg, V3(x * 0.2, -legH * 0.55, z > 0 ? 0.15 : -0.1), V3(x * 0.15, -legH - 0.05, 0.1), 0.14, 0.1, C2, 8);
    add(lg, sph(0.14, 10, 8), C2, x * 0.15, -legH - 0.02, 0.18, { s: [1, 0.5, 1.4] });
    for (const c of [-1, 0, 1]) add(lg, new THREE.ConeGeometry(0.035, 0.14, 4), H, x * 0.15 + c * 0.07, -legH - 0.02, 0.36, { rx: Math.PI / 2 });
    legGroups.push(lg);
  }
  // wings: bone struts plus a membrane
  const wingGroups = [];
  if (wings) {
    const span = wings === 2 ? 2.6 : 1.1;
    for (const s of [-1, 1]) {
      const wg = group(body, s * 0.45, legH + 0.7, 0.35);
      wg.scale.x = s;
      limb(wg, V3(0, 0, 0), V3(span * 0.45, 0.45, -0.1), 0.08, 0.06, C2, 6);
      limb(wg, V3(span * 0.45, 0.45, -0.1), V3(span, 0.2, -0.4), 0.06, 0.03, C2, 6);
      for (const [x, z] of [[span * 0.55, -0.9], [span * 0.8, -1.1], [span, -0.8]]) limb(wg, V3(span * 0.45, 0.45, -0.1), V3(x, 0.05, z - 0.2), 0.03, 0.015, C2, 4);
      const mem = add(wg, batWingGeo(span, span * 0.62), W, 0, 0.35, -0.15, { rx: -Math.PI / 2 - 0.05, noOutline: true });
      mem.scale.set(1, 1.15, 1);
      add(wg, new THREE.ConeGeometry(0.05, 0.22, 5), H, span * 0.45, 0.55, -0.1);
      wingGroups.push(wg);
    }
  }
  // tail: nested segments so it can wave
  const tailSegs = [];
  let parent = group(body, 0, legH + 0.15, -1.05);
  for (let k = 0; k < 5; k++) {
    const r0 = 0.3 - k * 0.055, r1 = r0 - 0.05;
    limb(parent, V3(0, 0, 0), V3(0, -0.04, -0.55), Math.max(0.04, r0), Math.max(0.03, r1), C, 8);
    if (spikes && k < 4) add(parent, new THREE.ConeGeometry(0.06, 0.2, 4), H, 0, r0 + 0.02, -0.25, { rx: -0.4 });
    tailSegs.push(parent);
    parent = group(parent, 0, -0.04, -0.55);
  }
  add(parent, new THREE.ConeGeometry(0.16, 0.4, 4), H, 0, 0, -0.1, { rx: -Math.PI / 2, s: [1.4, 1, 0.4] });

  g.scale.setScalar(size);
  let flap = 0, breath = 0, roar = 0;
  g.userData.mouth = mouth;
  g.userData.hover = hover;
  g.userData.setFlying = (f) => { flap = f ? 1 : 0; };
  g.userData.breathe = (sec = 1) => { breath = sec; };
  g.userData.roar = () => { roar = 1; };
  let last = 0;
  g.userData.anim = (t, moving) => {
    const dt = Math.min(0.1, Math.max(0, t - last));
    last = t;
    breath = Math.max(0, breath - dt);
    roar = Math.max(0, roar - dt);
    const gait = moving ? t * 9 : t * 1.3;
    body.position.y = moving ? Math.abs(Math.sin(gait)) * 0.08 : Math.sin(t * 1.6) * 0.03;
    if (hover) root.position.y = hover + Math.sin(t * 2.2) * 0.25;
    legGroups.forEach((lg, i) => { lg.rotation.x = moving ? Math.sin(gait + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.55 : 0; });
    const fast = flap || hover ? 1 : 0;
    wingGroups.forEach((wg) => {
      wg.rotation.z = fast ? Math.sin(t * (flap ? 9 : 6)) * 0.7 - 0.1 : -0.55 + Math.sin(t * 1.2) * 0.05;
      wg.rotation.y = fast ? 0 : 0.9;
    });
    tailSegs.forEach((s, i) => { s.rotation.y = Math.sin(t * (moving ? 5 : 1.8) - i * 0.7) * (0.18 + i * 0.03); s.rotation.x = 0.05; });
    neck.rotation.x = (breath > 0 ? 0.25 : roar > 0 ? -0.35 : Math.sin(t * 1.1) * 0.06);
    head.rotation.y = breath > 0 ? 0 : Math.sin(t * 0.8) * 0.2;
    jaw.rotation.x = breath > 0 || roar > 0 ? 0.55 : Math.max(0, Math.sin(t * 0.7)) * 0.08;
  };
  return finish(g, 0.028 / size + 0.004, 0.06);
}

// A hooded ghost that only walks the world at night.
function shade(color = 0x6a5aa0, eye = 0x9fe6ff) {
  const g = new THREE.Group();
  const body = group(g, 0, 0.4, 0);
  const robe = mat(color), dark = mat(darker(color, 0.5));
  add(body, new THREE.ConeGeometry(0.65, 1.8, 10, 1, true), robe, 0, 0.9, 0, { rx: Math.PI });
  add(body, new THREE.ConeGeometry(0.66, 1.8, 10, 1, true), dark, 0, 0.9, 0, { rx: Math.PI, s: [0.97, 1, 0.97] });
  const hood = group(body, 0, 1.95, 0.05);
  add(hood, sph(0.45, 14, 10), robe, 0, 0, -0.05, { s: [1, 1.15, 1] });
  add(hood, sph(0.36, 14, 10), basic(0x0a0614), 0, -0.05, 0.14, { s: [0.9, 1, 0.6] });
  for (const s of [-1, 1]) {
    const e = makeEye(0.07, { glow: eye });
    e.position.set(s * 0.13, 0, 0.36);
    hood.add(e);
  }
  add(hood, new THREE.ConeGeometry(0.2, 0.5, 8), robe, 0, 0.38, -0.2, { rx: -0.8 });
  const hands = [-1, 1].map(s => dyn(add(body, sph(0.12, 10, 8), mat(0xc8d0ff, { emissive: eye, emissiveIntensity: 0.4 }), s * 0.6, 1.2, 0.3)));
  const wisps = [0, 1, 2].map(() => dyn(add(g, sph(0.08, 6, 4), basic(eye), 0, 0, 0, { shadow: false })));
  g.userData.anim = (t, moving) => {
    body.position.y = 0.4 + Math.sin(t * 2) * 0.15;
    body.rotation.z = Math.sin(t * 1.3) * 0.06;
    hands.forEach((h, i) => { h.position.y = 1.2 + Math.sin(t * 3 + i * 2) * 0.15; });
    wisps.forEach((w, i) => {
      const k = (t * 0.5 + i / 3) % 1;
      w.position.set(Math.sin(i * 2 + t) * 0.3, 0.3 + k * 0.8, -0.3 - k * 0.6);
      w.scale.setScalar(1 - k);
    });
    body.rotation.x = moving ? 0.15 : 0;
  };
  return finish(g, 0.028, 0.08);
}

// A shaggy mountain giant.
function yeti() {
  const g = new THREE.Group();
  const body = group(g);
  const fur = mat(0xf0f4fa), fur2 = mat(0xd8e0ec), skin = mat(0x6a8ab0);
  add(body, sph(0.95, 16, 12), fur, 0, 1.9, 0, { s: [1.1, 1.05, 0.9] });
  add(body, sph(0.6, 14, 10), fur2, 0, 1.5, 0.45, { s: [1, 1.1, 0.6] });
  const head = group(body, 0, 3.0, 0.2);
  add(head, sph(0.5, 14, 10), fur, 0, 0, 0);
  add(head, sph(0.34, 14, 10), skin, 0, -0.05, 0.3, { s: [1, 0.85, 0.6] });
  for (const s of [-1, 1]) {
    const e = makeEye(0.09, { iris: 0x4dc8ff });
    e.position.set(s * 0.13, 0.05, 0.44);
    head.add(e);
    add(head, new THREE.ConeGeometry(0.08, 0.3, 6), mat(0xe8dcc0), s * 0.35, 0.3, 0, { rz: -s * 0.6 });
  }
  add(head, new THREE.CircleGeometry(0.14, 14, Math.PI, Math.PI), basic(0x2a1020), 0, -0.2, 0.5, { shadow: false });
  for (const s of [-1, 1]) add(head, new THREE.ConeGeometry(0.04, 0.12, 4), basic(0xffffff), s * 0.07, -0.21, 0.51, { rx: Math.PI, shadow: false });
  const arms = [-1, 1].map(s => {
    const a = group(body, s * 1.0, 2.4, 0);
    limb(a, V3(0, 0, 0), V3(s * 0.3, -1.0, 0.2), 0.3, 0.26, fur, 10);
    add(a, sph(0.3, 12, 8), skin, s * 0.32, -1.2, 0.25, { s: [1, 0.8, 1.1] });
    return a;
  });
  for (const s of [-1, 1]) {
    limb(body, V3(s * 0.45, 1.1, 0), V3(s * 0.5, 0.2, 0.05), 0.3, 0.26, fur, 10);
    add(body, sph(0.3, 12, 8), skin, s * 0.5, 0.12, 0.2, { s: [1, 0.5, 1.4] });
  }
  g.scale.setScalar(1.15);
  g.userData.anim = (t, moving) => {
    arms.forEach((a, i) => { a.rotation.x = moving ? Math.sin(t * 5 + i * Math.PI) * 0.5 : Math.sin(t * 1.2 + i) * 0.08; });
    body.rotation.z = moving ? Math.sin(t * 5) * 0.08 : 0;
    body.position.y = moving ? Math.abs(Math.sin(t * 5)) * 0.12 : Math.sin(t * 1.4) * 0.03;
    head.rotation.y = Math.sin(t * 0.6) * 0.25;
  };
  return finish(g, 0.03, 0.08);
}

// The Scaled Cult: a hooded wizard with dragon horns and a bone mask.
function cultist() {
  const g = makeWizard({ robe: 0x3a0a14, hat: 0x1a0a0a, trim: 0xc0392b, gem: 0xff5a1a, hatStyle: 'hood', skin: 0x8a7a70, eyeColor: 0xff3a2a, hair: 0x1a1010 });
  const head = g.userData.head;
  for (const s of [-1, 1]) add(head, new THREE.ConeGeometry(0.07, 0.5, 6), mat(0xf0e6d0), s * 0.28, 0.45, -0.1, { rz: s * 0.6, rx: -0.3 });
  add(head, sph(0.27, 14, 10), mat(0xe8dcc0), 0, 0.06, 0.3, { s: [1.1, 0.8, 0.45] });
  for (const s of [-1, 1]) add(head, sph(0.045, 8, 6), basic(0xff3a2a), s * 0.11, 0.1, 0.43, { shadow: false });
  return g;
}

// ---------------------------------------------------------------- Dragonspire scenery

// A curved stone wall carved with glowing dragon runes.
export function makeWordWall(color = 0x4dc8ff) {
  const g = new THREE.Group();
  const stone = mat(0x6a6a78), stone2 = mat(0x55556a);
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.2;
    const h = 4.2 - Math.abs(i) * 0.4 + rnd(-0.2, 0.2);
    add(g, new THREE.BoxGeometry(1.25, h, 0.6), i % 2 ? stone : stone2, Math.sin(a) * 6, h / 2, Math.cos(a) * 6 - 6, { ry: a });
  }
  add(g, new THREE.BoxGeometry(9, 0.4, 1.4), stone2, 0, 0.2, -0.3);
  const runes = ownMat(darker(color, 0.4), { emissive: color, emissiveIntensity: 1.2 });
  for (let r = 0; r < 3; r++) for (let i = -2; i <= 2; i++) {
    const a = i * 0.2;
    add(g, new THREE.BoxGeometry(0.5, 0.08, 0.05), runes, Math.sin(a) * 5.68, 1.2 + r * 0.8, Math.cos(a) * 5.68 - 6, { ry: a, rz: (i + r) % 2 ? 0.6 : -0.4, shadow: false, noOutline: true });
    add(g, new THREE.BoxGeometry(0.08, 0.4, 0.05), runes, Math.sin(a) * 5.68 + 0.15, 1.25 + r * 0.8, Math.cos(a) * 5.68 - 6, { ry: a, shadow: false, noOutline: true });
  }
  const motes = [0, 1, 2, 3, 4].map(() => dyn(add(g, sph(0.06, 6, 4), basic(color), 0, 0, 0, { shadow: false })));
  let learned = false;
  g.userData.setLearned = (v) => { learned = v; runes.emissiveIntensity = v ? 0.25 : 1.2; };
  g.userData.anim = (t) => {
    if (!learned) runes.emissiveIntensity = 0.9 + Math.sin(t * 2) * 0.4;
    motes.forEach((m, i) => {
      const k = (t * 0.25 + i / 5) % 1;
      m.visible = !learned;
      m.position.set(Math.sin(i * 1.3) * 3, 0.5 + k * 4, -0.5 + Math.cos(i * 2) * 0.5);
    });
  };
  return finish(g, 0.04, 0.2);
}

export function makeBones(big = false) {
  const g = new THREE.Group();
  const bone = mat(0xe8dcc0);
  const n = big ? 7 : 4, s = big ? 2.2 : 1;
  for (let i = 0; i < n; i++) {
    const z = (i - n / 2) * 0.9 * s;
    add(g, new THREE.TorusGeometry(1.4 * s, 0.1 * s, 6, 16, Math.PI * 0.8), bone, 0, 0, z, { rz: Math.PI * 0.1, ry: Math.PI / 2, rx: 0 });
  }
  limb(g, V3(0, 0.1 * s, -n / 2 * 0.9 * s - 0.5), V3(0, 0.1 * s, n / 2 * 0.9 * s + 0.3), 0.14 * s, 0.1 * s, bone, 6);
  if (big) {
    const skull = group(g, 0.4, 0.8, n / 2 * 0.9 * s + 2);
    add(skull, sph(1, 12, 10), bone, 0, 0, 0, { s: [1, 0.8, 1.2] });
    add(skull, sph(0.7, 12, 10), bone, 0, -0.2, 1.1, { s: [0.9, 0.6, 1.4] });
    for (const d of [-1, 1]) {
      add(skull, sph(0.22, 10, 8), basic(0x1a1030), d * 0.45, 0.2, 0.75, { shadow: false });
      add(skull, new THREE.ConeGeometry(0.2, 1.4, 7), bone, d * 0.5, 0.7, -0.6, { rx: -1.1, rz: d * 0.3 });
    }
    skull.rotation.set(0.3, 0.4, 0.2);
  }
  return finish(g, 0.035, 0.2, true);
}

export function makeNest(eggs = 3) {
  const g = new THREE.Group();
  const twig = mat(0x6a4a2a), twig2 = mat(0x5a3a1a);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    add(g, new THREE.CylinderGeometry(0.08, 0.08, 1.8, 5), i % 2 ? twig : twig2, Math.cos(a) * 1.3, 0.35, Math.sin(a) * 1.3, { rz: Math.PI / 2, ry: -a + 0.4, rx: 0.3 });
  }
  add(g, new THREE.CylinderGeometry(1.2, 0.9, 0.3, 14), mat(0x4a3a2a), 0, 0.15, 0);
  const colors = [0xc0392b, 0x4dc8ff, 0x6a7a3a, 0xf2c14e];
  for (let i = 0; i < eggs; i++) {
    const a = (i / eggs) * Math.PI * 2;
    add(g, sph(0.3, 12, 10), mat(colors[i % 4], { emissive: colors[i % 4], emissiveIntensity: 0.2 }), Math.cos(a) * 0.4, 0.55, Math.sin(a) * 0.4, { s: [1, 1.35, 1] });
  }
  return finish(g, 0.03, 0.15, true);
}

export function makeSnowPine(scale = 1) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.22, 0.34, 1.6, 8), mat(0x4a3a2a), 0, 0.8, 0);
  const tiers = [[1.7, 2.3, 2.3], [1.35, 2.0, 3.35], [0.95, 1.7, 4.3], [0.55, 1.2, 5.1]];
  tiers.forEach(([r, h, y], i) => {
    add(g, new THREE.ConeGeometry(r, h, 12), mat(i % 2 ? 0x2a5a4a : 0x346a58), 0, y, 0, { ry: i * 0.4 });
    add(g, new THREE.ConeGeometry(r * 0.75, h * 0.45, 12), mat(0xf0f4ff), 0, y + h * 0.28, 0, { ry: i * 0.4 });
  });
  g.scale.setScalar(scale);
  return finish(g, 0.04, 0.4, true);
}

export function makePeak(r = 30, h = 60, snow = true) {
  const g = new THREE.Group();
  add(g, new THREE.ConeGeometry(r, h, 7), mat(0x4a5060), 0, h / 2, 0, { shadow: false });
  if (snow) add(g, new THREE.ConeGeometry(r * 0.42, h * 0.42, 7), mat(0xf0f4ff), 0, h * 0.79, 0, { shadow: false });
  add(g, new THREE.ConeGeometry(r * 0.5, h * 0.6, 6), mat(0x3a4050), r * 0.55, h * 0.3, r * 0.2, { shadow: false });
  return finish(g, 0.1, 5, true);
}

export function makeFloatingRock(scale = 1) {
  const g = new THREE.Group();
  const isle = group(g, 0, 6 * scale, 0);
  add(isle, new THREE.ConeGeometry(2 * scale, 3.5 * scale, 7), mat(0x5a5a6a), 0, -1.75 * scale, 0, { rx: Math.PI });
  add(isle, new THREE.CylinderGeometry(2.1 * scale, 2 * scale, 0.5 * scale, 7), mat(0x6a8a5a), 0, 0.2 * scale, 0);
  add(isle, new THREE.ConeGeometry(0.6 * scale, 1.6 * scale, 8), mat(0x2a5a4a), 0.5 * scale, 1.2 * scale, 0);
  dyn(isle);
  const seed = Math.random() * 10;
  g.userData.anim = (t) => { isle.position.y = 6 * scale + Math.sin(t * 0.6 + seed) * 0.6; isle.rotation.y = t * 0.05 + seed; };
  return finish(g, 0.05, 0.3);
}

export function makeBanner(color = 0xc0392b) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.07, 0.09, 4, 6), mat(0x5a3a20), 0, 2, 0);
  add(g, new THREE.BoxGeometry(1.1, 0.08, 0.08), mat(0x5a3a20), 0, 3.8, 0);
  const cloth = dyn(add(g, new THREE.PlaneGeometry(1, 1.8, 1, 4), mat(color, { side: THREE.DoubleSide }), 0, 2.85, 0.05));
  add(g, new THREE.CircleGeometry(0.25, 12), mat(0xf2c14e, { side: THREE.DoubleSide }), 0, 3, 0.07, { noOutline: true });
  g.userData.anim = (t) => { cloth.rotation.y = Math.sin(t * 2 + color) * 0.25; };
  return finish(g, 0.03, 0.2);
}

// ---------------------------------------------------------------- mounts

// A four-legged mount with a saddle. `kind` shapes the head, ears, tail and extras.
function quadruped({ color, dark, mane, size = 1, legLen = 1.1, neck = 0.9, ears = 'horse', antlers = false, tail = 'hair', fire = false, eye = null, glow = null, saddle = true }) {
  const g = new THREE.Group();
  const body = group(g);
  const C = mat(color), D = mat(dark ?? darker(color, 0.7)), M = mat(mane ?? darker(color, 0.5));
  const H = legLen + 0.35;
  add(body, sph(0.62, 16, 12), C, 0, H, 0, { s: [0.85, 0.8, 1.7] });
  // legs
  const legs = [];
  for (const [x, z] of [[0.3, 0.72], [-0.3, 0.72], [0.3, -0.72], [-0.3, -0.72]]) {
    const lg = group(body, x, H - 0.2, z);
    limb(lg, V3(0, 0, 0), V3(0, -legLen * 0.55, z > 0 ? 0.05 : -0.08), 0.15, 0.11, C, 8);
    limb(lg, V3(0, -legLen * 0.55, z > 0 ? 0.05 : -0.08), V3(0, -legLen - 0.1, 0.02), 0.1, 0.08, D, 8);
    add(lg, new THREE.CylinderGeometry(0.1, 0.12, 0.14, 8), mat(0x2a2020), 0, -legLen - 0.12, 0.02);
    legs.push(lg);
  }
  // neck and head
  const nk = group(body, 0, H + 0.25, 0.85);
  limb(nk, V3(0, 0, 0), V3(0, neck * 0.8, neck * 0.45), 0.24, 0.18, C, 10);
  const head = group(nk, 0, neck * 0.85, neck * 0.55);
  if (ears === 'wolf' || ears === 'cat') {
    add(head, sph(0.3, 14, 10), C, 0, 0, 0, { s: [1, 0.9, 1.1] });
    add(head, sph(0.18, 12, 8), D, 0, -0.06, 0.3, { s: [0.8, 0.7, 1.3] });
    add(head, sph(0.05, 8, 6), basic(0x1a1030), 0, -0.02, 0.52, { shadow: false });
    for (const s of [-1, 1]) add(head, new THREE.ConeGeometry(0.09, 0.28, 5), C, s * 0.15, 0.3, -0.05, { rz: -s * 0.2 });
  } else if (ears === 'lizard') {
    add(head, sph(0.3, 14, 10), C, 0, 0, 0.1, { s: [0.9, 0.6, 1.5] });
    for (const s of [-1, 1]) add(head, new THREE.ConeGeometry(0.05, 0.3, 5), mat(0xf0e6d0), s * 0.12, 0.15, -0.25, { rx: -1.2 });
  } else {
    add(head, sph(0.26, 14, 10), C, 0, 0.02, 0, { s: [0.8, 0.9, 1.1] });
    add(head, sph(0.2, 12, 8), C, 0, -0.1, 0.32, { s: [0.75, 0.75, 1.3] });
    for (const s of [-1, 1]) add(head, sph(0.03, 6, 4), basic(0x1a1030), s * 0.07, -0.12, 0.56, { shadow: false });
    for (const s of [-1, 1]) add(head, new THREE.ConeGeometry(0.06, 0.2, 5), C, s * 0.12, 0.27, -0.08, { rz: -s * 0.25 });
    for (let k = 0; k < 5; k++) add(nk, new THREE.ConeGeometry(0.08, 0.28, 5), M, 0, 0.2 + k * 0.17, 0.02 + k * 0.1 - 0.12, { rx: -1.1 });
  }
  for (const s of [-1, 1]) {
    const e = makeEye(0.06, glow ? { glow } : { iris: eye ?? 0x3a2a1a });
    e.position.set(s * 0.17, 0.08, 0.18);
    e.rotation.y = s * 0.5;
    head.add(e);
  }
  if (antlers) for (const s of [-1, 1]) {
    limb(head, V3(s * 0.1, 0.22, -0.05), V3(s * 0.35, 0.7, -0.15), 0.035, 0.025, mat(0xe8dcc0), 5);
    limb(head, V3(s * 0.28, 0.55, -0.12), V3(s * 0.5, 0.75, 0.05), 0.025, 0.015, mat(0xe8dcc0), 4);
    limb(head, V3(s * 0.2, 0.4, -0.08), V3(s * 0.15, 0.65, 0.15), 0.025, 0.015, mat(0xe8dcc0), 4);
  }
  // tail
  const tl = group(body, 0, H + 0.1, -1.0);
  if (tail === 'hair') tube(tl, [[0, 0, 0], [0, -0.3, -0.25], [0, -0.7, -0.3]], 0.1, M, 10);
  else if (tail === 'bushy') add(tl, sph(0.22, 12, 8), M, 0, -0.1, -0.35, { s: [0.8, 0.8, 2] });
  else tube(tl, [[0, -0.1, 0], [0, -0.3, -0.6], [0.1, -0.4, -1.2]], 0.12, C, 12);
  // saddle
  if (saddle) {
    const saddleM = mat(0x7a3a2a), trimM = mat(0xf2c14e);
    add(body, sph(0.42, 14, 8), saddleM, 0, H + 0.42, -0.05, { s: [1, 0.3, 1.2] });
    add(body, new THREE.TorusGeometry(0.42, 0.04, 6, 18), trimM, 0, H + 0.43, -0.05, { rx: Math.PI / 2, s: [1, 1.2, 1] });
    for (const s of [-1, 1]) add(body, new THREE.BoxGeometry(0.05, 0.5, 0.3), saddleM, s * 0.55, H + 0.1, -0.05, { rz: s * 0.2 });
  } else {
    for (let k = 0; k < 5; k++) add(body, new THREE.ConeGeometry(0.1, 0.35, 5), M, 0, H + 0.55, 0.6 - k * 0.3, { rx: -0.5 });
  }
  const flames = fire ? [flame(body, 0, H + 0.45, 0.45, 0.8), flame(body, 0, H + 0.4, -0.55, 0.8)] : [];
  g.scale.setScalar(size);
  g.userData.saddle = (H + 0.5) * size;
  g.userData.anim = (t, moving) => {
    const f = t * 11;
    legs.forEach((lg, i) => { lg.rotation.x = moving ? Math.sin(f + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.6 : 0; });
    body.position.y = moving ? Math.abs(Math.sin(f)) * 0.08 : Math.sin(t * 1.5) * 0.015;
    nk.rotation.x = moving ? Math.sin(f) * 0.08 : Math.sin(t * 0.8) * 0.04;
    tl.rotation.y = Math.sin(t * (moving ? 6 : 2)) * 0.3;
    flames.forEach(fl => fl.userData.flicker(t));
  };
  return finish(g, 0.026, 0.06);
}

export function makeMount(kind) {
  switch (kind) {
    case 'steed': return quadruped({ color: 0xc8b8f0, mane: 0xf2f0ff, eye: 0x6a4aa0 });
    case 'wolf': return quadruped({ color: 0x6a6a78, mane: 0x4a4a55, ears: 'wolf', tail: 'bushy', legLen: 0.95, neck: 0.55, eye: 0xf2c14e });
    case 'emberback': return quadruped({ color: 0xc0391b, dark: 0x6a1a0a, ears: 'lizard', tail: 'lizard', legLen: 0.7, neck: 0.4, fire: true, glow: 0xffd23d });
    case 'elk': return quadruped({ color: 0xb8a080, mane: 0xf0e8dc, antlers: true, legLen: 1.25, eye: 0x3a2a1a });
    case 'stalker': return quadruped({ color: 0x2a1a44, mane: 0x4a2a7a, ears: 'cat', tail: 'lizard', legLen: 0.9, neck: 0.45, glow: 0xc542ff });
    case 'nightmare': return quadruped({ color: 0x1a1428, dark: 0x0a0810, mane: 0xd06aff, legLen: 1.2, neck: 1, glow: 0xe8c0ff, eye: 0xd06aff });
    case 'drake': {
      const d = makeDragon({ color: 0xc0392b, belly: 0xf2c14e, wings: 2, size: 1.05, frill: true });
      d.userData.saddle = 2.1;
      return d;
    }
  }
  return quadruped({ color: 0xc8b8f0 });
}

// A standing stone that remembers you: touch it once to fast-travel back later.
export function makeWaystone(color = 0x7fd8ff) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(1.1, 1.3, 0.35, 8), mat(0x6a6478), 0, 0.17, 0);
  add(g, new THREE.BoxGeometry(0.8, 2.6, 0.5), mat(0x8a8494), 0, 1.6, 0, { rz: 0.04 });
  add(g, new THREE.ConeGeometry(0.46, 0.6, 4), mat(0x8a8494), 0, 3.2, 0, { ry: Math.PI / 4, s: [1, 1, 0.6] });
  const rune = ownMat(darker(color, 0.4), { emissive: color, emissiveIntensity: 0.4 });
  add(g, new THREE.OctahedronGeometry(0.22, 0), rune, 0, 2, 0.27, { s: [1, 1.4, 0.3], shadow: false });
  for (const y of [1.2, 2.6]) add(g, new THREE.BoxGeometry(0.5, 0.06, 0.05), rune, 0, y, 0.26, { shadow: false, noOutline: true });
  const orb = dyn(add(g, sph(0.12, 10, 8), basic(color), 0, 3.9, 0, { shadow: false }));
  let on = false;
  g.userData.setActive = (v) => { on = v; rune.emissiveIntensity = v ? 1.4 : 0.35; orb.visible = v; };
  g.userData.anim = (t) => { if (on) { orb.position.y = 3.9 + Math.sin(t * 2) * 0.15; rune.emissiveIntensity = 1.1 + Math.sin(t * 3) * 0.3; } };
  g.userData.setActive(false);
  return finish(g, 0.035, 0.1);
}

// ------------------------------------------------------------ Glacierreach (Chapter 4)

const iceMat = (color = 0x9fe6ff, glow = 0.3) => mat(color, { transparent: true, opacity: 0.88, emissive: color, emissiveIntensity: glow });

// A cluster of glowing ice shards.
export function makeIceCrystal(scale = 1, color = 0x9fe6ff) {
  const g = new THREE.Group();
  const m = iceMat(color, 0.35);
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const h = i === 0 ? rnd(2.6, 3.6) : rnd(1.2, 2.4);
    add(g, new THREE.OctahedronGeometry(0.5, 0), m, i ? rnd(-0.8, 0.8) : 0, h * 0.42, i ? rnd(-0.8, 0.8) : 0, { s: [0.6, h, 0.6], rx: i ? rnd(-0.4, 0.4) : 0, rz: i ? rnd(-0.4, 0.4) : 0 });
  }
  add(g, new THREE.DodecahedronGeometry(0.7, 0), mat(0x8aa0c0), 0, 0.15, 0, { s: [1.4, 0.4, 1.4] });
  g.scale.setScalar(scale);
  return finish(g, 0.03, 0.2, true);
}

// A round ice tower with a glassy spire and glowing windows.
export function makeIceTower({ r = 3, h = 14 } = {}) {
  const g = new THREE.Group();
  const wall = mat(0xcfe6fa), dark = mat(0x8ab0d8), win = glowMat(0x9fe6ff, 1.8);
  add(g, new THREE.CylinderGeometry(r * 1.18, r * 1.28, 1.2, 14), dark, 0, 0.6, 0);
  add(g, new THREE.CylinderGeometry(r, r * 1.1, h, 14), wall, 0, h / 2, 0);
  add(g, new THREE.CylinderGeometry(r * 1.22, r * 1.05, 0.8, 14), dark, 0, h, 0);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    add(g, new THREE.BoxGeometry(0.8, 1, 0.6), wall, Math.sin(a) * r * 1.12, h + 0.85, Math.cos(a) * r * 1.12, { ry: a });
  }
  add(g, new THREE.ConeGeometry(r * 0.95, r * 3.6, 14), iceMat(0xaee8ff, 0.4), 0, h + 0.4 + r * 1.8, 0);
  add(g, new THREE.OctahedronGeometry(r * 0.24), glowMat(0xdff6ff, 2.4), 0, h + 0.8 + r * 3.7, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    for (const y of [h * 0.35, h * 0.7]) {
      const wg = group(g, Math.sin(a) * (r - 0.02), y, Math.cos(a) * (r - 0.02));
      wg.rotation.y = a;
      add(wg, archGeo(0.8, 1.6, 0.22), win, 0, -0.8, 0);
    }
  }
  return finish(g, 0.05, 0.5, true);
}

// A crenellated wall of packed ice.
export function makeIceWall(len = 8, h = 6) {
  const g = new THREE.Group();
  const wall = mat(0xbcdcf6), cap = mat(0xeef8ff);
  add(g, new THREE.BoxGeometry(len, h, 1.6), wall, 0, h / 2, 0);
  add(g, new THREE.BoxGeometry(len + 0.2, 0.5, 2), cap, 0, h, 0);
  for (let x = -len / 2 + 0.6; x <= len / 2 - 0.3; x += 1.5) add(g, new THREE.BoxGeometry(0.75, 0.85, 1.8), cap, x, h + 0.65, 0);
  for (let x = -len / 2 + 1.5; x < len / 2; x += 3) add(g, new THREE.ConeGeometry(0.18, 1.2, 6), iceMat(0xdff6ff, 0.2), x, h - 0.9, 0.9, { rx: Math.PI });
  return finish(g, 0.04, 0.4, true);
}

// Queen Sylvara's throne, carved from one glacier.
export function makeIceThrone() {
  const g = new THREE.Group();
  const ice = iceMat(0xaee8ff, 0.35), base = mat(0x8ab0d8), frost = mat(0xf0f8ff);
  add(g, new THREE.CylinderGeometry(5, 5.6, 0.8, 8), base, 0, 0.4, 0);
  add(g, new THREE.CylinderGeometry(3.6, 4.2, 0.8, 8), frost, 0, 1.2, 0);
  add(g, new THREE.BoxGeometry(3.2, 1.2, 2.6), ice, 0, 2.2, 0);
  add(g, new THREE.BoxGeometry(3.4, 6, 0.8), ice, 0, 4.6, -1.2);
  for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(0.6, 1.4, 2.4), ice, s * 1.6, 3.2, 0);
  for (let i = -3; i <= 3; i++) {
    const h = 3.5 - Math.abs(i) * 0.4;
    add(g, new THREE.OctahedronGeometry(0.4, 0), iceMat(0xdff6ff, 0.5), i * 0.5, 7.6 + h * 0.3, -1.2, { s: [0.7, h, 0.5] });
  }
  add(g, new THREE.OctahedronGeometry(0.5), glowMat(0x7affd0, 2.4), 0, 5.2, -0.75);
  return finish(g, 0.04, 0.4, true);
}

// Rippling curtains of light high in the sky. Brightest at night.
export function makeAurora(world, width = 320, height = 30) {
  const g = new THREE.Group();
  const bands = [];
  for (const [col, y, z, ph] of [[0x7affd0, 44, 170, 0], [0x9a8cff, 56, 200, 2], [0x4dc8ff, 38, 145, 4]]) {
    const geo = new THREE.PlaneGeometry(width, height, 48, 1);
    const colors = [];
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const top = pos.getY(i) > 0;
      const c = new THREE.Color(col).multiplyScalar(top ? 0.15 : 1);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    m.position.set(0, y, z);
    m.userData.base = Float32Array.from(pos.array);
    m.userData.phase = ph;
    m.frustumCulled = false;
    g.add(m);
    bands.push(m);
  }
  g.userData.anim = (t) => {
    const night = world.skyCycle ? 0.25 + world.skyCycle.nightK * 0.75 : 1;
    for (const b of bands) {
      const pos = b.geometry.attributes.position, base = b.userData.base;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3];
        pos.setZ(i, Math.sin(x * 0.03 + t * 0.4 + b.userData.phase) * 10 + Math.sin(x * 0.011 - t * 0.23) * 16);
      }
      pos.needsUpdate = true;
      b.material.opacity = (0.3 + Math.sin(t * 0.5 + b.userData.phase) * 0.12) * night;
    }
  };
  return g;
}

// ------------------------------------------------------------ the Hollow Undercroft (dungeon)

const cryptStone = () => mat(0x5a5468);

// A floor lever that swings over when pulled.
export function makeLever() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(1.1, 0.8, 0.9), cryptStone(), 0, 0.4, 0);
  add(g, new THREE.BoxGeometry(0.5, 0.2, 0.7), mat(0x2b2733), 0, 0.85, 0);
  const arm = dyn(group(g, 0, 0.85, 0));
  add(arm, new THREE.CylinderGeometry(0.06, 0.07, 1.3, 8), mat(0x3a3644), 0, 0.65, 0);
  add(arm, sph(0.16, 12, 10), mat(0xc0392b), 0, 1.3, 0);
  let on = false, k = 0;
  g.userData.set = (v) => { on = v; };
  g.userData.anim = () => { k += ((on ? 1 : 0) - k) * 0.15; arm.rotation.x = -0.7 + k * 1.4; };
  return finish(g, 0.03, 0.1);
}

// A pressure plate carved with a coloured rune that glows when stepped on.
export function makePlate(color) {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(2.6, 0.22, 2.6), mat(0x4a4458), 0, 0.11, 0);
  const rune = ownMat(darker(color, 0.45), { emissive: color, emissiveIntensity: 0.15 });
  add(g, new THREE.TorusGeometry(0.75, 0.09, 6, 24), rune, 0, 0.24, 0, { rx: -Math.PI / 2, noOutline: true });
  add(g, new THREE.OctahedronGeometry(0.4), rune, 0, 0.24, 0, { s: [1, 0.15, 1], noOutline: true });
  g.userData.set = (state) => { rune.emissiveIntensity = state === 'lit' ? 1.4 : state === 'wrong' ? 0 : 0.15; };
  return finish(g, 0.03, 0.1);
}

// A stone tablet with four sockets that flash the order of the runes.
export function makeRuneTablet() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(4.6, 3.4, 0.6), cryptStone(), 0, 1.9, 0);
  add(g, new THREE.BoxGeometry(5, 0.35, 0.8), mat(0x6a6478), 0, 3.7, 0);
  add(g, new THREE.BoxGeometry(5, 0.35, 0.8), mat(0x6a6478), 0, 0.2, 0);
  const gems = [];
  for (let i = 0; i < 4; i++) {
    const m = ownMat(0x2a2438, { emissive: 0x000000, emissiveIntensity: 1.3 });
    add(g, new THREE.CylinderGeometry(0.38, 0.38, 0.14, 18), m, -1.65 + i * 1.1, 2, 0.32, { rx: Math.PI / 2, noOutline: true });
    gems.push(m);
  }
  g.userData.setGem = (i, color) => gems[i].emissive.set(color ?? 0x000000);
  return finish(g, 0.03, 0.1);
}

// A mirror on a turning stand. Angle is set from outside.
export function makeMirror() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.7, 0.85, 0.5, 10), cryptStone(), 0, 0.25, 0);
  const turn = dyn(group(g, 0, 0.5, 0));
  const frame = mat(0xb08a3a);
  add(turn, new THREE.BoxGeometry(2, 0.14, 0.2), frame, 0, 0.1, 0);
  add(turn, new THREE.BoxGeometry(2, 0.14, 0.2), frame, 0, 2.1, 0);
  for (const s of [-1, 1]) add(turn, new THREE.BoxGeometry(0.14, 2.1, 0.2), frame, s * 0.95, 1.1, 0);
  add(turn, new THREE.PlaneGeometry(1.8, 1.9), mat(0xdff6ff, { emissive: 0x6fb8ff, emissiveIntensity: 0.35, side: THREE.DoubleSide }), 0, 1.1, 0, { noOutline: true });
  let want = 0;
  g.userData.setAngle = (a) => { want = a; };
  g.userData.anim = () => { turn.rotation.y += (want - turn.rotation.y) * 0.2; };
  return finish(g, 0.03, 0.1);
}

// The crystal that shines the light beam.
export function makeEmitter(color = 0xfff0a0) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8), cryptStone(), 0, 0.6, 0);
  const c = dyn(add(g, new THREE.OctahedronGeometry(0.45), glowMat(color, 2.6), 0, 1.75, 0, { s: [1, 1.4, 1] }));
  g.userData.anim = (t) => { c.rotation.y = t * 1.5; c.position.y = 1.75 + Math.sin(t * 2) * 0.08; };
  return finish(g, 0.03, 0.1);
}

// The crystal socket the beam must reach. Lights up when it does.
export function makeReceiver() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8), cryptStone(), 0, 0.6, 0);
  add(g, new THREE.TorusGeometry(0.5, 0.08, 6, 16), mat(0xb08a3a), 0, 1.75, 0);
  const m = ownMat(0x3a3448, { emissive: 0x000000, emissiveIntensity: 1.3 });
  add(g, sph(0.34, 14, 10), m, 0, 1.75, 0);
  g.userData.set = (on) => m.emissive.set(on ? 0xfff0a0 : 0x000000);
  return finish(g, 0.03, 0.1);
}

// An iron gate that rises into its arch when opened.
export function makePortcullis(width = 4) {
  const g = new THREE.Group();
  const stone = cryptStone(), iron = mat(0x2b2733);
  for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(0.9, 4.6, 1), stone, s * (width / 2 + 0.45), 2.3, 0);
  add(g, new THREE.BoxGeometry(width + 1.8, 0.9, 1), stone, 0, 4.8, 0);
  add(g, new THREE.OctahedronGeometry(0.3), glowMat(0x7affd0, 2), 0, 4.8, 0.55, { s: [1, 1, 0.3] });
  const bars = dyn(group(g, 0, 0, 0));
  for (let x = -width / 2 + 0.3; x <= width / 2 - 0.25; x += 0.5) {
    add(bars, new THREE.CylinderGeometry(0.06, 0.06, 4.1, 6), iron, x, 2.2, 0);
    add(bars, new THREE.ConeGeometry(0.09, 0.3, 6), iron, x, 0.05, 0, { rx: Math.PI });
  }
  for (const y of [1.1, 2.5, 3.8]) add(bars, new THREE.BoxGeometry(width - 0.2, 0.1, 0.12), iron, 0, y, 0);
  let open = false, k = 0;
  g.userData.set = (v) => { open = v; };
  g.userData.snap = (v) => { open = v; k = v ? 1 : 0; bars.position.y = k * 3.9; };
  g.userData.anim = () => { k += ((open ? 1 : 0) - k) * 0.08; bars.position.y = k * 3.9; };
  return finish(g, 0.03, 0.1);
}

// A great blade that swings across a corridor.
export function makePendulum(width = 6) {
  const g = new THREE.Group();
  const stone = mat(0x4a4458), iron = mat(0x3a3644), steel = mat(0xc8ccd8);
  for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(0.7, 5.8, 0.8), stone, s * (width / 2 + 0.35), 2.9, 0);
  add(g, new THREE.BoxGeometry(width + 1.4, 0.6, 0.9), stone, 0, 5.8, 0);
  const pivot = dyn(group(g, 0, 5.4, 0));
  add(pivot, new THREE.CylinderGeometry(0.07, 0.07, 3.6, 6), iron, 0, -1.8, 0);
  add(pivot, new THREE.TorusGeometry(1.2, 0.16, 4, 18, Math.PI), steel, 0, -3.5, 0, { rz: Math.PI, s: [1, 0.9, 0.25] });
  add(pivot, new THREE.BoxGeometry(0.5, 0.5, 0.3), iron, 0, -3.5, 0);
  g.userData.setAngle = (a) => { pivot.rotation.z = a; };
  return finish(g, 0.03, 0.1);
}

// A soul pylon: an obelisk that feeds the Warden's ward until you shatter its crystal.
export function makePylon() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.9, 1.1, 0.6, 6), cryptStone(), 0, 0.3, 0);
  add(g, new THREE.CylinderGeometry(0.35, 0.6, 3.4, 6), mat(0x3a3448), 0, 2.2, 0);
  const m = ownMat(0x2a4a40, { emissive: 0x7affd0, emissiveIntensity: 1.2 });
  const crystal = dyn(add(g, new THREE.OctahedronGeometry(0.55), m, 0, 4.6, 0, { s: [1, 1.5, 1] }));
  let on = true;
  g.userData.set = (v) => { on = v; m.emissiveIntensity = v ? 1.2 : 0; crystal.visible = v; };
  g.userData.anim = (t) => { if (on) { crystal.rotation.y = t * 2; crystal.position.y = 4.6 + Math.sin(t * 3) * 0.15; } };
  return finish(g, 0.03, 0.1);
}

export function makeSarcophagus() {
  const g = new THREE.Group();
  const stone = mat(0x6a6478), dark = mat(0x4a4458);
  add(g, new THREE.BoxGeometry(1.6, 0.9, 3), dark, 0, 0.45, 0);
  add(g, new THREE.BoxGeometry(1.8, 0.3, 3.2), stone, 0, 1.05, 0);
  add(g, sph(0.35, 12, 8), stone, 0, 1.3, -1, { s: [1, 0.6, 1.1] });
  add(g, new THREE.BoxGeometry(0.9, 0.2, 1.6), stone, 0, 1.28, 0.2);
  return finish(g, 0.03, 0.1, true);
}

// Morvain, the Pale Warden: a lich in a bone crown with skulls circling him.
function paleWarden() {
  const g = makeWizard({ robe: 0x2a2438, hat: 0x1a1428, trim: 0x7affd0, gem: 0x7affd0, hatStyle: 'hood', skin: 0xd8dce8, eyeColor: 0x7affd0, hair: 0xe8e8f0, beard: true });
  const head = g.userData.head;
  for (let i = 0; i < 5; i++) {
    const a = -0.8 + (i / 4) * 1.6;
    add(head, new THREE.ConeGeometry(0.06, 0.4 + (i === 2 ? 0.2 : 0), 5), mat(0xf0e6d0), Math.sin(a) * 0.4, 0.62, Math.cos(a) * 0.1 - 0.05, { rz: -a * 0.3 });
  }
  const skulls = [];
  for (let i = 0; i < 4; i++) {
    const s = dyn(group(g, 0, 2, 0));
    add(s, sph(0.22, 12, 10), mat(0xf0e6d0), 0, 0, 0, { s: [1, 0.95, 1.1] });
    for (const x of [-1, 1]) add(s, sph(0.05, 8, 6), basic(0x7affd0), x * 0.08, 0.02, 0.2, { shadow: false });
    skulls.push(s);
  }
  const base = g.userData.anim;
  g.userData.anim = (t, moving) => {
    base(t, moving);
    skulls.forEach((s, i) => {
      const a = t * 1.1 + (i / 4) * Math.PI * 2;
      s.position.set(Math.cos(a) * 1.2, 1.7 + Math.sin(t * 2.5 + i) * 0.25, Math.sin(a) * 1.2);
      s.rotation.y = -a;
    });
  };
  g.scale.setScalar(1.6);
  return g;
}

// A stone stairwell leading down under Hollow Lane.
export function makeCryptStair() {
  const g = new THREE.Group();
  const stone = mat(0x6a6478), dark = basic(0x07060c);
  add(g, new THREE.BoxGeometry(3.6, 0.3, 4), stone, 0, 0.15, 0);
  add(g, new THREE.BoxGeometry(2.6, 0.32, 3.2), dark, 0, 0.17, 0, { noOutline: true });
  for (let k = 0; k < 4; k++) add(g, new THREE.BoxGeometry(2.5, 0.04, 0.5), mat(darker(0x6a6478, 0.8 - k * 0.17)), 0, 0.34, 1.2 - k * 0.6, { noOutline: true, shadow: false });
  for (const s of [-1, 1]) {
    add(g, new THREE.BoxGeometry(0.6, 3.4, 0.6), stone, s * 1.7, 1.7, -1.6);
    add(g, sph(0.3, 10, 8), mat(0xf0e6d0), s * 1.7, 3.6, -1.6, { s: [1, 0.9, 1.1] });
  }
  add(g, new THREE.BoxGeometry(4.2, 0.5, 0.7), stone, 0, 3.3, -1.6);
  add(g, new THREE.OctahedronGeometry(0.28), glowMat(0x7affd0, 2.2), 0, 3.3, -1.2, { s: [1, 1, 0.3] });
  return finish(g, 0.03, 0.1, true);
}

// ------------------------------------------------------------ Stormspire (Chapter 5)

// A thunderbird: huge storm-feathered wings with lightning in the quills.
// Used for Thunder Rocs and for Voltaris, the Storm Herald (boss: true).
function thunderbird({ size = 1, boss = false } = {}) {
  const g = new THREE.Group();
  const body = group(g, 0, 0, 0);
  const plum = mat(boss ? 0x2a2a5a : 0x3a4a7a), plum2 = mat(boss ? 0x4a3a8a : 0x5a6a9a), belly = mat(0xb8c0e8), gold = mat(0xf2c14e);
  const bolt = glowMat(0x9ff0ff, 2.4);
  const hip = group(body, 0, 2.2, 0);
  add(hip, sph(0.9, 18, 14), plum, 0, 0, 0, { s: [0.95, 0.9, 1.45] });
  add(hip, sph(0.7, 16, 12), belly, 0, -0.2, 0.35, { s: [0.85, 0.8, 1.1] });
  // neck and head
  const neck = group(hip, 0, 0.55, 1.05);
  limb(neck, V3(0, -0.2, -0.2), V3(0, 0.55, 0.25), 0.42, 0.32, plum, 10);
  const head = group(neck, 0, 0.8, 0.35);
  add(head, sph(0.42, 16, 12), plum2, 0, 0, 0, { s: [0.9, 0.95, 1.1] });
  add(head, new THREE.ConeGeometry(0.2, 0.75, 8), gold, 0, -0.08, 0.6, { rx: Math.PI / 2 });
  add(head, new THREE.ConeGeometry(0.12, 0.3, 6), gold, 0, -0.22, 0.85, { rx: Math.PI * 0.8 });
  for (const s of [-1, 1]) {
    const e = makeEye(0.09, { glow: 0x9ff0ff });
    e.position.set(s * 0.24, 0.1, 0.3);
    head.add(e);
  }
  for (let i = 0; i < 5; i++) add(head, new THREE.ConeGeometry(0.07, 0.6 + i * 0.08, 5), i % 2 ? bolt : plum2, 0, 0.3 + i * 0.02, -0.15 - i * 0.12, { rx: -1.1 - i * 0.1 });
  const mouth = group(head, 0, -0.1, 0.95);
  // wings: arm bones under a shoulder of coverts, then a fan of long lozenge feathers,
  // every other one veined with lightning
  const feather = (parent, x, y, z, len, ang, material, vein) => {
    const f = add(parent, new THREE.OctahedronGeometry(1, 0), material, x - Math.sin(ang) * len / 2, y, z - Math.cos(ang) * len / 2, { ry: ang, s: [0.26, 0.045, len / 2] });
    if (vein) add(parent, new THREE.BoxGeometry(0.035, 0.05, len * 0.72), bolt, f.position.x, y + 0.03, f.position.z, { ry: ang, noOutline: true, shadow: false });
  };
  const wings = [];
  for (const s of [-1, 1]) {
    const w = group(hip, s * 0.7, 0.35, 0.1);
    const j = [V3(0, 0, 0), V3(s * 1.3, 0.15, -0.1), V3(s * 2.6, 0.05, -0.35), V3(s * 3.5, -0.05, -0.6)];
    limb(w, j[0], j[1], 0.24, 0.15, plum, 8);
    limb(w, j[1], j[2], 0.15, 0.09, plum, 8);
    limb(w, j[2], j[3], 0.09, 0.04, plum2, 6);
    add(w, sph(0.5, 14, 8), plum2, s * 1.1, 0.06, -0.2, { s: [2.3, 0.28, 0.95] });
    add(w, sph(0.4, 12, 8), plum, s * 2.2, 0.03, -0.35, { s: [2.0, 0.22, 0.8] });
    for (let k = 0; k < 5; k++) feather(w, s * (0.5 + k * 0.4), -0.04, -0.3, 1.0 + k * 0.06, 0, k % 2 ? plum : plum2, false);
    for (let k = 0; k < 8; k++) {
      const t = k / 7, seg = t < 0.5 ? 1 : 2, u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
      const at = j[seg].clone().lerp(j[seg + 1], u);
      feather(w, at.x, at.y - 0.05 - k * 0.01, at.z - 0.1, 1.4 + t * 1.2 - (k === 7 ? 0.4 : 0), -s * t * 1.05, k % 2 ? plum2 : plum, k % 2 === 0);
    }
    wings.push({ w, s });
  }
  // tail fan
  for (let k = -3; k <= 3; k++) {
    const len = 1.9 - Math.abs(k) * 0.12, a = k * 0.16;
    const f = add(hip, new THREE.OctahedronGeometry(1, 0), k % 2 ? plum2 : plum, Math.sin(a) * (0.6 + len / 2), 0.25 - len * 0.12, -1.0 - Math.cos(a) * len / 2, { ry: -a, rx: 0.25, s: [0.24, 0.045, len / 2] });
    if (k % 2 === 0) add(hip, new THREE.BoxGeometry(0.035, 0.05, len * 0.7), bolt, f.position.x, f.position.y + 0.04, f.position.z, { ry: -a, rx: 0.25, noOutline: true, shadow: false });
  }
  // legs with talons
  for (const s of [-1, 1]) {
    const leg = group(hip, s * 0.4, -0.6, 0.2);
    limb(leg, V3(0, 0, 0), V3(0, -1.1, 0.1), 0.14, 0.08, gold, 8);
    for (const a of [-0.5, 0, 0.5]) add(leg, new THREE.ConeGeometry(0.05, 0.35, 5), mat(0x2a2030), Math.sin(a) * 0.15, -1.3, 0.2 + Math.cos(a) * 0.12, { rx: Math.PI / 2.3 });
  }
  if (boss) {
    // a crown of storm-crystals
    for (let i = 0; i < 5; i++) add(head, new THREE.OctahedronGeometry(0.1), bolt, (i - 2) * 0.12, 0.45, -0.05, { s: [0.7, 1.8, 0.7] });
  }
  g.scale.setScalar(size);
  g.userData.bodyWidth = 8.6 * size;
  let flap = 0, roar = 0, last = 0;
  g.userData.mouth = mouth;
  g.userData.setFlying = (f) => { flap = f ? 1 : 0; };
  g.userData.roar = () => { roar = 1; };
  g.userData.anim = (t, moving) => {
    const dt = Math.min(0.1, Math.max(0, t - last));
    last = t;
    roar = Math.max(0, roar - dt);
    const speed = flap ? 7 : moving ? 3 : 1.2;
    const amp = flap ? 0.75 : moving ? 0.25 : 0.08;
    for (const { w, s } of wings) w.rotation.z = s * (Math.sin(t * speed) * amp + (flap ? 0.1 : -0.15));
    hip.position.y = 2.2 + (flap ? Math.sin(t * speed) * 0.25 : Math.sin(t * 1.5) * 0.05);
    neck.rotation.x = -roar * 0.6 + Math.sin(t * 1.1) * 0.05;
    head.rotation.y = Math.sin(t * 0.7) * 0.3;
  };
  return finish(g, 0.035, 0.1);
}

// A gale sprite: a little whirlwind with a cheeky face.
function galeSprite() {
  const g = new THREE.Group();
  const body = group(g, 0, 0, 0);
  const air = mat(0xdfe8ff, { emissive: 0x8a9aff, emissiveIntensity: 0.25 });
  const head = group(body, 0, 1.7, 0);
  add(head, sph(0.45, 16, 12), air);
  const face = makeFace(0.45, { eyeR: 0.12, gap: 0.17, eyeY: 0.02, iris: 0x6a3aff, brows: 'angry', browColor: 0x4a3a8a, mouth: 'grin', mouthY: -0.17, mouthW: 0.12 });
  head.add(face);
  const rings = [];
  for (let k = 0; k < 5; k++) {
    const r = dyn(add(body, new THREE.TorusGeometry(0.5 - k * 0.08, 0.07, 6, 20), mat(k % 2 ? 0xc8d4ff : 0xeef2ff, { transparent: true, opacity: 0.8 }), 0, 1.25 - k * 0.25, 0, { rx: Math.PI / 2, noOutline: true }));
    rings.push(r);
  }
  const bits = [];
  for (let k = 0; k < 4; k++) bits.push(dyn(add(body, new THREE.OctahedronGeometry(0.08), glowMat(0xb46bff, 2), 0, 0, 0, { shadow: false })));
  g.userData.anim = (t, moving) => {
    body.position.y = Math.sin(t * 3) * 0.12;
    rings.forEach((r, k) => { r.rotation.z = t * (4 + k); r.position.x = Math.sin(t * 5 + k) * 0.06 * k; });
    bits.forEach((b, k) => { const a = t * 4 + k * 1.6; b.position.set(Math.cos(a) * 0.8, 0.8 + k * 0.25, Math.sin(a) * 0.8); });
    head.rotation.z = moving ? Math.sin(t * 8) * 0.15 : 0;
  };
  return finish(g, 0.03, 0.08);
}

// A floating island: a grassy top on a craggy rock that trails roots and crystals.
export function makeSkyIsland(r = 16, { grass = 0x5a9a4a, rock = 0x6a6078, crystals = true } = {}) {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(r, r * 0.92, 1.4, 28), mat(0x7a6a58), 0, -0.72, 0);
  add(g, new THREE.ConeGeometry(r * 0.92, r * 1.3, 9), mat(rock), 0, -0.7 - r * 0.65, 0, { rx: Math.PI, shadow: false });
  add(g, new THREE.ConeGeometry(r * 0.5, r * 0.9, 7), mat(darker(rock, 0.8)), r * 0.35, -1 - r * 0.45, r * 0.2, { rx: Math.PI, shadow: false });
  add(g, new THREE.ConeGeometry(r * 0.4, r * 0.7, 7), mat(darker(rock, 0.85)), -r * 0.4, -1 - r * 0.35, -r * 0.25, { rx: Math.PI, shadow: false });
  add(g, new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.12, 28), mat(grass), 0, -0.02, 0, { noOutline: true });
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2, d = r * (0.3 + Math.random() * 0.6);
    limb(g, V3(Math.cos(a) * d, -1.5, Math.sin(a) * d), V3(Math.cos(a) * d * 1.05, -3.5 - Math.random() * 4, Math.sin(a) * d * 1.05), 0.12, 0.03, mat(0x4a3a2a), 5);
  }
  if (crystals) for (let i = 0; i < 4; i++) {
    const a = Math.random() * Math.PI * 2;
    add(g, new THREE.OctahedronGeometry(0.6 + Math.random() * 0.5), glowMat(0xb46bff, 1.8), Math.cos(a) * r * 0.5, -r * 0.9 - Math.random() * 3, Math.sin(a) * r * 0.5, { s: [0.7, 1.6, 0.7] });
  }
  return finish(g, 0.06, 0.6, true);
}

// A sky pirate airship: a wooden hull hung under a patched balloon, propellers spinning.
export function makeAirship(sail = 0x8a1a1a) {
  const g = new THREE.Group();
  const ship = group(g, 0, 0, 0);
  dyn(ship);
  const wood = mat(0x7a4a2a), dark = mat(0x4a2a18), trim = mat(0xf2c14e);
  add(ship, sph(1.6, 18, 12), wood, 0, 0, 0, { s: [1.3, 0.75, 3.2] });
  add(ship, new THREE.BoxGeometry(3.6, 0.3, 8.6), dark, 0, 0.9, 0);
  for (const s of [-1, 1]) add(ship, new THREE.BoxGeometry(0.15, 0.7, 8.4), wood, s * 1.8, 1.3, 0);
  add(ship, new THREE.ConeGeometry(0.25, 2.2, 6), trim, 0, 0.3, 5.3, { rx: Math.PI / 2 });
  add(ship, new THREE.CylinderGeometry(0.14, 0.14, 7, 8), dark, 0, 4.4, 0);
  // the balloon
  add(ship, sph(2.6, 20, 14), mat(0xd8c8a8), 0, 7.6, 0, { s: [1, 0.9, 2.3] });
  for (const z of [-3, 0, 3]) add(ship, new THREE.TorusGeometry(2.4, 0.08, 6, 20), mat(0x6a4a2a), 0, 7.6, z, { s: [1, 0.9, 1] });
  add(ship, new THREE.PlaneGeometry(2.4, 1.6), mat(sail, { side: THREE.DoubleSide }), 0, 3.4, -2.6, { noOutline: true });
  for (const s of [-1, 1]) for (const z of [-3, 3]) limb(ship, V3(s * 1.7, 1.3, z * 0.9), V3(s * 1.8, 6.2, z * 0.8), 0.03, 0.03, dark, 4);
  const props = [];
  for (const s of [-1, 1]) {
    const pg = dyn(group(ship, s * 2.1, 0.8, -3.6));
    add(pg, new THREE.BoxGeometry(0.2, 2.2, 0.08), wood);
    add(pg, new THREE.BoxGeometry(2.2, 0.2, 0.08), wood);
    props.push(pg);
  }
  const seed = Math.random() * 10;
  g.userData.anim = (t) => {
    ship.position.y = Math.sin(t * 0.8 + seed) * 0.35;
    ship.rotation.z = Math.sin(t * 0.6 + seed) * 0.04;
    for (const p of props) p.rotation.z = t * 8;
  };
  return finish(g, 0.05, 0.3);
}

// A rope bridge of planks between two islands (runs along +z).
export function makeRopeBridge(len = 20, width = 5) {
  const g = new THREE.Group();
  const plank = mat(0x8a6a4a), plank2 = mat(0x7a5a3a), rope = mat(0xc8a878);
  const n = Math.round(len / 0.7);
  for (let i = 0; i < n; i++) {
    const z = -len / 2 + (i + 0.5) * (len / n);
    const sag = -Math.sin((i / (n - 1)) * Math.PI) * 0.35;
    add(g, new THREE.BoxGeometry(width, 0.12, len / n * 0.85), i % 2 ? plank : plank2, 0, sag - 0.02, z);
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i <= 4; i++) {
      const z = -len / 2 + (i / 4) * len;
      add(g, new THREE.CylinderGeometry(0.08, 0.1, 1.3, 6), plank2, s * width / 2, 0.55, z);
    }
    limb(g, V3(s * width / 2, 1.1, -len / 2), V3(s * width / 2, 0.8, 0), 0.04, 0.04, rope, 4);
    limb(g, V3(s * width / 2, 0.8, 0), V3(s * width / 2, 1.1, len / 2), 0.04, 0.04, rope, 4);
  }
  return finish(g, 0.03, 0.2, true);
}

// A lightning rod: a tall iron spike with a glowing storm-crystal.
export function makeLightningRod() {
  const g = new THREE.Group();
  const iron = mat(0x4a4a5a);
  add(g, new THREE.CylinderGeometry(0.5, 0.7, 0.6, 8), mat(0x6a6078), 0, 0.3, 0);
  add(g, new THREE.CylinderGeometry(0.08, 0.14, 6, 8), iron, 0, 3.3, 0);
  for (const y of [2, 3.5, 5]) add(g, new THREE.TorusGeometry(0.28, 0.05, 6, 14), mat(0xb08a3a), 0, y, 0, { rx: Math.PI / 2 });
  add(g, new THREE.OctahedronGeometry(0.4), glowMat(0xb46bff, 2.6), 0, 6.6, 0, { s: [0.7, 1.4, 0.7] });
  return finish(g, 0.03, 0.1, true);
}

// A dark storm cloud that drifts and flickers.
export function makeStormCloud(scale = 1) {
  const g = new THREE.Group();
  const puffs = group(g);
  dyn(puffs);
  for (let k = 0; k < 6; k++) add(puffs, sph(2 + Math.random() * 1.5, 10, 8), mat(k % 2 ? 0x4a4a6a : 0x3a3a58), (k - 2.5) * 2.2, Math.random() * 1.2, Math.random() * 2, { shadow: false, s: [1, 0.65, 1] });
  const glow = dyn(add(puffs, sph(2.5, 10, 8), basic(0xc8b8ff, { transparent: true, opacity: 0 }), 0, -0.5, 1, { shadow: false, noOutline: true }));
  const seed = Math.random() * 20;
  g.scale.setScalar(scale);
  g.userData.anim = (t) => {
    puffs.position.x = Math.sin(t * 0.05 + seed) * 6;
    const f = Math.sin(t * 7 + seed) > 0.985 ? 0.55 : Math.max(0, glow.material.opacity - 0.05);
    glow.material.opacity = f;
  };
  return finish(g, 0.06, 0.5);
}

// ------------------------------------------------------------ Thornwood (Chapter 6)

// A treant: a walking tree with a bark face, branch arms and root feet.
// blight: the Magister's purple corruption.
function treant({ size = 1, blight = false } = {}) {
  const g = new THREE.Group();
  const body = group(g);
  const bark = mat(blight ? 0x4a3a44 : 0x6b4a2b), bark2 = mat(blight ? 0x3a2a38 : 0x5a3d24);
  const leaf = mat(blight ? 0x6a3a8a : 0x3f8a4a), leaf2 = mat(blight ? 0x8a4aaa : 0x5aa050);
  const glowC = blight ? 0xd06aff : 0x9fff7a;
  const trunk = group(body, 0, 0, 0);
  add(trunk, new THREE.CylinderGeometry(0.62, 0.8, 2.6, 10), bark, 0, 1.9, 0);
  add(trunk, new THREE.CylinderGeometry(0.5, 0.62, 0.8, 10), bark2, 0, 3.5, 0);
  for (let k = 0; k < 5; k++) add(trunk, new THREE.BoxGeometry(0.08, 1.6, 0.06), bark2, Math.sin(k * 1.3) * 0.6, 1.9, Math.cos(k * 1.3) * 0.6, { ry: k * 1.3, noOutline: true });
  // face in the bark
  for (const s of [-1, 1]) {
    add(trunk, sph(0.16, 10, 8), basic(0x1a1008), s * 0.24, 2.9, 0.55, { s: [1, 0.7, 0.5], shadow: false });
    add(trunk, sph(0.07, 8, 6), basic(glowC), s * 0.24, 2.9, 0.62, { shadow: false });
  }
  add(trunk, new THREE.BoxGeometry(0.45, 0.1, 0.1), basic(0x1a1008), 0, 2.45, 0.66, { shadow: false });
  // crown of leaves
  for (const [x, y, z, r, m] of [[0, 4.4, 0, 1.2, leaf], [0.8, 4, 0.2, 0.8, leaf2], [-0.8, 4.1, -0.1, 0.85, leaf], [0.1, 4.1, -0.8, 0.8, leaf2], [0, 3.9, 0.7, 0.7, leaf]]) add(trunk, new THREE.IcosahedronGeometry(r, 1), m, x, y, z);
  if (blight) for (let k = 0; k < 6; k++) add(trunk, new THREE.OctahedronGeometry(0.2), glowMat(0xd06aff, 2.2), Math.sin(k) * 0.9, 1.4 + k * 0.45, Math.cos(k) * 0.7, { s: [0.6, 1.8, 0.6] });
  // arms
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = group(trunk, s * 0.65, 3, 0);
    limb(arm, V3(0, 0, 0), V3(s * 0.8, -0.9, 0.2), 0.2, 0.14, bark, 8);
    limb(arm, V3(s * 0.8, -0.9, 0.2), V3(s * 0.9, -1.9, 0.35), 0.14, 0.08, bark, 8);
    for (const a of [-0.4, 0, 0.4]) limb(arm, V3(s * 0.9, -1.9, 0.35), V3(s * (0.9 + a * 0.3), -2.3, 0.35 + Math.abs(a) * 0.2), 0.06, 0.02, bark2, 5);
    add(arm, new THREE.IcosahedronGeometry(0.3, 0), leaf2, s * 0.5, -0.4, 0.1);
    arms.push(arm);
  }
  // root legs
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = group(body, s * 0.4, 0.8, 0);
    limb(leg, V3(0, 0, 0), V3(s * 0.15, -0.75, 0.1), 0.26, 0.2, bark2, 8);
    for (const a of [-0.6, 0, 0.6]) limb(leg, V3(s * 0.15, -0.7, 0.1), V3(s * 0.15 + Math.sin(a) * 0.5, -0.8, 0.1 + Math.cos(a) * 0.4), 0.1, 0.04, bark2, 5);
    legs.push(leg);
  }
  g.scale.setScalar(size);
  g.userData.anim = (t, moving) => {
    const k = moving ? t * 4 : 0;
    legs.forEach((l, i) => { l.rotation.x = Math.sin(k + i * Math.PI) * 0.35; });
    arms.forEach((a, i) => { a.rotation.x = moving ? Math.sin(k + i * Math.PI) * 0.3 : Math.sin(t * 1.2 + i) * 0.08; });
    trunk.rotation.z = Math.sin(t * 0.8) * 0.03;
    body.position.y = moving ? Math.abs(Math.sin(k)) * 0.08 : 0;
  };
  return finish(g, 0.04, 0.1);
}

// A spore shambler: a mushroom that got up and walked away.
function shroom() {
  const g = new THREE.Group();
  const body = group(g);
  const stem = mat(0xf0e6d0), cap = mat(0xd06aff, { emissive: 0x8a2aff, emissiveIntensity: 0.4 });
  add(body, new THREE.CylinderGeometry(0.5, 0.65, 1.6, 12), stem, 0, 1, 0);
  add(body, new THREE.SphereGeometry(1.25, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), cap, 0, 1.75, 0, { s: [1, 0.8, 1] });
  add(body, new THREE.CylinderGeometry(1.2, 1.2, 0.12, 18), mat(0xe8d0f0), 0, 1.75, 0);
  for (let k = 0; k < 8; k++) { const a = k * 0.8; add(body, sph(0.13, 8, 6), basic(0xfff0ff), Math.cos(a) * 0.8, 2.45 - Math.abs(Math.sin(a)) * 0.2, Math.sin(a) * 0.8, { shadow: false }); }
  const face = makeFace(0.55, { eyeR: 0.12, gap: 0.2, eyeY: 0.05, iris: 0x6a2aaa, brows: 'angry', browColor: 0x3a1a4a, mouth: 'o', mouthY: -0.16, mouthW: 0.1 });
  face.position.set(0, 1.2, 0.08);
  body.add(face);
  const legs = [];
  for (const s of [-1, 1]) legs.push(add(body, new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8), stem, s * 0.3, 0.25, 0));
  const spores = [];
  for (let k = 0; k < 6; k++) spores.push(dyn(add(g, sph(0.06, 6, 4), basic(0xd8a0ff), 0, 0, 0, { shadow: false })));
  g.userData.anim = (t, moving) => {
    body.position.y = moving ? Math.abs(Math.sin(t * 6)) * 0.15 : Math.sin(t * 1.5) * 0.03;
    body.rotation.z = moving ? Math.sin(t * 6) * 0.08 : 0;
    spores.forEach((s, k) => { const f = (t * 0.3 + k / 6) % 1; s.position.set(Math.sin(k * 2 + t) * 0.8, 2.3 + f * 2, Math.cos(k * 2 + t) * 0.8); s.scale.setScalar(1 - f); });
  };
  return finish(g, 0.035, 0.08);
}

// A pixie trickster: a tiny fae with shimmering butterfly wings.
function pixie() {
  const g = new THREE.Group();
  const body = group(g, 0, 1.6, 0);
  const skin = mat(0xb8f0c0), dress = mat(0x5fdc6a);
  add(body, new THREE.ConeGeometry(0.28, 0.6, 10), dress, 0, -0.2, 0);
  const head = group(body, 0, 0.3, 0);
  add(head, sph(0.26, 14, 10), skin);
  add(head, sph(0.27, 14, 10), mat(0xff8ad0), 0, 0.06, -0.04, { s: [1.05, 0.9, 1] });
  const face = makeFace(0.26, { eyeR: 0.07, gap: 0.1, eyeY: 0, iris: 0x2e7d3b, brows: 'happy', mouth: 'grin', mouthY: -0.1, mouthW: 0.06 });
  head.add(face);
  for (const s of [-1, 1]) add(head, new THREE.ConeGeometry(0.04, 0.2, 5), skin, s * 0.24, 0.1, 0, { rz: -s * 1.2 });
  const wingM = mat(0xc8ffe0, { transparent: true, opacity: 0.7, side: THREE.DoubleSide, emissive: 0x5fdc6a, emissiveIntensity: 0.4 });
  const wings = [];
  for (const s of [-1, 1]) {
    const w = dyn(group(body, s * 0.05, 0.05, -0.12));
    add(w, new THREE.CircleGeometry(0.4, 12), wingM, s * 0.35, 0.15, 0, { ry: s * 0.3, s: [1, 1.3, 1], noOutline: true });
    add(w, new THREE.CircleGeometry(0.25, 10), wingM, s * 0.25, -0.25, 0, { ry: s * 0.3, noOutline: true });
    wings.push({ w, s });
  }
  const dust = [];
  for (let k = 0; k < 5; k++) dust.push(dyn(add(g, sph(0.04, 6, 4), basic(0xffff9a), 0, 0, 0, { shadow: false })));
  g.userData.anim = (t) => {
    body.position.y = 1.6 + Math.sin(t * 3) * 0.2;
    for (const { w, s } of wings) w.rotation.y = s * Math.sin(t * 22) * 0.7;
    dust.forEach((d, k) => { const f = (t * 0.6 + k / 5) % 1; d.position.set(Math.sin(k * 3) * 0.3, body.position.y - f * 1.2, Math.cos(k * 3) * 0.3); d.scale.setScalar(1 - f); });
  };
  return finish(g, 0.025, 0.05);
}

// A blight horror: a knot of purple thorns around one staring eye.
function blightHorror() {
  const g = new THREE.Group();
  const body = group(g, 0, 1.4, 0);
  const flesh = mat(0x4a2a5a), thorn = mat(0x2a1a2a);
  add(body, new THREE.DodecahedronGeometry(1, 1), flesh, 0, 0, 0, { s: [1, 0.9, 1] });
  for (let k = 0; k < 18; k++) {
    const a = k * 2.39, y = Math.cos(k * 0.7) * 0.8, r = Math.sqrt(1 - (y / 1.1) ** 2);
    add(body, new THREE.ConeGeometry(0.1, 0.8, 5), thorn, Math.cos(a) * r * 0.95, y, Math.sin(a) * r * 0.95, { rz: -Math.cos(a) * 1.2, rx: Math.sin(a) * 1.2 });
  }
  const eye = makeEye(0.34, { glow: 0xd06aff });
  eye.position.set(0, 0.1, 0.9);
  body.add(eye);
  for (let k = 0; k < 4; k++) add(body, new THREE.OctahedronGeometry(0.18), glowMat(0xd06aff, 2.2), Math.cos(k * 1.6) * 0.7, 0.8, Math.sin(k * 1.6) * 0.7, { s: [0.6, 1.8, 0.6] });
  const legs = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.78;
    const l = group(body, Math.cos(a) * 0.6, -0.6, Math.sin(a) * 0.6);
    limb(l, V3(0, 0, 0), V3(Math.cos(a) * 0.5, -0.8, Math.sin(a) * 0.5), 0.12, 0.05, thorn, 6);
    legs.push(l);
  }
  g.userData.anim = (t, moving) => {
    body.rotation.y = Math.sin(t * 0.7) * 0.3;
    body.position.y = 1.4 + (moving ? Math.abs(Math.sin(t * 7)) * 0.12 : Math.sin(t * 2) * 0.05);
    legs.forEach((l, k) => { l.rotation.z = moving ? Math.sin(t * 8 + k * 1.6) * 0.3 : 0; });
  };
  return finish(g, 0.035, 0.08);
}

// A colossal forest tree: flared roots, a trunk you could build a house in, a canopy like a cloud.
export function makeGiantTree(scale = 1, { leaf = 0x3f7a3a, blight = false } = {}) {
  const g = new THREE.Group();
  const bark = mat(blight ? 0x4a3a44 : 0x5a3d24), bark2 = mat(blight ? 0x3a2a38 : 0x4a3020);
  add(g, new THREE.CylinderGeometry(3, 4.2, 30, 12), bark, 0, 15, 0);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + 0.3;
    limb(g, V3(Math.cos(a) * 2.6, 5, Math.sin(a) * 2.6), V3(Math.cos(a) * 6.5, 0, Math.sin(a) * 6.5), 1.3, 0.6, bark2, 8);
  }
  for (let k = 0; k < 5; k++) {
    const a = k * 1.3, y = 20 + k * 2;
    limb(g, V3(0, y, 0), V3(Math.cos(a) * 8, y + 4, Math.sin(a) * 8), 0.9, 0.4, bark, 7);
  }
  const L = mat(blight ? 0x5a2a6a : leaf), L2 = mat(blight ? 0x7a3a8a : lighter(leaf, 0.1));
  for (let k = 0; k < 9; k++) {
    const a = k * 0.7, r = k === 0 ? 0 : 6 + (k % 3) * 2;
    add(g, new THREE.IcosahedronGeometry(k === 0 ? 9 : 5 + (k % 3), 1), k % 2 ? L : L2, Math.cos(a) * r, 32 + (k % 4) * 2, Math.sin(a) * r, { shadow: k < 3 });
  }
  for (let k = 0; k < 4; k++) {
    const a = k * 1.7 + 0.5;
    add(g, new THREE.CylinderGeometry(1.2, 1.2, 0.3, 12, 1, false, 0, Math.PI), mat(0xd8b060), Math.cos(a) * 3.1, 6 + k * 3.5, Math.sin(a) * 3.1, { ry: -a + Math.PI / 2 });
  }
  if (blight) for (let k = 0; k < 8; k++) add(g, new THREE.OctahedronGeometry(0.5), glowMat(0xd06aff, 2), Math.cos(k * 0.8) * 3.4, 3 + k * 2.5, Math.sin(k * 0.8) * 3.4, { s: [0.6, 1.8, 0.6] });
  g.scale.setScalar(scale);
  return finish(g, 0.08, 0.6, true);
}

// A round house dug into a great stump, with a round door and a mossy roof.
export function makeRootHouse(door = 0x2e7d3b) {
  const g = new THREE.Group();
  const bark = mat(0x6b4a2b), moss = mat(0x4f8a44);
  add(g, new THREE.CylinderGeometry(3, 3.4, 3.6, 16), bark, 0, 1.8, 0);
  add(g, new THREE.SphereGeometry(3.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), moss, 0, 3.5, 0, { s: [1, 0.6, 1] });
  add(g, new THREE.CylinderGeometry(0.9, 0.9, 0.2, 16), mat(door), 0, 1.2, 3.3, { rx: Math.PI / 2 });
  add(g, new THREE.TorusGeometry(0.95, 0.1, 6, 18), mat(0x4a3020), 0, 1.2, 3.35);
  add(g, sph(0.1, 8, 6), mat(0xf2c14e), 0.55, 1.2, 3.45);
  for (const s of [-1, 1]) add(g, new THREE.CylinderGeometry(0.45, 0.45, 0.2, 12), glowMat(0xffd27a, 1.4), s * 1.9, 2.1, 2.62, { rx: Math.PI / 2, ry: s * 0.6 });
  add(g, new THREE.CylinderGeometry(0.3, 0.35, 1.6, 8), mat(0x7a6a5a), 1.4, 5, -0.6);
  for (let k = 0; k < 3; k++) add(g, new THREE.IcosahedronGeometry(0.35, 0), mat(0xff8ad0), -1.2 + k * 0.4, 3.9 + (k % 2) * 0.2, 1.6);
  return finish(g, 0.045, 0.3, true);
}

// A tangle of blighted thorns.
export function makeThornBush(scale = 1, color = 0x4a2a5a) {
  const g = new THREE.Group();
  const m = mat(color), tip = mat(0x2a1a2a);
  for (let k = 0; k < 9; k++) {
    const a = k * 0.7, len = 1.4 + (k % 3) * 0.6;
    const p0 = V3(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3), p1 = V3(Math.cos(a) * len * 0.7, len, Math.sin(a) * len * 0.7);
    limb(g, p0, p1, 0.12, 0.03, m, 6);
    add(g, new THREE.ConeGeometry(0.05, 0.3, 4), tip, p1.x * 0.6, p1.y * 0.6, p1.z * 0.6, { rz: -Math.cos(a) });
  }
  add(g, new THREE.OctahedronGeometry(0.2), glowMat(0xd06aff, 2), 0, 0.5, 0);
  g.scale.setScalar(scale);
  return finish(g, 0.03, 0.1, true);
}

// ------------------------------------------------------------ the Hollow Deep (Chapter 7)

// A skeleton: 'warrior' (sword and shield) or 'mage' (hooded robe and a bone staff).
function skeleton(kind = 'warrior') {
  const g = new THREE.Group();
  const body = group(g);
  const bone = mat(0xe8dcc0), dark = mat(0x2a2030), glowC = 0xd06aff;
  const hip = group(body, 0, 1.05, 0);
  add(hip, new THREE.BoxGeometry(0.45, 0.14, 0.22), bone);
  for (let k = 0; k < 4; k++) add(hip, new THREE.CylinderGeometry(0.05, 0.05, 0.14, 6), bone, 0, 0.12 + k * 0.13, -0.05);
  const chest = group(hip, 0, 0.72, 0);
  for (let k = 0; k < 4; k++) add(chest, new THREE.TorusGeometry(0.24 - k * 0.02, 0.035, 5, 14, Math.PI * 1.4), bone, 0, 0.05 - k * 0.1, 0, { rx: Math.PI / 2, rz: -Math.PI * 0.2 });
  const head = group(chest, 0, 0.42, 0.02);
  add(head, sph(0.24, 14, 10), bone, 0, 0, 0, { s: [0.95, 1, 1] });
  add(head, new THREE.BoxGeometry(0.28, 0.1, 0.2), bone, 0, -0.2, 0.06);
  for (const s of [-1, 1]) {
    add(head, sph(0.075, 10, 8), basic(0x0a0610), s * 0.09, 0.02, 0.2, { shadow: false });
    add(head, sph(0.03, 6, 4), basic(glowC), s * 0.09, 0.02, 0.26, { shadow: false });
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = group(chest, s * 0.32, 0.15, 0);
    limb(arm, V3(0, 0, 0), V3(s * 0.08, -0.4, 0.05), 0.045, 0.04, bone, 6);
    limb(arm, V3(s * 0.08, -0.4, 0.05), V3(s * 0.08, -0.75, 0.2), 0.04, 0.035, bone, 6);
    arms.push(arm);
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = group(hip, s * 0.14, 0, 0);
    limb(leg, V3(0, 0, 0), V3(0, -0.5, 0.03), 0.055, 0.045, bone, 6);
    limb(leg, V3(0, -0.5, 0.03), V3(0, -0.95, 0), 0.045, 0.04, bone, 6);
    add(leg, new THREE.BoxGeometry(0.12, 0.06, 0.22), bone, 0, -0.98, 0.05);
    legs.push(leg);
  }
  if (kind === 'warrior') {
    const sword = group(arms[1], 0.1, -0.75, 0.22);
    add(sword, new THREE.BoxGeometry(0.06, 0.9, 0.02), mat(0x9a9aa8), 0, 0.4, 0);
    add(sword, new THREE.BoxGeometry(0.26, 0.05, 0.06), dark, 0, -0.05, 0);
    add(arms[0], new THREE.CylinderGeometry(0.34, 0.34, 0.06, 12), mat(0x4a3a5a), -0.12, -0.6, 0.25, { rz: Math.PI / 2, ry: 0.2 });
    add(arms[0], new THREE.OctahedronGeometry(0.1), glowMat(glowC, 2), -0.16, -0.6, 0.25);
    add(head, new THREE.SphereGeometry(0.27, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x5a5a6a), 0, 0.02, 0);
  } else {
    add(chest, new THREE.ConeGeometry(0.45, 1.5, 12, 1, true), mat(0x3a2a4a, { side: THREE.DoubleSide }), 0, -0.55, 0);
    add(head, sph(0.3, 14, 10), mat(0x3a2a4a), 0, 0.06, -0.06, { s: [1.05, 1.1, 1.05] });
    add(head, sph(0.24, 12, 8), basic(0x0a0610), 0, 0.02, 0.08, { s: [0.9, 0.95, 0.6] });
    for (const s of [-1, 1]) add(head, sph(0.035, 6, 4), basic(glowC), s * 0.08, 0.03, 0.26, { shadow: false });
    const staff = group(arms[1], 0.08, -0.75, 0.2);
    add(staff, new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), bone, 0, 0.3, 0);
    add(staff, sph(0.14, 10, 8), bone, 0, 1.25, 0);
    add(staff, new THREE.OctahedronGeometry(0.1), glowMat(glowC, 2.4), 0, 1.25, 0.12);
  }
  g.userData.anim = (t, moving) => {
    const k = moving ? t * 7 : 0;
    legs.forEach((l, i) => { l.rotation.x = Math.sin(k + i * Math.PI) * 0.5; });
    arms.forEach((a, i) => { a.rotation.x = moving ? Math.sin(k + i * Math.PI + Math.PI) * 0.4 : Math.sin(t * 1.5 + i) * 0.05; });
    head.rotation.y = Math.sin(t * 0.9) * 0.25;
    head.rotation.z = Math.sin(t * 2.3) * 0.05;
    body.position.y = moving ? Math.abs(Math.sin(k)) * 0.05 : 0;
  };
  return finish(g, 0.025, 0.06);
}

// A soul anchor: a floating obelisk that chains the Magister's ward.
function soulAnchor() {
  const g = new THREE.Group();
  const stone = group(g, 0, 1.4, 0);
  dyn(stone);
  add(stone, new THREE.OctahedronGeometry(0.7), mat(0x2a2038), 0, 0, 0, { s: [0.6, 1.8, 0.6] });
  for (let k = 0; k < 3; k++) add(stone, new THREE.TorusGeometry(0.55, 0.05, 5, 16), glowMat(0xd06aff, 2.2), 0, -0.5 + k * 0.5, 0, { rx: Math.PI / 2 });
  add(stone, new THREE.OctahedronGeometry(0.22), basic(0xf0d8ff), 0, 1.4, 0);
  g.userData.anim = (t) => { stone.position.y = 1.4 + Math.sin(t * 2) * 0.15; stone.rotation.y = t; };
  return finish(g, 0.03, 0.08);
}

// A cave stalagmite cluster.
export function makeStalagmites(scale = 1, color = 0x3a3444) {
  const g = new THREE.Group();
  for (let k = 0; k < 4; k++) {
    const h = 2 + Math.random() * 4, r = 0.4 + Math.random() * 0.5;
    add(g, new THREE.ConeGeometry(r, h, 7), mat(k % 2 ? color : darker(color, 0.8)), (Math.random() - 0.5) * 2, h / 2, (Math.random() - 0.5) * 2);
  }
  if (Math.random() < 0.5) add(g, new THREE.OctahedronGeometry(0.3), glowMat(0xd06aff, 2), 0.3, 0.4, 0.5, { s: [0.6, 1.6, 0.6] });
  g.scale.setScalar(scale);
  return finish(g, 0.04, 0.2, true);
}

// The Pale Spire: Malvoren's tower of white stone, crowned with a violet flame.
export function makePaleSpire() {
  const g = new THREE.Group();
  const white = mat(0xe8e4f0), trim = mat(0x6a4a8a), dark = mat(0x2a2038);
  add(g, new THREE.CylinderGeometry(9, 11, 4, 12), dark, 0, 2, 0);
  add(g, new THREE.CylinderGeometry(6.5, 8, 30, 12), white, 0, 19, 0);
  for (const y of [10, 20, 30]) add(g, new THREE.CylinderGeometry(7.2, 7.2, 1, 12), trim, 0, y, 0);
  add(g, new THREE.CylinderGeometry(4.5, 6.5, 14, 12), white, 0, 41, 0);
  add(g, new THREE.ConeGeometry(5.2, 16, 12), trim, 0, 56, 0);
  add(g, new THREE.OctahedronGeometry(2.2), glowMat(0xd06aff, 2.6), 0, 66, 0, { s: [0.7, 1.4, 0.7] });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    for (const y of [14, 24]) {
      const wg = group(g, Math.sin(a) * 6.9, y, Math.cos(a) * 6.9);
      wg.rotation.y = a;
      add(wg, archGeo(1.2, 2.6, 0.3), glowMat(0xd06aff, 1.6), 0, -1.3, 0);
    }
  }
  add(g, archGeo(4.5, 7, 1), dark, 0, 0, 7.9);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    limb(g, V3(Math.sin(a) * 7, 34, Math.cos(a) * 7), V3(Math.sin(a) * 12, 44, Math.cos(a) * 12), 0.8, 0.3, dark, 6);
  }
  return finish(g, 0.08, 0.6, true);
}
