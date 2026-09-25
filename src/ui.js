// DOM user interface: HUD, dialogue, modals, spell cards and toasts.
import { SCHOOLS, SPELLS, describe, RULES, SHOP, GEAR, SLOTS, STAT_NAMES, PETS, GEAR_SHOP, DIFFICULTIES, spellCost, spellCooldown, BASIC_COOLDOWN } from './data.js';
import { xpToNext, equip, unequip, sellItem, givePet, setActivePet, basicSpell } from './state.js';
import { settings, setSetting, resetSettings, ACTIONS, keyFor, keyLabel, bindKey, resetKeys, QUALITY } from './settings.js';
import { RARITIES, RARITY_ORDER, LEGENDARY, itemName, itemColor, itemStats, itemValue, compareText, makeItem } from './gear.js';
import { TALENTS, freePoints, talentPoints, spentPoints, branchSpent, canLearn, respecCost } from './talents.js';

const $ = (sel) => document.querySelector(sel);

// Hooks other windows register, so ui.js doesn't need to import them.
export const uiHooks = {};

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ------------------------------------------------------------ cards

// A spell tile: mana cost in the corner, cooldown at the bottom.
export function cardHTML(spell, { extra = '', cls = '', basic = false } = {}) {
  const school = SCHOOLS[spell.school];
  const cost = basic ? 0 : spellCost(spell);
  const cd = basic ? BASIC_COOLDOWN : spellCooldown(spell);
  return `<div class="card school-${spell.school} ${cls}" style="--sc:${school.css}" data-spell="${spell.id}">
    <div class="card-pips" title="Mana cost">${cost}</div>
    <div class="card-icon">${school.icon}</div>
    <div class="card-name">${esc(spell.name)}</div>
    <div class="card-desc">${esc(describe(spell))}</div>
    <div class="card-acc">${basic ? 'Basic · ' : ''}${cd.toFixed(1)}s</div>
    ${extra}
  </div>`;
}

// ------------------------------------------------------------ HUD

export function showHUD(show) { $('#hud').classList.toggle('hidden', !show); }

export function updateHUD(p) {
  const school = SCHOOLS[p.school];
  $('#hud-name').textContent = p.name;
  $('#hud-school').innerHTML = `${school.icon} ${school.name} · Level ${p.level}`;
  $('#hud-school').style.color = school.css;
  $('#hud-hp-fill').style.width = `${(p.hp / p.maxHp) * 100}%`;
  $('#hud-hp-text').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
  $('#hud-mp-fill').style.width = `${(p.mana / p.maxMana) * 100}%`;
  $('#hud-mp-text').textContent = `${Math.floor(p.mana)} / ${p.maxMana}`;
  const need = xpToNext(p.level);
  $('#hud-xp-fill').style.width = `${(p.xp / need) * 100}%`;
  $('#hud-xp-text').textContent = `XP ${p.xp} / ${need}`;
  $('#hud-gold').textContent = p.gold;
  $('#hud-potions').textContent = `${p.potions}/${RULES.maxPotions}`;
  $('#hud-tp').textContent = p.tp;
  $('#hud-tp-wrap').classList.toggle('glow', p.tp > 0);
}

export function updateQuest(info) {
  $('#quest-title').textContent = info.title;
  $('#quest-goal').textContent = info.goal;
}

export function setPrompt(text) {
  const el = $('#prompt');
  el.textContent = text || '';
  el.classList.toggle('hidden', !text);
}

// ------------------------------------------------------------ toasts

export function toast(text, cls = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + cls;
  el.innerHTML = text;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3200);
}

// ------------------------------------------------------------ dialogue

let dialogOpen = false;
export function isDialogOpen() { return dialogOpen || !$('#modal').classList.contains('hidden'); }

// buttons: [{label, action?, primary?}] — the dialog closes after any button.
export function dialog(speaker, title, text, buttons = [{ label: 'Goodbye' }]) {
  const el = $('#dialog');
  el.innerHTML = `<div class="dlg-speaker">${esc(speaker)}<span>${esc(title || '')}</span></div>
    <div class="dlg-text"></div>
    <div class="dlg-buttons">${buttons.map((b, i) => `<button class="btn ${b.primary ? 'primary' : ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div>`;
  el.classList.remove('hidden');
  dialogOpen = true;
  typewriter(el.querySelector('.dlg-text'), text);
  el.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    closeDialog();
    buttons[+btn.dataset.i].action?.();
  }));
  el.querySelector('button.primary, button')?.focus();
}

export function closeDialog() {
  $('#dialog').classList.add('hidden');
  dialogOpen = false;
}

function typewriter(el, text) {
  let i = 0;
  el.textContent = '';
  const tick = () => {
    if (!el.isConnected) return;
    i = Math.min(text.length, i + 2);
    el.textContent = text.slice(0, i);
    if (i < text.length) requestAnimationFrame(tick);
  };
  tick();
  el.addEventListener('click', () => { i = text.length; el.textContent = text; }, { once: true });
}

// ------------------------------------------------------------ modals

