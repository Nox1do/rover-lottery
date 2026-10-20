// GET exclusivo de Lottery.net. No importado por la entrada inactiva.
export function getLotteryNetHtml(url){
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||parsed.hostname!=='www.lottery.net'||!/^\/[a-z-]+\/[a-z0-9-]+\/numbers\/?$/.test(parsed.pathname))
  return Promise.reject(new Error('URL no autorizada'));
 if(typeof GM_xmlhttpRequest!=='function')return Promise.reject(new Error('Tampermonkey no disponible'));
 return new Promise((resolve,reject)=>GM_xmlhttpRequest({
  method:'GET',url:parsed.href,timeout:15000,
  onload:r=>r.status===200&&typeof r.responseText==='string'?resolve(r.responseText):reject(new Error('HTTP '+r.status)),
  onerror:()=>reject(new Error('Error de red')),ontimeout:()=>reject(new Error('Timeout')),
  onabort:()=>reject(new Error('Abort'))
 }));
}
