/* V225 · Mes visible independiente de la fecha de hoy. */
let referenciaCalendarioV225=null;
function mesVisibleCalendarioV225(){
    const d=referenciaCalendarioV225||new Date();
    return new Date(d.getFullYear(),d.getMonth(),1,12);
}
function cambiarMesCalendarioV225(delta){
    const actual=mesVisibleCalendarioV225();
    referenciaCalendarioV225=new Date(actual.getFullYear(),actual.getMonth()+delta,1,12);
    diaSeleccionadoV225="";
    actualizarCalendarioInicio();
}
function elegirMesCalendarioV225(valor){
    const d=fechaMesV202(valor);
    if(!d||claveMesV143(d)!==valor)return false;
    referenciaCalendarioV225=d;diaSeleccionadoV225="";actualizarCalendarioInicio();return true;
}
function volverMesActualV225(){referenciaCalendarioV225=null;diaSeleccionadoV225="";actualizarCalendarioInicio();}
function instalarMesesCalendarioV225(){
    document.getElementById("elegirMesCalendarioV225")?.addEventListener("change",e=>{
        if(!elegirMesCalendarioV225(e.target.value))e.target.value=claveMesV143(mesVisibleCalendarioV225());
    });
    document.getElementById("mesAnteriorCalendarioV225")?.addEventListener("click",()=>cambiarMesCalendarioV225(-1));
    document.getElementById("mesSiguienteCalendarioV225")?.addEventListener("click",()=>cambiarMesCalendarioV225(1));
    document.getElementById("mesActualCalendarioV225")?.addEventListener("click",volverMesActualV225);
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarMesesCalendarioV225,{once:true});else instalarMesesCalendarioV225();

/* Mi Servicio · planificacion.js · V110
   Planificación, agenda y calendario extraídos de app-v27.js.
*/

function configurarCalendarioInicio() {

    const boton =
        document.getElementById(
            "botonCalendarioInicio"
        );

    const panel =
        document.getElementById(
            "panelCalendarioInicio"
        );

    const icono =
        document.getElementById(
            "iconoCalendarioInicio"
        );

    if (!boton || !panel) {
        return;
    }

    boton.addEventListener(
        "click",
        () => {

            const abrir =
                panel.classList.contains(
                    "oculto"
                );

            panel.classList.toggle(
                "oculto",
                !abrir
            );

            boton.setAttribute(
                "aria-expanded",
                abrir ? "true" : "false"
            );

            if (icono) {
                icono.textContent =
                    abrir ? "⌃" : "⌄";
            }

            if (abrir) {
                actualizarCalendarioInicio();
            }
        }
    );
}

