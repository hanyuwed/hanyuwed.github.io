const BASE=new URL(self.registration.scope);
const CACHE_PREFIX=`hanyuwed:${BASE.pathname}:`;
const CACHE=CACHE_PREFIX+'v1';
const assetUrl=path=>new URL(path,BASE).href;
const ASSETS=['./','index.html','style.css','data.js','uz-words.js','app.js','audio-player.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','apple-touch-icon.png'].map(assetUrl);
const AUDIO=Array.from({length:282},(_,i)=>assetUrl(`audio/${i+1}.mp3`));
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS);
  // Limit mobile connections while making all word recordings available offline.
  for(let i=0;i<AUDIO.length;i+=4)await cache.addAll(AUDIO.slice(i,i+4));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function audioResponse(request,path){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(path);
  if(!cached)return fetch(request);
  const range=request.headers.get('range');
  if(!range)return cached;
  // Safari requests byte ranges even for short audio files. Serve them from the
  // cached complete MP3, including when there is no network connection.
  const bytes=await cached.arrayBuffer(),size=bytes.byteLength;
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match||(!match[1]&&!match[2]))return fetch(request);
  const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  const end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
  if(start>=size||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':'audio/mpeg','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  if(AUDIO.includes(url.href)){event.respondWith(audioResponse(request,url.href));return;}
  if(!ASSETS.includes(url.href))return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok&&response.type==='basic'&&!response.redirected&&response.status===200){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(request,copy)));}
    return response;
  }).catch(()=>caches.open(CACHE).then(async c=>(await c.match(request))||(request.mode==='navigate'?(await c.match(BASE.href))||Response.error():Response.error()))));
});
