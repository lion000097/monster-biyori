const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
function hooks(){
  window.checkBook={
    seed(){
      state.speed=0; registerRelics192(11);
      for(const id of [-101,-102,-1,55,56])recordTreasure(id);
      state.buildings.push({id:state.nextId++,type:'treasureMuseum213',x:6,y:6,level:1,facing:0,exhibits213:[-101,-102]});
      save(true);
    },
    check(){
      const original=Math.random;
      try{
        for(let stage=1;stage<=PUBLIC_ADVENTURE_END;stage++)for(const [roll,id] of [[.995,-101],[.9999,-102]]){
          const seq=[0,0,roll,.9999];Math.random=()=>seq.shift()??.99;
          if(rewardTreasure(stage,stage%5===0)!==id)throw Error('stage '+stage);
        }
        for(let index=0;index<10;index++)for(const [r,id] of [[0,-102],[expeditionReward(index).ur,-101]]){
          const seq=[r,.99,.9999];if(rollExpeditionTreasure213(()=>seq.shift(),index)!==id)throw Error('expedition '+index);
        }
      }finally{Math.random=original;}
      return state.buildings.filter(b=>b.type==='treasureMuseum213').flatMap(museumItems213);
    }
  };
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const name of ['game.html','launcher-game.html']){
   const page=await browser.newPage();
   const errs=[];page.on('pageerror',e=>errs.push(e.message));
   await page.route('http://book.test/**',route=>{
    const u=new URL(route.request().url());
    const file=u.pathname==='/old'?path.join(root,'releases/1.25.37/game.html'):path.join(root,name==='game.html'?name:'releases/1.25.38/'+name);
    const s=fs.readFileSync(file,'utf8'),i=s.lastIndexOf('})();');return route.fulfill({contentType:'text/html;charset=utf-8',body:s.slice(0,i)+'('+hooks.toString()+')();'+s.slice(i)});
   });
   await page.goto('http://book.test/old');await page.locator('#ranchGuideDialog [data-guide-stop]').click();await page.evaluate(()=>checkBook.seed());
   await page.goto('http://book.test/new');
   await page.locator('.tab[data-tab=treasure]').click();
   const rows=await page.locator('.treasure-card').evaluateAll(cs=>cs.map(c=>[c.querySelector('[data-treasure-index]').dataset.treasureIndex,c.querySelector('.treasure-rarity').textContent.split('No.')[1],c.querySelector('.treasure-name').textContent]));
   assert.deepEqual(rows.slice(0,59).map(x=>Number(x[1])),Array.from({length:59},(_,i)=>i+1));
   assert.deepEqual(rows.slice(55,57),[['-101','56','月花のオルゴール'],['-102','57','星渡りの天球儀']]);
   assert.deepEqual(rows.slice(59).map(r=>r[1]),['R01','R02']);
   assert.deepEqual(await page.evaluate(()=>checkBook.check()),[-101,-102]);
   assert.deepEqual(errs,[]);await page.close();console.log('OK',name,'50 stages, 10 expeditions, legacy save, book order');
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
