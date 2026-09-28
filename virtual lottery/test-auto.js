const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load(initialProcessed = true) {
    const values = new Map();
    const calls = [];
    let processed = initialProcessed;
    let beforeLock = () => {};
    const source = fs.readFileSync('virtual-lottery-v2-auto.user.js', 'utf8')
        .replace('const AUTO_BRAZIL_ENABLED = true;', 'const AUTO_BRAZIL_ENABLED = false;')
        .replace(/\}\)\(\);\s*$/, 'globalThis.__test = { autoDebeSoloVerificar, autoConfig, autoResultadoValido, autoProximoChequeo, autoMinuto, autoUnico, autoEstado, autoEvaluar, LOTERIAS };\n})();');
    const result = { primera:'00', segunda:'05', tercera:'99', pick3:'007', pick4:'0001' };
    const row = {
        closest() { return this; },
        querySelector(selector) {
            if (selector === '.status-circle.status-ok') return processed ? {} : null;
            if (selector === 'input[name="primera"][loteria]') return { getAttribute: () => 'BRAZIL12PM' };
            const campo = selector.match(/^input\[name="([^"]+)"\]$/)?.[1];
            return campo ? { value: result[campo] } : null;
        }
    };
    const parsed = { querySelectorAll(selector) {
        return selector === 'input[name="primera"][loteria]'
            ? [{ getAttribute: () => 'BRAZIL12PM', closest: () => row }] : [];
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
        DOMParser: class { parseFromString() { return parsed; } },
        fetch: async (url) => { calls.push(url);
            if (url.includes('procesarResultados.php')) processed = true;
            return { ok: true, text: async () => '<table></table>' };
        },
        navigator: { locks: { request: async (_key, fn) => { beforeLock(); return fn(); } } },
        GM_getValue: (key, fallback) => values.get(key) ?? fallback,
        GM_setValue: (key, value) => values.set(key, value),
        setInterval() {}, setTimeout(fn) { fn(); return 1; }, clearTimeout() {},
        console, Intl, Date, URL, URLSearchParams, Symbol, WeakMap, Set
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return { ...context.__test, values, calls, setBeforeLock(fn) { beforeLock = fn; } };
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
const reloj = { fechaUs:'09/28/2026', fechaIso:'2026-09-28', minutoDia:20*60 };
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
console.log('Motor: catálogo, validación y recuperación sin segundo POST OK');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
