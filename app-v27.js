// =========================================================
// MI SERVICIO WEB
// app.js
// =========================================================

"use strict";


// =========================================================
// CLAVES DE ALMACENAMIENTO
// =========================================================

const STORAGE_KEYS = {
    registros: "miServicio.registros",
    preferencias: "miServicio.preferencias",
    ultimaCopiaSeguridad: "miServicio.ultimaCopiaSeguridad",
    onedriveConectado: "miServicio.onedriveConectado",
    ultimaSyncOneDrive: "miServicio.ultimaSyncOneDrive",
    ultimaModificacionLocal: "miServicio.ultimaModificacionLocal",
    agendaSalidas: "miServicio.agendaSalidas"
};


// =========================================================
// CAPA DE ALMACENAMIENTO
// =========================================================

const almacenamiento = {

    leer(clave, valorPorDefecto) {

        try {

            const contenido =
                localStorage.getItem(clave);

            if (!contenido) {
                return valorPorDefecto;
            }

            return JSON.parse(contenido);

        } catch (error) {

            console.error(
                `No se pudo leer ${clave}:`,
                error
            );

            return valorPorDefecto;
        }
    },


    guardar(clave, valor) {

        try {

            localStorage.setItem(
                clave,
                JSON.stringify(valor)
            );

            return true;

        } catch (error) {

            console.error(
                `No se pudo guardar ${clave}:`,
                error
            );

            return false;
        }
    },


    eliminar(clave) {

        try {

            localStorage.removeItem(clave);

            return true;

        } catch (error) {

            console.error(
                `No se pudo eliminar ${clave}:`,
                error
            );

            return false;
        }
    }
};


// =========================================================
// ESTADO GENERAL
// =========================================================

const estado = {

    vistaActual: "inicio",

    filtroHistorial: "todos",

    registros: [],

    // Planificación del ministerio por fecha:
    // { "2026-09-18": "Marta", ... }
    agendaSalidas: {},

    preferencias: {
        tipoPublicador: "publicador",
        personajeProgreso: "hombre",
        objetivoMensualMinutos: 0,
        mostrarLDC: true,
        mostrarAsambleas: true,
        mostrarOtras: true
    },

    registroPendienteBorrar: null,

    registroPendienteEditar: null,

    estadisticas: {
        periodo: "semana",
        fechaReferencia: new Date()
    }
};


// =========================================================
// INICIO DE LA APLICACIÓN
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        importarTransferenciaDesdeURL();

        cargarDatos();

        configurarNavegacion();

        configurarSelectorActividad();

        configurarFormulario();

        configurarHistorial();

        configurarEdicionRegistros();

        configurarFiltrosHistorial();

        configurarEstadisticas();

        configurarAjustes();

        configurarCalendarioInicio();

        configurarRecordatorioCopiaSeguridad();

        configurarSincronizacionIPhone();

        configurarTransferenciaPantallaInicio();

        configurarOneDrive();

        establecerFechaActual();
        
        establecerFechaActual();
        
        seleccionarActividad(
            "ministerio"
        );

        cargarFormularioAjustes();

        actualizarTodaLaInterfaz();

        actualizarRecordatorioCopiaSeguridad();

        seleccionarVista(
            "inicio"
        );

        console.log(
            "Mi Servicio Web iniciado correctamente"
        );
    }
);


// =========================================================
// CARGAR DATOS
// =========================================================

function cargarDatos() {

    estado.registros =
        leerJSON(
            STORAGE_KEYS.registros,
            []
        );

    estado.agendaSalidas =
        leerJSON(
            STORAGE_KEYS.agendaSalidas,
            {}
        );

    if (
        !estado.agendaSalidas ||
        typeof estado.agendaSalidas !== "object" ||
        Array.isArray(estado.agendaSalidas)
    ) {
        estado.agendaSalidas = {};
    }

    estado.agendaSalidas =
        Object.fromEntries(
            Object.entries(estado.agendaSalidas)
                .map(([fecha, valor]) => [
                    fecha,
                    normalizarAgendaDia(valor)
                ])
                .filter(([, valor]) => Boolean(valor.companero))
        );

    estado.preferencias =
        leerJSON(
            STORAGE_KEYS.preferencias,
            {
                tipoPublicador:
                    "publicador",

                personajeProgreso:
                    "hombre",

                objetivoMensualMinutos:
                    0,
                mostrarLDC: true,
                mostrarAsambleas: true,
                mostrarOtras: true
            }
        );


    // -----------------------------------------
    // Comprobar registros
    // -----------------------------------------

    if (
        !Array.isArray(
            estado.registros
        )
    ) {

        estado.registros = [];
    }


    // -----------------------------------------
    // Comprobar preferencias
    // -----------------------------------------

    if (
        !estado.preferencias ||
        typeof estado.preferencias !==
            "object"
    ) {

        estado.preferencias = {

            tipoPublicador:
                "publicador",

            personajeProgreso:
                "hombre",

            objetivoMensualMinutos:
                0,
            mostrarLDC: true,
            mostrarAsambleas: true,
            mostrarOtras: true
        };
    }


    // -----------------------------------------
    // Completar preferencias antiguas
    // -----------------------------------------

    if (
        !estado.preferencias
            .tipoPublicador
    ) {

        estado.preferencias
            .tipoPublicador =
                "publicador";
    }


    if (
        !["hombre","mujer","koala","mariposa","pantera","tortuga","liebre"].includes(
            estado.preferencias
                .personajeProgreso
        )
    ) {

        estado.preferencias
            .personajeProgreso =
                "hombre";
    }


    if (
        !Number.isFinite(
            Number(
                estado.preferencias
                    .objetivoMensualMinutos
            )
        )
    ) {

        estado.preferencias
            .objetivoMensualMinutos =
                0;
    }

    [
        "mostrarLDC",
        "mostrarAsambleas",
        "mostrarOtras"
    ].forEach(clave => {
        if (typeof estado.preferencias[clave] !== "boolean") {
            estado.preferencias[clave] = true;
        }
    });


    normalizarRegistros();
}


// =========================================================
// NORMALIZAR REGISTROS
// =========================================================

function normalizarRegistros() {

    let huboCambios = false;


    estado.registros =
        estado.registros
            .filter(
                registro => {

                    return (
                        registro &&
                        typeof registro ===
                            "object"
                    );
                }
            )
            .map(
                registro => {

                    const normalizado = {
                        ...registro
                    };


                    // -----------------------------------------
                    // ID
                    // -----------------------------------------

                    if (
                        !normalizado.id
                    ) {

                        normalizado.id =
                            crearID();

                        huboCambios =
                            true;
                    }


                    // -----------------------------------------
                    // Fecha
                    // -----------------------------------------

                    if (
                        !normalizado.fecha
                    ) {

                        normalizado.fecha =
                            fechaLocalISO(
                                new Date()
                            );

                        huboCambios =
                            true;
                    }


                    // -----------------------------------------
                    // Tipo
                    // -----------------------------------------

                    const tiposValidos = [
                        "ministerio",
                        "ldc",
                        "asambleas",
                        "otras"
                    ];


                    if (
                        !tiposValidos.includes(
                            normalizado.tipo
                        )
                    ) {

                        normalizado.tipo =
                            "ministerio";

                        huboCambios =
                            true;
                    }


                    // -----------------------------------------
                    // Minutos
                    // -----------------------------------------

                    const minutos =
                        Math.max(
                            Math.round(
                                Number(
                                    normalizado.minutos
                                ) || 0
                            ),
                            0
                        );


                    if (
                        minutos !==
                        normalizado.minutos
                    ) {

                        huboCambios =
                            true;
                    }


                    normalizado.minutos =
                        minutos;


                    // -----------------------------------------
                    // Notas
                    // -----------------------------------------

                    normalizado.notas =
                        String(
                            normalizado.notas ||
                            ""
                        );

                    normalizado.companero =
                        String(
                            normalizado.companero ||
                            ""
                        ).trim();


                    // -----------------------------------------
                    // Fecha de creación
                    // -----------------------------------------

                    if (
                        !normalizado.creadoEn
                    ) {

                        normalizado.creadoEn =
                            new Date()
                                .toISOString();

                        huboCambios =
                            true;
                    }


                    // -----------------------------------------
                    // Última modificación
                    // -----------------------------------------

                    if (
                        !normalizado.modificadoEn
                    ) {

                        normalizado.modificadoEn =
                            normalizado.creadoEn;

                        huboCambios =
                            true;
                    }


                    // -----------------------------------------
                    // Información de sincronización
                    // -----------------------------------------

                    if (
                        !normalizado
                            .sincronizacion ||
                        typeof normalizado
                            .sincronizacion !==
                            "object"
                    ) {

                        normalizado
                            .sincronizacion = {

                                estado:
                                    "pendiente",

                                ultimaSincronizacion:
                                    null
                            };

                        huboCambios =
                            true;
                    }


                    return normalizado;
                }
            );


    if (huboCambios) {

        guardarRegistros();
    }
}


// =========================================================
// LEER JSON
// =========================================================

function leerJSON(
    clave,
    valorPorDefecto
) {

    return almacenamiento.leer(
        clave,
        valorPorDefecto
    );
}


// =========================================================
// GUARDAR JSON
// =========================================================

function guardarJSON(
    clave,
    valor
) {

    return almacenamiento.guardar(
        clave,
        valor
    );
}


// =========================================================
// GUARDAR REGISTROS
// =========================================================

function guardarRegistros() {

    const guardado = guardarJSON(
        STORAGE_KEYS.registros,
        estado.registros
    );

    if (guardado && !aplicandoDatosOneDrive) {
        marcarModificacionLocalOneDrive();
        programarSincronizacionOneDrive();
    }

    return guardado;
}


// =========================================================
// GUARDAR PREFERENCIAS
// =========================================================

function guardarPreferencias() {

    const guardado = guardarJSON(
        STORAGE_KEYS.preferencias,
        estado.preferencias
    );

    if (guardado && !aplicandoDatosOneDrive) {
        marcarModificacionLocalOneDrive();
        programarSincronizacionOneDrive();
    }

    return guardado;
}


// =========================================================
// NAVEGACIÓN
// =========================================================

function configurarNavegacion() {

    const botones =
        document.querySelectorAll(
            ".nav-item"
        );


    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    const vista =
                        boton.dataset.vista;


                    if (!vista) {
                        return;
                    }


                    seleccionarVista(
                        vista
                    );
                }
            );
        }
    );
}


// =========================================================
// SELECCIONAR VISTA
// =========================================================

function seleccionarVista(
    vista
) {

    const vistaElemento =
        document.getElementById(
            `vista-${vista}`
        );


    if (!vistaElemento) {

        console.warn(
            `No existe la vista: vista-${vista}`
        );

        return;
    }


    // -----------------------------------------
    // Guardamos la vista activa
    // -----------------------------------------

    estado.vistaActual =
        vista;


    // -----------------------------------------
    // Ocultar todas las vistas
    // -----------------------------------------

    document
        .querySelectorAll(
            ".vista"
        )
        .forEach(
            elemento => {

                elemento.classList.remove(
                    "activa"
                );

                // Ocultamos de forma explícita cada pantalla.
                // Así ningún ajuste visual de Inicio puede dejarla
                // visible debajo de Registrar, Historial, etc.
                elemento.hidden = true;
                elemento.style.setProperty(
                    "display",
                    "none",
                    "important"
                );
            }
        );


    // -----------------------------------------
    // Mostrar la seleccionada
    // -----------------------------------------

    vistaElemento.hidden = false;
    vistaElemento.style.removeProperty(
        "display"
    );

    vistaElemento
        .classList
        .add(
            "activa"
        );


    // -----------------------------------------
    // Actualizar barra inferior
    // -----------------------------------------

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            boton => {

                boton.classList.toggle(
                    "activo",
                    boton.dataset.vista ===
                        vista
                );
            }
        );


    // -----------------------------------------
    // Título
    // -----------------------------------------

    const titulos = {

        inicio:
            "Inicio",

        registrar:
            "Registrar",

        historial:
            "Historial",

        estadisticas:
            "Estadísticas",

        meta:
            "Meta",

        ajustes:
            "Ajustes"
    };


    ponerTexto(
        "tituloVista",
        titulos[vista] ||
            "Mi Servicio"
    );


    // -----------------------------------------
    // Actualizar contenido de la vista
    // -----------------------------------------

    switch (vista) {

        case "inicio":

            actualizarInicio();
            setTimeout(refrescarFraseAlVolverAInicio, 30);

            break;


        case "registrar":

            prepararPantallaRegistrar();

            break;


        case "historial":

            renderizarHistorial();

            break;


        case "estadisticas":

            actualizarEstadisticas();

            break;


        case "meta":

            actualizarMeta();

            break;


        case "ajustes":

            cargarFormularioAjustes();

            break;
    }


    // -----------------------------------------
    // Volver arriba
    // -----------------------------------------

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =========================================================
// SELECTOR DE ACTIVIDAD
// =========================================================

function configurarSelectorActividad() {

    const botones =
        document.querySelectorAll(
            ".actividad-boton"
        );


    botones.forEach(
        boton => {

            boton.addEventListener(
                "click",
                () => {

                    const tipo =
                        boton.dataset.tipo;


                    if (!tipo) {
                        return;
                    }


                    seleccionarActividad(
                        tipo
                    );
                }
            );
        }
    );
}


// =========================================================
// SELECCIONAR ACTIVIDAD
// =========================================================

function seleccionarActividad(
    tipo
) {

    const tiposValidos = [
        "ministerio",
        "ldc",
        "asambleas",
        "otras"
    ];


    if (
        !tiposValidos.includes(
            tipo
        )
    ) {

        tipo =
            "ministerio";
    }


    const campoTipo =
        document.getElementById(
            "tipoRegistro"
        );


    if (campoTipo) {

        campoTipo.value =
            tipo;
    }


    document
        .querySelectorAll(
            ".actividad-boton"
        )
        .forEach(
            boton => {

                boton.classList.toggle(
                    "seleccionada",
                    boton.dataset.tipo ===
                        tipo
                );
            }
        );

    const grupoCursos = document.getElementById("grupoCursosBiblicos");
    if (grupoCursos) {
        grupoCursos.classList.toggle("oculto", tipo !== "ministerio");
        if (tipo !== "ministerio") reiniciarCursosBiblicos();
    }

    const grupoCompanero = document.getElementById("grupoCompaneroMinisterio");
    if (grupoCompanero) {
        grupoCompanero.classList.remove("oculto");
    }
}


// =========================================================
// FIN BLOQUE 1
// =========================================================

// =========================================================
// BLOQUE 2
// FORMULARIO + REGISTRO + HISTORIAL + BORRADO
// =========================================================


// =========================================================
// CONFIGURAR FORMULARIO
// =========================================================

function configurarFormulario() {

    const formulario =
        document.getElementById(
            "formRegistro"
        );

    if (!formulario) {
        return;
    }

    configurarCamposTiempoFaciles(
        "horasRegistro",
        "minutosRegistro"
    );

    configurarAtajosTiempo(
        ".atajo-tiempo:not(.atajo-tiempo-edicion)",
        "horasRegistro",
        "minutosRegistro"
    );

    configurarCursosBiblicos();

    formulario.addEventListener(
        "submit",
        evento => {

            evento.preventDefault();

            registrarActividad();
        }
    );
}


// =========================================================
// CURSOS BÍBLICOS
// =========================================================
function configurarCursosBiblicos() {
    const restar = document.getElementById("restarCurso");
    const sumar = document.getElementById("sumarCurso");
    const numero = document.getElementById("cantidadCursosBiblicos");

    if (!numero) return;

    const actualizar = valor => {
        const siguiente = Math.max(0, Math.min(99, Number(valor) || 0));
        numero.textContent = String(siguiente);
        numero.dataset.valor = String(siguiente);
    };

    actualizar(numero.textContent);

    if (restar && restar.dataset.configuradoCurso !== "1") {
        restar.dataset.configuradoCurso = "1";
        restar.addEventListener("click", () => {
            actualizar((Number(numero.dataset.valor) || 0) - 1);
            if (typeof vibrar === "function") vibrar(8);
        });
    }

    if (sumar && sumar.dataset.configuradoCurso !== "1") {
        sumar.dataset.configuradoCurso = "1";
        sumar.addEventListener("click", () => {
            actualizar((Number(numero.dataset.valor) || 0) + 1);
            if (typeof vibrar === "function") vibrar(8);
        });
    }
}

function obtenerCursosBiblicosFormulario() {
    const numero = document.getElementById("cantidadCursosBiblicos");
    return Math.max(0, Number(numero?.dataset.valor ?? numero?.textContent ?? 0) || 0);
}

function reiniciarCursosBiblicos() {
    const numero = document.getElementById("cantidadCursosBiblicos");
    if (!numero) return;
    numero.textContent = "0";
    numero.dataset.valor = "0";
}

// =========================================================
// CAMPOS Y ATAJOS DE TIEMPO
// =========================================================

function configurarCamposTiempoFaciles(idHoras, idMinutos) {

    [idHoras, idMinutos].forEach(id => {
        const campo = document.getElementById(id);

        if (!campo || campo.dataset.seleccionFacil === "1") {
            return;
        }

        campo.dataset.seleccionFacil = "1";

        const seleccionarTodo = () => {
            setTimeout(() => {
                try {
                    campo.select();
                } catch (error) {
                    // Algunos navegadores móviles no exponen select()
                    // de forma completa en inputs numéricos.
                }
            }, 0);
        };

        campo.addEventListener("focus", seleccionarTodo);
        campo.addEventListener("click", seleccionarTodo);

        campo.addEventListener("blur", () => {
            if (campo.value === "") {
                campo.value = "0";
            }
        });
    });
}


function configurarAtajosTiempo(selector, idHoras, idMinutos) {

    const horas = document.getElementById(idHoras);
    const minutos = document.getElementById(idMinutos);

    if (!horas || !minutos) {
        return;
    }

    document.querySelectorAll(selector).forEach(boton => {

        if (boton.dataset.atajoConfigurado === "1") {
            return;
        }

        boton.dataset.atajoConfigurado = "1";

        boton.addEventListener("click", () => {
            const total = Math.max(
                0,
                Number(boton.dataset.minutos) || 0
            );

            horas.value = String(Math.floor(total / 60));
            minutos.value = String(total % 60);

            const grupo = boton.closest(".atajos-tiempo");
            if (grupo) {
                grupo.querySelectorAll(".atajo-tiempo").forEach(elemento => {
                    elemento.classList.toggle(
                        "seleccionado",
                        elemento === boton
                    );
                });
            }

            if (typeof vibrar === "function") {
                vibrar(10);
            }
        });
    });
}


// =========================================================
// PREPARAR PANTALLA REGISTRAR
// =========================================================

function prepararPantallaRegistrar() {

    const fecha =
        document.getElementById(
            "fechaRegistro"
        );

    if (
        fecha &&
        !fecha.value
    ) {

        establecerFechaActual();
    }
}


// =========================================================
// ESTABLECER FECHA ACTUAL
// =========================================================

function establecerFechaActual() {

    const campoFecha =
        document.getElementById(
            "fechaRegistro"
        );

    if (!campoFecha) {
        return;
    }

    campoFecha.value =
        fechaLocalISO(
            new Date()
        );
}


// =========================================================
// REGISTRAR ACTIVIDAD
// =========================================================