function actualizarCalendarioInicio() {

    const calendario =
        document.getElementById(
            "calendarioInicio"
        );

    const titulo =
        document.getElementById(
            "tituloCalendarioInicio"
        );

    const resumen =
        document.getElementById(
            "resumenCalendarioInicio"
        );

    const detalle =
        document.getElementById(
            "detalleDiaCalendario"
        );

    if (!calendario) {
        return;
    }

    const hoy = new Date();
    const referencia=mesVisibleCalendarioV225();
    const anio=referencia.getFullYear();
    const mes=referencia.getMonth();
    const selector=document.getElementById("elegirMesCalendarioV225");if(selector)selector.value=claveMesV143(referencia);

    if (titulo) {
        titulo.textContent =
            referencia.toLocaleDateString(
                "es-ES",
                {
                    month: "long",
                    year: "numeric"
                }
            ).replace(
                /^./,
                letra => letra.toUpperCase()
            );
    }

    const registrosMes =
        estado.registros.filter(
            registro => {
                const fecha =
                    fechaDesdeISO(
                        registro.fecha
                    );

                return (
                    fecha.getFullYear() === anio
                    &&
                    fecha.getMonth() === mes
                );
            }
        );

    const minutosPorDia = new Map();
    const registrosPorDia = new Map();

    registrosMes.forEach(
        registro => {
            const fecha =
                fechaDesdeISO(
                    registro.fecha
                );

            const dia = fecha.getDate();
            const minutos =
                Math.max(
                    Number(registro.minutos) || 0,
                    0
                );

            minutosPorDia.set(
                dia,
                (minutosPorDia.get(dia) || 0)
                + minutos
            );

            if (!registrosPorDia.has(dia)) {
                registrosPorDia.set(dia, []);
            }

            registrosPorDia.get(dia).push(registro);
        }
    );

    const diasConActividad =
        Array.from(
            minutosPorDia.values()
        ).filter(
            minutos => minutos > 0
        ).length;

    if (resumen) {
        resumen.textContent =
            diasConActividad === 1
                ? "1 día con actividad"
                : `${diasConActividad} días con actividad`;
    }

    calendario.innerHTML = "";

    if (detalle) {
        detalle.classList.add("oculto");
        detalle.innerHTML = "";
    }

    const primerDia =
        new Date(anio, mes, 1).getDay();

    const huecosIniciales =
        (primerDia + 6) % 7;

    const diasMes =
        new Date(
            anio,
            mes + 1,
            0
        ).getDate();

    for (
        let indice = 0;
        indice < huecosIniciales;
        indice += 1
    ) {
        const hueco =
            document.createElement("span");

        hueco.className="calendario-dia calendario-otro-mes-v225";
        hueco.textContent=String(new Date(anio,mes,indice-huecosIniciales+1).getDate());

        hueco.setAttribute(
            "aria-hidden",
            "true"
        );

        calendario.appendChild(hueco);
    }

    for (
        let dia = 1;
        dia <= diasMes;
        dia += 1
    ) {
        const minutos =
            minutosPorDia.get(dia) || 0;

        const botonDia =
            document.createElement("button");

        botonDia.type = "button";
        botonDia.className =
            "calendario-dia";

        if (minutos > 0) {
            botonDia.classList.add(
                "con-actividad"
            );
        }

        if (
            dia === hoy.getDate()
            &&
            mes === hoy.getMonth()
            &&
            anio === hoy.getFullYear()
        ) {
            botonDia.classList.add("hoy");
        }

        const numero =
            document.createElement("span");

        numero.className =
            "calendario-dia-numero";

        numero.textContent = dia;

        const tiempos =
            document.createElement("span");

        tiempos.className =
            "calendario-dia-tiempos";

        const registrosDia =
            registrosPorDia.get(dia) || [];

        const minutosPorActividad = {
            ministerio: 0,
            ldc: 0,
            asambleas: 0,
            otras: 0
        };

        registrosDia.forEach(registro => {
            if (
                Object.prototype.hasOwnProperty.call(
                    minutosPorActividad,
                    registro.tipo
                )
            ) {
                minutosPorActividad[registro.tipo] +=
                    Math.max(
                        Number(registro.minutos) || 0,
                        0
                    );
            }
        });

        [
            "ministerio",
            "ldc",
            "asambleas",
            "otras"
        ].forEach(tipo => {
            const minutosActividad =
                minutosPorActividad[tipo];

            if (
                minutosActividad <= 0 ||
                !actividadVisible(tipo)
            ) {
                return;
            }

            const tiempoActividad =
                document.createElement("span");

            tiempoActividad.className =
                `calendario-dia-tiempo ${claseActividadCalendario(tipo)}`;

            tiempoActividad.textContent =
                formatearTiempoCortoCalendario(
                    minutosActividad
                );

            tiempoActividad.title =
                `${nombreActividad(tipo)}: ${formatearTiempo(minutosActividad)}`;

            tiempos.appendChild(
                tiempoActividad
            );
        });

        botonDia.appendChild(numero);
        const fechaDiaISO=fechaLocalISO(new Date(anio,mes,dia));
        const agendaDiaDatos=normalizarAgendaDia(estado.agendaSalidas?.[fechaDiaISO]);
        const companeroAgendado=agendaDiaDatos.companero;
        const marcas=document.createElement("span");marcas.className="calendario-marcas-v225";marcas.setAttribute("aria-hidden","true");
        Object.entries(minutosPorActividad).forEach(([tipo,min])=>{
            if(min>0&&actividadVisible(tipo))marcas.appendChild(marcaCalendarioV225(tipo,false));
        });
        if(estado.agendaSalidas?.[fechaDiaISO]){
            botonDia.classList.add("con-agenda");
            marcas.appendChild(marcaCalendarioV225(agendaDiaDatos.tipo,true));
        }
        botonDia.appendChild(marcas);

        const ariaActividad =
            minutos > 0
                ? `${dia}: ${formatearTiempo(minutos)} de actividad`
                : `${dia}: sin actividad`;

        botonDia.setAttribute(
            "aria-label",
            companeroAgendado
                ? `${ariaActividad}. Salida agendada con ${companeroAgendado}`
                : ariaActividad
        );

        const estadoDia=estadoDiaV225(estado.agendaSalidas?.[fechaDiaISO]?agendaDiaDatos:null,registrosPorDia.get(dia)||[]);
        if(estadoDia?.texto)botonDia.setAttribute("aria-label",botonDia.getAttribute("aria-label")+". "+estadoDia.texto);
        botonDia.dataset.fechaV225=fechaDiaISO;
        botonDia.classList.toggle("seleccionado-v225",fechaDiaISO===diaSeleccionadoV225);
        botonDia.setAttribute("aria-pressed",String(fechaDiaISO===diaSeleccionadoV225));

        botonDia.addEventListener(
            "click",
            () => abrirDetalleDiaV225(dia,mes,anio,registrosPorDia.get(dia) || [])
        );

        calendario.appendChild(botonDia);
    }
    const restantes=(7-(huecosIniciales+diasMes)%7)%7;
    for(let i=1;i<=restantes;i++){
        const celda=document.createElement("span");celda.className="calendario-dia calendario-otro-mes-v225";celda.textContent=String(i);celda.setAttribute("aria-hidden","true");calendario.appendChild(celda);
    }
    const clave=claveMesV143(referencia);
    if(!diaSeleccionadoV225.startsWith(clave+"-")){
        diaSeleccionadoV225=fechaLocalISO(new Date(anio,mes,anio===hoy.getFullYear()&&mes===hoy.getMonth()?hoy.getDate():1));
    }
    const elegido=fechaDesdeISO(diaSeleccionadoV225);
    mostrarDetalleDiaCalendario(elegido.getDate(),mes,anio,registrosPorDia.get(elegido.getDate())||[]);
    actualizarAgendaVisualV225();
}

