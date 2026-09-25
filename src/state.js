// Player progress: stats, spell bar, gear, pets, quests and save/load.
import { SCHOOLS, SPELLS, QUESTS, RULES, NPCS, ENEMIES, GEAR, PETS, DIFFICULTIES } from './data.js';
import { BUFFS } from './items.js';

// Three save slots. Slot 1 keeps the original key so older saves still load.
export const SLOT_KEYS = ['darquest-save-v1', 'darquest-save-slot2', 'darquest-save-slot3'];
let slot = 0;
try { slot = Math.min(2, Math.max(0, +(localStorage.getItem('darquest-last-slot') || 0))); } catch { /* ignore */ }

export function setSlot(i) {
  slot = i;
  try { localStorage.setItem('darquest-last-slot', String(i)); } catch { /* ignore */ }
}
export function getSlot() { return slot; }

export function baseHpFor(school, level) {
  return SCHOOLS[school].baseHp + (level - 1) * RULES.hpPerLevel;
}

export function xpToNext(level) {
  return 50 + 30 * level + 8 * level * level;
}

// The school's first spell is the free, always-ready basic attack on key 1.
export function basicSpell(school) {
  return Object.values(SPELLS).find(s => s.school === school && s.level === 1 && !s.enemy && !s.pet);
}

// Fill in any fields missing from older saves.
function upgrade(p) {
  if (!Array.isArray(p.hotbar)) {
    // older saves had a card deck: fill the spell bar with their best known spells
    const basic = basicSpell(p.school).id;
    const picks = (p.known || []).filter(id => id !== basic && SPELLS[id]).sort((a, b) => SPELLS[b].level - SPELLS[a].level);
    p.hotbar = [0, 1, 2, 3].map(i => picks[i] || null);
  }
  delete p.deck;
  p.inventory ??= [];
  p.equipped ??= {};
  p.pets ??= [];
  p.activePet ??= null;
  p.difficulty = DIFFICULTIES[p.difficulty] ? p.difficulty : 'normal';
  p.stats ??= {};
  // skills, materials and side quests (added with the Gatherers' Guild)
  p.skills ??= {};
  p.bag ??= { copper_pickaxe: 1, copper_axe: 1, twig_rod: 1 };
  p.side ??= {};
  p.buffs ??= {};
  p.stats_log ??= { kills: 0, gathered: 0, crafted: 0, deaths: 0 };
  return p;
}

export function newPlayer(name, school, difficulty = 'normal') {
  const starter = basicSpell(school);
  const p = upgrade({
    name, school, difficulty, level: 1, xp: 0, gold: 20, potions: 2, tp: 0,
    known: [starter.id, 'minor_mend'],
    hotbar: ['minor_mend', null, null, null],
    quest: { index: 0, state: 'available', progress: 0 },
    pos: null,
  });
  recalc(p);
  p.hp = p.maxHp;
  return p;
}

// Totals every bonus from gear and the active pet, and updates max health.
export function recalc(p) {
  const s = { hp: 0, dmg: 0, acc: 0, resist: 0, pip: 0, heal: 0 };
  const add = (stats) => { for (const [k, v] of Object.entries(stats || {})) s[k] = (s[k] || 0) + v; };
  for (const id of Object.values(p.equipped)) if (id && GEAR[id]) add(GEAR[id].stats);
  if (p.activePet && PETS[p.activePet]) add(PETS[p.activePet].stats);
  for (const [id, left] of Object.entries(p.buffs || {})) if (left > 0 && BUFFS[id]) add(BUFFS[id].stats);
  p.stats = s;
  p.maxHp = baseHpFor(p.school, p.level) + s.hp;
  p.maxMana = 100 + (p.level - 1) * 6;
  p.mana = Math.min(p.mana ?? p.maxMana, p.maxMana);
  if (p.hp != null) p.hp = Math.min(p.hp, p.maxHp);
  return s;
}

export function save(p) {
  p.savedAt = Date.now();
  try { localStorage.setItem(SLOT_KEYS[slot], JSON.stringify(p)); } catch { /* storage unavailable */ }
}

// Turns saved JSON back into a player, filling in anything newer versions added.
export function revive(raw) {
  const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!p || typeof p !== 'object' || !SCHOOLS[p.school] || typeof p.name !== 'string') return null;
  upgrade(p);
  recalc(p);
  p.hp = Math.min(p.hp ?? p.maxHp, p.maxHp);
  return p;
}

export function load(i = slot) {
  try {
    const raw = localStorage.getItem(SLOT_KEYS[i]);
    return raw ? revive(raw) : null;
  } catch { return null; }
}

export function hasSave(i = slot) {
  try { return !!localStorage.getItem(SLOT_KEYS[i]); } catch { return false; }
}

export function clearSave(i = slot) {
  try { localStorage.removeItem(SLOT_KEYS[i]); } catch { /* ignore */ }
}

export function listSlots() {
  return SLOT_KEYS.map((_, i) => ({ i, p: load(i) }));
}

// Save files are plain JSON, wrapped so we can recognise them on import.
export function exportSave(p) {
  return JSON.stringify({ game: 'DarQuest', version: 2, exportedAt: new Date().toISOString(), player: p }, null, 1);
}

