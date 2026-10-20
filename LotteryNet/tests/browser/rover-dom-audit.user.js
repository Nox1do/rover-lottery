// ==UserScript==
// @name         LotteryNet — Auditoría DOM de Rover (SOLO LECTURA)
// @namespace    noeg.lotterynet.rover.qa
// @version      0.3.0
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
  const codes=Object.freeze({'FLORIDA AM':'FL-AM','FLORIDA PM':'FL-PM','LOUISIANA EVENING':'LOUI-EVEN','OHIO MIDDAY':'OHIO-MD','OHIO EVENING':'OHIO-EVEN','TENNESSEE MORNING':'TN-MORNING','TENNESSEE MIDDAY':'TN-MD','TENNESSEE EVENING':'TN-EVEN','INDIANA MIDDAY':'IN-MD','INDIANA EVENING':'IN-EVEN'});
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
  const mainName = cell => {
    if (!cell) return null;
    const parts = [];
    const excluded = '.loteria-abrev,[data-lnr-inline],.lnr-inline-state,[role="status"],' +
      'a,button,[role="button"],input,select,textarea,script,style,svg,[aria-hidden="true"]';
    const walk = node => {
      if (node.nodeType === 3) {
        const val = String(node.textContent ?? '').trim();
        if (val) parts.push(val);
        return;
      }
      if (node.nodeType !== 1 || node.matches?.(excluded)) return;
      for (const child of Array.from(node.childNodes ?? [])) walk(child);
    };
    for (const child of Array.from(cell.childNodes ?? [])) walk(child);
    return normalize(parts.join(' ')) || null;
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
    const scanned=rows.map((row,index)=>{
      const cell=row.querySelector('td');
      const cleaned=mainName(cell);
      const whole=normalize(cell?.textContent??''); // Only first (lottery name) cell.
      const exact=expected.filter(name=>{
        const n=normalize(name),pair=normalize(name+codes[name]);
        return cleaned===n||cleaned===pair||whole===n||whole===pair;
      });
      const target=exact.length===1?exact[0]:null;
      // Informational ONLY. Never fill from this substring match:
      // FLORIDA AM MARIAGE PALE can look similar to FLORIDA AM.
      const near=expected.filter(name=>whole.includes(normalize(name))&&
        whole.includes(normalize(codes[name])));
      return {row,index,cell,target,cleaned,whole,near,exactCount:exact.length};
    });
    const candidates=scanned.filter(x=>x.target).map(({row,index,cell,target})=>{
      // Inputs are described structurally; .value is never read.
      const inputs=Array.from(row.querySelectorAll('input')).map(el=>({
        name:el.getAttribute('name'),type:el.getAttribute('type'),hasLoteria:el.hasAttribute('loteria'),
        disabled:el.disabled,readOnly:el.readOnly
      }));
      return {index,target,code:codes[target],strategy:
        normalize(cell?.textContent??'')===normalize(target+codes[target])?'exact-name-plus-code':
        mainName(cell)===normalize(target)?'exact-main-name':'exact-composite',
        shortCodePresent:!!cell?.querySelector('.loteria-abrev'),
        mainNameFound:true,resTr:row.classList.contains('res_tr'),inputs};
    });
    const missing=expected.filter(x=>!candidates.some(c=>c.target===x));
    const duplicate=expected.filter(x=>candidates.filter(c=>c.target===x).length>1);
    const nearMatches=scanned.filter(x=>x.near.length&&!x.target).slice(0,35).map(x=>({
      index:x.index,possible:x.near,firstCellTextLength:x.whole.length,
      firstCellTags:x.cell?Array.from(x.cell.querySelectorAll('*')).slice(0,8).map(el=>{
        const names=Array.from(el.classList??[]).slice(0,2).join('.');
        return el.tagName.toLowerCase()+(names?'.'+names:'');
      }).join(' > '):'',badgePresent:!!x.cell?.querySelector('.loteria-abrev')
    }));
    return {audit:'LotteryNet DOM (read-only)',version:'0.3.0',
      dateControls,tableFound:!!table,tableResultSelectorFound:!!primaryTable,
      tableRows:rows.length,matchedRows:candidates.length,
      inspectedRows:scanned.length,rowsWithoutReadableMainName:scanned.filter(x=>!x.cleaned).length,
      candidates,missing,duplicate,nearMatches};
  };
  const api=Object.freeze({
    snapshot:summary,
    print(){
      const data=summary();
      console.info('[LotteryNet DOM audit] Read-only — no result values collected.');
      console.table(data.dateControls);
      console.info('Estructura:', {filas:data.inspectedRows, coincidencias:data.matchedRows,
        sinNombrePrincipal:data.rowsWithoutReadableMainName, tablaIdentificada:data.tableResultSelectorFound});
      console.table(data.candidates.map(({target,mainNameFound,shortCodePresent,resTr,inputs})=>({
        target,mainNameFound,shortCodePresent,resTr,fields:inputs.map(x=>x.name).join(','),
        loteriaAttrs:inputs.filter(x=>x.hasLoteria).length
      })));
      console.table(data.nearMatches);
      console.info('Missing',data.missing,'Duplicates',data.duplicate,
        'Near matches (never filled)',data.nearMatches.length);
      return data;
    }
  });
  Object.defineProperty(window,'__LOTTERYNET_DOM_AUDIT__',{
    configurable:true,enumerable:false,writable:false,value:api
  });
  console.info('[LotteryNet DOM audit v0.3.0] Solo lectura. Ejecuta __LOTTERYNET_DOM_AUDIT__.print() tras Search.');
})();
