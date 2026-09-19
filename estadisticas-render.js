/* Mi Servicio · Estadísticas V108 */

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

function actualizarEstadoOneDrive(texto, conectado) {
    const estadoEl = document.getElementById("estadoOneDrive");
    const indicador = document.getElementById("indicadorOneDrive");
    if (estadoEl) estadoEl.textContent = texto;
    if (indicador) indicador.classList.toggle("conectado", !!conectado);
}
