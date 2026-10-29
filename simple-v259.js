/* V259 · Navegación sencilla y contexto en su lugar. */
function actualizarInicioSimpleV259(){
    const hoy=fechaLocalISO(new Date());
    const raw=estado.agendaSalidas?.[hoy];
    const plan=raw?normalizarAgendaDia(raw):null;
    const subtitulo=document.querySelector("#botonCalendarioInicio .inicio-mini-subtitulo");
    const texto=plan?`Hoy: ${nombreActividad(plan.tipo)}${plan.companero?` con ${plan.companero}`:""}`:"Ver y planificar actividad";
    if(subtitulo&&subtitulo.textContent!==texto)subtitulo.textContent=texto;
    const descanso=document.getElementById("progresoPersonaje")?.classList.contains("ritmo-pausa")||false;
    document.getElementById("vista-inicio")?.toggleAttribute("data-descanso-v259",descanso);
}
function instalarSimpleV259(){
    document.getElementById("abrirAjustesV259")?.addEventListener("click",()=>seleccionarVista("ajustes"));
    document.getElementById("volverAjustesV259")?.addEventListener("click",()=>seleccionarVista(estado.ultimaVistaPrincipalV259||"inicio"));
    document.getElementById("metaDetalleV259")?.addEventListener("toggle",e=>{
        if(e.target.open){actualizarMeta();sincronizarMetaVisualV152();}
    });
    const inicio=document.getElementById("vista-inicio");
    if(inicio)new MutationObserver(actualizarInicioSimpleV259).observe(inicio,{childList:true,subtree:true});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)actualizarInicioSimpleV259();});
    actualizarInicioSimpleV259();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarSimpleV259);else instalarSimpleV259();
