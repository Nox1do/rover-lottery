# Verificación

## 0.1.10 — 29/10/2026

- Reporte: el Buscar automático interrumpe el azul durante varios segundos al coincidir los sorteos del mediodía. Contra 0.1.9 las cuatro regresiones fallaron: se disparó submit tras más de dos minutos de vigilancia, con tabla completa o filtro sin coincidencias, con ready sin permiso de llenar y con horario nativo próximo. El código invalida la época al recibir submit, por lo que los colores anteriores se descartan correctamente durante esa carga; el defecto era iniciar la carga durante actividad.
- Con el aplazamiento en el final del ciclo, las cuatro regresiones pasan. Comprueban ausencia de submit y conservación de época durante vigilancia, consulta Mango continuada, azul al mostrar nuevamente la fila, una única reserva y presentación con ceros/verde cuando llega el resultado. También comprueban que ready sin azul no fuerza llenado y que al terminar la ventana/actividad vuelve a permitirse el refresco.
- La fixture captura el intervalo del instalador, pero espera el cambio de última consulta para acreditar el ciclo completo: el callback nativo invoca tick sin devolver su promesa. Servicios/GM simulados; React y Firefox reales.
- La Primera Día se investigó con SELECT de esa fecha y PC: reconocimiento manual12:04:52.110RD, sin paint registrado; el resultado actualmente disponible consta confirmado por recovery12:10:54RD y ready_at nulo. No acredita una entrega disponible perdida durante refresco ni quién originó valores discrepantes. No se modificó el backend ni se publicó un resultado financiero.
- Verificación final: `npm test` aprobó 67 pruebas Node, 79 escenarios React/Firefox y cuatro de extensión aislada; cero fallos. La revisión independiente no encontró problemas. `npm run check` y `git diff --check` aprobados; los históricos0.1.0–0.1.9 permanecen intactos.

## 0.1.9 — 29/10/2026

- Reporte: Anguilla 9 AM con azul tardío y sin verde. SELECT de la PC indicada: listening12:57:53.585Z, ready13:01:05Z, presented13:01:08.938Z y reconocimiento de procesado nativo13:01:19.637Z. Acredita entrega, no el DOM/color histórico ni una interacción concreta. No mezclar el reloj del diagnóstico del cliente con el servidor para calcular latencias precisas.
- Firefox inicial: 1/5 escenarios nuevos. Fallaron ambos verdes al filtrar, la detección con revisión constante y el refresco después de una publicación propia persistida. Las pruebas unitarias reprodujeron plazo perdido y ventana ausente antes del arreglo.
- Se comprueban plazo original, valor/PROC/intervención/contexto distintos, ventana RD válida12/24horas, límites temporales, exclusión de mañana y backoff30s pese a cercanía.
- La revisión independiente encontró dos límites importantes: Buscar rápido heredaba verdes y una dependiente oculta pendiente permitía refrescar. Ambas regresiones fallaron antes de ligar colores a época/fecha/servidor y añadir todos los registros propios/dependientes al bloqueo. La dependiente se prueba con principal visible y filtro totalmente vacío; cuando ambas están procesadas/coincidentes y disponibles sí se permite refresco.
- Verificación final: `npm test` aprobó 67 pruebas Node, 75 escenarios React/Firefox y cuatro de extensión aislada; cero fallos. `npm run check` y `git diff --check` aprobados. Históricos0.1.0–0.1.8 conservados; no se cambió el backend ni se realizó ninguna publicación financiera.

## 0.1.8 — 28/10/2026

