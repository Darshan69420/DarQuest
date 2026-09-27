// Game bootstrap: title screen, NPC conversations, quests, portals and real-time combat.
import { World } from './world.js';
import { Combat } from './combat.js';
import { Minimap } from './minimap.js';
import * as UI from './ui.js';
import * as Audio from './audio.js';
import { setupTitle } from './title.js';
import { applySettings, openSettings, resolveKey, keyLabel } from './settings.js';
import {
  SCHOOLS, NPCS, QUESTS, DIFFICULTIES, FOUNTAINS, PORTALS, ZONES, GEAR, PETS, ENEMIES, SCROLLS, MOUNTS, zoneAt,
} from './data.js';
import {
  save, currentQuest, npcMarker, recordKill,
  questTrackerText, questTarget, applyReward, gainXp, rollLoot,
  recalc, scrollCount, giveScroll,
} from './state.js';
import { RIFT_STAGES, RIFT_BOONS, startRift, chooseBoon, boonChoices, riftKill, claimRift, endRift, riftText } from './rifts.js';
import { ARCHIVE_X, ARCHIVE_ROOMS, ARCHIVE_MODIFIERS, ARCHIVE_RUNES, archiveWave, archiveModifier, archiveRuneChoices, archiveEvent, chooseArchiveEvent, startArchive, archiveKill, advanceArchive, restArchive, claimArchive, endArchive, archiveText } from './archive.js';

const $ = (sel) => document.querySelector(sel);
const world = new World($('#game'), $('#labels'));
const minimap = new Minimap($('#minimap'), world);
let player = null;
let hudTimer = 0;
let saveTimer = 0;

// ------------------------------------------------------------ title screen

function startGame(p, isNew) {
  Audio.initAudio();
  player = p;
  if (zoneAt(p.pos?.x ?? 0) === 'archive' && !p.archive) p.pos = { x: 0, z: -14 };
  $('#title').classList.add('hidden');
  world.spawnPlayer(p, isNew ? null : p.pos);
  world.mode = 'explore';
  combat.setPlayer(p);
  if (p.archive && zoneAt(world.player.position.x) === 'archive') syncArchiveEncounter();
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
      `Welcome, ${p.name}! ${d.hp > 1 ? `You chose ${d.name} difficulty. Brave! ` : ''}Move with W A S D, hold Shift to sprint, or tap the ground. Fight with keys 1 to 5 and dodge with Space. When you see a "!" above someone's head, talk to them with E. Come and find me in front of the Academy!`,
      [{ label: 'Let\'s go!', primary: true }, { label: 'How to play', action: UI.openHelp }]), 700);
  }
}

