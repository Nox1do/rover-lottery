# Diagnóstico de consultas móviles desde Firefox

`usa-mobile-console-qa.js` es un snippet independiente para pegar en **F12 → Consola** en Central, con USA React instalado. No es una actualización del userscript ni un instalador Tampermonkey. No cambia resultados, no pulsa botones, no envía solicitudes y no reemplaza fetch, XHR o GM.

## Uso

1. Seleccionar la fecha y pulsar Buscar normalmente. Abrir la barra USA React.
2. Copiar completo `usa-mobile-console-qa.js` y ejecutarlo en la consola de la página.
3. Consultar **una lotería móvil a la vez**. Mantener esa pestaña visible. Al terminar, esperar aproximadamente un cuarto de segundo: aparece `USA_MOBILE_QA_RESULT` con resumen y JSON.
4. Copiar los informes con el helper de Firefox:

```js
copy(__USA_MOBILE_QA__.json())
```

Se guardan los últimos cinco informes. Repetir con la tabla completa y con una sola fila filtrada permite comparar el mismo sorteo/fecha. Para ver el último resultado: `__USA_MOBILE_QA__.last()`. Para desactivar y restaurar el gancho propio de consola: `__USA_MOBILE_QA__.stop()`. Reejecutar el snippet sustituye limpiamente su instalación anterior; recargar la página también lo elimina.

## Diseño y alcance de la medición

Se eligió observación temporal desde consola porque permite diagnosticar la instalación actual sin modificar el producto. Un segundo userscript tendría su propio sandbox GM; envolver fetch de la página no revelaría las solicitudes GM del primer userscript. Instrumentar internamente el producto podría dar detalles adicionales de transporte, pero requiere otro cambio y queda fuera de este snippet.

- Registra clic real, estado del botón, primera entrada, duración observada de propagación de cada input, primera marca verde, scroll y mutaciones estructurales del root.
- Mide pausas entre frames y retrasos de temporizadores solo con la pestaña visible; no etiqueta una pausa como CPU de React ni atribuye el coste a un userscript concreto.
- Intenta copiar **solo** los cuatro tiempos y la fecha/sorteo del informe nativo de USA React 0.0.13 mediante un gancho temporal de `console.table`. Si el sandbox de Tampermonkey usa otra consola o una referencia anterior, `internalTimings` queda en `null`. Las pruebas incluyen ese caso; no se presupone acceso al sandbox.
- `gmNetworkMs` siempre es `null`: no observa directamente la red GM. Incluso `internalTimings.sourceMs`, cuando está disponible, incluye transporte, parseo y programación de callbacks; no es una medición de red pura.
- Desde USA React 0.0.14, al repetir picks iguales el evento de captura puede registrar longitud 4 para Pick 3 y 5 para Pick 4: corresponde al espacio final que el manejador nativo elimina en la misma entrada. No demuestra que se haya conservado un pick inválido; la verificación final exige los números canónicos. La repetición normal genera dos eventos en vez de cuatro.
- `phaseMs.clickToFirstInput` mide espera previa **total**, no latencia de API. `observedPropagationMs` abarca manejadores entre la captura del input y su llegada a window; no incluye trabajo anterior ni renders asíncronos posteriores. Si alguien detiene la propagación, esa duración queda en `null`.
- Detecta soporte de Long Tasks mediante `PerformanceObserver.supportedEntryTypes`; si falta, lo marca como no disponible, sin asumir soporte de Chromium.
- Observa una fila y el botón; no lee geometría en cada frame. Las listas e historial están acotados. No guarda tokens, cabeceras, cuerpos de respuesta ni valores de los campos.
- Al terminar el botón toma una cola de 250 ms para observar scroll/verde. Si se consulta otro botón, se cierra la muestra anterior indicando solapamiento. A los 90 s cierra la observación, **sin cancelar la consulta del producto**.

El diagnóstico añade algo de trabajo. `setupMs` registra su preparación; los contadores no constituyen un benchmark de coste cero ni una garantía de fluidez en producción. No inferir «la API es lenta» únicamente porque el intervalo anterior al primer input sea grande. Si `internalTimings` es null, adjuntar también la tabla original Fuente/Cola/Formulario/Total que imprime USA React.

## Comprobación

Las regresiones `QA móvil` de `tests/firefox.cjs` comprueban consulta demorada, consola compartida y referencia de consola aislada simulada, evento input con carga síncrona conocida, reinstalación/limpieza y fallo de red sin llenado. Usan React y Firefox con GM simulado; no certifican captura de consola en una instalación personal de Tampermonkey.

```sh
TEST_FILTER='QA móvil' ROVS_FIREFOX_CONTAINER=1 node tests/firefox.cjs
```

Referencias: [helpers de consola Firefox](https://firefox-source-docs.mozilla.org/devtools-user/web_console/helpers/index.html), [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), [tipos disponibles de PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/supportedEntryTypes_static), [documentación Tampermonkey](https://www.tampermonkey.net/documentation.php).
