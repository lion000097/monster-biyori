'use strict';
const { createHash } = require('node:crypto');
const { assert, backing, click, clone, open, persist, wait } = require('./harness138.cjs');
const hooks = `Object.assign(window.qa138,{art:spriteTreasureV161, readyArt:()=>colorIndices&&villageSheetReady&&facilitySheetReady,
  relics:TREASURE_ITEMS, start:RELIC_START192});`;
const current = process.env.MONSTER_TARGET_VERSION || 'working';
async function loaded(version, storage) {
  const game = await open(version, storage, hooks);
  for (let i=0;i<150&&!game.f.readyArt();i++) await wait(20);
  assert(game.f.readyArt());return game;
}
function hashArt(sprite) {
  const pixels = backing(sprite).getContext('2d').getImageData(0,0,sprite.width,sprite.height).data;
  assert(pixels.some((n,i)=>i%4===3&&n>0));
  return createHash('sha256').update(pixels).digest('hex');
}
async function run() {
  const old = await loaded('1.24.3',{});
  let storage,oldTreasure,oldParty,oldSeal;
  try {
    const f=old.f,s=f.state();f.registerRelics192(12);
    s.speed=0;s.adventure.stage=51;s.villageLv=s.worldTreeLevel=12;
    s.buildings.find(b=>b.type==='worldtree').level=12;
    s.treasures=[0,...Array.from({length:8},(_,n)=>f.start+12+n)];
    s.bestiary.treasures=s.treasures;oldTreasure=clone(s.treasures);oldParty=clone(s.party);
    oldSeal=hashArt(f.art(f.start));f.save(true);storage=persist(old.w);
  } finally {old.close();}
  const game=await loaded(current,storage);
  try {
    const {f,d,w}=game,s=f.state();f.registerRelics192(12);
    const names=['琥珀角のキリン','嵐冠のグリフォン','月環の九尾','星詠みの天鯨'];
    assert.deepEqual(clone(s.treasures),oldTreasure);assert.deepEqual(clone(s.party),oldParty);
    assert.deepEqual(oldTreasure.slice(1).map(id=>f.relics[id].name),names.flatMap(n=>[n+'の黄金印',n+'の虹彩秘宝']));
    assert.equal(new Set(oldTreasure.slice(1).map(id=>hashArt(f.art(id)))).size,8);
    assert.equal(hashArt(f.art(f.start)),oldSeal);assert.equal(f.relics[f.start].name,'森の大ヌシの黄金印');
    // Feature checks
  } finally {game.close();}
  console.log('PASS 1.24.4 ranch features and 1.24.3 save migration');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
