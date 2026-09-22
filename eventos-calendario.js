/* Mi Servicio · eventos-calendario.js · V172
   Agenda personal local preparada para futura importación/sincronización con Apple Calendar.
   No modifica registros, Meta, OneDrive ni la lógica de actividad.
*/
(function(){
  "use strict";

  const KEY="miServicio.eventosCalendarioV172";
  const TIPOS={
    personal:{nombre:"Personal",icono:"🗓️"},
    vacaciones:{nombre:"Vacaciones",icono:"🏖️"},
    trabajo:{nombre:"Trabajo",icono:"💼"},
    cita:{nombre:"Cita",icono:"📍"},
    viaje:{nombre:"Viaje",icono:"✈️"},
    otro:{nombre:"Otro",icono:"•"}
  };

  let eventoEditando=null;
  let fechaModal="";

  function idNuevo(){
    try{return crypto.randomUUID()}catch(e){return `ev-${Date.now()}-${Math.random().toString(16).slice(2)}`}
  }

  function normalizarEvento(e){
    if(!e||typeof e!=="object")return null;
    const fecha=String(e.fecha||"").slice(0,10);
    const titulo=String(e.titulo||e.title||"").trim().slice(0,100);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha)||!titulo)return null;
    const tipo=Object.prototype.hasOwnProperty.call(TIPOS,e.tipo)?e.tipo:"personal";
    const todoElDia=Boolean(e.todoElDia||e.allDay);
    const hora=/^\d{2}:\d{2}$/.test(String(e.hora||""))?String(e.hora):"";
    return {
      id:String(e.id||idNuevo()),fecha,titulo,tipo,todoElDia,
      hora:todoElDia?"":hora,
      origen:String(e.origen||"manual")
    };
  }

  function leer(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||"[]");
      return (Array.isArray(raw)?raw:[]).map(normalizarEvento).filter(Boolean);
    }catch(e){return []}
  }

  function guardar(lista){
    try{localStorage.setItem(KEY,JSON.stringify(lista));return true}catch(e){return false}
  }

  function eventosDeFecha(fecha){
    return leer().filter(e=>e.fecha===fecha).sort((a,b)=>{
      if(a.todoElDia!==b.todoElDia)return a.todoElDia?-1:1;
      return (a.hora||"99:99").localeCompare(b.hora||"99:99");
    });
  }

  function descriptor(e){return TIPOS[e.tipo]||TIPOS.personal}
  function horaLegible(e){return e.todoElDia?"Todo el día":(e.hora||"Sin hora")}

  function fechaISO(anio,mes,dia){
    const d=new Date(anio,mes,dia);
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${dd}`;
  }

  function decorarCalendario(anio,mes){
    const cal=document.getElementById("calendarioInicio");if(!cal)return;
    cal.querySelectorAll(".calendario-dia:not(.calendario-dia-vacio)").forEach(btn=>{
      btn.querySelectorAll(".calendario-dia-evento-v172").forEach(n=>n.remove());
      btn.classList.remove("con-evento-v172");
      const num=Number(btn.querySelector(".calendario-dia-numero")?.textContent||0);if(!num)return;
      const eventos=eventosDeFecha(fechaISO(anio,mes,num));if(!eventos.length)return;
      btn.classList.add("con-evento-v172");
      const first=eventos[0],meta=descriptor(first);
      const tag=document.createElement("span");tag.className="calendario-dia-evento-v172";
      tag.textContent=`${meta.icono} ${first.titulo}${eventos.length>1?` +${eventos.length-1}`:""}`;
      tag.title=eventos.map(e=>`${horaLegible(e)} · ${e.titulo}`).join("\n");
      btn.appendChild(tag);
    });
  }

  function abrirModal(fecha,id){
    const modal=document.getElementById("modalEventoCalendarioV172");if(!modal)return;
    fechaModal=fecha;eventoEditando=id||null;
    const lista=leer(),actual=id?lista.find(e=>e.id===id):null;
    const d=new Date(`${fecha}T12:00:00`);
    document.getElementById("fechaModalEventoV172").textContent=d.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).replace(/^./,x=>x.toUpperCase());
    document.getElementById("tituloModalEventoV172").textContent=actual?"Editar evento":"Añadir evento";
    document.getElementById("tipoEventoV172").value=actual?.tipo||"personal";
    document.getElementById("tituloEventoV172").value=actual?.titulo||"";
    document.getElementById("todoDiaEventoV172").checked=Boolean(actual?.todoElDia);
    document.getElementById("horaEventoV172").value=actual?.hora||"";
    document.getElementById("eliminarEventoV172").hidden=!actual;
    document.getElementById("mensajeEventoV172").textContent="";
    actualizarCampoHora();
    modal.classList.remove("oculto");modal.setAttribute("aria-hidden","false");
    setTimeout(()=>document.getElementById("tituloEventoV172")?.focus(),50);
  }

  function cerrarModal(){
    const modal=document.getElementById("modalEventoCalendarioV172");if(!modal)return;
    modal.classList.add("oculto");modal.setAttribute("aria-hidden","true");
    eventoEditando=null;fechaModal="";
  }

  function actualizarCampoHora(){
    const todo=document.getElementById("todoDiaEventoV172")?.checked;
    const input=document.getElementById("horaEventoV172"),label=input?.closest(".v172-campo-hora");
    if(input){input.disabled=Boolean(todo);if(todo)input.value=""}
    label?.classList.toggle("v172-deshabilitada",Boolean(todo));
  }

  function guardarDesdeModal(){
    const titulo=String(document.getElementById("tituloEventoV172")?.value||"").trim();
    const msg=document.getElementById("mensajeEventoV172");
    if(!titulo){if(msg)msg.textContent="Escribe el nombre del evento.";return}
    let lista=leer();
    const nuevo=normalizarEvento({
      id:eventoEditando||idNuevo(),fecha:fechaModal,titulo,
      tipo:document.getElementById("tipoEventoV172")?.value||"personal",
      todoElDia:Boolean(document.getElementById("todoDiaEventoV172")?.checked),
      hora:document.getElementById("horaEventoV172")?.value||"",origen:"manual"
    });
    if(!nuevo)return;
    if(eventoEditando)lista=lista.filter(e=>e.id!==eventoEditando);
    lista.push(nuevo);
    if(!guardar(lista)){if(msg)msg.textContent="No se pudo guardar el evento.";return}
    cerrarModal();refrescar(fechaModal||nuevo.fecha);
  }

  function eliminarDesdeModal(){
    if(!eventoEditando)return;
    const fecha=fechaModal;
    const lista=leer().filter(e=>e.id!==eventoEditando);
    if(!guardar(lista))return;
    cerrarModal();refrescar(fecha);
  }

  function renderDetalle(fecha,detalle){
    if(!detalle)return;
    detalle.querySelector(".v172-eventos-dia")?.remove();
    const box=document.createElement("section");box.className="v172-eventos-dia";
    const head=document.createElement("div");head.className="v172-eventos-dia-head";
    const title=document.createElement("strong");title.textContent="Otros eventos";
    const add=document.createElement("button");add.type="button";add.className="v172-eventos-add";add.textContent="+ Añadir";add.onclick=()=>abrirModal(fecha);
    head.append(title,add);box.appendChild(head);
    const eventos=eventosDeFecha(fecha);
    if(!eventos.length){
      const p=document.createElement("p");p.className="v172-eventos-vacio";p.textContent="Sin otros eventos para este día.";box.appendChild(p);
    }else{
      eventos.forEach(e=>{
        const meta=descriptor(e),fila=document.createElement("div");fila.className="v172-evento-fila";
        const icon=document.createElement("span");icon.className="v172-evento-icono";icon.textContent=meta.icono;
        const txt=document.createElement("div");txt.className="v172-evento-texto";
        const strong=document.createElement("strong");strong.textContent=e.titulo;
        const small=document.createElement("small");small.textContent=`${meta.nombre} · ${horaLegible(e)}`;
        txt.append(strong,small);
        const edit=document.createElement("button");edit.type="button";edit.className="v172-evento-editar";edit.textContent="Editar";edit.onclick=()=>abrirModal(fecha,e.id);
        fila.append(icon,txt,edit);box.appendChild(fila);
      });
    }
    const agenda=detalle.querySelector(".detalle-dia-agenda");
    if(agenda)agenda.insertAdjacentElement("afterend",box);else detalle.appendChild(box);
  }

  function minutosPlan(p){
    try{return typeof minutosPlanificadosV141==="function"?minutosPlanificadosV141(p):Number(p?.minutosPrevistos||0)}catch(e){return Number(p?.minutosPrevistos||0)}
  }
  function fmtMin(m){m=Math.max(0,Number(m)||0);const h=Math.floor(m/60),r=m%60;return h?(r?`${h} h ${r} min`:`${h} h`):`${r} min`}

  function renderHoy(){
    const host=document.getElementById("resumenHoyV145"),lista=document.getElementById("agendaHoyV172");if(!host||!lista)return;
    const ahora=new Date();
    const fecha=fechaISO(ahora.getFullYear(),ahora.getMonth(),ahora.getDate());
    const eventos=eventosDeFecha(fecha);
    const agenda=(typeof estado!=="undefined"&&estado.agendaSalidas&&estado.agendaSalidas[fecha])?estado.agendaSalidas[fecha]:null;
    const plan=agenda?(typeof normalizarAgendaDia==="function"?normalizarAgendaDia(agenda):agenda):null;
    const regs=(typeof estado!=="undefined"&&Array.isArray(estado.registros)?estado.registros:[]).filter(r=>String(r.fecha||"").slice(0,10)===fecha);
    const minutos=regs.reduce((s,r)=>s+(Number(r.minutosTotales)||Number(r.minutos)||0),0);
    lista.innerHTML="";

    const items=[];
    eventos.forEach(e=>items.push({icono:descriptor(e).icono,titulo:e.titulo,detalle:descriptor(e).nombre,hora:horaLegible(e)}));
    if(plan && (plan.companero||plan.minutosPrevistos||plan.tipo)){
      const tipo=typeof nombreActividad==="function"?nombreActividad(plan.tipo||"ministerio"):"Actividad";
      items.push({icono:"📅",titulo:`${tipo}${plan.companero?` con ${plan.companero}`:""}`,detalle:"Actividad planificada",hora:plan.minutosPrevistos?fmtMin(minutosPlan(plan)):""});
    }else if(regs.length){
      items.push({icono:"✓",titulo:"Actividad registrada",detalle:`${regs.length} ${regs.length===1?"registro":"registros"}`,hora:fmtMin(minutos)});
    }

    const titulo=host.querySelector("[data-v145-titulo]"),detalle=host.querySelector("[data-v145-detalle]"),estadoEl=host.querySelector("[data-v145-estado]"),icono=host.querySelector("[data-v145-icono]");
    const vacaciones=eventos.find(e=>e.tipo==="vacaciones");
    if(vacaciones){icono.textContent="🏖️";titulo.textContent=vacaciones.titulo;detalle.textContent="La app reconoce este día como vacaciones.";estadoEl.textContent="Vacaciones"}
    else if(eventos.length){icono.textContent=descriptor(eventos[0]).icono;titulo.textContent="Tu agenda de hoy";detalle.textContent=`${eventos.length} ${eventos.length===1?"evento":"eventos"}${plan?" · actividad planificada":""}`;estadoEl.textContent="Hoy"}
    else if(plan){icono.textContent="📅";titulo.textContent="Actividad planificada para hoy";detalle.textContent=plan.companero?`Con ${plan.companero}`:"Ya tienes actividad en la agenda.";estadoEl.textContent="Planificado"}

    if(!items.length){
      const p=document.createElement("div");p.className="v172-agenda-vacio";p.textContent="No tienes otros eventos ni actividad planificada para hoy.";lista.appendChild(p);
    }else{
      items.forEach(x=>{
        const row=document.createElement("div");row.className="v172-agenda-item";
        const i=document.createElement("span");i.className="v172-agenda-item-icono";i.textContent=x.icono;
        const t=document.createElement("div");t.className="v172-agenda-item-texto";
        const strong=document.createElement("strong");strong.textContent=x.titulo;
        const small=document.createElement("small");small.textContent=x.detalle;
        t.append(strong,small);
        const hora=document.createElement("span");hora.className="v172-agenda-item-hora";hora.textContent=x.hora||"";
        row.append(i,t,hora);lista.appendChild(row);
      });
    }
    const aviso=document.createElement("div");aviso.className="v172-agenda-aviso";aviso.textContent="Eventos personales guardados solo en este dispositivo por ahora.";lista.appendChild(aviso);
  }

  function refrescar(fechaSeleccionada){
    try{if(typeof actualizarCalendarioInicio==="function")actualizarCalendarioInicio()}catch(e){}
    renderHoy();
    if(fechaSeleccionada){
      const d=new Date(`${fechaSeleccionada}T12:00:00`);
      const regs=(typeof estado!=="undefined"&&Array.isArray(estado.registros)?estado.registros:[]).filter(r=>String(r.fecha||"").slice(0,10)===fechaSeleccionada);
      try{if(typeof mostrarDetalleDiaCalendario==="function")mostrarDetalleDiaCalendario(d.getDate(),d.getMonth(),d.getFullYear(),regs)}catch(e){}
    }
  }

  function instalar(){
    // Enriquecer calendario sin tocar su lógica original.
    if(typeof actualizarCalendarioInicio==="function"){
      const originalCal=actualizarCalendarioInicio;
      actualizarCalendarioInicio=function(){
        const r=originalCal.apply(this,arguments);
        const hoy=new Date();decorarCalendario(hoy.getFullYear(),hoy.getMonth());return r;
      };
    }
    if(typeof mostrarDetalleDiaCalendario==="function"){
      const originalDetalle=mostrarDetalleDiaCalendario;
      mostrarDetalleDiaCalendario=function(dia,mes,anio,registros){
        const r=originalDetalle.apply(this,arguments);
        renderDetalle(fechaISO(anio,mes,dia),document.getElementById("detalleDiaCalendario"));return r;
      };
    }

    document.getElementById("fondoModalEventoV172")?.addEventListener("click",cerrarModal);
    document.getElementById("cancelarEventoV172")?.addEventListener("click",cerrarModal);
    document.getElementById("guardarEventoV172")?.addEventListener("click",guardarDesdeModal);
    document.getElementById("eliminarEventoV172")?.addEventListener("click",eliminarDesdeModal);
    document.getElementById("todoDiaEventoV172")?.addEventListener("change",actualizarCampoHora);
    document.getElementById("tituloEventoV172")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();guardarDesdeModal()}});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!document.getElementById("modalEventoCalendarioV172")?.classList.contains("oculto"))cerrarModal()});

    setTimeout(()=>{try{actualizarCalendarioInicio()}catch(e){};renderHoy()},80);
    setTimeout(renderHoy,1050); // después del resumen V145 original
  }

  // API deliberadamente pequeña para futura importación Apple/ICS.
  window.MiServicioEventosCalendario={
    listar:leer,
    deFecha:eventosDeFecha,
    esVacaciones:fecha=>eventosDeFecha(fecha).some(e=>e.tipo==="vacaciones"),
    reemplazar:(lista)=>{const limpio=(Array.isArray(lista)?lista:[]).map(normalizarEvento).filter(Boolean);const ok=guardar(limpio);if(ok)refrescar();return ok}
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalar,{once:true});else instalar();
})();
