# Pantalla auditada · 27/10/2026

Fuentes públicas comprobadas:

- https://central.roversport.net/assets/index-DJF6WSbz.js
- https://central.roversport.net/assets/VerResultados-BQtQUfKs.js
- https://central.roversport.net/assets/PublicarFlujo-ZJdvPDv8.js
- https://central.roversport.net/assets/DateField-DlsfibOj.js
- https://react.dev/reference/react-dom/components/input
- https://www.tampermonkey.net/documentation.php?locale=en&q=meta:sandbox
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts/exportFunction

## Instrumentación de omisiones · 0.1.5

El adaptador comparte una única evaluación entre `canFill` y el diagnóstico de bloqueo; se conservan condiciones y orden de los guards. La entrega registra motivos de omisión y un resumen acotado de conciliaciones, sin nuevas consultas, reintentos ni efectos de escritura por abrir el diagnóstico. Inspección pública adicional: `index-kAGvESlW.js` y `VerResultados-h4jeei_q.js`; las casillas usan estado controlado y no tienen un bloqueo específico de Quinielón. El estado posterior a una publicación manual no acredita el bloqueo anterior.

## Contratos observados

| Función nativa | Adaptación |
| --- | --- |
| Calendario MM/dd/yyyy, texto español y Buscar | Verifica fecha de respuesta + tabla asentada; no confía solo en calendario |
| Servidor con nombre y contador de fallos | Lee `.truncate`, no el texto completo contaminado por contador |
| POST de lectura resultadosLoteria2 | Observa sin solicitar lecturas adicionales; conserva promesa y respuesta originales |
| 13 columnas, orden y filtro desmontando filas | Índice por cabecera y nombre/código únicos; ninguna posición de fila fija |
| Inputs React con estado local independiente | Setter nativo + evento input + comprobación posterior al render |
| Pick 3/4 y dependencias | Derivación nativa; valida campos afectados antes de escribir |
| PROC basado en persistencia, campos editables aparte | ACK desde datos publicados, no desde una edición pendiente |
| Pendientes de tickets y Status de transmisión | No equivalen a PROC y no causan nuevas publicaciones |
| PublicarFlujo congela valores | Diálogos/carga/publicación bloquean efectos; posterior recarga confirma |
| Fuentes, Usar y consenso | No toca configuración; respeta conflictos y trabajo local |
| Fotos, portapapeles, historial y alertas | Sus tablas/campos/fechas no se usan para llenar resultados |
| Horarios/dependientes y otros servidores | Mango no opera en esas vistas |
| Filas visibles diez minutos antes, sin polling principal | Refresco nativo limitado y condicionado a ausencia de trabajo local |

El tiempo mínimo de asentamiento se combina con igualdad de identidad, PROC y campos persistidos; un retraso, error o contexto incompatible suspende efectos. Una respuesta fuera de orden no sustituye la última solicitud. Si no se observó la carga inicial se requiere Buscar de nuevo. Una discordancia entre servicios se diagnostica y no se repara automáticamente.

## Corrección PROC de 0.1.1

El diagnóstico de la sesión del usuario recibió HTTP 200, fecha 2026-10-27, servidor PRINCIPAL y 14 filas con números coincidentes; 13 diferencias estaban limitadas a PROC. Los assets públicos vigentes `index-CXAjh0_O.js` y `VerResultados-DSPp5D3p.js` usan el icono Lucide `circle-check`, con alias `check-circle-2`. El adaptador 0.1.0 buscaba otros nombres y devolvía un estado desconocido para las filas procesadas, dejando el contexto en «Central está cargando resultados…».

0.1.1 reconoce esos dos nombres y conserva `circle-check-big` y `circle-check-2`. Solo inspecciona la celda PROC; el color verde y los iconos de Status no acreditan publicación. Un icono desconocido sigue bloqueando la verificación. No se cambian el protocolo Mango ni las condiciones que exigen fecha, servidor y valores persistidos.