function refresh() {
  if (!player) return;
  UI.updateHUD(player);
  UI.updateQuest(questTrackerText(player));
  UI.updateRift(player.rift ? riftText(player) : '');
  UI.updateArchive(player.archive ? archiveText(player) : '');
  updateTravelButtons();
  for (const id of Object.keys(NPCS)) world.setNpcMarker(id, npcMarker(player, id));
  world.setNpcMarker('riftkeeper', player.rift?.status === 'choice' || player.rift?.status === 'claim' ? '?' : '');
  for (const pt of PORTALS) world.setPortalLocked(pt.id, player.quest.index < pt.unlock ||
    (pt.id.startsWith('archive_door_') && (player.archive?.room !== Number(pt.id.slice(-1)) ||
      player.archive.status === 'active')));
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
  if (zoneAt(world.player.position.x) === 'archive' && player.archive) {
    if (player.archive.status === 'active') {
      const foe = world.enemies.find(e => e.dungeon && e.state !== 'dead');
      return foe ? { x: foe.model.position.x, z: foe.model.position.z } : null;
    }
    const door = PORTALS.find(pt => pt.id === `archive_door_${player.archive.room}`);
    return door ? { x: door.x, z: door.z } : null;
  }
  const t = player.rift?.status === 'active' ? { enemy: player.rift.target } : questTarget(player);
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
    if (id === 'portal_archive_in') return UI.dialog('Archive Gate', 'The Shattered Archive',
      player.archive ? `Continue run ${player.archive.seed} at ${ARCHIVE_ROOMS[player.archive.room].name}?` :
        `Enter a four-chamber expedition: two changing encounters, a respite, and the Unbound Curator. Cleared rooms and your seed are saved. Defeat ends the expedition. Cleared expeditions: ${player.archiveWins}.`, [
        { label: player.archive ? 'Resume expedition' : 'Begin expedition', primary: true, action: () => {
          if (!player.archive) startArchive(player);
          const room = ARCHIVE_ROOMS[player.archive.room];
          travel({ to: { x: ARCHIVE_X, z: room.z - 7, heading: 0 } }, syncArchiveEncounter);
          refresh(); save(player);
        } }, { label: 'Stay here' },
      ]);
    if (id.startsWith('portal_archive_out_')) return UI.dialog('Return Gate', 'Leave the Archive',
      'Leaving now abandons the expedition. You keep any ordinary loot you earned.', [
        { label: 'Leave expedition', action: () => {
          endArchive(player);
          recalc(player);
          combat.setTarget(null);
          world.clearArchiveEnemies();
          travel(portal);
          refresh(); save(player);
        } }, { label: 'Stay here', primary: true },
      ]);
    if (id.startsWith('archive_door_')) return showArchiveDoor(Number(id.slice(-1)), portal);
    return UI.dialog('Spiral Door', 'Ancient Portal', `The portal swirls with light. Travel to ${portal.dest}?`, [
      { label: `Travel to ${portal.dest}`, primary: true, action: () => travel(portal) },
      { label: 'Stay here' },
    ]);
  }

  if (id === 'riftkeeper') return showRiftkeeper();

  const npc = NPCS[id];
  const q = currentQuest(player);
  const extra = [];
  if (npc.service === 'tutor') extra.push({ label: '📚 Learn Spells', action: () => UI.openTutor(player, onChange) });
  if (npc.service === 'shop') extra.push({ label: '🧪 Potions & Pets', action: () => UI.openShop(player, onChange) });
  if (npc.service === 'gear') extra.push({ label: '🎩 Browse Gear', action: () => UI.openGearShop(player, onChange) });
  if (npc.service === 'stable') extra.push({ label: '🦌 See Mounts', action: () => UI.openStable(player, onChange) });

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

function showRiftkeeper() {
  const run = player.rift;
  if (!run) return UI.dialog('Riftkeeper Vale', 'Rift Contracts',
    `Three stages, three boons, one life. The contract sends you across ${player.quest.index >= 7 ? 'Hollow Lane or Emberfall' : 'Hollow Lane'} to hunt changing foes. Rift targets hit 15% harder each stage. Temporary boons disappear after victory or defeat. Contracts cleared: ${player.riftWins}.`, [
      { label: 'Begin contract', primary: true, action: () => {
        startRift(player);
        refresh(); save(player);
        showRiftkeeper();
      } }, { label: 'Later' },
    ]);

  if (run.status === 'choice') return UI.dialog('Riftkeeper Vale', `Stage ${run.stage + 1}/${RIFT_STAGES}`,
    `Choose one boon for this run. Then hunt ${ENEMIES[run.target].name} in ${run.zone === 'academy' ? 'Hollow Lane' : 'Emberfall Wilds'}.`, [
      ...boonChoices(run).map(id => ({ label: `${RIFT_BOONS[id].name}: ${RIFT_BOONS[id].description}`, action: () => {
        const oldMax = player.maxHp;
        if (!chooseBoon(player, id)) return;
        recalc(player);
        player.hp = Math.min(player.maxHp, player.hp + player.maxHp - oldMax);
        UI.toast(`🌀 ${UI.esc(RIFT_BOONS[id].name)} gained. ${UI.esc(riftText(player))}`, 'good');
        refresh(); save(player);
      } })), { label: 'Decide later' },
    ]);

  if (run.status === 'claim') return UI.dialog('Riftkeeper Vale', 'Contract complete',
    'You survived all three stages. Claim your prize and carry your tale back to Starfall.', [
      { label: 'Claim reward', primary: true, action: () => {
        const reward = claimRift(player);
        if (!reward) return;
        recalc(player);
        player.gold += reward.gold;
        const levels = gainXp(player, reward.xp);
        announceLevels(levels);
        showRunSummary(reward.summary);
        refresh(); save(player);
      } }, { label: 'Later' },
    ]);

  return UI.dialog('Riftkeeper Vale', `Stage ${run.stage + 1}/${RIFT_STAGES}`,
    `${riftText(player)}. Your boons: ${run.boons.map(id => RIFT_BOONS[id]?.name).join(', ')}. A defeat ends the contract.`, [
      { label: 'Keep hunting', primary: true },
      { label: 'Abandon contract', action: () => {
        endRift(player);
        recalc(player);
        refresh(); save(player);
        UI.toast('🌀 Contract abandoned. Temporary boons faded.');
      } },
    ]);
}

