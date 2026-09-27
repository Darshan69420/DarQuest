// Maps keyboard and thumb-stick input onto the horizontal world plane.
export function movementIntent(keys, touch, heading, camYawOffset) {
  const keyFwd = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const arrowFwd = (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0);
  const fwd = keyFwd + arrowFwd + touch.y;
  const strafe = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + touch.x;
  const turn = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
  const length = Math.hypot(strafe, fwd);
  const classicArrows = !!arrowFwd && !keyFwd && !strafe && !touch.y;
  if (!length) return { x: 0, z: 0, strength: 0, turn, classicArrows };
  const yaw = heading + (classicArrows ? 0 : camYawOffset);
  return {
    x: (Math.sin(yaw) * fwd + Math.cos(yaw) * strafe) / length,
    z: (Math.cos(yaw) * fwd - Math.sin(yaw) * strafe) / length,
    strength: Math.min(1, length), turn, classicArrows,
  };
}
