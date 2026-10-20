
import {mapRoverFields} from './mapping.js';
import {findUniqueRoverRow,visibleRoverDate} from './rows.js';
const empty=x=>String(x??'').trim()===''||String(x).trim()==='---';
/** Planning is read-only. Any conflict stops the entire row, not just a cell. */
export function planVisualFill({root,draw,date,p3=null,p4=null}={}) {
  let expected;
  try { expected=mapRoverFields({p3,p4}); }
  catch(e){return {ok:false,status:'ERROR',reason:e.message};}
  if(expected.every(x=>x===null))return {ok:false,status:'PENDIENTE',reason:'Sin resultados'};
  const identified=findUniqueRoverRow({root,draw,date});
  if(!identified.ok)return identified;
  const changes=[];
  for(let i=0;i<expected.length;i++){
    if(expected[i]===null)continue;
    const f=identified.fields[i],original=String(f.value??'');
    if(f.readOnly||f.disabled)return {ok:false,status:'CONFLICTO',reason:'Campo bloqueado'};
    if(!empty(original)&&original.trim()!==expected[i])
      return {ok:false,status:'CONFLICTO',reason:'Valor existente diferente'};
    if(empty(original))changes.push({input:f,index:i,original,value:expected[i]});
  }
  return {...identified,ok:true,expected,changes,
    status:changes.length===0?'COINCIDENTE':p3!==null&&p4!==null?'COMPLETADO':'PARCIAL'};
}
/** DOM assignment ONLY; never dispatch input/change/blur, click, fetch or POST. */
export function fillVisualInputs(args={}){
  const plan=planVisualFill(args);
  if(!plan.ok)return plan;
  const {root,draw,date}=args;
  const stable=(done=0)=>{
    if(visibleRoverDate(root)!==date)return false;
    const current=findUniqueRoverRow({root,draw,date});
    return current.ok && current.row===plan.row &&
      plan.fields.every((f,i)=>current.fields[i]===f) &&
      plan.changes.every((c,i)=>String(c.input.value??'')===(i<done?c.value:c.original));
  };
  if(!stable())return {ok:false,status:'CONFLICTO',reason:'Fila o valores modificados'};
  let written=0;
  try {
    for(const change of plan.changes) {
      if(!stable(written))throw new Error('Cambio concurrente');
      change.input.value=change.value;
      if(String(change.input.value)!==change.value)throw new Error('Campo no escribible');
      written++;
    }
    return {ok:true,status:plan.status,written,expected:plan.expected};
  }catch(e) {
    for(const c of plan.changes) {
      if(String(c.input.value)===c.value)c.input.value=c.original;
    }
    return {ok:false,status:'ERROR',reason:e.message};
  }
}
