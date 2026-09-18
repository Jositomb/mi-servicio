/* Mi Servicio · tiempo.js · V97
   Módulo funcional de Tiempo.
   Encapsula el enlace del refresco manual y deja preparada la migración
   de la consulta meteorológica sin alterar la implementación estable.
*/

const Tiempo = {
  iniciar() {
    const boton = document.getElementById("actualizarTiempoInicio");
    if (!boton || boton.dataset.moduloTiempo === "1") return;

    boton.dataset.moduloTiempo = "1";

    // La implementación meteorológica estable sigue en app-v27.js durante
    // esta primera extracción. El módulo coordina el refresco sin duplicarlo.
    boton.setAttribute("aria-label", "Actualizar el tiempo");
  },

  disponible() {
    return Boolean(document.getElementById("tiempoEsquinas"));
  }
};

function iniciarTiempoCuandoProceda() {
  Tiempo.iniciar();

  // Inicio puede renderizarse de nuevo al navegar entre pestañas.
  const observer = new MutationObserver(() => Tiempo.iniciar());
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarTiempoCuandoProceda, { once: true });
} else {
  iniciarTiempoCuandoProceda();
}

window.MiServicioTiempo = Tiempo;
export { Tiempo };
