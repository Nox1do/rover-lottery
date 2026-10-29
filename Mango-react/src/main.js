import { createCentralAdapter } from "./central.js";
import { installNativeObserver } from "./native.js";
import { createApi } from "./api.js";
import { createDelivery } from "./delivery.js";
import { createVisuals, installStyle } from "./visuals.js";
import { nextDelay } from "./polling.js";
import { uid } from "./helpers.js";
const VERSION = __MANGO_VERSION__,
  KEYS = {
    token: "mango_react_token",
    client: "mango_react_client",
    paused: "mango_react_paused",
  };
const token = () => String(GM_getValue(KEYS.token, "")).trim();
let client = GM_getValue(KEYS.client, "");
if (!client) {
  client = uid("mango-react-pc");
  GM_setValue(KEYS.client, client);
}
let paused = !!GM_getValue(KEYS.paused, false),
  busy = false,
  lastApiAt = 0,
  delay = 5000,
  cache = null,
  lastError = null,
  auth = "sin comprobar",
  lastCheck = null,
  retryAt = 0,
  wake = null;
const central = createCentralAdapter(document, window, () => {
  if (!wake)
    wake = setTimeout(() => {
      wake = null;
      void tick();
    }, 200);
});
const visuals = createVisuals(central);
const api = createApi({
  getToken: token,
  request: (options) => GM_xmlhttpRequest(options),
  onUnauthorized: () => {
    auth = "rechazado";
    cache = null;
    central.invalidate("Token rechazado; configura el token y pulsa Buscar.");
  },
});
let delivery = createDelivery({ central, api, clientId: client, visuals });
// Only the fetch wrapper is exported, with no GM capability attached to it.
const observing =
  typeof unsafeWindow !== "undefined" &&
  typeof exportFunction === "function" &&
  installNativeObserver(
    unsafeWindow,
    (fn, target) => exportFunction(fn, target),
    central.onNative,
  );
if (!observing)
  lastError =
    "No se pudo instalar el observador. Usa Firefox y Tampermonkey actualizado.";
