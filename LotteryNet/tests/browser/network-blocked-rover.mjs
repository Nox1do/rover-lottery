/** Ten sanitized rows from supplied Rover HTML; no login or extensions.
 * All result HTML is captured Lottery.net fixture data, not a live lookup.
 */
import {chromium, firefox} from 'playwright';
import {createServer} from 'node:http';
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DRAWS} from '../../src/states/index.js';
import {installNetworkGuard} from './helpers/network-guard.mjs';

const base = fileURLToPath(new URL('../../', import.meta.url));
let origin = 'http://lotterynet-qa.invalid';
const date = '2026-10-19';
const postFillObservationMs = 500;
const engines = {chromium, firefox};
const selected = (process.env.LOTTERYNET_QA_ENGINES ?? 'chromium,firefox').split(',');
assert(selected.length && selected.every(name => engines[name]), 'Unknown browser engine');
const report = {
  generatedAt: new Date().toISOString(), status: 'RUNNING', date,
  scope: 'Sanitized captured Rover rows; actual LotteryNet modules; local source responses',
  limitations: ['No authenticated Rover', 'No Tampermonkey or other extensions',
    'No live Lottery.net lookup', 'Routing is not an OS firewall'],
  environment: {firefoxContentSandboxDisabled: process.env.MOZ_DISABLE_CONTENT_SANDBOX === '1'},
  browsers: []
};

async function resourcesForTest() {
  const resources = new Map();
  const add = async (url, relative, contentType) => resources.set(url, {
    body: await readFile(path.join(base, relative), 'utf8'), contentType
  });
  await add(origin + '/', 'tests/fixtures/rover/ten-draws-sanitized.html', 'text/html');
  for (const relative of await readdir(path.join(base, 'src'), {recursive: true})) {
    if (relative.endsWith('.js')) {
      const portable = relative.split(path.sep).join('/');
      await add(origin + '/src/' + portable, 'src/' + relative, 'text/javascript');
    }
  }
  const cases = JSON.parse(await readFile(path.join(base, 'tests/fixtures/lotterynet/cases.json')));
  for (const item of cases) {
    await add(item.url, 'tests/fixtures/lotterynet/' + item.fixture, 'text/html');
  }
  return {resources, cases};
}

