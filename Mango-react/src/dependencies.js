import { FIELD_NAMES, clean } from "./helpers.js";
const copies = {
  "1ra": "primera",
  "2da": "segunda",
  "3ra": "tercera",
  p3: "pick3",
  p4: "pick4",
};
// Audit: PublicarFlujo-CdWenogO.js. Verification only; Central performs all writes.
export function projectRule(rule, source) {
  const projected = {};
  for (const key of FIELD_NAMES) {
    const token = rule[key] ?? "";
    if (token === "") continue;
    if (token === "X") {
      projected[key] = "X";
      continue;
    }
    if (Object.hasOwn(copies, token)) {
      projected[key] = clean(source[copies[token]]);
      continue;
    }
    if (typeof token !== "string") return null;
    const match = /^p([34]):([1-4])-([1-4])$/.exec(token);
    if (!match) return null;
    const size = Number(match[1]),
      start = Number(match[2]),
      end = Number(match[3]);
    if (start > end || end > size) return null;
    const value = clean(source[size === 3 ? "pick3" : "pick4"]);
    projected[key] =
      value.length === size && /^\d+$/.test(value)
        ? value.slice(start - 1, end)
        : "";
  }
  return projected;
}
