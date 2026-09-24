// Turn-based card duels in the style of a classic wizard MMO.
import { SCHOOLS, SPELLS, OFFENSIVE, RULES } from './data.js';
import { cardHTML, esc } from './ui.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => Math.round(a + Math.random() * (b - a));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

function newCombatant(base) {
  return { pips: [], blades: [], shields: [], traps: [], weak: [], dots: [], hots: [], ...base };
}

export class Battle {
  constructor({ world, player, enemies, onEnd }) {
    this.world = world;
    this.p = player;
    this.onEnd = onEnd;
    this.round = 0;
    this.over = false;

    this.hero = newCombatant({
      isPlayer: true, name: player.name, school: player.school, level: player.level,
      hp: player.hp, maxHp: player.maxHp, entity: { model: world.player },
      powerChance: 0.1 + player.level * 0.02, accBonus: player.level * 0.01, dmgBonus: (player.level - 1) * 0.02,
      resist: {}, boost: {},
    });
    this.foes = enemies.map((ent, i) => newCombatant({
      idx: i, name: ent.def.name, school: ent.def.school, level: ent.def.level,
      hp: ent.def.hp, maxHp: ent.def.hp, def: ent.def, entity: ent,
      powerChance: ent.def.powerPipChance ?? 0.15, accBonus: 0.05, dmgBonus: 0,
      resist: ent.def.resist || {}, boost: ent.def.boost || {},
    }));

    this.drawPile = shuffle([...player.deck]);
    this.used = [];
    this.hand = [];

    this.root = document.querySelector('#battle-ui');
    this.buildUI();
  }

  // ------------------------------------------------------------ helpers

  alive(list) { return list.filter(c => c.hp > 0); }
  opponents(c) { return c.isPlayer ? this.alive(this.foes) : [this.hero]; }

  pipValue(c, spell) {
    const pow = c.pips.filter(x => x === 'p').length;
    const norm = c.pips.length - pow;
    const doubles = !c.isPlayer || spell.school === c.school;
    return norm + pow * (doubles ? 2 : 1);
  }

  canCast(c, spell) { return this.pipValue(c, spell) >= spell.pips; }

  spendPips(c, spell) {
    let need = spell.pips;
    const doubles = !c.isPlayer || spell.school === c.school;
    const take = (kind) => { c.pips.splice(c.pips.indexOf(kind), 1); };
    if (doubles) while (need >= 2 && c.pips.includes('p')) { take('p'); need -= 2; }
    while (need > 0 && c.pips.includes('n')) { take('n'); need--; }
    while (need > 0 && c.pips.includes('p')) { take('p'); need -= doubles ? 2 : 1; }
  }

  givePip(c) {
    if (c.pips.length >= RULES.maxPips) return;
    c.pips.push(Math.random() < c.powerChance ? 'p' : 'n');
    c.pips.sort((a, b) => (a === 'p' ? 1 : 0) - (b === 'p' ? 1 : 0));
  }

  refillHand() {
    while (this.hand.length < RULES.handSize) {
      if (!this.drawPile.length) {
        if (!this.used.length) break;
        this.drawPile = shuffle(this.used);
        this.used = [];
      }
      this.hand.push(this.drawPile.pop());
    }
  }

  // ------------------------------------------------------------ main loop

  async run() {
    this.world.setupBattle(this.foes.map(f => f.entity));
    this.render();
    this.message('A duel begins!');
    await sleep(1100);

    while (!this.over) {
      this.round++;
      for (const c of [this.hero, ...this.alive(this.foes)]) this.givePip(c);
      this.refillHand();
      this.render();

      await this.tickOverTime();
      if (await this.checkEnd()) return;

      const action = await this.playerChoose();
      this.clearHand();
      if (action.type === 'flee') { await this.finish('flee'); return; }
      await this.playerAct(action);
      if (await this.checkEnd()) return;

      for (const foe of this.alive(this.foes)) {
        await this.enemyTurn(foe);
        if (await this.checkEnd()) return;
      }
    }
  }