function travel(portal, onArrival) {
  world.mode = 'locked';
  Audio.sfx('warp');
  $('#fade').classList.add('on');
  setTimeout(() => {
    world.teleport(portal.to);
    onArrival?.();
    player.pos = { x: portal.to.x, z: portal.to.z };
    save(player);
    $('#fade').classList.remove('on');
    world.mode = 'explore';
  }, 650);
}

function syncArchiveEncounter() {
  world.clearArchiveEnemies();
  combat.setTarget(null);
  const run = player.archive;
  if (!run || run.status !== 'active') return;
  const wave = archiveWave(run.seed, run.room);
  // A saved kill count is a checkpoint: defeated foes never reappear after reload.
  for (let i = 0; i < wave.length; i++) {
    if (run.defeated.includes(i)) continue;
    const e = world.addEnemy({ enemy: wave[i], x: ARCHIVE_X + (i - (wave.length - 1) / 2) * 4,
      z: ARCHIVE_ROOMS[run.room].z + 2, r: 1.4 }, `archive-${run.room}-${i}`, true);
    e.archiveIndex = i;
    combat.initEnemy(e);
  }
  const rule = ARCHIVE_MODIFIERS[archiveModifier(run)];
  UI.toast(`📖 <b>${UI.esc(rule.name)}</b>: ${UI.esc(rule.description)}`, 'quest');
}

