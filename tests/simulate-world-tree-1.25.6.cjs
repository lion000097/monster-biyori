'use strict';
// Usage: node tests/simulate-world-tree-1.25.6.cjs GAME_HTML SEEDS HOURS MINUTES OUT.json [--continue-adventure]
// This version wraps the existing 100ms real-game simulator, without modifying
// the source being measured or its release. The standard stop is World Tree 20.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const [input='game.html',seeds='7,23,91',max='75',minutes='25',output='tree-1.25.6.json',...flags]=process.argv.slice(2);
const allowed=new Set(['--continue-adventure','--no-spatial-cache','--no-orders','--target21']);
if(!flags.every(x=>allowed.has(x)))throw Error('Unknown simulation flag');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'monster-calibration-'));
function editExact(s,a,b){
 if(s.split(a).length!==2)throw Error('Unexpected simulator source: '+a);
 return s.replace(a,b);
}
try{
 const dest=path.join(dir,'tests');fs.mkdirSync(dest);
 fs.copyFileSync(path.resolve(input),path.join(dir,'game.html'));
 for(const file of ['harness138.cjs','tree-policy-1.24.16.cjs'])fs.copyFileSync(path.join(__dirname,file),path.join(dest,file));
 const script='simulate-adventure-1.24.16.cjs';
 let source=fs.readFileSync(path.join(__dirname,script),'utf8');
 // New-game startup gained the center gate connector in 1.24.19. Call it
 // when supplied to preserve the exact starter road on current releases.
 source=editExact(source,'state=initial(); settleResidents(); ensureAdvanced(); alignExistingEntrances();',
  "state=initial(); settleResidents(); ensureAdvanced(); alignExistingEntrances();\n  if(typeof connectStarterWorldTreeRoad==='function')connectStarterWorldTreeRoad();");
 // Snapshot exact gate inputs without changing the temporary simulation state.
 source=editExact(source,'research:{...s.research}});',`research:{...s.research},fame:s.fame,actionsEconomy:{...manager.actions},globalLedger:{...s.metrics,shopSales:s.shopStats211?.sales||0,shopUnits:s.shopStats211?.units||0},treeGate:(()=>{
   const cost=treeCost193(),required=treeRequirementStatus193(s.villageLv+1);
   let buildCoins=0,upgradeCoins=0,buildCount=0,upgradeCount=0;
   const detail=[];
   for(const req of required){
     const current=s.buildings.filter(b=>b.type===req.type);
     const newCount=Math.max(0,req.count-current.length);
     let up=0,n=0,build=0;
     for(let x=0;x<newCount;x++){
       // firstFree200 predicate changes when a first instance is purchased.
       build+=x===0?constructionCost(req.type):paidConstructionCost(req.type);
     }
     for(const b of [...current,...Array.from({length:newCount},()=>({type:req.type,level:1}))]){
       for(let lv=b.level;lv<req.minLevel;lv++){up+=costUpgrade({...b,level:lv});n++;}
     }
     buildCoins+=build;upgradeCoins+=up;buildCount+=newCount;upgradeCount+=n;
     if(!req.ok)detail.push({type:req.type,newCount,upgradeCount:n,buildCoins:build,upgradeCoins:up});
   }
   const fullCoins=cost.coins+buildCoins+upgradeCoins;
   const ranchGrant=typeof ranchGrantStatus1256==='function'?ranchGrantStatus1256():null;
   if(ranchGrant&&(ranchGrant.tree!==cost.coins||ranchGrant.upgrade!==upgradeCoins||ranchGrant.build!==buildCoins))
     throw Error('Budget estimator disagrees with game: '+JSON.stringify({ranchGrant,fullCoins,detail}));
   return {xp:villageThreshold(s.villageLv),coins:cost.coins,magic:cost.magic,
     fullCoins,buildCoins,upgradeCoins,buildCount,upgradeCount,ranchGrant,
     coinShortfall:Math.max(0,fullCoins-s.coins),
     magicShortfall:Math.max(0,cost.magic-s.magic),
     xpShortfall:Math.max(0,villageThreshold(s.villageLv)-s.villageXp),
     missing:required.filter(item=>!item.ok).map(item=>item.type),detail,
     nextTwoTreeFees:[1,2].map(i=>({level:s.villageLv+i,...treeCost193(s.villageLv+i),xp:villageThreshold(s.villageLv+i)}))};
  })()});`);
 source=editExact(source,'function setAutoAdventure(enabled){',`function paidConstructionCost(type){
   if(typeof ordinaryConstructionPrice1256==='function')return ordinaryConstructionPrice1256(type);
   if(!firstFree200(type))return constructionCost(type);
   // Plain paid price for duplicate first-free unlocks. Temporarily mark
   // only the first-free eligibility sentinel; do not add buildings or XP.
   const old=s.starterFacilities200;
   s.starterFacilities200={...old,[type]:true};
   try{return constructionCost(type);}
   finally{s.starterFacilities200=old;}
 }
 function setAutoAdventure(enabled){`);
 source=editExact(source,`stopAtTree:args.includes('--stop-at-tree')`,`orders:!args.includes("--no-orders"),maxTree:args.includes("--target21")?21:20,stopAtTree:args.includes('--stop-at-tree')`);
 source=editExact(source,'if(options.stopAtTree&&tree20Seconds!==null)break;','if(options.stopAtTree&&s.villageLv>=options.maxTree)break;');
 // Wait for native image callbacks, so JSDOM never disposes the document
 // with image callbacks still pending once the synchronous simulation finishes.
 let harness=fs.readFileSync(path.join(dest,'harness138.cjs'),'utf8');
 harness=editExact(harness,'ready:()=>!!(colorIndices&&lionReady)','ready:()=>!!(colorIndices&&lionReady&&facilitySheetReady&&villageSheetReady&&treeDecorationReady&&expeditionOfficeSheet.complete)');
 fs.writeFileSync(path.join(dest,'harness138.cjs'),harness);
 fs.writeFileSync(path.join(dest,script),source);
 const args=[path.join(dest,script),seeds,max,minutes,path.resolve(output)];
 if(!flags.includes('--continue-adventure'))args.push('--stop-at-tree');
 if(flags.includes('--no-orders'))args.push('--no-orders');
 if(flags.includes('--target21'))args.push('--target21');
 if(flags.includes('--no-spatial-cache'))args.push('--no-spatial-cache');
 const r=spawnSync(process.execPath,args,{env:process.env,stdio:'inherit'});
 if(r.error)throw r.error;
 process.exitCode=r.status??1;
}finally{fs.rmSync(dir,{recursive:true,force:true});}
