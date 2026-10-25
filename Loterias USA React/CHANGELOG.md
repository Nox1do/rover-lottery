# Cambios

## 0.0.6 — 2026-10-25

- Sustituye el texto Compactar por un SVG de flechas hacia dentro, con tooltip y nombre accesible «Restablecer tamaño compacto».
- Reduce relleno, separación y anchura de los botones de loterías; las filas ya no se estiran dejando espacio sobrante alrededor del texto.
- Reduce la altura compacta inicial al espacio que necesitan las filas; conserva la tipografía 4K, las dos filas y el tamaño ajustable.
- Mantiene botones táctiles de al menos 44 px en móvil y las funciones existentes de avisos y resaltado.

## 0.0.5 — 2026-10-25

- Sustituye el error genérico compartido por 18 motivos con SVG y etiquetas propios: carga, completo, parcial, pendiente, fecha/contexto, tabla/fila, duplicados, bloqueo, red, timeout, fuente, respuesta inválida, cancelación y llenado no confirmado.
- Muestra el motivo, la lotería y el detalle en el pie de la barra, también en móvil; nombre accesible del botón y estado ocupado. La X queda solo para cerrar.
- Añade códigos de error estables al transporte y al adaptador, sin clasificar por el texto del mensaje ni cambiar endpoints o parsers.
- Centraliza los estados en `src/status.js`, documenta el catálogo en ESTADOS.md y añade pruebas de iconos únicos, mensajes y motivos en Firefox.
- Conserva el verde/negrita, inventario de 75 loterías, tamaño ajustable, tipografía y demás funciones recuperadas.

## 0.0.4 — 2026-10-25

- Recupera el verde suave temporal y la negrita en los campos llenados y confirmados, incluidos los premios derivados; los resultados parciales solo marcan los campos disponibles.
- Restaura acentos Día/Noche, banderas, advertencias naranjas y navegación horizontal por columnas en escritorio, con dos filas compactas y más filas al ampliar.
- Recupera detalles de fecha/sorteo y registros de todas las consultas con hora, fuente y nombres reales de los juegos; restaura diagnósticos de error en consola.
- Separa el feedback visual en un módulo; restaura los colores propios del tema y limpia marcas al editar o cambiar fecha/servidor/ruta. Detecta cambios de texto del calendario y servidor sin esperar otra consulta.
- Añade inventario de referencia de las 75 configuraciones de USA 0.6.7 y auditoría documentada en PARIDAD.md. Mantiene proveedores, llenado React, tipografía 4K y tamaño ajustable.

## 0.0.3 — 2026-10-25

- Tamaño compacto inicial de ancho completo, de izquierda a derecha; Compactar también restaura ese ancho.
- Controles laterales en escritorio, siguiendo la referencia de la interfaz anterior; mantiene la disposición móvil y los bordes ajustables.
- Tipografía del sistema de 14–18 px, peso 500 y altura de línea 1.4 para mejorar lectura en 4K.
- Botones y filas adaptados al tamaño del texto; respeta el escalado del sistema sin duplicar el factor de densidad.
- Pruebas Firefox adicionales a 1080p, 4K y densidad 2, con capturas para revisión visual.

## 0.0.2 — 2026-10-25

- Barra compacta por defecto; ajuste de ancho y alto desde los cuatro bordes y esquinas con ratón o dedo.
- Botón Compactar para restaurar el tamaño inicial, cuadrícula con desplazamiento vertical y más filas al ampliar.
- Controles adaptables al ancho del panel, objetivos táctiles de 44 px y buscador de 16 px en móvil.
- Límites de pantalla y reajuste ante cambios de ventana, orientación o viewport visual; abrir en móvil no activa el teclado.
- Ajuste accesible con flechas del teclado y barra cerrada fuera del recorrido de tabulación.
- Tres pruebas adicionales de Firefox para tamaños, bordes, móvil y límites; se conserva la identidad de instalación y la versión histórica 0.0.1.

## 0.0.1 — 2026-10-25

- Primera variante independiente para la tabla React de Central Rover.
- Barra inferior de estilo nativo, tema claro/oscuro, 75 botones, Día/Noche, filtro y versión instalada.
- Proveedores y orden heredados de Rovs Loterías USA 0.6.7.
- Coincidencia exacta de nombre y abreviatura; campos identificados por encabezados.
- Fecha vinculada por Buscar; bloqueo ante cambios de fecha/servidor/ruta y respuestas antiguas.
- Llenado mediante eventos de entrada que actualizan el estado React; conserva derivación y dependientes nativos.
- Sin APIs internas de escritura, intercepción de peticiones, guardado ni procesamiento automático.
- Pruebas con Firefox y React 19.3.1 en una reproducción aislada, más fixtures de proveedores.
