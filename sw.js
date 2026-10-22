const BUILD = "V255-25501";
const CACHE = "mi-servicio-v25501";
const CACHE_PREFIX = "mi-servicio-";
const CODIGO = {
  "./app-v255.js": "26948dcdee1e66f2f7cde98e7f9d93d183def818eb383a9eec0f671d7a07c3e1",
  "./config-v255.js": "2ef83ae552bfdf5e1e998fffe9f39f1cc6f999826b9229396280337ed5612b5d",
  "./estadisticas-render-v255.js": "d4b50491234def73bc1f3636c97c18c7c21fb8fd5e596cd5cbb82b5caa3d62e9",
  "./estadisticas-v255.js": "32989862e03bd33c2f2f0974355b569887283d1f21535995538ecd79912533bc",
  "./eventos-calendario-v255.js": "5cd2de5b798e33642d138081e22f54564411189b024c871316f3bd86372352a4",
  "./historial-edicion-v255.js": "59b0e35dfb038edb447758c8e63a092acf6c4a6a495d5e099e858da30e45889c",
  "./historial-render-v255.js": "6b0bd0dba1a363c8d612c53f49e3a243e629af97b1f7b0546860086bfac88d84",
  "./historial-v255.js": "a84e094f4e4f27fd417008d6d2f017d0776b4235bcca088dfc294668d0f215be",
  "./legacy-bridge-v255.js": "7a9f294149fecaa1bc9941ae6d87a97d47955de70b3a53e90b2258be6618f9c0",
  "./mejoras-v255.js": "cde6be90bb0422b66bb3183c0638b8a22bd9817b65a3519e328b89a36b8c3319",
  "./planificacion-v255.js": "5f41280026f3652b3ec825cdccb9a54b86f92b441f843c020a62ce297cbd8c5a",
  "./registrar-ui-v255.js": "9546b986b48cbb9d713553620e7beff52213047f7fd861da7e6146da5c284ade",
  "./registrar-v255.js": "7c2ad13ef17aa506f35b97eb2fdc5b8824ecae444f49755ae1f0c76826c6f623",
  "./simple-v255.js": "f519c55477cfec607f4aa6a1e952fb8ade8f3d7aa3d05158968b88877b566ea2",
  "./storage-v255.js": "c8dc9a3b4b440181b69dabf206319026d8f3057cccf63c57ae8585cd4bdfdca9",
  "./styles-v255.css": "fc0c4ea88561b7396f6a66376001f3f891d1c30ea2eb170625f7651dcd6b895f",
  "./tiempo-v255.js": "45ba936ff6fee290734348ee7a9387f3ddeea0daecdfe6c44359ba9367592dce",
  "./visual-v255.js": "5ad2f2082df9360054e0e5b3dafa1f2754d01ea51a3b0f2b91b8bb4bacd83711"
};
const APP_SHELL = [
  "./escena-corazon-v255.png",
  "./escena-registrar-v255.png",
  "./index.html",
  "./",
  "./app-v255.js",
  "./config-v255.js",
  "./estadisticas-render-v255.js",
  "./estadisticas-v255.js",
  "./eventos-calendario-v255.js",
  "./historial-edicion-v255.js",
  "./historial-render-v255.js",
  "./historial-v255.js",
  "./legacy-bridge-v255.js",
  "./mejoras-v255.js",
  "./planificacion-v255.js",
  "./registrar-ui-v255.js",
  "./registrar-v255.js",
  "./simple-v255.js",
  "./storage-v255.js",
  "./styles-v255.css",
  "./tiempo-v255.js",
  "./visual-v255.js",
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
