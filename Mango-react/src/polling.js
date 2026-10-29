export function nextDelay(rows, nearDraw = false) {
  return nearDraw ||
    rows.some(
      (r) =>
        r.proc_state !== "processed" &&
        (r.components || []).some((c) =>
          ["awaiting_result", "ready"].includes(c.state),
        ),
    )
    ? 5000
    : 120000;
}

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Santo_Domingo",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
export function isNearDraw(value, now = Date.now()) {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i.exec(
    String(value ?? "").trim(),
  );
  if (!match) return false;
  let hour = Number(match[1]);
  const minute = Number(match[2]),
    second = Number(match[3] || 0),
    ampm = match[4]?.toUpperCase();
  if (minute > 59 || second > 59 || (ampm ? hour < 1 || hour > 12 : hour > 23))
    return false;
  if (ampm) hour = (hour % 12) + (ampm === "PM" ? 12 : 0);
  const parts = Object.fromEntries(
    clock.formatToParts(new Date(now)).map((p) => [p.type, p.value]),
  );
  const elapsed =
    Number(parts.hour) * 3600 +
    Number(parts.minute) * 60 +
    Number(parts.second) -
    (hour * 3600 + minute * 60 + second);
  return elapsed >= -180 && elapsed <= 300;
}
