// Game bootstrap: title screen, NPC conversations, quests and battle hand-off.
import { World } from './world.js';
import { Battle } from './battle.js';
import * as UI from './ui.js';
import { SCHOOLS, PLAYABLE_SCHOOLS, NPCS, QUESTS, RULES } from './data.js';
import {
  newPlayer, load, save, hasSave, clearSave, currentQuest, npcMarker, recordKill,
  questTrackerText, applyReward, gainXp,
} from './state.js';

const $ = (sel) => document.querySelector(sel);
const world = new World($('#game'), $('#labels'));
let player = null;
let battle = null;
let hudTimer = 0;
let saveTimer = 0;

// ------------------------------------------------------------ title screen

function buildTitle() {
  let chosen = null;
  const grid = $('#school-grid');
  grid.innerHTML = PLAYABLE_SCHOOLS.map(id => {
    const s = SCHOOLS[id];
    return `<button class="school-card" data-school="${id}" style="--sc:${s.css}">
      <div class="sc-icon">${s.icon}</div><div class="sc-name">${s.name}</div>
      <div class="sc-desc">${s.desc}</div>
      <div class="sc-stats">❤️ ${s.baseHp} · 🎯 ${Math.round(s.acc * 100)}%</div></button>`;
  }).join('');
  grid.querySelectorAll('.school-card').forEach(b => b.addEventListener('click', () => {
    grid.querySelectorAll('.school-card').forEach(x => x.classList.remove('chosen'));
    b.classList.add('chosen');
    chosen = b.dataset.school;
    $('#begin').disabled = false;
  }));

  const names = ['Ember', 'Nova', 'Rowan', 'Sable', 'Quill', 'Juniper', 'Orin', 'Lyra', 'Cass', 'Wren'];
  const lasts = ['Stormweaver', 'Moonwhisper', 'Brightstaff', 'Ashgrove', 'Starling', 'Frostvale', 'Thornheart'];
  $('#hero-name').value = `${names[Math.floor(Math.random() * names.length)]} ${lasts[Math.floor(Math.random() * lasts.length)]}`;

  $('#begin').addEventListener('click', () => {
    const name = $('#hero-name').value.trim().slice(0, 24) || 'Apprentice';
    if (!chosen) return;
    startGame(newPlayer(name, chosen), true);
  });

  if (hasSave()) {
    const saved = load();
    if (saved) {
      $('#continue').classList.remove('hidden');
      $('#continue').textContent = `Continue as ${saved.name} (Lv ${saved.level})`;
      $('#continue').addEventListener('click', () => startGame(saved, false));
    }
  }
}

function startGame(p, isNew) {
  player = p;
  $('#title').classList.add('hidden');
  world.spawnPlayer(p.school, isNew ? null : p.pos);
  world.mode = 'explore';
  UI.showHUD(true);
  refresh();
  save(player);
  if (isNew) {
    setTimeout(() => UI.dialog('Headmaster Orvyn', 'Headmaster',
      `Welcome, ${p.name}! Walk with W A S D or the arrow keys, or tap the ground. When you see a "!" above someone's head, talk to them with E. Come and find me in front of the Academy!`,
      [{ label: 'Let\'s go!', primary: true }, { label: 'How to play', action: UI.openHelp }]), 700);
  }
}

function refresh() {
  if (!player) return;
  UI.updateHUD(player);
  UI.updateQuest(questTrackerText(player));
  for (const id of Object.keys(NPCS)) world.setNpcMarker(id, npcMarker(player, id));
}

// ------------------------------------------------------------ NPCs

function talk(id) {
  if (!player || world.mode !== 'explore' || UI.isDialogOpen()) return;
  world.moveTarget = null;

  if (id === 'fountain') {
    if (player.hp >= player.maxHp) return UI.dialog('Wellspring', 'Academy Fountain', 'The water shimmers. You already feel full of life.');
    player.hp = player.maxHp;
    world.aura(world.player, 0x7fe3ff);
    refresh();
    return UI.dialog('Wellspring', 'Academy Fountain', 'You drink from the glowing water. Your health is fully restored!');
  }

  const npc = NPCS[id];
  const q = currentQuest(player);
  const extra = [];
  if (npc.service === 'tutor') extra.push({ label: '📚 Learn Spells', action: () => UI.openTutor(player, onChange) });
  if (npc.service === 'shop') extra.push({ label: '🧪 Buy Potions', action: () => UI.openShop(player, onChange) });

  if (q) {
    const talkObjective = q.objective.type === 'talk' && q.objective.npc === id && player.quest.state === 'active';
    if (q.turnIn === id && (player.quest.state === 'ready' || talkObjective)) {
      return UI.dialog(npc.name, npc.title, q.done, [{ label: `Complete: ${q.name}`, primary: true, action: () => completeQuest(q) }]);
    }
    if (q.giver === id && player.quest.state === 'available') {
      return UI.dialog(npc.name, npc.title, q.offer, [
        { label: 'Accept quest', primary: true, action: () => acceptQuest(q) },
        { label: 'Not yet' },
      ]);
    }
    if (q.giver === id && player.quest.state === 'active') {
      return UI.dialog(npc.name, npc.title, `How goes "${q.name}"? ${questTrackerText(player).goal}.`, [...extra, { label: 'Goodbye' }]);
    }
  }
  const line = npc.lines[Math.floor(Math.random() * npc.lines.length)];
  UI.dialog(npc.name, npc.title, line, [...extra, { label: 'Goodbye' }]);
}

function acceptQuest(q) {
  player.quest.state = 'active';
  player.quest.progress = 0;
  UI.toast(`📜 New quest: <b>${UI.esc(q.name)}</b>`, 'quest');
  refresh();
  save(player);
}

