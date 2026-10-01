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
    autoPrepararMetaTab, autoEsperaCadencia, autoMetaStale,
    autoSignalTrabajoActual, autoPrioridadTab, autoTodosTabsLockCompatibles,
    autoTabsActivos, autoHostsActivos, autoResolverHostEmisor, autoElegirLiderTabs,
    autoDebeEsperarHandoffHost,
    AUTO_TAB_META_KEY, AUTO_TAB_PROTOCOL, AUTO_LEADER_PROTOCOL,
    AUTO_HOST_AUTO, AUTO_HOST_NET, AUTO_HOST_LOL,
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
    version='3.2.5'
}={})=>({
    protocol:api.AUTO_TAB_PROTOCOL,leaderProtocol,id,startedAt,heartbeatAt,
    hostname,active,visible,focused,lastFocusAt,version
});
const wrap=m=>({[api.AUTO_TAB_META_KEY]:m});

assert.equal(api.AUTO_LEADER_PROTOCOL,5);
assert.equal(api.AUTO_HOST_AUTO,'auto');
assert.equal(api.AUTO_HOST_NET,'www.roversport.net');
assert.equal(api.AUTO_HOST_LOL,'www.roversport.lol');
assert.equal(api.autoPrioridadTab(meta('F',1,99000,{focused:true})),2);
assert.equal(api.autoPrioridadTab(meta('V',1,99000,{visible:true,focused:false})),1);
assert.equal(api.autoPrioridadTab(meta('H',1,99000,{visible:false,focused:false})),0);

const onlyLol={
    lolA:wrap(meta('LOL-A',1000,99000,{
        hostname:api.AUTO_HOST_LOL,focused:true,lastFocusAt:99900
    })),
    lolB:wrap(meta('LOL-B',2000,99000,{
        hostname:api.AUTO_HOST_LOL,focused:false,lastFocusAt:80000
    }))
};
const onlyNet={
    netA:wrap(meta('NET-A',1000,99000,{
        hostname:api.AUTO_HOST_NET,focused:true,lastFocusAt:99900
    })),
    netB:wrap(meta('NET-B',2000,99000,{
        hostname:api.AUTO_HOST_NET,focused:false,lastFocusAt:80000
    }))
};
const mixed={
    net:wrap(meta('NET',1000,99000,{
        hostname:api.AUTO_HOST_NET,focused:false,lastFocusAt:80000
    })),
    lol:wrap(meta('LOL',2000,99000,{
        hostname:api.AUTO_HOST_LOL,focused:true,lastFocusAt:99900
    }))
};

assert.deepEqual(
    JSON.parse(JSON.stringify(api.autoResolverHostEmisor(onlyLol,{emitterHost:'auto'},now))),
    {host:api.AUTO_HOST_LOL,modo:'auto',hosts:[api.AUTO_HOST_LOL],estado:'auto-unico'}
);
assert.deepEqual(
    JSON.parse(JSON.stringify(api.autoResolverHostEmisor(onlyNet,{emitterHost:'auto'},now))),
    {host:api.AUTO_HOST_NET,modo:'auto',hosts:[api.AUTO_HOST_NET],estado:'auto-unico'}
);
assert.equal(api.autoResolverHostEmisor(mixed,{emitterHost:'auto'},now).host,'');
assert.equal(api.autoResolverHostEmisor(mixed,{emitterHost:'auto'},now).estado,'auto-mixto');
assert.equal(
    api.autoResolverHostEmisor(mixed,{emitterHost:api.AUTO_HOST_NET},now).host,
    api.AUTO_HOST_NET
);
assert.equal(
    api.autoResolverHostEmisor(mixed,{emitterHost:api.AUTO_HOST_LOL},now).host,
    api.AUTO_HOST_LOL
);
assert.equal(
    api.autoResolverHostEmisor(onlyLol,{emitterHost:api.AUTO_HOST_NET},now).estado,
    'host-elegido-sin-tab'
);

const oldNetLeader={
    protocol:api.AUTO_LEADER_PROTOCOL,
    ownerId:'NET-LEADER',
    epoch:'epoch-net',
    hostname:api.AUTO_HOST_NET,
    heartbeatAt:now
};
assert.equal(
    api.autoDebeEsperarHandoffHost(oldNetLeader,api.AUTO_HOST_LOL,now),
    true
);
assert.equal(
    api.autoDebeEsperarHandoffHost(oldNetLeader,api.AUTO_HOST_NET,now),
    false
);
assert.equal(
    api.autoDebeEsperarHandoffHost({...oldNetLeader,heartbeatAt:now-16000},api.AUTO_HOST_LOL,now),
    false
);

// El candidato se restringe al host ya resuelto.
let winner=api.autoElegirLiderTabs(mixed,api.AUTO_HOST_NET,now);
assert.equal(winner.id,'NET');
winner=api.autoElegirLiderTabs(mixed,api.AUTO_HOST_LOL,now);
assert.equal(winner.id,'LOL');

// Dentro de un mismo host se conserva focused > visible > hidden.
winner=api.autoElegirLiderTabs({
    old:wrap(meta('OLD',1000,99000,{hostname:api.AUTO_HOST_LOL,focused:false,lastFocusAt:70000})),
    focused:wrap(meta('FOCUSED',2000,99000,{hostname:api.AUTO_HOST_LOL,focused:true,lastFocusAt:99500}))
},api.AUTO_HOST_LOL,now);
assert.equal(winner.id,'FOCUSED');

// Blur temporal: el último foco conserva prioridad sticky dentro del mismo nivel.
winner=api.autoElegirLiderTabs({
    old:wrap(meta('OLD',1000,99000,{focused:false,lastFocusAt:70000})),
    sticky:wrap(meta('STICKY',2000,99000,{focused:false,lastFocusAt:99500}))
},api.AUTO_HOST_NET,now);
assert.equal(winner.id,'STICKY');

// Todos los tabs activos deben hablar protocolo de lock v5 antes de 3.2.5.
assert.equal(api.autoTodosTabsLockCompatibles(mixed,now),true);
assert.equal(api.autoTodosTabsLockCompatibles({
    modern:wrap(meta('NEW',1000,99000)),
    legacy:wrap(meta('OLD',2000,99000,{
        hostname:api.AUTO_HOST_LOL,leaderProtocol:4,version:'3.2.4'
    }))
},now),false);

// Un tab 3.2.4 stale ya no bloquea la transición.
assert.equal(api.autoTodosTabsLockCompatibles({
    modern:wrap(meta('NEW',1000,99000)),
    legacy:wrap(meta('OLD',2000,now-api.AUTO_TAB_STALE_VISIBLE_MS-1,{
        leaderProtocol:4,version:'3.2.4'
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
    },api.AUTO_HOST_NET,now);
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

console.log('Leader candidacy: dynamic Host AUTO, protocol-v5 gate and focus priority OK');
