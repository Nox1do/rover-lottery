const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8')
    .replace(
        '    iniciarAutoLoterias();\n    observarResultadosLoteria();\n    iniciar();\n',
        ''
    )
    .replace(/\}\)\(\);\s*$/, `
globalThis.__test = {
    autoConfig, autoConfiguracion, autoGuardarConfiguracion, autoPuedeEmitir,
    autoIntentosAgotados, autoTextoIntento, AUTO_INTERVALOS_MS, AUTO_MAX_BUSQUEDAS
};
})();`);

function load(mode = 'OBSERVAR') {
    const values = new Map([['vl:auto:modo', mode]]);
    const context = {
        location:{hostname:'www.roversport.net'},
        document:{
            head:{appendChild(){}}, documentElement:{},
            body:{appendChild(){},classList:{add(){},remove(){}}},
            createElement(){return{textContent:'',dataset:{},classList:{toggle(){},add(){},remove(){}},appendChild(){},addEventListener(){}}},
            querySelector(){return null}, querySelectorAll(){return[]}
        },
        MutationObserver:class{observe(){} disconnect(){}},
        Event:class{}, DOMParser:class{},
        fetch:async()=>({ok:true,status:200,text:async()=>''}),
        navigator:{},
        GM_getValue:(k,f)=>values.has(k)?values.get(k):f,
        GM_setValue:(k,v)=>values.set(k,v),
        GM_deleteValue:k=>values.delete(k),
        GM_openInTab(){}, GM_addValueChangeListener(){}, GM_removeValueChangeListener(){}, GM_xmlhttpRequest(){},
        setInterval(){}, setTimeout(){return 1}, clearTimeout(){},
        console:{log(){},info(){},warn(){},error(){},table(){}},
        Intl,Date,URL,URLSearchParams,Symbol,WeakMap,Set,Map
    };
    vm.createContext(context);
    vm.runInContext(source,context);
    return {...context.__test, values};
}

const rapid = load('RAPID');
const rapidConfig = rapid.autoConfiguracion();
assert.equal(rapidConfig.enabled, true);
assert.equal(Object.values(rapidConfig.lotteries).filter(x=>x.enabled).length, 6);
assert.equal(rapid.autoPuedeEmitir('RPL-11AM'), true);
assert.equal(rapid.autoPuedeEmitir('BRAZIL12PM'), false);

const todos = load('TODOS');
assert.equal(Object.values(todos.autoConfiguracion().lotteries).filter(x=>x.enabled).length, 25);

const observar = load('OBSERVAR');
assert.equal(observar.autoConfiguracion().enabled, false);
assert.equal(Object.values(observar.autoConfiguracion().lotteries).some(x=>x.enabled), false);

const custom = load('RAPID');
const lotteries = Object.fromEntries(Object.keys(custom.autoConfig).map(codigo => [
    codigo, {enabled: codigo === 'QLT-MIDDAY'}
]));
const saved = custom.autoGuardarConfiguracion({
    enabled:true, intervalMs:15000, maxRetries:3, lotteries
});
assert.equal(saved.intervalMs,15000);
assert.equal(saved.maxRetries,3);
assert.equal(custom.autoPuedeEmitir('QLT-MIDDAY'),true);
assert.equal(custom.autoPuedeEmitir('RPL-11AM'),false);
assert.equal(custom.autoIntentosAgotados({searchAttempts:2},saved),false);
assert.equal(custom.autoIntentosAgotados({searchAttempts:3},saved),true);
assert.equal(custom.autoTextoIntento(4,0),'4/∞');

assert.deepEqual([...custom.AUTO_INTERVALOS_MS],[10000,15000,30000,60000,120000]);
assert.deepEqual([...custom.AUTO_MAX_BUSQUEDAS],[0,3,5,10,15]);

console.log('Configuración AUTO: migración, selección, intervalos y límites OK');
