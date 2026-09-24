// DOM user interface: HUD, dialogue, modals, spell cards and toasts.
import { SCHOOLS, SPELLS, describe, RULES, SHOP, GEAR, SLOTS, STAT_NAMES, PETS, GEAR_SHOP, DIFFICULTIES } from './data.js';
import { xpToNext, equip, unequip, sellItem, givePet, setActivePet } from './state.js';

const $ = (sel) => document.querySelector(sel);

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ------------------------------------------------------------ cards

export function cardHTML(spell, { extra = '', cls = '', acc = true } = {}) {
  const school = SCHOOLS[spell.school];
  return `<div class="card school-${spell.school} ${cls}" style="--sc:${school.css}" data-spell="${spell.id}">
    <div class="card-pips">${spell.pips === 0 ? '0' : spell.pips}</div>
    <div class="card-icon">${school.icon}</div>
    <div class="card-name">${esc(spell.name)}</div>
    <div class="card-desc">${esc(describe(spell))}</div>
    ${acc ? `<div class="card-acc">${Math.round(school.acc * 100)}%</div>` : ''}
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

export function openModal(title, bodyHTML, onMount) {
  const el = $('#modal');
  el.innerHTML = `<div class="modal-box">
    <div class="modal-head"><h2>${title}</h2><button class="btn close" aria-label="Close">✕</button></div>
    <div class="modal-body">${bodyHTML}</div></div>`;
  el.classList.remove('hidden');
  el.querySelector('.close').addEventListener('click', closeModal);
  el.addEventListener('click', (e) => { if (e.target === el) closeModal(); }, { once: true });
  onMount?.(el.querySelector('.modal-body'));
}

export function closeModal() {
  $('#modal').classList.add('hidden');
  $('#modal').innerHTML = '';
}

// Spell tutor: spend training points on new spells.
export function openTutor(p, onChange) {
  const render = (body) => {
    const list = Object.values(SPELLS)
      .filter(s => !s.enemy && !s.pet && (s.school === p.school || s.school === 'astral'))
      .sort((a, b) => a.level - b.level || a.pips - b.pips);
    body.innerHTML = `<p class="modal-note">Training Points: <b>${p.tp}</b> · Earn 1 every level. New spells go straight into your deck.</p>
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
      const copies = SPELLS[id].pips === 0 ? 2 : 3;
      for (let i = 0; i < copies && p.deck.length < RULES.deckMax; i++) p.deck.push(id);
      toast(`You learned <b>${esc(SPELLS[id].name)}</b>!`, 'good');
      onChange();
      render(body);
    }));
  };
  openModal('📚 Spell Tutor', '', render);
}

// Spellbook: choose which cards are in the deck.
export function openSpellbook(p, onChange) {
  const render = (body) => {
    const count = (id) => p.deck.filter(d => d === id).length;
    const known = p.known.map(id => SPELLS[id]).sort((a, b) => a.pips - b.pips);
    body.innerHTML = `<p class="modal-note">Deck: <b>${p.deck.length}</b> / ${RULES.deckMax} cards · Up to ${RULES.maxCopies} copies of each spell. You draw ${RULES.handSize} cards each battle round.</p>
      <div class="card-grid">${known.map(s => `<div class="card-slot">${cardHTML(s)}
        <div class="stepper"><button class="btn small" data-rem="${s.id}" ${count(s.id) === 0 ? 'disabled' : ''}>−</button>
        <span>${count(s.id)}</span>
        <button class="btn small" data-add="${s.id}" ${count(s.id) >= RULES.maxCopies || p.deck.length >= RULES.deckMax ? 'disabled' : ''}>+</button></div></div>`).join('')}</div>`;
    body.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => { p.deck.push(b.dataset.add); onChange(); render(body); }));
    body.querySelectorAll('[data-rem]').forEach(b => b.addEventListener('click', () => {
      if (p.deck.length <= 1) return toast('Your deck needs at least one card.');
      p.deck.splice(p.deck.indexOf(b.dataset.rem), 1); onChange(); render(body);
    }));
  };
  openModal('📖 Spellbook', '', render);
}

