'use strict';
const {assert,open,persist}=require('./harness138.cjs');
const hooks='Object.assign(window.qa138,{checkoutGuest211});';
function sale(q, stock=12) {
 const {f,w}=q,s=f.state();
 s.materialStock211.fill(0);s.materialStock211[0]=stock;s.stock=stock;s.fame=0;
 w.Math.random=()=>0.5;
 const guest={name:'旅人',x:0,y:0},shop={level:1};
 const start=s.coins,receipts=s.shopStats211.sales,count=s.shopStats211.customers;
 f.checkoutGuest211(guest,shop);f.checkoutGuest211(guest,shop);
 const gain=s.coins-start;
 assert.equal(s.shopStats211.sales-receipts,gain);
 assert.equal(s.shopStats211.customers-count,stock?1:0);
 return gain;
}
async function main(){
 const old=await open('1.13.16',{},hooks),fresh=await open('1.13.17',{},hooks);
 try{
  assert.equal(sale(fresh,0),0);
  for(let i=0;i<6;i++)assert.equal(sale(fresh)-sale(old),i<5?30:0);
  old.f.state().shopStats211.customers=3;old.f.state().villageLv=3;old.f.save(true);
  const migrated=await open('1.13.17',persist(old.w),hooks);
  try{
   migrated.f.render('management');assert.match(migrated.d.querySelector('#tabBody').textContent,/残り2回/);
   assert.equal(sale(migrated)-sale(old),30);
   migrated.f.save(true);
   const resumed=await open('1.13.17',persist(migrated.w),hooks);
   try{
    assert.equal(sale(resumed)-sale(old),30);
    assert.equal(sale(resumed)-sale(old),0);
    resumed.f.state().shopStats211.customers=0;resumed.f.state().villageLv=old.f.state().villageLv=4;
    assert.equal(sale(resumed)-sale(old),0);
   }finally{resumed.close()}
  }finally{migrated.close()}
  console.log('PASS first five receipts, sold-out and duplicate visits, migration, save/reload, management UI and level cutoff');
 }finally{old.close();fresh.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
