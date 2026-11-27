'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
const read = (p, format) => fs.readFileSync(path.join(root, p), format);
const base = 'http://127.0.0.1:8879/';
const marker = 'claimSave12556();\nconst didLoad=load();';
const artDir = 'assets/adventure/';
const version = '1.25.71';
function install() {
  window.qa = {
    version:GAME_APP_VERSION,
    ready:()=>!!state && adventureArt.naturalWidth>0 && !!colorIndices && villageSheetReady && facilitySheetReady &&
      (typeof adventureGoal==='undefined'||adventureGoal.naturalWidth>0&&adventureChest.naturalWidth>0),
    seed(){
      state.speed=0;state.starterGuide='done';state.adventure.auto=false;
      state.monsters.forEach(m=>{m.lv=80;m.xp=0});recordTreasure(-101);
      return validBackup213(state)&&save(true);
    },
    ranch:()=>({stage:state.adventure.stage,coins:state.coins,monsters:state.monsters.map(m=>[m.id,m.kind,m.name,m.lv,m.iv]),
      buildings:state.buildings.map(b=>[b.id,b.type]),treasures:[...state.treasures],party:[...state.party]}),
    save:()=>validBackup213(state)&&save(true),
    menu(key){mobileSetPane12521('menu');tab=key;renderUI(true)},
    step(dt){const b=state.battle;if(!stepJourney12554(b,dt))adventureTick(true)},
    nextChest(empty){
      const r=Math.random;try{if(empty)Math.random=()=>.9999;this.step(12)}finally{Math.random=r}
    },
    phase:()=>state.battle?journey12554.get(state.battle)?.phase:'cleared',
    loot:()=>journey12554.get(state.battle)?.loot,
    win(){
      for(let i=0;state.battle&&i<150;i++)this.step(10);
      return !state.battle;
    },
    raid(){state.adventure.stage=51;this.menu('raid');document.querySelector('[data-raid-action="fight"]').click();return state.battle?.raid},
    endRaid(){finishYuguru(state.battle,false);state.adventure.stage=3;return this.save()},
    draw(now=30000){
      const images=[],native=battleCtx.drawImage;
      battleCtx.drawImage=function(img,...args){
        if(img===adventureArt||img===adventureChest||img===adventureGoal){
          images.push([img===adventureArt?'scene':img===adventureChest?'chest':'flag',...args]);
        }
        return native.call(this,img,...args);
      };
      try{drawBattle(now)}finally{battleCtx.drawImage=native}
      return images;
    },
    info(){return {width:adventureArt.naturalWidth,height:adventureArt.naturalHeight,map:!mapJourney12554.hidden,
      allies:state.battle?.ourHp,foes:state.battle?.foes?.map(f=>f.hp)}},
    hpTest(){
      const c=document.createElement('canvas');c.width=125;c.height=10;
      const g=c.getContext('2d'),values=[0,.01,50,100,125];
      return [false,true].map(mini=>values.map(hp=>{
        const width=mini?29:124;paintAdventureHp(g,0,0,width,hp,100,adventureHpColors.ally,mini);
        const px=g.getImageData(0,mini?2:3,width,1).data;
        let filled=0;for(let x=0;x<width;x++)if(px[x*4]===135)filled++;
        return filled;
      }));
    },
    battleReadout(){
      const b=state.battle,oldAlly=b.ourHp,oldFoes=b.foes.map(f=>f.hp);
      const widths=[];
      function count(x,rgb){
        const line=battleCtx.getImageData(x*3,(14*3)+1,120*3,1).data;
        let n=0;for(let i=0;i<120;i++)if(line[i*12+4]===rgb)n++;return n;
      }
      try{
        for(const factor of [1,.5,0]){
          b.ourHp=b.ourMax*factor;b.foes.forEach(f=>f.hp=f.maxHp*factor);
          this.draw();renderUI(true);
          widths.push([count(27,135),count(267,239),...Array.from(document.querySelectorAll('.battle-track>div'),e=>e.style.width)]);
        }
      }finally{b.ourHp=oldAlly;b.foes.forEach((f,i)=>f.hp=oldFoes[i]);renderUI(true)}
      return widths;
    },
    async matchPropImages(encoded){
      for(const [i,original] of [adventureChest,adventureGoal].entries()){
        const source=new Image();source.src=encoded[i];await source.decode();
        if(original.naturalWidth!==source.width||original.naturalHeight!==source.height)return false;
        const serialize=img=>{
          const c=document.createElement('canvas');c.width=source.width;c.height=source.height;
          c.getContext('2d').drawImage(img,0,0);return c.toDataURL();
        };
        if(serialize(source)!==serialize(original))return false;
      }
      return true;
    },
    async checkArt(asset){
      const source=new Image();source.src=asset;await source.decode();
      const h=source.height/16,w=Math.round(400/608*source.width);
      const contexts=[0,1].map(()=>{const c=document.createElement('canvas');c.width=400;c.height=106;
        const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;return g});
      const [actual,expected]=contexts;let checked=0;
      for(let stage=1;stage<=76;stage++){
        const raid=stage===76,row=raid?15:Math.floor((stage-1)/5);
        for(const pan of [0,50,100]){
          drawAdventureBackground(actual,raid?1:stage,pan,raid);
          expected.drawImage(source,Math.round((source.width-w)*pan/100),row*h,w,h,0,0,400,106);
          const a=new Uint32Array(actual.getImageData(0,0,400,106).data.buffer);
          const b=new Uint32Array(expected.getImageData(0,0,400,106).data.buffer);
          if(!a.every((v,i)=>v===b[i])||a.every(v=>v===a[0]))throw Error('Landscape mismatch at '+stage+' / '+pan);
          checked++;
        }
      }
      return checked;
    }
  };
}
const hook='('+install.toString()+')();\n';
const instrument=html=>{assert.equal(html.split(marker).length,2);return html.replace(marker,hook+marker)};
async function snapshot(page,key){
  if(!process.env.QA_ART_DIR)return;
  const url=await page.locator('#battleCanvas').evaluate(c=>c.toDataURL());
  fs.writeFileSync(path.join(process.env.QA_ART_DIR,key+'.png'),Buffer.from(url.split(',')[1],'base64'));
}
async function scenario(browser,mode){
  const regular=mode==='web',fallback=mode==='fallback',width=mode==='offline'?1280:390;
  const page=await browser.newPage({viewport:{width,height:850},hasTouch:width===390});
  const errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));
  const old=read('releases/1.25.70/game.html','utf8');
  const current=read(regular?'game.html':'releases/'+version+'/launcher-game.html','utf8');
  await page.route('**/*',r=>{
    const url=r.request().url();
    if(url===base+'old')return r.fulfill({contentType:'text/html; charset=utf-8',body:instrument(old)});
    if(url===base+'game')return r.fulfill({contentType:'text/html; charset=utf-8',body:regular?instrument(current):current});
    network.push(url);return r.abort();
  });
  if(!regular)await page.addInitScript(({marker,hook,fallback})=>{
    const write=Document.prototype.write;
    Document.prototype.write=function(...args){
      if(typeof args[0]==='string'&&args[0].includes(marker)){
        args[0]=args[0].replace(marker,hook+marker);
        if(fallback)args[0]=args[0].replace(/adventureArt\.src='data:image\/avif;base64,[^']+';/,"adventureArt.src='data:image/avif;base64,AA==';");
      }
      return write.apply(this,args);
    };
  },{marker,hook,fallback});
  const ready=()=>page.waitForFunction(()=>window.qa?.ready());
  try{
    await page.goto(base+'old');await ready();
    assert(await page.evaluate(()=>qa.seed()));const prior=await page.evaluate(()=>qa.ranch());
    await page.goto(base+'game');await ready();
    assert.equal(await page.evaluate(()=>qa.version),version);
    assert.deepEqual(await page.evaluate(()=>qa.ranch()),prior);
    const name=regular?'trail-panoramas.webp':fallback?'trail-panoramas-fallback.webp':'trail-panoramas-compact.avif';
    const encoded='data:image/'+name.split('.').at(-1)+';base64,'+read(artDir+name).toString('base64');
    assert.equal(await page.evaluate(img=>qa.checkArt(img),encoded),228);
    assert.deepEqual(await page.evaluate(()=>qa.hpTest()),[[0,1,60,120,120],[0,1,14,27,27]]);
    const props=['trail-chest.png','trail-goal.png'].map(n=>'data:image/png;base64,'+read(artDir+n).toString('base64'));
    assert(await page.evaluate(inputs=>qa.matchPropImages(inputs),props));
    const info=await page.evaluate(()=>qa.info());assert.equal(info.width,regular?608:fallback?152:400);
    if(fallback){console.log('PASS',mode, '228 exact landscape crops, offline WebP recovery');return}
    const select=type=>page.evaluate(t=>qa.menu(t),type);
    const action=async()=>{await select('adventure');await page.locator('[data-action="adventureStart"]').click()};
    const frame=()=>page.evaluate(()=>qa.draw());
    await action();
    assert.equal(await page.evaluate(()=>qa.phase()),'walk');
    assert.equal((await frame())[0][0],'scene');
    assert((await page.evaluate(()=>qa.info())).map);
    await page.evaluate(()=>qa.nextChest(false));
    assert.equal(await page.evaluate(()=>qa.phase()),'chest');
    assert.notEqual(await page.evaluate(()=>qa.loot()),null);
    assert.equal((await frame()).find(c=>c[0]==='chest')[1],0);
    await snapshot(page,mode+'-closed');
    await page.evaluate(()=>qa.step(.3));
    assert.equal((await frame()).find(c=>c[0]==='chest')[1],32);
    await snapshot(page,mode+'-open');
    await page.evaluate(()=>{qa.step(1);qa.step(8);qa.step(1)});
    assert.equal(await page.evaluate(()=>qa.phase()),'fight');await frame();
    await snapshot(page,mode+'-fight');
    await select('adventure');
    const bars=page.locator('.battle-track');assert.equal(await bars.count(),2);
    assert(await bars.first().isVisible()&&await bars.last().isVisible());
    assert(await bars.last().evaluate(el=>el.classList.contains('ally-hp')));
    assert.deepEqual(await page.evaluate(()=>qa.battleReadout()),[[120,120,'100%','100%'],[60,60,'50%','50%'],[0,0,'0%','0%']]);
    assert(await page.evaluate(()=>qa.win()));
    assert.equal((await frame()).find(c=>c[0]==='flag')[1],0);
    await snapshot(page,mode+'-goal');
    assert.equal((await page.evaluate(()=>qa.ranch())).stage,2);
    await action();await page.evaluate(()=>{qa.nextChest(true);qa.step(.3)});
    assert.equal(await page.evaluate(()=>qa.loot()),null);
    assert.equal((await frame()).find(c=>c[0]==='chest')[1],64);
    assert(await page.evaluate(()=>qa.win()));
    assert.equal(await page.evaluate(()=>qa.raid()),'yuguru');
    assert.equal((await frame()).find(c=>c[0]==='scene')[2],(info.height/16)*15);
    assert(await page.locator('[data-raid-health] progress.ally-hp').isVisible());
    await snapshot(page,mode+'-raid');
    assert(await page.evaluate(()=>qa.endRaid()));
    const updated=await page.evaluate(()=>qa.ranch());
    await page.reload();await ready();assert.deepEqual(await page.evaluate(()=>qa.ranch()),updated);
    console.log('PASS',mode,width,'228 landscape crops, chest 3 states, goal, HP, raid, 1.25.70 save round trip');
  }finally{await page.close();assert.deepEqual(errors,[]);assert.deepEqual(network,[])}
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--no-sandbox']});
  try{for(const mode of ['web','offline','fallback'])await scenario(browser,mode)}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
