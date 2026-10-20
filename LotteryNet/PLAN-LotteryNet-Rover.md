# PLAN MAESTRO — Lottery.net → Rover

> **Documento rector del proyecto** · Versión del plan: **1.0.0** · Fecha: **2026-10-19**  
> **Estado:** esqueleto inicial preparado; extractores, UI y automatización pendientes de implementación y validación.  
> **Fuente de datos exclusiva:** https://www.lottery.net/  
> **Plataforma:** Tampermonkey sobre Rover (`/adm/es/lottery.php`).

## 0. Norma de cumplimiento permanente

Este documento es la **fuente de verdad** para diseñar, implementar, probar y modificar **este proyecto**. Al iniciar cualquier sesión de desarrollo:

1. Leer este `PLAN-LotteryNet-Rover.md` completo y comprobar que la tarea respeta sus invariantes.
2. Consultar la documentación actual de cualquier tecnología, API o biblioteca que vaya a utilizarse; no implementar basándose únicamente en suposiciones o en código de otro proyecto.
3. Revisar los archivos existentes, identificar los módulos afectados y formular un cambio limitado y verificable.
4. Antes de escribir código, resolver cualquier ambigüedad que pueda cambiar el comportamiento, el alcance o la seguridad del llenado. No convertir en requisito una decisión que el usuario no haya aprobado.
5. Implementar código limpio, modular, mantenible y testeable. No copiar sistemas completos cuando solo sea necesaria una función o idea.
6. Ejecutar pruebas unitarias, de integración y de navegador según corresponda. Corregir defectos y repetir las pruebas antes de entregar.
7. Verificar **especialmente** que no se procesa, guarda o envía ningún resultado a Rover por acción del nuevo script.
8. Documentar en el historial de cambios cualquier corrección y su evidencia de pruebas. No declarar que algo se verificó en navegador si solo se probó con HTML simulado.
9. **No alterar estas reglas unilateralmente.** Los cambios sustanciales requieren aprobación explícita del usuario y actualización de este documento antes del código.

### Clasificación de requisitos

- **OBLIGATORIO:** comportamiento aprobado, no negociable sin nueva autorización.
- **DISEÑO PROPUESTO:** decisión técnica recomendada, sujeta a comprobación.
- **POR VALIDAR:** hipótesis, compatibilidad o detalle todavía no verificado; nunca presentarlo como realizado.

---

## 1. Objetivo funcional — OBLIGATORIO

Construir **un proyecto Tampermonkey independiente** que consulte resultados públicos de **Lottery.net**, identifique la fecha, el estado, el sorteo y el juego correctos, y **rellene exclusivamente los inputs visibles de la tabla de loterías de Rover**.

Debe ofrecer **dos vías de ejecución** que comparten el mismo motor de consulta, validación y llenado:

- **Automática:** seguimiento mientras exista una pestaña válida de Rover abierta y el modo automático esté habilitado. Detectar resultados nuevos y llenar sus casillas sin clics del usuario.
- **Manual:** un botón **«Consultar y llenar»** que fuerce una consulta del sorteo correspondiente y rellene solamente los campos válidos. Esta acción también está sometida a todas las reglas de validación y de no procesamiento.

**FUERA DE ALCANCE:** procesamiento, guardado, confirmación, publicación o envío de resultados a la base de datos de Rover.

### Invariantes absolutos de NO PROCESAMIENTO