export function openShop(p, onChange) {
  const render = (body) => {
    const item = SHOP.potion, egg = SHOP.egg;
    const full = p.potions >= RULES.maxPotions;
    const unowned = Object.keys(PETS).filter(id => !p.pets.includes(id));
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

function gearRow(g, right) {
  return `<div class="gear-row"><div class="gear-icon">${SLOTS[g.slot].split(' ')[0]}</div>
    <div class="gear-info"><b>${esc(g.name)}</b> <small>Lv ${g.level} ${SLOTS[g.slot].split(' ')[1]}</small><br><span>${statsText(g.stats)}</span></div>${right}</div>`;
}

export function openCharacter(p, onChange, tab = 'gear') {
  const render = (body) => {
    const s = p.stats || {};
    const petList = p.pets.map(id => {
      const pet = PETS[id], sp = SPELLS[pet.spell];
      const active = p.activePet === id;
      return `<div class="gear-row ${active ? 'active' : ''}"><div class="gear-icon">${SCHOOLS[pet.school].icon}</div>
        <div class="gear-info"><b>${pet.name}</b><br><span>${Math.round(pet.chance * 100)}% chance each round: ${esc(describe(sp))}</span><br><span>${statsText(pet.stats)}</span></div>
        <button class="btn small ${active ? '' : 'primary'}" data-pet="${id}">${active ? 'Dismiss' : 'Summon'}</button></div>`;
    }).join('') || '<p class="modal-note">No pets yet. Buy a Mystery Pet Egg from Madame Fizz, or find one on powerful foes.</p>';
    body.innerHTML = `
      <div class="tabs"><button class="btn small ${tab === 'gear' ? 'primary' : ''}" data-tab="gear">🎒 Gear</button><button class="btn small ${tab === 'pets' ? 'primary' : ''}" data-tab="pets">🐾 Pets (${p.pets.length}/${Object.keys(PETS).length})</button></div>
      <div class="stat-grid">
        <div>❤️ Health <b>${p.maxHp}</b></div><div>⚔️ Damage <b>+${Math.round((p.level - 1) * 2 + (s.dmg || 0))}%</b></div>
        <div>🎯 Accuracy <b>+${p.level + (s.acc || 0)}%</b></div><div>🛡️ Resist <b>${s.resist || 0}%</b></div>
        <div>◆ Power Pip <b>${Math.round((0.1 + p.level * 0.02) * 100 + (s.pip || 0))}%</b></div><div>💚 Healing <b>+${s.heal || 0}%</b></div>
        <div>🏅 Difficulty <b>${DIFFICULTIES[p.difficulty].icon} ${DIFFICULTIES[p.difficulty].name}</b></div>
      </div>
      ${tab === 'gear' ? `
      <h3 class="sub-h">Equipped</h3>
      ${Object.keys(SLOTS).map(slot => {
        const g = GEAR[p.equipped[slot]];
        return g ? gearRow(g, `<button class="btn small" data-unequip="${slot}">Remove</button>`)
          : `<div class="gear-row empty"><div class="gear-icon">${SLOTS[slot].split(' ')[0]}</div><div class="gear-info"><span>No ${SLOTS[slot].split(' ')[1].toLowerCase()} equipped</span></div></div>`;
      }).join('')}
      <h3 class="sub-h">Backpack (${p.inventory.length}/${RULES.inventoryMax})</h3>
      ${p.inventory.map((id, i) => {
        const g = GEAR[id];
        const low = p.level < g.level;
        return gearRow(g, `<div class="gear-btns"><button class="btn small primary" data-equip="${i}" ${low ? 'disabled title="Level too low"' : ''}>${low ? `Lv ${g.level}` : 'Equip'}</button><button class="btn small" data-sell="${i}">Sell 🪙${g.sell}</button></div>`);
      }).join('') || '<p class="modal-note">Your backpack is empty. Defeat enemies to find gear!</p>'}` : petList}`;
    body.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(body); }));
    body.querySelectorAll('[data-equip]').forEach(b => b.addEventListener('click', () => { if (equip(p, +b.dataset.equip)) { onChange('gear'); render(body); } }));
    body.querySelectorAll('[data-unequip]').forEach(b => b.addEventListener('click', () => {
      if (!unequip(p, b.dataset.unequip)) return toast('Your backpack is full!');
      onChange('gear'); render(body);
    }));
    body.querySelectorAll('[data-sell]').forEach(b => b.addEventListener('click', () => { sellItem(p, +b.dataset.sell); onChange('sell'); render(body); }));
    body.querySelectorAll('[data-pet]').forEach(b => b.addEventListener('click', () => {
      setActivePet(p, p.activePet === b.dataset.pet ? null : b.dataset.pet);
      onChange('pet'); render(body);
    }));
  };
  openModal(`🧙 ${esc(p.name)}`, '', render);
}

