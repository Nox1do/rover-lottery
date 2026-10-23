import test from 'node:test';
import assert from 'node:assert/strict';
import {buildQaUserscript} from '../browser/tampermonkey/build-qa.mjs';

test('el userscript de ensayo solo coincide con la copia local y declara permisos reales del gestor', async () => {
  const code = await buildQaUserscript('http://192.0.2.10:1234');
  const header = code.slice(0, code.indexOf('// ==/UserScript=='));
  assert.deepEqual(header.match(/^\/\/ @match .+$/gm), ['// @match http://127.0.0.1/rover.html*']);
  assert.doesNotMatch(header, /roversport|@connect \*|@require/);
  assert(header.includes('// @connect 127.0.0.1'));
  assert(header.includes('// @connect 192.0.2.10'));
  for (const name of ['GM_info', 'GM_xmlhttpRequest', 'GM_getValue', 'GM_setValue', 'GM_deleteValue'])
    assert(header.includes('// @grant ' + name));
  assert(code.includes('A real Tampermonkey installation is required'));
  assert(code.includes('GM background request escaped the network namespace'));
});

test('el builder no acepta un dominio de producción como servidor de control', async () => {
  await assert.rejects(buildQaUserscript('https://www.roversport.lol/adm/es/lottery.php'), /literal IPv4/);
  await assert.rejects(buildQaUserscript('http://127.0.0.1.example.invalid/'), /literal IPv4/);
});
