/* =========================================================
   MI SERVICIO · ÍNDICE DE MANTENIMIENTO · V93
   =========================================================
   Este archivo sigue siendo único para no arriesgar datos ni comportamiento.
   A partir de aquí las mejoras se localizarán por bloques funcionales:

   01 · Configuración, constantes y almacenamiento
   02 · Navegación y vistas
   03 · Inicio y progreso mensual
   04 · Registro de actividad
   05 · Calendario y planificación
   06 · Historial
   07 · Estadísticas
   08 · Meta / año de servicio
   09 · Ajustes y preferencias
   10 · Copias de seguridad / importación / exportación
   11 · OneDrive
   12 · Tiempo
   13 · Personajes y animaciones
   14 · Inicialización y eventos

   IMPORTANTE:
   V93 NO cambia lógica, datos ni nombres públicos.
   Es una primera fase de organización segura antes de modularizar.
   ========================================================= */

/* V103 · Historial fase 3
   historial.js ya ofrece filtrado por actividad y búsqueda como funciones puras.
   El renderizado, edición y borrado permanecen en este archivo hasta validar filtros.
*/

/* V102 · Historial: utilidades puras disponibles en window.MiServicioHistorial.
   Las implementaciones heredadas permanecen como fallback durante la validación. */

/* V96 · Integración progresiva de storage
   Estos adaptadores usan el módulo core/storage.js cuando está disponible.
   Mantienen exactamente el mismo formato JSON y las mismas claves.
*/
function msStorageLeer(clave, valorPorDefecto = null) {
    if (window.MiServicioStorage) {
        return window.MiServicioStorage.leer(clave, valorPorDefecto);
    }
    try {
        const contenido = localStorage.getItem(clave);
        return contenido === null ? valorPorDefecto : JSON.parse(contenido);
    } catch (error) {
        console.error(`[Mi Servicio] No se pudo leer "${clave}"`, error);
        return valorPorDefecto;
    }
}

function msStorageGuardar(clave, valor) {
    if (window.MiServicioStorage) {
        return window.MiServicioStorage.guardar(clave, valor);
    }
    try {
        msStorageGuardar(clave, valor);
        return true;
    } catch (error) {
        console.error(`[Mi Servicio] No se pudo guardar "${clave}"`, error);
        return false;
    }
}


/* V94 · Primer módulo real
   core/config.js se carga como ES6 antes de este archivo.
   Durante esta fase app-v27.js conserva sus constantes originales para garantizar
   compatibilidad exacta; las iremos sustituyendo por MiServicioConfig una a una.
*/

