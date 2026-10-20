# QA de Fase 2 — Ejecutada, pendiente integración Rover real

**Fecha:** 2026-10-20. **Estado:** módulo inactivo, NO APTO PARA PRODUCCIÓN.  
**Diseño:** «En fila», iconos lineales, nueve estados y mensajes aprobados.

## 1. Evidencia verificada

**GitHub Actions:** [LotteryNet QA, ejecución 39431580644](https://github.com/Nox1do/rover-lottery/actions/runs/39431580644) — conclusión: **SUCCESS**, dos trabajos completados.

| Comprobación | Resultado | Alcance de la evidencia |
| --- | --- | --- |
| Node.js 22, `npm test` | **21/21 OK, 0 fallos** | Suite completa incluida en el repositorio, con fechas Rover variantes |
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

- [x] Ejecutar `npm test` completo (21 pruebas), `npm run build` y revisión de sintaxis en GitHub Actions.
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

## 4. Refuerzo de compatibilidad de fecha y diagnóstico seguro — 2026-10-20

Se inspeccionó el código existente `Loterias USA/versions/Rovs-Loterias-USA-v0.6.5.user.js`. Ese userscript contempla `#fecha`, `#fecha_desde` y controles alternativos, con fechas `YYYY-MM-DD`, `YYYY/MM/DD`, `MM/DD/YYYY` y el formato `DD/MM/YYYY` cuando el primer componente supera 12.

LotteryNet ahora valida explícitamente esos formatos sin inferir el día actual. **Dos controles de fecha contradictorios bloquean el llenado.** Esta compatibilidad se incorporó a `src/rover/rows.js` y a pruebas Node; todavía no verifica el DOM autenticado.

**Diagnóstico opcional:** `tests/browser/rover-dom-audit.user.js` es un userscript **independiente, solo lectura**, que ofrece `__LOTTERYNET_DOM_AUDIT__.print()` en la consola de una sesión Rover. Examina exclusivamente las identidades de los diez sorteos, presencia de fecha y nombres/atributos de inputs. No recoge números de resultados, tokens, contraseñas ni sesiones; no envía solicitudes, no cambia inputs y no realiza POST. No está instalado por estas pruebas. No debe confundirse con el userscript funcional.

**Bloqueo confirmado:** el navegador Opera del usuario respondió «Browser not connected» al intentar recuperar pestañas. No fue posible observar el DOM autenticado ni auditar los manejadores reales de `input/change` y la pestaña Network. La prueba final real permanece **PENDIENTE** y la entrada de producción permanece **INACTIVA**.

**Ejecución de referencia con 21/21 Node + Playwright exitosos:** [GitHub Actions 39434128974](https://github.com/Nox1do/rover-lottery/actions/runs/39434128974).

## 5. Inspección autenticada mediante Opera (2026-10-20)

El **Opera Browser Connector está conectado**. Se accedió en modo lectura a la pestaña autenticada:
`https://www.roversport.lol/adm/es/lottery.php`.

### Comprobado directamente en la interfaz visible

- La fecha seleccionada es **10/20/2026**.
- La tabla muestra **7 filas de 7 resultados visibles**, correspondientes a otras loterías; **ninguno de los diez sorteos FL/LA/OH/TN/IN** forma parte de esta vista.
- Cada fila expone un **nombre principal** y un **código abreviado** distinto (por ejemplo, ANGUILLA 10AM / ANGUILLA-10AM).
- El árbol de accesibilidad ofrece diez columnas: LOTERIA, HORA, 1ERA, 2DA, 3RA, PICK 3, PICK 4, PEND., PROC. y ACCION.
- Las cinco casillas de resultados aparecen con nombres accesibles exactos `primera`, `segunda`, `tercera`, `pick3`, `pick4`.
- La vista presenta un botón **Search** y otros controles de acción. No se pulsó ninguno ni se modificaron resultados.

### Sigue sin confirmarse

**El conector de Opera permite examinar capturas y árbol de accesibilidad, pero no ejecutar JavaScript ni inspeccionar el DOM crudo, atributos CSS, gestores de Tampermonkey, eventos o Network.** Por ello, la inspección no confirma aún los selectores internos `#tableResult`, `tr.res_tr`, `.loteria-abrev` ni el atributo `loteria`. Tampoco verifica los nombres principales de los diez sorteos en la página real. No reemplaza la prueba de seguridad sobre procesamiento indirecto.

**Riesgo por resolver:** el nombre visible de una lotería no es necesariamente su código abreviado. La identidad debe obtenerse de una fuente DOM inequívoca, sin comparar por suposición el texto de un distintivo de código con el nombre principal.

**Paso siguiente:** visualizar en Rover una fecha con sorteos de Florida, Louisiana, Ohio, Tennessee o Indiana y ejecutar la auditoría DOM opcional **solo lectura** (`tests/browser/rover-dom-audit.user.js`) en la sesión de Tampermonkey real. Si no está disponible un puente de consola, será necesario entregar la tabla estructural resultante para validar selectores. **Mantener `src/index.js` inactivo.**

## 6. Rover autenticado — 19/10/2026 (observación de tabla, solo lectura)

El usuario seleccionó `10/19/2026` y ejecutó Search. Se inspeccionó directamente la pestaña Rover mediante Opera Browser Connector, **sin cambiar inputs ni activar botones de fila**.

- Fecha visible: **10/19/2026**.
- DataTable: **247 registros**; muestra **1–100** en la primera página.
- Los cinco nombres de inputs son `primera`, `segunda`, `tercera`, `pick3`, `pick4` en las filas visibles.
- Coincidencias exactas confirmadas en la **primera página**, con nombre principal seguido de código visible independiente:

| Sorteo del proyecto | Nombre principal en Rover | Código visible |
| --- | --- | --- |
| `in-pm` | INDIANA EVENING | `IN-EVEN` |
| `la-pm` | LOUISIANA EVENING | `LOUI-EVEN` |
| `fl-pm` | FLORIDA PM | `FL-PM` |
| `oh-pm` | OHIO EVENING | `OHIO-EVEN` |
| `tn-pm` | TENNESSEE EVENING | `TN-EVEN` |

**No verificados aún en las páginas 2–3:** FLORIDA AM, OHIO MIDDAY, TENNESSEE MORNING, TENNESSEE MIDDAY e INDIANA MIDDAY. La ausencia en las primeras 100 filas **no significa ausencia en los 247 registros**.

### Ajustes derivados

1. `src/rover/rows.js` ahora busca el **nombre principal exacto en la primera celda** y no presupone que `.loteria-abrev` contiene el nombre: la etiqueta secundaria puede representar el código. Se evita así vincular `FLORIDA PM` a `FLORIDA PM MARIAGE PALE`.
2. `src/ui/controls.js` monta el estado en la **primera celda** y no añade una columna a la tabla.
3. El localizador excluye el propio `[data-lnr-inline]` de la identidad; se añadió regresión en tests.
4. El diagnóstico `tests/browser/rover-dom-audit.user.js` separa nombre principal y abreviatura, sin recopilar valores de resultados.

**Alcance de la verificación:** los textos y nombres accesibles están confirmados mediante el árbol de Opera. No se ha podido inspeccionar el HTML crudo, atributos `loteria`, id de tabla, clases `res_tr` o manejadores de eventos. Las nuevas reglas DOM son hipótesis seguras sujetas a esa verificación. La entrada sigue desactivada y no debe ejecutarse llenado en Rover real.

### Pruebas

La actualización introduce regresiones unitarias y Playwright con **nombre principal + distintivo de código**. El resultado definitivo debe citar una ejecución GitHub Actions posterior a estos cambios. Las ejecuciones intermedias pueden fallar mientras se ajustan fixtures; no declararlas representativas de una versión final.
