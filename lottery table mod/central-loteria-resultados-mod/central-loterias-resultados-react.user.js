// ==UserScript==
// @name         central-loterias-resultados-react
// @namespace    https://central.roversport.net/
// @version      0.0.2
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

  const VERSION = '0.0.2';
  const PATH = '/loteria/resultados/ver';
  const PREFIX = 'clr001';
  const STYLE_ID = `${PREFIX}-style`;
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
    stats: { scans: 0, rowPasses: 0, rowsInspected: 0, mutationBatches: 0 },
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
    };
  }

  function looksLikeLotteryTable(table) {
    if (table.closest(`#${PANEL_ID}`)) return -1;
    const headers = getHeaders(table);
    const rows = getRows(table);
    if (!rows.length && !headers.length) return -1;
    const all = headers.join(' ');
    let score = /LOTERIA|SORTEO|LOTTERY/.test(all) ? 8 : 0;
    if (/PENDIENT|PENDING|PEND\./.test(all)) score += 3;
    if (/PROCESAD|PROCESAM|PROCESSED|PROC\./.test(all)) score += 3;
    if (/HORA|HORARIO/.test(all)) score += 1;
    if (rows.some((row) => /WASHINGTON|GEORGIA|ARIZONA|CALIFORNIA|TEXAS/i.test(row.textContent))) score += 4;
    if (!score && document.querySelectorAll('main table, main [role="grid"], main [role="table"]').length === 1) {
      score = rows.length > 0 ? 1 : 0;
    }
    return score;
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

  function annotateRow(row) {
    const cells = getCells(row);
    if (!cells.length) return;
    const highlight = highlightFor(row, cells);
    const category = classify(row, cells);
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
    const targets = rows || getRows(state.table);
    if (!rows) {
      const latestHeaders = getHeaders(state.table);
      if (latestHeaders.join('\u001f') !== state.headers.join('\u001f')) {
        state.headers = latestHeaders;
        state.columns = mapColumns(latestHeaders);
      }
    }
    state.stats.rowPasses++;
    state.stats.rowsInspected += targets.length;
    targets.forEach(annotateRow);
    summary();
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
    const rows = new Set();
    let full = false;
    for (const record of records) {
      const node = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
      const row = node?.closest?.('tr, [role="row"]');
      if (row && state.table.contains(row)) rows.add(row);
      else if (record.type === 'childList') full = true;
      for (const child of record.addedNodes) {
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        if (child.matches?.('tr, [role="row"]')) rows.add(child);
        else if (child.querySelector?.('tr, [role="row"]')) full = true;
      }
    }
    if (full) scheduleRows();
    else if (rows.size) scheduleRows(rows);
  }

  function bindTable(table) {
    if (table === state.table) return;
    state.tableObserver?.disconnect();
    if (state.table?.isConnected) {
      state.table.removeAttribute('data-clr-table');
      state.table.removeAttribute('data-clr-filter');
    }
    state.table = table;
    state.headers = table ? getHeaders(table) : [];
    state.columns = mapColumns(state.headers);
    if (table) {
      table.setAttribute('data-clr-table', 'true');
      table.setAttribute('data-clr-filter', state.filter);
      state.tableObserver = new MutationObserver(onTableMutations);
      state.tableObserver.observe(table, { subtree: true, childList: true, characterData: true });
      scheduleRows();
      ensurePanel();
      mountPanel();
    } else {
      state.panel?.remove();
      state.panelHost = null;
      state.panelMode = null;
      state.data = { rows: 0, unprocessed: 0, processedPending: 0, other: 0, unknown: 0 };
    }
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
      table[data-clr-table="true"] thead th{background:#576a8f!important;color:white!important;font-weight:600!important;font-size:14px!important;border-bottom:1px solid #d0d0d0!important;}
      table[data-clr-table="true"] tbody td{border-bottom:1px solid #dce2e9!important;padding:11px 12px!important;vertical-align:middle!important;font-size:14px!important;color:var(--clr-text);}
      table[data-clr-table="true"] tbody input:not([type="checkbox"]):not([type="radio"]),
      table[data-clr-table="true"] tbody select{min-height:36px;box-sizing:border-box;color:var(--clr-input);font-weight:500;font-variant-numeric:tabular-nums;}
      table[data-clr-table="true"] tbody td[data-clr-lottery]{font-weight:600;letter-spacing:.1px;}
      table[data-clr-table="true"] tbody td[data-clr-processed-status="no"]{color:#e36a6a;font-weight:700;}
      table[data-clr-table="true"] tbody td[data-clr-has-pending="true"]{font-weight:700;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="red"]>td{background:#fde8e8!important;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="red"]:hover>td{background:#f9d6d6!important;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="red"]>td:first-child{box-shadow:inset 4px 0 #e99a9a;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="blue"]>td{background:#e8f2ff!important;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="blue"]:hover>td{background:#d9eaff!important;}
      table[data-clr-table="true"] tbody tr[data-clr-highlight="blue"]>td:first-child{box-shadow:inset 4px 0 #8bb6e8;}
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
      #${PANEL_ID}[data-clr-placement="toolbar"]{margin:0 8px 0 auto;}
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
          if (toolbar && toolbar !== card && !toolbar.contains(state.table) &&
              ['flex', 'inline-flex'].includes(getComputedStyle(toolbar).display)) {
            const rightChild = directChild(toolbar, automatic);
            const searchGroup = directChild(toolbar, search);
            if (rightChild && searchGroup && rightChild !== searchGroup) {
              const leftSiblings = [...toolbar.children].filter((child) =>
                child !== rightChild && child !== state.panel &&
                [...toolbar.children].indexOf(child) < [...toolbar.children].indexOf(rightChild));
              const leftEdge = Math.max(...leftSiblings.map((child) => child.getBoundingClientRect().right), 0);
              const space = rightChild.getBoundingClientRect().left - leftEdge;
              // Si no cabe a la derecha de Buscar, usar una fila normal sobre la tabla.
              if (space >= 315) return { host: toolbar, before: rightChild, mode: 'toolbar' };
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
    if (!element?.isConnected || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    return element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden';
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
      state.panelHost = null;
      state.panelMode = null;
      return;
    }
    // React puede reconstruir el toolbar o la tabla: reinsertar solo si cambió.
    if (panel.parentElement !== placement.host || panel.nextSibling !== placement.before) {
      placement.host.insertBefore(panel, placement.before);
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

  function onShellMutation(records) {
    if (state.table && !state.table.isConnected) {
      // Retirar ya el filtro, sin esperar a que el nuevo React termine de montar.
      bindTable(null);
      scheduleDiscovery();
      return;
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
    for (const record of records) {
      if ([...record.addedNodes].some((node) => node.nodeType === Node.ELEMENT_NODE &&
        (node.matches?.('table, [role="grid"], [role="table"], main, section, #root') ||
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

  window[QA_KEY] = Object.freeze({
    version: VERSION,
    status: () => ({
      version: VERSION, activeRoute: onTargetPage(), tableFound: Boolean(state.table?.isConnected),
      tableTag: state.table?.tagName || null, headers: [...state.headers], columns: { ...state.columns },
      filter: state.filter, ...state.data,
      panel: { mounted: Boolean(state.panel?.isConnected), mode: state.panelMode,
        inTableCard: Boolean(state.panelHost?.isConnected && state.panelHost.contains(state.panel)),
        hidden: state.panel?.hidden ?? null },
      performance: { ...state.stats },
    }),
    rows: debugRows,
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
