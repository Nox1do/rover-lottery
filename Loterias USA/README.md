# Rovs Loterías USA

[Instalar o actualizar en Tampermonkey](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA/Rovs-Loterias-USA.user.js)

Versión actual: **0.6.3**. Incluye Indiana Midday y Evening por API móvil, además de Florida, Louisiana, Ohio y Tennessee.

## Instalación y actualización

Abre el enlace anterior y confirma la instalación o actualización en Tampermonkey una sola vez. En la configuración del script, activa la comprobación de actualizaciones. Tampermonkey comprobará la versión de GitHub según su intervalo configurado; también puedes usar «Buscar actualizaciones» para comprobarla manualmente.

Desde 0.6.3 el nombre estable es `Rovs Loterías USA`, sin versión. El número real aparece en `@version` y en la columna de versión de Tampermonkey. Si al instalar aparece una copia nueva por el cambio de nombre, desactiva o elimina la anterior para mantener una sola copia activa. El nombre y las URLs se mantendrán en las próximas publicaciones.

`Rovs-Loterias-USA.user.js` es siempre la versión actual y su URL no cambia. `Rovs-Loterias-USA.meta.js` contiene solo la cabecera que Tampermonkey consulta para detectar actualizaciones. Las copias de `versions/` conservan cada versión publicada; los archivos antiguos del directorio se mantienen como estaban.

## Publicar una nueva versión

1. Modifica el script y verifica los cambios.
2. Desde el repositorio, ejecuta `python "Loterias USA/tools/release.py" "Loterias USA/Rovs-Loterias-USA.user.js" 0.6.4`, sustituyendo el número por la siguiente versión.
3. Actualiza este README y el historial de cambios.
4. Ejecuta `node "Loterias USA/tools/check-release.cjs"`.
5. Haz commit de los archivos generados y publica en `main`. Tampermonkey detectará el incremento de versión.

El generador exige una versión superior a la publicada, conserva la identidad del script y genera juntos el script, los metadatos y la copia histórica. No modifiques una versión ya publicada.

## Historial

- **0.6.3 (2026-10-08):** Nombre estable sin versión en `@name` y en el mensaje de inicio; corrige la etiqueta antigua V0.6.0. Conserva el funcionamiento y las URLs de actualización.
- **0.6.2 (2026-10-08):** URLs fijas de actualización desde GitHub; funcionamiento idéntico a 0.6.1.
- **0.6.1 (2026-10-08):** Indiana Midday y Evening pasan a la API móvil oficial para Daily 3 y Daily 4. Conserva ceros iniciales, fecha del este y separación del Superball. Verificada con 103 pruebas locales.
