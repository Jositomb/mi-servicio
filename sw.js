const BUILD = "V224-22401";
const CACHE = "mi-servicio-v22401";
const CACHE_PREFIX = "mi-servicio-";
const CODIGO = {
  "./app-v224.js": "a75eec8f7fd3af8bec50fd6d2d5de3c24c02565ad39506effb7189365a798156",
  "./config-v224.js": "2ef83ae552bfdf5e1e998fffe9f39f1cc6f999826b9229396280337ed5612b5d",
  "./estadisticas-render-v224.js": "d4b50491234def73bc1f3636c97c18c7c21fb8fd5e596cd5cbb82b5caa3d62e9",
  "./estadisticas-v224.js": "32989862e03bd33c2f2f0974355b569887283d1f21535995538ecd79912533bc",
  "./eventos-calendario-v224.js": "360b83122a3ce25a4dbc2399bac81ed2e0c958ffd937e012ede54fa54937ca0d",
  "./historial-edicion-v224.js": "649933a840b374a2ddc7d1d74d671bf747e890c15b5ca1e03885084c4062c7bd",
  "./historial-render-v224.js": "63532068f5b447e28860fb597a0ca4e8c3c02e5d784091e385aa38b99cc7e020",
  "./historial-v224.js": "a84e094f4e4f27fd417008d6d2f017d0776b4235bcca088dfc294668d0f215be",
  "./legacy-bridge-v224.js": "7a9f294149fecaa1bc9941ae6d87a97d47955de70b3a53e90b2258be6618f9c0",
  "./mejoras-v224.js": "cde6be90bb0422b66bb3183c0638b8a22bd9817b65a3519e328b89a36b8c3319",
  "./planificacion-v224.js": "cbc623c1e93ab233feab7b4ea4336fe2619fa2a7454a92e71411905790e17594",
  "./registrar-ui-v224.js": "43867676a86e2714dfbc64685baaf8ca3cbed92b58b8b1660dfb34e1a82acc39",
  "./registrar-v224.js": "4dd7b61b13ad14107e1b9dfba6b35a59ff57125ac97da47484275806c2f3272f",
  "./simple-v224.js": "15a836cda23e5abba453fe8cdbb561416571308ae9f4d61c8459b2034b88671b",
  "./storage-v224.js": "c8dc9a3b4b440181b69dabf206319026d8f3057cccf63c57ae8585cd4bdfdca9",
  "./styles-v224.css": "5875eca392faabc438b491cf85d8e0b37c24387ff2a0979384026445355bdd12",
  "./tiempo-v224.js": "14712104c9f7afd9bc09112ff312ce1635a90ac4e374a97d6ba47bb4fe5f3e73",
  "./visual-v224.js": "5ad2f2082df9360054e0e5b3dafa1f2754d01ea51a3b0f2b91b8bb4bacd83711"
};
const APP_SHELL = [
  "./index.html",
  "./",
  "./app-v224.js",
  "./config-v224.js",
  "./estadisticas-render-v224.js",
  "./estadisticas-v224.js",
  "./eventos-calendario-v224.js",
  "./historial-edicion-v224.js",
  "./historial-render-v224.js",
  "./historial-v224.js",
  "./legacy-bridge-v224.js",
  "./mejoras-v224.js",
  "./planificacion-v224.js",
  "./registrar-ui-v224.js",
  "./registrar-v224.js",
  "./simple-v224.js",
  "./storage-v224.js",
  "./styles-v224.css",
  "./tiempo-v224.js",
  "./visual-v224.js",
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