function showArchiveDoor(room, portal) {
  const run = player.archive;
  if (!run || run.room !== room) return UI.dialog('Sealed Chapter', 'The Archive', 'These pages belong to another chamber.');
  if (run.status === 'active') return UI.dialog('Sealed Chapter', 'The Archive',
    `The seal holds until you defeat the remaining ${archiveWave(run.seed, room).length - run.kills} foe(s).`);
  if (run.status === 'event') {
    const folio = archiveEvent(run);
    return UI.dialog(folio.name, 'The Second Chamber',
      `${folio.line} Seal the Folio to weaken the Curator by 20%, or take its secret for ${folio.bonusGold} extra gold upon victory while the Curator deals 25% more damage. Your decision lasts for this expedition.`, [
        { label: 'Seal the Folio · weaker guardian', primary: true, action: () => {
          if (!chooseArchiveEvent(player, 'seal')) return;
          world.aura(world.player, 0x9ce7e1);
          UI.toast('📖 Folio sealed. The Curator is weakened.', 'good');
          refresh(); save(player);
        } },
        { label: `Take the secret · +${folio.bonusGold} gold on victory`, action: () => {
          if (!chooseArchiveEvent(player, 'plunder')) return;
          world.aura(world.player, 0xe2a5bc);
          UI.toast('📖 Secret taken. The Curator hits harder.', 'quest');
          refresh(); save(player);
        } },
        { label: 'Decide later' },
      ]);
  }
  if (run.status === 'rest') return UI.dialog('Quiet Alcove', 'Choose your respite',
    'Choose once. Rest for health and mana, take a scroll, or bind one of two runes until you leave the Archive.', [
      { label: 'Rest and recover', primary: true, action: () => {
        restArchive(player, 'heal');
        world.aura(world.player, 0x7fe3ff);
        refresh(); save(player);
      } },
      { label: 'Take a scroll', action: () => {
        if (scrollCount(player) >= 12) return UI.toast('Your scroll bag is full. Choose rest instead.');
        if (restArchive(player, 'scroll')) giveScroll(player, 'mend');
        refresh(); save(player);
      } },
      ...archiveRuneChoices(run).map(id => ({ label: `${ARCHIVE_RUNES[id].name}: ${ARCHIVE_RUNES[id].description}`, action: () => {
        const oldMax = player.maxHp;
        if (!restArchive(player, 'rune', id)) return;
        recalc(player);
        player.hp = Math.min(player.maxHp, player.hp + player.maxHp - oldMax + Math.ceil(player.maxHp * 0.2));
        world.aura(world.player, 0xcaa6ff);
        UI.toast(`📖 ${UI.esc(ARCHIVE_RUNES[id].name)} bound until you leave.`, 'good');
        refresh(); save(player);
      } })),
      { label: 'Decide later' },
    ]);
  if (run.status === 'claim') return UI.dialog('Final Chapter', 'Expedition complete',
    'The Curator falls silent. Claim your reward and return to Starfall Academy.', [
      { label: 'Claim and return', primary: true, action: () => {
        const reward = claimArchive(player);
        if (!reward) return;
        recalc(player);
        player.gold += reward.gold;
        announceLevels(gainXp(player, reward.xp));
        combat.setTarget(null);
        world.clearArchiveEnemies();
        showRunSummary(reward.summary);
        travel(portal);
        refresh(); save(player);
      } }, { label: 'Explore more' },
    ]);
  return UI.dialog('Sealed Chapter', 'The Archive', 'The next chamber awaits.', [
    { label: 'Enter next chamber', primary: true, action: () => {
      if (!advanceArchive(player)) return;
      combat.setTarget(null);
      world.clearArchiveEnemies();
      travel(portal, syncArchiveEncounter);
      refresh(); save(player);
    } }, { label: 'Stay here' },
  ]);
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
  if (kind === 'gear' || kind === 'pet' || kind === 'mount') world.spawnPlayer(player);
  buildHotbar();
  if (kind === 'drink') Audio.sfx('drink');
  else if (kind === 'pet') Audio.sfx('pet');
  else if (kind === 'loot' || kind === 'sell') Audio.sfx('loot');
  else if (kind === 'gear') Audio.sfx('buff');
  else if (kind === 'mount') Audio.sfx('pet');
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
    if (fighting && !player.combatHintSeen) {
      player.combatHintSeen = true;
      UI.toast(`Select a foe, then ${keyLabel('Digit1')} to attack. ${keyLabel('Tab')} changes target; ${keyLabel('Space')} dodges a wind-up.`, 'quest');
      save(player);
    }
    if (fighting && player.mounted) {
      world.setMounted(player, false);
      refresh(); save(player);
      UI.toast('🦌 Your mount retreats as combat begins.');
    }
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
  const quest = e.dungeon ? false : recordKill(player, def.id);
  const contract = e.dungeon ? false : riftKill(player, def.id);
  if (e.dungeon && archiveKill(player, e.archiveIndex)) {
    UI.toast(`📚 ${UI.esc(archiveText(player))}`, player.archive.status === 'active' ? 'quest' : 'good');
    Audio.sfx('quest');
  }
  const loot = rollLoot(player, [def]);
  const levels = gainXp(player, xp);
  if (quest) {
    const q = currentQuest(player);
    UI.toast(player.quest.state === 'ready' ? `📜 <b>${UI.esc(q.name)}</b>: ready to turn in!` : `📜 ${UI.esc(questTrackerText(player).goal)}`, 'quest');
    Audio.sfx('quest');
  }
  if (contract) {
    UI.toast(`🌀 ${UI.esc(riftText(player))}`, player.rift.status === 'active' ? 'quest' : 'good');
    Audio.sfx('quest');
  }
  for (const it of loot.items) UI.toast(`🎁 <b>${UI.esc(GEAR[it.id].name)}</b> ${it.where === 'sold' ? '(bag full: sold)' : '· press C to equip'}`, 'good');
  for (const id of loot.pets) UI.toast(`🐾 New pet: <b>${PETS[id].name}</b>! Press C to summon it.`, 'good');
  for (const id of loot.scrolls) UI.toast(`📜 Found <b>${UI.esc(SCROLLS[id].name)}</b>! Press R to use it.`, 'good');
  if (loot.items.length || loot.pets.length || loot.scrolls.length) Audio.sfx('loot');
  if (loot.pets.length) world.setPet(player.activePet);
  if (def.boss) UI.toast(`🏆 <b>${UI.esc(def.name)}</b> is defeated! +${xp} XP · +${gold} gold`, 'good');
  announceLevels(levels);
  refresh();
  save(player);
}

