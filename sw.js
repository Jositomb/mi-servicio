const BUILD = "V244-24401";
const CACHE = "mi-servicio-v24401";
const CACHE_PREFIX = "mi-servicio-";
const CODIGO = {
  "./app-v244.js": "7fb0913233a2415c38bf2d2dd533025e7c6d7396e73037af4b0013903c991a59",
  "./config-v244.js": "2ef83ae552bfdf5e1e998fffe9f39f1cc6f999826b9229396280337ed5612b5d",
  "./estadisticas-render-v244.js": "d4b50491234def73bc1f3636c97c18c7c21fb8fd5e596cd5cbb82b5caa3d62e9",
  "./estadisticas-v244.js": "32989862e03bd33c2f2f0974355b569887283d1f21535995538ecd79912533bc",
  "./eventos-calendario-v244.js": "3d432568a81ed7c00a627b71a286fdd81b3fc2654f8adb9287b87cb0fe2deb44",
  "./historial-edicion-v244.js": "22c122e737e944f35d4f7d9b779cc6b795118027ff5dd062473f22d85560e264",
  "./historial-render-v244.js": "936d03b831f52e823224f75286e403d60e9ad2a25c1627bd30eba69ff51a1ca1",
  "./historial-v244.js": "a84e094f4e4f27fd417008d6d2f017d0776b4235bcca088dfc294668d0f215be",
  "./legacy-bridge-v244.js": "7a9f294149fecaa1bc9941ae6d87a97d47955de70b3a53e90b2258be6618f9c0",
  "./mejoras-v244.js": "cde6be90bb0422b66bb3183c0638b8a22bd9817b65a3519e328b89a36b8c3319",
  "./planificacion-v244.js": "6eb6cca76aaec67c788940ac7847313a10104aed9ec0f8b93d2e92ed604c5849",
  "./registrar-ui-v244.js": "d60509f7ee96e532d56a28de64a4d42fd2df3e7d0e45aed28932b2954c85049c",
  "./registrar-v244.js": "703861576bcc5da9b8c863bd1c3c0146018bfde7012e31715ef9a43a14209e48",
  "./simple-v244.js": "198e2622e1bbb228985c89b5a024f0b388e525063c8c6e74b93999d8cb92e9f2",
  "./storage-v244.js": "c8dc9a3b4b440181b69dabf206319026d8f3057cccf63c57ae8585cd4bdfdca9",
  "./styles-v244.css": "e927690e90c5a9e032358dfc2341933ef352034577d9c6a9f50f418f04ad7015",
  "./tiempo-v244.js": "45ba936ff6fee290734348ee7a9387f3ddeea0daecdfe6c44359ba9367592dce",
  "./visual-v244.js": "5ad2f2082df9360054e0e5b3dafa1f2754d01ea51a3b0f2b91b8bb4bacd83711"
};
const APP_SHELL = [
  "./index.html",
  "./",
  "./app-v244.js",
  "./config-v244.js",
  "./estadisticas-render-v244.js",
  "./estadisticas-v244.js",
  "./eventos-calendario-v244.js",
  "./historial-edicion-v244.js",
  "./historial-render-v244.js",
  "./historial-v244.js",
  "./legacy-bridge-v244.js",
  "./mejoras-v244.js",
  "./planificacion-v244.js",
  "./registrar-ui-v244.js",
  "./registrar-v244.js",
  "./simple-v244.js",
  "./storage-v244.js",
  "./styles-v244.css",
  "./tiempo-v244.js",
  "./visual-v244.js",
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
