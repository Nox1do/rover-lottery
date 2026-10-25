# Rovs Loterias USA React 0.0.1

[Instalar en Tampermonkey](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA%20React/Rovs-Loterias-USA-React.user.js)

Userscript independiente para **Firefox + Tampermonkey** en `https://central.roversport.net/loteria/resultados/ver`. Basado en Rovs Loterías USA 0.6.7; conserva sus **75 loterías**, proveedores y orden. No modifica ni sustituye el script del Rover anterior.

## Uso

1. Instala el script desde el enlace anterior y recarga Rover.
2. Selecciona la fecha en Rover y pulsa **Buscar**. La barra confirma la fecha cuando termina la carga. Si ya tenías la tabla abierta al instalar el script, pulsa Buscar de nuevo.
3. Abre **Loterías USA** en la esquina inferior derecha. Elige Día/Noche o filtra por nombre/código.
4. Pulsa la lotería. El script consulta su proveedor y llena Pick 3 y/o Pick 4 en la fila que coincida por nombre **y** abreviatura. Washington estado usa WST-NG y solo Pick 3.
5. Revisa los valores. La publicación se sigue realizando manualmente con **Procesar**, desde Rover.

El propio Rover deriva 1era/2da/3ra y puede llenar las loterías dependientes que tenga configuradas, igual que al escribir manualmente. El userscript conserva ese comportamiento y no publica ninguna de esas filas.

La barra usa JavaScript vanilla y los colores, tipografía y variables del nuevo Rover, con tema claro/oscuro. «React» en el nombre identifica el sistema de destino; el producto no descarga ni monta una segunda copia de React.

## Fecha y disponibilidad

Cambiar calendario, servidor o volver a pulsar Buscar invalida las consultas anteriores. No se toma la fecha de hoy como respaldo. Una fila oculta por el filtro de Rover o todavía no habilitada por su horario no se llena: elimina el filtro o revisa la fecha en Rover y vuelve a consultar.

El script no realiza llamadas a APIs internas de Rover, no guarda ni procesa resultados, no intercepta sus peticiones y no fabrica respuestas. Solo consulta los proveedores externos heredados del script base.

## Versiones y mantenimiento

La versión instalada aparece debajo del buscador. Las URLs `.user.js` y `.meta.js` de esta carpeta son estables y permiten actualizaciones de Tampermonkey. El `@name` inicial es exactamente `Rovs Loterias USA React 0.0.1`; se conserva como identidad de instalación para evitar copias duplicadas. El número instalado se obtiene de `GM_info.script.version`.

`src/config.js`: loterías y códigos; `src/providers.js`: fuentes y parsers; `src/rover.js`: fecha, identidad y escritura del formulario; `src/ui.js`: barra; `src/main.js`: consultas manuales y estados. `tools/build.cjs` genera un único userscript sin dependencias de ejecución.

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

En este trabajo se probaron **Firefox 153.0 de Playwright y React 19.3.1**, la versión observada en el código público de Rover. La reproducción incluye campos controlados, derivación de premios y una dependencia de prueba. Se comprueba el estado React después de otro render, además de los valores visibles.

Los resultados de proveedores se simulan mediante un puente GM de prueba. Las pruebas de navegador no instalan la extensión Tampermonkey ni usan una sesión de producción: esto valida el adaptador en Firefox y React, pero no equivale a una prueba completa de la extensión sobre tu cuenta de Rover. Para confirmar en la sesión real, consulta una fila, revisa los cinco campos, cambia el filtro de la tabla y vuelve a mostrarla; comprueba que los valores se conservan antes de procesar.

En contenedores Linux que no permiten los namespaces requeridos por el sandbox interno de Firefox, las pruebas locales aceptan `ROVS_FIREFOX_CONTAINER=1 npm test`. Esta opción ajusta únicamente el navegador de la reproducción aislada y no forma parte del userscript.

Los fixtures de Georgia, Illinois y Washington conservan los datos públicos usados por las pruebas del proyecto base; las fechas de captura aparecen en los originales y en sus encabezados. Los nombres/códigos se contrastaron con 241 filas visibles del nuevo Rover para el 24/10/2026: las 75 configuraciones tuvieron coincidencia única.
