const CACHE='senaman-shell-v1';
const MEDIA='senaman-media-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
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
