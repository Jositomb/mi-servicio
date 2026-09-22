const CACHE = "mi-servicio-v16301";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles-v27.css?v=16301",
  "./app-v27.js?v=16301",
  "./icon-apple.png",
  "./manifest.webmanifest",
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
 const req=event.request;if(req.method!=="GET")return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 if(req.mode==="navigate" || url.pathname.endsWith("/version.json")){
   event.respondWith(fetch(req,{cache:"no-store"}).catch(()=>caches.match("./index.html")));
   return;
 }
 event.respondWith(fetch(req,{cache:"no-store"}).then(res=>{
   if(res&&res.ok){const c=res.clone();caches.open(CACHE).then(cache=>cache.put(req,c));}
   return res;
 }).catch(()=>caches.match(req)));
});