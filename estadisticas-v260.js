/* Mi Servicio · estadisticas.js · V107 */
function minutosRegistro(r={}){
  if(Number.isFinite(Number(r.minutosTotales))) return Number(r.minutosTotales);
  return (Number(r.horas)||0)*60+(Number(r.minutos)||0);
}
function sumarMinutos(registros=[]){return registros.reduce((s,r)=>s+minutosRegistro(r),0);}
function porcentaje(parte,total){
  const t=Number(total)||0;
  return t<=0?0:Math.max(0,Math.min(100,Math.round((Number(parte)||0)*100/t)));
}
function resumenPorActividad(registros=[]){
  const s={ministerio:0,ldc:0,asambleas:0,otras:0};
  for(const r of registros){
    const tipo=String(r?.tipo??r?.actividad??"").toLowerCase(),m=minutosRegistro(r);
    if(tipo.includes("ministerio"))s.ministerio+=m;
    else if(tipo==="ldc")s.ldc+=m;
    else if(tipo.includes("asamblea"))s.asambleas+=m;
    else s.otras+=m;
  }
  return s;
}
const Estadisticas={minutosRegistro,sumarMinutos,porcentaje,resumenPorActividad};
window.MiServicioEstadisticas=Estadisticas;
export {Estadisticas,minutosRegistro,sumarMinutos,porcentaje,resumenPorActividad};
