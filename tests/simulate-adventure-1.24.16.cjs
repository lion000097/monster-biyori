'use strict';

// Run with MONSTER_QA_JSDOM pointing at an installed jsdom package if it is not
// resolvable normally. This uses the actual game simulation, without rendering.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {open} = require('./harness138.cjs');
const {createTreeManager} = require('./tree-policy-1.24.16.cjs');

// This function is injected into the shipped script's lexical scope. Keep it
// self-contained: all progression functions below are the game's own functions.
function simulateProgression12416(seed, options = {}) {
  let rng = seed >>> 0;
  Math.random = () => ((rng = (Math.imul(rng,1664525)+1013904223) >>> 0) / 4294967296);
  renderUI=()=>{}; drawWorld=()=>{}; drawBattle=()=>{}; updateBattleStats=()=>{};showBattleOutcome=()=>{};
  toast=()=>{}; message=()=>{}; save=()=>true; saveBackup213=()=>true;
  requestAnimationFrame=()=>0;
  state=initial(); settleResidents(); ensureAdvanced(); alignExistingEntrances();
  encounterPreviewCache199.clear();selectedBattleStage=0;
  state.staff.forEach(addCitizen);
  state.quests=[createQuest(0),createQuest(1),createQuest(2)];state.questSequence=3;
  const s=state, visitSeconds=(options.visitMinutes||10)*60;
  const maxSeconds=(options.maxHours||500)*3600;
  const targetStage=options.targetStage||51;
  const manager=createTreeManager12416(s,options);
  if(!manager.build('shop')||!manager.build('ranch'))throw Error('Free starter placement failed');
  // These lookups depend only on map geometry. Cache them between management
  // actions, never during construction. Copies keep mutable actor paths private.
  // This changes execution cost only, not game time, random calls or movement.
  let geometryStable=true;
  const geometryCaches=[];
  const spatialOriginal={isWalkable,isPath,getBuildingAt,residentRoad,pathTo};
  function spatialCache(fn){
    const cache=new Map();geometryCaches.push(cache);
    return (x,y)=>{
      if(!geometryStable||!Number.isInteger(x)||!Number.isInteger(y))return fn(x,y);
      const key=x+','+y;
      if(!cache.has(key))cache.set(key,fn(x,y));
      return cache.get(key);
    };
  }
  if(options.memoizeSpatial!==false){
    isWalkable=spatialCache(isWalkable);isPath=spatialCache(isPath);
    getBuildingAt=spatialCache(getBuildingAt);residentRoad=spatialCache(residentRoad);
    const paths=new Map();geometryCaches.push(paths);
    pathTo=function(sx,sy,ex,ey,roadOnly=false){
      if(!geometryStable)return spatialOriginal.pathTo(sx,sy,ex,ey,roadOnly);
      const key=[clamp(Math.round(sx),MIN_X,W-1),clamp(Math.round(sy),MIN_Y,H-1),ex,ey,!!roadOnly].join(',');
      if(!paths.has(key))paths.set(key,spatialOriginal.pathTo(sx,sy,ex,ey,roadOnly));
      return paths.get(key).map(p=>p.slice());
    };
  }
  s.adventure.auto=true;s.speed=1;
  const stageMilestones=[],periodic=[];
  let tree20Seconds=null,stage50Seconds=null,seconds=0,nextVisit=visitSeconds,nextReport=3600;
  const actions={equip:0,train:0,fruit:0,bossSwitches:0};
  const battleCounts={wins:0,losses:0,rounds:0};
  let queuedFarm=0;
  function setAutoAdventure(enabled){
    if(s.adventure.auto===enabled)return;
    const button=document.createElement('button');button.dataset.action='adventureAuto';
    document.body.appendChild(button);button.click();button.remove();
  }
  const previousAdventureTick=adventureTick;
  adventureTick=function(silent){
    const before=s.battle,stage=s.adventure.stage,round=before?.round||0,loop=s.adventure.bossLoop;
    previousAdventureTick(silent);
    if(before&&before.round>round)battleCounts.rounds++;
    if(before&&!s.battle){
      if(before.foes?.every(f=>f.hp<=0))battleCounts.wins++;
      else {
        battleCounts.losses++;
        if(options.bossTraining){
          // A failed new stage sends the party back to the latest beaten boss.
          // If that loop itself fails, use the previous cleared boss instead.
          const boss=loop?loop-5:Math.floor((s.adventure.stage-1)/5)*5;
          if(boss>=5&&canRepeatBoss(boss)){setAutoAdventure(false);queuedFarm=boss;}
        }
      }
    }
    if(s.adventure.stage>stage){
      stageMilestones.push({seconds:+seconds.toFixed(1),clearedStage:stage,
        label:stageLabel(stage),tree:s.villageLv,party:crewParty().map(m=>({kind:m.kind,name:SPECIES[m.kind].name,level:m.lv,equip:m.equip,iv:{...m.iv}}))});
      if(s.adventure.stage>=targetStage&&stage50Seconds===null)stage50Seconds=+seconds.toFixed(1);
    }
  };
  let simulatedNow=0;
  performance.now=()=>simulatedNow;
  frameAt=0;tickAccum=0;motionBuffer137=0;battleElapsed199=0;uiAt=0;savingAt=0;
  const stats=()=>({...manager.stats(),seconds:+seconds.toFixed(1),
    maxLevel:Math.max(...s.monsters.map(m=>m.lv)),battle:{...battleCounts},actions:{...actions},
    goldPerDay:s.economy.lastIncome,food:s.food,stock:s.stock,customers:s.shopStats211?.customers||0,
    research:{...s.research}});
  function manageAdventure(){
    // Keep the game's default highest-level party. No rare roll is guaranteed,
    // and no monster, currency, experience, or equipment is granted.
    for(const m of crewParty())if(!m.equip&&s.charms>0){equipCharm(m.id);actions.equip++;}
    if(options.bossTraining){
      // At each normal check-in, leave farming and try forward progress again.
      // The ongoing battle is allowed to finish; no fight is cancelled/reset.
      queuedFarm=0;
      if(s.adventure.bossLoop)toggleBossLoop(s.adventure.bossLoop);
      setAutoAdventure(true);
    }
    if(options.training){
      for(const m of crewParty()){
        const cost=22+Math.floor(m.lv*.9);
        if(s.food>=cost+80&&s.coins>=treeCost193().coins+45+1000){
          trainMonster(m.id);actions.train++;
        }
      }
    }
  }
  // Exact game-sized motion steps. With 100 ms visible frames the shipped
  // animate loop runs one economy hour per 16 s and one battle round per 1.8 s.
  const totalSteps=Math.ceil(maxSeconds*10);
  for(let step=1;step<=totalSteps;step++){
    seconds=step/10;simulatedNow=seconds*1000;
    animate(simulatedNow);
    if(queuedFarm&&!s.battle){
      const boss=queuedFarm;queuedFarm=0;
      toggleBossLoop(boss);if(s.adventure.bossLoop===boss)actions.bossSwitches++;
    }
    if(seconds>=nextVisit){
      geometryStable=false;
      manager.manage();manageAdventure();nextVisit+=visitSeconds;
      geometryCaches.forEach(cache=>cache.clear());geometryStable=true;
      if(s.villageLv>=20&&tree20Seconds===null)tree20Seconds=seconds;
      if([s.coins,s.food,s.magic,s.stock].some(n=>!Number.isFinite(n)||n<-.000001))throw Error('Invalid resource ledger at '+seconds);
      const held=s.materialStock211.reduce((a,b)=>a+b,0);
      if(Math.abs(held-s.stock)>1e-6)throw Error('Stock ledger mismatch at '+seconds);
    }
    // Purely visual particles otherwise disappear during drawWorld, which is
    // intentionally disabled above.
    if(step%160===0)swirls=[];
    if(seconds>=nextReport){
      periodic.push(stats());nextReport+=3600;
      if(typeof window.progress12416==='function')window.progress12416({
        ...periodic.at(-1),tree20Seconds,stage50Seconds,
        treeMilestones:manager.milestones,stageMilestones,randomState:rng,
        economyClock:{ticks:s.ticks,tickAccum,battleElapsed199}
      });
    }
    if(tree20Seconds!==null&&stage50Seconds!==null)break;
    if(options.stopAtTree&&tree20Seconds!==null)break;
  }
  adventureTick=previousAdventureTick;
  ({isWalkable,isPath,getBuildingAt,residentRoad,pathTo}=spatialOriginal);
  return {seed,version:GAME_APP_VERSION,options:{visitMinutes:visitSeconds/60,maxHours:maxSeconds/3600,
    training:!!options.training,bossTraining:!!options.bossTraining,orders:options.orders!==false,stepSeconds:.1,
    spatialMemoization:options.memoizeSpatial!==false,
    strategy:'Start free shop/ranch; automatic adventure; check facilities, tree, staff, research and earned charms at each visit; real movement and legal roads; no guaranteed rare monsters'+(options.bossTraining?'; after a frontier loss, use the latest cleared boss loop until the next check-in, then try forward progress again':'; no boss farming')},
    tree20Seconds,stage50Seconds,treeMilestones:manager.milestones,stageMilestones,
    periodic,final:stats(),buildings:s.buildings.map(b=>({type:b.type,level:b.level,x:b.x,y:b.y,facing:b.facing})),
    unreachableEntrances:s.buildings.filter(b=>b.type!=='worldtree'&&!entranceRoads(b).length).map(b=>b.type),
    complete:tree20Seconds!==null&&stage50Seconds!==null};
}

