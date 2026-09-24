// A small north-up map in the corner. North (up) is toward the Academy (−Z).
import { ZONES, zoneAt, PORTALS, FOUNTAINS } from './data.js';

const VIEW = 55;   // world units from the centre to the edge

export class Minimap {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.world = world;
    this.ctx = canvas.getContext('2d');
    this.timer = 0;
  }

  update(dt, target) {
    this.timer += dt;
    if (this.timer < 0.1) return;
    this.timer = 0;
    this.draw(target);
  }

  draw(target) {
    const { ctx, canvas, world } = this;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = canvas.clientWidth;
    if (!size) return;
    if (canvas.width !== Math.round(size * dpr)) { canvas.width = canvas.height = Math.round(size * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const half = size / 2;
    const scale = half / VIEW;
    const p = world.player.position;
    const sx = (x) => half + (x - p.x) * scale;
    const sz = (z) => half + (z - p.z) * scale;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(half, half, half - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#1a1236';
    ctx.fillRect(0, 0, size, size);

    // walkable ground
    const zone = ZONES[zoneAt(p.x)];
    ctx.fillStyle = zoneAt(p.x) === 'emberfall' ? '#6b3a2a' : '#5d5578';
    for (const r of zone.regions) {
      ctx.beginPath();
      if (r.type === 'circle') ctx.arc(sx(r.x), sz(r.z), r.r * scale, 0, Math.PI * 2);
      else ctx.rect(sx(r.x0), sz(r.z0), (r.x1 - r.x0) * scale, (r.z1 - r.z0) * scale);
      ctx.fill();
    }

    const dot = (x, z, r, color, stroke) => {
      ctx.beginPath();
      ctx.arc(sx(x), sz(z), r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
    };

    for (const f of FOUNTAINS) dot(f.x, f.z, 4, '#6fd3ff');
    for (const pt of PORTALS) dot(pt.x, pt.z, 5, '#b46bff', '#fff');
    for (const e of world.enemies) {
      if (e.state === 'dead' || !e.model.visible) continue;
      const m = e.model.position;
      dot(m.x, m.z, e.def.boss ? 5 : 2.6, e.def.boss ? '#ff3df2' : '#ff5a6a');
    }
    for (const n of world.npcs) {
      const m = n.model.position;
      const marker = n.label.el.querySelector('.marker')?.textContent;
      dot(m.x, m.z, marker ? 4.5 : 3.2, marker ? '#f2c14e' : '#e8e4ff', marker ? '#fff' : null);
    }

    // player arrow
    const h = world.heading;
    const fx = Math.sin(h), fz = Math.cos(h);
    ctx.beginPath();
    ctx.moveTo(half + fx * 8, half + fz * 8);
    ctx.lineTo(half - fx * 5 + fz * 5, half - fz * 5 - fx * 5);
    ctx.lineTo(half - fx * 5 - fz * 5, half - fz * 5 + fx * 5);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();

    // quest target: star inside the map, or an arrow on the rim
    if (target) {
      const dx = target.x - p.x, dz = target.z - p.z;
      const d = Math.hypot(dx, dz);
      ctx.save();
      if (d * scale < half - 10) {
        this.star(sx(target.x), sz(target.z), 7);
      } else {
        const a = Math.atan2(dz, dx);
        const rx = half + Math.cos(a) * (half - 9), rz = half + Math.sin(a) * (half - 9);
        ctx.translate(rx, rz);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(8, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath();
        ctx.fillStyle = '#f2c14e';
        ctx.strokeStyle = '#3a2400';
        ctx.lineWidth = 1.5;
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(half, half, half - 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(242,193,78,.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  star(x, y, r) {
    const { ctx } = this;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = '#f2c14e';
    ctx.strokeStyle = '#3a2400';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
  }
}