export function importSave(text) {
  const data = JSON.parse(text);
  const p = revive(data?.game === 'DarQuest' ? data.player : data);
  if (!p) throw new Error('That file is not a DarQuest save.');
  return p;
}

// Returns the number of levels gained.
export function gainXp(p, amount) {
  p.xp += amount;
  let gained = 0;
  while (p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level);
    p.level++;
    p.tp++;
    gained++;
  }
  if (gained) {
    recalc(p);
    p.hp = p.maxHp;
    p.mana = p.maxMana;
  }
  return gained;
}

// ----- Gear -----

export function equip(p, invIndex) {
  const id = p.inventory[invIndex];
  const g = GEAR[id];
  if (!g || p.level < g.level) return false;
  p.inventory.splice(invIndex, 1);
  if (p.equipped[g.slot]) p.inventory.push(p.equipped[g.slot]);
  p.equipped[g.slot] = id;
  recalc(p);
  return true;
}

export function unequip(p, slot) {
  if (!p.equipped[slot] || p.inventory.length >= RULES.inventoryMax) return false;
  p.inventory.push(p.equipped[slot]);
  delete p.equipped[slot];
  recalc(p);
  return true;
}

export function sellItem(p, invIndex) {
  const g = GEAR[p.inventory[invIndex]];
  if (!g) return 0;
  p.inventory.splice(invIndex, 1);
  p.gold += g.sell;
  return g.sell;
}

// Adds an item; if the bag is full it is sold automatically. Returns 'bag' | 'sold'.
export function giveItem(p, id) {
  if (p.inventory.length < RULES.inventoryMax) { p.inventory.push(id); return 'bag'; }
  p.gold += GEAR[id].sell;
  return 'sold';
}

// ----- Pets -----

export function givePet(p, id) {
  if (p.pets.includes(id)) return false;
  p.pets.push(id);
  if (!p.activePet) { p.activePet = id; recalc(p); }
  return true;
}

export function setActivePet(p, id) {
  p.activePet = p.pets.includes(id) ? id : null;
  recalc(p);
}

// ----- Loot -----

// Rolls drops for a list of defeated enemy definitions.
export function rollLoot(p, defs) {
  const mult = DIFFICULTIES[p.difficulty].drop;
  const loot = { items: [], pets: [] };
  for (const def of defs) {
    for (const d of def.drops || []) {
      if (Math.random() >= Math.min(1, d.chance * mult)) continue;
      if (d.item) loot.items.push({ id: d.item, where: giveItem(p, d.item) });
      if (d.pet && givePet(p, d.pet)) loot.pets.push(d.pet);
    }
  }
  return loot;
}

// ----- Quests -----

export function currentQuest(p) {
  return QUESTS[p.quest.index] || null;
}

// Marker shown above an NPC's head: '!' (quest available), '?' (ready to hand in), '' (nothing).
export function npcMarker(p, npcId) {
  const q = currentQuest(p);
  if (!q) return '';
  if (p.quest.state === 'available' && q.giver === npcId) return '!';
  if (q.turnIn === npcId) {
    if (p.quest.state === 'ready') return '?';
    if (p.quest.state === 'active' && q.objective.type === 'talk' && q.objective.npc === npcId) return '?';
  }
  return '';
}

export function recordKill(p, enemyId) {
  const q = currentQuest(p);
  if (!q || p.quest.state !== 'active' || q.objective.type !== 'defeat') return false;
  if (q.objective.enemy !== enemyId) return false;
  p.quest.progress = Math.min(q.objective.count, p.quest.progress + 1);
  if (p.quest.progress >= q.objective.count) p.quest.state = 'ready';
  return true;
}

// Where the quest wants you to go: { npc } or { enemy }.
export function questTarget(p) {
  const q = currentQuest(p);
  if (!q) return null;
  if (p.quest.state === 'available') return { npc: q.giver };
  if (p.quest.state === 'ready') return { npc: q.turnIn };
  if (q.objective.type === 'talk') return { npc: q.objective.npc };
  return { enemy: q.objective.enemy };
}

export function questTrackerText(p) {
  const q = currentQuest(p);
  if (!q) return { title: 'Chapter 2 complete!', goal: 'You are a legend of Starfall. More worlds are coming…' };
  const npc = (id) => NPCS[id].name;
  if (p.quest.state === 'available') return { title: q.name, goal: `Talk to ${npc(q.giver)}` };
  if (p.quest.state === 'ready') return { title: q.name, goal: `Return to ${npc(q.turnIn)}` };
  if (q.objective.type === 'talk') return { title: q.name, goal: `Talk to ${npc(q.objective.npc)}` };
  const e = ENEMIES[q.objective.enemy];
  const plural = q.objective.count > 1 ? 's' : '';
  return { title: q.name, goal: `Defeat ${q.objective.count} ${e.name}${plural} (${p.quest.progress}/${q.objective.count})` };
}

export function applyReward(p, reward) {
  const levels = gainXp(p, reward.xp || 0);
  p.gold += reward.gold || 0;
  p.tp += reward.tp || 0;
  p.potions = Math.min(RULES.maxPotions, p.potions + (reward.potions || 0));
  const pet = reward.pet && givePet(p, reward.pet) ? reward.pet : null;
  return { levels, pet };
}
