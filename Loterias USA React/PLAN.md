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
