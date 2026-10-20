import test from 'node:test';
import assert from 'node:assert/strict';
import { DRAWS, findDraw } from '../../src/states/index.js';
import { validateIdentity } from '../../src/core/validation.js';

test('exactamente 10 sorteos y 5 estados aprobados', () => {
  assert.equal(DRAWS.length, 10);
  assert.deepEqual([...new Set(DRAWS.map(x => x.state))].sort(), ['FL','IN','LA','OH','TN']);
  assert.equal(new Set(DRAWS.map(x => x.id)).size, 10);
  assert.equal(new Set(DRAWS.map(x => x.roverCode)).size,10);
  for (const draw of DRAWS) {
    assert.deepEqual(draw.games, ['p3', 'p4']);
    assert.ok(draw.roverLabel);
    assert.ok(draw.roverCode);
    assert.ok(draw.timeZone.startsWith('America/'));
  }
});

test('identidad exacta por fecha y turno', () => {
  assert.equal(findDraw('tn-morning')?.turn, 'MORNING');
  assert.equal(validateIdentity({id:'tn-morning',date:'2026-10-19',turn:'MORNING',game:'p3'}), true);
  assert.equal(validateIdentity({id:'tn-morning',date:'2026-10-19',turn:'MIDDAY',game:'p3'}), false);
  assert.equal(validateIdentity({id:'tn-morning',date:'2026-02-30',turn:'MORNING',game:'p3'}), false);
  assert.equal(validateIdentity({id:'tx-night',date:'2026-10-19',turn:'NIGHT',game:'p3'}), false);
});
