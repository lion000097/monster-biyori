const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.stack));
 const html=fs.readFileSync(path.join(root,process.env.GAME_FILE||'game.html'),'utf8').replace('// Load saved species only after the full roster has been registered.',`window.townQA={run:code=>eval(code)};\n// Load saved species only after the full roster has been registered.`);
 await page.route('**/*',route=>route.request().url().startsWith('http://town.test/')?route.fulfill({contentType:'text/html',body:html}):route.abort());
 await page.goto('http://town.test/game.html');
 await page.waitForTimeout(1500);
 console.log('STARTUP',errors);
 assert.equal(errors.length,0);
 await page.evaluate(()=>townQA.run('state.speed=0;'));
 const result=await page.evaluate(()=>townQA.run(`({version:GAME_APP_VERSION,types:Object.keys(TOWN1260).length,pop:[20,21,24,25,29,30,31].map(monsterTreeLimit135),caps:[20,21,24,25,29,30].map(n=>facilityCountCap193('starHouse1260',n)),noUpgradeReq:treeRequirements193(30).filter(r=>B[r.type].noUpgrade),newReq:treeRequirements193(30).filter(r=>TOWN1260[r.type]).map(r=>[r.type,r.minLevel]),oldCaps:Object.keys(facilityCapsAtTree20_12547).every(t=>facilityCountCap193(t,30)===facilityCapsAtTree20_12547[t])})`));
 console.log(result);assert.equal(result.types,15);assert.deepEqual(result.pop,[45,50,50,55,55,60,60]);assert.deepEqual(result.caps,[0,1,1,2,2,3]);assert.equal(result.noUpgradeReq.length,0);assert.equal(result.newReq.length,6);assert(result.oldCaps);
 await page.evaluate(()=>townQA.run(`
 document.querySelectorAll('dialog').forEach(d=>d.close());state.starterGuide='done';document.querySelectorAll('.modal').forEach(d=>d.classList.remove('show'));
 const gallery=document.createElement('div');gallery.id='qa-gallery';gallery.style='position:absolute;top:0;left:0;right:0;min-height:1200px;background:#e6e9d7;z-index:999999;padding:18px;font:14px sans-serif;color:#3b5247';
 gallery.innerHTML='<h1>もんすたー日和｜建築追加・4方向</h1>';
 const ref=document.createElement('canvas');ref.width=128;ref.height=128;ref.getContext('2d').drawImage(spriteBuildingV161('home',1,0),0,0,128,128);const reference=document.createElement('div');reference.append(ref);gallery.append(reference);
 for(const [type,spec] of Object.entries(TOWN1260)){
  const row=document.createElement('section');row.style='display:inline-block;vertical-align:top;width:32%;height:180px';
  const title=document.createElement('div');title.textContent=spec.name+'｜Lv'+spec.unlock+'｜'+spec.w+'×'+spec.h;row.append(title);
  for(let f=0;f<4;f++){const c=document.createElement('canvas');c.width=130;c.height=150;c.style='width:24%;image-rendering:pixelated';const g=c.getContext('2d');g.imageSmoothingEnabled=false;const a=townSprite1260(type,1,f);g.drawImage(a,0,0,130,130);g.fillStyle='#345b50';g.font='12px sans-serif';g.fillText(['南','西','北','東'][f],50,145);row.append(c);}gallery.append(row);
 }
 document.body.append(gallery);
 `));
 fs.mkdirSync(path.join(root,'tests/results/town-1260'),{recursive:true});
 await page.screenshot({path:path.join(root,'tests/results/town-1260/buildings.png'),fullPage:true});
 await page.evaluate(()=>document.getElementById('qa-gallery').remove());
 await page.screenshot({path:path.join(root,'tests/results/town-1260/startup.png')});
 const scenarios=fs.readFileSync(path.join(root,'tests/town-1260-scenarios.js'),'utf8');
 console.log(await page.evaluate(code=>townQA.run(code),scenarios));
 assert.equal(errors.length,0,errors.join('\n'));

 const assets=await page.evaluate(()=>townQA.run(`Object.entries(TOWN1260).flatMap(([type,spec])=>[0,1,2,3].map(f=>({name:type+'/'+f+'.png',url:townSprite1260(type,1,f).toDataURL()}))).concat([25,30].flatMap(level=>[0,1,2,3].map(f=>({name:'worldtree/'+level+'-'+f+'.png',url:spriteBuildingV161('worldtree',level,f).toDataURL()}))))`));
 for(const asset of assets){const target=path.join(root,'releases/1.26.0/art',asset.name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,Buffer.from(asset.url.split(',')[1],'base64'));}
 const visual=await page.evaluate(()=>townQA.run(`
 state.speed=0;state.hour=20;
 const gallery=document.createElement('section');gallery.id='tree-gallery';gallery.style='position:fixed;inset:0;background:#e5ecd9;padding:24px;z-index:2147483647';
 const h=document.createElement('h2');h.textContent='世界樹の成長　Lv.20 → Lv.25 → Lv.30';gallery.append(h);
 for(const level of [20,25,30]){const c=document.createElement('canvas');c.width=360;c.height=400;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(spriteBuildingV161('worldtree',level,0),0,0,360,360);g.fillStyle='#355e49';g.font='24px sans-serif';g.fillText('Lv.'+level,140,390);gallery.append(c);}
 document.body.append(gallery);true;
 `));
 await page.screenshot({path:path.join(root,'tests/results/town-1260/tree.png')});
 await page.evaluate(()=>document.getElementById('tree-gallery').remove());
 // Real menu on phone: all 15 cards reachable and no horizontal page overflow.
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>townQA.run(`state.villageLv=30;state.worldTreeLevel=30;state.speed=0;tab='build';facilityRole='all';renderUI(true);document.querySelectorAll('dialog').forEach(d=>d.close());$('toasts').replaceChildren();mobileSetPane12521('menu');`));
 const mobile=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:innerWidth,cards:[...document.querySelectorAll('[data-action="build"]')].filter(b=>b.dataset.id.endsWith('1260')).length}));
 assert.equal(mobile.width,mobile.view);assert.equal(mobile.cards,15);
 await page.locator('[data-action="build"][data-id="starRestaurant1260"]').evaluate(el=>el.scrollIntoView({block:'center'}));
 await page.screenshot({path:path.join(root,'tests/results/town-1260/mobile.png'),fullPage:true});
 console.log('PASS town integration scenarios, milestone art and mobile UI');


 const migration=await browser.newPage({viewport:{width:1280,height:900}});
 const migrationErrors=[];migration.on('pageerror',e=>migrationErrors.push(e.stack));
 const legacy=fs.readFileSync(path.join(root,'releases/1.25.59/game.html'),'utf8').replace('// Load saved species only after the full roster has been registered.',`window.townQA={run:code=>eval(code)};\n// Load saved species only after the full roster has been registered.`);
 await migration.route('**/*',r=>r.request().url().startsWith('http://migration.test/')?r.fulfill({contentType:'text/html',body:r.request().url().endsWith('/old')?legacy:html}):r.abort());
 await migration.goto('http://migration.test/old');await migration.waitForTimeout(800);
 const oldSave=await migration.evaluate(()=>townQA.run(`state.speed=0;state.villageLv=20;state.worldTreeLevel=20;state.coins=123456;state.buildings.find(b=>b.type==='worldtree').level=20;save(true);({monsters:state.monsters.map(m=>m.id),staff:state.staff.map(w=>w.id),coins:state.coins})`));
 await migration.goto('http://migration.test/new');await migration.waitForTimeout(800);
 const migrated=await migration.evaluate(()=>townQA.run(`({level:state.villageLv,monsters:state.monsters.map(m=>m.id),staff:state.staff.map(w=>w.id),coins:state.coins,reserve:state.mealReserve1260})`));
 assert.equal(migrated.level,20);assert.equal(migrated.coins,oldSave.coins);assert.deepEqual(migrated.monsters,oldSave.monsters);assert.deepEqual(migrated.staff,oldSave.staff);assert.equal(migrated.reserve,0);assert.deepEqual(migrationErrors,[]);
 console.log('PASS real 1.25.59 save migrates without resetting level, coins or residents');
 await browser.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
