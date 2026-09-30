const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('Rs-loteria-res-tabla-mod.user.js', 'utf8');

assert.match(source, /^\/\/ @version\s+1\.6\.21$/m);
assert.ok(source.includes('const LAYOUT_SETTLE_MS = 180;'));
assert.ok(source.includes('const LAYOUT_MAX_WAIT_MS = 900;'));
assert.ok(source.includes('new ResizeObserver((entries) => {'));
assert.ok(source.includes('scheduleStableLayoutAdjust("ancho wrapper estable")'));
assert.ok(source.includes('scheduleStableLayoutAdjust("window resize")'));
assert.ok(source.includes('const SIDEBAR_SUPPRESS_MS = 260;'));
assert.ok(source.includes('function prepareSidebarToggleAdjust()'));
assert.ok(source.includes('applyDataTableColumnAdjust("sidebar toggle · first frame")'));
assert.ok(source.includes('event.target?.closest?.(".open-close")'));
assert.ok(source.includes('}, true);'));
assert.ok(source.includes('-webkit-transition: none !important;'));
assert.ok(source.includes('transition: none !important;'));
assert.ok(source.includes('if (sidebarAdjustSuppressed()) return;'));
assert.equal(source.includes('.on("column-sizing.dt.rtLotteryMod'), false);
assert.equal(source.includes('responsive-resize.dt.rtLotteryMod'), false);
assert.equal((source.match(/dt\.columns\.adjust\(\)/g) || []).length, 1);
assert.equal(source.includes('setTimeout(() => {\n          adjustTimer'), false);

const raw = 'https://raw.githubusercontent.com/Nox1do/rover-lottery/main/lottery%20table%20mod/Rs-loteria-res-tabla-mod.user.js';
assert.ok(source.includes('// @updateURL    ' + raw));
assert.ok(source.includes('// @downloadURL  ' + raw));

console.log('Lottery table mod: sidebar first-frame synchronization regression OK');