let modalOnClose = null;
export function openModal(title, bodyHTML, onMount, onClose) {
  const el = $('#modal');
  if (modalOnClose) { const f = modalOnClose; modalOnClose = null; f(); }
  modalOnClose = onClose || null;
  el.innerHTML = `<div class="modal-box">
    <div class="modal-head"><h2>${title}</h2><button class="btn close" aria-label="Close">✕</button></div>
    <div class="modal-body">${bodyHTML}</div></div>`;
  el.classList.remove('hidden');
  el.querySelector('.close').addEventListener('click', closeModal);
  el.onclick = (e) => { if (e.target === el) closeModal(); };
  onMount?.(el.querySelector('.modal-body'));
}

export function closeModal() {
  $('#modal').classList.add('hidden');
  $('#modal').innerHTML = '';
  if (modalOnClose) { const f = modalOnClose; modalOnClose = null; f(); }
}

// Spell tutor: spend training points on new spells.
export function openTutor(p, onChange) {
  const render = (body) => {
    const list = Object.values(SPELLS)
      .filter(s => !s.enemy && !s.pet && (s.school === p.school || s.school === 'astral'))
      .sort((a, b) => a.level - b.level || a.pips - b.pips);
    body.innerHTML = `<p class="modal-note">Training Points: <b>${p.tp}</b> · Earn 1 every level. New spells go into an empty slot on your spell bar (press B to change it).</p>
      <div class="card-grid">${list.map(s => {
        const known = p.known.includes(s.id);
        const locked = p.level < s.level;
        let action;
        if (known) action = '<div class="card-tag ok">Learned</div>';
        else if (locked) action = `<div class="card-tag lock">Level ${s.level}</div>`;
        else action = `<button class="btn small primary" data-learn="${s.id}" ${p.tp < 1 ? 'disabled' : ''}>Learn · 1 TP</button>`;
        return `<div class="card-slot">${cardHTML(s, { cls: locked ? 'locked' : '' })}${action}</div>`;
      }).join('')}</div>`;
    body.querySelectorAll('[data-learn]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.learn;
      if (p.tp < 1 || p.known.includes(id)) return;
      p.tp--;
      p.known.push(id);
      const empty = p.hotbar.indexOf(null);
      if (empty >= 0) p.hotbar[empty] = id;
      toast(`You learned <b>${esc(SPELLS[id].name)}</b>!`, 'good');
      onChange();
      render(body);
    }));
  };
  openModal('📚 Spell Tutor', '', render);
}

// Spellbook: choose which four spells sit on keys 2-5.
export function openSpellbook(p, onChange) {
  let slot = Math.max(0, p.hotbar.indexOf(null));
  const render = (body) => {
    const basic = basicSpell(p.school);
    const known = p.known.filter(id => id !== basic.id).map(id => SPELLS[id]).sort((a, b) => a.level - b.level);
    body.innerHTML = `${p.dragon?.voice ? '<div class="tabs"><button class="btn small primary">📖 Spells</button><button class="btn small" id="to-shouts">🐉 Shouts</button></div>' : ''}
      <p class="modal-note">Pick a slot, then click a spell to put it there. Key <b>1</b> is always your free basic attack, <b>${esc(basic.name)}</b>.</p>
      <div class="loadout">
        <div class="load-slot basic"><span class="load-key">1</span>${cardHTML(basic, { basic: true })}</div>
        ${p.hotbar.map((id, i) => `<button class="load-slot ${i === slot ? 'picked' : ''}" data-slot="${i}"><span class="load-key">${i + 2}</span>
          ${id ? cardHTML(SPELLS[id]) : '<div class="card empty"><div class="card-name">Empty</div></div>'}</button>`).join('')}
      </div>
      <h3 class="sub-h">Known spells</h3>
      <div class="card-grid">${known.map(s => {
        const on = p.hotbar.indexOf(s.id);
        return `<button class="card-slot pickable" data-spell="${s.id}">${cardHTML(s, { cls: on >= 0 ? 'equipped' : '' })}
          <div class="card-tag ${on >= 0 ? 'ok' : ''}">${on >= 0 ? `On key ${on + 2}` : `Put on key ${slot + 2}`}</div></button>`;
      }).join('') || '<p class="modal-note">Learn more spells from Mirabel Quill at the Academy.</p>'}</div>`;
    body.querySelector('#to-shouts')?.addEventListener('click', () => uiHooks.openShouts?.());
    body.querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => { slot = +b.dataset.slot; render(body); }));
    body.querySelectorAll('.pickable').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.spell;
      const was = p.hotbar.indexOf(id);
      if (was >= 0) p.hotbar[was] = p.hotbar[slot] === id ? null : p.hotbar[slot];
      p.hotbar[slot] = was === slot ? null : id;
      slot = (slot + 1) % RULES.hotbarSlots;
      onChange();
      render(body);
    }));
  };
  openModal('📖 Spellbook', '', render);
}

// ------------------------------------------------------------ combat HUD

