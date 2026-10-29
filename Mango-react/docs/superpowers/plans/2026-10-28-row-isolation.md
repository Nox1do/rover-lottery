# Mango React: aislamiento por lotería — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. Ejecución nativa aprobada el 28/10/2026.

**Goal:** Una lotería incompatible no detiene el azul, llenado ni confirmación de otras loterías independientes.

**Architecture:** `context.js` verifica la carga general y conserva evidencia nativa por código; el adaptador verifica cada operación y sus efectos. `delivery.js` consume únicamente filas de Mango y registra fallos locales sin invalidar el contexto general. Los cambios de contexto y rechazos de autenticación siguen suspendiendo todo.

**Tech Stack:** JavaScript ESM, Firefox/Tampermonkey, esbuild, node:test y Playwright Firefox con React real en fixtures.

**Spec:** `Mango-react/docs/superpowers/specs/2026-10-28-row-isolation-design.md` — diseño aprobado que reemplaza la exigencia de igualdad global de valores del diseño anterior.

## Global Constraints

- Firefox y Tampermonkey; conservar sandbox y contrato Mango 1.0.
- Solo PRINCIPAL y hoy en America/Santo_Domingo.
- Nunca pulsar Procesar ni publicar resultados; no modificar backend, perfiles o fuentes.
- Respetar ediciones y limpiezas manuales, ceros iniciales, dependencias, foco y scroll.
- No añadir frameworks ni dependencias de producción; seguir con módulos JS y build esbuild.
- No sobrescribir históricos publicados; la siguiente versión se decide contra main al implementar.

Antes de implementar: leer documentación primaria actual de inputs controlados de React, Tampermonkey y Firefox/exportFunction enlazada en GUIA-CONTINUIDAD. Inspeccionar main y AGENTS aplicables; no modificar otras carpetas ni cambios ajenos. La planificación se entregó sin código; el usuario aprobó después su implementación.

## Review Focus

1. Carga de ayer o respuesta tardía: no puede autorizar una fila aparentemente idéntica hoy. Pruebas en tarea 1.
2. Primera carga con una fila nunca verificada: no hereda confianza del resto ni de un reinicio. Pruebas en tareas 1 y 2.
3. Dos principales comparten dependiente, reglas cambian o efecto no puede delimitarse: bloquear las operaciones relacionadas, conservando otras. Pruebas en tarea 2.
4. Falla la retención o llega una intervención durante una reserva: no confirmar datos ajenos y continuar solo si sigue válido el contexto general. Pruebas en tarea 3.
5. PROC verde con edición local: ACK de persistidos, sin incluir valores locales ni campos ajenos. Pruebas en tarea 3.

## Mapa de archivos

- Modificar `src/context.js`: prueba general, índices persistidos y evidencia previa por fila.
- Crear `src/row-context.js`: comprobación pura por código, campos relevantes y persistencia.
- Modificar `src/central.js`: usar esa comprobación, calcular alcance de efectos y aislar fallos de retención.
- Modificar `src/delivery.js`: aplicar controles para azul, llenado, presentación y ACK.
- Modificar `src/main.js`: exponer diagnóstico general y local por separado.
- Crear `tests/row-context.test.mjs`; modificar `tests/context.test.mjs`, `tests/delivery.test.mjs`, `tests/runtime.test.mjs`, `tests/firefox.mjs` y `tests/sandbox-firefox.mjs`. Ampliar `tests/fixture.jsx` solo para representar escenarios ausentes.
- Actualizar metadatos, archivos generados y documentación únicamente al preparar la entrega implementada.

## Task 1: Separar carga general de evidencia por fila

**Files:** `src/context.js`, `tests/context.test.mjs`.

**Interfaces:** Mantener `begin`, `finish`, `prepareSearch`, `snapshot`, `assert` e invalidación por época. `snapshot` conserva `{epoch,date,server,serverId,persisted}` y añade `invalidRows: Map<code,reason>` y `verifiedRows: Map<code,proof>`. Añadir `context.recordProof(code,proof,snap)`, que rechaza pruebas de otra época/contexto. Solo registrar una comprobación de fila efectiva y satisfactoria; una respuesta recibida no es prueba de igualdad DOM. Las pruebas incluyen campos, PROC y contexto; un consumidor no puede ampliar su alcance.

