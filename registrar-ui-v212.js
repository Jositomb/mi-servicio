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
    const form=document.getElementById("formRegistro"); if(!form)return;
    actualizarCompanerosV212();
    const total=tiempoFormularioV203();
    document.getElementById("tiempoTotalV203").textContent=total===null?"Revisa el tiempo":formatearTiempo(total);
    document.getElementById("guardarRegistroV203").textContent=total>0?`Guardar ${formatearTiempo(total)}`:"Guardar actividad";
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
    document.getElementById("planTextoV203").textContent=disponible?`Salida planificada · ${nombreActividad(datos.tipo)}${datos.companero?` · ${datos.companero}`:""}`:"";
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

/* V212 · Atajos personales: solo preparan el formulario. */
function recordarActividadV212(tipo) {
    try { localStorage.setItem("miServicio.ultimaActividad",tipo); } catch(e) {}
}
function ultimaActividadV212() {
    let tipo="ministerio";
    try { tipo=localStorage.getItem("miServicio.ultimaActividad")||tipo; } catch(e) {}
    return ["ministerio","ldc","asambleas","otras"].includes(tipo)&&actividadVisible(tipo)?tipo:"ministerio";
}
function companerosRecientesV212(registros=[]) {
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
function actualizarCompanerosV212() {
    const campo=document.getElementById("companeroRegistro");if(!campo)return;
    let lista=document.getElementById("companerosRecientesV212");
    if(!lista){
        lista=document.createElement("div");lista.id="companerosRecientesV212";lista.className="companeros-recientes-v212";
        lista.setAttribute("role","group");lista.setAttribute("aria-label","Acompañantes recientes");campo.after(lista);
        lista.addEventListener("click",e=>{
            const b=e.target.closest("button");if(!b)return;
            campo.value=b.textContent;campo.dispatchEvent(new Event("input",{bubbles:true}));
        });
    }
    const nombres=companerosRecientesV212(estado.registros),firma=JSON.stringify(nombres);
    lista.hidden=!nombres.length;
    if(lista.dataset.firma===firma)return;
    lista.dataset.firma=firma;lista.replaceChildren();
    nombres.forEach(nombre=>{const b=document.createElement("button");b.type="button";b.textContent=nombre;b.setAttribute("aria-label",`Elegir a ${nombre}`);lista.appendChild(b);});
}
function repetirActividadV212(id) {
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
    actualizarRegistrarV203();borradorOcultoV212=false;guardarBorradorV212();campo("guardarRegistroV203").focus();return true;
}

/* V212 · Recuperación local, búsqueda y estados honestos. */
const CLAVE_BORRADOR_V212="miServicio.borradorRegistro";
let borradorOcultoV212=false;
function posibleDuplicadoV212(registros,nuevo){
    return registros.some(r=>r.fecha===nuevo.fecha&&r.tipo===nuevo.tipo&&Number(r.minutos??r.minutosTotales)===nuevo.minutos);
}
function textoBusquedaV212(texto){return String(texto||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es").trim();}
function coincideBusquedaV212(r,texto){
    const q=textoBusquedaV212(texto);if(!q)return true;
    return textoBusquedaV212([r.companero,r.acompanante,r.compañero,r.notas,r.tipo,r.fecha].filter(Boolean).join(" ")).includes(q);
}
function leerBorradorV212(){
    try{
        const d=JSON.parse(localStorage.getItem(CLAVE_BORRADOR_V212)||"null");
        if(!d||d.version!==1||!["ministerio","ldc","asambleas","otras"].includes(d.tipo)||!fechaISOValida(d.fecha))return null;
        return d;
    }catch(e){return null;}
}
function datosBorradorV212(){
    const campo=id=>document.getElementById(id);
    return {version:1,fecha:campo("fechaRegistro").value,tipo:campo("tipoRegistro").value,
        horas:campo("horasRegistro").value,minutos:campo("minutosRegistro").value,
        companero:campo("companeroRegistro").value.slice(0,80),notas:campo("notasRegistro").value,
        cursos:obtenerCursosBiblicosFormulario(),detalles:campo("detallesRegistroV203").open};
}
function borrarBorradorV212(){try{localStorage.removeItem(CLAVE_BORRADOR_V212);}catch(e){}document.getElementById("avisoBorradorV212")?.setAttribute("hidden","");}
function guardarBorradorV212(){
    if(borradorOcultoV212||!document.getElementById("formRegistro"))return;
    const d=datosBorradorV212();
    const tieneContenido=(Number(d.horas)||0)!==0||(Number(d.minutos)||0)!==0||d.companero.trim()||d.notas.trim()||d.cursos>0;
    try{if(tieneContenido)localStorage.setItem(CLAVE_BORRADOR_V212,JSON.stringify(d));else borrarBorradorV212();}catch(e){}
}
function recuperarBorradorV212(){
    const d=leerBorradorV212();if(!d)return false;
    const campo=id=>document.getElementById(id),aviso=campo("avisoBorradorV212");
    if(!actividadVisible(d.tipo)){
        borradorOcultoV212=true;
        campo("textoBorradorV212").textContent="Hay un borrador de una actividad oculta. Actívala en Ajustes para recuperarlo.";
        aviso.hidden=false;return false;
    }
    borradorOcultoV212=false;
    seleccionarActividad(d.tipo);campo("fechaRegistro").value=d.fecha;fechaOtraV203=false;
    campo("horasRegistro").value=String(d.horas??"0");campo("minutosRegistro").value=String(d.minutos??"0");
    campo("companeroRegistro").value=String(d.companero||"").slice(0,80);campo("notasRegistro").value=String(d.notas||"");
    const cursos=d.tipo==="ministerio"?Math.min(99,Math.max(0,Number(d.cursos)||0)):0;
    campo("cantidadCursosBiblicos").textContent=String(cursos);campo("cantidadCursosBiblicos").dataset.valor=String(cursos);
    campo("detallesRegistroV203").open=Boolean(d.detalles||d.companero||d.notas||cursos);
    actualizarRegistrarV203();campo("textoBorradorV212").textContent="Borrador recuperado. Puedes continuar donde lo dejaste.";aviso.hidden=false;return true;
}
function descartarBorradorV212(){
    const campo=id=>document.getElementById(id);
    campo("horasRegistro").value="0";campo("minutosRegistro").value="0";campo("companeroRegistro").value="";campo("notasRegistro").value="";
    reiniciarCursosBiblicos();establecerFechaActual();fechaOtraV203=false;campo("detallesRegistroV203").open=false;
    campo("confirmacionRegistroV203").hidden=true;campo("mensajeFormulario").textContent="";
    borradorOcultoV212=false;
    borrarBorradorV212();actualizarRegistrarV203();
}
function tiempoSyncV212(fecha,ahora=Date.now()){
    const ms=new Date(fecha).getTime();if(!Number.isFinite(ms)||ms>ahora+60000)return "";
    const min=Math.max(0,Math.floor((ahora-ms)/60000));
    if(min<1)return "hace un momento";if(min<60)return `hace ${min} min`;
    if(min<1440)return `hace ${Math.floor(min/60)} h`;
    return new Date(ms).toLocaleString("es-ES",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
}
function resumenSyncV212({conectado,online,tipo,texto,fecha}){
    if(!conectado)return {corto:"Local",detalle:"Guardado en este dispositivo · OneDrive no conectado"};
    if(!online)return {corto:"Sin conexión",detalle:"Sin conexión · OneDrive se comprobará al volver"};
    if(tipo==="subiendo"||tipo==="bajando")return {corto:"Sincronizando…",detalle:"Sincronizando con OneDrive…"};
    if(tipo==="pendiente"||/no se pudo|error|fall|protección activa/i.test(texto||""))return {corto:"Pendiente",detalle:"Cambios pendientes · revisa el estado de OneDrive"};
    const hace=fecha?tiempoSyncV212(fecha):"";
    return hace?{corto:"Al día",detalle:`Sincronizado ${hace}`}:{corto:"Conectado",detalle:"Conectado · pendiente de la primera comprobación"};
}
function actualizarSyncV212(){
    if(typeof almacenamiento==="undefined")return;
    const conectado=Boolean(almacenamiento.leer(STORAGE_KEYS.onedriveConectado,false));
    const st=almacenamiento.leer("miServicio.estadoSyncV134",null)||{};
    const fecha=almacenamiento.leer("miServicio.ultimaComprobacionOneDrive",null);
    const res=resumenSyncV212({conectado,online:navigator.onLine,tipo:st.tipo,texto:st.texto,fecha});
    const ultima=document.getElementById("ultimaSyncOneDrive");
    if(ultima){ultima.hidden=!conectado;ultima.textContent=res.detalle;}
    const label=document.getElementById("estadoConexionTextoV190");if(label)label.textContent=res.corto;
    const box=document.getElementById("estadoConexionV190");if(box)box.title=res.detalle;
    if(!conectado){const estado=document.getElementById("estadoSyncV134");if(estado)estado.textContent=res.detalle;}
}
function instalarPracticoV212(){
    const form=document.getElementById("formRegistro");if(!form||form.dataset.practicoV212)return;form.dataset.practicoV212="1";
    recuperarBorradorV212();
    for(const tipo of ["input","change","click"])form.addEventListener(tipo,()=>{borradorOcultoV212=false;setTimeout(guardarBorradorV212,0);});
    document.getElementById("descartarBorradorV212")?.addEventListener("click",descartarBorradorV212);
    document.getElementById("buscarHistorialV212")?.addEventListener("input",renderizarHistorial);
    window.addEventListener("miServicio:registroGuardadoV188",borrarBorradorV212);
    window.addEventListener("pagehide",guardarBorradorV212);
    document.addEventListener("visibilitychange",()=>{if(document.hidden)guardarBorradorV212();else actualizarSyncV212();});
    for(const ev of ["miServicio:estadoSyncV190","online","offline"])window.addEventListener(ev,()=>setTimeout(actualizarSyncV212,0));
    setInterval(actualizarSyncV212,60000);actualizarSyncV212();
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarPracticoV212,{once:true});else instalarPracticoV212();