let hotbarEls = null;
export function buildHotbar(p, { onSlot, onDodge, onPotion, onTarget, onShout }) {
  const el = $('#hotbar');
  const basic = basicSpell(p.school);
  const slots = [basic.id, ...p.hotbar];
  el.innerHTML = slots.map((id, i) => {
    const s = SPELLS[id];
    const school = s ? SCHOOLS[s.school] : null;
    return `<button class="hb ${s ? '' : 'empty'}" data-i="${i}" style="--sc:${school ? school.css : '#555'}" title="${s ? esc(s.name) + ' · ' + esc(describe(s)) : 'Empty slot (press B)'}">
      <span class="hb-icon">${school ? school.icon : '·'}</span><span class="hb-key">${keyLabel(keyFor('slot' + (i + 1)))}</span>
      ${s && i > 0 ? `<span class="hb-cost">${spellCost(s)}</span>` : ''}${i === 0 ? '<span class="hb-combo"><i></i><i></i></span>' : ''}<span class="hb-name">${s ? esc(s.name) : ''}</span><span class="hb-cd"></span></button>`;
  }).join('') + `<button class="hb util" data-act="potion" title="Drink a potion"><span class="hb-icon">🧪</span><span class="hb-key">${keyLabel(keyFor('potion'))}</span><span class="hb-count"></span><span class="hb-cd"></span></button>
    <button class="hb util" data-act="dodge" title="Dodge"><span class="hb-icon">💨</span><span class="hb-key">${keyFor('dodge') === 'Space' ? '␣' : keyLabel(keyFor('dodge'))}</span><span class="hb-cd"></span></button>
    <button class="hb util" data-act="target" title="Next target"><span class="hb-icon">🎯</span><span class="hb-key">${keyLabel(keyFor('target'))}</span></button>
    ${p.dragon?.equipped ? `<button class="hb util shout" data-act="shout" title="Dragon shout"><span class="hb-icon">${uiHooks.shoutIcon?.(p.dragon.equipped) || '🐉'}</span><span class="hb-key">${keyLabel(keyFor('shout'))}</span><span class="hb-cd"></span></button>` : ''}`;
  el.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => onSlot(+b.dataset.i)));
  el.querySelector('[data-act="potion"]').addEventListener('click', onPotion);
  el.querySelector('[data-act="dodge"]').addEventListener('click', onDodge);
  el.querySelector('[data-act="target"]').addEventListener('click', onTarget);
  el.querySelector('[data-act="shout"]')?.addEventListener('click', () => onShout?.());
  hotbarEls = {
    combo: el.querySelector('.hb-combo'),
    slots: [...el.querySelectorAll('[data-i]')].map(b => ({ b, cd: b.querySelector('.hb-cd') })),
    potion: el.querySelector('[data-act="potion"]'),
    dodge: el.querySelector('[data-act="dodge"]'),
    shout: el.querySelector('[data-act="shout"]'),
  };
}

export function showCombatHUD(show) {
  $('#hotbar').classList.toggle('hidden', !show);
  if (!show) $('#target-frame').classList.add('hidden');
}

const cdStyle = (left, total) => left > 0 ? `conic-gradient(rgba(10,6,30,.78) ${(left / total) * 360}deg, transparent 0)` : 'none';

export function updateHotbar(state) {
  if (!hotbarEls) return;
  state.slots.forEach((s, i) => {
    const el = hotbarEls.slots[i];
    if (!el || !s) return;
    el.cd.style.background = cdStyle(s.left, s.total);
    el.cd.textContent = s.left > 0.9 ? Math.ceil(s.left) : '';
    el.b.classList.toggle('poor', s.poor);
  });
  const pc = hotbarEls.potion.querySelector('.hb-cd');
  pc.style.background = cdStyle(state.potion.left, state.potion.total);
  pc.textContent = state.potion.left > 0.9 ? Math.ceil(state.potion.left) : '';
  hotbarEls.potion.querySelector('.hb-count').textContent = state.potion.count;
  hotbarEls.potion.classList.toggle('poor', state.potion.count < 1);
  hotbarEls.dodge.querySelector('.hb-cd').style.background = cdStyle(state.dodge.left, state.dodge.total);
  if (hotbarEls.combo) hotbarEls.combo.dataset.n = state.combo || 0;
  if (hotbarEls.shout && state.shout) {
    const c = hotbarEls.shout.querySelector('.hb-cd');
    c.style.background = cdStyle(state.shout.left, state.shout.total);
    c.textContent = state.shout.left > 0.9 ? Math.ceil(state.shout.left) : '';
  }
}

export function updateTarget(e) {
  const el = $('#target-frame');
  if (!e || e.state === 'dead') { el.classList.add('hidden'); return; }
  const school = SCHOOLS[e.def.school];
  el.classList.remove('hidden');
  el.classList.toggle('boss', !!e.def.boss);
  el.innerHTML = `<div class="tf-name"><span style="color:${school.css}">${school.icon}</span> ${esc(e.def.name)} <small>Lv ${e.def.level}</small></div>
    <div class="bar hp"><div class="fill" style="width:${(e.hp / e.maxHp) * 100}%"></div><span>${Math.ceil(e.hp)} / ${e.maxHp}</span></div>
    ${e.cast ? `<div class="tf-cast">Casting ${esc(e.cast.spell.name)}…</div>` : ''}`;
}

