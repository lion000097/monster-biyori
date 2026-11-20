'use strict';
const {assert, open, clone, click, change, persist, KEY, near, wait} = require('./harness138.cjs');
const hooks = `
Object.assign(window.qa138,{
  newEgg, hatchEggs, staffLimit, staffHousing139, staffTreeLimit139, hire, recoverBuilding, advanceExpedition,
  workAtSite211, progressStaffWork212, MATERIALS211, gatherMaterial211, ensureMaterials211, spendMaterials211,
  repairVIP212, pickVIPMaterial212, checkoutGuest211, phase213, lifeTick213, stepActors, tileIsFree191,
  ranchProduction200, nearestFree191, canBuild, place, chooseRoute:monsterRoute139
});
`;
const current = storage => open('1.13.9', storage, hooks);
function withRandom(w, random, action) {
  const saved = w.Math.random;
  w.Math.random = typeof random === 'function' ? random : () => random;
  try { return action(); } finally { w.Math.random = saved; }
}
function sequence(w, rolls, action) {
  let i = 0;
  const result = withRandom(w, () => { assert(i<rolls.length,'unexpected extra random roll'); return rolls[i++]; }, action);
  assert.equal(i,rolls.length,'unused random roll');
  return result;
}
function seeded(value) {
  return () => { value = (Math.imul(value,1664525)+1013904223)>>>0; return value/4294967296; };
}
function eggAndCapacityView(s) {
  return clone({monsters:s.monsters.map(m=>[m.id,m.kind,m.name,m.shiny,m.lv,m.xp,m.favorite138,m.protected138]),
    workers:s.staff.map(w=>[w.id,w.job,w.name]),eggs:s.eggs,items:s.treasures,day:s.day,coins:s.coins,
    stage:s.adventure.stage,area:s.expeditionArea213,progress:s.exploreProgress,seen:s.materialSeen211});
}
async function eggs() {
  const q=await current(),{d,w,f}=q,s=f.state();
  try {
    f.render('adventure');assert.equal(d.querySelector('[data-exp-egg]').textContent,'7%');
    const goal=f.expeditionGoal213(0), trips=()=>s.expeditionCounts213[0]||0;
    withRandom(w,.07,()=>f.advanceExpedition(goal));assert.equal(trips(),1);assert.equal(s.eggs.length,0);
    withRandom(w,.069999,()=>f.advanceExpedition(goal));assert.equal(trips(),2);
    assert.equal(s.eggs.length,1);assert.equal(s.eggs[0].source139,'expedition');assert.equal(s.eggs[0].name,undefined);
    assert.equal(s.expeditionLast137.egg,true);assert.match(s.expeditionLast137.text,/自動遠征でたまごも発見/);
    assert.equal(JSON.parse(w.localStorage.getItem(KEY)).eggs.length,1);
    f.render('adventure');assert.match(d.querySelector('[data-v137-expedition]').textContent,/たまごを発見/);
    s.speed=0;f.advanceExpedition(goal);assert.equal(trips(),2);s.speed=1;s.expeditionAuto213=false;
    f.advanceExpedition(goal);assert.equal(trips(),2);assert.equal(s.eggs.length,1);
    const normal=(roll,source='')=>sequence(w,[.5,.5,.5,.5,roll],()=>f.newEgg(true,source));
    assert.equal(normal(1/3000-1e-9).shiny,true);assert.equal(normal(1/3000).shiny,false);
    const worker=s.staff[0],tree=s.buildings.find(b=>b.type==='worldtree');worker.job='explore';
    const finish=()=>{
      worker.jobTask212={id:tree.id,job:worker.job,duration:3.1,remaining:.05};
      f.progressStaffWork212(.1);
    };
    const n=s.eggs.length;
    sequence(w,[.05],finish);assert.equal(s.eggs.length,n);
    sequence(w,[.04999,.5,.5,.5,.5,.001,.5],finish);
    const ordinary=s.eggs.at(-1);assert.equal(ordinary.source139,'staff');assert.equal(ordinary.shiny,false);assert.equal(ordinary.name,undefined);
    sequence(w,[0,.5,.5,.5,.5,.001,1/3000-1e-9],finish);
    assert.equal(s.eggs.at(-1).shiny,true);assert.equal(s.eggs.at(-1).name,undefined,'a naturally shiny egg is still an ordinary egg');
    sequence(w,[.01,.5,.5,.5,.5,.001-1e-10],finish);
    const special=s.eggs.at(-1);assert.equal(special.name,'色違いのたまご');assert.equal(special.shiny,true);assert.equal(special.source139,'staff');
    assert.match(worker.act,/色違いのたまご/);
    f.render('monster');const card=[...d.querySelectorAll('.quest')].find(el=>el.querySelector('.quest-title')?.textContent.includes('色違いのたまご'));
    assert(card);assert.match(card.textContent,/色違い確定/);assert.match(card.textContent,/探検職員/);assert.doesNotMatch(card.textContent,/1\/3000/);
    assert.match(d.querySelector('#tabBody').textContent,/1\/3000/);
    f.save(true);assert(f.load());const loaded=f.state();const egg=loaded.eggs.find(e=>e.id===special.id);
    assert.equal(egg.name,'色違いのたまご');assert.equal(egg.shiny,true);
    egg.time=egg.need;const previous=loaded.monsters.length;
    f.hatchEggs();assert.equal(loaded.monsters.length,previous+1);assert.equal(loaded.monsters.at(-1).shiny,true);
    assert(loaded.catalog.shinies.includes(egg.kind));assert(!loaded.eggs.some(e=>e.id===egg.id));
    loaded.eggs=Array.from({length:9},(_,i)=>({id:900+i,kind:0,time:0,need:15,shiny:false}));
    loaded.speed=1;loaded.expeditionAuto213=true;withRandom(w,0,()=>f.advanceExpedition(goal));
    assert.equal(loaded.eggs.length,9);assert.equal(loaded.expeditionLast137.egg,false);assert.equal(loaded.expeditionCounts213[0],3);
    loaded.expeditionAuto213=false;
    sequence(w,[],()=>f.workAtSite211(loaded.staff[0],tree));assert.equal(loaded.eggs.length,9);
    console.log('PASS automatic return with/without egg, 9-egg limit, normal 1/3000, exact conditional 0.1%, staff-only name, hatch and shiny catalog');
  } finally {q.close();}
}

