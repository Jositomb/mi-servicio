# V127
Diagnóstico confirmado por UI: el botón ejecuta actividad pero 'Última sincronización'
no cambia. Se corrige el camino de renovación de credenciales MSAL que antes devolvía
null silenciosamente y podía dejar la sincronización sin completar.
- La sincronización pendiente se conserva antes del redirect.
- Al volver de Microsoft se reanuda automáticamente.
- Los fallos dejan mensaje visible; ya no hay retorno silencioso por token null.
- No se modifica la lógica de registros, estadísticas, Inicio ni diseño.
