# Changelog

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
