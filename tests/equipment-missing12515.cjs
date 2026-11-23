const h=require('./harness138.cjs');
const hook=`
window.checkGear={
 render(){tab='bestiary';atlasCategory='equipment';renderUI(true);},
 seed(){
  state.speed=0;
  state.equipmentBlueprints12513.dew=true;
  state.equipmentSeen12513.legacy=true;
  state.equipmentStock12512.attack=1;
  writeEquipment12512(state.monsters[0],'shield');
 },
 obtain(){state.equipmentStock12512.dew=1;markEquipmentSeen12513('dew');},
 treasure(){return treasureGalleryHTML();},
 names(){return Object.fromEntries(equipmentOrder12512.map(id=>[id,equipmentInfo12512[id].name]));}
};
`;
(async()=>{
 const a=await h.open('working',{},hook);
 try{
  a.w.checkGear.seed();h.assert(a.f.save(true));
  const key=h.KEY,before=a.w.localStorage.getItem(key);
  h.assert(a.f.load());a.w.checkGear.render();
  const names=a.w.checkGear.names(),card=id=>a.d.querySelector('[data-gear-atlas-item="'+id+'"]');
  let cards=a.d.querySelectorAll('[data-gear-atlas-item]');h.assert.equal(cards.length,14);
  for(const id of Object.keys(names)){
   const node=card(id), text=node.textContent;
   if(['legacy','attack','shield'].includes(id)){
    h.assert.equal(node.dataset.collected,'true');h.assert(text.includes(names[id]));h.assert(text.includes('効果'));h.assert(node.querySelector('dl'));
   }else{
    h.assert.equal(node.dataset.collected,'false');h.assert(node.classList.contains('treasure-card'));
    h.assert.equal(node.querySelector('.treasure-name').textContent,'？？？？');
    h.assert(text.includes('未入手 · No.'));h.assert(text.includes('入手：'));
    h.assert(!text.includes(names[id]));h.assert(!text.includes('効果'));h.assert(!text.includes('未装備在庫'));
    h.assert.equal(a.w.getComputedStyle(node.querySelector('.equipment-pixel12514')).filter,'grayscale(1) brightness(0.42)');
   }
  }
  h.assert(card('dew').textContent.includes('型紙：習得済み'));
  h.assert(!card('ice').textContent.includes('型紙：習得済み'));
  h.assert(card('ice').textContent.includes('5-5'));
  h.assert(card('star').textContent.includes('10-5'));
  h.assert(a.w.checkGear.treasure().includes('treasure-pixel unknown'));
  h.change(a.w,'#gearAtlasFilter12513','missing');
  h.assert.equal(a.d.querySelectorAll('[data-gear-atlas-item]').length,11);
  h.change(a.w,'#gearAtlasTier12513','SSR');
  h.assert.equal(a.d.querySelectorAll('[data-gear-atlas-item]').length,2);
  h.change(a.w,'#gearAtlasTier12513','all');
  h.change(a.w,'#gearAtlasFilter12513','found');
  h.assert.equal(a.d.querySelectorAll('[data-gear-atlas-item]').length,3);
  h.assert.equal(a.w.localStorage.getItem(key),before);
  a.w.checkGear.obtain();a.w.checkGear.render();
  h.assert.equal(card('dew').dataset.collected,'true');h.assert(card('dew').textContent.includes(names.dew));
  h.assert(a.f.save(true));h.assert(a.f.load());a.w.checkGear.render();
  h.assert.equal(card('dew').dataset.collected,'true');
  console.log('PASS: 14 items; silhouette, source, rare blueprints, missing/found+rarity filters, first acquisition, old save reload and unchanged stored bytes while browsing.');
 }finally{a.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
