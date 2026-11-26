// Native 1px raster artwork, 2:1 ground projection and the existing warm timber palette.
// Every facade is drawn in world coordinates; four facings include proper rear walls.
const townArtCache1260=new Map();
function townPainter1260(g,w,h){
 const size=(w+h)*32,base=size-4-(w+h)*16;
 const xy=(x,y,z=0)=>[Math.round(size/2+(x-y)*32),Math.round(base+(x+y)*16-z)];
 const p=(c,x,y,ww=1,hh=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(ww)),Math.max(1,Math.round(hh)));};
 // Scan-line fill avoids antialiasing and keeps outlines aligned to the native pixel grid.
 function poly(points,c){
  points=points.map(([x,y])=>[Math.round(x),Math.round(y)]);
  const lo=Math.min(...points.map(p=>p[1])),hi=Math.max(...points.map(p=>p[1]));
  g.fillStyle=c;
  for(let y=lo;y<=hi;y++){
   const xs=[];
   for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
   }
   xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)g.fillRect(Math.round(xs[i]),y,Math.max(1,Math.round(xs[i+1])-Math.round(xs[i])),1);
  }
 }
 function line(a,b,c,width=1){
  let [x,y]=a.map(Math.round),[xx,yy]=b.map(Math.round),dx=Math.abs(xx-x),dy=-Math.abs(yy-y),sx=x<xx?1:-1,sy=y<yy?1:-1,err=dx+dy;
  for(let n=0;n<2000;n++){p(c,x,y,width,width);if(x===xx&&y===yy)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}
 }
 function face(points,c,outline='#53493e'){const pts=points.map(a=>xy(...a));poly(pts,c);if(outline)pts.forEach((a,i)=>line(a,pts[(i+1)%pts.length],outline));}
 function box(x,y,ww,hh,z,height,top='#e4c99a',light='#bd8c60',dark='#8e674b'){
  face([[x+ww,y,z],[x+ww,y+hh,z],[x+ww,y+hh,z+height],[x+ww,y,z+height]],dark);
  face([[x,y+hh,z],[x+ww,y+hh,z],[x+ww,y+hh,z+height],[x,y+hh,z+height]],light);
  face([[x,y,z+height],[x+ww,y,z+height],[x+ww,y+hh,z+height],[x,y+hh,z+height]],top);
 }
 return {size,xy,p,poly,line,face,box};
}
function townSprite1260(type,level=1,facing=0,frame=0,windows=0){
 facing=validFacing(facing);const s=TOWN1260[type],w=s.w,h=s.h;
 const key=[type,Math.min(5,level),facing,frame,windows].join(':');if(townArtCache1260.has(key))return townArtCache1260.get(key);
 const art=pixelSprite((w+h)*32,(w+h)*32,g=>{
  const {xy,p,poly,line,face,box}=townPainter1260(g,w,h),ink='#574735',cream='#f6dba8';
  const pt=(u,v,z=0)=>facing===0?[u*w,v*h,z]:facing===1?[(1-v)*w,u*h,z]:facing===2?[(1-u)*w,(1-v)*h,z]:[v*w,(1-u)*h,z];
  const point=(u,v,z=0)=>xy(...pt(u,v,z));
  const slab=(c,a)=>face(a.map(([u,v,z=0])=>pt(u,v,z)),c);
  const flower=(u,v)=>{const [x,y]=point(u,v,5);p('#597c4e',x,y,2,6);p('#9cac56',x-3,y+3,4,2);p('#ce7d73',x-2,y-2,5,4);p('#f2cb87',x,y-1,2,2);};
  const star=(x,y,c='#fff0af')=>{p('#9f704c',x-2,y-2,5,5);p(c,x,y-4,1,9);p(c,x-3,y,7,1);p(c,x-1,y-1,3,3);};
  // Low stone foundation, thin grass edge and individually chiselled paving.
  box(.025,.025,w-.05,h-.05,0,3,'#8eaa70','#7e895e','#627950');
  if(type==='glowMushrooms1260'||type==='bubblePot1260'){
   const order=type==='glowMushrooms1260'?[[.25,.28,8],[.63,.30,13],[.36,.68,11],[.74,.70,7]]:[[.5,.5,0]];
   for(const [u,v,n] of order){const [x,y]=point(u,v,4);
    if(n){p(ink,x-2,y-n,5,n);p('#e4d3a4',x-1,y-n,3,n-1);poly([[x-8,y-n],[x-5,y-n-6],[x+3,y-n-8],[x+8,y-n-3],[x+9,y-n+1],[x-6,y-n+3]],'#456969');poly([[x-7,y-n],[x-4,y-n-5],[x+3,y-n-6],[x+7,y-n-2],[x+7,y-n],[x-4,y-n+2]],frame?'#9cdac3':'#72a69b');p(cream,x-3,y-n-4,2,2);p('#d4ebe1',x+3,y-n-2,2,2);}
    else {poly([[x-9,y-19],[x-7,y-11],[x-11,y-7],[x-10,y+1],[x-6,y+5],[x+6,y+5],[x+10,y],[x+10,y-8],[x+6,y-12],[x+8,y-20]],ink);poly([[x-7,y-18],[x-5,y-10],[x-8,y-6],[x-7,y+1],[x-3,y+3],[x+5,y+2],[x+8,y-2],[x+7,y-8],[x+4,y-12],[x+6,y-18]],'#6b9e98');p('#a8c7af',x-6,y-9,3,8);poly([[x-9,y-20],[x-5,y-23],[x+5,y-23],[x+9,y-20],[x+5,y-17],[x-5,y-17]],'#e6c695');poly([[x-6,y-20],[x-3,y-21],[x+4,y-21],[x+6,y-20],[x+3,y-19],[x-3,y-19]],'#385a63');star(x+2,y-6,'#eed797');}
   }return;
  }
  const open=['mealGarden1260','musicHall1260','festivalSquare1260','rainGazebo1260'].includes(type);
  box(.10,.10,w-.20,h-.20,3,2,type==='mealGarden1260'?'#76533d':'#c4b58f','#a69a7d','#93866e');
  if(type==='mealGarden1260'){
   for(let y=.30;y<h-.2;y+=.48){box(.23,y,w-.46,.29,5,2,'#80573e','#a4744d','#684b3b');for(let x=.38;x<w-.2;x+=.32){const [xx,yy]=xy(x,y+.1,8);p('#496743',xx,yy-4,3,7);p('#7a9d4e',xx-4,yy-3,5,3);p('#b4c077',xx-3,yy-4,3,1);p('#62914f',xx+2,yy-5,4,4);p('#d1d994',xx+3,yy-5,2,1);}}
   box(w-.55,.15,.38,.32,5,12,'#d9ae72','#af7c50','#825e43');const [x,y]=xy(w-.35,.25,20);p(ink,x-8,y-3,16,9);p(cream,x-7,y-2,14,7);p('#689157',x-4,y,8,2);return;
  }
  if(type==='festivalSquare1260'){
   for(let y=.4;y<h;y+=.45)line(xy(.3,y,6),xy(w-.3,y,6),'#ae9c7d');
   box(w*.37,h*.37,w*.26,h*.26,6,18,'#d8a86e','#b67b51','#88543d');
   for(const [u,v] of [[.12,.12],[.88,.12],[.12,.88],[.88,.88]]){const [a,b]=pt(u,v);box(a-.04,b-.04,.08,.08,6,52,'#e8c28c','#b98755','#76543d');}
   for(const [a,b] of [[[.12,.12],[.88,.12]],[[.88,.12],[.88,.88]],[[.12,.88],[.88,.88]]]){
    line(point(...a,57),point(...b,57),'#695944');for(let i=1;i<6;i++){const u=a[0]+(b[0]-a[0])*i/6,v=a[1]+(b[1]-a[1])*i/6,[x,y]=point(u,v,51);p(ink,x-4,y-5,9,13);p(frame?'#f7cf75':'#bd7358',x-3,y-4,7,11);p(frame?'#fff1b5':'#e6af76',x-2,y-3,2,8);p('#775c47',x-3,y-1,7,1);}}
   flower(.15,.72);flower(.85,.72);return;
  }
  const bw=w*.78,bh=h*.72,x0=(w-bw)/2,y0=h*.08;
  const wall=type==='starHouse1260'?44:w>=4?62:35;
  if(!open){
   box(x0,y0,bw,bh,5,wall,'#efd0a0','#ce9d6b','#ac7e57');
   // Timber boards, corner beams and irregular stone footings.
   for(let z=10;z<wall+5;z+=6){line(xy(x0,y0+bh,z),xy(x0+bw,y0+bh,z),'#a97850');line(xy(x0+bw,y0,z),xy(x0+bw,y0+bh,z),'#896345');}
   for(const [x,y] of [[x0,y0+bh],[x0+bw,y0+bh],[x0+bw,y0]]){line(xy(x,y,5),xy(x,y,wall+6),'#72513c',3);line(xy(x,y,7),xy(x,y,wall+5),'#e5bc80');}
   for(let x=x0+.12;x<x0+bw;x+=.26){const [xx,yy]=xy(x,y0+bh,7);p('#ded2ac',xx,yy,6,3);p('#9f9279',xx+1,yy+3,4,1);}
  }else{
   box(.22,.22,w-.44,h-.44,6,4,'#d9b67f','#ad7e53','#866548');
   for(let y=.30;y<h-.2;y+=.22)line(xy(.25,y,11),xy(w-.25,y,11),'#b48c60');
   for(const [x,y] of [[.25,.25],[w-.25,.25],[.25,h-.55],[w-.25,h-.55]])box(x,y,.07,.07,10,wall,'#f4d298','#b38a58','#755840');
  }
  function window(side,t,lit=false,wide=false){
   const count=wide?.30:.14,z=wall*.65;
   const points=side==='y'?[[x0+bw*t-bw*count/2,y0+bh,z-11],[x0+bw*t+bw*count/2,y0+bh,z-11],[x0+bw*t+bw*count/2,y0+bh,z+5],[x0+bw*t-bw*count/2,y0+bh,z+5]]:
    [[x0+bw,y0+bh*t-bh*count/2,z-11],[x0+bw,y0+bh*t+bh*count/2,z-11],[x0+bw,y0+bh*t+bh*count/2,z+5],[x0+bw,y0+bh*t-bh*count/2,z+5]];
   face(points,lit?'#ffdc83':'#5e9fa3');const q=points.map(a=>xy(...a));line(q[0],q[1],'#f3d8a4',3);line(q[2],q[3],'#f2d7a2',2);line([(q[0][0]+q[1][0])/2,(q[0][1]+q[1][1])/2],[(q[2][0]+q[3][0])/2,(q[2][1]+q[3][1])/2],'#8d6448');line(q[0],q[3],'#f4d6a2');line([q[3][0]+2,q[3][1]+3],[q[2][0]-2,q[2][1]+3],lit?'#fff1b6':'#b8ded0');
  }
  if(!open){
   const n=type==='starHouse1260'?5:w>=4?4:2;
   for(let i=0;i<n;i++)window('y',(i+.5)/n,i<windows,type==='dropAquarium1260');
   for(let i=0;i<(type==='starHouse1260'?5:2);i++)window('x',(i+.5)/(type==='starHouse1260'?5:2),i+5<windows,type==='dropAquarium1260');
  }
  // The front door actually moves to the chosen wall; rear-facing lots show the back.
  if(!open&&facing<2){
   const z=5,edge=facing===0?[[x0+bw*.41,y0+bh,z],[x0+bw*.59,y0+bh,z],[x0+bw*.59,y0+bh,z+27],[x0+bw*.41,y0+bh,z+27]]:null;
   if(edge){face(edge,'#684b39');face([[x0+bw*.43,y0+bh,z+1],[x0+bw*.57,y0+bh,z+1],[x0+bw*.57,y0+bh,z+25],[x0+bw*.43,y0+bh,z+25]],'#a77349');const [xx,yy]=xy(x0+bw*.55,y0+bh,17);p('#f9d383',xx,yy,2,2);}
  }
  if(!open&&facing===3){face([[x0+bw,y0+bh*.4,5],[x0+bw,y0+bh*.60,5],[x0+bw,y0+bh*.60,32],[x0+bw,y0+bh*.40,32]],'#815637');}
  if(type==='musicHall1260'){
   const [xx,yy]=point(.5,.3,34);p('#654b42',xx-13,yy-14,27,21);p('#a75558',xx-11,yy-12,23,17);p('#edba77',xx-2,yy-10,3,12);p('#edba77',xx,yy-10,6,2);p('#edba77',xx-5,yy,6,3);
  }
  // Gabled tiled roof, visible individual teal shingles and a warm eave.
  const roof=type==='grandTheater1260'?['#755c78','#9f7790','#c49aab']:type==='starRestaurant1260'?['#3b6378','#527f95','#85adb6']:type==='forestBakery1260'?['#8b5c43','#be7f4e','#e2b474']:['#326965','#478e82','#86b7a0'];
  const a=x0-.10,b=y0-.12,c=x0+bw+.10,d=y0+bh+.12,z=wall+9,rise=w>=4?32:22,mid=(b+d)/2;
  if(type==='dropAquarium1260'){
   for(let i=0;i<6;i++){const xx=a+(c-a)*i/6,zz=z+6+Math.sin(i*Math.PI/2)*7;box(xx,b,(c-a)/6,d-b,zz,5,'#78b4bf','#4f8f9d','#355a70');}
  }else{
   face([[a,b,z],[c,b,z],[c,mid,z+rise],[a,mid,z+rise]],roof[0]);
   face([[a,mid,z+rise],[c,mid,z+rise],[c,d,z],[a,d,z]],roof[1]);
   face([[c,b,z],[c,d,z],[c,mid,z+rise]],'#d7b786');
   for(let k=1;k<7;k++){const t=k/7,y=mid+(d-mid)*t,zz=z+rise*(1-t);line(xy(a,y,zz),xy(c,y,zz),roof[0]);line(xy(a,y,zz+1),xy(c,y,zz+1),roof[2]);for(let x=a+.15+(k%2)*.12;x<c;x+=.26)line(xy(x,y,zz),xy(x,y+(d-mid)/7,zz-rise/7),roof[0]);}
   line(xy(a,mid,z+rise),xy(c,mid,z+rise),roof[2],2);
   line(xy(a,d,z),xy(c,d,z),ink,3);line(xy(a,d,z+2),xy(c,d,z+2),cream);
   if(type==='starHouse1260'||type==='forestBakery1260'||type==='artHut1260')box(a+.2,b+.15,.25,.24,z+2,17,'#ecc09a','#c16b4c','#964e3c');
  }
  if(open){
   slab('#edcf96',[[.37,.92,6],[.63,.92,6],[.63,1,3],[.37,1,3]]);
   const [x,y]=point(.77,.89,24);p(ink,x-7,y-7,15,15);p('#e9ca92',x-6,y-6,13,12);
   if(type==='musicHall1260'){p('#965e66',x,y-4,2,8);p('#965e66',x+1,y-4,4,2);p('#965e66',x-3,y+3,4,2);}
   else{p('#739391',x-4,y-3,9,2);p('#739391',x,y-3,1,7);}
  }
  if(['grandTheater1260','starRestaurant1260','traderPost1260'].includes(type)){
   const red=type==='grandTheater1260'?'#bc5d59':type==='traderPost1260'?'#cda561':'#668c9c';
   slab(red,[[.17,.83,34],[.83,.83,34],[.83,.98,27],[.17,.98,27]]);
   for(let i=0;i<7;i++)slab(i%2?'#efd6a2':red,[[.17+i*.094,.98,27],[.264+i*.094,.98,27],[.264+i*.094,.98,21],[.17+i*.094,.98,21]]);
  }
  const [sx,sy]=point(.5,.84,wall+8);
  if(type==='grandTheater1260'||type==='visitorInfo1260'||type==='townHall1260'){
   p(ink,sx-20,sy-9,41,16);p('#eecb8b',sx-18,sy-7,37,12);
   if(type==='grandTheater1260'){for(const dx of [-9,7]){p('#986579',sx+dx-4,sy-5,8,9);p(cream,sx+dx-2,sy-3,1,1);p(cream,sx+dx+2,sy-3,1,1);p(cream,sx+dx-1,sy+1,3,1);}}
   else if(type==='visitorInfo1260'){p('#457778',sx-1,sy-5,3,2);p('#457778',sx-1,sy-1,3,5);}
   else{p('#8b775b',sx-10,sy-3,20,1);p('#8b775b',sx-7,sy,14,1);}
  }
  if(type==='starRestaurant1260'||type==='starHouse1260'){const [x,y]=point(.5,.35,z+rise+5);star(x,y);}
  if(type==='forestBakery1260'){
   const [x,y]=point(.65,.87,26);p(ink,x-10,y-5,21,12);poly([[x-8,y+2],[x-8,y-2],[x-4,y-4],[x+5,y-4],[x+8,y],[x+7,y+3]],'#edbd73');for(let k=0;k<3;k++)line([x-4+k*4,y-3],[x-5+k*4,y+1],'#b67e48');
  }
  if(type==='artHut1260'){
   for(let i=0;i<2;i++){const [x,y]=point(.2+i*.6,.96,20);p(ink,x-9,y-10,18,22);p('#fff0c2',x-7,y-8,14,17);if((frame+i)%2){p('#8c7950',x,y-1,2,8);poly([[x-5,y],[x,y-7],[x+5,y]],'#71975a');}else{p('#ad8670',x-3,y,6,5);p('#ad8670',x-4,y-4,2,3);p('#ad8670',x,y-6,2,3);p('#ad8670',x+4,y-4,2,3);}}
  }
  for(const [u,v] of [[.10,.85],[.90,.85]])flower(u,v);
  if(level>=2&&!s.noUpgrade){const [x,y]=point(.78,.83,wall+12);for(let i=0;i<Math.min(4,level-1);i++)p('#f7d48d',x+i*4,y,2,3);}
 });
 townArtCache1260.set(key,art);return art;
}
function drawTownLot1260(b,facing,level,preview,now){
 const type=b.type,night=state.hour>=18||state.hour<6;
 const residents=type==='starHouse1260'&&night?townActors1260().filter(a=>a.indoorRest?.buildingId===b.id).length:0;
 const frame=type==='artHut1260'?(b.townPicture1260||0):night?1:0;
 const art=townSprite1260(type,level,facing,frame,residents),rect=plotImageRect(b);
 ctx.drawImage(art,rect.x,rect.y,rect.w,rect.h);
 if(preview)return;
 mapPickItems.push({building:b,art,rect});
 const painter=townPainter1260(ctx,B[type].w,B[type].h);
 const point=(u,v,z=0)=>{const [x,y]=painter.xy(u*B[type].w,v*B[type].h,z);return [rect.x+x,rect.y+y];};
 if(type==='glowMushrooms1260'&&night){
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.16+.11*Math.sin(now/1700+b.id);
  const [x,y]=point(.5,.5,14);ctx.fillStyle='#c0ffe0';ctx.fillRect(x-15,y-9,30,20);ctx.restore();
 }
 if(type==='bubblePot1260'){
  const interacting=[...townVisits1260.values()].find(v=>v.site===b&&v.elapsed>0);
  const phase=interacting?interacting.elapsed:(now/1000+b.id)%12;
  if(phase<2){const [x,y]=point(.5,.5,26+phase*7);const r=3+Math.floor(phase);ctx.strokeStyle='#bde4dd';ctx.lineWidth=1;ctx.strokeRect(Math.round(x-r+Math.sin(phase*2)*3),Math.round(y-r),r*2,r*2);ctx.fillStyle='#fff4d5';ctx.fillRect(Math.round(x-r+1+Math.sin(phase*2)*3),Math.round(y-r+1),2,1);}
 }
 if(type==='dropAquarium1260'){
  for(let i=0;i<7;i++){const [x,y]=point(.18+i*.10,.80,20+((now/650+i*7)%24));ctx.fillStyle=i%2?'#b9f0e5':'#82d3dc';ctx.fillRect(Math.round(x),Math.round(y),2,2);}
 }
 if(type==='grandTheater1260'&&state.hour>=17||type==='starRestaurant1260'&&night){
  const [x,y]=point(.5,.83,35);ctx.fillStyle='#ffe6a2';ctx.fillRect(Math.round(x)-14,Math.round(y),4,4);ctx.fillRect(Math.round(x)+12,Math.round(y)+13,4,4);
 }
 const visitors=townPresent1260(b);
 if(type==='grandTheater1260'&&visitors.length||type==='starRestaurant1260'&&visitors.some(a=>a.fromOutside101))drawMapBubble(rect.x+rect.w/2,rect.y+rect.h*.35,type==='grandTheater1260'?'🎭':'🍚',now,b.id);
 if(type==='traderPost1260'&&townTrader1260()){
  const [x,y]=point(.5,.78,0);ctx.drawImage(citizen17('男',2,true),Math.round(x-16),Math.round(y-32),32,32);drawMapBubble(x,y-40,'📦',now,b.id);
 }
}
const townSpriteBefore1260=spriteBuildingV161;
spriteBuildingV161=function(type,level=1,facing=0){return TOWN1260[type]?townSprite1260(type,level,facing):townSpriteBefore1260(type,level,facing);};
spriteBuilding=spriteBuildingV161;
// Lv25 gains an upper crown, Lv30 a second luminous crown and hanging star fruit.
const townTreeBefore1260=worldTreeMilestoneArt,townTreeCache1260=new Map();
worldTreeMilestoneArt=function(tree,level,hour,progress,direction){
 const base=townTreeBefore1260(tree,level,hour,progress,direction);if(level<25)return base;
 const tier=level>=30?2:1,key=[tier,direction,hour>=19||hour<6,Math.floor(progress*6)%4].join(':');
 if(!treeDecorationReady)return base;
 if(townTreeCache1260.has(key))return townTreeCache1260.get(key);
 const art=pixelSprite(base.width,base.height,g=>{
  g.drawImage(base,0,0);const scale=base.width/192;
  g.save();g.scale(scale,scale);const {p,poly,line}=townPainter1260(g,3,3);
  // Extend the existing crown with its own native foliage, joined to the trunk.
  // Sampling its leaf clusters keeps the established palette and pixel texture.
  poly([[91,83],[89,65],[82,52],[87,49],[97,63],[105,49],[110,51],[103,67],[103,84]],'#946039');
  poly([[94,81],[93,64],[87,53],[89,53],[98,65],[106,53],[108,53],[101,68],[100,82]],'#dbac65');
  g.imageSmoothingEnabled=false;
  if(tier===1)g.drawImage(base,30*scale,34*scale,132*scale,62*scale,35,19,122,58);
  else g.drawImage(base,30*scale,34*scale,132*scale,62*scale,25,8,142,67);
  // The original foreground crown masks the cropped lower edge.
  g.drawImage(base,0,0,base.width,base.height,0,0,192,192);
  const positions=tier===2?[[58,55],[83,44],[108,38],[137,55],[153,78]]:[[76,55],[102,46],[127,60]];
  for(const [x,y] of positions){line([x,y],[x,y+8],'#99805c');p('#ac7c54',x-3,y+6,7,7);p('#f1ce82',x-2,y+7,5,5);p('#fff0bb',x,y+5,1,9);p('#fff0bb',x-4,y+9,9,1);}
  g.restore();
 });townTreeCache1260.set(key,art);return art;
};
