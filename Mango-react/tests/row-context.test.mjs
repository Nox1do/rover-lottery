import test from "node:test";
import assert from "node:assert/strict";
import { checkRow } from "../src/row-context.js";
import { fields } from "../src/helpers.js";
const make = () => {
  const stored = {
    ...fields({ pick4: "6401", primera: "X", segunda: "X", tercera: "X" }),
    procesado: true,
  };
  const snap = {
    epoch: 2,
    date: "2026-10-27",
    server: "PRINCIPAL",
    serverId: "1",
    persisted: new Map([["RHOD-MD", stored]]),
    invalidRows: new Map(),
  };
  return {
    snap,
    code: "RHOD-MD",
    keys: ["pick4"],
    visible: {
      code: "RHOD-MD",
      processed: true,
      fields: { ...fields(stored), pick3: "XXX", primera: "XX" },
    },
    purpose: "ack",
  };
};
test("solo se comprueban campos propios o afectados; no confunde X con XX", () => {
  const x = make();
  assert.equal(checkRow(x).ok, true);
  assert.deepEqual(checkRow(x).proof.keys, ["pick4"]);
  x.keys = ["primera", "pick4"];
  assert.equal(checkRow(x).ok, false);
  assert.deepEqual(checkRow(x).campos, ["primera"]);
  assert.equal(checkRow(x).proposito, "ack");
});
test("identidad y PROC deben ser inequívocos en esa fila", () => {
  const x = make();
  for (const [invalid, reason] of [
    ["codigo_duplicado", "codigo_duplicado"],
    ["proc_desconocido", "proc_desconocido"],
  ]) {
    x.snap.invalidRows.set(x.code, invalid);
    assert.equal(checkRow(x).motivo, reason);
  }
  x.snap.invalidRows.clear();
  x.visible.processed = null;
  assert.equal(checkRow(x).motivo, "proc_distinto");
  x.visible = null;
  assert.equal(checkRow(x).motivo, "fila_no_visible");
});
test("edición ACK exige prueba previa del mismo contexto y campos; cero inicial importa", () => {
  const x = make();
  x.visible.fields.pick4 = "9999";
  x.localEvidence = "manual";
  assert.equal(checkRow(x).ok, false);
  x.previousProof = {
    epoch: 1,
    date: x.snap.date,
    server: "PRINCIPAL",
    serverId: "1",
    keys: ["pick4"],
    fields: fields(x.snap.persisted.get(x.code)),
    procesado: true,
  };
  assert.equal(checkRow(x).ok, true);
  x.previousProof.serverId = "2";
  assert.equal(checkRow(x).ok, false);
  x.previousProof.serverId = "1";
  x.previousProof.keys = ["pick3"];
  assert.equal(checkRow(x).ok, false);
  x.localEvidence = null;
  x.visible.fields.pick4 = "06401";
  assert.equal(checkRow(x).ok, false);
});
test("no amplía el alcance de una prueba parcial ni permite llenar trabajo manual", () => {
  const x = make();
  x.localEvidence = "manual";
  x.purpose = "fill";
  assert.equal(checkRow(x).motivo, "edicion_local");
  x.localEvidence = null;
  x.keys = [];
  assert.equal(checkRow(x).motivo, "sin_campos_administrados");
});
test("una prueba parcial justifica solo diferencias propias; campos nuevos coincidentes se prueban directamente", () => {
  const x = make();
  x.visible.fields.pick4 = "9999";
  x.keys = ["pick4", "segunda"];
  x.localEvidence = "own";
  x.previousProof = {
    epoch: 1,
    date: x.snap.date,
    server: x.snap.server,
    serverId: x.snap.serverId,
    keys: ["pick4"],
    fields: fields(x.snap.persisted.get(x.code)),
    procesado: true,
  };
  assert.equal(checkRow(x).ok, true);
  assert.deepEqual(checkRow(x).proof.keys, ["pick4", "segunda"]);
  x.visible.fields.segunda = "77";
  assert.equal(
    checkRow(x).ok,
    false,
    "un campo nuevo diferente sigue sin prueba",
  );
});
