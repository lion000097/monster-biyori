// Local regression check. Optionally pass an exported ranch JSON as argument one.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const version='1.25.90';
const hook='claimSave12556();\nconst didLoad=load();';
const expose='window.inspectRanch=(expression,args)=>eval(expression);\n'+hook;
const entry='https://ranch.test/game.html';
const names=Object.keys(require('./frames.json')); 

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
  await page.route('**/*',r=>{
    if(r.request().url()===entry)return r.fulfill({body:compact?body:body.replace(hook,()=>expose),contentType:'text/html; charset=utf-8'});
    if(compact&&process.env.ART_SOURCE&&r.request().url().endsWith('/stage-art-1.25.90.js'))return r.fulfill({body:fs.readFileSync(process.env.ART_SOURCE),contentType:'text/javascript; charset=utf-8',headers:{'Access-Control-Allow-Origin':'*'}});
    return r.abort();
  });
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
  const keys=['ranchName','version','day','hour','coins','food','villageLv','villageXp','party','research','recipes','talentFruit','catalog','zones','paths','stoneTiles','ponds','materials','materialSeen211','observationDays80','starterGuide','treasures','gear','equipment','treeXp','ownedTreasures','adventure','bestiary','achievements','expeditionTreasures','expeditionCounts213','expeditionArea213','expeditionAuto213','materialStock211','equipmentBlueprints12513','equipmentSeen12513','equipmentStock12512','stock','magic','fame','sceneCamera81','eggs'];
  return {...Object.fromEntries(keys.filter(k=>k in s).map(k=>[k,s[k]])),
    buildings:project(s.buildings,['id','type','level','x','y','facing','chart75','constructionPaid','picture75','activity75','townPicture','workSlots']),
    monsters:project(s.monsters,['id','kind','name','lv','shiny','iv','exp','equipment']),
    resting:project(s.restingMonsters||[],['id','kind','name','lv','shiny','iv','exp','equipment']),
    staff:project(s.staff,['id','name','role','building','lv','portrait'])};
}

