export function nextDelay(rows) {
  return rows.some(
    (r) =>
      r.proc_state !== "processed" &&
      (r.components || []).some((c) =>
        ["awaiting_result", "ready"].includes(c.state),
      ),
  )
    ? 5000
    : 120000;
}
