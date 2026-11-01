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

  function arrancar() {
    try { envolverFirma(); envolverDeshacer(); instalarTemas(); instalarAnillos(); instalarPapelera(); aplicarTipografia(); } catch (e) { console.warn("[V269]", e); }
    document.addEventListener("click", e => { const n = e.target.closest && e.target.closest(".nav-item"); if (n) setTimeout(() => { pintarAnillos(); if (n.dataset.vista === "estadisticas") animarAnillos(); }, 120); });
    window.MiServicioV269 = { datosAnillos, aplicarTema, TEMAS, leerPapelera: limpiarPapelera, enviarAPapelera, derivarFirma };
  }
  if (document.readyState === "complete") setTimeout(arrancar, 0);
  else window.addEventListener("load", () => setTimeout(arrancar, 0), { once: true });
})();
