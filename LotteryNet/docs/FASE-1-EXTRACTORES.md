# Extracción HTML — Evidencias de Fase 1 (2026-10-20)

Se verificaron los HTML servidos por las diez URLs de Pick/Cash/Daily 3 y 4 en Lottery.net para la fecha publicada **2026-10-19**. Los diez fragmentos auténticos están en \`tests/fixtures/lotterynet/*.html\`; los valores esperados de los **20 resultados** están en \`cases.json\`.

El parser exige coincidencia exacta entre etiqueta de fecha, enlace de la fecha, ruta de juego y turno. Cuenta únicamente \`number-part-01..03/04\`, excluyendo Fireball/Wild Ball/Super Ball. Louisiana tiene un único bloque de sorteo sin turno escrito: la excepción Evening se restringe a LA. No confía en el \`title\` del enlace, que en algunas páginas menciona otro estado.

El catálogo investigado de **74 sorteos** permanece en \`docs/research/\` para referencia. **No está aprobado como alcance del userscript**: el PLAN vigente solo autoriza cinco estados y diez sorteos. Puerto Rico sigue sin equivalencia confirmada.

**Estado:** pruebas deterministas con fixtures. No hay resultados en vivo, ni DOM Rover, ni test de navegador ejecutado. La entrada \`src/index.js\` permanece inactiva: sin llenado, sin procesamiento, sin automatización. No publicar como versión funcional.