// The canary is a throwaway loopback server. It cannot process real results.
const received = [];
const server = createServer((request, response) => {
  received.push({method: request.method, path: new URL(request.url, origin).pathname});
  response.setHeader('Content-Type', 'text/html');
  response.end('<!doctype html><title>Local canary only</title>');
});
server.on('upgrade', (request, socket) => {
  received.push({method: 'WEBSOCKET', path: new URL(request.url, origin).pathname});
  socket.destroy();
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const canary = 'http://127.0.0.1:' + server.address().port;
// Same-origin probes avoid browser private-network policy hiding a routing
// defect. A deliberately forwarded canary POST must reach this server.
origin = canary;

async function verifyNetworkBoundary(browser, resources) {
  // Negative control: prove the browser and local receiver actually work.
  const control = await browser.newContext({serviceWorkers: 'block'});
  const postsBefore = received.filter(item => item.path === '/control-post' && item.method === 'POST').length;
  try {
    const page = await control.newPage();
    await page.goto(canary + '/control');
    await page.evaluate(() => fetch('/control-post', {method: 'POST', body: 'local-qa'}));
    assert.equal(received.filter(item => item.path === '/control-post' && item.method === 'POST').length,
      postsBefore + 1, 'This browser must reach the unguarded local receiver');
  } finally { await control.close(); }
  const baseline = received.length;
  const context = await browser.newContext({serviceWorkers: 'block'});
  context.setDefaultTimeout(10_000);
  const guard = await installNetworkGuard(context, resources);
  const page = await context.newPage();
  try {
    await page.goto(origin + '/');
    console.log(browser.browserType().name() + ': checking HTTP probes');
    const probes = await page.evaluate(async ({canary}) => {
      const failed = [];
      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        try { await fetch('/__inc/procesarResultados.php?method=' + method, {method}); }
        catch { failed.push(method); }
      }
      await new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/xhr-probe');
        xhr.onload = () => resolve();
        xhr.onerror = () => { failed.push('XHR'); resolve(); };
        xhr.send('local-qa');
      });
      try { await fetch(canary + '/must-not-arrive', {method: 'POST', mode: 'no-cors'}); }
      catch { failed.push('CANARY'); }
      try { await fetch('https://external-qa.invalid/no-network'); }
      catch { failed.push('EXTERNAL'); }
      return failed;
    }, {canary});
    assert.equal(received.length, baseline, 'A blocked HTTP probe reached the local receiver');
    assert.deepEqual(probes, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'XHR', 'CANARY', 'EXTERNAL']);
    console.log(browser.browserType().name() + ': checking beacon, form, popup and WebSocket probes');
    const beaconFailed = page.waitForEvent('requestfailed', {
      predicate: request => new URL(request.url()).pathname === '/beacon-probe'
    });
    await page.evaluate(() => navigator.sendBeacon('/beacon-probe', 'local-qa'));
    await beaconFailed;
    const formFailed = page.waitForEvent('requestfailed', {
      predicate: request => new URL(request.url()).pathname === '/form-probe'
    });
    await page.evaluate(() => {
      const frame = document.createElement('iframe'); frame.name = 'qa-sink';
      const form = document.createElement('form');
      form.method = 'POST'; form.action = '/form-probe'; form.target = frame.name;
      document.body.append(frame, form); form.submit();
    });
    await formFailed;
    const popupFailed = context.waitForEvent('requestfailed', {
      predicate: request => new URL(request.url()).pathname === '/popup-probe'
    });
    await page.evaluate(() => window.open('/popup-probe', '_blank'));
    await popupFailed;
    await page.evaluate(wsUrl => new Promise((resolve, reject) => {
      const socket = new WebSocket(wsUrl);
      const timer = setTimeout(() => reject(Error('WebSocket probe did not close')), 5000);
      socket.onclose = () => { clearTimeout(timer); resolve(); };
    }), canary.replace('http:', 'ws:') + '/socket-probe');
    assert.equal(received.length, baseline, 'A blocked probe reached the local receiver');
    assert.equal(guard.blocked.length, 12, 'Every probe must be accounted for');
    return {context, page, guard, baseline};
  } catch (error) {
    await context.close();
    throw error;
  }
}

