import { clockSource } from "./time.mjs";
import { firefox } from "playwright";
import { build } from "esbuild";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
const fixture = (
  await build({
    entryPoints: ["tests/fixture.jsx"],
    bundle: true,
    write: false,
    format: "iife",
  })
).outputFiles[0].text;
const harness = (
  await build({
    stdin: {
      contents: `import {createCentralAdapter} from './src/central.js';import {installNativeObserver} from './src/native.js';import {createDelivery} from './src/delivery.js';window.createDelivery=createDelivery;window.adapter=createCentralAdapter(document,window);installNativeObserver(window,f=>f,e=>window.adapter.onNative(e));`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    format: "iife",
  })
).outputFiles[0].text;
const server = createServer((req, res) => {
  res.setHeader(
    "Content-Type",
    req.url === "/fixture.js" ? "text/javascript" : "text/html",
  );
  res.end(
    req.url === "/fixture.js"
      ? fixture
      : '<!doctype html><html><head></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>',
  );
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`,
  browser = await firefox.launch({
    headless: true,
    env: { ...process.env, MOZ_DISABLE_CONTENT_SANDBOX: "1" },
    firefoxUserPrefs: {
      "security.sandbox.content.level": 0,
      "fission.autostart": false,
    },
  });
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
async function setup({ overrides = {}, rows = 3, processedIcon } = {}) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  await page.addInitScript({ content: clockSource() });
  page.setDefaultTimeout(2000);
  page.setDefaultNavigationTimeout(5000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let state = {
    overrides,
    delay: 0,
    fail: false,
    revision: [],
    rules: [
      {
        activo: true,
        principal: "NY-AM",
        dependiente: "NY-BP",
        primera: "p4:3-4",
        segunda: "X",
        tercera: "X",
      },
    ],
  };
  await page.addInitScript((rows) => (window.fxRowCount = rows), rows);
  if (processedIcon)
    await page.addInitScript(
      (value) => (window.fxProcessedIcon = value),
      processedIcon,
    );
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    let body;
    if (url.pathname.endsWith("/dependientes")) body = { reglas: state.rules };
    else if (url.pathname.endsWith("/revision"))
      body = { revisiones: state.revision };
    else if (url.pathname === "/api/loteria/resultadosLoteria2") {
      const date = JSON.parse(route.request().postData()).fecha;
      body = await page.evaluate(
        ({ date, overrides }) => window.makeFixtureData(date, overrides),
        { date, overrides: state.overrides },
      );
      if (state.delay) await new Promise((r) => setTimeout(r, state.delay));
    } else throw Error("Unexpected native request: " + url);
    await route.fulfill({
      status: state.fail ? 500 : 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.goto(origin + "/loteria/resultados/ver");
  await page.waitForFunction(() => !!window.fx);
  await page.addScriptTag({ content: harness });
  await page.evaluate(() =>
    fetch("/api/loteria/resultadosLoteria2/dependientes", {
      headers: { "X-Servidor": "1" },
    }).then((r) => r.json()),
  );
  await page.evaluate(() =>
    fetch("/api/loteria/resultadosLoteria2/revision?fecha=10/27/2026", {
      headers: { "X-Servidor": "1" },
    }).then((r) => r.json()),
  );
  const r = {
    page,
    state,
    async load() {
      await page.locator('form button[type="submit"]').click();
      await page
        .waitForFunction(() => !!window.adapter.snapshot(), null, {
          timeout: 3000,
        })
        .catch(async (e) => {
          console.log(
            "VIEW",
            await page.evaluate(() => ({
              message: adapter.message,
              view: adapter.view(),
            })),
          );
          throw e;
        });
    },
    async vals(code) {
      return page
        .locator(`tr[data-code="${code}"] input`)
        .evaluateAll((xs) => xs.map((x) => x.value));
    },
    async fill(code, expected) {
      return page.evaluate(
        async ({ code, expected }) => {
          const a = window.adapter;
          try {
            return await a.fill(code, expected, a.snapshot());
          } catch (e) {
            return e.message;
          }
        },
        { code, expected },
      );
    },
    async close() {
      assert.equal(
        await page.evaluate(() => window.processClicks || 0),
        0,
        "Mango never clicks Procesar",
      );
      assert.deepEqual(errors, []);
      await page.close();
    },
  };
  return r;
}
async function waitingRuntime(r, rowConfig = {}) {
  await r.page.evaluate((rowConfig) => {
    window.gmRowConfig = rowConfig;
    window.gmCalls = [];
    window.gmMenus = {};
    window.gmWaitingState = "awaiting_result";
    window.gmHoldVersion = false;
    window.gmHeldRequests = [];
    const storage = { mango_react_token: "test-secret" };
    window.GM_getValue = (key, fallback) => storage[key] ?? fallback;
    window.GM_setValue = (key, value) => (storage[key] = value);
    window.gmListeners = {};
    window.GM_addValueChangeListener = (key, fn) => {
      gmListeners[key] = fn;
    };
    window.gmRemoteChange = (key, value) => {
      const old = storage[key];
      storage[key] = value;
      gmListeners[key](key, old, value, true);
    };
    window.GM_registerMenuCommand = (name, fn) => (gmMenus[name] = fn);
    window.unsafeWindow = window;
    window.exportFunction = (fn) => fn;
    window.alert = (message) => {
      try {
        window.gmDiagnostic = JSON.parse(message);
      } catch {
        window.gmNotice = message;
      }
    };
    window.GM_xmlhttpRequest = (options) => {
      gmCalls.push({ url: options.url, body: options.data });
      let data;
      if (options.url.includes("/version?"))
        data = {
          ok: true,
          date: "2026-10-27",
          revision:
            window.gmRevision ?? (gmWaitingState === "awaiting_result" ? 2 : 3),
        };
      else if (options.url.includes("/rows?"))
        data = {
          contract_version: "1.0",
          date: "2026-10-27",
          rows: [
            {
              lottery_id: "real",
              row_key: "real|2026-10-27",
              name: "REAL",
              aliases: ["REAL"],
              draw_date: "2026-10-27",
              revision:
                window.gmRevision ??
                (gmWaitingState === "awaiting_result" ? 2 : 3),
              proc_state:
                gmWaitingState === "processed" ? "processed" : "pending",
              owned_fields: ["primera", "segunda", "tercera"],
              expected_fields: window.gmExpected || {},
              components: [
                {
                  state: gmWaitingState,
                  expected_fields: window.gmExpected || {},
                },
              ],
              visual: {
                state: gmWaitingState === "awaiting_result" ? "blue" : null,
              },
              ...gmRowConfig,
            },
          ],
        };
      else if (options.url.endsWith("/reconcile") && window.gmReconcileData)
        data =
          typeof gmReconcileData === "function"
            ? gmReconcileData()
            : gmReconcileData;
      else if (options.url.endsWith("/presented")) data = { ok: true };
      else throw Error("Unexpected Mango request: " + options.url);
      const finish = () =>
        options.onload({ status: 200, responseText: JSON.stringify(data) });
      if (gmHoldVersion && options.url.includes("/version?"))
        gmHeldRequests.push(finish);
      else setTimeout(finish, 0);
    };
  }, rowConfig);
  await r.page.addScriptTag({
    content: await readFile("Mango-Rover-React.user.js", "utf8"),
  });
  await r.page.evaluate(() =>
    Promise.all([
      fetch("/api/loteria/resultadosLoteria2/dependientes", {
        headers: { "X-Servidor": "1" },
      }),
      fetch("/api/loteria/resultadosLoteria2/revision?fecha=10/27/2026", {
        headers: { "X-Servidor": "1" },
      }),
    ]),
  );
  await r.load();
  await r.page
    .locator(
      `tr[data-code="${rowConfig.aliases?.[0] || "REAL"}"] input[data-mango-react-visual="blue"]`,
    )
    .first()
    .waitFor();
}
for (const reset of ["remote", "pause"])
  test(`reinicio ${reset}: RHOD-MD editada no pierde baseline ni bloquea el resto tras Buscar`, async () => {
    const r = await setup({
      overrides: {
        "NY-BP": { abrev: "RHOD-MD", nombre: "RHODE ISLAND MIDDAY" },
      },
    });
    try {
      await waitingRuntime(r);
      await r.page.locator('tr[data-code="RHOD-MD"] input').first().fill("99");
      const callsBefore = await r.page.evaluate(() => gmCalls.length);
      await r.page.evaluate((reset) => {
        if (reset === "remote")
          gmRemoteChange("mango_react_client", "new-test-pc");
        else {
          gmMenus["Mango React · Pausar/reanudar"]();
          gmMenus["Mango React · Pausar/reanudar"]();
        }
        gmMenus["Mango React · Diagnóstico"]();
      }, reset);
      const suspended = await r.page.evaluate(() => gmDiagnostic);
      assert.equal(suspended.fecha_verificada, null);
      assert.equal(suspended.filas_api, 0);
      await r.page.waitForTimeout(300);
      assert.equal(
        await r.page.evaluate(() => gmCalls.length),
        callsBefore,
        "no reusa autorización ni consulta antes de Buscar",
      );
      await r.load();
      await r.page
        .waitForFunction(
          () => {
            gmMenus["Mango React · Diagnóstico"]();
            return (
              gmDiagnostic.fecha_verificada === "2026-10-27" &&
              gmDiagnostic.filas_api === 1
            );
          },
          null,
          { timeout: 5000 },
        )
        .catch(async (error) => {
          console.log(
            "RESET_CONTEXT_QA",
            await r.page.evaluate(() => gmDiagnostic),
          );
          throw error;
        });
      assert.equal((await r.vals("RHOD-MD"))[0], "99");
      assert.equal(
        await r.page
          .locator('tr[data-code="REAL"] input[data-mango-react-visual="blue"]')
          .count(),
        3,
      );
      await r.page.evaluate(() => {
        gmWaitingState = "ready";
        gmExpected = { primera: "05" };
        gmReconcileData = {
          ok: true,
          action: "paint_fields",
          should_paint: true,
          expected_fields: { primera: "05" },
          operation: {
            operation_id: "after-reset",
            revision: 3,
            status: "reserved",
            expires_at: new Date(Date.now() + 60000).toISOString(),
          },
        };
      });
      await r.page.waitForFunction(
        () => gmCalls.some((c) => c.url.endsWith("/presented")),
        null,
        { timeout: 10000 },
      );
      assert.equal((await r.vals("REAL"))[0], "05");
      assert.equal((await r.vals("RHOD-MD"))[0], "99");
      assert.equal(
        await r.page.evaluate(() =>
          gmCalls.some((c) => c.url.endsWith("/ack")),
        ),
        false,
      );
    } finally {
      await r.close();
    }
  });
test("runtime NY AM completa Pick 4 al llegar después de Pick 3 sin recargar ni procesar", async () => {
  const r = await setup();
  try {
    await waitingRuntime(r, {
      lottery_id: "newyorkam",
      row_key: "newyorkam|2026-10-27",
      name: "NEW YORK AM",
      aliases: ["NY-AM"],
      owned_fields: ["primera", "segunda", "tercera", "pick3", "pick4"],
    });
    await r.page.evaluate(() => {
      window.gmExpected = { pick3: "005", primera: "05" };
      window.gmRevision = 3;
      window.gmWaitingState = "ready";
      window.gmReconcileData = () => ({
        ok: true,
        action: "paint_fields",
        should_paint: true,
        expected_fields: { ...gmExpected },
        operation: {
          operation_id: "progressive-" + gmRevision,
          revision: gmRevision,
          status: "reserved",
          expires_at: new Date(Date.now() + 60000).toISOString(),
        },
      });
    });
    const presented = () =>
      r.page.evaluate(() =>
        gmCalls
          .filter((c) => c.url.endsWith("/presented"))
          .map((c) => JSON.parse(c.body)),
      );
    await r.page.waitForFunction(
      () => gmCalls.filter((c) => c.url.endsWith("/presented")).length === 1,
      null,
      { timeout: 10000 },
    );
    assert.deepEqual(await r.vals("NY-AM"), ["05", "", "", "005", ""]);
    assert.deepEqual(await r.vals("NY-BP"), ["", "X", "X", "", ""]);
    await r.page.evaluate(() => {
      gmExpected = {
        pick3: "005",
        primera: "05",
        pick4: "0123",
        segunda: "01",
        tercera: "23",
      };
      gmRevision = 4;
    });
    await r.page.waitForFunction(
      () => gmCalls.filter((c) => c.url.endsWith("/presented")).length === 2,
      null,
      { timeout: 10000 },
    );
    assert.deepEqual(await r.vals("NY-AM"), ["05", "01", "23", "005", "0123"]);
    assert.deepEqual(await r.vals("NY-BP"), ["23", "X", "X", "", ""]);
    const observations = await presented();
    assert.deepEqual(
      observations.map((x) => x.operation_id),
      ["progressive-3", "progressive-4"],
    );
    assert.deepEqual(observations[0].presented_fields, {
      pick3: "005",
      primera: "05",
    });
    assert.equal(observations[1].presented_fields.pick4, "0123");
  } finally {
    await r.close();
  }
});
test("diagnóstico completo identifica autorización denegada sin llenar ni exponer secretos", async () => {
  const r = await setup();
  try {
    await waitingRuntime(r);
    await r.page.evaluate(() => {
      window.gmExpected = { primera: "34" };
      window.gmReconcileData = {
        ok: true,
        action: "wait",
        should_paint: false,
        reason: "row_locked",
        token: "private-response-token",
      };
      window.gmWaitingState = "ready";
    });
    await r.page.waitForFunction(
      () => {
        gmMenus["Mango React · Diagnóstico"]();
        return gmDiagnostic.omitidas?.some(
          (x) => x.motivo === "servicio_no_autoriza",
        );
      },
      null,
      { timeout: 10000 },
    );
    const diagnostic = await r.page.evaluate(() => gmDiagnostic);
    assert.equal(diagnostic.conciliaciones[0].motivo_servicio, "row_locked");
    assert.equal(diagnostic.conciliaciones[0].autoriza_llenado, false);
    assert.deepEqual(diagnostic.errors, []);
    assert.ok(!JSON.stringify(diagnostic).includes("private-response-token"));
    assert.deepEqual(await r.vals("REAL"), ["", "", "", "", ""]);
    assert.equal(
      await r.page.evaluate(() =>
        gmCalls.some((c) => c.url.endsWith("/presented")),
      ),
      false,
    );
  } finally {
    await r.close();
  }
});
test("118 filas: código BRAZIL con espacios no bloquea consultas ni azul", async () => {
  const r = await setup({
    rows: 118,
    overrides: {
      "NY-BP": {
        abrev: " BRAZIL03PM ",
        nombre: "BRAZIL 03PM",
        procesado: true,
        primera: "05",
      },
    },
  });
  try {
    await waitingRuntime(r);
    assert.equal(await r.page.locator("tbody tr").count(), 118);
    assert.equal(await r.page.evaluate(() => gmCalls.length), 2);
    assert.equal(
      await r.page.evaluate(
        () => adapter.snapshot().persisted.get("BRAZIL03PM").primera,
      ),
      "05",
    );
  } finally {
    await r.close();
  }
});
test("BRAZIL con espacios permite llenar NICA y LA DIARIA sin modificar BRAZIL", async () => {
  const r = await setup({
    overrides: {
      REAL: { abrev: "NICA-3PM", nombre: "NICA 3PM" },
      "NY-AM": { abrev: "LD03", nombre: "LA DIARIA 03PM" },
      "NY-BP": {
        abrev: " BRAZIL03PM ",
        nombre: "BRAZIL 03PM",
        procesado: true,
        primera: "05",
      },
    },
  });
  try {
    await r.load();
    assert.equal(await r.fill("NICA-3PM", { primera: "12" }), true);
    assert.equal(await r.fill("LD03", { primera: "34" }), true);
    assert.deepEqual(await r.vals("NICA-3PM"), ["12", "", "", "", ""]);
    assert.deepEqual(await r.vals("LD03"), ["34", "", "", "", ""]);
    assert.deepEqual(await r.vals(" BRAZIL03PM "), ["05", "", "", "", ""]);
  } finally {
    await r.close();
  }
});
test("códigos con espacios en reglas conservan el bloqueo por dependiente editada", async () => {
  const r = await setup();
  try {
    r.state.rules[0].principal = " NY-AM ";
    r.state.rules[0].dependiente = " NY-BP ";
    await r.page.evaluate(() =>
      fetch("/api/loteria/resultadosLoteria2/dependientes", {
        headers: { "X-Servidor": "1" },
      }),
    );
    await r.load();
    await r.page.locator('tr[data-code="NY-BP"] input').first().fill("99");
    assert.equal(await r.fill("NY-AM", { pick4: "0123" }), false);
    assert.deepEqual(await r.vals("NY-AM"), ["", "", "", "", ""]);
    assert.equal((await r.vals("NY-BP"))[0], "99");
  } finally {
    await r.close();
  }
});
test("código con espacios en revisiones no omite un conflicto", async () => {
  const r = await setup();
  try {
    r.state.revision = [{ loteria: " REAL ", estado: "conflicto" }];
    await r.page.evaluate(() =>
      fetch("/api/loteria/resultadosLoteria2/revision?fecha=10/27/2026", {
        headers: { "X-Servidor": "1" },
      }),
    );
    await r.load();
    assert.equal(await r.fill("REAL", { primera: "05" }), false);
    assert.deepEqual(await r.vals("REAL"), ["", "", "", "", ""]);
  } finally {
    await r.close();
  }
});
test("código ajeno bloquea su fila y permite otras loterías verificadas", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page
      .locator('tr[data-code="REAL"] [data-slot="badge"]')
      .evaluate((badge) => (badge.textContent = "DESCONOCIDA"));
    await r.page.locator('form button[type="submit"]').click();
    await r.page.waitForFunction(() => !adapter.view().busy);
    await r.page.waitForTimeout(150);
    assert.ok(await r.page.evaluate(() => !!adapter.snapshot()));
    assert.equal(
      await r.page.evaluate(
        () =>
          adapter.rowBlock(
            "DESCONOCIDA",
            ["primera"],
            adapter.snapshot(),
            "fill",
          ).motivo,
      ),
      "fila_no_verificada",
    );
    assert.equal(await r.fill("DESCONOCIDA", { primera: "05" }), false);
    assert.equal(await r.fill("NY-AM", { pick3: "005" }), true);
  } finally {
    await r.close();
  }
});
for (const filter of ["NEW YORK", "NO EXISTE"])
  test(`azul vuelve tras filtro ${filter} sin nuevas consultas ni llenado`, async () => {
    const r = await setup();
    try {
      await waitingRuntime(r);
      const before = await r.page.evaluate(() => gmCalls.length);
      const search = r.page.locator('input[placeholder="Buscar lotería"]');
      await search.fill(filter);
      await r.page
        .locator('tr[data-code="REAL"]')
        .waitFor({ state: "detached" });
      await r.page.waitForTimeout(250);
      await search.fill("REAL");
      await r.page
        .locator('tr[data-code="REAL"] input[data-mango-react-visual="blue"]')
        .first()
        .waitFor({ timeout: 700 });
      assert.equal(await r.page.evaluate(() => gmCalls.length), before);
      assert.deepEqual(await r.vals("REAL"), ["", "", "", "", ""]);
      await search.fill("");
      assert.equal(
        await r.page.locator('input[data-mango-react-visual="blue"]').count(),
        3,
      );
    } finally {
      await r.close();
    }
  });
test("azul se restaura mientras la siguiente consulta sigue en curso", async () => {
  const r = await setup();
  try {
    await waitingRuntime(r);
    await r.page.evaluate(() => {
      gmHoldVersion = true;
      const OldDate = Date;
      window.Date = class extends OldDate {
        static now() {
          return OldDate.now() + 6000;
        }
      };
      fx.render();
    });
    await r.page.waitForFunction(() => gmHeldRequests.length === 1);
    const before = await r.page.evaluate(() => gmCalls.length);
    const search = r.page.locator('input[placeholder="Buscar lotería"]');
    await search.fill("NEW YORK");
    await r.page.locator('tr[data-code="REAL"]').waitFor({ state: "detached" });
    await search.fill("REAL");
    await r.page
      .locator('tr[data-code="REAL"] input[data-mango-react-visual="blue"]')
      .first()
      .waitFor({ timeout: 700 });
    assert.equal(await r.page.evaluate(() => gmCalls.length), before);
    assert.deepEqual(await r.vals("REAL"), ["", "", "", "", ""]);
  } finally {
    await r.close();
  }
});
test("azul al filtrar respeta números manuales y contexto no verificado", async () => {
  const r = await setup();
  try {
    await waitingRuntime(r);
    const first = r.page.locator('tr[data-code="REAL"] input').first();
    await first.fill("77");
    const search = r.page.locator('input[placeholder="Buscar lotería"]');
    await search.fill("NEW YORK");
    await r.page.locator('tr[data-code="REAL"]').waitFor({ state: "detached" });
    await search.fill("REAL");
    await r.page
      .locator('tr[data-code="REAL"] input[data-mango-react-visual="blue"]')
      .first()
      .waitFor({ timeout: 700 });
    assert.equal(await first.getAttribute("data-mango-react-visual"), null);
    assert.deepEqual(await r.vals("REAL"), ["77", "", "", "", ""]);
    await r.page.evaluate(() => fx.setDate("26 oct 2026"));
    await r.page.waitForTimeout(250);
    await search.fill("NEW YORK");
    await search.fill("REAL");
    await r.page.waitForTimeout(250);
    assert.equal(
      await r.page.locator("input[data-mango-react-visual]").count(),
      0,
    );
    assert.equal(await r.page.evaluate(() => gmCalls.length), 2);
  } finally {
    await r.close();
  }
});
for (const state of ["exhausted", "processed"])
  test(`filtro no restaura azul después de recibir ${state}`, async () => {
    const r = await setup();
    try {
      await waitingRuntime(r);
      await r.page.evaluate((state) => {
        gmWaitingState = state;
        const OldDate = Date;
        window.Date = class extends OldDate {
          static now() {
            return OldDate.now() + 6000;
          }
        };
        fx.render();
      }, state);
      await r.page.waitForFunction(
        () =>
          gmCalls.filter((c) => c.url.includes("/rows?")).length === 2 &&
          !document.querySelector('input[data-mango-react-visual="blue"]'),
      );
      const before = await r.page.evaluate(() => gmCalls.length);
      const search = r.page.locator('input[placeholder="Buscar lotería"]');
      await search.fill("NEW YORK");
      await search.fill("REAL");
      await r.page.waitForTimeout(250);
      assert.equal(
        await r.page.locator("input[data-mango-react-visual]").count(),
        0,
      );
      assert.equal(await r.page.evaluate(() => gmCalls.length), before);
      assert.deepEqual(await r.vals("REAL"), ["", "", "", "", ""]);
    } finally {
      await r.close();
    }
  });
for (const icon of [
  "circle-check",
  "check-circle-2",
  "circle-check-big",
  "circle-check-2",
])
  test(`PROC ${icon}: verifica persistencia y no rellena la procesada`, async () => {
    const r = await setup({
      overrides: { REAL: { procesado: true, primera: "05" } },
      processedIcon: `lucide lucide-${icon} text-emerald-600`,
    });
    try {
      await r.load();
      assert.deepEqual(
        await r.page.evaluate(() => ({
          date: adapter.snapshot().date,
          processed: adapter.find("REAL").processed,
          persisted: adapter.snapshot().persisted.get("REAL").primera,
          pending: adapter.find("NY-AM").processed,
        })),
        {
          date: "2026-10-27",
          processed: true,
          persisted: "05",
          pending: false,
        },
      );
      assert.equal(await r.fill("REAL", { primera: "77" }), false);
      assert.equal((await r.vals("REAL"))[0], "05");
    } finally {
      await r.close();
    }
  });
test("PROC actual: 13 procesadas no bloquean la entrega a la pendiente", async () => {
  const processed = [
    "NY-AM",
    "NY-BP",
    ...Array.from({ length: 11 }, (_, i) => `FIX${i}`),
  ];
  const r = await setup({
    rows: 14,
    overrides: Object.fromEntries(
      processed.map((code) => [code, { procesado: true }]),
    ),
  });
  try {
    await r.load();
    assert.equal(
      await r.page.evaluate(
        () => adapter.rows().filter((row) => row.processed === true).length,
      ),
      13,
    );
    assert.equal(await r.fill("REAL", { primera: "05" }), true);
    assert.deepEqual(await r.vals("REAL"), ["05", "", "", "", ""]);
  } finally {
    await r.close();
  }
});
test("PROC desconocido bloquea solo esa fila aunque Status indique éxito", async () => {
  const r = await setup({
    overrides: { REAL: { procesado: true, primera: "05" } },
    processedIcon: "lucide lucide-circle-help text-emerald-600",
  });
  try {
    await r.page.locator('form button[type="submit"]').click();
    await r.page.waitForFunction(
      () => adapter.rows().length === 3 && !adapter.view().busy,
    );
    await r.page.waitForTimeout(150);
    assert.equal(
      await r.page.evaluate(() => adapter.find("REAL").processed),
      null,
    );
    assert.ok(await r.page.evaluate(() => !!adapter.snapshot()));
    assert.equal(
      await r.page.evaluate(
        () =>
          adapter.rowBlock("REAL", ["primera"], adapter.snapshot(), "ack")
            .motivo,
      ),
      "proc_distinto",
    );
    assert.equal(await r.fill("NY-AM", { pick3: "005" }), true);
    assert.deepEqual(await r.vals("NY-AM"), ["05", "", "", "005", ""]);
  } finally {
    await r.close();
  }
});
for (const { rows, filtered } of [
  { rows: 3, filtered: false },
  { rows: 241, filtered: false },
  { rows: 241, filtered: true },
])
  test(`llenado agrupado: ${rows} filas, filtro ${filtered}`, async () => {
    const r = await setup({ rows });
    try {
      await r.load();
      if (filtered)
        await r.page
          .locator('input[placeholder="Buscar lotería"]')
          .fill("REAL");
      const trace = await r.page.evaluate(async () => {
        const values = () =>
          [...document.querySelectorAll('tr[data-code="REAL"] input')].map(
            (input) => input.value,
          );
        const frames = [],
          writes = [];
        const start = performance.now();
        let recording = true,
          timerValues = null;
        function sample() {
          frames.push(values());
          if (recording) requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
        function input(event) {
          if (event.target.closest("tr")?.dataset.code !== "REAL") return;
          writes.push(performance.now() - start);
          if (writes.length === 1)
            setTimeout(() => {
              timerValues = values();
            }, 0);
        }
        document.addEventListener("input", input);
        const ok = await adapter.fill(
          "REAL",
          { primera: "05", segunda: "00", tercera: "09" },
          adapter.snapshot(),
        );
        await new Promise((resolve) => requestAnimationFrame(resolve));
        recording = false;
        document.removeEventListener("input", input);
        return {
          ok,
          frames,
          timerValues,
          writes,
          elapsed: performance.now() - start,
        };
      });
      console.log(
        "FILL_TRACE",
        JSON.stringify({
          rows,
          filtered,
          writeSpanMs: trace.writes.at(-1) - trace.writes[0],
          elapsedMs: trace.elapsed,
          partialFrames: trace.frames.filter(
            (values) => values.join("|") !== "05|00|09||",
          ).length,
        }),
      );
      assert.equal(trace.ok, true);
      assert.deepEqual(
        trace.timerValues,
        ["05", "00", "09", "", ""],
        "el foco nativo ya encuentra la fila completa",
      );
      assert.ok(trace.frames.length > 0);
      assert.ok(
        trace.frames.every((values) => values.join("|") === "05|00|09||"),
        "no se pinta una fila parcialmente llena",
      );
      await r.page.evaluate(() => fx.render());
      assert.deepEqual(await r.vals("REAL"), ["05", "00", "09", "", ""]);
    } finally {
      await r.close();
    }
  });
test("picks con dependientes conservan ceros y restauran foco tras ceder cola nativa", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page.locator("#work").focus();
    await r.page.evaluate(() => {
      window.focusValues = [];
      document.addEventListener("focusin", (event) => {
        if (event.target.closest("tr")?.dataset.code === "NY-AM")
          focusValues.push(
            [...document.querySelectorAll('tr[data-code="NY-AM"] input')].map(
              (input) => input.value,
            ),
          );
      });
    });
    assert.equal(
      await r.fill("NY-AM", {
        pick3: "005",
        pick4: "0123",
        primera: "05",
        segunda: "01",
        tercera: "23",
      }),
      true,
    );
    const focusValues = await r.page.evaluate(() => window.focusValues);
    assert.ok(focusValues.length > 0);
    assert.deepEqual(await r.vals("NY-AM"), ["05", "01", "23", "005", "0123"]);
    assert.equal(
      await r.page
        .locator("#work")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    console.log(
      "DEPENDENCY_QUEUE_TRACE",
      JSON.stringify({
        nativeFocusBeforeComplete: focusValues.some(
          (values) => values.join("|") !== "05|01|23|005|0123",
        ),
      }),
    );
    assert.deepEqual(await r.vals("NY-BP"), ["23", "X", "X", "", ""]);
  } finally {
    await r.close();
  }
});
test("reserva invalidada en microtarea cancela los campos restantes y restaura foco", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page.locator("#work").focus();
    const result = await r.page.evaluate(async () => {
      let valid = true,
        fired = false;
      document.addEventListener("input", (event) => {
        if (!fired && event.target.closest("tr")?.dataset.code === "REAL") {
          fired = true;
          queueMicrotask(() => {
            valid = false;
          });
        }
      });
      try {
        await adapter.fill(
          "REAL",
          { primera: "05", segunda: "00", tercera: "09" },
          adapter.snapshot(),
          () => {
            if (!valid) throw Error("operation_expired");
          },
        );
      } catch (error) {
        return error.message;
      }
    });
    assert.equal(result, "operation_expired");
    assert.deepEqual(await r.vals("REAL"), ["05", "", "", "", ""]);
    assert.equal(
      await r.page.evaluate(() => document.activeElement.id),
      "work",
    );
  } finally {
    await r.close();
  }
});
test("carga real React: fecha verificada, ceros, persistencia tras rerender", async () => {
  const r = await setup();
  try {
    await r.load();
    assert.equal(
      await r.page.evaluate(() => adapter.snapshot().date),
      "2026-10-27",
    );
    assert.equal(
      await r.fill("REAL", { primera: "05", segunda: "00", tercera: "09" }),
      true,
    );
    await r.page.evaluate(() => fx.render());
    assert.deepEqual(await r.vals("REAL"), ["05", "00", "09", "", ""]);
  } finally {
    await r.close();
  }
});
test("picks calculados nativamente y dependencias sin pisar valores", async () => {
  const r = await setup();
  try {
    await r.load();
    assert.equal(
      await r.fill("NY-AM", {
        pick3: "005",
        pick4: "0123",
        primera: "05",
        segunda: "01",
        tercera: "23",
      }),
      true,
    );
    assert.deepEqual(await r.vals("NY-AM"), ["05", "01", "23", "005", "0123"]);
    assert.deepEqual(await r.vals("NY-BP"), ["23", "X", "X", "", ""]);
  } finally {
    await r.close();
  }
});
test("dependiente con trabajo local bloquea la principal antes de escribir", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page.locator('tr[data-code="NY-BP"] input').first().fill("99");
    assert.equal(await r.fill("NY-AM", { pick4: "0123" }), false);
    assert.deepEqual(await r.vals("NY-AM"), ["", "", "", "", ""]);
    assert.equal((await r.vals("NY-BP"))[0], "99");
  } finally {
    await r.close();
  }
});
for (const first of ["pick3", "pick4"])
  test(`NY AM: ${first} primero no bloquea el siguiente pick por sus propias dependientes`, async () => {
    const r = await setup();
    try {
      await r.load();
      assert.equal(
        await r.fill(
          "NY-AM",
          first === "pick3" ? { pick3: "005" } : { pick4: "0123" },
        ),
        true,
      );
      assert.deepEqual(
        await r.vals("NY-BP"),
        first === "pick3" ? ["", "X", "X", "", ""] : ["23", "X", "X", "", ""],
      );
      await r.page.evaluate(() => fx.render());
      assert.equal(
        await r.fill("NY-AM", {
          pick3: "005",
          primera: "05",
          pick4: "0123",
          segunda: "01",
          tercera: "23",
        }),
        true,
      );
      assert.deepEqual(await r.vals("NY-AM"), [
        "05",
        "01",
        "23",
        "005",
        "0123",
      ]);
      assert.deepEqual(await r.vals("NY-BP"), ["23", "X", "X", "", ""]);
    } finally {
      await r.close();
    }
  });
for (const change of [
  "manual",
  "clear",
  "script",
  "silent",
  "rules",
  "processed",
  "hidden",
])
  test(`continuación de picks preserva dependiente intervenida: ${change}`, async () => {
    const r = await setup();
    try {
      await r.load();
      assert.equal(await r.fill("NY-AM", { pick3: "005" }), true);
      if (["manual", "clear"].includes(change)) {
        const input = r.page.locator('tr[data-code="NY-BP"] input').nth(1);
        await input.fill("");
        if (change === "manual") await input.fill("X");
      } else if (change === "script") {
        await r.page.evaluate(() => {
          const input = adapter.find("NY-BP").inputs.segunda;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
      } else if (change === "silent") {
        await r.page.evaluate(() => fx.values("NY-BP", { primera: "99" }));
        await r.page.waitForFunction(
          () => adapter.find("NY-BP").fields.primera === "99",
        );
      } else if (change === "rules") {
        r.state.rules[0].primera = "p4:1-2";
        await r.page.evaluate(() =>
          fetch("/api/loteria/resultadosLoteria2/dependientes", {
            headers: { "X-Servidor": "1" },
          }).then((r) => r.json()),
        );
        await r.page.waitForTimeout(50);
      } else if (change === "processed") {
        await r.page
          .locator('tr[data-code="NY-BP"] td')
          .nth(9)
          .locator("svg")
          .evaluate((el) => el.setAttribute("class", "lucide-circle-check"));
      } else {
        await r.page
          .locator('input[placeholder="Buscar lotería"]')
          .fill("NY-AM");
        await r.page.waitForFunction(() => !adapter.find("NY-BP"));
      }
      assert.equal(await r.fill("NY-AM", { pick4: "0123" }), false);
      assert.equal((await r.vals("NY-AM"))[4], "");
      if (change === "silent") assert.equal((await r.vals("NY-BP"))[0], "99");
    } finally {
      await r.close();
    }
  });
test("Buscar entre picks conserva baseline y origen de dependientes propias", async () => {
  const r = await setup();
  try {
    await r.load();
    assert.equal(await r.fill("NY-AM", { pick3: "005" }), true);
    await r.load();
    assert.equal(await r.fill("NY-AM", { pick4: "0123" }), true);
    assert.deepEqual(await r.vals("NY-BP"), ["23", "X", "X", "", ""]);
  } finally {
    await r.close();
  }
});
test("otra principal intervenida invalida el origen aunque la dependiente conserve los mismos valores", async () => {
  const r = await setup();
  try {
    await r.load();
    r.state.rules.push({ ...r.state.rules[0], principal: "REAL" });
    await r.page.evaluate(() =>
      fetch("/api/loteria/resultadosLoteria2/dependientes", {
        headers: { "X-Servidor": "1" },
      }).then((r) => r.json()),
    );
    await r.page.waitForTimeout(50);
    assert.equal(await r.fill("NY-AM", { pick3: "005" }), true);
    await r.page.evaluate(() => {
      window.fxSharedDependent = true;
    });
    await r.page.locator('tr[data-code="REAL"] input').first().fill("99");
    assert.deepEqual(await r.vals("NY-BP"), ["", "X", "X", "", ""]);
    assert.equal(await r.fill("NY-AM", { pick4: "0123" }), false);
    assert.equal((await r.vals("NY-AM"))[4], "");
  } finally {
    await r.close();
  }
});
test("edición y limpieza intencional bloquean restauraciones posteriores", async () => {
  const r = await setup();
  try {
    await r.load();
    const first = r.page.locator('tr[data-code="REAL"] input').first();
    await first.fill("88");
    await first.fill("");
    assert.equal(await r.fill("REAL", { primera: "05" }), false);
    assert.equal((await r.vals("REAL"))[0], "");
  } finally {
    await r.close();
  }
});
test("fecha histórica, cambio de servidor y ruta cancelan operaciones", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page.evaluate(() => {
      window.oldSnap = adapter.snapshot();
      fx.setDate("26 oct 2026");
    });
    await r.page.waitForTimeout(30);
    assert.equal(await r.page.evaluate(() => adapter.snapshot()), null);
    await r.page.evaluate(() => fx.setDate("27 oct 2026"));
    await r.page.waitForTimeout(30);
    assert.equal(await r.page.evaluate(() => adapter.snapshot()), null);
    await r.load();
    await r.page.evaluate(() => fx.setServer("SEGUNDO"));
    await r.page.waitForTimeout(30);
    assert.equal(await r.page.evaluate(() => adapter.snapshot()), null);
  } finally {
    await r.close();
  }
});
test("PROC verde con valores editados mantiene persistido original", async () => {
  const r = await setup({
    overrides: { REAL: { procesado: true, primera: "05" } },
  });
  try {
    await r.load();
    await r.page.locator('tr[data-code="REAL"] input').first().fill("98");
    assert.equal(
      await r.page.evaluate(
        () => adapter.snapshot().persisted.get("REAL").primera,
      ),
      "05",
    );
    assert.equal(await r.fill("REAL", { primera: "77" }), false);
  } finally {
    await r.close();
  }
});
test("diálogo, lectura y conflicto nativo suspenden llenado", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page.evaluate(() => fx.setDialog(true));
    await r.page.waitForTimeout(20);
    assert.equal(await r.fill("REAL", { primera: "05" }), "context_changed");
    await r.page.evaluate(() => fx.setDialog(false));
    await r.page.waitForTimeout(20);
    r.state.revision = [{ loteria: "REAL", estado: "conflicto" }];
    await r.page.evaluate(() =>
      fetch("/api/loteria/resultadosLoteria2/revision?fecha=10/27/2026", {
        headers: { "X-Servidor": "1" },
      }).then((r) => r.json()),
    );
    assert.equal(await r.fill("REAL", { primera: "05" }), false);
  } finally {
    await r.close();
  }
});
test("filtro y orden identifican por código; desaparecidas no se rellenan", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page.locator('input[placeholder="Buscar lotería"]').fill("REAL");
    assert.equal(await r.fill("NY-AM", { pick3: "005" }), false);
    await r.page.locator("th button").first().click();
    assert.equal(await r.fill("REAL", { primera: "05" }), true);
    assert.deepEqual(await r.vals("REAL"), ["05", "", "", "", ""]);
  } finally {
    await r.close();
  }
});
test("241 filas: no roba foco ni scroll al llenar, solo cambios propios", async () => {
  const r = await setup({ rows: 241 });
  try {
    await r.load();
    await r.page.locator("#work").focus();
    await r.page.evaluate(() => scrollTo(0, 80));
    const before = await r.page.evaluate(() => ({ x: scrollX, y: scrollY }));
    assert.equal(
      await r.fill("REAL", { primera: "05", segunda: "00", tercera: "09" }),
      true,
    );
    assert.equal(
      await r.page.evaluate(() => document.activeElement.id),
      "work",
    );
    assert.deepEqual(
      await r.page.evaluate(() => ({ x: scrollX, y: scrollY })),
      before,
    );
    assert.equal(await r.page.locator("tbody tr").count(), 241);
  } finally {
    await r.close();
  }
});
for (const interrupted of [false, true])
  test(`userscript completo: contrato Mango y presented sin Procesar; intervención tardía ${interrupted}`, async () => {
    const r = await setup({
      overrides: { "NY-AM": { procesado: true } },
    });
    try {
      const { readFile } = await import("node:fs/promises");
      const runtime = await readFile("Mango-Rover-React.user.js", "utf8");
      await r.page.evaluate((interrupted) => {
        window.gmCalls = [];
        window.gmMenus = {};
        const storage = { mango_react_token: "test-secret" };
        window.GM_getValue = (k, d) => storage[k] ?? d;
        window.GM_setValue = (k, v) => (storage[k] = v);
        window.GM_addValueChangeListener = () => {};
        window.GM_registerMenuCommand = (n, f) => (gmMenus[n] = f);
        window.unsafeWindow = window;
        window.exportFunction = (f) => f;
        window.alert = (message) => {
          window.gmDiagnostic = JSON.parse(message);
        };
        if (interrupted) {
          let fired = false;
          document.addEventListener("input", (event) => {
            if (!fired && event.target.closest("tr")?.dataset.code === "REAL") {
              fired = true;
              setTimeout(() => {
                const input = document.querySelector(
                  'tr[data-code="REAL"] td:nth-child(6) input',
                );
                Object.getOwnPropertyDescriptor(
                  HTMLInputElement.prototype,
                  "value",
                ).set.call(input, "77");
                input.dispatchEvent(new Event("input", { bubbles: true }));
              }, 10);
            }
          });
        }
        window.GM_xmlhttpRequest = (o) => {
          gmCalls.push({
            url: o.url,
            body: o.data ? JSON.parse(o.data) : null,
          });
          const expected = { primera: "05", segunda: "00", tercera: "09" };
          const row = {
            lottery_id: "real",
            row_key: "real|2026-10-27",
            name: "REAL",
            aliases: ["REAL"],
            draw_date: "2026-10-27",
            revision: 2,
            proc_state: "pending",
            owned_fields: ["primera", "segunda", "tercera"],
            expected_fields: expected,
            components: [{ state: "ready", expected_fields: expected }],
          };
          let data = o.url.includes("/version?")
            ? { ok: true, date: "2026-10-27", revision: 2 }
            : o.url.includes("/rows?")
              ? { contract_version: "1.0", date: "2026-10-27", rows: [row] }
              : o.url.endsWith("/reconcile")
                ? {
                    ok: true,
                    action: "paint_fields",
                    should_paint: true,
                    expected_fields: expected,
                    operation: {
                      operation_id: "op-runtime",
                      revision: 2,
                      status: "reserved",
                      expires_at: new Date(Date.now() + 60000).toISOString(),
                    },
                  }
                : { ok: true, authenticated: true };
          setTimeout(
            () => o.onload({ status: 200, responseText: JSON.stringify(data) }),
            0,
          );
        };
      }, interrupted);
      await r.page.addScriptTag({ content: runtime });
      await r.page.evaluate(() =>
        Promise.all([
          fetch("/api/loteria/resultadosLoteria2/dependientes", {
            headers: { "X-Servidor": "1" },
          }),
          fetch("/api/loteria/resultadosLoteria2/revision?fecha=10/27/2026", {
            headers: { "X-Servidor": "1" },
          }),
        ]),
      );
      await r.page.locator('form button[type="submit"]').click();
      if (interrupted) {
        await r.page.waitForFunction(
          () => {
            gmMenus["Mango React · Diagnóstico"]();
            return gmDiagnostic.errors.some(
              (error) => error.error === "write_not_retained",
            );
          },
          null,
          { timeout: 5000 },
        );
        assert.equal(
          await r.page.evaluate(() =>
            gmCalls.some((call) => call.url.endsWith("/presented")),
          ),
          false,
        );
        assert.equal((await r.vals("REAL"))[2], "77");
        assert.equal(
          await r.page
            .locator('input[data-mango-react-visual="green"]')
            .count(),
          0,
        );
        return;
      }
      await r.page.waitForFunction(
        () => window.gmCalls.some((c) => c.url.endsWith("/presented")),
        null,
        { timeout: 5000 },
      );
      assert.deepEqual(await r.vals("REAL"), ["05", "00", "09", "", ""]);
      const calls = await r.page.evaluate(() => gmCalls);
      assert.equal(calls.filter((c) => c.url.endsWith("/reconcile")).length, 1);
      assert.deepEqual(
        calls.find((c) => c.url.endsWith("/presented")).body.presented_fields,
        { primera: "05", segunda: "00", tercera: "09" },
      );
      assert.equal(
        await r.page.evaluate(() => window.mangoReactToken),
        undefined,
      );
    } finally {
      await r.close();
    }
  });
test("otro userscript en una microtarea cancela los campos restantes", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page.evaluate(() => {
      let fired = false;
      document.addEventListener("input", (e) => {
        if (!fired && e.target.closest("tr")?.dataset.code === "REAL") {
          fired = true;
          queueMicrotask(() => {
            const input = document.querySelector(
              'tr[data-code="REAL"] td:nth-child(6) input',
            );
            Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              "value",
            ).set.call(input, "77");
            input.dispatchEvent(new Event("input", { bubbles: true }));
          });
        }
      });
    });
    assert.equal(
      await r.fill("REAL", { primera: "05", segunda: "00", tercera: "09" }),
      false,
    );
    assert.deepEqual(await r.vals("REAL"), ["05", "", "77", "", ""]);
  } finally {
    await r.close();
  }
});
for (const own of [false, true])
  test(`refresco seguro conserva trabajo oculto por filtro (${own ? "Mango" : "manual"})`, async () => {
    const r = await setup();
    try {
      await r.load();
      if (own) await r.fill("REAL", { primera: "05" });
      else
        await r.page.locator('tr[data-code="REAL"] input').first().fill("99");
      await r.page
        .locator('input[placeholder="Buscar lotería"]')
        .fill("NEW YORK");
      const refreshed = await r.page.evaluate(() => {
        const OldDate = Date;
        window.Date = class extends OldDate {
          static now() {
            return OldDate.now() + 121000;
          }
        };
        return adapter.refreshIfSafe(adapter.snapshot());
      });
      assert.equal(refreshed, false);
    } finally {
      await r.close();
    }
  });
for (const own of [false, true])
  test(`Buscar conserva baseline con edición retenida (${own ? "Mango" : "manual"})`, async () => {
    const r = await setup({
      overrides: own ? {} : { REAL: { procesado: true, primera: "05" } },
    });
    try {
      await r.load();
      if (own) await r.fill("REAL", { primera: "05" });
      else
        await r.page.locator('tr[data-code="REAL"] input').first().fill("98");
      await r.load();
      assert.equal((await r.vals("REAL"))[0], own ? "05" : "98");
      assert.equal(
        await r.page.evaluate(
          () => adapter.snapshot().persisted.get("REAL").primera,
        ),
        own ? "" : "05",
      );
    } finally {
      await r.close();
    }
  });
test("diagnóstico de llenado identifica reglas, revisión, edición y dependiente sin alterar sus guards", async () => {
  const r = await setup();
  try {
    await r.load();
    const reason = () =>
      r.page.evaluate(() => {
        const snap = adapter.snapshot();
        return {
          block: adapter.fillBlock("REAL", { primera: "34" }, snap),
          canFill: adapter.canFill("REAL", { primera: "34" }, snap),
        };
      });
    assert.deepEqual(await reason(), { block: null, canFill: true });
    r.state.rules = null;
    const fetchRules = () =>
      r.page.evaluate(() =>
        fetch("/api/loteria/resultadosLoteria2/dependientes", {
          headers: { "X-Servidor": "1" },
        }).then((r) => r.json()),
      );
    await fetchRules();
    await r.page.waitForTimeout(50);
    assert.deepEqual(await reason(), {
      block: { motivo: "reglas_no_disponibles" },
      canFill: false,
    });
    r.state.rules = [{ activo: true, principal: "REAL", dependiente: "NY-BP" }];
    await fetchRules();
    await r.page.waitForTimeout(50);
    await r.page.evaluate(() => fx.values("NY-BP", { primera: "99" }));
    await r.page.waitForFunction(
      () => adapter.find("NY-BP").fields.primera === "99",
    );
    assert.deepEqual(await reason(), {
      block: { motivo: "dependiente_con_valores", dependiente: "NY-BP" },
      canFill: false,
    });
    r.state.rules = [];
    await fetchRules();
    r.state.revision = [{ loteria: "REAL", estado: "conflicto" }];
    await r.page.evaluate(() =>
      fetch("/api/loteria/resultadosLoteria2/revision?fecha=10/27/2026", {
        headers: { "X-Servidor": "1" },
      }).then((r) => r.json()),
    );
    await r.page.waitForTimeout(50);
    assert.deepEqual(await reason(), {
      block: { motivo: "conflicto_nativo" },
      canFill: false,
    });
    await r.page.locator('tr[data-code="REAL"] input').first().fill("12");
    assert.deepEqual(await reason(), {
      block: { motivo: "edicion_local" },
      canFill: false,
    });
    assert.equal(await r.fill("REAL", { primera: "34" }), false);
    assert.equal((await r.vals("REAL"))[0], "12");
  } finally {
    await r.close();
  }
});
test("aislamiento: diferencia ajena de RHOD no bloquea REAL y requiere prueba local", async () => {
  const r = await setup({
    overrides: {
      "NY-BP": {
        abrev: "RHOD-MD",
        nombre: "RHODE ISLAND MIDDAY",
        procesado: true,
        primera: "X",
        pick4: "6401",
      },
    },
  });
  try {
    await r.load();
    await r.page.evaluate(() =>
      fx.values("RHOD-MD", { primera: "XX", pick3: "XXX" }),
    );
    await r.page.waitForFunction(
      () => adapter.find("RHOD-MD").fields.primera === "XX",
    );
    assert.equal(
      await r.page.evaluate(
        () =>
          adapter.rowBlock(
            "RHOD-MD",
            ["primera", "pick4"],
            adapter.snapshot(),
            "ack",
          )?.motivo,
      ),
      "campos_distintos",
    );
    assert.equal(
      await r.fill("REAL", { primera: "05", segunda: "00", tercera: "09" }),
      true,
    );
  } finally {
    await r.close();
  }
});
test("aislamiento: Pick4 ignora campo ajeno pero protege premios derivados", async () => {
  for (const conflict of [false, true]) {
    const r = await setup();
    try {
      await r.load();
      await r.page.evaluate(
        (conflict) =>
          fx.values("NY-AM", conflict ? { segunda: "99" } : { pick3: "XXX" }),
        conflict,
      );
      await r.page.waitForTimeout(30);
      assert.equal(await r.fill("NY-AM", { pick4: "6401" }), !conflict);
      if (conflict) assert.equal((await r.vals("NY-AM"))[1], "99");
    } finally {
      await r.close();
    }
  }
});
test("aislamiento: dependencia compartida bloquea A y B pero permite C", async () => {
  const r = await setup({ rows: 4 });
  try {
    r.state.rules = [
      { activo: true, principal: "REAL", dependiente: "NY-BP", primera: "1ra" },
      {
        activo: true,
        principal: "NY-AM",
        dependiente: "NY-BP",
        primera: "1ra",
      },
    ];
    await r.page.evaluate(() =>
      fetch("/api/loteria/resultadosLoteria2/dependientes", {
        headers: { "X-Servidor": "1" },
      }),
    );
    await r.load();
    await r.page.locator('tr[data-code="NY-BP"] input').first().fill("99");
    assert.equal(await r.fill("REAL", { primera: "05" }), false);
    assert.equal(await r.fill("NY-AM", { primera: "05" }), false);
    assert.equal(await r.fill("FIX0", { primera: "05" }), true);
  } finally {
    await r.close();
  }
});
test("aislamiento: regla desconocida o dependiente filtrada no autoriza efectos inciertos", async () => {
  for (const mode of ["unknown", "filtered"]) {
    const r = await setup();
    try {
      r.state.rules = [
        {
          activo: true,
          principal: "NY-AM",
          dependiente: "NY-BP",
          primera: mode === "unknown" ? "custom" : "p4:3-4",
        },
      ];
      await r.page.evaluate(() =>
        fetch("/api/loteria/resultadosLoteria2/dependientes", {
          headers: { "X-Servidor": "1" },
        }),
      );
      await r.load();
      if (mode === "filtered")
        await r.page
          .locator('input[placeholder="Buscar lotería"]')
          .fill("NEW YORK AM");
      if (mode === "filtered") {
        await r.page.evaluate(() => {
          fx.values("NY-BP", { primera: "99" });
        });
        await r.page
          .locator('input[placeholder="Buscar lotería"]')
          .fill("NY-AM");
        await r.page.waitForTimeout(30);
      }
      assert.equal(await r.fill("NY-AM", { pick4: "1234" }), false);
      if (mode === "unknown")
        assert.equal(await r.fill("REAL", { primera: "05" }), true);
    } finally {
      await r.close();
    }
  }
});
test("aislamiento: retención fallida suspende fuente y dependiente pero no REAL", async () => {
  const r = await setup();
  try {
    await r.load();
    const epoch = await r.page.evaluate(() => adapter.snapshot().epoch);
    await r.page.evaluate(() => (window.fxIgnore = true));
    assert.equal(await r.fill("NY-AM", { pick3: "005" }), false);
    await r.page.evaluate(() => (window.fxIgnore = false));
    assert.equal(await r.fill("REAL", { primera: "05" }), true);
    assert.equal(await r.page.evaluate(() => adapter.snapshot().epoch), epoch);
    assert.equal(
      await r.page.evaluate(
        () =>
          adapter.rowBlock("NY-AM", ["pick3"], adapter.snapshot(), "fill")
            .motivo,
      ),
      "llenado_suspendido",
    );
    assert.equal(
      await r.page.evaluate(
        () =>
          adapter.rowBlock(
            "NY-BP",
            ["primera"],
            adapter.snapshot(),
            "dependency",
          ).motivo,
      ),
      "llenado_suspendido",
    );
    await r.load();
    assert.equal(
      await r.page.evaluate(() =>
        adapter.rowBlock("NY-AM", ["pick3"], adapter.snapshot(), "fill"),
      ),
      null,
    );
  } finally {
    await r.close();
  }
});
async function isolateRuntime(
  r,
  { failFirst = false, extraIncidences = 0 } = {},
) {
  r.state.rules = [];
  await r.load();
  await r.page.evaluate(
    ({ extraIncidences }) => {
      fx.values("RHOD-MD", { primera: "XX" });
      for (let i = 0; i < extraIncidences; i++)
        fx.values("FIX" + i, { primera: "99" });
    },
    { extraIncidences },
  );
  await r.page.waitForFunction(
    () => adapter.find("RHOD-MD").fields.primera === "XX",
  );
  await r.page.evaluate(
    ({ failFirst }) => {
      const store = {
        mango_react_token: "isolation-test-secret",
        mango_react_client: "isolated-test-pc",
      };
      window.GM_getValue = (k, d) => store[k] ?? d;
      window.GM_setValue = (k, v) => (store[k] = v);
      window.gmMenus = {};
      window.gmCalls = [];
      window.isoReady = false;
      window.GM_registerMenuCommand = (k, f) => (gmMenus[k] = f);
      window.unsafeWindow = window;
      window.exportFunction = (f) => f;
      window.alert = (s) => {
        window.gmDiagnostic = JSON.parse(s);
      };
      if (failFirst)
        document.addEventListener(
          "input",
          (e) => {
            if (e.target.closest("tr"))
              window.fxIgnore = e.target.closest("tr").dataset.code === "REAL";
          },
          true,
        );
      window.GM_xmlhttpRequest = (o) => {
        const body = o.data ? JSON.parse(o.data) : null;
        gmCalls.push({ url: o.url, body });
        const expected = { primera: "05", segunda: "00", tercera: "09" };
        const revision = isoReady ? 3 : 2;
        const rows = [
          ["real", "REAL"],
          ["anguilla8pm", "ANG-8PM"],
        ].map(([id, code]) => ({
          lottery_id: id,
          row_key: id + "|2026-10-27",
          name: code,
          aliases: [code],
          draw_date: "2026-10-27",
          revision,
          proc_state: "pending",
          owned_fields: ["primera", "segunda", "tercera"],
          expected_fields: isoReady ? expected : {},
          components: [
            {
              state: isoReady ? "ready" : "awaiting_result",
              expected_fields: isoReady ? expected : {},
            },
          ],
          visual: { state: isoReady ? null : "blue" },
        }));
        const data = o.url.includes("/version?")
          ? { ok: true, date: "2026-10-27", revision }
          : o.url.includes("/rows?")
            ? { contract_version: "1.0", date: "2026-10-27", rows }
            : o.url.endsWith("/reconcile")
              ? {
                  action: "paint_fields",
                  should_paint: true,
                  expected_fields: expected,
                  operation: {
                    operation_id: "iso-" + body.lottery_id,
                    revision,
                    status: "reserved",
                    expires_at: new Date(Date.now() + 60000).toISOString(),
                  },
                }
              : { ok: true };
        setTimeout(
          () => o.onload({ status: 200, responseText: JSON.stringify(data) }),
          0,
        );
      };
    },
    { failFirst },
  );
  await r.page.addScriptTag({
    content: await readFile("Mango-Rover-React.user.js", "utf8"),
  });
  await r.page.evaluate(() =>
    Promise.all([
      fetch("/api/loteria/resultadosLoteria2/dependientes", {
        headers: { "X-Servidor": "1" },
      }),
      fetch("/api/loteria/resultadosLoteria2/revision?fecha=10/27/2026", {
        headers: { "X-Servidor": "1" },
      }),
    ]),
  );
  await r.load();
  await r.page.waitForFunction(
    () =>
      document.querySelectorAll('input[data-mango-react-visual="blue"]')
        .length === 6,
  );
}
for (const failFirst of [false, true])
  test(`runtime aislado: RHOD ajena y retención fallida ${failFirst}`, async () => {
    const r = await setup({
      overrides: {
        "NY-AM": { abrev: "ANG-8PM", nombre: "ANGUILLA 8PM" },
        "NY-BP": {
          abrev: "RHOD-MD",
          nombre: "RHODE ISLAND MIDDAY",
          procesado: true,
          primera: "X",
          pick4: "6401",
        },
      },
    });
    try {
      await isolateRuntime(r, { failFirst });
      await r.page.evaluate(() => {
        gmMenus["Mango React · Diagnóstico"]();
      });
      const initial = await r.page.evaluate(() => gmDiagnostic);
      assert.equal(initial.incidencias_tabla[0].codigo, "RHOD-MD");
      assert.equal(initial.fecha_verificada, "2026-10-27");
      assert.equal(initial.token_estado, "válido");
      await r.page.evaluate(() => {
        isoReady = true;
        const Before = Date;
        window.Date = class extends Before {
          static now() {
            return Before.now() + 6000;
          }
        };
        fx.render();
      });
      await r.page.waitForFunction(
        () =>
          gmCalls.filter((c) => c.url.endsWith("/presented")).length ===
          (window.fxIgnore === undefined ? 2 : 1),
        null,
        { timeout: 7000 },
      );
      await r.page.evaluate(() => gmMenus["Mango React · Diagnóstico"]());
      const result = await r.page.evaluate(() => ({
        diag: gmDiagnostic,
        calls: gmCalls,
      }));
      assert.equal(result.diag.filas_verificadas, failFirst ? 1 : 2);
      assert.equal(result.diag.fecha_verificada, "2026-10-27");
      assert.equal(
        result.calls.filter((c) => c.url.endsWith("/presented")).length,
        failFirst ? 1 : 2,
      );
      assert.ok(
        result.calls
          .filter((c) => c.body?.lottery_id)
          .every((c) => ["real", "anguilla8pm"].includes(c.body.lottery_id)),
      );
      assert.deepEqual((await r.vals("ANG-8PM")).slice(0, 3), [
        "05",
        "00",
        "09",
      ]);
      assert.deepEqual(await r.vals("RHOD-MD"), ["XX", "", "", "", "6401"]);
      assert.equal(
        result.calls.some((c) => c.url.endsWith("/ack")),
        false,
      );
    } finally {
      await r.close();
    }
  });
test("runtime aislado: diagnóstico acotado a 20 incidencias y contexto nuevo limpia", async () => {
  const r = await setup({
    rows: 27,
    overrides: {
      "NY-AM": { abrev: "ANG-8PM" },
      "NY-BP": {
        abrev: "RHOD-MD",
        procesado: true,
        primera: "X",
        pick4: "6401",
      },
    },
  });
  try {
    await isolateRuntime(r, { extraIncidences: 24 });
    await r.page.evaluate(() => gmMenus["Mango React · Diagnóstico"]());
    const d = await r.page.evaluate(() => gmDiagnostic);
    assert.equal(d.incidencias_tabla_total, 25);
    assert.equal(d.incidencias_tabla.length, 20);
    assert.ok(!JSON.stringify(d).includes("isolation-test-secret"));
    const calls = await r.page.evaluate(() => gmCalls.length);
    await r.page.evaluate(() => gmMenus["Mango React · Diagnóstico"]());
    assert.equal(await r.page.evaluate(() => gmCalls.length), calls);
    await r.page.evaluate(() => fx.setDate("26 oct 2026"));
    await r.page.waitForTimeout(230);
    await r.page.evaluate(() => gmMenus["Mango React · Diagnóstico"]());
    assert.deepEqual(
      await r.page.evaluate(() => gmDiagnostic.incidencias_tabla),
      [],
    );
    assert.equal(
      await r.page.evaluate(() => gmDiagnostic.incidencias_tabla_total),
      0,
    );
  } finally {
    await r.close();
  }
});
for (const mode of ["rules", "dependent", "between", "after_fill"])
  test(`guard asíncrono: ${mode} cancela NY y conserva REAL`, async () => {
    const r = await setup();
    try {
      await r.load();
      const result = await r.page.evaluate(async (mode) => {
        const calls = [];
        let fired = false;
        document.addEventListener("input", (e) => {
          if (fired || e.target.closest("tr")?.dataset.code !== "NY-AM") return;
          fired = true;
          if (mode === "rules")
            queueMicrotask(() => {
              adapter.onNative({
                type: "start",
                kind: "rules",
                id: 900,
                serverId: "1",
              });
              adapter.onNative({
                type: "success",
                kind: "rules",
                id: 900,
                serverId: "1",
                data: {
                  reglas: [
                    {
                      activo: true,
                      principal: "NY-AM",
                      dependiente: "NY-BP",
                      primera: "custom",
                    },
                  ],
                },
              });
            });
          if (mode === "dependent")
            setTimeout(() => fx.values("NY-BP", { primera: "99" }), 10);
          if (mode === "between")
            queueMicrotask(() => fx.values("NY-BP", { primera: "99" }));
        });
        if (mode === "after_fill") {
          const fill = adapter.fill;
          adapter.fill = async (...args) => {
            const ok = await fill(...args);
            if (args[0] === "NY-AM") {
              fx.values("NY-BP", { primera: "99" });
              await Promise.resolve();
            }
            return ok;
          };
        }
        const expected = { pick3: "005", pick4: "0123" };
        const ny = {
          lottery_id: "ny",
          row_key: "ny|2026-10-27",
          name: "NY-AM",
          aliases: ["NY-AM"],
          draw_date: "2026-10-27",
          revision: 2,
          proc_state: "pending",
          owned_fields: ["pick3", "pick4"],
          expected_fields: expected,
        };
        const real = {
          ...ny,
          lottery_id: "real",
          row_key: "real|2026-10-27",
          name: "REAL",
          aliases: ["REAL"],
          owned_fields: ["primera"],
          expected_fields: { primera: "05" },
        };
        const api = {
          post: async (path, body) => {
            calls.push({ path, body });
            const exp = body.lottery_id === "ny" ? expected : { primera: "05" };
            return path.endsWith("reconcile")
              ? {
                  should_paint: true,
                  action: "paint_fields",
                  expected_fields: exp,
                  operation: {
                    operation_id: body.lottery_id,
                    status: "reserved",
                    revision: 2,
                    expires_at: new Date(Date.now() + 60000).toISOString(),
                  },
                }
              : { ok: true };
          },
        };
        const d = createDelivery({ central: adapter, api, clientId: "test" });
        await d.cycle([ny, real], adapter.snapshot());
        return {
          calls,
          source: adapter.find("NY-AM").fields,
          dependent: adapter.find("NY-BP").fields,
          real: adapter.find("REAL").fields,
          diagnostics: d.diagnostics(),
          context: !!adapter.snapshot(),
        };
      }, mode);
      assert.deepEqual(
        result.calls
          .filter((c) => c.path.endsWith("/presented"))
          .map((c) => c.body.operation_id),
        ["real"],
      );
      assert.equal(result.real.primera, "05");
      assert.equal(result.diagnostics.filas_verificadas, 1);
      assert.equal(result.context, true);
      if (mode !== "rules")
        assert.equal(
          result.dependent.primera,
          "99",
          "no sobrescribe el cambio ajeno",
        );
      if (["rules", "between"].includes(mode))
        assert.equal(result.source.pick4, "", "detiene las entradas restantes");
    } finally {
      await r.close();
    }
  });
test("prueba parcial: nueva revisión amplía campos propios sin bloquear valores ya retenidos", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page.evaluate(() => fx.values("REAL", { pick4: "XXXX" }));
    await r.page.waitForTimeout(30);
    await r.load();
    const out = await r.page.evaluate(async () => {
      const calls = [];
      let expected = { primera: "05" },
        revision = 2;
      const row = () => ({
        lottery_id: "real",
        row_key: "real|2026-10-27",
        name: "REAL",
        draw_date: "2026-10-27",
        revision,
        proc_state: "pending",
        expected_fields: expected,
      });
      const api = {
        post: async (path, body) => {
          calls.push({ path, body });
          return path.endsWith("reconcile")
            ? {
                should_paint: true,
                action: "paint_fields",
                expected_fields: expected,
                operation: {
                  operation_id: "partial" + revision,
                  status: "reserved",
                  revision,
                  expires_at: new Date(Date.now() + 60000).toISOString(),
                },
              }
            : { ok: true };
        },
      };
      const d = createDelivery({ central: adapter, api, clientId: "test" });
      await d.cycle([row()], adapter.snapshot());
      const first = {
        fields: adapter.find("REAL").fields,
        proof: adapter.snapshot().verifiedRows.get("REAL"),
      };
      expected = { primera: "05", segunda: "06" };
      revision = 3;
      await d.cycle([row()], adapter.snapshot());
      return {
        first,
        fields: adapter.find("REAL").fields,
        diagnostics: d.diagnostics(),
        calls,
      };
    });
    assert.deepEqual(out.first.proof.keys, ["primera"]);
    assert.equal(out.first.fields.primera, "05");
    assert.equal(out.fields.segunda, "06");
    assert.equal(out.fields.pick4, "XXXX");
    assert.deepEqual(
      out.calls
        .filter((c) => c.path.endsWith("/presented"))
        .map((c) => c.body.revision),
      [2, 3],
    );
    assert.deepEqual(out.diagnostics.errors, []);
    assert.deepEqual(out.diagnostics.omitidas, []);
  } finally {
    await r.close();
  }
});
for (const filter of ["NEW YORK", "NO EXISTE"])
  test(`colores: verde sobrevive filtro ${filter} sin repetir entrega`, async () => {
    const r = await setup();
    try {
      await waitingRuntime(r);
      await r.page.evaluate(() => {
        const Before = Date;
        window.Date = class extends Before {
          static now() {
            return Before.now() + 6000;
          }
        };
        gmWaitingState = "ready";
        gmExpected = { primera: "05", segunda: "00", tercera: "09" };
        gmReconcileData = {
          should_paint: true,
          action: "paint_fields",
          expected_fields: gmExpected,
          operation: {
            operation_id: "green-filter",
            status: "reserved",
            revision: 3,
            expires_at: new Date(Date.now() + 60000).toISOString(),
          },
        };
        fx.render();
      });
      await r.page.waitForFunction(() =>
        gmCalls.some((c) => c.url.endsWith("/presented")),
      );
      assert.equal(
        await r.page.locator('input[data-mango-react-visual="green"]').count(),
        3,
      );
      const requests = await r.page.evaluate(() => gmCalls.length);
      const search = r.page.locator('input[placeholder="Buscar lotería"]');
      await search.fill(filter);
      await r.page
        .locator('tr[data-code="REAL"]')
        .waitFor({ state: "detached" });
      await r.page.waitForTimeout(250);
      await search.fill("REAL");
      await r.page
        .locator('tr[data-code="REAL"] input[data-mango-react-visual="green"]')
        .first()
        .waitFor({ timeout: 700 });
      assert.equal(
        await r.page
          .locator('tr[data-code="REAL"] input')
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor),
        "rgb(212, 237, 218)",
      );
      assert.deepEqual(await r.vals("REAL"), ["05", "00", "09", "", ""]);
      assert.equal(await r.page.evaluate(() => gmCalls.length), requests);
      await r.page.waitForTimeout(2100);
      assert.equal(
        await r.page.locator('input[data-mango-react-visual="green"]').count(),
        0,
      );
    } finally {
      await r.close();
    }
  });
test("colores: vigilancia nueva sale del modo lento sin cambiar la revisión global", async () => {
  const r = await setup();
  try {
    await waitingRuntime(r);
    await r.page.evaluate(() => {
      gmWaitingState = "processed";
      gmRevision = 3;
      const Before = Date;
      window.Date = class extends Before {
        static now() {
          return Before.now() + 3606000;
        }
      };
      fx.render();
    });
    await r.page.waitForFunction(() => {
      gmMenus["Mango React · Diagnóstico"]();
      return (
        gmDiagnostic.intervalo_segundos === 120 &&
        gmCalls.filter((c) => c.url.includes("/rows?")).length >= 2
      );
    });
    await r.page.evaluate(() => {
      gmWaitingState = "awaiting_result";
      const Before = Date;
      window.Date = class extends Before {
        static now() {
          return Before.now() + 16000;
        }
      };
      document.querySelector('tr[data-code="REAL"]').cells[2].textContent =
        "2:03 PM";
      fx.render();
    });
    await r.page
      .locator('tr[data-code="REAL"] input[data-mango-react-visual="blue"]')
      .first()
      .waitFor({ timeout: 1800 });
    assert.ok(
      await r.page.evaluate(
        () => gmCalls.filter((c) => c.url.includes("/rows?")).length >= 3,
      ),
    );
    assert.equal(
      await r.page.evaluate(() =>
        gmCalls.some((c) => c.url.endsWith("/reconcile")),
      ),
      false,
    );
  } finally {
    await r.close();
  }
});
for (const edit of [false, true])
  test(`colores: publicación persistida libera refresco salvo edición nueva ${edit}`, async () => {
    const r = await setup();
    try {
      await r.load();
      await r.fill("REAL", { primera: "05" });
      r.state.overrides.REAL = { procesado: true, primera: "05" };
      await r.load();
      if (edit)
        await r.page.locator('tr[data-code="REAL"] input').first().fill("98");
      const refreshed = await r.page.evaluate(() => {
        const Before = Date;
        window.Date = class extends Before {
          static now() {
            return Before.now() + 121000;
          }
        };
        return adapter.refreshIfSafe(adapter.snapshot());
      });
      assert.equal(refreshed, !edit);
    } finally {
      await r.close();
    }
  });
test("colores: ventana cercana respeta los 30 segundos de espera tras error", async () => {
  const r = await setup();
  try {
    await waitingRuntime(r);
    await r.page.evaluate(() => {
      const original = GM_xmlhttpRequest;
      window.GM_xmlhttpRequest = (o) => {
        if (o.url.includes("/version?")) {
          gmCalls.push({ url: o.url });
          setTimeout(() => o.onerror(), 0);
        } else original(o);
      };
      const Before = Date;
      window.Date = class extends Before {
        static now() {
          return Before.now() + 6000;
        }
      };
      fx.render();
    });
    await r.page.waitForFunction(() => {
      gmMenus["Mango React · Diagnóstico"]();
      return (
        gmDiagnostic.ultimo_error === "network_error" &&
        gmDiagnostic.intervalo_segundos === 30
      );
    });
    const calls = await r.page.evaluate(() => gmCalls.length);
    await r.page.evaluate(() => {
      const Before = Date;
      window.Date = class extends Before {
        static now() {
          return Before.now() + 6000;
        }
      };
      fx.render();
    });
    await r.page.waitForTimeout(500);
    assert.equal(await r.page.evaluate(() => gmCalls.length), calls);
    await r.page.evaluate(() => {
      const Before = Date;
      window.Date = class extends Before {
        static now() {
          return Before.now() + 25000;
        }
      };
      fx.render();
    });
    await r.page.waitForFunction((before) => gmCalls.length > before, calls);
  } finally {
    await r.close();
  }
});
test("colores: Buscar rápido no hereda el verde de una carga anterior", async () => {
  const r = await setup();
  try {
    await r.page.evaluate(() => {
      const interval = setInterval;
      window.setInterval = (fn, ms, ...args) =>
        ms === 1000 ? ((window.colorTick = fn), 0) : interval(fn, ms, ...args);
    });
    await waitingRuntime(r);
    await r.page.evaluate(() => {
      const Before = Date;
      window.Date = class extends Before {
        static now() {
          return Before.now() + 6000;
        }
      };
      gmWaitingState = "ready";
      gmExpected = { primera: "05", segunda: "00", tercera: "09" };
      gmReconcileData = {
        should_paint: true,
        action: "paint_fields",
        expected_fields: gmExpected,
        operation: {
          operation_id: "green-scope",
          status: "reserved",
          revision: 3,
          expires_at: new Date(Date.now() + 60000).toISOString(),
        },
      };
      colorTick();
    });
    await r.page.waitForFunction(() =>
      gmCalls.some((c) => c.url.endsWith("/presented")),
    );
    assert.equal(
      await r.page.locator('input[data-mango-react-visual="green"]').count(),
      3,
    );
    await r.page.evaluate(() => document.querySelector("form").requestSubmit());
    await r.page.waitForTimeout(400);
    assert.equal(
      await r.page.locator('input[data-mango-react-visual="green"]').count(),
      0,
    );
    assert.deepEqual(await r.vals("REAL"), ["05", "00", "09", "", ""]);
  } finally {
    await r.close();
  }
});
test("colores: dependiente pendiente oculta bloquea refresco tras publicar la principal", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.fill("NY-AM", { pick4: "1234" });
    r.state.overrides["NY-AM"] = {
      procesado: true,
      pick4: "1234",
      segunda: "12",
      tercera: "34",
    };
    await r.load();
    for (const filter of ["NO EXISTE", "NY-AM"]) {
      await r.page.locator('input[placeholder="Buscar lotería"]').fill(filter);
      await r.page.waitForTimeout(30);
      const refresh = await r.page.evaluate(() => {
        const Before = Date;
        window.Date = class extends Before {
          static now() {
            return Before.now() + 121000;
          }
        };
        return adapter.refreshIfSafe(adapter.snapshot());
      });
      assert.equal(refresh, false, filter);
    }
    await r.page.locator('input[placeholder="Buscar lotería"]').fill("");
    assert.deepEqual(await r.vals("NY-BP"), ["34", "X", "X", "", ""]);
    r.state.overrides["NY-BP"] = {
      procesado: true,
      primera: "34",
      segunda: "X",
      tercera: "X",
    };
    await r.load();
    assert.equal(
      await r.page.evaluate(() => adapter.refreshIfSafe(adapter.snapshot())),
      true,
    );
  } finally {
    await r.close();
  }
});
let failed = 0;
try {
  for (const { name, fn } of tests.filter(
    (t) =>
      !process.env.MANGO_TEST_FILTER ||
      new RegExp(process.env.MANGO_TEST_FILTER).test(t.name),
  )) {
    try {
      await fn();
      console.log("PASS", name);
    } catch (e) {
      failed++;
      console.error("FAIL", name, e.message);
    }
  }
} finally {
  await browser.close();
  server.close();
}
const executed = tests.filter(
  (t) =>
    !process.env.MANGO_TEST_FILTER ||
    new RegExp(process.env.MANGO_TEST_FILTER).test(t.name),
).length;
console.log(`${executed - failed}/${executed} Firefox scenarios`);
if (failed) process.exitCode = 1;
