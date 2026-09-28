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
