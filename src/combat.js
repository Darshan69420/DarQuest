// Real-time combat: enemy AI, player spells on a hotbar, dodging, damage and rewards.
import { SCHOOLS, SPELLS, OFFENSIVE, DIFFICULTIES, PETS, RULES, ENEMIES, spellCost, spellCooldown, BASIC_COOLDOWN } from './data.js';
import { basicSpell } from './state.js';
import { sfx } from './audio.js';
import { insideShape } from './world.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const mods = () => ({ blades: [], shields: [], traps: [], weak: [], dots: [], hots: [] });

const PLAYER_RANGE = 20;
const GLOBAL_COOLDOWN = 0.35;
const DODGE_COOLDOWN = 1.6;
const TICK = 1;          // damage / healing over time ticks once a second

export class Combat {
  constructor({ world, onKill, onPlayerDeath, onHurt, onCombatChange, onMessage }) {
    this.world = world;
    this.onKill = onKill;
    this.onPlayerDeath = onPlayerDeath;
    this.onHurt = onHurt;
    this.onCombatChange = onCombatChange;
    this.onMessage = onMessage;
    this.p = null;
    this.hero = mods();
    this.ready = {};        // spell id -> time it is ready again
    this.gcd = 0;
    this.dodgeReady = 0;
    this.potionReady = 0;
    this.target = null;
    this.inCombat = false;
    this.petTimer = 4;
    this.tickTimer = 0;
    this.combo = 0;
    this.lastBasic = -9;
    this.pending = [];       // area attacks waiting to go off (flying dragons)
    this.etherealUntil = 0;  // Become Ethereal: can't attack, can't be hurt
    this.runMods = null;     // boons from an Endless Rift run
    this.onRevive = null;    // () => 'phoenix' | 'secondwind' | null
    world.onTargetTap = (e) => this.setTarget(e);
  }

  setPlayer(p) {
    this.p = p;
    this.hero = mods();
    this.ready = {};
    for (const e of this.world.enemies) this.initEnemy(e);
  }

  get diff() { return DIFFICULTIES[this.p?.difficulty] || DIFFICULTIES.normal; }
  rm(k) { return this.runMods?.[k] || 0; }
  get now() { return this.world.time; }

  initEnemy(e) {
    e.maxHp = Math.round(e.def.hp * this.diff.hp);
    e.hp = e.maxHp;
    e.mods = mods();
    e.cd = {};
    e.cast = null;
    e.phasesDone = new Set();
    e.nextAttack = 0;
    e.fly = null;
    e.flyPending = null;
    e.stunUntil = e.rendUntil = e.slowUntil = 0;
    e.state = e.state === 'dead' ? 'dead' : 'idle';
    this.updateBar(e);
  }

  // ------------------------------------------------------------ targeting

  setTarget(e) {
    if (e && (e.state === 'dead' || !e.model.visible)) e = null;
    this.target = e;
    this.world.setTargetRing(e);
    for (const x of this.world.enemies) this.updateBar(x);
  }

  alive() { return this.world.enemies.filter(e => e.state !== 'dead' && e.model.visible); }

