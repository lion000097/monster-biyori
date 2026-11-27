// Carved, stitched and printed designs are painted onto physical surfaces.
const emblems={
 paw:['02020','22022','00000','00200','02220','22222','02220'],
 sprig:['0000220','0202330','0222300','0022000','0320220','0322200','0020000'],
 tree:['0002000','0023200','0232320','2323232','0223220','0001000','0011100'],
 sky:['20000002','00122000','01000100','20000020','00000000','00200020','00001000'],
 moon:['0002220','0022000','0220000','0220000','0222000','0022222','0002220'],
 star:['0002000','0002000','2223222','0233320','0023200','0220220','0200020'],
 peak:['00000002','00002000','00023200','00231320','02311322','23111132','11111111'],
 score:['0011110','0010010','0212212','0010010','2212212','0310330','3303300'],
 map:['20000220','02002200','02223020','00300020','00033000','02003300','22200330'],
 feather:['0000222','0002322','0023320','0233200','0232000','0020000','0200000'],
 clock:['0022200','0223220','2202022','2322323','2200022','0223220','0022200'],
 page:['0220022','2332233','2112211','2332233','2112211','2332233','0220022'],
 frame:['22222222','23333332','23002332','23222332','23112232','21111112','22222222'],
 mask:['2000002','2200022','2222222','2132312','2211122','0223220','0022200'],
 fish:['00020000','02222202','23212222','02222202','00020000'],
 shell:['0022200','0223220','2323232','2232322','0232320','0022200'],
 grain:['002000','022200','002020','002220','022200','002000','002000'],
 flower:['0022000','0223220','2232322','0223220','0022000','0001000','0011100'],
 cup:['0222220','0232322','0222202','0222220','0022000','2222220'],
 arrow:['0002000','0002200','2222220','2333322','2222220','0002200','0002000'],
 face:['0222220','2232322','2212122','2223222','0233320','0022200'],
 print:['0222002','0020033','0222332','0003300','0223000','0332000']
};
function furnishings(k){
 const {block,ball,beam,lathe,panel,stroke,face,crate,barrel,pot,tuft,planter,plankTable}=k;
 const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 function art(at,w,h,name,paints=['bark','brass','cream']){
   const rows=emblems[name],cols=rows[0].length;
   for(let j=0;j<rows.length;j++)for(let i=0;i<cols;){
     const c=Number(rows[j][i]);let end=i+1;while(end<cols&&rows[j][end]===rows[j][i])end++;
     if(c){const x=i*w/cols,x1=end*w/cols,top=h-j*h/rows.length,bottom=top-h/rows.length;
       face([at(x,bottom),at(x1,bottom),at(x1,top),at(x,top)],paints[c-1],16);}
     i=end;
   }
 }
 function plaque(x,y,z,w,h,design,paints,base='oak',side=0){
   const at=panel(x,y,z,w,h,base,side,'wood');
   const off=[[0,.17],[.17,0],[0,-.17],[-.17,0]][side];
   art((u,v)=>{const p=at(u+.45,v+.9);p[0]+=off[0];p[1]+=off[1];return p;},w-.9,h-1.8,design,paints);
 }
 function jar(x,y,z,rad=1.65,h=5,mat='berry'){
   lathe(x,y,z,[[0,rad*.72],[.7,rad],[h*.65,rad],[h*.82,rad*.7],[h,rad*.7]],mat,9);
   lathe(x,y,z+h,[[0,rad*.77],[1.1,rad*.81]],'honey',9);
   lathe(x,y,z+h*.23,[[0,rad*1.03],[h*.24,rad*1.03]],'linen',9);
 }
 function ware(x,y,z,rad=2,mat='cream',filled=''){
   lathe(x,y,z,[[0,rad*.46],[.6,rad*.6],[rad*.92,rad],[rad*1.1,rad]],mat,12,'',true);
   lathe(x,y,z+rad*1.09,[[0,rad*.78],[.1,rad*.8]],filled||'bark');
 }
 function sack(x,y,z,s=1,mat='linen'){
   ball(x,y,z+3.2*s,2.15*s,2.05*s,3.6*s,mat);
   lathe(x,y,z+6*s,[[0,.85*s],[s,1.25*s],[1.6*s,.95*s]],mat,8);
   lathe(x,y,z+5.8*s,[[0,.95*s],[.65*s,.9*s]],'bark',8);
 }
 function book(x,y,z,w=3.5,d=2.5,mat='berry',upright=false){
   if(upright){
     block(x,y,z,w,d,.7+d*2,mat);block(x+.3,y+.2,z+.35,w-.6,d-.45,.4+d*2,'cream','');
     block(x,y,z+d*2+.6,w,d,.45,mat);
   }else{
     block(x,y,z,w,d,.55,mat);block(x+.16,y+.15,z+.53,w-.29,d-.24,.9,'cream','');block(x,y,z+1.39,w,d,.45,mat);
   }
 }
 function basket(x,y,z,rad=2.3,filled='',handle=true){
   lathe(x,y,z,[[0,rad*.63],[1,rad*.72],[rad*1.7,rad],[rad*1.86,rad]],'honey',10,'wood',true);
   lathe(x,y,z+rad*1.83,[[0,rad*.8],[.12,rad*.82]],'earth',10);
   for(const h of [.65,1.15,1.64])lathe(x,y,z+h*rad,[[0,rad*(.68+h*.18)],[.52,rad*(.68+h*.18)]],'oak',10);
   if(handle){const pts=Array.from({length:11},(_,i)=>[x+Math.cos(i*Math.PI/10)*rad*.92,y,z+rad*1.8+Math.sin(i*Math.PI/10)*rad*2]);for(let i=1;i<pts.length;i++)beam(pts[i-1],pts[i],.75,'oak',5);}
   if(filled)for(let i=0;i<6;i++){const a=i*2.4;ball(x+Math.cos(a)*rad*.55,y+Math.sin(a)*rad*.48,z+rad*2,rad*.36,rad*.37,rad*.65,filled);}
 }
 function loaf(x,y,z,s=1,round=false){
   const rx=round?1.7:2.65,ry=round?1.75:1.1;
   ball(x,y,z+1.3*s,rx*s,ry*s,2*s,'honey');
   for(const dx of [-.48,.18,.72])stroke([[x+dx*rx*s-.36*s,y-.54*ry*s,z+2.73*s],[x+dx*rx*s+.25*s,y+.34*ry*s,z+2.98*s]],'cream',20);
 }
 function wheel(x,y,z,rad=3,normal='y',mat='oak'){
   const at=(a,r,off=0)=>normal==='y'?[x+Math.cos(a)*r,y+off,z+Math.sin(a)*r*2.4]:[x+off,y+Math.cos(a)*r,z+Math.sin(a)*r*2.4];
   for(let i=0;i<12;i++){
     const a=i*tau/12,b=(i+1)*tau/12;
     face([at(a,rad,.22),at(b,rad,.22),at(b,rad*.75,.22),at(a,rad*.75,.22)],mat,14,'',true);
     face([at(a,rad,.22),at(b,rad,.22),at(b,rad,-.29),at(a,rad,-.29)],'iron',11);
     if(i%2===0)beam(at(a,0,.12),at(a,rad*.86,.12),.85,'honey',5);
   }
   ball(x,y,z,.68,.67,1.48,'iron');
 }
 function lantern(x,y,z,s=1,lit=false,mat='brass'){
   lathe(x,y,z,[[0,.55*s],[1*s,1.6*s],[1.7*s,1.65*s]],mat,6);
   lathe(x,y,z+1.5*s,[[0,1.36*s],[4.7*s,1.24*s]],lit?'gold':'cream',6);
   for(let j=0;j<4;j++){const a=j*Math.PI/2;beam([x+Math.cos(a)*1.27*s,y+Math.sin(a)*1.27*s,z+1.6*s],[x+Math.cos(a)*1.17*s,y+Math.sin(a)*1.17*s,z+6.3*s],.58*s,mat,4);}
   lathe(x,y,z+6*s,[[0,1.7*s],[1*s,1.7*s],[2.8*s,.45*s]],mat,6);ball(x,y,z+9*s,.4*s,.4*s,.7*s,mat);
 }
 function crystal(x,y,z,rad=1.8,h=7,mat='aqua'){
   lathe(x,y,z,[[0,rad*.38],[h*.28,rad],[h*.72,rad*.88],[h,.08]],mat,5);
   stroke([[x-rad*.62,y+rad*.58,z+h*.3],[x-rad*.53,y+rad*.52,z+h*.64],[x,y,z+h]],mat,23);
 }
 function rope(points,mat='bark',size=.65){for(let i=1;i<points.length;i++)beam(points[i-1],points[i],size,mat,5);}
 function drape(a,b,slack,mat='bark'){
   const p=[];for(let i=0;i<=10;i++){const t=i/10,v=mix(a,b,t);v[2]-=Math.sin(t*Math.PI)*slack;p.push(v);}rope(p,mat,.7);
   return t=>{const v=mix(a,b,t);v[2]-=Math.sin(t*Math.PI)*slack;return v;};
 }
 function chair(x,y,z=0,s=1,mat='oak'){
   plankTable(x,y,3.8*s,3.4*s,z+5.5*s,mat,z);
   for(const u of [x+.35*s,x+3.25*s])block(u,y,z,.65*s,.7*s,11.5*s,mat);
   block(x,y,z+7.5*s,3.9*s,.75*s,3.5*s,mat);
 }
 function telescope(x,y,z=0,s=1){
   const mid=[x,y,z+8.5*s];for(const [dx,dy] of [[-2,-1.7],[2,-.7],[.2,2.5]])beam([x+dx*s,y+dy*s,z],mid,1.1*s,'oak');
   beam([x+1.8*s,y+1.1*s,z+7*s],[x-2.5*s,y-1.4*s,z+13*s],2.4*s,'brass',8);
   beam([x-2.5*s,y-1.4*s,z+13*s],[x-3*s,y-1.7*s,z+14*s],2.8*s,'teal',8);
 }
 function easel(x,y,z,w,h,design='peak',paint=['pine','moss','cream']){
   for(const dx of [-.44,.44])beam([x+w*dx,y+1.2,z],[x+w*dx*.75,y-.4,z+h+3],1.25,'oak');
   beam([x,y-2.6,z],[x,y-.3,z+h+.3],1.1,'bark');
   block(x-w*.5,y-.5,z+3,w,.65,h-2,'oak');plaque(x-w*.46,y+.22,z+3.9,w*.92,h-3,design,paint,'linen');
 }
 function peg(x,y,h,mat='bark',rad=.7){lathe(x,y,0,[[0,rad*1.21],[1.3,rad*1.25],[1.8,rad],[h,rad],[h+.7,rad*.60]],mat,8,'wood');}
 function bird(x,y,z,s=1,mat='teal'){
   ball(x,y,z+1.5*s,1.32*s,.83*s,1.8*s,mat);ball(x+.88*s,y,z+3*s,.82*s,.75*s,1.25*s,mat);
   face([[x+1.45*s,y-.26*s,z+3.1*s],[x+2.28*s,y,z+2.8*s],[x+1.43*s,y+.22*s,z+2.6*s]],'gold',20);
   face([[x-.72*s,y-.35*s,z+1.3*s],[x-2.55*s,y-.25*s,z+2.8*s],[x-1.5*s,y+.45*s,z+1.3*s]],mat,12);
   ball(x+1.25*s,y+.42*s,z+3.38*s,.17*s,.17*s,.33*s,'ink');
 }
 function cloth(x,y,z,w,h,mat='blue',design='star'){
   const a=panel(x,y,z,w,h,mat,0,'weave');
   stroke([a(0,h*.16),a(w,h*.16)],'cream',18);
   art((u,v)=>[x+w*.22+u,y+.14,z+h*.24+v],w*.56,h*.55,design,['pale','cream','gold']);
 }
 function sign(x,y,z,w,h,design,mat='pine'){
   block(x-.45,y-.5,0,.9,1,z+h+1,'bark');block(x-w/2,y-.5,z,w,.86,h,'oak');
   plaque(x-w*.48,y+.42,z+.2,w*.96,h-.4,design,['bark','cream','gold'],mat);
 }
 return {art,plaque,jar,ware,sack,book,basket,loaf,wheel,lantern,crystal,rope,drape,chair,telescope,easel,peg,bird,cloth,sign};
}
