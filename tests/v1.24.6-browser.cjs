'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const key = 'monster_biyori_save_v1';

// Installed in the two in-memory test pages only. Use the game's own save,
// placement, rarity draw and production functions with a reproducible farm.
function installFarmTest() {
  function placeNearCenter(type) {
    const plots = [];
    for (let x = 1; x < 21; x++) {
      for (let y = 1; y < 17; y++) plots.push({x, y, distance: Math.hypot(x - 10, y - 7)});
    }
    plots.sort((a, b) => a.distance - b.distance);
    for (const {x, y} of plots) {
      for (let facing = 0; facing < 4; facing++) {
        placementFacing = facing;
        if (!canBuild(x, y, null, false, type)) continue;
        place(type, x, y);
        const building = state.buildings.find(b => b.type === type && b.x === x && b.y === y);
        if (building) return building;
      }
    }
    throw Error('Could not place test facility ' + type);
  }

  window.farmTest = {
    ready: () => facilitySheetReady && villageSheetReady && !!colorIndices,
    seedPrevious() {
      state.speed = 0;
      state.day = 24;
      state.coins = 12345;
      state.worldTreeLevel = state.villageLv = state.buildings.find(b => b.type === 'worldtree').level = 12;
      state.monsters[0].lv = 8;
      state.monsters[0].gift212 = 1;
      const first = placeNearCenter('relicStand');
      const second = placeNearCenter('relicStand');
      placeNearCenter('ranch');
      const [seal, jewel] = rareBossLoot192(35, () => 0);
      const [busy] = rareBossLoot192(40, () => 0);
      first.relic = seal;
      first.sightseers = 3;
      second.relic = busy;
      state.materialStock211.fill(0);
      state.materialStock211[0] = 5;
      state.materialStock211[18] = 2.5;
      state.materialSeen211 = [0, 18, 29];
      state.catalogSeen137.material = [0, 18, 29];
      ensureMaterials211();
      return {first: first.id, seal, jewel, busy};
    },
    standPoint(id) {
      const stand = mapPickItems.find(item => item.building?.id === id);
      if (!stand) return null;
      const {rect} = stand, origin = mapScreenOrigin(), box = canvas.getBoundingClientRect();
      for (let y = rect.y + rect.h / 2; y < rect.y + rect.h; y += 4) {
        for (let x = rect.x + rect.w / 4; x < rect.x + rect.w; x += 4) {
          const margin = 4;
          const inside = [[0, 0], [margin, margin], [-margin, margin], [margin, -margin], [-margin, -margin]]
            .every(([dx, dy]) => pickMapActorOrFacility({px: x + dx, py: y + dy})?.building?.id === id);
          if (!inside) continue;
          const fx = (origin.x + x * zoom) / (VW * T), fy = (origin.y + y * zoom) / (VH * T);
          if (fx > .02 && fx < .98 && fy > .02 && fy < .98)
            return {x: fx * box.width, y: fy * box.height};
        }
      }
      return null;
    },
    produceNew() {
      const original = Math.random;
      try {
        for (let id = 30; id < 42; id++) {
          const rarity = MATERIALS211[id][3], pool = materialPools139[rarity];
          const rolls = [{N: .8, R: .12, SR: .035}[rarity], .9, (pool.indexOf(id) + .5) / pool.length];
          Math.random = () => rolls.length ? rolls.shift() : original();
          ranchProduction200(state.monsters[0], true);
        }
      } finally { Math.random = original; }
    }
  };
}

function testPage(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const marker = '})();\n</script>';
  assert.equal(source.split(marker).length, 2);
  return source.replace(marker, () => '(' + installFarmTest.toString() + ')();\n' + marker);
}

function farmRecords(s) {
  const {createdAt, coins, day, hour, speed, food, magic, villageLv, party, paths, treasures, catalog, adventure} = s;
  return {createdAt, coins, day, hour, speed, food, magic, villageLv, party, paths, treasures, catalog, adventure,
    buildings: s.buildings.map(({id, type, x, y, facing, level, sightseers, relic}) =>
      [id, type, x, y, facing, level, sightseers, relic]),
    monsters: s.monsters.map(({id, kind, name, lv, xp}) => [id, kind, name, lv, xp]),
    staff: s.staff.map(({id, name, job}) => [id, name, job])};
}

