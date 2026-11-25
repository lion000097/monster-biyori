const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');

function exposeControls() {
  const band = 'yuguruBand';
  window.raidQA = {
    seed(legacyEgg) {
      state.speed = 0;
      state.adventure.stage = 51;
      state.adventure.auto = false;
      state.adventure.bossLoop = null;
      state.party = state.monsters.slice(0, 3).map(m => m.id);
      state.equipmentStock12512.ice = 2;
      state.equipmentBlueprints12513.ice = true;
      state.equipmentCraft12512 = 3;
      const raid = state.yuguruRaid = {clears: 7, normalEggs: 0, shinyEggs: 0, last: ''};
      if (legacyEgg === 'fresh') delete state.yuguruRaid;
      if (legacyEgg === 'waiting') raid.shinyEggs = 1;
      if (legacyEgg === 'incubating') state.eggs.push({id: state.nextId++, kind: yuguruKind, shiny: false, time: 0, need: 15, source139: 'raid'});
      if (legacyEgg === 'hatched') state.catalog.friends.push(yuguruKind);
      if (legacyEgg === 'previousWin') raid.last = '撃破！ ユグルのたまご';
      if (legacyEgg === 'log') message('🌿 ユグル 撃破！ 🌈 色違いのユグルのたまご');
      save(true);
    },
    status() {
      return {count: countEquipment12512(band), equipped: equipmentItem12512(crewParty()[0]),
        oldStock: countEquipment12512('ice'), oldPattern: hasEquipmentBlueprint12513('ice'),
        craftCursor: state.equipmentCraft12512, raid: state.yuguruRaid,
        eggs: state.eggs.filter(e => e.kind === yuguruKind).length,
        fruit: state.talentFruit, relics: state.treasures.filter(id => id < 0)};
    },
    finish({won = true, rolls}) {
      const b = state.battle;
      if (b?.raid !== 'yuguru') throw Error('No active raid');
      const original = rollYuguruDrops;
      let calls = 0;
      rollYuguruDrops = () => original(() => rolls[calls++]);
      try {
        if (won) b.foes[0].hp = 1;
        else { b.ourHp = 1; b.foes[0].hp = 1e7; b.foes[0].atk = 1e7; }
        adventureTick(false);
        // Replaying settlement after the result or the start of a new loop must award nothing.
        finishYuguru(b, won);
      } finally { rollYuguruDrops = original; }
      return calls;
    },
    boundaries() {
      const draw = rolls => { let i=0; return rollYuguruDrops(() => rolls[i++]); };
      return {
        gear: [0, .000999999, .001, .999].map(n => draw([1,1,1,1,n]).equipment),
        awards: [[0,0,0,0,0], [1/1500,.01,.001,.0001,.001], [.10+1/1500,1,1,1,0]].map(rolls => {
          const d=draw(rolls);
          return [d.egg,d.fruit,d.relics.map(r=>r.id),d.equipment];
        })
      };
    },
    fillEggs() {
      while (state.eggs.length < EGG_LIMIT) state.eggs.push({id:state.nextId++,kind:0,time:0,need:15,shiny:false});
    },
    hatchAward() {
      state.eggs = state.eggs.filter(e => e.kind === yuguruKind);
      placeRaidEggs();
      for (const egg of state.eggs) egg.time = egg.need;
      hatchEggs();
      save(true);
      return state.catalog.friends.includes(yuguruKind);
    },
    openEquipment() { openMonsterDetails(crewParty()[0].id, null); },
    equipCheck() {
      const m = crewParty()[0], duplicate = {...m};
      const nextHit = (b, hp) => {b.ourHp=hp;return equipmentMoonGuard12513(b, [m,duplicate],100);};
      const b = {ourMax:100};
      const guard = [nextHit(b,51), nextHit(b,50), nextHit(b,20), nextHit({ourMax:100},10)];
      const stats = equipmentStats12512(m);
      return {attack:stats.attack,hp:stats.hp,guard,blueprint:hasEquipmentBlueprint12513(band)};
    },
    autoEquipCheck() {
      const m = crewParty()[0];
      setMonsterEquipment12512(m.id, 'none');
      state.autoEquipment12512 = true;
      for (const member of crewParty()) writeEquipment12512(member,'none');
      autoEquipParty12512(crewParty(),true);
      return crewParty().filter(member=>equipmentItem12512(member)===band).length;
    },
    normalBoss() {
      state.autoEquipment12512=false;
      selectedBattleStage=50;
      startAdventure();
      const b=state.battle;
      if (!b || b.raid || b.stage!==50) throw Error('Regular boss did not start');
      const prev=Math.random;
      try {Math.random=()=>0;b.foes.forEach(f=>{f.hp=1;});adventureTick(false);}
      finally {Math.random=prev;}
    }
  };
}

