'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const editions=process.env.MB_RELEASE_ROOT||root;
const marker='claimSave12556();\nconst didLoad=load();';
const base='http://127.0.0.1:8879/';

function install() {
  function rolls(values,action) {
    const random=Math.random;
    let at=0;
    try{Math.random=()=>at<values.length?values[at++]:random();return action()}finally{Math.random=random}
  }
  function check(condition,description){if(!condition)throw Error(description)}
  function render(target){tab=target;renderUI(true)}
  function fingerprint(){
    const member=m=>[m.id,m.kind,m.name,m.shiny,m.lv,m.iv];
    return {ranch:state.monsters.map(member),barn:state.restingMonsters.map(member),
      eggs:state.eggs,pending:state.pendingExploreEgg,party:state.party,stage:state.adventure.stage,
      catalog:[state.catalog.friends,state.catalog.shinies],money:state.coins,
      plots:state.buildings.map(b=>[b.id,b.type,b.x,b.y,b.level])};
  }
  function configure(){
    state.speed=0;state.starterGuide='done';state.adventure.stage=76;state.adventure.auto=false;
    state.coins=1000000;state.food=60000;state.villageLv=10;state.eggs=[];state.pendingExploreEgg=null;
    state.buildings.push({id:state.nextId++,type:'spring',level:1,x:3,y:4,facing:0},
      {id:state.nextId++,type:'expeditionOffice',level:1,x:5,y:4,facing:0});
    state.monsters[0].name='コハク';state.monsters[0].lv=28;
    const retired=makeMonster(state.nextId++,yuguruAdultKind,7,9);
    retired.shiny=true;state.restingMonsters=[retired];addCatalogMonster(retired);
    state.expeditionAuto213=false;ensureExpedition213();
  }
  function hatch(egg) {
    check(egg&&state.eggs.includes(egg),'Missing egg in incubator');
    const previous=state.monsters.length;
    egg.time=egg.need;hatchEggs();
    const born=state.monsters.at(-1);
    check(state.monsters.length===previous+1&&!state.eggs.includes(egg)&&born.kind===egg.kind&&born.shiny===egg.shiny,'Hatch '+egg.kind);
    check(state.catalog.friends.includes(born.kind)&&(!born.shiny||state.catalog.shinies.includes(born.kind)),'Catalogue '+egg.kind);
    state.monsters.pop();
  }
  // Control only RNG within each egg draw. Each game entry point still has to
  // call its own finder, award the egg and supply the correct origin.
  function commonFind(source,kind,shiny,special=false){
    const index=ranchWildEggKinds.indexOf(kind), normal=newEgg, finder=findEgg139;
    let found=null, calls=0;
    check(index>=0,'Missing shared kind '+kind);
    newEgg=function(auto=false,origin='',fixed=null){
      calls++;
      const tag=({purchase:'',spring:'',staff:'staff',expedition:'expedition'})[source];
      check(origin===tag&&auto===(source!=='purchase')&&fixed==null,'Wrong entry point '+source);
      const dice=[.1,.8,.3,.30,(index+.5)/ranchWildEggKinds.length];
      if(source==='staff')dice.push(special?.0001:.9);
      dice.push(shiny&&!special?0:1/3000);
      found=rolls(dice,()=>normal(auto,origin,fixed));
      return found;
    };
    findEgg139=(origin,rate)=>rolls([0],()=>finder(origin,rate));
    try{
      state.speed=1;state.expeditionAuto213=source==='expedition';
      if(source==='purchase'){
        const button=document.querySelector('[data-action="egg"]');
        check(button&&!button.disabled,'Purchase button');button.click();
      }else if(source==='spring'){
        state.springProgress=84.99;tick(true);
        check(state.springProgress<85,'Spring failed to produce');
      }else if(source==='staff'){
        workAtSite211(state.staff[0],state.buildings.find(b=>b.type==='expeditionOffice'),'explore');
      }else{
        const before=state.metrics.explore;
        state.exploreProgress=expeditionGoal213()-.001;advanceExpeditionClock(1);
        check(state.metrics.explore===before+1,'Expedition did not return');
      }
    }finally{newEgg=normal;findEgg139=finder;state.speed=0;state.expeditionAuto213=false}
    check(calls===1&&found?.kind===kind&&found.shiny===shiny,'Shared egg '+source+' '+kind);
    if(special)check(found.name===SPECIAL_EGG_NAME139,'Scout guaranteed shiny');
    return found;
  }
  function bossPlay(stage,goal,first){
    const a=state.adventure;a.stage=first?stage:76;a.cooldown=0;a.auto=false;a.bossLoop=null;
    render('adventure');
    const enemy=ENEMIES[stageEncounter(stage).foes[0].index];
    const row=document.querySelector('[data-boss-row="'+stage+'"]');
    if(first){
      check(document.getElementById('tabBody').textContent.includes(enemy.name+'のたまご'),'First-clear preview '+stage);
      document.querySelector('[data-action="adventureStart"]').click();
    }else{
      const select=row.querySelector('[data-boss-goal12552]');
      check([...select.options].some(o=>o.value==='egg')&&[...select.options].some(o=>o.value==='shiny'),'Loop goals '+stage);
      if(goal){
        select.value=goal;row.querySelector('[data-v192="loop"]').click();
      }else row.querySelector('[data-v192="fight"]').click();
    }
    const b=state.battle,real=awardBattleEgg,shiny=goal==='shiny';
    check(b?.boss&&b.stage===stage&&b.foes[0].index===SPECIES[enemy.allyId].wildEnemy,'Boss encounter '+stage);
    let draws=0;
    awardBattleEgg=battle=>{draws++;return rolls([.33999,shiny?0:.9],()=>real(battle))};
    try{
      for(let i=0;state.battle&&i<350;i++)if(!stepJourney12554(b,10))adventureTick(true);
    }finally{awardBattleEgg=real}
    const egg=state.eggs.at(-1);
    check(!state.battle&&draws===1&&egg?.kind===enemy.allyId&&egg.shiny===shiny,'Boss victory '+stage+' '+JSON.stringify({draws,round:b.round,hp:b.ourHp,foe:b.foes[0].hp,live:!!state.battle,egg:egg?.kind,expected:enemy.allyId,shiny:egg?.shiny,wantShiny:shiny}));
    if(first)check(a.stage===stage+1,'First clear progression '+stage);
    else check(a.stage===76,'Replay changed progression '+stage);
    if(goal){
      const result=a.bossResults12552[stage];
      check(a.bossLoop===null&&result.end==='hit'&&result.wins===1&&result.loot[goal]===1,'Loop result '+stage+' '+goal);
    }
    hatch(egg);
  }
  window.qa={
    get s(){return state},version:GAME_APP_VERSION,ready:()=>!!state&&!!colorIndices&&lionReady&&adventureArt.naturalWidth>0,
    species:SPECIES,elements:KIND_ELEMENTS,enemies:ENEMIES,frontier:frontierAreas,areas:namedEncounterAreas,archives:[...archiveEnemyIds],
    pool:ranchWildEggKinds,oldBase:firstFrontierKind,aliases:ALLY_FROM_ENEMY_META171.length,aliasStart:ALLY_FROM_ENEMY171,
    yKind:yuguruKind,yAdult:yuguruAdultKind,yEnemy:yuguruEnemy,rollYuguruDrops,rolls,newEgg,awardBattleEgg,stageEncounter,chooseExploreEgg,addCatalogMonster,
    configure,check,render,hatch,commonFind,bossPlay,fingerprint,save:()=>validBackup213(state)&&save(true)
  };
}
const hooks='('+install.toString()+')();\n';
function expose(html){
  assert.equal(html.split(marker).length,2);
  return html.replace(marker,hooks+marker);
}
function legacy(){
  const q=window.qa,s=q.s;q.configure();
  const oldBoss=q.enemies[q.areas[0].boss].allyId,oldPos=q.pool.indexOf(oldBoss);
  q.check(oldPos>=0,'Legacy common boss');
  q.rolls([.12,.8,.2,.31,(oldPos+.5)/q.pool.length,.6],()=>q.newEgg(false));
  for(let i=1;i<9;i++)q.rolls([.6],()=>q.newEgg(true,'expedition',i));
  const oldShiny=q.enemies[q.areas[4].boss].allyId;
  q.rolls([0],()=>q.newEgg(true,'staff',oldShiny));
  q.check(s.eggs.length===9&&s.pendingExploreEgg?.kind===oldShiny&&q.save(),'Old full save');
  return {save:q.fingerprint(),pool:q.pool,species:q.species,enemies:q.enemies.map(e=>[e.name,e.allyId])};
}
function checkShared(oldPool){
  const q=window.qa,s=q.s;
  const extra=q.frontier.flatMap(a=>a.normal.slice(1).map(e=>q.enemies[e].allyId));
  const bosses=q.areas.map(a=>q.enemies[a.boss].allyId);
  q.check(new Set(extra).size===27&&!extra.some(k=>oldPool.includes(k)),'New shared species');
  const expected=[...oldPool.filter(k=>!bosses.includes(k)),...extra].sort((a,b)=>a-b);
  q.check(JSON.stringify(q.pool.slice().sort((a,b)=>a-b))===JSON.stringify(expected),'Wrong shared egg pool');
  q.check(bosses.length===15&&bosses.every(k=>k>=q.oldBase&&!q.pool.includes(k)),'Boss in a common egg pool');
  q.check(q.aliasStart+q.aliases<=q.oldBase,'Legacy common aliases exceed their pool');
  q.check(!q.pool.includes(q.yKind)&&!q.pool.includes(q.yAdult)&&q.enemies[q.yEnemy].allyId===q.yKind,'Raid leaked into common eggs');
  q.check(q.archives.every(e=>q.enemies[e].allyId<q.oldBase||q.pool.includes(q.enemies[e].allyId)),'Archived enemy lost its egg source');
  const older=s.eggs[0],held=s.pendingExploreEgg;
  q.check(q.chooseExploreEgg('swap',s.eggs[8].id),'Restore shiny reserve');q.hatch(older);q.hatch(held);s.eggs=[];
  document.getElementById('helpBtn').click();
  const guide=document.getElementById('modalContent').textContent;
  q.check(['仕入れ・たまごの泉・探検・自動遠征','通常戦では勝つと8％','ボスを倒すと34％','1/3000'].every(text=>guide.includes(text)),'Guide drop rates');
  document.getElementById('modalClose').click();
  q.render('monster');
  for(const kind of extra)for(const source of ['purchase','spring','staff','expedition']){
    for(const shiny of [false,true])q.hatch(q.commonFind(source,kind,shiny));
  }
  q.hatch(q.commonFind('staff',extra[0],true,true));
  return extra.length;
}
function checkDrops(){
  const q=window.qa,s=q.s;
  for(let stage=1;stage<=75;stage++){
    const encounter=q.stageEncounter(stage),b={...encounter,stage},id=encounter.foes[0].index;
    const expected=q.enemies[id].allyId;
    if(stage<=30&&!b.boss){
      q.check(!q.rolls([0,0],()=>q.awardBattleEgg(b))&&!s.eggs.length,'Early ordinary encounter '+stage);
      continue;
    }
    const rate=b.boss?.34:.08;
    q.check(!q.rolls([rate],()=>q.awardBattleEgg(b))&&!s.eggs.length,'Drop boundary '+stage);
    for(const shiny of [false,true]){
      const egg=q.rolls([rate-Number.EPSILON,shiny?1/3000-Number.EPSILON:1/3000],()=>q.awardBattleEgg(b));
      q.check(egg?.kind===expected&&egg.shiny===shiny&&egg.source139==='battle','Species, shiny boundary or source '+stage);
      q.hatch(egg);
    }
  }
  const raid={stage:null,boss:true,raid:'yuguru',foes:[{index:q.yEnemy}]};
  q.check(!q.rolls([0],()=>q.awardBattleEgg(raid))&&!s.eggs.length,'Duplicate raid reward');
  q.check(q.rollYuguruDrops(()=>0).egg==='shiny'&&q.rollYuguruDrops(()=>.05).egg==='normal','Raid egg rates');
  // Equip the end-game party used in the adventure-progression regression.
  s.autoEquipment12512=false;
  const partyKinds=['hoshi','yuki','denki'],gear=['dew','wind','sunset'];
  s.monsters.slice(0,3).forEach((m,i)=>{
    const kind=q.species.findIndex(sp=>sp.id===partyKinds[i]);
    Object.assign(m,{kind,element:q.elements[kind],lv:150,energy:100,happy:100,trait:4,gift212:0,
      equip:true,equipment12512:gear[i],iv:{hp:100,attack:100,defense:100}});
    q.addCatalogMonster(m);
  });
  s.party=s.monsters.slice(0,3).map(m=>m.id);
  for(let stage=5;stage<=30;stage+=5){
    q.bossPlay(stage,null,true);q.bossPlay(stage,null,false);
    q.bossPlay(stage,'egg',false);q.bossPlay(stage,'shiny',false);
  }
  q.bossPlay(35,'egg',false);q.bossPlay(75,'shiny',false);
  // An ordinary egg cannot displace one of the nine held eggs. The first
  // exceptional find is reserved and a second find cannot overwrite it.
  for(let i=0;i<9;i++)q.rolls([.7],()=>q.newEgg(true,'battle',0));
  const b={stage:30,...q.stageEncounter(30)};
  q.check(!q.rolls([.3,.9],()=>q.awardBattleEgg(b)),'Full incubator accepted regular egg');
  const held=q.rolls([.3,0],()=>q.awardBattleEgg(b));
  q.check(held?.shiny&&held.kind===q.enemies[q.areas[5].boss].allyId&&s.eggs.length===9&&s.pendingExploreEgg===held,'Full shiny reserve');
  q.check(!q.rolls([.3,0],()=>q.awardBattleEgg({stage:5,...q.stageEncounter(5)}))&&s.pendingExploreEgg===held,'Reserved egg overwritten');
  q.check(q.save(),'Save with reserved boss egg');return q.fingerprint();
}
async function main(){
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--no-sandbox']});
  try{
    for(const [compact,width] of [[false,390],[true,1280]]){
      const ctx=await browser.newContext({viewport:{width,height:850}}),page=await ctx.newPage(),errors=[],unexpected=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(({marker,hooks})=>{
        const write=Document.prototype.write;
        Document.prototype.write=function(...args){
          if(typeof args[0]==='string'&&args[0].includes(marker))args[0]=args[0].replace(marker,hooks+marker);
          return write.apply(this,args);
        };
      },{marker,hooks});
      const file=compact?'releases/1.25.73/launcher-game.html':'game.html',url=base+file;
      const baseline=expose(fs.readFileSync(path.join(root,'releases/1.25.72/game.html'),'utf8'));
      const game=fs.readFileSync(path.join(editions,file),'utf8');
      await page.route('**/*',r=>{
        if(r.request().url()===base+'old')return r.fulfill({contentType:'text/html',body:baseline});
        if(r.request().url()===url)return r.fulfill({contentType:'text/html',body:compact?game:expose(game)});
        unexpected.push(r.request().url());return r.abort();
      });
      await page.goto(base+'old');await page.waitForFunction(()=>window.qa?.ready());
      const old=await page.evaluate(legacy);
      await page.goto(url);await page.waitForFunction(()=>window.qa?.ready());
      const after=await page.evaluate(()=>({version:qa.version,save:qa.fingerprint(),species:qa.species,enemies:qa.enemies.map(e=>[e.name,e.allyId])}));
      assert.equal(after.version,'1.25.73');assert.deepEqual(after.save,old.save);
      assert.deepEqual(after.species,old.species);assert.deepEqual(after.enemies,old.enemies);
      await page.evaluate(()=>{
        let seed=12573;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      });
      assert.equal(await page.evaluate(checkShared,old.pool),27);
      const saved=await page.evaluate(checkDrops);
      await page.reload();await page.waitForFunction(()=>window.qa?.ready());
      assert.deepEqual(await page.evaluate(()=>qa.fingerprint()),saved);
      assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
      console.log('PASS',compact?'launcher':'web',width,'27 species x 4 sources x 2 colours; all 75 stages; 1-5 through 6-5 first clears, rematches and both loop targets; late bosses; legacy save and nine-egg reserve');
      await ctx.close();
    }
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
