# Guía de continuidad — Mango React

Actualizada el **28 de octubre de 2026**. Sirve para retomar el proyecto en otra conversación sin reconstruir sus decisiones ni confundirlo con USA React. Antes de trabajar, contrastar esta guía con la rama `main`: puede haber cambios posteriores.

**Versión vigente: 0.1.7.** El usuario informó falta de azul/llenado en Anguilla 8 PM y Real PM con 0.1.6. El servicio había iniciado vigilancia y obtenido resultados; los reconocimientos fueron manuales. Su diagnóstico posterior mostró `RHOD-MD` con campos incompatibles, caché vacía, token sin comprobar y una consulta anterior. Se reprodujo exactamente mediante un cambio remoto de configuración con una edición local: `reset` borraba el baseline verificado mientras Central conservaba las casillas. Ahora la invalidación externa del adaptador utiliza la misma suspensión que Buscar, conservando únicamente la referencia verificada. Siguen exigiéndose respuesta nueva, fecha/servidor iguales y persistencia intacta para reconocer una edición conocida. No se cambió a verificación parcial por fila ni se ignoran diferencias desconocidas. La traza no identifica quién originó el reinicio en la sesión real ni demuestra retrospectivamente la causa antes del llenado manual.

**Entrega anterior 0.1.6:** El usuario informó New York AM: se llenó Pick 3, Pick 4 quedó pendiente y apareció al recargar con F5. Los registros de su PC acreditan una entrega inicial solo Pick 3 y otra completa tras la recarga. Se reprodujo en Firefox: Central genera valores/X en las dependientes durante la primera entrada y el guard anterior los bloquea como trabajo ajeno. Se atribuyen solo proyecciones nativas retenidas tras escritura propia; para continuar se exige misma principal/servidor/fecha/reglas, campos y baseline intactos. Se invalida la atribución ante intervención en principal, dependiente u otra principal que la comparta, aunque queden los mismos valores. Buscar reconoce las dependientes propias como trabajo local. Verificación: 45 Node, 52 escenarios React/Firefox y dos de extensión. Falta confirmación en la sesión del usuario. No extrapolar este arreglo al incidente de Quinielón, cuya causa sigue pendiente.

**Entrega anterior 0.1.5:** Añade `omitidas` por motivo y `conciliaciones` (último intento de hasta 20 loterías, sin respuesta completa, tokens ni IDs de operaciones/otras PCs). Conserva guards y protocolo. El fallo de Quinielón PM sigue pendiente de causa: resultado 34 disponible, PC del usuario sin llenar y diagnóstico 0.1.4 sin errores; una operación presentada a las 19:08 correspondía a otra PC. El usuario confirmó que llenó manualmente antes de procesar a las 19:12. La captura posterior de `EQN-PM` acredita procesado 34/X/X, campos habilitados, sin reglas ni revisiones para esa fila; estaba oculta por el filtro. No extrapolar ese estado al instante del fallo. La nueva instrumentación debe capturar la próxima omisión antes de resolverla manualmente.

**Entrega anterior 0.1.4:** El usuario confirmó que 0.1.3 ya llena, pero pidió eliminar el llenado escalonado. Se sustituyen las pausas de 35 ms entre casillas por cesión a microtareas, con guard en cada paso y comprobación final de retención de 35 ms antes de `presented`. Las pruebas muestran cero frames parciales en tablas completas/filtradas; conservan intervención entre entradas y tardía, también desde una extensión Firefox aislada. El guard estable evita releer toda la tabla, pero cada nueva respuesta vuelve a compararse completa. Verificación: 38 pruebas Node, 38 escenarios React/Firefox y dos de extensión aislada. Falta confirmar la mejora visual en el equipo del usuario; no afirmar una mejora global de latencia solo por reducir lecturas. Ver [CHANGELOG](CHANGELOG.md), [compatibilidad](docs/compatibilidad.md) y [verificación](docs/verificacion.md).

