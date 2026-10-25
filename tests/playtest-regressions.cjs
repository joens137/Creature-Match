// Run with: node tests/playtest-regressions.cjs
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { main, state, scripts } = require('./game-sources.cjs');
const functionSource = name => {
    const start = main.indexOf(`        function ${name}(`);
    assert.ok(start >= 0, `Missing function ${name}`);
    const tail = main.slice(start + 1);
    const next = tail.search(/^        function /m);
    return main.slice(start, next < 0 ? main.length : start + 1 + next);
};
const context = vm.createContext({ console });
for (const script of scripts.filter(s => s.path !== null && s.path !== 'progression.js')) vm.runInContext(script.source, context);
vm.runInContext(state + `
const storage = new Map();
const localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
let resumed = 0, renders = 0;
const beginTutorialBattle = n => { resumed = n; };
const checkLoginStreak = () => {};
const render = () => { renders++; };
const showNarrative = () => {};
const setTimeout = () => {};
` + functionSource('pendingTutorialBattle') + functionSource('init'), context);
const run = code => vm.runInContext(code, context);
function reloadFixture(phase, count, extra = {}) {
    context.fixture = {
        ...JSON.parse(run('JSON.stringify(GAME_STATE_DEFAULTS)')),
        selectedStarterElement: 'fire', spirit: 123, gems: 7,
        creatures: Array.from({ length: count }, (_, i) => ({ id: 100 + i, baseId: [1, 7, 4][i], level: 2, mergeLevel: 0, xp: 4 })),
        team: Array.from({ length: 3 }, (_, i) => i < count ? 100 + i : null),
        tutorial: { isComplete: false, currentPhase: phase, narrativeShown: {}, shopTabsSeen: {}, skipNarrative: false },
        ...extra
    };
    run('resumed = 0; storage.set("creatureMatchGame", JSON.stringify(fixture)); init();');
}
for (const [phase, count] of [[1, 1], [2, 2], [3, 3]]) {
    reloadFixture(phase, count);
    assert.equal(run('resumed'), phase, `Reload skipped tutorial battle ${phase}`);
    assert.equal(run('gameState.tutorial.isComplete'), false);
    assert.equal(run('gameState.creatures.length'), count, 'Reload duplicated/lost allies');
    assert.equal(run('gameState.spirit'), 123);
    assert.equal(run('gameState.gems'), 7);
}
reloadFixture(0, 2); // Existing pre-tutorial player still bypasses onboarding.
assert.equal(run('resumed'), 0);
assert.equal(run('gameState.tutorial.isComplete'), true);
reloadFixture(8, 2, { tutorial: { isComplete: true, currentPhase: 8, narrativeShown: {}, shopTabsSeen: {} } });
assert.equal(run('resumed'), 0);
assert.equal(run('gameState.currentScreen'), 'mainMenu');

// Real rename handler with a minimal DOM adapter; no browser-only dependencies needed.
vm.runInContext(`
let capturedHtml = '', lastOverlay = null;
const fields = {};
const element = () => ({ value: '', textContent: '', style: {}, handlers: {}, focus() {}, setSelectionRange() {}, addEventListener(type, fn) { this.handlers[type] = fn; } });
const document = {
  querySelectorAll: () => [], body: { appendChild() {} },
  createElement: () => {
    const overlay = element();
    overlay.querySelector = selector => fields[selector] || (fields[selector] = element());
    overlay.remove = () => {};
    lastOverlay = overlay;
    return overlay;
  }
};
const spriteImg = () => '';
const evoTierOf = c => c.evoTier || 0;
const formName = () => 'Cinder';
const mountOverlay = html => { capturedHtml = html; };
` + functionSource('displayName') + functionSource('escapeHtml') + functionSource('renameCreature'), context);
for (const nickname of ['<b>Bob</b>', 'A&B "Joe"', '&lt;Bob&gt;', '🔥 Éowyn']) {
    context.nickname = nickname;
    run('gameState.creatures[0].nickname = nickname; renameCreature(100);');
    assert.equal(run('fields["#renameInput"].value'), nickname, 'Reopening rename changed literal text');
    run('fields["#renameSave"].handlers.click();');
    assert.equal(run('gameState.creatures[0].nickname'), nickname);
    assert.equal(run('displayName(gameState.creatures[0])'), nickname, 'Canvas/save name was encoded');
}
run('fields["#renameInput"].value = ""; fields["#renameSave"].handlers.click();');
assert.equal(run('gameState.creatures[0].nickname'), undefined);
assert.equal(run('displayName(gameState.creatures[0])'), 'Cinder');

// Exercise the actual profile template with a nickname that used to create markup.
vm.runInContext(`
const getCreatureStats = () => ({ hp: 193, atk: 13, def: 7 });
const levelCapOf = () => 30;
const canEvolve = () => false;
const creatureXpNeeded = () => 64;
const mergeReqFor = () => 10;
const mergeFodderFor = () => [];
const rarityColor = () => '#fff';
const rankFromRoll = () => 'C';
const rankColor = () => '#fff';
const evoGatesFor = () => [10, 20];
const bondSectionHtml = () => '';
const passiveSectionHtml = () => '';
const a1SpecForSlot = () => ABILITIES[1].a1;
const a2SpecForSlot = () => ABILITIES[1].a2;
const abilityBtnHeaderDescHtml = () => '';
const activeA1Spec = () => ABILITIES[1].a1;
const activeA2Spec = () => ABILITIES[1].a2;
const describeA1Spec = () => '';
const describeAbilitySpec = () => '';
const requestAnimationFrame = () => {};
` + functionSource('renderCreatureProfile'), context);
run('gameState.selectedCreatureId = 100; gameState.creatures[0].nickname = "<b>Bob</b>"; renderCreatureProfile();');
assert.ok(run('capturedHtml.includes("&lt;b&gt;Bob&lt;/b&gt;")'));
assert.ok(!run('capturedHtml.includes("<b>Bob</b>")'));
assert.equal(run('escapeHtml("&<>\\\"\\\'")'), '&amp;&lt;&gt;&quot;&#39;');
assert.doesNotMatch(main, /\$\{displayName\(/, 'A direct nickname interpolation remains unescaped');
console.log('Tutorial reload (phases 1–3), legacy/completed routing, rename round trips, plain-text profile rendering, and HTML-boundary checks passed.');

