/** Real Firefox/AMO manager adapter. No injected GM implementations. */
import {Builder, By, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {createServer} from 'node:http';
import {readFile, writeFile, readlink} from 'node:fs/promises';
import {networkInterfaces} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
import {buildQaUserscript} from './build-qa.mjs';
import {verifyScenarios} from '../helpers/assert-scenarios.mjs';

const [phase, configPath] = process.argv.slice(2);
assert(['preflight', 'isolated'].includes(phase));
const config = JSON.parse(await readFile(configPath));
assert.equal(config.browser, 'firefox');
const directory = config.directory;
const report = {status: 'RUNNING', phase, browserName: 'firefox'};
const received = [];
let driver;
let server;

async function readInstalledAddon() {
  // Only read metadata of the installed extension in this disposable profile.
  // Geckodriver's documented system-access opt-in is needed for this read.
  await driver.setContext(firefox.Context.CHROME);
  try {
    return await driver.executeAsyncScript(function(guid, done) {
      (async () => {
        const {AddonManager} = ChromeUtils.importESModule('resource://gre/modules/AddonManager.sys.mjs');
        const addon = await AddonManager.getAddonByID(guid);
        const uuid = JSON.parse(Services.prefs.getStringPref('extensions.webextensions.uuids', '{}'))[guid];
        done(addon && uuid ? {id: addon.id, version: addon.version, active: addon.isActive,
          signed: addon.signedState >= AddonManager.SIGNEDSTATE_SIGNED,
          origin: 'moz-extension://' + uuid + '/'} : null);
      })().catch(error => done({error: error.message}));
    }, 'firefox@tampermonkey.net');
  } finally {await driver.setContext(firefox.Context.CONTENT);}
}

async function installUserscript(origin, scriptPath) {
  await driver.switchTo().newWindow('tab');
  const optionsHandle = await driver.getWindowHandle();
  await driver.get(origin + 'options.html#nav=utils');
  const upload = await driver.wait(until.elementLocated(By.css('input[type=file]')), 20000);
  await upload.sendKeys(scriptPath);
  let confirmationClicked = false;
  await driver.wait(async () => {
    for (const handle of await driver.getAllWindowHandles()) {
      await driver.switchTo().window(handle);
      if (!(await driver.getCurrentUrl()).startsWith(origin)) continue;
      for (const button of await driver.findElements(By.css('.ask_action_buttons input[type=button], .ask_action_buttons button'))) {
        const label = (await button.getAttribute('value')) || await button.getText();
        if (/^(Install|Import)$/i.test(label) && await button.isDisplayed()) {
          await button.click(); confirmationClicked = true; return true;
        }
      }
    }
    return false;
  }, 20000, 'Real manager confirmation was not available');
  assert(confirmationClicked);
  await driver.switchTo().window(optionsHandle);
  const dashboard = By.xpath("//*[normalize-space(text())='Installed Userscripts']");
  await driver.wait(async () => {
    const element = await driver.findElement(dashboard);
    return driver.executeScript(function(target) {
      const box = target.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return !!hit && (hit === target || target.contains(hit));
    }, element);
  }, 20000, 'Import overlay still covers the dashboard');
  await driver.findElement(dashboard).click();
  const enabled = By.xpath("//tr[.//*[normalize-space(text())='LotteryNet — Tampermonkey isolated QA']]//*[contains(concat(' ',normalize-space(@class),' '),' enabler_enabled ')]");
  await driver.wait(until.elementLocated(enabled), 20000);
  return {method: 'Utilities file import and manager confirmation', dashboardEnabled: true};
}

try {
  if (phase === 'isolated') {
    assert.notEqual(await readlink('/proc/self/ns/net'), config.parentNetworkNamespace, 'Network namespace did not change');
    const interfaces = Object.keys(networkInterfaces());
    assert(interfaces.every(name => name === 'lo'), 'Non-loopback interface present');
    const routes = JSON.parse(execFileSync('ip', ['-j', 'route', 'show'], {encoding: 'utf8'}));
    assert.equal(routes.length, 0, 'External IPv4 route present');
    report.networkIsolation = {namespaceChanged: true, interfaces, externalRoutes: routes.length};
  }
  const provenance = JSON.parse(await readFile(path.join(directory, 'extension-provenance.json')));
  const xpi = path.join(directory, 'tampermonkey.xpi');
  assert.equal(createHash('sha256').update(await readFile(xpi)).digest('hex'), provenance.sha256);
  const cases = JSON.parse(await readFile('tests/fixtures/lotterynet/cases.json'));
  const fixture = await readFile('tests/fixtures/rover/ten-draws-sanitized.html', 'utf8');
  const userscript = await buildQaUserscript(config.outsideCanary);
  report.userscriptSha256 = createHash('sha256').update(userscript).digest('hex');
  const scriptPath = path.join(directory, 'LotteryNet-Tampermonkey-QA.user.js');
  await writeFile(scriptPath, userscript);
  const fixtures = new Map(await Promise.all(cases.map(async item =>
    [item.fixture, await readFile('tests/fixtures/lotterynet/' + item.fixture, 'utf8')])));
  server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    received.push({method: request.method, path: pathname});
    if (request.method !== 'GET') {response.writeHead(405); response.end('Unexpected QA write'); return;}
    if (pathname === '/rover.html') {response.setHeader('Content-Type', 'text/html'); response.end(fixture);}
    else if (pathname === '/gm-ok') response.end('local-ok');
    else if (pathname.startsWith('/fixtures/') && fixtures.has(pathname.slice(10))) {
      response.setHeader('Content-Type', 'text/html'); response.end(fixtures.get(pathname.slice(10)));
    } else {response.writeHead(404); response.end('Not a QA resource');}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const options = new firefox.Options().setBinary(config.executablePath).addArguments('-headless')
    .setPreference('intl.locale.requested', 'en-US');
  const service = new firefox.ServiceBuilder(config.geckodriverPath).addArguments('--allow-system-access')
    .loggingTo(path.join(directory, phase + '-geckodriver.log'));
  driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(service).build();
  await driver.manage().setTimeouts({pageLoad: 25000, script: 15000});
  const capabilities = await driver.getCapabilities();
  assert.equal(capabilities.get('browserName'), 'firefox');
  report.browser = capabilities.get('browserVersion');
  report.geckodriver = capabilities.get('moz:geckodriverVersion');
  if (config.expectedBrowserVersion) assert.equal(report.browser, config.expectedBrowserVersion);
  report.extensionId = await driver.installAddon(xpi, false);
  assert.equal(report.extensionId, provenance.addonId);
  const addon = await driver.wait(async () => {
    const info = await readInstalledAddon();
    return info?.active && info?.signed ? info : false;
  }, 20000, 'AMO extension did not become active with a verified signature');
  assert.equal(addon.version, provenance.version);
  report.addon = addon;
  report.installation = await installUserscript(addon.origin, scriptPath);
  console.log('Firefox real manager installed and enabled', JSON.stringify(addon));
  await driver.switchTo().newWindow('tab');
  await driver.get(origin + '/rover.html?phase=' + phase);
  const pageProbe = await driver.executeAsyncScript(function(url, done) {
    fetch(url, {method: 'POST', mode: 'no-cors', signal: AbortSignal.timeout(3500)})
      .then(() => done({ok: true}), error => done({ok: false, error: error.name}));
  }, config.outsideCanary + '/page-' + phase);
  assert.equal(pageProbe.ok, phase === 'preflight', 'Unexpected page egress result');
  const result = await driver.wait(until.elementLocated(By.id('lnr-tm-qa-result')), 45000);
  const data = JSON.parse(await result.getAttribute('textContent'));
  assert.equal(data.status, 'PASS', data.error);
  assert.equal(data.manager.handler, 'Tampermonkey');
  assert.equal(data.manager.version, provenance.version);
  assert.equal(data.manager.scriptVersion, '0.0.1');
  assert.equal(data.localGmGet, true);
  assert.deepEqual(data.storage, {stored: true, deleted: true});
  assert.equal(data.outsideGmPost.ok, phase === 'preflight');
  if (phase === 'isolated') verifyScenarios(data.output, cases);
  assert(received.every(item => item.method === 'GET'), 'A write reached the local fixture server');
  Object.assign(report, {status: 'PASS', manager: data.manager, storage: data.storage,
    localGmGet: true, outsideGmPost: data.outsideGmPost, pageProbe, localWriteRequests: 0});
  if (data.output) Object.assign(report, {scenarios: data.output.results.length,
    events: data.output.events, processClicks: data.output.processClicks, postFillObservationMs: data.postFillObservationMs,
    cases: data.output.results.map(({id, scenario, result}) => ({id, scenario, status: result.status}))});
  console.log('Firefox Tampermonkey ' + phase + ' PASS', JSON.stringify(report.manager));
} catch (error) {
  report.status = 'FAIL'; report.error = error.message;
  console.error('FIREFOX QA FAILURE', error.stack);
  console.log('LOCAL REQUESTS', JSON.stringify(received));
  console.log('GECKODRIVER DIAGNOSTIC', (await readFile(path.join(directory, phase + '-geckodriver.log'), 'utf8').catch(() => '')).slice(-10000));
  if (driver) {
    for (const handle of await driver.getAllWindowHandles().catch(() => [])) {
      await driver.switchTo().window(handle).catch(() => {});
      const url = await driver.getCurrentUrl().catch(() => '');
      if (!/^(moz-extension:|http:\/\/127\.0\.0\.1)/.test(url)) continue;
      console.log('FIREFOX DIAGNOSTIC', url, (await driver.findElement(By.css('body')).getText().catch(() => '')).slice(-7000));
      const image = await driver.takeScreenshot().catch(() => null);
      if (image) await writeFile(path.join(directory, phase + '-' + handle.replace(/[^a-z0-9]/gi, '') + '.png'), Buffer.from(image, 'base64'));
    }
  }
  throw error;
} finally {
  try {if (driver) await driver.quit();}
  finally {
    if (server) {server.closeAllConnections(); await new Promise(resolve => server.close(resolve));}
    await writeFile(path.join(directory, phase + '.json'), JSON.stringify(report, null, 2) + '\n');
  }
}
