'use strict';
const {assert,open,click}=require('./harness138.cjs');
const hooks=`
window.qa138.motionTest=()=>{
 let start=null;
 for(let y=0;y<H&&!start;y++)for(let x=0;x<W-6&&!start;x++){
  if(Array.from({length:6},(_,i)=>tileIsFree191(x+i,y)).every(Boolean))start=[x,y];
 }
 if(!start)throw Error('Missing straight path');
 const [x,y]=start,route=()=>[1,2,3,4,5].map(i=>[x+i,y]);
 const monster=state.monsters[0],staff=state.staff[0],guest={name:'旅人',x,y,phase212:'arrive',entered211:true,route212:route()};
 state.guests=[guest];
 for(const actor of [monster,staff])Object.assign(actor,{x,y,path:route()});
 return ()=>[monster.x-x,staff.x-x,guest.x-x,worldAnimationMs];
};`;
async function sample(speed,frames){
 const q=await open('1.13.20',{},hooks);
 try{
  const read=q.f.motionTest();
  click(q.d,'[data-speed="'+speed+'"]');
  const initial=read(),base=1000;
  q.f.setTiming({frameAt:base,motionBuffer137:0,tickAccum:0});
  for(let i=1;i<=frames;i++)q.f.animate(base+32*i);
  return Array.from(read(),(x,i)=>x-initial[i]);
 }finally{q.close()}
}
(async()=>{
 assert.deepEqual(await sample(0,10),[0,0,0,0]);
 const base=await sample(1,5);
 for(const speed of [2,4]){
  const fast=await sample(speed,5);
  fast.forEach((v,i)=>assert(Math.abs(v-base[i]*speed)<1e-6 && v>0));
  const walk=await sample(1,20*speed);
  const same=await sample(speed,20);
  same.forEach((v,i)=>assert(Math.abs(v-walk[i])<1e-6));
 }
 console.log('PASS pause, 1x/2x/4x monster, employee, visitor displacement and world animation across waypoints');
})().catch(e=>{console.error(e);process.exitCode=1});