**Corrección anterior 0.1.3:** unifica el recorte de espacios exteriores en códigos nativos y muestra la fila que impide verificar el contexto. El usuario detectó `BRAZIL03PM` como única fila sin coincidencia entre 118. Se reprodujo la asimetría DOM recortado/respuesta sin recortar, sin acreditar qué carácter contenía la cadena cruda. El usuario confirmó luego que ya funciona y llena. Sus bloqueos por colisiones, diferencias internas, PROC/campos incompatibles y trabajo local siguen vigentes.

**Corrección anterior 0.1.2:** recupera el azul de vigilancia al volver a mostrar una fila filtrada, incluso tras cero coincidencias o durante una consulta pendiente. Usa caché vinculada al contexto verificado, sin nuevas consultas, reservas, llenados ni ACK; respeta números existentes, estados finales y plazo del verde. Sus regresiones siguen incluidas.

**Corrección anterior 0.1.1:** reconoce el icono PROC actual de Central (`circle-check` / `check-circle-2`), conservando los anteriores y bloqueando desconocidos. Resolvió el bloqueo «Central está cargando resultados…» con 13 de 14 filas discrepando solo en PROC. El usuario confirmó después fecha/servidor verificados, token válido, siete filas API coincidentes y cero errores. Falta validar un llenado real y su retención tras otro render. Los datos de entrega inicial 0.1.0 que siguen se conservan como referencia histórica; sus contratos continúan vigentes.

## 1. Estado de partida confirmado

| Proyecto | Carpeta | Versión de referencia | Commit |
| --- | --- | --- | --- |
| Mango/Rover React | `Mango-react/` | `0.1.0` | `66b7e34c48adc66a160ca9a37335d98c047d8b28` |
| Rovs Loterias USA React | `Loterias USA React/` | `0.0.13` | `a17612637a22737d3697a5bee052be260b8c7507` |

Repositorio: <https://github.com/Nox1do/rover-lottery>.

**Mango React ya está implementado y publicado. No empezar otra adaptación desde cero.** Su diseño y plan aprobados están en esta carpeta y sus tareas aparecen completadas. El siguiente trabajo consiste en validar o mejorar la implementación existente según la petición concreta del usuario.

Esta entrega solo añade esta guía; no cambia código, comportamiento, versión del userscript ni backend.

## 2. Objetivo y decisiones vigentes

- Adaptar Mango a <https://central.roversport.net/loteria/resultados/ver>, manteniendo una instalación independiente del Mango clásico.
- Navegador del usuario: **Firefox**, con **Tampermonkey**, en Windows 10. Leer documentación antes de implementar; mantener módulos claros y ejecutar las comprobaciones correspondientes antes de entregar.
- Producto escrito en **JavaScript vanilla** empaquetado con esbuild. React/ReactDOM se utilizan en las pruebas; no montar otra copia de React en Central.
- Mango opera únicamente en **PRINCIPAL** y en **hoy según `America/Santo_Domingo`**. Esa zona operativa no depende de la zona del PC ni de la conversación.
- Conservar el contrato **Mango 1.0** y el servicio existente. El cambio de cliente no incluye modificar el Worker o el scheduler.
- El usuario había reservado Florida y New York para Mango frente al reparto de LotteryNet. No trasladar automáticamente a Mango el catálogo de 75 sorteos de USA React: Mango recibe sus filas y campos autorizados del servicio.
- **Mango llena; el usuario revisa y procesa.** El script nunca pulsa Procesar, confirma una publicación ni solicita una operación financiera de Central.
- Preservar ediciones y limpiezas manuales, la intervención de otros userscripts y los efectos sobre dependientes. Ante contexto incierto o conflicto, suspender los efectos.

## 3. Orden recomendado de lectura

