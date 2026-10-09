const fs = require('node:fs');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const source = fs.readFileSync(process.argv[2], 'utf8');
const fixture = (game, page = 'full') => JSON.parse(fs.readFileSync(`${__dirname}/fixtures/ga-${game}-${page}.json`, 'utf8'));
const tests = [], contexts = [];
const test = (name, run) => tests.push({ name, run });
const origin = 'https://gas-v2.p1.awc.lotteryservices.net';

function setup({ date = '10/07/2026', cash3 = fixture('cash3'), cash4 = fixture('cash4'), mode = '', missingRow = false } = {}) {
  // La selección debe depender de la fecha de Georgia, no de la zona del PC.
  process.env.TZ = 'Asia/Tokyo';
  const rows = ['MIDDAY', 'EVENING', 'NIGHT'];
  const dom = new JSDOM(`<input id="fecha" value="${date}"><table><tbody>${rows.map(draw =>
    `<tr id="${draw}"><td>${missingRow ? 'OTHER' : 'GEORGIA ' + draw}</td>${'<td><input type="text" value="old"></td>'.repeat(5)}</tr>`).join('')}
    <tr id="OTHER"><td>TENNESSEE EVENING</td>${'<td><input type="text" value="other"></td>'.repeat(5)}</tr></tbody></table>`,
    { url: 'https://roversport.net/adm/es/lottery.php', runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  contexts.push(dom);
  const w = dom.window;
  Object.defineProperty(w.document, 'readyState', { value: 'complete' });
  Object.defineProperty(w.HTMLElement.prototype, 'innerText', { get() { return this.textContent; }, set(value) { this.textContent = value; } });
  w.requests = []; w.events = [];
  for (const input of w.document.querySelectorAll('#MIDDAY input')) {
    for (const event of ['input', 'change', 'blur']) input.addEventListener(event, () => w.events.push(event));
  }
  w.GM_xmlhttpRequest = options => {
    w.requests.push(options);
    w.setTimeout(() => {
      if (mode === 'date-change') w.document.querySelector('#fecha').value = '10/06/2026';
      if (mode === 'network') return options.onerror({});
      if (mode === 'timeout') return options.ontimeout();
      if (mode === 'abort') return options.onabort();
      if (mode === 'http') return options.onload({ status: 401, responseText: '' });
      if (mode === 'json') return options.onload({ status: 200, responseText: '<html>blocked</html>' });
      const url = new URL(options.url), game = url.searchParams.get('game-names');
      if (url.origin !== origin || url.pathname !== '/api/v2/draw-games/draws/page' || !['CASH 3', 'CASH 4'].includes(game)) return options.onerror({});
      let data = structuredClone(url.searchParams.has('start-item') ? fixture(game === 'CASH 3' ? 'cash3' : 'cash4', 'next') : game === 'CASH 3' ? cash3 : cash4);
      if (mode === 'api-error') data = { code: 'NOT_AUTHORIZED' };
      if (mode === 'bad-pagination') { data.nextItems = 1; data.nextPageUrl = 'https://other.example/api/v2/draw-games/draws/page?game-names=' + encodeURIComponent(game); }
      if (mode === 'wrong-pagination') { data.nextItems = 1; data.nextPageUrl = '/api/v2/draw-games/draws/page?game-names=mega'; }
      if (mode === 'repeat-pagination') { data.nextItems = 1; data.nextPageUrl = options.url; }
      options.onload({ status: 200, responseText: JSON.stringify(data) });
    }, 0);
  };
  w.eval(source.replace(/\n\}\)\(\);\s*$/, '\nwindow.__test={parseGeorgiaGame:typeof parseGeorgiaGame==="function"?parseGeorgiaGame:null};})();'));
  const button = draw => [...w.document.querySelectorAll('.gm-loto-btn')].find(b => b.innerText.includes('Georgia ' + draw));
  const values = row => [...w.document.querySelectorAll('#' + row + ' input')].map(input => input.value);
  const click = async draw => {
    button(draw).click();
    const started = Date.now();
    while (button(draw).querySelector('.gm-status-icon').classList.contains('gm-loading')) {
      if (Date.now() - started > 2500) throw Error('La consulta no terminó');
      await new Promise(resolve => setTimeout(resolve, 5));
    }
  };
  return { w, button, values, click, status: draw => button(draw).querySelector('.gm-status-icon').innerText };
}

