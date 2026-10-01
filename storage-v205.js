/* Mi Servicio · core/storage.js · V95
   Capa común y segura sobre localStorage.
   No cambia claves, formatos ni datos existentes.
*/

export const storage = Object.freeze({
  leer(clave, valorPorDefecto = null) {
    try {
      const contenido = localStorage.getItem(clave);
      if (contenido === null) return valorPorDefecto;
      return JSON.parse(contenido);
    } catch (error) {
      console.error(`[Mi Servicio] No se pudo leer "${clave}"`, error);
      return valorPorDefecto;
    }
  },

  guardar(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (error) {
      console.error(`[Mi Servicio] No se pudo guardar "${clave}"`, error);
      return false;
    }
  },

  eliminar(clave) {
    try {
      localStorage.removeItem(clave);
      return true;
    } catch (error) {
      console.error(`[Mi Servicio] No se pudo eliminar "${clave}"`, error);
      return false;
    }
  },

  existe(clave) {
    try {
      return localStorage.getItem(clave) !== null;
    } catch {
      return false;
    }
  }
});

window.MiServicioStorage = storage;
