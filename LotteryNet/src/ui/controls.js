
import {findUniqueRoverRow} from '../rover/rows.js';

/** UI approved 2026-10-20: inline, linear Lucide icons, exact messages. */
export const UI_STATES=Object.freeze({
  BUSCANDO:Object.freeze({icon:'search',message:'Buscando sorteo',tone:'neutral'}),
  CARGANDO:Object.freeze({icon:'loader-circle',message:'Consultando',tone:'info'}),
  COMPLETADO:Object.freeze({icon:'circle-check',message:'Casillas completadas',tone:'success'}),
  ERROR:Object.freeze({icon:'circle-alert',message:'Error al consultar o llenar',tone:'error'}),
  PENDIENTE:Object.freeze({icon:'clock-3',message:'Resultado aún no disponible',tone:'neutral'}),
  PARCIAL:Object.freeze({icon:'circle-dot',message:'Resultado parcialmente disponible',tone:'warning'}),
  COINCIDENTE:Object.freeze({icon:'check-check',message:'Los valores ya coinciden',tone:'success'}),
  CONFLICTO:Object.freeze({icon:'triangle-alert',message:'Los valores existentes son diferentes',tone:'warning'}),
  SIN_FILA:Object.freeze({icon:'search-x',message:'No se encontró la fila correspondiente',tone:'error'})
});
const shapes={
 search:[['circle',{cx:11,cy:11,r:8}],['path',{d:'m21 21-4.35-4.35'}]],
 'loader-circle':[['path',{d:'M21 12a9 9 0 1 1-6.219-8.56'}]],
 'circle-check':[['circle',{cx:12,cy:12,r:10}],['path',{d:'m9 12 2 2 4-4'}]],
 'circle-alert':[['circle',{cx:12,cy:12,r:10}],['path',{d:'M12 8v4'}],['path',{d:'M12 16h.01'}]],
 'clock-3':[['circle',{cx:12,cy:12,r:10}],['path',{d:'M12 6v6l4 2'}]],
 'circle-dot':[['circle',{cx:12,cy:12,r:10}],['circle',{cx:12,cy:12,r:1}]],
 'check-check':[['path',{d:'m18 6 4 4-7 7-4-4'}],['path',{d:'m9 6 4 4-7 7-4-4'}]],
 'triangle-alert':[['path',{d:'m10.29 3.86-8.47 14.14A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'}],['path',{d:'M12 9v4'}],['path',{d:'M12 17h.01'}]],
 'search-x':[['circle',{cx:11,cy:11,r:8}],['path',{d:'m8 8 6 6m0-6-6 6m13 7-4.35-4.35'}]]
};
const namespace='http://www.w3.org/2000/svg';
function createIcon(doc,name){
  const svg=doc.createElementNS(namespace,'svg');
  const attrs={viewBox:'0 0 24 24',width:15,height:15,fill:'none',stroke:'currentColor',
    'stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'};
  for(const [key,val] of Object.entries(attrs))svg.setAttribute(key,String(val));
  for(const [tag,attributes] of shapes[name]){
    const el=doc.createElementNS(namespace,tag);
    for(const [key,val] of Object.entries(attributes))el.setAttribute(key,String(val));
    svg.appendChild(el);
  }
  svg.setAttribute('class','lnr-inline-icon');
  return svg;
}
function installStyles(doc){
  if(doc.querySelector('#lnr-inline-styles'))return;
  const style=doc.createElement('style');
  style.id='lnr-inline-styles';
  style.textContent=[
    '.lnr-inline-state{display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap;vertical-align:middle;margin-inline-start:6px;max-width:100%;font-size:11px;font-weight:600;line-height:1.35;color:inherit}',
    '.lnr-inline-state .lnr-inline-icon{display:block;flex-shrink:0}',
    '.lnr-inline-state[data-tone="info"]{color:var(--bs-info-text-emphasis,inherit)}',
    '.lnr-inline-state[data-tone="success"]{color:var(--bs-success-text-emphasis,inherit)}',
    '.lnr-inline-state[data-tone="warning"]{color:var(--bs-warning-text-emphasis,inherit)}',
    '.lnr-inline-state[data-tone="error"]{color:var(--bs-danger-text-emphasis,inherit)}',
    '.lnr-inline-state[data-state="CARGANDO"] .lnr-inline-icon{animation:lnr-spin 1s linear infinite}',
    '@keyframes lnr-spin{to{transform:rotate(360deg)}}',
    '@media(prefers-reduced-motion:reduce){.lnr-inline-state[data-state="CARGANDO"] .lnr-inline-icon{animation:none}}'
  ].join('\n');
  doc.head?.appendChild(style);
}
/** Renders only an SVG icon and literal span text; never executable HTML. */
export function setInlineStatus(indicator,state) {
  const config=UI_STATES[state];
  if(!config||!indicator?.ownerDocument)throw new TypeError('Estado/indicador inválido');
  const text=indicator.ownerDocument.createElement('span');
  text.textContent=config.message;
  indicator.replaceChildren(createIcon(indicator.ownerDocument,config.icon),text);
  indicator.dataset.state=state;
  indicator.dataset.tone=config.tone;
  indicator.title=config.message;
  return indicator;
}
/** Attach one indicator to the exact row. Does not add the Phase 3 refresh button. */
export function mountInlineStatus({root,draw,date,state='PENDIENTE'}={}) {
  if(!UI_STATES[state])throw new TypeError('Estado desconocido');
  const found=findUniqueRoverRow({root,draw,date});
  if(!found.ok)return found;
  const doc=found.row.ownerDocument;
  if(!doc?.createElement||!doc?.createElementNS)
    return {ok:false,status:'ERROR',reason:'DOM no soportado'};
  installStyles(doc);
  const previous=Array.from(found.row.querySelectorAll('[data-lnr-inline]'))
    .filter(item=>item.dataset.lnrInline===draw.id);
  let indicator=previous[0];
  for(const item of previous.slice(1))item.remove();
  if(!indicator){
    indicator=doc.createElement('span');
    indicator.className='lnr-inline-state';
    indicator.dataset.lnrInline=draw.id;
    indicator.setAttribute('role','status');
    indicator.setAttribute('aria-live','polite');
    indicator.setAttribute('aria-atomic','true');
    // The primary name is inside the first TD; insert the status inside that
    // same cell. Inserting after the TD would create a spurious table column.
    found.label.insertAdjacentElement('beforeend',indicator);
  }
  setInlineStatus(indicator,state);
  return {ok:true,status:state,element:indicator};
}
/** Manual and AUTO controls are strictly reserved for Phase 3. */
export function mountLotteryNetControls() {
  throw new Error('Fase 3 pendiente: sin botón manual ni AUTO activos');
}
