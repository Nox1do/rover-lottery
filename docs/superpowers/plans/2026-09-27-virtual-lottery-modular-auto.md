# Virtual Lottery Modular Auto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Virtual Lottery v2 Auto 2.0.1 into a modular, frontend-only Tampermonkey project with a reusable automation engine, persistent Master/Lottery/Draw configuration, garbage-collected GM state, and one self-contained `dist/virtual-lottery-v2-auto.user.js` artifact.

**Architecture:** Keep source retrieval, Rover transport, scheduling/state, settings, and UI behind explicit module boundaries. Build the modules with esbuild into one IIFE userscript; Tampermonkey never loads the development modules at runtime. Brazil/QPlay is migrated first onto the generic engine, while all existing manual source buttons and EXTRA behavior remain available.

**Tech Stack:** JavaScript ES modules for development, Tampermonkey GM APIs at runtime, `fetch` for same-origin Rover POSTs, `GM_xmlhttpRequest` for cross-origin sources, Node.js 20+, esbuild, Vitest, jsdom.

**Spec:** `docs/superpowers/specs/2026-09-27-virtual-lottery-modular-auto-design.md`

## Global Constraints

- Runtime remains 100% frontend in Tampermonkey; no custom backend or remote database.
- Tampermonkey executes only `virtual lottery/dist/virtual-lottery-v2-auto.user.js`.
- The dist artifact contains no unresolved project-local `import` statements and no runtime dependency on Node.js.
- Existing manual source behavior remains available when AUTO is OFF.
- Existing Brazil/QPlay behavior is preserved before any other lottery is automated.
- Global AUTO, Lottery AUTO, and Draw AUTO must all be ON before new automatic work starts.
- Configuration changes apply without a page reload.
- Never overwrite a non-empty Rover value that differs from the source.
- Never blindly repeat an ambiguous publish.
- HTTP 200 alone never means DONE; DONE requires a later Rover `status-ok` plus exact values.
- Duplicate detection stops automation at DUPLICATE; it is never auto-confirmed.
- Visible Rover filters/date/table are not automation state.
- GM settings do not expire automatically.
- Operational state retains today plus the previous 7 days.
- Persisted diagnostic history, if later added, is limited to approximately 2–3 days.
- Full source HTML and Rover HTML responses are never persisted.
- The configuration control in the toolbar is the gear icon only; no “Config” text.
- Existing optimized table reinjection keeps a 450 ms debounce and must not re-run merely because the script mutated its own buttons.
- Keep `virtual lottery/virtual-lottery v1 manual.user.js` unchanged as the manual baseline.
- Keep the current v2 Auto 2.0.1 reachable through Git history; the new canonical install artifact is the file under `dist/`.

## File Structure

**Create**
- `virtual lottery/package.json` — development scripts and dev dependencies.
- `virtual lottery/vitest.config.js` — jsdom test configuration.
- `virtual lottery/scripts/build.mjs` — esbuild wrapper that prepends the userscript metadata block.
- `virtual lottery/src/userscript-header.txt` — canonical Tampermonkey metadata.
- `virtual lottery/src/main.js` — hostname routing and application bootstrap.
- `virtual lottery/src/lotteries/registry.js` — declarative source/lottery/draw registry.
- `virtual lottery/src/core/storage.js` — GM API adapter.
- `virtual lottery/src/core/settings-store.js` — defaults, merge, persistence, and runtime config resolution.
- `virtual lottery/src/core/state-store.js` — per-draw state, legacy Brazil migration, 7-day retention, GC index.
- `virtual lottery/src/core/retry-policy.js` — retry inheritance and next-attempt math.
- `virtual lottery/src/core/scheduler.js` — RD clock conversion and draw eligibility.
- `virtual lottery/src/core/auto-engine.js` — generic state-machine orchestration.
- `virtual lottery/src/core/logger.js` — consistent manual/auto log prefixes.
- `virtual lottery/src/rover/conflicts.js` — value normalization, conflict, exact-match and duplicate helpers.
- `virtual lottery/src/rover/reader.js` — detached Rover HTML parsing.
- `virtual lottery/src/rover/processor.js` — publish POST.
- `virtual lottery/src/rover/verifier.js` — post-publish verification loop.
- `virtual lottery/src/sources/http.js` — shared `GM_xmlhttpRequest` text client.
- `virtual lottery/src/sources/qplay.js`
- `virtual lottery/src/sources/queen.js`
- `virtual lottery/src/sources/premier.js`
- `virtual lottery/src/sources/rapid.js`
- `virtual lottery/src/sources/nationjl.js`
- `virtual lottery/src/sources/extra.js`
- `virtual lottery/src/sources/index.js` — source adapter registry/dispatcher.
- `virtual lottery/src/ui/source-buttons.js` — existing manual row-button behavior.
- `virtual lottery/src/ui/toolbar.js` — persistent AUTO switch, summary, gear icon.
- `virtual lottery/src/ui/settings-modal.js` — registry-driven settings editor.
- `virtual lottery/src/ui/styles.js` — manual-button, toolbar and modal CSS.
- `virtual lottery/tests/**/*.test.js`
- `virtual lottery/tests/fixtures/**`
- `virtual lottery/dist/virtual-lottery-v2-auto.user.js`
- `virtual lottery/README.md` — canonical install/build/test path.

