'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const base = process.env.MB_URL || 'http://127.0.0.1:8879';
const marker = 'claimSave12556();\nconst didLoad=load();';
const hooks = `window.qa={
  get s(){return state}, version:GAME_APP_VERSION, species:SPECIES,enemies:ENEMIES,areas:frontierAreas,
  yuguruKind,yuguruAdultKind,yuguruEnemy,save,validBackup213,load,makeMonster,
  render(t){tab=t;renderUI(true)}, equipmentInfo12512,makeEgg:newEgg,awardBattleEgg,hatchEggs,
  rareBossLoot192,relicStart:RELIC_START192,treasures:TREASURE_ITEMS,relicArt:spriteTreasureV161,
  friendArt:spriteMonsterHD,enemyArt:enemy17,reachedExpeditionStage,expeditionName,
  stageLabel,stageEncounter,preview:previewEncounterV161,journey:journey12554,stepJourney12554,
  adventureTick,tick,startAdventure,bossTargets12552,renderBossPicker192,
  canRepeatBoss,recommendedPartyText,startRaid:startYuguru,completed:adventureComplete,
  drawBg:drawAdventureBackground,publicStage:publicAdventureStage,valid:validBackup213,
  sceneReady:()=>adventureArt.naturalWidth>0&&(typeof frontierScenery==='undefined'||frontierScenery.naturalWidth>0)
};\n`;
function expose(html) {
  assert.equal(html.split(marker).length,2);
  return html.replace(marker,hooks+marker);
}
function fixture(){
  const q=window.qa,s=q.s;
  s.speed=0;s.research.battle=0;s.autoEquipment12512=false;
  const ids=['hoshi','yuki','denki'],gear=['dew','wind','sunset'];
  s.monsters.forEach((m,i)=>{
    const k=q.species.findIndex(x=>x.id===ids[i]);
    const updated=q.makeMonster(m.id,k,m.x,m.y);
    Object.assign(m,updated,{kind:k,lv:84,xp:0,trait:4,gift212:0,
      iv:{hp:50,attack:50,defense:50},equip:true,equipment12512:gear[i]});
  });
  s.party=s.monsters.map(m=>m.id);s.adventure.stage=51;s.adventure.auto=false;s.adventure.bossLoop=null;
  s.starterGuide='done';
  s.catalog.friends=[...new Set([...s.catalog.friends,...s.monsters.map(m=>m.kind),q.yuguruAdultKind])];
  s.catalog.defeated=[q.areas[3].boss,q.yuguruEnemy];s.catalog.enemies=s.catalog.defeated.slice();
  const adult=q.makeMonster(s.nextId++,q.yuguruAdultKind,7,9);adult.shiny=true;s.restingMonsters=[adult];
  s.eggs=[];q.makeEgg(true,'raid',q.yuguruKind);
  s.treasures=[0,q.relicStart+19,-1];s.bestiary.treasures=s.treasures;
  if(!q.valid(s)||!q.save(true))throw Error('Could not store the old ranch');
  return {allies:q.species.map(x=>x.id),enemies:q.enemies.map(x=>x.name),egg:s.eggs[0].kind,
    owned:s.treasures.slice(),adult:q.yuguruAdultKind,staff:s.staff.map(w=>w.id),buildings:s.buildings.map(b=>b.id)};
}
function fightCurrent(){
  const q=window.qa,s=q.s,b=s.battle;
  if(!b)throw Error('No fight started');
  const j=q.journey.get(b),lineup=(j?.fullFoes||b.foes).map(f=>f.index);
  let guard=0;
  while(s.battle && guard++<400){
    if(!q.stepJourney12554(b,10))q.adventureTick(true);
  }
  if(s.battle)throw Error('Battle did not resolve');
  return {stage:b.stage,win:b.foes.every(f=>f.hp<=0),rounds:b.round,lineup,phases:j?.checkpoints.map(c=>c.type)};
}
function catalogueAndLoot(){
  const q=window.qa,s=q.s,oldRandom=Math.random,report=[];
  function at(r,fn){try{Math.random=()=>r;return fn()}finally{Math.random=oldRandom}}
  const sig=c=>{
    const rgb=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let hash=2166136261,count=0;for(let i=0;i<rgb.length;i++){hash=Math.imul(hash^rgb[i],16777619);if(i%4===3 && rgb[i])count++}
    if(count<50)throw Error('Empty portrait');
    return c.width+'/'+(hash>>>0);
  };
  const enemies=[],relics=[],backgrounds=[];
  for(const [i,area] of q.areas.slice(4).entries()){
    const stage=(11+i)*5,actual=q.stageEncounter(stage).foes[0];
    const battle={stage,boss:true,foes:[actual]},kind=q.enemies[actual.index].allyId;
    const normal=at(.02,()=>q.awardBattleEgg(battle));s.eggs=s.eggs.filter(e=>e!==normal);
    const shiny=at(.0001,()=>q.awardBattleEgg(battle));s.eggs=s.eggs.filter(e=>e!==shiny);
    const missed=at(.34,()=>q.awardBattleEgg(battle));
    const pair=q.rareBossLoot192(stage,()=>0);
    const none=q.rareBossLoot192(stage,()=>.001);
    const justSSR=q.rareBossLoot192(stage,()=>.0001);
    for(const id of [...area.normal,area.boss])enemies.push(sig(q.enemyArt(id)));
    for(const id of pair)relics.push(sig(q.relicArt(id)));
    const scene=document.createElement('canvas');scene.width=400;scene.height=106;
    q.drawBg(scene.getContext('2d'),stage,50);backgrounds.push(sig(scene));
    if(normal.kind!==kind||shiny.kind!==kind||normal.shiny||!shiny.shiny||missed||none.length||justSSR.length!==1||justSSR[0]!==pair[0])throw Error('Drop boundary '+stage);
    for(const id of [area.normal[0],area.boss]){
      const k=q.enemies[id].allyId;
      if(sig(q.friendArt(k,false))===sig(q.friendArt(k,true)))throw Error('Duplicate shiny');
    }
    if(!q.bossTargets12552(stage).includes('shiny'))throw Error('Missing loop goal');
    if(pair[0]!==q.relicStart+(stage/5-1)*2||pair[1]!==pair[0]+1)throw Error('Changed relic ID');
    report.push([q.stageLabel(stage),q.recommendedPartyText(stage),normal.kind,q.treasures[pair[0]].name]);
  }
  if(new Set(enemies).size!==25||new Set(relics).size!==10||new Set(backgrounds).size!==5)throw Error('Duplicate artwork');
  const area=q.areas.at(-1),battle={stage:75,boss:true,foes:[{index:area.boss}]};
  s.pendingExploreEgg=null;s.eggs=[];
  for(const shiny of [false,true]){
    s.restingMonsters.push(s.monsters.pop());s.party=s.monsters.map(m=>m.id);
    const egg=at(shiny?.0001:.02,()=>q.awardBattleEgg(battle));egg.time=egg.need;
    q.hatchEggs();const hatch=s.monsters.at(-1);
    if(s.eggs.includes(egg)||hatch.kind!==egg.kind||hatch.shiny!==shiny||!s.catalog.friends.includes(egg.kind)||
        (shiny&&!s.catalog.shinies.includes(egg.kind)))throw Error('Hatch or collection registration');
  }
  for(let i=0;i<9;i++)at(.4,()=>q.makeEgg(true,'battle',0));
  const reserved=at(.0001,()=>q.awardBattleEgg(battle));
  if(s.eggs.length!==9||s.pendingExploreEgg!==reserved||!reserved.shiny||!q.valid(s))throw Error('Egg reserve');
  return report;
}
async function run(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--no-sandbox']});
 try{
  for(const [offline,width] of [[false,390],[true,1280]]){
   const ctx=await browser.newContext({viewport:{width,height:850}});
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const legacy=fs.readFileSync(path.join(root,'releases/1.25.68/game.html'),'utf8');
   await page.route('**/baseline.html',r=>r.fulfill({contentType:'text/html',body:expose(legacy)}));
   await page.goto(base+'/baseline.html');await page.waitForFunction(()=>window.qa?.sceneReady());
   const before=await page.evaluate(fixture);
   await page.goto('about:blank');
   let url;
   if(offline){
    await page.addInitScript(({marker,hooks})=>{
      const write=Document.prototype.write;
      Document.prototype.write=function(...args){
       if(typeof args[0]==='string'&&args[0].includes("GAME_APP_VERSION='1.25.69'")){
         if(!args[0].includes(marker))throw Error('Offline source missing boot marker');
         args[0]=args[0].replace(marker,hooks+marker);
       }
       return write.apply(this,args);
      };
    },{marker,hooks});
    url=base+'/releases/1.25.69/launcher-game.html';
    await page.route('**/*',r=>r.request().isNavigationRequest()&&r.request().url()===url?r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'releases/1.25.69/launcher-game.html'))}):r.abort());
   }else{
    url=base+'/game.html';
    await page.route('**/game.html',r=>r.fulfill({contentType:'text/html',body:expose(fs.readFileSync(path.join(root,'game.html'),'utf8'))}));
   }
   await page.goto(url);await page.waitForFunction(()=>window.qa?.sceneReady());
   const initial=await page.evaluate(old=>{
    const q=window.qa,s=q.s;q.render('adventure');
    return [q.version,s.adventure.stage,s.party.length,s.eggs[0].kind,s.restingMonsters[0].kind,
      q.species.slice(0,old.allies.length).map(x=>x.id),q.enemies.slice(0,old.enemies.length).map(x=>x.name),
      s.staff.map(w=>w.id),s.buildings.map(b=>b.id),s.treasures,q.reachedExpeditionStage()];
   },before);
   assert.deepEqual(initial,['1.25.69',51,3,before.egg,before.adult,before.allies,before.enemies,before.staff,before.buildings,before.owned,11]);
   assert.match(await page.locator('[data-action=adventureStart]').textContent(),/11-1/);
   assert.deepEqual(await page.evaluate(()=>{
    const q=window.qa,s=q.s;s.adventure.stage=50;q.startRaid();const locked=s.battle===null;
    s.adventure.stage=51;q.startRaid();const unlocked=s.battle?.raid;s.battle=null;q.render('adventure');
    return [locked,unlocked];
   }),[true,'yuguru']);
   await page.evaluate(()=>{let n=912371;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296)});
   const levels=[];
   for(let n=51;n<=75;n++){
    const level=await page.evaluate(()=>window.qa.s.monsters[0].lv);if(n%5===0)levels.push(level);
    if(n===52){
     const automatic=await page.evaluate(()=>{
      const q=window.qa;document.querySelector('[data-action="adventureAuto"]').click();
      for(let i=0;i<8&&!q.s.battle;i++)q.adventureTick(true);
      const result=q.s.adventure.auto&&q.s.battle?.stage===52;
      document.querySelector('[data-action="adventureAuto"]').click();
      return result;
     });
     assert.equal(automatic,true);
    }else await page.evaluate(()=>document.querySelector('[data-action="adventureStart"]').click());
    const result=await page.evaluate(fightCurrent);
    assert.equal(result.stage,n);assert.ok(result.win,'Loss at '+n+' Lv.'+level+' round '+result.rounds);
    if(n%5===0){assert.equal(result.lineup.length,1);assert.deepEqual(result.phases,['chest','fight','clear']);}
    else{assert(result.lineup.length>=3&&result.lineup.length<=5);assert.deepEqual(result.phases,['chest','fight','fight','clear']);}
    await page.evaluate(()=>{const q=window.qa;for(let i=0;i<3;i++)q.tick(true);q.render('adventure');});
   }
   assert.deepEqual(levels,[90,100,108,116,125]);
   assert(await page.locator('[data-action=adventureStart]').isDisabled());
   assert.match(await page.locator('[data-action=adventureStart]').textContent(),/15-5/);
   assert.equal(await page.locator('[data-boss-row]').count(),15);
   const beforeLoop=await page.evaluate(()=>{
    const q=window.qa,s=q.s;const before=[s.coins,s.monsters[0].xp,s.villageXp];
    document.querySelector('[data-v192="loop"][data-stage="75"]').click();return before;
   });
   const repeat=await page.evaluate(fightCurrent);assert(repeat.win);assert.equal(repeat.phases,undefined);
   const afterLoop=await page.evaluate(()=>{const q=window.qa,s=q.s;const after=[s.coins,s.monsters[0].xp,s.villageXp,s.adventure.stage];document.querySelector('[data-v192="loop"][data-stage="75"]').click();return after;});
   assert.deepEqual(afterLoop,[beforeLoop[0],beforeLoop[1]+2,beforeLoop[2],76]);
   const observed=await page.evaluate(catalogueAndLoot);
   const saved=await page.evaluate(()=>{const q=window.qa;if(!q.save(true))throw Error('save');return [q.s.adventure.stage,q.s.treasures.length,q.s.pendingExploreEgg.kind,q.reachedExpeditionStage()];});
   await page.reload();await page.waitForFunction(()=>window.qa?.sceneReady());
   assert.deepEqual(await page.evaluate(()=>{const q=window.qa;return [q.s.adventure.stage,q.s.treasures.length,q.s.pendingExploreEgg.kind,q.reachedExpeditionStage()]}),saved);
   assert.equal(saved[0],76);assert.equal(saved[3],15);
   assert.deepEqual(errors,[]);await ctx.close();
   console.log('PASS',offline?'offline':'web',width,'old save, all 25 first clears without farming, Lv.',levels.join('/'),'drop boundaries, 25 portraits, 10 relics, five biomes, save round trip',JSON.stringify(observed));
  }
 }finally{await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
