const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load(initialProcessed = true, code = 'BRAZIL12PM', rowValues = null) {
    const values = new Map();
    const calls = [];
    const tables = [];
    let processed = initialProcessed;
    let beforeLock = () => {};
    const source = fs.readFileSync('virtual-lottery-v2-auto.user.js', 'utf8')
        .replace('const AUTO_BRAZIL_ENABLED = true;', 'const AUTO_BRAZIL_ENABLED = false;')
        .replace(/\}\)\(\);\s*$/, 'globalThis.__test = { autoDebeSoloVerificar, autoConfig, autoResultadoValido, autoProximoChequeo, autoMinuto, autoUnico, autoModo, autoPuedeEmitir, autoEstado, autoGuardar, autoResumen, autoEvaluar, autoProcesar, parseRapid, LOTERIAS };\n})();');
    const result = { primera:'00', segunda:'05', tercera:'99', pick3:'007', pick4:'0001' };
    const inputs = Object.fromEntries(Object.keys(result).map(c => [c, {
        value: rowValues ? rowValues[c] : result[c],
        classList: { add() {}, remove() {} }, dispatchEvent() {}
    }]));
    const row = {
        closest() { return this; },
        querySelector(selector) {
            if (selector === '.status-circle.status-ok') return processed ? {} : null;
            if (selector === 'input[name="primera"][loteria]') return { getAttribute: () => code };
            const campo = selector.match(/^input\[name="([^"]+)"\]$/)?.[1];
            return campo ? inputs[campo] : null;
        }
    };
    const parsed = { querySelectorAll(selector) {
        return selector === 'input[name="primera"][loteria]'
            ? [{ getAttribute: () => code, closest: () => row }] : [];
    } };
    const context = {
        location: { hostname: 'www.roversport.net' },
        document: {
            head: { appendChild() {} },
            documentElement: {},
            createElement() { return { textContent: '' }; },
            querySelector() { return null; },
            querySelectorAll() { return []; }
        },
        MutationObserver: class { observe() {} },
        Event: class { constructor(type) { this.type = type; } },
        DOMParser: class { parseFromString() { return parsed; } },
        fetch: async (url) => { calls.push(url);
            if (url.includes('procesarResultados.php')) {
                processed = true;
                Object.keys(result).forEach(c => { inputs[c].value = result[c]; });
            }
            return { ok: true, text: async () => '<table></table>' };
        },
        navigator: { locks: { request: async (_key, fn) => { beforeLock(); return fn(); } } },
        GM_getValue: (key, fallback) => values.get(key) ?? fallback,
        GM_setValue: (key, value) => values.set(key, value),
        setInterval() {}, setTimeout(fn) { fn(); return 1; }, clearTimeout() {},
        console: { log() {}, warn() {}, error: console.error,
            table(rows) { tables.push(rows); } },
        Intl, Date, URL, URLSearchParams, Symbol, WeakMap, Set
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return { ...context.__test, values, calls, inputs, tables,
        showToday() {
            context.document.querySelector = selector => selector === '#fecha'
                ? { value: '09/28/2026' } : null;
            context.document.querySelectorAll = parsed.querySelectorAll;
        },
        setBeforeLock(fn) { beforeLock = fn; } };
}

