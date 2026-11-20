'use strict';

const {assert, open, click, clone, near, wait, KEY} = require('./harness138.cjs');
const hooks = `Object.assign(window.qa138,{materials:MATERIALS211,spendableMaterial,spendableStock,
  spendMaterials211,ensureMaterials211,checkoutGuest211,advanceSystems,currentMarketOrder,
  completeOrder,deliverVIP211,pickVIPMaterial212});`;

(async()=>{
  const q=await open('1.13.14',{},hooks);
  try{
    const {f,d,w}=q; let s=f.state();
    s.speed=0; s.quests=[];
    const rare=clone(f.materials).flatMap((m,id)=>['SSR','UR'].includes(m[3])?[id]:[]);
    assert.deepEqual(rare,[11,23,24,25,26,27,28,29]);
    function inventory(entries={}) {
      s.materialStock211.fill(0);
      for(const [key,qty] of Object.entries(entries))s.materialStock211[Number(key)]=qty;
      s.stock=s.materialStock211.reduce((sum,n)=>sum+n,0);
      f.ensureMaterials211();
    }
    const oneOfEach=Object.fromEntries(rare.map(id=>[id,1]));
    inventory(oneOfEach);
    f.render('management'); assert.equal(d.querySelector('#rareReserve').checked,false);
    assert.equal(f.spendableStock(),rare.length);
    click(d,'#rareReserve'); assert.equal(s.reserveRareMaterials,true); assert.equal(f.spendableStock(),0);
    f.render('management'); assert.equal(d.activeElement.id,'rareReserve');
    for(const id of rare)assert.equal(f.spendableMaterial(id),0);
    assert.equal(f.spendMaterials211(5,29).length,0);
    assert.equal(s.stock,rare.length);
    inventory({...oneOfEach,0:2,9:2,27:.75,28:1.5,29:2});
    near(f.spendableStock(),5.5);
    const spent=f.spendMaterials211(20,29);
    assert.equal(spent[0].id,29); near(spent.reduce((a,o)=>a+o.amount,0),5.5);
    for(const id of rare)near(s.materialStock211[id],id===27?.75:1);
    near(s.stock,rare.length-.25); assert.equal(f.spendableStock(),0);
    inventory(oneOfEach);
    const workshop={id:s.nextId++,type:'workshop',level:1,x:0,y:0};
    s.buildings.push(workshop); s.craftProgress=31.5; s.magic=25;
    const charms=s.charms;
    f.advanceSystems(true);
    assert.equal(s.craftProgress,31.5); assert.equal(s.magic,25); assert.equal(s.charms,charms);
    inventory({...oneOfEach,0:6}); f.advanceSystems(true);
    assert.equal(s.charms,charms+1); near(s.magic,23.5); assert.equal(s.craftProgress,0); near(s.stock,rare.length);
    const order=f.currentMarketOrder(), market='[data-action="completeOrder"]';
    inventory({...oneOfEach,0:order.stock-1}); s.food=order.food; f.render('management');
    const cash=s.coins, fame=s.fame, orders=s.economy.ordersDone;
    assert(d.querySelector(market).disabled); f.completeOrder();
    near(s.coins,cash); near(s.food,order.food); near(s.fame,fame); assert.equal(s.economy.ordersDone,orders);
    inventory({...oneOfEach,0:order.stock}); f.render('management');
    assert(!d.querySelector(market).disabled); click(d,market);
    near(s.coins-cash,order.reward); assert.equal(s.economy.ordersDone,orders+1);
    near(s.food,0); near(s.stock,rare.length);
    const vip='[data-v211="deliver"]';
    s.vipOrder211={id:29,qty:1,reward:865,fame:3,expires:s.day+7,visitor:'旅人'};
    inventory({...oneOfEach,0:10}); f.render('management');
    assert(d.querySelector(vip).disabled); const beforeVip=s.coins;
    f.deliverVIP211(); assert(s.vipOrder211); near(s.coins,beforeVip); near(s.stock,rare.length+10);
    inventory({...oneOfEach,0:10,29:2}); f.render('management');
    assert(!d.querySelector(vip).disabled); click(d,vip); assert.equal(s.vipOrder211,null);
    near(s.coins-beforeVip,865); assert.equal(s.materialStock211[29],1); assert.equal(s.materialStock211[0],10);
    const shop={level:1}, customer=rare211=>({name:'旅人',x:1,y:1,rare211});
    for(const special of [false,true]){
      inventory(oneOfEach); const sold=s.metrics.sell, guests=s.shopStats211.customers;
      const first=customer(special); f.checkoutGuest211(first,shop);
      assert.equal(first.act,'売り切れ'); near(s.metrics.sell,sold); assert.equal(s.shopStats211.customers,guests);
      inventory({...oneOfEach,29:2});
      const next=customer(special); f.checkoutGuest211(next,shop); f.checkoutGuest211(next,shop);
      near(s.metrics.sell-sold,1); assert.equal(s.shopStats211.customers,guests+1); near(s.stock,rare.length);
    }
    inventory(oneOfEach); s.materialSeen211=rare.slice();
    assert.equal(f.pickVIPMaterial212(),null);
    inventory({...oneOfEach,29:2});
    assert.deepEqual(clone(f.pickVIPMaterial212()),{id:29,qty:1});
    f.render('bestiary'); click(d,'[data-action="atlas"][data-id="material"]');
    assert.doesNotMatch(d.querySelector('.material-gallery').textContent,/在庫/);
    assert.equal(d.querySelectorAll('.material-card.found').length,rare.length);
    assert(f.save(true)); const raw=w.localStorage.getItem(KEY); assert(f.load()); s=f.state();
    assert.equal(s.reserveRareMaterials,true);
    f.render('management'); click(d,'#rareReserve');
    assert.equal(s.reserveRareMaterials,false); near(f.spendableStock(),s.stock);
    assert.equal(f.spendMaterials211(1,24)[0].id,24); assert.equal(s.materialStock211[24],0);
    f.importSave(new w.File([raw],'牧場.json',{type:'application/json'}));
    for(let i=0;i<60 && !f.state().reserveRareMaterials;i++)await wait(15);
    assert.equal(f.state().reserveRareMaterials,true); assert.equal(f.spendableMaterial(24),0);
    console.log('PASS each SSR/UR, fractional holdings, checkout, workshop, market order, VIP delivery and generation, catalog, opt-out, save and file import');
  } finally {q.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
