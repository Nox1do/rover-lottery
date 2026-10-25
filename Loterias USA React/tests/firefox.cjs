const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const http = require('node:http');
const { firefox } = require('playwright');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const scriptPath = path.join(root, 'Rovs-Loterias-USA-React.user.js');
const script = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, 'utf8') : '';
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
let browser, server, origin;

async function setup({ mode = '', date = '24 oct 2026' } = {}) {
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(10000);
  page.on('pageerror', error => console.error('FIXTURE PAGE ERROR', error.message));
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) requests.push(request.url());
  });
  await page.goto(origin + '/loteria/resultados/ver', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.fixtureDate === 'function');
  if (date !== '24 oct 2026') await page.evaluate(date => window.fixtureDate(date), date);
  await page.evaluate(mode => {
    window.GM_info = { script: { version: '0.0.1' } };
    window.externalRequests = [];
    window.GM_xmlhttpRequest = options => {
      window.externalRequests.push(options.url);
      setTimeout(() => {
        if (mode === 'network') return options.onerror();
        if (mode === 'timeout') return options.ontimeout();
        const url = new URL(options.url), game = url.searchParams.get('game-names');
        if (mode === 'pending' || (mode === 'partial' && game === 'CASH 4')) return options.onload({ status: 200, responseText: JSON.stringify({ draws: [] }) });
        if (url.hostname === 'gas-v2.p1.awc.lotteryservices.net') {
          const is3 = game === 'CASH 3';
          const draws = ['MIDDAY', 'NIGHT'].map((name, i) => ({ id: i + 1, gameName: game, name, status: 'CLOSED', drawTime: Date.parse('2026-10-24T17:00:00Z'), results: [{ drawType: 'Regular', primary: (is3 ? '027' : '0987').split('') }] }));
          return options.onload({ status: 200, responseText: JSON.stringify({ draws }) });
        }
        if (url.hostname === 'www.lotteryusa.com') return options.onload({ status: 200, responseText: '<table><tbody><tr><td><time>Saturday, Oct 24, 2026</time></td><td><i class="c-ball">0</i><i class="c-ball">3</i><i class="c-ball">5</i></td></tr></tbody></table>' });
        options.onerror();
      }, mode === 'slow' ? 200 : 0);
      return { abort() {} };
    };
  }, mode);
  await page.addScriptTag({ content: script });
  const bar = page.locator('#rlur-bar');
  await bar.waitFor({ timeout: 3000 });
  await page.locator('#rlur-toggle').click();
  return {
    page, requests,
    async bind() { await page.locator('form button[type="submit"]').click(); await page.waitForFunction(() => document.querySelector('#rlur-context')?.dataset.ready === 'true'); },
    async click(id) { const b = page.locator(`[data-lottery-id="${id}"]`); await b.click(); await page.waitForFunction(id => document.querySelector(`[data-lottery-id="${id}"]`)?.dataset.status !== 'loading', id); return b; },
    async values(code) { return page.locator(`tr[data-code="${code}"] input`).evaluateAll(inputs => inputs.map(input => input.value)); },
    async close() { assert.deepEqual(requests, [], 'El userscript no debe llamar APIs de Rover'); assert.equal(await page.evaluate(() => window.processClicks || 0), 0); await page.close(); }
  };
}

