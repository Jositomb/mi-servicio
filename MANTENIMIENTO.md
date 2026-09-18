# Mi Servicio · Mapa de mantenimiento V93

Esta versión inicia la reorganización interna sin cambiar el comportamiento de la aplicación.

## Regla principal
No dividir app-v27.js ni styles-v27.css de golpe. Primero se identifican dependencias y después
se extraen bloques uno por uno, comprobando la aplicación tras cada extracción.

## Orden previsto de extracción JavaScript
1. core/storage.js — claves, almacenamiento, utilidades de persistencia.
2. core/config.js — constantes y configuración compartida.
3. registro.js
4. calendario.js
5. historial.js
6. estadisticas.js
7. meta.js
8. tiempo.js
9. personajes.js
10. onedrive.js
11. ajustes.js
12. inicio.js
13. app.js — arranque, navegación y coordinación.

## Orden previsto de CSS
1. base.css
2. navegacion.css
3. inicio.css
4. registro.css
5. calendario.css
6. historial.css
7. estadisticas.css
8. meta.css
9. ajustes.css
10. componentes.css
11. responsive.css

## Condiciones de seguridad
- No cambiar claves de localStorage.
- No cambiar IDs usados por JavaScript.
- No cambiar la regla anual de 600 h / límite mensual de 55 h cuando hay actividad adicional.
- No cambiar el año de servicio septiembre-agosto.
- No cambiar el funcionamiento offline.
- No cambiar datos existentes.
- Mantener exportación/importación y OneDrive.
- Cada extracción debe pasar comprobación de sintaxis antes de publicarse.

## V93
Solo añade mapa e índices de mantenimiento. No altera la lógica ni el aspecto.

## V94 — primer módulo real
- Añadido `core/config.js` como módulo ES6.
- Se carga antes de `app-v27.js`.
- Está incluido en el shell offline.
- Centraliza la configuración estable: inicio del año de servicio, meta anual,
  límite mensual mixto y nombres de actividades.
- Por seguridad, `app-v27.js` conserva temporalmente sus constantes originales.
  La migración se hará una a una para poder comprobar equivalencia.

## V95 — capa de almacenamiento
- Añadido `core/storage.js`.
- Expone `MiServicioStorage.leer`, `guardar`, `eliminar` y `existe`.
- No cambia ninguna clave de `localStorage` ni el formato de los registros.
- Se incluye en el shell offline.
- Las llamadas antiguas siguen activas temporalmente para comprobar primero
  que la aplicación continúa funcionando sin cambios.

## V96 — integración progresiva de storage
- Añadidos adaptadores `msStorageLeer` y `msStorageGuardar`.
- Migradas automáticamente 0 lecturas JSON simples y 4 escrituras JSON simples.
- Solo se sustituyeron patrones inequívocos; los accesos especiales permanecen intactos.
- No se modifican claves, estructura de registros ni contenido almacenado.
- La migración continúa siendo compatible si el módulo no cargase: existe fallback a localStorage.

## V97 — primer módulo funcional: Tiempo
- Añadido `tiempo.js` como módulo ES6 independiente.
- Coordina la interfaz meteorológica y el botón manual de actualización.
- Tolera que Inicio se vuelva a renderizar al cambiar de pestaña.
- Se mantiene temporalmente la consulta Open-Meteo estable en `app-v27.js`
  para evitar una extracción brusca.
- Añadido al shell offline.
- Próxima fase: trasladar al módulo las funciones meteorológicas completas.

## V98 — Tiempo, fase 2
- `tiempo.js` centraliza interpretación de códigos meteorológicos.
- Centraliza consejos de ropa según temperatura y lluvia.
- Mantiene el botón ↻ y la detección de re-render de Inicio.
- La consulta de red permanece temporalmente en `app-v27.js` para conservar el comportamiento validado.

## V99 — Tiempo autónomo
- `tiempo.js` ya contiene geocodificación, consulta Open-Meteo, interpretación WMO,
  probabilidad de lluvia, consejo de ropa y refresco manual.
- Mantiene la clave `miServicio.localidadTiempo`.
- Mantiene los IDs visuales existentes.
- La carga inicial heredada permanece temporalmente como compatibilidad; tras validar
  V99 podrá eliminarse del archivo principal para reducir líneas físicamente.

## V100 — cierre de la primera fase de modularización
- `tiempo.js` queda establecido como módulo meteorológico autónomo.
- Añadido `core/legacy-bridge.js` para desacoplar módulos nuevos del código histórico.
- Retiradas notas temporales de migración del archivo principal.
- `app-v27.js`: 10265 → 10249 líneas en esta limpieza conservadora.
- No se ha borrado automáticamente ningún bloque heredado cuyo límite no pudiera
  verificarse con total seguridad; prima conservar el comportamiento validado.
- Próximo bloque recomendado: Historial o Estadísticas, extrayéndolo por funciones completas.

## V101 — Historial, fase 1
- Añadido `historial.js` como módulo ES6.
- Coordina el ciclo de vida de la vista Historial.
- Empieza además la mejora de accesibilidad en modales y botones de icono.
- No modifica registros, filtros, búsqueda, edición ni borrado existentes.
- Incluido en el shell offline y en `legacy-bridge.js`.
- Próxima fase: extraer funciones completas de renderizado/filtros tras validar V101.
