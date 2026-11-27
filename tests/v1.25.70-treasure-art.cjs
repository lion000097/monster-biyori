'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const previous = '1.25.69';
const version = '1.25.70';
const marker = 'claimSave12556();\nconst didLoad=load();';
const atlas = fs.readFileSync(path.join(root, 'assets/adventure/frontier-treasures-11-15.png')).toString('base64');

function installFixture() {
  function entries() {
    registerRelics192();
    return TREASURE_ITEMS.flatMap((item, id) => {
      if (item.bossStage < 55 || item.bossStage > 75 || !item.bossStage) return [];
      return [{id, stage: item.bossStage, rarity: item.rarity, name: item.name, source: item.source}];
    });
  }
  window.treasureQA = {
    version: GAME_APP_VERSION,
    ready: () => !!state && !!colorIndices && villageSheetReady && facilitySheetReady,
    book() { tab = 'treasure'; renderUI(true); paintVillageCanvases(); },
    seed() {
      state.speed = 0;
      state.starterGuide = 'done';
      const list = entries();
      recordTreasure(0);
      for (const i of [0, 3, 4, 7, 8, 0]) recordTreasure(list[i].id);
      state.buildings.push(
        {id: state.nextId++, type:'relicStand', level:1, x:5, y:5, facing:0, relic:list[0].id},
        {id: state.nextId++, type:'treasureMuseum213', level:1, x:6, y:6, facing:0, exhibits213:[list[3].id]}
      );
      return validBackup213(state) && save(true);
    },
    inventory() {
      return {entries: entries(), owned: [...state.treasures], copies: state.treasures.map(treasureCopies),
        stand: displayedRelic(state.buildings.find(b => b.type === 'relicStand')),
        museum: museumItems213(state.buildings.find(b => b.type === 'treasureMuseum213'))};
    },
    collect() {
      for (let area = 11; area <= 15; area++) {
        const all = entries().filter(x => x.stage === area * 5);
        const counts = all.map(item => treasureCopies(item.id));
        const at = roll => rareBossLoot192(area * 5, () => roll);
        if (at(.001).length || at(.0001).join() !== String(all[0].id) ||
            at(0).join() !== all.map(x => x.id).join()) throw Error('Drop mismatch, area ' + area);
        if (treasureCopies(all[0].id) !== counts[0] + 2 || treasureCopies(all[1].id) !== counts[1] + 1)
          throw Error('Treasure quantity mismatch, area ' + area);
      }
      return validBackup213(state) && save(true);
    },
    entries, art: spriteTreasureV161, stand: standArt,
  };
}

const hooks = '(' + installFixture.toString() + ')();\n';
function instrument(html) {
  assert.equal(html.split(marker).length, 2);
  return html.replace(marker, hooks + marker);
}

async function checkArtwork(encoded) {
  const q = window.treasureQA;
  q.book();
  const sheet = new Image();
  sheet.src = 'data:image/png;base64,' + encoded;
  await sheet.decode();
  const rows = [];
  for (const item of q.entries()) {
    const column = item.stage / 5 - 11, row = Number(item.rarity === 'UR');
    const reference = document.createElement('canvas');
    reference.width = reference.height = 64;
    const g = reference.getContext('2d');
    g.drawImage(sheet, column * 64, row * 64, 64, 64, 0, 0, 64, 64);
    const referenceURL = reference.toDataURL();
    const canvas = document.querySelector(`.treasure-grid [data-treasure-index="${item.id}"]`);
    const card = canvas.closest('.treasure-card');
    const silhouette = canvas.classList.contains('unknown');
    const rawSprite = q.art(item.id);
    const stand = q.stand(1, 0, item.id);
    const base = q.stand(1, 0, null);
    rows.push({id:item.id, name:card.querySelector('.treasure-name').textContent, silhouette,
      filter:getComputedStyle(canvas).filter, source:card.querySelector('.relic-source192').textContent,
      correctSprite:rawSprite.width === 64 && rawSprite.toDataURL() === referenceURL,
      correctBook:canvas.toDataURL() === referenceURL,
      displayed:stand.toDataURL() !== base.toDataURL(), standImage:stand.toDataURL()});
  }
  return rows;
}

