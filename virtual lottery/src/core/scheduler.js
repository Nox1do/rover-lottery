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
