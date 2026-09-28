const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8')
    .replace(/\}\)\(\);\s*$/, 'globalThis.__test={autoResolverConflicto};\n})();');

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
const { autoResolverConflicto } = context.__test;

const guardado={primera:'30',segunda:'31',tercera:'85',pick3:'730',pick4:'9999'};
const actual={primera:'30',segunda:'31',tercera:'85',pick3:'730',pick4:'3185'};

const resuelto=autoResolverConflicto(guardado,actual,{
    encontrada:true,procesada:true,valores:{...actual}
});
assert.equal(resuelto.estado,'DONE');
assert.deepEqual(JSON.parse(JSON.stringify(resuelto.resultado)),actual);
assert.equal(resuelto.motivo,'Fuente actualizada y Rover confirmado.');

const aunDistinto=autoResolverConflicto(guardado,actual,{
    encontrada:true,procesada:true,valores:{...actual,pick4:'0000'}
});
assert.equal(aunDistinto.estado,'CONFLICT');
assert.deepEqual(JSON.parse(JSON.stringify(aunDistinto.resultado)),actual);

console.log('CONFLICT con resultado guardado obsoleto: revalidación contra fuente actual OK');
