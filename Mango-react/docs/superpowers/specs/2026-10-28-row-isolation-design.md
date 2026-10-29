# Mango React: validación y fallos por lotería

Diseño aprobado por el usuario el 28/10/2026 para 0.1.8. Su implementación reemplaza la comparación global de campos del diseño anterior.

## Objetivo

Recuperar el flujo de Mango/Rover v2: consultar las loterías que entrega Mango, comprobar cada una y continuar con las demás cuando una no puede entregarse. Una fila ajena, como RHOD-MD, no debe impedir el azul, llenado o ACK de una lotería independiente.

El antecedente se comprobó en Mango/Rover v2.0.13: `runCycle` recorre `response.rows`, `reconcileRow` utiliza campos propios y los errores de cada fila se capturan por separado. En React ese aislamiento ya existe parcialmente en `delivery.cycle`, pero `context.sync` exige coincidencia de todas las filas antes de consultarlo. Además, `central.fill` invalida todo el contexto si no se retiene una escritura.

La diferencia histórica exacta de RHOD-MD no está registrada. No se presupone que el usuario editara esa lotería ni que sus marcadores fueran incorrectos.

## Enfoque propuesto

Separar la prueba general de carga de la autorización de cada operación. Es la continuación del flujo por fila solicitado por el usuario; los detalles siguientes son propuestas técnicas.

Alternativas consideradas:

- Excluir solamente Rhode Island o equiparar X/XX/XXX: no resuelve otras filas y altera el significado de valores sin conocer la causa histórica.
- Copiar literalmente v2 y confiar solo en el calendario y PROC visible: pierde la prueba de respuesta nativa y persistencia necesaria para esta pantalla.
- **Conservar la prueba general y verificar por lotería y efecto:** recomendada. Mantiene el control de fecha/servidor y acota las diferencias a operaciones relacionadas.

## Comportamiento

1. Una respuesta nativa reciente prueba la fecha y el servidor consultados. Solo PRINCIPAL y hoy en America/Santo_Domingo, con permisos, ruta y tabla reconocidas, sin carga, publicación ni diálogos. El calendario por sí solo no habilita nada.
2. Obtener `/version` y `/rows` no exige igualdad de todas las casillas de la tabla. Sigue exigiendo contexto general válido.
3. Para cada fila de Mango, exigir identidad única en API y DOM, entrada persistida nativa inequívoca y PROC compatible. Una fila oculta, ausente o ambigua se omite; no se quitan filtros.
4. Comprobar los campos administrados por Mango y los que la operación lee o modifica mediante reglas nativas. No exigir que cada campo ajeno de toda la tabla coincida. Conservar el bloqueo de escrituras por intervención manual en la fila objetivo.
5. Una diferencia de un campo relevante, una dependencia bloqueada o un error local omite únicamente esa operación. Otras loterías independientes continúan en el mismo ciclo.
6. Una dependencia compartida puede bloquear todas las principales que la afectan; no contamina loterías sin relación. No inventar valores ni publicar dependientes.
7. Azul, llenado, `presented` y ACK deben pasar sus respectivas verificaciones. Un contexto general válido no significa que todas las filas estén verificadas.

## Campos y evidencia

- Los campos administrados proceden de `owned_fields`, con el fallback actual a `expected_fields`; no de una lista fija de loterías.
- Para llenar Pick 3 se incluyen sus efectos nativos en primera; para Pick 4, en segunda y tercera. Las reglas activas añaden las lecturas y escrituras de sus dependientes.
- No equiparar números, ceros iniciales, X, XX o XXX. Mantener la normalización existente de guiones a vacío. Un campo irrelevante no autoriza ni bloquea otra operación; un campo afectado sigue protegido aunque Mango no lo posea directamente.
- Conservar la atribución de escrituras y dependientes propias de 0.1.6. Tener el mismo valor o color no demuestra origen.
- La referencia retenida de 0.1.7 se conserva **por fila previamente verificada**, no por cada fila recibida. Una fila nunca verificada no obtiene confianza porque otra fila sí coincida.
- Separar campos persistidos de la vista actual. El ACK usa únicamente los persistidos de la respuesta nativa y PROC confirmado, nunca valores editados sin guardar. Mantener ACK manual incluso sin resultado del proveedor.
- Una discrepancia API procesado/Central pendiente sigue siendo diagnóstica; no resetea el estado remoto.

