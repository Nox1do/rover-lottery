# Cambios

## 0.1.8 — 2026-10-28

- Separa la fecha/servidor de la verificación de cada lotería, siguiendo el flujo por fila de Mango Rover v2. Las diferencias de Rhode Island o de otra fila ajena ya no bloquean entregas independientes.
- Comprueba campos administrados y efectos nativos de picks/reglas antes de operar; conserva persistencia, ediciones locales, identidad única y atribución de dependientes propias. Código/PROC/campos incompatibles quedan aislados a operaciones relacionadas.
- Un llenado no retenido suspende principal y dependientes hasta otra carga nativa, sin rollback ni presented; otras filas pueden continuar. Fecha/servidor/permisos y autenticación siguen suspendiendo globalmente.
- ACK limitado a campos administrados y datos nativos procesados; si el contrato no identifica campos, se omite sin inferirlos del resto de inputs.
- Revalida reglas y efectos antes/después de entradas y antes de presented; conserva cambios en dependientes durante la operación. En filas con dependientes, cede la cola nativa entre entradas sin pausa fija por campo y restaura el foco final.
- Una prueba parcial acredita únicamente diferencias propias; los campos nuevos que coinciden directamente con persistencia pueden continuar.
- Diagnóstico con filas verificadas, motivos locales y hasta 20 incidencias nativas ajenas a las coincidencias Mango, además del total. Abrirlo no consulta ni modifica datos.

## 0.1.7 — 2026-10-28

- Conserva la referencia persistida ya verificada al suspender Mango por configuración, pausa/reanudación o rechazo de autenticación. Evita que una edición local pendiente como RHOD-MD pierda su baseline y bloquee la siguiente carga de toda la tabla.
- Reutiliza la suspensión de Buscar: invalida permisos y reservas de contexto, conserva el motivo original y exige una nueva respuesta nativa del mismo contexto con persistencia intacta antes de reanudar. No reutiliza la caché Mango ni convierte ediciones desconocidas en resultados guardados.
- Regresiones completas con cambio remoto de configuración y pausa/reanudación: RHOD-MD conserva su edición, la otra fila recupera azul y se entrega tras una reserva nueva; no hay consultas antes de Buscar ni ACK de la edición pendiente.

## 0.1.6 — 2026-10-28

- Corrige el bloqueo reproducido al recibir los picks de New York por separado: los valores calculados por Central en las dependientes durante el primer llenado ya no impiden completar el siguiente pick.
- Atribuye únicamente efectos que coincidan con la proyección de las reglas nativas después de una escritura propia retenida. Exige misma principal, servidor, fecha, reglas, valores y baseline persistido; las reglas desconocidas no autorizan reutilización. Central sigue calculando todas las dependientes.
- Conserva la protección ante edición/limpieza manual, otros scripts, otra principal con la misma dependiente, cambio de reglas, valores ajenos, filas ausentes y procesadas. Las dependientes propias también cuentan como trabajo local al verificar una nueva respuesta de Buscar.
- Regresiones de ambos órdenes de llegada, Buscar entre componentes, entrega completa con dos revisiones Mango y pruebas de reglas/atribución. No requiere F5 para la secuencia reproducida.

## 0.1.5 — 2026-10-27

- El diagnóstico informa las filas omitidas y la condición que impidió reservar o llenar: reglas/revisión no recibidas, edición local, conflicto, valores incompatibles, dependientes o falta de autorización del servicio.
- Conserva hasta 20 respuestas de conciliación, una por lotería y fecha, con hora y etiquetas de acción/motivo. No copia respuestas completas, tokens ni identificadores de otras PCs u operaciones. Se limpia al cambiar de fecha.
- Mantiene las decisiones de llenado y el protocolo existentes. Esta entrega instrumenta el fallo de Quinielón PM: el usuario lo llenó manualmente; la lectura posterior no permite acreditar la causa anterior.

## 0.1.4 — 2026-10-27

- Agrupa las entradas de una fila mediante microtareas, sin las pausas de 35 ms entre casillas. Conserva la espera final de verificación y los cálculos nativos de picks/dependientes.
- Mantiene controles de contexto, reserva e intervención entre entradas. Una intervención posterior al bloque pero anterior a la comprobación final impide `presented` y el verde; no revierte cambios ajenos.
- Evita releer los valores de toda la tabla en cada guard de un contexto ya verificado; una nueva respuesta sigue exigiendo la comparación completa. Conserva foco/scroll incluso si una reserva falla antes de los temporizadores de foco nativos.
- Pruebas de frames y foco con 3/241 filas, tabla completa/filtrada, intervención entre entradas y tardía, y una segunda prueba de intervención en la extensión aislada de Firefox.

## 0.1.3 — 2026-10-27

- Compara los códigos nativos de resultados, tabla, dependientes y revisiones con el mismo recorte de espacios exteriores. Corrige el bloqueo reproducido con una fila `BRAZIL03PM` cuyo código recibido tiene espacios, sin alterar números ni identificadores en Central.
- Rechaza códigos vacíos y colisiones tras el recorte; conserva diferencias internas, PROC, campos persistidos y protección del trabajo local.
- El diagnóstico identifica la fila y la condición que no permiten verificar la tabla, en lugar de conservar el mensaje genérico de carga después de recibir la respuesta.
- Añade siete regresiones unitarias y cinco escenarios Firefox, incluidos 118 filas, consulta/azul, llenado NICA/LA DIARIA, conflictos y dependientes con códigos rodeados de espacios.

## 0.1.2 — 2026-10-27

- Restaura el azul de vigilancia al volver a mostrar una fila filtrada, incluso si el filtro dejó la tabla vacía o hay una consulta pendiente.
- La actualización visual usa los datos ya recibidos y el contexto verificado; no espera al siguiente sondeo ni provoca consultas, reservas, llenados o ACK. Omite campos con números, coincidencias ambiguas y estados procesados; elimina indicadores obsoletos.
- Libera referencias a inputs desmontados y conserva el plazo original del verde. Se añaden seis escenarios Firefox y una regresión unitaria para filtros, intervención manual, contexto, estados finales y duración de indicadores.

## 0.1.1 — 2026-10-27

- Reconoce los iconos PROC actuales de Central (`circle-check` y `check-circle-2`), conservando los nombres anteriores. Las filas procesadas ya no impiden verificar la carga y consultar Mango.
- Mantiene el bloqueo ante PROC desconocido, la distinción con Status y el uso de valores persistidos para reconocer una publicación.
- Fixture actualizada y seis regresiones Firefox: variantes de iconos, tabla de 14 filas con 13 procesadas e icono desconocido. El escenario del userscript completo incluye ahora una fila procesada.

## 0.1.0 — 2026-10-27

- Variante independiente Mango para Central React, Firefox/Tampermonkey y PRINCIPAL.
- Contexto verificado mediante lectura nativa, tabla y servidor; bloqueos ante carreras de fecha/carga.
- Llenado compatible con React, picks y dependencias; conservación de intervención manual.
- Confirmación de valores realmente publicados, incluso resultados manuales sin proveedor oficial.
- Menús, token privado, diagnóstico, colores y actualización propia.
- Pruebas locales con React, Firefox y contexto aislado de extensión.
