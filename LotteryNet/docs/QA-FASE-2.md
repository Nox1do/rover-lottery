# QA de Fase 2 — Ejecutada, pendiente integración Rover real

**Fecha:** 2026-10-20. **Estado:** módulo inactivo, NO APTO PARA PRODUCCIÓN.  
**Diseño:** «En fila», iconos lineales, nueve estados y mensajes aprobados.

## 1. Evidencia verificada

**GitHub Actions:** [LotteryNet QA, ejecución 39431580644](https://github.com/Nox1do/rover-lottery/actions/runs/39431580644) — conclusión: **SUCCESS**, dos trabajos completados.

| Comprobación | Resultado | Alcance de la evidencia |
| --- | --- | --- |
| Node.js 22, `npm test` | **19/19 OK, 0 fallos** | Suite completa incluida en el repositorio |
| `npm run build` | **OK** | Userscript compilado, pero entrada inactiva |
| `node --check dist/LotteryNet-Rover.user.js` | **OK** | Sintaxis de artefacto |
| Auditoría del punto de entrada compilado | **OK** | Sin activación de llenado ni AUTO |
| Playwright Chromium | **PASS, 16 aserciones** | Tabla Rover **simulada**, no la web autenticada |
| Playwright Firefox | **PASS, 16 aserciones** | Tabla Rover **simulada**, no la web autenticada |
| Eventos `input/change/blur` en navegador de prueba | **0** | Durante el llenado visual en la tabla simulada |
| Solicitudes de escritura / acceso a `/__inc/` en prueba | **0** | Red del fixture local, NO Network de Rover real |

**Archivos de pruebas:**
- `tests/unit/rover-visual.test.js` y `tests/unit/inline-ui.test.js`: validaciones unitarias.
- `tests/browser/isolated-rover.mjs`: Playwright en Chromium y Firefox, servidor local simulado.
- `.github/workflows/lotterynet-qa.yml`: ejecuta ambos trabajos automáticamente en push y pull request.

### Escenarios cubiertos en navegador simulado

Los cinco campos y ceros iniciales, idempotencia, transiciones de mensajes «Consultando» → «Casillas completadas», indicador único por fila, conflicto sin sobrescritura, caché, reconstrucción de filas tras Search, rechazo de fecha distinta, filas duplicadas y no emisión de eventos ni solicitudes de escritura.

## 2. Puertas pendientes obligatorias para Rover/Tampermonkey real

- [x] Ejecutar `npm test` completo, `npm run build` y revisión de sintaxis en GitHub Actions.
- [x] Ejecutar regresión del DOM simulado con Playwright Chromium y Firefox.
- [ ] Confirmar `.loteria-abrev`, códigos `loteria` e inputs en **cada una de las diez filas del Rover real**.
- [ ] Validar `#fecha`, Search, cambios de vista, AJAX y fila inexistente en una sesión Rover autenticada.
- [ ] Ejecutar Playwright/Firefox y Chromium **con Tampermonkey real instalado** y probar la coexistencia con los scripts activos.
- [ ] Auditar Network en Rover real: ningún POST/PUT/PATCH/DELETE, ni procesamiento indirecto provocado por manejadores.
- [ ] Confirmar que una corrección manual y otros userscripts no son sobreescritos.
- [ ] Evaluar si los inputs visuales requieren `input/change` y demostrar que esos eventos no procesan ni guardan; actualmente **no se emiten**.

**Limitación efectiva:** el conector de Opera respondió «Browser not connected»; no hay acceso a la sesión Rover del usuario ni a sus extensiones Tampermonkey. Por ello, ninguna prueba realizada se declara validación del navegador autenticado.

## 3. Protección y alcance

El código fuente `src/index.js` continúa **INACTIVO**; no importa ni ejecuta el motor, no monta la UI, no inicia AUTO y no consulta resultados. La compilación de esta fase no representa una distribución para producción.

`src/rover/fill-ui.js` asigna solamente `input.value`, sin emisión de eventos `input/change/blur`, clics, guardado ni peticiones HTTP a Rover. Es un mecanismo **preliminar** que exige validación real antes de usarse.

**Regla invariable:** Lottery.net consulta → valida → llena las casillas visibles → informa el estado → termina. **Nunca procesa.**
