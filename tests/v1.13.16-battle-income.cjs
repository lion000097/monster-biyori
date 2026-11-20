'use strict';
const {assert, open} = require('./harness138.cjs');
const hooks = `
Object.assign(window.qa138,{
 clearPreview:()=>encounterPreviewCache199.clear(), adventureTick, previewEncounterV161, currentMarketOrder, expeditionReward, checkoutGuest211,
 drawLabels:()=>{
   const labels=[], original=battleCtx.fillText;
   battleCtx.fillText=function(label,...args){labels.push(label);return original.call(this,label,...args)};
   try {drawBattle(performance.now())} finally {battleCtx.fillText=original}
   return labels;
 }
});`;
async function main(){
 const old=await open('1.13.15',{},hooks), q=await open('1.13.16',{},hooks);
 try{
  const {f,d}=q,s=f.state(),badge=d.getElementById('battleResult');
  assert(badge.hidden);
  for(const stage of [1,4,5,6,10,21,65]){
   for(const sample of [old,q]){
    sample.f.clearPreview();let seed=stage;
    sample.w.Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    sample.f.state().battle=null;sample.f.state().adventure.stage=stage;
   }
   const base=old.f.previewEncounterV161(stage).foes;
   f.previewEncounterV161(stage);f.startAdventure();
   s.battle.foes.forEach((e,i)=>{
    assert.equal(e.index,base[i].index);
    assert.equal(e.hp,Math.round(base[i].hp*(e.boss?1.45:stage<5?1.20:1.35)));
    assert.equal(e.atk,Math.round(base[i].atk*(e.boss?1.30:stage<5?1.12:1.23)));
   });
   s.battle.ourHp=1;
   for(const e of s.battle.foes){e.hp=e.maxHp=99999;e.atk=9999}
   const priorCoins=s.coins, clears=s.adventure.clears;
   f.adventureTick(false);assert.equal(s.battle,null);assert.equal(s.coins,priorCoins);assert.equal(s.adventure.clears,clears);
   assert.equal(s.adventure.stage,stage);assert.match(badge.textContent,/LOSE$/);
   const lose=f.drawLabels();assert(lose.includes('LOSE'));assert(!lose.includes('CLEAR!'));
   s.adventure.auto=true;f.adventureTick(false);assert(s.battle);assert.match(badge.textContent,/LOSE$/);
   for(const e of s.battle.foes)e.hp=0;
   f.adventureTick(false);assert.equal(s.adventure.clears,clears+1);assert.match(badge.textContent,/CLEAR$/);
   const win=f.drawLabels();assert(win.includes('CLEAR!'));assert(!win.includes('LOSE'));
  }
  for(const [level,rate] of [[1,.15],[3,.15],[4,.10],[6,.10],[7,.06],[10,.06],[11,.03],[20,.03]]){
   s.villageLv=old.f.state().villageLv=level;
   const order=old.f.currentMarketOrder();
   assert(Math.abs(f.currentMarketOrder().reward-order.reward*(1+rate))<=1);
   assert.equal(f.expeditionReward(0).coins, Math.round(65*(1+rate)));
  }
  for(const sample of [old,q]){
   const st=sample.f.state();st.villageLv=1;st.materialStock211[0]=20;st.stock=20;st.fame=0;
   const start=st.coins, sales=st.shopStats211.sales;
   sample.w.Math.random=()=>0.5;
   sample.f.checkoutGuest211({name:'旅人',x:0,y:0},{level:1});
   const gain=st.coins-start;assert(gain>0);assert.equal(st.shopStats211.sales-sales,gain);
   sample.sale=gain;
  }
  assert(Math.abs(q.sale-old.sale*1.15)<=1);
  console.log('PASS battle canvas results, automatic retry, enemy strength, market orders, expedition rewards and shop receipts');
 }finally{q.close();old.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
