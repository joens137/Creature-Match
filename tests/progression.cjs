// Run with: node tests/progression.cjs
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { scripts, state } = require('./game-sources.cjs');
const context = vm.createContext({ console });
// Execute every external script in page order before the main state exists.
// This also verifies progression.js performs no premature reads or browser work.
for (const script of scripts.filter(s => s.path !== null)) vm.runInContext(script.source, context);
vm.runInContext(state + `
let writes = 0, animations = 0, confirms = 0, closes = 0, profiles = 0;
const events = [], achievements = [], messages = [], frames = [];
let essence = { fire: 0, grass: 0, water: 0, electric: 0, dark: 0 };
saveGameData = () => { writes++; };
const skillHpMult = () => 1;
const skillAtkMult = () => 1;
const trackQuestEvent = event => events.push(event);
const addAchievement = event => achievements.push(event);
const canAffordEssenceOne = (el, amount) => essence[el] >= amount;
const spendEssenceOne = (el, amount) => { essence[el] -= amount; };
const essenceWallet = () => essence;
const elementGlyphText = el => el;
const homeToast = message => messages.push(message);
const showToast = message => messages.push(message);
const playEvolutionAnimation = () => { animations++; };
const showBondConfirm = () => { confirms++; };
const closeBondConfirm = () => { closes++; };
const renderCreatureProfile = () => { profiles++; };
const requestAnimationFrame = fn => frames.push(fn);
const showAbilityOrientation = () => {};
function reset() {
    Object.keys(gameState).forEach(key => delete gameState[key]);
    Object.assign(gameState, JSON.parse(JSON.stringify(GAME_STATE_DEFAULTS)));
    writes = animations = confirms = closes = profiles = 0;
    events.length = achievements.length = messages.length = frames.length = 0;
    essence = { fire: 0, grass: 0, water: 0, electric: 0, dark: 0 };
}
function own(id, baseId = 1, level = 1) {
    const c = { id, baseId, level, xp: 0, mergeLevel: 0, mergeProgress: 0, evoTier: 0, bondLevel: 0, statRoll: neutralStatRoll() };
    gameState.creatures.push(c);
    return c;
}
`, context);
const run = code => vm.runInContext(code, context);
const plain = code => JSON.parse(run(`JSON.stringify(${code})`));

// XP crosses thresholds without losing leftovers and stops at the actual level cap.
run('reset(); own(1); grantCreatureXP([1], 25);');
assert.deepEqual(plain('[gameState.creatures[0].level, gameState.creatures[0].xp]'), [1, 25]);
run('grantCreatureXP([1], 1);');
assert.deepEqual(plain('[gameState.creatures[0].level, gameState.creatures[0].xp]'), [2, 0]);
run('grantCreatureXP([1], 65);');
assert.deepEqual(plain('[gameState.creatures[0].level, gameState.creatures[0].xp]'), [3, 1]);
run('grantCreatureXP([999], 100);'); // Missing IDs do not redirect awards.
run('gameState.creatures[0].level = 29; gameState.creatures[0].xp = 0; grantCreatureXP([1], 100000);');
assert.deepEqual(plain('[gameState.creatures[0].level, gameState.creatures[0].xp]'), [30, 0]);
assert.equal(run('xpGapMultiplier(30, 1)'), 0.1);
assert.equal(run('xpGapMultiplier(1, 30)'), 2);
assert.equal(run('xpGapMultiplier(10, 10)'), 1);
run('reset(); own(1); gameState.currentScreen = "battleMode"; grantCreatureXP([1], 26);');
assert.equal(run('frames.length'), 1, 'Level-two ability orientation was not queued');
assert.equal(run('gameState.tutorial.narrativeShown.abilityOrient'), true);
run('grantCreatureXP([1], 64);');
assert.equal(run('frames.length'), 1, 'Ability orientation was queued twice');

