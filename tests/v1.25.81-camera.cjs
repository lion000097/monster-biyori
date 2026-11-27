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
  expect(offerCameraScene81(hall),'automatically resumed after edits');
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

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--no-sandbox']});
  try{
    for(const mobile of (process.argv.includes('--web')?[false]:[false,true])){
      const ctx=await browser.newContext({viewport:{width:mobile?390:1120,height:820},reducedMotion:'no-preference'}),p=await ctx.newPage(),errors=[];
      p.on('pageerror',e=>{errors.push(e.message); console.error(e.message);});
      p.on('dialog',async dialog=>dialog.accept());
      const hook='window.oldFixture='+oldFixture.toString()+';window.inspectCamera='+inspectCamera.toString()+
        ';window.ranchSave=()=>JSON.parse(readRanchSave12556());\n';
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
      await p.goto(base+'/new');
      await p.waitForFunction(()=>document.querySelector('#ranchName')?.textContent==='ひだまりの牧場');
      const toggle=p.locator('#sceneCamera81');
      assert(await toggle.isVisible());assert.equal(await toggle.getAttribute('aria-pressed'),'false');
      await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'true');
      const r=await p.evaluate(()=>inspectCamera());assert(r.scenes>=3);
      await p.reload();await p.waitForFunction(()=>document.querySelector('#ranchName')?.textContent==='ひだまりの牧場');
      assert.equal(await toggle.getAttribute('aria-pressed'),'true');
      await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'false');
      assert(await p.locator('#sceneCameraStatus81').isHidden());
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.deepEqual(errors,[]);await ctx.close();
      console.log(mobile?'Offline mobile':'Web desktop','scene start, actual camera motion, edit/manual priority, old save and toggle passed');
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
