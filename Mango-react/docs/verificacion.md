# Verificación

## 0.1.3 — 27/10/2026

- Antes de implementar: 15/21 pruebas de contexto aprobadas; seis regresiones fallaron por códigos con espacios, colisiones, retención de edición y diagnóstico. La suite Firefox dio 27/32: fallaron las dos reproducciones con BRAZIL, las protecciones de dependientes/revisiones con códigos rodeados de espacios y el diagnóstico de una fila ajena.
- Después de la corrección, `npm test`: 37 pruebas Node, 32 escenarios React/Firefox y una extensión Firefox aislada; cero fallos.
- Las pruebas incluyen espacios, tabulación y NBSP exteriores; colisiones; diferencias internas que siguen rechazadas; persistencia frente a edición; 118 filas con consulta y azul; llenado NICA/LA DIARIA; dependientes editadas; conflictos e identidad ajena indicada en diagnóstico.
- `npm run check` y `git diff --check`: aprobados. Históricos 0.1.0, 0.1.1 y 0.1.2 conservados sin cambios.

El diagnóstico de la sesión identificó la fila incompatible, pero no mostró el valor crudo recibido de su código. Se reprodujo y corrigió la asimetría entre recorte DOM y respuesta; no se afirma haber observado el carácter exacto en esa sesión. Se mantienen servicios/GM simulados y publicación manual. Falta confirmar 0.1.3 en Firefox/Tampermonkey del usuario; no se cambió el backend ni se publicaron resultados reales.

## 0.1.2 — 27/10/2026

- Regresión reproducida antes del cambio: 23/27 escenarios Firefox aprobados; fallaron la recuperación del azul tras ocultar la fila, tras dejar cero coincidencias, durante una consulta pendiente y tras filtrar una fila con edición manual. Los cuatro fallos esperaron el indicador sin recibirlo antes de 700 ms. La prueba unitaria nueva también falló antes de implementar la sincronización visual.
- Después de la corrección, `npm test`: 30 pruebas Node, 27 escenarios React/Firefox y una extensión Firefox aislada; cero fallos.
- Los escenarios del userscript generado comprueban la recuperación del azul antes del siguiente sondeo, el mismo número de solicitudes, ausencia de llenados, conservación de números manuales y suspensión ante fecha histórica. Otros dos escenarios impiden restaurar el azul después de recibir `exhausted` o `processed`. La prueba unitaria comprueba limpieza de inputs desmontados y que sincronizar azul no alargue el verde.
- `npm run check` y `git diff --check`: aprobados. Históricos 0.1.0 y 0.1.1 conservados sin cambios.

Los servicios y APIs GM siguen simulados. Falta confirmar el comportamiento de 0.1.2 al filtrar en la sesión personal del usuario; no se realizó ninguna publicación financiera ni se modificó el backend.

## 0.1.1 — 27/10/2026

- Antes del cambio: la suite original aprobó 29 pruebas Node, 15 escenarios React/Firefox y una extensión aislada. Al actualizar la fixture al icono PROC actual y añadir las regresiones, Firefox reprodujo el bloqueo «Central está cargando resultados…»: 15/21 escenarios aprobados; fallaron `circle-check`, `check-circle-2`, la tabla de 14 filas, PROC con edición, el userscript completo y Buscar con edición manual.
- Después de corregir el selector: `npm test` aprobó 29 pruebas Node, 21 escenarios React/Firefox y una prueba en extensión aislada; cero fallos.
- Las regresiones comprueban iconos actuales y anteriores, persistencia de una fila procesada sin sobrescribirla, 14 filas con 13 procesadas y entrega a la pendiente, y bloqueo de PROC desconocido aunque tenga color verde y Status muestre éxito. El userscript generado también se prueba con una fila procesada presente.
- `npm run check`: instalador, metadatos, versión y copia histórica reproducibles. `git diff --check`: sin problemas de espacios. Se conserva sin cambios el histórico 0.1.0.

La corrección se verificó con React real en Firefox y servicios simulados. Después de instalar 0.1.1, el usuario confirmó en su sesión fecha/servidor verificados, token válido, siete filas API y siete coincidencias, sin errores ni discordancias. Falta validar un llenado real y su retención tras otro render. No se realizó una publicación financiera ni se modificó el backend.

## 0.1.0

Ejecutado el 27/10/2026:

- `npm test`: 29 pruebas de Node, 15 escenarios React/Firefox y una prueba en extensión aislada de Firefox; cero fallos.
- `npm run check`: instalador, metadatos, versión y copia histórica reproducibles.
- `git diff --check`: sin problemas de espacios.

La revisión independiente encontró dos errores importantes antes de publicar. Se corrigieron con regresiones observadas fallando y después pasando:

1. Reservas retenidas: ahora se comprueban revisión, valores autorizados, vencimiento y contexto antes de rellenar y entre escrituras; se descartan reservas antiguas al cambiar de contexto o revisión.
2. Buscar con edición local retenida: se suspende autorización al iniciar Buscar, pero se conserva la referencia persistida del mismo contexto. Solo una nueva respuesta válida vuelve a autorizar; una edición local no se confunde con publicación.

También se reprodujeron y corrigieron la carrera de consumo de respuesta entre contextos Firefox, intervención de otro userscript durante el llenado, trabajo oculto por filtro y filas API de otra fecha.

La extensión temporal permite comprobar Xrays/exportFunction, respuesta original intacta, llenado retenido por React y ausencia de capacidades GM en la página. Las respuestas Mango y funciones GM están simuladas. Esto no certifica una instalación personal de Tampermonkey ni una publicación financiera real; esas acciones no se realizaron. Las pruebas usan un ajuste del aislamiento de procesos de Firefox necesario en este entorno, separado del aislamiento de JavaScript de la extensión.
