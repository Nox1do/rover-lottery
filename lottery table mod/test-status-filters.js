const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('Rs-loteria-res-tabla-mod.user.js','utf8');
assert.match(source, /^\/\/ @version\s+1\.6\.22$/m);
assert.ok(source.includes('rt-processed-pending-filter-label'));
assert.ok(source.includes('ensureRowFilters()'));
assert.equal((source.match(/searchFilters\.push/g) || []).length, 1);
new Function(source);
const code = source.slice(source.indexOf('  function rowIsUnprocessed('),source.indexOf('  const LAYOUT_SETTLE_MS ='));
const jquery = {fn:{dataTable:{ext:{search:[]}}}};
const hooks = new Function('window','Node',
  'let showOnlyUnprocessed=false,showOnlyProcessedPending=false,dataTablesFilterRegistered=false;'+
  code+';return {register:registerDataTablesFilter,pending:rowIsProcessedPending,'+
  'mode:(s)=>{showOnlyUnprocessed=s==="unprocessed";showOnlyProcessedPending=s==="processedPending"}}'
)({jQuery:jquery},class Node {});
hooks.register();
hooks.register();
assert.equal(jquery.fn.dataTable.ext.search.length,1);
const filter=jquery.fn.dataTable.ext.search[0];
const row=(processed,pending)=>({querySelector(sel){
  if(sel==='td:nth-child(10) .status-circle.status-no')return processed?null:{};
  if(sel==='td:nth-child(10) .status-circle')return {classList:{contains:(cls)=>cls==='status-no'&&!processed}};
  if(sel==='td:nth-child(9) .badge-pend-has')return pending?{}:null;
  return null;
}});
for (const [processed,pending] of [[false,false],[false,true],[true,false],[true,true]]) {
  const settings={nTable:{id:'tableResult'},aoData:[{nTr:row(processed,pending)}]};
  hooks.mode('unprocessed');assert.equal(filter(settings,[],0),!processed);
  hooks.mode('processedPending');assert.equal(filter(settings,[],0),processed&&pending);
  hooks.mode(null);assert.equal(filter(settings,[],0),true);
  hooks.mode('processedPending');
  assert.equal(filter({...settings,nTable:{id:'other'}},[],0),true);
  const data=Array(8).fill('');
  data.push(pending?'<span class="badge-pend-has">2</span>':'');
  data.push('<span class="status-circle '+(processed?'status-yes':'status-no')+'"></span>');
  assert.equal(hooks.pending({aoData:[{}]},data,0),processed&&pending);
}
console.log('Lottery table mod: status filters regression OK');