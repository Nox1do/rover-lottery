# Rovs Loterias USA React 0.0.6

[Instalar en Tampermonkey](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA%20React/Rovs-Loterias-USA-React.user.js)

Userscript independiente para **Firefox + Tampermonkey** en `https://central.roversport.net/loteria/resultados/ver`. Basado en Rovs Loterías USA 0.6.7; conserva sus **75 loterías**, proveedores y orden. No modifica ni sustituye el script del Rover anterior.

## Uso

1. Instala el script desde el enlace anterior y recarga Rover.
2. Selecciona la fecha en Rover y pulsa **Buscar**. La barra confirma la fecha cuando termina la carga. Si ya tenías la tabla abierta al instalar el script, pulsa Buscar de nuevo.
3. Abre **Loterías USA** en la esquina inferior derecha. Arranca compacta y ocupa toda la ventana de izquierda a derecha. En escritorio los controles quedan a la izquierda y la cuadrícula de loterías a la derecha, como en la barra anterior. Elige Día/Noche o filtra por nombre/código. Arrastra los bordes o las esquinas con el ratón o el dedo para cambiar ancho/alto; El icono de **flechas hacia dentro** restaura el tamaño inicial; su descripción es «Restablecer tamaño compacto (ancho completo)». La cuadrícula de escritorio conserva el orden por columnas y el desplazamiento horizontal de la versión anterior; muestra dos filas en el tamaño compacto y más filas al ampliar. En móvil el desplazamiento es vertical.
4. Pulsa la lotería. El script consulta su proveedor y llena Pick 3 y/o Pick 4 en la fila que coincida por nombre **y** abreviatura. Washington estado usa WST-NG y solo Pick 3.
5. Los campos confirmados se resaltan en verde suave durante un segundo y se desvanecen durante otro; quedan en negrita hasta editar la fila o cambiar de contexto. Un resultado parcial solo marca los campos que se llenaron. Revisa los valores. La publicación se sigue realizando manualmente con **Procesar**, desde Rover.

El propio Rover deriva 1era/2da/3ra y puede llenar las loterías dependientes que tenga configuradas, igual que al escribir manualmente. El userscript conserva ese comportamiento y no publica ninguna de esas filas.

En móvil los controles se organizan en dos filas, tienen áreas de pulsación de al menos 44 px y abrir la barra no enfoca el buscador para evitar que aparezca el teclado. El tamaño se limita a la pantalla y se ajusta al girar el dispositivo o cambiar la ventana. Cada recarga vuelve al tamaño compacto; cerrar/abrir conserva el tamaño durante esa página. Los bordes también admiten las flechas del teclado.

La tipografía usa fuentes del sistema (Segoe UI en Windows), peso medio, altura de línea 1.4 y tamaño adaptable de 14 a 18 px según el ancho CSS disponible. En una ventana 4K al 100 % llega a 18 px; con escalado del sistema al 200 % se respeta el tamaño que ya aplica el navegador, sin multiplicarlo otra vez por la densidad. Restablecer tamaño compacto devuelve también el ancho completo. Los botones de loterías tienen menos relleno, separación y anchura; las filas usan una altura fija adaptable al texto, sin estirarse para ocupar el espacio sobrante. En móvil conservan un área de pulsación de al menos 44 px.

La barra usa JavaScript vanilla y los colores, tipografía y variables del nuevo Rover, con tema claro/oscuro. «React» en el nombre identifica el sistema de destino; el producto no descarga ni monta una segunda copia de React.

## Paridad con la versión anterior

Consulta [PARIDAD.md](PARIDAD.md) para ver la comparación con USA 0.6.7. Se recuperaron el verde temporal, la negrita, los acentos Día/Noche, las banderas, la navegación horizontal, el naranja de advertencias, el detalle de sorteo y los registros completos. Cada consulta muestra en consola la hora, fecha, sorteo, fuente, código y nombres propios del proveedor (Cash 3/4, Daily 3/4 o Pick 3/4), también si no hay resultado o falla.

