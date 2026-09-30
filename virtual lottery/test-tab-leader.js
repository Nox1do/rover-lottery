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
    autoPrepararMetaTab, autoElegirLiderTabs, autoEsperaCadencia,
    AUTO_TAB_META_KEY, AUTO_TAB_PROTOCOL, AUTO_TAB_STALE_MS, AUTO_TAB_LAST_TICK_KEY
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
const meta=(id,startedAt,heartbeatAt,hostname='www.roversport.net',active=true)=>({
    protocol:api.AUTO_TAB_PROTOCOL,id,startedAt,heartbeatAt,hostname,active,version:'3.2.0'
});
const wrap=m=>({[api.AUTO_TAB_META_KEY]:m});

let winner=api.autoElegirLiderTabs({
    a:wrap(meta('A',1000,99000)),
    b:wrap(meta('B',2000,99000))
},now);
assert.equal(winner.id,'A');

winner=api.autoElegirLiderTabs({
    net:wrap(meta('NET',1000,99000,'www.roversport.net')),
    lol:wrap(meta('LOL',2000,99000,'www.roversport.lol'))
},now);
assert.equal(winner.id,'NET');

winner=api.autoElegirLiderTabs({
    stale:wrap(meta('OLD',1000,now-api.AUTO_TAB_STALE_MS-1)),
    live:wrap(meta('LIVE',2000,now-1000))
},now);
assert.equal(winner.id,'LIVE');

const resumed=api.autoPrepararMetaTab(
    meta('OLD',1000,now-api.AUTO_TAB_STALE_MS-1),
    now
);
assert.equal(resumed.id,'OLD');
assert.equal(resumed.startedAt,now);
assert.equal(resumed.heartbeatAt,now);
assert.equal(resumed.active,true);

winner=api.autoElegirLiderTabs({
    z:wrap(meta('Z',5000,99000)),
    a:wrap(meta('A',5000,99000))
},now);
assert.equal(winner.id,'A');

values.set(api.AUTO_TAB_LAST_TICK_KEY,now-60000);
assert.equal(api.autoEsperaCadencia(180000,now),120000);
values.set(api.AUTO_TAB_LAST_TICK_KEY,now-180000);
assert.equal(api.autoEsperaCadencia(180000,now),0);

console.log('Multi-tab leader election: deterministic, stale failover and cadence handoff OK');