async function main(){
  const args=process.argv.slice(2);
  const seeds=(args[0]||'7').split(',').map(Number),maxHours=Number(args[1]||200),visitMinutes=Number(args[2]||10);
  const filename=args[3]||path.join(__dirname,'results','simulation-1.24.16.json');
  const options={maxHours,visitMinutes,training:args.includes('--training'),bossTraining:args.includes('--boss-training'),stopAtTree:args.includes('--stop-at-tree'),memoizeSpatial:!args.includes('--no-spatial-cache')};
  const source=fs.readFileSync(path.join(__dirname,'..','game.html'));
  const report={sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),generatedAt:new Date().toISOString(),runs:[]};
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  for(const seed of seeds){
    const q=await open('working',{},'const createTreeManager12416=('+createTreeManager.toString()+');window.qa138.simulateProgression12416=('+simulateProgression12416.toString()+');');
    try{
      const wall=Date.now();
      q.w.progress12416=p=>{
        const partial={sourceSha256:report.sourceSha256,seed,options,partial:true,
          wallSeconds:(Date.now()-wall)/1000,...p};
        fs.writeFileSync(filename.replace(/\.json$/,'.partial.json'),JSON.stringify(partial,null,2)+'\n');
        console.error(JSON.stringify({progressHours:Math.round(p.seconds/3600),seed,tree:p.level,stage:p.stage,
          party:p.partyLevels,coins:p.coins,magic:p.magic,buildings:p.buildings,wallSeconds:partial.wallSeconds}));
      };
      const result=q.f.simulateProgression12416(seed,options);
      result.wallSeconds=(Date.now()-wall)/1000;report.runs.push(result);
      fs.writeFileSync(filename,JSON.stringify(report,null,2)+'\n');
      console.log(JSON.stringify({seed,complete:result.complete,treeHours:result.tree20Seconds===null?null:result.tree20Seconds/3600,stageHours:result.stage50Seconds===null?null:result.stage50Seconds/3600,final:result.final,wallSeconds:result.wallSeconds}));
    }finally{q.close();}
  }
}
module.exports={simulateProgression12416};
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
