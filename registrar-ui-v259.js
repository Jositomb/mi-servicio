/* Mi Servicio V203 · Registrar claro, sin alterar el modelo de registros. */
function diaRegistroV203(desplazamiento=0, referencia=new Date()) {
    const fecha=new Date(referencia.getFullYear(),referencia.getMonth(),referencia.getDate()+desplazamiento,12);
    return fechaLocalISO(fecha);
}
function etiquetaFechaV203(fecha) {
    if(fecha===diaRegistroV203()) return "Hoy";
    if(fecha===diaRegistroV203(-1)) return "Ayer";
    return new Intl.DateTimeFormat("es",{day:"numeric",month:"short",year:"numeric"}).format(fechaDesdeISO(fecha));
}
function ajustarTiempoV203(total, incremento) {
    return Math.max(0,Math.min(1499,Math.round((Number(total)||0)+(Number(incremento)||0))));
}
function tiempoFormularioV203() {
    const h=Number(document.getElementById("horasRegistro")?.value);
    const m=Number(document.getElementById("minutosRegistro")?.value);
    return Number.isInteger(h)&&h>=0&&h<=24&&Number.isInteger(m)&&m>=0&&m<=59 ? h*60+m : null;
}
let fechaOtraV203=false;
let ultimoRegistroV203=null;
function actualizarRegistrarV203() {
    actualizarPersonajeEscenaRegistrarV259();
    actualizarSugerenciaPlanV259();
    const form=document.getElementById("formRegistro"); if(!form)return;
    actualizarCompanerosV259();
    const total=tiempoFormularioV203();
    document.getElementById("tiempoTotalV203").textContent=total===null?"Revisa el tiempo":formatearTiempo(total);
    actualizarBotonGuardarV259(total);
    const tipo=document.getElementById("tipoRegistro").value;
    form.dataset.actividad=tipo;
    form.querySelectorAll(".actividad-boton").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.tipo===tipo)));
    document.getElementById("grupoCursosBiblicos").classList.toggle("oculto",tipo!=="ministerio");
    const fecha=document.getElementById("fechaRegistro").value;
    const dia=fecha===diaRegistroV203()?"hoy":fecha===diaRegistroV203(-1)?"ayer":"otra";
    document.getElementById("fechaManualV203").hidden=!fechaOtraV203&&dia!=="otra";
    document.getElementById("fechaTextoV203").textContent=fecha&&fechaISOValida(fecha)?etiquetaFechaV203(fecha):"Elige una fecha";
    form.querySelectorAll("[data-dia-v203]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.diaV203===(fechaOtraV203?"otra":dia))));
    const plan=estado.agendaSalidas?.[fecha];
    const datos=plan?normalizarAgendaDia(plan):null;
    const disponible=datos&&actividadVisible(datos.tipo);
    document.getElementById("planRegistroV203").hidden=!disponible;
    document.getElementById("planTextoV203").textContent=disponible?textoPlanRegistroV259(fecha,datos,estado.registros):"";
}
function instalarRegistrarV203() {
    const form=document.getElementById("formRegistro");if(!form||form.dataset.v203)return;form.dataset.v203="1";
    document.getElementById("horasRegistro").inputMode="numeric";
    document.getElementById("minutosRegistro").inputMode="numeric";
    form.addEventListener("input",actualizarRegistrarV203);
    form.addEventListener("change",actualizarRegistrarV203);
    form.addEventListener("focusout",actualizarRegistrarV203);
    form.addEventListener("click",e=>{
        const b=e.target.closest("button");if(!b)return;
        if(b.dataset.diaV203){
            fechaOtraV203=b.dataset.diaV203==="otra";
            if(!fechaOtraV203)document.getElementById("fechaRegistro").value=diaRegistroV203(b.dataset.diaV203==="ayer"?-1:0);
            actualizarRegistrarV203();
            if(fechaOtraV203)document.getElementById("fechaRegistro").focus();
        }
        const incremento=b.dataset.ajusteV203??b.dataset.incrementoV203;
        if(incremento!==undefined){
            const actual=tiempoFormularioV203();
            if(actual===null){document.getElementById("horasRegistro").focus();return;}
            const total=ajustarTiempoV203(actual,incremento);
            document.getElementById("horasRegistro").value=String(Math.floor(total/60));
            document.getElementById("minutosRegistro").value=String(total%60);
        }
        actualizarRegistrarV203();
    });
    document.getElementById("usarPlanV203").addEventListener("click",()=>{
        const raw=estado.agendaSalidas?.[document.getElementById("fechaRegistro").value];if(!raw)return;
        const plan=normalizarAgendaDia(raw);if(!actividadVisible(plan.tipo))return;
        seleccionarActividad(plan.tipo);
        document.getElementById("companeroRegistro").value=plan.companero||"";
        document.getElementById("detallesRegistroV203").open=Boolean(plan.companero);
        actualizarRegistrarV203();
        document.getElementById("horasRegistro").focus();
    });
    document.getElementById("editarUltimoV203").addEventListener("click",()=>{
        if(ultimoRegistroV203&&estado.registros.some(r=>r.id===ultimoRegistroV203))abrirModalEdicion(ultimoRegistroV203);
    });
    document.getElementById("otroRegistroV203").addEventListener("click",()=>{
        document.getElementById("confirmacionRegistroV203").hidden=true;
        document.getElementById("mensajeFormulario").textContent="";
        form.querySelector('.actividad-boton.seleccionada')?.focus();
        form.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
    });
    window.addEventListener("miServicio:registroGuardadoV188",e=>{
        if(!e.detail?.registro)return;
        ultimoRegistroV203=e.detail.registro.id;
        fechaOtraV203=false;
        document.getElementById("detallesRegistroV203").open=false;
        document.getElementById("confirmacionRegistroV203").hidden=false;
        actualizarRegistrarV203();
    });
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)actualizarRegistrarV203();});
    actualizarRegistrarV203();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarRegistrarV203);else instalarRegistrarV203();

