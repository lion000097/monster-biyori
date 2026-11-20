'use strict';
const {assert, open, backing, click, change, persist, KEY, wait} = require('./harness138.cjs');
const {createHash} = require('node:crypto');
const version=process.env.MONSTER_TARGET_VERSION||'working';
const hooks=`Object.assign(window.qa138,{
 readyTourism:()=>villageSheetReady&&facilitySheetReady, standArt, art:spriteBuildingV161, first:RELIC_START192,
 place, visit:visitTick, walk:animateGuest212, plot:g=>plotWalks.get(g),
 select(id){selectedBuilding=id; tab='build'; renderUI(true)},
 layout(){
  state.speed=0;state.villageLv=state.worldTreeLevel=12;state.coins=9000;
  const tree=state.buildings.find(b=>b.type==='worldtree');tree.level=12;
  state.buildings=[tree];state.guests=[];state.paths=['6,8','7,8'];
  state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];state.zones=[0,1,4,5];state.ponds=[];
  state.clearedScenery=[];state.clearedPonds=[];
  for(let x=0;x<22;x++)for(let y=0;y<20;y++){state.clearedScenery.push(keyXY(x,y));state.clearedPonds.push(keyXY(x,y));}
  for(const a of [...state.monsters,...state.staff]){a.x=7;a.y=8;a.path=[];}
  placementFacing=0;selectedBuilding=null;
 }
});`;
const artHash=c=>createHash('sha256').update(backing(c).getContext('2d').getImageData(0,0,c.width,c.height).data).digest('hex');
async function ranch(storage={}) {
 const g=await open(version,storage,hooks);
 for(let i=0;i<100&&!g.f.readyTourism();i++)await wait(20);
 assert(g.f.readyTourism());return g;
}
async function run(){
 const game=await ranch();let stored,standId;
 try{
  const {f,d,w}=game,s=f.state();f.layout();f.registerRelics192(12);s.treasures=[0,f.first,f.first+12,f.first+13];
  f.render('build');click(d,'[data-facility-role="tourism"]');click(d,'[data-action="build"][data-id="relicStand"]');
  f.place('relicStand',3,3);assert(!s.buildings.some(b=>b.type==='relicStand'));assert.equal(s.coins,9000);
  f.place('relicStand',6,6);const stand=s.buildings.find(b=>b.type==='relicStand');assert(stand);standId=stand.id;
  assert.equal(s.coins,8320);f.select(standId);
  const choice='[data-stand="'+standId+'"]';
  assert.deepEqual(Array.from(d.querySelector(choice).options,o=>o.value),['',String(f.first),String(f.first+12),String(f.first+13)]);
  change(w,choice,String(f.first+12));assert.equal(stand.relic,f.first+12);
  const art=new Set([0,1,2,3].map(dir=>artHash(f.standArt(1,dir,stand.relic))));assert.equal(art.size,4);
  assert.notEqual(artHash(f.standArt(1,0,stand.relic)),artHash(f.art('relicStand',1,0)));
  w.Math.random=()=>.01;f.visit(false);const g=s.guests[0];assert.equal(g.visitBuildingId,standId);
  let watched=false;
  for(let i=0;i<4000&&!g.gone212;i++){f.walk(g,.08);if(f.plot(g)?.phase==='use')watched ||= g.act.includes('見学');}
  assert(watched&&g.gone212);assert.equal(stand.sightseers,1);
  change(w,choice,String(f.first+13));assert.equal(stand.relic,f.first+13);
  f.save(true);stored=persist(w);assert.equal(JSON.parse(stored[KEY]).buildings.find(b=>b.id===standId).relic,f.first+13);
 }finally{game.close();}
 const resumed=await ranch(stored);
 try{
  const {f,w,d}=resumed,s=f.state(),b=s.buildings.find(b=>b.id===standId);assert.equal(b.sightseers,1);
  f.select(b.id);change(w,'[data-stand]','');assert.equal(b.relic,null);
  assert.deepEqual(Array.from(s.treasures),[0,f.first,f.first+12,f.first+13]);
 }finally{resumed.close();}
 console.log('PASS boss stand placement, selection, four facings, visitor walk, collection and reload');
}
run().catch(e=>{console.error(e);process.exitCode=1});
