# Rendimiento de consulta — 0.0.14

## Diagnóstico real de 0.0.13, 27 de octubre

Las mediciones del usuario permiten separar la fase de consulta de la actualización de Central. Son muestras, no un benchmark estadístico ni una medición pura de red GM.

| Consulta | Filas en DOM | Fuente (ms) | Cola (ms) | Formulario (ms) | Total (ms) | Mayor pausa entre frames (ms) |
| --- | --- | --- | --- | --- | --- | --- |
| Florida Midday, primera muestra filtrada | 3 | 617 | 0 | 22 | 641 | 32 |
| Florida Midday, segunda muestra filtrada | 3 | 374 | 0 | 21 | 396 | 21 |
| Florida Midday, tabla ampliada | 89 | 400 | 1 | 287 | 691 | 292 |
| Indiana Midday | 89 | 1620 | 0 | 184 | 1806 | 228 |
| Tennessee Midday | 89 | 877 | 0 | 179 | 1059 | 216 |

La comparación Florida 374/21 frente a 400/287 muestra un incremento concentrado en el formulario al tener más filas, con consulta de duración parecida. Cada evento input observado pasa de 2–3 ms a decenas de ms. No permite atribuir todo ese trabajo exclusivamente a React: incluye sus manejadores nativos y otros oyentes de la página. Indiana y Tennessee tienen además una espera importante en la fuente. La cola de llenado no explica las muestras.

En las cinco consultas los picks ya coincidían y el adaptador generaba cuatro eventos: vaciar/reintroducir Pick 3 y vaciar/reintroducir Pick 4. La pausa grande coincide con ese trabajo. El snippet no pudo capturar la consola del sandbox (`internalTimings: null`), pero el usuario adjuntó las tablas originales del userscript; por eso sí se dispone de las fases internas. `gmNetworkMs: null` no significa que la red tardara cero.

## Cambio acotado en 0.0.14

Se revalidó el bundle público `/assets/VerResultados-BayYOelt.js`: el manejador usa `a.replace(/[^A-Za-z0-9]/g, "").slice(0, t)` antes de calcular premios/dependientes y programar el foco. Una entrada de texto con el mismo pick más un espacio final se normaliza al pick original, pero activa el cambio de React. Permite repetir el cálculo con **un evento por juego**, sin vaciar previamente el campo. Si el valor no queda normalizado, el adaptador restaura inmediatamente el número canónico mediante otra entrada; otros tipos de input conservan la ruta anterior.

Las regresiones de repetición verifican dos eventos para resultado completo y uno para cada parcial o Pick 3 solo, valores exactos después de otro render y dependientes actualizadas incluso cuando los cinco campos principales ya estaban correctos. También se prueba un manejador que no elimina el formato. El foco se prueba sobre el valor normalizado, igual que en Central.

Esto reduce entradas y cálculos nativos redundantes en el llenado repetido. **No modifica las solicitudes ni añade caché; no promete eliminar los 374–1620 ms observados en la fase de fuente.** Tampoco demuestra un porcentaje de mejora de latencia en Windows: falta una medición posterior del usuario. La comparación con la versión clásica 0.6.7 sigue siendo cualitativa; no hay un registro pareado de sus tiempos de consulta en estas muestras. El diagnóstico de consola sigue siendo compatible y puede repetirse con la tabla completa tras actualizar.

# Historial: medición de 0.0.13

## Corrección tras la prueba real de 0.0.12

El usuario informa que 0.0.12 se siente igual de lento. Sus menores recorridos no resolvieron el síntoma: no se presenta esa entrega como una reducción acreditada de latencia. Se vuelve a contrastar el código público de Rover el 27 oct: `/assets/VerResultados-D5ODL1lu.js` conserva el temporizador de foco en Pick 4 desde el manejador de Pick 3.

La regresión `Fluidez: foco nativo ve el llenado completo` observa los valores justo cuando se ejecuta ese foco, sin simular la respuesta de React. En 0.0.12, con 241 filas, se observó `[27, '', '', 027, '']` en el primer llenado y `[27, 22, 33, 027, 0987]` en la repetición: el segundo pick o sus premios aún no se habían recalculado. Las pausas entre entradas permiten mostrar estados intermedios y ejecutar el foco en medio del llenado. En 0.0.13 se observa `[27, 09, 87, 027, 0987]` en ambos casos, conservado después de otro render. El foco programado no cambia los scrollports. La suite completa detectó además que reducir el alto del viewport no reajustaba la fila cuando la barra mantenía sus 242 px: observar el tamaño de la barra no detecta un cambio solo de posición. Se añaden eventos de resize de ventana/viewport y de cambio de offset visual, coalescidos por RAF. El scroll manual normal de la página no activa ese seguimiento.

| Comportamiento | 0.0.12 | 0.0.13 |
| --- | --- | --- |
| Cesiones de tarea por llenado completo inicial / repetido | 2 / 4 | 1 / 1 |
| Valores al ejecutar el foco programado de Rover | Parciales o premios antiguos | Ambos picks y premios completos |
| Animaciones de color por llenado completo | 5, con desvanecimiento continuo | 0, verde fijo 1 s |

