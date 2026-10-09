/* V227 · Meses plegables, estado solo durante esta sesión. */
const mesesAbiertosHistorialV227=new Map();
let mesActualHistorialV227="";
function abrirMesHistorialV227(mes,buscando,actual){
    if(buscando)return true;
    return mesesAbiertosHistorialV227.has(mes)?mesesAbiertosHistorialV227.get(mes):mes>=actual;
}

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


    const meses=new Map();
    registros.forEach(r=>{const mes=String(r.fecha).slice(0,7);if(!meses.has(mes))meses.set(mes,[]);meses.get(mes).push(r);});
    let ultimoMes="",contenidoMes=null;
    const hoy=new Date(),actual=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
    if(mesActualHistorialV227!==actual){mesesAbiertosHistorialV227.clear();mesActualHistorialV227=actual;}
    const buscando=Boolean(document.getElementById("buscarHistorialV227")?.value.trim());

    grupos.forEach(
        grupo => {
            const mes=String(grupo.fecha).slice(0,7);
            if(mes!==ultimoMes){
                const desplegable=document.createElement("details");desplegable.className="historial-mes-desplegable-v227";
                desplegable.dataset.mes=mes;desplegable.open=abrirMesHistorialV227(mes,buscando,actual);
                const cabeceraMes=document.createElement("summary");cabeceraMes.className="historial-mes-v227";
                const nombreMes=document.createElement("h3");
                const nombre=fechaDesdeISO(mes+"-01").toLocaleDateString("es-ES",{month:"long",year:"numeric"});
                nombreMes.textContent=nombre.replace(/^./,letra=>letra.toUpperCase());
                const totalMes=document.createElement("span");totalMes.textContent=formatearTiempo(sumarMinutos(meses.get(mes)||[]));
                totalMes.setAttribute("aria-label",`Total de registros mostrados en ${nombre}: ${totalMes.textContent}`);
                totalMes.title="Total de los registros mostrados";
                const flecha=document.createElement("span");flecha.className="historial-mes-flecha-v227";flecha.textContent="›";flecha.setAttribute("aria-hidden","true");
                cabeceraMes.append(nombreMes,totalMes,flecha);
                contenidoMes=document.createElement("div");contenidoMes.className="historial-mes-contenido-v227";
                desplegable.append(cabeceraMes,contenidoMes);lista.appendChild(desplegable);ultimoMes=mes;
                desplegable.addEventListener("toggle",()=>{
                    if(desplegable.isConnected&&!buscando)mesesAbiertosHistorialV227.set(mes,desplegable.open);
                });
            }

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
                    "h4"
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


            contenidoMes.appendChild(seccion);
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

    const busqueda=document.getElementById("buscarHistorialV227")?.value.trim();
    if(busqueda){
        if(titulo)titulo.textContent="No hay coincidencias";
        if(texto)texto.textContent="Prueba otro nombre o quita el filtro de actividad.";
        return;
    }

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


    const fechaCompleta = formatearFecha(registro.fecha);
    fecha.title = fechaCompleta;
    fecha.setAttribute("aria-label", fechaCompleta);
    const larga=document.createElement("span");larga.className="historial-fecha-larga-v227";larga.textContent=fechaCompleta;
    const corta=document.createElement("span");corta.className="historial-fecha-corta-v227";
    corta.textContent=fechaDesdeISO(registro.fecha).toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"});
    corta.setAttribute("aria-hidden","true");fecha.append(larga,corta);


    contenido.append(
        cabecera,
        fecha
    );

    if(registro.companero||registro.acompanante||registro.compañero){
        const persona=document.createElement("p");persona.className="registro-companero-v227";
        persona.textContent=`Con ${registro.companero||registro.acompanante||registro.compañero}`;
        contenido.appendChild(persona);
    }

    // V194 · mini indicador visual de duración
    const duracionVisual=document.createElement("div");
    duracionVisual.className="registro-duracion-v194";

    const duracionRelleno=document.createElement("span");
    duracionRelleno.className="registro-duracion-relleno-v194";

    const minutosRegistro=Math.max(
        0,
        Number(registro.minutos)||Number(registro.minutosTotales)||0
    );

    // 5 h llena la barra; tiempos mayores siguen mostrándose completos en texto.
    duracionRelleno.style.width=
        `${Math.max(7,Math.min(100,(minutosRegistro/300)*100))}%`;

    duracionVisual.appendChild(duracionRelleno);
    contenido.appendChild(duracionVisual);


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


    botonBorrar.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></svg>';


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
    botonEditar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m4 16 12-12 4 4-12 12H4zM13 7l4 4"/></svg>';
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

    const repetir=document.createElement("button");
    repetir.type="button";
    repetir.className="boton-repetir-v227";
    repetir.innerHTML='<svg class="historial-repetir-icono-v227" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m13 3 4 4-4 4M17 7h-5a7 7 0 1 0 7 7"/></svg><span class="historial-repetir-texto-v227">Repetir</span>';
    repetir.title="Repetir con la fecha de hoy";
    repetir.setAttribute("aria-label",`Repetir ${nombreActividad(registro.tipo)} con la fecha de hoy`);
    repetir.addEventListener("click",evento=>{
        evento.stopPropagation();
        repetirActividadV227(registro.id);
    });
    acciones.append(repetir,botonEditar,botonBorrar);

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
            if (evento.target.closest("button")) return;
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                abrirModalEdicion(registro.id);
            }
        }
    );

    return tarjeta;
}
