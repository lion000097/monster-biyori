'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const { chromium }=require('playwright');
const root=path.resolve(__dirname,'..'), delivery=process.env.RELEASE_ROOT||root;
const base='https://scene-camera.invalid', marker='claimSave12556();\nconst didLoad=load();';

function oldFixture() {
  state.starterGuide='done'; state.speed=0; state.day=14;
  state.ranchName='ひだまりの牧場';state.coins=789012;
  state.observationDays80={birdClock:4,picnic257:7,musicHall:9};
  return save(true);
}

function inspectCamera() {
  const expect=(truth,why)=>{if(!truth)throw Error(why);};
  const add=(type,x,y)=>{const b={id:state.nextId++,type,x,y,level:1,facing:0};state.buildings.push(b);return b;};
  expect(state.sceneCamera81&&state.ranchName==='ひだまりの牧場'&&state.coins===789012,'old ranch and button');
  expect(state.observationDays80.musicHall===9,'old journal');
  const clock=add('birdClock',-15,-14), hall=add('musicHall',20,17);
  state.speed=1;state.hour=12;selectedBuilding=null;selectedMonster=null;
  cameraX=4-VW/(2*zoom);cameraY=4-VH/(2*zoom);
  const start=cameraCenter(),scale=zoom;
  stepTownScenes(.1); updateSceneCamera81();
  const after=cameraCenter();
  expect(cameraScene81?.site===clock&&after.x<start.x&&after.y<start.y,'already discovered offscreen noon clock');
  expect(zoom===scale,'zoom preserved');
  const venue=townVenue(hall);
  venue.mode='music';
  venue.members=Array.from({length:4},(_,slot)=>({actor:{x:20,y:17},phase:slot===3?'road':'use',slot,kind:'monster',venue}));
  townStepGroup(venue,.1);expect(!venue.running&&!cameraNext81,'musicians still arriving');
  venue.members[3].phase='use';townStepGroup(venue,.1);
  const now=performance.now();
  updateSceneCamera81(now+650);
  expect(cameraScene81?.site===hall&&$('sceneCameraStatus81').textContent.includes('演奏会'),'actual concert location and title');
  expect(state.observationDays80.musicHall===9,'repeat concert kept original day');
  const locked=cameraCenter();
  for(const mode of ['build','move','terrain','clear','follow']){
    buildMode=mode==='build'?'home':null;moveMode=mode==='move'?hall.id:null;
    terrainMode=mode==='terrain'?'road':null;clearMode=mode==='clear';
    followedMonster=mode==='follow'?state.monsters[0]:null;
    updateSceneCamera81();
    expect(!offerCameraScene81(hall)&&!cameraScene81&&cameraCenter().x===locked.x,'yield to '+mode);
  }
  buildMode=moveMode=terrainMode=followedMonster=null;clearMode=false;
  updateSceneCamera81();expect(cameraScene81?.site===hall,'resumed concert');
  cameraMove(1,0);
  expect(!offerCameraScene81(hall)&&!cameraScene81,'manual navigation has priority');
  cameraHold81=0;offerCameraScene81(hall);updateSceneCamera81();
  state.buildings.splice(state.buildings.indexOf(hall),1);
  updateSceneCamera81();expect(!cameraScene81,'removed venue released');
  venue.members.length=0;venue.running=false;
  state.speed=0;renderUI(true);save(true);
  return {scale, scenes:Object.keys(state.observationDays80).length};
}

function checkTime() {
  const expect=(v,s)=>{if(!v)throw Error(s);};
  const descriptors=[[performance,'now'],[document,'hidden'],[document,'visibilityState']].map(([o,k])=>[o,k,Object.getOwnPropertyDescriptor(o,k)]);
  const initial=Math.floor(performance.now());
  let now=initial,hidden=false;
  try {
    Object.defineProperty(performance,'now',{configurable:true,value:()=>now});
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>hidden?'hidden':'visible'});
    accountPlayTime81();
    const start=state.playMillis81;
    const advance=(ms,speed)=>{
      state.speed=speed;now+=ms;renderPlayTime81();return state.playMillis81-start;
    };
    const visible=on=>{hidden=!on;document.dispatchEvent(new Event('visibilitychange'));};
    expect(advance(1500,1)===1500,'normal speed');
    expect(advance(3500,4)===5000,'4x real time');
    expect(advance(4500,0)===9500,'visible pause counts');
    now+=500;visible(false);
    expect(JSON.parse(readRanchSave12556()).playMillis81===start+10000,'hidden-save flush');
    expect(advance(120000,4)===10000,'hidden tab excluded');
    visible(true);expect(advance(2000,4)===12000,'return from hidden');
    now+=1000;window.dispatchEvent(new Event('pagehide'));now+=5*3600000;
    window.dispatchEvent(new Event('pageshow'));
    expect(advance(1000,0)===14000,'page cache or closed interval excluded');
    state.playMillis81=3661000;renderPlayTime81();
    expect($('ranchPlayTime81').textContent==='1時間 01分 01秒','hours, minutes, seconds');
    for (const value of [null,'31',-1,Infinity,NaN,9007199254740992]) {
      const ranch={playMillis81:value};normalizePlayTime81(ranch);
      expect(ranch.playMillis81===0,'malformed duration');
    }
    const valid={playMillis81:12345};normalizePlayTime81(valid);expect(valid.playMillis81===12345,'old valid count preserved');
    const fresh=initialRanchForTest81();
    expect(fresh.playMillis81===0&&!fresh.sceneCamera81,'new ranch starts clean');
    expect(save(true),'play time saved');
  } finally {
    for(const [o,k,desc] of descriptors){if(desc)Object.defineProperty(o,k,desc);else delete o[k];}
    pageAway81=false;playMark81=null;accountPlayTime81();
  }
}

