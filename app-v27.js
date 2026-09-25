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
        localStorage.setItem(clave, JSON.stringify(valor));
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

            return msStorageGuardar(clave, valor);

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



function estadoSyncV134(texto, tipo="ok") {
    almacenamiento.guardar("miServicio.estadoSyncV134",{texto,tipo,fecha:new Date().toISOString()});
    const el=document.getElementById("estadoSyncV134"); if(!el)return;
    const icono=tipo==="subiendo"?"↑":tipo==="bajando"?"↓":tipo==="pendiente"?"⚠︎":"✓";
    el.textContent=`${icono} ${texto}`;
}
function guardarSnapshotLocalV134(){
 const snap={formato:"mi-servicio-snapshot-local",version:2,guardadoEn:new Date().toISOString(),
 registros:estado.registros,preferencias:estado.preferencias,agendaSalidas:estado.agendaSalidas};
 almacenamiento.guardar("miServicio.snapshotAnteriorV134",snap);
 const h=almacenamiento.leer("miServicio.historialCopiasV136",[]);
 const l=Array.isArray(h)?h:[]; l.unshift(snap);
 almacenamiento.guardar("miServicio.historialCopiasV136",l.slice(0,5)); return true;
}
function resumenCopiaV140(copia){
 const registros=Array.isArray(copia?.registros)?copia.registros:[];
 const minutos=registros.reduce((sum,r)=>sum+(Number(r.minutosTotales)||((Number(r.horas)||0)*60+(Number(r.minutos)||0))),0);
 const fecha=new Date(copia?.guardadoEn);
 const fechaTexto=Number.isNaN(fecha.getTime())?"Fecha desconocida":fecha.toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
 return {registros:registros.length,minutos,fechaTexto};
}
function restaurarCopiaV136(i){
 const l=almacenamiento.leer("miServicio.historialCopiasV136",[]),c=Array.isArray(l)?l[i]:null;if(!c)return;
 const r=resumenCopiaV140(c);
 const detalle=`Copia del ${r.fechaTexto}\n${r.registros} registros · ${formatearTiempo(r.minutos)} acumuladas\n\n¿Quieres restaurarla?\nAntes se guardará el estado actual.`;
 if(!confirm(detalle))return;
 guardarSnapshotLocalV134(); aplicandoDatosOneDrive=true;
 try{
  estado.registros=normalizarRegistrosImportados(c.registros||[]);
  estado.preferencias=normalizarPreferenciasImportadas(c.preferencias||{});
  estado.agendaSalidas=c.agendaSalidas&&typeof c.agendaSalidas==="object"&&!Array.isArray(c.agendaSalidas)?c.agendaSalidas:{};
  guardarJSON(STORAGE_KEYS.registros,estado.registros);guardarJSON(STORAGE_KEYS.preferencias,estado.preferencias);guardarJSON(STORAGE_KEYS.agendaSalidas,estado.agendaSalidas);
 }finally{aplicandoDatosOneDrive=false;}
 marcarCambioLocalV133();cargarFormularioAjustes();actualizarTodaLaInterfaz();renderHistorialCopiasV136();programarSincronizacionOneDrive();
}
function renderHistorialCopiasV136(){
 const host=document.getElementById("historialCopiasV136");if(!host)return;
 const l=almacenamiento.leer("miServicio.historialCopiasV136",[]);
 if(!Array.isArray(l)||!l.length){host.innerHTML='<div class="v136-empty">Todavía no hay copias anteriores.</div>';return;}
 host.innerHTML=l.map((c,i)=>{
   const r=resumenCopiaV140(c);
   return `<div class="v140-backup-row">
      <div class="v140-backup-info">
        <strong>🕘 ${r.fechaTexto}</strong>
        <small>${r.registros} registros · ${formatearTiempo(r.minutos)} acumuladas</small>
      </div>
      <button type="button" onclick="restaurarCopiaV136(${i})">Restaurar</button>
   </div>`;
 }).join("");
}
function configurarEstadoSyncV134(){
    const a=document.getElementById("versionPublicadaV156");
    if(!a||document.getElementById("estadoSyncV134"))return;
    const el=document.createElement("div"); el.id="estadoSyncV134";
    el.style.cssText="font-size:12px;text-align:center;margin-top:6px;font-weight:600;";
    a.insertAdjacentElement("beforebegin",el);
    const g=almacenamiento.leer("miServicio.estadoSyncV134",null);
    if(!navigator.onLine) estadoSyncV134("Sin conexión · cambios pendientes","pendiente");
    else if(g?.texto) estadoSyncV134(g.texto,g.tipo||"ok");
    else estadoSyncV134("Preparado para sincronizar","ok");
}
window.addEventListener("offline",()=>estadoSyncV134("Sin conexión · cambios pendientes","pendiente"));
window.addEventListener("online",()=>{estadoSyncV134("Conexión recuperada · sincronizando…","subiendo");setTimeout(()=>sincronizarConOneDrive(false),300);});
function obtenerRevisionLocalV133() {
    const n = Number(almacenamiento.leer("miServicio.syncRevision", 0));
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}
function establecerRevisionLocalV133(v) {
    const n = Number(v);
    almacenamiento.guardar("miServicio.syncRevision",
        Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);
}
function marcarCambioLocalV133() {
    establecerRevisionLocalV133(obtenerRevisionLocalV133() + 1);
    almacenamiento.guardar("miServicio.onedriveCambioLocalPendiente", true);
    almacenamiento.guardar(STORAGE_KEYS.ultimaModificacionLocal, new Date().toISOString());
    estadoSyncV134(navigator.onLine ? "Cambio pendiente de sincronizar" : "Sin conexión · cambio pendiente","pendiente");
}
function guardarPreferencias() {
    const guardado = guardarJSON(STORAGE_KEYS.preferencias, estado.preferencias);
    if (guardado && !aplicandoDatosOneDrive) {
        marcarCambioLocalV133();
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


// =========================================================
// ÓRBITAS DINÁMICAS · V120
// Separa automáticamente los círculos según su tamaño real.
// =========================================================
function resolverColisionesOrbitasV120() {
    const contenedor = document.querySelector("#vista-inicio .orbita-grafico");
    if (!contenedor) return;

    const nodos = [...contenedor.querySelectorAll(".orbita-actividad")];
    const centroNodo = contenedor.querySelector(".orbita-centro");
    if (nodos.length < 2 || !centroNodo) return;

    const caja = contenedor.getBoundingClientRect();
    if (!caja.width || !caja.height) return;

    const leer = nodo => {
        const r = nodo.getBoundingClientRect();
        return {
            nodo,
            x: r.left - caja.left + r.width / 2,
            y: r.top - caja.top + r.height / 2,
            radio: Math.max(r.width, r.height) / 2
        };
    };

    const items = nodos.map(leer);
    const centro = leer(centroNodo);
    const separacion = 10;
    const borde = 5;

    function separar(a, b, pesoA, pesoB) {
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distancia = Math.hypot(dx, dy);
        if (distancia < 0.1) {
            dx = 1; dy = 0.35;
            distancia = Math.hypot(dx, dy);
        }
        const minima = a.radio + b.radio + separacion;
        if (distancia >= minima) return;

        const falta = minima - distancia;
        const ux = dx / distancia;
        const uy = dy / distancia;
        a.x -= ux * falta * pesoA;
        a.y -= uy * falta * pesoA;
        b.x += ux * falta * pesoB;
        b.y += uy * falta * pesoB;
    }

    for (let vuelta = 0; vuelta < 30; vuelta++) {
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                separar(items[i], items[j], 0.5, 0.5);
            }
            separar(items[i], centro, 0.78, 0.22);
        }

        for (const a of items) {
            a.x = Math.max(a.radio + borde, Math.min(caja.width - a.radio - borde, a.x));
            a.y = Math.max(a.radio + borde, Math.min(caja.height - a.radio - borde, a.y));
        }
        centro.x = Math.max(centro.radio + borde, Math.min(caja.width - centro.radio - borde, centro.x));
        centro.y = Math.max(centro.radio + borde, Math.min(caja.height - centro.radio - borde, centro.y));
    }

    for (const a of items) {
        a.nodo.style.setProperty("left", `${(a.x / caja.width) * 100}%`, "important");
        a.nodo.style.setProperty("top", `${(a.y / caja.height) * 100}%`, "important");
    }
    centroNodo.style.setProperty("left", `${(centro.x / caja.width) * 100}%`, "important");
    centroNodo.style.setProperty("top", `${(centro.y / caja.height) * 100}%`, "important");
}

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
        liebre: { normal: "🐇", rapido: "🐇", meta: "🐇✨" },
        corazon: { normal: "❤️", rapido: "❤️", meta: "❤️✨" },
        pajarito: { normal: "🐥", rapido: "🐥", meta: "🐥✨" },
        gatito: { normal: "🐱", rapido: "🐱", meta: "🐱✨" }
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

    const imagenesPersonaje={hombre:"personaje-95d7b35c957c.png",mujer:"personaje-635d3bce67f2.png",koala:"personaje-56dd433b1692.png",mariposa:"personaje-ff4383d3590d.png",pantera:"personaje-698db747b8fb.png",tortuga:"personaje-5638b822e9ec.png",liebre:"personaje-e4168da17cdf.png",corazon:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMjMwIiB2aWV3Qm94PSIwIDAgMTgwIDIzMCI+CjxnIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgPHBhdGggZD0iTTkwIDE2OUM2OSAxNDYgMjUgMTE2IDI1IDcyQzI1IDQ0IDQzIDI3IDY2IDI3Qzc5IDI3IDg4IDM0IDkwIDQ1Qzk0IDM0IDEwMyAyNyAxMTYgMjdDMTM5IDI3IDE1NyA0NCAxNTcgNzJDMTU3IDExNiAxMTIgMTQ2IDkwIDE2OVoiIGZpbGw9IiNmZjRmN2QiLz4KICA8ZWxsaXBzZSBjeD0iNjkiIGN5PSI3NSIgcng9IjgiIHJ5PSIxMCIgZmlsbD0iI2ZmZiIvPjxlbGxpcHNlIGN4PSIxMTIiIGN5PSI3NSIgcng9IjgiIHJ5PSIxMCIgZmlsbD0iI2ZmZiIvPgogIDxjaXJjbGUgY3g9IjcyIiBjeT0iNzciIHI9IjQiIGZpbGw9IiMyNDI0MmEiLz48Y2lyY2xlIGN4PSIxMTUiIGN5PSI3NyIgcj0iNCIgZmlsbD0iIzI0MjQyYSIvPgogIDxwYXRoIGQ9Ik03NCAxMDFROTEgMTE2IDEwOCAxMDEiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzdiMTczNiIgc3Ryb2tlLXdpZHRoPSI2Ii8+CiAgPHBhdGggZD0iTTM5IDEwNFExNiAxMTYgMTggMTM5IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZjRmN2QiIHN0cm9rZS13aWR0aD0iMTIiLz4KICA8cGF0aCBkPSJNMTQzIDEwNFExNjUgOTQgMTcxIDc2IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZjRmN2QiIHN0cm9rZS13aWR0aD0iMTIiLz4KICA8cGF0aCBkPSJNNzIgMTU3UTY1IDE4NCA1MyAyMDciIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmNGY3ZCIgc3Ryb2tlLXdpZHRoPSIxNCIvPgogIDxwYXRoIGQ9Ik0xMDggMTU3UTExNiAxODEgMTM1IDIwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmY0ZjdkIiBzdHJva2Utd2lkdGg9IjE0Ii8+CiAgPHBhdGggZD0iTTQwIDIxMFE1MyAyMDQgNjUgMjExIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMDMyM2EiIHN0cm9rZS13aWR0aD0iMTMiLz4KICA8cGF0aCBkPSJNMTI2IDIwNFExMzkgMTk2IDE1MSAyMDIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMwMzIzYSIgc3Ryb2tlLXdpZHRoPSIxMyIvPgogIDxjaXJjbGUgY3g9IjE2OSIgY3k9IjcyIiByPSI3IiBmaWxsPSIjZmY0ZjdkIi8+CjwvZz48L3N2Zz4=",pajarito:"personaje-e524cff3980b.png",gatito:"personaje-51219b70e7f1.png"};
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

    const desplazamientoVertical = 0;

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
    aplicarContextoCalendarioProgresoV181(
        progreso,
        estadoPersonaje,
        contenedor
    );

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


    // V118: aplicar inmediatamente las preferencias guardadas al resto de vistas.
    if (typeof actualizarInicio === "function") actualizarInicio();
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

/* V109: normalizarRegistrosImportados → registrar.js */



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

        // V133: compara local y nube al arrancar.
        if (conectado) setTimeout(() => sincronizarConOneDrive(false), 650);
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
    temporizadorSyncOneDrive = setTimeout(() => sincronizarConOneDrive(false), 350);
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
    if (sincronizandoOneDrive || !almacenamiento.leer(STORAGE_KEYS.onedriveConectado,false) || !clienteMSALOneDrive) return;
    sincronizandoOneDrive=true;
    const indicador=document.getElementById("indicadorOneDrive");
    if(indicador) indicador.classList.add("sincronizando");
    try {
        if(!navigator.onLine){estadoSyncV134("Sin conexión · cambios pendientes","pendiente");return;}
        estadoSyncV134("Comprobando OneDrive…","subiendo");
        const token=await obtenerTokenOneDrive(); if(!token) return;
        const remoto=await descargarDatosOneDrive(token);
        let localRev=obtenerRevisionLocalV133();
        const remotoRev=Number(remoto?.revision)||0;
        const pendiente=almacenamiento.leer("miServicio.onedriveCambioLocalPendiente",false)===true;
        const ultimaSync=almacenamiento.leer(STORAGE_KEYS.ultimaSyncOneDrive,null);
        const ultimaSyncMs=ultimaSync?(Date.parse(ultimaSync)||0):0;
        const remotoMs=remoto?.updatedAt?(Date.parse(remoto.updatedAt)||0):0;
        const localMs=obtenerFechaModificacionLocalOneDrive();
        let accion="al día";

        if(!remoto){
            if(localRev===0){ establecerRevisionLocalV133(1); localRev=1; }
            estadoSyncV134("Guardando cambios en OneDrive…","subiendo"); await subirDatosOneDrive(token); accion="subidos";
        } else if(remotoRev>localRev){
            if(pendiente && remotoMs>ultimaSyncMs)
                throw new Error("Hay cambios nuevos en este dispositivo y en OneDrive. No se ha sobrescrito nada.");
            estadoSyncV134("Recibiendo datos más recientes…","bajando"); aplicarDatosDesdeOneDrive(remoto); accion="descargados";
        } else if(localRev>remotoRev){
            estadoSyncV134("Guardando cambios en OneDrive…","subiendo"); await subirDatosOneDrive(token); accion="subidos";
        } else if(localRev===0 && remotoRev===0){
            if(remotoMs>localMs){
                if(pendiente && remotoMs>ultimaSyncMs)
                    throw new Error("Hay cambios nuevos en este dispositivo y en OneDrive. No se ha sobrescrito nada.");
                estadoSyncV134("Recibiendo datos más recientes…","bajando"); aplicarDatosDesdeOneDrive(remoto); accion="descargados";
            } else if(localMs>remotoMs){
                establecerRevisionLocalV133(1);
                estadoSyncV134("Guardando cambios en OneDrive…","subiendo"); await subirDatosOneDrive(token); accion="subidos";
            } else registrarSincronizacionOneDrive(remoto.updatedAt||new Date().toISOString());
        } else if(pendiente){
            establecerRevisionLocalV133(localRev+1);
            estadoSyncV134("Guardando cambios en OneDrive…","subiendo"); await subirDatosOneDrive(token); accion="subidos";
        } else registrarSincronizacionOneDrive(remoto.updatedAt||new Date().toISOString());

        const cuenta=clienteMSALOneDrive.getActiveAccount()||clienteMSALOneDrive.getAllAccounts()[0]||null;
        actualizarInterfazOneDrive(true,cuenta);
        estadoSyncV134(accion==="descargados"?"Sincronizado · datos recibidos":accion==="subidos"?"Sincronizado · cambios guardados":"Sincronizado · todo al día","ok");
        if(mostrarResultado) mostrarMensajeOneDrive(
            accion==="descargados"?"✓ Se han recibido los datos más recientes de OneDrive.":
            accion==="subidos"?"✓ Tus cambios se han guardado en OneDrive.":"✓ OneDrive está al día.",false);
    } catch(error){
        console.error("Error sincronizando OneDrive:",error);
        estadoSyncV134(navigator.onLine?"No se pudo sincronizar · se conserva local":"Sin conexión · cambios pendientes","pendiente");
        if(mostrarResultado) mostrarMensajeOneDrive(error?.message||"No se pudo sincronizar con OneDrive.",true);
    } finally {
        sincronizandoOneDrive=false;
        if(indicador) indicador.classList.remove("sincronizando");
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
        version: 4,
        revision: obtenerRevisionLocalV133(),
        updatedAt: ahora,
        copia: crearDatosCopiaSeguridad()
    };
    const respuesta = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${encodeURIComponent(ONEDRIVE_CONFIG.archivo)}:/content`,
        { method:"PUT",
          headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
          body:JSON.stringify(paquete) }
    );
    if (!respuesta.ok) throw new Error(`No se pudo subir la copia a OneDrive (${respuesta.status})`);
    almacenamiento.guardar(STORAGE_KEYS.ultimaModificacionLocal, ahora);
    almacenamiento.guardar("miServicio.onedriveCambioLocalPendiente", false);
    registrarSincronizacionOneDrive(ahora);
}

function aplicarDatosDesdeOneDrive(remoto) {
    const copia = remoto.copia;
    if (!validarCopiaSeguridad(copia)) throw new Error("La copia de OneDrive no es válida");
    const registros = normalizarRegistrosImportados(copia.registros);
    const preferencias = normalizarPreferenciasImportadas(copia.preferencias);
    const agendaSalidas = copia.agendaSalidas && typeof copia.agendaSalidas === "object" &&
        !Array.isArray(copia.agendaSalidas) ? copia.agendaSalidas : {};
    guardarSnapshotLocalV134();
    aplicandoDatosOneDrive = true;
    try {
        estado.registros=registros; estado.preferencias=preferencias; estado.agendaSalidas=agendaSalidas;
        guardarJSON(STORAGE_KEYS.registros, estado.registros);
        guardarJSON(STORAGE_KEYS.preferencias, estado.preferencias);
        guardarJSON(STORAGE_KEYS.agendaSalidas, estado.agendaSalidas);
        establecerRevisionLocalV133(Number(remoto.revision)||0);
        almacenamiento.guardar("miServicio.onedriveCambioLocalPendiente", false);
        almacenamiento.guardar(STORAGE_KEYS.ultimaModificacionLocal, remoto.updatedAt||new Date().toISOString());
        registrarSincronizacionOneDrive(remoto.updatedAt||new Date().toISOString());
    } finally { aplicandoDatosOneDrive=false; }
    cargarFormularioAjustes(); actualizarTodaLaInterfaz(); actualizarRecordatorioCopiaSeguridad();
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

    // V140 · previsión usando exclusivamente horas COMPUTABLES.
    // Respeta por tanto la regla de 55 h cuando hay actividad adicional.
    const diasTranscurridosMeta = Math.max(
        (ahora.getTime() - rango.inicio.getTime()) / 86400000,
        1
    );
    const ritmoDiarioReal = totalComputable / diasTranscurridosMeta;
    let previsionTexto = "Aún no hay datos suficientes";
    let previsionDetalle = "Registra actividad para calcular una previsión.";
    let previsionEstado = "neutral";

    if (pendiente === 0) {
        previsionTexto = "Meta alcanzada ✓";
        previsionDetalle = "Ya has llegado a las 600 h computables.";
        previsionEstado = "positivo";
    } else if (ritmoDiarioReal > 0) {
        const diasNecesarios = Math.ceil(pendiente / ritmoDiarioReal);
        const fechaPrevista = new Date(ahora);
        fechaPrevista.setDate(fechaPrevista.getDate() + diasNecesarios);
        const dentroDelAnio = fechaPrevista <= finExclusivo;
        previsionTexto = fechaPrevista.toLocaleDateString("es-ES", {
            day:"numeric", month:"long", year:"numeric"
        });
        previsionDetalle = dentroDelAnio
            ? `Manteniendo tu ritmo computable actual, alcanzarías las 600 h aproximadamente en esa fecha.`
            : `A tu ritmo computable actual, la previsión queda después del final del año de servicio.`;
        previsionEstado = dentroDelAnio ? "positivo" : "atencion";
    }

    ponerTexto("metaPrevisionFecha", previsionTexto);
    ponerTexto("metaPrevisionDetalle", previsionDetalle);
    const previsionCard = document.getElementById("metaPrevisionV140");
    previsionCard?.classList.toggle("meta-prevision-positiva", previsionEstado === "positivo");
    previsionCard?.classList.toggle("meta-prevision-atencion", previsionEstado === "atencion");

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


// V120 · Aplicar la separación después de cada render del gráfico.
document.addEventListener("DOMContentLoaded", () => {
    const grafico = document.querySelector("#vista-inicio .orbita-grafico");
    if (!grafico) return;

    let pendiente = false;
    const aplicar = () => {
        if (pendiente) return;
        pendiente = true;
        requestAnimationFrame(() => {
            pendiente = false;
            resolverColisionesOrbitasV120();
        });
    };

    new MutationObserver(aplicar).observe(grafico, {
        childList: true,
        subtree: true
    });

    aplicar();
});


// =========================================================
// V121 · AJUSTE RESPONSIVE FINAL DE INICIO
// Recalcula las órbitas al rotar/cambiar tamaño y al volver
// a Inicio, sin cambiar datos ni preferencias.
// =========================================================
(function configurarInicioResponsiveV121(){
    let temporizador = 0;

    function reajustar(){
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
            if (typeof resolverColisionesOrbitasV120 === "function") {
                resolverColisionesOrbitasV120();
            }
        }, 90);
    }

    window.addEventListener("resize", reajustar, {passive:true});
    window.addEventListener("orientationchange", reajustar, {passive:true});

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", reajustar, {passive:true});
    }

    document.addEventListener("click", evento => {
        const boton = evento.target.closest?.("[data-vista='inicio'], [data-view='inicio'], [data-target='inicio']");
        if (boton) {
            setTimeout(() => {
                reajustar();
                if (typeof refrescarFraseAlVolverAInicio === "function") {
                    refrescarFraseAlVolverAInicio();
                }
            }, 60);
        }
    });
})();


function mostrarVersionPublicadaV156() {
    const destino =
        document.getElementById("estadoOneDrive") ||
        document.getElementById("mensajeOneDrive") ||
        document.querySelector("[data-onedrive]");

    if (!destino || document.getElementById("versionPublicadaV156")) return;

    const etiqueta = document.createElement("div");
    etiqueta.id = "versionPublicadaV156";
    etiqueta.textContent = "Versión publicada: V182";
    etiqueta.style.cssText =
        "font-size:11px;opacity:.55;text-align:center;margin-top:8px;";
    destino.insertAdjacentElement("afterend", etiqueta);
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => { mostrarVersionPublicadaV156(); configurarEstadoSyncV134(); }, 500);
});



function organizarCopiasV135() {
    const textos = [...document.querySelectorAll("h1,h2,h3,h4,p,div,span")];
    const titulo = textos.find(el =>
        (el.textContent || "").trim().toLowerCase() === "datos y copias de seguridad"
    );
    if (!titulo) return;

    const card =
        titulo.closest(".card, .ajustes-card, section") ||
        titulo.parentElement?.parentElement ||
        titulo.parentElement;
    if (!card || card.dataset.v135Organizado === "1") return;
    card.dataset.v135Organizado = "1";
    card.classList.add("v135-backup-card");

    const botones = [...card.querySelectorAll("button,a")];

    // Con OneDrive activo, "Exportar para iPhone" duplica la finalidad
    // de la copia/exportación general y se oculta visualmente.
    const exportarIphone = botones.find(b =>
        /exportar para iphone/i.test((b.textContent || "").trim())
    );
    if (exportarIphone) exportarIphone.classList.add("v135-hide-redundant");

    // Etiqueta "Otras opciones" antes de acceso a inicio.
    const acceso = botones.find(b =>
        /preparar acceso a pantalla de inicio/i.test((b.textContent || "").trim())
    );
    if (acceso && !card.querySelector(".v135-section-label")) {
        const label=document.createElement("div");
        label.className="v135-section-label";
        label.textContent="Otras opciones";
        acceso.insertAdjacentElement("beforebegin",label);
    }

    // Los botones secundarios quedan uniformes.
    const secundarios = botones.filter(b =>
        /preparar acceso a pantalla de inicio|importar copia de seguridad/i
        .test((b.textContent || "").trim())
    );
    secundarios.forEach(b => b.style.width="100%");

    // Estado visual compacto usando la información real existente.
    const estado=document.getElementById("estadoSyncV134");
    if (estado) {
        estado.style.padding="10px 12px";
        estado.style.borderRadius="14px";
        estado.style.background="rgba(52,199,89,.08)";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(organizarCopiasV135, 650);
});


function montarHistorialCopiasV136(){
 if(document.getElementById("historialCopiasV136"))return;
 const t=[...document.querySelectorAll("h1,h2,h3,h4,p,div,span")].find(e=>(e.textContent||"").trim().toLowerCase()==="datos y copias de seguridad");if(!t)return;
 const card=t.closest(".card,.ajustes-card,section")||t.parentElement?.parentElement||t.parentElement;if(!card)return;
 const b=document.createElement("div");b.className="v136-history";b.innerHTML='<div class="v135-section-label">Copias recuperables</div><div id="historialCopiasV136"></div>';card.appendChild(b);renderHistorialCopiasV136();
}

document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{montarHistorialCopiasV136();},850));

function actualizarComparacionSemanalV139(){
 const el=document.getElementById("comparacionSemanalV139");if(!el)return;
 const ahora=new Date(),ini=new Date(ahora);ini.setHours(0,0,0,0);ini.setDate(ini.getDate()-((ini.getDay()+6)%7));
 const ant=new Date(ini);ant.setDate(ant.getDate()-7);const fin=new Date(ini);fin.setMilliseconds(-1);
 const sumar=(a,b)=>(Array.isArray(estado.registros)?estado.registros:[]).reduce((sum,r)=>{
   const f=new Date(r.fecha);if(Number.isNaN(f.getTime())||f<a||f>b)return sum;
   return sum + (Number(r.minutosTotales) || ((Number(r.horas)||0)*60 + (Number(r.minutos)||0)));
 },0);
 const ac=sumar(ini,ahora),pr=sumar(ant,fin),dif=ac-pr;
 const fmt=m=>`${Math.floor(m/60)} h${m%60?" "+m%60+" min":""}`;
 el.querySelector("[data-v139-actual]").textContent=fmt(ac);
 el.querySelector("[data-v139-anterior]").textContent=fmt(pr);
 const d=el.querySelector("[data-v139-diferencia]");
 d.textContent=dif>0?`↑ +${fmt(dif)}`:dif<0?`↓ −${fmt(Math.abs(dif))}`:"=";
 d.classList.toggle("negativo",dif<0);
 el.querySelector("[data-v139-diferencia-sub]").textContent=dif===0?"igual que la anterior":"respecto a la anterior";
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(actualizarComparacionSemanalV139,700));

// V141 · agenda inteligente. Estado realizado se deriva de registros: no altera almacenamiento ni OneDrive.
function minutosPlanificadosV141(p){return p&&typeof p==="object"?(Number(p.minutosTotales)||((Number(p.horas)||0)*60+(Number(p.minutos)||0))):0}
function planRealizadoV141(fecha,p){
 const tipo=String(p?.tipo||p?.actividad||"").toLowerCase();
 return (Array.isArray(estado.registros)?estado.registros:[]).some(r=>{
  if(String(r.fecha||"").slice(0,10)!==fecha)return false;
  if(!tipo)return true;
  const rt=String(r.tipo||r.actividad||"").toLowerCase();return rt===tipo||rt.includes(tipo)||tipo.includes(rt);
 });
}
function resumenAgendaMesV141(ref=new Date()){
 const a=estado.agendaSalidas&&typeof estado.agendaSalidas==="object"?estado.agendaSalidas:{};
 let previstos=0,realizados=0,pendientes=0,planes=0;
 Object.entries(a).forEach(([fecha,v])=>{
  const f=new Date(`${String(fecha).slice(0,10)}T12:00:00`);
  if(Number.isNaN(f.getTime())||f.getFullYear()!==ref.getFullYear()||f.getMonth()!==ref.getMonth())return;
  (Array.isArray(v)?v:[v]).filter(Boolean).forEach(p=>{planes++;const m=minutosPlanificadosV141(p);previstos+=m;if(planRealizadoV141(String(fecha).slice(0,10),p))realizados+=m;else pendientes+=m;});
 });
 return{previstos,realizados,pendientes,planes};
}
function actualizarAgendaInteligenteV141(){
 const host=document.getElementById("resumenAgendaV141");if(!host)return;
 const r=resumenAgendaMesV141(),fmt=m=>`${Math.floor(m/60)} h${m%60?` ${m%60} min`:""}`;
 host.querySelector("[data-v141-previstas]").textContent=fmt(r.previstos);
 host.querySelector("[data-v141-realizadas]").textContent=fmt(r.realizados);
 host.querySelector("[data-v141-pendientes]").textContent=fmt(r.pendientes);
 host.querySelector("[data-v141-planes]").textContent=`${r.planes} ${r.planes===1?"plan":"planes"}`;
}
function actualizarProyeccionPlanificadaV141(){
 const el=document.getElementById("metaPlanificadoV141");if(!el)return;
 const ahora=new Date(),r=resumenAgendaMesV141(ahora),ini=new Date(ahora.getFullYear(),ahora.getMonth(),1),fin=new Date(ahora.getFullYear(),ahora.getMonth()+1,1);
 let hecho=0;(Array.isArray(estado.registros)?estado.registros:[]).forEach(x=>{const f=new Date(`${String(x.fecha||"").slice(0,10)}T12:00:00`);if(!Number.isNaN(f.getTime())&&f>=ini&&f<fin)hecho+=Number(x.minutosTotales)||((Number(x.horas)||0)*60+(Number(x.minutos)||0));});
 const total=hecho+r.pendientes,fmt=m=>`${Math.floor(m/60)} h${m%60?` ${m%60} min`:""}`;
 el.querySelector("[data-v141-proyectado]").textContent=fmt(total);
 el.querySelector("[data-v141-detalle]").textContent=r.pendientes?`Incluye ${fmt(r.pendientes)} que todavía tienes planificadas este mes.`:"No tienes horas pendientes planificadas este mes.";
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{actualizarAgendaInteligenteV141();actualizarProyeccionPlanificadaV141();},800));


// =========================================================
// V143 · RESUMEN MENSUAL AUTOMÁTICO
// Solo calcula a partir de los registros existentes.
// =========================================================
function claveMesV143(fecha){
 const d=new Date(fecha); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function nombreMesV143(fecha){
 return fecha.toLocaleDateString("es-ES",{month:"long",year:"numeric"}).replace(/^./,c=>c.toUpperCase());
}
function minutosRegistroV143(r){
 return Number(r?.minutosTotales)||((Number(r?.horas)||0)*60+(Number(r?.minutos)||0));
}
function resumenMesV143(ref){
 const ini=new Date(ref.getFullYear(),ref.getMonth(),1),fin=new Date(ref.getFullYear(),ref.getMonth()+1,1);
 const regs=(Array.isArray(estado.registros)?estado.registros:[]).filter(r=>{
  const f=new Date(`${String(r.fecha||"").slice(0,10)}T12:00:00`);
  return !Number.isNaN(f.getTime())&&f>=ini&&f<fin;
 });
 let total=0; const dias=new Set(),tipos={},semanas={};
 regs.forEach(r=>{
  const mins=minutosRegistroV143(r); total+=mins;
  const fecha=String(r.fecha||"").slice(0,10); if(fecha)dias.add(fecha);
  const tipo=String(r.tipo||r.actividad||"Ministerio"); tipos[tipo]=(tipos[tipo]||0)+mins;
  const f=new Date(`${fecha}T12:00:00`);
  if(!Number.isNaN(f.getTime())){
   const lun=new Date(f); lun.setDate(lun.getDate()-((lun.getDay()+6)%7));
   const k=fechaLocalISOv141(lun); semanas[k]=(semanas[k]||0)+mins;
  }
 });
 const mejor=Math.max(0,...Object.values(semanas));
 return {total,dias:dias.size,tipos,mejor,registros:regs.length};
}
function pintarResumenMensualV143(ref){
 const host=document.getElementById("resumenMensualV143");if(!host)return;
 const actual=resumenMesV143(ref),anterior=resumenMesV143(new Date(ref.getFullYear(),ref.getMonth()-1,1));
 const fmt=m=>`${Math.floor(m/60)} h${m%60?` ${m%60} min`:""}`;
 const dif=actual.total-anterior.total;
 const difTxt=dif>0?`↑ +${fmt(dif)}`:dif<0?`↓ −${fmt(Math.abs(dif))}`:"=";
 host.querySelector("[data-v143-mes]").textContent=nombreMesV143(ref);
 host.querySelector("[data-v143-total]").textContent=fmt(actual.total);
 host.querySelector("[data-v143-dias]").textContent=actual.dias;
 host.querySelector("[data-v143-semana]").textContent=fmt(actual.mejor);
 host.querySelector("[data-v143-compara]").textContent=anterior.total?`${difTxt} frente al mes anterior`:"Sin comparación anterior";
 const dist=host.querySelector("[data-v143-dist]");
 const orden=["Ministerio","LDC","Asambleas","Asamblea","Otras"];
 const entradas=Object.entries(actual.tipos).sort((a,b)=>{
  const ia=orden.indexOf(a[0]),ib=orden.indexOf(b[0]);return (ia<0?99:ia)-(ib<0?99:ib);
 });
 dist.innerHTML=entradas.length?entradas.map(([t,m])=>`<div><span>${t}</span><b>${fmt(m)}</b></div>`).join(""):'<div class="v143-vacio">Todavía no hay actividad registrada.</div>';
 const msg=host.querySelector("[data-v143-mensaje]");
 msg.textContent=actual.total===0?"Un nuevo mes es una nueva oportunidad para avanzar paso a paso.":
   dif>0?"Este mes has avanzado más que el anterior. ¡Sigue así!":
   actual.dias>=8?"La constancia también se construye paso a paso.":
   "Cada registro cuenta. Sigue avanzando a tu ritmo.";
}
function cambiarMesResumenV143(delta){
 const input=document.getElementById("mesResumenV143");if(!input)return;
 const [y,m]=input.value.split("-").map(Number);
 const d=new Date(y,m-1+delta,1); input.value=claveMesV143(d); pintarResumenMensualV143(d);
}
function iniciarResumenMensualV143(){
 const input=document.getElementById("mesResumenV143");if(!input)return;
 const hoy=new Date(); input.value=claveMesV143(hoy);
 input.addEventListener("change",()=>{const [y,m]=input.value.split("-").map(Number);pintarResumenMensualV143(new Date(y,m-1,1));});
 pintarResumenMensualV143(hoy);
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(iniciarResumenMensualV143,850));



// V144 · Tendencia de los últimos 6 meses. Solo lectura de registros.
function actualizarTendenciaV144(){
 const host=document.getElementById("tendenciaV144");if(!host)return;
 const hoy=new Date(), meses=[];
 for(let i=5;i>=0;i--){
  const d=new Date(hoy.getFullYear(),hoy.getMonth()-i,1),r=resumenMesV143(d);
  meses.push({d,total:r.total});
 }
 const max=Math.max(60,...meses.map(x=>x.total));
 const fmt=m=>`${Math.floor(m/60)}h${m%60?` ${m%60}m`:""}`;
 const nom=d=>d.toLocaleDateString("es-ES",{month:"short"}).replace(".","");
 host.querySelector("[data-v144-barras]").innerHTML=meses.map((x,i)=>{
   const alto=x.total?Math.max(8,Math.round(x.total/max*100)):3;
   return `<div class="v144-col ${i===meses.length-1?"actual":""}">
     <div class="v144-valor">${fmt(x.total)}</div>
     <div class="v144-bar-wrap"><div class="v144-bar" style="height:${alto}%"></div></div>
     <small>${nom(x.d)}</small>
   </div>`;
 }).join("");
 const primero=meses[0].total,ultimo=meses[meses.length-1].total;
 const msg=host.querySelector("[data-v144-mensaje]");
 if(!meses.some(x=>x.total)) msg.textContent="La tendencia aparecerá cuando haya actividad registrada.";
 else if(ultimo>primero) msg.textContent="Tu actividad reciente está por encima de la de hace cinco meses.";
 else if(ultimo<primero) msg.textContent="Este mes está por debajo de hace cinco meses; todavía puedes seguir sumando.";
 else msg.textContent="Tu actividad se mantiene estable respecto a hace cinco meses.";
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(actualizarTendenciaV144,900));



// V145 · Resumen inteligente de hoy. Solo lectura: agenda + registros + tiempo ya existente.
function resumenHoyV145(){
 const host=document.getElementById("resumenHoyV145");if(!host)return;
 const hoy=new Date(), fecha=fechaLocalISOv141(hoy);
 const agenda=estado.agendaSalidas&&typeof estado.agendaSalidas==="object"?estado.agendaSalidas:{};
 const raw=agenda[fecha], planes=(Array.isArray(raw)?raw:[raw]).filter(Boolean);
 const regs=(Array.isArray(estado.registros)?estado.registros:[]).filter(r=>String(r.fecha||"").slice(0,10)===fecha);
 const minutos=regs.reduce((a,r)=>a+(Number(r.minutosTotales)||((Number(r.horas)||0)*60+(Number(r.minutos)||0))),0);
 const fmt=m=>`${Math.floor(m/60)} h${m%60?` ${m%60} min`:""}`;
 const titulo=host.querySelector("[data-v145-titulo]"), detalle=host.querySelector("[data-v145-detalle]"), estadoEl=host.querySelector("[data-v145-estado]");
 let icono="☀️", t="", d="", e="";
 if(planes.length){
   const p=planes[0], realizado=planRealizadoV141(fecha,p);
   const tipo=p.tipo||p.actividad||"Actividad";
   const compania=p.companero||p.compañero||p.acompanante||p.persona||"";
   const previsto=minutosPlanificadosV141(p);
   icono=realizado?"✓":"📅";
   t=realizado?"Actividad de hoy completada":`Hoy: ${tipo}${compania?` con ${compania}`:""}`;
   d=realizado?(minutos?`${fmt(minutos)} registradas hoy.`:"Ya consta un registro correspondiente a la planificación."):(previsto?`${fmt(previsto)} previstas.`:"Actividad planificada para hoy.");
   e=realizado?"Hecho":"Planificado";
 } else if(regs.length){
   icono="✓";t="Actividad de hoy registrada";d=`${fmt(minutos)} · ${regs.length} ${regs.length===1?"registro":"registros"}.`;e="Hecho";
 } else {
   let proxima=null;
   Object.entries(agenda).forEach(([f,v])=>{
     if(f<=fecha)return;
     const lista=(Array.isArray(v)?v:[v]).filter(Boolean);if(!lista.length)return;
     if(!proxima||f<proxima.fecha)proxima={fecha:f,plan:lista[0]};
   });
   if(proxima){
     const f=new Date(`${proxima.fecha}T12:00:00`),tipo=proxima.plan.tipo||proxima.plan.actividad||"Actividad";
     icono="→";t="Próxima actividad";d=`${tipo} · ${f.toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"})}`;e="Próximamente";
   }else{
     icono="☀️";t="Hoy sin actividad planificada";d="Puedes registrar o planificar cuando quieras.";e="Hoy";
   }
 }
 const weather=document.getElementById("tiempoDescripcion")?.textContent?.trim();
 if(weather && !/cargando|--|—/i.test(weather)) d += ` · ${weather}`;
 host.querySelector("[data-v145-icono]").textContent=icono;titulo.textContent=t;detalle.textContent=d;estadoEl.textContent=e;
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(resumenHoyV145,1000));