1. [README.md](README.md): instalación, menús y comportamiento actual.
2. [Diseño aprobado](docs/superpowers/specs/2026-10-27-mango-react.md).
3. [Plan completado](docs/superpowers/plans/2026-10-27-mango-react.md).
4. [Auditoría de compatibilidad](docs/compatibilidad.md).
5. [Verificación y límites](docs/verificacion.md) y [CHANGELOG.md](CHANGELOG.md).
6. `src/context.js`, `src/native.js`, `src/central.js` y `src/delivery.js`, junto a sus pruebas.
7. Para rendimiento o reutilización, [RENDIMIENTO.md de USA React](../Loterias%20USA%20React/RENDIMIENTO.md), sus módulos `rover.js`, `visibility.js`, `feedback.js` y las diferencias de la sección 7 de esta guía.

Leer cualquier `AGENTS.md` aplicable que exista al retomar el trabajo. El de `Loterias USA React/` corresponde a esa variante: sus restricciones específicas no sustituyen el diseño propio de Mango.

## 4. Mapa de la implementación

| Archivo | Responsabilidad |
| --- | --- |
| `src/main.js` | Ensamblado, menús GM, configuración, caché de filas API, coordinación y sondeo. |
| `src/helpers.js` | Campos conocidos, normalización, validación de números y fechas, zona operativa e identificadores. |
| `src/native.js` | Observación transparente de solicitudes nativas conocidas de Central. |
| `src/context.js` | Contexto invalidable, fecha realmente cargada, respuestas fuera de orden y valores persistidos. |
| `src/central.js` | Reconocimiento de tabla/filas, permisos, conflictos, atribución de dependientes, edición local y llenado React. |
| `src/dependencies.js` | Proyección pura de reglas nativas conocidas para verificar atribución; no escribe casillas. |
| `src/api.js` | Solicitudes Mango mediante GM; autenticación privada y tratamiento de errores. |
| `src/delivery.js` | Identidad de loterías, reservas, presentación, ACK y discordancias. |
| `src/polling.js` | Intervalo según componentes activos o agotados/procesados. |
| `src/visuals.js` | Azul pendiente, verde temporal y limpieza de indicadores. |
| `tools/build.mjs` | Generación reproducible del instalador, metadatos e histórico. |
| `tests/*.test.mjs` | Pruebas unitarias de contexto, entrega y runtime. |
| `tests/firefox.mjs` | Escenarios con React controlado y Firefox. |
| `tests/sandbox-firefox.mjs` | Extensión temporal Firefox: aislamiento, Xrays y `exportFunction`, con GM simulado. |

## 5. Contratos que deben conservarse

### Contexto y observación de Central

No basta con leer el calendario. Una respuesta nativa válida debe acreditar la fecha cargada y concordar con la tabla asentada. Si no se observó la carga inicial, se necesita **Buscar**. Las respuestas antiguas, fallidas, de otra fecha o de otro servidor no autorizan escrituras ni ACK.

El observador envuelve `fetch` de la página para reconocer rutas concretas, conservando sus argumentos, promesa y respuesta originales. Para las lecturas conocidas, consume una copia de la respuesta. No fabrica respuestas ni hace nuevas lecturas de Central por su cuenta.

Rutas reconocidas bajo `/api/loteria/resultadosLoteria2`:

- La ruta base acredita resultados persistidos.
- `/dependientes` aporta reglas nativas.
- `/revision` aporta revisiones/conflictos.
- `/procesar` se observa para suspender efectos durante una publicación **iniciada por Central**. Mango no la invoca ni copia su respuesta como resultados publicados.

Se exporta únicamente el envoltorio necesario con `exportFunction`; el token y las funciones GM permanecen en el sandbox. No exponerlos en `unsafeWindow`, atributos DOM, mensajes o diagnóstico. Se conserva `@sandbox JavaScript` y la instalación en `document-start`.

### Identidad, campos y trabajo local

