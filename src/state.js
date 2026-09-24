// Player progress: stats, deck, quests and save/load.
import { SCHOOLS, SPELLS, QUESTS, RULES, NPCS, ENEMIES } from './data.js';

const SAVE_KEY = 'darquest-save-v1';

export function maxHpFor(school, level) {
  return SCHOOLS[school].baseHp + (level - 1) * RULES.hpPerLevel;
}

export function xpToNext(level) {
  return 50 + 30 * level + 8 * level * level;
}

export function newPlayer(name, school) {
  const starter = Object.values(SPELLS).find(s => s.school === school && s.level === 1 && !s.enemy);
  const p = {
    name, school, level: 1, xp: 0, gold: 20, potions: 1, tp: 0,
    known: [starter.id, 'minor_mend'],
    deck: [...Array(6).fill(starter.id), 'minor_mend', 'minor_mend'],
    quest: { index: 0, state: 'available', progress: 0 },
    pos: null,
  };
  p.maxHp = maxHpFor(school, 1);
  p.hp = p.maxHp;
  return p;
}

export function save(p) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !SCHOOLS[p.school]) return null;
    p.maxHp = maxHpFor(p.school, p.level);
    p.hp = Math.min(p.hp ?? p.maxHp, p.maxHp);
    return p;
  } catch { return null; }
}

export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
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
    p.maxHp = maxHpFor(p.school, p.level);
    p.hp = p.maxHp;
  }
  return gained;
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

export function questTrackerText(p) {
  const q = currentQuest(p);
  if (!q) return { title: 'Chapter 1 complete!', goal: 'More adventures coming soon…' };
  const npc = (id) => NPCS[id].name;
  if (p.quest.state === 'available') return { title: q.name, goal: `Talk to ${npc(q.giver)}`, npc: q.giver };
  if (p.quest.state === 'ready') return { title: q.name, goal: `Return to ${npc(q.turnIn)}`, npc: q.turnIn };
  if (q.objective.type === 'talk') return { title: q.name, goal: `Talk to ${npc(q.objective.npc)}`, npc: q.objective.npc };
  const e = ENEMIES[q.objective.enemy];
  const plural = q.objective.count > 1 ? 's' : '';
  return { title: q.name, goal: `Defeat ${q.objective.count} ${e.name}${plural} (${p.quest.progress}/${q.objective.count})`, enemy: q.objective.enemy };
}

export function applyReward(p, reward) {
  const levels = gainXp(p, reward.xp || 0);
  p.gold += reward.gold || 0;
  p.tp += reward.tp || 0;
  p.potions = Math.min(RULES.maxPotions, p.potions + (reward.potions || 0));
  return levels;
}
