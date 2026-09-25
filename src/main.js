// Game bootstrap: title screen, NPC conversations, quests, portals and real-time combat.
import { World } from './world.js';
import { Combat } from './combat.js';
import { Minimap } from './minimap.js';
import * as UI from './ui.js';
import * as Audio from './audio.js';
import {
  SCHOOLS, PLAYABLE_SCHOOLS, NPCS, QUESTS, DIFFICULTIES, FOUNTAINS, PORTALS, ZONES, GEAR, PETS, RULES, zoneAt, areaAt,
  ENEMIES, NIGHT_SPAWNS, MOUNTS, WAYSTONES, SPAWNS,
} from './data.js';
import { openAtlas, openStable, openInn, openArena, openUndercroft } from './ui_world.js';
import { Companion, COMPANIONS } from './companions.js';
import { ARENA_X, ARENA_RANKS, arenaRewards } from './arena.js';
import { checkAchievements, hunterBonus, displayName } from './achievements.js';
import { assignTask, slayerKill, slayerBonus } from './slayer.js';
import { openJournal, openSlayer } from './ui_journal.js';
import { WEATHER_INFO } from './sky.js';
import {
  newPlayer, load, save, clearSave, currentQuest, npcMarker, recordKill,
  questTrackerText, questTarget, applyReward, gainXp, rollLoot,
  setSlot, getSlot, listSlots, exportSave, importSave, recalc, giveItem, setRunHp, givePet, recordShout,
  storyIndex, atCap, ARCH_MAX,
} from './state.js';
import { weekly, isDone as challengeDone, weeklyReward, CHALLENGES } from './challenges.js';
import { Rift, UPGRADES } from './rift.js';
import { Undercroft, clock } from './dungeon.js';
import { makeChest } from './models.js';
import * as RU from './ui_rift.js';
import { SHOUTS, castShout, learnWord, shoutWords } from './shouts.js';
import { WORD_WALLS } from './maps.js';
import { openShouts } from './ui_dragon.js';
import { itemName, itemColor, craftRarity, rollRarity, RARITIES } from './gear.js';
import { Homestead, BLOCK_IDS, BLOCKS, HOME_X } from './homestead.js';
import { settings, actionOf, onSettings, keyFor, keyLabel } from './settings.js';
import { Gatherer } from './skilling.js';
import { SKILLS, STATION_TYPES, skillLevel, craftOnce } from './skills.js';
import { ITEMS, BUFFS, removeItem, pickFood } from './items.js';
import { npcSideQuests, accept as acceptSideQuest, complete as completeSideQuest, sideEvent, rewardText, goalText } from './sidequests.js';
import * as SK from './ui_skills.js';

const $ = (sel) => document.querySelector(sel);
const world = new World($('#game'), $('#labels'));
const minimap = new Minimap($('#minimap'), world);
let player = null;
let hudTimer = 0;
let achTimer = 0;
let saveTimer = 0;
let eatReady = 0;
let area = null;

// ------------------------------------------------------------ title screen

let newSlot = 0;

function timeAgo(ms) {
  if (!ms) return '';
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hour${h > 1 ? 's' : ''} ago`;
  return `${Math.round(h / 24)} days ago`;
}

function renderSlots() {
  const slots = listSlots();
  $('#slots').innerHTML = slots.map(({ i, p }) => {
    if (!p) return `<div class="slot-card empty"><div class="slot-num">${i + 1}</div>
      <div class="slot-info"><b>Empty slot</b><span>Start a new wizard here</span></div>
      <div class="slot-btns"><button class="btn primary" data-new="${i}">New game</button></div></div>`;
    const sc = SCHOOLS[p.school], d = DIFFICULTIES[p.difficulty];
    const q = QUESTS[p.quest?.index];
    return `<div class="slot-card" style="--sc:${sc.css}"><div class="slot-num">${i + 1}</div>
      <div class="slot-info"><b>${UI.esc(p.name)}</b><span>${sc.icon} ${sc.name} · Level ${p.level} · ${d.icon} ${d.name}</span>
      <small>${q ? UI.esc(q.name) : 'Main story complete'}${p.savedAt ? ' · ' + timeAgo(p.savedAt) : ''}</small></div>
      <div class="slot-btns"><button class="btn primary" data-play="${i}">Play</button>
      <button class="btn small" data-export="${i}" title="Export this save to a file">📤</button>
      <button class="btn small danger" data-del="${i}" title="Delete this wizard">🗑️</button></div></div>`;
  }).join('');
  $('#slots').querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.play;
    setSlot(i);
    const p = load(i);
    if (p) startGame(p, false);
  }));
  $('#slots').querySelectorAll('[data-new]').forEach(b => b.addEventListener('click', () => showNewGame(+b.dataset.new)));
  $('#slots').querySelectorAll('[data-export]').forEach(b => b.addEventListener('click', () => {
    const p = load(+b.dataset.export);
    if (p) UI.downloadText(`darquest-${p.name.replace(/\W+/g, '_')}-lv${p.level}.json`, exportSave(p));
  }));
  $('#slots').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.del;
    const p = load(i);
    if (p && confirm(`Delete ${p.name} (level ${p.level}) forever? Export them first if you might want them back.`)) { clearSave(i); renderSlots(); }
  }));
  if (!slots.some(s => s.p)) showNewGame(0);
}

function showNewGame(i) {
  newSlot = i;
  $('#ng-slot').textContent = `Slot ${i + 1}`;
  $('.new-game').classList.remove('hidden');
  $('.new-game').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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
    if (load(newSlot) && !confirm('This slot already has a wizard. Replace them?')) return;
    setSlot(newSlot);
    startGame(newPlayer(name, chosen, difficulty), true);
  });
  $('#ng-cancel').addEventListener('click', () => $('.new-game').classList.add('hidden'));
  $('#title-settings').addEventListener('click', () => UI.openSettings());
  $('#title-import').addEventListener('click', async () => {
    const text = await UI.pickFile();
    if (!text) return;
    try {
      const p = importSave(text);
      const free = listSlots().find(s => !s.p);
      const i = free ? free.i : getSlot();
      if (!free && !confirm(`All slots are full. Replace slot ${i + 1} with ${p.name}?`)) return;
      setSlot(i);
      save(p);
      renderSlots();
      UI.toast(`📥 Imported <b>${UI.esc(p.name)}</b> into slot ${i + 1}`, 'good');
    } catch (err) {
      UI.toast(`Could not import: ${UI.esc(err.message)}`);
    }
  });
  renderSlots();
}

function startGame(p, isNew) {
  Audio.initAudio();
  player = p;
  if (p.pos && ['rift', 'arena', 'undercroft'].includes(zoneAt(p.pos.x))) p.pos = null;
  if (p.rift?.run) {
    const kept = Math.floor((p.rift.run.shards || 0) / 2);
    p.rift.shards += kept;
    p.rift.best = Math.max(p.rift.best, p.rift.run.floor || 0);
    p.rift.run = null;
    setTimeout(() => UI.toast(`🌀 Your last Rift run was interrupted on floor ${p.rift.best}. You kept ${kept} 🔮.`, 'good'), 1500);
  }
  $('#title').classList.add('hidden');
  $('#joystick').classList.toggle('hidden', !matchMedia('(pointer: coarse)').matches);
  world.spawnPlayer(p, isNew ? null : p.pos);
  world.mode = 'explore';
  combat.setPlayer(p);
  buildHotbar();
  UI.showHUD(true);
  UI.showCombatHUD(true);
  updateMuteButton();
  refresh();
  save(player);
  area = null;
  checkArea();
  showZoneName(area.name);
  homestead.load(p);
  world.skyCycle.time = p.clock ?? 0.32;
  if (p.companion) companion.spawn(p.companion);
  if (isNew) {
    const d = DIFFICULTIES[p.difficulty];
    setTimeout(() => UI.dialog('Headmaster Orvyn', 'Headmaster',
      `Welcome, ${p.name}! ${d.hp > 1 ? `You chose ${d.name} difficulty. Brave! ` : ''}Walk with W A S D (drag the mouse to look around), or tap the ground. Fight with keys 1 to 5 and dodge with Space: when you see red on the ground, get out of it! When you see a "!" above someone's head, talk to them with E. Press Esc for the menu and settings. Come and find me in front of the Academy!`,
      [{ label: 'Let\'s go!', primary: true }, { label: 'How to play', action: UI.openHelp }]), 700);
  }
}

