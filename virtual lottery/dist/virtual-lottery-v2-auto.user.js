// ==UserScript==
// @name         Virtual Lotteries v2 Auto
// @namespace    noeg
// @version      2.1.0
// @description  Virtual Lotteries v2: modo manual + Brazil/QPlay automático modular, configuración persistente y procesamiento/verificación en segundo plano.
// @author       noeg
// @match        https://www.roversport.lol/adm/es/lottery.php
// @match        https://www.roversport.net/adm/es/lottery.php
// @match        https://www.lotterypost.com/results/qc/extra/past*
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_xmlhttpRequest
// @connect      www.nationjl.com
// @connect      rapidlottery.app
// @connect      api.lotocentral.net
// @connect      qplay777.net
// @connect      www.thequeenlottery.com
// @run-at       document-idle
// ==/UserScript==

(function (VL) {
  'use strict';
  const draw = (label, time, extra={}) => ({ label, time, enabledByDefault:true, ...extra });
  const LOTTERY_REGISTRY = Object.freeze({
    extra: {
      name:'EXTRA', source:'extra', automationSupported:false, enabledByDefault:false,
      draws:{ EXTRA: draw('EXTRA', null, { roverCode:'EXTRA', hora:'Diario' }) }
    },
    winner: {
      name:'Winner', source:'nationjl', automationSupported:false, enabledByDefault:false,
      draws:{
        'WIN-10-00PM':draw('10:00 PM','22:00',{roverCode:'WIN-10-00PM',hora:'10:00 PM'}),
        'WIN-7-30PM':draw('7:30 PM','19:30',{roverCode:'WIN-7-30PM',hora:'07:30 PM'}),
        'WIN-5-30PM':draw('5:30 PM','17:30',{roverCode:'WIN-5-30PM',hora:'05:30 PM'}),
        'WIN-1-00PM':draw('1:00 PM','13:00',{roverCode:'WIN-1-00PM',hora:'01:00 PM'}),
        'WIN-11-00AM':draw('11:00 AM','11:00',{roverCode:'WIN-11-00AM',hora:'11:00 AM'}),
        'WIN-9-30AM':draw('9:30 AM','09:30',{roverCode:'WIN-9-30AM',hora:'09:30 AM'})
      }
    },
    rapid: {
      name:'Rapid', source:'rapid', automationSupported:false, enabledByDefault:false,
      draws:{
        'RPL-11AM':draw('11:00 AM','11:00',{roverCode:'RPL-11AM',hora:'11:00 AM',hora24:'11:00'}),
        'RPL-1PM':draw('1:00 PM','13:00',{roverCode:'RPL-1PM',hora:'01:00 PM',hora24:'13:00'}),
        'RPL-3PM':draw('3:00 PM','15:00',{roverCode:'RPL-3PM',hora:'03:00 PM',hora24:'15:00'}),
        'RPL-5PM':draw('5:00 PM','17:00',{roverCode:'RPL-5PM',hora:'05:00 PM',hora24:'17:00'}),
        'RPL-7PM':draw('7:00 PM','19:00',{roverCode:'RPL-7PM',hora:'07:00 PM',hora24:'19:00'}),
        'RPL-9PM':draw('9:00 PM','21:00',{roverCode:'RPL-9PM',hora:'09:00 PM',hora24:'21:00'})
      }
    },
    premier: {
      name:'Premier', source:'premier', automationSupported:false, enabledByDefault:false,
      draws:{
        PREMIER12PM:draw('12:00 PM','12:00',{roverCode:'PREMIER12PM',hora:'12:00 PM',premierKey:'12PM'}),
        PREMIER03PM:draw('3:00 PM','15:00',{roverCode:'PREMIER03PM',hora:'03:00 PM',premierKey:'3PM'}),
        PREMIER07PM:draw('7:00 PM','19:00',{roverCode:'PREMIER07PM',hora:'07:00 PM',premierKey:'7PM'}),
        PREMIER08PM:draw('8:00 PM','20:00',{roverCode:'PREMIER08PM',hora:'08:00 PM',premierKey:'8PM'})
      }
    },
    brazil: {
      name:'Brazil', source:'qplay', automationSupported:true, enabledByDefault:true,
      retryPolicy:{ offsets:[1,3,5,8,12,20,30,45,60,90,120], afterLast:30 },
      draws:{
        BRAZIL12PM:draw('12:00 PM','12:00',{roverCode:'BRAZIL12PM',hora:'12:00 PM'}),
        BRAZIL03PM:draw('3:00 PM','15:00',{roverCode:'BRAZIL03PM',hora:'03:00 PM'}),
        BRAZIL07PM:draw('7:00 PM','19:00',{roverCode:'BRAZIL07PM',hora:'07:00 PM'}),
        BRAZIL08PM:draw('8:00 PM','20:00',{roverCode:'BRAZIL08PM',hora:'08:00 PM'})
      }
    },
    queen: {
      name:'Queen', source:'queen', automationSupported:false, enabledByDefault:false,
      draws:{
        'QLT-MORNING':draw('Morning',null,{roverCode:'QLT-MORNING',hora:'Morning',queenKey:'QL MORNING'}),
        'QLT-MIDDAY':draw('Midday',null,{roverCode:'QLT-MIDDAY',hora:'Midday',queenKey:'QL MIDDAY'}),
        'QLT-AFTN':draw('Afternoon',null,{roverCode:'QLT-AFTN',hora:'Afternoon',queenKey:'QL AFTERNOON'}),
        'QLT-EVENING':draw('Evening',null,{roverCode:'QLT-EVENING',hora:'Evening',queenKey:'QL EVENING'}),
        'QLT-NIGHT':draw('Night',null,{roverCode:'QLT-NIGHT',hora:'Night',queenKey:'QL NIGHT'})
      }
    }
  });
  const hasOwn = (obj,key) => !!obj && Object.prototype.hasOwnProperty.call(obj,key);
  function getDrawByCode(code) {
    if (typeof code !== 'string') return null;
    for (const lotteryId of Object.keys(LOTTERY_REGISTRY)) {
      const lottery = LOTTERY_REGISTRY[lotteryId];
      if (hasOwn(lottery.draws, code)) return { lotteryId, lottery, draw: lottery.draws[code] };
    }
    return null;
  }
  Object.assign(VL,{LOTTERY_REGISTRY,getDrawByCode,hasOwn});
})(globalThis.__VL__ ||= {});


