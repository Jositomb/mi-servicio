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
  const INI_K = "miServicio.inicioV27636", RV_K = "miServicio.revisionOkV27636", RV_TIPOS = ["ministerio", "ldc", "asambleas", "otras"]; /* arriba para que existan cuando arranca la app */
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
    while (luminancia(base) > 0.34) base = mezcla(base, [0, 0, 0], .12); // legible sobre fondos claros
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
    return tot ? tot + " " + (obj || "") + (pct ? " · " + pct : "") : "";
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
    const horasEl = s.querySelector(".anio-datos-v276"); horasEl.textContent = "";
    [[String(d.diasActivos), d.diasActivos === 1 ? "día activo" : "días activos"], [String(d.racha), "racha máxima"], [d.total ? MESES_L[d.mejor.m].charAt(0).toUpperCase() + MESES_L[d.mejor.m].slice(1) : "—", "mejor mes"], [fmt(d.promedio), "media al mes"]].forEach(p => {
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
    const i = $("nombreSaludoV260"), nombre = i ? i.value.trim() : "", r = ajResumenes();
    v9Txt(cab.querySelector(".aj-avatar-v27629"), ajIniciales(nombre));
    v9Txt(cab.querySelector("b"), nombre || "Mi Servicio");
    v9Txt(cab.querySelector("small"), r.tipo || "Publicador");
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
    rcInstalar(); gsInstalar(); omInstalar(); iniInstalar();
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
      s.classList.add("sr-oculta-v27631"); try { programarEncajeV260(true); } catch (e) {}
      setTimeout(() => { if (!encaja()) { s.classList.remove("sr-oculta-v27631"); try { programarEncajeV260(true); } catch (e) {} } }, 1500);
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
    v9Txt(s.querySelector(".vt-titulo"), "Vitrina de insignias · " + d.anio);
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
    if (cab.nextElementSibling !== fila) cab.parentNode.insertBefore(fila, cab.nextSibling);
    if (fila.dataset.nivel !== nivel) fila.dataset.nivel = nivel;
    v9Txt(fila.querySelector("small"), txt + (d !== null && cpFecha() ? " · " + cpFecha() : ""));
  }

  /* 24c · Gestos: pulsación larga en un globo y deslizar entre pestañas */
  const GS_K = "miServicio.gestosV27633", GS_VISTAS = ["inicio", "registrar", "historial", "estadisticas"], QR_MINS = [30, 60, 90, 120];
  function gsActivo() { try { return localStorage.getItem(GS_K) !== "0"; } catch (e) { return true; } }
  let qrTs = 0;
  function qrCerrar() { const o = $("qrV27633"); if (!o) return; o.classList.remove("qr-entra"); setTimeout(() => { if (o.parentNode) o.remove(); }, movReducido() ? 0 : 200); }
  function qrColor(tipo) { const f = V8_TIPOS.find(x => x[0] === tipo); return f ? f : V8_TIPOS[0]; }
  function qrGuardar(tipo, min) {
    if (!V8_NOMBRE[tipo] || !(min > 0)) return false;
    const fecha = fechaISO(new Date()), ahora = new Date().toISOString();
    if (typeof posibleDuplicadoV260 === "function" && posibleDuplicadoV260(estado.registros, { fecha, tipo, minutos: min, companero: "", notas: "", cursosBiblicos: 0 }) &&
      !window.confirm("Ya hay un registro idéntico de " + V8_NOMBRE[tipo] + " (" + v8Hm(min) + ") hoy. ¿Guardar otro igual?")) return false;
    const reg = { id: crearID(), fecha, tipo, minutos: min, notas: "", companero: "", cursosBiblicos: 0, creadoEn: ahora, modificadoEn: ahora, sincronizacion: { estado: "pendiente", ultimaSincronizacion: null } };
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
    /* Pulsación larga en un globo/pieza de Inicio */
    let tm = null, x0 = 0, y0 = 0;
    const cancelar = () => { if (tm) { clearTimeout(tm); tm = null; } };
    document.addEventListener("pointerdown", e => {
      cancelar(); if (!gsActivo() || e.button > 0) return;
      const pieza = e.target.closest && e.target.closest("#graficoInicio [data-actividad-inicio]"); if (!pieza) return;
      const tipo = pieza.dataset.actividadInicio; x0 = e.clientX; y0 = e.clientY;
      tm = setTimeout(() => { tm = null; qrAbrir(tipo); }, 520);
    }, true);
    document.addEventListener("pointermove", e => { if (tm && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) cancelar(); }, true);
    ["pointerup", "pointercancel", "scroll"].forEach(n => document.addEventListener(n, cancelar, true));
    document.addEventListener("click", e => { if ($("qrV27633") && Date.now() - qrTs < 900 && e.target.closest && e.target.closest("#graficoInicio")) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    document.addEventListener("contextmenu", e => { if (gsActivo() && e.target.closest && e.target.closest("#graficoInicio [data-actividad-inicio]")) e.preventDefault(); }, true);
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
    window.MiServicioV27633 = { omObjetivoDe, omTrasGuardar, cmAbrir, cmCerrar, pyPintar, cpPintar, cpDias, cpNivel, qrAbrir, qrCerrar, qrGuardar, gsActivo, iniLeer, iniAplicar, rvAnalizar, rvAbrir, rvCerrar, rvPintar };
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
    if (a && b) b.classList.toggle("dp-oculto-v27634", !!a.textContent.trim() && a.textContent.trim() === b.textContent.trim());
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

  function v33Pasar() { try { pyPintar(); cpPintar(); dpPintar(); v35Pasar(); rvPintar(); } catch (e) { console.warn("[V27633]", e); } }

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
