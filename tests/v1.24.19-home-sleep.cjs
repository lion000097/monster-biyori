'use strict';
const {open,assert,wait}=require('./harness138.cjs');
const hook=`
window.qaHomeSleep={
 ready:()=>facilitySheetReady&&villageSheetReady,
 verify(){
  const check=(value,label)=>{if(!value)throw Error(label);};
  const walk=seconds=>{for(let n=0;n<seconds*20;n++)stepActors(.05);};
  const home=()=>state.buildings.find(b=>b.type==='home');
  const inside=m=>m.indoorRest?.buildingId===home().id&&plotWalks.get(m)?.phase==='use';
  const id=home().id;
  check(entranceRoads(home()).length,'新規牧場のハウスに正面の道がある');
  state.speed=1;state.hour=20;
  for(const next of [21,22,23,0,1,2,3,4,5,6]){
   tick(false);check(state.hour===next,'実際の時計で'+next+'時');
   walk(16);
   if(next===21||next===22)continue;
   if(next===6){
    check(state.monsters.every(m=>!m.indoorRest),'朝に起きて再表示');
    continue;
   }
   check(state.monsters.every(inside),next+'時も全員がハウス内で就寝');
   if(next===23){
    const sleepState=JSON.stringify(state.monsters.map(m=>[m.id,m.indoorRest.remaining,m.facilityDoor]));
    const stable=[state.food,state.magic,state.coins,state.villageLv];
    check(save(true)&&load(),'就寝中のセーブを読み直せる');
    check(home().id===id&&state.monsters.every(inside)&&JSON.stringify(state.monsters.map(m=>[m.id,m.indoorRest.remaining,m.facilityDoor]))===sleepState,'夜中のセーブ後も同じハウスで就寝');
    check(JSON.stringify(stable)===JSON.stringify([state.food,state.magic,state.coins,state.villageLv]),'資源と世界樹は引き継がれる');
    const actors=[],bubbles=[],paintActor=drawMapActor,bubble=drawMapBubble;
    drawMapActor=(actor,...args)=>{actors.push(actor.id);return paintActor(actor,...args);};
    drawMapBubble=(x,y,icon,now,b)=>{if(icon==='Zz')bubbles.push(b);return bubble(x,y,icon,now,b);};
    try{drawWorld(100);}
    finally{drawMapActor=paintActor;drawMapBubble=bubble;}
    check(bubbles.length===1&&bubbles[0]===id&&state.monsters.every(m=>!actors.includes(m.id)),'屋根に吹き出し一つ、就寝中の姿は非表示');
   }
  }
  for(let facing=0;facing<4;facing++){
   const relocated={type:'home',id:901,x:5+facing,y:6,level:1,facing},disconnected={type:'home',id:902,x:16,y:3,level:1,facing:0};
   state.buildings=[disconnected,relocated];state.staff=[];state.guests=[];state.day++;state.hour=22;
   state.paths=[];state.ponds=[];state.clearedScenery=[];state.clearedPonds=[];state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];
   for(let x=2;x<13;x++)for(let y=2;y<13;y++){
    const key=keyXY(x,y);state.clearedPonds.push(key);state.clearedScenery.push(key);
    if(!getBuildingAt(x,y))state.paths.push(key);
   }
   const m=makeMonster(910,0,3,7),timer=monsterWalkTimer139(m);
   state.monsters=[m];state.party=[m.id];timer.nextRest=0;timer.wait=0;
   check(entranceRoads(relocated).length&&!entranceRoads(disconnected).length,'正面の道とつながらないハウスを作る');
   walk(12);
   check(m.indoorRest?.buildingId===relocated.id&&plotWalks.get(m)?.phase==='use','到達できるハウスを探して実際に入る：向き'+facing);
   check(entranceRoads(relocated).some(([x,y])=>x===m.facilityDoor[0]&&y===m.facilityDoor[1]),'正面から入る：向き'+facing);
   const [x,y]=m.facilityDoor;state.hour=6;
   for(let n=0;n<200&&plotWalks.has(m);n++)stepActors(.05);
   check(!m.indoorRest&&!plotWalks.has(m)&&m.x===x&&m.y===y,'起床すると同じ正面から戻る：向き'+facing);
  }
  return true;
 }
};
`;
(async()=>{
 const game=await open(process.argv[2]||'working',{},hook);
 try{
  for(let i=0;i<80&&!game.w.qaHomeSleep.ready();i++)await wait(25);
  assert(game.w.qaHomeSleep.ready());
  game.w.Math.random=()=>.5;
  assert(game.w.qaHomeSleep.verify());
  console.log('PASS natural overnight indoor sleep, isolated-room fallback, four facing entrances, save/load and morning exit');
 }finally{game.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