/* V259 · Atajos personales: solo preparan el formulario. */
function recordarActividadV259(tipo) {
    try { localStorage.setItem("miServicio.ultimaActividad",tipo); } catch(e) {}
}
function ultimaActividadV259() {
    let tipo="ministerio";
    try { tipo=localStorage.getItem("miServicio.ultimaActividad")||tipo; } catch(e) {}
    return ["ministerio","ldc","asambleas","otras"].includes(tipo)&&actividadVisible(tipo)?tipo:"ministerio";
}
function companerosRecientesV259(registros=[]) {
    const vistos=new Set(),nombres=[];
    const ordenados=[...registros].sort((a,b)=>String(b.modificadoEn||b.creadoEn||b.fecha||"").localeCompare(String(a.modificadoEn||a.creadoEn||a.fecha||"")));
    for(const r of ordenados){
        const nombre=String(r.companero||r.acompanante||r.compañero||"").trim().slice(0,80);
        const clave=nombre.toLocaleLowerCase("es");
        if(nombre&&!vistos.has(clave)){vistos.add(clave);nombres.push(nombre);}
        if(nombres.length===4)break;
    }
    return nombres;
}
function actualizarCompanerosV259() {
    const campo=document.getElementById("companeroRegistro");if(!campo)return;
    let lista=document.getElementById("companerosRecientesV259");
    if(!lista){
        lista=document.createElement("div");lista.id="companerosRecientesV259";lista.className="companeros-recientes-v259";
        lista.setAttribute("role","group");lista.setAttribute("aria-label","Acompañantes recientes");campo.after(lista);
        lista.addEventListener("click",e=>{
            const b=e.target.closest("button");if(!b)return;
            campo.value=b.textContent;campo.dispatchEvent(new Event("input",{bubbles:true}));
        });
    }
    const nombres=companerosRecientesV259(estado.registros),firma=JSON.stringify(nombres);
    lista.hidden=!nombres.length;
    if(lista.dataset.firma===firma)return;
    lista.dataset.firma=firma;lista.replaceChildren();
    nombres.forEach(nombre=>{const b=document.createElement("button");b.type="button";b.textContent=nombre;b.setAttribute("aria-label",`Elegir a ${nombre}`);lista.appendChild(b);});
}
function repetirActividadV259(id) {
    const registro=estado.registros.find(r=>r.id===id);if(!registro)return false;
    if(!actividadVisible(registro.tipo)){
        if(typeof avisoV202==="function")avisoV202("Activa esta actividad en Ajustes para repetirla.");
        return false;
    }
    const campo=id=>document.getElementById(id);
    const hayBorrador=(tiempoFormularioV203()||0)>0||campo("notasRegistro").value.trim()||campo("companeroRegistro").value.trim()||obtenerCursosBiblicosFormulario()>0;
    if(hayBorrador&&!window.confirm("Hay una actividad sin guardar en Registrar. ¿Quieres sustituirla por esta?"))return false;
    seleccionarVista("registrar");seleccionarActividad(registro.tipo);
    const total=ajustarTiempoV203(registro.minutos??registro.minutosTotales,0);
    campo("fechaRegistro").value=diaRegistroV203();fechaOtraV203=false;
    campo("horasRegistro").value=String(Math.floor(total/60));campo("minutosRegistro").value=String(total%60);
    campo("companeroRegistro").value=String(registro.companero||registro.acompanante||registro.compañero||"").slice(0,80);
    campo("notasRegistro").value=registro.notas||"";
    const cursos=registro.tipo==="ministerio"?Math.min(99,Math.max(0,Number(registro.cursosBiblicos)||0)):0;
    campo("cantidadCursosBiblicos").textContent=String(cursos);campo("cantidadCursosBiblicos").dataset.valor=String(cursos);
    campo("detallesRegistroV203").open=Boolean(campo("companeroRegistro").value||campo("notasRegistro").value||cursos);
    campo("confirmacionRegistroV203").hidden=true;
    campo("mensajeFormulario").textContent="Actividad preparada para hoy. Revisa los datos y pulsa Guardar.";
    campo("mensajeFormulario").classList.remove("error");
    actualizarRegistrarV203();borradorOcultoV259=false;guardarBorradorV259();campo("guardarRegistroV203").focus();return true;
}

