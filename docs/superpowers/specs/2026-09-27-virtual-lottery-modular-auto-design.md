# Virtual Lottery — Modular Automation Architecture

Date: 2026-09-27  
Repository: `Nox1do/rover-lottery`

## 1. Purpose

Refactor Virtual Lottery v2 Auto into a modular, maintainable userscript architecture that:

- keeps Tampermonkey as the only runtime;
- requires no custom backend;
- preserves the existing manual workflow;
- keeps the current Brazil/QPlay automatic workflow working;
- adds a persistent Master AUTO ON/OFF switch;
- adds per-lottery and per-draw ON/OFF controls;
- allows draw times and retry schedules to be configured from the UI;
- makes future automation for Queen, Premier, Rapid, NationJL, and other lotteries additive rather than duplicative;
- keeps the final Tampermonkey artifact as one self-contained `.user.js` file.

The refactor must preserve the current safety properties: no blind overwrites, no blind retry of an uncertain publish, and no assumption that HTTP 200 means the result was successfully processed.

## 2. Runtime model

Virtual Lottery remains a frontend-only userscript.

At runtime:

```text
Tampermonkey
   ├── source websites/APIs
   ├── Rover same-origin endpoints
   ├── GM_* storage
   └── injected UI
```

There is no Virtual Lottery server, database, or custom API.

The development repository may contain multiple source modules and tests, but Tampermonkey executes only the generated artifact:

```text
virtual lottery/dist/virtual-lottery-v2-auto.user.js
```

The generated userscript must not contain unresolved local `import` statements and must not require the `src/` tree at runtime.

## 3. Repository organization

```text
virtual lottery/
├── src/
│   ├── core/
│   │   ├── auto-engine.js
│   │   ├── scheduler.js
│   │   ├── state-store.js
│   │   ├── settings-store.js
│   │   ├── retry-policy.js
│   │   └── logger.js
│   │
│   ├── rover/
│   │   ├── reader.js
│   │   ├── processor.js
│   │   ├── verifier.js
│   │   └── conflicts.js
│   │
│   ├── sources/
│   │   ├── qplay.js
│   │   ├── queen.js
│   │   ├── premier.js
│   │   ├── rapid.js
│   │   ├── nationjl.js
│   │   └── extra.js
│   │
│   ├── lotteries/
│   │   └── registry.js
│   │
│   ├── ui/
│   │   ├── toolbar.js
│   │   ├── settings-modal.js
│   │   └── source-buttons.js
│   │
│   └── main.js
│
├── tests/
├── dist/
│   └── virtual-lottery-v2-auto.user.js
├── package.json
└── virtual-lottery v1 manual.user.js
```

The manual v1 baseline remains available as a historical/stable reference.

## 4. Architectural boundaries

### 4.1 Core

The Core layer owns behavior that is independent of any source or lottery:

- scheduler;
- retry calculation;
- state machine;
- settings access;
- persistence lifecycle;
- logging;
- orchestration.

The Core must not contain QPlay-specific, Queen-specific, or Rover-DOM-specific parsing.

### 4.2 Rover adapter

The Rover layer owns all interaction with Rover:

- background read via `__inc/verResultados2.php`;
- parsing detached Rover HTML;
- preserving the exact raw Rover lottery code returned by the server;
- publishing through `__inc/procesarResultados.php`;
- detecting `status-ok` / pending;
- conflict checks;
- duplicate checks;
- post-publish verification.

The automatic engine must not depend on the currently visible Rover filter, date, or result row.

### 4.3 Source adapters

Each source adapter owns only how to fetch and parse its source.

Conceptual contract:

```js
source.fetchResult({
    draw,
    date,
    timezone
})
```

Normalized successful result:

```js
{
    primera,
    segunda,
    tercera,
    pick3,
    pick4
}
```

A source adapter must not publish to Rover or own the automation state machine.

### 4.4 Lottery registry

The registry declaratively connects lotteries, draws, sources, default times, and default settings.

Example shape:

```js
const LOTTERY_REGISTRY = {
    brazil: {
        name: 'Brazil',
        source: 'qplay',
        enabledByDefault: true,
        draws: {
            BRAZIL12PM: {
                label: '12:00 PM',
                time: '12:00',
                roverCode: 'BRAZIL12PM'
            },
            BRAZIL03PM: {
                label: '3:00 PM',
                time: '15:00',
                roverCode: 'BRAZIL03PM'
            },
            BRAZIL07PM: {
                label: '7:00 PM',
                time: '19:00',
                roverCode: 'BRAZIL07PM'
            },
            BRAZIL08PM: {
                label: '8:00 PM',
                time: '20:00',
                roverCode: 'BRAZIL08PM'
            }
        }
    }
};
```

