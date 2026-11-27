function middleVillage(type,k,p){
 const {phase,block,ball,beam,lathe,panel,stroke,face,crate,barrel,pot,tuft,planter,gable,opening,cottage,plankTable,canopy}=k;
 const {art,plaque,jar,ware,sack,book,basket,loaf,wheel,lantern,crystal,rope,drape,chair,telescope,easel,peg,bird,cloth,sign}=p;
 switch(type){
 case 'returnBell': {
   for(const x of [3.1,12.7]){block(x-1,7,0,2.2,3.8,1.8,'stone','stone');block(x-.47,8.3,1.6,1.18,1.55,24,'bark');}
   block(2,8,24.3,12,2,2.3,'oak');beam([3.7,8.8,18.7],[6,8.8,24.7],1.6,'honey');beam([12.7,8.8,18.7],[10.4,8.8,24.7],1.6,'honey');
   const x=8+phase*.35;rope([[8,8.85,25],[x,8.85,20]],'iron',.85);
   lathe(x,8.85,10.8,[[0,3.35],[1.3,3.4],[2.7,2.5],[6.6,2.05],[8.4,1.3],[9,.55]],'brass',12,'',true);
   ball(x,8.85,10.1,.65,.65,1.55,'iron');rope([[x+2.5,9.5,13.4],[x+3.3,10.3,9],[x+2.8,10.7,5.3]],'pale',.7);
   p.rim(x,8.85,12.7,3.1,3.1,'gold');p.rim(x,8.85,16.1,2.18,2.18,'honey');
   for(let i=0;i<8;i++){const a=i*tau/8;ball(x+Math.cos(a)*2.33,8.85+Math.sin(a)*2.33,15.42,.33,.33,.72,'gold');}
   p.pennant(6.1,9.7,25.8,4.15,5.8,'teal');p.rope([[x+2.8,10.7,5.4],[x+2.05,10.7,4.1],[x+2.74,10.7,3.25],[x+3.37,10.7,4.05],[x+2.8,10.7,5.4]],'honey',.6);
   break;
 }
 case 'shoeRepair': {
   // Open cobbler's bench under a short pent roof, with a last and the pair being mended.
   block(4.5,6,0,22.7,16.7,1.25,'oak','planks');
   for(const x of [6,25])peg(x,7,25,'oak');block(5.9,6.8,8.5,19.7,1.1,13.9,'oak','wood');
   gable(3.6,4.7,23,23.8,7.5,5.7,'tile');plankTable(6.5,12.2,18.2,7.6,10.1);
   for(const [x,y] of [[12,16],[15.9,15.6]]){block(x-1.1,y-1,12.4,2.4,2.3,4.2,'bark');ball(x+.93,y,13.3,1.95,1.22,1.75,'oak');}
   beam([18,16.7,12.7],[21.7,15.1,13.2],1.0,'honey');beam([21.1,14.7,13.1],[22.2,15.9,13.4],1.55,'iron');
   chair(8.2,22.4,0,.85);barrel(24.9,23,0,1.9,5.5);p.sign(26,11,12,4.6,5,'paw','clay');
   // Stitched soles, a row of eyelets and leather offcuts beside the cobbler's last.
   for(const xx of [12,15.9]){
    stroke([[xx-.79,16.87,12.83],[xx+.4,17.22,12.71],[xx+2.4,16.69,12.92]],'pale',19);
    for(let j=0;j<3;j++)stroke([[xx-.7,16.91,14.75+j*.56],[xx+.6,17.05,14.4+j*.56]],'linen',18);
   }
   for(const [i,xx] of [8.3,11.1,13.9].entries()){p.spool(xx,9.4,1.4,1.19,5.1,['berry','honey','bark'][i]);}
   block(20.3,19.1,11.9,3.1,1.8,.58,'clay');beam([20.8,14.5,12.6],[23.1,14.2,13.8],.53,'iron');
   p.pennant(6.4,11.9,22.7,4.7,7.4,'clay');p.brackets(7.2,20.16,10.3,16.7,2.7);
   break;
 }
 case 'windSock': {
   lathe(5,8,0,[[0,2.1],[1.4,2.35],[2.7,1.56]],'stone',7);
   peg(5,8,32,'honey',.62);ball(5,8,32.5,.55,.55,1,'brass');
   const centers=Array.from({length:6},(_,i)=>[5.2+i*1.7,8+Math.sin(i*.7+phase*Math.PI/2)*i*.22,28.7-i*.52+Math.sin(i*.9+phase)*.74]);
   const at=(i,j)=>{const [x,y,z]=centers[i],a=j*tau/8,r=2.0-i*.24;return [x,y+Math.cos(a)*r,z+Math.sin(a)*r*1.92];};
   for(let i=0;i<5;i++)for(let j=0;j<8;j++)face([at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1)],i%2?'cream':'berry',12+Math.round(4*Math.sin(j*tau/8)),'weave');
   for(const j of [0,4])rope([at(5,j),[15.1,centers[5][1]+(j?.45:-.45),centers[5][2]-1.5]],'berry',.7);
   for(const j of [0,4]){const [a,b,c]=at(1,j);
    ball(a,b,c+.35,.61,.26,1.08,'cream');ball(a+.09,b+(j?-.17:.17),c+.42,.33,.23,.69,'ink');}
   for(let i=2;i<5;i++)for(const j of [0,3,5])stroke([at(i,j),at(i+.0,j+1),at(i+1,j+1)],i%2?'brick':'gold',19);
   for(const [side,mat] of [[1,'teal'],[-1,'gold']]){const [a,b,c]=centers[5];
    face([[a,b,c],[a+1.4,b+side*.63,c+.63],[a+2.65,b+side*1.3,c-2.15],[a+1.1,b+side*.7,c-1.32]],mat,15,'weave',true);}
   break;
 }
 case 'amberShelf': {
   for(const x of [3.9,27.4])block(x,5,0,1.3,4.5,19.8,'bark');
   for(const z of [3.1,11.3])block(3.3,4.9,z,26.3,6.3,1.35,'oak');block(3.1,4.4,21,26.6,2,1.4,'honey');
   block(4.4,5.1,5,23.7,.65,11.8,'pine','wood');
   for(const [x,z,s] of [[6.7,4.55,1.31],[11.3,4.55,1.55],[21.8,4.55,1.35],[25.8,12.75,1.6],[8.4,12.75,1.61]]){
     lathe(x,9.3,z,[[0,s*1.3],[.6,s*1.2]],'bark',8);crystal(x,9.3,z+.7,s,s*3.75,'gold');
   }
   for(const x of [7,17,24])panel(x-1.15,10.2,8.1,2.4,1.8,'pale');
   for(const [xx,zz,s] of [[6.7,4.55,1.31],[11.3,4.55,1.55],[21.8,4.55,1.35],[25.8,12.75,1.6],[8.4,12.75,1.61]]){
    const yy=9.42;stroke([[xx-s*.43,yy+s*.64,zz+1.62],[xx-.13,yy+s*.69,zz+2.5],[xx+.61,yy+s*.56,zz+2.13]],'bark',11);
    stroke([[xx-.23,yy+s*.63,zz+2.48],[xx+.04,yy+s*.43,zz+3.69]],'honey',20);
   }
   p.rim(16.4,9.6,12.86,1.52,.95,'brass');beam([17.5,9.8,13.01],[19.2,10.7,13.12],.7,'bark');
   p.brackets(3.66,11.27,3.3,24.8,6.1);p.scroll(15.3,10.32,7.55,4.6,3.25);
   break;
 }
 case 'specimenHut': {
   cottage(3.8,5.1,19.5,17.9,24,12.8,'moss',{door:.10});
   canopy(18.5,14,19,9.5,9.2,'pale','pale',1.5);
   easel(23,23.9,0,7.2,14.1,'feather',['oak','leaf','cream']);
   easel(12.6,26.5,0,5.7,10.4,'sprig',['bark','pine','moss']);planter(4.8,24,0,.95);
   for(const y of [8.1,11.5]){pot(26,y,0,1.62,3.8);tuft(26,y,3.8,.73);}
   p.framed(20.0,24.46,3.95,6.3,9.75,'butterfly');p.framed(10.35,27.04,4.03,4.65,6.23,'tree');
   p.framed(10.75,23.84,23.95,5.9,6.25,'butterfly');
   for(const z of [1.05,2.1,3.05])block(24.1,17.8,z,3.9,2.45,.60,z>2.5?'oak':'linen');
   for(const xx of [24.4,27.6])beam([xx,19.4,.5],[xx,19.4,4.5],.56,'iron');
   p.flowers(4.65,24.1,.15,4.0,'plum');
   break;
 }
 case 'openGallery': {
   for(const x of [6,24,42])peg(x,7.6,28,'oak',.75);
   const cable=drape([6,7.6,26.5],[42,7.6,26.5],3.5);
   for(let i=0;i<7;i++){const [x,y,z]=cable((i+.6)/7);face([[x-1.45,y,z],[x+1.45,y,z],[x,y,z-4.6]],['berry','moss','gold','teal'][i%4],16,'weave',true);}
   for(const [i,x] of [10,24,37].entries())easel(x,16+(i%2)*4,0,9.2,20,['peak','frame','flower'][(i+phase+Math.abs(k.item?.picture||0))%3],[['pine','moss','cream'],['bark','blue','linen'],['pine','pink','gold']][i]);
   plankTable(7,31,13,5,6.3);for(const x of [8.9,12.5,16.2])jar(x,33,8.5,1.1,3.4,x<10?'berry':x<14?'indigo':'moss');
   chair(27,32,0,1.25);planter(41,32,0,1.35);plaque(7,32.6,9,5.5,4.1,'frame',['bark','moss','gold'],'pale');
   const paintedViews=['landscape','rosette','butterfly'];
   for(const [i,xx] of [10,24,37].entries()){
    const yy=16+i%2*4;
    p.framed(xx-4.1,yy+.57,4.18,8.2,15.75,paintedViews[(i+phase+Math.abs(k.item?.picture||0))%3]);
    block(xx-1.68,yy+1.1,2.35,3.3,.7,.79,'brass');
   }
   p.scroll(7.15,36.05,3.1,7.5,4.9);ball(17.8,33.2,8.85,1.63,1.08,.52,'honey');
   for(const [i,mat] of ['brick','gold','teal'].entries())ball(17.1+i*.6,33.1,9.38,.29,.27,.25,mat);
   break;
 }
 case 'paintSink': {
   plankTable(2.9,4.1,10.2,7.7,5.2);
   lathe(7,7.7,7.25,[[0,2.5],[3.4,3.2],[4.2,3.35]],'slate',12,'',true,.83);
   lathe(7,7.7,11.45,[[0,2.74],[.12,2.71]],['teal','berry','blue','plum'][phase%4],12,'water',false,.83);
   jar(11.5,6.4,7.25,.9,2.5,'honey');for(const [x,y,h] of [[10.95,6.4,16],[11.7,6.7,17.4],[12,6.15,15.1]]){
     beam([11.5,6.4,9.5],[x,y,h-1.8],.61,'oak');beam([x,y,h-1.8],[x+.12,y,h],.93,'berry');}
   beam([4.1,5.63,7.55],[4.1,5.63,16.6],1.10,'brass');p.rope([[4.1,5.63,16.6],[4.55,5.92,17.45],[5.4,6.65,17.45],[5.6,6.95,16.08]],'brass',.94);
   beam([3.4,5.68,14.92],[4.85,5.68,14.92],.69,'berry');p.rim(7.04,7.68,11.6,2.16,1.54,'glass',.4,2.5);
   for(const [j,mat] of ['berry','indigo','leaf'].entries())stroke([[4.4+j*1.07,11.88,6.95],[4.7+j*1.07,11.88,5.95-j*.42]],mat,15);
   break;
 }
 case 'pawStamp': {
   plankTable(3.2,3.6,10.2,8.9,8,'honey');block(4.1,5.3,10.2,5.2,4.4,.65,'linen');
   if(phase)art((u,v)=>[4.65+u,9.25-v,11],3.8,3.45,'paw',['berry','berry','clay']);
   block(10.2,6.1,10.3,2.4,3.15,.9,'bark');block(10.45,6.3,11.2,1.92,2.76,.4,'berry');
   lathe(9.2,4.9,10.3,[[0,1.34],[1.4,1.3],[2.4,.52],[4.4,.43],[5.2,.9],[6.4,.68]],'bark',8);
   // Small brass guide above the inking pad, with a lever and wooden handle.
   for(const xx of [10.05,12.74])beam([xx,6.22,10.29],[xx,6.22,15.16],.73,'iron');
   beam([9.8,6.22,15.1],[13.0,6.22,15.1],.8,'iron');beam([11.41,6.22,13.21],[11.41,6.22,16.22],.73,'brass');
   beam([10.58,6.22,15.95],[12.49,7.17,17.2],.68,'brass');ball(12.62,7.3,17.35,.49,.44,.75,'berry');
   for(let j=0;j<3;j++)stroke([[4.5+j*1.56,9.85,11.0],[4.99+j*1.56,9.85,11.0]],'clay',15);
   break;
 }
 case 'rainHarp': {
   const stones=[[3.3,8,2.4],[6,4.7,2.05],[11,5.3,2.1],[12.3,9.5,2.2],[8.8,11.8,2.36],[5.2,11.3,1.64]];
   for(const [x,y,r] of stones)ball(x,y,1.25,r,r*.73,r,'slate');
   lathe(7.7,8.6,0,[[0,3.5],[1.5,3.7]],'water',12,'water');pot(7.2,8.6,1.4,2.2,3.4,'clay');
   lathe(7.2,8.6,4.9,[[0,.43],[.12,.46]],'ink');beam([4.1,4.8,1.5],[4.7,5.6,16.4],1.5,'moss');
   beam([4.65,5.5,14.7],[7.3,8.1,12.3],1.8,'moss');tuft(4.3,5.1,2.7,.73);
   if(phase){for(const z of [7.1,10])ball(7.3,8.18,z,.32,.32,.75,'aqua');}
   for(const [xx,yy,hh] of [[3.65,5.1,8.76],[4.8,4.0,11.45],[5.88,4.51,8.9]]){
    beam([xx,yy,1.0],[xx,yy,hh],1.30,'moss',8);p.rim(xx,yy,hh,.56,.5,'pale');
    for(const zz of [3.0,6.25])p.rim(xx,yy,zz,.64,.61,'pine');
   }
   p.rim(7.4,8.66,1.68,2.95,1.64,'glass',0,2.85);p.blade(11.26,7.32,1.1,2.4,-.35,4.56,.73);
   break;
 }
 case 'umbrellaHut': {
   // A flared parasol itself is the loan counter's roof.
   peg(13,12,29,'oak',1);const cx=13,cy=12,peak=31,rad=9.9;
   const at=(i,r,z)=>[cx+Math.cos(i*tau/12)*r,cy+Math.sin(i*tau/12)*r,z];
   for(let i=0;i<12;i++){const c=i%2?'teal':'aqua';face([at(i,0,peak),at(i,rad*.7,peak-4),at(i+1,rad*.7,peak-4)],c,16+i%3,'weave');
     face([at(i,rad*.7,peak-4),at(i,rad,peak-9),at(i+1,rad,peak-9),at(i+1,rad*.7,peak-4)],c,14+i%3,'weave',true);}
   ball(cx,cy,31.6,.63,.63,1.2,'brass');plankTable(6.2,13.8,14.4,5.8,8);
   block(21.5,17,0,5.9,7.3,4,'oak');for(let i=0;i<(phase?1:3);i++){
     const x=23+(i%2)*2.9,y=18.7+(i>>1)*3.6;beam([x,y,2],[x,y,15.3],.8,'honey');
     lathe(x,y,5,[[0,.4],[7.7,1.8],[10.1,.25]],['berry','moss','gold'][i],7);rope([[x,y,15],[x,y,17],[x+.65,y,17.5],[x+1,y,16.7]],'oak',.64);}
   sign(9,24.4,6.4,6.7,6.2,'flower','teal');
   for(let i=0;i<12;i++){
    stroke([at(i,1.0,peak-.3),at(i,rad*.7,peak-3.65),at(i,rad,peak-8.55)],i%2?'pale':'teal',18);
    ball(...at(i,rad,peak-9.47),.35,.34,.61,'brass');
   }
   p.pennant(12.15,20.0,10,5.1,6.85,'aqua');p.scroll(16.9,19.9,5.0,3.3,3.95);
   for(const xx of [7.35,10.05])p.spool(xx,16.73,10.3,.91,3.43,xx<8?'blue':'berry');
   break;
 }
 case 'leafGutter': {
   for(let i=0;i<4;i++){
     const x=4.3+i*7.4,y=7.5+(i%2)*1.7,z=20.8-i*4.5;
     peg(x-1.2,y,z-1.8,'bark',.57);
     const a=[x-2.7,y,z],m=[x,y,z-.95],tip=[x+3.65,y+.85,z-2];
     face([a,[x-.2,y-2.2,z+2.2],tip,m],'leaf',18,'',true);face([a,m,tip,[x-.3,y+2.3,z+1.7]],'moss',13,'',true);
     stroke([a,m,tip],'pine',10);if(phase&&i<3)ball(x+3.65,y+.82,z-3,.32,.32,.65,'aqua');
   }
   for(let i=0;i<4;i++){const xx=4.3+i*7.4,yy=7.5+(i%2)*1.7,zz=20.8-i*4.5;
    for(const sign of [-1,1])for(let j=0;j<3;j++){const dx=-1.4+j*1.05;
     stroke([[xx+dx,yy+.15,zz-.6-dx*.19],[xx+dx+.70,yy+sign*(1.43-j*.23),zz+.57-dx*.23]],'leaf',20);}
    p.rim(xx-1.2,yy,zz-4.36,.67,.67,'honey');
   }
   p.flower(28.05,9.21,.1,.61,'cream');
   break;
 }
 case 'mossPath': {
   for(let i=0;i<5;i++){
     const x=2.45+i*2.7,y=6.7+Math.sin(i*1.4)*2.7,r=1.85+i%2*.6;
     lathe(x,y,0,[[0,r*.76],[1.1,r],[1.65,r*.84]],'slate',8,'speckle',false,.77);
     for(let j=0;j<4;j++){const a=j*2.33+i;ball(x+Math.cos(a)*r*.68,y+Math.sin(a)*r*.52,1.75,.7,.46,.48,phase?'aqua':'moss');}
   }tuft(9.9,8.8,0,.44);
   for(const [xx,yy,ss] of [[3,5.0,.63],[8.7,9.05,.77],[12.55,5.47,.58]]){
    for(const [dx,dy,h] of [[-.61,0,2],[.32,.40,3.47],[.8,-.39,2.5]]){
     const X=xx+dx,Y=yy+dy;beam([X,Y,.6],[X+.15,Y,h*ss+1],.49,'pine');
     ball(X+.15,Y,h*ss+1.15,.51,.52,.64,phase?'aqua':'leaf');}
    p.blade(xx,yy,1.4,-1.05,.46,1.73,.45);
   }
   break;
 }
 case 'nightHide': {
   for(const x of [7,21])for(const y of [5.8,19.2]){block(x,y,0,1.8,1.8,10,'bark');beam([x,y,3],[x+1.3,y+1,9],1.1,'oak');}
   block(4.8,4.1,8,20.7,18.4,2.3,'oak');cottage(6.2,5,16,14,18,11,'indigo',{z:10.2,door:.10});
   for(const x of [12,16])beam([x,24.7,.6],[x,21.2,10.4],1.2,'honey');
   for(let i=0;i<5;i++)beam([12,24.6-.64*i,1.2+i*1.88],[16,24.6-.64*i,1.2+i*1.88],1,'oak');
   telescope(23.1,18.6,10.2,.89);p.easel(23.7,25.6,0,5.1,8.7,k.item?.picture!=null?['moon','sky','star'][Math.abs(k.item.picture)%3]:'moon',['indigo','cream','gold']);
   lantern(6.9,21.1,10.3,.64);
   p.framed(10.8,19.83,27.8,6.45,7.48,'moon');p.pennant(6.0,21.3,21.9,3.55,6.6,'indigo');
   p.rim(22.95,18.72,17.55,1.68,1.28,'brass');p.scroll(17.1,22.56,10.45,3.7,6.55);
   const pole=[13.9,8.7];beam([...pole,38.9],[...pole,46.3],.8,'brass');ball(...pole,46.51,.48,.48,.72,'brass');
   face([[10.8,8.73,44.4],[13.7,8.73,44.4],[13.7,8.73,45.3],[16.8,8.73,44.1],[13.7,8.73,42.8],[13.7,8.73,43.8],[10.8,8.73,43.8]],'gold',17);
   break;
 }
 case 'spiritChime': {
   peg(5,7,27,'bark',.86);beam([5,7,16],[6.5,7.6,22],2.2,'bark');beam([5.7,7.3,23.5],[25.9,8,26.4],1.4,'oak');
   for(const [i,x] of [9.5,16.3,22.8].entries()){
     const z=19.1+(i%2)*2.1;beam([x,7.8,24.3+i*.7],[x,7.8,z],.55,'brass');
     lathe(x,7.8,z-4.7,[[0,1.67],[1,1.77],[3.8,1.05],[4.7,.36]],phase?'brass':['teal','plum','aqua'][i],8);ball(x,7.8,z-5,.35,.35,.71,'brass');
     panel(x-.65,7.8,z-10.1,1.3,4,'linen');
   }tuft(5.5,7.9,0,.63);
   for(const [i,xx] of [9.5,16.3,22.8].entries()){
    const zz=19.1+i%2*2.1,yy=7.8;
    p.rim(xx,yy,zz-3.72,1.72,1.72,'gold');p.rim(xx,yy,zz-2.6,1.45,1.45,'brass');
    for(let j=0;j<3;j++)stroke([[xx-.38,yy+.19,zz-7.75-j*.65],[xx+.33-j*.09,yy+.19,zz-7.97-j*.65]],i%2?'teal':'berry',13);
    p.rope([[xx,yy,zz+.56],[xx-.77,yy,zz+1.64],[xx,yy,zz+2.3],[xx+.77,yy,zz+1.64],[xx,yy,zz+.56]],'berry',.46);
   }
   break;
 }
 case 'townBulletin': {
   for(const x of [3.2,12.2])block(x,6.1,0,1.25,1.4,21.5,'bark');
   block(2.9,6.2,7.2,10.6,1.2,12.7,'oak');gable(2.1,5,19.7,12,3.3,3.4,'pine');
   for(const [x,z,w,h] of [[4,11,3.6,6.7],[8.1,10.9,4.4,3.1],[8.9,14.8,3.6,3.1]]){
     const a=panel(x,7.59,z,w,h,'pale');for(let n=1;n<3;n++)stroke([a(.5,h*n/3),a(w-.7,h*n/3)],'bark',11);}
   block(2.8,7.3,6.9,11.2,2.2,1.2,'honey');tuft(12,8.8,0,.47,true);
   p.framed(4.2,7.83,10.84,3.16,6.84,'landscape');p.scroll(8.24,7.88,10.2,3.75,4.1);
   for(const [xx,zz] of [[4.56,17.84],[8.42,18.25],[11.77,18.25]])ball(xx,7.84,zz,.28,.23,.48,'brass');
   p.lantern(12.8,8.2,12.0,.46);p.flower(4.2,8.48,.15,.57,'pink');
   break;
 }
 case 'teaRoom': {
   cottage(4.1,5.7,22.2,15,20.3,9.6,'pine',{door:.12});
   block(4.3,20.5,0,22.1,5.9,3.2,'oak');canopy(4.1,18.8,18,22.3,5.1,'moss','moss',1.5);
   for(let i=0;i<3;i++)cloth(7.7+i*2.9,23.93,11.5,2.85,6.2,'teal',i===1?'cup':'sprig');
   plankTable(16.9,25.3,7,3.4,4);ware(19,26.9,6.2,.95,'cream','teal');jar(22,26.9,6.2,.82,2.1,'teal');basket(6.6,27.2,0,1.9,'',false);
   p.framed(11.1,21.4,20.1,6.0,6.85,'tea');p.flowers(22.0,21.6,3.24,3.65,'pink');
   lathe(20.9,24.75,6.25,[[0,.75],[.65,1.2],[2.13,1.33],[2.97,.91],[3.23,.66]],'teal',10);
   ball(20.85,24.75,9.73,.32,.32,.55,'brass');beam([21.91,24.79,7.68],[22.85,24.82,8.92],.82,'teal');
   p.rope([[19.96,24.8,8.48],[19.13,24.8,8.63],[18.98,24.8,7.45],[19.86,24.8,7.1]],'brass',.44);
   break;
 }
 case 'meetStump': {
   for(let i=0;i<5;i++){
     const a=i*tau/5+.4;beam([7.5+Math.cos(a)*1.6,7.8+Math.sin(a)*1.6,3.8],[7.5+Math.cos(a)*5,7.8+Math.sin(a)*4.6,.6],2,'bark');}
   lathe(7.5,7.8,0,[[0,4],[1.7,3.8],[6.9,3.25],[8.2,3.4]],'bark',11,'wood');
   for(const [r,c] of [[3.12,'honey'],[2.5,'oak'],[2.1,'honey'],[1.2,'oak'],[.82,'pale']])lathe(7.5,7.8,8.29+(3.2-r)*.05,[[0,r],[.03,r]],c,11,'',false,.96);
   beam([9,7.1,6.6],[11.5,6,11.3],2.2,'bark');tuft(11.4,5.9,11,.53);tuft(4.4,9.5,0,.62,true);
   p.rim(7.3,7.7,8.49,2.73,2.32,'honey',.5,4.35);stroke([[6.25,7.17,8.58],[5.45,6.46,8.56],[4.72,6.21,8.48]],'bark',9);
   for(const [xx,yy,s] of [[5.6,10.3,.72],[4.8,10.89,.49],[10.12,10.2,.55]]){
    beam([xx,yy,.4],[xx,yy,1.9*s+.64],.73*s,'linen');lathe(xx,yy,1.9*s+.62,[[0,1.19*s],[.47*s,1.24*s],[1.37*s,.58*s],[1.50*s,.28*s]],'brick',8);
    ball(xx+.41*s,yy+.52*s,2.14*s+.72,.24*s,.21*s,.32*s,'cream');}
   p.blade(10.52,5.95,9.76,1.17,-.71,1.54,.53);
   break;
 }
 case 'breadMarket': {
   canopy(4.4,6.4,25.2,22.1,14.6,'tile','cream',3.8);
   plankTable(5.3,18.2,20.7,7.9,9.9);cloth(7.1,26.21,4.3,16.7,5.9,'tile','grain');
   for(let i=0;i<3;i++){const x=8+i*6.1;block(x-1.9,19.6,12.1,4.65,5.6,.7,'pale');for(let j=0;j<3;j++)loaf(x+.5,20.6+j*1.55,12.9,.8,i===2);}
   basket(6.3,25.4,0,2.05,'honey');sign(25.3,24.1,4.8,5.15,5.8,'grain','bark');
   p.easelSign(23.7,26.27,0,5.24,10.55,'bread');p.framed(11.4,21.36,19.83,6.95,6.53,'bread');
   for(const xx of [8.2,14.8,20.9]){p.rim(xx+.28,22.3,12.95,2.09,1.85,'honey');block(xx-.9,25.0,12.48,2.2,1.05,1.85,'linen');}
   for(const [xx,yy] of [[8.45,25.28],[14.65,25.28],[20.88,25.28]])stroke([[xx-.55,yy+.85,13.62],[xx+.45,yy+.85,13.62]],'bark',9);
   p.spool(6.25,13.25,.3,1.3,4.3,'linen');
   break;
 }
 case 'grainMill': {
   lathe(8.7,7.6,0,[[0,3.9],[2,4.2],[3,3.4],[17,2.65]],'plaster',9,'stone');
   lathe(8.7,7.6,16.2,[[0,4],[1.8,4],[8.1,.38]],'tile',9);
   const hub=[8.8,12.17,19.4];for(let i=0;i<4;i++){
     const a=(i+phase/4)*Math.PI/2+.25;
     const at=(len,wide)=>[hub[0]+Math.cos(a)*len-Math.sin(a)*wide,hub[1]+.17,hub[2]+(Math.sin(a)*len+Math.cos(a)*wide)*2.1];
     beam(at(0,0),at(6.2,0),1.5,'bark');
     face([at(2,.15),at(6.15,.15),at(6.15,1.85),at(2,1.48)],'pale',18,'weave',true);
     for(const n of [3,4.3,5.6])stroke([at(n,0),at(n,1.6)],'bark',8);
   }ball(...hub,.77,.77,1.1,'brass');sack(11.4,10.5,0,.55);
   for(let i=0;i<4;i++){const a=(i+phase/4)*Math.PI/2+.25;
    const at=(d,s)=>[hub[0]+Math.cos(a)*d-Math.sin(a)*s,hub[1]+.42,hub[2]+(Math.sin(a)*d+Math.cos(a)*s)*2.1];
    stroke([at(2,.80),at(6.1,1.06)],'honey',16);stroke([at(2,.18),at(6.12,1.68)],'oak',12);}
   lathe(8.7,7.6,3.4,[[0,3.48],[.83,3.44]],'oak',9);
   p.brackets(7.52,10.72,4.35,2.83,5.82);p.blade(5.24,7.22,.34,-.86,.27,3.86,.47);
   break;
 }
 case 'breadShelf': {
   for(const x of [3.7,27.3])block(x,5.3,0,1.25,4.4,19.8,'oak');
   block(4.4,5.36,7.7,23.6,1,10,'plaster','speckle');for(const x of [6,14.2,21.75])opening(x,6.4,9,4.25,7.6);
   for(const z of [4.4,11.3])block(3.4,5.4,z,26.1,6.3,1.4,'oak');
   for(const [i,x] of [7.2,14.2,21.5,25.7].entries()){if(phase)loaf(x,9.4,12.65,.77,i%2===0);else basket(x,9,6,1.38,'',false);}
   for(const zz of [5.95,12.87]){for(let i=0;i<8;i++)beam([5.3+i*3.04,8.05,zz],[5.3+i*3.04,10.64,zz],.37,'slate',4);
    for(const yy of [8.05,10.64])beam([4.85,yy,zz],[26.95,yy,zz],.43,'iron',4);}
   p.pennant(4.36,6.82,20.25,4.6,6.2,'tile');p.pennant(22.99,6.82,20.25,4.59,6.2,'tile');
   p.brackets(3.67,11.78,4.65,24.8,8.3);p.jar(26.34,9.11,5.96,.94,2.95,'pale');
   break;
 }
 case 'laundry': {
   for(const x of [7.8,19.1]){
     lathe(x,19.4,0,[[0,4.7],[2,5],[6.3,5.4]],'stone',10,'stone',true,.71);
     lathe(x,19.4,6.3,[[0,4.6],[.16,4.65]],'water',12,'water',false,.72);
     face([[x-1.7,18.8,5.3],[x+1.5,18.8,5.3],[x+1.5,16,10.7],[x-1.7,16,10.7]],'honey',17,'wood',true);
   }
   peg(4.4,6,23,'oak');peg(26.6,7,23,'oak');const pos=drape([4.4,6,22],[26.6,7,22],2.8);
   if(!phase)for(let i=0;i<3;i++){const [x,y,z]=pos(.22+i*.27);cloth(x-1.7,y,z-5,3.8,5,['linen','blue','pale'][i],'sprig');}
   basket(26.4,21.8,0,2.32,'',true);if(phase)book(25,20.5,4.5,3.2,2.4,'linen');
   for(const xx of [5.15,10.03]){block(xx,22.0,.32,.65,2.0,11.1,'oak');}
   for(const zz of [7.9,9.8])beam([5.38,22.95,zz],[10.21,22.95,zz],1.55,'honey',9);
   p.rope([[10.25,22.95,9.76],[11.22,22.95,9.76],[11.22,22.7,11.55],[12.06,22.7,11.55]],'iron',.6);
   for(const xx of [7.8,19.1])for(let i=0;i<4;i++)stroke([[xx-1.38,18.3-i*.48,6.69+i*.92],[xx+1.19,18.3-i*.48,6.69+i*.92]],'pale',19);
   p.spool(25.44,16.94,0,1.26,3.7,'linen');
   break;
 }
 case 'catLedge': {
   for(const x of [4.8,25]){block(x,5.3,0,1.35,2.2,17,'bark');beam([x+.6,9.6,14.8],[x+.6,6.3,8.2],1.45,'oak');}
   block(3.1,5.2,14.1,25.5,5.4,1.7,'oak');block(4,4.7,14.4,23.9,1,9.2,'plaster','speckle');
   for(const x of [5.4,14.9])opening(x,5.8,17.4,7.9,5.3);
   ball(17.3,8.7,17.1,4.65,1.58,1.65,'plum');ball(10.8,8.7,17.4,.7,.72,1.33,'honey');
   rope([[23.6,9.2,16.3],[25,10.4,14.4],[24.8,11.1,11.2]],'pale',.62);
   p.rim(17.3,8.72,17.29,4.6,1.5,'pink');for(const xx of [15.05,17.32,19.55])ball(xx,8.8,18.7,.24,.28,.28,'brass');
   ball(24.8,11.1,10.19,.95,.87,1.27,'berry');p.rim(24.8,11.1,10.17,.93,.84,'pale');
   p.flowers(4.5,7.45,15.9,3.80,'pink');p.brackets(3.63,10.7,13.85,24.8,2.64);
   break;
 }
 case 'starLine': {
   for(const x of [3.1,28.7]){block(x-1.25,6.4,0,2.5,3.1,1.5,'stone','stone');peg(x,7.7,24,'honey',.62);}
   const pos=drape([3.1,7.7,23.4],[28.7,7.7,23.4],3);
   for(const [i,t] of [.22,.49,.76].entries()){const [x,y,z]=pos(t),yy=y+.37*Math.sin(phase*Math.PI/2+i);
     cloth(x-2.23,yy,z-7.8,4.5,7.6,['indigo','linen','blue'][i],'star');
     for(const dx of [-1.6,1.65])beam([x+dx,yy,z-.6],[x+dx,yy,z+1],.66,'oak');}
   for(const [i,t] of [.22,.49,.76].entries()){const [xx,yy,zz]=pos(t),y2=yy+.38*Math.sin(phase*Math.PI/2+i)+.19;
    stroke([[xx-1.84,y2,zz-6.6],[xx-1.2,y2,zz-5.87],[xx-.45,y2,zz-6.65],[xx+.35,y2,zz-5.90],[xx+1.27,y2,zz-6.7],[xx+1.88,y2,zz-6.1]],i===1?'blue':'gold',19);
    for(const dx of [-1.4,0,1.4])beam([xx+dx,y2,zz-7.72],[xx+dx+.12,y2,zz-9.0+(dx?0:.4)],.45,'honey');}
   p.spool(4.1,7.32,.15,1.28,4.0,'indigo');
   break;
 }
 default:throw Error('Missing middle town drawing '+type);
 }
}
