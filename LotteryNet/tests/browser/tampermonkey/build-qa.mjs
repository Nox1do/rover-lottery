import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

/** Only a loopback test page is eligible. The script has no production matches. */
export async function buildQaUserscript(outsideCanary) {
  const outside = new URL(outsideCanary);
  if (outside.protocol !== 'http:' || !/^\d+\.\d+\.\d+\.\d+$/.test(outside.hostname))
    throw Error('The QA canary must be a literal IPv4 HTTP endpoint');
  const cases = JSON.parse(await readFile(new URL('../../fixtures/lotterynet/cases.json', import.meta.url)));
  const header = [
    '// ==UserScript==',
    '// @name LotteryNet — Tampermonkey isolated QA',
    '// @namespace noeg.lotterynet.qa.tampermonkey',
    '// @version 0.0.1',
    '// @description TEST ONLY: local captured rows, never production Rover',
    '// @match http://127.0.0.1/rover.html*',
    '// @run-at document-idle',
    '// @noframes',
    '// @grant GM_info',
    '// @grant GM_xmlhttpRequest',
    '// @grant GM_getValue',
    '// @grant GM_setValue',
    '// @grant GM_deleteValue',
    '// @connect 127.0.0.1',
    '// @connect ' + outside.hostname,
    '// @updateURL none',
    '// @downloadURL none',
    '// ==/UserScript=='
  ].join('\n');
  const compiled = await build({entryPoints: [fileURLToPath(new URL('./userscript-entry.js', import.meta.url))],
    bundle: true, write: false, format: 'iife', platform: 'browser', target: 'chrome120',
    define: {__LOTTERYNET_OUTSIDE_CANARY__: JSON.stringify(outsideCanary),
      __LOTTERYNET_QA_CASES__: JSON.stringify(cases)},
    banner: {js: header}, legalComments: 'none'});
  return compiled.outputFiles[0].text;
}
