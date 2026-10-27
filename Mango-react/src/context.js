import {
  parseDate,
  todayInZone,
  fields,
  equalFields,
  trimCode,
} from "./helpers.js";
// A load response proves persisted data; a settled DOM proves which table is visible.
export function createContext({ today = todayInZone, now = Date.now } = {}) {
  let epoch = 0,
    request = null,
    candidate = null,
    confirmed = null,
    retained = null,
    message = "Pulsa Buscar para verificar la fecha cargada.";
  function invalidate(reason) {
    epoch++;
    request = null;
    candidate = null;
    confirmed = null;
    retained = null;
    message = reason;
  }
  function begin(meta) {
    const baseline =
      confirmed || retained || request?.previous || candidate?.previous;
    const previous =
      baseline?.date === meta.date &&
      baseline?.server === meta.server &&
      baseline?.serverId === meta.serverId
        ? baseline
        : null;
    retained = null;
    epoch++;
    confirmed = null;
    candidate = null;
    request = { ...meta, id: epoch, previous };
    message = "Central está cargando resultados…";
    return epoch;
  }
  function finish(id, data) {
    if (!request || request.id !== id) return;
    const date = parseDate(data?.fecha),
      map = new Map();
    if (date !== request.date || !Array.isArray(data.filas)) {
      invalidate("Respuesta de Central no corresponde a la fecha solicitada.");
      return;
    }
    for (const row of data.filas) {
      const code = trimCode(row?.abrev);
      if (
        !code ||
        map.has(code) ||
        ![true, false, 0, 1].includes(row.procesado)
      ) {
        invalidate("Respuesta de Central no reconocida.");
        return;
      }
      map.set(code, {
        ...fields(row),
        abrev: code,
        nombre: String(row.nombre ?? ""),
        procesado: row.procesado === true || row.procesado === 1,
      });
    }
    candidate = { ...request, date, persisted: map, readyAt: now() + 100 };
    request = null;
    message = "Respuesta recibida; verificando la tabla de Central…";
  }
  function fail(id) {
    if (request?.id === id) {
      const previous = request.previous;
      invalidate("Falló la carga de Central. Pulsa Buscar nuevamente.");
      retained = previous;
    }
  }
  function prepareSearch(view) {
    sync(view);
    const previous =
      confirmed || retained || request?.previous || candidate?.previous;
    invalidate("Esperando la respuesta de Buscar.");
    retained = previous;
  }
  function sync(view) {
    const current = confirmed || candidate || request || retained;
    if (
      !view.active ||
      view.readOnly ||
      view.server !== "PRINCIPAL" ||
      view.selectedDate !== today()
    ) {
      if (current)
        invalidate(
          "Solo PRINCIPAL y fecha de hoy; requiere permiso de escritura.",
        );
      return;
    }
    if (
      current &&
      (current.date !== view.selectedDate || current.server !== view.server)
    ) {
      invalidate("Cambió la fecha o el servidor. Pulsa Buscar.");
      return;
    }
    if (
      candidate &&
      !view.busy &&
      !view.dialog &&
      now() >= candidate.readyAt &&
      view.rows?.length
    ) {
      const codes = new Set();
      let matches = true;
      for (const row of view.rows) {
        const stored = candidate.persisted.get(row.code);
        if (
          codes.has(row.code) ||
          !stored ||
          stored.procesado !== row.processed
        ) {
          const reason = codes.has(row.code)
            ? "código duplicado"
            : !stored
              ? "código no encontrado en la respuesta"
              : "PROC diferente o desconocido";
          message = `No se pudo verificar ${row.code}: ${reason}.`;
          matches = false;
          break;
        }
        codes.add(row.code);
        const old = candidate.previous?.persisted.get(row.code);
        const knownDirty =
          candidate.previous?.date === candidate.date &&
          candidate.previous?.server === candidate.server &&
          candidate.previous?.serverId === candidate.serverId &&
          row.dirty &&
          old &&
          equalFields(old, stored);
        if (!equalFields(stored, row.fields) && !knownDirty) {
          message = `No se pudo verificar ${row.code}: campos distintos a los guardados en Central.`;
          matches = false;
          break;
        }
      }
      if (matches) {
        confirmed = {
          epoch,
          date: candidate.date,
          server: candidate.server,
          serverId: candidate.serverId,
          persisted: candidate.persisted,
        };
        candidate = null;
        message = "Fecha y publicación verificadas.";
      }
    }
  }
  function snapshot(view) {
    sync(view);
    if (!confirmed || view.busy || view.dialog || !view.rows?.length)
      return null;
    return confirmed;
  }
  function assert(snap, view) {
    const cur = snapshot(view);
    if (
      !snap ||
      !cur ||
      cur.epoch !== snap.epoch ||
      cur.date !== snap.date ||
      cur.server !== snap.server
    )
      throw new Error("context_changed");
    return cur;
  }
  return {
    begin,
    prepareSearch,
    finish,
    fail,
    sync,
    snapshot,
    assert,
    invalidate,
    get message() {
      return message;
    },
    get epoch() {
      return epoch;
    },
  };
}
