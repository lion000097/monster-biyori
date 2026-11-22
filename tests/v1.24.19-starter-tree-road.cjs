'use strict';
const {open,assert,clone,persist,wait}=require('./harness138.cjs');
const hook=`window.starterTreeQa={
 ready:()=>facilitySheetReady&&villageSheetReady&&treeDecorationReady&&expeditionOfficeSheet.complete,
 inspect(){
  const tree=state.buildings.find(b=>b.type==='worldtree');
  const door=frontPoint(tree.type,tree.x,tree.y,tree.facing,.5,.5).map(Math.floor);
  return {door,route:pathTo(...door,10,7,true),hasDoor:residentRoad(...door),
   paths:state.paths,removed:state.removedDefaultPaths,buildings:state.buildings,clearScenery:state.clearedScenery,clearPonds:state.clearedPonds};
 },
 customize(){
  state.paths.push('4,6');
  state.removedDefaultPaths.push('10,12');
  save(true);
 },
 reset
};`;
async function game(version,storage={}){
 const q=await open(version,storage,hook);
 for(let i=0;!q.w.starterTreeQa.ready()&&i<100;i++)await wait(25);
 assert(q.w.starterTreeQa.ready(),'all atlas images loaded');
 return q;
}
function checkFresh(q,baseline){
 const actual=clone(q.w.starterTreeQa.inspect());
 assert.equal(actual.hasDoor,true,'middle of the visible entrance touches a road');
 assert.deepEqual(actual.door,[10,16]);
 assert.deepEqual(actual.route,Array.from({length:9},(_,i)=>[10,15-i]),'road is a straight extension of the main road spine');
 assert.deepEqual([...actual.paths].sort(),['10,14','10,15','10,16',...baseline.paths].sort());
 for(const key of ['buildings','clearScenery','clearPonds','removed']) assert.deepEqual(actual[key],baseline[key],key+' preserved');
}
(async()=>{
 const previous=await game('1.24.18');
 let baseline,customized,storage;
 try{
  baseline=clone(previous.w.starterTreeQa.inspect());
  assert.deepEqual(baseline.door,[10,16]);
  assert.equal(baseline.hasDoor,false,'published version reproduced the missing central road');
  previous.w.starterTreeQa.customize();
  customized=clone(previous.w.starterTreeQa.inspect());
  storage=persist(previous.w);
 }finally{previous.close();}
 const first=await game('working');
 try{checkFresh(first,baseline);}finally{first.close();}
 const loaded=await game('working',storage);
 try{
  assert.deepEqual(clone(loaded.w.starterTreeQa.inspect()),customized,'loading an existing edited ranch must not add or replace roads');
  loaded.w.starterTreeQa.reset();
  checkFresh(loaded,baseline);
 }finally{loaded.close();}
 console.log('PASS fresh/reset center-gate road, unchanged existing edited save and scenery');
})().catch(error=>{console.error(error);process.exitCode=1;});