**Keep unchanged**
- `virtual lottery/virtual-lottery v1 manual.user.js`
- `virtual lottery/virtual-lottery v2 auto.user.js` during the migration; it remains the pre-refactor comparison point.

## Review Focus

1. **Corrupted or partially missing `vl:auto:settings`:** load valid known fields, replace invalid/missing fields with registry defaults, and never crash startup. Pin this in Task 2.
2. **Midnight/day-boundary clock behavior:** a draw from the previous date must never become eligible merely because elapsed-minute math went negative or wrapped. Pin this in Task 4.
3. **Master/Lottery/Draw switched OFF while a source request is in flight:** if no publish has been sent, re-check effective enablement before processing and stop; if publish has already been sent, finish verification. Pin this in Task 7.
4. **Rover background HTML does not contain the target row:** send zero publish requests and leave the draw in a recoverable state instead of treating it as success. Pin this in Task 5/7.
5. **Source returns malformed result lengths or missing fields:** reject before Rover preflight and send zero publish requests. Pin this in Task 6/7.

---

### Task 1: Add the development/test/build harness without changing runtime behavior

**Files:**
- Create: `virtual lottery/package.json`
- Create: `virtual lottery/vitest.config.js`
- Create: `virtual lottery/scripts/build.mjs`
- Create: `virtual lottery/src/userscript-header.txt`
- Create: `virtual lottery/tests/build.test.js`
- Create: `virtual lottery/README.md`

**Interfaces:**
- Consumes: current metadata from `virtual lottery/virtual-lottery v2 auto.user.js:1-22`.
- Produces: `npm test`, `npm run build`, and a build contract that bundles `src/main.js` into `dist/virtual-lottery-v2-auto.user.js` as an IIFE with the metadata block at byte 0.

- [ ] **Step 1: Write the failing build-contract test**

In `tests/build.test.js`, assert that after the build:
- dist starts with `// ==UserScript==`;
- metadata contains `@name         Virtual Lotteries v2 Auto`;
- metadata contains the existing `@match`, `@grant`, and `@connect` entries;
- generated code contains no `from './`, `from "../`, or bare project-local `import `;
- generated JS parses successfully through Node's syntax check.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:
```bash
cd "virtual lottery"
npm test -- tests/build.test.js
```

Expected: FAIL because the build harness and dist contract do not exist yet.

- [ ] **Step 3: Add the minimal tooling**

Use:
```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "build": "node scripts/build.mjs",
    "check": "npm test && npm run build && node --check dist/virtual-lottery-v2-auto.user.js"
  },
  "devDependencies": {
    "esbuild": "^0.25.0",
    "jsdom": "^26.0.0",
    "vitest": "^3.0.0"
  }
}
```

`scripts/build.mjs` must:
- read `src/userscript-header.txt`;
- bundle `src/main.js` with esbuild as browser/IIFE;
- prepend the header;
- write exactly `dist/virtual-lottery-v2-auto.user.js`.

At this task, `src/main.js` may be created as a no-op bootstrap solely to prove the build contract; the existing 2.0.1 userscript remains the runnable baseline until later tasks.

- [ ] **Step 4: Run the test/build contract**