The normalized registry key is not assumed to be the exact raw code required by Rover. The Rover adapter must use the exact raw code discovered in Rover's returned HTML when publishing.

## 5. Automation UI

A persistent toolbar is injected outside the ephemeral result rows:

```text
Virtual Lottery    AUTO [ ON ]    ● 4 activos    ⚙
```

Requirements:

- `AUTO` is the global Master switch.
- Configuration is represented by the gear icon only: `⚙`.
- No "Config" text appears next to the icon.
- The toolbar must survive or be safely reattached after Rover AJAX rebuilds.
- Manual source buttons remain available independently of AUTO.

### 5.1 Master OFF behavior

Master OFF:

- starts no new automatic searches;
- sends no new automatic publish requests;
- does not erase settings;
- does not erase operational state;
- does not disable manual buttons.

If an automatic publish has already been sent, OFF must not abandon the verification step. The current in-flight publish/verify cycle is allowed to finish safely; then the engine remains stopped.

## 6. Configuration modal

The gear opens a configuration modal generated from the lottery registry.

Hierarchy:

```text
Master
  └── Lottery
       └── Draw
```

For a draw to run automatically, all three levels must be enabled.

Initial Brazil example:

```text
AUTO general                             [ ON ]

Brazil / QPlay                           [ ON ]

Draw          Auto       Time
12 PM         [ON]       12:00
03 PM         [ON]       15:00
07 PM         [ON]       19:00
08 PM         [ON]       20:00

Brazil retry policy
1,3,5,8,12,20,30,45,60,90,120
After last retry: every 30 min
```

Changes are applied immediately without requiring a Rover page reload.

## 7. Retry inheritance

Retry settings support inheritance:

```text
Global defaults
   ↓
Lottery
   ↓
Draw
```

A draw can either inherit its lottery policy or define a custom policy.

Default Brazil policy:

```text
offsets: 1,3,5,8,12,20,30,45,60,90,120 minutes
afterLast: every 30 minutes
```

The implementation must avoid storing duplicated inherited data when an override is not needed.

## 8. Automation state machine

All automated draws use one shared state model:

```text
WAITING_TIME
    ↓
SEARCHING_SOURCE
    ↓
RESULT_READY
    ↓
CHECKING_ROVER
    ↓
    ├── processed + exact match ─────→ DONE
    ├── pending + safe values ───────→ PROCESSING
    ├── conflicting values ──────────→ CONFLICT
    └── duplicate ───────────────────→ DUPLICATE

PROCESSING
    ↓
VERIFYING
    ↓
    ├── status-ok + exact match ─────→ DONE
    ├── uncertain outcome ───────────→ PROCESS_UNCERTAIN
    └── confirmed error ─────────────→ ERROR
```

Common states:

```js
WAITING_TIME
SEARCHING_SOURCE
RESULT_READY
CHECKING_ROVER
PROCESSING
VERIFYING
DONE
CONFLICT
DUPLICATE
PROCESS_UNCERTAIN
ERROR
```

Operational state is independent from configuration state.

## 9. Safety invariants

These rules apply to every automated lottery:

1. Never overwrite a non-empty Rover value that differs from the source.
   - Result: `CONFLICT`.
   - No publish request is sent.

2. Never blindly repeat a publish after an ambiguous result.
   - Query Rover first.
   - If the system cannot prove the publish did not happen, use `PROCESS_UNCERTAIN`.

3. HTTP 200 is not success.
   - `DONE` requires a subsequent Rover read showing `status-ok` and exact normalized values.

4. A UI/filter/date rebuild must not control automation state.
   - The visible Rover table is not the source of truth.

5. Disabling AUTO does not erase state.

6. Configuration edits do not erase `DONE`, `CONFLICT`, or other operational state.

7. Duplicate detection must not be silently bypassed by the automatic path.
   - The automatic engine stops with `DUPLICATE` rather than auto-confirming Rover's warning.

## 10. Background Rover workflow

The current proven background pattern is retained:

1. POST `{ loteria, fecha }` to `__inc/verResultados2.php`.
2. Receive HTML without assigning it to `#resultadosLoteria`.
3. Parse the HTML in detached DOM.
4. Find the target row by normalized lottery code.
5. Read:
   - exact raw `loteria` attribute;
   - first/second/third;
   - Pick3/Pick4;
   - processed status.
6. If safe, POST to `__inc/procesarResultados.php`.
7. Do not call Rover's visible `verResultadosLoteria()` refresh.
8. Re-query `verResultados2.php` in background until verification succeeds or the outcome becomes uncertain.

This preserves the current user's filter and visible table.

## 11. Storage design

Tampermonkey GM storage is used for preferences and small operational records only.

