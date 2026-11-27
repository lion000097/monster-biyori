'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
const marker='claimSave12556();\nconst didLoad=load();', base='http://127.0.0.1:8916/';
const hooks=`window.dexQa={
  data:()=>({catalog:state.catalog,seen:state.catalogSeen137,stage:state.adventure.stage,
     species:SPECIES.length,enemies:ENEMIES.length,foes:stageEncounter(5).foes.map(f=>f.index),
     trophy:trophyProgress(ACHIEVEMENTS193.find(a=>a.id==='areaAtlas1'))}),
  prepare:()=>{state.speed=0;state.starterGuide='done';state.adventure.stage=6;
    const id=stageEncounter(5).foes[0].index;
    state.catalog.enemies=[id];state.catalog.defeated=[id];state.catalogSeen137.enemy=[id];
    state.catalog.shinies=[state.catalog.friends[0]];return save(true)},
  ready:()=>!!state,version:GAME_APP_VERSION
};\n`;
function expose(s){assert.equal(s.split(marker).length,2);return s.replace(marker,hooks+marker)}
async function main(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const [compact,width] of [[false,390],[true,1280]]){
    const ctx=await browser.newContext({viewport:{width,height:850}}),p=await ctx.newPage(),errors=[];
    p.on('pageerror',e=>errors.push(e.message));
    await p.addInitScript(({marker,hooks})=>{
      const write=Document.prototype.write;
      Document.prototype.write=function(...args){
        if(typeof args[0]==='string'&&args[0].includes(marker))args[0]=args[0].replace(marker,hooks+marker);
        return write.apply(this,args);
      };
    },{marker,hooks});
    await p.route('**/*',r=>r.request().url()===base+'old'?r.fulfill({contentType:'text/html',body:expose(fs.readFileSync('releases/1.25.73/game.html','utf8'))}):
      r.request().url()===base+'new'?r.fulfill({contentType:'text/html',body:compact?fs.readFileSync('releases/1.25.74/launcher-game.html','utf8'):expose(fs.readFileSync('game.html','utf8'))}):r.abort());
    await p.goto(base+'old');await p.waitForFunction(()=>window.dexQa?.ready());
    const old=await p.evaluate(()=>{dexQa.prepare();return dexQa.data()});assert.equal(old.species,127);assert.equal(old.trophy,1);
    await p.goto(base+'new');await p.waitForFunction(()=>window.dexQa?.ready());
    assert.equal(await p.evaluate(()=>dexQa.version),'1.25.74');
    assert.deepEqual(await p.evaluate(()=>dexQa.data()),old);
    if(width===390){
      await p.locator('#mobileMoreToggle12521').click();
      await p.locator('[data-mobile-open12521="bestiary"]').click();
    }else await p.locator('.tab[data-tab="bestiary"]').click();
    const tab=p.locator('#tabBody'),toolbar=tab.locator('.bestiary-toolbar'),tabs=toolbar.locator('[data-action="atlas"]');
    assert.deepEqual(await tabs.evaluateAll(els=>els.map(b=>b.dataset.id)),['friend','citizen','material','equipment']);
    assert.match(await tabs.first().textContent(),/モンスター/);
    assert.doesNotMatch(await tab.locator('.info-card').first().textContent(),/敵/);
    assert.equal(await tab.locator('.treasure-grid > .treasure-card').count(),127);
    assert.equal(await tab.getByText('✨ 色違い発見済み').count(),1);
    const filter=tab.locator('[data-v137-atlas-filter]');await filter.selectOption('missing');
    assert.equal(await tab.locator('.treasure-grid > .treasure-card:visible').count(),127-old.catalog.friends.length);
    await tabs.nth(1).click();assert.match(await tabs.nth(1).getAttribute('class'),/on/);
    await tabs.nth(2).click();assert.match(await tabs.nth(2).getAttribute('class'),/on/);
    await tabs.nth(3).click();assert.equal(await tab.locator('#gearAtlasTitle12513').count(),1);
    if(width===390){
      await p.locator('#mobileMenu12521 [data-mobile-close12521]').click();
      await p.locator('#mobileMoreToggle12521').click();await p.locator('[data-mobile-open12521="help"]').click();
    }else await p.locator('#helpBtn').click();
    assert.match(await p.locator('#modal').textContent(),/モンスター・市民・素材・装備/);
    assert.doesNotMatch(await p.locator('#modal').textContent(),/敵は出現エリア/);
    assert.deepEqual(errors,[]);
    console.log('PASS',compact?'launcher':'web',width,'tabs, 127 monsters, shiny and filter, gear and help, previous save, enemy encounter and trophy unchanged');
    await ctx.close();
  }
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
