// Companions: wizards from other schools you can hire at the Starfall Inn. One travels with
// you at a time, follows you around and fights (or heals, or shields) in every battle.
import * as THREE from 'three';
import { SPELLS, SCHOOLS, OFFENSIVE } from './data.js';
import { makeWizard } from './models.js';

export const COMPANIONS = {
  aria:    { name: 'Aria Frostmere',   school: 'frost',   role: 'Guardian',  price: 400,  level: 4,  support: 'shield',    spells: ['frost_sprite', 'ice_golem', 'glacier_lance', 'absolute_zero'],                 desc: 'Wraps you in frost wards and chills your foes.',       look: { hair: 0xdff6ff, hatStyle: 'hood', eyeColor: 0x4dc8ff } },
  bram:    { name: 'Bram Thornwood',   school: 'verdant', role: 'Healer',    price: 600,  level: 6,  support: 'heal',      spells: ['seedling', 'thornling', 'bramble_titan', 'world_serpent'],                     desc: 'Heals you whenever you get hurt.',                   look: { hair: 0x6a4a2a, beard: true, eyeColor: 0x2e7d3b } },
  zephyra: { name: 'Zephyra Voltaire', school: 'tempest', role: 'Striker',   price: 800,  level: 8,  support: null,        spells: ['thunder_sprite', 'storm_shark', 'thunder_roc', 'ball_lightning', 'thunder_god'], desc: 'Hits like a lightning strike. Often.',               look: { hair: 0xf2f0ff, eyeColor: 0xb46bff, goggles: true } },
  morrow:  { name: 'Morrow Gloam',     school: 'umbral',  role: 'Leech',     price: 800,  level: 8,  support: 'drainheal', spells: ['shade_bite', 'ghoul_claw', 'soul_leech', 'lich_lord'],                  desc: 'Drains life from foes and shares it with you.',      look: { hair: 0x2a2030, hatStyle: 'hood', eyeColor: 0x9a8cff } },
  kindle:  { name: 'Kindle Ashbright', school: 'blaze',   role: 'Burner',    price: 1000, level: 10, support: null,        spells: ['ember_imp', 'kindle', 'fire_serpent', 'meteor_strike', 'dragonfire'],       desc: 'Sets everything on fire. Everything.',               look: { hair: 0xff7a2a, eyeColor: 0xff6a2b } },
  sol:     { name: 'Sol Starweaver',   school: 'arcane',  role: 'Tactician', price: 1200, level: 12, support: 'blade',     spells: ['arcane_bolt', 'sphinx_sands', 'scarab_swarm', 'astral_lance', 'constellation'], desc: 'Sharpens your spells and softens up your foes.',     look: { hair: 0xf2c14e, glasses: true, eyeColor: 0xf2c14e } },
};
for (const [id, c] of Object.entries(COMPANIONS)) c.id = id;

export class Companion {
  constructor({ world, combat, getPlayer, onMessage }) {
    this.world = world;
    this.combat = combat;
    this.getPlayer = getPlayer;
    this.onMessage = onMessage;
    this.model = null;
    this.id = null;
    this.label = null;
    this.timer = 2;
    this.supportTimer = 4;
  }

  spawn(id) {
    this.despawn();
    const def = COMPANIONS[id];
    if (!def) return;
    const sc = SCHOOLS[def.school];
    this.id = id;
    this.model = makeWizard({ robe: sc.color, hat: new THREE.Color(sc.color).multiplyScalar(0.5).getHex(), trim: 0xf2e6c9, gem: sc.color, ...def.look });
    this.model.scale.setScalar(0.92);
    this.model.userData.height = 3.2;
    const pp = this.world.player.position;
    this.model.position.set(pp.x - 1.5, 0, pp.z - 1);
    this.world.scene.add(this.model);
    this.label = this.world.addLabel(this.model, `<div class="name" style="color:${sc.css}">${sc.icon} ${def.name}</div><div class="sub">Companion · ${def.role}</div>`, 'npc companion', 3.2);
  }

  despawn() {
    if (!this.model) return;
    this.world.scene.remove(this.model);
    this.label.el.remove();
    this.world.labels = this.world.labels.filter(l => l !== this.label);
    this.model = null;
    this.id = null;
  }

  update(dt) {
    const m = this.model, w = this.world, p = this.getPlayer();
    if (!m || !p) return;
    // follow on your left, a little behind
    const h = w.heading, pp = w.player.position;
    const want = new THREE.Vector3(pp.x - Math.sin(h) * 1.8 - Math.cos(h) * 1.6, 0, pp.z - Math.cos(h) * 1.8 + Math.sin(h) * 1.6);
    const d = want.distanceTo(m.position);
    let moving = false;
    if (d > 25) m.position.copy(want);
    else if (d > 0.4) {
      m.position.lerp(want, Math.min(1, dt * 3.5));
      m.rotation.y = Math.atan2(want.x - m.position.x, want.z - m.position.z);
      moving = true;
    }
    m.position.y = pp.y;
    m.userData.anim(w.time, moving);
    // fight alongside you
    if (!this.combat.inCombat || p.hp <= 0 || p.companionMode === 'passive') return;
    const def = COMPANIONS[this.id];
    const level = Math.max(def.level, p.level);
    this.supportTimer -= dt;
    if (this.supportTimer <= 0 && def.support) {
      this.supportTimer = 10;
      if (def.support === 'heal' && p.hp < p.maxHp * 0.75) this.support('heal', level);
      else if (def.support === 'shield' && !this.combat.hero.shields.length) this.support('shield', level);
      else if (def.support === 'blade' && !this.combat.hero.blades.length) this.support('blade', level);
      else if (def.support === 'drainheal' && p.hp < p.maxHp * 0.9) this.support('heal', level * 0.6);
      else this.supportTimer = 2;
    }
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 3 + Math.random();
    const target = this.combat.target && this.combat.target.state === 'aggro' ? this.combat.target : w.enemies.find(e => e.state === 'aggro' && Math.hypot(e.model.position.x - pp.x, e.model.position.z - pp.z) < 22);
    if (!target) return;
    const options = def.spells.map(id => SPELLS[id]).filter(s => s.level <= level);
    const spell = options[Math.floor(Math.random() * options.length)];
    if (!spell || !OFFENSIVE.has(spell.type)) return;
    m.rotation.y = Math.atan2(target.model.position.x - m.position.x, target.model.position.z - m.position.z);
    w.castPose(m);
    this.combat.playerSpell(spell, target, m, true, 0.45 + level * 0.015);
  }

  support(kind, level) {
    const w = this.world, c = this.combat, p = this.getPlayer();
    w.castPose(this.model);
    if (kind === 'heal') { c.healHero(60 + level * 18); w.aura(w.player, 0x7dff9a); }
    if (kind === 'shield') { c.hero.shields.push(0.3); w.aura(w.player, 0x9fe6ff); w.float(w.player, '🛡️ Frost Ward', 'status'); }
    if (kind === 'blade') { c.hero.blades.push(0.25); w.aura(w.player, 0xf2c14e); w.float(w.player, '⚔️ Star Blade', 'status'); }
    return p;
  }
}
