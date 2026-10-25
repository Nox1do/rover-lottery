# Rovs Loterias USA React

- Proyecto independiente. No modificar `Loterias USA`, `LotteryNet` u otros scripts para publicar esta variante.
- Fuente en `src/`; generar los archivos distribuibles con `npm run build`. No editar el `.user.js` generado directamente.
- Conservar identidad y URLs propias de `Loterias USA React`. Incrementar versión en `metadata.json` y `package.json`.
- El producto no usa React como dependencia. React, ReactDOM y Playwright son dependencias de pruebas únicamente.
- El adaptador solo llena el formulario con eventos de entrada; no llamar APIs de Rover, interceptar peticiones, fabricar respuestas, guardar resultados ni pulsar Procesar.
- No usar la fecha de hoy como respaldo. Si la fecha no está vinculada a la tabla mediante Buscar, bloquear la consulta.
- Mantener compatibilidad con Firefox y probar estado React real después de otro render.
- Antes de publicar: `npm run build`, `npm test`, `npm run release`, `npm run check`. En contenedores de prueba con restricciones de namespaces puede requerirse `ROVS_FIREFOX_CONTAINER=1` (solo entorno de pruebas, nunca en el producto).
- No sobrescribir archivos históricos de versiones publicadas. Actualizar README y CHANGELOG. Verificar URLs raw tras publicar.
