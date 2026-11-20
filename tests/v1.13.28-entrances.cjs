'use strict';
const {createHash} = require('node:crypto');
const {assert, backing, click, clone, open, persist, wait} = require('./harness138.cjs');
const version = '1.13.28';
const hooks = `Object.assign(window.qa138,{
  types:Object.keys(B),meta:buildingMeta,roads:entranceRoads,frontRoads,canBuild,place,putTerrain,canMoveWorldTree195,
  art:spriteBuildingV161,readyArt:()=>facilitySheetReady&&treeDecorationReady&&villageSheetReady,route:monsterRoute139,
  shopSpots:shopQueueSpots212,visit:startFacilityVisit,advanceVisit:advanceFacilityVisit,seek,
  beginMove:startMoving,move:moveBuilding,turn:dir=>placementFacing=dir,preview:()=>placementFacing,
  tap(x,y){
    const rect={left:0,top:0,width:VW*T,height:VH*T},o=mapScreenOrigin(),p=projectGround(x+.5,y+.5);
    canvas.getBoundingClientRect=()=>rect;
    onMapClick({clientX:o.x+p.x*zoom,clientY:o.y+p.y*zoom});
  },
  clean(){
    state.speed=0;state.buildings=[];state.guests=[];state.zones=ZONES.map((_,i)=>i);
    state.paths=[];state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];state.ponds=[];
    state.clearedScenery=[];state.clearedPonds=[];
    for(let x=0;x<=22;x++)for(let y=0;y<=20;y++){
      state.clearedScenery.push(keyXY(x,y));state.clearedPonds.push(keyXY(x,y));
    }
    state.villageLv=state.worldTreeLevel=20;state.coins=24000;
    for(const a of [...state.monsters,...state.staff])Object.assign(a,{x:1,y:1,path:[]});
    selectedBuilding=null;selectedMonster=null;buildMode=null;moveMode=null;clearMode=false;terrainMode=null;tab='build';renderUI(true);
  }
});`;
const turn = (d,dir) => click(d,'#facilityFacing [data-facing="'+dir+'"]');
const lastNotice = d => d.querySelector('#toasts').lastElementChild.textContent;
const artHash = art => createHash('sha256').update(backing(art).getContext('2d').getImageData(0,0,art.width,art.height).data).digest('hex');

