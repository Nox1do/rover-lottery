// Un motivo, un icono y una etiqueta: los mensajes no se clasifican por su texto.
const QUERY_STATES = Object.freeze({
    idle: { label: '', tone: 'idle', icon: '' },
    loading: { label: 'Consultando sorteo', tone: 'loading', icon: '<circle cx="12" cy="12" r="9" stroke-dasharray="42 15"/>' },
    success: { label: 'Llenado completo', tone: 'success', icon: '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>' },
    partial: { label: 'Llenado parcial', tone: 'warning', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h9"/>' },
    pending: { label: 'Resultado pendiente', tone: 'pending', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
    date_required: { label: 'Fecha sin confirmar', tone: 'warning', icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15h3"/>' },
    context_changed: { label: 'Fecha o servidor cambió', tone: 'warning', icon: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l3 2"/>' },
    rover_loading: { label: 'Cargando tabla de Rover', tone: 'warning', icon: '<path d="M20 7v5h-5M4 17v-5h5M20 12a8 8 0 0 0-14-5M4 12a8 8 0 0 0 14 5"/>' },
    table_missing: { label: 'Tabla no disponible', tone: 'warning', icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12M15 13v3M15 18v.1"/>' },
    row_missing: { label: 'Fila no visible', tone: 'warning', icon: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6"/>' },
    row_duplicate: { label: 'Fila duplicada', tone: 'error', icon: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>' },
    fields_locked: { label: 'Campos bloqueados', tone: 'warning', icon: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>' },
    network: { label: 'Sin conexión', tone: 'error', icon: '<path d="m3 3 18 18M2 8a17 17 0 0 1 4-2M10 4a17 17 0 0 1 12 4M5 12a11 11 0 0 1 4-2M13 10a11 11 0 0 1 6 2M8 16a5 5 0 0 1 8 0M12 20v.1"/>' },
    timeout: { label: 'Tiempo agotado', tone: 'warning', icon: '<path d="M6 3h12M6 21h12M7 3v4l10 10v4M17 3v4L7 17v4"/>' },
    source_error: { label: 'Fuente no disponible', tone: 'error', icon: '<path d="M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1 2 10M12 10v4M12 17v.1"/>' },
    invalid_response: { label: 'Respuesta inválida', tone: 'error', icon: '<path d="M14 2H5v20h14V7l-5-5v5h5M12 11v4M12 18v.1"/>' },
    cancelled: { label: 'Consulta cancelada', tone: 'warning', icon: '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>' },
    unconfirmed: { label: 'Llenado no confirmado', tone: 'warning', icon: '<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4M9 9a3 3 0 1 1 4 3v3M13 18v.1"/>' },
    error: { label: 'Error inesperado', tone: 'error', icon: '<path d="m8 2-6 6v8l6 6h8l6-6V8l-6-6ZM12 7v6M12 17v.1"/>' }
});

function queryState(code) {
    const key = Object.hasOwn(QUERY_STATES, code) ? code : 'error';
    return { code: key, ...QUERY_STATES[key] };
}
function queryIcon(code) {
    const state = queryState(code);
    return state.icon ? `<svg viewBox="0 0 24 24" data-icon="${state.code}" aria-hidden="true">${state.icon}</svg>` : '';
}
function statusError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}
