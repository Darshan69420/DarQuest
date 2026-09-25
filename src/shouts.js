// Dragon shouts (Thu'um). Read a Word Wall to learn a shout's first word, then spend dragon
// souls to learn its second and third words. Shout with R; each word makes it stronger.
import { SCHOOLS } from './data.js';
import { sfx } from './audio.js';

export const SHOUTS = {
  force: {
    name: 'Unrelenting Force', icon: '💥', words: ['FUS', 'RO', 'DAH'], meaning: ['Force', 'Balance', 'Push'], color: 0xdff6ff,
    cooldown: [15, 18, 20],
    desc: (w, lvl) => `A cone of pure force: ${forceDmg(w, lvl)} damage, hurls foes back and interrupts their spells.`,
  },
  fire: {
    name: 'Fire Breath', icon: '🔥', words: ['YOL', 'TOOR', 'SHUL'], meaning: ['Fire', 'Inferno', 'Sun'], color: 0xff6a2b,
    cooldown: [20, 20, 20],
    desc: (w, lvl) => `Breathe fire in a cone: ${Math.round(fireDmg(w, lvl))} damage, then burning.`,
  },
  frost: {
    name: 'Frost Breath', icon: '❄️', words: ['FO', 'KRAH', 'DIIN'], meaning: ['Frost', 'Cold', 'Freeze'], color: 0x9fe6ff,
    cooldown: [20, 20, 20],
    desc: (w, lvl) => `Breathe frost in a cone: ${Math.round(fireDmg(w, lvl) * 0.8)} damage, and foes move and attack ${20 + w * 10}% slower for 6 seconds.`,
  },
  sprint: {
    name: 'Whirlwind Sprint', icon: '🌪️', words: ['WULD', 'NAH', 'KEST'], meaning: ['Whirlwind', 'Fury', 'Tempest'], color: 0xe8e4ff,
    cooldown: [6, 8, 10],
    desc: (w) => `Rush forward ${8 + w * 5} paces in the blink of an eye, untouchable while you move.`,
  },
  ethereal: {
    name: 'Become Ethereal', icon: '👻', words: ['FEIM', 'ZII', 'GRON'], meaning: ['Fade', 'Spirit', 'Bind'], color: 0xb0e8ff,
    cooldown: [30, 40, 50],
    desc: (w) => `Fade into a ghost for ${2 + w * 2} seconds: nothing can hurt you, but you cannot attack.`,
  },
  rend: {
    name: 'Dragonrend', icon: '🐉', words: ['JOOR', 'ZAH', 'FRUL'], meaning: ['Mortal', 'Finite', 'Temporary'], color: 0xffd23d,
    cooldown: [30, 30, 30],
    desc: (w) => `Force a flying dragon to land. Dragons hit take ${20 + w * 10}% more damage for ${5 + w * 5} seconds.`,
  },
};
for (const [id, s] of Object.entries(SHOUTS)) s.id = id;

const forceDmg = (w, lvl) => Math.round((60 + lvl * 12) * w);
const fireDmg = (w, lvl) => (120 + lvl * 20) * (0.6 + w * 0.4);

export function shoutWords(p, id) { return p.dragon?.shouts?.[id] || 0; }

export function learnWord(p, id) {
  const w = shoutWords(p, id);
  if (w >= 3) return 0;
  p.dragon.shouts[id] = w + 1;
  if (!p.dragon.equipped) p.dragon.equipped = id;
  return w + 1;
}

// Casts the equipped shout. `ctx` gives access to the world and combat. Returns true if it went off.
export function castShout(p, ctx) {
  const id = p.dragon?.equipped;
  const s = SHOUTS[id];
  const w = shoutWords(p, id);
  if (!s || !w) return false;
  const { world, combat } = ctx;
  const pp = world.player.position;
  const dir = world.heading;
  const words = s.words.slice(0, w).join(' ') + '!';
  world.float(world.player, words, 'shout');
  world.shake(0.25 + w * 0.12);
  sfx('shout');
  const inCone = (e, r, angle) => {
    const dx = e.model.position.x - pp.x, dz = e.model.position.z - pp.z;
    const d = Math.hypot(dx, dz);
    if (d > r) return false;
    let a = Math.atan2(dx, dz) - dir;
    a = ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    return d < 1.5 || Math.abs(a) < angle / 2;
  };
  const coneFx = (r, color, n = 40) => world.breathFx(pp.clone ? pp.clone() : pp, dir, r, 0.9, color, n);
  switch (id) {
    case 'force': {
      const r = 7 + w * 2.5;
      coneFx(r, s.color, 30 + w * 15);
      for (const e of combat.alive()) {
        if (!inCone(e, r, 1.3)) continue;
        combat.damageEnemy(e, forceDmg(w, p.level), 'arcane', s.color, false);
        combat.clearCast(e);
        if (!e.def.boss) world.knock(e, pp, 3 + w * 2.5);
        e.nextAttack = world.time + 1 + w * 0.5;
      }
      break;
    }
    case 'fire':
    case 'frost': {
      const r = 8 + w * 2;
      coneFx(r, s.color, 50 + w * 20);
      const school = id === 'fire' ? 'blaze' : 'frost';
      for (const e of combat.alive()) {
        if (!inCone(e, r, 1.0)) continue;
        const dmg = fireDmg(w, p.level) * (id === 'frost' ? 0.8 : 1);
        combat.damageEnemy(e, dmg, school, SCHOOLS[school].color, false);
        if (id === 'fire' && e.hp > 0) combat.addOverTime(e.mods.dots, dmg * 0.6, 3, 'blaze');
        if (id === 'frost') e.slowUntil = world.time + 6, e.slowAmt = 0.2 + w * 0.1;
      }
      break;
    }
    case 'sprint': {
      const dist = 8 + w * 5;
      const dx = Math.sin(dir), dz = Math.cos(dir);
      let x = pp.x, z = pp.z;
      for (let k = 0; k < dist * 4; k++) {
        const nx = x + dx * 0.25, nz = z + dz * 0.25;
        if (!world.walkable(nx, nz)) break;
        x = nx; z = nz;
      }
      for (let k = 0; k < 16; k++) world.particle(pp.clone().lerp({ x, y: 0.8, z }, k / 16).setY(0.8), s.color, { life: 0.6, size: 0.15 });
      world.player.position.set(x, 0, z);
      world.invulnUntil = Math.max(world.invulnUntil, world.time + 0.5);
      world.moveTarget = null;
      break;
    }
    case 'ethereal': {
      const dur = 2 + w * 2;
      world.invulnUntil = Math.max(world.invulnUntil, world.time + dur);
      combat.etherealUntil = world.time + dur;
      world.setGhost?.(true);
      setTimeout(() => world.setGhost?.(false), dur * 1000);
      world.aura(world.player, s.color);
      break;
    }
    case 'rend': {
      world.shockwave(pp, s.color, 18);
      for (const e of combat.alive()) {
        if (!e.def.dragon || Math.hypot(e.model.position.x - pp.x, e.model.position.z - pp.z) > 40) continue;
        e.rendUntil = world.time + 5 + w * 5;
        e.rendAmt = 0.2 + w * 0.1;
        if (e.fly) { e.fly.forced = true; combat.onMessage?.(`${e.def.name} is dragged out of the sky!`, 'boss'); }
        world.float(e.model, '🐉 Rended!', 'status');
      }
      break;
    }
  }
  return true;
}