// V152 · sincroniza el nuevo diseño de Meta sin tocar los cálculos existentes.
function sincronizarMetaVisualV152(){
  try{
    const pct=document.getElementById("metaPorcentaje")?.textContent||"0%";
    const rp=document.querySelector("[data-v152-ringpct]"); if(rp) rp.textContent=pct;
    const mes=document.getElementById("metaMesActividad")?.textContent||"0 h";
    const total=(mes.match(/[\d.,]+\s*h/)||["0 h"])[0];
    const mt=document.querySelector("[data-v152-mes-total]"); if(mt) mt.textContent=total;
    const n=parseFloat((total.match(/[\d.,]+/)||["0"])[0].replace(",","."))||0;
    const fill=document.querySelector("[data-v152-mes-fill]"); if(fill) fill.style.width=Math.max(0,Math.min(100,n/55*100))+"%";
    const ring=document.querySelector(".meta-v152-mini-ring"); if(ring){
      const p=Math.max(0,Math.min(100,n/55*100));
      ring.style.background=`conic-gradient(#ff4f9a 0 ${p}%, #253044 ${p}% 100%)`;
    }
    const dst=document.querySelector(".meta-v152-personaje");
    const src=document.querySelector("#animalProgreso img, #animalProgreso .personaje-cuerpo-img, #animalProgreso .pantera-personaje-img");
    if(dst && src && !dst.querySelector("img")){
      const img=src.cloneNode(true); img.removeAttribute("id"); img.removeAttribute("style"); dst.appendChild(img);
    }
  }catch(e){console.warn("V152 visual",e)}
}
document.addEventListener("DOMContentLoaded",()=>{setTimeout(sincronizarMetaVisualV152,900);setTimeout(sincronizarMetaVisualV152,1800)});
document.addEventListener("click",e=>{if(e.target.closest?.('[data-vista="meta"],[data-tab="meta"],[href="#meta"]')) setTimeout(sincronizarMetaVisualV152,250)});

