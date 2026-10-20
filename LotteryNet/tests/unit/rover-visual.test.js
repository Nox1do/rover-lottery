
import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleRoverDate,parseRoverDate,primaryRoverName,findUniqueRoverRow} from '../../src/rover/rows.js';
import {fillVisualInputs,planVisualFill} from '../../src/rover/fill-ui.js';
import {createVisualCache,restoreVisibleValues} from '../../src/rover/restore.js';

const draw={id:'fl-am',roverLabel:'FLORIDA AM'};
const fields=['primera','segunda','tercera','pick3','pick4'];
function fixture(values=['','','','','']){
  const inputs=fields.map((name,i)=>({name,value:values[i],readOnly:false,disabled:false,
    getAttribute:key=>key==='loteria'?'111':null,
    hasAttribute:key=>key==='loteria'}));
  const label={textContent:'FLORIDA AM'};
  const abbreviation={nodeType:1,textContent:'FL-AM',matches:s=>s==='.loteria-abrev',querySelector:()=>null};
  const cell={childNodes:[{nodeType:3,textContent:label.textContent},abbreviation],
    querySelector:s=>s==='.loteria-abrev'?abbreviation:null};
  const row={querySelector:sel=>sel==='td'?cell:sel==='.loteria-abrev'?abbreviation:null,
    querySelectorAll:sel=>inputs.filter(i=>sel==='input[name="'+i.name+'"]')};
  const table={querySelectorAll:sel=>sel==='tbody tr'?[row]:[]};
  let date='10/19/2026',inputEvents=0;
  const root={
    querySelector:sel=>sel==='#fecha'?{value:date}:sel==='#tableResult'?table:
      sel==='#tableResult input[name="primera"][loteria]'?inputs[0]:null
  };
  return {root,row,inputs,setDate:x=>{date=x;},getEvents:()=>inputEvents};
}
test('fecha visible ISO estricto',()=>{
  const f=fixture();
  assert.equal(visibleRoverDate(f.root),'2026-10-19');
  f.setDate('02/30/2026');assert.equal(visibleRoverDate(f.root),null);
});
test('cinco campos completos sin eventos ni POST',()=>{
  const f=fixture();
  const result=fillVisualInputs({root:f.root,draw,date:'2026-10-19',p3:'407',p4:'0832'});
  assert.equal(result.status,'COMPLETADO');
  assert.equal(result.written,5);
  assert.deepEqual(f.inputs.map(x=>x.value),['07','08','32','407','0832']);
  assert.equal(f.getEvents(),0);
  assert.equal(fillVisualInputs({root:f.root,draw,date:'2026-10-19',p3:'407',p4:'0832'}).status,'COINCIDENTE');
});
test('conflicto provoca cero escrituras',()=>{
  const f=fixture(['','','99','','']);
  const result=fillVisualInputs({root:f.root,draw,date:'2026-10-19',p3:'407',p4:'0832'});
  assert.equal(result.status,'CONFLICTO');
  assert.deepEqual(f.inputs.map(x=>x.value),['','','99','','']);
});
test('fecha equivocada, resultados parciales y cifrado con cero',()=>{
  const f=fixture();
  assert.equal(fillVisualInputs({root:f.root,draw,date:'2026-10-18',p3:'007'}).status,'CONFLICTO');
  assert.equal(fillVisualInputs({root:f.root,draw,date:'2026-10-19',p3:'007'}).status,'PARCIAL');
  assert.deepEqual(f.inputs.map(x=>x.value),['07','','','007','']);
});
test('caché visual conserva parciales sin cruzar fecha',()=>{
  const f=fixture(),cache=createVisualCache();
  assert.equal(cache.remember({draw,date:'2026-10-19',p3:'407'}),true);
  assert.equal(cache.remember({draw,date:'2026-10-19',p4:'0832'}),true);
  assert.equal(cache.remember({draw,date:'2026-10-19',p3:'999'}),false);
  assert.deepEqual(cache.get({draw,date:'2026-10-19'}),{p3:'407',p4:'0832'});
  const restored=restoreVisibleValues({root:f.root,draw,date:'2026-10-19',cache});
  assert.equal(restored.status,'COMPLETADO');
  f.setDate('10/18/2026');
  assert.equal(restoreVisibleValues({root:f.root,draw,date:'2026-10-19',cache}).status,'CONFLICTO');
});
test('identidad inequívoca obligatoria',()=>{
  const f=fixture();assert.equal(findUniqueRoverRow({root:f.root,draw,date:'2026-10-19'}).ok,true);
  assert.equal(findUniqueRoverRow({root:f.root,draw:{id:'x',roverLabel:'OHIO MIDDAY'},date:'2026-10-19'}).status,'SIN_FILA');
});