async function scoutFromRanchUI() {
  const q=await current(),{w,d,f}=q,s=f.state();
  try {
    click(d,'[data-tab="staff"]');
    const worker=s.staff[0];
    change(w,'[data-staff="'+worker.id+'"]','explore');
    withRandom(w,.1,()=>f.tick(false));
    assert.equal(worker.jobTarget211?.job,'explore','assigned scout sets out from its real position');
    withRandom(w,.01,()=>{
      for(let i=0;i<800&&!s.eggs.some(e=>e.source139==='staff');i++)f.stepActors(.1);
    });
    assert(s.eggs.some(e=>e.source139==='staff'),'scout reaches the workplace and finds an egg');
    assert.equal(worker.jobTask212,null);
    assert.match(s.log.find(entry=>entry.msg.includes('を持ち帰ったよ'))?.msg||'',/探検で「たまご」/);
    console.log('PASS staff job selected in the UI, real walk to the World Tree, work, egg harvest and saved log');
  } finally {q.close();}
}

async function capacity() {
  const q=await current(),{w,d,f}=q,s=f.state();
  try {
    for(const [lv,n] of [[1,4],[5,12],[10,23],[15,34],[20,45],[21,47]]){
      s.villageLv=lv;assert.equal(f.monsterLimit(),n);
    }
    for(let lv=2;lv<=30;lv++)assert(f.monsterTreeLimit135(lv)>f.monsterTreeLimit135(lv-1));
    const template=clone(s.monsters[0]);
    s.villageLv=20;s.monsters=Array.from({length:44},(_,i)=>({...clone(template),id:500+i}));
    s.eggs=[{id:301,kind:0,time:15,need:15,shiny:false},{id:302,kind:0,time:15,need:15,shiny:true}];
    f.hatchEggs();assert.equal(s.monsters.length,45);assert.equal(s.eggs.length,1);
    f.hatchEggs();assert.equal(s.monsters.length,45);f.render('monster');assert.match(d.querySelector('#tabBody > .quest').textContent,/満員/);
    assert.match(d.querySelector('#tabBody > .quest').textContent,/世界樹/);assert.doesNotMatch(d.querySelector('#tabBody > .quest').textContent,/ハウス/);
    s.villageLv=21;f.hatchEggs();assert.equal(s.monsters.length,46);assert.equal(s.eggs.length,0);
    const home=s.buildings.find(b=>b.type==='home');home.level=12;s.coins=99999;
    s.villageLv=1;assert.equal(f.staffLimit(),2);const n=s.staff.length;f.hire();assert.equal(s.staff.length,n);
    s.villageLv=4;assert.equal(f.staffLimit(),3);f.render('staff');click(d,'[data-action="hire"]');assert.equal(s.staff.length,3);
    assert(d.querySelector('[data-action="hire"]').disabled);
    s.villageLv=20;assert.equal(f.staffLimit(),8);home.level=2;assert.equal(f.staffLimit(),3);
    let confirms=0;w.confirm=()=>{confirms++;return true;};f.recoverBuilding(home.id);
    assert.equal(confirms,0);assert(s.buildings.includes(home));
    s.staff.pop();f.recoverBuilding(home.id);assert.equal(confirms,1);assert(!s.buildings.includes(home));
    assert.equal(f.monsterLimit(),45);assert.equal(f.staffLimit(),2);
    console.log('PASS all world-tree levels, real 45th hatch, wait/resume, staff hire and house recovery limits');
  } finally {q.close();}
}

