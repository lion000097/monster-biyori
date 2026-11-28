const axisSprites=new Map();
await Promise.all(Object.entries(axisAtlas).map(async ([type,[size,uri,changes,display]])=>{
  const image=new Image();image.src=uri;await image.decode();
  axisSprites.set(type,{size,image,changes,display,views:new Map()});
}));

function axisSprite(type,f,phase=0,item={}){
  const {size,image,changes,display,views}=axisSprites.get(type);
  // Only these buildings have visual state. Others may still have activity counters.
  if(type==='eggWatch')phase=Math.min(3,Math.max(0,phase|0));
  else if(type!=='guild212'&&type!=='breadShelf'&&type!=='jarHut'&&type!=='umbrellaHut')phase=0;
  const stateKey=phase+'-'+(type==='eggWatch'?((item.eggs||0)&((1<<phase)-1)):0);
  const key=f+'/'+stateKey,last=views.get(key),subject=display?item.key||'':'';
  if(last&&last.subject===subject)return last.canvas;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
  g.drawImage(image,f*size,0,size,size,0,0,size,size);
  const patch=changes[stateKey]?.[f];
  if(patch){
    const [sx,sy,x,y,w,h]=patch;
    g.clearRect(x,y,w,h);g.drawImage(image,sx,sy,w,h,x,y,w,h);
  }
  if(item.source&&display){
    const [x,y,visible]=display[f],n=visible.length;
    const thumb=document.createElement('canvas');thumb.width=thumb.height=n;
    const t=thumb.getContext('2d',{willReadFrequently:true});t.imageSmoothingEnabled=false;
    t.drawImage(...item.source,0,0,n,n);
    for(let v=0;v<n;v++)for(let u=0;u<n;u++){
      if(!(visible[v]&(1<<u)))t.clearRect(u,v,1,1);
    }
    g.drawImage(thumb,x,y);
  }
  views.set(key,{canvas,subject});return canvas;
}
