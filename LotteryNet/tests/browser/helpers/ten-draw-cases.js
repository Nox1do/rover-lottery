import {DRAWS} from '../../../src/states/index.js';
import {extractFromPage} from '../../../src/providers/lottery-net.js';
import {fillVisualInputs} from '../../../src/rover/fill-ui.js';
import {findUniqueRoverRow, FIELD_NAMES} from '../../../src/rover/rows.js';
import {createVisualCache, restoreVisibleValues} from '../../../src/rover/restore.js';
import {mountInlineStatus, setInlineStatus} from '../../../src/ui/controls.js';

/** Shared QA cases; bundled into Tampermonkey as well as run as page modules. */
export async function runTenDrawCases({cases, date, htmlByUrl, postFillObservationMs = 500}) {
  const html = new Map(Object.entries(htmlByUrl));
  // A fresh, pristine fixture for each scenario avoids inter-test state.
  const pristine = document.querySelector('#tableResult tbody').innerHTML;
  const reset = () => {
    document.querySelector('#tableResult tbody').innerHTML = pristine;
    document.querySelector('#fecha').value = '10/19/2026';
  };
  const events = {input: 0, change: 0, blur: 0};
  let processClicks = 0;
  for (const type of Object.keys(events)) document.addEventListener(type, event => {
    if (!event.target.matches?.('#tableResult input')) return;
    events[type]++;
    // Adversarial listener; any event-driven attempt is a functional failure.
    fetch('/unexpected-event-processing', {method: 'POST'}).catch(() => {});
  }, true);
  document.addEventListener('click', event => {
    if (event.target.matches?.('[data-qa-process]')) processClicks++;
  });
  const results = [];
  for (const draw of DRAWS) {
    reset();
    const row = () => findUniqueRoverRow({root: document, draw, date}).row;
    const values = () => FIELD_NAMES.map(name => row().querySelector('input[name="' + name + '"]').value);
    const allValues = () => Array.from(document.querySelectorAll('#tableResult input')).map(input => input.value);
    const otherValues = () => Array.from(document.querySelectorAll('#tableResult input'))
      .filter(input => input.getAttribute('loteria') !== draw.roverCode).map(input => input.value);
    const input = game => {
      const item = cases.find(item => item.state === draw.state && item.game === game);
      return extractFromPage(html.get(item.url), {state: draw.state, game, date, turn: draw.turn}).value;
    };
    const p3 = input('p3'), p4 = input('p4');
    const fill = (extra = {}) => fillVisualInputs({root: document, draw, date, p3, p4, ...extra});
    const run = (scenario, action) => { reset(); results.push({id: draw.id, scenario, ...action()}); };
    run('full', () => {
      const button = document.createElement('button'); button.dataset.qaProcess = '1';
      button.textContent = 'Synthetic process sentinel'; row().lastElementChild.append(button);
      const before = otherValues();
      const result = fill();
      const mounted = mountInlineStatus({root: document, draw, date, state: 'CARGANDO'});
      const loading = mounted.element.textContent;
      setInlineStatus(mounted.element, 'COMPLETADO');
      return {result, values: values(), before, after: otherValues(), loading, completed: mounted.element.textContent};
    });
    run('idempotent', () => { fill(); return {result: fill(), values: values()}; });
    run('p3-only', () => ({result: fill({p4: null}), values: values()}));
    run('p4-only', () => ({result: fill({p3: null}), values: values()}));
    run('leading-zeros', () => ({result: fill({p3: '007', p4: '0032'}), values: values()}));
    run('conflict', () => {
      row().querySelector('[name="pick3"]').value = p3 === '999' ? '998' : '999';
      const before = allValues(); return {result: fill(), before, after: allValues()};
    });
    run('date-changed', () => {
      document.querySelector('#fecha').value = '10/18/2026';
      const result = fill(); return {result, all: allValues()};
    });
    run('search-restore', () => {
      const cache = createVisualCache(); cache.remember({draw, date, p3, p4}); fill();
      document.querySelector('#tableResult tbody').innerHTML = pristine;
      return {result: restoreVisibleValues({root: document, draw, date, cache}), values: values()};
    });
    run('restore-conflict', () => {
      const cache = createVisualCache(); cache.remember({draw, date, p3, p4});
      document.querySelector('#tableResult tbody').innerHTML = pristine;
      row().querySelector('[name="pick3"]').value = p3 === '999' ? '998' : '999';
      const before = allValues();
      return {result: restoreVisibleValues({root: document, draw, date, cache}), before, after: allValues()};
    });
    run('wrong-code', () => {
      row().querySelector('input').setAttribute('loteria', 'WRONG-CODE');
      return {result: fill(), all: allValues()};
    });
    run('duplicate-row', () => {
      row().after(row().cloneNode(true)); return {result: fill(), all: allValues()};
    });
    run('missing-row', () => { row().remove(); return {result: fill(), all: allValues()}; });
  }
  // Observe browser task turns and fire-and-forget traffic before taking
  // event/click snapshots. Routing remains active throughout this interval.
  // This bounds the measurement; it makes no claim about arbitrarily late work.
  await new Promise(resolve => setTimeout(resolve, postFillObservationMs));
  return {results, events, processClicks};
}
