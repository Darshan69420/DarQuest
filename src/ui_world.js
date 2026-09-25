// The World Atlas (fast travel between waystones) and the stable (mounts).
import { MOUNTS, WAYSTONES, ZONES, SCHOOLS, GEAR } from './data.js';
import { openModal, closeModal, esc, toast, statsText } from './ui.js';
import { COMPANIONS } from './companions.js';
import { ARENA_RANKS, ARENA_SHOP, rivalFor, arenaRewards } from './arena.js';
import { clock, WARDEN_SET } from './dungeon.js';

// Where each land sits on the atlas (percent of the map) and how the Spiral Doors join them.
const LANDS = {
  academy:     { x: 44, y: 52, icon: '🏰', levels: '1–8' },
  emberfall:   { x: 80, y: 68, icon: '🌋', levels: '8–13' },
  dragonspire: { x: 76, y: 20, icon: '🐉', levels: '14–22' },
  glacier:     { x: 46, y: 12, icon: '❄️', levels: '22–30' },
  stormspire:  { x: 90, y: 42, icon: '⚡', levels: '28–36' },
  thornwood:   { x: 62, y: 86, icon: '🌳', levels: '34–42' },
  homestead:   { x: 16, y: 22, icon: '🏡', levels: 'Your island' },
  rift:        { x: 16, y: 78, icon: '🌀', levels: 'Endless' },
};
const LINKS = [['academy', 'emberfall'], ['academy', 'dragonspire'], ['academy', 'homestead'], ['academy', 'rift'], ['academy', 'glacier'], ['academy', 'stormspire'], ['academy', 'thornwood']];

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

// ------------------------------------------------------------ the Starfall Inn (companions)

export function openInn(p, { onHire, onChoose, onMode }) {
  const render = (body) => {
    body.innerHTML = `<p class="modal-note">Gold: <b>🪙 ${p.gold}</b> · One companion travels with you at a time. They follow you, fight your foes, and grow stronger as you level up.</p>
      <div class="set-row"><span>Orders</span><div class="set-choice">${[['fight', '⚔️ Fight with me'], ['passive', '🕊️ Stay out of fights']].map(([k, l]) => `<button class="btn small ${p.companionMode === k ? 'primary' : ''}" data-mode="${k}">${l}</button>`).join('')}
        ${p.companion ? '<button class="btn small" data-choose="">Send home</button>' : ''}</div></div>
      ${Object.values(COMPANIONS).map(c => {
        const sc = SCHOOLS[c.school];
        const owned = p.companions.includes(c.id);
        const active = p.companion === c.id;
        const btn = active ? '<span class="card-tag ok">With you</span>' : owned ? `<button class="btn small primary" data-choose="${c.id}">Bring along</button>`
          : `<button class="btn small primary" data-hire="${c.id}" ${p.gold < c.price || p.level < c.level ? 'disabled' : ''}>${p.level < c.level ? `Lv ${c.level}` : `Hire · 🪙 ${c.price}`}</button>`;
        return `<div class="gear-row ${active ? 'active' : ''}"><div class="gear-icon" style="color:${sc.css}">${sc.icon}</div>
          <div class="gear-info"><b>${esc(c.name)}</b> <small>${sc.name} ${c.role}</small><br><span>${esc(c.desc)}</span></div>${btn}</div>`;
      }).join('')}`;
    body.querySelectorAll('[data-hire]').forEach(b => b.addEventListener('click', () => {
      const c = COMPANIONS[b.dataset.hire];
      if (p.gold < c.price) return;
      p.gold -= c.price;
      onHire(c.id);
      toast(`🤝 <b>${esc(c.name)}</b> joins you!`, 'good');
      render(body);
    }));
    body.querySelectorAll('[data-choose]').forEach(b => b.addEventListener('click', () => { onChoose(b.dataset.choose || null); render(body); }));
    body.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { onMode(b.dataset.mode); render(body); }));
  };
  openModal('🍺 The Starfall Inn', '', render);
}

// ------------------------------------------------------------ the Arena of Stars

