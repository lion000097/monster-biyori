// Run with Playwright. Optional argument: an exported ranch JSON to compare across releases.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const root = path.join(__dirname, '..');
const marker = '})();\n</script>';

function ranchChecks() {
  const x=-12, y=-13;
  const specs = [
    ['jobOffice',4,2,1,650,0],['forestClock',8,2,2,960,0],
    ['monsterPlayPlaza',10,4,3,2400,12],['travelerRestPlaza',13,3,3,2100,6]
  ];
  const check=(ok,label)=>{if(!ok)throw Error(label);};
  function reset() {
    state=initial();state.speed=0;state.hour=11;state.starterGuide='done';
    state.villageLv=state.worldTreeLevel=30;state.coins=1e6;state.magic=4000;state.food=10;
    state.zones=ZONES.map((_,i)=>i);state.buildings=state.buildings.filter(b=>b.type==='worldtree');
    state.paths=[];state.stoneTiles={};state.ponds=[];state.guests=[];state.staff=[];state.monsters=[];
    for(let i=x-2;i<=x+16;i++)for(let j=y-2;j<=y+12;j++){
      const k=keyXY(i,j);
      for(const a of [state.clearedScenery,state.clearedPonds,state.removedDefaultPaths])if(!a.includes(k))a.push(k);
    }
    selectedBuilding=null;moveMode=null;buildMode=null;placementFacing=0;tickAccum=0;
  }
  function site(type,sx=x,sy=y,face=0) {
    const {w,h}=buildingMeta(type,face);
    const b={id:state.nextId++,type,level:1,x:sx,y:sy,w,h,facing:face};
    state.buildings.push(b);
    const door=frontPoint(type,sx,sy,face,.5,.5).map(Math.floor);
    state.paths.push(keyXY(...door));return {b,door};
  }
  function legacy(){
    state.starterGuide='done';state.speed=0;state.villageLv=state.worldTreeLevel=30;
    state.buildings.find(b=>b.type==='worldtree').level=30;
    state.coins=123456;state.food=130;state.townPantry=9;state.magic=568;state.villageXp=339;
    state.zones=ZONES.map((_,i)=>i);
    const {b}=site('requestOffice');b.level=3;b.requestPending={food:true,qty:5};b.requestSeconds=14;
    return save(true);
  }
  function snapshot(){
    return [state.ranchName,state.villageLv,state.worldTreeLevel,state.villageXp,state.coins,state.food,state.magic,state.townPantry,
      state.adventure.stage,state.adventure.clears,state.equipmentBag,state.treasures,state.eggs,state.research,
      state.materialStock211,state.zones,state.paths,state.stoneTiles,
      state.staff.map(w=>[w.id,w.name,w.job,w.mastery]),state.monsters.map(m=>[m.id,m.kind,m.lv,m.iv,m.equipment,m.shiny]),
      state.buildings.map(b=>[b.id,b.type,b.level,b.x,b.y,b.w,b.h,b.facing,b.townUnpaid,b.requestPending,b.requestSeconds])];
  }
  function saveNew(){
    state.speed=0;state.starterGuide='done';
    specs.forEach(([type],i)=>{const {b}=site(type,x+(i%2)*7,y+Math.floor(i/2)*6,i);if(B[type].upkeep)b.townUnpaid=3;});
    return save(true);
  }
  function ready(){return !!(villageSheetReady&&facilitySheetReady&&treeDecorationReady&&lionReady&&colorIndices);}
  function plots(){
    for(const [type,unlock,n,limit,cost,upkeep] of specs){
      const spec=townCatalog[type];check(spec.unlock===unlock&&spec.w===n&&spec.h===n&&spec.cost===cost&&(spec.upkeep||0)===upkeep,type+' 仕様');
      const native=new Set();
      for(let level=1;level<=30;level++){
        check(facilityCountCap193(type,level)===(level<unlock?0:limit),type+' 設置枠');
        const r=treeRequirements193(level+1).find(r=>r.type===type);
        check(type==='jobOffice'&&level===4?r?.count===1&&r.minLevel===1:!r,type+' 世界樹'+level);
      }
      for(let face=0;face<4;face++){
        reset();state.villageLv=unlock;const door=frontPoint(type,x,y,face,.5,.5).map(Math.floor);
        state.paths.push(keyXY(...door));tab='build';facilityRole=spec.role;renderUI(true);
        const button=document.querySelector('[data-action="build"][data-id="'+type+'"]');
        check(button&&!button.disabled,type+' 建築ボタン');button.click();placementFacing=face;
        const tower=type==='forestClock';
        putTerrain('stone',x,y);check(isPath(x,y),type+' 先敷き検査の道');
        check(canBuild(x,y,null,false,type,face)===tower,type+' 道との重なり');
        if(!tower)putTerrain('roadErase',x,y);
        const before=state.coins;place(type,x,y);const b=getBuildingAt(x,y);
        check(b?.type===type&&b.facing===face&&before-state.coins===cost,type+' 設置と料金');
        check(getBuildingAt(x+n-1,y+n-1)===b&&getBuildingAt(x+n,y+n-1)!==b,type+' 敷地');
        if(tower){
          check(residentRoad(x,y),'塔を道の上に設置');putTerrain('roadErase',x,y);
          for(let i=0;i<n;i++)for(let j=0;j<n;j++){
            putTerrain('road',x+i,y+j);check(residentRoad(x+i,y+j),'塔の下の後敷きと通行');
          }
        }
        const base=townNativeFrame(type,face).canvas,art=spriteBuildingV161(type,1,face),s=n*64;
        native.add(base.toDataURL());check(art.width===s&&art.height===s,type+' 原寸');
        const rgba=base.getContext('2d').getImageData(0,0,s,s).data;
        for(let col=0;col<s;col++)for(let row=s/2;row<s;row++){
          const side=Math.abs(col+.5-s/2)/2,top=s/2+side,bottom=s-side;
          const alpha=rgba[(row*s+col)*4+3];
          if(row+.5>=bottom)check(!alpha,type+' 手前の道にはみ出す');
          if(!tower&&row+.5>=top&&row+.5<bottom)check(alpha===255,type+' 接地にすき間');
        }
        mapPickItems.length=0;drawLot(b,face,1);
        const entry=mapPickItems.at(-1);check(entry?.building===b,type+' 地図に描画');
        const rect=entry.rect;check(pickMapActorOrFacility({px:rect.x+rect.w/2,py:rect.y+rect.h*.77})?.building===b,type+' 地図で選択');
        const nx=x+7,road=frontPoint(type,nx,y,face,.5,.5).map(Math.floor);
        state.paths.push(keyXY(...road));startMoving(b.id);placementFacing=face;moveBuilding(nx,y);
        check(b.x===nx&&b.y===y,type+' 移設');
        const funds=state.coins;upgrade(b.id);check(b.level===1&&funds===state.coins,type+' 強化なし');
        check(!treeBulkUpgradePlan1255().targets.some(t=>t.building===b),type+' 一括強化');
        if(type==='jobOffice')check(treeRequirementStatus193(5).find(r=>r.type===type).ok,'Lv5条件達成');
        for(let i=1;i<limit;i++)state.buildings.push({...b,id:state.nextId++,x:x+2*i,y:y+7});
        renderUI(true);check(document.querySelector('[data-action="build"][data-id="'+type+'"]').disabled,type+' 上限到達');
      }
      check(native.size===4,type+' 向きの違い');
    }
  }
  function clock(){
    reset();
    for(let f=0;f<4;f++){
      function hands(hour,frac){
        state.hour=hour;tickAccum=frac;
        const c=townMapArt({type:'forestClock',id:6},f,false,0),g=c.getContext('2d');
        return [[48,57],[80,56]].map(([x,y])=>Array.from(g.getImageData(x-12,y-12,24,24).data).join(','));
      }
      const noon=hands(12,0),quarter=hands(12,.25),three=hands(15,.25),again=hands(15,.25);
      for(let j=0;j<2;j++)check(noon[j]!==quarter[j]&&quarter[j]!==three[j]&&three[j]===again[j],'時計の時針・分針・停止 '+f);
    }
  }
  function jobs(){
    reset();state.speed=1;
    const farm=site('farm'),worker=makeStaff(701,'study',...farm.door);
    state.paths.push(keyXY(farm.door[0]+1,farm.door[1]));
    state.staff=[worker];planStaffActivity(worker);
    check(!worker.jobTarget211,'紹介所を建てる前');worker.path=[];
    const office=site('jobOffice',x+4);site('lab',x+10);
    refreshDuty12543(1);planStaffActivity(worker);
    check(worker.job==='study'&&worker.jobTarget211?.id===farm.b.id&&worker.jobTarget211?.referralJob==='gather','空き仕事を紹介');
    const helper=makeStaff(702,'study',...farm.door);state.staff.push(helper);planStaffActivity(helper);
    check(!helper.jobTarget211,'二重紹介・未接続の研究所を除外');
    const food=state.food;
    for(let i=0;i<160&&worker.work===0;i++)stepActors(.10);
    check(worker.work===1&&worker.job==='study'&&worker.mastery.gather===3&&state.food>food,'応援先で収穫・熟練度');
    state.buildings=state.buildings.filter(b=>b!==office.b);
    helper.path=[];helper.jobTarget211=null;planStaffActivity(helper);
    check(!helper.jobTarget211,'撤去後は紹介停止');
    reset();state.speed=1;site('jobOffice',x+5);const archive=site('forestArchive');
    const busy=makeStaff(711,'sell',...archive.door),free=makeStaff(712,'keeper',...archive.door);
    busy.jobTarget211={id:999,job:'sell',goal:archive.door};
    state.staff=[busy,free];refreshDuty12543(1);planStaffActivity(free);
    check(free.jobTarget211?.tradeDuty12543&&free.jobTarget211.id===archive.b.id&&busy.jobTarget211.id===999,'勤務中の市民を動かさず施設の空き枠を補う');
    for(let i=0;i<80&&!townStaffOnDuty(archive.b);i++)stepActors(.1);
    check(townStaffOnDuty(archive.b)===1,'施設の応援勤務');

  }
  function scenes(){
    for(let f=0;f<4;f++){
      reset();state.speed=1;const {b,door}=site('monsterPlayPlaza',x,y,f);
      const make=(id,kind)=>makeMonster(id,kind,...door);
      state.monsters=[make(501,0)];
      for(let i=0;i<80;i++)stepTownScenes(.1);
      check(!townSceneState(b).members.length,'ひとりで追いかけっこを開始しない');
      state.monsters.push(make(502,1),make(503,2));
      let frames=0,started=false,exited=false;const positions=new Set();
      for(let i=0;i<480;i++){
        stepTownScenes(.1);const v=townSceneState(b);
        if(v.running&&v.members.every(m=>m.phase==='use')){
          started=true;frames++;
          for(const m of v.members)check(areaContains(b,m.actor.x+.5,m.actor.y+.5)&&townIsCourtyard(m.walk,m.actor.x+.5,m.actor.y+.5),'仲間が敷地内にいる');
          const actor=v.members[0].actor;positions.add(Math.round(actor.x*10)+','+Math.round(actor.y*10));
        }
        if(started&&!v.members.length){exited=true;break;}
      }
      check(frames>90&&positions.size>30&&exited,'集まって走り、退出 '+f);
      check(state.monsters.every(m=>residentRoad(Math.round(m.x),Math.round(m.y))&&!plotWalks.has(m)),'仲間が道に戻る');
      reset();state.speed=1;const rest=site('travelerRestPlaza',x,y,f);
      const traveler=id=>({id,name:'旅人',x:rest.door[0],y:rest.door[1],entered211:true,arrived211:true,phase212:'leave',route212:[],life:20});
      state.guests=[traveler(801)];
      for(let i=0;i<85;i++)stepTownScenes(.1);
      const v=townSceneState(rest.b);check(v.members.some(m=>m.phase==='use'),'最初の旅人が休憩');
      state.guests.push(traveler(802),traveler(803));
      let together=false,left=false;
      for(let i=0;i<350;i++){
        stepTownScenes(.1);
        const seated=v.members.filter(m=>m.phase==='use');
        if(seated.length>=2){
          together=true;
          for(const m of seated)check(townMemberPose(m.actor,36).seated&&areaContains(rest.b,m.actor.x+.5,m.actor.y+.5),'旅人が敷地内の席で休む');
          check(new Set(seated.map(m=>m.slot)).size===seated.length,'席の重複');
        }
        if(together&&!v.members.length){left=true;break;}
      }
      check(together&&left&&state.guests.every(g=>g.phase212==='leave'),'遅れてきた旅人と集合・帰路 '+f);
    }
    reset();const a=site('travelerRestPlaza').b,b=site('monsterPlayPlaza',x+5).b;
    state.hour=0;state.coins=5;townHour(true);
    check(a.townUnpaid===1&&b.townUnpaid===12&&state.coins===0&&!townHoursAllow(b),'維持費不足');
    state.hour=1;state.coins=20;townHour(true);
    check(!a.townUnpaid&&!b.townUnpaid&&state.coins===7&&townHoursAllow(b),'未払い精算');
  }
  return {ready,legacy,snapshot,plots,clock,jobs,scenes,saveNew,save:()=>save(true)};
}

