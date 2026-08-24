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
    preferencias: "miServicio.preferencias"
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

    preferencias: {
        tipoPublicador: "publicador",
        objetivoMensualMinutos: 0
    },

    registroPendienteBorrar: null,

    estadisticas: {
        periodo: "semana",
        fechaReferencia: new Date()
    }
};
// =========================================================
// NAVEGACIÓN ENTRE PANTALLAS
// =========================================================

function configurarNavegacion() {
    const botones = document.querySelectorAll(".nav-item");

    botones.forEach((boton) => {
        boton.addEventListener("click", () => {
            const vista = boton.dataset.vista;

            if (!vista) return;

            cambiarVista(vista);
        });
    });
}

function cambiarVista(vista) {
    document.querySelectorAll(".vista").forEach((elemento) => {
        elemento.classList.remove("activa");
    });

    document.querySelectorAll(".nav-item").forEach((boton) => {
        boton.classList.remove("activo");
    });

    const nuevaVista = document.getElementById(`vista-${vista}`);

    if (nuevaVista) {
        nuevaVista.classList.add("activa");
        estado.vistaActual = vista;
    }

    const botonActivo = document.querySelector(
        `.nav-item[data-vista="${vista}"]`
    );

    if (botonActivo) {
        botonActivo.classList.add("activo");
    }
}
// =========================================================
// INICIO DE LA APLICACIÓN
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarDatos();

        configurarNavegacion();

        configurarSelectorActividad();

        configurarFormulario();

        configurarHistorial();

        configurarFiltrosHistorial();

        configurarEstadisticas();

        configurarAjustes();

        configurarSincronizacionIPhone();

        establecerFechaActual();
        
        establecerFechaActual();
        
        seleccionarActividad(
            "ministerio"
        );

        cargarFormularioAjustes();

        actualizarTodaLaInterfaz();

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

    estado.preferencias =
        leerJSON(
            STORAGE_KEYS.preferencias,
            {
                tipoPublicador:
                    "publicador",

                objetivoMensualMinutos:
                    0
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

            objetivoMensualMinutos:
                0
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

    return guardarJSON(
        STORAGE_KEYS.registros,
        estado.registros
    );
}


// =========================================================
// GUARDAR PREFERENCIAS
// =========================================================

function guardarPreferencias() {

    return guardarJSON(
        STORAGE_KEYS.preferencias,
        estado.preferencias
    );
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
            }
        );


    // -----------------------------------------
    // Mostrar la seleccionada
    // -----------------------------------------

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

    formulario.addEventListener(
        "submit",
        evento => {

            evento.preventDefault();

            registrarActividad();
        }
    );
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

    campoNotas.value =
        "";


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

        return [
            ...estado.registros
        ];
    }


    return estado.registros.filter(
        registro => {

            return (
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
        "registro-card";


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


    tarjeta.append(
        icono,
        contenido,
        botonBorrar
    );


    return tarjeta;
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


    // -----------------------------------------
    // Mostrar resultados
    // -----------------------------------------

    ponerTexto(
        "totalMes",
        formatearTiempo(
            total
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
            otras === 0
        );
    }


    // -----------------------------------------
    // Objetivo mensual
    // -----------------------------------------

    actualizarObjetivo(
        ministerio
    );
    actualizarGraficoInicio();
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
// El objetivo se calcula únicamente con las horas
// de MINISTERIO.
//
// LDC, Asambleas y Otras actividades continúan
// apareciendo en los totales, pero no incrementan
// el objetivo mensual de ministerio.
// =========================================================

function actualizarObjetivo(
    totalMinisterioMes
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
                    totalMinisterioMes /
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
            totalMinisterioMes
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
            totalMinisterioMes > 0
                ? "Configura un objetivo mensual en Ajustes."
                : "Empieza registrando tu primera actividad de ministerio.";

        return;
    }


    // -----------------------------------------
    // Objetivo alcanzado
    // -----------------------------------------

    if (
        totalMinisterioMes >=
        objetivo
    ) {

        const superado =
            totalMinisterioMes -
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
        totalMinisterioMes;


    mensaje.textContent =
        `Te faltan ${formatearTiempo(restante)} para alcanzar tu objetivo.`;
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


        case "anio":

            fecha.setMonth(0);
            fecha.setDate(1);

            fecha.setFullYear(
                fecha.getFullYear() +
                direccion
            );

            break;
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

    const anio =
        fecha.getFullYear();


    return {

        inicio:
            new Date(
                anio,
                0,
                1,
                0,
                0,
                0,
                0
            ),


        fin:
            new Date(
                anio,
                11,
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

        const anio =
            rango.inicio
                .getFullYear();


        titulo =
            esAnioActual(
                rango.inicio
            )
                ? "Este año"
                : "Año";


        textoRango =
            String(
                anio
            );
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
    fecha
) {

    return (
        new Date()
            .getFullYear() ===
        fecha.getFullYear()
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
        "E",
        "F",
        "M",
        "A",
        "M",
        "J",
        "J",
        "A",
        "S",
        "O",
        "N",
        "D"
    ];


    const hoy =
        new Date();


    const anio =
        inicioAnio
            .getFullYear();


    const datos = [];


    for (
        let mes = 0;
        mes < 12;
        mes++
    ) {

        const inicio =
            new Date(
                anio,
                mes,
                1,
                0,
                0,
                0,
                0
            );


        const fin =
            new Date(
                anio,
                mes + 1,
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
                nombres[mes],

            minutos:
                sumarMinutos(
                    registros
                ),

            destacado:
                hoy.getFullYear() ===
                    anio
                &&
                hoy.getMonth() ===
                    mes
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


    if (!seccion) {
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


    const anio =
        rangoAnual.inicio
            .getFullYear();


    ponerTexto(
        "anioTrimestres",
        String(
            anio
        )
    );


    for (
        let trimestre = 1;
        trimestre <= 4;
        trimestre++
    ) {

        actualizarTrimestre(
            trimestre,
            anio
        );
    }
}


// =========================================================
// ACTUALIZAR TRIMESTRE
// =========================================================

function actualizarTrimestre(
    numero,
    anio
) {

    const mesInicio =
        (numero - 1) * 3;


    const inicio =
        new Date(
            anio,
            mesInicio,
            1,
            0,
            0,
            0,
            0
        );


    const fin =
        new Date(
            anio,
            mesInicio + 3,
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


    // Ministerio separado

    const ministerio =
        sumarMinutos(
            registros.filter(
                registro =>
                    registro.tipo ===
                    "ministerio"
            )
        );


    // LDC + Asambleas + Otras

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


    ponerTexto(
        `trimestre${numero}Total`,
        formatearTiempo(
            total
        )
    );


    ponerTexto(
        `trimestre${numero}Ministerio`,
        formatearTiempo(
            ministerio
        )
    );


    ponerTexto(
        `trimestre${numero}Otras`,
        formatearTiempo(
            otrasActividades
        )
    );
}


// =========================================================
// FIN BLOQUE 4
// =========================================================

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


    if (tipo) {

        tipo.value =
            estado.preferencias
                .tipoPublicador ||
            "publicador";
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
        !objetivo
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


    const mensaje =
        document.getElementById(
            "mensajeAjustes"
        );


    if (
        !tipo ||
        !objetivo
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


    estado.preferencias = {

        tipoPublicador:
            tipo.value,

        objetivoMensualMinutos:
            Math.round(
                horas * 60
            )
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


    actualizarInicio();
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
            2,

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
            1,

        exportadoEn:
            new Date().toISOString(),

        registros:
            estado.registros,

        preferencias:
            estado.preferencias
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


        // Guardamos una copia temporal
        // por si falla localStorage.

        const registrosAnteriores =
            estado.registros;


        const preferenciasAnteriores =
            estado.preferencias;


        estado.registros =
            registrosImportados;


        estado.preferencias =
            preferenciasImportadas;


        const registrosGuardados =
            guardarRegistros();


        const preferenciasGuardadas =
            guardarPreferencias();


        if (
            !registrosGuardados ||
            !preferenciasGuardadas
        ) {

            estado.registros =
                registrosAnteriores;


            estado.preferencias =
                preferenciasAnteriores;


            guardarRegistros();
            guardarPreferencias();


            mostrarMensajeFormulario(
                mensaje,
                "No se pudieron guardar los datos importados.",
                true
            );

            return;
        }


        cargarFormularioAjustes();


        actualizarTodaLaInterfaz();


        mostrarMensajeFormulario(
            mensaje,
            `Copia importada correctamente: ${textoCantidadRegistros(registrosImportados.length)} ✓`,
            false
        );

    } catch (error) {

        console.error(
            "Error al importar:",
            error
        );


        mostrarMensajeFormulario(
            mensaje,
            "No se pudo leer la copia de seguridad.",
            true
        );
    }
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

        objetivoMensualMinutos:
            objetivo
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
// ACTUALIZACIÓN GENERAL
// =========================================================

function actualizarTodaLaInterfaz() {

    actualizarInicio();

    renderizarHistorial();

    actualizarEstadisticas();
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
// GRÁFICO DE PROGRESO EN INICIO
// =========================================================

function actualizarGraficoInicio() {
    const grafico = document.getElementById("graficoInicio");
    const leyenda = document.getElementById("leyendaGraficoInicio");

    if (!grafico || !leyenda) return;

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    const registrosMes = estado.registros.filter(registro => {
        const fecha = new Date(registro.fecha + "T12:00:00");

        return (
            fecha.getMonth() === mesActual &&
            fecha.getFullYear() === anioActual
        );
    });

    const tipos = [
        { id: "ministerio", nombre: "Ministerio" },
        { id: "ldc", nombre: "LDC" },
        { id: "asambleas", nombre: "Asambleas" },
        { id: "otras", nombre: "Otras" }
    ];

    const datos = tipos.map(tipo => {
        const minutos = registrosMes
            .filter(registro =>
                normalizarTipoSincronizacion(registro.tipo) === tipo.id
            )
            .reduce((total, registro) => {
                return total + Number(registro.minutos || 0);
            }, 0);

        return {
            ...tipo,
            minutos
        };
    });

    // Ministerio siempre aparece.
    // Las demás actividades solo aparecen si tienen tiempo registrado.
    const visibles = datos.filter(
        dato => dato.id === "ministerio" || dato.minutos > 0
    );

    const maximo = Math.max(
        ...visibles.map(dato => dato.minutos),
        1
    );

    grafico.innerHTML = "";
    leyenda.innerHTML = "";

    visibles.forEach(dato => {
        const barra = document.createElement("div");
        barra.className = "grafico-inicio-barra";

        const altura =
            dato.minutos === 0
                ? 6
                : Math.max(12, (dato.minutos / maximo) * 150);

        barra.style.height = `${altura}px`;
        barra.title = `${dato.nombre}: ${formatoTiempo(dato.minutos)}`;

        grafico.appendChild(barra);

        const texto = document.createElement("div");
        texto.innerHTML =
            `<strong>${formatoTiempo(dato.minutos)}</strong><br>${dato.nombre}`;

        leyenda.appendChild(texto);
    });
}

// =========================================================
// FORMATO DE TIEMPO PARA GRÁFICO DE INICIO
// =========================================================

function formatoTiempo(minutos) {
    const total = Math.max(0, Number(minutos) || 0);
    const horas = Math.floor(total / 60);
    const mins = total % 60;

    if (horas === 0) {
        return `${mins} min`;
    }

    if (mins === 0) {
        return `${horas} h`;
    }

    return `${horas} h ${mins} min`;
}
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        actualizarGraficoInicio();
    }, 300);
});

// =========================================================
// GRÁFICO CIRCULAR DE PROGRESO - INICIO
// =========================================================

function actualizarGraficoInicio() {

    const grafico =
        document.getElementById("graficoInicio");

    const leyenda =
        document.getElementById("leyendaGraficoInicio");


    if (
        !grafico ||
        !leyenda
    ) {
        return;
    }


    // -----------------------------------------------------
    // Registros del mes actual
    // -----------------------------------------------------

    const hoy =
        new Date();


    const registrosMes =
        estado.registros.filter(
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


    // -----------------------------------------------------
    // Totales por actividad
    // -----------------------------------------------------

    const datos = [

        {
            id: "ministerio",
            nombre: "Ministerio",
            minutos: sumarMinutos(
                registrosMes.filter(
                    registro =>
                        registro.tipo ===
                        "ministerio"
                )
            ),
            clase: "grafico-color-ministerio"
        },

        {
            id: "ldc",
            nombre: "LDC",
            minutos: sumarMinutos(
                registrosMes.filter(
                    registro =>
                        registro.tipo ===
                        "ldc"
                )
            ),
            clase: "grafico-color-ldc"
        },

        {
            id: "asambleas",
            nombre: "Asambleas",
            minutos: sumarMinutos(
                registrosMes.filter(
                    registro =>
                        registro.tipo ===
                        "asambleas"
                )
            ),
            clase: "grafico-color-asambleas"
        },

        {
            id: "otras",
            nombre: "Otras",
            minutos: sumarMinutos(
                registrosMes.filter(
                    registro =>
                        registro.tipo ===
                        "otras"
                )
            ),
            clase: "grafico-color-otras"
        }
    ];


    // -----------------------------------------------------
    // Ocultar actividades sin horas
    // Ministerio sí aparece siempre
    // -----------------------------------------------------

    const visibles =
        datos.filter(
            dato =>
                dato.id === "ministerio" ||
                dato.minutos > 0
        );


    const total =
        sumarMinutos(
            registrosMes
        );


    // -----------------------------------------------------
    // Crear segmentos del círculo
    // -----------------------------------------------------

    let gradosAcumulados = 0;

    const segmentos = [];


    visibles.forEach(
        dato => {

            const grados =
                total > 0
                    ? (
                        dato.minutos /
                        total
                    ) * 360
                    : 0;


            const inicio =
                gradosAcumulados;


            const fin =
                gradosAcumulados +
                grados;


            let color = "var(--primary)";


            switch (
                dato.id
            ) {

                case "ldc":
                    color = "var(--ldc)";
                    break;

                case "asambleas":
                    color = "var(--assembly)";
                    break;

                case "otras":
                    color = "var(--other)";
                    break;
            }


            if (
                dato.minutos > 0
            ) {

                segmentos.push(
                    `${color} ${inicio}deg ${fin}deg`
                );
            }


            gradosAcumulados =
                fin;
        }
    );


    // -----------------------------------------------------
    // Estado sin actividad
    // -----------------------------------------------------

    if (
        segmentos.length === 0
    ) {

        segmentos.push(
            "rgba(120,120,128,0.15) 0deg 360deg"
        );
    }


    // -----------------------------------------------------
    // Dibujar gráfico
    // -----------------------------------------------------

    grafico.innerHTML = `
        <div
            class="grafico-inicio-anillo"
            style="background: conic-gradient(${segmentos.join(",")});"
        ></div>

        <div class="grafico-inicio-centro">

            <p class="grafico-inicio-total">
                ${formatearTiempo(total)}
            </p>

            <span class="grafico-inicio-texto">
                Total del mes
            </span>

        </div>
    `;


    // -----------------------------------------------------
    // Leyenda
    // -----------------------------------------------------

    leyenda.innerHTML =
        "";


    visibles.forEach(
        dato => {

            if (
                dato.id !== "ministerio" &&
                dato.minutos <= 0
            ) {
                return;
            }


            const fila =
                document.createElement(
                    "div"
                );


            fila.className =
                "leyenda-grafico-fila";


            fila.innerHTML = `
                <div class="leyenda-grafico-nombre">

                    <span
                        class="leyenda-grafico-punto ${dato.clase}"
                    ></span>

                    <span>
                        ${dato.nombre}
                    </span>

                </div>

                <strong class="leyenda-grafico-tiempo">
                    ${formatearTiempo(dato.minutos)}
                </strong>
            `;


            leyenda.appendChild(
                fila
            );
        }
    );
}