## Errores globales y locales

Globales: fecha/servidor/ruta/permisos incorrectos o cambiados, respuesta nativa general inválida, carga o publicación en curso, tabla estructuralmente irreconocible, observador ausente, token rechazado. Suspenden todos los efectos y cancelan operaciones de la época anterior.

Locales: código ausente o duplicado identificable, PROC desconocido o distinto, campos relevantes incompatibles, edición manual, dependencia bloqueada, revisión/reserva inválida de una fila y escritura no retenida. Suspenden esa operación y sus efectos relacionados. Un código duplicado no se resuelve eligiendo la primera fila.

Si una escritura no se retiene, no hacer rollback ni restauración automática. Poner en suspensión la principal y sus dependientes afectados para esa época, cancelar su reserva local y continuar con otras filas. Solo una carga nativa nueva permite reevaluarlas; no basta un nuevo tick. Si se pierde la identidad o estructura general, aplicar suspensión global.

## Diagnóstico

Conservar los campos existentes. `matched` sigue significando coincidencia de identidad, no autorización. Añadir conteo de filas de Mango verificadas y separar incidencias de filas nativas ajenas de `omitidas` de Mango. Registrar código, propósito y campos relevantes con diferencias; no guardar token, respuesta completa ni IDs de operaciones/clientes ajenos. Acotar cada lista nueva a 20 entradas, indicar el total y limpiar al cambiar fecha/servidor/época según corresponda.

Para el caso del usuario, el resultado esperado es: contexto general válido, incidencia local de RHOD-MD si existe, cero operaciones sobre Rhode Island y funcionamiento normal de Real/Anguilla si pasan sus propios controles.

## Restricciones

- Firefox y Tampermonkey; conservar sandbox y contrato Mango 1.0.
- Solo PRINCIPAL y hoy en America/Santo_Domingo.
- Nunca pulsar Procesar ni publicar resultados; no modificar backend, perfiles o fuentes.
- Respetar ediciones y limpiezas manuales, ceros iniciales, dependencias, foco y scroll.
- No añadir frameworks ni dependencias de producción; seguir con módulos JS y build esbuild.
- No sobrescribir históricos publicados; la siguiente versión se decide contra main al implementar.

## Criterios de aceptación

Demostrar en Firefox que RHOD-MD incompatible no detiene a una fila Mango válida; una fila Mango bloqueada no detiene a otra; una dependencia defectuosa bloquea únicamente sus principales; filtros conservan el azul; picks escalonados siguen completándose; un fallo de retención no detiene a una fila independiente; un cambio real de contexto impide cualquier escritura o ACK posterior. Conservar las regresiones de 0.1.1–0.1.7.

## Ajustes de revisión y verificación

La prueba previa se exige únicamente para campos discrepantes que necesiten la excepción por origen local; los campos adicionales que ya coinciden se prueban directamente. La fuente y las dependientes se verifican contra proyecciones intermedias y reglas vigentes entre entradas, tras asentarse y antes de presented; un fallo suspende el grupo afectado.

La cola de React puede contener cambios todavía invisibles tras una sola microtarea. Se cede una tarea mediante MessageChannel entre entradas con dependientes para permitir observarlos antes de otra escritura nativa. Se prioriza preservar ese trabajo sobre la antigua expectativa de que el foco nativo intermedio siempre encuentre ambos picks completos. Se mantiene la restauración final del foco/scroll, la agrupación sin pausas fijas y los tests de frames de filas sin dependientes.
