const BUILD = "V276-27622";
const CACHE = "mi-servicio-v27622";
const CACHE_PREFIX = "mi-servicio-";
const CODIGO = {
  "./app-v276.js": "5a1c4e0b57721f336c672345d957f8e873f73893b05055ba44acfa8a8604a274",
  "./config-v260.js": "2ef83ae552bfdf5e1e998fffe9f39f1cc6f999826b9229396280337ed5612b5d",
  "./estadisticas-render-v260.js": "d4b50491234def73bc1f3636c97c18c7c21fb8fd5e596cd5cbb82b5caa3d62e9",
  "./estadisticas-v260.js": "32989862e03bd33c2f2f0974355b569887283d1f21535995538ecd79912533bc",
  "./eventos-calendario-v263.js": "99dae0a51f52636111f9cfb3b59fcfe319df58006d5d1173e5c3b6ea4b1a22b0",
  "./historial-edicion-v260.js": "c49ee5d23ac98a86d0b7796bfcb6f8aba223c477c5c6515cd9b31ec0b3baea7e",
  "./historial-render-v262.js": "c2d8dccec7d5565bc969b5fcfb50b4411c18ab729be918838bc88369887d0fb3",
  "./historial-v262.js": "74149a065f9546991970eb9f87e2ac44235405e2d82a8ebe46dbc799c2b0c7f0",
  "./legacy-bridge-v260.js": "7a9f294149fecaa1bc9941ae6d87a97d47955de70b3a53e90b2258be6618f9c0",
  "./mejoras-v260.js": "cde6be90bb0422b66bb3183c0638b8a22bd9817b65a3519e328b89a36b8c3319",
  "./planificacion-v260.js": "3a88dd2e2036597e63529ff065e757c7a66f161daba0b897fcb6435c4088d7d0",
  "./registrar-ui-v260.js": "6eed3f73add6d69a14cd4d72fb7a91c67f012c5f0496db7882f2005c1d1b0768",
  "./registrar-v260.js": "d3b7fcc9c7fb5b62681ef154302ac084a8088ed7ccfe144f5eb78ab8d52aa667",
  "./solidez-v266.js": "948674da60283ca67720da1dcef621ecf7b7a2cc6600530f0fde1500b46e1015",
  "./simple-v260.js": "d4de97a738d75a20f26487f59f0011fcb51ed63980b00b53618be4a6629e6820",
  "./storage-v260.js": "c8dc9a3b4b440181b69dabf206319026d8f3057cccf63c57ae8585cd4bdfdca9",
  "./styles-v276.css": "f493f4574ec9c45dfda85225f03f4fa837e48d332d92d64853629c7f275e6c29",
  "./tiempo-v262.js": "5e75178e6ba21dc2e3b136144dcaf1b1642193c1236f0ea7730b99581e39ff54",
  "./v276.js": "aa6dcac2f4f115b45b71ed16455195c6480bc73c5542ad17717533fc07588215",
  "./v268.js": "e18ce297803cdab21585eb721c15ba131da9fe745430b4d11cd5617149af31c3",
  "./v267.js": "ad48a19f245758d6a5fb8943b073aa357f78d0613df83dfb329848b47a2d0897",
  "./v264.js": "5850b534a0d5829da0514980d497b54790e1dd8316ab45ddfdd265f8463d5753",
  "./visual-v260.js": "1cd7e298b1f11523d440b19ab6e90264ef956a5d59e3aac1acd427f79fe26801"
};
const APP_SHELL = [
  "./escena-corazon-v260.png",
  "./escena-registrar-v260.png",
  "./index.html",
  "./",
  "./app-v276.js",
  "./solidez-v266.js",
  "./config-v260.js",
  "./estadisticas-render-v260.js",
  "./estadisticas-v260.js",
  "./eventos-calendario-v263.js",
  "./historial-edicion-v260.js",
  "./historial-render-v262.js",
  "./historial-v262.js",
  "./legacy-bridge-v260.js",
  "./mejoras-v260.js",
  "./planificacion-v260.js",
  "./registrar-ui-v260.js",
  "./registrar-v260.js",
  "./simple-v260.js",
  "./v264.js",
  "./v267.js",
  "./v268.js",
  "./v276.js",
  "./storage-v260.js",
  "./styles-v276.css",
  "./tiempo-v262.js",
  "./visual-v260.js",
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
