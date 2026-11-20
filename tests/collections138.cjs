/* Run against the full integrated HTML, including its existing UI/save wrappers.
 * Standalone: MONSTER_QA_JSDOM=/path/to/jsdom node tests/collections138.cjs
 */
async function run(harness = require('./harness138.cjs')) {
  const { assert, clone, open, persist, change, click, backing } = harness;
  const checks = [];
  let fixture;
  let currentStorage;
  let savedIds;
  let selectedId;
  let bossOwnedId;
  try {
    fixture = await open('1.13.8');
    const { w, d, f } = fixture, state = f.state();
    assert.deepEqual(fixture.errors, [], 'new game starts without errors');
    assert(state.monsters.length >= 3, 'fixture has three original companions');
    const [high, favorite, other] = state.monsters;
    selectedId = favorite.id;
    const monsterArray = state.monsters;
    savedIds = clone(state.monsters.map(m => m.id));
    assert(state.monsters.every(m => m.favorite138 !== true && m.protected138 !== true), 'new companions start unlocked');

    f.selectMonster(favorite.id);
    click(d, '[data-v138-monster="favorite"]');
    assert.equal(favorite.favorite138, true, 'favorite button sets the flag');
    assert.equal(favorite.protected138, true, 'favorite button also protects');
    assert.equal(d.querySelector('[data-v138-monster="favorite"]').getAttribute('aria-pressed'), 'true');
    assert.equal(d.querySelector('[data-v138-monster="protect"]').getAttribute('aria-pressed'), 'true');
    assert.equal(d.querySelector('[data-v171-action="partMonster"]').disabled, true);
    assert.match(d.querySelector('#monsterProtectNote138').textContent, /保護中/);
    assert.match(d.querySelector(`.entity-row[data-id="${favorite.id}"] .v138-monster-badges`).textContent, /お気に入り.*保護中/);

    let confirmations = 0;
    w.confirm = () => { confirmations++; return true; };
    f.partWithMonster171(favorite.id);
    assert.equal(confirmations, 0, 'direct protected release is rejected before confirmation');
    assert.equal(state.monsters, monsterArray, 'rejected release does not replace the collection');
    assert.deepEqual(clone(state.monsters.map(m => m.id)), savedIds);
    click(d, '[data-v171-action="partMonster"]');
    assert.equal(confirmations, 0, 'disabled release button cannot invoke a confirmation');

    click(d, '[data-v138-monster="favorite"]');
    assert.equal(favorite.favorite138, false);
    assert.equal(favorite.protected138, true, 'removing favorite retains protection');
    assert.equal(d.querySelector('[data-v138-monster="favorite"]').getAttribute('aria-pressed'), 'false');
    w.confirm = () => { confirmations++; return false; };
    click(d, '[data-v138-monster="protect"]');
    assert.equal(favorite.protected138, true, 'canceling unlock keeps protection');
    w.confirm = () => { confirmations++; return true; };
    click(d, '[data-v138-monster="protect"]');
    assert.equal(favorite.protected138, false, 'confirming unlock changes protection');
    assert.equal(d.querySelector('[data-v171-action="partMonster"]').disabled, false);
    click(d, '[data-v138-monster="protect"]');
    assert.equal(favorite.protected138, true, 'independent protection can be restored');
    click(d, '[data-v138-monster="favorite"]');
    f.selectMonster(other.id);
    click(d, '[data-v138-monster="favorite"]');
    checks.push('DOM favorite/protection controls, independent unlock confirmation and function-level release guard');

    high.lv = 50; favorite.lv = 2; other.lv = 7;
    favorite.bond = 90; other.bond = 10;
    f.render('monster');
    change(w, '[data-v137-sort="monster"]', 'level');
    const rowIds = () => [...d.querySelectorAll('.entity-row[data-action="selectMonster"]')].map(row => Number(row.dataset.id));
    assert.deepEqual(rowIds(), [other.id, favorite.id, high.id], 'favorites precede higher-level nonfavorites');
    change(w, '[data-v137-sort="monster"]', 'bond');
    assert.deepEqual(rowIds(), [favorite.id, other.id, high.id], 'current sort still orders the favorite group');
    assert.equal(state.monsters, monsterArray);
    assert.deepEqual(clone(state.monsters.map(m => m.id)), savedIds, 'rendering never reorders the save collection');
    checks.push('favorite-first ordering through the full render chain without mutating saved order');

    f.registerRelics192(6);
    const items = f.TREASURE_ITEMS;
    const normalOwnedId = items.findIndex((item, id) => id < f.RELIC_START192 && item.rarity === 'N');
    bossOwnedId = items.findIndex(item => item.bossStage > 0 && item.rarity === 'SSR');
    assert(normalOwnedId >= 0 && bossOwnedId >= 0, 'known normal and boss treasure fixtures');
    state.treasures = [normalOwnedId, bossOwnedId];
    state.bestiary.treasures = state.treasures;
    f.render('treasure');
    const cards = [...d.querySelectorAll('.treasure-grid > .treasure-card')];
    const canvases = cards.map(card => card.querySelector('[data-treasure-index]'));
    const ids = cards.map(card => Number(card.querySelector('[data-treasure-index]').dataset.treasureIndex));
    const visibleIds = () => cards.flatMap((card, index) => card.hidden ? [] : [ids[index]]);
    assert.equal(d.querySelectorAll('[data-v138-treasure-tools]').length, 1, 'one filter toolbar');
    assert.equal(d.querySelectorAll('[data-v138-treasure-filter]').length, 3);
    assert.equal(visibleIds().length, cards.length, 'defaults include every card');
    const originalSprite = backing(canvases[ids.indexOf(normalOwnedId)]).toBuffer('image/png');
    const selectors = Object.fromEntries(['discovery', 'source', 'rarity'].map(key => [key, d.querySelector(`[data-v138-treasure-filter="${key}"]`)]));
    const setFilter = (key, value) => {
      const node = selectors[key];
      node.focus();
      assert.equal(d.activeElement, node, 'selector receives focus');
      change(w, node, value);
      assert.equal(d.activeElement, node, 'filter change preserves input focus');
      assert.equal(d.querySelector(`[data-v138-treasure-filter="${key}"]`), node, 'filter selector is not recreated');
    };
    setFilter('discovery', 'owned'); setFilter('source', 'boss'); setFilter('rarity', 'SSR');
    assert.deepEqual(visibleIds(), [bossOwnedId], 'all three conditions select the owned SSR boss treasure');
    setFilter('discovery', 'missing'); setFilter('rarity', 'UR');
    const expectedBossUR = ids.filter(id => items[id].bossStage > 0 && items[id].rarity === 'UR');
    assert(expectedBossUR.length > 0);
    assert.deepEqual(visibleIds(), expectedBossUR, 'missing boss UR entries retain their original IDs');
    setFilter('source', 'regular');
    const expectedRegularUR = ids.filter(id => id < f.RELIC_START192 && items[id].rarity === 'UR');
    assert(expectedRegularUR.length > 0);
    assert.deepEqual(visibleIds(), expectedRegularUR, 'regular treasures exclude boss relics');
    setFilter('discovery', 'owned'); setFilter('source', 'boss'); setFilter('rarity', 'N');
    assert.deepEqual(visibleIds(), [], 'nonmatching combined conditions hide every card');
    assert.equal(d.querySelector('[data-v138-treasure-empty]').hidden, false);
    assert.equal(d.querySelector('[data-v138-treasure-count]').textContent, '表示 0件');
    assert.deepEqual([...d.querySelectorAll('.treasure-grid > .treasure-card')], cards, 'card objects survive every filter change');
    assert.deepEqual([...d.querySelectorAll('.treasure-grid [data-treasure-index]')], canvases, 'sprite canvas objects survive every filter change');
    assert(backing(canvases[ids.indexOf(normalOwnedId)]).toBuffer('image/png').equals(originalSprite), 'sprite pixels are unchanged');
    setFilter('rarity', 'SSR');
    assert.deepEqual(visibleIds(), [bossOwnedId]);
    assert.equal(d.querySelector('[data-v138-treasure-empty]').hidden, true);
    checks.push('combined treasure filters, empty state, unchanged card IDs/canvases/pixels and maintained focus');

    assert.deepEqual(clone(state.treasureFilters138), { discovery: 'owned', source: 'boss', rarity: 'SSR' });
    f.save(true);
    currentStorage = persist(w);
    fixture.close(); fixture = null;

    fixture = await open('1.13.8', currentStorage);
    const restored = fixture.f.state();
    assert.deepEqual(clone(restored.monsters.map(m => m.id)), savedIds, 'new-save IDs survive roundtrip');
    assert.equal(restored.monsters.find(m => m.id === selectedId).favorite138, true);
    assert.equal(restored.monsters.find(m => m.id === selectedId).protected138, true);
    fixture.f.render('treasure');
    for (const [key, value] of Object.entries({ discovery: 'owned', source: 'boss', rarity: 'SSR' })) {
      assert.equal(fixture.d.querySelector(`[data-v138-treasure-filter="${key}"]`).value, value, 'saved filter is restored');
    }
    assert.deepEqual([...fixture.d.querySelectorAll('.treasure-grid > .treasure-card')].filter(card => !card.hidden).map(card => Number(card.querySelector('[data-treasure-index]').dataset.treasureIndex)), [bossOwnedId]);
    checks.push('new-save reload preserves favorite/protection flags, monster IDs and filter preferences');
    fixture.close(); fixture = null;

    fixture = await open('1.13.7');
    const legacySnapshot = clone(fixture.f.state().monsters.map(m => ({ id: m.id, kind: m.kind, name: m.name, lv: m.lv })));
    assert(fixture.f.state().monsters.every(m => !Object.prototype.hasOwnProperty.call(m, 'favorite138') && !Object.prototype.hasOwnProperty.call(m, 'protected138')));
    fixture.f.save(true);
    const legacyStorage = persist(fixture.w);
    fixture.close(); fixture = null;
    fixture = await open('1.13.8', legacyStorage);
    const migrated = fixture.f.state();
    assert.deepEqual(clone(migrated.monsters.map(m => ({ id: m.id, kind: m.kind, name: m.name, lv: m.lv }))), legacySnapshot, 'legacy companions are retained unchanged');
    assert(migrated.monsters.every(m => m.favorite138 !== true && m.protected138 !== true), 'missing flags default to false');
    fixture.f.selectMonster(migrated.monsters[0].id);
    assert.equal(fixture.d.querySelector('[data-v138-monster="favorite"]').getAttribute('aria-pressed'), 'false');
    assert.equal(fixture.d.querySelector('[data-v138-monster="protect"]').getAttribute('aria-pressed'), 'false');
    fixture.f.render('treasure');
    assert([...fixture.d.querySelectorAll('[data-v138-treasure-filter]')].every(node => node.value === 'all'), 'missing filter preferences default to all');
    assert.deepEqual(fixture.errors, [], 'legacy upgrade and all UI actions have no console errors');
    checks.push('1.13.7 save upgrades with no lost companions and optional flags/filters defaulting safely');
    fixture.close(); fixture = null;
    return { suite: 'collections138', status: 'PASS', checks };
  } finally {
    if (fixture) fixture.close();
  }
}

module.exports = run;
if (require.main === module) run().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error); process.exitCode = 1; });
