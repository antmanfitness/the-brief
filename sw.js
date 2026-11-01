const C='brief-v9';const A=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(A.map(a=>fetch(a,{cache:'no-store'}).then(r=>r.ok&&c.put(a,r)).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting()});
self.addEventListener('fetch',e=>{const req=e.request,u=new URL(req.url);if(u.origin!==location.origin||req.method!=='GET')return;
const isVer=u.pathname.endsWith('/version.json');
// Network-first, bypassing the HTTP cache (GitHub Pages sends max-age=600)
e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r.ok&&!isVer){const cp=r.clone();caches.open(C).then(c=>c.put(req.mode==='navigate'?'index.html':req,cp))}return r})
 .catch(()=>isVer?new Response('{}',{headers:{'Content-Type':'application/json'}}):caches.match(req).then(r=>r||caches.match('index.html'))))});
