// Bounded ground navigation. Checks whole edges so diagonal steps cannot cut corners.
export function clearSegment(a, b, walkable) {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.25));
  for (let i = 1; i <= steps; i++) {
    if (!walkable(a.x + (b.x - a.x) * i / steps, a.z + (b.z - a.z) * i / steps)) return false;
  }
  return true;
}

export function groundPath(start, goal, walkable) {
  if (!walkable(goal.x, goal.z)) return [];
  if (clearSegment(start, goal, walkable)) return [{ ...goal }];
  const cell = 0.8, key = (x, z) => `${x},${z}`;
  const initial = { x: start.x, z: start.z, ix: 0, iz: 0, g: 0, parent: null };
  initial.f = Math.hypot(goal.x - start.x, goal.z - start.z);
  const open = [initial], scores = new Map([[key(0, 0), 0]]);
  const closed = new Set();
  for (let count = 0; open.length && count < 5000; count++) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[best].f) best = i;
    const node = open.splice(best, 1)[0], id = key(node.ix, node.iz);
    if (closed.has(id)) continue;
    closed.add(id);
    if (Math.hypot(node.x - goal.x, node.z - goal.z) < cell * 2 && clearSegment(node, goal, walkable)) {
      const route = [{ ...goal }];
      for (let n = node; n.parent; n = n.parent) route.unshift({ x: n.x, z: n.z });
      // Remove redundant grid corners when there is an unobstructed shortcut.
      const smooth = []; let from = start;
      while (route.length) {
        let i = route.length - 1;
        while (i > 0 && !clearSegment(from, route[i], walkable)) i--;
        from = route[i]; smooth.push(from); route.splice(0, i + 1);
      }
      return smooth;
    }
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue;
      const ix = node.ix + dx, iz = node.iz + dz, id2 = key(ix, iz);
      const next = { x: start.x + ix * cell, z: start.z + iz * cell, ix, iz };
      if (closed.has(id2) || !clearSegment(node, next, walkable)) continue;
      const g = node.g + Math.hypot(dx, dz) * cell;
      if (g >= (scores.get(id2) ?? Infinity)) continue;
      scores.set(id2, g);
      open.push({ ...next, g, f: g + Math.hypot(next.x - goal.x, next.z - goal.z), parent: node });
    }
  }
  return [];
}

export function preferredInteraction(items, position, heading) {
  let best = null, score = Infinity;
  for (const item of items) {
    const dx = item.x - position.x, dz = item.z - position.z, distance = Math.hypot(dx, dz);
    if (distance >= item.r) continue;
    const facing = distance ? (dx * Math.sin(heading) + dz * Math.cos(heading)) / distance : 1;
    const candidate = distance + (facing < 0 ? 10 : 0) + (1 - facing) * 2;
    if (candidate < score) { score = candidate; best = item; }
  }
  return best;
}
