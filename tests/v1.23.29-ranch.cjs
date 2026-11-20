'use strict';
const {assert,open,clone,persist,click,backing,KEY,wait}=require('./harness138.cjs');
const {createHash}=require('node:crypto');
const version='1.23.29';
const hooks=`Object.assign(window.qa138,{
  buildings:Object.keys(B),meta:buildingMeta,roads:entranceRoads,path:isPath,road:residentRoad,free:isWalkable,land:unlocked,
  terrain:putTerrain,entry:visitorEntry101,spawn:visitTick,step:stepActors,guest:animateGuest212,route:monsterRoute139,
  visit:startFacilityVisit,timer:monsterWalkTimer139,plot:a=>plotWalks.get(a),activity:facilityActivities,
  seek,need:monsterLevelNeed135,combat:adventureTick,surface:groundArt,
  readyArt:()=>facilitySheetReady&&treeDecorationReady&&villageSheetReady,art:spriteBuildingV161,
  pointer(type,x,y){
    const rect={left:0,top:0,width:VW*T,height:VH*T},o=mapScreenOrigin(),p=projectGround(x+.5,y+.5);
    canvas.getBoundingClientRect=()=>rect;
    const event=new MouseEvent(type,{bubbles:true,cancelable:true,clientX:o.x+p.x*zoom,clientY:o.y+p.y*zoom});
    Object.defineProperties(event,{pointerId:{value:1},pointerType:{value:'touch'}});
    canvas.dispatchEvent(event);
  },
  clean(){
    state.speed=1;state.hour=12;state.buildings=[];state.guests=[];state.paths=[];state.ponds=[];
    state.stoneTiles={};state.zones=[0,1,4,5];state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];
    state.clearedScenery=[];state.clearedPonds=[];
    for(let x=0;x<22;x++)for(let y=0;y<20;y++){state.clearedScenery.push(keyXY(x,y));state.clearedPonds.push(keyXY(x,y));}
    for(const a of [...state.monsters,...state.staff]){
      cancelPlotWalk(a);Object.assign(a,{x:6,y:6,path:[],jobTarget211:null,jobTask212:null,ranchTarget200:null,ranchGoal200:null});
      if(a.kind!==undefined){const t=monsterWalkTimer139(a);t.visit=null;t.wait=10000;t.needsRanch=false;}
    }
    selectedBuilding=null;selectedMonster=null;buildMode=null;moveMode=null;terrainMode=null;
  }
});`;
function building(f,s,type,facing){
  const b={id:s.nextId++,type,x:6,y:6,level:1,facing};s.buildings=[b];
  const {w,h}=f.meta(type),doors=[[6,6+h],[5,6],[6,5],[6+w,6]];
  const door=doors[facing];s.paths=[door.join(',')];return {b,door};
}
function inside(f,b,a){
  const {w,h}=f.meta(b.type),x=a.x+.5,y=a.y+.5;
  return x>=b.x&&x<b.x+w&&y>=b.y&&y<b.y+h;
}
function artHash(art){
  return createHash('sha256').update(backing(art).getContext('2d').getImageData(0,0,art.width,art.height).data).digest('hex');
}
async function assets(f){for(let i=0;i<200&&!f.readyArt();i++)await wait(20);assert(f.readyArt());}
async function run(){
 const old=await open('1.13.28',{},'Object.assign(window.qa138,{art:spriteBuildingV161,readyArt:()=>facilitySheetReady&&treeDecorationReady&&villageSheetReady})');
 let legacy,previous,oldArt={};
 try{
  const s=old.f.state();s.coins=813;s.speed=0;s.adventure.stage=11;s.monsters[0].xp=17.75;
  old.f.save(true);legacy=persist(old.w);previous=clone(s);
  await assets(old.f);
  for(const type of ['shop','bench211','worldtree','home'])oldArt[type]=[0,1,2,3].map(d=>artHash(old.f.art(type,1,d)));
 }finally{old.close();}
 const game=await open(version,legacy,hooks);
 let saved,reloadPlot;
 try{
  const {d,f,w}=game,s=f.state();await assets(f);
  for(const name of ['coins','day','buildings','party','treasures'])assert.deepEqual(clone(s[name]),previous[name],name);
  assert.deepEqual(clone(s.monsters.map(m=>[m.id,m.lv,m.xp])),previous.monsters.map(m=>[m.id,m.lv,m.xp]));
  assert.deepEqual(Object.keys(s.stoneTiles),[]);assert.equal(s.adventure.bossLoop,null);
  for(const type of Object.keys(oldArt)){
   const frames=[0,1,2,3].map(dir=>artHash(f.art(type,1,dir)));
   assert.equal(new Set(frames).size,4);
   frames.forEach((hash,dir)=>assert.equal(hash===oldArt[type][dir],!['shop','bench211'].includes(type),type+dir));
  }
  f.render('monster');
  for(const m of s.monsters){
   const bar=d.querySelector('[data-action="selectMonster"][data-id="'+m.id+'"] progress');
   assert.equal(bar.value,Math.floor(m.xp));assert.equal(bar.max,f.need(m.lv));
  }
  const chosen=s.monsters[0];f.selectMonster(chosen.id);
  chosen.xp=f.need(chosen.lv)-1;const oldLevel=chosen.lv;
  click(d,'[data-action="trainMonster"]');assert.equal(chosen.lv,oldLevel+1);
  const rowBar=d.querySelector('[data-action="selectMonster"][data-id="'+chosen.id+'"] progress');
  assert.equal(rowBar.max,f.need(chosen.lv));assert.equal(rowBar.value,Math.floor(chosen.xp));
  f.render('build');const types=new Set();
  const roleIds=Array.from(d.querySelectorAll('[data-facility-role]'),b=>b.dataset.facilityRole);
  for(const role of roleIds.filter(r=>r!=='all')){
   click(d,'[data-facility-role="'+role+'"]');f.render('build');
   assert.equal(d.querySelector('[aria-pressed="true"][data-facility-role]').dataset.facilityRole,role);
   const buttons=Array.from(d.querySelectorAll('[data-action="build"]'),el=>el.dataset.id);
   assert(buttons.length&&buttons.length<25);
   if(role==='trade')assert.deepEqual(buttons.sort(),['cafe','inn','shop','stall']);
   for(const type of buttons)types.add(type);
   if(d.querySelector('.worldtree-panel193'))types.add('worldtree');
  }
  assert.deepEqual([...types].sort(),Array.from(f.buildings).sort());
  click(d,'[data-facility-role="all"]');
  f.clean();s.coins=300;const expense=s.economy.expense;
  click(d,'[data-v16-action="terrain"][data-id="stone"]');
  assert.match(d.getElementById('tileTag').textContent,/100G/);
  f.terrain('road',3,5);f.terrain('stone',3,5);f.terrain('stone',3,5);
  assert.equal(s.coins,200);assert(f.road(3,5));assert.equal(s.stoneTiles['3,5'],true);
  f.terrain('stone',4,5);f.terrain('stone',5,5);f.terrain('stone',6,5);
  assert.equal(s.coins,0);assert.equal(s.economy.expense-expense,300);assert(!f.path(6,5));
  assert.notEqual(artHash(f.surface(3,5,'春','road')),artHash(f.surface(3,5,'春','stone')));
  s.buildings=[{id:212,type:'home',x:3,y:3,level:1,facing:0}];
  f.terrain('roadErase',3,5);assert(!s.stoneTiles['3,5']);f.terrain('pond',4,5);
  assert(f.road(4,5));assert(s.stoneTiles['4,5']);
  f.terrain('road',5,5);assert(!s.stoneTiles['5,5']);assert(f.road(5,5));
  s.coins=100;f.terrain('stone',3,3);assert.equal(s.coins,100);
  f.terrain('stone',9,7);assert(s.stoneTiles['9,7']);assert(f.road(9,7));
  s.coins=200;
  f.pointer('pointerdown',8,6);f.pointer('pointermove',9,6);f.pointer('pointermove',8,6);
  f.pointer('pointercancel',8,6);f.pointer('pointermove',7,6);
  assert(s.stoneTiles['8,6']&&s.stoneTiles['9,6']);assert(!s.stoneTiles['7,6']);assert.equal(s.coins,0);
  f.save(true);saved=persist(w);
  f.clean();
  const origin=[9,9];const arrivals=[];
  for(let i=0;i<8;i++){
   const e=f.entry(origin);arrivals.push(e.side);assert(!f.land(e.x,e.y));assert.deepEqual(clone(e.path.at(-1)),origin);
   for(let j=0;j<e.path.length;j++){assert(f.free(...e.path[j]));if(j)assert.equal(Math.abs(e.path[j][0]-e.path[j-1][0])+Math.abs(e.path[j][1]-e.path[j-1][1]),1);}
   const next=s.nextVisitorSide;f.entry(origin,true,e.side);assert.equal(s.nextVisitorSide,next);
  }
  assert.equal(new Set(arrivals.slice(0,4)).size,4);assert.deepEqual(arrivals.slice(0,4),arrivals.slice(4));
  s.ponds=['8,9','9,8','10,9','9,10'];assert.equal(f.entry(origin),null);
  s.ponds=[];s.guests=[];w.Math.random=()=>.01;
  for(let i=0;i<4;i++){f.spawn(false);assert(s.guests.length);const g=s.guests.pop();assert(!f.land(g.x,g.y));assert(g.entryPath101.length);}
  const m=s.monsters[0];s.monsters=[m];const worker=s.staff[0];s.staff=[];
  for(const type of f.buildings)for(let dir=0;dir<4;dir++){
   const {b,door}=building(f,s,type,dir);Object.assign(m,{x:door[0],y:door[1],path:[],ranchTarget200:null});
   const timer=f.timer(m);timer.visit=null;timer.wait=10000;
   const route=f.route(m,[b],1,true);assert(route,type+' road');f.visit(m,b,route);
   let used=false;
   for(let n=0;n<320&&timer.visit;n++){
    f.step(.05);
    if(!inside(f,b,m))assert(f.road(Math.round(m.x),Math.round(m.y)),type+' approach stays on the frontage road');
    if(f.plot(m)?.phase==='use'){
     used=true;assert.equal(m.act,f.activity[type][1]);
     assert.equal(inside(f,b,m),!['farm','home','cafe'].includes(type),type+' '+dir);
     if(type==='school'&&dir===0&&!reloadPlot){f.save(true);reloadPlot=persist(w);}
    }
   }
   assert(used,type+' '+dir);assert(!timer.visit);assert.deepEqual([m.x,m.y],door);
  }
  const park=building(f,s,'park',0);Object.assign(m,{x:park.door[0],y:park.door[1]});
  f.visit(m,park.b,f.route(m,[park.b],1,true));
  for(let i=0;i<150&&f.plot(m)?.phase!=='use';i++)f.step(.05);
  assert(inside(f,park.b,m));park.b.facing=1;f.step(.05);assert(!f.plot(m));assert(f.road(Math.round(m.x),Math.round(m.y)));
  s.staff=[worker];
  const {b:lab,door}=building(f,s,'lab',3);Object.assign(worker,{x:door[0],y:door[1],job:'study',jobTarget211:null,jobTask212:null,jobCooldown211:0});
  f.seek(worker,'study');assert(worker.jobTarget211);const magic=s.magic;let workerWorked=false;
  for(let i=0;i<320&&worker.jobTarget211;i++){f.step(.05);if(f.plot(worker)?.phase==='use'){assert(inside(f,lab,worker));workerWorked=true;}}
  assert(workerWorked&&s.magic>magic);assert.deepEqual([worker.x,worker.y],door);
  const ranch=building(f,s,'ranch',0);
  Object.assign(m,{x:ranch.door[0],y:ranch.door[1],ranchTarget200:ranch.b.id,ranchGoal200:ranch.door,produce:12});
  const stock=s.stock;let producedInside=false;
  for(let i=0;i<320&&m.ranchTarget200;i++){f.step(.05);if(f.plot(m)?.phase==='use')producedInside=inside(f,ranch.b,m);}
  assert(producedInside&&s.stock>stock);assert.deepEqual([m.x,m.y],ranch.door);
  for(const type of ['shop','inn','cafe']){
   const {b,door}=building(f,s,type,1),e=f.entry(door);
   const g={name:'テスト旅人',gender:'女',x:e.x,y:e.y,entrySide:e.side,visitBuildingId:b.id,
    shopId200:type==='shop'?b.id:null,shopX200:door[0],shopY200:door[1],entryPath101:e.path,shopPath200:e.path,spent:10};
   s.guests=[g];let used=false,paid=false;const customers=s.shopStats211.customers;
   for(let i=0;i<4000&&!g.gone212;i++){
    f.guest(g,.08);if(f.plot(g)?.phase==='use'){used=true;assert.equal(inside(f,b,g),type!=='cafe');}
    if(!paid&&(type==='shop'?g.checkedOut211:g.arrived211)){paid=true;assert.equal(inside(f,b,g),type!=='cafe');}
   }
   assert(used&&paid&&g.gone212,type);assert.equal(s.shopStats211.customers-customers,type==='shop'?1:0);
  }
  const shop=building(f,s,'shop',0);s.stock=30;s.materialStock211[0]=30;
  const line=[1,2].map(rank=>({name:'旅人'+rank,x:shop.door[0],y:shop.door[1],phase212:'queue',entered211:true,
    queueOrder212:rank,shopId200:shop.b.id,shopX200:shop.door[0],shopY200:shop.door[1]}));
  s.guests=line;const orders=[];const buyers=s.shopStats211.customers;
  for(let i=0;i<2000&&orders.length<2;i++){
   for(const g of line){
    f.guest(g,.08);
    if(g.checkedOut211&&!orders.includes(g.name))orders.push(g.name);
   }
   assert(line.filter(g=>inside(f,shop.b,g)).length<=1,'checkout apron serves one shopper at a time');
  }
  assert.deepEqual(orders,['旅人1','旅人2']);assert.equal(s.shopStats211.customers,buyers+2);
  console.log('PASS old save, XP, role filters, stone costs and road protection, four gates, 104 facility approaches, job/harvest/shop/sightseeing and sprite changes');
 }finally{game.close();}
 const mid=await open(version,reloadPlot,hooks);await assets(mid.f);
 try{const a=mid.f.state().monsters[0];assert(!a.facilityDoor);assert(mid.f.road(Math.round(a.x),Math.round(a.y)));}finally{mid.close();}
 const battle=await open(version,saved,hooks);await assets(battle.f);
 let loopSave;
 try{
  const {f,d,w}=battle,s=f.state(),a=s.adventure;
  assert(s.stoneTiles['4,5']&&s.stoneTiles['9,7']);assert.equal(s.coins,0);
  a.stage=11;f.render('adventure');
  const press=(stage,mode)=>click(d,'[data-v192="'+mode+'"][data-stage="'+stage+'"]');
  const win=()=>{for(const foe of s.battle.foes)foe.hp=0;f.combat(false);assert(!s.battle);};
  press(5,'loop');assert.equal(s.battle.stage,5);assert.equal(a.bossLoop,5);assert.equal(a.stage,11);
  for(let round=0;round<3;round++){
   const before=a.clears,coins=s.coins;win();assert.equal(a.clears,before+1);assert(s.coins>coins);assert.equal(a.stage,11);
   for(let t=0;t<5;t++)f.combat(false);assert.equal(s.battle.stage,5);assert.equal(a.stage,11);
  }
  press(5,'loop');assert(!a.bossLoop);win();for(let t=0;t<6;t++)f.combat(false);assert(!s.battle);
  press(10,'fight');assert.equal(s.battle.stage,10);assert(!a.bossLoop);
  press(10,'loop');assert.equal(a.bossLoop,10);f.save(true);loopSave=persist(w);
  for(const foe of s.battle.foes){foe.hp=foe.maxHp=999999;foe.atk=999999;}s.battle.ourHp=1;
  f.combat(false);assert(!s.battle&&!a.bossLoop);assert.equal(a.stage,11);
  click(d,'[data-action="adventureAuto"]');f.combat(false);assert.equal(s.battle.stage,11);
  win();assert.equal(a.stage,12);
  a.auto=false;a.stage=10;f.render('adventure');assert(!d.querySelector('[data-stage="10"][data-v192="loop"]'));
 }finally{battle.close();}
 const resumed=await open(version,loopSave,hooks);await assets(resumed.f);
 try{const s=resumed.f.state();assert.equal(s.adventure.bossLoop,10);resumed.f.combat(false);assert.equal(s.battle.stage,10);assert.equal(s.adventure.stage,11);}finally{resumed.close();}
 const corrupt=JSON.parse(loopSave[KEY]);corrupt.adventure.bossLoop=15;
 const invalid=await open(version,{[KEY]:JSON.stringify(corrupt)},hooks);await assets(invalid.f);
 try{assert.equal(invalid.f.state().adventure.bossLoop,null);}finally{invalid.close();}
 console.log('PASS road and mid-visit reload, repeated boss rewards, one-off replay, loop stop, defeat, normal auto progression and saved target validation');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
