# Pantalla auditada · 27/10/2026

Fuentes públicas comprobadas:

- https://central.roversport.net/assets/index-DJF6WSbz.js
- https://central.roversport.net/assets/VerResultados-BQtQUfKs.js
- https://central.roversport.net/assets/PublicarFlujo-ZJdvPDv8.js
- https://central.roversport.net/assets/DateField-DlsfibOj.js
- https://react.dev/reference/react-dom/components/input
- https://www.tampermonkey.net/documentation.php?locale=en&q=meta:sandbox
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts/exportFunction

## Contratos observados

| Función nativa | Adaptación |
| --- | --- |
| Calendario MM/dd/yyyy, texto español y Buscar | Verifica fecha de respuesta + tabla asentada; no confía solo en calendario |
| Servidor con nombre y contador de fallos | Lee `.truncate`, no el texto completo contaminado por contador |
| POST de lectura resultadosLoteria2 | Observa sin solicitar lecturas adicionales; conserva promesa y respuesta originales |
| 13 columnas, orden y filtro desmontando filas | Índice por cabecera y nombre/código únicos; ninguna posición de fila fija |
| Inputs React con estado local independiente | Setter nativo + evento input + comprobación posterior al render |
| Pick 3/4 y dependencias | Derivación nativa; valida campos afectados antes de escribir |
| PROC basado en persistencia, campos editables aparte | ACK desde datos publicados, no desde una edición pendiente |
| Pendientes de tickets y Status de transmisión | No equivalen a PROC y no causan nuevas publicaciones |
| PublicarFlujo congela valores | Diálogos/carga/publicación bloquean efectos; posterior recarga confirma |
| Fuentes, Usar y consenso | No toca configuración; respeta conflictos y trabajo local |
| Fotos, portapapeles, historial y alertas | Sus tablas/campos/fechas no se usan para llenar resultados |
| Horarios/dependientes y otros servidores | Mango no opera en esas vistas |
| Filas visibles diez minutos antes, sin polling principal | Refresco nativo limitado y condicionado a ausencia de trabajo local |

El tiempo mínimo de asentamiento se combina con igualdad de identidad, PROC y campos persistidos; un retraso, error o contexto incompatible suspende efectos. Una respuesta fuera de orden no sustituye la última solicitud. Si no se observó la carga inicial se requiere Buscar de nuevo. Una discordancia entre servicios se diagnostica y no se repara automáticamente.

## Límites de pruebas

La fixture reproduce los contratos comprobados, pero no es la aplicación privada de Central. La prueba de contexto aislado usa una extensión temporal y GM simulado, no una instalación personal de Tampermonkey. No se invocan publicaciones financieras ni se usan cookies de la sesión del usuario. Validación operativa posterior: instalar, configurar token, comprobar diagnóstico y revisar un llenado real antes de confirmar manualmente como siempre.