function registrarActividad() {

    const campoFecha =
        document.getElementById(
            "fechaRegistro"
        );

    const campoTipo =
        document.getElementById(
            "tipoRegistro"
        );

    const campoHoras =
        document.getElementById(
            "horasRegistro"
        );

    const campoMinutos =
        document.getElementById(
            "minutosRegistro"
        );

    const campoCompanero =
        document.getElementById(
            "companeroRegistro"
        );

    const campoNotas =
        document.getElementById(
            "notasRegistro"
        );

    const mensaje =
        document.getElementById(
            "mensajeFormulario"
        );


    // -----------------------------------------
    // Comprobar formulario
    // -----------------------------------------

    if (
        !campoFecha ||
        !campoTipo ||
        !campoHoras ||
        !campoMinutos ||
        !campoNotas
    ) {

        console.error(
            "Faltan campos del formulario."
        );

        return;
    }


    limpiarMensajeFormulario(
        mensaje
    );


    // -----------------------------------------
    // Obtener valores
    // -----------------------------------------

    const fecha =
        campoFecha.value;

    const tipo =
        campoTipo.value;

    const horas =
        Number(
            campoHoras.value
        );

    const minutos =
        Number(
            campoMinutos.value
        );

    const notas =
        campoNotas.value.trim();

    const companero =
        campoCompanero
            ? campoCompanero.value.trim()
            : "";

    const cursosBiblicos =
        tipo === "ministerio" ? obtenerCursosBiblicosFormulario() : 0;


    // -----------------------------------------
    // Validar fecha
    // -----------------------------------------

    if (!fecha) {

        mostrarMensajeFormulario(
            mensaje,
            "Selecciona una fecha.",
            true
        );

        return;
    }


    // -----------------------------------------
    // Validar tipo
    // -----------------------------------------

    const tiposValidos = [
        "ministerio",
        "ldc",
        "asambleas",
        "otras"
    ];

    if (
        !tiposValidos.includes(
            tipo
        )
    ) {

        mostrarMensajeFormulario(
            mensaje,
            "Selecciona una actividad.",
            true
        );

        return;
    }


    // -----------------------------------------
    // Validar horas
    // -----------------------------------------

    if (
        !Number.isFinite(horas) ||
        horas < 0 ||
        horas > 24 ||
        !Number.isInteger(horas)
    ) {

        mostrarMensajeFormulario(
            mensaje,
            "Revisa las horas.",
            true
        );

        return;
    }


    // -----------------------------------------
    // Validar minutos
    // -----------------------------------------

    if (
        !Number.isFinite(minutos) ||
        minutos < 0 ||
        minutos > 59 ||
        !Number.isInteger(minutos)
    ) {

        mostrarMensajeFormulario(
            mensaje,
            "Los minutos deben estar entre 0 y 59.",
            true
        );

        return;
    }


    // -----------------------------------------
    // Calcular total
    // -----------------------------------------

    const totalMinutos =
        minutosTotales(
            horas,
            minutos
        );


    if (totalMinutos <= 0) {

        mostrarMensajeFormulario(
            mensaje,
            "Introduce un tiempo mayor que cero.",
            true
        );

        return;
    }


    // -----------------------------------------
    // Crear registro
    // -----------------------------------------

    const ahora =
        new Date()
            .toISOString();


    const registro = {

        id:
            crearID(),

        fecha,

        tipo,

        minutos:
            totalMinutos,

        notas,

        companero,

        cursosBiblicos,

        creadoEn:
            ahora,

        modificadoEn:
            ahora,

        sincronizacion: {

            estado:
                "pendiente",

            ultimaSincronizacion:
                null
        }
    };


    // -----------------------------------------
    // Guardar
    // -----------------------------------------

    estado.registros.push(
        registro
    );


    if (
        !guardarRegistros()
    ) {

        estado.registros.pop();

        mostrarMensajeFormulario(
            mensaje,
            "No se pudo guardar el registro.",
            true
        );

        return;
    }


    // -----------------------------------------
    // Limpiar formulario
    // -----------------------------------------

    campoHoras.value =
        "0";

    campoMinutos.value =
        "0";

    document
        .querySelectorAll(".atajo-tiempo:not(.atajo-tiempo-edicion)")
        .forEach(boton => boton.classList.remove("seleccionado"));

    campoNotas.value =
        "";

    if (campoCompanero) {
        campoCompanero.value = "";
    }

    reiniciarCursosBiblicos();

    establecerFechaActual();

    seleccionarActividad(
        "ministerio"
    );


    // -----------------------------------------
    // Confirmación
    // -----------------------------------------

    mostrarMensajeFormulario(
        mensaje,
        "Actividad guardada ✓",
        false
    );


    // -----------------------------------------
    // Actualizar aplicación
    // -----------------------------------------

    actualizarTodaLaInterfaz();


    // -----------------------------------------
    // Vibración suave si está disponible
    // -----------------------------------------

    if (
        navigator.vibrate &&
        typeof navigator.vibrate ===
            "function"
    ) {

        navigator.vibrate(
            30
        );
    }
}


// =========================================================
// MENSAJES DEL FORMULARIO
// =========================================================

function mostrarMensajeFormulario(
    elemento,
    texto,
    esError
) {

    if (!elemento) {
        return;
    }

    elemento.textContent =
        texto;

    elemento.classList.remove(
        "error",
        "exito",
        "visible"
    );

    elemento.classList.add(
        "visible"
    );

    elemento.classList.add(
        esError
            ? "error"
            : "exito"
    );
}


function limpiarMensajeFormulario(
    elemento
) {

    if (!elemento) {
        return;
    }

    elemento.textContent =
        "";

    elemento.classList.remove(
        "error",
        "exito",
        "visible"
    );
}


// =========================================================
// CONFIGURAR HISTORIAL
// =========================================================

function configurarHistorial() {

    const botonRegistrar =
        document.getElementById(
            "botonRegistrarDesdeHistorial"
        );


    if (botonRegistrar) {

        botonRegistrar.addEventListener(
            "click",
            () => {

                seleccionarVista(
                    "registrar"
                );
            }
        );
    }


    // -----------------------------------------
    // Modal de borrado
    // -----------------------------------------

    const cancelar =
        document.getElementById(
            "cancelarBorrado"
        );

    const confirmar =
        document.getElementById(
            "confirmarBorrado"
        );

    const fondo =
        document.querySelector(
            "#modalBorrar .modal-fondo"
        );


    if (cancelar) {

        cancelar.addEventListener(
            "click",
            cerrarModalBorrado
        );
    }


    if (confirmar) {

        confirmar.addEventListener(
            "click",
            confirmarEliminarRegistro
        );
    }


    if (fondo) {

        fondo.addEventListener(
            "click",
            cerrarModalBorrado
        );
    }


    // -----------------------------------------
    // Escape cierra el modal
    // -----------------------------------------

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key ===
                "Escape"
            ) {

                cerrarModalBorrado();
            }
        }
    );
}


// =========================================================
// CONFIGURAR FILTROS DEL HISTORIAL
// =========================================================

function configurarFiltrosHistorial() {

    document
        .querySelectorAll(
            ".filtro-historial"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        seleccionarFiltroHistorial(
                            boton.dataset.filtro
                        );
                    }
                );
            }
        );
}


// =========================================================
// SELECCIONAR FILTRO
// =========================================================

function seleccionarFiltroHistorial(
    filtro
) {

    const filtrosValidos = [
        "todos",
        "ministerio",
        "ldc",
        "asambleas",
        "otras"
    ];


    if (
        !filtrosValidos.includes(
            filtro
        )
    ) {

        return;
    }


    estado.filtroHistorial =
        filtro;


    document
        .querySelectorAll(
            ".filtro-historial"
        )
        .forEach(
            boton => {

                boton.classList.toggle(
                    "activo",
                    boton.dataset.filtro ===
                        filtro
                );
            }
        );


    renderizarHistorial();
}


// =========================================================
// OBTENER REGISTROS FILTRADOS
// =========================================================

function obtenerRegistrosFiltrados() {

    if (
        estado.filtroHistorial ===
        "todos"
    ) {

        return estado.registros.filter(
            registro => actividadVisible(registro.tipo)
        );
    }


    return estado.registros.filter(
        registro => {

            return (
                actividadVisible(registro.tipo) &&
                registro.tipo ===
                estado.filtroHistorial
            );
        }
    );
}


// =========================================================
// RENDERIZAR HISTORIAL
// =========================================================

function renderizarHistorial() {

    const lista =
        document.getElementById(
            "listaHistorial"
        );

    const vacio =
        document.getElementById(
            "historialVacio"
        );

    const contador =
        document.getElementById(
            "contadorHistorial"
        );

    const tituloVacio =
        document.getElementById(
            "tituloHistorialVacio"
        );

    const textoVacio =
        document.getElementById(
            "textoHistorialVacio"
        );


    if (
        !lista ||
        !vacio ||
        !contador
    ) {

        return;
    }


    // -----------------------------------------
    // Filtrar y ordenar
    // -----------------------------------------

    const registros =
        obtenerRegistrosFiltrados()
            .sort(
                compararRegistrosPorFecha
            );


    contador.textContent =
        textoCantidadRegistros(
            registros.length
        );


    // -----------------------------------------
    // Estado vacío
    // -----------------------------------------

    if (
        registros.length === 0
    ) {

        lista.innerHTML =
            "";

        vacio.classList.remove(
            "oculto"
        );

        actualizarEstadoVacioHistorial(
            tituloVacio,
            textoVacio
        );

        return;
    }


    vacio.classList.add(
        "oculto"
    );


    lista.innerHTML =
        "";


    // -----------------------------------------
    // Agrupar por fecha
    // -----------------------------------------

    const grupos =
        agruparRegistrosPorFecha(
            registros
        );


    grupos.forEach(
        grupo => {

            const seccion =
                document.createElement(
                    "section"
                );

            seccion.className =
                "grupo-historial";


            // ---------------------------------
            // Cabecera del día
            // ---------------------------------

            const encabezado =
                document.createElement(
                    "div"
                );

            encabezado.className =
                "grupo-historial-cabecera";


            const titulo =
                document.createElement(
                    "h3"
                );

            titulo.className =
                "grupo-historial-titulo";

            titulo.textContent =
                tituloFechaHistorial(
                    grupo.fecha
                );


            const total =
                document.createElement(
                    "span"
                );

            total.className =
                "grupo-historial-total";

            total.textContent =
                formatearTiempo(
                    sumarMinutos(
                        grupo.registros
                    )
                );


            encabezado.append(
                titulo,
                total
            );


            // ---------------------------------
            // Registros del día
            // ---------------------------------

            const contenido =
                document.createElement(
                    "div"
                );

            contenido.className =
                "grupo-historial-registros";


            grupo.registros.forEach(
                registro => {

                    contenido.appendChild(
                        crearTarjetaHistorial(
                            registro
                        )
                    );
                }
            );


            seccion.append(
                encabezado,
                contenido
            );


            lista.appendChild(
                seccion
            );
        }
    );
}


// =========================================================
// AGRUPAR REGISTROS POR FECHA
// =========================================================

function agruparRegistrosPorFecha(
    registros
) {

    const mapa =
        new Map();


    registros.forEach(
        registro => {

            if (
                !mapa.has(
                    registro.fecha
                )
            ) {

                mapa.set(
                    registro.fecha,
                    []
                );
            }


            mapa
                .get(
                    registro.fecha
                )
                .push(
                    registro
                );
        }
    );


    return Array
        .from(
            mapa.entries()
        )
        .map(
            (
                [
                    fecha,
                    registrosGrupo
                ]
            ) => {

                return {
                    fecha,
                    registros:
                        registrosGrupo
                };
            }
        );
}


// =========================================================
// TÍTULO DE FECHA DEL HISTORIAL
// =========================================================

function tituloFechaHistorial(
    fechaISO
) {

    const fecha =
        fechaDesdeISO(
            fechaISO
        );

    const hoy =
        new Date();

    const ayer =
        new Date();


    ayer.setDate(
        ayer.getDate() - 1
    );


    // -----------------------------------------
    // Hoy
    // -----------------------------------------

    if (
        fechaLocalISO(fecha) ===
        fechaLocalISO(hoy)
    ) {

        return "Hoy";
    }


    // -----------------------------------------
    // Ayer
    // -----------------------------------------

    if (
        fechaLocalISO(fecha) ===
        fechaLocalISO(ayer)
    ) {

        return "Ayer";
    }


    // -----------------------------------------
    // Fecha normal
    // -----------------------------------------

    const mismoAnio =
        fecha.getFullYear() ===
        hoy.getFullYear();


    const opciones =
        mismoAnio
            ? {
                day: "numeric",
                month: "long"
            }
            : {
                day: "numeric",
                month: "long",
                year: "numeric"
            };


    return capitalizar(
        new Intl.DateTimeFormat(
            "es-ES",
            opciones
        ).format(
            fecha
        )
    );
}


// =========================================================
// ESTADO VACÍO DEL HISTORIAL
// =========================================================

function actualizarEstadoVacioHistorial(
    titulo,
    texto
) {

    if (
        estado.registros.length ===
        0
    ) {

        if (titulo) {

            titulo.textContent =
                "Todavía no hay registros";
        }


        if (texto) {

            texto.textContent =
                "Cuando registres actividad, aparecerá aquí.";
        }


        return;
    }


    const nombre =
        nombreActividad(
            estado.filtroHistorial
        );


    if (titulo) {

        titulo.textContent =
            `No hay registros de ${nombre}`;
    }


    if (texto) {

        texto.textContent =
            "Prueba con otro filtro o registra una nueva actividad.";
    }
}


// =========================================================
// CREAR TARJETA DEL HISTORIAL
// =========================================================

function crearTarjetaHistorial(
    registro
) {

    const tarjeta =
        document.createElement(
            "article"
        );


    tarjeta.className =
        `registro-card registro-card-${registro.tipo}`;


    // -----------------------------------------
    // Icono
    // -----------------------------------------

    const icono =
        document.createElement(
            "div"
        );


    icono.className =
        `registro-icono ${registro.tipo}`;


    icono.textContent =
        iconoActividad(
            registro.tipo
        );


    // -----------------------------------------
    // Contenido
    // -----------------------------------------

    const contenido =
        document.createElement(
            "div"
        );


    contenido.className =
        "registro-contenido";


    // -----------------------------------------
    // Cabecera
    // -----------------------------------------

    const cabecera =
        document.createElement(
            "div"
        );


    cabecera.className =
        "registro-cabecera";


    const tipo =
        document.createElement(
            "p"
        );


    tipo.className =
        "registro-tipo";


    tipo.textContent =
        nombreActividad(
            registro.tipo
        );


    const tiempo =
        document.createElement(
            "span"
        );


    tiempo.className =
        "registro-tiempo";


    tiempo.textContent =
        formatearTiempo(
            registro.minutos
        );


    cabecera.append(
        tipo,
        tiempo
    );


    // -----------------------------------------
    // Fecha
    // -----------------------------------------

    const fecha =
        document.createElement(
            "p"
        );


    fecha.className =
        "registro-fecha";


    fecha.textContent =
        formatearFecha(
            registro.fecha
        );


    contenido.append(
        cabecera,
        fecha
    );


    // -----------------------------------------
    // Notas
    // -----------------------------------------

    if (
        registro.notas
    ) {

        const notas =
            document.createElement(
                "p"
            );


        notas.className =
            "registro-notas";


        notas.textContent =
            registro.notas;


        contenido.appendChild(
            notas
        );
    }


    // -----------------------------------------
    // Botón borrar
    // -----------------------------------------

    const botonBorrar =
        document.createElement(
            "button"
        );


    botonBorrar.type =
        "button";


    botonBorrar.className =
        "boton-borrar";


    botonBorrar.textContent =
        "⌫";


    botonBorrar.setAttribute(
        "aria-label",
        `Eliminar registro de ${nombreActividad(registro.tipo)}`
    );


    botonBorrar.addEventListener(
        "click",
        () => {

            abrirModalBorrado(
                registro.id
            );
        }
    );


    // -----------------------------------------
    // Acciones: editar y borrar
    // -----------------------------------------

    const acciones =
        document.createElement("div");

    acciones.className =
        "registro-acciones";

    const botonEditar =
        document.createElement("button");

    botonEditar.type = "button";
    botonEditar.className =
        "boton-editar-registro";
    botonEditar.textContent = "✎";
    botonEditar.setAttribute(
        "aria-label",
        `Editar registro de ${nombreActividad(registro.tipo)}`
    );

    botonEditar.addEventListener(
        "click",
        evento => {
            evento.stopPropagation();
            abrirModalEdicion(registro.id);
        }
    );

    botonBorrar.addEventListener(
        "click",
        evento => {
            evento.stopPropagation();
        },
        { once: false }
    );

    acciones.append(
        botonEditar,
        botonBorrar
    );

    tarjeta.append(
        icono,
        contenido,
        acciones
    );

    tarjeta.classList.add("registro-card-editable");
    tarjeta.setAttribute("tabindex", "0");
    tarjeta.setAttribute(
        "aria-label",
        `Editar ${nombreActividad(registro.tipo)}, ${formatearTiempo(registro.minutos)}`
    );

    tarjeta.addEventListener(
        "click",
        evento => {
            if (evento.target.closest("button")) return;
            abrirModalEdicion(registro.id);
        }
    );

    tarjeta.addEventListener(
        "keydown",
        evento => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                abrirModalEdicion(registro.id);
            }
        }
    );

    return tarjeta;
}


// =========================================================
// EDICIÓN DE REGISTROS
// =========================================================

function configurarEdicionRegistros() {

    configurarCamposTiempoFaciles(
        "editarHoras",
        "editarMinutos"
    );

    configurarAtajosTiempo(
        ".atajo-tiempo-edicion",
        "editarHoras",
        "editarMinutos"
    );

    const formulario =
        document.getElementById("formEditarRegistro");

    const cancelar =
        document.getElementById("cancelarEdicion");

    const fondo =
        document.querySelector("#modalEditar .modal-fondo");

    if (formulario) {
        formulario.addEventListener(
            "submit",
            guardarEdicionRegistro
        );
    }

    if (cancelar) {
        cancelar.addEventListener(
            "click",
            cerrarModalEdicion
        );
    }

    if (fondo) {
        fondo.addEventListener(
            "click",
            cerrarModalEdicion
        );
    }

    document.addEventListener(
        "keydown",
        evento => {
            if (evento.key === "Escape") {
                cerrarModalEdicion();
            }
        }
    );
}


function abrirModalEdicion(id) {

    const registro =
        estado.registros.find(
            elemento => elemento.id === id
        );

    if (!registro) {
        return;
    }

    estado.registroPendienteEditar = id;

    const modal = document.getElementById("modalEditar");
    const fecha = document.getElementById("editarFecha");
    const tipo = document.getElementById("editarTipo");
    const horas = document.getElementById("editarHoras");
    const minutos = document.getElementById("editarMinutos");
    const notas = document.getElementById("editarNotas");
    const companero = document.getElementById("editarCompanero");
    const grupoCompanero = document.getElementById("grupoEditarCompanero");
    const mensaje = document.getElementById("mensajeEditarRegistro");

    if (!modal || !fecha || !tipo || !horas || !minutos || !notas) {
        return;
    }

    fecha.value = registro.fecha;
    tipo.value = registro.tipo;

    const total = Math.max(Number(registro.minutos) || 0, 0);
    horas.value = String(Math.floor(total / 60));
    minutos.value = String(total % 60);
    notas.value = registro.notas || "";
    if (companero) companero.value = registro.companero || "";
    if (grupoCompanero) {
        grupoCompanero.classList.remove("oculto");
    }
    tipo.onchange = () => {
        if (grupoCompanero) grupoCompanero.classList.remove("oculto");
    };

    document
        .querySelectorAll(".atajo-tiempo-edicion")
        .forEach(boton => boton.classList.remove("seleccionado"));

    // Solo ofrecemos actividades que estén visibles en Ajustes,
    // manteniendo siempre disponible el tipo actual del registro.
    Array.from(tipo.options).forEach(
        opcion => {
            opcion.hidden =
                opcion.value !== registro.tipo
                && !actividadVisible(opcion.value);
        }
    );

    if (mensaje) {
        mensaje.textContent = "";
        mensaje.classList.remove("error");
    }

    modal.classList.remove("oculto");
    modal.setAttribute("aria-hidden", "false");

    setTimeout(() => fecha.focus(), 0);
}


function cerrarModalEdicion() {

    estado.registroPendienteEditar = null;

    const modal = document.getElementById("modalEditar");

    if (!modal) {
        return;
    }

    modal.classList.add("oculto");
    modal.setAttribute("aria-hidden", "true");
}


function guardarEdicionRegistro(evento) {

    evento.preventDefault();

    const id = estado.registroPendienteEditar;
    const indice = estado.registros.findIndex(
        registro => registro.id === id
    );

    if (indice < 0) {
        cerrarModalEdicion();
        return;
    }

    const fecha = document.getElementById("editarFecha");
    const tipo = document.getElementById("editarTipo");
    const horas = document.getElementById("editarHoras");
    const minutos = document.getElementById("editarMinutos");
    const notas = document.getElementById("editarNotas");
    const companero = document.getElementById("editarCompanero");
    const mensaje = document.getElementById("mensajeEditarRegistro");

    const valorFecha = fecha ? fecha.value : "";
    const valorTipo = tipo ? tipo.value : "ministerio";
    const valorHoras = Number(horas ? horas.value : 0);
    const valorMinutos = Number(minutos ? minutos.value : 0);
    const valorNotas = notas ? notas.value.trim() : "";
    const valorCompanero =
        companero
            ? companero.value.trim()
            : "";

    const tiposValidos = [
        "ministerio",
        "ldc",
        "asambleas",
        "otras"
    ];

    function error(texto) {
        if (mensaje) {
            mensaje.textContent = texto;
            mensaje.classList.add("error");
        }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(valorFecha)) {
        error("Selecciona una fecha válida.");
        return;
    }

    if (!tiposValidos.includes(valorTipo)) {
        error("Selecciona una actividad válida.");
        return;
    }

    if (
        !Number.isInteger(valorHoras)
        || valorHoras < 0
        || valorHoras > 24
    ) {
        error("Revisa las horas.");
        return;
    }

    if (
        !Number.isInteger(valorMinutos)
        || valorMinutos < 0
        || valorMinutos > 59
    ) {
        error("Los minutos deben estar entre 0 y 59.");
        return;
    }

    const totalMinutos =
        (valorHoras * 60) + valorMinutos;

    if (totalMinutos <= 0) {
        error("Introduce un tiempo mayor que cero.");
        return;
    }

    const anterior = {
        ...estado.registros[indice],
        sincronizacion: {
            ...(estado.registros[indice].sincronizacion || {})
        }
    };

    estado.registros[indice] = {
        ...estado.registros[indice],
        fecha: valorFecha,
        tipo: valorTipo,
        minutos: totalMinutos,
        notas: valorNotas,
        companero: valorCompanero,
        modificadoEn: new Date().toISOString(),
        sincronizacion: {
            estado: "pendiente",
            ultimaSincronizacion:
                estado.registros[indice].sincronizacion?.ultimaSincronizacion || null
        }
    };

    if (!guardarRegistros()) {
        estado.registros[indice] = anterior;
        error("No se pudieron guardar los cambios.");
        return;
    }

    cerrarModalEdicion();
    actualizarTodaLaInterfaz();
}


