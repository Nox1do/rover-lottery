import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveManagerTarget} from '../browser/tampermonkey/manager-target.mjs';

test('Firefox exige binarios explícitos y selecciona su propio controlador y evidencia', () => {
  const result = resolveManagerTarget('firefox', {FIREFOX_PATH: '/tools/firefox', GECKODRIVER_PATH: '/tools/geckodriver'});
  assert.equal(result.browser, 'firefox');
  assert.equal(result.controller, 'controller-firefox.mjs');
  assert.equal(result.directory, 'tampermonkey-firefox');
  assert.equal(result.executablePath, '/tools/firefox');
  assert.equal(result.geckodriverPath, '/tools/geckodriver');
});
test('Firefox no cae silenciosamente a Chromium si faltan sus ejecutables', () => {
  assert.throws(() => resolveManagerTarget('firefox', {}), /FIREFOX_PATH/);
  assert.throws(() => resolveManagerTarget('firefox', {FIREFOX_PATH: '/firefox'}), /GECKODRIVER_PATH/);
  assert.throws(() => resolveManagerTarget('firefox', {FIREFOX_PATH: 'firefox', GECKODRIVER_PATH: '/geckodriver'}), /absolute/);
});
test('un navegador de gestor desconocido falla antes de iniciar un ensayo', () => {
  assert.throws(() => resolveManagerTarget('webkit', {}), /Unsupported/);
});
test('la selección Chromium conserva el ensayo anterior', () => {
  const result = resolveManagerTarget('chromium', {});
  assert.equal(result.controller, 'controller.mjs');
  assert.equal(result.directory, 'tampermonkey');
});
