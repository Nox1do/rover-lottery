import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRoverFields } from '../../src/rover/mapping.js';

test('mapeo de los cinco inputs y ceros iniciales', () => {
  assert.deepEqual([...mapRoverFields({ p3:'407', p4:'0832' })], ['07','08','32','407','0832']);
  assert.deepEqual([...mapRoverFields({ p3:'007', p4:'0004' })], ['07','00','04','007','0004']);
});

test('parciales no inventan dígitos faltantes', () => {
  assert.deepEqual([...mapRoverFields({p3:'123'})], ['23',null,null,'123',null]);
  assert.deepEqual([...mapRoverFields({p4:'0000'})], [null,'00','00',null,'0000']);
});

test('rechazar números mal formados', () => {
  assert.throws(() => mapRoverFields({p3:'12'}), TypeError);
  assert.throws(() => mapRoverFields({p4:1234}), TypeError);
  assert.throws(() => mapRoverFields({p3:'a01'}), TypeError);
});
