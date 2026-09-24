// The 3D world: map, player movement, camera, NPCs, wandering enemies and spell effects.
import * as THREE from 'three';
import {
  makeWizard, makeEnemy, makeTree, makeRoundTree, makeDeadTree, makeLamp, makeHouse, makeTower,
  makeFountain, makeGate, makeCrypt, makeGrave, makeRock, makeStall, makeBookStand, glowMat,
  makePet, makePortal, mergeGeometries,
} from './models.js';
import { NPCS, SPAWNS, ENEMIES, SCHOOLS, ZONES, zoneAt, PORTALS, FOUNTAINS, GEAR, PETS } from './data.js';
import { buildEmberfall } from './maps.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
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
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 700);
    this.clock = new THREE.Clock();
    this.time = 0;

    this.mode = 'title';      // title | explore | battle | locked
    this.keys = {};
    this.labels = [];
    this.effects = [];
    this.floaters = [];
    this.npcs = [];
    this.enemies = [];
    this.colliders = [];      // {x, z, r}
    this.staticObjs = [];     // scenery merged into batches after the map is built
    this.animated = [];       // objects with userData.anim
    this.player = null;
    this.heading = Math.PI;   // facing -Z (toward the academy)
    this.camYawOffset = 0;
    this.camDist = 10;
    this.camHeight = 5;
    this.moveTarget = null;
    this.pendingTalk = null;
    this.invulnUntil = 0;
    this.shakeAmt = 0;
    this.battleView = null;

    this.onEncounter = null;  // (enemyEntities) => void
    this.onInteract = null;   // (npcId) => void
    this.onTick = null;       // (dt) => void
    this.pet = null;
    this.zone = 'academy';
    this.atmo = null;

    this.sphereGeo = new THREE.SphereGeometry(1, 10, 8);
    this.ringGeo = new THREE.RingGeometry(0.8, 1, 40);

    this.buildEnvironment();
    this.buildMap();
    this.batchStatic();
    this.spawnNPCs();
    this.spawnEnemies();
    this.bindInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ------------------------------------------------------------ setup

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 70 : 55;
    this.camera.updateProjectionMatrix();
  }

  buildEnvironment() {
    const scene = this.scene;
    scene.fog = new THREE.Fog(0x4a3468, 50, 170);

    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
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
      starPos.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380);
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
  batchStatic(cell = 40) {
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
    for (const b of buckets.values()) {
      const mesh = new THREE.Mesh(mergeGeometries(b.items), b.material);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = b.receive;
      mesh.matrixAutoUpdate = false;
      this.scene.add(mesh);
    }
    this.staticObjs = [];
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

    // Chapter 2 zone + the portals that connect the zones
    const ember = buildEmberfall(this);
    this.fountainModels = { fountain: this.fountain, spring_ember: ember.spring };
    this.portalModels = {};
    for (const pt of PORTALS) {
      const color = pt.id === 'portal_academy' ? 0xff7a3d : 0xb46bff;
      this.portalModels[pt.id] = this.add(makePortal(color), pt.x, pt.z, pt.id === 'portal_academy' ? Math.PI / 2 : 0);
      for (const s of [-1, 1]) {
        const off = pt.id === 'portal_academy' ? [0, s * 2.4] : [s * 2.4, 0];
        this.colliders.push({ x: pt.x + off[0], z: pt.z + off[1], r: 0.7 });
      }
    }
  }

  spawnNPCs() {
    for (const [id, def] of Object.entries(NPCS)) {
      const model = makeWizard(def);
      model.userData.height = measure(model);
      this.add(model, def.x, def.z, Math.atan2(-def.x, -def.z), 0.8);
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
    SPAWNS.forEach((sp, idx) => {
      const def = ENEMIES[sp.enemy];
      const model = makeEnemy(def.model);
      model.userData.height = measure(model);
      const box = new THREE.Box3().setFromObject(model);
      model.userData.width = box.max.x - box.min.x;
      model.position.set(sp.x, 0, sp.z);
      model.rotation.y = Math.PI;
      this.scene.add(model);
      const color = SCHOOLS[def.school].css;
      const label = this.addLabel(model,
        `<div class="name" style="color:${color}">${SCHOOLS[def.school].icon} ${def.name}</div><div class="sub">Level ${def.level}${def.boss ? ' · Boss' : ''}</div>`,
        'enemy', model.userData.height + 0.5);
      this.enemies.push({
        uid: idx, def, model, label, home: V(sp.x, 0, sp.z), wanderR: sp.r, baseScale: model.scale.x,
        state: 'idle', target: null, wait: Math.random() * 3, respawnAt: 0,
      });
    });
  }

  // Rebuilds the player model (e.g. after changing gear) and keeps its place.
  spawnPlayer(p, pos) {
    const old = this.player;
    const keep = old ? old.position.clone() : null;
    if (old) this.scene.remove(old);
    const c = SCHOOLS[p.school].color;
    const hat = GEAR[p.equipped?.hat]?.color ?? new THREE.Color(c).multiplyScalar(0.55).getHex();
    const robe = GEAR[p.equipped?.robe]?.color ?? c;
    this.player = makeWizard({ robe, hat, trim: 0xf2e6c9, gem: c });
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
    if (this.pet) this.pet.position.set(at.x + 1, 0, at.z - 1);
    this.snapCamera();
  }

  // ------------------------------------------------------------ input

  bindInput() {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      this.keys[e.code] = true;
      if (this.mode === 'explore' && ['KeyE', 'Enter', 'Space'].includes(e.code)) {
        const near = this.nearestInteractable();
        if (near) { e.preventDefault(); this.onInteract?.(near.id); }
      }
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });

    let down = null;
    this.canvas.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now(), lastX: e.clientX, moved: 0 };
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - down.lastX;
      down.lastX = e.clientX;
      down.moved += Math.abs(dx) + Math.abs(e.movementY || 0);
      if (this.mode === 'explore' && down.moved > 6) this.camYawOffset -= dx * 0.008;
    });
    this.canvas.addEventListener('pointerup', (e) => {
      if (down && down.moved < 8 && performance.now() - down.t < 400 && this.mode === 'explore') this.tapMove(e.clientX, e.clientY);
      down = null;
    });
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
    return list;
  }

  // Instantly moves the player (used by portals), with a flash of light.
  teleport(to) {
    this.player.position.set(to.x, 0, to.z);
    this.heading = to.heading ?? this.heading;
    this.camYawOffset = 0;
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
    this.pet.userData.anim(0, false);
    this.pet.userData.height = measure(this.pet);
    this.pet.position.copy(this.player.position).add(V(1, 0, -1));
    this.scene.add(this.pet);
  }

  updatePet(dt) {
    const pet = this.pet;
    if (!pet) return;
    let moving = false;
    if (this.mode !== 'battle') {
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
    const regions = ZONES[zoneAt(x)].regions;
    const inside = regions.some(r => r.type === 'circle'
      ? (x - r.x) ** 2 + (z - r.z) ** 2 < r.r * r.r
      : x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
    if (!inside) return false;
    for (const c of this.colliders) if ((x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return false;
    return true;
  }

  movePlayer(dt) {
    const k = this.keys;
    const fwd = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
    const turn = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);
    let speed = 0;

    if (fwd || turn) {
      this.moveTarget = null;
      this.pendingTalk = null;
      this.heading += turn * 2.8 * dt;
      speed = fwd > 0 ? PLAYER_SPEED : fwd < 0 ? -PLAYER_SPEED * 0.55 : 0;
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
        const want = Math.atan2(dx, dz);
        let diff = ((want - this.heading + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
        this.heading += diff * Math.min(1, dt * 10);
        speed = PLAYER_SPEED;
      }
    }

    const moving = speed !== 0;
    if (moving) {
      const p = this.player.position;
      const nx = p.x + Math.sin(this.heading) * speed * dt;
      const nz = p.z + Math.cos(this.heading) * speed * dt;
      if (this.walkable(nx, nz)) p.set(nx, 0, nz);
      else if (this.walkable(nx, p.z)) p.x = nx;
      else if (this.walkable(p.x, nz)) p.z = nz;
      else this.moveTarget = null;
    }
    this.player.rotation.y = this.heading;
    this.player.userData.anim(this.time, moving);
  }

  // Pulls a camera position toward `from` until it is over open ground, so the
  // camera never ends up inside a house, cliff or tree.
  safeCam(from, to) {
    let best = from.clone();
    const p = V();
    for (let i = 1; i <= 14; i++) {
      p.lerpVectors(from, to, i / 14);
      if (!this.walkable(p.x, p.z)) break;
      best.copy(p);
    }
    best.y = to.y;
    return best;
  }

  snapCamera() {
    if (!this.player) return;
    const { pos, look } = this.followCam();
    this.camera.position.copy(this.safeCam(look, pos));
    this.camera.lookAt(look);
  }

  followCam() {
    const yaw = this.heading + this.camYawOffset;
    const p = this.player.position;
    return {
      pos: V(p.x - Math.sin(yaw) * this.camDist, this.camHeight + this.camDist * 0.15, p.z - Math.cos(yaw) * this.camDist),
      look: V(p.x, 1.7, p.z),
    };
  }

  // ------------------------------------------------------------ enemies

  updateEnemies(dt) {
    const pp = this.player?.position;
    for (const e of this.enemies) {
      e.model.userData.anim?.(this.time, !!e.target && e.wait <= 0);
      if (e.state === 'dead') {
        if (this.time > e.respawnAt) this.respawnEnemy(e);
        continue;
      }
      // bystanders never block the view of a duel
      if (e.state === 'idle') e.model.visible = !this.battleView || e.model.position.distanceTo(this.camera.position) > 9;
      if (e.state !== 'idle' || this.mode !== 'explore' || !pp) continue;

      const dPlayer = Math.hypot(pp.x - e.model.position.x, pp.z - e.model.position.z);
      const safe = this.time < this.invulnUntil;
      if (dPlayer < 1.8 && !safe) { this.engage(e); return; }

      let target = null, speed = e.def.speed;
      const homeDist = Math.hypot(pp.x - e.home.x, pp.z - e.home.z);
      if (!safe && dPlayer < e.def.aggro && homeDist < e.def.aggro + e.wanderR + 3 && speed > 0) {
        target = pp; speed *= 1.35;
      } else if (e.wanderR > 0) {
        if (!e.target) {
          e.wait -= dt;
          if (e.wait <= 0) {
            const a = Math.random() * Math.PI * 2, r = Math.random() * e.wanderR;
            e.target = V(e.home.x + Math.cos(a) * r, 0, e.home.z + Math.sin(a) * r);
          }
        }
        target = e.target;
      }
      if (target && speed > 0) {
        const m = e.model.position;
        const dx = target.x - m.x, dz = target.z - m.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.2) { e.target = null; e.wait = 1 + Math.random() * 3; continue; }
        const step = Math.min(d, speed * dt);
        const nx = m.x + (dx / d) * step, nz = m.z + (dz / d) * step;
        if (this.walkable(nx, nz)) m.set(nx, 0, nz); else { e.target = null; e.wait = 1; }
        e.model.rotation.y = Math.atan2(dx, dz);
      }
    }
  }

  engage(first) {
    const pp = this.player.position;
    const group = [first];
    const others = this.enemies
      .filter(e => e !== first && e.state === 'idle')
      .map(e => ({ e, d: Math.hypot(e.model.position.x - pp.x, e.model.position.z - pp.z) }))
      .filter(o => o.d < 8)
      .sort((a, b) => a.d - b.d);
    for (const o of others) if (group.length < 3) group.push(o.e);
    for (const e of group) e.state = 'battle';
    this.moveTarget = null;
    this.onEncounter?.(group);
  }

  respawnEnemy(e) {
    e.state = 'idle';
    e.model.position.copy(e.home);
    e.model.visible = true;
    e.model.scale.setScalar(e.baseScale);
    e.model.rotation.set(0, Math.PI, 0);
    e.target = null;
  }

  // ------------------------------------------------------------ battle staging

  setupBattle(enemyEntities) {
    const pp = this.player.position.clone();
    const ep = enemyEntities[0].model.position.clone();
    let dir = ep.clone().sub(pp).setY(0);
    if (dir.lengthSq() < 0.01) dir.set(0, 0, 1);
    dir.normalize();
    const center = pp.clone().add(ep).multiplyScalar(0.5);
    const perp = V(dir.z, 0, -dir.x);
    const big = enemyEntities.some(e => e.def.boss);
    const R = big ? 4.6 : 3.6;
    const k = R / 3.6;

    const circle = new THREE.Group();
    circle.position.set(center.x, 0.06, center.z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.6, 64), new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    circle.add(ring);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(5.2, 64), new THREE.MeshBasicMaterial({ color: 0x2a1f5c, transparent: true, opacity: 0.45 }));
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -0.01;
    circle.add(disc);
    const inner = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.55, 6), new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    inner.rotation.x = -Math.PI / 2;
    circle.add(inner);
    const sigils = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.CircleGeometry(0.7, 6), new THREE.MeshBasicMaterial({ color: 0x9fe6ff, transparent: true, opacity: 0.35 }));
      s.rotation.x = -Math.PI / 2;
      s.position.set(Math.cos(a) * 3.6, 0.01, Math.sin(a) * 3.6);
      circle.add(s);
      sigils.push(s);
    }
    this.scene.add(circle);
    circle.scale.setScalar(0.01);
    let t = 0;
    this.effects.push((dt) => {
      t += dt;
      circle.scale.setScalar(Math.min(1, t * 2.5) * k);
      inner.rotation.z += dt * 0.5;
      return !!circle.parent;
    });
    this.battleCircle = circle;

    // place combatants
    this.player.position.copy(center.clone().addScaledVector(dir, -R));
    this.player.rotation.y = Math.atan2(dir.x, dir.z);
    this.heading = this.player.rotation.y;
    if (this.pet) {
      this.pet.position.copy(this.player.position).addScaledVector(perp, -1.6).addScaledVector(dir, 0.6);
      this.pet.rotation.y = this.heading;
    }
    // bosses stand in the middle of their side
    enemyEntities.sort((a, b) => (a.def.boss ? 1 : 0) - (b.def.boss ? 1 : 0));
    if (enemyEntities.length === 3 && enemyEntities[2].def.boss) enemyEntities.splice(1, 0, enemyEntities.pop());
    // line enemies up side by side using their real widths so big models never overlap
    const widths = enemyEntities.map(e => Math.max(1.4, (e.model.userData.width || 1.6) * 0.8));
    const total = widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * 0.4;
    let cursor = -total / 2;
    const offsets = widths.map(w => { const o = cursor + w / 2; cursor += w + 0.4; return o; });
    enemyEntities.forEach((e, i) => {
      const back = e.def.boss && enemyEntities.length > 1 ? 1.2 : 0;
      e.model.position.copy(center.clone().addScaledVector(dir, R + back).addScaledVector(perp, offsets[i]));
      e.model.rotation.y = Math.atan2(-dir.x, -dir.z);
    });

    // try the usual over-the-shoulder spot, then its mirror, and keep whichever
    // gets furthest back without entering scenery
    const look = center.clone().addScaledVector(dir, 1.2).setY(big ? 1.8 : 0.8);
    let bestPos = null, bestDist = -1;
    for (const side of [1, -1]) {
      const want = center.clone().addScaledVector(dir, -R - 7.5 * k).addScaledVector(perp, 4.5 * k * side).setY(7 * k);
      const got = this.safeCam(center.clone().setY(want.y), want);
      const d = got.distanceTo(center);
      if (d > bestDist + 0.5) { bestDist = d; bestPos = got; }
    }
    this.battleView = { pos: bestPos, look };
    for (const l of this.labels) l.hiddenForBattle = true;
  }

  endBattle({ outcome, enemies }) {
    if (this.battleCircle) this.scene.remove(this.battleCircle);
    this.battleCircle = null;
    this.battleView = null;
    for (const l of this.labels) l.hiddenForBattle = false;
    for (const e of enemies) {
      if (e.hp <= 0 || outcome === 'win') {
        e.entity.state = 'dead';
        e.entity.model.visible = false;
        e.entity.respawnAt = this.time + (e.entity.def.boss ? 60 : 25);
      } else {
        e.entity.state = 'idle';
        e.entity.target = e.entity.home.clone();
      }
    }
    if (outcome === 'lose') {
      const sp = ZONES[zoneAt(this.player.position.x)].spawn;
      this.player.position.set(sp.x, 0, sp.z);
      if (this.pet) this.pet.position.set(sp.x + 1, 0, sp.z);
      this.heading = sp.heading;
      this.camYawOffset = 0;
      this.snapCamera();
    }
    this.invulnUntil = this.time + 4;
  }

  // ------------------------------------------------------------ labels & floaters

  addLabel(obj, html, cls, y) {
    const el = document.createElement('div');
    el.className = 'label ' + cls;
    el.innerHTML = html;
    this.labelRoot.appendChild(el);
    const l = { obj, el, y, hiddenForBattle: false };
    this.labels.push(l);
    return l;
  }

  setNpcMarker(id, marker) {
    const npc = this.npcs.find(n => n.id === id);
    if (!npc) return;
    const m = npc.label.el.querySelector('.marker');
    m.textContent = marker;
    m.className = 'marker' + (marker ? ' on' : '');
  }

  projectToScreen(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight, visible: p.z < 1 };
  }

  updateLabels() {
    const tmp = V();
    const showWorld = this.mode === 'explore';
    for (const l of this.labels) {
      if (!showWorld || l.hiddenForBattle || !l.obj.visible) { l.el.style.display = 'none'; continue; }
      l.obj.getWorldPosition(tmp);
      const dist = tmp.distanceTo(this.camera.position);
      tmp.y += l.y;
      const s = this.projectToScreen(tmp);
      if (!s.visible || dist > 45) { l.el.style.display = 'none'; continue; }
      l.el.style.display = '';
      l.el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%)`;
      l.el.style.opacity = dist > 35 ? String(1 - (dist - 35) / 10) : '1';
    }
    this.floaters = this.floaters.filter(f => {
      f.t += this.dt;
      const pos = f.pos.clone();
      pos.y += f.t * 1.2;
      const s = this.projectToScreen(pos);
      f.el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) scale(${Math.min(1, 0.5 + f.t * 4)})`;
      f.el.style.opacity = String(f.t < 1.1 ? 1 : 1 - (f.t - 1.1) / 0.5);
      if (f.t > 1.6) { f.el.remove(); return false; }
      return true;
    });
  }

  // ------------------------------------------------------------ spell effects

  float(obj, text, cls = '') {
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
    for (let i = 0; i < count; i++) {
      const v = V(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).normalize().multiplyScalar(power * (0.4 + Math.random()));
      this.particle(pos, color, { vel: v, life: 0.5 + Math.random() * 0.4, size: 0.1 + Math.random() * 0.12, gravity: 6 });
    }
    this.shockwave(pos, color);
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

  projectile(fromObj, toObj, color, size = 0.3) {
    return new Promise((resolve) => {
      const start = this.chest(fromObj).add(V(0, 0.4, 0));
      const end = this.chest(toObj);
      const mid = start.clone().lerp(end, 0.5);
      mid.y += 2 + start.distanceTo(end) * 0.15;
      const orb = new THREE.Mesh(this.sphereGeo, new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending }));
      const core = new THREE.Mesh(this.sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      core.scale.setScalar(0.45);
      orb.add(core);
      orb.scale.setScalar(size);
      this.scene.add(orb);
      const dur = 0.5 + start.distanceTo(end) * 0.03;
      let t = 0;
      this.effects.push((dt) => {
        t = Math.min(1, t + dt / dur);
        const a = start.clone().lerp(mid, t), b = mid.clone().lerp(end, t);
        orb.position.copy(a.lerp(b, t));
        orb.scale.setScalar(size * (1 + Math.sin(this.time * 30) * 0.15));
        this.particle(orb.position, color, { life: 0.35, size: size * 0.6, vel: V((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)) });
        if (t >= 1) {
          this.scene.remove(orb);
          orb.material.dispose();
          this.burst(end, color, 18, 4);
          resolve();
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
        t = Math.min(1, t + dt / 0.75);
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

  castPose(obj) {
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

  hitReact(obj) {
    const base = obj.position.clone();
    let t = 0;
    this.effects.push((dt) => {
      t += dt;
      obj.position.x = base.x + Math.sin(t * 60) * 0.12 * (1 - t / 0.35);
      if (t >= 0.35) { obj.position.copy(base); return false; }
    });
  }

  defeat(obj) {
    const base = obj.scale.x;
    let t = 0;
    for (let i = 0; i < 20; i++) this.particle(this.chest(obj), 0x9a8cff, { vel: V((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3), life: 1.2, size: 0.15 });
    this.effects.push((dt) => {
      t += dt;
      obj.rotation.y += dt * 12;
      obj.scale.setScalar(base * Math.max(0.01, 1 - t));
      if (t >= 1) { obj.visible = false; obj.scale.setScalar(base); return false; }
    });
  }

  shake(amount) { this.shakeAmt = Math.max(this.shakeAmt, amount); }

  // ------------------------------------------------------------ main loop

  // Blend fog, sky and light colours toward the current zone's mood.
  updateAtmosphere(dt) {
    const zone = this.player ? zoneAt(this.player.position.x) : 'academy';
    if (zone !== this.zone) {
      this.zone = zone;
      this.onZoneChange?.(zone);
    }
    const a = ZONES[zone].atmosphere;
    const u = this.sky.material.uniforms;
    const k = this.atmo ? 1 - Math.exp(-dt * 2) : 1;
    this.atmo = true;
    this.scene.fog.color.lerp(new THREE.Color(a.fog), k);
    u.top.value.lerp(new THREE.Color(a.top), k);
    u.mid.value.lerp(new THREE.Color(a.mid), k);
    u.bottom.value.lerp(new THREE.Color(a.bottom), k);
    this.hemi.color.lerp(new THREE.Color(a.hemi), k);
  }

  frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    this.dt = dt;
    this.time += dt;

    if (this.mode === 'explore' && this.player) this.movePlayer(dt);
    else if (this.player) this.player.userData.anim(this.time, false);
    this.updateEnemies(dt);
    for (const o of this.animated) o.userData.anim(this.time);
    for (const n of this.npcs) {
      n.model.userData.anim(this.time, false);
      if (this.player && this.mode === 'explore') {
        const d = n.model.position.distanceTo(this.player.position);
        if (d < 6) {
          const want = Math.atan2(this.player.position.x - n.model.position.x, this.player.position.z - n.model.position.z);
          n.model.rotation.y += (((want - n.model.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 4);
        }
      }
    }
    for (const m of this.motes) {
      const b = m.userData.base, ph = m.userData.phase;
      m.position.set(b.x + Math.sin(this.time * 0.3 + ph) * 2, b.y + Math.sin(this.time * 0.8 + ph) * 0.8, b.z + Math.cos(this.time * 0.25 + ph) * 2);
    }
    this.effects = this.effects.filter(fn => fn(dt) !== false);

    // camera
    let pos, look;
    if (this.mode === 'title' || !this.player) {
      const a = this.time * 0.05;
      pos = V(Math.sin(a) * 40, 16, Math.cos(a) * 40);
      look = V(0, 5, -10);
      this.camera.position.copy(pos);
      this.camera.lookAt(look);
    } else {
      if (this.battleView) {
        pos = this.battleView.pos.clone().add(V(Math.sin(this.time * 0.4) * 0.4, 0, 0));
        look = this.battleView.look;
      } else {
        ({ pos, look } = this.followCam());
        pos = this.safeCam(look, pos);
      }
      this.camera.position.lerp(pos, 1 - Math.exp(-(this.battleView ? 3 : 7) * dt));
      this.camera.lookAt(look);
    }
    if (this.shakeAmt > 0) {
      this.camera.position.add(V((Math.random() - 0.5) * this.shakeAmt, (Math.random() - 0.5) * this.shakeAmt, 0));
      this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.5);
    }

    // keep the shadow camera and sky centred on the action
    const focus = this.player ? this.player.position : V();
    this.sun.position.set(focus.x + 30, 50, focus.z + 20);
    this.sun.target.position.copy(focus);
    this.sky.position.copy(this.camera.position);

    if (this.player) this.updatePet(dt);
    this.updateAtmosphere(dt);

    this.onTick?.(dt);
    this.updateLabels();
    this.renderer.render(this.scene, this.camera);
  }
}
