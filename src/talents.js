// Talent trees: every school has three branches of five talents. You earn one talent point
// per level after the first. Deeper talents in a branch need points spent higher up.
//   per: what each rank gives. Stat keys (dmg, acc, resist, pip, heal) add to your stats;
//   hpPct / manaPct raise max health / mana; everything else is a combat modifier.
const T = (id, name, icon, max, per, desc) => ({ id, name, icon, max, per, desc });

export const TALENTS = {
  blaze: [
    { name: 'Inferno', icon: '🔥', desc: 'Raw, explosive damage', talents: [
      T('kindling', 'Kindling', '🕯️', 3, { dmg: 3 }, '+3% damage'),
      T('searing_focus', 'Searing Focus', '🎯', 3, { acc: 2 }, '+2% critical chance'),
      T('flashpoint', 'Flashpoint', '💥', 2, { critDmg: 0.15 }, 'Critical hits deal +15% more'),
      T('pyroclasm', 'Pyroclasm', '🌋', 2, { firstStrike: 0.2 }, '+20% damage to foes at full health'),
      T('supernova', 'Supernova', '☄️', 1, { comboMeteor: 1 }, 'Combo strikes call down a meteor on every nearby foe'),
    ] },
    { name: 'Phoenix', icon: '🪶', desc: 'Rise from the ashes', talents: [
      T('warm_embers', 'Warm Embers', '❤️', 3, { hpPct: 0.04 }, '+4% max health'),
      T('cauterize', 'Cauterize', '🩹', 3, { lifesteal: 0.015 }, 'Heal for 1.5% of damage dealt'),
      T('rising_heat', 'Rising Heat', '♨️', 2, { regen: 0.003 }, 'Regenerate 0.3% health per second in battle'),
      T('ashen_draught', 'Ashen Draught', '🧪', 2, { potionHeal: 0.25 }, 'Potions heal 25% more'),
      T('phoenix_soul', 'Phoenix Soul', '🐦‍🔥', 1, { heal: 25, lifesteal: 0.03 }, '+25% healing and 3% more lifesteal'),
    ] },
    { name: 'Ember Knight', icon: '🛡️', desc: 'Burn everything that comes close', talents: [
      T('cinder_touch', 'Cinder Touch', '🔥', 3, { burn: 0.2 }, 'Basic attacks burn for +20% over 3 seconds'),
      T('molten_armor', 'Molten Armor', '🪨', 3, { resist: 3 }, '+3% resist'),
      T('blazing_riposte', 'Blazing Riposte', '⚔️', 2, { thorns: 0.12 }, 'Attackers take 12% of the damage they deal'),
      T('heatwave', 'Heatwave', '🌡️', 1, { nova: 1 }, 'Dodging blasts nearby foes'),
      T('living_flame', 'Living Flame', '😤', 1, { berserk: 0.45 }, 'Up to +45% damage the lower your health'),
    ] },
  ],
  frost: [
    { name: 'Glacier', icon: '🧊', desc: 'Unbreakable', talents: [
      T('permafrost', 'Permafrost', '❤️', 3, { hpPct: 0.05 }, '+5% max health'),
      T('ice_plate', 'Ice Plate', '🛡️', 3, { resist: 3 }, '+3% resist'),
      T('cold_snap', 'Cold Snap', '❄️', 2, { thorns: 0.12 }, 'Attackers take 12% of the damage they deal'),
      T('frozen_heart', 'Frozen Heart', '💙', 2, { regen: 0.004 }, 'Regenerate 0.4% health per second in battle'),
      T('glacial_fortress', 'Glacial Fortress', '🏰', 1, { taken: -0.12 }, 'Take 12% less damage'),
    ] },
    { name: 'Blizzard', icon: '🌨️', desc: 'Shatter your foes', talents: [
      T('frostbite', 'Frostbite', '🥶', 3, { dmg: 3 }, '+3% damage'),
      T('shatter', 'Shatter', '💎', 3, { execute: 0.12 }, '+12% damage to foes under 30% health'),
      T('hailstorm', 'Hailstorm', '🌩️', 2, { chain: 0.08 }, '8% chance for hits to arc to another foe'),
      T('winters_edge', 'Winter\'s Edge', '🗡️', 2, { critDmg: 0.15 }, 'Critical hits deal +15% more'),
      T('absolute_zero', 'Absolute Zero', '🌀', 1, { big: 0.25 }, '+25% damage to elites and bosses'),
    ] },
    { name: 'Rime', icon: '💠', desc: 'Calm, cold efficiency', talents: [
      T('crystal_mind', 'Crystal Mind', '🧠', 3, { cost: -0.05 }, 'Spells cost 5% less mana'),
      T('cold_focus', 'Cold Focus', '⏳', 3, { cd: -0.04 }, 'Spells cool down 4% faster'),
      T('frost_step', 'Frost Step', '👣', 1, { nova: 1 }, 'Dodging blasts nearby foes with frost'),
      T('slipstream', 'Slipstream', '💨', 2, { dodgeCd: 0.15 }, 'Dodge recharges 15% faster'),
      T('northern_wind', 'Northern Wind', '🌬️', 1, { speed: 0.12, shoutCd: 0.25 }, '+12% move speed and shouts recharge 25% faster'),
    ] },
  ],
  tempest: [
    { name: 'Thunder', icon: '⚡', desc: 'Hit hardest of all', talents: [
      T('static_charge', 'Static Charge', '🔋', 3, { dmg: 4 }, '+4% damage'),
      T('overload', 'Overload', '💥', 3, { critDmg: 0.12 }, 'Critical hits deal +12% more'),
      T('thunderclap', 'Thunderclap', '👏', 2, { comboPower: 0.3 }, 'Combo strikes deal +30% more'),
      T('eye_of_storm', 'Eye of the Storm', '🎯', 2, { acc: 4 }, '+4% critical chance'),
      T('skyfall', 'Skyfall', '☄️', 1, { comboMeteor: 1 }, 'Combo strikes call down a meteor on every nearby foe'),
    ] },
    { name: 'Storm', icon: '🌩️', desc: 'Lightning that leaps', talents: [
      T('arc', 'Arc Lightning', '⚡', 3, { chain: 0.08 }, '8% chance for hits to arc to another foe'),
      T('conductor', 'Conductor', '🔗', 3, { firstStrike: 0.12 }, '+12% damage to foes at full health'),
      T('tempest_mind', 'Tempest Mind', '🧠', 2, { cd: -0.06 }, 'Spells cool down 6% faster'),
      T('ball_lightning', 'Ball Lightning', '🔮', 2, { big: 0.12 }, '+12% damage to elites and bosses'),
      T('superconductor', 'Superconductor', '🌀', 1, { chain: 0.2 }, '20% more chance to chain'),
    ] },
    { name: 'Zephyr', icon: '🌪️', desc: 'Never stand still', talents: [
      T('tailwind', 'Tailwind', '💨', 3, { speed: 0.05 }, '+5% move speed'),
      T('blink', 'Blink', '✨', 2, { dodgeCd: 0.15 }, 'Dodge recharges 15% faster'),
      T('shock_step', 'Shock Step', '👣', 1, { nova: 1 }, 'Dodging blasts nearby foes'),
      T('updraft', 'Updraft', '🪽', 3, { hpPct: 0.04 }, '+4% max health'),
      T('eye_wall', 'Eye Wall', '🛡️', 1, { taken: -0.1 }, 'Take 10% less damage'),
    ] },
  ],
  verdant: [
    { name: 'Grove', icon: '🌳', desc: 'The greatest healer', talents: [
      T('green_thumb', 'Green Thumb', '💚', 3, { heal: 8 }, '+8% healing'),
      T('deep_roots', 'Deep Roots', '❤️', 3, { hpPct: 0.04 }, '+4% max health'),
      T('photosynthesis', 'Photosynthesis', '☀️', 2, { regen: 0.004 }, 'Regenerate 0.4% health per second in battle'),
      T('herbalist', 'Herbalist', '🧪', 2, { potionHeal: 0.3 }, 'Potions heal 30% more'),
      T('world_tree', 'World Tree', '🌲', 1, { heal: 20, regen: 0.006 }, '+20% healing and even faster regeneration'),
    ] },
    { name: 'Thorn', icon: '🌵', desc: 'Nature bites back', talents: [
      T('bramble', 'Bramble', '🌿', 3, { thorns: 0.08 }, 'Attackers take 8% of the damage they deal'),
      T('sharp_seeds', 'Sharp Seeds', '🌱', 3, { dmg: 3 }, '+3% damage'),
      T('venom', 'Venom', '🐍', 2, { burn: 0.25 }, 'Basic attacks poison for +25% over 3 seconds'),
      T('overgrowth', 'Overgrowth', '🍃', 2, { execute: 0.15 }, '+15% damage to foes under 30% health'),
      T('strangler_vine', 'Strangler Vine', '🪢', 1, { lifesteal: 0.04 }, 'Heal for 4% of damage dealt'),
    ] },
    { name: 'Wild', icon: '🐾', desc: 'Friend of beasts', talents: [
      T('pack_bond', 'Pack Bond', '🐾', 3, { petPower: 0.2 }, 'Your pet\'s spells are 20% stronger'),
      T('wild_heart', 'Wild Heart', '💓', 3, { resist: 2 }, '+2% resist'),
      T('stampede', 'Stampede', '🦌', 2, { speed: 0.06 }, '+6% move speed'),
      T('alpha', 'Alpha', '🐺', 2, { big: 0.1 }, '+10% damage to elites and bosses'),
      T('beastmaster', 'Beastmaster', '🦁', 1, { petPower: 0.6 }, 'Your pet\'s spells are 60% stronger'),
    ] },
  ],
  umbral: [
    { name: 'Reaper', icon: '💀', desc: 'Finish them', talents: [
      T('grim_harvest', 'Grim Harvest', '🌾', 3, { execute: 0.1 }, '+10% damage to foes under 30% health'),
      T('blood_pact', 'Blood Pact', '🩸', 3, { lifesteal: 0.015 }, 'Heal for 1.5% of damage dealt'),
      T('dark_edge', 'Dark Edge', '🗡️', 2, { dmg: 4 }, '+4% damage'),
      T('soul_rend', 'Soul Rend', '👻', 2, { critDmg: 0.15 }, 'Critical hits deal +15% more'),
      T('deaths_door', 'Death\'s Door', '🚪', 1, { execute: 0.3, lifesteal: 0.02 }, '+30% execute damage and more lifesteal'),
    ] },
    { name: 'Hex', icon: '🔮', desc: 'Curses and crits', talents: [
      T('evil_eye', 'Evil Eye', '👁️', 3, { acc: 2 }, '+2% critical chance'),
      T('malice', 'Malice', '😈', 3, { firstStrike: 0.12 }, '+12% damage to foes at full health'),
      T('dread', 'Dread', '😱', 2, { big: 0.12 }, '+12% damage to elites and bosses'),
      T('hexweaver', 'Hexweaver', '🕸️', 2, { cost: -0.08 }, 'Spells cost 8% less mana'),
      T('doom', 'Doom', '☠️', 1, { berserk: 0.5 }, 'Up to +50% damage the lower your health'),
    ] },
    { name: 'Shade', icon: '🌑', desc: 'Slip through shadows', talents: [
      T('shadow_step', 'Shadow Step', '👣', 2, { dodgeCd: 0.15 }, 'Dodge recharges 15% faster'),
      T('umbral_shroud', 'Umbral Shroud', '🧥', 3, { resist: 3 }, '+3% resist'),
      T('night_stalker', 'Night Stalker', '🐈‍⬛', 2, { speed: 0.06 }, '+6% move speed'),
      T('gloom', 'Gloom', '🌫️', 2, { hpPct: 0.05 }, '+5% max health'),
      T('void_walker', 'Void Walker', '🕳️', 1, { taken: -0.12, nova: 1 }, 'Take 12% less damage; dodging blasts foes'),
    ] },
  ],
  arcane: [
    { name: 'Astromancy', icon: '✨', desc: 'The stars themselves', talents: [
      T('stardust', 'Stardust', '🌟', 3, { dmg: 3 }, '+3% damage'),
      T('constellation', 'Constellation', '🌌', 3, { chain: 0.06 }, '6% chance for hits to arc to another foe'),
      T('comet', 'Comet', '☄️', 2, { comboPower: 0.3 }, 'Combo strikes deal +30% more'),
      T('zenith', 'Zenith', '🔭', 2, { acc: 3 }, '+3% critical chance'),
      T('starfall_combo', 'Starfall', '🌠', 1, { comboMeteor: 1 }, 'Combo strikes call down a meteor on every nearby foe'),
    ] },
    { name: 'Runeweaving', icon: '📜', desc: 'Endless spells', talents: [
      T('rune_efficiency', 'Rune Efficiency', '💧', 3, { cost: -0.05 }, 'Spells cost 5% less mana'),
      T('quick_glyphs', 'Quick Glyphs', '⏳', 3, { cd: -0.04 }, 'Spells cool down 4% faster'),
      T('deep_well', 'Deep Well', '🪣', 2, { manaPct: 0.1, mana: 0.25 }, '+10% max mana and 25% faster mana regen'),
      T('spellsurge', 'Spellsurge', '⚡', 2, { pip: 3 }, '+3% haste'),
      T('archmage', 'Archmage', '🧙', 1, { cost: -0.15, cd: -0.08 }, 'Spells cost 15% less and cool down 8% faster'),
    ] },
    { name: 'Warding', icon: '🛡️', desc: 'Balance in all things', talents: [
      T('aegis', 'Aegis', '🛡️', 3, { resist: 3 }, '+3% resist'),
      T('balance', 'Balance', '⚖️', 3, { hpPct: 0.04 }, '+4% max health'),
      T('reflect', 'Reflection', '🪞', 2, { thorns: 0.12 }, 'Attackers take 12% of the damage they deal'),
      T('dragon_tongue', 'Dragon Tongue', '🐉', 2, { shoutCd: 0.2 }, 'Shouts recharge 20% faster'),
      T('arcane_bulwark', 'Arcane Bulwark', '🏛️', 1, { taken: -0.12 }, 'Take 12% less damage'),
    ] },
  ],
};