async function materials() {
  const q=await current(),{w,d,f}=q,s=f.state();
  try {
    assert.equal(f.MATERIALS211.length,24);assert.equal(new Set(f.MATERIALS211.map(m=>m[0])).size,24);
    assert.equal(d.querySelector('[data-tab="materials"]'),null);
    click(d,'[data-tab="bestiary"]');click(d,'[data-action="atlas"][data-id="material"]');
    assert.equal(d.querySelectorAll('#tabBody .treasure-grid>.treasure-card').length,24);assert(d.querySelector('[data-tab="bestiary"]').classList.contains('on'));
    f.ensureMaterials211();
    const rates={N:.5,R:.12,SR:.03,UR:.003};
    for(const rarity of Object.keys(rates)){
      const ids=f.MATERIALS211.map((m,i)=>m[3]===rarity?i:-1).filter(i=>i>=0);
      for(const [n,id] of ids.entries()){
        const old=s.materialStock211[id];
        sequence(w,[rates[rarity],.9,(n+.25)/ids.length],()=>f.gatherMaterial211({kind:2,lv:12,gift212:3},2));
        assert.equal(s.materialStock211[id],old+2);
      }
    }
    assert.equal(s.materialSeen211.length,24);assert.equal(s.stock,s.materialStock211.reduce((a,b)=>a+b,0));
    f.render('bestiary');assert.match(d.querySelector('#tabBody').textContent,/24 \/ 24種/);
    assert.match(d.querySelector('#tabBody').textContent,/雪精の氷花/);
    change(w,'[data-v137-atlas-filter]','new');assert.match(d.querySelector('[data-v137-read="material"]').textContent,/23件/);
    click(d,'[data-v137-read="material"]');assert.match(d.querySelector('#tabBody').textContent,/該当する素材はない/);
    change(w,'[data-v137-atlas-filter]','found');
    assert.equal([...d.querySelectorAll('.treasure-grid>.treasure-card')].filter(n=>n.style.display!=='none').length,24);
    s.materialStock211.fill(0);s.materialStock211[23]=8;f.ensureMaterials211();assert.equal(f.pickVIPMaterial212().id,23);
    s.vipOrder211={id:23,qty:2,expires:s.day+7,reward:90,fame:1,visitor:'試験客'};f.repairVIP212();assert.equal(s.vipOrder211.id,23);
    click(d,'[data-tab="management"]');click(d,'[data-v211="deliver"]');assert.equal(s.materialStock211[23],6);
    const formerStock=s.stock;withRandom(w,.5,()=>f.checkoutGuest211({name:'旅人',rare211:false},{level:1}));
    assert(s.materialStock211[23]<6);near(s.stock,formerStock-s.shopStats211.units);
    f.spendMaterials211(s.stock);f.save(true);assert(f.load());
    assert.equal(f.state().materialStock211.length,24);assert.equal(f.state().stock,0);assert.equal(f.state().materialSeen211.length,24);
    for(const name of ['friend','enemy','citizen','material']){click(d,'[data-tab="bestiary"]');click(d,'[data-action="atlas"][data-id="'+name+'"]');assert(d.querySelector('.treasure-grid>.treasure-card'));}
    console.log('PASS all 24 materials are obtainable, catalog navigation/NEW/filters, zero-stock discovery, high-ID orders, sales and save reload');
  } finally {q.close();}
}

