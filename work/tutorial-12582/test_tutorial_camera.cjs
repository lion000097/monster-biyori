const assert=require('node:assert/strict'), fs=require('node:fs'), http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/codex/cua_node/lib/node_modules/playwright');
const key='monster_biyori_guarded_save_v1';
const server=http.createServer((req,res)=>{
 const name=req.url.slice(1);
 if(!['baseline.html','game.html','launcher-game.html'].includes(name)){
   res.writeHead(404);res.end();return;
 }
 res.setHeader('Content-Type','text/html;charset=utf-8');
 const stream=fs.createReadStream(name);stream.on('error',()=>res.end());stream.pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({executablePath:process.env.CHROME||'/tmp/mb-browser/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
 try {
 const errors=[];
 const save=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 const mobileCfg={viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2};
 const desktopCfg={viewport:{width:1280,height:720}};
 async function open(file,cfg,fixture) {
   const cx=await browser.newContext(cfg);
   await cx.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.abort());
   await cx.addInitScript(()=>{
     const fn=CanvasRenderingContext2D.prototype.fillRect;
     CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){
       if(this.canvas.id==='game'&&this.fillStyle==='#ffda64'&&w===7&&h===5){
         const p=this.getTransform().transformPoint(new DOMPoint(x+3,y+15));
         window.__guideTile={u:p.x/this.canvas.width,v:p.y/this.canvas.height};
       }
       return fn.call(this,x,y,w,h);
     };
   });
   if(fixture)await cx.addInitScript(([k,data])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify(data));},[key,fixture]);
   const p=await cx.newPage();
   p.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
   await p.goto(url+file);
   return {p,cx};
 }
 const {p:old,cx:oc}=await open('baseline.html',desktopCfg);
 await old.locator('#ranchGuideDialog[open]').waitFor();
 const base=await save(old);
 assert.equal(base.starterGuide,'welcome');
 await oc.close();

 async function journey(file,mobile){
   const {p,cx}=await open(file,mobile?mobileCfg:desktopCfg);
   try {
   const title=p.locator('#ranchGuideTitle');
   const goal=p.locator('#ranchGuideTask');
   const next=p.locator('#ranchGuideNext');
   const target=p.locator('[data-ranch-guide-target]:visible');
   const tab=p.locator(mobile?'[data-mobile-dock12521="adventure"]':'.tab[data-tab="adventure"]');
   const text=snippet=>p.waitForFunction(part=>document.querySelector('#ranchGuideTask').textContent.includes(part),snippet);
   async function guidedMap(touchPlacement=false){
     await p.locator('#ranchGuideLocate').click();
     if(mobile&&touchPlacement){
       await p.waitForFunction(()=>window.__guideTile?.u>0&&window.__guideTile?.u<1&&window.__guideTile?.v>0&&window.__guideTile?.v<1);
       const pos=await p.evaluate(()=>{
         const r=document.querySelector('#game').getBoundingClientRect();
         return {x:r.left+r.width*window.__guideTile.u,y:r.top+r.height*window.__guideTile.v};
       });
       assert.equal(await p.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,pos),'game');
       await p.touchscreen.tap(pos.x,pos.y);
       await p.touchscreen.tap(pos.x,pos.y);
     }else await p.keyboard.press('Enter');
   }
   await p.locator('#ranchGuideDialog[open]').waitFor();
   assert.match(await p.locator('#ranchGuideSpeech').innerText(),/がおの名前はしろガオ！.*この街を発展/);
   const fresh=await save(p);
   assert.equal(fresh.monsters.length,3);
   const lion=fresh.monsters.find(m=>m.id===1);
   assert.equal(lion.name,'しろガオ');
   assert.notEqual(lion.kind,0);
   assert.deepEqual(fresh.monsters.slice(1).map(m=>m.kind),base.monsters.slice(1).map(m=>m.kind));
   assert.deepEqual(new Set(fresh.catalog.friends),new Set(fresh.monsters.map(m=>m.kind)));
   await next.click();
   await text('「施設」を開こう');
   if(process.env.SPOT_TRACE){
     await p.waitForTimeout(600);
     console.log(await p.evaluate(()=>{
       const a=document.querySelector('[data-ranch-guide-target]'),r=a.getBoundingClientRect(),piece=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
       return {hidden:document.querySelector('#guideSpotlight82').hidden,target:a.outerHTML,actual:piece?.outerHTML.slice(0,200),r:r.toJSON(),style:document.querySelector('#guideSpotlight82').style.cssText,dialog:document.querySelector('#ranchGuideDialog').open};
     }));
     return;
   }
   await p.locator('#guideSpotlight82').waitFor({state:'visible'});
   assert.equal(await p.locator('#guideSpotlight82').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
   await target.click();
   await text('「生産・加工」を選ぼう'); await target.click();
   await text('「素材牧場」の「建てる」');
   if(process.env.SCROLL_TRACE)console.log('before', await p.evaluate(()=>({y:scrollY, map:document.querySelector('#game').getBoundingClientRect().top})));
   await target.click();
   await text('入口の向きを変えよう');
   const viewport=await p.evaluate(()=>({
     y:window.scrollY, layout:document.querySelector('.layout').scrollTop,
     mapTop:document.querySelector('#game').getBoundingClientRect().top,
     facingBottom:document.querySelector('[data-ranch-guide-target]').getBoundingClientRect().bottom,
     guideTop:document.querySelector('#ranchGuideGoal').getBoundingClientRect().top
   }));
   console.log(file,mobile?'mobile':'desktop','ranch placement',JSON.stringify(viewport));
   if(process.env.SCROLL_TRACE){await p.screenshot({path:file+'-placement.png'});return;}
   assert.ok(viewport.y<=60&&viewport.layout<=30&&viewport.mapTop>=0,JSON.stringify(viewport));
   assert.ok(viewport.facingBottom<=viewport.guideTop+1);
   await target.click();
   await text('道沿いに「素材牧場」');
   await p.waitForFunction(()=>Number(document.querySelector('#zoomLabel')?.textContent.replace('%',''))>=135);
   await p.waitForFunction(()=>window.__guideTile&&Math.abs(window.__guideTile.u-.5)<.15&&Math.abs(window.__guideTile.v-.43)<.18);
   assert.equal(await p.locator('#guideSpotlight82').isVisible(),false);
   await guidedMap(true);
   await p.waitForFunction(()=>/素材牧場.*選ぼう|「向きを変える」を開こう/.test(document.querySelector('#ranchGuideTask').textContent));
   if((await goal.textContent()).includes('選ぼう'))await guidedMap();
   await text('「向きを変える」を開こう');
   const inspectView=await p.evaluate(()=>({
     y:scrollY,l:document.querySelector('.layout').scrollTop,
     mapBottom:document.querySelector('#game').getBoundingClientRect().bottom,
     mapTop:document.querySelector('#game').getBoundingClientRect().top,
     b:document.querySelector('[data-ranch-guide-target]').getBoundingClientRect().bottom,
     guide:document.querySelector('#ranchGuideGoal').getBoundingClientRect().top
   }));
   console.log(file,mobile?'mobile':'desktop','ranch interaction',JSON.stringify(inspectView));
   assert.ok(inspectView.b<=inspectView.guide+1&&Math.min(inspectView.mapBottom,inspectView.guide)-Math.max(0,inspectView.mapTop)>120);
   await target.click();
   await text('入口を向ける方向'); await target.click();
   await p.waitForFunction(()=>document.querySelector('#ranchGuideTitle').textContent==='つぎは、お店を開こう！'&&document.querySelector('#ranchGuideDialog').open);
   await next.click();
   await text('「商売・宿泊」を選ぼう'); await target.click();
   await text('「お店」の「建てる」'); await target.click();
   await text('道沿いに「お店」'); await guidedMap(true);
   await p.locator('#ranchGuideDialog[open]').waitFor();
   assert.equal(await p.locator('#ranchGuideSpeech').textContent(),'次は冒険に行ってみよう！');
   assert.equal(await p.locator('.ranch-guide-speaker').innerText(),'しろガオ');
   assert.equal((await save(p)).starterGuide,'adventureIntro82');
   await next.click();
   await text('「冒険」を開こう');
   await p.waitForFunction(()=>document.querySelector('#zoomLabel')?.textContent==='100%');
   const buildings=(await save(p)).buildings;
   assert.equal(buildings.filter(b=>b.type==='shop'||b.type==='ranch').length,2);
   await tab.click();
   await title.waitFor();
   assert.equal(await title.textContent(),'仲間と冒険に出かけよう！');
   assert.equal(await p.locator('#ranchGuideNext').textContent(),'1-1に挑戦する');
   await p.locator('#ranchGuideNext').click();
   await p.waitForFunction(()=>document.querySelector('#ranchGuideTask').textContent.includes('はらっぱ'));
   const start=p.locator('[data-action="adventureStart"]');
   assert.match(await start.innerText(),/1-1 に出発する/);
   assert.equal(await start.getAttribute('data-ranch-guide-target'),'');
   assert.equal((await save(p)).adventure.stage,1);
   await start.click();
   await p.waitForFunction(()=>document.querySelector('#ranchGuideTask').textContent.includes('見守ろう'));
   await p.locator('#journeyMap12554').waitFor();
   await p.waitForFunction(()=>document.querySelector('#journeyMap12554 [data-journey-status]').textContent.includes('宝箱'),{},{timeout:18000});
   await p.waitForFunction(()=>document.querySelector('#journeyMap12554 progress').value===100&&document.querySelector('#ranchGuideGoal').hidden===false,{},{timeout:45000});
   assert.equal(await p.locator('#ranchGuideDialog').evaluate(d=>d.open),false,'show the existing 100% scene first');
   await p.waitForFunction(()=>document.querySelector('#ranchGuideDialog').open&&document.querySelector('#ranchGuideTitle').textContent==='1-1をクリアしたよ！',{},{timeout:12000});
   const cleared=await save(p);
   assert.equal(cleared.adventure.stage,2);
   assert.equal(cleared.adventure.clears,base.adventure.clears+1);
   assert.ok(cleared.villageXp>base.villageXp);
   await p.locator('#ranchGuideNext').click();
   await p.waitForFunction(()=>document.querySelector('#ranchGuideTitle').textContent==='仲間を育てよう'&&document.querySelector('#ranchGuideDialog').open);
   assert.match(await p.locator('#ranchGuideSpeech').innerText(), /特訓/);
   assert.equal(await p.locator('#monsterDetailTitle').count(),0);
   await p.locator('#ranchGuideNext').click();
   await text('地図の世界樹');
   await guidedMap();
   await p.locator('#ranchGuideDialog[open]').waitFor();
   assert.equal(await title.textContent(),'世界樹の成長XPを集めよう');
   assert.ok(!/18\.2|61\.75/.test(await p.locator('#ranchGuideSpeech').textContent()));
   assert.equal(await p.locator('#monsterDetailTitle').count(),0);
   console.log(file,mobile?'mobile':'desktop','greeting, Shirogao, both buildings, 1-1 actual outing and Tree XP guide OK');
   }catch(e){
     console.error(file,mobile?'mobile':'desktop',await p.evaluate(()=>({task:document.querySelector('#ranchGuideTask')?.textContent,title:document.querySelector('#ranchGuideTitle')?.textContent,t:document.querySelector('#toasts')?.innerText,m:document.querySelector('#buildMode')?.innerText})),(await save(p))?.starterGuide);
     throw e;
   }finally{await cx.close();}

 }
 async function checks(){
   for(const [stage,n,expected] of [['treeXp',1,'世界樹の成長XPを集めよう'],['adventure',2,'仲間と冒険に出かけよう！'],['firstAdventure82',1,null],['done',1,null],['openTraining',2,null],['training',2,null],['welcome',1,'ようこそ、こもれび牧場へ！']]){
     const fixture={...base,starterGuide:stage,adventure:{...base.adventure,stage:n}};
     const {p,cx}=await open('game.html',desktopCfg,fixture);
     if(expected){
       await p.locator('#ranchGuideDialog[open]').waitFor();
       assert.equal(await p.locator('#ranchGuideTitle').textContent(),expected);
       if(stage==='treeXp'){
         const body=await p.locator('#ranchGuideSpeech').textContent();
         assert.ok(!/通常戦の勝利|ボスの初勝利|18\.2|61\.75/.test(body));
         assert.ok(body.includes('たまごの孵化'));
       }else if(stage==='adventure'){
         assert.equal(await p.locator('#ranchGuideNext').textContent(),'仲間の育て方へ');
         await p.locator('#ranchGuideNext').click();
         assert.equal((await save(p)).adventure.stage,2);
         assert.equal((await save(p)).starterGuide,'training');
       }
     }else if(stage==='firstAdventure82'){
       await p.locator('#ranchGuideGoal').waitFor();
       await p.locator('.tab[data-tab="adventure"]').click();
       await p.waitForFunction(()=>document.querySelector('#ranchGuideTask').textContent.includes('はらっぱ'));
       await p.locator('#ranchGuideGoal [data-guide-stop]').click();
       assert.equal((await save(p)).starterGuide,'done');
       assert.equal((await save(p)).adventure.stage,1);
     }else if(stage==='openTraining'||stage==='training'){
       await p.waitForFunction(()=>document.querySelector('#ranchGuideTitle').textContent==='仲間を育てよう'&&document.querySelector('#ranchGuideDialog').open);
       assert.equal((await save(p)).starterGuide,'training');
       assert.equal((await save(p)).monsters[0].kind,0,'original saves still have their existing Mofurin');
     }else{
       await p.waitForFunction(()=>document.querySelector('#ranchName')?.textContent==='こもれび牧場');
       await p.waitForTimeout(900);
       assert.equal(await p.locator('#ranchGuideDialog').evaluate(d=>d.open),false);
       assert.equal((await save(p)).starterGuide,'done');
     }
     await cx.close();
   }
   console.log('old completed save, first-build tutorial, XP text, midway resume stage and existing clears OK');
 }
 const web=process.env.SCROLL_TRACE||process.env.SPOT_TRACE?[journey('game.html',false)]:[journey('game.html',false),journey('game.html',true),checks()];
 const runs=process.env.WEB_ONLY?web:[...web,journey('launcher-game.html',true)];
 const done=await Promise.allSettled(runs);
 for(const r of done)if(r.status==='rejected')throw r.reason;
 assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
