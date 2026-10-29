import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDate,
  todayInZone,
  fields,
  normalizeLabel,
} from "../src/helpers.js";
import { createContext } from "../src/context.js";
import { installNativeObserver } from "../src/native.js";
const day = "2026-10-27",
  blank = () => fields({});
const row = (v = {}) => ({
  abrev: "REAL",
  nombre: "REAL",
  procesado: false,
  ...blank(),
  ...v,
});
function setup() {
  let time = 1000;
  const c = createContext({ today: () => day, now: () => time });
  const view = {
    active: true,
    selectedDate: day,
    server: "PRINCIPAL",
    busy: false,
    dialog: false,
    readOnly: false,
    rows: [{ code: "REAL", fields: blank(), processed: false }],
  };
  return {
    c,
    view,
    advance: () => (time += 200),
    load(data = { fecha: "10/27/2026", filas: [row()] }) {
      let id = c.begin({ date: day, server: "PRINCIPAL", serverId: "1" });
      c.finish(id, data);
      time += 200;
      c.sync(view);
      return id;
    },
  };
}
test("fechas explícitas válidas y zona operativa independiente de PC", () => {
  assert.equal(parseDate("27 oct 2026"), day);
  assert.equal(parseDate("10/27/2026"), day);
  assert.equal(parseDate("31 feb 2026"), null);
  assert.equal(parseDate("ayer"), null);
  assert.equal(todayInZone(new Date("2026-10-28T02:00:00Z")), day);
  assert.equal(normalizeLabel("Lotéka AM"), "LOTEKA AM");
});
test("solo confirma carga fresca cuyo DOM coincide con persistencia", () => {
  const { c, view, load } = setup();
  assert.equal(c.snapshot(view), null);
  load();
  assert.equal(c.snapshot(view).date, day);
});
test("contexto verificado usa conteo sin releer campos; una carga nueva compara valores", () => {
  const { c, view, load } = setup();
  load();
  const rows = view.rows;
  let reads = 0;
  view.rowCount = 1;
  Object.defineProperty(view, "rows", {
    get() {
      reads++;
      return rows;
    },
  });
  assert.equal(c.snapshot(view).date, day);
  assert.equal(
    reads,
    0,
    "el guard de contexto estable no relee todos los valores",
  );
  rows[0].fields.primera = "99";
  load({ fecha: day, filas: [row({ primera: "05" })] });
  assert.equal(
    c.snapshot(view).verifiedRows.has("REAL"),
    false,
    "el contexto general no prueba los campos de una fila",
  );
  assert.ok(reads > 0);
  rows[0].fields.primera = "05";
  assert.equal(c.snapshot(view).date, day);
});
for (const code of [" BRAZIL03PM ", "BRAZIL03PM\t", "\u00a0BRAZIL03PM\u00a0"])
  test(`código con espacios exteriores conserva identidad: ${JSON.stringify(code)}`, () => {
    const { c, view, load } = setup();
    view.rows[0] = {
      code: "BRAZIL03PM",
      fields: fields({ primera: "05" }),
      processed: true,
    };
    const incoming = row({ abrev: code, procesado: true, primera: "05" });
    load({ fecha: day, filas: [incoming] });
    const snap = c.snapshot(view);
    assert.equal(snap?.date, day);
    assert.equal(snap.persisted.get("BRAZIL03PM").primera, "05");
    assert.equal(snap.persisted.size, 1);
    assert.equal(incoming.abrev, code, "no modifica la respuesta original");
  });
