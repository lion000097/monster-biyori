const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const files = {
  old: process.env.OLD_GAME || 'releases/1.25.33/game.html',
  normal: 'game.html',
  launcher: 'releases/1.25.34/launcher-game.html'
};

function attachTestControls() {
  window.raidTest = {
    prepare(discovered) {
      state.speed = 0;
      state.adventure.stage = 51;
      state.adventure.auto = false;
      state.adventure.bossLoop = null;
      state.battle = null;
      state.party = state.monsters.slice(0, 3).map(m => m.id);
      if (discovered !== null) recordTreasure(discovered);
      save(true);
    },
    finishWith(id) {
      const draw = rollYuguruDrops;
      const rolls = [1, 1, id === -1 ? 0 : 1, id === -2 ? 0 : 1];
      rollYuguruDrops = () => draw(() => rolls.shift());
      try {
        assertRaidBattle();
        finishYuguru(state.battle, true);
      } finally {
        rollYuguruDrops = draw;
      }
      function assertRaidBattle() {
        if (state.battle?.raid !== 'yuguru') throw Error('Raid did not start');
      }
    },
    inspect() {
      return [...document.querySelectorAll('[data-raid-relic]')].map(canvas => {
        const item = TREASURE_ITEMS[Number(canvas.dataset.raidRelic)];
        const source = spriteTreasureV161(item.id);
        const pixels = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const actual = pixels(canvas), original = pixels(source), colors = new Set();
        let sameAlpha = true, sameArt = true;
        for (let i = 0; i < actual.length; i += 4) {
          if (actual[i+3]) colors.add(actual.slice(i,i+3).join(','));
          sameAlpha &&= actual[i+3] === original[i+3];
          for (let j = 0; j < 4; j++) sameArt &&= actual[i+j] === original[i+j];
        }
        return {id: item.id, sameAlpha, sameArt, colors: colors.size, name: item.name,
          label: canvas.parentElement.textContent.trim(), rarity: item.rarity,
          markup: canvas.parentElement.outerHTML};
      });
    }
  };
}

async function run() {
  const pages = {};
  for (const [key, file] of Object.entries(files)) {
    const html = fs.readFileSync(path.resolve(root, file), 'utf8');
    const i = html.lastIndexOf('})();');
    assert(i > 0);
    pages['/' + key] = html.slice(0, i) + '(' + attachTestControls.toString() + ')();\n' + html.slice(i);
  }
  const server = http.createServer((req,res) => {
    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'}).end(pages[req.url] || '');
  });
  await new Promise(ok => server.listen(0,'127.0.0.1',ok));
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', args:['--no-sandbox']});
  const url = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const build of ['normal','launcher']) for (const mobile of [false,true]) {
      const page = await browser.newPage({viewport: mobile ? {width:390,height:844} : {width:1280,height:900}, isMobile:mobile, hasTouch:mobile});
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      async function openRaid() {
        if (mobile) {
          await page.locator('[data-mobile-dock12521=more]').click();
          await page.locator('[data-mobile-open12521=raid]').click();
        } else await page.locator('[data-tab=raid]').click();
      }
      async function check(known) {
        const panel = await page.locator('.yuguru-panel').innerText();
        assert(!/初回撃破報酬|撃破1回ごとに抽選|才能の実 1%|仲間各120 XP・世界樹/.test(panel));
        const items = await page.evaluate(() => raidTest.inspect());
        assert.equal(items.length,2);
        for (const item of items) {
          const found = known.includes(item.id);
          assert(item.sameAlpha);
          assert.equal(item.sameArt,found);
          assert.equal(item.markup.includes(item.name),found);
          assert.equal(item.label,item.rarity + (found ? item.name : ''));
          if (found) assert(item.colors > 1);
          else assert.equal(item.colors,1);
        }
      }
      await page.goto(url+'/old');
      await page.locator('#ranchGuideDialog [data-guide-stop]').click();
      const previous = mobile ? -2 : null;
      await page.evaluate(id => raidTest.prepare(id),previous);
      await page.goto(url+'/'+build);
      await openRaid();
      const known = previous ? [previous] : [];
      await check(known);
      for (const id of [null,-1,-2]) {
        await page.locator('[data-raid-action=fight]').click();
        await page.evaluate(id => raidTest.finishWith(id),id);
        if (id && !known.includes(id)) known.push(id);
        await check(known);
        await page.reload();
        await openRaid();
        await check(known);
      }
      assert.deepEqual(errors,[]);
      console.log(build,mobile?'390 touch':'1280 desktop','PASS');
      await page.close();
    }
  } finally {await browser.close(); server.close();}
}
run().catch(e => {console.error(e);process.exitCode=1;});
