// Verify browser compositing, the exact deck outline, offline loading, and cached automatic updates.
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const sharp=require('sharp');
const meta=require('./frames.json');
const rel=process.env.PUBLIC_FILES||path.resolve(__dirname,'../../releases/1.25.90');
const material=path.resolve(__dirname,'../../assets/town-axis/painted');
const asset='stage-art-1.25.90.js';
const site='https://ranch.test/';
const hook='claimSave12556();\nconst didLoad=load();';
const mark='window.inspectStageArt=(k,f)=>townMapArt({type:k,level:1,facing:f},f,true,0);window.stageReady=()=>facilitySheetReady;window.stageIsOriginal=k=>axisSprites.get(k)?.original12590;\n'+hook;
async function mode(browser,kind){
  const full=kind!=='isolated',light=kind!=='web';
  const entry=light?'launcher-game.html':'game.html';
  const local=kind==='file';
  const ctx=await browser.newContext({viewport:{width:1280,height:820},serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let artRequests=0,usingCache=false;
  await page.addInitScript(({hook,mark})=>{
    const write=Document.prototype.write;
    Document.prototype.write=function(...s){if(typeof s[0]==='string')s[0]=s[0].replace(hook,()=>mark);return write.apply(this,s);};
  },{hook,mark});
  await page.route('**/*',route=>{
    const u=route.request().url();
    if(local){if(u.startsWith('file:'))return route.continue();return route.abort();}
    if(u===site+entry){
      const game=fs.readFileSync(path.join(rel,entry),'utf8');return route.fulfill({body:light?game:game.replace(hook,()=>mark),contentType:'text/html; charset=utf-8'});
    }
    if(u.endsWith('/'+asset)){
      artRequests++;
      if(kind==='cached'&&!usingCache&&u.startsWith('https://lion000097.github.io/')){
        return route.fulfill({body:fs.readFileSync(path.join(rel,asset)),contentType:'text/javascript',headers:{'Access-Control-Allow-Origin':'*'}});
      }
    }
    return route.abort();
  });
  if(local)await ctx.setOffline(true);
  await page.goto(local?pathToFileURL(path.join(rel,entry)).href:site+entry,{timeout:90000});
  async function ready(){
    await page.waitForFunction(()=>window.stageReady?.(),null,{timeout:90000});
    if(light&&full)await page.waitForFunction(keys=>keys.every(k=>window.stageIsOriginal(k)),Object.keys(meta),{timeout:40000});
  }
  await ready();
  if(kind==='cached'){
    await page.waitForFunction(()=>new Promise(resolve=>{
      const req=indexedDB.open('monster_biyori_paintings',1);
      req.onsuccess=()=>{const db=req.result,tx=db.transaction('originals'),op=tx.objectStore('originals').count();
        op.onsuccess=()=>resolve(op.result>0);tx.oncomplete=()=>db.close();};req.onerror=()=>resolve(false);
    }),null,{timeout:10000});
    usingCache=true;await page.reload();await ready();
  }
  let samples=0;
  for(const [key,views] of Object.entries(meta)){
    const size=views[0].size;
    for(const f of views){
      let png;
      if(process.env.APPROVED_PNG_DIR)png=fs.readFileSync(path.join(process.env.APPROVED_PNG_DIR,key,f.index+'.png'));
      else png=await sharp(path.join(material,key+'.png')).extract({left:f.index*size,top:0,width:size,height:size}).png().toBuffer();
      const result=await page.evaluate(async({key,f,png,full})=>{
        const expected=new Image();expected.src='data:image/png;base64,'+png;await expected.decode();
        const c=document.createElement('canvas');c.width=expected.width;c.height=expected.height;
        const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(expected,0,0);
        const px=g.getImageData(0,0,c.width,c.height).data;
        const a=window.inspectStageArt(key,f),out=a.getContext('2d').getImageData(0,0,a.width,a.height).data;
        let silhouette=0,rgba=0;
        for(let i=0;i<px.length;i+=4){
          if((px[i+3]>0)!==(out[i+3]>0)||(px[i+3]>=128)!==(out[i+3]>=128))silhouette++;
          if(full)for(let q=0;q<4;q++)if(px[i+q]!==out[i+q])rgba++;
        }
        return [a.width,a.height,silhouette,rgba];
      },{key,f:f.index,png:png.toString('base64'),full});
      assert.deepEqual(result,[size,size,0,0],kind+' '+key+' '+f.index+': '+result);samples++;
    }
  }
  assert.deepEqual(errors,[]);if(kind==='isolated')assert.equal(await page.evaluate(()=>window.stageIsOriginal('starTerrace')),false);
  await ctx.close();console.log(kind,samples,full?'original PNG pixel equality':'native source contours',artRequests,'companion requests; no game errors');
}
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--allow-file-access-from-files']});
  try{for(const kind of process.argv.slice(2))await mode(b,kind);}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
