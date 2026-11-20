'use strict';

const {assert,open,click,persist,KEY,clone} = require('./harness138.cjs');
const combatHooks=`Object.assign(window.qa138,{previewEncounterV161,achievementProgress193,adventureTick,
  clearPreview:()=>encounterPreviewCache199.clear()});`;
const barnHooks=`Object.assign(window.qa138,{restingLimit,transferBarn,hatchEggs});`;

function seed(q,n) {
  q.f.clearPreview();
  let value=n;
  q.w.Math.random=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);
}
function enemyStats(foes) {return clone(foes.map(f=>({id:f.index,hp:f.hp,max:f.maxHp,atk:f.atk,boss:!!f.boss})));}
const barnAction=(name,id)=>'[data-barn-action="'+name+'"][data-barn-id="'+id+'"]';

async function enemies() {
  const old=await open('1.13.14',{},combatHooks);
  const q=await open('1.13.15',{},combatHooks);
  try {
    const {f,d}=q, s=f.state();
    s.speed=0; old.f.state().speed=0;
    for(const stage of [1,2,4,5,7,10,15,20,21,31,60,115]) {
      for(const sample of [old,q]){
        sample.f.state().battle=null; sample.f.state().adventure.stage=stage; seed(sample,stage*17);
      }
      const before=enemyStats(old.f.previewEncounterV161(stage).foes);
      const after=enemyStats(f.previewEncounterV161(stage).foes);
      assert.equal(before.length,after.length);
      after.forEach((foe,i)=>{
        assert.equal(foe.id,before[i].id); assert.equal(foe.boss,before[i].boss);
        assert.equal(foe.hp,Math.round(before[i].hp*1.10)); assert.equal(foe.hp,foe.max);
        assert.equal(foe.atk,Math.round(before[i].atk*1.06));
      });
      assert.deepEqual(enemyStats(f.previewEncounterV161(stage).foes),after);
      f.startAdventure(); assert.deepEqual(enemyStats(s.battle.foes),after);
      s.battle.foes[0].hp-=3; assert.equal(f.previewEncounterV161(stage).foes[0].hp,after[0].hp-3);
    }
    s.battle=null; s.adventure.stage=16; f.render('adventure');
    const preview=enemyStats(f.previewEncounterV161(5).foes);
    click(d,'[data-v192="fight"][data-stage="5"]'); assert(s.battle.replayBoss192);
    assert.deepEqual(enemyStats(s.battle.foes),preview); assert.equal(s.adventure.stage,16);
    s.catalog.enemies=[0,4]; s.catalog.defeated=[0,4]; const defeated=clone(s.catalog.defeated);
    f.render('bestiary'); click(d,'[data-action="atlas"][data-id="enemy"]');
    const panel=d.querySelector('#tabBody');
    assert.doesNotMatch(panel.textContent,/討伐|撃破済/);
    assert.match(panel.textContent,/未遭遇/); assert.match(panel.textContent,/👑ボス/);
    assert.equal(f.achievementProgress193('enemy'),2); assert.deepEqual(clone(s.catalog.defeated),defeated);
    const legacy=old.f.state(); legacy.battle=null; legacy.adventure.stage=15; seed(old,50);
    old.f.startAdventure(); legacy.battle.foes[0].hp-=7; legacy.battle.ourHp-=5; legacy.battle.round=2;
    assert(old.f.save(true));const imported=await open('1.13.15',persist(old.w),combatHooks);
    try {
      // Loading an older ranch resumes at the saved stage, as in the previous game.
      const loaded=imported.f.state();
      assert.equal(loaded.battle,null);assert.equal(loaded.adventure.stage,15);
      assert.deepEqual(clone(loaded.catalog.enemies),clone(legacy.catalog.enemies));
      const expected=enemyStats(imported.f.previewEncounterV161(15).foes);
      imported.f.startAdventure();assert.deepEqual(enemyStats(loaded.battle.foes),expected);
    } finally {imported.close();}
    console.log('PASS normal and boss strength, 12 stage previews and real encounters, boss replay, partial old battle, enemy cards and achievement records');
  } finally {q.close();old.close();}
}

