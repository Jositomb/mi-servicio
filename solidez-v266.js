/* Mi Servicio · V266 · Solidez
   - Copia interna rotatoria (hasta 4 días distintos) dentro del dispositivo.
   - Comprobación al abrir: detecta datos ilegibles o registros que han desaparecido.
   - Aviso de copia más inteligente (a partir de 14 días si hay cambios).
   - Respuesta háptica opcional al guardar (desactivada por defecto).
   - Barras de la semana con volumen.
   No cambia claves ni estructuras existentes. Claves nuevas (no van en copias JSON):
     miServicio.copiasInternasV266, miServicio.firmaUltimaCopiaV266,
     miServicio.respaldoCorruptoV266, miServicio.respaldoPrevioV266, miServicio.hapticaV266
*/
(function () {
  "use strict";
  const K_REG = "miServicio.registros", K_PREF = "miServicio.preferencias", K_AGENDA = "miServicio.agendaSalidas";
  const K_COPIAS = "miServicio.copiasInternasV266", K_FIRMA = "miServicio.firmaUltimaCopiaV266";
  const K_CORRUPTO = "miServicio.respaldoCorruptoV266", K_PREVIO = "miServicio.respaldoPrevioV266";
  const K_HAPTICA = "miServicio.hapticaV266";
  const MAX_COPIAS = 4, MAX_CARACTERES = 1000000;
  const $ = id => document.getElementById(id);

  function leerRaw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function escribir(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function parse(raw, defecto) { try { return raw === null ? defecto : JSON.parse(raw); } catch (e) { return undefined; } }
  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h >>> 0); }
  function firmaActual() { return hash((leerRaw(K_REG) || "") + "|" + (leerRaw(K_PREF) || "") + "|" + (leerRaw(K_AGENDA) || "")); }
  function dia(d) { const f = new Date(d); return f.getFullYear() + "-" + (f.getMonth() + 1) + "-" + f.getDate(); }
  function fechaLarga(iso) {
    try { return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)); }
    catch (e) { return iso; }
  }
  function leerCopias() { const v = parse(leerRaw(K_COPIAS), []); return Array.isArray(v) ? v.filter(c => c && c.d && Array.isArray(c.d.registros)) : []; }
  function guardarCopias(lista) {
    let l = lista.slice(0, MAX_COPIAS);
    while (l.length) {
      const txt = JSON.stringify(l);
      if (txt.length <= MAX_CARACTERES && escribir(K_COPIAS, txt)) return true;
      l = l.slice(0, -1); // quitar la más antigua
    }
    try { localStorage.removeItem(K_COPIAS); } catch (e) {}
    return false;
  }

  /* ---------- 1. Estado al abrir (se ejecuta antes que la app) ---------- */
  const copiasInicio = leerCopias();
  const rawReg = leerRaw(K_REG);
  const regs = parse(rawReg, []);
  let problema = null; // 'corrupto' | 'vacio'
  if (rawReg !== null && (regs === undefined || !Array.isArray(regs))) {
    problema = "corrupto";
    if (rawReg.length < 2000000) escribir(K_CORRUPTO, rawReg);
  } else if (Array.isArray(regs) && regs.length === 0 && copiasInicio.some(c => c.d.registros.length > 0)) {
    problema = "vacio";
  }

  function tomarCopia(forzar) {
    if (problema && !forzar) return;
    const reg = parse(leerRaw(K_REG), []);
    if (!Array.isArray(reg)) return;
    const copias = leerCopias();
    if (reg.length === 0 && copias.some(c => c.d.registros.length > 0) && !forzar) return;
    const firma = firmaActual();
    if (copias[0] && copias[0].f === firma) return;
    const pref = parse(leerRaw(K_PREF), {}), agenda = parse(leerRaw(K_AGENDA), {});
    const nueva = { t: new Date().toISOString(), n: reg.length, f: firma, d: { registros: reg, preferencias: pref || {}, agendaSalidas: agenda || {} } };
    // Una por día; pero una copia vacía nunca sustituye a una del mismo día que tenga registros.
    if (copias[0] && dia(copias[0].t) === dia(nueva.t) && (nueva.n > 0 || copias[0].n === 0)) copias.shift();
    copias.unshift(nueva);
    guardarCopias(copias);
  }

  function restaurar(copia) {
    const actual = leerRaw(K_REG);
    if (actual !== null && actual.length < 2000000) escribir(K_PREVIO, actual);
    const ok = escribir(K_REG, JSON.stringify(copia.d.registros)) &&
      escribir(K_PREF, JSON.stringify(copia.d.preferencias || {})) &&
      escribir(K_AGENDA, JSON.stringify(copia.d.agendaSalidas || {}));
    if (!ok) { window.alert("No se pudo restaurar la copia interna. Tus datos no se han cambiado."); return false; }
    location.reload();
    return true;
  }

  /* ---------- 2. Aviso de problema al abrir ---------- */
  function mostrarAvisoProblema() {
    if (!problema || $("avisoIntegridadV266")) return;
    const ultima = copiasInicio.find(c => c.d.registros.length > 0);
    const caja = document.createElement("div");
    caja.id = "avisoIntegridadV266"; caja.setAttribute("role", "alert");
    const texto = problema === "corrupto"
      ? "No se han podido leer tus registros guardados."
      : "No hay registros en este dispositivo, pero tienes una copia interna con datos.";
    caja.innerHTML = '<strong>⚠️ ' + texto + '</strong>' +
      (ultima ? '<p>Hay una copia interna del ' + fechaLarga(ultima.t) + ' con ' + ultima.n + ' registros.</p>' : '<p>No hay copia interna disponible. Si tienes una copia JSON, impórtala desde Ajustes.</p>') +
      '<div class="acciones-v266">' + (ultima ? '<button type="button" data-a="restaurar">Restaurar esa copia</button>' : '') +
      '<button type="button" data-a="ignorar">Ignorar</button></div>';
    caja.addEventListener("click", e => {
      const a = e.target.closest("[data-a]"); if (!a) return;
      if (a.dataset.a === "restaurar" && ultima) {
        if (window.confirm("Se restaurarán " + ultima.n + " registros de la copia interna del " + fechaLarga(ultima.t) + ". ¿Continuar?")) restaurar(ultima);
      } else { problema = null; caja.remove(); if (regs !== undefined && Array.isArray(regs)) tomarCopia(true); }
    });
    document.body.appendChild(caja);
  }

  /* ---------- 3. Ajustes: copias internas ---------- */
  function pintarCopias() {
    const lista = $("listaCopiasInternasV266"); if (!lista) return;
    const copias = leerCopias();
    lista.textContent = "";
    if (!copias.length) { const p = document.createElement("p"); p.className = "nota-v266"; p.textContent = "Todavía no hay copias internas. Se crean solas al abrir la app."; lista.appendChild(p); return; }
    copias.forEach((c, i) => {
      const fila = document.createElement("div"); fila.className = "fila-copia-v266";
      const t = document.createElement("span"); t.textContent = fechaLarga(c.t) + " · " + c.n + (c.n === 1 ? " registro" : " registros");
      const b = document.createElement("button"); b.type = "button"; b.className = "boton-secundario"; b.textContent = "Restaurar"; b.dataset.i = String(i);
      fila.append(t, b); lista.appendChild(fila);
    });
  }
  function instalarAjustes() {
    if ($("copiasInternasV266")) return;
    const ancla = $("ultimaCopiaAjustes"); if (!ancla) return;
    const det = document.createElement("details"); det.id = "copiasInternasV266"; det.className = "copias-internas-v266";
    det.innerHTML = '<summary>Copias internas automáticas</summary>' +
      '<p class="nota-v266">La app guarda sola una copia al día (las 4 últimas) dentro de este dispositivo. No sustituyen a la copia JSON: si borras los datos del navegador también se pierden.</p>' +
      '<div id="listaCopiasInternasV266"></div>' +
      '<label class="fila-haptica-v266"><input type="checkbox" id="hapticaV266"> Vibración suave al guardar (si el dispositivo lo permite)</label>';
    ancla.insertAdjacentElement("afterend", det);
    det.addEventListener("toggle", () => { if (det.open) pintarCopias(); });
    det.addEventListener("click", e => {
      const b = e.target.closest("button[data-i]"); if (!b) return;
      const c = leerCopias()[Number(b.dataset.i)]; if (!c) return;
      if (window.confirm("Se sustituirán tus datos actuales por la copia del " + fechaLarga(c.t) + " (" + c.n + " registros).\n\nTus datos actuales se guardan antes por seguridad. ¿Continuar?")) restaurar(c);
    });
    const h = $("hapticaV266"); h.checked = leerRaw(K_HAPTICA) === "si";
    h.addEventListener("change", () => { escribir(K_HAPTICA, h.checked ? "si" : "no"); if (h.checked) vibrar(); });
  }

  /* ---------- 4. Aviso de copia más inteligente ---------- */
  function instalarAvisoCopia() {
    const guardar = window.guardarUltimaCopiaSeguridad;
    if (typeof guardar === "function" && !guardar.v266) {
      const nueva = function () { const r = guardar.apply(this, arguments); try { escribir(K_FIRMA, firmaActual()); } catch (e) {} return r; };
      nueva.v266 = true; window.guardarUltimaCopiaSeguridad = nueva;
    }
    const act = window.actualizarRecordatorioCopiaSeguridad;
    if (typeof act === "function" && !act.v266) {
      const nueva = function () {
        const r = act.apply(this, arguments);
        try {
          const aviso = $("recordatorioCopiaInicio"), texto = $("textoRecordatorioCopia");
          const ultima = typeof window.leerUltimaCopiaSeguridad === "function" ? window.leerUltimaCopiaSeguridad() : null;
          const firma = leerRaw(K_FIRMA);
          if (aviso && texto && ultima && firma && aviso.classList.contains("oculto")) {
            const dias = Math.floor((Date.now() - ultima.getTime()) / 86400000);
            if (dias >= 14 && firma !== firmaActual()) {
              aviso.classList.remove("oculto");
              texto.textContent = "Han pasado " + dias + " días desde tu última copia y has añadido o cambiado datos desde entonces.";
            }
          }
        } catch (e) {}
        return r;
      };
      nueva.v266 = true; window.actualizarRecordatorioCopiaSeguridad = nueva;
      try { nueva(); } catch (e) {}
    }
  }

  /* ---------- 5. Respuesta háptica opcional ---------- */
  let interruptor = null;
  function vibrar() {
    if (leerRaw(K_HAPTICA) !== "si") return;
    try { if (navigator.vibrate) { navigator.vibrate(12); return; } } catch (e) {}
    try { // Safari de iPhone: un interruptor nativo produce un toque háptico leve
      if (!interruptor) {
        interruptor = document.createElement("label"); interruptor.setAttribute("aria-hidden", "true");
        interruptor.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none";
        const i = document.createElement("input"); i.type = "checkbox"; i.setAttribute("switch", ""); i.tabIndex = -1;
        interruptor.appendChild(i); document.body.appendChild(interruptor);
      }
      interruptor.click();
    } catch (e) {}
  }
  function instalarHaptica() { window.addEventListener("miServicio:registroGuardadoV188", vibrar); }

  /* ---------- 6. Barras de la semana con volumen ---------- */
  function minutosDeTexto(t) {
    const h = /(\d+)\s*h/.exec(t), m = /(\d+)\s*min/.exec(t);
    return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  }
  function actualizarBarras() {
    const cont = $("semanaVisualDiasV193"); if (!cont) return;
    const dias = Array.from(cont.querySelectorAll(".v193-dia"));
    const mins = dias.map(d => minutosDeTexto((d.querySelector("strong") || {}).textContent || ""));
    const max = Math.max(1, ...mins);
    dias.forEach((d, i) => {
      const p = d.querySelector(".v193-dia-punto"); if (!p) return;
      const nuevo = mins[i] > 0 ? (0.22 + 0.78 * mins[i] / max).toFixed(3) : "0";
      if (p.style.getPropertyValue("--nivel-v266") !== nuevo) p.style.setProperty("--nivel-v266", nuevo);
    });
  }
  function instalarBarras() {
    const cont = $("semanaVisualDiasV193"); if (!cont || cont.dataset.barrasV266) return;
    cont.dataset.barrasV266 = "1";
    let pendiente = false;
    new MutationObserver(() => { if (pendiente) return; pendiente = true; requestAnimationFrame(() => { pendiente = false; actualizarBarras(); }); })
      .observe(cont, { childList: true, subtree: true, characterData: true });
    actualizarBarras();
  }

  function arrancar() {
    tomarCopia(false);
    mostrarAvisoProblema(); instalarAjustes(); instalarAvisoCopia(); instalarHaptica(); instalarBarras();
  }
  // Esperar a "load": así todos los scripts diferidos de la app ya están definidos.
  if (document.readyState === "complete") setTimeout(arrancar, 0);
  else window.addEventListener("load", () => setTimeout(arrancar, 0), { once: true });
})();
