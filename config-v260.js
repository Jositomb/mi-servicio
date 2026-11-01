/* Mi Servicio · core/config.js · V94
   Primer módulo ES6 real del proyecto.
   Centraliza configuración estable sin tocar datos ni claves existentes.
*/
export const APP_CONFIG = Object.freeze({
  anioServicioMesInicio: 8,       // septiembre (Date: 0=enero)
  metaAnualHoras: 600,
  limiteMensualMixtoHoras: 55,
  actividades: Object.freeze({
    ministerio: "Ministerio",
    ldc: "LDC",
    asambleas: "Asambleas",
    otras: "Otras"
  })
});

window.MiServicioConfig = APP_CONFIG;
