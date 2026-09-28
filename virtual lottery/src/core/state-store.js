(function (VL) {
  'use strict';
  const INDEX_KEY='vl:auto:state:index';
  const ALLOWED=['state','result','sourceSeenAt','processSentAt','verifiedAt','lastAttemptElapsedMin','lastError','updatedAt'];
  const key=(dateIso,drawCode)=>`vl:auto:state:${dateIso}:${drawCode}`;
  const parseDate=s=>new Date(`${s}T00:00:00Z`);
  function createStateStore(storage,{retentionDays=7,now=()=>Date.now()}={}){
    function get(dateIso,drawCode){ return storage.get(key(dateIso,drawCode),null); }
    function sanitize(patch){ const out={}; for(const k of ALLOWED) if(Object.prototype.hasOwnProperty.call(patch||{},k)) out[k]=structuredClone(patch[k]); return out; }
    function addIndex(k){ const idx=storage.get(INDEX_KEY,[]); if(!idx.includes(k)){idx.push(k);storage.set(INDEX_KEY,idx);} }
    function patch(dateIso,drawCode,changes){ const k=key(dateIso,drawCode); const current=get(dateIso,drawCode)||{state:'WAITING_TIME'}; const next={...current,...sanitize(changes),updatedAt:now()}; storage.set(k,next); addIndex(k); return structuredClone(next); }
    function remove(dateIso,drawCode){ const k=key(dateIso,drawCode); storage.delete(k); storage.set(INDEX_KEY,storage.get(INDEX_KEY,[]).filter(x=>x!==k)); }
    function gc(todayIso){
      const today=parseDate(todayIso); if(!Number.isFinite(today.getTime())) return;
      const min=new Date(today); min.setUTCDate(min.getUTCDate()-retentionDays);
      const kept=[];
      for(const k of storage.get(INDEX_KEY,[])){
        const m=k.match(/^vl:auto:state:(\d{4}-\d{2}-\d{2}):/); if(!m){continue;}
        const d=parseDate(m[1]);
        if(d>=min && d<=today) kept.push(k); else storage.delete(k);
      }
      storage.set(INDEX_KEY,kept);
    }
    function migrateLegacyBrazil(todayIso,brazilDrawCodes){
      const today=parseDate(todayIso); if(!Number.isFinite(today.getTime())) return;
      for(let i=0;i<=retentionDays;i++){
        const d=new Date(today); d.setUTCDate(d.getUTCDate()-i); const dateIso=d.toISOString().slice(0,10);
        for(const code of brazilDrawCodes){
          const oldKey=`vl:auto:brazil:${dateIso}:${code}`; const old=storage.get(oldKey,null); if(!old) continue;
          if(!get(dateIso,code)) patch(dateIso,code,{
            state:old.estado||old.state||'WAITING_TIME', result:old.resultado||old.result||null,
            sourceSeenAt:old.sourceSeenAt??old.foundAt??0, processSentAt:old.processSentAt??0,
            verifiedAt:old.verifiedAt??0, lastAttemptElapsedMin:old.lastAttemptElapsedMin,
            lastError:old.lastError||old.motivo||''
          });
          storage.delete(oldKey);
        }
      }
    }
    return {get,patch,remove,gc,migrateLegacyBrazil,key};
  }
  Object.assign(VL,{STATE_INDEX_KEY:INDEX_KEY,createStateStore});
})(globalThis.__VL__ ||= {});
