
// ==== Ver 1.25.65: flush town plots, open-air music square and tree crowns ====
// Source artwork is drawn at the same native pixel resolution and in the same
// four orthographic isometric orientations as the other town installations.
const townFrameBefore12565=townNativeFrame;
const townArtCache12565=new Map();
const townCrownCache12565=new WeakMap();
function flatTownFloor12565(k,green=false){
  const size=k.canvas.width,face=k.direction??0;
  // Every town floor shares the exact same 32-by-16 tile surface, with no raised kerb.
  const m=k.plotDimensions12565||{w:size/64,h:size/64};
  const w=m.w,h=m.h,g=k.ctx,colors=green?
    ['#9ba86b','#a9b779','#b4be82','#8a9f64']:
    ['#d9c09c','#dec6a3','#e7ceaa','#d3b68f'];
  for(let x=0;x<size;x++){
    const top=size/2+Math.abs(x+.5-h*32)/2;
    const bottom=size-Math.abs(x+.5-w*32)/2;
    const y0=Math.ceil(top-.5),y1=Math.ceil(bottom-.5);
    for(let y=Math.max(0,y0);y<Math.min(size,y1);y++){
      const dx=(x+.5-h*32)/32,dy=(y+.5-size/2)/16;
      const u=(dy+dx)/2,v=(dy-dx)/2;
      const tile=(Math.floor(u*3)+Math.floor(v*3)*7)&3;
      g.fillStyle=colors[tile];g.fillRect(x,y,1,1);
    }
  }
}
function newTownKit12565(w,h,face,green=false){
  const kit=townArtKit(w,h,face);
  kit.plotDimensions12565=face%2?{w:h,h:w}:{w,h};
  flatTownFloor12565(kit,green);
  return kit;
}
function plotTile12565(k,u,v,width,depth,fill,border,z=-2){
  k.poly([[u,v,z],[u+width,v,z],[u+width,v+depth,z],[u,v+depth,z]],fill,border);
}
function stageStool12565(k,u,v){
  // Low benches, intentionally inside the square's projection.
  k.box(u,v,.46,.18,-2,4,{top:'#edc994',front:'#b98756',side:'#976748',line:'#75513d'});
  for(const du of [.07,.35])k.line([[u+du,v+.17,0],[u+du,v+.17,5]],'#896443',2);
}
function openMusicSquare12565(face){
  const k=newTownKit12565(3,3,face),g=k.ctx;
  // Paving is level with neighboring road tiles: broad open dance floor,
  // a small rear stage, and free standing lamps instead of a concert hall roof.
  for(let row=0;row<11;row++)for(let col=0;col<11;col++){
    const u=.10+col*.255,v=.10+row*.255;
    if(u+0.23>=2.94||v+0.23>=2.94)continue;
    plotTile12565(k,u,v,.23,.23,(row+col)%3===0?'#eecfa8':'#e7c499',null);
  }
  const ring=[];
  for(let j=0;j<24;j++){
    const a=j*Math.PI/12;
    ring.push([1.5+.81*Math.cos(a),1.59+.81*Math.sin(a),-1]);
  }
  k.poly(ring,'#f0d5b0','#a88b69');
  k.poly(ring.map(([u,v])=>[1.5+(u-1.5)*.87,1.59+(v-1.59)*.87,-1]),
    '#e6cda6','#d9b68b');
  // Music emblem in the paving: pixel art note, not a tall statue.
  const [cx,cy]=k.pt(1.48,1.56,-1),ix=Math.round(cx),iy=Math.round(cy);
  g.fillStyle='#9a774e';
  g.fillRect(ix+8,iy-17,3,18);g.fillRect(ix+11,iy-17,10,3);
  g.fillRect(ix+18,iy-13,3,8);g.fillRect(ix+2,iy,9,5);
  g.fillRect(ix-3,iy+2,7,5);g.fillRect(ix+12,iy-1,8,5);
  // Short, low wooden performance platform on the far edge.
  k.box(.60,.22,1.80,.60,-2,5,
    {top:'#d3a16e',front:'#aa774b',side:'#875d3f',line:'#6c4e3d'});
  for(let j=0;j<7;j++){
    const u=.68+j*.255;k.line([[u,.27,3],[u,.76,3]],'#efc995');
  }
  const post=(u,v)=>{
    k.box(u,v,.10,.10,-2,32,{top:'#d6a96f',front:'#996c45',side:'#78553a',line:'#5d473a'});
    const [x,y]=k.pt(u+.05,v+.05,30);
    k.pixel(x-5,y-3,'#584844',11,2);
    k.pixel(x-4,y-1,'#e7b962',9,7);
    k.pixel(x-2,y,'#fff1bc',4,4);
    k.pixel(x-2,y+6,'#895f43',4,2);
  };
  // Four small lamps read as an open plaza instead of an enclosed auditorium.
  for(const [u,v] of [[.23,.26],[2.66,.27],[.23,2.64],[2.65,2.65]]){
    post(u,v);
  }
  for(const [u,v] of [[.35,1.48],[2.18,1.48],[.67,2.46],[1.87,2.46]])stageStool12565(k,u,v);
  for(const [u,v] of [[.16,.99],[2.73,.98],[.21,2.34],[2.66,2.31]]){
    k.plant(u,v,2,'flowers',.9);
  }
  k.sign(1.5,.52,42,'music',2);
  return k.canvas;
}
function fullKitchenGarden12565(face){
  const k=newTownKit12565(2,3,face,true);
  // 2x3 plot: long raised beds fill nearly the full footprint; no empty margins.
  for(let lane=0;lane<2;lane++){
    const u=.10+lane*.93;
    plotTile12565(k,u,.10,.85,2.80,'#735b41','#6e563e');
    plotTile12565(k,u+.065,.14,.72,2.71,
      lane===0?'#997654':'#8d7150','#b89565');
    for(let i=0;i<11;i++){
      const v=.24+i*.235;
      for(let j=0;j<3;j++){
        const x=u+.21+j*.21;
        const color=(lane+i+j)%5===0?'#e59f61':(lane+i)%3===0?'#98be69':'#5f9758';
        const [px,py]=k.pt(x,v,4+(i+j)%3);
        k.pixel(px-3,py-2,'#436c43',7,5);
        k.pixel(px-2,py-4,color,5,5);
        k.pixel(px,py-5,'#d0d88e',2,2);
      }
    }
  }
  // Repeated tiny seedlings and flowers at the extreme four corners.
  for(const [u,v] of [[.09,.09],[1.89,.09],[.09,2.89],[1.89,2.89]]){
    k.dot(u,v,4,'#d5bd83',2,2);
    k.dot(u,v,9,'#87af61',4,4);
  }
  return k.canvas;
}
function transparentTownOrnament12565(type,face){
  const k=townArtKit(1,1,face),g=k.ctx;
  const [px,py]=k.pt(.50,.50,-2),cx=Math.round(px),ground=Math.round(py);
  function pixel(dx,dy,color,w=1,h=1){
    const mirror=type==='glowMushrooms'&&(face===1||face===3);
    const shift=type==='glowMushrooms'?[0,2,-1,1][face]:0;
    k.pixel(cx+(mirror?-dx-w:dx)+shift,ground+dy,color,w,h);
  }
  if(type==='bubblePot'){
    // No ground/grass/stone pixel: the road underneath remains visible.
    pixel(-11,-23,'#4b6060',23,4);
    pixel(-9,-26,'#8fc0c5',19,4);
    pixel(-10,-20,'#597881',21,16);
    pixel(-8,-20,'#a1c9c2',7,9);
    pixel(-4,-18,'#d4eecc',5,4);
    pixel(5,-17,'#7fabb1',4,11);
    pixel(-7,-5,'#4b6060',16,4);
    pixel(-4,-2,'#698780',10,3);
    const d=(face*2)%5;
    for(const [x,y,r] of [[-11,-37,4],[6,-43,3],[15,-32,3],[-1,-49,4]]){
      const dx=x+((d+y)%3);
      pixel(dx,y,'#8dcad1',r,r);
      pixel(dx+1,y+1,'#eaf9ea',Math.max(1,r-2),Math.max(1,r-2));
    }
  }else{
    // One-piece mushroom silhouette: feet touch road with zero opaque terrain.
    for(const [dx,dy,w,h] of [[-12,-19,7,22],[-1,-25,8,28],[11,-16,6,18]]){
      pixel(dx,dy,'#415c51',w,h);
      pixel(dx+2,dy+2,'#b4d2a2',Math.max(2,w-3),h-4);
    }
    for(const [dx,dy,wide] of [[-15,-23,16],[-6,-31,20],[7,-19,15]]){
      pixel(dx,dy,'#42665f',wide,5);
      pixel(dx+1,dy-4,'#5aa69c',wide-2,6);
      pixel(dx+4,dy-6,'#9bdac6',wide-7,4);
      pixel(dx+wide-5,dy-2,'#c8f4cb',3,2);
    }
    for(const [dx,dy] of [[-18,-30],[17,-35],[-12,-41],[12,-46]]){
      pixel(dx,dy,'#bcead0',2,2);
    }
  }
  return k.canvas;
}
function flattenTownPlinth12565(type,face,base){
  // The original 1.25.64 images contain a small dark kerb along the front.
  // Copy the same plot's upper paving onto its lowest 3 pixels, keeping full
  // original architecture, four-corner alignment, silhouettes and occupancy.
  const spec=townCatalog[type],w=face%2?spec.h:spec.w,h=face%2?spec.w:spec.h;
  const size=base.size,canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');g.drawImage(base.canvas,0,0);
  const frame=g.getImageData(0,0,size,size),d=frame.data;
  for(let x=0;x<size;x++){
    const top=size/2+Math.abs(x+.5-h*32)/2;
    const bottom=size-Math.abs(x+.5-w*32)/2;
    const y0=Math.ceil(top-.5),y1=Math.ceil(bottom-.5);
    if(y1-y0<6)continue;
    const sample=Math.min(y1-4,Math.max(y0+2,Math.ceil(bottom-5.2)));
    const i=(sample*size+x)*4;
    if(d[i+3]!==255)continue;
    for(let y=Math.max(y0,y1-3);y<y1;y++){
      const at=(y*size+x)*4;
      if(d[at+3]===255){
        d[at]=d[i];d[at+1]=d[i+1];d[at+2]=d[i+2];
      }
    }
  }
  g.putImageData(frame,0,0);
  return canvas;
}
townNativeFrame=function(type,face){
  face=validFacing(face);
  if(type==='festivalPlaza')return townFrameBefore12565(type,face);
  const key=type+':'+face;
  if(townArtCache12565.has(key))return townArtCache12565.get(key);
  const custom={bubblePot:()=>transparentTownOrnament12565(type,face),
    glowMushrooms:()=>transparentTownOrnament12565(type,face),
    musicHall:()=>openMusicSquare12565(face),
    kitchenGarden:()=>fullKitchenGarden12565(face)};
  const old=townFrameBefore12565(type,face);
  const canvas=custom[type]?custom[type]():townCatalog[type]?
    flattenTownPlinth12565(type,face,old):old.canvas;
  const rgba=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  const frame={canvas,rgba,size:canvas.width,variants:new Map()};
  townArtCache12565.set(key,frame);
  return frame;
};
// Dramatically different silhouettes at Lv25 and Lv30, rather than only
// tinting the existing canopy. Preserve the native trunk, 6x6 footprint and
// all existing season/day-night animations.
crownExpansionArt=function(base,level,facing=0){
  if(!base||level<25||base.width!==384||base.height!==384)return base;
  const dir=validFacing(facing),tier=level>=30?1:0,key=tier*4+dir;
  let cache=townCrownCache12565.get(base);
  if(!cache){cache=new Map();townCrownCache12565.set(base,cache);}
  if(cache.has(key))return cache.get(key);
  const c=document.createElement('canvas');c.width=c.height=384;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(base,0,0);
  const offset=[0,4,-3,2][dir],mid=190+offset;
  function pix(x,y,color,s=3){
    g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),s,s);
  }
  function bough(points,shade,light){
    for(let j=1;j<points.length;j++){
      let [x,y]=points[j-1], [tx,ty]=points[j];
      const steps=Math.max(Math.abs(tx-x),Math.abs(ty-y));
      for(let i=0;i<=steps;i++){
        const p=i/steps;
        pix(x+(tx-x)*p-3,y+(ty-y)*p-2,shade,8);
        pix(x+(tx-x)*p-1,y+(ty-y)*p-4,light,3);
      }
    }
  }
  if(tier){
    bough([[mid,172],[mid-44,119],[mid-100,75]],'#5e504a','#b38b57');
    bough([[mid+7,165],[mid+61,105],[mid+112,58]],'#5e504a','#b38b57');
    bough([[mid,141],[mid-7,81],[mid+16,34]],'#5e504a','#b38b57');
  }else{
    bough([[mid,171],[mid-52,127],[mid-113,93]],'#43534a','#8e704b');
    bough([[mid+8,166],[mid+61,122],[mid+112,89]],'#43534a','#8e704b');
    bough([[mid,146],[mid+7,92],[mid-11,66]],'#43534a','#8e704b');
  }
  const colors=tier?
    ['#6b6750','#ad965c','#d5b470','#f3d49a','#f8e8bb','#b1c59d']:
    ['#245b58','#317c69','#54a180','#7db99a','#bed5a5','#e2eac3'];
  const blobs=tier?
    [[-95,87,52,25],[-61,61,60,30],[-19,42,60,28],[39,53,62,33],[94,82,57,28],[-49,117,74,28],[29,111,83,34],[3,22,36,25]]:
    [[-104,104,45,25],[-64,83,65,32],[-8,73,73,34],[58,86,67,33],[107,110,45,25],[-32,116,73,30],[41,120,64,31]];
  function foliage(cx,cy,rx,ry,seed){
    for(let y=-ry;y<=ry;y+=3)for(let x=-rx;x<=rx;x+=3){
      const a=x/rx,b=y/ry,rough=Math.sin(x*.31+y*.18+seed)*.06;
      if(a*a+b*b>1+rough)continue;
      const light=(x-y*.5)/Math.max(1,rx)*.5+.42;
      const index=Math.max(0,Math.min(colors.length-1,Math.floor(light*colors.length)));
      pix(cx+x,cy+y,colors[index],3);
    }
    for(let j=0;j<9;j++){
      const x=Math.round(cx-rx*.7+((j*37+seed*11)%(Math.max(2,rx*1.4)))),
        y=Math.round(cy-ry*.60+(j*19+seed*7)%(Math.max(2,ry)));
      pix(x,y,tier?'#fff0cb':'#d2ead6',3);
    }
  }
  blobs.forEach(([x,y,rx,ry],i)=>foliage(mid+x,y,rx,ry,i+dir*3));
  // Lv25: dangling spring blossoms. Lv30: clusters of eight-point star flowers
  // and luminous fruit on the outer canopy. Each is part of a distinct redraw.
  const blossoms=tier?
    [[-107,83],[-77,52],[-46,91],[-21,35],[18,45],[49,76],[96,79],[-87,122],[83,122],[3,104]]:
    [[-105,111],[-76,100],[-44,123],[-11,93],[37,109],[75,101],[104,118],[-54,150],[53,155]];
  for(const [j,[x,y]] of blossoms.entries()){
    const px=mid+(dir%2?-x:x),py=y+(j%3)*2;
    if(tier){
      pix(px-2,py-6,'#f8e2a4',5);
      pix(px-7,py-2,'#f4d2a0',4);
      pix(px+4,py-2,'#f4d2a0',4);
      pix(px-2,py+3,'#fff1c9',5);
      pix(px,py,'#e5a978',2);
      pix(px+2,py-14,'#fff9d1',2);
      pix(px-4,py-11,'#f7dda1',2);
    }else{
      for(let step=0;step<11;step++)pix(px,py+step,'#8b9e77',2);
      pix(px-4,py+12,'#e7c5bb',9,4);
      pix(px-3,py+9,'#f2ded4',7,5);
      pix(px-1,py+11,'#fff5dc',3,4);
    }
  }
  cache.set(key,c);return c;
};
// ==== End Ver 1.25.65 art update ====
