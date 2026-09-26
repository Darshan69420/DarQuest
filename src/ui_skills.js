// Skill, bag, crafting, guild shop and journal windows.
import { SKILLS, XP_TABLE, levelFromXp, skillXp, skillLevel, totalLevel, NODE_TYPES, RECIPES, STATION_TYPES, recipesFor, canCraft, maxCrafts, burnChance } from './skills.js';
import { ITEMS, BUFFS, bagCount } from './items.js';
import { GEAR, SLOTS, QUESTS, NPCS, RULES, ENEMIES } from './data.js';
import { SLAYER_TIERS } from './slayer.js';
import { SIDE_QUESTS, isActive, isDone, isAvailable, goalText, rewardText } from './sidequests.js';
import { currentQuest, questTrackerText } from './state.js';
import { openModal, esc, toast, statsText } from './ui.js';

const $ = (sel) => document.querySelector(sel);

// A coloured item icon, optionally with a count badge.
export function chip(id, count = null, cls = '') {
  const it = ITEMS[id];
  if (!it) return '';
  return `<span class="chip ${cls}" style="--c:${it.color}" title="${esc(it.name)}">${it.icon}${count != null ? `<b>${count}</b>` : ''}</span>`;
}

function outChip(r) {
  if (r.out.item) return chip(r.out.item);
  if (r.out.gear) return `<span class="chip" style="--c:#f2c14e">${SLOTS[GEAR[r.out.gear].slot].split(' ')[0]}</span>`;
  return '<span class="chip" style="--c:#ff5fa2">🧪</span>';
}

function outName(r) {
  if (r.out.item) return ITEMS[r.out.item].name;
  if (r.out.gear) return GEAR[r.out.gear].name;
  return 'Healing Potion';
}

// ------------------------------------------------------------ skills

function skillGuide(p, skill) {
  const lvl = skillLevel(p, skill);
  const rows = [];
  for (const n of Object.values(NODE_TYPES)) if (n.skill === skill) rows.push({ level: n.level, html: `${chip(n.item)} ${esc(n.name)} <small>${n.xp} XP</small>` });
  for (const r of Object.values(RECIPES)) if (STATION_TYPES[r.station].skill === skill) rows.push({ level: r.level, html: `${outChip(r)} ${esc(outName(r))} <small>${STATION_TYPES[r.station].name} · ${r.xp} XP</small>` });
  if (skill === 'slayer') for (const t of SLAYER_TIERS) rows.push({ level: t.level, html: `💀 Tasks: ${t.ids.map(id => esc(ENEMIES[id].name)).join(', ')}` });
  rows.sort((a, b) => a.level - b.level);
  return `<h3 class="sub-h">${SKILLS[skill].icon} ${SKILLS[skill].name} guide</h3><p class="modal-note">${SKILLS[skill].desc}</p>
    <div class="guide">${rows.map(r => `<div class="guide-row ${lvl >= r.level ? 'ok' : ''}"><span class="g-lvl">${r.level}</span>${r.html}${lvl >= r.level ? '<span class="g-ok">✔</span>' : ''}</div>`).join('')}</div>`;
}

export function openSkills(p, focus = null) {
  const render = (body) => {
    body.innerHTML = `<p class="modal-note">Total level <b>${totalLevel(p)}</b> / ${Object.keys(SKILLS).length * 99} · Combat level <b>${p.level}</b>. Every skill goes up to 99. Click one to see what it unlocks.</p>
      <div class="skill-grid">${Object.entries(SKILLS).map(([id, sk]) => {
        const xp = skillXp(p, id), lvl = levelFromXp(xp);
        const cur = XP_TABLE[lvl], next = XP_TABLE[lvl + 1] ?? cur;
        const k = lvl >= 99 ? 1 : (xp - cur) / Math.max(1, next - cur);
        return `<button class="skill-card ${focus === id ? 'on' : ''}" data-skill="${id}" style="--sc:${sk.color}">
          <span class="sk-icon">${sk.icon}</span><span class="sk-name">${sk.name}</span><span class="sk-lvl">${lvl}<small>/99</small></span>
          <span class="sk-bar"><i style="width:${(k * 100).toFixed(1)}%"></i></span>
          <span class="sk-xp">${lvl >= 99 ? 'Mastered!' : `${(next - xp).toLocaleString()} XP to ${lvl + 1}`}</span></button>`;
      }).join('')}</div>
      ${focus ? skillGuide(p, focus) : ''}`;
    body.querySelectorAll('[data-skill]').forEach(b => b.addEventListener('click', () => { focus = focus === b.dataset.skill ? null : b.dataset.skill; render(body); }));
  };
  openModal('📊 Skills', '', render);
}

