// Pets grow up: they earn experience whenever you win a fight, up to level 10. Each level makes
// their stats and spells stronger. At level 5 they cast more often, and at level 10 they
// sometimes cast twice in a row.
export const PET_MAX = 10;
const NEED = [0, 0, 8, 24, 50, 90, 140, 210, 300, 410, 550];   // total XP to reach each level

export function petLevel(p, id) {
  const xp = p.petXp?.[id] || 0;
  let l = 1;
  while (l < PET_MAX && xp >= NEED[l + 1]) l++;
  return l;
}

export function petProgress(p, id) {
  const l = petLevel(p, id), xp = p.petXp?.[id] || 0;
  if (l >= PET_MAX) return { level: l, have: 1, need: 1 };
  return { level: l, have: xp - NEED[l], need: NEED[l + 1] - NEED[l] };
}

// Stat and spell power multiplier for a pet's level.
export const petPower = (level) => 1 + (level - 1) * 0.12;
export const petFast = (level) => level >= 5;
export const petTwin = (level) => level >= PET_MAX;

// Gives XP to the active pet. Returns the new level if it just levelled up.
export function givePetXp(p, n) {
  const id = p.activePet;
  if (!id) return 0;
  p.petXp ??= {};
  const before = petLevel(p, id);
  p.petXp[id] = (p.petXp[id] || 0) + n;
  const after = petLevel(p, id);
  return after > before ? after : 0;
}
