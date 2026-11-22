'use strict';

const {assert, clone, open, persist, KEY, BACKUPS, wait} = require('./harness138.cjs');
const version = process.env.MONSTER_QA_VERSION || 'working';
const hooks = 'Object.assign(window.qa138,{validBackup213,installSave138});';

function progress(s) {
  return clone({
    day:s.day,hour:s.hour,ticks:s.ticks,speed:s.speed,
    coins:s.coins,food:s.food,stock:s.stock,magic:s.magic,fame:s.fame,
    villageLv:s.villageLv,worldTreeLevel:s.worldTreeLevel,villageXp:s.villageXp,
    monsters:s.monsters.map(m=>({id:m.id,kind:m.kind,name:m.name,lv:m.lv,xp:m.xp,
      iv:m.iv,shiny:m.shiny,favorite138:m.favorite138,protected138:m.protected138})),
    staff:s.staff.map(w=>({id:w.id,job:w.job,level:w.level,workXp:w.workXp,fatigue:w.fatigue})),
    buildings:s.buildings.map(b=>({id:b.id,type:b.type,x:b.x,y:b.y,level:b.level,facing:b.facing})),
    eggs:s.eggs,catalog:s.catalog,party:s.party,research:s.research,
    materials:s.materialStock211,treasures:s.treasures,adventure:s.adventure,
    exploreProgress:s.exploreProgress,expeditionHeld134:s.expeditionHeld134
  });
}

async function imported(game, raw) {
  const {w,d,f} = game;
  d.getElementById('toasts').replaceChildren();
  f.importSave(new w.File([raw], 'ranch.json', {type:'application/json'}));
  for (let i=0;i<80;i++) {
    const text=d.getElementById('toasts').textContent;
    if (/読み込みを中止|セーブデータを読み込んだよ/.test(text)) return text;
    await wait(10);
  }
  assert.fail('FileReader import did not finish');
}

async function run() {
  const previous=await open('1.24.15');
  let storage, expected;
  try {
    const s=previous.f.state();
    Object.assign(s,{day:22,hour:0,ticks:500,speed:0,coins:1234.75,food:76.25,magic:25.5,fame:94.5});
    s.monsters[0].shiny=true;s.monsters[0].favorite138=true;s.monsters[0].protected138=true;
    s.catalog.shinies=[s.monsters[0].kind];s.adventure.bossLoop=null;
    s.monsters[0].lv=7;s.monsters[0].xp=34.75;s.party=[s.monsters[0].id];
    s.staff[0].fatigue=0;s.staff[1].fatigue=21.5;
    s.exploreProgress=77.5;
    assert(previous.f.save(true));storage=persist(previous.w);expected=progress(s);
  } finally {previous.close();}

  const game=await open(version, storage, hooks);
  try {
    const {w,d,f}=game;
    assert.deepEqual(progress(f.state()),expected,'1.24.15 progress and rested staff survive startup');
    assert.equal(f.state().staff[0].fatigue,0,'Saving a rested worker must not add 12 fatigue');
    assert(f.save(true));
    const live=f.state(),before=progress(live),mainRaw=w.localStorage.getItem(KEY);
    const backupRaw=w.localStorage.getItem(BACKUPS);
    const malformed=[
      ['day',-1],['day',0],['day',1.5],['day',null],
      ['hour',-1],['hour',24],['hour',1.5],['hour',null],
      ['ticks',null],['ticks',-1],['coins',null],['food','invalid'],
      ['stock',null],['magic',null],['fame',null],['speed',null],['speed',-1]
    ];
    for (const [key,value] of malformed) {
      const candidate={...clone(live),[key]:value};
      const text=await imported(game,JSON.stringify(candidate));
      assert.match(text,/読み込みを中止/,`${key}=${value} is rejected before installation`);
      assert.strictEqual(f.state(),live,'Rejected import retains the live state object');
      assert.deepEqual(progress(f.state()),before,'Rejected import retains unsaved progress');
      assert.equal(w.localStorage.getItem(KEY),mainRaw,'Rejected import retains save bytes');
      assert.equal(w.localStorage.getItem(BACKUPS),backupRaw,'Rejected import retains backups');
      assert.doesNotThrow(()=>f.render(),'The current ranch remains usable');
    }
    // JSON can represent an overflowing numeric literal without spelling Infinity.
    const overflow=JSON.stringify(live).replace(/"coins":[^,]+/, '"coins":1e999');
    assert.match(await imported(game,overflow),/読み込みを中止/);
    assert.equal(w.localStorage.getItem(KEY),mainRaw);

    const invalidRaw=JSON.stringify({...clone(live),day:-1});
    assert.equal(f.installSave138(invalidRaw,'読み込み'),false,'The shared installer also validates before writing');
    assert.equal(w.localStorage.getItem(KEY),mainRaw);
    assert.equal(w.localStorage.getItem(BACKUPS),backupRaw);
    const badBackup=JSON.stringify([{type:'manual',day:-1,date:1,data:invalidRaw}]);
    w.localStorage.setItem(BACKUPS,badBackup);
    f.restore213(0);
    assert.strictEqual(f.state(),live);
    assert.equal(w.localStorage.getItem(KEY),mainRaw,'Malformed restore cannot overwrite the ranch');
    assert.equal(w.localStorage.getItem(BACKUPS),badBackup,'Malformed restore does not rotate recovery data');
    w.localStorage.setItem(BACKUPS,backupRaw);

    w.localStorage.setItem(KEY,invalidRaw);
    assert.equal(f.load(),false,'Initial loader uses the same clock validation');
    assert.strictEqual(f.state(),live,'An invalid load does not replace the active state');
    w.localStorage.setItem(KEY,mainRaw);

    const target=clone(live);target.coins=2468.5;
    // Older valid saves are allowed to omit newer optional collections/settings.
    for (const key of ['restingMonsters','pendingExploreEgg','reserveRareMaterials','talentFruit']) delete target[key];
    delete target.staff[1].fatigue;
    assert.match(await imported(game,JSON.stringify(target)),/セーブデータを読み込んだよ/);
    assert.equal(f.state().coins,2468.5);
    assert.equal(f.state().staff[0].fatigue,0);
    assert.equal(f.state().staff[1].fatigue,12,'Absent legacy fatigue keeps its existing fallback');
    assert.deepEqual(clone(f.state().restingMonsters),[]);
    assert.equal(f.state().pendingExploreEgg,null);
    assert(f.saveBackup213('manual'));
    f.state().coins=19;
    f.restore213(f.backupList213().findIndex(b=>b.type==='manual'&&JSON.parse(b.data).coins===2468.5));
    assert.equal(f.state().coins,2468.5,'A valid backup still restores normally');
    assert.equal(f.state().staff[0].fatigue,0);
    assert.doesNotThrow(()=>f.render());
  } finally {game.close();}

  const broken={...storage,[KEY]:JSON.stringify({...JSON.parse(storage[KEY]),day:-1})};
  const recovered=await open(version,broken);
  try {
    assert.equal(recovered.w.localStorage.getItem('monster_biyori_unreadable_save_v1132'),broken[KEY],
      'Malformed startup save is preserved verbatim for recovery');
    assert.equal(recovered.f.state().day,1);
    assert.doesNotThrow(()=>recovered.f.render(),'Startup recovery renders a working ranch');
  } finally {recovered.close();}
  console.log('PASS 1.24.15 save compatibility, rested staff, malformed import/restore/load protection, legacy optional fields and recovery');
}

run().catch(error=>{console.error(error);process.exitCode=1;});
