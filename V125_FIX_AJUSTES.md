# V125 · corrección de preferencias
Causa corregida: la protección de "dispositivo vacío" ignoraba cambios de preferencias.
Por ello un dispositivo sin registros podía guardar mostrarAsambleas=false y, durante
la sincronización, ser tratado como vacío y restaurar mostrarAsambleas=true desde OneDrive.

Cambios:
- Un cambio local pendiente impide considerar el dispositivo vacío.
- En sincronización, un cambio local pendiente tiene prioridad absoluta sobre la
  restauración automática de dispositivo vacío.
- Se conserva la protección de V122 y el sistema de revisiones V124.
