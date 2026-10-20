# Reglas de desarrollo para LotteryNet

**Leer [PLAN-LotteryNet-Rover.md](./PLAN-LotteryNet-Rover.md) completo ANTES de modificar cualquier archivo.** Este documento es la especificación que prevalece sobre ejemplos, sugerencias y código heredado.

## Invariantes
- Este proyecto es independiente de **Rovs Loterías USA** y **Virtual Lotteries**: no reutilizar sus estados, locks, claves `GM_*` ni código de procesamiento.
- **FUENTE EXTERNA ÚNICA:** `https://www.lottery.net/`.
- Objetivo: **consultar → validar → llenar inputs visibles en Rover → terminar**.
- **Prohibido procesar, guardar, confirmar o publicar** resultados en Rover; no invocar endpoints de procesamiento ni pulsar Save/Process; no introducir un procesamiento encubierto mediante eventos.
- Ante fecha incorrecta, turno equivocado, fila ambigua, resultado parcial no elegible, datos mal formados o conflicto con valor existente, **no sobrescribir**.
- No afirmar que el resultado está almacenado en el servidor cuando solo está rellenado en el navegador.
- Alcance: exactamente 5 estados, 10 sorteos, juegos de 3 y 4 dígitos indicados en el plan.

## Flujo para cada cambio
1. Leer plan, README y módulos afectados.
2. Consultar documentación actual de bibliotecas/API empleadas.
3. Resolver decisiones pendientes que impacten comportamiento.
4. Escribir módulos simples y pruebas deterministas.
5. Ejecutar `npm test` y `npm run build` si hay dependencias instaladas; auditar que no existe código de procesamiento.
6. En fases funcionales, ejecutar además pruebas con Tampermonkey real en Firefox/Chromium y capturas de red.
7. Actualizar CHANGELOG y el plan **solo** con decisiones autorizadas.

## Estado actual
**ESQUELETO, NO FUNCIONAL.** El punto de entrada no consulta Lottery.net, no arranca AUTO y no modifica casillas. No habilitar funcionalidades antes de completar las puertas del plan.