Run:
```bash
npm install
npm test -- tests/build.test.js
npm run build
node --check dist/virtual-lottery-v2-auto.user.js
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add "virtual lottery/package.json" "virtual lottery/vitest.config.js" "virtual lottery/scripts" "virtual lottery/src/userscript-header.txt" "virtual lottery/src/main.js" "virtual lottery/tests/build.test.js" "virtual lottery/README.md"
git commit -m "build: add modular userscript toolchain"
```

---

### Task 2: Create the declarative registry and resilient settings store

**Files:**
- Create: `virtual lottery/src/lotteries/registry.js`
- Create: `virtual lottery/src/core/storage.js`
- Create: `virtual lottery/src/core/settings-store.js`
- Create: `virtual lottery/tests/registry-settings.test.js`

**Interfaces:**
- Consumes: current `LOTERIAS` mapping from `virtual-lottery v2 auto.user.js:43-83`.
- Produces:
  - `LOTTERY_REGISTRY`;
  - `getDrawByCode(code) -> { lotteryId, lottery, draw } | null`;
  - `createDefaultSettings(registry) -> Settings`;
  - `createSettingsStore(storage, registry) -> { load(), save(settings), update(mutator), resolve(lotteryId, drawCode) }`;
  - `createGMStorage() -> { get(key, fallback), set(key, value), delete(key) }`.

- [ ] **Step 1: Write failing registry/settings tests**

Pin all existing manual draw codes and exact source-specific fields currently used by NationJL, Rapid, Premier, QPlay Brazil, Queen and EXTRA.

Assert Brazil defaults:
```js
expect(settings.masterEnabled).toBe(true);
expect(settings.lotteries.brazil.enabled).toBe(true);
expect(settings.lotteries.brazil.draws.BRAZIL12PM).toEqual({
  enabled: true,
  time: '12:00'
});
expect(settings.lotteries.brazil.retryPolicy).toEqual({
  offsets: [1,3,5,8,12,20,30,45,60,90,120],
  afterLast: 30
});
```

Assert Queen/Premier/Rapid/NationJL/EXTRA remain manual-only initially by exposing `automationSupported: false`.

Add the Review Focus case: persisted settings with an invalid `masterEnabled: "yes"`, missing Brazil draws, and one valid custom Brazil time must load without throwing, preserve the valid custom time, and restore invalid/missing values from defaults.

- [ ] **Step 2: Run and verify failure**

Run:
```bash
npm test -- tests/registry-settings.test.js
```

Expected: FAIL because registry/store modules do not exist.

- [ ] **Step 3: Implement registry and settings interfaces**

Use one canonical settings key:
```text
vl:auto:settings
```

Validation rules:
- booleans must be actual booleans;
- times must match `HH:MM` 24-hour format;
- retry offsets must be strictly increasing positive integers;
- `afterLast` must be a positive integer;
- unknown persisted lottery/draw keys are ignored;
- missing values inherit defaults.

- [ ] **Step 4: Run settings tests**

Run:
```bash
npm test -- tests/registry-settings.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "virtual lottery/src/lotteries" "virtual lottery/src/core/storage.js" "virtual lottery/src/core/settings-store.js" "virtual lottery/tests/registry-settings.test.js"
git commit -m "feat: add lottery registry and auto settings"
```

---

### Task 3: Add operational state persistence, legacy migration and garbage collection

**Files:**
- Create: `virtual lottery/src/core/state-store.js`
- Create: `virtual lottery/tests/state-store.test.js`

**Interfaces:**
- Consumes: `storage` from Task 2 and Brazil draw codes from the registry.
- Produces:
  - `createStateStore(storage, { retentionDays: 7 })`;
  - `stateStore.get(dateIso, drawCode)`;
  - `stateStore.patch(dateIso, drawCode, patch)`;
  - `stateStore.remove(dateIso, drawCode)`;
  - `stateStore.gc(todayIso)`;
  - `stateStore.migrateLegacyBrazil(todayIso, brazilDrawCodes)`.

- [ ] **Step 1: Write failing state-store tests**

Use new keys:
```text
vl:auto:state:<YYYY-MM-DD>:<DRAW_CODE>
```

Use one compact index:
```text
vl:auto:state:index
```

