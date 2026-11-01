/* =========================================================
   Mi Servicio · V264
   Funciones nuevas, en un archivo aparte para no tocar lo que ya funciona:
   cronómetro, estilo de superficies, resumen del día, gestos en Historial,
   exportar CSV, almacenamiento persistente y segmentos de Estadísticas.
   Nada de aquí cambia las claves ni la estructura de los registros.
   ========================================================= */
(function () {
  "use strict";

  const K_CRON = "miServicio.cronometroV264";
  const K_ESTILO = "miServicio.estiloSuperficiesV264";
  const K_OLED = "miServicio.fondoOledV264";
  const $ = id => document.getElementById(id);
  const leer = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const quitar = k => { try { localStorage.removeItem(k); } catch (e) {} };
  const aviso = t => { try { if (typeof avisoV202 === "function") avisoV202(t); } catch (e) {} };
  const tiempoTexto = m => { try { return typeof formatearTiempo === "function" ? formatearTiempo(m) : m + " min"; } catch (e) { return m + " min"; } };
  const reducirMovimiento = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Estilo de superficies y negro puro ---------- */
  function aplicarEstilo() {
    const metal = leer(K_ESTILO, "cristal") === "metal";
    document.body.classList.toggle("estilo-cristal-v264", !metal);
    document.body.classList.toggle("oled-v264", leer(K_OLED, "no") === "si");
    document.querySelectorAll("[data-estilo-v264]").forEach(b =>
      b.setAttribute("aria-pressed", String((b.dataset.estiloV264 === "metal") === metal)));
    const o = $("fondoOledV264");
    if (o) o.checked = leer(K_OLED, "no") === "si";
  }
  function instalarEstilo() {
    document.querySelectorAll("[data-estilo-v264]").forEach(b =>
      b.addEventListener("click", () => { guardar(K_ESTILO, b.dataset.estiloV264 === "metal" ? "metal" : "cristal"); aplicarEstilo(); }));
    $("fondoOledV264")?.addEventListener("change", e => { guardar(K_OLED, e.target.checked ? "si" : "no"); aplicarEstilo(); });
    aplicarEstilo();
  }

  /* ---------- 2. Cronómetro ---------- */
  let temporizador = 0;
  function estadoCron() {
    try {
      const o = JSON.parse(leer(K_CRON, "null"));
      if (o && Number.isFinite(o.inicio) && o.inicio > 0 && o.inicio <= Date.now() + 60000) return o;
    } catch (e) {}
    return null;
  }
  function fmtHMS(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h + ":" + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0");
  }
  function etiquetaNav(texto) {
    const sp = document.querySelector('.nav-item[data-vista="registrar"] > span:last-child');
    if (sp) { if (!sp.dataset.original) sp.dataset.original = sp.textContent.trim(); sp.textContent = texto === null ? sp.dataset.original : texto; }
  }
  function pintarCron() {
    const e = estadoCron();
    const marcha = !!e;
    document.body.classList.toggle("cronometro-activo-v264", marcha);
    if ($("cronIniciarV264")) $("cronIniciarV264").hidden = marcha;
    if ($("cronTerminarV264")) $("cronTerminarV264").hidden = !marcha;
    if ($("cronDescartarV264")) $("cronDescartarV264").hidden = !marcha;
    const tit = $("cronTituloV264"), sub = $("cronSubV264"), out = $("cronTiempoV264");
    if (marcha) {
      const ms = Date.now() - e.inicio;
      if (out) out.textContent = fmtHMS(ms);
      let nombre = "actividad";
      try { if (typeof nombreActividad === "function") nombre = nombreActividad(e.tipo); } catch (x) {}
      if (tit) tit.textContent = "En curso · " + nombre;
      if (sub) sub.textContent = "Empezó a las " + new Date(e.inicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + ". Puedes cerrar la app.";
      const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      etiquetaNav("⏱ " + h + ":" + String(m).padStart(2, "0"));
    } else {
      if (out) out.textContent = "0:00:00";
      if (tit) tit.textContent = "Cronómetro";
      if (sub) sub.textContent = "Cuenta el tiempo mientras sales y rellena el registro al terminar.";
      etiquetaNav(null);
    }
    if (marcha && !temporizador) temporizador = window.setInterval(pintarCron, 1000);
    if (!marcha && temporizador) { window.clearInterval(temporizador); temporizador = 0; }
  }
  function fechaISOLocal(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function iniciarCron() {
    if (estadoCron()) return;
    const tipo = $("tipoRegistro")?.value || "ministerio";
    if (!guardar(K_CRON, JSON.stringify({ inicio: Date.now(), tipo }))) { aviso("No se pudo iniciar el cronómetro (sin espacio de guardado)."); return; }
    pintarCron();
  }
  function terminarCron() {
    const e = estadoCron(); if (!e) return;
    const MAX = 24 * 60;
    let minutos = Math.max(1, Math.round((Date.now() - e.inicio) / 60000));
    let recortado = false;
    if (minutos > MAX) { minutos = MAX; recortado = true; }
    const inicio = new Date(e.inicio), hoy = new Date(), ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    const f = fechaISOLocal(inicio);
    // Actividad
    document.querySelector('#formRegistro .actividad-boton[data-tipo="' + e.tipo + '"]')?.click();
    // Fecha: Hoy / Ayer / Otra
    const diaBtn = f === fechaISOLocal(hoy) ? "hoy" : f === fechaISOLocal(ayer) ? "ayer" : "otra";
    document.querySelector('#formRegistro [data-dia-v203="' + diaBtn + '"]')?.click();
    if (diaBtn === "otra" && $("fechaRegistro")) { $("fechaRegistro").value = f; $("fechaRegistro").dispatchEvent(new Event("input", { bubbles: true })); }
    // Tiempo
    $("horasRegistro").value = String(Math.floor(minutos / 60));
    $("minutosRegistro").value = String(minutos % 60);
    $("minutosRegistro").dispatchEvent(new Event("input", { bubbles: true }));
    quitar(K_CRON);
    pintarCron();
    aviso(recortado ? "El cronómetro llevaba más de 24 h: se cargó el máximo. Ajusta el tiempo antes de guardar."
                    : "Tiempo cargado: " + tiempoTexto(minutos) + ". Revisa y guarda.");
    try { $("guardarRegistroV203")?.scrollIntoView({ block: "center", behavior: reducirMovimiento() ? "auto" : "smooth" }); } catch (x) {}
  }
  function descartarCron() {
    if (!estadoCron()) return;
    if (!window.confirm("¿Descartar el cronómetro sin guardar el tiempo?")) return;
    quitar(K_CRON); pintarCron();
  }
  function instalarCron() {
    $("cronIniciarV264")?.addEventListener("click", iniciarCron);
    $("cronTerminarV264")?.addEventListener("click", terminarCron);
    $("cronDescartarV264")?.addEventListener("click", descartarCron);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) pintarCron(); });
    pintarCron();
  }

  /* ---------- 3. Registrar: fecha larga y resumen del día ---------- */
  function resumenDia() {
    const f = $("fechaRegistro")?.value, p = $("resumenDiaV264"), t = $("fechaTextoV203");
    if (!f || !/^\d{4}-\d{2}-\d{2}$/.test(f)) { if (p) p.hidden = true; return; }
    if (t) {
      const d = new Date(f + "T12:00:00");
      if (!Number.isNaN(d.getTime())) {
        const largo = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
        t.textContent = largo.charAt(0).toUpperCase() + largo.slice(1);
      }
    }
    if (!p) return;
    let total = 0, n = 0;
    try {
      (estado.registros || []).forEach(r => { if (String(r.fecha || "").slice(0, 10) === f) { total += Number(r.minutos) || Number(r.minutosTotales) || 0; n++; } });
    } catch (e) {}
    if (n > 0 && total > 0) { p.textContent = "Ese día ya llevas " + tiempoTexto(total) + " (" + n + (n === 1 ? " registro" : " registros") + ")."; p.hidden = false; }
    else p.hidden = true;
  }
  function instalarRegistrar() {
    if (typeof window.actualizarRegistrarV203 === "function" && !window.actualizarRegistrarV203.__v264) {
      const orig = window.actualizarRegistrarV203;
      const nueva = function () { const r = orig.apply(this, arguments); try { resumenDia(); } catch (e) {} return r; };
      nueva.__v264 = true;
      window.actualizarRegistrarV203 = nueva;
    }
    resumenDia();
    window.addEventListener("miServicio:registroGuardadoV188", () => setTimeout(resumenDia, 60));
  }

  /* ---------- 4. Exportar CSV ---------- */
  function celda(v) {
    const s = String(v === null || v === undefined ? "" : v).replace(/\r?\n/g, " ");
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function crearCSV(regs) {
    const filas = [["Fecha", "Actividad", "Horas", "Minutos", "Tiempo total (h)", "Acompañante", "Cursos bíblicos", "Notas"]];
    regs.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).forEach(r => {
      const min = Number(r.minutos) || Number(r.minutosTotales) || 0;
      let nombre = r.tipo;
      try { if (typeof nombreActividad === "function") nombre = nombreActividad(r.tipo); } catch (e) {}
      filas.push([String(r.fecha || "").slice(0, 10), nombre, Math.floor(min / 60), min % 60,
        (Math.round(min / 60 * 100) / 100).toString().replace(".", ","), r.companero || "", Number(r.cursosBiblicos) || 0, r.notas || ""]);
    });
    return "﻿" + filas.map(f => f.map(celda).join(";")).join("\r\n");
  }
  async function entregarCSV(texto, nombre) {
    const blob = new Blob([texto], { type: "text/csv;charset=utf-8" });
    try {
      const file = new File([blob], nombre, { type: "text/csv" });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        await navigator.share({ files: [file], title: nombre }); return;
      }
    } catch (e) { if (e && e.name === "AbortError") return; }
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = nombre; a.style.display = "none"; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  function exportarMes() {
    const mes = $("mesResumenV143")?.value;
    if (!/^\d{4}-\d{2}$/.test(mes || "")) { aviso("Elige primero un mes."); return; }
    const regs = (estado.registros || []).filter(r => String(r.fecha || "").slice(0, 7) === mes);
    const st = $("estadoCompartirV260");
    if (!regs.length) { if (st) st.textContent = "Ese mes no tiene registros que exportar."; return; }
    entregarCSV(crearCSV(regs), "Mi-Servicio-" + mes + ".csv");
    if (st) st.textContent = regs.length + (regs.length === 1 ? " registro exportado." : " registros exportados.");
  }
  function exportarTodo() {
    const regs = estado.registros || [];
    const m = $("mensajeDatos");
    if (!regs.length) { aviso("Todavía no hay registros que exportar."); return; }
    entregarCSV(crearCSV(regs), "Mi-Servicio-todo-" + fechaISOLocal(new Date()) + ".csv");
    aviso(regs.length + " registros exportados a CSV.");
  }
  function instalarCSV() {
    $("csvMesV264")?.addEventListener("click", exportarMes);
    $("csvTodoV264")?.addEventListener("click", exportarTodo);
  }

  /* ---------- 5. Almacenamiento persistente y aviso de instalación ---------- */
  function instalarPersistencia() {
    const standalone = (window.navigator && window.navigator.standalone === true) ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
    const av = $("avisoInstalacionV264");
    if (av) av.hidden = standalone;
    const est = $("estadoPersistenciaV264");
    try {
      if (navigator.storage && typeof navigator.storage.persist === "function") {
        navigator.storage.persist().then(ok => {
          window.__persistenteV264 = !!ok;
          if (est && !standalone) { est.textContent = ok ? "El navegador ha marcado tus datos como protegidos." : "El navegador no ha confirmado protección adicional: crea copias con regularidad."; est.hidden = false; }
        }).catch(() => {});
      }
    } catch (e) {}
  }

  /* ---------- 6. Historial: deslizar para editar o borrar ---------- */
  function instalarGestos() {
    const host = $("vista-historial");
    if (!host || host.dataset.gestosV264) return;
    host.dataset.gestosV264 = "1";
    let g = null;
    const UMBRAL = 84;
    function limpiar(card, animar) {
      if (!card) return;
      card.style.transition = animar && !reducirMovimiento() ? "transform .18s ease" : "none";
      card.style.transform = ""; card.removeAttribute("data-swipe-v264");
      card.style.removeProperty("--swipe-v264");
    }
    host.addEventListener("touchstart", e => {
      if (e.touches.length !== 1) { g = null; return; }
      const card = e.target.closest(".registro-card");
      if (!card || e.target.closest("a,input,textarea,select")) { g = null; return; } // los botones sí pueden iniciar un gesto: un toque sigue siendo un toque
      const t = e.touches[0];
      g = { card, x: t.clientX, y: t.clientY, modo: null, dx: 0 };
    }, { passive: true });
    host.addEventListener("touchmove", e => {
      if (!g) return;
      const t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;
      if (g.modo === null) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { g = null; return; }
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) g.modo = "h"; else return;
      }
      if (e.cancelable) e.preventDefault();
      g.dx = Math.max(-140, Math.min(140, dx));
      g.card.style.transition = "none";
      g.card.style.transform = "translateX(" + g.dx + "px)";
      g.card.setAttribute("data-swipe-v264", g.dx < 0 ? "borrar" : "editar");
      g.card.style.setProperty("--swipe-v264", String(Math.min(1, Math.abs(g.dx) / UMBRAL)));
    }, { passive: false });
    function terminar() {
      if (!g) return;
      const { card, dx, modo } = g; g = null;
      if (modo !== "h") return;
      const accion = Math.abs(dx) >= UMBRAL ? (dx < 0 ? ".boton-borrar" : ".boton-editar-registro") : null;
      limpiar(card, true);
      if (accion) { const b = card.querySelector(accion); if (b) setTimeout(() => b.click(), 120); }
    }
    host.addEventListener("touchend", terminar, { passive: true });
    host.addEventListener("touchcancel", () => { if (g) { limpiar(g.card, true); g = null; } }, { passive: true });
  }

  /* ---------- 7. Estadísticas: Resumen / Año / Más ---------- */
  function instalarSegmentos() {
    const vista = $("vista-estadisticas"), seg = $("segmentoStatsV264");
    if (!vista || !seg || seg.dataset.listo) return;
    seg.dataset.listo = "1";
    function poner(valor) {
      vista.dataset.segV264 = valor;
      seg.querySelectorAll("[data-seg-v264]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.segV264 === valor)));
      if (valor === "anio") { const d = $("metaDetalleV260"); if (d && !d.open) d.open = true; }
      try { window.scrollTo({ top: 0, behavior: "auto" }); } catch (e) {}
    }
    seg.addEventListener("click", e => { const b = e.target.closest("[data-seg-v264]"); if (b) poner(b.dataset.segV264); });
    poner("resumen");
  }

  /* ---------- 8. Pequeño pulso al guardar ---------- */
  function instalarPulso() {
    window.addEventListener("miServicio:registroGuardadoV188", () => {
      if (reducirMovimiento()) return;
      const g = $("graficoInicio"); if (!g) return;
      g.classList.remove("pulso-v264"); void g.offsetWidth; g.classList.add("pulso-v264");
      setTimeout(() => g.classList.remove("pulso-v264"), 900);
    });
  }

  function arrancar() {
    instalarEstilo(); instalarCron(); instalarRegistrar(); instalarCSV();
    instalarPersistencia(); instalarGestos(); instalarSegmentos(); instalarPulso();
  }
  // V266: esperar a "load" para que todos los scripts diferidos estén definidos.
  if (document.readyState === "complete") setTimeout(arrancar, 0);
  else window.addEventListener("load", () => setTimeout(arrancar, 0), { once: true });
})();