1. **NUNCA** enviar una solicitud a `__inc/procesarResultados.php` ni a otro endpoint de Rover que procese, guarde, confirme o publique resultados.
2. **NUNCA** ejecutar una función de procesamiento heredada del userscript `Virtual Lotteries v2 Auto`, ni activar los botones «Process», «Save», «Save All» o sus equivalentes.
3. **NUNCA** crear estados `PROCESSING`, `PROCESSED`, `VERIFYING` o `DONE` para aparentar confirmación en el servidor. Los estados locales expresarán **solo extracción/llenado visual**.
4. Las únicas mutaciones de resultados autorizadas son cambios en los elementos `input` de las filas correctas de la **página abierta**, con eventos de interfaz necesarios para que Rover refleje dichos valores. **No debe haber escrituras por HTTP a Rover**.
5. Un llenado visual exitoso **NO significa** resultado procesado ni persistido en Rover. Mostrar y registrar esta diferencia de forma inequívoca.
6. Antes de publicar una versión, comprobar en las herramientas de red del navegador y en pruebas automatizadas que el script no hace POST/PUT/PATCH/DELETE hacia Rover y que los eventos de llenado no desencadenan indirectamente un procesamiento por los manejadores de la página o por otro script, en las configuraciones de prueba.
7. Si no se puede garantizar el no procesamiento por coexistencia con otros scripts instalados, documentar el conflicto y no declarar la integración segura hasta resolverlo.

---

## 2. Independencia de LotteryUSA y Virtual Lotteries — OBLIGATORIO

- LotteryUSA se utilizó **solo como ejemplo e inventario** de sorteos/casillas, y como referencia de mapeo con Rover.
- `Virtual Lotteries v2 Auto v3.2.7` se utilizó **solo como referencia** de seguimiento automático, llenado, restauración de campos y coordinación entre pestañas.
- El nuevo proyecto **no importa**, no llama y no depende de funciones, claves de almacenamiento, variables globales, configuración, mensajes, bloqueos, scripts instalados ni proveedores de LotteryUSA o Virtual Lotteries.
- Usar **namespace**, `@name`, prefijos de CSS, claves `GM_*`, nombres de locks, versión y URLs de actualización **propios**.
- Lottery.net será la **única fuente externa** de resultados de este proyecto; no añadir proveedores móviles, LotteryUSA u otros sin aprobación.
- No modificar ni deshabilitar los scripts existentes como parte de este proyecto sin autorización. Si pueden escribir en las mismas filas, **nunca sobrescribir valores distintos**; mostrar conflicto y probar explícitamente la convivencia.

---

## 3. Alcance exacto de estados, turnos y juegos — OBLIGATORIO

Se toman los turnos y juegos del archivo de referencia **Rovs Loterías USA v0.6.5** (subido por el usuario). 

| ID lógico | Estado | Turno | Etiqueta Rover de referencia | Juegos |
|---|---|---|---|---|
| `fl-am` | Florida | Midday | `FLORIDA AM` | Pick 3 y Pick 4 |
| `fl-pm` | Florida | Evening | `FLORIDA PM` | Pick 3 y Pick 4 |
| `la-pm` | Louisiana | Evening | `LOUISIANA EVENING` | Pick 3 y Pick 4 |
| `oh-am` | Ohio | Midday | `OHIO MIDDAY` | Pick 3 y Pick 4 |
| `oh-pm` | Ohio | Evening | `OHIO EVENING` | Pick 3 y Pick 4 |
| `tn-morning` | Tennessee | Morning | `TENNESSEE MORNING` | Cash 3 y Cash 4 |
| `tn-midday` | Tennessee | Midday | `TENNESSEE MIDDAY` | Cash 3 y Cash 4 |
| `tn-pm` | Tennessee | Evening | `TENNESSEE EVENING` | Cash 3 y Cash 4 |
| `in-am` | Indiana | Midday | `INDIANA MIDDAY` | Daily 3 y Daily 4 |
| `in-pm` | Indiana | Evening | `INDIANA EVENING` | Daily 3 y Daily 4 |

**Total:** 5 estados, 10 sorteos y hasta 20 resultados de juego por día, sujeto a que los sorteos se hayan celebrado y los datos estén publicados.

**No agregar** Texas, Illinois, Georgia ni otros estados por aparecer en los scripts de referencia.

### Identidad y fecha del sorteo

