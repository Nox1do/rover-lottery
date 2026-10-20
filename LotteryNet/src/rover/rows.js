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

/** Rover HTML 2026-10-19: first td hidden (time), second td draw name. */
export function identifyRoverHeading(row) {
 if(!row?.querySelectorAll)return null;
 const names=Array.from(row.querySelectorAll('td .loteria-nombre'));
 if(names.length!==1)return null;
 const cell=names[0].closest?.('td');
 if(!cell||cell.closest?.('tr')!==row)return null;
 const badges=Array.from(cell.querySelectorAll('.loteria-abrev'));
 if(badges.length!==1)return null;
 const label=norm(names[0].textContent);
 const code=String(badges[0].textContent??'').trim();
 return label&&code?{label,code,cell}:null;
}
export function primaryRoverName(cell) {
 if(!cell?.querySelectorAll)return null;
 const titles=Array.from(cell.querySelectorAll('.loteria-nombre'));
 return titles.length===1?norm(titles[0].textContent)||null:null;
}
/** Exact approved name, badge code, date and all five input codes. */
export function findUniqueRoverRow({root,draw,date}={}){
 if(!root?.querySelector||!draw?.id||!draw?.roverLabel||!draw?.roverCode||!date)
   return {ok:false,status:'SIN_FILA',reason:'Identidad/DOM incompletos'};
 if(visibleRoverDate(root)!==date)
   return {ok:false,status:'CONFLICTO',reason:'Fecha visible distinta'};
 const table=root.querySelector('#tableResult');
 if(!table)return {ok:false,status:'SIN_FILA',reason:'Tabla no encontrada'};
 const matches=Array.from(table.querySelectorAll('tbody tr')).map(row=>({row,heading:identifyRoverHeading(row)}))
   .filter(x=>x.heading?.label===norm(draw.roverLabel));
 if(matches.length!==1)
   return {ok:false,status:'SIN_FILA',reason:matches.length?'Fila duplicada':'Fila no encontrada'};
 const {row,heading}=matches[0];
 if(heading.code!==draw.roverCode)
   return {ok:false,status:'CONFLICTO',reason:'Código abreviado inconsistente'};
 const fields=FIELD_NAMES.map(name=>{
   const found=Array.from(row.querySelectorAll('input[name="'+name+'"]'));
   return found.length===1?found[0]:null;
 });
 if(fields.some(x=>!x)||new Set(fields).size!==5)
   return {ok:false,status:'SIN_FILA',reason:'Cinco inputs no inequívocos'};
 if(fields.some(x=>x.getAttribute('loteria')!==draw.roverCode))
   return {ok:false,status:'CONFLICTO',reason:'Atributos loteria contradictorios'};
 return {ok:true,row,fields,code:draw.roverCode,label:heading.cell};
}
