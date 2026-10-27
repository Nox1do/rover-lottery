export const FIELD_NAMES = Object.freeze([
  "primera",
  "segunda",
  "tercera",
  "pick3",
  "pick4",
]);
export const API_BASE = "https://rover-lottery-api.loteriasrovers.workers.dev";
// Match the badge's textContent.trim() without changing code spelling.
export const trimCode = (value) =>
  typeof value === "string" ? value.trim() : "";
export const normalizeLabel = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
export const clean = (value) =>
  /^[-—]+$/.test(String(value ?? "").trim())
    ? ""
    : String(value ?? "")
        .trim()
        .toUpperCase();
export const fields = (row) =>
  Object.fromEntries(FIELD_NAMES.map((k) => [k, clean(row?.[k])]));
export const equalFields = (a, b, keys = FIELD_NAMES) =>
  keys.every((k) => clean(a?.[k]) === clean(b?.[k]));
export const uid = (prefix) => `${prefix}-${crypto.randomUUID()}`;
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function parseDate(value) {
  const s = String(value ?? "")
    .trim()
    .toLowerCase();
  let y, m, d;
  let a;
  if ((a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) {
    [, y, m, d] = a;
  } else if ((a = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s))) {
    [, m, d, y] = a;
  } else if (
    (a =
      /^(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|sept|oct|nov|dic)\.?\s+(\d{4})$/.exec(
        s,
      ))
  ) {
    d = a[1];
    y = a[3];
    m =
      [
        "ene",
        "feb",
        "mar",
        "abr",
        "may",
        "jun",
        "jul",
        "ago",
        "sep",
        "oct",
        "nov",
        "dic",
      ].indexOf(a[2].slice(0, 3)) + 1;
  } else return null;
  y = Number(y);
  m = Number(m);
  d = Number(d);
  const date = new Date(Date.UTC(y, m - 1, d));
  return y >= 2000 &&
    y <= 2200 &&
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
    ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    : null;
}
export function todayInZone(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Santo_Domingo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function validExpected(value) {
  return (
    value &&
    typeof value === "object" &&
    Object.keys(value).length > 0 &&
    Object.entries(value).every(
      ([k, v]) =>
        FIELD_NAMES.includes(k) &&
        typeof v === "string" &&
        new RegExp(
          `^[0-9X]{${k === "pick3" ? 3 : k === "pick4" ? 4 : "1,2"}}$`,
        ).test(v),
    )
  );
}
