// The World Atlas (fast travel between waystones) and the stable (mounts).
import { MOUNTS, WAYSTONES, ZONES } from './data.js';
import { openModal, closeModal, esc, toast } from './ui.js';

// Where each land sits on the atlas (percent of the map) and how the Spiral Doors join them.
const LANDS = {
  academy:     { x: 44, y: 52, icon: '🏰', levels: '1–8' },
  emberfall:   { x: 80, y: 68, icon: '🌋', levels: '8–13' },
  dragonspire: { x: 76, y: 20, icon: '🐉', levels: '14–22' },
  homestead:   { x: 16, y: 22, icon: '🏡', levels: 'Your island' },
  rift:        { x: 16, y: 78, icon: '🌀', levels: 'Endless' },
};
const LINKS = [['academy', 'emberfall'], ['academy', 'dragonspire'], ['academy', 'homestead'], ['academy', 'rift']];

export function openAtlas(p, { here, questZone, canTravel, onTravel }) {
  const known = new Set(p.waystones);
  const svg = `<svg class="atlas-map" viewBox="0 0 100 100" preserveAspectRatio="none">
      ${LINKS.map(([a, b]) => `<line x1="${LANDS[a].x}" y1="${LANDS[a].y}" x2="${LANDS[b].x}" y2="${LANDS[b].y}" />`).join('')}
    </svg>
    ${Object.entries(LANDS).map(([id, l]) => `<div class="atlas-land ${here === id ? 'here' : ''} ${questZone === id ? 'quest' : ''}" style="left:${l.x}%;top:${l.y}%">
      <div class="al-icon">${l.icon}</div><div class="al-name">${esc(ZONES[id].name)}</div><div class="al-lv">${l.levels}</div>
      ${here === id ? '<div class="al-you">🧙 You</div>' : ''}${questZone === id ? '<div class="al-star">⭐</div>' : ''}</div>`).join('')}`;
  openModal('🗺️ World Atlas', `<div class="atlas">${svg}</div>
    <h3 class="sub-h">🗿 Waystones (${WAYSTONES.filter(w => known.has(w.id)).length}/${WAYSTONES.length})</h3>
    <p class="modal-note">Touch a waystone once to remember it. Then travel to it from here, as long as you are not in a battle or the Rift.</p>
    <div class="waystones">${WAYSTONES.map(w => `<div class="gear-row ${known.has(w.id) ? '' : 'empty'}"><div class="gear-icon">${LANDS[w.zone].icon}</div>
      <div class="gear-info"><b>${known.has(w.id) ? esc(w.name) : '???'}</b><br><span>${esc(ZONES[w.zone].name)}</span></div>
      ${known.has(w.id) ? `<button class="btn small primary" data-go="${w.id}" ${canTravel ? '' : 'disabled'}>Travel</button>` : '<span class="card-tag lock">Undiscovered</span>'}</div>`).join('')}</div>`,
  (body) => body.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { closeModal(); onTravel(WAYSTONES.find(w => w.id === b.dataset.go)); })));
}

export function openStable(p, { unlocked, onBuy, onChoose }) {
  const render = (body) => {
    body.innerHTML = `<p class="modal-note">Gold: <b>🪙 ${p.gold}</b> · Press <b>X</b> to ride your chosen mount. You hop off when a battle starts.</p>
      ${Object.entries(MOUNTS).map(([id, m]) => {
        const owned = p.mounts.includes(id);
        const active = p.activeMount === id;
        const canClaim = m.unlock && unlocked(id);
        let btn;
        if (owned) btn = active ? '<span class="card-tag ok">Riding this one</span>' : `<button class="btn small primary" data-choose="${id}">Choose</button>`;
        else if (m.unlock) btn = canClaim ? `<button class="btn small primary" data-claim="${id}">Claim</button>` : '<span class="card-tag lock">Locked</span>';
        else btn = `<button class="btn small primary" data-buy="${id}" ${p.gold < m.price || p.level < m.level ? 'disabled' : ''}>${p.level < m.level ? `Lv ${m.level}` : `🪙 ${m.price}`}</button>`;
        return `<div class="gear-row ${active ? 'active' : ''}"><div class="gear-icon">${m.icon}</div>
          <div class="gear-info"><b>${esc(m.name)}</b> <small>+${Math.round(m.speed * 100)}% speed</small><br><span>${esc(m.desc)}</span></div>${btn}</div>`;
      }).join('')}`;
    body.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const m = MOUNTS[b.dataset.buy];
      if (p.gold < m.price) return;
      p.gold -= m.price;
      onBuy(b.dataset.buy);
      toast(`${m.icon} <b>${esc(m.name)}</b> is yours! Press X to ride.`, 'good');
      render(body);
    }));
    body.querySelectorAll('[data-claim]').forEach(b => b.addEventListener('click', () => { onBuy(b.dataset.claim); toast(`${MOUNTS[b.dataset.claim].icon} <b>${esc(MOUNTS[b.dataset.claim].name)}</b> is yours!`, 'good'); render(body); }));
    body.querySelectorAll('[data-choose]').forEach(b => b.addEventListener('click', () => { onChoose(b.dataset.choose); render(body); }));
  };
  openModal('🐴 Millbrook Stables', '', render);
}
