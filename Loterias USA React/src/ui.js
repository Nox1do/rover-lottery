function createInterface(onQuery) {
    const feedback = createFillFeedback();
    const style = document.createElement('style');
    style.textContent = `
      #rlur-host { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; --rlur-font: clamp(.875rem, calc(.625rem + .208334vw), 1.125rem); --rlur-small: clamp(.75rem, calc(.625rem + .104167vw), .875rem); --rlur-row: clamp(44px, calc(32px + .625vw), 56px); font-size: var(--rlur-font); line-height: 1.4; color: var(--foreground, #0f172a); }
      #rlur-host * { box-sizing: border-box; }
      #rlur-bar { position: fixed; z-index: 40; display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--border, #cbd5e1); border-radius: var(--radius, 10px) var(--radius, 10px) 0 0; background: var(--card, #fff); box-shadow: 0 -4px 24px #0002; visibility: hidden; transform: translateY(100vh); transition: transform .18s ease, visibility .18s; }
      #rlur-bar[data-period="DIA"] { --rlur-accent: #2563eb; border-top: 3px solid #93c5fd; }
      #rlur-bar[data-period="NOCHE"] { --rlur-accent: #b45309; border-top: 3px solid #fcd34d; }
      .dark #rlur-bar[data-period="DIA"] { --rlur-accent: #93c5fd; }
      .dark #rlur-bar[data-period="NOCHE"] { --rlur-accent: #fcd34d; }
      #rlur-bar.is-open { visibility: visible; transform: translateY(0); }
      #rlur-bar.is-resizing { user-select: none; transition: none; }
      #rlur-bar[hidden], #rlur-toggle[hidden], #rlur-host [hidden] { display: none !important; }
      #rlur-host button, #rlur-host input { font: inherit; font-size: var(--rlur-font); }
      #rlur-host button { cursor: pointer; font-weight: 500; }
      #rlur-host button:disabled { cursor: wait; opacity: .6; }
      #rlur-host button:focus-visible, #rlur-host input:focus-visible { outline: 2px solid var(--ring, #94a3b8); outline-offset: 2px; }
      .rlur-controls { display: grid; grid-template-columns: auto 132px minmax(120px, 1fr) auto; gap: 10px; align-items: start; flex-shrink: 0; min-width: 0; }
      .rlur-title { display: flex; align-items: center; min-height: 38px; font-size: var(--rlur-font); font-weight: 600; white-space: nowrap; }
      .rlur-actions { display: flex; gap: 4px; }
      .rlur-close, .rlur-compact { min-height: 36px; border: 1px solid var(--border, #cbd5e1); background: transparent; color: var(--muted-foreground, #64748b); padding: 4px 7px; border-radius: 6px; }
      .rlur-compact { display: grid; place-items: center; width: 36px; padding: 5px; }
      #rlur-host .rlur-compact svg { width: 18px; height: 18px; stroke-width: 2; }
      .rlur-close { min-width: 32px; font-size: 18px !important; }
      .rlur-tabs { display: flex; gap: 3px; padding: 3px; border-radius: 6px; background: var(--muted, #f1f5f9); }
      .rlur-tabs button { flex: 1; min-height: 30px; margin-inline: 1px; border: 0; padding: 4px 7px; border-radius: 4px; background: transparent; color: var(--muted-foreground, #64748b); white-space: nowrap; }
      .rlur-tabs button[aria-pressed="true"] { background: var(--card, #fff); color: var(--rlur-accent, var(--foreground, #0f172a)); box-shadow: 0 1px 3px #0001; font-weight: 600; }
      .rlur-search-wrap { min-width: 0; }
      #rlur-search { width: 100%; min-height: 38px; border: 1px solid var(--border, #cbd5e1); border-radius: 6px; background: transparent; color: inherit; padding: 6px 9px; }
      .rlur-version { display: block; margin-top: 3px; font-size: var(--rlur-small); font-weight: 700; color: #c45b62; }
      .rlur-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, clamp(160px, 10vw, 240px)), 1fr)); grid-auto-rows: var(--rlur-row); gap: 4px; overflow-y: auto; overflow-x: hidden; min-height: 0; min-width: 0; flex: 1; padding: 2px; align-content: start; scrollbar-width: thin; overscroll-behavior: contain; }
      .rlur-lottery { display: flex; gap: 4px; align-items: center; justify-content: space-between; padding: 1px 5px; border: 1px solid var(--border, #cbd5e1); border-radius: 6px; background: transparent; color: inherit; text-align: left; min-height: 42px; min-width: 0; }
      .rlur-lottery > span:first-child { overflow: hidden; text-overflow: ellipsis; }
      .rlur-lottery:hover { background: var(--muted, #f1f5f9); }
      .rlur-lottery[data-status="success"] { border-color: #10b981; }
      .rlur-lottery[data-status="error"] { border-color: #d97777; }
      .rlur-status { display: inline-flex; flex-shrink: 0; width: 1.25em; height: 1.25em; min-width: 18px; min-height: 18px; color: var(--muted-foreground, #64748b); }
      #rlur-host .rlur-status svg { width: 100%; height: 100%; stroke-width: 2; }
      [data-status="loading"] .rlur-status { animation: rlur-spin .8s linear infinite; }
      [data-status="success"] .rlur-status { color: #059669; }
      [data-status="error"] .rlur-status { color: #c45b62; }
      [data-status="warning"] .rlur-status { color: #b45309; }
      .dark [data-status="warning"] .rlur-status { color: #fcd34d; }
      .rlur-lottery[data-status="warning"] { border-color: #d97706; }
      #rlur-toggle { position: fixed; right: max(12px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom)); z-index: 40; display: flex; align-items: center; gap: 7px; min-height: 42px; padding: 0 12px; border: 1px solid var(--border, #cbd5e1); border-radius: 7px; background: var(--card, #fff); color: var(--foreground, #0f172a); box-shadow: 0 2px 9px #0002; font-weight: 600; }
      #rlur-toggle[aria-expanded="true"] { display: none; }
      #rlur-host svg { width: 1em; height: 1em; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      #rlur-host .rlur-resize { position: absolute; z-index: 2; padding: 0; border: 0; background: transparent; touch-action: none; }
      .rlur-resize[data-resize="n"], .rlur-resize[data-resize="s"] { left: 24px; right: 24px; height: 20px; cursor: ns-resize; }
      .rlur-resize[data-resize="n"] { top: -9px; }
      .rlur-resize[data-resize="s"] { bottom: -9px; }
      .rlur-resize[data-resize="n"]::after { content: ''; position: absolute; left: calc(50% - 20px); top: 8px; width: 40px; height: 3px; border-radius: 4px; background: var(--muted-foreground, #64748b); opacity: .45; }
      .rlur-resize[data-resize="w"], .rlur-resize[data-resize="e"] { top: 24px; bottom: 24px; width: 20px; cursor: ew-resize; }
      .rlur-resize[data-resize="w"] { left: -9px; }
      .rlur-resize[data-resize="e"] { right: -9px; }
      .rlur-resize[data-resize="nw"], .rlur-resize[data-resize="ne"], .rlur-resize[data-resize="sw"], .rlur-resize[data-resize="se"] { width: 24px; height: 24px; }
      .rlur-resize[data-resize="nw"] { top: -9px; left: -9px; cursor: nwse-resize; }
      .rlur-resize[data-resize="ne"] { top: -9px; right: -9px; cursor: nesw-resize; }
      .rlur-resize[data-resize="sw"] { bottom: -9px; left: -9px; cursor: nesw-resize; }
      .rlur-resize[data-resize="se"] { bottom: -9px; right: -9px; cursor: nwse-resize; }
      #rlur-bar[data-narrow="false"] { display: grid; grid-template-columns: clamp(280px, 19vw, 360px) minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); gap: 6px 16px; }
      #rlur-bar[data-narrow="false"] .rlur-controls { grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-content: start; }
      #rlur-bar[data-narrow="false"] .rlur-grid { grid-template-columns: none; grid-template-rows: repeat(var(--rlur-rows, 2), var(--rlur-row)); grid-auto-flow: column; grid-auto-columns: clamp(166px, calc(10vw - 2px), 238px); overflow-x: auto; overflow-y: hidden; }
      #rlur-bar[data-narrow="false"] .rlur-title { display: none; }
      #rlur-bar[data-narrow="false"] .rlur-tabs { grid-column: 1; grid-row: 1; }
      #rlur-bar[data-narrow="false"] .rlur-actions { grid-column: 2; grid-row: 1; }
      #rlur-bar[data-narrow="false"] .rlur-search-wrap { grid-column: 1 / -1; grid-row: 2; }
      #rlur-bar[data-narrow="false"][data-shallow="true"] { grid-template-columns: clamp(460px, 42vw, 680px) minmax(0, 1fr); }
      #rlur-bar[data-shallow="true"] .rlur-controls { grid-template-columns: max-content minmax(120px, 1fr) auto; }
      #rlur-bar[data-shallow="true"] .rlur-search-wrap { grid-column: 2; grid-row: 1; }
      #rlur-bar[data-shallow="true"] .rlur-actions { grid-column: 3; grid-row: 1; }
      #rlur-bar[data-narrow="true"] .rlur-controls { grid-template-columns: minmax(144px, .9fr) minmax(0, 1fr); gap: 6px 8px; }
      #rlur-bar[data-narrow="true"] .rlur-lottery { width: calc(100% - 2px); justify-self: center; }
      #rlur-bar[data-narrow="true"] .rlur-title { grid-column: 1; grid-row: 1; font-size: var(--rlur-font); }
      #rlur-bar[data-narrow="true"] .rlur-actions { grid-column: 2; grid-row: 1; justify-content: end; }
      #rlur-bar[data-narrow="true"] .rlur-tabs { grid-column: 1; grid-row: 2; }
      #rlur-bar[data-narrow="true"] .rlur-search-wrap { grid-column: 2; grid-row: 2; }
      @media (max-width: 640px), (pointer: coarse) { #rlur-host .rlur-compact, #rlur-host .rlur-close { min-width: 42px; } #rlur-host .rlur-close, #rlur-host .rlur-compact { min-height: 42px; } #rlur-search, .rlur-title { min-height: 44px; } .rlur-tabs { padding: 0; } .rlur-tabs button { min-height: 42px; } #rlur-search { font-size: 16px !important; } }
      @keyframes rlur-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { #rlur-bar { transition: none; } }
    `;
    document.head.appendChild(style);
    const host = document.createElement('div'); host.id = 'rlur-host';
    const bar = document.createElement('section'); bar.id = 'rlur-bar'; bar.setAttribute('aria-label', 'Loterías USA');
    const left = document.createElement('div'); left.className = 'rlur-controls';
    const title = document.createElement('div'); title.className = 'rlur-title'; title.textContent = 'Rovs Loterias USA';
    const close = document.createElement('button'); close.type = 'button'; close.className = 'rlur-close'; close.textContent = '×'; close.title = 'Cerrar barra'; close.setAttribute('aria-label', 'Cerrar barra'); left.append(title);
    const compact = document.createElement('button'); compact.type = 'button'; compact.className = 'rlur-compact'; compact.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 6 6M4 10h6V4m10 16-6-6m6 0h-6v6"/></svg>'; compact.title = 'Restablecer tamaño compacto (ancho completo)'; compact.setAttribute('aria-label', 'Restablecer tamaño compacto');
    const actions = document.createElement('div'); actions.className = 'rlur-actions'; actions.append(compact, close);
    const tabs = document.createElement('div'); tabs.className = 'rlur-tabs'; tabs.setAttribute('aria-label', 'Categoría');
    const icons = {
        day: '<circle cx="7" cy="7" r="2.5"/><path d="M7 0v1M7 13v1M0 7h1M13 7h1M2 2l1 1M11 11l1 1M2 12l1-1M11 3l1-1"/>',
        night: '<path d="M11.7 8.4A5.3 5.3 0 0 1 5.6 2.3 5.3 5.3 0 1 0 11.7 8.4Z"/>',
        panel: '<rect x="1" y="2" width="12" height="10" rx="2"/><path d="M1 8h12"/>'
    };
    const svg = key => `<svg viewBox="0 0 14 14" aria-hidden="true">${icons[key] || ''}</svg>`;
    let category = 'DIA', open = false;
    const categoryButtons = new Map(), buttons = new Map();
    for (const [id, label, icon] of [['DIA', 'Día', 'day'], ['NOCHE', 'Noche', 'night']]) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.category = id;
        button.innerHTML = svg(icon); button.append(document.createTextNode(' ' + label));
        button.setAttribute('aria-pressed', String(id === category)); button.onclick = () => { category = id; filter(); };
        categoryButtons.set(id, button); tabs.append(button);
    }
    left.append(tabs);
    const search = document.createElement('input'); search.id = 'rlur-search'; search.placeholder = 'Buscar lotería…'; search.setAttribute('aria-label', 'Filtrar botones de loterías'); const searchWrap = document.createElement('div'); searchWrap.className = 'rlur-search-wrap'; searchWrap.append(search); left.append(searchWrap);
    const version = document.createElement('strong'); version.className = 'rlur-version'; version.textContent = 'v' + (typeof GM_info !== 'undefined' ? GM_info.script?.version || APP_VERSION : APP_VERSION); searchWrap.append(version); left.append(actions);
    const grid = document.createElement('div'); grid.className = 'rlur-grid';
    for (const config of LOTERIAS) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'rlur-lottery'; button.dataset.lotteryId = config.id;
        const label = document.createElement('span'); label.textContent = config.nombreMenu;
        const status = document.createElement('span'); status.className = 'rlur-status'; button.append(label, status);
        button.onclick = () => onQuery(config); button.dataset.status = 'idle'; button.dataset.statusCode = 'idle'; button.setAttribute('aria-label', config.nombreMenu); buttons.set(config.id, button); grid.append(button);
    }
    function filter() {
        bar.dataset.period = category; grid.scrollLeft = grid.scrollTop = 0;
        for (const config of LOTERIAS) buttons.get(config.id).hidden = config.categoria !== category || !normalizeLabel(config.nombreMenu + config.codigo).includes(normalizeLabel(search.value));
        for (const [id, button] of categoryButtons) button.setAttribute('aria-pressed', String(id === category));
    }
    function updateGridRows() {
        const css = getComputedStyle(grid), gap = parseFloat(css.rowGap) || 0;
        const rowHeight = parseFloat(css.gridAutoRows) || 46;
        const available = grid.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
        const rows = Math.max(1, Math.floor((available + gap) / (rowHeight + gap)));
        if (grid.style.getPropertyValue('--rlur-rows') !== String(rows)) grid.style.setProperty('--rlur-rows', String(rows));
    }
    const gridObserver = new ResizeObserver(updateGridRows); gridObserver.observe(grid);
    search.addEventListener('input', filter); filter();
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.id = 'rlur-toggle'; toggle.innerHTML = svg('panel'); toggle.append(document.createTextNode('Loterías USA'));
    // Geometry is local to this page: every reload starts compact.
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    let geometry = null, resized = false, drag = null, widthFraction = 1, chosenHeight = 0;
    function limits() {
        const viewport = window.visualViewport;
        const layoutWidth = document.documentElement.clientWidth || window.innerWidth;
        const width = Math.min(viewport?.width || layoutWidth, layoutWidth), height = viewport?.height || window.innerHeight;
        const margin = width <= 640 ? 10 : 12;
        const left = viewport?.offsetLeft || 0, top = (viewport?.offsetTop || 0) + margin;
        const maxWidth = Math.max(1, width), maxHeight = Math.max(1, height - margin);
        return { left, top, right: left + maxWidth, bottom: top + maxHeight, maxWidth, maxHeight,
            minWidth: Math.min(360, maxWidth), minHeight: Math.min(width <= 640 || matchMedia('(pointer: coarse)').matches ? 200 : 100, maxHeight) };
    }
    function paint(next) {
        const bounds = limits();
        const width = clamp(next.width, bounds.minWidth, bounds.maxWidth);
        const minHeight = Math.min(bounds.maxHeight, width < 700 ? Math.max(186, bounds.minHeight) : bounds.minHeight);
        const height = clamp(next.height, minHeight, bounds.maxHeight);
        geometry = { left: clamp(next.left, bounds.left, bounds.right - width), top: bounds.bottom - height, width, height };
        // Anclar con right/bottom evita conservar un top obsoleto durante el zoom.
        Object.assign(bar.style, { left: 'auto', top: 'auto',
            right: ((document.documentElement.clientWidth || window.innerWidth) - geometry.left - width) + 'px',
            bottom: (window.innerHeight - geometry.top - height) + 'px',
            width: width + 'px', height: height + 'px' });
        bar.dataset.narrow = String(width < 700);
        // Una sola fila de controles permite bajar del compacto sin recortar el buscador o la versión.
        bar.dataset.shallow = String(width >= 700 && height < 138);
        requestAnimationFrame(updateGridRows);
    }
    function resetSize() {
        resized = false; widthFraction = 1;
        const b = limits(), width = b.maxWidth;
        // Dos filas legibles y espacio para scrollbars clásicos de Firefox en Windows.
        const compactHeight = 144 + clamp((window.innerWidth - 1920) / 80, 0, 24);
        const height = Math.min(b.maxHeight, width < 700 ? 242 : Math.ceil(compactHeight));
        paint({ left: b.right - width, top: b.bottom - height, width, height });
    }
    function resizeFrom(start, edge, dx, dy) {
        const b = limits();
        let left = start.left, top = start.top, right = left + start.width, bottom = top + start.height;
        // A narrow desktop panel needs two control rows too.
        const minHeight = Math.min(b.maxHeight, start.width < 700 ? Math.max(186, b.minHeight) : b.minHeight);
        if (edge.includes('w')) left = clamp(left + dx, b.left, right - b.minWidth);
        if (edge.includes('e')) right = clamp(right + dx, left + b.minWidth, b.right);
        if (edge.includes('n')) top = clamp(top + dy, b.top, bottom - minHeight);
        if (edge.includes('s')) bottom = clamp(bottom + dy, top + minHeight, b.bottom);
        resized = true;
        paint({ left, top, width: right - left, height: bottom - top });
        widthFraction = geometry.width / b.maxWidth; chosenHeight = geometry.height;
    }
    const edgeNames = { n: 'superior', s: 'inferior', w: 'izquierdo', e: 'derecho', nw: 'superior izquierda', ne: 'superior derecha', sw: 'inferior izquierda', se: 'inferior derecha' };
    function endDrag() { drag = null; bar.classList.remove('is-resizing'); }
    for (const [edge, label] of Object.entries(edgeNames)) {
        const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'rlur-resize'; handle.dataset.resize = edge;
        handle.setAttribute('aria-label', 'Ajustar tamaño: ' + label); handle.title = 'Arrastra para ajustar; también puedes usar las flechas del teclado';
        handle.addEventListener('pointerdown', event => {
            if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
            event.preventDefault();
            drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: { ...geometry }, edge };
            bar.classList.add('is-resizing');
            // The pointer can end before capture (for example during a viewport change).
            try { handle.setPointerCapture(event.pointerId); } catch { /* Pointer already inactive. */ }
        });
        handle.addEventListener('pointermove', event => {
            if (drag?.id === event.pointerId) resizeFrom(drag.start, drag.edge, event.clientX - drag.x, event.clientY - drag.y);
        });
        for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) handle.addEventListener(eventName, endDrag);
        handle.addEventListener('keydown', event => {
            const delta = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[event.key];
            if (delta) { event.preventDefault(); resizeFrom(geometry, edge, ...delta); }
        });
        bar.append(handle);
    }
    const setOpen = value => {
        open = value; endDrag();
        bar.classList.toggle('is-open', open); bar.inert = !open; bar.setAttribute('aria-hidden', String(!open)); toggle.setAttribute('aria-expanded', String(open));
        visibility.setEnabled(open && !bar.hidden);
        if (open && matchMedia('(pointer: fine)').matches) search.focus();
        if (!open) toggle.focus();
    };
    toggle.setAttribute('aria-controls', 'rlur-bar'); toggle.setAttribute('aria-expanded', 'false'); toggle.onclick = () => setOpen(!open); close.onclick = () => setOpen(false); compact.onclick = resetSize;
    bar.append(left, grid); bar.inert = true; bar.setAttribute('aria-hidden', 'true'); host.append(bar, toggle); document.body.append(host);
    const visibility = createRowVisibility(bar); resetSize();
    const fitViewport = () => {
        endDrag();
        if (!resized) { resetSize(); return; }
        const b = limits(), width = b.maxWidth * widthFraction;
        paint({ left: b.right - width, top: b.bottom - chosenHeight, width, height: chosenHeight });
    };
    window.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('scroll', fitViewport);
    let layoutWidth = document.documentElement.clientWidth;
    const viewportObserver = new ResizeObserver(() => {
        const width = document.documentElement.clientWidth;
        if (width !== layoutWidth) { layoutWidth = width; fitViewport(); }
    });
    viewportObserver.observe(document.documentElement);
    function setStatus(id, code, message = '') {
        const state = queryState(code), button = buttons.get(id);
        const config = LOTERIAS.find(config => config.id === id);
        button.dataset.status = state.tone; button.dataset.statusCode = state.code;
        button.disabled = state.code === 'loading'; button.title = [state.label, message].filter(Boolean).join(' · ');
        button.setAttribute('aria-busy', String(state.code === 'loading'));
        button.setAttribute('aria-label', config.nombreMenu + (state.label ? ' — ' + state.label : ''));
        button.querySelector('.rlur-status').innerHTML = queryIcon(state.code);
        if (state.code !== 'idle') console.info(`[Rovs Loterias USA React] ${config.nombreMenu} · ${state.label}${message ? ' · ' + message : ''}`);
    }

    let previousEpoch = -1;
    function setContext(view) {
        bar.hidden = toggle.hidden = !view.active; bar.dataset.ready = String(view.ready);
        visibility.setEnabled(open && view.active);
        if (previousEpoch !== view.epoch) { feedback.clear(); visibility.clear(); for (const id of buttons.keys()) setStatus(id, 'idle'); previousEpoch = view.epoch; }
        if (view.ready) for (const [id, button] of buttons) if (button.dataset.statusCode === 'rover_loading') setStatus(id, 'idle');
        if (view.active && view.message) console.info(`[Rovs Loterias USA React] ${view.message}`);
    }

    return { setStatus, setContext, highlightFields: feedback.highlight, revealFields: fields => visibility.reveal(fields[0]?.closest('tr')) };
}