export function flashHurt() {
  const el = $('#hurt');
  el.classList.remove('on');
  void el.offsetWidth;
  el.classList.add('on');
}

let msgTimer = 0;
export function combatMessage(text, cls = '') {
  const el = $('#combat-msg');
  el.className = cls;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => el.classList.remove('show'), cls === 'boss' ? 3000 : 1400);
}

export function openShop(p, onChange) {
  const render = (body) => {
    const item = SHOP.potion, egg = SHOP.egg;
    const full = p.potions >= RULES.maxPotions;
    const unowned = Object.keys(PETS).filter(id => !p.pets.includes(id) && !PETS[id].special);
    body.innerHTML = `<p class="modal-note">Gold: <b>🪙 ${p.gold}</b></p>
      <div class="shop-item"><div class="shop-icon">🧪</div>
        <div><b>${item.name}</b><br><span>${item.desc}</span><br><span>You have ${p.potions}/${RULES.maxPotions}</span></div>
        <button class="btn primary" id="buy" ${full || p.gold < item.price ? 'disabled' : ''}>Buy · 🪙 ${item.price}</button></div>
      <div class="shop-item"><div class="shop-icon">🥚</div>
        <div><b>${egg.name}</b><br><span>${egg.desc}</span><br><span>${unowned.length ? `${unowned.length} pets left to discover` : 'You have every pet!'}</span></div>
        <button class="btn primary" id="egg" ${!unowned.length || p.gold < egg.price ? 'disabled' : ''}>Buy · 🪙 ${egg.price}</button></div>`;
    body.querySelector('#buy').addEventListener('click', () => {
      if (p.gold < item.price || p.potions >= RULES.maxPotions) return;
      p.gold -= item.price;
      p.potions++;
      onChange('drink');
      render(body);
    });
    body.querySelector('#egg').addEventListener('click', () => {
      if (p.gold < egg.price || !unowned.length) return;
      p.gold -= egg.price;
      const id = unowned[Math.floor(Math.random() * unowned.length)];
      givePet(p, id);
      toast(`🥚 The egg hatched into a <b>${PETS[id].name}</b>! ${SCHOOLS[PETS[id].school].icon}`, 'good');
      onChange('pet');
      render(body);
    });
  };
  openModal('🧪 Madame Fizz\'s Potions & Pets', '', render);
}

// ------------------------------------------------------------ gear

export function statsText(stats) {
  return Object.entries(stats || {}).filter(([, v]) => v).map(([k, v]) => k === 'hp' ? `+${v} ${STAT_NAMES[k]}` : `+${v}% ${STAT_NAMES[k]}`).join(' · ');
}

function gearRow(g, right, inst = null, extra = '') {
  const name = inst ? itemName(inst) : g.name;
  const color = inst ? itemColor(inst) : RARITIES.common.color;
  const stats = inst ? itemStats(inst) : g.stats;
  const r = inst ? RARITIES[inst.r] : null;
  return `<div class="gear-row ${inst ? 'rar-' + inst.r : ''}"><div class="gear-icon">${SLOTS[g.slot].split(' ')[0]}</div>
    <div class="gear-info"><b style="color:${color}">${esc(name)}</b> <small>${r && inst.r !== 'common' ? r.label + ' · ' : ''}Lv ${g.level} ${SLOTS[g.slot].split(' ')[1]}</small><br><span>${statsText(stats)}</span>
    ${inst?.p ? `<br><span class="legend">✦ ${esc(LEGENDARY[inst.p].desc)}</span>` : ''}${extra}</div>${right}</div>`;
}

