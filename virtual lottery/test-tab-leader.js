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
    autoSignalTrabajoActual, autoPrioridadTab, AUTO_TAB_META_KEY, AUTO_TAB_PROTOCOL,
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
    version='3.2.2'
}={})=>({
    protocol:api.AUTO_TAB_PROTOCOL,id,startedAt,heartbeatAt,hostname,active,
    visible,focused,lastFocusAt,version
});
const wrap=m=>({[api.AUTO_TAB_META_KEY]:m});

assert.equal(api.autoPrioridadTab(meta('F',1,99000,{focused:true})),2);
assert.equal(api.autoPrioridadTab(meta('V',1,99000,{visible:true,focused:false})),1);
assert.equal(api.autoPrioridadTab(meta('H',1,99000,{visible:false,focused:false})),0);

// Dos tabs visibles sin foco previo: gana el más antiguo.
let winner=api.autoElegirLiderTabs({
    a:wrap(meta('A',1000,99000)),
    b:wrap(meta('B',2000,99000))
},now);
assert.equal(winner.id,'A');

// El tab realmente enfocado gana aunque sea más nuevo.
winner=api.autoElegirLiderTabs({
    old:wrap(meta('OLD',1000,99000,{visible:true,focused:false,lastFocusAt:70000})),
    focused:wrap(meta('FOCUSED',2000,99000,{visible:true,focused:true,lastFocusAt:99500}))
},now);
assert.equal(winner.id,'FOCUSED');

// DevTools/blur temporal: al desaparecer focused, permanece sticky el último
// tab realmente usado gracias a lastFocusAt.
winner=api.autoElegirLiderTabs({
    old:wrap(meta('OLD',1000,99000,{visible:true,focused:false,lastFocusAt:70000})),
    sticky:wrap(meta('STICKY',2000,99000,{visible:true,focused:false,lastFocusAt:99500}))
},now);
assert.equal(winner.id,'STICKY');

// Un nuevo focus real transfiere inmediatamente el liderazgo.
winner=api.autoElegirLiderTabs({
    previous:wrap(meta('PREVIOUS',1000,99000,{visible:true,focused:false,lastFocusAt:99500})),
    current:wrap(meta('CURRENT',2000,99000,{visible:true,focused:true,lastFocusAt:99900}))
},now);
assert.equal(winner.id,'CURRENT');

// Visible siempre gana sobre hidden si ninguno tiene foco.
winner=api.autoElegirLiderTabs({
    hidden:wrap(meta('HIDDEN',1000,99000,{visible:false,focused:false,lastFocusAt:99950})),
    visible:wrap(meta('VISIBLE',2000,99000,{visible:true,focused:false,lastFocusAt:80000}))
},now);
assert.equal(winner.id,'VISIBLE');

// Si todos están ocultos, el último usado permanece sticky.
winner=api.autoElegirLiderTabs({
    old:wrap(meta('OLD',1000,99000,{visible:false,focused:false,lastFocusAt:70000})),
    recent:wrap(meta('RECENT',2000,99000,{visible:false,focused:false,lastFocusAt:95000}))
},now);
assert.equal(winner.id,'RECENT');

// Compatibilidad con 3.2.1: si cualquier tab no reporta focused/lastFocusAt,
// exactamente la política anterior visible > edad sigue vigente.
const legacy321={...meta('LEGACY',1000,99000,{visible:true,version:'3.2.1'})};
delete legacy321.focused;
delete legacy321.lastFocusAt;
winner=api.autoElegirLiderTabs({
    legacy:wrap(legacy321),
    newFocused:wrap(meta('NEW',2000,99000,{visible:true,focused:true,lastFocusAt:99900}))
},now);
assert.equal(winner.id,'LEGACY');

// Compatibilidad con 3.2.0 sin visible: vuelve a antigüedad pura.
const legacy320={...legacy321,version:'3.2.0'};
delete legacy320.visible;
winner=api.autoElegirLiderTabs({
    legacy:wrap(legacy320),
    modern:wrap(meta('MODERN',2000,99000,{visible:true,focused:true,lastFocusAt:99900}))
},now);
assert.equal(winner.id,'LEGACY');

winner=api.autoElegirLiderTabs({
    net:wrap(meta('NET',1000,99000,{focused:true,lastFocusAt:99000,hostname:'www.roversport.net'})),
    lol:wrap(meta('LOL',2000,99000,{focused:false,lastFocusAt:90000,hostname:'www.roversport.lol'}))
},now);
assert.equal(winner.id,'NET');

// 100 cambios de foco simulados: siempre hay un único ganador determinístico.
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

// Visible stale rápido; hidden tolera throttling.
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
    live:wrap(meta('LIVE',2000,now-1000,{visible:false,lastFocusAt:80000}))
},now);
assert.equal(winner.id,'LIVE');

// autoPrepararMetaTab captura focus real del documento y registra lastFocusAt.
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

winner=api.autoElegirLiderTabs({
    z:wrap(meta('Z',5000,99000,{lastFocusAt:0})),
    a:wrap(meta('A',5000,99000,{lastFocusAt:0}))
},now);
assert.equal(winner.id,'A');

assert.equal(api.autoSignalTrabajoActual({
    tipo:'result-ready',fechaIso:'2026-10-01',codigo:'WIN-9-30AM'
},{fechaIso:'2026-10-01'}),true);
assert.equal(api.autoSignalTrabajoActual({
    tipo:'result-ready',fechaIso:'2026-09-30',codigo:'WIN-9-30AM'
},{fechaIso:'2026-10-01'}),false);
assert.equal(api.autoSignalTrabajoActual({
    tipo:'focus',fechaIso:'2026-10-01',codigo:'WIN-9-30AM'
},{fechaIso:'2026-10-01'}),false);

values.set(api.AUTO_TAB_LAST_TICK_KEY,now-60000);
assert.equal(api.autoEsperaCadencia(180000,now),120000);
values.set(api.AUTO_TAB_LAST_TICK_KEY,now-180000);
assert.equal(api.autoEsperaCadencia(180000,now),0);

console.log('Multi-tab leader election: focused > visible > hidden, sticky blur and 100 focus handoffs OK');
