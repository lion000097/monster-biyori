'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const delivery = process.env.RELEASE_ROOT || root;
const origin = 'https://ranch-check.invalid';
const marker = 'claimSave12556();\nconst didLoad=load();';

function seedOld() {
  state.day = 8;
  state.speed = 0;
  state.starterGuide = 'done';
  state.ranchName = '手帳の牧場';
  state.coins = 543210;
  return save(true);
}

function journalSmoke() {
  const initialCount = Object.keys(state.observationDays80).length;
  state.hour = 12;
  state.buildings.push({id:state.nextId++, type:'birdClock', x:-18, y:-18, level:1, facing:0});
  stepTownScenes(1.4);
  if (state.observationDays80.birdClock) throw Error('paused clock recorded');
  state.speed = 1;
  stepTownScenes(1.4);
  state.day++;
  stepTownScenes(1.4);
  state.speed = 0;
  tab = 'bestiary';
  atlasCategory = 'notebook';
  renderTab();
  return [initialCount, state.ranchName, state.coins, state.observationDays80.birdClock,
    document.querySelectorAll('[data-observation]').length,
    document.querySelector('[data-observation=birdClock] small')?.textContent,
    document.querySelector('.observation-art canvas')?.width];
}

function exerciseScenes() {
  const expect=(condition,message)=>{if(!condition)throw Error(message);};
  const add=(type,x,y)=>{
    const site={id:state.nextId++,type,x,y,level:1,facing:0};
    state.buildings.push(site);
    return site;
  };
  function weather(name) { while (weatherInfo().name!==name) state.day++; }
  state.speed=1;
  for(const [i,type] of ['acornLamp','moonBasin','crystalHanger','butterflyPool','rainHarp'].entries()) add(type,-17+i*2,-17);
  weather('晴れ');state.hour=6;stepTownScenes(1.4);
  expect(!state.observationDays80.butterflyPool&&!state.observationDays80.crystalHanger&&!state.observationDays80.moonBasin,'daylight boundary');
  state.hour=12;stepTownScenes(1.4);
  expect(state.observationDays80.butterflyPool===state.day&&!state.observationDays80.rainHarp,'sunny water');
  state.hour=15;stepTownScenes(1.4);
  expect(state.observationDays80.crystalHanger===state.day,'sunset crystals');
  const dryDay=state.day;
  weather('雨');state.hour=21;stepTownScenes(1.4);
  expect(state.observationDays80.rainHarp===state.day&&state.observationDays80.acornLamp===state.day&&!state.observationDays80.moonBasin,'rain and night');
  const pavilion={site:{type:'rainPavilion'},mode:'visit',members:[]};
  weather('晴れ');
  const resident={actor:{},kind:'monster',venue:pavilion};
  townOnArrival(resident);expect(!state.observationDays80.rainPavilion,'dry shelter');
  state.hour=21;stepTownScenes(1.4);
  expect(state.observationDays80.moonBasin===state.day,'dry moon');
  weather('雨');townOnArrival(resident);
  expect(state.observationDays80.rainPavilion===state.day,'rain shelter arrival');
  const artist={actor:{},phase:'use',stay:3,venue:{site:{type:'artHut'},members:[]}};
  townLeave(artist);expect(!state.observationDays80.artHut,'unfinished art');
  artist.stay=4;townLeave(artist);
  expect(artist.venue.site.townPicture===1&&state.observationDays80.artHut===state.day,'completed art');
  for(const [type,mode,min] of [['musicHall','music',4],['monsterPlayPlaza','chase',2]]) {
    const v={site:{type,x:8,y:8,facing:0,level:1},mode,members:[]};
    v.members=Array.from({length:min},(_,slot)=>({actor:{x:8,y:8},slot,kind:'monster',phase:'use',venue:v}));
    v.members[min-1].phase='road';townStepGroup(v,.1);
    expect(!state.observationDays80[type],'waiting '+mode);
    v.members[min-1].phase='use';townStepGroup(v,.1);
    expect(v.running&&state.observationDays80[type]===state.day,'group starts '+mode);
  }
  weather('晴れ');state.hour=8;
  stepRanchScenes124(.05);
  const roads=state.paths.map(k=>k.split(',').map(Number)).filter(p=>residentRoad(...p));
  const p=roads.find(q=>neighbors(...q).some(t=>residentRoad(...t))&&neighbors(...q).some(t=>!getBuildingAt(...t)&&!isPath(...t)));
  expect(p,'flower plot');
  const beside=neighbors(...p).find(q=>!getBuildingAt(...q)&&!isPath(...q));
  const bed=add('flowerbed211',...beside);
  const first=makeMonster(state.nextId++,0,...p), second=makeMonster(state.nextId++,1,...p);
  state.monsters.push(first,second);
  first.x=p[0];first.y=p[1];first.path=[];
  expect(advanceRanchDecor124({actor:first,kind:'water',site:bed,phase:'approach',goal:p},.1),'watering action');
  expect(state.observationDays80.flowerbed211===state.day,'watering stamp');
  state.buildings.splice(state.buildings.indexOf(bed),1);
  const rug=add('picnic257',...beside), other=neighbors(...p).find(q=>residentRoad(...q));
  state.hour=12;
  second.x=other[0];second.y=other[1];
  const scene=beginPicnic257({site:rug,choice:[{actor:first,goal:p,route:[]},{actor:second,goal:other,route:[]}]});
  picnicFlow257={ranch:state,day:state.day,played:true,poll:1,scene};
  second.x+=.4;stepPicnic257(.1);expect(!state.observationDays80.picnic257,'waiting picnic');
  second.x=other[0];stepPicnic257(.1);
  expect(scene.phase==='use'&&state.observationDays80.picnic257===state.day,'picnic together');
  expect(state.observationDays80.birdClock===8&&state.observationDays80.butterflyPool===dryDay,'first days retained');
  expect(Object.keys(state.observationDays80).length===12,'all twelve events');
  const malformed={day:8,observationDays80:{birdClock:0,rainHarp:8,acornLamp:'4',moonBasin:9,artHut:-1,fake:4}};
  loadObservationDays80(malformed);
  expect(JSON.stringify(malformed.observationDays80)===JSON.stringify({rainHarp:8}),'malformed optional days');
  state.speed=0;
  return {...state.observationDays80};
}

