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
 '<tr class="res_tr"><td><div class="lottery-title"><strong>FLORIDA AM</strong> <span class="loteria-abrev">FL-AM</span></div></td>',
 ...['primera','segunda','tercera','pick3','pick4'].map(k=>'<td><input type="text" name="'+k+'" loteria="111" value=""></td>'),
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
 if(!(pathName.startsWith('/src/') || pathName==='/tests/browser/rover-dom-audit.user.js') || !pathName.endsWith('.js')){
  res.statusCode=404;res.end('Not found');return;
 }
 const file=path.resolve(base,'.'+pathName);
 if(!(file.startsWith(path.join(base,'src')+path.sep) || file===path.join(base,'tests/browser/rover-dom-audit.user.js'))){
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
  const browser=await browserType.launch({headless:true});
  try{
   const page=await browser.newPage();
   const outgoing=[];
   page.on('request',request=>{
    if(request.method()!=='GET'||request.url().includes('/__inc/'))outgoing.push(request.method()+' '+request.url());
   });
   await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'load'});
   await page.addScriptTag({url:'http://127.0.0.1:'+port+'/tests/browser/rover-dom-audit.user.js'});
   const auditBefore=await page.evaluate(()=>window.__LOTTERYNET_DOM_AUDIT__.snapshot());
   assert.equal(auditBefore.matchedRows,1,engine+' audit nested title');
   assert.equal(auditBefore.candidates[0].target,'FLORIDA AM',engine+' audit primary label');
   const result=await page.evaluate(async()=>{
    const {fillVisualInputs}=await import('/src/rover/fill-ui.js');
    const {createVisualCache,restoreVisibleValues}=await import('/src/rover/restore.js');
    const {mountInlineStatus,setInlineStatus,UI_STATES}=await import('/src/ui/controls.js');
    const draw={id:'fl-am',roverLabel:'FLORIDA AM'};
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
    const firstCellChildrenBefore=document.querySelectorAll('tr.res_tr:first-child > td:first-child .lnr-inline-state').length;
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
   const auditAfter=await page.evaluate(()=>window.__LOTTERYNET_DOM_AUDIT__.snapshot());
   assert.equal(auditAfter.matchedRows,2,engine+' audit after cloning two matching rows');
   const probe=await page.evaluate(()=>{
     const body=document.querySelector('#tableResult tbody');
     const make=html=>{const row=document.createElement('tr');row.innerHTML='<td>'+html+'</td>';body.appendChild(row);};
     make('<div><strong>OHIO MIDDAY</strong><span>OHIO-MD</span></div>');
     make('<div><strong>FLORIDA AM MARIAGE PALE</strong><span>FL-AM-MR</span></div>');
     return window.__LOTTERYNET_DOM_AUDIT__.snapshot();
   });
   assert.equal(probe.version,'0.3.0',engine);
   assert.equal(probe.candidates.filter(x=>x.target==='OHIO MIDDAY').length,1,engine+' exact code pair');
   assert.equal(probe.candidates.filter(x=>x.target==='FLORIDA AM').length,2,engine+' no derivative collision');
   assert.ok(probe.nearMatches.some(x=>x.possible.includes('FLORIDA AM')),engine+' derivative reported only');
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
   console.log(engine+' isolated fixture PASS — nested names + read-only audit, no Rover writes, no input/change/blur events');
  } finally {await browser.close();}
 }
} finally {await new Promise(resolve=>server.close(resolve));}
