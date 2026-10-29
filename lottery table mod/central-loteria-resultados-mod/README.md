# Central Loterías Resultados Mod

Userscript independiente para la pantalla React de resultados de loterías de Rover Central.

- **Script:** `central-loterias-resultados-react.user.js`
- **Versión actual:** `0.0.13` (inicial: `0.0.1`)
- **Página objetivo:** `https://central.roversport.net/loteria/resultados/ver`
- **Navegadores:** Firefox y Opera con Tampermonkey

## Instalación y actualizaciones

1. Abre el [userscript RAW](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/lottery%20table%20mod/central-loteria-resultados-mod/central-loterias-resultados-react.user.js) desde Firefox u Opera.
2. Instálalo o actualízalo con Tampermonkey.
3. Carga los resultados de lotería desde la opción **Buscar** de Central.

El archivo incluye `@updateURL` y `@downloadURL` dirigidos a esta ruta estable de la rama `main`.
Para futuras versiones, incrementar **tanto** `@version` como la constante `VERSION` del código, probar los cambios y publicar un nuevo commit. Tampermonkey podrá detectar la actualización de acuerdo con su configuración e intervalo de búsqueda.

## Cambios en v0.0.2

- Inicio anticipado con `@run-at document-start`, con montaje inmediato cuando la tabla ya está disponible y observación cuando React la crea después.
- Los filtros dejan de usar `position: fixed` y `z-index` elevado: ahora se integran en la tarjeta de resultados, junto a su barra de búsqueda cuando hay espacio o en una fila propia encima de la tabla.
- Ocultación de filtros al abrir modales; recuperación al cerrarlos y al reconstruirse tabla o barra superior, sin duplicar controles.
- Limpieza de controles al cambiar a otra vista/ruta y compatibilidad con pantallas estrechas.
- El diagnóstico `status()` incluye `panel.mounted`, `panel.mode`, `panel.inTableCard` y `panel.hidden`.

## Pruebas v0.0.2

Validado con `node --check` y Playwright/Chromium sobre reproducción local de la tabla de 12 columnas (no sobre producción autenticada): inicio antes y después de la tabla, filtros, colores, modales, reconexión del toolbar, reconstrucción de filas y tabla, cambio de ruta, vista oculta y tamaño móvil. Sin errores JavaScript ni bucles de MutationObserver. Firefox real y la sesión autenticada quedan pendientes de verificación.

## Funcionalidad base v0.0.1

- Filtros visuales excluyentes: **Procesados pendientes** y **Sin procesar**.
- Resaltados rojo suave y azul suave para los sorteos configurados.
- Clasificación pasiva de estados por las columnas `PEND.` y `PROC.`.
- Monitoreo limitado de cambios de filas en React, sin jQuery DataTables.
- Diagnóstico por consola: `__CENTRAL_LOTERIAS_REACT_QA__.status()` y `.rows(10)`.

El script no procesa sorteos, no introduce peticiones de red y no modifica los valores de los campos. Los estados que no se logran clasificar siguen visibles al filtrar.

## Verificación

Se comprobó la sintaxis con Node y se ejecutaron pruebas de Playwright/Chromium sobre una página simulada con la estructura de 12 columnas observada en Central. Queda pendiente validar el comportamiento completo sobre la sesión autenticada de producción.

El mod anterior `Rs-loteria-res-tabla-mod.user.js`, ubicado en el directorio padre, permanece independiente e intacto.

## Cambios recientes