function refresh() {
  if (!player) return;
  UI.updateHUD(player);
  UI.updateQuest(questTrackerText(player));
  const task = player.slayer.task;
  $('#side-tracker').innerHTML = SK.sideTrackerHTML(player) + (task ? `<div class="side-track"><b>💀 Slayer</b> · ${UI.esc(ENEMIES[task.enemy].name)} ${task.done}/${task.count}</div>` : '');
  for (const id of Object.keys(NPCS)) {
    let marker = npcMarker(player, id), side = false;
    if (!marker) {
      const sq = npcSideQuests(player, id);
      if (sq.ready.length) { marker = '?'; side = true; } else if (sq.offers.length) { marker = '!'; side = true; }
    }
    world.setNpcMarker(id, marker, side);
  }
  for (const pt of PORTALS) world.setPortalLocked(pt.id, storyIndex(player) < pt.unlock);
  for (const ws of WAYSTONES) world.waystoneModels[ws.id]?.userData.setActive(player.waystones.includes(ws.id));
  for (const w of WORD_WALLS) {
    const known = shoutWords(player, w.shout) > 0;
    w.model?.userData.setLearned?.(known);
    w.label?.el.classList.toggle('learned', known);
  }
  SK.updateBuffs(player);
}

function showZoneName(zone) {
  const el = $('#zone-name');
  el.textContent = ZONES[zone]?.name || zone;
  el.classList.add('show');
  clearTimeout(showZoneName.t);
  showZoneName.t = setTimeout(() => el.classList.remove('show'), 2500);
}

// Named areas (zones and the places inside them) get a title card and their own music.
function checkArea() {
  const a = areaAt(world.player.position.x, world.player.position.z);
  if (area && a.id === area.id) return;
  const first = !area;
  area = a;
  if (!first) showZoneName(a.name);
  if (!combat.inCombat) Audio.setMusic(a.music);
}

// Where the quest tracker's star should point on the minimap.
function questTargetPos() {
  const t = questTarget(player);
  if (!t) return null;
  const here = zoneAt(world.player.position.x);
  // the target is in another zone: point at the portal that leads there (or home first)
  const via = (x) => {
    const zone = zoneAt(x);
    if (zone === here) return null;
    const pt = PORTALS.find(pt => zoneAt(pt.x) === here && zoneAt(pt.to.x) === zone) || PORTALS.find(pt => zoneAt(pt.x) === here);
    return pt ? { x: pt.x, z: pt.z } : null;
  };
  if (t.shout) {
    const w = WORD_WALLS.find(x => x.shout === t.shout);
    return via(w.x) || { x: w.x, z: w.z };
  }
  if (t.npc) {
    const n = world.npcs.find(x => x.id === t.npc);
    if (!n) return null;
    const pos = n.model.position;
    return via(pos.x) || { x: pos.x, z: pos.z };
  }
  const p = world.player.position;
  let best = null, bestD = Infinity;
  for (const e of world.enemies) {
    if (e.def.id !== t.enemy) continue;
    if (zoneAt(e.home.x) !== here) return via(e.home.x);
    const d = Math.hypot(e.home.x - p.x, e.home.z - p.z);
    if (d < bestD) { bestD = d; best = { x: e.home.x, z: e.home.z }; }
  }
  return best;
}

// ------------------------------------------------------------ NPCs, fountains, portals