// V157 corregida · fecha local del día en la cabecera del calendario
function actualizarFechaCalendarioInicioV157(){
  const el=document.getElementById("fechaCalendarioInicioV157");
  if(!el) return;
  const d=new Date();
  const dd=String(d.getDate()).padStart(2,"0");
  const mm=String(d.getMonth()+1).padStart(2,"0");
  el.textContent=`${dd}/${mm}/${d.getFullYear()}`;
}
document.addEventListener("DOMContentLoaded", actualizarFechaCalendarioInicioV157);

// V167 · microanimaciones puramente visuales.
function animarInicioV167(){
  const vista=document.getElementById("vista-inicio");
  if(!vista)return;
  vista.classList.remove("v167-animar");
  void vista.offsetWidth;
  vista.classList.add("v167-animar");
  setTimeout(()=>vista.classList.remove("v167-animar"),800);
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(animarInicioV167,120));
document.addEventListener("click",e=>{
  const destino=e.target.closest?.('[data-vista="inicio"],[data-tab="inicio"],a[href="#inicio"]');
  if(destino)setTimeout(animarInicioV167,40);
});

// =========================================================
// V168 · ARRANQUE RÁPIDO / OFFLINE-FIRST
// La interfaz y localStorage mandan al abrir.
// Red, clima y sincronización se despiertan después.
// =========================================================
window.miServicioArranqueRapidoV168 = true;

