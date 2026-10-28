# Rovs Loterias USA React 0.0.17

[Instalar en Tampermonkey](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA%20React/Rovs-Loterias-USA-React.user.js)

Userscript independiente para **Firefox + Tampermonkey** en `https://central.roversport.net/loteria/resultados/ver`. Basado en Rovs Loterías USA 0.6.7; conserva sus **75 loterías**, proveedores y orden. No modifica ni sustituye el script del Rover anterior.

## Uso

1. Instala el script desde el enlace anterior y recarga Rover.
2. Selecciona la fecha en Rover y pulsa **Buscar**. La barra confirma la fecha cuando termina la carga. Si ya tenías la tabla abierta al instalar el script, pulsa Buscar de nuevo.
3. Abre **Loterías USA** en la esquina inferior derecha. Arranca en una sola fila a ancho completo, pegada al pie: Día/Noche, buscador, compactar, cerrar y loterías. El buscador del mockup aprobado mide 145.6 px con texto de 14 px (20 % menos que 182 px) y escala con la tipografía. La versión instalada aparece dentro del placeholder cuando está vacío. Arrastra los bordes o las esquinas con ratón, dedo o flechas del teclado para ampliar o reducir. El icono de **flechas hacia dentro** restaura la fila inicial a ancho completo. Las loterías usan desplazamiento horizontal en el tamaño inicial y muestran más filas al ampliar; mantienen el orden de configuración. La altura mínima reserva espacio para scrollbars clásicos de Firefox: 66 px en escritorio a 14 px y hasta 74 px en 4K o táctil.
4. Pulsa la lotería. El script consulta su proveedor y llena Pick 3 y/o Pick 4 en la fila que coincida por nombre **y** abreviatura. Washington estado usa WST-NG y solo Pick 3. Puedes volver a pulsar el botón para reemplazar los datos existentes y recalcular los premios, incluso si Pick 3/4 ya coincide. Si un pick de texto coincide, se reactiva el cálculo con una entrada equivalente que Central normaliza, sin vaciar el campo. Se comprueba que el número final sea exacto; si el manejador no normaliza la entrada, se reintroduce inmediatamente el número canónico. Un resultado parcial conserva los campos del juego que no esté disponible.
5. La fila consultada queda por encima de la barra, teniendo en cuenta su altura actual y el foco automático de Rover. Se reserva espacio inferior mientras la barra está abierta, también en tablas con desplazamiento propio; al cerrarla o cambiar de contexto se restauran los espacios originales. Una fila que ya está visible no provoca desplazamiento adicional.
6. Los campos confirmados se resaltan en verde suave durante un segundo fijo, sin desvanecimiento por frame; quedan en negrita hasta editar la fila o cambiar de contexto. Un resultado parcial solo marca los campos que se llenaron. Revisa los valores. La publicación se sigue realizando manualmente con **Procesar**, desde Rover.

El propio Rover deriva 1era/2da/3ra y puede llenar las loterías dependientes que tenga configuradas, igual que al escribir manualmente. El userscript conserva ese comportamiento y no publica ninguna de esas filas.

En móvil también inicia una fila: las categorías muestran iconos con nombre accesible y el placeholder muestra solo la versión para conservarla legible. Los botones táctiles miden al menos 42 px y abrir no enfoca el buscador para evitar el teclado. Las etiquetas de lotería pueden acortarse visualmente, conservando su nombre accesible; al ampliar una barra estrecha, la cuadrícula pasa debajo de los controles con desplazamiento vertical. El tamaño se limita a la pantalla y se ajusta al girar el dispositivo o cambiar la ventana. Cada recarga vuelve al tamaño compacto; cerrar/abrir conserva el tamaño durante esa página. Los bordes también admiten las flechas del teclado. Al cambiar zoom o ventana la barra se mantiene anclada abajo: conserva el ancho completo si solo ajustaste la altura, o la proporción de ancho que elegiste. La altura elegida se conserva dentro de los límites de pantalla. La base queda pegada al borde inferior, sin margen, también al redimensionar; el ancho excluye la barra de desplazamiento de la página.