Se mantienen todos los eventos de entrada y renderizados que ejecuta el propio Rover. Esta versión no utiliza APIs privadas de React ni modifica sus manejadores, no filtra automáticamente la tabla y no elimina filas para acelerar el llenado. Preparar el foco mediante la API DOM estándar evita el desplazamiento nativo adicional; no se sustituye `focus`. La posición sobre la barra sigue gestionada por el módulo de visibilidad.

El informe existente de consola añade tiempos en milisegundos para fuente externa, espera en la cola de llenado, formulario y total hasta confirmar el resultado. Los errores/pending también registran las fases disponibles. Estas medidas distinguen tiempo de proveedor y de escritura JS; **no miden tiempo de rasterizado ni certifican la fluidez de Firefox/Tampermonkey en Windows**. El movimiento y el renderizado real deben contrastarse en ese equipo si persiste la lentitud. No se promete un porcentaje de mejora a partir de esta reproducción.

```sh
TEST_FILTER=Fluidez ROVS_FIREFOX_CONTAINER=1 node tests/firefox.cjs
```

# Historial: medición de 0.0.12

El objetivo es reducir el trabajo del userscript al consultar una fila fuera de pantalla con la tabla completa. Se conserva el foco nativo en Pick 4, la verificación de los valores de React, la fila por encima de la barra y el verde temporal. No se modifica el renderizador de Rover ni se cambia el inventario o los proveedores.

## Reproducción

Firefox 153.0 de Playwright y React 19.3.1 en una página local, sin sesión de producción. `tests/fixture.jsx` puede crear 241 filas con 1205 inputs controlados por React. Georgia Midday queda al final. Se compara esa tabla con la misma reproducción filtrada a una fila. Los proveedores usan el puente GM simulado de la suite; no se llaman APIs de Rover ni se pulsa Procesar.

Las dos pruebas `Rendimiento` realizan tres consultas por escenario: un llenado inicial y dos repeticiones. Comprueban los valores, su conservación tras otro render y que la fila termine por encima de la barra. La instrumentación vive solo en las pruebas: cuenta recorridos `tbody tr`, filas visitadas, lecturas de `offsetWidth` de inputs, llamadas a scroll y pausas entre frames. No se agrega instrumentación al producto.

```sh
TEST_FILTER='Rendimiento' ROVS_FIREFOX_CONTAINER=1 node tests/firefox.cjs
```

El flag de contenedor solo corresponde al entorno Linux restringido. No se usa en el userscript ni en Firefox del usuario.

## Trabajo eliminado

Observaciones de 0.0.11 frente al ajuste, con la misma reproducción:

| Operación por consulta | 0.0.11 | Ajuste 0.0.12 |
| --- | --- | --- |
| Recorridos completos, primera consulta | 8 | 1 |
| Filas visitadas, primera consulta con 241 filas | 1928 | 241 |
| Recorridos completos, consulta repetida sin cambiar estructura | 10 | 0 |
| Filas visitadas, repetición con 241 filas | 2410 | 0 |
| Lecturas de ancho de inputs para reiniciar el verde | 5 | 0 |

El índice se vuelve a construir cuando cambia la tabla. Los ceros de la repetición no significan omitir validaciones: cada escritura sigue comprobando fecha/servidor/ruta y que todos los inputs existan y sean editables. También se vacía la cola de mutaciones pendientes antes de reutilizar identidades, de modo que un duplicado añadido y consultado en la misma tarea se rechaza.

## Cambios

- `src/rover.js`: índice por nombre normalizado y código exacto. Se invalida ante cambios de estructura/texto en la tabla, identidad mediante clases/data-slot, tablas añadidas o tabla desconectada. Los cambios visuales de clase en inputs no rehacen el índice. Se conservan las entradas normales de React y los resultados parciales/repetidos.
- `src/feedback.js`: no modifica clases de un campo si no estaba marcado. Usa una animación reiniciable y cancelable para el mismo verde, con una clave final neutral que devuelve el color del tema. No lee medidas de inputs para reiniciarla. Conserva duración, negrita, limpieza y movimiento reducido.
- `src/visibility.js`: obtiene las medidas antes de ejecutar los scrolls y calcula la posición resultante de la fila sin medir de nuevo después de cada movimiento. Conserva scroll horizontal, encabezado sticky, espacio inferior restaurable y ajuste al tamaño de la barra.

## Límites

Los tiempos y pausas entre frames se imprimen como diagnóstico, sin umbrales absolutos de milisegundos: varían por calentamiento, CPU y renderizados de React. Las muestras no prueban una mejora porcentual de latencia en el equipo del usuario. Sí acreditan la reducción de recorridos, lecturas forzadas y trabajo intercalado del userscript.

Rover sigue renderizando sus propios campos y enviando el foco a Pick 4. El rendimiento de la cuenta real también depende de sus otros userscripts, filas/componentes, zoom, datos y equipo. Esta suite aislada no equivale a una medición de Tampermonkey en Windows 10.
