'use strict';

const {assert,open,click,clone,KEY,persist,wait}=require('./harness138.cjs');
const hooks=`Object.assign(window.qa138,{EGG_LIMIT,buyEgg,newEgg,findEgg139,workAtSite211,
  hatchEggs,advanceExpedition,chooseExploreEgg,validBackup213,adventureTick});`;
const current=storage=>open('1.13.15',storage,hooks);
const offerButton=action=>'[data-egg-offer="'+action+'"]';

function randomDuring(w,random,action) {
  const saved=w.Math.random; w.Math.random=random;
  try { return action(); } finally {w.Math.random=saved;}
}
function rolls(w,values,action) {
  let i=0;
  const result=randomDuring(w,()=>{assert(i<values.length,'unexpected additional drop roll');return values[i++];},action);
  assert.equal(i,values.length,'expected all drop rolls');return result;
}
const lucky=(w,action)=>randomDuring(w,()=>0,action);
function egg(s,index) {
  const e={id:s.nextId++,kind:index%4,shiny:index===1||index===2,time:index/4,need:15};
  if(index===1){e.source139='staff';e.name='色違いのたまご';}
  if(index===2)e.source139='expedition';
  return e;
}
const dialog=d=>d.querySelector('#modal.show #eggOfferTitle');
async function showReview(q) {
  const {f,d}=q;
  f.render('monster');
  if(!dialog(d))click(d,'#eggOfferOpen');
  for(let i=0;i<10&&!dialog(d);i++)await wait(5);
  assert(dialog(d));assert.match(dialog(d).textContent,/入れ替えますか[？?]/);
}

async function eggSources() {
  const q=await current();
  try {
    const {f,w,d}=q,s=f.state();
    assert.equal(f.EGG_LIMIT,9);
    const worker=s.staff[0], tree=s.buildings.find(b=>b.type==='worldtree');
    s.speed=1;s.expeditionAuto213=false; worker.job='explore'; s.eggs=[];
    rolls(w,[.05],()=>f.workAtSite211(worker,tree));assert.equal(s.eggs.length,0);
    rolls(w,[.04999,.5,.5,.5,.5,.001,.5],()=>f.workAtSite211(worker,tree));
    assert.equal(s.eggs[0].shiny,false);assert.equal(s.eggs[0].source139,'staff');
    const natural=rolls(w,[.5,.5,.5,.5,1/3000-1e-9],()=>f.newEgg(true,'expedition'));
    assert(natural.shiny);assert.equal(natural.name,undefined);
    const plain=rolls(w,[.5,.5,.5,.5,1/3000],()=>f.newEgg(true,'expedition'));
    assert.equal(plain.shiny,false);
    rolls(w,[.0499,.5,.5,.5,.5,.001-1e-9],()=>f.workAtSite211(worker,tree));
    assert.equal(s.eggs.at(-1).name,'色違いのたまご');
    assert.equal(s.eggs.at(-1).shiny,true);
    while(s.monsters.length<f.monsterLimit())s.monsters.push({...s.monsters[0],id:s.nextId++});
    s.eggs=Array.from({length:f.EGG_LIMIT-1},(_,i)=>egg(s,i));
    s.coins=9999;s.food=99;f.render('monster');
    const shop='[data-action="egg"]';assert(!d.querySelector(shop).disabled,'a full pasture can still purchase an egg');
    click(d,shop);assert.equal(s.eggs.length,9);assert(s.coins<9999);assert.equal(s.food,81);
    const possessions=clone(s.eggs), money=s.coins, food=s.food;
    assert(d.querySelector(shop).disabled);
    f.buyEgg();assert.equal(s.coins,money);assert.equal(s.food,food);
    assert.equal(f.newEgg(false),null);assert.equal(f.newEgg(true),null);
    assert.deepEqual(clone(s.eggs),possessions);
    s.buildings.push({id:s.nextId++,type:'spring',level:1,x:2,y:2});
    s.springProgress=85;s.adventure.auto=false;
    f.tick(true);
    assert.equal(s.eggs.length,9);assert(s.springProgress<85);
    assert(!s.pendingExploreEgg);
    s.adventure.stage=5;f.startAdventure();assert(s.battle.boss);
    for(const foe of s.battle.foes)foe.hp=1;
    const clears=s.adventure.clears;
    lucky(w,()=>{for(let i=0;i<4&&s.battle;i++)f.adventureTick(true);});
    assert.equal(s.adventure.clears,clears+1);assert.equal(s.eggs.length,9);assert(!s.pendingExploreEgg);
    console.log('PASS staff drop and conditional special boundaries, 1/3000 natural shiny, store, spring, and actual boss return at capacity');
  } finally {await Promise.resolve();q.close();}
}

