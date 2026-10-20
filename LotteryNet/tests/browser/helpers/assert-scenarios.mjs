import assert from 'node:assert/strict';
import {DRAWS} from '../../../src/states/index.js';

export function verifyScenarios(output, cases) {
  assert.equal(output.results.length, DRAWS.length * 12);
  for (const draw of DRAWS) {
    const value = game => cases.find(item => item.state === draw.state && item.game === game)
      .draws.find(item => item.turn === draw.turn).value;
    const p3 = value('p3'), p4 = value('p4');
    const expected = [p3.slice(-2), p4.slice(0, 2), p4.slice(-2), p3, p4];
    const rows = output.results.filter(item => item.id === draw.id);
    assert.equal(rows.length, 12);
    for (const item of rows) {
      const label = draw.id + ': ' + item.scenario;
      if (['full', 'search-restore'].includes(item.scenario)) {
        assert.equal(item.result.status, 'COMPLETADO', label);
        assert.equal(item.result.written, 5, label);
        assert.deepEqual(item.values, expected, label);
        if (item.scenario === 'full') {
          assert.deepEqual(item.after, item.before, label + ' other draws unchanged');
          assert.equal(item.loading, 'Consultando', label);
          assert.equal(item.completed, 'Casillas completadas', label);
        }
      } else if (item.scenario === 'idempotent') {
        assert.equal(item.result.status, 'COINCIDENTE', label);
        assert.equal(item.result.written, 0, label);
        assert.deepEqual(item.values, expected, label);
      } else if (item.scenario === 'p3-only' || item.scenario === 'p4-only') {
        assert.equal(item.result.status, 'PARCIAL', label);
        assert.deepEqual(item.values, item.scenario === 'p3-only'
          ? [expected[0], '', '', p3, ''] : ['', expected[1], expected[2], '', p4], label);
      } else if (item.scenario === 'leading-zeros') {
        assert.equal(item.result.status, 'COMPLETADO', label);
        assert.deepEqual(item.values, ['07', '00', '32', '007', '0032'], label);
      } else if (item.before) {
        assert.equal(item.result.status, 'CONFLICTO', label);
        assert.deepEqual(item.after, item.before, label);
      } else {
        assert.equal(item.result.ok, false, label);
        assert.equal(item.result.status,
          ['duplicate-row', 'missing-row'].includes(item.scenario) ? 'SIN_FILA' : 'CONFLICTO', label);
        assert(item.all.every(value => value === ''), label + ' no writes');
      }
    }
  }
  assert.deepEqual(output.events, {input: 0, change: 0, blur: 0});
  assert.equal(output.processClicks, 0);
}