export function openCharacter(p, onChange, tab = 'gear') {
  let sort = 'slot';
  const render = (body) => {
    const s = p.stats || {};
    const petList = p.pets.map(id => {
      const pet = PETS[id], sp = SPELLS[pet.spell];
      const active = p.activePet === id;
      return `<div class="gear-row ${active ? 'active' : ''}"><div class="gear-icon">${SCHOOLS[pet.school].icon}</div>
        <div class="gear-info"><b>${pet.name}</b><br><span>Casts in battle: ${esc(describe(sp))}</span><br><span>${statsText(pet.stats)}</span></div>
        <button class="btn small ${active ? '' : 'primary'}" data-pet="${id}">${active ? 'Dismiss' : 'Summon'}</button></div>`;
    }).join('') || '<p class="modal-note">No pets yet. Buy a Mystery Pet Egg from Madame Fizz, or find one on powerful foes.</p>';
    const order = { slot: (a, b) => Object.keys(SLOTS).indexOf(a.g.slot) - Object.keys(SLOTS).indexOf(b.g.slot) || b.g.level - a.g.level,
      level: (a, b) => b.g.level - a.g.level, rarity: (a, b) => RARITY_ORDER.indexOf(b.inst.r) - RARITY_ORDER.indexOf(a.inst.r) || b.g.level - a.g.level };
    const pack = p.inventory.map((inst, i) => ({ inst, i, g: GEAR[inst.b] })).sort(order[sort]);
    const free = freePoints(p);
    let inner = '';
    if (tab === 'gear') inner = `
      <h3 class="sub-h">Equipped</h3>
      <div class="equip-grid">${Object.keys(SLOTS).map(slot => {
        const inst = p.equipped[slot];
        return inst ? gearRow(GEAR[inst.b], `<button class="btn small" data-unequip="${slot}">Remove</button>`, inst)
          : `<div class="gear-row empty"><div class="gear-icon">${SLOTS[slot].split(' ')[0]}</div><div class="gear-info"><span>No ${SLOTS[slot].split(' ')[1].toLowerCase()}</span></div></div>`;
      }).join('')}</div>
      <h3 class="sub-h row">Backpack (${p.inventory.length}/${RULES.inventoryMax})
        <span class="sort">Sort: ${['slot', 'level', 'rarity'].map(k => `<button class="btn small ${sort === k ? 'primary' : ''}" data-sort="${k}">${k}</button>`).join('')}
        ${p.inventory.some(x => x.r === 'common') ? '<button class="btn small" id="sell-common">Sell all common</button>' : ''}</span></h3>
      ${pack.map(({ inst, i, g }) => {
        const low = p.level < g.level;
        const cmp = compareText(inst, p.equipped[g.slot]);
        return gearRow(g, `<div class="gear-btns"><button class="btn small primary" data-equip="${i}" ${low ? 'disabled title="Level too low"' : ''}>${low ? `Lv ${g.level}` : 'Equip'}</button><button class="btn small" data-sell="${i}">Sell 🪙${itemValue(inst)}</button></div>`,
          inst, cmp ? `<div class="compare">${cmp}</div>` : '');
      }).join('') || '<p class="modal-note">Your backpack is empty. Defeat enemies to find gear!</p>'}`;
    if (tab === 'talents') inner = `
      <p class="modal-note">Talent points: <b>${free}</b> free · ${talentPoints(p)} total (one per level after the first). Deeper talents need 2 points spent above them in the same branch.
        ${spentPoints(p) ? `<button class="btn small" id="respec">Reset talents · 🪙${respecCost(p)}</button>` : ''}</p>
      <div class="talent-trees">${TALENTS[p.school].map((br, bi) => `<div class="branch"><div class="branch-head">${br.icon} <b>${esc(br.name)}</b><small>${esc(br.desc)} · ${branchSpent(p, br)} pts</small></div>
        ${br.talents.map((t, i) => {
          const rank = p.talents[t.id] || 0;
          const can = canLearn(p, br, i);
          const locked = branchSpent(p, br) < i * 2;
          return `<button class="talent ${rank ? 'has' : ''} ${rank >= t.max ? 'max' : ''} ${locked ? 'locked' : ''} ${i === 4 ? 'cap' : ''}" data-talent="${bi}:${i}" ${can ? '' : 'disabled'}>
            <span class="t-icon">${t.icon}</span><span class="t-name">${esc(t.name)}</span><span class="t-rank">${rank}/${t.max}</span><span class="t-desc">${esc(t.desc)}${t.max > 1 ? ' per rank' : ''}</span></button>`;
        }).join('')}</div>`).join('')}</div>`;
    if (tab === 'pets') inner = petList;
    body.innerHTML = `
      <div class="tabs"><button class="btn small ${tab === 'gear' ? 'primary' : ''}" data-tab="gear">🎒 Gear</button><button class="btn small ${tab === 'talents' ? 'primary' : ''}" data-tab="talents">🌟 Talents${free ? ` (${free})` : ''}</button><button class="btn small ${tab === 'pets' ? 'primary' : ''}" data-tab="pets">🐾 Pets (${p.pets.length}/${Object.keys(PETS).length})</button></div>
      <div class="stat-grid">
        <div>❤️ Health <b>${p.maxHp}</b></div><div>⚔️ Damage <b>+${Math.round((p.level - 1) * 2 + (s.dmg || 0))}%</b></div>
        <div>🎯 Crit Chance <b>${5 + (s.acc || 0)}%</b></div><div>🛡️ Resist <b>${s.resist || 0}%</b></div>
        <div>⏱️ Haste <b>${s.pip || 0}%</b></div><div>💚 Healing <b>+${s.heal || 0}%</b></div><div>💧 Mana <b>${p.maxMana}</b></div>
        <div>🏅 Difficulty <b>${DIFFICULTIES[p.difficulty].icon} ${DIFFICULTIES[p.difficulty].name}</b></div>
      </div>${inner}`;
    body.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(body); }));
    body.querySelectorAll('[data-sort]').forEach(b => b.addEventListener('click', () => { sort = b.dataset.sort; render(body); }));
    body.querySelectorAll('[data-equip]').forEach(b => b.addEventListener('click', () => { if (equip(p, +b.dataset.equip)) { onChange('gear'); render(body); } }));
    body.querySelectorAll('[data-unequip]').forEach(b => b.addEventListener('click', () => {
      if (!unequip(p, b.dataset.unequip)) return toast('Your backpack is full!');
      onChange('gear'); render(body);
    }));
    body.querySelectorAll('[data-sell]').forEach(b => b.addEventListener('click', () => { sellItem(p, +b.dataset.sell); onChange('sell'); render(body); }));
    body.querySelector('#sell-common')?.addEventListener('click', () => {
      let gold = 0;
      for (let i = p.inventory.length - 1; i >= 0; i--) if (p.inventory[i].r === 'common') gold += sellItem(p, i);
      toast(`Sold every common item for 🪙 ${gold}`);
      onChange('sell'); render(body);
    });
    body.querySelectorAll('[data-pet]').forEach(b => b.addEventListener('click', () => {
      setActivePet(p, p.activePet === b.dataset.pet ? null : b.dataset.pet);
      onChange('pet'); render(body);
    }));
    body.querySelectorAll('[data-talent]').forEach(b => b.addEventListener('click', () => {
      const [bi, i] = b.dataset.talent.split(':').map(Number);
      const br = TALENTS[p.school][bi];
      if (!canLearn(p, br, i)) return;
      const t = br.talents[i];
      p.talents[t.id] = (p.talents[t.id] || 0) + 1;
      onChange('talent');
      render(body);
    }));
    body.querySelector('#respec')?.addEventListener('click', () => {
      const cost = respecCost(p);
      if (p.gold < cost) return toast('Not enough gold to reset your talents.');
      if (!confirm(`Reset all talents for ${cost} gold?`)) return;
      p.gold -= cost;
      p.talents = {};
      onChange('talent');
      render(body);
    });
  };
  openModal(`🧙 ${esc(p.name)}`, '', render);
}