- Detectar cabeceras y coincidencias únicas por nombre/código/alias exacto normalizado. No usar índices de fila, coincidencias parciales ni el orden visual como identidad.
- La tabla de resultados auditada tiene 13 columnas. Fotos, historial, status de transmisión y pendientes no equivalen a PROC y no deben confundirse con campos numéricos.
- Una fila filtrada o duplicada no autoriza un llenado por aproximación. No eliminar filtros para encontrarla.
- Los campos son `primera`, `segunda`, `tercera`, `pick3`, `pick4`; conservar cadenas y ceros iniciales.
- Usar setter nativo más evento `input`; comprobar que React retenga los valores después de actualizarse. No usar Fiber ni propiedades privadas de React.
- Pick 3 deriva 1era; Pick 4 deriva 2da/3ra. No escribir otra vez esos premios cuando el pick ya los calcula.
- Revisar también las dependientes afectadas antes de llenar la principal. Si hay trabajo ajeno, bloqueo o incertidumbre, omitir el llenado. La continuación de un componente puede conservar dependientes atribuidas a una entrada propia anterior solo con reglas, valores y baseline intactos; no basta con que contengan X o coincidan numéricamente.
- No restaurar indiscriminadamente un campo borrado. El registro de intervención local es intencional. Tampoco revertir cambios ajenos si el llenado se interrumpe.
- Diálogos, carga, publicación, falta de permisos, fecha histórica, otra vista o servidor distinto suspenden los efectos.

### Entrega y confirmación Mango

Base configurada: `https://rover-lottery-api.loteriasrovers.workers.dev`.

| Ruta | Uso |
| --- | --- |
| `/v1/mango/version` | Fecha/revisión disponible. |
| `/v1/mango/rows` | Filas del contrato 1.0, componentes y campos autorizados. |
| `/v1/mango/rows/reconcile` | Solicitar una reserva y comprobar si corresponde pintar. |
| `/v1/mango/rows/presented` | Informar valores efectivamente retenidos después del llenado. |
| `/v1/mango/rows/ack` | Reconocer números realmente procesados y persistidos en Central. |
| `/v1/mango/auth-check` | Comprobar el token configurado desde el menú. |

Antes de usar una reserva y entre escrituras, validar contexto, `operation_id`, estado `reserved`, revisión, campos autorizados y `expires_at`. Descartar reservas antiguas al cambiar contexto o revisión. Conservar la identidad de operación al reintentar una presentación fallida; no volver a escribir por ese fallo.

**`presented` no significa `processed`.** El verde de llenado tampoco significa publicado. Para ACK se requiere contexto verificado, PROC y valores persistidos de Central. Si una fila procesada tiene una edición posterior sin guardar, confirmar los números publicados, no los visibles editados. Reconocer también publicaciones manuales aunque el proveedor oficial todavía no tenga resultado.

Si Mango informa `processed` pero Central sigue pendiente, diagnosticar la discordancia; no resetear ni reparar automáticamente el estado compartido.

## 6. Operación y diagnóstico

Instalador estable: [Mango-Rover-React.user.js](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Mango-react/Mango-Rover-React.user.js).

Actualizaciones: [Mango-Rover-React.meta.js](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Mango-react/Mango-Rover-React.meta.js).

La instalación tiene almacenamiento GM propio. El token del Mango clásico **no se copia automáticamente**. Menús disponibles: Configurar token, Pausar/reanudar, Diagnóstico y Regenerar identificador de PC. No incluir un token real en esta guía ni en fixtures.

Sondeo: **5 s** con entregas activas, **120 s** sin actividad y **30 s** tras errores. Las mutaciones de pantalla no deben provocar peticiones ilimitadas. Buscar nativo puede refrescar, como máximo cada dos minutos y solo con contexto verificado y sin trabajo local, para descubrir loterías que aparecen cerca del sorteo.

Diagnóstico útil: versión, observador operativo, token configurado/estado de autenticación, contexto, fecha verificada, servidor, última consulta, intervalo, filas API, coincidencias, errores y discordancias. El diagnóstico no imprime el token.

## 7. Diferencias con USA React y lecciones de rendimiento