function menuFixture() {
  return {
    types: Object.entries(B).map(([type,spec])=>({type, name:spec.name, size:[buildingMeta(type).w,buildingMeta(type).h].sort((a,b)=>a-b).join('×'),
      road:acceptsRoadFloor130(type), placed:state.buildings.some(b=>b.type===type), decor:facilityRoles.decor.types.includes(type)}))
  };
}

async function menuChecks(page,mobile) {
  if(mobile) await page.locator('[data-mobile-dock12521=build]').click();
  else await page.locator('.tab[data-tab=build]').click();
  const box=page.locator('#buildName80'), count=page.locator('#buildCount80');
  const read=()=>page.locator('#tabBody .build-option [data-action=build],#tabBody .worldtree-panel193').evaluateAll(
    items=>items.map(el=>el.dataset.id||'worldtree').sort());
  const types=(await page.evaluate(()=>menuFixture())).types;
  const ids=f=>types.filter(f).map(b=>b.type).sort();
  const assertResults=async want=>{
    assert.deepEqual(await read(),want);
    assert.equal(await count.textContent(),want.length?want.length+' 種類':'一致する施設はありません');
  };
  await assertResults(ids(()=>true));
  await box.fill('ｼｬﾎﾞﾝ　玉');
  await assertResults(['bubblePot']);
  await box.evaluate(el=>{el.focus();window.originalSearchNode=el;el.setSelectionRange(2,2);});
  assert(await page.evaluate(()=>{window.forceTabRefresh();return document.activeElement===originalSearchNode&&originalSearchNode.selectionStart===2;}));
  await box.evaluate(el=>{
    el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));
    el.value='小鳥';el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));
  });
  await assertResults(['bubblePot']);
  await box.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true})));
  await assertResults(ids(b=>b.name.includes('小鳥')));
  await page.locator('#buildUnplaced80').check();
  await assertResults(ids(b=>b.name.includes('小鳥')&&!b.placed));
  await box.fill('見つからない施設');
  await assertResults([]);
  await page.locator('#buildReset80').click();
  await page.locator('[data-facility-role=decor]').click();
  await page.locator('#buildSize80').selectOption('1×1');
  await page.locator('#buildRoad80').check();await page.locator('#buildUnplaced80').check();
  const smallRoad=ids(b=>b.decor&&b.size==='1×1'&&b.road&&!b.placed);
  assert(smallRoad.length>0&&!smallRoad.includes('acorn250'));
  await assertResults(smallRoad);
  await page.evaluate(type=>window.buildForFilter(type),smallRoad[0]);
  await assertResults(smallRoad.slice(1));
  await page.locator('#buildReset80').click();
  await page.locator('#buildSize80').selectOption('1×2');await assertResults(ids(b=>b.size==='1×2'));
  await page.locator('#buildSize80').selectOption('6×6');await assertResults(ids(b=>b.size==='6×6'));
  assert((await read()).includes('worldtree'));
  await page.locator('#buildUnplaced80').check();assert(!(await read()).includes('worldtree'));
  await box.fill('世界樹');await assertResults([]);
  await page.locator('#buildReset80').click();
  await box.fill('存在しない施設');
  assert.equal(await page.evaluate(()=>window.guideResetTarget()),'buildReset80');
  await page.locator('.tab[data-tab=bestiary]').click();
  assert(await page.locator('#buildFilters80').isHidden());
  await page.locator('[data-action=atlas][data-id=notebook]').click();
  assert.equal(await page.locator('.observation-book li').count(),12);
  assert.equal(await page.locator('.observation-book li.found').count(),1);
  if(mobile) assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
}

