/* Mi Servicio · V268
   1. Búsqueda inteligente en Historial (lenguaje natural)
   2. Transiciones suaves entre pantallas
   No cambia claves ni estructuras de datos.
*/
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const NOMBRES_MES = MESES.map(m => m.charAt(0).toUpperCase() + m.slice(1));
  const PARADAS = new Set(["de", "del", "el", "la", "los", "las", "en", "y", "a", "al", "registro", "registros", "actividad", "actividades", "todo", "todos", "que", "un", "una", "por", "para", "mis", "mi", "dia", "dias"]);

  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("es").trim(); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function hoyBase() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); }
  function sumDias(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmt(min) { min = Math.round(min); const h = Math.floor(min / 60), m = min % 60; return h && m ? h + " h " + m + " min" : h ? h + " h" : m + " min"; }
  function nombreTipo(t) { try { return typeof nombreActividad === "function" ? nombreActividad(t) : t; } catch (e) { return t; } }

  /* ================= 1. BÚSQUEDA INTELIGENTE ================= */
  function ultimoMes(m, anio) {
    const h = hoyBase();
    if (anio) return new Date(anio, m, 1, 12);
    let a = h.getFullYear(); if (m > h.getMonth()) a--; // el más reciente que ya empezó
    return new Date(a, m, 1, 12);
  }
  function rangoMes(base) { return [iso(new Date(base.getFullYear(), base.getMonth(), 1, 12)), iso(new Date(base.getFullYear(), base.getMonth() + 1, 0, 12))]; }

  /* Interpreta el texto. Devuelve { desde, hasta, tipos, minMin, maxMin, companero:[], libres:[], chips:[], activa } */
  function interpretar(texto) {
    let t = " " + norm(texto) + " ";
    const r = { desde: null, hasta: null, tipos: [], minMin: null, maxMin: null, companero: [], libres: [], chips: [] };
    const h = hoyBase(); let m;
    const poner = (d1, d2, chip) => { if (r.desde === null || d1 > r.desde) r.desde = d1; if (r.hasta === null || d2 < r.hasta) r.hasta = d2; r.chips.push(chip); };
    const quitar = re => { const mm = re.exec(t); if (mm) t = t.replace(mm[0], " "); return mm; };

    // duración
    if ((m = quitar(/\s(mas de|mayor(?:es)? (?:de|que)|superior(?:es)? a|al menos|minimo|>=?)\s*(\d+(?:[.,]\d+)?)\s*(h|hs|hora|horas|min|mins|minuto|minutos)?\b/))) {
      const v = Number(m[2].replace(",", ".")), u = m[3] || "h", min = /^h/.test(u) ? v * 60 : v; r.minMin = min; r.minInc = /^(al menos|minimo|>=)/.test(m[1]); r.chips.push((r.minInc ? "al menos " : "más de ") + fmt(min));
    }
    if ((m = quitar(/\s(menos de|menor(?:es)? (?:de|que)|inferior(?:es)? a|maximo|hasta|<=?)\s*(\d+(?:[.,]\d+)?)\s*(h|hs|hora|horas|min|mins|minuto|minutos)?\b/))) {
      const v = Number(m[2].replace(",", ".")), u = m[3] || "h", min = /^h/.test(u) ? v * 60 : v; r.maxMin = min; r.maxInc = /^(maximo|hasta|<=)/.test(m[1]); r.chips.push((r.maxInc ? "hasta " : "menos de ") + fmt(min));
    }
    // fechas relativas
    if ((m = quitar(/\sultimos?\s+(\d{1,3})\s*(dias|semanas|meses)\b/))) {
      const n = Number(m[1]), u = m[2]; const dias = u === "dias" ? n : u === "semanas" ? n * 7 : n * 30;
      poner(iso(sumDias(h, -(dias - 1))), iso(h), "últimos " + n + " " + u);
    }
    if (quitar(/\santeayer\b/)) { const d = iso(sumDias(h, -2)); poner(d, d, "anteayer"); }
    else if (quitar(/\sayer\b/)) { const d = iso(sumDias(h, -1)); poner(d, d, "ayer"); }
    else if (quitar(/\shoy\b/)) { const d = iso(h); poner(d, d, "hoy"); }
    if (quitar(/\ssemana pasada\b/)) { const w = (h.getDay() + 6) % 7, l = sumDias(h, -w - 7); poner(iso(l), iso(sumDias(l, 6)), "semana pasada"); }
    else if (quitar(/\s(?:esta|la) semana\b/)) { const w = (h.getDay() + 6) % 7, l = sumDias(h, -w); poner(iso(l), iso(sumDias(l, 6)), "esta semana"); }
    if (quitar(/\smes pasado\b/)) { const b = new Date(h.getFullYear(), h.getMonth() - 1, 1, 12), [a, z] = rangoMes(b); poner(a, z, NOMBRES_MES[b.getMonth()] + " " + b.getFullYear()); }
    else if (quitar(/\s(?:este|el) mes\b/)) { const [a, z] = rangoMes(h); poner(a, z, "este mes"); }
    if (quitar(/\sano pasado\b/)) { const y = h.getFullYear() - 1; poner(y + "-01-01", y + "-12-31", "año " + y); }
    else if (quitar(/\s(?:este|el) ano\b/)) { const y = h.getFullYear(); poner(y + "-01-01", y + "-12-31", "este año"); }
    // fechas absolutas
    if ((m = quitar(/\s(\d{4})-(\d{2})-(\d{2})\b/))) { const d = m[1] + "-" + m[2] + "-" + m[3]; poner(d, d, d); }
    else if ((m = quitar(/\s(\d{4})-(\d{2})\b/))) { const b = new Date(Number(m[1]), Number(m[2]) - 1, 1, 12), [a, z] = rangoMes(b); poner(a, z, NOMBRES_MES[b.getMonth()] + " " + b.getFullYear()); }
    const reDia = new RegExp("\\s(\\d{1,2})\\s*(?:de\\s+)?(" + MESES.join("|") + ")(?:\\s*(?:de\\s+)?(20\\d{2}))?\\b");
    if ((m = quitar(reDia))) { const mes = MESES.indexOf(m[2]), base = ultimoMes(mes, m[3] ? Number(m[3]) : null), d = iso(new Date(base.getFullYear(), mes, Number(m[1]), 12)); poner(d, d, Number(m[1]) + " de " + m[2] + (m[3] ? " " + m[3] : "")); }
    else {
      const reMes = new RegExp("\\s(" + MESES.join("|") + ")(?:\\s*(?:de\\s+)?(20\\d{2}))?\\b");
      if ((m = quitar(reMes))) { const mes = MESES.indexOf(m[1]), base = ultimoMes(mes, m[2] ? Number(m[2]) : null), [a, z] = rangoMes(base); poner(a, z, NOMBRES_MES[mes] + " " + base.getFullYear()); }
      else if ((m = quitar(/\s(20\d{2})\b/))) { poner(m[1] + "-01-01", m[1] + "-12-31", "año " + m[1]); }
    }
    // actividades
    const tiposDef = [["ministerio", /\sministerio\b/], ["ldc", /\sldc\b/], ["asambleas", /\sasambleas?\b/], ["otras", /\sotras?\b/]];
    tiposDef.forEach(([tp, re]) => { if (quitar(re)) { r.tipos.push(tp); r.chips.push(nombreTipo(tp)); } });
    // "con Nombre"
    if ((m = quitar(/\scon\s+([a-zñ ]+?)\s*$/))) {
      r.companero = m[1].split(/\s+/).filter(x => x && !PARADAS.has(x));
      if (r.companero.length) r.chips.push("con " + r.companero.join(" ")); }
    // resto: palabras libres (AND)
    r.libres = t.split(/\s+/).filter(x => x && !PARADAS.has(x));
    r.libres.forEach(x => r.chips.push("«" + x + "»"));
    r.activa = r.chips.length > 0;
    return r;
  }

  const cache = { q: null, r: null };
  function interpretarCache(q) { if (cache.q !== q) { cache.q = q; cache.r = interpretar(q); } return cache.r; }
  function textoRegistro(reg) { return norm([reg.companero, reg.acompanante, reg["compañero"], reg.notas, reg.tipo, nombreTipo(reg.tipo), reg.fecha].filter(Boolean).join(" ")); }
  function textoCompanero(reg) { return norm([reg.companero, reg.acompanante, reg["compañero"]].filter(Boolean).join(" ")); }
  function coincide(reg, q) {
    if (!q || !String(q).trim()) return true;
    const p = interpretarCache(String(q));
    const f = String(reg.fecha || "").slice(0, 10), min = Math.max(0, Number(reg.minutos) || 0);
    if (p.desde && f < p.desde) return false;
    if (p.hasta && f > p.hasta) return false;
    if (p.tipos.length && !p.tipos.includes(reg.tipo)) return false;
    if (p.minMin !== null && !(p.minInc ? min >= p.minMin : min > p.minMin)) return false;
    if (p.maxMin !== null && !(p.maxInc ? min <= p.maxMin : min < p.maxMin)) return false;
    if (p.companero.length) { const c = textoCompanero(reg); if (!p.companero.every(x => c.includes(x))) return false; }
    if (p.libres.length) { const tr = textoRegistro(reg); if (!p.libres.every(x => tr.includes(x))) return false; }
    return true;
  }
  function pintarInterpretacion() {
    const inp = $("buscarHistorialV260"), host = $("interpretacionBusquedaV268"); if (!inp || !host) return;
    const q = inp.value.trim();
    if (!q) { host.hidden = true; host.textContent = ""; return; }
    const p = interpretarCache(q);
    host.hidden = false; host.textContent = "";
    const chips = document.createElement("div"); chips.className = "chips-busqueda-v268";
    p.chips.forEach(c => { const s = document.createElement("span"); s.textContent = c; chips.appendChild(s); });
    host.appendChild(chips);
    let lista = [];
    try { lista = typeof obtenerRegistrosFiltrados === "function" ? obtenerRegistrosFiltrados() : []; } catch (e) {}
    const total = lista.reduce((a, r) => a + Math.max(0, Number(r.minutos) || 0), 0);
    const resumen = document.createElement("p"); resumen.className = "resumen-busqueda-v268"; resumen.setAttribute("role", "status");
    resumen.textContent = lista.length ? lista.length + (lista.length === 1 ? " registro" : " registros") + " · " + fmt(total) : "Sin resultados";
    host.appendChild(resumen);
  }
  function instalarBusqueda() {
    const inp = $("buscarHistorialV260"); if (!inp || inp.dataset.v268) return; inp.dataset.v268 = "1";
    try { window.coincideBusquedaV260 = coincide; } catch (e) { console.warn("[V268] búsqueda", e); }
    inp.placeholder = "Ej.: ayer, octubre con Marta";
    const host = document.createElement("div"); host.id = "interpretacionBusquedaV268"; host.className = "interpretacion-busqueda-v268"; host.hidden = true;
    inp.insertAdjacentElement("afterend", host);
    let t = 0; const refrescar = () => { clearTimeout(t); t = setTimeout(pintarInterpretacion, 60); };
    inp.addEventListener("input", refrescar);
    document.querySelectorAll(".filtro-historial").forEach(b => b.addEventListener("click", refrescar));
    window.addEventListener("miServicio:registroGuardadoV188", refrescar);
    window.MiServicioV268 = Object.assign(window.MiServicioV268 || {}, { interpretar, coincide });
  }

  /* ================= 2. TRANSICIONES ================= */
  const ORDEN = ["inicio", "registrar", "historial", "estadisticas", "ajustes"];
  function movReducido() { try { return window.matchMedia("(prefers-reduced-motion:reduce)").matches; } catch (e) { return false; } }
  function instalarTransiciones() {
    const vistas = Array.from(document.querySelectorAll(".vista")); if (!vistas.length) return;
    let previa = (vistas.find(v => v.classList.contains("activa")) || {}).id || "", arranque = performance.now();
    const obs = new MutationObserver(muts => {
      for (const mu of muts) {
        const el = mu.target;
        if (!el.classList.contains("activa") || el.id === previa) continue;
        const nueva = el.id, ia = ORDEN.indexOf(previa.replace("vista-", "")), ib = ORDEN.indexOf(nueva.replace("vista-", ""));
        previa = nueva;
        if (movReducido() || performance.now() - arranque < 1500) return;
        const dir = ib >= ia ? "der" : "izq";
        // Un bloque con elementos de posición fija (p. ej. el botón «+») no se desplaza: solo funde.
        Array.from(el.children).forEach(h => {
          let fijo = false; const todos = h.querySelectorAll("*");
          if (todos.length > 1500) fijo = true;
          else for (let i = 0; i < todos.length && !fijo; i++) { if (getComputedStyle(todos[i]).position === "fixed") fijo = true; }
          if (getComputedStyle(h).position === "fixed") fijo = true;
          if (fijo) h.setAttribute("data-fundir-v268", ""); else h.removeAttribute("data-fundir-v268");
        });
        el.dataset.transV268 = dir; void el.offsetWidth;
        clearTimeout(el._tv268); el._tv268 = setTimeout(() => { delete el.dataset.transV268; }, 520);
      }
    });
    vistas.forEach(v => obs.observe(v, { attributes: true, attributeFilter: ["class"] }));
  }

  function arrancar() {
    try { instalarBusqueda(); instalarTransiciones(); } catch (e) { console.warn("[V268]", e); }
    window.MiServicioV268 = Object.assign(window.MiServicioV268 || {}, { interpretar, coincide });
  }
  if (document.readyState === "complete") setTimeout(arrancar, 0);
  else window.addEventListener("load", () => setTimeout(arrancar, 0), { once: true });
})();
