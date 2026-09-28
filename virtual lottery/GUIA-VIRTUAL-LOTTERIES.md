# Virtual Lotteries v3.0.3 — guía breve

El userscript reconoce 25 sorteos de NationJL, Rapid, PremierLotto, QPlay Brazil y The Queen Lottery. Québec EXTRA conserva su botón manual y su pestaña de Lottery Post.

## Activación

1. Actualiza el userscript existente a v3.0.0 y desactiva cualquier copia anterior para que no haya dos motores en la misma página.
2. Abre `lottery.php`. Junto al campo de fecha aparece **AUTO: OBSERVAR**. En este modo se buscan y contrastan resultados; si la fecha visible es hoy, se muestran en los inputs vacíos, pero no se envían a Rover. La consola muestra los sorteos activos y los estados `WAITING_RESULT` y `RESULT_READY`.
3. Para probar el flujo completo de Rapid, elige **AUTO: RAPID** en **un solo puesto**. Los seis sorteos Rapid pueden enviarse y verificarse automáticamente; NationJL, Premier, Brazil y Queen siguen en observación. Los otros dos usuarios deben permanecer en **AUTO: OBSERVAR**. El ajuste se conserva en ese navegador.
4. **AUTO: TODOS** habilita las cinco fuentes y requiere el mismo control de un solo emisor. Para pausar envíos, vuelve a **AUTO: OBSERVAR**. Un envío que ya comenzó se verifica antes de concluir; revisa la consola.

Al pulsar **Search** en Rover, si la tabla se reconstruye, los resultados que el userscript ya había encontrado se restauran automáticamente siempre que la fila siga vacía o coincida; nunca se sobrescriben valores distintos devueltos por Rover.

La automatización solo usa la fecha actual de República Dominicana. Cambiar la fecha visible de Rover afecta a los botones manuales, no a los sorteos automáticos. El motor necesita que `lottery.php` esté abierto; la pestaña puede estar en segundo plano. Si el navegador no dispone de Web Locks, el script permanece sin enviar.

## Estados y revisión

| Estado | Acción |
|---|---|
| `WAITING_RESULT` | La fuente aún no muestra cinco valores válidos. El script vuelve a consultar. |
| `RESULT_READY` | Resultado listo; en observación espera que se active el emisor. |
| `DONE` | Rover confirmó estado procesado y los cinco valores iguales. |
| `CONFLICT` | Rover o los inputs visibles tienen otros valores. Revisar manualmente. |
| `DUPLICATE` | Los tres números principales coinciden con otra fila. Revisar manualmente. |
| `PROCESS_UNCERTAIN` | Pudo enviarse un POST, pero Rover no confirmó el resultado. Revisar antes de cualquier acción; el script no repite el POST. |
| `ERROR` | Falló una consulta; el motor espera y vuelve a intentar. |

Los detalles de cada sorteo se consultan en `console.table` y en el almacenamiento de Tampermonkey bajo `vl:auto:v3:AAAA-MM-DD:CÓDIGO`. No borres un estado `PROCESSING`, `VERIFYING` o `PROCESS_UNCERTAIN` para forzar otro envío: verifica primero la fila de Rover.

**Límite:** los navegadores de tres operadores no comparten un bloqueo atómico. Por eso solo uno debe ser emisor; esta versión no puede impedir por sí sola una carrera con un procesamiento manual simultáneo en otro equipo. Antes de habilitar los tres puestos como emisores se necesita una garantía del lado del servidor.
