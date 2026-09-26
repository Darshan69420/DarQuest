// Your Homestead: a floating island where you build anything you like, one block at a time
// (Minecraft style). Craft blocks at the workbench, furnace, anvil or alchemy table, press G
// to build, click to place, right-click to break. You can walk up onto blocks one step at a time.
import * as THREE from 'three';
import { ITEMS, addItem, removeItem, bagCount } from './items.js';
import { mat } from './models.js';

export const HOME_X = -2800;
export const BS = 1.5;              // block size in world units
const N = 26;                       // build grid is N × N blocks
const H = 14;                       // and this many blocks tall
const OX = HOME_X - (N * BS) / 2, OZ = -(N * BS) / 2;

// Which items are blocks, and how each one looks. solid: false means you can walk through it.
export const BLOCKS = {
  block_wood:    { color: 0xb8864a },
  block_log:     { color: 0x7a5230 },
  block_leaves:  { color: 0x4f9a4a },
  block_stone:   { color: 0x8a8494 },
  block_brick:   { color: 0xa04a3a },
  block_glass:   { color: 0xbfe8ff, glass: true },
  block_door:    { color: 0x6a4a2a, solid: false },
  block_lantern: { color: 0xffd27a, glow: 1.2 },
  block_moon:    { color: 0xd36fae },
  block_ember:   { color: 0xff6a2b, glow: 0.5 },
  block_gold:    { color: 0xf2c14e, glow: 0.2 },
  block_crystal: { color: 0x6fb8ff, glow: 0.9 },
  block_ice:     { color: 0xdff6ff, glass: true },
  block_dragon:  { color: 0xa0202a, glow: 0.15 },
};
export const BLOCK_IDS = Object.keys(BLOCKS);

export class Homestead {
  constructor({ world, getPlayer, hooks }) {
    this.world = world;
    this.getPlayer = getPlayer;
    this.hooks = hooks;
    this.grid = new Int8Array(N * N * H).fill(-1);
    this.meshes = {};
    this.building = false;
    this.selected = BLOCK_IDS[0];
    this.removeMode = false;
    this.ghost = null;
    this.target = null;
    this.feet = 0;       // the block level the player stands on
    world.homeWalk = (x, z) => this.walkable(x, z);
    world.homeHeight = () => this.feet * BS;
    this.buildMeshes();
  }

  idx(i, k, y) { return (y * N + k) * N + i; }
  inBounds(i, k, y) { return i >= 0 && k >= 0 && y >= 0 && i < N && k < N && y < H; }
  at(i, k, y) { return this.inBounds(i, k, y) ? this.grid[this.idx(i, k, y)] : -1; }
  solidAt(i, k, y) { const t = this.at(i, k, y); return t >= 0 && BLOCKS[BLOCK_IDS[t]].solid !== false; }
  cellOf(x, z) { return { i: Math.floor((x - OX) / BS), k: Math.floor((z - OZ) / BS) }; }
  center(i, k, y) { return new THREE.Vector3(OX + (i + 0.5) * BS, (y + 0.5) * BS, OZ + (k + 0.5) * BS); }

  // ---------------- save / load
  load(p) {
    this.grid.fill(-1);
    for (const [i, k, y, t] of p.home?.blocks || []) if (this.inBounds(i, k, y) && BLOCK_IDS[t]) this.grid[this.idx(i, k, y)] = t;
    this.refreshMeshes();
  }

  store() {
    const p = this.getPlayer();
    const blocks = [];
    for (let y = 0; y < H; y++) for (let k = 0; k < N; k++) for (let i = 0; i < N; i++) {
      const t = this.grid[this.idx(i, k, y)];
      if (t >= 0) blocks.push([i, k, y, t]);
    }
    p.home.blocks = blocks;
  }

