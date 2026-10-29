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
import { checkRow } from "./row-context.js";
import { isNearDraw } from "./polling.js";
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
    publishedBusy = 0,
    suspendedEpoch = null;
  const suspended = new Set();
  function rowSuspended(code, snap) {
    if (suspendedEpoch !== snap.epoch) {
      suspended.clear();
      suspendedEpoch = snap.epoch;
    }
    return suspended.has(code);
  }
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
      tableReady: !!table() && !!form && !!serverButton,
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
  function rowBlock(code, keys, snap, purpose = "fill") {
    assert(snap);
    if (rowSuspended(code, snap))
      return { motivo: "llenado_suspendido", codigo: code, proposito: purpose };
    const row = find(code),
      v = view(),
      key = touchKey(code, v);
    const own = sessionWrites.get(key),
      dependent = dependentWrites.get(key);
    const rules = rulesByServer.get(`${snap.server}|${snap.serverId}`) || [];
    const ownSource =
      own &&
      equalFields(own.fields, row?.fields) &&
      sameBaseline(own.baseline, snap.persisted.get(code));
    const ownDependent =
      dependent &&
      equalFields(dependent.fields, row?.fields) &&
      sameBaseline(dependent.baseline, snap.persisted.get(code)) &&
      ruleSignature(
        dependentGroups(dependent.principal, rules).get(code) || [],
      ) === dependent.signature;
    const localEvidence = touched.has(key)
      ? "manual"
      : ownSource || ownDependent
        ? "own"
        : null;
    const result = checkRow({
      snap,
      code,
      keys,
      visible: row,
      purpose,
      localEvidence,
      previousProof:
        snap.verifiedRows.get(code) || snap.previousVerified.get(code),
    });
    if (!result.ok)
      return {
        motivo: result.motivo,
        codigo: code,
        campos: result.campos,
        proposito: result.proposito,
      };
    context.recordProof(code, result.proof, snap);
    return null;
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
    if (rowSuspended(code, snap)) return { motivo: "llenado_suspendido" };
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
    const sourceKeys = new Set(Object.keys(affected));
    const groups = dependentGroups(code, rules);
    for (const group of groups.values())
      for (const rule of group) {
        if (projectRule(rule, row.fields) === null)
          return { motivo: "regla_dependiente_desconocida" };
        for (const token of FIELD_NAMES.map((key) => rule[key])) {
          const read = {
            "1ra": "primera",
            "2da": "segunda",
            "3ra": "tercera",
            p3: "pick3",
            p4: "pick4",
          }[token];
          if (read) sourceKeys.add(read);
          else if (typeof token === "string" && /^p[34]:/.test(token))
            sourceKeys.add(token[1] === "3" ? "pick3" : "pick4");
        }
      }
    const block = rowBlock(code, [...sourceKeys], snap, "fill");
    if (block) return block;
    if (
      Object.entries(affected).some(
        ([k, value]) => row.fields[k] && row.fields[k] !== value,
      )
    )
      return { motivo: "premios_derivados_distintos" };
    for (const [dependentCode, group] of dependentGroups(code, rules)) {
      if (!dependentCode) return { motivo: "regla_dependiente_invalida" };
      // An absent dependent may be hidden by a filter. Never write it blindly.
      if (!snap.persisted.has(dependentCode)) {
        if (find(dependentCode) || snap.invalidRows.has(dependentCode))
          return {
            motivo: "dependiente_no_verificada",
            dependiente: dependentCode,
          };
        continue;
      }
      const dependent = find(dependentCode);
      if (locked(dependent))
        return { motivo: "dependiente_bloqueada", dependiente: dependentCode };
      if (touched.has(touchKey(dependentCode, v)))
        return { motivo: "dependiente_editada", dependiente: dependentCode };
      const keys = [
        ...new Set(
          group.flatMap((rule) =>
            Object.keys(projectRule(rule, row.fields) || {}),
          ),
        ),
      ];
      if (keys.length) {
        const block = rowBlock(dependentCode, keys, snap, "dependency");
        if (block) return { ...block, dependiente: dependentCode };
      }
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
  const effectSignature = (code, rules) =>
    JSON.stringify(
      [...dependentGroups(code, rules)].map(([dependent, group]) => [
        dependent,
        ruleSignature(group),
      ]),
    );
  function effectBlock(receipt, snap) {
    const v = view(),
      rules = rulesByServer.get(`${snap.server}|${snap.serverId}`);
    if (!rules || effectSignature(receipt.code, rules) !== receipt.signature)
      return { motivo: "reglas_cambiaron", proposito: "dependency" };
    const source = find(receipt.code);
    if (
      locked(source) ||
      touched.has(touchKey(receipt.code, v)) ||
      hasConflict(receipt.code, snap) ||
      !equalFields(source.fields, receipt.fields)
    )
      return { motivo: "fuente_cambio", proposito: "fill" };
    for (const effect of receipt.effects) {
      const dependent = find(effect.code);
      if (
        rowSuspended(effect.code, snap) ||
        locked(dependent) ||
        touched.has(touchKey(effect.code, v)) ||
        hasConflict(effect.code, snap) ||
        !equalFields(dependent.fields, effect.fields)
      )
        return {
          motivo: "efectos_nativos_distintos",
          dependiente: effect.code,
          proposito: "dependency",
        };
    }
    return null;
  }
  function suspendScope(code, effects, snap) {
    rowSuspended(code, snap);
    suspended.add(code);
    for (const effect of effects) suspended.add(effect.code);
  }
  function presentationBlock(code, expected, snap) {
    assert(snap);
    const receipt = sessionWrites.get(touchKey(code, view()));
    if (
      !receipt ||
      !equalFields(receipt.expected, expected, Object.keys(expected))
    )
      return { motivo: "sin_prueba_de_llenado", proposito: "presented" };
    const block = effectBlock(receipt, snap);
    if (block) suspendScope(code, receipt.effects, snap);
    return block;
  }
  function settleNativeQueue() {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        channel.port2.close();
        resolve();
      };
      channel.port2.postMessage(null);
    });
  }
  async function fill(code, expected, snap, guard = () => {}) {
    if (!canFill(code, expected, snap)) return false;
    const v = view(),
      userActivity = activity,
      focus = doc.activeElement;
    const stepFields = { ...find(code).fields };
    const sourceFields = { ...stepFields, ...expected };
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
        initialFields: { ...dependent.fields },
        rules: group,
      });
    }
    const signature = effectSignature(code, rules);
    let hasWritten = false;
    const receiptFor = (currentFields) => ({
      code,
      signature,
      fields: { ...currentFields },
      effects: dependentPlan.map((plan) => ({
        code: plan.code,
        fields: Object.assign(
          { ...plan.initialFields },
          ...(hasWritten
            ? plan.rules.map((rule) => projectRule(rule, currentFields))
            : []),
        ),
      })),
    });
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
      completed = false,
      settled = false;
    try {
      for (const key of keys) {
        assert(snap);
        guard();
        const row = find(code);
        if (
          locked(row) ||
          effectBlock(receiptFor(stepFields), snap) ||
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
        hasWritten = true;
        stepFields[key] = expected[key];
        if (key === "pick3") stepFields.primera = expected[key].slice(-2);
        if (key === "pick4") {
          stepFields.segunda = expected[key].slice(0, 2);
          stepFields.tercera = expected[key].slice(2);
        }
        // Without dependents the row stays in one microtask burst. For dependent
        // effects, let React commit work queued by other scripts before another
        // native input could overwrite it. No fixed per-field delay.
        await Promise.resolve();
        if (dependentPlan.length && key !== keys.at(-1))
          await settleNativeQueue();
        assert(snap);
        guard();
        if (
          effectBlock(receiptFor(stepFields), snap) ||
          clean(find(code)?.inputs[key]?.value) !== expected[key]
        ) {
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
        !effectBlock(receiptFor(stepFields), snap) &&
        activity === userActivity &&
        !touched.has(touchKey(code, v));
      completed = ok;
    } finally {
      if (!completed) {
        suspendScope(code, dependentPlan, snap);
      }
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
    if (ok) {
      sessionWrites.set(touchKey(code, v), {
        ...receiptFor(sourceFields),
        expected: { ...expected },
        baseline: baseline(snap.persisted.get(code)),
      });
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
  function hasImminentDraw(snap) {
    assert(snap);
    const t = table(),
      column = t?.headers.indexOf("HORA"),
      now = Date.now();
    if (column == null || column < 0) return false;
    return indexedRows().some(
      (row) =>
        row.procCell?.querySelector(".lucide-circle-x") &&
        isNearDraw(row.el.cells[column]?.textContent, now),
    );
  }
  function refreshIfSafe(snap) {
    assert(snap);
    if (Date.now() - lastRefresh < 120000) return false;
    const v = view();
    const prefix = `${snap.server}|${snap.date}|`;
    const published = (code) => {
      const row = find(code),
        stored = snap.persisted.get(code);
      return (
        stored?.procesado === true &&
        row?.processed === true &&
        equalFields(row.fields, stored)
      );
    };
    if (
      v.dialog ||
      v.busy ||
      [...touched].some(
        (key) => key.startsWith(prefix) && !published(key.slice(prefix.length)),
      ) ||
      [...sessionWrites, ...dependentWrites].some(
        ([key, write]) => key.startsWith(prefix) && !published(write.code),
      ) ||
      v.rows.some(
        (r) =>
          (r.dirty && !published(r.code)) ||
          !equalFields(r.fields, snap.persisted.get(r.code)),
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
    rowBlock,
    presentationBlock,
    hasConflict,
    refreshIfSafe,
    hasImminentDraw,
    view,
    isDirty: (code) => touched.has(touchKey(code, view())),
    get message() {
      return context.message;
    },
    // Suspend effects without losing the verified baseline for unsaved edits.
    // A fresh matching native response is still required before resuming.
    invalidate: (reason) => context.prepareSearch(view(), reason),
  };
}