test('Rover: formatos documentados de fecha sin elegir el reloj de hoy',()=>{
 const cases=[
  ['2026-10-19','2026-10-19'],
  ['2026/10/19','2026-10-19'],
  ['10/19/2026','2026-10-19'],
  ['10-19-2026','2026-10-19'],
  ['19/10/2026','2026-10-19'],
  ['02/03/2026','2026-02-03'],
  ['2026-02-30',null],['31/02/2026',null],['',null],
  ['today',null],['2026-10-19T05:00:00',null]
 ];
 for(const [raw,wanted] of cases)assert.equal(parseRoverDate(raw),wanted,raw);
});
test('fallar cerradamente ante fechas discrepantes; soportar #fecha_desde',()=>{
 const a={value:'10/19/2026'},b={value:'2026-10-19'};
 const values={
  '#fecha':a,
  'input[name="fecha"]':a,
  '#fecha_desde':b
 };
 const root={querySelector:sel=>values[sel]??null};
 assert.equal(visibleRoverDate(root),'2026-10-19');
 b.value='2026-10-20';
 assert.equal(visibleRoverDate(root),null);
 a.value='';
 assert.equal(visibleRoverDate(root),'2026-10-20');
 delete values['#fecha'];delete values['input[name="fecha"]'];
 assert.equal(visibleRoverDate(root),'2026-10-20');
 b.value='not a date';
 assert.equal(visibleRoverDate(root),null);
});

test('el nombre principal identifica sorteo; el distintivo de código NO se confunde con nombre',()=>{
  const cell={
    childNodes:[
      {nodeType:3,textContent:'FLORIDA PM '},
      {nodeType:1,textContent:'FL-PM',matches:s=>s==='.loteria-abrev',querySelector:()=>null}
    ],querySelector:s=>s==='.loteria-abrev'?{textContent:'FL-PM'}:null
  };
  assert.equal(primaryRoverName(cell),'FLORIDAPM');
  cell.childNodes.push({nodeType:1,textContent:'Casillas completadas',
    matches:selector=>selector.includes('[data-lnr-inline]'),querySelector:()=>null});
  assert.equal(primaryRoverName(cell),'FLORIDAPM'); // Own status must not alter identity
  assert.notEqual(primaryRoverName(cell),'FLPM');
  const derived={childNodes:[{nodeType:3,textContent:'FLORIDA PM MARIAGE PALE'}]};
  assert.equal(primaryRoverName(derived),'FLORIDAPMMARIAGEPALE');
  assert.notEqual(primaryRoverName(derived),'FLORIDAPM');
  const mixed={childNodes:[{nodeType:3,textContent:'FLORIDA PM'},{nodeType:3,textContent:'OTRO SORTEO'}]};
  assert.notEqual(primaryRoverName(mixed),'FLORIDAPM'); // unrelated text must not match the approved identity
  const text = value => ({nodeType:3,textContent:value});
  const element = (tag,children=[],isBadge=false) => ({
    nodeType:1,tagName:tag,childNodes:children,
    matches:selector=>isBadge && selector.includes('.loteria-abrev'),
    querySelector:()=>null
  });
  const nested=element('TD',[element('DIV',[
    element('STRONG',[text('FLORIDA')]),text(' '),
    element('B',[text('AM')]),
    element('SPAN',[text('FL-AM')],true)
  ])]);
  assert.equal(primaryRoverName(nested),'FLORIDAAM');
  const deep=element('TD',[element('DIV',[
    element('B',[text('FLORIDA AM')]),
    element('SPAN',[text('FL-AM')],true),
    element('SPAN',[text('Casillas completadas')],false)
  ])]);
  // An unknown unlabeled inline element must not silently be interpreted
  // as a verified draw name.
  assert.notEqual(primaryRoverName(deep),'FLORIDAAM');
  deep.childNodes[0].childNodes[2].matches=selector=>selector.includes('[data-lnr-inline]');
  assert.equal(primaryRoverName(deep),'FLORIDAAM');
});
