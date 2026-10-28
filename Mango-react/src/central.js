import {
  FIELD_NAMES,
  clean,
  fields,
  equalFields,
  parseDate,
  normalizeLabel,
  sleep,
  validExpected,
  trimCode,
} from "./helpers.js";
import { createContext } from "./context.js";
import { projectRule } from "./dependencies.js";
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
    dependentWrites = new Map(),
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
  function indexedRows() {
    const t = table();
    if (!t) return [];
    if (!t.index)
      t.index = [...t.el.querySelectorAll("tbody tr")]
        .map((el) => {
          const first = el.cells[t.headers.indexOf("LOTERIA")];
          const code = trimCode(
            first?.querySelector('[data-slot="badge"]')?.textContent,
          );
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
    return t.index;
  }
  function readRow(r) {
    return {
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
    };
  }
  function rows() {
    return indexedRows().map(readRow);
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
    let currentRows;
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
      rowCount: indexedRows().length,
      // Only a candidate response or a consumer needing values reads all rows.
      get rows() {
        return (currentRows ??= rows().map((r) => ({
          ...r,
          dirty:
            touched.has(touchKey(r.code, current)) ||
            sessionWrites.has(touchKey(r.code, current)) ||
            dependentWrites.has(touchKey(r.code, current)),
        })));
      },
    };
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
    const r = indexedRows().filter((r) => r.code === code);
    return r.length === 1 ? readRow(r[0]) : null;
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
      !data ||
      data.some((r) => trimCode(r.loteria) === code && r.estado === "conflicto")
    );
  }
  function canFill(code, expected, snap) {
    return !fillBlock(code, expected, snap);
  }
  function dependentGroups(code, rules) {
    const groups = new Map();
    for (const rule of rules.filter(
      (r) => r.activo && trimCode(r.principal) === code,
    )) {
      const dependent = trimCode(rule.dependiente);
      if (!groups.has(dependent)) groups.set(dependent, []);
      groups.get(dependent).push(rule);
    }
    return groups;
  }
  const ruleSignature = (rules) =>
    JSON.stringify(rules.map((rule) => FIELD_NAMES.map((k) => rule[k] ?? "")));
  const baseline = (stored) => ({
    ...fields(stored),
    procesado: stored?.procesado,
  });
  const sameBaseline = (a, b) =>
    !!a && !!b && a.procesado === b.procesado && equalFields(a, b);
  function isOwnDependent(code, row, dependent, rules, snap, v) {
    const own = dependentWrites.get(touchKey(dependent.code, v));
    return (
      own?.principal === code &&
      own.serverId === snap.serverId &&
      own.signature === ruleSignature(rules) &&
      equalFields(own.sourceFields, row.fields) &&
      equalFields(own.fields, dependent.fields) &&
      sameBaseline(own.sourceBaseline, snap.persisted.get(code)) &&
      sameBaseline(own.baseline, snap.persisted.get(dependent.code))
    );
  }
  function fillBlock(code, expected, snap) {
    assert(snap);
    if (!validExpected(expected)) return { motivo: "campos_invalidos" };
    const v = view(),
      row = find(code),
      serverKey = `${snap.server}|${snap.serverId}`,
      rules = rulesByServer.get(serverKey);
    if (locked(row)) return { motivo: "fila_bloqueada" };
    if (row.dirty || touched.has(touchKey(code, v)))
      return { motivo: "edicion_local" };
    if (!rules) return { motivo: "reglas_no_disponibles" };
    if (
      !revisionByDate.has(`${serverKey}|${snap.date}`) ||
      !revisionByDate.get(`${serverKey}|${snap.date}`)
    )
      return { motivo: "revision_no_disponible" };
    if (hasConflict(code, snap)) return { motivo: "conflicto_nativo" };
    if (
      Object.entries(expected).some(
        ([k, value]) => row.fields[k] && row.fields[k] !== value,
      )
    )
      return { motivo: "valores_existentes_distintos" };
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
      return { motivo: "premios_derivados_distintos" };
    for (const [dependentCode, group] of dependentGroups(code, rules)) {
      if (!dependentCode) return { motivo: "regla_dependiente_invalida" };
      // An absent dependent may be hidden by a filter. Never write it blindly.
      if (!snap.persisted.has(dependentCode)) continue;
      const dependent = find(dependentCode);
      if (locked(dependent))
        return { motivo: "dependiente_bloqueada", dependiente: dependentCode };
      if (touched.has(touchKey(dependentCode, v)))
        return { motivo: "dependiente_editada", dependiente: dependentCode };
      if (
        Object.values(dependent.fields).some(Boolean) &&
        !isOwnDependent(code, row, dependent, group, snap, v)
      )
        return {
          motivo: "dependiente_con_valores",
          dependiente: dependentCode,
        };
      if (
        Object.values(dependent.fields).some(Boolean) &&
        hasConflict(dependentCode, snap)
      )
        return { motivo: "conflicto_dependiente", dependiente: dependentCode };
    }
    return null;
  }
  async function fill(code, expected, snap, guard = () => {}) {
    if (!canFill(code, expected, snap)) return false;
    const v = view(),
      userActivity = activity,
      focus = doc.activeElement;
    const sourceFields = { ...find(code).fields, ...expected };
    if (expected.pick3) sourceFields.primera = expected.pick3.slice(-2);
    if (expected.pick4) {
      sourceFields.segunda = expected.pick4.slice(0, 2);
      sourceFields.tercera = expected.pick4.slice(2);
    }
    const dependentPlan = [];
    const rules = rulesByServer.get(`${snap.server}|${snap.serverId}`);
    for (const [dependentCode, group] of dependentGroups(code, rules)) {
      const dependent = find(dependentCode);
      if (!dependent || !snap.persisted.has(dependentCode)) continue;
      const projections = group.map((rule) => projectRule(rule, sourceFields));
      if (projections.some((projection) => projection === null)) continue;
      dependentPlan.push({
        code: dependentCode,
        principal: code,
        date: snap.date,
        serverId: snap.serverId,
        signature: ruleSignature(group),
        sourceFields,
        sourceBaseline: baseline(snap.persisted.get(code)),
        baseline: baseline(snap.persisted.get(dependentCode)),
        fields: Object.assign({ ...dependent.fields }, ...projections),
      });
    }
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
    let ok = true,
      settled = false;
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
        // Yield to React, MutationObservers and other scripts' microtasks,
        // without a timer/paint between this row's input events.
        await Promise.resolve();
        assert(snap);
        guard();
        if (clean(find(code)?.inputs[key]?.value) !== expected[key]) {
          ok = false;
          break;
        }
      }
      await sleep(35);
      settled = true;
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
      // An early guard failure may precede Central's queued native focus.
      // Let that timer run before restoring focus/scroll, including on abort.
      if (!settled) await sleep(0);
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
    if (ok) {
      sessionWrites.set(touchKey(code, v), { code, expected: { ...expected } });
      for (const [key, own] of dependentWrites)
        if (own.date !== snap.date || own.serverId !== snap.serverId)
          dependentWrites.delete(key);
      for (const plan of dependentPlan) {
        const key = touchKey(plan.code, v),
          dependent = find(plan.code);
        dependentWrites.delete(key);
        // Attribute only retained, independently predicted native effects.
        // A touched field stays foreign even if it was restored to the same value.
        if (
          !locked(dependent) &&
          !touched.has(key) &&
          !hasConflict(plan.code, snap) &&
          equalFields(find(code).fields, sourceFields) &&
          equalFields(dependent.fields, plan.fields)
        )
          dependentWrites.set(key, plan);
      }
    }
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
      const row = indexedRows().find((r) =>
        Object.values(r.inputs).includes(event.target),
      );
      if (row && !ownEvents.has(event)) {
        const v = view();
        touched.add(touchKey(row.code, v));
        for (const [key, own] of dependentWrites) {
          if (own.date !== v.selectedDate) continue;
          const rules = rulesByServer.get(`${v.server}|${own.serverId}`) || [];
          if (
            own.principal === row.code ||
            own.code === row.code ||
            rules.some(
              (rule) =>
                rule.activo &&
                trimCode(rule.principal) === row.code &&
                trimCode(rule.dependiente) === own.code,
            )
          ) {
            dependentWrites.delete(key);
            touched.add(key);
          }
        }
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
    fillBlock,
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
