# Mango React — diseño aprobado

Versión independiente para Firefox/Tampermonkey en Central, únicamente servidor PRINCIPAL y fecha de hoy en America/Santo_Domingo. Conserva contrato Mango 1.0, token privado, conciliación/reserva/presentación, azul pendiente y verde temporal al llenar. Nunca procesa, publica, modifica fuentes ni configura horarios.

Observar pasivamente las consultas nativas de resultados/dependencias/revisiones permite distinguir fecha seleccionada de fecha cargada y valores persistidos de ediciones locales. Ante un contexto desconocido, fallido o cambiado se suspenden escrituras y ACK. El ACK usa valores persistidos realmente procesados, incluso manuales sin resultado oficial; PROC verde con campos editados no confirma esos campos.

Respetar inputs controlados, ceros iniciales, picks y dependencias nativas; revisar efectos antes de escribir, verificar después del render y preservar ediciones/limpiezas locales, foco y scroll. Congelar escrituras con diálogos, publicación, permisos insuficientes o lectura. Buscar nativo puede refrescar prudentemente sin ediciones ni diálogos para descubrir filas nuevas. Filtros y orden no identifican loterías. Una discordancia API procesado/Central pendiente se diagnostica sin resetearla.

Módulos pequeños, build reproducible, versión propia, actualización desde GitHub, diagnóstico sin token. No cambia el backend ni corrige por sí solo el scheduler compartido de búsquedas tras processed. Pruebas aisladas, nunca publicación financiera real.

## Ajuste de llenado solicitado para 0.1.4

El usuario pidió llenar los campos juntos para eliminar el aspecto escalonado. Las entradas de una fila se agrupan sin temporizadores entre ellas, conservando cesión a microtareas y guard de contexto/reserva/intervención en cada paso. La retención se comprueba después de una espera final antes de `presented`. Una intervención entre entradas cancela las restantes; si llega después del bloque, se preserva el cambio ajeno y no se confirma la entrega. No se añaden sobrescrituras ni cambios de backend. Medir frames completos/filtrados y conservar pruebas de intervención entre scripts y sandbox; no atribuir una reducción general de latencia solo a menos consultas DOM.

## Instrumentación solicitada por el incidente de Quinielón · 0.1.5

Informar las condiciones que antes omitían silenciosamente un llenado y conservar un resumen de las últimas conciliaciones. Reutilizar los guards existentes, sin alterar su resultado ni generar nuevas peticiones desde el diagnóstico. Distinguir coincidencia de identidad, autorización del servicio y retención visible; no atribuir una operación de otra PC a la del usuario. Mostrar solo etiquetas y metadatos necesarios, con memoria acotada y sin respuestas completas ni credenciales. La causa del incidente anterior sigue sin demostrarse; no presentar esta instrumentación como arreglo del llenado.
