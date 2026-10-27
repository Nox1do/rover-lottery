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
