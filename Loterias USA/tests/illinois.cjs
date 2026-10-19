const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const source = fs.readFileSync(process.argv[2], 'utf8');
const fixture = game => fs.readFileSync(`${__dirname}/fixtures/il-${game}.html`, 'utf8');
const tests = [], contexts = [];
const test = (name, run) => tests.push({ name, run });

function edit(html, change) {
  const dom = new JSDOM(html);
  try { change(dom.window.document); return dom.serialize(); }
  finally { dom.window.close(); }
}

function setup({ date = '10/18/2026', pick3 = fixture('pick3'), pick4 = fixture('pick4'), mode = '', missingRow = false } = {}) {
  process.env.TZ = 'Asia/Tokyo';
  const dom = new JSDOM(`<input id="fecha" value="${date}"><table><tbody>${['MIDDAY', 'EVENING'].map(draw =>
    `<tr id="${draw}"><td>${missingRow ? 'OTHER' : 'ILLINOIS ' + draw}</td>${'<td><input type="text" value="old"></td>'.repeat(5)}</tr>`).join('')}
    <tr id="OTHER"><td>INDIANA MIDDAY</td>${'<td><input type="text" value="other"></td>'.repeat(5)}</tr></tbody></table>`,
    { url: 'https://roversport.lol/adm/es/lottery.php', runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  contexts.push(dom);
  const w = dom.window, requests = [], logs = [], events = [];
  Object.defineProperty(w.document, 'readyState', { value: 'complete' });
  Object.defineProperty(w.HTMLElement.prototype, 'innerText', { get() { return this.textContent; }, set(value) { this.textContent = value; } });
  w.console.table = log => logs.push(log);
  for (const input of w.document.querySelectorAll('#MIDDAY input')) {
    for (const event of ['input', 'change', 'blur']) input.addEventListener(event, () => events.push(event));
  }
  w.GM_xmlhttpRequest = options => {
    requests.push(options);
    w.setTimeout(() => {
      if (mode === 'date-change') w.document.querySelector('#fecha').value = '10/17/2026';
      if (mode === 'network') return options.onerror();
      if (mode === 'timeout') return options.ontimeout();
      if (mode === 'abort') return options.onabort();
      if (mode === 'http') return options.onload({ status: 403, responseText: '' });
      const url = new URL(options.url), game = url.pathname.split('/').pop();
      if (url.origin !== 'https://mapp.illinoislottery.com' || !['pick3', 'pick4'].includes(game)) return options.onerror();
      let html = game === 'pick3' ? pick3 : pick4;
      if (mode === 'login') html = '<html><body><form>Sign in</form></body></html>';
      options.onload({ status: 200, responseText: html });
    }, 0);
  };
  w.eval(source);
  const button = draw => [...w.document.querySelectorAll('.gm-loto-btn')].find(b => b.innerText.includes('Illinois ' + draw));
  const values = row => [...w.document.querySelectorAll('#' + row + ' input')].map(input => input.value);
  const click = async draw => {
    button(draw).click();
    const started = Date.now();
    while (button(draw).querySelector('.gm-status-icon').classList.contains('gm-loading')) {
      if (Date.now() - started > 2500) throw Error('La consulta no terminó');
      await new Promise(resolve => setTimeout(resolve, 5));
    }
  };
  return { w, requests, logs, events, button, values, click, status: draw => button(draw).querySelector('.gm-status-icon').innerText };
}

// These tests fail if Illinois still uses LotteryUSA, swaps draws, loses zeros,
// includes Fireball, or writes values belonging to a different date/game/row.
for (const [draw, expected] of [
  ['Midday', ['27', '09', '87', '027', '0987']],
  ['Evening', ['72', '86', '26', '272', '8626']]
]) test(`${draw}: fuente oficial, ceros iniciales, Fireball excluido y fila correcta`, async () => {
  const r = setup(); await r.click(draw);
  assert.deepEqual(r.values(draw.toUpperCase()), expected);
  assert.equal(r.status(draw), '✅');
  assert.deepEqual(r.values(draw === 'Midday' ? 'EVENING' : 'MIDDAY'), Array(5).fill('old'));
  assert.deepEqual(r.values('OTHER'), Array(5).fill('other'));
  assert.equal(r.logs.at(-1).Fuente.valor, '📱 App oficial Illinois Lottery');
  assert.equal(r.requests.length, 2);
  for (const request of r.requests) {
    const url = new URL(request.url);
    assert.equal(url.origin, 'https://mapp.illinoislottery.com');
    assert.match(url.pathname, /^\/dbg\/results\/pick[34]$/);
    assert.equal(url.searchParams.get('dateFrom'), '2026-10-18');
    assert.equal(url.searchParams.get('dateTo'), '2026-10-18');
    assert.ok(url.searchParams.get('_'));
    assert.equal(request.method, 'GET'); assert.equal(request.anonymous, true);
    assert.equal(request.timeout, 20000);
    assert.equal(request.headers?.Authorization, undefined);
  }
});

test('Eventos de Rover: input, change y blur en los cinco campos', async () => {
  const r = setup(); await r.click('Midday'); assert.equal(r.events.length, 15);
});

test('Evening pendiente: no toma Midday ni resultados de ayer', async () => {
  const removeEvening = html => edit(html, doc => doc.querySelector('[data-test-id="draw-result-1"]').remove());
  const r = setup({ pick3: removeEvening(fixture('pick3')), pick4: removeEvening(fixture('pick4')) });
  await r.click('Evening'); assert.deepEqual(r.values('EVENING'), Array(5).fill('old')); assert.equal(r.status('Evening'), '⛔');
  assert.equal(r.logs.at(-1).Fuente.valor, '📱 App oficial Illinois Lottery');
});

test('Fecha de cada resultado: rechaza números de otro día aunque el filtro diga hoy', async () => {
  const wrongDate = html => html.replaceAll('Oct 18, 2026', 'Oct 17, 2026');
  const r = setup({ pick3: wrongDate(fixture('pick3')), pick4: wrongDate(fixture('pick4')) });
  await r.click('Midday'); assert.deepEqual(r.values('MIDDAY'), Array(5).fill('old')); assert.equal(r.status('Midday'), '⛔');
});

test('Sorteo desconocido: nunca lo interpreta como Midday', async () => {
  const r = setup({ pick3: fixture('pick3').replaceAll('midday', 'morning'), pick4: fixture('pick4').replaceAll('midday', 'morning') });
  await r.click('Midday'); assert.deepEqual(r.values('MIDDAY'), Array(5).fill('old')); assert.equal(r.status('Midday'), '⛔');
});

test('Resultado parcial: Pick 3 no se reemplaza por un Pick 4 inválido', async () => {
  const pick4 = edit(fixture('pick4'), doc => doc.querySelector('[data-test-id="ball-primary-2-0"]').textContent = '?');
  const r = setup({ pick4 }); await r.click('Midday');
  assert.deepEqual(r.values('MIDDAY'), ['27', 'old', 'old', '027', 'old']); assert.equal(r.status('Midday'), '⚠️');
});

for (const [name, change] of [
  ['cifra ausente', doc => doc.querySelector('[data-test-id="ball-primary-2-0"]').remove()],
  ['cifra adicional', doc => { const b = doc.querySelector('[data-test-id="ball-primary-2-0"]'); b.after(b.cloneNode(true)); }],
  ['cifra con dos dígitos', doc => doc.querySelector('[data-test-id="ball-primary-2-0"]').textContent = '00'],
  ['juego distinto en el enlace', doc => doc.querySelector('[data-test-id="draw-result-2"] a').setAttribute('href', '/dbg/results/pick4/draw/24111')]
]) test(`Validación Pick 3: ${name}`, async () => {
  const r = setup({ pick3: edit(fixture('pick3'), change) }); await r.click('Midday');
  assert.equal(r.values('MIDDAY')[3], 'old'); assert.equal(r.values('MIDDAY')[4], '0987'); assert.equal(r.status('Midday'), '⚠️');
});

test('Ceros completos: conserva 000 y 0000', async () => {
  const zeros = html => edit(html, doc => doc.querySelectorAll('[data-test-id^="ball-primary-"]').forEach(ball => ball.textContent = '0'));
  const r = setup({ pick3: zeros(fixture('pick3')), pick4: zeros(fixture('pick4')) }); await r.click('Midday');
  assert.deepEqual(r.values('MIDDAY'), ['00', '00', '00', '000', '0000']);
});

test('Dos resultados contradictorios para fecha/sorteo: no elige uno arbitrariamente', async () => {
  const conflicting = html => edit(html, doc => {
    const row = doc.querySelector('[data-test-id="draw-result-2"]'), duplicate = row.cloneNode(true);
    duplicate.querySelector('[data-test-id^="ball-primary-"]').textContent = '9'; row.after(duplicate);
  });
  const r = setup({ pick3: conflicting(fixture('pick3')), pick4: conflicting(fixture('pick4')) }); await r.click('Midday');
  assert.deepEqual(r.values('MIDDAY'), Array(5).fill('old')); assert.equal(r.status('Midday'), '⛔');
});

test('Duplicado idéntico: conserva el único resultado inequívoco', async () => {
  const duplicate = html => edit(html, doc => { const row = doc.querySelector('[data-test-id="draw-result-2"]'); row.after(row.cloneNode(true)); });
  const r = setup({ pick3: duplicate(fixture('pick3')), pick4: duplicate(fixture('pick4')) }); await r.click('Midday');
  assert.deepEqual(r.values('MIDDAY'), ['27', '09', '87', '027', '0987']);
});

test('Historial: solicita exactamente la fecha seleccionada, sin convertirla a UTC', async () => {
  const changeDate = html => html.replaceAll('2026-10-18', '2026-01-01').replaceAll('Oct 18, 2026', 'Jan 1, 2026');
  const r = setup({ date: '01/01/2026', pick3: changeDate(fixture('pick3')), pick4: changeDate(fixture('pick4')) }); await r.click('Evening');
  assert.deepEqual(r.values('EVENING'), ['72', '86', '26', '272', '8626']);
  for (const request of r.requests) assert.equal(new URL(request.url).searchParams.get('dateFrom'), '2026-01-01');
});

test('Fecha sin resultados: no requiere que exista una lista de sorteos', async () => {
  const empty = html => edit(html, doc => doc.querySelector('[data-test-id="dbg-results-list"]').remove());
  const r = setup({ pick3: empty(fixture('pick3')), pick4: empty(fixture('pick4')) }); await r.click('Evening');
  assert.deepEqual(r.values('EVENING'), Array(5).fill('old')); assert.equal(r.status('Evening'), '⛔');
});

for (const [name, transform] of [
  ['juego incorrecto', html => html.replace('"gameCode": "pick3"', '"gameCode": "pick4"')],
  ['filtro de otra fecha', html => html.replaceAll('2026-10-18', '2026-10-17')],
  ['identidad de página incorrecta', html => html.replace('id="dbg-results-pick3"', 'id="dbg-results-pick4"')],
  ['configuración ilegible', html => html.replace('"__exc_server_config__"', 'broken-json')]
]) test(`Respuesta rechazada: ${name}`, async () => {
  const r = setup({ pick3: transform(fixture('pick3')) }); await r.click('Midday');
  assert.deepEqual(r.values('MIDDAY'), Array(5).fill('old')); assert.equal(r.status('Midday'), '❌');
});

for (const mode of ['network', 'timeout', 'abort', 'http', 'login', 'date-change']) test(`${mode}: deja intacto el formulario`, async () => {
  const r = setup({ mode }); await r.click('Midday');
  assert.deepEqual(r.values('MIDDAY'), Array(5).fill('old'));
  assert.equal(r.status('Midday'), mode === 'date-change' ? '⚠️' : '❌');
});

test('Fila de Illinois ausente: informa el problema y protege las demás filas', async () => {
  const r = setup({ missingRow: true }); await r.click('Midday');
  assert.equal(r.status('Midday'), '⚠️'); assert.deepEqual(r.values('OTHER'), Array(5).fill('other'));
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