function tareasRedDiferidasV168(){
  if(document.visibilityState==="hidden") return;
  // Clima: si la función existe, refresca después de mostrar ya la app.
  try{
    if(typeof actualizarTiempoInicio==="function"){
      setTimeout(()=>{ try{ actualizarTiempoInicio(); }catch(e){} },350);
    }
  }catch(e){}
  // Sincronización: solo si existe y sin bloquear la primera pintura.
  try{
    const sync =
      (typeof sincronizarConOneDrive==="function" && sincronizarConOneDrive) ||
      (typeof sincronizarOneDrive==="function" && sincronizarOneDrive) ||
      null;
    if(sync) setTimeout(()=>{ try{ sync(); }catch(e){} },900);
  }catch(e){}
}

window.addEventListener("load",()=>{
  if("requestIdleCallback" in window){
    requestIdleCallback(tareasRedDiferidasV168,{timeout:2200});
  }else{
    setTimeout(tareasRedDiferidasV168,1400);
  }
},{once:true});




// =========================================================
// V181 · CONTEXTO DEL CALENDARIO EN EL PROGRESO
// - No modifica horas ni el objetivo mensual.
// - Vacaciones / viajes de día completo ajustan únicamente
//   la interpretación del ritmo.
// - Los eventos se muestran como contexto visual.
// =========================================================