| Aspecto | USA React 0.0.13 | Mango React 0.1.0 |
| --- | --- | --- |
| Activación | Botón manual por lotería. | Entrega automática autorizada por el servicio. |
| Datos existentes | El usuario autorizó reemplazar/recalcular, incluso picks iguales. | Preserva intervención local; no copiar la sobrescritura de USA. |
| Fuente | Proveedores externos por configuración. | Contrato Mango y sus reservas/revisiones. |
| Observación nativa | Adaptador DOM sin observador de respuestas. | Observador pasivo necesario para contexto y persistencia. |
| Fecha/servidor | Fecha seleccionada y vinculada a Buscar. | Solo hoy operativo y PRINCIPAL, con respuesta nativa verificada. |
| Foco/scroll | Lleva la fila consultada sobre la barra y prepara foco en Pick 4. | Busca conservar foco/scroll del usuario; no añadir navegación automática por cada entrega. |
| Verde | Fijo 1 s, sin desvanecimiento; negrita conservada. | Verde temporal 2 s; no equivale a procesado. |
| Confirmación remota | No tiene protocolo de entrega Mango. | Distingue reserva, `presented` y ACK de persistencia. |

En esta conversación el usuario informó lentitud con toda la tabla, mientras una sola fila filtrada era fluida. **USA React 0.0.12 redujo recorridos, pero el usuario confirmó que el problema seguía.** No presentar esa optimización como solución acreditada de fluidez.

USA React 0.0.13 eliminó pausas entre entradas, preparó Pick 4 con `preventScroll` y quitó animaciones continuas del verde. Se reprodujo que el foco nativo programado tras Pick 3 encontraba antes valores parciales. También se corrigió el reajuste de la fila al cambiar el alto del viewport sin cambiar el tamaño de la barra. Pasaron 69 pruebas Firefox; **a la fecha de esta guía el usuario aún no confirmó que 0.0.13 resolviera el lag en su equipo**.

Mango 0.1.0–0.1.3 esperaba 35 ms entre entradas. A petición posterior del usuario, 0.1.4 agrupa entradas en microtareas y conserva la espera final de 35 ms, guard por entrada, foco/scroll y las pruebas de intervención. Una intervención de microtarea cancela los campos restantes; la intervención mediante temporizador de 10 ms se prueba por separado y puede ocurrir después del bloque, en cuyo caso impide `presented` y el verde sin revertir valores. **No copiar las sobrescrituras de USA ni eliminar estos guards, la verificación posterior o las pruebas de intervención.**

Si se trabaja rendimiento después: reproducir tabla completa frente a una fila, inicial y repetido, foco nativo, dependientes, scroll, verde y coexistencia de scripts. Separar red, cola, JS/renderizado y pintura. Menos consultas DOM o pruebas funcionales aprobadas no demuestran por sí solas menor latencia. No atribuir todo el coste al userscript: Central también renderiza sus componentes React.

## 8. Verificación: evidencia y límites

El reporte de la entrega Mango 0.1.0 documenta **29 pruebas Node**, **15 escenarios React/Firefox** y **1 escenario en extensión Firefox aislada**. Incluye 241 filas, fecha/servidor, filtros, permisos, persistencia frente a edición, dependientes, reservas obsoletas, reintentos, foco/scroll y coexistencia con otro script.

Al preparar esta guía se volvió a ejecutar `npm run test:unit`: **29/29 aprobadas**. No se repitió la suite de navegador por este cambio exclusivamente documental; su evidencia previa está en [verificacion.md](docs/verificacion.md).

Las funciones GM y respuestas Mango de las pruebas están simuladas. La extensión temporal verifica el límite real Xrays/`exportFunction`, pero no equivale a instalar Tampermonkey en la cuenta del usuario. No se probó ni se debe simular como realizada una publicación financiera real.

Comandos desde `Mango-react/`:

```sh
npm ci
npx playwright install firefox
npm run check
npm test
```

