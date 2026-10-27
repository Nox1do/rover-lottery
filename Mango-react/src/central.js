import {
  FIELD_NAMES,
  clean,
  fields,
  equalFields,
  parseDate,
  normalizeLabel,
  sleep,
  validExpected,
} from "./helpers.js";
import { createContext } from "./context.js";
const HEADERS = {
  primera: "1ERA",
  segunda: "2DA",
  tercera: "3RA",
  pick3: "PICK 3",
  pick4: "PICK 4",
};
const label = (el) => normalizeLabel(el?.textContent);
export function createCentralAdapter(doc, win, onChange = () => {}) {
  const context = createContext();
  let cache = null,
    activity = 0,
    lastRefresh = Date.now(),
    publishedBusy = 0;
  const ownEvents = new WeakSet(),
    sessionWrites = new Map(),
    touched = new Set(),
    nativeRequests = new Map(),
    rulesByServer = new Map(),
    revisionByDate = new Map();
  const touchKey = (code, view) =>
    `${view.server}|${view.selectedDate}|${code}`;
  function active() {
    const q = new URLSearchParams(win.location.search);
    return (
      win.location.pathname.replace(/\/$/, "") === "/loteria/resultados/ver" &&
      !["horarios", "dependientes"].includes(q.get("vista")) &&
      q.get("horarios") !== "1"
    );
  }
  function table() {
    if (cache?.el.isConnected) return cache;
    const matches = [...doc.querySelectorAll("#root table")]
      .filter((t) => !t.closest('[role="dialog"]'))
      .map((el) => ({
        el,
        headers: [...el.querySelectorAll("thead th")].map(label),
      }))
      .filter((t) =>
        ["LOTERIA", "PROC", ...Object.values(HEADERS)].every(
          (h) => t.headers.filter((x) => x === h).length === 1,
        ),
      );
    if (matches.length !== 1) return null;
    cache = { ...matches[0], index: null };
    return cache;
  }
  function rows() {
    const t = table();
    if (!t) return [];
    if (!t.index)
      t.index = [...t.el.querySelectorAll("tbody tr")]
        .map((el) => {
          const first = el.cells[t.headers.indexOf("LOTERIA")];
          const code = first
            ?.querySelector('[data-slot="badge"]')
            ?.textContent.trim();
          const name = first?.querySelector(".font-medium")?.textContent.trim();
          const inputs = Object.fromEntries(
            Object.entries(HEADERS).map(([k, h]) => [
              k,
              el.cells[t.headers.indexOf(h)]?.querySelector("input"),
            ]),
          );
          return {
            el,
            code,
            name,
            inputs,
            procCell: el.cells[t.headers.indexOf("PROC")],
          };
        })
        .filter(
          (r) => r.code && r.name && Object.values(r.inputs).every(Boolean),
        );
    return t.index.map((r) => ({
      ...r,
      fields: fields(
        Object.fromEntries(FIELD_NAMES.map((k) => [k, r.inputs[k].value])),
      ),
      processed: r.procCell?.querySelector(
        ".lucide-circle-check, .lucide-check-circle-2, .lucide-circle-check-big, .lucide-circle-check-2",
      )
        ? true
        : r.procCell?.querySelector(".lucide-circle-x")
          ? false
          : null,
    }));
  }
  function view() {
    const forms = [...doc.querySelectorAll("#root form")].filter(
      (f) => !f.closest('[role="dialog"]'),
    );
    const matches = forms
      .map((form) => ({
        form,
        search: [...form.querySelectorAll('button[type="submit"]')].find(
          (b) => label(b) === "BUSCAR",
        ),
      }))
      .filter((x) => x.search);
    const { form, search } = matches.length === 1 ? matches[0] : {};
    const picker = form?.querySelector('button[aria-haspopup="dialog"]');
    const serverButton = doc.querySelector(
      'button[title="Servidor cuyos datos se están viendo"]',
    );
    const server = label(serverButton?.querySelector(".truncate"));
    const current = {
      active: active(),
      selectedDate: parseDate(picker?.textContent),
      server,
      busy: !!search?.disabled || publishedBusy > 0,
      dialog: !!doc.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="dialog"]:not([data-state="closed"]), [role="alertdialog"]:not([data-state="closed"])',
      ),
      readOnly: !!doc.querySelector(
        '[title="Las acciones que modifican datos están bloqueadas"]',
      ),
      form,
      search,
    };
    current.rows = rows().map((r) => ({
      ...r,
      dirty:
        touched.has(touchKey(r.code, current)) ||
        sessionWrites.has(touchKey(r.code, current)),
    }));
    return current;
  }
  function snapshot() {
    return context.snapshot(view());
  }
  function assert(snap) {
    return context.assert(snap, view());
  }
  function onNative(event) {
    const v = view();
    if (event.type === "start") {
      nativeRequests.set(event.id, {
        server: v.server,
        date: parseDate(event.date),
        serverId: event.serverId,
      });
      if (event.kind === "main") {
        if (!v.active || parseDate(event.date) !== v.selectedDate) {
          context.invalidate("Consulta sin contexto verificable.");
          return;
        }
        const id = context.begin({
          date: parseDate(event.date),
          server: v.server,
          serverId: event.serverId,
        });
        nativeRequests.get(event.id).contextId = id;
      } else if (event.kind === "publishing") {
        publishedBusy++;
        context.invalidate("Publicación en curso; esperando nueva carga.");
      }
      return;
    }
    const req = nativeRequests.get(event.id);
    nativeRequests.delete(event.id);
    if (!req) return;
    if (event.kind === "publishing") {
      publishedBusy = Math.max(0, publishedBusy - 1);
      return;
    }
    if (event.kind === "main") {
      if (event.type === "success" && req.server === v.server && v.active)
        context.finish(req.contextId, event.data);
      else context.fail(req.contextId);
      setTimeout(() => {
        context.sync(view());
        onChange();
      }, 120);
    }
    const serverKey = `${req.server}|${req.serverId}`;
    if (event.kind === "rules")
      rulesByServer.set(
        serverKey,
        event.type === "success" && Array.isArray(event.data?.reglas)
          ? event.data.reglas
          : null,
      );
    if (event.kind === "revision")
      revisionByDate.set(
        `${serverKey}|${req.date}`,
        event.type === "success" && Array.isArray(event.data?.revisiones)
          ? event.data.revisiones
          : null,
      );
    onChange();
  }
  function find(code) {
    const r = rows().filter((r) => r.code === code);
    return r.length === 1 ? r[0] : null;
  }
  function locked(row) {
    return (
      !row ||
      row.processed !== false ||
      Object.values(row.inputs).some((x) => x.disabled || x.readOnly) ||
      ![...row.el.querySelectorAll("button")].some(
        (b) =>
          (b.title === "Procesar" || label(b) === "PROCESAR") && !b.disabled,
      )
    );
  }
  function hasConflict(code, snap) {
    const data = revisionByDate.get(
      `${snap.server}|${snap.serverId}|${snap.date}`,
    );
    return (
      !data || data.some((r) => r.loteria === code && r.estado === "conflicto")
    );
  }
  function canFill(code, expected, snap) {
    assert(snap);
    if (!validExpected(expected)) return false;
    const v = view(),
      row = find(code),
      serverKey = `${snap.server}|${snap.serverId}`,
      rules = rulesByServer.get(serverKey);
    if (
      locked(row) ||
      row.dirty ||
      touched.has(touchKey(code, v)) ||
      !rules ||
      hasConflict(code, snap)
    )
      return false;
    if (
      Object.entries(expected).some(
        ([k, value]) => row.fields[k] && row.fields[k] !== value,
      )
    )
      return false;
    // Picks overwrite derived prizes in Central; validate those even if API owns only a pick.
    const affected = { ...expected };
    if (expected.pick3) affected.primera = expected.pick3.slice(-2);
    if (expected.pick4) {
      affected.segunda = expected.pick4.slice(0, 2);
      affected.tercera = expected.pick4.slice(2);
    }
    if (
      Object.entries(affected).some(
        ([k, value]) => row.fields[k] && row.fields[k] !== value,
      )
    )
      return false;
    for (const rule of rules.filter((r) => r.activo && r.principal === code)) {
      // An absent dependent may be hidden by a filter. Never write it blindly.
      if (!snap.persisted.has(rule.dependiente)) continue;
      const dependent = find(rule.dependiente);
      if (
        locked(dependent) ||
        touched.has(touchKey(rule.dependiente, v)) ||
        Object.values(dependent.fields).some(Boolean)
      )
        return false;
    }
    return true;
  }
  async function fill(code, expected, snap, guard = () => {}) {
    if (!canFill(code, expected, snap)) return false;
    const v = view(),
      userActivity = activity,
      focus = doc.activeElement;
    const scrolling = [...doc.querySelectorAll("#root div")]
      .filter((x) => x.scrollTop || x.scrollLeft)
      .map((el) => ({ el, top: el.scrollTop, left: el.scrollLeft }));
    const x = win.scrollX,
      y = win.scrollY;
    const keys = Object.keys(expected).filter(
      (k) =>
        !(k === "primera" && expected.pick3) &&
        !(["segunda", "tercera"].includes(k) && expected.pick4),
    );
    let ok = true;
    try {
      for (const key of keys) {
        assert(snap);
        guard();
        const row = find(code);
        if (
          locked(row) ||
          activity !== userActivity ||
          touched.has(touchKey(code, v))
        ) {
          ok = false;
          break;
        }
        const input = row.inputs[key];
        if (clean(input.value) === expected[key]) continue;
        if (clean(input.value) !== "") {
          ok = false;
          break;
        }
        const setter = Object.getOwnPropertyDescriptor(
          win.HTMLInputElement.prototype,
          "value",
        ).set;
        setter.call(input, expected[key]);
        const event = new win.Event("input", { bubbles: true });
        ownEvents.add(event);
        input.dispatchEvent(event);
        await sleep(35);
        assert(snap);
        guard();
        if (clean(find(code)?.inputs[key]?.value) !== expected[key]) {
          ok = false;
          break;
        }
      }
      await sleep(35);
      assert(snap);
      guard();
      const latest = find(code);
      ok =
        ok &&
        !!latest &&
        equalFields(latest.fields, expected, Object.keys(expected)) &&
        activity === userActivity &&
        !touched.has(touchKey(code, v));
    } finally {
      if (activity === userActivity) {
        if (focus?.isConnected && doc.activeElement !== focus)
          focus.focus({ preventScroll: true });
        for (const s of scrolling)
          if (s.el.isConnected) {
            s.el.scrollTop = s.top;
            s.el.scrollLeft = s.left;
          }
        win.scrollTo(x, y);
      }
    }
    // No rollback: unexpected native changes or user intervention must remain visible.
    if (!ok)
      context.invalidate(
        "Central no retuvo el llenado esperado. Revisa y pulsa Buscar.",
      );
    if (ok)
      sessionWrites.set(touchKey(code, v), { code, expected: { ...expected } });
    return ok;
  }
  function refreshIfSafe(snap) {
    assert(snap);
    if (Date.now() - lastRefresh < 120000) return false;
    const v = view();
    if (
      v.dialog ||
      v.busy ||
      [...touched].some((key) =>
        key.startsWith(`${snap.server}|${snap.date}|`),
      ) ||
      [...sessionWrites].some(
        ([key, write]) =>
          key.startsWith(`${snap.server}|${snap.date}|`) &&
          !equalFields(
            snap.persisted.get(write.code),
            write.expected,
            Object.keys(write.expected),
          ),
      ) ||
      v.rows.some(
        (r) => r.dirty || !equalFields(r.fields, snap.persisted.get(r.code)),
      )
    )
      return false;
    lastRefresh = Date.now();
    v.form?.requestSubmit(v.search);
    return true;
  }
  doc.addEventListener(
    "input",
    (event) => {
      const row = rows().find((r) =>
        Object.values(r.inputs).includes(event.target),
      );
      if (row && !ownEvents.has(event)) {
        touched.add(touchKey(row.code, view()));
        activity++;
        onChange();
      }
    },
    true,
  );
  for (const type of ["pointerdown", "keydown"])
    doc.addEventListener(type, () => activity++, true);
  doc.addEventListener(
    "submit",
    (e) => {
      if (e.target === view().form) context.prepareSearch(view());
    },
    true,
  );
  function watch() {
    const observer = new win.MutationObserver((records) => {
      if (records.some((r) => r.type === "childList")) cache = null;
      context.sync(view());
      onChange();
    });
    observer.observe(doc.getElementById("root") || doc.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["disabled", "title"],
    });
  }
  if (doc.body) watch();
  else doc.addEventListener("DOMContentLoaded", watch, { once: true });
  win.addEventListener("popstate", () => context.sync(view()));
  return {
    onNative,
    snapshot,
    assert,
    rows,
    find,
    fill,
    canFill,
    hasConflict,
    refreshIfSafe,
    view,
    isDirty: (code) => touched.has(touchKey(code, view())),
    get message() {
      return context.message;
    },
    invalidate: context.invalidate,
  };
}