test("códigos que colisionan al recortar espacios bloquean solo esa fila", () => {
  const { c, view, load } = setup();
  load({ fecha: day, filas: [row(), row({ abrev: " REAL " })] });
  assert.equal(c.snapshot(view).invalidRows.get("REAL"), "codigo_duplicado");
  assert.equal(c.snapshot(view).verifiedRows.size, 0);
});
test("recortar espacios no equipara códigos con diferencias internas", () => {
  const { c, view, load } = setup();
  view.rows[0].code = "BRAZIL03PM";
  load({ fecha: day, filas: [row({ abrev: " BRAZIL 03PM " })] });
  assert.equal(c.snapshot(view).verifiedRows.has("BRAZIL03PM"), false);
});
test("edición local conserva persistencia al cambiar solo el relleno del código", () => {
  const { c, view, load } = setup();
  view.rows[0].fields = fields({ primera: "05" });
  load({ fecha: day, filas: [row({ abrev: " REAL ", primera: "05" })] });
  assert.ok(c.snapshot(view));
  view.rows[0].fields.primera = "98";
  view.rows[0].dirty = true;
  c.prepareSearch(view);
  load({ fecha: day, filas: [row({ primera: "05" })] });
  assert.equal(c.snapshot(view).persisted.get("REAL").primera, "05");
  assert.equal(view.rows[0].fields.primera, "98");
});
test("contexto general identifica la fila incompatible sin acreditarla", () => {
  const { c, view, load } = setup();
  view.rows[0].code = "DESCONOCIDA";
  load();
  assert.equal(c.snapshot(view).verifiedRows.has("DESCONOCIDA"), false);
  assert.equal(c.snapshot(view).incidences[0].codigo, "DESCONOCIDA");
});
test("ignora carga anterior al último request y no recupera después de error", () => {
  const { c, view, advance } = setup();
  const a = c.begin({ date: day, server: "PRINCIPAL" }),
    b = c.begin({ date: day, server: "PRINCIPAL" });
  c.finish(a, { fecha: "10/27/2026", filas: [row()] });
  advance();
  assert.equal(c.snapshot(view), null);
  c.fail(b);
  c.finish(b, { fecha: "10/27/2026", filas: [row()] });
  assert.equal(c.snapshot(view), null);
});
test("ayer y selección nueva con tabla vieja jamás confirman", () => {
  const { c, view, load } = setup();
  load({
    fecha: "10/26/2026",
    filas: [row({ procesado: true, primera: "99" })],
  });
  assert.equal(c.snapshot(view), null);
  load();
  view.selectedDate = "2026-10-26";
  assert.equal(c.snapshot(view), null);
  view.selectedDate = day;
  assert.equal(c.snapshot(view), null, "volver requiere nueva carga");
});
test("servidor, ruta y permisos invalidan y no se reactivan con DOM viejo", () => {
  for (const change of [
    { server: "SEGUNDO" },
    { active: false },
    { readOnly: true },
  ]) {
    const { c, view, load } = setup();
    load();
    const snap = c.snapshot(view);
    Object.assign(view, change);
    assert.equal(c.snapshot(view), null);
    assert.throws(() => c.assert(snap, view));
  }
});
test("PROC con edición conserva números persistidos para ACK", () => {
  const { c, view, load } = setup();
  view.rows[0] = {
    code: "REAL",
    fields: fields({ primera: "05" }),
    processed: true,
  };
  load({
    fecha: "10/27/2026",
    filas: [row({ procesado: true, primera: "05" })],
  });
  view.rows[0].fields.primera = "98";
  const snap = c.snapshot(view);
  assert.equal(snap.persisted.get("REAL").primera, "05");
  assert.equal(snap.persisted.get("REAL").procesado, true);
});
test("DOM transitorio nuevo PROC con valores de día viejo no acredita la fila", () => {
  const { c, view, load } = setup();
  view.rows[0].fields.primera = "99";
  view.rows[0].processed = true;
  load({
    fecha: "10/27/2026",
    filas: [row({ procesado: true, primera: "05" })],
  });
  assert.equal(c.snapshot(view).verifiedRows.has("REAL"), false);
});
test("diálogo y carga bloquean efectos mientras permanecen abiertos", () => {
  const { c, view, load } = setup();
  load();
  view.dialog = true;
  assert.equal(c.snapshot(view), null);
  view.dialog = false;
  assert.ok(c.snapshot(view));
  view.busy = true;
  assert.equal(c.snapshot(view), null);
});
test("observador no altera promesa, argumentos, respuesta ni otras peticiones", async () => {
  const calls = [],
    events = [];
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  const w = {
    location: { href: "https://central.roversport.net/loteria/resultados/ver" },
    fetch(...args) {
      calls.push(args);
      return promise;
    },
  };
  installNativeObserver(
    w,
    (fn) => fn,
    (e) => events.push(e),
  );
  const args = [
    "/api/loteria/resultadosLoteria2",
    {
      method: "POST",
      headers: { "X-Servidor": "1" },
      body: '{"fecha":"10/27/2026"}',
    },
  ];
  const p = w.fetch(...args);
  assert.equal(p, promise);
  assert.deepEqual(calls[0], args);
  assert.equal(events[0].type, "start");
  resolve(
    new Response(JSON.stringify({ fecha: "10/27/2026", filas: [row()] })),
  );
  await p;
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(events[1].type, "success");
  assert.equal(
    await (await p).text(),
    JSON.stringify({ fecha: "10/27/2026", filas: [row()] }),
  );
  const n = events.length;
  w.fetch("/api/unrelated");
  assert.equal(events.length, n);
});
test("respuesta nativa fallida o JSON inválido informa fallo", async () => {
  for (const response of [
    new Response("{}", { status: 500 }),
    new Response("invalid"),
  ]) {
    const events = [];
    const w = {
      location: { href: "https://central.roversport.net/" },
      fetch: () => Promise.resolve(response),
    };
    installNativeObserver(
      w,
      (f) => f,
      (e) => events.push(e),
    );
    await w.fetch("/api/loteria/resultadosLoteria2", {
      method: "POST",
      body: '{"fecha":"10/27/2026"}',
    });
    await new Promise((r) => setTimeout(r, 15));
    assert.equal(events.at(-1).type, "failure");
  }
});

