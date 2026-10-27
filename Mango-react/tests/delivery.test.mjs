import test from "node:test";
import assert from "node:assert/strict";
import { createDelivery } from "../src/delivery.js";
import { createApi } from "../src/api.js";
const base = () => ({
  row_key: "real|2026-10-27",
  lottery_id: "real",
  name: "REAL",
  aliases: ["REAL"],
  draw_date: "2026-10-27",
  revision: 2,
  proc_state: "pending",
  owned_fields: ["primera", "segunda", "tercera"],
  expected_fields: { primera: "05", segunda: "00", tercera: "09" },
  components: [
    {
      state: "ready",
      expected_fields: { primera: "05", segunda: "00", tercera: "09" },
    },
  ],
  visual: { state: null },
});
function setup({ processed = false, edited = false } = {}) {
  const calls = [],
    visible = {
      code: "REAL",
      name: "REAL",
      processed,
      fields: {
        primera: edited ? "98" : processed ? "05" : "",
        segunda: processed ? "00" : "",
        tercera: processed ? "09" : "",
        pick3: "",
        pick4: "",
      },
    };
  let valid = true;
  let snap = {
    epoch: 1,
    date: "2026-10-27",
    server: "PRINCIPAL",
    persisted: new Map([
      [
        "REAL",
        {
          procesado: processed,
          primera: processed ? "05" : "",
          segunda: processed ? "00" : "",
          tercera: processed ? "09" : "",
          pick3: "",
          pick4: "",
        },
      ],
    ]),
  };
  const central = {
    rows: () => [visible],
    find: () => visible,
    assert: (s) => {
      if (!valid || s !== snap) throw Error("context_changed");
    },
    canFill: () => !edited,
    fill: async (code, f) => {
      Object.assign(visible.fields, f);
      return true;
    },
    isDirty: () => edited,
  };
  const api = {
    async post(path, body) {
      calls.push({ path, body });
      if (path.endsWith("reconcile"))
        return {
          action: "paint_fields",
          should_paint: true,
          expected_fields: base().expected_fields,
          operation: {
            operation_id: "op1",
            revision: 2,
            status: "reserved",
            expires_at: new Date(Date.now() + 60000).toISOString(),
          },
        };
      return { ok: true };
    },
  };
  const d = createDelivery({ central, api, clientId: "pc-test" });
  return {
    d,
    central,
    api,
    calls,
    get snap() {
      return snap;
    },
    newContext: () => {
      snap = { ...snap, epoch: snap.epoch + 1 };
    },
    visible,
    invalidate: () => (valid = false),
  };
}
test("reserva, llena, verifica y reporta presented con valores y revisión de operación", async () => {
  const r = setup();
  await r.d.cycle([base()], r.snap);
  assert.deepEqual(r.visible.fields, {
    primera: "05",
    segunda: "00",
    tercera: "09",
    pick3: "",
    pick4: "",
  });
  assert.deepEqual(
    r.calls.map((x) => x.path),
    ["/v1/mango/rows/reconcile", "/v1/mango/rows/presented"],
  );
  assert.equal(r.calls[1].body.revision, 2);
  assert.equal(r.calls[1].body.operation_id, "op1");
});
test("ACK manual usa persistidos aunque haya una edición diferente sin guardar", async () => {
  const r = setup({ processed: true, edited: true });
  const apiRow = base();
  apiRow.expected_fields = {};
  apiRow.components = [{ state: "awaiting_result", expected_fields: {} }];
  await r.d.cycle([apiRow], r.snap);
  assert.equal(r.calls.length, 1);
  assert.equal(r.calls[0].path, "/v1/mango/rows/ack");
  assert.deepEqual(r.calls[0].body.observed_fields, {
    primera: "05",
    segunda: "00",
    tercera: "09",
  });
  assert.equal(r.calls[0].body.processed_origin, "manual");
});
test("API procesado/Central pendiente se diagnostica sin borrar ni rellenar", async () => {
  const r = setup();
  await r.d.cycle([{ ...base(), proc_state: "processed" }], r.snap);
  assert.equal(r.calls.length, 0);
  assert.equal(r.d.diagnostics().mismatches[0], "real");
  assert.equal(r.visible.fields.primera, "");
});
test("intervención manual o fuente incierta bloquean petición de reserva", async () => {
  const r = setup({ edited: true });
  await r.d.cycle([base()], r.snap);
  assert.equal(r.calls.length, 0);
});
test("cambio de contexto durante reserva no escribe ni presenta", async () => {
  const r = setup();
  r.api.post = async (path, body) => {
    r.calls.push({ path, body });
    r.invalidate();
    return {
      action: "paint_fields",
      should_paint: true,
      expected_fields: base().expected_fields,
      operation: {
        operation_id: "op1",
        revision: 2,
        status: "reserved",
        expires_at: new Date(Date.now() + 60000).toISOString(),
      },
    };
  };
  await r.d.cycle([base()], r.snap);
  assert.equal(r.calls.length, 1);
  assert.equal(r.visible.fields.primera, "");
});
test("React rechaza escritura: jamás reporta presented", async () => {
  const r = setup();
  r.central.fill = async () => false;
  await r.d.cycle([base()], r.snap);
  assert.equal(r.calls.length, 1);
  assert.equal(r.d.diagnostics().errors[0].error, "write_not_retained");
});
test("colisión de alias entre filas API no rellena dos veces una fila Central", async () => {
  const r = setup();
  await r.d.cycle(
    [base(), { ...base(), lottery_id: "other", row_key: "other|2026-10-27" }],
    r.snap,
  );
  assert.equal(r.calls.length, 0);
});
test("fallo presented reintenta la misma operación sin volver a escribir", async () => {
  const r = setup();
  const original = r.api.post;
  let fail = true,
    writes = 0;
  const fill = r.central.fill;
  r.central.fill = async (...a) => {
    writes++;
    return fill(...a);
  };
  r.api.post = async (path, b) => {
    if (path.endsWith("presented") && fail) {
      fail = false;
      throw Error("network_error");
    }
    return original(path, b);
  };
  await r.d.cycle([base()], r.snap);
  await r.d.cycle([base()], r.snap);
  assert.equal(writes, 1);
  assert.equal(r.calls.filter((x) => x.path.endsWith("reconcile")).length, 1);
  assert.equal(r.calls.at(-1).body.operation_id, "op1");
});
test("API no expone token y falla cerrado ante 401/JSON inválido", async () => {
  let options;
  const api = createApi({
    getToken: () => "private-token",
    request: (o) => {
      options = o;
      queueMicrotask(() =>
        o.onload({ status: 401, responseText: '{"error":"unauthorized"}' }),
      );
    },
  });
  await assert.rejects(
    () => api.get("/v1/mango/rows?date=2026-10-27", true),
    /unauthorized/,
  );
  assert.equal(options.headers.Authorization, "Bearer private-token");
  assert.ok(!JSON.stringify(api).includes("private-token"));
});

