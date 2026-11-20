'use strict';
const h=require('./harness138.cjs');
const {assert,open,wait,persist,backing,advance}=h;
const hooks=`Object.assign(window.qa138,{
 artReady:()=>villageSheetReady&&treeDecorationReady,
 treeArt:level=>spriteBuildingV161('worldtree',level),
 countFrames:()=>treeDecorationCache.size,
 treeMap:()=>{const b=state.buildings.find(v=>v.type==='worldtree');cameraX=b.x-3;cameraY=b.y-2;limitCamera();drawWorld(0);return $('game')}
});`;
const pixels=el=>backing(el).getContext('2d').getImageData(0,0,el.width,el.height).data;
function countChanges(a,b,x=0,y=0,width=192,height=192){
 let sum=0;
 const aa=pixels(a), bb=pixels(b);
 for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++){
  const i=(yy*a.width+xx)*4;if([0,1,2,3].some(c=>aa[i+c]!==bb[i+c]))sum++;
 }
 return sum;
}
(async()=>{
 const old=await open('1.13.13');let snapshot;
 try{const s=old.f.state();s.villageLv=s.worldTreeLevel=20;s.buildings.find(b=>b.type==='worldtree').level=20;s.hour=12;old.f.save(true);snapshot=persist(old.w);}finally{old.close();}
 const q=await open('1.13.14',snapshot,hooks);
 try{
  const {f,d}=q,s=f.state();assert.equal(s.villageLv,20);
  for(let i=0;i<50&&!f.artReady();i++)await wait(20);
  assert(f.artReady());s.hour=12;f.setTiming({tickAccum:0});
  const before=f.treeArt(9),birds=f.treeArt(10),fruit=f.treeArt(15),buds=f.treeArt(20);
  assert.equal(before,f.treeArt(8));assert.equal(birds,f.treeArt(14));assert.equal(fruit,f.treeArt(19));
  assert(countChanges(before,birds,43,23,24,20)>110);
  assert(countChanges(birds,fruit,28,87,16,16)>80);
  assert(countChanges(fruit,buds,61,54,12,16)>40);
  assert.equal(countChanges(before,buds,0,150,192,41),0,'roots and trunk remain identical');
  const dayPixels=pixels(f.treeMap()).slice();
  s.hour=18;assert.equal(f.treeArt(20),buds);s.hour=19;const night=f.treeArt(20);
  assert(countChanges(night,buds)>900);s.hour=5;assert.equal(f.treeArt(20),night);
  s.hour=6;assert.equal(f.treeArt(20),buds);s.hour=0;
  f.setTiming({tickAccum:.20});const nextGlow=f.treeArt(20);assert(countChanges(night,nextGlow)>50);
  assert.equal(f.treeArt(24),nextGlow);
  const nightPixels=pixels(f.treeMap());assert(dayPixels.some((v,i)=>v!==nightPixels[i]));
  f.render('build');assert(pixels(d.querySelector('#treePortrait')).some(v=>v!==0));
  const panel=d.querySelector('[data-facility-art="worldtree"]');assert(panel&&pixels(panel).some(v=>v!==0));
  d.querySelector('[data-speed="0"]').click();const frozen=f.treeArt(20);advance(f,2.4);assert.equal(f.treeArt(20),frozen);
  for(let i=0;i<96;i++){s.hour=i%24;f.setTiming({tickAccum:(i%16)/16});f.treeArt(20+i);}
  assert.equal(f.countFrames(),7);
  console.log('PASS cumulative milestone sprites, day/night boundary, phase change, capped cache, paused game, real map, 2 portraits and existing Lv.20 save');
 }finally{q.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
