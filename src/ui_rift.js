// Windows for the Endless Rift: Warden Nyx's keeper panel, boon choices, the Rift Peddler,
// the run HUD and the end-of-run summary.
import { BOONS, RARITY, UPGRADES, riftBoard } from './rift.js';
import { SCHOOLS, RULES, PETS } from './data.js';
import { openModal, closeModal, esc, toast } from './ui.js';

const $ = (sel) => document.querySelector(sel);

function boonCard(id, extra = '') {
  const b = BOONS[id], r = RARITY[b.rarity];
  return `<div class="boon" style="--rc:${r.color}"><div class="boon-icon">${b.icon}</div><div class="boon-name">${esc(b.name)}</div>
    <div class="boon-rarity">${b.rarity}</div><div class="boon-desc">${esc(b.desc)}</div>${extra}</div>`;
}

export function openRiftKeeper(p, { unlocked, onEnter, onBuy }) {
  let tab = 'enter';
  const render = (body) => {
    const up = p.rift.upgrades;
    let inner = '';
    if (tab === 'enter') {
      inner = `<div class="rift-hero">
        <p>The Endless Rift is a dungeon that is <b>never the same twice</b>. Every floor is freshly made: rooms full of foes, treasure chests, traps, springs, and <b>shrines that grant boons</b> for the rest of your run. Every 5th floor holds a <b>guardian boss</b>.</p>
        <p>Find the room with the <b>Rift Portal</b> and defeat its guardians to go deeper. Fall, and your run ends: you keep <b>half</b> your Rift Shards. Beat a guardian and step through the golden <b>Rift Exit</b> to keep them <b>all</b>.</p>
        <p>You bring your own spells, gear and potions. Foes grow with you and with every floor.</p>
        <div class="rift-stats"><span>🔮 Shards <b>${p.rift.shards}</b></span><span>🏔️ Best floor <b>${p.rift.best}</b></span><span>🌀 Runs <b>${p.rift.runs}</b></span></div>
        ${unlocked ? `<button class="btn primary big" id="enter-rift">🌀 Enter the Rift${up.deepstart ? ` (floor ${1 + up.deepstart * 5})` : ''}</button>`
          : '<p class="modal-note">🔒 Nyx will not let an untested apprentice in. Finish Mirabel\'s first task ("Weeds of Shadow") first.</p>'}</div>`;
    }
    if (tab === 'upgrades') {
      inner = `<p class="modal-note">Rift Shards: <b>🔮 ${p.rift.shards}</b> · Upgrades are permanent.</p>
        ${Object.entries(UPGRADES).map(([id, u]) => {
          const rank = up[id] || 0, max = u.cost.length;
          const cost = u.cost[rank];
          const need = u.requires?.[rank];
          const locked = need && p.rift.best < need;
          return `<div class="gear-row"><div class="gear-icon">${u.icon}</div><div class="gear-info"><b>${esc(u.name)}</b> <small>${rank}/${max}</small><br><span>${esc(u.desc)}</span></div>
            ${rank >= max ? '<span class="card-tag ok">Maxed</span>' : `<button class="btn small primary" data-up="${id}" ${p.rift.shards < cost || locked ? 'disabled' : ''}>${locked ? `Best floor ${need}` : `🔮 ${cost}`}</button>`}</div>`;
        }).join('')}`;
    }
    if (tab === 'records') {
      const board = riftBoard();
      inner = `<div class="rift-stats"><span>🏔️ Best floor <b>${p.rift.best}</b></span><span>🌀 Runs <b>${p.rift.runs}</b></span><span>🔮 Shards earned <b>${p.rift.totalShards || 0}</b></span></div>
        <h3 class="sub-h">🏆 Deepest runs on this device</h3>
        ${board.length ? `<ol class="board">${board.map(b => `<li><b>${esc(b.name)}</b> <span style="color:${SCHOOLS[b.school]?.css}">${SCHOOLS[b.school]?.icon || ''}</span> Lv ${b.level} · <b>floor ${b.floor}</b> <small>${new Date(b.date).toLocaleDateString()}</small></li>`).join('')}</ol>` : '<p class="modal-note">No runs yet. Be the first!</p>'}`;
    }
    body.innerHTML = `<div class="tabs"><button class="btn small ${tab === 'enter' ? 'primary' : ''}" data-tab="enter">🌀 The Rift</button><button class="btn small ${tab === 'upgrades' ? 'primary' : ''}" data-tab="upgrades">🔮 Upgrades</button><button class="btn small ${tab === 'records' ? 'primary' : ''}" data-tab="records">🏆 Records</button></div>${inner}`;
    body.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(body); }));
    body.querySelector('#enter-rift')?.addEventListener('click', () => { closeModal(); onEnter(); });
    body.querySelectorAll('[data-up]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.up, u = UPGRADES[id], rank = up[id] || 0, cost = u.cost[rank];
      if (p.rift.shards < cost) return;
      p.rift.shards -= cost;
      up[id] = rank + 1;
      toast(`${u.icon} <b>${esc(u.name)}</b> rank ${rank + 1}!`, 'good');
      onBuy(id);
      render(body);
    }));
  };
  openModal('🌀 Warden Nyx · The Endless Rift', '', render);
}

