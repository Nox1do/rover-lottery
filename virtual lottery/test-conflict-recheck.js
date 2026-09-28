const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load(rowValues) {
    const values = new Map();
    const calls = [];
    const result = { primera:'94', segunda:'12', tercera:'33', pick3:'412', pick4:'1233' };
    const inputs = Object.fromEntries(Object.keys(result).map(c => [c, {
        value: rowValues?.[c] ?? result[c],
        classList:{ add(){}, remove(){} },
        dispatchEvent(){}
    }]));
    const row = {
        closest(){ return this; },
        querySelector(selector){
            if (selector === '.status-circle.status-ok') return {};
            if (selector === 'input[name="primera"][loteria]') return { getAttribute:()=> 'QLT-MORNING' };
            const campo = selector.match(/^input\[name="([^"]+)"\]$/)?.[1];
            return campo ? inputs[campo] : null;
        }
    };
    const parsed = { querySelectorAll(selector){
        if (selector === 'input[name="primera"][loteria]') {
            return [{ getAttribute:()=> 'QLT-MORNING', closest:()=>row }];
        }
        if (selector === '#tableResult tbody tr.res_tr') return [row];
        return [];
    }};
    const source = fs.readFileSync('virtual-lottery v2 auto.user.js','utf8')
        .replace(/\}\)\(\);\s*$/, 'globalThis.__test={autoEvaluar,autoEstado};\n})();');
    const context = {
        location:{hostname:'www.roversport.net'},
        document:{
            head:{appendChild(){}}, documentElement:{},
            createElement(){return{textContent:''}},
            querySelector(){return null}, querySelectorAll(){return[]}
        },
        MutationObserver:class{observe(){}}, Event:class{},
        DOMParser:class{parseFromString(){return parsed}},
        fetch:async(url)=>{calls.push(url);return{ok:true,status:200,text:async()=>'<table></table>'}},
        navigator:{locks:{request:async(_k,fn)=>fn()}},
        GM_getValue:(k,f)=>values.get(k)??f, GM_setValue:(k,v)=>values.set(k,v),
        GM_deleteValue:(k)=>values.delete(k), GM_openInTab(){},
        GM_addValueChangeListener(){}, GM_removeValueChangeListener(){}, GM_xmlhttpRequest(){},
        setInterval(){}, setTimeout(fn){fn();return 1}, clearTimeout(){},
        console:{log(){},warn(){},error(){},table(){}},
        Intl,Date,URL,URLSearchParams,Symbol,WeakMap,Set,Map
    };
    vm.createContext(context);
    vm.runInContext(source,context);
    return { ...context.__test, values, calls, result };
}

(async()=>{
    const reloj={fechaUs:'09/28/2026',fechaIso:'2026-09-28',minutoDia:12*60};

    const exact=load();
    exact.values.set('vl:auto:v3:2026-09-28:QLT-MORNING',{
        estado:'CONFLICT', resultado:exact.result, motivo:'Fila ya procesada.'
    });
    await exact.autoEvaluar(reloj,'QLT-MORNING');
    assert.equal(exact.values.get('vl:auto:v3:2026-09-28:QLT-MORNING').estado,'DONE');
    assert.equal(exact.calls.filter(x=>x.includes('procesarResultados.php')).length,0);

    const mismatch=load({...exact.result,pick4:'9999'});
    mismatch.values.set('vl:auto:v3:2026-09-28:QLT-MORNING',{
        estado:'CONFLICT', resultado:mismatch.result, motivo:'Fila ya procesada.'
    });
    await mismatch.autoEvaluar(reloj,'QLT-MORNING');
    assert.equal(mismatch.values.get('vl:auto:v3:2026-09-28:QLT-MORNING').estado,'CONFLICT');
    assert.equal(mismatch.calls.filter(x=>x.includes('procesarResultados.php')).length,0);

    console.log('CONFLICT revalidation OK');
})().catch(error=>{console.error(error);process.exitCode=1});
