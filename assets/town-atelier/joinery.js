// Geometry uses real world-space vertices, including small items on shelves.
// The same carving therefore presents its back, ends and front when rotated.
function workshop(spec,facing,phase){
  const W=spec.w*16,H=spec.h*16,r=renderer(W,H,facing),{face,stroke}=r;
  const turnNormal=(x,y)=>[[x,y],[-y,x],[-x,-y],[y,-x]][facing];
  function light(x,y,z){
    const [u,v]=turnNormal(x,y),n=Math.hypot(u,v,z)||1;
    return Math.round(11+(-u*.43+v*.48+z*.86)/n*8);
  }
  function skin(points,mat,texture='',outline=false){
    const a=points[0],b=points[1],c=points[2],p=b.map((v,i)=>v-a[i]),q=c.map((v,i)=>v-a[i]);
    const nx=p[1]*q[2]-p[2]*q[1],ny=p[2]*q[0]-p[0]*q[2],nz=p[0]*q[1]-p[1]*q[0];
    face(points,mat,light(nx,ny,nz),texture,outline);
  }
  function block(x,y,z,w,d,h,mat='oak',texture='wood',edges=true){
    const corners=[[x,y],[x+w,y],[x+w,y+d],[x,y+d]],lo=corners.map(p=>[...p,z]),hi=corners.map(p=>[...p,z+h]);
    for(let i=0;i<4;i++){const j=(i+1)%4;skin([lo[i],lo[j],hi[j],hi[i]],mat,texture,edges);}
    skin(hi,mat,texture==='wood'?'planks':texture,edges);
  }
  function lathe(x,y,z,profile,mat,n=12,texture='',rim=false,stretch=1){
    let last;
    for(const [h,rad] of profile){
      const ring=Array.from({length:n},(_,i)=>[x+Math.cos(i*tau/n)*rad,y+Math.sin(i*tau/n)*rad*stretch,z+h]);
      if(last)for(let i=0;i<n;i++){const j=(i+1)%n;skin([last[i],last[j],ring[j],ring[i]],mat,texture);}
      last=ring;
    }
    if(last&&profile.at(-1)[1]>.05){skin(last,mat,texture);if(rim)stroke([...last,last[0]],mat,10);}
  }
  function ball(x,y,z,rx,ry,rz,mat){
    lathe(x,y,z,[[ -rz*.99,rx*.12],[-rz*.68,rx*.71],[-rz*.19,rx],[rz*.30,rx*.96],[rz*.72,rx*.68],[rz,rx*.16]],mat,10,'',false,ry/rx);
  }
  function beam(a,b,radius,mat='oak',n=6,texture='wood'){
    // Work in pixels of physical space. One horizontal unit spans ~2.5 pixels.
    const dir=b.map((v,i)=>(v-a[i])*(i===2?1:2.5)),len=Math.hypot(...dir);
    if(len<.02)return;
    const [i,j,k]=dir.map(v=>v/len),l=Math.hypot(i,j);
    const u=l?[j/l,-i/l,0]:[1,0,0],v=[j*u[2]-k*u[1],k*u[0]-i*u[2],i*u[1]-j*u[0]];
    const offsets=Array.from({length:n},(_,q)=>u.map((t,m)=>(t*Math.cos(q*tau/n)+v[m]*Math.sin(q*tau/n))*radius/(m===2?1:2.5)));
    const first=offsets.map(p=>p.map((v,i)=>a[i]+v)),end=offsets.map(p=>p.map((v,i)=>b[i]+v));
    for(let q=0;q<n;q++){const j=(q+1)%n;skin([first[q],first[j],end[j],end[q]],mat,texture);}
    skin(end,mat);skin([...first].reverse(),mat);
  }
  function panel(x,y,z,w,h,mat,side=0,texture='',edges=true){
    const at=(u,v)=>side===0?[x+u,y,z+v]:side===1?[x,y+u,z+v]:side===2?[x-u,y,z+v]:[x,y-u,z+v];
    const pts=[at(0,0),at(w,0),at(w,h),at(0,h)];
    face(pts,mat,light(...[[0,1,0],[1,0,0],[0,-1,0],[-1,0,0]][side]),texture,edges);
    return at;
  }
  function plankTable(x,y,w,d,z=10,mat='oak',bottom=0){
    for(const u of [x+.8,x+w-1.8])for(const v of [y+.8,y+d-1.8])block(u,v,bottom,1.15,1.15,z-bottom,mat);
    block(x,y,z,w,d,2.2,mat);
    if(w>6)block(x+.75,y+.9,z-2.3,w-1.5,.85,2.5,'bark');
  }
  function crate(x,y,z,w=5,d=4,h=7,mat='oak'){
    block(x,y,z,w,d,h,mat,'planks');
    for(const a of [x+.2,x+w-.95])for(const b of [y+.1,y+d-.85])block(a,b,z,.8,.8,h+.3,'honey');
    beam([x+.6,y+d+.09,z+1],[x+w-.6,y+d+.09,z+h-1],1,'honey',4);
    block(x+.2,y+.4,z+h,w-.4,.45,.5,'pale');
  }
  function barrel(x,y,z,rad=2.5,h=9,mat='oak',open=false){
    lathe(x,y,z,[[0,rad*.85],[h*.27,rad],[h*.70,rad],[h,rad*.86]],mat,12,'wood');
    for(const v of [.16,.77])lathe(x,y,z+h*v,[[0,rad*.98],[1,rad]],'iron');
    lathe(x,y,z+h,[[0,rad*.8],[.5,rad*.8]],open?'ink':mat,12,open?'':'planks',true);
  }
  function pot(x,y,z,rad=2,h=6,mat='clay'){
    lathe(x,y,z,[[0,rad*.56],[.8,rad*.66],[h*.46,rad],[h*.8,rad*.77],[h*.85,rad*.83],[h,rad*.83]],mat);
    lathe(x,y,z+h,[[0,rad*.60],[.2,rad*.60]],'earth');
  }
  function tuft(x,y,z,s=1,flowers=false){
    for(let i=0;i<6;i++){
      const a=i*2.35,dx=Math.cos(a)*s,dy=Math.sin(a)*s,ht=s*(4+(i%3)*1.5),tip=[x+dx*1.9,y+dy*1.9,z+ht];
      const l=[x+dx*.7-dy*.6,y+dy*.7+dx*.6,z+ht*.72],rr=[x+dx*.7+dy*.5,y+dy*.7-dx*.5,z+ht*.56];
      face([[x,y,z],rr,tip,l],i%2?'leaf':'pine',12+i%3*3);
      stroke([[x,y,z],tip],'leaf',12);
      if(flowers&&i%2===1){ball(tip[0],tip[1],tip[2],s*.63,s*.68,s*1.2,i===3?'cream':'pink');}
    }
  }
  function planter(x,y,z,s=1,flowers=true){pot(x,y,z,2.1*s,4.6*s);tuft(x,y,z+4.6*s,s,flowers);}
  function gable(x,y,z,w,d,rise,mat='tile'){
    const l=x,rgt=x+w,mid=x+w/2,back=y,front=y+d;
    for(const yy of [back+.36,front-.36]){
      face([[l+.48,yy,z],[rgt-.48,yy,z],[mid,yy,z+rise-.35]],'plaster',yy===front-.36?16:12);
      beam([l+.85,yy,z],[mid,yy,z+rise-.5],1.6,'oak');beam([mid,yy,z+rise-.5],[rgt-.85,yy,z],1.6,'oak');
      beam([mid,yy,z],[mid,yy,z+rise-.9],1.65,'oak');
      const outside=yy===front-.36?yy+.26:yy-.26;
      beam([l+.35,outside,z+.45],[rgt-.35,outside,z+.45],1.7,'bark',4);
      if(w>13)for(const sign of [-1,1]){
        beam([mid+sign*w*.13,outside,z+.85],[mid+sign*w*.26,outside,z+rise*.45],1.25,'bark',4);
      }
    }
    for(const side of [-1,1]){
      const at=(u,v,off=0)=>[mid+side*w*.5*u,y+d*v,z+rise*(1-u)+off];
      const lev=light(side*rise,0,w);
      face([at(0,0),at(1,0),at(1,1),at(0,1)],mat,lev,'',true);
      // Repeat a clean two-course patch of the original square tiles at native density.
      // The teal glaze keeps its original pixels. Other roof colors use the same seams.
      const brightness=Math.round((lev-15)*1.4);
      r.veneer([at(0,1,.55),at(0,0,.55),at(1,1,.55)],[[51,48],[22,-11],[15,14]],{
        mat:mat==='teal'?null:mat,repeatU:d/10.8,repeatV:(w*.92+rise*.52)/17,
        brightness,tone:Math.round((lev-15)*.50)
      });
      beam(at(1,0,-1.25),at(1,1,-1.25),2.25,'bark');
      beam(at(1,0,-.35),at(1,1,-.35),1.45,mat,6,'');
      beam(at(0,1,-.75),at(1,1,-.75),1.72,'bark');
      beam(at(0,0,-.75),at(1,0,-.75),1.72,'bark');
      const rafters=Math.max(2,Math.round(d/4.1));
      for(let j=0;j<rafters;j++){
        const v=(j+.5)/rafters,outer=at(1.035,v,-2.1);
        beam(at(.94,v,-2.7),outer,1.03,'oak',4);
        stroke([outer,[outer[0],outer[1]+.27,outer[2]+.46]],'honey',17);
      }
    }
    beam([mid,back-.15,z+rise+.9],[mid,front+.15,z+rise+.9],2.1,mat,8,'');
    stroke([[mid-.10,back,z+rise+2.1],[mid-.10,front,z+rise+2.1]],mat,18);
    const caps=Math.max(2,Math.round(d/4.7));
    for(let j=0;j<caps;j++){
      const yy=back+d*(j+.35)/caps;
      stroke([[mid-.6,yy,z+rise+1.2],[mid,yy,z+rise+2.67],[mid+.59,yy,z+rise+1.18]],mat,11);
    }
  }
  function opening(x,y,z,w,h,door=false,side=0){
    const delta=side===0?[0,.13]:side===1?[.13,0]:side===2?[0,-.13]:[-.13,0];
    const layer=(d)=>[x+delta[0]*d,y+delta[1]*d];
    let [a,b]=layer(1);
    const at=panel(a,b,z,w,h,'bark',side,'wood');
    [a,b]=layer(4);
    const front=panel(a,b,z+.45,w,h-.5,door?'oak':'glass',side,'',false);
    const source=door?[[28,87],[16.5,8.25],[0,-23.8]]:[[81,86.6],[12.6,-6.3],[0,-11.6]];
    const atSurface=(u,v)=>{
      const pt=front(u,v);pt[0]+=delta[0]*2;pt[1]+=delta[1]*2;return pt;
    };
    r.veneer([atSurface(0,0),atSurface(w,0),atSurface(0,h-.5)],source,{
      brightness:light(...[[0,1,0],[1,0,0],[0,-1,0],[-1,0,0]][side])-15
    });
    if(door){
      beam(at(-.18,0),at(w+.18,0),1.1,'stone',4);
    }else{
      for(const u of [0,w])beam(at(u,0),at(u,h),.9,'bark',4);
      beam(at(-.25,0),at(w+.25,0),1.35,'oak',4);
    }
  }
  function cottage(x,y,w,d,height,rise,mat='tile',opt={}){
    const z=opt.z||0,plinth=4.7;
    block(x-.18,y-.18,z,w+.36,d+.36,plinth,'stone','stone');
    const corners=[[x-.18,y-.18],[x+w+.18,y-.18],[x+w+.18,y+d+.18],[x-.18,y+d+.18]];
    for(let i=0;i<4;i++){
      const a=corners[i],b=corners[(i+1)%4];
      r.veneer([[...a,z+.3],[...b,z+.3],[...a,z+plinth]],[[77,102.5],[18,-9],[0,-4.2]],
        {repeatU:Math.hypot(b[0]-a[0],b[1]-a[1])/8.5,brightness:i%2?-2:3});
    }
    block(x+.14,y+.14,z+plinth,w-.28,d-.28,height-plinth,opt.wall||'plaster',opt.wall==='oak'?'wood':'speckle');
    for(const u of [x+.38,x+w-.38])for(const v of [y+.38,y+d-.38])block(u-.60,v-.60,z+plinth,1.2,1.2,height-plinth,'bark');
    for(const v of [y-.02,y+d-.47]){
      block(x,v,z+plinth,w,.54,1.25,'bark');
      block(x,v,z+height-3,w,.54,1.4,'oak');
    }
    for(const u of [x-.02,x+w-.47])block(u,y,z+height-3,.54,d,1.4,'oak');
    const doorW=Math.min(w*.39,6.5),dh=Math.min(20,height-2.8),doorX=x+w*(opt.door??.18);
    // The plaster side includes the house's two blue mullioned windows.
    if(opt.wall!=='oak')for(const side of [1,3]){
      const xx=side===1?x+w+.04:x-.04,sy=side===1?y:y+d,add=side===1?d:-d;
      r.veneer([[xx,sy,z+plinth],[xx,sy+add,z+plinth],[xx,sy,z+height-.7]],
        [[75,96.4],[42,-21],[0,-18.9]],{brightness:light(...(side===1?[1,0,0]:[-1,0,0]))-13});
    }
    for(const v of [y+.02,y+d-.02]){
      const outward=v>y+1?.15:-.15;
      for(const pos of [.04,.57,.98])block(x+w*pos-.37,v+outward-.38,z+3,.84,.76,height-3,'oak');
      for(const pos of [.09,.66])beam([x+w*pos,v+outward,z+height-5],[x+w*(pos+.18),v+outward,z+height-.8],1.4,'bark',4);
    }
    if(!opt.noDoor)opening(doorX,y+d,z+.4,doorW,dh,true);
    if(w>10&&!opt.noFront)opening(x+w*.65,y+d,z+height*.31,w*.24,Math.min(9,height*.38));
    if(opt.wall==='oak')for(const side of [1,3]){
      const offset=side===1?y+d*.24:y+d*.76;
      opening(side===1?x+w:x,offset,z+height*.28,d*.42,Math.min(11,height*.43),false,side);
    }
    opening(x+w*.69,y,z+height*.32,w*.36,Math.min(9,height*.36),false,2);
    if(!opt.noRoof)gable(x-1,y-1,z+height,w+2,d+2,rise,mat);
    if(opt.chimney){
      const cx=x+w*.68,cy=y+d*.21,ch=z+height+rise+3;
      block(cx,cy,z+height,3.9,4.2,ch-z-height,'brick','stone');
      block(cx-.38,cy-.38,ch,4.66,4.96,2.1,'brick','stone');
      block(cx+.45,cy+.45,ch+2.1,3,3.3,.12,'bark','',false);
    }
  }
  function canopy(x,y,z,w,d,mat='teal',stripe='cream',drop=4){
    for(const u of [x+.7,x+w-.7])for(const v of [y+.8,y+d-.8]){
      block(u-.4,v-.4,0,.8,.8,z+.6,'oak');
      beam([u,v,z-4.7],[u+(u<x+w/2?2:-2),v,z-.5],.84,'honey',4);
      lathe(u,v,z-3.9,[[0,.52],[.68,.52]],'brass',6);
    }
    const bands=Math.max(3,Math.round(w/3));
    const sections=[[0,4],[.37,3.2],[.72,1.5],[1,0]];
    for(let i=0;i<bands;i++){
      const a=x+w*i/bands,b=x+w*(i+1)/bands,c=i%2?stripe:mat;
      const mid=(a+b)/2;
      for(let j=1;j<sections.length;j++){
        const [v0,h0]=sections[j-1],[v1,h1]=sections[j];
        const fold=(u,v,h)=>[u,y+d*v,z+h+(u===mid?.72:0)];
        for(const [left,right,tone] of [[a,mid,20],[mid,b,16]]){
          face([fold(left,v0,h0),fold(right,v0,h0),fold(right,v1,h1),fold(left,v1,h1)],c,tone-j+1,'weave');
        }
      }
      const hem=u=>[u,y+d+.22,z-drop+((Math.abs(u-mid)/(b-a))*2)**2*.97];
      const scallop=[a,a+(b-a)*.23,mid,a+(b-a)*.77,b].map(hem);
      face([[b,y+d,z],[a,y+d,z],...scallop],c,14,'weave',true);
      stroke(scallop.map(([u,v,h])=>[u,v+.13,h+.65]),i%2?mat:'pale',17);
    }
    beam([x-.2,y,z+4.5],[x+w+.2,y,z+4.5],1.1,'bark');
  }
  function floor(){face([[.12,.12,0],[W-.12,.12,0],[W-.12,H-.12,0],[.12,H-.12,0]],'paving',17,'pavers');}
  return {W,H,phase,r,block,ball,beam,lathe,panel,stroke,face,skin,crate,barrel,pot,tuft,planter,gable,opening,cottage,plankTable,canopy,floor};
}
