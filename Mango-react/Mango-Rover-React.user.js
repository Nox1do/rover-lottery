// ==UserScript==
// @name         Mango/Rover React
// @namespace    https://github.com/Nox1do/rover-lottery/Mango-react
// @version      0.1.2
// @description  Entrega Mango para Central React: PRINCIPAL, fecha verificada, edición segura y confirmación persistida.
// @match        https://central.roversport.net/*
// @connect      rover-lottery-api.loteriasrovers.workers.dev
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @sandbox      JavaScript
// @run-at       document-start
// @noframes
// @updateURL    https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Mango-react/Mango-Rover-React.meta.js
// @downloadURL  https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Mango-react/Mango-Rover-React.user.js
// @supportURL   https://github.com/Nox1do/rover-lottery/issues
// ==/UserScript==

(() => {
  // src/helpers.js
  var FIELD_NAMES = Object.freeze([
    "primera",
    "segunda",
    "tercera",
    "pick3",
    "pick4"
  ]);
  var API_BASE = "https://rover-lottery-api.loteriasrovers.workers.dev";
  var normalizeLabel = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
  var clean = (value) => /^[-—]+$/.test(String(value ?? "").trim()) ? "" : String(value ?? "").trim().toUpperCase();
  var fields = (row) => Object.fromEntries(FIELD_NAMES.map((k) => [k, clean(row?.[k])]));
  var equalFields = (a, b, keys = FIELD_NAMES) => keys.every((k) => clean(a?.[k]) === clean(b?.[k]));
  var uid = (prefix) => `${prefix}-${crypto.randomUUID()}`;
  var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function parseDate(value) {
    const s = String(value ?? "").trim().toLowerCase();
    let y, m, d;
    let a;
    if (a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)) {
      [, y, m, d] = a;
    } else if (a = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s)) {
      [, m, d, y] = a;
    } else if (a = /^(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|sept|oct|nov|dic)\.?\s+(\d{4})$/.exec(
      s
    )) {
      d = a[1];
      y = a[3];
      m = [
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
        "dic"
      ].indexOf(a[2].slice(0, 3)) + 1;
    } else return null;
    y = Number(y);
    m = Number(m);
    d = Number(d);
    const date = new Date(Date.UTC(y, m - 1, d));
    return y >= 2e3 && y <= 2200 && date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null;
  }
  function todayInZone(now = /* @__PURE__ */ new Date()) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Santo_Domingo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(now).map((p) => [p.type, p.value])
    );
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function validExpected(value) {
    return value && typeof value === "object" && Object.keys(value).length > 0 && Object.entries(value).every(
      ([k, v]) => FIELD_NAMES.includes(k) && typeof v === "string" && new RegExp(
        `^[0-9X]{${k === "pick3" ? 3 : k === "pick4" ? 4 : "1,2"}}$`
      ).test(v)
    );
  }

  // src/context.js
  function createContext({ today = todayInZone, now = Date.now } = {}) {
    let epoch = 0, request = null, candidate = null, confirmed = null, retained = null, message = "Pulsa Buscar para verificar la fecha cargada.";
    function invalidate(reason) {
      epoch++;
      request = null;
      candidate = null;
      confirmed = null;
      retained = null;
      message = reason;
    }
    function begin(meta) {
      const baseline = confirmed || retained || request?.previous || candidate?.previous;
      const previous = baseline?.date === meta.date && baseline?.server === meta.server && baseline?.serverId === meta.serverId ? baseline : null;
      retained = null;
      epoch++;
      confirmed = null;
      candidate = null;
      request = { ...meta, id: epoch, previous };
      message = "Central est\xE1 cargando resultados\u2026";
      return epoch;
    }
    function finish(id, data) {
      if (!request || request.id !== id) return;
      const date = parseDate(data?.fecha), map = /* @__PURE__ */ new Map();
      if (date !== request.date || !Array.isArray(data.filas)) {
        invalidate("Respuesta de Central no corresponde a la fecha solicitada.");
        return;
      }
      for (const row of data.filas) {
        if (!row?.abrev || map.has(row.abrev) || ![true, false, 0, 1].includes(row.procesado)) {
          invalidate("Respuesta de Central no reconocida.");
          return;
        }
        map.set(row.abrev, {
          ...fields(row),
          abrev: row.abrev,
          nombre: String(row.nombre ?? ""),
          procesado: row.procesado === true || row.procesado === 1
        });
      }
      candidate = { ...request, date, persisted: map, readyAt: now() + 100 };
      request = null;
    }
    function fail(id) {
      if (request?.id === id) {
        const previous = request.previous;
        invalidate("Fall\xF3 la carga de Central. Pulsa Buscar nuevamente.");
        retained = previous;
      }
    }
    function prepareSearch(view) {
      sync(view);
      const previous = confirmed || retained || request?.previous || candidate?.previous;
      invalidate("Esperando la respuesta de Buscar.");
      retained = previous;
    }
    function sync(view) {
      const current = confirmed || candidate || request || retained;
      if (!view.active || view.readOnly || view.server !== "PRINCIPAL" || view.selectedDate !== today()) {
        if (current)
          invalidate(
            "Solo PRINCIPAL y fecha de hoy; requiere permiso de escritura."
          );
        return;
      }
      if (current && (current.date !== view.selectedDate || current.server !== view.server)) {
        invalidate("Cambi\xF3 la fecha o el servidor. Pulsa Buscar.");
        return;
      }
      if (candidate && !view.busy && !view.dialog && now() >= candidate.readyAt && view.rows?.length) {
        const codes = /* @__PURE__ */ new Set();
        let matches = true;
        for (const row of view.rows) {
          const stored = candidate.persisted.get(row.code);
          if (codes.has(row.code) || !stored || stored.procesado !== row.processed) {
            matches = false;
            break;
          }
          codes.add(row.code);
          const old = candidate.previous?.persisted.get(row.code);
          const knownDirty = candidate.previous?.date === candidate.date && candidate.previous?.server === candidate.server && candidate.previous?.serverId === candidate.serverId && row.dirty && old && equalFields(old, stored);
          if (!equalFields(stored, row.fields) && !knownDirty) {
            matches = false;
            break;
          }
        }
        if (matches) {
          confirmed = {
            epoch,
            date: candidate.date,
            server: candidate.server,
            serverId: candidate.serverId,
            persisted: candidate.persisted
          };
          candidate = null;
          message = "Fecha y publicaci\xF3n verificadas.";
        }
      }
    }
    function snapshot(view) {
      sync(view);
      if (!confirmed || view.busy || view.dialog || !view.rows?.length)
        return null;
      return confirmed;
    }
    function assert(snap, view) {
      const cur = snapshot(view);
      if (!snap || !cur || cur.epoch !== snap.epoch || cur.date !== snap.date || cur.server !== snap.server)
        throw new Error("context_changed");
      return cur;
    }
    return {
      begin,
      prepareSearch,
      finish,
      fail,
      sync,
      snapshot,
      assert,
      invalidate,
      get message() {
        return message;
      },
      get epoch() {
        return epoch;
      }
    };
  }

  // src/central.js
  var HEADERS = {
    primera: "1ERA",
    segunda: "2DA",
    tercera: "3RA",
    pick3: "PICK 3",
    pick4: "PICK 4"
  };
  var label = (el) => normalizeLabel(el?.textContent);
  function createCentralAdapter(doc, win, onChange = () => {
  }) {
    const context = createContext();
    let cache2 = null, activity = 0, lastRefresh = Date.now(), publishedBusy = 0;
    const ownEvents = /* @__PURE__ */ new WeakSet(), sessionWrites = /* @__PURE__ */ new Map(), touched = /* @__PURE__ */ new Set(), nativeRequests = /* @__PURE__ */ new Map(), rulesByServer = /* @__PURE__ */ new Map(), revisionByDate = /* @__PURE__ */ new Map();
    const touchKey = (code, view2) => `${view2.server}|${view2.selectedDate}|${code}`;
    function active() {
      const q = new URLSearchParams(win.location.search);
      return win.location.pathname.replace(/\/$/, "") === "/loteria/resultados/ver" && !["horarios", "dependientes"].includes(q.get("vista")) && q.get("horarios") !== "1";
    }
    function table() {
      if (cache2?.el.isConnected) return cache2;
      const matches = [...doc.querySelectorAll("#root table")].filter((t) => !t.closest('[role="dialog"]')).map((el) => ({
        el,
        headers: [...el.querySelectorAll("thead th")].map(label)
      })).filter(
        (t) => ["LOTERIA", "PROC", ...Object.values(HEADERS)].every(
          (h) => t.headers.filter((x) => x === h).length === 1
        )
      );
      if (matches.length !== 1) return null;
      cache2 = { ...matches[0], index: null };
      return cache2;
    }
    function rows() {
      const t = table();
      if (!t) return [];
      if (!t.index)
        t.index = [...t.el.querySelectorAll("tbody tr")].map((el) => {
          const first = el.cells[t.headers.indexOf("LOTERIA")];
          const code = first?.querySelector('[data-slot="badge"]')?.textContent.trim();
          const name = first?.querySelector(".font-medium")?.textContent.trim();
          const inputs = Object.fromEntries(
            Object.entries(HEADERS).map(([k, h]) => [
              k,
              el.cells[t.headers.indexOf(h)]?.querySelector("input")
            ])
          );
          return {
            el,
            code,
            name,
            inputs,
            procCell: el.cells[t.headers.indexOf("PROC")]
          };
        }).filter(
          (r) => r.code && r.name && Object.values(r.inputs).every(Boolean)
        );
      return t.index.map((r) => ({
        ...r,
        fields: fields(
          Object.fromEntries(FIELD_NAMES.map((k) => [k, r.inputs[k].value]))
        ),
        processed: r.procCell?.querySelector(
          ".lucide-circle-check, .lucide-check-circle-2, .lucide-circle-check-big, .lucide-circle-check-2"
        ) ? true : r.procCell?.querySelector(".lucide-circle-x") ? false : null
      }));
    }
    function view() {
      const forms = [...doc.querySelectorAll("#root form")].filter(
        (f) => !f.closest('[role="dialog"]')
      );
      const matches = forms.map((form2) => ({
        form: form2,
        search: [...form2.querySelectorAll('button[type="submit"]')].find(
          (b) => label(b) === "BUSCAR"
        )
      })).filter((x) => x.search);
      const { form, search } = matches.length === 1 ? matches[0] : {};
      const picker = form?.querySelector('button[aria-haspopup="dialog"]');
      const serverButton = doc.querySelector(
        'button[title="Servidor cuyos datos se est\xE1n viendo"]'
      );
      const server = label(serverButton?.querySelector(".truncate"));
      const current = {
        active: active(),
        selectedDate: parseDate(picker?.textContent),
        server,
        busy: !!search?.disabled || publishedBusy > 0,
        dialog: !!doc.querySelector(
          '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="dialog"]:not([data-state="closed"]), [role="alertdialog"]:not([data-state="closed"])'
        ),
        readOnly: !!doc.querySelector(
          '[title="Las acciones que modifican datos est\xE1n bloqueadas"]'
        ),
        form,
        search
      };
      current.rows = rows().map((r) => ({
        ...r,
        dirty: touched.has(touchKey(r.code, current)) || sessionWrites.has(touchKey(r.code, current))
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
          serverId: event.serverId
        });
        if (event.kind === "main") {
          if (!v.active || parseDate(event.date) !== v.selectedDate) {
            context.invalidate("Consulta sin contexto verificable.");
            return;
          }
          const id = context.begin({
            date: parseDate(event.date),
            server: v.server,
            serverId: event.serverId
          });
          nativeRequests.get(event.id).contextId = id;
        } else if (event.kind === "publishing") {
          publishedBusy++;
          context.invalidate("Publicaci\xF3n en curso; esperando nueva carga.");
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
          event.type === "success" && Array.isArray(event.data?.reglas) ? event.data.reglas : null
        );
      if (event.kind === "revision")
        revisionByDate.set(
          `${serverKey}|${req.date}`,
          event.type === "success" && Array.isArray(event.data?.revisiones) ? event.data.revisiones : null
        );
      onChange();
    }
    function find(code) {
      const r = rows().filter((r2) => r2.code === code);
      return r.length === 1 ? r[0] : null;
    }
    function locked(row) {
      return !row || row.processed !== false || Object.values(row.inputs).some((x) => x.disabled || x.readOnly) || ![...row.el.querySelectorAll("button")].some(
        (b) => (b.title === "Procesar" || label(b) === "PROCESAR") && !b.disabled
      );
    }
    function hasConflict(code, snap) {
      const data = revisionByDate.get(
        `${snap.server}|${snap.serverId}|${snap.date}`
      );
      return !data || data.some((r) => r.loteria === code && r.estado === "conflicto");
    }
    function canFill(code, expected, snap) {
      assert(snap);
      if (!validExpected(expected)) return false;
      const v = view(), row = find(code), serverKey = `${snap.server}|${snap.serverId}`, rules = rulesByServer.get(serverKey);
      if (locked(row) || row.dirty || touched.has(touchKey(code, v)) || !rules || hasConflict(code, snap))
        return false;
      if (Object.entries(expected).some(
        ([k, value]) => row.fields[k] && row.fields[k] !== value
      ))
        return false;
      const affected = { ...expected };
      if (expected.pick3) affected.primera = expected.pick3.slice(-2);
      if (expected.pick4) {
        affected.segunda = expected.pick4.slice(0, 2);
        affected.tercera = expected.pick4.slice(2);
      }
      if (Object.entries(affected).some(
        ([k, value]) => row.fields[k] && row.fields[k] !== value
      ))
        return false;
      for (const rule of rules.filter((r) => r.activo && r.principal === code)) {
        if (!snap.persisted.has(rule.dependiente)) continue;
        const dependent = find(rule.dependiente);
        if (locked(dependent) || touched.has(touchKey(rule.dependiente, v)) || Object.values(dependent.fields).some(Boolean))
          return false;
      }
      return true;
    }
    async function fill(code, expected, snap, guard = () => {
    }) {
      if (!canFill(code, expected, snap)) return false;
      const v = view(), userActivity = activity, focus = doc.activeElement;
      const scrolling = [...doc.querySelectorAll("#root div")].filter((x2) => x2.scrollTop || x2.scrollLeft).map((el) => ({ el, top: el.scrollTop, left: el.scrollLeft }));
      const x = win.scrollX, y = win.scrollY;
      const keys = Object.keys(expected).filter(
        (k) => !(k === "primera" && expected.pick3) && !(["segunda", "tercera"].includes(k) && expected.pick4)
      );
      let ok = true;
      try {
        for (const key of keys) {
          assert(snap);
          guard();
          const row = find(code);
          if (locked(row) || activity !== userActivity || touched.has(touchKey(code, v))) {
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
            "value"
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
        ok = ok && !!latest && equalFields(latest.fields, expected, Object.keys(expected)) && activity === userActivity && !touched.has(touchKey(code, v));
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
      if (!ok)
        context.invalidate(
          "Central no retuvo el llenado esperado. Revisa y pulsa Buscar."
        );
      if (ok)
        sessionWrites.set(touchKey(code, v), { code, expected: { ...expected } });
      return ok;
    }
    function refreshIfSafe(snap) {
      assert(snap);
      if (Date.now() - lastRefresh < 12e4) return false;
      const v = view();
      if (v.dialog || v.busy || [...touched].some(
        (key) => key.startsWith(`${snap.server}|${snap.date}|`)
      ) || [...sessionWrites].some(
        ([key, write]) => key.startsWith(`${snap.server}|${snap.date}|`) && !equalFields(
          snap.persisted.get(write.code),
          write.expected,
          Object.keys(write.expected)
        )
      ) || v.rows.some(
        (r) => r.dirty || !equalFields(r.fields, snap.persisted.get(r.code))
      ))
        return false;
      lastRefresh = Date.now();
      v.form?.requestSubmit(v.search);
      return true;
    }
    doc.addEventListener(
      "input",
      (event) => {
        const row = rows().find(
          (r) => Object.values(r.inputs).includes(event.target)
        );
        if (row && !ownEvents.has(event)) {
          touched.add(touchKey(row.code, view()));
          activity++;
          onChange();
        }
      },
      true
    );
    for (const type of ["pointerdown", "keydown"])
      doc.addEventListener(type, () => activity++, true);
    doc.addEventListener(
      "submit",
      (e) => {
        if (e.target === view().form) context.prepareSearch(view());
      },
      true
    );
    function watch() {
      const observer = new win.MutationObserver((records) => {
        if (records.some((r) => r.type === "childList")) cache2 = null;
        context.sync(view());
        onChange();
      });
      observer.observe(doc.getElementById("root") || doc.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["disabled", "title"]
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
      invalidate: context.invalidate
    };
  }

  // src/native.js
  var BASE = "/api/loteria/resultadosLoteria2";
  function installNativeObserver(page, exportToPage, notify) {
    const original = page.fetch;
    let sequence = 0;
    if (typeof original !== "function") return false;
    const report = (event) => {
      try {
        notify(event);
      } catch {
      }
    };
    function observe(input, options) {
      let meta;
      try {
        const url = new URL(
          typeof input === "string" ? input : input.url,
          page.location.href
        );
        const origin = new URL(page.location.href).origin;
        const kind = url.pathname === BASE ? "main" : url.pathname === BASE + "/dependientes" ? "rules" : url.pathname === BASE + "/revision" ? "revision" : url.pathname === BASE + "/procesar" ? "publishing" : null;
        if (url.origin === origin && kind) {
          const method = String(
            options?.method || input?.method || "GET"
          ).toUpperCase();
          const body = typeof options?.body === "string" ? JSON.parse(options.body) : null;
          const headers = new Headers(options?.headers || input?.headers || {});
          meta = {
            id: ++sequence,
            kind,
            date: body?.fecha || url.searchParams.get("fecha"),
            serverId: headers.get("X-Servidor") || "",
            method
          };
          report({ type: "start", ...meta });
        }
      } catch {
      }
      let result;
      try {
        result = Reflect.apply(original, this, arguments);
      } catch (error) {
        if (meta) report({ type: "failure", ...meta });
        throw error;
      }
      if (meta) {
        try {
          result.then(
            exportToPage((response) => {
              try {
                if (!response.ok) throw new Error("native_http_error");
                if (meta.kind === "publishing") {
                  report({ type: "success", ...meta });
                  return;
                }
                const clone = response.clone();
                void (async () => {
                  try {
                    const text = await clone.text();
                    if (text.length > 4e6)
                      throw new Error("native_payload_too_large");
                    const data = JSON.parse(text);
                    report({ type: "success", ...meta, data });
                  } catch {
                    report({ type: "failure", ...meta });
                  }
                })();
              } catch {
                report({ type: "failure", ...meta });
              }
            }, page),
            exportToPage(() => report({ type: "failure", ...meta }), page)
          );
        } catch {
          report({ type: "failure", ...meta });
        }
      }
      return result;
    }
    try {
      page.fetch = exportToPage(observe, page);
      return page.fetch !== original;
    } catch {
      return false;
    }
  }

  // src/api.js
  function createApi({ getToken, request, onUnauthorized = () => {
  } }) {
    async function json(path, { auth: auth2 = false, body, method = body === void 0 ? "GET" : "POST" } = {}) {
      if (!path.startsWith("/v1/mango/")) throw Error("unsupported_api_path");
      const token2 = auth2 ? getToken() : "";
      if (auth2 && !token2) throw Error("token_missing");
      const response = await new Promise((resolve, reject) => {
        request({
          method,
          url: API_BASE + path,
          headers: {
            Accept: "application/json",
            ...body !== void 0 ? { "Content-Type": "application/json" } : {},
            ...auth2 ? { Authorization: `Bearer ${token2}` } : {}
          },
          ...body === void 0 ? {} : { data: JSON.stringify(body) },
          timeout: 15e3,
          onload: resolve,
          onerror: () => reject(Error("network_error")),
          ontimeout: () => reject(Error("network_timeout")),
          onabort: () => reject(Error("request_aborted"))
        });
      });
      if (auth2 && token2 !== getToken()) throw Error("token_changed");
      if (response.status === 401) onUnauthorized();
      let data;
      try {
        data = JSON.parse(response.responseText);
      } catch {
        throw Error("invalid_json_response");
      }
      if (response.status < 200 || response.status >= 300) {
        const error = Error(String(data?.error || `http_${response.status}`));
        error.status = response.status;
        throw error;
      }
      if (data?.ok === false) throw Error(String(data.error || "api_rejected"));
      return data;
    }
    return {
      get: (path, auth2 = false) => json(path, { auth: auth2 }),
      post: (path, body) => json(path, { auth: true, body })
    };
  }

  // src/delivery.js
  function createDelivery({
    central: central2,
    api: api2,
    clientId,
    visuals: visuals2 = { paint() {
    }, clear() {
    }, syncBlue() {
    } }
  }) {
    const operations = /* @__PURE__ */ new Map(), acknowledged = /* @__PURE__ */ new Set(), painted = /* @__PURE__ */ new Map(), requestIds = /* @__PURE__ */ new Map();
    let errors = [], mismatches = [], matched = 0, lastDate = null, lastEpoch = null;
    function match(row, visible) {
      const labels = new Set(
        [
          row.name,
          row.lottery_id,
          ...Array.isArray(row.aliases) ? row.aliases : []
        ].map(normalizeLabel).filter(Boolean)
      );
      const matches = visible.filter(
        (r) => labels.has(normalizeLabel(r.code)) || labels.has(normalizeLabel(r.name))
      );
      return matches.length === 1 ? matches[0] : null;
    }
    function names(row) {
      const list = Array.isArray(row.owned_fields) && row.owned_fields.length ? row.owned_fields : Object.keys(row.expected_fields || {});
      return list.filter((k) => FIELD_NAMES.includes(k));
    }
    function matchingRows(rows, snap) {
      const visible = central2.rows(), matches = rows.filter((row) => row.draw_date === snap.date).map((row) => ({ row, visible: match(row, visible) }));
      const counts = /* @__PURE__ */ new Map();
      for (const x of matches)
        if (x.visible)
          counts.set(x.visible.code, (counts.get(x.visible.code) || 0) + 1);
      return matches.filter((x) => x.visible && counts.get(x.visible.code) === 1);
    }
    function updateWaiting(matches, snap) {
      visuals2.syncBlue(
        matches.filter(
          ({ row, visible }) => row.visual?.state === "blue" && row.proc_state !== "processed" && visible.processed === false && snap.persisted.get(visible.code)?.procesado === false
        ).map(({ row, visible }) => ({
          code: visible.code,
          names: names(row).filter((key) => !visible.fields[key])
        }))
      );
    }
    function syncVisuals(rows, snap) {
      central2.assert(snap);
      updateWaiting(matchingRows(rows, snap), snap);
    }
    function assertReservation(row, response) {
      const operation = response?.operation;
      const expected = response?.expected_fields || operation?.expected_fields;
      if (!operation?.operation_id || operation.status !== "reserved" || !Number.isInteger(operation.revision) || !validExpected(expected))
        throw Error("invalid_paint_contract");
      if (operation.revision !== row.revision || Object.entries(expected).some(
        ([key, value]) => !names(row).includes(key) || clean(row.expected_fields?.[key]) !== value
      ) || operation.expected_fields && !equalFields(
        operation.expected_fields,
        expected,
        Object.keys(expected)
      ))
        throw Error("stale_revision");
      if (!Number.isFinite(Date.parse(operation.expires_at)) || Date.parse(operation.expires_at) <= Date.now())
        throw Error("operation_expired");
    }
    async function present(row, code, snap, response) {
      const guard = () => {
        central2.assert(snap);
        assertReservation(row, response);
      };
      guard();
      const expected = response.expected_fields || response.operation?.expected_fields, operation = response.operation;
      if (!operation?.operation_id || !Number.isInteger(operation.revision) || !validExpected(expected))
        throw Error("invalid_paint_contract");
      if (central2.isDirty?.(code)) return false;
      const current = central2.find(code);
      if (!current || current.processed !== false) return false;
      if (!equalFields(current.fields, expected, Object.keys(expected))) {
        if (!central2.canFill(code, expected, snap)) return false;
        if (!await central2.fill(code, expected, snap, guard))
          throw Error("write_not_retained");
      }
      guard();
      const after = central2.find(code);
      if (!after || after.processed !== false || central2.isDirty?.(code) || !equalFields(after.fields, expected, Object.keys(expected)))
        throw Error("write_not_retained");
      const observed = Object.fromEntries(
        Object.keys(expected).map((k) => [k, after.fields[k]])
      );
      painted.set(code, { date: snap.date, fields: observed });
      visuals2.paint(code, Object.keys(expected), "green", 2e3);
      await api2.post("/v1/mango/rows/presented", {
        operation_id: operation.operation_id,
        revision: operation.revision,
        client_id: clientId,
        presented_fields: observed
      });
      central2.assert(snap);
      operations.delete(row.row_key);
      requestIds.delete(row.row_key);
      return true;
    }
    async function process(row, code, snap) {
      central2.assert(snap);
      const stored = snap.persisted.get(code), visible = central2.find(code);
      if (!stored || !visible) return;
      if (stored.procesado && visible.processed === true) {
        visuals2.clear(code);
        if (row.proc_state === "processed") return;
        let owned2 = names(row);
        if (!owned2.length) owned2 = FIELD_NAMES.filter((k) => clean(stored[k]));
        if (!owned2.length || owned2.every((k) => !clean(stored[k]))) return;
        const observed = Object.fromEntries(
          owned2.map((k) => [k, clean(stored[k])])
        );
        const signature = JSON.stringify([snap.date, row.lottery_id, observed]);
        if (acknowledged.has(signature)) return;
        const own = painted.get(code);
        const fromMango = own?.date === snap.date && equalFields(own.fields, observed, Object.keys(own.fields));
        central2.assert(snap);
        await api2.post("/v1/mango/rows/ack", {
          lottery_id: row.lottery_id,
          draw_date: snap.date,
          observed_fields: observed,
          processed_origin: fromMango ? "userscript" : "manual",
          client_id: clientId,
          client_request_id: uid("proc")
        });
        central2.assert(snap);
        acknowledged.add(signature);
        operations.delete(row.row_key);
        return;
      }
      if (row.proc_state === "processed") {
        visuals2.clear(code);
        mismatches.push(row.lottery_id);
        return;
      }
      if (stored.procesado || visible.processed !== false) return;
      const pending = operations.get(row.row_key);
      if (pending) {
        let fresh = true;
        try {
          assertReservation(row, pending);
        } catch {
          fresh = false;
          operations.delete(row.row_key);
          requestIds.delete(row.row_key);
        }
        if (fresh) {
          await present(row, code, snap, pending);
          return;
        }
      }
      const owned = names(row);
      const expected = row.expected_fields || {};
      if (!validExpected(expected) || !central2.canFill(code, expected, snap))
        return;
      if (equalFields(visible.fields, expected, Object.keys(expected))) return;
      const before = { ...visible.fields };
      const requestId = requestIds.get(row.row_key) || uid("paint");
      requestIds.set(row.row_key, requestId);
      const response = await api2.post("/v1/mango/rows/reconcile", {
        lottery_id: row.lottery_id,
        draw_date: snap.date,
        proc_state: "pending",
        revision: row.revision,
        observed_fields: Object.fromEntries(owned.map((k) => [k, before[k]])),
        client_id: clientId,
        client_request_id: requestId
      });
      central2.assert(snap);
      const now = central2.find(code);
      if (!now || !equalFields(before, now.fields) || central2.isDirty?.(code))
        return;
      if (!response.should_paint || response.action !== "paint_fields") {
        requestIds.delete(row.row_key);
        return;
      }
      operations.set(row.row_key, response);
      await present(row, code, snap, response);
    }
    async function cycle(rows, snap) {
      errors = [];
      mismatches = [];
      matched = 0;
      if (lastDate !== snap.date) {
        operations.clear();
        acknowledged.clear();
        painted.clear();
        requestIds.clear();
        lastDate = snap.date;
      }
      if (lastEpoch !== snap.epoch) {
        operations.clear();
        requestIds.clear();
        lastEpoch = snap.epoch;
      }
      central2.assert(snap);
      const matches = matchingRows(rows, snap);
      updateWaiting(matches, snap);
      for (const x of matches) {
        matched++;
        try {
          await process(x.row, x.visible.code, snap);
        } catch (e) {
          errors.push({ lottery: x.row.lottery_id, error: e.message });
          if ([
            "operation_expired",
            "operation_unavailable",
            "stale_revision",
            "client_lock_lost"
          ].includes(e.message)) {
            operations.delete(x.row.row_key);
            requestIds.delete(x.row.row_key);
          }
          if (e.message === "context_changed" || e.status === 401) break;
        }
      }
    }
    return {
      cycle,
      syncVisuals,
      diagnostics: () => ({
        matched,
        mismatches: [...mismatches],
        errors: [...errors]
      })
    };
  }

  // src/visuals.js
  function createVisuals(central2) {
    const timers = /* @__PURE__ */ new Map(), tracked = /* @__PURE__ */ new Set();
    function remove(input) {
      clearTimeout(timers.get(input));
      timers.delete(input);
      tracked.delete(input);
      input.removeAttribute("data-mango-react-visual");
    }
    function clear(code, state) {
      const row = central2.find(code);
      if (!row) return;
      for (const input of Object.values(row.inputs)) {
        if (!state || input.dataset.mangoReactVisual === state) {
          remove(input);
        }
      }
    }
    function paint(code, names, state, duration = 0) {
      const row = central2.find(code);
      if (!row) return;
      for (const name of names) {
        const input = row.inputs[name];
        if (!input) continue;
        if (state === "blue" && input.dataset.mangoReactVisual === "green")
          continue;
        clearTimeout(timers.get(input));
        tracked.add(input);
        input.setAttribute("data-mango-react-visual", state);
        if (duration)
          timers.set(
            input,
            setTimeout(() => {
              input.removeAttribute("data-mango-react-visual");
              tracked.delete(input);
              timers.delete(input);
            }, duration)
          );
      }
    }
    function syncBlue(plans) {
      const waiting = /* @__PURE__ */ new Set();
      for (const { code, names } of plans) {
        const row = central2.find(code);
        if (!row) continue;
        for (const name of names)
          if (row.inputs[name]) waiting.add(row.inputs[name]);
      }
      for (const input of tracked)
        if (input.isConnected === false || input.dataset.mangoReactVisual === "blue" && !waiting.has(input))
          remove(input);
      for (const input of waiting) {
        if (["blue", "green"].includes(input.dataset.mangoReactVisual)) continue;
        tracked.add(input);
        input.setAttribute("data-mango-react-visual", "blue");
      }
    }
    function clearAll() {
      for (const input of tracked) remove(input);
    }
    return { paint, clear, clearAll, syncBlue };
  }
  function installStyle(doc) {
    if (doc.getElementById("mango-react-style")) return;
    const style = doc.createElement("style");
    style.id = "mango-react-style";
    style.textContent = 'input[data-mango-react-visual="blue"]{background-color:#dbeafe!important;border-color:#3b82f6!important;color:#172554!important}input[data-mango-react-visual="green"]{background-color:#d4edda!important;border-color:#28a745!important;color:#14532d!important}';
    (doc.head || doc.documentElement).append(style);
  }

  // src/polling.js
  function nextDelay(rows) {
    return rows.some(
      (r) => r.proc_state !== "processed" && (r.components || []).some(
        (c) => ["awaiting_result", "ready"].includes(c.state)
      )
    ) ? 5e3 : 12e4;
  }

  // src/main.js
  var VERSION = "0.1.2";
  var KEYS = {
    token: "mango_react_token",
    client: "mango_react_client",
    paused: "mango_react_paused"
  };
  var token = () => String(GM_getValue(KEYS.token, "")).trim();
  var client = GM_getValue(KEYS.client, "");
  if (!client) {
    client = uid("mango-react-pc");
    GM_setValue(KEYS.client, client);
  }
  var paused = !!GM_getValue(KEYS.paused, false);
  var busy = false;
  var lastApiAt = 0;
  var delay = 5e3;
  var cache = null;
  var lastError = null;
  var auth = "sin comprobar";
  var lastCheck = null;
  var wake = null;
  var central = createCentralAdapter(document, window, () => {
    if (!wake)
      wake = setTimeout(() => {
        wake = null;
        void tick();
      }, 200);
  });
  var visuals = createVisuals(central);
  var api = createApi({
    getToken: token,
    request: (options) => GM_xmlhttpRequest(options),
    onUnauthorized: () => {
      auth = "rechazado";
      cache = null;
      central.invalidate("Token rechazado; configura el token y pulsa Buscar.");
    }
  });
  var delivery = createDelivery({ central, api, clientId: client, visuals });
  var observing = typeof unsafeWindow !== "undefined" && typeof exportFunction === "function" && installNativeObserver(
    unsafeWindow,
    (fn, target) => exportFunction(fn, target),
    central.onNative
  );
  if (!observing)
    lastError = "No se pudo instalar el observador. Usa Firefox y Tampermonkey actualizado.";
  function install() {
    installStyle(document);
  }
  if (document.documentElement) install();
  else document.addEventListener("DOMContentLoaded", install, { once: true });
  async function poll(snap) {
    const version = await api.get(
      `/v1/mango/version?date=${snap.date}&ts=${Date.now()}`
    );
    central.assert(snap);
    if (version.ok !== true || version.date !== snap.date || !Number.isInteger(version.revision) || version.revision < 0)
      throw Error("unsupported_version_contract");
    if (!cache || cache.date !== snap.date || cache.revision !== version.revision || Date.now() - cache.at > 12e4) {
      const response = await api.get(
        `/v1/mango/rows?date=${snap.date}&client_id=${encodeURIComponent(client)}&revision=${version.revision}`,
        true
      );
      central.assert(snap);
      if (response.contract_version !== "1.0" || response.date !== snap.date || !Array.isArray(response.rows))
        throw Error("unsupported_rows_contract");
      cache = {
        date: snap.date,
        revision: version.revision,
        rows: response.rows,
        at: Date.now()
      };
      auth = "v\xE1lido";
    }
    cache.epoch = snap.epoch;
    await delivery.cycle(cache.rows, snap);
    central.assert(snap);
    lastCheck = (/* @__PURE__ */ new Date()).toISOString();
    delay = nextDelay(cache.rows);
    const d = delivery.diagnostics();
    lastError = d.errors.length ? d.errors.map((x) => `${x.lottery}: ${x.error}`).join("; ") : d.mismatches.length ? "API procesado / Central pendiente: " + d.mismatches.join(", ") : null;
    central.refreshIfSafe(snap);
  }
  async function tick() {
    if (paused || !observing) return;
    const snap = central.snapshot();
    if (!snap) {
      visuals.clearAll();
      return;
    }
    if (!token()) {
      lastError = "Configura el token desde el men\xFA de Tampermonkey.";
      return;
    }
    if (cache?.date === snap.date && cache.epoch === snap.epoch)
      delivery.syncVisuals(cache.rows, snap);
    else visuals.syncBlue([]);
    if (busy || Date.now() - lastApiAt < delay) return;
    busy = true;
    lastApiAt = Date.now();
    try {
      if (navigator.locks?.request) {
        await navigator.locks.request(
          "mango-react-" + client,
          { ifAvailable: true },
          async (lock) => {
            if (lock) await poll(snap);
          }
        );
      } else await poll(snap);
    } catch (e) {
      if (e.message !== "context_changed") {
        lastError = e.message;
        delay = 3e4;
      }
    } finally {
      busy = false;
    }
  }
  function diagnostic() {
    const snap = central.snapshot();
    return {
      version: VERSION,
      observador: observing,
      pausado: paused,
      token_configurado: !!token(),
      token_estado: auth,
      cliente: client,
      contexto: central.message,
      fecha_verificada: snap?.date || null,
      servidor: snap?.server || null,
      ultima_consulta: lastCheck,
      intervalo_segundos: delay / 1e3,
      filas_api: cache?.rows.length || 0,
      ...delivery.diagnostics(),
      ultimo_error: lastError
    };
  }
  function reset(reason) {
    cache = null;
    lastApiAt = 0;
    delay = 5e3;
    visuals.clearAll();
    central.invalidate(reason);
    delivery = createDelivery({ central, api, clientId: client, visuals });
  }
  GM_registerMenuCommand("Mango React \xB7 Configurar token", async () => {
    const entered = window.prompt(
      "Token de entrega Mango (se guarda \xFAnicamente en Tampermonkey):",
      ""
    );
    if (entered === null) return;
    GM_setValue(KEYS.token, entered.trim());
    auth = "sin comprobar";
    reset("Token actualizado. Pulsa Buscar en Central.");
    try {
      if (entered.trim()) {
        const result = await api.get("/v1/mango/auth-check", true);
        auth = result.ok === true && result.authenticated === true ? "v\xE1lido" : "rechazado";
      }
    } catch (e) {
      auth = e.status === 401 ? "rechazado" : "error de conexi\xF3n";
      lastError = e.message;
    }
    window.alert(
      `Mango React: token ${auth}. Pulsa Buscar en Central para continuar.`
    );
  });
  GM_registerMenuCommand("Mango React \xB7 Pausar/reanudar", () => {
    paused = !paused;
    GM_setValue(KEYS.paused, paused);
    reset(paused ? "Mango pausado." : "Mango reanudado. Pulsa Buscar.");
    window.alert(
      paused ? "Mango React pausado." : "Mango React reanudado. Pulsa Buscar en Central."
    );
  });
  GM_registerMenuCommand(
    "Mango React \xB7 Diagn\xF3stico",
    () => window.alert(JSON.stringify(diagnostic(), null, 2))
  );
  GM_registerMenuCommand("Mango React \xB7 Regenerar identificador de PC", () => {
    client = uid("mango-react-pc");
    GM_setValue(KEYS.client, client);
    reset("Identificador actualizado. Pulsa Buscar.");
    window.alert(
      "Identificador de Mango React actualizado. Pulsa Buscar en Central."
    );
  });
  if (typeof GM_addValueChangeListener === "function")
    for (const key of Object.values(KEYS))
      GM_addValueChangeListener(key, (_name, _old, _new, remote) => {
        if (remote) {
          paused = !!GM_getValue(KEYS.paused, false);
          client = GM_getValue(KEYS.client, client);
          auth = "sin comprobar";
          reset("Cambi\xF3 la configuraci\xF3n en otra pesta\xF1a. Pulsa Buscar.");
        }
      });
  setInterval(() => {
    void tick();
  }, 1e3);
  void tick();
})();