export function openBoonChoice(choices, { rerolls, onPick, onReroll }) {
  openModal('✨ Choose a Boon', `<p class="modal-note">The shrine offers you a blessing for the rest of this run.</p>
    <div class="boon-grid">${choices.map(id => `<button class="boon-pick" data-boon="${id}">${boonCard(id)}</button>`).join('')}</div>
    ${rerolls > 0 ? `<p><button class="btn small" id="reroll">🎲 Reroll (${rerolls} left)</button></p>` : ''}`, (body) => {
    body.querySelectorAll('[data-boon]').forEach(b => b.addEventListener('click', () => { closeModal(); onPick(b.dataset.boon); }));
    body.querySelector('#reroll')?.addEventListener('click', () => onReroll());
  });
}

export function openMerchant(p, pr, floor, { onBuyBoon, onChange }) {
  const price = (id) => Math.round({ common: 90, rare: 170, epic: 320 }[BOONS[id].rarity] * (1 + floor * 0.08));
  const potionPrice = 40 + floor * 4;
  const render = (body) => {
    body.innerHTML = `<p class="modal-note">Gold: <b>🪙 ${p.gold}</b> · "Blessings for coin, coin for blessings. Everyone wins, heh."</p>
      <div class="boon-grid">${pr.stock.map(id => `<div class="boon-pick">${boonCard(id, `<button class="btn small primary" data-buy="${id}" ${p.gold < price(id) ? 'disabled' : ''}>🪙 ${price(id)}</button>`)}</div>`).join('') || '<p class="modal-note">Sold out!</p>'}</div>
      <div class="shop-item"><div class="shop-icon">🧪</div><div><b>Healing Potion</b><br><span>You have ${p.potions}/${RULES.maxPotions}</span></div>
        <button class="btn primary" id="pot" ${p.potions >= RULES.maxPotions || p.gold < potionPrice ? 'disabled' : ''}>🪙 ${potionPrice}</button></div>`;
    body.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.buy;
      if (p.gold < price(id)) return;
      p.gold -= price(id);
      pr.stock = pr.stock.filter(x => x !== id);
      onBuyBoon(id);
      render(body);
    }));
    body.querySelector('#pot').addEventListener('click', () => {
      if (p.gold < potionPrice || p.potions >= RULES.maxPotions) return;
      p.gold -= potionPrice;
      p.potions++;
      onChange();
      render(body);
    });
  };
  openModal('🛒 Rift Peddler', '', render);
}

export function updateRiftHud(run) {
  const el = $('#rift-hud');
  if (!run) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.innerHTML = `<div class="rh-top"><b>🌀 Floor ${run.floor}</b><span>🔮 ${run.shards}</span></div>
    <div class="rh-boons">${run.boons.map(id => `<span title="${esc(BOONS[id].name)}: ${esc(BOONS[id].desc)}" style="--rc:${RARITY[BOONS[id].rarity].color}">${BOONS[id].icon}</span>`).join('')}</div>`;
}

export function runSummaryHTML(s) {
  const title = s.reason === 'exit' ? '<h2 class="win">Escaped the Rift!</h2>' : s.reason === 'death' ? '<h2 class="lose">Lost in the Rift</h2>' : '<h2>Run abandoned</h2>';
  return `${title}
    <p>You reached <b>floor ${s.floor}</b>${s.newBest ? ' <span class="levelup">· new best!</span>' : ''}</p>
    <div class="loot"><div>⚔️ Foes defeated: <b>${s.kills}</b></div><div>🎁 Chests opened: <b>${s.chests}</b></div><div>🪙 Gold found: <b>${s.gold}</b></div>
    <div>🔮 Shards: <b>${s.kept}</b>${s.kept < s.shards ? ` <small>(half of ${s.shards})</small>` : ''}</div>
    ${s.boons.length ? `<div>✨ Boons: ${s.boons.map(id => BOONS[id].icon).join(' ')}</div>` : ''}</div>
    <p class="tip">Spend Rift Shards on permanent upgrades with Warden Nyx by the Rift Gate.</p>`;
}

export { PETS };