- **v0.0.13 (diseño FOTOS aprobado):** sustituye el indicador azul intenso de v0.0.12 por un azul pastel igual al mockup (`#DEEDFE`, texto/icono `#16335F`), sin borde azul ni halo/sombra y con esquinas suavemente redondeadas. El botón `+`, contadores cero y filas excluidas permanecen sin cambios. Conserva el realce para teclado en `:focus-visible`, no modifica anchos ni padding de las celdas y mantiene las 111 exclusiones exactas. Verificación de sintaxis y contrato CSS realizada; pendiente comprobación visual en Firefox autenticado.
- **v0.0.12 (indicador FOTOS):** mockup aprobado implementado. Cuando el botón de galería muestra un contador entero **>= 1**, se destaca en azul claro (#c9e1ff), texto azul oscuro (#153f7f), borde azul (#5d9df5) y resplandor discreto. Con **0** o sin contador, permanece el aspecto gris original. El botón **+** no cambia; los botones ocultos por las 111 exclusiones siguen ocultos. El indicador reacciona a cambios dinámicos de React y no modifica tamaño ni distribución. En Firefox: `__CENTRAL_LOTERIAS_REACT_QA__.photoAudit(200)` muestra `photoCount` y `bluePhotoButtons`. Pruebas de lógica (13/13), sintaxis y actualización de 0→3 y 2→0 correctas; pendiente validación visual en Central autenticado.
- **v0.0.11 (LA CHICA):** corrige la colisión entre los códigos `LA-CHICA` y `LACHICA`. Se conserva el guion en la clave de coincidencia de nombre/código. **LA CHICA (LA-CHICA)**: ocultar los dos botones FOTOS; **LA CHICA (LACHICA)**: mantenerlos. **NEW YORK AM (NEW YORK PM)** sigue excluida; **NEW YORK PM (NY-PM)** conserva sus botones. Se mantienen 111 exclusiones y el alcance exclusivo sobre FOTOS. QA: 126 casos positivos/negativos con 126 aciertos; validación final en Firefox pendiente.
- **v0.0.10 (coincidencia exacta FOTOS):** corrige falsos positivos en nombres repetidos. Una exclusión requiere el **par completo nombre + código** de la celda LOTERIA, ya sea texto concatenado o nodos hijos separados. **LA CHICA (LA-CHICA):** ocultar; **LA CHICA (otro código):** mantener. **NEW YORK AM (NEW YORK PM):** ocultar; **NEW YORK PM (NY-PM):** mantener. Se elimina la coincidencia por nombre solo. `photoAudit()` incluye el campo `exactMatch` para auditar las coincidencias. Se conservaron las 111 entradas, y pasaron 126 pruebas de identidad/anti-colisión. Validación en Firefox autenticado pendiente.
- **v0.0.9 (FOTOS):** exclusión visual de los dos botones dentro de la celda **FOTOS** para las **111 entradas** de la lista proporcionada. Identificación exacta y normalizada por nombre y par nombre/código; nunca por subcadenas ni por código aislado. La entrada literal **NEW YORK AM (NEW YORK PM)** permanece identificada por **nombre** para evitar ocultar NEW YORK PM. Reconoce el índice de FOTOS a partir de los encabezados, evita modificar ACCIÓN u otras columnas y vuelve a comprobar la identidad cuando React reutiliza una fila o la tabla se reconstruye. El mod sólo oculta botones en el DOM, no bloquea cargas de fotos por servidor/API. Diagnóstico: `__CENTRAL_LOTERIAS_REACT_QA__.status().photoExclusions` y `__CENTRAL_LOTERIAS_REACT_QA__.photoAudit(200)`. QA unitario: 111 casos positivos y 9 comprobaciones de exclusión, cambio de fila y alcance de CSS, todas correctas; pendiente inspección en Firefox autenticado.
- **v0.0.8 (optimización Firefox):** elimina las consultas a `getComputedStyle`, `getClientRects`, `scrollHeight` y `clientHeight` del montaje inicial, sustituyéndolas por inspección estructural de clases Tailwind (`overflow-auto` frente a `overflow-x-auto`) y atributos/estado de visibilidad. Conserva posición de filtros, detección de modales, bloqueo estable de las 13 columnas, clasificación y métricas de v0.0.7. Motivación: en Firefox v0.0.7 `scrollHostAndAttributes=76ms` y `panelPlacement=101ms` de `188ms` totales, mientras `rowProcessing=11ms`. La nueva versión pasó validación de sintaxis y pruebas aisladas sin geometría, selección correcta del scroll vertical, limpieza de atributos y visibilidad de modales; pendiente medición comparativa en Firefox real. Ejecutar tras **Buscar** `console.table(__CENTRAL_LOTERIAS_REACT_QA__.status().timings.lastBindStagesMs)`.
- **v0.0.7 (instrumentación):** no cambia el diseño ni la estrategia de búsqueda de v0.0.6. Añade tiempos por fase reales a `__CENTRAL_LOTERIAS_REACT_QA__.status().timings`: `lastDiscoveryDurationMs`, `lastBindStagesMs` (cleanup, headers, scroll, panel, filas, observer) y `lastRowStagesMs` (obtención de filas, anotación, bloqueo de columnas, resumen). Para analizar un Buscar real en Firefox, ejecutar después de cargar `console.table(__CENTRAL_LOTERIAS_REACT_QA__.status().timings.lastBindStagesMs)` y `console.table(__CENTRAL_LOTERIAS_REACT_QA__.status().timings.lastRowStagesMs)`. No contiene datos de lotería; no realiza peticiones de red.
- **v0.0.6:** detección inmediata mediante `MutationObserver` al insertar la tabla tras **Buscar**, sin la espera habitual de descubrimiento (45 ms) ni la cola inicial de decoración de filas (50 ms). Al reemplazar `tbody` se actualizan las filas en el propio callback para tablas de hasta 400 filas; tablas mayores conservan la ruta diferida por seguridad. Nuevas métricas `performance.immediateDiscoveries`, `performance.immediateRowRefreshes`, `timings.lastBindDurationMs` y `timings.lastMutationRefreshMs`. Verificación de sintaxis de la versión publicada y prueba aislada de inserción DOM en Chromium con 13 columnas, 130 filas, modal y búsqueda repetida; la sesión real Firefox sigue pendiente.
- **v0.0.5:** la tabla de 13 columnas, incluida **FOTOS**, usa anchos mínimos compactos por encabezado y proporciones que ocupan el ancho disponible; se retira el mínimo rígido de 1,495 px medido con viewport estrecho. La reserva de scrollbar se coloca únicamente en el contenedor con desplazamiento vertical real. Conserva las columnas alineadas al filtrar sin ocultar resultados. En anchuras inferiores a ~1,103 px se conserva el desplazamiento horizontal por legibilidad. Pruebas locales de geometría con Playwright/Chromium (731, 1220 y 1580 px) sin deriva entre estados; la validación final en Firefox/Opera autenticados sigue pendiente. **QA:** `columnLock.totalMinWidth`.
- **v0.0.4:** captura de anchuras con la tabla completa antes de ocultar filas, algoritmo `table-layout: fixed` con anchos originales, `scrollbar-gutter: stable` y recuperación del bloqueo tras reconstrucción React. Reconocimiento estricto de 12 columnas para descartar tablas internas de modales. Pruebas de regresión en Chromium: 189 filas, filtros que muestran 126 o 1 fila, cuatro resoluciones, modales y reconstrucción de tabla sin desplazamiento horizontal de columnas. Pendiente comprobar en Firefox/Opera autenticados.
- **v0.0.3:** panel de filtros anclado siempre a la barra de búsqueda; elimina el umbral de ancho que lo movía a otra fila al cambiar los resultados. El contenedor admite ajuste de línea en pantallas estrechas. Pruebas locales con Playwright en varios anchos, modales y reconstrucciones de React.
- **v0.0.2:** filtros integrados en la tarjeta de tabla (no `position: fixed`), observación de cambios y retirada al abrir un modal.
- **v0.0.1:** primera adaptación a Central.

## Diagnóstico de inicialización React (solo lectura)

Para investigar si la tabla se muestra antes de que los estilos del mod estén listos, usar el
[React Timing QA](https://github.com/Nox1do/rover-lottery/blob/main/lottery%20table%20mod/central-loteria-resultados-mod/central-loterias-react-timing-qa-readonly.js).
No es una nueva versión del userscript principal.

1. Abrir el [RAW](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/lottery%20table%20mod/central-loteria-resultados-mod/central-loterias-react-timing-qa-readonly.js), copiarlo en F12 > Consola de Firefox **antes de pulsar Buscar**.
2. Pulsar Buscar. Repetir una vez cuando la tabla ya exista, para comprobar si React reemplaza solo las filas.
3. Tras la segunda consulta, ejecutar `__CENTRAL_TIMING_QA__.finish(); __CENTRAL_TIMING_QA__.report();`.
4. Exportar el informe con `console.log(__CENTRAL_TIMING_QA__.exportJson())`. Opcional: `__CENTRAL_TIMING_QA__.stop()` para retirar el observador.

La herramienta mide timestamps relativos al clic, primera mutación del DOM, presencia de tabla,
atributos del mod, aplicación de widths, anotaciones de filas, panel y métricas QA de la v0.0.6.
Evita leer valores de loterías, emails, tokens, URLs de red o datos de los formularios.

**Limitación:** la consola abierta después de cargar la página no puede medir la inyección
original del userscript al navegar. requestAnimationFrame se ejecuta antes del repintado, y
su timestamp no representa el instante exacto de visualización. Validar Firefox Content Script
API desde ajustes de Tampermonkey si el problema se limita a la primera carga de documento.
