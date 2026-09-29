# Virtual Lotteries v3.1.0 — guía breve

El userscript reconoce 25 sorteos de NationJL, Rapid, PremierLotto, QPlay Brazil y The Queen Lottery. Québec EXTRA conserva su botón manual y su pestaña de Lottery Post.

## Activación

1. Actualiza el userscript existente a v3.0.0 y desactiva cualquier copia anterior para que no haya dos motores en la misma página.
2. Abre `lottery.php`. Junto al campo de fecha aparece **AUTO: OBSERVAR**. En este modo se buscan y contrastan resultados; si la fecha visible es hoy, se muestran en los inputs vacíos, pero no se envían a Rover. La consola muestra los sorteos activos y los estados `WAITING_RESULT` y `RESULT_READY`.
3. Para probar el flujo completo de Rapid, elige **AUTO: RAPID** en **un solo puesto**. Los seis sorteos Rapid pueden enviarse y verificarse automáticamente; NationJL, Premier, Brazil y Queen siguen en observación. Los otros dos usuarios deben permanecer en **AUTO: OBSERVAR**. El ajuste se conserva en ese navegador.
4. **AUTO: TODOS** habilita las cinco fuentes y requiere el mismo control de un solo emisor. Para pausar envíos, vuelve a **AUTO: OBSERVAR**. Un envío que ya comenzó se verifica antes de concluir; revisa la consola.

Al pulsar **Search** en Rover, si la tabla se reconstruye, los resultados que el userscript ya había encontrado se restauran automáticamente siempre que la fila siga vacía o coincida; nunca se sobrescriben valores distintos devueltos por Rover.

La automatización solo usa la fecha actual de República Dominicana. Cambiar la fecha visible de Rover afecta a los botones manuales, no a los sorteos automáticos. El motor necesita que `lottery.php` esté abierto; la pestaña puede estar en segundo plano. Si el navegador no dispone de Web Locks, el script permanece sin enviar.

## Estados y revisión

| Estado | Acción |
|---|---|
| `WAITING_RESULT` | La fuente aún no muestra cinco valores válidos. El script vuelve a consultar. |
| `RESULT_READY` | Resultado listo; en observación espera que se active el emisor. |
| `DONE` | Rover confirmó estado procesado y los cinco valores iguales. |
| `CONFLICT` | Rover o los inputs visibles tienen otros valores. Revisar manualmente. |
| `DUPLICATE` | Los tres números principales coinciden con otra fila. Revisar manualmente. |
| `PROCESS_UNCERTAIN` | Pudo enviarse un POST, pero Rover no confirmó el resultado. Revisar antes de cualquier acción; el script no repite el POST. |
| `ERROR` | Falló una consulta; el motor espera y vuelve a intentar. |

Si un sorteo queda en `CONFLICT`, el motor vuelve a consultar tanto la fuente como Rover cada ~20 segundos. Esto evita que un resultado antiguo guardado mantenga un conflicto falso cuando la fuente ya cambió o fue corregida. Cuando Rover procesado coincide con la fuente actual, cambia automáticamente a `DONE` sin repetir el POST. Cuando Rover quede procesado con los cinco valores exactos de la fuente, el estado cambia automáticamente a `DONE` sin repetir el POST.\n\nLos detalles de cada sorteo se consultan en `console.table` y en el almacenamiento de Tampermonkey bajo `vl:auto:v3:AAAA-MM-DD:CÓDIGO`. No borres un estado `PROCESSING`, `VERIFYING` o `PROCESS_UNCERTAIN` para forzar otro envío: verifica primero la fila de Rover.

**Límite:** los navegadores de tres operadores no comparten un bloqueo atómico. Por eso solo uno debe ser emisor; esta versión no puede impedir por sí sola una carrera con un procesamiento manual simultáneo en otro equipo. Antes de habilitar los tres puestos como emisores se necesita una garantía del lado del servidor.


## Mensajes DONE

Cuando un resultado fue enviado por el motor y posteriormente confirmado en Rover, el estado `DONE` muestra `Procesado y verificado en Rover.` en vez de un motivo vacío. Los estados DONE históricos sin motivo también usan este texto como fallback visual.


## Filas que aparecen por horario

El motor no depende del último **Search** visible del usuario. Si una consulta normal a `verResultados2.php` usa un snapshot reciente pero todavía no contiene la fila del sorteo, descarta ese snapshot y hace una segunda consulta fresca inmediatamente. Solo si la fila sigue ausente después de esa segunda lectura se considera no encontrada. Esto cubre, por ejemplo, una Rapid de las 7 PM cuando la tabla visible se consultó por última vez a las 5:30 PM.