/* V259 · Recuperación local, búsqueda y estados honestos. */
const CLAVE_BORRADOR_V259="miServicio.borradorRegistro";
let borradorOcultoV259=false;
function posibleDuplicadoV259(registros,nuevo){
    const texto=v=>String(v??"").trim().replace(/\s+/g," ").toLocaleLowerCase("es");
    return registros.some(r=>r.fecha===nuevo.fecha&&r.tipo===nuevo.tipo&&Number(r.minutos??r.minutosTotales)===Number(nuevo.minutos)&&texto(r.companero??r.acompanante??r.compañero)===texto(nuevo.companero)&&texto(r.notas)===texto(nuevo.notas)&&Number(r.cursosBiblicos||0)===Number(nuevo.cursosBiblicos||0));
}
function textoBusquedaV259(texto){return String(texto||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim();}
function coincideBusquedaV259(r,texto){
    const q=textoBusquedaV259(texto);if(!q)return true;
    return textoBusquedaV259([r.companero,r.acompanante,r.compañero,r.notas,r.tipo,r.fecha].filter(Boolean).join(" ")).includes(q);
}
function leerBorradorV259(){
    try{
        const d=JSON.parse(localStorage.getItem(CLAVE_BORRADOR_V259)||"null");
        if(!d||d.version!==1||!["ministerio","ldc","asambleas","otras"].includes(d.tipo)||!fechaISOValida(d.fecha))return null;
        return d;
    }catch(e){return null;}
}
function datosBorradorV259(){
    const campo=id=>document.getElementById(id);
    return {version:1,fecha:campo("fechaRegistro").value,tipo:campo("tipoRegistro").value,
        horas:campo("horasRegistro").value,minutos:campo("minutosRegistro").value,
        companero:campo("companeroRegistro").value.slice(0,80),notas:campo("notasRegistro").value,
        cursos:obtenerCursosBiblicosFormulario(),detalles:campo("detallesRegistroV203").open};
}
function borrarBorradorV259(){try{localStorage.removeItem(CLAVE_BORRADOR_V259);}catch(e){}document.getElementById("avisoBorradorV259")?.setAttribute("hidden","");}
function guardarBorradorV259(){
    if(borradorOcultoV259||!document.getElementById("formRegistro"))return;
    const d=datosBorradorV259();
    const tieneContenido=(Number(d.horas)||0)!==0||(Number(d.minutos)||0)!==0||d.companero.trim()||d.notas.trim()||d.cursos>0;
    try{if(tieneContenido)localStorage.setItem(CLAVE_BORRADOR_V259,JSON.stringify(d));else borrarBorradorV259();}catch(e){}
}
function recuperarBorradorV259(){
    const d=leerBorradorV259();if(!d)return false;
    const campo=id=>document.getElementById(id),aviso=campo("avisoBorradorV259");
    if(!actividadVisible(d.tipo)){
        borradorOcultoV259=true;
        campo("textoBorradorV259").textContent="Hay un borrador de una actividad oculta. Actívala en Ajustes para recuperarlo.";
        aviso.hidden=false;return false;
    }
    borradorOcultoV259=false;
    seleccionarActividad(d.tipo);campo("fechaRegistro").value=d.fecha;fechaOtraV203=false;
    campo("horasRegistro").value=String(d.horas??"0");campo("minutosRegistro").value=String(d.minutos??"0");
    campo("companeroRegistro").value=String(d.companero||"").slice(0,80);campo("notasRegistro").value=String(d.notas||"");
    const cursos=d.tipo==="ministerio"?Math.min(99,Math.max(0,Number(d.cursos)||0)):0;
    campo("cantidadCursosBiblicos").textContent=String(cursos);campo("cantidadCursosBiblicos").dataset.valor=String(cursos);
    campo("detallesRegistroV203").open=Boolean(d.detalles||d.companero||d.notas||cursos);
    actualizarRegistrarV203();campo("textoBorradorV259").textContent="Borrador recuperado. Puedes continuar donde lo dejaste.";aviso.hidden=false;return true;
}
function descartarBorradorV259(){
    const campo=id=>document.getElementById(id);
    campo("horasRegistro").value="0";campo("minutosRegistro").value="0";campo("companeroRegistro").value="";campo("notasRegistro").value="";
    reiniciarCursosBiblicos();establecerFechaActual();fechaOtraV203=false;campo("detallesRegistroV203").open=false;
    campo("confirmacionRegistroV203").hidden=true;campo("mensajeFormulario").textContent="";
    borradorOcultoV259=false;
    borrarBorradorV259();actualizarRegistrarV203();
}
function tiempoSyncV259(fecha,ahora=Date.now()){
    const ms=new Date(fecha).getTime();if(!Number.isFinite(ms)||ms>ahora+60000)return "";
    const min=Math.max(0,Math.floor((ahora-ms)/60000));
    if(min<1)return "hace un momento";if(min<60)return `hace ${min} min`;
    if(min<1440)return `hace ${Math.floor(min/60)} h`;
    return new Date(ms).toLocaleString("es-ES",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
}
function resumenSyncV259({conectado,online,tipo,texto,fecha,pendiente=false}){
    if(!conectado)return {corto:"Local",detalle:"Guardado en este dispositivo · OneDrive no conectado"};
    if(!online)return {corto:"Sin conexión",detalle:"Sin conexión · OneDrive se comprobará al volver"};
    if(tipo==="subiendo"||tipo==="bajando")return {corto:"Sincronizando…",detalle:"Sincronizando con OneDrive…"};
    if(pendiente||tipo==="pendiente"||/no se pudo|error|fall|protección activa/i.test(texto||""))return {corto:"Pendiente",detalle:"Cambios pendientes · revisa el estado de OneDrive"};
    const hace=fecha?tiempoSyncV259(fecha):"";
    return hace?{corto:"Al día",detalle:`Sincronizado ${hace}`}:{corto:"Conectado",detalle:"Conectado · pendiente de la primera comprobación"};
}
function actualizarSyncV259(){
    if(typeof almacenamiento==="undefined")return;
    const conectado=Boolean(almacenamiento.leer(STORAGE_KEYS.onedriveConectado,false));
    const st=almacenamiento.leer("miServicio.estadoSyncV134",null)||{};
    const fecha=almacenamiento.leer("miServicio.ultimaComprobacionOneDrive",null);
    const res=resumenSyncV259({conectado,online:navigator.onLine,tipo:st.tipo,texto:st.texto,fecha,pendiente:almacenamiento.leer("miServicio.onedriveCambioLocalPendiente",false)===true});
    const ultima=document.getElementById("ultimaSyncOneDrive");
    if(ultima){ultima.hidden=!conectado;ultima.textContent=res.detalle;}
    const label=document.getElementById("estadoConexionTextoV190");if(label)label.textContent=res.corto;
    const box=document.getElementById("estadoConexionV190");if(box)box.title=res.detalle;
    if(!conectado){const estado=document.getElementById("estadoSyncV134");if(estado)estado.textContent=res.detalle;}
    actualizarSeguridadDatosV259(res);
}
function instalarPracticoV259(){
    const form=document.getElementById("formRegistro");if(!form||form.dataset.practicoV259)return;form.dataset.practicoV259="1";
    recuperarBorradorV259();
    for(const tipo of ["input","change","click"])form.addEventListener(tipo,()=>{borradorOcultoV259=false;setTimeout(guardarBorradorV259,0);});
    document.getElementById("descartarBorradorV259")?.addEventListener("click",descartarBorradorV259);
    document.getElementById("buscarHistorialV259")?.addEventListener("input",renderizarHistorial);
    window.addEventListener("miServicio:registroGuardadoV188",borrarBorradorV259);
    window.addEventListener("pagehide",guardarBorradorV259);
    document.addEventListener("visibilitychange",()=>{if(document.hidden)guardarBorradorV259();else actualizarSyncV259();});
    for(const ev of ["miServicio:estadoSyncV190","online","offline"])window.addEventListener(ev,()=>setTimeout(actualizarSyncV259,0));
    setInterval(actualizarSyncV259,60000);actualizarSyncV259();
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarPracticoV259,{once:true});else instalarPracticoV259();

/* V259 · Resumen compartible y continuidad con el calendario. */
function prepararResumenCompartidoV259(ref,registros=estado.registros){
    const mes=claveMesV143(ref),resumen=resumenMesV143(ref);
    const cursos=Math.max(0,...registros.filter(r=>String(r.fecha||"").slice(0,7)===mes&&r.tipo==="ministerio").map(r=>Math.min(99,Math.max(0,Number(r.cursosBiblicos)||0))));
    const lineas=[`Mi Servicio · ${nombreMesV143(ref)}`,`Total registrado: ${formatearTiempo(resumen.total)}`];
    if(resumen.excedente>0){lineas.push(`Computan: ${formatearTiempo(resumen.computable)}`);lineas.push(`Excedente: ${formatearTiempo(resumen.excedente)}`);}
    for(const tipo of ["Ministerio","LDC","Asambleas","Otras"])if((resumen.tipos[tipo]||0)>0)lineas.push(`${tipo==="Otras"?nombreActividad("otras"):tipo}: ${formatearTiempo(resumen.tipos[tipo])}`);
    lineas.push(`Días activos: ${resumen.dias}`);
    if(cursos>0)lineas.push(`Cursos bíblicos: ${cursos} (máximo indicado en el mes)`);
    if(!resumen.registros)lineas.push("Sin actividad registrada este mes.");
    return lineas.join("\n");
}
async function compartirResumenV259(){
    const input=document.getElementById("mesResumenV143"),ref=fechaMesV202(input?.value);if(!ref)return;
    const texto=prepararResumenCompartidoV259(ref),status=document.getElementById("estadoCompartirV259"),manual=document.getElementById("textoCompartirV259");
    status.textContent="";manual.hidden=true;
    if(typeof navigator.share==="function"){
        try{await navigator.share({title:"Mi Servicio · Resumen mensual",text:texto});return;}
        catch(e){if(e?.name==="AbortError")return;}
    }
    if(navigator.clipboard?.writeText){
        try{await navigator.clipboard.writeText(texto);status.textContent="Resumen copiado. Puedes pegarlo donde quieras.";return;}catch(e){}
    }
    manual.value=texto;manual.hidden=false;status.textContent="Selecciona y copia el resumen para compartirlo.";manual.focus();manual.select();
}
function planSinRegistroV259(fecha,tipo,registros=[]){
    return !registros.some(r=>r.fecha===fecha&&r.tipo===tipo&&Number(r.minutos??r.minutosTotales)>0);
}
function textoPlanRegistroV259(fecha,plan,registros=[]){
    const pendiente=fecha<=diaRegistroV203()&&planSinRegistroV259(fecha,plan.tipo,registros);
    return `${pendiente?"Salida prevista · aún sin registrar":"Salida planificada"} · ${nombreActividad(plan.tipo)}${plan.companero?` · ${plan.companero}`:""}${plan.hora?` · ${plan.hora}`:""}`;
}
function abrirRegistroDiaV259(fecha){
    if(!fechaISOValida(fecha))return false;
    const campo=document.getElementById("fechaRegistro");
    const hayBorrador=(tiempoFormularioV203()||0)>0||document.getElementById("companeroRegistro").value.trim()||document.getElementById("notasRegistro").value.trim()||obtenerCursosBiblicosFormulario()>0;
    if(hayBorrador&&campo.value!==fecha&&!window.confirm("Hay una actividad sin guardar. ¿Quieres cambiar su fecha al día elegido? Se conservarán sus datos."))return false;
    seleccionarVista("registrar");campo.value=fecha;fechaOtraV203=false;
    document.getElementById("confirmacionRegistroV203").hidden=true;
    actualizarRegistrarV203();guardarBorradorV259();
    const destino=document.getElementById("planRegistroV203").hidden?document.getElementById("horasRegistro"):document.getElementById("usarPlanV203");destino.focus();return true;
}
function instalarCompartirV259(){
    document.getElementById("compartirMesV259")?.addEventListener("click",compartirResumenV259);
    const input=document.getElementById("mesResumenV143");
    const limpiar=()=>{const manual=document.getElementById("textoCompartirV259");if(manual)manual.hidden=true;const status=document.getElementById("estadoCompartirV259");if(status)status.textContent="";};
    input?.addEventListener("change",limpiar);
    document.querySelector(".v143-rm-nav")?.addEventListener("click",limpiar);
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarCompartirV259,{once:true});else instalarCompartirV259();

/* V259 · Preferencias personales y memoria visual. */
const CLAVE_HABITUAL_V259="miServicio.salidaHabitual";
const CLAVE_FRASE_PERSONAL_V259="miServicio.frasePersonal";
function validarHabitualV259(d){
    if(!d||!["ministerio","ldc","asambleas","otras"].includes(d.tipo))return null;
    const hora=String(d.hora||"");if(hora&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora))return null;
    const minutos=Number(d.minutosPrevistos||0);if(![0,30,60,90,120,180,240,300].includes(minutos))return null;
    return {tipo:d.tipo,companero:String(d.companero||"").trim().slice(0,80),hora,minutosPrevistos:minutos};
}
function leerHabitualV259(){try{return validarHabitualV259(JSON.parse(localStorage.getItem(CLAVE_HABITUAL_V259)||"null"));}catch(e){return null;}}
function actualizarHabitualV259(){
    const usar=document.getElementById("usarHabitualV259"),quitar=document.getElementById("quitarHabitualV259"),texto=document.getElementById("descripcionHabitualV259"),d=leerHabitualV259();
    if(usar)usar.hidden=!d;if(quitar)quitar.hidden=!d;
    if(texto)texto.textContent=d?`${nombreActividad(d.tipo)}${d.companero?` · ${d.companero}`:""}${d.hora?` · ${d.hora}`:""}`:"Guarda aquí los datos que sueles usar al planificar.";
}
function guardarHabitualV259(){
    const campo=id=>document.getElementById(id),d=validarHabitualV259({tipo:campo("tipoAgendaSalida").value,companero:campo("nombreAgendaSalida").value,hora:campo("horaAgendaV202").value,minutosPrevistos:campo("duracionAgendaSalida").value});
    if(!d||!actividadVisible(d.tipo)){avisoV202("Revisa los datos de la salida habitual.");return false;}
    try{localStorage.setItem(CLAVE_HABITUAL_V259,JSON.stringify(d));}catch(e){avisoV202("No se pudo guardar la salida habitual.");return false;}
    actualizarHabitualV259();avisoV202("Salida habitual guardada");return true;
}
function usarHabitualV259(){
    const d=leerHabitualV259();if(!d)return false;
    if(!actividadVisible(d.tipo)){avisoV202("Activa esta actividad en Ajustes para usar tu salida habitual.");return false;}
    const campo=id=>document.getElementById(id);
    campo("tipoAgendaSalida").value=d.tipo;campo("nombreAgendaSalida").value=d.companero;campo("horaAgendaV202").value=d.hora;campo("duracionAgendaSalida").value=String(d.minutosPrevistos);
    campo("mensajeAgendaSalida").textContent="Salida habitual preparada. Revisa el día y pulsa Guardar.";
    campo("guardarAgendaSalida").focus();return true;
}
function quitarHabitualV259(){try{localStorage.removeItem(CLAVE_HABITUAL_V259);}catch(e){avisoV202("No se pudo quitar la salida habitual.");return;}actualizarHabitualV259();avisoV202("Salida habitual eliminada");}
function estadoDiaV259(plan,registros=[]){
    const reales=registros.filter(r=>Number(r.minutos??r.minutosTotales)>0);
    if(plan){
        const cumplido=reales.some(r=>r.tipo===plan.tipo);
        if(cumplido)return {simbolo:"✓",clase:"registrada",texto:"Salida prevista con actividad registrada"};
        if(reales.length)return {simbolo:"○ ✓",clase:"mixta",texto:"Salida prevista sin registrar; otra actividad registrada"};
        return {simbolo:"○",clase:"prevista",texto:"Salida prevista sin registrar"};
    }
    return reales.length?{simbolo:"✓",clase:"registrada",texto:"Actividad registrada"}:null;
}
function indicadorDiaV259(boton,plan,registros){
    const d=estadoDiaV259(plan,registros);if(!d)return;
    const marca=document.createElement("span");marca.className=`calendario-estado-v259 ${d.clase}`;marca.textContent=d.simbolo;marca.setAttribute("aria-hidden","true");marca.title=d.texto;boton.appendChild(marca);
    boton.setAttribute("aria-label",`${boton.getAttribute("aria-label")||""}. ${d.texto}`);
}
function cierreMesV259(ref,registros=[],hoy=new Date()){
    if(new Date(ref.getFullYear(),ref.getMonth(),1)>=new Date(hoy.getFullYear(),hoy.getMonth(),1))return "";
    const clave=claveMesV143(ref),reales=registros.filter(r=>String(r.fecha||"").slice(0,7)===clave&&minutosRegistroV143(r)>0);
    const ministerio=new Set(reales.filter(r=>r.tipo==="ministerio").map(r=>r.fecha));
    if(ministerio.size)return `Este mes dedicaste tiempo al ministerio en ${ministerio.size} ${ministerio.size===1?"día":"días"}.`;
    const dias=new Set(reales.map(r=>r.fecha));
    return dias.size?`Este mes registraste actividad en ${dias.size} ${dias.size===1?"día":"días"}.`:"Este mes no tiene actividad registrada.";
}
function frasePersonalV259(){try{return String(localStorage.getItem(CLAVE_FRASE_PERSONAL_V259)||"").trim().slice(0,140);}catch(e){return "";}}
function guardarFrasePersonalV259(){
    const campo=document.getElementById("frasePersonalV259"),texto=campo.value.trim().slice(0,140),estado=document.getElementById("estadoFrasePersonalV259");
    try{if(texto)localStorage.setItem(CLAVE_FRASE_PERSONAL_V259,texto);else localStorage.removeItem(CLAVE_FRASE_PERSONAL_V259);}catch(e){estado.textContent="No se pudo guardar la frase.";return;}
    campo.value=texto;estado.textContent=texto?"Frase guardada. Alternará con las frases de Inicio.":"Inicio vuelve a usar sus frases habituales.";
    const total=resumenMesV143(new Date()).computable;actualizarFraseAnimoInicio(total,true);
}
function instalarPersonalV259(){
    document.getElementById("guardarHabitualV259")?.addEventListener("click",guardarHabitualV259);
    document.getElementById("usarHabitualV259")?.addEventListener("click",usarHabitualV259);
    document.getElementById("quitarHabitualV259")?.addEventListener("click",quitarHabitualV259);
    const frase=document.getElementById("frasePersonalV259");if(frase)frase.value=frasePersonalV259();
    document.getElementById("guardarFrasePersonalV259")?.addEventListener("click",guardarFrasePersonalV259);
    actualizarHabitualV259();
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarPersonalV259,{once:true});else instalarPersonalV259();

/* V259 · Pulido discreto. */
const CLAVE_NOMBRE_SALUDO_V259="miServicio.nombreSaludo";
let diaSeleccionadoV259="",timerGuardadoV259;
function nombreSaludoV259(){try{return String(localStorage.getItem(CLAVE_NOMBRE_SALUDO_V259)||"").trim().slice(0,24);}catch(e){return "";}}
function guardarNombreSaludoV259(){
    const campo=document.getElementById("nombreSaludoV259");if(!campo)return;
    const nombre=campo.value.trim().slice(0,24);
    try{if(nombre)localStorage.setItem(CLAVE_NOMBRE_SALUDO_V259,nombre);else localStorage.removeItem(CLAVE_NOMBRE_SALUDO_V259);}catch(e){avisoV202("No se pudo guardar el nombre del saludo.");return;}
    campo.value=nombre;saludoDinamicoV195();
}
function marcarDiaV259(fecha){
    diaSeleccionadoV259=fecha;
    document.querySelectorAll("#calendarioInicio button[data-fecha-v259]").forEach(b=>{
        const seleccionado=b.dataset.fechaV259===fecha;b.classList.toggle("seleccionado-v259",seleccionado);b.setAttribute("aria-pressed",String(seleccionado));
    });
}
function mostrarGuardadoV259(){
    const chip=document.getElementById("guardadoDiscretoV259");if(!chip)return;
    clearTimeout(timerGuardadoV259);chip.hidden=false;
    chip.classList.remove("entrar-v259");
    if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){void chip.offsetWidth;chip.classList.add("entrar-v259");}
    timerGuardadoV259=setTimeout(()=>{chip.hidden=true;chip.classList.remove("entrar-v259");},2400);
}
function instalarPulidoV259(){
    const campo=document.getElementById("nombreSaludoV259");if(campo)campo.value=nombreSaludoV259();
    document.getElementById("guardarAjustes")?.addEventListener("click",guardarNombreSaludoV259);
    saludoDinamicoV195();
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarPulidoV259,{once:true});else instalarPulidoV259();

