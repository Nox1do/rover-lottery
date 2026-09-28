const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8')
    .replace(/\}\)\(\);\s*$/, 'globalThis.__test={autoConsultar};\n})();');

function makeRow(code) {
    const values={primera:'11',segunda:'22',tercera:'33',pick3:'123',pick4:'2233'};
    return {
        querySelector(selector) {
            if (selector === '.status-circle.status-ok') return null;
            const name=selector.match(/^input\[name="([^"]+)"(?:\[loteria\])?\]$/)?.[1];
            if (!name) return null;
            if (name === 'primera' && selector.includes('[loteria]')) {
                return { getAttribute:n=>n==='loteria'?code:'', value:values.primera };
            }
            return { value:values[name] ?? '', getAttribute:n=>n==='loteria'?code:'' };
        }
    };
}
function makeDoc(found, code='RPL-7PM') {
    const row=makeRow(code);
    const first={getAttribute:n=>n==='loteria'?code:'',closest:()=>row};
    return {
        querySelectorAll(selector) {
            if (selector === 'input[name="primera"][loteria]') return found?[first]:[];
            if (selector === '#tableResult tbody tr.res_tr') return found?[row]:[];
            return [];
        }
    };
}

function contextWith(sequence) {
    let fetchCount=0;
    const context={
        location:{hostname:'www.roversport.net'},
        document:{head:{appendChild(){}},documentElement:{},createElement(){return{textContent:''}},
            querySelector(){return null},querySelectorAll(){return[]}},
        MutationObserver:class{observe(){}}, Event:class{},
        DOMParser:class{parseFromString(html){return makeDoc(html==='NEW')}},
        fetch:async()=>({ok:true,status:200,text:async()=>sequence[fetchCount++] ?? 'OLD'}),
        navigator:{locks:{request:async(_k,fn)=>fn()}},
        GM_getValue:(_k,f)=>f,GM_setValue(){},GM_deleteValue(){},GM_openInTab(){},
        GM_addValueChangeListener(){},GM_removeValueChangeListener(){},GM_xmlhttpRequest(){},
        setInterval(){},setTimeout(){return 1},clearTimeout(){},
        console:{log(){},warn(){},error(){},table(){}},
        Intl,Date,URL,URLSearchParams,Symbol,WeakMap,Set,Map
    };
    vm.createContext(context);
    vm.runInContext(source,context);
    return {context,getFetchCount:()=>fetchCount};
}

(async()=>{
    const reloj={fechaIso:'2026-09-28',fechaUs:'09/28/2026'};

    // Snapshot viejo no trae RPL-7PM; la lectura fresca sí.
    const a=contextWith(['OLD','NEW']);
    const snap=await a.context.__test.autoConsultar(reloj,'RPL-7PM');
    assert.equal(a.getFetchCount(),2);
    assert.equal(snap.encontrada,true);
    assert.equal(snap.codigoServidor,'RPL-7PM');

    // Una llamada ya marcada fresh no debe recursar indefinidamente.
    const b=contextWith(['OLD','NEW']);
    const missing=await b.context.__test.autoConsultar(reloj,'RPL-7PM',null,true);
    assert.equal(b.getFetchCount(),1);
    assert.deepEqual(JSON.parse(JSON.stringify(missing)),{encontrada:false});

    console.log('verResultados2 fresh fallback: OK');
})().catch(error=>{console.error(error);process.exitCode=1});