async function main(){
  const inject='window.communityQA=('+ranchChecks.toString()+')();\n';
  const web=fs.readFileSync(path.join(root,'game.html'),'utf8');
  const lite=fs.readFileSync(path.join(root,'releases/1.25.67/launcher-game.html'),'utf8');
  const old=fs.readFileSync(path.join(root,'releases/1.25.66/game.html'),'utf8');
  const origin='https://ranch.test';
  const oldSave=process.argv[2]&&fs.readFileSync(process.argv[2],'utf8');
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
  try{
    for(const [width,edition] of [[390,'web'],[1280,'web'],[390,'lite'],[1280,'lite']]){
      const ctx=await browser.newContext({viewport:{width,height:850},hasTouch:width===390});
      await ctx.route('**/*',async route=>{
        const url=new URL(route.request().url()),p=url.pathname.slice(1);
        const pages={web,old,lite,blank:'<!DOCTYPE html><title>Import</title>'};
        if(url.origin!==origin||!(p in pages))return route.abort();
        return route.fulfill({contentType:'text/html; charset=utf-8',body:p==='lite'?lite:pages[p].replace(marker,()=>inject+marker)});
      });
      await ctx.addInitScript(({inject,marker})=>{
        window.requestAnimationFrame=()=>0;window.confirm=()=>true;
        const write=document.write.bind(document);
        document.write=(...parts)=>write(...parts.map(v=>typeof v==='string'?v.replace(marker,()=>inject+marker):v));
      },{inject,marker});
      const page=await ctx.newPage(),errors=[];page.on('pageerror',err=>{errors.push(err.message);console.error(err.message);});
      const open=async dest=>{await page.goto(origin+'/'+dest);await page.waitForFunction(()=>window.communityQA?.ready());};
      const run=m=>page.evaluate(m=>window.communityQA[m](),m);
      await open('old');assert(await run('legacy'));await open('old');
      const prior=await run('snapshot');await open(edition);
      assert.deepEqual(await run('snapshot'),prior);assert(await run('save'));await open(edition);assert.deepEqual(await run('snapshot'),prior);
      assert(await run('saveNew'));await open(edition);const current=await run('snapshot');
      assert.equal(current.at(-1).filter(b=>['jobOffice','forestClock','monsterPlayPlaza','travelerRestPlaza'].includes(b[1])).length,4);
      assert(await run('save'));await open(edition);assert.deepEqual(await run('snapshot'),current);
      for(const stage of ['plots','clock','jobs','scenes']){await run(stage);console.log('PASS',width,edition,stage);}
      if(oldSave){
        await page.goto(origin+'/blank');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('monster_biyori_guarded_save_v1',s);},oldSave);
        await open('old');const snapshot=await run('snapshot');assert.equal(snapshot.at(-1).length,JSON.parse(oldSave).buildings.length);
        assert(await run('save'));await open(edition);assert.deepEqual(await run('snapshot'),snapshot);assert(await run('save'));await open(edition);assert.deepEqual(await run('snapshot'),snapshot);
      }
      assert.deepEqual(errors,[]);console.log('PASS',width,edition,'save round trips');await ctx.close();
    }
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
