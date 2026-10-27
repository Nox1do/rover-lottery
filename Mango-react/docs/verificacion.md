# Verificación

## 0.1.1 — 27/10/2026

- Antes del cambio: la suite original aprobó 29 pruebas Node, 15 escenarios React/Firefox y una extensión aislada. Al actualizar la fixture al icono PROC actual y añadir las regresiones, Firefox reprodujo el bloqueo «Central está cargando resultados…»: 15/21 escenarios aprobados; fallaron `circle-check`, `check-circle-2`, la tabla de 14 filas, PROC con edición, el userscript completo y Buscar con edición manual.
- Después de corregir el selector: `npm test` aprobó 29 pruebas Node, 21 escenarios React/Firefox y una prueba en extensión aislada; cero fallos.
- Las regresiones comprueban iconos actuales y anteriores, persistencia de una fila procesada sin sobrescribirla, 14 filas con 13 procesadas y entrega a la pendiente, y bloqueo de PROC desconocido aunque tenga color verde y Status muestre éxito. El userscript generado también se prueba con una fila procesada presente.
- `npm run check`: instalador, metadatos, versión y copia histórica reproducibles. `git diff --check`: sin problemas de espacios. Se conserva sin cambios el histórico 0.1.0.

La corrección se verificó con React real en Firefox y servicios simulados. Sigue pendiente confirmar el funcionamiento de 0.1.1 en la sesión personal de Firefox/Tampermonkey. No se realizó una publicación financiera ni se modificó el backend.

## 0.1.0

Ejecutado el 27/10/2026:

- `npm test`: 29 pruebas de Node, 15 escenarios React/Firefox y una prueba en extensión aislada de Firefox; cero fallos.
- `npm run check`: instalador, metadatos, versión y copia histórica reproducibles.
- `git diff --check`: sin problemas de espacios.

La revisión independiente encontró dos errores importantes antes de publicar. Se corrigieron con regresiones observadas fallando y después pasando:

1. Reservas retenidas: ahora se comprueban revisión, valores autorizados, vencimiento y contexto antes de rellenar y entre escrituras; se descartan reservas antiguas al cambiar de contexto o revisión.
2. Buscar con edición local retenida: se suspende autorización al iniciar Buscar, pero se conserva la referencia persistida del mismo contexto. Solo una nueva respuesta válida vuelve a autorizar; una edición local no se confunde con publicación.

También se reprodujeron y corrigieron la carrera de consumo de respuesta entre contextos Firefox, intervención de otro userscript durante el llenado, trabajo oculto por filtro y filas API de otra fecha.

La extensión temporal permite comprobar Xrays/exportFunction, respuesta original intacta, llenado retenido por React y ausencia de capacidades GM en la página. Las respuestas Mango y funciones GM están simuladas. Esto no certifica una instalación personal de Tampermonkey ni una publicación financiera real; esas acciones no se realizaron. Las pruebas usan un ajuste del aislamiento de procesos de Firefox necesario en este entorno, separado del aislamiento de JavaScript de la extensión.
