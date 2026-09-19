# V123 · Ajustes + OneDrive
Corrige una condición de carrera detectada en iPad:
- Al guardar un ajuste (por ejemplo desactivar Asambleas), se marca como cambio local pendiente.
- Ese cambio local tiene prioridad en la siguiente sincronización.
- Si se pulsa Guardar mientras otra sincronización está en curso, se programa otra pasada.
- La marca sólo se limpia tras subir correctamente o restaurar deliberadamente desde OneDrive.
- Conserva todas las protecciones de V122 y todo el diseño/funciones de V121.
