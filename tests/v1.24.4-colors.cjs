'use strict';
const {assert,backing,click,open,persist,wait} = require('./harness138.cjs');
const version=process.env.MONSTER_TARGET_VERSION||'working';
const hooks='Object.assign(window.qa138,{art:spriteMonsterHD,count:SPECIES.length,artReady:()=>villageSheetReady&&facilitySheetReady&&treeDecorationReady});';
async function loaded(version,storage={}){
  const game=await open(version,storage,hooks);
  for(let i=0;i<120&&!game.f.artReady();i++)await wait(20);
  assert(game.f.artReady());return game;
}
function pixels(canvas){
  const surface=backing(canvas);
  return Buffer.from(surface.getContext('2d').getImageData(0,0,surface.width,surface.height).data);
}
async function run(){
  const old=await loaded('1.24.3');
  let storage,kind,unseen,normalOnly;
  try{
    const {f,w}=old,s=f.state();
    kind=f.count-1;normalOnly=s.monsters[0].kind;unseen=f.count-2;
    s.speed=0;s.catalog.friends=[normalOnly,kind];s.catalog.shinies=[kind];
    f.save(true);storage=persist(w);
  }finally{old.close();}
  const game=await loaded(version,storage);
  try{
    const {f,d}=game;f.render('bestiary');click(d,'[data-action="atlas"][data-id="friend"]');
    assert.equal(d.querySelector('#compare-kind-'+unseen),null);
    click(d,'#compare-kind-'+normalOnly);
    assert.equal(d.querySelector('.color-pair .undiscovered').textContent,'未発見');
    assert.equal(d.querySelectorAll('.color-pair canvas').length,1);
    click(d,'#modalClose');assert.equal(d.activeElement.id,'compare-kind-'+normalOnly);
    click(d,'#compare-kind-'+kind);
    const [normal,shiny]=d.querySelectorAll('.color-pair canvas');
    assert.deepEqual(pixels(normal),pixels(f.art(kind,false)));
    assert.deepEqual(pixels(shiny),pixels(f.art(kind,true)));
    assert.notDeepEqual(pixels(normal),pixels(shiny));
    click(d,'#modalClose');assert.equal(d.activeElement.id,'compare-kind-'+kind);
    assert.deepEqual(Array.from(f.state().catalog.shinies),[kind]);
  }finally{game.close();}
  console.log('PASS 1.24.3 catalog, both color portraits, undiscovered forms and return focus');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
