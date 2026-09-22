const CACHE = "mi-servicio-v17401";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles-v27.css?v=17401",
  "./app-v27.js?v=17401",
  "./eventos-calendario.js?v=17401",
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

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("mi-servicio-") && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});


self.addEventListener("fetch", event => {
  const req=event.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  // Navegación: intenta red, pero no deja la app inutilizable sin cobertura.
  if(req.mode==="navigate"){
    event.respondWith((async()=>{
      const cached=await caches.match("./index.html");
      const network=fetch(req).then(async res=>{
        if(res && res.ok){
          const c=await caches.open(CACHE);
          c.put("./index.html",res.clone());
        }
        return res;
      }).catch(()=>null);
      // Con señal mala no esperamos indefinidamente si ya tenemos la app local.
      if(cached){
        const timeout=new Promise(resolve=>setTimeout(()=>resolve(cached),650));
        return (await Promise.race([network,timeout])) || cached;
      }
      return (await network) || Response.error();
    })());
    return;
  }

  // Assets propios: cache primero, actualización silenciosa detrás.
  event.respondWith((async()=>{
    const cached=await caches.match(req);
    if(cached){
      event.waitUntil(fetch(req).then(async res=>{
        if(res && res.ok){
          const c=await caches.open(CACHE);
          await c.put(req,res.clone());
        }
      }).catch(()=>{}));
      return cached;
    }
    try{
      const res=await fetch(req);
      if(res && res.ok){
        const c=await caches.open(CACHE);
        await c.put(req,res.clone());
      }
      return res;
    }catch(e){
      return Response.error();
    }
  })());
});
