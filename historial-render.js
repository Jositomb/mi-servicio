/* Mi Servicio · historial-render.js · V105
   Renderizado real de Historial extraído de app-v27.js.
   Se mantiene como script clásico durante esta fase porque utiliza
   utilidades y estado globales ya existentes en la aplicación.
*/

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
