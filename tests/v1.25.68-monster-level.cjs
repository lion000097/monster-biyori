const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const base=process.env.MB_URL||'http://127.0.0.1:8879';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM,args:['--no-sandbox']});
 try {
 

  // Real 1.25.67 source, only exposing hooks inside the existing game closure.
  const expose=s=>s.replace('claimSave12556();\nconst didLoad=load();','window.qa={get state(){return state}, save, tick, monsterLevelNeed135, openMonsterDetails, installSave138, trainMonster, addMonsterXP:typeof addMonsterXP==='function'?addMonsterXP:null, gainStaffExperience, publicAdventureStage};\nclaimSave12556();\nconst didLoad=load();');
  for (const [path,offline,width] of [['/game.html',false,390],['/releases/1.25.68/launcher-game.html',true,1280]]) {
   const ctx=await browser.newContext({viewport:{width,height:850}});
   const errors=[];
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/baseline.html',async r=>r.fulfill({contentType:'text/html',body:expose(fs.readFileSync('baseline.html','utf8'))}));
   await page.goto(base+'/baseline.html');
   await page.waitForFunction(()=>window.qa?.state);
   const priorInfo=await page.evaluate(()=>{
    const q=window.qa,s=q.state;
    s.speed=0;s.food=50000;s.coins=50000;
    const [a,b,c]=s.monsters;
    a.lv=149;a.xp=q.monsterLevelNeed135(149)-1;
    b.lv=99;b.xp=10;
    c.lv=151;c.xp=123;
    s.monsters.pop();s.restingMonsters=[c];
    s.adventure.stage=51;
    q.save(true);
    return {a:a.id,b:b.id,c:c.id,buildings:s.buildings.length};
   });
   // Same-origin reload retains actual saved data.
   await page.goto('about:blank');
   if (offline) {
    const source=expose(fs.readFileSync('launcher-source.html','utf8'));
    await page.addInitScript(({source})=>{
      const original=Document.prototype.write;
      Document.prototype.write=function(...args){
       if(typeof args[0]==='string'&&args[0].includes("GAME_APP_VERSION='1.25.68'")){
        if (args[0]!==source.replace(/window.qa=\{[^\n]*\};\n/,''))throw Error('Offline expansion mismatch');
        args[0]=source;
       }
       return original.apply(this,args);
      };
    },{source});
    await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());
   } else {
    await page.route('**/game.html',r=>r.fulfill({contentType:'text/html',body:expose(fs.readFileSync('game.html','utf8'))}));
   }
   await page.goto(base+path);
   await page.waitForFunction(()=>window.qa?.state);
   const migrated=await page.evaluate(({a,b,c})=>{
    const q=window.qa,s=q.state;const A=s.monsters.find(m=>m.id===a),B=s.monsters.find(m=>m.id===b),C=s.restingMonsters.find(m=>m.id===c);
    q.openMonsterDetails(a);
    return [A.lv,A.xp,q.monsterLevelNeed135(149)-1,B.lv,B.xp,C.lv,C.xp,q.publicAdventureStage(),s.buildings.length,s.coins];
   },priorInfo);
   assert.deepEqual(migrated,[149,migrated[2],migrated[2],99,10,150,0,50,priorInfo.buildings,50000]);
   await page.locator('#monsterTrainingCount12530').fill('99');
   assert.match(await page.locator('#monsterTrainingCost12530').textContent(),/上限まで1回/);
   await page.locator('#monsterTrainingCost12530 + button').click();
   assert.equal(await page.locator('#monsterTrainingCount12530').isDisabled(),true);
   assert.match(await page.locator('#monsterDetailBody .monster-xp').textContent(),/MAX/);
   const state=await page.evaluate(({a,b})=>{
    const q=window.qa,s=q.state,A=s.monsters.find(m=>m.id===a),B=s.monsters.find(m=>m.id===b);
    q.trainMonster(a,99);q.addMonsterXP(A,10000);
    B.lv=149;B.xp=q.monsterLevelNeed135(149);
    q.tick(true);q.tick(true);
    const w=s.staff[0];w.level=99;q.gainStaffExperience(w);
    q.save(true);
    return [A.lv,A.xp,B.lv,B.xp,s.coins,w.level];
   },priorInfo);
   assert.deepEqual(state,[150,0,150,0,49955,99]);
   await page.reload();await page.waitForFunction(()=>window.qa?.state);
   assert.deepEqual(await page.evaluate(()=>window.qa.state.monsters.map(m=>[m.lv,m.xp])),[[150,0],[150,0]]);
   assert.deepEqual(errors,[]);
   await ctx.close();
   console.log('PASS',path,width,'legacy save, training UI, passive growth, cap persistence');
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
