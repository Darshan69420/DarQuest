// The Journal: quests, the Bestiary and Achievements (with titles). Also Slayer Master Grimm.
import { ENEMIES, SCHOOLS, NPCS, QUESTS, GEAR } from './data.js';
import { SIDE_QUESTS, isActive, isDone, isAvailable, goalText, rewardText } from './sidequests.js';
import { currentQuest, questTrackerText } from './state.js';
import { LORE, hunterBonus, hunterRank, ACHIEVEMENTS, unlockedTitles } from './achievements.js';
import { SLAYER_SHOP, SLAYER_TIERS, slayerOptions } from './slayer.js';
import { skillLevel } from './skills.js';
import { weekly, progress, isDone as chDone, weekEndsIn, weeklyReward, CHALLENGES } from './challenges.js';
import { openModal, esc, toast, statsText } from './ui.js';

export function openJournal(p, { onTitle, onClaim }, tab = 'quests') {
  const render = (body) => {
    let inner = '';
    if (tab === 'quests') {
      const main = currentQuest(p);
      const t = questTrackerText(p);
      const active = SIDE_QUESTS.filter(q => isActive(p, q.id));
      const avail = SIDE_QUESTS.filter(q => isAvailable(p, q));
      const done = SIDE_QUESTS.filter(q => isDone(p, q.id));
      const givers = [...new Set(avail.map(q => q.giver))];
      const chapter = p.quest.index < 7 ? 1 : p.quest.index < 14 ? 2 : p.quest.index < 23 ? 3 : p.quest.index < 30 ? 4 : p.quest.index < 37 ? 5 : p.quest.index < 44 ? 6 : 7;
      const ng = p.ngplus ? ` · New Game+ ${p.ngplus}` : '';
      inner = `<h3 class="sub-h">⭐ Main story</h3>
        <div class="journal-q main"><b>${esc(t.title)}</b><br><span>${esc(t.goal)}</span>${main ? `<br><small>Chapter ${chapter} · quest ${p.quest.index + 1} of ${QUESTS.length}${ng}</small>` : ''}</div>
        ${p.slayer?.task ? `<h3 class="sub-h">💀 Slayer task</h3><div class="journal-q"><b>${esc(ENEMIES[p.slayer.task.enemy].name)}</b> <span>${p.slayer.task.done}/${p.slayer.task.count}</span><br><small>Streak ${p.slayer.streak} · ${p.slayer.points} Slayer Points</small></div>` : ''}
        <h3 class="sub-h">📋 Side quests (${active.length} active)</h3>
        ${active.map(q => `<div class="journal-q"><b>${esc(q.name)}</b> <small>from ${esc(NPCS[q.giver].name)}</small><br><span>${esc(goalText(p, q))}</span><br><small>Reward: ${esc(rewardText(q))}</small></div>`).join('') || '<p class="modal-note">No side quests right now.</p>'}
        ${givers.length ? `<p class="modal-note">Work available from: ${givers.map(g => `<b>${esc(NPCS[g].name)}</b>`).join(', ')} (look for a blue <b style="color:#7fd8ff">!</b>)</p>` : ''}
        <p class="modal-note">Side quests completed: <b>${done.length}</b> / ${SIDE_QUESTS.length}</p>`;
    }
    if (tab === 'bestiary') {
      const ids = Object.keys(ENEMIES);
      const seen = ids.filter(id => (p.bestiary[id] || 0) > 0).length;
      inner = `<p class="modal-note">Discovered <b>${seen}</b> / ${ids.length}. Defeating the same kind of foe teaches you its weak spots: <b>5</b> (+2%), <b>20</b> (+4%), <b>50</b> (+7%) and <b>100</b> defeats (+10% damage).</p>
        <div class="bestiary">${ids.map(id => {
          const d = ENEMIES[id], n = p.bestiary[id] || 0;
          if (!n) return `<div class="beast unknown"><div class="b-icon">❔</div><div><b>???</b><br><small>Not yet defeated</small></div></div>`;
          const sc = SCHOOLS[d.school];
          const weak = Object.entries(d.boost || {}).filter(([, v]) => v > 0).map(([s]) => SCHOOLS[s].icon).join(' ') || '—';
          const strong = Object.keys(d.resist || {}).map(s => SCHOOLS[s].icon).join(' ') || '—';
          const rank = hunterRank(n);
          return `<div class="beast ${d.boss ? 'boss' : ''}"><div class="b-icon" style="color:${sc.css}">${sc.icon}</div>
            <div><b>${esc(d.name)}</b> <small>Lv ${d.level}${d.boss ? ' · Boss' : ''}${d.night ? ' · Night' : ''}${d.dragon ? ' · Dragon' : ''}</small>
            <br><span class="lore">${esc(LORE[id] || '')}</span>
            <br><small>Defeated <b>${n}</b>${rank ? ` · ${rank} hunter (+${Math.round(hunterBonus(n) * 100)}%)` : ''} · Weak to ${weak} · Resists ${strong}</small></div></div>`;
        }).join('')}</div>`;
    }
    if (tab === 'weekly') {
      const w = weekly(p);
      const left = weekEndsIn();
      const d = Math.floor(left / 86400000), h = Math.floor((left % 86400000) / 3600000);
      const r = weeklyReward(p);
      inner = `<p class="modal-note">Three new challenges every Monday. New ones in <b>${d}d ${h}h</b>. Each gives 🪙 ${r.gold}, ${r.xp} XP and an epic (sometimes legendary) item near your level. Finish all three for a legendary bonus.</p>
        ${w.list.map((ch, i) => {
          const c = CHALLENGES[ch.id], n = progress(p, ch), done = chDone(p, ch);
          return `<div class="journal-q ${done ? 'main' : ''}"><b>${c.icon} ${esc(c.name)}</b> <span>${esc(c.text(ch.n))}</span>
            <div class="bar small"><div class="fill" style="width:${(n / ch.n) * 100}%"></div></div><small>${n} / ${ch.n}</small>
            ${ch.claimed ? ' <span class="card-tag ok">Claimed</span>' : done ? ` <button class="btn small primary" data-claim="${i}">Claim reward</button>` : ''}</div>`;
        }).join('')}
        ${w.bonus ? '<p class="modal-note">🌟 You finished every challenge this week!</p>' : ''}`;
    }
    if (tab === 'achievements') {
      const got = ACHIEVEMENTS.filter(a => p.achievements[a.id]).length;
      const titles = unlockedTitles(p);
      inner = `<p class="modal-note">Earned <b>${got}</b> / ${ACHIEVEMENTS.length}.</p>
        <div class="titles"><b>Title:</b> <button class="btn small ${!p.title ? 'primary' : ''}" data-title="">None</button>
          ${titles.map(t => `<button class="btn small ${p.title === t ? 'primary' : ''}" data-title="${esc(t)}">${esc(t)}</button>`).join('')}
          ${titles.length ? '' : '<small>Earn achievements to unlock titles.</small>'}</div>
        <div class="achievements">${ACHIEVEMENTS.map(a => `<div class="ach ${p.achievements[a.id] ? 'got' : ''}"><div class="a-icon">${a.icon}</div>
          <div><b>${esc(a.name)}</b><br><span>${esc(a.desc)}</span><br><small>${[a.reward.gold ? `🪙 ${a.reward.gold}` : '', a.reward.title ? `Title: “${esc(a.reward.title)}”` : ''].filter(Boolean).join(' · ')}</small></div></div>`).join('')}</div>`;
    }
    body.innerHTML = `<div class="tabs">${[['quests', '📜 Quests'], ['weekly', '📅 Weekly'], ['bestiary', '🐾 Bestiary'], ['achievements', '🏆 Achievements']].map(([k, l]) => `<button class="btn small ${tab === k ? 'primary' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>${inner}`;
    body.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(body); }));
    body.querySelectorAll('[data-claim]').forEach(b => b.addEventListener('click', () => { onClaim?.(+b.dataset.claim); render(body); }));
    body.querySelectorAll('[data-title]').forEach(b => b.addEventListener('click', () => { p.title = b.dataset.title || null; onTitle(); render(body); }));
  };
  openModal('📜 Journal', '', render);
}

