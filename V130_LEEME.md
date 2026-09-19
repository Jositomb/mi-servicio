# V130 PUSH SEGURO
Base V121.
Objetivo urgente: evitar que OneDrive antiguo pise datos locales.
- No hay sincronización automática al arrancar.
- Guardar un cambio programa una SUBIDA.
- "Sincronizar ahora" SUBE el estado local; no descarga.
- Una subida exitosa actualiza Última sincronización.
- Restauración de agenda corregida.
IMPORTANTE: esta estrategia es segura frente a pisadas remotas, pero no es
una fusión multiusuario simultánea. Si dos dispositivos editan a la vez,
el último que suba sustituye la copia remota completa.
