const CACHE_NAME="kunzler-investment-v1";
const APP_SHELL=["./","./index.html","./style.css","./script.js","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  if(e.request.url.includes("docs.google.com/spreadsheets")){e.respondWith(fetch(e.request));return;}
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)));
});
