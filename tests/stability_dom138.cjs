'use strict';
const { assert, open, click, change, advance, near, clone } = require('./harness138.cjs');

function coreState(s) {
  return clone({
    food: s.food, coins: s.coins, stock: s.stock, day: s.day, hour: s.hour, ticks: s.ticks,
    exploreProgress: s.exploreProgress,
    monsters: s.monsters.map(m => ({id: m.id, x: m.x, y: m.y, path: m.path, produce: m.produce})),
    staff: s.staff.map(w => ({id: w.id, x: w.x, y: w.y, path: w.path,
      jobTask212: w.jobTask212, work: w.work})),
    guests: s.guests.map(g => ({x: g.x, y: g.y, wait212: g.wait212,
      checkedOut211: g.checkedOut211, phase212: g.phase212})),
    battle: s.battle,
  });
}

async function run() {
  const results = [];
  {
    const q = await open();
    try {
      const {f, d, frames} = q, s = f.state();
      const farm = s.buildings.find(b => b.type === 'farm');
      const worker = s.staff.find(w => w.job === 'gather');
      assert(farm && worker, 'initial farm and gather worker');
      Object.assign(worker, {morale: 80, fatigue: 0, level: 1, path: [], jobTarget211: null,
        jobTask212: {id: farm.id, job: 'gather', duration: 3.1, remaining: .05}});
      const shop = {id: 500, type: 'shop', level: 1, x: 6, y: 6, w: 2, h: 2};
      s.buildings.push(shop);
      const spot = f.shopQueueSpots212(shop)[0];
      assert(spot, 'shop has a real walkable queue position');
      const guest = {
        name: 'ポロ', gender: '男', x: spot.x, y: spot.y, tx: spot.x, ty: spot.y,
        life: 100, bob: 0, spent: 0, shopId200: shop.id, shopVisited200: false,
        shopX200: spot.x, shopY200: spot.y, shopPath200: [], entryPath101: [],
        fromOutside101: true, rare211: false, entered211: true, arrived211: false,
        phase212: 'queue', route212: [], moveTarget212: [spot.x, spot.y],
        queueOrder212: 1, queueRank212: 0, wait212: 2.15, queueTotal212: 0,
      };
      s.guests = [guest];
      s.materialStock211 = s.materialStock211.map((_, i) => i === 0 ? 100 : 0);
      s.stock = 100;
      f.startAdventure();
      click(d, '[data-speed="0"]');
      const before = coreState(s), foodBefore = s.food, coinsBefore = s.coins;
      const completedBefore = worker.work || 0;
      assert(frames.length >= 1, 'startup frame captured');
      frames[0](f.timing().frameAt + 100);
      assert.deepEqual(coreState(s), before, 'first startup callback respects pause');
      advance(f, 1);
      assert.deepEqual(coreState(s), before, 'paused worker, shopper, clock, battle and positions stay fixed');
      assert.match(d.querySelector('#autoLabel').textContent, /一時停止/);
      click(d, '[data-speed="1"]');
      advance(f, .2);
      assert.equal(worker.jobTask212, null, 'pending staff work finishes after resume');
      assert.equal(worker.work, completedBefore + 1);
      near(s.food, foodBefore + 2.9);
      assert.equal(guest.checkedOut211, true, 'actual guest checkout completes after resume');
      assert.ok(s.coins > coinsBefore, 'actual checkout awards money');
      assert.ok(s.stock < 100, 'actual checkout consumes stock');
      results.push({name: 'ui_pause_startup_resume', result: 'PASS',
        foodGain: s.food - foodBefore, checkoutCoins: s.coins - coinsBefore});
    } finally { q.close(); }
  }

  {
    const q = await open();
    try {
      const {f, w, d} = q, s = f.state();
      click(d, '[data-speed="1"]');
      f.setTiming({tickAccum: .99, motionBuffer137: 0, uiAt: 0, savingAt: 0});
      const ticksBefore = s.ticks, progressBefore = s.exploreProgress;
      Object.defineProperty(d, 'visibilityState', {configurable: true, value: 'hidden'});
      d.dispatchEvent(new w.Event('visibilitychange'));
      near(f.timing().tickAccum, .99);
      f.animate(f.timing().frameAt + 120000);
      near(f.timing().tickAccum, .99);
      assert.equal(s.ticks, ticksBefore);
      near(s.exploreProgress, progressBefore);
      Object.defineProperty(d, 'visibilityState', {configurable: true, value: 'visible'});
      d.dispatchEvent(new w.Event('visibilitychange'));
      near(f.timing().tickAccum, .99);
      advance(f, .3);
      assert.equal(s.ticks, ticksBefore + 1, 'earned fraction reaches one game-hour update');
      near(f.timing().tickAccum, .99 + .3 / 16 - 1);
      near(s.exploreProgress - progressBefore, .3 * .75);
      results.push({name: 'visibility_fraction_without_catchup', result: 'PASS',
        ticksAfterReturn: s.ticks - ticksBefore, expeditionProgress: s.exploreProgress - progressBefore});
    } finally { q.close(); }
  }

  {
    const q = await open();
    try {
      const {f, w, d} = q, s = f.state();
      s.adventure.stage = 11;
      f.render('adventure');
      const selector = d.querySelector('#areaSelect213');
      assert(selector, 'real expedition destination selector');
      change(w, selector, '1');
      assert.equal(s.expeditionArea213, 1);
      assert.match(s.log[0].msg, /2-1 水晶の洞窟/);
      assert.match(d.querySelector('#areaSelect213').selectedOptions[0].textContent, /^2-1/);
      assert.match(d.querySelector('#tabBody').textContent, /進行速度\+8%/);

      const template = clone(s.monsters[0]);
      const setCount = count => { s.monsters = Array.from({length: count}, (_, i) => ({...clone(template), id: 100 + i})); };
      s.food = 1000; s.coins = 1000;
      s.eggs = [{id: 600, kind: 0, shiny: false, time: 22, need: 22}];
      const card = () => d.querySelector('#tabBody > .quest');
      const summary = () => [...d.querySelectorAll('#tabBody > .info-card')]
        .find(node => node.textContent.startsWith('🥚 ふ化準備完了'))?.textContent;
      const tip = () => d.querySelector('#dailyTip').textContent;

      s.villageLv = 1; setCount(4); f.render('monster');
      assert.match(card().textContent, /満員/);
      assert.match(card().querySelector('.option-desc').textContent, /世界樹/);
      assert.doesNotMatch(card().querySelector('.option-desc').textContent, /ハウス/);
      assert.equal(tip(), summary(), 'tree-cap tip and header use identical shared status');

      s.villageLv = 20; setCount(7); f.render('monster');
      assert.match(card().querySelector('.option-desc').textContent, /ハウス/);
      assert.doesNotMatch(card().querySelector('.option-desc').textContent, /世界樹/);
      assert.equal(tip(), summary(), 'housing-cap tip and header agree');

      s.villageLv = 6; setCount(7); f.render('monster');
      assert.match(card().querySelector('.option-desc').textContent, /世界樹/);
      assert.match(card().querySelector('.option-desc').textContent, /ハウス/);
      assert.equal(tip(), summary(), 'both caps have one consistent explanation');

      setCount(6); click(d, '[data-speed="1"]');
      assert.match(card().querySelector('.quest-title').textContent, /次の時間更新待ち/);
      assert.doesNotMatch(card().textContent, /満員/);
      assert.equal(tip(), summary());

      click(d, '[data-speed="0"]');
      assert.match(card().querySelector('.quest-title').textContent, /一時停止/);
      assert.match(card().querySelector('.option-desc').textContent, /再開後/);
      assert.equal(tip(), summary());
      assert.equal(s.eggs.length, 1, 'UI changes never hatch or consume an egg');
      results.push({name: 'actual_expedition_and_hatch_ui', result: 'PASS',
        cases: ['route 2-1', 'tree cap', 'housing cap', 'both caps', 'ready with space', 'paused']});
    } finally { q.close(); }
  }
  return results;
}

module.exports = {run};
if (require.main === module) run().then(results => console.log(JSON.stringify({result: 'PASS', results}, null, 2)))
  .catch(error => { console.error(error.stack || error); process.exitCode = 1; });