async function scenario(browser, compact) {
  const page = await browser.newPage({viewport:{width:compact ? 1280 : 390,height:860},hasTouch:!compact});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const base = 'http://127.0.0.1:8879/';
  const prior = fs.readFileSync(path.join(root, 'releases', previous, 'game.html'), 'utf8');
  const target = fs.readFileSync(path.join(root, compact ? 'releases/'+version+'/launcher-game.html' : 'game.html'), 'utf8');
  const unexpectedNetwork = [];
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url === base+'before') return route.fulfill({contentType:'text/html;charset=utf-8',body:instrument(prior)});
    if (url === base+'after') return route.fulfill({contentType:'text/html;charset=utf-8',body:compact?target:instrument(target)});
    unexpectedNetwork.push(url);
    return route.abort();
  });
  if (compact) {
    await page.addInitScript(({marker,hooks}) => {
      const original = Document.prototype.write;
      Document.prototype.write = function(...args) {
        if (typeof args[0] === 'string' && args[0].includes(marker)) args[0] = args[0].replace(marker,hooks+marker);
        return original.apply(this,args);
      };
    }, {marker,hooks});
  }
  const ready = () => page.waitForFunction(() => window.treasureQA?.ready());
  try {
    await page.goto(base+'before'); await ready();
    assert.equal(await page.evaluate(() => treasureQA.seed()), true);
    const before = await page.evaluate(() => treasureQA.inventory());
    assert.equal(before.entries.length, 10);
    const original = await page.evaluate(checkArtwork, atlas);
    assert(original.every(r => !r.correctSprite && !r.correctBook));
    await page.goto(base+'after'); await ready();
    assert.equal(await page.evaluate(() => treasureQA.version), version);
    assert.equal(await page.title(), 'もんすたー日和 Ver.1.25.70 | まもの牧場シミュレーション');
    assert.deepEqual(await page.evaluate(() => treasureQA.inventory()), before);
    const current = await page.evaluate(checkArtwork, atlas);
    assert.equal(current.length, 10);
    for (const [i,r] of current.entries()) {
      const entry = before.entries[i], owned = before.owned.includes(r.id);
      assert.equal(entry.stage, (11 + Math.floor(i/2))*5);
      assert.equal(entry.rarity, i%2 ? 'UR' : 'SSR');
      assert.equal(r.name, owned ? entry.name : '？？？？');
      assert.equal(r.silhouette, !owned);
      assert.equal(r.filter, original[i].filter);
      assert(r.source.includes(entry.source));
      assert(r.correctSprite && r.correctBook && r.displayed, 'Art mismatch for '+entry.name);
      assert.notEqual(r.standImage, original[i].standImage);
    }
    assert.equal(await page.evaluate(() => treasureQA.collect()), true);
    const all = await page.evaluate(() => treasureQA.inventory());
    assert(all.entries.every(e => all.owned.includes(e.id)));
    assert.equal(all.stand, before.stand); assert.deepEqual(all.museum, before.museum);
    await page.reload(); await ready();
    assert.deepEqual(await page.evaluate(() => treasureQA.inventory()), all);
    const collected = await page.evaluate(checkArtwork, atlas);
    assert(collected.every((r,i) => !r.silhouette && r.name === all.entries[i].name && r.correctBook));
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpectedNetwork, []);
    console.log('PASS', compact?'offline 1280px':'web 390px', 'ten exact atlas cells, old save, silhouettes, 10 stand images, boss drops, reload');
  } finally { await page.close(); }
}

(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM || undefined,args:['--no-sandbox']});
  try {
    for (const compact of [false,true]) await scenario(browser,compact);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
