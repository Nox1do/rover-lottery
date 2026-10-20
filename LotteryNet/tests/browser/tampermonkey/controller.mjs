import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile, writeFile, readlink} from 'node:fs/promises';
import {networkInterfaces} from 'node:os';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import {buildQaUserscript} from './build-qa.mjs';
import {verifyScenarios} from '../helpers/assert-scenarios.mjs';

const [phase, configPath] = process.argv.slice(2);
assert(['preflight', 'isolated'].includes(phase));
const config = JSON.parse(await readFile(configPath));
const directory = config.directory;
const report = {status: 'RUNNING', phase};
let context;
let page;
let server;
const received = [];

async function installThroughManager(context, extensionId, scriptPath) {
  const settings = await context.newPage();
  await settings.goto('chrome://extensions/?id=' + extensionId);
  const developerMode = settings.locator('#devMode');
  await developerMode.waitFor({state: 'attached'});
  if (await developerMode.getAttribute('checked') === null) await developerMode.click();
  await settings.locator('#devMode[checked]').waitFor({state: 'attached'});
  const allowScripts = settings.locator('#allow-user-scripts cr-toggle');
  await allowScripts.waitFor({state: 'attached'});
  if (await allowScripts.getAttribute('checked') === null) await allowScripts.click();
  await settings.locator('#allow-user-scripts cr-toggle[checked]').waitFor({state: 'attached'});
  // Chrome 138+ exposes the API only after the extension context reloads.
  const [worker] = await Promise.all([
    context.waitForEvent('serviceworker'),
    settings.locator('extensions-detail-view #dev-reload-button').click()
  ]);
  await worker.evaluate(() => chrome.userScripts.getScripts());
  const options = await context.newPage();
  await options.goto('chrome-extension://' + extensionId + '/options.html#nav=utils');
  const upload = options.locator('input[type=file]');
  await upload.waitFor({state: 'attached'});
  await upload.setInputFiles(scriptPath);
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    for (const candidate of context.pages()) {
      if (!candidate.url().startsWith('chrome-extension://' + extensionId + '/')) continue;
      const install = candidate.locator('.ask_action_buttons').getByRole('button', {name: /^(Install|Import)$/i});
      if (await install.count() && await install.first().isVisible()) {
        await install.first().click();
        console.log('Tampermonkey installation confirmed through manager UI');
        return {developerMode: true, allowUserScripts: true, apiAvailableAfterReload: true,
          method: 'Utilities file import and manager confirmation'};
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  for (const candidate of context.pages()) {
    console.log('INSTALL DIAGNOSTIC', candidate.url(), (await candidate.locator('body').innerText().catch(() => '')).slice(0,7000));
    await candidate.screenshot({path: path.join(directory, 'install-' + context.pages().indexOf(candidate) + '.png')}).catch(() => {});
  }
  throw Error('Tampermonkey did not show its Install confirmation');
}

try {
  if (phase === 'isolated') {
    const namespace = await readlink('/proc/self/ns/net');
    assert.notEqual(namespace, config.parentNetworkNamespace, 'Network namespace did not change');
    const interfaces = Object.keys(networkInterfaces());
    assert(interfaces.every(name => name === 'lo'), 'Non-loopback network interface present');
    const routes = JSON.parse(execFileSync('ip', ['-j', 'route', 'show'], {encoding: 'utf8'}));
    assert.equal(routes.length, 0, 'An external IPv4 route is present');
    report.networkIsolation = {namespaceChanged: true, interfaces, externalRoutes: routes.length};
  }
  const cases = JSON.parse(await readFile('tests/fixtures/lotterynet/cases.json'));
  const fixture = await readFile('tests/fixtures/rover/ten-draws-sanitized.html', 'utf8');
  const userscript = await buildQaUserscript(config.outsideCanary);
  const scriptPath = path.join(directory, 'LotteryNet-Tampermonkey-QA.user.js');
  await writeFile(scriptPath, userscript);
  const allowedFixtures = new Map(await Promise.all(cases.map(async item =>
    [item.fixture, await readFile('tests/fixtures/lotterynet/' + item.fixture, 'utf8')])));
  server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    received.push({method: request.method, path: url.pathname});
    if (request.method !== 'GET') {response.writeHead(405); response.end('Unexpected QA write'); return;}
    if (url.pathname === '/rover.html') {response.setHeader('Content-Type', 'text/html'); response.end(fixture);}
    else if (url.pathname === '/LotteryNet-Tampermonkey-QA.user.js') {
      response.setHeader('Content-Type', 'text/javascript'); response.end(userscript);
    } else if (url.pathname === '/gm-ok') response.end('local-ok');
    else if (url.pathname.startsWith('/fixtures/') && allowedFixtures.has(url.pathname.slice(10))) {
      response.setHeader('Content-Type', 'text/html'); response.end(allowedFixtures.get(url.pathname.slice(10)));
    } else {response.writeHead(404); response.end('Not a QA resource');}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const extension = path.join(directory, 'extension');
  context = await chromium.launchPersistentContext(path.join(directory, 'profile'), {
    executablePath: config.executablePath, headless: true,
    args: ['--disable-extensions-except=' + extension, '--load-extension=' + extension]
  });
  context.setDefaultTimeout(20000);
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker', {timeout: 20000});
  const extensionId = worker.url().split('/')[2];
  context.on('console', message => console.log('BROWSER CONSOLE', message.type(), message.text().slice(0, 2000)));
  context.on('weberror', error => console.log('BROWSER ERROR', error.error().message));
  report.extensionId = extensionId;
  report.browser = context.browser()?.version();
  if (phase === 'preflight') report.installation = await installThroughManager(context, extensionId, scriptPath);
  page = await context.newPage();
  await page.goto(origin + '/rover.html?phase=' + phase);
  const pageProbe = await page.evaluate(async url => {
    try {await fetch(url, {method: 'POST', mode: 'no-cors', signal: AbortSignal.timeout(3500)}); return {ok: true};}
    catch (error) {return {ok: false, error: error.name};}
  }, config.outsideCanary + '/page-' + phase);
  assert.equal(pageProbe.ok, phase === 'preflight', 'Unexpected page egress result');
  const result = page.locator('#lnr-tm-qa-result');
  await result.waitFor({state: 'attached', timeout: 45000});
  const data = JSON.parse(await result.textContent());
  assert.equal(data.status, 'PASS', data.error);
  assert.equal(data.manager.handler, 'Tampermonkey');
  assert.equal(data.manager.version, '5.4.1');
  assert.equal(data.manager.scriptVersion, '0.0.1');
  assert.equal(data.localGmGet, true);
  if (phase === 'isolated') verifyScenarios(data.output, cases);
  assert(received.every(item => item.method === 'GET'), 'A write reached the local fixture server');
  Object.assign(report, {status: 'PASS', manager: data.manager, storage: data.storage,
    localGmGet: data.localGmGet, outsideGmPost: data.outsideGmPost, pageProbe,
    localWriteRequests: received.filter(item => item.method !== 'GET').length});
  if (data.output) Object.assign(report, {scenarios: data.output.results.length,
    events: data.output.events, processClicks: data.output.processClicks, postFillObservationMs: data.postFillObservationMs,
    cases: data.output.results.map(({id, scenario, result}) => ({id, scenario, status: result.status}))});
  console.log('Tampermonkey ' + phase + ' PASS', JSON.stringify(report.manager));
} catch (error) {
  report.status = 'FAIL'; report.error = error.message;
  console.error('QA FAILURE', error.stack);
  if (context) {
    for (const worker of context.serviceWorkers()) {
      const registration = await worker.evaluate(async () => {
        try {return {scripts: await chrome.userScripts.getScripts()};}
        catch (error) {return {error: error.message};}
      }).catch(error => ({error: error.message}));
      console.log('USERSCRIPT REGISTRATION', JSON.stringify(registration).slice(0, 8000));
    }
    for (const candidate of context.pages()) {
      if (candidate === page) continue;
      console.log('MANAGER DIAGNOSTIC', candidate.url(), (await candidate.locator('body').innerText().catch(() => '')).slice(0,7000));
    }
    const settings = await context.newPage();
    await settings.goto('chrome://extensions/');
    console.log('CHROMIUM EXTENSIONS', await settings.locator('body').innerText());
  }
  if (page) {
    await page.screenshot({path: path.join(directory, phase + '-failure.png')}).catch(() => {});
    console.log('QA PAGE DIAGNOSTIC', (await page.locator('body').innerText().catch(() => '')).slice(-6000));
  }
  throw error;
} finally {
  if (context) await context.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await writeFile(path.join(directory, phase + '.json'), JSON.stringify(report, null, 2) + '\n');
}