test('Barra nativa independiente: 75 botones, versión y categoría', async () => {
  const r = await setup(); try {
    assert.equal(await r.page.locator('[data-lottery-id]').count(), 75);
    assert.equal(await r.page.locator('.rlur-version').textContent(), 'v0.0.1');
    assert.equal(await r.page.locator('[data-lottery-id="wa-night"]').isVisible(), false);
    await r.page.locator('[data-category="NOCHE"]').click();
    assert.equal(await r.page.locator('[data-lottery-id="wa-night"]').isVisible(), true);
    assert.equal(await r.page.locator('[data-lottery-id="ga-am"]').isVisible(), false);
  } finally { await r.close(); }
});
test('Sin Buscar: rechaza la consulta y no inventa la fecha de hoy', async () => {
  const r = await setup(); try { await r.click('ga-am'); assert.equal(await r.page.evaluate(() => window.externalRequests.length), 0); } finally { await r.close(); }
});
test('Firefox + React 19.3.1: estado real, ceros y dependiente después de otro render', async () => {
  const r = await setup(); try {
    await r.bind(); const b = await r.click('ga-am'); assert.equal(await b.getAttribute('data-status'), 'success');
    await r.page.evaluate(() => window.fixtureRender());
    assert.deepEqual(await r.values('GE-MD'), ['27', '09', '87', '027', '0987']);
    assert.deepEqual(await r.page.evaluate(() => window.fixtureState['GE-MD']), { primera: '27', segunda: '09', tercera: '87', pick3: '027', pick4: '0987' });
    assert.deepEqual(await r.values('GE-MD-MR'), ['27', '09', '87', '027', '0987']);
    assert.deepEqual(await r.values('GE-NT'), Array(5).fill(''));
  } finally { await r.close(); }
});
test('Solo Pick 3: Washington estado no toca Pick 4 ni D.C.', async () => {
  const r = await setup(); try {
    await r.bind(); await r.page.evaluate(() => window.fixtureValues('WST-NG', { segunda: '11', tercera: '22', pick4: '1122' }));
    await r.page.locator('[data-category="NOCHE"]').click(); await r.click('wa-night');
    assert.deepEqual(await r.values('WST-NG'), ['35', '11', '22', '035', '1122']);
    assert.deepEqual(await r.values('DC-NG'), Array(5).fill(''));
  } finally { await r.close(); }
});
test('Cambio de fecha en vuelo: descarta el resultado', async () => {
  const r = await setup({ mode: 'slow' }); try {
    await r.bind(); await r.page.locator('[data-lottery-id="ga-am"]').click();
    await r.page.evaluate(() => window.fixtureDate('23 oct 2026'));
    await r.page.waitForTimeout(450); assert.deepEqual(await r.values('GE-MD'), Array(5).fill(''));
    assert.notEqual(await r.page.locator('[data-lottery-id="ga-am"]').getAttribute('data-status'), 'success');
  } finally { await r.close(); }
});
test('Cambio de servidor en vuelo: descarta el resultado', async () => {
  const r = await setup({ mode: 'slow' }); try {
    await r.bind(); await r.page.locator('[data-lottery-id="ga-am"]').click(); await r.page.evaluate(() => window.fixtureServer());
    await r.page.waitForTimeout(450); assert.deepEqual(await r.values('GE-MD'), Array(5).fill(''));
  } finally { await r.close(); }
});
test('Fecha cambiada sin Buscar: no consulta con la tabla anterior', async () => {
  const r = await setup(); try {
    await r.bind(); await r.page.evaluate(() => window.fixtureDate('23 oct 2026')); await r.click('ga-am');
    assert.equal(await r.page.evaluate(() => window.externalRequests.length), 0);
  } finally { await r.close(); }
});
test('Filtro oculta la fila: muestra aviso y protege las demás', async () => {
  const r = await setup(); try {
    await r.bind(); await r.page.getByPlaceholder('Buscar lotería', { exact: true }).fill('WASHINGTON');
    const b = await r.click('ga-am'); assert.notEqual(await b.getAttribute('data-status'), 'success');
    assert.deepEqual(await r.values('WST-NG'), Array(5).fill(''));
  } finally { await r.close(); }
});
test('Resultado parcial: conserva Pick 4 existente y avisa', async () => {
  const r = await setup({ mode: 'partial' }); try {
    await r.bind(); await r.page.evaluate(() => window.fixtureValues('GE-MD', { segunda: '11', tercera: '22', pick4: '1122' }));
    const b = await r.click('ga-am'); assert.equal(await b.getAttribute('data-status'), 'warning');
    assert.deepEqual(await r.values('GE-MD'), ['27', '11', '22', '027', '1122']);
  } finally { await r.close(); }
});
test('Identidad duplicada: rechaza la fila antes de consultar la fuente', async () => {
  const r = await setup(); try {
    await r.bind(); await r.page.evaluate(() => { const row = document.querySelector('tr[data-code="GE-MD"]'); row.after(row.cloneNode(true)); });
    const b = await r.click('ga-am'); assert.equal(await b.getAttribute('data-status'), 'error');
    assert.equal(await r.page.evaluate(() => window.externalRequests.length), 0);
  } finally { await r.close(); }
});
test('Campo de solo lectura: rechaza el llenado completo antes de consultar', async () => {
  const r = await setup(); try {
    await r.bind(); await r.page.locator('tr[data-code="GE-MD"] input').last().evaluate(el => el.readOnly = true);
    const b = await r.click('ga-am'); assert.equal(await b.getAttribute('data-status'), 'error');
    assert.equal(await r.page.evaluate(() => window.externalRequests.length), 0);
    assert.deepEqual(await r.values('GE-MD'), Array(5).fill(''));
  } finally { await r.close(); }
});
test('Buscar otra vez durante consulta: invalida también una respuesta de la misma fecha', async () => {
  const r = await setup({ mode: 'slow' }); try {
    await r.bind(); await r.page.locator('[data-lottery-id="ga-am"]').click(); await r.bind();
    await r.page.waitForTimeout(300); assert.deepEqual(await r.values('GE-MD'), Array(5).fill(''));
  } finally { await r.close(); }
});
for (const mode of ['network', 'timeout', 'pending']) test(`${mode}: no modifica la tabla`, async () => {
  const r = await setup({ mode }); try { await r.bind(); await r.click('ga-am'); assert.deepEqual(await r.values('GE-MD'), Array(5).fill('')); } finally { await r.close(); }
});
test('Tema oscuro y navegación SPA: no duplica ni deja la barra fuera de la ruta', async () => {
  const r = await setup(); try {
    await r.page.evaluate(() => document.documentElement.classList.add('dark'));
    const background = await r.page.locator('#rlur-bar').evaluate(el => getComputedStyle(el).backgroundColor);
    assert.equal(background, 'rgb(15, 23, 42)');
    await r.page.screenshot({ path: path.join(root, 'test-results', 'barra-dark.png') });
    await r.page.evaluate(() => { history.pushState({}, '', '/otra-pantalla'); document.querySelector('#root').append(document.createElement('span')); });
    await r.page.waitForFunction(() => document.querySelector('#rlur-bar')?.hidden);
    await r.page.evaluate(() => { history.pushState({}, '', '/loteria/resultados/ver'); document.querySelector('#root').append(document.createElement('span')); });
    await r.page.waitForFunction(() => !document.querySelector('#rlur-bar')?.hidden);
    assert.equal(await r.page.locator('#rlur-bar').count(), 1);
    await r.page.evaluate(() => document.documentElement.classList.remove('dark'));
    await r.page.screenshot({ path: path.join(root, 'test-results', 'barra-light.png') });
  } finally { await r.close(); }
});

