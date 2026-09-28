(function(VL){'use strict';
 function requestText(url,headers={'Cache-Control':'no-cache'}){return new Promise((resolve,reject)=>{GM_xmlhttpRequest({method:'GET',url,headers,timeout:15000,onload:r=>r.status>=200&&r.status<300?resolve(r.responseText??r.response??''):reject(new Error(`HTTP ${r.status} en ${url}`)),onerror:()=>reject(new Error(`Error de red consultando ${url}`)),ontimeout:()=>reject(new Error(`Timeout consultando ${url}`))})})}
 VL.requestText=requestText;
})(globalThis.__VL__ ||= {});
