// Game bootstrap: title screen, NPC conversations, quests, portals and real-time combat.
import { World } from './world.js';
import { Combat } from './combat.js';
import { Minimap } from './minimap.js';
import * as UI from './ui.js';
import * as Audio from './audio.js';
import {
  SCHOOLS, PLAYABLE_SCHOOLS, NPCS, QUESTS, DIFFICULTIES, FOUNTAINS, PORTALS, ZONES, GEAR, PETS, zoneAt,
} from './data.js';
import {
  newPlayer, load, save, hasSave, clearSave, currentQuest, npcMarker, recordKill,
  questTrackerText, questTarget, applyReward, gainXp, rollLoot,
} from './state.js';

const $ = (sel) => document.querySelector(sel);
const world = new World($('#game'), $('#labels'));
const minimap = new Minimap($('#minimap'), world);
let player = null;
let hudTimer = 0;
let saveTimer = 0;

// ------------------------------------------------------------ title screen

function buildTitle() {
  let chosen = null;
  let difficulty = 'normal';
  const grid = $('#school-grid');
  grid.innerHTML = PLAYABLE_SCHOOLS.map(id => {
    const s = SCHOOLS[id];
    return `<button class="school-card" data-school="${id}" style="--sc:${s.css}">
      <div class="sc-icon">${s.icon}</div><div class="sc-name">${s.name}</div>
      <div class="sc-desc">${s.desc}</div>
      <div class="sc-stats">❤️ ${s.baseHp} · ${s.role}</div></button>`;
  }).join('');
  grid.querySelectorAll('.school-card').forEach(b => b.addEventListener('click', () => {
    grid.querySelectorAll('.school-card').forEach(x => x.classList.remove('chosen'));
    b.classList.add('chosen');
    chosen = b.dataset.school;
    $('#begin').disabled = false;
  }));

  const dgrid = $('#difficulty-grid');
  dgrid.innerHTML = Object.entries(DIFFICULTIES).map(([id, d]) =>
    `<button class="diff-card ${id} ${id === difficulty ? 'chosen' : ''}" data-diff="${id}"><b>${d.icon} ${d.name}</b><span>${d.desc}</span></button>`).join('');
  dgrid.querySelectorAll('.diff-card').forEach(b => b.addEventListener('click', () => {
    dgrid.querySelectorAll('.diff-card').forEach(x => x.classList.remove('chosen'));
    b.classList.add('chosen');
    difficulty = b.dataset.diff;
  }));

  const names = ['Ember', 'Nova', 'Rowan', 'Sable', 'Quill', 'Juniper', 'Orin', 'Lyra', 'Cass', 'Wren'];
  const lasts = ['Stormweaver', 'Moonwhisper', 'Brightstaff', 'Ashgrove', 'Starling', 'Frostvale', 'Thornheart'];
  $('#hero-name').value = `${names[Math.floor(Math.random() * names.length)]} ${lasts[Math.floor(Math.random() * lasts.length)]}`;

  $('#begin').addEventListener('click', () => {
    const name = $('#hero-name').value.trim().slice(0, 24) || 'Apprentice';
    if (!chosen) return;
    startGame(newPlayer(name, chosen, difficulty), true);
  });

  if (hasSave()) {
    const saved = load();
    if (saved) {
      const d = DIFFICULTIES[saved.difficulty];
      $('#continue').classList.remove('hidden');
      $('#continue').textContent = `Continue as ${saved.name} (Lv ${saved.level}${d.hp > 1 ? `, ${d.name}` : ''})`;
      $('#continue').addEventListener('click', () => startGame(saved, false));
    }
  }
}

function startGame(p, isNew) {
  Audio.initAudio();
  player = p;
  $('#title').classList.add('hidden');
  world.spawnPlayer(p, isNew ? null : p.pos);
  world.mode = 'explore';
  combat.setPlayer(p);
  buildHotbar();
  UI.showHUD(true);
  UI.showCombatHUD(true);
  updateMuteButton();
  refresh();
  save(player);
  Audio.setMusic(ZONES[zoneAt(world.player.position.x)].music);
  showZoneName(zoneAt(world.player.position.x));
  if (isNew) {
    const d = DIFFICULTIES[p.difficulty];
    setTimeout(() => UI.dialog('Headmaster Orvyn', 'Headmaster',
      `Welcome, ${p.name}! ${d.hp > 1 ? `You chose ${d.name} difficulty. Brave! ` : ''}Walk with W A S D or the arrow keys, or tap the ground. Fight with keys 1 to 5 and dodge with Space. When you see a "!" above someone's head, talk to them with E. Come and find me in front of the Academy!`,
      [{ label: 'Let\'s go!', primary: true }, { label: 'How to play', action: UI.openHelp }]), 700);
  }
}