(async () => {
  const fixture = await esbuild.build({ entryPoints: [path.join(__dirname, 'fixture.jsx')], bundle: true, write: false, define: { 'process.env.NODE_ENV': '"production"' } });
  server = http.createServer((req, res) => {
    if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(fixture.outputFiles[0].text); }
    if (req.url.startsWith('/api/')) { res.statusCode = 500; return res.end('No API requests are allowed in this fixture'); }
    res.setHeader('Content-Type', 'text/html');
    res.end('<html><head><style>:root{--card:#fff;--foreground:#0f172a;--border:#cbd5e1;--muted:#f1f5f9;--muted-foreground:#64748b;--primary:#0f172a;--primary-foreground:#fff;--radius:8px}.dark{--card:#0f172a;--foreground:#f8fafc;--border:#334155;--muted:#1e293b;--muted-foreground:#94a3b8;--primary:#f8fafc;--primary-foreground:#0f172a}body{font-family:Arial;margin:24px}td,th{padding:5px}input{width:70px}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
  let failed = 0;
  try {
    const launch = { headless: true };
    if (process.env.ROVS_FIREFOX_CONTAINER === '1') {
      launch.firefoxUserPrefs = { 'security.sandbox.content.level': 0, 'security.sandbox.rdd.level': 0, 'security.sandbox.socket.process.level': 0, 'media.rdd-process.enabled': false, 'media.utility-process.enabled': false };
      launch.env = { ...process.env, MOZ_DISABLE_CONTENT_SANDBOX: '1', MOZ_DISABLE_RDD_SANDBOX: '1', MOZ_DISABLE_SOCKET_PROCESS_SANDBOX: '1', MOZ_DISABLE_GPU_SANDBOX: '1', MOZ_DISABLE_GMP_SANDBOX: '1' };
    }
    browser = await firefox.launch(launch);
    console.log('Firefox', browser.version(), '+ React', require('react/package.json').version);
    const selectedTests = tests.filter(t => !process.env.TEST_FILTER || t.name.includes(process.env.TEST_FILTER));
    for (const { name, fn } of selectedTests) {
      try { await fn(); console.log('PASS', name); }
      catch (error) { failed++; console.error('FAIL', name, '\n', error.message); }
    }
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
  const count = tests.filter(t => !process.env.TEST_FILTER || t.name.includes(process.env.TEST_FILTER)).length;
  console.log(`${count - failed}/${count} Firefox tests passed`); process.exitCode = failed ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; server?.close(); });
