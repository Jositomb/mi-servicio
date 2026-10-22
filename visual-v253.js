/* V201 · Apariencia local; no modifica registros, objetivos ni sincronización. */
"use strict";
function estacionV201(mes){
 if(mes>=2 && mes<=4)return "primavera";
 if(mes>=5 && mes<=7)return "verano";
 if(mes>=8 && mes<=10)return "otono";
 return "invierno";
}
function aplicarTemaV201(valor){
 const permitidos=["ninguno","automatico","primavera","verano","otono","invierno"];
 const modo=permitidos.includes(valor)?valor:"ninguno";
 const tema=modo==="automatico"?estacionV201(new Date().getMonth()):modo;
 const inicio=document.getElementById("vista-inicio");
 if(inicio)inicio.dataset.estacion=tema;
}
function actualizarHitosMetaV201(){
 const host=document.getElementById("hitosMetaV201");
 const dato=document.getElementById("metaPorcentaje");
 if(!host || !dato)return;
 const porcentaje=Math.max(0,Math.min(100,parseFloat(dato.textContent)||0));
 const anterior=host.dataset.porcentaje==null?null:Number(host.dataset.porcentaje);
 host.querySelectorAll("[data-meta-hito]").forEach(hito=>{
  const limite=Number(hito.dataset.metaHito),hecho=porcentaje>=limite;
  hito.classList.toggle("alcanzado",hecho);
  hito.setAttribute("aria-label",limite+"% "+(hecho?"alcanzado":"pendiente"));
  if(anterior!=null && anterior<limite && hecho && typeof hito.animate==="function" &&
     !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
   hito.animate([{transform:"scale(1)"},{transform:"scale(1.45)"},{transform:"scale(1)"}],{duration:450});
  }
 });
 host.dataset.porcentaje=String(porcentaje);
}
function iniciarVisualV201(){
 const selector=document.getElementById("temaEstacionalV201");
 const clave="miServicio.aparienciaEstacionalV201";
 let valor="ninguno";
 try{valor=localStorage.getItem(clave)||"ninguno";}catch(e){}
 if(selector){
  selector.value=["ninguno","automatico","primavera","verano","otono","invierno"].includes(valor)?valor:"ninguno";
  aplicarTemaV201(selector.value);
  selector.addEventListener("change",()=>{
   aplicarTemaV201(selector.value);
   try{localStorage.setItem(clave,selector.value);}catch(e){}
  });
 }
 const datos="#metaPorcentaje,#metaTotal,#metaComputableClaro,#metaExcedente,#metaActividadTotal,#metaMesActividad,#metaLlevas,#metaQueda,#metaMesComputable,#porcentajeObjetivo,#valorObjetivo,.orbita-actividad span,.orbita-actividad b,.orbita-centro strong,[data-v143-total],[data-v143-dias],[data-v143-semana],[data-v139-actual],[data-v139-anterior],[data-v141-previstas],[data-v141-realizadas],[data-v141-pendientes],#semanaVisualTotalV193";
 const anteriores=new WeakMap();
 const orbitas=new Map();
 function refrescar(){
  const reducido=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(datos).forEach(el=>{
   const orbita=el.closest(".orbita-actividad,.orbita-centro");
   const clave=orbita?orbita.className+":"+el.tagName:null;
   const texto=el.textContent.trim(),anterior=clave?orbitas.get(clave):anteriores.get(el);
   if(clave)orbitas.set(clave,texto);else anteriores.set(el,texto);
   if(anterior!==undefined && anterior!==texto && /\d/.test(texto) && !reducido && typeof el.animate==="function"){
    el.animate([{opacity:.45},{opacity:1}],{duration:220,easing:"ease-out"});
   }
  });
  actualizarHitosMetaV201();
 }
 refrescar();
 let pendiente=false;
 const observer=new MutationObserver(()=>{
  if(pendiente)return;pendiente=true;
  requestAnimationFrame(()=>{pendiente=false;refrescar()});
 });
 const main=document.querySelector("main");
 if(main)observer.observe(main,{childList:true,characterData:true,subtree:true});
 document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"){aplicarTemaV201(selector?.value||"ninguno");refrescar();}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",iniciarVisualV201,{once:true});
else iniciarVisualV201();
