'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const base='https://town-75.invalid/',marker='claimSave12556();\nconst didLoad=load();';
function inspect(){
 const entries=Object.entries(villageAdditions75),hashes=new Map(),errors=[];
 const expect=(truth,detail)=>{if(!truth)errors.push(detail);};
 state.starterGuide='done';state.speed=0;
 expect(state.catalog.friends.includes(0),'old catalog');
 for(const [type,s] of entries){
  expect(fixedScenic130(type)&&!treeRequirementStatus193(s.unlock+1).some(r=>r.type===type),'growth '+type);
  expect(townCountLimit(type,s.unlock-1)===0&&townCountLimit(type,s.unlock)===s.limit,'unlock '+type);
  expect(s.role!=='decor'||acceptsRoadFloor130(type),'road '+type);
  expect(s.workSlots===0||tradeDutyTypes12543.has(type),'duty '+type);
  const site={type,id:912,level:1,facing:0,x:10,y:10};
  for(let face=0;face<4;face++){
   const art=townMapArt(site,face,false,0),thumb=spriteBuildingV161(type,1,face);
   expect(art.width===(s.w+s.h)*32&&thumb.width===art.width,'size '+type);
   const pixels=art.getContext('2d').getImageData(0,0,art.width,art.height).data;
   expect(pixels.some((v,i)=>i%4===3&&v>0),'empty '+type);
   if(face===0){const sig=art.toDataURL();if(hashes.has(sig))errors.push(type+' duplicates '+hashes.get(sig));hashes.set(sig,type);}
  }
  townBuildingInfo(site);overlayAddition75(site,{x:0,y:0,w:128,h:128},0);
 }
 expect(hashes.size===entries.length,'duplicate art '+hashes.size);
 for(let lv=6;lv<=30;lv++)expect(entries.filter(([,s])=>s.unlock===lv).length===([15,30].includes(lv)?2:3),'level '+lv);
 state.villageLv=30;tab='build';facilityRole='all';renderTab();
 const buttons=new Set([...document.querySelectorAll('[data-action="build"]')].map(b=>b.dataset.id));
 expect(entries.every(([id])=>buttons.has(id)),'catalog');
 expect(!Object.values(B).some(b=>['泡のアーチ','世界樹の記念写真館'].includes(b.name)),'exclusions');
 const oldDuty=townStaffOnDuty;
 try{
  const stall={id:9501,type:'postcards',level:1}, visitor={name:'旅人'},wallet=state.coins;
  townStaffOnDuty=()=>0;expect(!additionSale75(stall,visitor)&&state.coins===wallet,'no unstaffed sales');
  townStaffOnDuty=()=>1;expect(additionSale75(stall,visitor)&&state.coins>wallet,'staffed sale');
  expect(stall.townSales>state.coins-wallet&&!additionSale75(stall,visitor),'expenses / same visit');
  const pantry={id:9510,type:'pantryDiner',level:1};
  state.hour=12;state.townPantry=2;townWork75(pantry);
  expect(state.townPantry===1&&pantry.meals75===1,'pantry meal');
  const banquet={id:9511,type:'feastTable',level:1};state.hour=18;townWork75(banquet);
  expect(!banquet.meals75,'one worker on two-person banquet');
  townStaffOnDuty=()=>2;townWork75(banquet);expect(banquet.meals75===1,'staffed banquet');
  const tray={id:9512,type:'breadMarket'};state.hour=8;
  expect(!additionSale75(tray,{name:'旅人'}),'bread requires bakery stock');
  state.hour=12;expect(!townBusinessOpen(tray),'bread market closes');
  expect(!townBusinessOpen({...stall,townUnpaid:1}),'unpaid fees close');
  const original=state.buildings;state.buildings=[...original,stall];state.hour=0;state.coins=100;
  townHour(true);expect(!stall.townUnpaid&&state.coins<=100-B.postcards.upkeep,'daily upkeep');
  state.buildings=original;
 }finally{townStaffOnDuty=oldDuty;}
 const site=state.buildings.find(b=>b.type==='home');site.type='amberShelf';site.material75=0;save(true);
 return {errors,art:hashes.size,levels:entries.length,loaded:didLoad,dex:state.catalog.friends.length};
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/tmp/chromium',args:['--no-sandbox']});
 try{
 for(const compact of [false,true]){
 const c=await browser.newContext({viewport:{width:compact?390:1120,height:810}}),p=await c.newPage(),errors=[];
 const hook='window.inspect75='+inspect.toString()+';window.store75=()=>save(true);window.shelf75=()=>state.buildings.some(b=>b.type==="amberShelf"&&b.material75===0);window.seed75=()=>{state.starterGuide="done";return save(true)};\n';
 const insert=body=>body.replace(marker,()=>hook+marker);
 p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(({marker,hook})=>{const write=Document.prototype.write;Document.prototype.write=function(...a){if(typeof a[0]==='string')a[0]=a[0].replace(marker,()=>hook+marker);return write.apply(this,a)};},{marker,hook});
 await p.route('**/*',r=>{const url=r.request().url();if(!url.startsWith(base))return r.abort();const old=url.endsWith('/old');if(!old&&!url.endsWith('/new'))return r.abort();
 const src=fs.readFileSync(old?'releases/1.25.74/game.html':compact?'releases/1.25.75/launcher-game.html':'game.html','utf8');
 return r.fulfill({contentType:'text/html',body:compact&&!old?src:insert(src)});});
 await p.goto(base+'old');assert.equal(await p.evaluate(()=>seed75()),true);
 await p.goto(base+'new');await p.waitForFunction(()=>typeof inspect75==='function');
 const res=await p.evaluate(()=>inspect75());assert.deepEqual(res.errors,[]);assert.equal(res.levels,73);assert(res.loaded);
 await p.reload();await p.waitForFunction(()=>typeof window.shelf75==='function');assert(await p.evaluate(()=>shelf75()));assert.deepEqual(errors,[]);
 console.log(compact?'launcher':'web',res);await c.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
