(function(VL){'use strict';
 const FIELDS=['primera','segunda','tercera','pick3','pick4'];
 function normalizeRoverValue(value){const v=String(value??'').trim().toUpperCase();return v==='---'?'':v}
 function hasConflict(values,result){return FIELDS.some(f=>{const a=normalizeRoverValue(values?.[f]);const b=normalizeRoverValue(result?.[f]);return a!==''&&a!==b})}
 function isExactMatch(values,result){return FIELDS.every(f=>normalizeRoverValue(values?.[f])===normalizeRoverValue(result?.[f]))}
 function findDuplicates(rows,drawCode,result){return (rows||[]).filter(r=>r.code&&r.code!==drawCode&&normalizeRoverValue(r.values.primera)===result.primera&&normalizeRoverValue(r.values.segunda)===result.segunda&&normalizeRoverValue(r.values.tercera)===result.tercera).map(r=>({code:r.code,name:r.name||r.code}))}
 Object.assign(VL,{ROVER_FIELDS:FIELDS,normalizeRoverValue,hasConflict,isExactMatch,findDuplicates});
})(globalThis.__VL__ ||= {});
