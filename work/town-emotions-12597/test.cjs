const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=process.argv[2]||path.join(__dirname,'out');
const hook='claimSave12556();\nconst didLoad=';
const tests=`window.testEmotions97=()=>{
 const check=(ok,k)=>{if(!ok)throw Error(k)};
 const before=JSON.stringify(state);
 const old=state,w=weatherInfo,r=residentRoad, s=snackPairValid126;
 const a={id:9001,kind:0,x:10,y:7,path:[]},b={id:9002,kind:1,x:11,y:7,path:[]},c={id:9003,kind:2,x:30,y:30,path:[]};
 const reset=()=>state={...old,hour:12,speed:1,monsters:[a,b,c]};
 reset();const snap=JSON.stringify(state);
 const active=(m,k)=>townFeelings97.get(m)?.ranch===state&&townFeelings97.get(m)?.kind===k;
 check(advanceChase(a,{partner:b,leader:true,chase:{remaining:4,elapsed:1,phase:'run',trail:[[11,7],[10,7]]}},.01)===false,'completed chase');
 check(active(a,'joy')&&!active(b,'joy'),'chase emits joy for one finisher');
 check(JSON.stringify(state)===snap,'joy changes no save state');
 let f=townFeelings97.get(a);check(drawTownFeeling97(a,60,50,f.at+500)&&!drawTownFeeling97(a,60,50,f.at+1051),'short visible duration');
 reset();nearbySplashFeeling97(a,10,7);check(active(b,'startle')&&!active(a,'startle')&&!active(c,'startle'),'only nearby bystander reacts');
 showTownFeeling97(c,'joy');check(!active(c,'joy'),'global visual cooldown');
 reset();
 weatherInfo=()=>({name:'雨'});residentRoad=()=>true;
 try{
  const p={kind:'rain',action:'splash',phase:'jump',from:[10,7],puddle:[11,7],land:[11,7],day:state.day,elapsed:.64,duration:.65};
  advanceRainPastime(a,p,.03);
  check(active(b,'startle')&&!active(a,'startle'),'rain landing hooked');
  check(a.x===11&&p.phase==='rest'&&p.duration===.85,'rain routine still completes');
 }finally{weatherInfo=w;residentRoad=r}
 reset();
 const sweet={ranch:state,day:state.day,elapsed:1.15,receiver:b,giver:a};
 snackPairValid126=()=>true;
 try{
  snackShare126={ranch:state,day:state.day,scene:sweet,played:true,poll:0};
  const prior=JSON.stringify(state);
  stepSnackShare126(.02);
  check(active(b,'fond')&&!active(a,'fond'),'receiver reacts at handover');
  check(JSON.stringify(state)===prior,'heart changes no save state');
 }finally{snackPairValid126=s;snackShare126=null}
 state=old;check(JSON.stringify(state)===before,'existing save unchanged');
 check((!townMotionAssets97Dummy()),'dummy');
 return {version:GAME_APP_VERSION,species:SPECIES.length,feelings:Object.keys(townFeelingPixels97)};
};`.replace(" check((!townMotionAssets97Dummy()),'dummy');\n","");
(async()=>{
 const html=fs.readFileSync(path.join(root,'game.html'),'utf8');
 assert.equal(html.split(hook).length,2);
 const b=await chromium.launch({executablePath:path.resolve('mb-73-save/chromium'),args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const viewport of [{width:1200,height:900},{width:390,height:844}]){
  const p=await b.newPage({viewport}); const errs=[];p.on('pageerror',e=>errs.push(e.message));
  let url='https://lion000097.github.io/monster-biyori/game.html?v=1.25.97';
  await p.route('**/*',r=>r.request().url()===url?r.fulfill({contentType:'text/html; charset=utf-8',body:html.replace(hook,()=>tests+hook)}):r.abort());
  await p.goto(url);await p.waitForFunction(()=>typeof window.testEmotions97==='function',null,{timeout:15000});
  const out=await p.evaluate(()=>window.testEmotions97());
  assert.equal(out.version,'1.25.97');assert.equal(out.species,127);assert.deepEqual(out.feelings,['joy','fond','startle']);
  assert.deepEqual(errs,[]);console.log(viewport.width,out);await p.close();
 }}finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
