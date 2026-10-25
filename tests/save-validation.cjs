// Run with: node tests/save-validation.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const saveScript = fs.readFileSync(require('node:path').join(__dirname, '../save.js'), 'utf8');
new vm.Script(saveScript);
const gameScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const script = gameScript + '\n' + saveScript;
new vm.Script(script); // Parse the complete game, not just the extracted functions.
const extract = (start, end) => script.slice(script.indexOf(start), script.indexOf(end, script.indexOf(start)));
const state = script.slice(script.indexOf('const gameState = {'), script.indexOf('const creatureDatabase = {'));
const validation = extract('function validateSaveData(', 'function loadGameData(');
const loader = extract('function loadGameData(', '// Set when storage');
const parser = saveScript.slice(saveScript.indexOf('function parseSaveCode('));
const importer = extract('function applyImportedSave(', 'function closeSaveCodeOverlay(');
const context = vm.createContext({ console });
vm.runInContext(state + `
const creatureDatabase = { 1: {}, FC1: {} };
const ELEMENTS = ['fire', 'water', 'grass', 'electric', 'dark'];
let storageUnavailable = false, saveLoadFailed = false;
const storage = new Map();
const localStorage = { getItem: k => storage.get(k) || null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) };
const SAVE_CODE_PREFIX = 'CMB1.';
const b64ToUtf8 = s => s;
let lastToast = '';
const homeToast = message => { lastToast = message; };
` + validation + loader + parser + importer, context);
let count = 0;
const run = code => vm.runInContext(code, context);
const valid = { creatures: [{ id: 1.25, baseId: 'FC1', level: 1, mergeLevel: 0, xp: 0 }], team: [1.25, null, null] };
const check = (data, expected) => {
  const before = JSON.stringify(data);
  context.input = data;
  assert.equal(run('validateSaveData(input).ok'), expected);
  assert.equal(JSON.stringify(data), before, 'validator mutated input');
  count++;
};
check(valid, true);
check({ creatures: [{ ...valid.creatures[0], baseId: 1 }], team: [1.25] }, true);
check({ creatures: [], team: [] }, true);
for (const patch of [
  { creatures: {} }, { creatures: [null] }, { creatures: [{}] },
  { creatures: [{ ...valid.creatures[0], baseId: 'missing' }] },
  { creatures: [valid.creatures[0], valid.creatures[0]] },
  { creatures: [{ ...valid.creatures[0], level: '1' }] },
  { creatures: [{ ...valid.creatures[0], statRoll: {} }] },
  { team: [999] }, { team: [1.25, 1.25] }, { team: {} },
  { tutorial: { narrativeShown: null } }, { quests: { daily: {} } },
  { spirit: -1 }, { gems: '5' }, { skillLevels: { attack: '3' } },
  { formations: [null] }, { achievements: [null] }
]) check({ ...valid, ...patch }, false);
check(JSON.parse('{"creatures":[],"team":[],"__proto__":{"polluted":true}}'), false);
context.input = { ...valid, coins: 15, pokedex: { FC1: true }, tutorial: { currentPhase: 2 }, formations: [[999, 1.25, 1.25]] };
assert.equal(run('validateSaveData(input).data.spirit'), 15);
assert.equal(run('validateSaveData(input).data.creaturedex.FC1'), true);
assert.equal(run('validateSaveData(input).data.tutorial.isComplete'), false);
assert.equal(run('JSON.stringify(validateSaveData(input).data.formations)'), '[[null,1.25,null]]');
assert.equal(run('parseSaveCode("CMB1." + JSON.stringify({creatures:[null],team:[]})).ok'), false);
// Reject again at the import mutation boundary, preserving memory and disk.
run('storage.set("creatureMatchGame", "keep me");');
assert.equal(run('applyImportedSave({creatures:[null],team:[]})'), false);
assert.equal(run('storage.get("creatureMatchGame")'), 'keep me');
assert.equal(run('gameState.creatures.length'), 0);
// A malformed disk save is backed up before any assignment to live state.
run('storage.set("creatureMatchGame", JSON.stringify({creatures:{},team:[]})); loadGameData();');
assert.equal(run('saveLoadFailed'), true);
assert.equal(run('gameState.creatures.length'), 0);
assert.equal(run('storage.has("creatureMatchGame_corrupt_backup")'), true);
assert.equal(run('storage.has("creatureMatchGame")'), false);
context.input = valid;
run('storage.set("creatureMatchGame", JSON.stringify(input)); loadGameData();');
assert.equal(run('gameState.creatures[0].bondLevel'), 0);
assert.equal(run('gameState.team[0]'), 1.25);
console.log(`${count} validation cases plus migration, import, disk recovery, and full-script syntax checks passed.`);
