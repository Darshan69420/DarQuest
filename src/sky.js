// Day and night, and weather. A full day lasts 15 minutes. The sun and moon cross the sky,
// light and colours shift from noon blue to golden dusk to starry night, and each zone has
// its own weather: rain and thunderstorms, snow and blizzards, ashfall in the volcano.
import * as THREE from 'three';
import { ZONES } from './data.js';

const DAY = { fog: 0xa8c4e8, top: 0x2a6ad0, mid: 0x86b8f0, bottom: 0xf0e4cc, hemi: 0xffffff };
const NIGHT = { fog: 0x141a38, top: 0x02030c, mid: 0x0c1230, bottom: 0x2a2250, hemi: 0x6a7ab8 };
const KEYS = ['fog', 'top', 'mid', 'bottom', 'hemi'];

export const WEATHER_BY_ZONE = {
  academy: ['clear', 'clear', 'clear', 'cloudy', 'rain', 'storm'],
  emberfall: ['clear', 'ash', 'ash'],
  dragonspire: ['snow', 'snow', 'blizzard', 'clear'],
  glacier: ['snow', 'snow', 'blizzard', 'clear', 'snow'],
  homestead: ['clear', 'clear', 'cloudy', 'rain'],
  rift: ['clear'],
  arena: ['clear'],
  undercroft: ['clear'],
};
export const WEATHER_INFO = {
  clear: { icon: '', name: 'Clear' },
  cloudy: { icon: '☁️', name: 'Cloudy', dim: 0.18, fog: 0.8 },
  rain: { icon: '🌧️', name: 'Rain', dim: 0.3, fog: 0.65, rain: 1 },
  storm: { icon: '⛈️', name: 'Thunderstorm', dim: 0.45, fog: 0.55, rain: 1.6, lightning: true },
  snow: { icon: '🌨️', name: 'Snow', dim: 0.1, fog: 0.85, snow: 1 },
  blizzard: { icon: '❄️', name: 'Blizzard', dim: 0.3, fog: 0.4, snow: 2.4 },
  ash: { icon: '🌋', name: 'Ashfall', dim: 0.2, fog: 0.75, ash: 1 },
};

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const tmpA = new THREE.Color(), tmpB = new THREE.Color();