export function openArena(p, { onFight, onBuy }) {
  const render = (body) => {
    const a = p.arena;
    const done = a.champion;
    const rank = ARENA_RANKS[Math.min(a.rank, ARENA_RANKS.length - 1)];
    const rival = done ? null : rivalFor(a.rank, a.duel, p.level);
    const rw = arenaRewards(a.rank, p.level);
    body.innerHTML = `<div class="arena-ranks">${ARENA_RANKS.map((r, i) => `<div class="ar ${i < a.rank || a.champion ? 'won' : i === a.rank ? 'now' : ''}" style="--rc:${r.color}"><span>${r.icon}</span><b>${r.name}</b><small>${i < a.rank || a.champion ? 'Won' : i === a.rank ? `${a.duel}/${r.duels}` : `${r.duels} duels`}</small></div>`).join('')}</div>
      ${done ? '<p class="modal-note">🏆 You are the <b>Starfall Champion</b>! The crowd chants your name. You can still spend tokens below.</p>'
        : `<div class="journal-q main"><b>Next opponent: ${esc(rival.name)}</b> <small>${SCHOOLS[rival.school].icon} ${SCHOOLS[rival.school].name} · Level ${rival.level}</small>
          <br><span>${rank.icon} ${rank.name} duel ${a.duel + 1} of ${rank.duels}. Win: 🪙 ${rw.gold} · ${rw.tokens} Arena Tokens · ${rw.xp} XP.</span>
          <br><small>Rivals dodge, heal, and throw big spells you must step out of. Losing costs nothing.</small></div>
          <p><button class="btn primary big" id="fight">⚔️ Enter the arena</button></p>`}
      <h3 class="sub-h">🎟️ Token shop <small>(you have ${a.tokens})</small></h3>
      ${ARENA_SHOP.map(s => { const g = GEAR[s.id]; return `<div class="gear-row rar-epic"><div class="gear-icon">🎁</div><div class="gear-info"><b style="color:#c542ff">${esc(g.name)}</b> <small>Epic · Lv ${g.level}</small><br><span>${statsText(g.stats)}</span></div>
        <button class="btn small primary" data-buy="${s.id}" ${a.tokens < s.cost ? 'disabled' : ''}>🎟️ ${s.cost}</button></div>`; }).join('')}`;
    body.querySelector('#fight')?.addEventListener('click', () => { closeModal(); onFight(rival); });
    body.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const s = ARENA_SHOP.find(x => x.id === b.dataset.buy);
      if (p.arena.tokens < s.cost) return;
      p.arena.tokens -= s.cost;
      onBuy(s.id);
      render(body);
    }));
  };
  openModal('🏟️ Arena of Stars', '', render);
}

// ------------------------------------------------------------ the Hollow Undercroft

export function openUndercroft(p, { level, onEnter }) {
  const u = p.undercroft;
  const heroicOpen = u.clears + u.heroicClears > 0;
  openModal('⚰️ The Hollow Undercroft', `<p class="modal-note">Beneath Hollowmere's crypt lies a vault built for the <b>Pale Magister</b>. Its gates open only for those who solve its rooms: a lever, a rune puzzle, a mirror-and-light puzzle, a guard hall, a blade gauntlet, and <b>Morvain, the Pale Warden</b>.</p>
    <div class="journal-q main"><b>Guardians match your level (${level}).</b><br><span>Cleared ${u.clears}× · Heroic ${u.heroicClears}× · Best ${u.best ? clock(u.best) : '—'} · Heroic best ${u.bestHeroic ? clock(u.bestHeroic) : '—'}</span>
      <br><small>Rewards: gold, XP, two rare or epic gear pieces, a chance at the Warden's set (${WARDEN_SET.map(id => esc(GEAR[id].name)).join(', ')}) and Morvain's Bone Crown.</small></div>
    <p><button class="btn primary big" id="uc-normal">⚰️ Descend</button>
      <button class="btn big ${heroicOpen ? '' : 'disabled'}" id="uc-heroic" ${heroicOpen ? '' : 'disabled'}>💀 Heroic${heroicOpen ? '' : ' (clear it once first)'}</button></p>
    <p class="modal-note">Heroic: guardians are 3 levels higher, with more health and harder hits. Loot is epic or legendary, and a Warden's set piece is guaranteed. Falling or leaving resets the Undercroft.</p>`,
  (body) => {
    body.querySelector('#uc-normal').addEventListener('click', () => { closeModal(); onEnter(false); });
    body.querySelector('#uc-heroic').addEventListener('click', () => { if (!heroicOpen) return; closeModal(); onEnter(true); });
  });
}