export function openGearShop(p, onChange, stock = GEAR_SHOP, title = '🎩 Tumblewick\'s Outfitters') {
  const render = (body) => {
    body.innerHTML = `<p class="modal-note">Gold: <b>🪙 ${p.gold}</b> · Anything you buy goes into your backpack. Open your character screen (C) to equip it.</p>
      ${stock.map(id => {
        const g = GEAR[id];
        const worn = p.equipped[g.slot];
        const cmp = compareText(makeItem(id), worn);
        return gearRow(g, `<button class="btn small primary" data-buy="${id}" ${p.gold < g.price || p.inventory.length >= RULES.inventoryMax ? 'disabled' : ''}>Buy 🪙${g.price}</button>`, null, cmp ? `<div class="compare">${cmp}</div>` : '');
      }).join('')}`;
    body.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const g = GEAR[b.dataset.buy];
      if (p.gold < g.price || p.inventory.length >= RULES.inventoryMax) return;
      p.gold -= g.price;
      p.inventory.push(makeItem(g.id));
      toast(`Bought <b>${esc(g.name)}</b>!`, 'good');
      onChange('loot');
      render(body);
    }));
  };
  openModal(title, '', render);
}

export function openHelp() {
  openModal('❓ How to Play', `<div class="help">
    <h3>Exploring</h3>
    <p><b>W A S D</b> or the arrow keys move you. With <b>modern</b> controls you move relative to the camera: <b>drag the mouse</b> (or your finger) to look around, scroll to zoom. With <b>classic</b> controls A / D turn instead. You can also <b>tap or click the ground</b> to walk there. On phones, use the joystick in the corner.</p>
    <p><b>Esc</b> opens the menu: settings (sound, graphics, controls, key bindings), saving your game to a file, and quitting to the title. Every key can be changed in Settings → Keys.</p>
    <p><b>E</b> (or tap them) to talk to characters. <b>!</b> means they have a quest and <b>?</b> means you can turn one in.</p>
    <p><b>B</b> spellbook · <b>C</b> character, gear &amp; pets · <b>H</b> potion · <b>M</b> mute · <b>?</b> this help. Fountains restore your health.</p>
    <p>The minimap shows enemies (red), people (white, gold when they have a quest) and portals (purple). The ⭐ or arrow points to your quest.</p>
    <h3>Mounts &amp; travel</h3>
    <p>Stablemaster Juno in Millbrook Meadow sells mounts; press <b>X</b> to ride (you hop off when a battle starts). Some mounts are earned: a Void Stalker from the deep Rift and a Sky Drake from Vorathrax. Touch <b>waystones</b> to remember them, then open the <b>World Atlas</b> (<b>N</b>, or click the minimap) to fast-travel.</p>
    <h3>Day, night &amp; weather</h3>
    <p>A full day lasts 15 minutes (the clock is under the minimap). At night the world darkens, a lantern glows around you, <b>spirits roam</b> Hollow Lane and the meadow, foes give <b>+15% XP</b>, and <b>Moonfish</b> bite (Fishing 15). Weather changes with the zone: rain and thunderstorms at the Academy, snow and blizzards on the Peaks, ashfall in Emberfall.</p>
    <h3>Skills &amp; crafting</h3>
    <p>Go east through the courtyard's side gate to <b>Millbrook Meadow</b>. Stand next to a tree, rock, fishing spot or herb and press <b>E</b>: your wizard keeps gathering until it runs out or you walk away. There are 8 skills (Mining, Woodcutting, Fishing, Foraging, Cooking, Smithing, Alchemy, Woodworking) and each one goes up to level <b>99</b>. Press <b>K</b> to see them and what they unlock.</p>
    <p>Use the <b>crafting stations</b> to smelt bars and forge tools and jewellery, cook food, brew potions and elixirs, and carve rods, wands and staffs. <b>I</b> opens your materials bag, <b>F</b> eats food, and <b>J</b> opens your quest journal. Forewoman Brisa of the Gatherers' Guild has side quests (blue <b style="color:#7fd8ff">!</b>), sells tools and buys materials.</p>
    <h3>Your Homestead</h3>
    <p>The green Spiral Door in Millbrook Meadow leads to <b>your own floating island</b>. Craft blocks (wood, logs, leaves, doors at the workbench; stone, brick, glass, crystal and gold at the furnace; lanterns at the anvil; ice at the alchemy table), then press <b>G</b> to build: click to place, right-click to break, and number keys to pick a block. You can walk up your builds one block at a time, and doors let you walk inside. It even has its own crafting stations.</p>
    <h3>The Endless Rift</h3>
    <p>The swirling <b>Rift Gate</b> in the courtyard leads to a dungeon that is different every time. Clear rooms, open chests, pray at shrines for <b>boons</b> that last the whole run, and find the Rift Portal to go deeper. A guardian boss waits every 5 floors. If you fall you keep half your <b>Rift Shards</b>; escape through a Rift Exit to keep them all. Warden Nyx trades shards for permanent upgrades.</p>
    <h3>Dragons &amp; shouts</h3>
    <p>In Chapter 3 a new Spiral Door opens to the <b>Dragonspire Peaks</b>. Sage Vaelith awakens your <b>Voice</b>: read <b>Word Walls</b> (Hollow Lane, Emberfall and the Peaks) to learn dragon shouts, and press <b>R</b> to shout. Slaying dragons grants <b>dragon souls</b>, which teach each shout's second and third words (spellbook → Shouts). Unrelenting Force hurls foes back, Fire and Frost Breath scorch or slow, Whirlwind Sprint dashes, Become Ethereal makes you untouchable, and <b>Dragonrend</b> drags a flying dragon out of the sky.</p>
    <h3>Gear, talents &amp; pets</h3>
    <p>Enemies drop gear for 8 slots: hat, robe, cloak, boots, wand, offhand, amulet and ring. Every piece rolls a <b>rarity</b>: <span style="color:#5fdc6a">uncommon</span>, <span style="color:#4d9fff">rare</span>, <span style="color:#c542ff">epic</span> or <span style="color:#ff9a1a">legendary</span>, with bonus stats; legendaries also carry a special power. Bosses, elites, the deep Rift and harder difficulties drop better gear, and a skilled crafter can forge masterwork items. The character screen (C) compares every item with what you wear.</p>
    <p>Each level gives a <b>talent point</b> (C → Talents). Every school has three branches of five talents, ending in a powerful capstone. Pets follow you around and cast spells to help whenever you are fighting.</p>
    <h3>Combat</h3>
    <p>Fights happen right in the world. Get close to an enemy and it will attack. Its friends nearby join in!</p>
    <p><b>1</b> is your free basic attack. <b>2–5</b> are the spells on your spell bar: they cost mana (💧) and have cooldowns. Change them in your spellbook (<b>B</b>) and learn new ones from Mirabel.</p>
    <p>Spells lock onto your target (red ring). <b>Tab</b> or clicking an enemy picks a target, otherwise you aim at the nearest one.</p>
    <p><b>Space</b> dodges. Enemies wind up big attacks (watch the orange cast bar and ⚠️), and a well-timed dodge makes you untouchable for a moment.</p>
    <p><b>Red on the ground means danger!</b> Circles, cones and lines fill up before they go off. Step out of them, or dodge through at the last moment. Some bosses have rings where the safest place is right next to them.</p>
    <p>Chain your basic attack: every <b>third hit in a row</b> is an empowered combo strike (watch the dots on key 1). Critical hits and big spells knock enemies back.</p>
    <p>Blades ⚔️ boost your next hit, shields 🛡️ soften the next hit on you, traps 🎯 make an enemy take more, and weaknesses 🔻 make their next hit weaker. Enemies resist their own school. Bosses have phases, and some fight back when hit by the wrong kind of magic.</p>
    <p>You regain health and mana quickly when out of combat. <b>H</b> drinks a potion.</p>
    <h3>Difficulty</h3>
    <p>${Object.values(DIFFICULTIES).map(d => `<b>${d.icon} ${d.name}:</b> ${d.desc}`).join('<br>')}</p></div>`);
}

