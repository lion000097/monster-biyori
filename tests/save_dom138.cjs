const h = require('./harness138.cjs');
const { assert, clone, open, persist, KEY, BACKUPS, wait, fs, path, ROOT } = h;
function important(s) {
  return clone({
    version:s.version,day:s.day,hour:s.hour,coins:s.coins,food:s.food,magic:s.magic,
    villageLv:s.villageLv,worldTreeLevel:s.worldTreeLevel,villageXp:s.villageXp,
    monsters:s.monsters.map(m=>({id:m.id,kind:m.kind,name:m.name,lv:m.lv,xp:m.xp,shiny:m.shiny,bond:m.bond,energy:m.energy,favorite138:m.favorite138,protected138:m.protected138})),
    staff:s.staff.map(w=>({id:w.id,name:w.name,job:w.job,level:w.level})),
    buildings:s.buildings.map(b=>({id:b.id,type:b.type,x:b.x,y:b.y,level:b.level,exhibits213:b.exhibits213})),
    catalog:s.catalog,treasures:s.treasures,materials:s.materialStock211,
    stage:s.adventure.stage,area:s.expeditionArea213,progress:s.exploreProgress,
    held:s.expeditionHeld134,counts:s.expeditionCounts213,auto:s.expeditionAuto213,
    filters:s.treasureFilters138,research:s.research,party:s.party,zones:s.zones
  });
}
async function run() {
  const previous = await open('1.13.7');
  let s = previous.f.state();
  s.speed=0;s.day=22;s.hour=13;s.coins=123456;s.food=987;s.magic=333;
  s.villageLv=s.worldTreeLevel=7;s.buildings.find(b=>b.type==='worldtree').level=7;
  s.villageXp=82;s.monsters[0].name='テストのシロ';s.monsters[0].shiny=true;
  s.monsters[0].lv=8;s.monsters[0].xp=11.25;s.party=[s.monsters[0].id];
  s.adventure.stage=11;s.expeditionArea213=1;s.exploreProgress=82.5;
  s.expeditionHeld134={0:53.25};s.expeditionCounts213=[7,4,2];
  previous.f.registerRelics192(3);
  s.treasures=[0,2,previous.f.RELIC_START192];s.bestiary.treasures=s.treasures;
  s.catalog.shinies=[s.monsters[0].kind];s.backupDay213=s.day;
  previous.f.save(true);
  const before=important(s), raw=previous.w.localStorage.getItem(KEY), oldStorage=persist(previous.w);
  const oldBackups=[{type:'manual',day:22,date:1,data:raw},{day:21,date:2,data:raw},
    ...[20,19,18,17].map(day=>({type:'auto',day,date:day,data:raw}))];
  oldStorage[BACKUPS]=JSON.stringify(oldBackups);
  previous.close();
  const game=await open('1.13.8',oldStorage),{w,d,f}=game;
  assert.deepEqual(important(f.state()),before,'1.13.7 migration preserves actual collection and progress');
  assert.deepEqual(clone(f.backupList213()),oldBackups,'old backup entries remain unchanged on load');
  fs.mkdirSync(path.join(ROOT,'qa'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'qa','legacy137-save.json'),raw);
  const manuals=f.backupList213().filter(b=>b.type!=='auto').map(b=>b.data);
  for(let day=23;day<=32;day++)assert(f.saveBackup213('auto',JSON.stringify({...f.state(),day})));
  assert.equal(f.backupList213().filter(b=>b.type==='auto').length,6);
  assert.deepEqual(f.backupList213().filter(b=>b.type!=='auto').map(b=>b.data),manuals,'10 auto backups keep manual snapshots');
  const autoBefore=f.backupList213().filter(b=>b.type==='auto').map(b=>b.data);
  for(let i=0;i<7;i++)assert(f.saveBackup213('manual',JSON.stringify({...f.state(),day:40+i})));
  assert.equal(f.backupList213().filter(b=>b.type==='manual').length,6);
  assert.deepEqual(f.backupList213().filter(b=>b.type==='auto').map(b=>b.data),autoBefore,'manual rotation does not rotate auto');
  assert(f.saveBackup213('restore',JSON.stringify({...f.state(),coins:54321})));
  const protectedItems=f.backupList213().filter(b=>b.type!=='auto').map(b=>b.data);
  const original=w.Storage.prototype.setItem;
  w.Storage.prototype.setItem=function(key,value){
    if(key===BACKUPS&&JSON.parse(value).length>protectedItems.length+1)throw new w.DOMException('test capacity','QuotaExceededError');
    return original.call(this,key,value);
  };
  assert(f.saveBackup213('auto',JSON.stringify({...f.state(),day:90})),'quota retry succeeds after pruning only older auto');
  assert.deepEqual(f.backupList213().filter(b=>b.type!=='auto').map(b=>b.data),protectedItems);
  const quotaRaw=w.localStorage.getItem(BACKUPS);
  w.Storage.prototype.setItem=function(key,value){if(key===BACKUPS)throw new w.DOMException('no capacity','QuotaExceededError');return original.call(this,key,value)};
  assert.equal(f.saveBackup213('auto',JSON.stringify({...f.state(),day:91})),false);
  assert.equal(w.localStorage.getItem(BACKUPS),quotaRaw,'failed quota write leaves bytes intact');
  w.Storage.prototype.setItem=original;
  s=f.state();s.monsters[0].favorite138=true;s.monsters[0].protected138=true;
  s.treasureFilters138={discovery:'missing',source:'boss',rarity:'SSR'};
  f.save(true);
  const target=clone(s);target.coins=7777;target.day=77;
  assert(f.saveBackup213('manual',JSON.stringify(target)));
  s.coins=4321;const unsaved=important(s);
  f.restore213(f.backupList213().findIndex(b=>b.type==='manual'&&b.day===77));
  assert.equal(f.state().coins,7777);
  assert.equal(f.state().monsters[0].protected138,true);
  assert.deepEqual(clone(f.state().treasureFilters138),target.treasureFilters138);
  const recoveryIndex=f.backupList213().findIndex(b=>b.type==='restore');
  assert.equal(JSON.parse(f.backupList213()[recoveryIndex].data).coins,4321,'recovery captures unsaved live progress');
  f.restore213(recoveryIndex);
  assert.deepEqual(important(f.state()),unsaved,'restore-before snapshot restores the live prior state');
  f.save(true);
  const preFailObject=f.state(),preFailSnapshot=important(preFailObject),preFailRaw=w.localStorage.getItem(KEY);
  let writes=0;
  w.Storage.prototype.setItem=function(key,value){
    if(key===KEY&&++writes===2)throw new w.DOMException('final save unavailable','QuotaExceededError');
    return original.call(this,key,value);
  };
  d.getElementById('toasts').textContent='';
  f.restore213(f.backupList213().findIndex(b=>b.type==='manual'&&b.day===77));
  assert.strictEqual(f.state(),preFailObject);
  assert.deepEqual(important(f.state()),preFailSnapshot);
  assert.equal(w.localStorage.getItem(KEY),preFailRaw);
  assert(!d.getElementById('toasts').textContent.includes('バックアップを復元したよ'));
  w.Storage.prototype.setItem=original;
  d.getElementById('toasts').textContent='';
  const importRaw=JSON.stringify({...f.state(),coins:24680});
  f.importSave(new w.File([importRaw],'sample-save.json',{type:'application/json'}));
  for(let i=0;i<60&&!d.getElementById('toasts').textContent.includes('セーブデータを読み込んだよ');i++)await wait(15);
  assert.equal(f.state().coins,24680,'real FileReader import succeeds');
  assert.equal(f.state().monsters[0].favorite138,true);
  assert.equal(f.state().monsters[0].protected138,true);
  f.render('management');
  assert(d.querySelector('[data-backup-group138="manual"]'));
  assert(d.querySelector('[data-backup-group138="auto"]'));
  assert(d.querySelector('[data-backup-group138="restore"]'));
  assert.match(d.querySelector('[data-backup-panel138]').textContent,/自動保存では手動保存は消えません/);
  const saved=persist(w),finalSnapshot=important(f.state());game.close();
  const again=await open('1.13.8',saved);
  assert.deepEqual(important(again.f.state()),finalSnapshot,'restart retains new flags, filter, inventory and progression');
  again.close();
  console.log('PASS: full save migration, independent retention, quota safety, restore/rollback, FileReader import, restart');
}
module.exports={run};
if(require.main===module)run().catch(error=>{console.error(error);process.exit(1)});