  nearest(maxDist = PLAYER_RANGE, preferAggro = true) {
    const pp = this.world.player.position;
    let best = null, bestScore = Infinity;
    for (const e of this.alive()) {
      const d = flat(e.model.position, pp);
      if (d > maxDist) continue;
      const score = d - (preferAggro && e.state === 'aggro' ? 8 : 0);
      if (score < bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  cycleTarget() {
    const pp = this.world.player.position;
    const list = this.alive().filter(e => flat(e.model.position, pp) < 30).sort((a, b) => flat(a.model.position, pp) - flat(b.model.position, pp));
    if (!list.length) return this.setTarget(null);
    const i = list.indexOf(this.target);
    this.setTarget(list[(i + 1) % list.length]);
  }

  // ------------------------------------------------------------ player actions

  // Slot 0 is the free basic attack; slots 1-4 are the spell bar.
  slotSpell(slot) {
    if (!this.p) return null;
    return slot === 0 ? basicSpell(this.p.school) : SPELLS[this.p.hotbar[slot - 1]] || null;
  }

  castSlot(slot) {
    const spell = this.slotSpell(slot);
    if (!spell || this.p.hp <= 0) return;
    const t = this.now;
    if (t < this.etherealUntil) return this.onMessage?.('You are ethereal and cannot attack');
    const basic = slot === 0;
    const cost = basic ? 0 : Math.round(spellCost(spell) * (1 + this.rm('cost')));
    if (t < this.gcd) return;
    if ((this.ready[spell.id] || 0) > t) return this.onMessage?.(`${spell.name} isn't ready yet`);
    if (this.p.mana < cost) return this.onMessage?.('Not enough mana!');
    let target = null;
    if (OFFENSIVE.has(spell.type)) {
      if (!this.target || this.target.state === 'dead' || flat(this.target.model.position, this.world.player.position) > PLAYER_RANGE + 6) this.setTarget(this.nearest());
      target = this.target;
      if (!target) return this.onMessage?.('No enemy in range');
      if (flat(target.model.position, this.world.player.position) > PLAYER_RANGE) return this.onMessage?.('Too far away!');
      this.faceTarget(target);
    }
    const haste = (this.p.stats?.pip || 0) / 100;
    this.ready[spell.id] = t + (basic ? BASIC_COOLDOWN : spellCooldown(spell)) * (1 - haste) * (1 + this.rm('cd'));
    this.gcd = t + GLOBAL_COOLDOWN;
    this.p.mana -= cost;
    this.world.castPose(this.world.player);
    sfx('cast', spell.school);
    // every third basic attack in a row is an empowered combo strike
    let power = 1;
    if (basic) {
      this.combo = t - this.lastBasic < BASIC_COOLDOWN + 1.5 ? this.combo + 1 : 1;
      this.lastBasic = t;
      if (this.combo >= 3) {
        power = 1.8;
        this.combo = 0;
        sfx('combo', spell.school);
        this.world.float(this.world.player, '✦ Combo!', 'status');
      }
    }
    this.playerSpell(spell, target, this.world.player, false, power);
  }

  faceTarget(e) {
    const pp = this.world.player.position, m = e.model.position;
    this.world.heading = Math.atan2(m.x - pp.x, m.z - pp.z);
    this.world.moveTarget = null;
  }

  dodge() {
    if (this.now < this.dodgeReady || !this.p || this.p.hp <= 0) return;
    if (this.world.dash()) {
      this.dodgeReady = this.now + DODGE_COOLDOWN;
      sfx('dodge');
      if (this.rm('nova')) {
        const pp = this.world.player.position;
        this.world.shockwave(pp, 0x9fe6ff, 5);
        this.world.groundBurst(pp.x, pp.z, 0x9fe6ff, 14, 5);
        for (const e of this.alive()) if (flat(e.model.position, pp) < 5) this.damageEnemy(e, (60 + this.p.level * 14) * (1 + this.rm('dmg')), 'frost', 0x9fe6ff);
      }
    }
  }

  drinkPotion() {
    const p = this.p;
    if (!p) return false;
    if (p.potions < 1) { this.onMessage?.('You have no potions. Madame Fizz sells them!'); return false; }
    if (p.hp >= p.maxHp) { this.onMessage?.('You are already at full health.'); return false; }
    if (this.now < this.potionReady) { this.onMessage?.('Potion is not ready yet'); return false; }
    p.potions--;
    this.potionReady = this.now + RULES.potionCooldown;
    this.healHero(p.maxHp * 0.5);
    this.world.aura(this.world.player, 0xff5fa2);
    sfx('drink');
    return true;
  }

  // Hotbar state for the UI: each slot's spell, cooldown left and whether it is affordable.
  hotbar() {
    const t = this.now;
    const slots = [];
    for (let i = 0; i < 5; i++) {
      const spell = this.slotSpell(i);
      if (!spell) { slots.push(null); continue; }
      const total = i === 0 ? BASIC_COOLDOWN : spellCooldown(spell);
      const left = Math.max(0, (this.ready[spell.id] || 0) - t, i === 0 ? 0 : this.gcd - t);
      slots.push({ spell, left, total, cost: i === 0 ? 0 : spellCost(spell), poor: i > 0 && this.p.mana < spellCost(spell) });
    }
    return {
      slots,
      dodge: { left: Math.max(0, this.dodgeReady - t), total: DODGE_COOLDOWN },
      combo: t - this.lastBasic < BASIC_COOLDOWN + 1.5 ? this.combo : 0,
      shout: { left: Math.max(0, (this.shoutReady || 0) - t), total: this.shoutTotal || 1 },
      potion: { left: Math.max(0, this.potionReady - t), total: RULES.potionCooldown, count: this.p?.potions || 0 },
    };
  }

  // ------------------------------------------------------------ spell effects

  // Resolves a spell cast by the player (or their pet) at an enemy target or on the player.
  playerSpell(spell, target, fromModel, isPet = false, power = 1) {
    const w = this.world;
    const school = SCHOOLS[spell.school];
    const color = school.color;
    const st = this.p.stats || {};
    const dmgBonus = (this.p.level - 1) * 0.02 + (st.dmg || 0) / 100;
    const critChance = 0.05 + (st.acc || 0) / 100 + this.rm('crit');
    const hitMult = () => {
      let m = (1 + dmgBonus) * power * (1 + this.rm('dmg') + this.rm('berserk') * (1 - this.p.hp / this.p.maxHp));
      if (!isPet) {
        for (const b of this.hero.blades) m *= 1 + b;
        for (const x of this.hero.weak) m *= 1 - x;
        this.hero.blades = [];
        this.hero.weak = [];
      }
      return m;
    };
    switch (spell.type) {
      case 'damage':
      case 'drain': {
        const big = spell.pips >= 4;
        const flight = big ? w.meteor(target.model, color, 0.8 + spell.pips * 0.12) : w.projectile(fromModel, target.model, color, (0.22 + spell.pips * 0.05) * (power > 1 ? 1.7 : 1));
        const cm = hitMult();
        flight.then(() => {
          if (target.state === 'dead') return;
          const hit = spell.target === 'all'
            ? this.alive().filter(e => flat(e.model.position, target.model.position) < 6)
            : [target];
          let total = 0;
          for (const e of hit) {
            const crit = Math.random() < critChance;
            let tm = 1;
            if (!isPet && this.runMods) {
              if (e.hp < e.maxHp * 0.3) tm += this.rm('execute');
              if (e.def.boss || e.def.elite) tm += this.rm('big');
            }
            const amount = rand(spell.min, spell.max) * cm * tm * (crit ? 1.5 : 1);
            total += this.damageEnemy(e, amount, spell.school, color, crit, !isPet && (crit || big || power > 1));
            if (!isPet && (crit || big)) w.hitStop(big ? 0.09 : 0.05);
            if (spell.dot && e.hp > 0) this.addOverTime(e.mods.dots, spell.dot.total * cm, spell.dot.rounds, spell.school);
            if (!isPet && this.runMods) this.riftOnHit(e, amount, spell, power);
          }
          sfx(big ? 'bighit' : 'hit');
          if (spell.type === 'drain' && total > 0) this.healHero(total * spell.heal);
          if (!isPet && this.rm('lifesteal') && total > 0) this.healHero(total * this.rm('lifesteal'));
        });
        break;
      }
      case 'dot': {
        const cm = hitMult();
        w.projectile(fromModel, target.model, color, 0.28).then(() => {
          if (target.state === 'dead') return;
          this.addOverTime(target.mods.dots, spell.total * cm, spell.rounds, spell.school);
          w.float(target.model, `${school.icon} burning`, 'status');
          this.aggro(target);
        });
        break;
      }
      case 'trap':
      case 'weakness':
        w.projectile(fromModel, target.model, spell.type === 'trap' ? color : 0x888899, 0.2).then(() => {
          if (target.state === 'dead') return;
          (spell.type === 'trap' ? target.mods.traps : target.mods.weak).push(spell.pct);
          w.float(target.model, spell.type === 'trap' ? `🎯 +${Math.round(spell.pct * 100)}%` : `🔻 −${Math.round(spell.pct * 100)}%`, 'status');
          this.aggro(target);
        });
        break;
      case 'heal':
        w.aura(w.player, 0x7dff9a);
        this.healHero(spell.amount);
        break;
      case 'hot':
        w.aura(w.player, 0x7dff9a);
        this.addOverTime(this.hero.hots, spell.total, spell.rounds);
        w.float(w.player, '🌿 Regrowth', 'status');
        sfx('buff', spell.school);
        break;
      case 'blade':
        w.aura(w.player, color);
        this.hero.blades.push(spell.pct);
        w.float(w.player, `⚔️ +${Math.round(spell.pct * 100)}%`, 'status');
        sfx('buff', spell.school);
        break;
      case 'shield':
        w.aura(w.player, 0x9fe6ff);
        this.hero.shields.push(spell.pct);
        w.float(w.player, `🛡️ −${Math.round(spell.pct * 100)}%`, 'status');
        sfx('buff', spell.school);
        break;
    }
    // bosses that hate a school fight back
    if (target && !isPet) {
      for (const r of target.def.reactions || []) {
        if (r.school === spell.school && target.state !== 'dead' && this.now > (target.reactReady || 0)) {
          target.reactReady = this.now + 6;
          setTimeout(() => {
            if (target.state === 'dead' || this.p.hp <= 0) return;
            this.onMessage?.(`${target.def.name}: "${r.say}"`, 'boss');
            sfx('boss');
            this.enemySpell(target, SPELLS[r.cast]);
          }, 600);
        }
      }
    }
  }

  // Extra effects from rift boons when one of your spells lands.
  riftOnHit(e, amount, spell, power) {
    const w = this.world;
    if (this.rm('chain') && Math.random() < this.rm('chain')) {
      const other = this.alive().find(o => o !== e && flat(o.model.position, e.model.position) < 9);
      if (other) w.projectile(e.model, other.model, 0xb46bff, 0.18, 30).then(() => this.damageEnemy(other, amount * 0.5, 'tempest', 0xb46bff));
    }
    if (this.rm('burn') && spell.pips <= 1 && e.hp > 0) this.addOverTime(e.mods.dots, amount * this.rm('burn'), 3, 'blaze');
    if (this.rm('comboMeteor') && power > 1) {
      const pos = e.model.position.clone();
      w.meteor(e.model, 0xffb040, 1.4).then(() => {
        for (const o of this.alive()) if (flat(o.model.position, pos) < 6) this.damageEnemy(o, amount * 1.5, 'arcane', 0xffb040);
      });
    }
  }

  // Damage from the world itself (traps, explosions), not from an enemy.
  envHit(amount, school = 'arcane') {
    const p = this.p, w = this.world;
    if (!p || p.hp <= 0) return;
    if (w.time < w.invulnUntil) { w.float(w.player, 'Dodged!', 'status'); return; }
    let m = 1 + this.rm('taken');
    for (const s of this.hero.shields) m *= 1 - s;
    this.hero.shields = [];
    m *= 1 - (p.stats?.resist || 0) / 200;
    const dealt = Math.max(1, Math.round(amount * m));
    p.hp = Math.max(0, p.hp - dealt);
    w.float(w.player, `-${dealt}`, 'dmg hurt');
    w.shake(0.25);
    this.onHurt?.();
    if (p.hp <= 0) this.heroDown();
  }

  addOverTime(list, total, rounds, school) {
    const ticks = rounds * 2;
    list.push({ per: total / ticks, left: ticks, school });
  }

  damageEnemy(e, amount, school, color, crit = false, knock = false) {
    if (e.state === 'dead') return 0;
    let m = (1 - (e.def.resist?.[school] || 0) + (e.def.boost?.[school] || 0)) * (e.def.takenMult || 1);
    for (const t of e.mods.traps) m *= 1 + t;
    for (const s of e.mods.shields) m *= 1 - s;
    e.mods.traps = [];
    e.mods.shields = [];
    if (e.rendUntil > this.now) m *= 1 + (e.rendAmt || 0.3);
    if (e.fly && !e.fly.forced) m *= 0.4;   // hard to hurt a dragon in the sky
    const dealt = Math.max(1, Math.round(amount * m));
    e.hp = Math.max(0, e.hp - dealt);
    this.world.float(e.model, crit ? `${dealt}!` : `${dealt}`, crit ? 'dmg crit' : 'dmg');
    this.world.hitReact(e.model);
    if (crit) sfx('crit');
    if (knock && !e.def.boss && e.def.speed > 0 && e.hp > dealt) this.world.knock(e, this.world.player.position, 1.4);
    this.aggro(e);
    if (e.hp <= 0) this.kill(e);
    else this.checkPhases(e);
    this.updateBar(e);
    return dealt;
  }

  healHero(amount) {
    const p = this.p;
    const boost = 1 + (p.stats?.heal || 0) / 100;
    const got = Math.round(Math.min(amount * boost, p.maxHp - p.hp));
    p.hp += got;
    if (got > 0) { this.world.float(this.world.player, `+${got}`, 'heal'); sfx('heal'); }
  }

  hitHero(amount, school, color, from) {
    const p = this.p, w = this.world;
    if (p.hp <= 0) return;
    if (w.time < w.invulnUntil) { w.float(w.player, 'Dodged!', 'status'); return; }
    let m = (1 + this.diff.dmg) * (from.def.dmgMult || 1) * (1 + this.rm('taken'));
    if (school === 'blaze' && p.buffs?.dragonward > 0) m *= 0.6;
    for (const b of from.mods.blades) m *= 1 + b;
    for (const x of from.mods.weak) m *= 1 - x;
    from.mods.blades = [];
    from.mods.weak = [];
    for (const s of this.hero.shields) m *= 1 - s;
    for (const tr of this.hero.traps) m *= 1 + tr;
    this.hero.shields = [];
    this.hero.traps = [];
    m *= 1 - (p.stats?.resist || 0) / 100;
    const dealt = Math.max(1, Math.round(amount * m));
    p.hp = Math.max(0, p.hp - dealt);
    w.float(w.player, `-${dealt}`, 'dmg hurt');
    w.hitReact(w.player);
    if (this.rm('thorns') && from.state !== 'dead') this.damageEnemy(from, dealt * this.rm('thorns'), 'verdant', 0x5fdc6a);
    if (from.def.drainHit) { from.hp = Math.min(from.maxHp, from.hp + dealt * from.def.drainHit); this.updateBar(from); }
    w.burst(w.chest(w.player), color, 10, 3);
    if (dealt > p.maxHp * 0.15) w.shake(0.3);
    this.onHurt?.();
    if (p.hp <= 0) this.heroDown();
  }

  heroDown() {
    // a Phoenix Feather or Second Wind saves you once per rift run
    const saved = this.onRevive?.();
    if (saved) {
      this.p.hp = Math.round(this.p.maxHp * (saved === 'phoenix' ? 0.5 : 0.4));
      this.world.invulnUntil = this.world.time + 2.5;
      this.world.aura(this.world.player, saved === 'phoenix' ? 0xff7a1a : 0xffffff);
      this.world.float(this.world.player, saved === 'phoenix' ? '🪶 Reborn!' : '🕊️ Second Wind!', 'status');
      sfx('levelup');
      return;
    }
    this.hero = mods();
    for (const e of this.world.enemies) if (e.state === 'aggro') { e.state = 'return'; this.clearCast(e); }
    this.setTarget(null);
    this.onPlayerDeath?.();
  }

  // Stops a wind-up, removing any warning it drew on the ground.
  clearCast(e) {
    e.cast?.tele?.forEach(h => h.cancel());
    e.cast = null;
  }

  kill(e) {
    e.state = 'dead';
    this.clearCast(e);
    if (e.fly) { e.fly = null; e.model.userData.setFlying?.(false); }
    e.mods = mods();
    e.respawnAt = this.now + (e.def.boss ? 60 : 20);
    this.world.defeat(e.model);
    this.updateBar(e);
    if (this.target === e) this.setTarget(this.alive().find(x => x.state === 'aggro') || null);
    this.onKill?.(e);
  }

  // ------------------------------------------------------------ enemy AI

  aggro(e) {
    if (e.state !== 'idle' && e.state !== 'return') return;
    e.state = 'aggro';
    e.nextAttack = Math.max(e.nextAttack, this.now + rand(0.3, 0.9));
    // friends nearby join in
    for (const o of this.world.enemies) {
      if (o !== e && o.state === 'idle' && flat(o.model.position, e.model.position) < 7) {
        o.state = 'aggro';
        o.nextAttack = this.now + rand(0.5, 1.5);
      }
    }
  }

  checkPhases(e) {
    for (const [i, ph] of (e.def.phases || []).entries()) {
      if (e.phasesDone.has(i) || e.hp > e.maxHp * ph.at) continue;
      e.phasesDone.add(i);
      this.onMessage?.(`${e.def.name}: "${ph.say}"`, 'boss');
      sfx('boss');
      this.world.shake(0.4);
      this.world.aura(e.model, SCHOOLS[e.def.school].color);
      if (ph.blade) e.mods.blades.push(ph.blade);
      if (ph.shield) e.mods.shields.push(ph.shield);
      if (ph.heal) { e.hp = Math.min(e.maxHp, e.hp + ph.heal); this.world.float(e.model, `+${ph.heal}`, 'heal'); }
      if (ph.pips) e.nextAttack = this.now + 0.5;
      if (ph.cast) setTimeout(() => { if (e.state === 'aggro') this.enemySpell(e, SPELLS[ph.cast]); }, 900);
      if (ph.fly) this.startFlight(e, ph.fly);
      if (ph.summon) {
        for (const id of ph.summon) {
          const a = Math.random() * Math.PI * 2;
          const add = this.world.addEnemy(ENEMIES[id], e.model.position.x + Math.cos(a) * 5, e.model.position.z + Math.sin(a) * 5, 3);
          this.initEnemy(add);
          add.state = 'aggro';
          add.nextAttack = this.now + 1.5;
          this.world.aura(add.model, 0xff6a2b);
        }
      }
    }
  }

  // ------------------------------------------------------------ flying dragons

  startFlight(e, cfg) {
    if (e.rendUntil > this.now) { e.flyPending = cfg; return; }
    this.clearCast(e);
    const m = e.model.position;
    e.fly = { t: 0, dur: cfg.dur, radius: cfg.radius, angle: Math.atan2(m.z - e.home.z, m.x - e.home.x), next: 2.4, forced: false };
    e.model.userData.setFlying?.(true);
    e.model.userData.roar?.();
    sfx('roar');
    this.world.shake(0.5);
    this.onMessage?.(`${e.def.name} takes to the sky! Use Dragonrend to bring her down.`, 'boss');
  }

  updateFlight(e, dt) {
    const f = e.fly, m = e.model.position, w = this.world;
    f.t += dt;
    if (f.forced && f.t < f.dur - 1.2) f.t = f.dur - 1.2;
    const up = Math.min(1, f.t / 1.5), down = Math.max(0, Math.min(1, (f.dur - f.t) / 1.2));
    f.angle += dt * 0.55;
    const tx = e.home.x + Math.cos(f.angle) * f.radius, tz = e.home.z + Math.sin(f.angle) * f.radius;
    const k = Math.min(1, dt * 1.4);
    const nx = m.x + (tx - m.x) * k, nz = m.z + (tz - m.z) * k;
    if (Math.abs(nx - m.x) + Math.abs(nz - m.z) > 0.001) e.model.rotation.y = Math.atan2(nx - m.x, nz - m.z);
    m.set(nx, 10 * Math.min(up, down), nz);
    e.moving = true;
    if (Math.random() < dt * 1.5) sfx('flap');
    if (f.t >= f.next && f.t < f.dur - 2 && !f.forced) {
      f.next = f.t + 1.8 / this.diff.speed;
      const a = e.def.aoe?.sky_fire || { shape: 'circle', r: 3.4, count: 4, spread: 7, dur: 1.4 };
      this.queueAoe(e, SPELLS.sky_fire, this.aoeShapes(e, a), a.dur / Math.sqrt(this.diff.speed));
      w.breathFx(this.mouthPos(e), Math.atan2(w.player.position.x - m.x, w.player.position.z - m.z), 6, 0.5, 0xff7a1a, 20);
    }
    if (f.t >= f.dur) {
      e.fly = null;
      m.y = 0;
      e.model.userData.setFlying?.(false);
      sfx('bighit');
      w.shake(0.7);
      w.groundBurst(m.x, m.z, 0xc8a878, 30, 6);
      const quake = e.def.aoe?.landing_quake;
      if (quake) this.queueAoe(e, SPELLS.landing_quake, [{ ...quake, x: m.x, z: m.z }], quake.dur);
      if (f.forced) { e.stunUntil = this.now + 3.5; w.float(e.model, '💫 Grounded!', 'status'); }
      e.nextAttack = this.now + 1.5;
    }
  }

  mouthPos(e) {
    const mouth = e.model.userData.mouth;
    if (!mouth) return e.model.position.clone().setY(e.model.position.y + 2);
    const v = e.model.position.clone();
    mouth.getWorldPosition(v);
    return v;
  }

  // An area attack that goes off after `dur` seconds, not tied to a wind-up.
  queueAoe(e, spell, shapes, dur) {
    for (const sp of shapes) this.world.telegraph({ ...sp, dur });
    this.pending.push({ at: this.now + dur, e, spell, shapes });
    sfx('warn');
  }

  chooseSpell(e) {
    const t = this.now;
    const smart = this.diff.smart;
    const spells = [...new Set(e.def.spells)].map(id => SPELLS[id]).filter(s => (e.cd[s.id] || 0) <= t);
    if (!spells.length) return null;
    const heals = spells.filter(s => s.type === 'heal' || s.type === 'hot');
    if (heals.length && e.hp < e.maxHp * (smart ? 0.5 : 0.35) && Math.random() < 0.75) return pick(heals);
    const buffs = spells.filter(s => ['blade', 'shield', 'trap', 'weakness'].includes(s.type));
    if (buffs.length && Math.random() < (smart ? 0.3 : 0.18)) return pick(buffs);
    const attacks = spells.filter(s => ['damage', 'drain', 'dot'].includes(s.type)).sort((a, b) => b.pips - a.pips);
    if (!attacks.length) return pick(spells);
    return smart || Math.random() < 0.55 ? attacks[0] : pick(attacks);
  }

  // Winds up an attack so the player can see it coming (and dodge).
  startAttack(e) {
    const spell = this.chooseSpell(e);
    const speed = this.diff.speed;
    e.nextAttack = this.now + e.def.attackRate / speed * rand(0.85, 1.15) * (e.slowUntil > this.now ? 1 + e.slowAmt : 1);
    if (!spell) return;
    e.cd[spell.id] = this.now + (1 + spell.pips * 2.4) / speed;
    // big area attacks are drawn on the ground first: step out of them!
    const aoe = e.def.aoe?.[spell.id];
    if (aoe) {
      const dur = (aoe.dur ?? 1.1) / Math.sqrt(speed);
      const shapes = this.aoeShapes(e, aoe);
      e.cast = { spell, t: 0, dur, aoe: shapes, tele: shapes.map(sp => this.world.telegraph({ ...sp, dur })) };
      sfx('warn');
      if (aoe.breath) { e.model.userData.roar?.(); sfx('roar'); }
      return;
    }
    const windup = (e.def.range > 3 ? 0.35 + spell.pips * 0.2 : 0.45) / Math.sqrt(speed);
    e.cast = { spell, t: 0, dur: windup };
    if (spell.pips >= 3) this.world.float(e.model, '⚠️', 'status');
  }

  // Where an area attack lands: on the player, around the caster, or a cone / line toward the player.
  aoeShapes(e, a) {
    const m = e.model.position, pp = this.world.player.position;
    const dir = Math.atan2(pp.x - m.x, pp.z - m.z);
    if (a.shape === 'cone' || a.shape === 'line') return [{ ...a, x: m.x, z: m.z, dir }];
    if (a.at === 'self') return [{ ...a, x: m.x, z: m.z }];
    const out = [];
    for (let i = 0; i < (a.count || 1); i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = i === 0 ? 0 : (a.spread || 4) * (0.45 + Math.random() * 0.55);
      out.push({ ...a, x: pp.x + Math.cos(ang) * r, z: pp.z + Math.sin(ang) * r });
    }
    return out;
  }

  resolveAoe(e, c) {
    const w = this.world, spell = c.spell;
    const color = SCHOOLS[spell.school].color;
    w.castPose(e.model);
    for (const sp of c.aoe) {
      if (sp.breath) {
        e.model.userData.breathe?.(0.9);
        w.breathFx(this.mouthPos(e), sp.dir, sp.r, sp.angle, color, 70);
      }
      if (sp.charge && e.state !== 'dead') w.dashEnemy(e, sp.dir, sp.len - 1);
      if (sp.breath) continue;
      if (sp.shape === 'line') {
        for (let d = 1; d <= sp.len; d += 3) w.groundBurst(sp.x + Math.sin(sp.dir) * d, sp.z + Math.cos(sp.dir) * d, color, 6, 4);
      } else if (sp.shape === 'cone') {
        for (let d = 2; d <= sp.r; d += 3) w.groundBurst(sp.x + Math.sin(sp.dir) * d, sp.z + Math.cos(sp.dir) * d, color, 8, 3 + d * 0.3);
      } else {
        w.groundBurst(sp.x, sp.z, color, 10 + sp.r * 4, 3 + sp.r);
        w.shockwave({ x: sp.x, z: sp.z }, color, sp.r);
      }
    }
    sfx(spell.pips >= 3 ? 'bighit' : 'hit');
    w.shake(0.2 + spell.pips * 0.05);
    if (this.p.hp <= 0) return;
    const pp = w.player.position;
    if (c.aoe.some(sp => insideShape(sp, pp.x, pp.z))) this.applyEnemyHit(e, spell, color);
    else if (c.aoe.some(sp => insideShape(sp, pp.x, pp.z, 4))) w.float(w.player, 'Avoided!', 'status');
  }

  enemySpell(e, spell) {
    const w = this.world;
    const color = SCHOOLS[spell.school].color;
    const pp = w.player.position;
    this.world.castPose(e.model);
    if (OFFENSIVE.has(spell.type)) {
      if (this.p.hp <= 0) return;
      const melee = e.def.range <= 3;
      if (melee) {
        if (flat(e.model.position, pp) > e.def.range + 1.4) { w.float(e.model, 'Miss', 'fizzle'); return; }
        this.applyEnemyHit(e, spell, color);
        return;
      }
      const flight = spell.pips >= 4 ? w.meteor(w.player, color, 0.7 + spell.pips * 0.1) : w.projectile(e.model, w.player, color, 0.22 + spell.pips * 0.05, 15);
      flight.then(() => { if (e.state !== 'dead') this.applyEnemyHit(e, spell, color); });
      return;
    }
    // support spells: heal the most hurt friend nearby, buff itself
    if (spell.type === 'heal' || spell.type === 'hot') {
      const friends = this.world.enemies.filter(o => o.state === 'aggro' && flat(o.model.position, e.model.position) < 12);
      const hurt = friends.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] || e;
      const amount = spell.type === 'heal' ? spell.amount : spell.total;
      hurt.hp = Math.min(hurt.maxHp, hurt.hp + amount);
      w.aura(hurt.model, 0x7dff9a);
      w.float(hurt.model, `+${amount}`, 'heal');
      this.updateBar(hurt);
    } else if (spell.type === 'blade') {
      e.mods.blades.push(spell.pct);
      w.aura(e.model, color);
      w.float(e.model, '⚔️', 'status');
    } else if (spell.type === 'shield') {
      e.mods.shields.push(spell.pct);
      w.aura(e.model, 0x9fe6ff);
      w.float(e.model, '🛡️', 'status');
    }
  }

  applyEnemyHit(e, spell, color) {
    const w = this.world;
    switch (spell.type) {
      case 'damage':
      case 'drain': {
        const before = this.p.hp;
        this.hitHero(rand(spell.min, spell.max), spell.school, color, e);
        const dealt = before - this.p.hp;
        if (spell.dot && dealt > 0) this.addOverTime(this.hero.dots, spell.dot.total * (1 + this.diff.dmg), spell.dot.rounds, spell.school);
        if (spell.type === 'drain' && dealt > 0) { e.hp = Math.min(e.maxHp, e.hp + dealt * spell.heal); this.updateBar(e); }
        sfx(spell.pips >= 4 ? 'bighit' : 'hit');
        break;
      }
      case 'dot':
        if (w.time < w.invulnUntil) { w.float(w.player, 'Dodged!', 'status'); return; }
        this.addOverTime(this.hero.dots, spell.total * (1 + this.diff.dmg), spell.rounds, spell.school);
        w.float(w.player, `${SCHOOLS[spell.school].icon} burning`, 'status');
        break;
      case 'trap':
        this.hero.traps.push(spell.pct);
        w.float(w.player, `🎯 +${Math.round(spell.pct * 100)}%`, 'status');
        break;
      case 'weakness':
        this.hero.weak.push(spell.pct);
        w.float(w.player, '🔻', 'status');
        break;
    }
  }

  // ------------------------------------------------------------ main loop

  update(dt) {
    const p = this.p, w = this.world;
    if (!p || !w.player) return;
    const t = this.now;
    const pp = w.player.position;
    const alivePlayer = p.hp > 0;

    // damage and healing over time
    this.tickTimer += dt;
    if (this.tickTimer >= TICK) {
      this.tickTimer -= TICK;
      this.tickHero();
      for (const e of w.enemies) if (e.state !== 'dead') this.tickEnemy(e);
    }

    // queued area attacks go off
    if (this.pending.length) {
      const due = this.pending.filter(q => t >= q.at);
      this.pending = this.pending.filter(q => t < q.at);
      for (const q of due) if (q.e.state !== 'dead') this.resolveAoe(q.e, { spell: q.spell, aoe: q.shapes });
    }

    let fighting = false, boss = false;
    const gone = [];
    for (const e of w.enemies) {
      if (e.hp === undefined) this.initEnemy(e);
      if (e.state === 'dead') {
        if (!e.noRespawn && t > e.respawnAt) { w.respawnEnemy(e); this.initEnemy(e); }
        else if (e.noRespawn && !e.def.rift && t > e.respawnAt - 15) gone.push(e);
        continue;
      }
      const d = flat(e.model.position, pp);
      if (e.state === 'idle' && d > 90) { e.moving = false; continue; }  // far away: asleep
      const speed = e.def.speed * this.diff.speed * (e.slowUntil > t ? 1 - e.slowAmt : 1);
      if (e.state === 'idle') {
        this.wander(e, dt);
        if (alivePlayer && d < e.def.aggro && t > w.invulnUntil) this.aggro(e);
      } else if (e.state === 'return') {
        const home = flat(e.model.position, e.home);
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.5 * dt);
        this.updateBar(e);
        if (home < 0.6 || speed <= 0) { e.state = 'idle'; e.hp = e.maxHp; e.mods = mods(); this.updateBar(e); }
        else w.moveEnemy(e, e.home, Math.max(speed, 2) * 2, dt);
      } else if (e.state === 'aggro') {
        fighting = true;
        if (e.def.boss) boss = true;
        const leash = e.def.boss ? 40 : 26;
        if (!alivePlayer || flat(e.model.position, e.home) > leash || d > 45) {
          e.state = 'return';
          this.clearCast(e);
          if (e.fly) { e.fly = null; e.model.position.y = 0; e.model.userData.setFlying?.(false); }
          continue;
        }
        if (e.fly) { this.updateFlight(e, dt); this.updateBar(e); continue; }
        if (e.stunUntil > t) { e.moving = false; this.updateBar(e); continue; }
        if (e.flyPending && !(e.rendUntil > t)) { const cfg = e.flyPending; e.flyPending = null; this.startFlight(e, cfg); continue; }
        const range = e.def.speed <= 0 ? Math.max(e.def.range, 26) : e.def.range;
        if (e.cast) {
          e.cast.t += dt;
          const locked = e.cast.aoe?.[0]?.dir;
          if (locked !== undefined) e.model.rotation.y = locked;
          else w.faceEnemy(e, pp);
          e.moving = false;
          if (e.cast.t >= e.cast.dur) {
            const c = e.cast;
            e.cast = null;
            if (c.aoe) this.resolveAoe(e, c);
            else this.enemySpell(e, c.spell);
          }
        } else if (d > range * 0.95) {
          w.moveEnemy(e, pp, speed * 1.8, dt, range * 0.8);
        } else {
          e.moving = false;
          w.faceEnemy(e, pp);
          if (t >= e.nextAttack) this.startAttack(e);
        }
      }
      this.updateBar(e);
    }

    for (const e of gone) w.removeEnemy(e);

    // pets join the fight
    if (fighting && alivePlayer && w.pet && PETS[p.activePet]) {
      this.petTimer -= dt;
      if (this.petTimer <= 0) {
        this.petTimer = rand(5, 7);
        const def = PETS[p.activePet];
        const spell = SPELLS[def.spell];
        const target = OFFENSIVE.has(spell.type) ? (this.target && this.target.state === 'aggro' ? this.target : w.enemies.find(e => e.state === 'aggro')) : null;
        if (!OFFENSIVE.has(spell.type) || target) {
          if (spell.type !== 'heal' || p.hp < p.maxHp * 0.9) {
            sfx('pet');
            this.playerSpell(spell, target, w.pet, true);
          }
        }
      }
    }

    // regenerate: slowly in a fight, quickly out of one
    p.mana = Math.min(p.maxMana, p.mana + (fighting ? 5 : 15) * dt * (1 + this.rm('mana')));
    if (!fighting && alivePlayer && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.02 * dt);
    if (fighting && alivePlayer && this.rm('regen')) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * this.rm('regen') * dt);

    if (this.target && (this.target.state === 'dead' || flat(this.target.model.position, pp) > 50)) this.setTarget(null);
    if (fighting !== this.inCombat || boss !== this.bossFight) {
      this.inCombat = fighting;
      this.bossFight = boss;
      this.onCombatChange?.(fighting, boss);
    }
  }

