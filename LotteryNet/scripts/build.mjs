import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const base = 'https://raw.githubusercontent.com/Nox1do/rover-lottery/main/LotteryNet/dist/';
const lines = [
  '// ==UserScript==',
  '// @name         LotteryNet Rover (SCaffold - INACTIVO)',
  '// @namespace    noeg.lotterynet.rover',
  `// @version      ${version}`,
  '// @description  Proyecto Lottery.net independiente: esqueleto sin llenado ni procesamiento.',
  '// @match        https://www.roversport.net/adm/es/lottery.php*',
  '// @match        https://roversport.net/adm/es/lottery.php*',
  '// @match        https://www.roversport.lol/adm/es/lottery.php*',
  '// @match        https://roversport.lol/adm/es/lottery.php*',
  '// @noframes',
  '// @run-at       document-idle',
  '// @grant        GM_xmlhttpRequest',
  '// @grant        GM_getValue',
  '// @grant        GM_setValue',
  '// @grant        GM_addValueChangeListener',
  '// @grant        GM_removeValueChangeListener',
  '// @connect      www.lottery.net',
  `// @updateURL    ${base}LotteryNet-Rover.meta.js`,
  `// @downloadURL  ${base}LotteryNet-Rover.user.js`,
  '// ==/UserScript==',
].join('\n') + '\n';
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await build({
  entryPoints: [new URL('../src/index.js', import.meta.url).pathname],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['chrome109', 'firefox115'],
  outfile: new URL('../dist/LotteryNet-Rover.user.js', import.meta.url).pathname,
  banner: { js: lines.trimEnd() },
  legalComments: 'none',
});
await writeFile(new URL('../dist/LotteryNet-Rover.meta.js', import.meta.url), lines, 'utf8');
console.log('Build generado: esqueleto INACTIVO. NO instalar como script funcional.');
