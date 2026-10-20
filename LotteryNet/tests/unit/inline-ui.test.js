
import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_STATES,setInlineStatus,mountInlineStatus,mountLotteryNetControls} from '../../src/ui/controls.js';
const approved={
  BUSCANDO:['search','Buscando sorteo'],CARGANDO:['loader-circle','Consultando'],
  COMPLETADO:['circle-check','Casillas completadas'],ERROR:['circle-alert','Error al consultar o llenar'],
  PENDIENTE:['clock-3','Resultado aún no disponible'],PARCIAL:['circle-dot','Resultado parcialmente disponible'],
  COINCIDENTE:['check-check','Los valores ya coinciden'],CONFLICTO:['triangle-alert','Los valores existentes son diferentes'],
  SIN_FILA:['search-x','No se encontró la fila correspondiente']
};
test('nueve estados con iconos Lucide lineales y mensajes exactos',()=>{
  assert.deepEqual(Object.keys(UI_STATES),Object.keys(approved));
  for(const [id,[icon,label]] of Object.entries(approved)){
    assert.equal(UI_STATES[id].icon,icon);
    assert.equal(UI_STATES[id].message,label);
  }
  assert.throws(()=>mountLotteryNetControls(),/Fase 3/);
});
test('actualización visual usa textContent y no crea HTML ejecutable',()=>{
  const doc={
    createElement(tag){return {tag,ownerDocument:doc,set textContent(v){this.text=v;}};},
    createElementNS(ns,tag){return {tag,attrs:{},setAttribute(k,v){this.attrs[k]=v;},appendChild(){}};}
  };
  const indicator={ownerDocument:doc,dataset:{},replaceChildren(...items){this.items=items;}};
  setInlineStatus(indicator,'CARGANDO');
  assert.equal(indicator.items.length,2);
  assert.equal(indicator.items[1].text,'Consultando');
  assert.equal(indicator.dataset.state,'CARGANDO');
  setInlineStatus(indicator,'COMPLETADO');
  assert.equal(indicator.items[1].text,'Casillas completadas');
});
test('no monta indicadores si no hay fila Rover validada',()=>{
  assert.equal(mountInlineStatus({root:{querySelector(){return null;}},draw:{id:'fl-am',roverLabel:'FLORIDA AM'},date:'2026-10-19'}).ok,false);
});