/* V259 · Un único submit, compacto y con el nombre accesible del tiempo. */
function actualizarBotonGuardarV259(total){
    const boton=document.getElementById("guardarRegistroV203");if(!boton)return;
    const texto=total>0?`Guardar ${formatearTiempo(total)}`:"Guardar actividad";
    boton.setAttribute("aria-label",texto);boton.title=texto;
}
let rafRegistrarV259=0;
function ajustarRegistrarPantallaV259(){
    rafRegistrarV259=0;
    const body=document.body,nav=document.querySelector(".barra-navegacion");
    const alto=nav?.getBoundingClientRect().height;
    if(Number.isFinite(alto)&&alto>0)body.style.setProperty("--registro-nav-alto",alto+"px");
    const registrar=document.getElementById("vista-registrar");
    const editando=registrar?.classList.contains("activa")&&registrar.contains(document.activeElement)&&document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
    body.classList.toggle("registro-editando-v259",Boolean(editando));
}
function programarRegistrarPantallaV259(){
    if(!rafRegistrarV259)rafRegistrarV259=requestAnimationFrame(ajustarRegistrarPantallaV259);
}
function instalarRegistrarPantallaV259(){
    const registrar=document.getElementById("vista-registrar");if(!registrar)return;
    new MutationObserver(programarRegistrarPantallaV259).observe(registrar,{attributes:true,attributeFilter:["class"]});
    if(typeof ResizeObserver!=="undefined"){
        const nav=document.querySelector(".barra-navegacion");if(nav)new ResizeObserver(programarRegistrarPantallaV259).observe(nav);
    }
    window.addEventListener("resize",programarRegistrarPantallaV259);window.visualViewport?.addEventListener("resize",programarRegistrarPantallaV259);
    document.addEventListener("focusin",programarRegistrarPantallaV259);document.addEventListener("focusout",programarRegistrarPantallaV259);
    programarRegistrarPantallaV259();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarRegistrarPantallaV259,{once:true});else instalarRegistrarPantallaV259();