/* V95 · Capa de almacenamiento modular
   core/storage.js expone window.MiServicioStorage.
   En esta fase no se cambian todavía las llamadas antiguas a localStorage:
   primero validamos que el módulo carga correctamente y después migraremos
   cada bloque funcional sin modificar las claves ni el formato de los datos.
*/



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

            msStorageGuardar(clave, valor);

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
        !["hombre","mujer","koala","mariposa","pantera","tortuga","liebre","corazon","pajarito","gatito"].includes(
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

/* V109: normalizarRegistros → registrar.js */



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

/* V109: guardarRegistros → registrar.js */



// =========================================================
// GUARDAR PREFERENCIAS
// =========================================================

/* V112: guardarPreferencias → ajustes.js */



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
/* V109: configurarCursosBiblicos → registrar.js */


/* V109: obtenerCursosBiblicosFormulario → registrar.js */


/* V109: reiniciarCursosBiblicos → registrar.js */


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

/* V109: prepararPantallaRegistrar → registrar.js */



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

/* V109: registrarActividad → registrar.js */



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

/* V109: obtenerRegistrosFiltrados → registrar.js */



// =========================================================
// RENDERIZAR HISTORIAL
// =========================================================

/* V105: renderizarHistorial trasladada a historial-render.js */



// =========================================================
// AGRUPAR REGISTROS POR FECHA
// =========================================================

/* V105: agruparRegistrosPorFecha trasladada a historial-render.js */



// =========================================================
// TÍTULO DE FECHA DEL HISTORIAL
// =========================================================

/* V105: tituloFechaHistorial trasladada a historial-render.js */



// =========================================================
// ESTADO VACÍO DEL HISTORIAL
// =========================================================

/* V105: actualizarEstadoVacioHistorial trasladada a historial-render.js */



// =========================================================
// CREAR TARJETA DEL HISTORIAL
// =========================================================

/* V105: crearTarjetaHistorial trasladada a historial-render.js */



// =========================================================
// EDICIÓN DE REGISTROS
// =========================================================

/* V106: configurarEdicionRegistros trasladada a historial-edicion.js */



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


/* V106: guardarEdicionRegistro trasladada a historial-edicion.js */



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

/* V106: confirmarEliminarRegistro trasladada a historial-edicion.js */



// =========================================================
// ORDENAR REGISTROS
// =========================================================

/* V109: compararRegistrosPorFecha → registrar.js */



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

/* V111: actualizarInicio → inicio.js */



// =========================================================
// FRASE DE ÁNIMO DINÁMICA EN INICIO
// =========================================================
/* V111: actualizarFraseAnimoInicio → inicio.js */


// =========================================================
// CAMBIAR FRASE AL VOLVER A ENTRAR EN LA APP
// =========================================================
let ultimoCambioFraseEntrada = 0;

/* V111: refrescarFraseAlVolverAInicio → inicio.js */


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

/* V110: configurarCalendarioInicio → planificacion.js */



/* V110: actualizarCalendarioInicio → planificacion.js */



/* V110: formatearTiempoCortoCalendario → planificacion.js */



/* V110: mostrarDetalleDiaCalendario → planificacion.js */





/* V110: normalizarAgendaDia → planificacion.js */



function formatoMinutosPlan(minutos) {
    const n=Math.max(0,Number(minutos)||0), h=Math.floor(n/60), m=n%60;
    return m ? `${h ? h+" h " : ""}${m} min` : (h ? `${h} h` : "");
}
/* V110: minutosPlanificadosMesActual → planificacion.js */

/* V110: claseActividadCalendario → planificacion.js */



// =========================================================
// AGENDA DE SALIDAS DEL MINISTERIO
// =========================================================

/* V110: agendarSalidaCalendario → planificacion.js */



/* V110: asegurarModalAgendaSalida → planificacion.js */



/* V110: abrirModalAgendaSalida → planificacion.js */



/* V110: cerrarModalAgendaSalida → planificacion.js */



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


/* V110: quitarSalidaAgendada → planificacion.js */



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
    const grafico = document.getElementById("graficoInicio");
    const leyenda = document.getElementById("leyendaGraficoInicio");
    const fechaProgreso = document.getElementById("fechaProgresoMes");

    if (fechaProgreso) {
        const hoy = new Date();
        fechaProgreso.textContent =
            `${String(hoy.getDate()).padStart(2, "0")}/` +
            `${String(hoy.getMonth() + 1).padStart(2, "0")}/` +
            `${hoy.getFullYear()}`;
    }
    if (!grafico || !leyenda) return;

    const actividades = [
        {
            tipo:"ministerio", nombre:"Ministerio", minutos:ministerio,
            icono:`<span class="sector-icono sector-libro"><span class="libro-sol">☀</span><small>DISFRUTE</small></span>`
        },
        {
            tipo:"ldc", nombre:"LDC", minutos:ldc,
            icono:`<span class="sector-icono sector-emoji">🛠️</span>`
        },
        {
            tipo:"asambleas", nombre:"Asambleas", minutos:asambleas,
            icono:`<span class="sector-icono sector-auditorio"><i></i><i></i><i></i><i></i><i></i><i></i></span>`
        },
        {
            tipo:"otras", nombre:"Otras", minutos:otras,
            icono:`<span class="sector-icono sector-emoji">✨</span>`
        }
    ];

    const activas=actividades.filter(a=>a.minutos>0);
    const totalVisible=activas.reduce((s,a)=>s+a.minutos,0);

    if(!activas.length || totalVisible<=0){
        grafico.innerHTML=`
          <div class="orbita-centro orbita-centro-solo">
            <strong>0 min</strong><span>este mes</span>
          </div>`;
        leyenda.innerHTML=""; leyenda.hidden=true; return;
    }

    const posicionesPorCantidad={
      1:[{x:50,y:23}],
      2:[{x:27,y:50},{x:73,y:50}],
      3:[{x:50,y:20},{x:24,y:66},{x:76,y:66}],
      4:[{x:50,y:18},{x:82,y:50},{x:50,y:82},{x:18,y:50}]
    };
    const posiciones=posicionesPorCantidad[activas.length] || posicionesPorCantidad[4];

    const minPct=Math.min(...activas.map(a=>a.minutos/totalVisible*100));
    const maxPct=Math.max(...activas.map(a=>a.minutos/totalVisible*100));

    const circulos=activas.map((a,i)=>{
      const pctExact=a.minutos/totalVisible*100;
      const pct=Math.round(pctExact);
      // Escala visual clara pero controlada: 88–132 px según participación.
      const normalizado=maxPct===minPct ? .5 : (pctExact-minPct)/(maxPct-minPct);
      const tam=Math.round(88 + normalizado*44);
      const pos=posiciones[i];
      return `
        <div class="orbita-actividad orbita-${a.tipo}"
             style="--orb-x:${pos.x}%;--orb-y:${pos.y}%;--orb-size:${tam}px"
             aria-label="${a.nombre}: ${formatearTiempo(a.minutos)}, ${pct}%">
          ${a.icono}
          <strong>${a.nombre}</strong>
          <span>${formatearTiempo(a.minutos)}</span>
          <b>${pct}%</b>
        </div>`;
    }).join("");

    grafico.innerHTML=`
      <div class="orbita-grafico orbita-cantidad-${activas.length}">
        <div class="orbita-lineas" aria-hidden="true">
          <span class="orbita-trazo orbita-trazo-a"></span>
          <span class="orbita-trazo orbita-trazo-b"></span>
          <i class="orbita-punto orbita-punto-a"></i>
          <i class="orbita-punto orbita-punto-b"></i>
        </div>
        ${circulos}
        <div class="orbita-centro">
          <strong>${formatearTiempo(totalVisible)}</strong>
          <span>este mes</span>
        </div>
      </div>`;

    leyenda.innerHTML="";
    leyenda.hidden=true;
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

/* V109: obtenerRegistrosMesActual → registrar.js */



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

/* V111: actualizarPersonajeProgreso → inicio.js */



/* V111: actualizarHitosProgreso → inicio.js */



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

/* V108: configurarEstadisticas → estadisticas-render.js */



// =========================================================
// SELECCIONAR SEMANA / MES / AÑO
// =========================================================

/* V108: seleccionarPeriodoEstadisticas → estadisticas-render.js */



// =========================================================
// MOVER PERIODO
// =========================================================

/* V108: moverPeriodoEstadisticas → estadisticas-render.js */



// =========================================================
// ACTUALIZAR ESTADÍSTICAS
// =========================================================

/* V108: actualizarEstadisticas → estadisticas-render.js */



// =========================================================
// BARRAS DE ACTIVIDAD DE ESTADÍSTICAS
// =========================================================

/* V108: actualizarBarrasActividadEstadisticas → estadisticas-render.js */



// =========================================================
// OBTENER RANGO ACTUAL
// =========================================================

/* V108: obtenerRangoEstadisticas → estadisticas-render.js */



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

/* V109: obtenerRegistrosEntreFechas → registrar.js */



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

/* V108: actualizarTextoPeriodoEstadisticas → estadisticas-render.js */



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

/* V108: actualizarGraficoEstadisticas → estadisticas-render.js */



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


/* V110: sumarUnMesCalendario → planificacion.js */



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

/* V112: configurarAjustes → ajustes.js */



// =========================================================
// CARGAR AJUSTES EN EL FORMULARIO
// =========================================================

/* V112: cargarFormularioAjustes → ajustes.js */



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

/* V112: guardarAjustesDesdeFormulario → ajustes.js */


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

/* V109: normalizarRegistrosImportados → registrar.js */



// =========================================================
// NORMALIZAR PREFERENCIAS IMPORTADAS
// =========================================================

/* V112: normalizarPreferenciasImportadas → ajustes.js */



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

/* V109: filtrarRegistrosVisibles → registrar.js */


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

/* V109: textoCantidadRegistros → registrar.js */



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

        msStorageGuardar(STORAGE_KEYS.registros, registros);

        msStorageGuardar(STORAGE_KEYS.preferencias, preferencias);

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

/* V108: actualizarEstadoOneDrive → estadisticas-render.js */


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

/* V109: registrarSincronizacionOneDrive → registrar.js */


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

/* V111: calcularComputoMesMeta → inicio.js */


/* V111: calcularComputoAnualMeta → inicio.js */



// =========================================================
// META DEL AÑO DE SERVICIO
// =========================================================

/* V111: actualizarMeta → inicio.js */


/* V111: textoTiempoRestanteMeta → inicio.js */


/* V111: configurarInteraccionAnillosProgreso → inicio.js */

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
        if(!["hombre","mujer","koala","mariposa","pantera","tortuga","liebre","corazon","pajarito","gatito"].includes(valor))return;
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
  liebre:{nombre:"Liebre",icono:"🐇"},
  corazon:{nombre:"Corazón",icono:"❤️"},
  pajarito:{nombre:"Pajarito",icono:"🐥"},
  gatito:{nombre:"Gatito",icono:"🐱"}
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


/* V104 · Registro del renderizador estable en el módulo Historial.
   No modifica el renderizado actual; únicamente crea el punto de desacoplamiento. */
function conectarRenderizadorHistorialModular(){
    if (window.MiServicioHistorial &&
        typeof window.MiServicioHistorial.registrarRenderizador === "function" &&
        typeof renderizarHistorial === "function") {
        window.MiServicioHistorial.registrarRenderizador(renderizarHistorial);
    }
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", conectarRenderizadorHistorialModular, { once:true });
} else {
    conectarRenderizadorHistorialModular();
}
