import test from 'node:test';
import assert from 'node:assert/strict';
import { newPlayer, save, load, clearSave, listSaves, migrateSaves, setActiveSlot } from '../src/state.js';

function withStorage(run) {
  const previous = globalThis.localStorage;
  const data = new Map();
  globalThis.localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  };
  setActiveSlot(1);
  try { run(data); } finally { globalThis.localStorage = previous; setActiveSlot(1); }
}

test('legacy save migrates verbatim once and deletion never resurrects it', () => withStorage(data => {
  const legacy = JSON.stringify(newPlayer('Old wizard', 'frost'));
  data.set('darquest-save-v1', legacy);
  assert.equal(load(1).name, 'Old wizard');
  assert.equal(data.get('darquest-save-slot1'), legacy);
  assert.equal(data.get('darquest-save-v1'), legacy);
  assert.equal(clearSave(1), true);
  assert.equal(migrateSaves(), true);
  assert.equal(load(1), null);
  assert.equal(data.get('darquest-save-v1'), legacy);
}));

test('new characters and autosaves affect only the selected slot', () => withStorage(data => {
  save(newPlayer('First', 'frost'), 1);
  const first = data.get('darquest-save-slot1');
  setActiveSlot(2);
  save(newPlayer('Second', 'blaze'));
  const second = load();
  second.level = 4;
  save(second);
  assert.equal(load(2).level, 4);
  assert.equal(data.get('darquest-save-slot1'), first);
  assert.equal(load(1).name, 'First');
  assert.equal(listSaves().filter(s => s.occupied).length, 2);
  clearSave();
  assert.equal(load(2), null);
  assert.equal(data.get('darquest-save-slot1'), first);
}));

test('migration never replaces an existing slot and corrupt saves remain visible', () => withStorage(data => {
  data.set('darquest-save-v1', JSON.stringify(newPlayer('Legacy', 'frost')));
  data.set('darquest-save-slot1', JSON.stringify(newPlayer('Current', 'blaze')));
  data.set('darquest-save-slot3', '{corrupt');
  assert.equal(load(1).name, 'Current');
  const corrupt = listSaves()[2];
  assert.equal(corrupt.occupied, true);
  assert.equal(corrupt.player, null);
  assert.equal(data.get('darquest-save-slot3'), '{corrupt');
  assert.throws(() => setActiveSlot(0), RangeError);
}));

test('unavailable storage reports failure without pretending a new game was saved', () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem() { throw new Error('disabled'); } };
  try {
    assert.equal(save(newPlayer('Blocked', 'frost'), 1), false);
    assert.equal(clearSave(1), false);
    assert.equal(load(1), null);
  } finally { globalThis.localStorage = previous; }
});
