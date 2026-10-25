const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const metadata = require('../metadata.json');
const file = 'Rovs-Loterias-USA-React';
const base = 'https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA%20React/';
const lines = [
  ['name', metadata.name], ['namespace', metadata.namespace], ['version', metadata.version],
  ['description', 'Barra manual de loterías USA para la tabla React de Rover. Solo llenado de formulario.'],
  ['author', 'noeg'], ['match', 'https://central.roversport.net/*'], ['run-at', 'document-end'],
  ['grant', 'GM_xmlhttpRequest'], ['grant', 'GM_info'], ...metadata.connect.map(host => ['connect', host]),
  ['updateURL', base + file + '.meta.js'], ['downloadURL', base + file + '.user.js'],
  ['homepageURL', 'https://github.com/Nox1do/rover-lottery/tree/main/Loterias%20USA%20React'],
  ['supportURL', 'https://github.com/Nox1do/rover-lottery/issues']
];
const header = '// ==UserScript==\n' + lines.map(([key,value]) => `// @${key.padEnd(13)}${value}`).join('\n') + '\n// @noframes\n// ==/UserScript==\n';
const names = ['config', 'helpers', 'status', 'providers', 'rover', 'feedback', 'ui', 'main'];
const body = names.map(name => `\n// --- src/${name}.js ---\n` + fs.readFileSync(path.join(root,'src',name+'.js'),'utf8')).join('\n');
const script = header + `\n(function () {\n'use strict';\nconst APP_VERSION = ${JSON.stringify(metadata.version)};\n` + body + '\n})();\n';
new (require('node:vm').Script)(script);
fs.writeFileSync(path.join(root,file+'.user.js'),script);
fs.writeFileSync(path.join(root,file+'.meta.js'),header);
if (process.argv.includes('--release')) {
  const archive = path.join(root,'versions',`${file}-v${metadata.version}.user.js`);
  if (fs.existsSync(archive) && fs.readFileSync(archive,'utf8') !== script) throw Error('La versión histórica ya existe y es diferente');
  fs.mkdirSync(path.dirname(archive),{recursive:true});fs.writeFileSync(archive,script);
}
console.log(`Build ${metadata.version}: ${names.length} módulos, ${Buffer.byteLength(script)} bytes`);
