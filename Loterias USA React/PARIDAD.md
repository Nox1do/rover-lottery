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

## Actualización 0.0.5: presentación de avisos

La auditoría de 0.0.4 contrastó las 41 funciones originales. En 0.0.5 se añaden códigos a las excepciones del transporte y de validación para distinguir los avisos; los endpoints, parámetros, parsers y estrategias de consulta se conservan. La presentación usa el catálogo de [ESTADOS.md](ESTADOS.md), sin reutilizar una X para motivos diferentes. Se mantienen verde/negrita y la prueba de inventario de las 75 configuraciones.

## Verificación

Inventario de referencia en `tests/fixtures/legacy-inventory.json`. Pruebas de proveedores y Firefox con React controlado: cinco campos verdes, fin del efecto sin alterar colores, repetición del efecto, edición manual, parciales de ambos tipos, cambio de contexto, banderas/acentos/orden y diagnósticos de éxito/pendiente/error, además de los casos previos de fecha, identidad y tamaños.

Las pruebas usan una reproducción aislada y un puente GM simulado. No sustituyen una comprobación de Tampermonkey en la sesión real.

## Actualización 0.0.11: mensajes en consola y menú más bajo

Por petición del usuario se retira el pie de mensajes. Se conservan iconos individuales, etiquetas accesibles, tooltips e informes de consola; la carga/confirmación de fecha también se registra con console.info. La reducción de 2 px de los botones conserva el tamaño de las letras. La barra compacta baja a 144–168 px en escritorio y 242 px en móvil; los botones táctiles bajan de 44 a 42 px según lo solicitado. Se mantienen el anclaje inferior y la fila visible por encima de la barra.

## Actualización 0.0.12: rendimiento

El verde se conserva con Web Animations (1 s fijo y 1 s de desvanecimiento; movimiento reducido 1 s sin transición) para reiniciarlo sin forzar medidas de los inputs. Se mantiene la negrita y limpieza de marcas. El índice de filas solo evita búsquedas repetidas: no elimina controles de fecha, identidad, duplicados o bloqueo ni cambia las entradas nativas de React o los proveedores. La fila sigue mostrándose sobre la barra y el tamaño/tipografía permanecen iguales.

## Actualización 0.0.13: confirmación fija y llenado consecutivo

El verde suave se conserva durante un segundo, con retirada directa. Se elimina intencionalmente el segundo de desvanecimiento para evitar animar los colores de cinco inputs dentro de la tabla. La negrita se conserva y se limpia al editar/cambiar el contexto. El foco sigue en Pick 4; se prepara sin scroll antes del llenado para que la llamada posterior de Rover al mismo campo no vuelva a mover la vista. Los picks iguales siguen vaciándose y reintroduciéndose con eventos nativos, pero sin ceder una tarea entre esos pasos. Solo se cede al terminar ambos picks, antes de verificar que React conserve el resultado.

## Actualización 0.0.14: recálculo sin vaciar picks de texto

Sigue permitiéndose volver a llenar aunque haya datos, incluidos picks iguales y premios/dependientes incorrectos. Bajo el normalizador nativo verificado, un espacio final temporal provoca el evento de cambio y Central conserva el número canónico, con un recálculo por juego. No se omite la fila porque sus cinco campos coincidan: también debe poder actualizar sus dependientes. Si el formato no se normaliza, se restaura el número inmediatamente; para otros tipos de input se conserva el vaciado/reentrada anterior. La verificación tras el render impide confirmar valores con formato retenido o premios incorrectos. Los proveedores siguen consultándose de nuevo, sin caché.

## Actualización 0.0.17: fila inicial aprobada

Cambio intencional de presentación: el inicio compacto pasa de dos filas a una, con controles en la misma línea y versión en el placeholder. Más altura sigue mostrando más loterías. El orden de configuración se conserva; la barra estrecha ampliada usa cuadrícula vertical y la compacta horizontal. Se conservan los 75 sorteos, fuentes, entrada nativa, colores, estados, accesibilidad, móvil táctil, zoom y controles de tamaño. La versión procede de GM_info y, si falta, del script.

## Actualización 0.0.18: conservar contexto verificado

La identidad del servidor se obtiene de su etiqueta, excluyendo contadores de fallos ajenos. La ausencia temporal de controles no equivale a otra fecha: suspende el llenado y solo permite recuperar la misma tabla/contexto ya acreditados. Los cambios reales, otra tabla durante la pausa, navegación y un nuevo Buscar mantienen las protecciones. No se toma la fecha visible por sí sola como prueba de una carga inicial ni se consultan APIs internas.