async function playerDefeated() {
  world.mode = 'locked';
  world.clearInput();
  player.hp = 0;
  UI.updateHUD(player);
  Audio.sfx('defeat');
  const lostRift = endRift(player, 'defeated');
  const lostArchive = !!player.archive;
  if (lostArchive) { endArchive(player, 'defeated'); combat.setTarget(null); world.clearArchiveEnemies(); }
  if (player.mounted) world.setMounted(player, false);
  recalc(player);
  player.hp = 0;
  UI.updateHUD(player);
  save(player);
  const diff = DIFFICULTIES[player.difficulty];
  await new Promise(r => setTimeout(r, 900));
  await UI.resultScreen(`<h2 class="lose">Defeated</h2>
    <p>You wake up back at ${zoneAt(world.player.position.x) === 'emberfall' ? 'the Emberfall camp' : 'Starfall Academy'} with half your health.${lostRift ? ' Your Rift Contract ended and its boons faded.' : ''}${lostArchive ? ' Your Archive expedition ended.' : ''}</p>
    <p class="tip">Tip: dodge (Space) when you see an enemy wind up, heal at a fountain, learn spells from Mirabel, equip better gear (C), and bring potions. ${diff.hp > 1 ? `You are playing on ${diff.name}, so expect every fight to be tough!` : ''}</p>`);
  player.hp = Math.round(player.maxHp * 0.5);
  player.mana = player.maxMana;
  if (lostArchive) world.teleport({ x: 0, z: -14, heading: Math.PI });
  else world.respawnPlayer();
  player.pos = { x: world.player.position.x, z: world.player.position.z };
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
      text = f ? `E / Tap · Use ${f.name}` : pt ? `E / Tap · Use ${pt.name || 'Spiral Door'}` : `E / Tap · Talk to ${NPCS[near.id].name}`;
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

function showRunSummary(summary) {
  if (!summary) return;
  UI.openModal('Expedition complete', `<h3>${UI.esc(summary.kind)}</h3><p>Depth ${summary.depth} / ${summary.totalDepth}</p><p>${summary.xp} XP · ${summary.gold} gold</p><p class="modal-note">Your reward and run record have been saved with this character.</p>`);
}

function updateMuteButton() {
  $('#btn-mute').textContent = Audio.isMuted() ? 'Muted' : 'Sound';
}

function updateTravelButtons() {
  $('#btn-scroll').textContent = `Scrolls ${scrollCount(player) || ''}`;
  $('#btn-mount').textContent = player.mounted ? 'Dismount' : 'Ride';
  $('#btn-mount').title = player.mounted ? 'Dismount (F)' : player.activeMount ? `Ride ${MOUNTS[player.activeMount].name} (F)` : 'Buy a mount from Elowen (F)';
}

function toggleMount() {
  if (!player.activeMount) return UI.toast('🦌 Visit Elowen in the academy courtyard to buy a mount.');
  if (combat.inCombat && !player.mounted) return UI.combatMessage('Cannot mount during combat');
  world.setMounted(player, !player.mounted);
  refresh(); save(player);
  UI.toast(player.mounted ? `🦌 Riding ${UI.esc(MOUNTS[player.activeMount].name)}` : '🦌 Dismounted');
}

function useScroll(id) {
  if (!combat.castScroll(id)) return false;
  refresh(); save(player);
  return true;
}

function toggleMute() {
  Audio.initAudio();
  const m = Audio.toggleMute();
  updateMuteButton();
  UI.toast(m ? 'Sound off' : 'Sound on');
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.();
}

window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, select, textarea')) return;
  if (UI.isTalking() && ['Escape', 'Space'].includes(e.code)) {
    e.preventDefault(); if (!e.repeat) UI.advanceDialog(); return;
  }
  if (e.code === 'Escape') { UI.closeModal(); return; }
  if (!player) return;
  const code = resolveKey(e.code);
  Audio.initAudio();
  if (e.code === 'KeyM') return toggleMute();
  if (e.code === 'KeyV') return toggleFullscreen();
  if (world.mode !== 'explore' || UI.isDialogOpen()) return;
  if (code === 'KeyB') UI.openSpellbook(player, onChange);
  if (code === 'KeyC' || code === 'KeyI') UI.openCharacter(player, onChange);
  if (code === 'KeyR') UI.openScrolls(player, useScroll);
  if (code === 'KeyF' && !e.repeat) toggleMount();
  if (code === 'KeyH') drinkPotion();
  const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(code);
  if (n >= 0) combat.castSlot(n);
  if (code === 'Space') { e.preventDefault(); combat.dodge(); }
  if (code === 'Tab') { e.preventDefault(); combat.cycleTarget(); }
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
$('#btn-scroll').addEventListener('click', () => inExplore() && UI.openScrolls(player, useScroll));
$('#btn-mount').addEventListener('click', () => inExplore() && toggleMount());
$('#btn-mute').addEventListener('click', toggleMute);
$('#btn-fullscreen').addEventListener('click', toggleFullscreen);
$('#btn-help').addEventListener('click', () => UI.openHelp());
$('#prompt').addEventListener('click', () => {
  if (inExplore() && !UI.isDialogOpen()) {
    const near = world.nearestInteractable();
    if (near) talk(near.id);
  }
});
$('#btn-reset').addEventListener('click', () => {
  if (player) { player.pos = { x: world.player.position.x, z: world.player.position.z }; save(player); }
  location.reload();
});
$('#btn-settings').addEventListener('click', () => openSettings(world));
$('#title-settings').addEventListener('click', () => openSettings(world));

// Keep the world from reacting to keys while a menu is open.
setInterval(() => {
  if (!player) return;
  if (world.mode === 'explore' && UI.isDialogOpen()) { world.mode = 'menu'; world.clearInput(); }
  else if (world.mode === 'menu' && !UI.isDialogOpen()) world.mode = 'explore';
}, 100);

// Handy for testing from the browser console.
window.render_game_to_text = () => JSON.stringify(player ? {
  coordinateSystem: 'ground plane: +x east/right, +z south/down; positions are world units',
  mode: world.mode,
  fullscreen: !!document.fullscreenElement,
  zone: zoneAt(world.player.position.x),
  player: {
    x: +world.player.position.x.toFixed(2), z: +world.player.position.z.toFixed(2),
    heading: +world.heading.toFixed(2), moving: world.isMoving, sprinting: world.isSprinting,
    mounted: player.mounted, hp: Math.ceil(player.hp), maxHp: player.maxHp,
    mana: Math.ceil(player.mana), maxMana: player.maxMana,
  },
  target: combat.target && combat.target.state !== 'dead' ? {
    name: combat.target.def.name, hp: Math.ceil(combat.target.hp), maxHp: combat.target.maxHp,
    x: +combat.target.model.position.x.toFixed(2), z: +combat.target.model.position.z.toFixed(2),
  } : null,
  nearbyInteractable: world.nearestInteractable()?.id || null,
  visibleEnemies: world.enemies.filter(e => e.state !== 'dead' && e.model.visible).slice(0, 12).map(e => ({
    name: e.def.name, state: e.state,
    x: +e.model.position.x.toFixed(1), z: +e.model.position.z.toFixed(1), hp: Math.ceil(e.hp),
  })),
  quest: questTrackerText(player),
  rift: player.rift ? riftText(player) : null,
  archive: player.archive ? archiveText(player) : null,
} : { mode: 'title' });
window.advanceTime = ms => world.advanceTime(ms);
window.darquest = { world, combat, get player() { return player; } };
window.solquest = window.darquest;

applySettings(world);
setupTitle({ onStart: startGame });
