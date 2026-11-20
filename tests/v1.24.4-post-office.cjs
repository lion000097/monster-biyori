'use strict';
const {createHash}=require('node:crypto');
const {assert,open,persist,clone,backing,click,wait,KEY}=require('./harness138.cjs');
const version=process.env.MONSTER_TARGET_VERSION||'working';
const hooks=`Object.assign(window.qa138,{
  place, visit:visitTick, walk:animateGuest212, phase:g=>plotWalks.get(g)?.phase,
  art:spriteBuildingV161, cardArt:postcardArt, recover:recoverBuilding,
  select(id){selectedBuilding=id;tab='build';renderUI(true)},
  prepare(){
    const tree=state.buildings.find(b=>b.type==='worldtree');
    state.buildings=[tree];state.guests=[];state.paths=['6,8','7,8'];
    state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];state.ponds=[];state.clearedScenery=[];state.clearedPonds=[];
    for(let x=0;x<22;x++)for(let y=0;y<20;y++){state.clearedScenery.push(keyXY(x,y));state.clearedPonds.push(keyXY(x,y))}
    for(const a of [...state.monsters,...state.staff]){a.x=7;a.y=8;a.path=[]}
    placementFacing=0;
  }
});`;
function hash(canvas){
  const pixels=backing(canvas).getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  assert(pixels.some((n,i)=>i%4===3&&n>0));
  return createHash('sha256').update(pixels).digest('hex');
}
function advanceUntil(f,guest,condition){
  for(let i=0;i<5000&&!condition();i++)f.walk(guest,.08);
  assert(condition(),'visitor reached the expected step');
}
async function loaded(release,storage={},extra=''){
  const game=await open(release,storage,extra+';window.qa138.sheetsReady=()=>facilitySheetReady&&villageSheetReady&&treeDecorationReady;');
  for(let i=0;i<120&&!game.f.sheetsReady();i++)await wait(25);
  assert(game.f.sheetsReady());return game;
}
async function run(){
  const old=await loaded('1.24.3');
  let oldSave;
  try{old.f.state().speed=0;old.f.save(true);oldSave=persist(old.w)}finally{old.close()}
  const previous=JSON.parse(oldSave[KEY]);
  const game=await loaded(version,oldSave,hooks);
  let id,beforeMail,afterMail;
  try{
    const {f,d,w}=game,s=f.state();
    assert.deepEqual(clone(s.party),previous.party);assert.equal(s.coins,previous.coins);
    assert.deepEqual(clone(s.monsters.map(m=>m.id)),previous.monsters.map(m=>m.id));
    assert.equal(s.postcards.filter(Boolean).length,0);
    f.prepare();s.coins=9000;f.place('postOffice',6,6);
    assert(!s.buildings.some(b=>b.type==='postOffice'),'locked at world tree level 1');
    s.villageLv=s.worldTreeLevel=2;s.buildings[0].level=2;
    f.render('build');click(d,'[data-facility-role="tourism"]');click(d,'[data-action="build"][data-id="postOffice"]');
    f.place('postOffice',3,3);assert.equal(s.coins,9000,'placing away from a road costs nothing');
    f.place('postOffice',6,6);const office=s.buildings.find(b=>b.type==='postOffice');assert(office);
    assert.equal(s.coins,8580);id=office.id;f.select(id);
    assert.match(d.getElementById('postOfficeAlbum').textContent,/投函 0通/);
    assert.equal(new Set([0,1,2,3].map(dir=>hash(f.art('postOffice',1,dir)))).size,4);
    assert.equal(new Set([0,1,2,3].map(i=>hash(f.cardArt(i)))).size,4);
    // The post office can be selected even when a shop is open.
    s.buildings.push({id:s.nextId++,type:'shop',x:6,y:9,level:1,facing:2});
    s.day=1;w.Math.random=()=>.01;f.visit(false);const g=s.guests[0];
    assert.equal(g.visitBuildingId,id);assert.equal(g.shopId200,null);
    advanceUntil(f,g,()=>f.phase(g)==='use');
    assert.match(g.act,/絵はがき/);assert(!s.postcards[0]);f.save(true);beforeMail=persist(w);
    advanceUntil(f,g,()=>g.postedCard);assert.equal(s.postcards[0].count,1);
    f.save(true);afterMail=persist(w);
    advanceUntil(f,g,()=>g.gone212);assert.equal(s.postcards[0].count,1);
    for(const [index,day] of [[0,4],[1,8],[2,15],[3,22]]){
      s.day=day;s.guests=[];f.visit(false);const visitor=s.guests[0];
      advanceUntil(f,visitor,()=>visitor.gone212);
      assert.equal(s.postcards[index].day,day);assert.equal(s.postcards[index].sender,visitor.name);
    }
    f.select(id);const album=d.getElementById('postOfficeAlbum');
    assert.match(album.textContent,/投函 5通 .*4 \/ 4種/);assert.equal(album.querySelectorAll('li').length,4);
    s.guests=[];f.visit(false);const interrupted=s.guests[0];advanceUntil(f,interrupted,()=>f.phase(interrupted)==='use');
    f.recover(id);advanceUntil(f,interrupted,()=>interrupted.gone212);
    assert.equal(s.postcards[3].count,1,'removing the office before mailing cancels the postcard');
    f.place('postOffice',6,6);f.select(s.buildings.find(b=>b.type==='postOffice').id);
    assert.match(d.getElementById('postOfficeAlbum').textContent,/投函 5通/);
  }finally{game.close()}
  for(const snapshot of [beforeMail,afterMail]){
    const resumed=await loaded(version,snapshot,hooks);
    try{
      const {f,d}=resumed,s=f.state(),guest=s.guests[0];
      advanceUntil(f,guest,()=>guest.gone212);assert.equal(s.postcards[0].count,1);
      f.select(id);assert.match(d.getElementById('postOfficeAlbum').textContent,/桜咲く世界樹/);
      f.save(true);assert.equal(JSON.parse(persist(resumed.w)[KEY]).postcards[0].count,1);
    }finally{resumed.close()}
  }
  console.log('PASS post office unlock, four facings, visitor mailing, four seasons, cancellation, old save and mid-visit reload');
}
run().catch(error=>{console.error(error);process.exitCode=1});
