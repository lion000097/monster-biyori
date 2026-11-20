'use strict';
const {assert, open, click, persist, wait} = require('./harness138.cjs');
const version = process.env.MONSTER_TARGET_VERSION || 'working';
const hooks = `Object.assign(window.qa138, {
  artReady:()=>villageSheetReady&&facilitySheetReady&&treeDecorationReady,
  cameraCenter, updateWalkCamera, followed:()=>followedMonster?.id,
  zoom:z=>setZoom(z), mode:()=>{buildMode='farm';updateWalkCamera();}
});`;
async function ranch(storage={}) {
  const game=await open(version,storage,hooks);
  for(let i=0;i<120&&!game.f.artReady();i++)await wait(20);
  assert(game.f.artReady());return game;
}
async function run() {
  const game=await ranch();
  let saved;
  try {
    const {d,f,w}=game,s=f.state(),m=s.monsters[0];
    s.speed=0; f.render('monster');
    const start=()=>{click(d,'[data-action="selectMonster"][data-id="'+m.id+'"]');click(d,'[data-action="walkCamera"]');};
    start();assert.equal(f.followed(),m.id);
    assert(!d.getElementById('modal').classList.contains('show'));
    assert(d.getElementById('stopWalkCamera').textContent.includes(m.name));
    m.x=10.2;m.y=7.7;f.zoom(1.5);f.updateWalkCamera();
    assert(Math.abs(f.cameraCenter().x-m.x-.5)<1e-8&&Math.abs(f.cameraCenter().y-m.y-.5)<1e-8);
    click(d,'[data-action="pan"][data-id="left"]');assert.equal(f.followed(),undefined);
    start();click(d,'#stopWalkCamera');assert(d.getElementById('stopWalkCamera').hidden);
    start();f.save(true);saved=persist(w);f.mode();assert.equal(f.followed(),undefined);
  }finally{game.close();}
  const reload=await ranch(saved);
  try{assert.equal(reload.f.followed(),undefined);assert(reload.d.getElementById('stopWalkCamera').hidden);}
  finally{reload.close();}
  console.log('PASS walk camera from monster details, motion/zoom, manual release and reload');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
