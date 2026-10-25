if (document.getElementById('rlur-host')) return;
let writeQueue = Promise.resolve();
const running = new Map();
const ui = createInterface(runQuery);
const rover = createRoverAdapter(ui.setContext);

async function runQuery(config) {
    if (running.has(config.id)) return;
    const token = Symbol(); running.set(config.id, token);
    ui.setStatus(config.id, 'loading', 'Consultando sorteo…');
    try {
        const snapshot = rover.capture();
        rover.findFields(config);
        const provider = PROVIDERS[config.fuente];
        if (!provider) throw new Error('Fuente de resultados no disponible.');
        const result = await provider.consultar(config, snapshot.date);
        rover.assertCurrent(snapshot);
        if (!result.p3 && !result.p4) {
            ui.setStatus(config.id, 'pending', 'Sin resultado para la fecha y sorteo seleccionados.'); return;
        }
        const write = writeQueue.then(() => rover.fill(config, result, snapshot));
        writeQueue = write.catch(() => {});
        await write;
        const missing = result.requiredGames.filter(key => !result[key]);
        const state = missing.length ? 'warning' : 'success';
        const message = missing.length ? `Resultado parcial: falta ${missing.map(key => provider.labels[key === 'p3' ? 0 : 1]).join(', ')}.` : 'Completado. Revisa la fila antes de procesar.';
        ui.setStatus(config.id, state, `${message}\n${snapshot.dateKey} · ${result.source}`);
        console.table({ Lotería: config.nombreFila, Código: config.codigo, Fecha: snapshot.dateKey, Fuente: result.source, 'Pick 3': result.p3 || '—', 'Pick 4': result.p4 || '—', Estado: message });
    } catch (error) {
        ui.setStatus(config.id, 'error', error instanceof Error ? error.message : 'No se pudo completar la consulta.');
    } finally { if (running.get(config.id) === token) running.delete(config.id); }
}
