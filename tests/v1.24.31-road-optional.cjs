'use strict';
const {open,wait}=require('./harness138.cjs');
const hook=`
window.qaRoadOptional131=()=>{
 const check=(ok,label)=>{if(!ok)throw Error(label)};
 const park=()=>{
  state.buildings=[];state.staff=[];state.monsters=[];state.guests=[];state.ponds=[];
  state.paths=[];state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];state.clearedScenery=[];state.clearedPonds=[];
  state.zones=[0,1,4,5];state.stoneTiles={};state.speed=0;state.coins=100000;state.villageLv=state.worldTreeLevel=20;
  for(let x=0;x<=21;x++)for(let y=0;y<=17;y++){state.clearedScenery.push(keyXY(x,y));state.clearedPonds.push(keyXY(x,y));}
  buildMode=null;moveMode=null;placementFacing=0;
 };
 for(const [i,type] of ['lamp211','shirovane130'].entries()){
  park();const x=4+i*4,y=4;
  const due=constructionCost(type);
  place(type,x,y);
  let prop=getBuildingAt(x,y);
  check(prop?.type===type&&state.coins===100000-due,'isolated grass placement and normal price '+type);
  check(!entranceRoads(prop).length&&!isPath(x,y),'isolated prop has no invented road '+type);
  for(const next of [1,2,3,0]){
   setFacilityFacing({building:prop,direction:validFacing(prop.facing),preview:false},next);
   check(prop.facing===next,'rotate away from road '+type+'/'+next);
  }
  startMoving(prop.id);placementFacing=3;moveBuilding(x,9);
  check(getBuildingAt(x,9)===prop&&!getBuildingAt(x,y)&&prop.facing===3,'relocate to isolated grass '+type);
  const id=prop.id;
  check(save(true)&&load(),'roundtrip '+type);
  prop=state.buildings.find(b=>b.id===id);
  check(prop&&prop.facing===3&&!entranceRoads(prop).length,'isolated facing intact on reload '+type);
  putTerrain('road',x+1,9);
  check(residentRoad(x+1,9)&&entranceRoads(prop).length,'add actual front road '+type);
  putTerrain('roadErase',x+1,9);
  check(!isPath(x+1,9)&&!entranceRoads(prop).length,'erase final front road without trapping prop '+type);
  putTerrain('stone',x,9);
  check(isPath(x,9)&&state.stoneTiles[keyXY(x,9)]===true,'existing road-underlay brush still works '+type);
  putTerrain('roadErase',x,9);
  check(!isPath(x,9)&&getBuildingAt(x,9)===prop,'road-underlay erase preserves prop '+type);
  putTerrain('road',x-1,9);
  putTerrain('roadErase',x-1,9);
  check(!residentRoad(x-1,9),'optional side road may also be erased');
  const n=state.buildings.length,coins=state.coins;
  placementFacing=0;place(type,x,9);
  check(state.buildings.length===n&&state.coins===coins,'overlap rejected without charge '+type);
  putTerrain('pond',x+2,9);check(isPond(x+2,9),'pond setup');
  place(type,x+2,9);
  check(!getBuildingAt(x+2,9)&&state.coins===coins,'water overlap rejected '+type);
 }
 park();
 for(const t of ['farm','bench211','onsen130']){
  const n=state.buildings.length,coins=state.coins;
  place(t,6,5);check(state.buildings.length===n&&state.coins===coins,'other facility still requires eligible road '+t);
 }
 state.paths.push('6,7');
 place('farm',6,5);
 const farm=getBuildingAt(6,5);
 check(farm?.type==='farm','farm positive control');
 setFacilityFacing({building:farm,direction:0,preview:false},3);check(farm.facing===0,'farm rotates only toward road');
 startMoving(farm.id);placementFacing=0;moveBuilding(9,9);
 check(farm.x===6&&farm.y===5,'ordinary farm may not relocate to roadless lot');
 cancelMoving();
 placementFacing=3;place('lamp211',5,7);check(getBuildingAt(5,7)?.type==='lamp211','shared optional lamp control');
 putTerrain('roadErase',6,7);
 check(isPath(6,7),'ordinary farm keeps its last frontage road');
 return 'lamp/vane isolated builds, all turns, move, saves, last-road removal, floor paint/erase, no overlap; ordinary buildings still guarded';
};
`;
(async()=>{
 const app=await open('working',{},hook);
 try{
  console.log('PASS '+app.w.qaRoadOptional131());
  await wait(200);
 }finally{app.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
