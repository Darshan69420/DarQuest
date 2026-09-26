// The 3D world: map, player movement, camera, NPCs, wandering enemies and spell effects.
import * as THREE from 'three';
import {
  makeWizard, makeEnemy, makeTree, makeRoundTree, makeDeadTree, makeLamp, makeHouse, makeTower,
  makeFountain, makeGate, makeCrypt, makeGrave, makeRock, makeStall, makeBookStand, glowMat,
  makePet, makePortal, mergeGeometries, makeNode, makeStation, makeMount, makeWaystone,
} from './models.js';
import { NODE_TYPES, STATION_TYPES } from './skills.js';
import { NPCS, SPAWNS, ENEMIES, SCHOOLS, ZONES, zoneAt, PORTALS, FOUNTAINS, GEAR, PETS, WAYSTONES } from './data.js';
import { buildEmberfall, buildMeadow, buildDragonspire, buildWordWalls, buildHomestead, buildGlacier, buildStormspire, buildThornwood, buildHollowDeep } from './maps.js';
import { settings, keyFor, QUALITY, onSettings, setSetting } from './settings.js';
import { EffectComposer } from '../lib/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/addons/postprocessing/OutputPass.js';
import { ShaderPass } from '../lib/addons/postprocessing/ShaderPass.js';

