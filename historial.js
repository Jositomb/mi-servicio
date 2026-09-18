/* Mi Servicio · historial.js · V101
   Primer módulo funcional de Historial.
   Coordina accesibilidad y ciclo de vida sin modificar los datos existentes.
*/
const Historial = {
  iniciar() {
    const vista =
      document.getElementById("vista-historial") ||
      document.querySelector('[data-vista="historial"]');
    if (!vista) return;

    // Etiquetas accesibles para controles que no tengan texto descriptivo.
    vista.querySelectorAll('button:not([aria-label])').forEach(b => {
      const texto=(b.textContent||"").trim();
      const titulo=b.getAttribute("title");
      if (!texto && titulo) b.setAttribute("aria-label",titulo);
    });

    // Los diálogos existentes de Historial quedan correctamente identificados.
    vista.querySelectorAll('.modal, [class*="modal"]').forEach(modal => {
      if (!modal.hasAttribute("role")) modal.setAttribute("role","dialog");
      if (!modal.hasAttribute("aria-modal")) modal.setAttribute("aria-modal","true");
    });

    vista.dataset.moduloHistorial="101";
  },

  refrescar() {
    this.iniciar();
  }
};

function arrancarHistorial(){
  Historial.iniciar();
  const observer=new MutationObserver(()=>Historial.iniciar());
  observer.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",arrancarHistorial,{once:true});
}else arrancarHistorial();

window.MiServicioHistorial=Historial;
export {Historial};
