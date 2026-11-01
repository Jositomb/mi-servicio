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
    actualizarPersonajeEscenaRegistrarV260();
    actualizarSugerenciaPlanV260();
    const form=document.getElementById("formRegistro"); if(!form)return;
    actualizarCompanerosV260();
    const total=tiempoFormularioV203();
    document.getElementById("tiempoTotalV203").textContent=total===null?"Revisa el tiempo":formatearTiempo(total);
    actualizarBotonGuardarV260(total);
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
    document.getElementById("planTextoV203").textContent=disponible?textoPlanRegistroV260(fecha,datos,estado.registros):"";
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

/* V260 · Atajos personales: solo preparan el formulario. */
function recordarActividadV260(tipo) {
    try { localStorage.setItem("miServicio.ultimaActividad",tipo); } catch(e) {}
}
function ultimaActividadV260() {
    let tipo="ministerio";
    try { tipo=localStorage.getItem("miServicio.ultimaActividad")||tipo; } catch(e) {}
    return ["ministerio","ldc","asambleas","otras"].includes(tipo)&&actividadVisible(tipo)?tipo:"ministerio";
}
function companerosRecientesV260(registros=[]) {
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
function actualizarCompanerosV260() {
    const campo=document.getElementById("companeroRegistro");if(!campo)return;
    let lista=document.getElementById("companerosRecientesV260");
    if(!lista){
        lista=document.createElement("div");lista.id="companerosRecientesV260";lista.className="companeros-recientes-v260";
        lista.setAttribute("role","group");lista.setAttribute("aria-label","Acompañantes recientes");campo.after(lista);
        lista.addEventListener("click",e=>{
            const b=e.target.closest("button");if(!b)return;
            campo.value=b.textContent;campo.dispatchEvent(new Event("input",{bubbles:true}));
        });
    }
    const nombres=companerosRecientesV260(estado.registros),firma=JSON.stringify(nombres);
    lista.hidden=!nombres.length;
    if(lista.dataset.firma===firma)return;
    lista.dataset.firma=firma;lista.replaceChildren();
    nombres.forEach(nombre=>{const b=document.createElement("button");b.type="button";b.textContent=nombre;b.setAttribute("aria-label",`Elegir a ${nombre}`);lista.appendChild(b);});
}
function repetirActividadV260(id) {
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
    actualizarRegistrarV203();borradorOcultoV260=false;guardarBorradorV260();campo("guardarRegistroV203").focus();return true;
}

/* V260 · Recuperación local, búsqueda y estados honestos. */
const CLAVE_BORRADOR_V260="miServicio.borradorRegistro";
let borradorOcultoV260=false;
function posibleDuplicadoV260(registros,nuevo){
    const texto=v=>String(v??"").trim().replace(/\s+/g," ").toLocaleLowerCase("es");
    return registros.some(r=>r.fecha===nuevo.fecha&&r.tipo===nuevo.tipo&&Number(r.minutos??r.minutosTotales)===Number(nuevo.minutos)&&texto(r.companero??r.acompanante??r.compañero)===texto(nuevo.companero)&&texto(r.notas)===texto(nuevo.notas)&&Number(r.cursosBiblicos||0)===Number(nuevo.cursosBiblicos||0));
}
function textoBusquedaV260(texto){return String(texto||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim();}
function coincideBusquedaV260(r,texto){
    const q=textoBusquedaV260(texto);if(!q)return true;
    return textoBusquedaV260([r.companero,r.acompanante,r.compañero,r.notas,r.tipo,r.fecha].filter(Boolean).join(" ")).includes(q);
}
function leerBorradorV260(){
    try{
        const d=JSON.parse(localStorage.getItem(CLAVE_BORRADOR_V260)||"null");
        if(!d||d.version!==1||!["ministerio","ldc","asambleas","otras"].includes(d.tipo)||!fechaISOValida(d.fecha))return null;
        return d;
    }catch(e){return null;}
}
function datosBorradorV260(){
    const campo=id=>document.getElementById(id);
    return {version:1,fecha:campo("fechaRegistro").value,tipo:campo("tipoRegistro").value,
        horas:campo("horasRegistro").value,minutos:campo("minutosRegistro").value,
        companero:campo("companeroRegistro").value.slice(0,80),notas:campo("notasRegistro").value,
        cursos:obtenerCursosBiblicosFormulario(),detalles:campo("detallesRegistroV203").open};
}
function borrarBorradorV260(){try{localStorage.removeItem(CLAVE_BORRADOR_V260);}catch(e){}document.getElementById("avisoBorradorV260")?.setAttribute("hidden","");}
function guardarBorradorV260(){
    if(borradorOcultoV260||!document.getElementById("formRegistro"))return;
    const d=datosBorradorV260();
    const tieneContenido=(Number(d.horas)||0)!==0||(Number(d.minutos)||0)!==0||d.companero.trim()||d.notas.trim()||d.cursos>0;
    try{if(tieneContenido)localStorage.setItem(CLAVE_BORRADOR_V260,JSON.stringify(d));else borrarBorradorV260();}catch(e){}
}
function recuperarBorradorV260(){
    const d=leerBorradorV260();if(!d)return false;
    const campo=id=>document.getElementById(id),aviso=campo("avisoBorradorV260");
    if(!actividadVisible(d.tipo)){
        borradorOcultoV260=true;
        campo("textoBorradorV260").textContent="Hay un borrador de una actividad oculta. Actívala en Ajustes para recuperarlo.";
        aviso.hidden=false;return false;
    }
    borradorOcultoV260=false;
    seleccionarActividad(d.tipo);campo("fechaRegistro").value=d.fecha;fechaOtraV203=false;
    campo("horasRegistro").value=String(d.horas??"0");campo("minutosRegistro").value=String(d.minutos??"0");
    campo("companeroRegistro").value=String(d.companero||"").slice(0,80);campo("notasRegistro").value=String(d.notas||"");
    const cursos=d.tipo==="ministerio"?Math.min(99,Math.max(0,Number(d.cursos)||0)):0;
    campo("cantidadCursosBiblicos").textContent=String(cursos);campo("cantidadCursosBiblicos").dataset.valor=String(cursos);
    campo("detallesRegistroV203").open=Boolean(d.detalles||d.companero||d.notas||cursos);
    actualizarRegistrarV203();campo("textoBorradorV260").textContent="Borrador recuperado. Puedes continuar donde lo dejaste.";aviso.hidden=false;return true;
}
function descartarBorradorV260(){
    const campo=id=>document.getElementById(id);
    campo("horasRegistro").value="0";campo("minutosRegistro").value="0";campo("companeroRegistro").value="";campo("notasRegistro").value="";
    reiniciarCursosBiblicos();establecerFechaActual();fechaOtraV203=false;campo("detallesRegistroV203").open=false;
    campo("confirmacionRegistroV203").hidden=true;campo("mensajeFormulario").textContent="";
    borradorOcultoV260=false;
    borrarBorradorV260();actualizarRegistrarV203();
}
function tiempoSyncV260(fecha,ahora=Date.now()){
    const ms=new Date(fecha).getTime();if(!Number.isFinite(ms)||ms>ahora+60000)return "";
    const min=Math.max(0,Math.floor((ahora-ms)/60000));
    if(min<1)return "hace un momento";if(min<60)return `hace ${min} min`;
    if(min<1440)return `hace ${Math.floor(min/60)} h`;
    return new Date(ms).toLocaleString("es-ES",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
}
function resumenSyncV260({conectado,online,tipo,texto,fecha,pendiente=false}){
    if(!conectado)return {corto:"Local",detalle:"Guardado en este dispositivo · OneDrive no conectado"};
    if(!online)return {corto:"Sin conexión",detalle:"Sin conexión · OneDrive se comprobará al volver"};
    if(tipo==="subiendo"||tipo==="bajando")return {corto:"Sincronizando…",detalle:"Sincronizando con OneDrive…"};
    if(pendiente||tipo==="pendiente"||/no se pudo|error|fall|protección activa/i.test(texto||""))return {corto:"Pendiente",detalle:"Cambios pendientes · revisa el estado de OneDrive"};
    const hace=fecha?tiempoSyncV260(fecha):"";
    return hace?{corto:"Al día",detalle:`Sincronizado ${hace}`}:{corto:"Conectado",detalle:"Conectado · pendiente de la primera comprobación"};
}
function actualizarSyncV260(){
    if(typeof almacenamiento==="undefined")return;
    const conectado=Boolean(almacenamiento.leer(STORAGE_KEYS.onedriveConectado,false));
    const st=almacenamiento.leer("miServicio.estadoSyncV134",null)||{};
    const fecha=almacenamiento.leer("miServicio.ultimaComprobacionOneDrive",null);
    const res=resumenSyncV260({conectado,online:navigator.onLine,tipo:st.tipo,texto:st.texto,fecha,pendiente:almacenamiento.leer("miServicio.onedriveCambioLocalPendiente",false)===true});
    const ultima=document.getElementById("ultimaSyncOneDrive");
    if(ultima){ultima.hidden=!conectado;ultima.textContent=res.detalle;}
    const label=document.getElementById("estadoConexionTextoV190");if(label)label.textContent=res.corto;
    const box=document.getElementById("estadoConexionV190");if(box)box.title=res.detalle;
    if(!conectado){const estado=document.getElementById("estadoSyncV134");if(estado)estado.textContent=res.detalle;}
    actualizarSeguridadDatosV260(res);
}
function instalarPracticoV260(){
    const form=document.getElementById("formRegistro");if(!form||form.dataset.practicoV260)return;form.dataset.practicoV260="1";
    recuperarBorradorV260();
    for(const tipo of ["input","change","click"])form.addEventListener(tipo,()=>{borradorOcultoV260=false;setTimeout(guardarBorradorV260,0);});
    document.getElementById("descartarBorradorV260")?.addEventListener("click",descartarBorradorV260);
    document.getElementById("buscarHistorialV260")?.addEventListener("input",renderizarHistorial);
    window.addEventListener("miServicio:registroGuardadoV188",borrarBorradorV260);
    window.addEventListener("pagehide",guardarBorradorV260);
    document.addEventListener("visibilitychange",()=>{if(document.hidden)guardarBorradorV260();else actualizarSyncV260();});
    for(const ev of ["miServicio:estadoSyncV190","online","offline"])window.addEventListener(ev,()=>setTimeout(actualizarSyncV260,0));
    setInterval(actualizarSyncV260,60000);actualizarSyncV260();
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarPracticoV260,{once:true});else instalarPracticoV260();

/* V260 · Resumen compartible y continuidad con el calendario. */
function prepararResumenCompartidoV260(ref,registros=estado.registros){
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
async function compartirResumenV260(){
    const input=document.getElementById("mesResumenV143"),ref=fechaMesV202(input?.value);if(!ref)return;
    const texto=prepararResumenCompartidoV260(ref),status=document.getElementById("estadoCompartirV260"),manual=document.getElementById("textoCompartirV260");
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
function planSinRegistroV260(fecha,tipo,registros=[]){
    return !registros.some(r=>r.fecha===fecha&&r.tipo===tipo&&Number(r.minutos??r.minutosTotales)>0);
}
function textoPlanRegistroV260(fecha,plan,registros=[]){
    const pendiente=fecha<=diaRegistroV203()&&planSinRegistroV260(fecha,plan.tipo,registros);
    return `${pendiente?"Salida prevista · aún sin registrar":"Salida planificada"} · ${nombreActividad(plan.tipo)}${plan.companero?` · ${plan.companero}`:""}${plan.hora?` · ${plan.hora}`:""}`;
}
function abrirRegistroDiaV260(fecha){
    if(!fechaISOValida(fecha))return false;
    const campo=document.getElementById("fechaRegistro");
    const hayBorrador=(tiempoFormularioV203()||0)>0||document.getElementById("companeroRegistro").value.trim()||document.getElementById("notasRegistro").value.trim()||obtenerCursosBiblicosFormulario()>0;
    if(hayBorrador&&campo.value!==fecha&&!window.confirm("Hay una actividad sin guardar. ¿Quieres cambiar su fecha al día elegido? Se conservarán sus datos."))return false;
    seleccionarVista("registrar");campo.value=fecha;fechaOtraV203=false;
    document.getElementById("confirmacionRegistroV203").hidden=true;
    actualizarRegistrarV203();guardarBorradorV260();
    const destino=document.getElementById("planRegistroV203").hidden?document.getElementById("horasRegistro"):document.getElementById("usarPlanV203");destino.focus();return true;
}
function instalarCompartirV260(){
    document.getElementById("compartirMesV260")?.addEventListener("click",compartirResumenV260);
    const input=document.getElementById("mesResumenV143");
    const limpiar=()=>{const manual=document.getElementById("textoCompartirV260");if(manual)manual.hidden=true;const status=document.getElementById("estadoCompartirV260");if(status)status.textContent="";};
    input?.addEventListener("change",limpiar);
    document.querySelector(".v143-rm-nav")?.addEventListener("click",limpiar);
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarCompartirV260,{once:true});else instalarCompartirV260();

/* V260 · Preferencias personales y memoria visual. */
const CLAVE_HABITUAL_V260="miServicio.salidaHabitual";
const CLAVE_FRASE_PERSONAL_V260="miServicio.frasePersonal";
function validarHabitualV260(d){
    if(!d||!["ministerio","ldc","asambleas","otras"].includes(d.tipo))return null;
    const hora=String(d.hora||"");if(hora&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora))return null;
    const minutos=Number(d.minutosPrevistos||0);if(![0,30,60,90,120,180,240,300].includes(minutos))return null;
    return {tipo:d.tipo,companero:String(d.companero||"").trim().slice(0,80),hora,minutosPrevistos:minutos};
}
function leerHabitualV260(){try{return validarHabitualV260(JSON.parse(localStorage.getItem(CLAVE_HABITUAL_V260)||"null"));}catch(e){return null;}}
function actualizarHabitualV260(){
    const usar=document.getElementById("usarHabitualV260"),quitar=document.getElementById("quitarHabitualV260"),texto=document.getElementById("descripcionHabitualV260"),d=leerHabitualV260();
    if(usar)usar.hidden=!d;if(quitar)quitar.hidden=!d;
    if(texto)texto.textContent=d?`${nombreActividad(d.tipo)}${d.companero?` · ${d.companero}`:""}${d.hora?` · ${d.hora}`:""}`:"Guarda aquí los datos que sueles usar al planificar.";
}
function guardarHabitualV260(){
    const campo=id=>document.getElementById(id),d=validarHabitualV260({tipo:campo("tipoAgendaSalida").value,companero:campo("nombreAgendaSalida").value,hora:campo("horaAgendaV202").value,minutosPrevistos:campo("duracionAgendaSalida").value});
    if(!d||!actividadVisible(d.tipo)){avisoV202("Revisa los datos de la salida habitual.");return false;}
    try{localStorage.setItem(CLAVE_HABITUAL_V260,JSON.stringify(d));}catch(e){avisoV202("No se pudo guardar la salida habitual.");return false;}
    actualizarHabitualV260();avisoV202("Salida habitual guardada");return true;
}
function usarHabitualV260(){
    const d=leerHabitualV260();if(!d)return false;
    if(!actividadVisible(d.tipo)){avisoV202("Activa esta actividad en Ajustes para usar tu salida habitual.");return false;}
    const campo=id=>document.getElementById(id);
    campo("tipoAgendaSalida").value=d.tipo;campo("nombreAgendaSalida").value=d.companero;campo("horaAgendaV202").value=d.hora;campo("duracionAgendaSalida").value=String(d.minutosPrevistos);
    campo("mensajeAgendaSalida").textContent="Salida habitual preparada. Revisa el día y pulsa Guardar.";
    campo("guardarAgendaSalida").focus();return true;
}
function quitarHabitualV260(){try{localStorage.removeItem(CLAVE_HABITUAL_V260);}catch(e){avisoV202("No se pudo quitar la salida habitual.");return;}actualizarHabitualV260();avisoV202("Salida habitual eliminada");}
function estadoDiaV260(plan,registros=[]){
    const reales=registros.filter(r=>Number(r.minutos??r.minutosTotales)>0);
    if(plan){
        const cumplido=reales.some(r=>r.tipo===plan.tipo);
        if(cumplido)return {simbolo:"✓",clase:"registrada",texto:"Salida prevista con actividad registrada"};
        if(reales.length)return {simbolo:"○ ✓",clase:"mixta",texto:"Salida prevista sin registrar; otra actividad registrada"};
        return {simbolo:"○",clase:"prevista",texto:"Salida prevista sin registrar"};
    }
    return reales.length?{simbolo:"✓",clase:"registrada",texto:"Actividad registrada"}:null;
}
function indicadorDiaV260(boton,plan,registros){
    const d=estadoDiaV260(plan,registros);if(!d)return;
    const marca=document.createElement("span");marca.className=`calendario-estado-v260 ${d.clase}`;marca.textContent=d.simbolo;marca.setAttribute("aria-hidden","true");marca.title=d.texto;boton.appendChild(marca);
    boton.setAttribute("aria-label",`${boton.getAttribute("aria-label")||""}. ${d.texto}`);
}
function cierreMesV260(ref,registros=[],hoy=new Date()){
    if(new Date(ref.getFullYear(),ref.getMonth(),1)>=new Date(hoy.getFullYear(),hoy.getMonth(),1))return "";
    const clave=claveMesV143(ref),reales=registros.filter(r=>String(r.fecha||"").slice(0,7)===clave&&minutosRegistroV143(r)>0);
    const ministerio=new Set(reales.filter(r=>r.tipo==="ministerio").map(r=>r.fecha));
    if(ministerio.size)return `Este mes dedicaste tiempo al ministerio en ${ministerio.size} ${ministerio.size===1?"día":"días"}.`;
    const dias=new Set(reales.map(r=>r.fecha));
    return dias.size?`Este mes registraste actividad en ${dias.size} ${dias.size===1?"día":"días"}.`:"Este mes no tiene actividad registrada.";
}
function frasePersonalV260(){try{return String(localStorage.getItem(CLAVE_FRASE_PERSONAL_V260)||"").trim().slice(0,140);}catch(e){return "";}}
function guardarFrasePersonalV260(){
    const campo=document.getElementById("frasePersonalV260"),texto=campo.value.trim().slice(0,140),estado=document.getElementById("estadoFrasePersonalV260");
    try{if(texto)localStorage.setItem(CLAVE_FRASE_PERSONAL_V260,texto);else localStorage.removeItem(CLAVE_FRASE_PERSONAL_V260);}catch(e){estado.textContent="No se pudo guardar la frase.";return;}
    campo.value=texto;estado.textContent=texto?"Frase guardada. Alternará con las frases de Inicio.":"Inicio vuelve a usar sus frases habituales.";
    const total=resumenMesV143(new Date()).computable;actualizarFraseAnimoInicio(total,true);
}
function instalarPersonalV260(){
    document.getElementById("guardarHabitualV260")?.addEventListener("click",guardarHabitualV260);
    document.getElementById("usarHabitualV260")?.addEventListener("click",usarHabitualV260);
    document.getElementById("quitarHabitualV260")?.addEventListener("click",quitarHabitualV260);
    const frase=document.getElementById("frasePersonalV260");if(frase)frase.value=frasePersonalV260();
    document.getElementById("guardarFrasePersonalV260")?.addEventListener("click",guardarFrasePersonalV260);
    actualizarHabitualV260();
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarPersonalV260,{once:true});else instalarPersonalV260();

/* V260 · Pulido discreto. */
const CLAVE_NOMBRE_SALUDO_V260="miServicio.nombreSaludo";
let diaSeleccionadoV260="",timerGuardadoV260;
function nombreSaludoV260(){try{return String(localStorage.getItem(CLAVE_NOMBRE_SALUDO_V260)||"").trim().slice(0,24);}catch(e){return "";}}
function guardarNombreSaludoV260(){
    const campo=document.getElementById("nombreSaludoV260");if(!campo)return;
    const nombre=campo.value.trim().slice(0,24);
    try{if(nombre)localStorage.setItem(CLAVE_NOMBRE_SALUDO_V260,nombre);else localStorage.removeItem(CLAVE_NOMBRE_SALUDO_V260);}catch(e){avisoV202("No se pudo guardar el nombre del saludo.");return;}
    campo.value=nombre;saludoDinamicoV195();
}
function marcarDiaV260(fecha){
    diaSeleccionadoV260=fecha;
    document.querySelectorAll("#calendarioInicio button[data-fecha-v260]").forEach(b=>{
        const seleccionado=b.dataset.fechaV260===fecha;b.classList.toggle("seleccionado-v260",seleccionado);b.setAttribute("aria-pressed",String(seleccionado));
    });
}
function mostrarGuardadoV260(){
    const chip=document.getElementById("guardadoDiscretoV260");if(!chip)return;
    clearTimeout(timerGuardadoV260);chip.hidden=false;
    chip.classList.remove("entrar-v260");
    if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){void chip.offsetWidth;chip.classList.add("entrar-v260");}
    timerGuardadoV260=setTimeout(()=>{chip.hidden=true;chip.classList.remove("entrar-v260");},2400);
}
function instalarPulidoV260(){
    const campo=document.getElementById("nombreSaludoV260");if(campo)campo.value=nombreSaludoV260();
    document.getElementById("guardarAjustes")?.addEventListener("click",guardarNombreSaludoV260);
    saludoDinamicoV195();
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarPulidoV260,{once:true});else instalarPulidoV260();

/* V260 · Un único submit, compacto y con el nombre accesible del tiempo. */
function actualizarBotonGuardarV260(total){
    const boton=document.getElementById("guardarRegistroV203");if(!boton)return;
    const texto=total>0?`Guardar ${formatearTiempo(total)}`:"Guardar actividad";
    boton.setAttribute("aria-label",texto);boton.title=texto;
}
let rafRegistrarV260=0;
function ajustarRegistrarPantallaV260(){
    rafRegistrarV260=0;
    const body=document.body,nav=document.querySelector(".barra-navegacion");
    const alto=nav?.getBoundingClientRect().height;
    if(Number.isFinite(alto)&&alto>0)body.style.setProperty("--registro-nav-alto",alto+"px");
    const registrar=document.getElementById("vista-registrar");
    const editando=registrar?.classList.contains("activa")&&registrar.contains(document.activeElement)&&document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
    body.classList.toggle("registro-editando-v260",Boolean(editando));
}
function programarRegistrarPantallaV260(){
    if(!rafRegistrarV260)rafRegistrarV260=requestAnimationFrame(ajustarRegistrarPantallaV260);
}
function instalarRegistrarPantallaV260(){
    const registrar=document.getElementById("vista-registrar");if(!registrar)return;
    new MutationObserver(programarRegistrarPantallaV260).observe(registrar,{attributes:true,attributeFilter:["class"]});
    if(typeof ResizeObserver!=="undefined"){
        const nav=document.querySelector(".barra-navegacion");if(nav)new ResizeObserver(programarRegistrarPantallaV260).observe(nav);
    }
    window.addEventListener("resize",programarRegistrarPantallaV260);window.visualViewport?.addEventListener("resize",programarRegistrarPantallaV260);
    document.addEventListener("focusin",programarRegistrarPantallaV260);document.addEventListener("focusout",programarRegistrarPantallaV260);
    programarRegistrarPantallaV260();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarRegistrarPantallaV260,{once:true});else instalarRegistrarPantallaV260();

/* V260 · Decoración local voluntaria: no se guarda dentro de los registros. */
function leerEscenaRegistrarV260(){
    try{return localStorage.getItem("miServicio.escenaRegistrar")==="si";}catch(e){return false;}
}
function aplicarEscenaRegistrarV260(activa){
    actualizarPersonajeEscenaRegistrarV260();
    const habilitada=activa===true;
    const escena=document.getElementById("escenaRegistrarV260"),campo=document.getElementById("activarEscenaRegistrarV260");
    if(escena)escena.hidden=!habilitada;
    if(campo)campo.checked=habilitada;
}
function guardarEscenaRegistrarV260(activa){
    const anterior=document.getElementById("escenaRegistrarV260")?.hidden===false;
    const estado=document.getElementById("estadoEscenaRegistrarV260");
    try{localStorage.setItem("miServicio.escenaRegistrar",activa===true?"si":"no");}
    catch(e){aplicarEscenaRegistrarV260(anterior);if(estado)estado.textContent="No se pudo guardar la elección. Inténtalo de nuevo.";return false;}
    aplicarEscenaRegistrarV260(activa===true);
    if(estado)estado.textContent=activa===true?"Escena activada en este dispositivo.":"Escena desactivada.";
    return true;
}
function instalarEscenaRegistrarV260(){
    aplicarEscenaRegistrarV260(leerEscenaRegistrarV260());
    document.getElementById("activarEscenaRegistrarV260")?.addEventListener("change",e=>guardarEscenaRegistrarV260(e.target.checked));
    document.querySelector("#escenaRegistrarV260 img")?.addEventListener("error",()=>{const escena=document.getElementById("escenaRegistrarV260");if(escena)escena.hidden=true;});
}
window.addEventListener("storage",e=>{if(e.key==="miServicio.escenaRegistrar"||e.key===null)aplicarEscenaRegistrarV260(leerEscenaRegistrarV260());});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarEscenaRegistrarV260,{once:true});else instalarEscenaRegistrarV260();

/* V260 · El corazón elegido en el perfil tiene su propia escena. */
function rutaEscenaRegistrarV260(personaje){
    return personaje==="corazon"?"escena-corazon-v260.png":"escena-registrar-v260.png";
}
function actualizarPersonajeEscenaRegistrarV260(){
    const imagen=document.querySelector("#escenaRegistrarV260 img");if(!imagen)return;
    const ruta=rutaEscenaRegistrarV260(estado.preferencias?.personajeProgreso);
    if(imagen.getAttribute("src")!==ruta)imagen.setAttribute("src",ruta);
}
window.addEventListener("miServicio:interfazListaV201",actualizarPersonajeEscenaRegistrarV260);

/* V260 · Estado comprobado en disco y copia separada de la nube. */
function resumenLocalV260(valor){
    if(valor===null)return "Todavía no hay registros guardados en este dispositivo.";
    const datos=JSON.parse(valor);
    if(!Array.isArray(datos))throw new Error("Formato local no válido");
    return datos.length===1?"1 registro guardado en este dispositivo.":`${datos.length} registros guardados en este dispositivo.`;
}
function actualizarSeguridadDatosV260(resumen){
    const local=document.getElementById("seguridadLocalV260"),nube=document.getElementById("seguridadNubeV260"),copia=document.getElementById("seguridadCopiaV260");
    if(local){try{local.textContent=resumenLocalV260(localStorage.getItem(STORAGE_KEYS.registros));}catch(e){local.textContent="No se ha podido comprobar el guardado local. Revisa el aviso de la última acción.";}}
    if(nube)nube.textContent=resumen?.detalle||"OneDrive pendiente de comprobar.";
    if(copia){const fecha=leerUltimaCopiaSeguridad();copia.textContent=fecha?"Última copia registrada: "+fecha.toLocaleString("es-ES",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Todavía no hay una copia de seguridad registrada.";}
}
function instalarPulidoFinalV260(){
    document.getElementById("copiaRapidaV260")?.addEventListener("click",()=>{document.getElementById("exportarDatos")?.click();actualizarSyncV260();});
    window.addEventListener("focus",actualizarSyncV260);
    window.addEventListener("storage",actualizarSyncV260);
    window.addEventListener("miServicio:interfazListaV201",actualizarSyncV260);
    actualizarSyncV260();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarPulidoFinalV260,{once:true});else instalarPulidoFinalV260();

/* V260 · Tres acciones de fin de mes, sin cerrar ni modificar registros. */
function mesParaCierreV260(hoy=new Date()){
    const dia=hoy.getDate(),anio=hoy.getFullYear(),mes=hoy.getMonth();
    if(!Number.isFinite(hoy.getTime()))return null;
    if(dia<=7)return new Date(anio,mes-1,1,12);
    const ultimo=new Date(anio,mes+1,0,12).getDate();
    return dia>=ultimo-2?new Date(anio,mes,1,12):null;
}
function cierreMesOcultoV260(clave){
    try{return localStorage.getItem("miServicio.cierreMesOculto")===clave;}catch(e){return false;}
}
function actualizarCierreMesV260(hoy=new Date()){
    const card=document.getElementById("cierreMesInicioV260");if(!card)return;
    const ref=mesParaCierreV260(hoy),clave=ref?claveMesV143(ref):"";
    if(!ref||cierreMesOcultoV260(clave)){card.hidden=true;card.open=false;card.dataset.mes="";return;}
    const cambio=card.dataset.mes!==clave;
    card.hidden=false;card.dataset.mes=clave;
    if(cambio){card.open=false;document.getElementById("estadoCierreMesV260").textContent="";}
    const nombre=ref.toLocaleDateString("es-ES",{month:"long",year:"numeric"}),enCurso=ref.getFullYear()===hoy.getFullYear()&&ref.getMonth()===hoy.getMonth();
    document.getElementById("tituloCierreMesV260").textContent=(enCurso?"Preparar cierre · ":"Cierre · ")+nombre;
    document.getElementById("detalleCierreMesV260").textContent=enCurso?"El mes sigue en curso. Puedes revisarlo ahora y actualizarlo al terminar.":"Revisa el resumen del mes antes de compartirlo y guarda una copia.";
}
function abrirResumenCierreV260(){
    const clave=document.getElementById("cierreMesInicioV260")?.dataset.mes,ref=fechaMesV202(clave);
    if(!ref)return false;
    const input=document.getElementById("mesResumenV143");if(!input)return false;
    input.value=clave;seleccionarVista("estadisticas");pintarResumenMensualV143(ref);
    document.getElementById("resumenMensualV143")?.scrollIntoView({block:"start",behavior:"auto"});
    return true;
}
function crearCopiaCierreV260(){
    const estado=document.getElementById("estadoCierreMesV260"),ok=exportarCopiaSeguridad();
    if(estado)estado.textContent=ok?"Copia preparada. Guarda el archivo en una ubicación que puedas encontrar.":"No se pudo preparar la copia. Inténtalo de nuevo.";
    if(typeof actualizarSyncV260==="function")actualizarSyncV260();
    return ok;
}
function ocultarCierreMesV260(){
    const card=document.getElementById("cierreMesInicioV260"),clave=card?.dataset.mes;if(!clave)return false;
    try{localStorage.setItem("miServicio.cierreMesOculto",clave);}catch(e){document.getElementById("estadoCierreMesV260").textContent="No se pudo guardar la elección. Puedes plegar la tarjeta.";return false;}
    const devolverFoco=card.contains(document.activeElement);card.open=false;card.hidden=true;
    if(devolverFoco)document.getElementById("botonCalendarioInicio")?.focus();
    return true;
}
function instalarCierreMesV260(){
    document.getElementById("revisarCierreMesV260")?.addEventListener("click",abrirResumenCierreV260);
    document.getElementById("compartirCierreMesV260")?.addEventListener("click",()=>{if(abrirResumenCierreV260())compartirResumenV260();});
    document.getElementById("copiaCierreMesV260")?.addEventListener("click",crearCopiaCierreV260);
    document.getElementById("ocultarCierreMesV260")?.addEventListener("click",ocultarCierreMesV260);
    document.getElementById("cierreMesInicioV260")?.addEventListener("toggle",()=>programarEncajeV260(true));
    window.addEventListener("miServicio:interfazListaV201",()=>actualizarCierreMesV260());
    window.addEventListener("storage",e=>{if(e.key==="miServicio.cierreMesOculto"||e.key===null)actualizarCierreMesV260();});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)actualizarCierreMesV260();});
    setInterval(actualizarCierreMesV260,60000);actualizarCierreMesV260();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarCierreMesV260,{once:true});else instalarCierreMesV260();
