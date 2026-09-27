import { SCHOOLS, PLAYABLE_SCHOOLS, DIFFICULTIES } from './data.js';
import { newPlayer, save, load, clearSave, listSaves, setActiveSlot } from './state.js';

// Title markup keeps the brand introduction; only the save controls are rebuilt.
export function setupTitle({ onStart, confirmAction = message => window.confirm(message) }) {
  const title = document.querySelector('#title');
  const form = title.querySelector('#new-game-form') || title.querySelector('.new-game');
  form.id = 'new-game-form';
  let menu = title.querySelector('#save-menu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'save-menu';
    form.before(menu);
  }
  title.querySelector('#continue')?.remove();
  const status = document.createElement('p');
  status.className = 'save-status';
  status.setAttribute('role', 'status');
  menu.before(status);
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'btn';
  back.textContent = 'Back to characters';
  form.prepend(back);
  let selectedSlot = null;
  let chosen = null;
  let difficulty = 'normal';
  const grid = title.querySelector('#school-grid');
  const dgrid = title.querySelector('#difficulty-grid');
  const begin = title.querySelector('#begin');
  const nameInput = title.querySelector('#hero-name');

  function showList() {
    selectedSlot = null;
    form.classList.add('hidden');
    menu.classList.remove('hidden');
    menu.replaceChildren();
    for (const { slot, occupied, player } of listSaves()) {
      const card = document.createElement('section');
      card.className = 'save-slot';
      card.dataset.slot = slot;
      const heading = document.createElement('h2');
      heading.textContent = player ? player.name : occupied ? 'Unreadable save' : 'Empty slot';
      const detail = document.createElement('p');
      detail.textContent = player
        ? `Slot ${slot} · Level ${player.level} · ${SCHOOLS[player.school].name} · ${DIFFICULTIES[player.difficulty].name}`
        : occupied ? `Slot ${slot} · Save could not be loaded. You can delete or replace it.` : `Slot ${slot} · Start a new character`;
      card.append(heading, detail);
      const actions = document.createElement('div');
      actions.className = 'save-actions';
      const button = (label, action, primary = false) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `btn${primary ? ' primary' : ''}`;
        b.textContent = label;
        b.addEventListener('click', action);
        actions.append(b);
      };
      if (player) button('Continue', () => {
        const current = load(slot);
        if (!current) { status.textContent = 'This save could not be loaded.'; showList(); return; }
        setActiveSlot(slot);
        onStart(current, false);
      }, true);
      button(occupied ? 'Replace character' : 'New character', () => {
        selectedSlot = slot;
        chosen = null;
        difficulty = 'normal';
        begin.disabled = true;
        nameInput.value = '';
        nameInput.placeholder = 'Name your wizard';
        grid.querySelectorAll('.chosen').forEach(b => b.classList.remove('chosen'));
        dgrid.querySelectorAll('button').forEach(b => b.classList.toggle('chosen', b.dataset.diff === difficulty));
        status.textContent = occupied ? `Creating a replacement for slot ${slot}. Your current character stays saved until you confirm.` : `New character · Slot ${slot}`;
        menu.classList.add('hidden');
        form.classList.remove('hidden');
        nameInput.focus();
      }, !occupied);
      if (occupied) button('Delete', () => {
        const current = load(slot);
        const identity = current ? `${current.name}, level ${current.level}` : `the unreadable save in slot ${slot}`;
        if (!confirmAction(`Delete ${identity}? This cannot be undone.`)) return;
        status.textContent = clearSave(slot) ? `Slot ${slot} cleared.` : 'Storage is unavailable. The save was not deleted.';
        showList();
      });
      card.append(actions);
      menu.append(card);
    }
  }
  grid.innerHTML = PLAYABLE_SCHOOLS.map(id => {
    const s = SCHOOLS[id];
    return `<button type="button" class="school-card" data-school="${id}" style="--sc:${s.css}"><div class="sc-name">${s.name}</div><div class="sc-desc">${s.desc}</div><div class="sc-stats">${s.baseHp} health · ${s.role}</div></button>`;
  }).join('');
  grid.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    chosen = b.dataset.school;
    grid.querySelectorAll('button').forEach(x => x.classList.toggle('chosen', x === b));
    begin.disabled = false;
  }));
  dgrid.innerHTML = Object.entries(DIFFICULTIES).map(([id, d]) => `<button type="button" class="diff-card ${id}" data-diff="${id}"><b>${d.name}</b><span>${d.desc}</span></button>`).join('');
  dgrid.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    difficulty = b.dataset.diff;
    dgrid.querySelectorAll('button').forEach(x => x.classList.toggle('chosen', x === b));
  }));
  back.addEventListener('click', () => { status.textContent = ''; showList(); });
  begin.addEventListener('click', () => {
    if (!chosen || !selectedSlot) return;
    // Re-read at the moment of replacement, including changes made in another tab.
    const existing = listSaves().find(s => s.slot === selectedSlot);
    if (existing.occupied) {
      const identity = existing.player ? `${existing.player.name}, level ${existing.player.level}` : `the unreadable save in slot ${selectedSlot}`;
      if (!confirmAction(`Replace ${identity} with a new character? This cannot be undone.`)) return;
    }
    const p = newPlayer(nameInput.value.trim().slice(0, 24) || 'Apprentice', chosen, difficulty);
    if (!save(p, selectedSlot)) { status.textContent = 'Could not save your character. Check browser storage and try again.'; return; }
    setActiveSlot(selectedSlot);
    onStart(p, true);
  });
  showList();
  return { showList };
}
