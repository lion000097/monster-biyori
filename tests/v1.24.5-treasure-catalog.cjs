'use strict';
const { assert, change, click, clone, open, persist } = require('./harness138.cjs');
const current = process.env.MONSTER_TARGET_VERSION || 'working';
const bosses = ['琥珀角のキリン', '嵐冠のグリフォン', '月環の九尾', '星詠みの天鯨'];

function showBook(game) {
  click(game.d, '.tab[data-tab="treasure"]');
  return [...game.d.querySelectorAll('.treasure-grid > .treasure-card')];
}

function lateAreaCards(game) {
  const cards = showBook(game);
  return bosses.flatMap((boss, index) => ['SSR', 'UR'].map((rarity, offset) => {
    const id = game.f.RELIC_START192 + 2 * (6 + index) + offset;
    const card = cards.find(el => el.querySelector('[data-treasure-index]')?.dataset.treasureIndex === String(id));
    assert(card, 'catalog card for ' + boss + ' ' + rarity);
    assert.match(card.querySelector('.relic-source192').textContent, new RegExp((index + 7) + '-5 ' + boss));
    assert(card.querySelector('.treasure-rarity').textContent.includes(rarity));
    return card;
  }));
}

async function run() {
  const fresh = await open(current);
  try {
    const cards = lateAreaCards(fresh);
    assert(cards.every(card => !card.hidden && !card.classList.contains('found')));
    assert(cards.every(card => card.querySelector('.treasure-name').textContent === '？？？？'));
    change(fresh.w, '[data-v138-treasure-filter="source"]', 'boss');
    change(fresh.w, '[data-v138-treasure-filter="discovery"]', 'missing');
    for (const [rarity, offset] of [['SSR', 0], ['UR', 1]]) {
      change(fresh.w, '[data-v138-treasure-filter="rarity"]', rarity);
      assert.deepEqual(cards.filter(card => !card.hidden), cards.filter((_, index) => index % 2 === offset));
    }
    assert.equal(fresh.f.state().treasures.length, 0);
  } finally { fresh.close(); }

  // Award through the previous game's boss loot path, including one repeating area beyond 10.
  const old = await open('1.24.4', {}, 'window.qa138.loot = rareBossLoot192;');
  let storage, owned, party;
  try {
    const state = old.f.state();
    state.speed = 0;
    state.adventure.stage = 61;
    for (const area of [7, 8, 9, 10, 12]) old.f.loot(area * 5, () => 0);
    owned = clone(state.treasures);
    party = clone(state.party);
    old.f.save(true);
    storage = persist(old.w);
  } finally { old.close(); }

  for (let pass = 0; pass < 2; pass++) {
    const game = await open(current, storage);
    try {
      const cards = lateAreaCards(game);
      const names = bosses.flatMap(name => [name + 'の黄金印', name + 'の虹彩秘宝']);
      assert.deepEqual(cards.map(card => card.querySelector('.treasure-name').textContent), names);
      assert(cards.every(card => card.classList.contains('found') && !card.hidden));
      assert.deepEqual(clone(game.f.state().treasures), owned);
      assert.deepEqual(clone(game.f.state().party), party);
      const last = game.d.querySelector('[data-treasure-index="' + owned.at(-1) + '"]');
      assert(last.closest('.treasure-card').classList.contains('found'));
      assert.match(last.closest('.treasure-card').textContent, /12-5/);
      change(game.w, '[data-v138-treasure-filter="discovery"]', 'owned');
      assert.equal(game.d.querySelectorAll('.treasure-card:not([hidden])').length, owned.length);
      game.f.save(true);
      storage = persist(game.w);
    } finally { game.close(); }
  }
  console.log('PASS eight early catalog entries, filters, earned relics, repeated areas and save/reload');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
