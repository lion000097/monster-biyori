// Registered paintings use a common logical canvas in both editions. Runtime details
// are cached separately so a save's eggs, exhibits and upgrades remain visible.
const axisSprites=new Map();
await Promise.all(Object.entries(axisAtlas).map(async ([type,[size,uri]])=>{
  const image=new Image();
  image.src=uri;
  await image.decode();
  axisSprites.set(type,{size:travelerPlots[type] ? image.height : size*2,image,base:[],views:new Map()});
}));

function axisSprite(type,facing,phase=0,item={}){
  const art=axisSprites.get(type);
  const n=art.size;
  function canvas(){
    const c=document.createElement('canvas');
    c.width=c.height=n;
    return c;
  }
  if(!art.base[facing]){
    const c=canvas(),g=c.getContext('2d'),size=art.image.height;
    g.imageSmoothingEnabled=true;
    g.imageSmoothingQuality='high';
    g.drawImage(art.image,facing*size,0,size,size,0,0,n,n);
    art.base[facing]=c;
  }
  const base=art.base[facing],config=paintedDetails[type];
  if(!config)return base;
  const state=Math.min(config.phases-1,Math.max(0,phase|0));
  const bits=type==='eggWatch'?(item.eggs||0)&((1<<state)-1):0;
  const exhibit=type==='stoneStudy'||type==='maskStall';
  if(!state&&type!=='eggWatch'&&!(exhibit&&item.source))return base;
  const key=facing+'/'+state+'/'+bits,subject=exhibit?(item.key||''):'';
  const cached=art.views.get(key);
  if(cached&&cached.subject===subject)return cached.image;
  const c=canvas(),g=c.getContext('2d',{willReadFrequently:true});
  g.drawImage(base,0,0);
  const [x,y,w,h]=config.areas[facing];
  const px=v=>v*n/100;
  // Only pigment inside the shop's actual display changes: retain glazing, wood,
  // engraved borders and the luminance variations in the master illustration.
  function glaze(rgb,predicate){
    const left=Math.round(px(x-w/2)),top=Math.round(px(y-h/2));
    const iw=Math.max(1,Math.round(px(w))),ih=Math.max(1,Math.round(px(h)));
    const block=g.getImageData(left,top,iw,ih),p=block.data;
    for(let j=0;j<ih;j++)for(let i=0;i<iw;i++){
      const k=4*(j*iw+i),r=p[k],green=p[k+1],b=p[k+2];
      if(!p[k+3]||!predicate(r,green,b))continue;
      const edge=Math.min(1,(1-Math.abs((i+.5)/iw*2-1))*4,(1-Math.abs((j+.5)/ih*2-1))*4);
      const light=.19+.81*(.29*r+.54*green+.17*b)/205,weight=.74*edge;
      p[k]=r*(1-weight)+rgb[0]*light*weight;
      p[k+1]=green*(1-weight)+rgb[1]*light*weight;
      p[k+2]=b*(1-weight)+rgb[2]*light*weight;
    }
    g.putImageData(block,left,top);
  }
  // Coordinates below are percentages of the registered canvas, independent of zoom.
  g.save();g.scale(n/100,n/100);
  if(exhibit&&item.source&&w>0){
    const [source,...rect]=item.source;
    g.imageSmoothingEnabled=false;
    g.drawImage(source,...rect,x-w/2,y-h/2,w,h);
  }else if(type==='eggWatch'){
    const angle=config.tilt[facing];
    if(facing!==2){
      // The hatch image contains a decorative clutch. Clear only the active nest,
      // leaving the carved egg motif and the fixed inventory baskets intact.
      g.save();g.translate(x,y);g.rotate(angle);
      const nest=g.createLinearGradient(0,-h*.55,0,h*.55);
      nest.addColorStop(0,'#5b463b');nest.addColorStop(.59,'#604336');nest.addColorStop(1,'#ad792f');
      g.fillStyle=nest;g.beginPath();g.ellipse(0,0,w*.51,h*.51,0,0,Math.PI*2);g.fill();
      for(let j=0;j<5;j++){
        const u=-w*.34+j*w*.15,v=h*(.15+(j%2)*.09);
        g.strokeStyle=j%2?'#8e632c':'#c49b4a';g.lineWidth=.28;g.beginPath();
        g.moveTo(u-w*.055,v-.25);g.quadraticCurveTo(u,v+.3,u+w*.06,v-.08);g.stroke();
      }
      g.restore();
    }
    for(let i=0;i<state;i++){
      const offset=(facing===2?i-1:i-(state-1)/2)*w*(facing===2?.34:.26);
      const u=x+offset, v=y+offset*Math.tan(angle)+(i%2)*h*.055;
      const shiny=Boolean(bits&(1<<i)),rx=w*.15,ry=h*.43;
      g.save();g.translate(u,v);g.rotate((i-1)*.12);
      const ink=g.createRadialGradient(-rx*.35,-ry*.43,.01,0,0,ry*1.18);
      ink.addColorStop(0,shiny?'#ffffcf':'#fffbea');
      ink.addColorStop(.47,shiny?'#fadc6b':'#f3ddb0');
      ink.addColorStop(1,shiny?'#ad6c19':'#aa7952');
      g.fillStyle=ink;g.strokeStyle=shiny?'#946018':'#775336';g.lineWidth=.36;
      g.beginPath();g.moveTo(0,-ry);g.bezierCurveTo(rx*.68,-ry,rx,ry*.12,rx,ry*.35);
      g.bezierCurveTo(rx,ry*1.15,-rx,ry*1.15,-rx,ry*.35);
      g.bezierCurveTo(-rx,0,-rx*.68,-ry,0,-ry);g.fill();g.stroke();g.restore();
    }
  }else if(type==='jarHut'){
    const glazes=[[191,63,55],[104,154,85],[222,134,56],[112,139,193]];
    glaze(glazes[state],(r,green,b)=>r>green*1.13&&r>b*1.12&&r>65);
  }else if(type==='seedSwap' && w>0){
    const foliage=[[108,151,80],[119,165,88],[198,139,62],[128,160,183]];
    glaze(foliage[state],(r,green,b)=>green>b*1.34 && green>r*.80);
  }else if(type==='umbrellaHut'){
    glaze([103,165,183],(r,green,b)=>Math.max(r,green,b)-Math.min(r,green,b)>28);
    g.strokeStyle='#d5e7df';g.lineWidth=.36;
    for(let i=0;i<3;i++){
      const u=x-w*.22+i*w*.22,v=y+h*.3+(i%2)*.65;
      g.beginPath();g.moveTo(u,v);g.lineTo(u-.3,v+1.1);g.stroke();
    }
  }else if(type==='breadShelf'&&w>0){
    // Add a loaf cut from the same painting as the trays.
    const [sx,sy,sw,sh]=config.swatch;
    g.beginPath();g.ellipse(x,y,w/2,h/2,facing===3?-.16:.16,0,Math.PI*2);g.clip();
    g.drawImage(art.base[0],px(sx),px(sy),px(sw),px(sh),x-w/2,y-h/2,w,h);
  }else if(type==='guild212'){
    function pennant(u,v,length,cloth,flip){
      g.save();g.translate(u,v);g.scale(flip,1);
      g.lineCap='round';g.strokeStyle='#553e2f';g.lineWidth=.72;
      g.beginPath();g.moveTo(0,2);g.lineTo(0,-length);g.stroke();
      g.strokeStyle='#e6b65e';g.lineWidth=.29;g.stroke();
      const clothLight=g.createLinearGradient(0,0,3.9,0);
      clothLight.addColorStop(0,cloth[0]);clothLight.addColorStop(.45,cloth[1]);clothLight.addColorStop(1,cloth[0]);
      g.fillStyle=clothLight;g.strokeStyle='#594132';g.lineWidth=.32;
      g.beginPath();g.moveTo(.1,1-length);g.quadraticCurveTo(2,-length,4.9,1.8-length);
      g.lineTo(3.1,2.6-length);g.lineTo(4.6,3.8-length);
      g.quadraticCurveTo(2,3.2-length,.1,4-length);g.closePath();g.fill();g.stroke();
      g.strokeStyle='#f5d88a';g.lineWidth=.30;
      g.beginPath();g.moveTo(.5,1.4-length);g.lineTo(3.8,1.65-length);g.stroke();
      g.fillStyle='#edc16b';g.beginPath();g.arc(0,-length,.52,0,Math.PI*2);g.fill();g.restore();
    }
    const flip=facing===0||facing===1?1:-1;
    pennant(x,y,h,['#8b2940','#d05c63'],flip);
    if(state>=2){
      const [u,v]=config.second[facing];
      pennant(u,v,h*.75,['#2d675e','#5ba597'],-flip);
    }
  }
  g.restore();art.views.set(key,{subject,image:c});return c;
}
