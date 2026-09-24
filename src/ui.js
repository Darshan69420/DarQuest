// DOM user interface: HUD, dialogue, modals, spell cards and toasts.
import { SCHOOLS, SPELLS, describe, RULES, SHOP } from './data.js';
import { xpToNext } from './state.js';

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
      .filter(s => !s.enemy && (s.school === p.school || s.school === 'astral'))
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
    const item = SHOP.potion;
    const full = p.potions >= RULES.maxPotions;
    body.innerHTML = `<p class="modal-note">Gold: <b>🪙 ${p.gold}</b></p>
      <div class="shop-item"><div class="shop-icon">🧪</div>
        <div><b>${item.name}</b><br><span>${item.desc}</span><br><span>You have ${p.potions}/${RULES.maxPotions}</span></div>
        <button class="btn primary" id="buy" ${full || p.gold < item.price ? 'disabled' : ''}>Buy · 🪙 ${item.price}</button></div>`;
    body.querySelector('#buy').addEventListener('click', () => {
      if (p.gold < item.price || p.potions >= RULES.maxPotions) return;
      p.gold -= item.price;
      p.potions++;
      onChange();
      render(body);
    });
  };
  openModal('🧪 Madame Fizz\'s Potions', '', render);
}

export function openHelp() {
  openModal('❓ How to Play', `<div class="help">
    <h3>Exploring</h3>
    <p><b>W / S</b> or <b>↑ / ↓</b> to walk. <b>A / D</b> or <b>← / →</b> to turn. You can also <b>tap or click the ground</b> to walk there, and drag to look around.</p>
    <p><b>E</b> (or tap them) to talk to characters. <b>!</b> means they have a quest and <b>?</b> means you can turn one in.</p>
    <p><b>B</b> spellbook · <b>H</b> drink a potion · <b>?</b> this help. Visit the Wellspring fountain to restore your health.</p>
    <h3>Battles</h3>
    <p>Walk into an enemy to start a duel. Nearby enemies will join in (up to 3).</p>
    <p>Each round you gain a <b>pip</b> (●). Sometimes it is a <b>power pip</b> (◆), which counts as 2 for spells of your own school. Spells cost pips, shown in the card's corner.</p>
    <p>Click a card to cast it. If it targets one enemy, click that enemy next. Click the ✕ on a card to discard it so you draw a new one next round. You can also <b>Pass</b> to save up pips.</p>
    <p>Spells can <b>fizzle</b>. Every school has an accuracy rating shown on its cards. Blades ⚔️ boost your next hit, shields 🛡️ soften the next hit on you, traps 🎯 make an enemy take more, and weaknesses 🔻 make their next hit weaker.</p>
    <p>Enemies resist their own school, so pick your spells wisely!</p></div>`);
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
