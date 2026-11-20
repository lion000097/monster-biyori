'use strict';

const {assert, open, persist, KEY, clone, wait, click, near} = require('./harness138.cjs');

const hooks = `Object.assign(window.qa138,{transferBarn,crewParty,hatchEggs,battlePartyHealth,
  tileIsFree191,validBackup213,trainMonster,selected:()=>selectedMonster});`;

function traits(m) {
  return clone([m.id,m.kind,m.name,m.lv,m.xp,m.equip,m.shiny,m.favorite138,m.protected138,m.produce,m.gift212]);
}
const action = (name,id) => '[data-barn-action="'+name+'"][data-barn-id="'+id+'"]';

async function previousSave() {
  const q = await open('1.13.13');
  try {
    const {f,w}=q, s=f.state();
    const collectorsPet={...s.monsters[0],id:s.nextId++,name:'Ａｏの子',lv:10,xp:23.5,equip:true,
      shiny:true,favorite138:true,protected138:true,produce:7.25};
    s.monsters.push(collectorsPet);
    assert.equal(s.monsters.length,f.monsterLimit());
    s.eggs=[{id:950,kind:1,time:15,need:15,shiny:true,name:'色違いのたまご',source139:'staff'}];
    s.speed=0; s.party=[s.monsters[0].id]; s.backupDay213=s.day;
    assert(f.save(true)); assert(f.saveBackup213('manual'));
    return {storage:persist(w),raw:w.localStorage.getItem(KEY),traits:traits(collectorsPet),pet:collectorsPet.id};
  } finally { q.close(); }
}

async function storageAndSwap() {
  const old=await previousSave(), q=await open('1.13.14',old.storage,hooks);
  try {
    const {f,d,w}=q; let s=f.state();
    const pet=old.pet, active=s.monsters[0].id, cap=f.monsterLimit();
    assert(s.nextId>950); assert.equal(s.restingMonsters.length,0); assert.equal(s.reserveRareMaterials,false);
    f.selectMonster(pet);
    click(d,'#barnOpen'); click(d,action('deposit',pet));
    assert.equal(s.monsters.length,cap-1); assert.deepEqual(traits(s.restingMonsters[0]),old.traits);
    assert.equal(f.selected(),null); assert.equal(s.eggs.length,1); assert.equal(s.eggs[0].time,15);
    click(d,'[data-barn-side="rest"]');
    const search=d.querySelector('#barnSearch'); search.focus(); search.value='ao';
    search.dispatchEvent(new w.Event('input',{bubbles:true}));
    click(d,'#barnShiny'); click(d,'#barnFavorite');
    assert(d.querySelector(action('withdraw',pet))); assert.equal(d.querySelectorAll('.barn-row').length,1);
    search.focus(); f.render('monster'); assert.equal(d.activeElement,search); assert.equal(search.value,'ao');
    assert(d.querySelector('#barnShiny').checked && d.querySelector('#barnFavorite').checked);
    search.value='ほかの名前'; search.dispatchEvent(new w.Event('input',{bubbles:true}));
    assert.equal(d.querySelectorAll('.barn-row').length,0);
    search.value=''; search.dispatchEvent(new w.Event('input',{bubbles:true}));
    s.speed=1; f.hatchEggs(); assert.equal(s.eggs.length,0);
    assert.equal(s.monsters.length,cap); assert(s.monsters.some(m=>m.id>950&&m.shiny));
    const frozen=JSON.stringify(s.restingMonsters[0]), food=s.food;
    f.trainMonster(pet); assert.equal(s.food,food); f.tick(true);
    assert.equal(JSON.stringify(s.restingMonsters[0]),frozen);
    f.render('monster'); assert.equal(d.querySelector(action('withdraw',pet)),null);
    click(d,action('choose',pet)); assert.equal(d.querySelector('#barnSwap').hidden,false);
    click(d,'[data-barn-cancel]'); assert.equal(d.querySelector('#barnSwap').hidden,true);
    s.party=[active]; f.startAdventure(); s.battle.ourHp=s.battle.ourMax/4;
    const blockers=s.buildings.find(b=>b.type==='worldtree');
    const mover=s.monsters.find(m=>m.id===active); mover.x=blockers.x; mover.y=blockers.y;
    click(d,action('choose',pet)); click(d,action('swap',active));
    assert.equal(s.monsters.length,cap); assert.equal(s.restingMonsters.length,1);
    const placed=s.monsters.find(m=>m.id===pet);
    assert.deepEqual(traits(placed),old.traits); assert(f.tileIsFree191(placed.x,placed.y));
    assert.equal(placed.path.length,0); assert.equal(placed.ranchTarget200,null);
    assert.deepEqual(clone(s.party),[pet]); near(s.battle.ourHp/s.battle.ourMax,.25);
    assert.equal(s.battle.ourMax,f.battlePartyHealth(f.crewParty())); assert.equal(s.restingMonsters[0].id,active);
    assert.equal(f.transferBarn(null,active).ok,false);
    assert.equal(f.transferBarn(active,pet).ok,false);
    assert.equal(new Set([...s.monsters,...s.restingMonsters].map(m=>m.id)).size,cap+1);
    assert.equal(d.querySelector('#barnSwap').hidden,true); click(d,'#modalClose');
    assert.equal(d.activeElement.id,'barnOpen');
    const stored=w.localStorage.getItem(KEY), originalSet=w.Storage.prototype.setItem;
    const before=[s.monsters,s.restingMonsters,s.party,s.battle];
    try {
      w.Storage.prototype.setItem=function(key,val) {
        if(key===KEY)throw new w.DOMException('full','QuotaExceededError');
        return originalSet.call(this,key,val);
      };
      assert.equal(f.transferBarn(pet,active).ok,false);
      [s.monsters,s.restingMonsters,s.party,s.battle].forEach((value,i)=>assert.equal(value,before[i]));
      assert.equal(w.localStorage.getItem(KEY),stored);
    } finally { w.Storage.prototype.setItem=originalSet; }
    s.speed=0; assert(f.save(true)); assert(f.saveBackup213('manual'));
    const current=w.localStorage.getItem(KEY), maybe=JSON.parse(current);
    maybe.restingMonsters.push(maybe.monsters[0]);
    assert.equal(f.validBackup213(maybe),false);
    assert(f.load()); s=f.state();
    assert.equal(s.restingMonsters[0].id,active); assert.deepEqual(traits(s.monsters.find(m=>m.id===pet)),old.traits);
    const backupIndex=raw=>f.backupList213().findIndex(b=>b.type==='manual'&&b.data===raw);
    assert(backupIndex(old.raw)>=0); f.restore213(backupIndex(old.raw)); s=f.state();
    assert.equal(s.restingMonsters.length,0); assert.equal(s.eggs.length,1);
    assert(backupIndex(current)>=0); f.restore213(backupIndex(current));
    assert.equal(f.state().restingMonsters[0].id,active);
    f.restore213(backupIndex(old.raw));
    f.importSave(new w.File([current],'牧場.json',{type:'application/json'}));
    for(let i=0;i<60 && !f.state().restingMonsters.length;i++)await wait(15);
    assert.equal(f.state().restingMonsters[0].id,active);
    assert.deepEqual(traits(f.state().monsters.find(m=>m.id===pet)),old.traits);
    console.log('PASS migration, combined filters, input focus, waiting shiny egg, paused production, full ranch swap, battle health, failed write, reload, manual restore and file import');
  } finally { q.close(); }
}

