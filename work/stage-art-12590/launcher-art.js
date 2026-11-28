// Self-contained silhouettes remain available on a fresh updater installation offline.
// The distribution and an online updater also carry the pixel-exact original paintings.
const stageMasks12590=__STAGE_MASKS__;
const stageNames12590=Object.keys(stageMasks12590);
const stageFile12590='stage-art-1.25.90.js';
const stageURL12590='https://lion000097.github.io/monster-biyori/releases/1.25.90/'+stageFile12590;
const stageHash12590='__STAGE_HASH__';
let stageCached12590=false;
function stageValid12590(data){
  return !!data&&stageNames12590.every(k=>typeof data[k]==='string'&&data[k].startsWith('data:image/png;base64,'));
}
function stageDatabase12590(mode,value){
  return new Promise(resolve=>{
    if(typeof indexedDB==='undefined')return resolve(null);
    let req;
    try{req=indexedDB.open('monster_biyori_paintings',1);}catch{return resolve(null);}
    req.onupgradeneeded=()=>req.result.createObjectStore('originals');
    req.onerror=req.onblocked=()=>resolve(null);
    req.onsuccess=()=>{
      const db=req.result,tx=db.transaction('originals',mode),store=tx.objectStore('originals');
      const op=mode==='readonly'?store.get(stageHash12590):store.put(value,stageHash12590);
      let result=null;op.onsuccess=()=>{result=op.result;};
      tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=tx.onabort=()=>{db.close();resolve(null);};
    };
  });
}
async function stageFetch12590(url){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
  try{
    const res=await fetch(url,{signal:ctl.signal,credentials:'omit'});
    if(!res.ok)throw Error('Missing original paintings');
    const bytes=await res.arrayBuffer();
    const got=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),c=>c.toString(16).padStart(2,'0')).join('');
    if(got!==stageHash12590)throw Error('Painting archive changed');
    const text=new TextDecoder().decode(bytes),data=JSON.parse(text.slice('globalThis.MBStagePaint12590='.length,-2));
    if(!stageValid12590(data))throw Error('Incomplete paintings');
    return data;
  }finally{clearTimeout(timer);}
}
function stageFileData12590(){
  return new Promise(resolve=>{
    const script=document.createElement('script');
    const done=()=>{script.remove();const data=globalThis.MBStagePaint12590;delete globalThis.MBStagePaint12590;resolve(stageValid12590(data)?data:null);};
    script.onload=script.onerror=done;script.src=new URL(stageFile12590,document.baseURI).href;document.head.appendChild(script);
  });
}
async function stageOriginals12590(){
  const cache=Promise.race([stageDatabase12590('readonly').then(data=>{stageCached12590=stageValid12590(data);return data;}),new Promise(r=>setTimeout(()=>r(null),1000))]).catch(()=>null);
  const local=location.protocol==='file:'?stageFileData12590():
    /^(https?:)$/.test(location.protocol)?stageFetch12590(new URL(stageFile12590,document.baseURI)).catch(()=>null):Promise.resolve(null);
  const found=await Promise.any([local,cache].map(async task=>{
    const data=await task;if(!stageValid12590(data))throw Error();return data;
  })).catch(()=>null);
  if(found)return found;
  if(navigator.onLine===false||location.href.startsWith(stageURL12590.slice(0,stageURL12590.lastIndexOf('/')+1)))return null;
  const data=await stageFetch12590(stageURL12590).catch(()=>null);
  return data;
}
async function stageImage12590(uri){
  const img=new Image();img.src=uri;await img.decode();return img;
}
const stageOriginalData12590=stageOriginals12590().catch(()=>null);
const stageEarly12590=await Promise.race([stageOriginalData12590,new Promise(r=>setTimeout(()=>r(null),1200))]);
function stageSprite12590(image,size,isOriginal){
  return {size,image,base:[],views:new Map(),original12590:isOriginal};
}
const axisSprites=new Map();
await Promise.all(Object.entries(axisAtlas).map(async ([type,[size,uri]])=>{
  if(!stageMasks12590[type]){
    const image=await stageImage12590(uri);
    axisSprites.set(type,stageSprite12590(image,travelerPlots[type]?image.height:size*2,false));return;
  }
  if(stageEarly12590){
    const image=await stageImage12590(stageEarly12590[type]);
    if(image.height===size&&image.width===size*4){axisSprites.set(type,stageSprite12590(image,size,true));return;}
  }
  const [colour,mask]=await Promise.all([stageImage12590(uri),stageImage12590(stageMasks12590[type])]);
  const drawing=document.createElement('canvas');drawing.width=4*size;drawing.height=size;
  const ctx=drawing.getContext('2d');ctx.imageSmoothingQuality='high';
  ctx.drawImage(colour,0,0,drawing.width,drawing.height);
  ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);
  axisSprites.set(type,stageSprite12590(drawing,size,false));
}));
stageOriginalData12590.then(async data=>{
  if(!data)return;
  if(!stageEarly12590){
    const images=await Promise.all(stageNames12590.map(k=>stageImage12590(data[k])));
    for(let i=0;i<images.length;i++){
      const key=stageNames12590[i],size=travelerPlots[key].size,img=images[i];
      if(img.height!==size||img.width!==size*4)return;
    }
    for(let i=0;i<images.length;i++){
      const key=stageNames12590[i];axisSprites.set(key,stageSprite12590(images[i],images[i].height,true));
    }
  }
  if(!stageCached12590)await stageDatabase12590('readwrite',data);
}).catch(()=>{});