(function (VL) {
  'use strict';
  function createGMStorage(api=globalThis) {
    return {
      get(key,fallback){ try { const value=api.GM_getValue(key,fallback); return value === undefined ? fallback : value; } catch { return fallback; } },
      set(key,value){ return api.GM_setValue(key,value); },
      delete(key){ return api.GM_deleteValue(key); }
    };
  }
  VL.createGMStorage=createGMStorage;
})(globalThis.__VL__ ||= {});


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


(function(VL){'use strict';
 function parseTimeToMinute(time){ if(typeof time!=='string'||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN; const [h,m]=time.split(':').map(Number); return h*60+m; }
 function nextRetryOffset(elapsedMinutes,policy){ const offsets=policy?.offsets||[]; const next=offsets.find(n=>n>elapsedMinutes); return next ?? (elapsedMinutes+(policy?.afterLast||30)); }
 function resolveRetryPolicy(settings,registry,lotteryId,drawCode){ const ls=settings?.lotteries?.[lotteryId]; const ds=ls?.draws?.[drawCode]; return structuredClone(ds?.retryPolicy||ls?.retryPolicy||registry?.[lotteryId]?.retryPolicy||{offsets:[1],afterLast:30}); }
 Object.assign(VL,{parseTimeToMinute,nextRetryOffset,resolveRetryPolicy});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 function createRDClock(now=new Date()){
   const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Santo_Domingo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
   return {dateUs:`${parts.month}/${parts.day}/${parts.year}`,dateIso:`${parts.year}-${parts.month}-${parts.day}`,minuteOfDay:Number(parts.hour)*60+Number(parts.minute),second:Number(parts.second)};
 }
 function shouldAttemptDraw({clock,drawTime,state={},policy}){
   if(!clock||!clock.dateIso) return false;
   if(state.dateIso && state.dateIso!==clock.dateIso) return false;
   if(['DONE','CONFLICT','DUPLICATE','PROCESS_UNCERTAIN'].includes(state.state)) return false;
   const drawMin=VL.parseTimeToMinute(drawTime); if(!Number.isFinite(drawMin)) return false;
   const elapsed=clock.minuteOfDay-drawMin; if(elapsed<0) return false;
   const first=policy?.offsets?.[0] ?? 1; if(elapsed<first) return false;
   if(!Number.isFinite(state.lastAttemptElapsedMin)) return true;
   return elapsed>=VL.nextRetryOffset(state.lastAttemptElapsedMin,policy);
 }
 Object.assign(VL,{createRDClock,shouldAttemptDraw});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict'; function createLogger(prefix='[AUTO]'){return{log:(...a)=>console.log(prefix,...a),warn:(...a)=>console.warn(prefix,...a),error:(...a)=>console.error(prefix,...a)}}VL.createLogger=createLogger;})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 const FIELDS=['primera','segunda','tercera','pick3','pick4'];
 function normalizeRoverValue(value){const v=String(value??'').trim().toUpperCase();return v==='---'?'':v}
 function hasConflict(values,result){return FIELDS.some(f=>{const a=normalizeRoverValue(values?.[f]);const b=normalizeRoverValue(result?.[f]);return a!==''&&a!==b})}
 function isExactMatch(values,result){return FIELDS.every(f=>normalizeRoverValue(values?.[f])===normalizeRoverValue(result?.[f]))}
 function findDuplicates(rows,drawCode,result){return (rows||[]).filter(r=>r.code&&r.code!==drawCode&&normalizeRoverValue(r.values.primera)===result.primera&&normalizeRoverValue(r.values.segunda)===result.segunda&&normalizeRoverValue(r.values.tercera)===result.tercera).map(r=>({code:r.code,name:r.name||r.code}))}
 Object.assign(VL,{ROVER_FIELDS:FIELDS,normalizeRoverValue,hasConflict,isExactMatch,findDuplicates});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 function attr(attrs,name){const m=String(attrs).match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`,'i'));return m?m[1]:''}
 function strip(html){return String(html||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
 function parseRoverRows(html){const rows=[];const re=/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi;let m;while((m=re.exec(html))){const body=m[2];if(!/\bres_tr\b/i.test(attr(m[1],'class')+' '+body))continue;const inputs={};let rawCode='';const ir=/<input\b([^>]*)>/gi;let im;while((im=ir.exec(body))){const a=im[1],name=attr(a,'name');if(!VL.ROVER_FIELDS.includes(name))continue;inputs[name]=attr(a,'value');if(!rawCode)rawCode=attr(a,'loteria')}if(!rawCode)continue;const nm=body.match(/class\s*=\s*["'][^"']*loteria-nombre[^"']*["'][^>]*>([\s\S]*?)<\//i);rows.push({rawCode,code:rawCode.trim(),processed:/status-circle[^"']*status-ok|status-ok[^"']*status-circle/i.test(body),values:Object.fromEntries(VL.ROVER_FIELDS.map(f=>[f,inputs[f]??''])),name:nm?strip(nm[1]):rawCode.trim()})}return rows}
 function createRoverReader({fetchFn=fetch}={}){return{async read({dateUs,drawCode,result=null}){const response=await fetchFn('__inc/verResultados2.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},body:new URLSearchParams({loteria:'',fecha:dateUs}).toString()});if(!response.ok)throw new Error(`Rover HTTP ${response.status} en __inc/verResultados2.php`);const html=await response.text();const rows=parseRoverRows(html);const row=rows.find(r=>r.code===drawCode);if(!row)return{found:false};return{found:true,rawCode:row.rawCode,processed:row.processed,values:row.values,duplicates:result?VL.findDuplicates(rows,drawCode,result):[]}}}}
 Object.assign(VL,{parseRoverRows,createRoverReader});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 function createRoverProcessor({fetchFn=fetch}={}){return{async process({dateIso,rawCode,result}){const response=await fetchFn('__inc/procesarResultados.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},body:new URLSearchParams({fecha:dateIso,loteria:rawCode,primera:result.primera,segunda:result.segunda,tercera:result.tercera,pick3:result.pick3,pick4:result.pick4}).toString()});const text=await response.text();if(!response.ok)throw new Error(`Rover HTTP ${response.status} en __inc/procesarResultados.php`);return{httpOk:true,text}}}}
 VL.createRoverProcessor=createRoverProcessor;
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 async function verifyProcessed({reader,wait=ms=>new Promise(r=>setTimeout(r,ms)),delays=[700,1200,2500,5000,8000],dateUs,drawCode,result}){for(const delay of delays){await wait(delay);const snap=await reader.read({dateUs,drawCode});if(!snap.found)continue;if(snap.processed&&VL.isExactMatch(snap.values,result))return{state:'DONE',snapshot:snap};if((snap.processed&&!VL.isExactMatch(snap.values,result))||VL.hasConflict(snap.values,result))return{state:'CONFLICT',snapshot:snap}}return{state:'PROCESS_UNCERTAIN'}}
 VL.verifyProcessed=verifyProcessed;
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 function requestText(url,headers={'Cache-Control':'no-cache'}){return new Promise((resolve,reject)=>{GM_xmlhttpRequest({method:'GET',url,headers,timeout:15000,onload:r=>r.status>=200&&r.status<300?resolve(r.responseText??r.response??''):reject(new Error(`HTTP ${r.status} en ${url}`)),onerror:()=>reject(new Error(`Error de red consultando ${url}`)),ontimeout:()=>reject(new Error(`Timeout consultando ${url}`))})})}
 VL.requestText=requestText;
})(globalThis.__VL__ ||= {});


(function(VL){'use strict'; const URL='https://qplay777.net/';
 function parseFH(t){const m=String(t).trim().match(/^(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{1,2}):(\d{2})(am|pm)$/i);return m?{fecha:m[1],hora:`${String(m[2]).padStart(2,'0')}:${m[3]} ${m[4].toUpperCase()}`}:null}
 function values(srcs){let mode='main';const a=[],b=[],c=[];for(const raw of srcs){const s=String(raw).toLowerCase();if(/\/img\/pick3\.png(?:[?#]|$)/.test(s)){mode='p3';continue}if(/\/img\/pick4\.png(?:[?#]|$)/.test(s)){mode='p4';continue}const m=s.match(/\/img\/balls\/([0-9])\.png(?:[?#]|$)/);if(!m)continue;(mode==='main'?a:mode==='p3'?b:c).push(m[1])}if(a.length<6||b.length<3||c.length<4)return null;return{primera:a.slice(0,2).join(''),segunda:a.slice(2,4).join(''),tercera:a.slice(4,6).join(''),pick3:b.slice(0,3).join(''),pick4:c.slice(0,4).join('')}}
 function parseQPlay(html){const out=[];const hre=/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;const hs=[];let m;while((m=hre.exec(html)))hs.push({i:m.index,end:hre.lastIndex,text:m[1].replace(/<[^>]+>/g,'').trim()});for(let x=0;x<hs.length;x++){const fh=parseFH(hs[x].text);if(!fh)continue;const seg=html.slice(hs[x].end,hs[x+1]?.i??html.length);const srcs=[...seg.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(z=>z[1]);const v=values(srcs);if(v)out.push({...fh,...v})}return out}
 function createQPlaySource({request=VL.requestText}={}){let cache={ts:0,p:null};async function all(){const n=Date.now();if(cache.p&&n-cache.ts<10000)return cache.p;const p=Promise.resolve(request(URL)).then(parseQPlay);cache={ts:n,p};try{return await p}finally{setTimeout(()=>{if(cache.p===p)cache={ts:0,p:null}},10000)}}return{async fetchResult({draw,dateUs}){return (await all()).find(r=>r.fecha===dateUs&&r.hora.toUpperCase()===String(draw.hora||'').toUpperCase())||null}}}
 Object.assign(VL,{parseQPlay,createQPlaySource});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';const URL='https://www.thequeenlottery.com/main/live';const months={january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};
 function qDate(s){const m=String(s).trim().match(/^(?:[A-Za-z]+,\s*)?([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/i);return m&&months[m[1].toLowerCase()]?`${months[m[1].toLowerCase()]}/${String(m[2]).padStart(2,'0')}/${m[3]}`:''}
 const imgs=s=>[...String(s).matchAll(/\/normal\/([0-9]{2})\.png/gi)].map(m=>m[1]);const strip=s=>String(s).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
 function parseQueen(html){const out=[];const dates=[...html.matchAll(/<h4[^>]*>([^<]+)<\/h4>/gi)].map(m=>({i:m.index,fecha:qDate(m[1])})).filter(x=>x.fecha);for(let d=0;d<dates.length;d++){const seg=html.slice(dates[d].i,dates[d+1]?.i??html.length);for(const rm of seg.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){const tds=[...rm[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x=>x[1]);if(tds.length<6)continue;const key=strip(tds[0]).toUpperCase();if(!/^QL (MORNING|MIDDAY|AFTERNOON|EVENING|NIGHT)$/.test(key))continue;const a=imgs(tds[1]),b=imgs(tds[2]),c=imgs(tds[3]),p3=imgs(tds[4]).map(x=>String(parseInt(x,10))),p4=imgs(tds[5]).map(x=>String(parseInt(x,10)));const r={fecha:dates[d].fecha,queenKey:key,primera:a[0]||'',segunda:b[0]||'',tercera:c[0]||'',pick3:p3.join(''),pick4:p4.join('')};if(/^\d{2}$/.test(r.primera)&&/^\d{2}$/.test(r.segunda)&&/^\d{2}$/.test(r.tercera)&&/^\d{3}$/.test(r.pick3)&&/^\d{4}$/.test(r.pick4))out.push(r)}}return out}
 function createQueenSource({request=VL.requestText}={}){return{async fetchResult({draw,dateUs}){const key=String(draw.queenKey||'').toUpperCase();return parseQueen(await request(URL)).find(r=>r.fecha===dateUs&&r.queenKey===key)||null}}}
 Object.assign(VL,{parseQueen,createQueenSource});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';const URL='https://api.lotocentral.net/api/v1/homepage/historical_results';
 const dateUs=d=>{const m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[2]}/${m[3]}/${m[1]}`:''};
 function parsePremier(data){return (Array.isArray(data?.results)?data.results:[]).map(r=>({fecha:dateUs(r.date),horaKey:String(r?.sortition?.abbreviation||'').toUpperCase(),primera:String(r.first??''),segunda:String(r.second??''),tercera:String(r.third??''),pick3:String(r.cashThree??''),pick4:String(r.pickFour??'')})).filter(r=>r.fecha&&r.horaKey)}
 function createPremierSource({request=(u,h)=>VL.requestText(u,h)}={}){return{async fetchResult({draw,dateUs}){const text=await request(URL,{Accept:'application/json',Origin:'https://premierlotto.tv',Referer:'https://premierlotto.tv/','Cache-Control':'no-cache'});let data;try{data=JSON.parse(text)}catch{throw new Error('PremierLotto: respuesta JSON inválida')}const key=String(draw.premierKey||'').toUpperCase();return parsePremier(data).find(r=>r.fecha===dateUs&&r.horaKey===key)||null}}}
 Object.assign(VL,{parsePremier,createPremierSource});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';const URL='https://rapidlottery.app/api/res.php';const months={january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};
 function parseFH(v){const m=String(v||'').trim().match(/^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}:\d{2})\s+(AM|PM)$/i);if(!m||!months[m[1].toLowerCase()])return null;return{fecha:`${months[m[1].toLowerCase()]}/${String(m[2]).padStart(2,'0')}/${m[3]}`,hora:`${String(m[4].split(':')[0]).padStart(2,'0')}:${m[4].split(':')[1]} ${m[5].toUpperCase()}`}}
 function parseRapid(data){return(Array.isArray(data?.history)?data.history:[]).flatMap(r=>{const f=parseFH(r.datetime);return f?[{...f,drawNumber:String(r.draw_number||''),primera:String(r.first??''),segunda:String(r.second??''),tercera:String(r.third??''),pick3:String(r.pick3||'').replace(/,/g,'').trim(),pick4:String(r.pick4||'').replace(/,/g,'').trim()}]:[]})}
 function createRapidSource({request=VL.requestText,todayUs=()=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Santo_Domingo',month:'2-digit',day:'2-digit',year:'numeric'}).format(new Date())}={}){return{async fetchResult({draw,dateUs}){let data;try{data=JSON.parse(await request(URL))}catch{throw new Error('Rapid Lottery: respuesta JSON inválida')}if(dateUs===todayUs()){const d=(Array.isArray(data.draws)?data.draws:[]).find(x=>String(x.time||'')===draw.hora24);if(d&&Number(d.completed)!==1)return{pending:true}}return parseRapid(data).find(r=>r.fecha===dateUs&&r.hora.toUpperCase()===String(draw.hora||'').toUpperCase())||null}}}
 Object.assign(VL,{parseRapid,createRapidSource});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';const URL='https://www.nationjl.com/main/live';
 function parseNationJL(html){if(typeof DOMParser==='undefined')return[];const doc=new DOMParser().parseFromString(html,'text/html'),table=doc.querySelector('.results-pw table');if(!table)throw new Error('NationJL: no se encontró LAST 7 DAYS RESULTS');let date='';const out=[];const val=img=>(img?.getAttribute('src')||'').match(/\/normal\/([^/?#]+)\.png/i)?.[1]||'';const pick=td=>[...td.querySelectorAll('img')].map(i=>{const v=parseInt(val(i),10);return Number.isFinite(v)?String(v):''}).filter(Boolean).join('');for(const tr of table.querySelectorAll('tr')){const h=tr.querySelector('th[colspan] span');if(h){if(/^\d{2}\/\d{2}\/\d{4}$/.test(h.textContent.trim()))date=h.textContent.trim();continue}const td=[...tr.querySelectorAll('td')];if(td.length<8)continue;const hora=td[0].textContent.replace(/\s+/g,' ').trim();if(!/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(hora))continue;out.push({fecha:date,hora,primera:val(td[1].querySelector('img')),segunda:val(td[2].querySelector('img')),tercera:val(td[3].querySelector('img')),pick3:pick(td[6]),pick4:pick(td[7])})}return out}
 function createNationJLSource({request=VL.requestText}={}){return{async fetchResult({draw,dateUs}){return parseNationJL(await request(URL)).find(r=>r.fecha===dateUs&&r.hora.toUpperCase()===String(draw.hora||'').toUpperCase())||null}}}
 Object.assign(VL,{parseNationJL,createNationJLSource});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 const EXTRA_URL='https://www.lotterypost.com/results/qc/extra/past',WAIT=120000;
 function parseExtra(html,dateIso){if(/just a moment|attention required/i.test(html))throw new Error('Lottery Post: verificación Cloudflare; no se obtuvieron resultados');const canonical=String(html).match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]||String(html).match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1];if(canonical){const u=new globalThis.URL(canonical,EXTRA_URL);if(u.hostname!=='www.lotterypost.com'||!/^\/results\/qc\/extra(?:\/|$)/.test(u.pathname))throw new Error('Lottery Post: la respuesta no corresponde a Québec Extra');}const blocks=[...String(html).matchAll(/<[^>]*class=["'][^"']*resultsdrawing[^"']*["'][^>]*>([\s\S]*?)(?=<[^>]*class=["'][^"']*resultsdrawing|$)/gi)].map(m=>m[1]);const matches=blocks.filter(b=>new RegExp(`datetime=["']${dateIso}T`).test(b));if(!matches.length)return null;if(matches.length!==1)throw new Error('Lottery Post: más de un sorteo para la misma fecha');const list=matches[0].match(/class=["'][^"']*resultsnums[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i)?.[1]||'';const digits=[...list.matchAll(/<li[^>]*>\s*(\d)\s*<\/li>/gi)].map(m=>m[1]);if(digits.length!==7)return null;const n=digits.join('');return{fecha:`${dateIso.slice(5,7)}/${dateIso.slice(8,10)}/${dateIso.slice(0,4)}`,numero:n,primera:n.slice(5,7),segunda:n.slice(1,3),tercera:n.slice(3,5)}}
 function dateIsoFromUs(us){const m=String(us).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?`${m[3]}-${m[1]}-${m[2]}`:''}
 function createExtraSource({api=globalThis,cryptoObj=globalThis.crypto}={}){const cancels=new Set();function cancelAll(){for(const f of [...cancels])f()}
  function fetchResult({dateUs}){const dateIso=dateIsoFromUs(dateUs);if(!dateIso)return Promise.reject(new Error('Extra: fecha inválida'));return new Promise((resolve,reject)=>{const id=cryptoObj.randomUUID(),rk=`vl-extra-request:${id}`,sk=`vl-extra-response:${id}`;let done=false,listener,timer,tab;const finish=(err,res,close=false)=>{if(done)return;done=true;clearTimeout(timer);if(listener!==undefined)api.GM_removeValueChangeListener(listener);api.GM_deleteValue(rk);api.GM_deleteValue(sk);cancels.delete(cancel);if(close&&tab)tab.close();err?reject(err):resolve(res)};const cancel=()=>finish(new Error('Extra: consulta cancelada por cambio de fecha'),null,true);cancels.add(cancel);listener=api.GM_addValueChangeListener(sk,(_k,_o,r)=>{if(!r||r.id!==id||r.fechaISO!==dateIso)return;if(r.error)return finish(new Error(r.error));if(r.numero===null)return finish(null,null,true);if(!/^\d{7}$/.test(r.numero||''))return finish(new Error('Extra: resultado inválido recibido de la pestaña'));const n=r.numero;finish(null,{fecha:dateUs,numero:n,primera:n.slice(5,7),segunda:n.slice(1,3),tercera:n.slice(3,5)},true)});api.GM_setValue(rk,{id,fechaISO:dateIso,creada:Date.now()});timer=setTimeout(()=>finish(new Error('Extra: tiempo de espera de 2 minutos agotado.'),null,true),WAIT);const [y,m]=dateIso.split('-');tab=api.GM_openInTab(`${EXTRA_URL}/${y}/${Number(m)}#${new URLSearchParams({vlExtra:id})}`,{active:false,insert:true,setParent:true});if(!tab)finish(new Error('Extra: no se pudo abrir la pestaña de Lottery Post'))})}
  return{fetchResult,cancelAll};}
 function handleExtraTab({api=globalThis,doc=globalThis.document,loc=globalThis.location}={}){const id=new URLSearchParams(loc.hash.slice(1)).get('vlExtra');if(!id||!/^[a-f0-9-]{36}$/i.test(id))return false;const rk=`vl-extra-request:${id}`,req=api.GM_getValue(rk,null);if(!req||req.id!==id||!/^\d{4}-\d{2}-\d{2}$/.test(req.fechaISO)||Date.now()-req.creada>WAIT)return false;let done=false,obs,timer;const stop=()=>{done=true;obs?.disconnect();clearTimeout(timer)};const read=()=>{if(done)return;const cur=api.GM_getValue(rk,null);if(!cur||cur.id!==id)return stop();if(!doc.querySelector('.resultsdrawing'))return;let response;try{const r=parseExtra(doc.documentElement.outerHTML,req.fechaISO);response={id,fechaISO:req.fechaISO,numero:r?.numero??null}}catch(e){response={id,fechaISO:req.fechaISO,error:e.message}}stop();api.GM_setValue(`vl-extra-response:${id}`,response)};obs=new MutationObserver(read);obs.observe(doc.documentElement,{childList:true,subtree:true});timer=setTimeout(stop,Math.max(0,WAIT-(Date.now()-req.creada)));read();return true}
 Object.assign(VL,{EXTRA_URL,EXTRA_WAIT_MS:WAIT,parseExtra,createExtraSource,handleExtraTab});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';function createSourceAdapters(){return{qplay:VL.createQPlaySource(),queen:VL.createQueenSource(),premier:VL.createPremierSource(),rapid:VL.createRapidSource(),nationjl:VL.createNationJLSource(),extra:VL.createExtraSource()}}VL.createSourceAdapters=createSourceAdapters;
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';VL.UI_CSS=`
#vl-auto-toolbar{display:flex;align-items:center;gap:10px;padding:7px 10px;margin:6px 0;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;font:13px/1.3 Arial,sans-serif;color:#0f172a}#vl-auto-toolbar .vl-title{font-weight:700}#vl-auto-toolbar .vl-summary{color:#475569}#vl-auto-toolbar button{border:0;background:transparent;cursor:pointer;font-size:17px;padding:2px 5px}.vl-switch{display:inline-flex;gap:5px;align-items:center}.vl-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:99998;display:flex;align-items:center;justify-content:center}.vl-modal{background:#fff;max-width:760px;width:min(94vw,760px);max-height:88vh;overflow:auto;border-radius:8px;padding:16px;z-index:99999;font:14px/1.4 Arial,sans-serif}.vl-modal table{width:100%;border-collapse:collapse}.vl-modal th,.vl-modal td{padding:6px;border-bottom:1px solid #e2e8f0;text-align:left}.vl-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.vl-error{color:#b91c1c;margin-top:8px}
.rs-source-fetch-btn{margin-left:6px;padding:2px 5px;min-width:24px;height:20px;border:0;border-radius:4px;background:#2563eb;color:#fff;font-size:10px;cursor:pointer}.rs-source-filled{background-color:rgba(34,197,94,.18)!important;box-shadow:inset 0 0 0 1px rgba(34,197,94,.28)!important}
`;})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 function parseRetryOffsets(text){const a=String(text||'').split(',').map(s=>Number(s.trim()));if(!a.length||a.some(n=>!Number.isInteger(n)||n<=0)||a.some((n,i)=>i>0&&n<=a[i-1]))return null;return a}
 function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function collectDrawStates(stateStore,registry,clock=VL.createRDClock()){const out={};for(const id of Object.keys(registry)){if(!registry[id].automationSupported)continue;for(const code of Object.keys(registry[id].draws)){const st=stateStore?.get?.(clock.dateIso,code);if(st)out[code]=st}}return out}
 function renderSettingsModalHtml(registry,settings,states={}){let body='';for(const id of Object.keys(registry)){const l=registry[id];if(!l.automationSupported)continue;const s=settings.lotteries[id];body+=`<section data-lottery="${esc(id)}"><h4>${esc(l.name)} / ${esc(l.source)}</h4><label><input type="checkbox" data-lottery-enabled="${esc(id)}" ${s.enabled?'checked':''}> Auto</label><table><thead><tr><th>Sorteo</th><th>Auto</th><th>Hora</th><th>Estado</th></tr></thead><tbody>`;for(const code of Object.keys(l.draws)){const d=s.draws[code];body+=`<tr><td>${esc(l.draws[code].label)} <small>${esc(code)}</small></td><td><input type="checkbox" data-draw-enabled="${esc(code)}" ${d.enabled?'checked':''}></td><td><input type="time" data-draw-time="${esc(code)}" value="${esc(d.time||'')}"></td><td>${esc(states[code]?.state||'WAITING_TIME')}</td></tr>`}body+=`</tbody></table><label>Reintentos <input data-retry-offsets="${esc(id)}" value="${esc(s.retryPolicy.offsets.join(','))}"></label> <label>Después <input type="number" min="1" data-retry-after="${esc(id)}" value="${esc(s.retryPolicy.afterLast)}"> min</label></section>`}return `<div class="vl-modal"><h3>Configuración automática</h3><label><input type="checkbox" data-modal-master ${settings.masterEnabled?'checked':''}> AUTO general</label>${body}<div class="vl-error" data-error></div><div class="vl-actions"><button data-cancel>Cancelar</button><button data-save>Guardar</button></div></div>`}
 function openSettingsModal({root=document,settingsStore,stateStore,registry,onSave=()=>{}}){root.querySelector('#vl-auto-settings-modal')?.remove();const settings=settingsStore.load();const states=collectDrawStates(stateStore,registry);const wrap=root.createElement('div');wrap.id='vl-auto-settings-modal';wrap.className='vl-modal-backdrop';wrap.innerHTML=renderSettingsModalHtml(registry,settings,states);root.body.appendChild(wrap);wrap.querySelector('[data-cancel]').onclick=()=>wrap.remove();wrap.querySelector('[data-save]').onclick=()=>{const next=structuredClone(settings);next.masterEnabled=!!wrap.querySelector('[data-modal-master]')?.checked;for(const id of Object.keys(registry)){if(!registry[id].automationSupported)continue;next.lotteries[id].enabled=!!wrap.querySelector(`[data-lottery-enabled="${id}"]`)?.checked;for(const code of Object.keys(registry[id].draws)){next.lotteries[id].draws[code].enabled=!!wrap.querySelector(`[data-draw-enabled="${code}"]`)?.checked;next.lotteries[id].draws[code].time=wrap.querySelector(`[data-draw-time="${code}"]`)?.value||next.lotteries[id].draws[code].time}const offsets=parseRetryOffsets(wrap.querySelector(`[data-retry-offsets="${id}"]`)?.value);const after=Number(wrap.querySelector(`[data-retry-after="${id}"]`)?.value);if(!offsets||!Number.isInteger(after)||after<=0){wrap.querySelector('[data-error]').textContent='Reintentos inválidos.';return}next.lotteries[id].retryPolicy={offsets,afterLast:after}}settingsStore.save(next);onSave();wrap.remove()};return wrap}
 Object.assign(VL,{parseRetryOffsets,collectDrawStates,renderSettingsModalHtml,openSettingsModal});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 function countActiveDraws(registry,settings){if(!settings?.masterEnabled)return 0;let n=0;for(const id of Object.keys(registry)){const l=registry[id],s=settings.lotteries?.[id];if(!l.automationSupported||!s?.enabled)continue;for(const code of Object.keys(l.draws))if(s.draws?.[code]?.enabled)n++}return n}
 function renderToolbarHtml(settings,summary=''){return `<div class="vl-title">Virtual Lottery</div><label class="vl-switch">AUTO <input type="checkbox" data-vl-master ${settings.masterEnabled?'checked':''}></label><span class="vl-summary">${summary}</span><button type="button" data-vl-settings aria-label="Configuración automática" title="Configuración automática">⚙</button>`}
 function ensureToolbar({root=document,settingsStore,stateStore,registry,onSettingsChanged=()=>{}}){const anchor=root.querySelector('#resultadosLoteria');if(!anchor)return null;let el=root.querySelector('#vl-auto-toolbar');const settings=settingsStore.load();const summary=`${countActiveDraws(registry,settings)} activos`;if(!el){el=root.createElement('div');el.id='vl-auto-toolbar';anchor.parentNode.insertBefore(el,anchor)}el.innerHTML=renderToolbarHtml(settings,summary);el.querySelector('[data-vl-master]')?.addEventListener('change',e=>{settingsStore.update(s=>{s.masterEnabled=!!e.target.checked});onSettingsChanged();ensureToolbar({root,settingsStore,stateStore,registry,onSettingsChanged})});el.querySelector('[data-vl-settings]')?.addEventListener('click',()=>VL.openSettingsModal({root,settingsStore,stateStore,registry,onSave:onSettingsChanged}));return el}
 Object.assign(VL,{countActiveDraws,renderToolbarHtml,ensureToolbar});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 const REINJECTION_DEBOUNCE_MS=450;const ICON_SEARCH='🔎',ICON_OK='✓',ICON_ERR='×';
 function findLotteryInput(root,code){return [...root.querySelectorAll('input[loteria]')].find(i=>String(i.getAttribute('loteria')||'').trim()===code)||null}
 function manualFieldsForSource(source){return source==='extra'?['primera','segunda','tercera']:['primera','segunda','tercera','pick3','pick4']}
 function roverDate(root){const v=String(root.querySelector('#fecha')?.value||'').trim();return /^\d{2}\/\d{2}\/\d{4}$/.test(v)?v:''}
 function writeInput(input,value){input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}
 function createManualController({root=document,registry,sourceAdapters,logger=console}){let revision=0;let timer=null;const requests=new WeakMap();
  function entries(){const out=[];for(const lotteryId of Object.keys(registry)){const l=registry[lotteryId];for(const code of Object.keys(l.draws))out.push({code,lottery:l,draw:l.draws[code]})}return out}
  async function search(code,tr,btn){const info=entries().find(x=>x.code===code),date=roverDate(root);if(!info||!date)return;const rev=revision,token=Symbol();requests.set(btn,token);btn.disabled=true;btn.textContent='…';try{const result=await sourceAdapters[info.lottery.source].fetchResult({draw:info.draw,dateUs:date});if(requests.get(btn)!==token||rev!==revision||date!==roverDate(root)||!tr.isConnected)return;if(result?.pending||!result){btn.disabled=false;btn.textContent=ICON_ERR;setTimeout(()=>{btn.textContent=ICON_SEARCH},2000);return}const fields=manualFieldsForSource(info.lottery.source);for(const f of fields){if(typeof result[f]!=='string'||result[f]==='')throw new Error('Resultado incompleto');const input=tr.querySelector(`input[name="${f}"]`);if(!input)throw new Error(`Input ${f} no encontrado`);writeInput(input,result[f]);input.classList?.add('rs-source-filled')}btn.disabled=false;btn.textContent=ICON_OK}catch(e){logger.error?.('[Fuentes]',e);btn.disabled=false;btn.textContent=ICON_ERR}}
  function installButtons(){let added=0;for(const info of entries()){const input=findLotteryInput(root,info.code);if(!input)continue;const tr=input.closest('tr');if(!tr||tr.querySelector(`.rs-source-fetch-btn[data-codigo="${info.code}"]`))continue;const ab=tr.querySelector('.loteria-abrev');if(!ab)continue;const b=root.createElement('button');b.type='button';b.className='rs-source-fetch-btn';b.dataset.codigo=info.code;b.textContent=ICON_SEARCH;b.title=`Buscar en ${info.lottery.name}`;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(!b.disabled)search(info.code,tr,b)});ab.insertAdjacentElement('afterend',b);added++}return added}
  function installDateListener(){const f=root.querySelector('#fecha');if(!f||f.dataset.rsSourcesListenerInstalled)return false;f.dataset.rsSourcesListenerInstalled='1';const reset=()=>{revision++;sourceAdapters.extra?.cancelAll?.();root.querySelectorAll('.rs-source-fetch-btn').forEach(b=>{b.disabled=false;b.textContent=ICON_SEARCH})};f.addEventListener('change',reset);f.addEventListener('input',reset);return true}
  function needsReinjection(){if(root.querySelector('#resultadosLoteria')&&!root.querySelector('#vl-auto-toolbar'))return true;const f=root.querySelector('#fecha');if(f&&!f.dataset.rsSourcesListenerInstalled)return true;for(const info of entries()){const input=findLotteryInput(root,info.code);if(!input)continue;const tr=input.closest('tr');if(tr&&!tr.querySelector(`.rs-source-fetch-btn[data-codigo="${info.code}"]`))return true}return false}
  function scheduleReinjection(fn){clearTimeout(timer);timer=setTimeout(()=>{timer=null;if(needsReinjection())fn()},REINJECTION_DEBOUNCE_MS)}
  return{installButtons,installDateListener,needsReinjection,scheduleReinjection,search};
 }
 Object.assign(VL,{REINJECTION_DEBOUNCE_MS,findLotteryInput,manualFieldsForSource,createManualController});
})(globalThis.__VL__ ||= {});


(function(VL){'use strict';
 const STATES=Object.freeze({WAITING_TIME:'WAITING_TIME',SEARCHING_SOURCE:'SEARCHING_SOURCE',RESULT_READY:'RESULT_READY',CHECKING_ROVER:'CHECKING_ROVER',PROCESSING:'PROCESSING',VERIFYING:'VERIFYING',DONE:'DONE',CONFLICT:'CONFLICT',DUPLICATE:'DUPLICATE',PROCESS_UNCERTAIN:'PROCESS_UNCERTAIN',ERROR:'ERROR'});
 const validResult=r=>!!r&&/^\d{2}$/.test(r.primera)&&/^\d{2}$/.test(r.segunda)&&/^\d{2}$/.test(r.tercera)&&/^\d{3}$/.test(r.pick3)&&/^\d{4}$/.test(r.pick4);
 function createAutoEngine({registry,settingsStore,stateStore,sourceAdapters,roverReader,roverProcessor,verifier,clock=VL.createRDClock,logger=console,tickMs=20000,setIntervalFn=setInterval,clearIntervalFn=clearInterval}){
   const inFlight=new Set(); let timer=null,started=false;
   const terminal=s=>[STATES.DONE,STATES.CONFLICT,STATES.DUPLICATE,STATES.PROCESS_UNCERTAIN].includes(s);
   async function evaluateDraw(lotteryId,drawCode){
     const resolved=settingsStore.resolve(lotteryId,drawCode); if(!resolved?.effectiveEnabled)return;
     const now=clock(); const existing=stateStore.get(now.dateIso,drawCode)||{dateIso:now.dateIso,state:STATES.WAITING_TIME}; if(terminal(existing.state))return;
     if(!VL.shouldAttemptDraw({clock:now,drawTime:resolved.time,state:existing,policy:resolved.retryPolicy}))return;
     const guard=`${now.dateIso}|${drawCode}`; if(inFlight.has(guard))return; inFlight.add(guard);
     const drawMin=VL.parseTimeToMinute(resolved.time), elapsed=now.minuteOfDay-drawMin;
     try{
       stateStore.patch(now.dateIso,drawCode,{state:STATES.SEARCHING_SOURCE,lastError:''});
       const source=sourceAdapters[resolved.lottery.source]; if(!source)throw new Error(`SOURCE_NOT_FOUND:${resolved.lottery.source}`);
       let result; try{result=await source.fetchResult({draw:resolved.draw,dateUs:now.dateUs,timezone:'America/Santo_Domingo'})}catch(e){stateStore.patch(now.dateIso,drawCode,{state:STATES.ERROR,lastAttemptElapsedMin:elapsed,lastError:String(e?.message||e)});return}
       if(!result||result.pending){stateStore.patch(now.dateIso,drawCode,{state:STATES.WAITING_TIME,lastAttemptElapsedMin:elapsed,lastError:''});return}
       if(!validResult(result)){stateStore.patch(now.dateIso,drawCode,{state:STATES.ERROR,lastAttemptElapsedMin:elapsed,lastError:'INVALID_SOURCE_RESULT'});return}
       if(!settingsStore.resolve(lotteryId,drawCode)?.effectiveEnabled){stateStore.patch(now.dateIso,drawCode,{state:STATES.RESULT_READY,result,sourceSeenAt:Date.now()});return}
       stateStore.patch(now.dateIso,drawCode,{state:STATES.RESULT_READY,result,sourceSeenAt:Date.now()});
       stateStore.patch(now.dateIso,drawCode,{state:STATES.CHECKING_ROVER});
       const snap=await roverReader.read({dateUs:now.dateUs,drawCode,result});
       if(!snap.found){stateStore.patch(now.dateIso,drawCode,{state:STATES.ERROR,lastAttemptElapsedMin:elapsed,lastError:'ROVER_ROW_NOT_FOUND'});return}
       if(snap.processed&&VL.isExactMatch(snap.values,result)){stateStore.patch(now.dateIso,drawCode,{state:STATES.DONE,verifiedAt:Date.now(),lastError:''});return}
       if((snap.processed&&!VL.isExactMatch(snap.values,result))||VL.hasConflict(snap.values,result)){stateStore.patch(now.dateIso,drawCode,{state:STATES.CONFLICT,lastError:'ROVER_CONFLICT'});return}
       if(snap.duplicates?.length){stateStore.patch(now.dateIso,drawCode,{state:STATES.DUPLICATE,lastError:'ROVER_DUPLICATE'});return}
       if(!settingsStore.resolve(lotteryId,drawCode)?.effectiveEnabled){stateStore.patch(now.dateIso,drawCode,{state:STATES.RESULT_READY});return}
       stateStore.patch(now.dateIso,drawCode,{state:STATES.PROCESSING,processSentAt:Date.now()});
       let processError=null; try{await roverProcessor.process({dateIso:now.dateIso,rawCode:snap.rawCode,result})}catch(e){processError=e}
       stateStore.patch(now.dateIso,drawCode,{state:STATES.VERIFYING,lastError:processError?String(processError?.message||processError):''});
       let v; try{v=await verifier({reader:roverReader,dateUs:now.dateUs,drawCode,result})}catch(e){v={state:STATES.PROCESS_UNCERTAIN};}
       if(v.state===STATES.DONE)stateStore.patch(now.dateIso,drawCode,{state:STATES.DONE,verifiedAt:Date.now(),lastError:''});
       else if(v.state===STATES.CONFLICT)stateStore.patch(now.dateIso,drawCode,{state:STATES.CONFLICT,lastError:'ROVER_CONFLICT_AFTER_PROCESS'});
       else stateStore.patch(now.dateIso,drawCode,{state:STATES.PROCESS_UNCERTAIN,lastError:processError?String(processError?.message||processError):'VERIFY_TIMEOUT'});
     }finally{inFlight.delete(guard)}
   }
   async function tick(){if(!started&&timer===null){/* manual tick allowed */}for(const lotteryId of Object.keys(registry)){const l=registry[lotteryId];if(!l.automationSupported)continue;for(const code of Object.keys(l.draws))await evaluateDraw(lotteryId,code)}}
   function start(){if(started)return;started=true;tick().catch(e=>logger.error?.(e));timer=setIntervalFn(()=>tick().catch(e=>logger.error?.(e)),tickMs);logger.log?.('engine active')}
   function stop(){started=false;if(timer!==null){clearIntervalFn(timer);timer=null}}
   function onSettingsChanged(){if(started)tick().catch(e=>logger.error?.(e))}
   return{start,stop,tick,evaluateDraw,onSettingsChanged,states:STATES};
 }
 Object.assign(VL,{AUTO_STATES:STATES,isValidAutoResult:validResult,createAutoEngine});
})(globalThis.__VL__ ||= {});


(function bootstrapVirtualLottery(VL){'use strict';
 if(location.hostname==='www.lotterypost.com'){VL.handleExtraTab();return}
 if(!/^(www\.)?roversport\.(lol|net)$/.test(location.hostname))return;
 const style=document.createElement('style');style.id='vl-styles';style.textContent=VL.UI_CSS;if(!document.querySelector('#vl-styles'))document.head.appendChild(style);
 const storage=VL.createGMStorage(),settingsStore=VL.createSettingsStore(storage,VL.LOTTERY_REGISTRY),stateStore=VL.createStateStore(storage,{retentionDays:7});const now=VL.createRDClock();stateStore.migrateLegacyBrazil(now.dateIso,Object.keys(VL.LOTTERY_REGISTRY.brazil.draws));stateStore.gc(now.dateIso);
 const sources=VL.createSourceAdapters(),reader=VL.createRoverReader(),processor=VL.createRoverProcessor(),logger=VL.createLogger('[AUTO]');const engine=VL.createAutoEngine({registry:VL.LOTTERY_REGISTRY,settingsStore,stateStore,sourceAdapters:sources,roverReader:reader,roverProcessor:processor,verifier:VL.verifyProcessed,logger});
 const manual=VL.createManualController({root:document,registry:VL.LOTTERY_REGISTRY,sourceAdapters:sources});
 const ensure=()=>{manual.installButtons();manual.installDateListener();VL.ensureToolbar({root:document,settingsStore,stateStore,registry:VL.LOTTERY_REGISTRY,onSettingsChanged:()=>engine.onSettingsChanged()})};ensure();engine.start();
 const observer=new MutationObserver(()=>manual.scheduleReinjection(ensure));observer.observe(document.documentElement,{childList:true,subtree:true});
})(globalThis.__VL__ ||= {});