function talk(id) {
  if (!player || world.mode !== 'explore' || UI.isDialogOpen()) return;
  world.moveTarget = null;
  if (id.startsWith('node:')) {
    const node = world.nodes[+id.slice(5)];
    world.dismount();
    if (gatherer.active?.node !== node) gatherer.start(node);
    return;
  }
  if (id.startsWith('station:')) {
    Audio.sfx('click');
    gatherer.stop();
    SK.openCrafting(player, world.stations[+id.slice(8)].type, craft);
    return;
  }
  if (onExtraInteract?.(id)) return;
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
    if (storyIndex(player) < portal.unlock) {
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
  if (npc.service === 'gear') extra.push({ label: '🎩 Browse Gear', action: () => UI.openGearShop(player, onChange, npc.stock, `🎩 ${npc.name}`) });
  if (npc.service === 'bank') extra.push({ label: '🏦 Bank', action: () => UI.openBank(player, onChange) });
  if (npc.service === 'guild') extra.push({ label: '🌾 Tools & Trading', action: () => SK.openGuildShop(player, onChange) });
  for (const svc of extraServices) if (svc.npc === id && (!svc.when || svc.when())) extra.push({ label: svc.label, action: svc.action });
  const side = npcSideQuests(player, id);

  if (q) {
    const talkObjective = q.objective.type === 'talk' && q.objective.npc === id && player.quest.state === 'active';
    if (q.turnIn === id && (player.quest.state === 'ready' || talkObjective)) {
      return UI.dialog(npc.name, npc.title, q.done, [{ label: `Complete: ${q.name}`, primary: true, action: () => completeQuest(q) }]);
    }
  }
  if (side.ready.length) {
    const sq = side.ready[0];
    return UI.dialog(npc.name, npc.title, sq.done, [{ label: `Complete: ${sq.name}`, primary: true, action: () => completeSide(sq) }]);
  }
  if (q && q.giver === id && player.quest.state === 'available') {
    return UI.dialog(npc.name, npc.title, q.offer, [
      { label: 'Accept quest', primary: true, action: () => acceptQuest(q) },
      { label: 'Not yet' },
    ]);
  }
  if (side.offers.length) {
    const sq = side.offers[0];
    return UI.dialog(npc.name, npc.title, `${sq.offer}\n\nReward: ${rewardText(sq)}`, [
      { label: `Accept: ${sq.name}`, primary: true, action: () => acceptSide(sq) }, ...extra, { label: 'Not now' },
    ]);
  }
  if (q && q.giver === id && player.quest.state === 'active') {
    return UI.dialog(npc.name, npc.title, `How goes "${q.name}"? ${questTrackerText(player).goal}.`, [...extra, { label: 'Goodbye' }]);
  }
  if (side.active.length) {
    const sq = side.active[0];
    return UI.dialog(npc.name, npc.title, `How goes "${sq.name}"? ${goalText(player, sq)}.`, [...extra, { label: 'Goodbye' }]);
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
  if (player.quest.index === 37) setTimeout(() => UI.toast('🌳 <b>Chapter 6: The Blighted Heart.</b> A vine-wrapped Spiral Door has opened on the east side of the courtyard: Thornwood awaits.', 'good'), 1800);
  if (player.quest.index === 30) setTimeout(() => UI.toast('⚡ <b>Chapter 5: Eye of the Storm.</b> A crackling Spiral Door has opened in the north-west of the courtyard: Stormspire awaits.', 'good'), 1800);
  if (player.quest.index === 23) setTimeout(() => UI.toast('❄️ <b>Chapter 4: The Frozen Crown.</b> A Spiral Door in the courtyard has frozen over: Glacierreach awaits.', 'good'), 1800);
  if (player.quest.index === 14) setTimeout(() => UI.toast('🐉 <b>Chapter 3: Wings of Ruin.</b> A new Spiral Door has opened in the courtyard: the Dragonspire Peaks await.', 'good'), 1800);
  if (q.reward.voice) setTimeout(() => UI.toast('🗣️ You have the <b>Voice</b>. Read Word Walls to learn dragon shouts!', 'good'), 1200);
  if (!QUESTS[player.quest.index]) {
    player.storyMax = Math.max(player.storyMax || 0, QUESTS.length);
    setTimeout(() => UI.toast(`🏆 <b>Main story complete${player.ngplus ? ` (New Game+ ${player.ngplus})` : ''}!</b> You are a legend of Starfall. Talk to Headmaster Orvyn about <b>New Game+</b> when you are ready.`, 'good'), 1200);
  }
  player.storyMax = Math.max(player.storyMax || 0, player.quest.index);
  refresh();
  save(player);
}

function acceptSide(sq) {
  acceptSideQuest(player, sq);
  UI.toast(`📋 Side quest: <b>${UI.esc(sq.name)}</b>`, 'quest');
  Audio.sfx('quest');
  refresh();
  save(player);
}

function completeSide(sq) {
  const { skillLevels } = completeSideQuest(player, sq);
  const r = sq.reward || {};
  player.gold += r.gold || 0;
  player.tp += r.tp || 0;
  for (const id of r.gear || []) giveItem(player, id);
  const levels = gainXp(player, r.xp || 0);
  UI.toast(`✅ <b>${UI.esc(sq.name)}</b> complete!<br>${UI.esc(rewardText(sq))}`, 'quest');
  Audio.sfx('quest');
  for (const s of skillLevels) announceSkill(s);
  announceLevels(levels);
  refresh();
  save(player);
}

function announceSkill(skill) {
  const sk = SKILLS[skill];
  world.aura(world.player, 0x7fd8ff);
  Audio.sfx('skill');
  UI.toast(`🎉 ${sk.icon} <b>${sk.name}</b> is now level <b>${skillLevel(player, skill)}</b>!`, 'good');
}

// Side-quest progress from gathering, crafting or fighting.
function sideProgress(type, key) {
  for (const q of sideEvent(player, type, key)) {
    UI.toast(`📋 <b>${UI.esc(q.name)}</b>: ready to hand in to ${UI.esc(NPCS[q.turnIn].name)}!`, 'quest');
    Audio.sfx('quest');
  }
}

function craft(r, n) {
  const skill = STATION_TYPES[r.station].skill;
  let made = 0, burnt = 0, levels = 0;
  const crafted = [];
  for (let i = 0; i < n; i++) {
    if (r.out.potions && player.potions >= RULES.maxPotions) { UI.toast('You can only carry 5 healing potions.'); break; }
    if (r.out.gear && player.inventory.length >= RULES.inventoryMax) { UI.toast('Your gear backpack is full!'); break; }
    const res = craftOnce(player, r);
    if (!res.ok) break;
    levels += res.levels;
    if (res.burnt) { burnt++; continue; }
    made++;
    if (r.out.gear) crafted.push(giveItem(player, r.out.gear, craftRarity(skillLevel(player, skill) - r.level)).inst);
    if (r.out.potions) player.potions++;
    sideProgress('craft', r.id);
  }
  if (!made && !burnt) return;
  player.stats_log.crafted += made;
  const name = r.out.item ? ITEMS[r.out.item].name : r.out.gear ? GEAR[r.out.gear].name : 'Healing Potion';
  UI.toast(made ? `${SKILLS[skill].icon} Made ${made}× <b>${UI.esc(name)}</b>${burnt ? ` · ${burnt} burnt` : ''}${r.out.gear ? ' · press C to equip' : ''}` : '🔥 Oops, you burnt it!', made ? 'good' : '');
  for (const inst of crafted.filter(x => x.r !== 'common')) UI.toast(`✨ Masterwork! <b style="color:${itemColor(inst)}">${UI.esc(itemName(inst))}</b> (${RARITIES[inst.r].label})`, 'good');
  Audio.sfx(made ? 'craft' : 'fail');
  world.castPose(world.player);
  const pp = world.player.position;
  world.puff(pp.x, 1.2, pp.z, SCHOOLS[player.school].color, 10, 3);
  if (levels) announceSkill(skill);
  refresh();
  save(player);
}

// Eats food: the best fit for your missing health, or a specific item from the bag.
function eat(item = null) {
  const food = item || pickFood(player);
  if (!food) return UI.combatMessage('You have no food. Catch fish and cook them at a range!');
  if (player.hp >= player.maxHp && !food.regen) return UI.combatMessage('You are already at full health.');
  if (world.time < eatReady) return;
  eatReady = world.time + 1.6;
  removeItem(player, food.id);
  combat.healHero(food.heal);
  if (food.regen) player.buffs.regen = BUFFS.regen.dur;
  Audio.sfx('eat');
  world.float(world.player, `🍴 ${food.name}`, 'status');
  refresh();
  save(player);
}

function useItem(id) {
  const it = ITEMS[id];
  if (!it || !player.bag[id]) return;
  if (it.type === 'food') return eat(it);
  if (it.use === 'mana') {
    if (player.mana >= player.maxMana) return UI.toast('Your mana is already full.');
    player.mana = Math.min(player.maxMana, player.mana + player.maxMana * it.amount);
    world.aura(world.player, 0x3a7ae0);
  } else if (it.use === 'heal') {
    if (player.hp >= player.maxHp) return UI.toast('You are already at full health.');
    combat.healHero(player.maxHp * it.amount);
    world.aura(world.player, 0xff5fa2);
  } else if (it.use === 'buff') {
    const b = BUFFS[it.buff];
    player.buffs[it.buff] = b.dur;
    recalc(player);
    world.aura(world.player, 0xf2c14e);
    UI.toast(`${b.icon} <b>${b.name}</b> for ${Math.round(b.dur / 60)} minutes`, 'good');
  } else return;
  removeItem(player, id);
  Audio.sfx('drink');
  refresh();
  save(player);
}

function announceLevels(levels) {
  const arch = player.archPending || 0;
  player.archPending = 0;
  if (!levels && !arch) return;
  if (levels && (settings.worldScaling || player.ngplus)) rescaleFoes();
  world.aura(world.player, 0xf2c14e);
  Audio.sfx('levelup');
  if (levels) UI.toast(atCap(player)
    ? `🌟 <b>Level ${player.level}: the level cap!</b> From now on, experience earns <b>Archmage ranks</b> (+1% damage and health each).`
    : `⭐ <b>Level up!</b> You are now level ${player.level}. +1 Training Point (Mirabel) and +1 Talent Point (C → Talents)!`, 'good');
  if (arch) UI.toast(`✦ <b>Archmage rank ${player.arch}</b>${player.arch >= ARCH_MAX ? ' (the highest!)' : ''}: +${player.arch}% damage and health.`, 'good legendary');
}

// Called whenever a menu changes the player. `kind` picks a sound and whether to rebuild the model.
function onChange(kind) {
  if (kind === 'gear' || kind === 'pet') world.spawnPlayer(player);
  if (kind === 'talent') { recalc(player); Audio.sfx('buff'); world.aura(world.player, 0xf2c14e); }
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
  onHurt: () => { UI.flashHurt(); gatherer.stop(); if (world.dismount()) UI.combatMessage('You were knocked off your mount!'); },
  onMessage: (text, cls) => UI.combatMessage(text, cls),
  onCombatChange: (fighting, boss) => {
    Audio.setMusic(fighting ? (boss ? 'boss' : 'battle') : areaAt(world.player.position.x, world.player.position.z).music);
    if (fighting) { gatherer.stop(); world.dismount(); }
    if (fighting && boss) Audio.sfx('boss');
  },
});

const gatherer = new Gatherer({
  world,
  getPlayer: () => player,
  onMessage: (text) => UI.combatMessage(text),
  onGain: (def, levels, gem) => {
    sideProgress('gather', def.item);
    if (gem) { UI.toast(`💎 You found a <b>${ITEMS[gem].name}</b>!`, 'good'); Audio.sfx('loot'); }
    if (levels) announceSkill(def.skill);
    refresh();
  },
});

// Later systems (dungeons, shouts, building...) can add their own interactables and NPC services.
const extraServices = [];

// ------------------------------------------------------------ the Endless Rift

function fadeThen(fn) {
  world.mode = 'locked';
  $('#fade').classList.add('on');
  setTimeout(() => {
    fn();
    $('#fade').classList.remove('on');
    world.mode = 'explore';
  }, 650);
}

function applyRunMods() {
  const m = rift.mods();
  combat.runMods = m;
  setRunHp(m?.hp || 0);
  if (player) {
    const frac = player.hp / player.maxHp;
    recalc(player);
    player.hp = Math.max(1, Math.min(player.maxHp, Math.round(player.maxHp * frac)));
  }
}

const rift = new Rift({
  world, combat,
  getPlayer: () => player,
  hooks: {
    toast: (t, c) => UI.toast(t, c),
    message: (t) => UI.combatMessage(t),
    sfx: (n) => Audio.sfx(n),
    fade: fadeThen,
    onMods: applyRunMods,
    giveGear: (id, floor = 1) => { const r = giveItem(player, id, rollRarity(0.3 + floor * 0.04)); return `<span style="color:${itemColor(r.inst)}">${UI.esc(itemName(r.inst))}</span>`; },
    openBoons: (choices, opts) => RU.openBoonChoice(choices, opts),
    openMerchant: (pr) => RU.openMerchant(player, pr, rift.run.floor, { onBuyBoon: (id) => { rift.grantBoon(id); refresh(); }, onChange: () => { refresh(); save(player); } }),
    onFloor: (floor, boss) => {
      showZoneName(boss ? `Floor ${floor} · Guardian` : `Floor ${floor}`);
      Audio.sfx(boss ? 'boss' : 'warp');
      refresh();
    },
    leave: () => fadeThen(async () => {
      const summary = rift.end('exit');
      world.teleport({ x: 17, z: 12, heading: Math.PI });
      save(player);
      setTimeout(() => UI.resultScreen(RU.runSummaryHTML(summary)).then(() => refresh()), 400);
    }),
  },
});

// ------------------------------------------------------------ the Hollow Undercroft (dungeon)

const LANE_END = { x: 2.4, z: 118, heading: Math.PI };
const undercroft = new Undercroft({
  world, combat,
  getPlayer: () => player,
  hooks: {
    toast: (t, c) => UI.toast(t, c),
    message: (t) => UI.combatMessage(t),
    sfx: (n) => Audio.sfx(n),
    giveGear: (id, rarity) => { const r = giveItem(player, id, rarity); return `<span style="color:${itemColor(r.inst)}">${UI.esc(itemName(r.inst))}</span>${r.where === 'sold' ? ' (bag full: sold)' : ''}`; },
    openEntrance: () => openUndercroftDoor(),
    leave: () => fadeThen(() => {
      undercroft.end('leave');
      world.teleport(LANE_END);
      area = null;
      checkArea();
      save(player);
      UI.toast('You climb back up the crypt stair. The Undercroft resets behind you.');
    }),
    onClear: (summary, lines) => {
      const u = player.undercroft;
      const key = summary.heroic ? 'bestHeroic' : 'best';
      const newBest = !u[key] || summary.time < u[key];
      if (newBest) u[key] = Math.round(summary.time);
      if (summary.heroic) u.heroicClears++; else u.clears++;
      const xp = Math.round((summary.heroic ? 1.6 : 1) * (300 + player.level * 90));
      const levels = gainXp(player, xp);
      Audio.sfx('chest');
      fadeThen(() => {
        world.teleport(LANE_END);
        area = null;
        checkArea();
        save(player);
        setTimeout(() => UI.resultScreen(`<h2 class="win">🏆 The Undercroft is conquered!</h2>
          <p>${summary.heroic ? '<b>Heroic</b> clear' : 'Cleared'} in <b>${clock(summary.time)}</b>${newBest ? ' · <b>new best time!</b>' : ''} · ${summary.kills} foes defeated</p>
          <p>+${xp} XP · ${lines.join(' · ')}</p>
          ${summary.heroic ? '' : '<p class="tip">Heroic mode is now open: tougher guardians, better loot (epic and legendary).</p>'}`).then(() => { announceLevels(levels); refresh(); }), 400);
      });
    },
  },
});

function undercroftUnlocked() { return storyIndex(player) >= 7 || player.level >= 10; }

function openUndercroftDoor() {
  if (!undercroftUnlocked()) { UI.combatMessage('The crypt door is sealed with Hollowmere\'s mark. Defeat Lord Hollowmere first.'); Audio.sfx('fail'); return; }
  Audio.sfx('click');
  openUndercroft(player, {
    level: Math.max(10, player.level),
    onEnter: (heroic) => fadeThen(() => {
      gatherer.stop();
      if (world.mounted) world.dismount?.();
      undercroft.start(heroic);
      area = null;
      checkArea();
      showZoneName(heroic ? 'The Hollow Undercroft · Heroic' : 'The Hollow Undercroft');
      refresh();
      save(player);
    }),
  });
}

// ------------------------------------------------------------ world scaling & New Game+

// Ordinary foes grow with you when World Scaling is on (Settings → Gameplay), and always in New Game+.
combat.scaling = (def) => {
  if (!player) return null;
  const ng = player.ngplus || 0;
  if (!settings.worldScaling && !ng) return null;
  const eff = Math.max(def.level, player.level - 1) + ng * 2;
  const k = Math.max(0, eff - def.level);
  if (!k && !ng) return null;
  return {
    level: eff,
    hp: (1 + k * 0.12) * (1 + ng * 0.25),
    dmg: (1 + k * 0.075) * (1 + ng * 0.15),
    xp: (1 + k * 0.09) * (1 + ng * 0.25),
    gold: 1 + k * 0.06 + ng * 0.25,
  };
};

// Re-scales foes that are not fighting (after a level up or a settings change).
function rescaleFoes() {
  for (const e of world.enemies) if (e.hp !== undefined && e.state === 'idle' && e.hp === e.maxHp) combat.initEnemy(e);
}
onSettings((k) => { if (k === 'worldScaling' && player) rescaleFoes(); });

function storyDone() { return player.quest.index >= QUESTS.length; }

function openNewGamePlus() {
  const next = (player.ngplus || 0) + 1;
  UI.openModal(`⭐ New Game+ ${next}`, `<p class="modal-note">You have finished the whole story. Headmaster Orvyn can turn back the pages of the <b>Starfall Chronicle</b> so you can live it again, stronger.</p>
    <div class="journal-q main"><b>You keep everything:</b> level, gear, skills, spells, talents, pets, mounts, shouts, your Homestead, every door you opened.
      <br><b>The story restarts</b> from Chapter 1.
      <br><b>Every foe grows with you</b>: level ${player.level}+${next * 2}, +${next * 25}% health and +${next * 15}% damage on top.
      <br><b>Better rewards</b>: +${next * 25}% XP, gold and drop chance, and rarer gear.</div>
    <p><button class="btn primary big" id="ngp-go">⭐ Begin New Game+ ${next}</button></p>`, (body) => {
    body.querySelector('#ngp-go').addEventListener('click', () => {
      UI.closeModal();
      player.storyMax = Math.max(player.storyMax || 0, QUESTS.length);
      player.ngplus = next;
      player.quest = { index: 0, state: 'available', progress: 0 };
      world.aura(world.player, 0xf2c14e);
      world.shake(0.4);
      Audio.sfx('levelup');
      for (const e of world.enemies) if (e.hp !== undefined && e.state !== 'dead' && !e.def.rift && !e.def.dungeon) combat.initEnemy(e);
      UI.toast(`⭐ <b>New Game+ ${next}</b> begins! The Chronicle starts over, and the world has grown stronger.`, 'good legendary');
      refresh();
      save(player);
    });
  });
}
extraServices.push({ npc: 'orvyn', label: '⭐ New Game+', when: () => storyDone(), action: openNewGamePlus });

// Weekly challenges: a toast when one is finished (claim it in the Journal).
function checkWeekly() {
  const w = weekly(player);
  for (const ch of w.list) {
    if (ch.claimed || ch.told || !challengeDone(player, ch)) continue;
    ch.told = true;
    UI.toast(`📅 <b>Weekly challenge complete: ${UI.esc(CHALLENGES[ch.id].name)}</b><br>Claim your reward in the Journal (J → Weekly).`, 'quest');
    Audio.sfx('quest');
  }
}

function claimWeekly(i) {
  const w = weekly(player);
  const ch = w.list[i];
  if (!ch || ch.claimed || !challengeDone(player, ch)) return;
  ch.claimed = true;
  const r = weeklyReward(player);
  player.gold += r.gold;
  const levels = gainXp(player, r.xp);
  const pool = Object.values(GEAR).filter(g => g.level <= player.level + 1 && g.level >= player.level - 8);
  const g = pool[Math.floor(Math.random() * pool.length)] || GEAR.sprigwood_wand;
  const got = giveItem(player, g.id, Math.random() < 0.3 ? 'legendary' : 'epic');
  const lines = [`+${r.gold} gold`, `+${r.xp} XP`, `🎁 <span style="color:${itemColor(got.inst)}">${UI.esc(itemName(got.inst))}</span>`];
  if (!w.bonus && w.list.every(c => c.claimed)) {
    w.bonus = true;
    player.stats_log.weeklyAll = (player.stats_log.weeklyAll || 0) + 1;
    const bonus = giveItem(player, (pool[Math.floor(Math.random() * pool.length)] || g).id, 'legendary');
    player.gold += r.gold * 2;
    lines.push(`<br>🌟 <b>All three done!</b> Bonus: +${r.gold * 2} gold and <span style="color:${itemColor(bonus.inst)}">${UI.esc(itemName(bonus.inst))}</span>`);
  }
  UI.toast(`📅 <b>${UI.esc(CHALLENGES[ch.id].name)}</b> claimed!<br>${lines.join(' · ')}`, 'good legendary');
  Audio.sfx('chest');
  announceLevels(levels);
  refresh();
  save(player);
}

combat.onRevive = () => {
  if (!rift.active) return null;
  const m = rift.mods();
  if (m.revive > 0) { rift.run.revivesUsed++; applyRunMods(); return 'phoenix'; }
  if (rift.run.secondWind) { rift.run.secondWind = false; return 'secondwind'; }
  return null;
};

function riftUnlocked() { return storyIndex(player) >= 2 || player.level >= 3; }

function openRiftKeeper() {
  RU.openRiftKeeper(player, {
    unlocked: riftUnlocked(),
    onEnter: () => fadeThen(() => {
      gatherer.stop();
      rift.start();
      area = null;
      checkArea();
      refresh();
      save(player);
    }),
    onBuy: (id) => {
      const pet = UPGRADES[id].pet;
      if (pet && givePet(player, pet)) { world.setPet(player.activePet); UI.toast(`🐾 <b>${PETS[pet].name}</b> joins you! Press C to summon it.`, 'good'); }
      Audio.sfx('shrine');
      refresh();
      save(player);
    },
  });
}

extraServices.push({ npc: 'nyx', label: '🌀 The Endless Rift', action: openRiftKeeper });
world.extraInteractables = [...(world.extraInteractables || []), () => (player && !rift.active ? [{ id: 'x:riftgate', x: 21, z: 17, r: 4, label: 'enter the Endless Rift' }] : [])];

// ------------------------------------------------------------ dragon shouts

world.extraInteractables.push(() => WORD_WALLS.map(w => ({ id: 'x:wall:' + w.id, x: w.x, z: w.z, r: 4.6, label: 'read the Word Wall' })));

function readWall(w) {
  const s = SHOUTS[w.shout];
  if (!player.dragon.voice) return UI.dialog('Word Wall', 'Ancient runes', 'The claw-marked runes glow faintly, but their meaning slips away from you. Perhaps someone in the Dragonspire Peaks can teach you to hear the Voice in the stone.');
  if (shoutWords(player, w.shout) > 0) return UI.dialog('Word Wall', s.name, `The wall is quiet. You already know ${s.words[0]} (${s.meaning[0]}). Dragon souls can teach you its deeper words.`);
  learnWord(player, w.shout);
  world.soulFx(w.model, s.color);
  Audio.sfx('shout');
  world.float(world.player, s.words[0], 'shout');
  UI.toast(`🐉 Word of Power: <b>${s.words[0]}</b> (${s.meaning[0]})<br>You learned <b>${s.name}</b>! Press ${keyLabel(keyFor('shout'))} to shout.`, 'good');
  if (recordShout(player, w.shout)) {
    UI.toast(`📜 <b>${UI.esc(currentQuest(player).name)}</b>: ready to hand in!`, 'quest');
    Audio.sfx('quest');
  }
  buildHotbar();
  refresh();
  save(player);
}

function doShout() {
  if (!inExplore()) return;
  const id = player.dragon.equipped;
  if (!id) return UI.combatMessage(player.dragon.voice ? 'Learn a shout at a Word Wall first.' : 'You do not have the Voice... yet.');
  const t = world.time;
  if (t < (combat.shoutReady || 0)) return UI.combatMessage('Your voice needs to rest');
  if (t < combat.etherealUntil) return;
  gatherer.stop();
  const tg = combat.target;
  if (tg && tg.state !== 'dead' && id !== 'sprint') combat.faceTarget(tg);
  if (castShout(player, { world, combat })) {
    combat.shoutTotal = SHOUTS[id].cooldown[shoutWords(player, id) - 1] * (1 - Math.min(0.6, combat.rm('shoutCd')));
    combat.shoutReady = t + combat.shoutTotal;
  }
}

// ------------------------------------------------------------ mounts, waystones and fast travel

function toggleMount() {
  if (world.mounted) { world.dismount(); Audio.sfx('click'); return; }
  const id = player.activeMount;
  if (!id) return UI.combatMessage(player.mounts.length ? 'Choose a mount at the stables.' : 'You have no mount yet. Visit Stablemaster Juno in Millbrook Meadow!');
  if (combat.inCombat) return UI.combatMessage('You cannot mount up in the middle of a battle!');
  gatherer.stop();
  world.mountUp(id);
  Audio.sfx('pet');
}

const mountUnlocked = (id) => (id === 'stalker' ? player.rift.best >= 20 : id === 'drake' ? storyIndex(player) > 22 : true);

function openStableUI() {
  openStable(player, {
    unlocked: mountUnlocked,
    onBuy: (id) => {
      if (!player.mounts.includes(id)) player.mounts.push(id);
      player.activeMount = id;
      refresh();
      save(player);
    },
    onChoose: (id) => { player.activeMount = id; if (world.mounted) world.mountUp(id); save(player); },
  });
}
extraServices.push({ npc: 'juno', label: '🐴 Mounts', action: openStableUI });

world.extraInteractables.push(() => WAYSTONES.map(w => ({ id: 'x:ws:' + w.id, x: w.x, z: w.z, r: 3, label: 'use the waystone' })));

function discoverWaystone(ws) {
  if (player.waystones.includes(ws.id)) return;
  player.waystones.push(ws.id);
  world.waystoneModels[ws.id]?.userData.setActive(true);
  world.aura(world.waystoneModels[ws.id], 0x7fd8ff);
  Audio.sfx('shrine');
  UI.toast(`🗿 Waystone discovered: <b>${UI.esc(ws.name)}</b>. Fast-travel here from the World Atlas (${keyLabel(keyFor('map'))}).`, 'good');
  save(player);
}

// Which zone the current quest points to, for the star on the atlas.
function questZone() {
  const t = questTarget(player);
  if (!t) return null;
  if (t.npc) return zoneAt(NPCS[t.npc].x);
  if (t.shout) return zoneAt(WORD_WALLS.find(w => w.shout === t.shout).x);
  const sp = SPAWNS.find(s => s.enemy === t.enemy);
  return sp ? zoneAt(sp.x) : null;
}

function openWorldAtlas() {
  openAtlas(player, {
    here: zoneAt(world.player.position.x),
    questZone: questZone(),
    canTravel: !combat.inCombat && !rift.active && !undercroft.active,
    onTravel: (ws) => fadeThen(() => {
      gatherer.stop();
      world.teleport({ x: ws.x + 2.5, z: ws.z + 2.5, heading: world.heading });
      player.pos = { x: ws.x + 2.5, z: ws.z + 2.5 };
      Audio.sfx('warp');
      save(player);
    }),
  });
}
$('#minimap').addEventListener('click', () => inExplore() && openWorldAtlas());

// ------------------------------------------------------------ achievements, bestiary & slayer

combat.bonusFor = (e) => hunterBonus(player?.bestiary[e.def.id] || 0) + slayerBonus(player, e.def);
UI.uiHooks.displayName = (p) => displayName(p);

function checkAch() {
  for (const a of checkAchievements(player)) {
    if (a.reward.gold) player.gold += a.reward.gold;
    UI.toast(`🏆 <b>Achievement: ${UI.esc(a.name)}</b><br>${UI.esc(a.desc)}${a.reward.gold ? ` · +${a.reward.gold} gold` : ''}${a.reward.title ? `<br>New title: “${UI.esc(a.reward.title)}” (J → Achievements)` : ''}`, 'good legendary');
    Audio.sfx('levelup');
    save(player);
  }
}

extraServices.push({
  npc: 'grimm', label: '💀 Slayer tasks',
  action: () => openSlayer(player, {
    onAssign: () => {
      const t = assignTask(player);
      UI.toast(`💀 New Slayer task: defeat <b>${t.count} ${UI.esc(ENEMIES[t.enemy].name)}s</b>.`, 'quest');
      refresh();
      save(player);
    },
    onBuy: (id) => {
      const r = giveItem(player, id, 'rare');
      UI.toast(`🎁 <b style="color:${itemColor(r.inst)}">${UI.esc(itemName(r.inst))}</b> · press C to equip`, 'good');
      save(player);
    },
  }),
});

// ------------------------------------------------------------ companions & the arena

const companion = new Companion({ world, combat, getPlayer: () => player, onMessage: (t) => UI.combatMessage(t) });

extraServices.push({
  npc: 'rosalind', label: '🤝 Companions',
  action: () => openInn(player, {
    onHire: (id) => { player.companions.push(id); player.companion = id; companion.spawn(id); refresh(); save(player); },
    onChoose: (id) => { player.companion = id; if (id) companion.spawn(id); else companion.despawn(); save(player); },
    onMode: (m) => { player.companionMode = m; save(player); },
  }),
});

let duel = null;

function startDuel(def) {
  fadeThen(() => {
    gatherer.stop();
    world.dismount();
    duel = { def };
    world.teleport({ x: ARENA_X, z: 16, heading: Math.PI });
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    const e = world.addEnemy(def, ARENA_X, -14, 0);
    combat.initEnemy(e);
    duel.e = e;
    world.arenaCheer = 0.6;
    const el = $('#countdown');
    ['3', '2', '1', 'FIGHT!'].forEach((txt, i) => setTimeout(() => {
      el.textContent = txt;
      el.classList.remove('hidden');
      Audio.sfx(i < 3 ? 'click' : 'boss');
      if (i === 3) setTimeout(() => el.classList.add('hidden'), 700);
    }, 400 + i * 800));
    UI.toast(`⚔️ <b>${UI.esc(def.name)}</b> steps into the arena!`, 'quest');
  });
}

function arenaWin() {
  if (!duel) return;
  const a = player.arena;
  const rw = arenaRewards(a.rank, player.level);
  player.gold += rw.gold;
  a.tokens += rw.tokens;
  a.wins++;
  const levels = gainXp(player, rw.xp);
  a.duel++;
  let msg = `🏆 <b>Victory!</b> +${rw.gold} gold · +${rw.tokens} 🎟️ · +${rw.xp} XP`;
  if (a.duel >= ARENA_RANKS[a.rank].duels) {
    if (a.rank === ARENA_RANKS.length - 1) { a.champion = true; msg += '<br>You are the <b>STARFALL CHAMPION</b>!'; }
    else { a.rank++; a.duel = 0; msg += `<br>Promoted to <b>${ARENA_RANKS[a.rank].icon} ${ARENA_RANKS[a.rank].name}</b>!`; }
  }
  world.arenaCheer = 1;
  UI.toast(msg, 'good legendary');
  Audio.sfx('victory');
  announceLevels(levels);
  save(player);
  setTimeout(() => leaveArena(), 3500);
}

function leaveArena(instant = false) {
  if (!duel) return;
  if (duel.e && world.enemies.includes(duel.e)) world.removeEnemy(duel.e);
  duel = null;
  world.arenaCheer = 0;
  const go = () => { world.teleport({ x: 15, z: -13, heading: 0 }); refresh(); save(player); };
  if (instant) go(); else fadeThen(go);
}

extraServices.push({
  npc: 'vex', label: '🏟️ The Arena',
  action: () => openArena(player, {
    onFight: startDuel,
    onBuy: (id) => { const r = giveItem(player, id, 'epic'); UI.toast(`🎁 <b style="color:${itemColor(r.inst)}">${UI.esc(itemName(r.inst))}</b> · press C to equip`, 'good'); save(player); },
  }),
});

// ------------------------------------------------------------ night

let nightActive = false;
let nightFoes = [];
world.skyCycle.onThunder = () => Audio.sfx('thunder');

// At dusk spirits rise in Hollow Lane and Millbrook Meadow; at dawn they fade away.
function setNight(on) {
  nightActive = on;
  if (on) {
    nightFoes = NIGHT_SPAWNS.map(sp => world.addEnemy(ENEMIES[sp.enemy], sp.x, sp.z, sp.r));
    for (const e of nightFoes) combat.initEnemy(e);
    if (player && zoneAt(world.player.position.x) === 'academy') UI.toast('🌙 Night falls. Spirits drift through Hollow Lane and the meadow… (foes give +15% XP at night)', 'quest');
  } else {
    for (const e of nightFoes) if (world.enemies.includes(e)) { world.defeat(e.model); setTimeout(() => { if (world.enemies.includes(e)) world.removeEnemy(e); }, 1000); e.state = 'dead'; }
    nightFoes = [];
    if (player && zoneAt(world.player.position.x) === 'academy') UI.toast('🌅 Dawn breaks over Starfall.', 'quest');
  }
}

// ------------------------------------------------------------ the Homestead (building)

const homestead = new Homestead({
  world,
  getPlayer: () => player,
  hooks: {
    sfx: (n) => Audio.sfx(n),
    message: (t) => UI.combatMessage(t),
    changed: () => { renderBuildBar(); save(player); },
  },
});

function inHomestead() { return zoneAt(world.player.position.x) === 'homestead'; }

// Blocks you own, then blocks you could craft, so the palette is always the same order.
function paletteIds() { return BLOCK_IDS.filter(id => (player.bag[id] || 0) > 0).concat(BLOCK_IDS.filter(id => !(player.bag[id] > 0))); }

function renderBuildBar() {
  const el = $('#build-bar');
  if (!homestead.building) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.innerHTML = `<div class="bb-title">🧱 Build mode · click to place · right-click to break · <b>${keyLabel(keyFor('build'))}</b> to stop</div>
    <div class="bb-blocks">${paletteIds().slice(0, 14).map((id, i) => `<button class="bb-block ${homestead.selected === id && !homestead.removeMode ? 'on' : ''} ${player.bag[id] ? '' : 'none'}" data-block="${id}" title="${ITEMS[id].name}">${SK.chip(id, player.bag[id] || 0)}${i < 9 ? `<span>${i + 1}</span>` : ''}</button>`).join('')}
      <button class="bb-block ${homestead.removeMode ? 'on' : ''}" data-remove="1" title="Break blocks">⛏️<span>0</span></button></div>`;
  el.querySelectorAll('[data-block]').forEach(b => b.addEventListener('click', () => { homestead.selected = b.dataset.block; homestead.removeMode = false; renderBuildBar(); }));
  el.querySelector('[data-remove]').addEventListener('click', () => { homestead.removeMode = !homestead.removeMode; renderBuildBar(); });
}

function toggleBuild() {
  if (!inHomestead()) return UI.combatMessage('You can only build at your Homestead: take the green Spiral Door in Millbrook Meadow.');
  homestead.building = !homestead.building;
  homestead.removeMode = false;
  if (homestead.building && !(player.bag[homestead.selected] > 0)) homestead.selected = paletteIds()[0];
  Audio.sfx('click');
  renderBuildBar();
  if (homestead.building && !BLOCK_IDS.some(id => player.bag[id] > 0)) UI.toast('You have no blocks yet. Craft them at the workbench (wood, logs, leaves, doors) or the furnace (stone, brick, glass)!');
}

// A little cabin to start from, the first time you arrive.
function starterCabin() {
  const set = (i, k, y, id) => { homestead.grid[homestead.idx(i, k, y)] = BLOCK_IDS.indexOf(id); };
  for (let i = 10; i <= 15; i++) for (let k = 3; k <= 8; k++) {
    const edge = i === 10 || i === 15 || k === 3 || k === 8;
    const corner = (i === 10 || i === 15) && (k === 3 || k === 8);
    for (let y = 0; y < 3; y++) if (edge) set(i, k, y, corner ? 'block_log' : y === 1 && (i === 10 || i === 15) && (k === 5 || k === 6) ? 'block_glass' : 'block_wood');
    set(i, k, 3, 'block_brick');
  }
  set(12, 8, 0, 'block_door'); set(12, 8, 1, 'block_door');
  set(13, 8, 0, 'block_door'); set(13, 8, 1, 'block_door');
  set(11, 4, 2, 'block_lantern');
  set(14, 4, 2, 'block_lantern');
  homestead.refreshMeshes();
  homestead.store();
}

world.onClickWorld = (x, y) => homestead.building && inHomestead() ? homestead.click(x, y) : false;
world.onRightClick = (x, y) => { if (homestead.building && inHomestead()) homestead.click(x, y, true); };

UI.uiHooks.openShouts = () => openShouts(player, { onChange: () => { buildHotbar(); save(player); } });
UI.uiHooks.shoutIcon = (id) => SHOUTS[id]?.icon;

function onExtraInteract(id) {
  if (id.startsWith('x:ws:')) {
    const ws = WAYSTONES.find(w => 'x:ws:' + w.id === id);
    discoverWaystone(ws);
    openWorldAtlas();
    return true;
  }
  if (id.startsWith('x:wall:')) { readWall(WORD_WALLS.find(w => 'x:wall:' + w.id === id)); return true; }
  if (id === 'x:riftgate') { Audio.sfx('click'); openRiftKeeper(); return true; }
  if (id === 'x:vault') { Audio.sfx('click'); UI.openBank(player, onChange); return true; }
  if (id.startsWith('x:rift:')) return rift.interact(id);
  if (id.startsWith('x:uc:')) return undercroft.interact(id);
  return false;
}

function buildHotbar() {
  if (!player) return;
  UI.buildHotbar(player, {
    onSlot: (i) => inExplore() && combat.castSlot(i),
    onDodge: () => inExplore() && combat.dodge(),
    onPotion: () => inExplore() && drinkPotion(),
    onTarget: () => inExplore() && combat.cycleTarget(),
    onShout: () => doShout(),
  });
}

// XP, gold, loot and quest progress the moment an enemy falls.
function rewardKill(e) {
  const diff = DIFFICULTIES[player.difficulty];
  const def = e.def;
  const moonlit = world.skyCycle.isNight && !def.rift;
  const xp = Math.round(def.xp * diff.reward * (moonlit ? 1.15 : 1) * (e.power?.xp || 1));
  const gold = Math.round((def.gold[0] + Math.floor(Math.random() * (def.gold[1] - def.gold[0] + 1))) * diff.reward * (1 + combat.rm('gold')) * (e.power?.gold || 1));
  if (def.rival) setTimeout(arenaWin, 800);
  if (def.rift) {
    rift.onKill(e);
    rift.run.gold += gold;
    rift.run.xp += xp;
  }
  player.gold += gold;
  world.float(e.model, `+${xp} XP${moonlit ? ' 🌙' : ''}`, 'xp');
  const quest = recordKill(player, def.id);
  player.stats_log.kills++;
  player.bestiary[def.id] = (player.bestiary[def.id] || 0) + 1;
  if (def.night) player.stats_log.nightKills = (player.stats_log.nightKills || 0) + 1;
  const sl = slayerKill(player, def);
  if (sl) {
    world.float(e.model, `+${sl.xp} 💀`, 'xp');
    if (sl.levels) announceSkill('slayer');
    if (sl.finished) {
      UI.toast(`💀 <b>Slayer task complete!</b> +${sl.finished.points} Slayer Points · +${sl.finished.gold} gold · streak ${player.slayer.streak}. Return to Grimm for a new task.`, 'quest');
      Audio.sfx('quest');
    }
  }
  sideProgress('defeat', def.id);
  const loot = rollLoot(player, [def]);
  const levels = gainXp(player, xp);
  if (quest) {
    const q = currentQuest(player);
    UI.toast(player.quest.state === 'ready' ? `📜 <b>${UI.esc(q.name)}</b>: ready to turn in!` : `📜 ${UI.esc(questTrackerText(player).goal)}`, 'quest');
    Audio.sfx('quest');
  }
  for (const it of loot.items) UI.toast(`🎁 <b style="color:${itemColor(it.inst)}">${UI.esc(itemName(it.inst))}</b> ${it.inst.r !== 'common' ? `<small>(${RARITIES[it.inst.r].label})</small> ` : ''}${it.where === 'sold' ? '(bag full: sold)' : '· press C to equip'}`, it.inst.r === 'legendary' || it.inst.r === 'epic' ? 'good legendary' : 'good');
  if (loot.items.some(it => it.inst.r === 'legendary')) Audio.sfx('chest');
  for (const id of loot.pets) UI.toast(`🐾 New pet: <b>${PETS[id].name}</b>! Press C to summon it.`, 'good');
  if (loot.mats.length) UI.toast(loot.mats.map(m => `${ITEMS[m.id].icon} ${m.n > 1 ? m.n + '× ' : ''}<b>${ITEMS[m.id].name}</b>`).join(' · '), 'good');
  // dragons give up their souls to those with the Voice
  if (def.dragon && player.dragon.voice) {
    const n = def.souls || (Math.random() < (def.soul || 0) ? 1 : 0);
    if (n) {
      player.dragon.souls += n;
      player.stats_log.souls = (player.stats_log.souls || 0) + n;
      world.soulFx(e.model);
      Audio.sfx('shrine');
      setTimeout(() => UI.toast(`🐉 You absorbed ${n > 1 ? `<b>${n} dragon souls</b>` : 'a <b>dragon soul</b>'}! Spend souls on deeper shout words (B → Shouts).`, 'good'), 1600);
    }
  }
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
  if (duel) {
    await UI.resultScreen(`<h2 class="lose">Defeated</h2><p>${UI.esc(duel.def.name)} wins this round. The crowd groans… but they'll cheer again when you come back.</p><p class="tip">Tip: rivals dodge some spells and throw big area attacks. Watch the ground, keep moving, and bring potions.</p>`);
    leaveArena(true);
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    world.mode = 'explore';
    refresh();
    save(player);
    return;
  }
  if (undercroft.active) {
    const summary = undercroft.end('death');
    world.teleport(LANE_END);
    await UI.resultScreen(`<h2 class="lose">Defeated in the Undercroft</h2><p>You wake up at the crypt door after ${clock(summary.time)} below, with half your health. The Undercroft resets, so the puzzles and gates start over.</p>
      <p class="tip">Tip: read the rune tablet (E) before stepping on the plates, dodge through the blades just after one swings past, and shatter both Soul Pylons to break the Warden's ward.</p>`);
    player.hp = Math.round(player.maxHp * 0.5);
    player.mana = player.maxMana;
    player.stats_log.deaths++;
    world.mode = 'explore';
    area = null;
    checkArea();
    refresh();
    save(player);
    return;
  }
  if (rift.active) {
    const summary = rift.end('death');
    world.teleport({ x: 17, z: 12, heading: Math.PI });
    await UI.resultScreen(RU.runSummaryHTML(summary));
    player.hp = Math.round(player.maxHp * 0.5);
    player.mana = player.maxMana;
    player.stats_log.deaths++;
    world.mode = 'explore';
    refresh();
    save(player);
    return;
  }
  await UI.resultScreen(`<h2 class="lose">Defeated</h2>
    <p>You wake up back at ${{ emberfall: 'the Emberfall camp', dragonspire: 'Skyhold Camp', glacier: 'Frostholm', stormspire: 'Skyport', thornwood: 'Greenhollow' }[zoneAt(world.player.position.x)] || 'Starfall Academy'} with half your health.</p>
    <p class="tip">Tip: dodge (Space) when you see an enemy wind up, heal at a fountain, learn spells from Mirabel, equip better gear (C), and bring potions. ${diff.hp > 1 ? `You are playing on ${diff.name}, so expect every fight to be tough!` : ''}</p>`);
  player.hp = Math.round(player.maxHp * 0.5);
  player.mana = player.maxMana;
  player.stats_log.deaths++;
  world.respawnPlayer();
  world.mode = 'explore';
  refresh();
  save(player);
}

// ------------------------------------------------------------ per-frame upkeep

world.onTick = (dt) => {
  if (!player || world.mode !== 'explore') return;
  combat.update(dt);
  gatherer.update(dt);
  // elixir buffs tick down; Well Fed regenerates health
  let buffsChanged = false;
  for (const id of Object.keys(player.buffs)) {
    player.buffs[id] -= dt;
    if (player.buffs[id] <= 0) {
      delete player.buffs[id];
      buffsChanged = true;
      if (BUFFS[id]) UI.toast(`${BUFFS[id].icon} ${BUFFS[id].name} wore off`);
    }
  }
  if (buffsChanged) recalc(player);
  world.speedMult = 1 + (player.buffs.swift > 0 ? BUFFS.swift.speed : 0) + combat.rm('speed') + (world.mounted ? MOUNTS[player.activeMount]?.speed || 0 : 0);
  rift.update(dt);
  undercroft.update(dt);
  companion.update(dt);
  if (inHomestead()) {
    homestead.update(dt);
    if (!player.home.init) {
      player.home.init = true;
      starterCabin();
      UI.toast(`🏡 Welcome to <b>your Homestead</b>! Press ${keyLabel(keyFor('build'))} to build with blocks you craft.`, 'good');
      save(player);
    }
  } else if (homestead.building || world.player.position.y !== 0) {
    homestead.building = false;
    homestead.feet = 0;
    world.player.position.y = 0;
    renderBuildBar();
  }
  if (player.buffs.regen > 0 && player.hp > 0) player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.025 * dt);
  UI.updateHotbar(combat.hotbar());
  minimap.update(dt, questTargetPos());
  hudTimer += dt;
  if (hudTimer > 0.25) {
    hudTimer = 0;
    UI.updateHUD(player);
    UI.updateTarget(combat.target);
    const near = UI.isDialogOpen() ? null : world.nearestInteractable();
    const key = keyLabel(keyFor('interact'));
    let text = '';
    if (near && !gatherer.busy) {
      const f = FOUNTAINS.find(x => x.id === near.id);
      const pt = PORTALS.find(x => x.id === near.id);
      if (near.id.startsWith('node:')) {
        const n = world.nodes[+near.id.slice(5)].def;
        text = skillLevel(player, n.skill) >= n.level ? `${key}: ${n.verb} ${n.name}` : `${n.name} · needs ${SKILLS[n.skill].name} ${n.level}`;
      } else if (near.id.startsWith('station:')) text = `${key}: use the ${STATION_TYPES[world.stations[+near.id.slice(8)].type].name}`;
      else if (near.label) text = `${key}: ${near.label}`;
      else text = f ? `${key}: use the ${f.name}` : pt ? `${key}: use the Spiral Door` : NPCS[near.id] ? `${key}: talk to ${NPCS[near.id].name}` : '';
    }
    UI.setPrompt(text);
    SK.updateActionBar(gatherer.progress());
    SK.updateBuffs(player);
    RU.updateRiftHud(rift.run);
    checkArea();
    const sky = world.skyCycle, wi = WEATHER_INFO[sky.weather];
    $('#clock').textContent = `${sky.clockText()}${wi.icon ? ' · ' + wi.icon : ''}`;
    $('#clock').title = `${sky.isNight ? 'Night: spirits roam and foes give +15% XP' : 'Day'}${wi.icon ? ' · ' + wi.name : ''}`;
    if (sky.isNight !== nightActive) setNight(sky.isNight);
    achTimer += 0.25;
    if (achTimer > 2) { achTimer = 0; checkAch(); checkWeekly(); }
    const pp = world.player.position;
    for (const ws of WAYSTONES) if (Math.abs(ws.x - pp.x) + Math.abs(ws.z - pp.z) < 9 && !player.waystones.includes(ws.id)) discoverWaystone(ws);
    const fps = $('#fps');
    fps.classList.toggle('hidden', !settings.showFps);
    if (settings.showFps) fps.textContent = `${Math.round(world.fps)} FPS`;
  }
  saveTimer += dt;
  if (saveTimer > 5) {
    saveTimer = 0;
    player.clock = world.skyCycle.time;
    if (!rift.active && !duel && !undercroft.active) player.pos = { x: world.player.position.x, z: world.player.position.z };
    save(player);
  }
};