const EVENTOS_CALENDARIO_KEY_V181 = "miServicio.eventosCalendarioV172";

function leerEventosCalendarioV181(){
    try{
        const raw = JSON.parse(localStorage.getItem(EVENTOS_CALENDARIO_KEY_V181) || "[]");
        return Array.isArray(raw) ? raw.filter(Boolean) : [];
    }catch(e){
        return [];
    }
}

function fechaLocalV181(d){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const dia=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${dia}`;
}

function tipoContextoV181(e){
    const tipo=String(e?.tipo||"").toLowerCase();
    const titulo=String(e?.titulo||e?.title||"").toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    const tiene=(re)=>re.test(titulo);

    if(tipo==="vacaciones" || tiene(/\b(vacacion|vacaciones|holiday|descanso|libre|dias libres|dia libre)\b/)){
        return {tipo:"vacaciones",icono:"🌴",nombre:"Vacaciones",tituloHoy:"Vacaciones hoy",bloquea:true};
    }
    if(tipo==="viaje" || tiene(/\b(viaje|vuelo|avion|tren|hotel|aeropuerto|ferry|barco|maleta)\b/)){
        return {tipo:"viaje",icono:"🧳",nombre:"Viaje",tituloHoy:"Viaje hoy",bloquea:Boolean(e?.todoElDia)};
    }
    if(tiene(/\b(cumple|cumpleanos|aniversario|fiesta|celebracion|boda)\b/)){
        return {tipo:"celebracion",icono:"🎉",nombre:"Celebración",tituloHoy:"Celebración hoy",bloquea:false};
    }
    if(tipo==="cita" || tiene(/\b(medico|medica|dentista|hospital|consulta|revision|analisis|cita)\b/)){
        return {tipo:"cita",icono:"🩺",nombre:"Cita",tituloHoy:"Cita hoy",bloquea:false};
    }
    if(tipo==="trabajo" || tiene(/\b(trabajo|oficina|reunion|curso|formacion)\b/)){
        return {tipo:"trabajo",icono:"💼",nombre:"Compromiso",tituloHoy:"Compromiso hoy",bloquea:false};
    }
    if(tipo==="asamblea" || tiene(/\b(asamblea|congreso)\b/)){
        return {tipo:"asamblea",icono:"🎤",nombre:"Asamblea",tituloHoy:"Asamblea hoy",bloquea:false};
    }
    if(tipo==="ldc" || tiene(/\b(ldc|construccion|mantenimiento|obra)\b/)){
        return {tipo:"ldc",icono:"🛠️",nombre:"LDC",tituloHoy:"LDC hoy",bloquea:false};
    }
    if(tipo==="ministerio" || tiene(/\b(predicacion|servicio|ministerio|revisita|curso biblico)\b/)){
        return {tipo:"servicio",icono:"📖",nombre:"Servicio",tituloHoy:"Servicio hoy",bloquea:false};
    }
    if(tiene(/\b(familia|comida|cena|almuerzo|visita|merienda)\b/)){
        return {tipo:"familia",icono:"🍽️",nombre:"Plan familiar",tituloHoy:"Plan familiar hoy",bloquea:false};
    }
    return {tipo:"personal",icono:"✨",nombre:"Evento",tituloHoy:"Evento hoy",bloquea:false};
}

function eventosMesV181(ref=new Date()){
    const y=ref.getFullYear();
    const m=ref.getMonth()+1;
    const pref=`${y}-${String(m).padStart(2,"0")}-`;

    return leerEventosCalendarioV181()
        .filter(e=>String(e?.fecha||"").startsWith(pref))
        .map(e=>({...e,_ctx:tipoContextoV181(e)}))
        .sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)) || String(a.hora||"").localeCompare(String(b.hora||"")));
}

function resumenDisponibilidadV181(ref=new Date()){
    const eventos=eventosMesV181(ref);
    const diasMes=new Date(ref.getFullYear(),ref.getMonth()+1,0).getDate();
    const hoy=Math.min(ref.getDate(),diasMes);

    const bloqueados=new Set(
        eventos
            .filter(e=>e._ctx.bloquea)
            .map(e=>String(e.fecha))
    );

    let disponiblesTotales=0;
    let disponiblesTranscurridos=0;
    let disponiblesRestantes=0;

    for(let dia=1;dia<=diasMes;dia++){
        const d=new Date(ref.getFullYear(),ref.getMonth(),dia,12,0,0);
        const iso=fechaLocalV181(d);
        if(bloqueados.has(iso)) continue;

        disponiblesTotales++;
        if(dia<=hoy) disponiblesTranscurridos++;
        if(dia>=hoy) disponiblesRestantes++;
    }

    const esperado=disponiblesTotales>0
        ? (disponiblesTranscurridos/disponiblesTotales)*100
        : (hoy/diasMes)*100;

    const hoyISO=fechaLocalV181(ref);
    const hoyEventos=eventos.filter(e=>e.fecha===hoyISO);
    const hoyBloqueado=hoyEventos.some(e=>e._ctx.bloquea);

    return {
        eventos,
        bloqueados,
        diasMes,
        esperado,
        disponiblesTotales,
        disponiblesTranscurridos,
        disponiblesRestantes,
        hoyEventos,
        hoyBloqueado
    };
}

function asegurarMarcadoresV181(contenedor){
    let host=contenedor?.querySelector(".progreso-eventos-v181");
    if(!host && contenedor){
        host=document.createElement("div");
        host.className="progreso-eventos-v181";
        host.setAttribute("aria-hidden","true");
        contenedor.appendChild(host);
    }
    return host;
}

function renderMarcadoresV181(contenedor,resumen){
    const host=asegurarMarcadoresV181(contenedor);
    if(!host) return;

    host.innerHTML="";
    const porFecha=new Map();

    resumen.eventos.forEach(e=>{
        if(!porFecha.has(e.fecha)) porFecha.set(e.fecha,e);
        else if(e._ctx.bloquea && !porFecha.get(e.fecha)._ctx.bloquea) porFecha.set(e.fecha,e);
    });

    [...porFecha.values()].forEach(e=>{
        const dia=Number(String(e.fecha).slice(8,10));
        if(!dia) return;

        const marker=document.createElement("span");
        marker.className=`progreso-evento-marca-v181 tipo-${e._ctx.tipo}`;
        marker.textContent=e._ctx.icono;
        marker.style.left=`${((dia-.5)/resumen.diasMes)*100}%`;
        marker.title=`${dia} · ${e.titulo || e._ctx.nombre}`;
        host.appendChild(marker);
    });
}

function textoContextoV181(resumen){
    const vacas=[...resumen.bloqueados].length;
    const hoyEvt=resumen.hoyEventos[0];

    if(resumen.hoyBloqueado && hoyEvt){
        return {
            icono:hoyEvt._ctx.icono,
            fuerte:"Pausa planificada",
            detalle:`${hoyEvt._ctx.nombre} hoy · el objetivo no cambia`
        };
    }

    if(vacas>0){
        const palabra=vacas===1?"día":"días";
        return {
            icono:"🏖️",
            fuerte:`${vacas} ${palabra} no disponible${vacas===1?"":"s"} este mes`,
            detalle:`${resumen.disponiblesRestantes} días disponibles desde hoy · ritmo ajustado`
        };
    }

    if(hoyEvt){
        return {
            icono:hoyEvt._ctx.icono,
            fuerte:hoyEvt._ctx.tituloHoy || `${hoyEvt._ctx.nombre} hoy`,
            detalle:"Se muestra como contexto; tus horas y objetivo siguen iguales",
            tipo:hoyEvt._ctx.tipo
        };
    }

    const futuro=resumen.eventos.find(e=>e.fecha>fechaLocalV181(new Date()));
    if(futuro){
        const dia=Number(String(futuro.fecha).slice(8,10));
        return {
            icono:futuro._ctx.icono,
            fuerte:`${futuro._ctx.nombre} el ${dia}`,
            detalle:"Evento próximo reflejado en la línea de progreso"
        };
    }

    return null;
}

function aplicarContextoCalendarioProgresoV181(progreso, estadoPersonaje, contenedor){
    const box=document.getElementById("contextoCalendarioProgresoV181");
    if(!box || !contenedor) return;

    const resumen=resumenDisponibilidadV181(new Date());
    renderMarcadoresV181(contenedor,resumen);

    const contexto=textoContextoV181(resumen);
    if(contexto){
        box.className="contexto-calendario-progreso-v181";
        box.classList.add(`tipo-${contexto.tipo||"personal"}`);
        box.innerHTML=
            `<span class="contexto-icono-v181">${contexto.icono}</span>`+
            `<span><strong>${contexto.fuerte}</strong><small>${contexto.detalle}</small></span>`;
    }else{
        box.innerHTML="";
        box.className="contexto-calendario-progreso-v181 oculto";
    }

    // Si no hay días que afecten al ritmo, respetamos exactamente el cálculo anterior.
    if(!resumen.bloqueados.size) return;

    const valor=Math.max(0,Math.min(100,Number(progreso)||0));
    const diferencia=valor-resumen.esperado;
    const margen=5;

    contenedor.classList.remove(
        "ritmo-atrasado",
        "ritmo-en-ritmo",
        "ritmo-adelantado",
        "ritmo-pausa"
    );

    if(resumen.hoyBloqueado){
        contenedor.classList.add("ritmo-pausa");
        if(estadoPersonaje){
            estadoPersonaje.textContent="🏖️ Pausa planificada. Tu objetivo sigue igual.";
        }
        return;
    }

    if(valor>=100){
        return;
    }

    if(diferencia>=margen){
        contenedor.classList.add("ritmo-adelantado");
        if(estadoPersonaje) estadoPersonaje.textContent="Ritmo ajustado: vas por delante ✨";
    }else if(diferencia<=-margen){
        contenedor.classList.add("ritmo-atrasado");
        if(estadoPersonaje) estadoPersonaje.textContent="Ritmo ajustado: aún puedes recuperar el ritmo.";
    }else{
        contenedor.classList.add("ritmo-en-ritmo");
        if(estadoPersonaje) estadoPersonaje.textContent="Ritmo ajustado: vas bien ✨";
    }
}

function refrescarContextoProgresoV181(){
    try{
        const objetivo=Number(estado?.preferencias?.objetivoMensualMinutos)||0;
        const regs=(typeof obtenerRegistrosMesActual==="function")
            ? obtenerRegistrosMesActual()
            : (Array.isArray(estado?.registros)?estado.registros:[]);
        const total=typeof sumarMinutos==="function" ? sumarMinutos(regs) : 0;
        const pct=objetivo>0?Math.min(100,Math.max(0,(total/objetivo)*100)):0;
        const cont=document.getElementById("progresoPersonaje");
        const est=document.getElementById("estadoAnimal");
        aplicarContextoCalendarioProgresoV181(pct,est,cont);
    }catch(e){
        console.warn("Contexto progreso V181",e);
    }
}

window.addEventListener("miServicio:eventosCalendarioActualizados",()=>{
    setTimeout(refrescarContextoProgresoV181,80);
});

document.addEventListener("DOMContentLoaded",()=>{
    setTimeout(refrescarContextoProgresoV181,1100);
});

document.addEventListener("visibilitychange",()=>{
    if(!document.hidden) setTimeout(refrescarContextoProgresoV181,120);
});