  // ---------------- rendering: one instanced mesh per block type
  buildMeshes() {
    const geo = new THREE.BoxGeometry(BS, BS, BS);
    for (const id of BLOCK_IDS) {
      const b = BLOCKS[id];
      const material = b.glass
        ? new THREE.MeshStandardMaterial({ color: b.color, transparent: true, opacity: 0.45, roughness: 0.1 })
        : b.glow ? mat(b.color, { emissive: b.color, emissiveIntensity: b.glow }) : mat(b.color);
      const m = new THREE.InstancedMesh(geo, material, N * N * H);
      m.count = 0;
      m.castShadow = !b.glass;
      m.receiveShadow = true;
      m.frustumCulled = false;
      m.userData.blockId = id;
      this.world.scene.add(m);
      this.meshes[id] = m;
    }
    // a dark edge on every block so builds read clearly
    this.edges = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x1a1030, transparent: true, opacity: 0.35 }));
    this.world.scene.add(this.edges);
    const g = new THREE.Mesh(new THREE.BoxGeometry(BS * 1.02, BS * 1.02, BS * 1.02), new THREE.MeshBasicMaterial({ color: 0x9fffb0, transparent: true, opacity: 0.35, depthWrite: false }));
    g.visible = false;
    g.renderOrder = 3;
    this.world.scene.add(g);
    this.ghost = g;
  }

  refreshMeshes() {
    const mtx = new THREE.Matrix4();
    const counts = {};
    for (const id of BLOCK_IDS) counts[id] = 0;
    const edge = [];
    for (let y = 0; y < H; y++) for (let k = 0; k < N; k++) for (let i = 0; i < N; i++) {
      const t = this.grid[this.idx(i, k, y)];
      if (t < 0) continue;
      const id = BLOCK_IDS[t];
      const c = this.center(i, k, y);
      mtx.makeTranslation(c.x, c.y, c.z);
      this.meshes[id].setMatrixAt(counts[id]++, mtx);
      const h = BS / 2;
      for (const [a, b] of [[[-h, -h, -h], [h, -h, -h]], [[-h, h, -h], [h, h, -h]], [[-h, -h, h], [h, -h, h]], [[-h, h, h], [h, h, h]],
        [[-h, -h, -h], [-h, h, -h]], [[h, -h, -h], [h, h, -h]], [[-h, -h, h], [-h, h, h]], [[h, -h, h], [h, h, h]],
        [[-h, -h, -h], [-h, -h, h]], [[h, -h, -h], [h, -h, h]], [[-h, h, -h], [-h, h, h]], [[h, h, -h], [h, h, h]]]) {
        edge.push(c.x + a[0], c.y + a[1], c.z + a[2], c.x + b[0], c.y + b[1], c.z + b[2]);
      }
    }
    for (const id of BLOCK_IDS) {
      const m = this.meshes[id];
      m.count = counts[id]; m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.computeBoundingBox?.();
      m.userData.camSph = null; if (m.parent) m.parent.userData.camSph = null;   // the camera re-measures what it may bump into
    }
    this.edges.geometry.dispose();
    this.edges.geometry = new THREE.BufferGeometry();
    this.edges.geometry.setAttribute('position', new THREE.Float32BufferAttribute(edge, 3));
  }

  // ---------------- walking on blocks
  // The level you could stand at in a cell, starting from level `from` (step up at most 1).
  standLevel(i, k, from) {
    if (i < 0 || k < 0 || i >= N || k >= N) return from;
    for (let L = Math.min(H - 2, from + 1); L >= 0; L--) {
      const floor = L === 0 || this.solidAt(i, k, L - 1);
      if (floor && !this.solidAt(i, k, L) && !this.solidAt(i, k, L + 1)) return L;
      if (L <= from && (this.solidAt(i, k, L) || this.solidAt(i, k, L + 1))) return null;  // a wall in the way
    }
    return null;
  }

  walkable(x, z) {
    const { i, k } = this.cellOf(x, z);
    if (i < -3 || k < -3 || i > N + 2 || k > N + 2) return Math.hypot(x - HOME_X, z) < 30;
    return this.standLevel(i, k, this.feet) !== null && Math.hypot(x - HOME_X, z) < 30;
  }

  // ---------------- per-frame
  update(dt) {
    const w = this.world, p = w.player.position;
    const { i, k } = this.cellOf(p.x, p.z);
    const L = this.standLevel(i, k, this.feet);
    if (L !== null) this.feet = L;
    const want = this.feet * BS;
    p.y += (want - p.y) * Math.min(1, dt * 14);
    if (this.building) this.updateGhost();
    else this.ghost.visible = false;
  }

  // Finds where a click would place or break a block.
  pick(clientX, clientY) {
    const w = this.world;
    const ndc = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, w.camera);
    ray.far = 40;
    const hits = ray.intersectObjects(Object.values(this.meshes), false);
    if (hits.length) {
      const h = hits[0];
      const m = new THREE.Matrix4();
      h.object.getMatrixAt(h.instanceId, m);
      const c = new THREE.Vector3().setFromMatrixPosition(m);
      const hit = this.cellOf(c.x, c.z);
      const y = Math.round(c.y / BS - 0.5);
      const n = h.face.normal;
      return { remove: { i: hit.i, k: hit.k, y }, place: { i: hit.i + Math.round(n.x), k: hit.k + Math.round(n.z), y: y + Math.round(n.y) } };
    }
    const pt = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt)) return null;
    const c = this.cellOf(pt.x, pt.z);
    return { remove: null, place: { i: c.i, k: c.k, y: 0 } };
  }

  updateGhost() {
    const t = this.pick(this.world.mouse.x, this.world.mouse.y);
    this.target = t;
    const cell = t && (this.removeMode ? t.remove : t.place);
    if (!cell) { this.ghost.visible = false; return; }
    const ok = this.removeMode ? !!t.remove : this.canPlace(cell);
    this.ghost.visible = true;
    this.ghost.position.copy(this.center(cell.i, cell.k, cell.y));
    this.ghost.material.color.set(this.removeMode ? 0xff6a7a : ok ? 0x9fffb0 : 0xff6a7a);
    this.ghost.scale.setScalar(this.removeMode ? 1.06 : 1);
  }

  canPlace(c) {
    if (!this.inBounds(c.i, c.k, c.y) || this.at(c.i, c.k, c.y) >= 0) return false;
    if (bagCount(this.getPlayer(), this.selected) < 1) return false;
    const pp = this.world.player.position;
    const me = this.cellOf(pp.x, pp.z);
    if (BLOCKS[this.selected].solid !== false && me.i === c.i && me.k === c.k && (c.y === this.feet || c.y === this.feet + 1)) return false;
    return this.center(c.i, c.k, c.y).distanceTo(pp) < 16;
  }

  click(clientX, clientY, forceRemove = false) {
    if (!this.building) return false;
    const t = this.pick(clientX, clientY);
    if (!t) return true;
    const p = this.getPlayer();
    if (this.removeMode || forceRemove) {
      const c = t.remove;
      if (!c) return true;
      const id = BLOCK_IDS[this.at(c.i, c.k, c.y)];
      this.grid[this.idx(c.i, c.k, c.y)] = -1;
      addItem(p, id);
      this.world.puff(...this.center(c.i, c.k, c.y).toArray(), BLOCKS[id].color, 10, 3);
      this.hooks.sfx('break');
    } else {
      const c = t.place;
      if (!this.canPlace(c)) { this.hooks.sfx('fail'); if (bagCount(p, this.selected) < 1) this.hooks.message(`You have no ${ITEMS[this.selected].name}. Craft blocks at a workbench or furnace!`); return true; }
      removeItem(p, this.selected);
      this.grid[this.idx(c.i, c.k, c.y)] = BLOCK_IDS.indexOf(this.selected);
      this.hooks.sfx('place');
    }
    this.refreshMeshes();
    this.store();
    this.hooks.changed();
    return true;
  }

  blockCount() { let n = 0; for (const t of this.grid) if (t >= 0) n++; return n; }
}
