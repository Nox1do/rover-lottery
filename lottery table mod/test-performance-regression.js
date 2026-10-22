const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('Rs-loteria-res-tabla-mod.user.js', 'utf8');
assert.match(source, /^\/\/ @version\s+1\.6\.26$/m);
new Function(source);

function section(start, end) {
  const a = source.indexOf('  function ' + start + '(');
  const b = source.indexOf('  function ' + end + '(', a);
  assert.ok(a >= 0 && b > a, 'Section ' + start + ' not found');
  return source.slice(a, b);
}

{
  const table = {};
  const changedRow = {closest: (selector) => selector === '#tableResult' ? table : null};
  const inRow = {closest: (selector) => selector === '#tableResult' ? table :
      selector === 'tr' ? changedRow : null};
  const state = new Function('table',
    'let observedTable=table,eventsBoundTable=table;' +
    'const perf={mutationBatches:0};const calls=[];const sync=[];' +
    'const scheduleRowRefresh=(rows)=>calls.push(rows ? [...rows] : null);' +
    'const scheduleSync=(reason)=>sync.push(reason);' +
    'const document={getElementById:()=>({})};' +
    'const FILTER_ID="unprocessed",PROCESSED_PENDING_FILTER_ID="pending";' +
    'const observedWrapper={};' +
    'const getDataTable=()=>{throw Error("Unexpected DataTable lookup")};' +
    section('onTableMutations', 'bindTableLifecycle') +
    'return {mutate:onTableMutations,calls,sync,perf};'
  )(table);
  const ownX={nodeType:1,classList:{contains:(cls)=>cls==='rt-x'}};
  state.mutate([{target:inRow,addedNodes:[ownX],removedNodes:[]}]);
  assert.equal(state.calls.length,0,'Own marker must not cause a repaint');
  state.mutate([{target:inRow,addedNodes:[{nodeType:1,classList:{contains:()=>false}}],removedNodes:[]}]);
  assert.equal(state.calls.length,1);
  assert.deepEqual(state.calls[0],[changedRow],'Only mutated row must be refreshed');
  state.mutate([{target:{closest:()=>null},addedNodes:[],removedNodes:[]}]);
  assert.equal(state.calls.length,1,'Unrelated changes must not scan rows');
  assert.equal(state.sync.length,0,'No full table sync for edits');
  assert.equal(state.perf.mutationBatches,3);
}

{
  let width=800, columns=0, responsive=0;
  const table = {};
  const wrapper={getBoundingClientRect:()=>({width})};
  const perf={adjustments:0,adjustmentsSkipped:0};
  const adjust=new Function('observedWrapper','observedTable','getDataTable','perf',
    'performance','console',
    'let lastAdjustedTable=null,lastAdjustedWidth=null;' +
    section('applyDataTableColumnAdjust','runDataTableColumnAdjust') +
    'return applyDataTableColumnAdjust;'
  )(wrapper,table,()=>({columns:{adjust:()=>columns++},responsive:{recalc:()=>responsive++}}),
      perf,{now:()=>0},console);
  assert.equal(adjust('first'),true);
  assert.equal(adjust('unchanged'),false);
  assert.equal(columns,1,'No second column reflow at same width');
  width=920;
  assert.equal(adjust('resized'),true);
  assert.equal(columns,2);
  assert.equal(responsive,2);
  assert.equal(perf.adjustmentsSkipped,1);
}

{
  let fullPasses=0, adjusts=0;
  const fn=new Function('document','STYLE_ID','ensureStyle','bindDataTableEvents',
    'ensurePageLength500','ensureRowFilters','scheduleRowRefresh','scheduleStableLayoutAdjust',
    section('syncTable','scheduleSync')+'return syncTable;'
  )({getElementById:()=>({})},'style',()=>{},()=>{},()=>false,()=>false,
    ()=>fullPasses++,()=>adjusts++);
  fn('mutación tableResult');
  fn('draw.dt');
  assert.equal(adjusts,0,'No reflow for mutation or draw');
  fn('nueva tabla');
  assert.equal(adjusts,1,'New table can adjust columns');
  assert.equal(fullPasses,3);
}

{
  const table={};
  let off=0,on=0;
  const jquery=()=>({off:()=>{off++;return {on:()=>{on++;}}}});
  jquery.fn={dataTable:{}};
  const factory=new Function('window','document','observedTable','observedWrapper',
    'let eventsBoundTable=null;' +
    'const FILTER_ID="x",PROCESSED_PENDING_FILTER_ID="y";' +
    'const scheduleRowRefresh=()=>{};const scheduleSync=()=>{};' +
    section('bindDataTableEvents','syncTable')+
    'return bindDataTableEvents;'
  );
  const bind=factory({jQuery:jquery},{getElementById:()=>({})},table,
    {querySelector:()=>({dataset:{rtPageLength500:"1"}})});
  assert.equal(bind(),true);
  assert.equal(bind(),true);
  assert.equal(off,1,'Binding must be idempotent');
  assert.equal(on,1,'Only one draw listener per table');
}
console.log('Lottery table mod: incremental DOM, deferred sizing and listeners regression OK');