// The last step of the picture: a soft vignette, a touch of saturation and a per-land colour tint.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, vignette: { value: 0.32 }, saturation: { value: 1.08 }, tint: { value: new THREE.Color(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vignette; uniform float saturation; uniform vec3 tint; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, saturation) * tint;
      float v = smoothstep(0.95, 0.25, length(vUv - 0.5) * 1.15);
      c.rgb *= mix(1.0, v, vignette);
      gl_FragColor = c;
    }`,
};
// Per-land grading: [tint r, g, b, saturation]
const GRADES = {
  academy: [1.02, 1.0, 0.98, 1.1], emberfall: [1.06, 0.99, 0.92, 1.12], dragonspire: [0.98, 1.0, 1.03, 1.02],
  glacier: [0.95, 1.0, 1.06, 1.0], stormspire: [0.98, 0.98, 1.05, 1.06], thornwood: [0.99, 1.04, 0.96, 1.12],
  hollowdeep: [1.0, 0.95, 1.06, 1.04], undercroft: [0.97, 0.97, 1.03, 0.95], rift: [1.02, 0.96, 1.06, 1.1],
  homestead: [1.03, 1.01, 0.97, 1.1], arena: [1.05, 1.0, 0.95, 1.1],
};
import { Sky } from './sky.js';
import { buildArena } from './arena.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
// Scratch objects reused every frame so the hot loop doesn't allocate.
const _projV = new THREE.Vector3(), _floaterV = new THREE.Vector3(), _shakeV = new THREE.Vector3(), _zeroV = new THREE.Vector3();
const _labelOut = {}, _floaterOut = {};
const _occFrom = new THREE.Vector3(), _occDir = new THREE.Vector3(), _occBox = new THREE.Box3(), _occSph = new THREE.Sphere();
// Writes a label's style only when something changed: the DOM is the slow part of labels.
function setLabel(l, display, transform, opacity) {
  if (l._d !== display) { l.el.style.display = display; l._d = display; }
  if (transform !== undefined && l._t !== transform) { l.el.style.transform = transform; l._t = transform; }
  if (opacity !== undefined && l._o !== opacity) { l.el.style.opacity = opacity; l._o = opacity; }
}
// Shortest signed angle from b to a.
export const angDiff = (a, b) => ((a - b + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

// A flat pie slice (or full disc / ring) on the ground, pointing along +Z.
function sectorGeo(r, angle, inner = 0) {
  const n = Math.max(8, Math.round(48 * angle / (Math.PI * 2)));
  const pos = [];
  const pt = (a, rr) => [Math.sin(a) * rr, 0, Math.cos(a) * rr];
  for (let i = 0; i < n; i++) {
    const a0 = -angle / 2 + (angle * i) / n, a1 = -angle / 2 + (angle * (i + 1)) / n;
    if (inner > 0) pos.push(...pt(a0, inner), ...pt(a0, r), ...pt(a1, r), ...pt(a0, inner), ...pt(a1, r), ...pt(a1, inner));
    else pos.push(0, 0, 0, ...pt(a0, r), ...pt(a1, r));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const edge = [];
  const full = angle >= Math.PI * 2 - 0.01;
  if (!full) edge.push(V());
  for (let i = 0; i <= n; i++) edge.push(V(...pt(-angle / 2 + (angle * i) / n, r)));
  return { geo, edge: new THREE.BufferGeometry().setFromPoints(edge) };
}

// A flat strip from the origin forward along +Z.
function stripGeo(width, len) {
  const w = width / 2;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, w, 0, len, -w, 0, 0, w, 0, len, -w, 0, len], 3));
  return { geo, edge: new THREE.BufferGeometry().setFromPoints([V(-w, 0, 0), V(w, 0, 0), V(w, 0, len), V(-w, 0, len)]) };
}

// Is the point (x, z) inside a telegraphed attack shape? `pad` is roughly the player's radius.
export function insideShape(spec, x, z, pad = 0.35) {
  const dx = x - spec.x, dz = z - spec.z;
  const dir = spec.dir || 0;
  if (spec.shape === 'line') {
    const along = dx * Math.sin(dir) + dz * Math.cos(dir);
    const across = dx * Math.cos(dir) - dz * Math.sin(dir);
    return along >= -pad && along <= spec.len + pad && Math.abs(across) <= spec.width / 2 + pad;
  }
  const d = Math.hypot(dx, dz);
  if (d > spec.r + pad || d < (spec.inner || 0) - pad) return false;
  if (spec.shape === 'cone') return d < 1.2 || Math.abs(angDiff(Math.atan2(dx, dz), dir)) <= spec.angle / 2 + 0.06;
  return true;
}
const COURTYARD_R = 31;
const LANE = { halfWidth: 8.5, zMin: 24, zMax: 146 };
const PLAYER_SPEED = 6.5;

// Height of a model's bounding box, used to place labels and spell effects.
function measure(obj) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  return box.max.y - obj.position.y;
}

export class World {
  constructor(canvas, labelRoot) {
    this.canvas = canvas;
    this.labelRoot = labelRoot;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: (QUALITY[settings.quality] || QUALITY.high).antialias });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 440);
    this.clock = new THREE.Clock();
    this.time = 0;

    this.mode = 'title';      // title | explore | menu | locked
    this.keys = {};
    this.labels = [];
    this.effects = [];
    this.floaters = [];
    this.npcs = [];
    this.enemies = [];
    this.colliders = [];      // {x, z, r}
    this.staticObjs = [];     // scenery merged into batches after the map is built
    this.animated = [];       // objects with userData.anim
    this.nodes = [];          // resource nodes: trees, rocks, fishing spots, herbs
    this.stations = [];       // crafting stations
    this.player = null;
    this.heading = Math.PI;   // facing -Z (toward the academy)
    this.camYawOffset = 0;    // classic controls: camera swing away from the heading
    this.camYaw = Math.PI;    // modern controls: the camera's own direction
    this.camPitch = 0;
    this.joy = { x: 0, y: 0 };  // virtual joystick on touch screens
    this.moveDir = null;
    this.isMoving = false;
    this.hitStopT = 0;
    this.fx = 1;              // particle amount from the graphics setting
    this.lastDrag = -10;
    this.fps = 0;
    this.fpsFrames = 0;
    this.fpsT = 0;
    this.camDist = 10;
    this.camHeight = 5;
    this.moveTarget = null;
    this.pendingTalk = null;
    this.invulnUntil = 0;
    this.shakeAmt = 0;
    this.dashT = 0;
    this.dashDir = null;
    this.targetEntity = null;

    this.onTargetTap = null;  // (enemyEntity) => void
    this.onInteract = null;   // (npcId) => void
    this.onTick = null;       // (dt) => void
    this.pet = null;
    this.zone = 'academy';
    this.atmo = null;

    this.sphereGeo = new THREE.SphereGeometry(1, 10, 8);
    this.ringGeo = new THREE.RingGeometry(0.8, 1, 40);

    this.buildEnvironment();
    this.skyCycle = new Sky(this);
    this.applyQuality();
    onSettings((k) => {
      if (k === 'quality' || k === 'postfx' || k === '*') this.applyQuality();
      if (k === 'controls' || k === '*') this.camYaw = this.heading + this.camYawOffset;
    });
    this.buildMap();
    this.batchStatic();
    this.packMotes();
    this.spawnNPCs();
    this.spawnEnemies();
    this.bindInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ------------------------------------------------------------ setup

  get modern() { return settings.controls !== 'classic'; }
  get viewYaw() { return this.modern ? this.camYaw : this.heading + this.camYawOffset; }

  applyQuality() {
    const q = QUALITY[settings.quality] || QUALITY.high;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pixelRatio));
    this.setupPost(q);
    this.sun.castShadow = q.shadows > 0;
    if (q.shadows && this.sun.shadow.mapSize.x !== q.shadows) {
      this.sun.shadow.mapSize.set(q.shadows, q.shadows);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
    }
    this.fx = q.particles;
    this.resize();
  }

  // Bloom and grading on Medium and High quality (and when the setting is on).
  setupPost(q = QUALITY[settings.quality] || QUALITY.high) {
    if (this.composer) { this.composer.renderTarget1.dispose(); this.composer.renderTarget2.dispose(); this.bloom?.dispose(); }
    this.composer = null;
    this.bloom = null;
    if (!q.bloom || !settings.postfx) return;
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: q.antialias ? 4 : 0 });
    const c = new EffectComposer(this.renderer, rt);
    c.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), q.bloom, 0.5, 0.92);
    c.addPass(this.bloom);
    c.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    c.addPass(this.grade);
    this.composer = c;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    if (this.composer) { this.composer.setPixelRatio(this.renderer.getPixelRatio()); this.composer.setSize(w, h); }
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 70 : 55;
    this.camera.updateProjectionMatrix();
  }

  buildEnvironment() {
    const scene = this.scene;
    scene.fog = new THREE.Fog(0x4a3468, 50, 170);

    const sky = new THREE.Mesh(new THREE.SphereGeometry(320, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0x140f38) },
        mid: { value: new THREE.Color(0x5b3a8c) },
        bottom: { value: new THREE.Color(0xf29a6b) },
      },
      vertexShader: 'varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vPos;
        void main(){ float h = vPos.y;
          vec3 c = h > 0.08 ? mix(mid, top, smoothstep(0.08, 0.6, h)) : mix(bottom, mid, smoothstep(-0.05, 0.08, h));
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    }));
    sky.renderOrder = -1;
    scene.add(sky);
    this.sky = sky;

    const starPos = [];
    for (let i = 0; i < 900; i++) {
      const a = Math.random() * Math.PI * 2, e = 0.12 + Math.random() * 1.4;
      starPos.push(Math.cos(a) * Math.cos(e) * 300, Math.sin(e) * 300, Math.sin(a) * Math.cos(e) * 300);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false }));
    sky.add(stars);

    const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff1d6, fog: false }));
    moon.position.set(-150, 170, -260);
    sky.add(moon);

    this.hemi = new THREE.HemisphereLight(0xc4b5ff, 0x3a2f2a, 1.3);
    scene.add(this.hemi);
    const sun = new THREE.DirectionalLight(0xffd9b0, 2.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -35; sc.right = 35; sc.top = 35; sc.bottom = -35; sc.near = 1; sc.far = 150;
    sun.shadow.bias = -0.0005;
    scene.add(sun, sun.target);
    this.sun = sun;
  }

  add(obj, x, z, rotY = 0, collideR = 0) {
    obj.position.set(x, 0, z);
    obj.rotation.y = rotY;
    this.scene.add(obj);
    if (collideR) this.colliders.push({ x, z, r: collideR });
    if (obj.userData.anim) this.animated.push(obj);
    else if (obj.userData.static) this.staticObjs.push(obj);
    return obj;
  }

  // Merges all static scenery into one mesh per material per map area,
  // turning thousands of draw calls into a few dozen.
  batchStatic(cell = 56) {
    const buckets = new Map();
    for (const obj of this.staticObjs) {
      obj.updateMatrixWorld(true);
      const key0 = Math.floor(obj.position.x / cell) + ',' + Math.floor(obj.position.z / cell);
      obj.traverse((m) => {
        if (!m.isMesh) return;
        const key = key0 + '|' + m.material.uuid + '|' + m.castShadow + '|' + m.receiveShadow;
        if (!buckets.has(key)) buckets.set(key, { material: m.material, cast: m.castShadow, receive: m.receiveShadow, items: [] });
        buckets.get(key).items.push({ geo: m.geometry, matrix: m.matrixWorld.clone() });
      });
      this.scene.remove(obj);
    }
    this.batches = this.batches || [];
    for (const b of buckets.values()) {
      const mesh = new THREE.Mesh(mergeGeometries(b.items), b.material);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = b.receive;
      mesh.matrixAutoUpdate = false;
      this.scene.add(mesh);
      mesh.geometry.computeBoundingSphere();
      const bs = mesh.geometry.boundingSphere;
      this.batches.push({ mesh, x: bs.center.x, z: bs.center.z, r: bs.radius });
    }
    this.staticObjs = [];
  }

  // Every drifting mote (sparks, snow, fireflies, souls) becomes one instance of a single mesh:
  // one draw call instead of hundreds.
  packMotes() {
    const list = this.motes;
    const inst = new THREE.InstancedMesh(this.sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), list.length);
    inst.frustumCulled = false;
    const c = new THREE.Color();
    list.forEach((m, i) => { inst.setColorAt(i, c.copy(m.material.color)); this.scene.remove(m); m.material.dispose(); });
    this.scene.add(inst);
    this.moteMesh = inst;
    this.motes = list.map(m => ({ userData: m.userData, s: m.scale.x, visible: true, shown: true }));
  }

  // Skips drawing whatever is lost in the fog: far scenery batches, drifting motes, foes and
  // animated props. Foes and props are switched to a render layer the camera ignores (their
  // 'visible' flag means something to the game), and only when they cross the fog line.
  cullDistant() {
    const p = this.player?.position;
    if (!p) return;
    const far = (this.scene.fog?.far ?? 170) + 20, far2 = far * far;
    const d2 = (x, z) => (x - p.x) ** 2 + (z - p.z) ** 2;
    for (const b of this.batches || []) { const lim = far + b.r; b.mesh.visible = d2(b.x, b.z) < lim * lim; }
    for (const m of this.motes) m.visible = d2(m.userData.base.x, m.userData.base.z) < far2;
    const setCulled = (o, c) => {
      if (!!o.userData.culled === c) return;
      o.userData.culled = c;
      o.traverse(k => { if (k.isMesh || k.isPoints || k.isLine) k.layers.set(c ? 5 : 0); });
    };
    // foes and small props fade into the fog well before the scenery does
    const foeFar = Math.min(far, 105) ** 2, propFar = (Math.min(far, 120) + 40) ** 2;
    for (const e of this.enemies) setCulled(e.model, d2(e.model.position.x, e.model.position.z) > foeFar);
    for (const o of this.animated) setCulled(o, d2(o.position.x, o.position.z) > propFar);
    // level of detail: past a distance (set by graphics quality) characters and props drop their outline
    const od = (QUALITY[settings.quality] || QUALITY.high).outline ?? 60, od2 = od * od;
    const setDetail = (o, lo) => {
      if (o.userData.lod === lo) return;
      o.userData.lod = lo;
      if (!o.userData.hulls) { o.userData.hulls = []; o.traverse(k => { if (k.userData.isHull) o.userData.hulls.push(k); }); }
      for (const h of o.userData.hulls) h.visible = !lo;
    };
    for (const e of this.enemies) setDetail(e.model, d2(e.model.position.x, e.model.position.z) > od2);
    for (const o of this.animated) setDetail(o, d2(o.position.x, o.position.z) > od2);
  }

  buildMap() {
    const scene = this.scene;
    const flat = (geo, color, x, z, y = 0.02) => {
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1 }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y, z);
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };

    // ground layers
    flat(new THREE.PlaneGeometry(900, 900), 0x3e6b40, 0, 0, 0);
    flat(new THREE.PlaneGeometry(90, 150), 0x33402f, 0, 95, 0.01);
    flat(new THREE.CircleGeometry(COURTYARD_R + 1, 64), 0xa39a86, 0, 0);
    flat(new THREE.RingGeometry(9, 10, 64), 0x8b8272, 0, 0, 0.03);
    flat(new THREE.RingGeometry(20, 21, 64), 0x8b8272, 0, 0, 0.03);
    flat(new THREE.PlaneGeometry(LANE.halfWidth * 2 + 3, LANE.zMax - LANE.zMin + 6), 0x5c5664, 0, (LANE.zMin + LANE.zMax) / 2);
    flat(new THREE.PlaneGeometry(4, 40), 0x8b8272, 0, -30, 0.03);

    // academy
    this.add(makeTower({ r: 7, h: 22 }), 0, -50, 0, 8);
    this.add(makeTower({ r: 3.5, h: 14, roof: 0x2e7d6b }), -16, -44, 0, 4.5);
    this.add(makeTower({ r: 3.5, h: 14, roof: 0xa0346a }), 16, -44, 0, 4.5);
    this.add(makeHouse({ w: 26, d: 8, h: 7, wall: 0xcfc3e8, roof: 0x3b2d7a }), 0, -40, 0);
    const door = new THREE.Mesh(new THREE.BoxGeometry(3, 4.5, 0.3), glowMat(0xf2c14e, 0.6));
    door.position.set(0, 2.25, -35.9);
    scene.add(door);

    // courtyard
    this.fountain = this.add(makeFountain(), 0, 0, 0, 3.6);
    this.add(makeBookStand(), NPCS.mirabel.x - 1, NPCS.mirabel.z - 2.2, 0.4, 1.8);
    this.add(makeStall(), NPCS.fizz.x + 1, NPCS.fizz.z - 2, -0.4, 1.8);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.1;
      const x = Math.sin(a) * (COURTYARD_R - 2), z = Math.cos(a) * (COURTYARD_R - 2);
      if (z > 20 && Math.abs(x) < 12) continue;   // leave the south exit open
      if (x > 20 && Math.abs(z) < 11) continue;   // and the east gate to the meadow
      if (Math.hypot(x - 21, z - 17) < 7) continue; // and the Rift Gate
      if (PORTALS.some(pt => Math.hypot(x - pt.x, z - pt.z) < 5)) continue;
      if (Object.values(NPCS).some(n => Math.hypot(x - n.x, z - n.z) < 3.5)) continue;
      if (z < -24 && Math.abs(x) < 20) continue;  // academy front
      const tree = i % 2 ? makeTree(0.9 + Math.random() * 0.3) : makeRoundTree(0.9 + Math.random() * 0.3, [0xd36fae, 0xf29a6b, 0xb46bff][i % 3]);
      this.add(tree, x, z, Math.random() * 6, 1.2);
    }
    for (const [x, z] of [[-6, 18], [6, 18], [-6, -18], [6, -18], [-18, 6], [18, 6]]) this.add(makeLamp(), x, z, 0, 0.4);

    // forest ring around everything
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      const r = 48 + Math.random() * 20;
      const x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (z > 20 && Math.abs(x) < 30) continue;
      if (x > 24 && Math.abs(z) < 64) continue;  // Millbrook Meadow
      this.add(makeTree(1.4 + Math.random() * 1.2, 0x2f6b3c), x, z, Math.random() * 6);
    }
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const hill = new THREE.Mesh(new THREE.ConeGeometry(30 + Math.random() * 25, 25 + Math.random() * 30, 6),
        new THREE.MeshStandardMaterial({ color: 0x2b4a3a, flatShading: true }));
      hill.position.set(Math.sin(a) * 190, 5, 70 + Math.cos(a) * 200);
      scene.add(hill);
    }

    // Hollow Lane
    this.add(makeGate(), 0, 28, 0);
    const wallColors = [0x8f7fa0, 0x7a6f85, 0x9c8a7a, 0x6f6a80];
    const roofColors = [0x3b2340, 0x2a2f45, 0x4a2a2a, 0x33283f];
    let i = 0;
    for (let z = 40; z <= 135; z += 13) {
      for (const s of [-1, 1]) {
        const house = makeHouse({ w: 7, d: 6, h: 4.5 + Math.random() * 2, wall: wallColors[i % 4], roof: roofColors[(i + 1) % 4], lit: Math.random() > 0.4, tilt: (Math.random() - 0.5) * 0.15 });
        this.add(house, s * 15.5, z + Math.random() * 3, s > 0 ? -Math.PI / 2 : Math.PI / 2);
        i++;
      }
      this.add(makeDeadTree(0.9 + Math.random() * 0.4), -11, z + 6, Math.random() * 6);
      this.add(makeDeadTree(0.9 + Math.random() * 0.4), 11, z + 6, Math.random() * 6);
    }
    for (let z = 34; z <= 140; z += 12) {
      this.add(makeLamp(0xc59bff), -LANE.halfWidth - 0.4, z, 0);
      this.add(makeLamp(0xc59bff), LANE.halfWidth + 0.4, z + 6, 0);
    }
    this.add(makeCrypt(), 0, 156, 0);
    for (let k = 0; k < 14; k++) this.add(makeGrave(), (k % 2 ? -1 : 1) * (5 + Math.random() * 3), 128 + Math.random() * 20, Math.random() - 0.5);
    for (let k = 0; k < 14; k++) this.add(makeRock(0.5 + Math.random() * 0.8), (Math.random() > 0.5 ? 1 : -1) * (9.5 + Math.random() * 3), 36 + Math.random() * 110);

    // floating magic motes over the courtyard
    const motes = [];
    for (let k = 0; k < 40; k++) {
      const m = new THREE.Mesh(this.sphereGeo, new THREE.MeshBasicMaterial({ color: [0xf2c14e, 0x9fe6ff, 0xd36fae][k % 3] }));
      m.scale.setScalar(0.06);
      m.userData.base = V((Math.random() - 0.5) * 50, 1 + Math.random() * 4, (Math.random() - 0.5) * 50);
      m.userData.phase = Math.random() * 10;
      scene.add(m);
      motes.push(m);
    }
    this.motes = motes;

    // the Rift Gate, a crack into the Endless Rift
    const rg = this.add(makePortal(0x7a3aff), 21, 17, -2.3);
    this.riftGate = rg;
    for (const s of [-1, 1]) this.colliders.push({ x: 21 + Math.cos(-2.3) * s * 2.4, z: 17 - Math.sin(-2.3) * s * 2.4, r: 0.7 });
    this.addLabel(rg, '<div class="name">🌀 Rift Gate</div><div class="sub">The Endless Rift</div>', 'npc portal', 6.4);

    // Millbrook Meadow (skilling), Chapter 2 zone, and the portals that connect the zones
    buildMeadow(this);
    const ember = buildEmberfall(this);
    const dragon = buildDragonspire(this);
    buildWordWalls(this);
    const glacier = buildGlacier(this);
    const storm = buildStormspire(this);
    const thorn = buildThornwood(this);
    const deep = buildHollowDeep(this);
    buildHomestead(this);
    buildArena(this);
    this.fountainModels = { fountain: this.fountain, spring_ember: ember.spring, spring_dragon: dragon.spring, hearth_glacier: glacier.hearth, fountain_storm: storm.fountain, well_thorn: thorn.spring, font_deep: deep.spring };
    this.portalModels = {};
    for (const pt of PORTALS) {
      const rot = pt.rot || 0;
      this.portalModels[pt.id] = this.add(makePortal(pt.color ?? 0xb46bff), pt.x, pt.z, rot);
      for (const s of [-1, 1]) this.colliders.push({ x: pt.x + Math.cos(rot) * s * 2.4, z: pt.z - Math.sin(rot) * s * 2.4, r: 0.7 });
    }
    // waystones for fast travel
    this.waystoneModels = {};
    for (const ws of WAYSTONES) {
      const m = this.add(makeWaystone(), ws.x, ws.z, Math.random() * 0.6 - 0.3, 0.8);
      this.waystoneModels[ws.id] = m;
      this.addLabel(m, `<div class="name">🗿 Waystone</div><div class="sub">${ws.name}</div>`, 'npc waystone', 4.3);
    }
  }

  spawnNPCs() {
    for (const [id, def] of Object.entries(NPCS)) {
      const model = makeWizard(def);
      model.userData.height = measure(model);
      // face the middle of their town
      const home = ZONES[zoneAt(def.x)].regions?.[0] || { x: 0, z: 0 };
      const hx = home.x ?? (home.x0 + home.x1) / 2, hz = home.z ?? (home.z0 + home.z1) / 2;
      this.add(model, def.x, def.z, Math.atan2(hx - def.x, hz - def.z), 0.8);
      const label = this.addLabel(model, `<div class="marker"></div><div class="name">${def.name}</div><div class="sub">${def.title}</div>`, 'npc', model.userData.height + 0.2);
      this.npcs.push({ id, def, model, label });
    }
    for (const f of FOUNTAINS) {
      this.addLabel(this.fountainModels[f.id], `<div class="name">${f.name}</div><div class="sub">Restores health</div>`, 'npc', 4.5);
    }
    for (const pt of PORTALS) {
      const l = this.addLabel(this.portalModels[pt.id], `<div class="name">🌀 Spiral Door</div><div class="sub">to ${pt.dest}</div>`, 'npc portal', 6.4);
      pt.label = l;
    }
  }

  setPortalLocked(id, locked) {
    const pt = PORTALS.find(p => p.id === id);
    if (pt?.label) pt.label.el.classList.toggle('locked', locked);
  }

  spawnEnemies() {
    for (const sp of SPAWNS) this.addEnemy(ENEMIES[sp.enemy], sp.x, sp.z, sp.r, false);
  }

  // Puts an enemy in the world. Enemies added later (dungeons, events) never respawn.
  addEnemy(def, x, z, wanderR = 3, temporary = true) {
    const model = def.buildModel ? def.buildModel() : makeEnemy(def.model);
    if (def.scale) model.scale.multiplyScalar(def.scale);
    model.userData.height = measure(model);
    const box = new THREE.Box3().setFromObject(model);
    // wide wings or roots shouldn't widen the hitbox: a model can give its body's width
    model.userData.width = model.userData.bodyWidth ? model.userData.bodyWidth * (def.scale || 1) : box.max.x - box.min.x;
    model.position.set(x, 0, z);
    model.rotation.y = Math.PI;
    this.scene.add(model);
    const color = def.elite ? '#ffd23d' : SCHOOLS[def.school].css;
    const label = this.addLabel(model,
      `<div class="name" style="color:${color}">${SCHOOLS[def.school].icon} ${def.name}</div><div class="sub">Level ${def.level}${def.boss ? ' · Boss' : def.elite ? ' · Elite' : ''}</div><div class="ehp"><div class="fill"></div></div><div class="ecast"><div class="fill"></div></div>`,
      'enemy' + (def.elite ? ' elite' : ''), model.userData.height + 0.5);
    this.enemyUid = (this.enemyUid || 0) + 1;
    const e = {
      uid: this.enemyUid, def, model, label, home: V(x, 0, z), wanderR, baseScale: model.scale.x,
      state: 'idle', target: null, wait: Math.random() * 3, respawnAt: 0, noRespawn: temporary,
    };
    label.enemy = e;
    this.enemies.push(e);
    return e;
  }

  removeEnemy(e) {
    this.scene.remove(e.model);
    e.model.traverse(c => { if (c.isMesh) c.geometry.dispose(); });
    e.label.el.remove();
    this.labels = this.labels.filter(l => l !== e.label);
    this.enemies = this.enemies.filter(x => x !== e);
    if (this.targetEntity === e) this.setTargetRing(null);
  }

  // Rebuilds the player model (e.g. after changing gear) and keeps its place.
  spawnPlayer(p, pos) {
    const old = this.player;
    const keep = old ? old.position.clone() : null;
    if (old) this.scene.remove(old);
    if (!old) this.dismount?.(true);
    const c = SCHOOLS[p.school].color;
    const worn = (slot) => GEAR[p.equipped?.[slot]?.b];
    const hat = worn('hat')?.color ?? new THREE.Color(c).multiplyScalar(0.55).getHex();
    const robe = worn('robe')?.color ?? c;
    // a cosmetic outfit (the Sol Mage holder perks) replaces the gear's colours
    const o = this.cosmetic;
    this.player = o
      ? makeWizard({ robe: o.robe, hat: o.hat, trim: o.trim, gem: o.gem, cape: o.cape ?? worn('cloak')?.color, orb: o.orb ?? worn('offhand')?.color })
      : makeWizard({ robe, hat, trim: 0xf2e6c9, gem: c, cape: worn('cloak')?.color, orb: worn('offhand')?.color });
    this.player.userData.height = measure(this.player);
    this.scene.add(this.player);
    this.setPet(p.activePet);
    if (keep) {
      this.player.position.copy(keep);
      this.player.rotation.y = this.heading;
      return;
    }
    const zone = ZONES[zoneAt(pos?.x ?? 0)];
    const at = pos && this.walkable(pos.x, pos.z) ? pos : zone.spawn;
    this.player.position.set(at.x, 0, at.z);
    this.heading = at.heading ?? Math.PI;
    this.camYaw = this.heading;
    if (this.pet) this.pet.position.set(at.x + 1, 0, at.z - 1);
    this.snapCamera();
  }

  // ------------------------------------------------------------ input

  bindInput() {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      this.keys[e.code] = true;
      if (this.mode === 'explore' && (e.code === keyFor('interact') || e.code === 'Enter')) {
        const near = this.nearestInteractable();
        if (near) { e.preventDefault(); this.onInteract?.(near.id); }
      }
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });

    let down = null;
    this.canvas.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now(), lastX: e.clientX, lastY: e.clientY, moved: 0, button: e.button };
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.canvas.addEventListener('pointermove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (!down) return;
      const dx = e.clientX - down.lastX, dy = e.clientY - down.lastY;
      down.lastX = e.clientX;
      down.lastY = e.clientY;
      down.moved += Math.abs(dx) + Math.abs(dy);
      if (this.mode === 'explore' && down.moved > 6) {
        const sens = 0.008 * settings.camSens;
        if (this.modern) this.camYaw -= dx * sens;
        else this.camYawOffset -= dx * sens;
        this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.025 * settings.camSens, -3.5, 7);
        this.lastDrag = this.time;
      }
    });
    this.canvas.addEventListener('pointerup', (e) => {
      if (down && down.moved < 8 && performance.now() - down.t < 400 && this.mode === 'explore') {
        if (down.button === 2) this.onRightClick?.(e.clientX, e.clientY);
        else this.onClickWorld?.(e.clientX, e.clientY) || this.tapMove(e.clientX, e.clientY);
      }
      down = null;
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('wheel', (e) => {
      this.camDist = THREE.MathUtils.clamp(this.camDist + Math.sign(e.deltaY) * 0.8, 4, 16);
    }, { passive: true });
  }

  tapMove(cx, cy) {
    const ndc = new THREE.Vector2((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(V(0, 1, 0), 0), hit)) return;
    // tapping an enemy targets it instead of walking there
    let foe = null, best = 2.8;
    for (const e of this.enemies) {
      if (e.state === 'dead' || !e.model.visible) continue;
      const d = Math.hypot(e.model.position.x - hit.x, e.model.position.z - hit.z) - (e.model.userData.width || 1.6) * 0.3;
      if (d < best) { best = d; foe = e; }
    }
    if (foe) { this.onTargetTap?.(foe); return; }
    const npc = this.interactables().find(n => Math.hypot(n.x - hit.x, n.z - hit.z) < 2.2);
    this.pendingTalk = npc ? npc.id : null;
    this.moveTarget = hit;
    this.spawnTapMarker(hit);
  }

  spawnTapMarker(p) {
    const ring = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.x, 0.08, p.z);
    this.scene.add(ring);
    let t = 0;
    this.effects.push((dt) => {
      t += dt;
      ring.scale.setScalar(0.3 + t * 1.5);
      ring.material.opacity = 1 - t / 0.6;
      if (t > 0.6) { this.scene.remove(ring); ring.material.dispose(); return false; }
    });
  }

  interactables() {
    const list = this.npcs.map(n => ({ id: n.id, x: n.model.position.x, z: n.model.position.z, r: 3.2 }));
    for (const f of FOUNTAINS) list.push({ id: f.id, x: f.x, z: f.z, r: f.r });
    for (const pt of PORTALS) list.push({ id: pt.id, x: pt.x, z: pt.z, r: 4 });
    const pp = this.player?.position;
    for (const n of this.nodes) if (!n.depleted && (!pp || Math.abs(n.x - pp.x) + Math.abs(n.z - pp.z) < 12)) list.push({ id: n.id, x: n.x, z: n.z, r: n.r });
    for (const st of this.stations) list.push({ id: st.id, x: st.x, z: st.z, r: st.r });
    for (const extra of this.extraInteractables || []) list.push(...extra());
    return list;
  }

  // ------------------------------------------------------------ skilling

  // A tree, rock, fishing spot or herb you can gather from.
  addNode(type, x, z) {
    const def = NODE_TYPES[type];
    const kind = def.model.kind;
    const rot = Math.random() * Math.PI * 2;
    const place = (m) => { m.position.set(x, 0, z); m.rotation.y = rot; this.scene.add(m); return m; };
    const full = place(makeNode(def.model, false));
    const empty = def.deplete > 0 ? place(makeNode(def.model, true)) : null;
    if (empty) empty.visible = false;
    if (full.userData.anim) this.animated.push(full);
    const col = { rock: 1.1, pine: 0.7, oak: 0.9, willow: 0.8, moonwood: 0.7, emberwood: 0.7, elder: 1.2, dragonwood: 1.0, skyoak: 0.8, heartwood: 1.0 }[kind] || 0;
    if (col) this.colliders.push({ x, z, r: col });
    const reach = kind === 'fish' ? 3.6 : col ? col + 1.9 : 1.9;
    const node = { id: 'node:' + this.nodes.length, def, x, z, full, empty, depleted: false, respawnAt: 0, r: reach };
    this.nodes.push(node);
    return node;
  }

  depleteNode(node) {
    node.depleted = true;
    node.full.visible = false;
    if (node.empty) node.empty.visible = true;
    node.respawnAt = this.time + node.def.respawn;
  }

  updateNodes() {
    for (const n of this.nodes) {
      if (!n.depleted || this.time < n.respawnAt) continue;
      n.depleted = false;
      n.full.visible = true;
      if (n.empty) n.empty.visible = false;
      const base = n.full.scale.x;
      let t = 0;
      this.effects.push((dt) => {
        t += dt;
        n.full.scale.setScalar(base * Math.min(1, 0.2 + t * 2));
        if (t >= 0.4) { n.full.scale.setScalar(base); return false; }
      });
    }
  }

  // A crafting station. With `model: false` an existing prop (like a campfire) becomes one.
  addStation(type, x, z, rotY = 0, model = true) {
    if (model) {
      const m = makeStation(type);
      this.add(m, x, z, rotY, type === 'range' ? 1.1 : 1.3);
      const def = STATION_TYPES[type];
      this.addLabel(m, `<div class="name">${def.icon} ${def.name}</div>`, 'station', type === 'furnace' ? 3 : 2.3);
    }
    const st = { id: 'station:' + this.stations.length, type, x, z, r: 3 };
    this.stations.push(st);
    return st;
  }

  // Instantly moves the player (used by portals), with a flash of light.
  teleport(to) {
    this.player.position.set(to.x, 0, to.z);
    this.heading = to.heading ?? this.heading;
    this.camYawOffset = 0;
    this.camYaw = this.heading;
    this.moveTarget = null;
    if (this.pet) this.pet.position.set(to.x + 1, 0, to.z - 1);
    this.snapCamera();
    this.aura(this.player, 0xb46bff);
    this.invulnUntil = this.time + 3;
  }

  // ------------------------------------------------------------ pets

  setPet(petId) {
    if (this.pet) this.scene.remove(this.pet);
    this.pet = null;
    const def = PETS[petId];
    if (!def || !this.player) return;
    this.pet = makePet(def.kind, def.color);
    // pets grow a little with every level
    this.pet.scale.multiplyScalar(1 + ((this.petLevel?.(petId) || 1) - 1) * 0.05);
    this.pet.userData.anim(0, false);
    this.pet.userData.height = measure(this.pet);
    this.pet.position.copy(this.player.position).add(V(1, 0, -1));
    this.scene.add(this.pet);
  }

  updatePet(dt) {
    const pet = this.pet;
    if (!pet) return;
    let moving = false;
    {
      // trot along just behind and to the side of the player
      const h = this.heading;
      const want = this.player.position.clone().add(V(-Math.sin(h) * 1.4 + Math.cos(h) * 1.1, 0, -Math.cos(h) * 1.4 - Math.sin(h) * 1.1));
      const d = want.distanceTo(pet.position);
      if (d > 12) pet.position.copy(want);
      else if (d > 0.3) {
        pet.position.lerp(want, Math.min(1, dt * 4));
        pet.rotation.y = Math.atan2(want.x - pet.position.x, want.z - pet.position.z);
        moving = true;
      }
    }
    pet.userData.anim(this.time, moving);
  }

  nearestInteractable() {
    if (!this.player) return null;
    const p = this.player.position;
    let best = null, bestD = Infinity;
    for (const it of this.interactables()) {
      const d = Math.hypot(it.x - p.x, it.z - p.z);
      if (d < it.r && d < bestD) { best = it; bestD = d; }
    }
    return best;
  }

  // ------------------------------------------------------------ movement

  walkable(x, z) {
    const zone = ZONES[zoneAt(x)];
    if (zone.walk) {
      if (!this[zone.walk]?.(x, z)) return false;
      for (const c of this.colliders) if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return false;
      return true;
    }
    const regions = zone.regions;
    const inside = regions.some(r => r.type === 'circle'
      ? (x - r.x) ** 2 + (z - r.z) ** 2 < r.r * r.r
      : x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
    if (!inside) return false;
    for (const c of this.colliders) if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return false;
    return true;
  }

  // Movement keys: modern controls move relative to the camera (the wizard turns to face where
  // they walk); classic controls walk along the heading and turn with A / D.
  movePlayer(dt) {
    const k = this.keys;
    const on = (action, alt) => !!(k[keyFor(action)] || k[alt]);
    const fwd = (on('forward', 'ArrowUp') ? 1 : 0) - (on('back', 'ArrowDown') ? 1 : 0);
    const side = (on('right', 'ArrowRight') ? 1 : 0) - (on('left', 'ArrowLeft') ? 1 : 0);
    const joy = Math.hypot(this.joy.x, this.joy.y) > 0.12;
    let speed = 0;
    let dir = null;

    if ((this.modern && (fwd || side)) || joy) {
      const f = fwd + (joy ? this.joy.y : 0), s = side + (joy ? this.joy.x : 0);
      const mag = Math.min(1, Math.hypot(f, s));
      this.moveTarget = null;
      this.pendingTalk = null;
      const yaw = this.viewYaw;
      const Fx = Math.sin(yaw), Fz = Math.cos(yaw);
      const dx = Fx * f - Fz * s, dz = Fz * f + Fx * s;
      const len = Math.hypot(dx, dz) || 1;
      dir = { x: dx / len, z: dz / len };
      this.heading += angDiff(Math.atan2(dir.x, dir.z), this.heading) * Math.min(1, dt * 14);
      speed = PLAYER_SPEED * mag * (this.speedMult || 1);
    } else if (fwd || side) {
      this.moveTarget = null;
      this.pendingTalk = null;
      this.heading -= side * 2.8 * dt;
      speed = (fwd > 0 ? PLAYER_SPEED : fwd < 0 ? -PLAYER_SPEED * 0.55 : 0) * (this.speedMult || 1);
      if (fwd) this.camYawOffset *= Math.exp(-3 * dt);
    } else if (this.moveTarget) {
      const p = this.player.position;
      const dx = this.moveTarget.x - p.x, dz = this.moveTarget.z - p.z;
      const dist = Math.hypot(dx, dz);
      const talk = this.pendingTalk && this.interactables().find(i => i.id === this.pendingTalk);
      if (dist < 0.3 || (talk && Math.hypot(talk.x - p.x, talk.z - p.z) < talk.r - 0.6)) {
        this.moveTarget = null;
        if (talk) { this.pendingTalk = null; this.onInteract?.(talk.id); }
      } else {
        this.heading += angDiff(Math.atan2(dx, dz), this.heading) * Math.min(1, dt * 10);
        speed = PLAYER_SPEED * (this.speedMult || 1);
        // the camera slowly swings round behind you on tap-to-walk
        if (this.modern && settings.autoCam && this.time - this.lastDrag > 1.2) this.camYaw += angDiff(this.heading, this.camYaw) * Math.min(1, dt * 1.2);
      }
    }

    if (this.dashT > 0) {
      this.dashT -= dt;
      const p = this.player.position;
      const nx = p.x + this.dashDir.x * 22 * dt, nz = p.z + this.dashDir.z * 22 * dt;
      if (this.walkable(nx, nz)) { p.x = nx; p.z = nz; }
    }
    const moving = speed !== 0;
    this.isMoving = moving;
    if (moving) {
      const p = this.player.position;
      const sgn = Math.sign(speed);
      const mx = dir ? dir.x : Math.sin(this.heading) * sgn, mz = dir ? dir.z : Math.cos(this.heading) * sgn;
      this.moveDir = { x: mx, z: mz };
      const step = Math.abs(speed) * dt;
      const nx = p.x + mx * step, nz = p.z + mz * step;
      if (this.walkable(nx, nz)) { p.x = nx; p.z = nz; }
      else if (this.walkable(nx, p.z)) p.x = nx;
      else if (this.walkable(p.x, nz)) p.z = nz;
      else this.moveTarget = null;
    }
    this.player.rotation.y = this.heading;
    this.animPlayer(moving);
  }

  // The wizard walks, or sits still in the saddle while the mount does the walking.
  animPlayer(moving) {
    this.player.userData.anim(this.time, moving && !this.mountModel);
    const m = this.mountModel;
    if (!m) return;
    m.position.copy(this.player.position);
    m.rotation.y = this.heading;
    m.userData.anim(this.time, moving);
    this.player.userData.body.position.y += m.userData.saddle;
  }

  mountUp(kind) {
    this.dismount(true);
    this.mountModel = makeMount(kind);
    this.mountModel.position.copy(this.player.position);
    this.scene.add(this.mountModel);
    this.puff(this.player.position.x, 1, this.player.position.z, 0xe8e4ff, 16, 3);
  }

  dismount(quiet = false) {
    if (!this.mountModel) return false;
    this.scene.remove(this.mountModel);
    this.mountModel = null;
    if (!quiet) this.puff(this.player.position.x, 1, this.player.position.z, 0xe8e4ff, 12, 3);
    return true;
  }

  get mounted() { return !!this.mountModel; }

  // Open ground as far as the camera is concerned: walls, cliffs and buildings stop it, but
  // people, lamp posts, trees and furniture (small colliders) never push it in.
  camClear(x, z) {
    const zone = ZONES[zoneAt(x)];
    if (zone.walk) { if (!this[zone.walk]?.(x, z)) return false; }
    else if (!zone.regions.some(r => r.type === 'circle'
      ? (x - r.x) ** 2 + (z - r.z) ** 2 < r.r * r.r
      : x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1)) return false;
    for (const c of this.colliders) if (c.r >= 2 && (x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return false;
    return true;
  }

  // How much of its full distance (0.3 to 1) the camera can back away from the wizard
  // before something big is in the way.
  camReach(to) {
    const p = this.player.position;
    for (let i = 1; i <= 16; i++) {
      const k = i / 16;
      if (!this.camClear(p.x + (to.x - p.x) * k, p.z + (to.z - p.z) * k)) return Math.max(0.3, (i - 1) / 16);
    }
    return 1;
  }

  // Solid scenery between the wizard's head and the camera: rocks, walls, buildings, Rift
  // corridors, homestead blocks. Characters (anything with a measured height), effects and
  // see-through things never count. Returns how much of the distance is clear (0.25 to 1).
  camOcclusion(pos) {
    const p = this.player.position;
    const from = _occFrom.set(p.x, p.y + 1.6, p.z);
    const dir = _occDir.copy(pos).sub(from);
    const len = dir.length();
    if (len < 0.5) return 1;
    dir.divideScalar(len);
    const kids = this.scene.children;
    if (this._cbN !== kids.length) {
      this._cbN = kids.length;
      this._cb = kids.filter(o => !o.isLight && !o.isPoints && !o.isLine && !o.isSprite && o.userData.height === undefined && o !== this.sky && o !== this.player);
    }
    const cands = this._cbOut || (this._cbOut = []);
    cands.length = 0;
    for (const o of this._cb) {
      if (!o.visible || o.userData.culled) continue;
      let sp = o.userData.camSph;
      if (!sp) {
        const b = _occBox.setFromObject(o);
        if (b.isEmpty()) sp = { r: 0 };
        else { const s = b.getBoundingSphere(_occSph); sp = { x: s.center.x, y: s.center.y, z: s.center.z, r: s.radius }; }
        o.userData.camSph = sp;
      }
      if (sp.r < 0.9) continue;
      // distance from the sphere's centre to the head-camera segment
      const t = Math.max(0, Math.min(len, (sp.x - from.x) * dir.x + (sp.y - from.y) * dir.y + (sp.z - from.z) * dir.z));
      const dx = from.x + dir.x * t - sp.x, dy = from.y + dir.y * t - sp.y, dz = from.z + dir.z * t - sp.z;
      if (dx * dx + dy * dy + dz * dz < (sp.r + 0.6) ** 2) cands.push(o);
    }
    if (!cands.length) return 1;
    const rc = this.camRay || (this.camRay = new THREE.Raycaster());
    rc.set(from, dir);
    rc.far = len + 0.4;
    for (const h of rc.intersectObjects(cands, true)) {
      const m = h.object, mt = Array.isArray(m.material) ? m.material[0] : m.material;
      if (m.userData.isHull || !mt || mt.transparent || mt.depthWrite === false) continue;
      let o = m, person = false;
      while (o && !person) { person = o.userData.height !== undefined; o = o.parent; }
      if (person) continue;
      return Math.max(0.25, (h.distance - 0.5) / len);
    }
    return 1;
  }

  // The follow position pulled in toward the wizard by `fit`, keeping the same angle down
  // (the height shrinks with the distance), so a wall behind you never flips to a top-down view.
  fitCam(pos, fit) {
    const p = this.player.position, head = p.y + 1.4;
    return V(p.x + (pos.x - p.x) * fit, head + (pos.y - head) * fit, p.z + (pos.z - p.z) * fit);
  }

  snapCamera() {
    if (!this.player) return;
    const { pos, look } = this.followCam();
    this.camFit = ZONES[zoneAt(this.player.position.x)].freeCam ? 1 : this.camReach(pos);
    this.camera.position.copy(this.fitCam(pos, this.camFit));
    this.camera.lookAt(look);
  }

  followCam() {
    const yaw = this.viewYaw;
    const p = this.player.position;
    const dist = this.camDist + (this.camExtra || 0);
    return {
      pos: V(p.x - Math.sin(yaw) * dist, p.y + Math.max(1.2, this.camHeight + 1.2 + dist * 0.15 + this.camPitch), p.z - Math.cos(yaw) * dist),
      // look a little ahead so enemies in front are not hidden behind the hat
      look: V(p.x + Math.sin(yaw) * 3.5, p.y + 1.4, p.z + Math.cos(yaw) * 3.5),
    };
  }

  // ------------------------------------------------------------ enemies

  // Enemy behaviour lives in combat.js; the world only animates and moves them.
  updateEnemies() {
    const pp = this.player?.position;
    for (const e of this.enemies) {
      if (e.state === 'dead') continue;
      // only animate foes near the player: the rest of the world sleeps
      if (pp && Math.abs(e.model.position.x - pp.x) + Math.abs(e.model.position.z - pp.z) > 110) continue;
      e.model.userData.anim?.(this.time, !!e.moving);
    }
  }

  // Steps an enemy toward a point; returns false if the way is blocked.
  moveEnemy(e, target, speed, dt, stopAt = 0.2) {
    const m = e.model.position;
    const dx = target.x - m.x, dz = target.z - m.z;
    const d = Math.hypot(dx, dz);
    e.model.rotation.y = Math.atan2(dx, dz);
    if (d <= stopAt || speed <= 0) { e.moving = false; return true; }
    const step = Math.min(d - stopAt, speed * dt);
    const nx = m.x + (dx / d) * step, nz = m.z + (dz / d) * step;
    e.moving = true;
    if (this.walkable(nx, nz)) { m.set(nx, 0, nz); return true; }
    if (this.walkable(nx, m.z)) { m.x = nx; return true; }
    if (this.walkable(m.x, nz)) { m.z = nz; return true; }
    e.moving = false;
    return false;
  }

  faceEnemy(e, target) {
    const m = e.model.position;
    e.model.rotation.y = Math.atan2(target.x - m.x, target.z - m.z);
  }

  respawnEnemy(e) {
    e.state = 'idle';
    e.model.position.copy(e.home);
    e.model.visible = true;
    e.model.scale.setScalar(e.baseScale);
    e.model.rotation.set(0, Math.PI, 0);
    e.target = null;
  }

  // Sends the player back to the zone's safe spot (after being defeated).
  respawnPlayer() {
    const sp = ZONES[zoneAt(this.player.position.x)].spawn;
    this.player.position.set(sp.x, 0, sp.z);
    if (this.pet) this.pet.position.set(sp.x + 1, 0, sp.z);
    this.heading = sp.heading;
    this.camYawOffset = 0;
    this.camYaw = this.heading;
    this.moveTarget = null;
    this.snapCamera();
    this.invulnUntil = this.time + 4;
  }

  // A quick dash in the direction the player is moving (or facing).
  dash() {
    if (!this.player || this.dashT > 0) return false;
    const d = this.isMoving && this.moveDir ? this.moveDir : { x: Math.sin(this.heading), z: Math.cos(this.heading) };
    this.dashDir = V(d.x, 0, d.z);
    this.dashT = 0.22;
    this.invulnUntil = Math.max(this.invulnUntil, this.time + 0.4);
    for (let i = 0; i < 10; i++) this.particle(this.player.position.clone().add(V(0, 0.6, 0)), 0xe8e4ff, { vel: V((Math.random() - 0.5) * 2, Math.random(), (Math.random() - 0.5) * 2), life: 0.5, size: 0.12 });
    return true;
  }

  setTargetRing(entity) {
    if (!this.targetRing) {
      this.targetRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 40), new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
      this.targetRing.rotation.x = -Math.PI / 2;
      this.scene.add(this.targetRing);
    }
    this.targetEntity = entity;
    this.targetRing.visible = !!entity;
  }

  updateTargetRing() {
    const e = this.targetEntity;
    if (!this.targetRing || !e) return;
    const w = Math.max(1.2, (e.model.userData.width || 1.6) * 0.55);
    this.targetRing.position.set(e.model.position.x, 0.07, e.model.position.z);
    this.targetRing.scale.setScalar(w * (1 + Math.sin(this.time * 6) * 0.05));
    this.targetRing.rotation.z = this.time;
    this.targetRing.visible = e.model.visible && e.state !== 'dead';
  }

  // ------------------------------------------------------------ labels & floaters

  addLabel(obj, html, cls, y) {
    const el = document.createElement('div');
    el.className = 'label ' + cls;
    el.innerHTML = html;
    this.labelRoot.appendChild(el);
    const l = { obj, el, y };
    this.labels.push(l);
    return l;
  }

  setNpcMarker(id, marker, side = false) {
    const npc = this.npcs.find(n => n.id === id);
    if (!npc) return;
    npc.marker = marker;
    const m = npc.label.el.querySelector('.marker');
    m.textContent = marker;
    m.className = 'marker' + (marker ? ' on' : '') + (side ? ' side' : '');
  }

  projectToScreen(v, out = {}) {
    const p = _projV.copy(v).project(this.camera);
    out.x = (p.x * 0.5 + 0.5) * window.innerWidth;
    out.y = (-p.y * 0.5 + 0.5) * window.innerHeight;
    out.visible = p.z < 1;
    return out;
  }

  updateLabels() {
    const tmp = V(), s = _labelOut;
    const showWorld = this.mode === 'explore';
    const shown = this._shown || (this._shown = []);
    shown.length = 0;
    for (const l of this.labels) {
      if (!showWorld || !l.obj.visible || l.obj.userData.culled) { setLabel(l, 'none'); continue; }
      l.obj.getWorldPosition(tmp);
      const dist = tmp.distanceTo(this.camera.position);
      if (dist > 45) { setLabel(l, 'none'); continue; }
      tmp.y += l.y;
      this.projectToScreen(tmp, s);
      if (!s.visible) { setLabel(l, 'none'); continue; }
      const e = l.enemy;
      // who matters most: your target, then whoever is fighting you, then the rest by distance
      const pri = e ? (e === this.targetEntity ? 0 : e.state === 'aggro' ? 1 : 2) : 1;
      shown.push({ l, x: s.x, y: s.y, dist, pri });
    }
    shown.sort((a, b) => a.pri - b.pri || a.dist - b.dist);
    // your own wizard: labels drawn over the hat fade away
    let me = null;
    if (this.player) {
      tmp.copy(this.player.position); tmp.y += (this.player.userData.height || 2.4) * 0.7;
      this.projectToScreen(tmp, s);
      if (s.visible) me = { x0: s.x - 38, x1: s.x + 38, y0: s.y - 50, y1: s.y + 40 };
    }
    const placed = this._placed || (this._placed = []);
    placed.length = 0;
    let idle = 0;
    for (const it of shown) {
      const l = it.l;
      // a crowd of idle foes: only the nearest few keep their names up
      if (l.enemy && it.pri === 2 && ++idle > 6) { setLabel(l, 'none'); continue; }
      if (!l.w) { setLabel(l, ''); l.w = l.el.offsetWidth || 110; l.h = l.el.offsetHeight || 30; }
      // lift it just above whatever is in the way (twice at most); if it still collides, fade it
      const overlap = (yy) => placed.find(r => Math.abs(r.x - it.x) < (r.w + l.w) / 2 - 4 && yy > r.y - r.h && yy - l.h < r.y);
      let y = it.y, hit = overlap(y);
      for (let tries = 0; hit && tries < 2; tries++) { y = hit.y - hit.h - 2; hit = overlap(y); }
      const crowded = !!hit;
      if (crowded) y = it.y;
      placed.push({ x: it.x, y, w: l.w, h: l.h });
      let op = it.dist > 35 ? 1 - (it.dist - 35) / 10 : 1;
      if (crowded) op *= 0.35;
      if (me && it.x + l.w / 2 > me.x0 && it.x - l.w / 2 < me.x1 && y > me.y0 && y - l.h < me.y1 && it.pri > 0) op *= 0.3;
      setLabel(l, '', `translate(${Math.round(it.x)}px, ${Math.round(y)}px) translate(-50%, -100%)`, op > 0.97 ? '1' : op.toFixed(2));
    }
    this.floaters = this.floaters.filter(f => {
      f.t += this.dt;
      const pos = _floaterV.copy(f.pos);
      pos.y += f.t * 1.2;
      const fs = this.projectToScreen(pos, _floaterOut);
      f.el.style.transform = `translate(${fs.x}px, ${fs.y}px) translate(-50%, -50%) scale(${Math.min(1, 0.5 + f.t * 4)})`;
      f.el.style.opacity = String(f.t < 1.1 ? 1 : 1 - (f.t - 1.1) / 0.5);
      if (f.t > 1.6) { f.el.remove(); return false; }
      return true;
    });
  }

  // ------------------------------------------------------------ spell effects

  float(obj, text, cls = '') {
    if (!settings.damageNumbers && cls.startsWith('dmg')) return;
    const el = document.createElement('div');
    el.className = 'floater ' + cls;
    el.textContent = text;
    this.labelRoot.appendChild(el);
    const pos = obj.position.clone();
    pos.y += (obj.userData.height || 2.4) + 0.4;
    pos.x += (Math.random() - 0.5) * 0.6;
    this.floaters.push({ el, pos, t: 0 });
  }

  particle(pos, color, { vel = V(), life = 0.7, size = 0.12, gravity = 0 } = {}) {
    const m = new THREE.Mesh(this.sphereGeo, new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.copy(pos);
    m.scale.setScalar(size);
    this.scene.add(m);
    let t = 0;
    this.effects.push((dt) => {
      t += dt;
      vel.y -= gravity * dt;
      m.position.addScaledVector(vel, dt);
      m.material.opacity = Math.max(0, 1 - t / life);
      m.scale.setScalar(size * (1 - (t / life) * 0.6));
      if (t >= life) { this.scene.remove(m); m.material.dispose(); return false; }
    });
  }

  burst(pos, color, count = 16, power = 4) {
    count = Math.ceil(count * this.fx);
    for (let i = 0; i < count; i++) {
      const v = V(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).normalize().multiplyScalar(power * (0.4 + Math.random()));
      this.particle(pos, color, { vel: v, life: 0.5 + Math.random() * 0.4, size: 0.1 + Math.random() * 0.12, gravity: 6 });
    }
    this.shockwave(pos, color);
  }

  groundBurst(x, z, color, count = 18, power = 6) { this.burst(V(x, 0.4, z), color, count, power); }

  // Fire (or frost, or force) pouring out in a cone from `origin` along `dir`.
  breathFx(origin, dir, len, angle, color, n = 50) {
    const o = V(origin.x, origin.y ?? 1.2, origin.z);
    if (origin.y === undefined || origin.y < 0.5) o.y = 1.3;
    n = Math.ceil(n * this.fx);
    let t = 0, spawned = 0;
    this.effects.push((dt) => {
      t += dt;
      const want = Math.min(n, Math.floor((n * t) / 0.45));
      for (; spawned < want; spawned++) {
        const a = dir + (Math.random() - 0.5) * angle;
        const sp = (len / 0.65) * (0.55 + Math.random() * 0.5);
        this.particle(o, color, { vel: V(Math.sin(a) * sp, (Math.random() - 0.6) * 3 - (o.y - 0.6) * 1.2, Math.cos(a) * sp), life: 0.65, size: 0.22 + Math.random() * 0.3 });
      }
      if (t > 0.5) return false;
    });
  }

  // An enemy lunges along a line (drake charges, wyvern dives).
  dashEnemy(e, dir, len) {
    const m = e.model.position;
    const dx = Math.sin(dir), dz = Math.cos(dir);
    let t = 0, moved = 0;
    const dur = 0.28;
    e.model.rotation.y = dir;
    this.effects.push((dt) => {
      t += dt;
      const step = Math.min(len - moved, (len * dt) / dur);
      moved += step;
      const nx = m.x + dx * step, nz = m.z + dz * step;
      if (this.walkable(nx, nz)) m.x = nx, m.z = nz;
      if (Math.random() < 0.6) this.particle(m.clone().setY(0.4), 0xc8b89a, { vel: V((Math.random() - 0.5) * 2, 1, (Math.random() - 0.5) * 2), life: 0.5, size: 0.2 });
      if (t >= dur || moved >= len) return false;
    });
  }

  // A ghostly shell around the player (Become Ethereal).
  setGhost(on) {
    if (!this.player) return;
    if (!this.ghost) {
      this.ghost = new THREE.Mesh(new THREE.SphereGeometry(1.1, 18, 12), new THREE.MeshBasicMaterial({ color: 0xb0e8ff, transparent: true, opacity: 0.28, depthWrite: false }));
      this.ghost.scale.set(1, 1.6, 1);
      this.ghost.position.y = 1.6;
    }
    if (on) this.player.add(this.ghost);
    else this.ghost.parent?.remove(this.ghost);
  }

  // A dragon's soul streams out of its body and into you.
  soulFx(fromObj, color = 0xffd23d) {
    const start = this.chest(fromObj);
    let t = 0;
    this.effects.push((dt) => {
      t += dt;
      for (let k = 0; k < Math.ceil(3 * this.fx); k++) {
        const target = this.chest(this.player);
        const p = start.clone().lerp(target, Math.random());
        p.x += Math.sin(t * 8 + k) * 0.8;
        p.z += Math.cos(t * 8 + k) * 0.8;
        p.y += Math.sin(t * 5 + k * 2) * 0.6;
        this.particle(p, [color, 0xffffff, 0xff9a3d][k % 3], { vel: target.clone().sub(p).multiplyScalar(1.5), life: 0.6, size: 0.14 });
      }
      if (t > 2.2) { this.aura(this.player, color); return false; }
    });
  }

  // A little spray of chips, sparks or droplets (gathering, crafting).
  puff(x, y, z, color, n = 6, power = 2) {
    for (let i = 0; i < Math.ceil(n * this.fx); i++) {
      this.particle(V(x, y, z), color, { vel: V((Math.random() - 0.5) * power, Math.random() * power, (Math.random() - 0.5) * power), life: 0.5 + Math.random() * 0.3, size: 0.07 + Math.random() * 0.05, gravity: 7 });
    }
  }

  shockwave(pos, color, maxScale = 3) {
    const ring = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.15, pos.z);
    this.scene.add(ring);
    let t = 0;
    this.effects.push((dt) => {
      t += dt;
      ring.scale.setScalar(0.2 + (t / 0.5) * maxScale);
      ring.material.opacity = 1 - t / 0.5;
      if (t > 0.5) { this.scene.remove(ring); ring.material.dispose(); return false; }
    });
  }

  chest(obj) {
    return obj.position.clone().add(V(0, (obj.userData.height || 2.4) * 0.5, 0));
  }

  // A magic bolt that homes in on `toObj` (or flies to a fixed point) and resolves on impact.
  projectile(fromObj, toObj, color, size = 0.3, speed = 18) {
    return new Promise((resolve) => {
      const start = this.chest(fromObj).add(V(0, 0.4, 0));
      const endNow = () => (toObj.isObject3D ? this.chest(toObj) : toObj.clone());
      const dist0 = start.distanceTo(endNow());
      const dur = 0.15 + dist0 / speed;
      const orb = new THREE.Mesh(this.sphereGeo, new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending }));
      const core = new THREE.Mesh(this.sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      core.scale.setScalar(0.45);
      orb.add(core);
      orb.scale.setScalar(size);
      orb.position.copy(start);
      this.scene.add(orb);
      let t = 0, frame = 0;
      this.effects.push((dt) => {
        t = Math.min(1, t + dt / dur);
        const end = endNow();
        const mid = start.clone().lerp(end, 0.5);
        mid.y += 0.6 + dist0 * 0.06;
        const a = start.clone().lerp(mid, t), b = mid.clone().lerp(end, t);
        orb.position.copy(a.lerp(b, t));
        orb.scale.setScalar(size * (1 + Math.sin(this.time * 30) * 0.15));
        if (frame++ % 2 === 0) this.particle(orb.position, color, { life: 0.3, size: size * 0.6, vel: V((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)) });
        if (t >= 1) {
          this.scene.remove(orb);
          orb.material.dispose();
          this.burst(end, color, 14, 4);
          resolve(end);
          return false;
        }
      });
    });
  }

  // A big spell crashes down on the target from the sky.
  meteor(toObj, color, size = 1.2) {
    return new Promise((resolve) => {
      const end = this.chest(toObj);
      const start = end.clone().add(V(0, 12, -2));
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2, flatShading: true }));
      rock.scale.setScalar(size);
      rock.position.copy(start);
      this.scene.add(rock);
      let t = 0;
      this.effects.push((dt) => {
        t = Math.min(1, t + dt / 0.6);
        end.copy(this.chest(toObj));
        rock.position.lerpVectors(start, end, t * t);
        rock.rotation.x += dt * 8; rock.rotation.y += dt * 5;
        if (Math.random() < 0.8) this.particle(rock.position, color, { life: 0.5, size: 0.35, vel: V((Math.random() - 0.5) * 2, 2, (Math.random() - 0.5) * 2) });
        if (t >= 1) {
          this.scene.remove(rock);
          rock.geometry.dispose();
          this.burst(end, color, 40, 7);
          this.shockwave(end, 0xffffff, 6);
          this.shake(0.5);
          resolve();
          return false;
        }
      });
    });
  }

  // A head-and-shoulders portrait of an NPC for the dialogue box, rendered from their model
  // where they stand (so the background is their own town, at the current time of day).
  portrait(id) {
    const npc = this.npcs.find(n => n.id === id);
    if (!npc || !this.player) return null;
    // reading pixels back from the GPU costs a moment, so each face is kept for an in-game hour
    this.portraits ??= new Map();
    const key = `${id}:${Math.floor((this.skyCycle?.time || 0) * 24)}`;
    if (this.portraits.has(key)) return this.portraits.get(key);
    const S = 160;
    if (!this.portraitRT) {
      this.portraitRT = new THREE.WebGLRenderTarget(S, S, { samples: 4 });
      this.portraitRT.texture.colorSpace = THREE.SRGBColorSpace;
      this.portraitCam = new THREE.PerspectiveCamera(26, 1, 0.1, 120);
      this.portraitCam.layers.enableAll();
      this.portraitBuf = new Uint8Array(S * S * 4);
    }
    const m = npc.model, box = new THREE.Box3().setFromObject(m);
    const h = box.max.y - box.min.y;
    const head = V(m.position.x, box.min.y + h * 0.66, m.position.z);
    // look at them from where you stand, a little above eye level
    const to = V(this.player.position.x - head.x, 0, this.player.position.z - head.z);
    if (to.lengthSq() < 0.01) to.set(Math.sin(m.rotation.y), 0, Math.cos(m.rotation.y));
    to.normalize();
    const side = V(-to.z, 0, to.x);
    const cam = this.portraitCam;
    cam.position.copy(head).addScaledVector(to, h * 1.6).addScaledVector(side, h * 0.26).add(V(0, h * 0.06, 0));
    cam.lookAt(head.x, head.y + h * 0.02, head.z);
    const r = this.renderer, prev = r.getRenderTarget();
    const playerVisible = this.player.visible;
    this.player.visible = false;
    r.setRenderTarget(this.portraitRT);
    r.render(this.scene, cam);
    r.readRenderTargetPixels(this.portraitRT, 0, 0, S, S, this.portraitBuf);
    r.setRenderTarget(prev);
    this.player.visible = playerVisible;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const ctx = c.getContext('2d'), img = ctx.createImageData(S, S);
    // the render target is upside down compared with a canvas
    for (let y = 0; y < S; y++) img.data.set(this.portraitBuf.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
    ctx.putImageData(img, 0, 0);
    const url = c.toDataURL();
    if (this.portraits.size > 60) this.portraits.clear();
    this.portraits.set(key, url);
    return url;
  }

  // A soft beam of golden light over wherever the quest leads. It fades out as you arrive.
  setBeacon(t, dt) {
    if (!this.beacon) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(0xffd66e) }, alpha: { value: 0 }, time: { value: 0 } },
        vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main() {
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vN = mat3(modelMatrix) * normal;
            vV = cameraPosition - wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: `uniform vec3 color; uniform float alpha; uniform float time; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main() {
            float edge = pow(abs(dot(normalize(vN.xz), normalize(vV.xz + 1e-4))), 2.0);
            float h = pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.015, vUv.y);
            float ripple = 0.8 + 0.2 * sin(time * 3.0 - vUv.y * 60.0);
            gl_FragColor = vec4(color * 1.4, edge * h * ripple * alpha);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      });
      const geo = new THREE.CylinderGeometry(0.75, 1.05, 70, 20, 1, true);
      geo.translate(0, 35, 0);
      const beam = new THREE.Mesh(geo, mat);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.45, 36), new THREE.MeshBasicMaterial({ color: 0xffd66e, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.1;
      this.beacon = new THREE.Group();
      this.beacon.add(beam, ring);
      for (const m of [beam, ring]) m.renderOrder = 3;
      this.beacon.userData = { a: 0, mat, ring, t: 0 };
      this.beacon.visible = false;
      this.scene.add(this.beacon);
    }
    const b = this.beacon, u = b.userData;
    let want = 0;
    if (t && settings.beacon !== false && this.mode === 'explore') {
      // a new destination: fade in afresh rather than slide across the map
      if (Math.hypot(t.x - b.position.x, t.z - b.position.z) > 3) { u.a = 0; b.position.set(t.x, 0, t.z); }
      const pp = this.player.position;
      want = THREE.MathUtils.clamp((Math.hypot(t.x - pp.x, t.z - pp.z) - 7) / 12, 0, 1);
    }
    u.a += (want - u.a) * Math.min(1, dt * 2.5);
    u.t += dt;
    b.visible = u.a > 0.01;
    if (!b.visible) return;
    u.mat.uniforms.alpha.value = u.a * 0.85;
    u.mat.uniforms.time.value = u.t;
    const pulse = (u.t * 0.7) % 1;
    u.ring.scale.setScalar(0.6 + pulse * 1.6);
    u.ring.material.opacity = u.a * (1 - pulse) * 0.8;
  }

  aura(obj, color) {
    const base = obj.position.clone();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const p = base.clone().add(V(Math.cos(a) * 1, 0.2, Math.sin(a) * 1));
      this.particle(p, color, { vel: V(-Math.cos(a) * 0.3, 2 + Math.random() * 1.5, -Math.sin(a) * 0.3), life: 1.0, size: 0.1 });
    }
    this.shockwave(base, color, 2);
  }

  fizzle(obj) {
    const p = this.chest(obj).add(V(0, 0.8, 0));
    for (let i = 0; i < 10; i++) this.particle(p, 0x777777, { vel: V((Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2), life: 0.8, size: 0.14 });
  }

  castPose(obj, big = false) {
    obj.userData.cast?.(big);
    const gem = obj.userData.gem;
    const base = obj.scale.x;
    let t = 0;
    this.effects.push((dt) => {
      t += dt;
      const k = Math.sin(Math.min(1, t / 0.4) * Math.PI);
      obj.scale.setScalar(base * (1 + k * 0.08));
      if (gem) gem.scale.setScalar(1 + k * 1.5);
      if (t >= 0.4) { obj.scale.setScalar(base); return false; }
    });
  }

  // A quick wobble when something is hit (rotation, so it never fights movement).
  hitReact(obj) {
    let t = 0;
    this.effects.push((dt) => {
      t += dt;
      obj.rotation.z = Math.sin(t * 50) * 0.09 * (1 - t / 0.3);
      if (t >= 0.3) { obj.rotation.z = 0; return false; }
    });
  }

  // Shoves an enemy away from a point.
  knock(e, from, dist = 1.2) {
    const m = e.model.position;
    let dx = m.x - from.x, dz = m.z - from.z;
    const d = Math.hypot(dx, dz) || 1;
    dx /= d; dz /= d;
    let t = 0;
    const dur = 0.18;
    this.effects.push((dt) => {
      t += dt;
      const step = (dist * dt) / dur;
      const nx = m.x + dx * step, nz = m.z + dz * step;
      if (this.walkable(nx, nz)) m.set(nx, 0, nz);
      if (t >= dur) return false;
    });
  }

  // Freezes the action for a split second on big hits, so they feel heavy.
  hitStop(sec = 0.06) { if (!settings.reduceMotion) this.hitStopT = Math.max(this.hitStopT, sec); }

  // A warning on the ground that fills up, then goes off. Returns a handle you can cancel.
  // spec: { shape: 'circle' | 'cone' | 'line', x, z, r, inner, angle, dir, len, width, dur, color }
  telegraph(spec) {
    // colour-blind mode draws every danger zone in amber, which reads clearly on any ground
    const color = settings.colorblind ? 0xffb000 : spec.color ?? 0xff4030;
    const pp = this.player?.position;
    if (pp && Math.hypot(spec.x - pp.x, spec.z - pp.z) < (spec.r || spec.len || 4) + 3) this.dangerAt = this.time;
    const g = new THREE.Group();
    g.position.set(spec.x, 0.08 + Math.random() * 0.02, spec.z);
    g.rotation.y = spec.dir || 0;
    const { geo, edge } = spec.shape === 'line' ? stripGeo(spec.width, spec.len) : sectorGeo(spec.r, spec.shape === 'cone' ? spec.angle : Math.PI * 2, spec.inner || 0);
    const mk = (opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const base = new THREE.Mesh(geo, mk(0.2));
    const fill = new THREE.Mesh(geo, mk(0.32));
    const line = new THREE.LineLoop(edge, new THREE.LineBasicMaterial({ color: 0xffd0c0, transparent: true, opacity: 0.9, fog: false }));
    for (const m of [base, fill, line]) { m.renderOrder = 2; g.add(m); }
    fill.scale.set(0.001, 1, spec.shape === 'line' ? 1 : 0.001);
    if (spec.shape === 'line') fill.scale.set(1, 1, 0.001);
    this.scene.add(g);
    let t = 0, cancelled = false;
    const dur = spec.dur ?? 1;
    const handle = { spec, cancel: () => { cancelled = true; } };
    this.effects.push((dt) => {
      t += dt;
      const k = Math.min(1, t / dur);
      if (spec.shape === 'line') fill.scale.z = Math.max(0.001, k);
      else fill.scale.set(Math.max(0.001, k), 1, Math.max(0.001, k));
      base.material.opacity = 0.16 + Math.sin(t * 14) * 0.06;
      if (t >= dur) {
        fill.material.opacity = 0.75 * (1 - (t - dur) / 0.2);
        base.material.opacity = 0;
        line.material.opacity = 0;
      }
      if (cancelled || t >= dur + 0.2) {
        this.scene.remove(g);
        geo.dispose(); edge.dispose();
        base.material.dispose(); fill.material.dispose(); line.material.dispose();
        return false;
      }
    });
    return handle;
  }

  // A defeated foe is knocked back, topples away from the player and sinks into the ground in a
  // burst of its school's colour. Bosses fall slowly, with a shockwave.
  defeat(obj, { color = 0x9a8cff, boss = false } = {}) {
    const base = obj.scale.x, y0 = obj.position.y, pp = this.player?.position;
    const dir = pp ? Math.atan2(obj.position.x - pp.x, obj.position.z - pp.z) : obj.rotation.y + Math.PI;
    const push = V(Math.sin(dir), 0, Math.cos(dir));
    const axis = V(0, 1, 0).cross(push).normalize();
    const q0 = obj.quaternion.clone(), tip = new THREE.Quaternion();
    const h = (obj.userData.height || 2) * base;
    const dur = boss ? 2.4 : 1.15;
    for (let i = 0; i < (boss ? 50 : 20); i++) this.particle(this.chest(obj), i % 3 ? color : 0xffffff, { vel: V((Math.random() - 0.5) * 4, Math.random() * 4, (Math.random() - 0.5) * 4), life: 1.3, size: 0.15 });
    if (boss) {
      this.shake(0.7);
      this.hitStop(0.18);
      this.shockwave(obj.position, color, 9);
      this.groundBurst(obj.position.x, obj.position.z, color, 40, 8);
    }
    let t = 0;
    this.effects.push((dt) => {
      t += dt;
      const k = Math.min(1, t / dur);
      const fall = Math.min(1, k / 0.45);
      tip.setFromAxisAngle(axis, fall * fall * Math.PI * 0.46);
      obj.quaternion.copy(q0).premultiply(tip);
      obj.position.addScaledVector(push, dt * Math.max(0, 1 - k * 2) * (boss ? 1.5 : 3));
      const land = y0 * Math.max(0, 1 - k / 0.3);   // flyers drop to the ground first
      obj.position.y = land - Math.max(0, (k - 0.55) / 0.45) * h * 0.5;
      if (k > 0.6) obj.scale.setScalar(base * Math.max(0.01, 1 - (k - 0.6) / 0.4));
      if (t >= dur) {
        obj.visible = false;
        obj.scale.setScalar(base);
        obj.quaternion.copy(q0);
        obj.position.y = 0;
        return false;
      }
    });
  }

  shake(amount) { if (!settings.reduceMotion) this.shakeAmt = Math.max(this.shakeAmt, amount * settings.shake); }

  // ------------------------------------------------------------ main loop

  // Blend fog, sky and light toward the zone's mood, the time of day and the weather.
  updateAtmosphere(dt, focus) {
    const zone = this.player ? zoneAt(this.player.position.x) : 'academy';
    if (zone !== this.zone) {
      this.zone = zone;
      this.onZoneChange?.(zone);
    }
    const a = this.skyCycle.update(dt, zone, this.camera, focus);
    const u = this.sky.material.uniforms;
    const k = this.atmo ? 1 - Math.exp(-dt * 2) : 1;
    this.atmo = true;
    this.scene.fog.color.lerp(a.fog, k);
    this.scene.fog.near += (a.fogNear - this.scene.fog.near) * k;
    this.scene.fog.far += (a.fogFar - this.scene.fog.far) * k;
    this.hemi.intensity += (a.hemiI - this.hemi.intensity) * Math.max(k, this.skyCycle.flash);
    this.sun.intensity += (a.sunI - this.sun.intensity) * k;
    this.sun.color.lerp(a.sunColor, k);
    u.top.value.lerp(a.top, k);
    u.mid.value.lerp(a.mid, k);
    u.bottom.value.lerp(a.bottom, k);
    this.hemi.color.lerp(a.hemi, k);
  }

  // Keep it smooth: when the frame rate stays under 30 for about 8 seconds, draw fewer pixels
  // (big on Retina screens), then drop a quality level. It never raises it again by itself.
  autoQuality(real) {
    if (settings.autoQuality === false || this.mode !== 'explore' || navigator.webdriver || document.hidden) { this.aqT = 0; this.aqN = 0; return; }
    this.aqT = (this.aqT || 0) + real;
    this.aqN = (this.aqN || 0) + 1;
    if (this.aqT < 4) return;
    const fps = this.aqN / this.aqT;
    this.aqT = 0; this.aqN = 0;
    if (fps >= 30) { this.aqSlow = 0; return; }
    if (++this.aqSlow < 2) return;
    this.aqSlow = 0;
    const ratio = this.renderer.getPixelRatio();
    if (ratio > 1.01) { this.renderer.setPixelRatio(Math.max(1, ratio - 0.25)); this.resize(); return; }
    const next = { high: 'medium', medium: 'low' }[settings.quality];
    if (next) { setSetting('quality', next); this.onAutoQuality?.(QUALITY[next].label); }
  }

  frame() {
    const raw = this.clock.getDelta();
    const real = Math.min(0.05, raw);
    this.autoQuality(Math.min(raw, 0.5));
    this.update(real);
    if (this.composer) {
      // ease the grade toward the current land's look
      const g = GRADES[this.zone] || GRADES.academy, u = this.grade.uniforms, k = Math.min(1, real * 2);
      u.tint.value.r += (g[0] - u.tint.value.r) * k;
      u.tint.value.g += (g[1] - u.tint.value.g) * k;
      u.tint.value.b += (g[2] - u.tint.value.b) * k;
      u.saturation.value += (g[3] - u.saturation.value) * k;
      this.composer.render(real);
    } else this.renderer.render(this.scene, this.camera);
  }

  // Runs the game forward without drawing (used by automated tests).
  simulate(seconds, step = 0.05) {
    for (let t = 0; t < seconds; t += step) this.update(step);
  }

  update(real) {
    let dt = real;
    if (this.hitStopT > 0) { this.hitStopT -= real; dt *= 0.1; }
    this.dt = dt;
    this.time += dt;
    this.fpsFrames++;
    this.fpsT += real;
    if (this.fpsT >= 0.5) { this.fps = this.fpsFrames / this.fpsT; this.fpsFrames = 0; this.fpsT = 0; }

    if (this.mode === 'explore' && this.player) this.movePlayer(dt);
    else if (this.player) this.animPlayer(false);
    this.updateEnemies(dt);
    this.updateTargetRing();
    const fp = this.player?.position;
    for (const o of this.animated) {
      if (fp && Math.abs(o.position.x - fp.x) + Math.abs(o.position.z - fp.z) > 140) continue;
      o.userData.anim(this.time);
    }
    this.updateNodes();
    this.cullT = (this.cullT || 0) - real;
    if (this.cullT <= 0) { this.cullT = 0.25; this.cullDistant(); }
    for (const n of this.npcs) {
      if (fp && Math.abs(n.model.position.x - fp.x) + Math.abs(n.model.position.z - fp.z) > 140) continue;
      n.model.userData.anim(this.time, false);
      if (this.player && this.mode === 'explore') {
        const d = n.model.position.distanceTo(this.player.position);
        if (d < 6) {
          const want = Math.atan2(this.player.position.x - n.model.position.x, this.player.position.z - n.model.position.z);
          n.model.rotation.y += (((want - n.model.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 4);
        }
      }
    }
    if (this.moteMesh) {
      const m4 = this._m4 || (this._m4 = new THREE.Matrix4());
      this.motes.forEach((m, i) => {
        if (!m.visible) {
          if (m.shown) { m.shown = false; this.moteMesh.setMatrixAt(i, m4.makeScale(0, 0, 0)); }
          return;
        }
        m.shown = true;
        const b = m.userData.base, ph = m.userData.phase;
        m4.makeScale(m.s, m.s, m.s).setPosition(b.x + Math.sin(this.time * 0.3 + ph) * 2, b.y + Math.sin(this.time * 0.8 + ph) * 0.8, b.z + Math.cos(this.time * 0.25 + ph) * 2);
        this.moteMesh.setMatrixAt(i, m4);
      });
      this.moteMesh.instanceMatrix.needsUpdate = true;
    }
    // run effects in place: compacts dead ones without allocating a new array each frame
    const fxArr = this.effects, fxLen = fxArr.length;
    let fxW = 0;
    for (let r = 0; r < fxLen; r++) { const fn = fxArr[r]; if (fn(dt) !== false) fxArr[fxW++] = fn; }
    for (let r = fxLen; r < fxArr.length; r++) fxArr[fxW++] = fxArr[r]; // keep effects spawned this tick
    fxArr.length = fxW;

    // camera
    let pos, look;
    if (this.mode === 'title' || !this.player) {
      const a = this.time * 0.05;
      pos = V(Math.sin(a) * 40, 16, Math.cos(a) * 40);
      look = V(0, 5, -10);
      this.camera.position.copy(pos);
      this.camera.lookAt(look);
    } else {
      // big foes: ease the camera out so the whole of them fits on screen
      let big = 0;
      for (const e of this.enemies) {
        if (e.state !== 'aggro') continue;
        const h = e.model.userData.height || 0;
        if (h > 4.5 && Math.abs(e.model.position.x - this.player.position.x) + Math.abs(e.model.position.z - this.player.position.z) < 30) big = Math.max(big, Math.min(10, h * 0.9));
      }
      this.camExtra = (this.camExtra || 0) + (big - (this.camExtra || 0)) * Math.min(1, dt * 1.5);
      ({ pos, look } = this.followCam());
      // pull in quickly when something solid is behind you, ease back out slowly
      this.occT = (this.occT || 0) + 1;
      if (this.occT % 2 === 0 || this.occFit === undefined) this.occFit = this.camOcclusion(pos);
      const want = Math.min(ZONES[zoneAt(this.player.position.x)].freeCam ? 1 : this.camReach(pos), this.occFit);
      const fit = this.camFit ?? want;
      this.camFit = want < fit ? Math.max(want, fit - dt * 6) : Math.min(want, fit + dt * 0.9);
      pos = this.fitCam(pos, this.camFit);
      this.camera.position.lerp(pos, 1 - Math.exp(-7 * dt));
      this.camera.lookAt(look);
    }
    if (this.shakeAmt > 0) {
      this.camera.position.add(_shakeV.set((Math.random() - 0.5) * this.shakeAmt, (Math.random() - 0.5) * this.shakeAmt, 0));
      this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.5);
    }

    // keep the shadow camera and sky centred on the action
    const focus = this.player ? this.player.position : _zeroV;
    this.sun.target.position.copy(focus);
    this.sky.position.copy(this.camera.position);

    if (this.player) this.updatePet(dt);
    this.updateAtmosphere(dt, focus);

    this.onTick?.(dt);
    this.updateLabels();
  }
}
