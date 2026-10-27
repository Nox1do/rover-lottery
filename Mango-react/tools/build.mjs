import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const meta = JSON.parse(await readFile("metadata.json", "utf8"));
const base =
  "https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Mango-react/";
const header = `// ==UserScript==\n// @name         ${meta.name}\n// @namespace    ${meta.namespace}\n// @version      ${meta.version}\n// @description  ${meta.description}\n// @match        https://central.roversport.net/*\n// @connect      rover-lottery-api.loteriasrovers.workers.dev\n// @grant        GM_getValue\n// @grant        GM_setValue\n// @grant        GM_addValueChangeListener\n// @grant        GM_registerMenuCommand\n// @grant        GM_xmlhttpRequest\n// @grant        unsafeWindow\n// @sandbox      JavaScript\n// @run-at       document-start\n// @noframes\n// @updateURL    ${base}Mango-Rover-React.meta.js\n// @downloadURL  ${base}Mango-Rover-React.user.js\n// @supportURL   https://github.com/Nox1do/rover-lottery/issues\n// ==/UserScript==\n`;
const result = await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  write: false,
  format: "iife",
  target: "firefox128",
  legalComments: "none",
  define: { __MANGO_VERSION__: JSON.stringify(meta.version) },
});
const script = header + "\n" + result.outputFiles[0].text;
const outputs = [
  ["Mango-Rover-React.user.js", script],
  ["Mango-Rover-React.meta.js", header],
  [`versions/Mango-Rover-React-v${meta.version}.user.js`, script],
];
if (process.argv.includes("--check")) {
  for (const [p, s] of outputs) {
    if ((await readFile(p, "utf8")) !== s)
      throw Error(`Build desactualizado: ${p}`);
  }
  const pkg = JSON.parse(await readFile("package.json"));
  if (pkg.version !== meta.version) throw Error("Versiones inconsistentes");
  console.log(`Release ${meta.version}: reproducible`);
} else {
  await mkdir("versions", { recursive: true });
  for (const [p, s] of outputs) await writeFile(p, s);
  console.log(`Built ${meta.version}: ${script.length} chars`);
}