- Validar **estado + juego (3/4) + fecha local del sorteo + turno** antes de cualquier llenado.
- Utilizar la zona horaria **del estado/sorteo** al interpretar calendarios y horarios; **no asumir** que la zona de República Dominicana o la del navegador equivale a la del sorteo.
- Separar explícitamente `Morning`, `Midday` y `Evening`. No inferir el turno solo por la posición del resultado en la página.
- Tomar la fecha actualmente seleccionada en Rover; **no** rellenar resultados de hoy si Rover muestra ayer u otra fecha.
- Después de cambios de fecha, navegación o Search, invalidar consultas obsoletas y volver a comprobar la identidad de la fila antes de escribir.

---

## 4. Contrato de extracción y mapeo — OBLIGATORIO

### Extracción de Lottery.net

- Usar páginas de resultados de **Lottery.net** como fuente y analizarlas mediante `DOMParser` o equivalente.
- Priorizar selectores semánticos comprobados en sus páginas, no expresiones regulares indiscriminadas sobre todo el HTML.
- La inspección exploratoria encontró estructuras como `.resultBox`, `.resultDate`, `.drawTime`, `.balls` y clases `number-part-*`; **POR VALIDAR** la estructura vigente de **las diez páginas correspondientes a juegos 3 y 4** antes de codificar el parser definitivo.
- Florida muestra un **Fireball**, Tennessee un **Wild Ball** e Indiana un **Super Ball** adicionales en determinados juegos: **no incluirlos** en el Pick/Cash/Daily 3 o 4 primario.
- Extraer únicamente cifras decimales individuales válidas y preservar ceros a la izquierda.
- Si una fuente entrega más de un resultado contradictorio para el mismo `estado + juego + fecha + turno`, **no elegir arbitrariamente**: marcar conflicto y no llenar.
- HTML incompleto, error HTTP, bloqueo de acceso o estructura desconocida deben terminar en estado de error/pendiente, **jamás en números inventados**.
- Normalizar salida a un contrato estable, por ejemplo: `estado`, `fechaSorteo`, `turno`, `juego`, `numeros`, `fuente`, `consultadoEn` y `estadoExtraccion`.

### Mapeo a las cinco casillas de Rover

Confirmado por la función `fillTable()` del archivo de referencia `Rovs Loterías USA v0.6.5`:

| Posición lógica de Rover | Nombre de uso | Valor derivado |
|---|---|---|
| Input 0 | Primera / 1RA | Últimos 2 dígitos del juego 3 |
| Input 1 | Segunda / 2DA | Primeros 2 dígitos del juego 4 |
| Input 2 | Tercera / 3RA | Últimos 2 dígitos del juego 4 |
| Input 3 | Pick/Cash/Daily 3 | Número de 3 dígitos completo |
| Input 4 | Pick/Cash/Daily 4 | Número de 4 dígitos completo |

Ejemplo **ilustrativo, NO un resultado real**: juego 3 `407`, juego 4 `0832` → `07`, `08`, `32`, `407`, `0832`.

**POR VALIDAR en Rover real:** preferir identificación de inputs por atributos estables y nombres de campo, y usar índices solamente si la estructura de cada fila es inequívoca. No seleccionar filas por coincidencias de texto ambiguas: si no se puede identificar **exactamente una fila**, no llenar.

### Resultados parciales

- Si está disponible únicamente el juego 3, solo son elegibles las casillas derivadas de ese juego (0 y 3).
- Si está disponible únicamente el juego 4, solo son elegibles las casillas derivadas de ese juego (1, 2 y 4).
- Señalar explícitamente **parcial** y continuar buscando el juego faltante, sin borrar los demás inputs.
- No escribir cifras incompletas ni concatenar falsos ceros para «completar» resultados.

---

## 5. Escritura visual segura — OBLIGATORIO

