const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8');
const raw = 'https://raw.githubusercontent.com/Nox1do/rover-lottery/main/virtual%20lottery/virtual-lottery%20v2%20auto.user.js';

assert.match(source, /^\/\/ @version\s+3\.2\.2$/m);
assert.equal(source.includes('debugForzarAuto'), false);
assert.equal(source.includes('vl-debug-force'), false);
assert.ok(source.includes("if (!autoEsLiderTab() || !autoPuedeEmitir(codigo)) return false;"));
assert.ok(source.includes("guardado.origen === 'auto' &&"));
assert.ok(source.includes("(!autoEsLiderTab() || !autoPuedeEmitir(codigo))"));
assert.ok(source.includes("AUTO desactivado durante la validación de Rover."));
assert.match(source, /^\/\/ @grant\s+GM_getTab$/m);
assert.match(source, /^\/\/ @grant\s+GM_saveTab$/m);
assert.match(source, /^\/\/ @grant\s+GM_getTabs$/m);
assert.ok(source.includes("const AUTO_TAB_META_KEY = '__vlAutoLeaderV1';"));
assert.ok(source.includes("function autoElegirLiderTabs(tabs, now = Date.now())"));
assert.ok(source.includes("function autoEsLiderTab()"));
assert.ok(source.includes("navigator.locks.request('vl-auto-rover-post'"));
assert.ok(source.includes("GM_addValueChangeListener("));
assert.ok(source.includes("const AUTO_TAB_STALE_VISIBLE_MS = 15000;"));
assert.ok(source.includes("const AUTO_TAB_STALE_HIDDEN_MS = 120000;"));
assert.ok(source.includes("function autoSignalTrabajoActual(signal, reloj = autoAhoraRD())"));
assert.ok(source.includes("function autoTieneResultadoListo(reloj = autoAhoraRD())"));
assert.ok(source.includes("function autoTieneTrabajoPrioritario(reloj = autoAhoraRD())"));
assert.ok(source.includes("autoPublicarResultadoListo(reloj, codigo, 'source-result-ready')"));
assert.ok(source.includes("function autoTabFocusedAhora()"));
assert.ok(source.includes("function autoPrioridadTab(meta)"));
assert.ok(source.includes("function autoProcesarTrabajoPrioritario(reloj = autoAhoraRD())"));
assert.ok(source.includes("autoProcesarTrabajoPrioritario(reloj);"));
assert.ok(source.includes("autoReiniciarScheduler(true, true);"));
assert.ok(source.includes("window.addEventListener('blur'"));
assert.ok(source.includes("lastFocusAt"));
assert.ok(source.includes("tab líder · enfocado"));
assert.ok(source.includes("handoff-inside-lock"));
assert.ok(source.includes("handoff-before-post"));
assert.match(source, /^\/\/ @homepageURL\s+https:\/\/github\.com\/Nox1do\/rover-lottery$/m);
assert.match(source, /^\/\/ @source\s+https:\/\/github\.com\/Nox1do\/rover-lottery\/blob\/main\/virtual%20lottery\/virtual-lottery%20v2%20auto\.user\.js$/m);
assert.ok(source.includes('// @updateURL    ' + raw));
assert.ok(source.includes('// @downloadURL  ' + raw));

const listenerStart = source.indexOf("autoTabSignalListenerId = GM_addValueChangeListener(");
const listenerEnd = source.indexOf("if (autoSettingsListenerId === null)", listenerStart);
const signalListener = source.slice(listenerStart, listenerEnd);
assert.ok(signalListener.includes("autoProcesarTrabajoPrioritario(autoAhoraRD())"));
assert.equal(signalListener.includes("autoReiniciarScheduler(true, false)"), false);

const header = source.slice(0, source.indexOf('// ==/UserScript=='));
assert.equal((header.match(/@updateURL/g) || []).length, 1);
assert.equal((header.match(/@downloadURL/g) || []).length, 1);

console.log('Tampermonkey update metadata: OK');
