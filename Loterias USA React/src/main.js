if (document.getElementById('rlur-host')) return;
let writeQueue = Promise.resolve();
const running = new Map();
const ui = createInterface(runQuery);
const rover = createRoverAdapter(ui.setContext);

async function runQuery(config) {
    if (running.has(config.id)) return;
    const token = Symbol(); running.set(config.id, token);
    ui.setStatus(config.id, 'loading');
    let snapshot, provider, result;
    const details = message => [snapshot?.dateKey, config.sorteo, message, result?.source || provider?.name || config.fuente].filter(Boolean).join(' · ');
    const report = state => console.table(queryReport(config, provider, snapshot, result, state));
    try {
        snapshot = rover.capture();
        ui.revealFields(Object.values(rover.findFields(config)));
        provider = PROVIDERS[config.fuente];
        if (!provider) throw statusError('source_error', 'Fuente de resultados no disponible.');
        result = await provider.consultar(config, snapshot.date);
        rover.assertCurrent(snapshot);
        if (!result.p3 && !result.p4) {
            const message = 'Sin resultado para la fecha y sorteo seleccionados.';
            ui.setStatus(config.id, 'pending', details(message)); report(message); return;
        }
        const write = writeQueue.then(() => rover.fill(config, result, snapshot));
        writeQueue = write.catch(() => {});
        const expected = await write;
        const fields = rover.findFields(config);
        ui.highlightFields(Object.keys(expected).map(key => fields[key]));
        ui.revealFields(Object.values(fields));
        const missing = result.requiredGames.filter(key => !result[key]);
        const state = missing.length ? 'partial' : 'success';
        const message = missing.length ? `Resultado parcial: falta ${missing.map(key => provider.labels[key === 'p3' ? 0 : 1]).join(', ')}.` : 'Completado. Revisa la fila antes de procesar.';
        ui.setStatus(config.id, state, details(message));
        report(message);
    } catch (error) {
        const code = queryState(error?.code).code;
        const message = code === 'error' ? 'No se pudo completar la consulta. Intenta nuevamente.' : error.message;
        ui.setStatus(config.id, code, details(message)); report(message);
        console.error(`[Rovs Loterias USA React] ${config.nombreFila}: ${message}`);
    } finally { if (running.get(config.id) === token) running.delete(config.id); }
}
