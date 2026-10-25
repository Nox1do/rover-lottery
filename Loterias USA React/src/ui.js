function createInterface(onQuery) {
    const style = document.createElement('style');
    style.textContent = `
      #rlur-host { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; --rlur-font: clamp(.875rem, calc(.625rem + .208334vw), 1.125rem); --rlur-small: clamp(.75rem, calc(.625rem + .104167vw), .875rem); --rlur-row: clamp(52px, calc(40px + .625vw), 64px); font-size: var(--rlur-font); line-height: 1.4; color: var(--foreground, #0f172a); }
      #rlur-host * { box-sizing: border-box; }
      #rlur-bar { position: fixed; z-index: 40; display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--border, #cbd5e1); border-radius: var(--radius, 10px); background: var(--card, #fff); box-shadow: 0 8px 32px #0002; visibility: hidden; transform: translateY(100vh); transition: transform .18s ease, visibility .18s; }
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
      .rlur-close, .rlur-compact { min-height: 38px; border: 1px solid var(--border, #cbd5e1); background: transparent; color: var(--muted-foreground, #64748b); padding: 5px 8px; border-radius: 6px; }
      .rlur-close { min-width: 34px; font-size: 18px !important; }
      .rlur-tabs { display: flex; gap: 3px; padding: 3px; border-radius: 6px; background: var(--muted, #f1f5f9); }
      .rlur-tabs button { flex: 1; min-height: 32px; border: 0; padding: 5px 8px; border-radius: 4px; background: transparent; color: var(--muted-foreground, #64748b); white-space: nowrap; }
      .rlur-tabs button[aria-pressed="true"] { background: var(--card, #fff); color: var(--foreground, #0f172a); box-shadow: 0 1px 3px #0001; font-weight: 600; }
      .rlur-search-wrap { min-width: 0; }
      #rlur-search { width: 100%; min-height: 38px; border: 1px solid var(--border, #cbd5e1); border-radius: 6px; background: transparent; color: inherit; padding: 6px 9px; }
      .rlur-version { display: block; margin-top: 3px; font-size: var(--rlur-small); font-weight: 700; color: #c45b62; }
      #rlur-context { flex-shrink: 0; font-size: var(--rlur-small); line-height: 1.4; color: var(--muted-foreground, #64748b); max-height: 42px; overflow: auto; overflow-wrap: anywhere; }
      .rlur-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, clamp(160px, 10vw, 240px)), 1fr)); grid-auto-rows: var(--rlur-row); gap: 6px; overflow-y: auto; overflow-x: hidden; min-height: 0; min-width: 0; flex: 1; padding: 2px; align-content: start; scrollbar-width: thin; overscroll-behavior: contain; }
      .rlur-lottery { display: flex; gap: 7px; align-items: center; justify-content: space-between; padding: 5px 9px; border: 1px solid var(--border, #cbd5e1); border-radius: 6px; background: transparent; color: inherit; text-align: left; min-height: 44px; min-width: 0; }
      .rlur-lottery > span:first-child { overflow: hidden; text-overflow: ellipsis; }
      .rlur-lottery:hover { background: var(--muted, #f1f5f9); }
      .rlur-lottery[data-status="success"] { border-color: #10b981; }
      .rlur-lottery[data-status="error"] { border-color: #d97777; }
      .rlur-status { display: inline-flex; flex-shrink: 0; width: 1em; height: 1em; color: var(--muted-foreground, #64748b); }
      [data-status="loading"] .rlur-status { border: 2px solid var(--border, #cbd5e1); border-top-color: var(--foreground, #0f172a); border-radius: 50%; animation: rlur-spin .8s linear infinite; }
      [data-status="success"] .rlur-status { color: #059669; }
      [data-status="error"] .rlur-status, [data-status="warning"] .rlur-status { color: #c45b62; }
      #rlur-toggle { position: fixed; right: max(12px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom)); z-index: 40; display: flex; align-items: center; gap: 7px; min-height: 44px; padding: 0 13px; border: 1px solid var(--border, #cbd5e1); border-radius: 7px; background: var(--card, #fff); color: var(--foreground, #0f172a); box-shadow: 0 2px 9px #0002; font-weight: 600; }
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
      #rlur-bar[data-narrow="false"] { display: grid; grid-template-columns: clamp(280px, 19vw, 360px) minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; gap: 6px 16px; }
      #rlur-bar[data-narrow="false"] .rlur-controls { grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-content: start; }
      #rlur-bar[data-narrow="false"] .rlur-title { display: none; }
      #rlur-bar[data-narrow="false"] .rlur-tabs { grid-column: 1; grid-row: 1; }
      #rlur-bar[data-narrow="false"] .rlur-actions { grid-column: 2; grid-row: 1; }
      #rlur-bar[data-narrow="false"] .rlur-search-wrap { grid-column: 1 / -1; grid-row: 2; }
      #rlur-bar[data-narrow="false"] #rlur-context { grid-column: 1 / -1; }
      #rlur-bar[data-narrow="true"] .rlur-controls { grid-template-columns: minmax(144px, .9fr) minmax(0, 1fr); gap: 6px 8px; }
      #rlur-bar[data-narrow="true"] .rlur-title { grid-column: 1; grid-row: 1; font-size: var(--rlur-font); }
      #rlur-bar[data-narrow="true"] .rlur-actions { grid-column: 2; grid-row: 1; justify-content: end; }
      #rlur-bar[data-narrow="true"] .rlur-tabs { grid-column: 1; grid-row: 2; }
      #rlur-bar[data-narrow="true"] .rlur-search-wrap { grid-column: 2; grid-row: 2; }
      @media (max-width: 640px), (pointer: coarse) { #rlur-host .rlur-close, #rlur-host .rlur-compact, #rlur-search, .rlur-title { min-height: 44px; } .rlur-tabs { padding: 0; } .rlur-tabs button { min-height: 44px; } #rlur-search { font-size: 16px !important; } }
      @keyframes rlur-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { #rlur-bar { transition: none; } }
    `;
    document.head.appendChild(style);
    const host = document.createElement('div'); host.id = 'rlur-host';
    const bar = document.createElement('section'); bar.id = 'rlur-bar'; bar.setAttribute('aria-label', 'Loterías USA');
    const left = document.createElement('div'); left.className = 'rlur-controls';
    const title = document.createElement('div'); title.className = 'rlur-title'; title.textContent = 'Rovs Loterias USA';
    const close = document.createElement('button'); close.type = 'button'; close.className = 'rlur-close'; close.textContent = '×'; close.title = 'Cerrar barra'; close.setAttribute('aria-label', 'Cerrar barra'); left.append(title);
    const compact = document.createElement('button'); compact.type = 'button'; compact.className = 'rlur-compact'; compact.textContent = 'Compactar'; compact.setAttribute('aria-label', 'Volver al tamaño compacto');
    const actions = document.createElement('div'); actions.className = 'rlur-actions'; actions.append(compact, close);
    const tabs = document.createElement('div'); tabs.className = 'rlur-tabs'; tabs.setAttribute('aria-label', 'Categoría');
    const icons = {
        day: '<circle cx="7" cy="7" r="2.5"/><path d="M7 0v1M7 13v1M0 7h1M13 7h1M2 2l1 1M11 11l1 1M2 12l1-1M11 3l1-1"/>',
        night: '<path d="M11.7 8.4A5.3 5.3 0 0 1 5.6 2.3 5.3 5.3 0 1 0 11.7 8.4Z"/>',
        success: '<path d="m2 7 3 3 7-7"/>', error: '<path d="m3 3 8 8M11 3l-8 8"/>',
        warning: '<path d="M7 2 13 12H1Z M7 5v3 M7 10v.1"/>', pending: '<circle cx="7" cy="7" r="5"/><path d="M3.5 10.5 10.5 3.5"/>',
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
    const context = document.createElement('div'); context.id = 'rlur-context'; context.setAttribute('role', 'status');
    const grid = document.createElement('div'); grid.className = 'rlur-grid';
    for (const config of LOTERIAS) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'rlur-lottery'; button.dataset.lotteryId = config.id;
        const label = document.createElement('span'); label.textContent = config.nombreMenu.replace(/^🇺🇸\s*/, '');
        const status = document.createElement('span'); status.className = 'rlur-status'; button.append(label, status);
        button.onclick = () => onQuery(config); button.dataset.status = 'idle'; buttons.set(config.id, button); grid.append(button);
    }
    function filter() {
        for (const config of LOTERIAS) buttons.get(config.id).hidden = config.categoria !== category || !normalizeLabel(config.nombreMenu + config.codigo).includes(normalizeLabel(search.value));
        for (const [id, button] of categoryButtons) button.setAttribute('aria-pressed', String(id === category));
    }
    search.addEventListener('input', filter); filter();
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.id = 'rlur-toggle'; toggle.innerHTML = svg('panel'); toggle.append(document.createTextNode('Loterías USA'));
    // Geometry is local to this page: every reload starts compact.
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    let geometry = null, resized = false, drag = null;
    function limits() {
        const viewport = window.visualViewport;
        const width = viewport?.width || window.innerWidth, height = viewport?.height || window.innerHeight;
        const margin = width <= 640 ? 10 : 12;
        const left = viewport?.offsetLeft || 0, top = (viewport?.offsetTop || 0) + margin;
        const maxWidth = Math.max(1, width), maxHeight = Math.max(1, height - margin * 2);
        return { left, top, right: left + maxWidth, bottom: top + maxHeight, maxWidth, maxHeight,
            minWidth: Math.min(360, maxWidth), minHeight: Math.min(width <= 640 || matchMedia('(pointer: coarse)').matches ? 244 : 154, maxHeight) };
    }
    function paint(next) {
        const bounds = limits();
        const width = clamp(next.width, bounds.minWidth, bounds.maxWidth);
        const minHeight = Math.min(bounds.maxHeight, width < 700 ? Math.max(214, bounds.minHeight) : bounds.minHeight);
        const height = clamp(next.height, minHeight, bounds.maxHeight);
        geometry = { left: clamp(next.left, bounds.left, bounds.right - width), top: clamp(next.top, bounds.top, bounds.bottom - height), width, height };
        Object.assign(bar.style, { left: geometry.left + 'px', top: geometry.top + 'px', width: width + 'px', height: height + 'px' });
        bar.dataset.narrow = String(width < 700);
    }
    function resetSize() {
        resized = false;
        const b = limits(), width = b.maxWidth;
        const height = Math.min(b.maxHeight, width < 700 ? 270 : window.innerWidth >= 3200 ? 196 : 172);
        paint({ left: b.right - width, top: b.bottom - height, width, height });
    }
    function resizeFrom(start, edge, dx, dy) {
        const b = limits();
        let left = start.left, top = start.top, right = left + start.width, bottom = top + start.height;
        // A narrow desktop panel needs two control rows too.
        const minHeight = Math.min(b.maxHeight, start.width < 700 ? Math.max(214, b.minHeight) : b.minHeight);
        if (edge.includes('w')) left = clamp(left + dx, b.left, right - b.minWidth);
        if (edge.includes('e')) right = clamp(right + dx, left + b.minWidth, b.right);
        if (edge.includes('n')) top = clamp(top + dy, b.top, bottom - minHeight);
        if (edge.includes('s')) bottom = clamp(bottom + dy, top + minHeight, b.bottom);
        resized = true;
        paint({ left, top, width: right - left, height: bottom - top });
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
        if (open && matchMedia('(pointer: fine)').matches) search.focus();
        if (!open) toggle.focus();
    };
    toggle.setAttribute('aria-controls', 'rlur-bar'); toggle.setAttribute('aria-expanded', 'false'); toggle.onclick = () => setOpen(!open); close.onclick = () => setOpen(false); compact.onclick = resetSize;
    bar.append(left, grid, context); bar.inert = true; bar.setAttribute('aria-hidden', 'true'); host.append(bar, toggle); document.body.append(host); resetSize();
    const fitViewport = () => { endDrag(); if (resized) paint(geometry); else resetSize(); };
    window.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('scroll', fitViewport);
    function setStatus(id, state, message = '') {
        const button = buttons.get(id); button.dataset.status = state; button.disabled = state === 'loading'; button.title = message;
        button.querySelector('.rlur-status').innerHTML = state === 'loading' || state === 'idle' ? '' : svg(state);
    }
    let previousEpoch = -1;
    function setContext(view) {
        bar.hidden = toggle.hidden = !view.active; context.textContent = view.message; context.dataset.ready = String(view.ready);
        if (previousEpoch !== view.epoch) { for (const id of buttons.keys()) setStatus(id, 'idle'); previousEpoch = view.epoch; }
    }
    return { setStatus, setContext };
}