  async tickOverTime() {
    for (const c of [this.hero, ...this.alive(this.foes)]) {
      let did = false;
      for (const d of c.dots) {
        if (c.hp <= 0) break;
        this.damage(c, d.per, SCHOOLS[d.school].color, true);
        d.rounds--;
        did = true;
      }
      c.dots = c.dots.filter(d => d.rounds > 0);
      for (const h of c.hots) {
        this.heal(c, h.per);
        h.rounds--;
        did = true;
      }
      c.hots = c.hots.filter(h => h.rounds > 0);
      if (did) { this.render(); await sleep(650); }
    }
  }

  async checkEnd() {
    if (this.over) return true;
    if (this.hero.hp <= 0) { await this.finish('lose'); return true; }
    if (!this.alive(this.foes).length) { await this.finish('win'); return true; }
    return false;
  }

  async finish(outcome) {
    this.over = true;
    this.clearHand();
    this.message(outcome === 'win' ? 'Victory!' : outcome === 'lose' ? 'You have been defeated…' : 'You fled the duel!', outcome);
    await sleep(outcome === 'flee' ? 700 : 1400);
    this.destroy();
    this.root.classList.add('hidden');
    this.root.innerHTML = '';
    this.p.hp = Math.max(0, Math.round(this.hero.hp));
    this.onEnd({ outcome, enemies: this.foes.map(f => ({ hp: f.hp, def: f.def, entity: f.entity })) });
  }

  // ------------------------------------------------------------ player turn

  playerChoose() {
    return new Promise(resolve => {
      this.resolveChoice = resolve;
      this.selected = null;
      this.renderHand();
      this.setControls(true);
      this.message(`Round ${this.round}: choose a spell`, 'hint');
    });
  }

  choose(action) {
    if (!this.resolveChoice) return;
    const r = this.resolveChoice;
    this.resolveChoice = null;
    this.selected = null;
    this.setTargeting(false);
    this.setControls(false);
    r(action);
  }

  onCardClick(handIdx) {
    if (!this.resolveChoice) return;
    const spell = SPELLS[this.hand[handIdx]];
    if (!this.canCast(this.hero, spell)) { this.message('Not enough pips for that spell.', 'warn'); return; }
    const needsTarget = OFFENSIVE.has(spell.type) && spell.target !== 'all';
    const targets = this.alive(this.foes);
    if (needsTarget && targets.length > 1) {
      this.selected = handIdx;
      this.renderHand();
      this.setTargeting(true);
      this.message(`Choose a target for ${spell.name}`, 'hint');
      return;
    }
    this.choose({ type: 'cast', handIdx, target: needsTarget ? targets[0] : null });
  }

  onTargetClick(foeIdx) {
    if (this.selected == null || !this.resolveChoice) return;
    const foe = this.foes[foeIdx];
    if (foe.hp <= 0) return;
    this.choose({ type: 'cast', handIdx: this.selected, target: foe });
  }

  discard(handIdx) {
    if (!this.resolveChoice) return;
    this.used.push(this.hand.splice(handIdx, 1)[0]);
    if (this.selected != null) { this.selected = null; this.setTargeting(false); }
    this.renderHand();
  }

  async playerAct(action) {
    if (action.type === 'pass') { this.message(`${this.hero.name} passes.`); await sleep(600); return; }
    if (action.type === 'potion') {
      this.p.potions--;
      this.message(`${this.hero.name} drinks a Healing Potion!`);
      this.world.aura(this.world.player, 0xff5fa2);
      this.heal(this.hero, Math.round(this.hero.maxHp * 0.5));
      this.render();
      await sleep(900);
      return;
    }
    const id = this.hand.splice(action.handIdx, 1)[0];
    this.used.push(id);
    await this.cast(this.hero, SPELLS[id], action.target);
  }

  // ------------------------------------------------------------ enemy turn

