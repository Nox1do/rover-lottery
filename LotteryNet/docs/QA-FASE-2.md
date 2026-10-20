# QA de Fase 2 — Estado preliminar

**Fecha:** 2026-10-20. **No apto para producción.** Diseño aprobado «En fila», iconografía lineal y nueve estados exactos.

## Evidencia disponible

Se ejecutaron **20 comprobaciones directas de lógica en V8** sobre los archivos publicados en GitHub, con objetos DOM simulados:

- Identidad inequívoca de fila, nombres de campos, fecha y rechazo de duplicados.
- Conservación de ceros iniciales, mapeo completo de cinco campos y resultados parciales.
- Idempotencia, protección de valores previos y no sobrescritura por conflicto.
- Caché local y restauración visual solo cuando la fecha corresponde.
- Nueve mensajes y sus transiciones, con ausencia de controles Fase 3.
- Ausencia de llamadas de red y de `dispatchEvent` en los módulos del motor.
- `src/index.js` continúa inactivo.

Existen pruebas Node en `tests/unit/rover-visual.test.js` y `tests/unit/inline-ui.test.js`, pero **no se ha ejecutado la suite completa `npm test` ni `npm run build`** sobre una copia íntegra del repositorio.

## Comprobaciones necesarias antes de activar

- [ ] Ejecutar `npm test` y `npm run build` en el repositorio.
- [ ] Verificar la etiqueta `.loteria-abrev` en cada una de las diez filas del Rover real y confirmar que contiene los nombres esperados.
- [ ] Verificar `#fecha`, los cinco inputs y el atributo `loteria` en la tabla inicial y tras Search.
- [ ] Probar escritura de valores y restauración sin afectar correcciones manuales.
- [ ] Revisar compatibilidad con Rovs Loterías USA y Virtual Lotteries instalados.
- [ ] Verificar iconos y mensajes con Tampermonkey en Firefox y Chrome/Chromium.
- [ ] Comprobar con Network que no se envían solicitudes POST/PUT/PATCH/DELETE ni se procesa de forma indirecta.
- [ ] Validar cambio de fecha, vista AJAX, desaparición de fila y carga tardía.

## Límites y seguridad

El código de `src/rover/fill-ui.js` modifica únicamente `input.value` **sin emitir eventos `input`, `change` o `blur`**, para evitar activar manejadores desconocidos hasta su inspección. No hay botón de consulta funcional, scheduler ni enlace desde `src/index.js`: la distribución operativa sigue suspendida.

La coincidencia de identidad es deliberadamente exacta. Si Rover usa nombres abreviados en `.loteria-abrev`, el llenado se bloqueará; no se habilitará una coincidencia aproximada sin validar una alternativa inequívoca.

**Regla invariable:** consultar, validar, completar inputs visibles y detenerse. Nunca guardar/procesar en Rover.