function updateMuteButton() {}

function toggleMute() {
  Audio.initAudio();
  const m = Audio.toggleMute();
  updateMuteButton();
  UI.toast(m ? 'Sound off' : 'Sound on');
}

function openGameMenu() {
  UI.openMenu([
    { label: '▶ Resume', primary: true },
    ...(duel ? [{ label: '🏳️ Forfeit the duel', action: () => leaveArena() }] : []),
    ...(rift.active ? [{ label: '🏳️ Abandon Rift run (keep half)', action: () => fadeThen(() => {
      const summary = rift.end('abandon');
      world.teleport({ x: 17, z: 12, heading: Math.PI });
      save(player);
      setTimeout(() => UI.resultScreen(RU.runSummaryHTML(summary)).then(() => refresh()), 400);
    }) }] : []),
    ...(undercroft.active ? [{ label: '🏳️ Leave the Undercroft', action: () => undercroft.hooks.leave() }] : []),
    { label: '⚙️ Settings', action: () => UI.openSettings() },
    { label: Audio.isMuted() ? '🔊 Sound on' : '🔇 Sound off', action: toggleMute },
    { label: '❓ How to play', action: () => UI.openHelp() },
    { label: '📤 Export save file', action: () => UI.downloadText(`darquest-${player.name.replace(/\W+/g, '_')}-lv${player.level}.json`, exportSave(player)) },
    { label: '🏠 Save & quit to title', action: () => { if (!rift.active && !undercroft.active) player.pos = { x: world.player.position.x, z: world.player.position.z }; save(player); location.reload(); } },
  ]);
}

