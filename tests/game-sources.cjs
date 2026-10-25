const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(match => {
    const src = match[1].match(/\bsrc="([^"]+)"/);
    return {
        attributes: match[1],
        path: src ? src[1] : null,
        source: src ? fs.readFileSync(path.join(root, src[1]), 'utf8') : match[2]
    };
});
const main = scripts.find(s => s.path === null).source;
const stateStart = main.indexOf('const gameState = {');
const defaultsStart = main.indexOf('const GAME_STATE_DEFAULTS =', stateStart);
const state = main.slice(stateStart, main.indexOf(';', defaultsStart) + 1);
module.exports = { root, html, scripts, main, state };
