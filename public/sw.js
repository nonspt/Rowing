const BUILD=__BUILD__;
const CACHE=`home-rower:${BUILD}:shell`;
const ASSETS=__ASSETS__.map(path=>new URL(path,self.registration.scope).href);
const SHELL=new URL('index.html',self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('home-rower:')&&key!==CACHE).map(key=>caches.delete(key)));})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE),cached=await cache.match(SHELL);
      try{const response=await fetch(request,{signal:AbortSignal.timeout(2500)});if(response.ok){const html=await response.clone().text();if(html.includes(`name="home-rower-build" content="${BUILD}"`))return response;}}catch(error){if(!cached)throw error;}
      return cached||Response.error();
    })());return;
  }
  if(ASSETS.includes(url.href))event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
});
const checkClient=client=>new Promise(resolve=>{const channel=new MessageChannel();const timeout=setTimeout(()=>resolve(false),4000);channel.port1.onmessage=event=>{clearTimeout(timeout);resolve(event.data?.busy===false);};client.postMessage({type:'CHECK_UPDATE'},[channel.port2]);});
self.addEventListener('message',event=>{
  if(event.data?.type==='APPLY_UPDATE')event.waitUntil((async()=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});const owned=clients.filter(client=>client.url.startsWith(self.registration.scope));const safe=(await Promise.all(owned.map(checkClient))).every(Boolean);if(!safe){event.ports[0]?.postMessage({ok:false});return;}await self.skipWaiting();event.ports[0]?.postMessage({ok:true});})());
});
