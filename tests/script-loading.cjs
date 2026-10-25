// Run with: node tests/script-loading.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { root, html, scripts, main, state } = require('./game-sources.cjs');
assert.deepEqual(scripts.map(s => s.path), [
    'data/balance.js', 'data/creatures.js', 'data/abilities.js', 'data/world.js', 'save.js', null
]);
for (const script of scripts) {
    assert.doesNotMatch(script.attributes, /async|defer/);
    new vm.Script(script.source, { filename: script.path || 'index.html' });
}
assert.match(html, /<link rel="stylesheet" href="styles.css">/);
assert.ok(fs.statSync(path.join(root, 'styles.css')).size > 0);
new vm.Script(scripts.map(s => s.source).join('\n'));
// Evaluate separate files in browser order. Data files must not need the DOM or live state.
const context = vm.createContext({ console });
for (const script of scripts.filter(s => s.path !== null)) {
    vm.runInContext(script.source, context, { filename: script.path });
}
vm.runInContext(state + `
const result = validateSaveData({
  creatures: [{ id: 123.5, baseId: 1, level: 1, mergeLevel: 0, xp: 0 }],
  team: [123.5, null, null], selectedStarterElement: 'fire'
});
if (!result.ok) throw new Error(result.reason);
`, context);
// Every species must retain evolution and ability coverage after extraction.
const data = vm.runInContext('({ creatureDatabase, EVO_NAMES, ABILITIES, PASSIVE_TABLE, SUMMON_POOL, levelData, LEVEL_XP_TABLE, CREATURE_MAX_LEVEL, ELEMENTS, elementAdvantages })', context);
for (const [id, species] of Object.entries(data.creatureDatabase)) {
    assert.ok(data.ELEMENTS.includes(species.element), `Unknown element for ${id}`);
    assert.equal(data.EVO_NAMES[id].length, 2, `Missing evolution names for ${id}`);
    assert.ok(data.ABILITIES[id]?.a1 && data.ABILITIES[id]?.a2, `Missing abilities for ${id}`);
}
for (const pool of Object.values(data.SUMMON_POOL)) {
    for (const id of pool) assert.ok(data.creatureDatabase[id], `Unknown summon species ${id}`);
}
for (const levels of Object.values(data.levelData)) {
    for (const level of levels) {
        for (const enemy of level.enemies) assert.ok(data.creatureDatabase[enemy.id], `Unknown story species ${enemy.id}`);
    }
}
assert.equal(data.LEVEL_XP_TABLE.length, data.CREATURE_MAX_LEVEL);
for (const element of data.ELEMENTS) {
    assert.equal(data.elementAdvantages[element].length, 2);
    for (const target of data.elementAdvantages[element]) assert.ok(data.ELEMENTS.includes(target));
}
console.log('Script order, stylesheet, combined syntax, isolated data loading, species/ability/encounter coverage, XP table, and real-save compatibility passed.');