async function movement(){
  const q=await current(),{w,f}=q,s=f.state();
  try{
    withRandom(w,seeded(731311),()=>{
      const original=clone(s.monsters[0]), start=f.nearestFree191(8,8);
      s.monsters=Array.from({length:45},(_,i)=>({...clone(original),id:400+i,x:start.x,y:start.y,path:[],ranchGoal200:null,ranchTarget200:null}));
      s.hour=17;s.speed=1;s.guests=[];s.staff=[];
      let activeAt2=0;const previous=s.monsters.map(m=>[m.x,m.y]);
      function step(){
        f.stepActors(.1);
        for(const [i,m] of s.monsters.entries()){
          assert(f.tileIsFree191(Math.round(m.x),Math.round(m.y)),'walkable tile');
          assert(Math.hypot(m.x-previous[i][0],m.y-previous[i][1])<.13,'no teleport');
          previous[i]=[m.x,m.y];
        }
      }
      for(let i=0;i<300;i++){step();if(i===19)activeAt2=s.monsters.filter(m=>m.path.length).length;}
      assert(activeAt2>0&&activeAt2<45,'staggered departure: '+activeAt2);
      const distinct=new Set(s.monsters.map(m=>Math.round(m.x)+','+Math.round(m.y))).size;
      assert(distinct>=25,'45-monster crowd disperses: '+distinct);
      const sample=s.monsters.map(m=>[m.x,m.y]);s.speed=0;
      for(let i=0;i<10;i++)f.animate(f.timing().frameAt+100);assert.deepEqual(s.monsters.map(m=>[m.x,m.y]),sample);
      s.speed=1;s.hour=10;s.villageLv=20;
      let spot;
      for(let y=2;y<19&&!spot;y++)for(let x=2;x<21&&!spot;x++)if(f.canBuild(x,y,null,false,'ranch'))spot=[x,y];
      assert(spot);f.place('ranch',...spot);
      const ranch=s.buildings.find(b=>b.type==='ranch');assert(ranch);const stock=s.stock;
      for(const m of s.monsters){m.produce=12;f.ranchProduction200(m,false);}
      let peak=0;
      for(let i=0;i<500;i++){
        step();
        const destinations=s.monsters.filter(m=>m.ranchTarget200).map(m=>m.ranchGoal200.join(','));
        assert.equal(new Set(destinations).size,destinations.length,'incoming ranch entrances stay distinct');
        peak=Math.max(peak,destinations.length);
      }
      assert(peak>=2,'multiple reserved ranch entrances');assert(s.stock>stock,'real ranch arrivals produced materials');
      s.hour=22;f.lifeTick213();assert(s.monsters.every(m=>!m.ranchTarget200));
      const isolated={x:42,y:28,type:'ranch'};assert.equal(f.chooseRoute(s.monsters[0],[isolated],1,true),null,'unreachable sites do not create an invalid path');
      console.log('PASS 45 initially stacked monsters: '+distinct+' distinct tiles after 30 seconds, '+peak+' simultaneous distinct ranch entrances; production, night, obstacles and pause');
    });
  }finally{q.close();}
}

async function compatibility(){
  const old=await open('1.13.8');let storage,baseline;
  try{
    const {f}=old,s=f.state();s.villageLv=s.worldTreeLevel=9;s.monsters[0].favorite138=true;s.monsters[0].protected138=true;
    const tmpl=clone(s.staff[0]);s.staff=Array.from({length:10},(_,i)=>({...clone(tmpl),id:800+i,name:'職員'+i}));
    s.eggs=[{id:900,kind:0,shiny:true,need:15,time:8}];s.materialStock211=[5,0,2,0,0,0,0,0,0,0,0,0];
    s.stock=7;s.materialSeen211=[0,2,11];s.expeditionArea213=1;s.adventure.stage=12;s.exploreProgress=51.25;
    s.expeditionCounts213=[7,8];s.treasures=[2,7,9];s.bestiary.treasures=s.treasures;
    f.save(true);storage=persist(old.w);baseline=eggAndCapacityView(s);
  }finally{old.close();}
  const q=await current(storage),{f,w,d}=q;
  try{
    assert.deepEqual(eggAndCapacityView(f.state()),baseline);assert.equal(f.state().staff.length,10);
    assert.deepEqual(clone(f.state().materialStock211),[5,0,2,...Array(21).fill(0)]);assert.equal(f.state().eggs[0].name,undefined);
    f.render('staff');assert(d.querySelector('[data-action="hire"]').disabled);
    click(d,'[data-tab="bestiary"]');click(d,'[data-action="atlas"][data-id="material"]');
    assert.equal(d.querySelector('[data-v137-read="material"]'),null,'legacy discoveries are already read');
    f.save(true);f.saveBackup213('manual');f.state().coins+=321;f.restore213(0);
    assert.deepEqual(eggAndCapacityView(f.state()),baseline);
    click(d,'#helpBtn');const input=d.querySelector('#importInput');
    Object.defineProperty(input,'files',{value:[new w.File([storage[KEY]],'v138.json',{type:'application/json'})]});
    input.dispatchEvent(new w.Event('change',{bubbles:true}));
    for(let i=0;i<50&&!d.querySelector('#toasts').textContent.includes('セーブデータを読み込んだよ');i++)await wait(20);
    assert(d.querySelector('#toasts').textContent.includes('セーブデータを読み込んだよ'));assert.deepEqual(eggAndCapacityView(f.state()),baseline);
    console.log('PASS real 1.13.8 save migration, over-cap staff retained, original shiny egg, inventory/NEW, favorites/protection, progress, restore and import');
  }finally{q.close();}
}
(async()=>{await eggs();await scoutFromRanchUI();await capacity();await materials();await compatibility();await movement();})()
  .catch(e=>{console.error(e);process.exitCode=1});
