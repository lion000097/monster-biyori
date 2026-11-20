'use strict';

const {assert, open, persist, KEY, clone, wait, click, change, advance, near} = require('./harness138.cjs');
const hooks = `Object.assign(window.qa138,{villageThreshold,monsterLevelNeed135,staffLevelNeed,
  treeCost193,currentMarketOrder,beginStaffWork212,progressStaffWork212,staffWages});`;

function belongings(s) {
  return clone({
    coins:s.coins, food:s.food, magic:s.magic, fame:s.fame, stock:s.stock,
    materials:s.materialStock211, seen:s.materialSeen211, eggs:s.eggs, treasures:s.treasures,
    village:s.villageLv, tree:s.worldTreeLevel, buildings:s.buildings.map(b=>[b.id,b.type,b.level]),
    monsters:s.monsters.map(m=>[m.id,m.kind,m.name,m.lv,m.shiny,m.favorite138]),
    workers:s.staff.map(w=>[w.id,w.name,w.job,w.level,w.mastery]), research:s.research,
    stage:s.adventure.stage, progress:s.exploreProgress
  });
}

async function legacySave() {
  const q=await open('1.13.12',{},'Object.assign(window.qa138,{villageThreshold,monsterLevelNeed135});');
  try {
    const {f,w}=q, s=f.state();
    s.speed=0; s.villageLv=s.worldTreeLevel=12;
    s.buildings.find(b=>b.type==='worldtree').level=12;
    s.villageXp=f.villageThreshold(12)*1.42;
    Object.assign(s,{coins:41234.75,food:235.6,magic:189.25,fame:804.5});
    s.materialStock211[0]=0; s.materialStock211[4]=56; s.materialStock211[29]=1;
    s.stock=57; s.materialSeen211=[0,4,29];
    s.eggs=[{id:900,kind:1,time:7,need:14,shiny:true,name:'色違いのたまご',source139:'staff'}];
    s.treasures=[0,2,7]; s.bestiary.treasures=s.treasures;
    s.adventure.stage=12; s.exploreProgress=20.5;
    s.monsters.forEach((m,i)=>{
      m.lv=7+5*i; m.xp=f.monsterLevelNeed135(m.lv)*[.375,1.2,0][i];
    });
    s.monsters[0].favorite138=true;
    const worker=s.staff[0]; worker.level=8;
    worker.mastery.keeper=90; worker.mastery.gather=7*90+37.5;
    s.staff[1].level=99; s.staff[1].mastery.sell=12000;
    s.backupDay213=s.day; assert(f.save(true)); assert(f.saveBackup213('manual'));
    return {storage:persist(w),raw:w.localStorage.getItem(KEY),holdings:belongings(s)};
  } finally {q.close();}
}

async function migration() {
  const old=await legacySave(), q=await open('1.13.13',old.storage,hooks);
  try {
    const {d,w,f}=q;
    function check() {
      const s=f.state();
      assert.equal(s.ranchPace1313,true);
      assert.deepEqual(belongings(s),old.holdings);
      near(s.villageXp/f.villageThreshold(12),1.42);
      s.monsters.forEach((m,i)=>near(m.xp/f.monsterLevelNeed135(m.lv),[.375,1.2,0][i]));
      near(s.staff[0].workXp/f.staffLevelNeed(8),37.5/90);
      assert.equal(s.staff[1].workXp,0);
    }
    check(); assert(f.save(true)); assert(f.load()); check();
    const manual=f.backupList213().findIndex(b=>b.type==='manual'&&b.data===old.raw);
    assert(manual>=0); f.state().coins=111; f.restore213(manual); check();
    f.state().coins=222;
    click(d,'#helpBtn'); click(d,'[data-guide-tab="basics"]');
    const input=d.querySelector('#importInput');
    Object.defineProperty(input,'files',{value:[new w.File([old.raw],'牧場.json',{type:'application/json'})]});
    input.dispatchEvent(new w.Event('change',{bubbles:true}));
    for(let i=0;i<60&&f.state().coins===222;i++)await wait(15);
    check(); assert(f.save(true)); assert(f.load()); check();
    assert(f.backupList213().some(b=>b.type==='manual'&&b.data===old.raw));
    console.log('PASS v1.13.12 inventories, levels, fractional and banked XP, job switch history, reload, manual restore and file import');
  } finally {q.close();}
}

