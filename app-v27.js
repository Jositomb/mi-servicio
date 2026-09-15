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

    const imagenesPersonaje={hombre:"data:image/jpeg;base64,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",mujer:"data:image/jpeg;base64,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",koala:"data:image/jpeg;base64,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",mariposa:"data:image/jpeg;base64,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",pantera:"data:image/jpeg;base64,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",tortuga:"data:image/jpeg;base64,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",liebre:"data:image/jpeg;base64,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"};
    personaje.innerHTML = `<img class="personaje-cuerpo-img" src="${imagenesPersonaje[personajeElegido] || imagenesPersonaje.hombre}" alt="">`;
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

    if (!["hombre","mujer","koala","mariposa","pantera","tortuga","liebre"].includes(personaje.value)) {

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
        if(typeof actualizarResumenPersonaje==="function") actualizarResumenPersonaje();
    };
    galeria.onclick=e=>{
        const b=e.target.closest("button[data-personaje]");
        if(!b)return;
        e.preventDefault();
        const valor=b.dataset.personaje;
        if(!["hombre","mujer","koala","mariposa","pantera","tortuga","liebre"].includes(valor))return;
        select.value=valor;
        select.dispatchEvent(new Event("change",{bubbles:true}));
        pintar();
        const anterior=estado.preferencias.personajeProgreso;
        estado.preferencias.personajeProgreso=valor;
        const objetivo=Number(estado.preferencias.objetivoMensualMinutos)||1;
        const hoy=new Date();
        const regs=(estado.registros||[]).filter(r=>{
            const d=new Date(r.fecha+"T12:00:00");
            return d.getFullYear()===hoy.getFullYear()&&d.getMonth()===hoy.getMonth();
        });
        actualizarPersonajeProgreso(Math.min(100,(sumarMinutos(regs)/objetivo)*100));
        estado.preferencias.personajeProgreso=anterior;
    };
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
  const img=document.querySelector(`#galeriaPersonajes [data-personaje="${select.value}"] img`);
  icono.innerHTML=img?`<img src="${img.src}" alt="">`:p.icono;
  icono.classList.add("es-personaje-imagen");
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
