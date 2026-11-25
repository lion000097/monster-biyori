const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const names = ['木彫りのことり笛', '四つ葉のしおり', '花びらの小皿', '夕焼けごま',
  '朝露のブローチ', 'つばめの古鍵', '波音の砂時計', '月うさぎの手鏡'];
const ids = names.map((_, i) => -103 - i);

function instrument() {
  const museum = () => state.buildings.find(b => b.type === 'treasureMuseum213');
  function fixedRolls(values, fn) {
    const original = Math.random;
    let index = 0;
    Math.random = () => values[index++] ?? .99;
    try { return fn(); } finally { Math.random = original; }
  }
  window.bookQA = {
    ready: () => villageSheetReady && facilitySheetReady,
    seedOldSave() {
      state.speed = 0;
      state.adventure.stage = 51;
      state.adventure.auto = false;
      registerRelics192(11);
      for (const id of [0, 0, -101, -102, 35, 55, -1]) recordTreasure(id);
      state.buildings.push({ id: state.nextId++, type: 'expeditionOffice', x: 10, y: 6, level: 1, facing: 0 });
      state.buildings.push({ id: state.nextId++, type: 'treasureMuseum213', x: 6, y: 6,
        level: 1, facing: 0, exhibits213: [0, -101] });
      save(true);
    },
    inventory() {
      return { owned: [...state.treasures], copies: state.treasures.map(treasureCopies),
        displayed: museumItems213(museum()) };
    },
    collectAll(ids) {
      const receipts = [];
      for (const [i, id] of ids.entries()) {
        // Ten original N or R finds precede the four additions in either pool.
        const pick = (10 + i % 4 + .5) / 14;
        for (let stage = 1; stage <= 50; stage++) {
          const chest = fixedRolls([0, 0, i < 4 ? .25 : .75, pick],
            () => rewardTreasure(stage, stage % 5 === 0));
          if (chest !== id) throw Error('Unexpected treasure at stage ' + stage + ': ' + chest);
        }
        const rolls = [i < 4 ? .8 : .25, .99, pick];
        for (let area = 0; area < 10; area++) {
          const values = [...rolls];
          const item = rollExpeditionTreasure213(() => values.shift(), area);
          if (item !== id) throw Error('Unexpected expedition treasure at area ' + area + ': ' + item);
        }
        state.speed = 1;
        state.expeditionAuto213 = true;
        state.exploreProgress = 0;
        state.expeditionArea213 = i;
        const reward = fixedRolls(rolls, () => advanceExpedition(expeditionGoal213(i), true));
        state.speed = 0;
        receipts.push(reward);
      }
      save(true); renderUI(true);
      return receipts;
    },
    exhibit(id, add) {
      changeMuseum213(museum().id, id, add);
      return museumItems213(museum());
    }
  };
}

function game(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const end = text.lastIndexOf('})();');
  assert(end > 0);
  return text.slice(0, end) + '(' + instrument.toString() + ')();\n' + text.slice(end);
}

async function openBook(page, mobile) {
  await page.waitForFunction(() => bookQA.ready());
  if (mobile) await page.locator('[data-mobile-dock12521=adventure]').click();
  const tab = page.locator('.tab[data-tab=treasure]');
  if (await tab.isVisible()) await tab.click();
  else await page.locator('[data-v161-action=treasureTab]').click();
}

async function capture(page, ids) {
  return page.evaluate(ids => ids.map(id => {
    const canvas = document.querySelector('.treasure-grid canvas[data-treasure-index="' + id + '"]');
    const card = canvas.closest('.treasure-card'), css = getComputedStyle(canvas);
    const rgba = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    return { name: card.querySelector('.treasure-name').textContent,
      number: card.querySelector('.treasure-rarity').textContent,
      source: card.querySelector('.relic-source192').textContent,
      bg: getComputedStyle(card).backgroundColor, filter: css.filter, opacity: css.opacity,
      unknown: canvas.classList.contains('unknown'), src: canvas.toDataURL(),
      painted: rgba.some((v, ix) => ix % 4 === 3 && v > 0) };
  }), ids);
}