async function legacySave() {
  const old=await open('1.13.14');
  try {
    const {f,w}=old,s=f.state();s.speed=0;
    while(s.monsters.length<f.monsterLimit())s.monsters.push({...s.monsters[0],id:s.nextId++});
    s.nextId=7000;s.eggs=Array.from({length:10},(_,i)=>egg(s,i));s.nextId=100;
    s.eggs[0].time=s.eggs[0].need;
    s.backupDay213=s.day;assert(f.save(true));assert(f.saveBackup213('manual'));
    return {storage:persist(w),eggs:clone(s.eggs),raw:w.localStorage.getItem(KEY)};
  } finally {old.close();}
}

async function deferredAndAtomicSwap() {
  const old=await legacySave(),q=await current(old.storage);
  try {
    const {f,d,w}=q;let s=f.state();
    assert.deepEqual(clone(s.eggs),old.eggs);assert(!s.pendingExploreEgg);
    assert(s.nextId>Math.max(...s.eggs.map(e=>e.id)));
    s.speed=1;s.expeditionAuto213=false;
    const worker=s.staff[0],tree=s.buildings.find(b=>b.type==='worldtree');worker.job='explore';
    click(d,'#helpBtn');const guideTitle=d.querySelector('#helpTitle').textContent;
    lucky(w,()=>f.workAtSite211(worker,tree));
    const pending=clone(s.pendingExploreEgg);
    assert(pending.shiny);assert.equal(pending.name,'色違いのたまご');assert.equal(pending.source139,'staff');
    assert(!s.eggs.some(e=>e.id===pending.id));
    assert.deepEqual(clone(s.eggs),old.eggs);assert.deepEqual(JSON.parse(w.localStorage.getItem(KEY)).pendingExploreEgg,pending);
    rolls(w,[],()=>f.findEgg139('staff',1));rolls(w,[],()=>f.findEgg139('expedition',1));
    f.render('monster');
    assert.equal(d.querySelector('#helpTitle').textContent,guideTitle,'existing guide stays open');
    assert(!dialog(d));click(d,'#modalClose');await showReview(q);
    click(d,offerButton('later'));f.render();assert(!dialog(d));assert.deepEqual(clone(s.pendingExploreEgg),pending);
    await showReview(q);w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    f.render();assert(!dialog(d));await showReview(q);
    assert.equal(f.chooseExploreEgg('swap',-777),false);assert.equal(f.chooseExploreEgg('receive'),false);
    const target=old.eggs[4].id;
    const setItem=w.Storage.prototype.setItem;const disk=w.localStorage.getItem(KEY);
    try{
      w.Storage.prototype.setItem=function(k,v){if(k===KEY)throw new w.DOMException('full','QuotaExceededError');return setItem.call(this,k,v);};
      assert.equal(f.chooseExploreEgg('swap',target),false);
      assert.deepEqual(clone(s.eggs),old.eggs);assert.deepEqual(clone(s.pendingExploreEgg),pending);
      assert.equal(w.localStorage.getItem(KEY),disk);
    }finally{w.Storage.prototype.setItem=setItem;}
    s.speed=0;assert(f.save(true));assert(f.saveBackup213('manual'));
    const pendingRaw=w.localStorage.getItem(KEY);
    const duplicated=JSON.parse(pendingRaw);duplicated.pendingExploreEgg.id=target;
    assert.equal(f.validBackup213(duplicated),false);
    const unrepeatable=JSON.parse(pendingRaw);unrepeatable.pendingExploreEgg.shiny=false;
    assert.equal(f.validBackup213(unrepeatable),false);
    assert(f.load());s=f.state();assert.deepEqual(clone(s.pendingExploreEgg),pending);
    await showReview(q);const select=d.querySelector('#eggSwapTarget');
    const options=[...select.options];
    assert(options.some(option=>option.value===String(target)));
    assert.match(options.find(option=>option.value===String(old.eggs[1].id)).textContent,/色違いのたまご/);
    assert.doesNotMatch(options.find(option=>option.value===String(old.eggs[2].id)).textContent,/色違い/,
      'ordinary eggs keep their natural shiny result hidden until hatch');
    select.value=String(target);select.dispatchEvent(new w.Event('change',{bubbles:true}));
    click(d,offerButton('swap'));assert(!s.pendingExploreEgg);
    assert.equal(s.eggs.length,old.eggs.length);assert(!s.eggs.some(e=>e.id===target));
    assert.deepEqual(clone(s.eggs.find(e=>e.id===pending.id)),pending);
    assert.deepEqual(clone(s.eggs.filter(e=>e.id!==pending.id)),old.eggs.filter(e=>e.id!==target));
    assert.equal(f.chooseExploreEgg('swap',target),false);
    function restore(raw){
      const at=f.backupList213().findIndex(b=>b.type==='manual'&&b.data===raw);assert(at>=0);
      f.restore213(at);return f.state();
    }
    s=restore(old.raw);assert(!s.pendingExploreEgg);assert.deepEqual(clone(s.eggs),old.eggs);
    s=restore(pendingRaw);assert.deepEqual(clone(s.pendingExploreEgg),pending);
    assert(f.chooseExploreEgg('decline'));assert(!s.pendingExploreEgg);assert.deepEqual(clone(s.eggs),old.eggs);
    f.importSave(new w.File([pendingRaw],'牧場.json',{type:'application/json'}));
    for(let i=0;i<60&&!f.state().pendingExploreEgg;i++)await wait(15);
    s=f.state();assert.deepEqual(clone(s.pendingExploreEgg),pending);
    await showReview(q);click(d,offerButton('decline'));
    assert(!s.pendingExploreEgg);assert.deepEqual(clone(s.eggs),old.eggs);
    console.log('PASS grandfathered 10 eggs, guaranteed scout offer, overlapping help, later/Escape/review, stale target, quota rollback, targeted exchange, save/reload, backup and import');
  } finally {await Promise.resolve();q.close();}
}

