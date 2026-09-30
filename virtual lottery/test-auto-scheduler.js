const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js','utf8')
    .replace(
        '    iniciarAutoLoterias();\n    observarResultadosLoteria();\n    iniciar();\n',
        ''
    )
    .replace(/\}\)\(\);\s*$/, `
globalThis.__test = {
    autoConfig, autoGuardarConfiguracion, autoReiniciarScheduler, autoDetenerScheduler,
    setLeader(value) { autoTabEsLider = !!value; }
};
})();`);

const values = new Map();
const timers = [];
const cleared = [];
const context = {
    location:{hostname:'www.roversport.net'},
    document:{
        head:{appendChild(){}},documentElement:{},
        body:{appendChild(){},classList:{add(){},remove(){}}},
        createElement(){return{textContent:'',dataset:{},classList:{toggle(){},add(){},remove(){}},appendChild(){},addEventListener(){}}},
        querySelector(){return null},querySelectorAll(){return[]}
    },
    MutationObserver:class{observe(){} disconnect(){}},
    Event:class{},DOMParser:class{},
    fetch:async()=>({ok:true,status:200,text:async()=>''}),
    navigator:{},
    GM_getValue:(k,f)=>values.has(k)?values.get(k):f,
    GM_setValue:(k,v)=>values.set(k,v),
    GM_deleteValue:k=>values.delete(k),
    GM_openInTab(){},GM_addValueChangeListener(){},GM_removeValueChangeListener(){},GM_xmlhttpRequest(){},
    setInterval(){},
    setTimeout(fn,ms){const id=timers.length+1;timers.push({id,fn,ms});return id;},
    clearTimeout(id){cleared.push(id);},
    console:{log(){},info(){},warn(){},error(){},table(){}},
    Intl,Date,URL,URLSearchParams,Symbol,WeakMap,Set,Map
};
vm.createContext(context);
vm.runInContext(source,context);

const api=context.__test;
const lotteries=Object.fromEntries(Object.keys(api.autoConfig).map(c=>[c,{enabled:c==='RPL-11AM'}]));

api.setLeader(false);
const followerTimers = timers.length;
api.autoGuardarConfiguracion({enabled:true,intervalMs:60000,maxRetries:0,lotteries});
api.autoReiniciarScheduler(false);
assert.equal(timers.length,followerTimers);

api.setLeader(true);
for (const intervalMs of [60000, 180000, 300000, 600000]) {
    api.autoGuardarConfiguracion({enabled:true,intervalMs,maxRetries:0,lotteries});
    api.autoReiniciarScheduler(false);
    assert.equal(timers.at(-1).ms,intervalMs);
}
assert.ok(cleared.length>=1);

api.autoDetenerScheduler();
assert.ok(cleared.length>=2);

console.log('AUTO scheduler: leader-only + 1/3/5/10 minute intervals and timer cleanup OK');
