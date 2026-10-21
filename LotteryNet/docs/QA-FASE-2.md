# QA de Fase 2 — Ejecutada, pendiente integración Rover real

**Fecha:** 2026-10-20. **Estado:** módulo inactivo, NO APTO PARA PRODUCCIÓN.  
**Diseño:** «En fila», iconos lineales, nueve estados y mensajes aprobados.

**Último avance:** Tampermonkey real sobre réplicas locales con aislamiento del sistema: Chromium en la sección 19 y **Firefox en la sección 20**. Rover autenticado y convivencia con todas las extensiones del usuario siguen pendientes.

## 1. Evidencia verificada

**GitHub Actions:** [LotteryNet QA, ejecución 39431580644](https://github.com/Nox1do/rover-lottery/actions/runs/39431580644) — conclusión: **SUCCESS**, dos trabajos completados.

| Comprobación | Resultado | Alcance de la evidencia |
| --- | --- | --- |
| Node.js 22, `npm test` | **22/22 OK, 0 fallos** | Suite de esa ejecución, con fecha Rover, identidad del sorteo y estado inline |
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

- [x] Ejecutar `npm test` completo (22 pruebas), `npm run build` y revisión de sintaxis en GitHub Actions.
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

**Ejecución de referencia previa con 21/21 Node + Playwright:** [GitHub Actions 39434128974](https://github.com/Nox1do/rover-lottery/actions/runs/39434128974).

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

La actualización introduce regresiones unitarias y Playwright con **nombre principal + distintivo de código**. Se detectó y corrigió que el indicador de estado añadido a la primera celda debía excluirse de la identidad del sorteo. **Regresión completa superada: 22/22 tests Node, 16 verificaciones en Chromium y 16 en Firefox (DOM simulado), cero eventos sintéticos/POST**, en [GitHub Actions 39438170804](https://github.com/Nox1do/rover-lottery/actions/runs/39438170804). **No confirma los selectores DOM reales ni seguridad con los demás userscripts de Rover.**

## 7. Rover autenticado — segunda página 101–200 (19/10/2026)

Opera Browser Connector confirmó en modo lectura que Rover mostraba la fecha **10/19/2026** y la paginación **«Showing 101 to 200 of 247 entries»**. En esa segunda página se identificaron tres sorteos adicionales, separados de sus códigos cortos:

| Sorteo del proyecto | Nombre principal visible | Código visible | Campos |
| --- | --- | --- | --- |
| \`fl-am\` | FLORIDA AM | \`FL-AM\` | \`primera, segunda, tercera, pick3, pick4\` |
| \`in-am\` | INDIANA MIDDAY | \`IN-MD\` | \`primera, segunda, tercera, pick3, pick4\` |
| \`tn-midday\` | TENNESSEE MIDDAY | \`TN-MD\` | \`primera, segunda, tercera, pick3, pick4\` |

**Control de identidad:** también se observó \`FLORIDA AM MARIAGE PALE\` con código \`FL-AM-MR\`. No pertenece al sorteo \`fl-am\` y nunca debe seleccionarse por coincidencia parcial.

**Balance:** **8 de 10** sorteos identificados en las páginas 1 y 2 mediante el árbol de accesibilidad. Faltan por localizar \`OHIO MIDDAY\` y \`TENNESSEE MORNING\`, posiblemente en la página 3 (201–247); aún no examinada. Esto verifica los **nombres accesibles y campos visibles**, pero **no** los selectores DOM crudos, atributos \`loteria\`, conexiones a Tampermonkey, manejadores de eventos ni Network.

**Operaciones:** no se editaron valores, no se enviaron solicitudes y no se presionaron botones de procesamiento desde el conector. Mantener la entrada del userscript funcional desactivada.

## 8. Rover autenticado — tercera página 201–247 (19/10/2026)

Opera Browser Connector confirmó en modo lectura:
- Fecha de Rover: **10/19/2026**.
- Paginación: **«Showing 201 to 247 of 247 entries»**.
- Dos sorteos pendientes localizados, con cinco inputs accesibles \`primera\`, \`segunda\`, \`tercera\`, \`pick3\` y \`pick4\`:

| Sorteo | Nombre principal visible | Código abreviado visible |
| --- | --- | --- |
| \`oh-am\` | OHIO MIDDAY | \`OHIO-MD\` |
| \`tn-morning\` | TENNESSEE MORNING | \`TN-MORNING\` |

### Consolidado: diez sorteos identificados

Los diez valores \`roverLabel\` de \`src/states/*.js\` coinciden exactamente con los **nombres principales mostrados en el árbol de accesibilidad de Rover**, para la fecha y paginación examinadas.

| ID del proyecto | Nombre principal Rover | Código abreviado Rover | Página |
| --- | --- | --- | --- |
| \`fl-am\` | FLORIDA AM | \`FL-AM\` | 2 |
| \`fl-pm\` | FLORIDA PM | \`FL-PM\` | 1 |
| \`la-pm\` | LOUISIANA EVENING | \`LOUI-EVEN\` | 1 |
| \`oh-am\` | OHIO MIDDAY | \`OHIO-MD\` | 3 |
| \`oh-pm\` | OHIO EVENING | \`OHIO-EVEN\` | 1 |
| \`tn-morning\` | TENNESSEE MORNING | \`TN-MORNING\` | 3 |
| \`tn-midday\` | TENNESSEE MIDDAY | \`TN-MD\` | 2 |
| \`tn-pm\` | TENNESSEE EVENING | \`TN-EVEN\` | 1 |
| \`in-am\` | INDIANA MIDDAY | \`IN-MD\` | 2 |
| \`in-pm\` | INDIANA EVENING | \`IN-EVEN\` | 1 |

**Total de identidades visuales: 10/10 confirmadas.** Los números de página se refieren a la tabla paginada de 247 registros observada el 19 de octubre, no al orden fijo de futuras búsquedas.

**Importante:** el código abreviado es **texto visible**, no prueba del contenido de un atributo HTML \`loteria\` ni de un ID de base de datos. El árbol de accesibilidad tampoco verifica \`#tableResult\`, \`.res_tr\`, el HTML crudo ni las acciones de Tampermonkey. La fase de integración real y la auditoría de posibles eventos y POST siguen **pendientes**. No instalar ni activar el llenado funcional hasta concluir esas pruebas.

**Operación de inspección:** sin editar inputs, sin pulsar procesamiento ni enviar resultados. La entrada principal de LotteryNet permanece inactiva.

## 9. Diagnóstico sin coincidencias con tabla válida (2026-10-20)

El usuario ejecutó `__LOTTERYNET_DOM_AUDIT__.print()` en Rover autenticado: `#fecha` válido (`2026-10-19`), `#tableResult` presente, `tableRows: 247`, pero `candidates: []` y las diez identidades ausentes. Repitió con `2026-10-20`: `tableRows: 14`, `candidates: []`.

**Interpretación:** la lectura de fecha/tabla funciona; el filtro del nombre principal falla. La versión anterior solo leía los elementos hijos directos y podía concatenar el nombre con el distintivo abreviado dentro de un mismo contenedor HTML.

**Corrección candidata:** lectura recursiva de nodos de texto, excluyendo `.loteria-abrev`, indicadores propios y controles. Diagnóstico **0.2.0**, con conteos `inspectedRows`, `matchedRows`, `rowsWithoutReadableMainName`. Pruebas automatizadas con HTML **simulado** que reproduce un contenedor anidado; hasta recibir nuevo informe del diagnóstico, **la causa DOM real sigue sin verificarse**.

El `SyntaxError: unexpected token: identifier` comunicado ocurrió durante una entrada adicional de consola; el `print()` independiente devuelve datos, por lo que ese error no demuestra que falle el userscript.

**Seguridad:** sin operaciones sobre inputs, sin red, sin procesamiento, sin entrada funcional activa.

## 10. Nuevo diagnóstico de identidad v0.3.0 (2026-10-20)

La versión 0.2.0 sigue informando 247 filas, cero filas sin texto y cero coincidencias en Rover real. La causa exacta de la estructura HTML continúa sin determinarse.

La versión 0.3.0 comprueba el nombre completo exacto y también la cadena exacta nombre + código abreviado, confirmada visualmente, por ejemplo FLORIDA AM + FL-AM. Informa coincidencias cercanas por separado sin autorizarlas para llenado; no recopila los valores de resultados ni modifica la página. Los diagnósticos de estructura informan solo etiquetas CSS, número de caracteres y nombre de sorteo conocido.

La regresión Playwright incluye la variante de nombre + código sin la clase de abreviatura y excluye FLORIDA AM MARIAGE PALE del sorteo estándar. Pendiente ejecutar v0.3.0 en Rover autenticado para establecer los selectores definitivos.

## 11. HTML real: causa raíz comprobada (2026-10-20)

Archivos aportados: `Pasted text(20261020-153237).txt` y `verResultados2(1).php`. Se examinó la estructura **localmente**, sin publicar historial ni valores de resultados. En 247 filas, la primera celda `td` está **oculta** y contiene la hora interna de ordenación; la segunda tiene `.loteria-nombre` y `.loteria-abrev` dentro de un tooltip. Eso explica `matchedRows: 0` en las versiones 0.2/0.3, que inspeccionaban la primera celda como si fuera el nombre.

Las diez identidades aprobadas se encontraron **exactamente una vez**; cada una contiene exactamente los cinco inputs `primera`, `segunda`, `tercera`, `pick3`, `pick4` con atributo `loteria` igual al código abreviado publicado. El código de Rover se registró como `roverCode` en `src/states/` y el localizador exige coincidencia estricta de **nombre + código abreviado + los cinco códigos `loteria`**. Si falta alguno, no escribir.

`rover-dom-audit.user.js` v0.4.0 utiliza estos selectores exactos y conserva su política de solo lectura. La regresión de navegador usa un fixture **sintético sin resultados ni historiales** que respeta las dos celdas y sus atributos.

**Permanece pendiente:** ejecutar el diagnóstico v0.4.0 en Rover autenticado, verificar convivencia y Network antes de activar cualquier llenado. `src/index.js` sigue inactivo.

## 12. Identidad DOM confirmada por el usuario en Rover autenticado — 2026-10-20

Diagnóstico v0.4.0 ejecutado en una sesión real de Tampermonkey, para la fecha seleccionada `2026-10-19`:

- `#fecha`: presente y válido, `2026-10-19`.
- `#tableResult`: presente; `tableRows: 247`, `inspectedRows: 247`.
- `matchedRows: 10`, `rowsWithoutReadableMainName: 0`.
- Diez nombres únicos en `candidates`: INDIANA EVENING, LOUISIANA EVENING, FLORIDA PM, OHIO EVENING, TENNESSEE EVENING, FLORIDA AM, INDIANA MIDDAY, TENNESSEE MIDDAY, OHIO MIDDAY, TENNESSEE MORNING.
- Los diez registros reportan `mainNameFound: true`, `shortCodePresent: true`, `resTr: true`, los cinco campos `primera,segunda,tercera,pick3,pick4` y `loteriaAttrs: 5`.

**Conclusión:** identificación estructural de las diez loterías confirmada en Rover real; ya no existe el fallo de `matchedRows: 0`. El extracto de consola no muestra explícitamente los arrays expandidos `missing` y `duplicate`, pero las diez etiquetas distintas reportadas cubren el alcance aprobado.

**Pendiente:** probar eventos, coexistencia con los otros userscripts, restauración con Search y Network para demostrar **cero procesamiento/guardado**. El diagnóstico fue de solo lectura; no habilita ni ejecuta llenado real. `src/index.js` permanece inactivo.

## 13. Auditoría de convivencia: eventos y procesamiento (2026-10-20)

### Evidencia de código estático

Se inspeccionaron los scripts de referencia existentes en este repositorio, sin ejecutar solicitudes contra Rover:

- `src/rover/fill-ui.js`: asigna `input.value` directamente y **no invoca** `dispatchEvent`, `fetch`, `click` ni rutas de procesamiento. Esta observación se complementa con pruebas y sigue condicionada a que otro script no intercepte el setter `value`.
- `Loterias USA/versions/Rovs-Loterias-USA-v0.6.5.user.js`: `triggerInput()` emite `input`, `change` y `blur`. Su POST examinado es autenticación **a API externa de Ohio**, no a Rover.
- `Loterias RD/Rs Loterías Rd-1.3.1.user.js`: los escuchadores de edición pueden cancelar una operación de seguimiento; el POST examinado apunta **a Facebook**. Esta revisión de código **no equivale** a una validación de todos los posibles efectos en tiempo real.
- `virtual lottery/virtual-lottery v2 auto.user.js`: contiene `autoPost('__inc/procesarResultados.php', ...)` y puede procesar mediante su propia lógica de liderazgo y cronograma, **independientemente** de LotteryNet. Sus escuchadores de `#fecha` gestionan cambios de fecha. Su observador de resultados filtra `tr.res_tr` agregados, ignorando los indicadores internos en filas ya existentes.
- En los dos HTML de Rover aportados no se encontraron atributos inline `oninput`, `onchange` ni `onblur`. **Esto no detecta** listeners delegados, listeners añadidos por JavaScript, setter personalizado ni otras pestañas.

### Regresión hostil aislada, sin tocar Rover

`tests/browser/isolated-rover.mjs` instala en un fixture local listeners ficticios que intentarían hacer POST a `/__inc/procesarResultados.php` al recibir `input`, `change` o `blur`. Ejecuta `fillVisualInputs` y la interfaz `mountInlineStatus`, y comprueba que no se activa el envío ni se hace clic sobre el botón de proceso. También confirma que los detectores pasivos registran cero eventos sintéticos. La prueba usa únicamente `127.0.0.1`, no la página auténtica.

### Diagnóstico pasivo para Rover real

Nuevo archivo **`tests/browser/rover-safety-audit.user.js`** (`v0.1.0`), independiente del diagnóstico DOM v0.4.0. No lee el contenido de inputs ni de historial, ni consulta Lottery.net, ni hace solicitudes a Rover, ni modifica los inputs, ni instala interceptores de `fetch` o `XMLHttpRequest`. Ofrece:

- `__LOTTERYNET_SAFETY_QA__.print()`: inventario de los diez sorteos, cinco campos y presencia de manejadores **inline** `oninput/onchange/onblur` o en propiedades DOM.
- `__LOTTERYNET_SAFETY_QA__.observe()`: añade temporalmente listeners pasivos en fase de captura y **cuenta** eventos que se produzcan por actividad normal, sin provocarlos. `stop()` los desengancha.
- **No permite concluir que no existan listeners de `addEventListener`**, que no existan POST en background ni conocer su método/iniciador de Network.

### Condiciones de seguridad que siguen bloqueadas

- [x] Revisar en el código fuente conocido la presencia de procesamiento explícito y diferencias entre scripts.
- [x] Preparar detector pasivo sin lectura de valores y regresión de conviviencia con manejadores hostiles simulados.
- [x] Ejecutar `print()` en Rover autenticado: 10/10 filas, 50/50 atributos, **cero manejadores inline y propiedades**.
- [ ] Observar eventos durante actividad normal con `observe()` y `stop()`, distinguiendo contador inactivo de medición real.
- [ ] Verificar, en un entorno seguro, que el llenado de LotteryNet no provoca procesamiento indirecto.
- [x] Probar convivencia **simulada** cuando LotteryUSA se utiliza manualmente (Chromium y Firefox): bloqueo de sobrescrituras por LotteryNet, casos parciales y restauración.
- [ ] Probar la misma convivencia con los userscripts realmente instalados en un entorno real aislado, sin permitir procesamiento.
- [ ] Auditar DevTools Network con **Preserve log**, incluyendo `__inc/procesarResultados.php`, método, hora e iniciador, sin compartir cabeceras, cookies ni cuerpos de petición.
- [x] Confirmar alcance separado de Virtual Lotteries: cero códigos compartidos en los scripts revisados; no atribuir sus POST a LotteryNet sin evidencia de causalidad.
- [ ] Antes de una prueba real de llenado, asegurar aislamiento/entorno permitido y confirmación de **cero procesamiento accidental**, con evidencia de cambios reales de UI y registro de Network.

**Decisión de esta etapa:** no habilitar `src/index.js` ni distribuir LotteryNet como funcional. Esta auditoría es exploratoria: la prohibición de guardar/procesar sigue vigente y falta completar el escenario auténtico.

## 14. Separación real de sorteos y disparadores (aclaración del usuario, 2026-10-20)

**El usuario confirma dos restricciones operativas:**
- **Virtual Lotteries v2 Auto gestiona sorteos distintos de LotteryNet.** La revisión del objeto `LOTERIAS` en `virtual lottery/virtual-lottery v2 auto.user.js` confirmó que sus códigos incluyen Pick and Win (`WIN-*`), Rapid (`RPL-*`), Premier, Brazil/QPlay y Queen (`QLT-*`), entre otros; **ninguno** coincide con los diez `roverCode` aprobados para LotteryNet (FL/LA/OH/TN/IN). Sus consultas y POST pertenecen a sus propias loterías y **no deben usarse como evidencia de que LotteryNet guarda o procesa**. El procesamiento `autoPost('__inc/procesarResultados.php')` está limitado en el código revisado a los códigos de su configuración automática, no a una fila de LotteryNet.
- **Rovs Loterías USA opera manualmente por botones.** En `Loterias USA/versions/Rovs-Loterias-USA-v0.6.5.user.js`, `btn.onclick = () => executeScrape(...)` inicia la consulta; no se encontró un disparador AUTO periódico para llenar esas filas. Coincide con LotteryNet en los **diez sorteos**, pero **no compite de manera automática** cuando nadie pulsa sus botones.

### Matriz de riesgo ajustada

| Proyecto concurrente | Sorteos compartidos con LotteryNet | Escritura automática sobre esos sorteos | Qué verificar |
| --- | --- | --- | --- |
| Virtual Lotteries v2 Auto | **0 de 10** en la configuración revisada | No, gestiona loterías diferentes | No duplicar su UI/códigos; los POST propios no son atribuibles a LotteryNet sin causalidad demostrada |
| Rovs Loterías USA v0.6.5 | **10 de 10** | No: consultas iniciadas por botón | Si el usuario pulsa un botón luego de LotteryNet, la función `fillTable()` de LotteryUSA **puede sobrescribir valores**; probar la secuencia manual y evitar atribuir ese cambio a LotteryNet |
| LotteryNet (proyectado) | Solo sus 10 sorteos | AUTO aún desactivado | No sobrescribir distintos; ningún clic de procesar, evento sintético o POST a Rover; revalidar fecha/fila y no procesar |

**Conclusión corregida:** el riesgo principal NO es un procesamiento de Virtual Lotteries sobre los resultados de LotteryNet. El caso funcional de convivencia se concentra en **dos scripts que pueden llenar la misma fila solo cuando el usuario utiliza manualmente LotteryUSA**, además de eventos de página desconocidos. Mantener los scripts existentes activos; no requieren modificaciones por esta aclaración.

**Límites:** esta matriz procede de los archivos versionados y del modo de uso confirmado por el usuario. No equivale a inspeccionar todas las extensiones instaladas en el navegador. Un POST de Virtual Lotteries para sus propios sorteos puede aparecer en DevTools Network; la auditoría debe filtrar **código, fecha e iniciador** y distinguirlo de cualquier operación atribuible a LotteryNet. La validación de que LotteryNet nunca envía ni induce procesamiento sigue siendo obligatoria antes de activarlo.

## 15. Convivencia manual LotteryUSA: regresión aislada completa (2026-10-20)

**Aclaración operativa:** LotteryUSA v0.6.5 consulta y rellena únicamente al pulsar uno de sus botones; Virtual Lotteries trabaja con códigos de sorteos distintos de los diez de LotteryNet. No se alteró ninguno de los dos userscripts.

### Evidencia ejecutada

El nuevo test [\`tests/browser/manual-usa-overlap.mjs\`](../tests/browser/manual-usa-overlap.mjs) funciona en un servidor de pruebas **exclusivamente local (127.0.0.1)**, con una réplica **sintética y sin resultados reales** de las filas de Rover. Para que el comportamiento de eventos sea fiel, carga **solo la función \`triggerInput\` extraída literalmente** del código versionado de \`Rovs-Loterias-USA-v0.6.5.user.js\`, pero no ejecuta sus API, su función de consulta, su script completo ni ninguna solicitud a Rover.

| Caso | Comportamiento comprobado |
| --- | --- |
| Sin pulsar LotteryUSA | LotteryNet llena; el botón manual de LotteryUSA no es activado y sus contadores permanecen en cero |
| Pulsar LotteryUSA primero, valores distintos | LotteryNet devuelve \`CONFLICTO\`, no sobrescribe ninguna de las cinco casillas |
| Pulsar LotteryUSA primero, valores iguales | LotteryNet devuelve \`COINCIDENTE\`, cero escrituras |
| LotteryUSA solo llenó Pick 3 | LotteryNet preserva ambos campos del 3 y completa exclusivamente tres campos del 4 |
| LotteryNet primero, luego clic en LotteryUSA | El código legado de LotteryUSA **puede sobrescribir**; la siguiente pasada de LotteryNet devuelve \`CONFLICTO\` y **no deshace** el cambio manual |
| Rover reconstruye tabla tras Search | El caché de LotteryNet no restaura encima de valores diferentes introducidos por otro script |
| Fecha visible equivocada | Ningún campo se modifica |
| Carrera concurrente dentro de una escritura | Prueba unitaria simula que otro script cambia un campo durante el setter; LotteryNet aborta y restaura solo valores propios, conservando el nuevo valor manual |

Se verifican asimismo: cero POST/PUT/PATCH/DELETE provocados por LotteryNet en el fixture, cero clics al botón Procesar, ningún cambio en filas derivadas Mariage Pale o ajenas, y no emisión de eventos \`input/change/blur\` por LotteryNet. Los eventos de \`triggerInput\` sí se observan tras pulsar **el botón manual simulado**, tal como hace el script legado.

**GitHub Actions:** [ejecución de regresión y pruebas unitarias](https://github.com/Nox1do/rover-lottery/actions/runs/39455803575) — **26/26 Node**, jobs de Node y navegador completados con éxito; Chromium y Firefox validaron ambos conjuntos de casos.

**Límite:** esta batería demuestra la lógica de conflicto y la ausencia de procesamiento atribuible a LotteryNet en un entorno aislado. **No es una prueba de Tampermonkey ni del Rover autenticado con sus listeners reales.** Tampoco evita que el usuario presione manualmente LotteryUSA y este último sustituya valores: eso está fuera del control de LotteryNet.

### Gates que continúan abiertos

- [x] Convivencia manual con LotteryUSA simulada en Chromium y Firefox, incluidos conflictos, parciales y secuencias de ejecución.
- [x] Comportamiento ante escritura concurrente simulado en Node.
- [x] Ejecutar \`__LOTTERYNET_SAFETY_QA__.print()\` en Rover autenticado: 50 inputs y 0 handlers inline/propiedades; monitor de eventos `eventObserverActive=false` (no medido).
- [ ] Abrir DevTools Network con **Preserve log** y distinguir las solicitudes propias de Virtual Lotteries por iniciador y lotería; evitar compartir cuerpos, cookies o cabeceras.
- [ ] Validar efectivamente el llenado con los otros scripts en un entorno real **aislado y autorizado**, demostrando que LotteryNet no inicia ni induce procesamiento.

**Decisión:** el punto de entrada \`src/index.js\` sigue inactivo; sin botón ni AUTO funcional hasta completar los controles pertinentes.

## 16. Diagnóstico pasivo en sesión Rover autenticada — 20/10/2026

**Evidencia remitida por el usuario** mediante `__LOTTERYNET_SAFETY_QA__.print()`, del userscript QA `v0.1.0`:

| Campo observado | Resultado |
| --- | --- |
| `dateControlPresent` / `tableFound` | `true` / `true` |
| `rows` | `247` |
| Diez sorteos identificados una vez | `10/10` |
| `badge` correcto | `true` en los diez |
| Cinco inputs por sorteo | `5` en cada fila, `50/50` total |
| Atributos `loteria` coherentes | `5` en cada fila, `50/50` total |
| Manejadores `oninput/onchange/onblur` **inline** | `0` |
| Manejadores de propiedades DOM `oninput/onchange/onblur` | `0` |
| Inputs dentro de `form` | `0` |
| `eventObserverActive` | `false` |
| `untrustedEvents` | `0` (sin monitor activo) |

**Interpretación precisa:** la estructura, identidad y ausencia de manejadores **directos inline/propiedades** queda verificada en la sesión autenticada. **No puede declararse aprobada la ausencia de eventos sintéticos en vivo**, ya que el observador de eventos todavía no había sido activado (`eventObserverActive: false`). El valor `0` corresponde al contador inactivo. Tampoco es posible inferir del DOM que no existan listeners delegados por `addEventListener`, `MutationObserver`, interceptores de propiedades, peticiones en background o POST de otros scripts. Que los inputs no estén dentro de un `form` solo descarta esa estructura HTML; no elimina los envíos de JavaScript.

Los mensajes de Virtual Lotteries `[Fuentes] Botones instalados` no son evidencia de procesamiento. Ese script utiliza códigos de sorteo diferentes. LotteryUSA comparte las diez filas, pero su llenado es exclusivamente manual mediante botones en la versión revisada. Ninguno de los dos scripts se ha modificado.

### Próximo procedimiento no destructivo

1. Mantener `LotteryNet/src/index.js` **INACTIVO** y el diagnóstico pasivo habilitado; no pulsar Process/Save/Save All.
2. Ejecutar `__LOTTERYNET_SAFETY_QA__.observe()` para comenzar a contar los eventos **que ocurran normalmente**, sin provocarlos. Cerrar con `__LOTTERYNET_SAFETY_QA__.stop()`. Los contadores no prueban que no existan listeners.
3. Abrir DevTools → Network, activar **Preserve log**, identificar solicitudes con ruta `__inc/procesarResultados.php`; anotar solo método, marca de tiempo y origen/iniciador, **sin compartir cuerpos, tokens, cookies ni cabeceras**. Distinguir POST independientes de Virtual Lotteries sobre otros códigos de los diez sorteos de LotteryNet.
4. Si no aparece ningún POST, reportar solo **«sin POST observado durante esta ventana»**, no «procesamiento imposible». Dado que LotteryNet permanece desactivado, esto constituye **línea de base**, no prueba real de llenado ni causalidad.
5. Antes de habilitar un llenado de LotteryNet, requerir un entorno de ensayo autorizado y aislado o pruebas capaces de bloquear envíos; no disparar un procesamiento real para probar el detector.

**Puerta actual:** manejo inline/propiedades aprobado; monitor de eventos real, auditoría Network y prueba controlada de llenado siguen pendientes.

## 17. Observación pasiva activa y Network de base — 20/10/2026

El usuario remitió dos secuencias `observe()` → `stop()` del auditor v0.1.0. Ambas devolvieron `active: true` al iniciar y `eventObserverActive: false` al detener: este último valor es el estado normal después de `stop()`, no un fallo de activación.

La tabla inspeccionada tenía **39 filas**. El inventario posterior encontró exactamente una fila y cinco campos para **OHIO MIDDAY** y **TENNESSEE MORNING**; los otros ocho sorteos no estaban presentes en el DOM inspeccionado. Esta observación no reemplaza la comprobación estructural anterior de los diez sorteos sobre 247 filas.

- `untrustedEvents: 0` y `eventsByCode: {}` en ambas salidas: ningún evento elegible registrado en esas ventanas. `eventCounts` se recibió colapsado, sin sus valores individuales.
- No se recibió duración de las ventanas, fecha seleccionada ni prueba de que las filas permanecieran iguales durante toda la observación.
- Al preguntarle si apareció alguna solicitud en Network con el filtro `procesarResultados.php`, el usuario respondió **«No»**. Se registra como **sin solicitudes observadas con ese filtro durante la ventana reportada**, por confirmación del usuario, sin captura ni inspección directa de DevTools.
- Los mensajes de sesión HTTP de Loterías RD no aportan evidencia de envío ni de procesamiento de LotteryNet.

**Resultado:** línea de base pasiva parcial registrada para la vista con dos sorteos presentes. No se registró llenado de LotteryNet durante la observación; no acredita causalidad, ausencia de listeners ni ausencia de escrituras a otras rutas. No declarar A19 superado ni solicitar repetir el mismo ciclo pasivo como si validara un llenado.

### Siguiente ensayo pendiente

La siguiente evidencia útil es un **llenado controlado**, con bloqueo efectivo de las salidas de red antes de cualquier escritura de campos. Debe comprobarse primero que el mecanismo impide envíos, incluyendo los originados por la página y los userscripts; un filtro de DevTools solo observa y no bloquea. No sustituir ese aislamiento por interceptores parciales de `fetch`/XHR en la página.

El ensayo deberá registrar las filas realmente cubiertas, fecha y turno, conservación de valores existentes, cambios de UI, eventos y solicitudes intentadas, diferenciando las solicitudes bloqueadas de las efectivamente enviadas. Después deberá comprobar restauración tras Search y convivencia manual, y conservar los límites de la prueba. Las regresiones locales ya ejecutadas siguen siendo simulaciones, no este ensayo autenticado con Tampermonkey.

**Limitación de ejecución:** el conector de Opera disponible permite leer la interfaz, pero no ejecutar consola ni controlar Network o Tampermonkey. No se ha demostrado un mecanismo de bloqueo de red en esa sesión. Por tanto, el ensayo controlado no se ejecutó y `src/index.js` permanece **INACTIVO**; no se ha completado la Fase 2 ni activado AUTO.

## 18. Ensayo aislado con diez filas capturadas y bloqueo verificado — 20/10/2026

**Diseño aprobado por el usuario:** ampliar las pruebas existentes con las diez filas del HTML aportado, depuradas de datos e historiales; comprobar el bloqueo antes de llenar; respuestas locales y módulos reales; registrar intentos bloqueados y eventos. No activar la entrada de producción.

### Alcance y procedencia

`tests/fixtures/rover/ten-draws-sanitized.html` conserva la estructura seleccionada de diez filas únicas de `verResultados2(1).php` y cincuenta inputs vacíos. Se retiraron resultados, horas, historiales, IDs, atributos ajenos al localizador, acciones y scripts. El envoltorio de documento y la fecha seleccionada 19/10/2026 son del ensayo. La procedencia y el SHA-256 quedan en `tests/fixtures/rover/provenance.json`.

Los módulos de `src/` se ejecutan sin modificar. El HTML de los diez juegos de Lottery.net se responde con los fixtures ya versionados del 19/10/2026; el parser real identifica fecha, turno y dígitos antes de llenar. Los valores con ceros adicionales del escenario `leading-zeros` son datos sintéticos de prueba, no resultados oficiales.

### Bloqueo y controles

Antes de crear la página, el contexto de Playwright bloquea Service Workers e instala rutas HTTP/WebSocket. Solo los GET de recursos conocidos reciben respuestas estáticas; otras solicitudes se abortan y los sockets se cierran sin conectar con un servidor. Los registros conservan método, origen y path, sin cabeceras ni cuerpos.

1. Cada navegador demuestra primero que un POST sin protección llega al servidor receptor de `127.0.0.1`.
2. Bajo protección se intentan GET, POST, PUT, PATCH y DELETE a una ruta de proceso **del servidor local de prueba**, XHR, otro POST receptor, GET a un dominio reservado `.invalid`, beacon, formulario, popup y WebSocket: **doce intentos bloqueados**. Ninguno llega al receptor durante esta fase.
3. Se vuelve a cargar la tabla limpia y se mide el llenado aparte, manteniendo el bloqueo durante una ventana adicional de 500 ms antes de capturar los contadores finales de eventos/clics y comprobar Network. Los intentos deliberados anteriores no se atribuyen a LotteryNet. No se afirma ausencia de tareas diferidas para después de esa ventana.
4. Para evitar falsos positivos de políticas de acceso a redes privadas, la tabla y el receptor usan el mismo origen local. Un bypass deliberado debe llegar al receptor y hacer fallar el ensayo.

### Resultados locales

| Comprobación | Chromium 153.0.8010.0 | Firefox 153.0 |
| --- | --- | --- |
| Sorteos / campos cubiertos | 10 / 50 | 10 / 50 |
| Escenarios funcionales | 120 correctos | 120 correctos |
| Conexiones deliberadas bloqueadas | 12 | 12 |
| Solicitudes intentadas durante llenado | 0 | 0 |
| Solicitudes que llegaron al receptor durante fases protegidas | 0 | 0 |
| Eventos `input/change/blur` de llenado | 0 / 0 / 0 | 0 / 0 / 0 |
| Clics de procesamiento | 0 | 0 |
| Bypass deliberado del bloqueo | Detectado; prueba falla | Detectado; prueba falla |
| Emisión deliberada de `input` durante escritura | Detectada; prueba falla | Detectada; prueba falla |
| POST diferido con `setTimeout(..., 0)` | Detectado; prueba falla | Detectado; prueba falla |

Cada sorteo pasa los doce casos: llenado completo, idempotencia, solo juego 3, solo juego 4, ceros iniciales, conflicto previo, fecha cambiada, reconstrucción tipo Search/restauración, conflicto al restaurar, código `loteria` alterado, fila duplicada y fila ausente. El caso completo comprueba además mensajes de UI y ausencia de cambios en los otros nueve sorteos.

**Regresión:** `npm test` (28/28), `npm run build`, sintaxis del bundle, suite previa de DOM y suite de convivencia manual LotteryUSA, correctas. La entrada existente `isolated-rover.mjs` ejecuta también el ensayo nuevo; `npm run test:browser:blocked` lo ejecuta por separado. Posteriormente se verificó esta ampliación en [GitHub Actions 39467286725](https://github.com/Nox1do/rover-lottery/actions/runs/39467286725), con ambos trabajos correctos.

**Entorno:** Node 24.19.0 y Playwright 1.62.1. Chromium usa un ejecutable alternativo de `@sparticuz/chromium`; Firefox usa la descarga de Playwright. La descarga estándar de Chromium devolvió ZIP truncado. Firefox inicialmente falló al crear el namespace de su sandbox interno (`uid_map: EPERM`); la ejecución local correcta utilizó `MOZ_DISABLE_CONTENT_SANDBOX=1`. Son condiciones locales documentadas, no modificaciones de producción ni supuestos sobre el navegador del usuario.

**Evidencia:** [informe por navegador y caso](qa/network-blocked-2026-10-20.json) y [controles de mutación](qa/network-blocked-mutations-2026-10-20.json). Las mutaciones se retiraron antes de la ejecución final correcta; `src/` no tiene cambios.

**Corrección durante revisión:** antes de añadir la ventana final, una mutación que lanzaba POST en una tarea diferida produjo un falso `PASS`. Se reprodujo ese fallo, se añadió observación antes de serializar contadores y la misma mutación pasó a fallar en ambos motores por intento de solicitud. Se mantuvo el bloqueo durante toda la medición; la corrección afecta solo al ensayo.

### Límites y siguiente puerta

El ensayo utiliza procesos reales de Chromium y Firefox con una **copia depurada**, sin sesión autenticada, manejadores originales de Rover ni Tampermonkey. Los listeners hostiles y botones centinela son sintéticos; la convivencia manual previa utiliza solo la función `triggerInput` extraída de LotteryUSA. La reconstrucción de Search se reproduce reemplazando filas, sin llamar al AJAX de Rover.

El bloqueo cubre las páginas del contexto de prueba, no es un cortafuegos del sistema y no demuestra bloqueo del proceso de fondo de una extensión. La prueba real con Tampermonkey, otros userscripts instalados y Network autenticado sigue pendiente. No volver a pedir la misma observación pasiva como sustituto de esa prueba. **Fase 2/A19 reales no se declaran completos y `src/index.js` sigue INACTIVO.**

## 19. Tampermonkey real y aislamiento de red del sistema — 20/10/2026

**Resultado:** [GitHub Actions 39475193126](https://github.com/Nox1do/rover-lottery/actions/runs/39475193126), commit `ff4991c1d37b8a72a20aa50a25cead0c6b5b450b`: los tres trabajos terminaron **SUCCESS**. Incluye **30/30 pruebas Node**, build y auditoría de entrada inactiva, las regresiones Chromium/Firefox anteriores y el ensayo nuevo con gestor real. No se modificó `src/` ni se activó el userscript de producción.

### Gestor, instalación y procedencia

Se descargó por HTTPS el paquete estable de [Tampermonkey](https://www.tampermonkey.net/crx/tampermonkey_stable.crx), versión **5.4.1**, Manifest V3, fijando su SHA-256 a `a124e3189ecc0981ce79ef182dd3897a75fe22fc7bf0828e9d293ad7122d3d4d`. La descarga cambiante hace fallar el preparador hasta revisar el nuevo paquete. Se carga descomprimido, sin alterar su código ni manifiesto, en **Chromium 141.0.7390.37 / Playwright 1.56.1**. No se redistribuyen el CRX, la extensión ni los perfiles.

Esta carga de ensayo tiene un ID derivado de la ruta, distinto del de Chrome Web Store; la página de bienvenida muestra por ello una advertencia de ID no oficial. La evidencia acredita los bytes del paquete descargado y el funcionamiento del gestor real, **no una instalación desde la tienda**.

Cada fase utiliza un perfil nuevo y separado, sin sesión Rover ni otros userscripts del usuario. El controlador habilita el permiso nativo **Allow User Scripts**, verifica la API real y, mediante la interfaz de Utilities, importa el bundle de prueba, confirma la instalación y comprueba su entrada habilitada en el dashboard. Espera los registros de arranque de página y contenido creados por el propio gestor antes de navegar. No crea registros de sustitución ni implementaciones ficticias de GM.

El script de ensayo solo coincide con `http://127.0.0.1/rover.html*`; tiene permisos de conexión exclusivamente al fixture y al receptor IPv4 privado de control. Ambos perfiles ejecutaron exactamente el mismo bundle SHA-256 `26675c564e37390a671dbb0e909d17614d758db2a67cf1b5c404d5f144a638fb`. `GM_info` confirmó Tampermonkey 5.4.1, script 0.0.1 y `sandboxMode: raw`.

### Controles y resultados

Primero, sin aislamiento y sin llenar casillas, se demuestra que un POST de la página y otro de **GM_xmlhttpRequest real en background** llegan al receptor de control. Luego se inicia un proceso hijo mediante `sudo unshare --net`, que contiene Node, servidor local, Chromium y la extensión. Antes de cualquier llenado verifica un namespace distinto, única interfaz `lo` y cero rutas IPv4 externas. No se cambia el cortafuegos del host.

| Comprobación | Resultado |
| --- | --- |
| Control previo: POST de página / POST de GM | Ambos llegaron al receptor; GM respondió 200 |
| Namespace aislado | Distinto del padre; solo `lo`; 0 rutas externas |
| Mismo POST externo desde página / GM dentro del aislamiento | Fallaron con `TypeError` / `network-error` |
| Solicitudes recibidas por el receptor durante el aislamiento | **0** |
| GET de GM al servidor local dentro del aislamiento | Correcto; el gestor seguía operativo |
| GM_setValue / GM_getValue / GM_deleteValue | Correctos en ambas fases |
| Sorteos / campos | **10 / 50**, copia depurada de la sección 18 |
| Escenarios funcionales mediante el script instalado | **120 correctos**, mismos doce casos por sorteo |
| Eventos de llenado `input/change/blur` | **0 / 0 / 0** |
| Clics de procesamiento / escrituras al servidor local | **0 / 0** |
| Observación adicional antes de capturar contadores | **500 ms**, con aislamiento mantenido |

Los módulos reales y las aserciones independientes son los mismos de la regresión anterior; los HTML de Lottery.net son fixtures locales. El resultado acredita que **no escaparon solicitudes al receptor** bajo el aislamiento comprobado. No cuenta todos los intentos internos de red de la extensión ni declara «cero intentos de background».

### Correcciones y límites

El primer selector de instalación confundía el botón de URL de Utilities con la confirmación. Se delimitó al diálogo del gestor. Además, en un perfil nuevo el permiso de Chrome y los registros de arranque del gestor no están listos al mismo tiempo: el informe muestra cero registros al principio y ambos registros antes de navegar. Esperar estos registros permitió superar el control previo con las API reales.

Un intento que reutilizaba el perfil entre procesos no inició el script en la fase aislada; su causa no quedó determinada. El diseño final instala el bundle idéntico en dos perfiles nuevos y **no prueba persistencia de perfiles**. Tampoco valida Firefox con Tampermonkey, listeners originales de Rover, una sesión autenticada, todas las extensiones del usuario, AJAX real, AUTO o coordinación entre pestañas. La ausencia de eventos se mide durante los escenarios y la ventana indicada, sin promesas sobre tareas posteriores.

El contenedor local no permitía namespaces ni el perfil persistente de Chromium; por eso esta prueba se ejecutó en el runner de CI autorizado. Reproducir desde `LotteryNet/` en un runner Linux con Chromium completo y autorización para crear namespaces:

```sh
npm install --no-audit --no-fund --no-save playwright@1.56.1
npx playwright install --with-deps chromium
python3 tests/browser/tampermonkey/prepare-extension.py
node tests/browser/tampermonkey/run-isolated.mjs
```

**Evidencia:** [informe original de CI por fase y caso](qa/tampermonkey-isolated-2026-10-20.json). Artefacto de CI `12288427881`, ZIP SHA-256 `4956a8b692f7961d7c29e5a975c9885f5d0da1d62f18484f183992f79f218cd2`. El workflow publica solo JSON/PNG de diagnóstico, excluyendo perfiles y paquete de extensión.

Referencias primarias: [permiso userScripts de Chrome](https://developer.chrome.com/docs/extensions/reference/api/userScripts), [extensiones en Playwright](https://playwright.dev/docs/chrome-extensions) y [GM_xmlhttpRequest de Tampermonkey](https://www.tampermonkey.net/documentation.php?q=GM_xmlhttpRequest).

**Puerta pendiente:** integración autenticada y convivencia real en un entorno autorizado con bloqueo efectivo. Este ensayo no aprueba A19 en producción. `src/index.js` permanece **INACTIVO**; Fase 2 y AUTO no se declaran terminados.

## 20. Firefox real con Tampermonkey de Mozilla Add-ons — 20/10/2026

**Resultado:** [CI 39521594551](https://github.com/Nox1do/rover-lottery/actions/runs/39521594551), commit `6e891c985e0e36e1cdd0135032d088ef5c581d4e`: **cuatro trabajos SUCCESS**. Pasaron 34/34 Node, build y auditoría de entrada inactiva, regresiones anteriores y ensayos con Tampermonkey real en ambos navegadores. La adaptación a Firefox fue aprobada por el usuario porque es su navegador habitual.

### Plataforma y gestor comprobados

| Plataforma del ensayo | Gestor real | Manifest | Resultado |
| --- | --- | --- | --- |
| Firefox **158.0.1**, Selenium **4.51.0**, geckodriver **0.37.1** | Tampermonkey **5.5.0**, Mozilla Add-ons | V2 | **120/120** |
| Chromium **141.0.7390.37**, Playwright **1.56.1** | Tampermonkey **5.4.1**, paquete estable descomprimido | V3 | **120/120**, ensayo independiente |

Las distribuciones del gestor difieren; el resultado de Chromium no se usa como sustituto de Firefox. La prueba nueva ejecuta Firefox estable original en un runner Linux, no el Firefox modificado que distribuye Playwright ni la instalación Windows del usuario.

El XPI original de [Tampermonkey 5.5.0 en Mozilla Add-ons](https://addons.mozilla.org/firefox/downloads/file/4797143/tampermonkey-5.5.0.xpi), publicado por Jan Biniok (`derjanb`), queda fijado a SHA-256 `190031c78dbc5696114835601f2c8e6b855ad1e134df5df278f8fc158c065908`. Se verifica el manifiesto y GUID `firefox@tampermonkey.net`. Firefox lo instala mediante la API nativa de geckodriver como complemento no temporal; su AddonManager confirma **firma válida, estado activo y versión 5.5.0**. No se modifica ni recompone el paquete y no se deshabilita su comprobación de firma.

Geckodriver crea un perfil nuevo por fase. La opción documentada `--allow-system-access` se usa exclusivamente para leer esos metadatos y el UUID interno de la extensión en el perfil de pruebas; después se restaura el contexto de contenido. No se utiliza para ejecutar ni sustituir código GM o para llenar casillas. El userscript se importa y confirma mediante la UI real de Utilities, y el dashboard acredita que está habilitado. El bundle conserva su coincidencia exclusiva con la página local `http://127.0.0.1/rover.html*`.

### Controles y evidencia

Se reutilizan el mismo builder, los módulos reales, los doce casos por sorteo, los fixtures y las aserciones independientes de las secciones 18–19. El bundle ejecutado en ambas fases de Firefox tiene SHA-256 idéntico `0119be4a90947f2f56b897e7869e0b52aa8eb2e9886d9c391e135e64849ef60a`. `GM_info` confirma Tampermonkey 5.5.0, script 0.0.1, `sandboxMode: raw` y las API GM declaradas.

| Comprobación | Firefox + Tampermonkey real |
| --- | --- |
| Preflight: POST de página y POST de GM al receptor externo | Ambos recibidos; GM respondió 200 |
| Almacenamiento GM: escribir / leer / borrar | Correcto en ambas fases |
| Namespace de la fase aislada | Distinto del padre; solo `lo`; **0 rutas IPv4 externas** |
| Identidad del proceso en ambas fases | UID/GID **1001/1001**, usuario original no privilegiado |
| POST externo de página / GM bajo aislamiento | Ambos fallaron; el receptor recibió **0 solicitudes** durante la fase |
| GET de GM al fixture local bajo aislamiento | Correcto; el gestor seguía operativo |
| Sorteos / campos / escenarios | **10 / 50 / 120 correctos** |
| Eventos `input/change/blur` de llenado | **0 / 0 / 0** |
| Clics de procesamiento / escrituras al servidor local | **0 / 0** |
| Observación adicional antes de comprobar contadores | **500 ms**, con aislamiento mantenido |

El control positivo previo impide confundir una extensión inoperante con un bloqueo efectivo. El control local en la fase aislada demuestra que las llamadas GM funcionan mientras su salida externa falla. Se mide lo que llegó al receptor, sin afirmar que se cuentan todos los intentos internos de red de Firefox o de la extensión.

### Incidencias reproducidas y corregidas

Selenium intentó abrir el dashboard mientras el diálogo de importación todavía interceptaba el clic. El controlador ahora espera mediante una lectura de hit testing que el elemento quede descubierto y realiza un clic nativo; no fuerza el clic ni elimina el diálogo.

Después, el preflight pasó pero Firefox no arrancó bajo `sudo unshare`: su registro indicó que rechazaba ejecutarse como root en la sesión cuyo `XDG_RUNTIME_DIR` pertenecía a `runner`. Tras crear el namespace y levantar `lo`, el proceso vuelve mediante `sudo -u/-g` al UID/GID originales **dentro del mismo namespace**. El controlador comprueba ambas identidades antes de iniciar Firefox y conserva sus opciones de seguridad predeterminadas. La prueba corregida superó el mismo caso de arranque y los 120 escenarios.

### Reproducción y límites

Con Firefox y geckodriver oficiales en rutas absolutas y permiso para crear el namespace en un runner Linux no privilegiado, desde `LotteryNet/`:

```sh
npm install --no-audit --no-fund --no-save selenium-webdriver@4.51.0
python3 tests/browser/tampermonkey/prepare-firefox-extension.py
LOTTERYNET_QA_MANAGER_BROWSER=firefox \
FIREFOX_PATH=/ruta/absoluta/firefox \
GECKODRIVER_PATH=/ruta/absoluta/geckodriver \
FIREFOX_EXPECTED_VERSION=158.0.1 \
node tests/browser/tampermonkey/run-isolated.mjs
```

La selección Firefox exige sus ejecutables y su controlador propios; una configuración incompleta o un nombre de navegador desconocido falla, sin sustituirse por Chromium. El workflow descarga Firefox 158.0.1 y geckodriver 0.37.1 antes del aislamiento. Publica únicamente JSON/PNG y excluye perfiles, XPI y bundle instalado.

**Informe original:** [firefox-tampermonkey-isolated-2026-10-20.json](qa/firefox-tampermonkey-isolated-2026-10-20.json), copiado sin modificar desde el artefacto `12310879522`. ZIP SHA-256 `8b40c2e141c1355ddea589874b180456cae2b84aebfe062daf68c63863c4ef48`. Los timestamps del informe están en UTC; la ejecución corresponde al 20/10 en la zona del cliente.

Referencias primarias: [Selenium Firefox Driver](https://www.selenium.dev/selenium/docs/api/javascript/module-selenium-webdriver_firefox-Driver.html), [geckodriver — flags](https://firefox-source-docs.mozilla.org/testing/geckodriver/Flags.html), [Tampermonkey en AMO](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/).

**Alcance pendiente:** esta evidencia cubre Firefox y Tampermonkey reales sobre una copia local, en Linux y sin sesión autenticada ni los demás userscripts del usuario. No valida Windows, su perfil instalado, listeners/AJAX reales de Rover, persistencia entre reinicios, AUTO ni multitab. Producción continúa inactiva; Fase 2/A19 en Rover autenticado y convivencia real siguen pendientes.