- [x] Escribir regresiones: respuesta correcta con RHOD-MD incompatible y REAL compatible habilita contexto general; RHOD-MD no aparece como verificada. Una colisión de código invalida únicamente ese código. Respuesta sin fecha válida o sin array `filas` sigue bloqueando globalmente.
- [x] Mantener pruebas negativas de calendario sin Buscar, ayer, respuesta vieja tras otra búsqueda, fallo de carga, lectura, servidor y permisos. Añadir reinicio donde una fila nunca verificada no obtiene referencia previa.
- [x] Ejecutar `node --test tests/context.test.mjs` desde `Mango-react`; verificar fallos concretos por la política global actual, no por errores de fixture.
- [x] Separar validación de envoltura de clasificación por código. Conservar estabilización y guard de carga; comprobar tabla única reconocida en el adaptador. No validar la carga mediante un simple conteo ni permitir efectos por el solo hecho de recibir el JSON.
- [x] Ejecutar la misma prueba hasta que pase y guardar un commit acotado.

## Task 2: Comprobar una operación y sus efectos nativos

**Files:** crear `src/row-context.js` y `tests/row-context.test.mjs`; modificar `src/central.js` y pruebas del adaptador en `tests/firefox.mjs`.

**Interfaces:** `checkRow({snap,code,keys,visible,previousProof,localEvidence,purpose}) -> {ok:true,stored,visible,proof} | {ok:false,motivo,codigo,campos}` en módulo puro. `purpose` es `blue|fill|ack|dependency`. `campos` contiene solo nombres relevantes con diferencia; `proof` especifica contexto, PROC y campos efectivamente verificados. `central.rowBlock(code,keys,snap,purpose) -> null | block` realiza lecturas frescas y registra la prueba válida mediante `context.recordProof`. `central.fillBlock` conserva su firma y suma la validación del alcance de efectos. En `ack`, una edición visible conocida no sustituye los persistidos: solo se exceptúa con prueba previa válida para esos campos, persistencia intacta y PROC nativo y visible confirmados.

- [x] Escribir pruebas con valores concretos: RHOD-MD Pick 4 `6401` y X/XX diferentes no afectan REAL; en una fila solo Pick 4, diferencia en Pick 3 ajeno no impide una operación que no lo lee ni escribe. Si segunda o tercera con números ajenos serían modificadas por Pick 4, bloquear la escritura.
- [x] Añadir identidad duplicada, código ausente, PROC desconocido, cambios de valores relevantes y localEvidence sin prueba previa. Una diferencia numérica nunca se normaliza a X o vacío; `05` conserva cero.
- [x] Añadir dependiente compartida entre A/B: intervención bloquea A/B, C continúa. Reglas cambiadas, dependiente ausente por filtro y regla no interpretable no autorizan escribir efectos inciertos. Mantener reglas y atribución propias de 0.1.6.
- [x] Ejecutar `node --test tests/row-context.test.mjs`; verificar rojo por interfaz ausente. Luego implementar el comparador y la integración mínima.
- [x] Determinar claves desde campos administrados, premios derivados y reglas activas; incluir todo campo leído o modificado. No convertir todos los valores de cada fila en requisito global. Conservar bloqueo de escritura por intervención en la fila objetivo.
- [x] Verificar unitarias y escenarios Firefox del adaptador, y guardar un commit acotado.

## Task 3: Aplicar aislamiento a todos los efectos de entrega

**Files:** `src/delivery.js`, `src/central.js`, `tests/delivery.test.mjs`, `tests/firefox.mjs`.

**Interfaces:** consumir `central.rowBlock` antes de azul, reserva y ACK. Mantener `present` y `fill` con guard antes y después de cada efecto. Una suspensión local mantiene bloqueadas en la época actual la principal y las dependientes potencialmente afectadas; se reevalúa únicamente tras nueva carga nativa. `context_changed` y 401 siguen siendo interrupciones globales.

- [x] Escribir prueba de tres loterías: A falla por campos, B se reserva/llena/presenta y C ya procesada hace ACK de persistidos. Comprobar cero peticiones de reserva/ACK para A.
- [x] Añadir fallo de retención en A seguido de entrega válida B: conservar intervención ajena, sin rollback ni presented de A. Suspender también sus dependientes; impedir reintento con la misma época. Un cambio de fecha durante A sí cancela B.
- [x] Añadir PROC verde con edición local: enviar solo los campos administrados persistidos, incluso sin resultado del proveedor. Sin owned_fields utilizables y sin expected_fields, omitir ACK con motivo explícito en vez de inferir posesión desde todos los inputs.
- [x] Mantener reserva expirada/revisión obsoleta y retry de presented sin reescribir; reevaluar la fila tras cada await. El azul se retira de una fila no verificada y se conserva en filas válidas durante filtros/remontajes.
- [x] Ejecutar `node --test tests/delivery.test.mjs` para evidenciar rojo. Implementar aislamiento y sustituir la invalidación global por fallo local de retención cuando el contexto y estructura generales sigan íntegros.
- [x] Ejecutar unitarias y Firefox; guardar un commit acotado.

