const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8');

assert.match(source, /^\/\/ @version\s+3\.0\.9$/m);
assert.match(source, /^\/\/ @run-at\s+document-start$/m);
assert.ok(source.includes('function instalarBotonFila(tr)'));
assert.ok(source.includes('function procesarMutacionesUI(mutations)'));
assert.ok(source.includes('mutation.addedNodes'));
assert.ok(source.includes('observer.observe(document, {'));
assert.ok(source.includes('function instalarEstilos()'));
assert.ok(source.includes('observer.observe(document, { childList: true, subtree: true });'),
    'EXTRA observer must also be safe at document-start');

assert.equal(source.includes('REINYECCION_DEBOUNCE_MS'), false);
assert.equal(source.includes('programarReinyeccion'), false);
assert.equal(source.includes('setTimeout(() => {\n            reinyeccionTimer'), false);

new Function(source);
console.log('UI lifecycle document-start/incremental: OK');