function refresh() {
  if (!player) return;
  UI.updateHUD(player);
  UI.updateQuest(questTrackerText(player));
  for (const id of Object.keys(NPCS)) world.setNpcMarker(id, npcMarker(player, id));
  for (const pt of PORTALS) world.setPortalLocked(pt.id, player.quest.index < pt.unlock);
}

function showZoneName(zone) {
  const el = $('#zone-name');
  el.textContent = ZONES[zone].name;
  el.classList.add('show');
  clearTimeout(showZoneName.t);
  showZoneName.t = setTimeout(() => el.classList.remove('show'), 2500);
}

world.onZoneChange = (zone) => {
  if (!player) return;
  showZoneName(zone);
  if (!combat.inCombat) Audio.setMusic(ZONES[zone].music);
};

// Where the quest tracker's star should point on the minimap.
function questTargetPos() {
  const t = questTarget(player);
  if (!t) return null;
  if (t.npc) {
    const n = world.npcs.find(x => x.id === t.npc);
    if (!n) return null;
    const pos = n.model.position;
    // pointing across zones? point to the portal instead
    if (zoneAt(pos.x) !== zoneAt(world.player.position.x)) {
      const pt = PORTALS.find(pt => zoneAt(pt.x) === zoneAt(world.player.position.x));
      return pt ? { x: pt.x, z: pt.z } : null;
    }
    return { x: pos.x, z: pos.z };
  }
  const here = zoneAt(world.player.position.x);
  const p = world.player.position;
  let best = null, bestD = Infinity;
  for (const e of world.enemies) {
    if (e.def.id !== t.enemy) continue;
    if (zoneAt(e.home.x) !== here) {
      const pt = PORTALS.find(pt => zoneAt(pt.x) === here);
      return pt ? { x: pt.x, z: pt.z } : null;
    }
    const d = Math.hypot(e.home.x - p.x, e.home.z - p.z);
    if (d < bestD) { bestD = d; best = { x: e.home.x, z: e.home.z }; }
  }
  return best;
}

// ------------------------------------------------------------ NPCs, fountains, portals