async function overCapacityAndEmptyField() {
  const q=await open('1.13.14',{},hooks);
  try {
    const {f}=q, s=f.state(), rest=s.monsters[0].id;
    assert(f.transferBarn(rest,null).ok);
    while(s.monsters.length<=f.monsterLimit())s.monsters.push({...s.monsters[0],id:s.nextId++});
    const size=s.monsters.length;
    assert.equal(f.transferBarn(null,rest).ok,false);
    const fieldId=s.monsters[0].id;
    assert(f.transferBarn(fieldId,rest).ok);
    assert.equal(s.monsters.length,size); assert.equal(s.restingMonsters[0].id,fieldId);
    s.adventure.auto=true; s.party=[]; f.startAdventure(); assert(s.battle);
    for(const m of [...s.monsters])assert(f.transferBarn(m.id,null).ok);
    assert.equal(s.battle,null); assert.equal(s.monsters.length,0); assert.equal(f.crewParty().length,0);
    f.tick(true); assert.equal(s.battle,null);
    assert(f.transferBarn(null,rest).ok); assert.equal(s.monsters[0].id,rest);
    console.log('PASS grandfathered pasture, empty pasture, normal withdrawal and recovery');
  } finally { q.close(); }
}

async function fullMatureRanch() {
  const q=await open('1.13.14',{},hooks);
  try {
    const {f,d}=q, s=f.state();
    s.villageLv=s.worldTreeLevel=20; s.speed=0;
    const sample=s.monsters[0];
    const companion=()=>({...sample,id:s.nextId++,name:'仲間'+s.nextId});
    while(s.monsters.length<45)s.monsters.push(companion());
    s.restingMonsters=Array.from({length:14},companion);
    const incoming=s.restingMonsters[13].id, outgoing=s.monsters[44].id;
    const ids=()=>[...s.monsters,...s.restingMonsters].map(m=>m.id).sort((a,b)=>a-b).join(',');
    const before=ids(); assert.equal(f.monsterLimit(),45);
    f.render('monster'); click(d,'#barnOpen'); click(d,'[data-barn-side="rest"]');
    assert.equal(d.querySelectorAll('.barn-row').length,12);
    click(d,'[data-barn-page="1"]'); assert.equal(d.querySelectorAll('.barn-row').length,2);
    click(d,action('choose',incoming));
    for(let i=0;i<3;i++)click(d,'[data-barn-page="1"]');
    click(d,action('swap',outgoing));
    assert.equal(s.monsters.length,45); assert.equal(s.restingMonsters.length,14); assert.equal(ids(),before);
    assert.equal(s.monsters[44].id,incoming); assert.equal(s.restingMonsters[13].id,outgoing);
    console.log('PASS Lv.20 full 45-monster ranch, both rosters paginated and all 59 individual IDs retained');
  } finally { q.close(); }
}

(async()=>{await storageAndSwap(); await overCapacityAndEmptyField(); await fullMatureRanch();})().catch(error=>{console.error(error);process.exitCode=1;});
