/* V222 · Mes visible independiente de la fecha de hoy. */
let referenciaCalendarioV222=null;
function mesVisibleCalendarioV222(){
    const d=referenciaCalendarioV222||new Date();
    return new Date(d.getFullYear(),d.getMonth(),1,12);
}
function cambiarMesCalendarioV222(delta){
    const actual=mesVisibleCalendarioV222();
    referenciaCalendarioV222=new Date(actual.getFullYear(),actual.getMonth()+delta,1,12);
    diaSeleccionadoV222="";
    actualizarCalendarioInicio();
}
function elegirMesCalendarioV222(valor){
    const d=fechaMesV202(valor);
    if(!d||claveMesV143(d)!==valor)return false;
    referenciaCalendarioV222=d;diaSeleccionadoV222="";actualizarCalendarioInicio();return true;
}
function volverMesActualV222(){referenciaCalendarioV222=null;diaSeleccionadoV222="";actualizarCalendarioInicio();}
function instalarMesesCalendarioV222(){
    document.getElementById("elegirMesCalendarioV222")?.addEventListener("change",e=>{
        if(!elegirMesCalendarioV222(e.target.value))e.target.value=claveMesV143(mesVisibleCalendarioV222());
    });
    document.getElementById("mesAnteriorCalendarioV222")?.addEventListener("click",()=>cambiarMesCalendarioV222(-1));
    document.getElementById("mesSiguienteCalendarioV222")?.addEventListener("click",()=>cambiarMesCalendarioV222(1));
    document.getElementById("mesActualCalendarioV222")?.addEventListener("click",volverMesActualV222);
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarMesesCalendarioV222,{once:true});else instalarMesesCalendarioV222();

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
    const referencia=mesVisibleCalendarioV222();
    const anio=referencia.getFullYear();
    const mes=referencia.getMonth();
    const selector=document.getElementById("elegirMesCalendarioV222");if(selector)selector.value=claveMesV143(referencia);

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

        hueco.className="calendario-dia calendario-otro-mes-v222";
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
        const marcas=document.createElement("span");marcas.className="calendario-marcas-v222";marcas.setAttribute("aria-hidden","true");
        Object.entries(minutosPorActividad).forEach(([tipo,min])=>{
            if(min>0&&actividadVisible(tipo))marcas.appendChild(marcaCalendarioV222(tipo,false));
        });
        if(estado.agendaSalidas?.[fechaDiaISO]){
            botonDia.classList.add("con-agenda");
            marcas.appendChild(marcaCalendarioV222(agendaDiaDatos.tipo,true));
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

        const estadoDia=estadoDiaV222(estado.agendaSalidas?.[fechaDiaISO]?agendaDiaDatos:null,registrosPorDia.get(dia)||[]);
        if(estadoDia?.texto)botonDia.setAttribute("aria-label",botonDia.getAttribute("aria-label")+". "+estadoDia.texto);
        botonDia.dataset.fechaV222=fechaDiaISO;
        botonDia.classList.toggle("seleccionado-v222",fechaDiaISO===diaSeleccionadoV222);
        botonDia.setAttribute("aria-pressed",String(fechaDiaISO===diaSeleccionadoV222));

        botonDia.addEventListener(
            "click",
            () => {
                mostrarDetalleDiaCalendario(
                    dia,
                    mes,
                    anio,
                    registrosPorDia.get(dia) || []
                );
            }
        );

        calendario.appendChild(botonDia);
    }
    const restantes=(7-(huecosIniciales+diasMes)%7)%7;
    for(let i=1;i<=restantes;i++){
        const celda=document.createElement("span");celda.className="calendario-dia calendario-otro-mes-v222";celda.textContent=String(i);celda.setAttribute("aria-hidden","true");calendario.appendChild(celda);
    }
    const clave=claveMesV143(referencia);
    if(!diaSeleccionadoV222.startsWith(clave+"-")){
        diaSeleccionadoV222=fechaLocalISO(new Date(anio,mes,anio===hoy.getFullYear()&&mes===hoy.getMonth()?hoy.getDate():1));
    }
    const elegido=fechaDesdeISO(diaSeleccionadoV222);
    mostrarDetalleDiaCalendario(elegido.getDate(),mes,anio,registrosPorDia.get(elegido.getDate())||[]);
    actualizarAgendaVisualV222();
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
    marcarDiaV222(fechaLocalISO(fecha));

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
    registrarDia.type="button";registrarDia.className="boton-registrar-dia-v222";
    registrarDia.textContent="Registrar este día";
    registrarDia.addEventListener("click",()=>abrirRegistroDiaV222(fechaISO));
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

    actualizarHabitualV222();

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

