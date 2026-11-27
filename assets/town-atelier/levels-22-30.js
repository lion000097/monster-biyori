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
   plankTable(9.7,22.3,14.3,4,6.3);for(const x of [12.2,16.5,20.8])ware(x,24.2,8.55,1.25,'cream','clay');sack(26.5,20.8,0,.82);
   // Steam hood, copper ladle and a rack of drying garlic around the masonry range.
   p.rim(24,12.1,15.58,3.02,3.02,'brass');beam([25.5,12.9,15.4],[27.4,14.55,20.4],.68,'oak');
   lathe(25.45,12.86,15.36,[[0,.77],[.61,1.0]],'brass',8);
   beam([22.75,10.6,19.7],[27.12,10.6,19.7],.79,'iron');
   for(const [i,xx] of [23.45,24.93,26.44].entries()){stroke([[xx,10.6,19.57],[xx,10.6,17.37-i%2]],'honey',17);
    for(const d of [-.28,.23])ball(xx+d,10.6,17.08-i%2,.42,.39,.81,'linen');}
   p.framed(10.5,22.2,22.45,6.4,7.24,'bread');p.easelSign(5.5,25.4,0,4.7,9.7,'tea');p.flowers(21,23.9,0,4.5,'pink');
   break;
 }
 case 'scarecrow': {
   const coat=['teal','moss','clay','indigo'][phase%4];
   peg(8,8,25,'bark',.65);beam([3,8,19],[13.1,8.2,18.2],1.05,'oak');
   face([[4.1,8.2,19.6],[7,8.2,21],[9.4,8.2,20.8],[12.1,8.3,19],[11.5,8.3,15.8],[10,8.3,16.8],[10.1,8.3,10.4],[6.4,8.3,11.5],[6.7,8.3,16.6],[4.5,8.3,15.8]],coat,16,'weave',true);
   ball(8,8.1,24,1.81,1.5,3.4,'pale');ball(7.5,9.2,24.5,.18,.26,.4,'ink');ball(8.8,9.2,24.4,.19,.24,.4,'ink');
   lathe(8,8.1,26.5,[[0,3.15],[1,3.05],[1.5,1.65],[4.4,1.4],[5.2,.85]],'honey',11,'wood');
   lathe(8,8.1,28.3,[[0,1.67],[.85,1.62]],coat);tuft(8.4,8.4,0,.66);
   p.pennant(7.2,8.87,21.2,2.27,3.49,'berry');p.rim(8,8.1,27.72,2.05,1.97,'pale');
   for(const s of [-1,1]){for(let j=0;j<4;j++)stroke([[8+s*(3.5+j*.21),8.1,18.16],[8+s*(4.3+j*.28),8.2,16.9-j*.31]],'honey',17+j);
    for(let j=0;j<3;j++)stroke([[8+s*(.38+j*.39),8.43,11.48],[8+s*(.50+j*.43),8.33,9.22+j*.2]],'pale',18);}
   const patch=panel(8.55,8.65,13,1.53,2.45,'clay');stroke([patch(.18,.23),patch(1.28,2.24)],'linen',21);
   p.blade(9.21,8.55,29.9,1.7,.12,3.0,.52,'leaf');
   break;
 }
 case 'pickingBaskets': {
   for(const [i,[x,y,r]] of [[4.9,6,2.75],[10.7,6.6,2.2],[8.5,11,2.65]].entries())
     basket(x,y,.2,r,i<phase?['berry','gold','leaf'][i]:'',i<2);
   beam([11.5,10,1.5],[13.9,12.4,4.9],1.05,'oak');
   for(const [i,[xx,yy,s]] of [[4.9,6,2.75],[10.7,6.6,2.2],[8.5,11,2.65]].entries()){
    p.rim(xx,yy,.2+s*1.72,s*.96,s*.96,'pale');
    if(i<phase)for(const j of [1,3,5]){const a=j*2.4,fx=xx+Math.cos(a)*s*.55,fy=yy+Math.sin(a)*s*.48;
      stroke([[fx,fy,s*2.5],[fx+.19,fy,s*2.72+.25]],'bark',10);p.blade(fx,fy,s*2.58,.65,-.29,.34,.28);}
   }
   const shears=[12.2,10.55,2.25];for(const s of [-1,1]){p.rim(12.81+s*.54,11.33,2.52,.48,.56,'brass');
    stroke([shears,[11.3+s*.4,9.65,2.59],[10.91+s*.5,9.25,2.56]],'iron',18);}
   break;
 }
 case 'postcards': {
   // Hinged display wings hold rows of individually framed views.
   canopy(4.4,5.8,24.9,21.4,13.4,'teal','cream',3.3);plankTable(5.2,13.6,20.2,7.6,8);
   block(6.2,18.2,9.1,17.9,1.5,10.2,'oak');for(let i=0;i<5;i++){
     const x=6.65+i*3.5;plaque(x,19.86,10.2,3.07,5.8,i%2?'peak':'frame',['pine',i%2?'blue':'teal','cream'],'linen');
     book(x,19.8,10.2,2.86,1.95,i%2?'teal':'berry');}
   easel(24.7,24,0,5.5,11.8,'peak',['indigo','blue','cream']);sack(6.5,24.1,0,.75);
   for(const [i,xx] of [7.02,10.48,13.98,17.5,21.03].entries())p.framed(xx,20.14,10.88,2.61,4.82,['landscape','moon','tree','butterfly','map'][i]);
   p.framed(22.34,24.56,4.05,4.65,7.75,'landscape');p.pennant(12,19.53,24.8,6.0,5.54,'teal');
   p.spool(22.1,14.6,10.25,.88,3.2,'berry');block(6.2,22.9,0,3.65,2.57,2.6,'oak');
   p.painted([[6.4,25.1,2.72],[9.59,25.1,2.72],[6.4,23.12,2.72]],'map');
   break;
 }
 case 'routeMap': {
   for(const x of [2.7,12.7])peg(x,7,22.2,'oak',.65);
   block(2.25,6.4,8.8,11.8,1.2,12.5,'bark');plaque(2.8,7.71,9.4,10.67,11.3,'map',['moss','teal','gold'],'pale');
   for(let i=0;i<phase;i++){const x=4.1+(i%5)*1.75,z=11.8+Math.floor(i/5)*2.6+(i%2)*.65;
     face([[x,7.97,z],[x,7.97,z+1.85],[x+.8,7.97,z+1.27]],'berry',17);}
   beam([2.2,6.8,21.6],[14.4,6.8,21.6],1.3,'honey');
   // A second map is attached to the back where a traveller can read it from the other road.
   p.framed(12.7,6.14,9.58,9.5,11.34,'map',2);
   p.rim(12.11,7.96,20.62,.63,.37,'brass');p.brackets(2.64,7.99,9.1,10.92,11.6);
   for(const [xx,zz] of [[4.1,12.1],[6.55,14.2],[8.79,13.0],[11.2,16.0]])ball(xx,8.01,zz,.22,.19,.39,'gold');
   for(let n=0;n<3;n++)stroke([[4.2+n*2.33,8.03,12.2+(n%2)*1.8],[5.25+n*2.33,8.03,12.85+(n%2)*.6]],'clay',15);
   break;
 }
 case 'travelStamp': {
   lathe(8,8,0,[[0,3.9],[2,4.2],[3,3.35],[7.6,2.7],[9,3.3]],'stone',8,'stone');
   block(3.55,4.3,8.8,8.9,7.5,1.8,'bark');book(4.5,6,10.65,4.35,3.4,'teal');
   block(4.75,6.2,12.5,3.8,2.8,.28,'cream','');art((u,v)=>[5.3+u,8.7-v,12.95],2.3,1.9,'print',['bark','berry','tile']);
   lathe(10,7.3,10.65,[[0,1.48],[1.3,1.5],[1.9,.75],[3,.5],[4.8,.95],[6,.65]],'brass',8);
   rope([[10.7,7.4,14.6],[11.8,9.8,11.2],[12.3,10.7,8.8],[11.1,11,7.8]],'bark',.48);
   p.rim(8,8,7.47,2.82,2.82,'brass');p.rim(10,7.3,12.03,1.43,1.43,'gold');
   p.painted([[5.07,8.65,13.02],[7.83,8.65,13.02],[5.07,6.64,13.02]],'rosette');
   p.brackets(3.69,11.91,8.95,8.55,2.29);p.pennant(6.45,10.83,8.56,3.24,4.66,'teal');
   for(let i=0;i<4;i++)ball(10.91+i*.38,10.9,8.64+i*.28,.22,.18,.27,'brass');
   break;
 }
 case 'musicMaker': {
   cottage(3.8,4.8,18.1,17.8,25.6,14.4,'honey',{door:.1});block(20.6,9,0,6.7,11.3,11.4,'oak');gable(20,8.4,11.3,8,12.5,5.8,'moss');
   // Wooden marimba bars, stringed lute and the pipes each have their own silhouette.
   plankTable(11.3,23.3,12,4.55,6.1);for(let i=0;i<7;i++)block(11.9+i*1.5,24.25-i*.1,8.36,1.11,2.2+i*.26,.92,i%2?'oak':'honey');
   ball(25,23.1,4.1,2.1,1.1,3.6,'honey');beam([25,23,6.8],[25.9,22.9,15.1],1.2,'oak');ball(25,24,4.3,.45,.32,.88,'ink');
   for(let i=0;i<4;i++)beam([5.8+i*1.3,23.7,4.1],[5.8+i*1.3,23.7,9.5+i*2.5],1.45,'brass',7);
   for(const xx of [11,14])beam([xx,10,38],[xx+(xx<13?-.7:.7),10,44],1.2,'brass');beam([10.2,10,43.8],[14.8,10,43.8],.8,'brass');
   plaque(11.9,22.9,17.8,4.2,5.8,'score',['bark','gold','cream'],'pine');
   p.framed(9.9,23.42,24.64,6.65,9.56,'lute');p.easelSign(5.32,26.5,0,4.76,10.15,'lute');
   for(const dx of [-.24,.19])stroke([[25+dx,24.14,3.39],[25.76+dx,24.10,11.45],[25.93+dx,23.18,14.95]],'linen',20);
   for(const dx of [-1,1])for(const zz of [12.84,14.35])ball(25.8+dx*.64,22.99,zz,.39,.31,.46,'brass');
   for(const [i,xx] of [5.8,7.1,8.4,9.7].entries()){p.rim(xx,23.7,9.54+i*2.5,.69,.63,'gold');ball(xx,24.31,7.05,.26,.18,.52,'ink');}
   beam([13.1,27.25,8.85],[16.5,26.9,9.38],.62,'oak');ball(16.52,26.88,9.45,.57,.53,.64,'linen');
   break;
 }
 case 'birdScore': {
   for(const [x,y] of [[4.8,10.9],[11.4,10.5],[7.9,4.8]])beam([x,y,.35],[8.1,7.8,9],1.17,'bark');
   beam([8.1,7.8,7.3],[8.1,7.8,18.4],1.05,'brass');
   const at=(u,v)=>[3.8+u,9.5-v*.16,14.5+v];face([at(0,0),at(8.6,0),at(8.6,6.1),at(0,6.1)],'oak',13,'wood',true);
   const page=(u,v)=>[4.2+u,9.8-v*.16,15+v];face([page(0,0),page(7.8,0),page(7.8,5.15),page(0,5.15)],'linen',19);
   art(page,7.7,5,'score',['bark','ink','ink']);if(phase){bird(5.2,8.1,20.6,.67);bird(9.9,8.1,20.6,.61,'clay');}
   for(const xx of [4.5,11.44])beam([xx,9.71,14.64],[xx,8.64,20.86],.59,'brass');
   for(let j=0;j<4;j++){const v=1+j*.94;
    stroke([[4.87,9.91-v*.16,15+v],[11.5,9.91-v*.16,15+v]],'slate',14);}
   stroke([[7.83,9.83,15.08],[7.83,8.96,20.27]],'honey',16);
   p.rope([[10.47,8.83,20.3],[10.36,9.45,17.75],[10.73,9.53,18.31],[10.93,9.44,17.7],[11.08,8.83,20.3]],'berry',.38);
   p.rim(8.1,7.8,10.15,.71,.69,'brass');
   break;
 }
 case 'handOrgan': {
   for(const y of [4.7,11.3])wheel(14.6,y,5.5,2.14,'y','oak');
   block(6.7,5.3,5.2,15.9,5.8,9.6,'berry');block(6.25,4.9,14.7,16.8,6.6,1.5,'oak');
   block(7.2,5.3,16.1,14.9,1.55,7.6,'bark');
   for(let i=0;i<8;i++){const x=8.2+i*1.75;beam([x,8.2,16.2],[x,8.2,19.5+(7-i)*1.05],1.45,'brass',8);}
   plaque(8.2,11.26,7,12.5,6.4,'score',['oak','cream','gold'],'teal');
   rope([[22.7,8.3,11.7],[25.2,8.3,11.7],[25.2,8.3,15.5],[27.3,8.3,15.5]],'brass',1.1);
   p.framed(9.12,11.47,7.15,10.55,5.99,'lute');
   for(let i=0;i<8;i++){const xx=8.2+i*1.75,top=19.5+(7-i)*1.05;
    p.rim(xx,8.2,top+.10,.67,.67,'gold');panel(xx-.36,8.93,top-2.8,.73,1.0,'ink');}
   p.pennant(6.51,10.9,15.4,3.2,3.82,'teal');ball(27.22,8.3,15.55,.83,.68,.91,'bark');
   for(const xx of [7.3,21.94])p.brackets(xx,11.28,6.0,.68,7.7);
   break;
 }
 case 'freight': {
   cottage(3.8,4.8,27.2,21.5,27,13,'tile',{wall:'oak',door:.1,noFront:true});
   block(8.6,25.8,0,19.4,1.25,18.9,'bark');for(let i=0;i<2;i++){const x=9.2+i*9.1;block(x,27,1.2,8.45,.8,16.4,'oak','planks');beam([x+.4,27.9,2.5],[x+7.8,27.9,16.6],1.55,'honey',4);}
   block(4,28.1,0,35.9,10.2,3,'oak','planks');for(const [x,y,z,w,d,h] of [[6.4,29.8,3,6.7,5.2,7.9],[13.4,29.2,3,6.1,5.2,6.8],[8.6,29.9,11,5.4,4.4,5.3],[29,28.6,3,7.2,6.2,6.5]])crate(x,y,z,w,d,h);
   peg(37,11.6,28.6,'bark',1.2);beam([37,11.6,24],[32,17.4,31],2.5,'oak');wheel(32.2,17.5,30.3,1.76,'y','brass');rope([[32.3,17.7,28.1],[32.3,17.7,13.5]],'bark',.67);
   sack(25,33.4,3,.96);barrel(37.4,24,0,2.45,8.4);
   // Dormer over the loading doors and a hooked sling on the block and tackle.
   block(13.65,20.6,29.1,7.6,5.05,4.9,'oak','planks');gable(13.15,20.12,33.8,8.6,6.3,4.6,'teal');
   opening(16.03,25.68,29.95,3.1,3.55);p.rim(32.26,17.68,26.93,.65,.65,'iron');
   p.rope([[32.3,17.7,13.8],[32.28,17.7,12.0],[33.01,17.7,10.96],[33.93,17.7,11.82],[33.88,17.7,12.65]],'iron',.83);
   for(const [xx,yy,zz] of [[8.7,35.14,6.2],[14.51,34.55,4.75],[10.02,34.41,12.75]])p.scroll(xx,yy,zz,2.84,2.38);
   p.spool(32.53,34.32,3.0,1.67,4.4,'honey');p.pennant(23.0,27.14,22.8,4.45,5.15,'teal');
   break;
 }
 case 'traderTent': {
   const a=[2.2,3.4,.6],b=[13.8,3.4,.6],c=[13.8,12.9,.6],d=[2.2,12.9,.6],rb=[8,4.25,17.9],rf=[8,11.85,17.9];
   face([a,b,rb],'plum',12,'weave',true);face([a,rb,rf,d],'plum',16,'weave',true);face([b,c,rf,rb],'berry',12,'weave',true);
   face([d,rf,[6.8,12.8,.8]],'berry',18,'weave',true);face([rf,c,[9.7,12.85,.8]],'plum',14,'weave',true);
   beam(rb,rf,1.05,'brass');for(const [x,y] of [[2.2,3.4],[13.8,3.4],[2.2,12.9],[13.8,12.9]])beam([x,y,2],[x+(x<8?-.85:.85),y+.25,0],.62,'pale');
   lantern(5.1,12.8,4.2,.55,!!phase);basket(10.8,12.8,0,1.11,'',false);
   for(const yy of [4.68,8.44,11.08]){
    stroke([[2.55,yy,1.64],[4.54,yy,7.5],[6.53,yy,13.41],[7.92,yy,17.69]],'honey',17);
    stroke([[13.46,yy,1.64],[11.48,yy,7.5],[9.52,yy,13.41],[8.08,yy,17.69]],'pale',15);
   }
   for(const side of [-1,1]){const xx=8+side*3.74;
    p.rope([[xx,12.59,8.07],[xx+side*.6,12.72,7.32],[xx+side*.79,12.73,5.04]],'gold',.61);}
   p.pennant(7.02,11.94,18.55,2.2,3.13,'teal');p.spool(3.72,11.68,0,.82,3.0,'indigo');
   break;
 }
 case 'rugShop': {
   canopy(4,5.9,26.5,22.6,14.5,'plum','berry',3.5);
   for(const [i,x] of [6,12.6,19.6].entries()){const c=['teal','berry','indigo','moss'][(phase+i)%4];cloth(x,13.5,7,5.7,14.4,c,['star','flower','sprig'][i]);
     beam([x+.15,20.9,2.7],[x+4.85,20.9,2.7],2.35,c,9);}
   for(let i=0;i<3;i++){const x=6.1+i*5.9;block(x,21.9,.15,5.1,5.7,.55,['teal','clay','plum'][(phase+i)%3],'weave');
     art((u,v)=>[x+.45+u,27.1-v,.95],4.2,4.6,i===1?'flower':'star',['pale','cream','gold']);}
   for(const [i,xx] of [6,12.6,19.6].entries()){
    p.painted([[xx+.62,13.83,10.75],[xx+5.04,13.83,10.75],[xx+.62,13.83,17.73]],['rosette','tree','moon'][(i+phase)%3]);
    for(let j=0;j<6;j++)stroke([[xx+.33+j*.95,13.81,7.04],[xx+.43+j*.95,13.81,5.66+(j%2)*.32]],'linen',18);
   }
   for(const [i,xx] of [6.1,12.0,17.9].entries()){p.painted([[xx+.65,26.95,1.09],[xx+4.5,26.95,1.09],[xx+.65,22.66,1.09]],['rosette','moon','tree'][(phase+i)%3]);}
   p.spool(24.71,23.69,.15,1.35,4.28,'berry');
   break;
 }
 case 'fishKeeper': {
   cottage(3.6,4.7,17.7,17,23.7,12.5,'teal',{door:.10});
   block(21.3,9.5,0,7.2,15,2.2,'oak','planks');for(const x of [15.1,24.4]){
     lathe(x,24.1,0,[[0,2.6],[5.9,3.15]],'oak',11,'wood',true);lathe(x,24.1,5.9,[[0,2.65],[.12,2.68]],'water',12,'water');
   }
   beam([21.5,9.2,.7],[24.8,13.4,18.8],1,'honey');wheel(25,13.6,19.5,2.1,'y','bark');
   for(let i=0;i<3;i++)stroke([[23.7+i*.83,13.65,16.4],[24.6+i*.35,13.65,13.5],[25.5,13.65,16.5]],'linen',13);
   beam([12.4,7,36.2],[12.4,7,42.5],.8,'brass');plaque(10.2,7.1,39.5,5.3,3.9,'fish',['brass','teal','cream'],'teal');sack(6.3,24.1,0,.81);plaque(13,22.1,16.5,4.8,5.4,'fish',['bark','aqua','cream'],'oak');
   p.framed(9.1,22.69,22.83,6.75,7.99,'fish');p.flowers(4.16,22.85,.12,3.67,'cream');
   const net=(u,v)=>[23.45+u,13.85,15.72+v];
   for(let j=0;j<4;j++){stroke([net(j*.69,1.35),net(1.52+(j-1.5)*.3,-2.46)],'pale',18);
    stroke([net(.44,j*.65-1.45),net(2.62,j*.51-1.51)],'pale',17);}
   for(const xx of [15.1,24.4]){p.rim(xx,24.1,3.5,2.96,2.96,'iron');p.rim(xx-.1,24.23,6.16,1.76,1.04,'glass',.35,3.67);}
   break;
 }
 case 'pondWindow': {
   lathe(8,8,0,[[0,5.2],[1.5,5.45],[3.45,5.8]],'oak',12,'wood',true,.84);
   lathe(8,8,3.45,[[0,4.89],[.1,4.9]],'water',12,'water',false,.84);
   const x=7+Math.sin(phase*Math.PI/2)*1.45,y=8.4+Math.cos(phase*Math.PI/2)*.7;
   art((u,v)=>[x-1.6+u,y+1.2-v,3.68],3.8,2.1,'fish',['slate','teal','cream']);
   for(const dx of [-3.15,3.15])beam([8+dx,5.1,3.7],[8+dx,10.9,3.7],.67,'brass');tuft(12.5,6.4,.4,.53);
   for(const a of [.1,1.2,2.4,3.6,4.8,5.85]){const xx=8+Math.cos(a)*5.48,yy=8+Math.sin(a)*4.62;
    stroke([[xx,yy,.75],[xx,yy,3.38]],'brass',17);ball(xx,yy,2.78,.25,.23,.37,'gold');}
   p.rim(x-.22,y+.17,3.75,2.51,1.17,'glass',.55,1.75);
   for(const [xx,yy,s] of [[4.83,6.9,.78],[10.56,5.86,.63]]){
    lathe(xx,yy,3.68,[[0,s],[.13,s]],'moss',8,'',false,.72);stroke([[xx,yy,3.86],[xx+s*.83,yy-.21,3.86]],'pine',14);}
   p.flower(12.51,6.32,.35,.59,'pink');
   break;
 }
 case 'shellChannel': {
   block(.12,5.7,.16,31.76,5.5,1.05,'slate','stone');block(.13,6.45,1.18,31.74,3.95,.22,'water','water',false);
   for(let i=0;i<8;i++)for(const y of [5.55,10.85]){
     const x=1.65+i*4.1;ball(x,y,.98,1.57,.55,1.05,i%2?'stone':'pale');}
   for(const [x,y,s] of [[4.6,5.65,1.3],[15.2,10.8,1],[24.3,5.6,1.15]]){
     ball(x,y,1.75,s,s*.65,s*.72,'pink');art((u,v)=>[x-s+u,y+s*.58-v,2.45],s*2,s*1.1,'shell',['clay','pale','cream']);}
   for(const [xx,yy,s] of [[4.6,5.65,1.3],[15.2,10.8,1],[24.3,5.6,1.15]]){
    for(let j=0;j<5;j++){const a=.34+j*.62;stroke([[xx,yy+.49*s,2.08],[xx+Math.cos(a)*s*.9,yy-Math.sin(a)*s*.55,2.55]],j%2?'cream':'clay',18);}
   }
   for(const xx of [6.1,17.3,26.7]){p.rim(xx,8.2,1.48,1.8,.66,'aqua',.28,2.9);
    p.blade(xx+1.2,5.54,.55,-.49,-.47,1.95,.35,'leaf');}
   break;
 }
 case 'maskStall': {
   canopy(4.7,5.6,26.4,21.8,13.8,'berry','pale',3.6);block(5.8,17.7,7,19.3,1.3,16.4,'dusk','planks');
   for(let j=0;j<2;j++)for(let i=0;i<4;i++){const x=7.9+4.42*i,z=11.5+j*7.2,c=['cream','honey','teal','pink'][(j+i)%4];
     ball(x,19.7,z,1.67,.84,2.8,c);for(const d of [-.88,.88])ball(x+d,19.87,z+2.35,.45,.46,.94,c);
     for(const d of [-.53,.53])ball(x+d,20.4,z+.45,.32,.26,.55,'ink');}
   plankTable(5.7,21.2,19.7,5.3,8.6);jar(8.6,23.6,10.85,1,2.9,'berry');jar(22,23.7,10.85,.9,2.6,'indigo');
   cloth(11.2,26.7,3.5,8.9,5.2,'berry','mask');
   for(let j=0;j<2;j++)for(let i=0;i<4;i++){const xx=7.9+4.42*i,zz=11.5+j*7.2;
    const mat=['berry','indigo','brass','brick'][(i+j*2)%4];
    for(const dx of [-1,1])stroke([[xx+dx*.77,20.49,zz+.02],[xx+dx*1.26,20.36,zz+.53]],mat,17);
    stroke([[xx-.43,20.40,zz-.63],[xx,20.53,zz-.89],[xx+.42,20.40,zz-.63]],'bark',9);
    if((i+j)%2===0)ball(xx,20.54,zz+1.52,.27,.22,.45,'gold');
   }
   p.easelSign(24.7,25.43,0,4.4,9.41,'mask');p.pennant(11.7,19.76,25.7,5.27,4.58,'berry');
   break;
 }
 case 'lanternLine': {
   peg(3.4,7.65,25.5,'bark',.67);peg(28.65,7.65,25.5,'bark',.67);
   const pos=drape([3.4,7.65,25.5],[28.65,7.65,25.5],3);
   for(let i=0;i<5;i++){const [x,y,z]=pos((i+1)/6);beam([x,y,z],[x,y,z-1.4],.48,'brass');
     const m=phase?'gold':i%2?'cream':'berry';lathe(x,y,z-8.5,[[0,.9],[.8,1.35],[2.4,1.77],[4.8,1.8],[6.6,1.42],[7.3,.94]],m,10,'wood');
     for(const h of [0,7.05])lathe(x,y,z-8.55+h,[[0,1],[.51,1.03]],'bark',10);
   }
   for(let i=0;i<5;i++){const [xx,yy,zz]=pos((i+1)/6);
    for(const h of [2.27,4.03,5.57])p.rim(xx,yy,zz-8.55+h,h>2.5?1.78:1.74,h>2.5?1.78:1.74,phase?'honey':'clay');
    stroke([[xx-.34,yy+1.82,zz-3.05],[xx+.42,yy+1.82,zz-4.0],[xx-.26,yy+1.82,zz-5.1]],i%2?'berry':'ink',12);
    beam([xx,yy,zz-8.5],[xx,yy,zz-10.05],.46,'honey');ball(xx,yy,zz-10.29,.42,.41,.58,'brick');
   }
   break;
 }
 case 'drumTower': {
   for(const x of [3.7,11.6])for(const y of [3.9,11.4])block(x,y,0,1.15,1.1,25.4,'berry');
   for(const y of [4.3,11.9]){beam([4.2,y,2],[12.1,y,11],1.35,'oak');beam([12,y,2],[4.2,y,11],1.35,'oak');}
   block(2.8,3.3,10.1,10.65,10.1,2.05,'oak');gable(2.25,2.6,25.3,11.5,11.4,6.1,'indigo');
   const x=8.2,y=8.4,z=18.5;beam([x,y-2.6,z],[x,y+2.4,z],5.1,'berry',12);
   beam([x,y+2.33,z],[x,y+2.7,z],4.85,'pale',12);beam([x-1.65,y+3.1,13.4],[x+.65,y+3.1,17.3],.76,'oak');
   for(let n=0;n<12;n++){const a=n*tau/12,xx=8.2+Math.cos(a)*2.04,zz=18.5+Math.sin(a)*4.04;
    ball(xx,11.24,zz,.22,.16,.34,'brass');}
   for(const yy of [7.05,8.34,9.63])stroke([[6.05,yy,17.52],[6.62,yy+.7,15.85],[6.12,yy+1.08,18.72]],'pale',19);
   beam([9.95,11.81,13.2],[8.54,11.88,17.08],.71,'honey');
   p.pennant(3.87,12.68,24.86,2.87,5.3,'berry');p.pennant(9.86,12.68,24.86,2.87,5.3,'berry');
   break;
 }
 case 'costumes': {
   cottage(4,4.3,19.3,15.7,24.7,14,'plum',{door:.12});canopy(8.3,17.4,19.2,16,5.8,'plum','pale',2.1);
   for(const [i,x] of [10.7,18.9].entries()){
     peg(x,25,11,'oak',.52);lathe(x,25,0,[[0,1.7],[.8,1.7]],'bark',8);
     lathe(x,25,4.5,[[0,2.45],[4.6,1.09],[7.85,1.69],[9.1,.78]],i?'teal':'berry',9,'weave');
     ball(x,25,14.9,.73,.73,1.13,'honey');lathe(x,25,9.55,[[0,1.21],[.81,1.23]],'brass',9);}
   lathe(14.1,8.7,38,[[0,1.75],[1.4,1.7],[1.6,.95],[4.5,.95],[4.7,1.75],[5.8,1.75]],'honey',10,'wood');basket(26.1,20.4,0,1.8,'plum');
   p.framed(10.73,20.62,24.08,6.25,7.74,'mask');p.spool(25.51,24.48,.25,1.47,4.62,'berry');p.spool(27.36,23.35,0,1.09,3.35,'teal');
   for(const [i,xx] of [10.7,18.9].entries()){
    p.rim(xx,25,5.72,2.19,2.19,i?'gold':'linen');
    for(const a of [.38,1.76,3.29,4.75])stroke([[xx+Math.cos(a)*1.15,25+Math.sin(a)*1.15,9.22],[xx+Math.cos(a)*2.18,25+Math.sin(a)*2.18,5.3]],i?'brass':'pink',19);
    ball(xx,26.52,12.22,.35,.33,.52,'brass');
   }
   break;
 }
 case 'playBill': {
   for(const x of [3.2,12.2])beam([x,9.5,.3],[x+.12,5.8,19.9],1.55,'oak');
   block(3,6.6,6.2,10.7,1.48,15,'brass');plaque(3.55,8.18,7,9.55,13.5,'mask',['bark','cream','pink'],'plum');
   for(const x of [3.1,12])ball(x,7.65,22.4,.72,.72,1.2,'brass');
   block(2.7,7.1,5.8,11.25,1.7,1.2,'bark');
   p.framed(4.22,8.45,9.15,8.35,10.43,'mask');p.scroll(5.1,8.53,7.27,6.52,2.10);
   for(const xx of [3.87,12.45]){p.rope([[xx,8.43,20.7],[xx,8.43,18.06],[xx+.44,8.43,16.89]],'brass',.45);ball(xx+.43,8.43,16.61,.34,.32,.51,'berry');}
   p.brackets(3.42,8.48,6.35,10.02,6.11);
   break;
 }
 case 'backStage': {
   cottage(4.7,4.6,26.2,20,27.2,13.9,'dusk',{door:.10});
   // Open dressing bay, mirror with warm bulbs and a rail of capes.
   block(28.8,10.4,0,13.7,19.3,2.4,'oak','planks');canopy(27.5,8.9,22.1,15.5,16.1,'plum','plum',2.3);
   plankTable(30.2,16.8,10.4,4.4,9);block(30.9,16.6,11.2,8.9,1.1,11.9,'honey');panel(31.6,17.84,12.5,7.35,9.2,'glass');
   for(const x of [31.7,38.4])for(const z of [14,18.2,21.2])ball(x,18,z,.42,.36,.65,'cream');
   chair(33,22.6,2.35,.9);for(const x of [11.1,25.4])peg(x,32,17,'oak');beam([11,32,17],[25.4,32,17],1.1,'brass');
   for(const [i,x] of [12.1,16.6,21].entries())cloth(x,32,6.2,3.5,10.15,['berry','teal','dusk'][i],'star');crate(6,31,0,5,4.3,4.7);
   p.framed(13.75,25.86,26.75,7.25,8.86,'mask');p.spool(38.97,20.42,11.41,.9,3.08,'berry');p.spool(36.6,20.47,11.4,.71,2.46,'teal');
   for(const [i,xx] of [12.1,16.6,21.0].entries()){
    p.rope([[xx+1.8,32.05,17.22],[xx+1.8,32.05,16.21],[xx+.3,32.05,14.94],[xx+3.2,32.05,14.94],[xx+1.8,32.05,16.21]],'honey',.44);
    p.painted([[xx+.39,32.34,8.2],[xx+3.08,32.34,8.2],[xx+.39,32.34,12.84]],['rosette','moon','butterfly'][i]);
   }
   p.flowers(4.9,26.7,.12,5.2,'plum');p.brackets(30.62,21.28,10.32,9.87,2.38);
   break;
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
   planter(39,33,1.4,1.05);
   // Timber pergola at the entrance, with climbing wisteria and suspended stars.
   for(const xx of [6.9,15.6])for(const yy of [10.4,19.2]){block(xx-.37,yy-.37,1.45,.74,.74,21.3,'oak');}
   for(const xx of [6.9,15.6])beam([xx,9.58,22.8],[xx,20.05,22.8],1.02,'bark');
   for(let j=0;j<5;j++)beam([6.03,10.58+j*2.12,23.34],[16.43,10.58+j*2.12,23.34],.84,'honey');
   for(let j=0;j<7;j++){const xx=7.1+j*1.32,yy=10.7+Math.sin(j*.9)*.58;
    p.blade(xx,yy,23.65,1.22,.63,1.08,.65,'leaf');
    for(let n=0;n<3;n++)ball(xx,yy,22.95-n*.92,.48-n*.10,.43-n*.08,.61-n*.07,j%3?'plum':'pink');}
   for(const xx of [20.4,26.85,34.75]){const z=23.53-Math.sin((xx-6.3)/34.7*Math.PI)*2.0;
    stroke([[xx,6.7,z+1.02],[xx,6.7,z-1.12]],'brass',18);
    art((u,v)=>[xx-1.08+u,6.84,z-4.55+v],2.15,3.5,'star',['brass','gold','cream']);}
   p.easelSign(34.05,34.18,1.4,5.05,10.76,'moon');
   break;
 }
 case 'moonBasin': {
   lathe(8,8.4,0,[[0,3],[1.7,3.25],[2.9,1.62],[5.9,1.35],[7,2.65],[9.4,5.35],[10.8,5.62]],'slate',14,'',true,.82);
   lathe(8,8.4,10.8,[[0,4.93],[.12,4.91]],phase===3?'indigo':'water',14,'water',false,.82);
   if(phase===3)art((u,v)=>[5.7+u,9.95-v,11.15],3.8,3.2,'moon',['pale','cream','gold']);
   else if(phase===2){ball(8.5,8.5,11.16,1.95,.76,.28,'slate');}
   for(const a of [.1,2.2,4.3]){const x=8+Math.cos(a)*4.45,y=8.4+Math.sin(a)*3.6;ball(x,y,10.98,.23,.23,.35,'brass');}
   p.rim(8,8.4,10.96,5.42,4.44,'brass');
   for(let i=0;i<12;i++){const a=i*tau/12;stroke([[8+Math.cos(a)*4.92,8.4+Math.sin(a)*4.02,10.99],[8+Math.cos(a)*5.45,8.4+Math.sin(a)*4.44,11.11]],'pale',20);}
   p.rim(8.2,8.45,11.11,3.19,1.88,'glass',3.55,1.36);p.rim(8,8.4,4.6,1.5,1.35,'brass');
   p.blade(4.5,10.26,.15,-1.12,.5,2.64,.44);
   break;
 }
 case 'menuWindow': {
   block(4.4,4.5,0,23.4,6.4,3.4,'stone','stone');block(4.8,4.9,3.3,22.6,5.5,6.8,'oak');
   block(4.1,4.5,9.8,24,7.3,1.45,'honey');block(5.5,4.8,11.1,21.2,.67,9.5,'plaster','speckle');
   for(const x of [4.9,26.4])block(x,5,10.4,.85,6,9.7,'bark');gable(3.9,4.1,20.4,24.2,7.6,3.6,'tile');
   for(let i=0;i<3;i++){const x=9.1+6.8*i;ware(x,9.1,11.2,1.87,'cream',['honey','teal','moss','clay'][(phase+i)%4]);
     if((phase+i)%3===0)loaf(x,9.1,13.28,.42,true);}
   for(const [i,xx] of [6.2,13.0,19.8].entries())p.framed(xx,5.72,13.21,5.35,5.56,['bread','fish','tea'][i]);
   for(const [i,xx] of [9.1,15.9,22.7].entries()){
    const yy=9.1;p.rim(xx,yy,13.37,1.76,1.76,'brass');
    if((phase+i)%3===1){for(let j=0;j<3;j++)ball(xx-.61+j*.54,yy+(j%2)*.45,13.45,.35,.28,.36,j%2?'leaf':'berry');}
    block(xx-1.12,11.05,11.32,2.05,.85,1.12,'linen');}
   p.pennant(5.02,11.8,9.86,4.03,4.03,'teal');
   break;
 }
 case 'ranchMemorial': {
   lathe(8.1,8.1,0,[[0,5],[1.7,5.3],[2.7,4.5],[4.3,4.27]],'stone',8,'stone',true,.76);
   const silhouette=[[4.05,4.2],[4.05,17.5],[4.8,20.9],[7,23.9],[8.6,25.2],[11.5,22.4],[12.1,18.5],[12.1,4.2]];
   for(const yy of [6.55,8.9])face(silhouette.map(([x,z])=>[x,yy,z]),'slate',yy>8?14:9,'speckle',true);
   for(let i=0;i<silhouette.length-1;i++){const [x,z]=silhouette[i],[u,h]=silhouette[i+1];face([[x,6.55,z],[u,6.55,h],[u,8.9,h],[x,8.9,z]],'stone',15,'speckle',true);}
   plaque(5.05,9.08,10.1,6.15,9.65,'tree',['bark','brass','gold'],'slate');for(const z of [6.5,8.1])stroke([[6,9.1,z],[10.2,9.1,z]],'pale',14);
   tuft(4.6,10.8,1.4,.54,true);
   p.framed(5.33,9.32,10.36,5.64,8.97,'tree');
   for(const [xx,zz] of [[4.85,18.3],[5.53,20.14],[6.78,21.82],[10.60,20.1]])stroke([[xx,9.04,zz],[xx+.4,9.06,zz+.48],[xx+.6,9.06,zz+.56]],'pale',16);
   for(const [xx,yy,s] of [[4.77,10.51,.68],[6.05,11.49,.55],[11.03,10.36,.79]])p.flower(xx,yy,1.22,s,'cream');
   p.rim(8.1,8.1,2.75,4.48,3.38,'brass',.25,2.62);
   break;
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
   barrel(41.2,33.8,0,2.35,7.1);
   // Tiered fruit stand, spiral candles and the embroidered border of the runner.
   lathe(23.68,21.3,12.03,[[0,1.4],[.63,1.6],[1.02,.53],[4.95,.42],[5.34,2.13],[5.86,2.13]],'brass',12);
   for(let i=0;i<6;i++){const a=i*tau/6;ball(23.68+Math.cos(a)*1.19,21.3+Math.sin(a)*1.19,18.42,.64,.64,.92,i%2?'berry':'gold');}
   for(const xx of [17.7,30.07]){lathe(xx,21.15,12.09,[[0,.95],[.65,.97],[.91,.46],[3.22,.33],[3.58,.64]],'brass',9);
    beam([xx,21.15,15.67],[xx,21.15,18.93],.82,'cream');ball(xx,21.15,19.47,.32,.32,.80,'gold');}
   for(let j=0;j<13;j++)for(const yy of [18.65,23.53])stroke([[8.62+j*2.38,yy,12.20],[9.53+j*2.38,yy+.32,12.20],[10.37+j*2.38,yy,12.20]],'pale',18);
   p.pennant(7.73,27.92,11.63,4.30,5.07,'berry');p.pennant(35.23,27.92,11.63,4.30,5.07,'berry');p.flowers(5.11,10.1,.15,3.55,'pink');
   break;
 }
 default:throw Error('Missing late town drawing '+type);
 }
}