// =========================================================
// ABRIR MODAL DE BORRADO
// =========================================================

function abrirModalBorrado(
    id
) {

    estado.registroPendienteBorrar =
        id;


    const modal =
        document.getElementById(
            "modalBorrar"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "oculto"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


// =========================================================
// CERRAR MODAL DE BORRADO
// =========================================================

function cerrarModalBorrado() {

    estado.registroPendienteBorrar =
        null;


    const modal =
        document.getElementById(
            "modalBorrar"
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        "oculto"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}


// =========================================================
// CONFIRMAR BORRADO
// =========================================================

function confirmarEliminarRegistro() {

    const id =
        estado.registroPendienteBorrar;


    if (!id) {

        cerrarModalBorrado();

        return;
    }


    // Guardamos una copia por seguridad.

    const anteriores =
        [
            ...estado.registros
        ];


    estado.registros =
        estado.registros.filter(
            registro => {

                return (
                    registro.id !==
                    id
                );
            }
        );


    // -----------------------------------------
    // Guardar cambio
    // -----------------------------------------

    if (
        !guardarRegistros()
    ) {

        estado.registros =
            anteriores;

        cerrarModalBorrado();

        console.error(
            "No se pudo eliminar el registro."
        );

        return;
    }


    cerrarModalBorrado();


    actualizarTodaLaInterfaz();
}


// =========================================================
// ORDENAR REGISTROS
// =========================================================

function compararRegistrosPorFecha(
    a,
    b
) {

    const fechaA =
        fechaDesdeISO(
            a.fecha
        );

    const fechaB =
        fechaDesdeISO(
            b.fecha
        );


    const diferencia =
        fechaB.getTime() -
        fechaA.getTime();


    if (
        diferencia !== 0
    ) {

        return diferencia;
    }


    // Si son del mismo día,
    // el último creado aparece primero.

    return (
        new Date(
            b.creadoEn || 0
        ).getTime()
        -
        new Date(
            a.creadoEn || 0
        ).getTime()
    );
}


// =========================================================
// FIN BLOQUE 2
// =========================================================

// =========================================================
// BLOQUE 3
// INICIO + RESUMEN MENSUAL + OBJETIVO
// =========================================================


// =========================================================
// ACTUALIZAR INICIO
// =========================================================

function actualizarInicio() {

    actualizarNombreMes();

    actualizarCalendarioInicio();

    const registrosMes =
        obtenerRegistrosMesActual();


    // -----------------------------------------
    // Total del mes
    // -----------------------------------------

    const total =
        sumarMinutos(
            registrosMes
        );


    // -----------------------------------------
    // Ministerio
    // -----------------------------------------

    const ministerio =
        sumarMinutos(
            registrosMes.filter(
                registro => {

                    return (
                        registro.tipo ===
                        "ministerio"
                    );
                }
            )
        );


    // -----------------------------------------
    // LDC
    // -----------------------------------------

    const ldc =
        sumarMinutos(
            registrosMes.filter(
                registro => {

                    return (
                        registro.tipo ===
                        "ldc"
                    );
                }
            )
        );


    // -----------------------------------------
    // Asambleas
    // -----------------------------------------

    const asambleas =
        sumarMinutos(
            registrosMes.filter(
                registro => {

                    return (
                        registro.tipo ===
                        "asambleas"
                    );
                }
            )
        );


    // -----------------------------------------
    // Otras
    // -----------------------------------------

    const otras =
        sumarMinutos(
            registrosMes.filter(
                registro => {

                    return (
                        registro.tipo ===
                        "otras"
                    );
                }
            )
        );


    const totalVisible =
        ministerio +
        (actividadVisible("ldc") ? ldc : 0) +
        (actividadVisible("asambleas") ? asambleas : 0) +
        (actividadVisible("otras") ? otras : 0);

    // -----------------------------------------
    // Mostrar resultados
    // -----------------------------------------

    ponerTexto(
        "totalMes",
        formatearTiempo(
            totalVisible
        )
    );


    ponerTexto(
        "totalMinisterio",
        formatearTiempo(
            ministerio
        )
    );


    ponerTexto(
        "totalLDC",
        formatearTiempo(
            ldc
        )
    );


    ponerTexto(
        "totalAsambleas",
        formatearTiempo(
            asambleas
        )
    );


    ponerTexto(
        "totalOtras",
        formatearTiempo(
            otras
        )
    );


    // -----------------------------------------
    // Mostrar "Otras" solamente si hay datos
    // -----------------------------------------

    const filaOtras =
        document.getElementById(
            "filaOtras"
        );


    if (filaOtras) {

        filaOtras.classList.toggle(
            "oculto",
            !actividadVisible("otras") || otras === 0
        );
    }


    // -----------------------------------------
    // Gráfico circular del mes
    // -----------------------------------------

    actualizarGraficoInicio({
        total,
        ministerio,
        ldc,
        asambleas,
        otras
    });


    // -----------------------------------------
    // Objetivo mensual
    // -----------------------------------------

    actualizarObjetivo(
        total
    );

    actualizarFraseAnimoInicio(total);
}


// =========================================================
// FRASE DE ÁNIMO DINÁMICA EN INICIO
// =========================================================
function actualizarFraseAnimoInicio(totalMinutos, forzarNueva = false) {
    const elemento = document.getElementById("fraseAnimoInicio");
    if (!elemento) return;

    const objetivo = Number(estado.preferencias?.objetivoMensualMinutos || 0);
    const porcentaje = objetivo > 0 ? Math.max(0, (totalMinutos / objetivo) * 100) : 0;
    const ahora = new Date();
    const diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    const ritmoEsperado = (ahora.getDate() / diasMes) * 100;
    const diferencia = porcentaje - ritmoEsperado;

    let frases;
    if (objetivo > 0 && porcentaje >= 100) {
        frases = [
            "¡Objetivo conseguido! Disfruta de todo lo que has logrado. 🎉",
            "¡Meta alcanzada! Un mes lleno de buenos esfuerzos. 🏁",
            "¡Lo conseguiste! Cada pequeño paso ha contado. ✨"
        ];
    } else if (objetivo > 0 && diferencia >= 5) {
        frases = [
            "¡Muy buen ritmo! Vas por delante y cada esfuerzo suma. 🐇",
            "Vas con margen. Sigue disfrutando de cada paso. ✨",
            "¡Qué buen avance! Mantén ese ritmo sin perder la calma. 🌱"
        ];
    } else if (objetivo > 0 && diferencia <= -5) {
        frases = [
            "Poco a poco. Un buen día puede cambiar el ritmo del mes. 🐢",
            "No hace falta correr: lo importante es seguir avanzando. 🌱",
            "Cada rato cuenta. Hoy puede ser un buen día para sumar. ✨"
        ];
    } else {
        frases = [
            "Vas al ritmo del mes. Sigue así, paso a paso. 🚶",
            "Cada paso cuenta. Sigue avanzando. ✨",
            "Buen ritmo: constancia, calma y a seguir. 🌿"
        ];
    }

    // Si solo estamos refrescando datos de Inicio, mantenemos la frase actual.
    // Se fuerza una frase nueva únicamente al entrar o volver a la app.
    if (!forzarNueva && elemento.dataset.ultimaFrase) return;

    const claveUltimaFrase = "miServicio.ultimaFraseAnimoInicio";
    let ultimaFrase = "";

    try {
        ultimaFrase = localStorage.getItem(claveUltimaFrase) || "";
    } catch (error) {
        ultimaFrase = elemento.dataset.ultimaFrase || "";
    }

    const candidatas = frases.filter(frase => frase !== ultimaFrase);
    const disponibles = candidatas.length ? candidatas : frases;
    const indice = Math.floor(Math.random() * disponibles.length);
    const fraseElegida = disponibles[indice];

    elemento.textContent = fraseElegida;
    elemento.dataset.ultimaFrase = fraseElegida;

    try {
        localStorage.setItem(claveUltimaFrase, fraseElegida);
    } catch (error) {
        // Si el navegador bloquea localStorage, seguimos usando dataset.
    }
}

// =========================================================
// CAMBIAR FRASE AL VOLVER A ENTRAR EN LA APP
// =========================================================
let ultimoCambioFraseEntrada = 0;

function refrescarFraseAlVolverAInicio() {
    const ahora = Date.now();
    if (ahora - ultimoCambioFraseEntrada < 900) return;

    const vistaInicio = document.getElementById("vista-inicio");
    if (!vistaInicio || !vistaInicio.classList.contains("activa")) return;

    ultimoCambioFraseEntrada = ahora;

    const totalTexto = document.getElementById("totalMes")?.textContent || "0";
    const coincidencia = totalTexto.match(/(\d+(?:[.,]\d+)?)/);
    const horas = coincidencia ? Number(coincidencia[1].replace(",", ".")) : 0;
    actualizarFraseAnimoInicio(Math.round(horas * 60), true);
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        setTimeout(refrescarFraseAlVolverAInicio, 80);
    }
});

window.addEventListener("pageshow", () => {
    setTimeout(refrescarFraseAlVolverAInicio, 80);
});

window.addEventListener("focus", () => {
    setTimeout(refrescarFraseAlVolverAInicio, 80);
});

// =========================================================
// CALENDARIO DEL MES EN INICIO
// =========================================================

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
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();

    if (titulo) {
        titulo.textContent =
            hoy.toLocaleDateString(
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

        hueco.className =
            "calendario-dia calendario-dia-vacio";

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
        if (companeroAgendado) {
            botonDia.classList.add("con-agenda");

            const agendaDia =
                document.createElement("span");

            agendaDia.className =
                `calendario-dia-agenda ${claseActividadCalendario(tipoAgendado)}`;

            agendaDia.textContent =
                `📌 ${nombreActividad(tipoAgendado)} · ${companeroAgendado}${agendaDiaDatos.minutosPrevistos ? " · "+formatoMinutosPlan(agendaDiaDatos.minutosPrevistos) : ""}`;

            agendaDia.title =
                `${nombreActividad(tipoAgendado)} planificado con ${companeroAgendado}`;

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
        companeroAgendado
            ? `${nombreActividad(tipoAgendado)} previsto`
            : "Planificar actividad";

    const valorAgenda =
        document.createElement("strong");

    valorAgenda.textContent =
        companeroAgendado
            ? `Con: ${companeroAgendado}`
            : "Sin planificar";

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
        companeroAgendado
            ? "Cambiar"
            : "Agendar";

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

    if (companeroAgendado) {
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

    detalle.appendChild(
        bloqueAgenda
    );

    if (registrosVisibles.length === 0) {
        const vacio =
            document.createElement("p");

        vacio.className =
            "texto-secundario";

        vacio.textContent =
            "No hubo actividad registrada este día.";

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
        minutosPrevistos: Math.max(0, Number(valor.minutosPrevistos || 0) || 0)
    };
}


function formatoMinutosPlan(minutos) {
    const n=Math.max(0,Number(minutos)||0), h=Math.floor(n/60), m=n%60;
    return m ? `${h ? h+" h " : ""}${m} min` : (h ? `${h} h` : "");
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


// =========================================================
// AGENDA DE SALIDAS DEL MINISTERIO
// =========================================================

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


function guardarSalidaDesdeModal(fechaForzada = "") {
    const modal = document.getElementById("modalAgendaSalida");
    const input = document.getElementById("nombreAgendaSalida");
    const tipo = document.getElementById("tipoAgendaSalida");
    const mensaje = document.getElementById("mensajeAgendaSalida");
    const guardar = document.getElementById("guardarAgendaSalida");

    if (!modal || !input || !tipo || !guardar) return;

    const fechaISO =
        fechaForzada ||
        modal.dataset.fecha ||
        "";

    const nombre =
        input.value.trim();

    const tipoActividad =
        [
            "ministerio",
            "ldc",
            "asambleas",
            "otras"
        ].includes(tipo.value)
            ? tipo.value
            : "ministerio";

    if (!fechaISO) {
        if (mensaje) {
            mensaje.textContent =
                "No se pudo identificar el día. Cierra y vuelve a abrirlo.";
        }
        return;
    }

    if (!nombre) {
        if (mensaje) {
            mensaje.textContent =
                "Escribe con quién saldrás.";
        }
        input.focus();
        return;
    }

    if (
        !estado.agendaSalidas ||
        typeof estado.agendaSalidas !== "object"
    ) {
        estado.agendaSalidas = {};
    }

    // Guardado optimista: el botón responde inmediatamente.
    guardar.disabled = true;
    guardar.textContent = "Guardando…";

    const anterior =
        estado.agendaSalidas[fechaISO];

    estado.agendaSalidas[fechaISO] = {
        tipo: tipoActividad,
        companero: nombre,
        minutosPrevistos: Number(document.getElementById("duracionAgendaSalida")?.value || 0)
    };

    if (!guardarAgendaSalidas()) {
        if (anterior) {
            estado.agendaSalidas[fechaISO] =
                anterior;
        } else {
            delete estado.agendaSalidas[fechaISO];
        }

        guardar.disabled = false;
        guardar.textContent = "Guardar";

        if (mensaje) {
            mensaje.textContent =
                "No se pudo guardar la salida.";
        }
        return;
    }

    if (mensaje) {
        mensaje.textContent = "Guardado ✓";
        mensaje.classList.add("exito");
    }

    // Primero cerramos el modal para que la respuesta visual sea inmediata.
    cerrarModalAgendaSalida();

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


// =========================================================
// GRÁFICO CIRCULAR DEL MES
// =========================================================

function actualizarGraficoInicio({
    total,
    ministerio,
    ldc,
    asambleas,
    otras
}) {

    const grafico =
        document.getElementById(
            "graficoInicio"
        );

    const leyenda =
        document.getElementById(
            "leyendaGraficoInicio"
        );


    const fechaProgreso =
        document.getElementById(
            "fechaProgresoMes"
        );

    if (fechaProgreso) {
        const hoy = new Date();

        fechaProgreso.textContent =
            `${String(hoy.getDate()).padStart(2, "0")}/` +
            `${String(hoy.getMonth() + 1).padStart(2, "0")}/` +
            `${hoy.getFullYear()}`;
    }


    if (!grafico || !leyenda) {
        return;
    }


    const actividades = [
        {
            tipo: "ministerio",
            nombre: "Ministerio",
            minutos: ministerio,
            color: "var(--primary)",
            clase: "grafico-color-ministerio"
        },
        {
            tipo: "ldc",
            nombre: "LDC",
            minutos: ldc,
            color: "var(--ldc)",
            clase: "grafico-color-ldc"
        },
        {
            tipo: "asambleas",
            nombre: "Asambleas",
            minutos: asambleas,
            color: "var(--assembly)",
            clase: "grafico-color-asambleas"
        },
        {
            tipo: "otras",
            nombre: "Otras",
            minutos: otras,
            color: "var(--other)",
            clase: "grafico-color-otras"
        }
    ].filter(actividad => actividadVisible(actividad.tipo));


    const totalVisible = actividades.reduce(
        (suma, actividad) => suma + actividad.minutos,
        0
    );

    // Anillos concéntricos al estilo de Actividad de Apple.
    // Cada anillo representa qué parte del tiempo visible del mes
    // corresponde a esa actividad. Así no inventamos objetivos
    // individuales que el usuario no haya configurado.
    const radios = [82, 65, 48, 31];
    const centro = 100;

    const anillos = actividades
        .map((actividad, indice) => {
            const radio = radios[indice] || 31;
            const circunferencia = 2 * Math.PI * radio;
            const proporcion = totalVisible > 0
                ? actividad.minutos / totalVisible
                : 0;
            const longitud = Math.max(0, Math.min(proporcion, 1)) * circunferencia;
            const resto = Math.max(circunferencia - longitud, 0);

            return `
                <circle
                    class="anillo-pista"
                    cx="${centro}"
                    cy="${centro}"
                    r="${radio}"
                ></circle>
                <circle
                    class="anillo-actividad"
                    cx="${centro}"
                    cy="${centro}"
                    r="${radio}"
                    style="stroke: ${actividad.color}; stroke-dasharray: ${longitud.toFixed(2)} ${resto.toFixed(2)};"
                ></circle>
            `;
        })
        .join("");


    grafico.innerHTML = `
        <svg
            class="grafico-anillos-svg"
            viewBox="0 0 200 200"
            role="img"
            aria-label="Distribución del tiempo por actividad"
        >
            ${anillos}
        </svg>
        <div class="grafico-inicio-centro">
            <p class="grafico-inicio-total">
                ${formatearTiempo(totalVisible)}
            </p>
            <span class="grafico-inicio-texto">
                este mes
            </span>
        </div>
    `;


    leyenda.innerHTML =
        actividades
            .map(
                actividad => {
                    const porcentaje = totalVisible > 0
                        ? Math.round((actividad.minutos / totalVisible) * 100)
                        : 0;

                    return `
                        <div class="leyenda-grafico-fila">
                            <span class="leyenda-grafico-nombre">
                                <span
                                    class="leyenda-grafico-punto ${actividad.clase}"
                                ></span>
                                ${actividad.nombre}
                            </span>
                            <span class="leyenda-grafico-datos">
                                <strong class="leyenda-grafico-tiempo">
                                    ${formatearTiempo(actividad.minutos)}
                                </strong>
                                <small class="leyenda-grafico-porcentaje">
                                    ${porcentaje}%
                                </small>
                            </span>
                        </div>
                    `;
                }
            )
            .join("");
}


// =========================================================
// NOMBRE DEL MES ACTUAL
// =========================================================

function actualizarNombreMes() {

    const hoy =
        new Date();


    const texto =
        new Intl.DateTimeFormat(
            "es-ES",
            {
                month: "long",
                year: "numeric"
            }
        ).format(
            hoy
        );


    ponerTexto(
        "nombreMes",
        capitalizar(
            texto
        )
    );
}


// =========================================================
// OBTENER REGISTROS DEL MES ACTUAL
// =========================================================

function obtenerRegistrosMesActual() {

    const hoy =
        new Date();


    return estado.registros.filter(
        registro => {

            const fecha =
                fechaDesdeISO(
                    registro.fecha
                );


            return (
                fecha.getFullYear() ===
                    hoy.getFullYear()
                &&
                fecha.getMonth() ===
                    hoy.getMonth()
            );
        }
    );
}


// =========================================================
// OBJETIVO MENSUAL
// =========================================================
//
// IMPORTANTE:
// Para el objetivo mensual computa TODO el tiempo
// registrado: Ministerio, LDC, Asambleas y Otras.
// =========================================================

function actualizarObjetivo(
    totalComputableMes
) {

    const objetivo =
        Math.max(
            Number(
                estado.preferencias
                    .objetivoMensualMinutos
            ) || 0,
            0
        );


    // -----------------------------------------
    // Porcentaje
    // -----------------------------------------

    const porcentaje =
        objetivo > 0
            ? Math.round(
                (
                    totalComputableMes /
                    objetivo
                ) * 100
            )
            : 0;


    // -----------------------------------------
    // Valor registrado
    // -----------------------------------------

    ponerTexto(
        "valorObjetivo",
        formatearTiempo(
            totalComputableMes
        )
    );


    // -----------------------------------------
    // Porcentaje
    // -----------------------------------------

    ponerTexto(
        "porcentajeObjetivo",
        `${porcentaje}%`
    );


    // -----------------------------------------
    // Barra de progreso
    // -----------------------------------------

    const barra =
        document.getElementById(
            "barraProgreso"
        );


    if (barra) {

        const porcentajeVisual =
            Math.min(
                Math.max(
                    porcentaje,
                    0
                ),
                100
            );


        barra.style.width =
            `${porcentajeVisual}%`;

        // Mantener sincronizado también el personaje
        // con el mismo porcentaje del progreso mensual.
        actualizarPersonajeProgreso(
            porcentajeVisual
        );
    } else {
        actualizarPersonajeProgreso(
            Math.min(
                Math.max(porcentaje, 0),
                100
            )
        );
    }


    // -----------------------------------------
    // Mensaje
    // -----------------------------------------

    const mensaje =
        document.getElementById(
            "mensajeObjetivo"
        );


    if (!mensaje) {
        return;
    }


    // -----------------------------------------
    // Sin objetivo configurado
    // -----------------------------------------

    if (objetivo <= 0) {

        mensaje.textContent =
            totalComputableMes > 0
                ? "Configura un objetivo mensual en Ajustes."
                : "Empieza registrando tu primera actividad de ministerio.";

        return;
    }


    // -----------------------------------------
    // Objetivo alcanzado
    // -----------------------------------------

    if (
        totalComputableMes >=
        objetivo
    ) {

        const superado =
            totalComputableMes -
            objetivo;


        if (superado > 0) {

            mensaje.textContent =
                `Objetivo alcanzado. Lo superas por ${formatearTiempo(superado)}.`;

        } else {

            mensaje.textContent =
                "Has alcanzado tu objetivo mensual.";
        }


        return;
    }


    // -----------------------------------------
    // Objetivo pendiente
    // -----------------------------------------

    const restante =
        objetivo -
        totalComputableMes;


    mensaje.textContent =
        `Te faltan ${formatearTiempo(restante)} para alcanzar tu objetivo.`;
}


// =========================================================
// PERSONAJE DEL PROGRESO MENSUAL
// =========================================================

function actualizarPersonajeProgreso(porcentaje) {

    const contenedor =
        document.getElementById(
            "progresoPersonaje"
        );

    const personaje =
        document.getElementById(
            "animalProgreso"
        );

    const estadoPersonaje =
        document.getElementById(
            "estadoAnimal"
        );

    if (!contenedor || !personaje) {
        return;
    }

    const progreso =
        Math.min(
            Math.max(
                Number(porcentaje) || 0,
                0
            ),
            100
        );

    const personajeElegido =
        estado.preferencias?.personajeProgreso || "hombre";

    const iconosPersonaje = {
        hombre: { normal: "🚶‍♂️", rapido: "🏃‍♂️", meta: "🕺" },
        mujer: { normal: "🚶‍♀️", rapido: "🏃‍♀️", meta: "💃" },
        koala: { normal: "🐨", rapido: "🐨", meta: "🐨✨" },
        mariposa: { normal: "🦋", rapido: "🦋", meta: "🦋✨" },
        pantera: { normal: "🐈", rapido: "🐈", meta: "🐈✨" },
        tortuga: { normal: "🐢", rapido: "🐢", meta: "🐢✨" },
        liebre: { normal: "🐇", rapido: "🐇", meta: "🐇✨" }
    };
    const setIconos = iconosPersonaje[personajeElegido] || iconosPersonaje.hombre;
    // El ritmo se compara con el día actual del mes.
    const hoy = new Date();
    const diasDelMes =
        new Date(
            hoy.getFullYear(),
            hoy.getMonth() + 1,
            0
        ).getDate();

    const ritmoEsperado =
        (hoy.getDate() / diasDelMes) * 100;

    const diferenciaRitmo =
        progreso - ritmoEsperado;

    const margenRitmo = 5;

    let estadoRitmo = "en-ritmo";
    let icono = setIconos.normal;
    let aria = "Vas al ritmo del mes";

    if (progreso >= 100) {

        estadoRitmo = "completado";
        icono = setIconos.meta;
        aria = "Objetivo conseguido";

    } else if (diferenciaRitmo >= margenRitmo) {

        estadoRitmo = "adelantado";
        icono = setIconos.rapido;
        aria = "Vas por delante del ritmo del mes";

    } else if (diferenciaRitmo <= -margenRitmo) {

        estadoRitmo = "atrasado";
        icono = setIconos.normal;
        aria = "Vas por detrás del ritmo del mes";
    }

    if (personajeElegido === "pantera") {
        personaje.innerHTML = '<img class="pantera-personaje-img" src="data:image/jpeg;base64,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" alt="Pantera rosa">';
    } else {
        personaje.textContent = icono;
    }
    personaje.dataset.personaje = personajeElegido;
    personaje.setAttribute(
        "aria-label",
        aria
    );

    personaje.classList.remove(
        "estado-atrasado",
        "estado-en-ritmo",
        "estado-adelantado",
        "estado-completado",
        "moviendo"
    );

    personaje.classList.add(
        `estado-${estadoRitmo}`
    );

    contenedor.classList.remove(
        "ritmo-atrasado",
        "ritmo-en-ritmo",
        "ritmo-adelantado",
        "ritmo-completado"
    );
    contenedor.classList.add(`ritmo-${estadoRitmo}`);

    // Medimos el personaje real después de cambiar los emojis.
    // Así nunca se sale de la pista aunque tenga dos o tres símbolos.
    const anchoPersonaje =
        Math.max(
            personaje.offsetWidth || 0,
            window.matchMedia("(max-width: 430px)").matches
                ? 54
                : 62
        );

    const correccionPx =
        (progreso / 100) * anchoPersonaje;

    personaje.style.left =
        `calc(${progreso}% - ${correccionPx}px)`;

    const desplazamientoVertical =
        estadoRitmo === "adelantado"
            ? (progreso / 100) * 22
            : estadoRitmo === "atrasado"
                ? -(progreso / 100) * 22
                : 0;

    personaje.style.setProperty(
        "--desplazamiento-ritmo",
        `${desplazamientoVertical}px`
    );

    personaje.style.marginLeft = "0";
    personaje.style.transform = "";

    // Reiniciar la animación cada vez que se actualiza el progreso.
    void personaje.offsetWidth;

    if (progreso > 0) {
        personaje.classList.add(
            "moviendo"
        );
    }

    contenedor.classList.toggle(
        "completado",
        progreso >= 100
    );

    if (estadoPersonaje) {

        if (estadoRitmo === "completado") {

            estadoPersonaje.textContent =
                "¡Meta conseguida! 🎉";

        } else if (estadoRitmo === "adelantado") {

            estadoPersonaje.textContent =
                "¡Vas lanzado! 🐇💨 Vas por delante del ritmo 😄";

        } else if (estadoRitmo === "atrasado") {

            estadoPersonaje.textContent =
                "Paso a paso 🐢. Aún puedes recuperar el ritmo.";

        } else {

            estadoPersonaje.textContent =
                "¡Buen ritmo! Sigue así ✨";
        }
    }

    actualizarHitosProgreso(progreso);

}


function actualizarHitosProgreso(progreso) {
    const contenedor = document.getElementById("hitosProgresoMes");
    const celebracion = document.getElementById("celebracionProgreso");
    if (!contenedor) return;

    const valor = Math.max(0, Math.min(100, Number(progreso) || 0));
    const hitos = Array.from(contenedor.querySelectorAll(".hito-mes"));

    hitos.forEach(hito => {
        const limite = Number(hito.dataset.hito) || 0;
        hito.classList.toggle("alcanzado", valor >= limite);
        const pendientes = hitos
            .map(x => Number(x.dataset.hito) || 0)
            .filter(x => x > valor);
        const siguiente = pendientes.length ? Math.min(...pendientes) : -1;
        hito.classList.toggle("siguiente", limite === siguiente);
    });

    if (!celebracion) return;

    let nivel = 0;
    if (valor >= 100) nivel = 100;
    else if (valor >= 75) nivel = 75;
    else if (valor >= 50) nivel = 50;
    else if (valor >= 25) nivel = 25;

    if (nivel > 0 && celebracion.dataset.ultimoNivel !== String(nivel)) {
        celebracion.dataset.ultimoNivel = String(nivel);
        celebracion.innerHTML =
            nivel >= 100
                ? "<span>🎉</span><span>🏆</span><span>✨</span><span>🎊</span><span>⭐</span>"
                : "<span>✨</span><span>⭐</span><span>✨</span>";
        celebracion.classList.remove("activo");
        void celebracion.offsetWidth;
        celebracion.classList.add("activo");
        setTimeout(() => celebracion.classList.remove("activo"), nivel >= 100 ? 2200 : 1200);
    }
}


// =========================================================
// FIN BLOQUE 3
// =========================================================

// =========================================================
// BLOQUE 4
// ESTADÍSTICAS + PERIODOS + GRÁFICOS + TRIMESTRES
// =========================================================


// =========================================================
// CONFIGURAR ESTADÍSTICAS
// =========================================================

function configurarEstadisticas() {

    document
        .querySelectorAll(".periodo-boton")
        .forEach(boton => {

            boton.addEventListener(
                "click",
                () => {

                    const periodo =
                        boton.dataset.periodo;

                    seleccionarPeriodoEstadisticas(
                        periodo
                    );
                }
            );
        });


    const anterior =
        document.getElementById(
            "periodoAnterior"
        );


    const siguiente =
        document.getElementById(
            "periodoSiguiente"
        );


    if (anterior) {

        anterior.addEventListener(
            "click",
            () => {

                moverPeriodoEstadisticas(
                    -1
                );
            }
        );
    }


    if (siguiente) {

        siguiente.addEventListener(
            "click",
            () => {

                moverPeriodoEstadisticas(
                    1
                );
            }
        );
    }
}


// =========================================================
// SELECCIONAR SEMANA / MES / AÑO
// =========================================================

function seleccionarPeriodoEstadisticas(
    periodo
) {

    const periodosValidos = [
        "semana",
        "mes",
        "anio"
    ];


    if (
        !periodosValidos.includes(
            periodo
        )
    ) {
        return;
    }


    estado.estadisticas.periodo =
        periodo;


    // Al cambiar de Semana/Mes/Año
    // volvemos al periodo actual.

    estado.estadisticas.fechaReferencia =
        new Date();


    document
        .querySelectorAll(".periodo-boton")
        .forEach(boton => {

            boton.classList.toggle(
                "activo",
                boton.dataset.periodo ===
                    periodo
            );
        });


    actualizarEstadisticas();
}


// =========================================================
// MOVER PERIODO
// =========================================================

function moverPeriodoEstadisticas(
    direccion
) {

    const fecha =
        copiarFecha(
            estado.estadisticas
                .fechaReferencia
        );


    switch (
        estado.estadisticas.periodo
    ) {

        case "semana":

            fecha.setDate(
                fecha.getDate() +
                direccion * 7
            );

            break;


        case "mes":

            fecha.setDate(1);

            fecha.setMonth(
                fecha.getMonth() +
                direccion
            );

            break;


        case "anio": {

            const rangoActual =
                rangoAnio(
                    fecha
                );

            fecha.setTime(
                rangoActual.inicio.getTime()
            );

            fecha.setFullYear(
                fecha.getFullYear() +
                direccion
            );

            break;
        }
    }


    estado.estadisticas.fechaReferencia =
        fecha;


    actualizarEstadisticas();
}


// =========================================================
// ACTUALIZAR ESTADÍSTICAS
// =========================================================

function actualizarEstadisticas() {

    const rango =
        obtenerRangoEstadisticas();


    const registros =
        obtenerRegistrosEntreFechas(
            rango.inicio,
            rango.fin
        ).filter(
            registro => actividadVisible(registro.tipo)
        );


    const total =
        sumarMinutos(
            registros
        );


    const ministerio =
        sumarMinutos(
            registros.filter(
                registro =>
                    registro.tipo ===
                    "ministerio"
            )
        );


    const ldc =
        sumarMinutos(
            registros.filter(
                registro =>
                    registro.tipo ===
                    "ldc"
            )
        );


    const asambleas =
        sumarMinutos(
            registros.filter(
                registro =>
                    registro.tipo ===
                    "asambleas"
            )
        );


    const otras =
        sumarMinutos(
            registros.filter(
                registro =>
                    registro.tipo ===
                    "otras"
            )
        );


    // -----------------------------------------------------
    // Totales
    // -----------------------------------------------------

    ponerTexto(
        "estadisticasTotal",
        formatearTiempo(
            total
        )
    );


    ponerTexto(
        "estadisticasMinisterio",
        formatearTiempo(
            ministerio
        )
    );


    ponerTexto(
        "estadisticasLDC",
        formatearTiempo(
            ldc
        )
    );


    ponerTexto(
        "estadisticasAsambleas",
        formatearTiempo(
            asambleas
        )
    );


    ponerTexto(
        "estadisticasOtras",
        formatearTiempo(
            otras
        )
    );


    // -----------------------------------------------------
    // Barras de actividad · v13
    // -----------------------------------------------------

    actualizarBarrasActividadEstadisticas({
        ministerio,
        ldc,
        asambleas,
        otras
    });


    // -----------------------------------------------------
    // Resumen
    // -----------------------------------------------------

    ponerTexto(
        "estadisticasRegistros",
        String(
            registros.length
        )
    );


    ponerTexto(
        "estadisticasDiasActivos",
        String(
            contarDiasActivos(
                registros
            )
        )
    );


    // -----------------------------------------------------
    // Periodo
    // -----------------------------------------------------

    actualizarTextoPeriodoEstadisticas(
        rango
    );


    // -----------------------------------------------------
    // Gráfico
    // -----------------------------------------------------

    actualizarGraficoEstadisticas(
        rango
    );


    // -----------------------------------------------------
    // Trimestres
    // Solo aparecen cuando estamos viendo AÑO
    // -----------------------------------------------------

    actualizarTrimestres(
        rango
    );


    // -----------------------------------------------------
    // Estado vacío
    // -----------------------------------------------------

    const vacio =
        document.getElementById(
            "estadisticasVacias"
        );


    if (vacio) {

        vacio.classList.toggle(
            "oculto",
            registros.length !== 0
        );
    }
}


// =========================================================
// BARRAS DE ACTIVIDAD DE ESTADÍSTICAS
// =========================================================

function actualizarBarrasActividadEstadisticas(valores) {

    const configuracion = [
        ["ministerio", "Ministerio"],
        ["ldc", "LDC"],
        ["asambleas", "Asambleas"],
        ["otras", "Otras"]
    ];

    const totalVisible = configuracion.reduce(
        (suma, [tipo]) =>
            suma + (actividadVisible(tipo) ? (valores[tipo] || 0) : 0),
        0
    );

    configuracion.forEach(([tipo, sufijo]) => {
        const item = document.querySelector(
            `[data-estadistica-tipo="${tipo}"]`
        );
        if (item) {
            item.classList.toggle("oculto", !actividadVisible(tipo));
        }

        const minutos = valores[tipo] || 0;
        const porcentaje = totalVisible > 0
            ? Math.round((minutos / totalVisible) * 100)
            : 0;

        ponerTexto(`porcentaje${sufijo}`, `${porcentaje} %`);

        const barra = document.getElementById(`barra${sufijo}`);
        if (barra) {
            // Reinicio breve para que la animación se perciba al cambiar de periodo.
            barra.style.width = "0%";
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    barra.style.width = `${porcentaje}%`;
                });
            });
        }
    });
}


// =========================================================
// OBTENER RANGO ACTUAL
// =========================================================

function obtenerRangoEstadisticas() {

    const referencia =
        copiarFecha(
            estado.estadisticas
                .fechaReferencia
        );


    switch (
        estado.estadisticas.periodo
    ) {

        case "mes":

            return rangoMes(
                referencia
            );


        case "anio":

            return rangoAnio(
                referencia
            );


        case "semana":

        default:

            return rangoSemana(
                referencia
            );
    }
}


// =========================================================
// RANGO SEMANAL
// LUNES → DOMINGO
// =========================================================

function rangoSemana(
    fecha
) {

    const inicio =
        copiarFecha(
            fecha
        );


    const diaSemana =
        inicio.getDay();


    const desplazamiento =
        diaSemana === 0
            ? -6
            : 1 - diaSemana;


    inicio.setDate(
        inicio.getDate() +
        desplazamiento
    );


    inicio.setHours(
        0,
        0,
        0,
        0
    );


    const fin =
        copiarFecha(
            inicio
        );


    fin.setDate(
        fin.getDate() + 6
    );


    fin.setHours(
        23,
        59,
        59,
        999
    );


    return {
        inicio,
        fin
    };
}


// =========================================================
// RANGO MENSUAL
// =========================================================

function rangoMes(
    fecha
) {

    const anio =
        fecha.getFullYear();


    const mes =
        fecha.getMonth();


    return {

        inicio:
            new Date(
                anio,
                mes,
                1,
                0,
                0,
                0,
                0
            ),


        fin:
            new Date(
                anio,
                mes + 1,
                0,
                23,
                59,
                59,
                999
            )
    };
}


// =========================================================
// RANGO ANUAL
// =========================================================

function rangoAnio(
    fecha
) {

    const anioNatural =
        fecha.getFullYear();

    const mes =
        fecha.getMonth();


    // El año de servicio comienza el 1 de septiembre
    // y termina el 31 de agosto del año siguiente.
    // Ejemplo: septiembre de 2026 pertenece al
    // año de servicio 2027.

    const anioInicio =
        mes >= 8
            ? anioNatural
            : anioNatural - 1;


    return {

        inicio:
            new Date(
                anioInicio,
                8,
                1,
                0,
                0,
                0,
                0
            ),


        fin:
            new Date(
                anioInicio + 1,
                7,
                31,
                23,
                59,
                59,
                999
            )
    };
}

// =========================================================
// REGISTROS ENTRE DOS FECHAS
// =========================================================

function obtenerRegistrosEntreFechas(
    inicio,
    fin
) {

    return estado.registros.filter(
        registro => {

            const fecha =
                fechaDesdeISO(
                    registro.fecha
                );


            return (
                fecha >= inicio &&
                fecha <= fin
            );
        }
    );
}


// =========================================================
// DÍAS ACTIVOS
// =========================================================

function contarDiasActivos(
    registros
) {

    return new Set(
        registros.map(
            registro =>
                registro.fecha
        )
    ).size;
}


// =========================================================
// TEXTO DEL PERIODO
// =========================================================

function actualizarTextoPeriodoEstadisticas(
    rango
) {

    const periodo =
        estado.estadisticas.periodo;


    let titulo = "";
    let textoRango = "";


    // -----------------------------------------------------
    // SEMANA
    // -----------------------------------------------------

    if (
        periodo === "semana"
    ) {

        titulo =
            esSemanaActual(
                rango.inicio,
                rango.fin
            )
                ? "Esta semana"
                : "Semana";


        textoRango =
            formatearRangoSemana(
                rango.inicio,
                rango.fin
            );
    }


    // -----------------------------------------------------
    // MES
    // -----------------------------------------------------

    if (
        periodo === "mes"
    ) {

        const nombreMes =
            capitalizar(
                new Intl.DateTimeFormat(
                    "es-ES",
                    {
                        month: "long"
                    }
                ).format(
                    rango.inicio
                )
            );


        titulo =
            esMesActual(
                rango.inicio
            )
                ? "Este mes"
                : nombreMes;


        textoRango =
            capitalizar(
                new Intl.DateTimeFormat(
                    "es-ES",
                    {
                        month: "long",
                        year: "numeric"
                    }
                ).format(
                    rango.inicio
                )
            );
    }


    // -----------------------------------------------------
    // AÑO
    // -----------------------------------------------------

    if (
        periodo === "anio"
    ) {

        const anioServicio =
            rango.fin
                .getFullYear();


        titulo =
            esAnioActual(
                rango.inicio
            )
                ? "Este año de servicio"
                : "Año de servicio";


        textoRango =
            `${anioServicio} · ` +
            `sep ${rango.inicio.getFullYear()} – ` +
            `ago ${anioServicio}`;
    }


    ponerTexto(
        "tituloPeriodoEstadisticas",
        titulo
    );


    ponerTexto(
        "rangoPeriodoEstadisticas",
        textoRango
    );
}


// =========================================================
// FORMATEAR RANGO SEMANAL
// =========================================================

function formatearRangoSemana(
    inicio,
    fin
) {

    const mismoMes =
        inicio.getMonth() ===
            fin.getMonth()
        &&
        inicio.getFullYear() ===
            fin.getFullYear();


    if (mismoMes) {

        const mes =
            new Intl.DateTimeFormat(
                "es-ES",
                {
                    month: "long"
                }
            ).format(
                inicio
            );


        return (
            `${inicio.getDate()}–` +
            `${fin.getDate()} de ` +
            `${mes} de ` +
            `${fin.getFullYear()}`
        );
    }


    const formato =
        new Intl.DateTimeFormat(
            "es-ES",
            {
                day: "numeric",
                month: "short"
            }
        );


    return (
        `${formato.format(inicio)} – ` +
        `${formato.format(fin)} ` +
        `de ${fin.getFullYear()}`
    );
}


// =========================================================
// ¿ES EL PERIODO ACTUAL?
// =========================================================

function esSemanaActual(
    inicio,
    fin
) {

    const hoy =
        new Date();


    return (
        hoy >= inicio &&
        hoy <= fin
    );
}


function esMesActual(
    fecha
) {

    const hoy =
        new Date();


    return (
        hoy.getFullYear() ===
            fecha.getFullYear()
        &&
        hoy.getMonth() ===
            fecha.getMonth()
    );
}


function esAnioActual(
    fechaInicio
) {

    const actual =
        rangoAnio(
            new Date()
        );


    return (
        actual.inicio.getFullYear() ===
            fechaInicio.getFullYear()
        &&
        actual.inicio.getMonth() ===
            fechaInicio.getMonth()
    );
}


// =========================================================
// ACTUALIZAR GRÁFICO
// =========================================================

function actualizarGraficoEstadisticas(
    rango
) {

    const grafico =
        document.getElementById(
            "graficoActividad"
        );


    const vacio =
        document.getElementById(
            "graficoVacio"
        );


    if (!grafico) {
        return;
    }


    let datos = [];


    switch (
        estado.estadisticas.periodo
    ) {

        case "semana":

            datos =
                obtenerDatosGraficoSemana(
                    rango.inicio
                );


            ponerTexto(
                "graficoPeriodoTexto",
                "Semana"
            );

            break;


        case "mes":

            datos =
                obtenerDatosGraficoMes(
                    rango.inicio,
                    rango.fin
                );


            ponerTexto(
                "graficoPeriodoTexto",
                "Mes"
            );

            break;


        case "anio":

            datos =
                obtenerDatosGraficoAnio(
                    rango.inicio
                );


            ponerTexto(
                "graficoPeriodoTexto",
                "Año"
            );

            break;
    }


    grafico.innerHTML = "";


    const tieneActividad =
        datos.some(
            dato =>
                dato.minutos > 0
        );


    if (vacio) {

        vacio.classList.toggle(
            "oculto",
            tieneActividad
        );
    }


    grafico.classList.toggle(
        "oculto",
        !tieneActividad
    );


    if (!tieneActividad) {
        return;
    }


    renderizarColumnasGrafico(
        grafico,
        datos
    );
}


// =========================================================
// DATOS GRÁFICO SEMANAL
// =========================================================

function obtenerDatosGraficoSemana(
    inicioSemana
) {

    const nombres = [
        "L",
        "M",
        "X",
        "J",
        "V",
        "S",
        "D"
    ];


    const hoy =
        fechaLocalISO(
            new Date()
        );


    const datos = [];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const fecha =
            copiarFecha(
                inicioSemana
            );


        fecha.setDate(
            fecha.getDate() + i
        );


        const fechaISO =
            fechaLocalISO(
                fecha
            );


        const registros =
            estado.registros.filter(
                registro =>
                    registro.fecha ===
                    fechaISO
            );


        datos.push({

            nombre:
                nombres[i],

            minutos:
                sumarMinutos(
                    registros
                ),

            destacado:
                fechaISO === hoy
        });
    }


    return datos;
}


// =========================================================
// DATOS GRÁFICO MENSUAL
//
// S1 = 1–7
// S2 = 8–14
// S3 = 15–21
// S4 = 22–28
// S5 = 29–fin
// =========================================================

function obtenerDatosGraficoMes(
    inicioMes,
    finMes
) {

    const datos = [];


    const ultimoDia =
        finMes.getDate();


    const hoy =
        new Date();


    let numeroSemana = 1;


    for (
        let inicioDia = 1;
        inicioDia <= ultimoDia;
        inicioDia += 7
    ) {

        const finDia =
            Math.min(
                inicioDia + 6,
                ultimoDia
            );


        const inicio =
            new Date(
                inicioMes.getFullYear(),
                inicioMes.getMonth(),
                inicioDia,
                0,
                0,
                0,
                0
            );


        const fin =
            new Date(
                inicioMes.getFullYear(),
                inicioMes.getMonth(),
                finDia,
                23,
                59,
                59,
                999
            );


        const registros =
            obtenerRegistrosEntreFechas(
                inicio,
                fin
            );


        const destacado =
            hoy.getFullYear() ===
                inicioMes.getFullYear()
            &&
            hoy.getMonth() ===
                inicioMes.getMonth()
            &&
            hoy.getDate() >=
                inicioDia
            &&
            hoy.getDate() <=
                finDia;


        datos.push({

            nombre:
                `S${numeroSemana}`,

            minutos:
                sumarMinutos(
                    registros
                ),

            destacado
        });


        numeroSemana++;
    }


    return datos;
}


// =========================================================
// DATOS GRÁFICO ANUAL
// =========================================================

function obtenerDatosGraficoAnio(
    inicioAnio
) {

    const nombres = [
        "S",
        "O",
        "N",
        "D",
        "E",
        "F",
        "M",
        "A",
        "M",
        "J",
        "J",
        "A"
    ];


    const hoy =
        new Date();


    const datos = [];


    for (
        let indice = 0;
        indice < 12;
        indice++
    ) {

        const inicio =
            new Date(
                inicioAnio.getFullYear(),
                inicioAnio.getMonth() + indice,
                1,
                0,
                0,
                0,
                0
            );


        const fin =
            new Date(
                inicio.getFullYear(),
                inicio.getMonth() + 1,
                0,
                23,
                59,
                59,
                999
            );


        const registros =
            obtenerRegistrosEntreFechas(
                inicio,
                fin
            );


        datos.push({

            nombre:
                nombres[indice],

            minutos:
                sumarMinutos(
                    registros
                ),

            destacado:
                hoy.getFullYear() ===
                    inicio.getFullYear()
                &&
                hoy.getMonth() ===
                    inicio.getMonth()
        });
    }


    return datos;
}

// =========================================================
// RENDERIZAR COLUMNAS DEL GRÁFICO
// =========================================================

function renderizarColumnasGrafico(
    grafico,
    datos
) {

    grafico.innerHTML = "";


    const maximo =
        Math.max(
            ...datos.map(
                dato =>
                    dato.minutos
            ),
            1
        );


    datos.forEach(
        dato => {

            const columna =
                document.createElement(
                    "div"
                );


            columna.className =
                "grafico-dia";


            if (
                dato.destacado
            ) {

                columna.classList.add(
                    "hoy"
                );
            }


            if (
                dato.minutos === 0
            ) {

                columna.classList.add(
                    "sin-actividad"
                );
            }


            // ---------------------------------------------
            // Tiempo
            // ---------------------------------------------

            const tiempo =
                document.createElement(
                    "div"
                );


            tiempo.className =
                "grafico-tiempo";


            tiempo.textContent =
                dato.minutos > 0
                    ? formatearTiempoGrafico(
                        dato.minutos
                    )
                    : "";


            // ---------------------------------------------
            // Contenedor
            // ---------------------------------------------

            const contenedor =
                document.createElement(
                    "div"
                );


            contenedor.className =
                "grafico-barra-contenedor";


            // ---------------------------------------------
            // Barra
            // ---------------------------------------------

            const barra =
                document.createElement(
                    "div"
                );


            barra.className =
                "grafico-barra";


            const porcentaje =
                dato.minutos > 0
                    ? (
                        dato.minutos /
                        maximo
                    ) * 100
                    : 0;


            barra.style.height =
                `${porcentaje}%`;


            contenedor.appendChild(
                barra
            );


            // ---------------------------------------------
            // Nombre
            // ---------------------------------------------

            const nombre =
                document.createElement(
                    "div"
                );


            nombre.className =
                "grafico-dia-nombre";


            nombre.textContent =
                dato.nombre;


            columna.append(
                tiempo,
                contenedor,
                nombre
            );


            grafico.appendChild(
                columna
            );
        }
    );
}


// =========================================================
// FORMATO COMPACTO PARA GRÁFICO
// =========================================================

function formatearTiempoGrafico(
    totalMinutos
) {

    const total =
        Math.max(
            Math.round(
                Number(
                    totalMinutos
                ) || 0
            ),
            0
        );


    const horas =
        Math.floor(
            total / 60
        );


    const minutos =
        total % 60;


    if (
        horas === 0
    ) {

        return `${minutos}m`;
    }


    if (
        minutos === 0
    ) {

        return `${horas}h`;
    }


    return (
        `${horas}h${minutos}`
    );
}


// =========================================================
// TRIMESTRES
// =========================================================

function actualizarTrimestres(
    rangoAnual
) {

    const seccion =
        document.getElementById(
            "seccionTrimestres"
        );

    const lista =
        document.getElementById(
            "listaTrimestres"
        );


    if (!seccion || !lista) {
        return;
    }


    const esAnio =
        estado.estadisticas.periodo ===
        "anio";


    seccion.classList.toggle(
        "oculto",
        !esAnio
    );


    if (!esAnio) {
        return;
    }


    const anioServicio =
        rangoAnual.fin
            .getFullYear();


    ponerTexto(
        "anioTrimestres",
        `Año de servicio ${anioServicio}`
    );


    lista.innerHTML = "";


    for (
        let trimestre = 1;
        trimestre <= 4;
        trimestre++
    ) {

        lista.appendChild(
            crearTarjetaTrimestre(
                trimestre,
                rangoAnual.inicio
            )
        );
    }
}


// =========================================================
// CREAR TARJETA DE TRIMESTRE
// =========================================================

function crearTarjetaTrimestre(
    numero,
    inicioAnioServicio
) {

    const inicio =
        new Date(
            inicioAnioServicio.getFullYear(),
            inicioAnioServicio.getMonth() +
                (numero - 1) * 3,
            1,
            0,
            0,
            0,
            0
        );

    const fin =
        new Date(
            inicio.getFullYear(),
            inicio.getMonth() + 3,
            0,
            23,
            59,
            59,
            999
        );


    const registros =
        obtenerRegistrosEntreFechas(
            inicio,
            fin
        );


    const ministerio =
        sumarMinutos(
            registros.filter(
                registro =>
                    registro.tipo ===
                    "ministerio"
            )
        );


    const otrasActividades =
        sumarMinutos(
            registros.filter(
                registro =>
                    registro.tipo !==
                    "ministerio"
            )
        );


    const total =
        ministerio +
        otrasActividades;


    const tarjeta =
        document.createElement(
            "article"
        );

    tarjeta.className =
        "tarjeta trimestre-card";


    const formatoMes =
        new Intl.DateTimeFormat(
            "es-ES",
            {
                month: "short",
                year: "numeric"
            }
        );


    tarjeta.innerHTML = `
        <div class="trimestre-cabecera">
            <div>
                <h3 class="trimestre-titulo">
                    ${numero}.º trimestre
                </h3>
                <p class="trimestre-fechas">
                    ${capitalizar(formatoMes.format(inicio))}
                    –
                    ${capitalizar(formatoMes.format(fin))}
                </p>
            </div>
            <strong class="trimestre-total">
                ${formatearTiempo(total)}
            </strong>
        </div>
        <div class="separador"></div>
        <div class="fila-dato">
            <span>Ministerio</span>
            <strong>${formatearTiempo(ministerio)}</strong>
        </div>
        <div class="fila-dato">
            <span>Otras actividades</span>
            <strong>${formatearTiempo(otrasActividades)}</strong>
        </div>
    `;


    return tarjeta;
}


// =========================================================
// FIN BLOQUE 4
// =========================================================

// =========================================================
// RECORDATORIO MENSUAL DE COPIA DE SEGURIDAD
// =========================================================

function configurarRecordatorioCopiaSeguridad() {

    const boton =
        document.getElementById(
            "hacerCopiaDesdeInicio"
        );

    if (boton) {

        boton.addEventListener(
            "click",
            exportarCopiaSeguridad
        );
    }
}


function leerUltimaCopiaSeguridad() {

    try {

        const valor =
            localStorage.getItem(
                STORAGE_KEYS.ultimaCopiaSeguridad
            );

        if (!valor) {
            return null;
        }

        const fecha = new Date(valor);

        return Number.isNaN(fecha.getTime())
            ? null
            : fecha;

    } catch (error) {

        console.error(
            "No se pudo leer la fecha de la última copia:",
            error
        );

        return null;
    }
}


function guardarUltimaCopiaSeguridad(fecha = new Date()) {

    try {

        localStorage.setItem(
            STORAGE_KEYS.ultimaCopiaSeguridad,
            fecha.toISOString()
        );

        return true;

    } catch (error) {

        console.error(
            "No se pudo guardar la fecha de la última copia:",
            error
        );

        return false;
    }
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


function formatearFechaCopia(fecha) {

    return new Intl.DateTimeFormat(
        "es-ES",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(fecha);
}


function actualizarRecordatorioCopiaSeguridad() {

    const aviso =
        document.getElementById(
            "recordatorioCopiaInicio"
        );

    const textoAviso =
        document.getElementById(
            "textoRecordatorioCopia"
        );

    const ultimaCopiaAjustes =
        document.getElementById(
            "ultimaCopiaAjustes"
        );

    const ultimaCopia =
        leerUltimaCopiaSeguridad();

    if (ultimaCopiaAjustes) {

        ultimaCopiaAjustes.textContent =
            ultimaCopia
                ? `Última copia: ${formatearFechaCopia(ultimaCopia)}`
                : "Todavía no hay una copia registrada";
    }

    if (!aviso) {
        return;
    }

    const hoy = new Date();

    const tocaHacerCopia =
        !ultimaCopia ||
        hoy >= sumarUnMesCalendario(ultimaCopia);

    aviso.classList.toggle(
        "oculto",
        !tocaHacerCopia
    );

    if (!tocaHacerCopia || !textoAviso) {
        return;
    }

    if (!ultimaCopia) {

        textoAviso.textContent =
            "Haz una copia ahora. Después te lo recordaremos una vez al mes.";

        return;
    }

    textoAviso.textContent =
        `La última copia fue el ${formatearFechaCopia(ultimaCopia)}.`;
}


// =========================================================
// BLOQUE 5
// AJUSTES + COPIAS DE SEGURIDAD
// =========================================================


// =========================================================
// CONFIGURAR AJUSTES
// =========================================================

function configurarAjustes() {

    const botonGuardar =
        document.getElementById(
            "guardarAjustes"
        );

    if (botonGuardar) {

        botonGuardar.addEventListener(
            "click",
            guardarAjustesDesdeFormulario
        );
    }


    const tipo =
        document.getElementById(
            "tipoPublicador"
        );

    if (tipo) {

        tipo.addEventListener(
            "change",
            aplicarObjetivoSugerido
        );
    }


    // -----------------------------------------------------
    // COPIAS DE SEGURIDAD
    // -----------------------------------------------------

    const botonExportar =
        document.getElementById(
            "exportarDatos"
        );

    const botonImportar =
        document.getElementById(
            "importarDatos"
        );
    
    const archivoImportacion =
        document.getElementById(
            "archivoImportacion"
        );


    if (botonExportar) {

        botonExportar.addEventListener(
            "click",
            exportarCopiaSeguridad
        );
    }


    if (
        botonImportar &&
        archivoImportacion
    ) {

        botonImportar.addEventListener(
            "click",
            () => {

                // Reiniciamos el input.
                // Así permite volver a seleccionar
                // el mismo archivo si fuera necesario.

                archivoImportacion.value = "";

                archivoImportacion.click();
            }
        );


        archivoImportacion.addEventListener(
            "change",
            evento => {

                const archivo =
                    evento.target.files?.[0];

                if (!archivo) {
                    return;
                }

                importarCopiaSeguridad(
                    archivo
                );
            }
        );
    }
}


// =========================================================
// CARGAR AJUSTES EN EL FORMULARIO
// =========================================================

function cargarFormularioAjustes() {

    const tipo =
        document.getElementById(
            "tipoPublicador"
        );


    const objetivo =
        document.getElementById(
            "objetivoMensual"
        );


    const personaje =
        document.getElementById(
            "personajeProgreso"
        );


    if (tipo) {

        tipo.value =
            estado.preferencias
                .tipoPublicador ||
            "publicador";
    }


    if (personaje) {

        personaje.value =
            estado.preferencias
                .personajeProgreso ||
            "hombre";
    }


    if (objetivo) {

        const minutos =
            Number(
                estado.preferencias
                    .objetivoMensualMinutos
            ) || 0;


        objetivo.value =
            minutos > 0
                ? String(
                    minutos / 60
                )
                : "0";
    }

    const mostrarLDC = document.getElementById("mostrarLDC");
    const mostrarAsambleas = document.getElementById("mostrarAsambleas");
    const mostrarOtras = document.getElementById("mostrarOtras");

    if (mostrarLDC) mostrarLDC.checked = estado.preferencias.mostrarLDC !== false;
    if (mostrarAsambleas) mostrarAsambleas.checked = estado.preferencias.mostrarAsambleas !== false;
    if (mostrarOtras) mostrarOtras.checked = estado.preferencias.mostrarOtras !== false;
}


// =========================================================
// OBJETIVO SUGERIDO
// =========================================================

function aplicarObjetivoSugerido() {

    const tipo =
        document.getElementById(
            "tipoPublicador"
        );


    const objetivo =
        document.getElementById(
            "objetivoMensual"
        );


    if (
        !tipo ||
        !objetivo ||
        !personaje
    ) {
        return;
    }


    switch (
        tipo.value
    ) {

        case "precursorRegular":

            objetivo.value = "50";

            break;


        case "precursorAuxiliar":

            objetivo.value = "15";

            break;


        case "publicador":

        default:

            // Para publicador no imponemos
            // ningún objetivo.

            if (
                Number(
                    objetivo.value
                ) === 50 ||
                Number(
                    objetivo.value
                ) === 15
            ) {

                objetivo.value = "0";
            }

            break;
    }
}


// =========================================================
// GUARDAR AJUSTES
// =========================================================

function guardarAjustesDesdeFormulario() {

    const tipo =
        document.getElementById(
            "tipoPublicador"
        );


    const objetivo =
        document.getElementById(
            "objetivoMensual"
        );


    const personaje =
        document.getElementById(
            "personajeProgreso"
        );


    const mensaje =
        document.getElementById(
            "mensajeAjustes"
        );


    if (
        !tipo ||
        !objetivo ||
        !personaje
    ) {
        return;
    }


    limpiarMensajeFormulario(
        mensaje
    );


    const tiposValidos = [
        "publicador",
        "precursorAuxiliar",
        "precursorRegular"
    ];


    if (
        !tiposValidos.includes(
            tipo.value
        )
    ) {

        mostrarMensajeFormulario(
            mensaje,
            "Selecciona un tipo válido.",
            true
        );

        return;
    }


    const personajesValidos = [
        "hombre","mujer","koala","mariposa","pantera","tortuga","liebre"
    ];

    if (!personajesValidos.includes(personaje.value)) {

        mostrarMensajeFormulario(
            mensaje,
            "Selecciona un personaje válido.",
            true
        );

        return;
    }


    const horas =
        Number(
            objetivo.value
        );


    if (
        !Number.isFinite(
            horas
        ) ||
        horas < 0 ||
        horas > 200
    ) {

        mostrarMensajeFormulario(
            mensaje,
            "Introduce un objetivo entre 0 y 200 horas.",
            true
        );

        return;
    }


    const preferenciasAnteriores = {
        ...estado.preferencias
    };


    const mostrarLDC = document.getElementById("mostrarLDC");
    const mostrarAsambleas = document.getElementById("mostrarAsambleas");
    const mostrarOtras = document.getElementById("mostrarOtras");

    estado.preferencias = {

        ...estado.preferencias,

        tipoPublicador:
            tipo.value,

        personajeProgreso:
            personaje.value,

        objetivoMensualMinutos:
            Math.round(
                horas * 60
            ),

        mostrarLDC: mostrarLDC ? mostrarLDC.checked : true,
        mostrarAsambleas: mostrarAsambleas ? mostrarAsambleas.checked : true,
        mostrarOtras: mostrarOtras ? mostrarOtras.checked : true
    };


    if (
        !guardarPreferencias()
    ) {

        estado.preferencias =
            preferenciasAnteriores;


        mostrarMensajeFormulario(
            mensaje,
            "No se pudieron guardar los ajustes.",
            true
        );

        return;
    }


    mostrarMensajeFormulario(
        mensaje,
        "Ajustes guardados ✓",
        false
    );


    aplicarVisibilidadActividades();
    actualizarTodaLaInterfaz();
}

// =========================================================
// SINCRONIZACIÓN WEB → IOS
// =========================================================


// =========================================================
// CREAR PAQUETE DE SINCRONIZACIÓN
// =========================================================

function crearPaqueteSincronizacionIOS() {

    const registros =
        estado.registros
            .filter(
                registro => {

                    // Por ahora sincronizamos las
                    // actividades estándar.
                    //
                    // "Otras" se incorporará en el
                    // siguiente paso con su nombre
                    // personalizado.

                    return (
                        registro.tipo === "ministerio" ||
                        registro.tipo === "ldc" ||
                        registro.tipo === "asambleas"
                    );
                }
            )
            .map(
                registro => {

                    return {

                        id:
                            registro.id,

                        fecha:
                            fechaSyncIOS(
                                registro.fecha
                            ),

                        minutos:
                            Math.max(
                                Math.round(
                                    Number(
                                        registro.minutos
                                    ) || 0
                                ),
                                0
                            ),

                        tipo:
                            registro.tipo,

                        notas:
                            String(
                                registro.notas || ""
                            ),

                        actividadPersonalizadaID:
                            null,

                        nombreActividadPersonalizada:
                            null,

                        creadoEn:
                            fechaISO8601Valida(
                                registro.creadoEn
                            ),

                        modificadoEn:
                            fechaISO8601Valida(
                                registro.modificadoEn
                            ),

                        estado:
                            "pendiente"
                    };
                }
            );


    return {

        version:
            3,

        generadoEn:
            new Date()
                .toISOString(),

        registros
    };
}


// =========================================================
// EXPORTAR SINCRONIZACIÓN PARA IOS
// =========================================================

function exportarSincronizacionIOS() {

    try {

        const paquete =
            crearPaqueteSincronizacionIOS();


        const contenido =
            JSON.stringify(
                paquete,
                null,
                2
            );


        const blob =
            new Blob(
                [contenido],
                {
                    type:
                        "application/json;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const enlace =
            document.createElement(
                "a"
            );


        const fecha =
            fechaLocalISO(
                new Date()
            );


        enlace.href =
            url;


        enlace.download =
            `Mi-Servicio-Sync-${fecha}.json`;


        enlace.style.display =
            "none";


        document.body.appendChild(
            enlace
        );


        enlace.click();


        window.setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

                enlace.remove();

            },
            1500
        );


        console.log(
            `Paquete de sincronización creado: ${paquete.registros.length} registros`
        );


        return true;

    } catch (error) {

        console.error(
            "No se pudo crear el paquete de sincronización:",
            error
        );


        return false;
    }
}


// =========================================================
// CONVERTIR FECHA DEL REGISTRO PARA IOS
//
// Swift utiliza Date con ISO 8601.
// El registro web guarda YYYY-MM-DD.
// Lo convertimos a las 12:00 UTC para evitar
// cambios accidentales de día por zona horaria.
// =========================================================

function fechaSyncIOS(
    fecha
) {

    if (
        typeof fecha !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/
            .test(
                fecha
            )
    ) {

        return new Date()
            .toISOString();
    }


    return `${fecha}T12:00:00Z`;
}


// =========================================================
// NORMALIZAR FECHA ISO 8601
// =========================================================

function fechaISO8601Valida(
    valor
) {

    if (valor) {

        const fecha =
            new Date(
                valor
            );


        if (
            !Number.isNaN(
                fecha.getTime()
            )
        ) {

            return fecha
                .toISOString();
        }
    }


    return new Date()
        .toISOString();
}


// =========================================================
// FIN SINCRONIZACIÓN WEB → IOS
// =========================================================


// =========================================================
// CREAR COPIA DE SEGURIDAD
// =========================================================

function crearDatosCopiaSeguridad() {

    return {

        formato:
            "mi-servicio-backup",

        version:
            2,

        exportadoEn:
            new Date().toISOString(),

        registros:
            estado.registros,

        preferencias:
            estado.preferencias,

        agendaSalidas:
            estado.agendaSalidas
    };
}


// =========================================================
// EXPORTAR COPIA DE SEGURIDAD
// =========================================================

function exportarCopiaSeguridad() {

    const mensaje =
        document.getElementById(
            "mensajeDatos"
        );


    limpiarMensajeFormulario(
        mensaje
    );


    try {

        const datos =
            crearDatosCopiaSeguridad();


        const contenido =
            JSON.stringify(
                datos,
                null,
                2
            );


        const blob =
            new Blob(
                [contenido],
                {
                    type:
                        "application/json;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const enlace =
            document.createElement(
                "a"
            );


        const fecha =
            fechaLocalISO(
                new Date()
            );


        enlace.href =
            url;


        enlace.download =
            `Mi-Servicio-${fecha}.json`;


        enlace.style.display =
            "none";


        document.body.appendChild(
            enlace
        );


        enlace.click();


        // Dejamos un pequeño margen antes
        // de destruir la URL.
        // Es más fiable en Safari/iPhone.

        window.setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );


                enlace.remove();

            },
            1500
        );


        guardarUltimaCopiaSeguridad(
            new Date()
        );

        actualizarRecordatorioCopiaSeguridad();

        mostrarMensajeFormulario(
            mensaje,
            "Copia de seguridad preparada ✓",
            false
        );

    } catch (error) {

        console.error(
            "Error al exportar:",
            error
        );


        mostrarMensajeFormulario(
            mensaje,
            "No se pudo crear la copia de seguridad.",
            true
        );
    }
}


// =========================================================
// IMPORTAR COPIA DE SEGURIDAD
// =========================================================

async function importarCopiaSeguridad(
    archivo
) {

    const mensaje =
        document.getElementById(
            "mensajeDatos"
        );

    limpiarMensajeFormulario(
        mensaje
    );

    try {

        const contenido =
            await archivo.text();

        const datos =
            JSON.parse(
                contenido
            );

        if (
            !validarCopiaSeguridad(
                datos
            )
        ) {

            mostrarMensajeFormulario(
                mensaje,
                "El archivo no es una copia válida de Mi Servicio.",
                true
            );

            return;
        }

        const registrosImportados =
            normalizarRegistrosImportados(
                datos.registros
            );

        const preferenciasImportadas =
            normalizarPreferenciasImportadas(
                datos.preferencias
            );

        const agendaImportada =
            (
                datos.agendaSalidas &&
                typeof datos.agendaSalidas === "object" &&
                !Array.isArray(datos.agendaSalidas)
            )
                ? Object.fromEntries(
                    Object.entries(datos.agendaSalidas)
                        .map(([fecha, valor]) => [
                            String(fecha),
                            normalizarAgendaDia(valor)
                        ])
                        .filter(([, valor]) => Boolean(valor.companero))
                )
                : {};

        const fechaCopia =
            datos.exportadoEn
                ? new Date(datos.exportadoEn)
                : null;

        const fechaTexto =
            fechaCopia && !Number.isNaN(fechaCopia.getTime())
                ? formatearFechaCopia(fechaCopia)
                : "fecha desconocida";

        const aceptar = window.confirm(
            `Vas a restaurar una copia de Mi Servicio.\n\n` +
            `Fecha de la copia: ${fechaTexto}\n` +
            `Registros: ${registrosImportados.length}\n\n` +
            `Antes de restaurarla se descargará automáticamente una copia de seguridad de tus datos actuales.\n\n` +
            `¿Quieres continuar?`
        );

        if (!aceptar) {
            mostrarMensajeFormulario(
                mensaje,
                "Restauración cancelada. No se ha cambiado ningún dato.",
                false
            );
            return;
        }

        // Antes de sustituir nada, descargamos una copia de los datos actuales.
        // Esta copia no modifica la fecha del recordatorio mensual.
        descargarCopiaSeguridadActual(
            "Antes-de-restaurar"
        );

        // Además conservamos los valores en memoria por si localStorage falla.
        const registrosAnteriores =
            estado.registros;

        const preferenciasAnteriores =
            estado.preferencias;

        const agendaAnterior =
            estado.agendaSalidas;

        estado.registros =
            registrosImportados;

        estado.preferencias =
            preferenciasImportadas;

        estado.agendaSalidas =
            agendaImportada;

        const registrosGuardados =
            guardarRegistros();

        const preferenciasGuardadas =
            guardarPreferencias();

        const agendaGuardada =
            guardarAgendaSalidas();

        if (
            !registrosGuardados ||
            !preferenciasGuardadas ||
            !agendaGuardada
        ) {

            estado.registros =
                registrosAnteriores;

            estado.preferencias =
                preferenciasAnteriores;

            estado.agendaSalidas =
                agendaAnterior;

            guardarRegistros();
            guardarPreferencias();
            guardarAgendaSalidas();

            mostrarMensajeFormulario(
                mensaje,
                "No se pudieron guardar los datos importados. Se han conservado los datos anteriores.",
                true
            );

            return;
        }

        cargarFormularioAjustes();
        actualizarTodaLaInterfaz();

        mostrarMensajeFormulario(
            mensaje,
            `Copia restaurada correctamente: ${textoCantidadRegistros(registrosImportados.length)} ✓`,
            false
        );

    } catch (error) {

        console.error(
            "Error al importar:",
            error
        );

        mostrarMensajeFormulario(
            mensaje,
            "No se pudo leer la copia de seguridad. Tus datos actuales no se han modificado.",
            true
        );
    }
}


// =========================================================
// DESCARGAR COPIA PREVIA A UNA RESTAURACIÓN
// =========================================================

function descargarCopiaSeguridadActual(
    etiqueta = "Copia"
) {

    const datos =
        crearDatosCopiaSeguridad();

    const contenido =
        JSON.stringify(
            datos,
            null,
            2
        );

    const blob =
        new Blob(
            [contenido],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const enlace =
        document.createElement(
            "a"
        );

    enlace.href = url;
    enlace.download =
        `Mi-Servicio-${etiqueta}-${fechaLocalISO(new Date())}.json`;
    enlace.style.display = "none";

    document.body.appendChild(
        enlace
    );

    enlace.click();

    window.setTimeout(
        () => {
            URL.revokeObjectURL(url);
            enlace.remove();
        },
        1500
    );
}


// =========================================================
// VALIDAR COPIA DE SEGURIDAD
// =========================================================

function validarCopiaSeguridad(
    datos
) {

    if (
        !datos ||
        typeof datos !==
            "object"
    ) {

        return false;
    }


    if (
        !Array.isArray(
            datos.registros
        )
    ) {

        return false;
    }


    if (
        !datos.preferencias ||
        typeof datos.preferencias !==
            "object"
    ) {

        return false;
    }


    // Si es una copia nueva comprobamos
    // también el identificador del formato.
    //
    // Si no existe, permitimos copias antiguas.

    if (
        datos.formato &&
        datos.formato !==
            "mi-servicio-backup"
    ) {

        return false;
    }


    return true;
}


// =========================================================
// NORMALIZAR REGISTROS IMPORTADOS
// =========================================================

function normalizarRegistrosImportados(
    registros
) {

    const resultado = [];


    registros.forEach(
        registro => {

            if (
                !registro ||
                typeof registro !==
                    "object"
            ) {

                return;
            }


            const fecha =
                String(
                    registro.fecha || ""
                );


            if (
                !fechaISOValida(
                    fecha
                )
            ) {

                return;
            }


            const tiposValidos = [
                "ministerio",
                "ldc",
                "asambleas",
                "otras"
            ];


            const tipo =
                tiposValidos.includes(
                    registro.tipo
                )
                    ? registro.tipo
                    : "ministerio";


            const minutos =
                Math.max(
                    Math.round(
                        Number(
                            registro.minutos
                        ) || 0
                    ),
                    0
                );


            if (
                minutos <= 0
            ) {
                return;
            }


            const ahora =
                new Date()
                    .toISOString();


            resultado.push({

                id:
                    registro.id ||
                    crearID(),

                fecha,

                tipo,

                minutos,

                notas:
                    typeof registro.notas ===
                        "string"
                        ? registro.notas
                        : "",

                creadoEn:
                    registro.creadoEn ||
                    ahora,

                modificadoEn:
                    registro.modificadoEn ||
                    registro.creadoEn ||
                    ahora,

                sincronizacion: {

                    estado:
                        "pendiente",

                    ultimaSincronizacion:
                        registro
                            .sincronizacion
                            ?.ultimaSincronizacion ||
                        null
                }
            });
        }
    );


    return resultado;
}


// =========================================================
// NORMALIZAR PREFERENCIAS IMPORTADAS
// =========================================================

function normalizarPreferenciasImportadas(
    preferencias
) {

    const tiposValidos = [
        "publicador",
        "precursorAuxiliar",
        "precursorRegular"
    ];


    const tipo =
        tiposValidos.includes(
            preferencias
                ?.tipoPublicador
        )
            ? preferencias
                .tipoPublicador
            : "publicador";


    const objetivo =
        Math.max(
            Math.round(
                Number(
                    preferencias
                        ?.objetivoMensualMinutos
                ) || 0
            ),
            0
        );


    return {

        tipoPublicador:
            tipo,

        personajeProgreso:
            ["hombre","mujer","koala","mariposa","pantera","tortuga","liebre"].includes(preferencias?.personajeProgreso)
                ? preferencias.personajeProgreso
                : "hombre",

        objetivoMensualMinutos:
            objetivo,

        mostrarLDC:
            preferencias?.mostrarLDC !== false,

        mostrarAsambleas:
            preferencias?.mostrarAsambleas !== false,

        mostrarOtras:
            preferencias?.mostrarOtras !== false
    };
}


// =========================================================
// VALIDAR FECHA ISO LOCAL
// YYYY-MM-DD
// =========================================================

function fechaISOValida(
    texto
) {

    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(
                texto
            )
    ) {

        return false;
    }


    const fecha =
        fechaDesdeISO(
            texto
        );


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return false;
    }


    return (
        fechaLocalISO(
            fecha
        ) === texto
    );
}


// =========================================================
// VISIBILIDAD DE ACTIVIDADES
// =========================================================

function actividadVisible(tipo) {
    switch (tipo) {
        case "ldc": return estado.preferencias.mostrarLDC !== false;
        case "asambleas": return estado.preferencias.mostrarAsambleas !== false;
        case "otras": return estado.preferencias.mostrarOtras !== false;
        default: return true;
    }
}

function filtrarRegistrosVisibles(registros) {
    return registros.filter(registro => actividadVisible(registro.tipo));
}

function aplicarVisibilidadActividades() {
    ["ldc", "asambleas", "otras"].forEach(tipo => {
        const visible = actividadVisible(tipo);

        document.querySelectorAll(`.actividad-boton[data-tipo="${tipo}"]`).forEach(el =>
            el.classList.toggle("oculto", !visible)
        );

        document.querySelectorAll(`.filtro-historial[data-filtro="${tipo}"]`).forEach(el =>
            el.classList.toggle("oculto", !visible)
        );
    });

    const pares = [
        ["totalLDC", "ldc"],
        ["totalAsambleas", "asambleas"],
        ["totalOtras", "otras"],
        ["estadisticasLDC", "ldc"],
        ["estadisticasAsambleas", "asambleas"],
        ["estadisticasOtras", "otras"]
    ];

    pares.forEach(([id, tipo]) => {
        const el = document.getElementById(id);
        const fila = el?.closest(".fila-dato");
        if (fila) fila.classList.toggle("oculto", !actividadVisible(tipo));
    });

    if (!actividadVisible(estado.filtroHistorial) && estado.filtroHistorial !== "todos") {
        estado.filtroHistorial = "todos";
        document.querySelectorAll(".filtro-historial").forEach(boton =>
            boton.classList.toggle("activo", boton.dataset.filtro === "todos")
        );
    }

    const tipoActual = document.getElementById("tipoRegistro")?.value;
    if (tipoActual && !actividadVisible(tipoActual)) {
        seleccionarActividad("ministerio");
    }
}

// =========================================================
// ACTUALIZACIÓN GENERAL
// =========================================================

function actualizarTodaLaInterfaz() {

    aplicarVisibilidadActividades();
    actualizarInicio();

    renderizarHistorial();

    actualizarEstadisticas();
    actualizarMeta();
}


// =========================================================
// FIN BLOQUE 5
// =========================================================

// =========================================================
// BLOQUE 6
// UTILIDADES GENERALES
// =========================================================


// =========================================================
// CONVERTIR HORAS + MINUTOS A MINUTOS
// =========================================================

function minutosTotales(
    horas,
    minutos
) {

    const horasValidas =
        Math.max(
            Number(horas) || 0,
            0
        );


    const minutosValidos =
        Math.max(
            Number(minutos) || 0,
            0
        );


    return Math.round(
        horasValidas * 60 +
        minutosValidos
    );
}


// =========================================================
// SUMAR MINUTOS DE REGISTROS
// =========================================================

function sumarMinutos(
    registros
) {

    if (
        !Array.isArray(
            registros
        )
    ) {

        return 0;
    }


    return registros.reduce(
        (
            acumulado,
            registro
        ) => {

            const minutos =
                Math.max(
                    Number(
                        registro?.minutos
                    ) || 0,
                    0
                );


            return (
                acumulado +
                minutos
            );
        },
        0
    );
}


// =========================================================
// FORMATEAR TIEMPO
//
// 0       → 0 min
// 45      → 45 min
// 60      → 1 h
// 135     → 2 h 15 min
// =========================================================

function formatearTiempo(
    totalMinutos
) {

    const total =
        Math.max(
            Math.round(
                Number(
                    totalMinutos
                ) || 0
            ),
            0
        );


    const horas =
        Math.floor(
            total / 60
        );


    const minutos =
        total % 60;


    if (
        horas === 0
    ) {

        return `${minutos} min`;
    }


    if (
        minutos === 0
    ) {

        return `${horas} h`;
    }


    return (
        `${horas} h ${minutos} min`
    );
}


// =========================================================
// FORMATEAR FECHA
// =========================================================

function formatearFecha(
    fechaISO
) {

    const fecha =
        fechaDesdeISO(
            fechaISO
        );


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return fechaISO || "";
    }


    return capitalizar(
        new Intl.DateTimeFormat(
            "es-ES",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(
            fecha
        )
    );
}


// =========================================================
// CONVERTIR YYYY-MM-DD A DATE
//
// Usamos las 12:00 para evitar problemas de zona horaria
// y cambios de horario de verano.
// =========================================================

function fechaDesdeISO(
    fechaISO
) {

    const partes =
        String(
            fechaISO || ""
        )
            .split("-")
            .map(
                Number
            );


    if (
        partes.length !== 3 ||
        partes.some(
            numero =>
                !Number.isFinite(
                    numero
                )
        )
    ) {

        return new Date(
            fechaISO
        );
    }


    const [
        anio,
        mes,
        dia
    ] = partes;


    return new Date(
        anio,
        mes - 1,
        dia,
        12,
        0,
        0,
        0
    );
}


// =========================================================
// CONVERTIR DATE A YYYY-MM-DD
// EN HORA LOCAL
// =========================================================

function fechaLocalISO(
    fecha
) {

    if (
        !(fecha instanceof Date) ||
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return "";
    }


    const anio =
        fecha.getFullYear();


    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            fecha.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${anio}-${mes}-${dia}`
    );
}


// =========================================================
// COPIAR FECHA
// =========================================================

function copiarFecha(
    fecha
) {

    return new Date(
        fecha.getTime()
    );
}


// =========================================================
// NOMBRE DE ACTIVIDAD
// =========================================================

function nombreActividad(
    tipo
) {

    switch (
        tipo
    ) {

        case "ministerio":

            return "Ministerio";


        case "ldc":

            return "LDC";


        case "asambleas":

            return "Asambleas";


        case "otras":

            return "Otras";


        case "todos":

            return "actividad";


        default:

            return "Actividad";
    }
}


// =========================================================
// ICONO DE ACTIVIDAD
// =========================================================

function iconoActividad(
    tipo
) {

    switch (
        tipo
    ) {

        case "ministerio":

            return "✦";


        case "ldc":

            return "⌂";


        case "asambleas":

            return "◆";


        case "otras":

            return "＋";


        default:

            return "•";
    }
}


// =========================================================
// TEXTO NÚMERO DE REGISTROS
// =========================================================

function textoCantidadRegistros(
    cantidad
) {

    const numero =
        Math.max(
            Number(
                cantidad
            ) || 0,
            0
        );


    return numero === 1
        ? "1 registro"
        : `${numero} registros`;
}


// =========================================================
// PONER TEXTO DE FORMA SEGURA
// =========================================================

function ponerTexto(
    id,
    texto
) {

    const elemento =
        document.getElementById(
            id
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        texto ?? "";
}


// =========================================================
// CAPITALIZAR PRIMERA LETRA
// =========================================================

function capitalizar(
    texto
) {

    const valor =
        String(
            texto || ""
        );


    if (!valor) {
        return "";
    }


    return (
        valor.charAt(0)
            .toUpperCase()
        +
        valor.slice(1)
    );
}


// =========================================================
// CREAR IDENTIFICADOR ÚNICO
// =========================================================

function crearID() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return (
            window.crypto.randomUUID()
        );
    }


    return (
        Date.now()
            .toString(36)
        +
        "-"
        +
        Math.random()
            .toString(36)
            .slice(2)
        +
        "-"
        +
        Math.random()
            .toString(36)
            .slice(2)
    );
}


// =========================================================
// COMPROBAR DISPONIBILIDAD DE LOCALSTORAGE
// =========================================================

function almacenamientoDisponible() {

    const clavePrueba =
        "__miServicioPrueba__";


    try {

        localStorage.setItem(
            clavePrueba,
            "1"
        );


        localStorage.removeItem(
            clavePrueba
        );


        return true;

    } catch (error) {

        console.error(
            "localStorage no está disponible:",
            error
        );


        return false;
    }
}


// =========================================================
// INFORMACIÓN DE DIAGNÓSTICO
// =========================================================

function diagnosticoMiServicio() {

    const resultado = {

        almacenamiento:
            almacenamientoDisponible(),

        registros:
            estado.registros.length,

        vista:
            estado.vistaActual,

        periodoEstadisticas:
            estado.estadisticas.periodo,

        objetivoMensualMinutos:
            estado.preferencias
                .objetivoMensualMinutos,

        version:
            "1.0"
    };


    console.table(
        resultado
    );


    return resultado;
}


// =========================================================
// FIN BLOQUE 6
// =========================================================
// =========================================================
// V19 · TRANSFERENCIA SAFARI → PANTALLA DE INICIO
//
// iOS puede aislar el almacenamiento de una web abierta en
// Safari y el de esa misma web instalada en la pantalla de
// inicio. Para no perder los datos, los transportamos UNA VEZ
// dentro del fragmento (#) de la URL. El fragmento no se envía
// al servidor. Al primer arranque desde el icono se importa y
// se limpia de la dirección.
// =========================================================

function configurarTransferenciaPantallaInicio() {

    const boton =
        document.getElementById(
            "prepararAccesoInicio"
        );

    if (!boton) {
        return;
    }

    boton.addEventListener(
        "click",
        prepararTransferenciaPantallaInicio
    );
}


function prepararTransferenciaPantallaInicio() {

    const mensaje =
        document.getElementById(
            "mensajeDatos"
        );

    try {

        const datos =
            crearDatosCopiaSeguridad();

        const json =
            JSON.stringify(datos);

        const codigo =
            textoABase64URL(json);

        // Evitamos crear una dirección desmesuradamente larga.
        // Si algún día hay muchísimos registros, la copia JSON
        // normal sigue siendo el método seguro de transferencia.
        if (codigo.length > 120000) {

            if (mensaje) {
                mensaje.textContent =
                    "Hay demasiados datos para transferirlos en el acceso. Usa Exportar copia de seguridad y después impórtala desde el icono.";
            }

            return;
        }

        const url =
            new URL(window.location.href);

        url.hash =
            `mi-servicio-transfer=${codigo}`;

        history.replaceState(
            null,
            "",
            url.toString()
        );

        if (mensaje) {
            mensaje.textContent =
                "✓ Datos preparados. Ahora pulsa Compartir → Añadir a pantalla de inicio. No cierres ni recargues esta página antes de añadirlo.";
        }

        window.alert(
            "Datos preparados ✓\n\nAhora pulsa Compartir → Añadir a pantalla de inicio.\n\nLa primera vez que abras Mi Servicio desde el nuevo icono, los datos se copiarán automáticamente."
        );

    } catch (error) {

        console.error(
            "No se pudo preparar la transferencia:",
            error
        );

        if (mensaje) {
            mensaje.textContent =
                "No se pudo preparar la transferencia. Haz una copia de seguridad antes de continuar.";
        }
    }
}


function importarTransferenciaDesdeURL() {

    try {

        const prefijo =
            "#mi-servicio-transfer=";

        if (
            !window.location.hash ||
            !window.location.hash.startsWith(prefijo)
        ) {
            return false;
        }

        const codigo =
            window.location.hash.slice(
                prefijo.length
            );

        const json =
            base64URLATexto(codigo);

        const datos =
            JSON.parse(json);

        validarCopiaSeguridad(datos);

        const registros =
            normalizarRegistrosImportados(
                datos.registros
            );

        const preferencias =
            normalizarPreferenciasImportadas(
                datos.preferencias
            );

        localStorage.setItem(
            STORAGE_KEYS.registros,
            JSON.stringify(registros)
        );

        localStorage.setItem(
            STORAGE_KEYS.preferencias,
            JSON.stringify(preferencias)
        );

        // Una vez importados, retiramos los datos de la URL.
        history.replaceState(
            null,
            "",
            window.location.pathname +
                window.location.search
        );

        sessionStorage.setItem(
            "miServicio.transferenciaRecibida",
            String(registros.length)
        );

        window.setTimeout(
            () => {

                const cantidad =
                    sessionStorage.getItem(
                        "miServicio.transferenciaRecibida"
                    );

                if (!cantidad) {
                    return;
                }

                sessionStorage.removeItem(
                    "miServicio.transferenciaRecibida"
                );

                window.alert(
                    `Datos recuperados ✓\n\nMi Servicio ha recibido ${cantidad} registros desde Safari.`
                );
            },
            450
        );

        return true;

    } catch (error) {

        console.error(
            "No se pudo importar la transferencia desde Safari:",
            error
        );

        return false;
    }
}


function textoABase64URL(texto) {

    const bytes =
        new TextEncoder()
            .encode(texto);

    let binario = "";

    for (const byte of bytes) {
        binario += String.fromCharCode(byte);
    }

    return btoa(binario)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}


function base64URLATexto(codigo) {

    let base64 =
        codigo
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    while (base64.length % 4) {
        base64 += "=";
    }

    const binario =
        atob(base64);

    const bytes =
        Uint8Array.from(
            binario,
            caracter =>
                caracter.charCodeAt(0)
        );

    return new TextDecoder()
        .decode(bytes);
}


// =========================================================
// BLOQUE 7
// SINCRONIZACIÓN CON IPHONE
// =========================================================


// =========================================================
// CONFIGURAR SINCRONIZACIÓN IPHONE
// =========================================================

function configurarSincronizacionIPhone() {

    const boton =
        document.getElementById(
            "exportarIPhone"
        );


    if (!boton) {

        console.warn(
            "No se encontró el botón exportarIPhone."
        );

        return;
    }


    boton.addEventListener(
        "click",
        exportarSincronizacionIPhone
    );


    console.log(
        "Exportación para iPhone preparada."
    );
}


// =========================================================
// EXPORTAR PARA IPHONE
// =========================================================

function exportarSincronizacionIPhone() {

    const mensaje =
        document.getElementById(
            "mensajeDatos"
        );


    limpiarMensajeFormulario(
        mensaje
    );


    try {

        const registros =
            estado.registros
                .filter(
                    registro => {

                        return (
                            Number(
                                registro.minutos
                            ) > 0
                        );
                    }
                )
                .map(
                    registro => {

                        const ahora =
                            new Date()
                                .toISOString();


                        const registroSync = {

                            id:
                                String(
                                    registro.id ||
                                    crearID()
                                ),

                            fecha:
                                convertirFechaWebAISO8601(
                                    registro.fecha
                                ),

                            minutos:
                                Math.max(
                                    Math.round(
                                        Number(
                                            registro.minutos
                                        ) || 0
                                    ),
                                    0
                                ),

                            tipo:
                                normalizarTipoSincronizacion(
                                    registro.tipo
                                ),

                            notas:
                                String(
                                    registro.notas ||
                                    ""
                                ),

                            actividadPersonalizadaID:
                                null,

                            nombreActividadPersonalizada:
                                null,

                            creadoEn:
                                normalizarFechaSincronizacion(
                                    registro.creadoEn
                                ) ||
                                ahora,

                            modificadoEn:
                                normalizarFechaSincronizacion(
                                    registro.modificadoEn
                                ) ||
                                normalizarFechaSincronizacion(
                                    registro.creadoEn
                                ) ||
                                ahora,

                            estado:
                                "pendiente"
                        };


                        // -----------------------------------------
                        // OTRAS ACTIVIDADES
                        // -----------------------------------------

                        if (
                            registro.tipo ===
                            "otras"
                        ) {

                            registroSync
                                .actividadPersonalizadaID =
                                    registro
                                        .actividadPersonalizadaID
                                    || null;


                            const nombre =
                                String(
                                    registro
                                        .nombreActividadPersonalizada
                                    ||
                                    registro
                                        .nombreActividad
                                    ||
                                    "Otra actividad"
                                )
                                .trim();


                            registroSync
                                .nombreActividadPersonalizada =
                                    nombre ||
                                    "Otra actividad";
                        }


                        return registroSync;
                    }
                )
                .filter(
                    registro => {

                        return Boolean(
                            registro.fecha
                        );
                    }
                );


        // =====================================================
        // PAQUETE COMPATIBLE CON SyncPackage DE SWIFT
        // =====================================================

        const paquete = {

            version:
                2,

            generadoEn:
                new Date()
                    .toISOString(),

            registros:
                registros
        };


        // =====================================================
        // CONVERTIR A JSON
        // =====================================================

        const contenido =
            JSON.stringify(
                paquete,
                null,
                2
            );


        // =====================================================
        // CREAR ARCHIVO
        // =====================================================

        const blob =
            new Blob(
                [
                    contenido
                ],
                {
                    type:
                        "application/json;charset=utf-8"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const enlace =
            document.createElement(
                "a"
            );


        enlace.href =
            url;


        enlace.download =
            `Mi-Servicio-iPhone-${fechaLocalISO(new Date())}.json`;


        enlace.style.display =
            "none";


        document.body.appendChild(
            enlace
        );


        // =====================================================
        // DESCARGAR
        // =====================================================

        enlace.click();


        // =====================================================
        // LIMPIAR
        // =====================================================

        window.setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );


                enlace.remove();

            },
            1500
        );


        // =====================================================
        // CONFIRMACIÓN
        // =====================================================

        mostrarMensajeFormulario(
            mensaje,
            `Archivo para iPhone preparado: ${textoCantidadRegistros(registros.length)} ✓`,
            false
        );


        console.log(
            "Archivo de sincronización creado:",
            paquete
        );


    } catch (error) {

        console.error(
            "Error al exportar para iPhone:",
            error
        );


        mostrarMensajeFormulario(
            mensaje,
            "No se pudo preparar el archivo para iPhone.",
            true
        );
    }
}


// =========================================================
// CONVERTIR FECHA WEB A ISO 8601
//
// Web:
// 2026-08-21
//
// iPhone:
// 2026-08-21T12:00:00.000Z
// =========================================================

function convertirFechaWebAISO8601(
    fechaTexto
) {

    if (
        !fechaISOValida(
            fechaTexto
        )
    ) {

        return null;
    }


    const partes =
        fechaTexto
            .split("-")
            .map(
                Number
            );


    const anio =
        partes[0];


    const mes =
        partes[1];


    const dia =
        partes[2];


    return new Date(
        Date.UTC(
            anio,
            mes - 1,
            dia,
            12,
            0,
            0,
            0
        )
    )
    .toISOString();
}


// =========================================================
// NORMALIZAR FECHAS DE SINCRONIZACIÓN
// =========================================================

function normalizarFechaSincronizacion(
    valor
) {

    if (!valor) {

        return null;
    }


    const fecha =
        new Date(
            valor
        );


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return null;
    }


    return fecha
        .toISOString();
}


// =========================================================
// NORMALIZAR TIPO
// =========================================================

function normalizarTipoSincronizacion(
    tipo
) {

    switch (
        tipo
    ) {

        case "ministerio":

            return "ministerio";


        case "ldc":

            return "ldc";


        case "asambleas":

            return "asambleas";


        case "otras":

            return "otras";


        default:

            return "ministerio";
    }
}


// =========================================================
// FIN BLOQUE 7
// =========================================================


// =========================================================
// V20 · SINCRONIZACIÓN CON ONEDRIVE
// =========================================================

const ONEDRIVE_CONFIG = {
    clientId: "ec18d1ba-8036-4acf-bf6e-2cb940acf34b",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "https://jositomb.github.io/mi-servicio/",
    scopes: ["User.Read", "Files.ReadWrite.AppFolder"],
    archivo: "mi-servicio.json"
};

let clienteMSALOneDrive = null;
let aplicandoDatosOneDrive = false;
let temporizadorSyncOneDrive = null;
let sincronizandoOneDrive = false;

function configurarOneDrive() {
    const conectar = document.getElementById("conectarOneDrive");
    const sincronizar = document.getElementById("sincronizarOneDrive");
    const desconectar = document.getElementById("desconectarOneDrive");

    if (conectar) conectar.addEventListener("click", conectarConOneDrive);
    if (sincronizar) sincronizar.addEventListener("click", () => sincronizarConOneDrive(true));
    if (desconectar) desconectar.addEventListener("click", desconectarOneDrive);

    iniciarOneDrive();
}

async function iniciarOneDrive() {
    if (typeof msal === "undefined") {
        actualizarEstadoOneDrive("No se pudo cargar el acceso a Microsoft", false);
        return;
    }

    try {
        clienteMSALOneDrive = new msal.PublicClientApplication({
            auth: {
                clientId: ONEDRIVE_CONFIG.clientId,
                authority: ONEDRIVE_CONFIG.authority,
                redirectUri: ONEDRIVE_CONFIG.redirectUri,
                navigateToLoginRequestUrl: false
            },
            cache: {
                cacheLocation: "localStorage",
                storeAuthStateInCookie: false
            }
        });

        const respuesta = await clienteMSALOneDrive.handleRedirectPromise();
        const cuentas = clienteMSALOneDrive.getAllAccounts();
        const cuenta = respuesta?.account || cuentas[0] || null;

        if (cuenta) clienteMSALOneDrive.setActiveAccount(cuenta);

        if (respuesta?.account) {
            almacenamiento.guardar(STORAGE_KEYS.onedriveConectado, true);
        }

        const conectado = almacenamiento.leer(STORAGE_KEYS.onedriveConectado, false) && !!cuenta;
        actualizarInterfazOneDrive(conectado, cuenta);

        if (conectado) {
            setTimeout(() => sincronizarConOneDrive(false), 650);
        }
    } catch (error) {
        console.error("Error iniciando OneDrive:", error);
        actualizarEstadoOneDrive("No se pudo iniciar OneDrive", false);
    }
}

async function conectarConOneDrive() {
    if (!clienteMSALOneDrive) {
        await iniciarOneDrive();
        if (!clienteMSALOneDrive) return;
    }

    try {
        await clienteMSALOneDrive.loginRedirect({
            scopes: ONEDRIVE_CONFIG.scopes,
            prompt: "select_account"
        });
    } catch (error) {
        console.error("Error conectando OneDrive:", error);
        mostrarMensajeOneDrive("No se pudo abrir el inicio de sesión de Microsoft.", true);
    }
}

function desconectarOneDrive() {
    almacenamiento.guardar(STORAGE_KEYS.onedriveConectado, false);
    actualizarInterfazOneDrive(false, null);
    mostrarMensajeOneDrive("OneDrive se ha desconectado de Mi Servicio en este dispositivo.", false);
}

function actualizarInterfazOneDrive(conectado, cuenta) {
    const conectar = document.getElementById("conectarOneDrive");
    const sincronizar = document.getElementById("sincronizarOneDrive");
    const desconectar = document.getElementById("desconectarOneDrive");
    const estadoEl = document.getElementById("estadoOneDrive");
    const indicador = document.getElementById("indicadorOneDrive");
    const ultima = document.getElementById("ultimaSyncOneDrive");

    if (conectar) conectar.hidden = conectado;
    if (sincronizar) sincronizar.hidden = !conectado;
    if (desconectar) desconectar.hidden = !conectado;

    if (estadoEl) {
        estadoEl.textContent = conectado
            ? `Conectado${cuenta?.username ? ` · ${cuenta.username}` : ""}`
            : "No conectado";
    }

    if (indicador) indicador.classList.toggle("conectado", conectado);

    const fecha = almacenamiento.leer(STORAGE_KEYS.ultimaSyncOneDrive, null);
    if (ultima) {
        ultima.hidden = !conectado || !fecha;
        if (fecha) ultima.textContent = `Última sincronización: ${formatearFechaHoraOneDrive(fecha)}`;
    }
}

function actualizarEstadoOneDrive(texto, conectado) {
    const estadoEl = document.getElementById("estadoOneDrive");
    const indicador = document.getElementById("indicadorOneDrive");
    if (estadoEl) estadoEl.textContent = texto;
    if (indicador) indicador.classList.toggle("conectado", !!conectado);
}

function mostrarMensajeOneDrive(texto, error = false) {
    const mensaje = document.getElementById("mensajeDatos");
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.classList.toggle("error", error);
    mensaje.classList.toggle("exito", !error);
    mensaje.classList.add("visible");
}

function marcarModificacionLocalOneDrive() {
    almacenamiento.guardar(STORAGE_KEYS.ultimaModificacionLocal, new Date().toISOString());
}

function programarSincronizacionOneDrive() {
    if (aplicandoDatosOneDrive) return;
    if (!almacenamiento.leer(STORAGE_KEYS.onedriveConectado, false)) return;

    clearTimeout(temporizadorSyncOneDrive);
    temporizadorSyncOneDrive = setTimeout(() => sincronizarConOneDrive(false), 1200);
}

async function obtenerTokenOneDrive() {
    if (!clienteMSALOneDrive) throw new Error("MSAL no iniciado");

    const cuenta = clienteMSALOneDrive.getActiveAccount() || clienteMSALOneDrive.getAllAccounts()[0];
    if (!cuenta) throw new Error("No hay cuenta Microsoft conectada");

    try {
        const respuesta = await clienteMSALOneDrive.acquireTokenSilent({
            scopes: ONEDRIVE_CONFIG.scopes,
            account: cuenta
        });
        return respuesta.accessToken;
    } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
            await clienteMSALOneDrive.acquireTokenRedirect({
                scopes: ONEDRIVE_CONFIG.scopes,
                account: cuenta
            });
            return null;
        }
        throw error;
    }
}

async function sincronizarConOneDrive(mostrarResultado = false) {
    if (sincronizandoOneDrive) return;
    if (!almacenamiento.leer(STORAGE_KEYS.onedriveConectado, false)) return;
    if (!clienteMSALOneDrive) return;

    sincronizandoOneDrive = true;
    const indicador = document.getElementById("indicadorOneDrive");
    if (indicador) indicador.classList.add("sincronizando");

    try {
        const token = await obtenerTokenOneDrive();
        if (!token) return;

        const remoto = await descargarDatosOneDrive(token);
        const localMs = obtenerFechaModificacionLocalOneDrive();
        const remotoMs = remoto?.updatedAt ? Date.parse(remoto.updatedAt) || 0 : 0;

        let accion = "";

        if (!remoto) {
            await subirDatosOneDrive(token);
            accion = "subidos";
        } else if (remotoMs > localMs) {
            aplicarDatosDesdeOneDrive(remoto);
            accion = "descargados";
        } else if (localMs > remotoMs) {
            await subirDatosOneDrive(token);
            accion = "subidos";
        } else {
            registrarSincronizacionOneDrive(remoto.updatedAt || new Date().toISOString());
            accion = "al día";
        }

        const cuenta = clienteMSALOneDrive.getActiveAccount() || clienteMSALOneDrive.getAllAccounts()[0] || null;
        actualizarInterfazOneDrive(true, cuenta);

        if (mostrarResultado) {
            mostrarMensajeOneDrive(
                accion === "al día"
                    ? "✓ OneDrive ya estaba al día."
                    : `✓ Datos ${accion} correctamente con OneDrive.`,
                false
            );
        }
    } catch (error) {
        console.error("Error sincronizando OneDrive:", error);
        if (mostrarResultado) {
            mostrarMensajeOneDrive("No se pudo sincronizar con OneDrive. Comprueba la conexión e inténtalo de nuevo.", true);
        }
    } finally {
        sincronizandoOneDrive = false;
        if (indicador) indicador.classList.remove("sincronizando");
    }
}

function obtenerFechaModificacionLocalOneDrive() {
    const guardada = almacenamiento.leer(STORAGE_KEYS.ultimaModificacionLocal, null);
    if (guardada) return Date.parse(guardada) || 0;

    let maximo = 0;
    for (const registro of estado.registros || []) {
        const candidata = registro.modificadoEn || registro.creadoEn || registro.fecha;
        const ms = Date.parse(candidata) || 0;
        if (ms > maximo) maximo = ms;
    }
    return maximo;
}

async function descargarDatosOneDrive(token) {
    const url = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${encodeURIComponent(ONEDRIVE_CONFIG.archivo)}:/content`;
    const respuesta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
    });

    if (respuesta.status === 404) return null;
    if (!respuesta.ok) throw new Error(`Graph download ${respuesta.status}`);

    const datos = await respuesta.json();
    if (!datos || datos.formato !== "mi-servicio-onedrive" || !datos.copia) {
        throw new Error("Formato de OneDrive no reconocido");
    }
    return datos;
}

