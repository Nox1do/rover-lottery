// ==UserScript==
// @name         central-loterias-resultados-react
// @namespace    https://central.roversport.net/
// @version      0.0.10
// @description  Adaptacion visual y filtros pasivos para Resultados de Loteria en Central React.
// @match        https://central.roversport.net/*
// @homepageURL  https://github.com/Nox1do/rover-lottery/tree/main/lottery%20table%20mod/central-loteria-resultados-mod
// @source       https://github.com/Nox1do/rover-lottery/blob/main/lottery%20table%20mod/central-loteria-resultados-mod/central-loterias-resultados-react.user.js
// @updateURL    https://raw.githubusercontent.com/Nox1do/rover-lottery/main/lottery%20table%20mod/central-loteria-resultados-mod/central-loterias-resultados-react.user.js
// @downloadURL  https://raw.githubusercontent.com/Nox1do/rover-lottery/main/lottery%20table%20mod/central-loteria-resultados-mod/central-loterias-resultados-react.user.js
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.0.10';
  const PATH = '/loteria/resultados/ver';
  const PREFIX = 'clr001';
  const STYLE_ID = `${PREFIX}-style`;
  const WIDTH_STYLE_ID = `${PREFIX}-column-widths`;
  // Anchos mínimos compactos medidos para el esquema de Central (FOTOS incluido).
  // Son proporciones estables: el navegador distribuye el ancho extra en pantallas grandes.
  const BASE_COLUMN_WIDTHS = Object.freeze({
    LOTERIA: 200, FOTOS: 68, HORA: 100,
    '1ERA': 65, '2DA': 65, '3RA': 65,
    'PICK 3': 86, 'PICK 4': 86,
    'PEND.': 64, 'PROC.': 64,
    HISTORIAL: 88, STATUS: 70, ACCION: 82,
  });
  const PANEL_ID = `${PREFIX}-panel`;
  const QA_KEY = '__CENTRAL_LOTERIAS_REACT_QA__';
  const ROW_REFRESH_DELAY = 50;
  const DISCOVERY_DELAY = 45;
  const COLORS = Object.freeze({
    red: new Map([
      ['AZ', 'ARIZONA'],
      ['CA-EVEN', 'CALIFORNIA EVE'],
      ['TX-NIGHT', 'TEXAS NIGHT'],
      ['GE-NT', 'GEORGIA NIGHT'],
    ]),
    blue: new Map([['WST-NG', 'WASHINGTON NIGHT']]),
  });
  const state = {
    table: null,
    tableObserver: null,
    scrollHost: null,
    widthSignature: '',
    widthLock: null,
    widthCache: null,
    shellObserver: null,
    scanTimer: 0,
    rowTimer: 0,
    positionFrame: 0,
    panel: null,
    panelHost: null,
    panelMode: null,
    pendingRows: new Set(),
    refreshAll: false,
    filter: 'all',
    headers: [],
    columns: {},
    data: { rows: 0, unprocessed: 0, processedPending: 0, other: 0, unknown: 0 },
    stats: { scans: 0, rowPasses: 0, rowsInspected: 0, mutationBatches: 0, widthLocks: 0, immediateDiscoveries: 0, immediateRowRefreshes: 0 },
    timings: {
      lastBindDurationMs: null, lastMutationRefreshMs: null,
      lastDiscoveryDurationMs: null, lastBindStagesMs: null, lastRowStagesMs: null,
    },
  };

  function onTargetPage() {
    return location.pathname.replace(/\/+$/, '') === PATH;
  }

  function normalize(text) {
    return String(text ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  function cleanClasses(node) {
    return node?.getAttribute?.('class') || '';
  }

  function getCells(row) {
    if (row.matches('tr')) return [...row.children].filter((child) => /^(TD|TH)$/.test(child.tagName));
    return [...row.querySelectorAll(':scope > [role="cell"], :scope > [role="gridcell"]')];
  }

  function getRows(table) {
    if (!table) return [];
    if (table.matches('table')) return [...table.querySelectorAll('tbody > tr')];
    return [...table.querySelectorAll('[role="row"]')].filter((row) => getCells(row).length > 0);
  }

  function getHeaders(table) {
    const nodes = table.matches('table')
      ? [...table.querySelectorAll('thead > tr:last-child > th, thead > tr:last-child > td')]
      : [...table.querySelectorAll('[role="columnheader"]')];
    return nodes.map((node) => normalize(node.textContent));
  }

  function mapColumns(headers) {
    const firstMatch = (pattern) => headers.findIndex((text) => pattern.test(text));
    return {
      lottery: firstMatch(/LOTERIA|SORTEO|LOTTERY|NOMBRE/),
      code: firstMatch(/CODIGO|ABREV|CODE/),
      pending: firstMatch(/^PEND\.?$|PENDIENT|PENDING/),
      processed: firstMatch(/^PROC\.?$|PROCESAD|PROCESAM|PROCESO|PROCESSED/),
      hour: firstMatch(/^HORA$|^HORARIO$|^TIME$/),
      photos: firstMatch(/^FOTOS?$/),
    };
  }

  function looksLikeLotteryTable(table) {
    // Central abre otras tablas dentro de modales. No son la tabla de resultados.
    if (table.closest(`#${PANEL_ID}, [role="dialog"], [role="alertdialog"], [aria-modal="true"], dialog`)) return -1;
    const headers = getHeaders(table);
    const columns = mapColumns(headers);
    if (columns.lottery < 0 || columns.hour < 0 || columns.pending < 0 || columns.processed < 0) return -1;
    // Exigir el esquema real de Central evita capturar tablas comparativas y de fuentes.
    const lotteryFields = headers.filter((value) => /^(1ERA|2DA|3RA|PICK 3|PICK 4)$/.test(value)).length;
    if (lotteryFields < 3) return -1;
    return 20 + lotteryFields + Math.min(getRows(table).length, 5);
  }

  function discoverTable() {
    const candidates = [...document.querySelectorAll('main table, main [role="grid"], main [role="table"], table, [role="grid"], [role="table"]')];
    const unique = [...new Set(candidates)];
    let best = null;
    let bestScore = -1;
    for (const item of unique) {
      const score = looksLikeLotteryTable(item);
      if (score > bestScore) { best = item; bestScore = score; }
    }
    return bestScore > 0 ? best : null;
  }

  function cellText(cell) { return normalize(cell?.textContent ?? ''); }

  function containsToken(value, token) {
    return new RegExp(`(?:^|[^A-Z0-9])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^A-Z0-9])`).test(value);
  }

  function highlightFor(row, cells) {
    const lotteryCell = cells[state.columns.lottery] || cells[1] || cells[0];
    const codeCell = cells[state.columns.code];
    const content = normalize(`${lotteryCell?.textContent ?? ''} ${codeCell?.textContent ?? ''}`);
    // React concatena name + code sin espacio en textContent; buscar también
    // en descendientes para no perder WST-NG ni códigos cortos como AZ.
    const segments = lotteryCell ? [...lotteryCell.querySelectorAll('*')]
      .map(node => normalize(node.textContent)) : [];
    const matches = ([code, name]) => segments.includes(code) ||
      containsToken(content, code) || containsToken(content, name) ||
      content.startsWith(name + code) || content.startsWith(name + ' ' + code) ||
      content === name || content.startsWith(name + ' ');
    for (const item of COLORS.blue) {
      if (matches(item)) return 'blue';
    }
    for (const item of COLORS.red) {
      if (matches(item)) return 'red';
    }
    return '';
  }

  function cellSignal(cell) {
    if (!cell) return 'unknown';
    const text = cellText(cell);
    const label = normalize([
      cell.getAttribute('aria-label'), cell.getAttribute('title'),
      ...[...cell.querySelectorAll('[aria-label], [title]')].slice(0, 10)
        .flatMap((item) => [item.getAttribute('aria-label'), item.getAttribute('title')]),
    ].filter(Boolean).join(' '));
    const classes = [cell, ...cell.querySelectorAll('*')]
      .slice(0, 35).map(cleanClasses).join(' ');
    const lower = classes.toLowerCase();
    const svg = [...cell.querySelectorAll('svg')].slice(0, 5)
      .map((el) => `${el.getAttribute('data-testid') || ''} ${el.getAttribute('data-lucide') || ''} ${cleanClasses(el)}`)
      .join(' ').toLowerCase();

    if (/\bstatus-no\b|\bstatus-false\b|\bnot-processed\b|\bunprocessed\b/.test(lower)) return 'no';
    if (/\bstatus-yes\b|\bstatus-ok\b|\bstatus-processed\b/.test(lower)) return 'yes';
    if (/\b(sin procesar|no procesad[oa]|not processed)\b/.test(`${text} ${label}`.toLowerCase())) return 'no';
    if (/^(NO|X|×|✕|✗|FALSE|0)$/.test(text) || /^(NO|X|×|✕|✗|FALSE)$/.test(label)) return 'no';
    if (/^(SI|YES|✓|✔|TRUE|1)$/.test(text) || /^(SI|YES|TRUE|PROCESADO|PROCESADA)$/.test(label)) return 'yes';
    if (/\b(procesado|procesada|processed)\b/.test(`${text} ${label}`.toLowerCase())) return 'yes';
    if (/(?:^|[^a-z])(circle-check|check-circle|checkcircle|circlecheck|lucide-check|checkmark|fa-check)(?:$|[^a-z])/.test(svg)) return 'yes';
    if (/(?:^|[^a-z])(circle-x|x-circle|circlex|closeicon|cancelicon|lucide-x|fa-times)(?:$|[^a-z])/.test(svg)) return 'no';
    return 'unknown';
  }

  function hasPending(cell) {
    if (!cell) return null;
    if (cell.querySelector('.badge-pend-has, [data-pending="true"]')) return true;
    if (cell.querySelector('.badge-pend-none, [data-pending="false"]')) return false;
    const text = cellText(cell);
    const numbers = text.match(/^\s*(\d+)\s*$/) || text.match(/^(\d+)\s+PENDIENTES?$/);
    if (numbers) return Number(numbers[1]) > 0;
    if (/^(NO|SIN PENDIENTES|NINGUNO|NINGUNA|-)$/.test(text)) return false;
    if (/^PENDIENTES?\s*:\s*(\d+)$/.test(text)) return Number(text.match(/\d+/)?.[0]) > 0;
    return null;
  }

  function classify(row, cells) {
    const column = state.columns.processed;
    let procCell = column >= 0 ? cells[column] : null;
    if (!procCell) {
      procCell = cells.find((cell) => cell.querySelector('.status-circle, .status-no, .status-yes, [data-processed], [data-testid="CheckCircleIcon"]'));
    }
    // No utilizar la última celda: en Central corresponde a Acción (procesar), no a PROC.

    let processed = cellSignal(procCell);
    const pendingColumn = state.columns.pending;
    const pendingCell = pendingColumn >= 0 ? cells[pendingColumn] :
      cells.find((cell) => cell.querySelector('.badge-pend, [data-pending]'));
    const pending = hasPending(pendingCell);

    if (processed === 'unknown') {
      const explicit = normalize(`${row.getAttribute('data-processed') || ''} ${row.getAttribute('data-status') || ''}`);
      if (/^(FALSE|NO|UNPROCESSED)$/.test(explicit)) processed = 'no';
      else if (/^(TRUE|YES|PROCESSED)$/.test(explicit)) processed = 'yes';
    }
    if (procCell && processed !== 'unknown') procCell.setAttribute('data-clr-processed-status', processed);
    if (pendingCell && pending !== null) pendingCell.setAttribute('data-clr-has-pending', String(pending));
    if (processed === 'no') return 'unprocessed';
    if (processed === 'yes' && pending === true) return 'processed-pending';
    if (processed === 'yes' && pending === false) return 'other';
    return 'unknown';
  }

  // Lista solicitada: ocultar los dos controles exclusivamente en FOTOS.
  // Separador | preserva literalmente nombres y códigos suministrados.
  const PHOTO_EXCLUSION_ROWS = `SP-ANG9AM-ANG5PM|SP-ANG9AM-ANG5PM
QUEEN LOTTERY MORNING|QLT-MORNING
EL QUEMAITO MAYOR|EQM
SP ANGUILLA2PM - LOTEDOM|SP-ANG2PM-LOT
EL QUINIELON AM|EQN-AM
SP PRIM-REAL|SP-RP
SP PRIM-SUERTE|SP-PS
SP PRIM-GMAS|SP PR-GM
SP-ANG1PM-REAL|SP-ANG1PM-REAL
SP ANGUILLA1PM-REAL|SP ANG1PM-REAL
S.PALE TARDE|SPT
SP SUERTEAM-KING LOTTERY AM|SP-STAM-KINGAM
SP SUERTE-REAL|SP-RS
SP REAL-NYAM|R-NYAM
SP REAL-FLORIDA AM|SP REAL-FLAM
NUEVA YOL REAL|NYREAL
GEORGIA MIDDAY MARIAGE PALE|GE-MD-MR
QUEEN LOTTERY MIDDAY|QLT-MIDDAY
NEW JERSEY AM MARIAGE PALE|NJ-AM-MR
LA CHICA|LA-CHICA
TEST LD|TEST-LD
NEW YORK AM|NEW YORK PM
TEST LD 2|TESTLD-2
VERMONT DAY|VT-DAY
LA DIARIA|LchD
VERMONT EVENING|VT-EVEN
2PICKNY AM|2PICKNY - AM
PRUEBAS FELIX|PB-FELIX
2PICKNY PM|2PICKNY - PM
PRUEB|PRUEB
BOLIDO 9PM|BLD-9PM
SP-NYPM-GENT|SP-NYPM-GENT
SP-FLPM-GENT|SP-FLPM-GENT
SP NYPM-FLPM|NYPM-FLPM
SP-FLPM-NYPM|SP-FLPM-NYPM
SP FLPM-NAC|SP FLPM-NAC
SP QPALE-ANGUILLA9PM|SP QPALE-ANG9PM
SP-QPL-ANG9PM|SP-QPL-ANG9PM
SP NAC-ANGUILLA9PM|SP NAC-ANG9PM
SP NYPM-NAC|SP NYPM-NC
S.PALE NOCHE|SPN
SP NYPM-QUIN|SP NYPM-QP
SP LTK-NYPM|LTK-NYPM
SP LOTEK-NAC|SP LK-NC
SP LOTEK- QUIN|SP LK-QP
SP KINGPM-LOTEKA|SP KINGPM-LOTEKA
SP LOTEKA-PRIPM|SP LOTEKA-PRIPM
SP KINGPM-PRIPM|SP-KLPM-PRIPM
SP-ANG6PM-SUERTE-PM|SP-ANG6PM-SUERTEPM
SP FLAM-NYAM|SP FLAM-NYAM
SP NYAM-GMAS|SP NYAM-GM
SP FLAM-GMAS|SP FLAM-GM
SP-FLAM-NYAM|SP-FLAM-NYAM
SP PRIPM-SUERTEPM|SP PRPM-SUPM
SP SUERTEPM-ANGUILLA6PM|SP SUERTPM-ANG6PM
SP SUERTPM-KING PM|SP-STPM-KINGPM
QUEEN LOTTERY NIGHT|QLT-NIGHT
QUEEN LOTTERY AFTN|QLT-AFTN
QUEEN LOTTERY EVENING|QLT-EVENING
FLORIDA AM MARIAGE PALE|FL-AM-MR
PENNSYLV AM MARIAGE|PA-AM-MR
CONNECT AM MARIAGE PALE|CT-AM-MR
NEW YORK AM MARIAGE PALE|NY-AM-MR
PENNSYLV PM MARIAGE|PA-PM-MR
GEORGIA EVENING MARIAGE PALE|GE-EV-MR
FLORIDA PM MARIAGE PALE|FL-PM-MR
CONNECT PM MARIAGE PALE|CT-PM-MR
NEW YORK PM MARIAGE PALE|NY-PM-MR
EXTRA MARIAGE PALE|EXTRA-MR
NEW JERSEY PM MARIAGE PALE|NJ-PM-MR
GEORGIA NIGHT MARIAGE PALE|GE-NT-MR
VENEZUELA PM|VLA-PM
VENEZUELA AM|VLA-AM
NY-BK PM|NYBK-PM
NY-BK AM|NYBK-AM
EXTRA NIGHT|EX - NG
EXTRA MIDDAY|EX - MD
NY-BP PM|NYBP-PM
NY-BP AM|NYBP-AM
NY-FP PM|NYFP-PM
NY-FP AM|NYFP-AM
FL PICK 2 PM|FLPK2PM
FL PICK5 PM|FLPK5PM
MASS EV P3F|MA-EV-P3F
MASS EV P3B|MA-EV-P3B
NEW HAMPSHIRE PM|NH-PM
NEW HAMPSHIRE AM|NH-AM
EL QUINIELON PM|EQN-PM
MASS MD P3B|MA-MD-P3B
MASS MD P3F|MA-MD-P3F
FL PICK5 AM|FLPK5AM
FL PICK2 AM|FLPK2AM
FASTWIN 12PM|FW-12PM
FASTWIN 2PM|FW-2PM
FASTWIN 4PM|FW-4PM
FASTWIN 6PM|FW-6PM
FASTWIN 8PM|FW-8PM
SALV 3PM|SALV-3PM
PICK AND WIN 9:30AM|WIN-9-30AM
PICK AND WIN 10:00PM|WIN-10-00PM
PICK AND WIN 7:30PM|WIN-7-30PM
PICK AND WIN 5:30PM|WIN-5-30PM
PICK AND WIN 11:00AM|WIN-11-00AM
PICK AND WIN 1:00PM|WIN-1-00PM
RAPID LOTTERY 11AM|RPL-11AM
RAPID LOTTERY 1PM|RPL-1PM
RAPID LOTTERY 5PM|RPL-5PM
RAPID LOTTERY 3PM|RPL-3PM
RAPID LOTTERY 7PM|RPL-7PM
RAPID LOTTERY 9PM|RPL-9PM
SP REALPM - NAC|SP REALPM-NAC`.trim().split('\n').map((line) => {
    const delimiter = line.lastIndexOf('|');
    return [line.slice(0, delimiter).trim(), line.slice(delimiter + 1).trim()];
  });
  function photoIdentityKey(value) {
    return normalize(value).replace(/[^A-Z0-9]/g, '');
  }
  // Reglas exactas de nombre + código. Un nombre repetido NO basta para
  // excluir fotos. Ej.: LA CHICA (LA-CHICA) sí, LA CHICA (otro) no.
  // NEW YORK AM (NEW YORK PM) sí, NEW YORK PM (NY-PM) no.
  const PHOTO_EXCLUSION_PAIRS = new Map();
  const PHOTO_EXCLUSION_REVERSED_PAIRS = new Map();
  const PHOTO_EXCLUSION_BY_NAME = new Map();
  for (const [name, code] of PHOTO_EXCLUSION_ROWS) {
    const nameKey = photoIdentityKey(name);
    const codeKey = photoIdentityKey(code);
    if (!nameKey || !codeKey) continue;
    const matched = Object.freeze({ name, code, nameKey, codeKey });
    PHOTO_EXCLUSION_PAIRS.set(nameKey + codeKey, matched);
    PHOTO_EXCLUSION_REVERSED_PAIRS.set(codeKey + nameKey, matched);
    if (!PHOTO_EXCLUSION_BY_NAME.has(nameKey)) PHOTO_EXCLUSION_BY_NAME.set(nameKey, new Map());
    PHOTO_EXCLUSION_BY_NAME.get(nameKey).set(codeKey, matched);
  }

  function photoExclusionMatch(lotteryCell) {
    if (!lotteryCell) return null;
    const fullKey = photoIdentityKey(lotteryCell.textContent);
    if (!fullKey) return null;
    const exact = PHOTO_EXCLUSION_PAIRS.get(fullKey) || PHOTO_EXCLUSION_REVERSED_PAIRS.get(fullKey);
    if (exact) return exact;

    // React puede renderizar nombre y código en elementos diferentes.
    // Requerimos AMBOS valores exactos dentro de la celda LOTERIA.
    // Nunca coincidencias de subcadenas, nombre solo o código solo.
    const fragments = new Set();
    for (const node of lotteryCell.querySelectorAll('span, small, strong, b, div, p, [data-code]')) {
      if (node.childElementCount > 0 && !node.hasAttribute('data-code')) continue;
      const key = photoIdentityKey(node.textContent);
      if (key) fragments.add(key);
    }
    for (const [nameKey, codes] of PHOTO_EXCLUSION_BY_NAME) {
      if (!fragments.has(nameKey)) continue;
      for (const [codeKey, pair] of codes) {
        if (fragments.has(codeKey)) return pair;
      }
    }
    return null;
  }

  function isPhotoExcluded(lotteryCell) {
    return Boolean(photoExclusionMatch(lotteryCell));
  }

  function annotatePhotoCell(row, cells) {
    const photosIndex = state.columns.photos;
    const lotteryIndex = state.columns.lottery;
    const photoCell = photosIndex >= 0 ? cells[photosIndex] : null;
    const lotteryCell = lotteryIndex >= 0 ? cells[lotteryIndex] : null;
    const shouldHide = Boolean(photoCell && lotteryCell && isPhotoExcluded(lotteryCell));
    if (shouldHide) {
      if (row.getAttribute('data-clr-no-photos') !== 'true')
        row.setAttribute('data-clr-no-photos', 'true');
      if (photoCell.getAttribute('data-clr-photo-cell') !== 'true')
        photoCell.setAttribute('data-clr-photo-cell', 'true');
    } else {
      if (row.hasAttribute('data-clr-no-photos')) row.removeAttribute('data-clr-no-photos');
      // Sólo marcar la celda FOTOS actual. Si React reutiliza un TD para otra
      // columna, la regla requiere además el encabezado identificado.
      if (photoCell?.hasAttribute('data-clr-photo-cell'))
        photoCell.removeAttribute('data-clr-photo-cell');
    }
  }

  function annotateRow(row) {
    const cells = getCells(row);
    if (!cells.length) return;
    const highlight = highlightFor(row, cells);
    const category = classify(row, cells);
    annotatePhotoCell(row, cells);
    if (row.getAttribute('data-clr-highlight') !== highlight) row.setAttribute('data-clr-highlight', highlight);
    if (row.getAttribute('data-clr-state') !== category) row.setAttribute('data-clr-state', category);
    if (state.columns.lottery >= 0 && cells[state.columns.lottery]) {
      cells[state.columns.lottery].setAttribute('data-clr-lottery', '');
    }
    if (state.columns.pending >= 0 && cells[state.columns.pending]) {
      cells[state.columns.pending].setAttribute('data-clr-pending', '');
    }
  }

  function summary() {
    const result = { rows: 0, unprocessed: 0, processedPending: 0, other: 0, unknown: 0 };
    for (const row of getRows(state.table)) {
      result.rows++;
      switch (row.getAttribute('data-clr-state')) {
        case 'unprocessed': result.unprocessed++; break;
        case 'processed-pending': result.processedPending++; break;
        case 'other': result.other++; break;
        default: result.unknown++;
      }
    }
    state.data = result;
    const counter = document.getElementById(`${PREFIX}-count`);
    if (counter) {
      const visible = state.filter === 'unprocessed' ? result.unprocessed + result.unknown :
        state.filter === 'processed-pending' ? result.processedPending + result.unknown : result.rows;
      const caution = state.filter !== 'all' && result.unknown ? ` · ${result.unknown} sin clasificar` : '';
      counter.textContent = `${visible}/${result.rows} filas${caution}`;
      counter.title = state.filter !== 'all' && result.unknown
        ? 'Los estados desconocidos permanecen visibles para no ocultar resultados incorrectamente.' : '';
    }
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.setAttribute('data-clr-warning', state.filter !== 'all' && result.unknown ? 'true' : 'false');
  }

  function refreshRows(rows = null) {
    if (!state.table?.isConnected || !onTargetPage()) return;
    const start = performance.now();
    const targets = rows || getRows(state.table);
    const rowsReady = performance.now();
    if (!rows) {
      const latestHeaders = getHeaders(state.table);
      if (latestHeaders.join('\u001f') !== state.headers.join('\u001f')) {
        state.headers = latestHeaders;
        state.columns = mapColumns(latestHeaders);
      }
    }
    const headersReady = performance.now();
    state.stats.rowPasses++;
    state.stats.rowsInspected += targets.length;
    targets.forEach(annotateRow);
    const annotationsReady = performance.now();
    lockColumnsBeforeFiltering();
    const lockReady = performance.now();
    summary();
    const done = performance.now();
    state.timings.lastRowStagesMs = {
      rowCount: targets.length,
      getRows: Number((rowsReady - start).toFixed(2)),
      headers: Number((headersReady - rowsReady).toFixed(2)),
      annotation: Number((annotationsReady - headersReady).toFixed(2)),
      columnLock: Number((lockReady - annotationsReady).toFixed(2)),
      summary: Number((done - lockReady).toFixed(2)),
      total: Number((done - start).toFixed(2)),
    };
  }

  function scheduleRows(rows = null) {
    if (!rows) { state.refreshAll = true; state.pendingRows.clear(); }
    else if (!state.refreshAll) for (const row of rows) state.pendingRows.add(row);
    if (state.rowTimer) return;
    state.rowTimer = window.setTimeout(() => {
      state.rowTimer = 0;
      const targets = state.refreshAll ? null :
        [...state.pendingRows].filter((row) => row.isConnected && state.table.contains(row));
      state.refreshAll = false;
      state.pendingRows.clear();
      refreshRows(targets);
    }, ROW_REFRESH_DELAY);
  }

  function onTableMutations(records) {
    state.stats.mutationBatches++;
    if (!state.table?.isConnected) return;
    const rows = new Set();
    let full = false;
    for (const record of records) {
      const target = record.target.nodeType === Node.ELEMENT_NODE
        ? record.target : record.target.parentElement;
      const row = target?.closest?.('tr, [role="row"]');
      if (row && state.table.contains(row)) rows.add(row);
      else if (record.type === 'childList') full = true;
      for (const child of record.addedNodes) {
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        if (child.matches?.('tr, [role="row"]')) rows.add(child);
        else if (child.querySelector?.('tr, [role="row"]')) full = true;
      }
    }
    if (!full && !rows.size) return;
    // MutationObserver se ejecuta al finalizar el commit DOM de React,
    // antes del siguiente pintado. No posponer la primera decoración 50 ms.
    const started = performance.now();
    const total = full ? getRows(state.table).length : rows.size;
    if (total > 400) {
      if (full) scheduleRows();
      else scheduleRows([...rows]);
      return;
    }
    if (full) refreshRows();
    else refreshRows([...rows].filter((row) => row.isConnected && state.table.contains(row)));
    state.stats.immediateRowRefreshes++;
    state.timings.lastMutationRefreshMs = Number((performance.now() - started).toFixed(2));
  }

  function attachStableScrollbar(table) {
    if (state.scrollHost?.isConnected) state.scrollHost.removeAttribute('data-clr-scroll-host');
    state.scrollHost = null;
    if (!table) return;
    // Central tiene overflow-x-auto en el interior y overflow-auto vertical
    // en la tarjeta. Identificarlo por clases evita reflow al montar la tabla.
    for (let parent = table.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const classes = parent.classList;
      if (!classes?.contains('overflow-auto') &&
          !classes?.contains('overflow-scroll') &&
          !classes?.contains('overflow-y-auto') &&
          !classes?.contains('overflow-y-scroll')) continue;
      state.scrollHost = parent;
      parent.setAttribute('data-clr-scroll-host', 'true');
      break;
    }
  }

  function clearWidthLock() {
    state.widthLock = null;
    state.widthSignature = '';
    document.getElementById(WIDTH_STYLE_ID)?.remove();
  }

  function writeWidthLock(widths, signature) {
    if (!state.table?.matches('table') || widths.length !== state.headers.length) return false;
    const total = widths.reduce((sum, width) => sum + width, 0);
    if (!Number.isFinite(total) || total <= 0) return false;
    // El código anterior fijaba max(100%,1495px) incluso con FOTOS y viewport
    // pequeño. Ahora el mínimo corresponde al diseño compacto, no a una
    // captura del ancho accidental de las filas.
    const selector = 'table[data-clr-table="true"][data-clr-width-locked="true"]';
    const rules = widths.map((width, index) =>
      `${selector} thead th:nth-child(${index + 1}) {width:${(width / total * 100).toFixed(5)}%!important;min-width:0!important;box-sizing:border-box!important;}`
    );
    let sheet = document.getElementById(WIDTH_STYLE_ID);
    if (!sheet) {
      sheet = document.createElement('style');
      sheet.id = WIDTH_STYLE_ID;
      document.head.appendChild(sheet);
    }
    sheet.textContent = `${selector}{table-layout:fixed!important;width:100%!important;min-width:${Math.ceil(total)}px!important;}\n` + rules.join('\n');
    state.table.setAttribute('data-clr-width-locked', 'true');
    state.widthLock = widths.slice();
    state.widthSignature = signature;
    state.widthCache = { signature, widths: widths.slice() };
    state.stats.widthLocks++;
    return true;
  }


  function lockColumnsBeforeFiltering() {
    const table = state.table;
    if (!table?.matches('table') || !table.isConnected) return;
    const headers = [...table.querySelectorAll('thead tr:last-child > th')];
    const signature = state.headers.join('|');
    if (!signature || headers.length < 9 || headers.length !== state.headers.length) return;
    // Las proporciones dependen del ESQUEMA, no de las filas visibles.
    // Así los anchos permanecen idénticos al filtrar, reconstruir o redimensionar.
    if (state.widthLock && state.widthSignature === signature) return;
    const widths = state.headers.map((name) =>
      Object.prototype.hasOwnProperty.call(BASE_COLUMN_WIDTHS, name)
        ? BASE_COLUMN_WIDTHS[name] : 76);
    writeWidthLock(widths, signature);
  }


  function bindTable(table) {
    if (table === state.table) return;
    const start = performance.now();
    const stages = {};
    let previous = start;
    const checkpoint = (phase) => {
      const tick = performance.now();
      stages[phase] = Number((tick - previous).toFixed(2));
      previous = tick;
    };
    state.tableObserver?.disconnect();
    attachStableScrollbar(null);
    clearWidthLock();
    checkpoint('disconnectAndCleanup');
    if (state.table?.isConnected) {
      state.table.removeAttribute('data-clr-table');
      state.table.removeAttribute('data-clr-filter');
      state.table.removeAttribute('data-clr-width-locked');
    }
    state.table = table;
    state.headers = table ? getHeaders(table) : [];
    state.columns = mapColumns(state.headers);
    checkpoint('headersAndColumns');
    if (table) {
      attachStableScrollbar(table);
      table.setAttribute('data-clr-table', 'true');
      table.setAttribute('data-clr-filter', state.filter);
      checkpoint('scrollHostAndAttributes');
      ensurePanel();
      mountPanel();
      checkpoint('panelPlacement');
      // La decoración sigue siendo síncrona: esta versión solo añade
      // mediciones exactas por fase, sin alterar la funcionalidad.
      refreshRows();
      checkpoint('rowProcessing');
      state.tableObserver = new MutationObserver(onTableMutations);
      state.tableObserver.observe(table, { subtree: true, childList: true, characterData: true });
      checkpoint('observerSetup');
    } else {
      state.panel?.remove();
      state.panelHost?.removeAttribute('data-clr-toolbar-host');
      state.panelHost = null;
      state.panelMode = null;
      state.data = { rows: 0, unprocessed: 0, processedPending: 0, other: 0, unknown: 0 };
      checkpoint('unmount');
    }
    const elapsed = performance.now() - start;
    stages.total = Number(elapsed.toFixed(2));
    state.timings.lastBindDurationMs = stages.total;
    state.timings.lastBindStagesMs = stages;
  }

  function scheduleDiscovery() {
    if (state.scanTimer) return;
    state.scanTimer = window.setTimeout(() => {
      state.scanTimer = 0;
      state.stats.scans++;
      if (!onTargetPage()) { bindTable(null); return; }
      if (state.table?.isConnected) return;
      bindTable(discoverTable());
    }, DISCOVERY_DELAY);
  }

  function setFilter(filter) {
    // Dos checkboxes excluyentes: pulsar el activo restablece "Todos".
    // Medir con todas las filas visibles antes de ocultar alguna.
    lockColumnsBeforeFiltering();
    state.filter = ['all', 'unprocessed', 'processed-pending'].includes(filter) ? filter : 'all';
    state.table?.setAttribute('data-clr-filter', state.filter);
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.querySelectorAll('input[name="clr-filter"]').forEach((input) => {
        input.checked = input.value === state.filter;
      });
    }
    summary();
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      table[data-clr-table="true"]{--clr-head:#576a8f;--clr-text:#464c54;--clr-line:#dce2e9;--clr-input:#57595b;}
      [data-clr-scroll-host="true"]{scrollbar-gutter:stable!important;}
      table[data-clr-table="true"] thead th{background:#576a8f!important;color:white!important;font-weight:600!important;font-size:14px!important;border-bottom:1px solid #d0d0d0!important;}
      /* Menor padding evita que el mínimo de 13 columnas crezca por contenidos. */
      table[data-clr-table="true"] thead th{padding:8px 6px!important;white-space:nowrap!important;}
      table[data-clr-table="true"] tbody td{border-bottom:1px solid #dce2e9!important;padding:8px 6px!important;vertical-align:middle!important;font-size:13px!important;color:var(--clr-text);}
      table[data-clr-table="true"][data-clr-width-locked="true"] tbody td{overflow:hidden;}
      table[data-clr-table="true"] tbody td:first-child{white-space:normal!important;overflow-wrap:anywhere;}
      table[data-clr-table="true"] tbody input:not([type="checkbox"]):not([type="radio"]),
      table[data-clr-table="true"] tbody select{min-height:36px;box-sizing:border-box;color:var(--clr-input);font-weight:500;font-variant-numeric:tabular-nums;}
      table[data-clr-table="true"] tbody td input:not([type="checkbox"]):not([type="radio"]){width:100%!important;max-width:100%!important;min-width:0!important;}
      table[data-clr-table="true"] tbody td[data-clr-lottery]{font-weight:600;letter-spacing:.1px;}
      table[data-clr-table="true"] tbody td[data-clr-processed-status="no"]{color:#e36a6a;font-weight:700;}
      table[data-clr-table="true"] tbody td[data-clr-has-pending="true"]{font-weight:700;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="red"]>td{background:#fde8e8!important;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="red"]:hover>td{background:#f9d6d6!important;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="red"]>td:first-child{box-shadow:inset 4px 0 #e99a9a;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="blue"]>td{background:#e8f2ff!important;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="blue"]:hover>td{background:#d9eaff!important;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="blue"]>td:first-child{box-shadow:inset 4px 0 #8bb6e8;}
      /* FOTOS: ocultar solo sus dos botones en loterías excluidas.
         No afectar ACCION, inputs, columnas ni eventos/react state. */
      table[data-clr-table="true"] tbody tr[data-clr-no-photos="true"] > td[data-clr-photo-cell="true"] button,
      table[data-clr-table="true"] tbody tr[data-clr-no-photos="true"] > td[data-clr-photo-cell="true"] [role="button"],
      [role="grid"][data-clr-table="true"] [role="row"][data-clr-no-photos="true"] [role="cell"][data-clr-photo-cell="true"] button,
      [role="table"][data-clr-table="true"] [role="row"][data-clr-no-photos="true"] [role="cell"][data-clr-photo-cell="true"] button{display:none!important;}
      table[data-clr-table="true"][data-clr-filter="unprocessed"] tbody tr[data-clr-state="processed-pending"],
      table[data-clr-table="true"][data-clr-filter="unprocessed"] tbody tr[data-clr-state="other"],
      table[data-clr-table="true"][data-clr-filter="processed-pending"] tbody tr[data-clr-state="unprocessed"],
      table[data-clr-table="true"][data-clr-filter="processed-pending"] tbody tr[data-clr-state="other"]{display:none!important;}
      [role="grid"][data-clr-table="true"] [role="row"][data-clr-highlight="red"] [role="cell"],
      [role="table"][data-clr-table="true"] [role="row"][data-clr-highlight="red"] [role="cell"]{background:#fde8e8!important;}
      [role="grid"][data-clr-table="true"] [role="row"][data-clr-highlight="blue"] [role="cell"],
      [role="table"][data-clr-table="true"] [role="row"][data-clr-highlight="blue"] [role="cell"]{background:#e8f2ff!important;}
      [role="grid"][data-clr-table="true"][data-clr-filter="unprocessed"] [role="row"][data-clr-state="other"],
      [role="grid"][data-clr-table="true"][data-clr-filter="unprocessed"] [role="row"][data-clr-state="processed-pending"],
      [role="grid"][data-clr-table="true"][data-clr-filter="processed-pending"] [role="row"][data-clr-state="other"],
      [role="grid"][data-clr-table="true"][data-clr-filter="processed-pending"] [role="row"][data-clr-state="unprocessed"],
      [role="table"][data-clr-table="true"][data-clr-filter="unprocessed"] [role="row"][data-clr-state="other"],
      [role="table"][data-clr-table="true"][data-clr-filter="unprocessed"] [role="row"][data-clr-state="processed-pending"],
      [role="table"][data-clr-table="true"][data-clr-filter="processed-pending"] [role="row"][data-clr-state="other"],
      [role="table"][data-clr-table="true"][data-clr-filter="processed-pending"] [role="row"][data-clr-state="unprocessed"]{display:none!important;}
      /* Los filtros forman parte de la tarjeta React: nunca son una capa fixed. */
      #${PANEL_ID}{all:initial;position:static!important;z-index:auto!important;inset:auto!important;float:none!important;box-sizing:border-box;display:inline-flex;flex:0 0 auto;align-items:center;justify-content:flex-start;gap:10px;padding:6px 9px;border:1px solid #dbe2eb;border-radius:8px;background:#fff;color:#454d59;box-shadow:none;font:500 12px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap;max-width:100%;}
      #${PANEL_ID}[hidden]{display:none!important;}
      /* Mantener el panel junto a Search, sin cambiar de contenedor al filtrar. */
      #${PANEL_ID}[data-clr-placement="toolbar"]{margin:0 8px 0 auto;}
      [data-clr-toolbar-host="true"]{flex-wrap:wrap!important;}
      #${PANEL_ID}[data-clr-placement="bar"]{display:flex;width:max-content;margin:4px 0 10px 0;flex-wrap:wrap;}
      #${PANEL_ID} label{display:inline-flex;gap:5px;align-items:center;cursor:pointer;white-space:nowrap;}
      #${PANEL_ID} input{margin:0;accent-color:#576a8f;width:15px;height:15px;cursor:pointer;}
      #${PANEL_ID} .clr-count{display:none;font-size:11px;color:#7b858e;white-space:nowrap;}
      #${PANEL_ID}[data-clr-warning="true"] .clr-count{color:#a35b08;}
      @media(max-width:760px){#${PANEL_ID}{white-space:normal;font-size:11px;flex-wrap:wrap;gap:7px;}}
    `;
    document.head.appendChild(style);
  }

  function ensurePanel() {
    if (state.panel) return state.panel;
    // Crear el panel separado: se monta DENTRO del bloque de la tabla, no en body.
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Filtros de resultados de loterias');
    for (const [value, title] of [
      ['processed-pending', 'Procesados pendientes'],
      ['unprocessed', 'Sin procesar'],
    ]) {
      const item = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'clr-filter';
      input.value = value;
      input.checked = value === state.filter;
      input.addEventListener('change', () => setFilter(input.checked ? value : 'all'));
      item.append(input, document.createTextNode(title));
      panel.appendChild(item);
    }
    const counter = document.createElement('span');
    counter.id = `${PREFIX}-count`;
    counter.className = 'clr-count';
    counter.textContent = 'Analizando…';
    panel.append(counter);
    panel.title = 'Filtros visuales: Procesados pendientes / Sin procesar. Desmarca para mostrar todos.';
    state.panel = panel;
    return panel;
  }

  function findSearch() {
    if (!state.table) return null;
    const scope = state.table.closest('main, section, article') || document;
    const inputs = [...scope.querySelectorAll('input[type="search"], input[placeholder], input[aria-label]')];
    return inputs.find((input) => /BUSCAR\s+LOTERIA|SEARCH\s+LOTTERY|BUSCAR\s+SORTEO/.test(normalize(
      `${input.placeholder} ${input.getAttribute('aria-label') || ''}`
    ))) || null;
  }

  function directChild(ancestor, descendant) {
    let child = descendant;
    while (child && child.parentElement !== ancestor) child = child.parentElement;
    return child?.parentElement === ancestor ? child : null;
  }

  function findPanelPlacement() {
    if (!state.table?.isConnected) return null;
    const search = findSearch();
    if (!search) return null; // Sin barra asociada: no mostrar controles flotantes.
    let card = state.table.parentElement;
    while (card && card !== document.body) {
      if (card.contains(search)) {
        const tableChild = directChild(card, state.table);
        const searchChild = directChild(card, search);
        if (!tableChild || !searchChild || tableChild === searchChild) return null;
        // La barra compartida aparece sobre la tabla dentro de la misma tarjeta.
        const controls = [...searchChild.querySelectorAll('button')];
        const automatic = controls.find((button) => /^AUTOMATICOS(?:\s|$)/.test(normalize(button.textContent)));
        if (automatic) {
          let toolbar = search.parentElement;
          while (toolbar && toolbar !== card && !toolbar.contains(automatic)) toolbar = toolbar.parentElement;
          // Estructura de toolbar suficiente: no leer estilo calculado aquí.
          if (toolbar && toolbar !== card && !toolbar.contains(state.table)) {
            const rightChild = directChild(toolbar, automatic);
            const searchGroup = directChild(toolbar, search);
            if (rightChild && searchGroup && rightChild !== searchGroup) {
              // Anclaje estable: elegir por estructura DOM, no por espacios calculados.
              // El ancho del bloque varía al filtrar filas o cambiar el scrollbar;
              // el antiguo umbral de 315px provocaba saltos entre 'bar' y 'toolbar'.
              return { host: toolbar, before: rightChild, mode: 'toolbar' };
            }
          }
        }
        return { host: card, before: tableChild, mode: 'bar' };
      }
      card = card.parentElement;
    }
    return null;
  }

  function visibleElement(element) {
    if (!element?.isConnected) return false;
    // Verificar visibilidad estructural sin geometría sincrónica.
    for (let current = element; current && current !== document.body; current = current.parentElement) {
      if (current.hasAttribute?.('hidden') || current.hasAttribute?.('inert') ||
          current.getAttribute?.('aria-hidden') === 'true' ||
          current.getAttribute?.('data-state') === 'closed' ||
          current.classList?.contains('hidden') ||
          current.classList?.contains('invisible')) return false;
      if (current.tagName === 'DIALOG' && !current.hasAttribute('open')) return false;
      const inlineStyle = current.getAttribute?.('style') || '';
      if (/(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*(?:;|$)/i.test(inlineStyle)) return false;
    }
    return true;
  }

  function isModalOpen() {
    const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"]');
    return [...dialogs].some((dialog) => !dialog.contains(state.table) && visibleElement(dialog));
  }

  function updatePanelVisibility() {
    const panel = state.panel;
    if (!panel) return;
    const show = onTargetPage() && visibleElement(state.table) &&
      panel.isConnected && Boolean(state.panelHost) && !isModalOpen();
    if (panel.hidden === show) panel.hidden = !show;
  }

  function mountPanel() {
    if (!onTargetPage() || !state.table?.isConnected) return;
    const panel = ensurePanel();
    // Un cloneNode(true) o una reconstrucción React puede duplicar el ID del panel:
    // retirar copias sin listeners antes de recalcular el espacio disponible.
    document.querySelectorAll(`#${PANEL_ID}`).forEach((copy) => {
      if (copy !== panel) copy.remove();
    });
    const placement = findPanelPlacement();
    if (!placement) {
      panel.remove();
      state.panelHost?.removeAttribute('data-clr-toolbar-host');
      state.panelHost = null;
      state.panelMode = null;
      return;
    }
    // React puede reconstruir el toolbar o la tabla: reinsertar solo si cambió.
    if (panel.parentElement !== placement.host || panel.nextSibling !== placement.before) {
      placement.host.insertBefore(panel, placement.before);
    }
    if (state.panelHost !== placement.host && state.panelHost?.isConnected) {
      state.panelHost.removeAttribute('data-clr-toolbar-host');
    }
    if (placement.mode === 'toolbar' &&
        placement.host.getAttribute('data-clr-toolbar-host') !== 'true') {
      placement.host.setAttribute('data-clr-toolbar-host', 'true');
    }
    if (state.panelMode !== placement.mode) panel.dataset.clrPlacement = placement.mode;
    state.panelHost = placement.host;
    state.panelMode = placement.mode;
    updatePanelVisibility();
  }

  function schedulePanelPosition() {
    if (state.positionFrame) return;
    state.positionFrame = requestAnimationFrame(() => {
      state.positionFrame = 0;
      mountPanel();
    });
  }

  function hasDialogNode(records) {
    const modalSelector = '[role="dialog"], [role="alertdialog"], dialog, [aria-modal]';
    return records.some((record) => [...record.addedNodes, ...record.removedNodes].some((node) =>
      node.nodeType === Node.ELEMENT_NODE &&
      (node.matches?.(modalSelector) || node.querySelector?.(modalSelector))));
  }

  function findNewResultsTable(records) {
    const candidates = new Set();
    const selector = 'table, [role="grid"], [role="table"]';
    for (const record of records) {
      const target = record.target.nodeType === Node.ELEMENT_NODE
        ? record.target : record.target.parentElement;
      const ancestor = target?.closest?.(selector);
      if (ancestor) candidates.add(ancestor);
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches?.(selector)) candidates.add(node);
        // React puede insertar una tarjeta entera que ya contiene la tabla.
        // Evitar consultar subárboles en cada edición de un input o badge.
        if (node.matches?.('main, section, article, div, [role="main"]') &&
            node.querySelector?.(selector)) {
          node.querySelectorAll(selector).forEach((table) => candidates.add(table));
        }
      }
    }
    for (const candidate of candidates) {
      if (candidate.isConnected && looksLikeLotteryTable(candidate) > 0) return candidate;
    }
    return null;
  }

  function onShellMutation(records) {
    if (state.table && !state.table.isConnected) {
      bindTable(null);
      // La tabla nueva puede estar en el MISMO lote de mutaciones.
    }
    if (!onTargetPage()) {
      if (state.table) bindTable(null);
      return;
    }
    if (state.table) {
      if (!state.panel?.isConnected || !state.panelHost?.isConnected) schedulePanelPosition();
      if (hasDialogNode(records)) schedulePanelPosition();
      return;
    }
    const discoveryStart = performance.now();
    const table = findNewResultsTable(records);
    state.timings.lastDiscoveryDurationMs = Number((performance.now() - discoveryStart).toFixed(2));
    if (table) {
      state.stats.immediateDiscoveries++;
      bindTable(table);
      return;
    }
    // Respaldo para cambios de ruta o estructuras sin una tabla insertada
    // explícitamente. El descubrimiento habitual ya no depende del timer.
    for (const record of records) {
      if ([...record.addedNodes].some((node) => node.nodeType === 1 &&
        (node.matches?.('main, section, #root') ||
         node.querySelector?.('table, [role="grid"], [role="table"]')))) {
        scheduleDiscovery();
        return;
      }
    }
  }

  function debugRows(limit = 10) {
    return getRows(state.table).slice(0, Math.max(0, Math.min(30, limit))).map((row, index) => ({
      index, state: row.getAttribute('data-clr-state'), highlight: row.getAttribute('data-clr-highlight'),
      cells: getCells(row).map((cell) => cellText(cell).slice(0, 95)),
    }));
  }

  function photoAudit(limit = 30) {
    const rows = getRows(state.table);
    return rows.slice(0, Math.max(0, Math.min(500, Number(limit) || 0))).map((row) => {
      const cells = getCells(row);
      const photo = state.columns.photos >= 0 ? cells[state.columns.photos] : null;
      const lottery = state.columns.lottery >= 0 ? cells[state.columns.lottery] : null;
      return {
        lottery: lottery?.textContent?.trim().slice(0, 100) || '',
        excluded: row.getAttribute('data-clr-no-photos') === 'true',
        exactMatch: lottery ? (() => {
          const matched = photoExclusionMatch(lottery);
          return matched ? `${matched.name} (${matched.code})` : null;
        })() : null,
        buttonsInPhotos: photo?.querySelectorAll('button, [role="button"]').length || 0,
        photoColumnFound: Boolean(photo),
      };
    });
  }

  window[QA_KEY] = Object.freeze({
    version: VERSION,
    status: () => ({
      version: VERSION, activeRoute: onTargetPage(), tableFound: Boolean(state.table?.isConnected),
      tableTag: state.table?.tagName || null, headers: [...state.headers], columns: { ...state.columns },
      filter: state.filter, ...state.data,
      columnLock: { active: Boolean(state.widthLock), columns: state.widthLock?.length || 0,
        totalMinWidth: state.widthLock?.reduce((sum, width) => sum + width, 0) || 0,
        stableScrollbar: Boolean(state.scrollHost?.isConnected) },
      panel: { mounted: Boolean(state.panel?.isConnected), mode: state.panelMode,
        inTableCard: Boolean(state.panelHost?.isConnected && state.panelHost.contains(state.panel)),
        hidden: state.panel?.hidden ?? null },
      photoExclusions: {
        configured: PHOTO_EXCLUSION_ROWS.length,
        columnIndex: state.columns.photos,
        matchedRows: getRows(state.table).filter((row) => row.getAttribute('data-clr-no-photos') === 'true').length,
      },
      performance: { ...state.stats },
      timings: { ...state.timings },
    }),
    rows: debugRows,
    photoAudit,
    refresh: () => { scheduleDiscovery(); scheduleRows(); schedulePanelPosition(); },
    filter: (name) => setFilter(name),
    resetPerformance: () => { Object.keys(state.stats).forEach((key) => { state.stats[key] = 0; }); },
  });

  let initialized = false;
  function initialize() {
    if (initialized || !document.body) return;
    initialized = true;
    ensureStyle();
    state.shellObserver = new MutationObserver(onShellMutation);
    state.shellObserver.observe(document.body, { childList: true, subtree: true });
    // Buscar en el primer ciclo disponible, también si React ya pintó la tabla.
    bindTable(onTargetPage() ? discoverTable() : null);
    if (!state.table) scheduleDiscovery();
    addEventListener('popstate', scheduleDiscovery, { passive: true });
    addEventListener('hashchange', scheduleDiscovery, { passive: true });
    addEventListener('resize', schedulePanelPosition, { passive: true });
    document.addEventListener('focusin', schedulePanelPosition, { passive: true, capture: true });
    document.addEventListener('click', schedulePanelPosition, { passive: true, capture: true });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') schedulePanelPosition();
    }, { passive: true, capture: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { scheduleDiscovery(); schedulePanelPosition(); }
    });
    // React Router puede cambiar la ruta sin emitir popstate.
    let previousRoute = location.pathname;
    window.setInterval(() => {
      if (location.pathname !== previousRoute) {
        previousRoute = location.pathname;
        if (!onTargetPage()) bindTable(null);
        scheduleDiscovery();
      }
    }, 1200);
    console.info(`[Central Loterías React] v${VERSION} · filtros integrados, sin posición fixed.`);
  }

  // @run-at document-start: esperar solo a que exista body (no al evento load).
  if (document.body) initialize();
  else if (document.documentElement) {
    const bootstrapObserver = new MutationObserver(() => {
      if (!document.body) return;
      bootstrapObserver.disconnect();
      initialize();
    });
    bootstrapObserver.observe(document.documentElement, { childList: true });
    document.addEventListener('DOMContentLoaded', () => {
      bootstrapObserver.disconnect();
      initialize();
    }, { once: true });
  } else {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  }
})();
