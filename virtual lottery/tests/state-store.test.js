import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.__VL__={};
await import('../src/core/state-store.js').catch(()=>{});
const VL=globalThis.__VL__;
function mem(seed={}){const m=new Map(Object.entries(seed));return{get:(k,f)=>m.has(k)?structuredClone(m.get(k)):f,set:(k,v)=>m.set(k,structuredClone(v)),delete:k=>m.delete(k),dump:()=>Object.fromEntries(m)}}

test('patch stores compact state and updates index',()=>{
 const s=mem(); const store=VL.createStateStore(s,{retentionDays:7,now:()=>1000});
 const out=store.patch('2026-09-28','BRAZIL03PM',{state:'DONE',result:{primera:'45'},html:'NO'});
 assert.equal(out.state,'DONE'); assert.equal(out.updatedAt,1000); assert.equal('html' in out,false);
 assert.deepEqual(s.get('vl:auto:state:index',[]),['vl:auto:state:2026-09-28:BRAZIL03PM']);
});

test('gc retains today plus previous seven days and never touches settings',()=>{
 const seed={'vl:auto:settings':{masterEnabled:false},'vl:auto:state:index':[]};
 for(const d of ['2026-09-20','2026-09-21','2026-09-28']){const k=`vl:auto:state:${d}:BRAZIL12PM`;seed[k]={state:'DONE',updatedAt:1};seed['vl:auto:state:index'].push(k)}
 const s=mem(seed); VL.createStateStore(s,{retentionDays:7}).gc('2026-09-28'); const d=s.dump();
 assert.equal(d['vl:auto:state:2026-09-20:BRAZIL12PM'],undefined);
 assert.ok(d['vl:auto:state:2026-09-21:BRAZIL12PM']); assert.ok(d['vl:auto:state:2026-09-28:BRAZIL12PM']);
 assert.deepEqual(d['vl:auto:settings'],{masterEnabled:false});
});

test('legacy Brazil estado/resultado migrates to generic schema',()=>{
 const old='vl:auto:brazil:2026-09-27:BRAZIL03PM';
 const s=mem({[old]:{estado:'DONE',resultado:{primera:'45',segunda:'63',tercera:'91',pick3:'245',pick4:'6391'},foundAt:10,processSentAt:20,verifiedAt:30,updatedAt:40}});
 const store=VL.createStateStore(s,{retentionDays:7,now:()=>99});
 store.migrateLegacyBrazil('2026-09-28',['BRAZIL03PM']);
 const n=s.get('vl:auto:state:2026-09-27:BRAZIL03PM',null);
 assert.equal(n.state,'DONE'); assert.equal(n.result.pick4,'6391'); assert.equal(n.sourceSeenAt,10); assert.equal(n.verifiedAt,30);
 assert.equal(s.get(old,null),null);
});
