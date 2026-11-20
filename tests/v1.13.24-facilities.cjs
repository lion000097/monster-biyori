'use strict';
const {assert,open}=require('./harness138.cjs');
const hooks=`
window.qa138.facilityTests=()=>{
 const s=state,m=s.monsters[0];
 s.monsters=[m];s.staff=[];s.guests=[];s.speed=1;s.hour=12;
 const types=Object.keys(B), missing=types.filter(t=>!facilityActivities[t]);
 if(missing.length)throw Error('missing facility: '+missing);
 let seen=0;
 const original=ctx.fillText,labels=[];
 ctx.fillText=function(label,...args){labels.push(label);return original.call(this,label,...args)};
 try{
  for(const type of types){
   const site={id:123,type,x:6,y:6,level:1};
   s.buildings=[site];m.x=4;m.y=6;m.path=[];m.ranchTarget200=null;
   const timer=monsterWalkTimer139(m);timer.visit=null;timer.needsRanch=false;
   if(!chooseFacilityVisit(m,timer,'work'))throw Error('no route: '+type);
   const xp=m.xp;
   for(let step=0;timer.visit?.remaining===null&&step<2500;step++)stepActors(.032);
   if(!(timer.visit?.remaining>0)||m.act!==facilityActivities[type][1])throw Error('no activity: '+type);
   if(Math.hypot(m.x-timer.visit.goal[0],m.y-timer.visit.goal[1])>.25)throw Error('wrong position');
   const x=m.x,y=m.y;labels.length=0;drawWorld(1000);
   if(!labels.includes(facilityActivities[type][0]))throw Error('missing bubble: '+type);
   for(let i=0;i<40;i++)stepActors(.032);
   if(m.x!==x||m.y!==y)throw Error('moved during interaction');
   if(type==='school'){
    if(m.xp!==xp+1)throw Error('practice XP');
    timer.visit.remaining=null;advanceFacilityVisit(m,.03);
    if(m.xp!==xp+1)throw Error('duplicate reward');
   }
   site.x+=1;advanceFacilityVisit(m,.032);
   if(timer.visit)throw Error('stale facility');
   seen++;
  }
 }finally{ctx.fillText=original}
 return seen;
};`;
(async()=>{const q=await open('1.13.24',{},hooks);try{const count=q.f.facilityTests();assert(count>=26);console.log('PASS arrival, bubble, action, position, moved facilities for '+count+' facility types; practice reward once per day')}finally{q.close()}})().catch(e=>{console.error(e);process.exitCode=1});
