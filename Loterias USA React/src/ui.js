function createInterface(onQuery) {
    const style = document.createElement('style');
    style.textContent = `
      #rlur-host { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: var(--foreground, #0f172a); }
      #rlur-host * { box-sizing: border-box; }
      #rlur-bar { position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 40; display: grid; grid-template-columns: 230px minmax(0,1fr); gap: 16px; padding: 14px; border: 1px solid var(--border, #cbd5e1); border-radius: var(--radius, 10px); background: var(--card, #fff); box-shadow: 0 8px 32px #0002; transform: translateY(calc(100% + 32px)); transition: transform .18s ease; }
      #rlur-bar.is-open { transform: translateY(0); }
      #rlur-bar[hidden], #rlur-toggle[hidden], #rlur-host [hidden] { display: none !important; }
      #rlur-host button, #rlur-host input { font: inherit; font-size: 12px; }
      #rlur-host button { cursor: pointer; }
      #rlur-host button:disabled { cursor: wait; opacity: .6; }
      #rlur-host button:focus-visible, #rlur-host input:focus-visible { outline: 2px solid var(--ring, #94a3b8); outline-offset: 2px; }
      .rlur-title { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 9px; }
      .rlur-close { border: 0; background: transparent; color: var(--muted-foreground, #64748b); padding: 2px 7px; border-radius: 4px; }
      .rlur-tabs { display: flex; gap: 3px; padding: 3px; border-radius: 6px; background: var(--muted, #f1f5f9); margin-bottom: 8px; }
      .rlur-tabs button { flex: 1; border: 0; padding: 6px 8px; border-radius: 4px; background: transparent; color: var(--muted-foreground, #64748b); }
      .rlur-tabs button[aria-pressed="true"] { background: var(--card, #fff); color: var(--foreground, #0f172a); box-shadow: 0 1px 3px #0001; font-weight: 600; }
      #rlur-search { width: 100%; min-height: 33px; border: 1px solid var(--border, #cbd5e1); border-radius: 6px; background: transparent; color: inherit; padding: 7px 9px; }
      .rlur-version { display: block; margin-top: 6px; font-size: 11px; font-weight: 700; color: #c45b62; }
      #rlur-context { min-height: 28px; margin-top: 6px; font-size: 11px; line-height: 1.4; color: var(--muted-foreground, #64748b); }
      .rlur-grid { display: grid; grid-template-rows: repeat(2, minmax(46px,1fr)); grid-auto-flow: column; grid-auto-columns: 177px; gap: 8px; overflow-x: auto; padding: 2px 2px 8px; align-content: start; scrollbar-width: thin; }
      .rlur-lottery { display: flex; gap: 7px; align-items: center; justify-content: space-between; padding: 9px 11px; border: 1px solid var(--border, #cbd5e1); border-radius: 6px; background: transparent; color: inherit; text-align: left; min-height: 46px; }
      .rlur-lottery:hover { background: var(--muted, #f1f5f9); }
      .rlur-lottery[data-status="success"] { border-color: #10b981; }
      .rlur-lottery[data-status="error"] { border-color: #d97777; }
      .rlur-status { display: inline-flex; flex-shrink: 0; width: 14px; height: 14px; color: var(--muted-foreground, #64748b); }
      [data-status="loading"] .rlur-status { border: 2px solid var(--border, #cbd5e1); border-top-color: var(--foreground, #0f172a); border-radius: 50%; animation: rlur-spin .8s linear infinite; }
      [data-status="success"] .rlur-status { color: #059669; }
      [data-status="error"] .rlur-status, [data-status="warning"] .rlur-status { color: #c45b62; }
      #rlur-toggle { position: fixed; right: 20px; bottom: 20px; z-index: 40; display: flex; align-items: center; gap: 7px; height: 36px; padding: 0 13px; border: 1px solid var(--border, #cbd5e1); border-radius: 7px; background: var(--card, #fff); color: var(--foreground, #0f172a); box-shadow: 0 2px 9px #0002; font-weight: 600; }
      #rlur-toggle[aria-expanded="true"] { bottom: 202px; }
      #rlur-host svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      @keyframes rlur-spin { to { transform: rotate(360deg); } }
      @media (max-width: 640px) { #rlur-bar { grid-template-columns: 165px minmax(0,1fr); gap: 10px; left: 6px; right: 6px; padding: 10px; } .rlur-grid { grid-auto-columns: 155px; } .rlur-title { font-size: 11px; } }
      @media (prefers-reduced-motion: reduce) { #rlur-bar { transition: none; } }
    `;
    document.head.appendChild(style);
    const host = document.createElement('div'); host.id = 'rlur-host';
    const bar = document.createElement('section'); bar.id = 'rlur-bar'; bar.setAttribute('aria-label', 'Loterías USA');
    const left = document.createElement('div');
    const title = document.createElement('div'); title.className = 'rlur-title'; title.textContent = 'Rovs Loterias USA';
    const close = document.createElement('button'); close.type = 'button'; close.className = 'rlur-close'; close.textContent = '×'; close.title = 'Cerrar barra'; title.append(close); left.append(title);
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
    const search = document.createElement('input'); search.id = 'rlur-search'; search.placeholder = 'Buscar lotería…'; search.setAttribute('aria-label', 'Filtrar botones de loterías'); left.append(search);
    const version = document.createElement('strong'); version.className = 'rlur-version'; version.textContent = 'v' + (typeof GM_info !== 'undefined' ? GM_info.script?.version || APP_VERSION : APP_VERSION); left.append(version);
    const context = document.createElement('div'); context.id = 'rlur-context'; context.setAttribute('role', 'status'); left.append(context);
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
    const setOpen = value => { open = value; bar.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open)); if (open) search.focus(); };
    toggle.setAttribute('aria-controls', 'rlur-bar'); toggle.setAttribute('aria-expanded', 'false'); toggle.onclick = () => setOpen(!open); close.onclick = () => setOpen(false);
    bar.append(left, grid); host.append(bar, toggle); document.body.append(host);
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