export function openSlayer(p, { onAssign, onBuy }) {
  const render = (body) => {
    const t = p.slayer.task;
    const lvl = skillLevel(p, 'slayer');
    body.innerHTML = `<p class="modal-note">💀 Slayer level <b>${lvl}</b> · <b>${p.slayer.points}</b> Slayer Points · task streak <b>${p.slayer.streak}</b></p>
      ${t ? `<div class="journal-q main"><b>Current task: ${esc(ENEMIES[t.enemy].name)}</b><br><span>${t.done} / ${t.count} defeated. You hit them 10% harder while on task.</span></div>
        <p><button class="btn small" id="skip" ${p.slayer.points < 20 ? 'disabled' : ''}>Skip task · 20 points (resets streak)</button></p>`
        : '<p><button class="btn primary" id="assign">Get a new task</button></p>'}
      <h3 class="sub-h">Assignments you can get</h3>
      <div class="guide">${SLAYER_TIERS.map(tier => `<div class="guide-row ${lvl >= tier.level ? 'ok' : ''}"><span class="g-lvl">${tier.level}</span>${tier.ids.map(id => esc(ENEMIES[id].name)).join(', ')}</div>`).join('')}</div>
      <h3 class="sub-h">Slayer rewards</h3>
      ${SLAYER_SHOP.map(s => { const g = GEAR[s.id]; return `<div class="gear-row"><div class="gear-icon">🎁</div><div class="gear-info"><b>${esc(g.name)}</b> <small>Lv ${g.level}</small><br><span>${statsText(g.stats)} · ${esc(s.desc)}</span></div>
        <button class="btn small primary" data-buy="${s.id}" ${p.slayer.points < s.cost ? 'disabled' : ''}>💀 ${s.cost}</button></div>`; }).join('')}`;
    body.querySelector('#assign')?.addEventListener('click', () => { onAssign(); render(body); });
    body.querySelector('#skip')?.addEventListener('click', () => { p.slayer.points -= 20; p.slayer.streak = 0; p.slayer.task = null; toast('Task skipped.'); render(body); });
    body.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const s = SLAYER_SHOP.find(x => x.id === b.dataset.buy);
      if (p.slayer.points < s.cost) return;
      p.slayer.points -= s.cost;
      onBuy(s.id);
      render(body);
    }));
  };
  if (!slayerOptions(p).length) toast('Grimm has nothing for you yet.');
  openModal('💀 Slayer Master Grimm', '', render);
}
