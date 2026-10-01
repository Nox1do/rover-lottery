# Virtual Lotteries v3.2.6 — guía breve

El userscript reconoce 25 sorteos de NationJL, Rapid, PremierLotto, QPlay Brazil y The Queen Lottery. Québec EXTRA conserva su botón manual y su pestaña de Lottery Post.

## Activación

1. Abre `lottery.php`. El botón de engrane **⚙️** aparece inmediatamente a la derecha del campo DATE.
2. Pulsa el engrane para abrir **Configuración AUTO**. Activa o desactiva la automatización global y marca únicamente las loterías que esta PC debe procesar.
3. Las loterías se agrupan en cinco acordeones: **Pick and Win**, **Rapid**, **Premier**, **Brazil** y **Queen**. Cada acordeón tiene su propio check **Todas** y también se puede seleccionar cada sorteo individualmente.
4. El intervalo automático se elige entre **1 minuto, 3 minutos, 5 minutos o 10 minutos**. También se puede limitar la cantidad máxima de búsquedas por sorteo o dejarla sin límite.
5. **EXTRA continúa manual.** Evita habilitar la misma lotería como emisora automática en más de una PC al mismo tiempo.

Al pulsar **Search** en Rover, si la tabla se reconstruye, los resultados que el userscript ya había encontrado se restauran automáticamente siempre que la fila siga vacía o coincida; nunca se sobrescriben valores distintos devueltos por Rover.

La automatización usa la fecha actual de República Dominicana. Cambiar la fecha visible de Rover afecta a los botones manuales, no a los sorteos automáticos. El motor necesita que `lottery.php` esté abierto; la pestaña puede estar en segundo plano. Si el navegador no dispone de Web Locks, el script no realiza un POST automático.

## Estados y revisión

| Estado | Acción |
|---|---|
| `WAITING_RESULT` | La fuente aún no muestra cinco valores válidos. El script vuelve a consultar. |
| `RESULT_READY` | Resultado válido ya encontrado. Es trabajo prioritario: el líder debe intentar procesarlo sin esperar el siguiente intervalo de búsqueda. |
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

Los intervalos automáticos disponibles en esa versión pasaron a ser **1 minuto, 5 minutos y 10 minutos**. Una configuración anterior guardada con 10, 15, 30 segundos o 2 minutos se normaliza automáticamente a **1 minuto** sin perder qué loterías estaban seleccionadas.


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
\n\n## v3.1.8D — diagnóstico temporal\n\nSe creó una release temporal con el evento de diagnóstico para forzar únicamente el horario de evaluación de un código AUTO, manteniendo las validaciones reales del motor. Esa versión queda preservada en el historial de GitHub para pruebas puntuales.\n\n## v3.1.8F — restauración final\n\nSe restauró el código productivo limpio de v3.1.8 y se eliminó por completo el diagnóstico temporal. Permanecen AUTO independiente de la vista AJAX e identidad única de Rover antes del POST.\n

## v3.1.9 — intervalo de 3 minutos

El selector **Buscar resultado cada** incorpora **3 minutos**. Los intervalos disponibles son ahora **1, 3, 5 y 10 minutos**. Las configuraciones existentes de 1, 5 o 10 minutos se conservan sin cambios, y las configuraciones antiguas no válidas continúan normalizándose a 1 minuto.


## v3.1.10 — desactivación inmediata por lotería

Al desmarcar una lotería y guardar la configuración, cualquier ciclo AUTO no crítico que hubiera empezado antes deja de poder pintar, resaltar o restaurar resultados en esa fila. El motor vuelve a comprobar la configuración después de las esperas de red y `autoReflejar` también exige que la lotería siga habilitada.

El caché visual distingue ahora entre resultados manuales y resultados AUTO. Un resultado manual puede seguir restaurándose después de un Search, pero un resultado originado por AUTO no se restaura si esa lotería está desmarcada. Las verificaciones de seguridad de un POST que ya hubiera sido enviado continúan en background, pero con AUTO deshabilitado no repintan la UI.


## v3.2.0 — líder automático entre tabs

Cuando hay varias pestañas con `lottery.php` abiertas en el mismo navegador/perfil, el userscript coordina sus instancias y solo una queda como **tab líder**. Únicamente ese tab ejecuta el scheduler AUTO; los demás quedan como **tab observador** y no consultan fuentes ni procesan resultados automáticamente.

