# Publicación de Rovs Loterías USA

- El archivo activo es `Rovs-Loterias-USA.user.js`; mantener esta ruta y sus URLs de actualización.
- Mantener `@name` y `@namespace` para preservar la identidad en Tampermonkey.
- Cada publicación debe incrementar `@version` mediante `tools/release.py`. Generar juntos el script estable, `.meta.js` y la copia de `versions/`.
- No sobrescribir archivos históricos ni modificar otros userscripts del repositorio.
- Actualizar README e historial de cambios, verificar el funcionamiento afectado y ejecutar `node "Loterias USA/tools/check-release.cjs"` antes de publicar.
- Tras publicar en `main`, comprobar que las URLs raw del script y los metadatos entregan la versión esperada.
