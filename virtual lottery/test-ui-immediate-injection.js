const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8');

assert.match(source, /^\/\/ @version\s+3\.0\.10$/m);
assert.match(source, /^\/\/ @run-at\s+document-idle$/m);
assert.ok(source.includes("const SCRIPT_VERSION = '3.0.10';"));
assert.ok(source.includes('[Virtual Lotteries] v'));
assert.ok(source.includes('const REINYECCION_DEBOUNCE_MS = 450;'));
assert.ok(source.includes('function programarReinyeccion()'));
assert.ok(source.includes('const observer = new MutationObserver(() => programarReinyeccion());'));

assert.equal(source.includes('function procesarMutacionesUI(mutations)'), false);
assert.equal(source.includes("observer.observe(document, {\n        childList: true,\n        subtree: true\n    });"), false);

new Function(source);
console.log('UI stable lifecycle rollback: OK');