La elección es determinística: gana la instancia activa más antigua. Cada tab mantiene heartbeat. Si el líder se cierra, queda suspendido demasiado tiempo o deja de estar activo, otro tab toma el liderazgo. Un tab que reaparece después de quedar stale reingresa con una antigüedad nueva para no quitarle inmediatamente el liderazgo al reemplazo.

El handoff conserva la hora compartida del último tick para que cambiar de líder no reinicie artificialmente el intervalo de **1/3/5/10 minutos**. Si existe un estado `PROCESSING`, `VERIFYING` o `PROCESS_UNCERTAIN`, el nuevo líder prioriza la verificación de seguridad.

La coordinación utiliza `GM_getTab`, `GM_saveTab`, `GM_getTabs` y señales por `GM_addValueChangeListener`. El Web Lock `vl-auto-rover-post` continúa como segunda barrera justo antes del POST. La coordinación es por navegador/perfil; PCs, navegadores o perfiles distintos no comparten este liderazgo.

Después de actualizar desde una versión anterior a 3.2.0, conviene recargar una vez todas las pestañas `lottery.php` que ya estaban abiertas para que todas participen en la elección.


## v3.2.1 — handoff inmediato de RESULT_READY

`RESULT_READY` deja de depender de la siguiente cadencia de búsqueda. Cuando una fuente ya entregó los cinco valores válidos, el estado se guarda y se publica una señal `result-ready` compartida entre tabs. Si el tab que encontró el resultado deja de ser líder antes del POST, el nuevo líder procesa ese trabajo inmediatamente; el intervalo de **1/3/5/10 minutos** sigue aplicando a búsquedas de resultados todavía pendientes, no a resultados ya encontrados.

La elección de líder ahora prefiere un tab visible frente a uno oculto cuando todas las instancias abiertas ya reportan metadata de visibilidad. Durante una actualización mixta con algún tab 3.2.0 todavía abierto, se conserva temporalmente la regla antigua por antigüedad para evitar criterios distintos y reducir el riesgo de dos líderes.

El heartbeat también distingue foreground/background. Un tab visible se considera stale tras aproximadamente **15 segundos** sin heartbeat; un tab oculto dispone de una ventana de **120 segundos** para tolerar el throttling normal del navegador. Cerrar el líder sigue produciendo failover por desaparición del tab/señal de salida sin tener que esperar esos 120 segundos.

Esta versión conserva el Web Lock `vl-auto-rover-post` y la segunda lectura fresca de Rover antes del POST. El objetivo del cambio es reducir latencia de handoff sin debilitar las barreras contra procesamiento duplicado.


## v3.2.2 — líder sticky por foco real

La elección multi-tab distingue tres prioridades: **enfocado > visible > oculto**. El foco se obtiene con `document.hasFocus()` y se publica junto con `visible` y `lastFocusAt`. Cuando dos tabs tienen la misma prioridad, el último tab realmente enfocado conserva el liderazgo; si ninguno tuvo foco, se usa antigüedad + ID. Esto evita que un `blur` temporal provocado por DevTools cambie el líder sin que otro tab haya recibido foco real.

Durante una actualización mixta con 3.2.0/3.2.1 todavía abiertos, la versión 3.2.2 detecta que falta metadata de foco y conserva exactamente la política compatible de 3.2.1. La prioridad por foco solo se activa cuando todos los candidatos reportan `focused` y `lastFocusAt`.

Los eventos `focus`, `blur` y `visibilitychange` guardan primero la metadata del tab y luego publican la señal a las demás instancias. El tooltip del engrane muestra `tab líder · enfocado` cuando corresponde; un observador muestra además el sufijo del ID del líder.

### RESULT_READY separado del scheduler

Los resultados ya encontrados se manejan con una cola prioritaria `autoProcesarTrabajoPrioritario()`. Una señal `result-ready` hace que el líder procese esa cola sin llamar a `autoReiniciarScheduler`, por lo que no modifica `vl:auto:tabs:last-tick:v1` ni reinicia el intervalo de búsqueda de 1/3/5/10 minutos.