function talk(id) {
  if (!player || world.mode !== 'explore' || UI.isDialogOpen()) return;
  world.moveTarget = null;
  Audio.sfx('click');

  const fountain = FOUNTAINS.find(f => f.id === id);
  if (fountain) {
    if (player.hp >= player.maxHp) return UI.dialog(fountain.name, 'Healing Water', 'The water shimmers. You already feel full of life.');
    player.hp = player.maxHp;
    world.aura(world.player, 0x7fe3ff);
    Audio.sfx('heal');
    refresh();
    return UI.dialog(fountain.name, 'Healing Water', 'You drink the glowing water. Your health is fully restored!');
  }

  const portal = PORTALS.find(pt => pt.id === id);
  if (portal) {
    if (player.quest.index < portal.unlock) {
      return UI.dialog('Spiral Door', 'Ancient Portal', 'The portal hums, but its light is sealed. Perhaps Headmaster Orvyn knows how to open it once you have proven yourself.');
    }
    return UI.dialog('Spiral Door', 'Ancient Portal', `The portal swirls with light. Travel to ${portal.dest}?`, [
      { label: `Travel to ${portal.dest}`, primary: true, action: () => travel(portal) },
      { label: 'Stay here' },
    ]);
  }

  const npc = NPCS[id];
  const q = currentQuest(player);
  const extra = [];
  if (npc.service === 'tutor') extra.push({ label: '📚 Learn Spells', action: () => UI.openTutor(player, onChange) });
  if (npc.service === 'shop') extra.push({ label: '🧪 Potions & Pets', action: () => UI.openShop(player, onChange) });
  if (npc.service === 'gear') extra.push({ label: '🎩 Browse Gear', action: () => UI.openGearShop(player, onChange) });

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

function travel(portal) {
  world.mode = 'locked';
  Audio.sfx('warp');
  $('#fade').classList.add('on');
  setTimeout(() => {
    world.teleport(portal.to);
    player.pos = { x: portal.to.x, z: portal.to.z };
    save(player);
    $('#fade').classList.remove('on');
    world.mode = 'explore';
  }, 650);
}

function acceptQuest(q) {
  player.quest.state = 'active';
  player.quest.progress = 0;
  UI.toast(`📜 New quest: <b>${UI.esc(q.name)}</b>`, 'quest');
  Audio.sfx('quest');
  refresh();
  save(player);
}

function completeQuest(q) {
  const { levels, pet } = applyReward(player, q.reward);
  const r = q.reward;
  UI.toast(`✅ Quest complete: <b>${UI.esc(q.name)}</b><br>+${r.xp} XP · +${r.gold} gold${r.potions ? ` · +${r.potions} potion` : ''}${r.tp ? ` · +${r.tp} Training Point${r.tp > 1 ? 's' : ''}` : ''}`, 'quest');
  Audio.sfx('quest');
  if (pet) {
    world.setPet(player.activePet);
    setTimeout(() => UI.toast(`🐾 New pet: <b>${PETS[pet].name}</b>! Press C to manage pets.`, 'good'), 600);
  }
  announceLevels(levels);
  player.quest = { index: player.quest.index + 1, state: 'available', progress: 0 };
  if (player.quest.index === 7) setTimeout(() => UI.toast('🌀 The <b>Spiral Door</b> in the courtyard has awakened…', 'good'), 1200);
  if (!QUESTS[player.quest.index]) setTimeout(() => UI.toast('🏆 <b>Chapter 2 complete!</b> You are a legend of Starfall!', 'good'), 1200);
  refresh();
  save(player);
}

function announceLevels(levels) {
  if (!levels) return;
  world.aura(world.player, 0xf2c14e);
  Audio.sfx('levelup');
  UI.toast(`⭐ <b>Level up!</b> You are now level ${player.level}. Visit Mirabel to learn a new spell!`, 'good');
}

// Called whenever a menu changes the player. `kind` picks a sound and whether to rebuild the model.
function onChange(kind) {
  if (kind === 'gear' || kind === 'pet') world.spawnPlayer(player);
  buildHotbar();
  if (kind === 'drink') Audio.sfx('drink');
  else if (kind === 'pet') Audio.sfx('pet');
  else if (kind === 'loot' || kind === 'sell') Audio.sfx('loot');
  else if (kind === 'gear') Audio.sfx('buff');
  refresh();
  save(player);
}

// ------------------------------------------------------------ combat

world.onInteract = talk;

const combat = new Combat({
  world,
  onKill: rewardKill,
  onPlayerDeath: playerDefeated,
  onHurt: () => UI.flashHurt(),
  onMessage: (text, cls) => UI.combatMessage(text, cls),
  onCombatChange: (fighting, boss) => {
    Audio.setMusic(fighting ? (boss ? 'boss' : 'battle') : ZONES[zoneAt(world.player.position.x)].music);
    if (fighting && boss) Audio.sfx('boss');
  },
});

function buildHotbar() {
  if (!player) return;
  UI.buildHotbar(player, {
    onSlot: (i) => inExplore() && combat.castSlot(i),
    onDodge: () => inExplore() && combat.dodge(),
    onPotion: () => inExplore() && drinkPotion(),
    onTarget: () => inExplore() && combat.cycleTarget(),
  });
}

// XP, gold, loot and quest progress the moment an enemy falls.
function rewardKill(e) {
  const diff = DIFFICULTIES[player.difficulty];
  const def = e.def;
  const xp = Math.round(def.xp * diff.reward);
  const gold = Math.round((def.gold[0] + Math.floor(Math.random() * (def.gold[1] - def.gold[0] + 1))) * diff.reward);
  player.gold += gold;
  world.float(e.model, `+${xp} XP`, 'xp');
  const quest = recordKill(player, def.id);
  const loot = rollLoot(player, [def]);
  const levels = gainXp(player, xp);
  if (quest) {
    const q = currentQuest(player);
    UI.toast(player.quest.state === 'ready' ? `📜 <b>${UI.esc(q.name)}</b>: ready to turn in!` : `📜 ${UI.esc(questTrackerText(player).goal)}`, 'quest');
    Audio.sfx('quest');
  }
  for (const it of loot.items) UI.toast(`🎁 <b>${UI.esc(GEAR[it.id].name)}</b> ${it.where === 'sold' ? '(bag full: sold)' : '· press C to equip'}`, 'good');
  for (const id of loot.pets) UI.toast(`🐾 New pet: <b>${PETS[id].name}</b>! Press C to summon it.`, 'good');
  if (loot.items.length || loot.pets.length) Audio.sfx('loot');
  if (loot.pets.length) world.setPet(player.activePet);
  if (def.boss) UI.toast(`🏆 <b>${UI.esc(def.name)}</b> is defeated! +${xp} XP · +${gold} gold`, 'good');
  announceLevels(levels);
  refresh();
  save(player);
}

async function playerDefeated() {
  world.mode = 'locked';
  Audio.sfx('defeat');
  const diff = DIFFICULTIES[player.difficulty];
  await new Promise(r => setTimeout(r, 900));
  await UI.resultScreen(`<h2 class="lose">Defeated</h2>
    <p>You wake up back at ${zoneAt(world.player.position.x) === 'emberfall' ? 'the Emberfall camp' : 'Starfall Academy'} with half your health.</p>
    <p class="tip">Tip: dodge (Space) when you see an enemy wind up, heal at a fountain, learn spells from Mirabel, equip better gear (C), and bring potions. ${diff.hp > 1 ? `You are playing on ${diff.name}, so expect every fight to be tough!` : ''}</p>`);
  player.hp = Math.round(player.maxHp * 0.5);
  player.mana = player.maxMana;
  world.respawnPlayer();
  world.mode = 'explore';
  refresh();
  save(player);
}

// ------------------------------------------------------------ per-frame upkeep

world.onTick = (dt) => {
  if (!player || world.mode !== 'explore') return;
  combat.update(dt);
  UI.updateHotbar(combat.hotbar());
  minimap.update(dt, questTargetPos());
  hudTimer += dt;
  if (hudTimer > 0.25) {
    hudTimer = 0;
    UI.updateHUD(player);
    UI.updateTarget(combat.target);
    const near = UI.isDialogOpen() ? null : world.nearestInteractable();
    let text = '';
    if (near) {
      const f = FOUNTAINS.find(x => x.id === near.id);
      const pt = PORTALS.find(x => x.id === near.id);
      text = f ? `Press E to use the ${f.name}` : pt ? 'Press E to use the Spiral Door' : `Press E to talk to ${NPCS[near.id].name}`;
    }
    UI.setPrompt(text);
  }
  saveTimer += dt;
  if (saveTimer > 5) {
    saveTimer = 0;
    player.pos = { x: world.player.position.x, z: world.player.position.z };
    save(player);
  }
};

function updateMuteButton() {
  $('#btn-mute').textContent = Audio.isMuted() ? '🔇' : '🔊';
}

function toggleMute() {
  Audio.initAudio();
  const m = Audio.toggleMute();
  updateMuteButton();
  UI.toast(m ? 'Sound off' : 'Sound on');
}

window.addEventListener('keydown', (e) => {
  if (!player || e.target instanceof HTMLInputElement) return;
  Audio.initAudio();
  if (e.code === 'Escape') { UI.closeModal(); UI.closeDialog(); return; }
  if (e.code === 'KeyM') return toggleMute();
  if (world.mode !== 'explore' || UI.isDialogOpen()) return;
  if (e.code === 'KeyB') UI.openSpellbook(player, onChange);
  if (e.code === 'KeyC' || e.code === 'KeyI') UI.openCharacter(player, onChange);
  if (e.code === 'KeyH') drinkPotion();
  const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(e.code);
  if (n >= 0) combat.castSlot(n);
  if (e.code === 'Space') { e.preventDefault(); combat.dodge(); }
  if (e.code === 'Tab') { e.preventDefault(); combat.cycleTarget(); }
  if (e.key === '?' || e.code === 'F1') { e.preventDefault(); UI.openHelp(); }
});

// A soft click for every button in the game.
document.addEventListener('click', (e) => { if (e.target.closest('.btn, .school-card, .diff-card')) Audio.sfx('click'); });

function drinkPotion() {
  if (combat.drinkPotion()) { refresh(); save(player); }
}

const inExplore = () => world.mode === 'explore' && player;
$('#btn-char').addEventListener('click', () => inExplore() && UI.openCharacter(player, onChange));
$('#btn-book').addEventListener('click', () => inExplore() && UI.openSpellbook(player, onChange));
$('#btn-potion').addEventListener('click', () => inExplore() && drinkPotion());
$('#btn-mute').addEventListener('click', toggleMute);
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
window.darquest = { world, combat, get player() { return player; } };

buildTitle();