// Victory / defeat summary. Returns a promise that resolves when closed.
export function resultScreen(html) {
  return new Promise(resolve => {
    const el = $('#result');
    el.innerHTML = `<div class="result-box">${html}<button class="btn primary big" id="result-ok">Continue</button></div>`;
    el.classList.remove('hidden');
    const ok = el.querySelector('#result-ok');
    ok.focus();
    ok.addEventListener('click', () => { el.classList.add('hidden'); resolve(); });
  });
}

// ------------------------------------------------------------ settings & menu

export function openSettings(tab = 'audio', onClose) {
  let listening = null;
  const slider = (key, label, min = 0, max = 1, step = 0.05) =>
    `<label class="set-row"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${settings[key]}" data-set="${key}"><b>${Math.round(settings[key] * 100)}%</b></label>`;
  const toggle = (key, label, desc = '') =>
    `<label class="set-row"><span>${label}${desc ? `<small>${desc}</small>` : ''}</span><button class="btn small ${settings[key] ? 'primary' : ''}" data-toggle="${key}">${settings[key] ? 'On' : 'Off'}</button></label>`;
  const choice = (key, label, opts) =>
    `<div class="set-row"><span>${label}</span><div class="set-choice">${opts.map(([v, l]) => `<button class="btn small ${settings[key] === v ? 'primary' : ''}" data-choice="${key}" data-v="${v}">${l}</button>`).join('')}</div></div>`;
  const render = (body) => {
    const tabs = [['audio', '🔊 Sound'], ['graphics', '🖥️ Graphics'], ['controls', '🎮 Controls'], ['keys', '⌨️ Keys']];
    let inner = '';
    if (tab === 'audio') inner = slider('master', 'Master volume') + slider('music', 'Music') + slider('sfx', 'Sound effects');
    if (tab === 'graphics') inner = choice('quality', 'Quality', Object.entries(QUALITY).map(([k, q]) => [k, q.label]))
      + '<p class="modal-note">Low turns off shadows and draws fewer particles: great for older laptops and phones.</p>'
      + slider('shake', 'Screen shake', 0, 1.5, 0.1) + toggle('showFps', 'Show FPS counter') + toggle('damageNumbers', 'Damage numbers');
    if (tab === 'controls') inner = choice('controls', 'Movement', [['modern', 'Modern'], ['classic', 'Classic']])
      + '<p class="modal-note"><b>Modern:</b> W A S D move relative to the camera, drag to look around. <b>Classic:</b> W / S walk, A / D turn.</p>'
      + slider('camSens', 'Camera sensitivity', 0.3, 2, 0.1) + toggle('autoCam', 'Auto camera', 'Camera swings behind you when you tap to walk');
    if (tab === 'keys') inner = `<p class="modal-note">Click an action, then press the key you want. Arrow keys always move too.</p>
      <div class="keys-grid">${Object.entries(ACTIONS).map(([a, d]) => `<button class="key-row ${listening === a ? 'listening' : ''}" data-bind="${a}"><span>${d.label}</span><kbd>${listening === a ? 'Press a key…' : keyLabel(keyFor(a))}</kbd></button>`).join('')}</div>
      <p><button class="btn small" id="reset-keys">Reset keys</button></p>`;
    body.innerHTML = `<div class="tabs">${tabs.map(([k, l]) => `<button class="btn small ${tab === k ? 'primary' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <div class="settings">${inner}</div>
      ${tab !== 'keys' ? '<p><button class="btn small" id="reset-set">Reset to defaults</button></p>' : ''}`;
    body.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; listening = null; render(body); }));
    body.querySelectorAll('[data-set]').forEach(inp => inp.addEventListener('input', () => {
      setSetting(inp.dataset.set, +inp.value);
      inp.nextElementSibling.textContent = `${Math.round(inp.value * 100)}%`;
    }));
    body.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => { setSetting(b.dataset.toggle, !settings[b.dataset.toggle]); render(body); }));
    body.querySelectorAll('[data-choice]').forEach(b => b.addEventListener('click', () => { setSetting(b.dataset.choice, b.dataset.v); render(body); }));
    body.querySelectorAll('[data-bind]').forEach(b => b.addEventListener('click', () => { listening = b.dataset.bind; render(body); }));
    body.querySelector('#reset-keys')?.addEventListener('click', () => { resetKeys(); render(body); });
    body.querySelector('#reset-set')?.addEventListener('click', () => { resetSettings(); render(body); });
  };
  const onKey = (e) => {
    if (!listening) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.code !== 'Escape') bindKey(listening, e.code);
    listening = null;
    const body = $('#modal .modal-body');
    if (body) render(body);
  };
  window.addEventListener('keydown', onKey, true);
  openModal('⚙️ Settings', '', render, () => { window.removeEventListener('keydown', onKey, true); onClose?.(); });
}

// The pause menu (Esc). `items`: [{ label, action, primary? }]
export function openMenu(items) {
  openModal('☰ Menu', `<div class="menu-list">${items.map((it, i) => `<button class="btn ${it.primary ? 'primary' : ''} big" data-i="${i}">${it.label}</button>`).join('')}</div>`, (body) => {
    body.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { const it = items[+b.dataset.i]; if (!it.keepOpen) closeModal(); it.action?.(); }));
  });
}

// Lets the player save a file to their computer.
export function downloadText(filename, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

// Asks the player to pick a file and resolves with its text.
export function pickFile(accept = '.json,application/json') {
  return new Promise((resolve) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = accept;
    inp.addEventListener('change', async () => resolve(inp.files[0] ? await inp.files[0].text() : null));
    inp.click();
  });
}