1. Localizar una única fila de Rover correspondiente al sorteo y fecha seleccionados.
2. Validar que la fila es la correcta y que existen sus cinco campos esperados.
3. Leer el contenido actual: vacío o marcador equivalente se puede completar; **idéntico** se conserva; **diferente** causa conflicto y **no se sobrescribe**.
4. Modificar **solo** los inputs elegibles para los cuales hay datos primarios verificados.
5. Emitir los eventos `input`/`change` que la interfaz requiera, **después de probar** que no causan procesamiento ni guardado automático inesperado.
6. Resaltar brevemente las casillas rellenadas para distinguirlas visualmente, sin introducir un estado «procesado».
7. Mantener un caché propio indexado por `estado + sorteo + fecha + juego`; conservar trazabilidad de fuente y momento de consulta.
8. Cuando Rover reconstruya la tabla después de Search, restaurar únicamente resultados que sigan correspondiendo a la fecha y turno visibles **y solo si las casillas siguen vacías o coinciden**.
9. No restaurar encima de una corrección manual ni de un valor introducido por otro script. Ante ambigüedad, detener el llenado y registrar el motivo.
10. Una fila que desaparece o cambia mientras una solicitud está en vuelo **no debe recibir** la respuesta anterior.

**Estados locales sugeridos:** `PENDING`, `FETCHING`, `PARTIAL`, `READY_TO_FILL`, `FILLED_UI`, `ALREADY_MATCHING`, `CONFLICT`, `NOT_FOUND`, `ERROR`. `FILLED_UI` **no representa persistencia en el servidor**.

---

## 6. Arquitectura y distribución — DISEÑO PROPUESTO

**Una sola instalación Tampermonkey, código fuente modular, distribución compilada en un único `.user.js`.** No instalar cinco userscripts que se envían mensajes entre sí.

```text
LotteryNet/
├── PLAN-LotteryNet-Rover.md        # Documento rector
├── README.md
├── CHANGELOG.md
├── src/
│   ├── core/
│   │   ├── scheduler.js           # Seguimiento automático
│   │   ├── transport.js           # GET, timeout, cancelación, caché
│   │   ├── validation.js          # Fecha/turno/juego/números
│   │   ├── state.js               # Estado local y configuración
│   │   └── tab-coordination.js    # Multitab, si procede
│   ├── providers/
│   │   └── lottery-net.js         # Única fuente externa
│   ├── parsers/
│   │   ├── shared.js              # Selectores y estructura común
│   │   └── variants.js            # Excepciones de juegos/estados
│   ├── states/
│   │   ├── florida.js
│   │   ├── louisiana.js
│   │   ├── ohio.js
│   │   ├── tennessee.js
│   │   └── indiana.js
│   ├── rover/
│   │   ├── rows.js                # Identidad exacta de fila
│   │   ├── fill-ui.js             # SOLO escritura de inputs
│   │   └── restore.js             # Restauración tras Search
│   └── ui/
│       └── controls.js            # Auto ON/OFF, consultar y llenar
├── tests/
│   ├── fixtures/                  # HTML de muestra por juego y turno
│   ├── unit/
│   ├── integration/
│   └── browser/
└── dist/
    ├── LotteryNet-Rover.user.js
    └── LotteryNet-Rover.meta.js
```

**Destino aprobado el 2026-10-19:** `Nox1do/rover-lottery/LotteryNet/` en la rama `main`. La independencia es funcional y técnica, aunque el proyecto comparta repositorio. No modificar otros directorios del repositorio como parte de este trabajo.

### Integración documentada con Tampermonkey