function install() {
  installStyle(document);
}
if (document.documentElement) install();
else document.addEventListener("DOMContentLoaded", install, { once: true });
async function poll(snap) {
  const startedAt = Date.now();
  const version = await api.get(
    `/v1/mango/version?date=${snap.date}&ts=${Date.now()}`,
  );
  central.assert(snap);
  if (
    version.ok !== true ||
    version.date !== snap.date ||
    !Number.isInteger(version.revision) ||
    version.revision < 0
  )
    throw Error("unsupported_version_contract");
  if (
    !cache ||
    cache.date !== snap.date ||
    cache.revision !== version.revision ||
    Date.now() - cache.at >= 15000
  ) {
    const response = await api.get(
      `/v1/mango/rows?date=${snap.date}&client_id=${encodeURIComponent(client)}&revision=${version.revision}`,
      true,
    );
    central.assert(snap);
    if (
      response.contract_version !== "1.0" ||
      response.date !== snap.date ||
      !Array.isArray(response.rows)
    )
      throw Error("unsupported_rows_contract");
    cache = {
      date: snap.date,
      revision: version.revision,
      rows: response.rows,
      at: startedAt,
    };
    auth = "válido";
  }
  cache.epoch = snap.epoch;
  await delivery.cycle(cache.rows, snap);
  central.assert(snap);
  lastCheck = new Date().toISOString();
  retryAt = 0;
  delay = nextDelay(cache.rows, central.hasImminentDraw(snap));
  const d = delivery.diagnostics();
  lastError = d.errors.length
    ? d.errors.map((x) => `${x.lottery}: ${x.error}`).join("; ")
    : d.mismatches.length
      ? "API procesado / Central pendiente: " + d.mismatches.join(", ")
      : null;
  // A native search invalidates this frame. Defer it throughout the fast
  // watch/delivery window, including activity hidden by a table filter.
  if (delay === 120000) central.refreshIfSafe(snap);
}
async function tick() {
  if (paused || !observing) return;
  const snap = central.snapshot();
  visuals.setContext(snap);
  if (!snap) {
    visuals.clearAll();
    return;
  }
  if (!token()) {
    lastError = "Configura el token desde el menú de Tampermonkey.";
    return;
  }
  if (cache?.date === snap.date && cache.epoch === snap.epoch)
    delivery.syncVisuals(cache.rows, snap);
  else visuals.syncBlue([]);
  if (Date.now() < retryAt) return;
  delay = nextDelay(cache?.rows || [], central.hasImminentDraw(snap));
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
        },
      );
    } else await poll(snap);
  } catch (e) {
    if (e.message !== "context_changed") {
      lastError = e.message;
      delay = 30000;
      retryAt = Date.now() + 30000;
    }
  } finally {
    busy = false;
  }
}
function diagnostic() {
  const snap = central.snapshot(),
    stats = delivery.diagnostics();
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
    intervalo_segundos: delay / 1000,
    filas_api: cache?.rows.length || 0,
    ...stats,
    filas_verificadas:
      snap && cache?.epoch === snap.epoch ? stats.filas_verificadas : 0,
    ...(snap
      ? delivery.nativeIncidences(snap)
      : { incidencias_tabla: [], incidencias_tabla_total: 0 }),
    ultimo_error: lastError,
  };
}
function reset(reason) {
  cache = null;
  lastApiAt = 0;
  retryAt = 0;
  delay = 5000;
  visuals.clearAll();
  central.invalidate(reason);
  delivery = createDelivery({ central, api, clientId: client, visuals });
}
GM_registerMenuCommand("Mango React · Configurar token", async () => {
  const entered = window.prompt(
    "Token de entrega Mango (se guarda únicamente en Tampermonkey):",
    "",
  );
  if (entered === null) return;
  GM_setValue(KEYS.token, entered.trim());
  auth = "sin comprobar";
  reset("Token actualizado. Pulsa Buscar en Central.");
  try {
    if (entered.trim()) {
      const result = await api.get("/v1/mango/auth-check", true);
      auth =
        result.ok === true && result.authenticated === true
          ? "válido"
          : "rechazado";
    }
  } catch (e) {
    auth = e.status === 401 ? "rechazado" : "error de conexión";
    lastError = e.message;
  }
  window.alert(
    `Mango React: token ${auth}. Pulsa Buscar en Central para continuar.`,
  );
});
GM_registerMenuCommand("Mango React · Pausar/reanudar", () => {
  paused = !paused;
  GM_setValue(KEYS.paused, paused);
  reset(paused ? "Mango pausado." : "Mango reanudado. Pulsa Buscar.");
  window.alert(
    paused
      ? "Mango React pausado."
      : "Mango React reanudado. Pulsa Buscar en Central.",
  );
});
GM_registerMenuCommand("Mango React · Diagnóstico", () =>
  window.alert(JSON.stringify(diagnostic(), null, 2)),
);
GM_registerMenuCommand("Mango React · Regenerar identificador de PC", () => {
  client = uid("mango-react-pc");
  GM_setValue(KEYS.client, client);
  reset("Identificador actualizado. Pulsa Buscar.");
  window.alert(
    "Identificador de Mango React actualizado. Pulsa Buscar en Central.",
  );
});
if (typeof GM_addValueChangeListener === "function")
  for (const key of Object.values(KEYS))
    GM_addValueChangeListener(key, (_name, _old, _new, remote) => {
      if (remote) {
        paused = !!GM_getValue(KEYS.paused, false);
        client = GM_getValue(KEYS.client, client);
        auth = "sin comprobar";
        reset("Cambió la configuración en otra pestaña. Pulsa Buscar.");
      }
    });
setInterval(() => {
  void tick();
}, 1000);
void tick();
