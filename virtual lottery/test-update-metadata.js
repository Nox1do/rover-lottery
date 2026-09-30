const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8');
const raw = 'https://raw.githubusercontent.com/Nox1do/rover-lottery/diagnostic-3.1.8D4/virtual%20lottery/virtual-lottery%20v2%20auto.user.js';

assert.match(source, /^\/\/ @version\s+3\.1\.8D4$/m);
assert.ok(source.includes("function debugForzarAuto(codigo)"));
assert.ok(source.includes("window.addEventListener('vl-debug-force'"));
assert.ok(source.includes("async function debugRecheckAuto(codigo)"));
assert.ok(source.includes("window.addEventListener('vl-debug-recheck'"));
assert.ok(source.includes("window.addEventListener('message'"));
assert.ok(source.includes("VL_DEBUG_RECHECK:([A-Z0-9-]+)(?::"));
assert.ok(source.includes("async function debugRecheckAuto(codigo, fechaUs = '')"));
assert.ok(source.includes("function debugRelojFecha(fechaUs = '')"));
assert.ok(source.includes("async function debugFuenteFecha(codigo, reloj)"));
const installStart = source.indexOf('function instalarDiagnosticoAuto()');
const installEnd = source.indexOf('function autoResumen', installStart);
const installBody = source.slice(installStart, installEnd);
assert.ok(installBody.includes("debugRecheckAuto(match[1], match[2] || '')"));
assert.equal(installBody.includes("debugForzarAuto(match[1])"), false);
const recheckStart = source.indexOf('async function debugRecheckAuto(codigo)');
const recheckEnd = source.indexOf('function instalarDiagnosticoAuto()', recheckStart);
const recheckBody = source.slice(recheckStart, recheckEnd);
assert.ok(recheckBody.includes('autoCache.delete(fuente);'));
assert.ok(recheckBody.includes('await debugFuenteFecha(target, reloj);'));
assert.ok(recheckBody.includes('await autoConsultar(reloj, target, resultadoFuente, true);'));
assert.equal(recheckBody.includes('autoProcesar('), false);
assert.equal(recheckBody.includes("procesarResultados.php"), false);
assert.equal(recheckBody.includes('autoPost('), false);
const debugStart = source.indexOf('async function debugForzarAuto(codigo)');
const debugEnd = source.indexOf('function instalarDiagnosticoAuto()', debugStart);
const debugBody = source.slice(debugStart, debugEnd);
assert.ok(debugBody.includes('await autoEvaluar(relojForzado, target);'));
assert.equal(debugBody.includes('procesarResultados.php'), false);
assert.equal(debugBody.includes('autoPost('), false);
assert.match(source, /^\/\/ @homepageURL\s+https:\/\/github\.com\/Nox1do\/rover-lottery$/m);
assert.match(source, /^\/\/ @source\s+https:\/\/github\.com\/Nox1do\/rover-lottery\/blob\/diagnostic-3\.1\.8D4\/virtual%20lottery\/virtual-lottery%20v2%20auto\.user\.js$/m);
assert.ok(source.includes('// @updateURL    ' + raw));
assert.ok(source.includes('// @downloadURL  ' + raw));

const header = source.slice(0, source.indexOf('// ==/UserScript=='));
assert.equal((header.match(/@updateURL/g) || []).length, 1);
assert.equal((header.match(/@downloadURL/g) || []).length, 1);

console.log('Tampermonkey update metadata: OK');
