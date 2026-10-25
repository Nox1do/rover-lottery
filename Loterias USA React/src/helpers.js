function normalizeLabel(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function buildValidLocalDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function formatLocalDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function localDateKey(date) { return formatLocalDateKey(date); }

function parseCentralDate(text) {
    const match = /^(\d{1,2})\s+([a-záéíóú]+)\.?\s+(\d{4})$/i.exec(String(text || '').trim());
    if (!match) return null;
    const months = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12 };
    const month = months[match[2].toLowerCase()];
    return month ? buildValidLocalDate(Number(match[3]), month, Number(match[1])) : null;
}

function nextRender() { return new Promise(resolve => setTimeout(resolve, 0)); }

// Cada consulta conserva fecha/sorteo, hora y los nombres propios del proveedor.
function queryReport(config, provider, snapshot, result, state) {
    const labels = provider?.labels || ['Pick 3', 'Pick 4'];
    return {
        'Lotería': config.nombreMenu, 'Código': config.codigo,
        'Fuente': result?.source || provider?.name || config.fuente,
        'Hora': new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        'Fecha': snapshot?.dateKey || 'Sin fecha vinculada',
        ...(config.sorteo ? { 'Sorteo': config.sorteo } : {}),
        [labels[0]]: result?.p3 || '—', [labels[1]]: result?.p4 || '—', 'Estado': state
    };
}
