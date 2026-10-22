const CACHE='senaman-shell-v3';
const MEDIA='senaman-media-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(SHELL);
  // Vite production assets have hashed filenames; discover and cache them now,
  // so the full UI loads offline even on the first subsequent launch.
  try {
   const html=await (await fetch('./index.html',{cache:'no-store'})).text();
   const paths=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(m=>new URL(m[1],self.registration.scope).href);
   if(paths.length)await cache.addAll(paths);
  }catch(_){}
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>![CACHE,MEDIA].includes(k)).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url),isLocal=url.origin===self.location.origin;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
   return response;
  }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));return;
 }
 if(isLocal){
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
   return response;
  })));return;
 }
 if(url.hostname==='cdn.jsdelivr.net' && url.pathname.includes('workout-guide')){
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
   const copy=response.clone();caches.open(MEDIA).then(c=>c.put(req,copy)).catch(()=>{});
   return response;
  })));return;
 }
});