function formatearTiempoCortoCalendario(minutos) {

    const total =
        Math.max(
            Math.round(
                Number(minutos) || 0
            ),
            0
        );

    const horas =
        Math.floor(total / 60);

    const resto = total % 60;

    if (horas > 0 && resto > 0) {
        return `${horas}h ${resto}m`;
    }

    if (horas > 0) {
        return `${horas}h`;
    }

    return resto > 0
        ? `${resto}m`
        : "";
}

function mostrarDetalleDiaCalendario(
    dia,
    mes,
    anio,
    registros
) {

    const detalle =
        document.getElementById(
            "detalleDiaCalendario"
        );

    if (!detalle) {
        return;
    }

    const fecha =
        new Date(anio, mes, dia);
    marcarDiaV225(fechaLocalISO(fecha));

    const tituloFecha =
        fecha.toLocaleDateString(
            "es-ES",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );

    const registrosVisibles =
        registros.filter(
            registro =>
                actividadVisible(
                    registro.tipo
                )
        );

    const total =
        sumarMinutos(
            registrosVisibles
        );

    detalle.innerHTML = "";
    detalle.classList.remove("oculto");

    const cabecera =
        document.createElement("div");

    cabecera.className =
        "detalle-dia-cabecera";

    const nombre =
        document.createElement("strong");

    nombre.textContent =
        tituloFecha.replace(
            /^./,
            letra => letra.toUpperCase()
        );

    const totalTexto =
        document.createElement("span");

    totalTexto.textContent =
        formatearTiempo(total);

    cabecera.appendChild(nombre);
    cabecera.appendChild(totalTexto);
    detalle.appendChild(cabecera);

    const fechaISO =
        fechaLocalISO(
            fecha
        );

    const agendaDiaDatos =
        normalizarAgendaDia(
            estado.agendaSalidas?.[fechaISO]
        );

    const tienePlan = Boolean(estado.agendaSalidas?.[fechaISO]);

    const companeroAgendado =
        agendaDiaDatos.companero;

    const tipoAgendado =
        agendaDiaDatos.tipo;

    const bloqueAgenda =
        document.createElement("div");

    bloqueAgenda.className =
        "detalle-dia-agenda";

    const textoAgenda =
        document.createElement("div");

    textoAgenda.className =
        "detalle-dia-agenda-texto";

    const etiquetaAgenda =
        document.createElement("span");

    etiquetaAgenda.textContent =
        tienePlan
            ? `${nombreActividad(tipoAgendado)} previsto`
            : "Planificar actividad";

    const valorAgenda =
        document.createElement("strong");

    valorAgenda.textContent =
        tienePlan
            ? (companeroAgendado ? `Con: ${companeroAgendado}` : "Salida prevista")
            : "Elige actividad, acompañante y hora";

    textoAgenda.append(
        etiquetaAgenda,
        valorAgenda
    );

    const accionesAgenda =
        document.createElement("div");

    accionesAgenda.className =
        "detalle-dia-agenda-acciones";

    const botonAgendar =
        document.createElement("button");

    botonAgendar.type = "button";
    botonAgendar.className =
        "boton-agendar-calendario";

    botonAgendar.textContent =
        tienePlan
            ? "Cambiar plan"
            : "Planificar";

    botonAgendar.addEventListener(
        "click",
        () => {
            agendarSalidaCalendario(
                fechaISO
            );
        }
    );

    accionesAgenda.appendChild(
        botonAgendar
    );

    const registrarDia=document.createElement("button");
    registrarDia.type="button";registrarDia.className="boton-registrar-dia-v225";
    registrarDia.textContent="Registrar este día";
    registrarDia.addEventListener("click",()=>abrirRegistroDiaV225(fechaISO));
    accionesAgenda.appendChild(registrarDia);

    if (tienePlan) {
        const botonQuitar =
            document.createElement("button");

        botonQuitar.type = "button";
        botonQuitar.className =
            "boton-quitar-agenda";

        botonQuitar.textContent =
            "Quitar";

        botonQuitar.addEventListener(
            "click",
            () => {
                quitarSalidaAgendada(
                    fechaISO
                );
            }
        );

        accionesAgenda.appendChild(
            botonQuitar
        );
    }

    bloqueAgenda.append(
        textoAgenda,
        accionesAgenda
    );

    if(agendaDiaDatos.hora){
        const horaTexto=document.createElement("small");horaTexto.className="agenda-hora-v202";
        horaTexto.textContent="Salida a las "+agendaDiaDatos.hora;textoAgenda.appendChild(horaTexto);
    }
    detalle.appendChild(bloqueAgenda);

    if (registrosVisibles.length === 0) {
        const vacio = estadoVacioV197("📖", tienePlan
            ? "Tu salida está planificada. El tiempo aparecerá al registrarlo."
            : "Este día está por escribir. Puedes planificar una salida o registrar tiempo.");

        detalle.appendChild(vacio);
        return;
    }

    const lista =
        document.createElement("div");

    lista.className =
        "detalle-dia-lista-registros";

    registrosVisibles
        .slice()
        .sort(compararRegistrosPorFecha)
        .forEach(
            registro => {
                const fila =
                    document.createElement("div");

                fila.className =
                    "detalle-dia-registro";

                const datos =
                    document.createElement("div");

                datos.className =
                    "detalle-dia-registro-datos";

                const etiqueta =
                    document.createElement("span");

                etiqueta.textContent =
                    nombreActividad(registro.tipo);

                const valor =
                    document.createElement("strong");

                valor.textContent =
                    formatearTiempo(registro.minutos);

                datos.append(etiqueta, valor);

                if (registro.companero) {
                    const companero = document.createElement("small");
                    companero.className = "detalle-dia-companero";
                    companero.textContent = `Con: ${registro.companero}`;
                    datos.appendChild(companero);
                }

                if (registro.notas) {
                    const nota =
                        document.createElement("small");
                    nota.textContent = registro.notas;
                    datos.appendChild(nota);
                }

                const editar =
                    document.createElement("button");

                editar.type = "button";
                editar.className =
                    "boton-editar-calendario";
                editar.textContent = "Editar";
                editar.setAttribute(
                    "aria-label",
                    `Editar ${nombreActividad(registro.tipo)} de ${formatearTiempo(registro.minutos)}`
                );

                editar.addEventListener(
                    "click",
                    () => abrirModalEdicion(registro.id)
                );

                fila.append(datos, editar);
                lista.appendChild(fila);
            }
        );

    detalle.appendChild(lista);
}

