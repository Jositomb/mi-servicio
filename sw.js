const BUILD = "V256-25601";
const CACHE = "mi-servicio-v25601";
const CACHE_PREFIX = "mi-servicio-";
const CODIGO = {
  "./app-v256.js": "1479de8063a89d38f7e5f3ef710f7f81a9ecc3cc1e10dd81f85067dde50c191d",
  "./config-v256.js": "2ef83ae552bfdf5e1e998fffe9f39f1cc6f999826b9229396280337ed5612b5d",
  "./estadisticas-render-v256.js": "d4b50491234def73bc1f3636c97c18c7c21fb8fd5e596cd5cbb82b5caa3d62e9",
  "./estadisticas-v256.js": "32989862e03bd33c2f2f0974355b569887283d1f21535995538ecd79912533bc",
  "./eventos-calendario-v256.js": "9a6ca99433c5ea72d8a9da27b01068eebb9a3e9d11896048aa1d0ae75fa90354",
  "./historial-edicion-v256.js": "2c45bec113847375b9b9897e469af2eea3c8cfc7eb8120c32fda7a87df04d709",
  "./historial-render-v256.js": "8d914ea8cf9fda19e7540abca12f8ce5fd990820e3999ec0598f65f89ade8fd9",
  "./historial-v256.js": "a84e094f4e4f27fd417008d6d2f017d0776b4235bcca088dfc294668d0f215be",
  "./legacy-bridge-v256.js": "7a9f294149fecaa1bc9941ae6d87a97d47955de70b3a53e90b2258be6618f9c0",
  "./mejoras-v256.js": "cde6be90bb0422b66bb3183c0638b8a22bd9817b65a3519e328b89a36b8c3319",
  "./planificacion-v256.js": "f679ec2905979f320f38ca7ad052d874106c042500730a1d99132a0dc971ac82",
  "./registrar-ui-v256.js": "2e89661b17342f4ab50f14ba5a388a0eee01524b27b84cb97526958ad821d11d",
  "./registrar-v256.js": "7ec25935e3d9610535d594286e09a98009afc763538e729b67fa522c1322dff3",
  "./simple-v256.js": "98fc216d8969fb4e947dcdfa05579183536af01884d9c95837d16fbd45874cd4",
  "./storage-v256.js": "c8dc9a3b4b440181b69dabf206319026d8f3057cccf63c57ae8585cd4bdfdca9",
  "./styles-v256.css": "8ce46cb1ec4e5efd1274811ac58c0d656af4f6c5a56b73f789050a651b677335",
  "./tiempo-v256.js": "45ba936ff6fee290734348ee7a9387f3ddeea0daecdfe6c44359ba9367592dce",
  "./visual-v256.js": "5ad2f2082df9360054e0e5b3dafa1f2754d01ea51a3b0f2b91b8bb4bacd83711"
};
const APP_SHELL = [
  "./escena-corazon-v256.png",
  "./escena-registrar-v256.png",
  "./index.html",
  "./",
  "./app-v256.js",
  "./config-v256.js",
  "./estadisticas-render-v256.js",
  "./estadisticas-v256.js",
  "./eventos-calendario-v256.js",
  "./historial-edicion-v256.js",
  "./historial-render-v256.js",
  "./historial-v256.js",
  "./legacy-bridge-v256.js",
  "./mejoras-v256.js",
  "./planificacion-v256.js",
  "./registrar-ui-v256.js",
  "./registrar-v256.js",
  "./simple-v256.js",
  "./storage-v256.js",
  "./styles-v256.css",
  "./tiempo-v256.js",
  "./visual-v256.js",
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