async function subirDatosOneDrive(token) {
    const ahora = new Date().toISOString();
    const paquete = {
        formato: "mi-servicio-onedrive",
        version: 1,
        updatedAt: ahora,
        copia: crearDatosCopiaSeguridad()
    };

    const url = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${encodeURIComponent(ONEDRIVE_CONFIG.archivo)}:/content`;
    const respuesta = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify(paquete)
    });

    if (!respuesta.ok) throw new Error(`Graph upload ${respuesta.status}`);

    almacenamiento.guardar(STORAGE_KEYS.ultimaModificacionLocal, ahora);
    registrarSincronizacionOneDrive(ahora);
}

function aplicarDatosDesdeOneDrive(remoto) {
    const copia = remoto.copia;
    if (!validarCopiaSeguridad(copia)) {
        throw new Error("La copia de OneDrive no es válida");
    }

    const registros = normalizarRegistrosImportados(copia.registros);
    const preferencias = normalizarPreferenciasImportadas(copia.preferencias);

    aplicandoDatosOneDrive = true;
    try {
        estado.registros = registros;
        estado.preferencias = preferencias;
        guardarJSON(STORAGE_KEYS.registros, estado.registros);
        guardarJSON(STORAGE_KEYS.preferencias, estado.preferencias);
        almacenamiento.guardar(STORAGE_KEYS.ultimaModificacionLocal, remoto.updatedAt);
        registrarSincronizacionOneDrive(remoto.updatedAt);
    } finally {
        aplicandoDatosOneDrive = false;
    }

    cargarFormularioAjustes();
    actualizarTodaLaInterfaz();
    actualizarRecordatorioCopiaSeguridad();
}

function registrarSincronizacionOneDrive(fecha) {
    const iso = fecha || new Date().toISOString();
    almacenamiento.guardar(STORAGE_KEYS.ultimaSyncOneDrive, iso);
}

function formatearFechaHoraOneDrive(fechaISO) {
    const fecha = new Date(fechaISO);
    if (Number.isNaN(fecha.getTime())) return "ahora";
    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(fecha);
}

// =========================================================
// V23 · ESTE MES DESPLEGABLE
// =========================================================
(function configurarEsteMesDesplegable() {
    function iniciar() {
        const boton = document.getElementById("botonDesplegarMes");
        const detalle = document.getElementById("detalleMes");
        const tarjeta = document.getElementById("tarjetaMesDesplegable");
        const grid = tarjeta?.closest(".inicio-resumen-grid");
        if (!boton || !detalle || !tarjeta || boton.dataset.configurado === "1") return;

        boton.dataset.configurado = "1";
        detalle.hidden = true;
        boton.setAttribute("aria-expanded", "false");

        boton.addEventListener("click", () => {
            const abrir = detalle.hidden;
            detalle.hidden = !abrir;
            boton.setAttribute("aria-expanded", String(abrir));
            tarjeta.classList.toggle("abierta", abrir);
            if (grid) {
                grid.classList.toggle("mes-abierto", abrir);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();


// =========================================================
// CÓMPUTO PARA LA META ANUAL
// =========================================================
// Regla mensual:
// - Si en el mes solo hay Ministerio, cuenta todo el Ministerio.
// - Si hay LDC, Asambleas u Otras, cuenta la suma total del mes
//   con un máximo de 55 h para la meta anual.
// - La actividad real nunca se pierde: se conserva por separado.

const LIMITE_MENSUAL_META_MINUTOS = 55 * 60;

function calcularComputoMesMeta(registrosMes) {
    const registros = Array.isArray(registrosMes) ? registrosMes : [];

    const ministerio = sumarMinutos(
        registros.filter(registro => registro.tipo === "ministerio")
    );

    const actividadAdicional = sumarMinutos(
        registros.filter(registro => registro.tipo !== "ministerio")
    );

    const actividadTotal = ministerio + actividadAdicional;

    const computable = actividadAdicional > 0
        ? Math.min(actividadTotal, LIMITE_MENSUAL_META_MINUTOS)
        : ministerio;

    return {
        ministerio,
        actividadAdicional,
        actividadTotal,
        computable
    };
}

function calcularComputoAnualMeta(registrosAnio, inicioAnio) {
    const registros = Array.isArray(registrosAnio) ? registrosAnio : [];
    let actividadTotal = 0;
    let computable = 0;

    for (let desplazamiento = 0; desplazamiento < 12; desplazamiento += 1) {
        const inicioMes = new Date(
            inicioAnio.getFullYear(),
            inicioAnio.getMonth() + desplazamiento,
            1, 0, 0, 0, 0
        );

        const finMes = new Date(
            inicioAnio.getFullYear(),
            inicioAnio.getMonth() + desplazamiento + 1,
            0, 23, 59, 59, 999
        );

        const registrosMes = registros.filter(registro => {
            const fecha = fechaDesdeISO(registro.fecha);
            return fecha >= inicioMes && fecha <= finMes;
        });

        const resumenMes = calcularComputoMesMeta(registrosMes);
        actividadTotal += resumenMes.actividadTotal;
        computable += resumenMes.computable;
    }

    return { actividadTotal, computable };
}


// =========================================================
// META DEL AÑO DE SERVICIO
// =========================================================

function actualizarMeta() {
    const contenedor = document.getElementById("vista-meta");
    if (!contenedor) return;

    const esPrecursorRegular =
        estado.preferencias?.tipoPublicador === "precursorRegular";

    const principal = contenedor.querySelector(".meta-principal");
    const bloques = contenedor.querySelectorAll(".meta-dos-columnas, .meta-ritmo, .meta-restante");
    const sinObjetivo = document.getElementById("metaSinObjetivo");

    if (!esPrecursorRegular) {
        principal?.classList.add("oculto");
        bloques.forEach(elemento => elemento.classList.add("oculto"));
        sinObjetivo?.classList.remove("oculto");
        return;
    }

    principal?.classList.remove("oculto");
    bloques.forEach(elemento => elemento.classList.remove("oculto"));
    sinObjetivo?.classList.add("oculto");

    const ahora = new Date();
    const rango = rangoAnio(ahora);
    const registrosAnio = obtenerRegistrosEntreFechas(rango.inicio, rango.fin);
    const resumenComputo = calcularComputoAnualMeta(registrosAnio, rango.inicio);
    const totalActividad = resumenComputo.actividadTotal;
    const totalComputable = resumenComputo.computable;
    const totalExcedente = Math.max(totalActividad - totalComputable, 0);

    // Resumen específico del mes actual para que quede claro qué
    // parte entra en la meta y qué parte queda como excedente.
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    const finMesActual = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    const registrosMesActual = obtenerRegistrosEntreFechas(inicioMesActual, finMesActual);
    const computoMesActual = calcularComputoMesMeta(registrosMesActual);
    const excedenteMesActual = Math.max(
        computoMesActual.actividadTotal - computoMesActual.computable,
        0
    );
    const objetivo = 600 * 60;
    const pendiente = Math.max(objetivo - totalComputable, 0);
    const progreso = objetivo > 0 ? totalComputable / objetivo : 0;
    const progresoLimitado = Math.min(Math.max(progreso, 0), 1);
    const porcentaje = Math.round(progreso * 100);

    const duracionAnio = rango.fin.getTime() - rango.inicio.getTime();
    const transcurrido = Math.min(
        Math.max(ahora.getTime() - rango.inicio.getTime(), 0),
        duracionAnio
    );
    const progresoTiempo = duracionAnio > 0 ? transcurrido / duracionAnio : 0;
    const esperado = Math.round(objetivo * progresoTiempo);
    const diferencia = totalComputable - esperado;

    const finExclusivo = new Date(
        rango.fin.getFullYear(),
        rango.fin.getMonth(),
        rango.fin.getDate() + 1
    );
    const diasRestantes = Math.max(
        Math.ceil((finExclusivo.getTime() - ahora.getTime()) / 86400000),
        0
    );
    const mesesEquivalentes = Math.max(diasRestantes / 30.4375, 1 / 30.4375);
    const ritmoMensual = pendiente > 0
        ? Math.round(pendiente / mesesEquivalentes)
        : 0;

    const anioServicio = rango.fin.getFullYear();
    ponerTexto("metaAnioServicio", `Año de servicio ${anioServicio}`);
    ponerTexto(
        "metaPeriodo",
        `sep ${rango.inicio.getFullYear()} – ago ${anioServicio}`
    );
    ponerTexto("metaPorcentaje", `${porcentaje}%`);
    ponerTexto("metaTotal", formatearTiempo(totalComputable));
    ponerTexto("metaObjetivoTexto", `de ${formatearTiempo(objetivo)}`);
    ponerTexto("metaActividadTotal", formatearTiempo(totalActividad));
    ponerTexto("metaComputableClaro", formatearTiempo(totalComputable));
    ponerTexto("metaExcedente", formatearTiempo(totalExcedente));

    ponerTexto(
        "metaMesActividad",
        `${formatearTiempo(computoMesActual.actividadTotal)} de actividad`
    );
    ponerTexto("metaMesComputable", formatearTiempo(computoMesActual.computable));
    ponerTexto("metaMesExcedente", formatearTiempo(excedenteMesActual));

    const tieneAdicionalMes = computoMesActual.actividadAdicional > 0;
    const metaMesEstado = document.getElementById("metaMesEstado");
    if (metaMesEstado) {
        metaMesEstado.textContent = tieneAdicionalMes ? "Límite 55 h" : "Computa todo";
        metaMesEstado.classList.toggle("con-limite", tieneAdicionalMes);
    }

    ponerTexto(
        "metaMesExplicacion",
        tieneAdicionalMes
            ? (excedenteMesActual > 0
                ? `${formatearTiempo(computoMesActual.computable)} suman a las 600 h y ${formatearTiempo(excedenteMesActual)} quedan como actividad adicional sin computar.`
                : `Este mes hay actividad adicional. Hasta 55 h del total pueden computar para la meta anual.`)
            : `Este mes solo hay Ministerio: todas las horas registradas computan para las 600 h.`
    );

    ponerTexto("metaLlevas", formatearTiempo(totalComputable));
    ponerTexto("metaQueda", formatearTiempo(pendiente));
    ponerTexto("metaEsperado", formatearTiempo(esperado));

    const anillo = document.getElementById("metaAnillo");
    if (anillo) {
        anillo.style.setProperty(
            "--meta-progreso",
            `${progresoLimitado * 360}deg`
        );
    }

    const barra = document.getElementById("metaBarraRelleno");
    if (barra) barra.style.width = `${progresoLimitado * 100}%`;

    const vaPorDelante = diferencia >= 0;
    ponerTexto(
        "metaDiferenciaTitulo",
        vaPorDelante ? "Vas por delante" : "Vas por detrás"
    );
    ponerTexto("metaDiferencia", formatearTiempo(Math.abs(diferencia)));

    const diferenciaElemento = document.getElementById("metaDiferencia");
    diferenciaElemento?.classList.toggle("meta-positivo", vaPorDelante);
    diferenciaElemento?.classList.toggle("meta-atencion", !vaPorDelante);

    let mensaje;
    if (pendiente === 0) {
        mensaje = "Ya has alcanzado la meta del año de servicio.";
    } else if (diferencia > 0) {
        mensaje = `Llevas ${formatearTiempo(diferencia)} más de lo necesario para el ritmo de hoy.`;
    } else if (diferencia < 0) {
        mensaje = `Con ${formatearTiempo(Math.abs(diferencia))} recuperarías el ritmo esperado para hoy.`;
    } else {
        mensaje = "Estás exactamente en el ritmo previsto para alcanzar la meta.";
    }
    ponerTexto("metaMensaje", mensaje);

    ponerTexto(
        "metaTiempoRestante",
        textoTiempoRestanteMeta(ahora, finExclusivo)
    );
    ponerTexto(
        "metaRitmoNecesario",
        pendiente === 0 ? "Meta ✓" : `${formatearTiempo(ritmoMensual)}/mes`
    );
}

function textoTiempoRestanteMeta(desde, hasta) {
    if (hasta <= desde) return "0 días";

    let meses =
        (hasta.getFullYear() - desde.getFullYear()) * 12 +
        (hasta.getMonth() - desde.getMonth());

    let ancla = new Date(
        desde.getFullYear(),
        desde.getMonth() + meses,
        desde.getDate()
    );

    if (ancla > hasta) {
        meses -= 1;
        ancla = new Date(
            desde.getFullYear(),
            desde.getMonth() + meses,
            desde.getDate()
        );
    }

    const dias = Math.max(
        Math.round((hasta.getTime() - ancla.getTime()) / 86400000),
        0
    );

    if (meses > 0 && dias > 0) return `${meses} meses y ${dias} días`;
    if (meses > 0) return meses === 1 ? "1 mes" : `${meses} meses`;
    return dias === 1 ? "1 día" : `${dias} días`;
}

function configurarInteraccionAnillosProgreso() {
    const grafico=document.getElementById("graficoInicio");
    const info=document.getElementById("infoAnilloActivo");
    if(!grafico||!info)return;
    const circulos=Array.from(grafico.querySelectorAll("svg circle"));
    circulos.forEach(circulo=>{
        const dash=circulo.getAttribute("stroke-dasharray")||circulo.style.strokeDasharray||"";
        if(dash&&dash!=="none")circulo.classList.add("anillo-con-progreso");
        circulo.onclick=event=>{
            event.stopPropagation();
            circulos.forEach(c=>c.classList.remove("anillo-activo"));
            circulo.classList.add("anillo-activo");
            grafico.classList.add("anillo-enfocado");
            const titulo=circulo.querySelector("title")?.textContent||circulo.getAttribute("aria-label")||"Progreso de actividad";
            info.textContent=titulo;
            info.classList.add("visible");
            clearTimeout(grafico._temporizadorAnillo);
            grafico._temporizadorAnillo=setTimeout(()=>{
                grafico.classList.remove("anillo-enfocado");
                circulos.forEach(c=>c.classList.remove("anillo-activo"));
                info.classList.remove("visible");
            },2600);
        };
    });
}
document.addEventListener("DOMContentLoaded",()=>{
    const grafico=document.getElementById("graficoInicio");
    if(!grafico)return;
    configurarInteraccionAnillosProgreso();
    new MutationObserver(()=>configurarInteraccionAnillosProgreso()).observe(grafico,{childList:true,subtree:true});
});

const CLAVE_LOCALIDAD_TIEMPO="miServicio.localidadTiempo";
function descripcionTiempo(c){if(c===0)return["☀️","Despejado"];if([1,2].includes(c))return["🌤️","Poco nuboso"];if(c===3)return["☁️","Nublado"];if([45,48].includes(c))return["🌫️","Niebla"];if([51,53,55,61,63,65,80,81,82].includes(c))return["🌧️","Lluvia"];if([71,73,75,85,86].includes(c))return["🌨️","Nieve"];if([95,96,99].includes(c))return["⛈️","Tormenta"];return["🌤️","Variable"]}
function consejoRopa(t,l,v){if(l>=55)return t<=12?"🧥☂️ Abrígate y lleva paraguas.":"☂️ Lleva paraguas o impermeable.";if(t<=7)return"🧥 Abrigo y ropa cálida.";if(t<=14)return"🧥 Chaqueta ligera.";if(t>=27)return"👕 Ropa fresca y agua.";if(v>=30)return"💨 Chaqueta ligera para el viento.";return"👕 Ropa cómoda; temperatura agradable."}
async function actualizarTiempoInicio(){
 const lugar=document.getElementById("tiempoLugar"),tempE=document.getElementById("tiempoTemperatura"),desc=document.getElementById("tiempoDescripcion"),ico=document.getElementById("tiempoIcono"),llu=document.getElementById("tiempoLluvia"),vie=document.getElementById("tiempoViento"),con=document.getElementById("tiempoConsejo");if(!lugar)return;
 const ciudad=localStorage.getItem(CLAVE_LOCALIDAD_TIEMPO)||"Arteixo";lugar.textContent=ciudad;desc.textContent="Consultando…";
 try{const g=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ciudad)}&count=1&language=es&format=json`).then(r=>r.json()),s=g.results?.[0];if(!s)throw 0;
 const d=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${s.latitude}&longitude=${s.longitude}&current=temperature_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=auto`).then(r=>r.json());
 const t=Math.round(d.current?.temperature_2m??0),v=Math.round(d.current?.wind_speed_10m??0),hour=new Date().getHours(),l=Math.round(d.hourly?.precipitation_probability?.[hour]??0),x=descripcionTiempo(d.current?.weather_code);aplicarAmbienteClima(d.current?.weather_code);
 lugar.textContent=s.name;ico.textContent=x[0];tempE.textContent=`${t}°`;desc.textContent=x[1];llu.textContent=`💧 ${l}%`;vie.textContent=`💨 ${v} km/h`;con.textContent=consejoRopa(t,l,v)
 }catch(e){desc.textContent="No disponible";con.textContent="Comprueba la conexión."}
}
document.addEventListener("DOMContentLoaded",()=>{document.getElementById("actualizarTiempoInicio")?.addEventListener("click",actualizarTiempoInicio);actualizarTiempoInicio()});

function actualizarPlanInteligenteMes(){
 const hoy=new Date(),fin=new Date(hoy.getFullYear(),hoy.getMonth()+1,0);
 const objetivo=Number(estado.preferencias?.objetivoMensualMinutos)||3300;
 const regs=(estado.registros||[]).filter(r=>{const d=new Date(r.fecha+"T12:00:00");return d.getFullYear()===hoy.getFullYear()&&d.getMonth()===hoy.getMonth()});
 const hecho=sumarMinutos(regs),resta=Math.max(objetivo-hecho,0),dias=Math.max(fin.getDate()-hoy.getDate()+1,1);
 let salidas=0;Object.keys(estado.agendaSalidas||{}).forEach(f=>{const d=new Date(f+"T12:00:00");if(d>=new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate())&&d<=fin)salidas++});
 const planMin=minutosPlanificadosMesActual();
 const base=Math.max(salidas,Math.ceil(dias/3),1),ritmo=Math.ceil(Math.max(resta-planMin,0)/base/15)*15;
 const fmt=n=>{const a=Math.floor(n/60),b=n%60;return b?`${a} h ${b} min`:`${a} h`};
 const a=document.getElementById("planHorasRestantes"),b=document.getElementById("planRitmoSugerido"),m=document.getElementById("planMensajeMes");
 if(a)a.textContent=fmt(resta);if(b)b.textContent=resta?`${fmt(ritmo)} / salida`:"Meta conseguida";
 if(m)m.textContent=resta===0?"🎉 Has alcanzado tu objetivo mensual.":planMin>0?`Tienes ${fmt(planMin)} previstas este mes. Si las completas, quedarían ${fmt(Math.max(resta-planMin,0))} para alcanzar la meta.`:salidas?`Tienes ${salidas} salida${salidas===1?"":"s"} planificada${salidas===1?"":"s"}. Añade el tiempo previsto para calcular mejor tu avance.`:`Te quedan ${dias} días. Si planificas unas ${base} salidas, con aproximadamente ${fmt(ritmo)} cada una mantendrías un ritmo cómodo.`;
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(actualizarPlanInteligenteMes,120));
document.addEventListener("click",()=>setTimeout(actualizarPlanInteligenteMes,120));

function aplicarAmbienteClima(codigo){const t=document.querySelector("#vista-inicio .tarjeta-grafico-inicio");if(!t)return;t.classList.remove("clima-sol","clima-nubes","clima-lluvia");if(codigo===0||codigo===1)t.classList.add("clima-sol");else if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(Number(codigo)))t.classList.add("clima-lluvia");else t.classList.add("clima-nubes")}


function configurarGaleriaPersonajes(){
    const galeria=document.getElementById("galeriaPersonajes");
    const select=document.getElementById("personajeProgreso");
    if(!galeria||!select)return;
    const pintar=()=>{
        galeria.querySelectorAll("[data-personaje]").forEach(b=>{
            b.classList.toggle("seleccionado",b.dataset.personaje===select.value);
        });
    };
    galeria.querySelectorAll("[data-personaje]").forEach(b=>{
        b.onclick=()=>{
            select.value=b.dataset.personaje;
            pintar();
            const anterior=estado.preferencias.personajeProgreso;
            estado.preferencias.personajeProgreso=select.value;
            const objetivo=Number(estado.preferencias.objetivoMensualMinutos)||1;
            const hoy=new Date();
            const regs=(estado.registros||[]).filter(r=>{
                const d=new Date(r.fecha+"T12:00:00");
                return d.getFullYear()===hoy.getFullYear()&&d.getMonth()===hoy.getMonth();
            });
            actualizarPersonajeProgreso(Math.min(100,(sumarMinutos(regs)/objetivo)*100));
            estado.preferencias.personajeProgreso=anterior;
        };
    });
    select.addEventListener("change",pintar);
    pintar();
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(configurarGaleriaPersonajes,100));


const PERSONAJES_UI={
  hombre:{nombre:"Hombre",icono:"🚶‍♂️"},
  mujer:{nombre:"Mujer",icono:"🚶‍♀️"},
  koala:{nombre:"Koala",icono:"🐨"},
  mariposa:{nombre:"Mariposa",icono:"🦋"},
  pantera:{nombre:"Pantera rosa",icono:"🐈"},
  tortuga:{nombre:"Tortuga",icono:"🐢"},
  liebre:{nombre:"Liebre",icono:"🐇"}
};
function actualizarResumenPersonaje(){
  const select=document.getElementById("personajeProgreso");
  const nombre=document.getElementById("personajeSeleccionadoResumen");
  const icono=document.getElementById("personajeSeleccionadoIcono");
  if(!select||!nombre||!icono)return;
  const p=PERSONAJES_UI[select.value]||PERSONAJES_UI.hombre;
  nombre.textContent=p.nombre;
  if(select.value==="pantera"){
    const img=document.querySelector('#galeriaPersonajes [data-personaje="pantera"] img');
    icono.innerHTML=img?`<img src="${img.src}" alt="">`:"🐈";
    icono.classList.add("es-pantera");
  }else{
    icono.textContent=p.icono;
    icono.classList.remove("es-pantera");
  }
}
function configurarDesplegablePersonaje(){
  const boton=document.getElementById("abrirSelectorPersonaje");
  const panel=document.getElementById("selectorPersonajeDesplegable");
  const select=document.getElementById("personajeProgreso");
  const galeria=document.getElementById("galeriaPersonajes");
  if(!boton||!panel||!select||!galeria)return;
  boton.onclick=()=>{
    const abrir=panel.hidden;
    panel.hidden=!abrir;
    boton.setAttribute("aria-expanded",String(abrir));
  };
  galeria.addEventListener("click",e=>{
    const item=e.target.closest("[data-personaje]");
    if(!item)return;
    setTimeout(()=>{
      actualizarResumenPersonaje();
      panel.hidden=true;
      boton.setAttribute("aria-expanded","false");
    },40);
  });
  select.addEventListener("change",actualizarResumenPersonaje);
  actualizarResumenPersonaje();
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(configurarDesplegablePersonaje,130));