## Task 4: Diagnóstico y prueba completa del caso del usuario

**Files:** `src/main.js`, `src/delivery.js`, `tests/runtime.test.mjs`, `tests/firefox.mjs` y fixture si hace falta.

**Interfaces:** preservar claves actuales de diagnóstico; añadir `filas_verificadas` para filas Mango autorizadas por sus pruebas, `incidencias_tabla` y `incidencias_tabla_total` para diferencias nativas ajenas. `omitidas` sigue describiendo operaciones Mango. Listas nuevas de máximo 20, copias defensivas y limpieza por contexto. `matched` sigue siendo solo identidad.

Clasificar incidencias de toda la tabla al estabilizar una carga nativa nueva; no volver a leer todas sus casillas cada segundo para mantener ese diagnóstico. Las operaciones releen solo sus objetivos y efectos relacionados.

- [x] Agregar escenario del instalador completo: tabla contiene RHOD-MD incompatible, servicio Mango solo REAL y ANG-8PM. Exigir contexto verificado, token válido, azul en ambas filas, dos llenados retenidos, ningún envío que incluya Rhode Island y diagnóstico local sin bloqueo general.
- [x] Agregar diagnóstico con 25 incidencias: total 25, lista 20, sin credenciales ni IDs de reserva; nueva fecha limpia registros. Consultar diagnóstico no genera solicitudes ni altera permisos.
- [x] Verificar que `filas_verificadas` no confunda coincidencias con autorizaciones ni contenga filas que fallaron después del match. Propósitos y campos discrepantes se pueden inspeccionar sin exponer respuesta completa.
- [x] Ejecutar escenarios en rojo, implementar diagnóstico y ejecutar en verde. Guardar un commit acotado.

## Task 5: Verificación y preparación de la versión

**Files:** `metadata.json`, `package.json`, `package-lock.json`, `README.md`, `CHANGELOG.md`, `GUIA-CONTINUIDAD.md`, `docs/compatibilidad.md`, `docs/verificacion.md`, diseño vigente y generados por build.

- [x] Inspeccionar main antes de fijar número de versión; usar 0.1.8 únicamente si sigue disponible. Documentar que la prueba general no certifica por sí sola todas las filas.
- [x] Ejecutar `npm run build`, `npm test`, `npm run check` y `git diff --check`; exigir cero fallos y conservar los archivos históricos. La suite incluye Firefox real, picks por componentes, filtros, 241 filas, intervención y sandbox/exportFunction.
- [x] Revisar que ninguna ruta de azul, fill, presented o ACK puede usar una fila sin verificación local adecuada; ninguna excepción local se convierte accidentalmente en autorización global. Revisión de código previa a publicación.
- [x] Actualizar documentación con resultados reales y límites; no afirmar causa histórica de RHOD-MD ni certificar Tampermonkey del usuario mediante mocks.
- [x] Preparar commit solo de Mango-react. Publicar únicamente dentro de la autorización de implementación/entrega posterior, sobre main actual y sin force; comprobar instalador/meta/histórico raw contra los probados. La publicación se realiza después de pruebas y revisión.

## Revisión del plan

Cobertura: contexto general (tarea 1), campos propios y efectos/dependencias (2), continuidad y ACK/retención (3), diagnóstico/instalador completo (4), regresiones y entrega reproducible (5). Las políticas globales antiguas de igualdad de valores se reemplazan deliberadamente en sus tests; no eliminar pruebas negativas de fecha, servidor, permisos ni persistencia. Los nombres de interfaz anteriores deben mantenerse coherentes entre tareas.

La revisión final encontró dos problemas importantes y un detalle diagnóstico, corregidos mediante regresiones: alcance asíncrono de efectos y ampliación de prueba parcial, más propósito de verificación. `central.presentationBlock(code,expected,snap)` valida la referencia retenida de efectos antes de informar presented. La cesión MessageChannel para dependientes cambia deliberadamente la expectativa interna del foco intermedio; la prueba protege la restauración final y los datos.
