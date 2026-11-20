'use strict';
const {assert,open,persist}=require('./harness138.cjs');
const hooks='Object.assign(window.qa138,{costUpgrade,investedIn,upgrade,managementHTML:()=>document.querySelector("#tabBody").textContent});';
async function run(){
 const old=await open('1.13.20',{},hooks);
 let snapshot;
 try{
  const s=old.f.state(),farm=s.buildings.find(b=>b.type==='farm');
  old.f.upgrade(farm.id);old.f.save(true);snapshot=persist(old.w);
 }finally{old.close()}
 const q=await open('1.13.21',snapshot,hooks+`
 const credits=[];const previous=gainCoins;gainCoins=n=>{credits.push(n);return previous(n)};
 window.qa138.credits=credits;
 `);
 const ref=await open('1.13.20',snapshot,hooks);
 try{
  const f=q.f,s=f.state(),farm=s.buildings.find(b=>b.type==='farm'),oldFarm=ref.f.state().buildings.find(b=>b.type==='farm');
  const paid=f.investedIn(farm);assert.equal(paid,ref.f.investedIn(oldFarm));
  const standard=ref.f.costUpgrade(oldFarm);
  for(const [level,rate,daily] of [[1,.5,100],[3,.5,100],[4,.75,60],[6,.75,60],[7,1,0]]){
   s.villageLv=level;assert.equal(f.costUpgrade(farm),Math.round(standard*rate));
   s.day=1;s.hour=22;f.credits.length=0;f.tick(true);assert(!f.credits.includes(100)&&!f.credits.includes(60));
   f.credits.length=0;f.tick(true);assert.equal(f.credits.filter(n=>n===100||n===60).length,daily?1:0);
   if(daily){assert(f.credits.includes(daily));assert(s.economy.income>=daily)}
  }
  s.villageLv=3;s.coins=2000;const cost=f.costUpgrade(farm),expense=s.economy.expense;
  f.upgrade(farm.id);assert.equal(s.coins,2000-cost);assert.equal(s.economy.expense-expense,cost);
  s.villageLv=7;assert.equal(f.investedIn(farm),paid+cost);f.save(true);
  const loaded=await open('1.13.21',persist(q.w),hooks);
  try{assert.equal(loaded.f.investedIn(loaded.f.state().buildings.find(b=>b.id===farm.id)),paid+cost)}finally{loaded.close()}
  s.villageLv=1;f.render('management');assert.match(f.managementHTML(),/牧場支援金 ＋100G/);
  console.log('PASS discounts, ledger, midnight aid, existing investment, save/reload, management display');
 }finally{ref.close();q.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
