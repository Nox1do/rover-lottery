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
      contents: `import {createCentralAdapter} from './src/central.js';import {installNativeObserver} from './src/native.js';window.adapter=createCentralAdapter(document,window);installNativeObserver(window,f=>f,e=>window.adapter.onNative(e));`,
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
async function waitingRuntime(r) {
  await r.page.evaluate(() => {
    window.gmCalls = [];
    window.gmMenus = {};
    window.gmWaitingState = "awaiting_result";
    window.gmHoldVersion = false;
    window.gmHeldRequests = [];
    const storage = { mango_react_token: "test-secret" };
    window.GM_getValue = (key, fallback) => storage[key] ?? fallback;
    window.GM_setValue = (key, value) => (storage[key] = value);
    window.GM_addValueChangeListener = () => {};
    window.GM_registerMenuCommand = (name, fn) => (gmMenus[name] = fn);
    window.unsafeWindow = window;
    window.exportFunction = (fn) => fn;
    window.alert = () => {};
    window.GM_xmlhttpRequest = (options) => {
      gmCalls.push({ url: options.url, body: options.data });
      let data;
      if (options.url.includes("/version?"))
        data = {
          ok: true,
          date: "2026-10-27",
          revision: gmWaitingState === "awaiting_result" ? 2 : 3,
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
              revision: gmWaitingState === "awaiting_result" ? 2 : 3,
              proc_state:
                gmWaitingState === "processed" ? "processed" : "pending",
              owned_fields: ["primera", "segunda", "tercera"],
              expected_fields: {},
              components: [{ state: gmWaitingState, expected_fields: {} }],
              visual: {
                state: gmWaitingState === "awaiting_result" ? "blue" : null,
              },
            },
          ],
        };
      else throw Error("Unexpected Mango request: " + options.url);
      const finish = () =>
        options.onload({ status: 200, responseText: JSON.stringify(data) });
      if (gmHoldVersion && options.url.includes("/version?"))
        gmHeldRequests.push(finish);
      else setTimeout(finish, 0);
    };
  });
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
    .locator('tr[data-code="REAL"] input[data-mango-react-visual="blue"]')
    .first()
    .waitFor();
}
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
test("código realmente ajeno bloquea y muestra su identidad en diagnóstico", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page
      .locator('tr[data-code="REAL"] [data-slot="badge"]')
      .evaluate((badge) => (badge.textContent = "DESCONOCIDA"));
    await r.page.locator('form button[type="submit"]').click();
    await r.page.waitForFunction(() => !adapter.view().busy);
    await r.page.waitForTimeout(150);
    assert.equal(await r.page.evaluate(() => adapter.snapshot()), null);
    assert.match(await r.page.evaluate(() => adapter.message), /DESCONOCIDA/);
    assert.equal(await r.fill("NY-AM", { pick3: "005" }), "context_changed");
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
test("PROC desconocido bloquea aunque el color y Status indiquen éxito", async () => {
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
    assert.equal(await r.page.evaluate(() => adapter.snapshot()), null);
    assert.equal(await r.fill("NY-AM", { pick3: "005" }), "context_changed");
    assert.deepEqual(await r.vals("NY-AM"), ["", "", "", "", ""]);
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
test("userscript completo: contrato Mango, GM privado y presented sin Procesar", async () => {
  const r = await setup({
    overrides: { "NY-AM": { procesado: true } },
  });
  try {
    const { readFile } = await import("node:fs/promises");
    const runtime = await readFile("Mango-Rover-React.user.js", "utf8");
    await r.page.evaluate(() => {
      window.gmCalls = [];
      window.gmMenus = {};
      const storage = { mango_react_token: "test-secret" };
      window.GM_getValue = (k, d) => storage[k] ?? d;
      window.GM_setValue = (k, v) => (storage[k] = v);
      window.GM_addValueChangeListener = () => {};
      window.GM_registerMenuCommand = (n, f) => (gmMenus[n] = f);
      window.unsafeWindow = window;
      window.exportFunction = (f) => f;
      window.GM_xmlhttpRequest = (o) => {
        gmCalls.push({ url: o.url, body: o.data ? JSON.parse(o.data) : null });
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
    });
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
test("otro userscript durante el llenado cancela los campos restantes", async () => {
  const r = await setup();
  try {
    await r.load();
    await r.page.evaluate(() => {
      let fired = false;
      document.addEventListener("input", (e) => {
        if (!fired && e.target.closest("tr")?.dataset.code === "REAL") {
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
let failed = 0;
try {
  for (const { name, fn } of tests) {
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
console.log(`${tests.length - failed}/${tests.length} Firefox scenarios`);
if (failed) process.exitCode = 1;
