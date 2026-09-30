const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8');
const raw = 'https://raw.githubusercontent.com/Nox1do/rover-lottery/main/virtual%20lottery/virtual-lottery%20v2%20auto.user.js';

assert.match(source, /^\/\/ @version\s+3\.2\.0$/m);
assert.equal(source.includes('debugForzarAuto'), false);
assert.equal(source.includes('vl-debug-force'), false);
assert.ok(source.includes("if (!autoEsLiderTab() || !autoPuedeEmitir(codigo)) return false;"));
assert.ok(source.includes("origen === 'auto' && !autoPuedeEmitir(codigo)"));
assert.ok(source.includes("AUTO desactivado durante la validación de Rover."));
assert.match(source, /^\/\/ @grant\s+GM_getTab$/m);
assert.match(source, /^\/\/ @grant\s+GM_saveTab$/m);
assert.match(source, /^\/\/ @grant\s+GM_getTabs$/m);
assert.ok(source.includes("const AUTO_TAB_META_KEY = '__vlAutoLeaderV1';"));
assert.ok(source.includes("function autoElegirLiderTabs(tabs, now = Date.now())"));
assert.ok(source.includes("function autoEsLiderTab()"));
assert.ok(source.includes("navigator.locks.request('vl-auto-rover-post'"));
assert.ok(source.includes("GM_addValueChangeListener("));
assert.match(source, /^\/\/ @homepageURL\s+https:\/\/github\.com\/Nox1do\/rover-lottery$/m);
assert.match(source, /^\/\/ @source\s+https:\/\/github\.com\/Nox1do\/rover-lottery\/blob\/main\/virtual%20lottery\/virtual-lottery%20v2%20auto\.user\.js$/m);
assert.ok(source.includes('// @updateURL    ' + raw));
assert.ok(source.includes('// @downloadURL  ' + raw));

const header = source.slice(0, source.indexOf('// ==/UserScript=='));
assert.equal((header.match(/@updateURL/g) || []).length, 1);
assert.equal((header.match(/@downloadURL/g) || []).length, 1);

console.log('Tampermonkey update metadata: OK');
