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

async function setup({ mode = '', date = '24 oct 2026', viewport, hasTouch = false, deviceScaleFactor = 1 } = {}) {
  const page = await browser.newPage({ ...(viewport ? { viewport } : {}), hasTouch, deviceScaleFactor });
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
  await page.evaluate(({ mode, version }) => {
    window.GM_info = { script: { version } };
    window.externalRequests = [];
    window.queryReports = []; window.queryErrors = [];
    const originalTable = console.table.bind(console), originalError = console.error.bind(console);
    console.table = data => { window.queryReports.push(data); originalTable(data); };
    console.error = message => { window.queryErrors.push(message); originalError(message); };
    window.GM_xmlhttpRequest = options => {
      window.externalRequests.push(options.url);
      if (mode === 'unexpected') throw new Error('Fixture unexpected failure');
      setTimeout(() => {
        if (mode === 'network') return options.onerror();
        if (mode === 'timeout') return options.ontimeout();
        if (mode === 'cancelled') return options.onabort();
        if (mode === 'http') return options.onload({ status: 503, responseText: '' });
        if (mode === 'invalid') return options.onload({ status: 200, responseText: '{invalid json' });
        const url = new URL(options.url), game = url.searchParams.get('game-names');
        if (mode === 'pending' || (mode === 'partial' && game === 'CASH 4') || (mode === 'partial4' && game === 'CASH 3')) return options.onload({ status: 200, responseText: JSON.stringify({ draws: [] }) });
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
  }, { mode, version: require('../metadata.json').version });
  await page.addScriptTag({ content: script });
  const bar = page.locator('#rlur-bar');
  await bar.waitFor({ state: 'attached', timeout: 3000 });
  await page.locator('#rlur-toggle').click();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#rlur-bar')).transform === 'matrix(1, 0, 0, 1, 0, 0)');
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
    assert.equal(await r.page.locator('.rlur-version').textContent(), 'v' + require('../metadata.json').version);
    assert.equal(await r.page.locator('[data-lottery-id="wa-night"]').isVisible(), false);
    await r.page.locator('[data-category="NOCHE"]').click();
    assert.equal(await r.page.locator('[data-lottery-id="wa-night"]').isVisible(), true);
    assert.equal(await r.page.locator('[data-lottery-id="ga-am"]').isVisible(), false);
  } finally { await r.close(); }
});
for (const [mode, code, label] of [
  ['', 'success', 'Llenado completo'], ['partial', 'partial', 'Llenado parcial'],
  ['pending', 'pending', 'Resultado pendiente'], ['network', 'network', 'Sin conexión'],
  ['timeout', 'timeout', 'Tiempo agotado'], ['http', 'source_error', 'Fuente no disponible'],
  ['invalid', 'invalid_response', 'Respuesta inválida'], ['cancelled', 'cancelled', 'Consulta cancelada'],
  ['unexpected', 'error', 'Error inesperado']
]) test(`Iconos claros: ${code}`, async () => {
  const r = await setup({ mode }); try {
    await r.bind(); const button = await r.click('ga-am');
    assert.equal(await button.getAttribute('data-status-code'), code);
    assert.equal(await button.locator('.rlur-status svg').getAttribute('data-icon'), code);
    assert.match(await button.getAttribute('aria-label'), new RegExp(label));
    assert.match(await r.page.locator('#rlur-context').textContent(), new RegExp('Georgia Midday.*' + label));
    assert.equal(await r.page.locator('#rlur-context').getAttribute('role'), 'status');
    if (code === 'network') await r.page.locator('#rlur-bar').screenshot({ path: path.join(root, 'test-results', 'mensaje-red.png') });
  } finally { await r.close(); }
});
for (const [code, label] of [
  ['date_required', 'Fecha sin confirmar'], ['row_missing', 'Fila no visible'],
  ['row_duplicate', 'Fila duplicada'], ['fields_locked', 'Campos bloqueados'],
  ['context_changed', 'Fecha o servidor cambió'], ['table_missing', 'Tabla no disponible']
]) test(`Iconos claros: ${code}`, async () => {
  const r = await setup({ mode: code === 'context_changed' ? 'slow' : '' }); try {
    if (code !== 'date_required') await r.bind();
    if (code === 'row_missing') await r.page.getByPlaceholder('Buscar lotería', { exact: true }).fill('WASHINGTON');
    if (code === 'row_duplicate') await r.page.evaluate(() => { const row = document.querySelector('tr[data-code="GE-MD"]'); row.after(row.cloneNode(true)); });
    if (code === 'fields_locked') await r.page.locator('tr[data-code="GE-MD"] input').last().evaluate(el => el.readOnly = true);
    if (code === 'table_missing') await r.page.locator('table th').first().evaluate(el => el.textContent = 'Otra tabla');
    const button = r.page.locator('[data-lottery-id="ga-am"]');
    if (code === 'context_changed') {
      await button.click(); await r.page.evaluate(() => window.fixtureServer());
      await r.page.waitForFunction(() => document.querySelector('[data-lottery-id="ga-am"]').dataset.statusCode === 'context_changed');
    } else await r.click('ga-am');
    assert.equal(await button.getAttribute('data-status-code'), code);
    assert.equal(await button.locator('.rlur-status svg').getAttribute('data-icon'), code);
    assert.match(await r.page.locator('#rlur-context').textContent(), new RegExp(label));
    assert.deepEqual(await r.values('GE-MD'), Array(['row_missing', 'date_required'].includes(code) ? 0 : code === 'row_duplicate' ? 10 : 5).fill(''));
  } finally { await r.close(); }
});
test('Iconos claros: llenado no confirmado y tabla de Rover cargando', async () => {
  const r = await setup(); try {
    await r.bind(); await r.page.evaluate(() => window.fixtureIgnoreInput = true);
    const button = await r.click('ga-am');
    assert.equal(await button.getAttribute('data-status-code'), 'unconfirmed');
    assert.match(await r.page.locator('#rlur-context').textContent(), /Llenado no confirmado/);
    assert.equal(await r.page.locator('input.rlur-filled').count(), 0);
    await r.page.evaluate(() => { window.fixtureIgnoreInput = false; window.fixtureLoadDelay = 600; });
    await r.page.locator('form button[type="submit"]').click(); await r.click('ga-am');
    assert.equal(await button.getAttribute('data-status-code'), 'rover_loading');
    await r.page.waitForFunction(() => document.querySelector('#rlur-context').dataset.ready === 'true');
    assert.match(await r.page.locator('#rlur-context').textContent(), /Listo/);
    assert.equal(await button.getAttribute('data-status-code'), 'idle');
  } finally { await r.close(); }
});
test('Iconos claros: carga visible y limpieza al cambiar la fecha', async () => {
  const r = await setup({ mode: 'slow', viewport: { width: 390, height: 844 }, hasTouch: true }); try {
    await r.bind(); const button = r.page.locator('[data-lottery-id="ga-am"]'); await button.tap();
    assert.equal(await button.getAttribute('data-status-code'), 'loading');
    assert.equal(await button.getAttribute('aria-busy'), 'true');
    assert.match(await r.page.locator('#rlur-context').textContent(), /Consultando sorteo/);
    await r.page.waitForFunction(() => document.querySelector('[data-lottery-id="ga-am"]').dataset.statusCode === 'success');
    await r.page.locator('#rlur-bar').screenshot({ path: path.join(root, 'test-results', 'mensaje-mobile.png') });
    await r.page.evaluate(() => window.fixtureDate('23 oct 2026'));
    await r.page.waitForFunction(() => document.querySelector('[data-lottery-id="ga-am"]').dataset.statusCode === 'idle');
    assert.match(await r.page.locator('#rlur-context').textContent(), /Pulsa Buscar/);
    assert.equal(await button.locator('.rlur-status svg').count(), 0);
  } finally { await r.close(); }
});
test('Paridad visual: banderas, Día/Noche y navegación horizontal en el orden anterior', async () => {
  const r = await setup(); try {
    assert.match(await r.page.locator('[data-lottery-id="ga-am"]').textContent(), /🇺🇸/);
    const before = await r.page.locator('#rlur-bar').evaluate(el => getComputedStyle(el).borderTopColor);
    const first = await r.page.locator('[data-lottery-id="tn-morning"]').boundingBox();
    const second = await r.page.locator('[data-lottery-id="tx-morning"]').boundingBox();
    assert.ok(Math.abs(first.x - second.x) <= 1 && second.y > first.y, 'Orden por columnas como antes');
    assert.equal(await r.page.locator('.rlur-grid').evaluate(el => getComputedStyle(el).overflowX), 'auto');
    await r.page.locator('[data-category="NOCHE"]').click();
    assert.notEqual(await r.page.locator('#rlur-bar').evaluate(el => getComputedStyle(el).borderTopColor), before);
  } finally { await r.close(); }
});
test('Resaltado: cinco campos verdes y en negrita; restaura colores y conserva estado React', async () => {
  const r = await setup(); try {
    await r.bind();
    const inputs = r.page.locator('tr[data-code="GE-MD"] input');
    const colors = () => inputs.evaluateAll(nodes => nodes.map(el => { const s = getComputedStyle(el); return [s.backgroundColor, s.color]; }));
    const original = await colors();
    await r.click('ga-am');
    assert.deepEqual(await colors(), Array(5).fill(['rgb(209, 250, 229)', 'rgb(6, 95, 70)']));
    assert.ok(await inputs.evaluateAll(nodes => nodes.every(el => Number(getComputedStyle(el).fontWeight) >= 700)));
    assert.equal(await r.page.locator('tr[data-code="GE-NT"] .rlur-filled').count(), 0);
    await r.page.evaluate(() => window.fixtureRender());
    assert.deepEqual(await r.values('GE-MD'), ['27', '09', '87', '027', '0987']);
    await r.page.waitForFunction(() => !document.querySelector('input.rlur-fill-flash'), null, { timeout: 4000 });
    assert.deepEqual(await colors(), original, 'Restaurar el estilo del tema al acabar el verde');
    await inputs.nth(3).fill('123');
    assert.equal(await r.page.locator('tr[data-code="GE-MD"] .rlur-filled').count(), 0, 'Editar a mano elimina las marcas anteriores');
  } finally { await r.close(); }
});
for (const mode of ['partial', 'partial4']) test(`Resaltado parcial: ${mode} solo marca los campos que realmente se llenaron`, async () => {
  const r = await setup({ mode }); try {
    await r.bind(); await r.page.evaluate(() => window.fixtureValues('GE-MD', { segunda: '11', tercera: '22', pick4: '1122' }));
    await r.click('ga-am');
    assert.deepEqual(await r.page.locator('tr[data-code="GE-MD"] input').evaluateAll(nodes => nodes.map(el => el.classList.contains('rlur-filled'))), mode === 'partial' ? [true, false, false, true, false] : [false, true, true, false, true]);
    assert.equal(await r.page.locator('[data-lottery-id="ga-am"] .rlur-status').evaluate(el => getComputedStyle(el).color), 'rgb(180, 83, 9)', 'Advertencias naranjas, distintas de los errores');
    await r.page.evaluate(() => window.fixtureDate('23 oct 2026'));
    await r.page.waitForFunction(() => !document.querySelector('.rlur-filled'));
  } finally { await r.close(); }
});
test('Resaltado: restaura colores oscuros y reinicia el pulso al volver a llenar', async () => {
  const r = await setup(); try {
    await r.bind();
    await r.page.evaluate(() => {
      document.documentElement.classList.add('dark');
      for (const input of document.querySelectorAll('tr[data-code="GE-MD"] input')) { input.style.backgroundColor = '#1e293b'; input.style.color = '#f8fafc'; }
    });
    await r.click('ga-am'); await r.page.waitForTimeout(600); await r.click('ga-am');
    const inputs = r.page.locator('tr[data-code="GE-MD"] input');
    assert.ok(await inputs.evaluateAll(nodes => nodes.every(el => getComputedStyle(el).backgroundColor === 'rgb(209, 250, 229)')));
    await r.page.screenshot({ path: path.join(root, 'test-results', 'llenado-verde-dark.png') });
    await r.page.waitForFunction(() => !document.querySelector('input.rlur-fill-flash'));
    assert.ok(await inputs.evaluateAll(nodes => nodes.every(el => getComputedStyle(el).backgroundColor === 'rgb(30, 41, 59)' && getComputedStyle(el).color === 'rgb(248, 250, 252)')));
    assert.deepEqual(await r.values('GE-MD'), ['27', '09', '87', '027', '0987']);
  } finally { await r.close(); }
});
for (const mode of ['', 'pending', 'network']) test(`Registro completo: ${mode || 'llenado'}`, async () => {
  const r = await setup({ mode }); try {
    await r.bind(); const button = await r.click('ga-am');
    const reports = await r.page.evaluate(() => window.queryReports);
    assert.equal(reports.length, 1, 'Una tabla de diagnóstico por consulta, también sin resultado o con error');
    const report = reports[0];
    assert.equal(report.Fecha, '2026-10-24'); assert.equal(report.Sorteo, 'MIDDAY'); assert.equal(report.Código, 'GE-MD');
    assert.match(report.Hora, /\d{1,2}:\d{2}:\d{2}/);
    assert.ok('Cash 3' in report && 'Cash 4' in report && report.Fuente && report.Estado);
    assert.match(await button.getAttribute('title'), /2026-10-24.*MIDDAY/);
    if (mode === 'network') assert.equal(await r.page.evaluate(() => window.queryErrors.length), 1);
    if (mode) assert.equal(await r.page.locator('input.rlur-filled').count(), 0);
  } finally { await r.close(); }
});
async function dragEdge(page, edge, dx, dy) {
  const box = await page.locator(`[data-resize="${edge}"]`).boundingBox();
  assert.ok(box, `Borde ${edge} visible`);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  const viewport = page.viewportSize();
  await page.mouse.move(Math.max(1, Math.min(viewport.width - 1, x + dx)), Math.max(1, Math.min(viewport.height - 1, y + dy)), { steps: 8 }); await page.mouse.up();
}
async function panelBox(page) { return page.locator('#rlur-bar').boundingBox(); }
function assertInside(box, width, height) {
  assert.ok(box.x >= 0 && box.y >= 0, JSON.stringify(box));
  assert.ok(box.x + box.width <= width + 1 && box.y + box.height <= height + 1, JSON.stringify(box));
}
test('Tamaño: compacto inicial, borde superior y Compactar', async () => {
  const r = await setup(); try {
    const initial = await panelBox(r.page);
    assert.ok(initial.height <= 190, 'La barra debe abrir compacta');
    assert.ok(initial.x <= 1 && initial.width >= 1279, 'La barra ocupa toda la ventana de izquierda a derecha');
    const visibleCount = () => r.page.locator('[data-lottery-id]:not([hidden])').evaluateAll(nodes => nodes.filter(n => {
      const b = n.getBoundingClientRect(), g = n.parentElement.getBoundingClientRect(); return b.top >= g.top && b.bottom <= g.bottom && b.left >= g.left && b.right <= g.right;
    }).length);
    const before = await visibleCount();
    await dragEdge(r.page, 'n', 0, -200);
    await r.page.waitForFunction(() => Number(document.querySelector('.rlur-grid').style.getPropertyValue('--rlur-rows')) > 2);
    assert.ok((await panelBox(r.page)).height >= initial.height + 195);
    assert.ok(await visibleCount() > before, 'Más altura debe mostrar más botones completos');
    await r.page.getByRole('button', { name: 'Volver al tamaño compacto' }).click();
    assert.ok(Math.abs((await panelBox(r.page)).height - initial.height) <= 1);
  } finally { await r.close(); }
});
test('Tamaño: bordes, esquinas, teclado y límites de pantalla', async () => {
  const r = await setup(); try {
    const initial = await panelBox(r.page);
    await dragEdge(r.page, 'w', 180, 0); assert.ok((await panelBox(r.page)).width <= initial.width - 175);
    await dragEdge(r.page, 'nw', -100, -150); assert.ok((await panelBox(r.page)).height >= initial.height + 145);
    const before = await panelBox(r.page);
    await r.page.locator('[data-resize="n"]').focus(); await r.page.keyboard.press('ArrowDown');
    assert.ok((await panelBox(r.page)).height < before.height);
    await dragEdge(r.page, 'ne', 2000, -2000); assertInside(await panelBox(r.page), 1280, 720);
    await dragEdge(r.page, 'sw', 2000, 2000);
    const small = await panelBox(r.page); assertInside(small, 1280, 720); assert.ok(small.width >= 360 && small.height >= 150);
    await r.page.setViewportSize({ width: 320, height: 380 });
    await r.page.waitForTimeout(100); assertInside(await panelBox(r.page), 320, 380);
    await r.page.locator('.rlur-close').click();
    assert.equal(await r.page.locator('#rlur-bar').evaluate(el => el.inert), true);
    await r.page.locator('#rlur-toggle').click();
    await r.page.waitForFunction(() => getComputedStyle(document.querySelector('#rlur-bar')).transform === 'matrix(1, 0, 0, 1, 0, 0)');
    assertInside(await panelBox(r.page), 320, 380);
  } finally { await r.close(); }
});
for (const [label, viewport, scale, minFont] of [
  ['1080p', { width: 1920, height: 1080 }, 1, 14],
  ['4K al 100%', { width: 3840, height: 2160 }, 1, 18],
  ['4K al 200%', { width: 1920, height: 1080 }, 2, 14]
]) test(`Ancho completo y tipografía: ${label}`, async () => {
  const r = await setup({ viewport, deviceScaleFactor: scale }); try {
    const box = await panelBox(r.page);
    assert.ok(box.x <= 1 && Math.abs(box.width - viewport.width) <= 1);
    assert.ok(box.height <= 220, 'Conservar altura compacta');
    const typography = await r.page.locator('[data-lottery-id="ga-am"]').evaluate(el => {
      const s = getComputedStyle(el); return { font: parseFloat(s.fontSize), weight: Number(s.fontWeight), lineHeight: parseFloat(s.lineHeight) };
    });
    assert.ok(typography.font >= minFont, JSON.stringify(typography));
    assert.ok(typography.weight >= 500 && typography.lineHeight >= typography.font * 1.3);
    const grid = await r.page.locator('.rlur-grid').boundingBox();
    const controls = await r.page.locator('.rlur-controls').boundingBox();
    assert.ok(controls.x + controls.width <= grid.x + 1, 'Controles a la izquierda como la referencia');
    // Reservar 17 px extra simula el espacio de una barra clásica, sin depender del SO de pruebas.
    await r.page.locator('.rlur-grid').evaluate(el => el.style.paddingBottom = '19px');
    await r.page.waitForFunction(() => Number(document.querySelector('.rlur-grid').style.getPropertyValue('--rlur-rows')) >= 2);
    await r.page.locator('.rlur-grid').evaluate(el => el.style.paddingBottom = '');
    await r.page.getByRole('button', { name: 'Volver al tamaño compacto' }).click();
    assert.ok(Math.abs((await panelBox(r.page)).width - viewport.width) <= 1);
    await r.page.screenshot({ path: path.join(root, 'test-results', `barra-${label.replaceAll(' ', '-')}.png`), scale: 'css' });
    await r.page.locator('#rlur-bar').screenshot({ path: path.join(root, 'test-results', `panel-${label.replaceAll(' ', '-')}.png`), scale: 'css' });
  } finally { await r.close(); }
});
test('Móvil: compacto, controles táctiles, cuadrícula y ajuste con el dedo', async () => {
  const r = await setup({ viewport: { width: 390, height: 844 }, hasTouch: true }); try {
    const initial = await panelBox(r.page); assertInside(initial, 390, 844); assert.ok(initial.height <= 280);
    assert.notEqual(await r.page.evaluate(() => document.activeElement?.id), 'rlur-search', 'Abrir no debe activar el teclado móvil');
    for (const selector of ['#rlur-search', '[data-category="DIA"]', '[data-lottery-id="ga-am"]', '.rlur-close']) {
      assert.ok((await r.page.locator(selector).boundingBox()).height >= 44, `${selector} debe admitir pulsación táctil`);
    }
    assert.equal(await r.page.locator('#rlur-search').evaluate(el => getComputedStyle(el).fontSize), '16px');
    await r.page.locator('[data-category="NOCHE"]').tap();
    await r.page.locator('#rlur-search').fill('WST-NG');
    assert.equal(await r.page.locator('[data-lottery-id="wa-night"]').isVisible(), true);
    await r.page.locator('#rlur-search').fill('');
    const handle = r.page.locator('[data-resize="n"]'), box = await handle.boundingBox();
    assert.equal(await handle.evaluate(el => getComputedStyle(el).touchAction), 'none');
    const pointer = { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2, buttons: 1, bubbles: true };
    await handle.dispatchEvent('pointerdown', pointer);
    await handle.dispatchEvent('pointermove', { ...pointer, clientY: pointer.clientY - 180 });
    await handle.dispatchEvent('pointerup', { ...pointer, clientY: pointer.clientY - 180, buttons: 0 });
    assert.ok((await panelBox(r.page)).height >= initial.height + 175);
    await r.page.screenshot({ path: path.join(root, 'test-results', 'barra-mobile-alta.png') });
    await r.page.getByRole('button', { name: 'Volver al tamaño compacto' }).tap();
    assert.ok(Math.abs((await panelBox(r.page)).height - initial.height) <= 1);
    await r.page.screenshot({ path: path.join(root, 'test-results', 'barra-mobile-compacta.png') });
    await r.page.setViewportSize({ width: 844, height: 390 }); await r.page.waitForTimeout(100);
    assertInside(await panelBox(r.page), 844, 390);
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
    const b = await r.click('ga-am'); assert.equal(await b.getAttribute('data-status-code'), 'fields_locked');
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
