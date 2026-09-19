# V128
Reconstruida desde V121 estable.
La sincronización vuelve a un flujo simple:
- Guardar cualquier cambio marca `onedriveCambioLocalPendiente=true`.
- Si hay cambio pendiente, Sincronizar SIEMPRE sube local a OneDrive.
- Sólo un dispositivo realmente nuevo y sin datos recupera automáticamente la nube.
- Una subida exitosa actualiza `Última sincronización` y limpia el pendiente.
- Restauración OneDrive incluye registros, preferencias y agendaSalidas.
No se incluyen las capas de revisiones de V124-V127.