La tipografía usa fuentes del sistema (Segoe UI en Windows), peso medio, altura de línea 1.4 y tamaño adaptable de 14 a 18 px según el ancho CSS disponible. En una ventana 4K al 100 % llega a 18 px; con escalado del sistema al 200 % se respeta el tamaño que ya aplica el navegador, sin multiplicarlo otra vez por la densidad. Restablecer tamaño compacto devuelve también el ancho completo. Los botones de escritorio usan filas de 34–42 px según el viewport, manteniendo el tamaño y altura de línea del texto, sin estirarse para ocupar el espacio sobrante. En móvil conservan botones de al menos 42 px.

La barra usa JavaScript vanilla y los colores, tipografía y variables del nuevo Rover, con tema claro/oscuro. «React» en el nombre identifica el sistema de destino; el producto no descarga ni monta una segunda copia de React.

## Paridad con la versión anterior

Consulta [PARIDAD.md](PARIDAD.md) para ver la comparación con USA 0.6.7. Se recuperaron el verde temporal, la negrita, los acentos Día/Noche, las banderas, la navegación horizontal, el naranja de advertencias, el detalle de sorteo y los registros completos. Cada consulta muestra en consola la hora, fecha, sorteo, fuente, código y nombres propios del proveedor (Cash 3/4, Daily 3/4 o Pick 3/4), también si no hay resultado o falla.

El inventario de pruebas contrasta las 75 loterías contra una copia de la configuración original 0.6.7 para detectar pérdidas de sorteos, fuentes, URLs u orden. Las funciones de proveedores/transporte se contrastaron con el original y no cambiaron. Las mejoras de tamaño, móvil, 4K y protección de fecha se conservan.

## Avisos claros

Cada motivo tiene su propio SVG y etiqueta, definidos en `src/status.js`: ver [ESTADOS.md](ESTADOS.md). Los botones conservan sus indicadores, tooltip y etiqueta accesible. Los mensajes de fecha/carga y el detalle de llenado se registran en la consola; la barra ya no tiene un pie de mensajes. Desde 0.0.17 la fila compacta ocupa 66–74 px, incluyendo la reserva de scrollbar. La X queda únicamente para cerrar la barra.

Los errores llevan un código estable desde el transporte, la validación o el adaptador; no se clasifican por coincidencias del texto. La fecha sin confirmar, fila no visible, campos bloqueados, timeout y error de red ya no comparten un «error» genérico. Estos códigos no cambian los endpoints, consultas, parsers, guardado ni el llenado de Rover.

## Fecha y disponibilidad

Cambiar calendario, servidor o volver a pulsar Buscar invalida las consultas anteriores. No se toma la fecha de hoy como respaldo. Una fila oculta por el filtro de Rover o todavía no habilitada por su horario no se llena: elimina el filtro o revisa la fecha en Rover y vuelve a consultar.

El script no realiza llamadas a APIs internas de Rover, no guarda ni procesa resultados, no intercepta sus peticiones y no fabrica respuestas. Solo consulta los proveedores externos heredados del script base.

## Versiones y mantenimiento

La versión instalada aparece en el placeholder del buscador vacío; al escribir desaparece el placeholder y vuelve al borrar el filtro. La etiqueta accesible conserva la versión durante la búsqueda. Las URLs `.user.js` y `.meta.js` de esta carpeta son estables y permiten actualizaciones de Tampermonkey. El `@name` inicial es exactamente `Rovs Loterias USA React 0.0.1`; se conserva como identidad de instalación para evitar copias duplicadas. El número instalado se obtiene de `GM_info.script.version`.

`src/config.js`: loterías y códigos; `src/providers.js`: fuentes y parsers; `src/rover.js`: fecha, identidad y escritura del formulario; `src/ui.js`: barra; `src/status.js`: catálogo de estados, SVG y códigos de error; `src/feedback.js`: resaltado y limpieza visual; `src/visibility.js`: espacio de la barra y posición visible de la fila; `src/main.js`: consultas manuales y estados. `tools/build.cjs` genera un único userscript sin dependencias de ejecución.

## Rendimiento con la tabla completa

Desde 0.0.12 se reutiliza un índice de filas por nombre/código en vez de recorrer toda la tabla durante cada validación del llenado. Se invalida al cambiar su estructura, cabeceras o identidad de filas, incluidos los cambios todavía pendientes de entregar al MutationObserver. Las validaciones de fecha, duplicados y campos bloqueados siguen activas. El desplazamiento mide primero y aplica después los movimientos, sin alternar lecturas/escrituras por cada contenedor.

