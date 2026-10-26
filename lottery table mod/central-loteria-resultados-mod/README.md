# Central Loterías Resultados Mod

Userscript independiente para la pantalla React de resultados de loterías de Rover Central.

- **Script:** `central-loterias-resultados-react.user.js`
- **Versión inicial:** `0.0.1`
- **Página objetivo:** `https://central.roversport.net/loteria/resultados/ver`
- **Navegadores:** Firefox y Opera con Tampermonkey

## Instalación y actualizaciones

1. Abre el [userscript RAW](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/lottery%20table%20mod/central-loteria-resultados-mod/central-loterias-resultados-react.user.js) desde Firefox u Opera.
2. Instálalo o actualízalo con Tampermonkey.
3. Carga los resultados de lotería desde la opción **Buscar** de Central.

El archivo incluye `@updateURL` y `@downloadURL` dirigidos a esta ruta estable de la rama `main`.
Para futuras versiones, incrementar **tanto** `@version` como la constante `VERSION` del código, probar los cambios y publicar un nuevo commit. Tampermonkey podrá detectar la actualización de acuerdo con su configuración e intervalo de búsqueda.

## Funcionalidad v0.0.1

- Filtros visuales excluyentes: **Procesados pendientes** y **Sin procesar**.
- Resaltados rojo suave y azul suave para los sorteos configurados.
- Clasificación pasiva de estados por las columnas `PEND.` y `PROC.`.
- Monitoreo limitado de cambios de filas en React, sin jQuery DataTables.
- Diagnóstico por consola: `__CENTRAL_LOTERIAS_REACT_QA__.status()` y `.rows(10)`.

El script no procesa sorteos, no introduce peticiones de red y no modifica los valores de los campos. Los estados que no se logran clasificar siguen visibles al filtrar.

## Verificación

Se comprobó la sintaxis con Node y se ejecutaron pruebas de Playwright/Chromium sobre una página simulada con la estructura de 12 columnas observada en Central. Queda pendiente validar el comportamiento completo sobre la sesión autenticada de producción.

El mod anterior `Rs-loteria-res-tabla-mod.user.js`, ubicado en el directorio padre, permanece independiente e intacto.