async function exerciseDraws(page, cases) {
  return page.evaluate(async ({cases, date, postFillObservationMs}) => {
    const {DRAWS} = await import('/src/states/index.js');
    const {extractFromPage} = await import('/src/providers/lottery-net.js');
    const {fillVisualInputs} = await import('/src/rover/fill-ui.js');
    const {findUniqueRoverRow, FIELD_NAMES} = await import('/src/rover/rows.js');
    const {createVisualCache, restoreVisibleValues} = await import('/src/rover/restore.js');
    const {mountInlineStatus, setInlineStatus} = await import('/src/ui/controls.js');
    const html = new Map(await Promise.all(cases.map(async item => [item.url,
      await (await fetch(item.url)).text()])));
    // A fresh, pristine fixture for each scenario avoids inter-test state.
    const pristine = document.querySelector('#tableResult tbody').innerHTML;
    const reset = () => {
      document.querySelector('#tableResult tbody').innerHTML = pristine;
      document.querySelector('#fecha').value = '10/19/2026';
    };
    const events = {input: 0, change: 0, blur: 0};
    let processClicks = 0;
    for (const type of Object.keys(events)) document.addEventListener(type, event => {
      if (!event.target.matches?.('#tableResult input')) return;
      events[type]++;
      // Adversarial listener; any event-driven attempt is a functional failure.
      fetch('/unexpected-event-processing', {method: 'POST'}).catch(() => {});
    }, true);
    document.addEventListener('click', event => {
      if (event.target.matches?.('[data-qa-process]')) processClicks++;
    });
    const results = [];
    for (const draw of DRAWS) {
      reset();
      const row = () => findUniqueRoverRow({root: document, draw, date}).row;
      const values = () => FIELD_NAMES.map(name => row().querySelector('input[name="' + name + '"]').value);
      const allValues = () => Array.from(document.querySelectorAll('#tableResult input')).map(input => input.value);
      const otherValues = () => Array.from(document.querySelectorAll('#tableResult input'))
        .filter(input => input.getAttribute('loteria') !== draw.roverCode).map(input => input.value);
      const input = game => {
        const item = cases.find(item => item.state === draw.state && item.game === game);
        return extractFromPage(html.get(item.url), {state: draw.state, game, date, turn: draw.turn}).value;
      };
      const p3 = input('p3'), p4 = input('p4');
      const fill = (extra = {}) => fillVisualInputs({root: document, draw, date, p3, p4, ...extra});
      const run = (scenario, action) => { reset(); results.push({id: draw.id, scenario, ...action()}); };
      run('full', () => {
        const button = document.createElement('button'); button.dataset.qaProcess = '1';
        button.textContent = 'Synthetic process sentinel'; row().lastElementChild.append(button);
        const before = otherValues();
        const result = fill();
        const mounted = mountInlineStatus({root: document, draw, date, state: 'CARGANDO'});
        const loading = mounted.element.textContent;
        setInlineStatus(mounted.element, 'COMPLETADO');
        return {result, values: values(), before, after: otherValues(), loading, completed: mounted.element.textContent};
      });
      run('idempotent', () => { fill(); return {result: fill(), values: values()}; });
      run('p3-only', () => ({result: fill({p4: null}), values: values()}));
      run('p4-only', () => ({result: fill({p3: null}), values: values()}));
      run('leading-zeros', () => ({result: fill({p3: '007', p4: '0032'}), values: values()}));
      run('conflict', () => {
        row().querySelector('[name="pick3"]').value = p3 === '999' ? '998' : '999';
        const before = allValues(); return {result: fill(), before, after: allValues()};
      });
      run('date-changed', () => {
        document.querySelector('#fecha').value = '10/18/2026';
        const result = fill(); return {result, all: allValues()};
      });
      run('search-restore', () => {
        const cache = createVisualCache(); cache.remember({draw, date, p3, p4}); fill();
        document.querySelector('#tableResult tbody').innerHTML = pristine;
        return {result: restoreVisibleValues({root: document, draw, date, cache}), values: values()};
      });
      run('restore-conflict', () => {
        const cache = createVisualCache(); cache.remember({draw, date, p3, p4});
        document.querySelector('#tableResult tbody').innerHTML = pristine;
        row().querySelector('[name="pick3"]').value = p3 === '999' ? '998' : '999';
        const before = allValues();
        return {result: restoreVisibleValues({root: document, draw, date, cache}), before, after: allValues()};
      });
      run('wrong-code', () => {
        row().querySelector('input').setAttribute('loteria', 'WRONG-CODE');
        return {result: fill(), all: allValues()};
      });
      run('duplicate-row', () => {
        row().after(row().cloneNode(true)); return {result: fill(), all: allValues()};
      });
      run('missing-row', () => { row().remove(); return {result: fill(), all: allValues()}; });
    }
    // Observe browser task turns and fire-and-forget traffic before taking
    // event/click snapshots. Routing remains active throughout this interval.
    // This bounds the measurement; it makes no claim about arbitrarily late work.
    await new Promise(resolve => setTimeout(resolve, postFillObservationMs));
    return {results, events, processClicks};
  }, {cases, date, postFillObservationMs});
}

