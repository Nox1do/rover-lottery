// Real Firefox extension sandbox exercises Xrays/exportFunction; GM is simulated.
import { clockSource } from "./time.mjs";
import { firefox } from "playwright";
import { build } from "esbuild";
import { createServer } from "node:http";
import net from "node:net";
import { mkdtemp, writeFile, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
const fixture = (
  await build({
    entryPoints: ["tests/fixture.jsx"],
    bundle: true,
    write: false,
    format: "iife",
  })
).outputFiles[0].text;
const temp = await mkdtemp(path.join(tmpdir(), "mango-firefox-")),
  addon = path.join(temp, "addon");
await mkdir(addon);
await writeFile(
  path.join(addon, "manifest.json"),
  JSON.stringify({
    manifest_version: 2,
    name: "Mango sandbox compatibility test",
    version: "1.0",
    browser_specific_settings: { gecko: { id: "mango-sandbox@example.test" } },
    permissions: ["http://127.0.0.1/*"],
    content_scripts: [
      {
        matches: ["http://127.0.0.1/*"],
        run_at: "document_start",
        js: ["content.js"],
      },
    ],
  }),
);
const gm = `const unsafeWindow=window.wrappedJSObject;const store={mango_react_token:'isolated-secret'};function GM_getValue(k,d){return store[k]??d;}function GM_setValue(k,v){store[k]=v;}function GM_addValueChangeListener(){}function GM_registerMenuCommand(n,f){if(n.includes('Diagnóstico'))document.addEventListener('mango-test-diagnostic',()=>f());}window.alert=message=>document.documentElement.dataset.mangoDiagnostic=message;function GM_xmlhttpRequest(o){const dependency=location.search.includes('sandbox-dependency');const fields=dependency?{pick3:'005',pick4:'0123'}:{primera:'05',segunda:'00',tercera:'09'};const code=dependency?'NY-AM':'REAL';const row={lottery_id:code,row_key:code+'|2026-10-27',name:code,aliases:[code],draw_date:'2026-10-27',revision:2,proc_state:'pending',owned_fields:Object.keys(fields),expected_fields:fields,components:[{state:'ready',expected_fields:fields}]};let data=o.url.includes('/version?')?{ok:true,date:'2026-10-27',revision:2}:o.url.includes('/rows?')?{contract_version:'1.0',date:'2026-10-27',rows:[row]}:o.url.endsWith('/reconcile')?{ok:true,action:'paint_fields',should_paint:true,expected_fields:fields,operation:{operation_id:'sandbox-op',revision:2,status:'reserved',expires_at:new Date(Date.now()+60000).toISOString()}}:{ok:true};if(o.url.endsWith('/presented'))document.documentElement.dataset.mangoSandboxPresented=o.data;setTimeout(()=>o.onload({status:200,responseText:JSON.stringify(data)}),0);}\n`;
await writeFile(
  path.join(addon, "content.js"),
  clockSource("lexical") +
    gm +
    (await readFile("Mango-Rover-React.user.js", "utf8")),
);
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "text/html");
  if (req.url === "/fixture.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(fixture);
    return;
  }
  if (req.url.startsWith("/api/")) {
    res.setHeader("Content-Type", "application/json");
    if (req.url.includes("/dependientes"))
      res.end(
        JSON.stringify({
          reglas: [
            {
              activo: true,
              principal: "NY-AM",
              dependiente: "NY-BP",
              primera: "p4:3-4",
              segunda: "X",
              tercera: "X",
            },
          ],
        }),
      );
    else if (req.url.includes("/revision")) res.end('{"revisiones":[]}');
    else {
      res.end(
        JSON.stringify({
          fecha: "10/27/2026",
          filas: [
            ["REAL", "REAL"],
            ["NEW YORK AM", "NY-AM"],
            ["NEW YORK AM BP", "NY-BP"],
          ].map(([nombre, abrev]) => ({
            nombre,
            abrev,
            procesado: false,
            primera: "",
            segunda: "",
            tercera: "",
            pick3: "",
            pick4: "",
          })),
        }),
      );
    }
    return;
  }
  res.end(
    '<!doctype html><html><head></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>',
  );
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const alloc = net.createServer();
await new Promise((r) => alloc.listen(0, "127.0.0.1", r));
const port = alloc.address().port;
await new Promise((r) => alloc.close(r));
const browser = await firefox.launch({
  headless: true,
  args: ["-start-debugger-server", String(port)],
  env: { ...process.env, MOZ_DISABLE_CONTENT_SANDBOX: "1" },
  firefoxUserPrefs: {
    "security.sandbox.content.level": 0,
    "fission.autostart": false,
    "devtools.debugger.remote-enabled": true,
    "devtools.debugger.prompt-connection": false,
  },
});
let socket;
try {
  socket = net.connect(port, "127.0.0.1");
  socket.setTimeout(10000, () =>
    socket.destroy(new Error("Firefox RDP timeout")),
  );
  socket.on("error", (error) => console.error(error.message));
  let buffer = Buffer.alloc(0),
    queue = [],
    waiters = [];
  function take(message) {
    if (waiters.length) waiters.shift()(message);
    else queue.push(message);
  }
  socket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const colon = buffer.indexOf(":");
      if (colon < 0) break;
      const size = Number(buffer.subarray(0, colon).toString());
      if (buffer.length < colon + 1 + size) break;
      take(JSON.parse(buffer.subarray(colon + 1, colon + 1 + size).toString()));
      buffer = buffer.subarray(colon + 1 + size);
    }
  });
  const receive = () =>
    queue.length
      ? Promise.resolve(queue.shift())
      : new Promise((r) => waiters.push(r));
  async function request(data) {
    const payload = JSON.stringify(data);
    socket.write(Buffer.byteLength(payload) + ":" + payload);
    while (true) {
      const msg = await receive();
      if (msg.from === data.to && !msg.type) {
        if (msg.error) throw Error(JSON.stringify(msg));
        return msg;
      }
    }
  }
  await receive();
  const root = await request({ to: "root", type: "getRoot" });
  assert.ok(root.addonsActor);
  await request({
    to: root.addonsActor,
    type: "installTemporaryAddon",
    addonPath: addon,
    openDevTools: false,
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    "http://127.0.0.1:" + server.address().port + "/loteria/resultados/ver",
  );
  await page.waitForFunction(() => !!window.fx);
  await page.locator('form button[type="submit"]').click();
  await page
    .waitForFunction(
      () => !!document.documentElement.dataset.mangoSandboxPresented,
      null,
      { timeout: 6000 },
    )
    .catch(async (e) => {
      await page.evaluate(() =>
        document.dispatchEvent(new Event("mango-test-diagnostic")),
      );
      console.log(
        "SANDBOX DEBUG",
        await page.evaluate(() => ({
          ...document.documentElement.dataset,
          values: document.querySelector("table")?.textContent,
        })),
        errors,
      );
      throw e;
    });
  assert.deepEqual(
    await page
      .locator('tr[data-code="REAL"] input')
      .evaluateAll((xs) => xs.map((x) => x.value)),
    ["05", "00", "09", "", ""],
  );
  assert.equal(
    await page.evaluate(() => typeof GM_xmlhttpRequest),
    "undefined",
  );
  assert.equal(await page.evaluate(() => typeof store), "undefined");
  assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => window.processClicks || 0), 0);
  console.log(
    "PASS Firefox isolated extension: exportFunction, original fetch response, React retained fill, presented; privileged GM/token unavailable to page",
  );
  const interrupted = await browser.newPage();
  interrupted.on("pageerror", (error) => errors.push(error.message));
  await interrupted.goto(
    "http://127.0.0.1:" + server.address().port + "/loteria/resultados/ver",
  );
  await interrupted.waitForFunction(() => !!window.fx);
  await interrupted.evaluate(() => {
    let fired = false;
    document.addEventListener("input", (event) => {
      if (!fired && event.target.closest("tr")?.dataset.code === "REAL") {
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
  await interrupted.locator('form button[type="submit"]').click();
  await interrupted.waitForFunction(
    () => {
      document.dispatchEvent(new Event("mango-test-diagnostic"));
      const raw = document.documentElement.dataset.mangoDiagnostic;
      return (
        raw &&
        JSON.parse(raw).errors.some(
          (error) => error.error === "write_not_retained",
        )
      );
    },
    null,
    { timeout: 6000 },
  );
  assert.deepEqual(
    await interrupted
      .locator('tr[data-code="REAL"] input')
      .evaluateAll((inputs) => inputs.map((input) => input.value)),
    ["05", "", "77", "", ""],
  );
  assert.equal(
    await interrupted.evaluate(
      () => document.documentElement.dataset.mangoSandboxPresented,
    ),
    undefined,
  );
  assert.equal(await interrupted.evaluate(() => window.processClicks || 0), 0);
  assert.deepEqual(errors, []);
  console.log(
    "PASS Firefox isolated extension: page microtask intervention stops remaining fields and prevents presented",
  );
  for (const interrupt of [false, true]) {
    const dependent = await browser.newPage();
    dependent.on("pageerror", (e) => errors.push(e.message));
    await dependent.goto(
      "http://127.0.0.1:" +
        server.address().port +
        "/loteria/resultados/ver?sandbox-dependency=1",
    );
    await dependent.waitForFunction(() => !!window.fx);
    if (interrupt)
      await dependent.evaluate(() => {
        let fired = false;
        document.addEventListener("input", (e) => {
          if (fired || e.target.closest("tr")?.dataset.code !== "NY-AM") return;
          fired = true;
          queueMicrotask(() => fx.values("NY-BP", { primera: "99" }));
        });
      });
    await dependent.locator('form button[type="submit"]').click();
    if (interrupt) {
      await dependent.waitForFunction(
        () => {
          document.dispatchEvent(new Event("mango-test-diagnostic"));
          const raw = document.documentElement.dataset.mangoDiagnostic;
          return (
            raw &&
            JSON.parse(raw).errors.some((e) => e.error === "write_not_retained")
          );
        },
        null,
        { timeout: 6000 },
      );
      assert.equal(
        await dependent
          .locator('tr[data-code="NY-BP"] input')
          .first()
          .inputValue(),
        "99",
      );
      assert.equal(
        await dependent.evaluate(
          () => document.documentElement.dataset.mangoSandboxPresented,
        ),
        undefined,
      );
    } else {
      await dependent.waitForFunction(
        () => !!document.documentElement.dataset.mangoSandboxPresented,
        null,
        { timeout: 6000 },
      );
      assert.deepEqual(
        await dependent
          .locator('tr[data-code="NY-AM"] input')
          .evaluateAll((inputs) => inputs.map((i) => i.value)),
        ["05", "01", "23", "005", "0123"],
      );
      assert.equal(
        await dependent
          .locator('tr[data-code="NY-BP"] input')
          .first()
          .inputValue(),
        "23",
      );
    }
    assert.equal(
      await dependent.evaluate(() => typeof GM_xmlhttpRequest),
      "undefined",
    );
    assert.equal(await dependent.evaluate(() => window.processClicks || 0), 0);
    assert.deepEqual(errors, []);
    console.log(
      "PASS Firefox isolated extension: dependent queue and retained effects, interrupted " +
        interrupt,
    );
    await dependent.close();
  }
} finally {
  socket?.destroy();
  await browser.close();
  server.close();
}
