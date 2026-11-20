'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const screenshotDir=process.env.MONSTER_BROWSER_SCREENSHOTS || path.resolve(root,'../qa-ui');
const marker='})();\n</script>';
const source=fs.readFileSync(path.join(root,'releases/1.24.3/game.html'),'utf8');
assert.equal(source.split(marker).length,2);
// Observe closure state without changing any game operation. All interactions below use the rendered controls.
const hook=`window.browserQa={
 ready:()=>!!(colorIndices&&lionReady&&facilitySheetReady&&villageSheetReady&&treeDecorationReady),
 terrain:()=>terrainMode,locked:()=>inputLock,
 snapshot:()=>({speed:state.speed,coins:state.coins,food:state.food,magic:state.magic,
  monsters:state.monsters.map(m=>({id:m.id,name:m.name,lv:m.lv,xp:m.xp,favorite:m.favorite138===true,protect:m.protected138===true})),
  buildings:state.buildings.map(b=>({id:b.id,type:b.type,x:b.x,y:b.y,level:b.level,facing:b.facing})),party:state.party})
};`;
const html=source.replace(marker,hook+'\n'+marker);

async function smoke(browser,url,mobile) {
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1100},
  deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile,locale:'ja-JP'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.setDefaultTimeout(20000);
 try {
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>window.browserQa?.ready());
  assert.match(await page.title(),/Ver\.1\.24\.3/);
  await page.locator('[data-speed="0"]').click();
  await page.waitForFunction(()=>window.browserQa.snapshot().speed===0);
  assert(await page.locator('#game').isVisible());
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert(overflow<=1,'No horizontal page overflow at '+(mobile?'390px':'desktop')+': '+overflow);
  if(!mobile){
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.screenshot({path:path.join(screenshotDir,'v1.24.3-desktop.png')});
  }
  const tabs=await page.locator('.tab[data-tab]').evaluateAll(nodes=>nodes.map(node=>node.dataset.tab));
  for(const tab of tabs){
   await page.locator('.tab[data-tab="'+tab+'"]').click();
   assert((await page.locator('#tabBody').innerText()).trim().length>0,'Rendered tab '+tab);
   assert.equal(errors.length,0,'No runtime errors in '+tab);
  }

  await page.locator('.tab[data-tab="monster"]').click();
  const sort=page.locator('[data-v137-sort="monster"]');
  await sort.focus();await sort.selectOption('name');
  await page.waitForFunction(()=>!window.browserQa.locked());
  const row=page.locator('.monster-row').last();
  await row.scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>({page:window.scrollY,panel:document.getElementById('tabBody').scrollTop}));
  const rowId=await row.getAttribute('id');await row.click();
  await page.locator('#monsterDetailTitle').waitFor({state:'visible'});
  assert(await page.locator('.app').evaluate(node=>node.inert));
  const body=page.locator('#monsterDetailBody');
  const sizes=await body.evaluate(node=>({height:node.clientHeight,scroll:node.scrollHeight}));
  assert(sizes.height>100);
  if(mobile){
   assert(sizes.scroll>sizes.height,'Mobile monster details have their own scrollable body');
   await page.screenshot({path:path.join(screenshotDir,'v1.24.3-mobile-monster.png')});
  }
  await body.evaluate(node=>node.scrollTop=node.scrollHeight);
  await page.locator('#monsterDetailBody [data-v138-monster="favorite"]').click();
  assert(await page.locator('#monsterDetailBody [data-v171-action="partMonster"]').isDisabled());
  await page.locator('#modalClose').click();
  await page.waitForFunction(()=>!document.getElementById('modal').classList.contains('show'));
  assert(!(await page.locator('.app').evaluate(node=>node.inert)));
  const after=await page.evaluate(()=>({page:window.scrollY,panel:document.getElementById('tabBody').scrollTop,focus:document.activeElement.id}));
  assert.equal(after.focus,rowId);
  assert(Math.abs(after.page-before.page)<2,'Page returns to the selected monster row');
  assert(Math.abs(after.panel-before.panel)<2,'List scroll position is preserved');

  await page.locator('.tab[data-tab="build"]').click();
  await page.locator('[data-v16-action="terrain"][data-id="stone"]').click();
  assert.equal(await page.evaluate(()=>window.browserQa.terrain()),'stone');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>window.browserQa.terrain()),null);
  assert(!(await page.locator('#tileTag').innerText()).includes('石のタイルを配置中'));

  await page.locator('#helpBtn').click();
  await page.locator('#helpTitle').waitFor({state:'visible'});
  for(const topic of ['tree','basics','staff']){
   await page.locator('[data-guide-tab="'+topic+'"]').click();
   assert((await page.locator('#modalContent').innerText()).trim().length>50);
  }
  await page.locator('#modalClose').click();
  await page.locator('#saveBtn').click();
  const saved=await page.evaluate(()=>window.browserQa.snapshot());
  await page.reload({waitUntil:'load'});await page.waitForFunction(()=>window.browserQa?.ready());
  assert.deepEqual(await page.evaluate(()=>window.browserQa.snapshot()),saved,'Save reload preserves paused resources, monsters, protection, party, and building position/facing/level');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS Chromium '+(mobile?'390px mobile':'desktop')+': '+tabs.length+' tabs, embedded artwork, no overflow, monster detail scroll/close, sort refresh, Escape, help, save/reload');
 } finally {await context.close();}
}

async function run(){
 fs.mkdirSync(screenshotDir,{recursive:true});
 const server=http.createServer((req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try {
  browser=await chromium.launch({executablePath:process.env.MONSTER_CHROMIUM || '/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const url='http://127.0.0.1:'+server.address().port+'/game.html';
  await smoke(browser,url,false);await smoke(browser,url,true);
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
