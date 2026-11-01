/* V202 · Salidas semanales, deshacer y comparación mensual. */
"use strict";
function prepararSalidasV202(agenda,fecha,salida,cantidad){
 const fechas=String(fecha).split('-').map(Number);
 const inicio=new Date(fechas[0],fechas[1]-1,fechas[2],12);
 if(fechaLocalISO(inicio)!==fecha)throw new Error('Fecha inválida');
 const n=[1,4,8,12].includes(cantidad)?cantidad:1;
 const resultado={agenda:{...agenda},guardadas:0,omitidas:0};
 for(let i=0;i<n;i++){
  const dia=new Date(inicio);dia.setDate(dia.getDate()+7*i);
  const clave=fechaLocalISO(dia);
  if(i>0 && resultado.agenda[clave]){resultado.omitidas++;continue;}
  resultado.agenda[clave]={...salida};resultado.guardadas++;
 }
 return resultado;
}
function guardarAgendaSalidas(){
 const guardado=guardarJSON(STORAGE_KEYS.agendaSalidas,estado.agendaSalidas);
 if(guardado && !aplicandoDatosOneDrive){marcarModificacionLocalOneDrive();programarSincronizacionOneDrive();}
 return guardado;
}
let timerAvisoV202;
function avisoV202(texto,accion){
 clearTimeout(timerAvisoV202);
 document.getElementById('avisoV202')?.remove();
 const host=document.createElement('div');host.id='avisoV202';host.setAttribute('role','status');
 const mensaje=document.createElement('span');mensaje.textContent=texto;host.appendChild(mensaje);
 if(accion){const boton=document.createElement('button');boton.type='button';boton.textContent='Deshacer';boton.onclick=accion;host.appendChild(boton);}
 document.body.appendChild(host);
 timerAvisoV202=setTimeout(()=>host.remove(),accion?10000:6000);
}
let registrosDeshacerV202=[],timerDeshacerV202;
function restaurarEliminadosV202(actuales,eliminados){
 const ids=new Set(actuales.map(r=>r.id));
 return [...actuales,...eliminados.filter(r=>!ids.has(r.id)).map(r=>({...r,modificadoEn:new Date().toISOString()}))];
}
function ofrecerDeshacerV202(eliminados){
 if(!eliminados.length)return;
 clearTimeout(timerDeshacerV202);
 registrosDeshacerV202.push(...eliminados.map(r=>({...r})));
 avisoV202(`${registrosDeshacerV202.length===1?'Registro eliminado':registrosDeshacerV202.length+' registros eliminados'} · 10 s para deshacer`,deshacerPendienteV202);
 timerDeshacerV202=setTimeout(terminarDeshacerV202,10000);
}
function deshacerPendienteV202(){
 if(!registrosDeshacerV202.length){avisoV202('El plazo para deshacer ha terminado.');return;}
 const anteriores=estado.registros;
 estado.registros=restaurarEliminadosV202(anteriores,registrosDeshacerV202);
 if(!guardarRegistros()){estado.registros=anteriores;avisoV202('No se pudo recuperar. Inténtalo antes de que termine el plazo.',deshacerPendienteV202);return;}
 terminarDeshacerV202();actualizarTodaLaInterfaz();avisoV202('Registros recuperados');
}
function terminarDeshacerV202(){clearTimeout(timerDeshacerV202);registrosDeshacerV202=[];}
function fechaMesV202(valor){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(valor))return null;
 const [y,m]=valor.split('-').map(Number);return new Date(y,m-1,1,12);
}
function compararMesesV202(mesA,mesB){
 const a=resumenMesV143(mesA),b=resumenMesV143(mesB);
 const filas=['Ministerio','LDC','Asambleas','Otras'].filter(t=>(a.tipos[t]||0)>0||(b.tipos[t]||0)>0)
  .map(tipo=>({tipo,a:a.tipos[tipo]||0,b:b.tipos[tipo]||0,diferencia:(b.tipos[tipo]||0)-(a.tipos[tipo]||0)}));
 filas.push({tipo:'Total',a:a.total,b:b.total,diferencia:b.total-a.total});return filas;
}
function actualizarComparacionMesesV202(){
 const a=document.getElementById('compararMesAV202'),b=document.getElementById('compararMesBV202'),host=document.getElementById('compararFilasV202');
 if(!a||!b||!host)return;
 const hoy=new Date();if(!a.value)a.value=claveMesV143(new Date(hoy.getFullYear(),hoy.getMonth()-1,1));if(!b.value)b.value=claveMesV143(hoy);
 const mesA=fechaMesV202(a.value),mesB=fechaMesV202(b.value);if(!mesA||!mesB)return;
 const nombre=d=>d.toLocaleDateString('es-ES',{month:'short',year:'2-digit'});
 document.getElementById('compararCabAV202').textContent=nombre(mesA);
 document.getElementById('compararCabBV202').textContent=nombre(mesB);
 host.replaceChildren();
 compararMesesV202(mesA,mesB).forEach(f=>{
  const tr=document.createElement('tr');const titulo=document.createElement('th');titulo.scope='row';titulo.textContent=f.tipo;tr.appendChild(titulo);
  [formatearTiempo(f.a),formatearTiempo(f.b),(f.diferencia===0?'=':(f.diferencia>0?'+':'−')+' '+formatearTiempo(Math.abs(f.diferencia)))].forEach(texto=>{
   const td=document.createElement('td');td.textContent=texto;tr.appendChild(td);
  });host.appendChild(tr);
 });
}
document.addEventListener('DOMContentLoaded',()=>{
 ['compararMesAV202','compararMesBV202'].forEach(id=>document.getElementById(id)?.addEventListener('change',actualizarComparacionMesesV202));
 actualizarComparacionMesesV202();
});