### 11.1 Persistent settings

Permanent until changed/reset:

```text
vl:auto:settings
```

Contains:

- Master enabled state;
- per-lottery enabled state;
- per-draw enabled state;
- configured draw times;
- retry overrides;
- future UI preferences if needed.

Defaults must exist in code so a missing storage entry is recoverable.

### 11.2 Operational state

Per date/draw:

```text
vl:auto:state:<YYYY-MM-DD>:<DRAW_CODE>
```

Example:

```js
{
    state: 'DONE',
    result: {
        primera: '45',
        segunda: '63',
        tercera: '91',
        pick3: '245',
        pick4: '6391'
    },
    sourceSeenAt: 0,
    processSentAt: 0,
    verifiedAt: 0,
    updatedAt: 0
}
```

### 11.3 Retention / garbage collection

GM storage must not be used as an unlimited historical database.

Policy:

- settings: no automatic expiration;
- operational states: retain today plus the previous 7 days;
- diagnostic history, if persisted later: short retention, approximately 2–3 days;
- source HTML and Rover HTML responses: never persist.

Garbage collection runs at engine startup and may also run periodically at a low frequency.

Deleting expired state must never delete current settings.

## 12. Current Brazil behavior preservation

The first refactor is behavior-preserving.

Before adding more automatic lotteries, Brazil must continue to:

- use QPlay as source;
- use Dominican Republic time;
- support 12PM, 3PM, 7PM, and 8PM;
- perform catch-up for elapsed draws;
- detect already-processed exact matches;
- avoid duplicate publish;
- survive Search/filter/date changes;
- operate when Brazil rows are not visible;
- keep manual buttons functioning;
- preserve the special raw Rover code behavior such as a trailing space when Rover returns one.

The existing Brazil-specific implementation may be removed only after equivalent tests pass against the generic engine.

## 13. Manual mode

Manual mode remains a first-class workflow.

Master AUTO OFF does not disable:

- source search buttons;
- manual filling;
- EXTRA flow;
- existing supported source integrations.

Automatic and manual concerns must not be coupled unnecessarily.

## 14. Build model

Development files are modular; runtime is monolithic.

```text
src/*
   ↓
tests
   ↓
build
   ↓
dist/virtual-lottery-v2-auto.user.js
   ↓
Tampermonkey
```

The build must:

- produce one valid userscript;
- preserve the userscript metadata block;
- include required `@grant` and `@connect` declarations;
- bundle all local modules;
- contain no unresolved project-local imports;
- increment/version the generated artifact as appropriate.

No custom backend or runtime Node.js process is introduced.

## 15. Testing requirements

The modular refactor must add automated tests for at least:

### Scheduler/settings

- Master OFF starts no new work.
- Lottery OFF disables only that lottery.
- Draw OFF disables only that draw.
- Editing a draw time recalculates scheduling immediately.
- Editing retry offsets affects the next attempt.
- Inherited retry policies resolve correctly.

### Safety

- processed + exact match → `DONE`, zero publish POSTs;
- conflicting non-empty value → `CONFLICT`, zero publish POSTs;
- duplicate → `DUPLICATE`, zero publish POSTs;
- ambiguous publish outcome → verification before any further action;
- uncertain publish is never blindly repeated.

### Rover adapter

- detached background HTML parsing;
- normalized code matching;
- preservation of exact raw Rover code;
- processed status detection;
- no dependency on visible filter/date/table.

### Sources

Each source adapter receives parser fixtures and returns the normalized result contract.

### Build

- generated `.user.js` passes syntax check;
- metadata block exists;
- no unresolved local imports remain.

## 16. Migration

Migration must be conservative.

1. Preserve current v1 manual file.
2. Preserve current v2 Auto as a rollback point through Git history.
3. Introduce modular source structure.
4. Add tests around current Brazil behavior.
5. Move Brazil behavior onto the generic engine without changing user-visible behavior.
6. Introduce toolbar and settings UI.
7. Add storage migration/compatibility for existing Brazil operational state where needed.
8. Only after Brazil passes the full test suite should another lottery be automated.

## 17. Future lottery onboarding

A future automatic lottery should generally require:

1. a source adapter or reuse of an existing source adapter;
2. registry entries for its draws;
3. default settings;
4. source/parser tests.

It should not require a new scheduler, new state machine, new Rover processor, new configuration modal, or duplicated retry engine.

## 18. Non-goals for this refactor

This refactor does not initially add automatic processing for every existing manual source.

It also does not introduce:

- a backend service;
- a remote database;
- Tampermonkey `@require` dependencies for project modules;
- long-term result-history storage;
- manual editing of operational states in the settings modal;
- automatic bypass of duplicate/conflict protections.
