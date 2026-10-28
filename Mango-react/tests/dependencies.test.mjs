import test from "node:test";
import assert from "node:assert/strict";
import { projectRule } from "../src/dependencies.js";

test("reglas nativas: constantes, copia y segmentos conservan ceros", () => {
  const source = {
    primera: "05",
    segunda: "01",
    tercera: "23",
    pick3: "005",
    pick4: "0123",
  };
  assert.deepEqual(
    projectRule({ primera: "p4:3-4", segunda: "X", tercera: "X" }, source),
    { primera: "23", segunda: "X", tercera: "X" },
  );
  assert.deepEqual(
    projectRule(
      {
        primera: "1ra",
        segunda: "2da",
        tercera: "3ra",
        pick3: "p3",
        pick4: "p4",
      },
      source,
    ),
    source,
  );
  assert.deepEqual(
    projectRule(
      { primera: "p3:1-2", segunda: "p3:2-3", pick3: "p4:1-3" },
      source,
    ),
    { primera: "00", segunda: "05", pick3: "012" },
  );
  assert.deepEqual(
    projectRule(
      {
        primera: "p4:1-2",
        segunda: "p4:2-3",
        tercera: "X",
        pick3: "p4:2-4",
        pick4: "",
      },
      source,
    ),
    { primera: "01", segunda: "12", tercera: "X", pick3: "123" },
  );
});
test("un pick pendiente genera vacío y constantes, sin inventar números", () => {
  assert.deepEqual(
    projectRule(
      { primera: "p4:3-4", segunda: "X", tercera: "X" },
      { pick3: "005", pick4: "" },
    ),
    { primera: "", segunda: "X", tercera: "X" },
  );
  assert.deepEqual(projectRule({ primera: "p4:1-2" }, { pick4: "0X23" }), {
    primera: "",
  });
});
test("reglas desconocidas o segmentos inválidos no permiten atribuir dependientes", () => {
  for (const value of ["otra_regla", "p4:4-1", "p3:3-4", "p4:0-2", 1])
    assert.equal(projectRule({ primera: value }, { pick4: "0123" }), null);
});
