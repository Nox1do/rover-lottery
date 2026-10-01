const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const raw = fs.readFileSync('virtual-lottery v2 auto.user.js','utf8');
const source = raw
  .replace('    iniciarAutoLoterias();\n    observarResultadosLoteria();\n    iniciar();\n','')
  .replace(/\}\)\(\);\s*$/, `
globalThis.__leaderTest = {
  setup(id, host) {
    autoTabCoordStarted = true;
    autoHostEmisorResuelto = host;
    autoTabMeta = {
      protocol:AUTO_TAB_PROTOCOL,
      leaderProtocol:AUTO_LEADER_PROTOCOL,
      id,
      startedAt:Date.now(),
      heartbeatAt:Date.now(),
      active:true,
      visible:true,
      focused:autoTabFocusedAhora(),
      lastFocusAt:autoTabFocusedAhora() ? Date.now() : 0,
      hostname:host,
      version:SCRIPT_VERSION
    };
    autoTabStore = {[AUTO_TAB_META_KEY]:autoTabMeta};
    GM_saveTab(autoTabStore);
  },
  coordinate(){ return autoCoordinarTabs(false); },
  acquire:autoSolicitarLeaderLock,
  release:autoLiberarLeaderLock,
  leave:autoLiberarTab,
  isLeader:autoEsLiderTab,
  rawLeader(){ return autoTabEsLider; },
  held(){ return autoLeaderLockHeld; },
  requesting(){ return autoLeaderLockRequesting; },
  epoch(){ return autoLeaderEpoch; },
  status(){ return autoTabCoordStatus; },
  state:autoEstadoLiderActual,
  lockName:AUTO_LEADER_LOCK_NAME,
  stateKey:AUTO_LEADER_STATE_KEY,
  protocol:AUTO_LEADER_PROTOCOL,
  emitterHost(){ return autoHostEmisorResuelto; },
  tabId(){ return autoTabMeta?.id || ''; }
};
})();
`);

class MockLockManager {
  constructor(){ this.held = new Map(); }

  request(name, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    const ifAvailable = !!options?.ifAvailable;
    const current = this.held.get(name);

    if (ifAvailable && current) {
      return Promise.resolve(callback(null));
    }

    if (current) {
      throw new Error('Mock only supports ifAvailable for concurrent leader requests');
    }

    const token = {name, mode:options?.mode || 'exclusive'};
    this.held.set(name, token);

    let result;
    try {
      result = callback(token);
    } catch (error) {
      this.held.delete(name);
      return Promise.reject(error);
    }

    return Promise.resolve(result).finally(() => {
      if (this.held.get(name) === token) this.held.delete(name);
    });
  }
}

const values = new Map();
const locks = new MockLockManager();
const tabStores = {};
const focusState = {};

const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

function makeContext(tabKey, host='www.roversport.lol') {
  focusState[tabKey] = false;

  const context = {
    location:{hostname:host},
    document:{
      head:{appendChild(){}}, documentElement:{},
      hidden:false, visibilityState:'visible',
      hasFocus(){ return focusState[tabKey] === true; },
      body:{appendChild(){},classList:{add(){},remove(){}}},
      createElement(){return{textContent:'',dataset:{},classList:{toggle(){},add(){},remove(){}},appendChild(){},addEventListener(){}}},
      querySelector(){return null},querySelectorAll(){return[]},addEventListener(){}
    },
    window:{addEventListener(){}},
    MutationObserver:class{observe(){} disconnect(){}},
    Event:class{}, DOMParser:class{},
    fetch:async()=>({ok:true,status:200,text:async()=>''}),
    navigator:{locks},
    GM_getValue:(k,f)=>values.has(k)?clone(values.get(k)):f,
    GM_setValue:(k,v)=>values.set(k,clone(v)),
    GM_deleteValue:k=>values.delete(k),
    GM_openInTab(){},
    GM_addValueChangeListener(){return 1},
    GM_removeValueChangeListener(){},
    GM_getTab(cb){cb(clone(tabStores[tabKey] || {}))},
    GM_saveTab(tab,cb){tabStores[tabKey]=clone(tab);cb?.()},
    GM_getTabs(cb){cb(clone(tabStores))},
    GM_xmlhttpRequest(){},
    setInterval(){},
    setTimeout(){return 1},
    clearTimeout(){},
    console:{log(){},info(){},warn(){},error(){},table(){}},
    Intl,Date,URL,URLSearchParams,Symbol,WeakMap,Set,Map,Math
  };
  vm.createContext(context);
  vm.runInContext(source,context);

  return {
    api:context.__leaderTest,
    focus(value){ focusState[tabKey]=!!value; }
  };
}

async function tick(){
  await new Promise(resolve=>setImmediate(resolve));
  await new Promise(resolve=>setImmediate(resolve));
}

(async()=>{
  const a=makeContext('A');
  const b=makeContext('B');

  assert.equal(a.api.lockName,'vl-auto-leader-v6');
  assert.equal(a.api.protocol,6);

  a.focus(true);
  b.focus(false);
  a.api.setup('TAB-A','www.roversport.lol');
  b.api.setup('TAB-B','www.roversport.lol');

  // La primera elección sí usa focus: A adquiere el único Web Lock.
  await a.api.coordinate();
  await tick();
  assert.equal(a.api.isLeader(),true);
  assert.equal(a.api.held(),true);
  assert.equal(b.api.isLeader(),false);
  assert.equal(a.api.state().ownerId,'TAB-A');
  assert.equal(locks.held.has(a.api.lockName),true);

  // Regresión principal: cambiar foco NO transfiere el liderazgo.
  // El lock de A permanece estable durante 40 alternancias.
  for(let i=0;i<40;i++){
    const focusB=i%2===0;
    a.focus(!focusB);
    b.focus(focusB);

    await b.api.coordinate();
    await a.api.coordinate();
    await tick();

    assert.equal(a.api.isLeader(),true,'A debe conservar liderazgo sticky');
    assert.equal(a.api.held(),true,'A debe conservar el Web Lock');
    assert.equal(b.api.isLeader(),false,'B debe seguir observador aunque tenga foco');
    assert.equal(b.api.held(),false);
    assert.equal(a.api.state().ownerId,'TAB-A');
    assert.equal(locks.held.size,1);
  }

  // Cerrar el tab líder sí habilita failover. pagehide además marca
  // su metadata inactive, como ocurre en Rover al cerrar la pestaña.
  a.api.leave();
  await tick();
  assert.equal(a.api.isLeader(),false);
  assert.equal(locks.held.has(a.api.lockName),false);

  a.focus(false);
  b.focus(true);
  await b.api.coordinate();
  await tick();

  assert.equal(b.api.isLeader(),true);
  assert.equal(b.api.held(),true);
  assert.equal(b.api.state().ownerId,'TAB-B');
  assert.equal(locks.held.size,1);

  // A no puede reaparecer mientras B conserve el lock.
  a.focus(true);
  b.focus(false);
  await a.api.coordinate();
  await b.api.coordinate();
  await tick();

  assert.equal(a.api.isLeader(),false);
  assert.equal(b.api.isLeader(),true);
  assert.equal(b.api.state().ownerId,'TAB-B');

  b.api.release('test-end');
  await tick();

  console.log('Sticky Web Lock leader: 40 focus changes keep one leader; failover only after release OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