/* V222 · Mes compacto y agenda completa, sin modificar los datos. */
let vistaAgendaCalendarioV222=false;
function marcaCalendarioV222(tipo,prevista){
    const marca=document.createElement("i");marca.className="marca-cal-v222 marca-"+tipo+(prevista?" prevista":"");return marca;
}
function entradasAgendaV222(fecha){
    const filas=[];
    (estado.registros||[]).filter(r=>String(r.fecha).slice(0,10)===fecha&&actividadVisible(r.tipo)).forEach(r=>{
        filas.push({tipo:r.tipo,titulo:nombreActividad(r.tipo)+" · "+formatearTiempo(r.minutos),detalle:["Registrada",r.companero?"Con "+r.companero:"",r.notas||""].filter(Boolean).join(" · "),hora:""});
    });
    const raw=estado.agendaSalidas?.[fecha];
    if(raw){const p=normalizarAgendaDia(raw);filas.push({tipo:p.tipo,titulo:nombreActividad(p.tipo)+" · Prevista",detalle:[p.companero?"Con "+p.companero:"",p.minutosPrevistos?formatoMinutosPlan(p.minutosPrevistos):""].filter(Boolean).join(" · "),hora:p.hora||""});}
    (window.MiServicioEventosCalendario?.deFecha(fecha)||[]).forEach(e=>filas.push({tipo:"evento",titulo:e.titulo,detalle:[e.origen==="apple"?(e.calendario||"Apple Calendar"):"Evento personal",e.todoElDia?"Todo el día":""].filter(Boolean).join(" · "),hora:e.hora||""}));
    return filas.sort((a,b)=>(a.hora||"").localeCompare(b.hora||""));
}
function actualizarAgendaVisualV222(){
    actualizarEtiquetasMesV222();
    const host=document.getElementById("agendaMesCalendarioV222");if(!host)return;
    host.hidden=!vistaAgendaCalendarioV222;
    document.getElementById("calendarioInicio").hidden=vistaAgendaCalendarioV222;
    const semana=document.querySelector(".calendario-semana");if(semana)semana.hidden=vistaAgendaCalendarioV222;
    document.querySelector(".leyenda-calendario-v195")?.classList.toggle("oculto",vistaAgendaCalendarioV222);
    document.getElementById("vistaMesCalendarioV222")?.setAttribute("aria-pressed",String(!vistaAgendaCalendarioV222));
    document.getElementById("vistaAgendaCalendarioV222")?.setAttribute("aria-pressed",String(vistaAgendaCalendarioV222));
    host.replaceChildren();
    if(!vistaAgendaCalendarioV222)return;
    const ref=mesVisibleCalendarioV222();const y=ref.getFullYear(),m=ref.getMonth();let cantidad=0;
    for(let dia=1;dia<=new Date(y,m+1,0).getDate();dia++){
        const fecha=fechaLocalISO(new Date(y,m,dia));const filas=entradasAgendaV222(fecha);if(!filas.length)continue;cantidad++;
        const seccion=document.createElement("section");seccion.className="agenda-fecha-v222";
        const boton=document.createElement("button");boton.type="button";boton.className="agenda-fecha-titulo-v222";
        boton.textContent=new Date(y,m,dia).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
        boton.setAttribute("aria-label",boton.textContent+". Ver detalles y acciones");
        boton.onclick=()=>{mostrarDetalleDiaCalendario(dia,m,y,(estado.registros||[]).filter(r=>String(r.fecha).slice(0,10)===fecha));document.getElementById("detalleDiaCalendario").scrollIntoView({block:"nearest",behavior:"auto"});};
        seccion.appendChild(boton);
        filas.forEach(f=>{
            const fila=document.createElement("div");fila.className="agenda-fila-v222 marca-"+f.tipo;
            const hora=document.createElement("span");hora.className="agenda-hora-v222";hora.textContent=f.hora;
            const texto=document.createElement("div");const titulo=document.createElement("strong");titulo.textContent=f.titulo;
            const desc=document.createElement("small");desc.textContent=f.detalle;texto.append(titulo,desc);fila.append(hora,texto);seccion.appendChild(fila);
        });host.appendChild(seccion);
    }
    if(!cantidad){const vacio=document.createElement("p");vacio.className="agenda-vacio-v222";vacio.textContent="Este mes no tiene eventos, planes ni registros. Elige un día en la vista Mes para empezar.";host.appendChild(vacio);}
}
function instalarAgendaVisualV222(){
    document.getElementById("vistaMesCalendarioV222")?.addEventListener("click",()=>{vistaAgendaCalendarioV222=false;actualizarAgendaVisualV222();});
    document.getElementById("vistaAgendaCalendarioV222")?.addEventListener("click",()=>{vistaAgendaCalendarioV222=true;actualizarAgendaVisualV222();});
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarAgendaVisualV222,{once:true});else instalarAgendaVisualV222();

