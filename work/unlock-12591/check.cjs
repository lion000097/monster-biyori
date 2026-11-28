const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict');
const [file,savePath]=process.argv.slice(2),src=fs.readFileSync(file,'utf8'),saved=JSON.parse(fs.readFileSync(savePath));
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
try{
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const anchor='claimSave12556();\nconst didLoad=load();',hook='window.ranchCheck91=s=>eval(s);\n'+anchor;
await page.addInitScript(({saved,anchor,hook})=>{localStorage.setItem('monster_biyori_guarded_save_v1',JSON.stringify(saved));const orig=Document.prototype.write;Document.prototype.write=function(...s){if(typeof s[0]==='string')s[0]=s[0].replace(anchor,()=>hook);return orig.apply(this,s)}},{saved,anchor,hook});
await page.route('**/*',r=>r.request().url()==='https://ranch.test/game.html'?r.fulfill({body:src.replace(anchor,()=>hook),contentType:'text/html;charset=utf-8'}):r.abort());
await page.goto('https://ranch.test/game.html');
await page.waitForFunction(()=>window.ranchCheck91&&ranchCheck91('state&&facilitySheetReady'),null,{timeout:90000});
const ev=s=>page.evaluate(s=>ranchCheck91(s),s);
assert.equal(await ev('state.buildings.length'),saved.buildings.length);
assert.equal(await ev('state.villageLv'),saved.villageLv);
assert.equal(await page.locator('.facility-celebration91').count(),0);
let total=0;
for(let level=2;level<=30;level++){
 const types=await ev('newFacilities91('+level+')');
 const expected=await ev('Object.entries(B).filter(([id,b])=>id!=="worldtree"&&b.unlock==='+level+'&&!facilityRoles.decor.types.includes(id)&&!Object.hasOwn(DECOR211,id)&&!Object.hasOwn(borderDecor,id)).map(([id,b])=>b.name)');
 if(level===25){assert(types.includes('freight')&&types.includes('rugShop'));assert(!types.includes('traderTent'));console.log('Level 25',expected)}
 const result=await ev('(()=>{state.villageLv='+ (level-1)+';state.worldTreeLevel=state.villageLv;state.villageXp=villageThreshold(state.villageLv);state.coins=1e9;state.magic=1e9;const missing=treeRequirementStatus193('+level+').filter(x=>!x.ok);if(missing.length)return missing;growWorldTree193();return state.villageLv})()');
 assert.equal(result,level,'growth '+JSON.stringify(result));
 const dlg=page.locator('.facility-celebration91[open]'),button=dlg.locator('button');
 assert((await dlg.locator('header').textContent()).includes('Lv.'+level));
 for(let i=0;i<types.length;i++){
  await button.evaluate(b=>b.click());assert.equal(await dlg.locator('header').textContent(),expected[i]+'を解放！');
  assert.equal(await dlg.locator('footer span').textContent(),(i+1)+' / '+types.length);
  assert.equal(await button.textContent(),i+1===types.length?'受け取る':'次へ');
  assert(await dlg.locator('canvas').evaluate(el=>el.getContext('2d').getImageData(0,0,el.width,el.height).data.some((v,i)=>i%4===3&&v>0)));total++;
 }
 await button.evaluate(b=>b.click());
}
assert.equal(await page.locator('.facility-celebration91[open]').count(),0);
assert.deepEqual(errors,[]);console.log('PASS',file,29,'levels',total,'facilities',saved.buildings.length,'old save entries');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
