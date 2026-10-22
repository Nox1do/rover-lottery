const assert = require('node:assert/strict');
const fs = require('node:fs');
const src = fs.readFileSync('Rs-loteria-res-tabla-mod.user.js', 'utf8');
assert.match(src,/^\/\/ @version\s+1\.6\.26$/m);
new Function(src);
const start=src.indexOf('  function requiresScrollColumnAlignment(');
const end=src.indexOf('  function scheduleStableLayoutAdjust(',start);
assert.ok(start>=0&&end>start);
const section=src.slice(start,end);
const make=new Function('IS_FIREFOX','observedWrapper','cancelScheduledAdjust',
  'cancelStableLayoutTimers','scheduleStableLayoutAdjust','perf',
  section+'return {fast:useNativeFirefoxTableLayout,click:prepareSidebarToggleAdjust}');
function scenario(isFirefox,scroll){
  const calls={cancel:0,timers:0,scheduled:[],perf:{sidebarFastPaths:0}};
  const api=make(isFirefox,{querySelector:()=>scroll?{}:null},
    ()=>calls.cancel++,()=>calls.timers++,reason=>calls.scheduled.push(reason),calls.perf);
  api.click();return {api,calls};
}
let x=scenario(true,false);
assert.equal(x.api.fast(),true);
assert.equal(x.calls.cancel,1);
assert.equal(x.calls.timers,1);
assert.equal(x.calls.perf.sidebarFastPaths,1);
assert.deepEqual(x.calls.scheduled,[],'Firefox plain table needs no extra sidebar recalculation');
x=scenario(true,true);
assert.equal(x.api.fast(),false);
assert.equal(x.calls.timers,0);
assert.deepEqual(x.calls.scheduled,['sidebar · ancho estable']);
x=scenario(false,false);
assert.equal(x.api.fast(),false);
assert.deepEqual(x.calls.scheduled,['sidebar · ancho estable']);
assert.ok(src.includes('(!IS_FIREFOX || requiresScrollColumnAlignment(wrapper))'));
assert.ok(src.includes('if (!useNativeFirefoxTableLayout())'));
assert.ok(src.includes('const DEFAULT_PAGE_LENGTH = 500;'));
console.log('Lottery table mod: Firefox sidebar fast path and scroll fallback OK');