async function ready(game){
  for(let i=0;i<200&&!game.f.readyArt();i++)await wait(25);
  assert(game.f.readyArt());
}
(async()=>{
  const previous=await open('1.13.27',{},'window.qa138.readyArt=()=>facilitySheetReady&&treeDecorationReady&&villageSheetReady');
  await ready(previous);
  let storage,oldBuildings,oldCoins,oldFriends;
  try {
    const s=previous.f.state();s.speed=0;s.coins=3215;
    s.buildings.find(b=>b.type==='farm').facing=0;
    s.buildings.find(b=>b.type==='home').facing=2;
    s.buildings.push({id:s.nextId++,type:'lamp211',x:6,y:4,facing:2,level:3});
    previous.f.save(true);storage=persist(previous.w);oldCoins=s.coins;
    oldBuildings=clone(s.buildings.map(b=>[b.id,b.x,b.y,b.level]));oldFriends=clone(s.monsters.map(m=>m.id));
  } finally {previous.close()}
  const game=await open(version,storage,hooks);
  try {
    const {d,f,w}=game,s=f.state();
    const cash=s.coins,buildings=s.buildings;
    assert.deepEqual(clone(buildings.map(b=>[b.id,b.x,b.y,b.level])),oldBuildings);
    assert.deepEqual(clone(s.monsters.map(m=>m.id)),oldFriends);assert.equal(cash,oldCoins);
    assert.deepEqual(clone(buildings.map(b=>b.facing)),[0,3,1,2]);
    assert(f.roads(buildings[0]).length);assert(f.roads(buildings[1]).length);assert(!f.roads(buildings[3]).length);

    await ready(game);let frames=0;
    for(const type of f.types)for(const lv of type==='worldtree'?[1,5,8]:[1]){
      const images=[0,1,2,3].map(dir=>f.art(type,lv,dir));
      assert.equal(new Set(images.map(artHash)).size,4,type+' has four distinct images');
      for(const img of images){
        const size=img.width,g=backing(img).getContext('2d');
        assert.equal(img.height,size);
        for(const [x,y] of [[0,0],[size-1,0],[0,size-1],[size-1,size-1]])assert.equal(g.getImageData(x,y,1,1).data[3],0);
        frames++;
      }
    }
    assert.equal(frames,112);
    for(const dir of [0,1,2,3]){
      s.hour=12;const stages=[8,10,15,20].map(lv=>artHash(f.art('worldtree',lv,dir)));
      s.hour=22;stages.push(artHash(f.art('worldtree',20,dir)));
      assert.equal(new Set(stages).size,5);
    }

    f.clean();
    for(const type of f.types){
      const {w:width,h:height}=f.meta(type);
      const x=4,y=4;
      const edge=[[x+width-1,y+height],[x-1,y+height-1],[x+width-1,y-1],[x+width,y+height-1]];
      for(let dir=0;dir<4;dir++){
        f.turn(dir);
        for(let side=0;side<4;side++){
          s.paths=[edge[side].join(',')];
          assert.equal(f.canBuild(x,y,null,true,type),dir===side,type+' facing '+dir+' with road on '+side);
        }
        s.paths=[[x+width,y+height].join(',')];
        assert.equal(f.canBuild(x,y,null,true,type),false);
      }
    }

    const homeButton='[data-action="build"][data-id="home"]';
    click(d,homeButton);turn(d,3);s.paths=['2,2'];
    f.tap(3,3);assert.equal(lastNotice(d),'道に隣接してないと置けません');
    s.paths=['3,5'];
    const budget=s.coins;
    f.tap(3,3);assert.equal(lastNotice(d),'施設の正面が道に接していないと置けません');
    assert.equal(s.buildings.length,0);assert.equal(s.coins,budget);
    s.paths=['5,3','5,4','1,1'];f.tap(3,3);
    const home=s.buildings.find(b=>b.type==='home'),remaining=s.coins;
    assert(home);assert.deepEqual([home.x,home.y,home.facing],[3,3,3]);assert(remaining<budget);
    turn(d,0);assert.equal(home.facing,3);
    f.putTerrain('roadErase',5,3);assert(!s.paths.includes('5,3'));
    s.paths.push('3,2');
    f.putTerrain('roadErase',5,4);f.putTerrain('pond',5,4);assert(s.paths.includes('5,4'));
    assert.equal(lastNotice(d),'施設の正面に道を1マス以上残してね');
    // Skip the two disconnected facades when using the single turn control.
    click(d,'[data-turn-facility]');assert.equal(home.facing,2);
    const proto=Object.getPrototypeOf(w.localStorage),setItem=proto.setItem;
    try{proto.setItem=()=>{throw Error('quota')};turn(d,3);assert.equal(home.facing,2)}finally{proto.setItem=setItem}
    turn(d,3);assert.equal(home.facing,3);
    f.beginMove(home.id);turn(d,1);
    f.tap(3,3);assert.deepEqual([home.x,home.y,home.facing],[3,3,3]);
    click(d,'[data-action="cancelMove"]');assert.equal(home.facing,3);
    f.beginMove(home.id);turn(d,1);s.paths.push('7,8');f.tap(8,8);
    assert.deepEqual([home.x,home.y,home.facing,s.coins],[8,8,1,remaining]);

    // Staff and monsters must approach the connected front even when a rear road is closer.
    s.paths=['10,8','10,7','9,7','8,7','7,7','7,8','1,1'];
    const m=s.monsters[0],worker=s.staff[0];
    Object.assign(m,{x:10,y:8,path:[]});const route=f.route(m,[home],1,true);
    assert.deepEqual(clone(route.pt),[7,8]);assert(route.path.every(pt=>s.paths.includes(pt.join(','))));
    Object.assign(worker,{x:10,y:8,path:[],job:'keeper',jobTarget211:null,jobCooldown211:0});
    f.seek(worker,'keeper');assert.deepEqual(clone(worker.jobTarget211.goal),[7,8]);
    f.visit(m,home,route);turn(d,3);assert.equal(home.facing,3);
    assert.equal(f.advanceVisit(m,.1),false);assert.equal(worker.jobTarget211,null);
    assert.deepEqual(clone(f.shopSpots(home)[0]).x,10);

    // The moving tree cannot erase another building's last entrance road.
    f.clean();const tree={id:301,type:'worldtree',x:14,y:12,level:20,facing:0};
    const hut={id:302,type:'home',x:3,y:3,level:2,facing:3};s.buildings.push(tree,hut);
    s.paths=['5,3','3,2','11,4','13,12','1,1'];f.beginMove(tree.id);f.turn(3);
    assert.equal(f.canMoveWorldTree195(5,2),false);f.move(5,2);assert.equal(tree.x,14);
    s.paths.push('5,4','11,6');assert(f.canMoveWorldTree195(5,4));f.move(5,4);
    assert.deepEqual([tree.x,tree.y,tree.facing],[5,4,3]);assert(f.roads(hut).length);
    // Overlapping relocation may uncover a default road hidden by the old tree.
    s.removedDefaultPaths=s.removedDefaultPaths.filter(key=>key!=='6,7');
    f.beginMove(tree.id);f.turn(1);assert(f.canMoveWorldTree195(7,4));f.move(7,4);assert(f.roads(tree).length);
    f.save(true);storage=persist(w);
  }finally{game.close()}
  const reload=await open(version,storage,hooks),fresh=await open(version,{},hooks);
  try{
    await Promise.all([ready(reload),ready(fresh)]);
    const tree=reload.f.state().buildings.find(b=>b.type==='worldtree');
    assert.deepEqual([tree.x,tree.y,tree.facing],[7,4,1]);
    for(const b of fresh.f.state().buildings)assert(fresh.f.roads(b).length,b.type+' starter entrance');
  }finally{reload.close();fresh.close()}
  console.log('PASS four facades of all 26 facilities, 112 images, world-tree tiers, UI placement/rotation/relocation, road deletion and ponds, tree overlap, visitor/worker/monster access, old save and reload');
})().catch(err=>{console.error(err);process.exitCode=1});
