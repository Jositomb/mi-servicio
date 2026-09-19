/* Mi Servicio · Ajustes V112 */

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
        "hombre","mujer","koala","mariposa","pantera","tortuga","liebre","corazon","pajarito","gatito"
    ];

    if (!["hombre","mujer","koala","mariposa","pantera","tortuga","liebre","corazon","pajarito","gatito"].includes(personaje.value)) {

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
            ["hombre","mujer","koala","mariposa","pantera","tortuga","liebre","corazon","pajarito","gatito"].includes(preferencias?.personajeProgreso)
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
