/* Mi Servicio · V269
   1. Temas completos + color personalizado + letra redondeada
   2. Anillos de progreso en Inicio
   3. Papelera de registros (30 días)
   No cambia claves ni estructuras existentes.
   Claves nuevas: miServicio.firmaPersonalV269, miServicio.tipografiaV269, miServicio.anillosInicioV269 (apariencia, van en la copia JSON)
                  miServicio.papeleraV269 (solo este dispositivo, no va en la copia)
*/
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const K_PERSONAL = "miServicio.firmaPersonalV269", K_TIPO = "miServicio.tipografiaV269", K_ANILLOS = "miServicio.anillosInicioV269", K_PAPELERA = "miServicio.papeleraV269";
  const TIPOS = ["ministerio", "ldc", "asambleas", "otras"];
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function fmt(min) { min = Math.round(Math.max(0, min)); const h = Math.floor(min / 60), m = min % 60; return h && m ? h + " h " + m + " min" : h ? h + " h" : m + " min"; }
  function fechaISO(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function nombreTipo(t) { try { return typeof nombreActividad === "function" ? nombreActividad(t) : t; } catch (e) { return t; } }
  function registros() { try { return (estado.registros || []).filter(r => r && /^\d{4}-\d{2}-\d{2}/.test(String(r.fecha))); } catch (e) { return []; } }
  function objetivo() { try { return Number(estado.preferencias && estado.preferencias.objetivoMensualMinutos) || 0; } catch (e) { return 0; } }
  const HB_K = "miServicio.habitualesV27641", INI_K = "miServicio.inicioV27636", RV_K = "miServicio.revisionOkV27636", RV_TIPOS = ["ministerio", "ldc", "asambleas", "otras"], TX_K = "miServicio.textoV27645", CO_K = "miServicio.concentracionV27645"; /* arriba para que existan cuando arranca la app */
  function movReducido() { try { return window.matchMedia("(prefers-reduced-motion:reduce)").matches; } catch (e) { return false; } }

  /* ================= 1. TEMAS, COLOR PERSONAL, LETRA ================= */
  const TEMAS = [
    { id: "oceano", nombre: "Océano", amb: "metal", firma: "oceano", metal: "plata", oled: false, cols: ["#80b3ff", "#2864d7"] },
    { id: "bosque", nombre: "Bosque", amb: "escena", firma: "salvia", metal: "plata", oled: false, cols: ["#8dccaa", "#357451"] },
    { id: "atardecer", nombre: "Atardecer", amb: "metal", firma: "ambar", metal: "champan", oled: false, cols: ["#f1c47d", "#9a651b"] },
    { id: "lavanda", nombre: "Lavanda", amb: "cielo", firma: "lavanda", metal: "plata", oled: false, cols: ["#c2a8f3", "#7752b9"] },
    { id: "rosa", nombre: "Rosa", amb: "cristal", firma: "rosa", metal: "plata", oled: false, cols: ["#efa7c7", "#b64c79"] },
    { id: "medianoche", nombre: "Medianoche", amb: "metal", firma: "oceano", metal: "titanio", oled: true, cols: ["#5a6a8a", "#0b1020"] }
  ];
  function hexValido(h) { return /^#[0-9a-f]{6}$/i.test(String(h || "")); }
  function hexARgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function aHex(r) { return "#" + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
  function mezcla(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }
  function luminancia(c) { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); }
  function derivarFirma(hex) {
    let base = hexARgb(hex);
    while (luminancia(base) > 0.18) base = mezcla(base, [0, 0, 0], .12); // texto blanco legible (contraste ≥ 4,5)
    const luz = mezcla(base, [255, 255, 255], .45);
    return { base: aHex(base), luz: aHex(luz), rgb: base.map(Math.round).join(",") };
  }
  function aplicarPersonal(hex) {
    if (!hexValido(hex)) return false;
    const f = derivarFirma(hex), s = document.body.style;
    s.setProperty("--firma-base", f.base); s.setProperty("--firma-luz", f.luz); s.setProperty("--firma-rgb", f.rgb);
    document.body.dataset.firma = "personal";
    document.querySelectorAll("#firmasColorV260 button").forEach(b => b.setAttribute("aria-pressed", "false"));
    const sel = $("colorPersonalV269"); if (sel && sel.value.toLowerCase() !== hex.toLowerCase()) sel.value = hex;
    return true;
  }
  function personalActivo() { const h = ls(K_PERSONAL); return hexValido(h) ? h : null; }
  function aplicarTipografia() {
    const on = ls(K_TIPO) === "redondeada"; document.body.classList.toggle("tipo-redondeada-v269", on);
    const c = $("tipografiaV269"); if (c) c.checked = on;
  }
  function temaActual() {
    if (personalActivo()) return null;
    const t = { amb: ls("miServicio.ambienteVisual"), firma: ls("miServicio.firmaColor") || "oceano", metal: ls("miServicio.acabadoMetal") || "plata", oled: ls("miServicio.fondoOledV264") === "si" };
    return (TEMAS.find(x => x.amb === t.amb && x.firma === t.firma && x.metal === t.metal && x.oled === t.oled) || {}).id || null;
  }
  function marcarTema() {
    const act = temaActual();
    document.querySelectorAll("#temasV269 [data-tema]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tema === act)));
    const p = $("personalEstadoV269"); if (p) p.textContent = personalActivo() ? "Usando tu color personalizado." : "";
  }
  function aplicarTema(t) {
    lsDel(K_PERSONAL);
    try { guardarAmbienteVisualV260(t.amb); guardarFirmaColorV260(t.firma); guardarMetalV260(t.metal); } catch (e) { console.warn("[V269] tema", e); }
    document.querySelector('[data-estilo-v264="cristal"]')?.click();
    const o = $("fondoOledV264"); if (o && o.checked !== t.oled) { o.checked = t.oled; o.dispatchEvent(new Event("change", { bubbles: true })); }
    marcarTema();
  }
  function instalarTemas() {
    if ($("temasV269")) return;
    const ancla = document.querySelector(".selector-ambiente-v260"); if (!ancla) return;
    const f = document.createElement("fieldset"); f.id = "temasV269"; f.className = "selector-grafico-v260 temas-v269";
    f.innerHTML = '<legend class="titulo-campo">Temas</legend><div class="rejilla-temas-v269" role="group" aria-label="Elegir un tema completo"></div>' +
      '<div class="color-personal-v269"><label for="colorPersonalV269">Tu color</label><input id="colorPersonalV269" type="color" value="#2864d7" aria-label="Elegir un color personalizado"><button type="button" id="usarColorV269" class="boton-secundario">Usar mi color</button></div>' +
      '<p id="personalEstadoV269" class="ayuda-fondo-clima-v260" role="status"></p>' +
      '<label class="fondo-clima-opcion-v260"><input id="tipografiaV269" type="checkbox"><span>Letra redondeada (estilo Apple)</span></label>' +
      '<label class="fondo-clima-opcion-v260"><input id="anillosV269check" type="checkbox"><span>Mostrar los anillos de progreso en Estadísticas</span></label>' +
      '<p class="ayuda-fondo-clima-v260">Un tema cambia ambiente, color, metal y fondo a la vez. Después puedes ajustar cada cosa por separado.</p>';
    const rej = f.querySelector(".rejilla-temas-v269");
    TEMAS.forEach(t => {
      const b = document.createElement("button"); b.type = "button"; b.dataset.tema = t.id; b.setAttribute("aria-pressed", "false");
      b.style.setProperty("--c1", t.cols[0]); b.style.setProperty("--c2", t.cols[1]);
      b.innerHTML = '<i aria-hidden="true"></i><span></span>'; b.querySelector("span").textContent = t.nombre;
      b.addEventListener("click", () => aplicarTema(t)); rej.appendChild(b);
    });
    ancla.insertAdjacentElement("beforebegin", f);
    const p = personalActivo(); if (p) $("colorPersonalV269").value = p;
    $("usarColorV269").addEventListener("click", () => { const h = $("colorPersonalV269").value; if (hexValido(h)) { lsSet(K_PERSONAL, h); aplicarPersonal(h); marcarTema(); } });
    $("tipografiaV269").addEventListener("change", e => { lsSet(K_TIPO, e.target.checked ? "redondeada" : "sistema"); aplicarTipografia(); });
    const an = $("anillosV269check"); an.checked = ls(K_ANILLOS) !== "no";
    an.addEventListener("change", () => { lsSet(K_ANILLOS, an.checked ? "si" : "no"); pintarAnillos(); });
    // Elegir un color de la paleta de siempre quita el color personal
    document.addEventListener("click", e => { if (e.target.closest && e.target.closest("#firmasColorV260 button") && personalActivo()) { lsDel(K_PERSONAL); setTimeout(marcarTema, 0); } }, true);
    ["ambientesVisualesV260", "acabadosMetalV260"].forEach(id => $(id)?.addEventListener("click", () => setTimeout(marcarTema, 0)));
    $("fondoOledV264")?.addEventListener("change", () => setTimeout(marcarTema, 0));
    aplicarTipografia(); marcarTema();
  }
  function envolverFirma() {
    const orig = window.aplicarFirmaColorV260;
    if (typeof orig !== "function" || orig.v269) return;
    const nueva = function () { const r = orig.apply(this, arguments); const h = personalActivo(); if (h) aplicarPersonal(h); return r; };
    nueva.v269 = true; window.aplicarFirmaColorV260 = nueva;
    const h = personalActivo(); if (h) aplicarPersonal(h);
  }

  /* ================= 2. ANILLOS ================= */
  function computable(rs) { try { return calcularComputoMesMeta(rs).computable; } catch (e) { return rs.reduce((a, r) => a + Math.max(0, Number(r.minutos) || 0), 0); } }
  function datosAnillos() {
    const hoy = new Date(), mes = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0"), regs = registros();
    const delMes = regs.filter(r => String(r.fecha).startsWith(mes + "-")), obj = objetivo();
    const comp = computable(delMes), dias = new Set(delMes.filter(r => (Number(r.minutos) || 0) > 0).map(r => String(r.fecha).slice(0, 10)));
    const w = (hoy.getDay() + 6) % 7, lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - w, 12), l = fechaISO(lunes), hasta = fechaISO(new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6, 12));
    const semana = regs.filter(r => { const f = String(r.fecha).slice(0, 10); return f >= l && f <= hasta; }).reduce((a, r) => a + Math.max(0, Number(r.minutos) || 0), 0);
    const objSem = obj > 0 ? Math.round(obj * 7 / 30.4) : 0;
    return { obj, comp, activos: dias.size, trans: hoy.getDate(), semana, objSem,
      p1: obj > 0 ? comp / obj : 0, p2: hoy.getDate() > 0 ? dias.size / hoy.getDate() : 0, p3: objSem > 0 ? semana / objSem : 0 };
  }
  const R = [50, 38, 26], SW = 9;
  function anilloSVG(d) {
    const cols = [["var(--firma-luz,#80b3ff)", "var(--firma-base,#2864d7)"], ["#7ff0a0", "#1f9d55"], ["#ffd27a", "#e8890c"]], ps = [d.p1, d.p2, d.p3];
    let defs = "", cuerpo = "";
    R.forEach((r, i) => {
      const c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, ps[i]));
      defs += '<linearGradient id="gAn' + i + 'V269" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + cols[i][0] + '"/><stop offset="1" stop-color="' + cols[i][1] + '"/></linearGradient>';
      cuerpo += '<circle class="pista-an" cx="60" cy="60" r="' + r + '" stroke-width="' + SW + '"/>' +
        '<circle class="prog-an" data-i="' + i + '" cx="60" cy="60" r="' + r + '" stroke-width="' + SW + '" stroke="url(#gAn' + i + 'V269)" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + c.toFixed(2) + '" data-final="' + (c * (1 - p)).toFixed(2) + '" ' + (p <= 0 ? 'style="opacity:0"' : "") + '/>';
    });
    return '<svg viewBox="0 0 120 120" width="124" height="124" role="img" aria-label="Anillos de progreso"><defs>' + defs + '</defs>' + cuerpo + '</svg>';
  }
  function pintarAnillos() {
    const ant = $("seccionAnillosV269"), ancla = $("semanaVisualV193");
    if (ls(K_ANILLOS) === "no") { if (ant) ant.hidden = true; return; }
    if (!ancla) return;
    const d = datosAnillos(); let s = ant;
    if (!s) { s = document.createElement("section"); s.id = "seccionAnillosV269"; s.className = "seccion anillos-v269"; ancla.insertAdjacentElement("beforebegin", s); }
    s.hidden = false;
    const pct = Math.round(d.p1 * 100), hecho = d.obj > 0 && d.p1 >= 1;
    const filas = [
      ["Objetivo del mes", d.obj > 0 ? fmt(d.comp) : "Sin objetivo", d.obj > 0 ? " de " + fmt(d.obj) : "", "a1"],
      ["Constancia", d.activos + (d.activos === 1 ? " día" : " días"), " de " + d.trans, "a2"],
      ["Esta semana", fmt(d.semana), d.objSem > 0 ? " de " + fmt(d.objSem) : "", "a3"]
    ].map(f => '<li class="' + f[3] + '" title="' + f[0] + ': ' + f[1] + f[2] + '"><i aria-hidden="true"></i><span><small>' + f[0] + '</small><strong>' + f[1] + '<span class="de-v269">' + f[2] + '</span></strong></span></li>').join("");
    const firma = [d.obj, d.comp, d.activos, d.trans, d.semana].join("|");
    if (s.dataset.firma === firma && s.querySelector("svg")) return;
    s.dataset.firma = firma;
    s.innerHTML = '<article class="tarjeta anillos-tarjeta-v269"><div class="anillos-svg-v269">' + anilloSVG(d) + '<b class="centro-anillos">' + (d.obj > 0 ? (hecho ? "✓" : pct + "%") : "—") + '</b></div><ul class="anillos-leyenda-v269">' + filas + '</ul></article>';
    const circulos = s.querySelectorAll(".prog-an");
    const poner = () => circulos.forEach(c => { c.style.strokeDashoffset = c.dataset.final; });
    if (movReducido()) { circulos.forEach(c => { c.style.transition = "none"; }); poner(); }
    else requestAnimationFrame(() => requestAnimationFrame(poner));
    if (d.obj <= 0) { const p = document.createElement("p"); p.className = "anillos-nota-v269"; p.textContent = "Pon un objetivo mensual en Ajustes para llenar los anillos."; s.firstChild.appendChild(p); }
  }
  function animarAnillos() {
    const c = document.querySelectorAll("#seccionAnillosV269 .prog-an"); if (!c.length || movReducido()) return;
    c.forEach(x => { x.style.transition = "none"; x.style.strokeDashoffset = x.getAttribute("stroke-dasharray"); });
    void document.body.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => c.forEach(x => { x.style.transition = ""; x.style.strokeDashoffset = x.dataset.final; })));
  }
  function instalarAnillos() {
    pintarAnillos();
    window.addEventListener("miServicio:registroGuardadoV188", () => setTimeout(pintarAnillos, 200));
  }

  /* ================= 3. PAPELERA ================= */
  const DIAS_PAPELERA = 30, MAX_ENTRADAS = 300, MAX_CARACTERES = 600000;
  function leerPapelera() { try { const v = JSON.parse(ls(K_PAPELERA) || "[]"); return Array.isArray(v) ? v.filter(e => e && e.r && e.r.id && e.b) : []; } catch (e) { return []; } }
  function guardarPapelera(l) {
    l = l.slice(0, MAX_ENTRADAS);
    while (l.length) { const t = JSON.stringify(l); if (t.length <= MAX_CARACTERES && lsSet(K_PAPELERA, t)) return true; l = l.slice(0, -1); }
    lsDel(K_PAPELERA); return false;
  }
  function limpiarPapelera() {
    const ids = new Set(registros().map(r => r.id)), lim = Date.now() - DIAS_PAPELERA * 86400000;
    const l = leerPapelera().filter(e => !ids.has(e.r.id) && new Date(e.b).getTime() > lim);
    return l;
  }
  function enviarAPapelera(eliminados) {
    try {
      if (!Array.isArray(eliminados) || !eliminados.length) return;
      const ahora = new Date().toISOString(), l = limpiarPapelera(), existentes = new Set(l.map(e => e.r.id));
      eliminados.forEach(r => { if (r && r.id && !existentes.has(r.id)) l.unshift({ b: ahora, r: JSON.parse(JSON.stringify(r)) }); });
      guardarPapelera(l); pintarPapelera();
    } catch (e) { console.warn("[V269] papelera", e); }
  }
  function envolverDeshacer() {
    const orig = window.ofrecerDeshacerV202;
    if (typeof orig !== "function" || orig.v269) return;
    const nueva = function (eliminados) { enviarAPapelera(eliminados); return orig.apply(this, arguments); };
    nueva.v269 = true; window.ofrecerDeshacerV202 = nueva;
  }
  function textoHace(iso) { const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return d <= 0 ? "hoy" : d === 1 ? "ayer" : "hace " + d + " días"; }
  function pintarPapelera() {
    const det = $("papeleraV269"); if (!det) return;
    const l = limpiarPapelera();
    det.querySelector("summary").textContent = "Papelera" + (l.length ? " (" + l.length + ")" : "");
    const lista = det.querySelector(".lista-papelera-v269"); lista.textContent = "";
    if (!l.length) { const p = document.createElement("p"); p.className = "nota-v266"; p.textContent = "La papelera está vacía. Los registros que borres se guardan aquí " + DIAS_PAPELERA + " días."; lista.appendChild(p); }
    l.forEach((e, i) => {
      const f = document.createElement("div"); f.className = "fila-copia-v266";
      const s = document.createElement("span"); const r = e.r;
      s.textContent = nombreTipo(r.tipo) + " · " + fmt(Number(r.minutos) || 0) + " · " + String(r.fecha).slice(0, 10) + " · borrado " + textoHace(e.b);
      const b = document.createElement("button"); b.type = "button"; b.className = "boton-secundario"; b.textContent = "Restaurar"; b.dataset.id = r.id;
      f.append(s, b); lista.appendChild(f);
    });
    det.querySelector(".vaciar-papelera-v269").hidden = !l.length;
  }
  function restaurar(id) {
    const l = limpiarPapelera(), e = l.find(x => x.r.id === id); if (!e) return;
    if (registros().some(r => r.id === id)) { guardarPapelera(l.filter(x => x.r.id !== id)); pintarPapelera(); return; }
    const anteriores = estado.registros;
    estado.registros = [...anteriores, { ...e.r, modificadoEn: new Date().toISOString(), sincronizacion: { estado: "pendiente", ultimaSincronizacion: (e.r.sincronizacion && e.r.sincronizacion.ultimaSincronizacion) || null } }];
    let ok = false; try { ok = guardarRegistros(); } catch (err) {}
    if (!ok) { estado.registros = anteriores; const m = $("estadoPapeleraV269"); if (m) m.textContent = "No se pudo restaurar. Inténtalo de nuevo."; return; }
    guardarPapelera(l.filter(x => x.r.id !== id)); pintarPapelera();
    try { actualizarTodaLaInterfaz(); } catch (err) {}
    const m = $("estadoPapeleraV269"); if (m) m.textContent = "Registro restaurado ✓";
  }
  function instalarPapelera() {
    if ($("papeleraV269")) { pintarPapelera(); return; }
    const ancla = $("atajosV268") || $("copiasInternasV266") || $("ultimaCopiaAjustes"); if (!ancla) return;
    const d = document.createElement("details"); d.id = "papeleraV269"; d.className = "copias-internas-v266 papelera-v269";
    d.innerHTML = '<summary>Papelera</summary><p class="nota-v266">Los registros que borras se guardan aquí ' + DIAS_PAPELERA + ' días y se pueden restaurar. Solo existe en este dispositivo y no va en las copias de seguridad.</p><div class="lista-papelera-v269"></div><button type="button" class="boton-secundario vaciar-papelera-v269" hidden>Vaciar papelera</button><p id="estadoPapeleraV269" class="nota-v266" role="status"></p>';
    ancla.insertAdjacentElement("afterend", d);
    d.addEventListener("toggle", () => { if (d.open) pintarPapelera(); });
    d.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.id) restaurar(b.dataset.id);
      else if (b.classList.contains("vaciar-papelera-v269")) { if (window.confirm("Se borrarán definitivamente los registros de la papelera. ¿Continuar?")) { lsDel(K_PAPELERA); pintarPapelera(); $("estadoPapeleraV269").textContent = "Papelera vaciada."; } }
    });
    pintarPapelera();
  }

  /* ================= 4. META ANUAL PLEGADA CON RESUMEN ================= */
  const K_META = "miServicio.metaAbiertaV272";
  function textoMeta() {
    const t = x => ($(x)?.textContent || "").trim(), tot = t("metaTotal"), obj = t("metaObjetivoTexto"), pct = t("metaPorcentaje");
    return tot ? (obj || "") + (pct ? (obj ? " · " : "") + pct : "") : ""; /* V27638: sin el total, que ya se ve arriba */
  }
  function pintarResumenMeta() {
    const det = $("metaDetalleV260"); if (!det) return;
    const sum = det.querySelector(":scope > summary"); if (!sum) return;
    let r = sum.querySelector(".meta-resumen-v272");
    if (!r) { r = document.createElement("small"); r.className = "meta-resumen-v272"; const spans = sum.querySelectorAll(":scope > span"); (spans[1] || sum).appendChild(r); }
    r.textContent = textoMeta();
  }
  function instalarMeta() {
    const det = $("metaDetalleV260"); if (!det || det.dataset.v272) return; det.dataset.v272 = "1";
    det.open = ls(K_META) === "si";
    det.addEventListener("toggle", () => { lsSet(K_META, det.open ? "si" : "no"); });
    pintarResumenMeta();
    ["metaTotal", "metaObjetivoTexto", "metaPorcentaje"].forEach(id => { const e = $(id); if (e) new MutationObserver(pintarResumenMeta).observe(e, { childList: true, characterData: true, subtree: true }); });
    window.addEventListener("miServicio:registroGuardadoV188", () => setTimeout(pintarResumenMeta, 300));
    document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".nav-item,[data-seg-v264]")) setTimeout(pintarResumenMeta, 200); });
  }

  /* ================= 5. DIAGNÓSTICO ================= */
  const K_ERR = "miServicio.erroresV273";
  function errores() { try { const v = JSON.parse(ls(K_ERR) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function buildInstalada() { return (document.querySelector('meta[name="mi-servicio-build"]') || {}).content || "?"; }
  function bytesLS() { let n = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += (k.length + (localStorage.getItem(k) || "").length) * 2; } } catch (e) {} return n; }
  function tam(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
  async function sha256(buf) { const d = await crypto.subtle.digest("SHA-256", buf); return Array.from(new Uint8Array(d), b => b.toString(16).padStart(2, "0")).join(""); }
  let informeV273 = "";
  async function reunirDiagnostico(profundo) {
    const f = [];
    const inst = buildInstalada(); f.push(["Versión instalada", inst, "ok"]);
    let pub = null, textoSw = "";
    try { const r = await fetch("./sw.js?v=" + Date.now(), { cache: "no-store" }); if (r.ok) { textoSw = await r.text(); pub = (textoSw.match(/const BUILD\s*=\s*"([^"]+)"/) || [])[1] || null; } } catch (e) {}
    if (!navigator.onLine) f.push(["Versión publicada", "sin conexión", "aviso"]);
    else if (!pub) f.push(["Versión publicada", "no se pudo comprobar", "aviso"]);
    else f.push(["Versión publicada", pub + (pub === inst ? " · igual que la instalada" : " · DISTINTA de la instalada"), pub === inst ? "ok" : "aviso"]);
    let reg = null; try { reg = navigator.serviceWorker ? await navigator.serviceWorker.getRegistration() : null; } catch (e) {}
    if (!navigator.serviceWorker) f.push(["Servicio sin conexión", "no disponible en este navegador", "aviso"]);
    else if (!reg) f.push(["Servicio sin conexión", "sin registrar", "aviso"]);
    else f.push(["Servicio sin conexión", [reg.active ? "activo" : "no activo", reg.waiting ? "actualización esperando" : "", reg.installing ? "instalando" : "", navigator.serviceWorker.controller ? "controla la página" : "no controla la página"].filter(Boolean).join(" · "), reg.active ? "ok" : "aviso"]);
    if (reg && reg.update) { try { await reg.update(); f.push(["Buscar actualización", reg.installing || reg.waiting ? "hay una nueva versión descargándose" : "sin novedades", "ok"]); } catch (e) { f.push(["Buscar actualización", "falló: " + String((e && e.message) || e).slice(0, 120), "error"]); } }
    try { const n = await caches.keys(); f.push(["Cachés", n.join(", ") || "ninguna", "ok"]); } catch (e) { f.push(["Cachés", "no disponible", "aviso"]); }
    const b = bytesLS(); let extra = "";
    try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); if (e.quota) extra = " · total del navegador " + tam(e.usage || 0) + " de " + tam(e.quota); } } catch (e) {}
    f.push(["Datos de la app", tam(b) + " de unos 5 MB" + extra, b > 4194304 ? "aviso" : "ok"]);
    try { if (navigator.storage && navigator.storage.persisted) f.push(["Almacenamiento protegido", (await navigator.storage.persisted()) ? "sí" : "no (el sistema podría borrarlo si falta espacio)", "ok"]); } catch (e) {}
    f.push(["Registros guardados", String(registros().length), "ok"]);
    const pe = pendientes(); f.push(["Cambios sin sincronizar", pe ? (pe.n ? pe.n + " registro(s)" : "hay cambios pendientes") : "ninguno", pe ? "aviso" : "ok"]);
    const er = errores(); f.push(["Errores recientes", er.length ? er.length + " (ver abajo)" : "ninguno", er.length ? "aviso" : "ok"]);
    if (profundo && textoSw) {
      const re = /"\.\/([^"]+)":\s*"([0-9a-f]{64})"/g; let m, ok = 0; const mal = [];
      const lista = []; while ((m = re.exec(textoSw))) lista.push([m[1], m[2]]);
      for (const [ruta, hash] of lista) {
        try { const r = await fetch("./" + ruta + "?v=" + Date.now(), { cache: "no-store" }); if (!r.ok) { mal.push(ruta + " (no se encuentra)"); continue; } const h = await sha256(await r.arrayBuffer()); if (h === hash) ok++; else mal.push(ruta + " (no coincide)"); } catch (e) { mal.push(ruta + " (no se pudo leer)"); }
      }
      f.push(["Archivos publicados", (lista.length ? ok + " de " + lista.length + " correctos" : "sin lista de archivos") + (mal.length ? " · fallan: " + mal.join(", ") : ""), mal.length ? "error" : "ok"]);
    }
    return { f, er };
  }
  function pintarDiagnostico(res, cont) {
    cont.textContent = "";
    res.f.forEach(([k, v, st]) => { const fila = document.createElement("div"); fila.className = "fila-diag-v273 " + st; const a = document.createElement("small"), b = document.createElement("strong"); a.textContent = k; b.textContent = v; fila.append(a, b); cont.appendChild(fila); });
    if (res.er.length) { const h = document.createElement("p"); h.className = "nota-v266"; h.textContent = "Últimos errores:"; cont.appendChild(h); res.er.slice(0, 6).forEach(e => { const li = document.createElement("div"); li.className = "fila-diag-v273 error"; const a = document.createElement("small"), b = document.createElement("strong"); a.textContent = String(e.t || "").replace("T", " ").slice(0, 16); b.textContent = (e.m || "") + (e.s ? " · " + e.s : ""); li.append(a, b); cont.appendChild(li); }); }
    informeV273 = "Mi Servicio · informe de diagnóstico\n" + new Date().toISOString() + "\n" + (navigator.userAgent || "") + "\n\n" + res.f.map(x => x[0] + ": " + x[1]).join("\n") + (res.er.length ? "\n\nErrores:\n" + res.er.map(e => (e.t || "") + " " + (e.m || "") + " " + (e.s || "")).join("\n") : "");
  }
  function instalarDiagnostico() {
    if ($("diagnosticoV273")) return;
    const ancla = $("papeleraV269") || $("copiasInternasV266"); if (!ancla) return;
    const d = document.createElement("details"); d.id = "diagnosticoV273"; d.className = "copias-internas-v266 diagnostico-v273";
    d.innerHTML = '<summary>Diagnóstico</summary><p class="nota-v266">Sirve para saber qué versión tienes, si se ha podido actualizar y si hay errores. Si algo falla, pulsa «Copiar informe» y envíalo.</p><div class="lista-diag-v273" role="status"></div><div class="botones-diag-v273"><button type="button" class="boton-secundario" data-d="comprobar">Comprobar ahora</button><button type="button" class="boton-secundario" data-d="archivos">Comprobar archivos publicados</button><button type="button" class="boton-secundario" data-d="copiar">Copiar informe</button><button type="button" class="boton-secundario" data-d="recargar">Recargar la app</button><button type="button" class="boton-secundario" data-d="limpiar">Limpiar versiones antiguas</button><button type="button" class="boton-secundario" data-d="borrar">Borrar errores</button></div><p id="estadoDiagV273" class="nota-v266" role="status"></p>';
    ancla.insertAdjacentElement("afterend", d);
    const lista = d.querySelector(".lista-diag-v273"), msg = d.querySelector("#estadoDiagV273");
    let ocupado = false;
    async function correr(profundo) { if (ocupado) return; ocupado = true; msg.textContent = profundo ? "Comprobando archivos… (unos segundos)" : "Comprobando…"; try { pintarDiagnostico(await reunirDiagnostico(profundo), lista); msg.textContent = "Comprobado " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + "."; } catch (e) { msg.textContent = "No se pudo completar la comprobación."; } ocupado = false; }
    d.addEventListener("toggle", () => { if (d.open) correr(false); });
    d.addEventListener("click", async e => {
      const b = e.target.closest("button[data-d]"); if (!b) return; const a = b.dataset.d;
      if (a === "comprobar") correr(false); else if (a === "archivos") correr(true);
      else if (a === "recargar") location.reload();
      else if (a === "limpiar") { msg.textContent = "Limpiando…"; const r = await limpiarCaches(true); const txt = r.borradas ? "Se borraron " + r.borradas + " versiones antiguas de la app. Tus datos no se tocan." : (r.motivo ? "No se limpió: aún no hay una versión actual completa en caché." : "No había versiones antiguas que borrar."); await correr(false); msg.textContent = txt; }
      else if (a === "borrar") { lsDel(K_ERR); correr(false); }
      else if (a === "copiar") {
        if (!informeV273) await correr(false);
        try { await navigator.clipboard.writeText(informeV273); msg.textContent = "Informe copiado. Pégalo en un mensaje."; }
        catch (err) { const t = document.createElement("textarea"); t.value = informeV273; t.className = "informe-diag-v273"; t.readOnly = true; d.appendChild(t); t.focus(); t.select(); msg.textContent = "Copia el texto de abajo (mantén pulsado y elige Copiar)."; }
      }
    });
  }

  /* ================= 5b. LIMPIEZA DE VERSIONES ANTIGUAS ================= */
  function numCache(n) { const m = /^mi-servicio-v(\d+)$/.exec(n); return m ? parseInt(m[1], 10) : null; }
  async function limpiarCaches(forzar) {
    try {
      if (!window.caches) return { borradas: 0, quedan: 0 };
      const build = buildInstalada(), m = /-(\d+)$/.exec(build); if (!m) return { borradas: 0, quedan: 0 };
      const actual = "mi-servicio-v" + m[1], nombres = await caches.keys();
      if (!nombres.includes(actual)) return { borradas: 0, quedan: nombres.length, motivo: "sin caché actual" };
      const numActual = parseInt(m[1], 10);
      const propias = nombres.map(n => [n, numCache(n)]).filter(x => x[1] !== null);
      const anteriores = propias.filter(x => x[1] < numActual).sort((a, b) => b[1] - a[1]);
      const conservar = new Set([actual]);
      propias.filter(x => x[1] > numActual).forEach(x => conservar.add(x[0]));
      if (anteriores[0]) conservar.add(anteriores[0][0]);
      let borradas = 0;
      for (const [n] of propias) { if (!conservar.has(n)) { try { if (await caches.delete(n)) borradas++; } catch (e) {} } }
      return { borradas, quedan: nombres.length - borradas };
    } catch (e) { return { borradas: 0, quedan: 0 }; }
  }
  function programarLimpieza() { setTimeout(() => { limpiarCaches(false); }, 6000); }

  /* ================= 5c. PRÓXIMO EVENTO EN EL GRÁFICO DE INICIO ================= */
  const ICONOS_EV = { personal: "🗓️", vacaciones: "🏖️", trabajo: "💼", cita: "📍", viaje: "✈️", otro: "•" };
  const DIAS_VISTA_EV = 14;
  function iso2(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function candidatosEventos() {
    const ahora = new Date(), hoy = iso2(ahora), hh = String(ahora.getHours()).padStart(2, "0") + ":" + String(ahora.getMinutes()).padStart(2, "0");
    const lim = iso2(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + DIAS_VISTA_EV, 12));
    const l = [];
    const vale = (f, todo, hora) => f >= hoy && f <= lim && !(f === hoy && !todo && hora && hora < hh);
    try { const ev = (window.MiServicioEventosCalendario && window.MiServicioEventosCalendario.listar()) || []; ev.forEach(e => { if (vale(e.fecha, e.todoElDia, e.hora)) l.push({ fecha: e.fecha, todo: !!e.todoElDia, hora: e.todoElDia ? "" : (e.hora || ""), titulo: e.titulo, icono: ICONOS_EV[e.tipo] || "🗓️" }); }); } catch (e) {}
    try { const ag = (typeof estado !== "undefined" && estado.agendaSalidas) || {}; Object.keys(ag).forEach(f => { const v = ag[f] || {}; const hora = /^\d{2}:\d{2}$/.test(String(v.hora || "")) ? v.hora : ""; if (/^\d{4}-\d{2}-\d{2}$/.test(f) && vale(f, !hora, hora)) l.push({ fecha: f, todo: !hora, hora, titulo: v.companero ? "Salida con " + v.companero : "Salida planificada", icono: "🚶" }); }); } catch (e) {}
    l.sort((x, y) => x.fecha.localeCompare(y.fecha) || (x.todo === y.todo ? (x.hora || "").localeCompare(y.hora || "") : (x.todo ? -1 : 1)));
    return l;
  }
  function etiquetaDia(f) {
    const hoy = new Date(), h = iso2(hoy), m = iso2(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 12));
    if (f === h) return "Hoy"; if (f === m) return "Mañana";
    const d = new Date(f + "T12:00:00"); return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
  }
  function pintarEventoChip() {
    const art = document.querySelector("#seccionGraficoInicio .tarjeta-grafico-inicio"); if (!art) return;
    let chip = art.querySelector(".evento-chip-v276"); const l = candidatosEventos();
    if (!l.length) { if (chip) chip.remove(); return; }
    const e = l[0], mismos = l.filter(x => x.fecha === e.fecha).length - 1;
    if (!chip) {
      chip = document.createElement("button"); chip.type = "button"; chip.className = "evento-chip-v276";
      chip.innerHTML = '<span class="ico-ev-v276" aria-hidden="true"></span><span class="txt-ev-v276"><small></small><strong></strong></span><b class="mas-ev-v276" hidden></b>';
      chip.addEventListener("click", () => { const b = $("botonCalendarioInicio"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); });
      art.appendChild(chip);
    }
    const cuando = etiquetaDia(e.fecha) + " · " + (e.todo ? "Todo el día" : e.hora);
    chip.querySelector(".ico-ev-v276").textContent = e.icono;
    chip.querySelector("small").textContent = cuando; chip.querySelector("strong").textContent = e.titulo;
    const mas = chip.querySelector(".mas-ev-v276"); mas.hidden = mismos <= 0; mas.textContent = mismos > 0 ? "+" + mismos : "";
    chip.setAttribute("aria-label", "Próximo evento: " + e.titulo + ", " + cuando + (mismos > 0 ? ", y " + mismos + " más ese día" : "") + ". Abrir calendario");
    chip.dataset.fecha = e.fecha;
  }
  function instalarEventoChip() {
    pintarEventoChip();
    ["miServicio:eventosCalendarioActualizados", "miServicio:registroGuardadoV188"].forEach(ev => window.addEventListener(ev, () => setTimeout(pintarEventoChip, 150)));
    setInterval(pintarEventoChip, 60000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) pintarEventoChip(); });
    document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".nav-item")) setTimeout(pintarEventoChip, 150); });
  }


  /* ================= 5d. COMPROBACIÓN DE LOS NÚMEROS DE LOS GLOBOS ================= */
  /* Algunas versiones de iOS (p. ej. betas) han dejado sin pintar horas y porcentajes. Se comprueba sin avisar:
     1) ¿tienen tamaño, color y opacidad visibles y nada los tapa?  2) si no, se fuerza un repintado.
     3) si sigue mal, se activa un aspecto simplificado (sin animaciones ni sombras) y se anota en el diagnóstico. */
  function registrarFallo(m) {
    try { const l = errores(); l.unshift({ t: new Date().toISOString(), k: "globos", m: String(m).slice(0, 300), s: "v276.js" }); localStorage.setItem(K_ERR, JSON.stringify(l.slice(0, 20))); } catch (e) {}
  }
  function globosFallan() {
    const vista = $("vista-inicio"); if (!vista || !vista.classList.contains("activa")) return null;
    const nodos = [...document.querySelectorAll("#graficoInicio .orbita-actividad")]; if (!nodos.length) return null;
    const malos = [];
    nodos.forEach(n => {
      n.querySelectorAll(":scope>span:not(.sector-icono),:scope>b").forEach(s => {
        if (!/\d/.test(s.textContent)) return;
        const c = getComputedStyle(s), r = s.getBoundingClientRect();
        let ok = r.width > 2 && r.height > 2 && c.visibility === "visible" && c.display !== "none" && parseFloat(c.opacity) > 0.05 && !/rgba?\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)|transparent/.test(c.color + c.webkitTextFillColor) && parseFloat(c.fontSize) >= 5;
        if (ok) { const x = r.left + r.width / 2, y = r.top + r.height / 2, el = document.elementFromPoint(x, y); if (el && !(s === el || s.contains(el) || n.contains(el)) && el.closest("#graficoInicio")) ok = false; }
        if (!ok) malos.push(s.textContent.trim());
      });
    });
    return malos.length ? malos : false;
  }
  function comprobarGlobos() {
    let m = globosFallan(); if (!m) return;
    document.querySelectorAll("#graficoInicio .orbita-actividad>span,#graficoInicio .orbita-actividad>b").forEach(s => { const d = s.style.display; s.style.display = "none"; void s.offsetHeight; s.style.display = d; });
    setTimeout(() => {
      m = globosFallan(); if (!m) return;
      document.body.classList.add("globos-seguros-v276");
      registrarFallo("Números de los globos no visibles (" + m.join(", ") + "): aspecto simplificado activado");
    }, 400);
  }
  function instalarComprobacionGlobos() {
    setTimeout(comprobarGlobos, 3500);
    document.addEventListener("click", e => { if (e.target.closest && e.target.closest('.nav-item[data-vista="inicio"]')) setTimeout(comprobarGlobos, 900); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(comprobarGlobos, 900); });
  }


  /* ================= 8. PERSONAJE QUE EVOLUCIONA + GLOBOS CON VIDA ================= */
  /* Todo se calcula con tus registros; no se guarda nada nuevo. */
  const ACC_RANGO = { h50: "🧢", h100: "🎒", h250: "🌟", h500: "👑" };
  const NOMBRE_RANGO = { h50: "gorra por 50 horas", h100: "mochila por 100 horas", h250: "estrella por 250 horas", h500: "corona por 500 horas" };
  let evoCache = { t: 0, v: null };
  function evolucion() {
    const ahora = Date.now(); if (evoCache.v && ahora - evoCache.t < 20000) return evoCache.v;
    let racha = 0, g = {};
    try { const L = window.MiServicioV267 && window.MiServicioV267.calcularLogros; if (L) { const i = L(); racha = i.rachaActual || 0; g = i.ganados || {}; } } catch (e) {}
    const rango = g.h500 ? "h500" : g.h250 ? "h250" : g.h100 ? "h100" : g.h50 ? "h50" : "";
    evoCache = { t: ahora, v: { racha: racha >= 14 ? 14 : racha >= 7 ? 7 : racha >= 3 ? 3 : 0, rango } };
    return evoCache.v;
  }
  function franjaDia() { const h = new Date().getHours(); return (h >= 21 || h < 7) ? "noche" : (h >= 19 ? "tarde" : "dia"); }
  function estacionAnio() { const m = new Date().getMonth(); return m >= 2 && m <= 4 ? "primavera" : m <= 7 && m >= 5 ? "verano" : m >= 8 && m <= 10 ? "otono" : "invierno"; }
  function envolverContextoPersonaje() {
    const orig = window.obtenerContextoVisualPersonajeV186; if (typeof orig !== "function" || orig.__v276) return;
    const nuevo = function () {
      let r = null; try { r = orig.apply(this, arguments); } catch (e) {}
      try {
        const p = $("animalProgreso"), ev = evolucion();
        if (p) { p.dataset.rachaV276 = String(ev.racha); p.dataset.rangoV276 = ev.rango; p.dataset.franjaV276 = franjaDia(); p.dataset.estacionV276 = estacionAnio(); }
        if (!r && ev.rango) r = { tipo: "normal", accesorio: ACC_RANGO[ev.rango], descripcion: "Lleva " + NOMBRE_RANGO[ev.rango] + (ev.racha >= 3 ? " · racha de " + ev.racha + " días" : ""), tono: "normal" };
      } catch (e) {}
      return r;
    };
    nuevo.__v276 = true; window.obtenerContextoVisualPersonajeV186 = nuevo;
  }
  function progresoMes() { const e = $("porcentajeObjetivo"); const n = e ? parseFloat((e.textContent.match(/[\d.,]+/) || ["0"])[0].replace(",", ".")) : 0; return isNaN(n) ? 0 : n; }
  function marcarMeta() {
    const g = $("graficoInicio"); if (!g) return;
    const lograda = progresoMes() >= 100;
    if (g.classList.contains("meta-lograda-v276") !== lograda) g.classList.toggle("meta-lograda-v276", lograda);
  }
  function instalarVida() {
    envolverContextoPersonaje();
    marcarMeta(); setInterval(marcarMeta, 5000);
    document.addEventListener("touchstart", function () {}, { passive: true }); /* activa :active en iOS */
    window.addEventListener("miServicio:registroGuardadoV188", () => { evoCache.t = 0; setTimeout(marcarMeta, 400); });
    try { if (typeof window.actualizarPersonajeProgreso === "function") window.actualizarPersonajeProgreso(progresoMes()); } catch (e) {}
  }


  /* ================= 9. COMPAÑEROS + AÑO DE SERVICIO (Estadísticas) ================= */
  /* Todo se calcula con tus registros; no se guarda nada nuevo. */
  const MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function sinAcentos(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
  function deISO(s) { const p = String(s).slice(0, 10).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2], 12); }
  function hoyRelativo(f) {
    const d = Math.round((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12) - deISO(f)) / 86400000);
    if (d <= 0) return "hoy"; if (d === 1) return "ayer"; if (d < 14) return "hace " + d + " días";
    if (d < 60) return "hace " + Math.round(d / 7) + " semanas"; return "hace " + Math.round(d / 30.4) + " meses";
  }
  function calcularCompaneros() {
    const mapa = new Map(), limite = fechaISO(new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()));
    registros().forEach(r => {
      const f = String(r.fecha).slice(0, 10), min = Math.max(0, Number(r.minutos) || 0), nom = String(r.companero || "").trim();
      if (!nom || min <= 0 || f < limite) return;
      nom.split(/\s*(?:,|;|\sy\s|\se\s|&)\s*/i).map(x => x.trim()).filter(Boolean).forEach(n => {
        const k = sinAcentos(n); if (!k) return;
        let c = mapa.get(k); if (!c) { c = { nombres: {}, min: 0, n: 0, dias: new Set(), ultima: "" }; mapa.set(k, c); }
        c.nombres[n] = (c.nombres[n] || 0) + 1; c.min += min; c.dias.add(f); if (f > c.ultima) c.ultima = f;
      });
    });
    return Array.from(mapa.values()).map(c => { const nombre = Object.keys(c.nombres).sort((a, b) => c.nombres[b] - c.nombres[a])[0]; return { nombre, min: c.min, salidas: c.dias.size, ultima: c.ultima }; })
      .sort((a, b) => b.min - a.min).slice(0, 6);
  }
  function tonoNombre(n) { let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360; return h; }
  function pintarCompaneros() {
    const s = $("companerosV276"); if (!s) return;
    const lista = calcularCompaneros(), ol = s.querySelector(".comp-lista-v276");
    s.hidden = !lista.length; if (!lista.length) { ol.textContent = ""; return; }
    s.querySelector(".comp-sub-v276").textContent = "Últimos 12 meses · con quién más sales";
    const mx = Math.max(1, ...lista.map(c => c.min)); ol.textContent = "";
    lista.forEach((c, i) => {
      const li = document.createElement("li"); li.style.setProperty("--i", String(i)); li.style.setProperty("--h", String(tonoNombre(c.nombre)));
      const av = document.createElement("span"); av.className = "comp-avatar-v276"; av.setAttribute("aria-hidden", "true"); av.textContent = c.nombre.trim().charAt(0).toUpperCase();
      if (i < 3) { const m = document.createElement("i"); m.className = "comp-medalla-v276"; m.textContent = ["🥇", "🥈", "🥉"][i]; av.appendChild(m); }
      const cu = document.createElement("div"); cu.className = "comp-cuerpo-v276";
      const st = document.createElement("strong"); st.textContent = c.nombre.charAt(0).toUpperCase() + c.nombre.slice(1);
      const sm = document.createElement("small"); sm.textContent = fmt(c.min) + " · " + c.salidas + (c.salidas === 1 ? " salida" : " salidas") + " · última " + hoyRelativo(c.ultima);
      const br = document.createElement("span"); br.className = "comp-barra-v276"; br.setAttribute("aria-hidden", "true"); const b = document.createElement("b"); b.style.width = Math.max(6, Math.round(c.min / mx * 100)) + "%"; br.appendChild(b);
      cu.append(st, sm, br); li.append(av, cu); ol.appendChild(li);
    });
  }
  function instalarCompaneros() {
    if ($("companerosV276")) { pintarCompaneros(); return; }
    const ancla = $("segmentoStatsV264"); if (!ancla) return;
    const s = document.createElement("section"); s.id = "companerosV276"; s.className = "tarjeta companeros-v276"; s.hidden = true;
    s.innerHTML = '<h2 class="titulo-bloque-v267">Compañeros</h2><p class="comp-sub-v276"></p><ol class="comp-lista-v276"></ol>';
    ancla.insertAdjacentElement("afterend", s); pintarCompaneros();
  }

  /* ---- Año de servicio (septiembre – agosto) ---- */
  let anioV276 = null;
  function anioServicioHoy() { const h = new Date(); return h.getMonth() >= 8 ? h.getFullYear() + 1 : h.getFullYear(); }
  function calcularAnio(anio) {
    const meses = [], porDia = new Map(), tipos = {}; TIPOS.forEach(x => tipos[x] = 0);
    for (let i = 0; i < 12; i++) { const b = new Date(anio - 1, 8 + i, 1, 12); meses.push({ y: b.getFullYear(), m: b.getMonth(), min: 0 }); }
    const ini = anio - 1 + "-09-01", fin = anio + "-08-31";
    registros().forEach(r => {
      const f = String(r.fecha).slice(0, 10), min = Math.max(0, Number(r.minutos) || 0); if (f < ini || f > fin || min <= 0) return;
      const y = +f.slice(0, 4), m = +f.slice(5, 7) - 1, mm = meses.find(x => x.y === y && x.m === m); if (mm) mm.min += min;
      porDia.set(f, (porDia.get(f) || 0) + min); if (tipos[r.tipo] !== undefined) tipos[r.tipo] += min;
    });
    const total = meses.reduce((a, x) => a + x.min, 0), dias = Array.from(porDia.keys()).sort();
    let racha = 0, cur = 0, prev = null; dias.forEach(f => { const d = deISO(f); cur = prev && Math.round((d - prev) / 86400000) === 1 ? cur + 1 : 1; racha = Math.max(racha, cur); prev = d; });
    const mejor = meses.reduce((a, x) => x.min > a.min ? x : a, meses[0]), activos = meses.filter(x => x.min > 0).length;
    return { anio, meses, total, diasActivos: dias.length, racha, mejor, tipos, promedio: activos ? Math.round(total / activos) : 0 };
  }
  function cuentaArribaV276(el, destino, formateo) {
    if (movReducido() || destino <= 0) { el.textContent = formateo(destino); return; }
    const t0 = performance.now(), dur = 900; cancelAnimationFrame(el.__raf || 0);
    const paso = ahora => { const k = Math.min(1, (ahora - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = formateo(destino * e); if (k < 1) el.__raf = requestAnimationFrame(paso); else el.textContent = formateo(destino); };
    el.__raf = requestAnimationFrame(paso);
  }
  function pintarAnio(animar) {
    const s = $("anioServicioV276"); if (!s) return;
    if (anioV276 === null) anioV276 = anioServicioHoy();
    const d = calcularAnio(anioV276);
    s.querySelector(".anio-titulo-v276").textContent = "Tu año en cifras · " + d.anio;
    s.querySelector(".anio-sub-v276").textContent = "septiembre " + (d.anio - 1) + " – agosto " + d.anio;
    const mx = Math.max(1, ...d.meses.map(x => x.min)), barras = s.querySelector(".anio-barras-v276"); barras.textContent = "";
    d.meses.forEach((x, i) => {
      const c = document.createElement("div"); c.className = "anio-mes-v276" + (x === d.mejor && x.min > 0 ? " mejor" : ""); c.style.setProperty("--i", String(i)); c.title = MESES_L[x.m] + ": " + (x.min ? fmt(x.min) : "sin actividad");
      const b = document.createElement("i"); b.style.height = Math.max(x.min ? 8 : 3, Math.round(x.min / mx * 100)) + "%"; if (!x.min) b.className = "vacio";
      const l = document.createElement("small"); l.textContent = MESES_L[x.m].charAt(0).toUpperCase(); c.append(b, l); barras.appendChild(c);
    });
    const total = s.querySelector(".anio-total-v276"); total.setAttribute("aria-label", "Total del año de servicio: " + fmt(d.total));
    if (animar) cuentaArribaV276(total, d.total, fmt); else total.textContent = fmt(d.total);
    const horasEl = s.querySelector(".anio-datos-v276"); horasEl.textContent = ""; horasEl.dataset.n = d.promedio === d.total ? "3" : "4";
    [[String(d.diasActivos), d.diasActivos === 1 ? "día activo" : "días activos"], [String(d.racha), "racha máxima"], [d.total ? MESES_L[d.mejor.m].charAt(0).toUpperCase() + MESES_L[d.mejor.m].slice(1) : "—", "mejor mes"], [fmt(d.promedio), "media al mes"]].filter((p, i) => !(i === 3 && d.promedio === d.total)).forEach(p => {
      const e = document.createElement("div"); const b = document.createElement("strong"); b.textContent = p[0]; const sm = document.createElement("small"); sm.textContent = p[1]; e.append(b, sm); horasEl.appendChild(e);
    });
    s.querySelector(".anio-compartir-v276").disabled = !d.total;
    s.classList.toggle("sin-datos-v276", !d.total);
    try { vtPintar(); } catch (e) {}
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function imagenAnio(d) {
    const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920; const c = cv.getContext("2d"), fam = '-apple-system, "SF Pro Display", "Segoe UI", Roboto, system-ui, sans-serif';
    const g = c.createLinearGradient(0, 0, 1080, 1920); g.addColorStop(0, "#0a1a44"); g.addColorStop(.5, "#1c47a3"); g.addColorStop(1, "#08102a"); c.fillStyle = g; c.fillRect(0, 0, 1080, 1920);
    const rg = c.createRadialGradient(880, 240, 20, 880, 240, 640); rg.addColorStop(0, "rgba(140,185,255,.5)"); rg.addColorStop(1, "rgba(140,185,255,0)"); c.fillStyle = rg; c.fillRect(0, 0, 1080, 1100);
    c.textAlign = "center"; c.fillStyle = "rgba(255,255,255,.72)"; c.font = "600 40px " + fam; c.fillText("MI AÑO DE SERVICIO", 540, 170);
    c.fillStyle = "#fff"; c.font = "800 150px " + fam; c.fillText(String(d.anio), 540, 330);
    c.fillStyle = "rgba(255,255,255,.6)"; c.font = "500 42px " + fam; c.fillText("septiembre " + (d.anio - 1) + " – agosto " + d.anio, 540, 400);
    c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 24; c.fillStyle = "#fff"; c.font = "800 190px " + fam;
    const horas = Math.floor(d.total / 60), mins = d.total % 60; c.fillText(String(horas), 540, 700); c.shadowBlur = 0;
    c.fillStyle = "rgba(255,255,255,.85)"; c.font = "600 54px " + fam; c.fillText("horas" + (mins ? " y " + mins + " min" : ""), 540, 775);
    const mx = Math.max(1, ...d.meses.map(x => x.min)), x0 = 90, bw = 56, gap = 18, base = 1240, alto = 330;
    d.meses.forEach((m, i) => {
      const x = x0 + i * (bw + gap), h = Math.max(m.min ? 18 : 6, m.min / mx * alto), y = base - h, mejor = m === d.mejor && m.min > 0;
      const gr = c.createLinearGradient(0, y, 0, base); if (mejor) { gr.addColorStop(0, "#ffe08a"); gr.addColorStop(1, "#e79a1d"); } else { gr.addColorStop(0, "#9ec7ff"); gr.addColorStop(1, "#2f6fe0"); }
      c.fillStyle = m.min ? gr : "rgba(255,255,255,.14)"; rrect(c, x, y, bw, h, Math.min(16, h / 2)); c.fill();
      c.fillStyle = "rgba(255,255,255,.7)"; c.font = "600 30px " + fam; c.fillText(MESES_L[m.m].charAt(0).toUpperCase(), x + bw / 2, base + 46);
    });
    const datos = [[String(d.diasActivos), d.diasActivos === 1 ? "día activo" : "días activos"], [String(d.racha), "racha máxima"], [d.total ? MESES_L[d.mejor.m] : "—", "mejor mes"]];
    datos.forEach((p, i) => { const x = 210 + i * 330; c.fillStyle = "#fff"; c.font = "800 62px " + fam; c.fillText(p[0], x, 1500); c.fillStyle = "rgba(255,255,255,.65)"; c.font = "500 34px " + fam; c.fillText(p[1], x, 1550); });
    c.fillStyle = "rgba(255,255,255,.7)"; c.font = "600 38px " + fam; c.fillText("Media: " + fmt(d.promedio) + " al mes", 540, 1650);
    c.fillStyle = "rgba(255,255,255,.45)"; c.font = "600 34px " + fam; c.fillText("Mi Servicio", 540, 1860);
    return cv;
  }
  async function compartirAnio(btn) {
    const msg = $("anioServicioV276").querySelector(".anio-estado-v276"); const d = calcularAnio(anioV276 === null ? anioServicioHoy() : anioV276);
    try {
      const cv = imagenAnio(d), blob = await new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error("sin imagen")), "image/png"));
      const nombre = "MiServicio-anio-" + d.anio + ".png", file = new File([blob], nombre, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        try { await navigator.share({ files: [file], title: "Mi año de servicio " + d.anio }); msg.textContent = "Imagen compartida ✓"; return; } catch (e) { if (e && e.name === "AbortError") return; }
      }
      const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); msg.textContent = "Imagen descargada ✓";
    } catch (e) { msg.textContent = "No se pudo crear la imagen."; }
  }
  function fusionarCalor() {
    const host = $("anioServicioV276"), c = $("calorAnualV267"); if (!host || !c || host.contains(c)) return !!(host && c);
    host.insertBefore(c, host.querySelector(".anio-compartir-v276")); c.classList.add("calor-fusionado-v276"); return true;
  }
  function esperarCalor(n) { if (fusionarCalor() || n <= 0) return; setTimeout(() => esperarCalor(n - 1), 700); }
  function instalarAnio() {
    if ($("anioServicioV276")) { pintarAnio(false); fusionarCalor(); return; }
    const ancla = $("segmentoStatsV264"); if (!ancla) return;
    const s = document.createElement("section"); s.id = "anioServicioV276"; s.className = "tarjeta anio-v276";
    s.innerHTML = '<div class="anio-cab-v276"><button type="button" class="boton-periodo" data-a="-1" aria-label="Año de servicio anterior">‹</button><div><h2 class="anio-titulo-v276"></h2><p class="anio-sub-v276"></p></div><button type="button" class="boton-periodo" data-a="1" aria-label="Año de servicio siguiente">›</button></div>' +
      '<div class="anio-total-v276" role="img"></div><div class="anio-barras-v276" aria-hidden="true"></div><div class="anio-datos-v276"></div>' +
      '<button type="button" class="boton-secundario anio-compartir-v276">✨ Compartir tarjeta del año</button><p class="anio-estado-v276" role="status"></p>';
    ancla.insertAdjacentElement("afterend", s);
    s.addEventListener("click", e => {
      if (e.target.closest("#calorAnualV267")) return; /* el calendario gestiona sus propios clics */
      const a = e.target.closest(".anio-cab-v276 [data-a]");
      if (a) { anioV276 += Number(a.dataset.a); pintarAnio(true); const c = $("calorAnualV267"), nav = c && c.querySelector('[data-a="' + a.dataset.a + '"]'); if (nav) nav.click(); return; }
      const b = e.target.closest(".anio-compartir-v276"); if (b) compartirAnio(b);
    });
    pintarAnio(true); esperarCalor(8);
  }
  function instalarEstadisticasNuevas() {
    const todo = () => { try { instalarCompaneros(); instalarAnio(); } catch (e) { console.warn("[V276 estadísticas]", e); } };
    todo();
    window.addEventListener("miServicio:registroGuardadoV188", () => setTimeout(() => { try { pintarCompaneros(); pintarAnio(false); } catch (e) {} }, 450));
    document.addEventListener("click", e => {
      if (e.target.closest && e.target.closest('.nav-item[data-vista="estadisticas"]')) setTimeout(() => { try { pintarCompaneros(); pintarAnio(true); } catch (er) {} }, 150);
      if (e.target.closest && e.target.closest("[data-seg-v264]")) setTimeout(() => { try { pintarAnio(true); } catch (er) {} }, 60);
    });
  }

  /* ================= 6. CAMBIOS SIN SINCRONIZAR ================= */
  function pendientes() {
    let base = 0; const crudo = ls("miServicio.ultimaSyncOneDrive");
    if (crudo) { let v = crudo; try { v = JSON.parse(crudo); } catch (e) {} base = Date.parse(v) || 0; }
    let flag = false; try { flag = JSON.parse(ls("miServicio.onedriveCambioLocalPendiente") || "false") === true; } catch (e) {}
    if (!base && !flag) return null;
    const n = registros().filter(r => (Date.parse(r.modificadoEn || r.creadoEn || 0) || 0) > base + 1000).length;
    return (n || flag) ? { n, flag } : null;
  }
  function pintarPendientes() {
    const box = $("estadoConexionV190"); if (!box) return;
    let b = box.querySelector(".pendientes-v273"); const p = pendientes();
    if (!p) { if (b) b.remove(); box.removeAttribute("data-pendientes-v273"); return; }
    if (!b) { b = document.createElement("span"); b.className = "pendientes-v273"; box.appendChild(b); }
    b.textContent = p.n ? String(p.n) : "•";
    const t = p.n ? p.n + (p.n === 1 ? " cambio sin sincronizar con OneDrive" : " cambios sin sincronizar con OneDrive") : "Hay cambios sin sincronizar con OneDrive";
    b.title = t; b.setAttribute("aria-label", t); box.setAttribute("data-pendientes-v273", "1");
  }
  function instalarPendientes() {
    pintarPendientes();
    ["miServicio:estadoSyncV190", "miServicio:registroGuardadoV188"].forEach(ev => window.addEventListener(ev, () => setTimeout(pintarPendientes, 250)));
    setInterval(pintarPendientes, 30000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) pintarPendientes(); });
  }

  /* ================= 7. ACCESIBILIDAD ================= */
  function etiquetarAccesibilidad() {
    try {
      document.querySelectorAll("#graficoInicio .orbita-actividad").forEach(n => {
        const nombre = ((n.querySelector(":scope > span:not(.sector-icono)") || {}).textContent || n.dataset.actividadInicio || "Actividad").trim();
        const texto = (n.innerText || "").replace(/\s+/g, " ").trim();
        n.setAttribute("role", "img"); n.setAttribute("aria-label", texto && texto !== nombre ? texto : nombre);
      });
      const c = document.querySelector("#graficoInicio .orbita-centro");
      if (c) { c.setAttribute("role", "img"); c.setAttribute("aria-label", "Total del mes: " + (c.innerText || "").replace(/\s+/g, " ").trim()); }
      const an = document.querySelector("#seccionAnillosV269 .anillos-svg-v269 svg");
      if (an) { const t = Array.from(document.querySelectorAll("#seccionAnillosV269 .anillos-leyenda-v269 li")).map(li => (li.getAttribute("title") || "")).filter(Boolean).join(". "); an.setAttribute("aria-label", "Anillos de progreso. " + t); }
      const barra = document.querySelector("#seccionObjetivoInicioV260 .barra-progreso, #seccionObjetivoInicioV260 [class*=barra]");
      const pct = document.querySelector("#seccionObjetivoInicioV260 [class*=porcentaje], #porcentajeObjetivoInicio");
      if (barra && pct && !barra.getAttribute("role")) { const v = parseInt(pct.textContent, 10); if (!Number.isNaN(v)) { barra.setAttribute("role", "progressbar"); barra.setAttribute("aria-valuemin", "0"); barra.setAttribute("aria-valuemax", "100"); barra.setAttribute("aria-valuenow", String(Math.min(100, v))); barra.setAttribute("aria-label", "Progreso del objetivo mensual"); } }
      document.querySelectorAll("button:not([aria-label])").forEach(b => { if (!(b.textContent || "").trim() && !b.querySelector("img[alt]") && b.title) b.setAttribute("aria-label", b.title); });
    } catch (e) {}
  }
  function instalarAccesibilidad() {
    etiquetarAccesibilidad(); let pend = false;
    const g = $("graficoInicio"); if (g) new MutationObserver(() => { if (pend) return; pend = true; setTimeout(() => { pend = false; etiquetarAccesibilidad(); }, 200); }).observe(g, { childList: true, subtree: true, characterData: true });
    window.addEventListener("miServicio:registroGuardadoV188", () => setTimeout(etiquetarAccesibilidad, 500));
    document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".nav-item")) setTimeout(etiquetarAccesibilidad, 300); });
  }

  /* ================= 10. PERSONAS INTERESADAS (discreto, dentro de "Detalles opcionales" de Registrar) =================
     Clave nueva: miServicio.interesadosV276 = [{id,nombre,nota,fecha}] · va en la copia JSON (ajustesLocales). */
  const K_INT = "miServicio.interesadosV276", MAX_INT = 200;
  function leerInteresados() {
    try { const a = JSON.parse(ls(K_INT) || "[]"); return Array.isArray(a) ? a.filter(x => x && typeof x.nombre === "string" && x.nombre).slice(0, MAX_INT) : []; } catch (e) { return []; }
  }
  function guardarInteresados(a) { return lsSet(K_INT, JSON.stringify(a.slice(0, MAX_INT))); }
  function pintarInteresados() {
    const r = $("interesadosV276"); if (!r) return;
    const lista = r.querySelector(".int-lista-v276"), cont = r.querySelector(".int-cuenta-v276");
    const a = leerInteresados(); lista.textContent = "";
    a.forEach(p => {
      const li = document.createElement("li");
      const t = document.createElement("span"); t.className = "int-texto-v276";
      const n = document.createElement("b"); n.textContent = p.nombre; t.appendChild(n);
      if (p.nota) { const s = document.createElement("small"); s.textContent = p.nota; t.appendChild(s); }
      const b = document.createElement("button"); b.type = "button"; b.className = "int-borrar-v276"; b.textContent = "✕"; b.setAttribute("aria-label", "Borrar a " + p.nombre);
      let armado = 0;
      b.addEventListener("click", () => {
        if (!armado) { armado = 1; b.textContent = "¿Borrar?"; b.classList.add("armado"); setTimeout(() => { armado = 0; b.textContent = "✕"; b.classList.remove("armado"); }, 3000); return; }
        guardarInteresados(leerInteresados().filter(x => x.id !== p.id)); pintarInteresados();
      });
      li.append(t, b); lista.appendChild(li);
    });
    cont.textContent = a.length ? String(a.length) : "";
    const lc = document.querySelector("#libretaV276 .libreta-cuenta-v276"); if (lc) lc.textContent = a.length ? String(a.length) : "";
  }
  function apuntarInteresado() {
    const r = $("interesadosV276"); if (!r) return;
    const n = r.querySelector(".int-nombre-v276"), no = r.querySelector(".int-nota-v276"), m = r.querySelector(".int-msg-v276");
    const nombre = n.value.replace(/\s+/g, " ").trim().slice(0, 60);
    if (!nombre) { m.textContent = "Escribe un nombre"; n.focus(); return; }
    const a = leerInteresados();
    if (a.length >= MAX_INT) { m.textContent = "Lista llena (200)"; return; }
    a.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nombre, nota: no.value.replace(/\s+/g, " ").trim().slice(0, 200), fecha: fechaISO(new Date()) });
    if (!guardarInteresados(a)) { m.textContent = "No se pudo guardar"; return; }
    n.value = ""; no.value = ""; m.textContent = "Apuntado"; setTimeout(() => { if (m.textContent === "Apuntado") m.textContent = ""; }, 1800);
    pintarInteresados(); n.focus();
  }
  function instalarInteresados() {
    if ($("interesadosV276")) return;
    const btn = document.createElement("button"); btn.type = "button"; btn.id = "libretaV276"; btn.className = "libreta-v276";
    btn.setAttribute("aria-label", "Interesados: abrir libreta"); btn.setAttribute("aria-expanded", "false"); btn.hidden = true;
    btn.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="7" y="3.5" width="19" height="25" rx="3" fill="currentColor" opacity=".16"/><rect x="7" y="3.5" width="19" height="25" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M11.5 3.5v25" stroke="currentColor" stroke-width="1.8"/><path d="M15 10h7M15 14h7M15 18h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4 8h5M4 13h5M4 18h5M4 23h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span class="libreta-cuenta-v276"></span>';
    const d = document.createElement("div"); d.id = "interesadosV276"; d.className = "interesados-v276"; d.hidden = true;
    d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Personas interesadas");
    d.innerHTML = '<div class="int-fondo-v276"></div><div class="int-hoja-v276"><div class="int-cab-v276"><b>Interesados</b><span class="int-cuenta-v276"></span><button type="button" class="int-cerrar-v276" aria-label="Cerrar">Listo</button></div>' +
      '<div class="int-cuerpo-v276"><div class="int-fila-v276"><input class="int-nombre-v276" type="text" maxlength="60" placeholder="Nombre" autocomplete="off" autocapitalize="words" enterkeyhint="done" aria-label="Nombre de la persona interesada">' +
      '<button type="button" class="int-ok-v276">Apuntar</button></div>' +
      '<input class="int-nota-v276" type="text" maxlength="200" placeholder="Nota (opcional)" autocomplete="off" aria-label="Nota sobre la persona">' +
      '<p class="int-msg-v276" role="status" aria-live="polite"></p><ul class="int-lista-v276"></ul></div></div>';
    document.body.append(btn, d);
    const abrir = () => { d.hidden = false; btn.setAttribute("aria-expanded", "true"); requestAnimationFrame(() => d.classList.add("abierto")); setTimeout(() => { try { d.querySelector(".int-nombre-v276").focus({ preventScroll: true }); } catch (e) {} }, 120); };
    const cerrar = () => { d.classList.remove("abierto"); btn.setAttribute("aria-expanded", "false"); d.querySelector(".int-msg-v276").textContent = ""; setTimeout(() => { if (!d.classList.contains("abierto")) d.hidden = true; }, movReducido() ? 0 : 220); try { document.activeElement && document.activeElement.blur(); } catch (e) {} };
    btn.addEventListener("click", () => (d.hidden ? abrir() : cerrar()));
    d.querySelector(".int-cerrar-v276").addEventListener("click", cerrar);
    d.querySelector(".int-fondo-v276").addEventListener("click", cerrar);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !d.hidden) cerrar(); });
    d.querySelector(".int-ok-v276").addEventListener("click", apuntarInteresado);
    d.querySelectorAll("input").forEach(i => i.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); apuntarInteresado(); } }));
    const vis = () => { const v = $("vista-registrar"); const on = !!(v && v.classList.contains("activa")); btn.hidden = !on; if (!on && !d.hidden) cerrar(); };
    const v = $("vista-registrar"); if (v) new MutationObserver(vis).observe(v, { attributes: true, attributeFilter: ["class"] });
    vis(); pintarInteresados();
  }

  /* ================= 11. INICIO ENCAJADO: recuperación tras tocar la pantalla (iOS) =================
     En el iPhone, tocar/arrastrar puede mover el visor o el documento unos píxeles y dejar el ajuste de Inicio descolocado
     hasta cambiar de pestaña. Aquí se vuelve a medir al soltar el dedo y se evita que el bloqueo sea permanente. */
  function instalarRecuperacionEncaje() {
    if (typeof programarEncajeV260 !== "function") return;
    let t = 0, tb = 0;
    const activo = () => { const v = $("vista-inicio"); return !!(v && v.classList.contains("activa")); };
    const rehacer = () => { if (activo()) programarEncajeV260(true); };
    const luego = (ms) => { clearTimeout(t); t = setTimeout(rehacer, ms); };
    document.addEventListener("touchend", () => luego(380), { passive: true });
    document.addEventListener("touchcancel", () => luego(380), { passive: true });
    window.addEventListener("orientationchange", () => luego(450));
    window.addEventListener("pageshow", () => luego(100));
    window.addEventListener("scroll", () => {
      if (!document.body.classList.contains("inicio-encajado-v260")) return;
      if ((window.scrollY || 0) > 0 || (window.scrollX || 0) > 0) { try { window.scrollTo(0, 0); } catch (e) {} luego(250); }
    }, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener("scroll", () => luego(250), { passive: true });
    /* El bloqueo por falta de espacio no debe ser eterno: un fallo transitorio se vuelve a medir pasados 1,2 s. */
    let claveReint = "", reint = 0;
    setInterval(() => {
      if (!activo() || document.hidden) return;
      if (!document.body.classList.contains("inicio-encajado-v260") && typeof bloqueoEncajeV260 !== "undefined" && bloqueoEncajeV260) {
        if (claveReint !== bloqueoEncajeV260) { claveReint = bloqueoEncajeV260; reint = 0; }
        if (reint >= 2) return; /* tamaño sin espacio real: no insistir ni repetir mediciones */
        reint++; clearTimeout(tb); tb = setTimeout(rehacer, 0);
      }
    }, 1200);
  }

  /* ================= 12. COLOR DE LA APP EN TODAS LAS PANTALLAS =================
     A partir del color elegido (--firma-base) se calculan variantes con contraste suficiente (≥ 4,5:1) para
     rellenos con texto blanco y para texto sobre botones grises, en claro y en oscuro. Las usa el estilo iOS. */
  function contraste(a, b) { const x = luminancia(a) + .05, y = luminancia(b) + .05; return Math.max(x, y) / Math.min(x, y); }
  function ajustarContraste(rgb, fondo, objetivo, haciaOscuro) {
    let c = rgb.slice(), n = 0;
    while (contraste(c, fondo) < objetivo && n++ < 40) c = mezcla(c, haciaOscuro ? [0, 0, 0] : [255, 255, 255], .08);
    return c;
  }
  function sincronizarAcento() {
    try {
      const raw = (getComputedStyle(document.body).getPropertyValue("--firma-base") || "").trim();
      if (!hexValido(raw)) return;
      const base = hexARgb(raw), s = document.body.style;
      const fuerte = ajustarContraste(base, [255, 255, 255], 4.6, true);       /* relleno con texto blanco */
      const txtClaro = ajustarContraste(base, [229, 229, 234], 4.8, true);     /* texto sobre botón gris claro */
      const txtOscuro = ajustarContraste(base, [58, 58, 60], 4.8, false);      /* texto sobre botón gris oscuro */
      const nuevo = [aHex(fuerte), aHex(txtClaro), aHex(txtOscuro), fuerte.map(Math.round).join(",")];
      if (s.getPropertyValue("--app-fuerte") === nuevo[0] && s.getPropertyValue("--app-texto-oscuro") === nuevo[2]) return;
      s.setProperty("--app-fuerte", nuevo[0]); s.setProperty("--app-texto-claro", nuevo[1]);
      s.setProperty("--app-texto-oscuro", nuevo[2]); s.setProperty("--app-fuerte-rgb", nuevo[3]);
    } catch (e) { console.warn("[V276] acento", e); }
  }
  function instalarAcento() {
    sincronizarAcento();
    try { new MutationObserver(sincronizarAcento).observe(document.body, { attributes: true, attributeFilter: ["style", "data-firma"] }); } catch (e) {}
    window.addEventListener("storage", () => setTimeout(sincronizarAcento, 0));
  }

  /* ================= 13. TÍTULO COMPACTO AL DESPLAZAR (Historial, Ajustes, Estadísticas) =================
     Cuando el título grande sale de la pantalla, aparece una barra fina translúcida con el título, como en iOS.
     Solo es visual (no recibe toques) y no cambia el diseño de las pantallas. */
  function instalarTituloCompacto() {
    if ($("tituloCompactoV276")) return;
    const b = document.createElement("div"); b.id = "tituloCompactoV276"; b.setAttribute("aria-hidden", "true");
    b.innerHTML = "<span></span>"; document.body.appendChild(b);
    const texto = b.firstChild; let pend = 0, visible = false;
    const aplica = () => ["vista-historial", "vista-ajustes", "vista-estadisticas"].some(id => { const v = $(id); return v && v.classList.contains("activa"); });
    function revisar() {
      pend = 0;
      let on = false;
      if (aplica()) {
        const t = $("tituloVista"); const r = t && t.getBoundingClientRect();
        on = !!(r && r.height > 0 && r.bottom < 34);
        if (on) { const s = (t.textContent || "").replace(/\s+/g, " ").trim(); if (texto.textContent !== s) texto.textContent = s; }
      }
      if (on !== visible) { visible = on; b.classList.toggle("visible", on); }
    }
    const pedir = () => { if (!pend) pend = requestAnimationFrame(revisar); };
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    document.addEventListener("click", () => setTimeout(pedir, 60), true);
    new MutationObserver(pedir).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
    revisar();
  }

  /* ================= 14. INICIO VIVO: anillos de progreso, cristal, entrada suave y cielo por hora =================
     Todo es decorativo: se añade al lado de lo que ya existe, no cambia cifras, posiciones ni datos. */
  const NS_SVG = "http://www.w3.org/2000/svg";
  const sinMovimiento = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  const minDeTexto = t => { const h = /(\d+)\s*h/.exec(t), m = /(\d+)\s*min/.exec(t); return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0); };
  const textoDeMin = n => { n = Math.max(0, Math.round(n)); const h = Math.floor(n / 60), m = n % 60; return h === 0 ? m + " min" : m === 0 ? h + " h" : h + " h " + m + " min"; };
  let ivUltima = 0;
  const IV_D1 = 'M50 -4.5A54.5 54.5 0 0 1 50 104.5A54.5 54.5 0 0 1 50 -4.5', IV_D2 = 'M50 -5A55 55 0 0 1 50 105A55 55 0 0 1 50 -5';

  function ivDefs() {
    if ($("ivDefsV276")) return;
    const s = document.createElementNS(NS_SVG, "svg");
    s.id = "ivDefsV276"; s.setAttribute("width", "0"); s.setAttribute("height", "0"); s.setAttribute("aria-hidden", "true");
    s.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    s.innerHTML = '<defs>'
      + '<radialGradient id="ivSpec" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset=".55" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="ivScrim" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0a1432" stop-opacity=".54"/><stop offset=".62" stop-color="#0a1432" stop-opacity=".42"/><stop offset="1" stop-color="#0a1432" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="ivCaus" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="ivRim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".45" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".38"/></linearGradient>'
      + '</defs>';
    document.body.appendChild(s);
  }
  function ivSvgBurbuja(pct) {
    return '<svg class="orb-anillo-v276" viewBox="0 0 100 100" aria-hidden="true" focusable="false">'
      + '<ellipse cx="50" cy="54" rx="43" ry="35" fill="url(#ivScrim)"/>'
      + '<ellipse cx="35" cy="24" rx="21" ry="11" transform="rotate(-30 35 24)" fill="url(#ivSpec)"/>'
      + '<ellipse cx="60" cy="85" rx="21" ry="6.5" fill="url(#ivCaus)"/>'
      + '<circle cx="50" cy="50" r="49.3" fill="none" stroke="url(#ivRim)" stroke-width="1.4" vector-effect="non-scaling-stroke"/>'
      + '<path class="orb-pista" d="' + IV_D1 + '" pathLength="100" fill="none"/>'
      + '<path class="orb-base" d="' + IV_D1 + '" pathLength="100" fill="none" style="--p:0" data-p="' + pct + '"/>'
      + '<path class="orb-arco" d="' + IV_D1 + '" pathLength="100" fill="none" style="--p:0" data-p="' + pct + '"/></svg>';
  }
  function ivSvgCentro(pct) {
    return '<svg class="orb-anillo-v276 orb-anillo-centro" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><title>Objetivo del mes: ' + pct + ' %</title>'
      + '<path class="orb-pista" d="' + IV_D2 + '" pathLength="100" fill="none"/>'
      + '<path class="orb-base" d="' + IV_D2 + '" pathLength="100" fill="none" style="--p:0" data-p="' + pct + '"/>'
      + '<path class="orb-arco" d="' + IV_D2 + '" pathLength="100" fill="none" style="--p:0" data-p="' + pct + '"/></svg>';
  }
  function ivPctObjetivo() { const e = $("porcentajeObjetivo"); const n = e ? parseInt((e.textContent || "").replace(/[^\d]/g, ""), 10) : NaN; return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0; }

  function ivPintarAnillos() {
    const g = $("graficoInicio"); if (!g) return;
    ivDefs();
    g.querySelectorAll(".orbita-actividad").forEach(n => {
      const pct = parseInt(((n.querySelector(":scope>b") || {}).textContent || "").replace(/[^\d]/g, ""), 10) || 0;
      const v = n.querySelector(":scope>.orb-anillo-v276");
      if (v) { v.querySelectorAll("[data-p]").forEach(c => c.dataset.p = pct); return; }
      n.insertAdjacentHTML("afterbegin", ivSvgBurbuja(pct));
    });
    const c = g.querySelector(".orbita-centro");
    if (c) {
      const pct = ivPctObjetivo(), v = c.querySelector(":scope>.orb-anillo-v276");
      if (v) { v.querySelectorAll("[data-p]").forEach(x => x.dataset.p = pct); const t = v.querySelector("title"); if (t) t.textContent = "Objetivo del mes: " + pct + " %"; }
      else c.insertAdjacentHTML("afterbegin", ivSvgCentro(pct));
    }
    ivAjustarArcos(false);
  }
  /* animar=true: los arcos parten de 0 y se dibujan; false: se colocan sin más (cambios de datos o movimiento reducido). */
  function ivAjustarArcos(animar) {
    const g = $("graficoInicio"); if (!g) return;
    const arcos = [...g.querySelectorAll(".orb-arco,.orb-base")];
    if (!animar || sinMovimiento()) { arcos.forEach(a => a.style.setProperty("--p", a.dataset.p || 0)); return; }
    g.classList.add("iv-sin-trans"); arcos.forEach(a => a.style.setProperty("--p", 0)); void g.offsetWidth; g.classList.remove("iv-sin-trans");
    requestAnimationFrame(() => requestAnimationFrame(() => arcos.forEach(a => a.style.setProperty("--p", a.dataset.p || 0))));
  }
  /* Solo cuenta las cifras de las burbujas. El total central NO se toca: visual-v260.js lanza una animación de opacidad cada vez que cambia su texto y, apiladas, dejaban el total invisible en iPhone. */
  function ivCompletarCuenta() {
    document.querySelectorAll("#graficoInicio .orbita-actividad>span[data-fin-v276]").forEach(e => { const f = e.getAttribute("data-fin-v276"); if (e.textContent !== f) e.textContent = f; e.removeAttribute("data-fin-v276"); });
  }
  let ivCuentaId = 0;
  function ivContar() {
    ivCompletarCuenta();
    if (sinMovimiento()) return;
    const g = $("graficoInicio"); if (!g) return;
    const objetivos = [...g.querySelectorAll(".orbita-actividad>span:not(.sector-icono)")].filter(e => /\d/.test(e.textContent)).map(e => ({ e, fin: e.textContent, m: minDeTexto(e.textContent) }));
    if (!objetivos.length) return;
    const id = ++ivCuentaId, t0 = performance.now(), dur = 900;
    objetivos.forEach(o => o.e.setAttribute("data-fin-v276", o.fin));
    const fin = () => { if (id === ivCuentaId) ivCompletarCuenta(); };
    const paso = ahora => {
      if (id !== ivCuentaId) return;
      const k = Math.min(1, (ahora - t0) / dur), f = 1 - Math.pow(1 - k, 3);
      if (document.hidden || k >= 1) { fin(); return; }
      objetivos.forEach(o => { if (o.e.isConnected && o.e.hasAttribute("data-fin-v276")) o.e.textContent = textoDeMin(o.m * f); });
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
    /* Red de seguridad: si el navegador detiene los fotogramas (app en segundo plano, arranque desde el icono), las cifras acaban siempre en su valor real. */
    setTimeout(fin, dur + 250);
  }
  function ivEntrada() {
    const g = $("graficoInicio"); if (!g || !g.querySelector(".orbita-grafico")) return;
    const ahora = Date.now(); if (ahora - ivUltima < 1500) return; ivUltima = ahora;
    ivPintarAnillos();
    if (sinMovimiento()) return;
    const og = g.querySelector(".orbita-grafico");
    og.classList.remove("iv-entrada"); void og.offsetWidth; og.classList.add("iv-entrada");
    setTimeout(() => og.classList.remove("iv-entrada"), 1200);
    ivAjustarArcos(true); ivContar();
  }

  /* Cielo por hora: amanecer, día, atardecer y noche (usa si es de día según el tiempo real cuando se conoce). */
  /* Salida y puesta de sol aproximadas (España peninsular) con la hora local real del dispositivo, incluido el cambio horario. */
  function ivSol(d) {
    const rad = Math.PI / 180, lat = 40.4 * rad, lon = -3.7, off = -d.getTimezoneOffset() / 60;
    const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), B = 2 * Math.PI * (doy - 81) / 364;
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const dec = 23.44 * rad * Math.sin(2 * Math.PI * (doy - 81) / 365);
    const c = (Math.sin(-0.833 * rad) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
    const H = Math.acos(Math.max(-1, Math.min(1, c))) / rad / 15, noon = 12 - lon / 15 + off - eot / 60;
    return [noon - H, noon + H];
  }
  function ivFase() {
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60, [sale, pone] = ivSol(d);
    let noche = h < sale - 0.5 || h > pone + 0.5;
    try { const c = window.datosClimaVisualV260; if (c && (c.esDia === 0 || c.esDia === "0")) noche = true; else if (c && (c.esDia === 1 || c.esDia === "1")) noche = false; } catch (e) {}
    if (noche) return "noche";
    if (h < sale + 1) return "amanecer";
    if (h > pone - 1) return "atardecer";
    return "dia";
  }
  function ivCielo() {
    const f = ivFase(); if (document.body.dataset.faseV276 !== f) document.body.dataset.faseV276 = f;
    const t = document.querySelector("#vista-inicio .tarjeta-grafico-inicio"); if (!t) return;
    if (!t.querySelector(":scope>.cielo-hora-v276")) {
      const i = document.createElement("i"); i.className = "cielo-hora-v276"; i.setAttribute("aria-hidden", "true");
      const ref = t.querySelector(":scope>.escena-3d-v260"); if (ref && ref.nextSibling) t.insertBefore(i, ref.nextSibling); else t.insertBefore(i, t.firstChild);
    }
  }
  function instalarInicioVivo() {
    ivDefs(); ivCielo();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) ivCompletarCuenta(); });
    window.addEventListener("pageshow", ivCompletarCuenta); window.addEventListener("focus", ivCompletarCuenta);
    document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".nav-item")) { if (!e.target.closest('.nav-item[data-vista="inicio"]')) ivCompletarCuenta(); } }, true);
    setInterval(ivCielo, 60000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { ivCielo(); const v = $("vista-inicio"); if (v && v.classList.contains("activa")) { ivUltima = 0; ivEntrada(); } } });
    const g = $("graficoInicio");
    if (g) new MutationObserver(() => { ivPintarAnillos(); if (Date.now() - ivUltima > 8000 && $("vista-inicio") && $("vista-inicio").classList.contains("activa")) ivEntrada(); }).observe(g, { childList: true });
    const pe = $("porcentajeObjetivo"); if (pe) new MutationObserver(() => ivPintarAnillos()).observe(pe, { childList: true, characterData: true, subtree: true });
    const vi = $("vista-inicio");
    if (vi) { let activa = vi.classList.contains("activa"); new MutationObserver(() => { const a = vi.classList.contains("activa"); if (a && !activa) { ivCielo(); setTimeout(() => { ivUltima = 0; ivEntrada(); }, 120); } activa = a; }).observe(vi, { attributes: true, attributeFilter: ["class"] }); }
    ivPintarAnillos(); if (vi && vi.classList.contains("activa")) ivEntrada();
  }

  /* ================= 15. AZULEJOS 3D EN TODOS LOS BOTONES (V27626) =================
     Mismo aspecto que las pestañas: cuadrado redondeado con degradado, brillo, sombra y símbolo blanco.
     No cambia ni los textos ni las funciones: añade un <i class="bt-v276"> al principio y oculta (solo a la vista) el símbolo antiguo.
     Si el código antiguo reescribe un botón, un observador vuelve a colocar el azulejo. */
  const BT_COLORES = {
    azul: ["#62a8ff", "#1f5fe6"], verde: ["#63e38c", "#14a047"], naranja: ["#ffc15a", "#ee7508"], violeta: ["#c692ff", "#7a38de"],
    rosa: ["#ffa6c6", "#e0457e"], rojo: ["#ff8a80", "#d92b20"], turquesa: ["#62e3e0", "#0e98a6"], gris: ["#b9bdc9", "#6c7183"],
    indigo: ["#98a4ff", "#4a4fe0"], cielo: ["#74d3ff", "#1e8ee0"], dorado: ["#ffd95e", "#e08a00"]
  };
  const BT_G = {
    play: '<path d="M9.2 6.6v10.8c0 .8.9 1.3 1.5.9l8.2-5.4c.6-.4.6-1.3 0-1.8l-8.2-5.4c-.6-.4-1.5.1-1.5.9z" fill="#fff" stroke="none"/>',
    stop: '<rect x="7.2" y="7.2" width="9.6" height="9.6" rx="2.4" fill="#fff" stroke="none"/>',
    check: '<path d="M6.6 12.6l3.7 3.7 7.2-8" fill="none" stroke="#fff" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>',
    plus: '<path d="M12 6.5v11M6.5 12h11" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>',
    minus: '<path d="M6.5 12h11" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>',
    calendar: '<rect x="5.5" y="6.5" width="13" height="12" rx="2.6" fill="none" stroke="#fff" stroke-width="1.9"/><path d="M5.5 10.6h13M9 4.8v3M15 4.8v3" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>',
    calcheck: '<rect x="5.5" y="6.5" width="13" height="12" rx="2.6" fill="none" stroke="#fff" stroke-width="1.9"/><path d="M9 4.8v3M15 4.8v3M9.4 13.4l2 2 3.3-3.6" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    undo: '<path d="M9.5 8.2 6 11.7l3.5 3.5M6.4 11.7h7.3a3.9 3.9 0 0 1 0 7.8h-1.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -2)"/>',
    clock: '<circle cx="12" cy="12" r="6.3" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 8.7V12l2.4 1.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    cloud: '<path d="M8.2 17.6h8.1a3.6 3.6 0 0 0 .6-7.2 5 5 0 0 0-9.6 1.3A3 3 0 0 0 8.2 17.6z" fill="#fff" stroke="none"/>',
    sun: '<circle cx="12" cy="12" r="3.6" fill="#fff" stroke="none"/><path d="M12 5.2v1.6M12 17.2v1.6M5.2 12h1.6M17.2 12h1.6M7.2 7.2l1.1 1.1M15.7 15.7l1.1 1.1M16.8 7.2l-1.1 1.1M8.3 15.7l-1.1 1.1" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
    refresh: '<path d="M17.4 9.4A6 6 0 1 0 18 13.6M17.6 5.6v4h-4" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    share: '<path d="M12 14.6V5.6M8.6 8.9 12 5.5l3.4 3.4M7.2 12.2v4.4c0 .8.6 1.4 1.4 1.4h6.8c.8 0 1.4-.6 1.4-1.4v-4.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    down: '<path d="M12 5.4v9.2M8.6 11.3 12 14.7l3.4-3.4M7 18h10" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    up: '<path d="M12 15.6V6.4M8.6 9.7 12 6.3l3.4 3.4M7 18h10" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    doc: '<path d="M8.2 5.6h5.4l3.2 3.2v8.8a1 1 0 0 1-1 1H8.2a1 1 0 0 1-1-1V6.6a1 1 0 0 1 1-1zM9.6 12.2h4.8M9.6 15h4.8" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    sparkle: '<path d="M11.2 5.4l1.5 4.2 4.2 1.5-4.2 1.5-1.5 4.2-1.5-4.2-4.2-1.5 4.2-1.5z" fill="#fff" stroke="none"/><path d="M17.4 5.2l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" fill="#fff" stroke="none"/>',
    target: '<circle cx="12" cy="12" r="6.4" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="12" cy="12" r="2.5" fill="#fff" stroke="none"/>',
    compare: '<path d="M6.6 9h10.2M14.3 6.2 17.1 9l-2.8 2.8M17.4 15H7.2M9.7 12.2 6.9 15l2.8 2.8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    trend: '<path d="M5.6 16.6l4.2-4.5 3 2.8 5.4-6.3M14.6 8.6h3.6v3.6" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
    bars: '<rect x="6.1" y="12" width="3" height="6.2" rx="1" fill="#fff" stroke="none"/><rect x="10.5" y="6.6" width="3" height="11.6" rx="1" fill="#fff" stroke="none"/><rect x="14.9" y="9.6" width="3" height="8.6" rx="1" fill="#fff" stroke="none"/>',
    user: '<circle cx="12" cy="9.2" r="3.1" fill="#fff" stroke="none"/><path d="M6.3 18.2c.5-3.2 2.9-4.8 5.7-4.8s5.2 1.6 5.7 4.8z" fill="#fff" stroke="none"/>',
    sliders: '<path d="M6 8.6h12M6 15.4h12" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/><circle cx="9.2" cy="8.6" r="2.3" fill="#fff" stroke="none"/><circle cx="14.8" cy="15.4" r="2.3" fill="#fff" stroke="none"/>',
    help: '<path d="M9.5 9.5a2.6 2.6 0 1 1 3.8 2.3c-.9.5-1.3 1-1.3 1.9" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/><circle cx="12" cy="17" r="1.25" fill="#fff" stroke="none"/>',
    pencil: '<path d="M7.6 16.4l.7-3 6-6a1.7 1.7 0 0 1 2.4 0 1.7 1.7 0 0 1 0 2.4l-6 6z" fill="#fff" stroke="none"/><path d="M6.8 18.2h10.4" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>',
    trash: '<path d="M8 9h8l-.7 7.8c-.1.7-.6 1.2-1.3 1.2h-4c-.7 0-1.2-.5-1.3-1.2z" fill="#fff" stroke="none"/><path d="M6.8 7.2h10.4M10.2 7.2V5.9h3.6v1.3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    repeat: '<path d="M7 11.4v-1.2a2.3 2.3 0 0 1 2.3-2.3H17M14.6 5.4 17.4 8l-2.8 2.6M17 12.6v1.2a2.3 2.3 0 0 1-2.3 2.3H7M9.4 18.6 6.6 16l2.8-2.6" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    book: '<path d="M5.6 7.3c2.4-.8 4.4-.5 6.4 1 2-1.5 4-1.8 6.4-1v9.4c-2.4-.8-4.4-.5-6.4 1-2-1.5-4-1.8-6.4-1zM12 8.4v9.2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
    tools: '<path d="M14.8 6a3.5 3.5 0 0 0-3.4 4.5l-4.8 4.8a1.5 1.5 0 0 0 2.1 2.1l4.8-4.8a3.5 3.5 0 0 0 4.5-3.4l-2.1 2.1-1.8-.4-.4-1.8z" fill="#fff" stroke="none"/>',
    mic: '<rect x="9.6" y="5.4" width="4.8" height="8.2" rx="2.4" fill="#fff" stroke="none"/><path d="M7.6 11.6a4.4 4.4 0 0 0 8.8 0M12 16.2v2.3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
    restore: '<path d="M6.6 12.4a5.4 5.4 0 1 0 1.7-4M6.4 5.6v3.9h3.9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    pulse: '<path d="M5 12.2h3.2l1.7-4 3 8 2-4h5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    phone: '<rect x="8.2" y="5" width="7.6" height="14" rx="2.2" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="12" cy="16.7" r=".9" fill="#fff" stroke="none"/>',
    note: '<path d="M7 8.4h10M7 12h10M7 15.6h6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
    trophy: '<path d="M8.4 6.4h7.2v3.6a3.6 3.6 0 0 1-7.2 0zM8.4 7.6H6.2c0 2 .9 3 2.4 3.3M15.6 7.6h2.2c0 2-.9 3-2.4 3.3M12 13.6v2.6M9.4 18h5.2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    copy: '<rect x="8.6" y="8.6" width="9" height="9" rx="2" fill="none" stroke="#fff" stroke-width="1.9"/><path d="M15.4 8.4V7.6a1.9 1.9 0 0 0-1.9-1.9H7.6a1.9 1.9 0 0 0-1.9 1.9v5.9a1.9 1.9 0 0 0 1.9 1.9h.8" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>',
    tag: '<path d="M6.2 6.2h5l7 7-5 5-7-7z" fill="none" stroke="#fff" stroke-width="1.9" stroke-linejoin="round"/><circle cx="9.3" cy="9.3" r="1.2" fill="#fff" stroke="none"/>'
  };
  // [selector CSS | null, texto (RegExp) | null, símbolo, color]. La primera regla que coincide, gana.
  const BT_REGLAS = [
    [".resumen-actividad-v198[data-tipo=ministerio]>span", null, "book", "azul"], [".resumen-actividad-v198[data-tipo=ldc]>span", null, "tools", "rosa"], [".resumen-actividad-v198[data-tipo=asambleas]>span", null, "mic", "naranja"], [".resumen-actividad-v198[data-tipo=otras]>span", null, "sparkle", "violeta"],
    [".registro-icono.ministerio", null, "book", "azul"], [".registro-icono.ldc", null, "tools", "rosa"], [".registro-icono.asambleas", null, "mic", "naranja"], [".registro-icono.otras", null, "sparkle", "violeta"],
    ["#cronIniciarV264", null, "play", "verde"], ["#cronTerminarV264", null, "stop", "rojo"], ["#cronDescartarV264", null, "trash", "gris"],
    ["#guardarRegistroV203", null, "check", "verde"], ["#guardarAjustes", null, "check", "verde"],
    [".actividad-boton[data-tipo=ministerio]", null, "book", "azul"], [".actividad-boton[data-tipo=ldc]", null, "tools", "rosa"],
    [".actividad-boton[data-tipo=asambleas]", null, "mic", "naranja"], [".actividad-boton[data-tipo=otras]", null, "sparkle", "violeta"],
    ["[data-dia-v203=hoy]", null, "calcheck", "verde"], ["[data-dia-v203=ayer]", null, "undo", "naranja"], ["[data-dia-v203=otra]", null, "calendar", "azul"],
    ["#restarCurso", null, "minus", "rojo"], ["#sumarCurso", null, "plus", "verde"], [".atajo-tiempo", null, "clock", "cielo"],
    [".detalles-registro-v203>summary", null, "note", "indigo"],
    ["#historialHoyV260", null, "calcheck", "verde"],
    [".filtro-historial[data-filtro=ministerio],.filtro-historial[data-tipo=ministerio]", null, "book", "azul"], [".filtro-historial[data-filtro=ldc],.filtro-historial[data-tipo=ldc]", null, "tools", "rosa"],
    [".filtro-historial[data-filtro=asambleas],.filtro-historial[data-tipo=asambleas]", null, "mic", "naranja"], [".filtro-historial[data-filtro=otras],.filtro-historial[data-tipo=otras]", null, "sparkle", "violeta"],
    [".filtro-historial", /^todos$/i, "bars", "indigo"],
    [".boton-repetir-v260", null, "repeat", "azul"], [".boton-editar-registro", null, "pencil", "naranja"], [".boton-borrar", null, "trash", "rojo"],
    ["#hacerCopiaDesdeInicio", null, "cloud", "azul"], ["#actualizarTiempoInicio", null, "refresh", "turquesa"],
    ["#climaDetalleV260>summary", null, "sun", "dorado"],
    ["#wrappedBotonV267,#wrappedSemanaBotonV269", null, "sparkle", "violeta"], ["#compartirMesV260", null, "share", "azul"], ["#tarjetaMesV27629", null, "sparkle", "violeta"], ["#csvMesV264,#csvTodoV264", null, "doc", "verde"],
    [null, /compartir tarjeta/i, "sparkle", "violeta"], [null, /ver calendario/i, "calendar", "azul"], [null, /meta anual/i, "target", "rojo"],
    [null, /m[aá]s detalle/i, "bars", "indigo"], [null, /comparar/i, "compare", "turquesa"], [null, /evoluci[oó]n/i, "trend", "verde"],
    ["#copiaRapidaV260,#exportarDatos", null, "cloud", "azul"], ["#conectarOneDrive", null, "cloud", "cielo"], ["#importarDatos", null, "down", "naranja"],
    ["#prepararAccesoInicio", null, "phone", "indigo"], ["#guardarProxyCalendarioV176", null, "check", "verde"], ["#sincronizarCalendarioV176", null, "refresh", "turquesa"],
    ["#importarCalendarioAppleV173", null, "down", "naranja"], ["#pegarCalendarioAtajoV174", null, "copy", "gris"], ["#quitarCalendarioAppleV173", null, "trash", "rojo"],
    [null, /^restaurar/i, "restore", "naranja"], [null, /^comprobar/i, "pulse", "verde"], [null, /copiar informe/i, "copy", "gris"],
    [null, /^recargar/i, "refresh", "azul"], [null, /^limpiar/i, "trash", "naranja"], [null, /^borrar/i, "trash", "rojo"],
    [null, /perfil, actividades/i, "user", "violeta"], [null, /^sincronizaci[oó]n y copias/i, "refresh", "turquesa"], [null, /^personalizar/i, "sliders", "indigo"],
    [null, /ayuda r[aá]pida/i, "help", "azul"], [null, /^papelera/i, "trash", "gris"], [null, /^diagn[oó]stico/i, "pulse", "verde"], [null, /^copias internas/i, "cloud", "cielo"]
  ];
  const BT_ALCANCE = "#vista-inicio,#vista-registrar,#vista-historial,#vista-estadisticas,#vista-ajustes";
  const BT_CANDIDATOS = "button,summary,.ajustes-acordeon-icono,.registro-icono,.resumen-actividad-v198>span";
  const BT_EXCLUIR = ".nav-item,#segmentoStatsV264 button,.v191-boton-flotante,.orbita-actividad,.logro-v267,.historial-mes-v260,.bt-v276,#perfilCabV27629,[data-bt-no]";
  function btDefs() {
    if ($("btDefsV276")) return;
    const s = document.createElementNS(NS_SVG, "svg");
    s.id = "btDefsV276"; s.setAttribute("width", "0"); s.setAttribute("height", "0"); s.setAttribute("aria-hidden", "true");
    s.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    let d = '<defs><linearGradient id="btgV276" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>';
    Object.keys(BT_COLORES).forEach(k => { d += '<linearGradient id="btc' + k + 'V276" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + BT_COLORES[k][0] + '"/><stop offset="1" stop-color="' + BT_COLORES[k][1] + '"/></linearGradient>'; });
    s.innerHTML = d + "</defs>";
    document.body.insertBefore(s, document.body.firstChild);
  }
  function btSvg(g, c) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="1" y="1.6" width="22" height="22" rx="6.6" fill="#000" opacity=".16"/><rect x="1" y="1" width="22" height="22" rx="6.6" fill="url(#btc' + c + 'V276)"/><rect x="1" y="1" width="22" height="11.5" rx="6.6" fill="url(#btgV276)"/><rect x=".5" y=".5" width="23" height="23" rx="7" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width=".8"/>'
      + '<g transform="translate(0 .7)" opacity=".22" style="filter:brightness(0)">' + BT_G[g] + '</g>' + BT_G[g] + '</svg>';
  }
  function btRegla(el) {
    const t = (el.textContent || "").replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s+/g, " ").trim();
    for (let i = 0; i < BT_REGLAS.length; i++) {
      const r = BT_REGLAS[i];
      if (r[0]) { let ok = false; try { ok = el.matches(r[0]); } catch (e) {} if (!ok) continue; if (r[1] && !r[1].test(t)) continue; return r; }
      if (r[1] && r[1].test(t)) return r;
    }
    return null;
  }
  const BT_SIMBOLO = /^\s*(?:[■▶✨↗⇩↻◐◎☀✓−+‹›↔↓↑]|\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)\s*/u;
  function btDecorar(el, r) {
    if (el.querySelector(":scope > .bt-v276")) return;
    el.classList.add("bt-host-v276");
    // 1) ocultar solo a la vista el símbolo antiguo (el texto queda para lectores de pantalla y para el código antiguo)
    Array.prototype.forEach.call(el.children, h => {
      if (h.classList.contains("bt-sim-v276")) return;
      const esSvg = h.tagName.toLowerCase() === "svg";
      const esIcono = h.matches && h.matches(".actividad-icono,.ajustes-acordeon-icono,.v191-icono,[class*='icono'],[aria-hidden='true']") && (h.textContent || "").trim().length <= 4;
      if (esSvg || esIcono) h.classList.add("bt-sim-v276");
    });
    if (el.matches(".registro-icono")) {
      Array.prototype.slice.call(el.childNodes).forEach(n => { if (n.nodeType === 3 && n.nodeValue.trim()) { const sp = document.createElement("span"); sp.className = "bt-sim-v276"; sp.textContent = n.nodeValue; el.replaceChild(sp, n); } });
    }
    const n = el.firstChild;
    if (n && n.nodeType === 3) {
      const m = BT_SIMBOLO.exec(n.nodeValue);
      if (m && m[0].trim()) { const sp = document.createElement("span"); sp.className = "bt-sim-v276"; sp.textContent = m[0]; n.nodeValue = n.nodeValue.slice(m[0].length); el.insertBefore(sp, n); }
    }
    const solo = !(el.textContent || "").replace(/[\s−+↻]/g, "") || el.matches(".boton-editar-registro,.boton-borrar");
    el.classList.toggle("bt-solo-v276", !!solo);
    const i = document.createElement("i"); i.className = "bt-v276"; i.setAttribute("aria-hidden", "true");
    i.innerHTML = btSvg(r[2], r[3]);
    el.insertBefore(i, el.firstChild);
  }
  const BT_TITULOS = [
    [/noviembre|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|diciembre/i, "calendar", "azul"], [/tu a[nñ]o en cifras/i, "sparkle", "violeta"],
    [/a[nñ]o de servicio/i, "target", "rojo"], [/c[oó]mo vas/i, "trend", "verde"], [/^logros/i, "trophy", "dorado"], [/^actividad/i, "bars", "indigo"], [/[uú]ltimos 6 meses/i, "trend", "turquesa"]
  ];
  let btPend = 0, btEn = false;
  function btPasar() {
    btPend = 0; if (btEn) return; btEn = true;
    try {
      btDefs(); btBuscador(); btDias(); btResumenBarras(); anPintar(); calAsegurar(); calPintar(); esAsegurar(); v9Pasar();
      document.querySelectorAll(BT_ALCANCE).forEach(v => {
        v.querySelectorAll(BT_CANDIDATOS).forEach(el => {
          if (el.matches(BT_EXCLUIR) || el.closest(".nav-item,.orbita-actividad,.logro-v267") || el.querySelector(":scope > .bt-v276")) return;
          if (el.matches(".ajustes-acordeon-icono")) { const s = el.closest("summary"); if (s) return; }
          const r = btRegla(el); if (r) btDecorar(el, r);
        });
      });
      document.querySelectorAll("#vista-estadisticas h2,#vista-estadisticas h3").forEach(h => {
        if (h.querySelector(":scope > .bt-v276") || h.closest(".logro-v267")) return;
        const t = (h.textContent || "").trim();
        for (let i = 0; i < BT_TITULOS.length; i++) if (BT_TITULOS[i][0].test(t)) { h.classList.add("bt-titulo-v276"); const x = document.createElement("i"); x.className = "bt-v276"; x.setAttribute("aria-hidden", "true"); x.innerHTML = btSvg(BT_TITULOS[i][1], BT_TITULOS[i][2]); h.insertBefore(x, h.firstChild); break; }
      });
    } catch (e) { console.warn("[V27626 azulejos]", e); }
    btEn = false;
  }
  function btProgramar() { if (btPend) return; btPend = setTimeout(btPasar, 90); }
  /* Rebote al pulsar + celebración al guardar */
  function btPulsar(ev) {
    const b = ev.target.closest && ev.target.closest(".bt-host-v276"); if (!b) return;
    const t = b.querySelector(":scope > .bt-v276"); if (!t || movReducido()) return;
    t.classList.remove("bt-rebote-v276"); void t.offsetWidth; t.classList.add("bt-rebote-v276");
    try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.isActive)) navigator.vibrate(8); } catch (e) {}
  }
  function btConfeti(b, grande) {
    if (movReducido()) return;
    const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const cols = Object.keys(BT_COLORES).map(k => BT_COLORES[k][0]);
    const caja = document.createElement("div"); caja.className = "bt-confeti-v276"; caja.setAttribute("aria-hidden", "true");
    const n = grande ? 46 : 20;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i"), a = Math.random() * Math.PI * 2, d = (grande ? 90 : 56) + Math.random() * (grande ? 150 : 70);
      p.style.cssText = "left:" + cx + "px;top:" + cy + "px;background:" + cols[i % cols.length] + ";--dx:" + Math.cos(a) * d + "px;--dy:" + (Math.sin(a) * d - (grande ? 40 : 18)) + "px;--r:" + Math.round(Math.random() * 540 - 270) + "deg;animation-delay:" + Math.round(Math.random() * 70) + "ms";
      caja.appendChild(p);
    }
    document.body.appendChild(caja); setTimeout(() => caja.remove(), 1700);
  }
  function btGuardar(ev) {
    const b = ev.target.closest && ev.target.closest("#guardarRegistroV203"); if (!b) return;
    let antes = 0, pct = 0; try { antes = (estado.registros || []).length; } catch (e) {} try { pct = ivPctObjetivo() || 0; } catch (e) {}
    const mes0 = mesTotalCompu();
    setTimeout(() => {
      let ahora = antes; try { ahora = (estado.registros || []).length; } catch (e) {}
      if (ahora <= antes) return;
      let p2 = pct; try { p2 = ivPctObjetivo() || pct; } catch (e) {}
      const t = b.querySelector(":scope > .bt-v276"); if (t && !movReducido()) { t.classList.remove("bt-pop-v276"); void t.offsetWidth; t.classList.add("bt-pop-v276"); }
      const cruza = pct < 100 && p2 >= 100; btConfeti(b, cruza); if (cruza) setTimeout(celMostrar, 700);
      try { const mes1 = mesTotalCompu(), delta = mes1.total - mes0.total, ob = objetivo(); if (!cruza && delta > 0 && ob > 0) ruedaMostrar(pct, p2, delta, Math.max(0, ob - mes1.comp)); } catch (e) {}
    }, 450);
  }

  /* Historial: "Hoy" junto al buscador y color del día (el deslizar ya existía desde V264) */
  const BT_COL_TIPO = { ministerio: "#3478f6", ldc: "#e0457e", asambleas: "#ff9500", otras: "#8a5be0" };
  function btBuscador() {
    const bus = document.querySelector(".buscar-historial-v260"), hoy = $("historialHoyV260"), inp = $("buscarHistorialV260");
    if (!bus || !hoy || !inp || bus.querySelector(":scope > .hist-fila-v276")) return;
    const fila = document.createElement("div"); fila.className = "hist-fila-v276";
    const caja = document.createElement("div"); caja.className = "hist-campo-v276";
    caja.appendChild(inp); fila.appendChild(caja); fila.appendChild(hoy);
    const lab = bus.querySelector("label"); if (lab) { lab.classList.add("bt-sim-v276"); bus.insertBefore(fila, lab.nextSibling); } else bus.insertBefore(fila, bus.firstChild);
    const ac = document.querySelector(".accesos-historial-v260"); if (ac) ac.classList.add("hist-accesos-v276");
  }
  function btMinTxt(t) { const h = /(\d+)\s*h/.exec(t || ""), m = /(\d+)\s*min/.exec(t || ""); return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0); }
  function btResumenBarras() {
    document.querySelectorAll(".v143-rm-dist").forEach(d => {
      const filas = Array.prototype.slice.call(d.querySelectorAll(".resumen-actividad-v198")); if (!filas.length) return;
      const mins = filas.map(f => btMinTxt((f.querySelector("b") || {}).textContent)), tot = mins.reduce((a, b) => a + b, 0);
      filas.forEach((f, i) => { const p = tot > 0 ? Math.round(mins[i] / tot * 100) : 0; if (f.style.getPropertyValue("--p") !== String(p)) f.style.setProperty("--p", String(p)); });
    });
  }
  function btDias() {
    document.querySelectorAll("#vista-historial .grupo-historial").forEach(g => {
      const c = g.querySelector(".grupo-historial-cabecera"); if (!c) return;
      const cuenta = {}; g.querySelectorAll(".registro-card").forEach(r => { const m = /registro-card-(\w+)/.exec(r.className); if (m && BT_COL_TIPO[m[1]]) cuenta[m[1]] = (cuenta[m[1]] || 0) + 1; });
      let mejor = "", n = 0; Object.keys(cuenta).forEach(k => { if (cuenta[k] > n) { n = cuenta[k]; mejor = k; } });
      if ((c.dataset.domV276 || "") !== mejor) { if (mejor) { c.dataset.domV276 = mejor; c.style.setProperty("--dia-col", BT_COL_TIPO[mejor]); } else { delete c.dataset.domV276; c.style.removeProperty("--dia-col"); } }
    });
  }
  /* ================= 18-21. ANILLOS, CALENDARIO, CELEBRACIÓN Y ESTACIÓN (V27628) ================= */
  const V8_TIPOS = [["ministerio", "#3478f6", "#7ab6ff"], ["ldc", "#e0457e", "#ff9fc2"], ["asambleas", "#ff9500", "#ffc15a"], ["otras", "#8a5be0", "#c692ff"]];
  const V8_NOMBRE = { ministerio: "Ministerio", ldc: "LDC", asambleas: "Asambleas", otras: "Otras" };
  const V8_MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function v8Hm(min) { min = Math.round(min || 0); const h = Math.floor(min / 60), m = min % 60; return h && m ? h + " h " + m + " min" : h ? h + " h" : m + " min"; }
  function v8Regs() { try { return Array.isArray(estado.registros) ? estado.registros : []; } catch (e) { return []; } }

  /* 18 · Anillos de actividad en el Resumen mensual */
  function anPintar() {
    const d = document.querySelector("#vista-estadisticas .v143-rm-dist"); if (!d || !d.parentElement) return;
    const filas = Array.prototype.slice.call(d.querySelectorAll(".resumen-actividad-v198")); if (!filas.length) return;
    const datos = []; let tot = 0;
    filas.forEach(f => { const t = f.getAttribute("data-tipo"), m = btMinTxt((f.querySelector("b") || {}).textContent); if (m > 0 && V8_NOMBRE[t]) { datos.push({ t: t, m: m }); tot += m; } });
    let el = d.parentElement.querySelector(":scope>#anillosActV27628");
    if (!tot) { if (el) el.remove(); return; }
    const sig = datos.map(x => x.t + x.m).join("|");
    if (el && el.dataset.sig === sig) return;
    const nuevo = !el;
    if (!el) { el = document.createElement("div"); el.id = "anillosActV27628"; el.className = "anillos-act-v27628"; el.setAttribute("role", "img"); d.parentElement.insertBefore(el, d); }
    el.dataset.sig = sig;
    el.setAttribute("aria-label", "Reparto del mes: " + datos.map(x => V8_NOMBRE[x.t] + " " + Math.round(x.m / tot * 100) + " %").join(", "));
    const orden = V8_TIPOS.filter(x => datos.some(d2 => d2.t === x[0]));
    let s = '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs>';
    orden.forEach((x, i) => { s += '<linearGradient id="anG' + i + 'V27628" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + x[2] + '"/><stop offset="1" stop-color="' + x[1] + '"/></linearGradient>'; });
    s += "</defs>";
    orden.forEach((x, i) => {
      const r = 52 - i * 12.5, dd = "M60 " + (60 - r) + "a" + r + " " + r + " 0 1 1 0 " + (2 * r) + "a" + r + " " + r + " 0 1 1 0 " + (-2 * r);
      const pct = Math.max(1.5, datos.find(q => q.t === x[0]).m / tot * 100);
      s += '<path d="' + dd + '" class="an-pista" fill="none" stroke-width="9.5" pathLength="100"/><path d="' + dd + '" class="an-arco" fill="none" stroke="url(#anG' + i + 'V27628)" stroke-width="9.5" stroke-linecap="round" pathLength="100" data-pct="' + pct.toFixed(1) + '" style="stroke-dasharray:' + (nuevo ? "0.01" : pct.toFixed(1)) + ' 100"/>';
    });
    s += '</svg><div class="an-centro"><strong>' + v8Hm(tot) + "</strong><span>este mes</span></div>";
    el.innerHTML = s;
    const arcos = el.querySelectorAll(".an-arco");
    if (nuevo && !movReducido()) requestAnimationFrame(() => requestAnimationFrame(() => arcos.forEach(a => { a.style.strokeDasharray = a.getAttribute("data-pct") + " 100"; })));
    else arcos.forEach(a => { a.style.strokeDasharray = a.getAttribute("data-pct") + " 100"; });
  }

  /* 19 · Calendario del mes en Historial */
  let calY = 0, calM = -1, calSig = "";
  function calAsegurar() {
    if ($("calHistorialV27628")) return;
    const f = document.querySelector("#vista-historial .filtros-historial"); if (!f) return;
    const hoy = new Date(); if (calM < 0) { calY = hoy.getFullYear(); calM = hoy.getMonth(); }
    const d = document.createElement("details"); d.id = "calHistorialV27628"; d.className = "cal-hist-v27628";
    try { d.open = localStorage.getItem("miServicio.calHistorialV27628") === "1"; } catch (e) {}
    d.innerHTML = '<summary><i class="bt-v276" aria-hidden="true">' + btSvg("calendar", "azul") + '</i><span class="cal-tit">Calendario</span><span class="cal-res"></span></summary><div class="cal-cuerpo"></div>';
    f.parentNode.insertBefore(d, f.nextSibling);
    d.addEventListener("toggle", () => { try { localStorage.setItem("miServicio.calHistorialV27628", d.open ? "1" : "0"); } catch (e) {} });
    d.addEventListener("click", e => {
      const n = e.target.closest("[data-cal-nav]"); if (n) { e.preventDefault(); calM += parseInt(n.getAttribute("data-cal-nav"), 10); if (calM < 0) { calM = 11; calY--; } if (calM > 11) { calM = 0; calY++; } calSig = ""; calPintar(); return; }
      const b = e.target.closest("[data-f]"); if (!b) return;
      const inp = $("buscarHistorialV260"); if (!inp) return;
      const ya = inp.value === b.getAttribute("data-f"); inp.value = ya ? "" : b.getAttribute("data-f");
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      calSig = ""; calPintar();
      if (!ya) setTimeout(() => { const g = document.querySelector("#vista-historial .grupo-historial, #vista-historial #historialVacio"); if (g && g.scrollIntoView) g.scrollIntoView({ behavior: movReducido() ? "auto" : "smooth", block: "center" }); }, 160);
    });
    const inp = $("buscarHistorialV260"); if (inp) inp.addEventListener("input", () => { calSig = ""; calPintar(); });
  }
  function calPintar() {
    const d = $("calHistorialV27628"); if (!d) return;
    const regs = v8Regs(), inp = $("buscarHistorialV260"), sel = inp ? inp.value.trim() : "";
    let h = regs.length | 0; regs.forEach(r => { const f = String(r.fecha || ""); h = (h * 31 + (f.charCodeAt(9) || 0) + (f.charCodeAt(8) || 0) * 7 + (f.charCodeAt(6) || 0) * 3 + (Number(r.minutos) || 0)) | 0; });
    const sig = calY + "-" + calM + "-" + h + "-" + sel + "-" + new Date().getDate(); if (sig === calSig) return; calSig = sig;
    const mes = {}, pref = calY + "-" + String(calM + 1).padStart(2, "0") + "-"; let totMes = 0;
    regs.forEach(r => { const f = String(r.fecha || "").slice(0, 10); if (f.indexOf(pref) !== 0) return; const o = mes[f] || (mes[f] = { m: 0, t: {} }), mi = Number(r.minutos) || 0; o.m += mi; o.t[r.tipo] = (o.t[r.tipo] || 0) + mi; totMes += mi; });
    d.querySelector(".cal-res").textContent = V8_MESES[calM] + " " + calY;
    const prim = new Date(calY, calM, 1), desp = (prim.getDay() + 6) % 7, dias = new Date(calY, calM + 1, 0).getDate(), hoy = new Date();
    const esHoy = hoy.getFullYear() === calY && hoy.getMonth() === calM ? hoy.getDate() : -1;
    let s = '<div class="cal-nav"><button type="button" class="cal-flecha" data-cal-nav="-1" aria-label="Mes anterior">‹</button><strong>' + V8_MESES[calM] + " " + calY + '</strong><button type="button" class="cal-flecha" data-cal-nav="1" aria-label="Mes siguiente">›</button></div>';
    s += '<div class="cal-sem" aria-hidden="true">' + ["L", "M", "X", "J", "V", "S", "D"].map(x => "<span>" + x + "</span>").join("") + '</div><div class="cal-grid">';
    for (let i = 0; i < desp; i++) s += '<span class="cal-vacio"></span>';
    for (let n = 1; n <= dias; n++) {
      const f = pref + String(n).padStart(2, "0"), o = mes[f];
      let pts = "", etq = n + " de " + V8_MESES[calM];
      if (o) { V8_TIPOS.forEach(x => { if (o.t[x[0]]) pts += '<i style="background:' + x[1] + '"></i>'; }); etq += ", " + v8Hm(o.m); }
      s += '<button type="button" class="cal-dia' + (o ? " con" : "") + (n === esHoy ? " hoy" : "") + (sel === f ? " sel" : "") + '" data-f="' + f + '" style="--i:' + (o ? Math.min(1, o.m / 240).toFixed(2) : 0) + '" aria-label="' + etq + '" aria-pressed="' + (sel === f ? "true" : "false") + '"><b>' + n + '</b><span class="cal-pts">' + pts + "</span></button>";
    }
    d.querySelector(".cal-cuerpo").innerHTML = s + "</div>";
  }

  /* 20 · Celebración de la meta mensual */
  function celMostrar() {
    const hoy = new Date(), clave = hoy.getFullYear() + "-" + (hoy.getMonth() + 1);
    try { if (localStorage.getItem("miServicio.celebracionMesV27628") === clave) return; localStorage.setItem("miServicio.celebracionMesV27628", clave); } catch (e) {}
    if ($("celebraV27628")) return;
    const pref = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-"; let tot = 0;
    v8Regs().forEach(r => { if (String(r.fecha || "").indexOf(pref) === 0) tot += Number(r.minutos) || 0; });
    const o = document.createElement("div"); o.id = "celebraV27628"; o.className = "celebra-v27628"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Objetivo del mes cumplido");
    o.innerHTML = '<div class="cel-caja"><svg class="cel-medalla" viewBox="0 0 160 190" aria-hidden="true"><defs><linearGradient id="celO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".55" stop-color="#ffc233"/><stop offset="1" stop-color="#d98400"/></linearGradient><linearGradient id="celI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd25a"/><stop offset="1" stop-color="#f0a014"/></linearGradient><linearGradient id="celR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7d70"/><stop offset="1" stop-color="#d92b20"/></linearGradient><linearGradient id="celB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb0ff"/><stop offset="1" stop-color="#1f5fe6"/></linearGradient><linearGradient id="celG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><path d="M52 8h26l16 58-30 12z" fill="url(#celB)"/><path d="M108 8H82L66 66l30 12z" fill="url(#celR)"/><ellipse cx="80" cy="172" rx="46" ry="7" fill="#000" opacity=".16"/><circle cx="80" cy="114" r="56" fill="url(#celO)"/><circle cx="80" cy="114" r="45" fill="url(#celI)" stroke="#fff" stroke-opacity=".55" stroke-width="2"/><path d="M80.0 85.0L87.3 103.9L107.6 105.0L91.9 117.9L97.0 137.5L80.0 126.5L63.0 137.5L68.1 117.9L52.4 105.0L72.7 103.9z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><ellipse cx="66" cy="84" rx="30" ry="22" fill="url(#celG)" opacity=".65" transform="rotate(-24 66 84)"/><rect class="cel-brillo" x="-60" y="50" width="26" height="130" fill="#fff" opacity=".55" transform="rotate(20 80 114)"/></svg><h2>¡Objetivo cumplido!</h2><p class="cel-sub">Has llegado al 100 % de tu objetivo de ' + V8_MESES[hoy.getMonth()] + '.</p><p class="cel-tot"><strong>' + v8Hm(tot) + '</strong> este mes</p><button type="button" class="cel-ok">Genial</button></div>';
    document.body.appendChild(o);
    const cerrar = () => { o.classList.add("cel-sale"); setTimeout(() => { if (o.parentNode) o.remove(); }, 260); document.removeEventListener("keydown", tecla); };
    const tecla = e => { if (e.key === "Escape") cerrar(); };
    o.querySelector(".cel-ok").addEventListener("click", cerrar); o.addEventListener("click", e => { if (e.target === o) cerrar(); }); document.addEventListener("keydown", tecla);
    const m = o.querySelector(".cel-medalla"); btConfeti({ getBoundingClientRect: () => { const r = m.getBoundingClientRect(); return { left: r.left, top: r.top + 10, width: r.width, height: r.height }; } }, true);
    setTimeout(() => { if ($("celebraV27628")) btConfeti({ getBoundingClientRect: () => ({ left: innerWidth / 2, top: innerHeight * 0.25, width: 0, height: 0 }) }, true); }, 900);
  }

  /* 21 · Fondo vivo de estación en Inicio */
  const ES_K = "miServicio.estacionVivaV27628";
  function esActiva() { try { return localStorage.getItem(ES_K) !== "0"; } catch (e) { return true; } }
  function esEstacion() { const m = new Date().getMonth(); return m === 11 || m <= 1 ? "invierno" : m <= 4 ? "primavera" : m <= 7 ? "verano" : "otono"; }
  const ES_PART = { otono: ["🍂", "🍁", "🍂", "🍁", "🍃"], invierno: ["❄️", "❄️", "✦", "❄️"], primavera: ["🌸", "🌸", "🌼", "🌸", "🍃"], verano: ["✦", "✨", "✦", "☀️"] };
  function esAsegurar() {
    const t = document.querySelector("#vista-inicio .tarjeta-grafico-inicio"); if (!t) return;
    let l = t.querySelector(":scope>.estacion-v27628");
    if (!esActiva()) { if (l) l.remove(); return; }
    const est = esEstacion();
    if (l && l.dataset.est === est) return;
    if (l) l.remove();
    l = document.createElement("i"); l.className = "estacion-v27628"; l.dataset.est = est; l.setAttribute("aria-hidden", "true");
    const lista = ES_PART[est]; let s = "";
    for (let i = 0; i < 14; i++) {
      const x = (i * 7.3 + (i % 3) * 5) % 100, dur = est === "verano" ? 4 + (i % 5) * 1.3 : 13 + (i * 1.9) % 12, del = -((i * 2.7) % dur), tam = 16 + (i * 5) % 14, dx = ((i % 2) ? 1 : -1) * (14 + (i * 7) % 34), rot = ((i % 2) ? 1 : -1) * (120 + (i * 37) % 240);
      s += '<b style="left:' + x.toFixed(1) + "%;top:" + (est === "verano" ? (8 + (i * 13) % 80) + "%" : "-8%") + ";font-size:" + tam + "px;animation-duration:" + dur.toFixed(1) + "s;animation-delay:" + del.toFixed(1) + "s;--dx:" + dx + "px;--rot:" + rot + 'deg">' + lista[i % lista.length] + "</b>";
    }
    l.innerHTML = s;
    const ref = t.querySelector(":scope>.cielo-hora-v276") || t.querySelector(":scope>.escena-3d-v260");
    if (ref && ref.nextSibling) t.insertBefore(l, ref.nextSibling); else t.insertBefore(l, t.firstChild);
  }
  function instalarEstacion() {
    const g = $("estacionVivaV27628"); if (g) {
      const pintar = () => g.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", (b.dataset.estV27628 === "si") === esActiva() ? "true" : "false"));
      g.addEventListener("click", e => { const b = e.target.closest("button[data-est-v27628]"); if (!b) return; try { localStorage.setItem(ES_K, b.dataset.estV27628 === "si" ? "1" : "0"); } catch (er) {} esAsegurar(); pintar(); });
      pintar();
    }
    esAsegurar();
  }

  /* ================= 22. V27629 · AJUSTES iOS, «HOY LLEVAS», EVOLUCIÓN APILADA, RUEDA AL GUARDAR Y TARJETA ================= */
  const V9_CLAVES = ["Ministerio", "LDC", "Asambleas", "Otras"];
  function v9Min(r) { try { return typeof minutosRegistroV143 === "function" ? minutosRegistroV143(r) : (Number(r.minutos) || 0); } catch (e) { return 0; } }
  function v9Tipo(r) { const raw = String((r && (r.tipo || r.actividad)) || "ministerio").toLowerCase(); return raw === "asamblea" ? "asambleas" : (raw === "ministerio" || raw === "ldc" || raw === "asambleas") ? raw : "otras"; }
  function v9Pon(el, prop, val) { if (el && el.style.getPropertyValue(prop) !== String(val)) el.style.setProperty(prop, String(val)); }
  function v9Txt(el, t) { if (el && el.textContent !== t) el.textContent = t; }
  function v9Corto(min) { min = Math.round(min || 0); const h = Math.floor(min / 60), m = min % 60; return h && m ? h + " h " + m : h ? h + " h" : m + " min"; }

  /* 22a · Ajustes estilo iOS */
  function ajIniciales(n) { const p = n.split(/\s+/).filter(Boolean); if (!p.length) return "MS"; return ((p[0][0] || "") + (p.length > 1 ? (p[p.length - 1][0] || "") : (p[0][1] || ""))).toUpperCase(); }
  function ajResumenes() {
    const s = $("tipoPublicador"), tipo = s && s.selectedOptions && s.selectedOptions[0] ? s.selectedOptions[0].textContent.trim() : "", ob = objetivo();
    const modo = window.leerModoColorV276 ? window.leerModoColorV276() : "auto";
    let copia = "Sin copia de seguridad aún";
    try { const f = typeof leerUltimaCopiaSeguridad === "function" ? leerUltimaCopiaSeguridad() : null; if (f) { const d = new Date(f); if (!isNaN(d)) copia = "Última copia: " + d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", ""); } } catch (e) {}
    const con = $("estadoConexionTextoV190");
    return { tipo, perfil: ob ? "Objetivo " + v8Hm(ob) + " al mes" : "Nombre, actividades y objetivo", sync: [con ? (con.textContent || "").trim() : ""].filter(Boolean).join(" · "), apar: "Modo " + (modo === "claro" ? "claro" : modo === "oscuro" ? "oscuro" : "automático"), ayuda: "Guía rápida y consejos" };
  }
  function ajPonResumen(det, txt) {
    if (!det || !txt) return; const s = det.querySelector(":scope>summary"); if (!s) return;
    let c = s.querySelector(":scope>.aj-resumen-v27629");
    if (!c) { c = document.createElement("small"); c.className = "aj-resumen-v27629"; const t = s.querySelector(".ajustes-acordeon-titulo"); if (t && t.nextSibling) s.insertBefore(c, t.nextSibling); else s.appendChild(c); }
    v9Txt(c, txt);
  }
  function ajPintar() {
    const vista = $("vista-ajustes"); if (!vista) return;
    let cab = $("perfilCabV27629");
    if (!cab) {
      cab = document.createElement("button"); cab.type = "button"; cab.id = "perfilCabV27629"; cab.className = "aj-perfil-v27629"; cab.setAttribute("aria-label", "Editar perfil");
      cab.innerHTML = '<span class="aj-avatar-v27629" aria-hidden="true"></span><span class="aj-textos-v27629"><b></b><small></small></span><span class="aj-flecha-v27629" aria-hidden="true">›</span>';
      vista.insertBefore(cab, vista.firstChild);
      cab.addEventListener("click", () => {
        const d = vista.querySelector("details.ajustes-acordeon-v179:not([id])"); if (!d) return;
        if (!d.open) d.open = true;
        setTimeout(() => { try { d.scrollIntoView({ behavior: movReducido() ? "auto" : "smooth", block: "start" }); } catch (e) { d.scrollIntoView(); } const i = $("nombreSaludoV260"); if (i) { try { i.focus({ preventScroll: true }); } catch (e) { i.focus(); } } }, 60);
      });
    }
    const i = $("nombreSaludoV260"), nombre = i ? i.value.trim() : "", r = ajResumenes(), ob0 = /^Objetivo /.test(r.perfil || "");
    v9Txt(cab.querySelector(".aj-avatar-v27629"), ajIniciales(nombre));
    v9Txt(cab.querySelector("b"), nombre || "Mi Servicio");
    v9Txt(cab.querySelector("small"), (r.tipo || "Publicador") + (ob0 ? " · " + r.perfil.replace(/^Objetivo /, "") : ""));
    ajPonResumen(vista.querySelector("details.ajustes-acordeon-v179:not([id])"), r.perfil);
    ajPonResumen($("sincronizacionDetalleV260"), r.sync);
    ajPonResumen($("aparienciaV201"), r.apar);
    ajPonResumen($("ayudaBreveV260"), r.ayuda);
  }

  /* 22b · «Hoy llevas…» en Registrar */
  let hlFirma = "";
  function hlPintar() {
    const vista = $("vista-registrar"), cron = $("cronometroV264"); if (!vista || !cron) return;
    let s = $("hoyLlevasV27629");
    if (!s) {
      s = document.createElement("section"); s.id = "hoyLlevasV27629"; s.className = "hoy-llevas-v27629"; s.setAttribute("aria-live", "polite");
      s.innerHTML = '<div class="hl-anillo" aria-hidden="true"><i class="hl-aro"></i><b></b></div><div class="hl-cuerpo"><div class="hl-cab"><span class="hl-tit">Hoy llevas</span><b class="hl-total">0 min</b><span class="hl-falta"></span></div><div class="hl-barra" aria-hidden="true"></div></div><div class="hl-chips"></div>';
      cron.parentNode.insertBefore(s, cron);
    }
    const hoy = fechaISO(new Date()), t = { ministerio: 0, ldc: 0, asambleas: 0, otras: 0 }; let tot = 0;
    v8Regs().forEach(r => { if (String(r.fecha || "").slice(0, 10) !== hoy) return; const m = v9Min(r); t[v9Tipo(r)] += m; tot += m; });
    const plan = dnPlan(tot);
    const firma = hoy + "|" + V8_TIPOS.map(x => t[x[0]]).join(",") + "|" + (plan ? plan.need + "," + plan.pct + "," + plan.mes : "-");
    if (firma === hlFirma && s.dataset.listo === "1") return;
    const primera = s.dataset.listo !== "1", previo = hlFirma ? hlFirma.split("|")[1].split(",").reduce((a, b) => a + Number(b), 0) : 0, subio = !primera && firma.split("|")[0] === hlFirma.split("|")[0] && tot > previo;
    hlFirma = firma; s.dataset.listo = "1"; s.classList.toggle("hl-vacio", tot === 0 && !plan); s.classList.toggle("hl-cero", tot === 0); s.classList.toggle("hl-sin-meta", !plan);
    v9Txt(s.querySelector(".hl-total"), v8Hm(tot));
    const falta = s.querySelector(".hl-falta");
    let txt = "", cumplido = false;
    if (plan) { if (plan.mes) { txt = "¡Meta del mes cumplida!"; cumplido = true; } else if (plan.falta > 0) txt = "faltan " + v8Hm(plan.falta); else { txt = "¡Vas al día!"; cumplido = true; } }
    v9Txt(falta, txt); falta.classList.toggle("hl-ok", cumplido);
    if (plan) falta.title = plan.mes ? "" : "Para ir al día con tu meta del mes: " + v8Hm(plan.need) + " hoy";
    const an = s.querySelector(".hl-anillo");
    if (an) {
      const antes = Number(an.dataset.pct || 0), nuevo = plan ? plan.pct : 0; an.dataset.pct = String(nuevo); an.classList.toggle("hl-ok", cumplido);
      v9Txt(an.querySelector("b"), cumplido ? "✓" : nuevo + "%");
      if (movReducido() || primera) an.style.setProperty("--pr", String(nuevo)); else { an.style.setProperty("--pr", String(antes)); requestAnimationFrame(() => requestAnimationFrame(() => an.style.setProperty("--pr", String(nuevo)))); }
    }
    const barra = s.querySelector(".hl-barra"), ref = Math.max(240, tot);
    let seg = "", chips = "";
    V8_TIPOS.forEach(x => { const m = t[x[0]]; if (!m) return; seg += '<i style="--c1:' + x[2] + ";--c2:" + x[1] + ';" data-w="' + (m / ref * 100).toFixed(2) + '"></i>'; chips += '<span><u style="background:' + x[1] + '"></u>' + (V8_NOMBRE[x[0]] || x[0]) + " " + v8Hm(m) + "</span>"; });
    barra.innerHTML = seg; s.querySelector(".hl-chips").innerHTML = chips;
    const pon = () => barra.querySelectorAll("i").forEach(e => { e.style.width = e.dataset.w + "%"; });
    if (movReducido() || !primera && !subio) pon(); else { barra.querySelectorAll("i").forEach(e => { e.style.width = "0%"; }); requestAnimationFrame(() => requestAnimationFrame(pon)); }
    if (subio && !movReducido()) { const b = s.querySelector(".hl-total"); b.classList.remove("hl-sube"); void b.offsetWidth; b.classList.add("hl-sube"); }
    s.setAttribute("aria-label", "Hoy llevas " + v8Hm(tot) + (txt ? ". " + txt : ""));
  }

  /* 22c · Evolución con barras apiladas por actividad y corona al mejor mes */
  const V9_CORONA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 8.2l4.6 4 4.4-7.4 4.4 7.4 4.6-4-1.9 10.6H4.9z" fill="#ffc233" stroke="#c97a00" stroke-width="1.2" stroke-linejoin="round"/><path d="M5.2 16.4h13.6" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/><circle cx="3" cy="8" r="1.4" fill="#ffd966" stroke="#c97a00" stroke-width=".8"/><circle cx="12" cy="5" r="1.4" fill="#ffd966" stroke="#c97a00" stroke-width=".8"/><circle cx="21" cy="8" r="1.4" fill="#ffd966" stroke="#c97a00" stroke-width=".8"/></svg>';
  function evoPintar() {
    const host = $("tendenciaV144"); if (!host || typeof resumenMesV143 !== "function") return;
    const cont = host.querySelector("[data-v144-barras]"); if (!cont) return;
    const cols = cont.querySelectorAll(".v144-col"); if (cols.length !== 6) return;
    const hoy = new Date(), datos = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1); let r = null; try { r = resumenMesV143(d); } catch (e) {} datos.push({ d, total: r ? r.total : 0, tipos: r ? r.tipos : {} }); }
    const firma = datos.map(x => V9_CLAVES.map(k => x.tipos[k] || 0).join(",")).join("|");
    if (cont.dataset.evo === firma && cont.querySelector(".evo-seg-v27629")) return;
    cont.dataset.evo = firma;
    let mejor = -1, mt = 0; datos.forEach((x, i) => { if (x.total > 0 && x.total >= mt) { mt = x.total; mejor = i; } });
    cols.forEach((col, i) => {
      const bar = col.querySelector(".v144-bar"), x = datos[i]; if (!bar) return;
      bar.querySelectorAll(".evo-seg-v27629").forEach(e => e.remove());
      const suma = V9_CLAVES.reduce((a, k) => a + (x.tipos[k] || 0), 0);
      bar.classList.toggle("evo-apilada-v27629", suma > 0);
      if (suma > 0) V9_CLAVES.forEach((k, j) => { const m = x.tipos[k] || 0; if (!m) return; const e = document.createElement("i"); e.className = "evo-seg-v27629"; e.style.flexGrow = String(m); e.style.setProperty("--c1", V8_TIPOS[j][2]); e.style.setProperty("--c2", V8_TIPOS[j][1]); e.title = k + " " + v8Hm(m); bar.appendChild(e); });
      col.classList.toggle("evo-mejor-v27629", i === mejor);
      const vv = col.querySelector(".v144-valor"); let co = col.querySelector(":scope>.evo-corona-v27629");
      if (i === mejor) { if (!co) { co = document.createElement("span"); co.className = "evo-corona-v27629"; co.setAttribute("aria-hidden", "true"); co.innerHTML = V9_CORONA; col.insertBefore(co, col.firstChild); } } else if (co) co.remove();
      const nom = x.d.toLocaleDateString("es-ES", { month: "long" });
      col.setAttribute("aria-label", nom + ": " + (x.total ? v8Hm(x.total) + " (" + V9_CLAVES.filter(k => x.tipos[k]).map(k => k + " " + v8Hm(x.tipos[k])).join(", ") + ")" : "sin actividad") + (i === mejor ? ", mejor mes" : ""));
    });
    let lg = host.querySelector(".evo-leyenda-v27629");
    if (!lg) { lg = document.createElement("div"); lg.className = "evo-leyenda-v27629"; cont.parentNode.insertBefore(lg, cont.nextSibling); }
    const usados = V9_CLAVES.map((k, j) => datos.some(x => x.tipos[k] > 0) ? '<span><u style="background:linear-gradient(145deg,' + V8_TIPOS[j][2] + "," + V8_TIPOS[j][1] + ')"></u>' + k + "</span>" : "").join("") + (mejor >= 0 ? '<span class="evo-leg-corona">' + V9_CORONA + "Mejor mes</span>" : "");
    if (lg.innerHTML !== usados) lg.innerHTML = usados;
  }

  /* 22d · Rueda de la meta al guardar */
  function mesTotalCompu() { try { const r = resumenMesV143(new Date()); return { total: r.total, comp: typeof r.computable === "number" ? r.computable : r.total }; } catch (e) { return { total: 0, comp: 0 }; } }
  function ruedaMostrar(antes, despues, delta, falta) {
    const viejo = $("ruedaV27629"); if (viejo) viejo.remove();
    const o = document.createElement("div"); o.id = "ruedaV27629"; o.className = "rueda-v27629"; o.setAttribute("role", "status");
    o.innerHTML = '<div class="rd-anillo" aria-hidden="true"><b class="rd-pct">' + antes + '%</b></div><div class="rd-txt"><strong>+' + v8Hm(delta) + '</strong><span>' + (falta > 0 ? "Te faltan " + v8Hm(falta) + " para tu meta" : "¡Meta del mes cumplida!") + "</span></div>";
    document.body.appendChild(o);
    const pct = o.querySelector(".rd-pct"), reducido = movReducido();
    o.style.setProperty("--pr", String(reducido ? despues : antes));
    requestAnimationFrame(() => requestAnimationFrame(() => { o.classList.add("rd-entra"); o.style.setProperty("--pr", String(despues)); }));
    if (reducido) pct.textContent = despues + "%"; else { const t0 = performance.now(), dur = 1000; const paso = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); pct.textContent = Math.round(antes + (despues - antes) * e) + "%"; if (k < 1 && o.isConnected) requestAnimationFrame(paso); }; requestAnimationFrame(paso); }
    const quitar = () => { o.classList.remove("rd-entra"); o.classList.add("rd-sale"); setTimeout(() => { if (o.parentNode) o.remove(); }, 320); };
    o.addEventListener("click", quitar); setTimeout(quitar, 3400);
  }

  /* 22e · Tarjeta del mes como imagen para compartir */
  function tjRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function tjDibujar(ref) {
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d");
    const css = getComputedStyle(document.documentElement), base = (css.getPropertyValue("--firma-base") || "").trim() || "#2864d7", luz = (css.getPropertyValue("--firma-luz") || "").trim() || "#6aa6ff";
    const r = resumenMesV143(ref), ob = omObjetivoDe(fechaISO(ref).slice(0, 7)), comp = typeof r.computable === "number" ? r.computable : r.total, pct = ob ? Math.min(100, Math.round(comp / ob * 100)) : 0;
    const F = '-apple-system,"SF Pro Display","Helvetica Neue",Arial,sans-serif';
    let g = c.createLinearGradient(0, 0, W * 0.6, H); g.addColorStop(0, "#0d1426"); g.addColorStop(0.55, "#111c3a"); g.addColorStop(1, "#0a0f1f"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    let rg = c.createRadialGradient(W * 0.85, H * 0.12, 20, W * 0.85, H * 0.12, 620); rg.addColorStop(0, base); rg.addColorStop(1, "rgba(0,0,0,0)"); c.globalAlpha = 0.5; c.fillStyle = rg; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    rg = c.createRadialGradient(W * 0.05, H * 0.95, 20, W * 0.05, H * 0.95, 560); rg.addColorStop(0, "#8a5be0"); rg.addColorStop(1, "rgba(0,0,0,0)"); c.globalAlpha = 0.32; c.fillStyle = rg; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    c.textBaseline = "alphabetic";
    g = c.createLinearGradient(80, 80, 160, 160); g.addColorStop(0, luz); g.addColorStop(1, base); c.fillStyle = g; tjRect(c, 80, 78, 78, 78, 22); c.fill();
    c.strokeStyle = "#fff"; c.lineWidth = 6; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); c.moveTo(119, 104); c.lineTo(119, 138); c.moveTo(98, 100); c.quadraticCurveTo(108, 98, 119, 106); c.quadraticCurveTo(130, 98, 140, 100); c.lineTo(140, 134); c.quadraticCurveTo(130, 132, 119, 140); c.quadraticCurveTo(108, 132, 98, 134); c.closePath(); c.stroke();
    c.fillStyle = "rgba(255,255,255,.72)"; c.font = "700 34px " + F; c.fillText("MI SERVICIO", 180, 112); c.font = "500 30px " + F; c.fillStyle = "rgba(255,255,255,.5)"; c.fillText("Resumen mensual", 180, 150);
    let mes = ref.toLocaleDateString("es-ES", { month: "long", year: "numeric" }); mes = mes.charAt(0).toUpperCase() + mes.slice(1);
    c.fillStyle = "#fff"; c.font = "800 96px " + F; c.fillText(mes, 80, 300);
    const cx = W / 2, cy = 640, R = 205, grosor = 54;
    c.lineWidth = grosor; c.lineCap = "round"; c.strokeStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    if (ob && pct > 0) { g = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, luz); g.addColorStop(1, base); c.strokeStyle = g; c.shadowColor = base; c.shadowBlur = 36; c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct / 100); c.stroke(); c.shadowBlur = 0; }
    c.textAlign = "center"; c.fillStyle = "#fff";
    if (ob) { c.font = "800 128px " + F; c.fillText(pct + "%", cx, cy + 34); c.font = "500 34px " + F; c.fillStyle = "rgba(255,255,255,.62)"; c.fillText("de " + v8Hm(ob), cx, cy + 90); }
    else { c.font = "800 100px " + F; c.fillText(v9Corto(r.total), cx, cy + 30); }
    c.font = "700 46px " + F; c.fillStyle = "#fff"; c.fillText(v8Hm(r.total) + " registradas", cx, 940);
    c.textAlign = "left";
    const filas = V8_TIPOS.map((x, j) => [V9_CLAVES[j], x, r.tipos[V9_CLAVES[j]] || 0]).filter(f => f[2] > 0), max = Math.max.apply(null, filas.map(f => f[2]).concat([1]));
    let y = 1000; const paso = 62;
    filas.forEach(f => {
      c.fillStyle = "rgba(255,255,255,.86)"; c.font = "600 30px " + F; c.fillText(f[0], 80, y + 8);
      const x0 = 300, ancho = 520; c.fillStyle = "rgba(255,255,255,.1)"; tjRect(c, x0, y - 18, ancho, 30, 15); c.fill();
      const w = Math.max(30, ancho * f[2] / max); g = c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, f[1][2]); g.addColorStop(1, f[1][1]); c.fillStyle = g; tjRect(c, x0, y - 18, w, 30, 15); c.fill();
      c.textAlign = "right"; c.fillStyle = "#fff"; c.font = "700 30px " + F; c.fillText(v8Hm(f[2]), W - 80, y + 8); c.textAlign = "left"; y += paso;
    });
    const yb = 1250; c.fillStyle = "rgba(255,255,255,.08)"; tjRect(c, 80, yb - 60, W - 160, 96, 28); c.fill();
    c.fillStyle = "rgba(255,255,255,.62)"; c.font = "500 26px " + F; c.fillText("Días activos", 116, yb - 18); c.fillText("Mejor semana", 560, yb - 18);
    c.fillStyle = "#fff"; c.font = "800 34px " + F; c.fillText(String(r.dias), 300, yb - 14); c.fillText(v8Hm(r.mejor), 800, yb - 14);
    return cv;
  }
  function tjAbrir() {
    const input = $("mesResumenV143"); let ref = null; try { ref = typeof fechaMesV202 === "function" ? fechaMesV202(input && input.value) : null; } catch (e) {} if (!ref) ref = new Date();
    let cv; try { cv = tjDibujar(ref); } catch (e) { console.warn("[V27629 tarjeta]", e); return; }
    const viejo = $("tarjetaV27629"); if (viejo) viejo.remove();
    cv.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob), nombre = "mi-servicio-" + ref.getFullYear() + "-" + String(ref.getMonth() + 1).padStart(2, "0") + ".png";
      const o = document.createElement("div"); o.id = "tarjetaV27629"; o.className = "tarjeta-mes-v27629"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Tarjeta del mes");
      o.innerHTML = '<div class="tj-caja"><img alt="Resumen del mes en imagen" src="' + url + '"><div class="tj-acc"><button type="button" class="tj-comp">Compartir</button><a class="tj-guardar" download="' + nombre + '" href="' + url + '">Guardar imagen</a><button type="button" class="tj-cerrar">Cerrar</button></div><p class="tj-msg" aria-live="polite"></p></div>';
      document.body.appendChild(o);
      const msg = o.querySelector(".tj-msg"), cerrar = () => { URL.revokeObjectURL(url); o.remove(); document.removeEventListener("keydown", tecla); }, tecla = e => { if (e.key === "Escape") cerrar(); };
      document.addEventListener("keydown", tecla);
      o.querySelector(".tj-cerrar").addEventListener("click", cerrar); o.addEventListener("click", e => { if (e.target === o) cerrar(); });
      const file = (() => { try { return new File([blob], nombre, { type: "image/png" }); } catch (e) { return null; } })();
      const puede = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] }));
      const bc = o.querySelector(".tj-comp"); if (!puede) bc.hidden = true;
      bc.addEventListener("click", async () => { try { await navigator.share({ files: [file], title: "Mi Servicio · Resumen mensual" }); } catch (e) { if (!e || e.name !== "AbortError") msg.textContent = "No se pudo abrir Compartir. Usa «Guardar imagen»."; } });
      o.querySelector(".tj-guardar").addEventListener("click", () => { msg.textContent = "Si no se descarga, mantén pulsada la imagen y elige «Guardar»."; });
      window.__tarjetaV27629 = { ancho: cv.width, alto: cv.height, bytes: blob.size, nombre };
    }, "image/png");
  }
  function tjInstalar() {
    const comp = $("compartirMesV260"); if (!comp || $("tarjetaMesV27629")) return;
    const b = document.createElement("button"); b.type = "button"; b.id = "tarjetaMesV27629"; b.className = "boton-secundario"; b.textContent = "Tarjeta del mes";
    comp.parentNode.insertBefore(b, comp.nextSibling); b.addEventListener("click", tjAbrir);
  }

  function v9Pasar() { try { ajPintar(); hlPintar(); evoPintar(); tjInstalar(); srPintar(); vtPintar(); v33Pasar(); } catch (e) { console.warn("[V27629]", e); } }
  function instalarV9() {
    v9Pasar();
    document.addEventListener("input", e => { if (e.target && (e.target.id === "nombreSaludoV260" || e.target.id === "objetivoMensual")) setTimeout(ajPintar, 0); }, true);
    document.addEventListener("change", e => { if (e.target && /^(tipoPublicador|nombreSaludoV260|objetivoMensual)$/.test(e.target.id)) setTimeout(ajPintar, 0); }, true);
    document.addEventListener("click", e => { if (e.target.closest && e.target.closest("#abrirAjustesV260,#modoColorV27627")) setTimeout(ajPintar, 80); }, true);
    rcInstalar(); gsInstalar(); omInstalar(); iniInstalar(); rpInstalar(); dsInstalar(); hbInstalar(); acInstalar(); txInstalar(); plInstalar(); scInstalar(); ajInstalar(); ajxInstalar(); mrInstalar(); rbInstalar(); rdInstalar(); etInstalar(); cdInstalar(); hsInstalar(); lfInstalar(); cuInstalar(); egCrear(); tdInstalar(); nvInstalar(); esInstalar(); wowInstalar();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(cpPintar, 300); });
    setTimeout(() => srProgramar(100), 1100); window.addEventListener("resize", () => srProgramar(1200)); window.addEventListener("orientationchange", () => srProgramar(1500));
    window.MiServicioV27629 = { ajPintar, hlPintar, evoPintar, ruedaMostrar, tjDibujar, tjAbrir, ajResumenes, srPintar, vtPintar, dnPlan, rcEvaluar, rcMensaje };
  }

  /* ================= 23. V27631 · SEMANA CON RACHA, OBJETIVO DIARIO, RECORDATORIO CÁLIDO Y VITRINA DEL AÑO ================= */
  const SR_LETRAS = ["L", "M", "X", "J", "V", "S", "D"], SR_DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  const SR_LLAMA = '<svg viewBox="0 0 24 28" aria-hidden="true" focusable="false"><defs><linearGradient id="srLlamaG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3b30"/><stop offset=".55" stop-color="#ff9500"/><stop offset="1" stop-color="#ffd54a"/></linearGradient></defs><path class="sr-ll-ext" d="M12.6 1.2c.6 4.4 6.9 7.2 6.9 14.1A7.5 7.5 0 0 1 12 23a7.5 7.5 0 0 1-7.5-7.7c0-3 1.7-4.9 3.2-6.4.2 2 1.1 3.3 2.4 3.9-.6-4.1.2-8 2.5-11.6z" fill="url(#srLlamaG)"/><path class="sr-ll-int" d="M12.2 12.5c.3 2.4 3.4 3.5 3.4 6.5a3.7 3.7 0 0 1-7.4 0c0-1.7 1-2.7 1.8-3.6.2 1 .6 1.6 1.3 1.9-.3-2 .1-3.6.9-4.8z" fill="#fff3b0" opacity=".92"/></svg>';
  const SR_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5.5 12.8l4.2 4.2 8.8-9.2" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function srRacha() { try { const L = window.MiServicioV267 && window.MiServicioV267.calcularLogros; return L ? (L().rachaActual || 0) : 0; } catch (e) { return 0; } }
  function srNivel(n) { return n >= 14 ? 4 : n >= 7 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0; }
  function srPintar() {
    const obj = $("seccionObjetivoInicioV260"); if (!obj) return;
    let s = $("semanaRachaV27631");
    if (!s) {
      s = document.createElement("section"); s.id = "semanaRachaV27631"; s.className = "seccion semana-racha-v27631";
      s.innerHTML = '<div class="sr-tarjeta"><div class="sr-dias" role="list"></div><div class="sr-llama" role="img"><span class="sr-ico">' + SR_LLAMA + '</span><b></b><small></small></div></div>';
      obj.parentNode.insertBefore(s, obj);
    }
    const hoy = new Date(), dow = (hoy.getDay() + 6) % 7, lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dow), hoyIso = fechaISO(hoy), racha = srRacha();
    const mapa = {}; v8Regs().forEach(r => { const f = String(r.fecha).slice(0, 10); (mapa[f] = mapa[f] || { total: 0, t: {} }); const m = v9Min(r), k = v9Tipo(r); mapa[f].total += m; mapa[f].t[k] = (mapa[f].t[k] || 0) + m; });
    const dias = [];
    for (let i = 0; i < 7; i++) { const d = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i), f = fechaISO(d), x = mapa[f], hecho = !!(x && x.total > 0); let dom = "ministerio"; if (hecho) dom = Object.keys(x.t).sort((a, b) => x.t[b] - x.t[a])[0]; dias.push({ i, f, hecho, total: hecho ? x.total : 0, dom, estado: hecho ? "hecho" : f === hoyIso ? "hoy" : f > hoyIso ? "futuro" : "vacio" }); }
    const firma = dias.map(d => d.estado + d.total + d.dom).join("|") + "#" + racha + "#" + hoyIso;
    if (s.dataset.firma === firma) return; s.dataset.firma = firma;
    const cont = s.querySelector(".sr-dias"); cont.textContent = "";
    dias.forEach(d => {
      const e = document.createElement("div"); e.className = "sr-dia"; e.dataset.estado = d.estado; e.setAttribute("role", "listitem");
      const col = V8_TIPOS.find(x => x[0] === d.dom) || V8_TIPOS[0]; e.style.setProperty("--c1", col[2]); e.style.setProperty("--c2", col[1]); e.style.setProperty("--i", String(d.i));
      e.setAttribute("aria-label", SR_DIAS[d.i] + (d.hecho ? ": " + v8Hm(d.total) : d.estado === "hoy" ? ": hoy, sin registrar" : d.estado === "futuro" ? ": pendiente" : ": sin actividad"));
      e.innerHTML = '<i class="sr-circ">' + (d.hecho ? SR_CHECK : "") + "</i><small>" + SR_LETRAS[d.i] + "</small>";
      cont.appendChild(e);
    });
    const ll = s.querySelector(".sr-llama"); ll.dataset.nivel = String(srNivel(racha));
    v9Txt(ll.querySelector("b"), racha ? String(racha) : "0");
    v9Txt(ll.querySelector("small"), racha === 1 ? "día seguido" : racha ? "días seguidos" : "empieza hoy");
    ll.setAttribute("aria-label", racha ? "Racha de " + racha + (racha === 1 ? " día" : " días") : "Sin racha todavía");
  }

  /* Si la franja de la semana impidiera que Inicio quepa entera en pantalla, se oculta sola (se prueba una vez por tamaño de pantalla). */
  let srClave = "";
  function srAjustar() {
    const s = $("semanaRachaV27631"), vi = $("vista-inicio"); if (!s || !vi || !vi.classList.contains("activa") || document.hidden) return;
    const clave = innerWidth + "x" + innerHeight; if (clave === srClave) return; srClave = clave;
    const encaja = () => document.body.classList.contains("inicio-encajado-v260") || document.documentElement.scrollHeight <= innerHeight + 2;
    s.classList.remove("sr-oculta-v27631");
    setTimeout(() => {
      if (encaja()) return;
      const cu = $("curiosidadV27655"), ocultarSemana = () => {
        s.classList.add("sr-oculta-v27631"); try { programarEncajeV260(true); } catch (e) {}
        setTimeout(() => { if (!encaja()) { s.classList.remove("sr-oculta-v27631"); try { programarEncajeV260(true); } catch (e) {} } }, 1500);
      };
      /* La curiosidad es un extra: cede primero su sitio; la semana solo se oculta si aun asi no cabe */
      if (cu && !cu.classList.contains("cu-sinsitio-v27657")) {
        cu.classList.add("cu-sinsitio-v27657"); try { programarEncajeV260(true); } catch (e) {}
        setTimeout(() => { if (encaja()) { cu.classList.remove("cu-sinsitio-v27657"); try { programarEncajeV260(true); } catch (e) {} setTimeout(() => { if (!encaja()) { cu.classList.add("cu-sinsitio-v27657"); } }, 900); } else { cu.classList.remove("cu-sinsitio-v27657"); ocultarSemana(); } }, 900);
      } else ocultarSemana();
    }, 1200);
  }
  let srT = 0; function srProgramar(ms) { clearTimeout(srT); srT = setTimeout(srAjustar, ms); }

  /* 23b · Objetivo diario inteligente (aro dentro de «Hoy llevas…») */
  function dnPlan(hoyMin) {
    const ob = objetivo(); if (!ob) return null;
    const m = mesTotalCompu(), ahora = new Date(), ultimo = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    if (m.comp >= ob) return { mes: true, pct: 100, falta: 0, need: 0 };
    const antes = Math.max(0, m.comp - hoyMin), rest = ob - antes, dias = Math.max(1, ultimo - ahora.getDate() + 1), need = Math.max(1, Math.ceil(rest / dias));
    return { mes: false, need, pct: Math.min(100, Math.round(hoyMin / need * 100)), falta: Math.max(0, need - hoyMin) };
  }

  /* 23c · Recordatorio cálido dentro de la app */
  const RC_K = "miServicio.recordatorioV27631", RC_E = "miServicio.recordatorioEstadoV27631";
  function rcActivo() { try { return localStorage.getItem(RC_K) !== "0"; } catch (e) { return true; } }
  function rcEstado() { try { const o = JSON.parse(localStorage.getItem(RC_E) || "null"); return o && o.f === fechaISO(new Date()) ? o : { f: fechaISO(new Date()), ts: 0, no: false }; } catch (e) { return { f: fechaISO(new Date()), ts: 0, no: false }; } }
  function rcGuardar(o) { try { localStorage.setItem(RC_E, JSON.stringify(o)); } catch (e) {} }
  function rcQuitar(rapido) { const o = $("recuerdoV27631"); if (!o) return; o.classList.remove("rc-entra"); o.classList.add("rc-sale"); setTimeout(() => { if (o.parentNode) o.remove(); }, rapido ? 0 : 380); }
  function rcMensaje() {
    const h = new Date().getHours(), racha = srRacha(); let n = ""; try { n = nombreSaludoV260() || ""; } catch (e) {}
    const saludo = (h >= 20 ? "Buenas noches" : "Buenas tardes") + (n ? ", " + n : "");
    if (racha >= 2) return [saludo, "Hoy aún no has registrado nada. No pierdas tu racha de " + racha + " días 🔥"];
    return [saludo, "Hoy todavía no has registrado nada. ¿Lo anotamos antes de que acabe el día?"];
  }
  function rcEvaluar() {
    try {
      if (!rcActivo() || $("recuerdoV27631")) return;
      const vi = $("vista-inicio"); if (!vi || !vi.classList.contains("activa") || document.hidden) return;
      if (document.querySelector("dialog[open],.celebracion-v267,.tarjeta-mes-v27629,.celebracion-mes-v27628")) return;
      const ahora = new Date(), h = ahora.getHours(); if (h < 18 || h >= 23) return;
      const regs = v8Regs(); if (!regs.length) return;
      const hoy = fechaISO(ahora); if (regs.some(r => String(r.fecha).slice(0, 10) === hoy && v9Min(r) > 0)) return;
      const e = rcEstado(); if (e.no || (e.ts && Date.now() - e.ts < 2 * 3600e3)) return;
      e.ts = Date.now(); rcGuardar(e);
      const m = rcMensaje(), o = document.createElement("div"); o.id = "recuerdoV27631"; o.className = "recuerdo-v27631"; o.setAttribute("role", "status");
      o.innerHTML = '<span class="rc-gesto" aria-hidden="true">👋</span><div class="rc-txt"><strong></strong><span></span></div><div class="rc-acc"><button type="button" class="rc-si">Registrar</button><button type="button" class="rc-no">Hoy no</button></div>';
      o.querySelector("strong").textContent = m[0]; o.querySelector(".rc-txt span").textContent = m[1];
      o.querySelector(".rc-si").addEventListener("click", () => { rcQuitar(); const n = document.querySelector('.nav-item[data-vista="registrar"]'); if (n) n.click(); });
      o.querySelector(".rc-no").addEventListener("click", () => { const x = rcEstado(); x.no = true; rcGuardar(x); rcQuitar(); });
      document.body.appendChild(o); requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add("rc-entra")));
    } catch (er) { console.warn("[V27631 recordatorio]", er); }
  }
  function rcVigilar() {
    const o = $("recuerdoV27631"); if (!o) return;
    const vi = $("vista-inicio"), hoy = fechaISO(new Date());
    if (!vi || !vi.classList.contains("activa") || v8Regs().some(r => String(r.fecha).slice(0, 10) === hoy && v9Min(r) > 0)) rcQuitar(true);
  }
  function rcInstalar() {
    const g = $("recordatorioV27631"); if (g) {
      const pintar = () => g.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", (b.dataset.rcV27631 === "si") === rcActivo() ? "true" : "false"));
      g.addEventListener("click", e => { const b = e.target.closest("button[data-rc-v27631]"); if (!b) return; try { localStorage.setItem(RC_K, b.dataset.rcV27631 === "si" ? "1" : "0"); } catch (er) {} if (!rcActivo()) rcQuitar(true); pintar(); });
      pintar();
    }
    setTimeout(rcEvaluar, 3000);
    setInterval(() => { rcVigilar(); rcEvaluar(); }, 300000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(rcEvaluar, 1200); });
    document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".nav-item")) { setTimeout(rcVigilar, 200); if (e.target.closest('.nav-item[data-vista="inicio"]')) setTimeout(rcEvaluar, 1500); } });
  }

  /* 23d · Vitrina de insignias del año de servicio */
  const VT_ESTRELLA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width="1" stroke-linejoin="round"/></svg>';
  const VT_MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function vtPintar() {
    const host = $("anioServicioV276"); if (!host || typeof resumenMesV143 !== "function") return;
    let s = $("vitrinaV27631");
    if (!s) { s = document.createElement("section"); s.id = "vitrinaV27631"; s.className = "tarjeta vitrina-v27631"; s.innerHTML = '<h2 class="titulo-bloque-v267 vt-titulo"></h2><p class="vt-sub"></p><div class="vt-rejilla"></div><div class="vt-datos"></div>'; host.insertAdjacentElement("afterend", s); }
    const anio = anioV276 === null ? anioServicioHoy() : anioV276, d = calcularAnio(anio), ob = objetivo(), hoy = new Date(), clave = fechaISO(hoy).slice(0, 7);
    const lista = d.meses.map(x => { const ini = new Date(x.y, x.m, 1); let comp = 0; try { const r = resumenMesV143(ini); comp = typeof r.computable === "number" ? r.computable : r.total; } catch (e) {} const claveM = x.y + "-" + String(x.m + 1).padStart(2, "0"), futuro = claveM > clave, obM = omObjetivoDe(claveM), pct = obM ? Math.round(comp / obM * 100) : 0; return { x, comp, pct, futuro, obM, nivel: !obM || futuro ? 0 : pct >= 100 ? 3 : pct >= 75 ? 2 : pct >= 50 ? 1 : 0 }; });
    const firma = anio + "|" + ob + "|" + lista.map(l => l.comp + ":" + l.obM).join(",") + "|" + clave + "|" + d.racha + "|" + d.total;
    if (s.dataset.firma === firma) return; s.dataset.firma = firma;
    v9Txt(s.querySelector(".vt-titulo"), "Vitrina de insignias"); /* V27640: el año ya está en «Tu año en cifras» */
    const oros = lista.filter(l => l.nivel === 3).length;
    v9Txt(s.querySelector(".vt-sub"), ob ? "Oro: meta cumplida · Plata: 75 % · Bronce: 50 %" : "Define tu objetivo mensual en Ajustes para ganar insignias.");
    const rej = s.querySelector(".vt-rejilla"); rej.textContent = "";
    const TONO = ["", "naranja", "plata", "oro"], NOM = ["sin insignia", "bronce", "plata", "oro"];
    lista.forEach((l, i) => {
      const c = document.createElement("div"); c.className = "vt-mes"; c.style.setProperty("--i", String(i)); c.dataset.nivel = String(l.nivel);
      c.setAttribute("role", "img"); c.setAttribute("aria-label", MESES_L[l.x.m] + ": " + (l.futuro ? "pendiente" : l.obM ? l.pct + " % de la meta, " + NOM[l.nivel] : "sin objetivo"));
      c.innerHTML = '<span class="medalla-v267' + (l.nivel ? "" : " bloqueada") + '"' + (l.nivel ? ' data-tono="' + TONO[l.nivel] + '"' : "") + '><i class="canto"></i><i class="cara"><b></b></i><i class="brillo"></i></span><strong></strong><small></small>';
      c.querySelector("b").innerHTML = l.nivel ? VT_ESTRELLA : ""; c.querySelector("strong").textContent = MESES_L[l.x.m].charAt(0).toUpperCase() + MESES_L[l.x.m].slice(1, 3);
      c.querySelector("small").textContent = l.futuro ? "—" : ob ? l.pct + " %" : "—";
      rej.appendChild(c);
    });
    try { mdDesbloqueos(lista, rej); } catch (e) {}
    const dat = s.querySelector(".vt-datos"); dat.textContent = "";
    [[oros + "/12", "meses de oro"]].forEach(p => { const e = document.createElement("div"); const b = document.createElement("strong"); b.textContent = p[0]; const sm = document.createElement("small"); sm.textContent = p[1]; e.append(b, sm); dat.appendChild(e); });
  }

  /* ================= 24. V27633 · PROYECCIÓN DE CIERRE, ESTADO DE LA COPIA Y GESTOS ================= */
  /* 24a · Proyección de cierre de mes (solo lectura: no guarda nada) */
  function pyPintar() {
    const cab = document.querySelector("#seccionObjetivoInicioV260 .objetivo-cabecera > div"); if (!cab) return;
    let p = $("proyeccionV27633");
    if (!p) { p = document.createElement("small"); p.id = "proyeccionV27633"; p.className = "py-v27633"; p.hidden = true; cab.appendChild(p); }
    let txt = "", cls = "", aria = "";
    try {
      const ob = objetivo(), hoy = new Date(), d = hoy.getDate(), ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate(), m = mesTotalCompu().comp;
      if (ob > 0 && m > 0 && m < ob && d >= 3) {
        const proy = Math.round(m / d * ultimo), ok = proy >= ob;
        txt = "Cierre previsto: " + v8Hm(proy); cls = ok ? "py-ok" : "py-bajo";
        aria = "A este ritmo cerrarías el mes con " + v8Hm(proy) + (ok ? ", por encima de tu objetivo." : ", " + v8Hm(ob - proy) + " por debajo de tu objetivo.");
      }
    } catch (e) {}
    const firma = txt + "|" + cls; if (p.dataset.firma === firma) return; p.dataset.firma = firma;
    p.hidden = !txt; p.className = "py-v27633" + (cls ? " " + cls : ""); v9Txt(p, txt);
    if (aria) p.setAttribute("aria-label", aria); else p.removeAttribute("aria-label");
  }

  /* 24b · Estado de la copia de seguridad */
  function cpDias() { try { const f = typeof leerUltimaCopiaSeguridad === "function" ? leerUltimaCopiaSeguridad() : null; if (!f) return null; const d = Math.floor((Date.now() - new Date(f).getTime()) / 86400000); return isNaN(d) ? null : Math.max(0, d); } catch (e) { return null; } }
  function cpNivel(d) { return d === null ? "rojo" : d <= 7 ? "verde" : d <= 30 ? "naranja" : "rojo"; }
  function cpTexto(d) { return d === null ? "Sin copia todavía" : d === 0 ? "Hoy" : d === 1 ? "Ayer" : "Hace " + d + " días"; }
  function cpFecha() { try { const f = typeof leerUltimaCopiaSeguridad === "function" ? leerUltimaCopiaSeguridad() : null; if (!f) return ""; const x = new Date(f); return isNaN(x) ? "" : x.toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", ""); } catch (e) { return ""; } }
  function cpPintar() {
    const d = cpDias(), nivel = cpNivel(d), txt = cpTexto(d);
    const av = $("abrirAjustesV260");
    if (av) {
      let pt = av.querySelector(":scope > .cp-punto-v27633");
      if (!pt) { pt = document.createElement("i"); pt.className = "cp-punto-v27633"; pt.setAttribute("aria-hidden", "true"); av.appendChild(pt); }
      if (pt.dataset.nivel !== nivel) pt.dataset.nivel = nivel;
      const et = "Abrir ajustes · copia de seguridad: " + txt.toLowerCase(); if (av.getAttribute("aria-label") !== et) av.setAttribute("aria-label", et);
    }
    const cab = $("perfilCabV27629"); if (!cab) return;
    let fila = $("copiaFilaV27633");
    if (!fila) {
      fila = document.createElement("div"); fila.id = "copiaFilaV27633"; fila.className = "cp-fila-v27633";
      fila.innerHTML = '<span class="cp-dot" aria-hidden="true"></span><span class="cp-txt"><b>Copia de seguridad</b><small></small></span><button type="button" class="cp-btn">Guardar ahora</button>';
      fila.querySelector(".cp-btn").addEventListener("click", () => { try { exportarCopiaSeguridad(); } catch (e) { console.warn("[V27633]", e); } setTimeout(cpPintar, 600); setTimeout(cpPintar, 2500); });
    }
    { const refD = $("seguridadDatosV260"); if (refD && refD.parentNode === cab.parentNode) { if (refD.previousElementSibling !== fila) refD.parentNode.insertBefore(fila, refD); } else if (cab.nextElementSibling !== fila) cab.parentNode.insertBefore(fila, cab.nextSibling); }
    if (fila.dataset.nivel !== nivel) fila.dataset.nivel = nivel;
    v9Txt(fila.querySelector("small"), txt + (d !== null && cpFecha() ? " · " + cpFecha() : ""));
  }

  /* 24c · Gestos: pulsación larga en un globo y deslizar entre pestañas */
  const GS_K = "miServicio.gestosV27633", GS_VISTAS = ["inicio", "registrar", "historial", "estadisticas"], QR_MINS = [30, 60, 90, 120];
  function gsActivo() { try { return localStorage.getItem(GS_K) !== "0"; } catch (e) { return true; } }
  let qrTs = 0;
  function qrCerrar() { const o = $("qrV27633"); if (!o) return; o.classList.remove("qr-entra"); setTimeout(() => { if (o.parentNode) o.remove(); }, movReducido() ? 0 : 200); }
  function qrColor(tipo) { const f = V8_TIPOS.find(x => x[0] === tipo); return f ? f : V8_TIPOS[0]; }
  function qrGuardar(tipo, min, companero) {
    companero = String(companero || "");
    if (!V8_NOMBRE[tipo] || !(min > 0)) return false;
    const fecha = fechaISO(new Date()), ahora = new Date().toISOString();
    if (typeof posibleDuplicadoV260 === "function" && posibleDuplicadoV260(estado.registros, { fecha, tipo, minutos: min, companero, notas: "", cursosBiblicos: 0 }) &&
      !window.confirm("Ya hay un registro idéntico de " + V8_NOMBRE[tipo] + " (" + v8Hm(min) + ") hoy. ¿Guardar otro igual?")) return false;
    const reg = { id: crearID(), fecha, tipo, minutos: min, notas: "", companero, cursosBiblicos: 0, creadoEn: ahora, modificadoEn: ahora, sincronizacion: { estado: "pendiente", ultimaSincronizacion: null } };
    let pct = 0; try { pct = ivPctObjetivo() || 0; } catch (e) {}
    estado.registros.push(reg);
    if (!guardarRegistros()) { estado.registros.pop(); avisoV202("No se pudo guardar el registro."); return false; }
    try { window.dispatchEvent(new CustomEvent("miServicio:registroGuardadoV188", { detail: { registro: reg } })); } catch (e) {}
    actualizarTodaLaInterfaz();
    let p2 = pct; try { p2 = ivPctObjetivo() || pct; } catch (e) {}
    avisoV202("✓ " + V8_NOMBRE[tipo] + " · " + v8Hm(min) + " guardado", () => {
      const antes = estado.registros;
      estado.registros = antes.filter(r => r.id !== reg.id);
      if (!guardarRegistros()) { estado.registros = antes; avisoV202("No se pudo deshacer."); return; }
      actualizarTodaLaInterfaz(); avisoV202("Registro deshecho");
    });
    if (pct < 100 && p2 >= 100) setTimeout(celMostrar, 700);
    return reg.id;
  }
  function qrAbrir(tipo) {
    if (!V8_NOMBRE[tipo] || ($("qrV27633"))) return;
    try { if (typeof actividadVisible === "function" && !actividadVisible(tipo)) return; } catch (e) {}
    const c = qrColor(tipo), oscuro = document.documentElement.dataset.modoV276 === "oscuro" || (document.documentElement.dataset.modoV276 !== "claro" && window.matchMedia("(prefers-color-scheme:dark)").matches);
    const o = document.createElement("div"); o.id = "qrV27633"; o.className = "qr-fondo"; qrTs = Date.now();
    o.style.setProperty("--qr-c", oscuro ? c[2] : c[1]);
    o.innerHTML = '<div class="qr-hoja" role="dialog" aria-modal="true" aria-label="Registro rápido de ' + V8_NOMBRE[tipo] + '"><span class="qr-agarre" aria-hidden="true"></span><h3><i aria-hidden="true"></i>' + V8_NOMBRE[tipo] + ' · hoy</h3><p class="qr-sub">Toca un tiempo para guardarlo ahora</p><div class="qr-chips">' +
      QR_MINS.map(m => '<button type="button" class="qr-chip" data-min="' + m + '">' + v8Hm(m) + '</button>').join("") + '</div><div class="qr-pie"><button type="button" class="qr-mas">Más opciones</button><button type="button" class="qr-cancelar">Cancelar</button></div></div>';
    document.body.appendChild(o);
    o.addEventListener("click", e => {
      if (e.target === o) { if (Date.now() - qrTs > 600) qrCerrar(); return; }
      const ch = e.target.closest(".qr-chip"), mas = e.target.closest(".qr-mas"), ca = e.target.closest(".qr-cancelar");
      if (ch) { if (Date.now() - qrTs < 250) return; const ok = qrGuardar(tipo, parseInt(ch.dataset.min, 10)); if (ok !== false) qrCerrar(); else qrCerrar(); }
      else if (mas) { qrCerrar(); const n = document.querySelector('.nav-item[data-vista="registrar"]'); if (n) n.click(); setTimeout(() => { const b = document.querySelector('.actividad-boton[data-tipo="' + tipo + '"]'); if (b) b.click(); }, 350); }
      else if (ca) qrCerrar();
    });
    document.addEventListener("keydown", function esc(e) { if (!$("qrV27633")) { document.removeEventListener("keydown", esc); return; } if (e.key === "Escape") { qrCerrar(); document.removeEventListener("keydown", esc); } });
    requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add("qr-entra")));
    const hoja = o.querySelector(".qr-hoja"); if (hoja) { hoja.tabIndex = -1; try { hoja.focus({ preventScroll: true }); } catch (e) {} }
  }
  function gsInstalar() {
    const g = $("gestosV27633"); if (g) {
      const pintar = () => g.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", (b.dataset.gsV27633 === "si") === gsActivo() ? "true" : "false"));
      g.addEventListener("click", e => { const b = e.target.closest("button[data-gs-v27633]"); if (!b) return; try { localStorage.setItem(GS_K, b.dataset.gsV27633 === "si" ? "1" : "0"); } catch (er) {} pintar(); });
      pintar();
    }
    /* Pulsación larga en cualquier figura de una actividad: globos de Inicio, barras de Estadísticas y filtros del Historial */
    const GS_SEL = "#graficoInicio [data-actividad-inicio],#vista-estadisticas .barra-actividad-item,#vista-historial .filtro-historial[data-filtro]";
    const gsTipo = el => {
      if (el.dataset.actividadInicio) return el.dataset.actividadInicio;
      if (el.dataset.filtro) return el.dataset.filtro;
      return ["ministerio", "ldc", "asambleas", "otras"].find(t => el.classList.contains(t)) || "";
    };
    let tm = null, x0 = 0, y0 = 0;
    const cancelar = () => { if (tm) { clearTimeout(tm); tm = null; } };
    document.addEventListener("pointerdown", e => {
      cancelar(); if (!gsActivo() || e.button > 0) return;
      const pieza = e.target.closest && e.target.closest(GS_SEL); if (!pieza) return;
      const tipo = gsTipo(pieza); if (!tipo) return; x0 = e.clientX; y0 = e.clientY;
      tm = setTimeout(() => { tm = null; qrAbrir(tipo); }, 520);
    }, true);
    document.addEventListener("pointermove", e => { if (tm && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) cancelar(); }, true);
    ["pointerup", "pointercancel", "scroll"].forEach(n => document.addEventListener(n, cancelar, true));
    document.addEventListener("click", e => { if ($("qrV27633") && Date.now() - qrTs < 900 && e.target.closest && e.target.closest(GS_SEL)) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    document.addEventListener("contextmenu", e => { if (gsActivo() && e.target.closest && e.target.closest(GS_SEL) && gsTipo(e.target.closest(GS_SEL))) e.preventDefault(); }, true);
    /* Deslizar de lado para cambiar de pestaña */
    let s = null;
    const bloqueado = el => {
      if (!el || !el.closest) return true;
      if (el.closest('input,textarea,select,[contenteditable="true"],.registro-card,[role="dialog"],[aria-modal="true"],.qr-fondo,#vista-ajustes,#segmentoStatsV264,.barra-navegacion,details[open] > .ajustes-cuerpo')) return true;
      for (let n = el; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && n.scrollWidth > n.clientWidth + 4) return true; if (cs.position === "fixed") return true; }
      return false;
    };
    document.addEventListener("touchstart", e => {
      s = null; if (!gsActivo() || e.touches.length !== 1) return;
      const t = e.touches[0]; if (t.clientX < 28 || t.clientX > window.innerWidth - 28 || bloqueado(e.target)) return;
      s = { x: t.clientX, y: t.clientY, t: Date.now() };
    }, { passive: true });
    document.addEventListener("touchend", e => {
      if (!s) return; const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y, dt = Date.now() - s.t; s = null;
      if (dt > 650 || Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) / 2.5) return;
      const act = document.querySelector(".nav-item.activo"), i = act ? GS_VISTAS.indexOf(act.dataset.vista) : -1; if (i < 0) return;
      const j = i + (dx < 0 ? 1 : -1); if (j < 0 || j >= GS_VISTAS.length) return;
      const nav = document.querySelector('.nav-item[data-vista="' + GS_VISTAS[j] + '"]'); if (nav) nav.click();
    }, { passive: true });
    document.addEventListener("touchcancel", () => { s = null; }, { passive: true });
    window.MiServicioV27633 = { omObjetivoDe, omTrasGuardar, cmAbrir, cmCerrar, pyPintar, cpPintar, cpDias, cpNivel, qrAbrir, qrCerrar, qrGuardar, gsActivo, iniLeer, iniAplicar, rvAnalizar, rvAbrir, rvCerrar, rvPintar, rpPintar, hbLeer, hbPintar, acICS, acHora, cnNombres, dfDatos, dfPintar, cnPintar, txLeer, coLeer, txAplicar, plMes, scLeer, scAplicar, SC_LISTA, ajValor, acBuscarAct, ajxNorm, scRestablecer, ajxFiltrar, cdEstacion, wowFrase: frAnalizar };
  }
  /* 28 · V27636 · Personalizar Inicio: mostrar u ocultar tarjetas (solo apariencia, no entra en las copias) */
  function iniLeer() {
    let o = {}; try { o = JSON.parse(localStorage.getItem(INI_K) || "{}") || {}; } catch (e) { o = {}; }
    return { semana: o.semana !== false, tiempo: o.tiempo !== false, frase: o.frase !== false };
  }
  function iniAplicar() {
    const c = iniLeer(), r = document.documentElement;
    r.toggleAttribute("data-ini-sin-semana-v27636", !c.semana);
    r.toggleAttribute("data-ini-sin-tiempo-v27636", !c.tiempo);
    r.toggleAttribute("data-ini-sin-frase-v27636", !c.frase);
    r.toggleAttribute("data-ini-sin-pie-v27636", !c.tiempo && !c.frase);
    if (typeof programarEncajeV260 === "function") programarEncajeV260(true);
  }
  function iniInstalar() {
    iniAplicar();
    const g = $("inicioV27636"); if (!g) return;
    const c = iniLeer();
    g.querySelectorAll("input[data-ini-v27636]").forEach(i => { i.checked = c[i.dataset.iniV27636] !== false; });
    g.addEventListener("change", e => {
      const i = e.target.closest("input[data-ini-v27636]"); if (!i) return;
      const n = iniLeer(); n[i.dataset.iniV27636] = i.checked;
      try { localStorage.setItem(INI_K, JSON.stringify(n)); } catch (x) {}
      iniAplicar();
      if (i.checked && typeof scSalirConcentracion === "function") scSalirConcentracion();
    });
  }

  /* 29 · V27636 · Revisión de datos: busca registros dudosos y deja corregirlos con un toque (nada cambia sin pulsar) */
  const rvEsc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function rvFirma(r) { return [r.fecha, r.tipo, r.minutos ?? r.minutosTotales].join("|"); }
  function rvOk() { try { return JSON.parse(localStorage.getItem(RV_K) || "{}") || {}; } catch (e) { return {}; } }
  function rvFechaValida(f) {
    if (typeof f !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
    const [y, m, d] = f.split("-").map(Number), dt = new Date(y, m - 1, d, 12);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }
  function rvAnalizar(registros, hoyISO) {
    const lista = Array.isArray(registros) ? registros : [], hoy = hoyISO || fechaISO(new Date()), porId = new Map();
    const marca = (r, txt) => { const a = porId.get(r) || []; if (!a.includes(txt)) a.push(txt); porId.set(r, a); };
    const vistos = new Map(), dias = new Map(), norm = v => String(v == null ? "" : v).trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
    lista.forEach(r => {
      if (!r || typeof r !== "object") return;
      const min = Number(r.minutos ?? r.minutosTotales), valida = rvFechaValida(r.fecha);
      if (!valida) marca(r, "Fecha no válida");
      if (!RV_TIPOS.includes(r.tipo)) marca(r, "Tipo de actividad desconocido");
      if (!Number.isFinite(min) || min <= 0) marca(r, "Sin tiempo (0 minutos)");
      else if (min > 1440) marca(r, "Más de 24 h en un solo registro");
      if (valida && r.fecha > hoy) marca(r, "Fecha futura");
      if (valida && Number.isFinite(min) && min > 0) {
        const k = [r.fecha, r.tipo, min, norm(r.companero ?? r.acompanante), norm(r.notas)].join("|");
        if (vistos.has(k)) marca(r, "Posible duplicado"); else vistos.set(k, r);
        const d = dias.get(r.fecha) || { t: 0, rs: [] }; d.t += min; d.rs.push(r); dias.set(r.fecha, d);
      }
    });
    dias.forEach(d => { if (d.t > 1440) d.rs.forEach(r => marca(r, "El día suma más de 24 h")); });
    const ok = rvOk();
    return lista.filter(r => porId.has(r)).map(r => ({ r, motivos: porId.get(r) })).filter(x => ok[x.r.id] !== rvFirma(x.r))
      .sort((a, b) => String(b.r.fecha).localeCompare(String(a.r.fecha)));
  }
  function rvDatos() { try { return rvAnalizar(typeof estado !== "undefined" ? estado.registros : []); } catch (e) { return []; } }
  function rvFecha(f) { return rvFechaValida(f) ? f.split("-").reverse().join("/") : String(f || "sin fecha"); }
  function rvCerrar() { const o = $("rvV27636"); if (!o) return; o.classList.remove("qr-entra"); setTimeout(() => o.remove(), 220); }
  function rvAbrir() {
    if ($("rvV27636")) return;
    const o = document.createElement("div"); o.id = "rvV27636"; o.className = "qr-fondo";
    const items = rvDatos();
    const filas = items.map(x => '<div class="rv-fila" data-id="' + rvEsc(x.r.id) + '"><div class="rv-info"><b>' + rvEsc(rvFecha(x.r.fecha)) + ' · ' + rvEsc(nombreTipo(x.r.tipo)) + ' · ' + rvEsc(v8Hm(Number(x.r.minutos ?? x.r.minutosTotales) || 0)) + '</b><small>' + x.motivos.map(rvEsc).join(" · ") + '</small></div><div class="rv-acciones"><button type="button" data-rv="editar">Revisar</button><button type="button" data-rv="ok">Está bien</button><button type="button" data-rv="borrar" class="rv-borrar">Eliminar</button></div></div>').join("");
    o.innerHTML = '<div class="qr-hoja" role="dialog" aria-modal="true" aria-label="Revisión de datos"><span class="qr-agarre" aria-hidden="true"></span><h3>Revisión de datos</h3>' + (items.length ? '<p class="rv-ayuda">Estos registros parecen dudosos. No se cambia nada hasta que tú lo decidas.</p><div class="rv-lista">' + filas + '</div>' : '<p class="rv-vacio">✓ Todo en orden. No hay registros dudosos.</p>') + '<button type="button" class="qr-cancelar">Cerrar</button></div>';
    document.body.appendChild(o); const t0 = Date.now();
    o.addEventListener("click", e => {
      if (e.target === o) { if (Date.now() - t0 > 400) rvCerrar(); return; }
      if (e.target.closest(".qr-cancelar")) { rvCerrar(); return; }
      const b = e.target.closest("button[data-rv]"); if (!b) return;
      const fila = b.closest(".rv-fila"), id = fila && fila.dataset.id, reg = estado.registros.find(r => String(r.id) === String(id)); if (!reg) return;
      if (b.dataset.rv === "ok") {
        const ok = rvOk(); ok[reg.id] = rvFirma(reg); try { localStorage.setItem(RV_K, JSON.stringify(ok)); } catch (x) {}
        fila.remove(); if (!o.querySelector(".rv-fila")) { rvCerrar(); } rvPintar();
      } else if (b.dataset.rv === "editar") { rvCerrar(); if (typeof abrirModalEdicion === "function") abrirModalEdicion(reg.id); }
      else if (b.dataset.rv === "borrar") { rvCerrar(); if (typeof abrirModalBorrado === "function") abrirModalBorrado(reg.id); }
    });
    document.addEventListener("keydown", function esc(e) { if (!$("rvV27636")) { document.removeEventListener("keydown", esc); return; } if (e.key === "Escape") { rvCerrar(); document.removeEventListener("keydown", esc); } });
    requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add("qr-entra")));
    const h = o.querySelector(".qr-hoja"); if (h) { h.tabIndex = -1; try { h.focus({ preventScroll: true }); } catch (e) {} }
  }
  function rvPintar() {
    const art = $("seguridadDatosV260"); if (!art) return;
    let b = $("revisionDatosV27636");
    if (!b) {
      b = document.createElement("button"); b.type = "button"; b.id = "revisionDatosV27636"; b.className = "boton-secundario";
      b.addEventListener("click", rvAbrir); art.appendChild(b);
    }
    const n = rvDatos().length, txt = n ? "Revisar datos (" + n + ")" : "Revisar datos · todo en orden";
    if (b.textContent !== txt) b.textContent = txt;
    b.classList.toggle("rv-aviso", n > 0);
  }

  /* 30 · V27637 · Menos repetición: se oculta en pantalla lo que ya se ve en otro sitio (los datos siguen en el DOM) */
  const RP_C = "rp-oculto-v27637";
  function rpAlt(el, oculto) { if (el && el.classList.contains(RP_C) !== oculto) { el.classList.toggle(RP_C, oculto); return true; } return false; }
  function rpPintar() {
    try {
      const R = document.documentElement; let cambio = false;
      const ea = $("estadoAnimal"), fc = document.querySelector(".inicio-pie-v260 .frase-animo-card");
      if (ea) {
        const generico = /^(¡Meta conseguida|¡Vas lanzado|Paso a paso|¡Buen ritmo)/.test((ea.textContent || "").trim());
        const frase = !!fc && !R.hasAttribute("data-ini-sin-frase-v27636") && !R.hasAttribute("data-ini-sin-pie-v27636");
        cambio = rpAlt(ea, generico && frase) || cambio;
      }
      const fr = $("fechaRegistro"), rd = $("resumenDiaV264");
      if (fr && rd) rpAlt(rd, fr.value === fechaISO(new Date()));
      document.querySelectorAll(".grupo-historial-cabecera").forEach(c => {
        const t = c.querySelector(".grupo-historial-total"), p = c.parentElement;
        if (t && p) rpAlt(t, p.querySelectorAll(".registro-card").length === 1);
      });
      rpAlt(document.querySelector(".cal-hist-v27628 .cal-res"), true);
      /* V27638 */
      /* V27640: el estado de la copia solo en Inicio; si hay aviso (sin conexión, sincronizando, cambios pendientes…) se ve en todas partes */
      const pill = $("estadoConexionV190"), vi = $("vista-inicio");
      if (pill) rpAlt(pill, !!vi && !vi.classList.contains("activa") && pill.classList.contains("estado-online-v190") && !pill.hasAttribute("data-pendientes-v273"));
      const nb = $("seguridadNubeV260"); if (nb) rpAlt(nb, /^OneDrive no conectado\.?$/.test((nb.textContent || "").trim()));
      const av = $("avisoInstalacionV264"), pe = $("estadoPersistenciaV264");
      if (av && pe) rpAlt(pe, !av.hidden && getComputedStyle(av).display !== "none");
      rpAlt($("semanaVisualTituloV193"), true);
      const cm = document.querySelector(".v143-rm-compara"); if (cm) rpAlt(cm, /^\s*Sin comparaci/i.test(cm.textContent || ""));
      if (cambio && typeof programarEncajeV260 === "function") programarEncajeV260(true);
    } catch (e) { console.warn("[V27637]", e); }
  }
  let rpTm = null;
  function rpProgramar() { if (rpTm) return; rpTm = setTimeout(() => { rpTm = null; rpPintar(); }, 120); }
  function rpInstalar() {
    rpPintar();
    new MutationObserver(rpProgramar).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden"] });
    ["input", "change", "click"].forEach(n => document.addEventListener(n, rpProgramar, true));
  }

  /* 31 · V27641 · Deshacer tras guardar desde el formulario (el registro rápido ya tenía el suyo) */
  function dsInstalar() {
    window.addEventListener("miServicio:registroGuardadoV188", ev => {
      const reg = ev && ev.detail && ev.detail.registro; if (!reg || !reg.id) return;
      setTimeout(() => {
        try {
          if ($("avisoV202")) return;                                   /* otro flujo ya mostró su aviso */
          if (reg.creadoEn !== reg.modificadoEn) return;                /* una edición no es un alta: no se puede «deshacer» borrando */
          if (Date.now() - (Date.parse(reg.creadoEn) || 0) > 8000) return;
          if (!estado.registros.some(r => r.id === reg.id)) return;
          avisoV202("✓ " + nombreTipo(reg.tipo) + " · " + v8Hm(Number(reg.minutos) || 0) + " guardado", () => {
            const antes = estado.registros;
            if (!antes.some(r => r.id === reg.id)) return;
            estado.registros = antes.filter(r => r.id !== reg.id);
            if (!guardarRegistros()) { estado.registros = antes; avisoV202("No se pudo deshacer."); return; }
            const c = $("confirmacionRegistroV203"); if (c) c.hidden = true;
            actualizarTodaLaInterfaz(); avisoV202("Registro deshecho");
          });
        } catch (e) { console.warn("[V27641] deshacer", e); }
      }, 60);
    });
  }

  /* 32 · V27641 · Habituales: salidas típicas que se registran con un toque (ajuste del dispositivo, no entra en las copias) */
  function hbLeer() {
    let a = []; try { a = JSON.parse(localStorage.getItem(HB_K) || "[]"); } catch (e) { a = []; }
    return (Array.isArray(a) ? a : []).filter(h => h && RV_TIPOS.includes(h.tipo) && Number(h.min) > 0 && Number(h.min) <= 1440).slice(0, 6)
      .map(h => ({ id: String(h.id || h.tipo + h.min), tipo: h.tipo, min: Math.round(Number(h.min)), companero: String(h.companero || "").slice(0, 60) }));
  }
  function hbGuardar(a) { try { localStorage.setItem(HB_K, JSON.stringify(a.slice(0, 6))); } catch (e) {} }
  function hbEtiqueta(h) { return nombreTipo(h.tipo) + " · " + v8Hm(h.min) + (h.companero ? " · " + h.companero : ""); }
  let hbEditando = false, hbUltimo = null;
  function hbPintar() {
    const vista = $("vista-registrar"); if (!vista) return;
    let s = $("habitualesV27641");
    if (!s) {
      s = document.createElement("section"); s.id = "habitualesV27641"; s.className = "habituales-v27641"; s.setAttribute("aria-label", "Habituales");
      const ref = $("avisoBorradorV260") || $("planRegistroV203"); if (!ref) return; ref.parentNode.insertBefore(s, ref);
      s.addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.hbEditar) { hbEditando = !hbEditando; hbPintar(); return; }
        const h = hbLeer().find(x => x.id === b.dataset.hbId); if (!h) return;
        if (b.dataset.hbQuitar) { hbGuardar(hbLeer().filter(x => x.id !== h.id)); hbPintar(); avisoV202("Habitual quitado: " + hbEtiqueta(h), () => { hbGuardar([...hbLeer(), h]); hbPintar(); }); return; }
        if (hbEditando) return;
        qrGuardar(h.tipo, h.min, h.companero);
      });
    }
    const a = hbLeer(); s.hidden = !a.length; if (!a.length) { s.textContent = ""; hbEditando = false; return; }
    const html = '<div class="hb-cab"><b>Habituales</b><button type="button" data-hb-editar="1">' + (hbEditando ? "Listo" : "Editar") + '</button></div><div class="hb-lista">' +
      a.map(h => '<span class="hb-item" data-tipo="' + rvEsc(h.tipo) + '"><button type="button" class="hb-chip" data-hb-id="' + rvEsc(h.id) + '"' + (hbEditando ? ' tabindex="-1"' : '') + '>' + rvEsc(hbEtiqueta(h)) + '</button>' + (hbEditando ? '<button type="button" class="hb-x" data-hb-quitar="1" data-hb-id="' + rvEsc(h.id) + '" aria-label="Quitar ' + rvEsc(hbEtiqueta(h)) + '">×</button>' : '') + '</span>').join("") + '</div>';
    if (s.__html !== html) { s.innerHTML = html; s.__html = html; }
  }
  function hbInstalar() {
    hbPintar();
    window.addEventListener("miServicio:registroGuardadoV188", ev => {
      const r = ev && ev.detail && ev.detail.registro; if (!r || r.creadoEn !== r.modificadoEn) return; hbUltimo = r;
      const c = $("confirmacionRegistroV203"); if (!c) return;
      let b = $("hbGuardarV27641");
      if (!b) { b = document.createElement("button"); b.type = "button"; b.id = "hbGuardarV27641"; b.className = "boton-secundario"; c.appendChild(b);
        b.addEventListener("click", () => {
          const r2 = hbUltimo; if (!r2) return; const a = hbLeer(), min = Math.round(Number(r2.minutos)), comp = String(r2.companero || "").trim().slice(0, 60);
          if (a.some(x => x.tipo === r2.tipo && x.min === min && x.companero === comp)) { avisoV202("Ya está en Habituales"); return; }
          if (a.length >= 6) { avisoV202("Ya tienes 6 habituales. Quita alguno para añadir otro."); return; }
          a.push({ id: "h" + Date.now().toString(36), tipo: r2.tipo, min, companero: comp }); hbGuardar(a); hbPintar();
          b.textContent = "✓ Guardado en Habituales"; b.disabled = true;
        });
      }
      const min = Math.round(Number(r.minutos)), comp = String(r.companero || "").trim();
      const ya = hbLeer().some(x => x.tipo === r.tipo && x.min === min && x.companero === comp);
      b.disabled = ya; b.textContent = ya ? "✓ Ya está en Habituales" : "☆ Guardar como habitual";
    });
  }

  /* 34 · V27643 · Aviso diario con la app cerrada: un evento repetido con alarma para la app Calendario (.ics) */
  function acHora(v) { const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(v || "").trim()); return m ? m[0] : "21:30"; }
  function acEsc(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function acPlegar(l) { const o = []; while (l.length > 73) { o.push(l.slice(0, 73)); l = " " + l.slice(73); } o.push(l); return o.join("\r\n"); }
  function acICS(hora, ahora) {
    const d = ahora || new Date(), p = n => String(n).padStart(2, "0"), [hh, mm] = acHora(hora).split(":").map(Number);
    const dia = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()), ini = dia + "T" + p(hh) + p(mm) + "00";
    const sello = d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + "T" + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + "Z";
    const url = location.origin + location.pathname.replace(/[^/]*$/, "");
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mi Servicio//Aviso diario//ES", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:aviso-diario-mi-servicio-v27643@" + (location.hostname || "mi-servicio"), "DTSTAMP:" + sello, "DTSTART:" + ini, "DURATION:PT5M", "RRULE:FREQ=DAILY",
      "SUMMARY:" + acEsc("¿Registraste hoy tu servicio?"), "DESCRIPTION:" + acEsc("Abre Mi Servicio y anota lo de hoy. " + url), "URL:" + url, "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + acEsc("¿Registraste hoy tu servicio?"), "TRIGGER:PT0M", "END:VALARM", "END:VEVENT", "END:VCALENDAR"];
    return L.map(acPlegar).join("\r\n") + "\r\n";
  }
  async function acEntregar(texto) {
    const blob = new Blob([texto], { type: "text/calendar;charset=utf-8" }), nombre = "aviso-mi-servicio.ics";
    try {
      const f = new File([blob], nombre, { type: "text/calendar" });
      if (navigator.canShare && navigator.canShare({ files: [f] }) && /iPhone|iPad|iPod/.test(navigator.userAgent)) { await navigator.share({ files: [f], title: "Aviso diario" }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = nombre; a.style.display = "none"; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 1500);
  }
  function acInstalar() {
    const i = $("acHoraV27643"), b = $("acBotonV27643"); if (!i || !b) return;
    try { i.value = acHora(localStorage.getItem("miServicio.avisoCalV27643") || i.value); } catch (e) {}
    i.addEventListener("change", () => { i.value = acHora(i.value); try { localStorage.setItem("miServicio.avisoCalV27643", i.value); } catch (e) {} });
    b.addEventListener("click", () => { i.value = acHora(i.value); try { localStorage.setItem("miServicio.avisoCalV27643", i.value); } catch (e) {} acEntregar(acICS(i.value)); avisoV202("Abre el archivo y pulsa «Añadir a Calendario»."); });
  }

  /* 35 · V27644 · Compañeros sugeridos (datalist) y «Tus días fuertes» (Estadísticas › Más) */
  function cnNombres(regs) {
    const mapa = new Map(), lista = (Array.isArray(regs) ? regs : []).filter(r => r && typeof r.companero === "string" && r.companero.trim())
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || String(b.creadoEn || "").localeCompare(String(a.creadoEn || "")));
    lista.forEach(r => {
      const txt = r.companero.trim().replace(/\s+/g, " "), k = txt.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("es");
      const e = mapa.get(k); if (e) e.n++; else mapa.set(k, { txt, n: 1, orden: mapa.size });
    });
    return [...mapa.values()].sort((a, b) => (b.n >= 2) - (a.n >= 2) || a.orden - b.orden).slice(0, 15).map(x => x.txt);
  }
  function cnPintar() {
    let dl = $("companerosV27644");
    if (!dl) {
      dl = document.createElement("datalist"); dl.id = "companerosV27644"; document.body.appendChild(dl);
      ["companeroRegistro", "editarCompanero"].forEach(id => { const i = $(id); if (i) i.setAttribute("list", "companerosV27644"); });
    }
    const n = cnNombres(typeof estado !== "undefined" ? estado.registros : []), firma = n.join("\u0001");
    if (dl.__f === firma) return; dl.__f = firma; dl.textContent = "";
    n.forEach(x => { const o = document.createElement("option"); o.value = x; dl.appendChild(o); });
  }
  const DF_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  function dfDatos(regs, hoy) {
    const fin = new Date((hoy || new Date()).getFullYear(), (hoy || new Date()).getMonth(), (hoy || new Date()).getDate(), 12), ini = new Date(fin); ini.setDate(ini.getDate() - 83);
    const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"), a = iso(ini), b = iso(fin);
    const tot = Array(7).fill(0), ocurr = Array(7).fill(0), activos = new Set();
    for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) ocurr[(d.getDay() + 6) % 7]++;
    (Array.isArray(regs) ? regs : []).forEach(r => {
      const f = String(r && r.fecha || "").slice(0, 10), m = Number(r && (r.minutos ?? r.minutosTotales)); if (f < a || f > b || !(m > 0) || !rvFechaValida(f)) return;
      const [y, mo, d] = f.split("-").map(Number); tot[(new Date(y, mo - 1, d, 12).getDay() + 6) % 7] += m; activos.add(f);
    });
    const media = tot.map((t, i) => ocurr[i] ? t / ocurr[i] : 0), mx = Math.max(...media), mejor = mx > 0 ? media.indexOf(mx) : -1;
    return { media, mejor, activos: activos.size, mx };
  }
  function dfPintar() {
    const vista = $("vista-estadisticas"); if (!vista || !vista.classList.contains("activa")) return;
    let d = $("diasFuertesV27644");
    if (!d) {
      const ref = $("statsPeriodoV183"); if (!ref) return;
      d = document.createElement("details"); d.id = "diasFuertesV27644"; d.className = "stats-accordion-v183";
      d.innerHTML = '<summary><span class="stats-accordion-icono-v183">📅</span><span>Tus días fuertes</span><span class="stats-accordion-flecha-v183">›</span></summary><div class="stats-accordion-cuerpo-v183"><p class="df-resumen"></p><div class="df-barras"></div><p class="df-nota">Media por día de la semana en las últimas 12 semanas.</p></div>';
      ref.parentNode.insertBefore(d, ref.nextSibling); d.addEventListener("toggle", dfPintar);
    }
    const r = dfDatos(typeof estado !== "undefined" ? estado.registros : []), firma = JSON.stringify([r.media.map(x => Math.round(x)), r.mejor, r.activos]);
    if (d.__f === firma) return; d.__f = firma;
    d.querySelector(".df-resumen").textContent = r.activos < 3 ? "Registra unos días más y verás aquí tu patrón de la semana." : "Tu día más fuerte: " + DF_DIAS[r.mejor].toLowerCase() + " · media " + v8Hm(Math.round(r.media[r.mejor])) + ".";
    const cont = d.querySelector(".df-barras"); cont.textContent = "";
    r.media.forEach((m, i) => {
      const f = document.createElement("div"); f.className = "df-fila" + (i === r.mejor && r.activos >= 3 ? " df-mejor" : "");
      const l = document.createElement("span"); l.className = "df-dia"; l.textContent = DF_DIAS[i].slice(0, 3); l.title = DF_DIAS[i];
      const p = document.createElement("span"); p.className = "df-pista"; const i2 = document.createElement("i"); i2.style.width = (r.mx > 0 ? Math.max(m > 0 ? 4 : 0, Math.round(m / r.mx * 100)) : 0) + "%"; p.appendChild(i2);
      const v = document.createElement("span"); v.className = "df-valor"; v.textContent = m > 0 ? v8Hm(Math.round(m)) : "—";
      f.append(l, p, v); cont.appendChild(f);
    });
  }

  /* 36 · V27645 · Tamaño del texto (pequeño/normal/grande) y Modo concentración (Inicio mínimo). Solo preferencias de este dispositivo */
  const TX_OPC = { peq: 1, normal: 1, gra: 1 };
  function txLeer() { let v = "normal"; try { v = localStorage.getItem(TX_K) || "normal"; } catch (e) {} return TX_OPC[v] ? v : "normal"; }
  function coLeer() { try { return localStorage.getItem(CO_K) === "1"; } catch (e) { return false; } }
  function txAplicar() {
    const r = document.documentElement, v = txLeer();
    if (v === "normal") r.removeAttribute("data-texto-v27645"); else r.setAttribute("data-texto-v27645", v);
    r.toggleAttribute("data-concentracion-v27645", coLeer());
    if (typeof programarEncajeV260 === "function") programarEncajeV260(true);
  }
  function txInstalar() {
    txAplicar();
    const g = $("textoV27645"), c = $("concentracionV27645");
    const pintar = () => {
      if (g) g.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.txV27645 === txLeer())));
      if (c) c.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String((b.dataset.coV27645 === "si") === coLeer())));
    };
    if (g) g.addEventListener("click", e => { const b = e.target.closest("button[data-tx-v27645]"); if (!b || !TX_OPC[b.dataset.txV27645]) return; try { localStorage.setItem(TX_K, b.dataset.txV27645); } catch (x) {} txAplicar(); pintar(); });
    if (c) c.addEventListener("click", e => { const b = e.target.closest("button[data-co-v27645]"); if (!b) return; try { localStorage.setItem(CO_K, b.dataset.coV27645 === "si" ? "1" : "0"); } catch (x) {} txAplicar(); pintar(); });
    pintar();
  }

  /* 37 · V27646 · Pulido de Inicio (chip de sincronización corto, tarjeta del tiempo con dato real) y atajos en «Comparar dos meses» */
  function plPill() {
    const t = $("estadoConexionTextoV190"); if (!t) return;
    const s = t.textContent || ""; if (/^Al día · /.test(s)) t.textContent = s.replace(/^Al día · /, ""); else if (/^Sincronizando[^·]*· Sincronizado/.test(s)) t.textContent = s.replace(/^(Sincronizando[^·]*?)\s*· .*$/, "$1");
  }
  function plTiempo() {
    const tt = document.querySelector("#climaDetalleV260 .clima-titulo-v260"); if (!tt) return;
    const T = $("tiempoTemperatura"), D = $("tiempoDescripcion"), I = $("tiempoIcono"), sum = tt.parentNode, ico = sum && sum.querySelector("span[aria-hidden]");
    const temp = T && /\d/.test(T.textContent) ? T.textContent.trim() : "", desc = D ? D.textContent.trim() : "", ok = !!temp && !!desc && !/Consultando|Preparando/.test(desc);
    const txt = ok ? temp + " · " + desc : "El tiempo para salir";
    if (tt.textContent !== txt) tt.textContent = txt;
    const e = ok && I && I.textContent.trim() ? I.textContent.trim() : "☀";
    if (ico && ico.textContent !== e) ico.textContent = e;
  }
  function plMes(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  function cmAtajos() {
    const sel = document.querySelector("#compararMesesV202 .comparar-selectores-v202"); if (!sel || $("compararAtajosV27646")) return;
    const bar = document.createElement("div"); bar.id = "compararAtajosV27646"; bar.className = "comparar-atajos-v27646";
    bar.innerHTML = '<button type="button" data-cm="mes">Con el mes anterior</button><button type="button" data-cm="anio">Con el mismo mes del año pasado</button>';
    sel.parentNode.insertBefore(bar, sel);
    bar.addEventListener("click", e => {
      const b = e.target.closest("button[data-cm]"); if (!b) return;
      const A = $("compararMesAV202"), B = $("compararMesBV202"); if (!A || !B) return;
      const hoy = new Date(), act = new Date(hoy.getFullYear(), hoy.getMonth(), 1), ant = new Date(act);
      if (b.dataset.cm === "mes") ant.setMonth(ant.getMonth() - 1); else ant.setFullYear(ant.getFullYear() - 1);
      A.value = plMes(ant); B.value = plMes(act);
      A.dispatchEvent(new Event("change", { bubbles: true })); B.dispatchEvent(new Event("change", { bubbles: true }));
      bar.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    });
  }
  function plInstalar() {
    plPill(); plTiempo(); cmAtajos();
    const t = $("estadoConexionTextoV190"); if (t) new MutationObserver(plPill).observe(t, { childList: true, characterData: true, subtree: true });
    ["tiempoTemperatura", "tiempoDescripcion", "tiempoIcono"].forEach(id => { const e = $(id); if (e) new MutationObserver(plTiempo).observe(e, { childList: true, characterData: true, subtree: true }); });
    setInterval(() => { plPill(); plTiempo(); }, 5000);
  }

  /* 38 · V27647 · Secciones de la app que se pueden mostrar u ocultar (solo apariencia, no entra en las copias) y salida visible del modo concentración */
  const SC_K = "miServicio.seccionesV27647";
  const SC_LISTA = [
    { g: "Inicio", id: "fecha", t: "Barra de fecha", s: "#vista-inicio .inicio-resumen-grid, #vista-inicio .inicio-calendario-panel-wrap" },
    { g: "Inicio", id: "globos", t: "Globos de actividad", s: "#seccionGraficoInicio" },
    { g: "Inicio", id: "evento", t: "Próximo evento", s: ".evento-chip-v276" },
    { g: "Inicio", id: "objetivo", t: "Objetivo del mes", s: "#seccionObjetivoInicioV260" },
    { g: "Inicio", id: "personaje", t: "Personaje del objetivo", s: "#progresoPersonaje" },
    { g: "Inicio", id: "curiosidad", t: "Curiosidad del día", s: "#curiosidadV27655" },
    { g: "Inicio", id: "cierre", t: "Cierre previsto del mes", s: "#proyeccionV27633" },
    { g: "Inicio", id: "copia", t: "Recordatorio de copia", s: "#recordatorioCopiaInicio" },
    { g: "Inicio", id: "conexion", t: "Estado de conexión", s: "#estadoConexionV190" },
    { g: "Registrar", id: "hoy", t: "Resumen «Hoy llevas»", s: "#hoyLlevasV27629" },
    { g: "Registrar", id: "cronometro", t: "Cronómetro", s: "#cronometroV264" },
    { g: "Registrar", id: "frase", t: "Escríbelo o díctalo", s: "#frasesV27655" },
    { g: "Registrar", id: "habituales", t: "Registros habituales", s: "#habitualesV27641" },
    { g: "Historial", id: "calhist", t: "Calendario de actividad", s: "#calHistorialV27628" },
    { g: "Estadísticas", id: "anillos", t: "Anillos del resumen", s: "#seccionAnillosV269" },
    { g: "Estadísticas", id: "semanavis", t: "Esta semana", s: "#semanaVisualV193" },
    { g: "Estadísticas", id: "resmensual", t: "Resumen mensual", s: "#historialResumenV153" },
    { g: "Estadísticas", id: "anio", t: "Tu año en cifras", s: "#anioServicioV276" },
    { g: "Estadísticas", id: "vitrina", t: "Vitrina de insignias", s: "#vitrinaV27631" },
    { g: "Estadísticas", id: "metaanual", t: "Meta anual", s: "#metaDetalleV260" },
    { g: "Estadísticas", id: "logros", t: "Logros", s: "#logrosV267" },
    { g: "Estadísticas", id: "masdetalle", t: "Más detalle", s: "#statsPeriodoV183" },
    { g: "Estadísticas", id: "diasfuertes", t: "Tus días fuertes", s: "#diasFuertesV27644" },
    { g: "Estadísticas", id: "comparar", t: "Comparar dos meses", s: "#compararMesesV202" },
    { g: "Estadísticas", id: "evolucion", t: "Evolución", s: "#statsEvolucionV183" }
  ];
  function scLeer() {
    let o = []; try { o = JSON.parse(localStorage.getItem(SC_K) || "[]"); } catch (e) { o = []; }
    return Array.isArray(o) ? o.filter(x => SC_LISTA.some(i => i.id === x)) : [];
  }
  function scGuardar(l) { try { localStorage.setItem(SC_K, JSON.stringify(l)); } catch (e) {} }
  function scAplicar() {
    const o = scLeer(); let st = $("seccionesEstiloV27647");
    if (!st) { st = document.createElement("style"); st.id = "seccionesEstiloV27647"; document.head.appendChild(st); }
    const pre = "html body:not(#bta):not(#btb) ";
    st.textContent = SC_LISTA.filter(i => o.includes(i.id)).map(i => i.s.split(",").map(x => pre + x.trim()).join(", ") + "{display:none!important}").join("\n");
    if (typeof programarEncajeV260 === "function") programarEncajeV260(true);
  }
  function scSalirConcentracion() {
    if (!coLeer()) return;
    const b = document.querySelector('#concentracionV27645 [data-co-v27645="no"]');
    if (b) b.click(); else { try { localStorage.setItem(CO_K, "0"); } catch (e) {} txAplicar(); }
  }
  function scInstalar() {
    scAplicar();
    const cont = $("seccionesV27647");
    if (cont && !cont.children.length) {
      let g = "";
      SC_LISTA.forEach(i => {
        if (i.g !== g) { g = i.g; const h = document.createElement("p"); h.className = "sec-grupo-v27647"; h.textContent = g; cont.appendChild(h); }
        const l = document.createElement("label"); l.className = "fondo-clima-opcion-v260";
        const c = document.createElement("input"); c.type = "checkbox"; c.dataset.secV27647 = i.id;
        const s = document.createElement("span"); s.textContent = i.t; l.append(c, s); cont.appendChild(l);
      });
      const pintar = () => { const o = scLeer(); cont.querySelectorAll("input[data-sec-v27647]").forEach(c => { c.checked = !o.includes(c.dataset.secV27647); }); };
      pintar();
      cont.addEventListener("change", e => {
        const c = e.target.closest("input[data-sec-v27647]"); if (!c) return;
        const o = scLeer().filter(x => x !== c.dataset.secV27647); if (!c.checked) o.push(c.dataset.secV27647);
        scGuardar(o); scAplicar(); if (c.checked) scSalirConcentracion();
      });
      const todo = $("seccionesTodoV27647");
      if (todo) todo.addEventListener("click", () => { scRestablecer(false); });
    }
    const vi = $("vista-inicio");
    if (vi && !$("concentracionAvisoV27647")) {
      const b = document.createElement("button"); b.type = "button"; b.id = "concentracionAvisoV27647"; b.className = "concentracion-aviso-v27647";
      b.textContent = "Modo concentración activo · Mostrar todo";
      b.addEventListener("click", () => { scSalirConcentracion(); });
      const dlg = vi.querySelector("dialog"); if (dlg) vi.insertBefore(b, dlg); else vi.appendChild(b);
    }
  }

  /* 39 · V27648 · Ajustes › Personalizar compacto: cada bloque es una fila plegable con su valor actual; solo uno abierto a la vez */
  function ajValor(f) {
    const seg = f.querySelectorAll('.segmento-v264 button[aria-pressed="true"]');
    if (seg.length === 1) return seg[0].textContent.trim();
    const cb = f.querySelectorAll('input[type="checkbox"][data-ini-v27636],input[type="checkbox"][data-sec-v27647]');
    if (cb.length) return [...cb].filter(c => c.checked).length + " de " + cb.length;
    const a = f.querySelector('[aria-pressed="true"],[aria-checked="true"],input[type="radio"]:checked,.activo,.activa,.seleccionado');
    if (a) { const x = (a.getAttribute("aria-label") || a.textContent || a.value || "").replace(/\s+/g, " ").replace(/^Elegir /, "").trim(); if (x && x.length <= 26) return x; }
    return "";
  }
  function ajPintarValor(f) {
    const lg = f.querySelector(":scope > legend"); if (!lg) return;
    let v = lg.querySelector(".aj-valor-v27648"); if (!v) { v = document.createElement("span"); v.className = "aj-valor-v27648"; lg.appendChild(v); }
    const t = ajValor(f); if (v.textContent !== t) v.textContent = t;
  }
  function ajAlternar(f, abrir) {
    const lg = f.querySelector(":scope > legend"); if (!lg) return;
    if (abrir) [...(f.parentElement ? f.parentElement.children : [])].forEach(h => { if (h !== f && h.classList && h.classList.contains("aj-abierto-v27648")) { h.classList.remove("aj-abierto-v27648"); const l = h.querySelector(":scope > legend"); if (l) l.setAttribute("aria-expanded", "false"); } });
    f.classList.toggle("aj-abierto-v27648", abrir); lg.setAttribute("aria-expanded", String(abrir));
    if (abrir) ajPintarValor(f);
  }
  function ajInstalar() {
    const raiz = $("aparienciaV201"); if (!raiz) return;
    const todos = [...raiz.querySelectorAll("fieldset.selector-grafico-v260")];
    todos.forEach(f => {
      const lg = f.querySelector(":scope > legend"); if (!lg || f.classList.contains("aj-sub-v27648")) return;
      f.classList.add("aj-sub-v27648"); lg.setAttribute("role", "button"); lg.setAttribute("tabindex", "0"); lg.setAttribute("aria-expanded", "false");
      const alt = () => ajAlternar(f, !f.classList.contains("aj-abierto-v27648"));
      lg.addEventListener("click", alt);
      lg.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alt(); } });
      const refrescar = () => setTimeout(() => ajPintarValor(f), 60);
      f.addEventListener("click", refrescar); f.addEventListener("change", refrescar);
      ajPintarValor(f);
    });
    raiz.addEventListener("toggle", () => todos.forEach(ajPintarValor));
  }

  /* 40 · V27649 · Ajustes: orden por grupos, sin repeticiones, buscador, «Acerca de» y «Restablecer apariencia» */
  const AJX_G = [["cuenta", "Cuenta"], ["aspecto", "Aspecto"], ["datos", "Datos y sincronización"], ["ayuda", "Ayuda"]];
  function ajxNorm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
  function ajxPerfilDet() { const v = $("vista-ajustes"); return v ? v.querySelector("details.ajustes-acordeon-v179:not([id])") : null; }
  function ajxCrear() {
    const v = $("vista-ajustes"); if (!v) return;
    if (!$("buscarAjustesV27649")) {
      const d = document.createElement("div"); d.className = "aj-buscar-v27649";
      d.innerHTML = '<input type="search" id="buscarAjustesV27649" class="campo" placeholder="Buscar en Ajustes…" aria-label="Buscar en Ajustes" autocomplete="off" autocapitalize="off" spellcheck="false">';
      v.appendChild(d); d.querySelector("input").addEventListener("input", ajxFiltrar);
      const s = document.createElement("p"); s.id = "ajSinResultadosV27649"; s.className = "aj-sin-resultados-v27649"; s.hidden = true; s.textContent = "Nada coincide con esa búsqueda."; v.appendChild(s);
    }
    AJX_G.forEach(g => { if (!$("ajGrupo" + g[0] + "V27649")) { const p = document.createElement("p"); p.id = "ajGrupo" + g[0] + "V27649"; p.className = "aj-grupo-v27649"; p.textContent = g[1]; v.appendChild(p); } });
    if (!$("acercaV27649")) {
      const d = document.createElement("details"); d.id = "acercaV27649"; d.className = "ajustes-acordeon-v179 acerca-v27649";
      d.innerHTML = '<summary><span class="ajustes-acordeon-icono" aria-hidden="true">i</span><span class="ajustes-acordeon-titulo">Acerca de</span><small class="aj-resumen-v27629"></small><span class="ajustes-acordeon-flecha" aria-hidden="true">›</span></summary><div class="acerca-cuerpo-v27649"><p>Versión instalada: <b id="acercaVersionV27649"></b></p><button type="button" id="acercaBuscarV27649" class="boton-secundario">Buscar actualización</button><button type="button" id="acercaRecargarV27649" class="boton-guardar" hidden>Actualizar ahora</button><p id="acercaEstadoV27649" role="status" aria-live="polite"></p><small>El diagnóstico detallado está en «Sincronización y copias».</small></div>';
      v.appendChild(d);
      const ver = buildInstalada(); $("acercaVersionV27649").textContent = ver; d.querySelector(".aj-resumen-v27629").textContent = ver;
      $("acercaBuscarV27649").addEventListener("click", acBuscarAct);
      $("acercaRecargarV27649").addEventListener("click", () => { try { location.reload(); } catch (e) {} });
    }
    const cuerpo = document.querySelector("#aparienciaV201 .apariencia-cuerpo-v201");
    if (cuerpo && !$("restablecerAparienciaV27649")) {
      const d = document.createElement("div"); d.className = "aj-restablecer-v27649";
      d.innerHTML = '<button type="button" id="restablecerAparienciaV27649" class="boton-secundario">Restablecer apariencia</button><p class="ayuda-fondo-clima-v260">Devuelve el tamaño del texto, las secciones, las tarjetas de Inicio y el modo concentración a su valor original. No toca tus datos ni el tema de color.</p>';
      cuerpo.appendChild(d);
      $("restablecerAparienciaV27649").addEventListener("click", () => { if (window.confirm("¿Restablecer la apariencia? No borra ningún dato.")) scRestablecer(true); });
    }
    const od = $("oneDriveSeccionV260");
    if (od && !od.classList.contains("aj-compacto-v27649")) {
      od.classList.add("aj-compacto-v27649");
      const cab = od.querySelector(".onedrive-cabecera");
      if (cab) { cab.setAttribute("role", "button"); cab.setAttribute("tabindex", "0"); cab.setAttribute("aria-expanded", "false");
        const alt = () => { const ab = od.classList.toggle("aj-abierto-v27649"); cab.setAttribute("aria-expanded", String(ab)); };
        cab.addEventListener("click", alt); cab.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alt(); } }); }
    }
    const cab = $("perfilCabV27629");
    if (cab && !cab.dataset.ajx) {
      cab.dataset.ajx = "1";
      cab.addEventListener("click", e => { const d = ajxPerfilDet(); if (d && d.open) { e.stopImmediatePropagation(); d.open = false; cab.setAttribute("aria-expanded", "false"); } else cab.setAttribute("aria-expanded", "true"); }, true);
      cab.setAttribute("aria-expanded", "false");
    }
  }
  function ajxBloques() {
    const g = id => $(id), l = a => a.filter(Boolean);
    return [l([g("perfilCabV27629"), ajxPerfilDet()]), l([g("aparienciaV201")]), l([g("copiaFilaV27633"), g("seguridadDatosV260")]), l([g("etiquetasAjV27654")]), l([g("transferenciaAjV27655")]), l([g("atajosAjV27657")]), l([g("visitaAjV27659")]), l([g("sincronizacionDetalleV260")]), l([g("oneDriveSeccionV260")]), l([g("ayudaBreveV260")]), l([g("acercaV27649")])].filter(b => b.length);
  }
  function ajxOrdenar() {
    const v = $("vista-ajustes"); if (!v) return; ajxCrear();
    const G = id => $("ajGrupo" + id + "V27649"), B = ajxBloques();
    const por = e => B.find(b => b.includes(e)), pick = (...ids) => ids.map(i => $(i));
    const esp = [$("volverAjustesV260"), $("buscarAjustesV27649") && $("buscarAjustesV27649").parentNode, G("cuenta"), $("perfilCabV27629"), ajxPerfilDet(), G("aspecto"), $("aparienciaV201"), G("datos"), $("copiaFilaV27633"), $("seguridadDatosV260"), $("etiquetasAjV27654"), $("transferenciaAjV27655"), $("atajosAjV27657"), $("visitaAjV27659"), $("sincronizacionDetalleV260"), $("oneDriveSeccionV260"), G("ayuda"), $("ayudaBreveV260"), $("acercaV27649"), $("ajSinResultadosV27649")].filter(e => e && e.parentNode === v);
    const actual = [...v.children].filter(e => esp.includes(e));
    if (esp.every((e, i) => actual[i] === e)) return;
    esp.forEach(e => v.appendChild(e));
  }
  let ajxAbiertos = new Set();
  function ajxFiltrar() {
    const q = ajxNorm(($("buscarAjustesV27649") || {}).value), v = $("vista-ajustes"); if (!v) return;
    const FIL = "aj-filtrado-v27649", activo = q.length > 0;
    v.classList.toggle("aj-buscando-v27649", activo);
    let algo = false;
    ajxBloques().forEach(b => {
      const coincide = !activo || b.some(e => ajxNorm(e.textContent).includes(q));
      b.forEach(e => e.classList.toggle(FIL, !coincide));
      if (coincide) algo = true;
      b.forEach(e => { if (e.tagName === "DETAILS" && e.id !== "aparienciaV201") { if (activo && coincide) { if (!e.open) { e.open = true; ajxAbiertos.add(e); } } else if (ajxAbiertos.has(e)) { e.open = false; ajxAbiertos.delete(e); } } });
    });
    const ap = $("aparienciaV201");
    if (ap) {
      const fs = [...ap.querySelectorAll("fieldset.aj-sub-v27648")];
      fs.forEach(f => { const c = !activo || ajxNorm(f.textContent).includes(q); f.classList.toggle(FIL, !c); f.classList.toggle("aj-abierto-v27648", activo && c); const lg = f.querySelector(":scope > legend"); if (lg) lg.setAttribute("aria-expanded", String(activo && c)); });
      ap.querySelectorAll("details").forEach(d => { const hay = [...d.querySelectorAll("fieldset.aj-sub-v27648")].some(f => !f.classList.contains(FIL)); if (activo) { d.classList.toggle(FIL, !hay); if (hay && !d.open) { d.open = true; ajxAbiertos.add(d); } } else { d.classList.remove(FIL); if (ajxAbiertos.has(d)) { d.open = false; ajxAbiertos.delete(d); } } });
      if (activo) { const hay = fs.some(f => !f.classList.contains(FIL)); if (hay && !ap.open) { ap.open = true; ajxAbiertos.add(ap); } }
      else if (ajxAbiertos.has(ap)) { ap.open = false; ajxAbiertos.delete(ap); }
    }
    const pd = ajxPerfilDet(); if (pd && !activo && ajxAbiertos.has(pd)) { pd.open = false; ajxAbiertos.delete(pd); }
    const sr = $("ajSinResultadosV27649"); if (sr) sr.hidden = !(activo && !algo);
  }
  async function acBuscarAct() {
    const est = $("acercaEstadoV27649"), rec = $("acercaRecargarV27649"), inst = buildInstalada(); if (!est) return "sin-panel";
    if (rec) rec.hidden = true;
    est.textContent = "Comprobando…";
    if (!navigator.onLine) { est.textContent = "Sin conexión: no se puede comprobar ahora."; return "offline"; }
    let pub = null;
    try { const r = await fetch("./sw.js?v=" + Date.now(), { cache: "no-store" }); if (r.ok) { const t = await r.text(); pub = (t.match(/const BUILD\s*=\s*"([^"]+)"/) || [])[1] || null; } } catch (e) {}
    if (!pub) { est.textContent = "No se pudo comprobar. Inténtalo de nuevo con conexión."; return "error"; }
    if (pub === inst) { est.textContent = "Tienes la última versión (" + inst + ")."; return "igual"; }
    est.textContent = "Hay una versión nueva (" + pub + "). Descargándola…";
    try { const reg = navigator.serviceWorker ? await navigator.serviceWorker.getRegistration() : null; if (reg && reg.update) await reg.update(); } catch (e) {}
    est.textContent = "Hay una versión nueva (" + pub + "). Pulsa «Actualizar ahora»; si sigue la anterior, cierra la app y ábrela de nuevo.";
    if (rec) rec.hidden = false;
    return "nueva";
  }
  function scRestablecer(tambienTexto) {
    scGuardar([]); try { localStorage.setItem(INI_K, JSON.stringify({ semana: true, tiempo: true, frase: true })); } catch (e) {}
    if (tambienTexto) { try { localStorage.setItem(TX_K, "normal"); } catch (e) {} }
    scAplicar(); iniAplicar(); txAplicar();
    const g = $("inicioV27636"); if (g) g.querySelectorAll("input[data-ini-v27636]").forEach(i => { i.checked = true; });
    const c = $("seccionesV27647"); if (c) c.querySelectorAll("input[data-sec-v27647]").forEach(i => { i.checked = true; });
    if (tambienTexto) { const b = document.querySelector('#textoV27645 [data-tx-v27645="normal"]'); if (b) b.click(); }
    scSalirConcentracion();
    document.querySelectorAll("#aparienciaV201 fieldset.aj-sub-v27648").forEach(ajPintarValor);
  }
  function ajxInstalar() {
    ajxOrdenar();
    const v = $("vista-ajustes"); if (v) new MutationObserver(() => { ajxOrdenar(); }).observe(v, { childList: true });
    let n = 0; const t = setInterval(() => { ajxOrdenar(); if (++n > 12) clearInterval(t); }, 500);
  }

  /* 41 · V27650 · Historial: un solo botón «⋯» por registro (los botones reales siguen en el DOM y se activan desde el menú) */
  function mrMenu() { return document.getElementById("menuRegV27650"); }
  function mrCerrar() {
    const m = mrMenu();
    if (!m) return;
    const b = m._origen;
    m.remove();
    if (b) { b.setAttribute("aria-expanded", "false"); }
  }
  function mrAbrir(btn) {
    mrCerrar();
    const acc = btn.parentElement;
    const orig = {
      rep: acc.querySelector(".boton-repetir-v260"),
      edi: acc.querySelector(".boton-editar-registro"),
      bor: acc.querySelector(".boton-borrar")
    };
    const m = document.createElement("div");
    m.id = "menuRegV27650";
    m.setAttribute("role", "menu");
    m._origen = btn;
    const items = [["rep", "Repetir hoy", "↻"], ["edi", "Editar", "✎"], ["bor", "Eliminar", "🗑"]];
    items.forEach(([k, t, ic]) => {
      if (!orig[k]) return;
      const i = document.createElement("button");
      i.type = "button";
      i.setAttribute("role", "menuitem");
      i.dataset.mr = k;
      i.innerHTML = '<span aria-hidden="true">' + ic + "</span>" + t;
      i.addEventListener("click", (e) => {
        e.stopPropagation();
        mrCerrar();
        orig[k].click();
      });
      m.appendChild(i);
    });
    document.body.appendChild(m);
    btn.setAttribute("aria-expanded", "true");
    const r = btn.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let top = r.bottom + 6;
    if (top + h > vh - 12) top = Math.max(12, r.top - h - 6);
    m.style.top = Math.round(top) + "px";
    m.style.left = Math.round(Math.min(Math.max(12, r.right - w), vw - w - 12)) + "px";
    const p = m.querySelector("button");
    if (p) p.focus({ preventScroll: true });
  }
  let mrPend = false;
  function mrInyectar() {
    mrPend = false;
    etNotas();
    document.querySelectorAll("#vista-historial .registro-acciones").forEach((a) => {
      if (a.querySelector(".mas-v27650")) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mas-v27650";
      b.setAttribute("aria-haspopup", "menu");
      b.setAttribute("aria-expanded", "false");
      b.setAttribute("aria-label", "Más acciones");
      b.textContent = "⋯";
      a.appendChild(b);
    });
  }
  function mrInstalar() {
    const v = document.getElementById("vista-historial");
    if (!v || v.dataset.mrV27650) return;
    v.dataset.mrV27650 = "1";
    const pedir = () => { if (!mrPend) { mrPend = true; requestAnimationFrame(mrInyectar); } };
    new MutationObserver(pedir).observe(v, { childList: true, subtree: true });
    mrInyectar();
    document.addEventListener("click", (e) => {
      const b = e.target.closest?.(".mas-v27650");
      if (b) { e.preventDefault(); e.stopPropagation(); if (mrMenu() && mrMenu()._origen === b) mrCerrar(); else mrAbrir(b); return; }
      if (mrMenu() && !e.target.closest("#menuRegV27650")) mrCerrar();
    }, true);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && mrMenu()) { const o = mrMenu()._origen; mrCerrar(); o?.focus(); } });
    window.addEventListener("scroll", mrCerrar, true);
    window.addEventListener("resize", mrCerrar);
  }

  /* 42 · V27651 · Respaldo en IndexedDB, día de descanso de la racha y etiquetas en notas */
  const RB_N = "miServicioRespaldoV27651", RB_S = "copia", RB_IGN = "miServicio.idbIgnoradoV27651";
  const RB_CLAVES = { registros: "miServicio.registros", preferencias: "miServicio.preferencias", agenda: "miServicio.agendaSalidas" };
  function rbAbrir() {
    return new Promise((res, rej) => {
      try {
        if (!window.indexedDB) return rej(new Error("sin indexedDB"));
        const r = indexedDB.open(RB_N, 1);
        r.onupgradeneeded = () => { r.result.createObjectStore(RB_S); };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  }
  function rbLeer() {
    return rbAbrir().then((db) => new Promise((res, rej) => {
      const q = db.transaction(RB_S, "readonly").objectStore(RB_S).get("ultima");
      q.onsuccess = () => { db.close(); res(q.result || null); };
      q.onerror = () => { db.close(); rej(q.error); };
    }));
  }
  function rbEscribir(v) {
    return rbAbrir().then((db) => new Promise((res, rej) => {
      const tx = db.transaction(RB_S, "readwrite");
      tx.objectStore(RB_S).put(v, "ultima");
      tx.oncomplete = () => { db.close(); res(true); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    }));
  }
  function rbNumRegs(raw) { try { const a = JSON.parse(raw); return Array.isArray(a) ? a.length : 0; } catch (e) { return -1; } }
  let rbSig = "";
  function rbCopiar() {
    let raw;
    try { raw = { registros: localStorage.getItem(RB_CLAVES.registros), preferencias: localStorage.getItem(RB_CLAVES.preferencias), agenda: localStorage.getItem(RB_CLAVES.agenda) }; } catch (e) { return Promise.resolve(false); }
    const n = rbNumRegs(raw.registros);
    if (n < 1) return Promise.resolve(false); /* una copia vacía o ilegible nunca sustituye a la buena */
    const sig = (raw.registros || "") + "|" + (raw.preferencias || "") + "|" + (raw.agenda || "");
    if (sig === rbSig) return Promise.resolve(false);
    return rbEscribir({ t: new Date().toISOString(), n: n, d: raw }).then(() => { rbSig = sig; rbEstado(); return true; }).catch(() => false);
  }
  function rbFecha(t) { try { return new Date(t).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  function rbEstado() {
    const lista = $("listaCopiasInternasV266"); if (!lista || !lista.parentNode) return;
    let p = $("idbEstadoV27651");
    if (!p) { p = document.createElement("p"); p.id = "idbEstadoV27651"; p.className = "nota-v266"; lista.parentNode.insertBefore(p, lista.nextSibling); }
    rbLeer().then((c) => { p.textContent = c ? "Respaldo extra en el navegador: " + c.n + " registros · " + rbFecha(c.t) : "Respaldo extra en el navegador: aún sin crear."; }).catch(() => { p.textContent = "Respaldo extra en el navegador: no disponible en este modo."; });
  }
  function rbRestaurar(c) {
    try {
      Object.keys(RB_CLAVES).forEach((k) => { if (typeof c.d[k] === "string") localStorage.setItem(RB_CLAVES[k], c.d[k]); });
    } catch (e) { window.alert("No se pudo restaurar el respaldo. Tus datos no se han cambiado."); return; }
    location.reload();
  }
  function rbAviso() {
    let ls = null, mal = false;
    try { ls = localStorage.getItem(RB_CLAVES.registros); } catch (e) { mal = true; }
    const n = mal ? -1 : (ls === null ? 0 : rbNumRegs(ls));
    if (n > 0) return;
    rbLeer().then((c) => {
      if (!c || c.n < 1 || $("avisoIntegridadV266") || $("avisoIdbV27651")) return;
      let ign = ""; try { ign = localStorage.getItem(RB_IGN) || ""; } catch (e) {}
      if (ign === c.t) return;
      const caja = document.createElement("div");
      caja.id = "avisoIdbV27651"; caja.setAttribute("role", "alert");
      caja.innerHTML = '<strong>⚠️ No hay registros en este dispositivo, pero hay un respaldo del navegador.</strong><p>Respaldo del ' + rbFecha(c.t) + ' con ' + c.n + ' registros.</p><div class="acciones-v266"><button type="button" data-a="restaurar">Restaurar ese respaldo</button><button type="button" data-a="ignorar">Ignorar</button></div>';
      caja.addEventListener("click", (e) => {
        const a = e.target.closest("[data-a]"); if (!a) return;
        if (a.dataset.a === "restaurar") { if (window.confirm("Se restaurarán " + c.n + " registros del respaldo del " + rbFecha(c.t) + ". ¿Continuar?")) rbRestaurar(c); }
        else { try { localStorage.setItem(RB_IGN, c.t); } catch (er) {} caja.remove(); }
      });
      document.body.appendChild(caja);
    }).catch(() => {});
  }
  function rbInstalar() {
    setTimeout(rbAviso, 2500);
    setTimeout(() => { rbCopiar(); rbEstado(); }, 4000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") rbCopiar(); });
    window.addEventListener("pagehide", () => { rbCopiar(); });
    setInterval(rbCopiar, 60000);
    const v = $("vista-ajustes"); if (v) new MutationObserver(() => { if (!$("idbEstadoV27651")) rbEstado(); }).observe(v, { childList: true, subtree: true });
  }

  /* Día de descanso de la racha (clave de interfaz; no entra en las copias JSON) */
  const RD_K = "miServicio.descansoV27651";
  function rdLeer() { try { const a = JSON.parse(localStorage.getItem(RD_K) || "[]"); return Array.isArray(a) ? a.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6).slice(0, 2) : []; } catch (e) { return []; } }
  function rdPintar() {
    const g = $("descansoV27651"); if (!g) return;
    const s = rdLeer();
    g.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(s.includes(Number(b.dataset.rd)))));
    const n = $("descansoNotaV27651"); if (n) n.textContent = s.length >= 2 ? "Máximo 2 días de descanso a la semana." : "Un día marcado no rompe la racha si no registras actividad. Solo en este dispositivo.";
  }
  function rdInstalar() {
    const g = $("descansoV27651"); if (!g) return;
    g.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-rd]"); if (!b) return;
      const d = Number(b.dataset.rd); let s = rdLeer();
      if (s.includes(d)) s = s.filter((x) => x !== d); else if (s.length < 2) s.push(d); else { rdPintar(); return; }
      try { if (s.length) localStorage.setItem(RD_K, JSON.stringify(s)); else localStorage.removeItem(RD_K); } catch (er) {}
      rdPintar();
    });
    rdPintar();
  }

  /* Etiquetas #así en las notas: chips en Historial, filtro rápido y sugerencias en Registrar */
  const ET_RE = /#([\p{L}\p{N}_-]{2,24})/gu;
  function etNorm(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function etTop(max) {
    let regs = []; try { regs = JSON.parse(localStorage.getItem("miServicio.registros") || "[]"); } catch (e) {}
    const m = new Map();
    (Array.isArray(regs) ? regs : []).forEach((r) => { String((r && r.notas) || "").replace(ET_RE, (_, t) => { const k = etNorm(t); const o = m.get(k) || { t: t, n: 0 }; o.n++; m.set(k, o); return _; }); });
    return Array.from(m.values()).sort((a, b) => b.n - a.n || a.t.localeCompare(b.t)).slice(0, max);
  }
  function etBuscar(tag) {
    const i = $("buscarHistorialV260"); if (!i) return;
    i.value = "#" + tag; i.dispatchEvent(new Event("input", { bubbles: true }));
    const v = $("vista-historial"); if (v) v.scrollIntoView({ block: "start" });
  }
  function etNotas() {
    document.querySelectorAll("#vista-historial .registro-notas:not([data-et-v27651])").forEach((p) => {
      p.dataset.etV27651 = "1";
      const txt = p.textContent; if (!/#[\p{L}\p{N}_-]{2,24}/u.test(txt)) return;
      const f = document.createDocumentFragment(); let ult = 0;
      txt.replace(ET_RE, (m, t, off) => {
        if (off > ult) f.appendChild(document.createTextNode(txt.slice(ult, off)));
        const b = document.createElement("button"); b.type = "button"; b.className = "etq-v27651"; b.dataset.etq = t; b.textContent = "#" + t; b.setAttribute("aria-label", "Filtrar por " + t);
        f.appendChild(b); ult = off + m.length; return m;
      });
      if (ult < txt.length) f.appendChild(document.createTextNode(txt.slice(ult)));
      p.textContent = ""; p.appendChild(f);
    });
    const caja = $("etiquetasHistV27651"), ref = document.querySelector("#vista-historial .buscar-historial-v260");
    const top = etTop(8);
    if (!top.length) { if (caja) caja.remove(); }
    else if (ref) {
      const firma = top.map((x) => x.t + x.n).join("|");
      let c = caja;
      if (!c) { c = document.createElement("div"); c.id = "etiquetasHistV27651"; c.className = "etq-fila-v27651"; c.setAttribute("role", "group"); c.setAttribute("aria-label", "Etiquetas de tus notas"); ref.parentNode.insertBefore(c, ref.nextSibling); }
      if (c.dataset.f !== firma) { c.dataset.f = firma; c.textContent = ""; top.forEach((x) => { const b = document.createElement("button"); b.type = "button"; b.className = "etq-v27651"; b.dataset.etq = x.t; b.textContent = "#" + x.t; c.appendChild(b); }); }
    }
  }
  function etSugerencias() {
    const ta = $("notasRegistro"); if (!ta) return;
    let c = $("etiquetasRegV27651");
    const top = etTop(6);
    if (!top.length) { if (c) c.remove(); return; }
    if (!c) { c = document.createElement("div"); c.id = "etiquetasRegV27651"; c.className = "etq-fila-v27651"; c.setAttribute("role", "group"); c.setAttribute("aria-label", "Añadir etiqueta a la nota"); ta.parentNode.insertBefore(c, ta.nextSibling); }
    c.textContent = "";
    top.forEach((x) => { const b = document.createElement("button"); b.type = "button"; b.className = "etq-v27651"; b.dataset.add = x.t; b.textContent = "#" + x.t; c.appendChild(b); });
  }
  function etInstalar() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest?.(".etq-v27651"); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      if (b.dataset.add) {
        const ta = $("notasRegistro"); if (!ta) return;
        const tag = "#" + b.dataset.add;
        if (!new RegExp("(^|\\s)" + tag.replace(/[-]/g, "\\-") + "(\\s|$)", "i").test(ta.value)) { ta.value = (ta.value && !/\s$/.test(ta.value) ? ta.value + " " : ta.value) + tag + " "; ta.dispatchEvent(new Event("input", { bubbles: true })); }
        ta.focus();
      } else if (b.dataset.etq) etBuscar(b.dataset.etq);
    }, true);
    const ta = $("notasRegistro"); if (ta) ta.addEventListener("focus", etSugerencias);
    const vr = $("vista-registrar"); if (vr) new MutationObserver(() => { if (vr.classList.contains("activa") && !$("etiquetasRegV27651")) etSugerencias(); }).observe(vr, { attributes: true, attributeFilter: ["class"] });
    etSugerencias(); etNotas();
  }

  /* 43 · V27652 · El cielo de la tarjeta del personaje sigue el curso del día (sol/luna según la hora real) */
  function cdPintar() {
    const pp = $("progresoPersonaje"); if (!pp) return;
    let cielo = pp.querySelector(":scope>.cielo-dia-v27652");
    if (!cielo) {
      cielo = document.createElement("i"); cielo.className = "cielo-dia-v27652"; cielo.setAttribute("aria-hidden", "true");
      cielo.innerHTML = '<b class="cd-astro"></b><b class="cd-nube cd-n1"></b><b class="cd-nube cd-n2"></b>';
      pp.insertBefore(cielo, pp.firstChild);
    }
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60, s = ivSol(d), sale = s[0], pone = s[1];
    const f = ivFase();
    let p; /* 0..1 a lo largo del tramo en que el astro está sobre el horizonte */
    if (f === "noche") {
      const dur = 24 - pone + sale; p = (h >= pone ? h - pone : h + 24 - pone) / dur;
    } else { p = (h - sale) / (pone - sale); }
    p = Math.min(1, Math.max(0, p));
    const x = 8 + 84 * p, y = 78 - Math.sin(Math.PI * p) * 56; /* % de ancho y de alto */
    pp.dataset.cieloV27652 = f;
    pp.dataset.estacionV27652 = cdEstacion(d);
    if (!cielo.querySelector(".cd-est")) cielo.insertAdjacentHTML("beforeend", '<b class="cd-est cd-e1"></b><b class="cd-est cd-e2"></b><b class="cd-est cd-e3"></b>');
    cielo.style.setProperty("--cd-x", x.toFixed(1) + "%");
    cielo.style.setProperty("--cd-y", y.toFixed(1) + "%");
  }
  function cdInstalar() {
    cdPintar();
    setInterval(cdPintar, 300000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") cdPintar(); });
    const v = $("vista-inicio"); if (v) new MutationObserver(() => { const pp = $("progresoPersonaje"); if (pp && !pp.querySelector(":scope>.cielo-dia-v27652")) cdPintar(); }).observe(v, { childList: true, subtree: true });
  }

  /* 44 · V27653 · Historial: selección múltiple y agrupar por semana · botones flotantes · números animados · estaciones */
  const AG_K = "miServicio.agrupHistV27653", LF_K = "miServicio.ladoFabV27653";
  const HS = { on: false, sel: new Set() };
  function agLeer() { try { return localStorage.getItem(AG_K) === "semana" ? "semana" : "dia"; } catch (e) { return "dia"; } }
  function agAplicar(m) {
    const v = $("vista-historial"); if (v) v.dataset.agrupV27653 = m;
    document.querySelectorAll("#herramientasHistV27653 [data-agr]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.agr === m)));
  }
  function hsNombres() {
    const o = document.querySelector("[data-nombre-otras-v260]");
    return { ministerio: "Ministerio", ldc: "LDC", asambleas: "Asambleas", otras: (o && o.textContent.trim()) || "Otras" };
  }
  function hsBarra() { return $("barraSelV27653"); }
  function hsContar() {
    const b = hsBarra(); if (!b) return;
    const n = HS.sel.size;
    b.querySelector(".hs-cuenta").textContent = n === 0 ? "Toca los registros" : n === 1 ? "1 seleccionado" : n + " seleccionados";
    b.querySelectorAll('[data-hs="act"],[data-hs="del"]').forEach((x) => { x.disabled = n === 0; });
  }
  function hsPintar() {
    const v = $("vista-historial"); if (!v) return;
    v.querySelectorAll(".registro-card").forEach((c) => {
      let k = c.querySelector(":scope>.sel-v27653");
      if (!HS.on) { if (k) k.remove(); c.classList.remove("sel-marcado-v27653"); return; }
      if (!k) { k = document.createElement("span"); k.className = "sel-v27653"; k.setAttribute("aria-hidden", "true"); c.insertBefore(k, c.firstChild); }
      c.classList.toggle("sel-marcado-v27653", HS.sel.has(c.dataset.registroId));
    });
  }
  function hsCerrarMenu() { const m = $("menuActV27653"); if (m) m.remove(); }
  function hsSalir() {
    HS.on = false; HS.sel.clear(); hsCerrarMenu();
    const v = $("vista-historial"); if (v) v.removeAttribute("data-sel-v27653");
    const b = hsBarra(); if (b) b.remove();
    const s = $("selBtnV27653"); if (s) { s.setAttribute("aria-pressed", "false"); s.textContent = "Seleccionar"; }
    hsPintar();
  }
  function hsEntrar() {
    HS.on = true; HS.sel.clear();
    const v = $("vista-historial"); if (v) v.setAttribute("data-sel-v27653", "1");
    const s = $("selBtnV27653"); if (s) { s.setAttribute("aria-pressed", "true"); s.textContent = "Listo"; }
    const b = document.createElement("div"); b.id = "barraSelV27653"; b.setAttribute("role", "toolbar"); b.setAttribute("aria-label", "Acciones sobre los registros seleccionados");
    b.innerHTML = '<span class="hs-cuenta" aria-live="polite"></span><button type="button" data-hs="todo">Todo</button><button type="button" data-hs="act">Actividad</button><button type="button" data-hs="del" class="hs-peligro">Eliminar</button>';
    document.body.appendChild(b); hsContar(); hsPintar();
  }
  function hsActividad(btn) {
    hsCerrarMenu();
    if (!HS.sel.size) return;
    const nom = hsNombres();
    const m = document.createElement("div"); m.id = "menuActV27653"; m.setAttribute("role", "menu");
    Object.keys(nom).forEach((k) => { const i = document.createElement("button"); i.type = "button"; i.setAttribute("role", "menuitem"); i.dataset.tipo = k; i.textContent = nom[k]; m.appendChild(i); });
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect();
    m.style.left = Math.round(Math.min(Math.max(12, r.left), window.innerWidth - m.offsetWidth - 12)) + "px";
    m.style.top = Math.round(Math.max(12, r.top - m.offsetHeight - 8)) + "px";
    m.querySelector("button").focus({ preventScroll: true });
  }
  function hsCambiarTipo(tipo) {
    hsCerrarMenu();
    const ids = new Set(HS.sel); if (!ids.size) return;
    const antes = estado.registros, ahora = new Date().toISOString();
    let n = 0;
    estado.registros = antes.map((r) => {
      if (!ids.has(r.id) || r.tipo === tipo) return r;
      n++; return { ...r, tipo: tipo, modificadoEn: ahora, sincronizacion: { estado: "pendiente", ultimaSincronizacion: (r.sincronizacion && r.sincronizacion.ultimaSincronizacion) || null } };
    });
    if (!n) { estado.registros = antes; hsSalir(); return; }
    let ok = false; try { ok = guardarRegistros(); } catch (e) {}
    if (!ok) { estado.registros = antes; avisoV202("No se pudo cambiar la actividad. Los registros se conservan."); return; }
    hsSalir(); actualizarTodaLaInterfaz();
    avisoV202(n + (n === 1 ? " registro cambiado a " : " registros cambiados a ") + hsNombres()[tipo], () => {
      const act = estado.registros; estado.registros = antes;
      if (!guardarRegistros()) { estado.registros = act; avisoV202("No se pudo deshacer."); return; }
      actualizarTodaLaInterfaz(); avisoV202("Cambio deshecho");
    });
  }
  function hsEliminar() {
    const ids = new Set(HS.sel); if (!ids.size) return;
    if (!window.confirm("¿Eliminar " + ids.size + (ids.size === 1 ? " registro?" : " registros?") + " Podrás deshacerlo unos segundos y recuperarlos desde la papelera.")) return;
    const antes = estado.registros, eliminados = antes.filter((r) => ids.has(r.id));
    estado.registros = antes.filter((r) => !ids.has(r.id));
    let ok = false; try { ok = guardarRegistros(); } catch (e) {}
    if (!ok) { estado.registros = antes; avisoV202("No se pudo eliminar. Los registros se conservan."); return; }
    hsSalir(); ofrecerDeshacerV202(eliminados); actualizarTodaLaInterfaz();
  }
  /* Cabeceras de semana (solo se ven en la agrupación por semanas) */
  function agIso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function agSemana(f) { const d = new Date(f + "T12:00:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return agIso(d); }
  function agCorta(f) { const d = new Date(f + "T12:00:00"); return d.getDate() + " " + d.toLocaleDateString("es-ES", { month: "short" }).replace(".", ""); }
  function agPasada() {
    const mins = new Map(); (estado.registros || []).forEach((r) => mins.set(r.id, Number(r.minutos) || 0));
    document.querySelectorAll("#vista-historial .historial-mes-contenido-v260").forEach((cont) => {
      const sec = [...cont.querySelectorAll(":scope>section.grupo-historial")], grupos = new Map();
      sec.forEach((s) => {
        const c = s.querySelector(".registro-card"); if (!c) return;
        const f = c.dataset.registroFecha, k = agSemana(f), g = grupos.get(k) || { first: s, fechas: new Set(), min: 0 };
        g.fechas.add(f); s.querySelectorAll(".registro-card").forEach((x) => { g.min += mins.get(x.dataset.registroId) || 0; });
        grupos.set(k, g);
      });
      cont.querySelectorAll(":scope>.sem-cab-v27653").forEach((h) => { if (!grupos.has(h.dataset.k)) h.remove(); });
      grupos.forEach((g, k) => {
        let h = g.first.previousElementSibling;
        if (!h || !h.classList.contains("sem-cab-v27653") || h.dataset.k !== k) {
          h = document.createElement("div"); h.className = "sem-cab-v27653"; h.dataset.k = k; h.innerHTML = "<strong></strong><span></span>";
          g.first.parentNode.insertBefore(h, g.first);
        }
        const fs = [...g.fechas].sort(), t1 = fs.length === 1 ? agCorta(fs[0]) : agCorta(fs[0]) + " – " + agCorta(fs[fs.length - 1]);
        const t2 = formatearTiempo(g.min) + " · " + fs.length + (fs.length === 1 ? " día" : " días");
        const a = h.firstChild, b = h.lastChild;
        if (a.textContent !== "Semana " + t1) a.textContent = "Semana " + t1;
        if (b.textContent !== t2) b.textContent = t2;
      });
    });
  }
  let hsPend = false;
  function hsMut() { hsPend = false; hsPintar(); if (agLeer() === "semana") agPasada(); }
  function hsInstalar() {
    const v = $("vista-historial"), ref = v && v.querySelector(".accesos-historial-v260");
    if (!v || !ref || $("herramientasHistV27653")) return;
    const h = document.createElement("div"); h.id = "herramientasHistV27653"; h.className = "herr-hist-v27653";
    h.innerHTML = '<div class="agr-v27653" role="group" aria-label="Agrupar por"><button type="button" data-agr="dia" aria-pressed="true">Día</button><button type="button" data-agr="semana" aria-pressed="false">Semana</button></div><button type="button" id="selBtnV27653" aria-pressed="false">Seleccionar</button>';
    ref.insertAdjacentElement("afterend", h);
    agAplicar(agLeer());
    h.addEventListener("click", (e) => {
      const a = e.target.closest("[data-agr]");
      if (a) { try { localStorage.setItem(AG_K, a.dataset.agr); } catch (er) {} agAplicar(a.dataset.agr); if (a.dataset.agr === "semana") agPasada(); return; }
      if (e.target.closest("#selBtnV27653")) { if (HS.on) hsSalir(); else hsEntrar(); }
    });
    new MutationObserver(() => { if (!hsPend) { hsPend = true; requestAnimationFrame(hsMut); } }).observe(v, { childList: true, subtree: true });
    new MutationObserver(() => { if (!v.classList.contains("activa") && HS.on) hsSalir(); }).observe(v, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("click", (e) => {
      if (!HS.on) return;
      const m = e.target.closest("#menuActV27653 [data-tipo]");
      if (m) { e.stopPropagation(); hsCambiarTipo(m.dataset.tipo); return; }
      const b = e.target.closest("#barraSelV27653 [data-hs]");
      if (b) {
        e.stopPropagation();
        if (b.dataset.hs === "todo") { v.querySelectorAll(".registro-card").forEach((c) => HS.sel.add(c.dataset.registroId)); hsPintar(); hsContar(); }
        else if (b.dataset.hs === "act") hsActividad(b);
        else if (b.dataset.hs === "del") hsEliminar();
        return;
      }
      if (!e.target.closest("#menuActV27653")) hsCerrarMenu();
      const c = e.target.closest("#vista-historial .registro-card");
      if (c) { e.preventDefault(); e.stopPropagation(); const id = c.dataset.registroId; if (HS.sel.has(id)) HS.sel.delete(id); else HS.sel.add(id); hsPintar(); hsContar(); }
    }, true);
    ["touchstart", "touchmove", "touchend"].forEach((ev) => document.addEventListener(ev, (e) => { if (HS.on && e.target.closest && e.target.closest("#vista-historial .registro-card")) e.stopPropagation(); }, { capture: true, passive: true }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && HS.on) { if ($("menuActV27653")) hsCerrarMenu(); else hsSalir(); } });
    hsMut();
  }

  /* Botones flotantes de Registrar: lado elegido y aspecto translúcido */
  function lfLeer() { try { return localStorage.getItem(LF_K) === "izq" ? "izq" : "der"; } catch (e) { return "der"; } }
  function lfAplicar() {
    const l = lfLeer(); document.documentElement.setAttribute("data-lado-fab-v27653", l);
    document.querySelectorAll("#ladoFabV27653 [data-lado]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lado === l)));
  }
  function lfInstalar() {
    lfAplicar();
    const g = $("ladoFabV27653");
    if (g) g.addEventListener("click", (e) => { const b = e.target.closest("[data-lado]"); if (!b) return; try { if (b.dataset.lado === "izq") localStorage.setItem(LF_K, "izq"); else localStorage.removeItem(LF_K); } catch (er) {} lfAplicar(); });
    let t = 0;
    window.addEventListener("scroll", () => { document.documentElement.setAttribute("data-desplaza-v27653", "1"); clearTimeout(t); t = setTimeout(() => document.documentElement.removeAttribute("data-desplaza-v27653"), 450); }, { passive: true, capture: true });
  }

  /* Números que cuentan hasta su valor al abrir Inicio (una vez por sesión) */
  let cuHecho = false;
  function cuAnimar() {
    if (cuHecho) return; cuHecho = true;
    try { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; } catch (e) {}
    const els = [...document.querySelectorAll("#vista-inicio .tarjeta-grafico-inicio span, #vista-inicio .tarjeta-grafico-inicio b, #vista-inicio .tarjeta-grafico-inicio strong, #porcentajeObjetivo")]
      .filter((e) => e.children.length === 0 && /^\s*\d+(\s*(h|min|%))?(\s+\d+\s*min)?\s*$/.test(e.textContent) && Number(e.textContent.replace(/\D+/g, " ").trim().split(" ")[0]) > 0);
    if (!els.length) { cuHecho = false; return; }
    const info = els.map((e) => ({ e: e, fin: e.textContent, last: null }));
    const cero = (s, f) => s.replace(/\d+/g, (m) => String(Math.round(Number(m) * f)));
    const D = 700; let t0 = null;
    info.forEach((o) => { o.last = cero(o.fin, 0); o.e.textContent = o.last; });
    function paso(ts) {
      if (t0 === null) t0 = ts;
      const p = Math.min(1, (ts - t0) / D), f = 1 - Math.pow(1 - p, 3);
      info.forEach((o) => {
        if (o.parado) return;
        if (o.e.textContent !== o.last) { o.parado = true; return; } /* la app lo ha cambiado: no se toca más */
        o.last = p >= 1 ? o.fin : cero(o.fin, f); o.e.textContent = o.last;
      });
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }
  function cuInstalar() {
    const v = $("vista-inicio"); if (!v) return;
    const ir = () => { if (v.classList.contains("activa")) setTimeout(cuAnimar, 350); };
    ir(); new MutationObserver(ir).observe(v, { attributes: true, attributeFilter: ["class"] });
  }

  /* Estación del año en el cielo del personaje */
  function cdEstacion(d) {
    const m = d.getMonth() + 1, dia = d.getDate(), n = m * 100 + dia;
    return n >= 1221 || n < 320 ? "invierno" : n < 621 ? "primavera" : n < 922 ? "verano" : "otono";
  }

  /* 45 · V27654 · Gestor de etiquetas · tendencia de 12 meses · novedades · aviso de espacio */
  /* --- Gestor de etiquetas (Ajustes › Datos) --- */
  const EG_OK = /^[\p{L}\p{N}_-]{2,24}$/u;
  function egCrear() {
    const v = $("vista-ajustes"); if (!v || $("etiquetasAjV27654")) return;
    const d = document.createElement("details"); d.id = "etiquetasAjV27654"; d.className = "ajustes-acordeon-v179 etq-aj-v27654";
    d.innerHTML = '<summary><span class="ajustes-acordeon-icono" aria-hidden="true">#</span><span class="ajustes-acordeon-titulo">Etiquetas</span><small class="aj-resumen-v27629"></small><span class="ajustes-acordeon-flecha" aria-hidden="true">›</span></summary><div class="etq-cuerpo-v27654"><p class="etq-ayuda-v27654">Las etiquetas son las palabras con # que escribes en las notas. Aquí puedes renombrarlas, fusionarlas o quitarles la almohadilla en todos los registros a la vez. «Quitar» deja la palabra en la nota.</p><div id="listaEtiquetasV27654" role="list"></div></div>';
    v.appendChild(d);
    d.addEventListener("toggle", () => { if (d.open) egPintar(); });
    d.addEventListener("click", egClic);
    d.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches(".eg-campo")) { e.preventDefault(); const f = e.target.closest("[data-eg-fila]"); if (f) egGuardar(f); } else if (e.key === "Escape" && e.target.matches(".eg-campo")) { egPintar(); } });
    egResumen();
  }
  function egResumen() { const s = document.querySelector("#etiquetasAjV27654 .aj-resumen-v27629"); if (!s) return; const n = etTop(999).length; s.textContent = n === 0 ? "ninguna" : n === 1 ? "1 etiqueta" : n + " etiquetas"; }
  function egPintar(msg) {
    const l = $("listaEtiquetasV27654"); if (!l) return;
    const t = etTop(999); l.textContent = "";
    if (!t.length) { const p = document.createElement("p"); p.className = "etq-vacio-v27654"; p.textContent = "Todavía no hay etiquetas. Escribe #palabra en una nota para crear una."; l.appendChild(p); }
    t.forEach((x) => {
      const f = document.createElement("div"); f.className = "eg-fila-v27654"; f.setAttribute("role", "listitem"); f.dataset.egFila = etNorm(x.t); f.dataset.tag = x.t;
      f.innerHTML = '<span class="eg-nombre"></span><small class="eg-n"></small><button type="button" data-eg="ren">Renombrar</button><button type="button" data-eg="quit">Quitar</button>';
      f.querySelector(".eg-nombre").textContent = "#" + x.t; f.querySelector(".eg-n").textContent = x.n + (x.n === 1 ? " vez" : " veces");
      l.appendChild(f);
    });
    if (msg) { const p = document.createElement("p"); p.className = "etq-msg-v27654"; p.setAttribute("role", "status"); p.textContent = msg; l.appendChild(p); }
    egResumen();
  }
  function egClic(e) {
    const b = e.target.closest("[data-eg]"); if (!b) return;
    const f = b.closest("[data-eg-fila]"); if (!f) return;
    const a = b.dataset.eg;
    if (a === "ren") {
      f.innerHTML = '<input class="eg-campo campo" type="text" maxlength="25" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Nuevo nombre de la etiqueta"><button type="button" data-eg="ok">Guardar</button><button type="button" data-eg="no">Cancelar</button><small class="eg-error" role="alert"></small>';
      const i = f.querySelector("input"); i.value = "#" + f.dataset.tag; i.focus(); i.select();
    } else if (a === "no") egPintar();
    else if (a === "ok") egGuardar(f);
    else if (a === "quit") egAplicar(f.dataset.egFila, null, f.dataset.tag);
  }
  function egGuardar(f) {
    const i = f.querySelector(".eg-campo"), er = f.querySelector(".eg-error");
    const nuevo = String(i.value || "").trim().replace(/^#/, "");
    if (!EG_OK.test(nuevo)) { er.textContent = "Usa de 2 a 24 letras, números, - o _, sin espacios."; i.focus(); return; }
    if (etNorm(nuevo) === f.dataset.egFila && nuevo === f.dataset.tag) { egPintar(); return; }
    egAplicar(f.dataset.egFila, nuevo, f.dataset.tag);
  }
  function egAplicar(viejaNorm, nuevo, nombreViejo) {
    const antes = estado.registros, ahora = new Date().toISOString();
    const destinoExiste = nuevo && etTop(999).some((x) => etNorm(x.t) === etNorm(nuevo) && etNorm(x.t) !== viejaNorm);
    let n = 0;
    estado.registros = antes.map((r) => {
      const nt = String((r && r.notas) || ""); if (nt.indexOf("#") < 0) return r;
      let cambio = false;
      const out = nt.replace(ET_RE, (m, t) => { if (etNorm(t) !== viejaNorm) return m; cambio = true; return nuevo ? "#" + nuevo : t; });
      if (!cambio || out === nt) return r;
      n++; return { ...r, notas: out, modificadoEn: ahora, sincronizacion: { estado: "pendiente", ultimaSincronizacion: (r.sincronizacion && r.sincronizacion.ultimaSincronizacion) || null } };
    });
    if (!n) { estado.registros = antes; egPintar("No había nada que cambiar."); return; }
    let ok = false; try { ok = guardarRegistros(); } catch (er) {}
    if (!ok) { estado.registros = antes; egPintar("No se pudo guardar. Tus notas se conservan."); return; }
    try { actualizarTodaLaInterfaz(); } catch (er) {}
    const txt = nuevo ? (destinoExiste ? "#" + nombreViejo + " fusionada con #" + nuevo : "#" + nombreViejo + " renombrada a #" + nuevo) + " en " + n + (n === 1 ? " nota" : " notas") : "Quitada la almohadilla de #" + nombreViejo + " en " + n + (n === 1 ? " nota" : " notas");
    egPintar(txt);
    avisoV202(txt, () => {
      const act = estado.registros; estado.registros = antes;
      let ok2 = false; try { ok2 = guardarRegistros(); } catch (er) {}
      if (!ok2) { estado.registros = act; avisoV202("No se pudo deshacer."); return; }
      try { actualizarTodaLaInterfaz(); } catch (er) {} egPintar("Cambio deshecho"); avisoV202("Cambio deshecho");
    });
  }

  /* --- Tendencia de 12 meses (Estadísticas › Más) --- */
  const TD_M = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  function tdDatos() {
    const hoy = new Date(), out = [];
    for (let i = 11; i >= 0; i--) {
      const ref = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1); let min = 0;
      try { const r = resumenMesV143(ref); min = Number(r.computable != null ? r.computable : r.total) || 0; } catch (e) {}
      let ob = 0; try { ob = Number(omObjetivoDe(fechaISO(ref).slice(0, 7))) || 0; } catch (e) { ob = objetivo(); }
      out.push({ ref: ref, min: min, obj: ob, mes: ref.getMonth(), anio: ref.getFullYear() });
    }
    return out;
  }
  function tdCurva(P) {
    if (P.length < 2) return "";
    let d = "M" + P[0][0].toFixed(1) + " " + P[0][1].toFixed(1);
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      d += "C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }
  function tdNombre(x) { return MESES_L[x.mes].charAt(0).toUpperCase() + MESES_L[x.mes].slice(1) + " " + x.anio; }
  function tdPintar() {
    const c = $("tendencia12V27654"); if (!c) return;
    const D = tdDatos(), obj = D[11].obj, mx = Math.max(1, ...D.map((x) => x.obj), ...D.map((x) => x.min)) * 1.12;
    const W = 340, H = 150, pl = 10, pr = 10, pt = 14, pb = 24, aw = W - pl - pr, ah = H - pt - pb;
    const X = (i) => pl + (aw * i) / 11, Y = (m) => pt + ah - (ah * Math.min(m, mx)) / mx;
    const P = D.map((x, i) => [X(i), Y(x.min)]);
    const cv = tdCurva(P), area = cv + "L" + P[11][0].toFixed(1) + " " + (pt + ah) + "L" + P[0][0].toFixed(1) + " " + (pt + ah) + "Z";
    const total = D.reduce((a, x) => a + x.min, 0), activos = D.filter((x) => x.min > 0), media = activos.length ? total / activos.length : 0;
    const mejor = D.reduce((a, x) => (x.min > a.min ? x : a), D[0]);
    let s = '<svg viewBox="0 0 ' + W + " " + H + '" class="td-svg" aria-hidden="true" focusable="false"><defs><linearGradient id="tdGrad27654" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="td-s1"/><stop offset="1" class="td-s2"/></linearGradient></defs>';
    [0, .5, 1].forEach((f) => { const y = (pt + ah - ah * f).toFixed(1); s += '<line class="td-rej" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/>'; });
    if (D.some((x) => x.obj > 0)) {
      const hw = aw / 11 / 2; let dd = "", prev = null;
      D.forEach((x, i) => { if (!(x.obj > 0)) { prev = null; return; } const y = Y(x.obj).toFixed(1), x0 = Math.max(pl, X(i) - hw).toFixed(1), x1 = Math.min(W - pr, X(i) + hw).toFixed(1); dd += (prev === null ? "M" + x0 + " " + y : "L" + x0 + " " + y) + "L" + x1 + " " + y; prev = y; });
      s += '<path class="td-obj" d="' + dd + '" fill="none"/>';
      if (obj > 0) s += '<text class="td-etq td-etq-obj" x="' + (W - pr) + '" y="' + (Y(obj) - 4).toFixed(1) + '" text-anchor="end">objetivo ' + formatearTiempo(obj) + "</text>";
    }
    s += '<path class="td-area" d="' + area + '" fill="url(#tdGrad27654)"/><path class="td-linea" d="' + cv + '" fill="none"/>';
    D.forEach((x, i) => { s += '<text class="td-mes" x="' + X(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + TD_M[x.mes] + "</text>"; });
    D.forEach((x, i) => { s += '<circle class="td-punto' + (i === 11 ? " td-actual" : "") + '" cx="' + P[i][0].toFixed(1) + '" cy="' + P[i][1].toFixed(1) + '" r="' + (i === 11 ? 4.5 : 3) + '"/>'; });
    s += "</svg>";
    const puntos = D.map((x, i) => '<button type="button" class="td-toque" data-td="' + i + '" style="left:' + ((X(i) / W) * 100).toFixed(2) + '%" aria-label="' + tdNombre(x) + ": " + formatearTiempo(x.min) + '"></button>').join("");
    c.querySelector(".td-grafico").innerHTML = s + puntos;
    c.querySelector(".td-grafico").dataset.sel = "11";
    c.dataset.datos = JSON.stringify(D.map((x) => [tdNombre(x), x.min]));
    const resumen = total === 0 ? "Aún no hay horas registradas en los últimos 12 meses." : "Media " + formatearTiempo(Math.round(media)) + " al mes · mejor mes: " + MESES_L[mejor.mes] + " (" + formatearTiempo(mejor.min) + ")";
    c.querySelector(".td-resumen").textContent = resumen;
    c.querySelector(".td-detalle").textContent = tdNombre(D[11]) + " · " + formatearTiempo(D[11].min);
    c.querySelector(".td-grafico").setAttribute("role", "img");
    c.querySelector(".td-grafico").setAttribute("aria-label", "Horas que computan en los últimos 12 meses. " + D.map((x) => tdNombre(x) + " " + formatearTiempo(x.min)).join(", ") + (obj > 0 ? ". Objetivo mensual " + formatearTiempo(obj) : ""));
  }
  function tdInstalar() {
    const ref = $("statsEvolucionV183"); if (!ref || $("tendencia12V27654")) return;
    const d = document.createElement("details"); d.id = "tendencia12V27654"; d.className = "stats-accordion-v183 td-v27654"; d.open = true;
    d.innerHTML = '<summary><span class="stats-accordion-icono-v183">📈</span><span>Tendencia · 12 meses</span><span class="stats-accordion-flecha-v183">›</span></summary><div class="stats-accordion-cuerpo-v183"><article class="td-cuerpo"><p class="td-detalle" aria-live="polite"></p><div class="td-grafico"></div><p class="td-resumen"></p><small class="td-nota">Horas que computan cada mes. La línea discontinua es el objetivo que tenías cada mes.</small></article></div>';
    ref.insertAdjacentElement("afterend", d);
    d.addEventListener("click", (e) => { const b = e.target.closest(".td-toque"); if (!b) return; const D = JSON.parse(d.dataset.datos || "[]"), x = D[Number(b.dataset.td)]; if (x) d.querySelector(".td-detalle").textContent = x[0] + " · " + formatearTiempo(x[1]); });
    tdPintar();
    let pend = false; const re = () => { if (!pend) { pend = true; setTimeout(() => { pend = false; if (!d.contains(document.activeElement)) tdPintar(); }, 250); } };
    const v = $("vista-estadisticas"); if (v) { new MutationObserver((m) => { if (m.some((x) => x.type === "attributes" && x.attributeName === "data-seg-v264")) re(); }).observe(v, { attributes: true, attributeFilter: ["data-seg-v264"] }); }
    const rm = $("resumenMensualV143"); if (rm) new MutationObserver(re).observe(rm, { childList: true, subtree: true, characterData: true });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") re(); });
  }

  /* --- Novedades tras actualizar --- */
  const NV_K = "miServicio.novedadesVistoV27654";
  const NV_LINEAS = [
    ["⋯", "Historial", "Un solo botón «⋯» por registro, «Seleccionar» para actuar sobre varios y vista por semanas."],
    ["🔥", "Racha y notas", "Día de descanso que no rompe la racha y etiquetas #así con gestor en Ajustes."],
    ["🛟", "Tus datos", "Respaldo extra en el navegador y aviso cuando el espacio se acerca al límite."],
    ["📈", "Estadísticas", "Tendencia de 12 meses con tu objetivo, y el cielo del personaje que sigue la hora y la estación."]
  ];
  function nvCerrar(marcar) { const c = $("novedadesV27654"); if (c) c.remove(); if (marcar) { try { localStorage.setItem(NV_K, buildInstalada()); } catch (e) {} } }
  function nvMostrar(manual) {
    if ($("novedadesV27654")) return;
    const c = document.createElement("div"); c.id = "novedadesV27654"; c.setAttribute("role", "dialog"); c.setAttribute("aria-label", "Novedades de esta actualización");
    c.innerHTML = '<h3>Novedades de esta actualización</h3><ul>' + NV_LINEAS.map((l) => '<li><span aria-hidden="true">' + l[0] + '</span><div><b>' + l[1] + "</b><br>" + l[2] + "</div></li>").join("") + '</ul><button type="button" class="nv-ok boton-guardar">Entendido</button>';
    c.querySelector(".nv-ok").addEventListener("click", () => nvCerrar(true));
    c.addEventListener("keydown", (e) => { if (e.key === "Escape") nvCerrar(true); });
    document.body.appendChild(c); c.querySelector(".nv-ok").focus({ preventScroll: true });
  }
  function nvInstalar() {
    const verBtn = () => { const b = $("acercaNovedadesV27654"); if (b) return; const cuerpo = document.querySelector("#acercaV27649 .acerca-cuerpo-v27649"); if (!cuerpo) return; const n = document.createElement("button"); n.type = "button"; n.id = "acercaNovedadesV27654"; n.className = "boton-secundario"; n.textContent = "Ver novedades"; n.addEventListener("click", () => nvMostrar(true)); const ref = $("acercaBuscarV27649"); if (ref) ref.insertAdjacentElement("afterend", n); else cuerpo.appendChild(n); };
    verBtn(); const v = $("vista-ajustes"); if (v) new MutationObserver(verBtn).observe(v, { childList: true, subtree: true });
    setTimeout(() => {
      let visto = null; try { visto = localStorage.getItem(NV_K); } catch (e) {}
      const b = buildInstalada(); if (visto === b) return;
      if (!registros().length) { try { localStorage.setItem(NV_K, b); } catch (e) {} return; } /* instalación nueva: sin novedades que contar */
      if (navigator.webdriver && !window.__novedadesForzarV27654) return; /* los navegadores automatizados no ven cartas de novedades */
      if ($("avisoIdbV27651") || $("avisoIntegridadV266") || $("avisoEspacioV27654")) { setTimeout(() => nvMostrar(false), 6000); return; }
      nvMostrar(false);
    }, 3200);
  }

  /* --- Espacio de almacenamiento --- */
  const ES_LIM = 5 * 1024 * 1024;
  function esBytes() { let n = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); n += (k.length + (localStorage.getItem(k) || "").length) * 2; } } catch (e) {} return n; }
  function esMB(b) { return (b / 1048576).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " MB"; }
  function esTexto() { const b = esBytes(), p = Math.min(100, Math.round((b / ES_LIM) * 100)); return { b: b, p: p, t: "Espacio de datos: " + esMB(b) + " de unos 5 MB (" + p + " %)" + (p >= 80 ? " · casi lleno: haz una copia y limpia la papelera" : p >= 60 ? " · empieza a llenarse" : "") }; }
  function esEstado() {
    const lista = $("listaCopiasInternasV266"); if (!lista || !lista.parentNode) return;
    let p = $("espacioV27654");
    if (!p) { p = document.createElement("p"); p.id = "espacioV27654"; p.className = "nota-v266"; const ref = $("idbEstadoV27651") || lista; ref.parentNode.insertBefore(p, ref.nextSibling); }
    const e = esTexto(); p.textContent = e.t; p.dataset.nivel = e.p >= 80 ? "alto" : e.p >= 60 ? "medio" : "ok";
    if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then((x) => { if (x && x.usage) p.textContent = e.t + " · el navegador guarda en total " + esMB(x.usage); }).catch(() => {});
  }
  function esAviso() {
    const e = esTexto(); if (e.p < 80 || $("avisoEspacioV27654")) return;
    try { if (sessionStorage.getItem("miServicio.espacioAvisadoV27654")) return; } catch (er) {}
    const c = document.createElement("div"); c.id = "avisoEspacioV27654"; c.setAttribute("role", "alert");
    c.innerHTML = "<strong>El espacio de datos está al " + e.p + " %</strong><p>Haz una copia JSON y vacía la papelera para evitar que el navegador deje de guardar.</p><button type=\"button\">Entendido</button>";
    c.querySelector("button").addEventListener("click", () => { try { sessionStorage.setItem("miServicio.espacioAvisadoV27654", "1"); } catch (er) {} c.remove(); });
    document.body.appendChild(c);
  }
  function esInstalar() {
    setTimeout(() => { esEstado(); esAviso(); }, 3600);
    const v = $("vista-ajustes"); if (v) new MutationObserver(() => { if (!$("espacioV27654")) esEstado(); }).observe(v, { childList: true, subtree: true });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") esEstado(); });
  }

  /* 46 · V27655 · Registro por frase · cronómetro inmersivo · curiosidades · traspaso por QR animado */
  const FR_NUM = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12 };
  const FR_DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const FR_MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function frSin(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function frTitulo(s) { return s.split(/\s+/).map((w) => (w.toLowerCase() === "y" ? "y" : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(" "); }
  function frTipos() {
    const out = { ministerio: ["ministerio", "predicar", "predicacion", "salida", "casa en casa", "puerta en puerta", "revisita", "revisitas", "testimonio"], ldc: ["ldc"], asambleas: ["asamblea", "asambleas", "congreso"], otras: ["otra", "otras"] };
    try { if (typeof nombreActividad === "function") ["ministerio", "ldc", "asambleas", "otras"].forEach((t) => { const n = frSin(nombreActividad(t) || "").trim(); if (n && n.length > 1 && !out[t].includes(n)) out[t].push(n); }); } catch (e) {}
    return out;
  }
  /* Analiza una frase («ayer 1 h 30 ministerio con Marta #revisita») y devuelve lo que ha entendido; no toca nada. */
  function frAnalizar(texto, ahora) {
    const hoy = ahora instanceof Date ? ahora : new Date(), orig = String(texto || "").trim().replace(/\s+/g, " ");
    const r = { ok: false, fecha: null, fechaTxt: "", tipo: null, minutos: 0, companero: "", etiquetas: [], nota: "", futura: false, entendido: [] };
    if (!orig) return r;
    let t = " " + frSin(orig) + " ", resto = " " + orig + " ";
    const quitar = (re) => { const m = t.match(re); if (!m) return null; const i = m.index, n = m[0].length; t = t.slice(0, i) + " ".repeat(n) + t.slice(i + n); resto = resto.slice(0, i) + " ".repeat(n) + resto.slice(i + n); return m; };
    /* etiquetas */
    let m; const tagRe = /#[\p{L}\p{N}_]+/gu; (orig.match(tagRe) || []).forEach((x) => { if (!r.etiquetas.includes(x)) r.etiquetas.push(x); });
    while ((m = quitar(/#[a-z0-9_]+/))) { /* quitadas */ }
    /* fecha */
    let f = null, d0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12);
    const sumar = (n) => { const x = new Date(d0); x.setDate(x.getDate() + n); return x; };
    if ((m = quitar(/ (?:antes de ayer|anteayer|antier) /))) f = sumar(-2);
    else if ((m = quitar(/ ayer /))) f = sumar(-1);
    else if ((m = quitar(/ (?:manana|pasado manana) /))) f = sumar(m[0].includes("pasado") ? 2 : 1);
    else if ((m = quitar(/ hoy /))) f = sumar(0);
    else if ((m = quitar(/ (\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))? /))) { const dd = +m[1], mm = +m[2]; let yy = m[3] ? +m[3] : hoy.getFullYear(); if (yy < 100) yy += 2000; f = new Date(yy, mm - 1, dd, 12); if (f.getMonth() !== mm - 1) f = null; else if (!m[3] && f > d0) f = new Date(yy - 1, mm - 1, dd, 12); }
    else if ((m = quitar(new RegExp(" (?:el )?(\\d{1,2}) de (" + FR_MESES.join("|") + ")(?: de (\\d{4}))? ")))) { const dd = +m[1], mm = FR_MESES.indexOf(m[2]); let yy = m[3] ? +m[3] : hoy.getFullYear(); f = new Date(yy, mm, dd, 12); if (f.getMonth() !== mm) f = null; else if (!m[3] && f > d0) f = new Date(yy - 1, mm, dd, 12); }
    else if ((m = quitar(new RegExp(" (?:el |este |el pasado )?(" + FR_DIAS.join("|") + ") ")))) { const w = FR_DIAS.indexOf(m[1]); let dif = (d0.getDay() - w + 7) % 7; if (dif === 0) dif = 7; f = sumar(-dif); }
    if (f) { r.fecha = f; r.entendido.push("fecha"); } else { r.fecha = d0; }
    r.futura = r.fecha > d0;
    /* tiempo */
    let min = 0, hall = false;
    const nuevo = (re, fn) => { if (hall) return; const x = quitar(re); if (x) { min = fn(x); hall = true; } };
    const num = (s) => { s = String(s).replace(",", "."); return FR_NUM[s] !== undefined ? FR_NUM[s] : parseFloat(s); };
    const NW = "(\\d+(?:[.,]\\d+)?|" + Object.keys(FR_NUM).join("|") + ")";
    nuevo(new RegExp(" " + NW + " ?(?:h|hs|hr|hrs|hora|horas) ?(?:y )?(\\d{1,2}) ?(?:m|min|mins|minutos?)? "), (x) => Math.round(num(x[1]) * 60 + (+x[2])));
    nuevo(new RegExp(" " + NW + " (?:horas? )?y (media|cuarto) "), (x) => Math.round(num(x[1]) * 60 + (x[2] === "media" ? 30 : 15)));
    nuevo(/ (?:una )?hora y media /, () => 90);
    nuevo(/ (?:una )?hora y cuarto /, () => 75);
    nuevo(/ tres cuartos de hora /, () => 45);
    nuevo(/ media hora /, () => 30);
    nuevo(/ (?:un )?cuarto de hora /, () => 15);
    nuevo(/ (\d{1,2}):(\d{2}) /, (x) => (+x[1]) * 60 + (+x[2]));
    nuevo(new RegExp(" " + NW + " ?(?:h|hs|hr|hrs|hora|horas) "), (x) => Math.round(num(x[1]) * 60));
    nuevo(new RegExp(" " + NW + " ?(?:m|min|mins|minuto|minutos) "), (x) => Math.round(num(x[1])));
    if (hall && min > 0) { r.minutos = Math.min(24 * 60, min); r.entendido.push("tiempo"); }
    /* actividad */
    const tp = frTipos();
    for (const tipo of ["ldc", "asambleas", "otras", "ministerio"]) {
      if (r.tipo) break;
      for (const k of tp[tipo]) { const re = new RegExp(" " + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + " "); if (re.test(t)) { quitar(re); r.tipo = tipo; r.entendido.push("actividad"); break; } }
    }
    /* acompañante: «con Marta», «con Marta y Luis» */
    if ((m = t.match(/ con ((?:[a-zñ]+)(?: (?:y )?[a-zñ]+){0,2}) /))) {
      const ini = m.index, palabras = m[1].split(" "), stop = /^(ayer|hoy|anteayer|antier|\d+|h|hs|hora|horas|min|minutos?|ldc|ministerio|asamblea|asambleas|otra|otras|el|la|los|las|de|del|un|una|por|en|a|y)$/;
      let n = 0, rawIni = ini + 5; const out = [];
      for (let i = 0; i < palabras.length; i++) { const w = palabras[i]; if (w === "y") { if (i + 1 < palabras.length && !stop.test(palabras[i + 1]) && out.length) { out.push("y"); continue; } break; } if (stop.test(w) || FR_NUM[w] !== undefined) break; out.push(w); }
      while (out.length && out[out.length - 1] === "y") out.pop();
      if (out.length) { const largo = out.join(" ").length, ini2 = ini + 5; const crudo = resto.slice(ini2, ini2 + largo).trim(); r.companero = frTitulo(crudo || out.join(" ")); const lenTot = 5 + largo; t = t.slice(0, ini) + " ".repeat(lenTot) + t.slice(ini + lenTot); resto = resto.slice(0, ini) + " ".repeat(lenTot) + resto.slice(ini + lenTot); r.entendido.push("companero"); }
    }
    /* nota: lo que sobra, sin muletillas, + etiquetas */
    const relleno = new Set(["de", "el", "la", "los", "las", "un", "una", "y", "a", "al", "en", "con", "fui", "estuve", "hice", "sali", "salimos", "hicimos", "registra", "registrar", "apunta", "anota", "durante", "por", "me", "mi", "se"]);
    const sobra = resto.split(/\s+/).filter((w) => w && !relleno.has(frSin(w)) && /[\p{L}\p{N}]/u.test(w)).join(" ");
    r.nota = [sobra, r.etiquetas.join(" ")].filter(Boolean).join(" ").trim();
    r.ok = r.minutos > 0 && !r.futura;
    return r;
  }
  function frFechaTxt(d) { return DIAS_L[d.getDay()] + " " + d.getDate() + " de " + MESES_L[d.getMonth()]; }
  const DIAS_L = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  function frNombreTipo(t) { try { return typeof nombreActividad === "function" ? nombreActividad(t) : t; } catch (e) { return t; } }
  let FR_ULTIMO = null;
  function frPintar() {
    const inp = $("fraseCampoV27655"), vista = $("fraseVistaV27655"), btn = $("fraseRellenarV27655"); if (!inp || !vista) return;
    const txt = inp.value.trim();
    if (!txt) { vista.hidden = true; btn.disabled = true; FR_ULTIMO = null; return; }
    const r = frAnalizar(txt); FR_ULTIMO = r; vista.hidden = false;
    const actual = ($("tipoRegistro") && $("tipoRegistro").value) || "ministerio", tipo = r.tipo || actual;
    const fila = (k, v, ok) => '<li class="' + (ok ? "fr-ok" : "fr-falta") + '"><span>' + k + "</span><b>" + v + "</b></li>";
    let h = fila("Fecha", frFechaTxt(r.fecha) + (r.futura ? " · es futura" : r.entendido.includes("fecha") ? "" : " · hoy"), !r.futura);
    h += fila("Actividad", frNombreTipo(tipo) + (r.tipo ? "" : " · la que está elegida"), true);
    h += fila("Tiempo", r.minutos > 0 ? formatearTiempo(r.minutos) : "No he entendido el tiempo (ej. «1 h 30» o «90 min»)", r.minutos > 0);
    if (r.companero) h += fila("Con", r.companero, true);
    if (r.nota) h += fila("Nota", r.nota, true);
    vista.querySelector("ul").innerHTML = h; btn.disabled = !r.ok;
  }
  function frRellenar(rr) {
    const r = rr || FR_ULTIMO; if (!r || !r.ok) return;
    const tipo = r.tipo || ($("tipoRegistro") && $("tipoRegistro").value) || "ministerio";
    const b = document.querySelector('#formRegistro .actividad-boton[data-tipo="' + tipo + '"]'); if (b) b.click();
    const hoy = fechaISO(new Date()), ayer = (() => { const x = new Date(); x.setDate(x.getDate() - 1); return fechaISO(x); })(), f = fechaISO(r.fecha);
    const dia = f === hoy ? "hoy" : f === ayer ? "ayer" : "otra", bd = document.querySelector('#formRegistro [data-dia-v203="' + dia + '"]'); if (bd) bd.click();
    if (dia === "otra" && $("fechaRegistro")) { $("fechaRegistro").value = f; $("fechaRegistro").dispatchEvent(new Event("input", { bubbles: true })); $("fechaRegistro").dispatchEvent(new Event("change", { bubbles: true })); }
    $("horasRegistro").value = String(Math.floor(r.minutos / 60)); $("minutosRegistro").value = String(r.minutos % 60);
    $("minutosRegistro").dispatchEvent(new Event("input", { bubbles: true }));
    const det = $("detallesRegistroV203");
    if (r.companero && $("companeroRegistro")) { $("companeroRegistro").value = r.companero; $("companeroRegistro").dispatchEvent(new Event("input", { bubbles: true })); }
    if (r.nota && $("notasRegistro")) { $("notasRegistro").value = r.nota; $("notasRegistro").dispatchEvent(new Event("input", { bubbles: true })); }
    if (det && (r.companero || r.nota)) det.open = true;
    avisoV202("Registro preparado: " + formatearTiempo(r.minutos) + ". Revisa y guarda.");
    try { $("guardarRegistroV203").scrollIntoView({ block: "center", behavior: movReducido() ? "auto" : "smooth" }); } catch (e) {}
    $("fraseCampoV27655").value = ""; frPintar();
  }
  function frInstalar() {
    const ref = $("cronometroV264"); if (!ref || $("frasesV27655")) return;
    const s = document.createElement("section"); s.id = "frasesV27655"; s.className = "frase-v27655"; s.setAttribute("aria-label", "Registrar con una frase");
    s.innerHTML = '<label for="fraseCampoV27655"><span aria-hidden="true">💬</span> Escríbelo o díctalo</label><div class="fr-fila"><input id="fraseCampoV27655" type="text" inputmode="text" enterkeyhint="done" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Ej.: ayer 1 h 30 ministerio con Marta #revisita"></div><div id="fraseVistaV27655" class="fr-vista" hidden><ul></ul><button id="fraseRellenarV27655" type="button" class="boton-guardar" disabled>Rellenar el registro</button></div><small class="fr-ayuda">Pulsa el micrófono del teclado del iPhone para dictar. Se rellena el formulario y tú revisas y guardas.</small>';
    ref.insertAdjacentElement("afterend", s);
    $("fraseCampoV27655").addEventListener("input", frPintar);
    $("fraseCampoV27655").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); if (FR_ULTIMO && FR_ULTIMO.ok) frRellenar(); } });
    $("fraseRellenarV27655").addEventListener("click", () => frRellenar());
  }

  /* --- Pantalla pegada (wake lock) --- */
  const WL = { s: null, quiere: false };
  async function wlPedir() { WL.quiere = true; try { if (navigator.wakeLock && navigator.wakeLock.request && document.visibilityState === "visible" && !WL.s) { WL.s = await navigator.wakeLock.request("screen"); WL.s.addEventListener("release", () => { WL.s = null; wlEtq(); }); } } catch (e) { WL.s = null; } wlEtq(); }
  function wlSoltar() { WL.quiere = false; try { if (WL.s) WL.s.release(); } catch (e) {} WL.s = null; wlEtq(); }
  function wlEtq() { document.querySelectorAll("[data-wl-v27655]").forEach((el) => { el.textContent = WL.s ? "☀️ Pantalla encendida" : ""; }); }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && WL.quiere && !WL.s) wlPedir(); });

  /* --- Cronómetro inmersivo --- */
  const CI = { t: 0 };
  function ciEstado() { try { const o = JSON.parse(localStorage.getItem("miServicio.cronometroV264") || "null"); return o && o.inicio > 0 ? o : null; } catch (e) { return null; } }
  function ciPos() {
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60, s = ivSol(d), f = ivFase(); let p;
    if (f === "noche") { const dur = 24 - s[1] + s[0]; p = (h >= s[1] ? h - s[1] : h + 24 - s[1]) / dur; } else p = (h - s[0]) / (s[1] - s[0]);
    p = Math.min(1, Math.max(0, p)); return { f, x: 8 + 84 * p, y: 78 - Math.sin(Math.PI * p) * 56 };
  }
  function ciPintar() {
    const o = $("cronInmersivoV27655"); if (!o) return;
    const e = ciEstado(), P = ciPos(); o.dataset.fase = P.f; o.style.setProperty("--ci-x", P.x.toFixed(1) + "%"); o.style.setProperty("--ci-y", P.y.toFixed(1) + "%");
    const out = $("cronTiempoV264"), digitos = o.querySelector(".ci-digitos"), titulo = o.querySelector(".ci-titulo");
    digitos.textContent = out ? out.textContent : "0:00:00";
    let frac = 0, nom = "Cronómetro"; if (e) { const ms = Math.max(0, (e.pausado || Date.now()) - e.inicio - (Number(e.pausas) || 0)); frac = (ms % 3600000) / 3600000; try { nom = frNombreTipo(e.tipo); } catch (x) {} nom = (e.pausado ? "En pausa · " : "En curso · ") + nom; }
    titulo.textContent = nom; o.classList.toggle("ci-pausa", !!(e && e.pausado)); o.classList.toggle("ci-marcha", !!e);
    const C = 2 * Math.PI * 120; o.querySelector(".ci-arco").style.strokeDasharray = (C * frac).toFixed(1) + " " + C.toFixed(1);
    o.querySelector('[data-ci="iniciar"]').hidden = !!e; o.querySelector('[data-ci="pausa"]').hidden = !e; o.querySelector('[data-ci="terminar"]').hidden = !e;
    o.querySelector('[data-ci="pausa"]').textContent = e && e.pausado ? "▶ Reanudar" : "⏸ Pausar";
    if (e && !e.pausado) { if (!WL.s) wlPedir(); } else wlSoltar();
  }
  function ciCerrar() { const o = $("cronInmersivoV27655"); if (o) o.remove(); document.body.classList.remove("ci-abierto-v27655"); clearInterval(CI.t); CI.t = 0; wlSoltar(); }
  function ciAbrir() {
    if ($("cronInmersivoV27655")) return;
    const o = document.createElement("div"); o.id = "cronInmersivoV27655"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Cronómetro a pantalla completa");
    const animal = $("animalProgreso"), pj = animal ? animal.textContent.trim() : "🚶";
    o.innerHTML = '<i class="ci-astro" aria-hidden="true"></i><i class="ci-nube ci-n1" aria-hidden="true"></i><i class="ci-nube ci-n2" aria-hidden="true"></i><button type="button" class="ci-x" data-ci="cerrar" aria-label="Cerrar">✕</button><p class="ci-titulo"></p><div class="ci-anillo"><svg viewBox="0 0 260 260" aria-hidden="true"><circle class="ci-pista" cx="130" cy="130" r="120"/><circle class="ci-arco" cx="130" cy="130" r="120" transform="rotate(-90 130 130)"/></svg><div class="ci-centro"><span class="ci-pj" aria-hidden="true"></span><output class="ci-digitos" aria-live="off">0:00:00</output></div></div><small class="ci-wl" data-wl-v27655></small><div class="ci-acciones"><button type="button" data-ci="iniciar" class="boton-guardar">▶ Iniciar</button><button type="button" data-ci="pausa" class="boton-secundario" hidden>⏸ Pausar</button><button type="button" data-ci="terminar" class="boton-guardar ci-terminar" hidden>■ Terminar</button></div>';
    o.querySelector(".ci-pj").textContent = pj;
    document.body.appendChild(o); document.body.classList.add("ci-abierto-v27655");
    const clic = (id) => { const b = $(id); if (b) b.click(); };
    o.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-ci]"); if (!b) return; const a = b.dataset.ci;
      if (a === "cerrar") ciCerrar();
      else if (a === "iniciar") { clic("cronIniciarV264"); setTimeout(ciPintar, 30); }
      else if (a === "pausa") { clic("cronPausaV264"); setTimeout(ciPintar, 30); }
      else if (a === "terminar") { clic("cronTerminarV264"); ciCerrar(); }
    });
    o.addEventListener("keydown", (ev) => { if (ev.key === "Escape") ciCerrar(); });
    o.tabIndex = -1; o.focus({ preventScroll: true }); ciPintar(); CI.t = setInterval(ciPintar, 1000);
  }
  function ciInstalar() {
    const o = $("cronTiempoV264"); if (!o || o.dataset.ciV27655) return; o.dataset.ciV27655 = "1";
    o.setAttribute("role", "button"); o.tabIndex = 0; o.setAttribute("aria-label", "Cronómetro a pantalla completa"); o.classList.add("cron-pantalla-v27655");
    o.addEventListener("click", ciAbrir); o.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ciAbrir(); } });
  }

  /* --- Curiosidades de Inicio --- */
  function cuObservaciones() {
    const regs = registros(), hoy = new Date(), hoyS = fechaISO(hoy), out = [];
    const min = (r) => Math.max(0, Number(r.minutos) || 0), porDia = new Map();
    regs.forEach((r) => { const f = String(r.fecha).slice(0, 10); porDia.set(f, (porDia.get(f) || 0) + min(r)); });
    if (!porDia.size) return [["🌱", "Cuando registres tu primera actividad, aquí verás curiosidades sobre tu servicio."]];
    const total = [...porDia.values()].reduce((a, b) => a + b, 0), dias = [...porDia.keys()].sort(), ult = dias[dias.length - 1];
    const mesAct = hoyS.slice(0, 7), dd = hoy.getDate(), pm = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1, 12), mesPrev = fechaISO(pm).slice(0, 7);
    let a = 0, b = 0; porDia.forEach((v, f) => { if (f.startsWith(mesAct)) a += v; else if (f.startsWith(mesPrev) && +f.slice(8, 10) <= dd) b += v; });
    if (a > 0 && b > 0) out.push([a >= b ? "📈" : "📉", "Este mes llevas " + formatearTiempo(a) + (a > b ? ", " + formatearTiempo(a - b) + " más que el mes pasado a estas alturas." : a < b ? ", " + formatearTiempo(b - a) + " menos que el mes pasado a estas alturas." : ", justo lo mismo que el mes pasado a estas alturas.")]);
    const sem = [0, 0, 0, 0, 0, 0, 0], nsem = [0, 0, 0, 0, 0, 0, 0]; porDia.forEach((v, f) => { const w = deISO(f).getDay(); sem[w] += v; nsem[w]++; });
    if (porDia.size >= 8) { let w = 0; sem.forEach((v, i) => { if (v / Math.max(1, nsem[i]) > sem[w] / Math.max(1, nsem[w])) w = i; }); out.push(["⭐", "Tu día más fuerte es el " + DIAS_L[w] + ": de media " + formatearTiempo(Math.round(sem[w] / nsem[w])) + " ese día."]); }
    let racha = 0; { const c = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12); if (!porDia.has(fechaISO(c))) c.setDate(c.getDate() - 1); while (porDia.has(fechaISO(c))) { racha++; c.setDate(c.getDate() - 1); } }
    if (racha >= 2) out.push(["🔥", "Llevas " + racha + " días seguidos con actividad."]);
    const sin = Math.round((deISO(hoyS) - deISO(ult)) / 86400000); if (sin >= 3) out.push(["🌤️", "Hace " + sin + " días que no registras. Un ratito también cuenta."]);
    out.push(["⏳", "En total has registrado " + formatearTiempo(total) + " en " + porDia.size + (porDia.size === 1 ? " día." : " días.")]);
    let mj = null; porDia.forEach((v, f) => { if (!mj || v > mj[1]) mj = [f, v]; }); if (mj && porDia.size >= 5) { const d = deISO(mj[0]); out.push(["🏆", "Tu mejor día fue el " + d.getDate() + " de " + MESES_L[d.getMonth()] + " de " + d.getFullYear() + ": " + formatearTiempo(mj[1]) + "."]); }
    const cm = new Map(); regs.forEach((r) => { const n = String(r.companero || "").trim(); if (n) { const k = n.toLowerCase(); const x = cm.get(k) || { n, c: 0 }; x.c++; cm.set(k, x); } });
    let top = null; cm.forEach((x) => { if (!top || x.c > top.c) top = x; }); if (top && top.c >= 3) out.push(["🤝", "Has salido " + top.c + " veces con " + top.n + "."]);
    const lun = (() => { const x = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; })(), l0 = fechaISO(lun), l1 = (() => { const x = new Date(lun); x.setDate(x.getDate() - 7); return fechaISO(x); })();
    let sa = 0, sp = 0; porDia.forEach((v, f) => { if (f >= l0) sa += v; else if (f >= l1) sp += v; });
    if (sa > 0 && sp > 0) out.push(["🗓️", "Esta semana llevas " + formatearTiempo(sa) + "; la semana pasada fueron " + formatearTiempo(sp) + "."]);
    const delMes = [...porDia.entries()].filter(([f]) => f.startsWith(mesAct)); if (delMes.length >= 3) out.push(["⚖️", "Este mes, " + formatearTiempo(Math.round(a / delMes.length)) + " por día activo."]);
    return out;
  }
  const CU = { i: 0, t: 0, lista: [] };
  function cuPintar(avanzar) {
    const c = $("curiosidadV27655"); if (!c) return;
    if (!CU.lista.length || avanzar === "recalcular") { CU.lista = cuObservaciones(); const dia = Math.floor(Date.now() / 86400000); CU.i = CU.lista.length ? dia % CU.lista.length : 0; }
    else if (avanzar) CU.i = (CU.i + 1) % CU.lista.length;
    const o = CU.lista[CU.i] || ["✨", ""]; const tx = c.querySelector(".cu-texto");
    c.classList.remove("cu-entra"); void c.offsetWidth; c.querySelector(".cu-ico").textContent = o[0]; tx.textContent = o[1]; c.classList.add("cu-entra");
  }
  const CU_PRUEBA = {};
  function cuEncaje() {
    const c = $("curiosidadV27655"), ini = $("vista-inicio"); if (!c || !ini || !ini.classList.contains("activa")) return;
    const clave = Math.round(innerWidth) + "x" + Math.round(innerHeight);
    if (document.body.classList.contains("inicio-encajado-v260")) return;
    if (typeof bloqueoEncajeV260 === "undefined" || bloqueoEncajeV260 !== clave || CU_PRUEBA[clave]) return;
    CU_PRUEBA[clave] = 1; c.classList.add("cu-sinsitio-v27657"); programarEncajeV260(true);
    setTimeout(() => { if (!document.body.classList.contains("inicio-encajado-v260")) { c.classList.remove("cu-sinsitio-v27657"); } }, 900);
  }
  function cuInstalarCuriosidad() {
    const ref = $("seccionObjetivoInicioV260"); if (!ref || $("curiosidadV27655")) return;
    const s = document.createElement("section"); s.id = "curiosidadV27655"; s.className = "seccion curiosidad-v27655"; s.setAttribute("aria-label", "Curiosidad sobre tu servicio");
    s.innerHTML = '<button type="button" class="cu-boton" aria-label="Otra curiosidad"><span class="cu-ico" aria-hidden="true"></span><span class="cu-texto" aria-live="off"></span></button>';
    ref.insertAdjacentElement("afterend", s);
    s.querySelector(".cu-boton").addEventListener("click", () => { cuPintar(true); clearInterval(CU.t); CU.t = setInterval(() => { if (!document.hidden) cuPintar(true); }, 9000); });
    { let p = 0; const q = () => { if (!p) { p = 1; setTimeout(() => { p = 0; cuEncaje(); }, 450); } }; new MutationObserver(q).observe(document.body, { attributes: true, attributeFilter: ["class"] }); window.addEventListener("resize", q); }
    cuPintar("recalcular"); CU.t = setInterval(() => { if (!document.hidden) cuPintar(true); }, 9000);
    window.addEventListener("miServicio:registroGuardadoV188", () => setTimeout(() => cuPintar("recalcular"), 500));
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") cuPintar("recalcular"); });
  }

  /* --- Traspaso por QR animado (sin nube) --- */
  const QR = { gen: null, lector: null, frames: [], i: 0, t: 0, flujo: null, recib: null, raf: 0, video: null };
  function qrCargar(src, prueba) {
    if (prueba()) return Promise.resolve();
    return new Promise((ok, mal) => { const s = document.createElement("script"); s.src = src; s.onload = () => (prueba() ? ok() : mal(new Error("lib"))); s.onerror = () => mal(new Error("lib")); document.head.appendChild(s); });
  }
  const qrGenListo = () => qrCargar("./lib-qrgen.js", () => typeof window.qrcode === "function");
  const qrLecListo = () => qrCargar("./lib-jsqr.js", () => typeof window.jsQR === "function");
  const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return ((c ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0"); }
  function b64de(u8) { let s = ""; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); }
  function b64a(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  async function qrFlujo(entrada, modo) {
    const C = modo === "c" ? CompressionStream : DecompressionStream; if (typeof C === "undefined") throw new Error("sin compresion");
    const s = new C("deflate-raw"), w = s.writable.getWriter(); w.write(entrada); w.close();
    return new Uint8Array(await new Response(s.readable).arrayBuffer());
  }
  const QR_CH = 230;
  async function qrFramesDe(json) {
    let datos = new TextEncoder().encode(json), flag = "r";
    try { const z = await qrFlujo(datos, "c"); if (z.length < datos.length) { datos = z; flag = "z"; } } catch (e) {}
    const b64 = b64de(datos), crc = crc32(datos), id = Math.random().toString(36).slice(2, 6), n = Math.max(1, Math.ceil(b64.length / QR_CH)), fr = [];
    for (let i = 0; i < n; i++) fr.push(["MS1", id, i + 1, n, flag, crc, b64.slice(i * QR_CH, (i + 1) * QR_CH)].join("|"));
    return fr;
  }
  function qrDibujar(canvas, texto) {
    const q = window.qrcode(0, "L"); q.addData(texto); q.make();
    const n = q.getModuleCount(), quiet = 4, px = Math.max(3, Math.floor(Math.min(canvas.clientWidth || 300, 360) * (window.devicePixelRatio || 1) / (n + quiet * 2))), W = (n + quiet * 2) * px;
    canvas.width = W; canvas.height = W; const c = canvas.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, W, W); c.fillStyle = "#000";
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) c.fillRect((k + quiet) * px, (r + quiet) * px, px, px);
  }
  function qrPanel(html, clase) {
    qtCerrar(); const o = document.createElement("div"); o.id = "qrTransV27655"; o.className = clase || ""; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
    o.innerHTML = '<div class="qt-caja"><button type="button" class="qt-x" data-qt="cerrar" aria-label="Cerrar">✕</button>' + html + "</div>";
    document.body.appendChild(o); document.body.classList.add("qt-abierto-v27655");
    o.addEventListener("click", (e) => { const b = e.target.closest("[data-qt]"); if (!b) return; const a = b.dataset.qt; if (a === "cerrar") qtCerrar(); else if (a === "rapido") qrVel(-80); else if (a === "lento") qrVel(80); else if (a === "pausa") qrPausa(b); });
    o.addEventListener("keydown", (e) => { if (e.key === "Escape") qtCerrar(); });
    o.tabIndex = -1; o.focus({ preventScroll: true }); return o;
  }
  function qtCerrar() {
    clearInterval(QR.t); QR.t = 0; cancelAnimationFrame(QR.raf); QR.raf = 0; QR.frames = []; QR.recib = null; QR.pausado = false;
    if (QR.video && QR.video.srcObject) { try { QR.video.srcObject.getTracks().forEach((t) => t.stop()); } catch (e) {} QR.video.srcObject = null; }
    QR.video = null; const o = $("qrTransV27655"); if (o) o.remove(); document.body.classList.remove("qt-abierto-v27655"); wlSoltar();
  }
  QR.vel = 300;
  function qrVel(d) { QR.vel = Math.min(900, Math.max(120, QR.vel + d)); qrArrancarCiclo(); const e = document.querySelector("#qrTransV27655 .qt-vel"); if (e) e.textContent = (1000 / QR.vel).toFixed(1).replace(".", ",") + " imágenes/s"; }
  function qrPausa(b) { QR.pausado = !QR.pausado; b.textContent = QR.pausado ? "▶ Seguir" : "⏸ Pausar"; }
  function qrArrancarCiclo() {
    clearInterval(QR.t); const cv = document.querySelector("#qrTransV27655 canvas"), et = document.querySelector("#qrTransV27655 .qt-prog"); if (!cv) return;
    const paso = () => { if (QR.pausado || !QR.frames.length) return; qrDibujar(cv, QR.frames[QR.i]); if (et) et.textContent = "Imagen " + (QR.i + 1) + " de " + QR.frames.length; QR.i = (QR.i + 1) % QR.frames.length; };
    paso(); QR.t = setInterval(paso, QR.vel);
  }
  async function qrEnviar() {
    const o = qrPanel('<h3>Enviar mis datos</h3><p class="qt-ayuda">En el otro dispositivo abre <b>Ajustes › Pasar datos › Recibir</b> y apunta la cámara a esta pantalla. No hace falta internet.</p><canvas class="qt-canvas" aria-label="Código QR animado"></canvas><p class="qt-prog" role="status">Preparando…</p><div class="qt-fila"><button type="button" class="boton-secundario" data-qt="lento">Más lento</button><button type="button" class="boton-secundario" data-qt="pausa">⏸ Pausar</button><button type="button" class="boton-secundario" data-qt="rapido">Más rápido</button></div><small class="qt-vel">3,3 imágenes/s</small><small class="qt-wl" data-wl-v27655></small>', "qt-enviar");
    try {
      await qrGenListo();
      const json = JSON.stringify(crearDatosCopiaSeguridad()); QR.frames = await qrFramesDe(json); QR.i = 0; QR.pausado = false;
      if (!$("qrTransV27655")) return;
      const nt = o.querySelector(".qt-ayuda"); if (QR.frames.length > 400) nt.insertAdjacentHTML("afterend", '<p class="qt-aviso">Hay muchos datos (' + QR.frames.length + " imágenes). Tardará unos minutos; para un traspaso rápido usa la copia JSON.</p>");
      qrArrancarCiclo(); wlPedir();
    } catch (e) { const p = o.querySelector(".qt-prog"); if (p) p.textContent = "No se pudo preparar el código. Usa la copia de seguridad JSON."; }
  }
  /* Recibe un fotograma ya leído; devuelve {n, hay, listo, error}. Se usa desde la cámara y desde las pruebas. */
  function qrRecibirTexto(txt) {
    const p = String(txt).split("|"); if (p[0] !== "MS1" || p.length < 7) return null;
    const id = p[1], i = +p[2], n = +p[3]; if (!(i >= 1 && n >= 1 && i <= n && n < 5000)) return null;
    let R = QR.recib; if (!R || R.id !== id) { R = QR.recib = { id, n, flag: p[4], crc: p[5], partes: new Map(), fin: false }; }
    if (!R.partes.has(i)) R.partes.set(i, p.slice(6).join("|"));
    return { n: R.n, hay: R.partes.size, listo: R.partes.size === R.n };
  }
  async function qrTerminarRecepcion() {
    const R = QR.recib; if (!R || R.fin) return; R.fin = true;
    try {
      let s = ""; for (let i = 1; i <= R.n; i++) s += R.partes.get(i);
      let datos = b64a(s); if (crc32(datos) !== R.crc) throw new Error("crc");
      if (R.flag === "z") datos = await qrFlujo(datos, "d");
      const json = new TextDecoder().decode(datos), o = JSON.parse(json); if (!o || o.formato !== "mi-servicio-backup") throw new Error("formato");
      qtCerrar(); avisoV202("Datos recibidos. Revisa y confirma.");
      await importarCopiaSeguridad(new File([json], "Traspaso-QR.json", { type: "application/json" }));
    } catch (e) { const p = document.querySelector("#qrTransV27655 .qt-prog"); if (p) p.textContent = "Los datos recibidos no son válidos. Vuelve a intentarlo."; QR.recib = null; }
  }
  async function qrRecibir() {
    const o = qrPanel('<h3>Recibir datos</h3><p class="qt-ayuda">En el otro dispositivo abre <b>Ajustes › Pasar datos › Enviar</b> y apunta la cámara al código.</p><div class="qt-visor"><video playsinline muted></video><i class="qt-marco" aria-hidden="true"></i></div><div class="qt-barra"><i style="width:0%"></i></div><p class="qt-prog" role="status">Abriendo la cámara…</p>', "qt-recibir");
    try {
      await qrLecListo();
      const flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
      if (!$("qrTransV27655")) { flujo.getTracks().forEach((t) => t.stop()); return; }
      const v = o.querySelector("video"); QR.video = v; v.srcObject = flujo; await v.play().catch(() => {});
      const cv = document.createElement("canvas"), cx = cv.getContext("2d", { willReadFrequently: true }), prog = o.querySelector(".qt-prog"), barra = o.querySelector(".qt-barra i"); let ult = 0;
      prog.textContent = "Apunta al código…";
      const bucle = (ts) => {
        if (!$("qrTransV27655") || !QR.video) return;
        QR.raf = requestAnimationFrame(bucle);
        if (ts - ult < 80 || v.readyState < 2 || !v.videoWidth) return; ult = ts;
        const w = Math.min(720, v.videoWidth), h = Math.round(w * v.videoHeight / v.videoWidth); cv.width = w; cv.height = h; cx.drawImage(v, 0, 0, w, h);
        let r; try { r = window.jsQR(cx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" }); } catch (e) { r = null; }
        if (!r || !r.data) return; const x = qrRecibirTexto(r.data); if (!x) return;
        prog.textContent = "Recibidas " + x.hay + " de " + x.n; barra.style.width = Math.round(x.hay / x.n * 100) + "%";
        if (x.listo) { cancelAnimationFrame(QR.raf); qrTerminarRecepcion(); }
      };
      QR.raf = requestAnimationFrame(bucle); wlPedir();
    } catch (e) { const p = o.querySelector(".qt-prog"); if (p) p.textContent = "No se pudo abrir la cámara. Revisa el permiso de la cámara para esta página en los ajustes del dispositivo."; }
  }
  function qrCrearAjustes() {
    const v = $("vista-ajustes"); if (!v || $("transferenciaAjV27655")) return;
    const d = document.createElement("details"); d.id = "transferenciaAjV27655"; d.className = "ajustes-acordeon-v179 qt-aj-v27655";
    d.innerHTML = '<summary><span class="ajustes-acordeon-icono" aria-hidden="true">📲</span><span class="ajustes-acordeon-titulo">Pasar datos a otro dispositivo</span><small class="aj-resumen-v27629">sin nube</small><span class="ajustes-acordeon-flecha" aria-hidden="true">›</span></summary><div class="qt-cuerpo"><p class="ayuda-fondo-clima-v260">Pasa tus registros de iPhone a iPad (o al revés) con la cámara, sin internet ni cuentas. El dispositivo que recibe te enseñará un resumen antes de cambiar nada y guardará antes una copia de lo que tenía.</p><div class="qt-botones"><button type="button" id="qrEnviarV27655" class="boton-secundario">📤 Enviar</button><button type="button" id="qrRecibirV27655" class="boton-secundario">📥 Recibir</button></div></div>';
    v.appendChild(d);
    $("qrEnviarV27655").addEventListener("click", qrEnviar); $("qrRecibirV27655").addEventListener("click", qrRecibir);
  }

  function escInstalar() {
    const K = "miServicio.escenaTamanoV27656", sel = $("escenaTamanoV27656"); let v = "fondo"; try { v = localStorage.getItem(K) === "pequena" ? "pequena" : "fondo"; } catch (e) {}
    document.documentElement.dataset.escenaTamV27656 = v; if (!sel) return; sel.value = v;
    sel.addEventListener("change", () => { const n = sel.value === "pequena" ? "pequena" : "fondo"; document.documentElement.dataset.escenaTamV27656 = n; try { localStorage.setItem(K, n); } catch (e) {} });
  }
  function navMedir() { const n = document.querySelector("nav.barra-navegacion"); if (n) { const h = Math.round(n.getBoundingClientRect().height); if (h > 30) document.documentElement.style.setProperty("--nav-real-v27656", h + "px"); } }
  function wowInstalar() {
    escInstalar(); atCrearAjustes(); caInstalar(); esgInstalar(); setTimeout(atEjecutar, 900); navMedir(); window.addEventListener("resize", navMedir); window.addEventListener("orientationchange", () => setTimeout(navMedir, 300));
    frInstalar(); ciInstalar(); cuInstalarCuriosidad(); qrCrearAjustes(); vsCrearAjustes(); mdInstalar(); mcInstalar(); edInstalar();
    const re = () => { frInstalar(); ciInstalar(); cuInstalarCuriosidad(); qrCrearAjustes(); atCrearAjustes(); caInstalar(); vsCrearAjustes(); mcInstalar(); };
    let pend = false; new MutationObserver(() => { if (!pend) { pend = true; setTimeout(() => { pend = false; re(); }, 200); } }).observe(document.body, { childList: true, subtree: true });
  }
  window.MiServicioV27655 = { atAnalizar, atEjecutar, caDatos, caSvg, esgPintar, frAnalizar, qrFramesDe, qrRecibirTexto, qrTerminarRecepcion, crc32, cuObservaciones, ciAbrir, ciCerrar, qrEnviar, qrRecibir, qtCerrar };

  /* 47 · V27657 · Atajos de iPhone/Siri por enlace · camino del año de servicio · escena grande para cada personaje */
  const AT_BASE = () => location.origin + location.pathname;
  function atIr(vista) { const b = document.querySelector('.nav-item[data-vista="' + vista + '"]'); if (b) b.click(); }
  function atFecha(txt, ahora) {
    const hoy = ahora || new Date(), d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12); txt = String(txt || "hoy").toLowerCase();
    if (txt === "ayer") d.setDate(d.getDate() - 1); else if (txt === "anteayer") d.setDate(d.getDate() - 2);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(txt)) { const x = new Date(txt + "T12:00:00"); if (!isNaN(x)) return x; }
    return d;
  }
  /* Convierte los parámetros del enlace en un registro propuesto; nunca guarda por sí solo. */
  function atAnalizar(qs, ahora) {
    const p = qs instanceof URLSearchParams ? qs : new URLSearchParams(qs), accion = (p.get("accion") || "").toLowerCase();
    if (accion === "frase") { const r = frAnalizar(p.get("texto") || "", ahora); r.accion = accion; r.guardar = p.get("guardar") === "1"; return r; }
    if (accion !== "registrar") return { accion, ok: false };
    let min = Number(p.get("min")); if (!(min > 0)) min = (Number(p.get("h")) || 0) * 60 + (Number(p.get("m")) || 0);
    min = Math.min(24 * 60, Math.round(min));
    const tipos = ["ministerio", "ldc", "asambleas", "otras"], tp = (p.get("tipo") || "").toLowerCase(), f = atFecha(p.get("fecha"), ahora), hoy = ahora || new Date();
    const r = { accion, ok: false, minutos: min, tipo: tipos.includes(tp) ? tp : null, fecha: f, companero: String(p.get("con") || "").slice(0, 80), nota: String(p.get("nota") || "").slice(0, 400), etiquetas: [], futura: f > new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12), guardar: p.get("guardar") === "1", entendido: [] };
    r.ok = min > 0 && !r.futura; return r;
  }
  function atResumen(r) { return formatearTiempo(r.minutos) + " de " + frNombreTipo(r.tipo || ($("tipoRegistro") && $("tipoRegistro").value) || "ministerio") + " · " + frFechaTxt(r.fecha) + (r.companero ? " · con " + r.companero : ""); }
  function atHoja(r) {
    const old = $("atajoV27657"); if (old) old.remove();
    const o = document.createElement("div"); o.id = "atajoV27657"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Confirmar registro del atajo");
    o.innerHTML = '<div class="at-caja"><h3>¿Guardar este registro?</h3><p class="at-res"></p><div class="at-fila"><button type="button" data-at="guardar" class="boton-guardar">Guardar</button><button type="button" data-at="revisar" class="boton-secundario">Revisar</button><button type="button" data-at="cancelar" class="boton-secundario">Cancelar</button></div></div>';
    o.querySelector(".at-res").textContent = atResumen(r); document.body.appendChild(o);
    const cerrar = () => o.remove();
    o.addEventListener("click", (e) => { const b = e.target.closest("[data-at]"); if (!b) return; const a = b.dataset.at; cerrar(); if (a === "guardar") { frRellenar(r); setTimeout(() => { const g = $("guardarRegistroV203"); if (g) g.click(); }, 350); } else if (a === "revisar") frRellenar(r); });
    setTimeout(() => { const g = o.querySelector('[data-at="guardar"]'); if (g) g.focus(); }, 50);
  }
  function atEjecutar(ahora) {
    let p; try { p = new URLSearchParams(location.search); } catch (e) { return false; }
    const accion = (p.get("accion") || "").toLowerCase(); if (!accion) return false;
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
    if (accion === "visita" || accion === "widget") { atIr("inicio"); setTimeout(() => vsAbrir(accion), 400); return true; }
    if (accion === "cronometro") { atIr("registrar"); setTimeout(() => { if (!ciEstado()) { const b = $("cronIniciarV264"); if (b) b.click(); } if (p.get("pantalla") === "1") setTimeout(ciAbrir, 250); }, 500); return true; }
    if (["inicio", "historial", "estadisticas", "registrar"].includes(accion) && !p.get("min") && !p.get("h")) { atIr(accion); return true; }
    const r = atAnalizar(p, ahora); if (!r.ok) { atIr("registrar"); avisoV202("El enlace no traía un tiempo válido."); return true; }
    atIr("registrar");
    setTimeout(() => { if (r.guardar) atHoja(r); else frRellenar(r); }, 450); return true;
  }
  function atCrearAjustes() {
    const v = $("vista-ajustes"); if (!v || $("atajosAjV27657")) return;
    const base = AT_BASE(), ej = [["Registrar 1 hora de ministerio (pide confirmar)", base + "?accion=registrar&tipo=ministerio&min=60&guardar=1"], ["Registrar con una frase", base + "?accion=frase&guardar=1&texto=ayer%201%20h%2030%20ministerio"], ["Empezar el cronómetro a pantalla completa", base + "?accion=cronometro&pantalla=1"]];
    const d = document.createElement("details"); d.id = "atajosAjV27657"; d.className = "ajustes-acordeon-v179 at-aj-v27657";
    d.innerHTML = '<summary><span class="ajustes-acordeon-icono" aria-hidden="true">⚡️</span><span class="ajustes-acordeon-titulo">Atajos de iPhone y Siri</span><small class="aj-resumen-v27629">enlaces</small><span class="ajustes-acordeon-flecha" aria-hidden="true">›</span></summary><div class="at-cuerpo"><p class="ayuda-fondo-clima-v260">Con la app Atajos puedes crear un botón (o una orden para Siri) que abra Mi Servicio con un registro preparado. Siempre te pide confirmar o lo deja listo para revisar: nunca guarda sin que lo veas.</p><ol class="at-pasos"><li>Abre la app <b>Atajos</b> y crea un atajo nuevo.</li><li>Añade la acción <b>Abrir URL</b> y pega uno de estos enlaces.</li><li>Ponle un nombre (por ejemplo «Registrar una hora»): ese será lo que digas a Siri.</li></ol><div class="at-lista"></div><p class="ayuda-fondo-clima-v260 at-aviso"><b>Importante:</b> iOS puede abrir estos enlaces en Safari en vez de en el icono de la pantalla de inicio. Como Safari guarda sus datos aparte, tus registros no estarían ahí. Prueba el atajo una vez antes de fiarte; si abre Safari, no lo uses.</p></div>';
    const L = d.querySelector(".at-lista");
    ej.forEach(([t, u]) => { const f = document.createElement("div"); f.className = "at-item"; f.innerHTML = "<b></b><code></code><button type=\"button\" class=\"boton-secundario\">Copiar enlace</button>"; f.querySelector("b").textContent = t; f.querySelector("code").textContent = u; f.querySelector("button").addEventListener("click", async (ev) => { try { await navigator.clipboard.writeText(u); ev.target.textContent = "✓ Copiado"; } catch (e) { ev.target.textContent = "Mantén pulsado el enlace para copiarlo"; } setTimeout(() => { ev.target.textContent = "Copiar enlace"; }, 2500); }); L.appendChild(f); });
    v.appendChild(d);
  }

  /* --- Camino del año de servicio --- */
  const CA_X = [60, 170, 280];
  function caPos(i) { const fila = Math.floor(i / 3), c = i % 3; return [fila % 2 === 0 ? CA_X[c] : CA_X[2 - c], 78 + fila * 100]; }
  function caSeg(i) { // tramo del mes i al i+1 como curva cúbica
    const a = caPos(i), b = caPos(i + 1);
    if (Math.floor(i / 3) === Math.floor((i + 1) / 3)) return [a, [a[0] + (b[0] - a[0]) / 3, a[1]], [a[0] + 2 * (b[0] - a[0]) / 3, b[1]], b];
    const lado = Math.floor(i / 3) % 2 === 0 ? 1 : -1; return [a, [a[0] + 62 * lado, a[1]], [b[0] + 62 * lado, b[1]], b];
  }
  function caBez(S, t) { const u = 1 - t; return [0, 1].map((k) => u * u * u * S[0][k] + 3 * u * u * t * S[1][k] + 3 * u * t * t * S[2][k] + t * t * t * S[3][k]); }
  function caDatos(hoy) {
    hoy = hoy || new Date(); const fin = hoy.getMonth() >= 8 ? hoy.getFullYear() + 1 : hoy.getFullYear(), out = [];
    for (let i = 0; i < 12; i++) {
      const ref = new Date(fin - 1, 8 + i, 1, 12); let min = 0, obj = 0;
      try { const r = resumenMesV143(ref); min = Number(r.computable != null ? r.computable : r.total) || 0; } catch (e) {}
      try { obj = Number(omObjetivoDe(fechaISO(ref).slice(0, 7))) || 0; } catch (e) { obj = objetivo(); }
      const futuro = ref > new Date(hoy.getFullYear(), hoy.getMonth(), 1, 23), actual = ref.getFullYear() === hoy.getFullYear() && ref.getMonth() === hoy.getMonth();
      out.push({ ref, min, obj, futuro, actual, mes: ref.getMonth() });
    }
    return { fin, meses: out };
  }
  function caPersonajeSrc() { const i = document.querySelector("#progresoPersonaje img.personaje-cuerpo-img"); return i ? i.getAttribute("src") : ""; }
  function caSvg(D, hoy) {
    hoy = hoy || new Date(); const idxAct = D.meses.findIndex((m) => m.actual);
    const frac = idxAct < 0 ? (D.meses[0].futuro ? 0 : 11) : idxAct + (hoy.getDate() - 1) / new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const bandas = [["🍂", "#f2c48d", "#e8a35a"], ["❄️", "#cfe6fb", "#9cc4ee"], ["🌷", "#f9d3e3", "#f0a3c2"], ["☀️", "#fde9a6", "#f6cf55"]];
    let s = '<svg class="ca-svg" viewBox="0 0 340 450" role="img" aria-label="Camino del año de servicio">';
    bandas.forEach((b, f) => { s += '<rect x="0" y="' + (28 + f * 100) + '" width="340" height="100" fill="' + b[1] + '" class="ca-banda ca-b' + f + '"/><text x="' + (f % 2 === 0 ? 316 : 24) + '" y="' + (50 + f * 100) + '" class="ca-est" text-anchor="middle">' + b[0] + "</text>"; });
    for (let i = 0; i < 11; i++) { const S = caSeg(i), d = "M" + S[0] + " C" + S[1] + " " + S[2] + " " + S[3]; const hecho = i < Math.floor(frac) || (D.meses[i].min > 0 && !D.meses[i + 1].futuro); s += '<path d="' + d + '" pathLength="1" class="ca-seg ' + (i + 1 <= frac || hecho && i < Math.floor(frac) ? "ca-hecho" : "ca-fut") + '" style="--i:' + i + '"/>'; }
    D.meses.forEach((m, i) => {
      const p = caPos(i), r = m.obj > 0 ? Math.min(1, m.min / m.obj) : (m.min > 0 ? 1 : 0), C = 2 * Math.PI * 19, ok = r >= 1 && !m.futuro;
      s += '<g class="ca-parada' + (m.actual ? " ca-actual" : "") + (m.futuro ? " ca-futura" : "") + (ok ? " ca-ok" : "") + '" data-ca="' + i + '" tabindex="0" role="button" aria-label="' + MESES_L[m.mes] + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="24" class="ca-disco"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="19" class="ca-pista" fill="none"/>';
      if (!m.futuro) s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="19" class="ca-arco" fill="none" transform="rotate(-90 ' + p[0] + " " + p[1] + ')" style="stroke-dasharray:' + (C * r).toFixed(1) + " " + C.toFixed(1) + '"/>';
      s += '<text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" class="ca-mes">' + (ok ? "✓" : MESES_L[m.mes].slice(0, 3)) + '</text><text x="' + p[0] + '" y="' + (p[1] + 42) + '" text-anchor="middle" class="ca-h">' + (m.futuro ? "" : formatearTiempo(m.min)) + "</text></g>";
    });
    const fin = caPos(11); s += '<text x="' + (fin[0] - 44) + '" y="' + (fin[1] + 8) + '" class="ca-bandera" text-anchor="middle">🏁</text>';
    const ini = caPos(0); s += '<text x="' + (ini[0] - 44) + '" y="' + (ini[1] + 8) + '" class="ca-bandera" text-anchor="middle">🚩</text>';
    const i0 = Math.min(10, Math.floor(frac)), pt = caBez(caSeg(i0), Math.min(1, frac - i0)), src = caPersonajeSrc();
    s += '<g class="ca-pj" transform="translate(' + (pt[0] - 21).toFixed(1) + " " + (pt[1] - 74).toFixed(1) + ')"><g class="ca-pj-bob">' + (src ? '<image href="' + src.replace(/"/g, "") + '" width="42" height="60" preserveAspectRatio="xMidYMax meet"/>' : '<text x="21" y="46" font-size="40" text-anchor="middle">🚶</text>') + "</g></g></svg>";
    return { svg: s, frac };
  }
  function caPintar() {
    const c = $("caminoAnioV27657"); if (!c) return; const D = caDatos(), R = caSvg(D), cuerpo = c.querySelector(".ca-cuerpo");
    const cumplidos = D.meses.filter((m) => !m.futuro && m.obj > 0 && m.min >= m.obj).length, total = D.meses.reduce((a, m) => a + m.min, 0), pasados = D.meses.filter((m) => !m.futuro).length;
    cuerpo.innerHTML = '<p class="ca-tit">Septiembre ' + (D.fin - 1) + " → Agosto " + D.fin + '</p><div class="ca-lienzo">' + R.svg + '</div><p class="ca-detalle" role="status">' + cumplidos + " de " + pasados + (pasados === 1 ? " mes" : " meses") + " con el objetivo cumplido · " + formatearTiempo(total) + " en el año. Toca un mes para ver su detalle.</p>";
    c.dataset.datos = JSON.stringify(D.meses.map((m) => [MESES_L[m.mes], m.min, m.obj, m.futuro ? 1 : 0]));
  }
  function caInstalar() {
    const ref = $("anioServicioV276") || $("calorAnualV267"); if (!ref || $("caminoAnioV27657")) return;
    const d = document.createElement("details"); d.id = "caminoAnioV27657"; d.className = "stats-accordion-v183 ca-v27657"; d.open = true;
    d.innerHTML = '<summary><span class="stats-accordion-icono-v183">🗺️</span><span>Camino del año de servicio</span><span class="stats-accordion-flecha-v183">›</span></summary><div class="stats-accordion-cuerpo-v183"><article class="ca-cuerpo"></article></div>';
    /* V27658: el camino vive dentro de «Tu año en cifras», antes del boton de compartir */
    { const bc = ref.id === "anioServicioV276" ? ref.querySelector(".anio-compartir-v276") : null; if (bc) ref.insertBefore(d, bc); else ref.insertAdjacentElement("afterend", d); }
    const mostrar = (g) => { const D = JSON.parse(d.dataset.datos || "[]"), x = D[Number(g.dataset.ca)]; if (!x) return; d.querySelector(".ca-detalle").textContent = x[0].charAt(0).toUpperCase() + x[0].slice(1) + ": " + (x[3] ? "todavía no ha llegado." : formatearTiempo(x[1]) + (x[2] > 0 ? " de " + formatearTiempo(x[2]) + " (" + Math.min(999, Math.round(x[1] / x[2] * 100)) + " %)" : "")); };
    d.addEventListener("click", (e) => { const g = e.target.closest(".ca-parada"); if (g) mostrar(g); });
    d.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { const g = e.target.closest(".ca-parada"); if (g) { e.preventDefault(); mostrar(g); } } });
    caPintar();
    let pend = false; const re = () => { if (!pend) { pend = true; setTimeout(() => { pend = false; if (!d.contains(document.activeElement)) caPintar(); }, 300); } };
    const v = $("vista-estadisticas"); if (v) new MutationObserver((m) => { if (m.some((x) => x.type === "attributes" && x.attributeName === "data-seg-v264")) re(); }).observe(v, { attributes: true, attributeFilter: ["data-seg-v264"] });
    const rm = $("resumenMensualV143"); if (rm) new MutationObserver(re).observe(rm, { childList: true, subtree: true, characterData: true });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") re(); });
    window.addEventListener("miServicio:interfazListaV201", re);
  }

  /* --- Escena grande para cada personaje (pantera y corazón conservan su ilustración) --- */
  const ESG = {
    hombre: { cielo: ["#bfe3ff", "#eaf6ff"], suelo: ["#7cc576", "#4f9f58"], props: [["🌳", 4, 10, 74], ["🌼", 70, 6, 30], ["☀️", 82, 66, 44]] },
    mujer: { cielo: ["#ffd9ec", "#fff0f7"], suelo: ["#8fd18a", "#5fae63"], props: [["🌸", 4, 12, 62], ["🌳", 76, 10, 70], ["☀️", 80, 66, 44]] },
    koala: { cielo: ["#d6efe0", "#f0faf4"], suelo: ["#86bf86", "#5a9a68"], props: [["🌿", 70, 8, 52], ["🌳", 3, 12, 88], ["🌙", 82, 66, 38]] },
    mariposa: { cielo: ["#e0d6ff", "#f7f1ff"], suelo: ["#9ad59b", "#68b574"], props: [["🌷", 6, 6, 40], ["🌻", 74, 6, 54], ["🌼", 60, 4, 30], ["🦋", 62, 52, 28]] },
    tortuga: { cielo: ["#c7ecff", "#eefaff"], suelo: ["#f3dca5", "#e2c071"], props: [["🌴", 76, 12, 80], ["🐚", 6, 5, 30], ["🌊", 52, 4, 40], ["☀️", 12, 68, 44]] },
    liebre: { cielo: ["#d2ecff", "#f2f9ff"], suelo: ["#9bd38d", "#6bb164"], props: [["🥕", 74, 6, 40], ["🌾", 4, 8, 52], ["🌳", 82, 14, 62], ["☁️", 54, 70, 40]] },
    pajarito: { cielo: ["#cfeaff", "#f4fbff"], suelo: ["#a4d9a0", "#74b86e"], props: [["🍃", 70, 12, 46], ["🌸", 6, 10, 46], ["☁️", 60, 70, 44], ["☁️", 14, 74, 32]] },
    gatito: { cielo: ["#ffe7d1", "#fff6ec"], suelo: ["#f1c6a2", "#dba579"], props: [["🧶", 70, 6, 38], ["🪴", 4, 8, 64], ["🌙", 80, 68, 38]] }
  };
  function esgSrc(p) { const i = document.querySelector('#galeriaPersonajes [data-personaje="' + p + '"] img'); return i ? i.getAttribute("src") : ""; }
  function esgPintar() {
    const e = $("escenaRegistrarV260"); if (!e) return; const p = estado.preferencias && estado.preferencias.personajeProgreso, T = ESG[p];
    let g = e.querySelector(".escena-gen-v27657");
    if (!T) { if (g) g.remove(); delete e.dataset.genV27657; return; }
    const src = esgSrc(p); if (!src) { if (g) g.remove(); delete e.dataset.genV27657; return; }
    const firma = p + "|" + src; if (g && g.dataset.firma === firma) { e.dataset.genV27657 = "1"; return; }
    if (g) g.remove(); g = document.createElement("div"); g.className = "escena-gen-v27657"; g.dataset.firma = firma; g.setAttribute("aria-hidden", "true");
    g.style.setProperty("--eg-c1", T.cielo[0]); g.style.setProperty("--eg-c2", T.cielo[1]); g.style.setProperty("--eg-s1", T.suelo[0]); g.style.setProperty("--eg-s2", T.suelo[1]);
    g.innerHTML = '<svg class="eg-colinas" viewBox="0 0 400 140" preserveAspectRatio="none"><path d="M0 70 C80 20 160 30 230 62 C300 94 350 40 400 50 L400 140 L0 140Z" class="eg-c-a"/><path d="M0 100 C90 60 190 110 270 84 C330 66 370 84 400 76 L400 140 L0 140Z" class="eg-c-b"/></svg>' +
      T.props.map((q, i) => '<span class="eg-prop" style="left:' + q[1] + '%;bottom:' + q[2] + "%;font-size:" + q[3] + 'px;animation-delay:' + (i * 0.4) + 's">' + q[0] + "</span>").join("") + '<i class="eg-sombra"></i><img class="eg-pj" alt="" decoding="async" draggable="false">';
    g.querySelector(".eg-pj").src = src; e.appendChild(g); e.dataset.genV27657 = "1";
  }
  function esgInstalar() {
    esgPintar(); window.addEventListener("miServicio:interfazListaV201", esgPintar);
    const s = $("personajeProgreso"); if (s) s.addEventListener("change", () => setTimeout(esgPintar, 120));
    const g = $("galeriaPersonajes"); if (g) g.addEventListener("click", () => setTimeout(esgPintar, 250));
    window.addEventListener("storage", () => setTimeout(esgPintar, 100));
  }
  /* 48 · V27659 · Modo Visita, vista rápida («widget»), medallas con volumen e imagen del mapa de calor del año */
  const VS_TONO = { ministerio: ["#7cc0ff", "#2468dc"], ldc: ["#86efb4", "#1c9d5b"], asambleas: ["#d2b8ff", "#7a4de0"], otras: ["#ffd09a", "#e4741f"] };
  const VS = { t: 0, modo: "" };
  function vsFranja(h) { return h < 6 ? "noche" : h < 12 ? "manana" : h < 18 ? "tarde" : h < 21 ? "atardecer" : "noche"; }
  function vsDatos(ahora) {
    ahora = ahora || new Date(); const f = fechaISO(ahora), tipos = {}; TIPOS.forEach((t) => { tipos[t] = 0; }); let total = 0;
    registros().forEach((r) => { if (String(r.fecha).slice(0, 10) !== f) return; const m = Math.max(0, Number(r.minutos) || 0); if (m <= 0) return; total += m; if (tipos[r.tipo] !== undefined) tipos[r.tipo] += m; });
    const ob = objetivo(), mes = mesTotalCompu(); let plan = null; try { plan = dnPlan(total); } catch (e) {}
    return { f, total, tipos, racha: srRacha(), ob, comp: mes.comp, pctMes: ob ? Math.min(100, Math.round(mes.comp / ob * 100)) : 0, plan, franja: vsFranja(ahora.getHours()) };
  }
  function vsPintar() {
    const o = $("visitaV27659"); if (!o) return; const D = vsDatos(), w = o.dataset.modo === "widget";
    o.dataset.franja = D.franja;
    const fh = new Date(); { const tf = fh.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }); o.querySelector(".vs-fecha").textContent = tf.charAt(0).toUpperCase() + tf.slice(1); }
    const tot = o.querySelector(".vs-total"); tot.textContent = D.total ? fmt(D.total) : "0 min";
    o.querySelector(".vs-sub").textContent = D.total ? "de actividad hoy" : "Hoy aún no hay actividad";
    const frac = D.plan && !D.plan.mes ? Math.min(1, D.plan.pct / 100) : D.plan && D.plan.mes ? 1 : D.total ? 1 : 0, C = 2 * Math.PI * 52;
    const arco = o.querySelector(".vs-arco"); arco.style.strokeDasharray = (C * frac).toFixed(1) + " " + C.toFixed(1);
    o.querySelector(".vs-aro-txt").textContent = D.plan ? (D.plan.mes ? "Objetivo del mes cumplido ✓" : D.plan.falta > 0 ? "Faltan " + fmt(D.plan.falta) + " para el ritmo de hoy" : "Ritmo de hoy cumplido ✓") : "";
    const gl = o.querySelector(".vs-globos"); gl.textContent = "";
    const mx = Math.max(1, ...TIPOS.map((t) => D.tipos[t]));
    TIPOS.filter((t) => D.tipos[t] > 0).forEach((t, i) => {
      const g = document.createElement("div"); g.className = "vs-g"; g.style.setProperty("--c1", VS_TONO[t][0]); g.style.setProperty("--c2", VS_TONO[t][1]); g.style.setProperty("--i", String(i));
      if (!w) { const d = Math.round((78 + 82 * Math.sqrt(D.tipos[t] / mx)) * (innerHeight < 680 ? .68 : 1)); g.style.width = g.style.height = d + "px"; }
      const n = document.createElement("small"), v = document.createElement("strong"); n.textContent = nombreTipo(t); v.textContent = fmt(D.tipos[t]); g.append(v, n); gl.appendChild(g);
    });
    o.querySelector(".vs-racha").textContent = "🔥 " + D.racha + (D.racha === 1 ? " día seguido" : " días seguidos");
    o.querySelector(".vs-mes").textContent = D.ob ? "Mes: " + D.pctMes + " % del objetivo" : "Mes: " + fmt(D.comp);
    const barra = o.querySelector(".vs-barra i"); barra.style.width = (D.ob ? D.pctMes : 0) + "%"; o.querySelector(".vs-barra").hidden = !D.ob;
  }
  function vsCerrar() { const o = $("visitaV27659"); if (!o) return; clearInterval(VS.t); if (VS.modo === "visita") wlSoltar(); VS.modo = ""; o.classList.add("vs-sale"); setTimeout(() => o.remove(), 260); document.removeEventListener("keydown", vsTecla); }
  function vsTecla(e) { if (e.key === "Escape") vsCerrar(); }
  function vsAbrir(modo) {
    modo = modo === "widget" ? "widget" : "visita"; const viejo = $("visitaV27659"); if (viejo) viejo.remove(); clearInterval(VS.t);
    const o = document.createElement("div"); o.id = "visitaV27659"; o.dataset.modo = modo; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", modo === "widget" ? "Vista rápida de hoy" : "Modo visita");
    o.innerHTML = '<button type="button" class="vs-cerrar" aria-label="Cerrar">✕</button><div class="vs-caja"><p class="vs-fecha"></p><div class="vs-centro"><svg class="vs-aro" viewBox="0 0 120 120" aria-hidden="true"><circle class="vs-pista" cx="60" cy="60" r="52"/><circle class="vs-arco" cx="60" cy="60" r="52" transform="rotate(-90 60 60)"/></svg><div class="vs-num"><strong class="vs-total"></strong><small class="vs-sub"></small></div></div><p class="vs-aro-txt"></p><div class="vs-globos"></div><div class="vs-pie"><span class="vs-racha"></span><span class="vs-mes"></span></div><div class="vs-barra" hidden><i></i></div></div>';
    document.body.appendChild(o); VS.modo = modo; vsPintar();
    o.querySelector(".vs-cerrar").addEventListener("click", vsCerrar); document.addEventListener("keydown", vsTecla);
    if (modo === "visita") { o.addEventListener("dblclick", vsCerrar); wlPedir(); }
    VS.t = setInterval(() => { if (!document.hidden) vsPintar(); }, 30000);
    setTimeout(() => { const b = o.querySelector(".vs-cerrar"); if (b) b.focus(); }, 60);
  }
  function vsCrearAjustes() {
    const v = $("vista-ajustes"); if (!v || $("visitaAjV27659")) return;
    const base = AT_BASE(), ej = [["Abrir el modo Visita", base + "?accion=visita"], ["Abrir la vista rápida de hoy", base + "?accion=widget"]];
    const d = document.createElement("details"); d.id = "visitaAjV27659"; d.className = "ajustes-acordeon-v179 at-aj-v27657";
    d.innerHTML = '<summary><span class="ajustes-acordeon-icono" aria-hidden="true">🖥️</span><span class="ajustes-acordeon-titulo">Modo visita y vista rápida</span><small class="aj-resumen-v27629">pantallas</small><span class="ajustes-acordeon-flecha" aria-hidden="true">›</span></summary><div class="at-cuerpo"><p class="ayuda-fondo-clima-v260"><b>Modo visita</b>: pantalla grande y limpia con tu actividad de hoy, globos y racha; mantiene la pantalla encendida. Ideal para dejar el iPad en la mesa. <b>Vista rápida</b>: una tarjeta compacta con lo esencial. Se cierra con ✕ o con doble toque.</p><div class="at-fila"><button type="button" class="boton-guardar" data-vs="visita">Abrir modo visita</button><button type="button" class="boton-secundario" data-vs="widget">Abrir vista rápida</button></div><div class="at-lista"></div><p class="ayuda-fondo-clima-v260">Los enlaces sirven para la app Atajos. Igual que con los demás atajos, si iOS los abre en Safari verás los datos de Safari, no los de la app instalada.</p></div>';
    d.querySelectorAll("[data-vs]").forEach((b) => b.addEventListener("click", () => vsAbrir(b.dataset.vs)));
    const L = d.querySelector(".at-lista");
    ej.forEach(([t, u]) => { const f = document.createElement("div"); f.className = "at-item"; f.innerHTML = "<b></b><code></code><button type=\"button\" class=\"boton-secundario\">Copiar enlace</button>"; f.querySelector("b").textContent = t; f.querySelector("code").textContent = u; f.querySelector("button").addEventListener("click", async (ev) => { try { await navigator.clipboard.writeText(u); ev.target.textContent = "Copiado ✓"; } catch (e) { ev.target.textContent = "Mantén pulsado el enlace"; } setTimeout(() => { ev.target.textContent = "Copiar enlace"; }, 1800); }); L.appendChild(f); });
    v.appendChild(d);
  }

  /* Medallas con volumen: se inclinan con el dedo o el cursor, giran al tocarlas y brillan al ganar una nueva */
  function mdInstalar() {
    if (window.__mdV27659) return; window.__mdV27659 = 1;
    const sel = ".medalla-v267:not(.bloqueada)", med = (e) => { const t = e.target && e.target.closest ? e.target.closest(sel) : null; return t && t.closest(".vitrina-v27631,.logros-rejilla-v267") ? t : null; };
    const limpiar = (x) => { x.classList.remove("md-inclinada"); ["--rx", "--ry", "--lx", "--ly"].forEach((k) => x.style.removeProperty(k)); };
    document.addEventListener("pointermove", (e) => {
      const m = med(e); document.querySelectorAll(".medalla-v267.md-inclinada").forEach((x) => { if (x !== m) limpiar(x); }); if (!m) return;
      const r = m.getBoundingClientRect(), px = Math.max(-.5, Math.min(.5, (e.clientX - r.left) / r.width - .5)), py = Math.max(-.5, Math.min(.5, (e.clientY - r.top) / r.height - .5));
      m.classList.add("md-inclinada"); m.style.setProperty("--ry", (px * 42).toFixed(1) + "deg"); m.style.setProperty("--rx", (-py * 42).toFixed(1) + "deg"); m.style.setProperty("--lx", (50 + px * 70).toFixed(0) + "%"); m.style.setProperty("--ly", (50 + py * 70).toFixed(0) + "%");
    }, { passive: true });
    const fin = () => setTimeout(() => document.querySelectorAll(".medalla-v267.md-inclinada").forEach(limpiar), 260);
    document.addEventListener("pointerup", fin); document.addEventListener("pointercancel", fin);
    document.addEventListener("click", (e) => { const m = med(e); if (!m || m.classList.contains("md-gira")) return; m.classList.add("md-gira"); setTimeout(() => m.classList.remove("md-gira"), 1100); });
  }
  const MD_K = "miServicio.medallasVistasV27659";
  function mdDesbloqueos(lista, rej) {
    let g = null; try { g = JSON.parse(localStorage.getItem(MD_K) || "null"); } catch (e) {} const primera = !g || typeof g !== "object"; if (primera) g = {};
    const nuevas = []; lista.forEach((l, i) => { const k = l.x.y + "-" + (l.x.m + 1), ant = g[k] || 0; if (l.nivel > ant && !primera) nuevas.push(i); g[k] = l.nivel; });
    try { localStorage.setItem(MD_K, JSON.stringify(g)); } catch (e) {}
    nuevas.forEach((i) => { const m = rej.children[i] && rej.children[i].querySelector(".medalla-v267"); if (m) { m.classList.add("md-nueva"); setTimeout(() => m.classList.remove("md-nueva"), 1800); } });
    if (nuevas.length) { const l = lista[nuevas[nuevas.length - 1]]; try { avisoV202("🏅 Medalla nueva: " + ["", "bronce", "plata", "oro"][l.nivel] + " de " + MESES_L[l.x.m]); } catch (e) {} }
    return nuevas;
  }

  /* Imagen del año completo (mapa de calor) para compartir */
  function mcNivel(min) { return min <= 0 ? 0 : min < 60 ? 1 : min < 120 ? 2 : min < 180 ? 3 : 4; }
  function mcImagen(anio) {
    const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920; const c = cv.getContext("2d"), fam = '-apple-system, "SF Pro Display", system-ui, sans-serif';
    const g = c.createLinearGradient(0, 0, 0, 1920); g.addColorStop(0, "#0e1a3d"); g.addColorStop(1, "#1d3f8f"); c.fillStyle = g; c.fillRect(0, 0, 1080, 1920);
    const dias = new Map(); registros().forEach((r) => { const f = String(r.fecha).slice(0, 10), m = Math.max(0, Number(r.minutos) || 0); if (m > 0) dias.set(f, (dias.get(f) || 0) + m); });
    c.textAlign = "center"; c.fillStyle = "rgba(255,255,255,.72)"; c.font = "600 38px " + fam; c.fillText("MI AÑO DE SERVICIO", 540, 140);
    c.fillStyle = "#fff"; c.font = "800 130px " + fam; c.fillText(String(anio), 540, 270);
    const COL = ["rgba(255,255,255,.12)", "#8cc4ff", "#4f9bff", "#2f6fe0", "#ffd35c"], hoy = fechaISO(new Date()); let total = 0, activos = 0;
    const cel = 38, sep = 6, paso = cel + sep, ancho = 6 * paso - sep, mx0 = (1080 - 3 * ancho) / 4;
    for (let i = 0; i < 12; i++) {
      const b = new Date(anio - 1, 8 + i, 1, 12), y = b.getFullYear(), m = b.getMonth(), col = i % 3, fila = Math.floor(i / 3);
      const x0 = mx0 + col * (ancho + mx0), y0 = 400 + fila * 340, prim = (b.getDay() + 6) % 7, nd = new Date(y, m + 1, 0).getDate();
      c.fillStyle = "rgba(255,255,255,.8)"; c.font = "700 32px " + fam; c.textAlign = "left"; c.fillText(MESES_L[m].charAt(0).toUpperCase() + MESES_L[m].slice(1, 3), x0, y0 - 14);
      for (let d = 1; d <= nd; d++) {
        const f = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"), min = dias.get(f) || 0, k = prim + d - 1, cx = x0 + Math.floor(k / 7) * paso, cy = y0 + (k % 7) * paso;
        if (min > 0) { total += min; activos++; }
        c.fillStyle = f > hoy ? "rgba(255,255,255,.06)" : COL[mcNivel(min)]; rrect(c, cx, cy, cel, cel, 10); c.fill();
      }
    }
    c.textAlign = "center"; c.fillStyle = "#fff"; c.font = "800 84px " + fam; c.fillText(fmt(total), 540, 1700);
    c.fillStyle = "rgba(255,255,255,.7)"; c.font = "500 38px " + fam; c.fillText(activos + (activos === 1 ? " día activo" : " días activos") + " · septiembre " + (anio - 1) + " – agosto " + anio, 540, 1760);
    const lx = 540 - 5 * 46 / 2 - 90; c.font = "500 28px " + fam; c.fillStyle = "rgba(255,255,255,.6)"; c.textAlign = "right"; c.fillText("Menos", lx + 70, 1820);
    for (let k = 0; k < 5; k++) { c.fillStyle = COL[k]; rrect(c, lx + 90 + k * 46, 1795, 34, 34, 9); c.fill(); }
    c.textAlign = "left"; c.fillStyle = "rgba(255,255,255,.6)"; c.fillText("Más", lx + 90 + 5 * 46 + 10, 1820);
    c.textAlign = "center"; c.fillStyle = "rgba(255,255,255,.4)"; c.font = "600 30px " + fam; c.fillText("Mi Servicio", 540, 1890);
    return cv;
  }
  async function mcCompartir(btn) {
    const msg = $("anioServicioV276") && $("anioServicioV276").querySelector(".anio-estado-v276"), anio = anioV276 === null ? anioServicioHoy() : anioV276;
    try {
      const cv = mcImagen(anio), blob = await new Promise((res, rej) => cv.toBlob((b) => b ? res(b) : rej(new Error("sin imagen")), "image/png"));
      const nombre = "MiServicio-calor-" + anio + ".png", file = new File([blob], nombre, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) { try { await navigator.share({ files: [file], title: "Mi año de servicio " + anio }); if (msg) msg.textContent = "Imagen compartida ✓"; return; } catch (e) { if (e && e.name === "AbortError") return; } }
      const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); if (msg) msg.textContent = "Imagen descargada ✓";
    } catch (e) { if (msg) msg.textContent = "No se pudo crear la imagen."; }
  }
  function mcInstalar() {
    const host = $("anioServicioV276"); if (!host || host.querySelector(".anio-calor-compartir-v27659")) return;
    const ref = host.querySelector(".anio-compartir-v276:not(.anio-calor-compartir-v27659)"); if (!ref) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "boton-secundario anio-compartir-v276 anio-calor-compartir-v27659"; b.textContent = "🗓️ Compartir mapa de calor del año";
    b.addEventListener("click", () => mcCompartir(b)); ref.insertAdjacentElement("afterend", b);
  }
  window.MiServicioV27659 = { vsDatos, vsAbrir, vsCerrar, vsFranja, mcImagen, mcNivel, mdDesbloqueos };

  /* 49 · V27660 · Escena de fondo en Historial y Estadísticas (tu personaje con elementos de estadísticas) */
  const ED_K = "miServicio.escenaDatosV27660", ED_TK = "miServicio.escenaTamanoDatosV27660";
  function edTam() { try { return localStorage.getItem(ED_TK) === "pequena" ? "pequena" : "fondo"; } catch (e) { return "fondo"; } }
  const ED_EXTRA = { pantera: { suelo: ["#f4b0cd", "#d9779f"] }, corazon: { suelo: ["#ffb8c4", "#ff7a93"] } };
  function edActiva() { try { return localStorage.getItem(ED_K) === "si"; } catch (e) { return false; } }
  function edVista() { return document.querySelector("#vista-estadisticas.activa") ? "estadisticas" : document.querySelector("#vista-historial.activa") ? "historial" : ""; }
  function edHtml(T, v, src) {
    const barras = v === "estadisticas"
      ? '<svg class="ed-barras" viewBox="0 0 120 90" aria-hidden="true"><defs><linearGradient id="edG27660" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd35c"/><stop offset="1" stop-color="#f0922b"/></linearGradient><linearGradient id="edB27660" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8cc4ff"/><stop offset="1" stop-color="#2f6fe0"/></linearGradient></defs><rect class="ed-b b1" x="8" y="52" width="24" height="38" rx="6" fill="url(#edB27660)"/><rect class="ed-b b2" x="40" y="30" width="24" height="60" rx="6" fill="url(#edB27660)"/><rect class="ed-b b3" x="72" y="8" width="24" height="82" rx="6" fill="url(#edG27660)"/></svg>'
      : '<svg class="ed-barras ed-cal" viewBox="0 0 120 90" aria-hidden="true"><rect x="10" y="12" width="100" height="72" rx="14" fill="#fff" opacity=".92"/><rect x="10" y="12" width="100" height="22" rx="14" fill="#e5534b"/>' + [0, 1, 2, 3, 4, 5].map((i) => '<rect x="' + (20 + (i % 3) * 30) + '" y="' + (44 + Math.floor(i / 3) * 18) + '" width="20" height="12" rx="4" fill="' + (i === 1 || i === 4 || i === 5 ? "#34c759" : "#cfd6e4") + '"/>').join("") + "</svg>";
    const props = v === "estadisticas" ? [["🏆", 36, 70], ["📈", 8, 120]] : [["✅", 40, 66], ["📖", 8, 118]];
    return '<div class="ed-suelo"></div>' + barras + props.map((q, i) => '<span class="ed-prop" style="font-size:' + q[1] + 'px;left:' + q[2] + 'px;animation-delay:' + (i * .5) + 's">' + q[0] + "</span>").join("") + '<img class="ed-pj" alt="" decoding="async" draggable="false" src="' + src.replace(/"/g, "") + '">';
  }
  function edPintar() {
    let e = $("escenaDatosV27660"); const v = edVista(), p = estado.preferencias && estado.preferencias.personajeProgreso, T = ESG[p] || ED_EXTRA[p], src = T ? esgSrc(p) : "";
    if (!edActiva() || !v || !T || !src) { if (e) e.hidden = true; document.documentElement.removeAttribute("data-escena-datos-v27660"); return; }
    if (!e) { e = document.createElement("div"); e.id = "escenaDatosV27660"; e.setAttribute("aria-hidden", "true"); document.body.appendChild(e); }
    e.dataset.tam = edTam();
    const firma = p + "|" + src + "|" + v;
    if (e.dataset.firma !== firma) { e.dataset.firma = firma; e.dataset.vista = v; e.style.setProperty("--ed-s1", T.suelo[0]); e.style.setProperty("--ed-s2", T.suelo[1]); e.innerHTML = edHtml(T, v, src); }
    e.hidden = false; document.documentElement.dataset.escenaDatosV27660 = "1"; navMedir();
  }
  function edInstalar() {
    const z = $("escenaTamanoDatosV27660"); if (z && !z.dataset.edListo) { z.dataset.edListo = "1"; z.value = edTam(); z.addEventListener("change", () => { try { localStorage.setItem(ED_TK, z.value === "pequena" ? "pequena" : "fondo"); } catch (e) {} edPintar(); }); }
    const c = $("activarEscenaDatosV27660"); if (c && !c.dataset.edListo) { c.dataset.edListo = "1"; c.checked = edActiva(); c.addEventListener("change", () => { try { localStorage.setItem(ED_K, c.checked ? "si" : "no"); } catch (e) {} edPintar(); }); }
    if (window.__edV27660) return; window.__edV27660 = 1;
    const o = new MutationObserver(() => edPintar()); ["vista-historial", "vista-estadisticas"].forEach((id) => { const n = $(id); if (n) o.observe(n, { attributes: true, attributeFilter: ["class"] }); });
    window.addEventListener("miServicio:interfazListaV201", edPintar); window.addEventListener("storage", (ev) => { if (ev.key === ED_K || ev.key === null) edPintar(); });
    const s = $("personajeProgreso"); if (s) s.addEventListener("change", () => setTimeout(edPintar, 150));
    setTimeout(edPintar, 300);
  }
  window.MiServicioV27660 = { edPintar, edActiva };

  /* 27 · V27636 · Objetivo de cada mes: los meses pasados se comparan con el objetivo que tenían entonces */
  const OM_BASE = "0000-00";
  function omClave(d) { return fechaISO(d || new Date()).slice(0, 7); }
  function omObjetivoDe(clave) {
    try {
      if (!clave || clave >= omClave()) return objetivo();
      const m = estado.preferencias && estado.preferencias.objetivosPorMes; if (!m || typeof m !== "object") return objetivo();
      const ks = Object.keys(m).filter(k => /^(0000-00|\d{4}-(0[1-9]|1[0-2]))$/.test(k)).sort(); let v = null;
      for (const k of ks) { if (k <= clave) v = m[k]; else break; }
      return v === null ? objetivo() : (Number(v) || 0);
    } catch (e) { return objetivo(); }
  }
  window.omObjetivoDeV27636 = omObjetivoDe;
  function omTrasGuardar(antes) {
    const p = estado.preferencias; if (!p) return;
    const ob = Math.round(Number(p.objetivoMensualMinutos) || 0); if (ob === antes) return;
    const m = Object.assign({}, p.objetivosPorMes && typeof p.objetivosPorMes === "object" ? p.objetivosPorMes : {});
    if (!Object.keys(m).length && antes > 0) m[OM_BASE] = antes;
    m[omClave()] = ob; p.objetivosPorMes = m;
    try { guardarPreferencias(); } catch (e) { console.warn("[V27636]", e); }
  }
  function omInstalar() {
    document.addEventListener("click", e => { if (!(e.target.closest && e.target.closest("#guardarAjustes"))) return; const antes = Math.round(objetivo()); setTimeout(() => omTrasGuardar(antes), 0); }, true);
    const inp = $("objetivoMensual"), g = inp && inp.closest(".grupo-formulario");
    if (g && !$("ayudaObjetivoMesV27636")) { const n = document.createElement("p"); n.id = "ayudaObjetivoMesV27636"; n.className = "ayuda-v203"; n.textContent = "Si lo cambias, vale desde este mes: los meses anteriores conservan el objetivo que tenían."; g.appendChild(n); }
  }

  /* 25 · V27634 · Lo repetido se oculta solo de la pantalla (los elementos y sus datos siguen existiendo) */
  function dpPintar() {
    const hoy = new Date(), mesAct = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0");
    const rm = document.querySelector(".v143-resumen-mensual");
    if (rm) {
      const inp = $("mesResumenV143"), actual = !inp || !inp.value || inp.value === mesAct;
      const st = rm.querySelector(".v143-rm-stats");
      if (st) {
        const cs = st.children, dias = cs[1];
        if (dias) dias.classList.toggle("dp-oculto-v27634", actual);
        const n = (cs[2] ? 1 : 0) + (dias && !actual ? 1 : 0); if (st.style.getPropertyValue("--dp-n") !== String(n)) st.style.setProperty("--dp-n", String(n));
      }
      const cmp = rm.querySelector("[data-v143-compara]"), msg = rm.querySelector("[data-v143-mensaje]");
      if (cmp && msg) msg.classList.toggle("dp-oculto-v27634", /^sin comparaci/i.test((cmp.textContent || "").trim()));
    }
    const a = $("seguridadNubeV260"), b = $("estadoSyncV134");
    if (a && b) { const q = x => x.textContent.trim().replace(/^Guardado en este dispositivo · /, ""); b.classList.toggle("dp-oculto-v27634", !!q(a) && q(a) === q(b)); }
  }
  /* 26 · V27635 · Menos elementos: estado único en la cabecera, hoja «Compartir y exportar», hora exacta plegada */
  function ctPintar() {
    const sp = $("estadoConexionTextoV190"), pq = $("ultimaActualizacionV195"); if (!sp || !pq) return;
    const f = (pq.textContent || "").replace(/^\s*Guardado\s*/i, "").trim();
    if (f && sp.dataset.fechaV27635 !== f) sp.dataset.fechaV27635 = f;
    if (!f && sp.dataset.fechaV27635) delete sp.dataset.fechaV27635;
  }
  const CM_FILAS = [["wrappedBotonV267", "Resumen del mes", ""], ["wrappedSemanaBotonV269", "Resumen de la semana", ""], ["compartirMesV260", "Compartir resumen", "Texto con tus cifras"], ["tarjetaMesV27629", "Tarjeta del mes", "Imagen para compartir"], ["csvMesV264", "Exportar mes (CSV)", "Hoja de cálculo"]];
  function cmCerrar() { const o = $("cmV27635"); if (!o) return; o.classList.remove("qr-entra"); setTimeout(() => { if (o.parentNode) o.remove(); }, movReducido() ? 0 : 200); }
  function cmAbrir() {
    if ($("cmV27635")) return;
    const o = document.createElement("div"); o.id = "cmV27635"; o.className = "qr-fondo";
    const filas = CM_FILAS.filter(f => $(f[0])).map(f => '<button type="button" class="cm-fila" data-id="' + f[0] + '"><span><b>' + f[1] + '</b>' + (f[2] ? '<small>' + f[2] + '</small>' : '') + '</span><i aria-hidden="true">›</i></button>').join("");
    o.innerHTML = '<div class="qr-hoja" role="dialog" aria-modal="true" aria-label="Compartir y exportar"><span class="qr-agarre" aria-hidden="true"></span><h3>Compartir y exportar</h3><div class="cm-lista">' + filas + '</div><div class="qr-pie"><span></span><button type="button" class="qr-cancelar">Cerrar</button></div></div>';
    document.body.appendChild(o); const t0 = Date.now();
    o.addEventListener("click", e => {
      if (e.target === o) { if (Date.now() - t0 > 400) cmCerrar(); return; }
      const f = e.target.closest(".cm-fila"), c = e.target.closest(".qr-cancelar");
      if (f) { const b = $(f.dataset.id); cmCerrar(); if (b) b.click(); } else if (c) cmCerrar();
    });
    document.addEventListener("keydown", function esc(e) { if (!$("cmV27635")) { document.removeEventListener("keydown", esc); return; } if (e.key === "Escape") { cmCerrar(); document.removeEventListener("keydown", esc); } });
    requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add("qr-entra")));
    const h = o.querySelector(".qr-hoja"); if (h) { h.tabIndex = -1; try { h.focus({ preventScroll: true }); } catch (e) {} }
  }
  function cmPintar() {
    const cont = document.querySelector(".compartir-mes-v260"); if (!cont) return;
    let b = $("menuCompartirV27635");
    if (!b) { b = document.createElement("button"); b.type = "button"; b.id = "menuCompartirV27635"; b.className = "boton-secundario"; b.textContent = "↗ Compartir y exportar"; b.addEventListener("click", cmAbrir); cont.insertBefore(b, cont.firstChild); }
    else if (cont.firstChild !== b) cont.insertBefore(b, cont.firstChild);
  }
  function exPintar() {
    const g = document.querySelector("#vista-registrar .grupo-tiempo"), at = g && g.querySelector(".atajos-tiempo"); if (!g || !at) return;
    let b = $("tiempoExactoV27635");
    if (!b) {
      b = document.createElement("button"); b.type = "button"; b.id = "tiempoExactoV27635"; b.className = "ex-boton-v27635"; b.setAttribute("aria-expanded", "false"); b.textContent = "Escribir hora exacta";
      b.addEventListener("click", () => { const a = g.dataset.exactoV27635 === "1"; if (a) delete g.dataset.exactoV27635; else g.dataset.exactoV27635 = "1"; b.setAttribute("aria-expanded", a ? "false" : "true"); b.textContent = a ? "Escribir hora exacta" : "Ocultar hora exacta"; });
      at.insertAdjacentElement("afterend", b);
    }
  }
  function v35Pasar() { try { ctPintar(); cmPintar(); exPintar(); } catch (e) { console.warn("[V27635]", e); } }

  function v33Pasar() { try { pyPintar(); cpPintar(); dpPintar(); v35Pasar(); rvPintar(); cnPintar(); dfPintar(); } catch (e) { console.warn("[V27633]", e); } }

  function instalarAzulejos() {
    btPasar();
    new MutationObserver(m => { for (let i = 0; i < m.length; i++) { const t = m[i].target; if (t && t.closest && t.closest(".orbita-grafico,#btDefsV276,.bt-confeti-v276")) continue; btProgramar(); break; } }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", btPulsar, true);
    document.addEventListener("click", btGuardar, true);
    document.addEventListener("touchstart", e => { const b = e.target.closest && e.target.closest(".bt-host-v276"); if (b) b.classList.add("bt-toque-v276"); }, { passive: true });
    ["touchend", "touchcancel"].forEach(n => document.addEventListener(n, () => document.querySelectorAll(".bt-toque-v276").forEach(x => x.classList.remove("bt-toque-v276")), { passive: true }));
  }

  /* ================= 16. APARIENCIA CLARA / OSCURA / AUTOMÁTICA (V27627) ================= */
  function instalarModoColor() {
    const grupo = $("modoColorV27627"); if (!grupo) return;
    const K = "miServicio.modoColorV27627";
    const pintar = () => { const m = window.leerModoColorV276 ? window.leerModoColorV276() : "auto"; grupo.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.modoV27627 === m ? "true" : "false")); };
    grupo.addEventListener("click", e => {
      const b = e.target.closest("button[data-modo-v27627]"); if (!b) return;
      try { localStorage.setItem(K, b.dataset.modoV27627); } catch (er) {}
      if (window.aplicarModoColorV276) window.aplicarModoColorV276(b.dataset.modoV27627);
      pintar();
    });
    pintar();
    // hojas de estilo añadidas más tarde por el código antiguo: se les aplica el mismo modo
    try { new MutationObserver(() => { if (window.aplicarModoColorV276 && window.leerModoColorV276() !== "auto") window.aplicarModoColorV276(window.leerModoColorV276()); }).observe(document.head, { childList: true }); } catch (e) {}
    if (window.aplicarModoColorV276 && window.leerModoColorV276() !== "auto") window.aplicarModoColorV276(window.leerModoColorV276());
  }

  /* ================= 17. CRONÓMETRO CON ANILLO (V27627) ================= */
  function instalarAnilloCron() {
    const sec = $("cronometroV264"), out = $("cronTiempoV264"); if (!sec || !out) return;
    const marcar = () => {
      const m = /^(\d+):(\d\d):(\d\d)$/.exec((out.textContent || "").trim()); const marcha = document.body.classList.contains("cronometro-activo-v264");
      const s = m ? parseInt(m[3], 10) : 0;
      sec.style.setProperty("--cron-a", marcha ? (s * 6) + "deg" : "0deg");
      sec.classList.toggle("cron-anillo-marcha-v27627", marcha);
    };
    marcar();
    new MutationObserver(marcar).observe(out, { childList: true, characterData: true, subtree: true });
    new MutationObserver(marcar).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function arrancar() {
    try { envolverFirma(); envolverDeshacer(); instalarTemas(); instalarAnillos(); instalarPapelera(); instalarMeta(); instalarDiagnostico(); programarLimpieza(); instalarPendientes(); instalarEventoChip(); instalarComprobacionGlobos(); instalarVida(); instalarEstadisticasNuevas(); instalarAcento(); instalarTituloCompacto(); instalarInicioVivo(); instalarInteresados(); instalarRecuperacionEncaje(); instalarAccesibilidad(); aplicarTipografia(); instalarAzulejos(); instalarModoColor(); instalarAnilloCron(); instalarEstacion(); instalarV9(); } catch (e) { console.warn("[V269]", e); }
    document.addEventListener("click", e => { const n = e.target.closest && e.target.closest(".nav-item"); if (n) setTimeout(() => { pintarAnillos(); if (n.dataset.vista === "estadisticas") animarAnillos(); }, 120); });
    window.MiServicioV269 = { faseInicio: ivFase, datosAnillos, aplicarTema, TEMAS, leerPapelera: limpiarPapelera, enviarAPapelera, derivarFirma, pendientes, errores, reunirDiagnostico, limpiarCaches, candidatosEventos, comprobarGlobos, globosFallan, leerInteresados };
  }
  if (document.readyState === "complete") setTimeout(arrancar, 0);
  else window.addEventListener("load", () => setTimeout(arrancar, 0), { once: true });
})();
