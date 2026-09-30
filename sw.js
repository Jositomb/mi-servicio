const CACHE = "mi-servicio-v19601";
const CACHE_PREFIX = "mi-servicio-";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles-v27.css?v=19601",
  "./app-v27.js?v=19601",
  "./eventos-calendario.js?v=19601",
  "./icon-apple.png",
  "./manifest.webmanifest",
  "./personaje-51219b70e7f1.png",
  "./personaje-5638b822e9ec.png",
  "./personaje-56dd433b1692.png",
  "./personaje-635d3bce67f2.png",
  "./personaje-698db747b8fb.png",
  "./personaje-95d7b35c957c.png",
  "./personaje-e4168da17cdf.png",
  "./personaje-e524cff3980b.png",
  "./personaje-ff4383d3590d.png",
  "./core/config.js",
  "./core/storage.js",
  "./tiempo.js",
  "./core/legacy-bridge.js",
  "./historial.js",
  "./historial-render.js",
  "./historial-edicion.js",
  "./estadisticas.js",
  "./estadisticas-render.js",
  "./registrar.js",
  "./planificacion.js"
];

const CRITICOS = [
  "./index.html",
  "./styles-v27.css?v=19601",
  "./app-v27.js?v=19601",
  "./core/config.js",
  "./core/storage.js"
];

async function buscarEnCualquierCache(request, opciones={}) {
  const actual = await caches.open(CACHE);
  let respuesta = await actual.match(request, opciones);
  if (respuesta) return respuesta;

  const nombres = (await caches.keys())
    .filter(n => n.startsWith(CACHE_PREFIX) && n !== CACHE)
    .reverse();

  for (const nombre of nombres) {
    const c = await caches.open(nombre);
    respuesta = await c.match(request, opciones);
    if (respuesta) return respuesta;
  }
  return null;
}

self.addEventListener("install", event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);

    // Precarga tolerante: una petición lenta no invalida toda la app.
    await Promise.all(APP_SHELL.map(async recurso=>{
      try {
        const req=new Request(recurso,{cache:"reload"});
        const res=await fetch(req);
        if(res && res.ok) await cache.put(recurso,res.clone());
      } catch(e) {
        // Si ya existía una versión utilizable, la conservamos en su cache anterior.
      }
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async()=>{
    await self.clients.claim();

    // Solo limpiamos caches antiguas si la nueva versión tiene su núcleo completo.
    const cache=await caches.open(CACHE);
    const comprobaciones=await Promise.all(CRITICOS.map(r=>cache.match(r)));
    const completa=comprobaciones.every(Boolean);

    if(completa){
      const keys=await caches.keys();
      await Promise.all(
        keys
          .filter(k=>k.startsWith(CACHE_PREFIX) && k!==CACHE)
          .map(k=>caches.delete(k))
      );
    }
  })());
});

self.addEventListener("fetch", event => {
  const req=event.request;
  if(req.method!=="GET") return;

  const url=new URL(req.url);

  // Las APIs/CDN externas siguen su curso normal. No condicionan el shell local.
  if(url.origin!==self.location.origin) return;

  if(req.mode==="navigate"){
    event.respondWith((async()=>{
      // LOCAL PRIMERO: con poca cobertura la pantalla aparece inmediatamente.
      const local =
        await buscarEnCualquierCache("./index.html") ||
        await buscarEnCualquierCache("./", {ignoreSearch:true});

      if(local){
        // Actualización silenciosa; nunca retenemos la navegación por la red.
        event.waitUntil((async()=>{
          try{
            const res=await fetch(req,{cache:"no-store"});
            if(res && res.ok){
              const cache=await caches.open(CACHE);
              await cache.put("./index.html",res.clone());
              await cache.put("./",res.clone());
            }
          }catch(e){}
        })());
        return local;
      }

      // Primera apertura absoluta: todavía necesita una respuesta de red.
      try{
        const res=await fetch(req);
        if(res && res.ok){
          const cache=await caches.open(CACHE);
          await cache.put("./index.html",res.clone());
          await cache.put("./",res.clone());
        }
        return res;
      }catch(e){
        return new Response(
          "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Mi Servicio</title><body style='font-family:-apple-system;padding:28px'><h2>Mi Servicio</h2><p>Necesito una primera conexión completa para guardar la app en este dispositivo.</p></body>",
          {headers:{"Content-Type":"text/html; charset=utf-8"}}
        );
      }
    })());
    return;
  }

  // Archivos propios: cache primero, incluso si cambia la query de versión.
  event.respondWith((async()=>{
    const exacta=await buscarEnCualquierCache(req);
    if(exacta) return exacta;

    const sinQuery=new Request(url.origin+url.pathname);
    const compatible=await buscarEnCualquierCache(sinQuery,{ignoreSearch:true});
    if(compatible){
      event.waitUntil((async()=>{
        try{
          const res=await fetch(req);
          if(res && res.ok){
            const cache=await caches.open(CACHE);
            await cache.put(req,res.clone());
          }
        }catch(e){}
      })());
      return compatible;
    }

    try{
      const res=await fetch(req);
      if(res && res.ok){
        const cache=await caches.open(CACHE);
        await cache.put(req,res.clone());
      }
      return res;
    }catch(e){
      return Response.error();
    }
  })());
});
