'use strict';
// A battle-only upper-condition diagnostic. This does not estimate time to earn
// these levels, equipment or research and is not a progression simulation.
const fs=require('node:fs');
const path=require('node:path');
const {open}=require('./harness138.cjs');

function battleOnly(seed){
 let rng=seed>>>0;
 Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
 renderUI=()=>{};message=()=>{};toast=()=>{};save=()=>true;
 state=initial();ensureAdvanced();settleResidents();alignExistingEntrances();
 encounterPreviewCache199.clear();selectedBattleStage=0;
 state.adventure.stage=50;state.adventure.auto=false;state.adventure.bossLoop=null;
 state.research.battle=3;state.charms=3;
 for(const m of state.monsters){m.lv=99;equipCharm(m.id);}
 state.party=state.monsters.slice(0,3).map(m=>m.id);
 const party=crewParty().map(m=>({kind:m.kind,name:SPECIES[m.kind].name,level:m.lv,
  trait:TRAITS[m.trait].name,gift:GIFTS212[m.gift212].name,equip:m.equip,iv:{...m.iv},stats:allyStats(m)}));
 startAdventure();
 const fight=state.battle;
 if(!fight)throw Error('Stage 50 did not start');
 const enemies=fight.foes.map(f=>({name:f.name,hp:f.maxHp,attack:f.atk}));
 let guard=0;while(state.battle&&guard++<10000)adventureTick(false);
 return {seed,win:state.adventure.stage===51,unfinished:!!state.battle,
  rounds:fight.round,remainingPartyHp:fight.ourHp,maxPartyHp:fight.ourMax,
  remainingEnemyHp:fight.foes.reduce((sum,f)=>sum+Math.max(0,f.hp),0),enemies,party};
}

async function main(){
 const q=await open('working',{},'window.qa138.battleOnly12416=('+battleOnly.toString()+');');
 try{
  const seeds=[1,7,42,123,987,2026,31415,65535,99991,4294967295];
  const runs=seeds.map(seed=>q.f.battleOnly12416(seed));
  const result={purpose:'Battle-only reachability diagnostic, not a clear-time estimate',
   conditions:{stage:50,party:'initial species 0/1/2',level:99,earnedEquipmentAssumed:true,
    battleResearch:3,talentFruitUsed:0,otherResearch:0,initialTalentsAndTraits:'seeded natural rolls'},
   wins:runs.filter(r=>r.win).length,total:runs.length,runs};
  const file=path.join(__dirname,'results','stage50-reachability-1.24.16.json');
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({wins:result.wins,total:result.total,runs:runs.map(r=>({seed:r.seed,win:r.win,rounds:r.rounds,ourHp:r.remainingPartyHp,enemyHp:r.remainingEnemyHp}))}));
 }finally{q.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
