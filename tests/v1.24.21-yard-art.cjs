'use strict';
const { open, wait, assert, backing }=require('./harness138.cjs');
const {createCanvas}=require('@napi-rs/canvas');
const fs=require('node:fs');
const lots=['palace','tower','sanctuary212','school','park','lab','spring','inn','workshop','clinic','guild212','greenhouse212','gallery212','treasureMuseum213','hut','stall','ranch','worldtree1','worldtree5','worldtree8'];
const qhook=`Object.assign(window.qa138,{
 readyLots:()=>facilitySheetReady&&villageSheetReady&&expeditionOfficeSheet.complete,
 frame:(type,level,d)=>spriteBuildingV161(type,level,d),
 stateSnapshot:()=>JSON.stringify(state)
});`;
const snap=(q,s,d)=>{
 const tier=/^worldtree(\d+)$/.exec(s),frame=q.f.frame(tier?'worldtree':s,tier?+tier[1]:1,d),c=backing(frame);
 return {frame,c,p:c.getContext('2d').getImageData(0,0,c.width,c.height).data};
};
async function game(target){
 const q=await open(target,{},qhook);
 for(let i=0;!q.f.readyLots()&&i<200;i++)await wait(20);
 assert(q.f.readyLots());return q;
}
(async()=>{
 const before=await game('1.24.20'),after=await game('working');
 const contact=process.env.YARD_CONTACT&&createCanvas(1040,lots.length*136),g=contact?.getContext('2d');
 if(g){g.fillStyle='#d0e5d4';g.fillRect(0,0,contact.width,contact.height);g.imageSmoothingEnabled=false;}
 try{
  const state=after.f.stateSnapshot();let total=0;
  for(let i=0;i<lots.length;i++){
   const type=lots[i],y=i*136;if(g){g.fillStyle='#1c382f';g.font='12px sans-serif';g.fillText(type,y===0?2:5,y+14);}
   for(let d=0;d<4;d++){
    const a=snap(before,type,d),b=snap(after,type,d);assert.equal(a.c.width,b.c.width);assert.equal(a.c.height,b.c.height);
    let diff=0,alpha=0;for(let k=0;k<a.p.length;k+=4){
      if(a.p[k+3]!==b.p[k+3])alpha++;
      if(a.p[k]!==b.p[k]||a.p[k+1]!==b.p[k+1]||a.p[k+2]!==b.p[k+2]||a.p[k+3]!==b.p[k+3])diff++;
    }
    assert(diff>0&&diff<a.c.width*a.c.height*.035,type+' '+d+' only a small decor area changes: '+diff);
    assert.equal(alpha,0,type+' '+d+' original alpha silhouette');
    assert.equal(b.frame,after.f.frame(type.startsWith('worldtree')?'worldtree':type,type.startsWith('worldtree')?+type.slice(9):1,d),'cached unchanged world art');
    total++;
    if(g){const crop=Math.floor(a.c.height*.46),sh=a.c.height-crop,x=d*260;g.drawImage(a.c,0,crop,a.c.width,sh,x,y+20,128,70);g.drawImage(b.c,0,crop,b.c.width,sh,x+130,y+20,128,70);}
   }
  }
  assert.equal(after.f.stateSnapshot(),state,'art does not mutate save or terrain');
  console.log('PASS',total,'changed frames and unchanged save/terrain');
  if(contact)fs.writeFileSync(process.env.YARD_CONTACT,contact.toBuffer('image/png'));
 }finally{before.close();after.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