(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM || undefined, args:['--no-sandbox']});
  try {
    for (const compact of (process.argv.includes('--web') ? [false] : [false,true])) {
      const ctx = await browser.newContext({viewport:{width:compact?390:1120, height:820}});
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
      page.on('dialog', async dialog => dialog.accept());
      const hook = 'window.oldFixture='+seedOld.toString()+';window.journalSmoke='+journalSmoke.toString()+
        ';window.readRanch=()=>JSON.parse(readRanchSave12556());window.exerciseScenes='+exerciseScenes.toString()+
        ';window.menuFixture='+menuFixture.toString()+';window.forceTabRefresh=()=>renderUI(true);'+
        'window.guideResetTarget=()=>guideConstruction("ranch","ranch").target?.id;'+
        'window.buildForFilter=type=>{state.buildings.push({id:state.nextId++,type,level:1,x:-12,y:-12});renderUI(true);};\n';
      await page.addInitScript(({marker,hook})=>{
        const write = Document.prototype.write;
        Document.prototype.write = function(...args) {
          if (typeof args[0] === 'string') args[0]=args[0].replace(marker,()=>hook+marker);
          return write.apply(this,args);
        };
      },{marker,hook});
      await page.route('**/*', route => {
        const url = route.request().url();
        if (![origin+'/old',origin+'/new'].includes(url)) return route.abort();
        const old = url.endsWith('/old');
        const file = old ? path.join(root,'releases/1.25.79/game.html') :
          path.join(delivery, compact?'releases/1.25.80/launcher-game.html':'game.html');
        const source = fs.readFileSync(file,'utf8');
        return route.fulfill({contentType:'text/html; charset=utf-8',
          body:compact&&!old ? source : source.replace(marker,()=>hook+marker)});
      });
      await page.goto(origin+'/old');
      await page.waitForFunction(()=>typeof oldFixture==='function' && document.querySelector('#ranchName').textContent);
      assert(await page.evaluate(()=>oldFixture()));
      await page.goto(origin+'/new');
      await page.waitForFunction(()=>typeof journalSmoke==='function' && document.querySelector('#ranchName').textContent==='手帳の牧場');
      assert.deepEqual(await page.evaluate(()=>journalSmoke()),[0,'手帳の牧場',543210,8,12,'初発見　8日目',64]);
      await page.reload();
      await page.waitForFunction(()=>typeof readRanch==='function' && document.querySelector('#ranchName').textContent==='手帳の牧場');
      assert.equal((await page.evaluate(()=>readRanch())).observationDays80.birdClock,8);
      await menuChecks(page,compact);
      const allDays=await page.evaluate(()=>exerciseScenes());
      await page.waitForFunction(()=>Object.keys(readRanch().observationDays80).length===12);
      await page.reload();
      await page.waitForFunction(()=>typeof readRanch==='function'&&document.querySelector('#ranchName').textContent==='手帳の牧場');
      assert.deepEqual((await page.evaluate(()=>readRanch())).observationDays80,allDays);
      assert.deepEqual(errors,[]);
      console.log(compact?'Offline mobile':'Web desktop','12 scenes, old save, pause, first days, illustrations, combined search, IME, guide and reload passed');
      await ctx.close();
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