// ------------------------------------------------------------ bag

const GROUPS = [
  ['tool', '🧰 Tools'], ['food', '🍢 Food'], ['potion', '🧪 Potions & elixirs'], ['ore', '🪨 Ores'], ['bar', '🧱 Bars'],
  ['gem', '💎 Gems'], ['log', '🪵 Logs'], ['plank', '🟫 Planks'], ['fish', '🐟 Raw fish'], ['herb', '🌿 Herbs'],
  ['block', '🧊 Building blocks'], ['misc', '✨ Trophies'], ['junk', '🗑️ Junk'],
];

export function openBag(p, { onUse, onChange }) {
  let sel = null;
  const render = (body) => {
    const ids = Object.keys(p.bag).filter(id => ITEMS[id] && p.bag[id] > 0);
    if (sel && !p.bag[sel]) sel = null;
    const groups = GROUPS.map(([type, title]) => {
      const list = ids.filter(id => ITEMS[id].type === type);
      if (!list.length) return '';
      return `<h3 class="sub-h">${title}</h3><div class="bag-grid">${list.map(id => `<button class="bag-slot ${sel === id ? 'on' : ''}" data-id="${id}">${chip(id, p.bag[id])}<span>${esc(ITEMS[id].name)}</span></button>`).join('')}</div>`;
    }).join('');
    let detail = '';
    if (sel) {
      const it = ITEMS[sel];
      const acts = [];
      if (it.type === 'food') acts.push(`<button class="btn small primary" data-act="use">Eat (+${it.heal} ❤️)</button>`);
      if (it.type === 'potion') acts.push(`<button class="btn small primary" data-act="use">Drink</button>`);
      acts.push(`<button class="btn small danger" data-act="drop">Drop 1</button>`);
      let info = `Worth ${it.value} gold each.`;
      if (it.tool) info = `Used automatically for ${SKILLS[it.tool.skill].name} (tier ${it.tool.power}). Better tools gather faster.`;
      if (it.buff) { const b = BUFFS[it.buff]; info = `${b.icon} ${b.name} for ${Math.round(b.dur / 60)} minutes: ${b.stats ? statsText(b.stats) : ''}${b.speed ? `+${b.speed * 100}% move speed` : ''}${b.fireResist ? ' · takes 40% less fire damage' : ''}`; }
      if (it.use === 'mana') info = `Restores ${it.amount * 100}% of your mana.`;
      if (it.use === 'heal') info = `Restores ${it.amount * 100}% of your health.`;
      if (it.regen) info += ' Makes you Well Fed: regenerate health for a minute.';
      detail = `<div class="bag-detail">${chip(sel, p.bag[sel])}<div><b>${esc(it.name)}</b><br><span>${esc(info)}</span></div><div class="gear-btns">${acts.join('')}</div></div>`;
    }
    body.innerHTML = `<p class="modal-note">Materials, food, potions and tools. <b>F</b> eats your best-fitting food. Sell things to Forewoman Brisa in Millbrook Meadow.</p>
      ${detail}${groups || '<p class="modal-note">Your bag is empty. Go chop, mine, fish and forage!</p>'}`;
    body.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => { sel = sel === b.dataset.id ? null : b.dataset.id; render(body); }));
    body.querySelector('[data-act="use"]')?.addEventListener('click', () => { onUse(sel); render(body); });
    body.querySelector('[data-act="drop"]')?.addEventListener('click', () => { p.bag[sel]--; if (p.bag[sel] <= 0) delete p.bag[sel]; onChange(); render(body); });
  };
  openModal('👜 Materials Bag', '', render);
}

// ------------------------------------------------------------ crafting

