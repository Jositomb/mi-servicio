/* V241 · Navegación sencilla y contexto en su lugar. */
function actualizarInicioSimpleV241(){
    const hoy=fechaLocalISO(new Date());
    const raw=estado.agendaSalidas?.[hoy];
    const plan=raw?normalizarAgendaDia(raw):null;
    const subtitulo=document.querySelector("#botonCalendarioInicio .inicio-mini-subtitulo");
    const texto=plan?`Hoy: ${nombreActividad(plan.tipo)}${plan.companero?` con ${plan.companero}`:""}`:"Ver y planificar actividad";
    if(subtitulo&&subtitulo.textContent!==texto)subtitulo.textContent=texto;
    const descanso=document.getElementById("progresoPersonaje")?.classList.contains("ritmo-pausa")||false;
    document.getElementById("vista-inicio")?.toggleAttribute("data-descanso-v241",descanso);
}
function instalarSimpleV241(){
    document.getElementById("abrirAjustesV241")?.addEventListener("click",()=>seleccionarVista("ajustes"));
    document.getElementById("volverAjustesV241")?.addEventListener("click",()=>seleccionarVista(estado.ultimaVistaPrincipalV241||"inicio"));
    document.getElementById("metaDetalleV241")?.addEventListener("toggle",e=>{
        if(e.target.open){actualizarMeta();sincronizarMetaVisualV152();}
    });
    const inicio=document.getElementById("vista-inicio");
    if(inicio)new MutationObserver(actualizarInicioSimpleV241).observe(inicio,{childList:true,subtree:true});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)actualizarInicioSimpleV241();});
    actualizarInicioSimpleV241();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarSimpleV241);else instalarSimpleV241();
