'use strict';
// Usage: node tests/simulate-world-tree-1.25.5.cjs GAME_HTML SEEDS HOURS MINUTES OUT.json [--continue-adventure]
// This version wraps the existing 100ms real-game simulator, without modifying
// the source being measured or its release. The standard stop is World Tree 20.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const [input='game.html',seeds='7,23,91',max='75',minutes='25',output='tree-1.25.5.json',...flags]=process.argv.slice(2);
const allowed=new Set(['--continue-adventure','--no-spatial-cache']);
if(!flags.every(x=>allowed.has(x)))throw Error('Unknown flag; only --continue-adventure / --no-spatial-cache');
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
 source=editExact(source,'research:{...s.research}});',`research:{...s.research},treeGate:(()=>{
   const cost=treeCost193(),required=treeRequirementStatus193(s.villageLv+1);
   return {xp:villageThreshold(s.villageLv),coins:cost.coins,magic:cost.magic,
     missing:required.filter(item=>!item.ok).map(item=>item.type)};
  })()});`);
 // Wait for native image callbacks, so JSDOM never disposes the document
 // with image callbacks still pending once the synchronous simulation finishes.
 let harness=fs.readFileSync(path.join(dest,'harness138.cjs'),'utf8');
 harness=editExact(harness,'ready:()=>!!(colorIndices&&lionReady)','ready:()=>!!(colorIndices&&lionReady&&facilitySheetReady&&villageSheetReady&&treeDecorationReady&&expeditionOfficeSheet.complete)');
 fs.writeFileSync(path.join(dest,'harness138.cjs'),harness);
 fs.writeFileSync(path.join(dest,script),source);
 const args=[path.join(dest,script),seeds,max,minutes,path.resolve(output)];
 if(!flags.includes('--continue-adventure'))args.push('--stop-at-tree');
 if(flags.includes('--no-spatial-cache'))args.push('--no-spatial-cache');
 const r=spawnSync(process.execPath,args,{env:process.env,stdio:'inherit'});
 if(r.error)throw r.error;
 process.exitCode=r.status??1;
}finally{fs.rmSync(dir,{recursive:true,force:true});}
