const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('virtual-lottery v2 auto.user.js', 'utf8')
  .replace('    iniciarAutoLoterias();\n    observarResultadosLoteria();\n    iniciar();\n', '')
  .replace(/\}\)\(\);\s*$/, 'globalThis.__queenTest = {queenNormalizarSorteo, queenFechaUs, parseQueen, buscarQueen, autoFuente, autoConfig};})();');

function png(value) {
  return '<img src="https://www.thequeenlottery.com/main/assets/img/normal/' +
    String(value).padStart(2,'0') + '.png">';
}
function draw(label, numbers) {
  const [a,b,c,p3,p4]=numbers;
  return '<tr><td>'+label+'</td><td>'+png(a)+'</td><td>'+png(b)+
    '</td><td>'+png(c)+'</td><td>'+[...p3].map(png).join('')+
    '</td><td>'+[...p4].map(png).join('')+'</td></tr>';
}
function fixture(date, rows) {
  return '<div id="results"><div class="date-group"><div class="date-bar"><h4>'+
    date+'</h4></div><div class="desktop-table"><table class="results-table"><tbody>'+
    rows.join('')+'</tbody></table></div><!-- Mobile: cards -->'+
    '</div></div>';
}
// Queen official 2026-10-10: same identifiers, date and normal/NN.png image style.
const current=fixture('Saturday, October 10, 2026',[
  draw('QLT-MORNING',['14','16','38','614','1638']),
  draw('QLT-MIDDAY',['59','48','85','659','4885']),
  draw('QLT-AFTN',['99','57','57','899','5757']),
  draw('QLT-EVENING',['76','87','76','276','8776']),
  draw('QLT-NIGHT',['51','69','66','751','6966'])
]);
const legacy=fixture('Thursday, October 1, 2026',[
  draw('QL MORNING',['00','05','99','007','0001']),
  draw('QL MIDDAY',['01','02','03','012','1234']),
  draw('QL AFTERNOON',['04','05','06','123','4567']),
  draw('QL EVENING',['07','08','09','234','5678']),
  draw('QL NIGHT',['10','11','12','345','6789'])
]);

function makeTd(html) {
  const images=[...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)]
    .map(match=>({getAttribute(name){return name==='src'?match[1]:'';}}));
  return {
    textContent:html.replace(/<[^>]*>/g,'').trim(),
    querySelector(sel){return sel==='img'?images[0]||null:null;},
    querySelectorAll(sel){return sel==='img'?images:[];}
  };
}
class FixtureDOMParser {
  parseFromString(html) {
    const groups=[...html.matchAll(/<div class="date-group">([\s\S]*?)<!-- Mobile:/g)]
      .map(match=>{
        const text=match[1];
        const date=text.match(/<h4>(.*?)<\/h4>/)?.[1]||'';
        const tbody=text.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1]||'';
        const rows=[...tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m=>{
          const tds=[...m[1].matchAll(/<td>([\s\S]*?)<\/td>/g)]
            .map(cell=>makeTd(cell[1]));
          return {querySelectorAll(sel){return sel==='td'?tds:[];}};
        });
        return {
          querySelector(sel){return sel==='.date-bar h4'?{textContent:date}:null;},
          querySelectorAll(sel){return sel==='.desktop-table .results-table tbody tr'?rows:[];}
        };
      });
    return {querySelectorAll(sel){return sel==='#results .date-group'?groups:[];}};
  }
}

let liveHtml=current;
const requests=[];
const context={
  location:{hostname:'www.roversport.lol'},
  document:{
    head:{appendChild(){}},documentElement:{},
    createElement(){return {textContent:''}},
    querySelector(){return null},querySelectorAll(){return [];}
  },
  DOMParser:FixtureDOMParser,
  MutationObserver:class {observe(){}},
  Event:class {},
  GM_getValue(_key,fallback){return fallback},
  GM_setValue(){},
  GM_xmlhttpRequest(options){
    requests.push(options.url);
    options.onload({status:200,responseText:liveHtml});
  },
  console:{log(){},warn(){},error(){},table(){}},
  navigator:{}, setTimeout(){},clearTimeout(){},
  setInterval(){},clearInterval(){},
  Date,Intl,URL,URLSearchParams,Symbol,WeakMap,Set,Map,Math
};
vm.createContext(context);
vm.runInContext(source,context);
const q=context.__queenTest;

const aliases=[
  ['QLT-MORNING','QL MORNING'],
  ['QLT-MIDDAY','QL MIDDAY'],
  ['QLT-AFTN','QL AFTERNOON'],
  ['QLT-EVENING','QL EVENING'],
  ['QLT-NIGHT','QL NIGHT']
];
for (const [siteKey,canonical] of aliases) {
  assert.equal(q.queenNormalizarSorteo(siteKey),canonical);
  assert.equal(q.queenNormalizarSorteo(canonical),canonical);
}
assert.equal(q.queenNormalizarSorteo('QLT-AFTERNOON'),'QL AFTERNOON');
assert.equal(q.queenNormalizarSorteo('QLT-SURPRISE'),'');
assert.equal(q.queenFechaUs('Saturday, October 10, 2026'),'10/10/2026');

const newRows=Array.from(q.parseQueen(current));
assert.equal(newRows.length,5);
assert.deepEqual(newRows.map(r=>r.queenKey), aliases.map(([,canon])=>canon));
assert.ok(newRows.every(r=>r.fecha==='10/10/2026'));
assert.deepEqual(
  ['primera','segunda','tercera','pick3','pick4'].map(f=>newRows[0][f]),
  ['14','16','38','614','1638']
);
assert.equal(newRows[2].queenKey,'QL AFTERNOON');

const oldRows=Array.from(q.parseQueen(legacy));
assert.equal(oldRows.length,5);
assert.deepEqual(
  ['primera','segunda','tercera','pick3','pick4'].map(f=>oldRows[0][f]),
  ['00','05','99','007','0001']
);

(async()=>{
  for(const [code,config] of Object.entries(q.autoConfig).filter(([,v])=>v.fuente==='queen')){
    const manual=await q.buscarQueen(config,'10/10/2026');
    const auto=await q.autoFuente(code,'10/10/2026');
    assert.ok(manual,'manual: '+code);
    assert.ok(auto,'AUTO: '+code);
    assert.equal(manual.queenKey,config.queenKey);
    assert.equal(auto.queenKey,config.queenKey);
    assert.equal(auto.fecha,'10/10/2026');
    assert.equal(await q.buscarQueen(config,'10/11/2026'),null);
  }
  assert.ok(requests.length>=5);
  assert.ok(requests.every(x=>x==='https://www.thequeenlottery.com/main/live'));
  console.log('Queen: 5 QLT + 5 legacy QL, manual/AUTO and date isolation OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
