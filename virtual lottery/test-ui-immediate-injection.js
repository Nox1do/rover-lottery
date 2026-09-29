const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8');

assert.match(source, /^\/\/ @run-at\s+document-idle$/m);
assert.equal(source.includes('REINYECCION_DEBOUNCE_MS'), false);
assert.equal(source.includes('programarReinyeccion'), false);
assert.ok(source.includes("document.querySelector('#resultadosLoteria')"));
assert.ok(source.includes('resultadosObserver.observe(contenedor'));
assert.ok(source.includes('childList: true'));
assert.ok(source.includes('subtree: true'));

const callbackStart = source.indexOf('function procesarCambiosResultados(mutations)');
const callbackEnd = source.indexOf('function observarResultadosLoteria()', callbackStart);
const callback = source.slice(callbackStart, callbackEnd);
assert.equal(callback.includes('setTimeout('), false);
assert.equal(callback.includes('autoTick('), false);

new Function(source);
console.log('UI immediate injection: no fixed delay and no AUTO coupling');
