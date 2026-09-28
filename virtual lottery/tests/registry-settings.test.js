import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.__VL__ = {};
await import('../src/lotteries/registry.js').catch(()=>{});
await import('../src/core/storage.js').catch(()=>{});
await import('../src/core/settings-store.js').catch(()=>{});

const VL = globalThis.__VL__;

function memoryStorage(seed={}) {
  const map = new Map(Object.entries(seed));
  return { get:(k,f)=>map.has(k)?structuredClone(map.get(k)):f, set:(k,v)=>map.set(k,structuredClone(v)), delete:k=>map.delete(k), dump:()=>Object.fromEntries(map) };
}

test('registry contains all current manual draws and only Brazil automation', () => {
  const expected = ['EXTRA','WIN-10-00PM','WIN-7-30PM','WIN-5-30PM','WIN-1-00PM','WIN-11-00AM','WIN-9-30AM','RPL-11AM','RPL-1PM','RPL-3PM','RPL-5PM','RPL-7PM','RPL-9PM','PREMIER12PM','PREMIER03PM','PREMIER07PM','PREMIER08PM','BRAZIL12PM','BRAZIL03PM','BRAZIL07PM','BRAZIL08PM','QLT-MORNING','QLT-MIDDAY','QLT-AFTN','QLT-EVENING','QLT-NIGHT'];
  for (const code of expected) assert.ok(VL.getDrawByCode(code), code);
  assert.equal(VL.LOTTERY_REGISTRY.brazil.automationSupported, true);
  for (const id of ['extra','winner','rapid','premier','queen']) assert.equal(VL.LOTTERY_REGISTRY[id].automationSupported, false, id);
});

test('default Brazil settings preserve current schedule and retries', () => {
  const settings = VL.createDefaultSettings(VL.LOTTERY_REGISTRY);
  assert.equal(settings.masterEnabled, true);
  assert.equal(settings.lotteries.brazil.enabled, true);
  assert.deepEqual(settings.lotteries.brazil.draws.BRAZIL12PM, {enabled:true,time:'12:00'});
  assert.deepEqual(settings.lotteries.brazil.retryPolicy, {offsets:[1,3,5,8,12,20,30,45,60,90,120],afterLast:30});
});

test('corrupt settings fall back while valid custom values survive', () => {
  const storage = memoryStorage({'vl:auto:settings':{
    masterEnabled:'yes',
    lotteries:{ brazil:{ enabled:true, retryPolicy:{offsets:[1,3,3,2],afterLast:0}, draws:{BRAZIL03PM:{enabled:true,time:'15:10'}}}}
  }});
  const store = VL.createSettingsStore(storage, VL.LOTTERY_REGISTRY);
  const s = store.load();
  assert.equal(s.masterEnabled, true);
  assert.equal(s.lotteries.brazil.draws.BRAZIL03PM.time,'15:10');
  assert.equal(s.lotteries.brazil.draws.BRAZIL07PM.time,'19:00');
  assert.deepEqual(s.lotteries.brazil.retryPolicy.offsets,[1,3,5,8,12,20,30,45,60,90,120]);
});

test('resolve rejects inherited/object-prototype lottery identifiers', () => {
  const store = VL.createSettingsStore(memoryStorage(), VL.LOTTERY_REGISTRY);
  assert.equal(store.resolve('toString','BRAZIL12PM'), null);
  assert.equal(store.resolve('constructor','BRAZIL12PM'), null);
  assert.equal(store.resolve('brazil','constructor'), null);
});
