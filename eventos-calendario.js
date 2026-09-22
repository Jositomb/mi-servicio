/* Mi Servicio · eventos-calendario.js · V176
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
      origen:String(e.origen||"manual"),
      uid:String(e.uid||""),
      calendario:String(e.calendario||"")
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
        const small=document.createElement("small");
        small.textContent=e.origen==="apple"
          ? `Apple Calendar · ${horaLegible(e)}`
          : `${meta.nombre} · ${horaLegible(e)}`;
        txt.append(strong,small);
        if(e.origen==="apple"){
          const fuente=document.createElement("span");
          fuente.className="v173-evento-apple";
          fuente.textContent="";
          fila.append(icon,txt,fuente);
        }else{
          const edit=document.createElement("button");edit.type="button";edit.className="v172-evento-editar";edit.textContent="Editar";edit.onclick=()=>abrirModal(fecha,e.id);
          fila.append(icon,txt,edit);
        }
        box.appendChild(fila);
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
    const aviso=document.createElement("div");aviso.className="v172-agenda-aviso";aviso.textContent="Agenda combinada: actividad de Mi Servicio + eventos personales y de Apple Calendar.";lista.appendChild(aviso);
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


  // =========================================================
  // V173 · IMPORTACIÓN SEGURA DE APPLE CALENDAR (.ics)
  // Mantiene eventos manuales y sustituye solo los importados.
  // =========================================================
  const KEY_IMPORT_V173="miServicio.calendarioAppleImportV173";

  function desescaparICS(v){
    return String(v||"")
      .replace(/\\n/gi,"\n")
      .replace(/\\,/g,",")
      .replace(/\\;/g,";")
      .replace(/\\\\/g,"\\")
      .trim();
  }

  function lineasICS(texto){
    const raw=String(texto||"").replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n");
    const out=[];
    raw.forEach(linea=>{
      if((linea.startsWith(" ")||linea.startsWith("\t"))&&out.length){
        out[out.length-1]+=linea.slice(1);
      }else{
        out.push(linea);
      }
    });
    return out;
  }

  function propiedadICS(linea){
    const p=linea.indexOf(":");
    if(p<0)return null;
    const izq=linea.slice(0,p),valor=linea.slice(p+1);
    const partes=izq.split(";");
    const nombre=partes.shift().toUpperCase();
    const params={};
    partes.forEach(x=>{
      const q=x.indexOf("=");
      if(q>0)params[x.slice(0,q).toUpperCase()]=x.slice(q+1);
    });
    return {nombre,params,valor};
  }

  function fechaICS(valor,params){
    valor=String(valor||"").trim();
    const soloFecha=(params?.VALUE||"").toUpperCase()==="DATE" || /^\d{8}$/.test(valor);
    if(soloFecha){
      const y=Number(valor.slice(0,4)),m=Number(valor.slice(4,6)),d=Number(valor.slice(6,8));
      if(!y||!m||!d)return null;
      return {date:new Date(y,m-1,d,12,0,0),todoElDia:true,hora:""};
    }
    const m=valor.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
    if(!m)return null;
    let date;
    if(m[7]){
      date=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0)));
    }else{
      // Para un ICS con TZID conservamos el día/hora de calendario tal como lo ve el usuario.
      date=new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0));
    }
    return {date,todoElDia:false,hora:`${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`};
  }

  function isoDeDate(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function sumarDias(d,n){
    const x=new Date(d);x.setDate(x.getDate()+n);return x;
  }

  function sumarMeses(d,n){
    const x=new Date(d),dia=x.getDate();
    x.setDate(1);x.setMonth(x.getMonth()+n);
    const ultimo=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();
    x.setDate(Math.min(dia,ultimo));return x;
  }

  function sumarAnios(d,n){
    const x=new Date(d);x.setFullYear(x.getFullYear()+n);return x;
  }

  function tipoAutomaticoV173(titulo){
    const t=String(titulo||"").toLowerCase();
    if(/\b(vacaciones|vacación|vacacion|holiday|holidays|descanso)\b/.test(t))return "vacaciones";
    if(/\b(viaje|vuelo|avión|avion|tren|hotel|aeropuerto)\b/.test(t))return "viaje";
    if(/\b(médico|medico|dentista|hospital|consulta|cita)\b/.test(t))return "cita";
    if(/\b(trabajo|turno|oficina|reunión de trabajo|reunion de trabajo)\b/.test(t))return "trabajo";
    return "personal";
  }

  function parseRRULE(valor){
    const o={};
    String(valor||"").split(";").forEach(par=>{
      const [k,...rest]=par.split("=");
      if(k)o[k.toUpperCase()]=rest.join("=");
    });
    return o;
  }

  function limiteImportV173(){
    const hoy=new Date();
    return {
      desde:new Date(hoy.getFullYear()-1,hoy.getMonth(),hoy.getDate(),0,0,0),
      hasta:new Date(hoy.getFullYear()+2,hoy.getMonth(),hoy.getDate(),23,59,59)
    };
  }

  function expandirRecurrenciaV173(base,regla,exdates){
    const limites=limiteImportV173();
    if(!regla?.FREQ)return [base];
    const interval=Math.max(1,Number(regla.INTERVAL)||1);
    const count=Math.min(1500,Math.max(1,Number(regla.COUNT)||1500));
    const untilInfo=regla.UNTIL?fechaICS(regla.UNTIL,{}):null;
    const until=untilInfo?.date || limites.hasta;
    const byday=String(regla.BYDAY||"").split(",").filter(Boolean).map(x=>x.replace(/^[+-]?\d+/,""));
    const diasMap={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};
    const out=[];
    const ex=new Set(exdates||[]);

    if(regla.FREQ==="WEEKLY" && byday.length){
      let cursor=new Date(base.date);
      cursor.setHours(base.date.getHours(),base.date.getMinutes(),base.date.getSeconds(),0);
      let vistos=0,iter=0;
      while(cursor<=until && cursor<=limites.hasta && vistos<count && iter<5000){
        const semanas=Math.floor((cursor-base.date)/(7*86400000));
        if(semanas>=0 && semanas%interval===0 && byday.some(x=>diasMap[x]===cursor.getDay())){
          const key=isoDeDate(cursor);
          if(!ex.has(key)){out.push({...base,date:new Date(cursor)});vistos++}
        }
        cursor=sumarDias(cursor,1);iter++;
      }
      return out;
    }

    let actual={...base,date:new Date(base.date)},i=0;
    while(actual.date<=until && actual.date<=limites.hasta && i<count && i<1500){
      const key=isoDeDate(actual.date);
      if(!ex.has(key))out.push({...actual,date:new Date(actual.date)});
      i++;
      if(regla.FREQ==="DAILY")actual.date=sumarDias(actual.date,interval);
      else if(regla.FREQ==="WEEKLY")actual.date=sumarDias(actual.date,7*interval);
      else if(regla.FREQ==="MONTHLY")actual.date=sumarMeses(actual.date,interval);
      else if(regla.FREQ==="YEARLY")actual.date=sumarAnios(actual.date,interval);
      else break;
    }
    return out;
  }

  function convertirEventoICSV173(obj){
    const titulo=desescaparICS(obj.SUMMARY?.valor||"");
    if(!titulo||!obj.DTSTART)return [];
    const ini=fechaICS(obj.DTSTART.valor,obj.DTSTART.params);
    if(!ini)return [];

    const uid=desescaparICS(obj.UID?.valor||`${titulo}-${obj.DTSTART.valor}`);
    const tipo=tipoAutomaticoV173(titulo);
    const calendario=desescaparICS(obj["X-WR-CALNAME"]?.valor||"Apple Calendar");
    const exdates=[];
    (obj.EXDATE||[]).forEach(ex=>{
      String(ex.valor||"").split(",").forEach(v=>{
        const x=fechaICS(v,ex.params);if(x)exdates.push(isoDeDate(x.date));
      });
    });

    const base={date:ini.date,todoElDia:ini.todoElDia,hora:ini.hora};
    const ocurrencias=obj.RRULE
      ? expandirRecurrenciaV173(base,parseRRULE(obj.RRULE.valor),exdates)
      : [base];

    // Evento de día completo de varios días: DTEND es exclusivo en iCalendar.
    let duracionDias=1;
    if(ini.todoElDia && obj.DTEND){
      const fin=fechaICS(obj.DTEND.valor,obj.DTEND.params);
      if(fin){
        duracionDias=Math.max(1,Math.round((fin.date-ini.date)/86400000));
      }
    }

    const res=[];
    ocurrencias.forEach((oc,idx)=>{
      if(oc.date<limiteImportV173().desde || oc.date>limiteImportV173().hasta)return;
      const dias=ini.todoElDia?duracionDias:1;
      for(let d=0;d<dias;d++){
        const fecha=sumarDias(oc.date,d);
        res.push(normalizarEvento({
          id:`apple-${uid}-${isoDeDate(fecha)}-${idx}-${d}`,
          uid,fecha:isoDeDate(fecha),titulo,tipo,
          todoElDia:ini.todoElDia,
          hora:ini.todoElDia?"":oc.hora,
          origen:"apple",calendario
        }));
      }
    });
    return res.filter(Boolean);
  }

  function parseICSV173(texto){
    const lines=lineasICS(texto);
    const eventos=[];
    let actual=null;
    let calName="Apple Calendar";
    lines.forEach(linea=>{
      const p=propiedadICS(linea);if(!p)return;
      if(p.nombre==="X-WR-CALNAME"&&!actual){calName=desescaparICS(p.valor)||calName;return}
      if(p.nombre==="BEGIN"&&p.valor.toUpperCase()==="VEVENT"){actual={};return}
      if(p.nombre==="END"&&p.valor.toUpperCase()==="VEVENT"){
        if(actual){
          actual["X-WR-CALNAME"]={valor:calName,params:{}};
          eventos.push(...convertirEventoICSV173(actual));
        }
        actual=null;return;
      }
      if(!actual)return;
      if(p.nombre==="EXDATE"){
        if(!Array.isArray(actual.EXDATE))actual.EXDATE=[];
        actual.EXDATE.push(p);
      }else if(!actual[p.nombre]){
        actual[p.nombre]=p;
      }
    });

    const dedup=new Map();
    eventos.forEach(e=>{
      const k=`${e.uid}|${e.fecha}|${e.hora}|${e.titulo}`;
      if(!dedup.has(k))dedup.set(k,e);
    });
    return [...dedup.values()].sort((a,b)=>
      a.fecha.localeCompare(b.fecha)||(a.hora||"").localeCompare(b.hora||"")||a.titulo.localeCompare(b.titulo)
    );
  }

  function estadoImportV173(texto,ok){
    const el=document.getElementById("estadoCalendarioAppleV173");
    if(!el)return;
    el.textContent=texto;
    el.classList.toggle("v173-ok",Boolean(ok));
  }

  function leerEstadoImportV173(){
    try{return JSON.parse(localStorage.getItem(KEY_IMPORT_V173)||"null")}catch(e){return null}
  }

  function mostrarEstadoImportV173(){
    const st=leerEstadoImportV173();
    if(!st){estadoImportV173("Todavía no has importado un calendario.",false);return}
    const fecha=new Date(st.fecha);
    estadoImportV173(
      `${st.total} ${st.total===1?"evento importado":"eventos importados"} · ${fecha.toLocaleString("es-ES",{dateStyle:"short",timeStyle:"short"})}`,
      true
    );
  }

  async function importarArchivoV173(file){
    if(!file)return;
    estadoImportV173("Leyendo calendario…",false);
    try{
      const texto=await file.text();
      if(!/BEGIN:VCALENDAR/i.test(texto)){
        estadoImportV173("Ese archivo no parece ser un calendario .ics válido.",false);return;
      }
      const importados=parseICSV173(texto);
      if(!importados.length){
        estadoImportV173("No encontré eventos utilizables en ese calendario.",false);return;
      }
      const manuales=leer().filter(e=>e.origen!=="apple");
      const combinado=[...manuales,...importados];
      if(!guardar(combinado)){
        estadoImportV173("No se pudieron guardar los eventos.",false);return;
      }
      localStorage.setItem(KEY_IMPORT_V173,JSON.stringify({
        total:importados.length,fecha:new Date().toISOString(),archivo:file.name||"Calendario.ics"
      }));
      mostrarEstadoImportV173();
      refrescar();
    }catch(e){
      console.error("Importación calendario:",e);
      estadoImportV173("No se pudo leer el calendario.",false);
    }
  }

  function quitarImportadosV173(){
    const importados=leer().filter(e=>e.origen==="apple");
    if(!importados.length){estadoImportV173("No hay eventos importados que quitar.",false);return}
    if(!confirm(`¿Quitar ${importados.length} ${importados.length===1?"evento importado":"eventos importados"}? Tus eventos manuales se conservarán.`))return;
    const manuales=leer().filter(e=>e.origen!=="apple");
    if(guardar(manuales)){
      localStorage.removeItem(KEY_IMPORT_V173);
      mostrarEstadoImportV173();refrescar();
    }
  }


  // =========================================================
  // V174 · RECEPCIÓN DESDE ATAJOS DE APPLE
  // El bloque viaja en Base64 dentro del fragmento #mscal=...
  // El fragmento no se envía al servidor y se limpia al recibirlo.
  // =========================================================

  function base64AUTF8V174(valor){
    try{
      const bin=atob(String(valor||"").trim());
      const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
      return new TextDecoder("utf-8").decode(bytes);
    }catch(e){
      try{return decodeURIComponent(escape(atob(String(valor||"").trim())))}catch(_){return ""}
    }
  }


  // =========================================================
  // V175 · PARSER ROBUSTO PARA ATAJOS
  // Acepta el formato V174 y un formato simplificado V4.
  // =========================================================

  function mesNumeroV175(txt){
    const t=String(txt||"").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const meses={
      ene:1,enero:1,jan:1,january:1,
      feb:2,febrero:2,february:2,
      mar:3,marzo:3,march:3,
      abr:4,abril:4,apr:4,april:4,
      may:5,mayo:5,
      jun:6,junio:6,june:6,
      jul:7,julio:7,july:7,
      ago:8,agosto:8,aug:8,august:8,
      sep:9,sept:9,septiembre:9,september:9,
      oct:10,octubre:10,october:10,
      nov:11,noviembre:11,november:11,
      dic:12,diciembre:12,dec:12,december:12
    };
    for(const k of Object.keys(meses)){
      if(t.includes(k))return meses[k];
    }
    return 0;
  }

  function fechaHoraFlexibleV175(raw){
    const s=String(raw||"").trim();
    if(!s)return null;

    // ISO yyyy-MM-dd [HH:mm]
    let m=s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[T,\s]+(\d{1,2}):(\d{2}))?/);
    if(m){
      const y=+m[1],mo=+m[2],d=+m[3],hh=+(m[4]||0),mm=+(m[5]||0);
      return {
        fecha:`${String(y).padStart(4,"0")}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`,
        hora:m[4]!==undefined?`${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`:""
      };
    }

    // dd/MM/yyyy [HH:mm] o dd-MM-yyyy
    m=s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
    if(m){
      let y=+m[3]; if(y<100)y+=2000;
      const mo=+m[2],d=+m[1],hh=+(m[4]||0),mm=+(m[5]||0);
      return {
        fecha:`${String(y).padStart(4,"0")}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`,
        hora:m[4]!==undefined?`${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`:""
      };
    }

    // d septiembre 2026, 18:30 / Sep 22, 2026 18:30
    const mo=mesNumeroV175(s);
    if(mo){
      const nums=(s.match(/\d+/g)||[]).map(Number);
      let y=nums.find(n=>n>=2000&&n<=2100);
      if(!y)y=new Date().getFullYear();
      let d=nums.find(n=>n>=1&&n<=31&&n!==y);
      const tm=s.match(/(\d{1,2}):(\d{2})/);
      if(d){
        return {
          fecha:`${String(y).padStart(4,"0")}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`,
          hora:tm?`${String(+tm[1]).padStart(2,"0")}:${tm[2]}`:""
        };
      }
    }

    // Último recurso: Date del navegador.
    const d=new Date(s);
    if(!Number.isNaN(d.getTime())){
      return {
        fecha:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,
        hora:`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
      };
    }
    return null;
  }

  function booleanoFlexibleV175(v){
    const s=String(v||"").trim().toLowerCase();
    return ["1","true","yes","si","sí","s","y","verdadero"].includes(s);
  }

  function parseAtajoV174(texto){
    const lineas=String(texto||"")
      .replace(/\r\n/g,"\n")
      .replace(/\r/g,"\n")
      .split("\n");

    const salida=[];

    for(const raw0 of lineas){
      const raw=raw0.trim();
      if(!raw)continue;

      // Preferente: separador que usa Mi Servicio.
      let partes=raw.split("¦");

      // Compatibilidad con tabuladores por si Atajos los transforma.
      if(partes.length<3 && raw.includes("\t"))partes=raw.split("\t");

      let fecha="",hora="",flag="",titulo="";

      if(partes.length>=4){
        // V174: fecha ¦ hora ¦ todoElDia ¦ titulo
        const fh=fechaHoraFlexibleV175(partes[0]);
        if(!fh)continue;
        fecha=fh.fecha;
        hora=(partes[1]||"").trim() || fh.hora;
        flag=(partes[2]||"").trim();
        titulo=partes.slice(3).join("¦").trim();
      }else if(partes.length>=3){
        // V4: fecha+hora ¦ todoElDia ¦ titulo
        const fh=fechaHoraFlexibleV175(partes[0]);
        if(!fh)continue;
        fecha=fh.fecha;
        hora=fh.hora;
        flag=(partes[1]||"").trim();
        titulo=partes.slice(2).join("¦").trim();
      }else{
        continue;
      }

      if(!titulo)continue;

      const todoElDia=booleanoFlexibleV175(flag);
      const evento=normalizarEvento({
        id:`apple-shortcut-${fecha}-${hora}-${salida.length}`,
        fecha,
        hora:todoElDia?"":hora,
        todoElDia,
        titulo,
        tipo:tipoAutomaticoV173(titulo),
        origen:"apple",
        uid:`shortcut-${fecha}-${hora}-${salida.length}`,
        calendario:"Apple Calendar"
      });

      if(evento)salida.push(evento);
    }

    const mapa=new Map();
    salida.forEach(e=>{
      const k=`${e.fecha}|${e.hora}|${e.todoElDia?"1":"0"}|${e.titulo}`;
      if(!mapa.has(k))mapa.set(k,e);
    });
    return [...mapa.values()];
  }

  function aplicarAtajoV174(textoCodificado,mostrarMensaje=true){
    const limpio=String(textoCodificado||"").trim();
    if(!limpio)return false;

    // Permite tanto Base64 (modo normal) como texto plano para el botón Pegar.
    const decodificado=/^\d{4}-\d{2}-\d{2}¦/.test(limpio)
      ? limpio
      : base64AUTF8V174(limpio);

    const importados=parseAtajoV174(decodificado);
    if(!importados.length){
      if(mostrarMensaje)estadoImportV173("No encontré eventos válidos enviados por el Atajo.",false);
      return false;
    }

    // Conserva todos los eventos manuales. Sustituye únicamente los de Apple.
    const manuales=leer().filter(e=>e.origen!=="apple");
    if(!guardar([...manuales,...importados])){
      if(mostrarMensaje)estadoImportV173("No se pudieron guardar los eventos del Atajo.",false);
      return false;
    }

    localStorage.setItem(KEY_IMPORT_V173,JSON.stringify({
      total:importados.length,
      fecha:new Date().toISOString(),
      archivo:"Atajo iPhone"
    }));

    if(mostrarMensaje){
      estadoImportV173(
        `${importados.length} ${importados.length===1?"evento recibido":"eventos recibidos"} desde el Atajo.`,
        true
      );
    }
    refrescar();
    return true;
  }

  function datosAtajoEnURLV174(){
    try{
      // Principal: fragmento #mscal=... para que los eventos no viajen al servidor.
      const hash=location.hash.startsWith("#")?location.hash.slice(1):location.hash;
      const hp=new URLSearchParams(hash);
      let dato=hp.get("mscal");

      // Compatibilidad por si alguna vez se abre como parámetro normal.
      if(!dato){
        const qp=new URLSearchParams(location.search);
        dato=qp.get("mscal");
      }
      return dato||"";
    }catch(e){return ""}
  }

  function limpiarDatosAtajoURLV174(){
    try{
      const url=new URL(location.href);
      url.hash="";
      url.searchParams.delete("mscal");
      history.replaceState(null,"",url.pathname+(url.search||""));
    }catch(e){}
  }

  function recibirAtajoURLV174(){
    const dato=datosAtajoEnURLV174();
    if(!dato)return false;
    const ok=aplicarAtajoV174(dato,false);
    limpiarDatosAtajoURLV174();

    setTimeout(()=>{
      if(ok){
        const st=leerEstadoImportV173();
        const n=Number(st?.total||0);
        estadoImportV173(
          `${n} ${n===1?"evento recibido":"eventos recibidos"} desde el Atajo.`,
          true
        );
      }else{
        estadoImportV173(
          "El Atajo llegó a Mi Servicio, pero los datos no tenían un formato reconocible.",
          false
        );
      }
    },120);

    return ok;
  }

  async function pegarDesdeAtajoV174(){
    let texto="";
    try{
      if(navigator.clipboard?.readText){
        texto=await navigator.clipboard.readText();
      }
    }catch(e){}

    if(!texto){
      texto=prompt("Pega aquí los datos copiados por el Atajo:","")||"";
    }
    if(texto)aplicarAtajoV174(texto,true);
  }


  // =========================================================
  // V176 · SINCRONIZACIÓN ICLOUD AUTOMÁTICA
  // El enlace público de iCloud NO se guarda en GitHub.
  // La web solo conoce la URL del pequeño puente/proxy.
  // =========================================================
  const KEY_PROXY_V176="miServicio.proxyCalendarioV176";
  const KEY_SYNC_V176="miServicio.ultimaSyncCalendarioV176";

  function normalizarProxyV176(v){
    let s=String(v||"").trim();
    if(!s)return "";
    if(!/^https:\/\//i.test(s))s="https://"+s.replace(/^\/+/,"");
    return s.replace(/\/+$/,"/");
  }

  function leerProxyV176(){
    try{return localStorage.getItem(KEY_PROXY_V176)||""}catch(e){return ""}
  }

  function guardarProxyV176(url){
    try{
      if(url)localStorage.setItem(KEY_PROXY_V176,url);
      else localStorage.removeItem(KEY_PROXY_V176);
      return true;
    }catch(e){return false}
  }

  function estadoSyncV176(texto,ok){
    estadoImportV173(texto,ok);
  }

  async function fetchConTimeoutV176(url,ms=7000){
    const ctrl=new AbortController();
    const t=setTimeout(()=>ctrl.abort(),ms);
    try{
      const r=await fetch(url,{
        method:"GET",
        cache:"no-store",
        credentials:"omit",
        signal:ctrl.signal,
        headers:{"Accept":"text/calendar,text/plain;q=0.9,*/*;q=0.5"}
      });
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      return await r.text();
    }finally{
      clearTimeout(t);
    }
  }

  async function sincronizarCalendarioV176(silencioso=false){
    const input=document.getElementById("proxyCalendarioV176");
    const proxy=normalizarProxyV176(input?.value || leerProxyV176());

    if(!proxy){
      if(!silencioso)estadoSyncV176("Añade primero la dirección del puente de calendario.",false);
      return false;
    }

    if(input)input.value=proxy;

    if(!silencioso)estadoSyncV176("Sincronizando con Apple Calendar…",false);

    try{
      const texto=await fetchConTimeoutV176(proxy,7000);
      if(!/BEGIN:VCALENDAR/i.test(texto)){
        throw new Error("La respuesta no es un calendario iCalendar.");
      }

      const importados=parseICSV173(texto);
      if(!importados.length){
        throw new Error("El calendario no contiene eventos utilizables.");
      }

      const manuales=leer().filter(e=>e.origen!=="apple");
      if(!guardar([...manuales,...importados])){
        throw new Error("No se pudieron guardar los eventos.");
      }

      const ahora=new Date();
      localStorage.setItem(KEY_IMPORT_V173,JSON.stringify({
        total:importados.length,
        fecha:ahora.toISOString(),
        archivo:"iCloud automático"
      }));
      localStorage.setItem(KEY_SYNC_V176,ahora.toISOString());

      estadoSyncV176(
        `${importados.length} ${importados.length===1?"evento sincronizado":"eventos sincronizados"} · ${ahora.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}`,
        true
      );

      refrescar();
      return true;

    }catch(e){
      console.warn("Calendario iCloud V176:",e);
      const st=leerEstadoImportV173();
      if(st?.total){
        estadoSyncV176(
          `Sin conexión con el calendario. Se mantiene la última copia (${st.total} ${st.total===1?"evento":"eventos"}).`,
          false
        );
      }else if(!silencioso){
        estadoSyncV176("No se pudo sincronizar el calendario. Revisa la dirección del puente.",false);
      }
      return false;
    }
  }

  function instalarSyncV176(){
    const input=document.getElementById("proxyCalendarioV176");
    if(input)input.value=leerProxyV176();

    document.getElementById("guardarProxyCalendarioV176")?.addEventListener("click",async()=>{
      const url=normalizarProxyV176(input?.value||"");
      if(!url){
        estadoSyncV176("Escribe la dirección del puente.",false);
        return;
      }
      guardarProxyV176(url);
      if(input)input.value=url;
      await sincronizarCalendarioV176(false);
    });

    document.getElementById("sincronizarCalendarioV176")?.addEventListener("click",()=>{
      sincronizarCalendarioV176(false);
    });

    // Sincronización en segundo plano: nunca bloquea Inicio.
    const proxy=leerProxyV176();
    if(proxy){
      setTimeout(()=>sincronizarCalendarioV176(true),1800);
    }
  }


  function instalarImportadorV173(){
    const btn=document.getElementById("importarCalendarioAppleV173");
    const input=document.getElementById("archivoCalendarioAppleV173");
    btn?.addEventListener("click",()=>input?.click());
    input?.addEventListener("change",()=>{
      const f=input.files?.[0];
      importarArchivoV173(f);
      input.value="";
    });
    document.getElementById("quitarCalendarioAppleV173")?.addEventListener("click",quitarImportadosV173);
    document.getElementById("pegarCalendarioAtajoV174")?.addEventListener("click",pegarDesdeAtajoV174);

    // Si la app llegó desde el Atajo, importa primero y limpia la URL.
    const recibido=recibirAtajoURLV174();
    if(!recibido)mostrarEstadoImportV173();
  }

  function instalar(){
    instalarImportadorV173();
    instalarSyncV176();
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