## Actualización automática desde GitHub

Desde v3.0.8 el encabezado del userscript define `@updateURL` y `@downloadURL` apuntando al archivo canónico de `main` en GitHub. Una vez instalada manualmente esta versión, Tampermonkey puede detectar versiones posteriores comparando `@version` y descargar el mismo archivo desde GitHub. No edites la copia local de Tampermonkey; las modificaciones deben hacerse en GitHub y cada release debe incrementar `@version`.


## Inyección inmediata de botones

Desde v3.0.9 el userscript arranca en `document-start` y observa los nodos que Rover agrega a la tabla. Cada nueva fila `tr.res_tr` se procesa directamente en el callback de `MutationObserver`, sin el debounce anterior de 450 ms ni un barrido tardío de toda la tabla. Esto permite que los botones aparezcan en el mismo ciclo visual de la fila, manteniendo la lógica de Rover sin interceptar ni sobrescribir sus funciones AJAX.


## v3.0.10 — reversión preventiva del ciclo de vida UI

Se revirtió únicamente la experimentación de v3.0.9 con `document-start` y observación global incremental porque podía interferir con la carga normal de la tabla de Rover. Se restaura el ciclo estable de v3.0.8: `document-idle` y reinyección controlada tras las mutaciones. Las mejoras del motor AUTO, verificación, refresh fresco de `verResultados2.php` y actualización automática desde GitHub permanecen intactas.

La consola ahora identifica explícitamente la versión cargada con `[Virtual Lotteries] v3.0.10 cargado · UI estable`.


## v3.0.11 — inyección inmediata sin feedback loop

Se mantiene `document-idle` para no interferir con la construcción inicial de Rover. El retraso fijo de 450 ms fue eliminado. Un observer dedicado vigila únicamente `#resultadosLoteria` y reacciona solo cuando el nodo agregado es una `tr.res_tr` o contiene filas nuevas. No usa `closest('tr.res_tr')`, por lo que cambios internos del botón (SVG, texto, estados) no vuelven a promover la fila ni generan ciclos. El observer de UI no llama a `autoTick()`; el motor AUTO sigue siendo independiente.

Un segundo observer liviano solo sirve para reenganchar el observer dedicado si Rover reemplaza el contenedor o el campo de fecha. La prueba de regresión simula 100 mutaciones internas consecutivas del botón y exige cero reinyecciones.


## v3.0.12 — observer validado y ciclo de carga robusto

Se conserva la inyección inmediata de v3.0.11, pero el ciclo se endurece para cualquier orden de carga del DOM. `iniciar()` instala primero el listener de fecha y el selector AUTO, y luego procesa filas si ya existen. Tanto la llegada de filas como el reemplazo del shell pasan por el mismo inicializador idempotente. El observer de resultados sigue limitado a `#resultadosLoteria`, no usa `closest('tr.res_tr')`, no contiene timers y no llama a `autoTick()`.

Antes de publicar se validaron: sintaxis completa, aislamiento del motor AUTO, 100 mutaciones internas consecutivas sin reinyección, indicador de carga ignorado, fila nueva detectada, reemplazo por Search con un único botón y el caso de carrera donde las filas existen antes que `#fecha`.


## v3.1.0 — configuración AUTO por lotería

El selector AUTO de tres modos se reemplaza por un botón de engrane situado en la misma línea del campo DATE. El modal permite activar o desactivar la automatización global, elegir individualmente qué sorteos participan, seleccionar un intervalo fijo de 10 s, 15 s, 30 s, 1 min o 2 min y limitar las búsquedas a 3, 5, 10, 15 o dejarlas sin límite.

La primera ejecución migra la configuración anterior: RAPID activa únicamente los seis sorteos Rapid, TODOS activa los 25 sorteos y OBSERVAR deja la automatización global desactivada. EXTRA continúa manual. La configuración se guarda localmente en cada navegador/PC.

Las loterías desactivadas no consultan automáticamente su fuente ni emiten resultados. Si ya existía un POST en PROCESSING, VERIFYING o PROCESS_UNCERTAIN, su verificación de seguridad continúa aunque AUTO se desactive, para no dejar un envío ambiguo sin confirmar.

Para evitar carreras entre equipos, una misma lotería debe configurarse como emisora automática en una sola PC a la vez.
