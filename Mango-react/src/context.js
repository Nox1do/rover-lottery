import {
  parseDate,
  todayInZone,
  fields,
  equalFields,
  trimCode,
  FIELD_NAMES,
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
    const invalidRows = new Map();
    for (const row of data.filas) {
      const code = trimCode(row?.abrev);
      if (!code) continue;
      if (map.has(code) || invalidRows.has(code)) {
        map.delete(code);
        invalidRows.set(code, "codigo_duplicado");
        continue;
      }
      if (![true, false, 0, 1].includes(row.procesado)) {
        invalidRows.set(code, "proc_desconocido");
        continue;
      }
      map.set(code, {
        ...fields(row),
        abrev: code,
        nombre: String(row.nombre ?? ""),
        procesado: row.procesado === true || row.procesado === 1,
      });
    }
    candidate = {
      ...request,
      date,
      persisted: map,
      invalidRows,
      readyAt: now() + 100,
    };
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
  function prepareSearch(view, reason = "Esperando la respuesta de Buscar.") {
    sync(view);
    const previous =
      confirmed || retained || request?.previous || candidate?.previous;
    invalidate(reason);
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
    if (confirmed && view.tableReady === false && !view.busy) {
      invalidate("La estructura de Central no es verificable. Pulsa Buscar.");
      return;
    }
    if (
      candidate &&
      view.tableReady !== false &&
      !view.busy &&
      !view.dialog &&
      now() >= candidate.readyAt &&
      view.rows?.length
    ) {
      const rows = view.rows;
      const counts = new Map();
      for (const row of rows)
        counts.set(row.code, (counts.get(row.code) || 0) + 1);
      const verifiedRows = new Map(),
        incidences = [];
      for (const row of rows) {
        const stored = candidate.persisted.get(row.code);
        let motivo =
          candidate.invalidRows.get(row.code) ||
          (counts.get(row.code) !== 1
            ? "codigo_duplicado"
            : !stored
              ? "codigo_no_encontrado"
              : stored.procesado !== row.processed
                ? "proc_distinto"
                : null);
        const old = candidate.previous?.verifiedRows.get(row.code);
        const previousKeys = old?.keys || [];
        const knownDirty =
          row.dirty && old && equalFields(old.fields, stored, previousKeys);
        const different = FIELD_NAMES.filter(
          (key) => !equalFields(stored, row.fields, [key]),
        );
        if (!motivo && different.length && !knownDirty)
          motivo = "campos_distintos";
        if (motivo)
          incidences.push({ codigo: row.code, motivo, campos: different });
        else
          verifiedRows.set(row.code, {
            epoch,
            date: candidate.date,
            server: candidate.server,
            serverId: candidate.serverId,
            keys: different.length ? [...previousKeys] : [...FIELD_NAMES],
            fields: fields(stored),
            procesado: stored.procesado,
          });
      }
      confirmed = {
        epoch,
        date: candidate.date,
        server: candidate.server,
        serverId: candidate.serverId,
        persisted: candidate.persisted,
        invalidRows: candidate.invalidRows,
        verifiedRows,
        previousVerified: candidate.previous?.verifiedRows || new Map(),
        incidences,
        incidenceTotal: incidences.length,
      };
      candidate = null;
      message = "Fecha y servidor verificados; comprobación por lotería.";
    }
  }
  function snapshot(view) {
    sync(view);
    if (
      !confirmed ||
      view.busy ||
      view.dialog ||
      !(view.rowCount ?? view.rows?.length)
    )
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
  function recordProof(code, proof, snap) {
    if (
      !confirmed ||
      snap !== confirmed ||
      proof?.epoch !== epoch ||
      proof.date !== snap.date ||
      proof.server !== snap.server ||
      proof.serverId !== snap.serverId
    )
      throw Error("context_changed");
    const stored = snap.persisted.get(code);
    if (
      !stored ||
      snap.invalidRows.has(code) ||
      !proof.keys?.length ||
      proof.keys.some((key) => !FIELD_NAMES.includes(key)) ||
      proof.procesado !== stored.procesado ||
      !equalFields(proof.fields, stored, proof.keys)
    )
      throw Error("invalid_row_proof");
    const old = snap.verifiedRows.get(code);
    snap.verifiedRows.set(code, {
      ...proof,
      fields: fields(stored),
      keys: [...new Set([...(old?.keys || []), ...proof.keys])],
    });
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
    recordProof,
    get message() {
      return message;
    },
    get epoch() {
      return epoch;
    },
  };
}
