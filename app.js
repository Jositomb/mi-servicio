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
    cursosBiblicos: "miServicio.cursosBiblicos"
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

    cursosBiblicos: 0,

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
// INICIO DE LA APLICACIÓN
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarDatos();

        configurarNavegacion();

        configurarSelectorActividad();

        configurarFormulario();

        configurarCursosBiblicos();

        configurarHistorial();

        configurarFiltrosHistorial();

        configurarEstadisticas();

        configurarAjustes();

        configurarSincronizacionIPhone();

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

    estado.cursosBiblicos =
        Math.max(
            0,
            Math.round(
                Number(
                    leerJSON(
                        STORAGE_KEYS.cursosBiblicos,
                        0
                    )
                ) || 0
            )
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


                    // ID

                    if (
                        !normalizado.id
                    ) {

                        normalizado.id =
                            crearID();

                        huboCambios =
                            true;
                    }


                    // Fecha

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


                    // Tipo

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


                    // Minutos

                    const minutos =
                        Math.max(
                            Math.round(
                                Number(
                                    normalizado.minutos
                                ) || 0
                            ),
                            0
                        );


                    normalizado.minutos =
                        minutos;


                    // Notas

                    normalizado.notas =
                        String(
                            normalizado.notas ||
                            ""
                        );


                    // Fecha de creación

                    if (
                        !normalizado.creadoEn
                    ) {

                        normalizado.creadoEn =
                            new Date()
                                .toISOString();

                        huboCambios =
                            true;
                    }


                    // Última modificación

                    if (
                        !normalizado.modificadoEn
                    ) {

                        normalizado.modificadoEn =
                            normalizado.creadoEn;

                        huboCambios =
                            true;
                    }


                    // Sincronización

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
// LEER / GUARDAR JSON
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


function guardarJSON(
    clave,
    valor
) {

    return almacenamiento.guardar(
        clave,
        valor
    );
}


function guardarRegistros() {

    return guardarJSON(
        STORAGE_KEYS.registros,
        estado.registros
    );
}


function guardarPreferencias() {

    return guardarJSON(
        STORAGE_KEYS.preferencias,
        estado.preferencias
    );
}


// =========================================================
// CURSOS BÍBLICOS
// =========================================================

function guardarCursosBiblicos() {

    return guardarJSON(
        STORAGE_KEYS.cursosBiblicos,
        estado.cursosBiblicos
    );
}


function configurarCursosBiblicos() {

    const botonMenos =
        document.getElementById(
            "cursoBiblicoMenos"
        );

    const botonMas =
        document.getElementById(
            "cursoBiblicoMas"
        );


    if (botonMenos) {

        botonMenos.addEventListener(
            "click",
            () => {

                cambiarCursosBiblicos(
                    -1
                );
            }
        );
    }


    if (botonMas) {

        botonMas.addEventListener(
            "click",
            () => {

                cambiarCursosBiblicos(
                    1
                );
            }
        );
    }


    actualizarCursosBiblicos();
}


function cambiarCursosBiblicos(
    cantidad
) {

    estado.cursosBiblicos =
        Math.max(
            0,
            estado.cursosBiblicos +
                cantidad
        );


    guardarCursosBiblicos();

    actualizarCursosBiblicos();


    if (
        navigator.vibrate &&
        typeof navigator.vibrate ===
            "function"
    ) {

        navigator.vibrate(
            20
        );
    }
}


function actualizarCursosBiblicos() {

    ponerTexto(
        "cantidadCursosBiblicos",
        String(
            estado.cursosBiblicos
        )
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


    estado.vistaActual =
        vista;


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


    vistaElemento
        .classList
        .add(
            "activa"
        );


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


    switch (vista) {

        case "inicio":

            actualizarInicio();

            break;


        case "registrar":

            prepararPantallaRegistrar();

            actualizarCursosBiblicos();

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


    // Cursos bíblicos solo pertenecen al Ministerio.

    const seccionCursos =
        document.getElementById(
            "seccionCursosBiblicos"
        );


    if (seccionCursos) {

        seccionCursos.classList.toggle(
            "oculto",
            tipo !== "ministerio"
        );
    }
}


// =========================================================
// FORMULARIO
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


    const tipo =
        document.getElementById(
            "tipoRegistro"
        )?.value ||
        "ministerio";


    seleccionarActividad(
        tipo
    );
}


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


    if (!fecha) {

        mostrarMensajeFormulario(
            mensaje,
            "Selecciona una fecha.",
            true
        );

        return;
    }


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


    const totalMinutos =
        minutosTotales(
            horas,
            minutos
        );


    if (
        totalMinutos <= 0
    ) {

        mostrarMensajeFormulario(
            mensaje,
            "Introduce un tiempo mayor que cero.",
            true
        );

        return;
    }


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

    cursosBiblicos:
        tipo === "ministerio"
            ? Math.max(
                0,
                Number(
                    estado.cursosBiblicos
                ) || 0
            )
            : 0,        
        
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


    mostrarMensajeFormulario(
        mensaje,
        "Actividad guardada ✓",
        false
    );


    actualizarTodaLaInterfaz();


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
// FIN PARTE 1/4
// =========================================================
// =========================================================
// PARTE 2/4
// HISTORIAL + INICIO + OBJETIVO
// =========================================================


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


    const registros =
        obtenerRegistrosFiltrados()
            .sort(
                compararRegistrosPorFecha
            );


    contador.textContent =
        textoCantidadRegistros(
            registros.length
        );


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


    if (
        fechaLocalISO(fecha) ===
        fechaLocalISO(hoy)
    ) {

        return "Hoy";
    }


    if (
        fechaLocalISO(fecha) ===
        fechaLocalISO(ayer)
    ) {

        return "Ayer";
    }


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


    const contenido =
        document.createElement(
            "div"
        );


    contenido.className =
        "registro-contenido";


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
// MODAL DE BORRADO
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


function confirmarEliminarRegistro() {

    const id =
        estado.registroPendienteBorrar;


    if (!id) {

        cerrarModalBorrado();

        return;
    }


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
// INICIO
// =========================================================

function actualizarInicio() {

    actualizarNombreMes();


    const registrosMes =
        obtenerRegistrosMesActual();


    const total =
        sumarMinutos(
            registrosMes
        );


    const ministerio =
        sumarMinutos(
            registrosMes.filter(
                registro =>
                    registro.tipo ===
                    "ministerio"
            )
        );


    const ldc =
        sumarMinutos(
            registrosMes.filter(
                registro =>
                    registro.tipo ===
                    "ldc"
            )
        );


    const asambleas =
        sumarMinutos(
            registrosMes.filter(
                registro =>
                    registro.tipo ===
                    "asambleas"
            )
        );


    const otras =
        sumarMinutos(
            registrosMes.filter(
                registro =>
                    registro.tipo ===
                    "otras"
            )
        );


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


    actualizarObjetivo(
        ministerio
    );


    actualizarGraficoInicio();


    // Si en Inicio hemos añadido posteriormente
    // un indicador de cursos bíblicos, también
    // quedará actualizado automáticamente.

    ponerTexto(
        "totalCursosBiblicos",
        String(
            estado.cursosBiblicos
        )
    );
}


// =========================================================
// NOMBRE DEL MES
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
// REGISTROS DEL MES ACTUAL
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
// Solo cuenta MINISTERIO
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


    const porcentaje =
        objetivo > 0
            ? Math.round(
                (
                    totalMinisterioMes /
                    objetivo
                ) * 100
            )
            : 0;


    ponerTexto(
        "valorObjetivo",
        formatearTiempo(
            totalMinisterioMes
        )
    );


    ponerTexto(
        "porcentajeObjetivo",
        `${porcentaje}%`
    );


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


    const mensaje =
        document.getElementById(
            "mensajeObjetivo"
        );


    if (!mensaje) {
        return;
    }


    if (
        objetivo <= 0
    ) {

        mensaje.textContent =
            totalMinisterioMes > 0
                ? "Configura un objetivo mensual en Ajustes."
                : "Empieza registrando tu primera actividad de ministerio.";


        return;
    }


    if (
        totalMinisterioMes >=
        objetivo
    ) {

        const superado =
            totalMinisterioMes -
            objetivo;


        if (
            superado > 0
        ) {

            mensaje.textContent =
                `Objetivo alcanzado. Lo superas por ${formatearTiempo(superado)}.`;

        } else {

            mensaje.textContent =
                "Has alcanzado tu objetivo mensual.";
        }


        return;
    }


    const restante =
        objetivo -
        totalMinisterioMes;


    mensaje.textContent =
        `Te faltan ${formatearTiempo(restante)} para alcanzar tu objetivo.`;
}


// =========================================================
// GRÁFICO CIRCULAR DEL INICIO
// =========================================================

function actualizarGraficoInicio() {

    const grafico =
        document.getElementById(
            "graficoInicio"
        );


    const leyenda =
        document.getElementById(
            "leyendaGraficoInicio"
        );


    if (
        !grafico ||
        !leyenda
    ) {

        return;
    }


    const registrosMes =
        obtenerRegistrosMesActual();


    const datos = [

        {
            id:
                "ministerio",

            nombre:
                "Ministerio",

            minutos:
                sumarMinutos(
                    registrosMes.filter(
                        registro =>
                            registro.tipo ===
                            "ministerio"
                    )
                ),

            clase:
                "grafico-color-ministerio"
        },


        {
            id:
                "ldc",

            nombre:
                "LDC",

            minutos:
                sumarMinutos(
                    registrosMes.filter(
                        registro =>
                            registro.tipo ===
                            "ldc"
                    )
                ),

            clase:
                "grafico-color-ldc"
        },


        {
            id:
                "asambleas",

            nombre:
                "Asambleas",

            minutos:
                sumarMinutos(
                    registrosMes.filter(
                        registro =>
                            registro.tipo ===
                            "asambleas"
                    )
                ),

            clase:
                "grafico-color-asambleas"
        },


        {
            id:
                "otras",

            nombre:
                "Otras",

            minutos:
                sumarMinutos(
                    registrosMes.filter(
                        registro =>
                            registro.tipo ===
                            "otras"
                    )
                ),

            clase:
                "grafico-color-otras"
        }
    ];


    // Ministerio aparece siempre.
    // Las demás solo cuando tienen tiempo.

    const visibles =
        datos.filter(
            dato =>
                dato.id ===
                    "ministerio"
                ||
                dato.minutos > 0
        );


    const total =
        sumarMinutos(
            registrosMes
        );


    let gradosAcumulados =
        0;


    const segmentos =
        [];


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


            let color =
                "var(--primary)";


            switch (
                dato.id
            ) {

                case "ldc":

                    color =
                        "var(--ldc)";

                    break;


                case "asambleas":

                    color =
                        "var(--assembly)";

                    break;


                case "otras":

                    color =
                        "var(--other)";

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


    if (
        segmentos.length === 0
    ) {

        segmentos.push(
            "rgba(120,120,128,0.15) 0deg 360deg"
        );
    }


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


    leyenda.innerHTML =
        "";


    visibles.forEach(
        dato => {

            if (
                dato.id !==
                    "ministerio"
                &&
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


            const nombre =
                document.createElement(
                    "div"
                );


            nombre.className =
                "leyenda-grafico-nombre";


            const punto =
                document.createElement(
                    "span"
                );


            punto.className =
                `leyenda-grafico-punto ${dato.clase}`;


            const etiqueta =
                document.createElement(
                    "span"
                );


            etiqueta.textContent =
                dato.nombre;


            nombre.append(
                punto,
                etiqueta
            );


            const tiempo =
                document.createElement(
                    "strong"
                );


            tiempo.className =
                "leyenda-grafico-tiempo";


            tiempo.textContent =
                formatearTiempo(
                    dato.minutos
                );


            fila.append(
                nombre,
                tiempo
            );


            leyenda.appendChild(
                fila
            );
        }
    );
}


// =========================================================
// FIN PARTE 2/4
// =========================================================
// =========================================================
// PARTE 3/4
// ESTADÍSTICAS + PERIODOS + GRÁFICOS + TRIMESTRES
// =========================================================


// =========================================================
// CONFIGURAR ESTADÍSTICAS
// =========================================================

function configurarEstadisticas() {

    document
        .querySelectorAll(
            ".periodo-boton"
        )
        .forEach(
            boton => {

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
            }
        );


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


    estado.estadisticas.fechaReferencia =
        new Date();


    document
        .querySelectorAll(
            ".periodo-boton"
        )
        .forEach(
            boton => {

                boton.classList.toggle(
                    "activo",
                    boton.dataset.periodo ===
                        periodo
                );
            }
        );


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

            fecha.setDate(
                1
            );

            fecha.setMonth(
                fecha.getMonth() +
                direccion
            );

            break;


        case "anio":

            fecha.setMonth(
                0
            );

            fecha.setDate(
                1
            );

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
    // TOTALES
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
    // RESUMEN
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
    // PERIODO
    // -----------------------------------------------------

    actualizarTextoPeriodoEstadisticas(
        rango
    );


    // -----------------------------------------------------
    // GRÁFICO
    // -----------------------------------------------------

    actualizarGraficoEstadisticas(
        rango
    );


    // -----------------------------------------------------
    // TRIMESTRES
    // -----------------------------------------------------

    actualizarTrimestres(
        rango
    );
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
        fin.getDate() +
        6
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
        periodo ===
        "semana"
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
        periodo ===
        "mes"
    ) {

        const nombreMes =
            capitalizar(
                new Intl.DateTimeFormat(
                    "es-ES",
                    {
                        month:
                            "long"
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
                        month:
                            "long",

                        year:
                            "numeric"
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
        periodo ===
        "anio"
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


    if (
        mismoMes
    ) {

        const mes =
            new Intl.DateTimeFormat(
                "es-ES",
                {
                    month:
                        "long"
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
                day:
                    "numeric",

                month:
                    "short"
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
// ACTUALIZAR GRÁFICO DE ESTADÍSTICAS
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


    let datos =
        [];


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


    grafico.innerHTML =
        "";


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


    if (
        !tieneActividad
    ) {

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


    const datos =
        [];


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
            fecha.getDate() +
            i
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
                fechaISO ===
                hoy
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

    const datos =
        [];


    const ultimoDia =
        finMes.getDate();


    const hoy =
        new Date();


    let numeroSemana =
        1;


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


    const datos =
        [];


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

    grafico.innerHTML =
        "";


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


            const contenedor =
                document.createElement(
                    "div"
                );


            contenedor.className =
                "grafico-barra-contenedor";


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


    // Compatible con las dos versiones que hemos usado:
    // 1. Tarjetas ya creadas en HTML.
    // 2. Contenedor listaTrimestres generado por JS.

    const lista =
        document.getElementById(
            "listaTrimestres"
        );


    if (lista) {

        renderizarListaTrimestres(
            lista,
            anio
        );

        return;
    }


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
// RENDERIZAR LISTA DE TRIMESTRES
// =========================================================

function renderizarListaTrimestres(
    contenedor,
    anio
) {

    contenedor.innerHTML =
        "";


    const etiquetas = [
        "1 de enero – 31 de marzo",
        "1 de abril – 30 de junio",
        "1 de julio – 30 de septiembre",
        "1 de octubre – 31 de diciembre"
    ];


    for (
        let numero = 1;
        numero <= 4;
        numero++
    ) {

        const datos =
            obtenerDatosTrimestre(
                numero,
                anio
            );


        const tarjeta =
            document.createElement(
                "article"
            );


        tarjeta.className =
            "tarjeta trimestre-card";


        const cabecera =
            document.createElement(
                "div"
            );


        cabecera.className =
            "trimestre-cabecera";


        const bloqueTitulo =
            document.createElement(
                "div"
            );


        const titulo =
            document.createElement(
                "p"
            );


        titulo.className =
            "trimestre-titulo";


        titulo.textContent =
            `${numero}.º trimestre`;


        const fechas =
            document.createElement(
                "p"
            );


        fechas.className =
            "trimestre-fechas";


        fechas.textContent =
            etiquetas[
                numero - 1
            ];


        bloqueTitulo.append(
            titulo,
            fechas
        );


        const total =
            document.createElement(
                "strong"
            );


        total.className =
            "trimestre-total";


        total.textContent =
            formatearTiempo(
                datos.total
            );


        cabecera.append(
            bloqueTitulo,
            total
        );


        const separador =
            document.createElement(
                "div"
            );


        separador.className =
            "separador";


        const filaMinisterio =
            crearFilaTrimestre(
                "Ministerio",
                datos.ministerio
            );


        const filaOtras =
            crearFilaTrimestre(
                "Otras actividades",
                datos.otrasActividades
            );


        tarjeta.append(
            cabecera,
            separador,
            filaMinisterio,
            filaOtras
        );


        contenedor.appendChild(
            tarjeta
        );
    }
}


// =========================================================
// CREAR FILA DE TRIMESTRE
// =========================================================

function crearFilaTrimestre(
    nombre,
    minutos
) {

    const fila =
        document.createElement(
            "div"
        );


    fila.className =
        "fila-dato";


    const etiqueta =
        document.createElement(
            "span"
        );


    etiqueta.textContent =
        nombre;


    const valor =
        document.createElement(
            "strong"
        );


    valor.textContent =
        formatearTiempo(
            minutos
        );


    fila.append(
        etiqueta,
        valor
    );


    return fila;
}


// =========================================================
// DATOS DE UN TRIMESTRE
// =========================================================

function obtenerDatosTrimestre(
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


    return {

        ministerio,

        otrasActividades,

        total:
            ministerio +
            otrasActividades
    };
}


// =========================================================
// ACTUALIZAR TRIMESTRE
// Compatibilidad con HTML anterior
// =========================================================

function actualizarTrimestre(
    numero,
    anio
) {

    const datos =
        obtenerDatosTrimestre(
            numero,
            anio
        );


    ponerTexto(
        `trimestre${numero}Total`,
        formatearTiempo(
            datos.total
        )
    );


    ponerTexto(
        `trimestre${numero}Ministerio`,
        formatearTiempo(
            datos.ministerio
        )
    );


    ponerTexto(
        `trimestre${numero}Otras`,
        formatearTiempo(
            datos.otrasActividades
        )
    );
}


// =========================================================
// FIN PARTE 3/4
// =========================================================
// =========================================================
// PARTE 4/4
// AJUSTES + COPIAS + IPHONE + CURSOS BÍBLICOS + UTILIDADES
// =========================================================


// =========================================================
// CONFIGURAR AJUSTES
// =========================================================

function configurarAjustes() {

    const botonGuardar =
        document.getElementById(
            "guardarAjustes"
        );

    const tipoPublicador =
        document.getElementById(
            "tipoPublicador"
        );

    const botonExportar =
        document.getElementById(
            "exportarDatos"
        );

    const botonExportarIPhone =
        document.getElementById(
            "exportarIPhone"
        );

    const botonImportar =
        document.getElementById(
            "importarDatos"
        );

    const archivoImportacion =
        document.getElementById(
            "archivoImportacion"
        );


    if (botonGuardar) {

        botonGuardar.addEventListener(
            "click",
            guardarAjustesDesdeFormulario
        );
    }


    if (tipoPublicador) {

        tipoPublicador.addEventListener(
            "change",
            aplicarObjetivoSugerido
        );
    }


    if (botonExportar) {

        botonExportar.addEventListener(
            "click",
            exportarCopiaSeguridad
        );
    }


    if (botonExportarIPhone) {

        botonExportarIPhone.addEventListener(
            "click",
            exportarSincronizacionIPhone
        );
    }


    if (
        botonImportar &&
        archivoImportacion
    ) {

        botonImportar.addEventListener(
            "click",
            () => {

                archivoImportacion.value =
                    "";

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
// CARGAR AJUSTES
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
            Math.max(
                Number(
                    estado.preferencias
                        .objetivoMensualMinutos
                ) || 0,
                0
            );


        objetivo.value =
            String(
                minutos / 60
            );
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


    switch (tipo.value) {

        case "precursorRegular":

            objetivo.value =
                "50";

            break;


        case "precursorAuxiliar":

            objetivo.value =
                "15";

            break;


        case "publicador":

        default:

            const actual =
                Number(
                    objetivo.value
                );


            if (
                actual === 50 ||
                actual === 15
            ) {

                objetivo.value =
                    "0";
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
        !Number.isFinite(horas) ||
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


    estado.preferencias = {

        ...estado.preferencias,

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
// CURSOS BÍBLICOS
// =========================================================
//
// Esta parte guarda el número de cursos dirigidos
// junto con cada registro.
// Si el HTML contiene el campo "cursosBiblicos",
// se recogerá automáticamente.
// =========================================================

function obtenerCursosBiblicosFormulario() {

    const campo =
        document.getElementById(
            "cursosBiblicos"
        );


    if (!campo) {
        return 0;
    }


    const cantidad =
        Number(
            campo.value
        );


    if (
        !Number.isFinite(cantidad) ||
        cantidad < 0
    ) {

        return 0;
    }


    return Math.floor(
        cantidad
    );
}


// =========================================================
// TOTAL DE CURSOS BÍBLICOS DEL MES
// =========================================================

function obtenerCursosBiblicosMesActual() {

    const hoy =
        new Date();


    return estado.registros
        .filter(
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
        )
        .reduce(
            (
                total,
                registro
            ) => {

                return (
                    total +
                    Math.max(
                        Number(
                            registro.cursosBiblicos
                        ) || 0,
                        0
                    )
                );
            },
            0
        );
}


// =========================================================
// ACTUALIZAR CURSOS BÍBLICOS EN INICIO
// =========================================================

function actualizarCursosBiblicosInicio() {

    const elemento =
        document.getElementById(
            "totalCursosBiblicos"
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        String(
            obtenerCursosBiblicosMesActual()
        );
}


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
            new Date()
                .toISOString(),

        registros:
            estado.registros,

        preferencias:
            estado.preferencias
    };
}


// =========================================================
// DESCARGAR ARCHIVO JSON
// =========================================================

function descargarJSON(
    datos,
    nombreArchivo
) {

    try {

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


        enlace.href =
            url;

        enlace.download =
            nombreArchivo;

        enlace.style.display =
            "none";


        document.body.appendChild(
            enlace
        );


        enlace.click();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

                enlace.remove();

            },
            2000
        );


        return true;

    } catch (error) {

        console.error(
            "Error al descargar:",
            error
        );


        return false;
    }
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


    const datos =
        crearDatosCopiaSeguridad();


    const correcto =
        descargarJSON(
            datos,
            `Mi-Servicio-${fechaLocalISO(new Date())}.json`
        );


    mostrarMensajeFormulario(
        mensaje,
        correcto
            ? "Copia de seguridad preparada ✓"
            : "No se pudo crear la copia de seguridad.",
        !correcto
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

        const ahora =
            new Date()
                .toISOString();


        const registros =
            estado.registros
                .filter(
                    registro =>
                        Number(
                            registro.minutos
                        ) > 0
                )
                .map(
                    registro => {

                        const tipo =
                            normalizarTipoSincronizacion(
                                registro.tipo
                            );


                        const resultado = {

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

                            tipo,

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
                                "pendiente",

                            cursosBiblicos:
                                Math.max(
                                    Math.floor(
                                        Number(
                                            registro.cursosBiblicos
                                        ) || 0
                                    ),
                                    0
                                )
                        };


                        if (
                            tipo ===
                            "otras"
                        ) {

                            resultado
                                .actividadPersonalizadaID =
                                    registro
                                        .actividadPersonalizadaID ||
                                    null;


                            resultado
                                .nombreActividadPersonalizada =
                                    String(
                                        registro
                                            .nombreActividadPersonalizada ||
                                        registro
                                            .nombreActividad ||
                                        "Otra actividad"
                                    )
                                    .trim() ||
                                    "Otra actividad";
                        }


                        return resultado;
                    }
                )
                .filter(
                    registro =>
                        Boolean(
                            registro.fecha
                        )
                );


        const paquete = {

            version:
                2,

            generadoEn:
                ahora,

            registros
        };


        const correcto =
            descargarJSON(
                paquete,
                `Mi-Servicio-iPhone-${fechaLocalISO(new Date())}.json`
            );


        mostrarMensajeFormulario(
            mensaje,
            correcto
                ? `Archivo para iPhone preparado: ${textoCantidadRegistros(registros.length)} ✓`
                : "No se pudo preparar el archivo para iPhone.",
            !correcto
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
// CONVERTIR FECHA WEB A ISO8601
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


    const [
        anio,
        mes,
        dia
    ] =
        fechaTexto
            .split("-")
            .map(Number);


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
// NORMALIZAR FECHA DE SINCRONIZACIÓN
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
// NORMALIZAR TIPO PARA IPHONE
// =========================================================

function normalizarTipoSincronizacion(
    tipo
) {

    const tipos = [
        "ministerio",
        "ldc",
        "asambleas",
        "otras"
    ];


    return tipos.includes(
        tipo
    )
        ? tipo
        : "ministerio";
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
            !datos ||
            typeof datos !==
                "object" ||
            !Array.isArray(
                datos.registros
            )
        ) {

            throw new Error(
                "Formato incorrecto"
            );
        }


        const registros =
            datos.registros
                .filter(
                    registro =>
                        registro &&
                        typeof registro ===
                            "object"
                )
                .map(
                    registro => {

                        const ahora =
                            new Date()
                                .toISOString();


                        return {

                            ...registro,

                            id:
                                registro.id ||
                                crearID(),

                            fecha:
                                fechaISOValida(
                                    registro.fecha
                                )
                                    ? registro.fecha
                                    : fechaLocalISO(
                                        new Date()
                                    ),

                            tipo:
                                normalizarTipoSincronizacion(
                                    registro.tipo
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

                            notas:
                                String(
                                    registro.notas ||
                                    ""
                                ),

                            cursosBiblicos:
                                Math.max(
                                    Math.floor(
                                        Number(
                                            registro.cursosBiblicos
                                        ) || 0
                                    ),
                                    0
                                ),

                            creadoEn:
                                registro.creadoEn ||
                                ahora,

                            modificadoEn:
                                registro.modificadoEn ||
                                registro.creadoEn ||
                                ahora
                        };
                    }
                );


        estado.registros =
            registros;


        if (
            datos.preferencias &&
            typeof datos.preferencias ===
                "object"
        ) {

            estado.preferencias = {

                tipoPublicador:
                    [
                        "publicador",
                        "precursorAuxiliar",
                        "precursorRegular"
                    ].includes(
                        datos.preferencias
                            .tipoPublicador
                    )
                        ? datos.preferencias
                            .tipoPublicador
                        : "publicador",

                objetivoMensualMinutos:
                    Math.max(
                        Math.round(
                            Number(
                                datos.preferencias
                                    .objetivoMensualMinutos
                            ) || 0
                        ),
                        0
                    )
            };
        }


        guardarRegistros();
        guardarPreferencias();


        cargarFormularioAjustes();

        actualizarTodaLaInterfaz();


        mostrarMensajeFormulario(
            mensaje,
            `Copia importada correctamente: ${textoCantidadRegistros(registros.length)} ✓`,
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
// VALIDAR FECHA YYYY-MM-DD
// =========================================================

function fechaISOValida(
    texto
) {

    if (
        typeof texto !==
            "string"
    ) {
        return false;
    }


    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(texto)
    ) {

        return false;
    }


    const fecha =
        fechaDesdeISO(
            texto
        );


    return (
        !Number.isNaN(
            fecha.getTime()
        )
        &&
        fechaLocalISO(
            fecha
        ) === texto
    );
}


// =========================================================
// UTILIDADES
// =========================================================

function minutosTotales(
    horas,
    minutos
) {

    return Math.round(
        Math.max(
            Number(horas) || 0,
            0
        ) * 60
        +
        Math.max(
            Number(minutos) || 0,
            0
        )
    );
}


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
            total,
            registro
        ) =>
            total +
            Math.max(
                Number(
                    registro?.minutos
                ) || 0,
                0
            ),
        0
    );
}


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


    return `${horas} h ${minutos} min`;
}


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


    if (horas === 0) {

        return `${minutos}m`;
    }


    if (minutos === 0) {

        return `${horas}h`;
    }


    return `${horas}h${minutos}`;
}


function fechaDesdeISO(
    fechaISO
) {

    const partes =
        String(
            fechaISO || ""
        )
        .split("-")
        .map(Number);


    if (
        partes.length !== 3
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
        )
        .padStart(
            2,
            "0"
        );

    const dia =
        String(
            fecha.getDate()
        )
        .padStart(
            2,
            "0"
        );


    return `${anio}-${mes}-${dia}`;
}


function copiarFecha(
    fecha
) {

    return new Date(
        fecha.getTime()
    );
}


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
        )
        .format(
            fecha
        )
    );
}


function nombreActividad(
    tipo
) {

    const nombres = {

        ministerio:
            "Ministerio",

        ldc:
            "LDC",

        asambleas:
            "Asambleas",

        otras:
            "Otras",

        todos:
            "actividad"
    };


    return nombres[tipo] ||
        "Actividad";
}


function iconoActividad(
    tipo
) {

    const iconos = {

        ministerio:
            "✦",

        ldc:
            "⌂",

        asambleas:
            "◆",

        otras:
            "＋"
    };


    return iconos[tipo] ||
        "•";
}


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


function crearID() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto
            .randomUUID();
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
    );
}


// =========================================================
// ACTUALIZACIÓN GENERAL
// =========================================================

function actualizarTodaLaInterfaz() {

    actualizarInicio();

    actualizarCursosBiblicosInicio();

    renderizarHistorial();

    actualizarEstadisticas();
}


// =========================================================
// FIN PARTE 4/4
// =========================================================
// =========================================================
// CURSOS BÍBLICOS
// =========================================================

function configurarCursosBiblicos() {

    const grupo =
        document.getElementById(
            "grupoCursosBiblicos"
        );

    const botonMenos =
        document.getElementById(
            "restarCurso"
        );

    const botonMas =
        document.getElementById(
            "sumarCurso"
        );


    if (!grupo) {
        return;
    }


    // Evita configurar los botones dos veces.
    if (
        grupo.dataset.configurado ===
        "si"
    ) {

        actualizarCursosBiblicos();
        actualizarVisibilidadCursosBiblicos();

        return;
    }


    grupo.dataset.configurado =
        "si";


    // -----------------------------------------
    // BOTÓN MENOS
    // -----------------------------------------

    if (botonMenos) {

        botonMenos.addEventListener(
            "click",
            () => {

                cambiarCursosBiblicos(
                    -1
                );
            }
        );
    }


    // -----------------------------------------
    // BOTÓN MÁS
    // -----------------------------------------

    if (botonMas) {

        botonMas.addEventListener(
            "click",
            () => {

                cambiarCursosBiblicos(
                    1
                );
            }
        );
    }


    // -----------------------------------------
    // CAMBIO DE ACTIVIDAD
    // -----------------------------------------

    document
        .querySelectorAll(
            ".actividad-boton"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        setTimeout(
                            actualizarVisibilidadCursosBiblicos,
                            0
                        );
                    }
                );
            }
        );


    actualizarCursosBiblicos();

    actualizarVisibilidadCursosBiblicos();
}


// =========================================================
// CAMBIAR CANTIDAD
// =========================================================

function cambiarCursosBiblicos(
    diferencia
) {

    const actual =
        Math.max(
            0,
            Number(
                estado.cursosBiblicos
            ) || 0
        );


    estado.cursosBiblicos =
        Math.max(
            0,
            actual +
            diferencia
        );


    guardarJSON(
        STORAGE_KEYS.cursosBiblicos,
        estado.cursosBiblicos
    );


    actualizarCursosBiblicos();


    if (
        navigator.vibrate &&
        typeof navigator.vibrate ===
            "function"
    ) {

        navigator.vibrate(
            20
        );
    }
}


// =========================================================
// MOSTRAR CANTIDAD
// =========================================================

function actualizarCursosBiblicos() {

    const cantidad =
        document.getElementById(
            "cantidadCursosBiblicos"
        );


    if (!cantidad) {
        return;
    }


    cantidad.textContent =
        String(
            Math.max(
                0,
                Number(
                    estado.cursosBiblicos
                ) || 0
            )
        );
}


// =========================================================
// MOSTRAR SOLO EN MINISTERIO
// =========================================================

function actualizarVisibilidadCursosBiblicos() {

    const grupo =
        document.getElementById(
            "grupoCursosBiblicos"
        );

    const campoTipo =
        document.getElementById(
            "tipoRegistro"
        );


    if (
        !grupo ||
        !campoTipo
    ) {

        return;
    }


    grupo.classList.toggle(
        "oculto",
        campoTipo.value !==
            "ministerio"
    );
}


// =========================================================
// INICIAR CURSOS BÍBLICOS
// =========================================================

function iniciarCursosBiblicos() {

    if (
        typeof estado.cursosBiblicos ===
            "undefined"
    ) {

        estado.cursosBiblicos =
            Number(
                leerJSON(
                    STORAGE_KEYS.cursosBiblicos,
                    0
                )
            ) || 0;
    }


    configurarCursosBiblicos();
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarCursosBiblicos
    );

} else {

    iniciarCursosBiblicos();
}


// =========================================================
// FIN CURSOS BÍBLICOS
// =========================================================
