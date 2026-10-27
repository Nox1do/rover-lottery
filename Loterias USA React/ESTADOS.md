# Estados de consulta — React 0.0.5

Los símbolos son SVG propios y mantienen la misma forma en Firefox de Windows, móvil y 4K. Cada motivo tiene un icono y una etiqueta distintos. El tono acompaña al texto; no es la única forma de interpretar el resultado.

| Etiqueta | Símbolo | Cuándo aparece |
| --- | --- | --- |
| Consultando sorteo | Círculo abierto girando | Consulta al proveedor en curso; botón ocupado |
| Llenado completo | Check dentro de círculo | Rover conservó todos los resultados disponibles requeridos |
| Llenado parcial | Círculo dividido | Se llenó un juego y falta otro; se conservan los campos ausentes |
| Resultado pendiente | Reloj | La fuente respondió, pero no hay resultado para fecha y sorteo |
| Fecha sin confirmar | Calendario | Hay que seleccionar fecha y pulsar Buscar |
| Fecha o servidor cambió | Reloj con flecha de retorno | Se descarta una consulta del contexto anterior; consultar otra vez |
| Cargando tabla de Rover | Flechas de actualización | Buscar todavía está cargando; se limpia al terminar |
| Tabla no disponible | Tabla con exclamación | No se puede reconocer o usar la tabla; pulsar Buscar |
| Fila no visible | Lupa | Revisar fecha, horario o filtro de Rover |
| Fila duplicada | Dos cuadros superpuestos | Más de una fila coincide; revisar la tabla |
| Campos bloqueados | Candado | Campos deshabilitados o de solo lectura |
| Sin conexión | Wi-Fi tachado | Falló la conexión con la fuente |
| Tiempo agotado | Reloj de arena | La consulta superó el tiempo de espera |
| Fuente no disponible | Nube con exclamación | Error HTTP o sesión de la app rechazada |
| Respuesta inválida | Documento con exclamación | Datos, formato o historial del proveedor no válidos |
| Consulta cancelada | Círculo con diagonal | Transporte abortado; se puede consultar de nuevo |
| Llenado no confirmado | Escudo con interrogación | Rover no conservó todos los valores; revisar antes de procesar |
| Error inesperado | Octágono con exclamación | Fallo no clasificado; no se presenta como un error de red u otro motivo confirmado |

El botón conserva su indicador individual y tooltip. Desde 0.0.11, los mensajes de fecha/carga y consulta se registran en la consola con `console.info`; el informe de resultados conserva `console.table` y los errores conservan `console.error`. La barra no tiene un pie de mensajes y utiliza el espacio liberado para reducir su altura. Un cambio de contexto limpia los indicadores anteriores. El estado inicial no tiene icono.

Los códigos se asignan donde ocurre el problema; cambiar la redacción de un mensaje no cambia su icono. Las validaciones y rechazos de escritura siguen activos. Esta actualización no agrega guardado ni procesamiento automático.
