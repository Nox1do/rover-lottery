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
import {verifyScenarios} from './helpers/assert-scenarios.mjs';
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
  await add(origin + '/tests/browser/helpers/ten-draw-cases.js', 'tests/browser/helpers/ten-draw-cases.js', 'text/javascript');
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
    const {runTenDrawCases} = await import('/tests/browser/helpers/ten-draw-cases.js');
    const htmlByUrl = Object.fromEntries(await Promise.all(cases.map(async item =>
      [item.url, await (await fetch(item.url)).text()])));
    return runTenDrawCases({cases, date, htmlByUrl, postFillObservationMs});
  }, {cases, date, postFillObservationMs});
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
