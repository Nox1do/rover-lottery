// Este adaptador solo trabaja con el formulario. No usa APIs internas de Rover,
// no intercepta fetch/XHR y no publica resultados ni pulsa botones de Procesar.
function createRoverAdapter(onChange) {
    const path = '/loteria/resultados/ver';
    const columns = { primera: '1ERA', segunda: '2DA', tercera: '3RA', pick3: 'PICK3', pick4: 'PICK4' };
    const rowIdentity = (name, code) => `${normalizeLabel(name)}\0${String(code || '').trim()}`;
    let epoch = 0, confirmed = null, candidate = null, pending = false, timer = null, lastView = '';
    let tableCache = null;

    function invalidateTable(records) {
        if (!tableCache) return;
        const table = tableCache.table;
        if (!table.isConnected || records.some(record => {
            if (record.type === 'attributes') {
                if (!['class', 'data-slot'].includes(record.attributeName)) return false;
                const cell = record.target.closest('td');
                return cell && table.contains(cell) && cell === cell.parentElement.firstElementChild;
            }
            return table.contains(record.target) || [...record.addedNodes, ...record.removedNodes].some(node =>
                node.nodeType === 1 && (node.tagName === 'TABLE' || node.querySelector('table')));
        })) tableCache = null;
    }

    function screen() {
        const form = [...document.querySelectorAll('#root form')].find(form =>
            [...form.querySelectorAll('button')].some(button => button.type === 'submit' && button.textContent.trim() === 'Buscar'));
        const search = form && [...form.querySelectorAll('button')].find(button => button.type === 'submit' && button.textContent.trim() === 'Buscar');
        const dateButton = form?.querySelector('button[aria-haspopup="dialog"]');
        const date = parseCentralDate(dateButton?.textContent);
        const serverButton = document.querySelector('button[title="Servidor cuyos datos se están viendo"]');
        const server = serverButton?.textContent.trim() || '';
        return { form, search, date, server };
    }

    function resultTable() {
        // Procesar también mutaciones aún no entregadas antes de reutilizar
        // identidades. Un filtro, reconstrucción o duplicado invalida el índice.
        invalidateTable(observer.takeRecords());
        if (tableCache?.table.isConnected) return tableCache.table;
        const tables = [...document.querySelectorAll('#root table')].filter(table => {
            const headers = [...table.querySelectorAll('thead th')].map(th => normalizeLabel(th.textContent));
            return Object.values(columns).every(key => headers.filter(h => h === key).length === 1) && headers.includes('LOTERIA');
        });
        if (tables.length !== 1) return null;
        tableCache = { table: tables[0], headers: [...tables[0].querySelectorAll('thead th')].map(th => normalizeLabel(th.textContent)), rows: null };
        return tableCache.table;
    }

    function invalidate() { if (confirmed) { confirmed = null; epoch++; } }

    function sync() {
        clearTimeout(timer); timer = null;
        const active = location.pathname.replace(/\/$/, '') === path;
        const current = screen();
        const key = current.date && formatLocalDateKey(current.date);
        if (!active) { invalidate(); candidate = null; pending = false; }
        if (confirmed && (confirmed.dateKey !== key || confirmed.server !== current.server)) invalidate();
        if (candidate && (candidate.dateKey !== key || candidate.server !== current.server)) { candidate = null; pending = false; }
        const table = active && resultTable();
        if (active && pending && candidate && current.search && !current.search.disabled && table && Date.now() >= candidate.notBefore) {
            confirmed = { dateKey: candidate.dateKey, server: candidate.server }; candidate = null; pending = false;
        }
        if (active && pending && candidate && current.search && !current.search.disabled && table && Date.now() < candidate.notBefore) {
            timer = setTimeout(sync, candidate.notBefore - Date.now() + 1);
        }
        const ready = !!(active && confirmed && table && current.search && !current.search.disabled && !pending);
        const message = !active ? '' : ready ? `${confirmed.dateKey} · Listo` : pending ? 'Cargando la fecha de Rover…' : 'Pulsa Buscar en Rover para vincular la fecha.';
        const view = { active, ready, message, epoch };
        const signature = JSON.stringify(view);
        if (signature !== lastView) { lastView = signature; onChange(view); }
        return { ...view, ...current, table, dateKey: confirmed?.dateKey };
    }

    function schedule() { if (!timer) timer = setTimeout(sync, 30); }
    document.addEventListener('submit', event => {
        const current = screen();
        if (event.target !== current.form || location.pathname.replace(/\/$/, '') !== path) return;
        epoch++; confirmed = null;
        candidate = current.date && current.server ? { dateKey: formatLocalDateKey(current.date), server: current.server, notBefore: Date.now() + 20 } : null;
        pending = !!candidate; schedule();
    }, true);
    const observer = new MutationObserver(records => { invalidateTable(records); schedule(); });
    observer.observe(document.getElementById('root') || document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'class', 'data-slot'] });
    window.addEventListener('popstate', schedule);
    sync();

    function capture() {
        const current = sync();
        if (!current.ready) {
            const code = !current.active || (current.dateKey && !current.table) ? 'table_missing' : current.search?.disabled ? 'rover_loading' : 'date_required';
            throw statusError(code, current.message || 'Abre Ver resultados en Rover.');
        }
        return { epoch, dateKey: current.dateKey, date: new Date(current.date.getTime()), server: current.server };
    }

    function assertCurrent(snapshot) {
        const current = sync();
        const selectedDate = current.date && formatLocalDateKey(current.date);
        if (snapshot.epoch !== current.epoch || snapshot.dateKey !== selectedDate || snapshot.server !== current.server || !current.active) {
            throw statusError('context_changed', 'Cambió la fecha o el servidor. Consulta esta lotería otra vez.');
        }
        if (!current.ready) throw statusError('table_missing', 'La tabla no está disponible. Pulsa Buscar en Rover.');
    }

    function findFields(config) {
        const table = resultTable();
        if (!table) throw statusError('table_missing', 'No se reconoce la tabla de resultados. Pulsa Buscar en Rover.');
        const { headers } = tableCache;
        if (!tableCache.rows) {
            const index = new Map();
            for (const row of table.querySelectorAll('tbody tr')) {
                const first = row.firstElementChild;
                const key = rowIdentity(first?.querySelector('.font-medium')?.textContent, first?.querySelector('[data-slot="badge"]')?.textContent);
                const matches = index.get(key) || []; matches.push(row); index.set(key, matches);
            }
            tableCache.rows = index;
        }
        const rows = tableCache.rows.get(rowIdentity(config.nombreFila, config.codigo)) || [];
        if (rows.length !== 1) throw statusError(rows.length ? 'row_duplicate' : 'row_missing', rows.length ? 'Hay más de una fila para esta lotería. Revisa la tabla.' : 'La lotería no está visible. Revisa la fecha y el filtro de Rover.');
        const cells = [...rows[0].children];
        const fields = Object.fromEntries(Object.entries(columns).map(([name, header]) => [name, cells[headers.indexOf(header)]?.querySelector('input')]));
        if (Object.values(fields).some(input => !input || input.disabled || input.readOnly)) throw statusError('fields_locked', 'Los campos de esta lotería no están disponibles para editar.');
        return fields;
    }

    async function fill(config, result, snapshot) {
        assertCurrent(snapshot);
        findFields(config); // Validar todos los campos antes de la primera escritura.
        const expected = {}, picks = [];
        if (result.p3 != null) {
            if (!/^\d{3}$/.test(result.p3)) throw statusError('invalid_response', 'Pick 3 inválido.');
            expected.pick3 = result.p3; expected.primera = result.p3.slice(-2); picks.push('pick3');
        }
        if (result.p4 != null) {
            if (!/^\d{4}$/.test(result.p4)) throw statusError('invalid_response', 'Pick 4 inválido.');
            expected.pick4 = result.p4; expected.segunda = result.p4.slice(0, 2); expected.tercera = result.p4.slice(-2); picks.push('pick4');
        }
        // Rover programa focus() en Pick 4 al completar Pick 3. Prepararlo sin
        // scroll evita un segundo desplazamiento al ejecutarse ese mismo foco.
        // No se sustituyen métodos ni manejadores de la página.
        if (picks.includes('pick3')) findFields(config).pick4.focus({ preventScroll: true });
        for (const key of picks) {
            assertCurrent(snapshot);
            const input = findFields(config)[key];
            // Si el pick ya coincide, vaciarlo primero como una edición normal
            // obliga a React a recalcular los premios al volver a escribirlo.
            // Solo se tocan los picks disponibles en el resultado consultado.
            const values = input.value === expected[key] ? ['', expected[key]] : [expected[key]];
            for (const value of values) {
                assertCurrent(snapshot);
                const current = findFields(config)[key];
                // Saltar el setter de la instancia permite que React detecte
                // el cambio mediante su manejador normal de input.
                const nativeSetter = Object.getOwnPropertyDescriptor(current.ownerDocument.defaultView.HTMLInputElement.prototype, 'value').set;
                nativeSetter.call(current, value);
                current.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            }
        }
        // Una sola cesión: los temporizadores/foco de Rover ya encuentran
        // ambos picks completos, sin pintar el estado vacío entre escrituras.
        await nextRender();
        assertCurrent(snapshot);
        const fields = findFields(config);
        if (Object.entries(expected).some(([key, value]) => fields[key].value !== value)) throw statusError('unconfirmed', 'Rover no conservó todos los valores. Revisa la fila antes de procesar.');
        return expected;
    }
    return { capture, assertCurrent, findFields, fill };
}