async function checkArt(session) {
  const {call,page,compact}=session;
  assert.equal(await call('GAME_APP_VERSION'),version);
  await call(`(()=>{
    state.speed=0;state.day=4;state.hour=11;state.sceneCamera81=false;state.starterGuide='done';renderStarterGuide();
    state.zones=ZONES.map((_,i)=>i);state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];
    const layout=[[17,13],[20,8],[23,15],[26,10],[24,21],[29,16],[32,11],[34,20]];
    const lots=args.map((type,i)=>({type,x:layout[i][0],y:layout[i][1],level:1,facing:0}));
    state.villageLv=30;state.coins=1000000000;state.buildings=[];state.stoneTiles={};state.ponds=[];
    state.clearedPonds=[...DEFAULT_POND_KEYS];const clear=new Set(state.clearedScenery);
    [...state.monsters,...state.staff,...state.guests].forEach(a=>{a.x=9.5;a.y=8.5;a.path=[];});
    const roads=new Set();
    for(const b of lots){
      const m=buildingOf(b);
      for(let y=b.y-1;y<=b.y+m.h;y++)for(let x=b.x-1;x<=b.x+m.w;x++)clear.add(keyXY(x,y));
      for(let y=b.y-1;y<=b.y+m.h;y++)for(let x=b.x-1;x<=b.x+m.w;x++)
        if(x<b.x||y<b.y||x>=b.x+m.w||y>=b.y+m.h)roads.add(keyXY(x,y));
    }
    state.clearedScenery=[...clear];state.paths=[...roads];buildMode=null;moveMode=null;selectedBuilding=null;
    for(const b of lots){
      placementFacing=0;buildMode=b.type;place(b.type,b.x,b.y);
      const placed=state.buildings.find(v=>v.type===b.type);
      if(!placed||placed.x!==b.x||placed.y!==b.y||placed.constructionPaid<=0)throw Error('Placement failed for '+b.type);
    }
    buildMode=null;moveMode=null;selectedBuilding=null;renderUI(true);drawWorld(1000);
    return true;
  })()`,names);
  const results=[];
  for(const type of names){
    await call(`(()=>{const b=state.buildings.find(v=>v.type===args);cameraX=b.x+1-VW/(2*zoom);cameraY=b.y+1-VH/(2*zoom);
      limitCamera();selectedBuilding=b.id;drawWorld(1000);renderUI(true);return true})()`,type);
    const toggle=page.locator('#buildingMenuTools [data-menu-facing]');
    if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click({timeout:8500});
    const hashes=new Set();
    for(const face of [0,1,2,3]){
      await page.locator('#facilityFacing [data-facing="'+face+'"]').click({timeout:8500});
      const result=await call(`(()=>{
        const [kind,face]=args,b=state.buildings.find(v=>v.type===kind),m=buildingOf(b);
        const rect=plotImageRect(b),center=projectGround(b.x+m.w/2,b.y+m.h/2),w=(m.w+m.h)*T;
        const plot=travelerPlots[kind], [ax,ay,span]=plot.views?plot.views[face]:[...plot.anchor,plot.span];
        const scale=w/span;
        const art=townMapArt(b,face,true,0), displayed=townMapArt(b,face,false,0);
        const menu=spriteBuildingV161(kind,1,face);
        const data=art.getContext('2d').getImageData(0,0,art.width,art.height).data;
        let front=-Infinity,hash=2166136261,outside=0,inside=0;
        for(let y=0;y<art.height;y++)for(let x=0;x<art.width;x++){
          const i=4*(y*art.width+x);hash=Math.imul(hash^data[i],16777619)>>>0;
          const sx=rect.x+(x+.5)*rect.w/art.width-center.x,sy=rect.y+(y+.5)*rect.h/art.height-center.y;
          if(!plot.views){
            const inLot=Math.abs(sx)+2*Math.abs(sy)<=w/2;
            if(inLot&&data[i+3]!==255)inside++;
            if((sy+Math.abs(sx)/2>w/4||Math.abs(sx)>=w/2&&sy>=-3)&&data[i+3]>=128)outside++;
          }
          if(data[i+3]<128)continue;
          front=Math.max(front,sy+Math.abs(sx)/2-w/4);
        }
        drawWorld(1000);
        if(plot.views){
          const floor=travelerPaving.get(w),edges=floor.getContext('2d').getImageData(0,0,floor.width,floor.height).data;
          for(let y=0;y<floor.height;y++)for(let x=0;x<floor.width;x++){
            const within=Math.abs(x+.5-floor.width/2)+2*Math.abs(y+.5-floor.height/2)<=floor.width/2;
            const solid=edges[4*(y*floor.width+x)+3]===255;if(solid&&!within)outside++;if(!solid&&within)inside++;
          }
        }
        const road=entranceRoads(b),expected=Array.from({length:m.w},(_,i)=>[
          [b.x+i,b.y+m.h],[b.x-1,b.y+i],[b.x+i,b.y-1],[b.x+m.w,b.y+i]][face]);
        return {kind,face,facing:b.facing,n:art.width,hash,front,roads:road.length,tiles:m.w,footprint:m.w===m.h,
          accurate:Math.abs(rect.x+ax*scale-center.x)<1e-6 && Math.abs(rect.y+ay*scale-center.y)<1e-6 &&
                   Math.abs(rect.w/plot.size-scale)<1e-8 && rect.w===rect.h,
          same:menu===art && displayed.width===art.width,roadEdge:JSON.stringify(road)===JSON.stringify(expected),
          outside,inside};
      })()`,[type,face]);
      assert.equal(result.facing,face);assert(result.accurate&&result.footprint&&result.roadEdge,JSON.stringify(result));
      assert.equal(result.roads,result.tiles);assert.equal(result.outside+result.inside,0);
      assert(result.front<=(compact?1.5:0),JSON.stringify(result));
      assert(result.same,JSON.stringify(result));hashes.add(result.hash);results.push(result);
    }
    assert.equal(hashes.size,4);
    await call('selectedBuilding=null;renderUI(true);true');
  }

  return results.length;
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  try {
    const legacy=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
    const old=await open(browser,process.env.BASE_GAME||path.join(__dirname,'../../releases/1.25.89/game.html'),false,legacy);
    await old.call('state.speed=0;save(true);true');const original=await exported(old);
    assert.deepEqual(old.errors,[]);await old.context.close();
    const trial=await open(browser,process.env.RELEASE_GAME||path.join(__dirname,'../../releases/1.25.90/game.html'),process.env.MOBILE==='1',null);
    await trial.call("importSave(new File([JSON.stringify({...args,speed:0})],'review-ranch.json',{type:'application/json'}));true",original);
    await trial.page.waitForFunction(n=>inspectRanch('localStorage.getItem(SAVE_KEY)!==null && state.buildings.length')===n,original.buildings.length,{timeout:30000});
    await trial.page.reload();await trial.ready();
    const saved=await exported(trial);assert.deepEqual(progress(saved),progress(original));
    const rotations=await checkArt(trial);assert.equal(rotations,32);
    const features=await trial.call("(()=>{const result={};for(const kind of ['rugShop','maskStall','backStage']){result[kind]=[];for(let f=0;f<4;f++){const art=additionArt75(kind,f,0,null);const site={type:kind,cast75:state.catalog.friends[0]};const active=additionArt75(kind,f,1,site);const a=art.getContext('2d').getImageData(0,0,art.width,art.height).data,b=active.getContext('2d').getImageData(0,0,art.width,art.height).data;let changed=0,outside=0;for(let i=0;i<a.length;i+=4){if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]){changed++;if(a[i+3]<128)outside++;}}result[kind].push([changed,outside]);}}return result;})()");
    for(const dirs of Object.values(features))dirs.forEach(([changed,spill],i)=>{assert.equal(changed>0,i===0||i===3);assert.equal(spill,0);});
    assert.deepEqual(trial.errors,[]);await trial.context.close();
    const result={oldSaveBuildings:original.buildings.length,monsters:original.monsters.length,staff:original.staff.length,rotations,features};
    if(process.env.QA_OUTPUT)fs.writeFileSync(process.env.QA_OUTPUT,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
