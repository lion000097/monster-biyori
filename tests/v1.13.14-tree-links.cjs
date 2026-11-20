'use strict';

const {assert, open, click, near} = require('./harness138.cjs');
const hooks=`Object.assign(window.qa138,{treeRequirementStatus193,followTreeTarget,buildingOf,costUpgrade,
  view:()=>({tab,selectedBuilding,selectedMonster,buildMode,moveMode,terrainMode,clearMode,cameraX,cameraY,zoom}),
  displace:()=>{zoom=1.5;cameraX=-18;cameraY=-15;limitCamera();moveMode=2;terrainMode='road';clearMode=true},
  canBuild,place});`;
const link=type=>'#treeTargets [data-tree-target="'+type+'"]';
const build=type=>'[data-action="build"][data-id="'+type+'"]';

(async()=>{
  const q=await open('1.13.14',{},hooks);
  try {
    const {d,f}=q, s=f.state(); s.speed=0; s.quests=[];
    const farm=s.buildings.find(b=>b.type==='farm'), home=s.buildings.find(b=>b.type==='home');
    s.coins=5000; const initial=s.coins;
    f.displace(); f.render('monster');
    assert.match(d.querySelector(link('farm')).textContent,/強化先/);
    click(d,link('farm')); let v=f.view();
    assert.equal(v.tab,'build'); assert.equal(v.selectedBuilding,farm.id); assert.equal(v.selectedMonster,null);
    assert.equal(v.buildMode,null); assert.equal(v.moveMode,null); assert.equal(v.terrainMode,null); assert.equal(v.clearMode,false);
    const size=f.buildingOf(farm);
    const clamp=(n,lo,hi)=>Math.max(lo,Math.min(n,hi));
    near(v.cameraX,clamp(farm.x+size.w/2-11/v.zoom,-22,44-22/v.zoom));
    near(v.cameraY,clamp(farm.y+size.h/2-7.5/v.zoom,-20,30-15/v.zoom));
    assert.equal(d.activeElement.id,'game'); near(s.coins,initial);
    const upgrade='[data-action="upgrade"][data-id="'+farm.id+'"]';
    const price=f.costUpgrade(farm); click(d,upgrade); assert.equal(farm.level,2);
    near(initial-s.coins,price);
    assert.match(d.querySelector(link('farm')).textContent,/建設先/);
    const afterUpgrade=s.coins, beforeCount=s.buildings.length;
    for(let i=0;i<2;i++) {
      click(d,link('farm'));
      assert.equal(f.view().selectedBuilding,null); assert.equal(f.view().buildMode,'farm');
      assert.equal(d.activeElement.dataset.treeDestination,'farm'); assert(!d.querySelector(build('farm')).disabled);
    }
    near(s.coins,afterUpgrade); assert.equal(s.buildings.length,beforeCount);
    f.render(); assert.equal(d.activeElement.dataset.treeDestination,'farm');
    s.coins=0; f.render(); click(d,link('farm'));
    assert.equal(f.view().buildMode,null); assert(d.querySelector(build('farm')).disabled);
    assert.equal(d.activeElement.dataset.treeDestination,'farm'); near(s.coins,0);
    const extra=(b,level,x,y)=>{const next={...b,id:s.nextId++,level,x,y};s.buildings.push(next);return next;};
    extra(farm,2,2,4); extra(farm,2,8,5);
    f.render(); assert.equal(d.querySelector(link('farm')),null);
    const complete=[...d.querySelectorAll('#treeTargets li')].find(el=>el.textContent.includes('おやつ畑'));
    assert(complete.querySelector('.tree-met')); assert.match(complete.textContent,/3 \/ 3軒/);
    const previous=f.view().selectedBuilding; f.followTreeTarget('farm'); assert.equal(f.view().selectedBuilding,previous);
    const stronger=extra(home,2,8,9); s.coins=f.costUpgrade(home);
    f.render(); click(d,link('home')); assert.equal(f.view().selectedBuilding,home.id);
    s.coins=f.costUpgrade(stronger); f.render(); click(d,link('home'));
    assert.equal(f.view().selectedBuilding,stronger.id);
    s.villageLv=s.worldTreeLevel=10; s.coins=0; f.render('management');
    assert.match(d.querySelector(link('shop')).textContent,/建設先/);
    assert.match(d.querySelector(link('ranch')).textContent,/建設先/);
    click(d,link('shop')); assert.equal(f.view().buildMode,'shop');
    assert.equal(d.activeElement.dataset.treeDestination,'shop'); near(s.coins,0);
    const freeShop=d.querySelector(build('shop')).closest('.build-option');
    assert.match(freeShop.textContent,/初回無料/);
    let tile;
    for(let y=-19;y<29&&!tile;y++)for(let x=-21;x<43;x++)if(f.canBuild(x,y,null,false,'shop')){tile={x,y};break;}
    assert(tile); f.place('shop',tile.x,tile.y); assert.equal(s.buildings.filter(b=>b.type==='shop').length,1);
    near(s.coins,0); f.render(); click(d,link('shop'));
    assert.equal(f.view().selectedBuilding,s.buildings.find(b=>b.type==='shop').id);
    console.log('PASS zoomed map centering, upgrade, build placement, insufficient funds, finished goals, candidate priority, initial free shop and late-game goals');
  } finally {q.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