function normalizarAgendaDia(valor) {
    if (!valor) {
        return {
            tipo: "ministerio",
            companero: "",
            minutosPrevistos: 0
        };
    }

    if (typeof valor === "string") {
        return {
            tipo: "ministerio",
            companero: valor.trim(),
            minutosPrevistos: 0
        };
    }

    const tiposValidos = [
        "ministerio",
        "ldc",
        "asambleas",
        "otras"
    ];

    return {
        tipo: tiposValidos.includes(valor.tipo)
            ? valor.tipo
            : "ministerio",
        companero: String(
            valor.companero ||
            valor.nombre ||
            ""
        ).trim(),
        minutosPrevistos: Math.max(0, Number(valor.minutosPrevistos || 0) || 0),
        hora: /^([01]\d|2[0-3]):[0-5]\d$/.test(valor.hora||"")?valor.hora:""
    };
}

function minutosPlanificadosMesActual() {
    const hoy=new Date();
    return Object.entries(estado.agendaSalidas||{}).reduce((s,[fecha,v])=>{
        const d=new Date(fecha+"T12:00:00"), a=normalizarAgendaDia(v);
        return d.getFullYear()===hoy.getFullYear() && d.getMonth()===hoy.getMonth() ? s+(a.minutosPrevistos||0) : s;
    },0);
}

