# V126
Corrección del fallo persistente de Ajustes/OneDrive.

La regla de "dispositivo vacío" ya no se basa en si hay registros o agenda.
Ahora sólo se considera primera sincronización si ese navegador/dispositivo nunca
ha completado una sincronización OneDrive (ultimaSyncOneDrive inexistente).

Orden de prioridad:
1. Cambio local pendiente -> subir.
2. Primera sincronización real -> recuperar nube.
3. Revisiones -> gana la mayor.
4. Fechas sólo para migrar copias antiguas sin revisión.

También se versionan juntos CSS/JS/cache para evitar mezclar archivos de versiones.