export const STAT_KEYS = new Set(['dmg', 'acc', 'resist', 'pip', 'heal']);

export function talentPoints(p) { return Math.max(0, p.level - 1); }
export function spentPoints(p) { return Object.values(p.talents || {}).reduce((a, b) => a + b, 0); }
export function freePoints(p) { return talentPoints(p) - spentPoints(p); }

export function branchSpent(p, branch) {
  return branch.talents.reduce((n, t) => n + (p.talents?.[t.id] || 0), 0);
}

// Tier i needs 2·i points already spent in the same branch.
export function canLearn(p, branch, i) {
  const t = branch.talents[i];
  const rank = p.talents?.[t.id] || 0;
  return rank < t.max && freePoints(p) > 0 && branchSpent(p, branch) >= i * 2;
}

// Everything your talents add up to: { stats, mods, hpPct, manaPct }.
export function talentTotals(p) {
  const out = { stats: {}, mods: {}, hpPct: 0, manaPct: 0 };
  for (const branch of TALENTS[p.school] || []) {
    for (const t of branch.talents) {
      const rank = p.talents?.[t.id] || 0;
      if (!rank) continue;
      for (const [k, v] of Object.entries(t.per)) {
        if (STAT_KEYS.has(k)) out.stats[k] = (out.stats[k] || 0) + v * rank;
        else if (k === 'hpPct') out.hpPct += v * rank;
        else if (k === 'manaPct') out.manaPct += v * rank;
        else out.mods[k] = (out.mods[k] || 0) + v * rank;
      }
    }
  }
  return out;
}

export function respecCost(p) { return 40 * p.level; }
