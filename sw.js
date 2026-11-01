const BUILD = "V269-26901";
const CACHE = "mi-servicio-v26901";
const CACHE_PREFIX = "mi-servicio-";
const CODIGO = {
  "./app-v269.js": "f052803f947c9f2366f804d4ab2a45cdbce7afd647a802aebb29037eeb50af8b",
  "./config-v260.js": "551ae408165377a748899157e298a4e5deb7097961d3038407d6ae1929dc818c",
  "./estadisticas-render-v260.js": "36161fe38348aeb95d009a55ae991b8e80f31cf6f908063219f8faaaac811d15",
  "./estadisticas-v260.js": "9efcb316ba16430575fc5aaa6dadcbb3fb6349ff710d94a158c9396f6de9cf14",
  "./eventos-calendario-v263.js": "2bffce8ab7a888647f274964cc113bbb8be3803027a3e7820027fe26c565f96a",
  "./historial-edicion-v260.js": "6cc5061d0564ee6d6c24d473af079c4c16cbd176912119a9f2a12064db8198d7",
  "./historial-render-v262.js": "cf0a8c80da6b816b4e712e822be58c4c5c1adecdf6e7e3efb0298e13fb87212a",
  "./historial-v262.js": "6dce38a97915ec586d4d53e4337fff597e8fcbb257516f30407010f459c5c378",
  "./legacy-bridge-v260.js": "f1bbcca24f842a5a6da68b4399e7d092ac14a08d53d4b154030f32d2f12b50b9",
  "./mejoras-v260.js": "23ddc976e09260ba043c3fdf6ba28419fe2e4fb19f9b7dc40ef76f3ec1a3aef2",
  "./planificacion-v260.js": "e4d7d45015646dd5db0a50edc04f8cfc5b7c64c142ca2c3ff58459b22b9d0062",
  "./registrar-ui-v260.js": "dd1ac6b1974f0a15d040303d69f966356920b53c2eacf7b93842ca74d609e605",
  "./registrar-v260.js": "cf68bd716653e11b9892316715f0d8fd50200cdbccc073d2b870f00c0dba1463",
  "./solidez-v266.js": "c8e3c5a05aa5b0fd8ebff6f232eea2c04fade4b0208dbd38fadce925a592ecec",
  "./simple-v260.js": "24fde635ead6702c34338af7f76b312f6302cd66a7a5a951ded020cc1452b8c7",
  "./storage-v260.js": "c792a208be2cde05f70b203931b03f530223959dd01a95daca96ccb852005e75",
  "./styles-v269.css": "ee530fb8cf37811d38bf9d450a10d1a1a1efe2416dde622cac4f323d9db8348d",
  "./tiempo-v262.js": "16625430dccf0c781a61ab7f00ba0cfa433df964ef88439187d83ac0f60f99e7",
  "./v269.js": "3e615dc25084b6335d69ccec7cc751b6c8de139bdfe8c9438813908b7549067a",
  "./v268.js": "6fae5e7fa597648205bfc2f3d939a094493aa04433dfafab5a3d8046ab17c53b",
  "./v267.js": "3a01848829e5a3a1a966f9b4efee5b1577708f046c9583cf7247daee7e2c3a89",
  "./v264.js": "8fc500c0d46e557950f27cf65fa317f1cd6230d31a0b12fefea3a9027661b105",
  "./visual-v260.js": "d854e38dd77cb9b5878dab6f61b7a4550deac1b17ba4d231f5722e385659f3a8"
};
const APP_SHELL = [
  "./escena-corazon-v260.png",
  "./escena-registrar-v260.png",
  "./index.html",
  "./",
  "./app-v269.js",
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
  "./v269.js",
  "./storage-v260.js",
  "./styles-v269.css",
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
