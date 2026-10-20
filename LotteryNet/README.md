# LotteryNet → Rover

Proyecto **independiente** en el monorrepositorio [rover-lottery](https://github.com/Nox1do/rover-lottery), alojado exclusivamente en `LotteryNet/`.

> **Estado: Fase 2, módulos visuales implementados como componentes INACTIVOS. NO INSTALAR EN PRODUCCIÓN.** La entrada no consulta, llena, guarda ni procesa resultados. Queda pendiente la prueba en Rover real.

## Objetivo aprobado
Extraer los resultados de [Lottery.net](https://www.lottery.net/) y llenar **solo los inputs visibles** de Rover, mediante AUTO y botón manual. **Nunca** enviar ni confirmar resultados al backend de Rover.

### Sorteos previstos
| Estado | Turnos | Juegos |
| --- | --- | --- |
| Florida | Midday, Evening | Pick 3 / Pick 4 |
| Louisiana | Evening | Pick 3 / Pick 4 |
| Ohio | Midday, Evening | Pick 3 / Pick 4 |
| Tennessee | Morning, Midday, Evening | Cash 3 / Cash 4 |
| Indiana | Midday, Evening | Daily 3 / Daily 4 |

**Total:** 10 sorteos; hasta 20 resultados de juego por día.

## Documentos obligatorios
- [PLAN-LotteryNet-Rover.md](./PLAN-LotteryNet-Rover.md): fuente de verdad del alcance, fases, riesgos y aceptación.
- [AGENTS.md](./AGENTS.md): reglas para agentes y sesiones de desarrollo.
- [docs/UI-SPEC.md](./docs/UI-SPEC.md): diseño «En fila», iconos y nueve textos aprobados.
- [docs/QA-FASE-2.md](./docs/QA-FASE-2.md): pruebas ejecutadas y puertas pendientes.
- [CHANGELOG.md](./CHANGELOG.md): historial.

## Herramientas de desarrollo
Requiere Node.js y npm para pruebas/build. **No** requiere servicios externos para ejecutar las pruebas unitarias. Usa módulos ESM, el corredor de pruebas `node:test` y esbuild para generar un único userscript.

```bash
cd LotteryNet
npm install
npm test
npm run build
```

El comando `build` generará `dist/LotteryNet-Rover.user.js` y `dist/LotteryNet-Rover.meta.js`. **El build del esqueleto no debe instalarse como funcional**: el punto de entrada solo registra un mensaje. Los artefactos no se publican en este commit.

## Organización
- `src/states/`: 10 identidades de sorteos por estado (datos de configuración).
- `src/core/`: scheduler, transporte, validación, caché y multitab.
- `src/providers/`: una sola fuente externa, Lottery.net.
- `src/parsers/`: parser común y variantes Fireball/Wild Ball/Super Ball.
- `src/rover/`: identidad de fila, **escritura visual solamente**, restauración.
- `src/ui/`: indicador de fila implementado; botón manual y AUTO aún no activados.
- `tests/unit/`: suite actual ejecutada (28/28, Node 24 local; CI configurado con Node 22).
- `tests/browser/isolated-rover.mjs`: regresión DOM y eventos adversarios en Chromium/Firefox.
- `tests/browser/manual-usa-overlap.mjs`: convivencia manual con LotteryUSA v0.6.5; usa solo su función real `triggerInput` dentro de un fixture local, sin API externas.
- `tests/browser/rover-safety-audit.user.js`: diagnóstico pasivo de manejadores inline y eventos en Rover real; no altera resultados.
- `tests/browser/network-blocked-rover.mjs`: 120 escenarios por navegador sobre diez filas capturadas y depuradas, con controles positivos de bloqueo. Informe local y límites en [QA, sección 18](docs/QA-FASE-2.md#18-ensayo-aislado-con-diez-filas-capturadas-y-bloqueo-verificado--20102026).
- `.github/workflows/lotterynet-qa.yml`: CI para pruebas, compilación y auditoría de entrada inactiva.
- Pruebas en Rover real y Tampermonkey siguen **pendientes**.
- `scripts/`: construcción del userscript y metadatos.

## Pruebas registradas

[GitHub Actions — pruebas completas 2026-10-20](https://github.com/Nox1do/rover-lottery/actions/runs/39455803575): **26 pruebas Node correctas**, compilación y entrada inactiva verificadas, pruebas Playwright en Chromium/Firefox que cubren DOM, receptores de eventos adversarios y uso **manual** de LotteryUSA con su función real `triggerInput` sobre HTML local sintético. La identidad de diez filas se verificó antes en Rover autenticado mediante el diagnóstico DOM v0.4.0. Aún faltan pruebas de Network y coexistencia real antes de habilitar escritura.

**Compatibilidad de fechas:** `src/rover/rows.js` valida distintas representaciones documentadas por el script LotteryUSA y rechaza controles contradictorios, sin asumir la fecha actual.

**Diagnóstico opcional de Rover:** `tests/browser/rover-dom-audit.user.js` (solo lectura; sin envío de datos ni cambios de inputs). Ya se ejecutó en Rover autenticado: 10/10 sorteos y cinco atributos `loteria` confirmados para el 19/10/2026.

**Prueba de convivencia:** [docs/QA-FASE-2.md](docs/QA-FASE-2.md) documenta la ruta independiente de POST de Virtual Lotteries y la separación entre pruebas simuladas y captura real de Network. El diagnóstico pasivo `__LOTTERYNET_SAFETY_QA__.print()` no demuestra por sí solo ausencia de procesamiento.

## Puertas de desarrollo
Antes de implementar el llenado, validar las 10 páginas de juegos 3/4 en Lottery.net, su HTML, el DOM de Rover tras Search y la seguridad de los eventos `input/change` cuando otros userscripts están instalados. No elegir valores definitivos de cadence AUTO o política multihost sin pruebas/aprobación.

Documentación: [Tampermonkey](https://www.tampermonkey.net/documentation.php), [esbuild](https://esbuild.github.io/api/), [Node.js Test Runner](https://nodejs.org/api/test.html).
