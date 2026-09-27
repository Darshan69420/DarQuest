// Four isolated chambers with visible thresholds; portals carry the player between them.
import * as THREE from 'three';
import { ARCHIVE_X, ARCHIVE_ROOMS } from './archive.js';
import { makeBookStand } from './models.js';

export function buildArchive(world) {
  const scene = world.scene;
  const stone = new THREE.MeshStandardMaterial({ color: 0x24233d, roughness: 0.95 });
  const wall = new THREE.MeshStandardMaterial({ color: 0x373352, roughness: 0.85 });
  const gold = new THREE.MeshStandardMaterial({ color: 0x9d81ba, emissive: 0x38224d, emissiveIntensity: 0.6 });
  const ink = new THREE.MeshStandardMaterial({ color: 0x172039, roughness: 0.8 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(190, 230), stone);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(ARCHIVE_X, -0.18, 54);
  scene.add(floor);
  ARCHIVE_ROOMS.forEach((room, i) => {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(12.2, 12.2, 0.35, 32), i === 3 ? ink : wall);
    disc.position.set(ARCHIVE_X, -0.12, room.z);
    disc.receiveShadow = true;
    scene.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(10, 0.11, 6, 48), gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(ARCHIVE_X, 0.09, room.z);
    scene.add(ring);
    for (let j = 0; j < 12; j++) {
      const a = j * Math.PI / 6;
      // Leave clear lines of sight to the entrance and exit.
      if (j === 0 || j === 6) continue;
      const x = ARCHIVE_X + 13.5 * Math.sin(a), z = room.z + 13.5 * Math.cos(a);
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4 + (i + j) % 3, 1.5), stone);
      shelf.position.set(x, shelf.geometry.parameters.height / 2, z);
      shelf.rotation.y = a;
      scene.add(shelf);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.12, 1.55), gold);
      trim.position.set(x, shelf.geometry.parameters.height - 0.3, z);
      trim.rotation.y = a;
      scene.add(trim);
    }
    for (const dx of [-6, 6]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 4, 8), wall);
      pillar.position.set(ARCHIVE_X + dx, 2, room.z + 8);
      scene.add(pillar);
      world.colliders.push({ x: ARCHIVE_X + dx, z: room.z + 8, r: 0.6 });
    }
    const lamp = new THREE.PointLight(i === 3 ? 0xff84d6 : 0x9e89ff, 28, 24);
    lamp.position.set(ARCHIVE_X, 6, room.z);
    scene.add(lamp);
  });
  // The second chamber's Folio is beside its door, within sight but outside the portal approach.
  world.add(makeBookStand(), ARCHIVE_X + 6, ARCHIVE_ROOMS[1].z + 4, -0.4, 1.1);
}
