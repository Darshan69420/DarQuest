// Model gallery: preview every model in the game.
//   gallery.html                   all groups, drag to spin
//   gallery.html?group=foes1       one group lined up
//   gallery.html?model=knight      one model close up (&angle=0.6 to turn it, &t=1.5 to pose it)
import * as THREE from 'three';
import * as M from './models.js';
import { NPCS, SCHOOLS, PLAYABLE_SCHOOLS, PETS } from './data.js';

const params = new URLSearchParams(location.search);

const GROUPS = {
  heroes: {
    title: 'Heroes',
    items: PLAYABLE_SCHOOLS.map(id => ({
      id: 'hero_' + id, name: `${SCHOOLS[id].name} wizard`,
      build: () => M.makeWizard({ robe: SCHOOLS[id].color, hat: new THREE.Color(SCHOOLS[id].color).multiplyScalar(0.55).getHex(), trim: 0xf2e6c9, gem: SCHOOLS[id].color }),
    })),
  },
  npcs: {
    title: 'Townsfolk',
    items: Object.entries(NPCS).map(([id, def]) => ({ id: 'npc_' + id, name: def.name, build: () => M.makeWizard(def) })),
  },
  foes1: {
    title: 'Hollow Lane foes',
    items: [['sprig', 'Gloomsprig'], ['rat', 'Cinder Rat'], ['wisp', 'Frostbitten Wisp'], ['knight', 'Hollow Knight'], ['crow', 'Storm Crow'], ['boss', 'Lord Hollowmere']]
      .map(([id, name]) => ({ id, name, build: () => M.makeEnemy(id) })),
  },
  foes2: {
    title: 'Emberfall foes',
    items: [['imp', 'Lava Imp'], ['hound', 'Cinderhound'], ['shaman', 'Ashen Shaman'], ['golem', 'Obsidian Golem'], ['serpent', 'Magma Serpent'], ['guard', 'Magma Guard'], ['pyrrhon', 'Pyrrhon']]
      .map(([id, name]) => ({ id, name, build: () => M.makeEnemy(id) })),
  },
  dragons: {
    title: 'Dragonspire foes',
    items: [['wyrmling', 'Wyrmling'], ['drake_foe', 'Bone Drake'], ['cultist', 'Scaled Cultist'], ['wyvern', 'Stormwing Wyvern'], ['elder_dragon', 'Vorathrax']]
      .map(([id, name]) => ({ id, name, build: () => M.makeEnemy(id) })),
  },
  frost: {
    title: 'Glacierreach',
    items: [
      ...[['snow_wolf', 'Snowfang Wolf'], ['frost_wraith', 'Frost Wraith'], ['yeti', 'Mountain Yeti'], ['ice_golem', 'Rime Golem'], ['frost_drake', 'Frost Dragon'], ['frost_queen', 'Queen Sylvara']]
        .map(([id, name]) => ({ id, name, build: () => M.makeEnemy(id) })),
      { id: 'ice_tower', name: 'Ice tower', build: () => M.makeIceTower({ r: 1.4, h: 6 }) },
      { id: 'ice_throne', name: 'Ice throne', build: () => M.makeIceThrone() },
      { id: 'ice_crystal', name: 'Ice crystal', build: () => M.makeIceCrystal(1) },
    ],
  },
  storm: {
    title: 'Stormspire',
    items: [
      ...[['gale_sprite', 'Gale Sprite'], ['stormhorn', 'Stormhorn Stag'], ['skyraider', 'Skyraider'], ['tempest_golem', 'Tempest Golem'], ['thunder_roc', 'Thunder Roc'], ['voltaris', 'Voltaris']]
        .map(([id, name]) => ({ id, name, build: () => M.makeEnemy(id) })),
      { id: 'airship', name: 'Airship', build: () => { const a = M.makeAirship(); a.scale.setScalar(0.45); return a; } },
      { id: 'rod', name: 'Lightning rod', build: () => M.makeLightningRod() },
      { id: 'isle', name: 'Sky island', build: () => { const i = M.makeSkyIsland(3); i.position.y = 2; return i; } },
    ],
  },
  thorn: {
    title: 'Thornwood',
    items: [
      ...[['briar_stalker', 'Briar Stalker'], ['pixie', 'Pixie'], ['spore_shambler', 'Spore Shambler'], ['treant', 'Treant'], ['blight_horror', 'Blight Horror'], ['thornmother', 'Thornmother'], ['blight_pod', 'Blight Pod']]
        .map(([id, name]) => ({ id, name, build: () => M.makeEnemy(id) })),
      { id: 'roothouse', name: 'Root house', build: () => { const h = M.makeRootHouse(); h.scale.setScalar(0.5); return h; } },
      { id: 'thornbush', name: 'Thorn bush', build: () => M.makeThornBush(1) },
      { id: 'gianttree', name: 'Giant tree', build: () => M.makeGiantTree(0.12) },
    ],
  },
  deep: {
    title: 'The Hollow Deep',
    items: [
      ...[['sorrowshade', 'Sorrowshade'], ['deathless', 'Deathless Legionnaire'], ['bone_magus', 'Bone Magus'], ['bone_colossus', 'Bone Colossus'], ['pale_templar', 'Pale Templar'], ['soul_anchor', 'Soul Anchor'], ['malvoren', 'Malvoren']]
        .map(([id, name]) => ({ id, name, build: () => M.makeEnemy(id) })),
      { id: 'nightmare', name: 'Pale Nightmare', build: () => M.makeMount('nightmare') },
      { id: 'stalag', name: 'Stalagmites', build: () => M.makeStalagmites(0.6) },
      { id: 'spire', name: 'Pale Spire', build: () => { const sp = M.makePaleSpire(); sp.scale.setScalar(0.08); return sp; } },
    ],
  },
  skilling: {
    title: 'Skilling & Rift',
    items: [
      ['ore', 'Ore rock', () => M.makeOreRock(0xd4803a)], ['oak', 'Oak', () => M.makeOak(0.8)], ['willow', 'Willow', () => M.makeWillow(0.8)],
      ['elder', 'Elder tree', () => M.makeElder(0.8)], ['dragonwood', 'Dragonwood', () => M.makeDragonwood(0.8)], ['furnace', 'Furnace', () => M.makeFurnace()],
      ['anvil', 'Anvil', () => M.makeAnvil()], ['alchemy', 'Alchemy table', () => M.makeAlchemyTable()], ['chest', 'Rift chest', () => M.makeChest()],
      ['shrine', 'Boon shrine', () => M.makeShrine()], ['wordwall', 'Word Wall', () => M.makeWordWall()], ['nest', 'Dragon nest', () => M.makeNest()],
    ].map(([id, name, build]) => ({ id, name, build })),
  },
  pets: {
    title: 'Pets',
    items: Object.values(PETS).map(p => ({ id: 'pet_' + p.kind, name: p.name, build: () => M.makePet(p.kind, p.color) })),
  },
  props: {
    title: 'Academy & Hollow Lane',
    items: [
      ['tree', 'Pine', () => M.makeTree(0.8)], ['roundtree', 'Blossom tree', () => M.makeRoundTree(0.8)], ['deadtree', 'Spooky tree', () => M.makeDeadTree(0.8, true)],
      ['lamp', 'Lamp', () => M.makeLamp()], ['fountain', 'Wellspring', () => M.makeFountain()], ['house', 'House', () => M.makeHouse({ w: 7, d: 6, h: 5, wall: 0x8f7fa0, roof: 0x3b2340 })],
      ['stall', 'Potion stall', () => M.makeStall()], ['books', 'Book stand', () => M.makeBookStand()], ['grave', 'Grave', () => M.makeGrave()], ['rock', 'Rock', () => M.makeRock(0.8)],
    ].map(([id, name, build]) => ({ id, name, build })),
  },
  big: {
    title: 'Landmarks',
    items: [
      ['tower', 'Academy tower', () => M.makeTower({ r: 3.5, h: 14, roof: 0x2e7d6b })], ['gate', 'Lane gate', () => M.makeGate()], ['crypt', 'Crypt', () => M.makeCrypt()],
    ].map(([id, name, build]) => ({ id, name, build })),
  },
  ember: {
    title: 'Emberfall props',
    items: [
      ['portal', 'Spiral Door', () => M.makePortal(0xff7a3d)], ['tent', 'Tent', () => M.makeTent()], ['campfire', 'Campfire', () => M.makeCampfire()],
      ['lava', 'Lava pool', () => M.makeLavaPool(1.8)], ['spire', 'Obsidian spire', () => M.makeSpire(5)], ['firetree', 'Fire tree', () => M.makeFireTree(0.8)],
      ['cliff', 'Cliff', () => M.makeCliff(6, 9, 6)], ['throne', 'Molten throne', () => M.makeThrone()],
      ['vent', 'Lava vent', () => M.makeLavaVent()], ['pillar', 'Ruined pillar', () => M.makeRuinedPillar(4)], ['pillar2', 'Fallen pillar', () => M.makeRuinedPillar(3, true)],
    ].map(([id, name, build]) => ({ id, name, build })),
  },
};
const ALL = Object.values(GROUPS).flatMap(g => g.items);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const bg = params.get('bg') || '#2a1f4a';
scene.background = new THREE.Color(bg);
scene.add(new THREE.HemisphereLight(0xc4b5ff, 0x3a2f2a, 1.3));
const sun = new THREE.DirectionalLight(0xffd9b0, 2.2);
sun.position.set(12, 20, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 80 });
scene.add(sun);
const floor = new THREE.Mesh(new THREE.CircleGeometry(200, 64), new THREE.MeshStandardMaterial({ color: 0x3b3060, roughness: 1 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
const labels = document.getElementById('labels');

// Which models to show.
let items;
if (params.get('model')) items = ALL.filter(i => i.id === params.get('model'));
else if (params.get('group')) items = GROUPS[params.get('group')]?.items || [];
else items = ALL.filter(i => !i.id.startsWith('hero_') || i.id === 'hero_blaze');

const placed = [];
let x = 0;
const gapX = params.get('model') ? 0 : 1.2;
for (const item of items) {
  const obj = item.build();
  obj.userData.anim?.(0, false);
  const box = new THREE.Box3().setFromObject(obj);
  const w = box.max.x - box.min.x;
  obj.position.x = x - box.min.x;
  x += w + gapX;
  scene.add(obj);
  placed.push({ item, obj, h: box.max.y });
}
const totalW = x - gapX;
for (const p of placed) p.obj.position.x -= totalW / 2;

// frame the camera on everything
const all = new THREE.Box3();
for (const p of placed) all.expandByObject(p.obj);
const size = all.getSize(new THREE.Vector3()), center = all.getCenter(new THREE.Vector3());
const single = placed.length === 1;
const tilt = single ? 0.28 : 0.22;
function frame() {
  const aspect = window.innerWidth / window.innerHeight;
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const fitH = (size.y * 1.15) / (2 * Math.tan(vfov / 2));
  const fitW = (size.x * 1.1) / (2 * Math.tan(vfov / 2) * aspect);
  const dist = Math.max(fitH, fitW) + size.z * 0.6;
  camera.position.set(center.x, center.y + dist * Math.sin(tilt), center.z + dist * Math.cos(tilt));
  camera.lookAt(center.x, center.y * (single ? 0.95 : 0.9), center.z);
}

for (const p of placed) {
  const el = document.createElement('div');
  el.className = 'tag';
  el.textContent = p.item.name;
  labels.appendChild(el);
  p.el = el;
}

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  frame();
}
window.addEventListener('resize', resize);
resize();

let spin = parseFloat(params.get('angle') || '0');
let dragging = null;
window.addEventListener('pointerdown', (e) => { dragging = e.clientX; });
window.addEventListener('pointermove', (e) => { if (dragging != null) { spin += (e.clientX - dragging) * 0.01; dragging = e.clientX; } });
window.addEventListener('pointerup', () => { dragging = null; });

const fixedT = params.has('t') ? parseFloat(params.get('t')) : null;
const showLabels = params.get('labels') !== '0';
const clock = new THREE.Clock();
function loop() {
  const t = fixedT ?? clock.getElapsedTime();
  for (const p of placed) {
    p.obj.rotation.y = spin;
    p.obj.userData.anim?.(t, false);
    const v = new THREE.Vector3(p.obj.position.x, -0.25, p.obj.position.z).project(camera);
    p.el.style.display = showLabels ? '' : 'none';
    p.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * window.innerWidth}px, ${(-v.y * 0.5 + 0.5) * window.innerHeight}px) translate(-50%, 0)`;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();
window.galleryReady = true;
