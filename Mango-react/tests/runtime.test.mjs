import test from "node:test";
import assert from "node:assert/strict";
import { nextDelay } from "../src/polling.js";
import { createVisuals } from "../src/visuals.js";
test("poll adaptativo no sondea rápido filas agotadas ni procesadas", () => {
  assert.equal(
    nextDelay([
      { proc_state: "pending", components: [{ state: "awaiting_result" }] },
    ]),
    5000,
  );
  assert.equal(
    nextDelay([
      { proc_state: "processed", components: [{ state: "awaiting_result" }] },
    ]),
    120000,
  );
  assert.equal(
    nextDelay([
      { proc_state: "pending", components: [{ state: "exhausted" }] },
    ]),
    120000,
  );
});
test("azul pendiente se limpia al agotar y verde solo dura su plazo", async () => {
  let attr = null;
  const i = {
    dataset: {},
    setAttribute: (k, v) => {
      attr = v;
      i.dataset.mangoReactVisual = v;
    },
    removeAttribute: () => {
      attr = null;
      delete i.dataset.mangoReactVisual;
    },
  };
  const v = createVisuals({
    find: () => ({ processed: false, inputs: { primera: i } }),
  });
  v.paint("REAL", ["primera"], "blue");
  assert.equal(attr, "blue");
  v.clear("REAL", "blue");
  assert.equal(attr, null);
  v.paint("REAL", ["primera"], "green", 15);
  assert.equal(attr, "green");
  await new Promise((r) => setTimeout(r, 25));
  assert.equal(attr, null);
});
test("reponer azul libera inputs desmontados y conserva el plazo del verde", async () => {
  const input = () => ({
    isConnected: true,
    dataset: {},
    setAttribute(name, value) {
      this.dataset.mangoReactVisual = value;
    },
    removeAttribute() {
      delete this.dataset.mangoReactVisual;
    },
  });
  const old = input(),
    next = input(),
    green = input();
  let row = { processed: false, inputs: { primera: old, segunda: green } };
  const visuals = createVisuals({ find: () => row });
  visuals.paint("REAL", ["primera"], "blue");
  visuals.paint("REAL", ["segunda"], "green", 40);
  old.isConnected = false;
  row = { processed: false, inputs: { primera: next, segunda: green } };
  visuals.syncBlue([{ code: "REAL", names: ["primera", "segunda"] }]);
  assert.equal(old.dataset.mangoReactVisual, undefined);
  assert.equal(next.dataset.mangoReactVisual, "blue");
  assert.equal(green.dataset.mangoReactVisual, "green");
  visuals.syncBlue([{ code: "REAL", names: ["primera"] }]);
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(green.dataset.mangoReactVisual, undefined);
  assert.equal(next.dataset.mangoReactVisual, "blue");
  visuals.syncBlue([]);
  assert.equal(next.dataset.mangoReactVisual, undefined);
});

test("la cercanía del sorteo permite descubrir vigilancia aunque la caché esté procesada", () => {
  assert.equal(nextDelay([{ proc_state: "processed" }], true), 5000);
  assert.equal(nextDelay([{ proc_state: "processed" }], false), 120000);
});
test("verde remonta con su plazo original y no vuelve a empezar", (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1000 });
  const input = () => ({
    value: "05",
    isConnected: true,
    dataset: {},
    setAttribute(k, v) {
      this.dataset.mangoReactVisual = v;
    },
    removeAttribute() {
      delete this.dataset.mangoReactVisual;
    },
  });
  const old = input(),
    fresh = input();
  let row = { processed: false, inputs: { primera: old } };
  const v = createVisuals({ find: () => row });
  v.paint("REAL", ["primera"], "green", 2000);
  t.mock.timers.tick(500);
  old.isConnected = false;
  row = { processed: false, inputs: { primera: fresh } };
  v.syncBlue([]);
  assert.equal(fresh.dataset.mangoReactVisual, "green");
  t.mock.timers.tick(1499);
  assert.equal(fresh.dataset.mangoReactVisual, "green");
  t.mock.timers.tick(1);
  assert.equal(fresh.dataset.mangoReactVisual, undefined);
  v.syncBlue([]);
  assert.equal(fresh.dataset.mangoReactVisual, undefined);
});
test("verde no restaura números distintos, filas procesadas, trabajo manual ni contexto descartado", (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1000 });
  const input = () => ({
    value: "05",
    isConnected: true,
    dataset: {},
    setAttribute(k, v) {
      this.dataset.mangoReactVisual = v;
    },
    removeAttribute() {
      delete this.dataset.mangoReactVisual;
    },
  });
  for (const mode of ["value", "processed", "manual", "reset"]) {
    const old = input(),
      fresh = input();
    let dirty = false,
      row = { processed: false, inputs: { primera: old } };
    const v = createVisuals({ find: () => row, isDirty: () => dirty });
    v.paint("REAL", ["primera"], "green", 2000);
    old.isConnected = false;
    row = { processed: mode === "processed", inputs: { primera: fresh } };
    if (mode === "value") fresh.value = "99";
    if (mode === "manual") dirty = true;
    if (mode === "reset") v.clearAll();
    v.syncBlue([]);
    assert.equal(fresh.dataset.mangoReactVisual, undefined, mode);
    v.clearAll();
  }
});
test("ventana nativa usa hora RD, rechaza horarios inválidos y no adelanta mañana", async () => {
  const { isNearDraw } = await import("../src/polling.js");
  assert.equal(typeof isNearDraw, "function");
  const now = Date.parse("2026-10-29T12:57:00Z");
  assert.equal(isNearDraw("9:00 AM", now), true);
  assert.equal(isNearDraw("09:00", now - 1000), false);
  assert.equal(isNearDraw("09:00", Date.parse("2026-10-29T13:05:00Z")), true);
  assert.equal(isNearDraw("09:00", Date.parse("2026-10-29T13:06:00Z")), false);
  assert.equal(isNearDraw("13:00", Date.parse("2026-10-29T17:00:00Z")), true);
  for (const invalid of [
    "24:00",
    "13:00 PM",
    "00:00 AM",
    "9:99 AM",
    "sin hora",
  ])
    assert.equal(isNearDraw(invalid, now), false);
  assert.equal(
    isNearDraw("12:01 AM", Date.parse("2026-10-30T03:59:00Z")),
    false,
  );
});
test("el verde pertenece a una carga verificada y no se hereda al cambiar contexto", (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1000 });
  for (const change of [
    { epoch: 2 },
    { date: "2026-10-28" },
    { server: "OTRO" },
    { serverId: "2" },
  ]) {
    const input = () => ({
      value: "05",
      isConnected: true,
      dataset: {},
      setAttribute(k, v) {
        this.dataset.mangoReactVisual = v;
      },
      removeAttribute() {
        delete this.dataset.mangoReactVisual;
      },
    });
    const old = input(),
      fresh = input();
    let row = { processed: false, inputs: { primera: old } };
    const v = createVisuals({ find: () => row }),
      scope = {
        epoch: 1,
        date: "2026-10-27",
        server: "PRINCIPAL",
        serverId: "1",
      };
    v.setContext(scope);
    v.paint("REAL", ["primera"], "green", 2000);
    old.isConnected = false;
    row = { processed: false, inputs: { primera: fresh } };
    v.setContext({ ...scope });
    v.syncBlue([]);
    assert.equal(fresh.dataset.mangoReactVisual, "green");
    v.setContext({ ...scope, ...change });
    v.syncBlue([]);
    assert.equal(fresh.dataset.mangoReactVisual, undefined);
  }
});