  chooseEnemySpell(e) {
    const spells = e.def.spells.map(id => SPELLS[id]);
    const castable = spells.filter(s => this.canCast(e, s));
    if (!castable.length) return null;
    const heals = castable.filter(s => s.type === 'heal' || s.type === 'hot');
    if (heals.length && e.hp < e.maxHp * 0.35 && Math.random() < 0.7) return pick(heals);
    const buffs = castable.filter(s => ['blade', 'shield', 'trap', 'weakness'].includes(s.type));
    if (buffs.length && Math.random() < 0.22) {
      const b = pick(buffs);
      const stack = b.type === 'blade' ? e.blades : b.type === 'shield' ? e.shields : b.type === 'trap' ? this.hero.traps : this.hero.weak;
      if (stack.length < 2) return b;
    }
    const attacks = castable.filter(s => ['damage', 'drain', 'dot'].includes(s.type)).sort((a, b) => b.pips - a.pips);
    if (!attacks.length) return null;
    const maxCost = Math.max(...spells.filter(s => s.type !== 'heal').map(s => s.pips));
    if (attacks[0].pips < maxCost && Math.random() < 0.3) return null; // save up for something bigger
    return Math.random() < 0.6 ? attacks[0] : pick(attacks);
  }

  async enemyTurn(e) {
    if (e.def.boss && !e.enraged && e.hp < e.maxHp * 0.5) {
      e.enraged = true;
      this.message(`${e.name}: "The Hollow cannot be defeated!"`, 'boss');
      this.world.aura(e.entity.model, 0xc542ff);
      e.blades.push(0.35);
      this.givePip(e); this.givePip(e);
      this.render();
      await sleep(1500);
    }
    const spell = this.chooseEnemySpell(e);
    if (!spell) {
      this.message(`${e.name} is gathering power…`);
      await sleep(700);
      return;
    }
    await this.cast(e, spell, OFFENSIVE.has(spell.type) ? this.hero : null);
  }

  // ------------------------------------------------------------ spell resolution

  casterMultiplier(c, school) {
    let m = 1 + c.dmgBonus;
    for (const b of c.blades) m *= 1 + b;
    for (const w of c.weak) m *= 1 - w;
    c.blades = []; c.weak = [];
    return m;
  }

  targetMultiplier(t, school, consumeShields = true) {
    let m = 1 - (t.resist[school] || 0) + (t.boost[school] || 0);
    for (const tr of t.traps) m *= 1 + tr;
    t.traps = [];
    if (consumeShields) {
      for (const s of t.shields) m *= 1 - s;
      t.shields = [];
    }
    return m;
  }

  damage(t, amount, color, isDot = false) {
    amount = Math.max(0, Math.round(amount));
    t.hp = Math.max(0, t.hp - amount);
    this.world.float(t.entity.model, `-${amount}`, isDot ? 'dmg dot' : 'dmg');
    if (!isDot) this.world.hitReact(t.entity.model);
    else this.world.burst(this.world.chest(t.entity.model), color, 8, 2);
    if (t.hp <= 0 && !t.isPlayer) this.world.defeat(t.entity.model);
    return amount;
  }

  heal(t, amount) {
    amount = Math.round(Math.min(amount, t.maxHp - t.hp));
    t.hp += amount;
    if (amount > 0) this.world.float(t.entity.model, `+${amount}`, 'heal');
    return amount;
  }

