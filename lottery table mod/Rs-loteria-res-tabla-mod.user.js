// ==UserScript==
// @name         Rs-loteria-res-tabla-mod
// @namespace    https://roversport.net/
// @version      1.6.20
// @description  Estilos UI, 500 filas por defecto, resaltado, filtro Sin procesar y layout DataTables estable sin saltos del sidebar.
// @homepageURL  https://github.com/Nox1do/rover-lottery
// @source       https://github.com/Nox1do/rover-lottery/blob/main/lottery%20table%20mod/Rs-loteria-res-tabla-mod.user.js
// @updateURL    https://raw.githubusercontent.com/Nox1do/rover-lottery/main/lottery%20table%20mod/Rs-loteria-res-tabla-mod.user.js
// @downloadURL  https://raw.githubusercontent.com/Nox1do/rover-lottery/main/lottery%20table%20mod/Rs-loteria-res-tabla-mod.user.js
// @match        https://www.roversport.net/adm/es/lottery.php*
// @match        https://roversport.net/adm/es/lottery.php*
// @match        https://www.roversport.lol/adm/es/lottery.php*
// @match        https://roversport.lol/adm/es/lottery.php*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const STYLE_ID = "rt-lottery-style-native-v6-6";
  const HIGHLIGHT_CLASS = "rt-row-soft-red";
  const DEFAULT_PAGE_LENGTH = 500;
  const FILTER_ID = "rt-unprocessed-filter";
  let showOnlyUnprocessed = false;
  let dataTablesFilterRegistered = false;
  const HIGHLIGHTED_LOTTERIES = new Set([
    "ARIZONA|AZ",
    "CALIFORNIA EVE|CA-EVEN",
    "TEXAS NIGHT|TX-NIGHT",
    "GEORGIA NIGHT|GE-NT"
  ]);

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  function ensureStyle() {
    const css = `
:root{
  --rt-row-h: 57px;
  --rt-cell-py: 13.3px;
  --rt-cell-px: 15.2px;
  --rt-border: 1.5px solid #d0d0d0;
  --rt-base-down: 0.95em;
  --rt-base-up: 1.10em;
  --rt-body-plus: 1.5px;
  --rt-lot-total: 2.0px;
  --rt-hora-total: 2.5px;
  --rt-pend-total: 6.5px;
  --rt-input-h: 40px;
  --rt-input-h-up: 46px;
  --rt-input-plus: 3px;
  --rt-input-fg: #57595B;
  --rt-input-weight: 500;
  --rt-input-soft-shadow: 0 0 0.35px rgba(0,0,0,.18);
  --rt-placeholder-fg: rgba(87,89,91,.55);
  --rt-lot-fg: #2f3133;
  --rt-lot-weight: 500;
  --rt-lot-letter: 0.2px;
  --rt-lot-soft-shadow: 0 0 0.35px rgba(0,0,0,.14);
  --rt-head-plus: 3px;
  --rt-head-bg: #576A8F;
  --rt-head-fg: #ffffff;
  --rt-abrev-gap: 6px;
  --rt-abrev-bg: #e9ecef;
  --rt-abrev-fg: #6c757d;
  --rt-abrev-border: #d6d8db;
  --rt-pend-badge-bg: #F8843F;
  --rt-pend-badge-fg: #ffffff;
  --rt-proc-no-bg: #E36A6A;
  --rt-highlight-red: #fde8e8;
  --rt-highlight-red-hover: #f9d6d6;
  --rt-highlight-red-edge: #e99a9a;
}

#tableResult_wrapper .dataTables_length,
#tableResult_wrapper .dataTables_filter,
#tableResult_wrapper .dataTables_info{
  font-size: calc(var(--rt-base-down) + var(--rt-body-plus)) !important;
}

#tableResult_wrapper .dataTables_filter input,
#tableResult_wrapper .dataTables_length select{
  height: var(--rt-input-h) !important;
  box-sizing: border-box !important;
  color: var(--rt-input-fg) !important;
  font-weight: var(--rt-input-weight) !important;
  text-shadow: var(--rt-input-soft-shadow) !important;
  font-variant-numeric: tabular-nums !important;
  letter-spacing: 0.2px !important;
  font-size: calc(var(--rt-base-down) + var(--rt-body-plus)) !important;
}

#tableResult_wrapper .dataTables_filter input{ padding: 6px 10px !important; }
#tableResult_wrapper .dataTables_filter input::placeholder{
  color: var(--rt-placeholder-fg) !important;
  font-weight: 400 !important;
  text-shadow: none !important;
}

/* Filtro Sin procesar, colocado a la izquierda de Search. */
#tableResult_wrapper .dataTables_filter{
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 13px !important;
}
#tableResult_wrapper .rt-unprocessed-filter-label{
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  margin: 0 !important;
  color: var(--rt-input-fg) !important;
  font-size: calc(var(--rt-base-down) + var(--rt-body-plus)) !important;
  font-weight: 500 !important;
  white-space: nowrap !important;
  cursor: pointer !important;
  user-select: none !important;
}
#tableResult_wrapper #${FILTER_ID}{
  width: 17px !important;
  height: 17px !important;
  margin: 0 !important;
  accent-color: var(--rt-head-bg) !important;
  cursor: pointer !important;
}

#tableResult tbody tr{ height: var(--rt-row-h) !important; }
#tableResult tbody td{
  padding: var(--rt-cell-py) var(--rt-cell-px) !important;
  vertical-align: middle !important;
  border-top: 0 !important;
  border-bottom: var(--rt-border) !important;
  font-size: calc(var(--rt-base-down) + var(--rt-body-plus)) !important;
}

/* Filas seleccionadas: fondo rojo suave, incluso sobre el zebra striping. */
#tableResult tbody tr.${HIGHLIGHT_CLASS} > td{
  background-color: var(--rt-highlight-red) !important;
}
#tableResult tbody tr.${HIGHLIGHT_CLASS}:hover > td{
  background-color: var(--rt-highlight-red-hover) !important;
}
#tableResult tbody tr.${HIGHLIGHT_CLASS} > td:first-child{
  box-shadow: inset 4px 0 0 var(--rt-highlight-red-edge) !important;
}

#tableResult tbody td.dataTables_empty{
  font-size: calc(var(--rt-base-down) + var(--rt-body-plus)) !important;
  padding: 18px 16px !important;
  color: #7a7a7a !important;
}

#tableResult tbody input,
#tableResult tbody select,
#tableResult tbody textarea{
  height: var(--rt-input-h) !important;
  box-sizing: border-box !important;
  color: var(--rt-input-fg) !important;
  font-weight: var(--rt-input-weight) !important;
  text-shadow: var(--rt-input-soft-shadow) !important;
  font-variant-numeric: tabular-nums !important;
  letter-spacing: 0.2px !important;
  font-size: calc(var(--rt-base-down) + var(--rt-input-plus)) !important;
}

#tableResult tbody input{
  text-align: center !important;
  caret-color: var(--rt-input-fg) !important;
}

#tableResult tbody td:nth-child(3){
  font-size: calc(var(--rt-base-down) + var(--rt-hora-total)) !important;
}

#tableResult tbody td:nth-child(2) .loteria-nombre{
  display: block !important;
  font-size: calc(var(--rt-base-down) + var(--rt-lot-total)) !important;
  color: var(--rt-lot-fg) !important;
  font-weight: var(--rt-lot-weight) !important;
  letter-spacing: var(--rt-lot-letter) !important;
  text-shadow: var(--rt-lot-soft-shadow) !important;
  line-height: 1.25 !important;
}

#tableResult tbody td:nth-child(2) .loteria-abrev{
  display: inline-block !important;
  margin-top: var(--rt-abrev-gap) !important;
  padding: 2px 8px !important;
  border-radius: 3px !important;
  border: 1px solid var(--rt-abrev-border) !important;
  background: var(--rt-abrev-bg) !important;
  color: var(--rt-abrev-fg) !important;
  font-size: calc(0.78em + 1px) !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
}

#tableResult tbody td:nth-child(9){
  font-size: calc(var(--rt-base-up) + var(--rt-pend-total)) !important;
  font-weight: 600 !important;
}
#tableResult tbody td:nth-child(10){
  font-size: calc(var(--rt-base-up) + var(--rt-body-plus)) !important;
}

#tableResult tbody td:nth-child(9) input,
#tableResult tbody td:nth-child(9) select,
#tableResult tbody td:nth-child(9) textarea,
#tableResult tbody td:nth-child(10) input,
#tableResult tbody td:nth-child(10) select,
#tableResult tbody td:nth-child(10) textarea{
  height: var(--rt-input-h-up) !important;
  font-size: calc(var(--rt-base-up) + var(--rt-input-plus)) !important;
}

#tableResult tbody td:nth-child(9) .badge-pend.badge-pend-has{
  background-color: var(--rt-pend-badge-bg) !important;
  color: var(--rt-pend-badge-fg) !important;
  font-size: calc(0.74375em + 0.371875px) !important;
  font-weight: 600 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  vertical-align: middle !important;
  padding: 2.5px 7.5px !important;
  border-radius: 2px !important;
  border: 0 !important;
  line-height: 1.1 !important;
}
#tableResult tbody td:nth-child(9) .badge-pend.badge-pend-has *{
  font-size: inherit !important;
  font-weight: inherit !important;
  line-height: inherit !important;
}

#tableResult tbody td:nth-child(10) .status-circle.status-no{
  background-color: var(--rt-proc-no-bg) !important;
  border-color: var(--rt-proc-no-bg) !important;
  color: #ffffff !important;
  position: relative !important;
}

#tableResult tbody td:nth-child(10) .status-circle.status-no .rt-x{
  position: absolute !important;
  inset: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  font-size: 0.85em !important;
  line-height: 1 !important;
  text-shadow: none !important;
  pointer-events: none !important;
}

#tableResult thead th,
#tableResult_wrapper thead th,
#tableResult_wrapper .dataTables_scrollHead table thead th,
#tableResult_wrapper .dataTables_scrollHeadInner table thead th,
#tableResult_wrapper table.dataTable thead th,
#tableResult_wrapper .DTFC_Cloned thead th{
  background: var(--rt-head-bg) !important;
  background-color: var(--rt-head-bg) !important;
  background-image: none !important;
  color: var(--rt-head-fg) !important;
  font-size: calc(var(--rt-base-down) + var(--rt-head-plus)) !important;
  border-bottom: var(--rt-border) !important;
}
`;

    const existing = document.getElementById(STYLE_ID);
    if (existing) {
      existing.textContent = css;
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function highlightSelectedRows() {
    document.querySelectorAll("#tableResult tbody tr").forEach((row) => {
      const name = normalize(row.querySelector("td:nth-child(2) .loteria-nombre")?.textContent);
      const abbreviation = normalize(row.querySelector("td:nth-child(2) .loteria-abrev")?.textContent)
        .replace(/^\[|\]$/g, "")
        .trim();
      const shouldHighlight = HIGHLIGHTED_LOTTERIES.has(`${name}|${abbreviation}`);
      row.classList.toggle(HIGHLIGHT_CLASS, shouldHighlight);
    });
  }

  function ensureProcNoX() {
    document.querySelectorAll("#tableResult .status-circle.status-no").forEach((el) => {
      if (el.querySelector(".rt-x")) return;
      const txt = (el.textContent || "").trim();
      if (/[x×✕]/i.test(txt)) return;
      const span = document.createElement("span");
      span.className = "rt-x";
      span.textContent = "×";
      el.appendChild(span);
    });
  }

  function getDataTable() {
    const $ = window.jQuery;
    if (!$?.fn?.dataTable?.isDataTable?.("#tableResult")) return null;
    try {
      return $("#tableResult").DataTable();
    } catch (_) {
      return null;
    }
  }

  function ensurePageLength500() {
    const select = document.querySelector(
      '#tableResult_wrapper .dataTables_length select, select[name="tableResult_length"]'
    );
    if (!select) return false;

    if (select.dataset.rtPageLengthOption !== "1") {
      let option500 = Array.from(select.options).find(
        (option) => option.value === String(DEFAULT_PAGE_LENGTH)
      );
      const option100 = Array.from(select.options).find(
        (option) => option.value === "100"
      );

      if (!option500 && option100) {
        option100.value = String(DEFAULT_PAGE_LENGTH);
        option100.textContent = String(DEFAULT_PAGE_LENGTH);
        option500 = option100;
      } else {
        option100?.remove();
      }

      if (!option500) {
        option500 = document.createElement("option");
        option500.value = String(DEFAULT_PAGE_LENGTH);
        option500.textContent = String(DEFAULT_PAGE_LENGTH);
        select.appendChild(option500);
      }

      select.dataset.rtPageLengthOption = "1";
    }

    select.value = String(DEFAULT_PAGE_LENGTH);
    const option500 = Array.from(select.options).find(
      (option) => option.value === String(DEFAULT_PAGE_LENGTH)
    );
    if (option500) option500.selected = true;

    const dt = getDataTable();
    if (!dt) return false;

    const currentLength = Number(dt.page.len());
    if (currentLength === DEFAULT_PAGE_LENGTH) {
      select.dataset.rtPageLength500 = "1";
      return false;
    }

    // No disparamos un change sintético sobre el select. Esa ruta podía coincidir
    // con mutaciones de otros userscripts y dejar los widths calculados por
    // DataTables fuera de sincronía. Usamos la API nativa y un único draw.
    select.dataset.rtPageLength500 = "1";
    dt.page.len(DEFAULT_PAGE_LENGTH).draw(false);
    return true;
  }

  function rowIsUnprocessed(settings, rowData, dataIndex) {
    const row = settings.aoData?.[dataIndex]?.nTr;
    if (row) {
      return Boolean(row.querySelector("td:nth-child(10) .status-circle.status-no"));
    }

    const procData = rowData?.[9];
    const procHtml = procData instanceof Node
      ? procData.outerHTML || procData.textContent || ""
      : String(procData || "");
    return /status-no/i.test(procHtml) || /(?:^|>)\s*[x×✕]\s*(?:<|$)/i.test(procHtml);
  }

  function registerDataTablesFilter() {
    if (dataTablesFilterRegistered) return true;

    const $ = window.jQuery;
    const searchFilters = $?.fn?.dataTable?.ext?.search;
    if (!Array.isArray(searchFilters)) return false;

    searchFilters.push((settings, rowData, dataIndex) => {
      if (settings.nTable?.id !== "tableResult" || !showOnlyUnprocessed) return true;
      return rowIsUnprocessed(settings, rowData, dataIndex);
    });
    dataTablesFilterRegistered = true;
    return true;
  }

  const LAYOUT_SETTLE_MS = 180;
  const LAYOUT_MAX_WAIT_MS = 900;

  let adjustRaf1 = 0;
  let adjustRaf2 = 0;
  let layoutSettleTimer = 0;
  let layoutMaxTimer = 0;
  let pendingLayoutReason = "layout";

  function cancelScheduledAdjust() {
    if (adjustRaf1) cancelAnimationFrame(adjustRaf1);
    if (adjustRaf2) cancelAnimationFrame(adjustRaf2);
    adjustRaf1 = 0;
    adjustRaf2 = 0;
  }

  function runDataTableColumnAdjust(reason = "layout") {
    cancelScheduledAdjust();

    // Un único ajuste, cuando el contenedor ya terminó de cambiar de tamaño.
    // No escuchamos column-sizing.dt porque columns.adjust() puede volver a
    // emitir ese evento y producir un feedback visual.
    adjustRaf1 = requestAnimationFrame(() => {
      adjustRaf1 = 0;
      adjustRaf2 = requestAnimationFrame(() => {
        adjustRaf2 = 0;
        const dt = getDataTable();
        if (!dt) return;

        try {
          dt.columns.adjust();
          if (dt.responsive && typeof dt.responsive.recalc === "function") {
            dt.responsive.recalc();
          }
        } catch (error) {
          console.warn("[Rs tabla mod] columns.adjust falló:", reason, error);
        }
      });
    });
  }

  function flushStableLayoutAdjust() {
    if (layoutSettleTimer) clearTimeout(layoutSettleTimer);
    if (layoutMaxTimer) clearTimeout(layoutMaxTimer);
    layoutSettleTimer = 0;
    layoutMaxTimer = 0;
    runDataTableColumnAdjust(pendingLayoutReason);
  }

  function scheduleStableLayoutAdjust(reason = "layout") {
    pendingLayoutReason = reason;

    if (layoutSettleTimer) clearTimeout(layoutSettleTimer);
    layoutSettleTimer = setTimeout(() => {
      layoutSettleTimer = 0;
      if (layoutMaxTimer) {
        clearTimeout(layoutMaxTimer);
        layoutMaxTimer = 0;
      }
      runDataTableColumnAdjust(pendingLayoutReason);
    }, LAYOUT_SETTLE_MS);

    // Protección: si un layout no deja de emitir resize por alguna animación
    // larga, no posponer indefinidamente la sincronización.
    if (!layoutMaxTimer) {
      layoutMaxTimer = setTimeout(() => {
        layoutMaxTimer = 0;
        if (layoutSettleTimer) {
          clearTimeout(layoutSettleTimer);
          layoutSettleTimer = 0;
        }
        runDataTableColumnAdjust(pendingLayoutReason + " · max wait");
      }, LAYOUT_MAX_WAIT_MS);
    }
  }

  function redrawTable() {
    const dt = getDataTable();
    if (!dt) return;
    dt.draw(false);
    scheduleStableLayoutAdjust("filtro Sin procesar");
  }

  function ensureUnprocessedFilter() {
    registerDataTablesFilter();

    const filterArea = document.querySelector("#tableResult_wrapper .dataTables_filter");
    if (!filterArea || document.getElementById(FILTER_ID)) return false;

    const label = document.createElement("label");
    label.className = "rt-unprocessed-filter-label";
    label.htmlFor = FILTER_ID;

    const checkbox = document.createElement("input");
    checkbox.id = FILTER_ID;
    checkbox.type = "checkbox";
    checkbox.checked = showOnlyUnprocessed;
    checkbox.setAttribute("aria-label", "Mostrar solamente filas sin procesar");

    const text = document.createElement("span");
    text.textContent = "Sin procesar";

    label.append(checkbox, text);
    filterArea.prepend(label);

    checkbox.addEventListener("change", () => {
      showOnlyUnprocessed = checkbox.checked;
      registerDataTablesFilter();
      redrawTable();
    });

    return true;
  }

  let syncRaf = 0;
  let observedWrapper = null;
  let observedTable = null;
  let tableObserver = null;
  let wrapperResizeObserver = null;
  let lastWrapperWidth = null;

  function bindDataTableEvents() {
    if (!observedTable) return false;
    const $ = window.jQuery;
    if (!$?.fn?.dataTable) return false;

    // Namespace propio: nunca quitamos handlers de Rover u otros scripts.
    // Importante: NO escuchar column-sizing.dt/responsive-resize.dt para llamar
    // otra vez a columns.adjust(), porque eso crea feedback de dimensionado.
    $(observedTable)
      .off(".rtLotteryMod")
      .on("draw.dt.rtLotteryMod", () => scheduleSync("draw.dt"));

    return true;
  }

  function syncTable(reason = "sync") {
    if (!document.getElementById(STYLE_ID)) ensureStyle();
    bindDataTableEvents();

    const lengthChanged = ensurePageLength500();
    ensureUnprocessedFilter();
    highlightSelectedRows();
    ensureProcNoX();

    // Si page.len() hizo draw, draw.dt volverá a sincronizar. Esperamos a que
    // el ancho del contenedor quede estable antes de recalcular columnas.
    scheduleStableLayoutAdjust(lengthChanged ? "page length 500" : reason);
  }

  function scheduleSync(reason = "mutation") {
    if (syncRaf) return;
    syncRaf = requestAnimationFrame(() => {
      syncRaf = 0;
      syncTable(reason);
    });
  }

  function bindTableLifecycle() {
    const table = document.querySelector("#tableResult");
    const wrapper = document.querySelector("#tableResult_wrapper");
    if (!table || !wrapper) return false;

    if (table === observedTable && wrapper === observedWrapper) {
      scheduleSync("lifecycle existente");
      return true;
    }

    tableObserver?.disconnect();
    wrapperResizeObserver?.disconnect();
    wrapperResizeObserver = null;
    lastWrapperWidth = null;

    if (observedTable && window.jQuery) {
      try { window.jQuery(observedTable).off(".rtLotteryMod"); } catch (_) {}
    }

    observedTable = table;
    observedWrapper = wrapper;

    // A diferencia de v1.6.18, no observamos documentElement completo para
    // ejecutar toda la rutina ante cualquier mutación de la página. Solo este
    // wrapper puede disparar sincronización de la tabla.
    tableObserver = new MutationObserver(() => scheduleSync("mutación tableResult"));
    tableObserver.observe(wrapper, { childList: true, subtree: true });

    if (typeof ResizeObserver === "function") {
      wrapperResizeObserver = new ResizeObserver((entries) => {
        const entry = entries[entries.length - 1];
        const width = Number(entry?.contentRect?.width || wrapper.getBoundingClientRect().width || 0);
        if (!Number.isFinite(width) || width <= 0) return;

        if (lastWrapperWidth !== null && Math.abs(width - lastWrapperWidth) < 0.5) return;
        lastWrapperWidth = width;

        // El sidebar de Rover anima el ancho del contenido. Durante esa
        // transición no tocamos las columnas; reiniciamos este debounce y
        // hacemos un único ajuste cuando el ancho deja de cambiar.
        scheduleStableLayoutAdjust("ancho wrapper estable");
      });
      wrapperResizeObserver.observe(wrapper);
    }

    scheduleSync("nueva tabla");
    return true;
  }

  function nodeContainsTableShell(node) {
    if (!node || node.nodeType !== 1) return false;
    return Boolean(
      node.matches?.("#tableResult, #tableResult_wrapper") ||
      node.querySelector?.("#tableResult, #tableResult_wrapper")
    );
  }

  // Observer de lifecycle: permanece global porque Rover reemplaza el bloque por
  // AJAX, pero solo reacciona cuando entra/sale la tabla. No ejecuta estilos,
  // page length ni filtros ante mutaciones irrelevantes de otros userscripts.
  const shellObserver = new MutationObserver((mutations) => {
    const currentGone = observedTable && !document.documentElement.contains(observedTable);
    const shellChanged = mutations.some((mutation) =>
      [...mutation.addedNodes, ...mutation.removedNodes].some(nodeContainsTableShell)
    );

    if (currentGone || shellChanged) bindTableLifecycle();
  });

  function start() {
    ensureStyle();
    bindTableLifecycle();

    if (document.documentElement) {
      shellObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    window.addEventListener("resize", () => {
      scheduleStableLayoutAdjust("window resize");
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) scheduleStableLayoutAdjust("tab visible");
    });
  }

  start();
  document.addEventListener("DOMContentLoaded", () => bindTableLifecycle(), { once: true });

  console.log("[Rs tabla mod] v1.6.20 activo · sidebar estable + ajuste único al terminar resize");
})();