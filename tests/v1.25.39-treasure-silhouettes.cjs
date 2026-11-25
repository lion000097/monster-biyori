const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const treasures = [
  { id: -101, reference: 29, name: '月花のオルゴール' },
  { id: -102, reference: 30, name: '星渡りの天球儀' }
];

function installFixture() {
  const museum = () => state.buildings.find(b => b.type === 'treasureMuseum213');
  window.treasureTest = {
    ready: () => villageSheetReady && facilitySheetReady,
    seed() {
      state.speed = 0;
      recordTreasure(0);
      state.buildings.push({ id: state.nextId++, type: 'treasureMuseum213', level: 1,
        x: 6, y: 6, facing: 0, exhibits213: [0] });
      save(true);
    },
    collectAndExhibit(rarityRoll) {
      const original = Math.random;
      const rolls = [0, 0, rarityRoll, .9999];
      let id;
      try {
        Math.random = () => rolls.shift() ?? .99;
        id = rewardTreasure(1, false);
      } finally {
        Math.random = original;
      }
      changeMuseum213(museum().id, id, true);
      return id;
    },
    inventory() {
      return { owned: [...state.treasures], copies: state.treasures.map(treasureCopies),
        exhibits: museumItems213(museum()) };
    }
  };
}

function testedHtml(file) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const at = html.lastIndexOf('})();');
  assert(at > 0);
  return html.slice(0, at) + '(' + installFixture.toString() + ')();\n' + html.slice(at);
}

async function openBook(page, mobile) {
  await page.waitForFunction(() => treasureTest.ready());
  if (mobile) await page.locator('[data-mobile-dock12521=adventure]').click();
  const tab = page.locator('.tab[data-tab=treasure]');
  if (await tab.isVisible()) await tab.click();
  else await page.locator('[data-v161-action=treasureTab]').click();
}

async function appearance(page, id) {
  const canvas = page.locator(`.treasure-grid canvas[data-treasure-index="${id}"]`);
  const result = await canvas.evaluate(el => {
    const card = el.closest('.treasure-card');
    const style = getComputedStyle(el);
    const ctx = el.getContext('2d');
    const pixels = ctx.getImageData(0, 0, el.width, el.height).data;
    return { style: [style.filter, style.opacity], hiddenArt: el.classList.contains('unknown'),
      name: card.querySelector('.treasure-name').textContent, pixels: el.toDataURL(),
      painted: pixels.some((channel, i) => i % 4 === 3 && channel > 0) };
  });
  assert(result.painted, `Blank sprite for ${id}`);
  result.pixels = createHash('sha256').update(result.pixels).digest('hex');
  return result;
}

async function verify(browser, file, mobile) {
  const old = testedHtml(`releases/1.25.38/${file}`);
  const updated = testedHtml(file === 'game.html' ? file : `releases/1.25.39/${file}`);
  const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: mobile, hasTouch: mobile });
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.route('http://treasure.test/**', route => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname === '/old' ? old : pathname === '/new' ? updated : '';
    return route.fulfill({ status: body ? 200 : 404, contentType: 'text/html; charset=utf-8', body });
  });
  const visit = async version => {
    await page.goto('http://treasure.test/' + version);
    await openBook(page, mobile);
  };
  const inventory = () => page.evaluate(() => treasureTest.inventory());
  const collect = roll => page.evaluate(r => treasureTest.collectAndExhibit(r), roll);
  try {
    await page.goto('http://treasure.test/old');
    await page.locator('#ranchGuideDialog [data-guide-stop]').click();
    await page.evaluate(() => treasureTest.seed());
    await openBook(page, mobile);
    const initial = await inventory();
    const art = new Map();
    for (const { id, reference } of treasures) {
      const before = await appearance(page, id);
      assert.notDeepEqual(before.style, (await appearance(page, reference)).style);
      art.set(id, before.pixels);
    }

    await visit('new');
    assert.match(await page.title(), /1\.25\.39/);
    assert.match(await page.locator('footer').textContent(), /1\.25\.39/);
    assert.deepEqual(await inventory(), initial);
    for (const { id, reference } of treasures) {
      const unseen = await appearance(page, id);
      assert.equal(unseen.name, '？？？？');
      assert(unseen.hiddenArt);
      assert.deepEqual(unseen.style, (await appearance(page, reference)).style);
      assert.equal(unseen.pixels, art.get(id));
    }

    await visit('old');
    assert.equal(await collect(.995), -101);
    const mixed = await inventory();
    assert.deepEqual(mixed.exhibits, [0, -101]);
    await visit('new');
    assert.deepEqual(await inventory(), mixed);
    const discoveredStyle = (await appearance(page, 0)).style;
    assert.deepEqual((await appearance(page, -101)).style, discoveredStyle);
    assert((await appearance(page, -102)).hiddenArt);
    assert.equal(await collect(.9999), -102);
    const complete = { owned: [0, -101, -102], copies: [1, 1, 1], exhibits: [0, -101, -102] };
    assert.deepEqual(await inventory(), complete);
    await page.reload();
    await openBook(page, mobile);
    assert.deepEqual(await inventory(), complete);
    for (const { id, name } of treasures) {
      const found = await appearance(page, id);
      assert.equal(found.name, name);
      assert.equal(found.hiddenArt, false);
      assert.deepEqual(found.style, discoveredStyle);
      assert.equal(found.pixels, art.get(id));
    }
    assert.deepEqual(errors, []);
    console.log('PASS', file, mobile ? '390px touch' : '1280px desktop');
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const file of ['game.html', 'launcher-game.html']) {
      for (const mobile of [false, true]) await verify(browser, file, mobile);
    }
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
