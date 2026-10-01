const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const raw = fs.readFileSync('virtual-lottery v2 auto.user.js','utf8');
const source = raw
  .replace('    iniciarAutoLoterias();\n    observarResultadosLoteria();\n    iniciar();\n','')
  .replace(/\}\)\(\);\s*$/, `
globalThis.__leaderTest = {
  setup(id, host = AUTO_HOST_NET) {
    autoTabCoordStarted = true;
    autoHostEmisorResuelto = host;
    autoTabMeta = {
      protocol:AUTO_TAB_PROTOCOL,
      leaderProtocol:AUTO_LEADER_PROTOCOL,
      id,
      startedAt:1,
      heartbeatAt:Date.now(),
      active:true,
      visible:true,
      focused:true,
      lastFocusAt:Date.now(),
      hostname:host,
      version:SCRIPT_VERSION
    };
    autoTabStore = {[AUTO_TAB_META_KEY]:autoTabMeta};
  },
  acquire:autoSolicitarLeaderLock,
  release:autoLiberarLeaderLock,
  isLeader:autoEsLiderTab,
  rawLeader(){ return autoTabEsLider; },
  held(){ return autoLeaderLockHeld; },
  requesting(){ return autoLeaderLockRequesting; },
  epoch(){ return autoLeaderEpoch; },
  state:autoEstadoLiderActual,
  lockName:AUTO_LEADER_LOCK_NAME,
  stateKey:AUTO_LEADER_STATE_KEY,
  emitterHost(){ return autoHostEmisorResuelto; }
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

function makeContext() {
  const context = {
    location:{hostname:'www.roversport.net'},
    document:{
      head:{appendChild(){}}, documentElement:{},
      hidden:false, visibilityState:'visible', hasFocus(){return true},
      body:{appendChild(){},classList:{add(){},remove(){}}},
      createElement(){return{textContent:'',dataset:{},classList:{toggle(){},add(){},remove(){}},appendChild(){},addEventListener(){}}},
      querySelector(){return null},querySelectorAll(){return[]},addEventListener(){}
    },
    window:{addEventListener(){}},
    MutationObserver:class{observe(){} disconnect(){}},
    Event:class{}, DOMParser:class{},
    fetch:async()=>({ok:true,status:200,text:async()=>''}),
    navigator:{locks},
    GM_getValue:(k,f)=>values.has(k)?values.get(k):f,
    GM_setValue:(k,v)=>values.set(k,v),
    GM_deleteValue:k=>values.delete(k),
    GM_openInTab(){},
    GM_addValueChangeListener(){return 1},
    GM_removeValueChangeListener(){},
    GM_getTab(cb){cb({})},
    GM_saveTab(_tab,cb){cb?.()},
    GM_getTabs(cb){cb({})},
    GM_xmlhttpRequest(){},
    setInterval(){},
    setTimeout(){return 1},
    clearTimeout(){},
    console:{log(){},info(){},warn(){},error(){},table(){}},
    Intl,Date,URL,URLSearchParams,Symbol,WeakMap,Set,Map,Math
  };
  vm.createContext(context);
  vm.runInContext(source,context);
  return context.__leaderTest;
}

async function tick(){
  await new Promise(resolve=>setImmediate(resolve));
  await new Promise(resolve=>setImmediate(resolve));
}

(async()=>{
  const a=makeContext();
  const b=makeContext();

  assert.equal(a.lockName,'vl-auto-leader-v5');
  assert.equal(a.emitterHost(),'www.roversport.net');

  a.setup('TAB-A');
  b.setup('TAB-B');

  assert.equal(a.acquire(),true);
  await tick();
  assert.equal(a.isLeader(),true);
  assert.equal(a.held(),true);
  assert.equal(a.state().ownerId,'TAB-A');
  assert.equal(typeof a.state().epoch,'string');
  assert.ok(a.state().epoch.length>0);

  // Segundo tab puede solicitar, pero ifAvailable devuelve null:
  // nunca puede convertirse en líder mientras A posee el lock.
  assert.equal(b.acquire(),true);
  await tick();
  assert.equal(b.isLeader(),false);
  assert.equal(b.held(),false);
  assert.equal(a.state().ownerId,'TAB-A');

  // Handoff cooperativo: A libera; solo después B puede adquirir.
  assert.equal(a.release('test-handoff'),true);
  await tick();
  assert.equal(a.isLeader(),false);
  assert.equal(locks.held.has(a.lockName),false);

  assert.equal(b.acquire(),true);
  await tick();
  assert.equal(b.isLeader(),true);
  assert.equal(b.held(),true);
  assert.equal(b.state().ownerId,'TAB-B');
  assert.notEqual(b.state().epoch,'');

  // A no puede reaparecer como líder mientras B tiene el Web Lock.
  assert.equal(a.acquire(),true);
  await tick();
  assert.equal(a.isLeader(),false);
  assert.equal(b.isLeader(),true);
  assert.equal(b.state().ownerId,'TAB-B');

  b.release('test-end');
  await tick();

  console.log('Web Lock leader: exclusive authority, cooperative handoff and no split-brain OK');
})().catch(error=>{console.error(error);process.exitCode=1;});
