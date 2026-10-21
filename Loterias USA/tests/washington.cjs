const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const source = fs.readFileSync(process.argv[2], 'utf8');
const fixture = fs.readFileSync(`${__dirname}/fixtures/wa-pick3.html`, 'utf8');
const tests = [], contexts = [];
const test = (name, run) => tests.push({ name, run });

function setup({ date = '10/20/2026', mode = '' } = {}) {
  const dom = new JSDOM(`<input id="fecha" value="${date}"><table><tbody>
    <tr id="WA"><td>WASHINGTON NIGHT <span>WST-NG</span></td>${'<td><input type="text" value="old"></td>'.repeat(5)}</tr>
    <tr id="DC"><td>WASHINGTON D.C NIGHT</td>${'<td><input type="text" value="dc"></td>'.repeat(5)}</tr>
    <tr id="IOWA"><td>IOWA EVENING</td>${'<td><input type="text" value="iowa"></td>'.repeat(5)}</tr>
    </tbody></table>`, { url: 'https://roversport.lol/adm/es/lottery.php', runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  contexts.push(dom);
  const w = dom.window, requests = [];
  Object.defineProperty(w.document, 'readyState', { value: 'complete' });
  Object.defineProperty(w.HTMLElement.prototype, 'innerText', { get() { return this.textContent; }, set(value) { this.textContent = value; } });
  w.GM_xmlhttpRequest = options => {
    requests.push(options.url);
    w.setTimeout(() => {
      if (mode === 'http') return options.onload({ status: 403, responseText: '' });
      const url = new URL(options.url);
      if (url.hostname !== 'www.lotteryusa.com') return options.onerror();
      if (url.pathname === '/washington/daily/') return options.onload({ status: 200, responseText: mode === 'fallback' ? '<table></table>' : fixture });
      if (url.pathname === '/washington/') return options.onload({ status: 200, responseText: mode === 'fallback'
        ? '<div class="c-result-card"><a href="/washington/daily-keno/">Keno</a><time>Oct 20, 2026</time><li class="c-ball">1</li><li class="c-ball">2</li><li class="c-ball">3</li></div><div class="c-result-card"><a href="/washington/daily/">Pick 3</a><time>Oct 20, 2026</time><li class="c-ball">0</li><li class="c-ball">3</li><li class="c-ball">5</li></div>'
        : '<html></html>' });
      options.onerror();
    }, 0);
  };
  w.eval(source);
  const button = [...w.document.querySelectorAll('.gm-loto-btn')].find(b => b.innerText.startsWith('🇺🇸 Washington Night'));
  const values = id => [...w.document.querySelectorAll('#' + id + ' input')].map(i => i.value);
  const click = async () => {
    assert.ok(button, 'Falta el botón de Washington estado'); button.click();
    const start = Date.now();
    while (button.querySelector('.gm-status-icon').classList.contains('gm-loading')) {
      if (Date.now() - start > 2500) throw Error('La consulta no terminó');
      await new Promise(resolve => setTimeout(resolve, 5));
    }
  };
  return { w, requests, button, values, click, status: () => button.querySelector('.gm-status-icon').innerText };
}

test('Washington Night aparece después de Iowa Evening y solo en Noche', () => {
  const r = setup(); assert.ok(r.button, 'Falta Washington Night');
  const buttons = [...r.w.document.querySelectorAll('.gm-loto-btn')];
  const iowa = buttons.findIndex(b => b.innerText.includes('Iowa Evening'));
  assert.equal(buttons[iowa + 1], r.button);
  assert.equal(r.button.classList.contains('visible-cat'), false);
  [...r.w.document.querySelectorAll('.gm-tab-btn')].find(b => b.innerText.includes('NOCHE')).click();
  assert.equal(r.button.classList.contains('visible-cat'), true);
});
test('Pick 3 real: llena WASHINGTON NIGHT / WST-NG sin tocar Pick 4 ni Washington D.C.', async () => {
  const r = setup(); await r.click();
  assert.deepEqual(r.values('WA'), ['84', 'old', 'old', '484', 'old']);
  assert.deepEqual(r.values('DC'), Array(5).fill('dc'));
  assert.deepEqual(r.values('IOWA'), Array(5).fill('iowa'));
  assert.equal(r.status(), '✅'); assert.equal(r.requests.length, 1);
  assert.equal(new URL(r.requests[0]).pathname, '/washington/daily/');
});
test('Historial real: conserva el cero inicial de Pick 3', async () => {
  const r = setup({ date: '10/12/2026' }); await r.click();
  assert.deepEqual(r.values('WA'), ['35', 'old', 'old', '035', 'old']); assert.equal(r.status(), '✅');
});
test('Sorteo pendiente: no utiliza el resultado del día anterior', async () => {
  const r = setup({ date: '10/21/2026' }); await r.click();
  assert.deepEqual(r.values('WA'), Array(5).fill('old')); assert.equal(r.status(), '⛔');
});
test('Portada de respaldo: identifica Pick 3 por enlace y excluye Daily Keno', async () => {
  const r = setup({ mode: 'fallback' }); await r.click();
  assert.deepEqual(r.values('WA'), ['35', 'old', 'old', '035', 'old']); assert.equal(r.status(), '✅');
  assert.deepEqual(r.requests.map(url => new URL(url).pathname), ['/washington/daily/', '/washington/']);
});
test('HTTP 403: informa error sin modificar el formulario', async () => {
  const r = setup({ mode: 'http' }); await r.click();
  assert.deepEqual(r.values('WA'), Array(5).fill('old')); assert.equal(r.status(), '❌');
});

(async () => {
  let failed = 0;
  try {
    for (const entry of tests) {
      try { await entry.run(); console.log('PASS', entry.name); }
      catch (error) { failed++; console.error('FAIL', entry.name, '\n', error.message); }
    }
  } finally { contexts.forEach(dom => dom.window.close()); }
  console.log(`${tests.length - failed}/${tests.length} passed`); process.exitCode = failed ? 1 : 0;
})();