export function openCrafting(p, type, onCraft) {
  const st = STATION_TYPES[type], skill = st.skill;
  const render = (body) => {
    const lvl = skillLevel(p, skill);
    const xp = skillXp(p, skill), cur = XP_TABLE[lvl], next = XP_TABLE[lvl + 1] ?? cur;
    body.innerHTML = `<div class="craft-head" style="--sc:${SKILLS[skill].color}"><span>${SKILLS[skill].icon} ${SKILLS[skill].name} level <b>${lvl}</b></span>
      <span class="sk-bar"><i style="width:${lvl >= 99 ? 100 : ((xp - cur) / Math.max(1, next - cur)) * 100}%"></i></span></div>
      <div class="recipes">${recipesFor(type).map(r => {
        const locked = lvl < r.level;
        const n = maxCrafts(p, r);
        const ok = !locked && n > 0;
        const potFull = r.out.potions && p.potions >= RULES.maxPotions;
        const burn = burnChance(p, r);
        return `<div class="recipe ${locked ? 'locked' : ''} ${ok ? 'can' : ''}">
          ${outChip(r)}
          <div class="r-info"><b>${esc(outName(r))}${r.out.n > 1 ? ` ×${r.out.n}` : ''}</b> <small>Lv ${r.level} · ${r.xp} XP${burn > 0 && !locked ? ` · ${Math.round(burn * 100)}% burn` : ''}</small>
            <div class="r-in">${Object.entries(r.inputs).map(([id, need]) => `<span class="${bagCount(p, id) >= need ? 'have' : 'miss'}">${chip(id)} ${bagCount(p, id)}/${need}</span>`).join('')}</div>
            ${r.out.gear ? `<div class="r-stats">${statsText(GEAR[r.out.gear].stats)} · needs level ${GEAR[r.out.gear].level}</div>` : ''}
            ${potFull ? '<div class="r-stats">Your potion belt is full: extras are sold as you brew them</div>' : ''}</div>
          <div class="gear-btns">${locked ? `<span class="card-tag lock">Needs ${SKILLS[skill].name} ${r.level}</span>`
            : `<button class="btn small primary" data-make="${r.id}" data-n="1" ${ok ? '' : 'disabled'}>${st.verb}</button>
               <button class="btn small" data-make="${r.id}" data-n="${n}" ${n > 1 ? '' : 'disabled'}>All (${n})</button>`}</div>
        </div>`;
      }).join('')}</div>`;
    body.querySelectorAll('[data-make]').forEach(b => b.addEventListener('click', () => {
      onCraft(RECIPES[b.dataset.make], +b.dataset.n);
      render(body);
    }));
  };
  openModal(`${st.icon} ${st.name}`, '', render);
}

// ------------------------------------------------------------ guild shop

const GUILD_TOOLS = [['copper_pickaxe', 15], ['copper_axe', 15], ['twig_rod', 12], ['iron_pickaxe', 160], ['iron_axe', 160], ['willow_rod', 150], ['herb_shears', 140]];

export function openGuildShop(p, onChange) {
  let tab = 'buy';
  const render = (body) => {
    const sellable = Object.keys(p.bag).filter(id => ITEMS[id] && p.bag[id] > 0);
    const junk = sellable.filter(id => ITEMS[id].type === 'junk');
    body.innerHTML = `<div class="tabs"><button class="btn small ${tab === 'buy' ? 'primary' : ''}" data-tab="buy">🧰 Buy tools</button><button class="btn small ${tab === 'sell' ? 'primary' : ''}" data-tab="sell">🪙 Sell</button></div>
      <p class="modal-note">Gold: <b>🪙 ${p.gold}</b>${tab === 'buy' ? ' · The best tool in your bag is used automatically. Better ones are forged at the anvil or carved at the workbench.' : ''}</p>
      ${tab === 'buy' ? GUILD_TOOLS.map(([id, price]) => `<div class="gear-row">${chip(id)}<div class="gear-info"><b>${esc(ITEMS[id].name)}</b><br><span>${SKILLS[ITEMS[id].tool.skill].name} tool · tier ${ITEMS[id].tool.power}${bagCount(p, id) ? ' · owned' : ''}</span></div>
          <button class="btn small primary" data-buy="${id}" data-price="${price}" ${p.gold < price ? 'disabled' : ''}>Buy 🪙${price}</button></div>`).join('')
      : `${junk.length ? '<p><button class="btn small" id="junk">Throw away all junk</button></p>' : ''}
        ${sellable.filter(id => ITEMS[id].value > 0).map(id => `<div class="gear-row">${chip(id, p.bag[id])}<div class="gear-info"><b>${esc(ITEMS[id].name)}</b><br><span>🪙 ${ITEMS[id].value} each</span></div>
          <div class="gear-btns"><button class="btn small" data-sell="${id}" data-n="1">Sell 1</button><button class="btn small primary" data-sell="${id}" data-n="${p.bag[id]}">Sell all · 🪙${ITEMS[id].value * p.bag[id]}</button></div></div>`).join('') || '<p class="modal-note">Nothing to sell.</p>'}`}`;
    body.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(body); }));
    body.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const price = +b.dataset.price;
      if (p.gold < price) return;
      p.gold -= price;
      p.bag[b.dataset.buy] = (p.bag[b.dataset.buy] || 0) + 1;
      toast(`Bought <b>${esc(ITEMS[b.dataset.buy].name)}</b>`, 'good');
      onChange('loot');
      render(body);
    }));
    body.querySelectorAll('[data-sell]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.sell, n = Math.min(+b.dataset.n, p.bag[id] || 0);
      p.bag[id] -= n;
      if (p.bag[id] <= 0) delete p.bag[id];
      p.gold += ITEMS[id].value * n;
      onChange('sell');
      render(body);
    }));
    body.querySelector('#junk')?.addEventListener('click', () => { for (const id of junk) delete p.bag[id]; onChange(); render(body); });
  };
  openModal('🌾 Gatherers\' Guild', '', render);
}

