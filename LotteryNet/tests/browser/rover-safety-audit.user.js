// ==UserScript==
// @name         LotteryNet — Auditoría pasiva de seguridad (SOLO LECTURA)
// @namespace    noeg.lotterynet.rover.qa.safety
// @version      0.1.0
// @description  Inspecciona manejadores inline y cuenta eventos sin enviar datos, escribir ni procesar.
// @match        https://www.roversport.net/adm/es/lottery.php*
// @match        https://roversport.net/adm/es/lottery.php*
// @match        https://www.roversport.lol/adm/es/lottery.php*
// @match        https://roversport.lol/adm/es/lottery.php*
// @grant        none
// @noframes
// @run-at       document-idle
// ==/UserScript==
/*
 * NO cambiar inputs, NO inyectar eventos, NO instrumentar fetch/XHR,
 * NO abrir conexiones, NO leer resultados/credenciales.
 *
 * Importante: no es posible descubrir todos los listeners añadidos con
 * addEventListener desde el DOM. Network requiere DevTools separado.
 */
(() => {
 'use strict';
 const expected = Object.freeze([
  ['FLORIDA AM','FL-AM'],['FLORIDA PM','FL-PM'],
  ['LOUISIANA EVENING','LOUI-EVEN'],['OHIO MIDDAY','OHIO-MD'],
  ['OHIO EVENING','OHIO-EVEN'],
  ['TENNESSEE MORNING','TN-MORNING'],['TENNESSEE MIDDAY','TN-MD'],
  ['TENNESSEE EVENING','TN-EVEN'],
  ['INDIANA MIDDAY','IN-MD'],['INDIANA EVENING','IN-EVEN']
 ]);
 const names=['primera','segunda','tercera','pick3','pick4'];
 const observed={active:false,startedAt:null,counts:{input:0,change:0,blur:0},
  untrusted:0,targets:{}};
 const safeKey=code=>expected.some(([,c])=>c===code)?code:null;
 const snapshot=()=>{
   const table=document.querySelector('#tableResult');
   const rows=Array.from(table?.querySelectorAll('tbody tr')??[]);
   const detail=expected.map(([title,code])=>{
     const found=rows.filter(row=>row.querySelector('.loteria-nombre')?.textContent?.trim()===title);
     if(found.length!==1)return {title,code,rows:found.length,fields:[]};
     const row=found[0],badge=row.querySelector('.loteria-abrev');
     const inputStates=names.map(name=>{
       const list=Array.from(row.querySelectorAll('input[name="'+name+'"]'));
       const input=list.length===1?list[0]:null;
       return {name,count:list.length,
        codeOk:!!input&&input.getAttribute('loteria')===code,
        inlineInput:!!input?.getAttribute('oninput'),
        inlineChange:!!input?.getAttribute('onchange'),
        inlineBlur:!!input?.getAttribute('onblur'),
        propertyInput:typeof input?.oninput==='function',
        propertyChange:typeof input?.onchange==='function',
        propertyBlur:typeof input?.onblur==='function',
        form:!!input?.closest('form')
       };
     });
     return {title,code,rows:1,badgeOk:badge?.textContent?.trim()===code,
       fields:inputStates};
   });
   return {audit:'LotteryNet passive safety inspection',version:'0.1.0',
     dateControlPresent:!!document.querySelector('#fecha'),
     tableFound:!!table,rows:rows.length,details:detail,
     eventObserverActive:observed.active,
     eventCounts:{...observed.counts},untrustedEvents:observed.untrusted,
     eventsByCode:{...observed.targets},
     // addEventListener, observers, userscript sandboxes, and POST method
     // cannot be inferred from markup; don't claim otherwise.
     limitations:['no addEventListener introspection','no network method visibility',
      'no request attribution','no guarantee against custom value setters']
   };
 };
 const onEvent=event=>{
   const input=event.target;
   if(!input?.matches?.('#tableResult input[name][loteria]'))return;
   const code=safeKey(input.getAttribute('loteria'));
   if(!code||!names.includes(input.name))return;
   observed.counts[event.type]=(observed.counts[event.type]??0)+1;
   if(event.isTrusted===false)observed.untrusted++;
   observed.targets[code]=(observed.targets[code]??0)+1;
 };
 const stop=()=>{
   if(observed.active)for(const type of ['input','change','blur'])
     document.removeEventListener(type,onEvent,true);
   observed.active=false;
   return snapshot();
 };
 const api=Object.freeze({
   snapshot,
   print(){
     const data=snapshot();
     console.info('[LotteryNet safety] Solo lectura; NO certifica POST ni listeners delegados');
     console.table(data.details.map(d=>({
       sorteo:d.title,codigo:d.code,filas:d.rows,badge:d.badgeOk,
       campos:d.fields.length,
       codigos:d.fields.filter(f=>f.codeOk).length,
       inline:d.fields.filter(f=>f.inlineInput||f.inlineChange||f.inlineBlur).length,
       propiedades:d.fields.filter(f=>f.propertyInput||f.propertyChange||f.propertyBlur).length,
       forms:d.fields.filter(f=>f.form).length
     })));
     console.info('Eventos observados, no provocados:',data.eventCounts,'no confiables:',data.untrustedEvents);
     console.info('Límites:',data.limitations);
     return data;
   },
   observe(){
     if(observed.active)return {active:true,alreadyRunning:true};
     observed.counts={input:0,change:0,blur:0};
     observed.targets={};
     observed.untrusted=0;
     observed.startedAt=Date.now();
     for(const type of ['input','change','blur'])document.addEventListener(type,onEvent,true);
     observed.active=true;
     return {active:true,message:'Observación pasiva iniciada; no se provocan eventos',stop:'__LOTTERYNET_SAFETY_QA__.stop()'};
   },
   stop
 });
 Object.defineProperty(window,'__LOTTERYNET_SAFETY_QA__',{
   value:api,enumerable:false,writable:false,configurable:true
 });
 console.info('[LotteryNet safety v0.1.0] Auditoría PASIVA disponible; ejecuta __LOTTERYNET_SAFETY_QA__.print()');
})();
