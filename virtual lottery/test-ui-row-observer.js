const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8');

assert.match(source, /^\/\/ @version\s+3\.1\.1$/m);
assert.match(source, /^\/\/ @run-at\s+document-idle$/m);
assert.ok(source.includes("const SCRIPT_VERSION = '3.1.1';"));

assert.ok(source.includes('function nodoContieneFilaResultado(node)'));
assert.ok(source.includes('function mutacionesContienenFilasResultado(mutations)'));
assert.ok(source.includes('function procesarCambiosResultados(mutations)'));
assert.ok(source.includes('function observarResultadosLoteria()'));
assert.ok(source.includes('resultadosObserver.observe(contenedor'));
assert.ok(source.includes('const shellObserver = new MutationObserver(procesarCambiosShell)'));

assert.equal(source.includes('REINYECCION_DEBOUNCE_MS'), false);
assert.equal(source.includes('reinyeccionTimer'), false);
assert.equal(source.includes('programarReinyeccion'), false);

const rowStart = source.indexOf('function nodoContieneFilaResultado(node)');
const rowEnd = source.indexOf('function mutacionesContienenFilasResultado', rowStart);
const rowPredicate = source.slice(rowStart, rowEnd);
assert.equal(rowPredicate.includes('.closest('), false);

const resultStart = source.indexOf('function procesarCambiosResultados(mutations)');
const resultEnd = source.indexOf('function observarResultadosLoteria()', resultStart);
const resultCallback = source.slice(resultStart, resultEnd);
assert.equal(resultCallback.includes('autoTick('), false);
assert.equal(resultCallback.includes('setTimeout('), false);
assert.ok(resultCallback.includes('iniciar();'));

const shellStart = source.indexOf('function procesarCambiosShell(mutations)');
const shellEnd = source.indexOf('iniciarAutoLoterias();', shellStart);
const shellCallback = source.slice(shellStart, shellEnd);
assert.equal(shellCallback.includes('autoTick('), false);
assert.equal(shellCallback.includes('setTimeout('), false);
assert.ok(shellCallback.indexOf('observarResultadosLoteria();') < shellCallback.indexOf('iniciar();'));

const initStart = source.indexOf('function iniciar()');
const initEnd = source.indexOf('function nodoContieneFilaResultado', initStart);
const init = source.slice(initStart, initEnd);
assert.ok(init.indexOf('instalarListenerFecha();') < init.indexOf('if (!esPaginaRoverValida()) return;'));
assert.ok(init.indexOf('instalarControlAuto();') < init.indexOf('if (!esPaginaRoverValida()) return;'));

function node({row=false, containsRow=false, shell=false, containsShell=false} = {}) {
    return {
        nodeType: 1,
        matches(selector) {
            if (selector === 'tr.res_tr') return row;
            if (selector === '#resultadosLoteria, #fecha') return shell;
            return false;
        },
        querySelector(selector) {
            if (selector === 'tr.res_tr') return containsRow ? {} : null;
            if (selector === '#resultadosLoteria, #fecha') return containsShell ? {} : null;
            return null;
        },
        closest() { return { shouldNeverBeUsed: true }; }
    };
}

const containsRow = n => !!n && n.nodeType === 1 &&
    !!(n.matches?.('tr.res_tr') || n.querySelector?.('tr.res_tr'));
const containsShell = n => !!n && n.nodeType === 1 &&
    !!(n.matches?.('#resultadosLoteria, #fecha') || n.querySelector?.('#resultadosLoteria, #fecha'));
const mutationsContain = (mutations, predicate) =>
    mutations.some(m => [...m.addedNodes].some(predicate));

assert.equal(containsRow(node({row:true})), true);
assert.equal(containsRow(node({containsRow:true})), true);
assert.equal(containsRow(node()), false);
assert.equal(containsShell(node({shell:true})), true);
assert.equal(containsShell(node({containsShell:true})), true);
assert.equal(containsShell(node({row:true})), false);

const internalMutation = [{addedNodes:[node(), node()]}];
for (let i = 0; i < 100; i++) {
    assert.equal(mutationsContain(internalMutation, containsRow), false);
    assert.equal(mutationsContain(internalMutation, containsShell), false);
}

assert.equal(mutationsContain([{addedNodes:[node({containsRow:true})]}], containsRow), true);

new Function(source);
console.log('UI scoped observer + lifecycle race regression suite: OK');