async function balanceActions() {
  const q=await open('1.13.13',{},hooks);
  try {
    const {f,w,d}=q,s=f.state(),worker=s.staff[0];
    assert.equal(s.ranchPace1313,true); assert.equal(worker.workXp,0);
    for(let level=1;level<=24;level++){
      assert(f.villageThreshold(level+1)>f.villageThreshold(level));
      assert(f.monsterLevelNeed135(level+1)>f.monsterLevelNeed135(level));
      assert(f.staffLevelNeed(level+1)>f.staffLevelNeed(level));
      for(const key of ['coins','magic'])assert(f.treeCost193(level+1)[key]>f.treeCost193(level)[key]);
    }
    f.render('staff');
    const home=s.buildings.find(b=>b.type==='home'),farm=s.buildings.find(b=>b.type==='farm');
    worker.workXp=f.staffLevelNeed(1)-4;
    f.beginStaffWork212(worker,home); f.progressStaffWork212(2);
    assert.equal(worker.workXp,f.staffLevelNeed(1)-4);
    s.speed=0; advance(f,2); assert.equal(worker.workXp,f.staffLevelNeed(1)-4);
    s.speed=1; f.progressStaffWork212(1.2); assert.equal(worker.level,1);
    assert.equal(worker.workXp,f.staffLevelNeed(1)-1);
    change(w,'.staff-select[data-staff="'+worker.id+'"]','gather');
    f.beginStaffWork212(worker,farm); f.progressStaffWork212(3.2);
    assert.equal(worker.level,2); assert.equal(worker.workXp,2);
    near(worker.mastery.keeper,3); near(worker.mastery.gather,3);
    worker.level=99; worker.workXp=0;
    f.beginStaffWork212(worker,farm); f.progressStaffWork212(3.2);
    assert.equal(worker.level,99); assert.equal(worker.workXp,0);
    const m=s.monsters[0]; m.xp=f.monsterLevelNeed135(m.lv)-.01;
    const level=m.lv; f.tick(true); assert.equal(m.lv,level+1);
    assert(m.xp>=0&&m.xp<1);
    const first=f.currentMarketOrder(); s.villageLv=s.worldTreeLevel=19;
    s.buildings.find(b=>b.type==='worldtree').level=19;
    const order=f.currentMarketOrder();
    for(const key of ['stock','food','reward'])assert(order[key]>first[key]);
    s.materialStock211.fill(0); s.materialStock211[0]=s.stock=order.stock-1; s.food=order.food;
    f.render('management'); const button=()=>d.querySelector('[data-action="completeOrder"]');
    assert(button().disabled); s.materialStock211[0]++; s.stock++;
    f.render('management'); assert(!button().disabled); assert(button().textContent.includes(order.reward+'G'));
    const before=s.coins, fame=s.fame, count=s.economy.ordersDone;
    button().click();
    near(s.coins-before,order.reward); near(s.fame-fame,order.fame);
    near(s.stock,0); near(s.food,0); assert.equal(s.economy.ordersDone,count+1);
    // A completed VIP delivery also checks missions. Isolate the quoted payment.
    s.quests=[]; s.vipOrder211={id:4,qty:2,reward:865,fame:3,expires:s.day+7,visitor:'旅人'};
    s.stock=s.materialStock211[4]=2; const beforeVip=s.coins;
    f.render('management'); click(d,'[data-v211="deliver"]');
    near(s.coins-beforeVip,865); near(s.stock,0);
    console.log('PASS growth curves, visible and paused staff work, role change, Lv.99 cap, passive monster XP and displayed market/VIP rewards');
  } finally {q.close();}
}

(async()=>{await migration(); await balanceActions();})().catch(err=>{console.error(err);process.exitCode=1;});
