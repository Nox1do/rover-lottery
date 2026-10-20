import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const moduleSrc = path => readFile(new URL(path,import.meta.url),'utf8');
test('el llenado visual no dispara eventos, clicks ni peticiones hacia Rover',async()=>{
 for(const file of ['../../src/rover/fill-ui.js','../../src/rover/restore.js','../../src/ui/controls.js']){
   const source=await moduleSrc(file);
   assert.doesNotMatch(source,/\.dispatchEvent\s*\(|\.click\s*\(|\.submit\s*\(|(?<![a-z])fetch\s*\(|GM_xmlhttpRequest\s*\(|new\s+XMLHttpRequest\s*\(|procesarResultados\.php/);
 }
});
test('el auditor pasivo no modifica resultados ni intercepta la red',async()=>{
 const source=await moduleSrc('../browser/rover-safety-audit.user.js');
 assert.match(source,/@grant\s+none/);
 assert.match(source,/window,'__LOTTERYNET_SAFETY_QA__'/);
 assert.doesNotMatch(source,/\.value\s*=|\.dispatchEvent\s*\(|\.click\s*\(|\.submit\s*\(|\.innerHTML\s*=|\bfetch\s*\(|new\s+XMLHttpRequest\s*\(|GM_xmlhttpRequest\s*\(/);
});
