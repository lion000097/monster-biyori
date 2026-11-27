// World Tree levels 6–13. Each plan is in physical tile coordinates.
function earlyVillage(type,k,p){
 const {phase,block,ball,beam,lathe,panel,stroke,face,crate,barrel,pot,tuft,planter,gable,opening,cottage,plankTable,canopy}=k;
 const {art,plaque,jar,ware,sack,book,basket,wheel,lantern,crystal,rope,chair,telescope,peg,bird,sign}=p;
 switch(type){
 case 'eggWatch': {
   cottage(3,4,19,19,27,16,'moss',{door:.12,noFront:true});
   // An oriel with a glazed roof and straw cradles opens onto the yard.
   block(13.7,21.8,5,12.2,5.2,5,'oak');block(14,22.1,10,11.7,4.9,1.2,'honey');
   for(const x of [14.2,19.7,25.2])beam([x,26.5,10],[x,26.5,21.6],1.2,'oak');
   face([[13.7,21.5,25],[26,21.5,25],[26,27.2,21.1],[13.7,27.2,21.1]],'glass',18,'',true);
   for(const x of [14,18,22,25.9])beam([x,21.5,25.2],[x,27.2,21.2],.85,'brass');
   for(let i=0;i<3;i++){const x=15.5+3.8*i;basket(x,25,11.2,1.45,'',false);if(i<phase)ball(x,25,16.5,1.12,1.15,2.9,(k.item?.eggs||0)&(1<<i)?'gold':'cream');}
   // Egg-shaped finial stays recognizable even when all three nests are empty.
   lathe(12.3,7,44.5,[[0,1.1],[1,1.5]],'brass');ball(12.3,7,48.1,1.5,1.5,3.25,'cream');
   planter(5,26,0,1);tuft(27,12,0,1);
   // The glass observation bay sits below a small octagonal roof lantern.
   lathe(12.35,12.1,37,[[0,3.15],[1,3.2],[2,2.5],[7.4,2.5]],'teal',8,'',true);
   for(let j=0;j<8;j++){const a=j*tau/8;beam([12.35+Math.cos(a)*2.47,12.1+Math.sin(a)*2.47,39],[12.35+Math.cos(a)*2.47,12.1+Math.sin(a)*2.47,44.7],.65,'brass',4);}
   lathe(12.35,12.1,44.4,[[0,3.1],[1,3.1],[5.5,.42]],'moss',8);
   p.framed(4.9,23.4,13,5.2,8,'egg');
   p.flowers(15.2,26.5,2.2,8.7,'pink');p.lantern(4.15,24.1,11.8,.69,false);
   break;
 }
 case 'chickStep': {
   for(const [i,[x,y,rad]] of [[3.4,5,2.75],[7.9,8.5,3.05],[12.5,10.7,2.72]].entries()){
     lathe(x,y,0,[[0,rad*.81],[.8,rad],[1.8,rad*.88]],i===1?'pale':'stone',8,'speckle',true,.77);
     art((u,v)=>[x-rad*.56+u,y+rad*.47-v,2.02],rad*1.10,rad*.97,'paw',['stone','bark','clay']);
   }
   tuft(12.5,7.1,0,.41);
   for(const [cx,cy] of [[3.4,5],[7.9,8.5],[12.5,10.7]]){
     const z=2.14;
     for(const [u,v] of [[-.85,-.32],[0,-.73],[.83,-.37]])ball(cx+u,cy+v,z,.36,.47,.32,'bark');
     p.rim(cx,cy,z,1.86,1.18,'pale',1.04,2.1);
   }
   p.blade(4.8,8.2,.1,-1.3,1,2.3,.63);p.flower(10.7,6.5,0,.47,'cream');
   break;
 }
 case 'luggage': {
   plankTable(2.1,4.6,11.8,6.2,7.4);
   block(3.3,5.3,9.6,5.1,3.6,5.6,'clay');for(const x of [3.9,7.3])block(x,5.18,9.6,.53,3.84,5.8,'bark');
   beam([4.9,7,15.7],[6.65,7,15.7],1.12,'bark');block(5.5,8.93,11.8,.95,.26,1.5,'brass');
   sack(10.9,7.7,9.5,.79);book(3.3,9.3,9.6,3.5,1.6,'teal');
   // A travel case label and a loosely unrolled route map.
   p.brackets(3.45,9.04,10,4.62,5);p.framed(4.28,9.18,10.7,2.58,3.3,'landscape');
   p.painted([[8.9,10,9.92],[13.2,10,9.92],[8.9,7.65,9.92]],'map');
   beam([12.6,8.08,10.1],[13,10.6,10.1],.63,'pale');p.spool(3.45,2.96,0,1.1,3.4,'teal');
   break;
 }
 case 'starDial': {
   lathe(8,8,.1,[[0,3.8],[1.7,3.9],[2.5,2.5],[9,1.9],[11,3.6]],'stone',8,'stone');
   lathe(8,8,11,[[0,5.05],[1.1,5.15],[2.1,4.65]],'brass',16,'',true);
   lathe(8,8,13.06,[[0,4.46],[.2,4.45]],'indigo',20);
   for(let i=0;i<12;i++){const a=i*tau/12;stroke([[8+Math.cos(a)*3.61,8+Math.sin(a)*3.61,13.45],[8+Math.cos(a)*4.32,8+Math.sin(a)*4.32,13.45]],'cream',20);}
   const angle=phase*Math.PI/2+.45,points=[[-2,.2],[-.6,-1.45],[.7,-.55],[2.4,-1.05]];
   const stars=points.map(([x,y])=>[8+x*Math.cos(angle)-y*Math.sin(angle),8+x*Math.sin(angle)+y*Math.cos(angle),13.63]);
   stroke(stars,'brass',17);stars.forEach(v=>ball(...v,.25,.25,.48,'cream'));beam([8,8,13.3],[8,8,20],1.25,'brass');
   p.rim(8,8,13.60,3.45,3.45,'brass');p.rim(8,8,13.48,4.62,4.62,'pale',.2,1.87);
   for(let i=0;i<8;i++){const a=i*tau/8;ball(8+Math.cos(a)*4.8,8+Math.sin(a)*4.8,13.3,.26,.26,.43,i%2?'brass':'cream');}
   const tip=[8+Math.cos(angle)*2.9,8+Math.sin(angle)*2.9,14.23];
   face([[7.59,8.16,14.23],tip,[8.35,8.41,14.23]],'gold',21,'',true);lathe(8,8,4.2,[[0,2.38],[.8,2.32]],'brass',10);
   break;
 }
 case 'starChart': {
   cottage(3,8,19,15,21,13,'dusk',{door:.11});
   lathe(20.7,9.3,0,[[0,6],[2,6.3],[3.2,5.7],[25,5.7],[26.6,6.2]],'plaster',12,'stone');
   lathe(20.7,9.3,26.4,[[0,6.6],[3.9,6.2],[8.8,4.8],[12.1,2.7],[13.7,.65]],'indigo',12);
   beam([20.7,9.3,39],[20.7,9.3,46],1,'brass');ball(20.7,9.3,46.2,.67,.67,1.3,'brass');
   plankTable(7,24.2,10,4.1,6);book(8,25,8.3,3.3,2.5,'dusk');
   p.easel(21.6,25,0,6,13,k.item?.picture!=null?['sky','star','moon'][Math.abs(k.item.picture)%3]:'sky',['brass','gold','cream']);telescope(26.1,17.7,0,.82);
   // Raised copper meridians and the split shutter of the observatory dome.
   for(const a of [.22,1.22,2.26,3.3,4.4,5.37]){
     const arc=[[6.55,26.6],[6.08,30.2],[4.8,35.3],[2.6,38.6],[.7,40]];
     stroke(arc.map(([r,z])=>[20.7+Math.cos(a)*r,9.3+Math.sin(a)*r,z+.35]),'brass',17);
   }
   p.framed(10.6,23.6,21.6,6.3,8.4,'moon');p.scroll(22.7,25.7,2.8,4.3,5.8);
   p.rim(20.7,9.3,25.7,6.3,6.3,'brass');
   break;
 }
 case 'toolRack': {
   for(const x of [4,28]){block(x-1,4,0,2.3,4.4,2,'bark');block(x,5,1,1,1.2,23,'oak');}
   for(const z of [10,15.4,20.8])block(4,5.1,z,25,1,4.1,'oak');
   block(2.7,4.3,23.5,28,3.3,2,'honey');
   for(const [i,x] of [7,12.8,18.8,24.8].entries()){
     beam([x,6.5,20],[x-.52,7.2,8+i%2],1.4,'honey');
     if(i===0)beam([x-1.9,6.8,18.3],[x+1.85,6.8,19.8],2.4,'iron',5);
     if(i===1)face([[x-2.2,7,18],[x+2.2,7,18.4],[x+1.5,7,12.6],[x-.2,7,11.8]],'slate',16,'',true);
     if(i===2)for(const d of [-1.25,0,1.25])beam([x+d,6.8,18],[x+d,6.8,22],.75,'iron');
     if(i===3)wheel(x,6.9,16,1.95,'y','brass');
   }
   crate(8.6,8.6,0,5.4,3.3,3.5);
   // A joiner's saw with a toothed edge, a chisel roll, and pegged hanging loops.
   for(const xx of [7,12.8,18.8,24.8]){p.rim(xx,6.53,20.6,.50,.34,'brass');ball(xx,6.7,20.7,.32,.27,.48,'iron');}
   for(let j=0;j<5;j++){const xx=10.9+j*.57;face([[xx,7.23,13.1],[xx+.64,7.23,13.35],[xx+.3,7.23,12.1]],'iron',19);}
   p.spool(23,9.85,.25,1.3,4.9,'teal');p.brackets(4.2,6.45,15.5,23.7,5.2);
   break;
 }
 case 'herbPlot': {
   for(const x of [4,13,22]){
     block(x,8,0,6.4,16,2.3,'oak');block(x+.48,8.52,2.2,5.42,14.96,.5,'earth','speckle');
     for(let j=0;j<3;j++){tuft(x+2.05,10.3+j*5,2.6,.84+(j%2)*.2,x===13);tuft(x+4.4,11.6+j*4.7,2.6,.71,x===22);}
   }
   for(const x of [4.4,13,22]){peg(x,6,9,'oak');sign(x,6.2,5.6,4.2,4,'sprig','teal');}
   barrel(4.3,27.3,0,2.3,6.2,'oak',true);basket(23.5,27,0,1.85,'berry');
   for(const [j,x] of [6.6,15.1,24].entries())for(const y of [11.2,16.3,21.1]){
     p.blade(x,y,2.85,-1.6,.75,2.75,.76,j===1?'pine':'leaf');
     p.blade(x,y,2.85,1.55,-.76,3.4,.69,j===2?'moss':'leaf');
     if(j!==0)p.flower(x,y,2.85,.52,j===1?'plum':'cream');
   }
   p.scroll(12.2,5,1.25,6,6.2);p.rim(4.3,27.3,6.26,1.65,1.65,'water');p.spool(27,23.4,0,1.1,3.5,'bark');
   break;
 }
 case 'birdClock': {
   lathe(8,8,0,[[0,3.5],[2,3.6],[3.2,2.3]],'stone',8);
   block(6.65,6.6,2.7,2.7,2.85,14,'oak');
   block(4.6,5.5,15,6.8,5.6,12.6,'oak');gable(3.9,4.85,27.6,8.3,6.9,7.4,'pine');
   plaque(5.2,11.22,16,5.6,7.2,'clock',['bark','cream','gold'],'bark');
   opening(7.1,11.2,24,2.2,3.3,false);
   if(phase)bird(8.2,12.2,24.2,.83,'teal');
   for(const [x,len] of [[6.2,7],[9.9,9]]){beam([x,10.2,15.2],[x,10.2,15.2-len],.5,'brass');ball(x,10.2,14-len,.63,.63,1.35,'brass');}
   // A readable dial, little hinged doors and a swinging hammered-brass bob.
   const cy=11.65,zc=20.85;
   for(let i=0;i<8;i++){const a=i*tau/8;stroke([[8+Math.cos(a)*1.76,cy,zc+Math.sin(a)*2.69],[8+Math.cos(a)*2.05,cy,zc+Math.sin(a)*3.17]],'ink',5);}
   stroke([[7,cy+.12,zc+1.73],[8,cy+.12,zc],[9.34,cy+.12,zc+.49]],'indigo',5);
   const bx=7.83+(phase?.49:-.4);beam([8,10,16.2],[bx,10,8.9],.52,'brass');ball(bx,10,8.15,1.02,.45,1.56,'gold');
   p.brackets(5.1,11.34,16.4,5.8,8);
   break;
 }
 case 'sunChair': {
   for(const x of [3.7,11.2]){beam([x,3.4,0],[x,11.7,9.2],1.45,'oak');beam([x,12.7,.4],[x,4,10.7],1.4,'oak');beam([x,6.8,6.7],[x,2.8,20.4],1.5,'honey');}
   for(let i=0;i<5;i++){const x=4+i*1.42,c=i%2?'pale':'moss';face([[x,2.9,19.3],[x+1.42,2.9,19.3],[x+1.42,7.4,7.8],[x,7.4,7.8]],c,17,'weave');
     face([[x,7.4,7.8],[x+1.42,7.4,7.8],[x+1.42,12.3,8.2],[x,12.3,8.2]],c,19,'weave');}
   beam([3.6,2.8,20],[11.5,2.8,20],1.6,'oak');beam([3.5,12.3,8.2],[11.5,12.3,8.2],1.3,'oak');
   // A striped pillow, piping and the two brass pivots on the folding frame.
   block(5,3.12,16.2,5.3,1.7,2.9,'linen','weave');p.painted([[5.3,4.92,16.6],[9.8,4.92,16.6],[5.3,4.92,18.7]],'rosette');
   for(const xx of [3.65,11.2]){ball(xx,7.65,5.4,.50,.48,.65,'brass');beam([xx,5.4,10.9],[xx,10.3,10.6],.82,'honey');}
   for(const xx of [4.2,10.7])stroke([[xx,3.46,19.1],[xx,7.49,8.07],[xx,12.33,8.52]],'cream',22);
   break;
 }
 case 'acornLamp': {
   lathe(7.2,8.5,0,[[0,2.7],[2,2.8],[3.1,1.9]],'stone',8);
   peg(7.2,8.5,29,'bark',1.04);beam([7.2,8.5,24.3],[10.8,8.4,29.8],1.36,'oak');
   beam([7.2,8.5,28.5],[12,8.5,28.5],1.28,'oak');
   beam([11,8.55,28.4],[11,8.55,24],.65,'iron');
   lathe(11,8.55,15.6,[[0,.24],[1.8,1.65],[5.4,2.16],[7.5,1.75]],phase?'gold':'honey',10);
   lathe(11,8.55,21.5,[[0,2.37],[1.9,2.4],[3.2,1.3],[3.65,.48]],'bark',10,'wood');
   plaque(4.6,9.6,11.2,5.6,4.6,'arrow',['oak','cream','gold'],'pine');
   const acx=11,acy=8.55;
   for(let i=0;i<8;i++){const a=i*tau/8;stroke([[acx+Math.cos(a)*1.74,acy+Math.sin(a)*1.74,22.15],[acx+Math.cos(a+.30)*2.35,acy+Math.sin(a+.30)*2.35,23.5]],'honey',17);}
   for(const a of [.4,2.5,4.7])stroke([[acx+Math.cos(a)*.6,acy+Math.sin(a)*.6,16.3],[acx+Math.cos(a)*1.96,acy+Math.sin(a)*1.96,19.6],[acx+Math.cos(a)*1.7,acy+Math.sin(a)*1.7,21.1]],'brass',12);
   p.blade(7.1,8.55,25,-2.4,1.25,2.1,.94);p.flower(6,9,0,.47,'cream');
   break;
 }
 case 'jarHut': {
   cottage(4.4,3.5,21,18.5,24,14,'berry',{chimney:true,door:.12});
   canopy(12.4,20.6,19,14,5.6,'berry','linen',2.4);plankTable(13.1,22.3,12.5,4.1,7);
   for(let i=0;i<5;i++)jar(14.6+i*2.3,24.4,9.3,1.03,4.15,['berry','gold','moss','plum'][(i+phase)%4]);
   barrel(5.1,25.9,0,2.3,7.7);basket(9.1,26.5,0,1.75,'berry');
   p.easelSign(13.7,29.4,0,5.1,10.5,'jam');
   for(const xx of [15.3,20.2,24.7]){p.jar(xx,25.5,9.46,1.28,4.2,xx<17?'berry':xx<22?'aqua':'gold');p.rim(xx,25.5,12.9,1.13,1.13,'pale');}
   p.pennant(16.4,26.66,16.6,4.9,4.15,'berry');p.flowers(22.7,7.4,2,5.4,'pink');
   break;
 }
 case 'handCart': {
   for(const y of [3.6,11.35])wheel(16,y,6.5,2.65);
   block(6,4.3,6.5,16,6.5,2,'oak');for(const y of [4.3,10.3])block(5.7,y,8.4,16.6,.8,3.9,'honey');
   for(const y of [5.2,10])beam([20,y,7.7],[29.3,y,12.2],1.6,'oak');
   crate(7.1,5,8.5,6.3,4.8,7.2);crate(13.8,5.4,8.5,5.5,4.2,5.2,'honey');sack(19.8,7.8,8.7,.7);
   p.rope([[7.55,4.92,15.65],[10.25,7.55,16.85],[13.6,10.28,8.94]],'linen',.76);
   p.rope([[13.35,4.97,12.65],[15.95,7.53,14.62],[19.3,10.39,9]],'linen',.74);
   p.framed(8.16,9.96,10.69,3.63,3.2,'tree');p.brackets(6.35,11.08,8.7,15.1,3.1);
   for(const yy of [5.2,10])beam([27.16,yy,11.65],[29.45,yy,12.3],1.79,'bark',6);
   break;
 }
 case 'heightPost': {
   block(4.3,5.1,0,5,4.5,2.4,'stone','stone');block(5.6,6.1,2.2,2.3,2.7,28,'honey');
   for(let i=0;i<10;i++){const x=5.75,z=4.5+i*2.45;stroke([[x,8.9,z],[x+(i%2?1.0:1.82),8.9,z]],'bark',4);}
   ball(6.8,7.35,31.7,1.6,1.3,2.5,'oak');plaque(5.0,8.9,28.5,4.2,5,'paw',['honey','bark','brass'],'honey');
   lathe(10.2,11.3,.1,[[0,2.1],[1,2.25]],'stone',8);
   for(const [i,z] of [9.3,16.5,24].entries()){
     block(7.78,7.47,z,2.55,.77,.85,['berry','teal','brass'][i]);ball(9.76,7.81,z+.56,.38,.34,.61,'gold');
   }
   p.blade(5.48,6.57,5.7,-2,1.2,3,.72);p.flower(10.7,11.3,1.12,.50,'pink');
   p.brackets(5.2,8.9,2.75,2.85,6.35);
   break;
 }
 case 'hideLog': {
   // Hexagonal bark shell with an open, dark end rather than a solid stump.
   const sy=8,z=6.4,rx=3.35;function ring(x,a,scale){return [x,sy+Math.cos(a)*rx*scale,z+Math.sin(a)*6.7*scale];}
   for(let i=0;i<12;i++){const a=i*tau/12,b=(i+1)*tau/12;
     face([ring(2,a,1),ring(13.9,a,1),ring(13.9,b,1),ring(2,b,1)],'bark',9+(i%4)*2,'wood');
     for(const x of [2,13.9])face([ring(x,a,1),ring(x,b,1),ring(x,b,.67),ring(x,a,.67)],'honey',14,'',true);
     face([ring(2,a,.67),ring(13.9,a,.67),ring(13.9,b,.67),ring(2,b,.67)],'ink',4);
   }
   beam([6,7.7,11],[5.1,6,15.7],2.2,'bark');tuft(5.1,6,14,.52);tuft(10.4,11.3,0,.65);
   for(let i=0;i<7;i++){const a=.17+i*.47;
    const pts=[2.6,4.3,6.75,9.5,11.2,13.4].map((xx,j)=>ring(xx,a+Math.sin(j*1.85+i)*.072,1.026));
    stroke(pts,i%3?'bark':'honey',i%3?4:12);
   }
   for(const [xx,yy,ss] of [[4.4,10.25,.76],[6,10.63,.55],[11,6.5,.57]]){
    lathe(xx,yy,8,[[0,.65*ss],[.6,1.95*ss],[1.48,1.27*ss],[1.73,.52*ss]],'cream',7);
   }
   p.blade(9.4,10.78,9.7,.9,-.55,2.3,.6);p.rim(13.2,9.7,.4,1.11,.6,'moss',0,3.7);
   break;
 }
 case 'toyRepair': {
   cottage(3.2,3.8,18.9,18.4,23.6,12.4,'teal',{door:.1});
   plankTable(17.8,21.2,10,5,5.3);wheel(18.8,26.6,3.3,1.38);
   // A carved rocking pony and bowed runners live in the front yard.
   const x=11,y=25;ball(x,y,7.7,3.1,1.45,3.4,'honey');beam([x+1.8,y,8],[x+3.1,y,13],2.6,'oak');ball(x+3.45,y,13.5,1.22,1,1.9,'honey');
   for(const yy of [y-1,y+1]){rope([[x-4.5,yy,2.6],[x-2.7,yy,1],[x+2.7,yy,1],[x+4.2,yy,2.6]],'oak',1.15);for(const dx of [-1.7,1.7])beam([x+dx,yy,1.2],[x+dx*.65,yy,6.5],1.2,'oak');}
   ball(24.2,23.7,10.5,1.55,1.55,3,'berry');ball(26.7,18,2.2,1.2,1.2,2.3,'blue');
   // A carved hobbyhorse on the gable and a bench vice with a real screw.
   p.framed(9.5,22.65,22.2,7.1,8.8,'pony');block(22.1,25.1,7.8,2.9,1.4,2.75,'iron');
   beam([22.45,26.25,8.93],[25.48,26.25,8.93],.73,'brass');beam([25.1,26.25,7.6],[25.1,26.25,10.1],.59,'iron');
   p.wheel(26.4,26.1,3.5,1.4,'y','berry');p.flowers(4.2,22.5,1.1,5.9,'pink');
   break;
 }
 case 'guestBoard': {
   for(const x of [3.5,11.8])peg(x,6.8,21,'oak');block(2.7,6.2,9,10.9,1.25,10.1,'bark');
   block(2.1,5.7,19,12,2.3,1.9,'honey');for(const [i,x] of [3.4,6.9,9.6].entries()){
     const z=10.8+(i%2)*2.2;const a=panel(x,7.59,z,2.6,4.9,i===1?'pale':'linen');stroke([a(.5,2.7),a(2,2.7)],'oak',9);ball(x+1.4,7.69,z+4.6,.25,.25,.42,'berry');
   }
   sack(3,9.7,0,.57,'teal');
   p.framed(3.5,7.68,10.45,3.08,6.4,'landscape');p.scroll(7.15,7.68,11.2,4.0,7.05);
   p.pennant(9.35,7.86,20.9,3.66,4.25,'teal');p.spool(12.8,9.55,.3,.9,3.4,'berry');
   p.brackets(2.91,7.64,9.6,9.9,9.6);
   break;
 }
 case 'bookBind': {
   cottage(5.2,4,16.8,21,27,13.4,'pine',{door:.15});
   block(21.6,11.2,0,6.5,11.5,13,'oak');gable(21,10.5,13,8,13,5.6,'pine');
   plankTable(14.7,24.9,12.6,3.6,6.8);for(let i=0;i<3;i++)book(15.6,25.4,9+i*1.7,3.7,2.5,['berry','teal','indigo'][i]);
   block(22,24.8,9,4.4,3,1.2,'bark');block(22.3,25.1,12.9,3.9,2.5,1.5,'oak');for(const x of [22.5,25.6])beam([x,26.25,9.8],[x,26.25,15.5],.7,'iron');
   plaque(8.5,25.25,20.8,5.4,5.2,'page',['ink','cream','brass'],'oak');planter(4.4,24,0,.8);
   p.framed(8.9,25.46,20.1,7.4,10.2,'book');
   p.spool(21.8,28.1,0,1.43,5.1,'berry');p.spool(24.36,28.1,0,1.05,3.65,'teal');
   for(let j=0;j<4;j++)stroke([[24,26.28,11.55+j],[24.65,26.25,12.08+j]],'brass',20);
   beam([22.25,26.2,16.3],[26.1,26.2,16.3],.83,'honey');p.flowers(3.5,13.5,0,4.65,'cream');
   break;
 }
 case 'bookReturn': {
   block(5.0,4.7,0,6,5.9,2,'stone','stone');block(5.8,5.3,1.8,4.6,4.6,5,'oak');
   block(4.55,4.65,6.8,7,6,13.7,'pine');gable(4.05,4.15,20.4,8,7,4.2,'tile');
   panel(5.2,10.8,16.2,5.7,2.4,'ink');block(5,10.7,15.7,6.1,.8,.7,'brass');
   plaque(5.7,10.85,7.9,4.6,6.5,'page',['pine','cream','gold'],'pine');
   p.framed(5.42,10.93,8.2,5.05,6.6,'book');p.brackets(4.78,10.78,7.1,6.31,8.3);
   block(5.8,10.7,15.72,3.31,1.65,.48,'linen');stroke([[6,12,16.28],[8.63,12,16.28]],'berry',16);
   p.flower(10.9,10.1,.25,.46,'cream');
   break;
 }
 case 'stoneStudy': {
   cottage(4,4.5,17.5,19,22,12,'slate',{wall:'oak',door:.12});block(3.8,4.25,1,17.9,19.5,5,'slate','stone');
   plankTable(14.4,23.5,12,4.3,6.6);for(const [x,y,z,rad,h,mat] of [[23,10.4,0,2.6,13,'plum'],[25.8,12,0,1.7,8,'aqua'],[23.2,15.5,0,1.5,6,'blue']])crystal(x,y,z,rad,h,mat);
   crystal(24.6,25.4,8.95,1.45,5.8,'teal');beam([7,26,0],[7,26,9],1.3,'brass');wheel(7,26,11,1.95,'y','brass');
   p.framed(9.35,23.92,19.76,5.95,8.3,'geode');
   for(const xx of [19.2,23.4]){block(xx,27.3,4.6,2.3,1.5,.4,'linen');p.rim(xx+.9,27.8,5.02,.51,.36,'brass');}
   beam([26.2,23.65,8.95],[23.6,22.7,10.3],.82,'oak');beam([25.5,22.95,10.3],[26.8,24.05,9.9],1.28,'iron');
   p.crystal(4.17,25.4,0,1.1,4.2,'plum');
   break;
 }
 case 'crystalHanger': {
   for(const x of [3.6,28.5]){lathe(x,7,0,[[0,1.7],[1,1.7],[2.3,1.25]],'stone',7);peg(x,7,25-(x>20?2:0),'bark',.63);}
   const pos=p.drape([3.6,7,24.6],[28.5,7,22.5],3.8);
   for(let i=0;i<5;i++){const [x,y,z]=pos((i+1)/6),drop=2.2+i%3*1.5;beam([x,y,z],[x,y,z-drop],.51,'brass');
     lathe(x,y,z-drop-6.1,[[0,.08],[4,1.3+i%2*.3],[6.1,.27]],['aqua','plum','blue'][i%3],5);
     if(phase)stroke([[x-1.1,y,z-drop-2],[x+.35,y,z-drop-.6]],'white',23);}
   for(let i=0;i<5;i++){const [x,y,z]=pos((i+1)/6),drop=2.2+i%3*1.5;
    p.rim(x,y,z-.3,.50,.43,'brass');lathe(x,y,z-drop-1.8,[[0,1.06],[.53,1.23],[1.55,.37]],'brass',6);
    stroke([[x-.71,y+.45,z-drop-1.8],[x-.86,y+.5,z-drop-3.45],[x,y,z-drop-5.8]],'glass',21);
   }
   p.blade(3.62,7.05,17.65,-1.6,.85,2.6,.67);p.flowers(25.2,6.5,.18,3.0,'plum');
   break;
 }
 case 'fossilSand': {
   block(2.1,2.5,0,11.9,10.7,1.55,'oak');block(2.8,3.2,1.5,10.5,9.3,.32,'pale','speckle');
   const bones=[[4.3,5.4],[5.5,6.7],[7.1,7.25],[8.8,7.2],[10.2,7.7]];
   rope(bones.map(([x,y])=>[x,y,2.04]),'cream',1.5);
   for(let i=1;i<4;i++){const [x,y]=bones[i];beam([x,y-.15,2.2],[x+.5,y+1.75,2.3],.96,'cream');}
   if(phase)ball(11.1,8.3,2.83,1,.62,.82,'cream');
   beam([11.3,11.2,2],[13.8,13,6.2],1,'oak');face([[10.5,10.6,2],[11.3,10.1,2.4],[12,11.4,2.5],[11.3,11.9,2]],'slate',14);
   // Spiral ammonite ribs and a sieve make the find readable at one tile.
   for(let i=1;i<24;i++){const t=i/23*1.25*tau,q=(i-1)/23*1.25*tau;
    const xyz=a=>[8.8+Math.cos(a)*(.2+a*.21),6+Math.sin(a)*(.2+a*.15),2.27];stroke([xyz(q),xyz(t)],'bark',11);}
   for(let i=0;i<6;i++){const a=i*.75;stroke([[8.8+Math.cos(a)*1.43,6+Math.sin(a)*1.05,2.31],[8.8+Math.cos(a)*1.86,6+Math.sin(a)*1.38,2.31]],'cream',22);}
   p.rim(4.1,10.65,2.07,1.36,.91,'brass');beam([5.2,10.55,2.15],[7.45,11.5,2.54],.58,'oak');
   break;
 }
 case 'butterflyPool': {
   lathe(7.8,8.4,0,[[0,4.7],[1.6,5.1],[2.7,4.8]],'stone',11,'stone',true,.80);
   lathe(7.8,8.4,2.69,[[0,4.15],[.1,4.13]],'water',12,'water',false,.8);
   for(const [x,y,s] of [[3.8,7.4,.86],[9.5,4.9,.7],[12.2,8.45,.67]])tuft(x,y,1.3,s,true);
   lathe(6.7,9.1,2.95,[[0,1.38],[.1,1.38]],'leaf',8,'',false,.70);
   if(phase)for(const [x,y,z] of [[5.6,8.3,10],[10.3,6.8,12]]){
     face([[x,y,z],[x-1.3,y-.3,z+2.4],[x-1.85,y+.3,z+1],[x-.6,y+.6,z-.5]],'gold',19,'',true);
     face([[x,y,z],[x+1,y-.4,z+2.1],[x+1.7,y+.35,z+.6],[x+.6,y+.5,z-.5]],'pink',17,'',true);
   }
   p.rim(7.6,8.45,2.94,3.17,2.37,'glass',.34,2.35);p.rim(9.2,7.22,2.98,1.85,1.11,'aqua',3.9,1.80);
   for(const [x,y,s] of [[3.95,6.1,.67],[10.85,5.46,.54],[12.48,8.35,.62]])p.flower(x,y,2.2,s,'plum');
   p.blade(5.3,10.6,2.2,-1.65,-.42,1.61,.65);
   break;
 }
 case 'footBath': {
   block(4.3,6,0,21.4,17.8,4.2,'stone','stone');block(6,7.6,4.15,18,14.5,.4,'water','water',false);
   for(const x of [4.25,24.3])block(x,6,4.1,1.6,17.8,1.4,'oak');
   for(const y of [6,22.2])block(4.4,y,4.1,21.3,1.5,1.4,'honey');
   plankTable(5.1,24.5,20.2,3.5,5.2);plankTable(6.3,2.5,15.7,3.1,5);
   peg(23,5.8,13,'teal');beam([23,5.8,12.3],[21,9.9,11.9],1.6,'honey');stroke([[21,9.9,11.6],[21,9.9,4.9]],'water',19);
   basket(28.25,19.6,0,1.65,'',false);planter(3.7,27.7,0,.74);
   // Bathhouse screen, folded towels and a dipping pail with an arched bail.
   p.easelSign(24.1,26.2,0,5.03,10.3,'tea',1);
   for(const [i,x] of [7.3,11].entries()){block(x,25,7.52,3.1,2.05,.85,'linen','weave');stroke([[x+.45,25.1,8.52],[x+.45,26.93,8.52]],i?'teal':'berry',14);}
   p.rim(20.9,9.9,4.72,2.9,1.45,'glass',.4,4.2);p.rim(20.9,9.9,4.77,1.53,.77,'aqua');
   barrel(26.35,12.4,0,1.95,4.9,'oak',true);p.rope([[24.7,12.4,4.6],[25.1,12.4,7],[26.35,12.4,7.7],[27.6,12.4,7],[27.95,12.4,4.6]],'iron',.51);
   break;
 }
 case 'seedSwap': {
   canopy(5,4,25,21,16,'pine','pale',3.4);
   block(5.7,14.6,0,19.6,5.5,7.8,'oak');block(5.35,14.4,7.65,20.4,6,1.8,'honey');
   for(let j=0;j<2;j++)for(let i=0;i<5;i++){const x=7.5+3.8*i,y=15.9+j*2.9;pot(x,y,9.5,1.2,2.5);tuft(x,y,12,.47+((phase+i)%3)*.11,i===phase);}
   crate(5,23.2,0,7,4.4,4);sack(8.5,25.2,4.2,.65);basket(22.7,24,0,2,'leaf');sign(27,20,5,4.8,5.4,'sprig','pine');
   p.pennant(7.6,20.4,22.46,6.4,6.25,'teal');p.easelSign(4.2,24.8,0,4.8,8.8,'tree',1);
   for(const [i,xx] of [9.1,14.7,20.5].entries()){
    block(xx,21.6,1.2,3.83,2.2,2.55,'honey');p.painted([[xx+.15,23.57,3.96],[xx+3.58,23.57,3.96],[xx+.15,21.78,3.96]],['tree','rosette','landscape'][i]);
   }
   p.flower(25.8,9.25,0,.74,'cream');p.flower(26.9,10.7,0,.63,'pink');
   break;
 }
 default:throw Error('Missing early town drawing '+type);
 }
}
