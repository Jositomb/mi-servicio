/* V216 · Mes visible independiente de la fecha de hoy. */
let referenciaCalendarioV216=null;
function mesVisibleCalendarioV216(){
    const d=referenciaCalendarioV216||new Date();
    return new Date(d.getFullYear(),d.getMonth(),1,12);
}
function cambiarMesCalendarioV216(delta){
    const actual=mesVisibleCalendarioV216();
    referenciaCalendarioV216=new Date(actual.getFullYear(),actual.getMonth()+delta,1,12);
    diaSeleccionadoV216="";
    actualizarCalendarioInicio();
}
function volverMesActualV216(){referenciaCalendarioV216=null;diaSeleccionadoV216="";actualizarCalendarioInicio();}
function instalarMesesCalendarioV216(){
    document.getElementById("mesAnteriorCalendarioV216")?.addEventListener("click",()=>cambiarMesCalendarioV216(-1));
    document.getElementById("mesSiguienteCalendarioV216")?.addEventListener("click",()=>cambiarMesCalendarioV216(1));
    document.getElementById("mesActualCalendarioV216")?.addEventListener("click",volverMesActualV216);
}
if(document.readyState!=="complete")document.addEventListener("DOMContentLoaded",instalarMesesCalendarioV216,{once:true});else instalarMesesCalendarioV216();

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
    const referencia=mesVisibleCalendarioV216();
    const anio=referencia.getFullYear();
    const mes=referencia.getMonth();

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

        hueco.className="calendario-dia calendario-otro-mes-v216";
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
        botonDia.appendChild(tiempos);

        const companerosDia = Array.from(new Set(
            (registrosPorDia.get(dia) || [])
                .map(registro => String(registro.companero || "").trim())
                .filter(Boolean)
        ));

        const fechaDiaISO =
            fechaLocalISO(
                new Date(anio, mes, dia)
            );

        const agendaDiaDatos =
            normalizarAgendaDia(
                estado.agendaSalidas?.[fechaDiaISO]
            );

        const companeroAgendado =
            agendaDiaDatos.companero;

        const tipoAgendado =
            agendaDiaDatos.tipo;

        // Si hay una salida planificada, la mostramos incluso aunque
        // todavía no haya horas registradas.
        if (estado.agendaSalidas?.[fechaDiaISO]) {
            botonDia.classList.add("con-agenda");

            const agendaDia =
                document.createElement("span");

            agendaDia.className =
                `calendario-dia-agenda ${claseActividadCalendario(tipoAgendado)}`;

            agendaDia.textContent =
                `📌 ${agendaDiaDatos.hora?agendaDiaDatos.hora+" · ":""}${nombreActividad(tipoAgendado)}${companeroAgendado?" · "+companeroAgendado:""}${agendaDiaDatos.minutosPrevistos ? " · "+formatoMinutosPlan(agendaDiaDatos.minutosPrevistos) : ""}`;

            agendaDia.title =
                `${nombreActividad(tipoAgendado)} planificado${companeroAgendado?" con "+companeroAgendado:""}`;

            botonDia.appendChild(agendaDia);

        } else if (companerosDia.length > 0) {
            const companeroDia =
                document.createElement("span");

            companeroDia.className =
                "calendario-dia-companero";

            companeroDia.textContent =
                companerosDia.join(", ");

            companeroDia.title =
                companerosDia.join(", ");

            botonDia.appendChild(companeroDia);
        }

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

        indicadorDiaV216(botonDia,estado.agendaSalidas?.[fechaDiaISO]?agendaDiaDatos:null,registrosPorDia.get(dia)||[]);
        botonDia.dataset.fechaV216=fechaDiaISO;
        botonDia.classList.toggle("seleccionado-v216",fechaDiaISO===diaSeleccionadoV216);
        botonDia.setAttribute("aria-pressed",String(fechaDiaISO===diaSeleccionadoV216));

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
        const celda=document.createElement("span");celda.className="calendario-dia calendario-otro-mes-v216";celda.textContent=String(i);celda.setAttribute("aria-hidden","true");calendario.appendChild(celda);
    }
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
    marcarDiaV216(fechaLocalISO(fecha));

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
    registrarDia.type="button";registrarDia.className="boton-registrar-dia-v216";
    registrarDia.textContent="Registrar este día";
    registrarDia.addEventListener("click",()=>abrirRegistroDiaV216(fechaISO));
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

    actualizarHabitualV216();

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
