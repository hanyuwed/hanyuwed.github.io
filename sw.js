const BASE=new URL(self.registration.scope);
const CACHE_PREFIX=`hanyuwed:${BASE.pathname}:`;
const CACHE=CACHE_PREFIX+'v17';
const MEDIA_CACHE='hanyuwed-media:'+BASE.pathname;
const assetUrl=path=>new URL(path,BASE).href;
const PAGES=new Map([
  ['./','./'],['index.html','./'],['chinese.html','chinese.html'],
  ['fr','fr/'],['fr/','fr/'],['fr/index.html','fr/'],
  ['ko','ko/'],['ko/','ko/'],['ko/index.html','ko/'],
  ['ar','ar/'],['ar/','ar/'],['ar/index.html','ar/'],
  ['it','it/'],['it/','it/'],['it/index.html','it/'],
  ['es','es/'],['es/','es/'],['es/index.html','es/'],
].map(([path,canonical])=>[new URL(path,BASE).pathname,assetUrl(canonical)]));
const ASSETS=[
  './','index.html','chinese.html','courses.css','courses.js','course-common.js',
  'style.css','data.js','uz-words.js','app.js?v=3','audio-player.js','pinyin-practice.js',
  'manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','apple-touch-icon.png',
  'fr/','fr/index.html','fr/styles.css','fr/course-data.js','fr/grammar.js','fr/answers.js','fr/app.js?v=2','fr/audio-index.js',
  'ko/','ko/index.html','ko/styles.css','ko/data.js','ko/answers.js','ko/app.js','ko/audio-index.js',
  'ar/','ar/index.html','ar/styles.css','ar/data.js','ar/answers.js','ar/app.js?v=2','ar/speech-data.js',
  'it/','it/index.html','it/styles.css','it/course-data.js','it/grammar.js','it/answers.js','it/audio-index.js','it/app.js',
  'es/','es/index.html','es/styles.css','es/course-data.js','es/grammar.js','es/answers.js','es/audio-index.js','es/app.js',
].map(assetUrl);
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS);
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const oldCaches=(await caches.keys()).filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE);
  await Promise.allSettled(oldCaches.map(async key=>{
    const previous=await caches.open(key);
    const media=await caches.open(MEDIA_CACHE);
    const files=(await previous.keys()).filter(request=>new URL(request.url).pathname.startsWith(BASE.pathname+'audio/'));
    for(const file of files){
      const response=await previous.match(file);
      if(response)await media.put(file,response);
    }
    await caches.delete(key);
  }));
  await self.clients.claim();
})()));
async function audioResponse(request,path,cacheName,cacheOnPlay){
  const range=request.headers.get('range');
  let audio;
  try {
    const cache=await caches.open(cacheName);
    audio=await cache.match(path);
    if(!audio&&cacheOnPlay){
      audio=await fetch(path);
      if(audio.status!==200)return audio;
      await cache.put(path,audio.clone()).catch(()=>{});
    }
  }catch{return fetch(request);}
  if(!audio)return fetch(request);
  if(!range)return audio;
  // Safari requests byte ranges even for short audio files. Serve them from the
  // cached complete MP3, including when there is no network connection.
  const bytes=await audio.arrayBuffer(),size=bytes.byteLength;
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
  const relativePath=url.pathname.slice(BASE.pathname.length);
  if(/^(?:audio\/\d+|(?:ar|it|fr|ko)\/audio\/[\w-]+)\.mp3$/.test(relativePath)){
    event.respondWith(audioResponse(request,url.href,MEDIA_CACHE,true));return;
  }
  if(/^es\/audio\/[a-f0-9]{20}\.mp3$/.test(relativePath)){
    event.respondWith(audioResponse(request,url.href,'hanyuwed-es-audio:'+BASE.pathname));return;
  }
  const page=request.mode==='navigate'?PAGES.get(url.pathname):undefined;
  if(!page&&!ASSETS.includes(url.href))return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok&&response.type==='basic'&&!response.redirected&&response.status===200){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(request,copy)));}
    return response;
  }).catch(()=>caches.open(CACHE).then(async cache=>{
    if(page && ['fr','ko','ar','it','es'].some(course=>page===assetUrl(course+'/')&&url.pathname===new URL(course,BASE).pathname)){
      const cached=await cache.match(page);
      if(cached)return Response.redirect(page+url.search,302);
    }
    return (await cache.match(request))||(page&&(await cache.match(page)))||Response.error();
  })));
});