Si el tab pierde liderazgo mientras espera el Web Lock o justo antes del POST, vuelve a persistir `RESULT_READY`, publica una nueva señal de handoff y hace **0 POST**. El nuevo líder puede continuar inmediatamente. Las verificaciones `PROCESSING`, `VERIFYING` y `PROCESS_UNCERTAIN` siguen teniendo prioridad de seguridad.

La regresión multi-tab prueba 100 cambios alternos de foco, sticky blur, compatibilidad con 3.2.1/3.2.0, cola RESULT_READY sin mover el reloj de búsqueda y pérdida de liderazgo dentro del Web Lock con cero POST.


## v3.2.3 — engrane limitado a Ver Resultados

El campo `#fecha` no identifica por sí solo la vista de loterías: Rover reutiliza ese ID en Races, reportes y otras vistas AJAX. La UI de Configuración AUTO ya no se inyecta simplemente por encontrar una fecha.

El userscript observa la navegación interna `load('__inc/...')` y considera válida únicamente `__inc/resultadosLoteria2.php`. Al salir de **Ver Resultados**, el engrane se retira inmediatamente. Si Rover carga la vista de resultados por código y no mediante un clic del menú, existe un fallback por la estructura real de `#tableResult input[name="primera"][loteria]`.

Esta limitación afecta únicamente a la UI manual: el motor AUTO y la coordinación multi-tab continúan funcionando en background mientras `lottery.php` permanezca abierta, incluso si el usuario está viendo Races u otra sección.


## v3.2.4 — liderazgo autoritativo con Web Locks

La elección por `focused > visible > hidden` ya no convierte por sí sola a un tab en líder. Esa lógica únicamente selecciona al **candidato**. El liderazgo real existe solo mientras el navegador concede el Web Lock exclusivo `vl-auto-leader-v4`.

`autoTabEsLider` deja de asignarse desde el resultado de `GM_getTabs()`. El tab ganador solicita el lock con `{ mode: 'exclusive', ifAvailable: true }`; si el lock está ocupado, continúa como observador. El propietario publica un estado diagnóstico compartido con `ownerId`, `epoch`, `hostname`, `heartbeatAt` y versión. Cada comprobación sensible de liderazgo exige tanto poseer el Web Lock como conservar el mismo `ownerId + epoch`.

El handoff es cooperativo. No se usa `steal: true`. Cuando otro tab pasa a tener mayor prioridad, el propietario actual detiene el scheduler, invalida su claim compartido y libera el lock. Solo después otro tab puede adquirirlo. El Web Lock `vl-auto-rover-post` se mantiene como segunda barrera de exclusión justo alrededor del procesamiento.

### Host emisor único

Para evitar un pseudo-lock entre orígenes distintos, el único host autorizado para liderazgo AUTO es:

`www.roversport.net`

`www.roversport.lol` continúa ejecutando el userscript para UI, estado y señales, pero permanece como **observador** y nunca adquiere `vl-auto-leader-v4` ni ejecuta el scheduler AUTO.

Durante una actualización mixta, v3.2.4 exige que todos los tabs activos de Rover reporten `leaderProtocol: 4`. Si queda abierto un tab 3.2.3 o anterior, el nuevo coordinador pausa AUTO y muestra que es necesario actualizar/recargar los otros tabs. Esto evita introducir un líder v4 mientras todavía existe una instancia antigua que no entiende el Web Lock autoritativo.

Si Web Locks o las APIs de tabs de Tampermonkey no están disponibles, AUTO queda pausado por seguridad; ya no existe fallback que convierta unilateralmente al tab en líder.

El tooltip del engrane diferencia explícitamente:
- `LÍDER CONFIRMADO`: posee `vl-auto-leader-v4` y muestra ID + epoch.
- `OBSERVADOR`: no posee autoridad de liderazgo.
- `AUTO pausado`: falta Web Locks, faltan APIs multi-tab o existe un tab antiguo pendiente de recarga.

`RESULT_READY` sigue fuera de la cadencia de búsqueda: el líder confirmado procesa inmediatamente la cola prioritaria sin mover `vl:auto:tabs:last-tick:v1`.


## v3.2.5 — Host AUTO dinámico