Referencias primarias: [Lucide React](https://lucide.dev/guide/react/), [alias de iconos](https://lucide.dev/guide/react/advanced/aliased-names) y los dos assets públicos de Central mencionados. Los nombres de assets son evidencia de esta inspección, no rutas permanentes.

## Azul y filtros de 0.1.2

Al desmontar una fila filtrada, React elimina sus inputs y sus atributos visuales. El cliente anterior solo volvía a pintar durante el sondeo Mango; si el filtro dejaba la tabla vacía, también se limpiaban los indicadores. Una consulta pendiente impedía atender esos cambios de pantalla hasta terminar.

El cliente ahora sincroniza el azul desde la caché ya recibida, vinculada a la fecha y generación del contexto verificado, antes de comprobar si corresponde una nueva consulta. Esta ruta solo cambia indicadores: no reserva, llena, presenta ni reconoce resultados. Reutiliza las mismas coincidencias únicas del ciclo de entrega y los campos autorizados, excluye números existentes y estados procesados, y limpia inputs desmontados. El verde conserva su plazo original y no se reproduce al recrear la fila.

Referencia primaria: [React: conservación y reinicio de estado](https://react.dev/learn/preserving-and-resetting-state). Las pruebas Firefox reconstruyen las filas por filtro y comprueban que el azul vuelva antes de 700 ms, sin solicitudes adicionales ni cambios numéricos, también con una solicitud retenida y una tabla temporalmente sin coincidencias.

## Códigos y contexto de 0.1.3

La QA del usuario recibió HTTP 200, fecha 2026-10-27, PRINCIPAL y 118 filas tanto en respuesta como en DOM. Solo `BRAZIL03PM` aparecía como código sin coincidencia. Esa salida no incluía la cadena original de `abrev`, por lo que no acredita qué carácter concreto contenía. La revisión encontró una asimetría verificable: el adaptador recortaba el texto del badge, mientras el contexto indexaba `abrev` sin recortar. Una respuesta con espacios exteriores reproduce exactamente el bloqueo general, antes de consultar Mango.

0.1.3 aplica únicamente `trim()` a códigos de resultados, DOM, reglas de dependientes y revisiones. No cambia mayúsculas, separadores ni espacios internos, no modifica las respuestas originales y no omite filas incompatibles para forzar una verificación. Rechaza vacíos y códigos que colisionan tras el recorte; los conflictos y el trabajo en dependientes siguen bloqueando el llenado. Ante una incompatibilidad real, el diagnóstico muestra el código de la fila y la condición que falla.

Las regresiones Firefox verifican la consulta y el azul en 118 filas, el llenado de NICA/LA DIARIA con una fila BRAZIL cuyo código contiene espacios, y el bloqueo por conflictos, ediciones en dependientes e identidades realmente distintas. Falta confirmar la corrección en la sesión del usuario. Referencia primaria: [MDN: String.prototype.trim()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim).

## Llenado agrupado de 0.1.4

El usuario confirmó que 0.1.3 ya llena, pero cada casilla aparecía por separado. El adaptador esperaba 35 ms tras cada evento `input`, además de otros 35 ms al terminar la fila. Esas cesiones permitían pintar valores parciales y ejecutar el foco nativo antes de completar el resto de campos.

0.1.4 cede solo a microtareas entre entradas: React, MutationObservers y otros scripts pueden reaccionar, y se vuelven a comprobar contexto/reserva/actividad. Sin temporizadores entre entradas, los casos normales completan la fila antes de que el navegador pinte o ejecute el foco nativo. Se mantienen los 35 ms finales de comprobación, sin depender de `requestAnimationFrame` para operar en pestañas de fondo. Un fallo temprano deja pasar el foco nativo pendiente antes de restaurar foco/scroll.

La intervención entre entradas se prueba con una microtarea, también cruzando el sandbox real de Firefox. La intervención mediante temporizador de 10 ms se conserva como escenario separado del userscript completo: puede ocurrir después del bloque ya escrito, pero la comprobación final impide `presented` y el verde. No se promete deshacer entradas anteriores a esa intervención ni se revierte trabajo ajeno.

Los guards de un contexto confirmado usan metadatos y conteo de filas reconocidas; los valores de la fila afectada se releen en cada paso. Una respuesta candidata vuelve a comparar identidad, PROC y todos los valores visibles antes de autorizar. Se conserva el bloqueo de filtros/duplicados y no se adoptan las reglas de sobrescritura de USA React.

Referencias primarias: [React: cola de actualizaciones](https://react.dev/learn/queueing-a-series-of-state-updates) y [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame). Las medidas de frames pertenecen a una fixture; no garantizan menor latencia global de Central en el equipo del usuario.

## Límites de pruebas

La fixture reproduce los contratos comprobados, pero no es la aplicación privada de Central. La prueba de contexto aislado usa una extensión temporal y GM simulado, no una instalación personal de Tampermonkey. No se invocan publicaciones financieras ni se usan cookies de la sesión del usuario. Validación operativa posterior: instalar, configurar token, comprobar diagnóstico y revisar un llenado real antes de confirmar manualmente como siempre.