test("fila API de otra fecha no puede llenar ni confirmar para hoy", async () => {
  const r = setup();
  await r.d.cycle([{ ...base(), draw_date: "2026-10-26" }], r.snap);
  assert.equal(r.calls.length, 0);
  assert.equal(r.visible.fields.primera, "");
});

for (const mode of ["revision", "expiry", "context"])
  test(`descarta reserva anterior a ${mode} antes de volver a escribir`, async () => {
    const r = setup();
    let attempt = 0,
      current = base(),
      first;
    const writes = [];
    r.api.post = async (path, body) => {
      r.calls.push({ path, body });
      if (path.endsWith("reconcile")) {
        const response = {
          action: "paint_fields",
          should_paint: true,
          expected_fields: { ...current.expected_fields },
          operation: {
            operation_id: ++attempt === 1 ? "old-op" : "fresh-op",
            revision: current.revision,
            status: "reserved",
            expires_at: new Date(Date.now() + 60000).toISOString(),
          },
        };
        if (attempt === 1) first = response;
        return response;
      }
      return { ok: true };
    };
    r.central.fill = async (code, expected) => {
      writes.push({ ...expected });
      if (writes.length === 1) return false;
      Object.assign(r.visible.fields, expected);
      return true;
    };
    await r.d.cycle([current], r.snap);
    if (mode === "revision")
      current = {
        ...current,
        revision: 3,
        expected_fields: { primera: "99", segunda: "00", tercera: "09" },
      };
    if (mode === "expiry")
      first.operation.expires_at = new Date(Date.now() - 1000).toISOString();
    if (mode === "context") r.newContext();
    await r.d.cycle([current], r.snap);
    assert.equal(r.calls.filter((x) => x.path.endsWith("reconcile")).length, 2);
    assert.equal(
      r.calls.find((x) => x.path.endsWith("presented")).body.operation_id,
      "fresh-op",
    );
    assert.equal(r.visible.fields.primera, mode === "revision" ? "99" : "05");
  });