async function verify(browser, filename, mobile) {
  const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: mobile, hasTouch: mobile });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  const pages = { '/old': game('releases/1.25.39/' + filename), '/new': game('releases/1.25.40/' + filename) };
  await page.route('http://book.test/**', route => {
    const body = pages[new URL(route.request().url()).pathname];
    return route.fulfill({ status: body ? 200 : 404, contentType: 'text/html; charset=utf-8', body: body || '' });
  });
  try {
    await page.goto('http://book.test/old');
    await page.locator('#ranchGuideDialog [data-guide-stop]').click();
    await page.evaluate(() => bookQA.seedOldSave());
    const old = await page.evaluate(() => bookQA.inventory());
    await page.goto('http://book.test/new');
    await openBook(page, mobile);
    assert.match(await page.title(), /1\.25\.40/);
    assert.match(await page.locator('footer').textContent(), /1\.25\.40/);
    assert.deepEqual(await page.evaluate(() => bookQA.inventory()), old);
    const numbers = await page.locator('.treasure-grid .treasure-rarity').allTextContents();
    assert.deepEqual(numbers.map(s => s.split('No.')[1]),
      [...Array.from({ length: 66 }, (_, i) => String(i + 1).padStart(2, '0')), 'R01', 'R02']);
    const unseen = await capture(page, ids);
    const references = await capture(page, [1, 10]);
    for (const [i, item] of unseen.entries()) {
      assert(item.unknown && item.painted);
      assert.equal(item.name, '？？？？');
      assert.equal(item.number, '未発見 · No.' + (58 + i));
      assert.deepEqual([item.filter, item.opacity], [references[i < 4 ? 0 : 1].filter, references[i < 4 ? 0 : 1].opacity]);
      assert.match(item.source, /全冒険.*通常宝箱.*すべての探検先/);
    }
    const rarity = page.locator('[data-v138-treasure-filter=rarity]');
    for (const [tier, expected] of [['N', ids.slice(0, 4)], ['R', ids.slice(4)]]) {
      await rarity.selectOption(tier);
      const visible = await page.locator('.treasure-grid .treasure-card:visible canvas').evaluateAll(cs =>
        cs.map(c => Number(c.dataset.treasureIndex)));
      assert.equal(visible.length, 14);
      assert.deepEqual(visible.filter(id => ids.includes(id)), expected);
    }
    await rarity.selectOption('all');
    assert.deepEqual(await page.evaluate(ids => bookQA.collectAll(ids), ids), ids);
    const found = await capture(page, ids);
    assert.equal(new Set(found.map(t => t.src)).size, 8);
    for (const [i, item] of found.entries()) {
      assert(!item.unknown && item.painted);
      assert.equal(item.name, names[i]);
      assert.equal(item.number, (i < 4 ? 'N' : 'R') + ' · No.' + (58 + i));
      assert.equal(item.src, unseen[i].src);
      const shown = await page.evaluate(id => bookQA.exhibit(id, true), ids[i]);
      assert.deepEqual(shown, [0, -101, ids[i]]);
      if (i < ids.length - 1) await page.evaluate(id => bookQA.exhibit(id, false), ids[i]);
    }
    const inventory = await page.evaluate(() => bookQA.inventory());
    assert.deepEqual(inventory, { owned: [...old.owned, ...ids], copies: [...old.copies, ...Array(8).fill(51)],
      displayed: [0, -101, ids.at(-1)] });
    await page.reload();
    await openBook(page, mobile);
    assert.deepEqual(await page.evaluate(() => bookQA.inventory()), inventory);
    assert.deepEqual(await capture(page, ids), found);
    assert.deepEqual(errors, []);
    if (filename === 'game.html' && !mobile && process.env.TREASURE_CAPTURE) {
      fs.writeFileSync(process.env.TREASURE_CAPTURE, JSON.stringify({ unseen, found }));
    }
    console.log('PASS', filename, mobile ? '390px' : '1280px', '8 treasures / 50 stages / 10 expeditions / old save / museum');
  } finally { await page.close(); }
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const file of ['game.html', 'launcher-game.html']) for (const mobile of [false, true]) await verify(browser, file, mobile);
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
