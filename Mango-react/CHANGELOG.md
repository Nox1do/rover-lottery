# Cambios

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
