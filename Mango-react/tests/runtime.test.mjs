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
  const v = createVisuals({ find: () => ({ inputs: { primera: i } }) });
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
  let row = { inputs: { primera: old, segunda: green } };
  const visuals = createVisuals({ find: () => row });
  visuals.paint("REAL", ["primera"], "blue");
  visuals.paint("REAL", ["segunda"], "green", 40);
  old.isConnected = false;
  row = { inputs: { primera: next, segunda: green } };
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
