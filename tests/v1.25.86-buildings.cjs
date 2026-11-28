// Local regression check. Optionally pass an exported ranch JSON as argument one.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const release=process.env.RELEASE_DIR||path.join(root,'releases/1.25.86');
const hook='claimSave12556();\nconst didLoad=load();';
const expose='window.inspectRanch=(expression,args)=>eval(expression);\n'+hook;
const entry='http://ranch.test/game.html';
const names=['starChart','herbPlot','jarHut'];

async function open(browser,file,mobile,stored){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},
    deviceScaleFactor:mobile?2:1,hasTouch:mobile,isMobile:mobile,acceptDownloads:true,serviceWorkers:'block',locale:'ja-JP'});
  const errors=[],page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  const body=fs.readFileSync(file,'utf8'),compact=body.includes('id="ranch-payload"');
  await page.addInitScript(({stored,hook,expose,compact})=>{
    if(stored&&!localStorage.getItem('monster_biyori_guarded_save_v1')){
      localStorage.setItem('monster_biyori_guarded_save_v1',JSON.stringify({...stored,speed:0,savedAt:Date.now()}));
    }
    if(compact){const write=Document.prototype.write;Document.prototype.write=function(...s){
      if(typeof s[0]==='string')s[0]=s[0].replace(hook,()=>expose);return write.apply(this,s);
    };}
  },{stored,hook,expose,compact});
  await page.route('**/*',r=>r.request().url()===entry?r.fulfill({body:compact?body:body.replace(hook,()=>expose),contentType:'text/html; charset=utf-8'}):r.abort());
  const ready=()=>page.waitForFunction(()=>typeof window.inspectRanch==='function'&&inspectRanch('state&&facilitySheetReady'),null,{timeout:90000});
  await page.goto(entry);await ready();
  const call=(s,args)=>page.evaluate(([s,a])=>inspectRanch(s,a),[s,args]);
  return {page,context,errors,call,ready,compact};
}

async function exported(session){
  const event=session.page.waitForEvent('download');await session.call('exportSave();true');
  const download=await event;return JSON.parse(fs.readFileSync(await download.path(),'utf8'));
}

function progress(s){
  const project=(objects,keys)=>objects.map(o=>keys.map(k=>o[k]??null));
  const keys=['ranchName','version','day','hour','coins','food','villageLv','villageXp','party','research','recipes','talentFruit','catalog','zones','paths','stoneTiles','ponds','materials','materialSeen211','observationDays80','starterGuide','treasures','gear','equipment','treeXp','ownedTreasures'];
  return {...Object.fromEntries(keys.filter(k=>k in s).map(k=>[k,s[k]])),
    buildings:project(s.buildings,['id','type','level','x','y','facing','chart75','constructionPaid']),
    monsters:project(s.monsters,['id','kind','name','lv','shiny','iv','exp','equipment']),
    resting:project(s.restingMonsters||[],['id','kind','name','lv','shiny','iv','exp','equipment']),
    staff:project(s.staff,['id','name','role','building','lv','portrait'])};
}

