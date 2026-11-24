/**
 * Fase 2: browser regression using an isolated, simulated Rover DOM.
 * It does NOT test signed-in Rover or the Tampermonkey extension.
 */
import {chromium,firefox} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const base=fileURLToPath(new URL('../../',import.meta.url));
const fixtureRow=()=>[
 '<tr class="res_tr"><td style="display:none;">13:30:00</td><td><span><span class="loteria-nombre">FLORIDA AM</span><span class="loteria-abrev">FL-AM</span></span></td>',
 ...['primera','segunda','tercera','pick3','pick4'].map(k=>'<td><input type="text" name="'+k+'" loteria="FL-AM" value=""></td>'),
 '<td><button type="button" data-process="1">Procesar</button></td>',
 '</tr>'
].join('');
const documentHtml='<!doctype html><html><head><meta charset="utf-8"><title>Isolated Rover fixture</title></head><body>'+
 '<input id="fecha" value="10/19/2026">'+
 '<table id="tableResult"><tbody>'+fixtureRow()+'</tbody></table>'+
 '</body></html>';

const server=createServer(async(req,res)=>{
 const pathName=new URL(req.url,'http://127.0.0.1').pathname;
 if(pathName==='/'){
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(documentHtml);
  return;
 }
 if(!(pathName.startsWith('/src/') || pathName==='/tests/browser/rover-dom-audit.user.js' || pathName==='/tests/browser/rover-safety-audit.user.js') || !pathName.endsWith('.js')){
  res.statusCode=404;res.end('Not found');return;
 }
 const file=path.resolve(base,'.'+pathName);
 if(!(file.startsWith(path.join(base,'src')+path.sep) || file===path.join(base,'tests/browser/rover-dom-audit.user.js') || file===path.join(base,'tests/browser/rover-safety-audit.user.js'))){
  res.statusCode=403;res.end('Forbidden');return;
 }
 try{
  res.setHeader('Content-Type','text/javascript; charset=utf-8');
  res.end(await readFile(file,'utf8'));
 }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {port}=server.address();
try {
 for(const [engine,browserType] of [['Chromium',chromium],['Firefox',firefox]]){
  const executablePath=process.env['LOTTERYNET_QA_'+engine.toUpperCase()+'_PATH'];
  const browser=await browserType.launch({headless:true,...(executablePath&&{executablePath})});
  try{
   const page=await browser.newPage();
   const outgoing=[];
   page.on('request',request=>{
    if(request.method()!=='GET'||request.url().includes('/__inc/'))outgoing.push(request.method()+' '+request.url());
   });
   await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'load'});
   await page.addScriptTag({url:'http://127.0.0.1:'+port+'/tests/browser/rover-dom-audit.user.js'});
   await page.addScriptTag({url:'http://127.0.0.1:'+port+'/tests/browser/rover-safety-audit.user.js'});
   const safetyBefore=await page.evaluate(()=>{
     const state={events:[],posts:0,processClicks:0,observerRefreshes:0};
     window.__qaHostile=state;
     for(const type of ['input','change','blur'])
       document.addEventListener(type,event=>{
         if(!event.target.matches?.('#tableResult input'))return;
         state.events.push(type);
         state.posts++;
         fetch('/__inc/procesarResultados.php',{method:'POST',body:'qa=simulated'}).catch(()=>{});
       },true);
     document.querySelector('[data-process]').addEventListener('click',()=>state.processClicks++);
     const observer=new MutationObserver(records=>{
       for(const record of records)for(const node of record.addedNodes){
         if(node.nodeType===1&&(node.matches?.('tr.res_tr')||node.querySelector?.('tr.res_tr')))
           state.observerRefreshes++;
       }
     });
     observer.observe(document.querySelector('#tableResult'),{childList:true,subtree:true});
     const safety=window.__LOTTERYNET_SAFETY_QA__.snapshot();
     window.__qaHostileObserver=observer;
     return safety;
   });
   assert.equal(safetyBefore.details.find(x=>x.title==='FLORIDA AM').fields.length,5,engine);
   assert.equal(safetyBefore.details.find(x=>x.title==='FLORIDA AM').fields.filter(x=>x.codeOk).length,5,engine);
   assert.equal(safetyBefore.eventObserverActive,false,engine);
   await page.evaluate(()=>window.__LOTTERYNET_SAFETY_QA__.observe());
   const auditBefore=await page.evaluate(()=>window.__LOTTERYNET_DOM_AUDIT__.snapshot());
   assert.equal(auditBefore.matchedRows,1,engine+' audit nested title');
   assert.equal(auditBefore.candidates[0].target,'FLORIDA AM',engine+' audit primary label');
   const result=await page.evaluate(async()=>{
    const {fillVisualInputs}=await import('/src/rover/fill-ui.js');
    const {createVisualCache,restoreVisibleValues}=await import('/src/rover/restore.js');
    const {mountInlineStatus,setInlineStatus,UI_STATES}=await import('/src/ui/controls.js');
    const draw={id:'fl-am',roverLabel:'FLORIDA AM',roverCode:'FL-AM'};
    const date='2026-10-19';
    let events=0;
    for(const type of ['input','change','blur'])document.addEventListener(type,()=>events++,true);
    const values=()=>Array.from(document.querySelectorAll('#tableResult input')).map(x=>x.value);
    const a=fillVisualInputs({root:document,draw,date,p3:'407',p4:'0832'});
    const first=values();
    const second=fillVisualInputs({root:document,draw,date,p3:'407',p4:'0832'});
    const mounted=mountInlineStatus({root:document,draw,date,state:'CARGANDO'});
    const initialText=mounted.element?.textContent;
    const spinner=!!mounted.element?.querySelector('svg');
    const updated=setInlineStatus(mounted.element,'COMPLETADO');
    mountInlineStatus({root:document,draw,date,state:'COMPLETADO'});
    const inlineCount=document.querySelectorAll('[data-lnr-inline="fl-am"]').length;
    const completed=updated.textContent;
    const firstCellChildrenBefore=document.querySelectorAll('tr.res_tr:first-child > td:nth-child(2) .lnr-inline-state').length;
    const existing=document.querySelector('input[name="tercera"]');
    existing.value='91';
    const conflicted=fillVisualInputs({root:document,draw,date,p3:'407',p4:'0832'});
    const conflictValues=values();
    const cache=createVisualCache();
    const stored=cache.remember({draw,date,p3:'407',p4:'0832'});
    const originalRow=document.querySelector('tr.res_tr');
    // Emulate Rover replacing the table after Search.
    document.querySelector('#tableResult tbody').innerHTML=originalRow.outerHTML;
    for(const item of document.querySelectorAll('#tableResult input'))item.value='';
    const restored=restoreVisibleValues({root:document,draw,date,cache});
    const restoredValues=values();
    document.querySelector('#fecha').value='10/18/2026';
    const wrongDate=restoreVisibleValues({root:document,draw,date,cache});
    // Use the same labels to create an ambiguity and confirm safe failure.
    document.querySelector('#fecha').value='10/19/2026';
    const r=document.querySelector('tr.res_tr');
    r.after(r.cloneNode(true));
    const duplicate=fillVisualInputs({root:document,draw,date,p3:'407',p4:'0832'});
    return {
     firstOk:a.ok,written:a.written,first,second:second.status,
     initialText,spinner,inlineCount,completed,firstCellChildrenBefore,conflict:conflicted.status,conflictValues,
     stored,restored:restored.status,restoredValues,wrongDate:wrongDate.status,
     duplicate:duplicate.status,events,
     states:Object.keys(UI_STATES).length
    };
   });
   assert.equal(result.firstOk,true,engine);
   assert.equal(result.written,5,engine);
   assert.deepEqual(result.first,['07','08','32','407','0832'],engine);
   assert.equal(result.second,'COINCIDENTE',engine);
   assert.equal(result.initialText,'Consultando',engine);
   assert.equal(result.spinner,true,engine);
   assert.equal(result.completed,'Casillas completadas',engine);
   assert.equal(result.inlineCount,1,engine);
   assert.equal(result.firstCellChildrenBefore,1,engine);
   const coexistence=await page.evaluate(async()=>{
     await new Promise(resolve=>setTimeout(resolve,0)); // flush MutationObserver.
     return {...window.__qaHostile,
       safety:window.__LOTTERYNET_SAFETY_QA__.stop()};
   });
   assert.deepEqual(coexistence.events,[],engine+' no hostile event handlers invoked');
   assert.equal(coexistence.posts,0,engine+' no processing calls triggered');
   assert.equal(coexistence.processClicks,0,engine+' no process button clicks');
   assert.equal(coexistence.safety.eventCounts.input,0,engine);
   assert.equal(coexistence.safety.eventCounts.change,0,engine);
   assert.equal(coexistence.safety.eventCounts.blur,0,engine);
   // A row-cloning test runs below; disconnect here to keep unrelated
   // mutations outside this case.
   await page.evaluate(()=>window.__qaHostileObserver.disconnect());
   const auditAfter=await page.evaluate(()=>window.__LOTTERYNET_DOM_AUDIT__.snapshot());
   assert.equal(auditAfter.matchedRows,2,engine+' audit after cloning two matching rows');
   const probe=await page.evaluate(()=>{
     const body=document.querySelector('#tableResult tbody');
     const add=(name,code)=>{
       const row=document.createElement('tr');
       row.innerHTML='<td style="display:none">12:10:00</td><td><span><span class="loteria-nombre">'+name+'</span><span class="loteria-abrev">'+code+'</span></span></td>';
       body.appendChild(row);
     };
     add('OHIO MIDDAY','OHIO-MD');
     add('FLORIDA AM MARIAGE PALE','FL-AM-MR');
     return window.__LOTTERYNET_DOM_AUDIT__.snapshot();
   });
   assert.equal(probe.version,'0.4.0',engine);
   assert.equal(probe.candidates.filter(x=>x.target==='OHIO MIDDAY').length,1,engine+' exact code pair');
   assert.equal(probe.candidates.filter(x=>x.target==='FLORIDA AM').length,2,engine+' no derivative collision');
   assert.equal(probe.candidates.some(x=>x.target==='FLORIDA AM MARIAGE PALE'),false,engine+' no derivative');
   assert.equal(result.conflict,'CONFLICTO',engine);
   assert.deepEqual(result.conflictValues,['07','08','91','407','0832'],engine);
   assert.equal(result.stored,true,engine);
   assert.equal(result.restored,'COMPLETADO',engine);
   assert.deepEqual(result.restoredValues,['07','08','32','407','0832'],engine);
   assert.equal(result.wrongDate,'CONFLICTO',engine);
   assert.equal(result.duplicate,'SIN_FILA',engine);
   assert.equal(result.events,0,engine);
   assert.equal(result.states,9,engine);
   assert.deepEqual(outgoing,[],engine);
   console.log(engine+' coexistence PASS — no event-driven POST, process clicks or synthetic events; passive observer OK');
  } finally {await browser.close();}
 }
} finally {await new Promise(resolve=>server.close(resolve));}

// Extend the existing CI entry with the ten captured, sanitized rows and a
// positively tested network boundary. Still no real Rover login/extension.
await import('./network-blocked-rover.mjs');
