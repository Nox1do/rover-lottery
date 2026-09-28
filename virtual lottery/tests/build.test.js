import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);

test('build emits one self-contained Tampermonkey userscript', () => {
  const run = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const dist = readFileSync(new URL('../dist/virtual-lottery-v2-auto.user.js', import.meta.url), 'utf8');
  assert.ok(dist.startsWith('// ==UserScript=='));
  assert.match(dist, /@name\s+Virtual Lotteries v2 Auto/);
  for (const token of [
    '@match        https://www.roversport.lol/adm/es/lottery.php',
    '@match        https://www.roversport.net/adm/es/lottery.php',
    '@grant        GM_setValue',
    '@grant        GM_getValue',
    '@grant        GM_xmlhttpRequest',
    '@connect      qplay777.net'
  ]) assert.ok(dist.includes(token), `missing metadata: ${token}`);
  assert.doesNotMatch(dist, /\bimport\s+[^(']/);
  assert.doesNotMatch(dist, /\bfrom\s+['"]\.\.?\//);
});

test('concurrent builds never expose a truncated dist file', async () => {
  const distUrl = new URL('../dist/virtual-lottery-v2-auto.user.js', import.meta.url);
  for (let round = 0; round < 12; round++) {
    const children = Array.from({ length: 6 }, () =>
      spawn(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'ignore' })
    );
    let badRead = null;
    while (children.some(child => child.exitCode === null)) {
      try {
        const current = readFileSync(distUrl, 'utf8');
        if (!current.startsWith('// ==UserScript==')) {
          badRead = current.slice(0, 64);
          break;
        }
      } catch (error) {
        badRead = String(error);
        break;
      }
      await new Promise(resolve => setImmediate(resolve));
    }
    await Promise.all(children.map(child => new Promise(resolve => {
      if (child.exitCode !== null) return resolve(child.exitCode);
      child.once('exit', resolve);
    })));
    assert.equal(badRead, null, `observed partial dist during concurrent build: ${JSON.stringify(badRead)}`);
  }
});
