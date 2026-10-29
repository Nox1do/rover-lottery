import {
  FIELD_NAMES,
  normalizeLabel,
  equalFields,
  clean,
  uid,
  validExpected,
  sleep,
} from "./helpers.js";
export function createDelivery({
  central,
  api,
  clientId,
  visuals = { paint() {}, clear() {}, syncBlue() {} },
}) {
  const operations = new Map(),
    acknowledged = new Set(),
    painted = new Map(),
    requestIds = new Map(),
    reconciliations = new Map(),
    verified = new Set(),
    matchedCodes = new Set();
  let errors = [],
    mismatches = [],
    omitted = [],
    matched = 0,
    lastDate = null,
    lastEpoch = null;
  function omit(row, code, block) {
    verified.delete(row.lottery_id);
    omitted.push({ loteria: row.lottery_id, codigo: code, ...block });
    return false;
  }
  function rowBlock(code, keys, snap, purpose) {
    return central.rowBlock?.(code, keys, snap, purpose) || null;
  }
  function fillBlock(code, expected, snap) {
    return central.fillBlock
      ? central.fillBlock(code, expected, snap)
      : central.canFill(code, expected, snap)
        ? null
        : { motivo: "llenado_no_permitido" };
  }
  // Only protocol labels are retained: no full response, tokens, client or operation IDs.
  const protocolLabel = (value) =>
    typeof value === "string" && /^[a-z][a-z0-9_]{0,79}$/.test(value)
      ? value
      : null;
  function rememberReconcile(row, code, snap, response) {
    reconciliations.delete(row.lottery_id);
    reconciliations.set(row.lottery_id, {
      loteria: row.lottery_id,
      codigo: code,
      fecha: snap.date,
      revision: Number.isInteger(row.revision) ? row.revision : null,
      consulta: new Date().toISOString(),
      accion: protocolLabel(response?.action),
      motivo_servicio: protocolLabel(response?.reason),
      should_paint: response?.should_paint === true,
      autoriza_llenado:
        response?.should_paint === true && response?.action === "paint_fields",
    });
    if (reconciliations.size > 20)
      reconciliations.delete(reconciliations.keys().next().value);
  }
  function match(row, visible) {
    const labels = new Set(
      [
        row.name,
        row.lottery_id,
        ...(Array.isArray(row.aliases) ? row.aliases : []),
      ]
        .map(normalizeLabel)
        .filter(Boolean),
    );
    const matches = visible.filter(
      (r) =>
        labels.has(normalizeLabel(r.code)) ||
        labels.has(normalizeLabel(r.name)),
    );
    return matches.length === 1 ? matches[0] : null;
  }
  function names(row) {
    const list =
      Array.isArray(row.owned_fields) && row.owned_fields.length
        ? row.owned_fields
        : Object.keys(row.expected_fields || {});
    return list.filter((k) => FIELD_NAMES.includes(k));
  }
  function matchingRows(rows, snap) {
    const visible = central.rows(),
      matches = rows
        .filter((row) => row.draw_date === snap.date)
        .map((row) => ({ row, visible: match(row, visible) }));
    const counts = new Map();
    for (const x of matches)
      if (x.visible)
        counts.set(x.visible.code, (counts.get(x.visible.code) || 0) + 1);
    return matches.filter((x) => x.visible && counts.get(x.visible.code) === 1);
  }
  function updateWaiting(matches, snap) {
    visuals.syncBlue(
      matches
        .filter(
          ({ row, visible }) =>
            row.visual?.state === "blue" &&
            row.proc_state !== "processed" &&
            visible.processed === false &&
            snap.persisted.get(visible.code)?.procesado === false &&
            !rowBlock(visible.code, names(row), snap, "blue"),
        )
        .map(({ row, visible }) => ({
          code: visible.code,
          names: names(row).filter((key) => !visible.fields[key]),
        })),
    );
  }
  // This path updates presentation only: no reservations, fills, ACKs or API calls.
  function syncVisuals(rows, snap) {
    central.assert(snap);
    updateWaiting(matchingRows(rows, snap), snap);
  }
  function assertReservation(row, response) {
    const operation = response?.operation;
    const expected = response?.expected_fields || operation?.expected_fields;
    if (
      !operation?.operation_id ||
      operation.status !== "reserved" ||
      !Number.isInteger(operation.revision) ||
      !validExpected(expected)
    )
      throw Error("invalid_paint_contract");
    if (
      operation.revision !== row.revision ||
      Object.entries(expected).some(
        ([key, value]) =>
          !names(row).includes(key) ||
          clean(row.expected_fields?.[key]) !== value,
      ) ||
      (operation.expected_fields &&
        !equalFields(
          operation.expected_fields,
          expected,
          Object.keys(expected),
        ))
    )
      throw Error("stale_revision");
    if (
      !Number.isFinite(Date.parse(operation.expires_at)) ||
      Date.parse(operation.expires_at) <= Date.now()
    )
      throw Error("operation_expired");
  }
  async function present(row, code, snap, response) {
    const guard = () => {
      central.assert(snap);
      assertReservation(row, response);
    };
    guard();
    const expected =
        response.expected_fields || response.operation?.expected_fields,
      operation = response.operation;
    if (
      !operation?.operation_id ||
      !Number.isInteger(operation.revision) ||
      !validExpected(expected)
    )
      throw Error("invalid_paint_contract");
    const localBlock = rowBlock(code, names(row), snap, "fill");
    if (localBlock) return omit(row, code, localBlock);
    if (central.isDirty?.(code))
      return omit(row, code, { motivo: "edicion_local" });
    const current = central.find(code);
    if (!current || current.processed !== false)
      return omit(row, code, { motivo: "fila_bloqueada" });
    if (!equalFields(current.fields, expected, Object.keys(expected))) {
      const block = fillBlock(code, expected, snap);
      if (block) return omit(row, code, block);
      if (!(await central.fill(code, expected, snap, guard)))
        throw Error("write_not_retained");
    }
    guard();
    const after = central.find(code);
    if (
      !after ||
      after.processed !== false ||
      central.isDirty?.(code) ||
      !equalFields(after.fields, expected, Object.keys(expected))
    )
      throw Error("write_not_retained");
    const afterBlock = rowBlock(code, names(row), snap, "fill");
    if (afterBlock) return omit(row, code, afterBlock);
    if (central.presentationBlock) {
      await sleep(0);
      guard();
    }
    const effectsBlock = central.presentationBlock?.(code, expected, snap);
    if (effectsBlock) return omit(row, code, effectsBlock);
    const observed = Object.fromEntries(
      Object.keys(expected).map((k) => [k, after.fields[k]]),
    );
    painted.set(code, { date: snap.date, fields: observed });
    visuals.paint(code, Object.keys(expected), "green", 2000);
    await api.post("/v1/mango/rows/presented", {
      operation_id: operation.operation_id,
      revision: operation.revision,
      client_id: clientId,
      presented_fields: observed,
    });
    central.assert(snap);
    operations.delete(row.row_key);
    requestIds.delete(row.row_key);
    return true;
  }
  async function process(row, code, snap) {
    central.assert(snap);
    const stored = snap.persisted.get(code),
      visible = central.find(code);
    if (!stored || !visible)
      return omit(row, code, { motivo: "fila_no_verificada" });
    const ownedKeys = names(row);
    if (!ownedKeys.length)
      return omit(row, code, { motivo: "sin_campos_administrados" });
    const verificationBlock = rowBlock(
      code,
      ownedKeys,
      snap,
      stored.procesado ? "ack" : "blue",
    );
    if (verificationBlock) return omit(row, code, verificationBlock);
    verified.add(row.lottery_id);
    if (stored.procesado && visible.processed === true) {
      visuals.clear(code);
      if (row.proc_state === "processed") return;
      const owned = ownedKeys;
      if (!owned.length || owned.every((k) => !clean(stored[k]))) return;
      const observed = Object.fromEntries(
        owned.map((k) => [k, clean(stored[k])]),
      );
      const signature = JSON.stringify([snap.date, row.lottery_id, observed]);
      if (acknowledged.has(signature)) return;
      const own = painted.get(code);
      const fromMango =
        own?.date === snap.date &&
        equalFields(own.fields, observed, Object.keys(own.fields));
      central.assert(snap);
      await api.post("/v1/mango/rows/ack", {
        lottery_id: row.lottery_id,
        draw_date: snap.date,
        observed_fields: observed,
        processed_origin: fromMango ? "userscript" : "manual",
        client_id: clientId,
        client_request_id: uid("proc"),
      });
      central.assert(snap);
      acknowledged.add(signature);
      operations.delete(row.row_key);
      return;
    }
    if (row.proc_state === "processed") {
      visuals.clear(code);
      mismatches.push(row.lottery_id);
      verified.delete(row.lottery_id);
      return;
    }
    if (stored.procesado || visible.processed !== false)
      return omit(row, code, { motivo: "fila_bloqueada" });
    const pending = operations.get(row.row_key);
    if (pending) {
      let fresh = true;
      try {
        assertReservation(row, pending);
      } catch {
        fresh = false;
        operations.delete(row.row_key);
        requestIds.delete(row.row_key);
      }
      if (fresh) {
        await present(row, code, snap, pending);
        return;
      }
    }
    const owned = names(row);
    const expected = row.expected_fields || {};
    if (!validExpected(expected)) {
      if (
        !Object.keys(expected).length &&
        (row.components || []).some((c) => c.state === "awaiting_result")
      )
        return;
      return omit(row, code, { motivo: "sin_campos_disponibles" });
    }
    const block = fillBlock(code, expected, snap);
    if (block) return omit(row, code, block);
    if (equalFields(visible.fields, expected, Object.keys(expected))) return;
    const before = { ...visible.fields };
    const requestId = requestIds.get(row.row_key) || uid("paint");
    requestIds.set(row.row_key, requestId);
    const response = await api.post("/v1/mango/rows/reconcile", {
      lottery_id: row.lottery_id,
      draw_date: snap.date,
      proc_state: "pending",
      revision: row.revision,
      observed_fields: Object.fromEntries(owned.map((k) => [k, before[k]])),
      client_id: clientId,
      client_request_id: requestId,
    });
    rememberReconcile(row, code, snap, response);
    central.assert(snap);
    const now = central.find(code);
    if (!now || !equalFields(before, now.fields) || central.isDirty?.(code))
      return omit(row, code, { motivo: "fila_cambio_durante_reserva" });
    if (!response.should_paint || response.action !== "paint_fields") {
      requestIds.delete(row.row_key);
      return omit(row, code, { motivo: "servicio_no_autoriza" });
    }
    operations.set(row.row_key, response);
    await present(row, code, snap, response);
  }
  async function cycle(rows, snap) {
    errors = [];
    mismatches = [];
    omitted = [];
    matched = 0;
    verified.clear();
    matchedCodes.clear();
    if (lastDate !== snap.date) {
      operations.clear();
      acknowledged.clear();
      painted.clear();
      requestIds.clear();
      reconciliations.clear();
      lastDate = snap.date;
    }
    if (lastEpoch !== snap.epoch) {
      operations.clear();
      requestIds.clear();
      lastEpoch = snap.epoch;
    }
    central.assert(snap);
    const matches = matchingRows(rows, snap);
    const matchedRows = new Set(matches.map((x) => x.row));
    for (const x of matches) matchedCodes.add(x.visible.code);
    for (const row of rows.filter((r) => r.draw_date === snap.date))
      if (!matchedRows.has(row))
        omit(row, null, { motivo: "sin_coincidencia_unica" });
    updateWaiting(matches, snap);
    for (const x of matches) {
      matched++;
      try {
        await process(x.row, x.visible.code, snap);
      } catch (e) {
        verified.delete(x.row.lottery_id);
        errors.push({ lottery: x.row.lottery_id, error: e.message });
        if (
          [
            "operation_expired",
            "operation_unavailable",
            "stale_revision",
            "client_lock_lost",
            "write_not_retained",
          ].includes(e.message)
        ) {
          operations.delete(x.row.row_key);
          requestIds.delete(x.row.row_key);
        }
        if (e.message === "context_changed" || e.status === 401) break;
      }
    }
  }
  return {
    cycle,
    syncVisuals,
    nativeIncidences: (snap) => {
      const sameContext = lastDate === snap.date && lastEpoch === snap.epoch;
      const list = (snap.incidences || []).filter(
        (x) => !sameContext || !matchedCodes.has(x.codigo),
      );
      return {
        incidencias_tabla_total: list.length,
        incidencias_tabla: list
          .slice(0, 20)
          .map((x) => ({ ...x, proposito: "carga", campos: [...x.campos] })),
      };
    },
    diagnostics: () => ({
      matched,
      filas_verificadas: verified.size,
      mismatches: [...mismatches],
      errors: [...errors],
      omitidas: omitted.map((x) => ({
        ...x,
        ...(x.campos ? { campos: [...x.campos] } : {}),
      })),
      conciliaciones: [...reconciliations.values()].map((x) => ({ ...x })),
    }),
  };
}
