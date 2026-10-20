# Changelog

## Ensayo aislado ampliado a diez filas — 2026-10-20
- Añadida una copia depurada de las diez filas del HTML del usuario, con cincuenta campos vacíos y procedencia SHA-256; sin resultados originales, historiales, IDs, acciones ni scripts de Rover.
- Nuevo ensayo Playwright: doce escenarios por sorteo en Chromium y Firefox; fuente Lottery.net respondida desde fixtures, módulos reales de extracción, llenado, restauración e interfaz.
- Bloqueo por contexto para HTTP y WebSocket, Service Workers deshabilitados y doce conexiones de control bloqueadas por navegador. Servidor local receptor verificado antes de activar el bloqueo.
- Verificados 240 escenarios en total, cero solicitudes de llenado, cero eventos sintéticos y cero clics de procesamiento. Mutaciones deliberadas de bypass y emisión de `input` detectadas en ambos motores y luego retiradas.
- Corregida una carrera del ensayo detectada en revisión: observar 500 ms adicionales antes de capturar contadores evita cerrar con un POST diferido pendiente. El falso `PASS` anterior se reprodujo y la mutación diferida ahora falla en ambos navegadores; el límite temporal queda explícito.
- Suite completa: 28/28 Node, build y sintaxis correctos; regresiones previas de DOM y convivencia manual correctas en ambos navegadores. Evidencia local guardada en `docs/qa/`.
- La entrada de CI existente ejecutará también el ensayo ampliado; todavía no se atribuye una ejecución CI a estos cambios. No cambia `src/`, AUTO ni la distribución de producción. Tampermonkey y Rover autenticado siguen pendientes.

## Línea de base pasiva parcial y Network — 2026-10-20
- El usuario inició y detuvo dos ventanas de observación; el estado inactivo tras `stop()` es normal. Sin eventos elegibles registrados en los contadores remitidos.
- Cobertura de la vista: 39 filas, con OHIO MIDDAY y TENNESSEE MORNING presentes (cinco campos cada uno); no extrapolar a los diez sorteos.
- El usuario confirmó que no observó solicitudes con el filtro `procesarResultados.php`; sin captura, duración ni prueba de llenado causal.
- Documentado el siguiente ensayo con bloqueo efectivo de salidas de red; pendiente mecanismo de aislamiento en la sesión autenticada. Sin cambios funcionales ni activación de AUTO.

## Diagnóstico pasivo real de manejadores — 2026-10-20
- El usuario ejecutó el QA pasivo v0.1.0 en Rover autenticado: 247 filas, 10/10 sorteos y 50/50 inputs/códigos correctos.
- Cero manejadores inline o por propiedades DOM `oninput`/`onchange`/`onblur`; cero inputs dentro de `form`.
- `eventObserverActive=false`: no se ha medido todavía el tráfico de eventos; no inferir ausencia de listeners delegados ni de POST.
- Pendiente baseline de Network, atribución de solicitudes y prueba de llenado en entorno seguro. Entrada funcional INACTIVA.


## Regresión de convivencia manual LotteryUSA — 2026-10-20
- Añadido `tests/browser/manual-usa-overlap.mjs`: prueba aislada Chromium/Firefox del disparo manual mediante la función `triggerInput` original de LotteryUSA v0.6.5, sin API ni Rover real.
- Verificado que LotteryNet respeta valores manuales diferentes, es idempotente con iguales, completa parciales y se abstiene de restaurar sobre cambios tras Search; el botón de LotteryUSA puede sobrescribir y LotteryNet no lo deshace.
- Prueba Node adicional ante cambio concurrente durante setter: detención y conservación del valor manual.
- Workflow ampliado con la nueva prueba; **26/26 Node** y ambos navegadores correctos [GitHub Actions 39455803575](https://github.com/Nox1do/rover-lottery/actions/runs/39455803575).
- Pendiente auditoría pasiva de DOM/Network con la combinación de userscripts de Rover real; `src/index.js` sigue inactivo, sin procesamiento.


## Separación de alcance y modo manual — 2026-10-20
- El usuario confirmó: Virtual Lotteries v2 Auto trabaja con sorteos ajenos a LotteryNet; LotteryUSA consulta y llena solo mediante clic manual.
- Verificado en fuentes versionadas: Virtual Lotteries usa otros códigos (ninguno de los diez FL/LA/OH/TN/IN); el POST de ese proyecto no constituye por sí solo un riesgo de procesamiento de LotteryNet.
- Verificado en LotteryUSA v0.6.5: `btn.onclick` es el disparador de consultas; los diez sorteos se solapan, pero no hay llenado automático periódico.
- QA y plan refinados: el riesgo real pendiente es un posible conflicto de valores con una acción manual de LotteryUSA, más los listeners de página aún sin auditar. Sin modificar código funcional ni scripts existentes.


## Seguridad y coexistencia: auditoría preliminar (2026-10-20)
- Revisión estática de Virtual Lotteries, LotteryUSA, Loterías RD y LotteryNet para identificar POST, manejadores y observadores.
- Implementado diagnóstico pasivo de Rover `tests/browser/rover-safety-audit.user.js` v0.1.0, sin lectura de números ni eventos sintéticos.
- Regresión Playwright con listeners hostiles que intentarían procesar por `input/change/blur`; comprobación de ausencia de activación por LotteryNet en la simulación.
- Suite estática de seguridad adicional para la ruta de escritura visual; se mantiene la entrada funcional inactiva.
- Pendiente auditar los scripts realmente instalados, listeners ocultos y Network real para garantizar A19.


## Auditoría DOM autenticada superada — 2026-10-20
- Confirmación directa del diagnóstico v0.4.0 en Tampermonkey/Rover: 247 filas inspeccionadas y 10/10 identidades correctas.
- En cada sorteo: nombre principal, código abreviado y los cinco atributos `loteria` coinciden.
- Verificación de estructura 2.1 completada en el plan, sin confundir variantes ni procesar resultados.
- Pendientes: manejadores de eventos, Network, coexistencia y restauración real; script funcional continúa inactivo.


## Corrección DOM con archivos reales — 2026-10-20
- Identificado el origen de `matchedRows: 0`: primera celda oculta con hora, nombre en segunda celda.
- Verificados 10 sorteos, códigos y cinco atributos `loteria` por fila en HTML del usuario.
- Localizador estricto por `.loteria-nombre`, `.loteria-abrev`, fecha y código `loteria` de los cinco inputs.
- Diagnóstico de solo lectura v0.4.0; pruebas unitarias y navegador con fixture sintético fiel a la estructura.
- Prohibido procesamiento; la entrada de producción sigue inactiva.


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
