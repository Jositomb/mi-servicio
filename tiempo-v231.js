/* Mi Servicio · tiempo.js · V99
   Módulo Tiempo autónomo.
*/
const STORAGE_LOCALIDAD="miServicio.localidadTiempo";
const WMO=Object.freeze({
  0:["☀️","Despejado"],1:["🌤️","Mayormente despejado"],2:["⛅","Parcialmente nublado"],
  3:["☁️","Nublado"],45:["🌫️","Niebla"],48:["🌫️","Niebla"],
  51:["🌦️","Llovizna"],53:["🌦️","Llovizna"],55:["🌧️","Llovizna"],
  61:["🌧️","Lluvia"],63:["🌧️","Lluvia"],65:["🌧️","Lluvia intensa"],
  71:["🌨️","Nieve"],73:["🌨️","Nieve"],75:["❄️","Nieve intensa"],
  80:["🌦️","Chubascos"],81:["🌧️","Chubascos"],82:["⛈️","Chubascos fuertes"],
  95:["⛈️","Tormenta"],96:["⛈️","Tormenta"],99:["⛈️","Tormenta fuerte"]
});
function describirCodigoTiempo(c){return WMO[Number(c)]||["🌤️","Tiempo variable"];}
function consejoRopa(t,lluvia=0){
  t=Number(t); lluvia=Number(lluvia)||0;
  if(lluvia>=45)return["☂️","Lleva paraguas"];
  if(t<=8)return["🧥","Abrígate bien"];
  if(t<=16)return["🧥","Chaqueta ligera"];
  if(t<=23)return["👕","Ropa cómoda"];
  return["👕","Ropa fresca"];
}
function poner(id,valor){const e=document.getElementById(id);if(e)e.textContent=valor;}
function localidad(){
  try{return localStorage.getItem(STORAGE_LOCALIDAD)||"Arteixo";}catch{return"Arteixo";}
}
async function geocodificar(nombre){
  const u=new URL("https://geocoding-api.open-meteo.com/v1/search");
  u.searchParams.set("name",nombre);u.searchParams.set("count","1");
  u.searchParams.set("language","es");u.searchParams.set("format","json");
  const r=await fetch(u);if(!r.ok)throw new Error("geocodificación");
  const d=await r.json();if(!d.results?.length)throw new Error("localidad");
  return d.results[0];
}
async function consultar(){
  const nombre=localidad();
  poner("tiempoDescripcion","Consultando…");
  const g=await geocodificar(nombre);
  const u=new URL("https://api.open-meteo.com/v1/forecast");
  u.searchParams.set("latitude",g.latitude);u.searchParams.set("longitude",g.longitude);
  u.searchParams.set("current","temperature_2m,weather_code");
  u.searchParams.set("hourly","precipitation_probability");
  u.searchParams.set("forecast_days","1");u.searchParams.set("timezone","auto");
  const r=await fetch(u);if(!r.ok)throw new Error("tiempo");
  const d=await r.json();
  const temp=Math.round(d.current?.temperature_2m ?? 0);
  const code=d.current?.weather_code;
  const [icono,desc]=describirCodigoTiempo(code);
  const hora=d.current?.time;
  let lluvia=0;
  if(hora && d.hourly?.time){
    const i=d.hourly.time.indexOf(hora.slice(0,13)+":00");
    if(i>=0)lluvia=d.hourly.precipitation_probability?.[i]??0;
  }
  const [ropaIcono,consejo]=consejoRopa(temp,lluvia);
  poner("tiempoIcono",icono);poner("tiempoDescripcion",desc);
  poner("tiempoTemperatura",`${temp}°`);poner("tiempoLugar",g.name||nombre);
  poner("tiempoLluvia",`💧 ${Math.round(lluvia)}%`);
  poner("tiempoConsejo",consejo);
  const ri=document.querySelector(".tiempo-ropa-icono");if(ri)ri.textContent=ropaIcono;
  return d;
}
function iniciar(){
  const b=document.getElementById("actualizarTiempoInicio");
  if(!b||b.dataset.moduloTiempo==="99")return;
  b.dataset.moduloTiempo="99";b.setAttribute("aria-label","Actualizar el tiempo");
  b.addEventListener("click",()=>consultar().catch(()=>poner("tiempoDescripcion","Sin conexión")));
}
const Tiempo={iniciar,consultar,describirCodigo:describirCodigoTiempo,consejoRopa,
 disponible:()=>Boolean(document.getElementById("tiempoEsquinas"))};
function arrancar(){
  iniciar();
  new MutationObserver(()=>iniciar()).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",arrancar,{once:true});
else arrancar();
window.MiServicioTiempo=Tiempo;
export {Tiempo,consultar,describirCodigoTiempo,consejoRopa};
