// ==UserScript==
// @name         LotteryNet — Auditoría DOM de Rover (SOLO LECTURA)
// @namespace    noeg.lotterynet.rover.qa
// @version      0.1.0
// @description  Inspección estructural de filas de loterías sin modificar valores ni consultar la red.
// @match        https://www.roversport.net/adm/es/lottery.php*
// @match        https://roversport.net/adm/es/lottery.php*
// @match        https://www.roversport.lol/adm/es/lottery.php*
// @match        https://roversport.lol/adm/es/lottery.php*
// @grant        none
// @noframes
// @run-at       document-idle
// ==/UserScript==
/* Test aid; not part of the production userscript. No events, no network, no result values. */
(() => {
  'use strict';
  const expected = Object.freeze([
    'FLORIDA AM','FLORIDA PM','LOUISIANA EVENING',
    'OHIO MIDDAY','OHIO EVENING',
    'TENNESSEE MORNING','TENNESSEE MIDDAY','TENNESSEE EVENING',
    'INDIANA MIDDAY','INDIANA EVENING'
  ]);
  const selectors = ['#fecha','input[name="fecha"]','#fecha_desde','input[name="fecha_desde"]',
    'input[name="date"]','input[type="date"]'];
  const normalize = v => String(v ?? '').normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toUpperCase();
  const key = v => {
    const raw=String(v??'').trim();
    let y,m,d;
    let match=raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if(match){y=+match[1];m=+match[2];d=+match[3];}
    else{
      match=raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if(!match)return null;
      y=+match[3];m=+match[1]>12?+match[2]:+match[1];
      d=+match[1]>12?+match[1]:+match[2];
    }
    const date=new Date(Date.UTC(y,m-1,d));
    return date.getUTCFullYear()===y&&date.getUTCMonth()+1===m&&date.getUTCDate()===d?
      String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'):null;
  };
  const summary = () => {
    const dateControls=selectors.map(selector=>{
      const el=document.querySelector(selector);
      if(!el)return {selector,present:false};
      const v=String(el.value??'');
      return {selector,present:true,empty:!v.trim(),valid:!!key(v),date:key(v)};
    });
    const matchedTables=Array.from(document.querySelectorAll('table'))
      .filter(t=>t.querySelector('input[name="primera"]') && t.querySelector('input[name="pick4"]'));
    const primaryTable=document.querySelector('#tableResult');
    const table=primaryTable ?? (matchedTables.length===1 ? matchedTables[0] : null);
    const rows=Array.from(table?.querySelectorAll('tbody tr')??[]);
    const candidates=rows.map((row,index)=>{
      const cell=row.querySelector('td');
      const label=row.querySelector('.loteria-abrev')?.textContent?.trim() ?? null;
      // The real Rover accessibility tree exposes a primary draw name followed
      // by a separate abbreviated code; never equate the code to the name.
      const mainCandidates=Array.from(cell?.childNodes ?? [])
        .filter(n=>n.nodeType===3 || (n.nodeType===1 && !n.matches?.('a,button,input,select,textarea,.loteria-abrev')))
        .map(n=>String(n.textContent??'').trim()).filter(Boolean);
      const target=expected.find(x=>mainCandidates.some(n=>normalize(n)===normalize(x))
        || (mainCandidates.length===0 && normalize(label)===normalize(x)));
      if(!target)return null;
      const inputs=Array.from(row.querySelectorAll('input')).map(el=>({
        name:el.getAttribute('name'),type:el.getAttribute('type'),hasLoteria:el.hasAttribute('loteria'),
        disabled:el.disabled,readOnly:el.readOnly
      }));
      return {index,target,shortCodePresent:!!label,mainNameFound:mainCandidates.some(n=>normalize(n)===normalize(target)),
        resTr:row.classList.contains('res_tr'),inputs};
    }).filter(Boolean);
    const missing=expected.filter(x=>!candidates.some(c=>c.target===x));
    const duplicate=expected.filter(x=>candidates.filter(c=>c.target===x).length>1);
    return {audit:'LotteryNet DOM (read-only)',dateControls,tableFound:!!table,tableResultSelectorFound:!!primaryTable,
      tableRows:rows.length,candidates,missing,duplicate};
  };
  const api=Object.freeze({
    snapshot:summary,
    print(){
      const data=summary();
      console.info('[LotteryNet DOM audit] Read-only — no result values collected.');
      console.table(data.dateControls);
      console.table(data.candidates.map(({target,mainNameFound,shortCodePresent,resTr,inputs})=>({
        target,mainNameFound,shortCodePresent,resTr,fields:inputs.map(x=>x.name).join(','),
        loteriaAttrs:inputs.filter(x=>x.hasLoteria).length
      })));
      console.info('Missing',data.missing,'Duplicates',data.duplicate);
      return data;
    }
  });
  Object.defineProperty(window,'__LOTTERYNET_DOM_AUDIT__',{
    configurable:true,enumerable:false,writable:false,value:api
  });
  console.info('[LotteryNet DOM audit] Solo lectura. Ejecuta __LOTTERYNET_DOM_AUDIT__.print() tras Search.');
})();