El host emisor deja de estar fijado permanentemente a `www.roversport.net`. La Configuración AUTO incorpora **Host AUTO** con tres opciones:

- **Automático**: si todos los tabs Rover activos pertenecen a un único dominio, ese dominio se convierte en host emisor.
- **roversport.net**: solo los tabs `.net` pueden competir por el Web Lock de liderazgo.
- **roversport.lol**: solo los tabs `.lol` pueden competir por el Web Lock de liderazgo.

En modo **Automático**, si hay simultáneamente tabs activos de `.net` y `.lol`, AUTO se pausa y el engrane indica que hay que elegir un Host AUTO. Esto evita intentar coordinar dos Web Locks que pertenecen a orígenes distintos.

Ejemplos:

```text
2 tabs .lol + Automático
→ Host AUTO = .lol
→ un solo tab .lol obtiene vl-auto-leader-v5
→ el otro queda OBSERVADOR

2 tabs .net + Automático
→ Host AUTO = .net
→ un solo tab .net obtiene vl-auto-leader-v5

.net + .lol + Automático
→ AUTO pausado
→ seleccionar .net o .lol en Host AUTO

.net + .lol + Host AUTO=.lol
→ todos los .net quedan OBSERVADORES
→ los .lol compiten por el Web Lock
→ solo uno queda LÍDER CONFIRMADO
```

El protocolo de liderazgo sube a **5** y utiliza `vl-auto-leader-v5` junto con `vl:auto:tabs:leader:v5`. Un tab 3.2.4 o anterior se considera incompatible durante la migración; v3.2.5 pausa su coordinador hasta que los tabs viejos se recarguen o queden stale.

### Handoff entre .net y .lol

Cambiar explícitamente el Host AUTO no permite que el nuevo dominio empiece a emitir mientras siga vigente el claim compartido del dominio anterior. El nuevo host espera a que el líder anterior libere su lock y elimine su claim; si ese tab dejó de responder, el claim expira tras la ventana de seguridad.

Esto evita el intervalo en el que un Web Lock de `.net` y otro Web Lock de `.lol` podrían existir simultáneamente como líderes lógicos.

La selección de Host AUTO forma parte de `vl:auto:settings:v1` y se comparte entre las instancias del mismo userscript. Las configuraciones guardadas antes de 3.2.5 migran automáticamente a **Automático**.


## v3.2.6 — líder Web Lock estable

El foco deja de provocar handoff de liderazgo. La regla `focused > visible > hidden` se conserva únicamente para elegir el **candidato inicial** cuando no existe un líder confirmado en el Host AUTO seleccionado.

Una vez que un tab obtiene el Web Lock exclusivo `vl-auto-leader-v6`, conserva el liderazgo aunque el usuario cambie de pestaña. El líder solo cede por causas estructurales: cierre/pagehide, cambio de Host AUTO, incompatibilidad de protocolo, pérdida del contexto o liberación explícita del lock.

```text
Tab A enfocado
Tab B visible
→ A obtiene vl-auto-leader-v6
→ A = LÍDER CONFIRMADO

cambiar foco a B
→ A conserva vl-auto-leader-v6
→ A sigue LÍDER CONFIRMADO
→ B sigue OBSERVADOR

cerrar A
→ A libera el Web Lock
→ B puede adquirirlo
→ B pasa a LÍDER CONFIRMADO
```

El coordinador primero comprueba si ya existe un claim válido de líder para el host seleccionado. Mientras ese claim siga vigente, los observadores no vuelven a competir por foco. Si el claim desaparece o expira, se vuelve a ejecutar la elección inicial y solo el candidato ganador intenta adquirir el Web Lock con `ifAvailable`.

El protocolo de liderazgo sube a **6** y usa `vl:auto:tabs:leader:v6`. Durante la actualización, cualquier tab 3.2.5 todavía activo mantiene al coordinador v3.2.6 pausado hasta que sea recargado o quede stale. Esto evita mezclar la política antigua de handoff por foco con la política sticky nueva.

La cola `RESULT_READY` continúa siendo prioritaria. Si el líder está vivo y recibe la señal, procesa el resultado inmediatamente sin esperar el siguiente intervalo de búsqueda. No se usa `steal: true` para arrebatar un Web Lock a un tab que todavía lo posee.
