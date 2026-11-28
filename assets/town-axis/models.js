// Local x and y follow the ranch axes (16 units per tile). The public facade
// always faces +y in plan, the same convention as frontPoint and frontRoads.
function coolingShelf(k,p){
  const {block,beam,gable,stroke}=k;
  block(3.0,2.4,0,26.1,10.75,2.2,'bark','planks');
  block(3.2,2.6,2.1,25.4,2.5,26.6,'plaster','speckle');
  for(const x of [3.05,27.1]){
    block(x,2.85,1.9,1.55,7.9,21.25,'oak');
    block(x-.06,2.85,2,1.65,1.4,27.15,'bark');
    block(x-.1,11.3,2,1.75,1.28,12.15,'honey');
    beam([x+.72,4.3,20.9],[x+.72,10.3,12.9],1.65,'bark');
  }
  function rack(y,z,d,material){
    block(4.3,y,z,22.9,d,1.65,'bark');
    for(let i=0;i<7;i++)block(4.45,y+.19+d*i/7,z+1.66,22.59,d/10,.45,material,'wood',false);
    block(3.45,y+d-.17,z-.15,24.65,.79,1.95,'honey');
  }
  rack(4.8,4.25,8.15,'oak');rack(4.7,14.1,5.45,'oak');
  for(const x of [6.5,16.0])k.opening(x,5.18,19.0,7.6,8.3);
  paintedWall(k,'breadShelf',4.18,5.86,17.25,23.2,11.6,[19,46],[57,18],[0,-25]);
  gable(2.35,2.0,29.25,27.2,4.5,4.7,'tile');
  function bread(x,y,z,s,round){
    const rx=round?1.6*s:2.38*s,ry=round?1.35*s:1.02*s;
    k.lathe(x,y,z,[[0,rx*.76],[.68*s,rx],[1.7*s,rx*.98],[2.85*s,rx*.69],[3.35*s,rx*.23]],'honey',12,'',false,ry/rx);
    for(const q of [-.49,.07,.58])stroke([[x+q*rx-.33*s,y+.39*ry,z+2.94*s],[x+q*rx+.27*s,y-.28*ry,z+3.21*s]],'cream',22);
  }
  if(k.phase){
    for(const [i,x] of [8.6,16.0,23.35].entries()){bread(x,8.65,16.21,1.10,i===1);bread(x,10.75,6.37,1.0,i!==1);}
  }else{
    p.basket(8.1,8.0,16.21,1.52,'',false);p.basket(21.8,9.95,6.37,1.90,'',true);bread(16.1,8.45,16.21,1.03,false);
  }
  // The service side has its own mullioned windows, bracing and flour bin.
  for(const x of [3.35,13.9,26.95])block(x,2.12,2.0,1.05,.70,26.0,'oak');
  for(const z of [3.65,11.5,24.7])block(3.4,2.05,z,24.7,.64,1.2,'honey');
  k.opening(24.3,2.1,14.1,6.8,8.4,false,2);
  k.opening(12.2,2.1,14.1,6.8,8.4,false,2);
  beam([4.3,2.0,4.9],[12.4,2.0,11.0],1.05,'bark',4);
  beam([15.1,2.0,11.0],[23.4,2.0,4.9],1.05,'bark',4);
  k.crate(13.7,1.0,0,5.0,2.25,4.2,'oak');p.sack(8.3,1.72,0,.59);
  for(const x of [2.94,28.71]){
    for(const z of [5.5,12.1])beam([x,3.8,z],[x,10.4,z],1.0,'honey',4);
    beam([x,4.0,17.5],[x,9.5,7.0],1.25,'honey',4);
  }
  p.framed(23.0,13.22,4.9,3.9,4.2,'bread');p.flowers(3.15,12.52,1.12,4.35,'cream');

}
function umbrellaShop(k,p){
  const {block,beam,lathe,ball,cottage,plankTable,face,stroke}=k;
  cottage(4.4,4.4,19,15.4,23,13.5,'teal',{door:.09,noFront:true});
  block(4.2,19.8,0,20.0,7.2,3.3,'slate','stone');
  k.canopy(5.2,17.3,20.2,19.8,7.5,'teal','aqua',2.6);
  plankTable(14.6,21.0,9.2,4.45,9.0);
  p.framed(16.0,25.56,6.1,5.4,5.3,'tree');p.lantern(6.2,24.9,11,.7,true);
  // Each closed umbrella has a ferrule, folded canopy, band and curved handle.
  block(24.9,12.6,0,4.0,9.4,3.55,'oak','planks');
  for(const [i,y] of [14.2,17.4,20.6].entries()){
    if(k.phase&&i!==1)continue;
    const x=26.8;
    beam([x,y,3.6],[x,y,19],.88,'honey');
    lathe(x,y,5.1,[[0,.28],[8.8,1.49],[10.2,.34]],['berry','gold','moss'][i],8,'weave');
    lathe(x,y,10.5,[[0,1.03],[.8,1.08]],'pale',8);
    p.rope([[x,y,18.7],[x,y,20],[x+.75,y,20.7],[x+1.05,y,19.7]],'bark',.71);
  }
  // A second, open paper parasol marks the lending window.
  const cx=23.25,cy=8.2,r=6.3,peak=32.5;
  beam([cx,cy,3],[cx,cy,peak+1],1.25,'bark');
  const at=(i,d,z)=>[cx+Math.cos(i*tau/12)*d,cy+Math.sin(i*tau/12)*d,z];
  for(let i=0;i<12;i++){
    const mat=i%2?'berry':'pink';
    face([at(i,0,peak),at(i,r*.67,peak-2.8),at(i+1,r*.67,peak-2.8)],mat,15+i%3,'weave');
    face([at(i,r*.67,peak-2.8),at(i,r,peak-6.6),at(i+1,r,peak-6.6),at(i+1,r*.67,peak-2.8)],mat,14+i%3,'weave',true);
    stroke([at(i,0,peak+.16),at(i,r*.67,peak-2.65),at(i,r,peak-6.4)],'pale',16);
  }
  ball(cx,cy,peak+.28,.5,.5,1.12,'brass');p.flowers(9.1,25.35,2.2,4.4,'blue');
}
function starTerrace(k,p){
  const {block,beam,lathe,face,stroke,ball}=k;
  // Twin-level deck. Leave a real opening in the front balustrade for the stair.
  block(4,5.0,0,39.6,32.5,5.2,'slate','stone');
  block(3.55,4.5,5.2,40.5,33.5,1.55,'oak','planks');
  for(let n=0;n<3;n++)block(20.0,37.65+n*1.55,0,9.2,1.9,5.75-n*1.65,'pale','stone');
  function rail(x1,y1,x2,y2,spans){
    for(let n=0;n<=spans;n++){
      const u=n/spans,x=x1+(x2-x1)*u,y=y1+(y2-y1)*u;
      block(x-.39,y-.39,6.75,.78,.78,8.9,'indigo');
      ball(x,y,15.7,.46,.46,.86,'brass');
    }
    for(const h of [9.3,14.4])beam([x1,y1,h],[x2,y2,h],h>10?1.36:.82,'brass',5);
  }
  rail(4.9,6.0,42.4,6.0,7);rail(4.9,6,4.9,36.5,5);rail(42.4,6,42.4,36.5,5);
  rail(4.9,36.5,19.0,36.5,3);rail(30.1,36.5,42.4,36.5,2);
  // A midnight blue half-canopy frames the stars without covering the tables.
  for(const x of [7.4,25.8])for(const y of [8.2,19.2]){
    block(x-.56,y-.56,6.7,1.12,1.12,24.2,'indigo');
    lathe(x,y,6.8,[[0,.88],[2.3,.88],[2.65,.62]],'brass',8);
  }
  for(const x of [7.4,25.8])beam([x,7.6,30.6],[x,19.9,30.6],1.55,'brass',5);
  for(let band=0;band<7;band++){
    const x=6.8+band*2.82,xx=x+2.84;
    for(const [a,b,za,zb] of [[7.5,13.4,31.4,34.5],[13.4,20.0,34.5,30.0]])
      face([[x,a,za],[xx,a,za],[xx,b,zb],[x,b,zb]],band%2?'indigo':'dusk',16,'weave',true);
    face([[x,20,30],[xx,20,30],[(x+xx)/2,20,27.4]],'indigo',15,'weave',true);
  }
  function star(x,y,z,s){
    const pts=Array.from({length:10},(_,i)=>{const a=i*tau/10-Math.PI/2,r=i%2?.42:1;return [x+Math.cos(a)*s*r,y,z-Math.sin(a)*2.05*s*r];});
    face(pts,'gold',20,'',true);stroke([pts[0],[x,y+.1,z],pts[2]],'cream',21);
  }
  const line=p.drape([7.4,20.03,28.8],[25.8,20.03,28.8],2);
  for(const u of [.18,.5,.82]){const [x,y,z]=line(u);stroke([[x,y,z],[x,y,z-2.1]],'brass',17);star(x,y,z-3.45,.95);}
  for(const [x,y] of [[12.1,25.7],[29,23.6]]){
    lathe(x,y,6.8,[[0,2.0],[.8,2.0],[1.5,.76],[6.4,.66],[6.9,2]],'brass',10);
    lathe(x,y,13.65,[[0,3.65],[1.15,3.65]],'indigo',12,'',true);p.rim(x,y,14.88,3.45,3.45,'gold');
    p.ware(x-1.0,y,14.9,.81,'cream','teal');p.lantern(x+1.5,y-.4,14.9,.37,true);
    p.chair(x-5.8,y-.8,6.8,.73);p.chair(x+.7,y+4.5,6.8,.71);
  }
  // The outer lamp standard carries a double-sided brass crescent over the seats.
  const lampA=[40.6,31.8,6.75],lampB=[40.6,31.8,39.5],hook=[35.3,31.8,41.4];
  beam(lampA,lampB,1.6,'indigo');p.rope([lampB,[39.7,31.8,41.6],[37.9,31.8,42.6],hook,[35.0,31.8,39.5]],'brass',1.18);
  stroke([[35,31.8,40.0],[35,31.8,37.0]],'brass',18);
  const arc=(a,inner,y)=>[34.9+2.72*(.56-(inner?.74:1.58)*Math.cos(a)),y,31.5+5.40*Math.sin(a)];
  for(let i=0;i<12;i++){
    const a=(i/12-.5)*Math.PI,b=((i+1)/12-.5)*Math.PI;
    for(const y of [31.58,32.02])face([arc(a,false,y),arc(b,false,y),arc(b,true,y),arc(a,true,y)],'gold',y>32?21:17);
    face([arc(a,false,31.58),arc(b,false,31.58),arc(b,false,32.02),arc(a,false,32.02)],'brass',14);
    stroke([arc(a,false,32.04),arc(b,false,32.04)],'cream',20);
  }
  const lamps=p.drape([25.7,19.2,30.6],[40.6,31.8,39.0],3.5);
  for(const [u,sz] of [[.18,1.14],[.50,1.43],[.79,1.05]]){const [x,y,z]=lamps(u);stroke([[x,y,z],[x,y,z-1.4]],'brass',16);star(x,y,z-3.4,sz);}
  block(31.0,8.2,6.75,8.35,7.95,2.3,'slate','stone');p.telescope(35,12.2,9.1,1.37);
  k.planter(38.9,32.4,6.85,.86);p.easelSign(15.7,39,0,4.0,7.25,'moon');
}
function teaHouse(k,p){
  const {block,beam,lathe,ball,face,stroke}=k;
  block(3.0,4.0,0,24.5,21.7,3.6,'slate','stone');
  block(2.7,3.7,3.6,25.1,24.25,1.55,'oak','planks');block(12.7,27.8,0,9.9,1.85,2.85,'stone','stone');
  // Shoji surround a recessed tatami room. The front opens onto the veranda.
  block(4,4.9,5.15,22.6,1.05,18.0,'plaster','speckle');
  block(4,5.2,5.15,1.05,16.0,18,'plaster','speckle');
  block(25.6,5.2,5.15,1.05,16.0,18,'plaster','speckle');
  function screen(x,y,side,w,h){
    const at=k.panel(x,y,6.35,w,h,'cream',side,'',true);
    for(const u of [0,w*.33,w*.67,w])beam(at(u,0),at(u,h),.90,'bark',4);
    for(const v of [0,h*.34,h*.7,h])beam(at(0,v),at(w,v),.90,'oak',4);
  }
  screen(4.4,4.75,0,21.9,14.6);screen(26.83,6.0,1,13.7,14.8);
  screen(3.83,20.0,3,13.7,14.8);screen(4.65,21.45,0,6.25,14.8);screen(21.15,21.45,0,4.6,14.8);
  for(const x of [4.65,11.0,20.7,26.25])block(x-.4,20.8,5.2,.9,1,18.4,'bark');
  for(let i=0;i<3;i++){
    block(5.4+i*6.62,11.45,5.15,6.42,11.75,.46,'pale','weave');block(5.45+i*6.62,11.4,5.6,.43,11.72,.17,'pine');
  }
  const corners=[[2.0,3.45,22.9],[28.35,3.45,22.9],[28.35,23.0,22.9],[2.0,23.0,22.9]],
    ends=[[8.55,12.75,33.4],[21.8,12.75,33.4]];
  for(const [corn,n] of corners.entries())beam(n,corners[(corn+1)%4],2.28,'bark',6);
  function roof(at,span,levels){
    const rows=4,cols=Math.max(5,Math.round(span/3.8));
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const a=i/cols,b=(i+1)/cols,u=j/rows,v=(j+1)/rows;
      face([at(a,u),at(b,u),at(b,v),at(a,v)],(i+2*j)%7===0?'pine':'teal',levels+(i+j)%3,'',true);
      stroke([at(a+.015,v-.048),at(b-.024,v-.048)],'aqua',13);
    }
  }
  function blend(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t);}
  for(const [i,n] of corners.entries()){
    const next=corners[(i+1)%4],aa=ends[i===1||i===2?1:0],bb=ends[(i+1)%4===1||(i+1)%4===2?1:0];
    roof((s,t)=>blend(blend(aa,bb,s),blend(n,next,s),t),Math.hypot(n[0]-next[0],n[1]-next[1]),i===2?16:i===1?12:14);
    beam(aa,n,1.86,'teal',7);stroke([[aa[0],aa[1],aa[2]+1.0],[n[0],n[1],n[2]+1.0]],'aqua',15);
  }
  beam(ends[0],ends[1],2.75,'teal',7);
  for(const end of ends){lathe(end[0],end[1],end[2],[[0,.77],[.95,1.12],[1.8,.74],[2.75,.42]],'teal',8);}
  // Rear shoji and a narrow service door make the kitchen side legible on rotation.
  for(const x of [4.4,13.05,20.5,25.7])block(x,4.1,5.15,.75,1.0,17.55,'bark');
  k.opening(24.3,4.05,6.1,4.7,13.2,true,2);k.opening(12.2,4.12,10.6,6.15,8.05,false,2);
  for(const y of [7.0,18.0])k.planter(27.9,y,0,.77,false);

  // Dark tea curtain, red cushions and iron kettle read separately at map scale.
  for(let i=0;i<3;i++)p.cloth(11.72+i*2.89,22.66,15.6,2.78,5.1,'teal',i===1?'cup':'sprig');
  k.plankTable(12.9,21.6,7.6,4.05,8.0,'bark',5.18);
  for(const [x,y] of [[8.9,23.9],[21.7,23.8]]){
    block(x,y,5.2,3.25,2.28,.82,'berry','weave');stroke([[x+.3,y+.52,6.1],[x+2.95,y+.52,6.1]],'pink',18);
  }
  lathe(16.6,23.55,10.2,[[0,.8],[.6,1.35],[2.15,1.42],[3.15,.87],[3.36,.57]],'iron',10);
  ball(16.6,23.55,13.78,.32,.31,.53,'brass');
  p.rope([[15.45,23.6,12.2],[15.48,23.6,14.55],[16.7,23.6,15.5],[17.67,23.6,14.6],[17.7,23.6,12.15]],'iron',.61);
  p.ware(19.2,23.8,10.21,.79,'cream','teal');
  for(const x of [5.2,24.9]){
    beam([x,22,20.5],[x,24.05,20.5],1.03,'bark');
    lathe(x,24.0,10.65,[[0,1.12],[.6,1.2],[1.8,1.63],[4.8,1.78],[6.6,1.38],[7.25,1.1]],'berry',10,'weave');
    for(const z of [10.65,17.65])lathe(x,24,z,[[0,1.13],[.63,1.1]],'bark',10);
    stroke([[x,24,18.2],[x,24,20.55]],'brass',15);
  }
  p.framed(22.7,22,14.2,3.65,5.2,'tea');
  p.flowers(2.7,26.35,1.2,5.7,'pink');k.planter(27.95,15.7,0,1.0,false);
}
function guildHall(k,p,tier){
  const {block,beam,face,ball,lathe,cottage}=k;
  cottage(8.0,6.0,25.4,23.7,33.5,17.5,'tile',{door:.27});
  // Tall attached watchtower, copper cap and a standard match the main timber hall.
  cottage(30.3,9.8,11.5,12.0,43.0,9.6,'berry',{wall:'oak',noDoor:true});
  block(5.9,28.0,0,29.1,8.1,3.0,'stone','stone');block(11.0,35.6,0,11.8,3.2,1.6,'stone','stone');
  k.gable(11.8,27.0,22.5,13.1,6.55,6.9,'teal');
  for(const x of [12.7,23.9]){block(x,32.3,3,1.1,1.1,19.9,'oak');p.lantern(x+.3,32.9,13,.67,true);}
  p.easelSign(29.6,34.3,3,7.9,12.5,'map');p.crystal(38.0,28.5,0,2.5,8.0,'aqua');
  const cx=20.8,cy=30.37,cz=33.6;
  face([[cx-3.5,cy,cz+5.3],[cx+3.5,cy,cz+5.3],[cx+3.1,cy,cz-.1],[cx,cy,cz-3.7],[cx-3.1,cy,cz-.1]],'brass',18,'',true);
  face([[cx-2.8,cy+.14,cz+4.4],[cx+2.8,cy+.14,cz+4.4],[cx+2.4,cy+.14,cz+.25],[cx,cy+.14,cz-2.6],[cx-2.4,cy+.14,cz+.25]],'indigo',16,'',true);
  for(const d of [-1,1])beam([cx-d*1.58,cy+.36,cz-1],[cx+d*1.54,cy+.36,cz+3.65],.91,'cream',4);
  p.pennant(28.3,30.0,29.7,4.0,11.7,'berry');
  k.crate(32.9,24,0,5.1,4.25,5.2);k.barrel(6.9,30.2,0,2.35,7);p.flowers(6.1,34,0,4.8,'cream');
  if(tier>=1){
    beam([35.9,14.5,47],[35.9,14.5,63.5],1.2,'brass');p.pennant(35.9,14.65,62,5.7,8.1,'berry');
  }
  if(tier>=2){
    for(const x of [8.1,32.4]){beam([x,7.4,29.5],[x,7.4,44.2],1.15,'brass');p.pennant(x,7.55,43.2,3.6,7.0,'teal');}
    p.framed(34.0,22.05,25,5.15,6.4,'map');
  }
}
