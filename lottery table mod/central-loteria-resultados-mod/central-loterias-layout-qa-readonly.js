/* Central Loterías · QA layout v1.0 · SOLO LECTURA
 * Firefox -> F12 -> Consola. No cambia la tabla ni desplaza barras.
 */
(() => {
  'use strict';

  const KEY = '__CENTRAL_LAYOUT_QA__';
  const snapshots = Object.create(null);
  const asArray = (list) => Array.from(list || []);
  const round = (n) => Number.isFinite(n) ? Number(n.toFixed(2)) : null;
  const norm = (s) => String(s ?? '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: round(r.left), right: round(r.right), width: round(r.width),
      top: round(r.top), height: round(r.height) };
  };
  const elementName = (el) => {
    if (!el) return '(ninguno)';
    const id = el.id ? `#${el.id}` : '';
    const classes = asArray(el.classList).slice(0, 3).map((name) => `.${name}`).join('');
    return `${el.tagName.toLowerCase()}${id}${classes}`;
  };
  const headersOf = (table) => {
    const row = table.tHead?.rows?.[table.tHead.rows.length - 1];
    return asArray(row?.cells || table.querySelectorAll('thead tr:last-child > th, thead tr:last-child > td'));
  };
  const findTable = () => {
    const candidates = asArray(document.querySelectorAll('table'));
    const scored = candidates.map((table) => {
      const headers = headersOf(table).map((header) => norm(header.textContent));
      const joined = headers.join('|');
      const modal = Boolean(table.closest('[role="dialog"], [role="alertdialog"], [aria-modal="true"], dialog'));
      const score = (modal ? -100 : 0) +
        (/LOTERIA/.test(joined) ? 10 : 0) + (/HORA/.test(joined) ? 3 : 0) +
        (/PEND/.test(joined) ? 3 : 0) + (/PROC/.test(joined) ? 3 : 0) +
        (headers.some((x) => /^(1ERA|2DA|3RA|PICK 3|PICK 4)$/.test(x)) ? 5 : 0);
      return { table, headers, score, modal };
    }).sort((a, b) => b.score - a.score);
    return { candidate: scored[0]?.score >= 18 ? scored[0] : null,
      candidates: scored.map((item) => ({ table: elementName(item.table), columns: item.headers.length,
        headers: item.headers.join(' | ').slice(0, 320), score: item.score, inModal: item.modal })) };
  };
  const ancestorsOf = (table) => {
    const ancestors = [];
    for (let el = table, depth = 0; el && depth < 15; el = el.parentElement, depth++) {
      const css = getComputedStyle(el);
      const xOverflowPx = Math.max(0, el.scrollWidth - el.clientWidth);
      const yOverflowPx = Math.max(0, el.scrollHeight - el.clientHeight);
      const scrollCss = /(auto|scroll|hidden|clip)/.test(`${css.overflowX} ${css.overflowY}`);
      if (depth < 3 || scrollCss || xOverflowPx > 1 || yOverflowPx > 1) {
        ancestors.push({ depth, element: elementName(el),
          clientWidth: el.clientWidth, scrollWidth: el.scrollWidth,
          overflowXpx: xOverflowPx, clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight, overflowYpx: yOverflowPx,
          scrollLeft: el.scrollLeft, overflowX: css.overflowX,
          overflowY: css.overflowY, scrollbarGutter: css.scrollbarGutter,
          cssWidth: css.width, minWidth: css.minWidth, maxWidth: css.maxWidth,
          display: css.display, flex: css.flex,
          modScrollHost: el.hasAttribute('data-clr-scroll-host') });
      }
    }
    return ancestors;
  };
  const columnInfo = (table, headerNodes) => {
    const tableRect = table.getBoundingClientRect();
    const firstLeft = headerNodes[0]?.getBoundingClientRect().left ?? tableRect.left;
    return headerNodes.map((header, i) => {
      const r = header.getBoundingClientRect();
      const css = getComputedStyle(header);
      return { index: i + 1, name: norm(header.textContent),
        leftInTable: round(r.left - tableRect.left),
        leftFromFirst: round(r.left - firstLeft), widthPx: round(r.width),
        cssWidth: css.width, minWidth: css.minWidth, maxWidth: css.maxWidth,
        paddingX: round(parseFloat(css.paddingLeft) + parseFloat(css.paddingRight)),
        whiteSpace: css.whiteSpace, boxSizing: css.boxSizing,
        colSpan: header.colSpan ?? 1 };
    });
  };
  const readModStyle = () => {
    const css = document.getElementById('clr001-column-widths')?.textContent ?? '';
    return { exists: Boolean(css), cssLength: css.length,
      lockedWidthFromCSS: css.match(/width:max\(100%,(\d+)px\)/)?.[1] ?? null,
      lockedColumns: [...css.matchAll(/thead th:nth-child\((\d+)\)\s*\{width:([\d.]+)px/g)]
        .map((match) => ({ index: Number(match[1]), widthPx: Number(match[2]) })) };
  };

  function capture(label = 'base') {
    const name = String(label).trim() || 'base';
    const { candidate, candidates } = findTable();
    if (!candidate) {
      console.warn('[Central QA] No se encontró la tabla principal. Otras tablas:', candidates);
      return { ok: false, candidates };
    }
    const table = candidate.table;
    const th = headersOf(table);
    const tbodyRows = asArray(table.querySelectorAll('tbody > tr'));
    const visibleRows = tbodyRows.filter((row) => row.getClientRects().length > 0);
    const cellCounts = Object.fromEntries([...new Set(tbodyRows.map((row) => row.cells.length))]
      .map((count) => [count, tbodyRows.filter((row) => row.cells.length === count).length]));
    const css = getComputedStyle(table);
    const parent = table.parentElement;
    const qa = window.__CENTRAL_LOTERIAS_REACT_QA__?.status?.();
    const data = {
      label: name, capturedAt: new Date().toISOString(),
      pagePath: location.pathname, browser: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      candidates,
      table: { element: elementName(table), headers: th.length,
        bodyRows: tbodyRows.length, visibleRows: visibleRows.length,
        cellCounts, colgroups: asArray(table.querySelectorAll('colgroup')).map((group) => ({
          count: group.querySelectorAll('col').length,
          widths: asArray(group.querySelectorAll('col')).map((col) => getComputedStyle(col).width)
        })),
        rectangle: rect(table), parentRectangle: rect(parent),
        cssWidth: css.width, tableLayout: css.tableLayout,
        minWidth: css.minWidth, maxWidth: css.maxWidth,
        widthLocked: table.getAttribute('data-clr-width-locked'),
        activeFilter: table.getAttribute('data-clr-filter'),
        naturalFullWidthPx: round(th.reduce((sum, header) => sum + header.getBoundingClientRect().width, 0)) },
      columns: columnInfo(table, th),
      hasFotosHeader: th.some((header) => /FOTOS?|PHOTOS?/.test(norm(header.textContent))),
      rowCellsComparedToHeaders: visibleRows.slice(0, 5).map((row) => ({
        cells: row.cells.length, expected: th.length, colspan: asArray(row.cells)
          .reduce((sum, cell) => sum + (cell.colSpan || 1), 0),
        hasPhotoButton: Boolean(row.querySelector('button[title*="foto" i], [aria-label*="foto" i], input[type="file"]')),
      })),
      mod: { version: qa?.version ?? null, columnLock: qa?.columnLock ?? null,
        panel: qa?.panel ?? null, style: readModStyle() },
      ancestors: ancestorsOf(table),
    };
    snapshots[name] = data;
    console.group(`[Central QA] Captura: ${name}`);
    console.log('Tabla:', data.table, 'FOTOS:', data.hasFotosHeader, 'Mod:', data.mod);
    console.table(data.columns);
    console.table(data.ancestors);
    if (data.table.headers !== data.rowCellsComparedToHeaders[0]?.colspan) {
      console.warn('Posible desajuste entre encabezados y celdas; revisar FOTOS/colSpan.');
    }
    const overflow = data.ancestors.filter((item) => item.overflowXpx > 2);
    if (overflow.length) console.warn('Contenedores con contenido horizontal desbordado:', overflow);
    const lock = Number(data.mod.style.lockedWidthFromCSS);
    if (lock > (parent?.clientWidth || 0) + 2) {
      console.warn(`El CSS del mod fuerza ancho >= ${lock}px; contenedor disponible: ${parent?.clientWidth}px.`);
    }
    console.groupEnd();
    return data;
  }

  function compare(a = 'base', b = 'sin_procesar') {
    const before = snapshots[a];
    const after = snapshots[b];
    if (!before || !after) {
      console.warn(`Faltan capturas: capture('${a}') y capture('${b}')`);
      return null;
    }
    const changes = before.columns.map((col, i) => {
      const next = after.columns[i];
      return { column: col.name, index: col.index, afterName: next?.name ?? '(no existe)',
        leftDeltaPx: next ? round(next.leftFromFirst - col.leftFromFirst) : null,
        widthDeltaPx: next ? round(next.widthPx - col.widthPx) : null };
    });
    console.table(changes);
    console.log('Comparación:', { from: a, to: b,
      headerCounts: [before.table.headers, after.table.headers],
      tableWidths: [before.table.rectangle.width, after.table.rectangle.width],
      modLockWidths: [before.mod.style.lockedWidthFromCSS, after.mod.style.lockedWidthFromCSS] });
    return changes;
  }

  const api = Object.freeze({
    capture, compare, snapshots,
    exportJson: () => JSON.stringify({ tool: 'CentralLayoutQA/1.0', snapshots }, null, 2),
  });
  window[KEY] = api;
  capture('base');
  console.info(`[Central QA] Instalado (solo lectura). Marca «Sin procesar» y ejecuta: ${KEY}.capture('sin_procesar'); luego ${KEY}.compare();`);
  return api;
})();