function claseActividadCalendario(tipo) {
    switch (tipo) {
        case "ldc":
            return "actividad-ldc";
        case "asambleas":
            return "actividad-asambleas";
        case "otras":
            return "actividad-otras";
        case "ministerio":
        default:
            return "actividad-ministerio";
    }
}

function agendarSalidaCalendario(fechaISO) {
    abrirModalAgendaSalida(fechaISO);
}

function asegurarModalAgendaSalida() {
    const modal = document.getElementById("modalAgendaSalida");
    if (!modal) return;

    const fondo = document.getElementById("fondoModalAgendaSalida");
    const cancelar = document.getElementById("cancelarAgendaSalida");

    // Estos dos controles no dependen de una fecha concreta.
    if (fondo) {
        fondo.onclick = cerrarModalAgendaSalida;
    }

    if (cancelar) {
        cancelar.onclick = cerrarModalAgendaSalida;
    }

    if (modal.dataset.escapeConfigurado !== "1") {
        document.addEventListener("keydown", evento => {
            if (
                evento.key === "Escape" &&
                !modal.classList.contains("oculto")
            ) {
                cerrarModalAgendaSalida();
            }
        });
        modal.dataset.escapeConfigurado = "1";
    }
}

function abrirModalAgendaSalida(fechaISO) {
    asegurarModalAgendaSalida();

    const modal = document.getElementById("modalAgendaSalida");
    const input = document.getElementById("nombreAgendaSalida");
    const tipo = document.getElementById("tipoAgendaSalida");
    const fechaTexto = document.getElementById("fechaModalAgendaSalida");
    const titulo = document.getElementById("tituloModalAgendaSalida");
    const mensaje = document.getElementById("mensajeAgendaSalida");
    const guardar = document.getElementById("guardarAgendaSalida");
    const duracion = document.getElementById("duracionAgendaSalida");

    if (!modal || !input || !tipo || !guardar) return;

    const actual =
        normalizarAgendaDia(
            estado.agendaSalidas?.[fechaISO]
        );

    const nombreActual =
        actual.companero;

    const fecha = fechaDesdeISO(fechaISO);

    const legible =
        fecha.toLocaleDateString(
            "es-ES",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    modal.dataset.fecha = fechaISO;
    input.value = nombreActual;
    tipo.value = actual.tipo;
    if (duracion) duracion.value = String(actual.minutosPrevistos || 0);
    const hora=document.getElementById("horaAgendaV202");if(hora)hora.value=actual.hora||"";
    const repetir=document.getElementById("repetirAgendaV202");if(repetir)repetir.value="1";

    if (fechaTexto) {
        fechaTexto.textContent =
            legible.replace(/^./, letra => letra.toUpperCase());
    }

    if (titulo) {
        titulo.textContent =
            nombreActual
                ? "Editar actividad planificada"
                : "Planificar actividad";
    }

    if (mensaje) {
        mensaje.textContent = "";
        mensaje.classList.remove("exito");
    }

    // IMPORTANTE:
    // Se asigna de nuevo al abrir. Así Guardar siempre trabaja
    // con la fecha que se está editando en ese momento.
    guardar.disabled = false;
    guardar.textContent = nombreActual ? "Guardar cambios" : "Guardar";

    guardar.onclick = () => {
        guardarSalidaDesdeModal(fechaISO);
    };

    input.onkeydown = evento => {
        if (evento.key === "Enter") {
            evento.preventDefault();
            guardarSalidaDesdeModal(fechaISO);
        }
    };

    actualizarHabitualV225();

    modal.classList.remove("oculto");
    modal.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
        input.focus();
        input.setSelectionRange(
            input.value.length,
            input.value.length
        );
    }, 60);
}

function cerrarModalAgendaSalida() {
    const modal = document.getElementById("modalAgendaSalida");
    if (!modal) return;

    modal.classList.add("oculto");
    modal.setAttribute("aria-hidden", "true");
    delete modal.dataset.fecha;
}

