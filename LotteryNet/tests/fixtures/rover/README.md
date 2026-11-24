# Tabla Rover depurada para diez sorteos

`ten-draws-sanitized.html` deriva de las diez filas únicas de `verResultados2(1).php`, aportado por el usuario el 20/10/2026. `provenance.json` conserva el SHA-256 del archivo de origen; el HTML original no se incorpora al repositorio.

Se mantuvieron los elementos estructurales `tr/td/span/div/input`, las clases necesarias para localizar filas, los nombres de campo, los códigos `loteria` y el estilo de la primera celda oculta. Se borraron valores originales, horas, identificadores, texto ajeno a las identidades aprobadas, historiales, atributos de tooltip, scripts y acciones. Los cincuenta inputs están vacíos. El documento exterior y el control de fecha 19/10/2026 se añadieron para el ensayo: no prueban por sí mismos la fecha de una sesión auténtica.

La prueba añade un botón centinela y listeners adversarios **sintéticos**. No conserva ni ejecuta los manejadores originales de Rover. Esta copia permite probar los módulos de LotteryNet sobre la estructura capturada; no equivale a ejecutar Rover autenticado o Tampermonkey.
