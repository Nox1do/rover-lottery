import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

async function listJs(folder) {
  const entries = await readdir(new URL(folder, import.meta.url), {withFileTypes:true});
  const all = [];
  for (const entry of entries) {
    const path = folder + entry.name;
    if (entry.isDirectory()) all.push(...await listJs(path + '/'));
    else if (entry.name.endsWith('.js')) all.push(path);
  }
  return all;
}

test('ninguna implementación de fuente escribe/procesa por red en Rover', async () => {
  const files = await listJs('../../src/');
  for (const file of files) {
    const contents = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(contents, /procesarResultados\.php|Save\s*All|fetch\s*\(\s*['"`][^'"`]*roversport/iu);
  }
});

test('la entrada se mantiene inactiva hasta validación', async () => {
  const contents = await readFile(new URL('../../src/index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(contents, /startScheduler\s*\(|fillVisualInputs\s*\(|fetchLotteryNetResult\s*\(/);
});
