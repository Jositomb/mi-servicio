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
  function ivContar() {
    if (sinMovimiento()) return;
    const g = $("graficoInicio"); if (!g) return;
    const objetivos = [...g.querySelectorAll(".orbita-actividad>span:not(.sector-icono),.orbita-centro>strong")].filter(e => /\d/.test(e.textContent)).map(e => ({ e, fin: e.textContent, m: minDeTexto(e.textContent) }));
    if (!objetivos.length) return;
    const t0 = performance.now(), dur = 900;
    const paso = ahora => {
      const k = Math.min(1, (ahora - t0) / dur), f = 1 - Math.pow(1 - k, 3);
      objetivos.forEach(o => { o.e.textContent = k >= 1 ? o.fin : textoDeMin(o.m * f); });
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
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
    setInterval(ivCielo, 60000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { ivCielo(); const v = $("vista-inicio"); if (v && v.classList.contains("activa")) { ivUltima = 0; ivEntrada(); } } });
    const g = $("graficoInicio");
    if (g) new MutationObserver(() => { ivPintarAnillos(); if (Date.now() - ivUltima > 8000 && $("vista-inicio") && $("vista-inicio").classList.contains("activa")) ivEntrada(); }).observe(g, { childList: true });
    const pe = $("porcentajeObjetivo"); if (pe) new MutationObserver(() => ivPintarAnillos()).observe(pe, { childList: true, characterData: true, subtree: true });
    const vi = $("vista-inicio");
    if (vi) { let activa = vi.classList.contains("activa"); new MutationObserver(() => { const a = vi.classList.contains("activa"); if (a && !activa) { ivCielo(); setTimeout(() => { ivUltima = 0; ivEntrada(); }, 120); } activa = a; }).observe(vi, { attributes: true, attributeFilter: ["class"] }); }
    ivPintarAnillos(); if (vi && vi.classList.contains("activa")) ivEntrada();
  }

  function arrancar() {
    try { envolverFirma(); envolverDeshacer(); instalarTemas(); instalarAnillos(); instalarPapelera(); instalarMeta(); instalarDiagnostico(); programarLimpieza(); instalarPendientes(); instalarEventoChip(); instalarComprobacionGlobos(); instalarVida(); instalarEstadisticasNuevas(); instalarAcento(); instalarTituloCompacto(); instalarInicioVivo(); instalarInteresados(); instalarRecuperacionEncaje(); instalarAccesibilidad(); aplicarTipografia(); } catch (e) { console.warn("[V269]", e); }
    document.addEventListener("click", e => { const n = e.target.closest && e.target.closest(".nav-item"); if (n) setTimeout(() => { pintarAnillos(); if (n.dataset.vista === "estadisticas") animarAnillos(); }, 120); });
    window.MiServicioV269 = { faseInicio: ivFase, datosAnillos, aplicarTema, TEMAS, leerPapelera: limpiarPapelera, enviarAPapelera, derivarFirma, pendientes, errores, reunirDiagnostico, limpiarCaches, candidatosEventos, comprobarGlobos, globosFallan, leerInteresados };
  }
  if (document.readyState === "complete") setTimeout(arrancar, 0);
  else window.addEventListener("load", () => setTimeout(arrancar, 0), { once: true });
})();
