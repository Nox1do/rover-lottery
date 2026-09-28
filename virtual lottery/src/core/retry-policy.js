(function(VL){'use strict';
 function parseTimeToMinute(time){ if(typeof time!=='string'||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN; const [h,m]=time.split(':').map(Number); return h*60+m; }
 function nextRetryOffset(elapsedMinutes,policy){ const offsets=policy?.offsets||[]; const next=offsets.find(n=>n>elapsedMinutes); return next ?? (elapsedMinutes+(policy?.afterLast||30)); }
 function resolveRetryPolicy(settings,registry,lotteryId,drawCode){ const ls=settings?.lotteries?.[lotteryId]; const ds=ls?.draws?.[drawCode]; return structuredClone(ds?.retryPolicy||ls?.retryPolicy||registry?.[lotteryId]?.retryPolicy||{offsets:[1],afterLast:30}); }
 Object.assign(VL,{parseTimeToMinute,nextRetryOffset,resolveRetryPolicy});
})(globalThis.__VL__ ||= {});
