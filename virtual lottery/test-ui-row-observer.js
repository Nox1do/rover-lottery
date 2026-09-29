const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8');

assert.match(source, /^\/\/ @version\s+3\.0\.11$/m);
assert.match(source, /^\/\/ @run-at\s+document-idle$/m);
assert.ok(source.includes("const SCRIPT_VERSION = '3.0.11';"));

assert.ok(source.includes('function nodoContieneFilaResultado(node)'));
assert.ok(source.includes('function mutacionesContienenFilasResultado(mutations)'));
assert.ok(source.includes('function procesarCambiosResultados(mutations)'));
assert.ok(source.includes("document.querySelector('#resultadosLoteria')"));
assert.ok(source.includes('resultadosObserver.observe(contenedor'));
assert.ok(source.includes('const shellObserver = new MutationObserver(procesarCambiosShell)'));

assert.equal(source.includes('REINYECCION_DEBOUNCE_MS'), false);
assert.equal(source.includes('reinyeccionTimer'), false);
assert.equal(source.includes('programarReinyeccion'), false);

const start = source.indexOf('function nodoContieneFilaResultado(node)');
const end = source.indexOf('function mutacionesContienenFilasResultado', start);
const rowPredicate = source.slice(start, end);
assert.equal(rowPredicate.includes('.closest('), false,
    'The row observer must never promote descendants back to their parent row');

const callbackStart = source.indexOf('function procesarCambiosResultados(mutations)');
const callbackEnd = source.indexOf('function observarResultadosLoteria()', callbackStart);
const callback = source.slice(callbackStart, callbackEnd);
assert.equal(callback.includes('autoTick('), false,
    'UI mutations must never drive the AUTO engine');
assert.equal(callback.includes('setTimeout('), false,
    'UI row injection must not wait for timers');

// Behavioral model of the production predicate.
function node(matchesRow, containsRow) {
    return {
        nodeType: 1,
        matches: selector => selector === 'tr.res_tr' ? matchesRow : false,
        querySelector: selector => selector === 'tr.res_tr' && containsRow ? {} : null,
        closest: () => ({ fakeParentRow: true }) // must be irrelevant
    };
}
function containsRow(n) {
    if (!n || n.nodeType !== 1) return false;
    return !!(n.matches?.('tr.res_tr') || n.querySelector?.('tr.res_tr'));
}

assert.equal(containsRow(node(true, false)), true, 'direct row must trigger');
assert.equal(containsRow(node(false, true)), true, 'container with rows must trigger');
assert.equal(containsRow(node(false, false)), false,
    'button/SVG/span mutation inside a row must not trigger via closest');

const buttonMutation = [{addedNodes:[node(false,false)]}];
const rowMutation = [{addedNodes:[node(true,false)]}];
const tableMutation = [{addedNodes:[node(false,true)]}];
const mutationsContainRows = muts => muts.some(m => [...m.addedNodes].some(containsRow));

assert.equal(mutationsContainRows(buttonMutation), false);
assert.equal(mutationsContainRows(rowMutation), true);
assert.equal(mutationsContainRows(tableMutation), true);

// 100 self-mutations from button SVG/span changes must cause zero reinjections.
let reinjections = 0;
for (let i=0;i<100;i++) if (mutationsContainRows(buttonMutation)) reinjections++;
assert.equal(reinjections, 0);

new Function(source);
console.log('UI row observer regression suite: OK');
