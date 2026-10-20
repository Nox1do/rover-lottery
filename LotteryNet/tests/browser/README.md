# Pruebas de navegador de LotteryNet

**Estado: el userscript funcional sigue INACTIVO.** Los archivos de esta carpeta pertenecen a QA y no deben confundirse con la distribución de resultados.

- `isolated-rover.mjs`: DOM sintético de Rover, llenado visual, restauración, detección de conflictos, listeners simulados con POST adversario, cero eventos de LotteryNet y cero procesamiento.
- `manual-usa-overlap.mjs`: convivencia con LotteryUSA manual. Extrae y ejecuta **solo** la función original `triggerInput` de la versión 0.6.5 dentro de `127.0.0.1`. Reproduce clic manual, conflictos, idempotencia, parciales, orden de ejecución, restauración tras Search y fecha errónea.
- `rover-dom-audit.user.js` (v0.4.0): auditoría exclusivamente estructural. Confirmó **10/10** sorteos en Rover autenticado el 20/10/2026.
- `rover-safety-audit.user.js` (v0.1.0): auditoría de presencia de manejadores inline/propiedades y contador **pasivo** de eventos, sin leer valores, generar eventos ni emitir solicitudes.

## Ejecutar las regresiones aisladas

Se necesita Node.js, Playwright, Chromium y Firefox. En `LotteryNet`:

```bash
npm test
node tests/browser/isolated-rover.mjs
node tests/browser/manual-usa-overlap.mjs
```

La misma secuencia de navegador se ejecuta por GitHub Actions en [LotteryNet QA](https://github.com/Nox1do/rover-lottery/actions/runs/39455803575). Es una **prueba aislada** y no usa la sesión autenticada de Rover.

## Auditoría pasiva en Rover real — siguiente paso

1. Instalar `rover-safety-audit.user.js` desde el enlace raw o la vista de GitHub; no instalar el userscript funcional de LotteryNet.
2. Abrir la pantalla de resultados autenticada con los otros scripts activos. Seleccionar una fecha que muestre las diez filas y pulsar Search.
3. Ejecutar en consola `__LOTTERYNET_SAFETY_QA__.print()`. La tabla devuelve **solo** metadatos de los cinco campos y de sus manejadores: no leer ni compartir resultados, nombres de usuarios, historiales ni cookies.
4. Opcionalmente, `__LOTTERYNET_SAFETY_QA__.observe()` registra de forma pasiva los eventos que se produzcan por la actividad ordinaria; `__LOTTERYNET_SAFETY_QA__.stop()` cierra los listeners. No requiere pulsar procesar ni rellenar resultados.
5. Para la auditoría de Network, usar DevTools con *Preserve log* y filtrar la ruta `__inc/procesarResultados.php`. Compartir **solo** método, URL truncada al path, iniciador y momento; no enviar cookies, tokens, cabeceras o bodies.

**Limitaciones:** los metadatos DOM no revelan todos los listeners de `addEventListener` ni la instrumentación de otros scripts. Una solicitud propia de Virtual Lotteries a otro sorteo no demuestra que LotteryNet procese. No habilitar el llenado de LotteryNet sin pruebas explícitas de seguridad.
