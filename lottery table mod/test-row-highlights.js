const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('Rs-loteria-res-tabla-mod.user.js', 'utf8');

assert.match(source, /^\/\/ @version\s+1\.6\.24$/m);
assert.match(source, /const BLUE_HIGHLIGHT_CLASS = "rt-row-soft-blue"/);
assert.match(source, /"WASHINGTON NIGHT\|WST-NG"/);
assert.match(source, /--rt-highlight-blue: #e8f2ff;/);
assert.match(source, /--rt-highlight-blue-hover: #d9eaff;/);
assert.match(source, /--rt-highlight-blue-edge: #8bb6e8;/);
assert.match(source, /#tableResult tbody tr\.\$\{BLUE_HIGHLIGHT_CLASS\} > td\{/);
assert.match(source, /#tableResult tbody tr\.\$\{BLUE_HIGHLIGHT_CLASS\}:hover > td\{/);
assert.match(source, /#tableResult tbody tr\.\$\{BLUE_HIGHLIGHT_CLASS\} > td:first-child\{/);

const globals = source.slice(
  source.indexOf('  const HIGHLIGHT_CLASS ='),
  source.indexOf('  function ensureStyle()')
);
const highlighter = source.slice(
  source.indexOf('  function highlightSelectedRows()'),
  source.indexOf('  function ensureProcNoX()')
);
let rows = [];
const fakeDocument = {querySelectorAll: (selector) => {
  assert.equal(selector, '#tableResult tbody tr');
  return rows;
}};
const highlight = new Function('document',globals+highlighter+'return highlightSelectedRows')(fakeDocument);
function row(name,abbr) {
  const classes = new Set();
  return {
    classList: {
      toggle: (cls,enabled) => enabled ? classes.add(cls) : classes.delete(cls),
      contains: (cls) => classes.has(cls)
    },
    querySelector: (selector) => ({
      'td:nth-child(2) .loteria-nombre': {textContent:name},
      'td:nth-child(2) .loteria-abrev': {textContent:abbr}
    })[selector] || null
  };
}
const candidates = [
  ['WASHINGTON NIGHT','[WST-NG]',false,true],
  ['washington   night','WST-NG',false,true],
  ['GEORGIA NIGHT','GE-NT',true,false],
  ['TEXAS NIGHT','TX-NIGHT',true,false],
  ['ARIZONA','AZ',true,false],
  ['CALIFORNIA EVE','CA-EVEN',true,false],
  ['WASHINGTON DAY','WST-DY',false,false],
  ['WASHINGTON NIGHT','WST-DY',false,false],
  ['','',false,false]
];
rows = candidates.map(([name,abbr]) => row(name,abbr));
highlight();
for (let i=0;i<candidates.length;i++) {
  assert.equal(rows[i].classList.contains('rt-row-soft-red'), candidates[i][2]);
  assert.equal(rows[i].classList.contains('rt-row-soft-blue'), candidates[i][3]);
}
highlight(); // Idempotencia: conserva las clases correctas en sucesivos draw de DataTables.
for (let i=0;i<candidates.length;i++) {
  assert.equal(rows[i].classList.contains('rt-row-soft-blue'), candidates[i][3]);
}
rows[0] = row('WASHINGTON NIGHT','WST-DY');
highlight();
assert.equal(rows[0].classList.contains('rt-row-soft-blue'), false);
console.log('Lottery table mod: Washington Night blue highlight regression OK');