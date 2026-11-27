function highVillage(type,k,p){
 const {phase,block,ball,beam,lathe,panel,stroke,face,crate,barrel,pot,tuft,planter,gable,opening,cottage,plankTable,canopy}=k;
 const {art,plaque,jar,ware,sack,book,basket,loaf,wheel,lantern,crystal,rope,drape,chair,telescope,easel,peg,bird,cloth,sign}=p;
 switch(type){
 case 'pantryDiner': {
   cottage(3.3,3.7,19.8,17.6,23,12.5,'tile',{chimney:true,door:.12});
   // A round masonry range, separate flue and serving hatch identify the kitchen.
   lathe(24,12.1,0,[[0,4.1],[2,4.4],[8,4.15],[10,3.58]],'slate',10,'stone');
   pot(24,12.1,10,3.25,5.5,'iron');lathe(24,12.1,15.5,[[0,2.48],[.2,2.48]],'berry');
   canopy(9.6,18.9,18,14.2,6.2,'tile','pale',2.4);
   plankTable(9.7,22.3,14.3,4,6.3);for(const x of [12.2,16.5,20.8])ware(x,24.2,8.55,1.25,'cream','clay');sack(26.5,20.8,0,.82);break;
 }
 case 'scarecrow': {
   const coat=['teal','moss','clay','indigo'][phase%4];
   peg(8,8,25,'bark',.65);beam([3,8,19],[13.1,8.2,18.2],1.05,'oak');
   face([[4.1,8.2,19.6],[7,8.2,21],[9.4,8.2,20.8],[12.1,8.3,19],[11.5,8.3,15.8],[10,8.3,16.8],[10.1,8.3,10.4],[6.4,8.3,11.5],[6.7,8.3,16.6],[4.5,8.3,15.8]],coat,16,'weave',true);
   ball(8,8.1,24,1.81,1.5,3.4,'pale');ball(7.5,9.2,24.5,.18,.26,.4,'ink');ball(8.8,9.2,24.4,.19,.24,.4,'ink');
   lathe(8,8.1,26.5,[[0,3.15],[1,3.05],[1.5,1.65],[4.4,1.4],[5.2,.85]],'honey',11,'wood');
   lathe(8,8.1,28.3,[[0,1.67],[.85,1.62]],coat);tuft(8.4,8.4,0,.66);break;
 }
 case 'pickingBaskets': {
   for(const [i,[x,y,r]] of [[4.9,6,2.75],[10.7,6.6,2.2],[8.5,11,2.65]].entries())
     basket(x,y,.2,r,i<phase?['berry','gold','leaf'][i]:'',i<2);
   beam([11.5,10,1.5],[13.9,12.4,4.9],1.05,'oak');break;
 }
 case 'postcards': {
   // Hinged display wings hold rows of individually framed views.
   canopy(4.4,5.8,24.9,21.4,13.4,'teal','cream',3.3);plankTable(5.2,13.6,20.2,7.6,8);
   block(6.2,13.8,10.1,17.9,1.5,8.5,'oak');for(let i=0;i<5;i++){
     const x=6.65+i*3.5;plaque(x,15.46,11.2,3.07,5.8,i%2?'peak':'frame',['pine',i%2?'blue':'teal','cream'],'linen');
     book(x,17.3,10.2,2.86,1.95,i%2?'teal':'berry');}
   easel(24.7,24,0,5.5,11.8,'peak',['indigo','blue','cream']);sack(6.5,24.1,0,.75);break;
 }
 case 'routeMap': {
   for(const x of [2.7,12.7])peg(x,7,22.2,'oak',.65);
   block(2.25,6.4,8.8,11.8,1.2,12.5,'bark');plaque(2.8,7.71,9.4,10.67,11.3,'map',['moss','teal','gold'],'pale');
   for(let i=0;i<phase;i++){const x=4.1+(i%5)*1.75,z=11.8+Math.floor(i/5)*2.6+(i%2)*.65;
     face([[x,7.97,z],[x,7.97,z+1.85],[x+.8,7.97,z+1.27]],'berry',17);}
   beam([2.2,6.8,21.6],[14.4,6.8,21.6],1.3,'honey');break;
 }
 case 'travelStamp': {
   lathe(8,8,0,[[0,3.9],[2,4.2],[3,3.35],[7.6,2.7],[9,3.3]],'stone',8,'stone');
   block(3.55,4.3,8.8,8.9,7.5,1.8,'bark');book(4.5,6,10.65,4.35,3.4,'teal');
   block(4.75,6.2,12.5,3.8,2.8,.28,'cream','');art((u,v)=>[5.3+u,8.7-v,12.95],2.3,1.9,'print',['bark','berry','tile']);
   lathe(10,7.3,10.65,[[0,1.48],[1.3,1.5],[1.9,.75],[3,.5],[4.8,.95],[6,.65]],'brass',8);
   rope([[10.7,7.4,14.6],[11.8,9.8,11.2],[12.3,10.7,8.8],[11.1,11,7.8]],'bark',.48);break;
 }
 case 'musicMaker': {
   cottage(3.8,4.8,18.1,17.8,25.6,14.4,'honey',{door:.1});block(20.6,9,0,6.7,11.3,11.4,'oak');gable(20,8.4,11.3,8,12.5,5.8,'moss');
   // Wooden marimba bars, stringed lute and the pipes each have their own silhouette.
   plankTable(11.3,23.3,12,4.55,6.1);for(let i=0;i<7;i++)block(11.9+i*1.5,24.25-i*.1,8.36,1.11,2.2+i*.26,.92,i%2?'oak':'honey');
   ball(25,23.1,4.1,2.1,1.1,3.6,'honey');beam([25,23,6.8],[25.9,22.9,15.1],1.2,'oak');ball(25,24,4.3,.45,.32,.88,'ink');
   for(let i=0;i<4;i++)beam([5.8+i*1.3,23.7,4.1],[5.8+i*1.3,23.7,9.5+i*2.5],1.45,'brass',7);
   plaque(11.9,22.9,17.8,4.2,5.8,'score',['bark','gold','cream'],'pine');break;
 }
 case 'birdScore': {
   for(const [x,y] of [[4.8,10.9],[11.4,10.5],[7.9,4.8]])beam([x,y,.35],[8.1,7.8,9],1.17,'bark');
   beam([8.1,7.8,7.3],[8.1,7.8,18.4],1.05,'brass');
   const at=(u,v)=>[3.8+u,9.5-v*.16,14.5+v];face([at(0,0),at(8.6,0),at(8.6,6.1),at(0,6.1)],'oak',13,'wood',true);
   const page=(u,v)=>[4.2+u,9.8-v*.16,15+v];face([page(0,0),page(7.8,0),page(7.8,5.15),page(0,5.15)],'linen',19);
   art(page,7.7,5,'score',['bark','ink','ink']);if(phase){bird(5.2,8.1,20.6,.67);bird(9.9,8.1,20.6,.61,'clay');}break;
 }
 case 'handOrgan': {
   for(const y of [4.7,11.3])wheel(14.6,y,5.5,2.14,'y','oak');
   block(6.7,5.3,5.2,15.9,5.8,9.6,'berry');block(6.25,4.9,14.7,16.8,6.6,1.5,'oak');
   block(7.2,5.3,16.1,14.9,1.55,7.6,'bark');
   for(let i=0;i<8;i++){const x=8.2+i*1.75;beam([x,8.2,16.2],[x,8.2,19.5+(7-i)*1.05],1.45,'brass',8);}
   plaque(8.2,11.26,7,12.5,6.4,'score',['oak','cream','gold'],'teal');
   rope([[22.7,8.3,11.7],[25.2,8.3,11.7],[25.2,8.3,15.5],[27.3,8.3,15.5]],'brass',1.1);break;
 }
 case 'freight': {
   cottage(3.8,4.8,27.2,21.5,27,13,'tile',{wall:'oak',door:.1,noFront:true});
   block(8.6,25.8,0,19.4,1.25,18.9,'bark');for(let i=0;i<2;i++){const x=9.2+i*9.1;block(x,27,1.2,8.45,.8,16.4,'oak','planks');beam([x+.4,27.9,2.5],[x+7.8,27.9,16.6],1.55,'honey',4);}
   block(4,28.1,0,35.9,10.2,3,'oak','planks');for(const [x,y,z,w,d,h] of [[6.4,29.8,3,6.7,5.2,7.9],[13.4,29.2,3,6.1,5.2,6.8],[8.6,29.9,11,5.4,4.4,5.3],[29,28.6,3,7.2,6.2,6.5]])crate(x,y,z,w,d,h);
   peg(37,11.6,28.6,'bark',1.2);beam([37,11.6,24],[32,17.4,31],2.5,'oak');wheel(32.2,17.5,30.3,1.76,'y','brass');rope([[32.3,17.7,28.1],[32.3,17.7,13.5]],'bark',.67);
   sack(25,33.4,3,.96);barrel(37.4,24,0,2.45,8.4);break;
 }
 case 'traderTent': {
   const a=[2.2,3.4,.6],b=[13.8,3.4,.6],c=[13.8,12.9,.6],d=[2.2,12.9,.6],rb=[8,4.25,17.9],rf=[8,11.85,17.9];
   face([a,b,rb],'plum',12,'weave',true);face([a,rb,rf,d],'plum',16,'weave',true);face([b,c,rf,rb],'berry',12,'weave',true);
   face([d,rf,[6.8,12.8,.8]],'berry',18,'weave',true);face([rf,c,[9.7,12.85,.8]],'plum',14,'weave',true);
   beam(rb,rf,1.05,'brass');for(const [x,y] of [[2.2,3.4],[13.8,3.4],[2.2,12.9],[13.8,12.9]])beam([x,y,2],[x+(x<8?-.85:.85),y+.25,0],.62,'pale');
   lantern(5.1,12.8,4.2,.55,!!phase);basket(10.8,12.8,0,1.11,'',false);break;
 }
 case 'rugShop': {
   canopy(4,5.9,26.5,22.6,14.5,'plum','berry',3.5);
   for(const [i,x] of [6,12.6,19.6].entries()){const c=['teal','berry','indigo','moss'][(phase+i)%4];cloth(x,13.5,7,5.7,14.4,c,['star','flower','sprig'][i]);
     beam([x+.15,20.9,2.7],[x+4.85,20.9,2.7],2.35,c,9);}
   for(let i=0;i<3;i++){const x=6.1+i*5.9;block(x,21.9,.15,5.1,5.7,.55,['teal','clay','plum'][(phase+i)%3],'weave');
     art((u,v)=>[x+.45+u,27.1-v,.95],4.2,4.6,i===1?'flower':'star',['pale','cream','gold']);}
   break;
 }
 case 'fishKeeper': {
   cottage(3.6,4.7,17.7,17,23.7,12.5,'teal',{door:.10});
   block(21.3,9.5,0,7.2,15,2.2,'oak','planks');for(const x of [15.1,24.4]){
     lathe(x,24.1,0,[[0,2.6],[5.9,3.15]],'oak',11,'wood',true);lathe(x,24.1,5.9,[[0,2.65],[.12,2.68]],'water',12,'water');
   }
   beam([21.5,9.2,.7],[24.8,13.4,18.8],1,'honey');wheel(25,13.6,19.5,2.1,'y','bark');
   for(let i=0;i<3;i++)stroke([[23.7+i*.83,13.65,16.4],[24.6+i*.35,13.65,13.5],[25.5,13.65,16.5]],'linen',13);
   sack(6.3,24.1,0,.81);plaque(13,22.1,16.5,4.8,5.4,'fish',['bark','aqua','cream'],'oak');break;
 }
 case 'pondWindow': {
   lathe(8,8,0,[[0,5.2],[1.5,5.45],[3.45,5.8]],'oak',12,'wood',true,.84);
   lathe(8,8,3.45,[[0,4.89],[.1,4.9]],'water',12,'water',false,.84);
   const x=7+Math.sin(phase*Math.PI/2)*1.45,y=8.4+Math.cos(phase*Math.PI/2)*.7;
   art((u,v)=>[x-1.6+u,y+1.2-v,3.68],3.8,2.1,'fish',['slate','teal','cream']);
   for(const dx of [-3.15,3.15])beam([8+dx,5.1,3.7],[8+dx,10.9,3.7],.67,'brass');tuft(12.5,6.4,.4,.53);break;
 }
 case 'shellChannel': {
   block(.12,5.7,.16,31.76,5.5,1.05,'slate','stone');block(.13,6.45,1.18,31.74,3.95,.22,'water','water',false);
   for(let i=0;i<8;i++)for(const y of [5.55,10.85]){
     const x=1.65+i*4.1;ball(x,y,.98,1.57,.55,1.05,i%2?'stone':'pale');}
   for(const [x,y,s] of [[4.6,5.65,1.3],[15.2,10.8,1],[24.3,5.6,1.15]]){
     ball(x,y,1.75,s,s*.65,s*.72,'pink');art((u,v)=>[x-s+u,y+s*.58-v,2.45],s*2,s*1.1,'shell',['clay','pale','cream']);}
   break;
 }
 case 'maskStall': {
   canopy(4.7,5.6,26.4,21.8,13.8,'berry','pale',3.6);block(5.8,9.1,5.2,19.3,1.3,15.3,'oak','planks');
   for(let j=0;j<2;j++)for(let i=0;i<4;i++){const x=7.9+4.42*i,z=10+j*6.25,c=['cream','honey','teal','pink'][(j+i)%4];
     ball(x,11.1,z,1.57,.74,2.55,c);for(const d of [-.88,.88])ball(x+d,11.27,z+2.2,.45,.46,.94,c);
     for(const d of [-.53,.53])ball(x+d,11.73,z+.45,.25,.23,.42,'ink');}
   plankTable(5.7,15.2,19.7,5.3,8.6);jar(8.6,17.6,10.85,1,2.9,'berry');jar(22,17.7,10.85,.9,2.6,'indigo');
   cloth(11.2,20.7,3.5,8.9,5.2,'berry','mask');break;
 }
 case 'lanternLine': {
   peg(3.4,7.65,25.5,'bark',.67);peg(28.65,7.65,25.5,'bark',.67);
   const pos=drape([3.4,7.65,25.5],[28.65,7.65,25.5],3);
   for(let i=0;i<5;i++){const [x,y,z]=pos((i+1)/6);beam([x,y,z],[x,y,z-1.4],.48,'brass');
     const m=phase?'gold':i%2?'cream':'berry';lathe(x,y,z-8.5,[[0,.9],[.8,1.35],[2.4,1.77],[4.8,1.8],[6.6,1.42],[7.3,.94]],m,10,'wood');
     for(const h of [0,7.05])lathe(x,y,z-8.55+h,[[0,1],[.51,1.03]],'bark',10);
   }break;
 }
 case 'drumTower': {
   for(const x of [3.7,11.6])for(const y of [3.9,11.4])block(x,y,0,1.15,1.1,25.4,'berry');
   for(const y of [4.3,11.9]){beam([4.2,y,2],[12.1,y,11],1.35,'oak');beam([12,y,2],[4.2,y,11],1.35,'oak');}
   block(2.8,3.3,10.1,10.65,10.1,2.05,'oak');gable(2.25,2.6,25.3,11.5,11.4,6.1,'indigo');
   const x=8.2,y=8.4,z=18.5;beam([x,y-2.6,z],[x,y+2.4,z],5.1,'berry',12);
   beam([x,y+2.33,z],[x,y+2.7,z],4.85,'pale',12);beam([x-1.65,y+3.1,13.4],[x+.65,y+3.1,17.3],.76,'oak');break;
 }
 case 'costumes': {
   cottage(4,4.3,19.3,15.7,24.7,14,'plum',{door:.12});canopy(8.3,17.4,19.2,16,5.8,'plum','pale',2.1);
   for(const [i,x] of [10.7,18.9].entries()){
     peg(x,25,11,'oak',.52);lathe(x,25,0,[[0,1.7],[.8,1.7]],'bark',8);
     lathe(x,25,4.5,[[0,2.45],[4.6,1.09],[7.85,1.69],[9.1,.78]],i?'teal':'berry',9,'weave');
     ball(x,25,14.9,.73,.73,1.13,'honey');lathe(x,25,9.55,[[0,1.21],[.81,1.23]],'brass',9);}
   basket(26.1,20.4,0,1.8,'plum');break;
 }
 case 'playBill': {
   for(const x of [3.2,12.2])beam([x,9.5,.3],[x+.12,5.8,19.9],1.55,'oak');
   block(3,6.6,6.2,10.7,1.48,15,'brass');plaque(3.55,8.18,7,9.55,13.5,'mask',['bark','cream','pink'],'plum');
   for(const x of [3.1,12])ball(x,7.65,22.4,.72,.72,1.2,'brass');
   block(2.7,7.1,5.8,11.25,1.7,1.2,'bark');break;
 }
 case 'backStage': {
   cottage(4.7,4.6,26.2,20,27.2,13.9,'dusk',{door:.10});
   // Open dressing bay, mirror with warm bulbs and a rail of capes.
   block(28.8,10.4,0,13.7,19.3,2.4,'oak','planks');canopy(27.5,8.9,22.1,15.5,16.1,'plum','plum',2.3);
   plankTable(30.2,16.8,10.4,4.4,9);block(30.9,16.6,11.2,8.9,1.1,11.9,'honey');panel(31.6,17.84,12.5,7.35,9.2,'glass');
   for(const x of [31.7,38.4])for(const z of [14,18.2,21.2])ball(x,18,z,.42,.36,.65,'cream');
   chair(33,22.6,2.35,.9);for(const x of [11.1,25.4])peg(x,32,17,'oak');beam([11,32,17],[25.4,32,17],1.1,'brass');
   for(const [i,x] of [12.1,16.6,21].entries())cloth(x,32,6.2,3.5,10.15,['berry','teal','dusk'][i],'star');crate(6,31,0,5,4.3,4.7);break;
 }
 case 'starTerrace': {
   block(4.7,5.2,0,37.6,34,1.4,'oak','planks');
   for(const x of [6.3,23.6,40.8])for(const y of [6.7,37.5])peg(x,y,11.5,'bark',.72);
   for(const y of [6.7,37.5]){beam([6.3,y,8.1],[40.8,y,8.1],1.2,'honey');beam([6.3,y,5.1],[40.8,y,5.1],.8,'oak');}
   for(const [x,y] of [[13.9,16.5],[30.9,23.6]]){
     lathe(x,y,1.3,[[0,2.4],[1.3,2.5],[2.2,.94],[8,.9],[8.5,4.25],[9.7,4.25]],'oak',12,'wood');
     lathe(x,y,11,[[0,3.9],[.24,3.9]],'indigo',12);
     for(const dx of [-1.7,1.65])ware(x+dx,y,11.35,.89,'cream','honey');lantern(x,y-1.3,11.4,.47,true);
     chair(x-2.2,y+5.1,1.4,.86);chair(x-2.3,y-6,1.4,.86);
   }
   for(const x of [6.3,41])peg(x,6.7,26.5,'oak',.62);
   const line=drape([6.3,6.7,25.9],[41,6.7,25.9],4.1);
   for(const t of [.16,.39,.62,.85]){const [x,y,z]=line(t);lantern(x,y,z-4.7,.53,true);}
   planter(39,33,1.4,1.05);break;
 }
 case 'moonBasin': {
   lathe(8,8.4,0,[[0,3],[1.7,3.25],[2.9,1.62],[5.9,1.35],[7,2.65],[9.4,5.35],[10.8,5.62]],'slate',14,'',true,.82);
   lathe(8,8.4,10.8,[[0,4.93],[.12,4.91]],phase===3?'indigo':'water',14,'water',false,.82);
   if(phase===3)art((u,v)=>[5.7+u,9.95-v,11.15],3.8,3.2,'moon',['pale','cream','gold']);
   else if(phase===2){ball(8.5,8.5,11.16,1.95,.76,.28,'slate');}
   for(const a of [.1,2.2,4.3]){const x=8+Math.cos(a)*4.45,y=8.4+Math.sin(a)*3.6;ball(x,y,10.98,.23,.23,.35,'brass');}break;
 }
 case 'menuWindow': {
   block(4.4,4.5,0,23.4,6.4,3.4,'stone','stone');block(4.8,4.9,3.3,22.6,5.5,6.8,'oak');
   block(4.1,4.5,9.8,24,7.3,1.45,'honey');block(5.5,4.8,11.1,21.2,.67,9.5,'plaster','speckle');
   for(const x of [4.9,26.4])block(x,5,10.4,.85,6,9.7,'bark');gable(3.9,4.1,20.4,24.2,7.6,3.6,'tile');
   for(let i=0;i<3;i++){const x=9.1+6.8*i;ware(x,9.1,11.2,1.87,'cream',['honey','teal','moss','clay'][(phase+i)%4]);
     if((phase+i)%3===0)loaf(x,9.1,13.28,.42,true);}
   break;
 }
 case 'ranchMemorial': {
   lathe(8.1,8.1,0,[[0,5],[1.7,5.3],[2.7,4.5],[4.3,4.27]],'stone',8,'stone',true,.76);
   const silhouette=[[4.05,4.2],[4.05,17.5],[4.8,20.9],[7,23.9],[8.6,25.2],[11.5,22.4],[12.1,18.5],[12.1,4.2]];
   for(const yy of [6.55,8.9])face(silhouette.map(([x,z])=>[x,yy,z]),'slate',yy>8?14:9,'speckle',true);
   for(let i=0;i<silhouette.length-1;i++){const [x,z]=silhouette[i],[u,h]=silhouette[i+1];face([[x,6.55,z],[u,6.55,h],[u,8.9,h],[x,8.9,z]],'stone',15,'speckle',true);}
   plaque(5.05,9.08,10.1,6.15,9.65,'tree',['bark','brass','gold'],'slate');for(const z of [6.5,8.1])stroke([[6,9.1,z],[10.2,9.1,z]],'pale',14);
   tuft(4.6,10.8,1.4,.54,true);break;
 }
 case 'feastTable': {
   const x=7.5,y=14.8;plankTable(x,y,33,13,9.6,'oak');
   block(x+.45,y+3.5,11.8,32.1,5.7,.24,'berry','weave',false);
   for(let i=0;i<5;i++){
     const xx=10.9+i*6.4;
     for(const yy of [17,26]){ware(xx,yy,12.05,1.39,'cream',i%2?'clay':'honey');}
     if(i%2===0)basket(xx,21.3,12.1,1.55,i===2?'berry':'honey',false);
     else{jar(xx,21.1,12,1.1,4.05,'teal');ware(xx+2.1,21.8,12,.71,'cream','bark');}
   }
   for(const yy of [9,30.4])plankTable(9,yy,29.8,3.45,5.3,'honey');
   for(const xx of [4.9,42.9]){peg(xx,10.1,26.6,'oak',.77);planter(xx,11,0,.77);}
   const pos=drape([4.9,10,26],[42.9,10,26],4.2);
   for(let i=0;i<9;i++){const [xx,yy,z]=pos((i+1)/10);face([[xx-1.45,yy,z],[xx+1.45,yy,z],[xx,yy+.12,z-4.6]],['moss','berry','pale'][i%3],16,'weave',true);}
   barrel(41.2,33.8,0,2.35,7.1);break;
 }
 default:throw Error('Missing late town drawing '+type);
 }
}