function quitarSalidaAgendada(fechaISO) {
    const actual =
        estado.agendaSalidas?.[fechaISO];

    if (!actual) return;

    // Quitamos primero de la interfaz/estado para que el toque
    // tenga respuesta instantánea.
    delete estado.agendaSalidas[fechaISO];

    if (!guardarAgendaSalidas()) {
        estado.agendaSalidas[fechaISO] =
            actual;

        window.alert(
            "No se pudo quitar la salida planificada."
        );

        actualizarCalendarioInicio();
        return;
    }

    actualizarCalendarioInicio();

    const fecha =
        fechaDesdeISO(fechaISO);

    const registrosDia =
        estado.registros.filter(
            registro =>
                registro.fecha === fechaISO
        );

    mostrarDetalleDiaCalendario(
        fecha.getDate(),
        fecha.getMonth(),
        fecha.getFullYear(),
        registrosDia
    );
}

function sumarUnMesCalendario(fecha) {

    const resultado = new Date(fecha);
    const diaOriginal = resultado.getDate();

    resultado.setDate(1);
    resultado.setMonth(
        resultado.getMonth() + 1
    );

    const ultimoDiaDelMes =
        new Date(
            resultado.getFullYear(),
            resultado.getMonth() + 1,
            0
        ).getDate();

    resultado.setDate(
        Math.min(
            diaOriginal,
            ultimoDiaDelMes
        )
    );

    return resultado;
}

/* V225 · Mes compacto y agenda completa, sin modificar los datos. */
let vistaAgendaCalendarioV225=false;
function marcaCalendarioV225(tipo,prevista){
    const marca=document.createElement("i");marca.className="marca-cal-v225 marca-"+tipo+(prevista?" prevista":"");return marca;
}
function entradasAgendaV225(fecha){
    const filas=[];
    (estado.registros||[]).filter(r=>String(r.fecha).slice(0,10)===fecha&&actividadVisible(r.tipo)).forEach(r=>{
        filas.push({tipo:r.tipo,titulo:nombreActividad(r.tipo)+" · "+formatearTiempo(r.minutos),detalle:["Registrada",r.companero?"Con "+r.companero:"",r.notas||""].filter(Boolean).join(" · "),hora:""});
    });
    const raw=estado.agendaSalidas?.[fecha];
    if(raw){const p=normalizarAgendaDia(raw);filas.push({tipo:p.tipo,titulo:nombreActividad(p.tipo)+" · Prevista",detalle:[p.companero?"Con "+p.companero:"",p.minutosPrevistos?formatoMinutosPlan(p.minutosPrevistos):""].filter(Boolean).join(" · "),hora:p.hora||""});}
    (window.MiServicioEventosCalendario?.deFecha(fecha)||[]).forEach(e=>filas.push({tipo:"evento",titulo:e.titulo,detalle:[e.origen==="apple"?(e.calendario||"Apple Calendar"):"Evento personal",e.todoElDia?"Todo el día":""].filter(Boolean).join(" · "),hora:e.hora||""}));
    return filas.sort((a,b)=>(a.hora||"").localeCompare(b.hora||""));
}
function actualizarAgendaVisualV225(){
    actualizarEtiquetasMesV225();
    const host=document.getElementById("agendaMesCalendarioV225");if(!host)return;
    host.hidden=!vistaAgendaCalendarioV225;
    document.getElementById("calendarioInicio").hidden=vistaAgendaCalendarioV225;
    const semana=document.querySelector(".calendario-semana");if(semana)semana.hidden=vistaAgendaCalendarioV225;
    document.querySelector(".leyenda-calendario-v195")?.classList.toggle("oculto",vistaAgendaCalendarioV225);
    document.getElementById("vistaMesCalendarioV225")?.setAttribute("aria-pressed",String(!vistaAgendaCalendarioV225));
    document.getElementById("vistaAgendaCalendarioV225")?.setAttribute("aria-pressed",String(vistaAgendaCalendarioV225));
    host.replaceChildren();
    if(!vistaAgendaCalendarioV225)return;
    const ref=mesVisibleCalendarioV225();const y=ref.getFullYear(),m=ref.getMonth();let cantidad=0;
    for(let dia=1;dia<=new Date(y,m+1,0).getDate();dia++){
        const fecha=fechaLocalISO(new Date(y,m,dia));const filas=entradasAgendaV225(fecha);if(!filas.length)continue;cantidad++;
        const seccion=document.createElement("section");seccion.className="agenda-fecha-v225";
        const boton=document.createElement("button");boton.type="button";boton.className="agenda-fecha-titulo-v225";
        boton.textContent=new Date(y,m,dia).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
        boton.setAttribute("aria-label",boton.textContent+". Ver detalles y acciones");
        boton.onclick=()=>abrirDetalleDiaV225(dia,m,y,(estado.registros||[]).filter(r=>String(r.fecha).slice(0,10)===fecha));
        seccion.appendChild(boton);
        filas.forEach(f=>{
            const fila=document.createElement("div");fila.className="agenda-fila-v225 marca-"+f.tipo;
            const hora=document.createElement("span");hora.className="agenda-hora-v225";hora.textContent=f.hora;
            const texto=document.createElement("div");const titulo=document.createElement("strong");titulo.textContent=f.titulo;
            const desc=document.createElement("small");desc.textContent=f.detalle;texto.append(titulo,desc);fila.append(hora,texto);seccion.appendChild(fila);
        });host.appendChild(seccion);
    }
    if(!cantidad){const vacio=document.createElement("p");vacio.className="agenda-vacio-v225";vacio.textContent="Este mes no tiene eventos, planes ni registros. Elige un día en la vista Mes para empezar.";host.appendChild(vacio);}
}
function instalarAgendaVisualV225(){
    document.getElementById("vistaMesCalendarioV225")?.addEventListener("click",()=>{vistaAgendaCalendarioV225=false;actualizarAgendaVisualV225();});
    document.getElementById("vistaAgendaCalendarioV225")?.addEventListener("click",()=>{vistaAgendaCalendarioV225=true;actualizarAgendaVisualV225();});
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarAgendaVisualV225,{once:true});else instalarAgendaVisualV225();