export class Sky {
  constructor(world) {
    this.world = world;
    this.time = 0.32;              // 0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk
    this.dayLength = 900;          // seconds for a full day
    this.weather = 'clear';
    this.weatherK = 0;             // how strong the current weather is (fades in and out)
    this.nextWeather = 90 + Math.random() * 120;
    this.flash = 0;
    this.nextFlash = 5;
    this.onThunder = null;
    const scene = world.scene;
    // the sun, drawn on the sky dome
    this.sunDisc = new THREE.Mesh(new THREE.SphereGeometry(13, 20, 12), new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false }));
    world.sky.add(this.sunDisc);
    this.moon = world.sky.children.find(c => c.isMesh);
    this.stars = world.sky.children.find(c => c.isPoints);
    if (this.stars) { this.stars.material.transparent = true; }
    // a warm glow around the player after dark
    this.lantern = new THREE.PointLight(0xffd8a0, 0, 16, 1.4);
    scene.add(this.lantern);
    // rain streaks, snowflakes and ash all live in boxes that follow the camera
    this.rain = this.makeRain(1400);
    this.snow = this.makeFlakes(1100, 0xffffff, 0.12);
    this.ash = this.makeFlakes(700, 0x4a4040, 0.1);
  }

  makeRain(n) {
    const pos = new Float32Array(n * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xa8c8f0, transparent: true, opacity: 0.55, fog: false }));
    lines.frustumCulled = false;
    lines.visible = false;
    this.world.scene.add(lines);
    const drops = Array.from({ length: n }, () => ({ x: (Math.random() - 0.5) * 60, y: Math.random() * 30, z: (Math.random() - 0.5) * 60, v: 22 + Math.random() * 8 }));
    return { lines, drops, pos };
  }

  makeFlakes(n, color, size) {
    const pos = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.9, fog: false }));
    pts.frustumCulled = false;
    pts.visible = false;
    this.world.scene.add(pts);
    const flakes = Array.from({ length: n }, () => ({ x: (Math.random() - 0.5) * 70, y: Math.random() * 25, z: (Math.random() - 0.5) * 70, v: 1.5 + Math.random() * 1.5, s: Math.random() * 10 }));
    return { pts, flakes, pos };
  }

  // 0 at day, 1 at deep night
  get nightK() { return smooth(-0.05, -0.35, this.sunHeight); }
  get dayK() { return smooth(0.02, 0.35, this.sunHeight); }
  get sunHeight() { return Math.sin((this.time - 0.25) * Math.PI * 2); }
  get isNight() { return this.nightK > 0.5; }

  clockText() {
    const mins = Math.floor(this.time * 24 * 60);
    const h = Math.floor(mins / 60), m = mins % 60;
    const icon = this.isNight ? '🌙' : this.dayK > 0.6 ? '☀️' : this.time < 0.5 ? '🌅' : '🌇';
    return `${icon} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  setWeather(w) { if (w !== this.weather) { this.weather = w; this.weatherK = 0; } }

  // The colours the scene should drift toward right now.
  target(zoneId) {
    const z = ZONES[zoneId].atmosphere;
    const out = {};
    const fixed = zoneId === 'rift' || zoneId === 'undercroft';
    const dk = fixed ? 0 : this.dayK, nk = fixed ? 0 : this.nightK, uk = 1 - dk - nk;
    for (const k of KEYS) {
      tmpA.set(z[k]);
      const c = tmpA.clone().multiplyScalar(uk);
      tmpB.set(DAY[k]).lerp(new THREE.Color(z[k]), 0.25).multiplyScalar(dk);
      c.add(tmpB);
      tmpB.set(NIGHT[k]).lerp(new THREE.Color(z[k]), 0.2).multiplyScalar(nk);
      c.add(tmpB);
      out[k] = c;
    }
    const wi = WEATHER_INFO[this.weather];
    const wk = this.weatherK;
    if (wi.dim) for (const k of KEYS) out[k].lerp(new THREE.Color(0x6a7080), wi.dim * wk * (k === 'hemi' ? 0.5 : 1));
    out.hemiI = ((z.hemiI ?? 1.3) * uk + 1.45 * dk + 0.55 * nk) * (1 - (wi.dim || 0) * wk * 0.5) + this.flash * 2;
    out.sunI = ((z.sunI ?? 2.2) * uk + 2.5 * dk + 0.65 * nk) * (1 - (wi.dim || 0) * wk);
    out.sunColor = new THREE.Color(0xffc890).multiplyScalar(uk).add(new THREE.Color(0xfff4e0).multiplyScalar(dk)).add(new THREE.Color(0x9ab0ff).multiplyScalar(nk));
    const fogK = 1 - (1 - (wi.fog || 1)) * wk;
    out.fogNear = (z.fogNear ?? 50) * fogK;
    out.fogFar = (z.fogFar ?? 170) * (0.55 + 0.45 * fogK) * (1 - nk * 0.25);
    return out;
  }

  update(dt, zoneId, camera, focus) {
    const w = this.world;
    this.time = (this.time + dt / this.dayLength) % 1;
    // weather changes every few minutes
    const choices = WEATHER_BY_ZONE[zoneId] || ['clear'];
    if (!choices.includes(this.weather)) this.setWeather(choices[0]);
    this.nextWeather -= dt;
    if (this.nextWeather <= 0) {
      this.nextWeather = 150 + Math.random() * 180;
      this.setWeather(choices[Math.floor(Math.random() * choices.length)]);
    }
    this.weatherK = Math.min(1, this.weatherK + dt / 8);
    const wi = WEATHER_INFO[this.weather];
    // lightning
    this.flash = Math.max(0, this.flash - dt * 4);
    if (wi.lightning && this.weatherK > 0.5) {
      this.nextFlash -= dt;
      if (this.nextFlash <= 0) { this.nextFlash = 6 + Math.random() * 14; this.flash = 1; setTimeout(() => this.onThunder?.(), 300 + Math.random() * 900); }
    }
    // sun and moon cross the sky
    const a = (this.time - 0.25) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(a) * 0.8, Math.sin(a), 0.35).normalize();
    const light = this.nightK > 0.5 ? dir.clone().negate() : dir;
    w.sun.position.set(focus.x + light.x * 50, Math.max(12, light.y * 60), focus.z + light.z * 50 + 10);
    this.sunDisc.position.copy(dir).multiplyScalar(290);
    this.sunDisc.visible = dir.y > -0.1 && zoneId !== 'rift' && zoneId !== 'undercroft';
    if (this.moon) { this.moon.position.copy(dir).multiplyScalar(-280); this.moon.visible = this.nightK > 0.02 || this.sunHeight < 0.2; }
    if (this.stars) this.stars.material.opacity = Math.min(1, this.nightK + (1 - this.dayK) * 0.25);
    // the player's lantern
    this.lantern.intensity = zoneId === 'rift' || zoneId === 'undercroft' ? 1.4 : this.nightK * 2.2;
    this.lantern.position.set(focus.x, 3, focus.z);
    // weather particles follow the camera
    const cam = camera.position;
    this.animRain(this.rain, dt, cam, (wi.rain || 0) * this.weatherK);
    this.animFlakes(this.snow, dt, cam, (wi.snow || 0) * this.weatherK, 1);
    this.animFlakes(this.ash, dt, cam, (wi.ash || 0) * this.weatherK, 0.5);
    return this.target(zoneId);
  }

  animRain(r, dt, cam, amount) {
    r.lines.visible = amount > 0.02;
    if (!r.lines.visible) return;
    const n = Math.floor(r.drops.length * Math.min(1, amount));
    const pos = r.pos;
    for (let i = 0; i < r.drops.length; i++) {
      const d = r.drops[i];
      d.y -= d.v * dt;
      if (d.y < 0) { d.y = 20 + Math.random() * 10; d.x = (Math.random() - 0.5) * 60; d.z = (Math.random() - 0.5) * 60; }
      const on = i < n;
      const x = cam.x + d.x, y = cam.y - 8 + d.y, z = cam.z + d.z;
      pos.set(on ? [x, y, z, x + 0.1, y + 0.7, z] : [0, -999, 0, 0, -999, 0], i * 6);
    }
    r.lines.geometry.attributes.position.needsUpdate = true;
  }

  animFlakes(f, dt, cam, amount, speed) {
    f.pts.visible = amount > 0.02;
    if (!f.pts.visible) return;
    const n = Math.floor(f.flakes.length * Math.min(1, amount));
    const t = this.world.time;
    for (let i = 0; i < f.flakes.length; i++) {
      const p = f.flakes[i];
      p.y -= p.v * speed * dt * (amount > 1.5 ? 2 : 1);
      p.x += (amount > 1.5 ? 6 : 0.4) * dt;
      if (p.y < 0) { p.y = 20 + Math.random() * 5; p.x = (Math.random() - 0.5) * 70; p.z = (Math.random() - 0.5) * 70; }
      if (p.x > 35) p.x -= 70;
      const on = i < n;
      f.pos.set(on ? [cam.x + p.x + Math.sin(t + p.s) * 0.5, cam.y - 8 + p.y, cam.z + p.z] : [0, -999, 0], i * 3);
    }
    f.pts.geometry.attributes.position.needsUpdate = true;
  }
}