window.addEventListener('keydown', (e) => {
  if (!player || e.target instanceof HTMLInputElement) return;
  Audio.initAudio();
  if (e.code === 'Escape') {
    if (UI.isDialogOpen()) { UI.closeModal(); UI.closeDialog(); }
    else if (world.mode === 'explore') openGameMenu();
    return;
  }
  const act = actionOf(e.code);
  if (act === 'mute') return toggleMute();
  if (world.mode !== 'explore' || UI.isDialogOpen()) return;
  if (e.key === '?') { e.preventDefault(); UI.openHelp(); return; }
  if (homestead.building && /^slot\d$/.test(act || '') || homestead.building && e.code === 'Digit0') {
    const n = e.code === 'Digit0' ? 0 : +act.slice(4);
    if (n === 0) homestead.removeMode = !homestead.removeMode;
    else { const id = paletteIds()[n - 1]; if (id) { homestead.selected = id; homestead.removeMode = false; } }
    renderBuildBar();
    return;
  }
  switch (act) {
    case 'build': toggleBuild(); break;
    case 'mount': toggleMount(); break;
    case 'map': openWorldAtlas(); break;
    case 'spellbook': UI.openSpellbook(player, onChange); break;
    case 'character': UI.openCharacter(player, onChange); break;
    case 'potion': drinkPotion(); break;
    case 'dodge': e.preventDefault(); combat.dodge(); break;
    case 'target': e.preventDefault(); combat.cycleTarget(); break;
    case 'help': e.preventDefault(); UI.openHelp(); break;
    case 'slot1': case 'slot2': case 'slot3': case 'slot4': case 'slot5':
      gatherer.stop();
      world.dismount();
      combat.castSlot(+act.slice(4) - 1);
      break;
    case 'skills': SK.openSkills(player); break;
    case 'bag': SK.openBag(player, { onUse: useItem, onChange: () => { refresh(); save(player); } }); break;
    case 'journal': openJournal(player, { onTitle: () => { refresh(); save(player); }, onClaim: claimWeekly }); break;
    case 'eat': eat(); break;
    case 'shout': doShout(); break;
    default: onAction?.(act, e);
  }
});

