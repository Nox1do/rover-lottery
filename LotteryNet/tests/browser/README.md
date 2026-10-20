Pendiente: Firefox y Chromium con Tampermonkey real; multitab/multihost, Network, no POST a Rover, interacción con otros scripts.

## Estado de pruebas (2026-10-20)

- `isolated-rover.mjs`: ejecutado en GitHub Actions con Chromium y Firefox (16 aserciones por navegador) sobre DOM simulado, sin procesar.
- `rover-dom-audit.user.js`: diagnóstico de lectura únicamente para cuando se disponga de sesión Rover real. No forma parte de la distribución de LotteryNet.

### Uso opcional de auditoría en Rover real

1. Instalar exclusivamente `rover-dom-audit.user.js` desde la carpeta de pruebas en Tampermonkey. **Es una herramienta de inspección, no el script de resultados.**
2. Abrir la página autenticada de resultados de loterías y ejecutar Search para mostrar la fecha deseada.
3. En la consola del navegador ejecutar `__LOTTERYNET_DOM_AUDIT__.print()`.
4. Revisar la tabla estructural, nombres de las filas, fechas y campos. No se inspeccionan ni copian números ni valores de resultados.
5. Cuando termine el diagnóstico, deshabilitar o desinstalar ese userscript de auditoría.

Si se conecta Opera con permisos adecuados, se puede inspeccionar la estructura visible sin instalar esta herramienta. **Ninguna de estas opciones sustituye la auditoría Network y la prueba de convivencia con otros userscripts.**