function completeQuest(q) {
  const levels = applyReward(player, q.reward);
  const r = q.reward;
  UI.toast(`✅ Quest complete: <b>${UI.esc(q.name)}</b><br>+${r.xp} XP · +${r.gold} gold${r.potions ? ` · +${r.potions} potion` : ''}${r.tp ? ` · +${r.tp} Training Point` : ''}`, 'quest');
  announceLevels(levels);
  player.quest = { index: player.quest.index + 1, state: 'available', progress: 0 };
  if (!QUESTS[player.quest.index]) setTimeout(() => UI.toast('🏆 <b>Chapter 1 complete!</b> You saved Hollow Lane!', 'good'), 800);
  refresh();
  save(player);
}

function announceLevels(levels) {
  if (!levels) return;
  world.aura(world.player, 0xf2c14e);
  UI.toast(`⭐ <b>Level up!</b> You are now level ${player.level}. Visit Mirabel to learn a new spell!`, 'good');
}

function onChange() {
  refresh();
  save(player);
}

// ------------------------------------------------------------ battles

world.onInteract = talk;

world.onEncounter = (entities) => {
  if (!player || battle) return;
  world.mode = 'battle';
  UI.closeDialog();
  UI.closeModal();
  UI.setPrompt('');
  UI.showHUD(false);
  battle = new Battle({ world, player, enemies: entities, onEnd: endBattle });
  battle.run();
};

async function endBattle({ outcome, enemies }) {
  battle = null;
  world.endBattle({ outcome, enemies });
  world.mode = 'locked';

  if (outcome === 'win') {
    let xp = 0, gold = 0;
    const lines = [];
    for (const e of enemies) {
      xp += e.def.xp;
      const g = e.def.gold[0] + Math.floor(Math.random() * (e.def.gold[1] - e.def.gold[0] + 1));
      gold += g;
      if (recordKill(player, e.def.id)) lines.push(`${e.def.name}: ${questTrackerText(player).goal}`);
    }
    player.gold += gold;
    const levels = gainXp(player, xp);
    await UI.resultScreen(`<h2 class="win">Victory!</h2>
      <p class="reward">+${xp} XP &nbsp; · &nbsp; +${gold} 🪙</p>
      ${levels ? `<p class="levelup">⭐ Level up! You are now level ${player.level}.<br>You earned a Training Point.</p>` : ''}
      ${lines.length ? `<p class="qline">📜 ${lines.map(UI.esc).join('<br>')}</p>` : ''}
      ${player.quest.state === 'ready' ? '<p class="qline">Quest ready to turn in!</p>' : ''}`);
    if (levels) world.aura(world.player, 0xf2c14e);
  } else if (outcome === 'lose') {
    player.hp = Math.round(player.maxHp * 0.5);
    await UI.resultScreen(`<h2 class="lose">Defeated</h2>
      <p>You wake up back at Starfall Academy with half your health.</p>
      <p class="tip">Tip: drink from the Wellspring fountain, learn new spells from Mirabel, and buy potions from Madame Fizz.</p>`);
  } else {
    UI.toast('You escaped the duel!');
  }
  world.mode = 'explore';
  UI.showHUD(true);
  refresh();
  save(player);
}

// ------------------------------------------------------------ per-frame upkeep

world.onTick = (dt) => {
  if (!player || world.mode !== 'explore') return;
  // slow health regeneration while exploring
  if (player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.008 * dt);

  hudTimer += dt;
  if (hudTimer > 0.25) {
    hudTimer = 0;
    UI.updateHUD(player);
    const near = UI.isDialogOpen() ? null : world.nearestInteractable();
    UI.setPrompt(near ? `Press E to ${near.id === 'fountain' ? 'use the Wellspring' : `talk to ${NPCS[near.id].name}`}` : '');
  }
  saveTimer += dt;
  if (saveTimer > 5) {
    saveTimer = 0;
    player.pos = { x: world.player.position.x, z: world.player.position.z };
    save(player);
  }
};

window.addEventListener('keydown', (e) => {
  if (!player || e.target instanceof HTMLInputElement) return;
  if (e.code === 'Escape') { UI.closeModal(); UI.closeDialog(); return; }
  if (world.mode !== 'explore' || UI.isDialogOpen()) return;
  if (e.code === 'KeyB') UI.openSpellbook(player, onChange);
  if (e.code === 'KeyH') drinkPotion();
  if (e.key === '?' || e.code === 'F1') { e.preventDefault(); UI.openHelp(); }
});

function drinkPotion() {
  if (player.potions < 1) return UI.toast('You have no potions. Madame Fizz sells them!');
  if (player.hp >= player.maxHp) return UI.toast('You are already at full health.');
  player.potions--;
  player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5);
  world.aura(world.player, 0xff5fa2);
  onChange();
}

$('#btn-book').addEventListener('click', () => world.mode === 'explore' && player && UI.openSpellbook(player, onChange));
$('#btn-potion').addEventListener('click', () => world.mode === 'explore' && player && drinkPotion());
$('#btn-help').addEventListener('click', () => UI.openHelp());
$('#btn-reset').addEventListener('click', () => {
  if (confirm('Start over? This deletes your saved wizard.')) { clearSave(); location.reload(); }
});

// Keep the world from reacting to keys while a menu is open.
setInterval(() => {
  if (!player) return;
  if (world.mode === 'explore' && UI.isDialogOpen()) { world.mode = 'menu'; world.keys = {}; }
  else if (world.mode === 'menu' && !UI.isDialogOpen()) world.mode = 'explore';
}, 100);

// Handy for testing from the browser console.
window.darquest = { world, get player() { return player; }, RULES };

buildTitle();