  async cast(c, spell, target) {
    const school = SCHOOLS[spell.school];
    const color = school.color;
    const model = c.entity.model;
    this.spendPips(c, spell);
    this.render();
    this.showCastCard(spell, c);
    this.message(`${c.name} casts ${spell.name}!`);
    this.world.castPose(model);
    await sleep(750);

    const acc = Math.min(1, school.acc + c.accBonus);
    if (Math.random() > acc) {
      this.world.fizzle(model);
      this.world.float(model, 'Fizzle!', 'fizzle');
      this.message(`${c.name}'s ${spell.name} fizzled!`, 'warn');
      this.render();
      await sleep(900);
      return;
    }

    switch (spell.type) {
      case 'damage':
      case 'drain': {
        const targets = spell.target === 'all' ? this.opponents(c) : [target];
        const cm = this.casterMultiplier(c, spell.school);
        const big = spell.pips >= 4;
        await Promise.all(targets.map((t, i) => sleep(i * 120).then(() =>
          big ? this.world.meteor(t.entity.model, color, 0.8 + spell.pips * 0.12) : this.world.projectile(model, t.entity.model, color, 0.25 + spell.pips * 0.06))));
        let total = 0;
        for (const t of targets) {
          const dealt = this.damage(t, rand(spell.min, spell.max) * cm * this.targetMultiplier(t, spell.school), color);
          total += dealt;
          if (spell.dot && t.hp > 0) t.dots.push({ per: Math.round((spell.dot.total * cm) / spell.dot.rounds), rounds: spell.dot.rounds, school: spell.school });
        }
        if (spell.type === 'drain' && total > 0) {
          await sleep(250);
          this.world.aura(model, color);
          this.heal(c, total * spell.heal);
        }
        break;
      }
      case 'dot': {
        const cm = this.casterMultiplier(c, spell.school);
        const tm = this.targetMultiplier(target, spell.school, false);
        await this.world.projectile(model, target.entity.model, color, 0.3);
        target.dots.push({ per: Math.round((spell.total * cm * tm) / spell.rounds), rounds: spell.rounds, school: spell.school });
        this.world.float(target.entity.model, `${school.icon} ${spell.rounds} rounds`, 'status');
        break;
      }
      case 'heal':
        this.world.aura(model, 0x7dff9a);
        this.heal(c, spell.amount);
        break;
      case 'hot':
        this.world.aura(model, 0x7dff9a);
        c.hots.push({ per: Math.round(spell.total / spell.rounds), rounds: spell.rounds });
        this.world.float(model, '🌿 Regrowth', 'status');
        break;
      case 'blade':
        this.world.aura(model, color);
        c.blades.push(spell.pct);
        this.world.float(model, `⚔️ +${Math.round(spell.pct * 100)}%`, 'status');
        break;
      case 'shield':
        this.world.aura(model, 0x9fe6ff);
        c.shields.push(spell.pct);
        this.world.float(model, `🛡️ −${Math.round(spell.pct * 100)}%`, 'status');
        break;
      case 'trap':
        await this.world.projectile(model, target.entity.model, color, 0.2);
        target.traps.push(spell.pct);
        this.world.float(target.entity.model, `🎯 +${Math.round(spell.pct * 100)}%`, 'status');
        break;
      case 'weakness':
        await this.world.projectile(model, target.entity.model, 0x888899, 0.2);
        target.weak.push(spell.pct);
        this.world.float(target.entity.model, `🔻 −${Math.round(spell.pct * 100)}%`, 'status');
        break;
    }
    this.render();
    await sleep(800);
  }

  // ------------------------------------------------------------ UI

