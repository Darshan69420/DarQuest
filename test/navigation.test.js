import test from 'node:test';
import assert from 'node:assert/strict';
import { clearSegment, groundPath, preferredInteraction } from '../src/navigation.js';

test('a click across the fountain finds a complete route that never crosses its collider', () => {
  const walkable = (x, z) => Math.hypot(x, z) >= 3.75 && Math.hypot(x, z) < 30;
  const start = { x: 0, z: 10 }, goal = { x: 0, z: -10 };
  const path = groundPath(start, goal, walkable);
  assert.ok(path.length > 1);
  assert.deepEqual(path.at(-1), goal);
  let previous = start;
  for (const point of path) { assert.ok(clearSegment(previous, point, walkable)); previous = point; }
  assert.ok(path.some(point => Math.abs(point.x) > 3.75));
});

test('navigation does not route through blocked targets or disconnected rooms', () => {
  assert.deepEqual(groundPath({ x: 0, z: 0 }, { x: 2, z: 0 }, (x, z) => Math.abs(x) < 1 && Math.abs(z) < 1), []);
  const rooms = (x, z) => Math.abs(z) < 2 && ((x > -2 && x < 2) || (x > 4 && x < 8));
  assert.deepEqual(groundPath({ x: 0, z: 0 }, { x: 6, z: 0 }, rooms), []);
});

test('interaction prefers someone in front over a closer fountain behind', () => {
  const objects = [{ id: 'fountain', x: 0, z: -1, r: 5 }, { id: 'orvyn', x: 0, z: 2, r: 3.2 }];
  assert.equal(preferredInteraction(objects, { x: 0, z: 0 }, 0).id, 'orvyn');
  assert.equal(preferredInteraction(objects, { x: 0, z: 0 }, Math.PI).id, 'fountain');
  assert.equal(preferredInteraction(objects, { x: 20, z: 20 }, 0), null);
});