/* V259 · Decoración local voluntaria: no se guarda dentro de los registros. */
function leerEscenaRegistrarV259(){
    try{return localStorage.getItem("miServicio.escenaRegistrar")==="si";}catch(e){return false;}
}
function aplicarEscenaRegistrarV259(activa){
    actualizarPersonajeEscenaRegistrarV259();
    const habilitada=activa===true;
    const escena=document.getElementById("escenaRegistrarV259"),campo=document.getElementById("activarEscenaRegistrarV259");
    if(escena)escena.hidden=!habilitada;
    if(campo)campo.checked=habilitada;
}
function guardarEscenaRegistrarV259(activa){
    const anterior=document.getElementById("escenaRegistrarV259")?.hidden===false;
    const estado=document.getElementById("estadoEscenaRegistrarV259");
    try{localStorage.setItem("miServicio.escenaRegistrar",activa===true?"si":"no");}
    catch(e){aplicarEscenaRegistrarV259(anterior);if(estado)estado.textContent="No se pudo guardar la elección. Inténtalo de nuevo.";return false;}
    aplicarEscenaRegistrarV259(activa===true);
    if(estado)estado.textContent=activa===true?"Escena activada en este dispositivo.":"Escena desactivada.";
    return true;
}
function instalarEscenaRegistrarV259(){
    aplicarEscenaRegistrarV259(leerEscenaRegistrarV259());
    document.getElementById("activarEscenaRegistrarV259")?.addEventListener("change",e=>guardarEscenaRegistrarV259(e.target.checked));
    document.querySelector("#escenaRegistrarV259 img")?.addEventListener("error",()=>{const escena=document.getElementById("escenaRegistrarV259");if(escena)escena.hidden=true;});
}
window.addEventListener("storage",e=>{if(e.key==="miServicio.escenaRegistrar"||e.key===null)aplicarEscenaRegistrarV259(leerEscenaRegistrarV259());});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarEscenaRegistrarV259,{once:true});else instalarEscenaRegistrarV259();