async function main() {
const core = load();
assert.equal(core.autoDebeSoloVerificar('PROCESSING'), true);
assert.equal(core.autoDebeSoloVerificar('VERIFYING'), true);
assert.equal(core.autoDebeSoloVerificar('PROCESS_UNCERTAIN'), true);
assert.equal(core.autoDebeSoloVerificar('RESULT_READY'), false);
assert.equal(Object.keys(core.autoConfig).length, 25);
assert.equal(core.autoConfig.EXTRA, undefined);
assert.equal(core.autoMinuto('9:30 AM'), core.autoMinuto('09:30 AM'));
assert.equal(core.autoConfig['QLT-NIGHT'].minuto, 21 * 60 + 25);
assert.equal(core.autoUnico([{ id:1 }, { id:2 }], r => r.id === 1).id, 1);
assert.equal(core.autoUnico([{ id:1 }, { id:1 }], r => r.id === 1), null);
assert.equal(core.autoProximoChequeo({ estado: 'RESULT_READY', lastCheckAt: 1000 }, 30000), false);
assert.equal(core.autoProximoChequeo({ estado: 'RESULT_READY', lastCheckAt: 1000 }, 122000), true);
assert.equal(core.autoResultadoValido({ primera:'00', segunda:'05', tercera:'99', pick3:'007', pick4:'0001' }), true);
assert.equal(core.autoResultadoValido({ primera:'0', segunda:'05', tercera:'99', pick3:'007', pick4:'0001' }), false);
const rapidHoy = core.parseRapid({ history:[{
    datetime:'Monday, September 28 2026 11:00 AM',
    first:'63', second:'64', third:'87', pick3:'0,6,3', pick4:'6,4,8,7'
}] })[0];
assert.equal(rapidHoy.fecha, '09/28/2026');
assert.equal(rapidHoy.hora, '11:00 AM');
assert.equal(rapidHoy.pick3, '063');
assert.equal(rapidHoy.pick4, '6487');
assert.equal(core.autoResultadoValido(rapidHoy), true);
const politica = load();
politica.values.set('vl:auto:modo', 'RAPID');
assert.equal(politica.autoPuedeEmitir('RPL-11AM'), true);
assert.equal(politica.autoPuedeEmitir('BRAZIL12PM'), false);
assert.equal(politica.autoPuedeEmitir('EXTRA'), false);
const reloj = { fechaUs:'09/28/2026', fechaIso:'2026-09-28', minutoDia:20*60 };
const consola = load();
consola.autoResumen(reloj);
assert.equal(consola.tables.some(rows => rows.some(r => r.Loteria === 'RPL-11AM')), true);
consola.autoGuardar(reloj, 'RPL-11AM', { estado:'RESULT_READY' });
assert.equal(consola.tables.some(rows => rows.some(r => r.Loteria === 'RPL-11AM' &&
    r.Estado === 'RESULT_READY')), true);
core.values.set('vl:auto:brazil:2026-09-28:BRAZIL03PM', {
    estado:'VERIFYING', resultado: { primera:'00', segunda:'05', tercera:'99', pick3:'007', pick4:'0001' }
});
assert.equal(core.autoEstado(reloj, 'BRAZIL03PM').estado, 'VERIFYING');
assert.equal(core.values.get('vl:auto:v3:2026-09-28:BRAZIL03PM').estado, 'VERIFYING');
core.values.set('vl:auto:v3:2026-09-28:BRAZIL12PM', {
    estado:'PROCESSING', resultado: { primera:'00', segunda:'05', tercera:'99', pick3:'007', pick4:'0001' }
});
await core.autoEvaluar(reloj, 'BRAZIL12PM');
assert.equal(core.values.get('vl:auto:v3:2026-09-28:BRAZIL12PM').estado, 'DONE');
assert.deepEqual(core.calls, ['__inc/verResultados2.php']);
const emisor = load(false);
emisor.values.set('vl:auto:emisor', true);
emisor.values.set('vl:auto:v3:2026-09-28:BRAZIL12PM', {
    estado:'RESULT_READY', resultado: { primera:'00', segunda:'05', tercera:'99', pick3:'007', pick4:'0001' }
});
await emisor.autoEvaluar(reloj, 'BRAZIL12PM');
await emisor.autoEvaluar(reloj, 'BRAZIL12PM');
assert.equal(emisor.calls.filter(url => url.includes('procesarResultados.php')).length, 1);
assert.equal(emisor.values.get('vl:auto:v3:2026-09-28:BRAZIL12PM').estado, 'DONE');
const carrera = load(false);
carrera.values.set('vl:auto:emisor', true);
const key = 'vl:auto:v3:2026-09-28:BRAZIL12PM';
const resultado = { primera:'00', segunda:'05', tercera:'99', pick3:'007', pick4:'0001' };
carrera.values.set(key, { estado:'RESULT_READY', resultado });
carrera.setBeforeLock(() => carrera.values.set(key, { estado:'PROCESSING', resultado }));
await carrera.autoEvaluar(reloj, 'BRAZIL12PM');
assert.equal(carrera.calls.filter(url => url.includes('procesarResultados.php')).length, 0);
assert.equal(carrera.values.get(key).estado, 'PROCESS_UNCERTAIN');
const rapid = load(false, 'RPL-11AM', {
    primera:'', segunda:'', tercera:'', pick3:'', pick4:''
});
rapid.showToday();
await rapid.autoProcesar(reloj, 'RPL-11AM', resultado);
assert.equal(rapid.values.get('vl:auto:v3:2026-09-28:RPL-11AM').estado, 'RESULT_READY');
assert.equal(rapid.inputs.primera.value, '00');
assert.equal(rapid.inputs.pick4.value, '0001');
assert.equal(rapid.calls.filter(url => url.includes('procesarResultados.php')).length, 0);
const rapidEmisor = load(false, 'RPL-11AM', {
    primera:'', segunda:'', tercera:'', pick3:'', pick4:''
});
rapidEmisor.values.set('vl:auto:modo', 'RAPID');
rapidEmisor.values.set('vl:auto:v3:2026-09-28:RPL-11AM', {
    estado:'RESULT_READY', resultado
});
await rapidEmisor.autoEvaluar(reloj, 'RPL-11AM');
assert.equal(rapidEmisor.calls.filter(url => url.includes('procesarResultados.php')).length, 1);
assert.equal(rapidEmisor.values.get('vl:auto:v3:2026-09-28:RPL-11AM').estado, 'DONE');
const otro = load(false);
otro.values.set('vl:auto:modo', 'RAPID');
otro.values.set('vl:auto:v3:2026-09-28:BRAZIL12PM', {
    estado:'RESULT_READY', resultado
});
await otro.autoEvaluar(reloj, 'BRAZIL12PM');
assert.equal(otro.calls.filter(url => url.includes('procesarResultados.php')).length, 0);
console.log('Motor: Rapid automático, otras fuentes en observación y recuperación segura OK');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
