# Mango/Rover React · 0.1.4

Versión independiente para **Firefox + Tampermonkey**, en https://central.roversport.net/loteria/resultados/ver. Trabaja únicamente con **PRINCIPAL** y la fecha de hoy en **America/Santo_Domingo**. Conserva el contrato 1.0 del servicio Mango existente; no requiere instalar React ni modifica el Worker.

## Instalación

1. Instalar [Mango-Rover-React.user.js](https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Mango-react/Mango-Rover-React.user.js) en Tampermonkey actualizado.
2. En el menú de Tampermonkey, elegir **Mango React · Configurar token** e introducir el token de entrega Mango existente. Esta instalación tiene almacenamiento propio: no copia automáticamente el token del userscript antiguo.
3. Abrir Central, seleccionar **PRINCIPAL**, seleccionar hoy y pulsar **Buscar**. Cambiar solamente el calendario no verifica la tabla.
4. Mango llena campos disponibles. Revisar y procesar normalmente en Central. **Mango nunca pulsa Procesar, confirma un diálogo ni publica resultados.**

Las actualizaciones utilizan los archivos `.meta.js` y `.user.js` de esta carpeta. El antiguo Mango puede seguir instalado para la pantalla clásica; no coincide con el dominio de Central. Si se usa una copia modificada que también coincide con Central, desactivarla allí para evitar dos automatizaciones.

## Comportamiento

- Azul: Mango está esperando el resultado para los campos vacíos que le corresponden.
- Al ocultar y volver a mostrar filas mediante el filtro, el azul se recupera con los datos ya recibidos, sin nuevas consultas ni llenados. Requiere que la fecha y el servidor sigan verificados; no vuelve en campos con números ni después de recibir un estado que termine la vigilancia.
- Verde durante dos segundos: el llenado quedó retenido por React. **No significa procesado.**
- Los campos de una fila se escriben sin pausas de temporizador entre casillas para evitar el llenado visual escalonado. Después se comprueba la retención antes de confirmar la entrega; una intervención durante ese plazo impide la confirmación.
- El estado procesado se confirma con fecha/servidor verificados, PROC de la fila y números persistidos recibidos de Central. Si se editaron los campos después de procesar, se confirman los números publicados, no la edición sin guardar.
- Una publicación manual también se reconoce aunque el proveedor oficial todavía no tenga resultado.
- Si Mango dice procesado y Central sigue pendiente, se conserva todo y se muestra la discordancia en diagnóstico. No se resetea el estado compartido.
- Se respetan ediciones, limpiezas y otros scripts. Ante trabajo local o dependencias con números se omite el llenado; no se restaura indiscriminadamente un campo vacío. Recargar Central inicia una nueva sesión de edición.
- Picks conservan ceros iniciales y actualizan premios mediante los eventos normales de Central. Las reglas nativas siguen calculando dependientes; Mango no procesa las dependientes.
- Filtros y orden no definen identidad. Se exige coincidencia única por nombre/código/alias exacto; filas ocultas o duplicadas se omiten. Los códigos nativos se comparan recortando espacios exteriores de forma consistente; una colisión tras el recorte bloquea la verificación.
- Se suspenden efectos mientras hay diálogos, publicación, carga, servidor distinto, fecha histórica, lectura o permisos insuficientes.
- Buscar puede refrescar como máximo cada dos minutos, únicamente con contexto verificado y sin trabajo pendiente. Esto permite descubrir loterías que Central agrega diez minutos antes del sorteo. Nunca elimina filtros.

El sondeo Mango utiliza 5 segundos cuando hay entregas activas, 120 segundos cuando están inactivas y 30 segundos después de errores. Las mutaciones de la pantalla no fuerzan consultas ilimitadas. El token y las funciones GM permanecen en el contexto de Tampermonkey; el observador únicamente copia respuestas nativas conocidas y devuelve la misma promesa/respuesta a Central.

## Diagnóstico

Tampermonkey ofrece **Configurar token**, **Pausar/reanudar**, **Diagnóstico** y **Regenerar identificador de PC**. El diagnóstico indica si el observador funciona, fecha verificada, servidor, última consulta y filas coincidentes, sin imprimir el token. Si la respuesta llegó pero la tabla no coincide, identifica la fila y si falla el código, PROC o los campos persistidos. Si falta contexto o falló Buscar, repetir Buscar después de revisar fecha y servidor. Si faltan reglas/revisiones nativas, Mango omite el llenado y no las configura ni las consulta por su cuenta.

## Alcance de la verificación

38 pruebas de Node y 40 escenarios en Firefox 153 con React real/contexto aislado, incluidas tabla de 241 filas, fecha/servidor, PROC con edición, picks, dependientes, intervención externa, foco/scroll y contrato de entrega. Cubren recuperación del azul, códigos con espacios y llenado sin frames parciales en tabla completa/filtrada. Dos escenarios en una extensión temporal comprueban Xrays/`exportFunction`, aislamiento de GM y cancelación ante una intervención de la página. **Las APIs GM están simuladas; no se ha probado una publicación real.** El usuario confirmó que 0.1.3 ya llena en su Firefox/Tampermonkey, pero informó llenado escalonado; falta confirmar la mejora visual de 0.1.4 en su equipo. Los tiempos de la fixture no acreditan la latencia de su sesión real.

La compatibilidad se basa en la pantalla auditada el 27/10/2026; si Central cambia la estructura, se detienen las operaciones que no pueden verificarse. No usa Fiber, propiedades privadas de React ni sustituye los manejadores de publicación.

El backend compartido y los clientes clásicos conservan su comportamiento. Este script no corrige el pendiente del scheduler de dejar de buscar en el proveedor después de un processed manual ni sanea ACK históricos incorrectos.

## Desarrollo

```sh
cd Mango-react
npm ci
npx playwright install firefox
npm run build
npm test
npm run check
```

`src/` contiene observación, contexto, adaptador DOM, API, entrega, polling y estilos separados. `tools/build.mjs` genera el instalador, metadatos e historial de versión reproducibles. No editar el instalador generado directamente. Las pruebas usan solo servidores locales y no llaman los endpoints financieros reales. El ajuste de aislamiento de procesos de Firefox existe solo en el lanzador de pruebas para este entorno.

Referencias: [diseño](docs/superpowers/specs/2026-10-27-mango-react.md), [plan](docs/superpowers/plans/2026-10-27-mango-react.md), [auditoría](docs/compatibilidad.md) y [verificación](docs/verificacion.md).