  buildUI() {
    this.root.innerHTML = `
      <div class="b-foes"></div>
      <div class="b-msg"></div>
      <div class="b-cast"></div>
      <div class="b-bottom">
        <div class="b-hero"></div>
        <div class="b-hand"></div>
        <div class="b-actions">
          <button class="btn" data-act="pass">Pass</button>
          <button class="btn" data-act="potion">🧪 Potion</button>
          <button class="btn danger" data-act="flee">Flee</button>
        </div>
      </div>`;
    this.root.classList.remove('hidden');
    this.root.querySelector('[data-act="pass"]').addEventListener('click', () => this.choose({ type: 'pass' }));
    this.root.querySelector('[data-act="potion"]').addEventListener('click', () => {
      if (this.p.potions < 1) return this.message('You have no potions left!', 'warn');
      if (this.hero.hp >= this.hero.maxHp) return this.message('You are already at full health.', 'warn');
      this.choose({ type: 'potion' });
    });
    this.root.querySelector('[data-act="flee"]').addEventListener('click', () => {
      if (this.foes.some(f => f.def.boss)) return this.message('You cannot flee from a boss!', 'warn');
      this.choose({ type: 'flee' });
    });
    this.keyHandler = (e) => {
      if (!this.resolveChoice) return;
      if (e.code === 'Escape' && this.selected != null) { this.selected = null; this.setTargeting(false); this.renderHand(); this.message('Choose a spell', 'hint'); }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= this.hand.length) this.onCardClick(n - 1);
      if (e.code === 'KeyP') this.choose({ type: 'pass' });
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  pipsHTML(c) {
    return `<div class="pips">${c.pips.map(x => `<span class="pip ${x === 'p' ? 'power' : ''}"></span>`).join('')}</div>`;
  }

  charmsHTML(c) {
    const out = [];
    for (const b of c.blades) out.push(`<span title="Blade: +${Math.round(b * 100)}% next hit">⚔️</span>`);
    for (const s of c.shields) out.push(`<span title="Shield: −${Math.round(s * 100)}% next hit taken">🛡️</span>`);
    for (const t of c.traps) out.push(`<span title="Trap: +${Math.round(t * 100)}% next hit taken">🎯</span>`);
    for (const w of c.weak) out.push(`<span title="Weakness: −${Math.round(w * 100)}% next hit">🔻</span>`);
    for (const d of c.dots) out.push(`<span title="${d.per} damage for ${d.rounds} more rounds">${SCHOOLS[d.school].icon}${d.rounds}</span>`);
    for (const h of c.hots) out.push(`<span title="Healing ${h.per} for ${h.rounds} more rounds">💚${h.rounds}</span>`);
    return `<div class="charms">${out.join('')}</div>`;
  }

  panelHTML(c) {
    const s = SCHOOLS[c.school];
    return `<div class="b-name"><span style="color:${s.css}">${s.icon}</span> ${esc(c.name)} <small>Lv ${c.level}</small></div>
      <div class="bar hp"><div class="fill" style="width:${(c.hp / c.maxHp) * 100}%"></div><span>${Math.ceil(c.hp)} / ${c.maxHp}</span></div>
      ${this.pipsHTML(c)}${this.charmsHTML(c)}`;
  }

  render() {
    const foesEl = this.root.querySelector('.b-foes');
    if (!foesEl) return;
    foesEl.innerHTML = this.foes.map((f, i) =>
      `<div class="b-panel foe ${f.hp <= 0 ? 'dead' : ''} ${f.def.boss ? 'boss' : ''}" data-foe="${i}">${this.panelHTML(f)}</div>`).join('');
    foesEl.querySelectorAll('[data-foe]').forEach(el => el.addEventListener('click', () => this.onTargetClick(+el.dataset.foe)));
    if (this.selected != null) this.setTargeting(true);
    this.root.querySelector('.b-hero').innerHTML = `<div class="b-panel hero">${this.panelHTML(this.hero)}<div class="b-potions">🧪 ${this.p.potions}</div></div>`;
  }

  renderHand() {
    const el = this.root.querySelector('.b-hand');
    if (!el) return;
    el.innerHTML = this.hand.map((id, i) => {
      const s = SPELLS[id];
      const ok = this.canCast(this.hero, s);
      const cls = `${ok ? '' : 'disabled'} ${this.selected === i ? 'selected' : ''} playable`;
      const off = i - (this.hand.length - 1) / 2;
      return `<div class="hand-slot" style="--i:${i};--r:${off * 3}deg;--y:${Math.abs(off) * 4}px">${cardHTML(s, { cls, extra: `<button class="discard" title="Discard" data-discard="${i}">✕</button><div class="card-key">${i + 1}</div>` })}</div>`;
    }).join('');
    el.querySelectorAll('.hand-slot').forEach((slot, i) => {
      const card = slot.querySelector('.card');
      card.addEventListener('click', (e) => { if (!e.target.closest('.discard')) this.onCardClick(i); });
      card.addEventListener('contextmenu', (e) => { e.preventDefault(); this.discard(i); });
    });
    el.querySelectorAll('[data-discard]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); this.discard(+b.dataset.discard); }));
  }

  clearHand() {
    const el = this.root.querySelector('.b-hand');
    if (el) el.innerHTML = '';
  }

  setControls(on) {
    this.root.querySelectorAll('.b-actions .btn').forEach(b => { b.disabled = !on; });
  }

  setTargeting(on) {
    this.root.querySelectorAll('.b-panel.foe').forEach(el => el.classList.toggle('targetable', on && !el.classList.contains('dead')));
  }

  message(text, cls = '') {
    const el = this.root.querySelector('.b-msg');
    if (!el) return;
    el.className = 'b-msg ' + cls;
    el.textContent = text;
  }

  showCastCard(spell, c) {
    const el = this.root.querySelector('.b-cast');
    if (!el) return;
    el.innerHTML = `<div class="cast-wrap ${c.isPlayer ? 'mine' : 'theirs'}">${cardHTML(spell)}</div>`;
    clearTimeout(this.castTimer);
    this.castTimer = setTimeout(() => { el.innerHTML = ''; }, 1300);
  }

  destroy() {
    window.removeEventListener('keydown', this.keyHandler);
  }
}
