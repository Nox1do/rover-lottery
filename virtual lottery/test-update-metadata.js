const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8');
const raw = 'https://raw.githubusercontent.com/Nox1do/rover-lottery/main/virtual%20lottery/virtual-lottery%20v2%20auto.user.js';

assert.match(source, /^\/\/ @version\s+3\.1\.8D$/m);
assert.ok(source.includes("function debugForzarAuto(codigo)"));
assert.ok(source.includes("window.addEventListener('vl-debug-force'"));
const debugStart = source.indexOf('async function debugForzarAuto(codigo)');
const debugEnd = source.indexOf('function instalarDiagnosticoAuto()', debugStart);
const debugBody = source.slice(debugStart, debugEnd);
assert.ok(debugBody.includes('await autoEvaluar(relojForzado, target);'));
assert.equal(debugBody.includes('procesarResultados.php'), false);
assert.equal(debugBody.includes('autoPost('), false);
assert.match(source, /^\/\/ @homepageURL\s+https:\/\/github\.com\/Nox1do\/rover-lottery$/m);
assert.match(source, /^\/\/ @source\s+https:\/\/github\.com\/Nox1do\/rover-lottery\/blob\/main\/virtual%20lottery\/virtual-lottery%20v2%20auto\.user\.js$/m);
assert.ok(source.includes('// @updateURL    ' + raw));
assert.ok(source.includes('// @downloadURL  ' + raw));

const header = source.slice(0, source.indexOf('// ==/UserScript=='));
assert.equal((header.match(/@updateURL/g) || []).length, 1);
assert.equal((header.match(/@downloadURL/g) || []).length, 1);

console.log('Tampermonkey update metadata: OK');