- `@match`: limitar la ejecución a las rutas de loterías de Rover autorizadas (`www`/sin `www`, `.net`/`.lol` si realmente están en uso).
- `@noframes`: evitar inyecciones duplicadas en iframes.
- `@run-at`: escoger el momento de inicialización conforme a la aparición real de la tabla; no asumir que `document-end` garantiza que Rover ya cargó sus filas dinámicas.
- `GM_xmlhttpRequest` o `GM.xmlHttpRequest`: consultar por **GET** a Lottery.net, con tiempo máximo, cancelación y tratamiento explícito de errores.
- `@connect`: permitir únicamente los hosts de Lottery.net efectivamente utilizados.
- `GM_getValue`/`GM_setValue`: configuración, estados locales y caché de este script.
- `GM_addValueChangeListener`: notificar cambios entre instancias del **mismo** userscript, no como bus universal entre otros scripts.
- `@updateURL` y `@downloadURL`: actualización propia, con versión y metadatos consistentes.
- `MutationObserver`: reaccionar a cambios de la tabla sin observación excesiva ni bucles de reescritura.

Referencias oficiales: [Documentación de Tampermonkey](https://www.tampermonkey.net/documentation.php), [GM_xmlhttpRequest](https://www.tampermonkey.net/documentation.php?q=GM_xmlhttpRequest), [GM_getValue/GM_setValue](https://www.tampermonkey.net/documentation.php?q=GM_values).

---

## 7. Automatización y controles — OBLIGATORIO / DISEÑO PROPUESTO

**OBLIGATORIO:** consulta automática + botón manual de **«Consultar y llenar»**, ambos con las mismas reglas de seguridad.

**Diseño propuesto:**

- Interruptor global `AUTO ON/OFF`; opcionalmente activación individual por sorteo.
- El seguimiento automático se ejecuta **solo mientras una página válida de Rover esté abierta**, no como servicio de navegador independiente.
- Programación adaptativa por hora de sorteo, con intervalo y límite configurables, evitando saturar Lottery.net.
- Una sola consulta simultánea por URL; compartir una respuesta cuando cubra varios turnos del mismo estado y juego.
- Reintentos con backoff ante timeout/HTTP transitorio; nunca bucle agresivo o sin límite.
- Botón manual que no dependa de que AUTO esté activado; si hay una consulta en vuelo para la misma identidad, reutilizarla o serializarla.
- Indicadores de `buscando`, `parcial`, `llenado visual`, `ya coincidente`, `sin resultado`, `error` y `conflicto`.
- Sincronización multitab: reducir consultas duplicadas y definir una única instancia que escriba automáticamente. El mecanismo concreto exige **pruebas reales** en Firefox/Chrome, `.net`/`.lol` y varias pestañas.
- No usar `processed` como estado final; una vez que el UI está completo, evitar consultas innecesarias para ese sorteo salvo refresco manual, cambio de fecha, corrección detectada o política explícita de actualización.

**POR VALIDAR:** frecuencia exacta, margen horario, duración del seguimiento, política ante resultados corregidos en origen, disposición final de botones e identidad de pestaña emisora. No introducir valores definitivos sin evidencia o aprobación.

---

## 8. Fases de ejecución y puertas de calidad

### Fase 0 — Investigación y contrato (SIN CODIFICAR)

- [ ] Leer este plan, revisar los dos userscripts de referencia y confirmar que no se importará su lógica de procesamiento.
- [ ] Consultar documentación actual de Tampermonkey y de las herramientas de pruebas que se elijan.
- [ ] Verificar las **10 páginas** de Lottery.net (3 y 4 para cada estado), sus turnos, HTML real y comportamiento ante sorteos aún pendientes.
- [ ] Verificar en Rover la identidad inequívoca de las diez filas y el nombre/orden de los cinco inputs, tanto con tabla inicial como después de Search.
- [ ] Confirmar condiciones de coexistencia con scripts que actualmente pueden escribir en la misma tabla.
- [ ] Resolver las decisiones abiertas que afectan seguridad o funcionamiento.

**Puerta:** contrato de extracción/llenado documentado con ejemplos auténticos; sin suposiciones materiales pendientes.

### Fase 1 — Extractores y validación

- [ ] Implementar un parser compartido y diferencias específicas por juego/estado solo cuando sean necesarias.
- [ ] Normalizar fecha, turno y números; excluir bolas adicionales.
- [ ] Probar ceros iniciales, turnos múltiples, páginas parciales, HTML cambiado y resultados contradictorios.
- [ ] Usar fixtures obtenidas de las páginas inspeccionadas, nunca valores inventados como «prueba real».

**Puerta:** las pruebas automatizadas de extracción y validación pasan para todos los sorteos soportados.

### Fase 2 — Motor de llenado visual

- [ ] Implementar descubrimiento seguro de filas e inputs.
- [ ] Escribir solo campos válidos, sin sobrescrituras, sin clics de procesamiento y sin peticiones de escritura a Rover.
- [ ] Incorporar caché por identidad, restauración después de Search y detección de cambios de fecha.
- [ ] Instrumentar pruebas que intercepten/cuenten intentos de procesar o guardar.

**Puerta:** completar los cinco inputs o subconjuntos parciales con idempotencia y **cero procesamiento**.

### Fase 3 — AUTO, botón manual y multitab

- [ ] Incorporar seguimiento automático configurable y botón «Consultar y llenar».
- [ ] Deduplicar solicitudes, manejar reintentos y errores por estado.
- [ ] Añadir controles de cancelación/caducidad y política multitab.
- [ ] Confirmar que el modo manual funciona con AUTO apagado.

**Puerta:** ambos flujos producen los mismos valores correctos y no compiten entre sí.

### Fase 4 — Validación en navegador real

- [ ] Firefox + Tampermonkey: casos manuales, automáticos, Search, fecha, errores y multitab.
- [ ] Chrome/Chromium + Tampermonkey: los mismos casos.
- [ ] Probar con usuarioscripts coexistentes según el escenario real del usuario.
- [ ] Auditar la pestaña de Network: **ningún POST/PUT/PATCH/DELETE iniciado por Lottery.net hacia Rover; ningún procesamiento accidental por eventos**.
- [ ] Verificar que el resultado sigue **visualmente lleno y no procesado**.
- [ ] Documentar los casos que solo pudieron simularse y los que se observaron en vivo.

**Puerta:** cero fallos críticos; pasar la matriz de regresión y la comprobación de no procesamiento.

### Fase 5 — Distribución y mantenimiento

- [ ] Compilar un `.user.js` instalable desde los módulos.
- [ ] Publicar únicamente en el repositorio/destino que autorice el usuario.
- [ ] Configurar metadatos y actualizaciones automáticas coherentes con la versión distribuida.
- [ ] Registrar `CHANGELOG.md`, documentación de instalación, diagnóstico y resultado de pruebas.

**Puerta:** distribución verificable, instalable y sin regresiones.

---

## 9. Matriz mínima de aceptación — OBLIGATORIO

| ID | Escenario | Comportamiento requerido |
|---|---|---|
| A01 | Diez sorteos configurados | Exactamente los estados, turnos y juegos aprobados |
| A02 | Resultado 3 válido | Inputs 0 y 3 correctos; preservar ceros iniciales |
| A03 | Resultado 4 válido | Inputs 1, 2 y 4 correctos; preservar ceros iniciales |
| A04 | Dos juegos publicados | Los cinco inputs correctos, en fila inequívoca |
| A05 | Fireball/Wild Ball/Super Ball | Excluir siempre la bola adicional |
| A06 | Rover muestra fecha diferente | No llenar resultados de otra fecha |
| A07 | Turno Morning/Midday/Evening diferente | No llenar otro turno |
| A08 | Mismo resultado repetido | No duplicar escritura ni generar conflictos |
| A09 | Input existente distinto | No sobrescribir; marcar conflicto |
| A10 | Resultado parcial | Completar solo campos válidos; sin inventar otros |
| A11 | HTML incompleto, timeout o 403 | Estado de error, ninguna escritura incorrecta |
| A12 | Search reconstruye tabla | Restaurar solo datos aún válidos y casillas vacías |
| A13 | Cambio de fecha durante fetch | Descartar respuesta obsoleta para el UI actual |
| A14 | AUTO ON | Seguimiento sin intervención, sin procesar |
| A15 | AUTO OFF + botón manual | Consulta y llenado manual funcional |
| A16 | Varias pestañas | Sin escrituras automáticas duplicadas ni colisiones |
| A17 | `.net` y `.lol` | Política de coordinación documentada y probada |
| A18 | Convivencia con otros scripts | Sin sobrescritura conflictiva; detectar interferencias |
| A19 | Procesamiento de Rover | **Cero solicitudes o clics de procesamiento causados por el script** |
| A20 | Reinstalación/actualización | Preferencias propias y versión consistente, sin depender de LotteryUSA |

**Criterio de salida:** no publicar una versión como lista para producción si A19 falla, si se mezclan fechas/turnos, si se alteran inputs ajenos o si existe una regresión crítica sin resolver.

---

## 10. Decisiones pendientes que NO deben darse por aprobadas

1. **Destino GitHub — RESUELTO:** `Nox1do/rover-lottery/LotteryNet/` en `main`, autorizado expresamente por el usuario.
2. **Cadencia automática:** intervalos, ventana antes/después del sorteo, límites y reintentos.
3. **Política de correcciones publicadas posteriormente** cuando las casillas ya estén llenas; por defecto, **no sobrescribir**.
4. **Convivencia operativa con scripts existentes** en las mismas filas de Rover; definir cómo evitar que ellos procesen reaccionando a cambios de inputs.
5. **Selección de líder multihost** si están abiertas simultáneamente `.net` y `.lol`.
6. **Ubicación del botón y panel** en la interfaz real de Rover.

Estas decisiones no bloquean redactar o revisar el plan, pero las que afectan comportamiento o seguridad deben resolverse antes del código de producción.

---

## 11. Evidencia y referencias

**Archivos de referencia aportados por el usuario:**

- `Pasted text(20261020-000041).txt`: `Rovs Loterías USA` **v0.6.5**. Aporta inventario de las diez loterías/turnos, reglas de juego 3/4 y mapeo `fillTable()` de cinco casillas.
- `Pasted text(20261020-000537).txt`: `Virtual Lotteries v2 Auto` **v3.2.7**. Aporta ideas de AUTO, coordinación multitab, escritura visual, restauración y el ejemplo **de lo que NO se debe incorporar**, `autoPost('__inc/procesarResultados.php', ...)`.

**Sitio de resultados:** [Lottery.net](https://www.lottery.net/) · Ejemplos de páginas examinadas: [Florida Pick 3](https://www.lottery.net/florida/pick-3/numbers), [Ohio Pick 3](https://www.lottery.net/ohio/pick-3/numbers), [Tennessee Cash 3](https://www.lottery.net/tennessee/cash-3/numbers), [Indiana Daily 3](https://www.lottery.net/indiana/daily-3/numbers), [Louisiana Pick 3](https://www.lottery.net/louisiana/pick-3/numbers).

**Documentación de plataforma:** [Tampermonkey — Userscript Header / GM API](https://www.tampermonkey.net/documentation.php).

---

## 12. Política de cambios del plan

Antes de cada implementación o corrección, añadir al `CHANGELOG.md` (o al registro de cambios del proyecto) qué se modificó, por qué, qué pruebas se ejecutaron y el resultado. Si la solicitud contradice una regla **OBLIGATORIA**, **no cambiarla silenciosamente**: informar la contradicción y obtener una decisión explícita del usuario. Después, actualizar este plan y recién entonces modificar el código.

**Principio final:** **Lottery.net obtiene → valida → llena inputs en Rover → se detiene. Nunca procesa.**
