# Rovs Loterias USA React 0.0.1

Versión independiente solicitada para `/loteria/resultados/ver`. Conserva las 75 loterías, fuentes y orden de Rovs Loterías USA 0.6.7; el script anterior no se modifica. La interfaz se implementa con JavaScript vanilla, variables visuales del nuevo Rover y barra inferior con botones manuales. No agrega React al producto.

## Decisiones

- Carpeta `Loterias USA React`, nombre `Rovs Loterias USA React 0.0.1`, URLs propias de instalación y actualización.
- Módulos separados de configuración, proveedores, adaptador de tabla, interfaz y controlador; un build sin dependencias de ejecución genera el userscript.
- Identidad exacta por nombre y abreviatura, y campos identificados por encabezados. Inventario observado: 241 filas el 24/10/2026; coincidencia única de las 75 loterías.
- La fecha solo queda habilitada tras Buscar y finalizar su carga; cambiar calendario, servidor o ruta invalida las consultas anteriores. No inferir hoy ni reutilizar la fecha del sistema anterior.
- Usar el setter nativo y eventos de entrada para actualizar los campos controlados por React. Se conserva el comportamiento nativo observado: derivar 1era/2da/3ra y llenar dependientes. No se escriben campos derivados directamente.
- No llamar APIs de guardado o publicación de Rover, no pulsar Procesar, no interceptar peticiones ni fabricar respuestas. Las únicas peticiones del producto son las de proveedores externos ya existentes.

## Ejecución y verificación

1. Escribir pruebas de la barra, identidad, fecha, campos controlados y seguridad, y comprobar el fallo sin la adaptación.
2. Extraer sin cambios los proveedores del script base; construir la nueva barra y el adaptador.
3. Ejecutar pruebas con React 19.3.1 en una reproducción aislada y Firefox de Playwright. Comprobar estado React después de otro render, dependientes, Pick 3 solo, errores, cambio de fecha/servidor, navegación SPA, tema y ausencia de llamadas a Rover.
4. Ejecutar también las 57 pruebas del script anterior. Preparar script, metadatos y copia histórica 0.0.1.
5. Publicar mediante el conector GitHub, conservando cambios remotos ajenos; verificar el contenido publicado.

## Límite de la verificación

La inspección de la sesión real usa Opera solo para lectura. Las escrituras de prueba se realizan exclusivamente en una reproducción local, sin sesión ni datos privados. El puente GM de las pruebas simula las respuestas de proveedores; esto no equivale a instalar Tampermonkey en la sesión de producción.

## 0.0.2 — Barra ajustable y móvil

Petición: ajustar desde bordes, más alta o compacta, móvil y compacta por defecto. Se mantiene JavaScript vanilla, estilo nativo y las fuentes existentes. Se eligen eventos Pointer frente al resize nativo por compatibilidad táctil y control de límites.

- [x] Probar primero en Firefox: tamaño compacto, arrastre real de bordes/esquinas, límites, teclado, móvil y eventos Pointer de tipo táctil.
- [x] Reorganizar `src/ui.js`: cabecera adaptable, cuadrícula con scroll vertical, ocho bordes/esquinas, botón Compactar y controles táctiles. Ajustar al cambiar orientación, sin persistir tamaños grandes entre recargas.
- [x] Ejecutar la suite completa y revisar capturas. Incrementar a 0.0.2 conservando identidad e históricos.
- Publicar y contrastar los archivos raw con los probados.

## 0.0.3 — Ancho completo y tipografía

Referencia: captura del usuario de la barra anterior. Barra compacta de extremo a extremo; controles a la izquierda en escritorio y botones a la derecha; conservar tamaño ajustable y disposición móvil. Tipografía del sistema 14–18 px según ancho CSS disponible, peso 500 y altura de línea 1.4. Respetar escalado del sistema y zoom; no multiplicar tamaños por devicePixelRatio.

1. Añadir pruebas Firefox de ancho completo a 1080p, 4K 100% y 4K con escala 200%, más reajuste de las pruebas existentes.
2. Cambiar solo interfaz/medidas: ancho completo inicial y al Compactar; organización lateral en escritorio, tamaño fluido de texto y controles.
3. Ejecutar suite completa y revisar capturas. Publicar 0.0.3 con los mismos enlaces e identidad; conservar históricos.

## 0.0.4 — Recuperar paridad con USA 0.6.7

Comparar la variante React 0.0.3 contra el script base 0.6.7, sin modificar el proyecto anterior. Recuperar: verde suave durante 1 s y desvanecimiento durante 1 s en los campos confirmados, negrita, acentos Día/Noche, banderas, navegación horizontal por columnas (dos filas compactas, más filas al ampliar), detalles de fecha/sorteo y registros de cada consulta con hora, fuente y nombres reales de los juegos. Mantener móvil vertical y tipografía 4K.

1. Pruebas Firefox rojas de resaltado completo/parcial, limpieza, colores/banderas/orden y registros de éxito/pendiente/error.
2. Módulo de realimentación visual independiente; aplicarlo después de verificar el estado de Rover, sin eventos adicionales ni escritura en APIs. Limpiar ante edición manual o cambio de contexto.
3. Recuperar los elementos de presentación y diagnóstico; contrastar inventario/proveedores, documentar las diferencias intencionales de la adaptación React.
4. Suite completa, capturas, release 0.0.4, revisión de cambios y verificación de GitHub/raw.
