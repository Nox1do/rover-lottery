/** The parent owns a canary outside the test network namespace. */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {networkInterfaces} from 'node:os';
import {readFile, writeFile, mkdir, readlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';

const directory = path.resolve('test-results/tampermonkey');
await mkdir(directory, {recursive: true});
const received = [];
const address = Object.values(networkInterfaces()).flat()
  .find(item => item.family === 'IPv4' && !item.internal)?.address;
assert(address, 'A host IPv4 address is required for the external canary');
const server = createServer((request, response) => {
  received.push({method: request.method, path: new URL(request.url, 'http://localhost').pathname});
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Private-Network', 'true');
  response.end('outside-canary');
});
await new Promise(resolve => server.listen(0, '0.0.0.0', resolve));
const outsideCanary = 'http://' + address + ':' + server.address().port;
const configPath = path.join(directory, 'config.json');
const reportPath = path.join(directory, 'result.json');
const report = {status: 'RUNNING', generatedAt: new Date().toISOString(),
  scope: 'Real Tampermonkey on sanitized local rows, no authenticated Rover',
  limitations: ['Chromium only', 'No production session', 'No installed user scripts from user profile'],
  outsideCanary};
const run = args => new Promise((resolve, reject) => {
  const process = spawn(args[0], args.slice(1), {stdio: 'inherit'});
  process.on('error', reject);
  process.on('exit', code => code === 0 ? resolve() : reject(Error('QA child exited: ' + code)));
});
try {
  assert.equal((await fetch(outsideCanary + '/server-control')).status, 200);
  const config = {directory, outsideCanary,
    executablePath: chromium.executablePath(), parentNetworkNamespace: await readlink('/proc/self/ns/net')};
  await writeFile(configPath, JSON.stringify(config));
  const controller = path.resolve('tests/browser/tampermonkey/controller.mjs');
  await run([process.execPath, controller, 'preflight', configPath]);
  const preflight = JSON.parse(await readFile(path.join(directory, 'preflight.json')));
  assert.equal(preflight.status, 'PASS');
  assert(received.some(item => item.method === 'POST' && item.path === '/gm-preflight'));
  assert(received.some(item => item.method === 'POST' && item.path === '/page-preflight'));
  const baseline = received.length;
  await run(['sudo', '-n', 'unshare', '--net', '--', 'sh', '-c',
    'set -eu; ip link set lo up; exec "$@"', 'lotterynet-qa',
    process.execPath, controller, 'isolated', configPath]);
  const isolated = JSON.parse(await readFile(path.join(directory, 'isolated.json')));
  assert.equal(isolated.status, 'PASS');
  assert.equal(received.length, baseline, 'A request escaped the isolated namespace');
  Object.assign(report, {status: 'PASS', preflight, isolated,
    canaryRequestsDuringIsolation: received.length - baseline,
    extension: JSON.parse(await readFile(path.join(directory, 'extension-provenance.json')))});
  console.log('Tampermonkey isolated QA PASS — real manager, 120 cases, page/GM egress blocked');
} catch (error) {
  report.status = 'FAIL'; report.error = error.message; throw error;
} finally {
  await new Promise(resolve => server.close(resolve));
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
}