for (const [draw, expected] of [
  ['Midday', ['47', '12', '51', '847', '1251']],
  ['Evening', ['72', '93', '71', '572', '9371']],
  ['Night', ['64', '60', '29', '864', '6029']]
]) test(`${draw}: consulta móvil y llena únicamente la fila de su sorteo`, async () => {
  const result = setup(); await result.click(draw);
  assert.deepEqual(result.values(draw.toUpperCase()), expected);
  assert.equal(result.status(draw), '✅');
  for (const other of ['MIDDAY', 'EVENING', 'NIGHT'].filter(row => row !== draw.toUpperCase())) assert.deepEqual(result.values(other), Array(5).fill('old'));
  assert.deepEqual(result.values('OTHER'), Array(5).fill('other'));
  assert.equal(result.w.requests.length, 2);
  for (const request of result.w.requests) {
    const url = new URL(request.url);
    assert.equal(url.origin, origin); assert.equal(url.pathname, '/api/v2/draw-games/draws/page');
    assert.ok(request.headers['x-esa-api-key']); assert.equal(request.method, 'GET'); assert.equal(request.anonymous, true);
    assert.equal(request.timeout, 20000); assert.equal(url.searchParams.get('size'), '100'); assert.ok(url.searchParams.get('_'));
  }
});
test('Fecha actual y ceros iniciales de la respuesta real', async () => {
  const result = setup({ date: '10/08/2026' }); await result.click('Evening');
  assert.deepEqual(result.values('EVENING'), ['17', '04', '42', '517', '0442']);
});
test('Night pendiente: no copia Evening ni la noche anterior', async () => {
  const result = setup({ date: '10/08/2026' }); await result.click('Night');
  assert.deepEqual(result.values('NIGHT'), Array(5).fill('old')); assert.equal(result.status('Night'), '⛔');
});
test('Eventos de Rover tras llenar los cinco campos', async () => {
  const result = setup(); await result.click('Midday'); assert.equal(result.w.events.length, 15);
});
test('Historial: sigue la segunda página con espacios en el nombre del juego', async () => {
  const result = setup({ date: '08/18/2026' }); await result.click('Night');
  assert.deepEqual(result.values('NIGHT'), ['03', '32', '06', '003', '3206']); assert.equal(result.status('Night'), '✅');
  assert.equal(result.w.requests.length, 4);
});
test('Fuera del historial: no modifica el formulario', async () => {
  const result = setup({ date: '01/01/2026' }); await result.click('Evening');
  assert.deepEqual(result.values('EVENING'), Array(5).fill('old')); assert.equal(result.status('Evening'), '⛔');
});
test('Cambio de fecha durante consulta: descarta el resultado', async () => {
  const result = setup({ mode: 'date-change' }); await result.click('Midday');
  assert.deepEqual(result.values('MIDDAY'), Array(5).fill('old')); assert.equal(result.status('Midday'), '⚠️');
});
test('Cash 4 sin publicar: llena solo Cash 3 y avisa', async () => {
  const cash4 = fixture('cash4'); cash4.draws.forEach(draw => delete draw.results);
  const result = setup({ cash4 }); await result.click('Midday');
  assert.deepEqual(result.values('MIDDAY'), ['47', 'old', 'old', '847', 'old']); assert.equal(result.status('Midday'), '⚠️');
});
test('Respuesta de otro juego: rechaza el llenado', async () => {
  const result = setup({ cash4: fixture('cash3') }); await result.click('Midday');
  assert.deepEqual(result.values('MIDDAY'), Array(5).fill('old')); assert.equal(result.status('Midday'), '❌');
});
test('Fila ausente: avisa sin tocar otra lotería', async () => {
  const result = setup({ missingRow: true }); await result.click('Midday');
  assert.deepEqual(result.values('MIDDAY'), Array(5).fill('old')); assert.deepEqual(result.values('OTHER'), Array(5).fill('other'));
  assert.equal(result.status('Midday'), '⚠️');
});
for (const mode of ['network', 'timeout', 'abort', 'http', 'json', 'api-error']) test(`Error ${mode}: termina sin escribir`, async () => {
  const result = setup({ mode }); await result.click('Midday');
  assert.deepEqual(result.values('MIDDAY'), Array(5).fill('old')); assert.equal(result.status('Midday'), '❌');
  assert.ok(result.w.requests.every(request => new URL(request.url).origin === origin));
});
for (const mode of ['bad-pagination', 'wrong-pagination', 'repeat-pagination']) test(`Paginación ${mode}: rechaza la siguiente consulta`, async () => {
  const result = setup({ date: '01/01/2026', mode }); await result.click('Evening');
  assert.deepEqual(result.values('EVENING'), Array(5).fill('old')); assert.equal(result.status('Evening'), '❌');
  assert.ok(result.w.requests.length <= 4); assert.ok(result.w.requests.every(request => new URL(request.url).origin === origin));
});
test('Parser: conserva ceros y excluye resultados adicionales', () => {
  const result = setup(), parse = result.w.__test.parseGeorgiaGame; assert.equal(typeof parse, 'function');
  const data = { draws: [fixture('cash3').draws.find(draw => draw.name === 'MIDDAY' && draw.results)] };
  data.draws[0].results = [{ drawType: 'Bonus', primary: ['9', '9', '9'] }, { drawType: 'Regular', prizeTierId: '0', primary: ['0', '0', '7'], secondary: ['8'] }];
  assert.equal(parse(data, new result.w.Date(2026, 9, 8), 'MIDDAY', 3), '007');
  data.draws[0].results.shift(); data.draws[0].results[0].drawType = 'Bonus';
  assert.equal(parse(data, new result.w.Date(2026, 9, 8), 'MIDDAY', 3), null);
});
test('Parser: rechaza cifras incompletas, fechas inválidas, estado pendiente y nombres desconocidos', () => {
  const result = setup(), parse = result.w.__test.parseGeorgiaGame; assert.equal(typeof parse, 'function');
  const only = () => ({ draws: [structuredClone(fixture('cash3').draws[2])] });
  const read = data => parse(data, new result.w.Date(2026, 9, 8), 'MIDDAY', 3);
  for (const invalid of [['5', '0'], ['5', '0', '2', '8'], ['5', '?', '2'], ['502'], [5, 0, 2]]) {
    const data = only(); data.draws[0].results[0].primary = invalid; assert.equal(read(data), null);
  }
  for (const [field, value] of [['drawTime', 'bad'], ['gameName', 'CASH 4'], ['name', 'UNKNOWN'], ['status', 'OPEN']]) {
    const data = only(); data.draws[0][field] = value; assert.equal(read(data), null);
  }
  assert.equal(parse(only(), new result.w.Date(2026, 9, 8), 'MORNING', 3), null);
  const data = only(); data.draws[0].status = 'RESULTS_AVAILABLE'; assert.equal(read(data), '502');
});
test('Night en invierno: utiliza la fecha del este aunque UTC ya cambió', () => {
  const result = setup(), parse = result.w.__test.parseGeorgiaGame; assert.equal(typeof parse, 'function');
  const data = { draws: [structuredClone(fixture('cash3').draws[3])] };
  data.draws[0].drawTime = Date.parse('2026-01-02T04:45:00Z'); data.draws[0].results[0].primary = ['0', '0', '0'];
  assert.equal(parse(data, new result.w.Date(2026, 0, 1), 'NIGHT', 3), '000');
  assert.equal(parse(data, new result.w.Date(2026, 0, 2), 'NIGHT', 3), null);
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
