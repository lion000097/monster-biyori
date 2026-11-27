// These motifs sit on real surfaces, so a framed window, a sign on an iron bracket,
// and a woven inset all keep their proper perspective and occlusion when rotated.
const paintedSubjects=['egg','moon','jam','pony','book','geode','butterfly','fish','bread','tea','lute','mask','landscape','map','rosette','tree'];
function craftDetails(k,p){
  const {beam,block,lathe,ball,face,stroke,panel}=k;
  function painted(points,subject){
    const id=paintedSubjects.indexOf(subject);
    if(id<0)throw Error('Unknown town illustration '+subject);
    k.r.veneer(points,[[id%4*32+.6,Math.floor(id/4)*32+30.4],[30,0],[0,-30]],{sheet:'paintedSigns'});
  }
  const axes=[[1,0,0,1],[0,1,1,0],[-1,0,0,-1],[0,-1,-1,0]];
  function framed(x,y,z,w,h,subject,side=0){
    const [dx,dy,nx,ny]=axes[side];
    const at=(u,v,n=0)=>[x+u*dx+n*nx,y+u*dy+n*ny,z+v];
    face([at(0,0),at(w,0),at(w,h),at(0,h)],'bark',7,'wood',true);
    painted([at(.32,.6,.21),at(w-.32,.6,.21),at(.32,h-.65,.21)],subject);
    for(const v of [0,h])beam(at(-.27,v,.2),at(w+.27,v,.2),1.05,'oak',4);
    for(const u of [0,w])beam(at(u,0,.2),at(u,h,.2),.93,'brass',4,'');
    for(const u of [.4,w-.4])for(const v of [.65,h-.65])
      stroke([at(u,v,.38),at(u+.15,v+.45,.38)],'gold',21);
  }
  function easelSign(x,y,z,w,h,subject,side=0){
    const [dx,dy,nx,ny]=axes[side];
    for(const u of [w*.14,w*.86]){
      const a=[x+u*dx,y+u*dy];
      beam([...a,z],[...a,z+h*.93],1.25,'oak',4);
      beam([a[0]-nx*1.8,a[1]-ny*1.8,z],[...a,z+h*.76],1.1,'bark',4);
    }
    framed(x,y,z+h*.26,w,h*.74,subject,side);
  }
  function blade(x,y,z,dx,dy,h,w,mat='leaf'){
    const l=Math.hypot(dx,dy)||1,px=-dy/l*w,py=dx/l*w;
    const root=[x,y,z],tip=[x+dx,y+dy,z+h],vein=[x+dx*.52,y+dy*.52,z+h*.71];
    const a=[vein[0]+px,vein[1]+py,vein[2]-.6],b=[vein[0]-px,vein[1]-py,vein[2]-.6];
    face([root,a,tip,vein],mat,12);face([root,vein,tip,b],mat,19);stroke([root,vein,tip],mat,20);
  }
  function flower(x,y,z,s,mat='pink'){
    const top=z+4.8*s;
    beam([x-.35*s,y,z],[x,y,top],.53*s,'pine',4);
    blade(x,y,z+1.1*s,-1.3*s,.5*s,1.45*s,.47*s);
    for(let i=0;i<5;i++){
      const a=i*tau/5,xp=x+Math.cos(a)*.74*s,yp=y+Math.sin(a)*.74*s;
      ball(xp,yp,top+(i%2)*.24*s,.66*s,.64*s,.87*s,mat);
    }
    ball(x,y,top+.48*s,.49*s,.47*s,.88*s,'gold');
  }
  function flowers(x,y,z,w,mat='pink'){
    block(x,y,z,w,2.5,2.8,'oak','planks');
    block(x-.13,y-.1,z+2.65,w+.26,2.7,.8,'honey');
    block(x+.35,y+.29,z+3.26,w-.7,1.85,.25,'earth','speckle');
    const n=Math.max(3,Math.floor(w/1.6));
    for(let i=0;i<n;i++){
      const a=x+.7+i*(w-1.4)/(n-1),b=y+1+(i%2)*.6;
      flower(a,b,z+3.4,.69+(i%3)*.13,i%3===1?'cream':mat);
    }
  }
  function rim(x,y,z,rx,ry,mat='brass',start=0,span=tau){
    const count=Math.max(5,Math.ceil(span*3.2)),pts=[];
    for(let i=0;i<=count;i++){const a=start+span*i/count;pts.push([x+Math.cos(a)*rx,y+Math.sin(a)*ry,z]);}
    stroke(pts,mat,mat==='water'?21:17);
  }
  function spool(x,y,z,rad,h,mat='berry'){
    lathe(x,y,z,[[0,rad],[.7,rad],[.9,rad*.75],[h-.8,rad*.75],[h-.62,rad],[h,rad]],'oak',10);
    lathe(x,y,z+.92,[[0,rad*.84],[h-2,rad*.84]],mat,10,'weave');
    for(let i=1;i<4;i++)rim(x,y,z+1+i*(h-2)/4,rad*.86,rad*.86,mat);
    lathe(x,y,z+h+.05,[[0,rad*.26],[.1,rad*.26]],'ink',7);
  }
  function scroll(x,y,z,w,h,mat='linen',side=0){
    const at=panel(x,y,z,w,h,mat,side);
    for(const v of [0,h])beam(at(-.25,v),at(w+.25,v),1.15,'honey',6);
    for(let i=0;i<3;i++)stroke([at(w*.16,h*(.30+i*.20)),at(w*(i%2?.64:.84),h*(.30+i*.20))],'bark',10);
  }
  function brackets(x,y,z,w,h,side=0){
    const [dx,dy,nx,ny]=axes[side],at=(u,v)=>[x+dx*u+nx*.24,y+dy*u+ny*.24,z+v];
    for(const u of [0,w]){
      const end=u===0?1:-1;
      stroke([at(u+end*1.3,.16),at(u,.16),at(u,h*.34)],'iron',8);
      ball(...at(u+end*.28,.48),.26,.26,.50,'brass');
    }
  }
  function pennant(x,y,z,w,h,mat='berry',side=0){
    const [a,b,nx,ny]=axes[side],at=(u,v)=>[x+a*u+nx*.12,y+b*u+ny*.12,z+v];
    const pts=[at(0,0),at(w,0),at(w,-h*.7),at(w*.5,-h),at(0,-h*.7)];
    face(pts,mat,16,'weave',true);stroke([at(w*.14,-1),at(w*.14,-h*.60),at(w*.5,-h*.84),at(w*.86,-h*.60)],'honey',19);
    stroke([at(w*.5,-h*.25),at(w*.58,-h*.41),at(w*.5,-h*.52),at(w*.42,-h*.41),at(w*.5,-h*.25)],'cream',22);
  }
  return {painted,framed,easelSign,blade,flower,flowers,rim,spool,scroll,brackets,pennant};
}