export function openGearShop(p, onChange) {
  const render = (body) => {
    body.innerHTML = `<p class="modal-note">Gold: <b>🪙 ${p.gold}</b> · Anything you buy goes into your backpack. Open your character screen (C) to equip it.</p>
      ${GEAR_SHOP.map(id => {
        const g = GEAR[id];
        return gearRow(g, `<button class="btn small primary" data-buy="${id}" ${p.gold < g.price || p.inventory.length >= RULES.inventoryMax ? 'disabled' : ''}>Buy 🪙${g.price}</button>`);
      }).join('')}`;
    body.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const g = GEAR[b.dataset.buy];
      if (p.gold < g.price || p.inventory.length >= RULES.inventoryMax) return;
      p.gold -= g.price;
      p.inventory.push(g.id);
      toast(`Bought <b>${esc(g.name)}</b>!`, 'good');
      onChange('loot');
      render(body);
    }));
  };
  openModal('🎩 Tumblewick\'s Outfitters', '', render);
}

export function openHelp() {
  openModal('❓ How to Play', `<div class="help">
    <h3>Exploring</h3>
    <p><b>W / S</b> or <b>↑ / ↓</b> to walk. <b>A / D</b> or <b>← / →</b> to turn. You can also <b>tap or click the ground</b> to walk there, and drag to look around.</p>
    <p><b>E</b> (or tap them) to talk to characters. <b>!</b> means they have a quest and <b>?</b> means you can turn one in.</p>
    <p><b>B</b> spellbook · <b>C</b> character, gear &amp; pets · <b>H</b> drink a potion · <b>M</b> mute · <b>?</b> this help. Fountains restore your health.</p>
    <p>The minimap shows enemies (red), people (white, gold when they have a quest) and portals (purple). The ⭐ or arrow points to your quest.</p>
    <h3>Gear &amp; pets</h3>
    <p>Enemies can drop hats, robes, boots, wands and amulets. Equip them on the character screen. Pets follow you around, and at the start of each battle round they may cast a free spell to help.</p>
    <h3>Battles</h3>
    <p>Walk into an enemy to start a duel. Nearby enemies will join in (up to 3).</p>
    <p>Each round you gain a <b>pip</b> (●). Sometimes it is a <b>power pip</b> (◆), which counts as 2 for spells of your own school. Spells cost pips, shown in the card's corner.</p>
    <p>Click a card to cast it. If it targets one enemy, click that enemy next. Click the ✕ on a card to discard it so you draw a new one next round. You can also <b>Pass</b> to save up pips.</p>
    <p>Spells can <b>fizzle</b>. Every school has an accuracy rating shown on its cards. Blades ⚔️ boost your next hit, shields 🛡️ soften the next hit on you, traps 🎯 make an enemy take more, and weaknesses 🔻 make their next hit weaker.</p>
    <p>Enemies resist their own school, so pick your spells wisely! Bosses have phases, and some fight back when hit by the wrong kind of magic.</p>
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
