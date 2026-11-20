'use strict';
const {createHash} = require('node:crypto');
const {assert, backing, click, open, persist, wait} = require('./harness138.cjs');
const hooks = `Object.assign(window.qa138, {
  types: Object.keys(B), widthFor: type=>buildingMeta(type).w, art: spriteBuildingV161, readyPlots: () => facilitySheetReady && treeDecorationReady,
  select(id) {selectedBuilding=id;moveMode=null;buildMode=null;tab='build';renderUI(true)}
});`;
const surface = el => backing(el).getContext('2d');
function centerHash(tile) {
  const quarter=tile.width/4;
  const image=surface(tile).getImageData(quarter,quarter,quarter*2,quarter*2);
  return createHash('sha256').update(image.data).digest('hex');
}
// Each visible front gate has a pale apron on the footprint's diagonal edge.
function apronPixels(tile,side,width) {
  const n=width*32,scale=tile.width/(2*n);
  const {data}=surface(tile).getImageData(0,0,tile.width,tile.height);
  let count=0;
  for(let i=-6;i<=6;i++)for(let j=8;j<=10;j++) {
    const t=.5+i*.012, inset=j/1000;
    const [u,v]=side===0?[t,1-inset]:[1-inset,t];
    const x=Math.round((n+(u-v)*n)*scale),y=Math.round((n-12+(u+v)*n/2)*scale);
    const index=(y*tile.width+x)*4;
    if(data[index]>213&&data[index+1]>192&&data[index+1]<226&&data[index+2]>158&&data[index+2]<201&&data[index+3])count++;
  }
  return count;
}
async function ready(game) {
  for(let i=0;i<200&&!game.f.readyPlots();i++)await wait(25);
  assert(game.f.readyPlots());
}
(async()=>{
  const old=await open('1.13.26',{},hooks);
  let data,homeId,treeId,oldArt=new Map();
  try {
    await ready(old);
    const state=old.f.state(),home=state.buildings.find(b=>b.type==='home'),tree=state.buildings.find(b=>b.type==='worldtree');
    state.speed=0;homeId=home.id;treeId=tree.id;home.facing=1;tree.facing=3;
    old.f.save(true);data=persist(old.w);
    for(const type of old.f.types)for(const level of type==='worldtree'?[1,5,8]:[1]) {
      oldArt.set(type+level,[0,1,2,3].map(dir=>centerHash(old.f.art(type,level,dir))));
    }
  } finally {old.close()}
  const q=await open('1.13.27',data,hooks);
  try {
    await ready(q);
    const {f,d,w}=q,s=f.state(),home=s.buildings.find(b=>b.id===homeId),tree=s.buildings.find(b=>b.id===treeId);
    assert.deepEqual([home.facing,tree.facing],[1,3]);
    let count=0;
    for(const type of f.types)for(const level of type==='worldtree'?[1,5,8]:[1]) {
      const frames=[0,1,2,3].map(dir=>f.art(type,level,dir));
      const ids=frames.map(centerHash);
      assert.equal(new Set(ids).size,4,`${type} Lv.${level} turns inside the fence`);
      for(const [dir,frame] of frames.entries()) {
        assert.notEqual(ids[dir],oldArt.get(type+level)[dir],`${type} replaced`);
        const drawing=surface(frame),size=frame.width;
        for(const [x,y] of [[0,0],[size-1,0],[0,size-1],[size-1,size-1]]) {
          assert.equal(drawing.getImageData(x,y,1,1).data[3],0,type+' transparent outside the lot');
        }
        assert.equal(drawing.getImageData(size/2,Math.floor(size*.74),1,1).data[3],255,type+' solid floor');
        if(dir===0||dir===3) {
          const width=f.widthFor(type),closed=frames.filter((_,i)=>i!==dir).map(other=>apronPixels(other,dir,width));
          assert(apronPixels(frame,dir,width)>Math.max(...closed),type+' front gate '+dir);
        }
        count++;
      }
    }
    assert.equal(count,112);
    const priorHour=s.hour;
    for(const dir of [0,1,2,3]) {
      const fullHash = tile => createHash('sha256').update(surface(tile).getImageData(0,0,tile.width,tile.height).data).digest('hex');
      s.hour=12;
      const day=[8,10,15,20].map(lv=>fullHash(f.art('worldtree',lv,dir)));
      s.hour=22;const lit=fullHash(f.art('worldtree',20,dir));
      assert.equal(new Set([...day,lit]).size,5,'world tree ornaments on facing '+dir);
    }
    s.hour=priorHour;
    const quick='[data-turn-facility]';
    f.select(homeId);
    const cash=s.coins,locations=JSON.stringify(s.buildings.map(b=>[b.id,b.x,b.y,b.level]));
    for(const next of [2,3,0,1]) {
      d.querySelector(quick).focus();click(d,quick);
      assert.equal(home.facing,next);assert(d.activeElement.matches(quick));
      assert.equal(d.querySelector('#facilityFacing [aria-pressed="true"]').dataset.facing,String(next));
    }
    const storage=Object.getPrototypeOf(w.localStorage),originalSet=storage.setItem;
    try {storage.setItem=()=>{throw Error('quota')};click(d,quick);assert.equal(home.facing,1)}finally{storage.setItem=originalSet}
    click(d,'#facilityFacing [data-facing="3"]');assert.equal(home.facing,3);
    assert.equal(d.querySelector(quick).getAttribute('aria-label'),'向きを変える、現在は右向き');
    f.select(treeId);assert.equal(d.querySelectorAll(quick).length,1);click(d,quick);assert.equal(tree.facing,0);
    click(d,'.worldtree-panel193 [data-v195="moveWorldTree"]');click(d,quick);assert.equal(tree.facing,0);
    click(d,'[data-action="cancelMove"]');assert.equal(tree.facing,0);
    click(d,'[data-action="build"][data-id="farm"]');click(d,'.build-option.selected '+quick);
    assert.equal(d.querySelector('.build-option.selected canvas').dataset.artFacing,'1');
    click(d,'[data-action="cancelBuild"]');assert(!d.querySelector(quick));
    assert.equal(s.coins,cash);assert.equal(JSON.stringify(s.buildings.map(b=>[b.id,b.x,b.y,b.level])),locations);
    data=persist(w);
  } finally {q.close()}
  const back=await open('1.13.27',data);
  try {
    assert.equal(back.f.state().buildings.find(b=>b.id===homeId).facing,3);
    assert.equal(back.f.state().buildings.find(b=>b.id===treeId).facing,0);
    console.log('PASS 112 transparent quarter-view plots and visible front gates, nondefault v1.13.26 save, both rotation controls, keyboard focus, save failure, build and move previews, reload');
  } finally {back.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