/* V225 · Etiquetas del mes con datos reales y detalles completos al tocar. */
function etiquetasDiaV225(fecha){
    const etiquetas=[];const totales=new Map();
    (estado.registros||[]).filter(r=>String(r.fecha).slice(0,10)===fecha&&actividadVisible(r.tipo)).forEach(r=>{
        const min=Math.max(0,Number(r.minutos)||0);if(min)totales.set(r.tipo,(totales.get(r.tipo)||0)+min);
    });
    totales.forEach((min,tipo)=>etiquetas.push({tipo,texto:nombreActividad(tipo)+" "+formatearTiempoCortoCalendario(min),titulo:nombreActividad(tipo)+": "+formatearTiempo(min),prevista:false}));
    const raw=estado.agendaSalidas?.[fecha];
    if(raw){const plan=normalizarAgendaDia(raw);etiquetas.push({tipo:plan.tipo,texto:"○ "+(plan.hora?plan.hora+" ":"")+nombreActividad(plan.tipo),titulo:["Prevista: "+nombreActividad(plan.tipo),plan.hora||"",plan.companero?"Con "+plan.companero:""].filter(Boolean).join(" · "),prevista:true});}
    (window.MiServicioEventosCalendario?.deFecha(fecha)||[]).forEach(e=>etiquetas.push({tipo:"evento",subtipo:e.tipo||"personal",texto:e.titulo,titulo:[e.todoElDia?"Todo el día":e.hora||"",e.titulo].filter(Boolean).join(" · "),prevista:false}));
    return etiquetas;
}
function actualizarEtiquetasMesV225(){
    const mes=document.getElementById("calendarioInicio");if(!mes)return;
    mes.querySelectorAll("button.calendario-dia").forEach(boton=>{
        boton.querySelectorAll(".calendario-etiquetas-v225").forEach(n=>n.remove());
        const fecha=boton.dataset.fechaV225;if(!fecha)return;
        mostrarHorasDiaV225(boton,fecha);
        const lista=etiquetasDiaV225(fecha);if(!lista.length)return;
        const box=document.createElement("span");box.className="calendario-etiquetas-v225";box.setAttribute("aria-hidden","true");
        lista.slice(0,3).forEach(item=>{
            const etiqueta=document.createElement("span");etiqueta.className="calendario-etiqueta-v225 marca-"+item.tipo+(item.prevista?" es-prevista":"")+(item.subtipo?" evento-"+item.subtipo:"");
            etiqueta.textContent=item.texto;etiqueta.title=item.titulo;box.appendChild(etiqueta);
        });
        if(lista.length>3){const mas=document.createElement("span");mas.className="calendario-mas-v225";mas.textContent="+"+(lista.length-3);mas.title="Toca el día para ver los "+lista.length+" elementos";box.appendChild(mas);}
        boton.appendChild(box);
    });
}

