/* Mi Servicio · core/legacy-bridge.js · V100
   Puente temporal de compatibilidad durante la modularización.
   Mantiene disponibles los módulos nuevos sin modificar las claves o datos existentes.
*/
window.MiServicio = window.MiServicio || {};
Object.defineProperties(window.MiServicio, {
  config: { get: () => window.MiServicioConfig, configurable: true },
  storage: { get: () => window.MiServicioStorage, configurable: true },
  tiempo: { get: () => window.MiServicioTiempo, configurable: true },
  historial: { get: () => window.MiServicioHistorial, configurable: true },
  estadisticas: { get: () => window.MiServicioEstadisticas, configurable: true }
});
