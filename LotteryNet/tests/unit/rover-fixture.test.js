import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DRAWS} from '../../src/states/index.js';

const fixture = readFileSync(new URL('../fixtures/rover/ten-draws-sanitized.html', import.meta.url), 'utf8');

test('la copia depurada conserva diez identidades y cincuenta campos vacíos', () => {
  assert.equal([...fixture.matchAll(/<tr\b/g)].length, 10);
  const inputs = [...fixture.matchAll(/<input\b([^>]+)>/g)].map(match => match[1]);
  const fields = inputs.filter(attributes => /\bloteria=/.test(attributes));
  assert.equal(fields.length, 50);
  assert(fields.every(attributes => /\bvalue=""/.test(attributes)));
  for (const draw of DRAWS) {
    assert.equal(fixture.split('class="loteria-nombre">' + draw.roverLabel + '</span>').length - 1, 1);
    const drawFields = fields.filter(attributes => attributes.includes('loteria="' + draw.roverCode + '"'));
    assert.equal(drawFields.length, 5);
    for (const name of ['primera', 'segunda', 'tercera', 'pick3', 'pick4'])
      assert.equal(drawFields.filter(attributes => attributes.includes('name="' + name + '"')).length, 1);
  }
});

test('la copia depurada no publica historiales, acciones, scripts ni atributos de sesión', () => {
  assert.doesNotMatch(fixture, /<(?:script|form|iframe|button|a|link|style)\b/i);
  assert.doesNotMatch(fixture, /\b(?:on\w+|data-[\w-]+|title|href|src|action)\s*=/i);
  assert.doesNotMatch(fixture, /Historial|publicacion|procesarResultados|https?:\/\//i);
  const allowedAttributes = new Set(['lang', 'charset', 'id', 'value', 'class', 'style', 'name', 'loteria', 'type']);
  for (const [, name] of fixture.matchAll(/\s([\w-]+)="[^"]*"/g)) assert(allowedAttributes.has(name), name);
});
