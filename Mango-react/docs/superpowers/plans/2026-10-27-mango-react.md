# Mango React Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Crear un userscript Mango compatible con Central para PRINCIPAL.

**Architecture:** Observador pasivo de respuestas nativas alimenta un adaptador con contexto invalidable. Un cliente Mango privado concilia y presenta resultados, y reconoce publicaciones persistidas; módulos vanilla empaquetados sin React runtime adicional.

**Tech Stack:** JavaScript modules, esbuild, node:test, React fixture, Playwright Firefox.

**Spec:** docs/superpowers/specs/2026-10-27-mango-react.md

## Global Constraints

- Firefox/Tampermonkey; solo PRINCIPAL, hoy America/Santo_Domingo.
- Nunca pulsar Procesar/publicar ni llamar endpoints financieros.
- Mantener token GM privado; contrato Mango 1.0.
- Conservar ceros, ediciones y dependencias; contexto incierto bloquea efectos.

## Review Focus

- Respuestas fuera de orden o fallidas nunca confirman fecha.
- PROC verde y ediciones distintas generan ACK de persistencia, no de edición.
- Reglas de dependencias no deben sobreescribir trabajo local.
- Publicación en diálogo congela llenado; filtros no alteran identidad.
- Cambio de servidor/fecha/ruta cancela operaciones asíncronas.

### Task 1: Contexto y observación

**Files:** Mango-react/src/{helpers,native,central}.js; tests/context.test.mjs; tests/fixture.jsx; tests/firefox.mjs.

**Interfaces:** installNativeObserver(pageWindow, exportToPage, notify) observa inicio/éxito/fallo de consultas exactas; createCentralAdapter(document,window) consume eventos y expone snapshot(), assert(), rows(), fill(). Fechas ISO internas y 5 campos conocidos.

- [x] Escribir pruebas de fecha inválida/ayer, respuesta tardía, fallos, servidor y persistencia frente a edición; ejecutar RED.
- [x] Implementar observación transparente y adaptador DOM con generaciones; reglas/revisiones separadas por servidor. No usar Fiber ni estado privado de React.
- [x] Ejecutar node --test tests/context.test.mjs; esperado PASS.

### Task 2: Entrega Mango

**Files:** Mango-react/src/{api,delivery,visuals,main}.js; tests/delivery.test.mjs.

**Interfaces:** createApi({getToken,request}) realiza GM JSON con contrato; createDelivery({central,api,clientId}) expone cycle(rows,snapshot), diagnóstico. Todos los await con verificación de contexto antes de efectos.

- [x] Escribir pruebas de reserva→llenado→presented, manual ACK persistido, bloqueo de ediciones, estado compartido discordante, fallos y cambio de contexto; ejecutar RED.
- [x] Implementar conciliación, colores temporales, caché acotada y menús/polling adaptativo 5/120/30 segundos.
- [x] Ejecutar node --test tests/*.test.mjs; esperado PASS.

### Task 3: Firefox y distribución

**Files:** Mango-react/{README.md,CHANGELOG.md,metadata.json,Mango-Rover-React.user.js,Mango-Rover-React.meta.js}; tools/build.mjs; versions/*; tests/*.

**Interfaces:** npm run build empaqueta; npm run check detecta diferencias; npm test ejecuta unidades y Firefox real con APIs aisladas.

- [x] Escribir escenarios reales React/Firefox: carreras de fecha, picks/dependencias, filtros, dirty/clear, diálogo, 241 filas, foco/scroll, ACK y servidor; observar fallo antes de completar integración.
- [x] Implementar ensamblado y ajustar integración; ejecutar npm test y npm run check; esperado PASS.
- [x] Revisar diff completo, corregir hallazgos con regresiones y documentar límites (GM simulado y sesión real no validada si aplica).
- [x] Publicar archivos en Mango-react con commit verificable; no alterar otras carpetas ni backend.
