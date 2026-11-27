function middleVillage(type,k,p){
 const {phase,block,ball,beam,lathe,panel,stroke,face,crate,barrel,pot,tuft,planter,gable,opening,cottage,plankTable,canopy}=k;
 const {art,plaque,jar,ware,sack,book,basket,loaf,wheel,lantern,crystal,rope,drape,chair,telescope,easel,peg,bird,cloth,sign}=p;
 switch(type){
 case 'returnBell': {
   for(const x of [3.1,12.7]){block(x-1,7,0,2.2,3.8,1.8,'stone','stone');block(x-.47,8.3,1.6,1.18,1.55,24,'bark');}
   block(2,8,24.3,12,2,2.3,'oak');beam([3.7,8.8,18.7],[6,8.8,24.7],1.6,'honey');beam([12.7,8.8,18.7],[10.4,8.8,24.7],1.6,'honey');
   const x=8+phase*.35;rope([[8,8.85,25],[x,8.85,20]],'iron',.85);
   lathe(x,8.85,10.8,[[0,3.35],[1.3,3.4],[2.7,2.5],[6.6,2.05],[8.4,1.3],[9,.55]],'brass',12,'',true);
   ball(x,8.85,10.1,.65,.65,1.55,'iron');rope([[x+2.5,9.5,13.4],[x+3.3,10.3,9],[x+2.8,10.7,5.3]],'pale',.7);break;
 }
 case 'shoeRepair': {
   // Open cobbler's bench under a short pent roof, with a last and the pair being mended.
   block(4.5,6,0,22.7,16.7,1.25,'oak','planks');
   for(const x of [6,25])peg(x,7,25,'oak');block(5.9,6.8,8.5,19.7,1.1,13.9,'oak','wood');
   gable(3.6,4.7,23,23.8,7.5,5.7,'tile');plankTable(6.5,12.2,18.2,7.6,10.1);
   for(const [x,y] of [[12,16],[15.9,15.6]]){block(x-1.1,y-1,12.4,2.4,2.3,4.2,'bark');ball(x+.93,y,13.3,1.95,1.22,1.75,'oak');}
   beam([18,16.7,12.7],[21.7,15.1,13.2],1.0,'honey');beam([21.1,14.7,13.1],[22.2,15.9,13.4],1.55,'iron');
   chair(8.2,22.4,0,.85);barrel(24.9,23,0,1.9,5.5);p.sign(26,11,12,4.6,5,'paw','clay');break;
 }
 case 'windSock': {
   lathe(5,8,0,[[0,2.1],[1.4,2.35],[2.7,1.56]],'stone',7);
   peg(5,8,32,'honey',.62);ball(5,8,32.5,.55,.55,1,'brass');
   const centers=Array.from({length:6},(_,i)=>[5.2+i*1.7,8+Math.sin(i*.7+phase*Math.PI/2)*i*.22,28.7-i*.52+Math.sin(i*.9+phase)*.74]);
   const at=(i,j)=>{const [x,y,z]=centers[i],a=j*tau/8,r=2.0-i*.24;return [x,y+Math.cos(a)*r,z+Math.sin(a)*r*1.92];};
   for(let i=0;i<5;i++)for(let j=0;j<8;j++)face([at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1)],i%2?'cream':'berry',12+Math.round(4*Math.sin(j*tau/8)),'weave');
   for(const j of [0,4])rope([at(5,j),[15.1,centers[5][1]+(j?.45:-.45),centers[5][2]-1.5]],'berry',.7);
   break;
 }
 case 'amberShelf': {
   for(const x of [3.9,27.4])block(x,5,0,1.3,4.5,19.8,'bark');
   for(const z of [3.1,11.3])block(3.3,4.9,z,26.3,6.3,1.35,'oak');block(3.1,4.4,21,26.6,2,1.4,'honey');
   block(4.4,5.1,5,23.7,.65,11.8,'pine','wood');
   for(const [x,z,s] of [[6.7,4.55,1.31],[11.3,4.55,1.55],[21.8,4.55,1.35],[25.8,12.75,1.6],[8.4,12.75,1.61]]){
     lathe(x,9.3,z,[[0,s*1.3],[.6,s*1.2]],'bark',8);crystal(x,9.3,z+.7,s,s*3.75,'gold');
   }
   for(const x of [7,17,24])panel(x-1.15,10.2,8.1,2.4,1.8,'pale');break;
 }
 case 'specimenHut': {
   cottage(3.8,5.1,19.5,17.9,24,12.8,'moss',{door:.10});
   canopy(18.5,14,19,9.5,9.2,'pale','pale',1.5);
   easel(23,23.9,0,7.2,14.1,'feather',['oak','leaf','cream']);
   easel(12.6,26.5,0,5.7,10.4,'sprig',['bark','pine','moss']);planter(4.8,24,0,.95);
   for(const y of [8.1,11.5]){pot(26,y,0,1.62,3.8);tuft(26,y,3.8,.73);}break;
 }
 case 'openGallery': {
   for(const x of [6,24,42])peg(x,7.6,28,'oak',.75);
   const cable=drape([6,7.6,26.5],[42,7.6,26.5],3.5);
   for(let i=0;i<7;i++){const [x,y,z]=cable((i+.6)/7);face([[x-1.45,y,z],[x+1.45,y,z],[x,y,z-4.6]],['berry','moss','gold','teal'][i%4],16,'weave',true);}
   for(const [i,x] of [10,24,37].entries())easel(x,16+(i%2)*4,0,9.2,20,['peak','frame','flower'][(i+phase+Math.abs(k.item?.picture||0))%3],[['pine','moss','cream'],['bark','blue','linen'],['pine','pink','gold']][i]);
   plankTable(7,31,13,5,6.3);for(const x of [8.9,12.5,16.2])jar(x,33,8.5,1.1,3.4,x<10?'berry':x<14?'indigo':'moss');
   chair(27,32,0,1.25);planter(41,32,0,1.35);plaque(7,32.6,9,5.5,4.1,'frame',['bark','moss','gold'],'pale');break;
 }
 case 'paintSink': {
   plankTable(2.9,4.1,10.2,7.7,5.2);
   lathe(7,7.7,7.25,[[0,2.5],[3.4,3.2],[4.2,3.35]],'slate',12,'',true,.83);
   lathe(7,7.7,11.45,[[0,2.74],[.12,2.71]],['teal','berry','blue','plum'][phase%4],12,'water',false,.83);
   jar(11.5,6.4,7.25,.9,2.5,'honey');for(const [x,y,h] of [[10.95,6.4,16],[11.7,6.7,17.4],[12,6.15,15.1]]){
     beam([11.5,6.4,9.5],[x,y,h-1.8],.61,'oak');beam([x,y,h-1.8],[x+.12,y,h],.93,'berry');}break;
 }
 case 'pawStamp': {
   plankTable(3.2,3.6,10.2,8.9,8,'honey');block(4.1,5.3,10.2,5.2,4.4,.65,'linen');
   if(phase)art((u,v)=>[4.65+u,9.25-v,11],3.8,3.45,'paw',['berry','berry','clay']);
   block(10.2,6.1,10.3,2.4,3.15,.9,'bark');block(10.45,6.3,11.2,1.92,2.76,.4,'berry');
   lathe(9.2,4.9,10.3,[[0,1.34],[1.4,1.3],[2.4,.52],[4.4,.43],[5.2,.9],[6.4,.68]],'bark',8);break;
 }
 case 'rainHarp': {
   const stones=[[3.3,8,2.4],[6,4.7,2.05],[11,5.3,2.1],[12.3,9.5,2.2],[8.8,11.8,2.36],[5.2,11.3,1.64]];
   for(const [x,y,r] of stones)ball(x,y,1.25,r,r*.73,r,'slate');
   lathe(7.7,8.6,0,[[0,3.5],[1.5,3.7]],'water',12,'water');pot(7.2,8.6,1.4,2.2,3.4,'clay');
   lathe(7.2,8.6,4.9,[[0,.43],[.12,.46]],'ink');beam([4.1,4.8,1.5],[4.7,5.6,16.4],1.5,'moss');
   beam([4.65,5.5,14.7],[7.3,8.1,12.3],1.8,'moss');tuft(4.3,5.1,2.7,.73);
   if(phase){for(const z of [7.1,10])ball(7.3,8.18,z,.32,.32,.75,'aqua');}break;
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
   sign(9,24.4,6.4,6.7,6.2,'flower','teal');break;
 }
 case 'leafGutter': {
   for(let i=0;i<4;i++){
     const x=4.3+i*7.4,y=7.5+(i%2)*1.7,z=20.8-i*4.5;
     peg(x-1.2,y,z-1.8,'bark',.57);
     const a=[x-2.7,y,z],m=[x,y,z-.95],tip=[x+3.65,y+.85,z-2];
     face([a,[x-.2,y-2.2,z+2.2],tip,m],'leaf',18,'',true);face([a,m,tip,[x-.3,y+2.3,z+1.7]],'moss',13,'',true);
     stroke([a,m,tip],'pine',10);if(phase&&i<3)ball(x+3.65,y+.82,z-3,.32,.32,.65,'aqua');
   }break;
 }
 case 'mossPath': {
   for(let i=0;i<5;i++){
     const x=2.45+i*2.7,y=6.7+Math.sin(i*1.4)*2.7,r=1.85+i%2*.6;
     lathe(x,y,0,[[0,r*.76],[1.1,r],[1.65,r*.84]],'slate',8,'speckle',false,.77);
     for(let j=0;j<4;j++){const a=j*2.33+i;ball(x+Math.cos(a)*r*.68,y+Math.sin(a)*r*.52,1.75,.7,.46,.48,phase?'aqua':'moss');}
   }tuft(9.9,8.8,0,.44);break;
 }
 case 'nightHide': {
   for(const x of [7,21])for(const y of [5.8,19.2]){block(x,y,0,1.8,1.8,10,'bark');beam([x,y,3],[x+1.3,y+1,9],1.1,'oak');}
   block(4.8,4.1,8,20.7,18.4,2.3,'oak');cottage(6.2,5,16,14,18,11,'indigo',{z:10.2,door:.10});
   for(const x of [12,16])beam([x,24.7,.6],[x,21.2,10.4],1.2,'honey');
   for(let i=0;i<5;i++)beam([12,24.6-.64*i,1.2+i*1.88],[16,24.6-.64*i,1.2+i*1.88],1,'oak');
   telescope(23.1,18.6,10.2,.89);p.easel(23.7,25.6,0,5.1,8.7,k.item?.picture!=null?['moon','sky','star'][Math.abs(k.item.picture)%3]:'moon',['indigo','cream','gold']);
   lantern(6.9,21.1,10.3,.64);break;
 }
 case 'spiritChime': {
   peg(5,7,27,'bark',.86);beam([5,7,16],[6.5,7.6,22],2.2,'bark');beam([5.7,7.3,23.5],[25.9,8,26.4],1.4,'oak');
   for(const [i,x] of [9.5,16.3,22.8].entries()){
     const z=19.1+(i%2)*2.1;beam([x,7.8,24.3+i*.7],[x,7.8,z],.55,'brass');
     lathe(x,7.8,z-4.7,[[0,1.67],[1,1.77],[3.8,1.05],[4.7,.36]],phase?'brass':['teal','plum','aqua'][i],8);ball(x,7.8,z-5,.35,.35,.71,'brass');
     panel(x-.65,7.8,z-10.1,1.3,4,'linen');
   }tuft(5.5,7.9,0,.63);break;
 }
 case 'townBulletin': {
   for(const x of [3.2,12.2])block(x,6.1,0,1.25,1.4,21.5,'bark');
   block(2.9,6.2,7.2,10.6,1.2,12.7,'oak');gable(2.1,5,19.7,12,3.3,3.4,'pine');
   for(const [x,z,w,h] of [[4,11,3.6,6.7],[8.1,10.9,4.4,3.1],[8.9,14.8,3.6,3.1]]){
     const a=panel(x,7.59,z,w,h,'pale');for(let n=1;n<3;n++)stroke([a(.5,h*n/3),a(w-.7,h*n/3)],'bark',11);}
   block(2.8,7.3,6.9,11.2,2.2,1.2,'honey');tuft(12,8.8,0,.47,true);break;
 }
 case 'teaRoom': {
   cottage(4.1,5.7,22.2,15,20.3,9.6,'pine',{door:.12});
   block(4.3,20.5,0,22.1,5.9,3.2,'oak');canopy(4.1,18.8,18,22.3,5.1,'moss','moss',1.5);
   for(let i=0;i<3;i++)cloth(7.7+i*2.9,23.93,11.5,2.85,6.2,'teal',i===1?'cup':'sprig');
   plankTable(16.9,25.3,7,3.4,4);ware(19,26.9,6.2,.95,'cream','teal');jar(22,26.9,6.2,.82,2.1,'teal');basket(6.6,27.2,0,1.9,'',false);break;
 }
 case 'meetStump': {
   for(let i=0;i<5;i++){
     const a=i*tau/5+.4;beam([7.5+Math.cos(a)*1.6,7.8+Math.sin(a)*1.6,3.8],[7.5+Math.cos(a)*5,7.8+Math.sin(a)*4.6,.6],2,'bark');}
   lathe(7.5,7.8,0,[[0,4],[1.7,3.8],[6.9,3.25],[8.2,3.4]],'bark',11,'wood');
   for(const [r,c] of [[3.12,'honey'],[2.5,'oak'],[2.1,'honey'],[1.2,'oak'],[.82,'pale']])lathe(7.5,7.8,8.29+(3.2-r)*.05,[[0,r],[.03,r]],c,11,'',false,.96);
   beam([9,7.1,6.6],[11.5,6,11.3],2.2,'bark');tuft(11.4,5.9,11,.53);tuft(4.4,9.5,0,.62,true);break;
 }
 case 'breadMarket': {
   canopy(4.4,6.4,25.2,22.1,14.6,'tile','cream',3.8);
   plankTable(5.3,18.2,20.7,7.9,9.9);cloth(7.1,26.21,4.3,16.7,5.9,'tile','grain');
   for(let i=0;i<3;i++){const x=8+i*6.1;block(x-1.9,19.6,12.1,4.65,5.6,.7,'pale');for(let j=0;j<3;j++)loaf(x+.5,20.6+j*1.55,12.9,.8,i===2);}
   basket(6.3,25.4,0,2.05,'honey');sign(25.3,24.1,4.8,5.15,5.8,'grain','bark');break;
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
   }ball(...hub,.77,.77,1.1,'brass');sack(11.4,10.5,0,.55);break;
 }
 case 'breadShelf': {
   for(const x of [3.7,27.3])block(x,5.3,0,1.25,4.4,19.8,'oak');
   block(4.4,5.36,7.7,23.6,1,10,'plaster','speckle');for(const x of [6,14.2,21.75])opening(x,6.4,9,4.25,7.6);
   for(const z of [4.4,11.3])block(3.4,5.4,z,26.1,6.3,1.4,'oak');
   for(const [i,x] of [7.2,14.2,21.5,25.7].entries()){if(phase)loaf(x,9.4,12.65,.77,i%2===0);else basket(x,9,6,1.38,'',false);}
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
   basket(26.4,21.8,0,2.32,'',true);if(phase)book(25,20.5,4.5,3.2,2.4,'linen');break;
 }
 case 'catLedge': {
   for(const x of [4.8,25]){block(x,5.3,0,1.35,2.2,17,'bark');beam([x+.6,9.6,14.8],[x+.6,6.3,8.2],1.45,'oak');}
   block(3.1,5.2,14.1,25.5,5.4,1.7,'oak');block(4,4.7,14.4,23.9,1,9.2,'plaster','speckle');
   for(const x of [5.4,14.9])opening(x,5.8,17.4,7.9,5.3);
   ball(17.3,8.7,17.1,4.65,1.58,1.65,'plum');ball(10.8,8.7,17.4,.7,.72,1.33,'honey');
   rope([[23.6,9.2,16.3],[25,10.4,14.4],[24.8,11.1,11.2]],'pale',.62);break;
 }
 case 'starLine': {
   for(const x of [3.1,28.7]){block(x-1.25,6.4,0,2.5,3.1,1.5,'stone','stone');peg(x,7.7,24,'honey',.62);}
   const pos=drape([3.1,7.7,23.4],[28.7,7.7,23.4],3);
   for(const [i,t] of [.22,.49,.76].entries()){const [x,y,z]=pos(t),yy=y+.37*Math.sin(phase*Math.PI/2+i);
     cloth(x-2.23,yy,z-7.8,4.5,7.6,['indigo','linen','blue'][i],'star');
     for(const dx of [-1.6,1.65])beam([x+dx,yy,z-.6],[x+dx,yy,z+1],.66,'oak');}break;
 }
 default:throw Error('Missing middle town drawing '+type);
 }
}
