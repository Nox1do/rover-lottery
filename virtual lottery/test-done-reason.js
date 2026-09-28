const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8')
    .replace(/\}\)\(\);\s*$/, 'globalThis.__test={autoMotivoVisible};\n})();');

const context = {
    location:{hostname:'www.roversport.net'},
    document:{head:{appendChild(){}},documentElement:{},createElement(){return{textContent:''}},
        querySelector(){return null},querySelectorAll(){return[]}},
    MutationObserver:class{observe(){}}, Event:class{}, DOMParser:class{},
    fetch:async()=>({ok:true,status:200,text:async()=>''}),
    navigator:{locks:{request:async(_k,fn)=>fn()}},
    GM_getValue:(_k,f)=>f, GM_setValue(){}, GM_deleteValue(){}, GM_openInTab(){},
    GM_addValueChangeListener(){}, GM_removeValueChangeListener(){}, GM_xmlhttpRequest(){},
    setInterval(){}, setTimeout(){return 1}, clearTimeout(){},
    console:{log(){},warn(){},error(){},table(){}},
    Intl,Date,URL,URLSearchParams,Symbol,WeakMap,Set,Map
};
vm.createContext(context);
vm.runInContext(source, context);
const { autoMotivoVisible } = context.__test;

assert.equal(
    autoMotivoVisible({estado:'DONE', motivo:''}),
    'Procesado y verificado en Rover.'
);
assert.equal(
    autoMotivoVisible({estado:'DONE'}),
    'Procesado y verificado en Rover.'
);
assert.equal(
    autoMotivoVisible({estado:'DONE', motivo:'Fila ya procesada.'}),
    'Fila ya procesada.'
);
assert.equal(
    autoMotivoVisible({estado:'CONFLICT', motivo:''}),
    ''
);

console.log('Motivo visible para DONE vacío: OK');