// ------------------------------------------------------------ journal

export function openJournal(p, extraSections = '') {
  const main = currentQuest(p);
  const t = questTrackerText(p);
  const active = SIDE_QUESTS.filter(q => isActive(p, q.id));
  const avail = SIDE_QUESTS.filter(q => isAvailable(p, q));
  const done = SIDE_QUESTS.filter(q => isDone(p, q.id));
  const givers = [...new Set(avail.map(q => q.giver))];
  openModal('📜 Quest Journal', `
    <h3 class="sub-h">⭐ Main story</h3>
    <div class="journal-q main"><b>${esc(t.title)}</b><br><span>${esc(t.goal)}</span>${main ? `<br><small>Chapter ${main.id && +main.id.slice(1) > 7 ? 2 : 1} · quest ${p.quest.index + 1} of ${QUESTS.length}</small>` : ''}</div>
    <h3 class="sub-h">📋 Side quests (${active.length} active)</h3>
    ${active.map(q => `<div class="journal-q"><b>${esc(q.name)}</b> <small>from ${esc(NPCS[q.giver].name)}</small><br><span>${esc(goalText(p, q))}</span><br><small>Reward: ${esc(rewardText(q))}</small></div>`).join('') || '<p class="modal-note">No side quests right now.</p>'}
    ${givers.length ? `<p class="modal-note">Work available from: ${givers.map(g => `<b>${esc(NPCS[g].name)}</b>`).join(', ')} (look for a blue <b style="color:#7fd8ff">!</b>)</p>` : ''}
    ${extraSections}
    <p class="modal-note">Side quests completed: <b>${done.length}</b> / ${SIDE_QUESTS.length}</p>`);
}

// ------------------------------------------------------------ HUD bits

export function updateBuffs(p) {
  const el = $('#buffs');
  const list = Object.entries(p.buffs || {}).filter(([id, left]) => left > 0 && BUFFS[id]);
  el.innerHTML = list.map(([id, left]) => `<span class="buff" title="${esc(BUFFS[id].name)}">${BUFFS[id].icon}<small>${left >= 60 ? Math.ceil(left / 60) + 'm' : Math.ceil(left) + 's'}</small></span>`).join('');
}

export function updateActionBar(info) {
  const el = $('#action-bar');
  if (!info) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.querySelector('.ab-label').textContent = `${info.icon} ${info.label}`;
  el.querySelector('.ab-fill').style.width = `${info.k * 100}%`;
}

// The two side quests nearest done, then a count of the rest, so the card stays short.
export function sideTrackerHTML(p) {
  const active = SIDE_QUESTS.filter(q => isActive(p, q.id));
  const shown = active.slice(0, 2).map(q => `<div class="side-track"><b>${esc(q.name)}</b> · ${esc(goalText(p, q))}</div>`).join('');
  return shown + (active.length > 2 ? `<div class="side-track more">+${active.length - 2} more in your journal (J)</div>` : '');
}
