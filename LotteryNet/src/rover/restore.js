
import {mapRoverFields} from './mapping.js';
import {fillVisualInputs} from './fill-ui.js';
import {visibleRoverDate} from './rows.js';
/** Browser page-memory only. Never persists to Rover or another script. */
export function createVisualCache(){
  const values=new Map();
  const key=(draw,date)=>draw?.id+'|'+date;
  const validDate=date=>{
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
    const [y,m,d]=date.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));
    return dt.getUTCFullYear()===y&&dt.getUTCMonth()+1===m&&dt.getUTCDate()===d;
  };
  return {
    remember({draw,date,p3=null,p4=null}={}){
      if(!draw?.id||!validDate(date))throw new TypeError('Identidad/fecha inválida');
      if(p3===null&&p4===null)return false;
      mapRoverFields({p3,p4});
      const k=key(draw,date),old=values.get(k);
      if(old && ((old.p3!==null&&p3!==null&&old.p3!==p3) ||
                 (old.p4!==null&&p4!==null&&old.p4!==p4)))return false;
      values.set(k,{p3:p3??old?.p3??null,p4:p4??old?.p4??null});
      return true;
    },
    get({draw,date}={}){const found=values.get(key(draw,date));return found?{...found}:null;},
    clear(){values.clear();}
  };
}
export function restoreVisibleValues({root,draw,date,cache}={}){
  if(!cache?.get||visibleRoverDate(root)!==date)
    return {ok:false,status:'CONFLICTO',reason:'Fecha o vista diferente'};
  const entry=cache.get({draw,date});
  if(!entry)return {ok:false,status:'PENDIENTE',reason:'Sin caché visible'};
  return fillVisualInputs({root,draw,date,...entry});
}
