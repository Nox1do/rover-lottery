# Changelog

## Diagnóstico DOM v0.3.0 (2026-10-20)
- Evidencia real del fallo: 247 filas legibles, pero 0/10 coincidencias con el método anterior.
- Diagnóstico de solo lectura amplía la detección a la identidad exacta nombre + código conocido; informes de coincidencias cercanas exclusivamente diagnósticos.
- Pruebas Chromium/Firefox del caso de código abreviado sin clase y descarte de Mariage Pale.
- Motor funcional y procesamiento permanecen inactivos.


## Auditoría de nombres anidados — 2026-10-20
- Corregido localizador de nombre principal para recorrer nodos de texto anidados e ignorar códigos abreviados, controles e indicadores, sin modificar Rover.
- Diagnóstico independiente de solo lectura actualizado a `0.2.0`, con conteos estructurales para distinguir `tabla encontrada` de `sorteos identificados`.
- Nuevas regresiones Node y Playwright para un nombre dentro de `div`/`strong` junto a `span.loteria-abrev`, sin asumir aún la estructura definitiva de Rover.
- Mantener scripts funcionales inactivos; el nuevo diagnóstico debe ejecutarse en la página autenticada y confirmarse antes de habilitar escritura.

## Compatibilidad de fecha y auditoría de DOM — 2026-10-20
- Analizada la lectura de fecha en LotteryUSA v0.6.5; agregado parseo estricto de formatos Rover y detección de controles contradictorios.
- Suite Node ampliada a **21/21 pruebas aprobadas**; regresión Playwright simulada permanece correcta en Chromium/Firefox.
- Preparado `tests/browser/rover-dom-audit.user.js` como diagnóstico opcional **solo lectura**, sin captura de números ni red.
- Opera no conectado: **no se verificó Rover autenticado ni Tampermonkey real**, por lo que el userscript funcional sigue inactivo.


## QA automatizada reproducible — 2026-10-20
- Nuevo workflow `.github/workflows/lotterynet-qa.yml`: Node 22, `npm test`, `npm run build`, verificación de sintaxis y auditoría de entrada inactiva.
- **19/19 pruebas unitarias pasan**, sin fallos.
- Regresión aislada Playwright en **Chromium y Firefox**: **16 aserciones satisfactorias por navegador**, sin emisión de `input/change/blur` ni solicitudes de escritura en la tabla simulada.
- Evidencia: https://github.com/Nox1do/rover-lottery/actions/runs/39431580644
- **NO se ha validado Rover real ni Tampermonkey instalado**; la integración sigue deshabilitada.


## Fase 2 — Módulos experimentales inactivos (2026-10-20)
- Localización estricta por fila, fecha y cinco inputs con bloqueo de ambigüedades.
- Llenado visual idempotente y cache/restauración por fecha, sin eventos sintéticos ni HTTP a Rover.
- Iconos lineales y nueve estados del diseño «En fila», con accesibilidad y movimiento reducido.
- Añadidas pruebas unitarias de DOM simulado; 20 comprobaciones directas de lógica superadas.
- Completados: `npm test` (19/19), build y Playwright sobre DOM simulado. Pendientes: pruebas reales en Rover/Tampermonkey y auditoría Network con otros scripts.
- Entrada y AUTO inactivos; sin procesamiento ni lanzamiento de producción.


## Especificación visual aprobada — 2026-10-20
- Seleccionada distribución **En fila**, iconografía **Lineal** y mensajes exactos de los nueve estados.
- Creado `docs/UI-SPEC.md` con diseño estructural, comportamiento, accesibilidad, transiciones y criterios de aceptación.
- Actualizado plan maestro a **1.1.0** con las decisiones aprobadas; permanecen pendientes la integración, las pruebas reales y el llenado visual.
- **Sin cambios de código de producción, AUTO ni procesamiento.**

## Plan UI Fase 2 — 2026-10-20
- Incorporada al plan maestro la etapa obligatoria de representación visual con Intelligence UI, catálogo de iconos, estados y mensajes, aprobación de la interfaz y criterios de calidad antes del llenado.
- Mensajes aprobados: BUSCANDO «Buscando sorteo» y CARGANDO «Consultando».
- Sin cambios al userscript, automatización ni procesamiento de resultados.


## 0.2.0 — 2026-10-20 (Fase 1 parcial, sin distribución)
- Capturados diez fragmentos HTML auténticos del 19 de octubre para FL, LA, OH, TN e IN.
- Añadidos extractor puro de fecha/turno/posiciones, validación de origen y exclusión de bolas especiales.
- Añadido proveedor Lottery.net y transporte exclusivamente GET, sin uso en entrada principal.
- Añadidas pruebas de fixtures, fechas erróneas y ambigüedad.
- Se mantienen desactivados AUTO, UI, llenado y procesamiento. Pruebas de navegador pendientes.


## 0.1.0 — 2026-10-19
- Estructura `LotteryNet/` creada sin alterar proyectos existentes.
- Copia del plan maestro y reglas `AGENTS.md`.
- Configuración inicial de 5 estados, 10 sorteos y 2 juegos por sorteo.
- Función pura para mapear Pick/Cash/Daily 3 y 4 a los cinco inputs de Rover.
- Contratos **no implementados** para extractor, transporte, scheduler, coordinación multitab, escritura y UI.
- Pruebas iniciales de configuración, mapeo y ausencia de procesamiento.
- Preparación de build esbuild con rutas portables en Windows; distribución de producción **no realizada**.

**Validación:** pruebas unitarias locales previstas con `npm test`; pruebas reales de navegador y distribución pendientes. No declarar funciones en producción.
