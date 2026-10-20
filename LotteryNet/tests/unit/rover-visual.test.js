
import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleRoverDate,parseRoverDate,primaryRoverName,findUniqueRoverRow} from '../../src/rover/rows.js';
import {fillVisualInputs,planVisualFill} from '../../src/rover/fill-ui.js';
import {createVisualCache,restoreVisibleValues} from '../../src/rover/restore.js';

const draw={id:'fl-am',roverLabel:'FLORIDA AM',roverCode:'FL-AM'};
const fields=['primera','segunda','tercera','pick3','pick4'];
function fixture(values=['','','','','']){
  const inputs=fields.map((name,i)=>({name,value:values[i],readOnly:false,disabled:false,
    getAttribute:key=>key==='loteria'?'FL-AM':null,
    hasAttribute:key=>key==='loteria'}));
  const name={textContent:'FLORIDA AM'},badge={textContent:'FL-AM'};
  const row={querySelectorAll:sel=>sel==='td .loteria-nombre'?[name]:
    inputs.filter(x=>sel==='input[name="'+x.name+'"]')};
  const cell={closest:sel=>sel==='tr'?row:null,
    querySelectorAll:sel=>sel==='.loteria-abrev'?[badge]:sel==='.loteria-nombre'?[name]:[]};
  name.closest=sel=>sel==='td'?cell:null;
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

test('nombre, abreviatura y cinco loteria son independientes',()=>{
 const f=fixture(),base={root:f.root,draw,date:'2026-10-19'};
 const ok=findUniqueRoverRow(base);
 assert.equal(ok.ok,true);
 assert.equal(ok.code,'FL-AM');
 assert.equal(primaryRoverName(ok.label),'FLORIDAAM');
 assert.equal(findUniqueRoverRow({...base,draw:{...draw,roverCode:'FL-AM-MR'}}).status,'CONFLICTO');
 assert.equal(findUniqueRoverRow({...base,draw:{...draw,roverLabel:'FLORIDA AM MARIAGE PALE'}}).status,'SIN_FILA');
 f.inputs[0].getAttribute=k=>k==='loteria'?'FL-AM-MR':null;
 assert.equal(findUniqueRoverRow(base).status,'CONFLICTO');
});
test('no aceptar una identidad sin roverCode verificado',()=>{
 const f=fixture();
 assert.equal(findUniqueRoverRow({root:f.root,draw:{id:'fl-am',roverLabel:'FLORIDA AM'},date:'2026-10-19'}).status,'SIN_FILA');
});

test('cambio concurrente de LotteryUSA durante la escritura aborta y conserva el valor manual',()=>{
 const f=fixture();
 let firstValue='';
 Object.defineProperty(f.inputs[0],'value',{
   get:()=>firstValue,
   set(value){
     firstValue=value;
     // Simulates manual LotteryUSA changing a different field at the moment
     // LotteryNet starts filling. The old value must NEVER be overwritten.
     f.inputs[1].value='46';
   },
   configurable:true
 });
 const result=fillVisualInputs({root:f.root,draw,date:'2026-10-19',p3:'407',p4:'0832'});
 assert.equal(result.ok,false);
 assert.equal(result.status,'ERROR');
 assert.deepEqual(f.inputs.map(x=>x.value),['','46','','','']);
});
