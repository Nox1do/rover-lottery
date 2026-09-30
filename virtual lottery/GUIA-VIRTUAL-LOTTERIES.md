# Virtual Lotteries v3.1.8D — guía breve

El userscript reconoce 25 sorteos de NationJL, Rapid, PremierLotto, QPlay Brazil y The Queen Lottery. Québec EXTRA conserva su botón manual y su pestaña de Lottery Post.

## Activación

1. Abre `lottery.php`. El botón de engrane **⚙️** aparece inmediatamente a la derecha del campo DATE.
2. Pulsa el engrane para abrir **Configuración AUTO**. Activa o desactiva la automatización global y marca únicamente las loterías que esta PC debe procesar.
3. Las loterías se agrupan en cinco acordeones: **Pick and Win**, **Rapid**, **Premier**, **Brazil** y **Queen**. Cada acordeón tiene su propio check **Todas** y también se puede seleccionar cada sorteo individualmente.
4. El intervalo automático se elige entre **1 minuto, 5 minutos o 10 minutos**. También se puede limitar la cantidad máxima de búsquedas por sorteo o dejarla sin límite.
5. **EXTRA continúa manual.** Evita habilitar la misma lotería como emisora automática en más de una PC al mismo tiempo.

Al pulsar **Search** en Rover, si la tabla se reconstruye, los resultados que el userscript ya había encontrado se restauran automáticamente siempre que la fila siga vacía o coincida; nunca se sobrescriben valores distintos devueltos por Rover.

La automatización usa la fecha actual de República Dominicana. Cambiar la fecha visible de Rover afecta a los botones manuales, no a los sorteos automáticos. El motor necesita que `lottery.php` esté abierto; la pestaña puede estar en segundo plano. Si el navegador no dispone de Web Locks, el script no realiza un POST automático.

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

El selector AUTO de tres modos se reemplaza por un botón de engrane situado en la misma línea del campo DATE. El modal permite activar o desactivar la automatización global y elegir individualmente qué sorteos participan.

La primera ejecución migra la configuración anterior: RAPID activa únicamente los seis sorteos Rapid, TODOS activa los 25 sorteos y OBSERVAR deja la automatización global desactivada. EXTRA continúa manual. La configuración se guarda localmente en cada navegador/PC.

Las loterías desactivadas no consultan automáticamente su fuente ni emiten resultados. Si ya existía un POST en PROCESSING, VERIFYING o PROCESS_UNCERTAIN, su verificación de seguridad continúa aunque AUTO se desactive, para no dejar un envío ambiguo sin confirmar.

Para evitar carreras entre equipos, una misma lotería debe configurarse como emisora automática en una sola PC a la vez.


## v3.1.1 — acordeones e intervalos

El modal AUTO muestra cinco grupos explícitos y siempre visibles como encabezados: **Pick and Win**, **Rapid**, **Premier**, **Brazil** y **Queen**. Los grupos se comportan como acordeón: al abrir uno se cierran los demás. Cada grupo incluye un check **Todas** con estado marcado, parcial o vacío según sus sorteos.

Los intervalos automáticos disponibles pasan a ser únicamente **1 minuto, 5 minutos y 10 minutos**. Una configuración anterior guardada con 10, 15, 30 segundos o 2 minutos se normaliza automáticamente a **1 minuto** sin perder qué loterías estaban seleccionadas.


## v3.1.2 — acordeones compactos

Los grupos del modal dejan de usar elementos `section` y pasan a contenedores `div` neutrales para evitar que estilos globales de Rover impongan alturas mínimas. Cada grupo fuerza `height:auto`, `min-height:0` y `padding:0`; el panel colapsado fuerza `display:none` y altura cero. Un acordeón cerrado ocupa únicamente la altura de su encabezado y el margen de 8 px con el siguiente grupo.


## v3.1.3 — engrane sin fondo

El acceso a Configuración AUTO queda como un icono SVG de engrane sin caja, borde ni fondo. Cuando AUTO está activo, solo cambia el color del engrane a verde; el fondo permanece transparente. El hover también mantiene fondo transparente.


## v3.1.4 — color Search

El engrane AUTO usa el mismo azul dominante del botón Search de Rover (`#03A9F3`) con icono blanco y forma circular. El hover utiliza `#0398DB`. El estado AUTO activo ya no usa verde: el botón conserva el mismo lenguaje visual que Search.


## v3.1.5 — proporción del engrane

El botón AUTO mantiene el azul Search, pero el círculo se reduce de 32 px a 30 px y el engrane SVG aumenta de 19 px a 21 px. Esto reduce el espacio azul alrededor del icono y hace que el engrane tenga mayor presencia visual.


## v3.1.6 — Bootstrap gear-fill

El control de Configuración AUTO usa el SVG oficial **Bootstrap Icons `gear-fill`**, renderizado con `currentColor`. El botón mantiene el azul Search `#03A9F3`, el engrane blanco de 21 px y cambia de círculo a un botón cuadrado de 30 × 30 px con radio de 3 px.


## v3.1.7 — engrane gris sin fondo

El acceso a **Configuración AUTO** conserva el SVG Bootstrap Icons `gear-fill` de 21 px y el área de clic de 30 × 30 px, pero elimina el fondo azul. El botón queda sin fondo visible y sin borde; el engrane usa gris `#6B7280` y pasa a gris más oscuro `#4B5563` al hacer hover. El estado AUTO activo conserva el mismo aspecto gris y transparente.


## v3.1.8 — AUTO independiente de la vista AJAX

El motor AUTO ya no depende de que `#fecha`, la tabla de resultados o los inputs de lotería estén presentes en el DOM. Mientras `lottery.php` permanezca abierta, el scheduler continúa trabajando aunque Rover muestre otra vista interna mediante AJAX. El modo manual sí conserva su dependencia de la tabla visible y de la fecha seleccionada.

La identidad del sorteo se valida exclusivamente con el código lógico configurado y la respuesta de `verResultados2.php`. Antes de cualquier POST, Rover debe devolver exactamente una fila cuyo atributo `loteria`, normalizado con `trim()`, coincida con el código esperado. El POST conserva el código raw devuelto por Rover. Si aparecen dos o más filas para el mismo código lógico, el estado pasa a error y no se llama a `procesarResultados.php`.

La suite incluye una regresión que ejecuta `autoTick()` sin `#fecha`, sin tabla y sin inputs visibles, habilita únicamente `BRAZIL12PM` y exige que el único POST use exactamente ese código. También verifica que una identidad Rover duplicada produzca cero POST.


## v3.1.8D — diagnóstico temporal

Release temporal para probar el motor AUTO fuera de la vista de resultados. Agrega un listener de diagnóstico que solo fuerza el horario de evaluación del código solicitado; no llama directamente a `procesarResultados.php` ni desactiva ninguna barrera del motor.

Desde la consola de `lottery.php` se puede forzar Rapid 9 PM con:

```js
window.dispatchEvent(new CustomEvent('vl-debug-force', { detail: 'RPL-9PM' }));
```

La lotería debe estar habilitada en Configuración AUTO. La fuente, fecha RD, identidad única de Rover, conflictos, duplicados, Web Lock, preflight y verificación posterior siguen siendo obligatorios.