Assert:
- `patch` updates `updatedAt` and maintains the index;
- GC on `2026-09-28` retains dates `2026-09-21` through `2026-09-28` and deletes `2026-09-20`;
- `vl:auto:settings` is untouched;
- no HTML fields are accepted into the state record;
- legacy key `vl:auto:brazil:2026-09-27:BRAZIL03PM` migrates to the new key and preserves `DONE`, result values and timestamps.

- [ ] **Step 2: Run and verify failure**

Run:
```bash
npm test -- tests/state-store.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement indexed GC and deterministic legacy migration**

Do not add `GM_listValues`. GC operates from `vl:auto:state:index`.

Legacy migration checks only today plus the previous 7 days for the known Brazil draw codes. After successful copy to the new key, delete the old key.

Allowed persisted operational fields are:
```text
state
result
sourceSeenAt
processSentAt
verifiedAt
lastAttemptElapsedMin
lastError
updatedAt
```

- [ ] **Step 4: Run state tests**

Run:
```bash
npm test -- tests/state-store.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "virtual lottery/src/core/state-store.js" "virtual lottery/tests/state-store.test.js"
git commit -m "feat: add auto state retention and migration"
```

---

### Task 4: Implement retry policy and timezone-safe scheduler

**Files:**
- Create: `virtual lottery/src/core/retry-policy.js`
- Create: `virtual lottery/src/core/scheduler.js`
- Create: `virtual lottery/tests/scheduler.test.js`

**Interfaces:**
- Consumes: resolved draw config from Task 2.
- Produces:
  - `parseTimeToMinute(time) -> number`;
  - `resolveRetryPolicy(settings, registry, lotteryId, drawCode) -> { offsets, afterLast }`;
  - `nextRetryOffset(elapsedMinutes, policy) -> number`;
  - `createRDClock(now = new Date()) -> { dateUs, dateIso, minuteOfDay, second }`;
  - `shouldAttemptDraw({ clock, drawTime, state, policy }) -> boolean`.

- [ ] **Step 1: Write failing scheduler tests**

Pin:
- `12:00 -> 720`, `15:00 -> 900`, `19:00 -> 1140`, `20:00 -> 1200`;
- default retry progression after elapsed 0/1/3/18/120;
- after the last configured retry, next attempt is `elapsed + afterLast`;
- catch-up: opening at 15:18 with no prior attempt makes a 15:00 draw eligible immediately;
- after a failed attempt at elapsed 18, next eligible offset is 20;
- changing policy from `[1,3,5,8,12,20]` to `[1,2,4,6,10,15]` recalculates from `lastAttemptElapsedMin` rather than a stale stored `nextAttemptMin`.

Add the Review Focus day-boundary test:
- clock date `2026-09-28` at 00:05 never schedules a state/result belonging to `2026-09-27`.

- [ ] **Step 2: Run and verify failure**

Run:
```bash
npm test -- tests/scheduler.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement pure retry/scheduler helpers**

Use `America/Santo_Domingo` for the production clock. Do not use the visible Rover date to determine automatic scheduling.

- [ ] **Step 4: Run scheduler tests**

Run:
```bash
npm test -- tests/scheduler.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "virtual lottery/src/core/retry-policy.js" "virtual lottery/src/core/scheduler.js" "virtual lottery/tests/scheduler.test.js"
git commit -m "feat: add configurable auto scheduler"
```

---

### Task 5: Extract the Rover background adapter and safety helpers

**Files:**
- Create: `virtual lottery/src/rover/conflicts.js`
- Create: `virtual lottery/src/rover/reader.js`
- Create: `virtual lottery/src/rover/processor.js`
- Create: `virtual lottery/src/rover/verifier.js`
- Create: `virtual lottery/tests/rover-adapter.test.js`
- Create: `virtual lottery/tests/fixtures/rover/brazil-processed.html`
- Create: `virtual lottery/tests/fixtures/rover/brazil-pending.html`
- Create: `virtual lottery/tests/fixtures/rover/brazil-duplicate.html`

**Interfaces:**
- Consumes: same-origin `fetch` and DOMParser.
- Produces:
  - `normalizeRoverValue(value) -> string`;
  - `hasConflict(values, result) -> boolean`;
  - `isExactMatch(values, result) -> boolean`;
  - `findDuplicates(doc, drawCode, result) -> Duplicate[]`;
  - `createRoverReader({ fetchFn, DOMParserCtor }).read({ dateUs, drawCode, result }) -> RoverSnapshot`;
  - `createRoverProcessor({ fetchFn }).process({ dateIso, rawCode, result }) -> { httpOk, text }`;
  - `verifyProcessed({ reader, wait, delays, dateUs, drawCode, result }) -> { state, snapshot? }`.

