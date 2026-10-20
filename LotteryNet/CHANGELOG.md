# Changelog

## 0.1.0 — 2026-10-19
- Estructura `LotteryNet/` creada sin alterar proyectos existentes.
- Copia del plan maestro y reglas `AGENTS.md`.
- Configuración inicial de 5 estados, 10 sorteos y 2 juegos por sorteo.
- Función pura para mapear Pick/Cash/Daily 3 y 4 a los cinco inputs de Rover.
- Contratos **no implementados** para extractor, transporte, scheduler, coordinación multitab, escritura y UI.
- Pruebas iniciales de configuración, mapeo y ausencia de procesamiento.
- Preparación de build esbuild; distribución de producción **no realizada**.

**Validación:** pruebas unitarias locales previstas con `npm test`; pruebas reales de navegador y distribución pendientes. No declarar funciones en producción.
