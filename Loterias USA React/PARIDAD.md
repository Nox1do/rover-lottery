# Paridad: USA 0.6.7 y USA React 0.0.4

Comparación del script original `../Loterias USA/Rovs-Loterias-USA.user.js` (0.6.7) con la variante React publicada 0.0.3. La recuperación se entrega en 0.0.4.

## Funciones recuperadas

| Función anterior | React 0.0.3 | Recuperación 0.0.4 |
| --- | --- | --- |
| Verde suave en los campos llenados | Faltaba; solo había estado en el botón | Verde #d1fae5 y texto #065f46: 1 s visible y 1 s de desvanecimiento; vuelve al color del tema |
| Números llenados en negrita | Faltaba | Marca Pick 3/4 y premios derivados confirmados; limpia al editar la fila o cambiar el contexto |
| Acentos distintos Día/Noche | Faltaban | Azul para Día y ámbar para Noche, en borde y categoría activa, con contraste para tema oscuro |
| Banderas de los botones | Se eliminaban del nombre visible | Se conserva el nombre completo configurado con su bandera |
| Orden por columnas y navegación horizontal | Cambió a filas y desplazamiento vertical | Dos filas compactas y scroll horizontal en escritorio; más filas al ampliar; móvil sigue vertical |
| Advertencias naranjas frente a errores rojos | Ambos usaban el mismo color | Advertencia ámbar/naranja, error rojo y éxito verde |
| Detalle de fecha y sorteo al pasar el cursor | Faltaba el sorteo | Fecha, sorteo, estado y fuente en el título del botón |
| Registros con hora/sorteo y nombres de cada proveedor | Faltaban hora/sorteo y se usaban etiquetas genéricas; no se registraban pendientes/errores | console.table por consulta con hora, fecha, código, fuente, sorteo, juegos propios del proveedor y estado; console.error para errores |

El verde se aplica después de que Rover conserve los valores. Un parcial Pick 3 marca solo Pick 3 y 1era; un parcial Pick 4 marca solo Pick 4, 2da y 3ra. No se marcan valores ausentes, filas ajenas o resultados rechazados. Las dependientes mantienen el autollenado nativo; no se añaden escrituras ni marcas a filas ajenas. La preferencia de movimiento reducido conserva la confirmación verde y omite el desvanecimiento gradual.

## Funciones contrastadas y conservadas

- Las 75 configuraciones mantienen nombre, categoría, fuente, sorteo, URLs y orden del original. La variante añade el código exacto de Rover.
- Se contrastaron las 41 funciones de proveedores/transporte: idénticas al original salvo espacios. No se perdieron fuentes ni sus planes de respaldo.
- Se mantienen Pick 3 y Pick 4, ceros iniciales, resultados parciales, Washington estado solo Pick 3, spinner y estados, buscador y versión instalada, consultas manuales y enlaces de actualización.
- Se conservan ancho completo compacto, ajuste por bordes, tipografía 4K, controles móviles, tema claro/oscuro y navegación SPA.

## Adaptaciones intencionales a React

- La fecha requiere Buscar y carga terminada. No se recupera el respaldo a «hoy» cuando no se puede confirmar la fecha de la tabla.
- La fila se identifica por nombre y código exactos, en lugar de coincidencia parcial de texto.
- Se actualizan Pick 3/4 mediante el evento de entrada nativo de React; Rover deriva 1era/2da/3ra y dependientes. No se copian las escrituras duplicadas ni los eventos change/blur del DOM anterior.
- Durante la consulta se deshabilita el botón para evitar duplicados; las escrituras de distintas loterías se ordenan en una cola.
- La publicación sigue siendo manual. No se llaman APIs de Rover ni se pulsa Procesar.

## Verificación

Inventario de referencia en `tests/fixtures/legacy-inventory.json`. Pruebas de proveedores y Firefox con React controlado: cinco campos verdes, fin del efecto sin alterar colores, repetición del efecto, edición manual, parciales de ambos tipos, cambio de contexto, banderas/acentos/orden y diagnósticos de éxito/pendiente/error, además de los casos previos de fecha, identidad y tamaños.

Las pruebas usan una reproducción aislada y un puente GM simulado. No sustituyen una comprobación de Tampermonkey en la sesión real.