async function inspect(session){
  const {call,page,compact}=session;
  assert.equal(await call('GAME_APP_VERSION'),'1.25.86');
  await call(`(()=>{state.speed=0;state.day=1;state.hour=11;state.sceneCamera81=false;state.starterGuide='done';renderStarterGuide();
    state.zones=ZONES.map((_,i)=>i);state.buildings=args.map((type,i)=>({id:600+i,type,x:23+i*3,y:17-i*3,level:1,facing:0}));
    state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];state.paths=[];const roads=new Set();for(const b of state.buildings){
      for(let x=b.x-1;x<=b.x+2;x++)for(let y=b.y-1;y<=b.y+2;y++)if(x<b.x||y<b.y||x>=b.x+2||y>=b.y+2)roads.add(keyXY(x,y));}
    state.paths=[...roads];buildMode=null;moveMode=null;selectedBuilding=null;renderUI(true);drawWorld(1000);return true})()`,names);
  const results=[];
  for(const [idx,type] of names.entries()){
    await call(`(()=>{const b=state.buildings[args];cameraX=b.x+1-VW/(2*zoom);cameraY=b.y+1-VH/(2*zoom);limitCamera();selectedBuilding=b.id;drawWorld(1000);renderUI(true);return true})()`,idx);
    const toggle=page.locator('#buildingMenuTools [data-menu-facing]');
    if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click({timeout:6500});
    const distinct=new Set();
    for(const f of [0,1,2,3]){
      await page.locator('#facilityFacing [data-facing="'+f+'"]').click({timeout:6500});
      const check=await call(`(()=>{const [type,f]=args,b=state.buildings.find(b=>b.type===type),r=plotImageRect(b),unit=r.w/(type==='herbPlot'?256:320),origin=projectGround(b.x,b.y);
        const base=townMapArt(b,f,true,0),site=townMapArt(b,f,false,0),n=base.width,hut=type!=='herbPlot',dx=hut?32:0,dy=hut?64:0;
        const data=base.getContext('2d').getImageData(0,0,n,n).data;let maxFront=-Infinity,side=0,hash=2166136261,top=n,low=-1;
        for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=4*(y*n+x),a=data[k+3];hash=Math.imul(hash^data[k],16777619)>>>0;
          if(a<140)continue;const sx=x+.5-dx,sy=y+.5-dy;top=Math.min(y,top);low=Math.max(y,low);maxFront=Math.max(maxFront,sy-(256-Math.abs(sx-128)/2));
          if((sx<0||sx>256)&&sy>=177)side++;}
        const ok=r.x+dx*unit===origin.x-2*T&&r.y+dy*unit===origin.y-2*T&&unit===.5;
        return {type,f,hash,correct:r.w===r.h&&ok&&base.height===n&&n===(hut?320:256),facing:b.facing,matched:site===base&&spriteBuildingV161(type,1,f)===base,
          front:maxFront,side,height:low-top+1,roads:entranceRoads(b).length};})()`,[type,f]);
      assert.equal(check.facing,f);assert(check.correct&&check.matched,JSON.stringify(check));
      assert(check.front<=(compact?1.5:0),JSON.stringify(check));assert.equal(check.side,0);assert.equal(check.roads,2);
      distinct.add(check.hash);results.push(check);
    }
    assert.equal(distinct.size,4);await call('selectedBuilding=null;renderUI(true);true');
  }
  const dynamic=await call(`(()=>{function changed(a,b){const n=a.width,pa=a.getContext('2d').getImageData(0,0,n,n).data,pb=b.getContext('2d').getImageData(0,0,n,n).data;let count=0;
      for(let i=0;i<pa.length;i+=4){if(pa[i+3]!==pb[i+3])throw Error('changed outline');if(pa[i]!==pb[i]||pa[i+1]!==pb[i+1]||pa[i+2]!==pb[i+2])count++;}return count;}
    const star=state.buildings.find(b=>b.type==='starChart'),jar=state.buildings.find(b=>b.type==='jarHut');const records=[],seasons=[];
    for(let f=0;f<4;f++){const s=townMapArt(star,f,true,0);star.chart75=17;const n=townMapArt(star,f,false,0);star.chart75=18;const m=townMapArt(star,f,false,0);records.push([changed(s,n),changed(n,m)]);
      const j=townMapArt(jar,f,true,0);for(const day of [8,15,22]){state.day=day;seasons.push(changed(j,townMapArt(jar,f,false,0)));}}
    return {records,seasons};})()`);
  dynamic.records.forEach((v,f)=>v.forEach(n=>assert(f===0||f===3?n>0:n===0)));
  assert(dynamic.seasons.every(n=>n>0));assert.deepEqual(session.errors,[]);return results;
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try{
    const input=process.argv[2]?JSON.parse(fs.readFileSync(process.argv[2],'utf8')):null;
    const old=await open(browser,path.join(root,'releases/1.25.85/game.html'),false,input);
    await old.call('state.speed=0;save(true);true');const baseline=await exported(old);
    assert.deepEqual(old.errors,[]);await old.context.close();
    for(const [file,mobile] of [['game.html',false],['launcher-game.html',true]]){
      const current=await open(browser,path.join(release,file),mobile,null);
      await current.call(`importSave(new File([JSON.stringify({...args,speed:0})],'ranch.json',{type:'application/json'}));true`,baseline);
      await current.page.waitForFunction(count=>inspectRanch('localStorage.getItem(SAVE_KEY)!==null&&state.buildings.length')===count,baseline.buildings.length,{timeout:30000});
      await current.page.reload();await current.ready();const saved=await exported(current);
      assert.deepEqual(progress(saved),progress(baseline));
      const checks=await inspect(current);console.log(file,'saved lots',saved.buildings.length,'active',saved.monsters.length,'resting',saved.restingMonsters.length,'staff',saved.staff.length,'facings',checks.length,'max front',Math.max(...checks.map(c=>c.front)));
      await current.context.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
