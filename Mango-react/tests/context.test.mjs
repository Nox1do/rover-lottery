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
test("DOM transitorio nuevo PROC con valores de día viejo bloquea", () => {
  const { c, view, load } = setup();
  view.rows[0].fields.primera = "99";
  view.rows[0].processed = true;
  load({
    fecha: "10/27/2026",
    filas: [row({ procesado: true, primera: "05" })],
  });
  assert.equal(c.snapshot(view), null);
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