// Extra actions added by later systems (skills, shouts, building...).
let onAction = null;

// A soft click for every button in the game.
document.addEventListener('click', (e) => { if (e.target.closest('.btn, .school-card, .diff-card')) Audio.sfx('click'); });

function drinkPotion() {
  if (combat.drinkPotion()) { refresh(); save(player); }
}

const inExplore = () => world.mode === 'explore' && player;
$('#btn-char').addEventListener('click', () => inExplore() && UI.openCharacter(player, onChange));
$('#btn-book').addEventListener('click', () => inExplore() && UI.openSpellbook(player, onChange));
$('#btn-skills').addEventListener('click', () => inExplore() && SK.openSkills(player));
$('#btn-bag').addEventListener('click', () => inExplore() && SK.openBag(player, { onUse: useItem, onChange: () => { refresh(); save(player); } }));
$('#btn-journal').addEventListener('click', () => inExplore() && openJournal(player, { onTitle: () => { refresh(); save(player); }, onClaim: claimWeekly }));
$('#btn-help').addEventListener('click', () => UI.openHelp());
$('#btn-menu').addEventListener('click', () => inExplore() && openGameMenu());
onSettings((k) => { if (k === 'keys' && player) buildHotbar(); });

// Your Homestead's vault chest opens the same bank as Pennywhistle.
const VAULT = { x: HOME_X + 7, z: 25 };
{
  const chest = world.add(makeChest(0x7affd0), VAULT.x, VAULT.z, Math.PI, 0.9);
  world.addLabel(chest, '<div class="name">🏦 Vault</div><div class="sub">Your bank</div>', 'npc', 1.9);
}
world.extraInteractables.push(() => (player ? [{ id: 'x:vault', x: VAULT.x, z: VAULT.z, r: 2.6, label: 'open your vault' }] : []));