  tickHero() {
    const h = this.hero, p = this.p;
    if (p.hp <= 0) return;
    for (const d of h.dots) {
      d.left--;
      const dealt = Math.max(1, Math.round(d.per * (1 - (p.stats?.resist || 0) / 100)));
      p.hp = Math.max(0, p.hp - dealt);
      this.world.float(this.world.player, `-${dealt}`, 'dmg dot');
      if (p.hp <= 0) { this.heroDown(); return; }
    }
    for (const x of h.hots) { x.left--; this.healHero(x.per); }
    h.dots = h.dots.filter(d => d.left > 0);
    h.hots = h.hots.filter(d => d.left > 0);
  }

  tickEnemy(e) {
    for (const d of e.mods.dots) {
      d.left--;
      const dealt = Math.max(1, Math.round(d.per));
      e.hp = Math.max(0, e.hp - dealt);
      this.world.float(e.model, `${dealt}`, 'dmg dot');
      if (e.hp <= 0) { this.kill(e); return; }
    }
    e.mods.dots = e.mods.dots.filter(d => d.left > 0);
    this.checkPhases(e);
  }

  wander(e, dt) {
    if (e.wanderR <= 0 || e.def.speed <= 0) { e.moving = false; return; }
    if (!e.target) {
      e.moving = false;
      e.wait = (e.wait ?? 0) - dt;
      if (e.wait <= 0) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * e.wanderR;
        e.target = { x: e.home.x + Math.cos(a) * r, z: e.home.z + Math.sin(a) * r };
      }
      return;
    }
    const d = flat(e.model.position, e.target);
    if (d < 0.25 || !this.world.moveEnemy(e, e.target, e.def.speed, dt)) { e.target = null; e.wait = rand(1, 4); }
  }

  // Health and cast bars above an enemy's head.
  updateBar(e) {
    const el = e.label?.el;
    if (!el) return;
    if (!e.bars) e.bars = { hp: el.querySelector('.ehp .fill'), cast: el.querySelector('.ecast .fill'), castWrap: el.querySelector('.ecast') };
    const show = e.state !== 'dead' && (e.state === 'aggro' || e.hp < e.maxHp || this.target === e);
    el.classList.toggle('fighting', show);
    el.classList.toggle('targeted', this.target === e);
    if (e.bars.hp) e.bars.hp.style.width = `${(e.hp / e.maxHp) * 100}%`;
    if (e.bars.castWrap) {
      e.bars.castWrap.classList.toggle('show', !!e.cast);
      if (e.cast) e.bars.cast.style.width = `${Math.min(1, e.cast.t / e.cast.dur) * 100}%`;
    }
  }
}
