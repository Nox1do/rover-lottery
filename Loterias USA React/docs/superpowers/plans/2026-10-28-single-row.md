# Single-row USA bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Publicar la barra de una fila aprobada como v0.0.17.
**Architecture:** Mantener `createInterface(onQuery)` y el adaptador; cambiar únicamente presentación, placeholder y geometría mínima. Una altura de fila compartida entre geometría y CSS evita recortes al redimensionar.
**Tech Stack:** JavaScript vanilla, CSS Grid, Firefox/Playwright con React de pruebas.
**Spec:** `../specs/2026-10-28-single-row.md`.

## Global Constraints

- Fuente en `src/`, sin React en producto y sin nuevas dependencias.
- No modificar proveedores, transporte, fecha, guardado ni Procesar.
- Conservar identidad, 75 loterías, resaltado, controles y actualizaciones de Tampermonkey.
- Versiones históricas inmutables; documentación, build/test/release/check y raw verificados.

## Review Focus

- Scrollbars clásicos no deben cortar la fila ni interceptar sus botones.
- A 320 px todos los controles siguen accesibles y los botones táctiles no se solapan.
- Zoom, esquinas y cambio de orientación conservan anclaje y tamaño mínimo útil.
- El placeholder usa GM_info o APP_VERSION y no cambia el filtro al escribir/borrar.
- Compactar después de ampliar conserva consulta/categoría y vuelve a una fila.

### Task 1: Presentación, geometría y publicación

**Files:** `src/ui.js`, `tests/firefox.cjs`, README, CHANGELOG, PARIDAD, metadata/package/lock y distribuibles generados.
**Interfaces:** Consume `createInterface(onQuery)` y `GM_info.script.version`; conserva `setStatus`, `setContext`, `highlightFields`, `revealFields`.

- [x] Ejecutar baseline Firefox 0.0.16 y registrar el resultado.
- [x] Escribir/regenerar expectativas del diseño: una fila al abrir, buscador 145.6 px a 14 px, versión instalada en placeholder, Día/Noche iguales, un botón completo, filtro y reinicio de tamaño; probar escritorio/4K y móvil 320/390 px. Ejecutar primero y confirmar fallo del diseño anterior.
- [x] Implementar la fila común, texto sin salto, etiquetas accesibles, placeholder y geometría mínima de una fila con espacio de scrollbar; conservar ampliación y móvil expandido vertical.
- [x] Ejecutar las pruebas de tamaño/versión/móvil y corregir hasta verde. Probar scrollbars clásicos.
- [x] Incrementar a 0.0.17, actualizar documentación y ejecutar `npm run build`, `ROVS_FIREFOX_CONTAINER=1 npm test`, `npm run release`, `npm run check`.
- [ ] Revisar el cambio completo con un revisor independiente, resolver hallazgos importantes con reproducción y tests; publicar con lease y comprobar bytes de URLs raw.
