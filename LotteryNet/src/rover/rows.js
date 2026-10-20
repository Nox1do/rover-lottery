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

/**
 * Choose the main draw name from the first table cell, never from its abbreviated
 * badge alone. Main text and code appear separately in real Rover accessibility.
 * Exact equality deliberately excludes derivative lotteries such as "FLORIDA PM
 * MARIAGE PALE" when the target is "FLORIDA PM".
 */
export function primaryRoverName(cell) {
  if (!cell) return null;
  const names=[];
  if (cell.childNodes) {
    for (const node of Array.from(cell.childNodes)) {
      // Node.TEXT_NODE (3) is available in both browsers and test doubles.
      if (node.nodeType===3) {
        if (String(node.textContent??'').trim()) names.push(String(node.textContent).trim());
        continue;
      }
      if (node.nodeType!==1) continue;
      // Only leaf/simple elements: avoid reading the entire cell through nested
      // badge, action, and icon text, which can create false positives.
      if (node.matches?.('button,a,input,select,textarea,[role="button"],[role="status"],[data-lnr-inline]')) continue;
      if (node.querySelector?.('button,a,input,select,textarea,[role="button"]')) continue;
      if (node.matches?.('.loteria-abrev')) continue;
      const value=String(node.textContent??'').trim();
      if (value) names.push(value);
    }
  }
  // A simple one-label cell in fixtures or an alternative Rover layout.
  if (!names.length) {
    const badge=cell.querySelector?.('.loteria-abrev');
    const own=String(badge?.textContent??'').trim();
    if (own) names.push(own);
  }
  const unique=[...new Set(names.map(norm).filter(Boolean))];
  return unique.length===1 ? unique[0] : null;
}

/**
 * Identity gate: one named row, one date, five uniquely named inputs, and a
 * consistent per-row lottery code. Never assume a row's badge equals its title.
 */
export function findUniqueRoverRow({root,draw,date}={}) {
  if (!root?.querySelector || !draw?.roverLabel || !draw?.id || !date)
    return {ok:false,status:'SIN_FILA',reason:'Identidad/DOM incompletos'};
  if (visibleRoverDate(root)!==date)
    return {ok:false,status:'CONFLICTO',reason:'Fecha visible distinta'};
  const table=root.querySelector('#tableResult');
  if (!table) return {ok:false,status:'SIN_FILA',reason:'Tabla de loterías sin identificar'};
  // tr.res_tr is not yet confirmed in the real authenticated DOM. Using every
  // tbody tr is safe here because the exact identity and all five inputs are
  // subsequently required.
  const candidates=Array.from(table.querySelectorAll('tbody tr')).filter(tr=>{
    const cell=tr.querySelector('td');
    return primaryRoverName(cell)===norm(draw.roverLabel);
  });
  if (candidates.length!==1)
    return {ok:false,status:'SIN_FILA',reason:candidates.length?'Fila ambigua o duplicada':'Fila no encontrada'};
  const row=candidates[0];
  const fields=FIELD_NAMES.map(name=>{
    const list=Array.from(row.querySelectorAll('input[name="'+name+'"]'));
    return list.length===1?list[0]:null;
  });
  if (fields.some(x=>!x) || new Set(fields).size!==5)
    return {ok:false,status:'SIN_FILA',reason:'Cinco campos no inequívocos'};
  const code=String(fields[0].getAttribute('loteria')??'').trim();
  if (!code || fields.some(x=>x.hasAttribute('loteria') && String(x.getAttribute('loteria')).trim()!==code))
    return {ok:false,status:'CONFLICTO',reason:'Código de lotería ausente o inconsistente'};
  return {ok:true,row,fields,code,label:row.querySelector('td')};
}
