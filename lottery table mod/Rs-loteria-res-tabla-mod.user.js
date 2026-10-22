// ==UserScript==
// @name         Rs-loteria-res-tabla-mod
// @namespace    https://roversport.net/
// @version      1.6.25
// @description  Estilos UI, 500 filas, resaltados rojo y azul, filtros por estado y sincronización del sidebar.
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
  const BLUE_HIGHLIGHT_CLASS = "rt-row-soft-blue";
  const DEFAULT_PAGE_LENGTH = 500;
  const FILTER_ID = "rt-unprocessed-filter";
  const PROCESSED_PENDING_FILTER_ID = "rt-processed-pending-filter";
  let showOnlyUnprocessed = false;
  let showOnlyProcessedPending = false;
  let dataTablesFilterRegistered = false;
  const HIGHLIGHTED_LOTTERIES = new Set([
    "ARIZONA|AZ",
    "CALIFORNIA EVE|CA-EVEN",
    "TEXAS NIGHT|TX-NIGHT",
    "GEORGIA NIGHT|GE-NT"
  ]);
  const BLUE_HIGHLIGHTED_LOTTERIES = new Set([
    "WASHINGTON NIGHT|WST-NG"
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
  --rt-highlight-blue: #e8f2ff;
  --rt-highlight-blue-hover: #d9eaff;
  --rt-highlight-blue-edge: #8bb6e8;
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

/* Filtros de estado, colocados juntos a la izquierda de Search. */
#tableResult_wrapper .dataTables_filter{
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 13px !important;
}
#tableResult_wrapper .rt-unprocessed-filter-label,
#tableResult_wrapper .rt-processed-pending-filter-label{
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
#tableResult_wrapper #${FILTER_ID},
#tableResult_wrapper #${PROCESSED_PENDING_FILTER_ID}{
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

/* Washington Night: azul suave, independiente del grupo rojo. */
#tableResult tbody tr.${BLUE_HIGHLIGHT_CLASS} > td{
  background-color: var(--rt-highlight-blue) !important;
}
#tableResult tbody tr.${BLUE_HIGHLIGHT_CLASS}:hover > td{
  background-color: var(--rt-highlight-blue-hover) !important;
}
#tableResult tbody tr.${BLUE_HIGHLIGHT_CLASS} > td:first-child{
  box-shadow: inset 4px 0 0 var(--rt-highlight-blue-edge) !important;
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
  -webkit-transition: none !important;
  -moz-transition: none !important;
  -o-transition: none !important;
  transition: none !important;
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

  function highlightSelectedRows(rows = document.querySelectorAll("#tableResult tbody tr")) {
    rows.forEach((row) => {
      const name = normalize(row.querySelector("td:nth-child(2) .loteria-nombre")?.textContent);
      const abbreviation = normalize(row.querySelector("td:nth-child(2) .loteria-abrev")?.textContent)
        .replace(/^\[|\]$/g, "")
        .trim();
      const lotteryKey = `${name}|${abbreviation}`;
      const red = HIGHLIGHTED_LOTTERIES.has(lotteryKey);
      const blue = BLUE_HIGHLIGHTED_LOTTERIES.has(lotteryKey);
      if (row.classList.contains(HIGHLIGHT_CLASS) !== red) row.classList.toggle(HIGHLIGHT_CLASS, red);
      if (row.classList.contains(BLUE_HIGHLIGHT_CLASS) !== blue) row.classList.toggle(BLUE_HIGHLIGHT_CLASS, blue);
    });
  }

  function ensureProcNoX(rows = document.querySelectorAll("#tableResult tbody tr")) {
    rows.forEach((row) => {
      const el = row.querySelector("td:nth-child(10) .status-circle.status-no");
      if (!el || el.querySelector(".rt-x")) return;
      if (/[x×✕]/i.test((el.textContent || "").trim())) return;
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
    if (!select || select.dataset.rtPageLength500 === "1") return false;

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

  function rowIsProcessedPending(settings, rowData, dataIndex) {
    const row = settings.aoData?.[dataIndex]?.nTr;
    if (row) {
      const status = row.querySelector("td:nth-child(10) .status-circle");
      const pending = row.querySelector("td:nth-child(9) .badge-pend-has");
      return Boolean(status && !status.classList.contains("status-no") && pending);
    }

    // Respaldo para filas cuyo <tr> todavía no se ha creado en DataTables.
    const pendingData = rowData?.[8];
    const procData = rowData?.[9];
    const toMarkup = (value) => value instanceof Node
      ? value.outerHTML || value.textContent || ""
      : String(value ?? "");
    const pendingHtml = toMarkup(pendingData);
    const procHtml = toMarkup(procData);
    return /\bbadge-pend-has\b/i.test(pendingHtml) &&
      /\bstatus-circle\b/i.test(procHtml) &&
      !/\bstatus-no\b/i.test(procHtml);
  }

  function registerDataTablesFilter() {
    if (dataTablesFilterRegistered) return true;

    const $ = window.jQuery;
    const searchFilters = $?.fn?.dataTable?.ext?.search;
    if (!Array.isArray(searchFilters)) return false;

    searchFilters.push((settings, rowData, dataIndex) => {
      if (settings.nTable?.id !== "tableResult") return true;
      if (showOnlyUnprocessed) return rowIsUnprocessed(settings, rowData, dataIndex);
      if (showOnlyProcessedPending) return rowIsProcessedPending(settings, rowData, dataIndex);
      return true;
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
  let lastAdjustedWidth = null;
  let lastAdjustedTable = null;
  const perf = { rowPasses: 0, rowsProcessed: 0, mutationBatches: 0, adjustments: 0, adjustmentsSkipped: 0 };
  window.__RT_LOTTERY_PERF__ = Object.freeze({
    status: () => ({...perf}),
    reset: () => { for (const key of Object.keys(perf)) perf[key] = 0; }
  });

  function cancelScheduledAdjust() {
    if (adjustRaf1) cancelAnimationFrame(adjustRaf1);
    if (adjustRaf2) cancelAnimationFrame(adjustRaf2);
    adjustRaf1 = 0;
    adjustRaf2 = 0;
  }

  function cancelStableLayoutTimers() {
    if (layoutSettleTimer) clearTimeout(layoutSettleTimer);
    if (layoutMaxTimer) clearTimeout(layoutMaxTimer);
    layoutSettleTimer = 0;
    layoutMaxTimer = 0;
  }

  function applyDataTableColumnAdjust(reason = "layout") {
    if (!observedWrapper || !observedTable) return false;
    const width = observedWrapper.getBoundingClientRect().width;
    if (!Number.isFinite(width) || width <= 0) return false;
    if (lastAdjustedTable === observedTable && lastAdjustedWidth !== null &&
        Math.abs(lastAdjustedWidth - width) < 0.5) {
      perf.adjustmentsSkipped++;
      return false;
    }
    const dt = getDataTable();
    if (!dt) return false;

    try {
      dt.columns.adjust();
      if (dt.responsive && typeof dt.responsive.recalc === "function") {
        dt.responsive.recalc();
      }
      lastAdjustedWidth = width;
      lastAdjustedTable = observedTable;
      perf.adjustments++;
      return true;
    } catch (error) {
      console.warn("[Rs tabla mod] columns.adjust falló:", reason, error);
      return false;
    }
  }

  function runDataTableColumnAdjust(reason = "layout") {
    cancelScheduledAdjust();

    // Para reconstrucciones AJAX normales esperamos dos frames. El sidebar
    // usa una ruta distinta y sincroniza en el primer frame tras cambiar la clase.
    adjustRaf1 = requestAnimationFrame(() => {
      adjustRaf1 = 0;
      adjustRaf2 = requestAnimationFrame(() => {
        adjustRaf2 = 0;
        applyDataTableColumnAdjust(reason);
      });
    });
  }

  function prepareSidebarToggleAdjust() {
    // Evitar columns.adjust() durante el primer frame de la transición.
    cancelScheduledAdjust();
    scheduleStableLayoutAdjust("sidebar · ancho estable");
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
    scheduleStableLayoutAdjust("filtros de estado");
  }

  function createFilterControl(id, className, caption, checked, onChange) {
    const label = document.createElement("label");
    label.className = className;
    label.htmlFor = id;

    const checkbox = document.createElement("input");
    checkbox.id = id;
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    checkbox.setAttribute("aria-label", caption);

    const text = document.createElement("span");
    text.textContent = caption;

    label.append(checkbox, text);
    checkbox.addEventListener("change", () => onChange(checkbox.checked));
    return label;
  }

  function setFilterMode(mode) {
    // Modos excluyentes: un check activo desactiva el otro.
    showOnlyUnprocessed = mode === "unprocessed";
    showOnlyProcessedPending = mode === "processedPending";

    const unprocessedCheckbox = document.getElementById(FILTER_ID);
    const pendingCheckbox = document.getElementById(PROCESSED_PENDING_FILTER_ID);
    if (unprocessedCheckbox) unprocessedCheckbox.checked = showOnlyUnprocessed;
    if (pendingCheckbox) pendingCheckbox.checked = showOnlyProcessedPending;

    registerDataTablesFilter();
    redrawTable();
  }

  function ensureRowFilters() {
    registerDataTablesFilter();
    const filterArea = document.querySelector("#tableResult_wrapper .dataTables_filter");
    if (!filterArea) return false;

    let inserted = false;
    let unprocessedCheckbox = document.getElementById(FILTER_ID);
    if (!unprocessedCheckbox) {
      const label = createFilterControl(
        FILTER_ID, "rt-unprocessed-filter-label", "Sin procesar",
        showOnlyUnprocessed, (checked) => setFilterMode(checked ? "unprocessed" : null)
      );
      filterArea.prepend(label);
      unprocessedCheckbox = label.querySelector("input");
      inserted = true;
    }

    if (!document.getElementById(PROCESSED_PENDING_FILTER_ID)) {
      const label = createFilterControl(
        PROCESSED_PENDING_FILTER_ID, "rt-processed-pending-filter-label",
        "Procesados pendientes", showOnlyProcessedPending,
        (checked) => setFilterMode(checked ? "processedPending" : null)
      );
      // Prepend mantiene el orden: Procesados pendientes / Sin procesar.
      filterArea.prepend(label);
      inserted = true;
    }
    return inserted;
  }

  let syncRaf = 0;
  let refreshRaf = 0;
  let needsFullRefresh = false;
  const dirtyRows = new Set();
  let observedWrapper = null;
  let observedTable = null;
  let eventsBoundTable = null;
  let tableObserver = null;
  let wrapperResizeObserver = null;
  let lastWrapperWidth = null;

  function scheduleRowRefresh(rows = null) {
    if (!rows) { needsFullRefresh = true; dirtyRows.clear(); }
    else if (!needsFullRefresh) for (const row of rows) dirtyRows.add(row);
    if (refreshRaf) return;
    refreshRaf = requestAnimationFrame(() => {
      refreshRaf = 0;
      const items = needsFullRefresh
        ? document.querySelectorAll("#tableResult tbody tr")
        : [...dirtyRows].filter(row => row.isConnected !== false && row.closest?.("#tableResult") === observedTable);
      needsFullRefresh = false;
      dirtyRows.clear();
      perf.rowPasses++;
      perf.rowsProcessed += items.length;
      highlightSelectedRows(items);
      ensureProcNoX(items);
    });
  }

  function bindDataTableEvents() {
    if (!observedTable || observedTable === eventsBoundTable) return Boolean(eventsBoundTable);
    const $ = window.jQuery;
    if (!$?.fn?.dataTable) return false;
    $(observedTable)
      .off(".rtLotteryMod")
      .on("draw.dt.rtLotteryMod", () => {
        scheduleRowRefresh();
        const select = observedWrapper?.querySelector('.dataTables_length select, select[name="tableResult_length"]');
        if (select?.dataset.rtPageLength500 !== "1" ||
            !document.getElementById(FILTER_ID) ||
            !document.getElementById(PROCESSED_PENDING_FILTER_ID)) scheduleSync("controles draw");
      });
    eventsBoundTable = observedTable;
    return true;
  }

  function syncTable(reason = "sync") {
    if (!document.getElementById(STYLE_ID)) ensureStyle();
    bindDataTableEvents();
    const lengthChanged = ensurePageLength500();
    const filtersInserted = ensureRowFilters();
    scheduleRowRefresh();
    if (reason === "nueva tabla" || lengthChanged || filtersInserted) {
      scheduleStableLayoutAdjust(lengthChanged ? "page length 500" : reason);
    }
  }

  function scheduleSync(reason = "mutation") {
    if (syncRaf) return;
    syncRaf = requestAnimationFrame(() => {
      syncRaf = 0;
      syncTable(reason);
    });
  }

  function onTableMutations(mutations) {
    perf.mutationBatches++;
    const rows = new Set();
    let full = false;
    let controls = false;
    for (const mutation of mutations) {
      const target = mutation.target;
      if (target.closest?.("#tableResult") === observedTable) {
        const tr = target.closest?.("tr");
        if (tr) {
          // Ignorar los "×" insertados por el propio userscript.
          if ([...mutation.addedNodes, ...mutation.removedNodes].some(
            node => node.nodeType !== 1 || !node.classList?.contains("rt-x")
          )) rows.add(tr);
        } else {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== 1) continue;
            if (node.matches?.("tr")) rows.add(node);
            else if (node.matches?.("tbody, table") || node.querySelector?.("tr")) full = true;
          }
        }
      } else if (target === observedWrapper ||
                 target.closest?.("#tableResult_wrapper .dataTables_filter")) {
        controls = true;
      }
    }
    if (full) scheduleRowRefresh();
    else if (rows.size) scheduleRowRefresh(rows);
    if (controls && (!document.getElementById(FILTER_ID) ||
                     !document.getElementById(PROCESSED_PENDING_FILTER_ID))) {
      scheduleSync("controles reemplazados");
    }
    if (!eventsBoundTable && getDataTable()) scheduleSync("datatable listo");
  }

  function bindTableLifecycle() {
    const table = document.querySelector("#tableResult");
    const wrapper = document.querySelector("#tableResult_wrapper");
    if (!table || !wrapper) {
      if (observedTable && !observedTable.isConnected) {
        tableObserver?.disconnect();
        wrapperResizeObserver?.disconnect();
        observedTable = null;
        observedWrapper = null;
        eventsBoundTable = null;
      }
      return false;
    }
    if (table === observedTable && wrapper === observedWrapper) {
      if (!eventsBoundTable && getDataTable()) scheduleSync("datatable listo");
      return true;
    }
    tableObserver?.disconnect();
    wrapperResizeObserver?.disconnect();
    cancelStableLayoutTimers();
    cancelScheduledAdjust();
    if (refreshRaf) cancelAnimationFrame(refreshRaf);
    refreshRaf = 0;
    needsFullRefresh = false;
    dirtyRows.clear();
    lastWrapperWidth = null;
    lastAdjustedTable = null;
    lastAdjustedWidth = null;
    if (observedTable && window.jQuery) {
      try { window.jQuery(observedTable).off(".rtLotteryMod"); } catch (_) {}
    }
    eventsBoundTable = null;
    observedTable = table;
    observedWrapper = wrapper;
    tableObserver = new MutationObserver(onTableMutations);
    tableObserver.observe(wrapper, { childList: true, subtree: true });
    if (typeof ResizeObserver === "function") {
      wrapperResizeObserver = new ResizeObserver((entries) => {
        const entry = entries[entries.length - 1];
        const width = Number(entry?.contentRect?.width || wrapper.getBoundingClientRect().width || 0);
        if (!Number.isFinite(width) || width <= 0) return;
        if (lastWrapperWidth !== null && Math.abs(width - lastWrapperWidth) < 0.5) return;
        lastWrapperWidth = width;
        scheduleStableLayoutAdjust("ancho wrapper estable");
      });
      wrapperResizeObserver.observe(wrapper);
    }
    scheduleSync("nueva tabla");
    return true;
  }

  function nodeContainsTableShell(node) {
    if (!node || node.nodeType !== 1) return false;
    if (node.matches?.("#tableResult, #tableResult_wrapper")) return true;
    if (node.closest?.("#tableResult_wrapper") || !node.firstElementChild) return false;
    return Boolean(node.querySelector?.("#tableResult, #tableResult_wrapper"));
  }

  // Observer de lifecycle: permanece global porque Rover reemplaza el bloque por
  // AJAX, pero solo reacciona cuando entra/sale la tabla. No ejecuta estilos,
  // page length ni filtros ante mutaciones irrelevantes de otros userscripts.
  const shellObserver = new MutationObserver((mutations) => {
    const currentGone = observedTable && !observedTable.isConnected;
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

    // custom.js de Rover cambia body.content-wrapper desde .open-close.
    // Capturamos antes de su handler para programar el ajuste exacto del primer frame.
    document.addEventListener("click", (event) => {
      const toggle = event.target?.closest?.(".open-close");
      if (!toggle) return;
      prepareSidebarToggleAdjust();
    }, true);

    window.addEventListener("resize", () => {
      scheduleStableLayoutAdjust("window resize");
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) scheduleStableLayoutAdjust("tab visible");
    });
  }

  start();
  document.addEventListener("DOMContentLoaded", () => bindTableLifecycle(), { once: true });

  console.log("[Rs tabla mod] v1.6.25 activo · optimización incremental de DOM y columnas");
})();