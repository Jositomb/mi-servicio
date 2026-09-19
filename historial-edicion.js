/* Mi Servicio · historial-edicion.js · V106
   Edición y borrado de registros extraídos de app-v27.js.
   Los cuerpos se conservan para mantener exactamente el comportamiento validado.
*/

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