En 0.0.13 se eliminan las pausas entre entradas: Pick 3/4 y sus premios se completan antes de ejecutar los temporizadores de foco de Rover. Se prepara Pick 4 con `focus({preventScroll:true})` para que el foco nativo posterior no desplace de nuevo la tabla. Esto conserva los cambios nativos de React, incluidos los dependientes; no evita que Rover renderice su propia tabla por cada entrada. El verde es ahora fijo durante un segundo y se retira directamente: se elimina el desvanecimiento continuo para reducir repintados. Se conserva la negrita y la limpieza al editar/cambiar de fecha.

En 0.0.14, repetir una consulta con ambos picks iguales pasa de cuatro a dos eventos de entrada bajo el normalizador actual de Central. Conserva el recálculo de premios y dependientes incluso si la principal ya coincide; no es un salto del llenado. Los tipos que no sean `text` conservan la ruta de vaciado/reentrada. No cambia consultas ni añade caché. Ver [RENDIMIENTO.md](RENDIMIENTO.md) para los tiempos reales que separan la consulta del formulario.

El informe de consola añade **Fuente (ms)**, **Cola (ms)**, **Formulario (ms)** y **Total (ms)**. Permite distinguir la espera del proveedor de la escritura; no mide el tiempo de pintura de la GPU ni garantiza la fluidez del equipo real.

Para registrar automáticamente un clic móvil, eventos de llenado, verde, scroll y pausas de la página sin modificar el userscript, usar el [snippet de diagnóstico de consola](diagnostics/README.md). Indica expresamente si no puede observar los tiempos internos desde el sandbox de Tampermonkey; no presenta la espera previa al llenado como una medición de red GM.

La reproducción incluye 241 filas reales de React (1205 inputs controlados) y una fila filtrada, con llenado inicial y repetido. Ver [RENDIMIENTO.md](RENDIMIENTO.md) para el método, contadores y límites: los tiempos de la reproducción no garantizan la fluidez de la sesión real de Rover.

## Pruebas reproducibles

Con Node.js 18 o superior, desde esta carpeta:

```sh
npm ci
npx playwright install firefox
npm run build
npm test
npm run release
npm run check
```

En este trabajo se probaron **Firefox 153.0 de Playwright y React 19.3.1**, la versión observada en el código público de Rover. La reproducción incluye campos controlados, derivación de premios y una dependencia de prueba. Se comprueba el estado React después de otro render, además de los valores visibles. La reproducción incluye el foco automático en Pick 4 observado en Rover. También se prueban filas al final de una página larga o un scroll anidado con encabezado fijo, barra ampliada, cambio de viewport móvil, reapertura/limpieza y ausencia de saltos si la fila ya es visible. La suite incluye arrastre real con ratón, ajuste por teclado, viewport móvil de 390 × 844, ancho completo a 1920 × 1080 y 3840 × 2160, contexto con densidad 2 simulando 4K al 200 %, cambios de orientación/ventana, pulsaciones táctiles y eventos Pointer sintéticos de tipo touch para el redimensionado. No equivale a probar el gesto sobre un teléfono físico.

Los resultados de proveedores se simulan mediante un puente GM de prueba. Las pruebas de navegador no instalan la extensión Tampermonkey ni usan una sesión de producción: esto valida el adaptador en Firefox y React, pero no equivale a una prueba completa de la extensión sobre tu cuenta de Rover. Para confirmar en la sesión real, consulta una fila, revisa los cinco campos, cambia el filtro de la tabla y vuelve a mostrarla; comprueba que los valores se conservan antes de procesar.

En contenedores Linux que no permiten los namespaces requeridos por el sandbox interno de Firefox, las pruebas locales aceptan `ROVS_FIREFOX_CONTAINER=1 npm test`. Esta opción ajusta únicamente el navegador de la reproducción aislada y no forma parte del userscript.

Los fixtures de Georgia, Illinois y Washington conservan los datos públicos usados por las pruebas del proyecto base; las fechas de captura aparecen en los originales y en sus encabezados. Los nombres/códigos se contrastaron con 241 filas visibles del nuevo Rover para el 24/10/2026: las 75 configuraciones tuvieron coincidencia única.
