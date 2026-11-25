const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const files={old:process.env.OLD_GAME||'releases/1.25.32/game.html',normal:'game.html',launcher:'releases/1.25.33/launcher-game.html'};
const hook=()=>{
 window.q={
  state:()=>state,
  fixture(stage=50){
    state.adventure.stage=stage;state.battle=null;state.adventure.auto=false;state.adventure.bossLoop=null;
    state.speed=0;state.quests=[];state.research.battle=3;state.party=state.monsters.map(m=>m.id).slice(0,3);
    crewParty().forEach((m,i)=>{m.kind=5;m.element='光';m.lv=90;m.iv={hp:100,attack:100,defense:100};
      m.equip=true;m.equipment12512=['dew','time','rain'][i];m.trait=4;m.gift212=0;});
    recordTreasure(35);registerRelics192(15);recordTreasure(RELIC_START192+28);
    save(true);renderUI(true);
  },
  snap(){return {gold:state.coins,food:state.food,magic:state.magic,fame:state.fame,xp:crewParty().map(m=>m.xp),
   tree:state.villageXp,stock:state.stock,items:state.materialStock211,stage:state.adventure.stage,
   adventureClears:state.adventure.clears,fruit:state.talentFruit,treasures:state.treasures,
   copies:state.treasureStock,ids:crewParty().map(m=>m.id),iv:crewParty().map(m=>m.iv),
   eggs:state.eggs.map(({kind,shiny,source139})=>[kind,shiny,source139]),raid:state.yuguruRaid,battle:state.battle?.raid};},
  unlock(){state.adventure.stage=51;save(true);renderUI(true);},
  finish(win,n=0){
   const b=state.battle;if(!b)throw Error('battle missing');
   const rng=Math.random;Math.random=()=>n;
   try{
     if(win)b.foes[0].hp=1;
     else {b.ourHp=1;b.foes[0].atk=1e6;}
     adventureTick(false);
   }finally{Math.random=rng;}
   drawBattle(performance.now());updateBattleStats();
  },
  drops(v){let i=0;const d=rollYuguruDrops(()=>v[i++]);return [d.egg,d.fruit,d.relics.map(x=>x.id),i];},
  fill(){while(state.eggs.length<EGG_LIMIT)state.eggs.push({id:state.nextId++,kind:0,shiny:false,time:0,need:22});},
  space(){state.eggs=state.eggs.filter(e=>e.source139==='raid');hatchEggs();save(true);renderUI(true);},
  hatch(){state.villageLv=20;state.eggs.forEach(e=>e.time=e.need);hatchEggs();save(true);renderUI(true);},
  mid(){adventureTick(false);drawBattle(performance.now());updateBattleStats();renderUI(true);},
  lockBattle(){state.adventure.auto=true;renderUI(true);},
  keys(){return [yuguruKind,yuguruEnemy];},
  arts(){return [enemy17(yuguruEnemy),spriteMonsterHD(yuguruKind),spriteMonsterHD(yuguruKind,true),spriteTreasureV161(-1),spriteTreasureV161(-2)].map(c=>[c.width,c.height]);},
  stand(){
    const b={id:state.nextId++,type:'relicStand',level:1,x:8,y:6,facing:0};
    state.buildings.push(b);
    if(!setStandRelic(b,-2)||displayedRelic(b)!==-2)throw Error('raid relic on stand');
    return b.id;
  },
  checkStand(id){return displayedRelic(state.buildings.find(b=>b.id===id));},
  regression(){
    const p=state.yuguruRaid?.clears||0;
    selectedBattleStage=50;startAdventure();const b=state.battle;
    if(!b||b.raid||b.stage!==50||b.foes[0].index===yuguruEnemy)throw Error('normal adventure changed');
    this.finish(true,.75);
    if((state.yuguruRaid?.clears||0)!==p)throw Error('adventure leaked into raid');
  },
  sim(){
    const original={renderUI,save,message,finishYuguru,MathRandom:Math.random,state:JSON.stringify(state)};
    renderUI=save=message=()=>true;
    let wins=0,hp=0,rounds=0,used=false;
    finishYuguru=(b,won)=>{if(won)wins++;hp+=won?b.ourHp/b.ourMax:0;rounds+=b.round;state.battle=null;};
    const result=[];
    try{state.adventure.stage=51;
      for(const level of [80,85,90,95,100]){
        for(const m of crewParty())m.lv=level;
        wins=0;hp=0;rounds=0;
        for(let seed=1;seed<=500;seed++){
          let n=seed;Math.random=()=>((n=(Math.imul(1664525,n)+1013904223)>>>0)/4294967296);
          startYuguru();
          for(let i=0;i<75&&state.battle;i++){adventureTick(true);if(state.battle?.log.includes('世界樹の息吹'))used=true;}
          if(state.battle)throw Error('fight did not finish');
        }
        result.push({level,wins,remainingHp:Math.round(hp/500*1000)/10,rounds:Math.round(rounds/500*10)/10});
      }
      if(!used)throw Error('missing raid special');
    }finally{({renderUI,save,message,finishYuguru}=original);Math.random=original.MathRandom;state=JSON.parse(original.state);}
    return result;
  }
 };
};
const html=Object.fromEntries(Object.entries(files).map(([name,file])=>{
 const s=fs.readFileSync(path.resolve(root,file),'utf8'),i=s.lastIndexOf('})();');
 return [name,s.slice(0,i)+'('+hook.toString()+')();\n'+s.slice(i)];
}));
(async()=>{
 const server=http.createServer((req,res)=>res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end(html[req.url.slice(1)]||''));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const name of ['normal','launcher'])for(const mobile of [false,true]){
   const p=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
   const errors=[];p.on('pageerror',e=>errors.push(e.message));
   const url='http://127.0.0.1:'+server.address().port;
   const snap=()=>p.evaluate(()=>q.snap());
   const raid=async()=>{
    if(mobile){await p.locator('[data-mobile-dock12521=more]').click();await p.locator('[data-mobile-open12521=raid]').click();}
    else await p.locator('[data-tab=raid]').click();
   };
   const fight=p.locator('[data-raid-action=fight]'),loop=p.locator('[data-raid-action=repeat]');
   await p.goto(url+'/old');await p.locator('#ranchGuideDialog [data-guide-stop]').click();
   await p.evaluate(()=>q.fixture());const old=await snap();
   await p.goto(url+'/'+name);await p.waitForFunction(()=>!!window.q);assert.deepEqual(await snap(),old);
   await raid();assert(await fight.isDisabled());assert.match(await p.locator('[data-raid-status]').innerText(),/10-5/);
   await p.evaluate(()=>q.unlock());assert(await fight.isEnabled());
   if(process.env.RAID_QA_IMAGES&&name==='normal'){
    const panel=p.locator('.yuguru-panel');await panel.screenshot({path:path.join(process.env.RAID_QA_IMAGES,mobile?'raid-mobile.png':'raid-desktop.png')});
   }
   if(name==='normal'&&!mobile){
    const sim=await p.evaluate(()=>q.sim());console.log('基準編成 各500戦',sim);
    assert(sim[2].wins>=460&&sim[2].remainingHp>=5&&sim[2].remainingHp<=20);assert(sim[0].wins<100);
   }
   assert.deepEqual(await p.evaluate(()=>q.arts()),[[192,192],[96,96],[96,96],[64,64],[64,64]]);
   // Test exact decision boundaries, with injected values only at the RNG interface.
   const drops=a=>p.evaluate(v=>q.drops(v),a);
   assert.deepEqual(await drops([0,0,0,0]),['shiny',true,[-1,-2],4]);
   assert.deepEqual(await drops([1/1500,.01,.001,.0001]),['normal',false,[],4]);
   assert.deepEqual(await drops([.10+1/1500,.5,.5,.5]),[null,false,[],4]);
   const start=await snap();await fight.click();await p.evaluate(()=>q.finish(false,.5));const fail=await snap();
   for(const k of ['gold','food','magic','fame','xp','tree','stock','fruit','eggs','treasures','stage','adventureClears'])assert.deepEqual(fail[k],start[k]);
   assert.equal(fail.raid.clears,0);assert(await fight.isEnabled());
   await fight.click();await p.evaluate(()=>q.mid());assert.match(await p.locator('[data-raid-status]').innerText(),/ラウンド/);
   await p.evaluate(()=>q.finish(true,0));const first=await snap();
   assert.equal(first.raid.clears,1);assert.equal(first.gold-start.gold,2400);assert.equal(first.food-start.food,40);assert.equal(first.stock-start.stock,12);
   assert.equal(first.magic-start.magic,12);assert.equal(first.tree-start.tree,130);assert(first.fame>start.fame);assert.deepEqual(first.xp.map((n,i)=>n-start.xp[i]),[120,120,120]);
   assert.equal(first.fruit-start.fruit,1);assert.deepEqual(first.treasures.slice(-2),[-1,-2]);assert(first.eggs.at(-1)[1]);
   assert.equal(first.stage,start.stage);assert.equal(first.adventureClears,start.adventureClears);
   await p.reload();await raid();assert.deepEqual(await snap(),first);
   await p.evaluate(()=>q.fill());await loop.click();await p.evaluate(()=>q.finish(true,0));const second=await snap();
   assert.equal(second.raid.shinyEggs,1);assert.equal(second.raid.clears,2);assert.equal(second.battle,'yuguru');assert.equal(second.copies[-2],2);
   await loop.click();await p.evaluate(()=>q.finish(true,.05));const third=await snap();
   assert.equal(third.raid.normalEggs,1);assert.equal(third.raid.clears,3);assert(!third.battle);
   for(const k of ['gold','food','magic','fame','xp','tree','stock','items','stage','adventureClears'])assert.deepEqual(third[k],first[k]);
   await p.reload();await raid();assert.deepEqual(await snap(),third);
   await p.evaluate(()=>q.space());assert.deepEqual((await snap()).eggs.map(e=>e[1]),[true,true,false]);
   await p.evaluate(()=>q.hatch());const [kind,enemy]=await p.evaluate(()=>q.keys());
   const saved=await p.evaluate(()=>q.state());assert(saved.monsters.some(m=>m.kind===kind&&m.shiny));assert(saved.monsters.some(m=>m.kind===kind&&!m.shiny));
   assert(saved.catalog.friends.includes(kind)&&saved.catalog.shinies.includes(kind)&&saved.catalog.defeated.includes(enemy));
   await p.locator('[data-raid-action=party]').click();assert(await p.locator('[data-adventure-content]').isVisible());
   await p.getByRole('button',{name:/お宝図鑑を見る/}).first().click();
   for(const [id,title] of [[-1,'ユグルの琥珀角'],[-2,'世界樹の心雫']]){
    assert.match(await p.locator('.treasure-card').filter({has:p.locator('[data-treasure-index="'+id+'"]')}).innerText(),new RegExp(title));
   }
   const stand=await p.evaluate(()=>q.stand());await p.reload();assert.equal(await p.evaluate(id=>q.checkStand(id),stand),-2);
   await p.evaluate(()=>q.regression());await p.evaluate(()=>q.lockBattle());await raid();assert(await fight.isDisabled());
   assert.deepEqual(errors,[]);console.log(name,mobile?'390 touch':'1280 desktop','PASS');await p.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
