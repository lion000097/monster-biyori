// Local ground units span 16 per tile. Height is measured in native screen pixels.
// Each face is rasterised on the same 2:1 grid as the ranch. Depth is shared by
// trim, props and the main structure so the rear views have real occlusion.
const swatches = {
  bark:['432518','774123','ae6938','d59955'], oak:['55301d','9a572c','cf8950','f4bf76'],
  honey:['764322','b87838','e6a857','ffdb8d'], pale:['967344','ccb17a','eed9a6','fff1c5'],
  plaster:['99724b','c6aa77','ebd3a3','fff0c5'], tile:['692d24','a74a2d','d47743','f1a45e'],
  berry:['682d3e','a34e53','d87970','f4a693'], pine:['293e31','426848','779359','aec579'],
  moss:['455334','708147','9bb45a','d1d47a'], plum:['49384a','735577','a47a9b','d2a5bc'],
  dusk:['36394f','565877','8186a4','b7bbca'], teal:['28504d','427f76','72a99a','acd4b4'],
  stone:['62554d','948475','bcae97','e4d9be'], slate:['424b50','677477','98a29a','c9cec1'],
  iron:['2e3433','51585a','79817c','a6b0a4'], brass:['6b4526','a57032','deb15a','ffde8a'],
  cream:['ac845b','d8b780','f4dfa8','fff4cc'], linen:['927662','c2a68d','e6d2b3','fff0d4'],
  indigo:['26394c','425879','69859c','a4b8bc'], water:['315c61','478c90','74bcc0','b8e4d4'],
  glass:['355453','648c89','a8c9b8','e7f0cc'], clay:['794332','ac6a4c','d89969','f2bd8b'],
  pink:['8c4356','bf6e7d','e99c9a','ffd2bb'], leaf:['345236','547a3d','88a252','bec86d'],
  earth:['604735','846140','ad8757','cdaa72'], gold:['845a26','bd8a37','e4b451','ffe398'],
  ink:['362b2a','524039','735748','9e7960'], white:['99958b','c1c0aa','e7e5d0','fff6dc'],
  blue:['37465d','496a8a','7298b1','a9cad5'], aqua:['366e68','549d89','8dcbb1','cff2d7']
};
const rgb = hex => parseInt(hex,16);
function tintColor(base,amount){
  const r=base>>16,g=base>>8&255,b=base&255;
  const clamp=n=>Math.min(255,Math.max(0,Math.round(n)));
  return clamp(r+amount)<<16|clamp(g+amount*.86)<<8|clamp(b+amount*.68);
}
const palettes={};
for(const [key,steps] of Object.entries(swatches)){
  const col=steps.map(rgb);
  palettes[key]=Array.from({length:24},(_,i)=>{
    const u=i*3/23,j=Math.min(2,Math.floor(u)),f=u-j,a=col[j],b=col[j+1];
    return [16,8,0].reduce((out,k)=>out|(Math.round((a>>k&255)*(1-f)+(b>>k&255)*f)<<k),0);
  });
}
const tau=Math.PI*2;
function renderer(width,height,facing){
  const size=(width+height)*2,sw=facing%2?height:width,sh=facing%2?width:height;
  const depth=new Float32Array(size*size).fill(-1e6),color=new Uint32Array(size*size);
  let spread=1,rise=1;
  function setScale(horizontal,vertical){spread=horizontal;rise=vertical;}
  function project([x,y,z]){
    x=width/2+(x-width/2)*spread;y=height/2+(y-height/2)*spread;z*=rise;
    let u=x,v=y;
    if(facing===1){u=height-y;v=x;}
    else if(facing===2){u=width-x;v=height-y;}
    else if(facing===3){u=y;v=width-x;}
    return [2*sh+(u-v)*2,size-1-sw-sh+u+v-z,u+v+z];
  }
  function ink(x,y,d,c){
    if(x<0||x>=size||y<0||y>=size)return;
    const i=y*size+x;if(d+.014<depth[i])return;
    depth[i]=d;color[i]=c;
  }
  function edgeScreen(a,b,c,offset=.19){
    const steps=Math.ceil(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),1));
    for(let i=0;i<=steps;i++){
      const t=i/steps;
      ink(Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),a[2]+(b[2]-a[2])*t+offset,c);
    }
  }
  function stroke(points,material='bark',tone=4){
    const c=palettes[material][tone],p=points.map(project);
    for(let i=1;i<p.length;i++)edgeScreen(p[i-1],p[i],c,.78);
  }
  function face(points,material,light=14,texture='',outline=false){
    const palette=palettes[material],p=points.map(project);
    if(!palette)throw Error('Unknown town paint '+material);
    const a=p[0],A=points[0];
    for(let n=1;n+1<p.length;n++){
      const b=p[n],c=p[n+1],B=points[n],C=points[n+1];
      const dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],det=dx*ey-ex*dy;
      if(Math.abs(det)<.001)continue;
      const left=Math.max(0,Math.ceil(Math.min(a[0],b[0],c[0]))),right=Math.min(size-1,Math.floor(Math.max(a[0],b[0],c[0])));
      const top=Math.max(0,Math.ceil(Math.min(a[1],b[1],c[1]))),bottom=Math.min(size-1,Math.floor(Math.max(a[1],b[1],c[1])));
      for(let y=top;y<=bottom;y++)for(let x=left,i=y*size+left;x<=right;x++,i++){
        const u=((x-a[0])*ey-(y-a[1])*ex)/det,v=(dx*(y-a[1])-dy*(x-a[0]))/det;
        if(u<-.0001||v<-.0001||u+v>1.0001)continue;
        const d=a[2]+(b[2]-a[2])*u+(c[2]-a[2])*v;
        if(d+.014<depth[i])continue;
        const gx=A[0]+(B[0]-A[0])*u+(C[0]-A[0])*v,gy=A[1]+(B[1]-A[1])*u+(C[1]-A[1])*v,gz=A[2]+(B[2]-A[2])*u+(C[2]-A[2])*v;
        const row=Math.floor(gz),t=Math.floor((gx+gy)*2),s=Math.floor(gx*2)-Math.floor(gy*2);
        let shift=0;
        if(texture==='wood'){
          if((row+Math.floor(Math.sin(t*.26)*.8))%5===0 && (t+row*3)%13<9)shift=-5;
          else if((row*3+t)%19===0)shift=3;
        }else if(texture==='planks'){
          const board=Math.floor(gy/2.8),grain=Math.floor(gy*2.1+Math.sin(gx*.42)*.7);
          shift=(Math.floor(gy*2)%6===0?-6:0)+(board%3-1);
          if((grain%4===0)&&(Math.floor(gx*2)+board*4)%12<7)shift-=3;
        }else if(texture==='stone'||texture==='pavers'){
          const along=texture==='pavers'?gx*2:(gx+gy)*2,up=texture==='pavers'?gy*2:gz;
          const layer=Math.floor(up/4.7),m=(along+(layer%2)*5.8+1364)%11.6;
          shift=up-layer*4.7<.8||m<1?-5:up-layer*4.7<1.7?2:(Math.floor((along+(layer%2)*5.8)/11.6)+layer*3)%4-1;
        }else if(texture==='weave'){shift=(t+row)%4===0?-1:0;}
        else if(texture==='water'){shift=(Math.floor(gy*2+Math.sin(gx*.64)*2.5)%6===0 && t%13<8)?4:0;}
        else if(texture==='speckle'){shift=((s*19+t*7+row*5)&31)===1?-3:0;}
        color[i]=palette[Math.max(0,Math.min(23,Math.round(light+shift)))];depth[i]=d;
      }
    }
    if(outline)for(let i=0;i<p.length;i++)edgeScreen(p[i],p[(i+1)%p.length],palette[Math.max(0,Math.min(23,light-8))]);
  }
  function veneer(points, donor, sample, options={}){
    const frame=townNativeFrame(donor,0),p=points.map(project),[a,b,c]=p;
    const dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],det=dx*ey-ex*dy;
    if(Math.abs(det)<.05)return;
    const fourth=[b[0]+c[0]-a[0],b[1]+c[1]-a[1]];
    const xs=[...p,fourth].map(q=>q[0]),ys=[...p,fourth].map(q=>q[1]);
    const [origin,along,up]=sample;
    const px=frame.rgba,limit=frame.size,palette=options.mat&&palettes[options.mat];
    for(let y=Math.max(0,Math.ceil(Math.min(...ys)));y<=Math.min(size-1,Math.floor(Math.max(...ys)));y++){
      for(let x=Math.max(0,Math.ceil(Math.min(...xs)));x<=Math.min(size-1,Math.floor(Math.max(...xs)));x++){
        let u=((x-a[0])*ey-(y-a[1])*ex)/det,v=(dx*(y-a[1])-dy*(x-a[0]))/det;
        if(u<0||v<0||u>1||v>1)continue;
        const z=a[2]+u*(b[2]-a[2])+v*(c[2]-a[2])+.4;
        if(z<depth[y*size+x]-.02)continue;
        if(options.repeatU)u=(u*options.repeatU)%1;
        if(options.repeatV)v=(v*options.repeatV)%1;
        const sx=Math.round(origin[0]+along[0]*u+up[0]*v),sy=Math.round(origin[1]+along[1]*u+up[1]*v),i=(sy*limit+sx)*4;
        if(!px[i+3])continue;
        let paint;
        if(palette){
          const lum=px[i]*.24+px[i+1]*.60+px[i+2]*.16;
          const n=Math.max(0,Math.min(23,Math.round((lum-12)*.157+(options.tone||0))));
          paint=tintColor(palette[n],Math.min(0,lum-55)*.58);
        }else paint=tintColor((px[i]<<16)|(px[i+1]<<8)|px[i+2],options.brightness||0);
        ink(x,y,z,paint);
      }
    }
  }
  function exhibit(item){
    if(!item.source)return;
    const thumb=document.createElement('canvas');thumb.width=thumb.height=item.size;
    const g=thumb.getContext('2d');g.imageSmoothingEnabled=false;
    g.drawImage(...item.source,0,0,item.size,item.size);
    const data=g.getImageData(0,0,item.size,item.size).data,[cx,cy,base]=project(item.anchor);
    for(let y=0;y<item.size;y++)for(let x=0;x<item.size;x++){
      const i=(y*item.size+x)*4;if(data[i+3]<128)continue;
      ink(Math.round(cx-item.size/2+x),Math.round(cy-item.size+y),base+item.size-y+.6,(data[i]<<16)|(data[i+1]<<8)|data[i+2]);
    }
  }
  function finish(){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const g=canvas.getContext('2d'),im=g.createImageData(size,size);
    for(let i=0;i<color.length;i++){
      if(depth[i]<-1e5)continue;
      const x=i%size,y=Math.floor(i/size);let c=color[i];
      // Ink the inner silhouette without expanding a decoration into the next tile.
      if(x===0||y===0||x+1===size||y+1===size||depth[i-1]<-1e5||depth[i+1]<-1e5||depth[i-size]<-1e5||depth[i+size]<-1e5)c=depth[i]<1? tintColor(c,-38):tintColor(c,-65);
      else if(depth[i]-depth[i+size]>9||depth[i]-depth[i+1]>10)c=tintColor(c,-27);
      const j=i*4;im.data[j]=c>>16;im.data[j+1]=c>>8&255;im.data[j+2]=c&255;im.data[j+3]=255;
    }
    g.putImageData(im,0,0);return canvas;
  }
  return {face,stroke,veneer,exhibit,finish,project,setScale,facing};
}
