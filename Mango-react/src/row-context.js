import { FIELD_NAMES, equalFields, fields } from "./helpers.js";

// Pure verification: a native response is evidence, never a write permission by itself.
export function checkRow({
  snap,
  code,
  keys,
  visible,
  previousProof,
  localEvidence,
  purpose,
}) {
  const fail = (motivo, campos = []) => ({
    ok: false,
    motivo,
    codigo: code,
    campos,
    proposito: purpose,
  });
  if (snap.invalidRows?.has(code)) return fail(snap.invalidRows.get(code));
  const stored = snap.persisted.get(code);
  if (!stored) return fail("fila_no_verificada");
  if (!visible || visible.code !== code) return fail("fila_no_visible");
  if (
    typeof visible.processed !== "boolean" ||
    stored.procesado !== visible.processed
  )
    return fail("proc_distinto");
  if (!keys.length || keys.some((key) => !FIELD_NAMES.includes(key)))
    return fail("sin_campos_administrados");
  if (localEvidence === "manual" && ["fill", "dependency"].includes(purpose))
    return fail("edicion_local");
  const different = keys.filter(
    (key) => !equalFields(stored, visible.fields, [key]),
  );
  const knownLocal =
    localEvidence &&
    previousProof &&
    previousProof.date === snap.date &&
    previousProof.server === snap.server &&
    previousProof.serverId === snap.serverId &&
    different.every((key) => previousProof.keys.includes(key)) &&
    equalFields(previousProof.fields, stored, different);
  if (different.length && !knownLocal)
    return fail("campos_distintos", different);
  return {
    ok: true,
    stored,
    visible,
    proof: {
      epoch: snap.epoch,
      date: snap.date,
      server: snap.server,
      serverId: snap.serverId,
      keys: [...keys],
      fields: fields(stored),
      procesado: stored.procesado,
    },
  };
}