async function openHelp(page,mobile) {
  if(!await page.locator('#help-tab-basics').isVisible()){
    if(mobile){await page.locator('#mobileMoreToggle12521').click();await page.locator('[data-mobile-open12521=help]').click();}
    else await page.locator('#helpBtn').click();
  }
  await page.locator('#help-tab-basics').click();
}
async function exportFile(page,mobile) {
  await openHelp(page,mobile);const task=page.waitForEvent('download');
  await page.locator('#help-page-basics [data-action=export]').click();
  return JSON.parse(fs.readFileSync(await (await task).path(),'utf8'));
}
async function importFile(page,mobile,data) {
  await openHelp(page,mobile);
  await page.locator('#importInput').setInputFiles({name:'ranch.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await page.waitForFunction(()=>!document.querySelector('#modal').classList.contains('show'));
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--no-sandbox']});
  try{
    for(const mobile of (process.argv.includes('--web')?[false]:[false,true])){
      const ctx=await browser.newContext({viewport:{width:mobile?390:1120,height:820},reducedMotion:'no-preference'}),p=await ctx.newPage(),errors=[];
      p.on('pageerror',e=>{errors.push(e.message); console.error(e.message);});
      p.on('dialog',async dialog=>dialog.accept());
      const hook='window.oldFixture='+oldFixture.toString()+';window.inspectCamera='+inspectCamera.toString()+
        ';window.checkTime='+checkTime.toString()+';window.initialRanchForTest81=()=>initial();'+
        'window.ranchSave=()=>JSON.parse(readRanchSave12556());window.trySave=()=>save(true);\n';
      await p.addInitScript(({hook,marker})=>{
        const write=Document.prototype.write;
        Document.prototype.write=function(...parts){
          if(typeof parts[0]==='string')parts[0]=parts[0].replace(marker,()=>hook+marker);
          return write.apply(this,parts);
        };
      },{hook,marker});
      await p.route('**/*',r=>{
        const url=r.request().url(),old=url===base+'/old';
        if(!old&&url!==base+'/new')return r.abort();
        const file=old?path.join(root,'releases/1.25.80/game.html'):path.join(delivery,mobile?'releases/1.25.81/launcher-game.html':'game.html');
        const source=fs.readFileSync(file,'utf8');
        return r.fulfill({contentType:'text/html; charset=utf-8',body:mobile&&!old?source:source.replace(marker,()=>hook+marker)});
      });
      await p.goto(base+'/old');
      await p.waitForFunction(()=>typeof oldFixture==='function' && document.querySelector('#ranchName').textContent);
      assert(await p.evaluate(()=>oldFixture()));
      const oldSave=await p.evaluate(()=>ranchSave());assert(!Object.hasOwn(oldSave,'playMillis81'));
      await p.goto(base+'/new');
      await p.waitForFunction(()=>document.querySelector('#ranchName')?.textContent==='ひだまりの牧場');
      const toggle=p.locator('#sceneCamera81');
      assert(await toggle.isVisible());assert.equal(await toggle.getAttribute('aria-pressed'),'false');
      await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'true');
      const r=await p.evaluate(()=>inspectCamera());assert(r.scenes>=3);
      await p.reload();await p.waitForFunction(()=>document.querySelector('#ranchName')?.textContent==='ひだまりの牧場');
      assert.equal(await toggle.getAttribute('aria-pressed'),'true');
      assert((await p.evaluate(()=>ranchSave())).playMillis81<120000);
      if(mobile){
        await p.locator('#mobileMoreToggle12521').click();await p.locator('[data-mobile-open12521=stats]').click();
      }
      assert(await p.locator('#ranchPlayTime81').isVisible());
      await p.evaluate(()=>checkTime());
      assert.match(await p.locator('#ranchPlayTime81').textContent(),/^1時間 01分 /);
      if(mobile)await p.locator('#mobileStats12521 [data-mobile-close12521]').click();
      await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'false');
      assert(await p.locator('#sceneCameraStatus81').isHidden());
      await toggle.click();
      const newSave=await exportFile(p,mobile);
      assert(newSave.playMillis81>=3661000&&newSave.playMillis81<3721000);
      assert.equal(newSave.sceneCamera81,true);
      await importFile(p,mobile,oldSave);
      const migrated=await exportFile(p,mobile);
      assert(migrated.playMillis81>=0&&migrated.playMillis81<60000);assert.equal(migrated.sceneCamera81,false);
      assert.deepEqual(migrated.observationDays80,oldSave.observationDays80);
      assert.equal(migrated.coins,oldSave.coins);
      await importFile(p,mobile,newSave);
      const restored=await exportFile(p,mobile);
      assert(restored.playMillis81>=newSave.playMillis81&&restored.playMillis81<newSave.playMillis81+60000);
      assert.equal(restored.sceneCamera81,true);
      assert.deepEqual(restored.observationDays80,newSave.observationDays80);
      await p.reload();await p.waitForFunction(()=>document.querySelector('#ranchName')?.textContent==='ひだまりの牧場');
      assert.equal(await toggle.getAttribute('aria-pressed'),'true');
      const stale=await p.evaluate(()=>{
        localStorage.setItem('monster_biyori_guarded_owner_v1','a-different-tab');
        const before=localStorage.getItem('monster_biyori_guarded_save_v1');
        const result=trySave();return {result,same:before===localStorage.getItem('monster_biyori_guarded_save_v1')};
      });
      assert.deepEqual(stale,{result:false,same:true});
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.deepEqual(errors,[]);await ctx.close();
      console.log(mobile?'Offline mobile':'Web desktop','scene triggers, camera priority, play time, visibility, save migration, file round trips and ownership passed');
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