async function run() {
  const pages = {};
  for (const [route, file] of Object.entries({old:'releases/1.25.35/game.html', normal:'game.html', launcher:'releases/1.25.36/launcher-game.html'})) {
    const html=fs.readFileSync(path.join(root,file),'utf8');
    const end=html.lastIndexOf('})();');
    assert(end>0);
    pages['/'+route]=html.slice(0,end)+'('+exposeControls.toString()+')();\n'+html.slice(end);
  }
  const server=http.createServer((req,res)=>res.writeHead(200,{'content-type':'text/html;charset=utf-8'}).end(pages[req.url]||''));
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const base='http://127.0.0.1:'+server.address().port;
  let browser;
  try {
    browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
    for (const build of ['normal','launcher']) for (const mobile of [false,true]) {
      const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      async function openTab(name) {
        if (mobile) {
          await page.locator('[data-mobile-dock12521=more]').click();
          const button=page.locator('[data-mobile-open12521='+name+']');
          await button.click();
        } else await page.locator('[data-tab='+name+']').click();
      }
      async function raidCards(gear, egg) {
        for (const [key,known,name] of [['equipment',gear,'若葉の竜環'],['egg',egg,'ユグルのたまご']]) {
          const card=page.locator('[data-raid-drop='+key+']');
          assert.equal(await card.getAttribute('data-discovered'),String(known));
          assert.equal(await card.locator('[data-drop-name]').innerText(),known?name:'');
          const sprite=card.locator('.equipment-pixel12514');
          const [filter,art]=await sprite.evaluate(el=>[getComputedStyle(el).filter,getComputedStyle(el).backgroundImage.startsWith('url("data:image/png')]);
          assert.equal(filter.includes('brightness(0)'),!known);
          assert(art);
        }
        assert.equal(await page.locator('[data-raid-drop=egg] small').innerText(),'幼体の卵');
        const boxes=await page.locator('.yuguru-loot > div').evaluateAll(els=>els.map(e=>{
          const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.right];
        }));
        assert.equal(boxes.length,4);assert.equal(boxes[0][1],boxes[1][1]);
        assert.equal(boxes[2][1],boxes[3][1]);assert(boxes[2][1]>boxes[0][1]);
        assert(boxes.every(box=>box[0]>=0 && box[3]<=(mobile?390:1280) && box[2]>85));
      }
      await page.goto(base+'/old');
      await page.locator('#ranchGuideDialog [data-guide-stop]').click();
      await page.evaluate(()=>raidQA.seed(null));
      await page.goto(base+'/'+build);
      await openTab('raid');await raidCards(false,false);
      const status=()=>page.evaluate(()=>raidQA.status());
      const old=await status();
      assert.equal(old.oldStock,2);assert(old.oldPattern);assert.equal(old.craftCursor,3);
      assert.deepEqual(await page.evaluate(()=>raidQA.boundaries()),{
        gear:[true,true,false,false],
        awards:[['shiny',true,[-1,-2],true],['normal',false,[],false],[null,false,[],true]]
      });
      if (process.env.RAID_QA_IMAGES && build==='normal')
        await page.locator('.yuguru-loot').screenshot({path:path.join(process.env.RAID_QA_IMAGES,'unknown-'+(mobile?'mobile':'desktop')+'.png')});
      const fight=page.locator('[data-raid-action=fight]'),loop=page.locator('[data-raid-action=repeat]');
      await fight.click();
      assert.equal(await page.evaluate(()=>raidQA.finish({won:false,rolls:[0,0,0,0,0]})),0);
      await raidCards(false,false);
      assert.equal((await status()).raid.clears,7);
      await fight.click();
      assert.equal(await page.evaluate(()=>raidQA.finish({rolls:[1,1,1,1,.001]})),5);
      await raidCards(false,false);
      // The first find is a different reward on mobile and desktop.
      if (mobile) await page.evaluate(()=>raidQA.fillEggs());
      await fight.click();
      assert.equal(await page.evaluate(mobile=>raidQA.finish({rolls:mobile?[.04,1,1,1,1]:[1,1,1,1,0]}),mobile),5);
      await raidCards(!mobile,mobile);
      if (mobile) assert.equal((await status()).raid.normalEggs,1);
      await page.reload();await openTab('raid');await raidCards(!mobile,mobile);
      await loop.click();
      assert.equal(await page.evaluate(()=>raidQA.finish({rolls:[0,0,0,0,.00099]})),5);
      await loop.click(); // stop after the round already in progress
      assert.equal(await page.evaluate(()=>raidQA.finish({rolls:[1,1,1,1,1]})),5);
      await raidCards(true,true);
      const found=await status();assert.equal(found.count,mobile?1:2);assert.equal(found.raid.clears,11);
      assert.equal(found.fruit-old.fruit,1);assert.deepEqual(found.relics,[-1,-2]);
      assert(await page.evaluate(()=>raidQA.hatchAward()));
      await page.reload();await openTab('raid');await raidCards(true,true);
      if (process.env.RAID_QA_IMAGES && build==='normal')
        await page.locator('.yuguru-loot').screenshot({path:path.join(process.env.RAID_QA_IMAGES,'found-'+(mobile?'mobile':'desktop')+'.png')});
      await page.evaluate(()=>raidQA.openEquipment());
      await page.locator('[data-equipment-choice12512=yuguruBand]').click();
      assert.equal((await status()).equipped,'yuguruBand');
      assert.equal((await status()).count,found.count-1);
      assert.deepEqual(await page.evaluate(()=>raidQA.equipCheck()),{attack:1.2,hp:20,guard:[100,80,100,80],blueprint:false});
      await page.reload();await openTab('raid');await raidCards(true,true);
      assert.equal((await status()).equipped,'yuguruBand');
      await openTab('bestiary');
      await page.locator('[data-action=atlas][data-id=equipment]').click();
      await page.selectOption('#gearAtlasTier12513','UR');
      const entry=page.locator('[data-gear-atlas-item=yuguruBand]');
      assert.equal(await entry.getAttribute('data-collected'),'true');
      assert.match(await entry.innerText(),/若葉の竜環/);assert.match(await entry.innerText(),/0\.1%/);
      assert.match(await entry.innerText(),/ダメージを20%軽減/);assert.doesNotMatch(await entry.innerText(),/型紙/);
      assert((await page.evaluate(()=>raidQA.autoEquipCheck()))>=1);
      const before=await status();
      await page.evaluate(()=>raidQA.normalBoss());
      const after=await status();assert.equal(after.count,before.count);assert.equal(after.raid.clears,before.raid.clears);
      assert.deepEqual(errors,[]);await page.close();
      console.log(build,mobile?'390 touch':'1280 desktop','PASS');
    }
    const first=await browser.newPage();
    await first.goto(base+'/old');
    await first.locator('#ranchGuideDialog [data-guide-stop]').click();
    await first.evaluate(()=>raidQA.seed('fresh'));
    await first.goto(base+'/normal');
    await first.locator('[data-tab=bestiary]').click();
    await first.locator('[data-action=atlas][data-id=equipment]').click();
    await first.selectOption('#gearAtlasTier12513','UR');
    const missing=first.locator('[data-gear-atlas-item=yuguruBand]');
    assert.equal(await missing.getAttribute('data-collected'),'false');assert.doesNotMatch(await missing.innerText(),/若葉の竜環/);
    await first.locator('[data-tab=raid]').click();
    await first.locator('[data-raid-action=fight]').click();
    assert.equal(await first.evaluate(()=>raidQA.finish({rolls:[.05,1,1,1,0]})),5);
    const firstWin=await first.evaluate(()=>raidQA.status());
    assert.equal(firstWin.raid.clears,1);assert.equal(firstWin.raid.eggSeen,true);
    assert.equal(firstWin.count,1);assert.equal(firstWin.eggs,1);
    await first.close();
    for (const history of ['waiting','incubating','hatched','previousWin','log']) {
      const page=await browser.newPage();
      await page.goto(base+'/old');
      await page.locator('#ranchGuideDialog [data-guide-stop]').click();
      await page.evaluate(history=>raidQA.seed(history),history);
      await page.goto(base+'/normal');await page.locator('[data-tab=raid]').click();
      assert.equal(await page.locator('[data-raid-drop=egg]').getAttribute('data-discovered'),'true',history);
      assert.equal(await page.locator('[data-raid-drop=equipment]').getAttribute('data-discovered'),'false',history);
      await page.close();
    }
    console.log('Legacy egg discovery: waiting, incubating, hatched, victory summary, previous log PASS');
  } finally {if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