async function barn() {
  const old=await open('1.13.14');
  let snapshot;
  try {
    const {f,w}=old,s=f.state(); s.speed=0;
    while(s.monsters.length<4)s.monsters.push({...s.monsters[0],id:s.nextId++});
    s.restingMonsters=Array.from({length:7},(_,i)=>({...s.monsters[0],id:s.nextId++,name:'ひとやすみ'+i,
      lv:i+1,xp:.25,shiny:i%2===1,equip:true,favorite138:true}));
    assert(f.save(true)); assert(f.saveBackup213('manual')); snapshot=persist(w);
  } finally {old.close();}
  const q=await open('1.13.15',snapshot,barnHooks);
  try {
    const {f,d,w}=q, s=f.state(), expected=JSON.parse(snapshot[KEY]);
    const traits=rows=>clone(rows.map(m=>[m.id,m.name,m.kind,m.lv,m.xp,m.shiny,m.equip,m.favorite138]));
    assert.deepEqual(traits(s.restingMonsters),traits(expected.restingMonsters));
    const limits=[5,5,5,5,10,10,10,10,10,15,15,15,15,15,20,20,20,20,20,25];
    for(let i=0;i<limits.length;i++) assert.equal(f.restingLimit(i+1),limits[i]);
    assert.equal(f.restingLimit(99),25);
    const out=s.monsters[0].id, fromBarn=s.restingMonsters[0].id;
    f.render('monster'); click(d,'#barnOpen');
    assert.match(d.querySelector('[data-barn-side="rest"]').textContent,/7 \/ 5/);
    assert(d.querySelector(barnAction('deposit',out)).disabled); assert.equal(f.transferBarn(out,null).ok,false);
    assert.equal(f.transferBarn(null,fromBarn).ok,false);
    click(d,'[data-barn-side="rest"]'); click(d,barnAction('choose',fromBarn)); click(d,barnAction('swap',out));
    assert.equal(s.restingMonsters.length,7); assert.equal(s.monsters.length,4);
    assert.equal(s.monsters[0].id,fromBarn); assert.equal(s.restingMonsters[0].id,out);
    assert.equal(new Set([...s.monsters,...s.restingMonsters].map(m=>m.id)).size,11);
    click(d,'#modalClose'); s.worldTreeLevel=s.villageLv=5; f.render('monster'); click(d,'#barnOpen');
    for(const m of [...s.monsters].slice(0,3)){
      assert(!d.querySelector(barnAction('deposit',m.id)).disabled); click(d,barnAction('deposit',m.id));
    }
    assert.equal(s.restingMonsters.length,10); assert.equal(s.monsters.length,1);
    const last=s.monsters[0].id; assert(d.querySelector(barnAction('deposit',last)).disabled);
    assert.equal(f.transferBarn(last,null).ok,false);
    click(d,'[data-barn-side="rest"]'); click(d,barnAction('withdraw',out)); assert.equal(s.restingMonsters.length,9);
    assert(f.transferBarn(last,null).ok);assert.equal(s.restingMonsters.length,10);
    assert(f.load());const current=f.state();
    assert.equal(current.restingMonsters.length,10); assert.equal(current.monsters.length,1);
    assert(f.backupList213().some(b=>b.type==='manual'&&b.data===snapshot[KEY]));
    assert.equal(JSON.parse(w.localStorage.getItem(KEY)).restingMonsters.length,10);
    console.log('PASS barn milestones, full UI and direct guards, grandfathered over-cap rosters, one-for-one exchange, free withdrawal, reload and old backups');
  } finally {q.close();}
}
(async()=>{await enemies();await barn();})().catch(error=>{console.error(error);process.exitCode=1;});