- Base: 49 pruebas Node aprobadas. Tres regresiones de contexto fallaron por el bloqueo global: RHOD incompatible, duplicado nativo aislable y fila nunca verificada. El comparador puro y rowBlock no existían. La retención fallida impedía a REAL continuar con `context_changed`.
- Dos regresiones de entrega fallaron antes de integrar rowBlock: A incompatible todavía reservaba y el ACK sin campos administrados infería todos los inputs. Se conservaron pruebas negativas y se actualizaron deliberadamente las expectativas que exigían bloquear toda la tabla por una sola fila.
- Tres escenarios nuevos del instalador fallaron por diagnóstico ausente; después comprobaron azul y dos entregas independientes junto a RHOD-MD incompatible, primera retención fallida con segunda entrega válida, y 25 incidencias nativas resumidas en 20 que se limpian al cambiar contexto. No hay reserva ni ACK de Rhode Island y no se pulsa Procesar.
- Regresiones de copias defensivas y primer montaje asíncrono de tabla también se observaron fallando antes de sus correcciones. Los escenarios previos de picks separados, Buscar y filtros siguen incluidos.
- Verificación completa: `npm test` aprobó 61 pruebas Node, 67 escenarios React/Firefox y cuatro de extensión aislada; cero fallos. `npm run check` reproducible y `git diff --check` aprobados. Los históricos 0.1.0–0.1.7 se conservan.
- La revisión independiente encontró dos fallos importantes: pruebas parciales que bloqueaban campos nuevos ya coincidentes y alcance de dependientes no revalidado durante el llenado. Se añadieron regresiones Node y Firefox que fallaron antes del arreglo. Las pruebas de reglas cambiadas en microtarea, dependiente cambiada durante asentamiento/entre entradas y cambio entre fill/presented exigen conservar el cambio ajeno, omitir NY y continuar REAL. La prueba de ampliación de expected_fields exige dos reservas/presentaciones sucesivas y conserva el campo ajeno. También se incluyó el propósito en los fallos de comprobación por campo.
- Para dejar que React muestre trabajo pendiente de otras microtareas, las filas con dependientes ceden la cola mediante MessageChannel entre entradas; no se agregan pausas fijas de 35 ms por campo. Esto puede adelantar el foco nativo antes de completar ambos picks, por lo que la regresión comprueba valores finales y restauración del foco del usuario. Se conservan los tres escenarios de frames agrupados para filas sin dependientes. La extensión aislada añade éxito e intervención sobre dependientes; el caso de intervención falló contra el instalador anterior al arreglo.
- GM/servicio simulados con Firefox y React reales; no se realizó una publicación financiera. La diferencia exacta del RHOD-MD de la sesión anterior sigue desconocida; esta actualización corrige el alcance del bloqueo, sin atribuir al usuario una edición no acreditada.

## 0.1.7 — 28/10/2026

- Con 0.1.6 se reprodujo el JSON del usuario: tras una edición de RHOD-MD y un cambio remoto de configuración, Buscar deja `fecha_verificada: null`, `filas_api: 0`, token sin comprobar y el mismo error de campos distintos. Pausar/reanudar también pierde la referencia. Ambas regresiones completas fallaron: 52/54 escenarios React/Firefox. Una regresión unitaria del motivo de suspensión falló: 48/49 Node.
- La corrección conserva el baseline ya verificado sin conservar autorización. Las pruebas exigen que antes de Buscar no se consulte Mango, que una respuesta nueva recupere el azul, que RHOD-MD siga editada y que otra fila se llene con reserva/presentación nuevas, sin ACK ni publicación de RHOD-MD.
- Cobertura negativa: no se admite una edición sin verificación anterior, persistencia cambiada ni un servidor ID distinto; se conservan todos los controles previos de fecha, PROC, identidad, contexto y reservas.
- Verificación final: `npm test` aprobó 49 pruebas Node, 54 escenarios React/Firefox y dos de extensión aislada, sin fallos. `npm run check` y `git diff --check` aprobados. Históricos 0.1.0–0.1.6 sin cambios.
- El diagnóstico identifica el bloqueo actual y reproduce una ruta que lo provoca; no conserva quién inició el cambio de configuración ni una traza del instante previo a las publicaciones manuales de Anguilla/Real PM. No se realizaron publicaciones financieras reales.

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
