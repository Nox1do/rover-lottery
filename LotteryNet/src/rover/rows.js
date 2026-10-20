export const FIELD_NAMES=Object.freeze(['primera','segunda','tercera','pick3','pick4']);
const norm=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toUpperCase();

const DATE_SELECTORS=Object.freeze([
 '#fecha','input[name="fecha"]','#fecha_desde','input[name="fecha_desde"]',
 'input[name="date"]','input[type="date"]'
]);
/** Pure parse without local-time or "today" fallback; ambiguous slash dates are MM/DD. */
export function parseRoverDate(raw) {
 const value=String(raw??'').trim();
 if(!value)return null;
 let year,month,day;
 let m=value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
 if(m){[,year,month,day]=m.map(Number);}
 else{
  m=value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if(!m)return null;
  const first=Number(m[1]),second=Number(m[2]);
  year=Number(m[3]);
  // Existing Rover USA script treats ambiguous dates as MM/DD/YYYY.
  month=first>12?second:first;
  day=first>12?first:second;
 }
 const d=new Date(Date.UTC(year,month-1,day));
 if(d.getUTCFullYear()!==year||d.getUTCMonth()+1!==month||d.getUTCDate()!==day)return null;
 return String(year).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}
/** All distinct date controls must agree. A missing or invalid date fails closed. */
export function visibleRoverDate(root) {
 if(!root?.querySelector)return null;
 const seen=new Set(),dates=new Set();
 for(const selector of DATE_SELECTORS){
  const node=root.querySelector(selector);
  if(!node||seen.has(node))continue;
  seen.add(node);
  const raw=String(node.value??'').trim();
  if(!raw)continue;
  const parsed=parseRoverDate(raw);
  if(!parsed)return null;
  dates.add(parsed);
 }
 return dates.size===1?[...dates][0]:null;
}

/** Returns exactly one matching row in the correct Rover date. No fuzzy matching. */
export function findUniqueRoverRow({root,draw,date}={}) {
  if(!root?.querySelector||!draw?.roverLabel||!draw?.id||!date)
    return {ok:false,status:'SIN_FILA',reason:'Identidad/DOM incompletos'};
  if(visibleRoverDate(root)!==date)
    return {ok:false,status:'CONFLICTO',reason:'Fecha visible distinta'};
  const table=root.querySelector('#tableResult');
  if(!table||!root.querySelector('#tableResult input[name="primera"][loteria]'))
    return {ok:false,status:'SIN_FILA',reason:'Vista de loterías no encontrada'};
  const candidates=Array.from(table.querySelectorAll('tbody tr.res_tr'))
    .filter(tr=>norm(tr.querySelector('.loteria-abrev')?.textContent)===norm(draw.roverLabel));
  if(candidates.length!==1)
    return {ok:false,status:'SIN_FILA',reason:candidates.length?'Fila duplicada':'Fila no encontrada'};
  const row=candidates[0];
  const fields=FIELD_NAMES.map(name=>{
    const inputs=Array.from(row.querySelectorAll('input[name="'+name+'"]'));
    return inputs.length===1?inputs[0]:null;
  });
  if(fields.some(x=>!x)||new Set(fields).size!==5)
    return {ok:false,status:'SIN_FILA',reason:'Cinco campos no inequívocos'};
  const code=String(fields[0].getAttribute('loteria')??'').trim();
  if(!code || fields.some(x=>x.hasAttribute('loteria')&&String(x.getAttribute('loteria')).trim()!==code))
    return {ok:false,status:'CONFLICTO',reason:'Código de lotería inconsistente'};
  return {ok:true,row,fields,code,label:row.querySelector('.loteria-abrev')};
}
