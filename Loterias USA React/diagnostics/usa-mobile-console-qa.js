// USA React · QA móvil 0.1.0. Pegar completo en F12 → Consola de Firefox.
// Observación temporal: no edita campos ni solicita/procesa resultados.
(() => {
    'use strict';
    const KEY = '__USA_MOBILE_QA__';
    window[KEY]?.stop?.(false);
    if (!document.querySelector('#rlur-host')) {
        console.warn('[USA móvil QA] Abre Central con USA React instalado antes de ejecutar el snippet.');
        return;
    }
    const codes = {
        'tn-morning': 'TN-MORNING', 'ga-am': 'GE-MD', 'oh-am': 'OHIO-MD',
        'in-am': 'IN-MD', 'tn-midday': 'TN-MD', 'il-am': 'ILLINOIS-MD',
        'fl-am': 'FL-AM', 'ga-pm': 'GE-EV', 'tn-pm': 'TN-EVEN',
        'oh-pm': 'OHIO-EVEN', 'il-pm': 'ILLINOIS-EVEN', 'la-pm': 'LOUI-EVEN',
        'in-pm': 'IN-EVEN', 'fl-pm': 'FL-PM', 'ga-night': 'GE-NT'
    };
    const names = ['primera', 'segunda', 'tercera', 'pick3', 'pick4'];
    const reports = [], listeners = [], eventEntries = new WeakMap();
    const originalTable = console.table;
    let active = null, installed = true, tableHook = false;
    const now = () => performance.now();
    const ms = value => value == null ? null : Math.round(value * 10) / 10;
    const clone = value => JSON.parse(JSON.stringify(value));
    function listen(target, type, handler, capture = false) {
        target.addEventListener(type, handler, { capture, passive: true });
        listeners.push(() => target.removeEventListener(type, handler, capture));
    }
    function push(list, item, cap = 20) { if (list.length < cap) list.push(item); }
    function terminal(run, reason) {
        if (active !== run || run.ended != null) return;
        run.ended = now(); run.reason = reason;
        run.status = run.button.dataset.statusCode || 'desconocido';
        // Cola breve de observación para scroll y marca verde, no otra consulta.
        run.tail = setTimeout(() => finish(run), 250);
    }
    function finish(run, reason, print = true) {
        if (active !== run) return;
        if (run.ended == null) {
            run.ended = now(); run.reason = reason || 'manual';
            run.status = run.button.dataset.statusCode || 'desconocido';
        }
        for (const observer of run.observers) observer.disconnect();
        cancelAnimationFrame(run.frame);
        clearTimeout(run.pulse); clearTimeout(run.deadline); clearTimeout(run.tail);
        const notes = [...run.notes];
        if (!run.internalTimings) notes.push('No se observaron los tiempos internos: el sandbox puede usar otra consola. Adjunta también la tabla original Fuente/Cola/Formulario/Total.');
        if (run.hidden) notes.push('Hubo una pestaña oculta: sus intervalos no se usan como evidencia de bloqueo.');
        if (run.frameGapsOver50 || run.timerMaxDelay > 50) notes.push('Hubo pausas de la página; por sí solas no identifican CPU de React, GPU, extensión ni script causante.');
        let rowAboveBar = null;
        if (run.row?.isConnected) {
            const rowBox = run.row.getBoundingClientRect(), barBox = document.querySelector('#rlur-bar')?.getBoundingClientRect();
            if (barBox) rowAboveBar = rowBox.top >= 0 && rowBox.bottom <= barBox.top;
        }
        const first = run.inputEvents[0]?.atMs ?? null;
        const last = run.inputEvents.at(-1)?.atMs ?? null;
        const report = {
            diagnosticVersion: '0.1.0', scriptVersion: run.version,
            at: run.at, lottery: run.label, code: run.code,
            status: run.status, reason: run.reason, tableRows: run.tableRows,
            setupMs: ms(run.setupMs),
            phaseMs: {
                clickToFirstInput: first,
                firstToLastInput: first == null ? null : ms(last - first),
                clickToGreen: run.green,
                clickToStatus: ms(run.ended - run.start)
            },
            internalTimings: run.internalTimings,
            gmNetworkMs: null,
            responsiveness: {
                maxVisibleFrameGapMs: ms(run.frameMaxGap), visibleFrameGapsOver50: run.frameGapsOver50,
                maxVisibleTimerDelayMs: ms(run.timerMaxDelay), frameSamples: run.frameSamples,
                hiddenDuringSample: run.hidden, longTasksSupported: run.longTasksSupported,
                longTasks: run.longTasksSupported ? run.longTasks : null
            },
            inputEvents: run.inputEvents, structuralMutationsRoot: run.rootMutations,
            scrollEventCount: run.scrollCount, scrollSamples: run.scrolls,
            rowStillConnected: !!run.row?.isConnected, rowAboveBar, notes,
            limits: [
                'No observa directamente GM_xmlhttpRequest ni mide red GM pura.',
                'La espera antes del primer input incluye consulta y preparación; no equivale a latencia de API.',
                'Propagación input incluye manejadores síncronos observados hasta window, no todos los renders posteriores.',
                'La observación añade trabajo; la cola final de 250 ms no se incluye en clickToStatus.'
            ]
        };
        active = null; reports.push(report);
        if (reports.length > 5) reports.shift();
        if (print) console.log('USA_MOBILE_QA_RESULT', JSON.stringify(report, null, 2));
    }
    function start(button, id) {
        if (active) {
            active.notes.push('Otro clic cerró esta muestra; no usarla como consulta aislada.');
            finish(active, 'otro_click');
        }
        const startTime = now(), code = codes[id];
        const candidates = [...document.querySelectorAll('#root table tbody tr')];
        const rows = candidates.filter(row => row.firstElementChild?.querySelector('[data-slot="badge"]')?.textContent.trim() === code);
        const row = rows.length === 1 ? rows[0] : null;
        const inputs = row ? [...row.querySelectorAll('input')] : [];
        const run = {
            start: startTime, button, code, row, inputs, version: document.querySelector('.rlur-version')?.textContent.trim() || 'desconocida',
            label: button.textContent.trim(), at: new Date().toISOString(), tableRows: candidates.length,
            setupMs: 0, ended: null, green: null, notes: [], observers: [], inputEvents: [],
            internalTimings: null, rootMutations: 0, scrollCount: 0, scrolls: [],
            frameSamples: 0, frameMaxGap: 0, frameGapsOver50: 0, lastFrame: startTime,
            timerMaxDelay: 0, hidden: document.hidden, longTasks: [],
            longTasksSupported: window.PerformanceObserver?.supportedEntryTypes?.includes('longtask') || false
        };
        active = run;
        if (rows.length !== 1) run.notes.push(`Coincidencias visibles de fila: ${rows.length}; no se atribuyen inputs a una fila ambigua/ausente.`);
        const stateObserver = new MutationObserver(records => {
            if (active !== run) return;
            const status = button.dataset.statusCode;
            if (status !== 'loading' && records.some(r => r.oldValue === 'loading')) terminal(run, 'estado_final');
        });
        stateObserver.observe(button, { attributes: true, attributeFilter: ['data-status-code'], attributeOldValue: true });
        run.observers.push(stateObserver);
        if (row) {
            const rowObserver = new MutationObserver(() => {
                if (run.green == null && inputs.some(input => input.classList.contains('rlur-fill-flash'))) run.green = ms(now() - run.start);
            });
            rowObserver.observe(row, { subtree: true, attributes: true, attributeFilter: ['class'] });
            run.observers.push(rowObserver);
        }
        const root = document.getElementById('root');
        if (root) {
            const rootObserver = new MutationObserver(records => { run.rootMutations += records.length; });
            rootObserver.observe(root, { subtree: true, childList: true, characterData: true });
            run.observers.push(rootObserver);
        }
        if (run.longTasksSupported) {
            try {
                const observer = new PerformanceObserver(list => {
                    for (const entry of list.getEntries()) if (entry.startTime >= run.start) push(run.longTasks, { atMs: ms(entry.startTime - run.start), durationMs: ms(entry.duration) });
                });
                observer.observe({ type: 'longtask', buffered: false }); run.observers.push(observer);
            } catch { run.longTasksSupported = false; }
        }
        function frame() {
            if (active !== run) return;
            const time = now(), gap = time - run.lastFrame;
            if (!document.hidden) {
                run.frameSamples++; run.frameMaxGap = Math.max(run.frameMaxGap, gap);
                if (gap > 50) run.frameGapsOver50++;
            }
            run.lastFrame = time;
            if (!button.isConnected && run.ended == null) terminal(run, 'boton_desmontado');
            run.frame = requestAnimationFrame(frame);
        }
        function pulse(expected) {
            if (active !== run) return;
            const time = now();
            if (!document.hidden && !run.hiddenSincePulse) run.timerMaxDelay = Math.max(run.timerMaxDelay, time - expected);
            run.hiddenSincePulse = document.hidden;
            run.pulse = setTimeout(() => pulse(time + 100), 100);
        }
        run.frame = requestAnimationFrame(frame);
        const expected = now() + 100;
        run.pulse = setTimeout(() => pulse(expected), 100);
        run.deadline = setTimeout(() => finish(run, 'limite_observacion_90s'), 90000);
        run.setupMs = now() - startTime;
    }
    listen(document, 'click', event => {
        const button = event.target.closest?.('#rlur-host [data-lottery-id]');
        const id = button?.dataset.lotteryId;
        if (button && !button.disabled && Object.hasOwn(codes, id)) start(button, id);
    }, true);
    listen(document, 'input', event => {
        const run = active, index = run?.inputs.indexOf(event.target) ?? -1;
        if (!run || index < 0 || run.inputEvents.length >= 20) return;
        const entry = { atMs: ms(now() - run.start), field: names[index] || 'input', length: event.target.value.length, trusted: event.isTrusted, observedPropagationMs: null };
        run.inputEvents.push(entry); eventEntries.set(event, { run, entry, start: now() });
    }, true);
    listen(window, 'input', event => {
        const entry = eventEntries.get(event);
        if (entry && active === entry.run) entry.entry.observedPropagationMs = ms(now() - entry.start);
    });
    listen(document, 'scroll', event => {
        if (!active) return;
        const node = event.target === document ? document.scrollingElement : event.target;
        active.scrollCount++;
        push(active.scrolls, { atMs: ms(now() - active.start), port: node?.id || node?.tagName || 'viewport', top: ms(node?.scrollTop), left: ms(node?.scrollLeft) });
    }, true);
    listen(document, 'visibilitychange', () => {
        if (!active) return;
        active.hidden = true; active.hiddenSincePulse = true; active.lastFrame = now();
    });
    function tableWrapper(...args) {
        try {
            const data = args[0], run = active;
            if (run && data?.['Código'] === run.code && Number.isFinite(data['Total (ms)'])) {
                const numeric = key => Number.isFinite(data[key]) ? data[key] : null;
                run.internalTimings = {
                    sourceMs: numeric('Fuente (ms)'), queueMs: numeric('Cola (ms)'),
                    formMs: numeric('Formulario (ms)'), totalMs: numeric('Total (ms)'),
                    date: String(data['Fecha'] || ''), draw: String(data['Sorteo'] || '')
                };
            }
        } catch { /* El diagnóstico nunca debe impedir la salida original. */ }
        return Reflect.apply(originalTable, this, args);
    }
    try { console.table = tableWrapper; tableHook = console.table === tableWrapper; } catch { /* Consola no modificable. */ }
    window[KEY] = Object.freeze({
        get installed() { return installed; },
        get reports() { return clone(reports); },
        last: () => reports.length ? clone(reports.at(-1)) : null,
        json: () => JSON.stringify(reports, null, 2),
        status: () => ({ installed, tableHook, recording: active?.code || null, completed: reports.length }),
        stop(print = true) {
            if (!installed) return;
            if (active) finish(active, 'diagnostico_desactivado', print);
            for (const remove of listeners) remove();
            if (console.table === tableWrapper) console.table = originalTable;
            installed = false;
            if (print) console.info('[USA móvil QA] Desactivado. Los informes siguen disponibles en __USA_MOBILE_QA__.json().');
        }
    });
    console.info('[USA móvil QA] Listo. Consulta una lotería móvil; después copia: copy(__USA_MOBILE_QA__.json()). No observa red GM directamente.');
})();
