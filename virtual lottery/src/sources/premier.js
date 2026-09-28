(function(VL){'use strict';const URL='https://api.lotocentral.net/api/v1/homepage/historical_results';
 const dateUs=d=>{const m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[2]}/${m[3]}/${m[1]}`:''};
 function parsePremier(data){return (Array.isArray(data?.results)?data.results:[]).map(r=>({fecha:dateUs(r.date),horaKey:String(r?.sortition?.abbreviation||'').toUpperCase(),primera:String(r.first??''),segunda:String(r.second??''),tercera:String(r.third??''),pick3:String(r.cashThree??''),pick4:String(r.pickFour??'')})).filter(r=>r.fecha&&r.horaKey)}
 function createPremierSource({request=(u,h)=>VL.requestText(u,h)}={}){return{async fetchResult({draw,dateUs}){const text=await request(URL,{Accept:'application/json',Origin:'https://premierlotto.tv',Referer:'https://premierlotto.tv/','Cache-Control':'no-cache'});let data;try{data=JSON.parse(text)}catch{throw new Error('PremierLotto: respuesta JSON inválida')}const key=String(draw.premierKey||'').toUpperCase();return parsePremier(data).find(r=>r.fecha===dateUs&&r.horaKey===key)||null}}}
 Object.assign(VL,{parsePremier,createPremierSource});
})(globalThis.__VL__ ||= {});
