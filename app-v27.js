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
        personaje.innerHTML = '<img class="personaje-cuerpo-img" src="data:image/jpeg;base64,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" alt="Pantera rosa">';
    } else if (personajeElegido === "koala") {
        personaje.innerHTML = '<img class="personaje-cuerpo-img" src="data:image/jpeg;base64,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" alt="Koala">';
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
  if(select.value==="pantera" || select.value==="koala"){
    const img=document.querySelector(`#galeriaPersonajes [data-personaje="${select.value}"] img`);
    icono.innerHTML=img?`<img src="${img.src}" alt="">`:p.icono;
    icono.classList.add("es-personaje-imagen");
  }else{
    icono.textContent=p.icono;
    icono.classList.remove("es-personaje-imagen");
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
