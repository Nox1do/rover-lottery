(function(VL){'use strict';
 function createRoverProcessor({fetchFn=fetch}={}){return{async process({dateIso,rawCode,result}){const response=await fetchFn('__inc/procesarResultados.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},body:new URLSearchParams({fecha:dateIso,loteria:rawCode,primera:result.primera,segunda:result.segunda,tercera:result.tercera,pick3:result.pick3,pick4:result.pick4}).toString()});const text=await response.text();if(!response.ok)throw new Error(`Rover HTTP ${response.status} en __inc/procesarResultados.php`);return{httpOk:true,text}}}}
 VL.createRoverProcessor=createRoverProcessor;
})(globalThis.__VL__ ||= {});
