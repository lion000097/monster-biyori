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
        ';window.readRanch=()=>JSON.parse(readRanchSave12556());\n';
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
      assert.deepEqual(errors,[]);
      console.log(compact?'Offline mobile':'Web desktop','old save, paused/offscreen clock, first day, 12 entries, artwork, reload passed');
      await ctx.close();
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
