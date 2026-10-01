const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js','utf8')
    .replace(
        "    iniciarAutoLoterias();\n    observarResultadosLoteria();\n    iniciar();\n",
        ''
    )
    .replace(/\}\)\(\);\s*$/, `
globalThis.__viewTest = {
    extraerRutaLoadRover,
    esRutaVistaResultadosLoteria,
    esVistaResultadosLoteriaUI
};
})();
`);

let tableMarker = false;
const context = {
    location:{hostname:'www.roversport.net'},
    document:{
        head:{appendChild(){}},
        documentElement:{},
        hidden:false,
        visibilityState:'visible',
        hasFocus(){return true},
        body:{appendChild(){},classList:{add(){},remove(){}}},
        createElement(){return{textContent:'',dataset:{},classList:{toggle(){},add(){},remove(){}},appendChild(){},addEventListener(){}}},
        querySelector(selector){
            if(selector === '#tableResult input[name="primera"][loteria]') {
                return tableMarker ? {} : null;
            }
            return null;
        },
        querySelectorAll(){return[]},
        addEventListener(){}
    },
    MutationObserver:class{observe(){} disconnect(){}},
    Event:class{},
    DOMParser:class{},
    fetch:async()=>({ok:true,status:200,text:async()=>''}),
    navigator:{},
    GM_getValue:(_k,f)=>f,
    GM_setValue(){},
    GM_deleteValue(){},
    GM_openInTab(){},
    GM_addValueChangeListener(){return 1},
    GM_removeValueChangeListener(){},
    GM_getTab(cb){cb({})},
    GM_saveTab(_tab,cb){cb?.()},
    GM_getTabs(cb){cb({})},
    GM_xmlhttpRequest(){},
    setInterval(){},
    setTimeout(){return 1},
    clearTimeout(){},
    console:{log(){},info(){},warn(){},error(){},table(){}},
    Intl,Date,URL,URLSearchParams,Symbol,WeakMap,Set,Map,Math
};
vm.createContext(context);
vm.runInContext(source,context);

const api=context.__viewTest;

assert.equal(
    api.extraerRutaLoadRover("load('__inc/resultadosLoteria2.php');"),
    '__inc/resultadosLoteria2.php'
);
assert.equal(
    api.esRutaVistaResultadosLoteria('__inc/resultadosLoteria2.php'),
    true
);
assert.equal(
    api.esRutaVistaResultadosLoteria('__inc/resultadosLoteria2.php?lang=es'),
    true
);
for(const route of [
    '__inc/races.php',
    '__inc/super_pales.php',
    '__inc/horariosResultados.php',
    '__inc/resultadosLoteriasImagenes.php',
    '__inc/monitor_global_loteria.php'
]) {
    assert.equal(api.esRutaVistaResultadosLoteria(route),false,route);
}

// Tener solo #fecha no basta.
assert.equal(api.esVistaResultadosLoteriaUI(),false);

// Fallback si la tabla real ya está presente.
tableMarker=true;
assert.equal(api.esVistaResultadosLoteriaUI(),true);

assert.match(source,/^\/\/ @version\s+3\.2\.6$/m);
assert.ok(source.includes("document.addEventListener('click', registrarVistaAjaxRover, true)"));

const start=source.indexOf('function iniciar()');
const end=source.indexOf('// UI reactiva sin debounce:',start);
const iniciar=source.slice(start,end);
assert.ok(iniciar.includes('if (!esVistaResultadosLoteriaUI())'));
assert.ok(
    iniciar.indexOf('if (!esVistaResultadosLoteriaUI())') <
    iniciar.indexOf('instalarControlAuto();')
);
assert.ok(iniciar.includes('quitarControlAuto();'));

const controlStart=source.indexOf('function instalarControlAuto()');
const controlEnd=source.indexOf('// ============================================================\n    // THE QUEEN LOTTERY',controlStart);
const control=source.slice(controlStart,controlEnd);
assert.ok(control.includes('if (!esVistaResultadosLoteriaUI()) return;'));

console.log('UI view scope: gear only on resultadosLoteria2.php, not generic #fecha views OK');
