/**
 * Phase 2 QA: manual-only LotteryUSA v0.6.5 coexistence with LotteryNet.
 * Browser-only localhost DOM fixture. Never contacts authenticated Rover,
 * never runs LotteryUSA's external mobile/API providers or hits production.
 *
 * The triggerInput function is extracted VERBATIM at runtime from the
 * versioned LotteryUSA script to exercise its actual event behavior.
 * The button/values are a controlled local model of executeScrape/fillTable,
 * not an execution of the entire old userscript.
 */
import {chromium, firefox} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const base=fileURLToPath(new URL('../../', import.meta.url));
const usaPath=new URL('../../../Loterias USA/versions/Rovs-Loterias-USA-v0.6.5.user.js',import.meta.url);
const usa=await readFile(usaPath,'utf8');
assert.match(usa,/btn\.onclick\s*=\s*\(\)\s*=>\s*executeScrape\(/);
const start=usa.indexOf('    function triggerInput(el, val) {');
const end=usa.indexOf('    if (document.readyState ===',start);
if(start<0||end<0||end-start>2500)throw new Error('Unexpected legacy USA triggerInput boundaries');
const realTrigger=usa.slice(start,end).trim();
assert.match(realTrigger,/dispatchEvent\(new Event\('input'/);
assert.match(realTrigger,/dispatchEvent\(new Event\('change'/);
assert.match(realTrigger,/dispatchEvent\(new Event\('blur'/);

const fields=['primera','segunda','tercera','pick3','pick4'];
const row=(name,code)=>[
 '<tr class="res_tr"><td style="display:none">13:30:00</td>',
 '<td><span><span class="loteria-nombre">'+name+'</span><span class="loteria-abrev">'+code+'</span></span></td>',
 ...fields.map(x=>'<td><input type="text" name="'+x+'" loteria="'+code+'" value=""></td>'),
 '<td><button type="button" data-process="1">Procesar</button></td></tr>'
].join('');
const blankFlorida=row('FLORIDA AM','FL-AM');
const markup='<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>'+
 '<input id="fecha" value="10/19/2026">'+
 '<button id="usa-btn" type="button">Consultar USA (SIMULADO)</button>'+
 '<table id="tableResult"><tbody>'+blankFlorida+
 row('FLORIDA AM MARIAGE PALE','FL-AM-MR')+
 row('INDIANA MIDDAY','IN-MD')+'</tbody></table></body></html>';
const server=createServer(async(req,res)=>{
 const name=new URL(req.url,'http://127.0.0.1').pathname;
 if(req.method!=='GET'){res.statusCode=405;res.end('No mutation endpoint');return;}
 if(name==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(markup);return;}
 if(!name.startsWith('/src/')||!name.endsWith('.js')){
   res.statusCode=404;res.end('Not found');return;
 }
 const file=path.resolve(base,'.'+name);
 if(!file.startsWith(path.join(base,'src')+path.sep)){
   res.statusCode=403;res.end('Forbidden');return;
 }
 try{
   res.setHeader('Content-Type','text/javascript; charset=utf-8');
   res.end(await readFile(file,'utf8'));
 }catch{res.statusCode=404;res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/';

const install=async page=>{
 await page.goto(url,{waitUntil:'load'});
 // Isolate only the legacy helper. We DO NOT call the full script or its APIs.
 await page.addScriptTag({content:realTrigger+
  '\nwindow.__legacyUSAInput=function(input,value){triggerInput(input,value);};'});
 await page.evaluate(async()=>{
   window.__LN=await import('/src/rover/fill-ui.js');
   window.__LNR=await import('/src/rover/restore.js');
   window.__qa={
     manualClicks:0,events:{input:0,change:0,blur:0},processClicks:0
   };
   const row=[...document.querySelectorAll('#tableResult tbody tr')]
      .find(x=>x.querySelector('.loteria-abrev')?.textContent==='FL-AM');
   const button=document.querySelector('#usa-btn');
   const names=['primera','segunda','tercera','pick3','pick4'];
   window.__qa.row=row;
   window.__qa.values=()=>names.map(name=>row.querySelector('input[name="'+name+'"]').value);
   window.__qa.foreign=()=>[...document.querySelectorAll('#tableResult tbody tr')]
     .filter(x=>x!==row).map(x=>names.map(name=>x.querySelector('input[name="'+name+'"]').value));
   window.__qa.configure=(p3,p4)=>{
     button.onclick=()=>{
       window.__qa.manualClicks++;
       const input=name=>row.querySelector('input[name="'+name+'"]');
       // Same order and mapping as USA v0.6.5 fillTable:
       if(p3)window.__legacyUSAInput(input('pick3'),p3);
       if(p3)window.__legacyUSAInput(input('primera'),p3.slice(-2));
       if(p4)window.__legacyUSAInput(input('pick4'),p4);
       if(p4)window.__legacyUSAInput(input('segunda'),p4.slice(0,2));
       if(p4)window.__legacyUSAInput(input('tercera'),p4.slice(-2));
     };
   };
   for(const name of names)
     for(const type of ['input','change','blur'])
       row.querySelector('input[name="'+name+'"]').addEventListener(type,()=>window.__qa.events[type]++);
   for(const process of document.querySelectorAll('[data-process]'))
     process.addEventListener('click',()=>window.__qa.processClicks++);
 });
};
const req={draw:{id:'fl-am',roverLabel:'FLORIDA AM',roverCode:'FL-AM'},date:'2026-10-19',p3:'407',p4:'0832'};
const capture=page=>page.evaluate(()=>({
  values:window.__qa.values(),foreign:window.__qa.foreign(),
  clicks:window.__qa.manualClicks,events:window.__qa.events,
  processClicks:window.__qa.processClicks
}));
const runFill=(page,options=req)=>page.evaluate(args=>{
 const r=window.__LN.fillVisualInputs({root:document,...args});
 return {ok:r.ok,status:r.status,written:r.written??0};
},options);
const configUSA=(page,p3,p4)=>page.evaluate(([three,four])=>window.__qa.configure(three,four),[p3,p4]);

try{
 for(const [engine,type] of [['Chromium',chromium],['Firefox',firefox]]){
  const executablePath=process.env['LOTTERYNET_QA_'+engine.toUpperCase()+'_PATH'];
  const browser=await type.launch({headless:true,...(executablePath&&{executablePath})});
  try{
   const page=await browser.newPage(),outgoing=[];
   page.on('request',request=>{if(request.method()!=='GET'||request.url().includes('/__inc/'))outgoing.push(request.method()+' '+request.url());});

   // 1. User has not clicked LotteryUSA: no other script should fill its row.
   await install(page);
   await configUSA(page,'921','4603');
   let before=await capture(page);
   assert.equal(before.clicks,0,engine);
   const first=await runFill(page);
   assert.deepEqual(first,{ok:true,status:'COMPLETADO',written:5},engine);
   let after=await capture(page);
   assert.deepEqual(after.values,['07','08','32','407','0832'],engine);
   assert.equal(after.clicks,0,engine+' LotteryUSA manual button was not clicked');
   assert.deepEqual(after.events,{input:0,change:0,blur:0},engine);
   assert.deepEqual(after.foreign,[['','','','',''],['','','','','']],engine);
   assert.equal(after.processClicks,0,engine);

   // 2. LotteryUSA was manually clicked FIRST with different values:
   // LotteryNet must report CONFLICT without modifying any cell.
   await install(page);
   await configUSA(page,'921','4603');
   await page.locator('#usa-btn').click();
   before=await capture(page);
   assert.equal(before.clicks,1,engine);
   assert.deepEqual(before.values,['21','46','03','921','4603'],engine);
   assert.deepEqual(before.events,{input:5,change:5,blur:5},engine+' real USA helper dispatches events');
   const conflict=await runFill(page);
   after=await capture(page);
   assert.deepEqual(conflict,{ok:false,status:'CONFLICTO',written:0},engine);
   assert.deepEqual(after.values,before.values,engine+' never overwrite manual values');
   assert.deepEqual(after.events,before.events,engine+' LotteryNet adds no events');
   assert.equal(after.processClicks,0,engine);

   // 3. Matching USA manual values: idempotent and zero writes/events.
   await install(page);
   await configUSA(page,'407','0832');
   await page.locator('#usa-btn').click();
   before=await capture(page);
   const same=await runFill(page);
   after=await capture(page);
   assert.deepEqual(same,{ok:true,status:'COINCIDENTE',written:0},engine);
   assert.deepEqual(after.values,before.values,engine);
   assert.deepEqual(after.events,before.events,engine);

   // 4. Only USA Pick 3 was entered: fill just the remaining three fields.
   await install(page);
   await configUSA(page,'407',null);
   await page.locator('#usa-btn').click();
   before=await capture(page);
   const partial=await runFill(page);
   after=await capture(page);
   assert.deepEqual(partial,{ok:true,status:'COMPLETADO',written:3},engine);
   assert.deepEqual(after.values,['07','08','32','407','0832'],engine);
   assert.deepEqual(after.events,before.events,engine);
   assert.deepEqual(after.foreign,[['','','','',''],['','','','','']],engine);

   // 5. LotteryUSA can be manually clicked AFTER LotteryNet, and its own
   // legacy helper overwrites; the next LotteryNet pass must NEVER undo it.
   await install(page);
   assert.equal((await runFill(page)).status,'COMPLETADO',engine);
   await configUSA(page,'921','4603');
   await page.locator('#usa-btn').click();
   before=await capture(page);
   assert.deepEqual(before.values,['21','46','03','921','4603'],engine);
   const later=await runFill(page);
   after=await capture(page);
   assert.equal(later.status,'CONFLICTO',engine);
   assert.deepEqual(after.values,before.values,engine);
   assert.deepEqual(after.events,before.events,engine);

   // 6. Rover Search reconstructs the table; another manual result exists.
   // Restoration of previously displayed LotteryNet values must not win.
   await install(page);
   const cacheState=await page.evaluate(({draw,date})=>{
     const cache=window.__LNR.createVisualCache();
     cache.remember({draw,date,p3:'407',p4:'0832'});
     window.__restoreCache=cache;
     return !!cache.get({draw,date});
   },req);
   assert.equal(cacheState,true,engine);
   await page.evaluate(html=>{
     const table=document.querySelector('#tableResult tbody');
     table.innerHTML=html+
       '<tr class="res_tr"><td style="display:none">12:00:00</td><td><span class="loteria-nombre">FLORIDA AM MARIAGE PALE</span><span class="loteria-abrev">FL-AM-MR</span></td>'+
       ['primera','segunda','tercera','pick3','pick4'].map(n=>'<td><input name="'+n+'" loteria="FL-AM-MR" value=""></td>').join('')+'</tr>';
     const row=table.querySelector('tr');
     const names=['primera','segunda','tercera','pick3','pick4'];
     for(let i=0;i<names.length;i++)row.querySelector('input[name="'+names[i]+'"]').value=['21','46','03','921','4603'][i];
   },blankFlorida);
   const restore=await page.evaluate(({draw,date})=>{
     const r=window.__LNR.restoreVisibleValues({root:document,draw,date,cache:window.__restoreCache});
     return {ok:r.ok,status:r.status};
   },req);
   assert.deepEqual(restore,{ok:false,status:'CONFLICTO'},engine);
   const restored=await page.evaluate(()=>{
     const row=document.querySelector('#tableResult tbody tr');
     return ['primera','segunda','tercera','pick3','pick4'].map(n=>row.querySelector('input[name="'+n+'"]').value);
   });
   assert.deepEqual(restored,['21','46','03','921','4603'],engine);

   // 7. Wrong date cannot affect current rows.
   await install(page);
   await page.evaluate(()=>document.querySelector('#fecha').value='10/18/2026');
   assert.equal((await runFill(page)).status,'CONFLICTO',engine);
   assert.deepEqual((await capture(page)).values,['','','','',''],engine);

   assert.deepEqual(outgoing,[],engine+' no outgoing POST or processing endpoint');
   console.log(engine+' manual-USA overlap PASS — conflict, idempotence, partials, ordering, restore and zero POST');
  }finally{await browser.close();}
 }
}finally{await new Promise(done=>server.close(done));}
