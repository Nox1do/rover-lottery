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
test("diagnóstico distingue omisión local de reserva denegada sin exponer la respuesta completa", async () => {
  const local = setup({ edited: true });
  local.central.fillBlock = () => ({ motivo: "edicion_local" });
  await local.d.cycle([base()], local.snap);
  assert.deepEqual(local.d.diagnostics().omitidas, [
    { loteria: "real", codigo: "REAL", motivo: "edicion_local" },
  ]);
  assert.equal(local.calls.length, 0);

  const remote = setup();
  remote.api.post = async (path, body) => {
    remote.calls.push({ path, body });
    return {
      action: "wait",
      should_paint: false,
      reason: "row_locked",
      token: "private-service-token",
      operation: { client_id: "other-private-client" },
    };
  };
  await remote.d.cycle([base()], remote.snap);
  const diagnostic = remote.d.diagnostics();
  assert.deepEqual(diagnostic.omitidas, [
    { loteria: "real", codigo: "REAL", motivo: "servicio_no_autoriza" },
  ]);
  assert.equal(diagnostic.conciliaciones[0].accion, "wait");
  assert.equal(diagnostic.conciliaciones[0].motivo_servicio, "row_locked");
  assert.equal(diagnostic.conciliaciones[0].autoriza_llenado, false);
  assert.equal(diagnostic.conciliaciones[0].fecha, "2026-10-27");
  assert.ok(diagnostic.conciliaciones[0].consulta);
  assert.equal(remote.visible.fields.primera, "");
  assert.equal(remote.calls.length, 1);
  assert.ok(!JSON.stringify(diagnostic).includes("private"));
  assert.deepEqual(diagnostic.errors, []);
});
test("diagnóstico explica campos ausentes y coincidencias ambiguas antes de reservar", async () => {
  const r = setup();
  await r.d.cycle([{ ...base(), expected_fields: {} }], r.snap);
  assert.equal(r.d.diagnostics().omitidas[0].motivo, "sin_campos_disponibles");
  await r.d.cycle([base(), { ...base(), lottery_id: "other" }], r.snap);
  assert.equal(r.d.diagnostics().omitidas.length, 2);
  assert.ok(
    r.d
      .diagnostics()
      .omitidas.every((x) => x.motivo === "sin_coincidencia_unica"),
  );
  assert.equal(r.calls.length, 0);
});
test("conciliaciones diagnósticas conservan el último intento y limpian otra fecha", async () => {
  const r = setup();
  await r.d.cycle([base()], r.snap);
  await r.d.cycle([base()], r.snap);
  assert.equal(r.d.diagnostics().conciliaciones.length, 1);
  assert.equal(r.d.diagnostics().conciliaciones[0].autoriza_llenado, true);
  r.snap.date = "2026-10-28";
  await r.d.cycle([], r.snap);
  assert.deepEqual(r.d.diagnostics().conciliaciones, []);
  assert.deepEqual(r.d.diagnostics().omitidas, []);
});
test("resumen de conciliaciones reemplaza por lotería y retiene solo las 20 más recientes", async () => {
  const r = setup();
  const rows = Array.from({ length: 25 }, (_, i) => ({
    ...base(),
    lottery_id: `lottery${i}`,
    row_key: `row${i}`,
    name: `CODE${i}`,
    aliases: [`CODE${i}`],
  }));
  const visible = rows.map((_, i) => ({
    ...r.visible,
    code: `CODE${i}`,
    name: `CODE${i}`,
  }));
  r.central.rows = () => visible;
  r.central.find = (code) => visible.find((x) => x.code === code);
  for (const row of visible)
    r.snap.persisted.set(row.code, { procesado: false });
  let action = "wait";
  r.api.post = async () => ({ action, should_paint: false });
  await r.d.cycle(rows, r.snap);
  assert.deepEqual(
    r.d.diagnostics().conciliaciones.map((x) => x.loteria),
    [
      "lottery5",
      "lottery6",
      "lottery7",
      "lottery8",
      "lottery9",
      "lottery10",
      "lottery11",
      "lottery12",
      "lottery13",
      "lottery14",
      "lottery15",
      "lottery16",
      "lottery17",
      "lottery18",
      "lottery19",
      "lottery20",
      "lottery21",
      "lottery22",
      "lottery23",
      "lottery24",
    ],
  );
  action = "noop";
  await r.d.cycle([rows[5]], r.snap);
  const last = r.d.diagnostics().conciliaciones;
  assert.equal(last.length, 20);
  assert.equal(last.at(-1).loteria, "lottery5");
  assert.equal(last.at(-1).accion, "noop");
  assert.equal(last.filter((x) => x.loteria === "lottery5").length, 1);
  last.at(-1).accion = "changed_by_reader";
  assert.equal(r.d.diagnostics().conciliaciones.at(-1).accion, "noop");
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

test("ciclo por fila: A incompatible no reserva; B entrega; C hace ACK de persistidos", async () => {
  const calls = [];
  const rows = ["A", "B", "C"].map((code, i) => ({
    ...base(),
    lottery_id: code,
    row_key: code,
    name: code,
    aliases: [code],
    owned_fields: ["primera"],
    expected_fields: { primera: "05" },
    proc_state: "pending",
  }));
  const visible = rows.map((r, i) => ({
    code: r.name,
    name: r.name,
    processed: i === 2,
    fields: { primera: i === 2 ? "99" : "" },
  }));
  const snap = {
    epoch: 1,
    date: "2026-10-27",
    server: "PRINCIPAL",
    persisted: new Map(
      visible.map((r) => [
        r.code,
        { procesado: r.processed, primera: r.processed ? "05" : "" },
      ]),
    ),
  };
  const central = {
    assert() {},
    rows: () => visible,
    find: (code) => visible.find((r) => r.code === code),
    rowBlock: (code) =>
      code === "A" ? { motivo: "campos_distintos", campos: ["primera"] } : null,
    canFill: () => true,
    fill: async (code, f) => {
      Object.assign(central.find(code).fields, f);
      return true;
    },
    isDirty: () => false,
  };
  const api = {
    post: async (path, body) => {
      calls.push({ path, body });
      return path.endsWith("reconcile")
        ? {
            action: "paint_fields",
            should_paint: true,
            expected_fields: { primera: "05" },
            operation: {
              operation_id: "op-" + body.lottery_id,
              status: "reserved",
              revision: 2,
              expires_at: new Date(Date.now() + 60000).toISOString(),
            },
          }
        : { ok: true };
    },
  };
  const d = createDelivery({ central, api, clientId: "pc-test" });
  await d.cycle(rows, snap);
  assert.deepEqual(
    calls.map((c) => c.body.lottery_id || c.body.operation_id),
    ["B", "op-B", "C"],
  );
  assert.equal(calls[2].body.observed_fields.primera, "05");
  assert.equal(d.diagnostics().omitidas[0].loteria, "A");
  assert.equal(d.diagnostics().filas_verificadas, 2);
});
test("ACK sin campos propios identificados se omite sin inferir todos los inputs", async () => {
  const r = setup({ processed: true });
  const apiRow = { ...base(), owned_fields: [], expected_fields: {} };
  await r.d.cycle([apiRow], r.snap);
  assert.equal(r.calls.length, 0);
  assert.equal(
    r.d.diagnostics().omitidas[0].motivo,
    "sin_campos_administrados",
  );
});
test("diagnóstico local copia campos y separa incidencias nativas de filas Mango", async () => {
  const r = setup();
  r.central.rowBlock = () => ({
    motivo: "campos_distintos",
    campos: ["primera"],
  });
  r.snap.incidences = [
    { codigo: "REAL", motivo: "campos_distintos", campos: ["primera"] },
    ...Array.from({ length: 25 }, (_, i) => ({
      codigo: "OTHER" + i,
      motivo: "campos_distintos",
      campos: ["pick4"],
    })),
  ];
  await r.d.cycle([base()], r.snap);
  const d = r.d.diagnostics();
  d.omitidas[0].campos.push("pick4");
  assert.deepEqual(r.d.diagnostics().omitidas[0].campos, ["primera"]);
  const native = r.d.nativeIncidences(r.snap);
  assert.equal(native.incidencias_tabla_total, 25);
  assert.equal(native.incidencias_tabla.length, 20);
  native.incidencias_tabla[0].campos.push("primera");
  assert.deepEqual(r.d.nativeIncidences(r.snap).incidencias_tabla[0].campos, [
    "pick4",
  ]);
});
