import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {extractFromPage} from '../../src/providers/lottery-net.js';
import {parseLotteryNetHtml} from '../../src/parsers/shared.js';
const cases=JSON.parse(await readFile(new URL('../fixtures/lotterynet/cases.json',import.meta.url),'utf8'));
test('10 fuentes auténticas y 20 resultados verificados con fixtures',async()=>{
 assert.equal(cases.length,10);
 let count=0;
 for(const item of cases){
  const html=await readFile(new URL('../fixtures/lotterynet/'+item.fixture,import.meta.url),'utf8');
  for(const draw of item.draws){
   assert.equal(extractFromPage(html,{state:item.state,game:item.game,date:item.date,turn:draw.turn})?.value,draw.value);
   count++;
  }
  assert.equal(extractFromPage(html,{state:item.state,game:item.game,date:'2026-01-01',turn:'EVENING'}),null);
 }
 assert.equal(count,20);
});
test('rechaza fechas imposibles, fuentes distintas, resultados duplicados y bolas ausentes',async()=>{
 const f=cases[0],html=await readFile(new URL('../fixtures/lotterynet/'+f.fixture,import.meta.url),'utf8');
 const args={url:f.url,date:f.date,turn:'MIDDAY',digits:3};
 assert.throws(()=>parseLotteryNetHtml(html,{...args,date:'2026-02-30'}));
 assert.throws(()=>parseLotteryNetHtml(html,{...args,url:'https://www.lotteryusa.com/florida/pick-3/numbers'}));
 assert.throws(()=>parseLotteryNetHtml(html+html,args));
 assert.throws(()=>parseLotteryNetHtml(html.replace('number-part-01','number-part-03'),args));
 assert.throws(()=>extractFromPage(html,{state:'TX',game:'p3',date:f.date,turn:'MIDDAY'}));
});
test('extra balls no alteran el valor principal',async()=>{
 for(const item of cases.filter(x=>['FL','TN','IN'].includes(x.state))){
  const html=await readFile(new URL('../fixtures/lotterynet/'+item.fixture,import.meta.url),'utf8');
  assert.match(html,/fireball|wild-ball|super-ball/);
  for(const draw of item.draws)assert.equal(extractFromPage(html,{state:item.state,game:item.game,date:item.date,turn:draw.turn}).value,draw.value);
 }
});
