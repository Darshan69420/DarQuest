import assert from 'node:assert/strict';
import { ENEMIES, SPAWNS, NPCS, QUESTS, SPELLS, PORTALS, ZONES, GEAR, PETS, SCROLLS, MOUNTS, zoneAt } from '../src/data.js';
import { newPlayer } from '../src/state.js';
import { startRift, stageTarget, RIFT_STAGES } from '../src/rifts.js';

for (const spawn of SPAWNS) assert.ok(ENEMIES[spawn.enemy], `Missing enemy at spawn: ${spawn.enemy}`);
for (const [id, enemy] of Object.entries(ENEMIES)) {
  for (const spell of enemy.spells) assert.ok(SPELLS[spell], `${id} uses missing spell ${spell}`);
  for (const drop of enemy.drops || []) {
    if (drop.item) assert.ok(GEAR[drop.item], `${id} drops missing gear ${drop.item}`);
    if (drop.pet) assert.ok(PETS[drop.pet], `${id} drops missing pet ${drop.pet}`);
    if (drop.scroll) assert.ok(SCROLLS[drop.scroll], `${id} drops missing scroll ${drop.scroll}`);
  }
}
for (const [id, scroll] of Object.entries(SCROLLS)) {
  assert.ok(SPELLS[scroll.spell], `${id} casts missing spell ${scroll.spell}`);
  assert.ok(scroll.price > 0, `${id} has no shop price`);
}
for (const [id, mount] of Object.entries(MOUNTS)) {
  assert.ok(mount.level > 0 && mount.speed > 1 && mount.price > 0, `Invalid mount ${id}`);
}
for (const quest of QUESTS) {
  assert.ok(NPCS[quest.giver] && NPCS[quest.turnIn], `Quest ${quest.id} has missing NPC`);
  const obj = quest.objective;
  if (obj.type === 'talk') assert.ok(NPCS[obj.npc], `Quest ${quest.id} has missing talk target`);
  if (obj.type === 'defeat') assert.ok(ENEMIES[obj.enemy], `Quest ${quest.id} has missing enemy`);
}
for (const portal of PORTALS) {
  assert.ok(ZONES[zoneAt(portal.x)], `Missing source zone for ${portal.id}`);
  assert.ok(ZONES[zoneAt(portal.to.x)], `Missing destination zone for ${portal.id}`);
}
for (const [level, questIndex] of [[1, 0], [8, 7], [16, 14]]) {
  for (let seed = 0; seed < 100; seed++) {
    const player = newPlayer('Check', 'blaze');
    player.level = level;
    player.quest.index = questIndex;
    startRift(player, seed);
    for (let stage = 0; stage < RIFT_STAGES; stage++) {
      player.rift.stage = stage;
      const target = stageTarget(player.rift, level);
      assert.ok(SPAWNS.some(s => s.enemy === target), `Rift seed ${seed} lacks a spawn for ${target}`);
    }
  }
}
console.log('Content references and 900 seeded Rift stages checked.');