// Real species gates, essence payments, and evolved-name/stat behavior.
run('reset(); own(1, 1, 9); essence.fire = 100; evolveCreature(1);');
assert.equal(run('gameState.creatures[0].evoTier'), 0);
assert.equal(run('essence.fire'), 100);
run('gameState.creatures[0].level = 10; essence.fire = 14; evolveCreature(1);');
assert.equal(run('gameState.creatures[0].evoTier'), 0);
assert.equal(run('essence.fire'), 14);
run('essence.fire = 15; gameState.creatures[0].xp = 12; evolveCreature(1);');
assert.deepEqual(plain('[gameState.creatures[0].evoTier, gameState.creatures[0].xp, essence.fire]'), [1, 0, 0]);
assert.equal(run('gameState.dexEvoSeen[1]'), 1);
assert.equal(run('formName(1, 0, 1)'), 'Pyrelet');
assert.equal(run('animations'), 1);
run('gameState.creatures[0].level = 20; essence.fire = 30; evolveCreature(1);');
assert.equal(run('gameState.creatures[0].evoTier'), 2);
assert.equal(run('essence.fire'), 0);
assert.equal(run('canEvolve(gameState.creatures[0])'), false);
run('evolveCreature(1);');
assert.equal(run('animations'), 2, 'A max-evolution creature evolved again');
run('reset(); own(1, 1, 10); evolveCreature(1, { free: true });');
assert.equal(run('gameState.creatures[0].evoTier'), 1);
assert.equal(run('essence.fire'), 0);
run('reset(); own(1);');
assert.equal(run('getCreatureStats(gameState.creatures[0]).hp'), 175);
const baseStats = plain('getCreatureStats(gameState.creatures[0])');
const previewStats = plain('statsForRoll(gameState.creatures[0], { hp: 5, atk: 1, def: 1 })');
assert.ok(previewStats.hp > baseStats.hp && previewStats.atk > baseStats.atk && previewStats.def > baseStats.def);
assert.deepEqual(plain('gameState.creatures[0].statRoll'), { hp: 0, atk: 0, def: 0 });

// Merge consumes only matching fodder, clears its team slot, and carries progress.
run('reset(); own(1, 1, 12); own(2); own(3, 4); gameState.team = [1, 2, 3]; gameState.creatures[0].xp = 7; gameState.creatures[0].mergeProgress = 9;');
assert.equal(run('feedMerge(1, [1, 2, 3, 999])'), 1);
assert.deepEqual(plain('gameState.creatures.map(c => c.id)'), [1, 3]);
assert.deepEqual(plain('gameState.team'), [1, null, 3]);
assert.deepEqual(plain('[gameState.creatures[0].mergeLevel, gameState.creatures[0].mergeProgress, gameState.creatures[0].level, gameState.creatures[0].xp]'), [1, 0, 12, 7]);
assert.equal(run('mergeReqFor(gameState.creatures[0])'), 20);
assert.equal(run('writes'), 1);
run('own(4); own(5); gameState.creatures[0].mergeProgress = 19;');
assert.equal(run('feedMerge(1, [4, 5])'), 1);
assert.deepEqual(plain('[gameState.creatures[0].mergeLevel, gameState.creatures[0].mergeProgress]'), [2, 0]);
assert.equal(run('mergeReqFor(gameState.creatures[0])'), null);

// Bond entry checks, payment, max-tier protection, and existing UI/save hooks.
run('reset(); own(1, 1, 8); gameState.spirit = 100000; deepenBond(1);');
assert.equal(run('confirms'), 0);
run('gameState.creatures[0].level = 9; gameState.spirit = 1999; deepenBond(1);');
assert.equal(run('confirms'), 0);
run('gameState.spirit = 2000; deepenBond(1);');
assert.equal(run('confirms'), 1);
run('confirmDeepenBond(1);');
assert.deepEqual(plain('[gameState.creatures[0].bondLevel, gameState.spirit, writes, profiles]'), [1, 0, 1, 1]);
run('confirmDeepenBond(1);');
assert.equal(run('gameState.creatures[0].bondLevel'), 1);
run('gameState.creatures[0].bondLevel = 5; gameState.spirit = 100000; confirmDeepenBond(1);');
assert.equal(run('gameState.creatures[0].bondLevel'), 5);
assert.equal(run('gameState.spirit'), 100000);
console.log('Progression checks passed: XP thresholds/cap, ability unlock notification, evolution gates/costs/free path, stats preview, merging, and bonding.');