El inventario de pruebas contrasta las 75 loterías contra una copia de la configuración original 0.6.7 para detectar pérdidas de sorteos, fuentes, URLs u orden. Las funciones de proveedores/transporte se contrastaron con el original y no cambiaron. Las mejoras de tamaño, móvil, 4K y protección de fecha se conservan.

## Avisos claros

Cada motivo tiene su propio SVG y etiqueta, definidos en `src/status.js`: ver [ESTADOS.md](ESTADOS.md). El pie de la barra muestra la lotería, el motivo y el detalle de la consulta sin depender del color, del tooltip o de interpretar un emoji. El botón incluye la misma etiqueta accesible y el estado ocupado mientras consulta. La X queda únicamente para cerrar la barra.

Los errores llevan un código estable desde el transporte, la validación o el adaptador; no se clasifican por coincidencias del texto. La fecha sin confirmar, fila no visible, campos bloqueados, timeout y error de red ya no comparten un «error» genérico. Estos códigos no cambian los endpoints, consultas, parsers, guardado ni el llenado de Rover.

## Fecha y disponibilidad

Cambiar calendario, servidor o volver a pulsar Buscar invalida las consultas anteriores. No se toma la fecha de hoy como respaldo. Una fila oculta por el filtro de Rover o todavía no habilitada por su horario no se llena: elimina el filtro o revisa la fecha en Rover y vuelve a consultar.

El script no realiza llamadas a APIs internas de Rover, no guarda ni procesa resultados, no intercepta sus peticiones y no fabrica respuestas. Solo consulta los proveedores externos heredados del script base.

## Versiones y mantenimiento

La versión instalada aparece debajo del buscador. Las URLs `.user.js` y `.meta.js` de esta carpeta son estables y permiten actualizaciones de Tampermonkey. El `@name` inicial es exactamente `Rovs Loterias USA React 0.0.1`; se conserva como identidad de instalación para evitar copias duplicadas. El número instalado se obtiene de `GM_info.script.version`.

`src/config.js`: loterías y códigos; `src/providers.js`: fuentes y parsers; `src/rover.js`: fecha, identidad y escritura del formulario; `src/ui.js`: barra; `src/status.js`: catálogo de estados, SVG y códigos de error; `src/feedback.js`: resaltado y limpieza visual; `src/main.js`: consultas manuales y estados. `tools/build.cjs` genera un único userscript sin dependencias de ejecución.

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

En este trabajo se probaron **Firefox 153.0 de Playwright y React 19.3.1**, la versión observada en el código público de Rover. La reproducción incluye campos controlados, derivación de premios y una dependencia de prueba. Se comprueba el estado React después de otro render, además de los valores visibles. La suite incluye arrastre real con ratón, ajuste por teclado, viewport móvil de 390 × 844, ancho completo a 1920 × 1080 y 3840 × 2160, contexto con densidad 2 simulando 4K al 200 %, cambios de orientación/ventana, pulsaciones táctiles y eventos Pointer sintéticos de tipo touch para el redimensionado. No equivale a probar el gesto sobre un teléfono físico.

Los resultados de proveedores se simulan mediante un puente GM de prueba. Las pruebas de navegador no instalan la extensión Tampermonkey ni usan una sesión de producción: esto valida el adaptador en Firefox y React, pero no equivale a una prueba completa de la extensión sobre tu cuenta de Rover. Para confirmar en la sesión real, consulta una fila, revisa los cinco campos, cambia el filtro de la tabla y vuelve a mostrarla; comprueba que los valores se conservan antes de procesar.

En contenedores Linux que no permiten los namespaces requeridos por el sandbox interno de Firefox, las pruebas locales aceptan `ROVS_FIREFOX_CONTAINER=1 npm test`. Esta opción ajusta únicamente el navegador de la reproducción aislada y no forma parte del userscript.

Los fixtures de Georgia, Illinois y Washington conservan los datos públicos usados por las pruebas del proyecto base; las fechas de captura aparecen en los originales y en sus encabezados. Los nombres/códigos se contrastaron con 241 filas visibles del nuevo Rover para el 24/10/2026: las 75 configuraciones tuvieron coincidencia única.