function verifyScenarios(output, cases) {
  assert.equal(output.results.length, DRAWS.length * 12);
  for (const draw of DRAWS) {
    const value = game => cases.find(item => item.state === draw.state && item.game === game)
      .draws.find(item => item.turn === draw.turn).value;
    const p3 = value('p3'), p4 = value('p4');
    const expected = [p3.slice(-2), p4.slice(0, 2), p4.slice(-2), p3, p4];
    const rows = output.results.filter(item => item.id === draw.id);
    assert.equal(rows.length, 12);
    for (const item of rows) {
      const label = draw.id + ': ' + item.scenario;
      if (['full', 'search-restore'].includes(item.scenario)) {
        assert.equal(item.result.status, 'COMPLETADO', label);
        assert.equal(item.result.written, 5, label);
        assert.deepEqual(item.values, expected, label);
        if (item.scenario === 'full') {
          assert.deepEqual(item.after, item.before, label + ' other draws unchanged');
          assert.equal(item.loading, 'Consultando', label);
          assert.equal(item.completed, 'Casillas completadas', label);
        }
      } else if (item.scenario === 'idempotent') {
        assert.equal(item.result.status, 'COINCIDENTE', label);
        assert.equal(item.result.written, 0, label);
        assert.deepEqual(item.values, expected, label);
      } else if (item.scenario === 'p3-only' || item.scenario === 'p4-only') {
        assert.equal(item.result.status, 'PARCIAL', label);
        assert.deepEqual(item.values, item.scenario === 'p3-only'
          ? [expected[0], '', '', p3, ''] : ['', expected[1], expected[2], '', p4], label);
      } else if (item.scenario === 'leading-zeros') {
        assert.equal(item.result.status, 'COMPLETADO', label);
        assert.deepEqual(item.values, ['07', '00', '32', '007', '0032'], label);
      } else if (item.before) {
        assert.equal(item.result.status, 'CONFLICTO', label);
        assert.deepEqual(item.after, item.before, label);
      } else {
        assert.equal(item.result.ok, false, label);
        assert.equal(item.result.status,
          ['duplicate-row', 'missing-row'].includes(item.scenario) ? 'SIN_FILA' : 'CONFLICTO', label);
        assert(item.all.every(value => value === ''), label + ' no writes');
      }
    }
  }
  assert.deepEqual(output.events, {input: 0, change: 0, blur: 0});
  assert.equal(output.processClicks, 0);
}

try {
  report.fixture = JSON.parse(await readFile(path.join(base, 'tests/fixtures/rover/provenance.json')));
  report.fixture.sanitizedSha256 = createHash('sha256')
    .update(await readFile(path.join(base, 'tests/fixtures/rover/ten-draws-sanitized.html'))).digest('hex');
  const {resources, cases} = await resourcesForTest();
  for (const engine of selected) {
    const executablePath = process.env['LOTTERYNET_QA_' + engine.toUpperCase() + '_PATH'];
    const browser = await engines[engine].launch({headless: true, ...(executablePath && {executablePath})});
    try {
      const {context, page, guard, baseline} = await verifyNetworkBoundary(browser, resources);
      try {
        await page.goto(origin + '/'); // Discard probe form/frame/popup state.
        const blockedBefore = guard.blocked.length;
        const output = await exerciseDraws(page, cases);
        verifyScenarios(output, cases);
        assert.equal(guard.blocked.length, blockedBefore, 'Filling attempted a prohibited request');
        assert.equal(received.length, baseline, 'Unexpected traffic reached the canary');
        report.browsers.push({engine, version: browser.version(), customExecutable: !!executablePath,
          status: 'PASS', draws: 10, unguardedCanaryPostReceived: true,
          scenarios: output.results.length, boundaryProbesBlocked: guard.blocked.length,
          postFillObservationMs,
          probes: guard.blocked, fillRequestsBlocked: guard.blocked.length - blockedBefore,
          canaryRequestsDuringGuardedPhase: received.length - baseline,
          events: output.events, processClicks: output.processClicks,
          cases: output.results.map(({id, scenario, result}) => ({id, scenario, status: result.status}))});
        console.log(engine + ': PASS — 10 draws, 120 scenarios, 12 blocked probes, zero fill requests/events');
      } finally { await context.close(); }
    } finally { await browser.close(); }
  }
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.error = error.message; throw error;
} finally {
  await new Promise(resolve => server.close(resolve));
  const target = path.resolve(base, process.env.LOTTERYNET_QA_REPORT ?? 'test-results/network-blocked-rover.json');
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, JSON.stringify(report, null, 2) + '\n');
  console.log('QA report: ' + target);
}
