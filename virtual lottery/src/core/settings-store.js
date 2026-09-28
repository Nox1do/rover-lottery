(function (VL) {
  'use strict';
  const SETTINGS_KEY='vl:auto:settings';
  const hasOwn=(obj,key)=>!!obj && Object.prototype.hasOwnProperty.call(obj,key);
  const validTime = v => typeof v==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v);
  const validPolicy = p => !!p && Array.isArray(p.offsets) && p.offsets.length>0 && p.offsets.every(Number.isInteger) && p.offsets.every(n=>n>0) && p.offsets.every((n,i,a)=>i===0||n>a[i-1]) && Number.isInteger(p.afterLast) && p.afterLast>0;
  const clone = v => structuredClone(v);

  function createDefaultSettings(registry) {
    const lotteries={};
    for (const lotteryId of Object.keys(registry)) {
      const lottery=registry[lotteryId];
      const draws={};
      for (const code of Object.keys(lottery.draws)) {
        const d=lottery.draws[code];
        draws[code]={enabled: lottery.automationSupported ? d.enabledByDefault !== false : false, ...(d.time ? {time:d.time}:{})};
      }
      lotteries[lotteryId]={
        enabled: lottery.automationSupported ? lottery.enabledByDefault !== false : false,
        draws,
        ...(lottery.retryPolicy ? {retryPolicy:clone(lottery.retryPolicy)}:{})
      };
    }
    return {masterEnabled:true,lotteries};
  }

  function mergeSettings(raw, defaults, registry) {
    const out=clone(defaults);
    if (!raw || typeof raw!=='object' || Array.isArray(raw)) return out;
    if (typeof raw.masterEnabled==='boolean') out.masterEnabled=raw.masterEnabled;
    if (!raw.lotteries || typeof raw.lotteries!=='object' || Array.isArray(raw.lotteries)) return out;
    for (const lotteryId of Object.keys(registry)) {
      if (!hasOwn(raw.lotteries,lotteryId)) continue;
      const src=raw.lotteries[lotteryId];
      if (!src || typeof src!=='object' || Array.isArray(src)) continue;
      if (typeof src.enabled==='boolean') out.lotteries[lotteryId].enabled=src.enabled;
      if (validPolicy(src.retryPolicy)) out.lotteries[lotteryId].retryPolicy=clone(src.retryPolicy);
      if (src.draws && typeof src.draws==='object' && !Array.isArray(src.draws)) {
        for (const code of Object.keys(registry[lotteryId].draws)) {
          if (!hasOwn(src.draws,code)) continue;
          const d=src.draws[code];
          if (!d || typeof d!=='object' || Array.isArray(d)) continue;
          if (typeof d.enabled==='boolean') out.lotteries[lotteryId].draws[code].enabled=d.enabled;
          if (hasOwn(out.lotteries[lotteryId].draws[code],'time') && validTime(d.time)) out.lotteries[lotteryId].draws[code].time=d.time;
          if (validPolicy(d.retryPolicy)) out.lotteries[lotteryId].draws[code].retryPolicy=clone(d.retryPolicy);
        }
      }
    }
    return out;
  }

  function createSettingsStore(storage, registry) {
    let cache=null;
    const defaults=createDefaultSettings(registry);
    function load(){ cache=mergeSettings(storage.get(SETTINGS_KEY,null),defaults,registry); return clone(cache); }
    function save(settings){ cache=mergeSettings(settings,defaults,registry); storage.set(SETTINGS_KEY,cache); return clone(cache); }
    function update(mutator){ const next=load(); mutator(next); return save(next); }
    function resolve(lotteryId,drawCode){
      if (!hasOwn(registry,lotteryId)) return null;
      const lottery=registry[lotteryId];
      if (!hasOwn(lottery.draws,drawCode)) return null;
      const settings=load();
      const ls=settings.lotteries[lotteryId];
      const ds=ls.draws[drawCode];
      const policy=ds.retryPolicy || ls.retryPolicy || lottery.retryPolicy || null;
      return {masterEnabled:settings.masterEnabled,lotteryEnabled:ls.enabled,drawEnabled:ds.enabled,effectiveEnabled:!!(settings.masterEnabled&&lottery.automationSupported&&ls.enabled&&ds.enabled),time:ds.time||lottery.draws[drawCode].time||null,retryPolicy:policy?clone(policy):null,lottery,draw:lottery.draws[drawCode]};
    }
    return {load,save,update,resolve,defaults:()=>clone(defaults)};
  }
  Object.assign(VL,{SETTINGS_KEY,createDefaultSettings,createSettingsStore,mergeSettings,validTime,validPolicy});
})(globalThis.__VL__ ||= {});
