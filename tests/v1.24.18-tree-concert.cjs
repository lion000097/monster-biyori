'use strict';
const {assert,open,wait}=require('./harness138.cjs');
const hook=`Object.assign(window.qa138,{
 run(){
  const check=(ok,label)=>{if(!ok)throw Error(label);};
  const tree=state.buildings.find(b=>b.type==='worldtree');
  Object.assign(tree,{x:10,y:10});
  state.zones=[0,1,4,5];state.buildings=[tree];state.speed=1;state.day=5;state.hour=18;
  state.paths=['9,10','9,11','9,12'];state.clearedScenery=state.paths.slice();state.clearedPonds=state.paths.slice();state.ponds=[];
  weatherInfo=()=>({name:'晴れ'});
  const g={id:800,x:9,y:10,act:'帰る',phase212:'leave',arrived211:true,route212:[[9,11],[9,12]]};
  const queued={...g,id:801,phase212:'queue'};
  const listener={...state.monsters[0],x:9,y:11,path:[],indoorRest:null,ranchTarget200:null};
  state.guests=[queued,g];
  const saved=JSON.stringify(g),funds=[state.coins,state.food,state.magic,state.stock];
  stepTreeConcert(.1);
  check(treeConcert?.guest===g&&treeConcertListener(listener),'returning guest plays and nearby idle companion notices');
  listener.path=[[9,12]];check(!treeConcertListener(listener),'moving companion is not interrupted');
  animateGuest212(g,1);check(JSON.stringify(g)===saved,'concert stays out of save and retains the route');
  stepTreeConcert(9);check(!treeConcert,'ends after brief performance');stepTreeConcert(.1);
  check(!treeConcert,'does not repeat on the same day');
  state.day=6;weatherInfo=()=>({name:'雨'});stepTreeConcert(.1);check(!treeConcert,'no rain concert');
  weatherInfo=()=>({name:'晴れ'});stepTreeConcert(.1);check(treeConcert?.guest===g,'new day starts');
  state.hour=20;stepTreeConcert(.1);check(!treeConcert,'ends at night');animateGuest212(g,.2);
  check(g.y>10&&g.route212.length,'normal return walk resumes');
  check(JSON.stringify(funds)===JSON.stringify([state.coins,state.food,state.magic,state.stock]),'no earnings or resources awarded');
 },
 assets:()=>facilitySheetReady&&villageSheetReady&&expeditionOfficeSheet.complete
});`;
(async()=>{
 const g=await open('working',{},hook);
 try{
  for(let i=0;i<150&&!g.f.assets();i++)await wait(20);
  assert(g.f.assets());g.f.run();
  console.log('PASS tree concert timing, guest route and save isolation, listener priority, no rewards');
 }finally{g.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
