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
    autoPrepararMetaTab, autoElegirLiderTabs, autoEsperaCadencia, autoMetaStale,
    autoSignalTrabajoActual, AUTO_TAB_META_KEY, AUTO_TAB_PROTOCOL,
    AUTO_TAB_STALE_VISIBLE_MS, AUTO_TAB_STALE_HIDDEN_MS, AUTO_TAB_LAST_TICK_KEY
};
})();`);

const values = new Map();
const context = {
    location:{hostname:'www.roversport.net'},
    document:{
        head:{appendChild(){}},documentElement:{},hidden:false,
        body:{appendChild(){},classList:{add(){},remove(){}}},
        createElement(){return{textContent:'',dataset:{},classList:{toggle(){},add(){},remove(){}},appendChild(){},addEventListener(){}}},
        querySelector(){return null},querySelectorAll(){return[]},addEventListener(){}
    },
    MutationObserver:class{observe(){} disconnect(){}},
    Event:class{},DOMParser:class{},
    fetch:async()=>({ok:true,status:200,text:async()=>''}),
    navigator:{},
    GM_getValue:(k,f)=>values.has(k)?values.get(k):f,
    GM_setValue:(k,v)=>values.set(k,v),
    GM_deleteValue:k=>values.delete(k),
    GM_openInTab(){},GM_addValueChangeListener(){},GM_removeValueChangeListener(){},GM_xmlhttpRequest(){},
    setInterval(){},setTimeout(){return 1},clearTimeout(){},
    console:{log(){},info(){},warn(){},error(){},table(){}},
    Intl,Date,URL,URLSearchParams,Symbol,WeakMap,Set,Map,Math
};
vm.createContext(context);
vm.runInContext(source,context);

const api=context.__test;
const now=100000;
const meta=(id,startedAt,heartbeatAt,{hostname='www.roversport.net',active=true,visible=true,version='3.2.1'}={})=>({
    protocol:api.AUTO_TAB_PROTOCOL,id,startedAt,heartbeatAt,hostname,active,visible,version
});
const wrap=m=>({[api.AUTO_TAB_META_KEY]:m});

// Dos tabs visibles: sigue ganando el más antiguo.
let winner=api.autoElegirLiderTabs({
    a:wrap(meta('A',1000,99000)),
    b:wrap(meta('B',2000,99000))
},now);
assert.equal(winner.id,'A');

// Un tab visible gana frente a uno oculto más antiguo.
winner=api.autoElegirLiderTabs({
    hidden:wrap(meta('HIDDEN',1000,99000,{visible:false})),
    visible:wrap(meta('VISIBLE',2000,99000,{visible:true}))
},now);
assert.equal(winner.id,'VISIBLE');

// Si todos están ocultos, conserva elección determinística por antigüedad.
winner=api.autoElegirLiderTabs({
    a:wrap(meta('A',1000,99000,{visible:false})),
    b:wrap(meta('B',2000,99000,{visible:false}))
},now);
assert.equal(winner.id,'A');

// Compatibilidad durante actualización: si queda un 3.2.0 sin visible,
// se usa la política antigua y no se crean dos líderes por criterios distintos.
const legacy={...meta('LEGACY',1000,99000,{visible:false,version:'3.2.0'})};
delete legacy.visible;
winner=api.autoElegirLiderTabs({
    legacy:wrap(legacy),
    visible:wrap(meta('NEW',2000,99000,{visible:true}))
},now);
assert.equal(winner.id,'LEGACY');

winner=api.autoElegirLiderTabs({
    net:wrap(meta('NET',1000,99000,{hostname:'www.roversport.net'})),
    lol:wrap(meta('LOL',2000,99000,{hostname:'www.roversport.lol'}))
},now);
assert.equal(winner.id,'NET');

// Visible stale rápido; oculto tolera throttling de background mucho más tiempo.
assert.equal(
    api.autoMetaStale(meta('V',1000,now-api.AUTO_TAB_STALE_VISIBLE_MS-1,{visible:true}),now),
    true
);
assert.equal(
    api.autoMetaStale(meta('H',1000,now-api.AUTO_TAB_STALE_VISIBLE_MS-1,{visible:false}),now),
    false
);
assert.equal(
    api.autoMetaStale(meta('H',1000,now-api.AUTO_TAB_STALE_HIDDEN_MS-1,{visible:false}),now),
    true
);

winner=api.autoElegirLiderTabs({
    stale:wrap(meta('OLD',1000,now-api.AUTO_TAB_STALE_HIDDEN_MS-1,{visible:false})),
    live:wrap(meta('LIVE',2000,now-1000,{visible:false}))
},now);
assert.equal(winner.id,'LIVE');

const resumed=api.autoPrepararMetaTab(
    meta('OLD',1000,now-api.AUTO_TAB_STALE_HIDDEN_MS-1,{visible:false}),
    now
);
assert.equal(resumed.id,'OLD');
assert.equal(resumed.startedAt,now);
assert.equal(resumed.heartbeatAt,now);
assert.equal(resumed.active,true);
assert.equal(resumed.visible,true);

winner=api.autoElegirLiderTabs({
    z:wrap(meta('Z',5000,99000)),
    a:wrap(meta('A',5000,99000))
},now);
assert.equal(winner.id,'A');

assert.equal(api.autoSignalTrabajoActual({
    tipo:'result-ready',fechaIso:'2026-10-01',codigo:'WIN-9-30AM'
},{fechaIso:'2026-10-01'}),true);
assert.equal(api.autoSignalTrabajoActual({
    tipo:'result-ready',fechaIso:'2026-09-30',codigo:'WIN-9-30AM'
},{fechaIso:'2026-10-01'}),false);
assert.equal(api.autoSignalTrabajoActual({
    tipo:'visibility',fechaIso:'2026-10-01',codigo:'WIN-9-30AM'
},{fechaIso:'2026-10-01'}),false);

values.set(api.AUTO_TAB_LAST_TICK_KEY,now-60000);
assert.equal(api.autoEsperaCadencia(180000,now),120000);
values.set(api.AUTO_TAB_LAST_TICK_KEY,now-180000);
assert.equal(api.autoEsperaCadencia(180000,now),0);

console.log('Multi-tab leader election: visible priority, background-safe stale window and ready signal OK');
