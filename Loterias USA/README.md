# Rovs Loterías USA

[Instalar o actualizar en Tampermonkey](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA/Rovs-Loterias-USA.user.js)

Versión actual: **0.6.5**. Incluye Illinois Midday y Evening desde la fuente oficial de su app, además de las APIs móviles de Florida, Louisiana, Ohio, Tennessee, Indiana y Georgia.

Illinois usa el HTML de `mapp.illinoislottery.com/dbg/results/pick3` y `/pick4`, cargado por la app oficial. Se consulta directamente por fecha con `dateFrom` y `dateTo`, sin iniciar sesión y sin pasar por LotteryUSA. Su fuente aparece como **📱 App oficial Illinois Lottery**, para distinguirla de las APIs JSON. Solo se leen los números principales; Fireball se excluye.

## Instalación y actualización

Abre el enlace anterior y confirma la instalación o actualización en Tampermonkey una sola vez. En la configuración del script, activa la comprobación de actualizaciones. Tampermonkey comprobará la versión de GitHub según su intervalo configurado; también puedes usar «Buscar actualizaciones» para comprobarla manualmente.

Desde 0.6.3 el nombre estable es `Rovs Loterías USA`, sin versión. El número real aparece en `@version` y en la columna de versión de Tampermonkey. Si al instalar aparece una copia nueva por el cambio de nombre, desactiva o elimina la anterior para mantener una sola copia activa. El nombre y las URLs se mantendrán en las próximas publicaciones.

`Rovs-Loterias-USA.user.js` es siempre la versión actual y su URL no cambia. `Rovs-Loterias-USA.meta.js` contiene solo la cabecera que Tampermonkey consulta para detectar actualizaciones. Las copias de `versions/` conservan cada versión publicada; los archivos antiguos del directorio se mantienen como estaban.

## Publicar una nueva versión

1. Modifica el script y verifica los cambios.
2. Desde el repositorio, ejecuta `python "Loterias USA/tools/release.py" "Loterias USA/Rovs-Loterias-USA.user.js" 0.6.6`, sustituyendo el número por la siguiente versión.
3. Actualiza este README y el historial de cambios.
4. Ejecuta `node "Loterias USA/tools/check-release.cjs"`.
5. Haz commit de los archivos generados y publica en `main`. Tampermonkey detectará el incremento de versión.

El generador exige una versión superior a la publicada, conserva la identidad del script y genera juntos el script, los metadatos y la copia histórica. No modifiques una versión ya publicada.

## Historial

- **0.6.5 (2026-10-19):** Illinois Midday y Evening pasan de LotteryUSA a la fuente oficial de la app. Filtra por fecha y sorteo, conserva ceros iniciales, excluye Fireball y rechaza páginas de otro juego/fecha o resultados contradictorios. Añade 27 pruebas de Illinois; las 24 pruebas de Georgia siguen pasando.
- **0.6.4 (2026-10-08):** Georgia Midday, Evening y Night pasan a la API móvil oficial de Cash 3 y Cash 4. Selección por nombre de sorteo y fecha de Georgia, ceros iniciales y consulta de historial paginado. Añade 24 pruebas reproducibles de Georgia con respuestas públicas de la API.
- **0.6.3 (2026-10-08):** Nombre estable sin versión en `@name` y en el mensaje de inicio; corrige la etiqueta antigua V0.6.0. Conserva el funcionamiento y las URLs de actualización.
- **0.6.2 (2026-10-08):** URLs fijas de actualización desde GitHub; funcionamiento idéntico a 0.6.1.
- **0.6.1 (2026-10-08):** Indiana Midday y Evening pasan a la API móvil oficial para Daily 3 y Daily 4. Conserva ceros iniciales, fecha del este y separación del Superball. Verificada con 103 pruebas locales.

## Pruebas de Georgia e Illinois

Desde `Loterias USA`, ejecuta `npm install` y después `npm test` con Node.js 18 o superior. Las pruebas ejecutan el userscript en un DOM de prueba con respuestas controladas; no dependen de que se publique un sorteo durante la ejecución. También verifican los metadatos y la copia de la versión actual.

Las respuestas JSON de Georgia en `tests/fixtures/` se capturaron del servicio oficial el 2026-10-08. Se conservan los campos usados para identificar juego, fecha, sorteo, estado, cifras y paginación. Las pruebas cubren los tres sorteos, historial, fecha del este, ceros iniciales, resultados pendientes o parciales, errores de conexión y protección de las demás filas. La clave incluida en el userscript es la clave pública del cliente móvil, no una cuenta personal.

Los archivos `il-pick3.html` e `il-pick4.html` se capturaron el 2026-10-19 para los sorteos del 2026-10-18. Conservan el marcado de resultados y la configuración que identifica juego y filtro de fecha. Las 27 pruebas de Illinois cubren ambos sorteos, Fireball, ceros iniciales, fecha independiente de la zona del equipo, historial, resultados pendientes/parciales, errores de conexión, páginas inválidas y protección de las demás filas.

La fuente de Illinois se verificó siguiendo el [APK enlazado por el sitio oficial](https://www.illinoislottery.com/useful-information/illinois-lottery-app/android): `assets/www/js/index.js` del APK 1.11.0 carga `https://mapp.illinoislottery.com`. La página y el código actual del servicio móvil entregan los resultados como HTML. Esta comprobación identifica el flujo de ese APK y el servicio consultado; no afirma que se haya inspeccionado la última versión de Google Play.