test("copia respuesta antes del consumidor aun cuando la promesa viene de otro contexto", async () => {
  const { runInNewContext } = await import("node:vm");
  const events = [];
  const response = new Response('{"fecha":"10/27/2026","filas":[]}');
  const foreignPromise = runInNewContext("Promise.resolve(response)", {
    response,
  });
  const w = {
    location: { href: "https://central.roversport.net/" },
    fetch: () => foreignPromise,
  };
  installNativeObserver(
    w,
    (f) => f,
    (e) => events.push(e),
  );
  const p = w.fetch("/api/loteria/resultadosLoteria2", {
    method: "POST",
    body: '{"fecha":"10/27/2026"}',
  });
  assert.equal(p, foreignPromise);
  assert.equal(
    await p.then((r) => r.text()),
    '{"fecha":"10/27/2026","filas":[]}',
  );
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(events.at(-1).type, "success");
});

test("Buscar suspende efectos y conserva baseline para edición local del mismo contexto", () => {
  const { c, view, load, advance } = setup();
  view.rows[0] = {
    code: "REAL",
    fields: fields({ primera: "05" }),
    processed: true,
  };
  load({
    fecha: "10/27/2026",
    filas: [row({ procesado: true, primera: "05" })],
  });
  const old = c.snapshot(view);
  view.rows[0].fields.primera = "98";
  view.rows[0].dirty = true;
  assert.equal(typeof c.prepareSearch, "function");
  c.prepareSearch(view);
  assert.equal(c.snapshot(view), null);
  assert.throws(() => c.assert(old, view));
  const id = c.begin({ date: day, server: "PRINCIPAL", serverId: "1" });
  c.finish(id, {
    fecha: "10/27/2026",
    filas: [row({ procesado: true, primera: "05" })],
  });
  advance();
  assert.equal(c.snapshot(view).persisted.get("REAL").primera, "05");
});
test("suspensión de configuración mantiene el motivo y exige otra respuesta para conservar edición conocida", () => {
  const { c, view, load } = setup();
  load();
  const previous = c.snapshot(view);
  view.rows[0].fields.primera = "99";
  view.rows[0].dirty = true;
  c.prepareSearch(view, "Configuración actualizada. Pulsa Buscar.");
  assert.equal(c.message, "Configuración actualizada. Pulsa Buscar.");
  assert.equal(c.snapshot(view), null);
  assert.throws(() => c.assert(previous, view));
  load();
  assert.equal(c.snapshot(view).persisted.get("REAL").primera, "");
  assert.equal(view.rows[0].fields.primera, "99");
});
for (const mode of ["unverified", "changed_values", "server_id"])
  test(`suspensión no acredita edición incierta: ${mode}`, () => {
    const { c, view, load, advance } = setup();
    if (mode !== "unverified") load();
    view.rows[0].fields.primera = "99";
    view.rows[0].dirty = true;
    c.prepareSearch(view, "Reinicio");
    const id = c.begin({
      date: day,
      server: "PRINCIPAL",
      serverId: mode === "server_id" ? "2" : "1",
    });
    c.finish(id, {
      fecha: day,
      filas: [row(mode === "changed_values" ? { primera: "42" } : {})],
    });
    advance();
    assert.equal(c.snapshot(view).verifiedRows.has("REAL"), false);
  });
