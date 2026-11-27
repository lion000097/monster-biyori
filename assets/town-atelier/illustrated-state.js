// Positions are percentages of the visible illustration, excluding the empty tile margins.
function illustrateActivity(type,f,phase,item,rect,ctx,painting,ground){
  const [left,top,width,height]=rect,front=f===0||f===3,flip=f===3;
  const X=x=>left+Math.round(x*(width-1)/100),Y=y=>top+Math.round(y*(height-1)/100);
  const px=(x,y,color,w=1,h=1)=>{ctx.fillStyle=color;ctx.fillRect(X(x),Y(y),w,h);};
  const line=(ax,ay,bx,by,color)=>{
    const x0=X(ax),y0=Y(ay),x1=X(bx),y1=Y(by),steps=Math.max(1,Math.abs(x1-x0),Math.abs(y1-y0));
    ctx.fillStyle=color;
    for(let t=0;t<=steps;t++)ctx.fillRect(Math.round(x0+(x1-x0)*t/steps),Math.round(y0+(y1-y0)*t/steps),1,1);
  };
  const spark=(x,y,c='#fff3b5')=>{
    const dx=100/width,dy=100/height;line(x-dx,y,x+dx,y,c);line(x,y-dy,x,y+dy,c);
  };
  const gem=(x,y,face,light)=>{
    const s=Math.max(2,Math.round(width*.034));
    px(x,y,'#62442f',s+1,s+1);px(x,y,face,s,s);px(x,y,light,Math.max(1,s-1),1);
  };
  function tint(x,y,w,h,select,color,mix){
    const ix=X(x),iy=Y(y),iw=Math.max(1,X(x+w)-ix),ih=Math.max(1,Y(y+h)-iy);
    const data=ctx.getImageData(ix,iy,iw,ih),p=data.data;
    for(let i=0;i<p.length;i+=4){
      const r=p[i],g=p[i+1],b=p[i+2];
      if(!p[i+3]||!select(r,g,b))continue;
      const light=.40+.60*Math.max(r,g,b)/255;
      p[i]=r*(1-mix)+color[0]*light*mix;p[i+1]=g*(1-mix)+color[1]*light*mix;p[i+2]=b*(1-mix)+color[2]*light*mix;
    }
    ctx.putImageData(data,ix,iy);
  }
  const warm=(r,g,b)=>r>g*1.08&&g>b*1.22;
  const fabric=(r,g,b)=>Math.max(r,g,b)-Math.min(r,g,b)>34&&Math.max(r,g,b)>72;
  const seasons=[[211,126,105],[109,167,93],[225,136,63],[126,161,202]];
  function imagePanel(img,sx,sy,sw,sh,x,y,w,h,slope=0){
    const xx=X(x),yy=Y(y),ww=Math.max(2,X(x+w)-xx),hh=Math.max(2,Y(y+h)-yy);
    for(let col=0;col<ww;col++){
      const srcX=sx+Math.min(sw-1,Math.floor(col*sw/ww));
      ctx.drawImage(img,srcX,sy,1,sh,xx+col,yy+Math.round(col*slope),1,hh);
    }
  }
  function specimen(x,y,w,h){
    if(!item.source)return;
    const [sheet,sx,sy,sw,sh]=item.source;
    imagePanel(sheet,sx||0,sy||0,sw||sheet.width,sh||sheet.height,x,y,w,h);
  }
  function chart(x,y,w,h,id){
    const xx=X(x),yy=Y(y),ww=Math.max(4,X(x+w)-xx),hh=Math.max(4,Y(y+h)-yy);
    ctx.fillStyle='#29394d';ctx.fillRect(xx,yy,ww,hh);
    let seed=(id+17)*7651;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const points=Array.from({length:5},()=>[x+w*(.1+.78*next()),y+h*(.1+.78*next())]);
    for(let i=1;i<points.length;i++)line(...points[i-1],...points[i],'#779ba1');
    points.forEach(([u,v],i)=>px(u,v,i%2?'#ebd68a':'#e2f0d8'));
  }
  function sway(x,y,w,h,amplitude){
    const x0=X(x),y0=Y(y),ww=X(x+w)-x0,hh=Y(y+h)-y0;
    ctx.clearRect(x0,y0,ww,hh);ctx.drawImage(ground,x0,y0,ww,hh,x0,y0,ww,hh);
    for(let j=0;j<hh;j++){
      const shift=Math.round(Math.sin(phase*Math.PI/2+j/Math.max(hh,1)*1.8)*amplitude*j/hh);
      ctx.drawImage(painting,x0,y0+j,ww,1,x0+shift,y0+j,ww,1);
    }
  }
  if(type==='openGallery'&&front&&(Number.isInteger(item.picture)||phase)){
    const id=((item.picture??phase)%16+16)%16;
    if(illustratedSigns.naturalWidth)imagePanel(illustratedSigns,id%4*32+2,Math.floor(id/4)*32+2,28,28,flip?39:40,33,18,23,flip?-.05:.05);
  }
  if((type==='starChart'||type==='nightHide')&&Number.isInteger(item.picture)&&front){
    if(type==='starChart')chart(flip?31:48,74,10,7,item.picture);
    else chart(flip?20:72,58,10,14,item.picture);
  }
  if(type==='amberShelf'&&item.source)specimen(41,front?50:52,19,17);
  if(type==='stoneStudy'&&front)specimen(flip?66:62,67,12,12);
  if(type==='maskStall'&&front)specimen(44,53,12,13);
  if(type==='backStage'&&front)specimen(flip?56:23,58,15,19);
  if(type==='playBill'&&item.source)specimen(front?40:39,35,22,28);
  if(!phase)return;
  switch(type){
    case 'eggWatch':{
      if(!front)break;
      const cx=flip?65:34,cy=73,rx=8,ry=6;
      for(let dy=-ry;dy<=ry;dy++)for(let dx=-rx;dx<=rx;dx++)if(dx*dx/64+dy*dy/36<=1)px(cx+dx,cy+dy,dy<1?'#604532':'#997345');
      for(let i=0;i<Math.min(3,phase);i++){
        const x=cx-5+i*4,y=cy+(i%2?0:2);
        const color=(item.eggs||0)&1<<i?'#ffd652':'#f8e5be';
        line(x,y-3,x,y+1,color);line(x-1,y-1,x+1,y-1,color);px(x,y-2,'#fff4ce');
      }break;
    }
    case 'grainMill':{
      if(!front)break;
      // Rotate the spoke disk around its wooden axle. Sample only the pale sailcloth,
      // brass fastenings and brown spokes, keeping the tiled cone behind the disk.
      const cx=f===0?47:52,cy=f===0?39:39,xx=X(cx),yy=Y(cy),r=Math.max(3,Math.round(width*.35));
      const k=ctx.getImageData(xx-r,yy-r,2*r+1,2*r+1),p=k.data,o=new Uint8ClampedArray(p),n=k.width;
      const a=phase*Math.PI/14,cs=Math.cos(a),sn=Math.sin(a);
      for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){
        if(x*x+y*y>r*r)continue;
        const u=Math.round(x*cs+y*sn),v=Math.round(-x*sn+y*cs);
        if(Math.abs(u)>r||Math.abs(v)>r)continue;
        const j=((y+r)*n+x+r)*4,i=((v+r)*n+u+r)*4;
        if(o[i+3]&&o[j+3]&&o[i+1]>o[i+2]*1.12&&o[i+1]>o[i]*.47){p.set(o.subarray(i,i+3),j);}
      }
      ctx.putImageData(k,xx-r,yy-r);break;
    }
    case 'windSock':sway(f<2?25:0,12,72,46,Math.max(1,width*.055));break;
    case 'starLine':sway(18,28,64,44,Math.max(1,width*.04));break;
    case 'returnBell':sway(38,40,25,44,Math.max(2,width*.09));break;
    case 'birdClock':{
      if(!front)break;
      const x=flip?56:44;gem(x,28,'#e3ac53','#fff0ab');px(x+3,29,'#803d27');px(x,27,'#3d342b');break;
    }
    case 'starDial':{
      if(!front)break;
      const angle=(phase*1.3)-1.2;
      line(51,39,51+25*Math.cos(angle),39+12*Math.sin(angle),'#f9e4a0');px(51,39,'#fff3bf');break;
    }
    case 'acornLamp':case 'lanternLine':case 'spiritChime':{
      tint(10,32,80,37,warm,[255,220,101],.78);
      for(const x of (type==='acornLamp'?[48]:type==='spiritChime'?[42,60,79]:[20,34,50,68,83]))px(x,52,'#fff1a8');
      break;
    }
    case 'jarHut':if(front)tint(flip?50:21,62,26,17,warm,seasons[phase%4],.80);break;
    case 'crystalHanger':{
      tint(14,38,69,37,fabric,[249,188,149],.38);
      spark(phase%2?34:64,59);break;
    }
    case 'fossilSand':{
      const x=44+phase*4;line(x,50,x+7,54,'#f8d9a1');line(x+6,55,x+4,61,'#916540');px(x,53,'#fff0bd');break;
    }
    case 'butterflyPool':{
      const x=f===1||f===2?18:66;px(x,12,'#286d76',3,2);px(x+4,10,'#69c4c3',2,2);px(x-3,9,'#9de1cd',2,1);break;
    }
    case 'seedSwap':if(front)tint(flip?57:19,45,25,23,warm,seasons[phase%4],.69);break;
    case 'paintSink':tint(23,32,51,29,fabric,seasons[phase%4],.70);break;
    case 'pawStamp':{
      const x=front?47:37,y=45,ink=['#9b4c37','#356f6e','#776293','#b16f38'][phase%4];
      gem(x,y,ink,ink);for(const dx of [-4,0,4])px(x+dx,y-5,ink);break;
    }
    case 'rainHarp':{
      const x=f<2?59:42;line(x,43,x,54,'#b3e5d2');line(x-3,57,x+4,57,'#80bbb4');break;
    }
    case 'leafGutter':{
      for(let i=0;i<3;i++){
        const x=(f<2?29+i*22:68-i*22);line(x,29+i*18,x,37+i*18,'#c3eddf');px(x,40+i*18,'#60b8ba');
      }break;
    }
    case 'umbrellaHut':if(front){tint(flip?40:32,57,25,17,fabric,[115,157,177],.56);line(flip?78:22,51,flip?78:22,58,'#b8e3dc');}break;
    case 'mossPath':for(const [x,y] of [[26,55],[40,46],[55,59],[71,50]]){px(x,y,'#b7d776',2,1);px(x,y-3,'#f4e5a0');}break;
    case 'breadShelf':if(front){for(const x of [32,49,67]){gem(x,55+(flip?-1:1)*(x-50)*.16,'#eaa844','#ffe0a1');}}break;
    case 'laundry':tint(18,12,62,35,(r,g,b)=>Math.min(r,g,b)>98,[153,181,185],.48);line(flip?34:62,57,flip?34:62,62,'#a7d6d6');break;
    case 'scarecrow':tint(24,37,55,42,fabric,seasons[phase%4],.66);break;
    case 'pickingBaskets':for(let i=0;i<Math.min(phase+1,4);i++)gem(23+(i%2)*38+i*3,46+Math.floor(i/2)*19,'#c15829','#ffd17a');break;
    case 'routeMap':{
      if(!front)break;
      for(let i=0;i<=Math.min(phase,15);i++){const x=27+(i*3),y=44+Math.sin(i*.87)*7;px(x,y,i===phase?'#c24c35':'#8e6941',i===phase?2:1,1);}break;
    }
    case 'birdScore':if(front){for(let i=0;i<4;i++){const x=25+i*12,y=37+(i%3)*3;line(x,y,x,y-6,'#564138');px(x-1,y,'#564138',2,1);}}break;
    case 'traderTent':if(front){specimen(45,68,12,10);gem(flip?56:38,67,'#8db4a1','#e5dbaa');gem(flip?65:48,70,'#b76f48','#f4d288');}break;
    case 'rugShop':if(front)tint(17,47,63,39,fabric,seasons[phase%4],.57);break;
    case 'pondWindow':{
      const x=35+phase*7;line(x,45+phase,x+9,44+phase,'#bfe5ce');px(x-7,57,'#e8e6b1',2,1);break;
    }
    case 'moonBasin':{
      tint(15,10,66,31,(r,g,b)=>b>r||g>r,[115,151,204],.50);
      line(41,27,57,28,phase===2?'#8bc6be':'#ede6b0');px(60,26,'#c2dfdd');break;
    }
    case 'menuWindow':if(front){tint(19,55,57,23,fabric,seasons[phase%4],.5);gem(46,63,'#a45a33','#ffe49a');}break;
  }
}