/* V225 · Total real del día junto a la fecha. */
function minutosDiaVisualV225(fecha){
    return (estado.registros||[]).filter(r=>String(r.fecha).slice(0,10)===fecha&&actividadVisible(r.tipo)).reduce((total,r)=>{
        const minutos=Number(r.minutos??r.minutosTotales);return total+(Number.isFinite(minutos)?Math.max(0,minutos):0);
    },0);
}
function mostrarHorasDiaV225(boton,fecha){
    const numero=boton.querySelector(".calendario-dia-numero");if(!numero)return;
    let cabecera=boton.querySelector(".calendario-fecha-horas-v225");
    if(!cabecera){cabecera=document.createElement("span");cabecera.className="calendario-fecha-horas-v225";boton.replaceChild(cabecera,numero);cabecera.appendChild(numero);}
    cabecera.querySelectorAll(".calendario-horas-dia-v225").forEach(n=>n.remove());
    const total=Math.round(minutosDiaVisualV225(fecha));cabecera.classList.toggle("con-horas",total>0);if(!total)return;
    const badge=document.createElement("span");badge.className="calendario-horas-dia-v225";badge.setAttribute("aria-hidden","true");badge.title="Tiempo registrado: "+formatearTiempo(total);
    const h=Math.floor(total/60),m=total%60;
    if(h){const horas=document.createElement("span");horas.textContent=h+"h";badge.appendChild(horas);}
    if(m){const minutos=document.createElement("span");minutos.textContent=m+"m";badge.appendChild(minutos);}
    cabecera.appendChild(badge);
}

/* V225 · El detalle vive en una tarjeta emergente, sin duplicar controles ni datos. */
let dialogoDiaV225=null;
let desbordamientoAnteriorV225=null;
function instalarDetalleEmergenteV225(){
    if(dialogoDiaV225)return dialogoDiaV225;
    const detalle=document.getElementById("detalleDiaCalendario");
    const inicio=document.getElementById("vista-inicio");
    if(!detalle||!inicio)return null;
    const dialogo=document.createElement("dialog");
    dialogo.id="dialogoDiaCalendarioV225";
    dialogo.className="detalle-emergente-v225";
    dialogo.setAttribute("aria-label","Detalle del día");
    const barra=document.createElement("div");barra.className="detalle-emergente-barra-v225";
    const etiqueta=document.createElement("span");etiqueta.textContent="Detalle del día";
    const cerrar=document.createElement("button");cerrar.type="button";cerrar.className="detalle-emergente-cerrar-v225";
    cerrar.textContent="×";cerrar.setAttribute("aria-label","Cerrar detalle del día");cerrar.autofocus=true;
    cerrar.addEventListener("click",()=>dialogo.close());barra.append(etiqueta,cerrar);
    const contenido=document.createElement("div");contenido.className="detalle-emergente-contenido-v225";
    contenido.appendChild(detalle);dialogo.append(barra,contenido);inicio.appendChild(dialogo);
    dialogo.addEventListener("click",e=>{
        if(e.target!==dialogo)return;
        const rect=dialogo.getBoundingClientRect();
        if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialogo.close();
    });
    // Cerrar antes de abrir Registrar o los modales de edición/planificación.
    // Los botones y sus manejadores originales permanecen en el mismo nodo.
    detalle.addEventListener("click",e=>{
        if(e.target.closest("button")&&dialogo.open)dialogo.close();
    },true);
    dialogo.addEventListener("close",()=>{
        if(desbordamientoAnteriorV225!==null){
            document.documentElement.style.overflow=desbordamientoAnteriorV225;
            desbordamientoAnteriorV225=null;
        }
    });
    dialogoDiaV225=dialogo;
    return dialogo;
}
function abrirDetalleDiaV225(dia,mes,anio,registros){
    const dialogo=instalarDetalleEmergenteV225();if(!dialogo)return;
    mostrarDetalleDiaCalendario(dia,mes,anio,registros);
    dialogo.setAttribute("aria-label",new Date(anio,mes,dia).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"}));
    if(!dialogo.open){
        dialogo.showModal();
        desbordamientoAnteriorV225=document.documentElement.style.overflow;
        document.documentElement.style.overflow="hidden";
    }
    dialogo.querySelector(".detalle-emergente-contenido-v225").scrollTop=0;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarDetalleEmergenteV225,{once:true});else instalarDetalleEmergenteV225();
