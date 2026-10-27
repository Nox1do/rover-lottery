import {
  FIELD_NAMES,
  normalizeLabel,
  equalFields,
  clean,
  uid,
  validExpected,
} from "./helpers.js";
export function createDelivery({
  central,
  api,
  clientId,
  visuals = { paint() {}, clear() {} },
}) {
  const operations = new Map(),
    acknowledged = new Set(),
    painted = new Map(),
    requestIds = new Map();
  let errors = [],
    mismatches = [],
    matched = 0,
    lastDate = null,
    lastEpoch = null;
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
    if (central.isDirty?.(code)) return false;
    const current = central.find(code);
    if (!current || current.processed !== false) return false;
    if (!equalFields(current.fields, expected, Object.keys(expected))) {
      if (!central.canFill(code, expected, snap)) return false;
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
    if (!stored || !visible) return;
    if (stored.procesado && visible.processed === true) {
      visuals.clear(code);
      if (row.proc_state === "processed") return;
      let owned = names(row);
      if (!owned.length) owned = FIELD_NAMES.filter((k) => clean(stored[k]));
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
      return;
    }
    if (stored.procesado || visible.processed !== false) return;
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
    if (row.visual?.state === "blue")
      visuals.paint(
        code,
        owned.filter((k) => !visible.fields[k]),
        "blue",
      );
    else visuals.clear(code, "blue");
    const expected = row.expected_fields || {};
    if (!validExpected(expected) || !central.canFill(code, expected, snap))
      return;
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
    central.assert(snap);
    const now = central.find(code);
    if (!now || !equalFields(before, now.fields) || central.isDirty?.(code))
      return;
    if (!response.should_paint || response.action !== "paint_fields") {
      requestIds.delete(row.row_key);
      return;
    }
    operations.set(row.row_key, response);
    await present(row, code, snap, response);
  }
  async function cycle(rows, snap) {
    errors = [];
    mismatches = [];
    matched = 0;
    if (lastDate !== snap.date) {
      operations.clear();
      acknowledged.clear();
      painted.clear();
      requestIds.clear();
      lastDate = snap.date;
    }
    if (lastEpoch !== snap.epoch) {
      operations.clear();
      requestIds.clear();
      lastEpoch = snap.epoch;
    }
    const visible = central.rows(),
      matches = rows
        .filter((row) => row.draw_date === snap.date)
        .map((row) => ({ row, visible: match(row, visible) }));
    const counts = new Map();
    for (const x of matches)
      if (x.visible)
        counts.set(x.visible.code, (counts.get(x.visible.code) || 0) + 1);
    for (const x of matches) {
      if (!x.visible || counts.get(x.visible.code) !== 1) continue;
      matched++;
      try {
        await process(x.row, x.visible.code, snap);
      } catch (e) {
        errors.push({ lottery: x.row.lottery_id, error: e.message });
        if (
          [
            "operation_expired",
            "operation_unavailable",
            "stale_revision",
            "client_lock_lost",
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
    diagnostics: () => ({
      matched,
      mismatches: [...mismatches],
      errors: [...errors],
    }),
  };
}
