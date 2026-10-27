# Rendimiento de consulta — 0.0.12

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
