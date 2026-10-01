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
    autoSignalTrabajoActual, autoPrioridadTab, autoTodosTabsLockCompatibles,
    autoTabsActivos, AUTO_TAB_META_KEY, AUTO_TAB_PROTOCOL, AUTO_LEADER_PROTOCOL,
    AUTO_EMITTER_HOST, AUTO_TAB_STALE_VISIBLE_MS, AUTO_TAB_STALE_HIDDEN_MS,
    AUTO_TAB_LAST_TICK_KEY
};
})();`);

const values = new Map();
const context = {
    location:{hostname:'www.roversport.net'},
    document:{
        head:{appendChild(){}},documentElement:{},hidden:false,
        body:{appendChild(){},classList:{add(){},remove(){}}},
        createElement(){return{textContent:'',dataset:{},classList:{toggle(){},add(){},remove(){}},appendChild(){},addEventListener(){}}},
        querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},
        hasFocus(){return true},visibilityState:'visible'
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
const meta=(id,startedAt,heartbeatAt,{
    hostname='www.roversport.net',
    active=true,
    visible=true,
    focused=false,
    lastFocusAt=0,
    leaderProtocol=api.AUTO_LEADER_PROTOCOL,
    version='3.2.4'
}={})=>({
    protocol:api.AUTO_TAB_PROTOCOL,leaderProtocol,id,startedAt,heartbeatAt,
    hostname,active,visible,focused,lastFocusAt,version
});
const wrap=m=>({[api.AUTO_TAB_META_KEY]:m});

assert.equal(api.AUTO_EMITTER_HOST,'www.roversport.net');
assert.equal(api.AUTO_LEADER_PROTOCOL,4);
assert.equal(api.autoPrioridadTab(meta('F',1,99000,{focused:true})),2);
assert.equal(api.autoPrioridadTab(meta('V',1,99000,{visible:true,focused:false})),1);
assert.equal(api.autoPrioridadTab(meta('H',1,99000,{visible:false,focused:false})),0);

// El candidato se elige solo entre tabs del host emisor.
let winner=api.autoElegirLiderTabs({
    lolFocused:wrap(meta('LOL',500,99000,{
        hostname:'www.roversport.lol',focused:true,lastFocusAt:99999
    })),
    netVisible:wrap(meta('NET',1000,99000,{
        hostname:'www.roversport.net',focused:false,lastFocusAt:70000
    }))
},now);
assert.equal(winner.id,'NET');

// Dentro de .net se conserva focused > visible > hidden.
winner=api.autoElegirLiderTabs({
    old:wrap(meta('OLD',1000,99000,{focused:false,lastFocusAt:70000})),
    focused:wrap(meta('FOCUSED',2000,99000,{focused:true,lastFocusAt:99500}))
},now);
assert.equal(winner.id,'FOCUSED');

// Blur temporal: el último foco conserva prioridad sticky dentro del mismo nivel.
winner=api.autoElegirLiderTabs({
    old:wrap(meta('OLD',1000,99000,{focused:false,lastFocusAt:70000})),
    sticky:wrap(meta('STICKY',2000,99000,{focused:false,lastFocusAt:99500}))
},now);
assert.equal(winner.id,'STICKY');

// Todos los tabs activos deben hablar protocolo de lock v4 antes de que 3.2.4
// intente tomar autoridad. Un tab viejo .lol también bloquea la migración.
assert.equal(api.autoTodosTabsLockCompatibles({
    a:wrap(meta('A',1000,99000)),
    b:wrap(meta('B',2000,99000,{hostname:'www.roversport.lol'}))
},now),true);

assert.equal(api.autoTodosTabsLockCompatibles({
    modern:wrap(meta('NEW',1000,99000)),
    legacy:wrap(meta('OLD',2000,99000,{
        hostname:'www.roversport.lol',leaderProtocol:0,version:'3.2.3'
    }))
},now),false);

// Un tab antiguo stale ya no bloquea la transición.
assert.equal(api.autoTodosTabsLockCompatibles({
    modern:wrap(meta('NEW',1000,99000)),
    legacy:wrap(meta('OLD',2000,now-api.AUTO_TAB_STALE_VISIBLE_MS-1,{
        leaderProtocol:0,version:'3.2.3'
    }))
},now),true);

// 100 cambios de foco siguen produciendo un candidato determinístico.
for (let i=0;i<100;i++) {
    const focusA=i%2===0;
    winner=api.autoElegirLiderTabs({
        a:wrap(meta('A',1000,99000,{
            focused:focusA,lastFocusAt:focusA?90000+i:89999+i
        })),
        b:wrap(meta('B',2000,99000,{
            focused:!focusA,lastFocusAt:!focusA?90000+i:89999+i
        }))
    },now);
    assert.equal(winner.id,focusA?'A':'B');
}

// Background throttling: visible expira rápido, hidden tiene ventana larga.
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

// autoPrepararMetaTab publica explícitamente compatibilidad v4.
const resumed=api.autoPrepararMetaTab(
    meta('OLD',1000,now-api.AUTO_TAB_STALE_HIDDEN_MS-1,{visible:false}),
    now
);
assert.equal(resumed.id,'OLD');
assert.equal(resumed.startedAt,now);
assert.equal(resumed.heartbeatAt,now);
assert.equal(resumed.active,true);
assert.equal(resumed.visible,true);
assert.equal(resumed.focused,true);
assert.equal(resumed.lastFocusAt,now);
assert.equal(resumed.leaderProtocol,api.AUTO_LEADER_PROTOCOL);

assert.equal(api.autoSignalTrabajoActual({
    tipo:'result-ready',fechaIso:'2026-10-01',codigo:'WIN-9-30AM'
},{fechaIso:'2026-10-01'}),true);
assert.equal(api.autoSignalTrabajoActual({
    tipo:'focus',fechaIso:'2026-10-01',codigo:'WIN-9-30AM'
},{fechaIso:'2026-10-01'}),false);

values.set(api.AUTO_TAB_LAST_TICK_KEY,now-60000);
assert.equal(api.autoEsperaCadencia(180000,now),120000);
values.set(api.AUTO_TAB_LAST_TICK_KEY,now-180000);
assert.equal(api.autoEsperaCadencia(180000,now),0);

console.log('Leader candidacy: emitter host only, protocol-v4 migration gate and focus priority OK');
