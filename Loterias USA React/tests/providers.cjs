const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'Rovs-Loterias-USA-React.user.js');
const script = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
assert.match(script, /@name\s+Rovs Loterias USA React 0\.0\.1/, 'Falta el userscript independiente');
const dom = new JSDOM('');
Object.defineProperty(dom.window.HTMLElement.prototype, 'innerText', { get() { return this.textContent; } });
const ctx = vm.createContext({ console, URL, Date, Intl, DOMParser: dom.window.DOMParser, GM_xmlhttpRequest() { throw Error('No network expected in parser tests'); } });
const modules = ['config.js', 'helpers.js', 'providers.js'].map(f => fs.readFileSync(path.join(root, 'src', f), 'utf8')).join('\n');
vm.runInContext(modules + '\nthis.api={LOTERIAS,PROVIDERS,parseGeorgiaGame,parseIllinoisGame,parseLotteryUSA,parseCentralDate};', ctx);
const { api } = ctx;
assert.equal(api.LOTERIAS.length, 75);
assert.equal(new Set(api.LOTERIAS.map(c => c.codigo)).size, 75);
assert.ok(api.LOTERIAS.every(c => c.codigo && c.nombreFila && api.PROVIDERS[c.fuente]));
const wa = api.LOTERIAS.find(c => c.id === 'wa-night');
assert.equal(wa.codigo, 'WST-NG'); assert.equal(wa.url4, null);
assert.equal(api.LOTERIAS[api.LOTERIAS.findIndex(c => c.id === 'ia-pm') + 1].id, 'wa-night');
for (const [text, expected] of [['24 oct 2026','2026-10-24'],['1 ene 2026','2026-01-01'],['30 sept 2026','2026-09-30']]) {
  const d = api.parseCentralDate(text); assert.ok(d); assert.equal([d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'), expected);
}
for (const text of ['', '31 feb 2026', 'ayer', '10/11/2026']) assert.equal(api.parseCentralDate(text), null);
const fixture = f => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');
const date = new Date(2026, 9, 7);
assert.equal(api.parseGeorgiaGame(JSON.parse(fixture('ga-cash3-full.json')), date, 'MIDDAY', 3), '847');
assert.equal(api.parseGeorgiaGame(JSON.parse(fixture('ga-cash4-full.json')), date, 'MIDDAY', 4), '1251');
for (const [game, digits, expected] of [['pick3',3,'027'],['pick4',4,'0987']]) {
  const doc = new dom.window.DOMParser().parseFromString(fixture(`il-${game}.html`), 'text/html');
  assert.equal(api.parseIllinoisGame(doc, new Date(2026,9,18), 'MIDDAY', digits), expected);
}
const result = api.parseLotteryUSA(fixture('wa-pick3.html'), new Date(2026,9,12), wa, true, 'P3');
assert.equal(result.p3, '035'); assert.equal(result.p4, null);
dom.window.close();
console.log('PASS proveedores: 75 identidades, orden, fecha estricta, Georgia, Illinois y Washington con respuestas oficiales');
