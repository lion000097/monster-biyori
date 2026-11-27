'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const marker = 'claimSave12556();\nconst didLoad=load();';
const origin = 'http://127.0.0.1:8879';

function install() {
  window.qa = {
    get s(){return state}, species:SPECIES, enemies:ENEMIES, elements:KIND_ELEMENTS,
    areas:frontierAreas, oldTrophy:frontierFriendIds, version:GAME_APP_VERSION,
    get ranchPool(){return typeof ranchWildEggKinds==='undefined'?[]:ranchWildEggKinds},
    makeMonster, newEgg, findEgg139, hatchEggs, buyEgg, chooseExploreEgg, monsterLimit,
    awardBattleEgg, stageEncounter, journey:journey12554, stepJourney12554, adventureTick,
    yuguruKind, yuguruAdultKind, yuguruEnemy, placeRaidEggs, enemyElement, allyStats,
    friendArt:spriteMonsterHD, enemyArt:enemy17, addCatalogMonster, hideModal,
    valid:()=>validBackup213(state), save:()=>save(true),
    render(next){tab=next;renderUI(true)},
    ready:()=>!!state&&!!colorIndices&&lionReady&&adventureArt.naturalWidth>0,
    fingerprint(){
      const monster=m=>[m.id,m.kind,m.name,m.shiny,m.lv,m.iv,m.favorite138||false];
      return {party:state.party,active:state.monsters.map(monster),barn:state.restingMonsters.map(monster),
        eggs:state.eggs,pending:state.pendingExploreEgg,stage:state.adventure.stage,
        money:state.coins,buildings:state.buildings.map(b=>[b.id,b.type,b.level]),
        friends:state.catalog.friends,shiny:state.catalog.shinies};
    },
    rolls(values,action){
      const old=Math.random;
      try{Math.random=()=>values.length?values.shift():.6;return action()}finally{Math.random=old}
    }
  };
}
const hooks='('+install.toString()+')();\n';
function expose(html) {
  assert.equal(html.split(marker).length,2);
  return html.replace(marker,hooks+marker);
}
function prepareOldSave() {
  const q=window.qa,s=q.s;
  s.speed=0;s.starterGuide='done';s.adventure.stage=76;s.adventure.auto=false;
  s.monsters[0].name='モモ';s.monsters[0].favorite138=true;
  const adult=q.makeMonster(s.nextId++,q.yuguruAdultKind,7,9);
  adult.shiny=true;adult.lv=57;s.restingMonsters=[adult];q.addCatalogMonster(adult);
  s.eggs=[];s.pendingExploreEgg=null;
  const kinds=[0,32,40,41,48,q.yuguruKind,52,55,q.species.length-1];
  for(const kind of kinds)q.rolls([.5],()=>q.newEgg(true,'battle',kind));
  q.rolls([0],()=>q.newEgg(true,'battle',42));
  if(!q.valid()||!q.save())throw Error('Legacy fixture save failed');
  return {ids:q.species.map(sp=>sp.id),enemies:q.enemies.map(e=>e.name),trophy:q.oldTrophy,
    mapping:q.enemies.map((e,i)=>e.allyId??q.species.findIndex(sp=>sp.wildEnemy===i)),
    save:q.fingerprint()};
}
function checkCompanions(old) {
  const q=window.qa,s=q.s;
  const check=(value,message)=>{if(!value)throw Error(message)};
  const novel=q.enemies.flatMap((enemy,id)=>old.mapping[id]<0?[id]:[]);
  const frontierIds=new Set(q.areas.flatMap(a=>[...a.normal,a.boss]));
  const early=novel.filter(i=>!frontierIds.has(i));
  check(novel.length===66&&early.length===39,'Missing species audit');
  check(q.ranchPool.length===early.length&&early.every(i=>q.ranchPool.includes(q.enemies[i].allyId)),'Ranch egg pool');
  check(q.enemies.every((e,i)=>Number.isInteger(e.allyId)&&(old.mapping[i]<0||e.allyId===old.mapping[i])),'Prior ally mapping');
  check(new Set(q.species.map(sp=>sp.id)).size===q.species.length,'Duplicate species IDs');
  check(q.enemies[q.yuguruEnemy].allyId===q.yuguruKind&&!q.ranchPool.includes(q.yuguruAdultKind),'Raid mapping');
  check(q.chooseExploreEgg('swap',s.eggs[0].id)&&!s.pendingExploreEgg,'Previous pending egg');
  s.eggs=[];s.coins=100000;s.food=10000;
  let smallestChange=1;
  const pixels=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  const portraits=new Set();
  for(const id of novel){
    const enemy=q.enemies[id],kind=enemy.allyId,sp=q.species[kind];
    check(sp.name===enemy.name&&sp.wildEnemy===id&&q.elements[kind]===q.enemyElement(id),'Metadata '+enemy.name);
    const normal=q.friendArt(kind,false),rare=q.friendArt(kind,true),foe=q.enemyArt(id);
    const n=pixels(normal),r=pixels(rare),e=pixels(foe),w=normal.width;
    check(w===normal.height&&w===rare.width&&w===foe.width,'Native size '+enemy.name);
    let changed=0,solid=0;
    for(let y=0;y<w;y++)for(let x=0;x<w;x++){
      const o=(y*w+x)*4,m=(y*w+w-1-x)*4;
      for(let k=0;k<4;k++)check(n[o+k]===e[m+k],'Normal art '+enemy.name);
      check(n[o+3]===r[o+3],'Shiny silhouette '+enemy.name);
      if(!n[o+3])continue;
      solid++;
      if(Math.max(...[0,1,2].map(k=>Math.abs(n[o+k]-r[o+k])))>=20)changed++;
    }
    check(solid>100&&changed/solid>.50,'Shiny contrast '+enemy.name);
    smallestChange=Math.min(smallestChange,changed/solid);portraits.add(rare.toDataURL());
  }
  check(portraits.size===66,'Duplicate shiny pictures');
  function hatch(egg,kind,shiny){
    check(egg&&egg.kind===kind&&egg.shiny===shiny,'Egg draw '+q.species[kind].name);
    const frontier=q.areas.find(area=>area.normal.includes(q.species[kind].wildEnemy));
    const expectedFame=frontier?1+Math.floor(q.enemies[frontier.normal[0]].allyId/10):4;
    check(q.species[kind].hatchFame===expectedFame,'Hatch fame '+kind);
    egg.time=egg.need;
    q.hatchEggs();
    const m=s.monsters.at(-1);
    check(!s.eggs.includes(egg)&&m.kind===kind&&m.shiny===shiny&&m.lv===1&&q.allyStats(m).hp>0,'Hatch '+kind);
    check(s.catalog.friends.includes(kind)&&s.catalog.shinies.includes(kind)===shiny,'Collection '+kind);
    s.monsters.pop();
  }
  q.render('monster');
  for(const id of early){
    const kind=q.enemies[id].allyId, position=q.ranchPool.indexOf(kind);
    const pick=[.1,.5,.1,.30,(position+.5)/early.length];
    q.rolls([...pick,.7],()=>document.querySelector('[data-action="egg"]').click());
    hatch(s.eggs.at(-1),kind,false);
    const source=['spring','staff','expedition'][position%3];
    const egg=source==='spring'
      ?q.rolls([...pick,0],()=>q.newEgg(true))
      :q.rolls([0,...pick,...(source==='staff'?[.9]:[]),0],()=>q.findEgg139(source,.05));
    hatch(egg,kind,true);
  }
  let targeted=0;
  for(const [a,area] of q.areas.entries()){
    for(const [j,id] of [...area.normal,area.boss].entries()){
      const stage=(a+6)*5+j+1,b=q.stageEncounter(stage),kind=q.enemies[id].allyId;
      check(b.foes[0].index===id,'Stage lead '+stage);
      const battle={stage,boss:b.boss,foes:b.foes},rate=b.boss?.34:.08;
      check(!q.rolls([rate],()=>q.awardBattleEgg(battle)),'Drop threshold '+stage);
      for(const shiny of [false,true]){
        const egg=q.rolls([rate-.00001,shiny?1/3000-Number.EPSILON:1/3000],()=>q.awardBattleEgg(battle));
        check(egg?.kind===kind&&egg.shiny===shiny,'Targeted drop '+stage);
        if(novel.includes(id))hatch(egg,kind,shiny);
        else s.eggs.pop();
      }
      if(novel.includes(id))targeted++;
    }
  }
  for(const stage of [5,10,15,20,25,30]){
    const b=q.stageEncounter(stage);
    check(!q.rolls([0],()=>q.awardBattleEgg({...b,stage}))&&!s.eggs.length,'Early boss '+stage);
  }
  check(targeted===27,'Frontier total');
  // The bestiary comparison must use two real, different portraits after hatch.
  q.render('bestiary');
  const sample=q.enemies[novel.at(-1)].allyId;
  document.querySelector('[data-compare-kind="'+sample+'"]').click();
  const pair=[...document.querySelectorAll('.color-pair canvas')];
  check(pair.length===2&&pair[0].toDataURL()!==pair[1].toDataURL(),'Catalogue comparison');
  q.hideModal();
  // Full incubator: ordinary eggs are refused, a rolled shiny survives a reload.
  for(let i=0;i<9;i++)q.rolls([.7],()=>q.newEgg(true,'battle',0));
  const stage=74,b={stage,...q.stageEncounter(stage)};
  check(!q.rolls([0,.7],()=>q.awardBattleEgg(b)),'Full incubator');
  const reserved=q.rolls([0,0],()=>q.awardBattleEgg(b));
  check(s.eggs.length===9&&s.pendingExploreEgg===reserved&&reserved.kind===sample&&reserved.shiny,'Overflow');
  const member=q.makeMonster(s.nextId++,sample,7,9);member.shiny=true;s.restingMonsters.push(member);
  check(q.valid()&&q.save(),'Updated save');
  return {smallestChange,save:q.fingerprint()};
}
function playRevisit(stage){
  const q=window.qa,s=q.s;
  q.chooseExploreEgg('swap',s.eggs[0].id);s.eggs=[];q.hideModal();
  s.monsters.forEach(m=>{m.lv=150;m.energy=100;m.happy=100;m.iv={hp:100,attack:100,defense:100}});
  s.party=s.monsters.slice(0,3).map(m=>m.id);
  q.render('adventure');
  const select=document.querySelector('#frontierReplayStage');
  select.value=String(stage);select.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('[data-v192="revisit"]').click();
  const b=s.battle,j=q.journey.get(b),lead=b.foes[0];
  if(!j||b.stage!==stage)throw Error('Replay did not start');
  let inspected=false;
  for(let i=0;i<400&&s.battle;i++){
    if(j.phase==='fight'&&b.foes[0].index!==lead.index){
      q.render('adventure');
      if(!document.getElementById('tabBody').textContent.includes(lead.name+'のたまご'))throw Error('Second wave hint');
      inspected=true;
    }
    const step=()=>q.stepJourney12554(b,10);
    if(j.checkpoints[j.index]?.type==='clear'&&j.phase==='walk'){
      q.rolls(Array(35).fill(.02),step);
    }else if(!step())q.adventureTick(true);
  }
  const egg=s.eggs.at(-1);
  if(!inspected||s.battle||s.adventure.stage!==76||egg?.kind!==q.enemies[lead.index].allyId||egg.shiny)throw Error('Replay reward');
  return lead.name;
}
async function main(){
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--no-sandbox']});
  try{
    for(const [compact,width] of [[false,390],[true,1280]]){
      const ctx=await browser.newContext({viewport:{width,height:850}});
      const page=await ctx.newPage(),errors=[],requests=[];
      page.on('pageerror',e=>errors.push(e.message));
      const route=compact?'releases/1.25.72/launcher-game.html':'game.html';
      await page.addInitScript(({hooks,marker})=>{
        const write=Document.prototype.write;
        Document.prototype.write=function(...args){
          if(typeof args[0]==='string'&&args[0].includes(marker))args[0]=args[0].replace(marker,hooks+marker);
          return write.apply(this,args);
        };
      },{hooks,marker});
      await page.route('**/*',r=>{
        const url=r.request().url();
        if(url===origin+'/baseline')return r.fulfill({contentType:'text/html',body:expose(read('releases/1.25.71/game.html'))});
        if(url===origin+'/'+route)return r.fulfill({contentType:'text/html',body:compact?read(route):expose(read(route))});
        requests.push(url);return r.abort();
      });
      await page.goto(origin+'/baseline');await page.waitForFunction(()=>window.qa?.ready());
      const old=await page.evaluate(prepareOldSave);assert.equal(old.ids.length,61);assert.equal(old.enemies.length,98);
      await page.goto(origin+'/'+route);await page.waitForFunction(()=>window.qa?.ready());
      const now=await page.evaluate(()=>({version:qa.version,ids:qa.species.map(s=>s.id),enemies:qa.enemies.map(e=>e.name),trophy:qa.oldTrophy,save:qa.fingerprint()}));
      assert.equal(now.version,'1.25.72');assert.equal(now.ids.length,127);
      assert.deepEqual(now.ids.slice(0,61),old.ids);assert.deepEqual(now.enemies,old.enemies);
      assert.deepEqual(now.trophy,old.trophy);assert.deepEqual(now.save,old.save);
      const report=await page.evaluate(checkCompanions,old);
      await page.reload();await page.waitForFunction(()=>window.qa?.ready());
      assert.deepEqual(await page.evaluate(()=>qa.fingerprint()),report.save);
      const name=await page.evaluate(playRevisit,compact?74:32);
      assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
      console.log('PASS',compact?'launcher':'web',width,'66 normal + 66 shiny hatches, 98 mapped enemies, 45 encounter drops, legacy IDs/save, full incubator, actual replay:',name,'min recoloured pixels:',report.smallestChange.toFixed(3));
      await ctx.close();
    }
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