`RoverSnapshot`:
```js
{
  found: boolean,
  rawCode?: string,
  processed?: boolean,
  values?: { primera, segunda, tercera, pick3, pick4 },
  duplicates?: Array<{ code, name }>
}
```

- [ ] **Step 1: Write failing Rover tests**

Pin the real Brazil values already observed:
- BRAZIL12PM: `59,67,29,859,6729`;
- BRAZIL03PM: `45,63,91,245,6391`;
- BRAZIL07PM: `68,95,25,868,9525`;
- BRAZIL08PM: `26,74,96,926,7496`.

Assert BRAZIL03PM resolves normalized code `BRAZIL03PM` while preserving raw server code `"BRAZIL03PM "`.

Assert:
- `---` normalizes to empty;
- a differing non-empty field is a conflict;
- processed + exact values is exact;
- duplicate matching uses primera+segunda+tercera and excludes the same draw;
- reader POSTs `fecha` in `MM/DD/YYYY`;
- processor POSTs `fecha` in `YYYY-MM-DD`.

Add Review Focus missing-row test: reader returns `{ found:false }`; processor is never invoked by the orchestration test later.

- [ ] **Step 2: Run and verify failure**

Run:
```bash
npm test -- tests/rover-adapter.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement the Rover modules by extracting current Brazil logic**

Move behavior equivalent to current:
- `autoBrazilPost`;
- `autoBrazilValoresFila`;
- `autoBrazilFilaPorCodigo`;
- `autoBrazilDuplicados`;
- `autoBrazilConsultarRover`;
- `autoBrazilEnviarProceso`;
- `autoBrazilVerificarProcesado`.

Do not return or persist full Rover HTML from the public snapshot API.

- [ ] **Step 4: Run Rover tests**

Run:
```bash
npm test -- tests/rover-adapter.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "virtual lottery/src/rover" "virtual lottery/tests/rover-adapter.test.js" "virtual lottery/tests/fixtures/rover"
git commit -m "refactor: isolate Rover background processing"
```

---

### Task 6: Extract source adapters and preserve every manual source

**Files:**
- Create: `virtual lottery/src/sources/http.js`
- Create: `virtual lottery/src/sources/qplay.js`
- Create: `virtual lottery/src/sources/queen.js`
- Create: `virtual lottery/src/sources/premier.js`
- Create: `virtual lottery/src/sources/rapid.js`
- Create: `virtual lottery/src/sources/nationjl.js`
- Create: `virtual lottery/src/sources/extra.js`
- Create: `virtual lottery/src/sources/index.js`
- Create: `virtual lottery/tests/sources.test.js`
- Create: `virtual lottery/tests/fixtures/sources/*`

**Interfaces:**
- Consumes: draw metadata from the registry and `requestText` from `sources/http.js`.
- Produces:
  - `SOURCE_ADAPTERS`;
  - every adapter exposes `fetchResult({ draw, dateUs }) -> Promise<Result|null|PendingResult>`;
  - QPlay may share a 10-second in-flight/result-list cache internally so the four Brazil draws do not cause four immediate page downloads;
  - EXTRA exports both Rover-side request handling and LotteryPost-tab handling.

- [ ] **Step 1: Write failing source tests**

Create minimal deterministic fixtures from the current parser contracts.

Pin at least:
- QPlay 09/27/2026 03:00 PM → `45,63,91,245,6391`;
- Queen 09/23/2026 QL MORNING → `98,20,36,098,2036` and preserve leading zeroes;
- Premier adapter sends existing required headers `Accept: application/json`, `Origin: https://premierlotto.tv`, `Referer: https://premierlotto.tv/`, `Cache-Control: no-cache`;
- Rapid pending response stays pending rather than becoming an all-zero result;
- EXTRA produces only primera/segunda/tercera from its 7-digit number and retains the existing tab-based handshake;
- NationJL parser returns the same normalized field names used by manual mode.

Add Review Focus malformed-result test: a QPlay fixture with Pick3 length 2 or Pick4 length 3 is rejected as no valid result.

- [ ] **Step 2: Run and verify failure**

Run:
```bash
npm test -- tests/sources.test.js
```

Expected: FAIL.

- [ ] **Step 3: Extract the existing parsers without changing source semantics**

Move the current source-specific functions from the 2.0.1 userscript. Keep URLs, headers, Cloudflare-safe EXTRA behavior, and date handling unchanged unless the module boundary requires dependency injection for tests.

- [ ] **Step 4: Run source tests**

Run:
```bash
npm test -- tests/sources.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "virtual lottery/src/sources" "virtual lottery/tests/sources.test.js" "virtual lottery/tests/fixtures/sources"
git commit -m "refactor: extract lottery source adapters"
```

---

### Task 7: Implement the generic AutoEngine and migrate Brazil to it

**Files:**
- Create: `virtual lottery/src/core/auto-engine.js`
- Create: `virtual lottery/src/core/logger.js`
- Create: `virtual lottery/tests/auto-engine.test.js`

**Interfaces:**
- Consumes:
  - registry/settings/state from Tasks 2–3;
  - scheduler from Task 4;
  - Rover adapter from Task 5;
  - source adapters from Task 6.
- Produces:
  - `createAutoEngine({ registry, settingsStore, stateStore, sourceAdapters, roverReader, roverProcessor, verifier, clock, logger, tickMs = 20000 })`;
  - engine methods `start()`, `stop()`, `tick()`, `evaluateDraw(lotteryId, drawCode)`, `onSettingsChanged()`;
  - common states `WAITING_TIME`, `SEARCHING_SOURCE`, `RESULT_READY`, `CHECKING_ROVER`, `PROCESSING`, `VERIFYING`, `DONE`, `CONFLICT`, `DUPLICATE`, `PROCESS_UNCERTAIN`, `ERROR`.

- [ ] **Step 1: Write failing state-machine tests**

Use dependency fakes, not network.

Pin:
- Master OFF → zero source calls and zero Rover publish calls.
- Brazil OFF → zero Brazil work.
- BRAZIL03PM OFF → other enabled Brazil draws still run.
- source result + Rover processed exact → DONE, zero publish calls.
- source result + Rover conflicting non-empty value → CONFLICT, zero publish calls.
- source result + duplicate → DUPLICATE, zero publish calls.
- safe pending Rover row → exactly one publish call, then verifier decides DONE/CONFLICT/PROCESS_UNCERTAIN.
- PROCESS_UNCERTAIN never triggers a blind second publish on later ticks.
- no target Rover row → zero publish and recoverable `ERROR` with `lastError: "ROVER_ROW_NOT_FOUND"`.
- catch-up uses the current RD date, not the visible Rover date.
- successful source miss records `lastAttemptElapsedMin` so retries follow the configured policy.

Add Review Focus in-flight OFF tests:
1. Source request starts while enabled; Master is turned OFF before source resolves; result is not published.
2. Publish has already been sent; Master is turned OFF while verification is pending; verification completes and may set DONE.

- [ ] **Step 2: Run and verify failure**

Run:
```bash
npm test -- tests/auto-engine.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement the minimal generic engine**

Replace Brazil-specific names with registry-driven logic. Keep a per-draw in-flight guard keyed by `<dateIso>|<drawCode>`.

Before each transition that could start external work, re-read effective settings. After `PROCESSING` starts, do not abandon `VERIFYING`.

Validate normalized result shape before any Rover call:
```text
primera: exactly 2 digits
segunda: exactly 2 digits
tercera: exactly 2 digits
pick3: exactly 3 digits
pick4: exactly 4 digits
```

Only Brazil has `automationSupported:true` in this release.

- [ ] **Step 4: Run the engine and regression tests**

Run:
```bash
npm test -- tests/auto-engine.test.js tests/scheduler.test.js tests/rover-adapter.test.js tests/sources.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "virtual lottery/src/core/auto-engine.js" "virtual lottery/src/core/logger.js" "virtual lottery/tests/auto-engine.test.js"
git commit -m "feat: add generic lottery auto engine"
```

---

### Task 8: Add the persistent toolbar and registry-driven settings modal

**Files:**
- Create: `virtual lottery/src/ui/styles.js`
- Create: `virtual lottery/src/ui/toolbar.js`
- Create: `virtual lottery/src/ui/settings-modal.js`
- Create: `virtual lottery/tests/ui-settings.test.js`

**Interfaces:**
- Consumes: settings store, state store, registry and `autoEngine.onSettingsChanged()`.
- Produces:
  - `ensureToolbar({ root, settingsStore, stateStore, registry, onSettingsChanged })`;
  - `openSettingsModal({ settingsStore, stateStore, registry, onSave })`;
  - toolbar DOM id `vl-auto-toolbar`;
  - settings modal DOM id `vl-auto-settings-modal`.

- [ ] **Step 1: Write failing jsdom UI tests**

Assert toolbar renders:
```text
Virtual Lottery    AUTO [switch]    <summary>    ⚙
```

Assert:
- gear button has accessible title/aria-label but visible text is only `⚙`;
- there is no visible “Config” string;
- Master switch persists immediately;
- modal initially shows only lotteries with `automationSupported:true` (Brazil in this release);
- Brazil and each Brazil draw have independent ON/OFF controls;
- draw times are editable in 24-hour `HH:MM`;
- Brazil retry offsets and `afterLast` validate before save;
- invalid retry list such as `1,3,3,2` is rejected and does not mutate persisted settings;
- Save applies settings and invokes `onSettingsChanged` without page reload;
- terminal state display can show DONE/CONFLICT while settings remain editable;
- toolbar re-render does not duplicate itself.

- [ ] **Step 2: Run and verify failure**

Run:
```bash
npm test -- tests/ui-settings.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement toolbar/modal**

Mount the toolbar immediately before `#resultadosLoteria` when available so Rover's `.html(response)` replacement of result contents does not destroy it. If the anchor is temporarily absent, `ensureToolbar` returns without error and the existing reinjection observer may retry later.

Use registry data to generate rows; do not hard-code four Brazil DOM rows in the modal.

- [ ] **Step 4: Run UI tests**

Run:
```bash
npm test -- tests/ui-settings.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "virtual lottery/src/ui/styles.js" "virtual lottery/src/ui/toolbar.js" "virtual lottery/src/ui/settings-modal.js" "virtual lottery/tests/ui-settings.test.js"
git commit -m "feat: add auto controls and settings modal"
```

---

### Task 9: Migrate manual buttons/bootstrap and produce the canonical 2.1.0 userscript

**Files:**
- Create: `virtual lottery/src/ui/source-buttons.js`
- Modify: `virtual lottery/src/main.js`
- Modify: `virtual lottery/src/userscript-header.txt`
- Modify: `virtual lottery/scripts/build.mjs`
- Modify: `virtual lottery/README.md`
- Create: `virtual lottery/tests/manual-regression.test.js`
- Modify: `virtual lottery/tests/build.test.js`
- Generate: `virtual lottery/dist/virtual-lottery-v2-auto.user.js`

**Interfaces:**
- Consumes: registry/source adapters, toolbar/settings UI, generic engine.
- Produces: one production bootstrap and the canonical Tampermonkey artifact version `2.1.0`.

- [ ] **Step 1: Write failing manual/bootstrap regression tests**

Pin:
- source button lookup trims Rover `loteria` attributes so `BRAZIL03PM ` still matches;
- manual click uses the visible Rover date and never auto-processes;
- EXTRA still only fills primera/segunda/tercera;
- changing the visible Rover date invalidates stale manual requests;
- source buttons are not duplicated after reinjection;
- reinjection remains debounced at exactly 450 ms;
- the reinjection predicate ignores mutations when all expected buttons/listeners/toolbar are already present;
- Lottery Post hostname executes only the EXTRA tab handler and does not start the Rover UI or AutoEngine;
- Rover hostname runs state GC/migration, manual UI, toolbar and AutoEngine startup in that order.

- [ ] **Step 2: Run and verify failure**

Run:
```bash
npm test -- tests/manual-regression.test.js
```

Expected: FAIL.

- [ ] **Step 3: Move the remaining manual/bootstrap behavior into modules**

Extract from current 2.0.1:
- input writing/highlighting;
- source button states;
- manual `buscarResultado` flow;
- date revision/cancellation logic;
- optimized MutationObserver logic.

Do not alter `virtual-lottery v1 manual.user.js`.

Update metadata:
```text
@version      2.1.0
```

Description must mention modular AUTO/settings without claiming that non-Brazil lotteries are automated.

- [ ] **Step 4: Build and run the full automated suite**

Run:
```bash
npm run check
```

Expected:
- all Vitest tests PASS;
- build succeeds;
- `node --check dist/virtual-lottery-v2-auto.user.js` exits 0.

- [ ] **Step 5: Compare critical 2.0.1 invariants**

Verify in the generated dist:
- all existing `@match`, `@grant`, and `@connect` entries remain;
- all current manual draw codes exist in the registry;
- QPlay/Queen/Premier/Rapid/NationJL/EXTRA source adapters are reachable from manual dispatch;
- Brazil default times and retry schedule equal 2.0.1 behavior;
- only Brazil is automation-supported;
- no call to visible `verResultadosLoteria()` exists in the automatic path;
- no HTML response is written to GM state.

- [ ] **Step 6: Commit**

```bash
git add "virtual lottery/src" "virtual lottery/tests" "virtual lottery/dist/virtual-lottery-v2-auto.user.js" "virtual lottery/README.md"
git commit -m "feat: ship modular Virtual Lottery auto 2.1.0"
```

---

### Task 10: Browser acceptance test on Rover before declaring 2.1.0 stable

**Files:**
- Modify only if a defect is found: owning source module/test.
- Update: `virtual lottery/README.md` with the accepted install path and validation checklist.

**Interfaces:**
- Consumes: built `dist/virtual-lottery-v2-auto.user.js`.
- Produces: verified 2.1.0 acceptance state and any regression fix commits.

- [ ] **Step 1: Install the dist artifact in Tampermonkey with v1/manual and old v2 disabled**

Expected console startup:
```text
[AUTO] engine active
```
with no duplicate toolbar or repeated button-install storm.

- [ ] **Step 2: Validate Master/Lottery/Draw controls**

Verify:
- Master OFF stops new automatic searches while manual buttons still work;
- Brazil OFF stops only Brazil automation;
- one Brazil draw OFF does not stop the other enabled Brazil draws;
- settings survive reload;
- gear is icon-only;
- changing time/retries takes effect without reload.

- [ ] **Step 3: Repeat the proven Rover resilience test**

Use Search, lottery filtering and visible date changes while AUTO is ON.

Expected:
- no loss of engine state;
- no forced filter/date change;
- no visible-table replacement caused by background verification;
- existing processed Brazil draws resolve to DONE without another process POST.

- [ ] **Step 4: Validate state retention without destructive data growth**

Inspect GM storage:
- one settings object;
- compact per-draw states only;
- no saved Rover/QPlay HTML;
- state GC removes records older than the 7-day retention boundary.

- [ ] **Step 5: Validate one real pending Brazil draw end-to-end**

Expected sequence:
```text
WAITING_TIME
→ SEARCHING_SOURCE
→ RESULT_READY
→ CHECKING_ROVER
→ PROCESSING
→ VERIFYING
→ DONE
```

Confirm:
- exactly one `procesarResultados.php` POST;
- subsequent Rover background read shows `status-ok` and exact values;
- visible Rover table is not rebuilt by the userscript.

If the publish outcome is ambiguous, expected terminal state is `PROCESS_UNCERTAIN` and there is no automatic second publish.

- [ ] **Step 6: If any defect is found, reproduce it as a failing automated test before fixing**

Run the focused test, implement the minimal fix, rerun `npm run check`, then repeat the affected browser acceptance step.

- [ ] **Step 7: Commit acceptance documentation/fixes**

```bash
git add "virtual lottery/README.md" "virtual lottery/src" "virtual lottery/tests" "virtual lottery/dist"
git commit -m "test: validate Virtual Lottery auto 2.1.0"
```

## Final Verification

Before marking the work complete:

```bash
cd "virtual lottery"
npm ci
npm run check
```

Then verify Git history contains the incremental commits from Tasks 1–10 and that the canonical Tampermonkey file is:

```text
virtual lottery/dist/virtual-lottery-v2-auto.user.js
```

The old root `virtual-lottery v2 auto.user.js` remains the pre-refactor comparison point unless a later, explicitly approved cleanup removes it.
