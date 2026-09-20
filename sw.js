const CACHE = "mi-servicio-v13501";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles-v27.css?v=13501",
  "./app-v27.js?v=13501",
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
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Red primero: una mejora publicada se recoge sin cambiar números a mano.
  // Sin cobertura: se usa automáticamente la última copia guardada.
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => {
            cache.put(req, copy);
            if (req.mode === "navigate") {
              cache.put("./index.html", res.clone());
            }
          });
        }
        return res;
      })
      .catch(async () => {
        const exact = await caches.match(req);
        if (exact) return exact;

        if (req.mode === "navigate") {
          const index = await caches.match("./index.html");
          if (index) return index;
        }
        return Response.error();
      })
  );
});
