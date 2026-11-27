const movingDesigns=new Set(['eggWatch','starDial','birdClock','acornLamp','jarHut','crystalHanger','fossilSand','butterflyPool','seedSwap','returnBell','windSock','openGallery','paintSink','pawStamp','rainHarp','umbrellaHut','leafGutter','mossPath','spiritChime','grainMill','breadShelf','laundry','starLine','scarecrow','pickingBaskets','routeMap','birdScore','traderTent','rugShop','pondWindow','lanternLine','moonBasin','menuWindow']);
function townCanvas(size){
  const c=document.createElement('canvas');c.width=c.height=size;return c;
}
function nearestPigment(art,r,g,b){
  const key=(r>>3)<<10|(g>>3)<<5|(b>>3);
  let index=art.nearest[key];
  if(!index){
    const R=(r&248)+4,G=(g&248)+4,B=(b&248)+4;
    let best=Infinity;
    art.palette.forEach((color,i)=>{
      const dr=R-(color>>16),dg=G-(color>>8&255),db=B-(color&255);
      const distance=2*dr*dr+4*dg*dg+db*db;
      if(distance<best){best=distance;index=i+1;}
    });
    art.nearest[key]=index;
  }
  return art.palette[index-1];
}
function nativeView(art,s,f){
  if(art.views[f])return art.views[f];
  const n=art.size,src=art.image.height,painting=townCanvas(n),ctx=painting.getContext('2d',{willReadFrequently:true});
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(art.image,f*src,0,src,src,0,0,n,n);
  const frame=ctx.getImageData(0,0,n,n),ink=frame.data;
  const W=(f%2?s.h:s.w)*16,H=(f%2?s.w:s.h)*16,foot=new Int16Array(n).fill(-1);
  for(let y=0,i=0;y<n;y++)for(let x=0;x<n;x++,i+=4){
    if(ink[i+3]<128||y>n-1-Math.abs(x-2*W)/2){ink[i+3]=0;continue;}
    const c=nearestPigment(art,ink[i],ink[i+1],ink[i+2]);
    ink[i]=c>>16;ink[i+1]=c>>8&255;ink[i+2]=c&255;ink[i+3]=255;foot[x]=y;
  }
  ctx.putImageData(frame,0,0);
  const ground=townCanvas(n);
  if(s.role!=='decor'){
    const gc=ground.getContext('2d'),flag=gc.createImageData(n,n),p=flag.data;
    const stone=[0xaaa58a,0xc3b89a,0xd4c6a6,0xcbbc9e,0xdacdb1,0xb6ad91];
    for(let y=n/2-1;y<n;y++)for(let x=0;x<n;x++){
      const top=n/2-1+Math.abs(x-2*H)/2,bottom=n-1-Math.abs(x-2*W)/2;
      if(y<top||y>bottom)continue;
      const u=Math.floor((y-n/2+1+(x-2*H)/2)/2),v=Math.floor((y-n/2+1-(x-2*H)/2)/2);
      const course=Math.floor(v/4),column=Math.floor((u+course*3)/8);
      const seam=v%4===0||(u+course*3)%8===0;
      const tone=seam?0:1+((column*11+course*7)%4+4)%4,col=stone[tone];
      const base=foot[Math.max(0,x-2)],shadow=base>=0&&y>base&&y<=base+Math.max(2,n/37);
      const d=y>bottom-1?-25:shadow?-27:y<top+1?5:0,k=(y*n+x)*4;
      p[k]=(col>>16)+d;p[k+1]=(col>>8&255)+d;p[k+2]=(col&255)+d;p[k+3]=255;
    }
    gc.putImageData(flag,0,0);
  }
  return art.views[f]={painting,ground};
}
const illustratedCache=new Map();
return function draw(type,facing,phase=0,site=null){
  const art=townIllustrations.get(type),s=villageAdditions75[type],f=validFacing(facing);
  if(!art)return previousTownSprite(type,1,f);
  const variation=movingDesigns.has(type)?phase:0,item=exhibition(type,site);
  const key=type+'/'+f+'/'+variation,cached=illustratedCache.get(key);
  if(cached&&cached.item===item.key)return cached.canvas;
  const {painting,ground}=nativeView(art,s,f),canvas=townCanvas(art.size),ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.imageSmoothingEnabled=false;ctx.drawImage(ground,0,0);ctx.drawImage(painting,0,0);
  illustrateActivity(type,f,variation,item,art.bounds[f],ctx,painting,ground);
  illustratedCache.set(key,{item:item.key,canvas});return canvas;
};