async function verify(browser, base, mobile) {
  const context = await browser.newContext({viewport: mobile ? {width: 390, height: 844} : {width: 1366, height: 900},
    isMobile: mobile, hasTouch: mobile, locale: 'ja-JP'});
  const page = await context.newPage(), errors = [];
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  const saved = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
  const click = selector => mobile ? page.locator(selector).tap() : page.locator(selector).click();
  async function openGame(url) {
    await page.goto(base + url);
    await page.waitForFunction(() => window.farmTest?.ready());
  }
  async function book() {
    await click('[data-tab="bestiary"]');
    await click('[data-action="atlas"][data-id="material"]');
  }
  async function selectStand(id) {
    const map = page.locator('#game');
    await map.scrollIntoViewIfNeeded();
    const point = await page.waitForFunction(id => window.farmTest.standPoint(id), id);
    const position = await point.jsonValue();
    if (mobile) await map.tap({position});
    else await map.click({position});
    assert.equal(await page.locator('#mapStandOpen').getAttribute('data-stand-open'), String(id));
  }
  const placeButton = id => '[data-place-relic="' + id + '"]';
  try {
    await openGame('/previous');
    await click('[data-speed="0"]');
    const {first, seal, jewel, busy} = await page.evaluate(() => window.farmTest.seedPrevious());
    await click('#saveBtn');
    await openGame('/previous');
    await click('#saveBtn');
    const old = await saved();
    assert.equal(old.materialStock211.length, 30);
    await openGame('/current');
    await click('#saveBtn');
    const migrated = await saved();
    assert.deepEqual(farmRecords(migrated), farmRecords(old));
    assert.deepEqual(migrated.materialStock211, [...old.materialStock211, ...Array(12).fill(0)]);
    assert.deepEqual(migrated.materialSeen211, old.materialSeen211);
    assert.equal(migrated.stock, old.stock);
    await book();
    const cards = page.locator('.material-card');
    assert.equal(await cards.count(), 42);
    assert.equal(await page.locator('.material-card.found').count(), 3);
    assert.match(await cards.nth(29).innerText(), /空鯨の虹真珠/);
    assert.match(await cards.nth(30).innerText(), /未発見/);
    assert.match(await cards.nth(41).innerText(), /No\.42/);

    await page.evaluate(() => window.farmTest.produceNew());
    await book();
    await click('#saveBtn');
    const produced = await saved();
    assert.deepEqual(produced.materialStock211.slice(0, 30), old.materialStock211);
    assert(produced.materialStock211.slice(30).every(n => n > 0));
    assert.equal(produced.stock, produced.materialStock211.reduce((sum, n) => sum + n, 0));
    assert.equal(await page.locator('.material-card.found').count(), 15);
    const filter = page.locator('[data-v137-atlas-filter]');
    await filter.selectOption('new');
    assert.equal(await page.locator('.material-card:visible').count(), 12);
    const icons = await page.locator('.material-card:visible').evaluateAll(nodes => nodes.map(node => {
      const icon = node.querySelector('.material-pixel'), css = getComputedStyle(icon);
      return [node.querySelector('.treasure-name').textContent, node.querySelector('.treasure-rarity').textContent,
        icon.dataset.materialArt, css.backgroundSize, css.backgroundPosition, css.backgroundImage.startsWith('url("data:image/png')];
    }));
    for (const [i, [name, label, art, size, position, embedded]] of icons.entries()) {
      assert(name.length > 0 && art && embedded);
      assert.equal(label, ['N', 'R', 'SR'][Math.floor(i / 4)] + ' · No.' + (i + 31));
      assert.equal(size, '600% 700%');
      const [x, y] = position.split(' ').map(parseFloat);
      assert.equal(x, (i % 6) * 20);
      assert(Math.abs(y - Math.floor((i + 30) / 6) * 100 / 6) < .001);
    }
    assert.equal(new Set(icons.map(icon => icon[2])).size, 12);
    await filter.selectOption('missing');
    assert.equal(await page.locator('.material-card:visible').count(), 27);
    await selectStand(first);
    await click('#mapStandOpen');
    assert.equal(await page.locator('#helpTitle').innerText(), 'お宝を設置');
    assert(await page.locator(placeButton(seal)).isDisabled());
    assert(await page.locator(placeButton(busy)).isDisabled());
    assert(await page.locator('#standItems canvas').evaluateAll(canvases =>
      canvases.length > 0 && canvases.every(c => c.getContext('2d').getImageData(0, 0, c.width, c.height)
        .data.some((n, index) => index % 4 === 3 && n > 0))));
    await click(placeButton(jewel));
    const displayed = async () => (await saved()).buildings.find(b => b.id === first).relic;
    assert.equal(await displayed(), jewel);
    await click('#detailStandOpen');
    await click(placeButton(''));
    assert.equal(await displayed(), null);
    await click('#detailStandOpen');
    await click(placeButton(jewel));
    assert.equal(await displayed(), jewel);
    await click('#saveBtn');
    const final = await saved();
    await openGame('/current');
    await click('#saveBtn');
    const reopened = await saved();
    assert.deepEqual(farmRecords(reopened), farmRecords(final));
    assert.deepEqual(reopened.materialSeen211, produced.materialSeen211);
    assert.deepEqual(reopened.materialStock211, produced.materialStock211);
    await book();
    assert.equal(await page.locator('.material-card.found').count(), 15);
    await selectStand(first);
    assert.equal(await page.locator('[data-stand]').inputValue(), String(jewel));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    console.log('PASS ' + (mobile ? '390×844 touch' : '1366×900 mouse') +
      ' — 1.24.5 save, 12 ranch drops, catalog artwork/filters, both stand controls, duplicate guard and reload');
  } finally { await context.close(); }
}

(async () => {
  const release = 'releases/1.24.6/game.html';
  const pages = {'/previous': testPage('releases/1.24.5/game.html'),
    '/current': testPage(fs.existsSync(path.join(root, release)) ? release : 'game.html')};
  const server = http.createServer((req, res) => {
    if (!pages[req.url]) { res.writeHead(204); res.end(); return; }
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
    res.end(pages[req.url]);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.MONSTER_CHROMIUM || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-dev-shm-usage']});
    const base = 'http://127.0.0.1:' + server.address().port;
    await verify(browser, base, false);
    await verify(browser, base, true);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
