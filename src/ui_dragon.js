// The Shouts window: see every dragon shout, equip one for R, and spend dragon souls on new words.
import { SHOUTS, shoutWords, learnWord } from './shouts.js';
import { openModal, esc, toast } from './ui.js';
import { settings, keyFor, keyLabel } from './settings.js';

const WHERE = {
  sprint: 'Hollow Lane, near the old crypt',
  fire: 'Emberfall Wilds, before the Molten Throne',
  force: 'Skyhold Camp, Dragonspire Peaks',
  frost: 'The Bone Field, Dragonspire Peaks',
  ethereal: 'Wyvern Cliffs, Dragonspire Peaks',
  rend: 'The foot of the Dragon\'s Roost',
};

export function openShouts(p, { onChange }) {
  const render = (body) => {
    const d = p.dragon;
    body.innerHTML = `<p class="modal-note">${d.voice
      ? `🐉 Dragon souls: <b>${d.souls}</b> · Read Word Walls to learn a shout's first word. Spend a soul to learn each deeper word. Press <b>${keyLabel(keyFor('shout'))}</b> to shout.`
      : '🔒 You do not have the Voice yet. Sage Vaelith in the Dragonspire Peaks can awaken it (Chapter 3).'}</p>
      <div class="shout-list">${Object.values(SHOUTS).map(s => {
        const w = shoutWords(p, s.id);
        const eq = d.equipped === s.id;
        return `<div class="shout-card ${w ? '' : 'locked'} ${eq ? 'equipped' : ''}">
          <div class="shout-icon">${s.icon}</div>
          <div class="shout-info"><b>${esc(s.name)}</b>
            <div class="shout-words">${s.words.map((word, i) => `<span class="${i < w ? 'on' : ''}" title="${esc(s.meaning[i])}">${word}</span>`).join('')}</div>
            <span>${w ? esc(s.desc(w, p.level)) + ` · ${s.cooldown[w - 1]}s cooldown` : `Word Wall: ${esc(WHERE[s.id])}`}</span></div>
          <div class="gear-btns">${w ? `${eq ? '<span class="card-tag ok">Equipped</span>' : `<button class="btn small primary" data-eq="${s.id}">Equip</button>`}
            ${w < 3 ? `<button class="btn small" data-learn="${s.id}" ${d.souls < 1 ? 'disabled' : ''}>Learn "${s.words[w]}" · 1 🐉</button>` : '<span class="card-tag ok">Mastered</span>'}` : ''}</div>
        </div>`;
      }).join('')}</div>`;
    body.querySelectorAll('[data-eq]').forEach(b => b.addEventListener('click', () => { d.equipped = b.dataset.eq; onChange(); render(body); }));
    body.querySelectorAll('[data-learn]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.learn;
      if (d.souls < 1) return;
      d.souls--;
      const w = learnWord(p, id);
      toast(`🐉 You learned <b>${SHOUTS[id].words[w - 1]}</b> (${SHOUTS[id].meaning[w - 1]}). ${esc(SHOUTS[id].name)} grows stronger!`, 'good');
      onChange('shout');
      render(body);
    }));
  };
  openModal('🐉 Dragon Shouts', '', render);
}
