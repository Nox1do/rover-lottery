
import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleRoverDate,findUniqueRoverRow} from '../../src/rover/rows.js';
import {fillVisualInputs,planVisualFill} from '../../src/rover/fill-ui.js';
import {createVisualCache,restoreVisibleValues} from '../../src/rover/restore.js';

const draw={id:'fl-am',roverLabel:'FLORIDA AM'};
const fields=['primera','segunda','tercera','pick3','pick4'];
function fixture(values=['','','','','']){
  const inputs=fields.map((name,i)=>({name,value:values[i],readOnly:false,disabled:false,
    getAttribute:key=>key==='loteria'?'111':null,
    hasAttribute:key=>key==='loteria'}));
  const label={textContent:'FLORIDA AM'};
  const row={querySelector:sel=>sel==='.loteria-abrev'?label:null,
    querySelectorAll:sel=>inputs.filter(i=>sel==='input[name="'+i.name+'"]')};
  const table={querySelectorAll:sel=>sel==='tbody tr.res_tr'?[row]:[]};
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