Para cambios de código, generar con `npm run build` y repetir comprobaciones. **Mango no tiene un comando `npm run release`**: no copiar los comandos de USA. Su build genera también el histórico de la versión indicada; antes de publicar cambios de código, incrementar la versión para no sobrescribir un histórico publicado. Leer el lanzador de pruebas actual antes de ajustar el entorno; las opciones de aislamiento de procesos son solo para pruebas, no para el producto ni la instalación del usuario.

## 9. Pendientes reales y alcance de la próxima conversación

1. Validación operativa en Firefox/Tampermonkey del usuario: token propio, observador, PRINCIPAL/hoy/Buscar, diagnóstico y conservación de un llenado después de otro render. La publicación sigue siendo una acción manual del usuario.
2. Si aparece lentitud o un fallo, obtener el síntoma concreto y diagnóstico y reproducirlo antes de cambiar comportamiento. No dar por trasladada a Mango la solución de USA.
3. El scheduler del backend que continúa buscando al proveedor después de un `processed` manual y los ACK históricos incorrectos son pendientes documentados del sistema compartido. **No están resueltos por Mango React ni autorizan modificar el Worker dentro de una tarea del cliente.**
4. Este repositorio y las lecturas realizadas para esta guía no identifican el archivo/versión exactos de todo el Mango clásico ni su backend desplegado. Si se necesita cambiar esos componentes, localizarlos y verificar su código y configuración reales; no reconstruirlos por suposición.

No ampliar servidores, fechas, loterías o comportamiento de sobrescritura sin revisar el alcance de la petición nueva. La aprobación inicial cubre la adaptación descrita en el diseño existente; no hace falta volver a pedir aprobación para reconstruir algo que ya está implementado.

## 10. Mantenimiento y publicación

- Inspeccionar `git status` y obtener `origin/main` antes de editar. Puede haber trabajo simultáneo en otras conversaciones; no descartar cambios ni forzar la rama.
- Esta continuación pertenece a `Mango-react/`. No modificar otras variantes o backend incidentalmente.
- Editar `src/`, no el instalador generado. Conservar identidad `Mango/Rover React`, namespace y URLs propias.
- Para una actualización de código: sincronizar versión de `metadata.json`, `package.json` y lockfile; actualizar CHANGELOG y documentación, generar, probar y revisar el diff.
- Conservar `versions/Mango-Rover-React-v0.1.0.user.js` y futuros históricos publicados.
- Publicar sobre el HEAD remoto más reciente, preservando cambios ajenos; verificar que los archivos raw coincidan con los probados.
- Un cambio solo de documentación, como esta guía, no requiere incrementar la versión del userscript.

## 11. Documentación técnica primaria

- [React: inputs controlados](https://react.dev/reference/react-dom/components/input).
- [Tampermonkey: documentación y metadatos de sandbox](https://www.tampermonkey.net/documentation.php).
- [Firefox: exportFunction](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts/exportFunction).
- [DOM: focus y preventScroll](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus).
- [DOM: MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver).

Los hashes de los assets de Central citados en la auditoría son evidencia de esa inspección, no URLs permanentes. Si la pantalla cambia, inspeccionar los assets vigentes y actualizar la reproducción; no afirmar compatibilidad actual basándose solo en un bundle antiguo.

## 12. Texto para iniciar otra conversación

> Continúa el proyecto Mango React del repositorio https://github.com/Nox1do/rover-lottery. Lee primero Mango-react/GUIA-CONTINUIDAD.md, el README, el diseño aprobado, el plan y los reportes de compatibilidad/verificación; contrástalos con main. Ya existe Mango/Rover React 0.1.0, no empieces de cero. Usa Firefox/Tampermonkey como entorno objetivo y conserva PRINCIPAL/hoy, contrato Mango 1.0, token privado, edición local, dependencias y distinción entre presented y processed. No publiques resultados ni modifiques el backend. Distingue las lecciones de USA React de los contratos propios de Mango. Después aplica la tarea concreta que te indique; si falta un dato que cambie el alcance, acláralo antes de escribir código y verifica la implementación antes de entregarla.
