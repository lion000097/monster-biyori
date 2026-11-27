'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = process.env.TOWN_ART_ROOT || path.join(__dirname, '..');
const baselineVersion = process.env.TOWN_ART_BASE || '1.25.75';
const testedVersion = process.env.TOWN_ART_VERSION || '1.25.76';
const marker = 'claimSave12556();\nconst didLoad=load();';
const origin = 'https://town-art.test/';

function checks(){
  const entries=Object.entries(villageAdditions75),x=-12,y=-13;
  function hash(canvas){
    const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let result=2166136261;
    for(const byte of data)result=Math.imul(result^byte,16777619);
    return (result>>>0).toString(16);
  }
  function sprites(geometry){
    const hashes={},issues=[];
    for(const [type,s] of entries){
      hashes[type]=[];
      for(let f=0;f<4;f++){
        const sprite=spriteBuildingV161(type,1,f),size=(s.w+s.h)*32,site={type,id:801,x,y,level:1,facing:f};
        if(sprite.width!==size||sprite.height!==size)issues.push(type+' size');
        hashes[type].push(hash(sprite));
        if(!geometry)continue;
        const map=townMapArt(site,f,true,0);
        if(hash(map)!==hashes[type][f])issues.push(type+' preview');
        const rgba=sprite.getContext('2d').getImageData(0,0,size,size).data;
        const W=(f%2?s.h:s.w)*16,H=(f%2?s.w:s.h)*16;
        let colored=0,holes=0,bleed=0,translucent=0,clearFloor=0;
        for(let row=0;row<size;row++)for(let col=0;col<size;col++){
          const a=rgba[(row*size+col)*4+3];
          const bottom=size-1-Math.abs(col-2*W)/2,top=size/2-1+Math.abs(col-2*H)/2;
          if(a){colored++;if(a!==255)translucent++;if(row>bottom+1)bleed++;}
          else if(row>top+1&&row<bottom-1){holes++;clearFloor++;}
        }
        if(colored<28||translucent||bleed||(s.role==='decor'?clearFloor<10:holes>0))
          issues.push([type,f,colored,translucent,bleed,holes].join('/'));
      }
      if(geometry&&new Set(hashes[type]).size!==4)issues.push(type+' indistinguishable directions');
    }
    const clock=[state.hour,tickAccum];state.hour=9;tickAccum=0;
    const reference=Object.keys(townAtlases).map(type=>[type,hash(spriteBuildingV161(type,1,0))]);
    [state.hour,tickAccum]=clock;
    return {hashes,issues,reference,specs:JSON.stringify(villageAdditions75)};
  }
  function legacy(){
    state.starterGuide='done';state.speed=0;state.villageLv=state.worldTreeLevel=30;
    state.buildings.find(b=>b.type==='worldtree').level=30;
    state.coins=123456;state.food=173;state.townPantry=7;state.zones=ZONES.map((_,i)=>i);
    const home=state.buildings.find(b=>b.type==='home');
    state.buildings.push({id:state.nextId++,type:'amberShelf',level:1,x:home.x+8,y:home.y+8,w:1,h:2,facing:1,material75:0});
    if(!state.materialSeen211.includes(0))state.materialSeen211.push(0);
    if(!save(true))throw Error('Could not create old ranch');
    return snapshot();
  }
  function snapshot(){
    const b=state.buildings.find(b=>b.type==='amberShelf');
    return [state.ranchName,state.villageLv,state.coins,state.townPantry,state.food,b?.id,b?.type,b?.facing,b?.material75,
      state.catalog.friends,state.equipmentBag,state.buildings.map(b=>[b.id,b.type,b.x,b.y,b.level,b.facing??0])];
  }
  function phases(){
    const expected={
      eggWatch:1,starDial:1,birdClock:1,acornLamp:3,jarHut:1,crystalHanger:1,fossilSand:1,butterflyPool:1,seedSwap:2,
      returnBell:2,windSock:1,openGallery:1,paintSink:1,pawStamp:1,rainHarp:1,umbrellaHut:1,leafGutter:1,mossPath:1,
      spiritChime:3,grainMill:1,breadShelf:1,laundry:1,starLine:1,scarecrow:1,pickingBaskets:2,routeMap:15,
      birdScore:1,traderTent:1,rugShop:2,pondWindow:1,lanternLine:3,moonBasin:3,menuWindow:1
    };
    const silent=[];
    for(const [type,phase] of Object.entries(expected)){
      if(![0,1,2,3].some(f=>hash(additionArt75(type,f,0))!==hash(additionArt75(type,f,phase))))silent.push(type);
    }
    const displaySite={type:'amberShelf',x,y,id:801,facing:0,material75:0};
    const change=(type,a,b)=>[0,1,2,3].some(f=>hash(additionArt75(type,f,0,a))!==hash(additionArt75(type,f,0,b)));
    if(!change('amberShelf',displaySite,{...displaySite,material75:null}))silent.push('selected material');
    if(!change('openGallery',{picture75:1},{picture75:2}))silent.push('selected picture');
    if(!change('starChart',{chart75:1},{chart75:2}))silent.push('star chart');
    const eggs=state.eggs;state.eggs=[{shiny:false,time:1,need:2}];
    const normal=[0,1,2,3].map(f=>hash(additionArt75('eggWatch',f,1,{})));state.eggs[0].shiny=true;
    if(![0,1,2,3].some(f=>normal[f]!==hash(additionArt75('eggWatch',f,1,{}))))silent.push('shiny egg');
    state.eggs=eggs;return {silent,total:Object.keys(expected).length};
  }
  function placements(){
    const done=[];
    for(const [type,f] of [['eggWatch',2],['shellChannel',1],['freight',3],['acornLamp',0]]){
      state=initial();state.speed=0;state.starterGuide='done';state.villageLv=state.worldTreeLevel=30;state.coins=1e6;state.magic=4000;
      state.zones=ZONES.map((_,i)=>i);state.buildings=state.buildings.filter(b=>b.type==='worldtree');state.paths=[];state.stoneTiles={};state.ponds=[];
      for(let i=x-2;i<x+8;i++)for(let j=y-2;j<y+8;j++){const key=keyXY(i,j);for(const list of [state.clearedScenery,state.clearedPonds,state.removedDefaultPaths])if(!list.includes(key))list.push(key);}
      buildMode=null;moveMode=null;selectedBuilding=null;clearMode=false;terrainMode=null;placementFacing=0;
      const s=villageAdditions75[type],door=frontPoint(type,x,y,f,.5,.5).map(Math.floor);
      state.paths.push(keyXY(...door));tab='build';facilityRole=s.role;renderUI(true);
      const option=document.querySelector('[data-action="build"][data-id="'+type+'"]');
      if(!option||option.disabled)throw Error('Build menu '+type);option.click();
      setFacilityFacing(facingSelection(),f);
      putTerrain('stone',x,y);
      if(!isPath(x,y)||canBuild(x,y,null,false,type,f)!==(s.role==='decor'))throw Error('Road under '+type);
      if(s.role!=='decor')putTerrain('roadErase',x,y);
      const coins=state.coins;place(type,x,y);const b=getBuildingAt(x,y);
      if(b?.type!==type||b.facing!==f||coins-state.coins!==s.cost)throw Error('Placement '+type);
      if(s.role==='decor'&&!residentRoad(x,y))throw Error('Road after placement '+type);
      mapPickItems.length=0;drawLot(b,f,1);
      if(!mapPickItems.some(item=>item.building===b))throw Error('Not drawn on map '+type);
      done.push(type);
    }
    return done;
  }
  return {sprites,legacy,snapshot,phases,placements,ready:()=>facilitySheetReady&&exhibitMaterialSheet75.complete&&!!exhibitMaterialSheet75.naturalWidth};
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  try{
    const hook='window.townArtCheck=('+checks.toString()+')();\n';
    let oldArt,webPaint;
    for(const compact of [false,true]){
      const context=await browser.newContext({viewport:{width:compact?390:1120,height:816}}),page=await context.newPage(),errors=[];
      await page.addInitScript(({marker,hook})=>{
        const write=Document.prototype.write;Document.prototype.write=function(...parts){return write.apply(this,parts.map(s=>typeof s==='string'?s.replace(marker,()=>hook+marker):s));};
      },{marker,hook});
      page.on('pageerror',e=>errors.push(String(e)));
      await page.route('**/*',async route=>{
        const url=route.request().url();if(![origin+'old',origin+'new'].includes(url))return route.abort();
        const old=url.endsWith('/old');
        const file=old?`releases/${baselineVersion}/game.html`:compact?`releases/${testedVersion}/launcher-game.html`:'game.html';
        const html=fs.readFileSync(path.join(root,file),'utf8');
        await route.fulfill({contentType:'text/html; charset=utf-8',body:compact&&!old?html:html.replace(marker,()=>hook+marker)});
      });
      await page.goto(origin+'old');await page.waitForFunction(()=>window.townArtCheck);
      const original=await page.evaluate(()=>townArtCheck.legacy());
      if(!oldArt)oldArt=await page.evaluate(()=>townArtCheck.sprites(false));
      await page.goto(origin+'new');await page.waitForFunction(()=>window.townArtCheck?.ready(),{},{timeout:50000});
      assert.deepEqual(await page.evaluate(()=>townArtCheck.snapshot()),original);
      const result=await page.evaluate(()=>townArtCheck.sprites(true));
      if(!compact)webPaint=result.hashes;
      else if(testedVersion.localeCompare('1.25.77','en',{numeric:true})>=0)assert.deepEqual(result.hashes,webPaint);
      assert.deepEqual(result.issues,[]);assert.equal(result.specs,oldArt.specs);assert.deepEqual(result.reference,oldArt.reference);
      const names=Object.keys(result.hashes);assert.equal(names.length,73);
      for(const id of names)for(let f=0;f<4;f++)assert.notEqual(result.hashes[id][f],oldArt.hashes[id][f],id+'/'+f);
      const phases=await page.evaluate(()=>townArtCheck.phases());assert.deepEqual(phases.silent,[]);
      await page.reload();await page.waitForFunction(()=>window.townArtCheck?.ready());assert.deepEqual(await page.evaluate(()=>townArtCheck.snapshot()),original);
      const placed=await page.evaluate(()=>townArtCheck.placements());assert.equal(placed.length,4);assert.deepEqual(errors,[]);
      console.log((compact?'launcher 390px':'web 1120px')+': all 292 replacements, 33 references, '+phases.total+' phase changes, exhibits, saved ranch and four footprint sizes passed');
      await context.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
