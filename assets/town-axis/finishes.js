// Place details from the original paintings on real wall planes. Back-facing
// surfaces are hidden by the depth buffer, just like the windows and furniture.
function paintedWall(k,type,x,y,z,w,h,source,along,up,side=0){
  const axes=[[1,0],[0,1],[-1,0],[0,-1]],d=axes[side];
  k.r.veneer([[x,y,z],[x+w*d[0],y+w*d[1],z],[x,y,z+h]],[source,along,up],{sheet:type});
}
function tileCourses(k,at,mat,depth,width){
  const rows=Math.max(2,Math.round(width/5.2)),cols=Math.max(3,Math.round(depth/3.8));
  for(let row=1;row<=rows;row++){
    const low=row/rows;
    for(let col=-1;col<cols;col++){
      const shift=(row%2)*.46,a=Math.max(0,(col+shift)/cols),b=Math.min(1,(col+1+shift)/cols);
      if(b<=a)continue;
      const mid=(a+b)/2;
      k([at(low-.032,a,.95),at(low,mid,1.06),at(low-.032,b,.95)],mat,8);
      k([at(low-.060,a,1.14),at(low-.029,mid,1.14)],mat,19);
      if(a>0)k([at(low-.045,a,1),at(Math.max(0,low-.80/rows),a,1)],mat,10);
    }
  }
}
function buildingFinishes(type,k,p){
  const {block,beam,ball,lathe,face,stroke}=k;
  const wall=(...args)=>paintedWall(k,type,...args);
  switch(type){
    case 'catLedge':{
      block(3.9,4.6,13.84,24.1,2.26,10.35,'oak','planks');
      wall(4.1,7.02,14.8,23.6,10.9,[17,49],[59,19],[0,-28]);
      block(3.0,6.5,13.8,26.0,4.8,1.35,'honey');
      const cx=17.35,cy=9.25;
      ball(cx,cy,17.4,3.49,1.55,2.4,'honey');ball(cx-2.29,cy+.51,19.1,1.5,1.15,2.25,'honey');
      for(const x of [cx-3.08,cx-1.52]){
        face([[x-.5,cy+.64,20.0],[x+.48,cy+.64,20.0],[x-.12,cy+.45,22.0]],'clay',16,'',true);
      }
      stroke([[cx-3.05,cy+1.48,19],[cx-2.72,cy+1.53,18.7],[cx-2.4,cy+1.55,19.0]],'ink',4);
      for(const q of [-.7,.45,1.55])stroke([[cx+q,cy-.66,19.4],[cx+q+.45,cy+.45,19.85],[cx+q+.46,cy+1.08,18.9]],'bark',9);
      p.rope([[cx+2.1,cy+1.12,17],[cx+3.5,cy+1.32,17.1],[cx+3.7,cy+.2,18],[cx+2.9,cy,18.6]],'oak',1.45);
      break;
    }
    case 'breadMarket':
      wall(5.6,25.85,10.8,18.8,9.7,[22,65],[60,17],[0,-18]);
      p.lantern(25.16,20.2,11,.63,true);p.sack(6.3,9.2,0,1.03,'linen');break;
    case 'maskStall':
      wall(6.95,20.5,10.9,16.6,12.95,[34,70],[46,6],[4,-37]);
      p.lantern(25.4,21.7,12.8,.72,true,'berry');p.lantern(6.25,8.0,12.8,.60,true,'brass');break;
    case 'shoeRepair':
      wall(7.3,8.1,10.85,17.6,9.65,[36,63],[49,14],[0,-16]);
      for(const [x,y] of [[11.2,18.6],[17.25,18.6]]){
        ball(x,y,14.6,2.32,1.14,1.55,'clay');block(x+.45,y-.68,14.15,1.33,1.4,4.9,'oak');
        stroke([[x-.9,y+1.0,14.5],[x+.46,y+1.03,15.0]],'pale',19);
      }
      p.framed(6.4,21.45,10.1,3.8,4.6,'map');break;
    case 'jarHut':
      wall(6.15,22.39,3.6,17.1,17.1,[33,89],[47,7],[0,-32]);
      for(const [x,y] of [[12,11.6],[13.35,10],[14.6,10.4]]){
        ball(x,y,39.5,.85,.85,1.65,'berry');p.blade(x+.18,y,41.1,.9,-.48,.67,.43);
      }break;
    case 'eggWatch':{
      wall(4.5,23.44,5.2,11,20,[26,88],[34,5],[0,-27]);
      const x=12.2,y=11.0;
      lathe(x,y,42.0,[[0,4.12],[1.1,4.4],[2.7,3.8]],'teal',10,'',true);
      lathe(x,y,44.2,[[0,3.56],[2.0,3.86],[5.7,3.39],[8.6,2.25],[10.2,.8]],'cream',12);
      for(let i=0;i<8;i++){const a=i*tau/8;
        stroke([[x+3.62*Math.cos(a),y+3.62*Math.sin(a),44.3],
          [x+3.82*Math.cos(a),y+3.82*Math.sin(a),47.1],[x+2.2*Math.cos(a),y+2.2*Math.sin(a),52.7]],'brass',12);}
      p.rim(x,y,47.9,3.85,3.85,'gold');break;
    }
    case 'musicMaker':{
      wall(4.6,22.99,3.5,15.9,17.5,[30,88],[41,6],[0,-34]);
      const x=23.3,y=13.4;
      lathe(x,y,15.7,[[0,3.75],[1.2,4.03],[2.0,3.52],[13.6,3.52]],'honey',10,'wood',true);
      for(let i=0;i<10;i++){const a=i*tau/10,xx=x+Math.cos(a)*3.65,yy=y+Math.sin(a)*3.65;
        beam([xx,yy,19.1],[xx,yy,28.8],.85,'brass',4);}
      lathe(x,y,29.0,[[0,4.8],[1.2,4.62],[5.4,2.9],[9.0,.6]],'teal',10);
      ball(x,y,39.1,.55,.55,1.25,'brass');
      for(let j=0;j<9;j++){const u=5.6+(j%4)*2.4,v=6.8+Math.floor(j/4)*3.6; p.blade(u,v,37+(u-5)*.4,1.45,.75,1.75,.90,j%3?'leaf':'brick');}
      break;
    }
    case 'toyRepair':
      wall(4.1,22.58,3.5,15.9,17.7,[29,95],[31,4],[0,-33]);
      p.wheel(22.9,18.15,7.8,3.35,'x','honey');p.bird(9.7,11.3,39.6,.61,'berry');break;
    case 'stoneStudy':{
      wall(5.3,23.91,5.1,11.2,15.55,[22,91],[33,4],[0,-29]);
      const x=13.0,y=13.2;
      const outline=[[-3.6,0],[-4.35,5.6],[-2.55,13.2],[-.35,17.2],[2.85,13.0],[4.4,5.55],[2.85,0]];
      for(let i=0;i<outline.length;i++){
        const [a,b]=outline[i],[c,d]=outline[(i+1)%outline.length];
        face([[x+a,y-2.2,32+b],[x+c,y-2.2,32+d],[x+c,y+1.75,32+d],[x+a,y+1.75,32+b]],i%2?'slate':'plum',13,'stone',true);
      }
      face(outline.map(([u,v])=>[x+u,y+1.76,32+v]),'plum',15,'speckle',true);
      for(const [dx,dz,w,h,col] of [[-1.95,.5,1.05,5.7,'plum'],[.0,1.0,1.23,8.1,'pink'],[1.65,2.0,.95,5.6,'indigo']])
        p.crystal(x+dx,y+1.98,32+dz,w,h,col);
      break;
    }
    case 'specimenHut':{
      wall(4.35,23.35,4.0,13.6,16.3,[23,93],[34,5],[0,-29]);
      const x=23.0,y=12.3,rad=5.10,sides=8;
      const at=(i,r,z)=>[x+Math.cos(i*tau/sides)*r,y+Math.sin(i*tau/sides)*r,z];
      lathe(x,y,.1,[[0,rad],[3.15,rad],[4,rad+.3]],'oak',sides,'planks',true);
      lathe(x,y,15.8,[[0,rad],[1.0,rad]],'brass',sides);
      for(let i=0;i<sides;i++){
        beam(at(i,rad,3.8),at(i,rad,26.2),1.06,'brass',5);
        face([at(i,rad+.35,25.4),at(i+1,rad+.35,25.4),at(i+1,1.4,31.5),at(i,1.4,31.5)],i%2?'glass':'aqua',18,'',true);
        stroke([at(i,rad+.4,25.55),at(i,1.4,31.65)],'pale',19);
      }
      for(let i=0;i<6;i++){
        const a=i*tau/6; p.blade(x,y,4.3,2.8*Math.cos(a),2.8*Math.sin(a),7.2+i%3*2,1.25);
        p.flower(x+Math.cos(a)*2.45,y+Math.sin(a)*2.45,4.3,.9,i%2?'cream':'pink');
      }
      ball(x,y,32.2,.68,.68,1.3,'brass');break;
    }
    case 'umbrellaHut':
      wall(9.1,19.99,6.2,10.0,10.2,[35,86],[52,9],[0,-29]);
      // A folded indigo umbrella and a lacquer-red one at the loan counter.
      p.ware(20.45,23.25,11.3,1.03,'blue','glass');p.lantern(23.7,24.4,12.1,.59,true,'berry');
      break;
    case 'teaRoom':
      wall(11.5,22.95,15.65,8.78,5.35,[31,66],[37,6],[0,-15]);

      break;
    case 'starTerrace':{
      // Clusters of wisteria trail down an open copper arch on the west side.
      for(let j=0;j<15;j++){
        const t=j/14,ang=Math.PI*t,xx=7.6,yy=9.0+t*24.1,zz=17.0+Math.sin(ang)*16.5;
        const a=[xx,yy,zz],b=[xx,yy+1.7,17+Math.sin(Math.min(Math.PI,ang+Math.PI/14))*16.5];
        if(j<14)beam(a,b,1.75,'oak',6);
        p.blade(xx,yy,zz,1.2,1.0,1.25,.65,j%2?'leaf':'moss');
        if(j%3!==2)for(let f=0;f<4;f++)ball(xx+.6,yy+.4,zz-.85-f*.93,.57-.075*f,.57-.075*f,.95-.11*f,f%2?'plum':'pink');
      }
      for(const x of [9,39.6])for(const y of [8,33.8])p.lantern(x,y,15.15,.69,true);
      const cx=24.35,cy=29.9,z=6.84;
      for(let i=0;i<8;i++){
        const a=i*tau/8,b=a+tau/16,c=a-tau/16,r=i%2?2.3:3.8;
        face([[cx+Math.cos(b)*.84,cy+Math.sin(b)*.84,z],[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z],[cx+Math.cos(c)*.84,cy+Math.sin(c)*.84,z]],i%2?'pale':'brass',20);
      }
      for(let j=0;j<7;j++){
        const y=12.0+j*3.25,z=20+Math.sin((j+1)*Math.PI/8)*12.8,x=7.7;
        for(let i=0;i<3;i++){
          const a=i*2.18,delta=Math.cos(a)*1.45;
          p.blade(x+delta,y+Math.sin(a),z,.9,-1.15,1.6,.88);
          for(let s=0;s<4;s++)ball(x+delta,y+Math.sin(a),z-1.15-s*1.04,.72-s*.1,.67-s*.095,1.05-s*.1,s%2?'plum':'pink');
        }
      }break;
    }
  }
}
