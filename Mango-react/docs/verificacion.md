# Verificación de 0.1.0

Ejecutado el 27/10/2026:

- `npm test`: 29 pruebas de Node, 15 escenarios React/Firefox y una prueba en extensión aislada de Firefox; cero fallos.
- `npm run check`: instalador, metadatos, versión y copia histórica reproducibles.
- `git diff --check`: sin problemas de espacios.

La revisión independiente encontró dos errores importantes antes de publicar. Se corrigieron con regresiones observadas fallando y después pasando:

1. Reservas retenidas: ahora se comprueban revisión, valores autorizados, vencimiento y contexto antes de rellenar y entre escrituras; se descartan reservas antiguas al cambiar de contexto o revisión.
2. Buscar con edición local retenida: se suspende autorización al iniciar Buscar, pero se conserva la referencia persistida del mismo contexto. Solo una nueva respuesta válida vuelve a autorizar; una edición local no se confunde con publicación.

También se reprodujeron y corrigieron la carrera de consumo de respuesta entre contextos Firefox, intervención de otro userscript durante el llenado, trabajo oculto por filtro y filas API de otra fecha.

La extensión temporal permite comprobar Xrays/exportFunction, respuesta original intacta, llenado retenido por React y ausencia de capacidades GM en la página. Las respuestas Mango y funciones GM están simuladas. Esto no certifica una instalación personal de Tampermonkey ni una publicación financiera real; esas acciones no se realizaron. Las pruebas usan un ajuste del aislamiento de procesos de Firefox necesario en este entorno, separado del aislamiento de JavaScript de la extensión.
