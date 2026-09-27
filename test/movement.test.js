import test from 'node:test';
import assert from 'node:assert/strict';
import { movementIntent } from '../src/movement.js';

const intent = (keys, touch = { x: 0, y: 0 }, heading = 0, cameraOffset = 0) =>
  movementIntent(keys, touch, heading, cameraOffset);

test('WASD and thumb stick move relative to the camera with normalized diagonals', () => {
  const forward = intent({ KeyW: true }, undefined, 0, Math.PI / 2);
  assert.ok(forward.x > 0.99);
  assert.ok(Math.abs(forward.z) < 0.01);
  const diagonal = intent({ KeyW: true, KeyD: true });
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z) - 1) < 0.001);
  const analog = intent({}, { x: 0, y: 0.5 });
  assert.equal(analog.strength, 0.5);
  assert.equal(analog.z, 1);
});

test('classic arrow movement follows heading and backward dodge intent reverses direction', () => {
  const arrow = intent({ ArrowUp: true }, undefined, Math.PI / 2, Math.PI / 2);
  assert.ok(arrow.x > 0.99);
  assert.equal(arrow.classicArrows, true);
  const back = intent({ KeyS: true });
  assert.equal(back.z, -1);
  const strafe = intent({ KeyA: true });
  assert.equal(strafe.x, -1);
});
