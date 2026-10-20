
export const FIELD_NAMES=Object.freeze(['primera','segunda','tercera','pick3','pick4']);
const norm=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toUpperCase();
export function visibleRoverDate(root) {
  const raw=String(root?.querySelector?.('#fecha')?.value??'').trim();
  const m=raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!m)return null;
  const [month,day,year]=m.slice(1).map(Number),d=new Date(Date.UTC(year,month-1,day));
  return d.getUTCFullYear()===year&&d.getUTCMonth()+1===month&&d.getUTCDate()===day ? m[3]+'-'+m[1]+'-'+m[2] : null;
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
