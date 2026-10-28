# Barra USA de una fila — diseño aprobado

El usuario aprobó el mockup de una fila, después de reducir otro 20 % el buscador: Día/Noche de igual tamaño, buscador, compactar, cerrar y loterías. La barra inicia baja, pegada al pie y a ancho completo; el número instalado aparece únicamente en el placeholder del buscador vacío (`Buscar · v0.0.17` para esta publicación).

El buscador del mockup mide 145.6 px (182 × 0.8) con texto de 14 px; escala con la tipografía existente de 14–18 px. Se conservan etiquetas accesibles, estados, filtro, tema, consultas y llenado. Ampliar sigue mostrando más loterías y compactar restaura una fila. No se cambia ninguna fuente ni acción de Rover.

En móvil se conserva una fila al iniciar, con categorías por icono y nombre accesible, buscador más estrecho, objetivos táctiles de 42 px y desplazamiento de loterías. Al ampliar una barra estrecha, la cuadrícula puede ocupar el espacio inferior con scroll vertical. Se reserva espacio para scrollbars clásicos de Firefox/Windows.

Se modifica `src/ui.js`, su reproducción Firefox y documentación/versiones de esta carpeta. Se conserva el resto del repositorio y cada versión histórica.
