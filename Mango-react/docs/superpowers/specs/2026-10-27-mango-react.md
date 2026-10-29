# Mango React — diseño aprobado

Versión independiente para Firefox/Tampermonkey en Central, únicamente servidor PRINCIPAL y fecha de hoy en America/Santo_Domingo. Conserva contrato Mango 1.0, token privado, conciliación/reserva/presentación, azul pendiente y verde temporal al llenar. Nunca procesa, publica, modifica fuentes ni configura horarios.

Observar pasivamente las consultas nativas de resultados/dependencias/revisiones permite distinguir fecha seleccionada de fecha cargada y valores persistidos de ediciones locales. Ante un contexto desconocido, fallido o cambiado se suspenden escrituras y ACK. El ACK usa valores persistidos realmente procesados, incluso manuales sin resultado oficial; PROC verde con campos editados no confirma esos campos.

Respetar inputs controlados, ceros iniciales, picks y dependencias nativas; revisar efectos antes de escribir, verificar después del render y preservar ediciones/limpiezas locales, foco y scroll. Congelar escrituras con diálogos, publicación, permisos insuficientes o lectura. Buscar nativo puede refrescar prudentemente sin ediciones ni diálogos para descubrir filas nuevas. Filtros y orden no identifican loterías. Una discordancia API procesado/Central pendiente se diagnostica sin resetearla.

Módulos pequeños, build reproducible, versión propia, actualización desde GitHub, diagnóstico sin token. No cambia el backend ni corrige por sí solo el scheduler compartido de búsquedas tras processed. Pruebas aisladas, nunca publicación financiera real.

## Ajuste de llenado solicitado para 0.1.4

El usuario pidió llenar los campos juntos para eliminar el aspecto escalonado. Las entradas de una fila se agrupan sin temporizadores entre ellas, conservando cesión a microtareas y guard de contexto/reserva/intervención en cada paso. La retención se comprueba después de una espera final antes de `presented`. Una intervención entre entradas cancela las restantes; si llega después del bloque, se preserva el cambio ajeno y no se confirma la entrega. No se añaden sobrescrituras ni cambios de backend. Medir frames completos/filtrados y conservar pruebas de intervención entre scripts y sandbox; no atribuir una reducción general de latencia solo a menos consultas DOM.

## Instrumentación solicitada por el incidente de Quinielón · 0.1.5

Informar las condiciones que antes omitían silenciosamente un llenado y conservar un resumen de las últimas conciliaciones. Reutilizar los guards existentes, sin alterar su resultado ni generar nuevas peticiones desde el diagnóstico. Distinguir coincidencia de identidad, autorización del servicio y retención visible; no atribuir una operación de otra PC a la del usuario. Mostrar solo etiquetas y metadatos necesarios, con memoria acotada y sin respuestas completas ni credenciales. La causa del incidente anterior sigue sin demostrarse; no presentar esta instrumentación como arreglo del llenado.

## Continuación de componentes y atribución de dependientes · 0.1.6

Un componente nuevo puede completar una fila previamente llenada por Mango sin exigir F5. Se conserva el diseño aprobado de proteger trabajo ajeno: los valores de dependientes solo se exceptúan del bloqueo por estar ocupados si una escritura propia anterior los produjo y se verificaron contra reglas conocidas y valores retenidos. La prueba de origen depende de principal, contexto, reglas, valores completos y baseline persistido; no de X, color o igualdad parcial. Una intervención en cualquier principal que comparta esa dependiente invalida el origen. El permiso del servicio, reservas/revisiones y PROC siguen siendo necesarios.

La opción elegida es conservar atribución verificada en memoria de la sesión. Vaciar/rellenar dependientes o ignorar sus números perdería protección; esperar ambos picks retrasaría el primer resultado y no respetaría las entregas por componentes. No se modifican backend, horarios ni publicación.

## Reinicios y referencia de edición local · 0.1.7

La suspensión externa de Mango debe invalidar las operaciones sin perder la referencia persistida de una tabla ya verificada, igual que Buscar. Reanudar exige una respuesta nativa nueva con la misma fecha, servidor e ID y datos persistidos sin cambios para justificar ediciones locales conocidas. La alternativa elegida reutiliza `prepareSearch`; omitir globalmente los errores numéricos o ignorar una fila sin prueba previa debilitaría la verificación aprobada. No se reusan tokens, reservas ni caché remota. Se preservan mensajes específicos del reinicio.

## Flujo por lotería · 0.1.8

El usuario aprobó separar la carga general de la autorización por fila y sus efectos, siguiendo Mango Rover v2. El diseño [2026-10-28-row-isolation-design.md](2026-10-28-row-isolation-design.md) sustituye la exigencia previa de igualdad global de casillas: una incompatibilidad desconocida bloquea únicamente las operaciones relacionadas. Las pruebas previas, contexto general y respeto del trabajo local se conservan; los fallos de retención también se aíslan por grupo afectado.

## Vigilancia y plazo visual · 0.1.9

La cercanía de HORA adelanta solo lecturas; una revisión constante no debe ocultar estados nuevos por dos minutos. Los colores siguen dependiendo del servicio. El verde se puede remapear solo con valor, pendiente, contexto y plazo originales. Un filtro vacío mantiene la carga previamente probada. Una fila propia ya procesada y totalmente coincidente deja de ser trabajo pendiente para refrescar; registros ocultos o de dependientes sin esa prueba siguen bloqueando.