/* V259 · El corazón elegido en el perfil tiene su propia escena. */
function rutaEscenaRegistrarV259(personaje){
    return personaje==="corazon"?"escena-corazon-v259.png":"escena-registrar-v259.png";
}
function actualizarPersonajeEscenaRegistrarV259(){
    const imagen=document.querySelector("#escenaRegistrarV259 img");if(!imagen)return;
    const ruta=rutaEscenaRegistrarV259(estado.preferencias?.personajeProgreso);
    if(imagen.getAttribute("src")!==ruta)imagen.setAttribute("src",ruta);
}
window.addEventListener("miServicio:interfazListaV201",actualizarPersonajeEscenaRegistrarV259);

/* V259 · Estado comprobado en disco y copia separada de la nube. */
function resumenLocalV259(valor){
    if(valor===null)return "Todavía no hay registros guardados en este dispositivo.";
    const datos=JSON.parse(valor);
    if(!Array.isArray(datos))throw new Error("Formato local no válido");
    return datos.length===1?"1 registro guardado en este dispositivo.":`${datos.length} registros guardados en este dispositivo.`;
}
function actualizarSeguridadDatosV259(resumen){
    const local=document.getElementById("seguridadLocalV259"),nube=document.getElementById("seguridadNubeV259"),copia=document.getElementById("seguridadCopiaV259");
    if(local){try{local.textContent=resumenLocalV259(localStorage.getItem(STORAGE_KEYS.registros));}catch(e){local.textContent="No se ha podido comprobar el guardado local. Revisa el aviso de la última acción.";}}
    if(nube)nube.textContent=resumen?.detalle||"OneDrive pendiente de comprobar.";
    if(copia){const fecha=leerUltimaCopiaSeguridad();copia.textContent=fecha?"Última copia registrada: "+fecha.toLocaleString("es-ES",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Todavía no hay una copia de seguridad registrada.";}
}
function instalarPulidoFinalV259(){
    document.getElementById("copiaRapidaV259")?.addEventListener("click",()=>{document.getElementById("exportarDatos")?.click();actualizarSyncV259();});
    window.addEventListener("focus",actualizarSyncV259);
    window.addEventListener("storage",actualizarSyncV259);
    window.addEventListener("miServicio:interfazListaV201",actualizarSyncV259);
    actualizarSyncV259();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarPulidoFinalV259,{once:true});else instalarPulidoFinalV259();

/* V259 · Tres acciones de fin de mes, sin cerrar ni modificar registros. */
function mesParaCierreV259(hoy=new Date()){
    const dia=hoy.getDate(),anio=hoy.getFullYear(),mes=hoy.getMonth();
    if(!Number.isFinite(hoy.getTime()))return null;
    if(dia<=7)return new Date(anio,mes-1,1,12);
    const ultimo=new Date(anio,mes+1,0,12).getDate();
    return dia>=ultimo-2?new Date(anio,mes,1,12):null;
}
function cierreMesOcultoV259(clave){
    try{return localStorage.getItem("miServicio.cierreMesOculto")===clave;}catch(e){return false;}
}
function actualizarCierreMesV259(hoy=new Date()){
    const card=document.getElementById("cierreMesInicioV259");if(!card)return;
    const ref=mesParaCierreV259(hoy),clave=ref?claveMesV143(ref):"";
    if(!ref||cierreMesOcultoV259(clave)){card.hidden=true;card.open=false;card.dataset.mes="";return;}
    const cambio=card.dataset.mes!==clave;
    card.hidden=false;card.dataset.mes=clave;
    if(cambio){card.open=false;document.getElementById("estadoCierreMesV259").textContent="";}
    const nombre=ref.toLocaleDateString("es-ES",{month:"long",year:"numeric"}),enCurso=ref.getFullYear()===hoy.getFullYear()&&ref.getMonth()===hoy.getMonth();
    document.getElementById("tituloCierreMesV259").textContent=(enCurso?"Preparar cierre · ":"Cierre · ")+nombre;
    document.getElementById("detalleCierreMesV259").textContent=enCurso?"El mes sigue en curso. Puedes revisarlo ahora y actualizarlo al terminar.":"Revisa el resumen del mes antes de compartirlo y guarda una copia.";
}
function abrirResumenCierreV259(){
    const clave=document.getElementById("cierreMesInicioV259")?.dataset.mes,ref=fechaMesV202(clave);
    if(!ref)return false;
    const input=document.getElementById("mesResumenV143");if(!input)return false;
    input.value=clave;seleccionarVista("estadisticas");pintarResumenMensualV143(ref);
    document.getElementById("resumenMensualV143")?.scrollIntoView({block:"start",behavior:"auto"});
    return true;
}
function crearCopiaCierreV259(){
    const estado=document.getElementById("estadoCierreMesV259"),ok=exportarCopiaSeguridad();
    if(estado)estado.textContent=ok?"Copia preparada. Guarda el archivo en una ubicación que puedas encontrar.":"No se pudo preparar la copia. Inténtalo de nuevo.";
    if(typeof actualizarSyncV259==="function")actualizarSyncV259();
    return ok;
}
function ocultarCierreMesV259(){
    const card=document.getElementById("cierreMesInicioV259"),clave=card?.dataset.mes;if(!clave)return false;
    try{localStorage.setItem("miServicio.cierreMesOculto",clave);}catch(e){document.getElementById("estadoCierreMesV259").textContent="No se pudo guardar la elección. Puedes plegar la tarjeta.";return false;}
    const devolverFoco=card.contains(document.activeElement);card.open=false;card.hidden=true;
    if(devolverFoco)document.getElementById("botonCalendarioInicio")?.focus();
    return true;
}
function instalarCierreMesV259(){
    document.getElementById("revisarCierreMesV259")?.addEventListener("click",abrirResumenCierreV259);
    document.getElementById("compartirCierreMesV259")?.addEventListener("click",()=>{if(abrirResumenCierreV259())compartirResumenV259();});
    document.getElementById("copiaCierreMesV259")?.addEventListener("click",crearCopiaCierreV259);
    document.getElementById("ocultarCierreMesV259")?.addEventListener("click",ocultarCierreMesV259);
    document.getElementById("cierreMesInicioV259")?.addEventListener("toggle",()=>programarEncajeV259(true));
    window.addEventListener("miServicio:interfazListaV201",()=>actualizarCierreMesV259());
    window.addEventListener("storage",e=>{if(e.key==="miServicio.cierreMesOculto"||e.key===null)actualizarCierreMesV259();});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)actualizarCierreMesV259();});
    setInterval(actualizarCierreMesV259,60000);actualizarCierreMesV259();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarCierreMesV259,{once:true});else instalarCierreMesV259();
