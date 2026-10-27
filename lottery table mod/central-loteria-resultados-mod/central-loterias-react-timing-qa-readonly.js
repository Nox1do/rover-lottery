/* Central Loterías · React Timing QA v1.1 · SOLO LECTURA
 * Instalar ANTES de pulsar Buscar: Firefox F12 > Consola > pegar todo el script.
 * Sin cambios a inputs, React, CSS, red o datos de loterías.
 */
(() => {
  'use strict';
  const KEY = '__CENTRAL_TIMING_QA__';
  if (window[KEY]?.stop) window[KEY].stop();
  const MOD = '__CENTRAL_LOTERIAS_REACT_QA__';
  const normalize = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim().toUpperCase();
  const round = n => Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  const now = () => performance.now();
  const results = [];
  const MAX_ROUNDS = 8;
  const WATCH_MS = 12000;
  const SELECTOR = 'table, [role="table"], [role="grid"]';
  const ATTRS = ['data-clr-table', 'data-clr-filter', 'data-clr-width-locked',
    'data-clr-state', 'data-clr-highlight', 'hidden'];
  const ids = new WeakMap();
  let seq = 0, active = null, live = true, timeout = 0, frame = 0, observer = null;
  const identity = e => {
    if (!e) return null;
    if (!ids.has(e)) ids.set(e, ++seq);
    return ids.get(e);
  };
  function validTable(table) {
    if (!table?.isConnected ||
      table.closest('[role="dialog"], [role="alertdialog"], [aria-modal="true"], dialog')) return false;
    const heads = [...table.querySelectorAll('thead tr:last-child th, [role="columnheader"]')]
      .map(h => normalize(h.textContent));
    return heads.includes('LOTERIA') && heads.some(h => /^PROC\.?$/.test(h)) &&
      heads.some(h => /^PEND\.?$/.test(h)) &&
      heads.filter(h => /^(1ERA|2DA|3RA|PICK 3|PICK 4)$/.test(h)).length >= 3;
  }
  function findTable() {
    return [...document.querySelectorAll(SELECTOR)].find(validTable) || null;
  }
  function state() {
    const t = findTable();
    const panel = document.querySelector('#clr001-panel');
    const n = t?.querySelectorAll('tbody tr').length || 0;
    const marked = t?.querySelectorAll('tbody tr[data-clr-state]').length || 0;
    const mod = window[MOD]?.status?.() || null;
    return {
      tableId: identity(t), headers: t?.querySelectorAll('thead th').length || 0,
      hasFotos: Boolean([...t?.querySelectorAll('thead th') || []]
        .some(h => normalize(h.textContent) === 'FOTOS')),
      rows: n, markedRows: marked,
      styled: t?.getAttribute('data-clr-table') === 'true',
      widthLocked: t?.getAttribute('data-clr-width-locked') === 'true',
      panelMounted: Boolean(panel?.isConnected),
      panelHidden: panel?.hidden ?? null,
      stylePresent: Boolean(document.getElementById('clr001-style')),
      widthStylePresent: Boolean(document.getElementById('clr001-column-widths')),
      modVersion: mod?.version || null,
      scans: mod?.performance?.scans ?? null,
      rowPasses: mod?.performance?.rowPasses ?? null,
      immediateDiscoveries: mod?.performance?.immediateDiscoveries ?? null,
      immediateRowRefreshes: mod?.performance?.immediateRowRefreshes ?? null,
      lastBindDurationMs: mod?.timings?.lastBindDurationMs ?? null,
      shadcnLike: Boolean(t?.classList.contains('caption-bottom') &&
        t?.classList.contains('text-sm')),
      reactRoot: Boolean(document.querySelector('#root')),
    };
  }
  function sample(name, time = now()) {
    if (!active || active.done) return;
    const current = state(), last = active.latest;
    const keys = ['tableId', 'rows', 'markedRows', 'styled', 'widthLocked',
      'panelMounted', 'panelHidden', 'rowPasses', 'immediateRowRefreshes'];
    const changes = {};
    for (const key of keys) if (!last || last[key] !== current[key]) changes[key] = current[key];
    if (Object.keys(changes).length && active.timeline.length < 120) {
      active.timeline.push({ offsetMs: round(time - active.time), event: name, changes });
    }
    active.latest = current;
    const phase = (key, yes) => {
      if (active.phases[key] == null && yes) active.phases[key] = round(time - active.time);
    };
    phase('tableFirstObserved', Boolean(current.tableId));
    phase('rowsFirstObserved', current.rows > 0);
    phase('modAttributeFirstObserved', current.styled);
    phase('columnLockFirstObserved', current.widthLocked);
    phase('allRowsAnnotated', current.rows > 0 && current.markedRows === current.rows);
    phase('panelFirstMounted', current.panelMounted);
    phase('panelFirstVisible', current.panelMounted && current.panelHidden === false);
    if (active.domChanged && active.before.tableId) {
      phase('rowPassAfterChange', current.rowPasses != null && active.before.rowPasses != null &&
        current.rowPasses > active.before.rowPasses);
      phase('immediateRefreshAfterChange', current.immediateRowRefreshes != null &&
        active.before.immediateRowRefreshes != null &&
        current.immediateRowRefreshes > active.before.immediateRowRefreshes);
    }
  }
  function rafProbe() {
    if (!active || active.done || now() - active.time > 2000) return;
    sample('requestAnimationFrame (antes de repintado)');
    frame = requestAnimationFrame(rafProbe);
  }
  function finish(reason = 'manual') {
    if (!active || active.done) return;
    clearTimeout(timeout);
    cancelAnimationFrame(frame);
    sample('fin');
    active.done = true;
    active.elapsedMs = round(now() - active.time);
    active.reason = reason;
    active.after = state();
    active = null;
    console.info('[Central Timing QA] Captura finalizada. Ejecuta __CENTRAL_TIMING_QA__.report()');
  }
  function start(label = 'buscar') {
    if (!live) return;
    if (active) finish('nueva busqueda');
    if (results.length >= MAX_ROUNDS) return console.warn('[Central Timing QA] Límite 8');
    const time = now();
    active = {
      label, time, when: new Date().toISOString(), before: state(), latest: null,
      timeline: [], phases: {}, domChanges: 0, domChanged: false,
      done: false, reason: null, after: null, elapsedMs: null,
    };
    results.push(active);
    sample('click Buscar');
    frame = requestAnimationFrame(rafProbe);
    timeout = setTimeout(() => finish('12 segundos'), WATCH_MS);
    console.info('[Central Timing QA] Registrando búsqueda #' + results.length);
  }
  function isBuscar(el) {
    const button = el instanceof Element ? el.closest('button, [role="button"]') : null;
    return button && !button.closest('[role="dialog"], [aria-modal="true"]') &&
      normalize(button.textContent) === 'BUSCAR';
  }
  function handleClick(event) {
    if (live && location.pathname.replace(/\/+$/, '') === '/loteria/resultados/ver' &&
      isBuscar(event.target)) start('buscar');
  }
  function handleSubmit(event) {
    if (!live || (active && now() - active.time < 250)) return;
    if ([...event.target.querySelectorAll('button')].some(b => normalize(b.textContent) === 'BUSCAR'))
      start('submit/Enter');
  }
  function changedTable(records) {
    let relevant = false, table = false;
    for (const record of records) {
      if (record.type === 'attributes') {
        if (record.attributeName?.startsWith('data-clr-')) relevant = true;
        continue;
      }
      if (record.type === 'characterData') {
        if (record.target.parentElement?.closest('table')) relevant = table = true;
        continue;
      }
      if (record.type !== 'childList') continue;
      if (record.target?.closest?.('table')) relevant = table = true;
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        if ((node.matches?.(SELECTOR) && validTable(node)) ||
          [...(node.querySelectorAll?.(SELECTOR) || [])].some(validTable))
          relevant = table = true;
        if (['clr001-panel', 'clr001-style', 'clr001-column-widths'].includes(node.id))
          relevant = true;
      }
    }
    return { relevant, table };
  }
  function onMutation(records) {
    if (!active) return;
    const change = changedTable(records);
    if (!change.relevant) return;
    active.domChanges++;
    if (change.table) {
      active.domChanged = true;
      if (active.phases.firstTableDomMutation == null)
        active.phases.firstTableDomMutation = round(now() - active.time);
    }
    sample('MutationObserver');
  }
  function analyze(r) {
    const p = r.phases;
    const diff = (a,b) => p[a] == null || p[b] == null ? null : round(p[a] - p[b]);
    const hints = [];
    if (p.firstTableDomMutation != null && !r.before.styled &&
        p.modAttributeFirstObserved != null &&
        diff('modAttributeFirstObserved', 'firstTableDomMutation') > 50)
      hints.push('El mod aparece >50 ms después de la primera mutación de tabla: revisar detección, inyección y tareas principales.');
    if (p.firstTableDomMutation != null && r.before.styled &&
        p.rowPassAfterChange == null)
      hints.push('Tabla reutilizada por React, pero no se detectó un nuevo pase de filas del mod.');
    if (p.modAttributeFirstObserved != null && p.panelFirstMounted == null)
      hints.push('Tabla marcada por el mod pero no se detectó el panel; revisar montaje del toolbar React.');
    if (p.modAttributeFirstObserved != null && !r.before.widthLocked &&
        p.columnLockFirstObserved == null)
      hints.push('Mod activo sin bloqueo de anchuras; revisar estilos y esquema FOTOS/13 columnas.');
    if (!hints.length) hints.push('No se confirma un retraso relevante de atributos; revisar repintado, CSS o etapa anterior a esta captura.');
    return {
      label: r.label, when: r.when, reason: r.reason, elapsedMs: r.elapsedMs,
      before: r.before, after: r.after || r.latest,
      phasesMs: { ...r.phases },
      lagModAfterDomMs: r.before.styled ? null :
        diff('modAttributeFirstObserved','firstTableDomMutation'),
      lagRowsAfterDomMs: diff('rowPassAfterChange','firstTableDomMutation'),
      hints, domChanges: r.domChanges, timeline: r.timeline,
    };
  }
  function report() {
    const reports = results.map(analyze);
    for (const r of reports) {
      console.group('[Central Timing QA] ' + r.label + ' (' + r.reason + ')');
      console.table(Object.entries(r.phasesMs).map(([phase, ms]) => ({ phase, ms })));
      console.table(r.timeline);
      r.hints.forEach(h => console.warn(h));
      console.groupEnd();
    }
    return reports;
  }
  function exportJson() {
    return JSON.stringify({
      tool: 'CentralReactTimingQA/1.1', capturedAt: new Date().toISOString(),
      browser: navigator.userAgent, path: location.pathname,
      warning: 'Solo tiempos de primera observacion; requestAnimationFrame sucede antes del repintado, no mide pintura exacta.',
      rounds: results.map(analyze),
    }, null, 2);
  }
  function stop() {
    finish('detenido');
    live = false;
    observer.disconnect();
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('submit', handleSubmit, true);
  }
  observer = new MutationObserver(onMutation);
  observer.observe(document.documentElement, {
    subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ATTRS,
  });
  document.addEventListener('click', handleClick, true);
  document.addEventListener('submit', handleSubmit, true);
  window[KEY] = Object.freeze({
    start, finish, report, exportJson, stop, status: () => ({
      active: Boolean(active), rounds: results.length, armed: live,
      table: state(), version: '1.1',
    }),
  });
  console.info('[Central Timing QA] Listo. Ahora pulsa BUSCAR. Luego: __CENTRAL_TIMING_QA__.finish(); __CENTRAL_TIMING_QA__.report();');
})();