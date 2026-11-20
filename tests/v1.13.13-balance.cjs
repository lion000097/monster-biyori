'use strict';
const {open, assert} = require('./harness138.cjs');

// Run the shipped rules from a fresh ranch. Only display, persistence and travel are
// compressed. One tick is one in-game hour (16 seconds at 1x), including wages and meals.
function playRanch(seed, visitMinutes, maxHours, takeOrders) {
  let rng=seed>>>0;
  Math.random=() => ((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
  renderUI=()=>{}; save=()=>true; toast=()=>{}; message=()=>{}; saveBackup213=()=>true;
  state=initial(); ensureAdvanced(); state.staff.forEach(addCitizen);
  state.quests=[createQuest(0),createQuest(1),createQuest(2)]; state.questSequence=3;
  const s=state, every=Math.max(1,Math.round(visitMinutes*60/16));
  const workDue=new Map(), ranchDue=new Map(), gather=ranchProduction200;
  // Keep the real spawn, search, job cooldown and checkout rules. Approximate
  // walking/queuing with 1–3 game hours each way rather than rendering every footstep.
  visitorEntry101=([x,y])=>({x,y,path:[[x,y]]});
  nearestPlace=(x,y,tx,ty)=>[tx,ty+1];
  seek=(actor,job)=>{
    if(!actor.job||actor.jobCooldown211>0||workDue.has(actor))return;
    const sites=s.buildings.filter(b=>b.type===workplaceType211(job));
    if(sites.length)workDue.set(actor,{at:s.ticks+1+Math.floor(Math.random()*3),b:rnd(sites)});
  };
  ranchProduction200=m=>{
    if(!ranchDue.has(m)&&s.buildings.some(b=>b.type==='ranch'))
      ranchDue.set(m,s.ticks+1+Math.floor(Math.random()*3));
  };
  function arrivals(){
    for(const [actor,work] of workDue)if(s.ticks>=work.at){
      workAtSite211(actor,work.b);workDue.delete(actor);
    }
    for(const [m,when] of ranchDue)if(s.ticks>=when){
      gather(m,true);ranchDue.delete(m);
    }
    for(const g of s.guests){
      if(g.due==null)g.due=s.ticks+2+Math.floor(Math.random()*3);
      if(s.ticks>=g.due&&!g.arrived211)arriveTourist211(g);
    }
    s.guests=s.guests.filter(g=>s.ticks<g.due+3);
    swirls=[];
  }
  const cells=[];
  for(let y=MIN_Y+1;y<H-1;y++)for(let x=MIN_X+1;x<W-1;x++)cells.push([x,y]);
  cells.sort((a,b)=>Math.hypot(a[0]-10,a[1]-8)-Math.hypot(b[0]-10,b[1]-8));
  function build(type){
    if(s.coins<(firstFree200(type)?0:B[type].cost)||s.villageLv<B[type].unlock)return false;
    const size=buildingMeta(type);
    const p=cells.find(([x,y])=>canBuild(x,y,null,false,type)&&
      (isWalkable(x-1,y)||isWalkable(x+size.w,y)||isWalkable(x,y-1)||isWalkable(x,y+size.h)));
    if(p){const count=s.buildings.length;place(type,...p);return s.buildings.length>count}
    const choice=ZONES.map((_,id)=>id).filter(zoneOpenable).sort((a,b)=>zonePrice(a)-zonePrice(b))[0];
    if(choice!==undefined&&s.coins>=zonePrice(choice)){unlockZone(choice);return build(type)}
    return false;
  }
  function develop(){
    for(const req of treeRequirementStatus193(s.villageLv+1)){
      if(req.ok)continue;
      const same=s.buildings.filter(b=>b.type===req.type).sort((a,b)=>b.level-a.level);
      const unfinished=same.find(b=>b.level<req.minLevel);
      if(unfinished){
        if(s.coins<costUpgrade(unfinished))return false;
        const lv=unfinished.level;upgrade(unfinished.id);return unfinished.level>lv;
      }
      return build(req.type);
    }
    return false;
  }
  const roles=['keeper','gather','sell','explore','study','gather','explore','sell'];
  const milestones=[],periodic=[];
  function stats(){
    return {hour:+(s.ticks*16/3600).toFixed(2),level:s.villageLv,G:Math.floor(s.coins),food:Math.floor(s.food),
      stock:Math.floor(s.stock),magic:Math.floor(s.magic),fame:Math.floor(s.fame),xp:Math.floor(s.villageXp),
      monster:s.monsters[0].lv,staff:s.staff[0].level,allies:s.monsters.length,employees:s.staff.length,
      sales:s.shopStats211?.customers||0,orders:s.economy.ordersDone,stage:s.adventure.stage};
  }
  function manage(){
    if(takeOrders){
      const order=typeof currentMarketOrder==='function'?currentMarketOrder():MARKET_ORDERS[s.economy.ordersDone%MARKET_ORDERS.length];
      if(s.stock>=order.stock&&s.food>=order.food)completeOrder();
      if(s.vipOrder211&&s.materialStock211[s.vipOrder211.id]>=s.vipOrder211.qty)deliverVIP211();
    }
    const wanted=Math.min(roles.length,2+Math.floor(s.villageLv/2));
    if(s.staff.length<wanted&&s.coins>=800+s.staff.length*140){
      hire();s.staff.forEach((w,i)=>{w.job=roles[i]});
    }
    if(s.buildings.some(b=>b.type==='lab')&&s.coins>1800){
      const target=Math.min(3,1+Math.floor((s.villageLv-5)/5));
      for(const type of ['market','train','farm','quest','battle']){
        if(s.research[type]<target&&s.magic>treeCost193().magic+RESEARCH[type].cost*Math.pow(1.47,s.research[type])){
          doResearch(type);break;
        }
      }
    }
    while(develop()){}
    const cost=treeCost193();
    if(s.villageXp>=villageThreshold(s.villageLv)&&s.coins>=cost.coins&&s.magic>=cost.magic&&
       treeRequirementStatus193(s.villageLv+1).every(r=>r.ok)){
      growWorldTree193();milestones.push(stats());
    }
    chooseExpedition(reachedExpeditionStage()-1);
  }
  if(!build('shop')||!build('ranch'))throw Error('Free starter placement failed');
  // As in automatic adventure, clear available stages. Retry after a failed
  // encounter at the next check-in; combat rewards come from real victorious rounds.
  let nextFight=0;
  for(let i=0;i<Math.ceil(maxHours*3600/16)&&s.villageLv<20;i++){
    advanceExpeditionClock(16);tick(false);arrivals();
    if(s.ticks>=nextFight){
      if(!s.battle)startAdventure();
      const n=s.adventure.stage;
      for(let j=0;j<8&&s.battle;j++)adventureTick(false);
      nextFight=s.ticks+(!s.battle&&s.adventure.stage===n?every:1);
    }
    if(s.ticks%every===0)manage();
    if(s.ticks%2250===0)periodic.push(stats());
  }
  const result={seed,visitMinutes,takeOrders,milestones,periodic,final:stats()};
  const held=s.materialStock211.reduce((a,b)=>a+b,0);
  if(Math.abs(s.stock-held)>1e-6||[s.coins,s.food,s.stock,s.magic,s.fame].some(n=>!Number.isFinite(n)||n<0))throw Error('Resource ledger mismatch');
  return result;
}
async function main(){
  const [version='1.13.13',seed='7',minutes='10',hours='80',orders='yes']=process.argv.slice(2);
  const q=await open(version,{},'window.qa138.playRanch='+playRanch.toString()+';');
  try{
    const r=q.f.playRanch(+seed,+minutes,+hours,orders!=='no');
    if(process.env.BALANCE_REPORT)require('node:fs').writeFileSync(process.env.BALANCE_REPORT,JSON.stringify(r,null,2));
    console.log(JSON.stringify({version,seed:r.seed,visit:r.visitMinutes,final:r.final,gates:r.milestones.map(m=>m.level+'@'+m.hour)}));
    if(version==='1.13.13'&&minutes==='10'&&orders==='yes'&&+hours>=68){
      assert.equal(r.final.level,20);
      assert(r.final.hour>=54&&r.final.hour<=66,'standard Lv.20 window');
      assert(r.final.monster>=27&&r.final.monster<=39,'first monster within the intended growth range');
      assert(r.final.staff>=19&&r.final.staff<=29,'first employee within the intended growth range');
    }
  }finally{q.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