async function returnedExpeditionAndFreeSlot() {
  const q=await current();
  try{
    const {f,d,w}=q,s=f.state();s.eggs=Array.from({length:9},(_,i)=>egg(s,i));
    s.speed=1;s.expeditionAuto213=true;
    const goal=f.expeditionGoal213(0),coins=s.coins,originalIds=s.eggs.map(e=>e.id);
    randomDuring(w,()=>.01,()=>f.advanceExpedition(goal));
    assert.equal(s.expeditionCounts213[0],1);assert(s.coins>coins);assert(!s.pendingExploreEgg);
    lucky(w,()=>f.advanceExpedition(goal));
    assert.equal(s.expeditionCounts213[0],2);const pending=clone(s.pendingExploreEgg);
    assert.equal(pending.source139,'expedition');assert(pending.shiny);
    assert.equal(s.eggs.length,9);assert.deepEqual(s.eggs.map(e=>e.id),originalIds);
    const beforeNextTrip=s.coins;
    lucky(w,()=>f.advanceExpedition(goal));
    assert.equal(s.expeditionCounts213[0],3);assert(s.coins>beforeNextTrip);
    assert.deepEqual(clone(s.pendingExploreEgg),pending);assert.equal(s.eggs.length,9);
    await showReview(q);click(d,offerButton('later'));
    s.eggs[2].time=s.eggs[2].need;
    const ready=s.eggs[2].id,field=s.monsters.length;
    f.hatchEggs();assert.equal(s.monsters.length,field+1);
    assert(!s.pendingExploreEgg);assert.equal(s.eggs.length,9);
    assert(!s.eggs.some(e=>e.id===ready));assert.deepEqual(clone(s.eggs.find(e=>e.id===pending.id)),pending);
    assert.equal(f.chooseExploreEgg('swap',originalIds[0]),false);
    lucky(w,()=>f.findEgg139('expedition',1));const newId=s.pendingExploreEgg.id;
    const alreadyFree=s.eggs.pop().id,impliedVictim=s.eggs[0].id;
    assert(f.chooseExploreEgg('swap',impliedVictim));
    assert(!s.eggs.some(e=>e.id===alreadyFree));assert(s.eggs.some(e=>e.id===impliedVictim));
    assert(s.eggs.some(e=>e.id===newId));assert.equal(s.eggs.length,9);
    console.log('PASS ordinary and natural-shiny expedition returns, preserved trip rewards, automatic post-hatch acceptance and accepting with a newly available slot');
  }finally{await Promise.resolve();q.close();}
}

(async()=>{await eggSources();await deferredAndAtomicSwap();await returnedExpeditionAndFreeSlot();})()
  .catch(error=>{console.error(error);process.exitCode=1;});
