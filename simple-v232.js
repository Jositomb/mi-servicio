/* V232 · Navegación sencilla y contexto en su lugar. */
function actualizarInicioSimpleV232(){
    const hoy=fechaLocalISO(new Date());
    const raw=estado.agendaSalidas?.[hoy];
    const plan=raw?normalizarAgendaDia(raw):null;
    const subtitulo=document.querySelector("#botonCalendarioInicio .inicio-mini-subtitulo");
    const texto=plan?`Hoy: ${nombreActividad(plan.tipo)}${plan.companero?` con ${plan.companero}`:""}`:"Ver y planificar actividad";
    if(subtitulo&&subtitulo.textContent!==texto)subtitulo.textContent=texto;
    const descanso=document.getElementById("progresoPersonaje")?.classList.contains("ritmo-pausa")||false;
    document.getElementById("vista-inicio")?.toggleAttribute("data-descanso-v232",descanso);
}
function instalarSimpleV232(){
    document.getElementById("abrirAjustesV232")?.addEventListener("click",()=>seleccionarVista("ajustes"));
    document.getElementById("volverAjustesV232")?.addEventListener("click",()=>seleccionarVista(estado.ultimaVistaPrincipalV232||"inicio"));
    document.getElementById("metaDetalleV232")?.addEventListener("toggle",e=>{
        if(e.target.open){actualizarMeta();sincronizarMetaVisualV152();}
    });
    const inicio=document.getElementById("vista-inicio");
    if(inicio)new MutationObserver(actualizarInicioSimpleV232).observe(inicio,{childList:true,subtree:true});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)actualizarInicioSimpleV232();});
    actualizarInicioSimpleV232();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarSimpleV232);else instalarSimpleV232();
