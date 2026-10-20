# QA de Fase 2 — Ejecutada, pendiente integración Rover real

**Fecha:** 2026-10-20. **Estado:** módulo inactivo, NO APTO PARA PRODUCCIÓN.  
**Diseño:** «En fila», iconos lineales, nueve estados y mensajes aprobados.

## 1. Evidencia verificada

**GitHub Actions:** [LotteryNet QA, ejecución 39431580644](https://github.com/Nox1do/rover-lottery/actions/runs/39431580644) — conclusión: **SUCCESS**, dos trabajos completados.

| Comprobación | Resultado | Alcance de la evidencia |
| --- | --- | --- |
| Node.js 22, `npm test` | **22/22 OK, 0 fallos** | Suite completa actual, con fecha Rover, identidad del sorteo y estado inline |
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
- [ ] Revisar `print()` del detector pasivo en Rover autenticado y comprobar que los manejadores locales no procesen tras actividades de LotteryNet.
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
- [ ] Ejecutar \`__LOTTERYNET_SAFETY_QA__.print()\` en Rover autenticado para reconocer listeners **inline** y por propiedad del DOM (no detecta todos los listeners).
- [ ] Abrir DevTools Network con **Preserve log** y distinguir las solicitudes propias de Virtual Lotteries por iniciador y lotería; evitar compartir cuerpos, cookies o cabeceras.
- [ ] Validar efectivamente el llenado con los otros scripts en un entorno real **aislado y autorizado**, demostrando que LotteryNet no inicia ni induce procesamiento.

**Decisión:** el punto de entrada \`src/index.js\` sigue inactivo; sin botón ni AUTO funcional hasta completar los controles pertinentes.
