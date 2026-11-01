/* Mi Servicio · V267
   1. Globo líquido (Inicio)      2. Logros con medallas
   3. Calendario de calor anual   4. Resumen del mes (Wrapped) + imagen para compartir
   Todo se calcula a partir de los registros existentes. No cambia claves ni estructuras.
   Claves nuevas (solo preferencias locales): miServicio.globoLiquidoV267, miServicio.globoInclinaV267
   (van en las copias como ajustes de apariencia), miServicio.logrosVistosV267, miServicio.wrappedVistoV267
   (solo este dispositivo).
*/
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const K_LIQ = "miServicio.globoLiquidoV267", K_INC = "miServicio.globoInclinaV267";
  const K_LOGROS = "miServicio.logrosVistosV267", K_WRAP = "miServicio.wrappedVistoV267";
  const COLORES = { ministerio: "#3478f6", ldc: "#ed8abb", asambleas: "#f5a623", otras: "#9a80e8" };
  const TIPOS = ["ministerio", "ldc", "asambleas", "otras"];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function movReducido() { try { return window.matchMedia("(prefers-reduced-motion:reduce)").matches; } catch (e) { return false; } }
  const mayus = s => s.charAt(0).toUpperCase() + s.slice(1);
  function fmt(min) {
    min = Math.round(Math.max(0, Number(min) || 0));
    const h = Math.floor(min / 60), m = min % 60;
    if (h && m) return h + " h " + m + " min";
    return h ? h + " h" : m + " min";
  }
  function nombreTipo(t) { try { return typeof nombreActividad === "function" ? nombreActividad(t) : t; } catch (e) { return t; } }
  function objetivoMensual() { try { return Number(estado.preferencias && estado.preferencias.objetivoMensualMinutos) || 0; } catch (e) { return 0; } }
  function fechaISO(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function deISO(s) { const p = String(s).slice(0, 10).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2], 12); }
  function claveMes(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  function nombreMes(clave) { const p = clave.split("-").map(Number); return MESES[p[1] - 1] + " de " + p[0]; }
  function sumarMeses(clave, n) { const p = clave.split("-").map(Number); return claveMes(new Date(p[0], p[1] - 1 + n, 1, 12)); }

  /* ---------- Datos ---------- */
  function registros() {
    try { return (estado.registros || []).filter(r => r && /^\d{4}-\d{2}-\d{2}/.test(String(r.fecha))); } catch (e) { return []; }
  }
  function porDia(regs) {
    const mapa = new Map();
    regs.forEach(r => {
      const f = String(r.fecha).slice(0, 10), m = Math.max(0, Number(r.minutos) || 0);
      if (!mapa.has(f)) mapa.set(f, { min: 0, tipos: {} });
      const d = mapa.get(f); d.min += m; d.tipos[r.tipo] = (d.tipos[r.tipo] || 0) + m;
    });
    return mapa;
  }
  function computable(regsMes) {
    try { return calcularComputoMesMeta(regsMes).computable; } catch (e) { return regsMes.reduce((a, r) => a + Math.max(0, Number(r.minutos) || 0), 0); }
  }
  function statsMes(clave, regs) {
    regs = regs || registros();
    const mes = regs.filter(r => String(r.fecha).startsWith(clave + "-"));
    const dias = porDia(mes), tipos = {};
    TIPOS.forEach(t => tipos[t] = 0);
    mes.forEach(r => { const t = TIPOS.includes(r.tipo) ? r.tipo : "otras"; tipos[t] += Math.max(0, Number(r.minutos) || 0); });
    const total = TIPOS.reduce((a, t) => a + tipos[t], 0);
    let mejor = null; dias.forEach((d, f) => { if (d.min > 0 && (!mejor || d.min > mejor.min)) mejor = { fecha: f, min: d.min }; });
    const activos = Array.from(dias.entries()).filter(([, d]) => d.min > 0).map(([f]) => f).sort();
    let racha = 0, cur = 0, prev = null;
    activos.forEach(f => { const d = deISO(f); cur = (prev && Math.round((d - prev) / 86400000) === 1) ? cur + 1 : 1; racha = Math.max(racha, cur); prev = d; });
    const ant = sumarMeses(clave, -1), antTotal = regs.filter(r => String(r.fecha).startsWith(ant + "-")).reduce((a, r) => a + Math.max(0, Number(r.minutos) || 0), 0);
    return { clave, total, tipos, computable: computable(mes), diasActivos: activos.length, mejor, racha, promedio: activos.length ? Math.round(total / activos.length) : 0, anterior: antTotal, dias, registros: mes.length };
  }

  /* ================= 1. GLOBO LÍQUIDO ================= */
  const liquidoOn = () => ls(K_LIQ) !== "no";
  function nivelMes() {
    const obj = objetivoMensual(); if (obj <= 0) return null;
    const clave = claveMes(new Date()), c = computable(registros().filter(r => String(r.fecha).startsWith(clave + "-")));
    if (c <= 0) return 0;
    return Math.max(0.07, Math.min(1, c / obj));
  }
  function pintarLiquido() {
    const g = $("graficoInicio"); if (!g) return;
    const centro = g.querySelector(".orbita-centro");
    document.body.classList.toggle("globo-liquido-v267", liquidoOn());
    if (centro) { const st = centro.querySelector("strong"); if (st && st.textContent.trim().length > 6) centro.setAttribute("data-largo-v267", ""); else centro.removeAttribute("data-largo-v267"); }
    let liq = centro && centro.querySelector(":scope > .liquido-v267");
    if (!centro || !liquidoOn()) { if (liq) liq.remove(); return; }
    const nivel = nivelMes();
    if (!liq) {
      liq = document.createElement("div"); liq.className = "liquido-v267"; liq.setAttribute("aria-hidden", "true");
      liq.innerHTML = '<div class="nivel-v267"><i class="ola-v267 ola-a"></i><i class="ola-v267 ola-b"></i></div><i class="brillo-v267"></i>';
      liq.style.setProperty("--nivel", "0");
      centro.insertBefore(liq, centro.firstChild);
      requestAnimationFrame(() => requestAnimationFrame(() => liq.style.setProperty("--nivel", String(nivel === null ? 0 : nivel))));
    } else if (liq.style.getPropertyValue("--nivel") !== String(nivel === null ? 0 : nivel)) {
      liq.style.setProperty("--nivel", String(nivel === null ? 0 : nivel));
    }
    liq.hidden = nivel === null || nivel === 0;
    centro.dataset.nivelV267 = nivel === null ? "" : String(Math.round(nivel * 100));
  }
  let obsGrafico = null;
  function instalarLiquido() {
    const g = $("graficoInicio"); if (!g || g.dataset.liquidoV267) return;
    g.dataset.liquidoV267 = "1";
    let pend = false;
    obsGrafico = new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; pintarLiquido(); }); });
    obsGrafico.observe(g, { childList: true });
    pintarLiquido();
    window.addEventListener("miServicio:registroGuardadoV188", () => {
      setTimeout(pintarLiquido, 150);
      const liq = g.querySelector(".liquido-v267"); if (!liq || movReducido()) return;
      liq.classList.remove("chapoteo"); void liq.offsetWidth; liq.classList.add("chapoteo");
      setTimeout(() => liq.classList.remove("chapoteo"), 1400);
    });
    // Inclinación del dispositivo (opcional; en iPhone requiere permiso).
    window.addEventListener("deviceorientation", e => {
      if (ls(K_INC) !== "si" || movReducido()) return;
      const liq = document.querySelector(".liquido-v267"); if (!liq) return;
      const gamma = Math.max(-45, Math.min(45, Number(e.gamma) || 0));
      liq.style.setProperty("--inclina", (-gamma * 0.45).toFixed(1) + "deg");
    });
  }
  function instalarAjustesGlobo() {
    if ($("globoLiquidoV267")) return;
    const ancla = document.querySelector(".estilo-superficies-v264 .ayuda-fondo-clima-v260"); if (!ancla) return;
    const div = document.createElement("div");
    div.innerHTML = '<label class="fondo-clima-opcion-v260"><input id="globoLiquidoV267" type="checkbox"><span>Globo de Inicio con líquido que sube con tu progreso</span></label>' +
      '<label class="fondo-clima-opcion-v260"><input id="globoInclinaV267" type="checkbox"><span>El líquido se inclina al mover el dispositivo</span></label>' +
      '<p class="ayuda-fondo-clima-v260" id="ayudaInclinaV267">En iPhone pedirá permiso de movimiento al activarlo. Necesita un objetivo mensual en Ajustes.</p>';
    ancla.insertAdjacentElement("beforebegin", div);
    const a = $("globoLiquidoV267"), b = $("globoInclinaV267");
    a.checked = liquidoOn(); b.checked = ls(K_INC) === "si";
    a.addEventListener("change", () => { lsSet(K_LIQ, a.checked ? "si" : "no"); pintarLiquido(); });
    b.addEventListener("change", async () => {
      if (!b.checked) { lsSet(K_INC, "no"); const l = document.querySelector(".liquido-v267"); if (l) l.style.setProperty("--inclina", "0deg"); return; }
      try {
        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
          const r = await DeviceOrientationEvent.requestPermission();
          if (r !== "granted") { b.checked = false; lsSet(K_INC, "no"); $("ayudaInclinaV267").textContent = "No se concedió el permiso de movimiento."; return; }
        }
      } catch (e) { b.checked = false; lsSet(K_INC, "no"); return; }
      lsSet(K_INC, "si");
    });
  }

  /* ================= 2. LOGROS ================= */
  const DEF_LOGROS = [
    { id: "primero", icono: "🌱", nombre: "Primer paso", desc: "Tu primer registro", tono: "verde" },
    { id: "racha3", icono: "🔥", nombre: "En marcha", desc: "3 días seguidos con actividad", tono: "naranja" },
    { id: "racha7", icono: "⚡", nombre: "Semana de constancia", desc: "7 días seguidos con actividad", tono: "oro" },
    { id: "racha14", icono: "🚀", nombre: "Imparable", desc: "14 días seguidos con actividad", tono: "oro" },
    { id: "semana", icono: "📅", nombre: "Semana completa", desc: "Actividad cada día de lunes a domingo", tono: "azul" },
    { id: "semanas4", icono: "🧭", nombre: "Un mes de rumbo", desc: "4 semanas seguidas con actividad", tono: "azul" },
    { id: "todas", icono: "🎨", nombre: "Todo en un mes", desc: "Las cuatro actividades en el mismo mes", tono: "violeta" },
    { id: "objetivo", icono: "🎯", nombre: "Objetivo cumplido", desc: "Alcanzar tu objetivo mensual", tono: "verde" },
    { id: "record", icono: "🏆", nombre: "Mes récord", desc: "Superar todos tus meses anteriores", tono: "oro" },
    { id: "h50", icono: "⏳", nombre: "50 horas", desc: "50 h acumuladas", tono: "plata" },
    { id: "h100", icono: "⌛", nombre: "100 horas", desc: "100 h acumuladas", tono: "plata" },
    { id: "h250", icono: "💎", nombre: "250 horas", desc: "250 h acumuladas", tono: "azul" },
    { id: "h500", icono: "👑", nombre: "500 horas", desc: "500 h acumuladas", tono: "oro" }
  ];
  function lunes(d) { const x = new Date(d); const w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); return fechaISO(x); }
  function calcularLogros(regs) {
    regs = regs || registros();
    const dias = porDia(regs), fechas = Array.from(dias.keys()).filter(f => dias.get(f).min > 0).sort();
    const ganados = {};
    if (!fechas.length) return { ganados, fechas, rachaActual: 0, horasTotales: 0 };
    ganados.primero = fechas[0];
    // rachas
    let cur = 0, prev = null; const rachaFecha = { 3: null, 7: null, 14: null };
    fechas.forEach(f => {
      const d = deISO(f); cur = (prev && Math.round((d - prev) / 86400000) === 1) ? cur + 1 : 1; prev = d;
      [3, 7, 14].forEach(n => { if (cur >= n && !rachaFecha[n]) rachaFecha[n] = f; });
    });
    if (rachaFecha[3]) ganados.racha3 = rachaFecha[3]; if (rachaFecha[7]) ganados.racha7 = rachaFecha[7]; if (rachaFecha[14]) ganados.racha14 = rachaFecha[14];
    // racha actual (hasta hoy o ayer)
    let rachaActual = 0; { const hoy = new Date(); hoy.setHours(12); let d = new Date(hoy); if (!dias.has(fechaISO(d)) || dias.get(fechaISO(d)).min <= 0) d.setDate(d.getDate() - 1);
      while (dias.has(fechaISO(d)) && dias.get(fechaISO(d)).min > 0) { rachaActual++; d.setDate(d.getDate() - 1); } }
    // semanas
    const semanas = new Map(); fechas.forEach(f => { const l = lunes(deISO(f)); if (!semanas.has(l)) semanas.set(l, []); semanas.get(l).push(f); });
    for (const [l, fs] of Array.from(semanas.entries()).sort()) { if (fs.length >= 7) { ganados.semana = fs[fs.length - 1]; break; } }
    const ls_ = Array.from(semanas.keys()).sort(); let seg = 0, pl = null;
    for (const l of ls_) { const d = deISO(l); seg = (pl && Math.round((d - pl) / 604800000) === 1) ? seg + 1 : 1; pl = d; if (seg >= 4) { ganados.semanas4 = semanas.get(l)[0]; break; } }
    // horas acumuladas
    let acc = 0; const umbrales = [[50, "h50"], [100, "h100"], [250, "h250"], [500, "h500"]];
    fechas.forEach(f => { acc += dias.get(f).min; umbrales.forEach(([h, id]) => { if (acc >= h * 60 && !ganados[id]) ganados[id] = f; }); });
    // meses
    const meses = new Map(); regs.forEach(r => { const m = String(r.fecha).slice(0, 7); if (!meses.has(m)) meses.set(m, []); meses.get(m).push(r); });
    const claves = Array.from(meses.keys()).sort(); let maxPrev = 0; const obj = objetivoMensual();
    claves.forEach((m, i) => {
      const rs = meses.get(m), tot = rs.reduce((a, r) => a + Math.max(0, Number(r.minutos) || 0), 0);
      const fs = Array.from(new Set(rs.filter(r => (Number(r.minutos) || 0) > 0).map(r => String(r.fecha).slice(0, 10)))).sort();
      if (!ganados.todas) { const vistos = new Set(); const orden = rs.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))); for (const r of orden) { if ((Number(r.minutos) || 0) > 0 && TIPOS.includes(r.tipo)) vistos.add(r.tipo); if (vistos.size === 4) { ganados.todas = String(r.fecha).slice(0, 10); break; } } }
      if (!ganados.objetivo && obj > 0 && computable(rs) >= obj) {
        let a2 = 0; for (const f of fs) { a2 += dias.get(f).min; if (a2 >= obj) { ganados.objetivo = f; break; } }
        if (!ganados.objetivo) ganados.objetivo = fs[fs.length - 1];
      }
      if (!ganados.record && i >= 2 && maxPrev > 0 && tot > maxPrev && fs.length) ganados.record = fs[fs.length - 1];
      maxPrev = Math.max(maxPrev, tot);
    });
    return { ganados, fechas, rachaActual, horasTotales: acc };
  }
  function fechaCorta(f) { const d = deISO(f); return d.getDate() + " " + MESES[d.getMonth()].slice(0, 3) + " " + d.getFullYear(); }
  function pistaLogro(def, info) {
    if (def.id.startsWith("racha")) { const n = Number(def.id.slice(5)); return "Racha actual: " + info.rachaActual + " de " + n + " días"; }
    if (def.id.startsWith("h")) { const n = Number(def.id.slice(1)); return "Llevas " + Math.floor(info.horasTotales / 60) + " de " + n + " h"; }
    return def.desc;
  }
  function medallaHTML(def, ganada) {
    return '<span class="medalla-v267' + (ganada ? "" : " bloqueada") + '" data-tono="' + def.tono + '"><i class="canto"></i><i class="cara"><b>' + (ganada ? def.icono : "🔒") + '</b></i><i class="brillo"></i></span>';
  }
  function pintarLogros() {
    const host = $("logrosV267"); if (!host) return;
    const info = calcularLogros(), n = DEF_LOGROS.filter(d => info.ganados[d.id]).length;
    host.querySelector(".logros-resumen-v267").textContent = n + " de " + DEF_LOGROS.length + " conseguidos" + (info.rachaActual > 1 ? " · Racha actual: " + info.rachaActual + " días" : "");
    const rej = host.querySelector(".logros-rejilla-v267"); rej.textContent = "";
    DEF_LOGROS.slice().sort((a, b) => (info.ganados[b.id] ? 1 : 0) - (info.ganados[a.id] ? 1 : 0)).forEach(def => {
      const g = info.ganados[def.id];
      const b = document.createElement("button"); b.type = "button"; b.className = "logro-v267"; b.dataset.id = def.id;
      b.setAttribute("aria-label", def.nombre + ". " + (g ? "Conseguido el " + fechaCorta(g) : "Por conseguir. " + pistaLogro(def, info)));
      b.innerHTML = medallaHTML(def, !!g) + '<strong></strong><small></small>';
      b.querySelector("strong").textContent = def.nombre; b.querySelector("small").textContent = g ? fechaCorta(g) : "Por conseguir";
      b.addEventListener("click", () => { const t = host.querySelector(".logro-detalle-v267"); t.textContent = def.nombre + " · " + (g ? "conseguido el " + fechaCorta(g) : pistaLogro(def, info)); });
      rej.appendChild(b);
    });
  }
  function instalarLogros() {
    if ($("logrosV267")) { pintarLogros(); return; }
    const ancla = $("statsPeriodoV183"); if (!ancla) return;
    const s = document.createElement("section"); s.id = "logrosV267"; s.className = "tarjeta logros-v267";
    s.innerHTML = '<h2 class="titulo-bloque-v267">Logros</h2><p class="logros-resumen-v267"></p><div class="logros-rejilla-v267"></div><p class="logro-detalle-v267" role="status">Toca una medalla para ver el detalle.</p>';
    ancla.insertAdjacentElement("beforebegin", s); pintarLogros();
  }
  // Celebración de logros nuevos
  let colaCelebracion = [], celebrando = false;
  function confeti(host) {
    if (movReducido()) return;
    const cols = ["#f5a623", "#3478f6", "#ed8abb", "#9a80e8", "#34c759"];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement("i"); p.className = "confeti-v267";
      p.style.setProperty("--x", (Math.random() * 100).toFixed(1) + "%"); p.style.setProperty("--d", (Math.random() * 0.6).toFixed(2) + "s");
      p.style.setProperty("--r", Math.round(Math.random() * 720 - 360) + "deg"); p.style.background = cols[i % cols.length];
      host.appendChild(p);
    }
  }
  function celebrar() {
    if (celebrando || !colaCelebracion.length) return;
    const def = colaCelebracion.shift(); celebrando = true;
    const o = document.createElement("div"); o.id = "celebracionV267"; o.className = "celebracion-v267"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Nuevo logro");
    o.innerHTML = '<div class="tarjeta-celebracion"><small>NUEVO LOGRO</small>' + medallaHTML(def, true) + '<h3></h3><p></p><button type="button" class="boton-guardar">¡Genial!</button></div>';
    o.querySelector("h3").textContent = def.nombre; o.querySelector("p").textContent = def.desc;
    document.body.appendChild(o); confeti(o);
    const cerrar = () => { o.remove(); celebrando = false; setTimeout(celebrar, 250); };
    o.querySelector("button").addEventListener("click", cerrar); o.querySelector("button").focus();
  }
  function revisarLogrosNuevos(silencioso) {
    const info = calcularLogros(); const ids = Object.keys(info.ganados);
    let vistos = null; try { vistos = JSON.parse(ls(K_LOGROS) || "null"); } catch (e) {}
    if (!Array.isArray(vistos)) { lsSet(K_LOGROS, JSON.stringify(ids)); return; } // primer uso: sin avalancha
    const nuevos = ids.filter(i => !vistos.includes(i));
    if (!nuevos.length) return;
    lsSet(K_LOGROS, JSON.stringify(Array.from(new Set(vistos.concat(nuevos)))));
    if (silencioso) return;
    nuevos.forEach(i => { const d = DEF_LOGROS.find(x => x.id === i); if (d) colaCelebracion.push(d); });
    celebrar();
  }

  /* ================= 3. CALENDARIO DE CALOR ================= */
  let anioServicio = null; // año en que termina (ago)
  function anioServicioActual() { const h = new Date(); return h.getMonth() >= 8 ? h.getFullYear() + 1 : h.getFullYear(); }
  function nivelCalor(min) { return min <= 0 ? 0 : min < 60 ? 1 : min < 120 ? 2 : min < 180 ? 3 : 4; }
  function pintarCalor() {
    const host = $("calorAnualV267"); if (!host) return;
    if (anioServicio === null) anioServicio = anioServicioActual();
    const regs = registros(), dias = porDia(regs);
    host.querySelector(".calor-titulo-v267").textContent = "Año de servicio " + anioServicio;
    host.querySelector(".calor-sub-v267").textContent = "septiembre " + (anioServicio - 1) + " – agosto " + anioServicio;
    const cuerpo = host.querySelector(".calor-meses-v267"); cuerpo.textContent = "";
    let totalMin = 0, activos = 0; const hoy = fechaISO(new Date());
    for (let i = 0; i < 12; i++) {
      const base = new Date(anioServicio - 1, 8 + i, 1, 12), y = base.getFullYear(), m = base.getMonth();
      const mes = document.createElement("div"); mes.className = "calor-mes-v267";
      const t = document.createElement("small"); t.textContent = MESES[m].slice(0, 3).toUpperCase(); mes.appendChild(t);
      const rej = document.createElement("div"); rej.className = "calor-rejilla-v267";
      const primero = (new Date(y, m, 1, 12).getDay() + 6) % 7, nd = new Date(y, m + 1, 0).getDate();
      for (let k = 0; k < primero; k++) rej.appendChild(document.createElement("span"));
      for (let d = 1; d <= nd; d++) {
        const f = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"), info = dias.get(f), min = info ? info.min : 0;
        const c = document.createElement("button"); c.type = "button"; c.className = "calor-dia-v267"; c.dataset.f = f; c.dataset.n = String(nivelCalor(min));
        if (f === hoy) c.classList.add("hoy"); if (f > hoy) c.classList.add("futuro");
        c.setAttribute("aria-label", f + (min ? ": " + fmt(min) : ": sin actividad"));
        if (min > 0) { totalMin += min; activos++; }
        rej.appendChild(c);
      }
      mes.appendChild(rej); cuerpo.appendChild(mes);
    }
    host.querySelector(".calor-resumen-v267").textContent = activos + (activos === 1 ? " día activo" : " días activos") + " · " + fmt(totalMin);
    host.querySelector(".calor-detalle-v267").textContent = "Toca un día para ver su actividad.";
  }
  function instalarCalor() {
    if ($("calorAnualV267")) { pintarCalor(); return; }
    const ancla = $("metaDetalleV260"); if (!ancla) return;
    const s = document.createElement("section"); s.id = "calorAnualV267"; s.className = "tarjeta calor-v267";
    s.innerHTML = '<div class="calor-cab-v267"><button type="button" class="boton-periodo" data-a="-1" aria-label="Año de servicio anterior">‹</button><div><h2 class="calor-titulo-v267"></h2><p class="calor-sub-v267"></p></div><button type="button" class="boton-periodo" data-a="1" aria-label="Año de servicio siguiente">›</button></div>' +
      '<p class="calor-resumen-v267"></p><div class="calor-meses-v267"></div>' +
      '<div class="calor-leyenda-v267" aria-hidden="true"><span>Menos</span><i data-n="0"></i><i data-n="1"></i><i data-n="2"></i><i data-n="3"></i><i data-n="4"></i><span>Más</span></div>' +
      '<p class="calor-detalle-v267" role="status"></p>';
    ancla.insertAdjacentElement("beforebegin", s);
    s.addEventListener("click", e => {
      const a = e.target.closest("[data-a]"); if (a) { anioServicio += Number(a.dataset.a); pintarCalor(); return; }
      const d = e.target.closest(".calor-dia-v267"); if (!d) return;
      s.querySelectorAll(".calor-dia-v267.sel").forEach(x => x.classList.remove("sel")); d.classList.add("sel");
      const f = d.dataset.f, fecha = deISO(f), regs = registros().filter(r => String(r.fecha).slice(0, 10) === f);
      const tipos = Array.from(new Set(regs.filter(r => (Number(r.minutos) || 0) > 0).map(r => nombreTipo(r.tipo))));
      const min = regs.reduce((acc, r) => acc + Math.max(0, Number(r.minutos) || 0), 0);
      s.querySelector(".calor-detalle-v267").textContent = mayus(DIAS[fecha.getDay()]) + " " + fecha.getDate() + " de " + MESES[fecha.getMonth()] + " · " + (min ? fmt(min) + (tipos.length ? " · " + tipos.join(", ") : "") : "sin actividad");
    });
    pintarCalor();
  }

  /* ================= 4. RESUMEN DEL MES (WRAPPED) ================= */
  let wrap = null; // { clave, i, slides[] }
  function construirSlides(clave) {
    const s = statsMes(clave), obj = objetivoMensual(), nombre = mayus(MESES[Number(clave.slice(5)) - 1]);
    const slides = [];
    slides.push({ cls: "intro", html: '<small>Tu mes en Mi Servicio</small><h2>' + nombre + '</h2><p>' + clave.slice(0, 4) + '</p><span class="pista">Toca para continuar ›</span>' });
    if (!s.registros) { slides.push({ cls: "vacio", html: '<h2>Sin actividad registrada</h2><p>Este mes no hay registros. Cuando registres actividad, aquí verás tu resumen.</p>' }); return { s, slides }; }
    const pct = obj > 0 ? Math.min(100, Math.round(s.computable / obj * 100)) : null;
    const dif = s.anterior > 0 ? s.total - s.anterior : null;
    slides.push({ cls: "total", html: '<small>Total del mes</small><div class="globo-wrap"><div class="globo-w"><div class="liquido-w" style="--nivel:' + (pct === null ? 0.5 : Math.max(0.08, pct / 100)) + '"><div class="nivel-v267"><i class="ola-v267 ola-a"></i><i class="ola-v267 ola-b"></i></div></div><strong data-cuenta="' + s.total + '">' + fmt(s.total) + '</strong></div></div>' +
      (pct !== null ? '<p>' + pct + '% de tu objetivo de ' + fmt(obj) + '</p>' : '<p>Pon un objetivo mensual en Ajustes para ver tu avance.</p>') +
      (dif !== null ? '<p class="dif ' + (dif >= 0 ? "sube" : "baja") + '">' + (dif >= 0 ? "▲ " : "▼ ") + fmt(Math.abs(dif)) + ' respecto a ' + MESES[Number(sumarMeses(clave, -1).slice(5)) - 1] + '</p>' : '') });
    const filas = TIPOS.filter(t => s.tipos[t] > 0).map(t => '<div class="fila-barra"><span>' + (nombreTipo(t)) + '</span><div class="pista-barra"><i style="--w:' + Math.round(s.tipos[t] / s.total * 100) + '%;background:' + COLORES[t] + '"></i></div><b>' + fmt(s.tipos[t]) + '</b></div>').join("");
    slides.push({ cls: "reparto", html: '<small>¿En qué dedicaste tu tiempo?</small><div class="barras-w">' + filas + '</div>' });
    const mejorTxt = s.mejor ? (function () { const d = deISO(s.mejor.fecha); return mayus(DIAS[d.getDay()]) + " " + d.getDate() + " · " + fmt(s.mejor.min); })() : "—";
    slides.push({ cls: "dias", html: '<small>Tu constancia</small><div class="datos-w"><div><strong data-cuenta="' + s.diasActivos + '">' + s.diasActivos + '</strong><span>' + (s.diasActivos === 1 ? "día activo" : "días activos") + '</span></div><div><strong data-cuenta="' + s.racha + '">' + s.racha + '</strong><span>racha más larga (días)</span></div><div><strong>' + fmt(s.promedio) + '</strong><span>por día activo</span></div></div><p>Tu mejor día: ' + mejorTxt + '</p>' });
    const nd = new Date(Number(clave.slice(0, 4)), Number(clave.slice(5)), 0).getDate(), prim = (new Date(Number(clave.slice(0, 4)), Number(clave.slice(5)) - 1, 1, 12).getDay() + 6) % 7;
    let celdas = "<span></span>".repeat(prim);
    for (let d = 1; d <= nd; d++) { const f = clave + "-" + String(d).padStart(2, "0"), i = s.dias.get(f); celdas += '<i class="c" data-n="' + nivelCalor(i ? i.min : 0) + '" style="--i:' + d + '"></i>'; }
    slides.push({ cls: "calendario", html: '<small>Tu mes día a día</small><div class="mini-cal">' + celdas + '</div><p>' + s.diasActivos + ' de ' + nd + ' días con actividad</p>' });
    const info = calcularLogros(), delMes = DEF_LOGROS.filter(d => info.ganados[d.id] && info.ganados[d.id].startsWith(clave));
    slides.push({ cls: "cierre", html: '<small>Para cerrar</small><h2>' + (pct !== null && pct >= 100 ? "¡Objetivo conseguido! 🎉" : "Gracias por tu esfuerzo ✨") + '</h2>' +
      (delMes.length ? '<div class="medallas-w">' + delMes.map(d => medallaHTML(d, true)).join("") + '</div><p>' + delMes.length + (delMes.length === 1 ? " logro nuevo este mes" : " logros nuevos este mes") + '</p>' : '<p>Cada rato cuenta. Sigue avanzando paso a paso.</p>') +
      '<div class="acciones-w"><button type="button" data-w="compartir" class="boton-guardar">↗ Compartir imagen</button><button type="button" data-w="cerrar" class="boton-secundario">Cerrar</button></div><p class="estado-w" role="status"></p>' });
    return { s, slides };
  }
  function cuentaArriba(host) {
    host.querySelectorAll("[data-cuenta]").forEach(el => {
      const fin = Number(el.dataset.cuenta), original = el.textContent;
      if (movReducido() || fin <= 0) return;
      const esMin = /h|min/.test(original), t0 = performance.now(), dur = 1100;
      const paso = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = fin * e; el.textContent = esMin ? fmt(v) : String(Math.round(v)); if (p < 1 && el.isConnected) requestAnimationFrame(paso); else el.textContent = original; };
      requestAnimationFrame(paso);
    });
  }
  function mostrarSlide() {
    const o = $("wrappedV267"); if (!o || !wrap) return;
    const sl = wrap.slides[wrap.i], cont = o.querySelector(".slide-v267");
    cont.className = "slide-v267 " + sl.cls; cont.innerHTML = sl.html; cont.classList.remove("entra"); void cont.offsetWidth; cont.classList.add("entra");
    o.querySelectorAll(".segmentos-w i").forEach((el, i) => el.classList.toggle("hecho", i <= wrap.i));
    o.querySelector(".mes-w").textContent = mayus(nombreMes(wrap.clave));
    o.querySelector('[data-w="ant"]').disabled = false;
    cuentaArriba(cont);
  }
  function cargarMes(clave) {
    const r = construirSlides(clave); wrap = { clave, i: 0, slides: r.slides, stats: r.s };
    const o = $("wrappedV267"), seg = o.querySelector(".segmentos-w"); seg.textContent = "";
    r.slides.forEach(() => seg.appendChild(document.createElement("i")));
    mostrarSlide();
  }
  function abrirWrapped(clave) {
    clave = clave || claveMes(new Date());
    if ($("wrappedV267")) $("wrappedV267").remove();
    const o = document.createElement("div"); o.id = "wrappedV267"; o.className = "wrapped-v267"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-label", "Resumen del mes");
    o.innerHTML = '<div class="segmentos-w"></div><div class="cab-w"><button type="button" data-w="ant" aria-label="Mes anterior">‹</button><span class="mes-w"></span><button type="button" data-w="sig" aria-label="Mes siguiente">›</button><button type="button" data-w="cerrar" class="x" aria-label="Cerrar">✕</button></div><div class="slide-v267"></div><div class="zona-w izq" data-w="atras" aria-hidden="true"></div><div class="zona-w der" data-w="adelante" aria-hidden="true"></div>';
    document.body.appendChild(o); document.body.classList.add("wrapped-abierto-v267");
    cargarMes(clave);
    o.addEventListener("click", e => {
      const b = e.target.closest("[data-w]"); if (!b || !wrap) return; const a = b.dataset.w;
      if (a === "cerrar") cerrarWrapped();
      else if (a === "adelante") { if (wrap.i < wrap.slides.length - 1) { wrap.i++; mostrarSlide(); } }
      else if (a === "atras") { if (wrap.i > 0) { wrap.i--; mostrarSlide(); } }
      else if (a === "ant") cargarMes(sumarMeses(wrap.clave, -1));
      else if (a === "sig") { if (wrap.clave < claveMes(new Date())) cargarMes(sumarMeses(wrap.clave, 1)); }
      else if (a === "compartir") compartirImagen(b);
    });
    o.addEventListener("keydown", e => { if (e.key === "Escape") cerrarWrapped(); if (e.key === "ArrowRight") o.querySelector('[data-w="adelante"]').click(); if (e.key === "ArrowLeft") o.querySelector('[data-w="atras"]').click(); });
    let x0 = null; o.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    o.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) o.querySelector('[data-w="' + (dx < 0 ? "adelante" : "atras") + '"]').click(); }, { passive: true });
    o.tabIndex = -1; o.focus();
    // Marcar como visto el mes anterior si es el que se ofrecía
    lsSet(K_WRAP, sumarMeses(claveMes(new Date()), -1) === clave ? clave : (ls(K_WRAP) || ""));
    const aviso = $("avisoWrappedV267"); if (aviso && sumarMeses(claveMes(new Date()), -1) === clave) aviso.remove();
  }
  function cerrarWrapped() { const o = $("wrappedV267"); if (o) o.remove(); document.body.classList.remove("wrapped-abierto-v267"); wrap = null; }

  /* Imagen para compartir (1080×1920) */
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function crearImagen(clave) {
    const s = statsMes(clave), obj = objetivoMensual(), cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920;
    const c = cv.getContext("2d"), fam = '-apple-system, "SF Pro Display", "Segoe UI", Roboto, system-ui, sans-serif';
    const g = c.createLinearGradient(0, 0, 1080, 1920); g.addColorStop(0, "#0b1d4a"); g.addColorStop(0.55, "#17408f"); g.addColorStop(1, "#0a1330");
    c.fillStyle = g; c.fillRect(0, 0, 1080, 1920);
    const rg = c.createRadialGradient(850, 260, 20, 850, 260, 620); rg.addColorStop(0, "rgba(130,180,255,.45)"); rg.addColorStop(1, "rgba(130,180,255,0)"); c.fillStyle = rg; c.fillRect(0, 0, 1080, 1100);
    c.textAlign = "center"; c.fillStyle = "rgba(255,255,255,.7)"; c.font = "600 40px " + fam; c.fillText("TU MES EN MI SERVICIO", 540, 170);
    c.fillStyle = "#fff"; c.font = "800 120px " + fam; c.fillText(mayus(MESES[Number(clave.slice(5)) - 1]), 540, 310);
    c.fillStyle = "rgba(255,255,255,.6)"; c.font = "500 44px " + fam; c.fillText(clave.slice(0, 4), 540, 375);
    // esfera con líquido
    const cx = 540, cy = 760, R = 270, pct = obj > 0 ? Math.min(1, s.computable / obj) : 0.5;
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
    c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    const top = cy + R - pct * R * 2, lg = c.createLinearGradient(0, top, 0, cy + R); lg.addColorStop(0, "#8fc0ff"); lg.addColorStop(1, "#2f6fe0");
    c.fillStyle = lg; c.beginPath(); c.moveTo(cx - R, cy + R); c.lineTo(cx - R, top);
    for (let x = -R; x <= R; x += 8) c.lineTo(cx + x, top + Math.sin(x / 38) * 11);
    c.lineTo(cx + R, cy + R); c.closePath(); c.fill(); c.restore();
    c.lineWidth = 8; c.strokeStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    const hl = c.createRadialGradient(cx - 100, cy - 130, 10, cx - 100, cy - 130, 170); hl.addColorStop(0, "rgba(255,255,255,.55)"); hl.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = hl; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fff"; c.font = "800 96px " + fam; c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 16; c.fillText(fmt(s.total), cx, cy + 28); c.shadowBlur = 0;
    c.font = "600 38px " + fam; c.fillStyle = "rgba(255,255,255,.85)"; c.fillText(obj > 0 ? Math.round(s.computable / obj * 100) + "% del objetivo" : "este mes", cx, cy + 90);
    // barras
    let y = 1170; const maxT = Math.max(1, ...TIPOS.map(t => s.tipos[t]));
    TIPOS.filter(t => s.tipos[t] > 0).forEach(t => {
      c.textAlign = "left"; c.fillStyle = "#fff"; c.font = "700 44px " + fam; c.fillText(nombreTipo(t), 90, y);
      c.textAlign = "right"; c.fillStyle = "rgba(255,255,255,.85)"; c.font = "600 44px " + fam; c.fillText(fmt(s.tipos[t]), 990, y);
      c.fillStyle = "rgba(255,255,255,.14)"; rr(c, 90, y + 22, 900, 26, 13); c.fill();
      c.fillStyle = COLORES[t]; rr(c, 90, y + 22, Math.max(26, 900 * s.tipos[t] / maxT), 26, 13); c.fill(); y += 118;
    });
    // datos
    c.textAlign = "center"; const datos = [[String(s.diasActivos), s.diasActivos === 1 ? "día activo" : "días activos"], [String(s.racha), "racha máx."], [fmt(s.promedio), "por día activo"]];
    datos.forEach((d, i) => { const x = 210 + i * 330; c.fillStyle = "#fff"; c.font = "800 66px " + fam; c.fillText(d[0], x, 1690); c.fillStyle = "rgba(255,255,255,.65)"; c.font = "500 34px " + fam; c.fillText(d[1], x, 1740); });
    c.fillStyle = "rgba(255,255,255,.45)"; c.font = "600 34px " + fam; c.fillText("Mi Servicio", 540, 1860);
    return cv;
  }
  async function compartirImagen(boton) {
    const estadoEl = boton.closest(".slide-v267").querySelector(".estado-w"), clave = wrap.clave;
    try {
      const cv = crearImagen(clave);
      const blob = await new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error("sin imagen")), "image/png"));
      const nombre = "MiServicio-" + clave + ".png", file = new File([blob], nombre, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        try { await navigator.share({ files: [file], title: "Mi mes en Mi Servicio" }); estadoEl.textContent = "Imagen compartida ✓"; return; }
        catch (e) { if (e && e.name === "AbortError") return; }
      }
      const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000); estadoEl.textContent = "Imagen descargada ✓";
    } catch (e) { estadoEl.textContent = "No se pudo crear la imagen."; }
  }
  function instalarBotonWrapped() {
    const cont = document.querySelector(".compartir-mes-v260"); if (!cont || $("wrappedBotonV267")) return;
    const b = document.createElement("button"); b.id = "wrappedBotonV267"; b.type = "button"; b.className = "boton-secundario boton-wrapped-v267"; b.textContent = "✨ Resumen del mes";
    b.addEventListener("click", () => { const inp = $("mesResumenV143"); abrirWrapped(inp && /^\d{4}-\d{2}$/.test(inp.value) ? inp.value : claveMes(new Date())); });
    cont.insertBefore(b, cont.firstChild);
  }
  function instalarAvisoInicio() {
    if ($("avisoWrappedV267")) return;
    const hoy = new Date(); if (hoy.getDate() > 6) return;
    const prev = sumarMeses(claveMes(hoy), -1); if (ls(K_WRAP) === prev) return;
    if (!registros().some(r => String(r.fecha).startsWith(prev + "-"))) return;
    const ancla = $("recordatorioCopiaInicio") || document.querySelector("#vista-inicio .seccion"); if (!ancla) return;
    const s = document.createElement("section"); s.id = "avisoWrappedV267"; s.className = "aviso-wrapped-v267";
    s.innerHTML = '<button type="button" class="abrir" data-a="abrir"><span class="chispa">✨</span><span><strong></strong><small>Toca para ver tu mes</small></span></button><button type="button" class="cerrar" data-a="cerrar" aria-label="Descartar">✕</button>';
    s.querySelector("strong").textContent = "Tu resumen de " + MESES[Number(prev.slice(5)) - 1] + " está listo";
    s.addEventListener("click", e => { const a = e.target.closest("[data-a]"); if (!a) return; if (a.dataset.a === "abrir") abrirWrapped(prev); else { lsSet(K_WRAP, prev); s.remove(); } });
    ancla.insertAdjacentElement("beforebegin", s);
  }

  /* ---------- Arranque ---------- */
  function refrescarEstadisticas() { try { pintarLogros(); pintarCalor(); } catch (e) {} }
  function arrancar() {
    try { instalarAjustesGlobo(); instalarLiquido(); instalarLogros(); instalarCalor(); instalarBotonWrapped(); instalarAvisoInicio(); } catch (e) { console.warn("[V267]", e); }
    revisarLogrosNuevos(true);
    window.addEventListener("miServicio:registroGuardadoV188", () => { setTimeout(() => { refrescarEstadisticas(); revisarLogrosNuevos(false); }, 400); });
    document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".nav-item")) setTimeout(refrescarEstadisticas, 120); });
    window.MiServicioV267 = { abrirWrapped, calcularLogros, statsMes, crearImagen, pintarLiquido };
  }
  if (document.readyState === "complete") setTimeout(arrancar, 0);
  else window.addEventListener("load", () => setTimeout(arrancar, 0), { once: true });
})();
