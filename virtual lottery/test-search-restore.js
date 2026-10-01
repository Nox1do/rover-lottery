const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const file = process.argv[2] || 'virtual-lottery v2 auto.user.js';
let source = fs.readFileSync(file, 'utf8')
  .replace('    iniciarAutoLoterias();\n    observarResultadosLoteria();\n    iniciar();', '')
  .replace(/\}\)\(\);\s*$/, `globalThis.__test = {
  guardarResultadoVisible, restaurarResultadosVisibles,
  setLeader(value) {
    autoTabMeta = autoTabMeta || {
      protocol:AUTO_TAB_PROTOCOL, leaderProtocol:AUTO_LEADER_PROTOCOL,
      id:'TEST-RESTORE', hostname:AUTO_EMITTER_HOST, active:true,
      visible:true, focused:true, lastFocusAt:Date.now(), heartbeatAt:Date.now()
    };
    if (value) {
      autoLeaderLockHeld = true;
      autoLeaderLockReleasing = false;
      autoLeaderEpoch = 'test-restore-epoch';
      autoTabEsLider = true;
      GM_setValue(AUTO_LEADER_STATE_KEY, {
        protocol:AUTO_LEADER_PROTOCOL, ownerId:autoTabMeta.id,
        epoch:autoLeaderEpoch, hostname:AUTO_EMITTER_HOST,
        heartbeatAt:Date.now()
      });
    } else {
      autoTabEsLider = false;
      autoLeaderLockHeld = false;
      autoLeaderLockReleasing = false;
      autoLeaderEpoch = '';
      GM_deleteValue(AUTO_LEADER_STATE_KEY);
    }
  }
};\n})();`);

const result = { primera:'45', segunda:'63', tercera:'91', pick3:'245', pick4:'6391' };
const fields = Object.keys(result);
function makeInput(name, value='') {
  return {
    name, value, dataset:{}, classList:{ add(){}, remove(){} },
    getAttribute(attr){ return attr === 'loteria' ? 'BRAZIL03PM ' : ''; },
    closest(sel){ return sel === 'tr' ? row : null; },
    dispatchEvent(){}
  };
}
let inputs = Object.fromEntries(fields.map(f => [f, makeInput(f, result[f])]));
const button = { disabled:false, className:'rs-source-fetch-btn', innerHTML:'', title:'', dataset:{codigo:'BRAZIL03PM'} };
const row = {
  querySelector(sel) {
    const m = sel.match(/^input\[name="([^"]+)"\]$/);
    if (m) return inputs[m[1]] || null;
    if (sel === '.rs-source-fetch-btn[data-codigo="BRAZIL03PM"]') return button;
    return null;
  }
};
const fecha = { value:'09/27/2026', dataset:{}, addEventListener(){} };
const document = {
  head:{ appendChild(){} }, documentElement:{},
  createElement(){ return { textContent:'', dataset:{}, classList:{toggle(){}}, addEventListener(){}, appendChild(){}, insertAdjacentElement(){}, set className(v){this._c=v}, get className(){return this._c} }; },
  querySelector(sel){ if (sel === '#fecha') return fecha; return null; },
  querySelectorAll(sel){ if (sel === 'input[loteria]') return [inputs.primera]; if (sel === '.rs-source-fetch-btn') return [button]; return []; }
};
const values = new Map();
const context = {
  location:{ hostname:'www.roversport.net' }, document,
  MutationObserver: class { observe(){} },
  Event: class { constructor(type){this.type=type;} },
  DOMParser: class {},
  GM_getValue:(k,f)=>values.has(k)?values.get(k):f,
  GM_setValue:(k,v)=>values.set(k,v), GM_deleteValue:k=>values.delete(k),
  GM_addValueChangeListener(){}, GM_removeValueChangeListener(){}, GM_xmlhttpRequest(){}, GM_openInTab(){},
  navigator:{}, fetch:async()=>({ok:true,text:async()=>''}),
  setInterval(){}, setTimeout(fn){ fn(); return 1; }, clearTimeout(){},
  console:{log(){},warn(){},error(){},table(){}},
  Intl, Date, URL, URLSearchParams, Symbol, WeakMap, Map, Set
};
vm.createContext(context);
vm.runInContext(source, context);
const api = context.__test;
api.setLeader(true);

// Simula: el script encuentra y muestra el resultado.
api.guardarResultadoVisible('09/27/2026', 'BRAZIL03PM', result, fields);
// Rover Search reemplaza la fila por una nueva tabla con inputs vacíos/---.
inputs = Object.fromEntries(fields.map(f => [f, makeInput(f, f.startsWith('pick') ? '---' : '')]));
assert.equal(api.restaurarResultadosVisibles(), 1);
assert.deepEqual(Object.fromEntries(fields.map(f => [f, inputs[f].value])), result);
assert.match(button.className, /rs-success/);

// Seguridad: si Rover devuelve un valor distinto no debe sobrescribirse ni completar parcialmente.
inputs = Object.fromEntries(fields.map(f => [f, makeInput(f, '')]));
inputs.primera.value = '99';
assert.equal(api.restaurarResultadosVisibles(), 0);
assert.equal(inputs.primera.value, '99');
assert.equal(inputs.segunda.value, '');
assert.equal(inputs.pick3.value, '');

// Un resultado manual sigue restaurándose aunque AUTO esté apagado.
inputs = Object.fromEntries(fields.map(f => [f, makeInput(f, '')]));
api.guardarResultadoVisible('09/27/2026', 'BRAZIL03PM', result, fields, 'manual');
assert.equal(api.restaurarResultadosVisibles(), 1);
assert.deepEqual(Object.fromEntries(fields.map(f => [f, inputs[f].value])), result);

// Un resultado cacheado por AUTO no puede repintarse si la lotería está deshabilitada.
inputs = Object.fromEntries(fields.map(f => [f, makeInput(f, '')]));
api.guardarResultadoVisible('09/27/2026', 'BRAZIL03PM', result, fields, 'auto');
api.setLeader(false);
assert.equal(api.restaurarResultadosVisibles(), 0);
assert.deepEqual(Object.fromEntries(fields.map(f => [f, inputs[f].value])),
  {primera:'',segunda:'',tercera:'',pick3:'',pick4:''});

console.log('PASS: Search restore preserves manual cache and blocks disabled AUTO cache');