/* V222 · Etiquetas del mes con datos reales y detalles completos al tocar. */
function etiquetasDiaV222(fecha){
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
function actualizarEtiquetasMesV222(){
    const mes=document.getElementById("calendarioInicio");if(!mes)return;
    mes.querySelectorAll("button.calendario-dia").forEach(boton=>{
        boton.querySelectorAll(".calendario-etiquetas-v222").forEach(n=>n.remove());
        const fecha=boton.dataset.fechaV222;if(!fecha)return;
        mostrarHorasDiaV222(boton,fecha);
        const lista=etiquetasDiaV222(fecha);if(!lista.length)return;
        const box=document.createElement("span");box.className="calendario-etiquetas-v222";box.setAttribute("aria-hidden","true");
        lista.slice(0,3).forEach(item=>{
            const etiqueta=document.createElement("span");etiqueta.className="calendario-etiqueta-v222 marca-"+item.tipo+(item.prevista?" es-prevista":"")+(item.subtipo?" evento-"+item.subtipo:"");
            etiqueta.textContent=item.texto;etiqueta.title=item.titulo;box.appendChild(etiqueta);
        });
        if(lista.length>3){const mas=document.createElement("span");mas.className="calendario-mas-v222";mas.textContent="+"+(lista.length-3);mas.title="Toca el día para ver los "+lista.length+" elementos";box.appendChild(mas);}
        boton.appendChild(box);
    });
}

/* V222 · Total real del día junto a la fecha. */
function minutosDiaVisualV222(fecha){
    return (estado.registros||[]).filter(r=>String(r.fecha).slice(0,10)===fecha&&actividadVisible(r.tipo)).reduce((total,r)=>{
        const minutos=Number(r.minutos??r.minutosTotales);return total+(Number.isFinite(minutos)?Math.max(0,minutos):0);
    },0);
}
function mostrarHorasDiaV222(boton,fecha){
    const numero=boton.querySelector(".calendario-dia-numero");if(!numero)return;
    let cabecera=boton.querySelector(".calendario-fecha-horas-v222");
    if(!cabecera){cabecera=document.createElement("span");cabecera.className="calendario-fecha-horas-v222";boton.replaceChild(cabecera,numero);cabecera.appendChild(numero);}
    cabecera.querySelectorAll(".calendario-horas-dia-v222").forEach(n=>n.remove());
    const total=Math.round(minutosDiaVisualV222(fecha));cabecera.classList.toggle("con-horas",total>0);if(!total)return;
    const badge=document.createElement("span");badge.className="calendario-horas-dia-v222";badge.setAttribute("aria-hidden","true");badge.title="Tiempo registrado: "+formatearTiempo(total);
    const h=Math.floor(total/60),m=total%60;
    if(h){const horas=document.createElement("span");horas.textContent=h+"h";badge.appendChild(horas);}
    if(m){const minutos=document.createElement("span");minutos.textContent=m+"m";badge.appendChild(minutos);}
    cabecera.appendChild(badge);
}
