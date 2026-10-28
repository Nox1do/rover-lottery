# Verificación

## 0.1.6 — 28/10/2026

- Base 0.1.5: 42 pruebas Node, 40 escenarios React/Firefox y dos de extensión aprobados. Antes del arreglo, las regresiones de ambos órdenes de llegada y Buscar intermedio fallaron: 47/50 Firefox. El instalador 0.1.5 también se detuvo después de presentar Pick 3 en la prueba de dos revisiones sucesivas.
- Se reprodujo el motivo: las dependientes generadas por Central conservan valores/X después del primer componente y el guard los considera ajenos. La lectura operativa acredita entregas parciales y completa de la misma PC; no se conserva el diagnóstico anterior a F5, por lo que la reproducción no equivale a una traza completa de esa sesión.
- `npm test`: 45 pruebas Node, 52 escenarios React/Firefox y dos de extensión aislada; cero fallos. `npm run check` y `git diff --check` aprobados. Los históricos 0.1.0–0.1.5 permanecen intactos.
- Cobertura nueva: reglas conocidas/desconocidas, segmentos y ceros; ambos órdenes de picks; Buscar entre componentes; reserva/presentación por revisión en el instalador; limpieza/edición manual aun con restauración al mismo valor, intervención de otro script, cambio silencioso de valores, reglas cambiadas, dependiente procesada/ausente y otra principal que comparte la dependiente. Esa última regresión falló antes de invalidar atribución por otra principal.
- GM y servicios simulados. Se mantienen las pruebas reales de aislamiento Firefox, pero no se realizó una publicación financiera ni se acredita resuelto el incidente anterior de Quinielón PM.

## 0.1.5 — 27/10/2026

- Base 0.1.4: 38 pruebas Node, 38 escenarios Firefox y dos de extensión, todos aprobados. Tres regresiones unitarias nuevas fallaron por falta de motivos/conciliaciones. La regresión del adaptador falló con `fillBlock` ausente; el diagnóstico del instalador 0.1.4 tampoco informa una denegación de reserva.
- La entrega añade pruebas de omisión local frente a denegación del servicio, campos ausentes, identidad ambigua, limpieza por fecha, y escenarios Firefox del adaptador y del instalador completo. El caso de reserva denegada conserva casillas vacías, no reporta `presented` y excluye campos secretos adicionales de la respuesta.
- Verificación final: `npm test` aprobó 42 pruebas Node, 40 escenarios React/Firefox y dos de extensión; cero fallos. `npm run check` confirmó el build reproducible y `git diff --check` no encontró errores. Los históricos anteriores permanecen intactos.
- El incidente real de Quinielón PM NO tiene causa retrospectiva acreditada. La lectura posterior ocurrió después de que el usuario llenara y procesara manualmente. La nueva versión aporta observabilidad; no altera la autorización remota ni fuerza rellenados.

## 0.1.4 — 27/10/2026

- Contra 0.1.3, las cuatro regresiones de presentación fallaron: tres casos de tabla completa/filtrada y un caso de picks cuyo foco nativo encontraba valores parciales. Resultado inicial: 34/38 escenarios Firefox aprobados. Otra regresión unitaria reprodujo la relectura de campos en un guard ya confirmado.
- Versión final: `npm test` aprobó 38 pruebas Node, 38 escenarios React/Firefox y dos escenarios en extensión Firefox aislada; cero fallos.
- Las pruebas muestrean los valores en frames y en el primer temporizador nativo: cero frames parciales al completar tres premios con 3 filas, 241 filas completas y 241 filas filtradas. Picks conservan ceros y dependientes; el foco nativo encuentra ambos picks completos.
- Se conserva la cancelación entre entradas mediante microtarea y se prueba una intervención tardía a los 10 ms con el userscript generado: no informa `presented`, no pinta verde y conserva el valor ajeno. El segundo escenario de extensión verifica la intervención entre página y sandbox real. Una reserva invalidada en microtarea detiene entradas restantes y conserva el foco original.
- La comparación completa de una nueva respuesta sigue siendo obligatoria aunque el conteo coincida. `npm run check` y `git diff --check` aprobados; históricos 0.1.0–0.1.3 conservados sin cambios.

Trazas de una ejecución de la fixture Firefox 153 (incluyen la comprobación final y un frame de muestreo):

| Filas | Filtro | Intervalo entre primera y última entrada | Tiempo total observado | Frames parciales |
| --- | --- | --- | --- | --- |
| 3 | No | 11 ms | 63 ms | 0 |
| 241 | No | 149 ms | 255 ms | 0 |
| 241 | Una fila | 5 ms | 51 ms | 0 |

La agrupación elimina la presentación escalonada reproducida, pero la tabla completa todavía tiene coste de renderizado. Reducir lecturas propias no demuestra por sí solo menor latencia total; estas cifras no predicen el rendimiento en la sesión del usuario. Se mantienen GM/servicios simulados, token privado y publicación manual.

## 0.1.3 — 27/10/2026

- Antes de implementar: 15/21 pruebas de contexto aprobadas; seis regresiones fallaron por códigos con espacios, colisiones, retención de edición y diagnóstico. La suite Firefox dio 27/32: fallaron las dos reproducciones con BRAZIL, las protecciones de dependientes/revisiones con códigos rodeados de espacios y el diagnóstico de una fila ajena.
- Después de la corrección, `npm test`: 37 pruebas Node, 32 escenarios React/Firefox y una extensión Firefox aislada; cero fallos.
- Las pruebas incluyen espacios, tabulación y NBSP exteriores; colisiones; diferencias internas que siguen rechazadas; persistencia frente a edición; 118 filas con consulta y azul; llenado NICA/LA DIARIA; dependientes editadas; conflictos e identidad ajena indicada en diagnóstico.
- `npm run check` y `git diff --check`: aprobados. Históricos 0.1.0, 0.1.1 y 0.1.2 conservados sin cambios.

El diagnóstico de la sesión identificó la fila incompatible, pero no mostró el valor crudo recibido de su código. Se reprodujo y corrigió la asimetría entre recorte DOM y respuesta; no se afirma haber observado el carácter exacto en esa sesión. Después, el usuario confirmó que 0.1.3 ya funciona y llena en Firefox/Tampermonkey, aunque informó llenado visual escalonado. Se mantienen servicios/GM simulados y publicación manual; no se cambió el backend ni se publicaron resultados reales.

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