// Accessibility: menu size, colour-blind friendly bars and reduced motion.
function applyAccess() {
  document.documentElement.style.setProperty('--ui', settings.uiScale || 1);
  document.body.classList.toggle('cb', !!settings.colorblind);
  document.body.classList.toggle('reduce-motion', !!settings.reduceMotion);
}
applyAccess();
onSettings((k) => { if (['uiScale', 'colorblind', 'reduceMotion'].includes(k)) applyAccess(); });

// Virtual joystick for phones and tablets.
{
  const pad = $('#joystick'), knob = pad.querySelector('.knob');
  let id = null;
  const move = (e) => {
    const r = pad.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const max = r.width / 2 - 10, d = Math.hypot(x, y);
    if (d > max) { x *= max / d; y *= max / d; }
    knob.style.transform = `translate(${x}px, ${y}px)`;
    world.joy.x = x / max;
    world.joy.y = -y / max;
  };
  pad.addEventListener('pointerdown', (e) => { id = e.pointerId; pad.setPointerCapture(id); move(e); });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
  const end = () => { id = null; knob.style.transform = ''; world.joy.x = world.joy.y = 0; };
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
}

// Keep the world from reacting to keys while a menu is open.
setInterval(() => {
  if (!player) return;
  if (world.mode === 'explore' && UI.isDialogOpen()) { world.mode = 'menu'; world.keys = {}; }
  else if (world.mode === 'menu' && !UI.isDialogOpen()) world.mode = 'explore';
}, 100);

// Handy for testing from the browser console.
window.darquest = {
  world, combat, UI, rift, homestead, undercroft,
  get player() { return player; },
  newGame(name, school, difficulty = 'normal', slot = 2) { setSlot(slot); startGame(newPlayer(name, school, difficulty), true); },
};

buildTitle();
