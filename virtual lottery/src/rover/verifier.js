(function(VL){'use strict';
 async function verifyProcessed({reader,wait=ms=>new Promise(r=>setTimeout(r,ms)),delays=[700,1200,2500,5000,8000],dateUs,drawCode,result}){for(const delay of delays){await wait(delay);const snap=await reader.read({dateUs,drawCode});if(!snap.found)continue;if(snap.processed&&VL.isExactMatch(snap.values,result))return{state:'DONE',snapshot:snap};if((snap.processed&&!VL.isExactMatch(snap.values,result))||VL.hasConflict(snap.values,result))return{state:'CONFLICT',snapshot:snap}}return{state:'PROCESS_UNCERTAIN'}}
 VL.verifyProcessed=verifyProcessed;
})(globalThis.__VL__ ||= {});