test("baseline conservado no permite reusar edición de otra fecha o tras fallo", () => {
  const { c, view, load } = setup();
  load();
  assert.equal(typeof c.prepareSearch, "function");
  c.prepareSearch(view);
  view.selectedDate = "2026-10-26";
  c.sync(view);
  view.selectedDate = day;
  assert.equal(c.snapshot(view), null);
});

test("reintento de Buscar después de fallo conserva edición pero exige respuesta nueva", () => {
  const { c, view, load, advance } = setup();
  view.rows[0] = {
    code: "REAL",
    fields: fields({ primera: "05" }),
    processed: true,
  };
  load({
    fecha: "10/27/2026",
    filas: [row({ procesado: true, primera: "05" })],
  });
  view.rows[0].fields.primera = "98";
  view.rows[0].dirty = true;
  c.prepareSearch(view);
  const failed = c.begin({ date: day, server: "PRINCIPAL", serverId: "1" });
  c.fail(failed);
  assert.equal(c.snapshot(view), null);
  c.prepareSearch(view);
  const fresh = c.begin({ date: day, server: "PRINCIPAL", serverId: "1" });
  c.finish(fresh, {
    fecha: "10/27/2026",
    filas: [row({ procesado: true, primera: "05" })],
  });
  advance();
  assert.ok(c.snapshot(view));
});

test("RHOD-MD incompatible no bloquea contexto ni acredita esa fila", () => {
  const { c, view, load } = setup();
  view.rows.push({
    code: "RHOD-MD",
    fields: fields({ primera: "XX", pick4: "6401" }),
    processed: true,
  });
  load({
    fecha: day,
    filas: [
      row(),
      row({ abrev: "RHOD-MD", procesado: true, primera: "X", pick4: "6401" }),
    ],
  });
  const snap = c.snapshot(view);
  assert.ok(snap, "la diferencia ajena es local");
  assert.ok(snap.verifiedRows.has("REAL"));
  assert.equal(snap.verifiedRows.has("RHOD-MD"), false);
  assert.equal(
    snap.incidences.find((x) => x.codigo === "RHOD-MD").motivo,
    "campos_distintos",
  );
});
test("código nativo duplicado se aísla y una prueba vieja no se registra", () => {
  const { c, view, load } = setup();
  load({
    fecha: day,
    filas: [row(), row({ abrev: "RHOD-MD" }), row({ abrev: " RHOD-MD " })],
  });
  const snap = c.snapshot(view);
  assert.ok(snap);
  assert.equal(snap.invalidRows.get("RHOD-MD"), "codigo_duplicado");
  assert.ok(snap.verifiedRows.has("REAL"));
  const proof = snap.verifiedRows.get("REAL");
  c.prepareSearch(view);
  assert.throws(() => c.recordProof("REAL", proof, snap), /context_changed/);
});
test("una fila nunca verificada no hereda baseline tras reinicio", () => {
  const { c, view, load } = setup();
  view.rows[0].fields.primera = "99";
  load();
  assert.ok(c.snapshot(view));
  assert.equal(c.snapshot(view).verifiedRows.size, 0);
  view.rows[0].dirty = true;
  c.prepareSearch(view);
  load();
  assert.equal(c.snapshot(view).verifiedRows.size, 0);
});
test("la tabla puede montarse después de comenzar la primera petición", () => {
  const { c, view, load, advance } = setup();
  view.tableReady = false;
  load();
  assert.equal(c.snapshot(view), null);
  view.tableReady = true;
  advance();
  assert.ok(c.snapshot(view));
});

test("filtro vacío conserva contexto probado pero una carga inicial vacía no lo acredita", () => {
  const { c, view, load } = setup();
  load();
  const snap = c.snapshot(view);
  view.rows = [];
  view.rowCount = 0;
  assert.equal(c.snapshot(view), snap);
  c.assert(snap, view);
  const other = setup();
  other.view.rows = [];
  other.view.rowCount = 0;
  other.load();
  assert.equal(other.c.snapshot(other.view), null);
});
