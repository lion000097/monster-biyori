/* Run with Playwright installed: node tests/v1.25.66-town-facilities.cjs [old-save.json].
   CHROMIUM_PATH selects the browser. PREVIOUS_HTML adds a second legacy release to migration checks.
   Each scenario uses a private browser context. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const release = 'releases/1.25.66';
const marker = '})();\n</script>';

function gameChecks() {
  const verify = (v, label) => { if (!v) throw Error(label); };
  const equal = (a,b,label) => verify(JSON.stringify(a)===JSON.stringify(b),label);
  const near = (a,b,label) => verify(Math.abs(a-b)<1e-6,label+' '+a+' / '+b);
  const definitions = [
    ['snackDepot',9,2,1,0,true], ['forestSign',9,1,12,0,false],
    ['forestArchive',11,2,1,1,true], ['requestOffice',11,2,1,1,true],
    ['relicPolisher',12,2,1,1,true], ['crystalBowl',12,1,8,0,false],
    ['travelOutfitter',14,2,1,1,true], ['stargazerScope',14,1,5,0,false],
    ['treeGuesthouse',30,3,1,3,true], ['memorialGate',30,2,1,0,false]
  ];
  function snapshot() {
    const s=state;
    return [s.ranchName,s.coins,s.food,s.magic,s.stock,s.fame,s.villageLv,s.worldTreeLevel,s.villageXp,
      s.adventure.stage,s.adventure.clears,s.monsters.map(m=>[m.id,m.kind,m.shiny,m.lv,m.equipment,m.iv]),
      s.staff.map(w=>[w.id,w.name,w.job]),s.paths,s.stoneTiles,s.zones,s.materialSeen211,s.materialStock211,
      s.eggs,s.treasures,s.research,s.townPantry,s.reserveRareMaterials,
      s.buildings.map(b=>[b.id,b.type,b.level,b.facing,b.x,b.y,b.w,b.h,b.townBread,b.townTenants,
        b.requestSeconds,b.requestPending,b.requestsFilled,b.townSales,b.guesthouseUpkeep,b.townServed])];
  }
  function legacy() {
    state.starterGuide='done';state.speed=0;state.villageLv=state.worldTreeLevel=30;
    state.buildings.find(b=>b.type==='worldtree').level=30;state.zones=ZONES.map((_,i)=>i);
    state.coins=1234567;state.magic=1234;state.food=22222;state.townPantry=37;
    state.villageXp=321;state.adventure.stage=51;state.adventure.clears=50;
    state.buildings.push({id:state.nextId++,type:'bakery',x:-12,y:-13,w:2,h:2,facing:2,level:3,townBread:[0,1]});
    return save(true);
  }
  const x=-12,y=-13;
  function emptyPlot() {
    state.starterGuide='done';state.coins=1e7;state.magic=1e5;
    state.zones=ZONES.map((_,i)=>i);
    state.villageLv=state.worldTreeLevel=30;state.speed=0;state.hour=12;
    state.buildings=state.buildings.filter(b=>b.type==='worldtree');
    state.paths=[];state.stoneTiles={};state.ponds=[];state.guests=[];
    for(let i=x-2;i<=x+12;i++)for(let j=y-2;j<=y+8;j++){
      const k=keyXY(i,j);
      for(const arr of [state.clearedScenery,state.clearedPonds,state.removedDefaultPaths])if(!arr.includes(k))arr.push(k);
    }
    selectedBuilding=null;buildMode=null;moveMode=null;
  }
  async function plots() {
    const images=await Promise.all(definitions.map(async ([type])=>{
      const i=new Image();i.src='/assets/town-buildings/'+type+'.png';await i.decode();return i;
    }));
    for (const [index,[type,unlock,size,limit,seats,upgradeable]] of definitions.entries()) {
      const spec=townCatalog[type], sheet=images[index];
      equal([spec.unlock,spec.w,spec.h,spec.workSlots||0],[unlock,size,size,seats],'設備仕様 '+type);
      verify(facilityCountCap193(type,unlock-1)===0&&facilityCountCap193(type,unlock)===limit,'解放・設置上限 '+type);
      for(const lv of [unlock-1,unlock,30]){
        const gate=treeRequirements193(lv+1).find(r=>r.type===type);
        verify(!!gate===(upgradeable&&lv>=unlock)&&(!gate||gate.minLevel===3),'成長条件 '+type+'/'+lv);
      }
      const hashes=new Set();
      for(let f=0;f<4;f++){
        emptyPlot();
        const road=frontPoint(type,x,y,f,.5,.5).map(Math.floor);state.paths=[keyXY(...road)];
        tab='build';facilityRole=spec.role;renderUI(true);
        const option=document.querySelector('[data-action="build"][data-id="'+type+'"]');
        verify(option&&!option.disabled,'建築一覧 '+type);option.click();placementFacing=f;
        verify(buildMode===type&&canBuild(x,y,null,false,type,f),'一覧から新規建築 '+type+'/'+f);
        if(!upgradeable)putTerrain('stone',x,y);
        const coins=state.coins,price=constructionCost(type);
        place(type,x,y);const b=getBuildingAt(x,y);
        verify(b?.type===type&&b.facing===f&&coins-state.coins===price,'建築と料金 '+type+'/'+f);
        verify(getBuildingAt(x+size-1,y+size-1)===b&&!areaContains(b,x+size,y),'占有範囲 '+type);
        if(!upgradeable){
          verify(isPath(x,y)&&residentRoad(x,y),'先敷き '+type);
          putTerrain('roadErase',x,y);verify(!isPath(x,y),'道消し '+type);
          for(let k=0;k<size;k++){
            putTerrain('road',x+(f%2?k:0),y+(f%2?0:k));
            verify(residentRoad(x+(f%2?k:0),y+(f%2?0:k)),'装飾の下の通行 '+type);
          }
        }
        const c=spriteBuildingV161(type,1,f),n=size*64;
        verify(sheet.height===n&&c.width===n&&c.height===n,'原寸 '+type);
        const ref=document.createElement('canvas');ref.width=ref.height=n;
        ref.getContext('2d').drawImage(sheet,f*n,0,n,n,0,0,n,n);
        verify(ref.toDataURL()===c.toDataURL(),'ゲームの絵と原画 '+type+'/'+f);hashes.add(c.toDataURL());
        const rect=plotImageRect(b);mapPickItems.length=0;drawLot(b,f,1);
        const entry=mapPickItems.at(-1);
        verify(entry?.building===b&&entry.rect.x===rect.x&&entry.rect.y===rect.y,'マップ描画 '+type);
        const pixels=c.getContext('2d').getImageData(0,0,n,n).data;
        const corners=[[0,0],[size,0],[size,size],[0,size]].map(([i,j])=>projectGround(x+i,y+j));
        let picked=false;
        for(let col=0;col<n;col++){
          const px=rect.x+(col+.5)*rect.w/n;
          const heightAt=(a,b)=>a.y+(px-a.x)*(b.y-a.y)/(b.x-a.x);
          const bottom=px<corners[2].x?heightAt(corners[3],corners[2]):heightAt(corners[2],corners[1]);
          const top=px<corners[0].x?heightAt(corners[3],corners[0]):heightAt(corners[0],corners[1]);
          for(let row=0;row<n;row++){
            const py=rect.y+(row+.5)*rect.h/n,alpha=pixels[(row*n+col)*4+3];
            if(py>=bottom)verify(!alpha,'敷地の手前にはみ出す '+type+'/'+f);
            if(upgradeable&&py>=top&&py<bottom)verify(alpha===255,'敷地の接地面 '+type+'/'+f);
            if(alpha&&!picked)picked=pickMapActorOrFacility({px,py})?.building===b;
          }
        }
        verify(picked,'マップ上の施設を選択 '+type);
        if(['crystalBowl','stargazerScope','memorialGate'].includes(type)){
          verify(townBuildingArt(type,1,f,{night:true}).toDataURL()!==c.toDataURL(),'夜の灯り '+type+'/'+f);
        }
        const nx=x+7,door=frontPoint(type,nx,y,f,.5,.5).map(Math.floor);
        state.paths.push(keyXY(...door));startMoving(b.id);placementFacing=f;moveBuilding(nx,y);
        verify(b.x===nx&&b.y===y&&getBuildingAt(nx,y)===b,'移設 '+type+'/'+f);
        if(f===0){
          if(unlock<30){
            state.villageLv=unlock;
            const target=treeBulkUpgradePlan1255().targets.find(t=>t.building===b);
            verify(upgradeable?target?.end===3:!target,'一括強化の対象と上限 '+type);
            state.villageLv=30;
          }
          const funds=state.coins;
          if(upgradeable){
            const cost=costUpgrade(b);upgrade(b.id);verify(b.level===2&&state.coins===funds-cost,'単体強化 '+type);
            upgrade(b.id);
          }
          const last=state.coins;upgrade(b.id);
          verify(b.level===(upgradeable?3:1)&&state.coins===last,'強化上限 '+type);
        }
      }
      verify(hashes.size===4,'異なる4方向 '+type);
    }
    return definitions.length*4;
  }
  function workplace(type,level=3) {
    emptyPlot();state.staff=[];
    const meta=B[type],site={id:state.nextId++,x,y,w:meta.w,h:meta.h,type,level,facing:0};
    state.buildings.push(site);
    const door=frontPoint(type,x,y,0,.5,.5).map(Math.floor);
    state.paths.push(keyXY(...door));
    return {site,door};
  }
  function staffSite(site,door,count) {
    state.staff=Array.from({length:count},()=>makeStaff(state.nextId++,'sell',door[0],door[1]));
    refreshDuty12543(2);
    for(const worker of state.staff){
      verify(dutyByWorker12543.get(worker)===site&&startDuty12543(worker),'自動で勤務先を選択 '+site.type);
      beginStaffWork212(worker,site);
    }
    for(let i=0;i<180&&townStaffOnDuty(site)<count;i++)progressStaffWork212(.1);
    verify(townStaffOnDuty(site)===count,'勤務場所に到着 '+site.type);
  }
  function supports() {
    let {site,door}=workplace('snackDepot');
    const base=foodStorageCapacity(state,0);
    for(const [lv,p] of [[1,10],[2,15],[3,20]]){site.level=lv;near(foodStorageCapacity(),Math.round(base*(1+p/100)),'ごはん保存上限');}
    state.food=base*3;state.townPantry=21;const held=state.food;
    gainFood(80);verify(state.food===held&&state.townPantry===21,'旧セーブの超過在庫を保持');
    state.food=foodStorageCapacity()-22;near(gainFood(9),1,'新規の保存量');
    state.buildings.push({id:state.nextId++,type:'kitchenGarden',level:3,x:x+5,y,w:2,h:3,facing:0});
    state.food=0;state.townPantry=0;
    state.staff.push(makeStaff(state.nextId++,'sell',x,y));
    const daily=24*residentFoodPerHour12556(state.monsters.length,state.staff.length)+3*MONSTER_BREAKFAST_FOOD_12556*state.monsters.length;
    state.townPantry=daily;townHarvest(0);verify(state.townPantry>daily,'菜園の食事用取り置き');
    for(let i=0;i<200;i++)townHarvest(0);
    near(state.townPantry,daily*1.2,'取り置きの上限');
    ({site,door}=workplace('forestArchive'));state.buildings.push({id:state.nextId++,type:'lab',level:1,x:x+5,y});
    const rank=state.research.farm,original=researchCost('farm',rank);
    staffSite(site,door,1);
    for(const [i,p] of [3,5,7].entries()){
      site.level=i+1;const cost=researchCost('farm',rank);
      equal([cost.magic,cost.coins],[Math.round(original.magic*(1-p/100)),Math.round(original.coins*(1-p/100))],'両研究費の割引');
    }
    const paid=researchCost('farm',rank),funds=state.coins,magic=state.magic;doResearch('farm');
    near(funds-state.coins,paid.coins,'研究の支払額');near(magic-state.magic,paid.magic,'研究のキラキラ');verify(state.research.farm===rank+1,'研究実行');
    ({site,door}=workplace('relicPolisher'));
    const item=TREASURE_ITEMS.findIndex(t=>t&&!isBossRelic(t)),boss=TREASURE_ITEMS.findIndex(t=>t&&isBossRelic(t));
    recordTreasure(item);recordTreasure(boss);
    state.buildings.push({id:state.nextId++,type:'treasureMuseum213',level:1,exhibits213:[item],x:x+4,y},
      {id:state.nextId++,type:'relicStand',level:2,relic:boss,x:x+8,y});
    const appeal=museumAppeal213();verify(appeal===(APPEAL213[TREASURE_ITEMS[item].rarity]||1)+3,'展示館と展示台');
    staffSite(site,door,1);for(const [i,p] of [5,8,10].entries()){
      site.level=i+1;near(museumAppeal213(),appeal*(1+p/100),'展示人気度');
    }
    ({site,door}=workplace('travelOutfitter'));const rate=timedExpeditionRate(),reward=expeditionReward(0);
    staffSite(site,door,1);
    for(const [i,p] of [3,5,7].entries()){site.level=i+1;near(timedExpeditionRate(),rate/(1-p/100),'遠征の所要時間');}
    state.buildings.push({id:state.nextId++,type:'expeditionOffice',level:1,x:x+5,y,w:2,h:2});
    state.expeditionAuto213=true;state.exploreProgress=0;state.speed=1;advanceExpeditionClock(2);
    near(state.exploreProgress,2*rate/.93,'自動遠征の実進行');equal(expeditionReward(0),reward,'遠征報酬');
  }
  function requests() {
    const {site,door}=workplace('requestOffice');
    for(const [i,minutes] of [60,45,30].entries()){
      site.level=i+1;site.requestSeconds=0;delete site.requestPending;
      state.speed=0;advanceRequestClock(300);near(site.requestSeconds,0,'一時停止');
      state.speed=1;advanceRequestClock(minutes*60-4);verify(!site.requestPending,'お願いの到着前');
      state.speed=4;advanceRequestClock(1);verify(!!site.requestPending&&site.requestSeconds===0,'お願いの到着 '+minutes+'分');
    }
    state.food=0;state.townPantry=97;site.requestPending={food:true,qty:4};staffSite(site,door,1);
    verify(!deliverTravelerRequest(site)&&state.townPantry===97,'取り置きごはんを保護');
    state.food=5;const m=state.magic,c=state.coins,f=state.fame;
    verify(deliverTravelerRequest(site)&&state.food===1&&state.townPantry===97&&state.magic===m+2&&state.fame>f&&state.coins===c,'お願いのお礼・食事');
    ensureMaterials211();
    for(const keep of [false,true])for(const rank of ['SSR','UR']){
      const id=MATERIALS211.findIndex(row=>row[3]===rank);state.reserveRareMaterials=keep;state.materialStock211[id]=2;
      site.requestPending={id,qty:1};verify(!deliverTravelerRequest(site)&&state.materialStock211[id]===2,'保護する素材 '+rank);
    }
    const id=MATERIALS211.findIndex(row=>row[3]==='N');state.materialStock211[id]=3;
    site.requestPending={id,qty:2};verify(deliverTravelerRequest(site)&&state.materialStock211[id]===1&&site.requestsFilled===2,'指定した通常素材だけ納品');
  }
  function guesthouse() {
    for (const count of [1,2,3]){
      const {site,door}=workplace('treeGuesthouse');const guest={rare211:true,entered211:true,phase212:'leave'};
      verify(!townServeGuest(site,guest),'勤務なし');staffSite(site,door,count);
      verify(!townActorAvailable({entered211:true,phase212:'leave'},'guest',site)&&townActorAvailable(guest,'guest',site),'特別な旅人の入場');
      verify(!townServeGuest(site,{rare211:false})&&!townServeGuest(site,{rare211:true,scenic12549:true}),'通常客と散策客を対象外にする');
      state.food=count;verify(!townServeGuest(site,guest),'ごはん不足');
      state.food=20;const funds=state.coins,fame=state.fame,exp=state.economy.expense;
      const gross=guesthouseSale(3,count);verify(townServeGuest(site,guest),'接客 '+count+'人');
      near(state.coins-funds,gross*.25,'手取り');near(state.economy.expense-exp,gross*.75,'維持費を経費に計上');
      verify(state.food===20-1-count&&state.fame>fame&&site.guesthouseUpkeep===gross*.75&&site.townSales===gross&&site.townServed===1,'迎賓館の会計');
      verify(!townServeGuest(site,guest)&&site.townServed===1,'同じ客の二重精算を防止');
    }
  }
  function saveNew() {
    emptyPlot();state.speed=0;
    definitions.forEach(([type,,size,,,up],i)=>{
      const b={id:state.nextId++,type,x:x+i%5*5,y:y+Math.floor(i/5)*6,w:size,h:size,facing:i%4,level:up?3:1};
      if(type==='requestOffice')Object.assign(b,{requestPending:{food:true,qty:4},requestSeconds:79.25,requestsFilled:2});
      if(type==='treeGuesthouse')Object.assign(b,{townSales:256,guesthouseUpkeep:192,townServed:1});
      state.buildings.push(b);
    });
    return save(true);
  }
  return {ready:()=>!!(facilitySheetReady&&villageSheetReady&&treeDecorationReady&&colorIndices&&lionReady),
    snapshot,legacy,save:()=>save(true),plots,supports,requests,guesthouse,saveNew};
}
const injection='window.facilityQA=('+gameChecks.toString()+')();\n';
const instrument=s=>{
  assert(s.indexOf(marker)>=0);
  return s.replace(marker,()=>injection+marker);
};
async function main(){
  const old=fs.readFileSync(path.join(root,'releases/1.25.64/game.html'),'utf8');
  const web=fs.readFileSync(path.join(root,'game.html'),'utf8');
  const lite=fs.readFileSync(path.join(root,release,'launcher-game.html'),'utf8');
  const sources={'/old':old,'/new':web};
  if(process.env.PREVIOUS_HTML)sources['/previous']=fs.readFileSync(process.env.PREVIOUS_HTML,'utf8');
  const server=http.createServer((req,res)=>{
    const p=new URL(req.url,'http://localhost').pathname;
    if(p==='/lite'||Object.hasOwn(sources,p)){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(p==='/lite'?lite:instrument(sources[p]));}
    if(p==='/blank'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>Save import</title>');}
    if(/^\/assets\/town-buildings\/[A-Za-z0-9]+\.png$/.test(p)){res.setHeader('Content-Type','image/png');return fs.createReadStream(path.join(root,p)).pipe(res);}
    res.writeHead(404);res.end();
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
  try{
    const external=process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):null;
    for(const [width,target] of [[1280,'new'],[390,'new'],[1280,'lite'],[390,'lite']]){
      const context=await browser.newContext({viewport:{width,height:850},hasTouch:width===390});
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(({injection,marker})=>{
        window.requestAnimationFrame=()=>0;window.confirm=()=>true;
        const write=document.write.bind(document);
        document.write=(...parts)=>write(...parts.map(s=>typeof s==='string'?s.replace(marker,()=>injection+marker):s));
      },{injection,marker});
      const open=async name=>{await page.goto(url+'/'+name);await page.waitForFunction(()=>window.facilityQA?.ready(),{},{timeout:30000});};
      const qa=(method)=>page.evaluate(m=>window.facilityQA[m](),method);
      await open('old');assert(await qa('legacy'));await open('old');
      const before=await qa('snapshot');await open(target);assert.deepEqual(await qa('snapshot'),before);
      assert(await qa('save'));await open(target);assert.deepEqual(await qa('snapshot'),before);
      assert.equal(await qa('plots'),40);await qa('supports');await qa('requests');await qa('guesthouse');
      assert(await qa('saveNew'));const fresh=await qa('snapshot');await open(target);assert.deepEqual(await qa('snapshot'),fresh);
      if(external){
        await page.goto(url+'/blank');
        await page.evaluate(s=>localStorage.setItem('monster_biyori_guarded_save_v1',s),external);
        await open('old');const original=await qa('snapshot'),fixture=JSON.parse(external);
        assert.equal(original.at(-1).length,fixture.buildings.length);assert.equal(original[0],fixture.ranchName);
        assert(await qa('save'));await open(target);
        assert.deepEqual(await qa('snapshot'),original);assert(await qa('save'));await open(target);assert.deepEqual(await qa('snapshot'),original);
      }
      if(sources['/previous']){
        await page.goto(url+'/blank');await page.evaluate(()=>localStorage.clear());
        await open('previous');assert(await qa('legacy'));await open('previous');const prior=await qa('snapshot');
        await open(target);assert.deepEqual(await qa('snapshot'),prior);assert(await qa('save'));
        await open(target);assert.deepEqual(await qa('snapshot'),prior);
      }
      assert.deepEqual(errors,[]);console.log('PASS',width,target,'40 views, placement, upgrades, duty, economy, save round trips');await context.close();
    }
  }finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
