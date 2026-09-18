/* Mi Servicio · historial.js · V101
   Primer módulo funcional de Historial.
   Coordina accesibilidad y ciclo de vida sin modificar los datos existentes.
*/

/* V102 · Utilidades puras de Historial */
function compararPorFecha(a,b){
  const fa=new Date(a?.fecha ?? 0).getTime();
  const fb=new Date(b?.fecha ?? 0).getTime();
  return fb-fa;
}
function agruparPorFecha(registros=[]){
  return registros.reduce((grupos,registro)=>{
    const clave=String(registro?.fecha ?? "").slice(0,10);
    if(!grupos[clave]) grupos[clave]=[];
    grupos[clave].push(registro);
    return grupos;
  },{});
}
function cantidadTexto(cantidad){
  const n=Number(cantidad)||0;
  return `${n} ${n===1 ? "registro" : "registros"}`;
}


/* V103 · Filtros de Historial */
function normalizarTexto(valor=""){
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .trim();
}

function coincideBusqueda(registro,busqueda=""){
  const q=normalizarTexto(busqueda);
  if(!q) return true;
  const texto=normalizarTexto([
    registro?.tipo,
    registro?.actividad,
    registro?.notas,
    registro?.nota,
    registro?.acompanante,
    registro?.compañero,
    registro?.fecha
  ].filter(Boolean).join(" "));
  return texto.includes(q);
}

function coincideActividad(registro,filtro="todos"){
  const f=normalizarTexto(filtro);
  if(!f || f==="todos") return true;
  const tipo=normalizarTexto(registro?.tipo ?? registro?.actividad ?? "");
  const equivalencias={
    ministerio:["ministerio"],
    ldc:["ldc"],
    asambleas:["asambleas","asamblea"],
    otras:["otras","otra"]
  };
  return (equivalencias[f]||[f]).includes(tipo);
}

function filtrar(registros=[],opciones={}){
  const filtro=opciones.filtro ?? opciones.actividad ?? "todos";
  const busqueda=opciones.busqueda ?? "";
  return registros.filter(r =>
    coincideActividad(r,filtro) && coincideBusqueda(r,busqueda)
  );
}

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
  },

  compararPorFecha,
  agruparPorFecha,
  cantidadTexto,
  filtrar,
  coincideBusqueda,
  coincideActividad
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
export {
  Historial, compararPorFecha, agruparPorFecha, cantidadTexto,
  filtrar, coincideBusqueda, coincideActividad
};
