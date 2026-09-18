/* Mi Servicio · tiempo.js · V98
   Tiempo desacoplado · fase 2
*/
const WMO = Object.freeze({
  0:["☀️","Despejado"],1:["🌤️","Mayormente despejado"],2:["⛅","Parcialmente nublado"],
  3:["☁️","Nublado"],45:["🌫️","Niebla"],48:["🌫️","Niebla"],
  51:["🌦️","Llovizna"],53:["🌦️","Llovizna"],55:["🌧️","Llovizna"],
  61:["🌧️","Lluvia"],63:["🌧️","Lluvia"],65:["🌧️","Lluvia intensa"],
  71:["🌨️","Nieve"],73:["🌨️","Nieve"],75:["❄️","Nieve intensa"],
  80:["🌦️","Chubascos"],81:["🌧️","Chubascos"],82:["⛈️","Chubascos fuertes"],
  95:["⛈️","Tormenta"],96:["⛈️","Tormenta"],99:["⛈️","Tormenta fuerte"]
});

function describirCodigoTiempo(codigo){
  return WMO[Number(codigo)] || ["🌤️","Tiempo variable"];
}

function consejoRopa(temperatura,lluvia=0){
  const t=Number(temperatura), p=Number(lluvia)||0;
  if(p>=45) return ["☂️","Lleva paraguas"];
  if(t<=8) return ["🧥","Abrígate bien"];
  if(t<=16) return ["🧥","Chaqueta ligera"];
  if(t<=23) return ["👕","Ropa cómoda"];
  return ["👕","Ropa fresca"];
}

const Tiempo={
  iniciar(){
    const boton=document.getElementById("actualizarTiempoInicio");
    if(!boton || boton.dataset.moduloTiempo==="1") return;
    boton.dataset.moduloTiempo="1";
    boton.setAttribute("aria-label","Actualizar el tiempo");
  },
  disponible(){ return Boolean(document.getElementById("tiempoEsquinas")); },
  describirCodigo:describirCodigoTiempo,
  consejoRopa
};

function iniciarTiempoCuandoProceda(){
  Tiempo.iniciar();
  const observer=new MutationObserver(()=>Tiempo.iniciar());
  observer.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",iniciarTiempoCuandoProceda,{once:true});
}else iniciarTiempoCuandoProceda();

window.MiServicioTiempo=Tiempo;
export {Tiempo,describirCodigoTiempo,consejoRopa};
