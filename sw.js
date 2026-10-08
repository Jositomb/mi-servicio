const BUILD = "V222-22201";
const CACHE = "mi-servicio-v22201";
const CACHE_PREFIX = "mi-servicio-";
const CODIGO = {
  "./app-v222.js": "521863fe739fba7ae6a001c00a8859e548c50798bf47887e54a60b1ab25c04d1",
  "./config-v222.js": "2ef83ae552bfdf5e1e998fffe9f39f1cc6f999826b9229396280337ed5612b5d",
  "./estadisticas-render-v222.js": "d4b50491234def73bc1f3636c97c18c7c21fb8fd5e596cd5cbb82b5caa3d62e9",
  "./estadisticas-v222.js": "32989862e03bd33c2f2f0974355b569887283d1f21535995538ecd79912533bc",
  "./eventos-calendario-v222.js": "5c339289d958b6fb9beb5c007453a11bdc69eb6cd9ead32a284077c0a1561837",
  "./historial-edicion-v222.js": "649933a840b374a2ddc7d1d74d671bf747e890c15b5ca1e03885084c4062c7bd",
  "./historial-render-v222.js": "5dc7b1ab5149a43721781fd299a3e246dd522be5c3ccb1e0d3dc135f9d595a34",
  "./historial-v222.js": "a84e094f4e4f27fd417008d6d2f017d0776b4235bcca088dfc294668d0f215be",
  "./legacy-bridge-v222.js": "7a9f294149fecaa1bc9941ae6d87a97d47955de70b3a53e90b2258be6618f9c0",
  "./mejoras-v222.js": "cde6be90bb0422b66bb3183c0638b8a22bd9817b65a3519e328b89a36b8c3319",
  "./planificacion-v222.js": "90c1fe87c355d27c0d3f2bd347de13a8c6b4765e1bb4a41ad637e51fb0ab29c7",
  "./registrar-ui-v222.js": "5e106c5bfb86a1cc8741b0bd75f7a8fbad8466ca9358e9fe43cb50a6797d4e84",
  "./registrar-v222.js": "cce40e16fcf1085452272aec7cef5067ab6b3ff8ff363f9a517f783be7011545",
  "./simple-v222.js": "e3d68958b6de724215b8821b2b303d56d3d98534d4832d625eec49aad11c1729",
  "./storage-v222.js": "c8dc9a3b4b440181b69dabf206319026d8f3057cccf63c57ae8585cd4bdfdca9",
  "./styles-v222.css": "bb91dd4424b2eabb589ac9c35cec8e21bf6e807057b579c850f06298f629482a",
  "./tiempo-v222.js": "14712104c9f7afd9bc09112ff312ce1635a90ac4e374a97d6ba47bb4fe5f3e73",
  "./visual-v222.js": "5ad2f2082df9360054e0e5b3dafa1f2754d01ea51a3b0f2b91b8bb4bacd83711"
};
const APP_SHELL = [
  "./index.html",
  "./",
  "./app-v222.js",
  "./config-v222.js",
  "./estadisticas-render-v222.js",
  "./estadisticas-v222.js",
  "./eventos-calendario-v222.js",
  "./historial-edicion-v222.js",
  "./historial-render-v222.js",
  "./historial-v222.js",
  "./legacy-bridge-v222.js",
  "./mejoras-v222.js",
  "./planificacion-v222.js",
  "./registrar-ui-v222.js",
  "./registrar-v222.js",
  "./simple-v222.js",
  "./storage-v222.js",
  "./styles-v222.css",
  "./tiempo-v222.js",
  "./visual-v222.js",
  "./manifest.webmanifest",
  "./icon-apple.png",
  "./personaje-51219b70e7f1.png",
  "./personaje-5638b822e9ec.png",
  "./personaje-56dd433b1692.png",
  "./personaje-635d3bce67f2.png",
  "./personaje-698db747b8fb.png",
  "./personaje-95d7b35c957c.png",
  "./personaje-e4168da17cdf.png",
  "./personaje-e524cff3980b.png",
  "./personaje-ff4383d3590d.png"
];

function esPaginaDeEstaVersion(html) {
  const meta=html.match(/<meta\s+name=["']mi-servicio-build["']\s+content=["']([^"']+)["']/i);
  return Boolean(meta && meta[1]===BUILD);
}
async function hashRespuesta(respuesta) {
  const bytes=await respuesta.clone().arrayBuffer();
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
}
async function nucleoCompleto(cache) {
  const pagina=await cache.match("./index.html");
  if(!pagina || !esPaginaDeEstaVersion(await pagina.text()))return false;
  return (await Promise.all(Object.keys(CODIGO).map(async r=>{
    const res=await cache.match(r);
    return Boolean(res && await hashRespuesta(res)===CODIGO[r]);
  }))).every(Boolean);
}
async function buscarExacto(request) {
  const actual=await caches.open(CACHE);
  const respuesta=await actual.match(request);if(respuesta)return respuesta;
  const nombres=(await caches.keys()).filter(n=>n.startsWith(CACHE_PREFIX)&&n!==CACHE).reverse();
  for(const nombre of nombres){const res=await (await caches.open(nombre)).match(request);if(res)return res;}
  return null;
}
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    try{
      await Promise.all(APP_SHELL.map(async recurso=>{
        try{
          const res=await fetch(new Request(recurso,{cache:"reload"}));
          if(!res?.ok)return;
          if(CODIGO[recurso] && await hashRespuesta(res)!==CODIGO[recurso])return;
          if((recurso==="./index.html"||recurso==="./") && !esPaginaDeEstaVersion(await res.clone().text()))return;
          await cache.put(recurso,res);
        }catch(e){}
      }));
      if(!await nucleoCompleto(cache))throw new Error("Actualización incompleta: se mantiene la versión instalada.");
      await self.skipWaiting();
    }catch(e){await caches.delete(CACHE);throw e;}
  })());
});
self.addEventListener("activate",event=>{
  // Conservar las cachés anteriores permite terminar los formularios que ya
  // estaban abiertos. Cada nueva versión usa rutas distintas para su código.
  event.waitUntil((async()=>{if(await nucleoCompleto(await caches.open(CACHE)))await self.clients.claim();})());
});
self.addEventListener("fetch",event=>{
  const req=event.request;if(req.method!=="GET")return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==="navigate"){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const pagina=await cache.match("./index.html");
      if(pagina)return pagina;
      // Nunca sustituir una página por HTML de otra versión. La siguiente
      // publicación se activa con su propio worker, solo si está completa.
      try{
        const res=await fetch(req,{cache:"no-store"});
        if(res.ok && esPaginaDeEstaVersion(await res.clone().text())){
          await cache.put("./index.html",res.clone());return res;
        }
      }catch(e){}
      return new Response("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Mi Servicio</title><p>La actualización aún no está completa. Vuelve a abrir Mi Servicio cuando termine la publicación.</p>",{status:503,headers:{"Content-Type":"text/html; charset=utf-8"}});
    })());return;
  }
  event.respondWith((async()=>{
    const exacta=await buscarExacto(req);if(exacta)return exacta;
    try{
      const res=await fetch(req);
      const relativa="./"+url.pathname.slice(new URL(self.registration.scope).pathname.length);
      if(res.ok){
        if(CODIGO[relativa] && await hashRespuesta(res)!==CODIGO[relativa])return Response.error();
        if(CODIGO[relativa])await (await caches.open(CACHE)).put(req,res.clone());
      }
      return res;
    }catch(e){return Response.error();}
  })());
});
