# UI-SPEC — LotteryNet / Rover

> **Estado:** especificación de diseño **APROBADA** el **2026-10-20** por el usuario.
> **Fase:** 2.2, 2.3 y 2.4 de [PLAN-LotteryNet-Rover.md](../PLAN-LotteryNet-Rover.md).
> **Alcance:** presentación visual. **No representa implementación funcional ni pruebas en Rover.**

## 1. Decisión aprobada

- **Distribución:** `En fila` (inline). Un indicador compacto **dentro de la misma fila del sorteo** junto a la identificación de la lotería, sin panel flotante independiente y sin barra global adicional.
- **Iconografía:** `Lineal`, utilizando iconos de [Lucide](https://lucide.dev/icons/). Deben mantenerse visualmente consistentes (trazo, tamaño y alineación) en todos los estados.
- **Mensajes:** usar **exactamente** los textos del catálogo de la sección 2. No agregar `Lottery.net`, `Rover` ni puntos suspensivos a los mensajes **«Buscando sorteo»** y **«Consultando»**.
- **Acción individual propuesta para Fase 3:** icono `refresh-cw` junto al estado de la fila, con nombre accesible **«Consultar y llenar»**. Su ubicación es parte del diseño aprobado; su funcionamiento se implementará y probará en la **Fase 3**, no en este documento.
- **Sin procesamiento:** un indicador de éxito confirma únicamente que las **casillas visibles** están llenas; no significa que los datos se hayan procesado, guardado, confirmado ni enviado al servidor de Rover.
- **Convivencia:** la UI debe coexistir con el HTML original de Rover y otros userscripts sin cubrir elementos interactivos ni duplicarse tras Search.

## 2. Catálogo definitivo de estados e iconos

| Estado interno | Icono lineal Lucide | Mensaje principal aprobado | Intención visual |
| --- | --- | --- | --- |
| `BUSCANDO` | `search` | **Buscando sorteo** | Neutro: localizando identidad y fila |
| `CARGANDO` | `loader-circle` | **Consultando** | Informativo: consulta/extracción en curso |
| `COMPLETADO` | `circle-check` | **Casillas completadas** | Éxito visual; **no procesado** |
| `ERROR` | `circle-alert` | **Error al consultar o llenar** | Error técnico de la consulta o llenado |
| `PENDIENTE` | `clock-3` | **Resultado aún no disponible** | Sorteo sin resultados publicados elegibles |
| `PARCIAL` | `circle-dot` | **Resultado parcialmente disponible** | Uno de los juegos está disponible; faltan campos |
| `COINCIDENTE` | `check-check` | **Los valores ya coinciden** | Valores visibles ya idénticos; sin reescritura |
| `CONFLICTO` | `triangle-alert` | **Los valores existentes son diferentes** | No sobrescribir datos visibles |
| `SIN_FILA` | `search-x` | **No se encontró la fila correspondiente** | Falta coincidencia inequívoca con el sorteo |

### Estilo visual

La propuesta aprobada utiliza iconos **lineales**; la intención cromática es semántica, sin fijar códigos hexadecimales hasta comprobar la integración con el tema de Rover:

- `BUSCANDO`, `PENDIENTE`: tono neutro, sin alarma.
- `CARGANDO`: tono informativo y animación ligera del icono `loader-circle`.
- `COMPLETADO`, `COINCIDENTE`: acento de éxito, con **significado exclusivo de interfaz**.
- `PARCIAL`, `CONFLICTO`: tono de atención distinto de éxito y de error.
- `ERROR`, `SIN_FILA`: tono de error, acompañado siempre de icono y texto.

**No usar color como única señal de estado.** Respetar contraste, reducción de movimiento del sistema (`prefers-reduced-motion`) y legibilidad en modos claro y oscuro. No se aprueban por este documento nuevos códigos de color o tamaños absolutos.

## 3. Representación estructural aprobada

Vista **En fila**, junto al título del sorteo:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ FLORIDA AM                 [✓] Casillas completadas     [↻]           │
│                                                                        │
│       1RA         2DA         3RA        PICK 3       PICK 4           │
│       [07]        [08]        [32]       [407]        [0832]           │
└──────────────────────────────────────────────────────────────────────────┘
```

Los valores del ejemplo son **ilustrativos**, no resultados actuales. El indicador debe aparecer junto al título de **cada** sorteo y actualizarse de forma individual. El control `[↻]` representa la acción futura **«Consultar y llenar»**; no debe simular un procesamiento.

**Distribuciones descartadas en esta aprobación:** `Barra + fila` y `Panel`. No añadirlas a la implementación por defecto sin nueva aprobación.

### Responsive y compatibilidad

- En pantallas estrechas, el indicador y la acción se mantienen asociados **a su misma fila**, permitiendo acomodar el texto sin ocultar la identidad del sorteo.
- Los mensajes largos pueden usar truncamiento visual únicamente si el texto completo permanece accesible (por título accesible, tooltip o detalle equivalente). **No alterar el texto canónico del estado.**
- El botón solo se representará cuando la vista activa de Rover corresponda a la tabla de loterías; la integración no debe crear un botón por re-render.
- No ocultar, reemplazar, desactivar ni desplazar de forma invasiva los inputs o controles de Rover.

## 4. Reglas de presentación y transición

1. `BUSCANDO`: comienza la identificación de la fila o sorteo; termina cuando se identifica una fila inequívoca o se detecta ausencia/ambigüedad.
2. `CARGANDO`: inicia la consulta a la fuente o análisis de respuesta. El icono puede girar durante la operación y **debe detenerse** al finalizar o cancelarse.
3. `PENDIENTE`: no se encuentra todavía un resultado válido para fecha y turno solicitados; **no rellenar** por aproximación.
4. `PARCIAL`: hay datos primarios completos de solo uno de los juegos o un subconjunto elegible; indicar el carácter parcial, no inventar cifras faltantes.
5. `COMPLETADO`: resultado(s) elegible(s) aplicado(s) a todos los inputs esperados de la fila visible. **Nunca usar como sinónimo de `PROCESSED`.**
6. `COINCIDENTE`: valores previamente visibles idénticos; **no volver a escribirlos**.
7. `CONFLICTO`: valor válido distinto ya presente, fecha/turno no corresponde o coincidencia ambigua que impide una escritura segura; **no sobrescribir**.
8. `SIN_FILA`: no se encuentra exactamente una fila compatible con el sorteo/fecha visibles; no escribir en otra fila.
9. `ERROR`: se produce error de red, HTML, extracción o llenado; no mostrar éxito ni procesar.

El estado debe corresponder **al sorteo de esa fila**. Las operaciones deben ser cancelables o ignoradas si se cambia la fecha, vista o identidad antes de completarse. Las animaciones no deben quedar indefinidas al finalizar una operación.

La UI no ejecutará solicitudes de guardado, procesado, confirmación o publicación a Rover, directamente ni mediante sus eventos. **La prohibición de procesamiento también aplica a los estados visuales y textos del sistema.**

## 5. Fronteras de fase

| Elemento | Fase | Estado |
| --- | --- | --- |
| Representación visual `En fila` e iconografía lineal | 2.2–2.4 | **Aprobado por el usuario** |
| Textos canónicos de los nueve estados | 2.3 | **Aprobados por el usuario** |
| `docs/UI-SPEC.md` y alineación con plan maestro | 2.4 | **Documentado** |
| Localizador seguro de filas e inputs de Rover | 2.1 | Código implementado; pendiente prueba con DOM real |
| Indicadores reales montados en Rover | 2.5 | Renderizador implementado, entrada inactiva; pendiente integración en navegador |
| Llenado de inputs, detección de conflictos y restauración | 2.5–2.6 | Módulos implementados e inactivos; pendientes pruebas reales |
| Botón funcional, AUTO, multitab y reintentos | 3 | Pendiente |
| Pruebas de navegador y ausencia de POST/guardado accidental | 4 | Pendiente |

**La aprobación visual NO autoriza activar el llenado o publicar un userscript funcional sin pasar sus respectivas pruebas.**

**Implementación técnica preliminar (2026-10-20):** los nueve estados del renderizador se han comprobado mediante pruebas directas; `src/index.js` permanece inactivo. No se ha verificado su integración real con Rover ni con otros userscripts. Véase [QA-FASE-2.md](QA-FASE-2.md).

## 6. Criterios de aceptación de la implementación

- Cada fila exhibe como máximo un indicador de estado y una acción manual cuando esta se implemente.
- Los nueve estados usan el icono y **mensaje exactos** de la sección 2.
- `BUSCANDO` muestra **«Buscando sorteo»**; `CARGANDO` muestra **«Consultando»**.
- No aparece panel flotante ni barra global adicional.
- El estado no oculta el nombre ni los cinco campos y resiste reconstrucciones tras Search.
- Los indicadores operan correctamente en estado parcial, coincidente, conflicto, ausencia de fila y error.
- La animación de `CARGANDO` termina con el estado; se respeta reducción de movimiento.
- Los estados `COMPLETADO` y `COINCIDENTE` se refieren exclusivamente a la pantalla.
- La captura de red y pruebas con otros scripts demuestran **cero procesamiento/guardado** durante llenado y eventos de interfaz.

## 7. Historial de decisiones

- **2026-10-20:** aprobado **En fila** + iconografía **Lineal** + nueve mensajes y estados de la Fase 2 + regla de **solo llenado visual, nunca procesamiento**. Aprobación recibida explícitamente del usuario.
