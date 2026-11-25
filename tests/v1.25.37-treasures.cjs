const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');

function installFixture() {
  function withRolls(rolls, run) {
    let index = 0;
    const original = Math.random;
    Math.random = () => rolls[index++] ?? .99;
    try { return run(); } finally { Math.random = original; }
  }
  window.treasureQA = {
    prepare() {
      state.speed = 0;
      state.adventure.stage = 51;
      state.adventure.auto = false;
      state.adventure.bossLoop = null;
      state.party = state.monsters.slice(0,3).map(m => m.id);
      const buildings = ['relicStand','relicStand','expeditionOffice','treasureMuseum213'].map((type,i) =>
        ({id:state.nextId++, type, level:1, x:4+2*i, y:6, facing:0}));
      state.buildings.push(...buildings);
      recordTreasure(0);
      rareBossLoot192(5, () => 0);
      setStandRelic(buildings[0],35);
      save(true);
    },
    selectStand(i) { selectMapBuilding(state.buildings.filter(b=>b.type==='relicStand')[i]); },
    ready() { return facilitySheetReady && villageSheetReady; },
    snapshot() {
      return {owned:state.treasures, copies:state.treasures.map(treasureCopies),
        stands:state.buildings.filter(b=>b.type==='relicStand').map(displayedRelic)};
    },
    drops() {
      const chest = withRolls([0,0,.995,.999], () => rewardTreasure(1,false));
      state.speed=1; state.expeditionArea213=0; state.expeditionAuto213=true;
      const expedition = withRolls([0,.99,.999], () => advanceExpedition(expeditionGoal213(0),true));
      state.speed=0;
      rareBossLoot192(5,() => 0);
      save(true); renderUI(true);
      return [chest,expedition];
    },
    raidWin() {
      startYuguru(false);
      const b=state.battle;
      if(b?.raid!=='yuguru')throw Error('Raid did not start');
      b.foes[0].hp=1;
      // Resolve an actual victory while forcing both of its independent relic draws.
      const original=rollYuguruDrops;
      rollYuguruDrops=() => original(() => 0);
      try { adventureTick(false); } finally { rollYuguruDrops=original; }
      return state.yuguruRaid.clears;
    },
    collectionRules() {
      const museum=state.buildings.find(b=>b.type==='treasureMuseum213');
      for(const id of [-101,-102])changeMuseum213(museum.id,id,true);
      const ranges=[.1,.7,.96,.995,.9999].map(value=>withRolls([value,.999],()=>rollTreasure194()));
      return {museum:museumItems213(museum),ranges,
        offered:standChoices(state.buildings.find(b=>b.type==='relicStand')).map(x=>x.id)};
    },
    distinctStandPictures() {
      return [0,1,2,3].every(facing => {
        const frames=[null,-1,-2].map(id=>standArt(1,facing,id).toDataURL());
        return new Set(frames).size===3;
      });
    }
  };
}

async function run() {
  const routes = {old:'releases/1.25.36/game.html', normal:'releases/1.25.37/game.html', launcher:'releases/1.25.37/launcher-game.html'};
  const pages = new Map();
  for(const [key,file] of Object.entries(routes)){
    const html=fs.readFileSync(path.join(root,file),'utf8'), end=html.lastIndexOf('})();');
    assert(end>0);
    pages.set('/'+key, html.slice(0,end)+'('+installFixture.toString()+')();\n'+html.slice(end));
  }
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  try{
    for(const build of ['normal','launcher'])for(const mobile of [false,true]){
      const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(7000);
      await page.route('http://ranch.test/**', route=>{
        const html=pages.get(new URL(route.request().url()).pathname);
        return route.fulfill({status:html?200:404,contentType:'text/html; charset=utf-8',body:html||''});
      });
      await page.goto('http://ranch.test/old');
      await page.locator('#ranchGuideDialog [data-guide-stop]').click();
      await page.evaluate(()=>treasureQA.prepare());
      await page.goto('http://ranch.test/'+build);
      const snap=()=>page.evaluate(()=>treasureQA.snapshot());
      assert.deepEqual(await snap(),{owned:[0,35,36],copies:[1,1,1],stands:[35,null]});
      if(mobile)await page.locator('[data-mobile-dock12521=adventure]').click();
      const treasureTab=page.locator('.tab[data-tab=treasure]');
      if(await treasureTab.isVisible())await treasureTab.click();
      else await page.locator('[data-v161-action=treasureTab]').click();
      const cards=page.locator('.treasure-grid .treasure-card');
      const card=id=>cards.filter({has:page.locator('[data-treasure-index="'+id+'"]')});
      const filter=(key,value)=>page.locator('[data-v138-treasure-filter="'+key+'"]').selectOption(value);
      assert.deepEqual(await cards.locator('canvas').evaluateAll(cs=>cs.slice(0,3).map(c=>c.dataset.treasureIndex)),['-101','-102','0']);
      assert((await card(0).boundingBox()).y>(await card(-101).boundingBox()).y);
      assert.equal(await card(-101).locator('.treasure-name').innerText(),'？？？？');
      assert.equal(await card(-102).locator('.unknown').count(),1);
      await filter('source','regular');
      await filter('rarity','SSR');
      assert(await card(-101).isVisible());assert(await card(-102).isHidden());
      await filter('rarity','UR');
      assert(await card(-102).isVisible());assert(await card(-101).isHidden());
      await filter('discovery','owned');
      assert(await card(-102).isHidden());
      await filter('rarity','all');
      assert.deepEqual(await page.evaluate(()=>treasureQA.drops()),[-101,-102]);
      assert.equal(await card(-101).locator('.treasure-name').innerText(),'月花のオルゴール');
      assert.equal(await card(-102).locator('.treasure-name').innerText(),'星渡りの天球儀');
      assert.deepEqual(await page.evaluate(()=>treasureQA.collectionRules()),
        {museum:[-101,-102],ranges:[9,19,24,-101,-102],offered:[35,36]});
      assert.equal(await page.evaluate(()=>treasureQA.raidWin()),1);
      if(mobile)await page.locator('[data-mobile-dock12521=map]').click();
      const open=async i=>{
        await page.evaluate(i=>treasureQA.selectStand(i),i);
        const button=page.locator('#mapStandOpen');assert(await button.isVisible());await button.click();
      };
      const pick=id=>page.locator('[data-place-relic="'+id+'"]');
      await open(0);
      const choices=await page.locator('#standItems [data-place-relic]').evaluateAll(bs=>bs.map(b=>b.dataset.placeRelic));
      assert.deepEqual(choices,['','-1','-2','35','36']);
      await pick(-1).click();await open(1);
      assert(await pick(-1).isDisabled());await pick(-2).click();
      await page.reload();await page.waitForFunction(()=>treasureQA.ready());
      assert.deepEqual((await snap()).stands,[-1,-2]);
      assert(await page.evaluate(()=>treasureQA.distinctStandPictures()));
      await open(0);await pick('').click();await open(1);await pick(-1).click();
      await page.reload();
      assert.deepEqual(await snap(),{owned:[0,35,36,-101,-102,-1,-2],copies:[1,2,2,1,1,1,1],stands:[null,-1]});
      assert.deepEqual(errors,[]);await page.close();
      console.log('PASS',build,mobile?'390px':'1280px');
    }
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
