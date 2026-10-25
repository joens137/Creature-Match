// Run with: node tests/script-loading.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const save = fs.readFileSync(path.join(root, 'save.js'), 'utf8');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 2);
assert.match(scripts[0][1], /src="save.js"/);
assert.doesNotMatch(scripts[0][1], /async|defer/);
assert.match(html, /<link rel="stylesheet" href="styles.css">/);
assert.ok(fs.statSync(path.join(root, 'styles.css')).size > 0);
const main = scripts[1][2];
new vm.Script(save + '\n' + main);
// Run real state/database declarations with the extracted save script loaded first.
// This catches loading-order and real species-ID compatibility regressions.
const dbStart = main.indexOf('const creatureDatabase = {');
const dbEnd = main.indexOf('\n        };', dbStart) + '\n        };'.length;
const state = main.slice(main.indexOf('const gameState = {'), dbStart);
const context = vm.createContext({ console });
vm.runInContext(save, context);
vm.runInContext(state + main.slice(dbStart, dbEnd) + `
const ELEMENTS = ['fire','water','grass','electric','dark'];
const result = validateSaveData({
  creatures: [{ id: 123.5, baseId: 1, level: 1, mergeLevel: 0, xp: 0 }],
  team: [123.5, null, null], selectedStarterElement: 'fire'
});
if (!result.ok) throw new Error(result.reason);
`, context);
console.log('Script order, stylesheet reference, combined syntax, and actual-database save compatibility passed.');
