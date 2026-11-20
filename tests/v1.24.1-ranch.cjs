'use strict';
const {assert, open, clone, persist, click, change, near, wait, KEY} = require('./harness138.cjs');

const common = `Object.assign(window.qa138, {
  encounter: encounterGenerator199, catalogue: ENEMIES, trophies: ACHIEVEMENTS193,
  frontiers: frontierAreas, check: checkAchievements193
});`;
const current = `Object.assign(window.qa138, {
  center: cameraCenter, ground: screenGround, draw: drawWorld, overview: () => cachedOverview
});`;

async function openRanch(version, storage, hooks = '') {
  const game = await open(version, storage, hooks +
    'window.qa138.artReady = () => facilitySheetReady && villageSheetReady && treeDecorationReady;');
  for (let i = 0; i < 120 && !game.f.artReady(); i++) await wait(25);
  assert(game.f.artReady());
  return game;
}

function sampleRosters({w, f}) {
  // Sample the original encounter generator independently of the atlas, including two later cycles.
  const random = w.Math.random;
  let seed = 127;
  w.Math.random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  try {
    const groups = [];
    for (let n = 1; n <= 22; n++) {
      const ids = new Set();
      for (let slot = 1; slot <= 5; slot++) {
        for (let round = 0; round < 35; round++) {
          for (const foe of f.encounter((n - 1) * 5 + slot).foes) ids.add(foe.index);
        }
      }
      groups.push([...ids].sort((a, b) => a - b));
    }
    return groups;
  } finally { w.Math.random = random; }
}

function visibleEnemyIds(d) {
  return Array.from(d.querySelectorAll('.treasure-grid .treasure-card'))
    .flatMap((card, id) => card.style.display === 'none' ? [] : [id]);
}

async function run() {
  const old = await openRanch('1.24.0', {}, common);
  let storage, pools, oldTrophyIds, frontierFriends;
  try {
    const {f, w} = old, s = f.state();
    pools = sampleRosters(old);
    oldTrophyIds = clone(f.trophies.map(a => a.id));
    frontierFriends = clone(f.frontiers.flatMap(area => [area.normal[0], area.boss]).map(id => f.catalogue[id].allyId));
    s.speed = 0;
    s.catalog.enemies = [...pools[6], ...pools[7].slice(0, -1), 9];
    s.catalog.defeated = [pools[6][0]];
    s.catalog.friends.push(...frontierFriends);
    s.catalog.shinies = [frontierFriends[3]];
    s.catalogSeen137.enemy = [9];
    f.check(true);
    s.selectedTitle212 = 'friends5';
    f.save(true);
    storage = persist(w);
  } finally { old.close(); }

  const game = await openRanch('1.24.1', storage, common + current);
  let saved;
  try {
    const {d, w, f} = game, s = f.state(), prior = JSON.parse(storage[KEY]);
    assert.deepEqual(sampleRosters(game), pools);
    for (const key of ['catalog', 'party', 'selectedTitle212', 'treasures']) assert.deepEqual(clone(s[key]), prior[key]);
    assert.deepEqual(clone(s.monsters.map(m => m.id)), prior.monsters.map(m => m.id));
    assert.equal(f.trophies.length, oldTrophyIds.length + 12);
    assert.equal(new Set(f.trophies.map(a => a.id)).size, f.trophies.length);
    assert(oldTrophyIds.every(id => f.trophies.some(a => a.id === id)));
    assert(s.achievements.includes('areaAtlas7') && !s.achievements.includes('areaAtlas8'));
    assert(s.achievements.includes('frontierFriends') && s.achievements.includes('frontierShiny'));

    click(d, '[data-tab="bestiary"]');
    click(d, '[data-action="atlas"][data-id="enemy"]');
    assert.equal(visibleEnemyIds(d).length, f.catalogue.length);
    for (let n = 1; n <= 16; n++) {
      change(w, '#enemyAtlasArea', String(n));
      assert.deepEqual(visibleEnemyIds(d), pools[n-1], 'area ' + n);
      if (n > 10) assert.deepEqual(visibleEnemyIds(d), pools[n+5], 'repeating area ' + (n+6));
    }
    change(w, '#enemyAtlasArea', 'archive');
    assert.deepEqual(visibleEnemyIds(d), Array.from({length:f.catalogue.length}, (_, i) => i)
      .filter(id => !pools.some(pool => pool.includes(id))));
    change(w, '#enemyAtlasArea', '8');
    change(w, '[data-v137-atlas-filter]', 'missing');
    assert.deepEqual(visibleEnemyIds(d), [pools[7].at(-1)]);
    const undiscovered = d.querySelectorAll('.treasure-grid .treasure-card')[pools[7].at(-1)];
    assert(undiscovered.textContent.includes('未遭遇') && !undiscovered.querySelector('canvas'));
    change(w, '[data-v137-atlas-filter]', 'found');
    assert.deepEqual(visibleEnemyIds(d), pools[7].slice(0, -1));
    change(w, '[data-v137-atlas-filter]', 'new');
    change(w, '#enemyAtlasArea', '7');
    click(d, '[data-v137-read="enemy"]');
    assert.equal(visibleEnemyIds(d).length, 0);
    assert(d.querySelector('#tabBody').textContent.includes('表示 0 / 5件'));
    change(w, '#enemyAtlasArea', '8');
    assert.deepEqual(visibleEnemyIds(d), pools[7].slice(0, -1));
    click(d, '[data-action="atlas"][data-id="friend"]');
    assert.equal(d.getElementById('enemyAtlasArea'), null);

    for (const id of pools.slice(0, 10).flat()) if (!s.catalog.enemies.includes(id)) s.catalog.enemies.push(id);
    f.check(true);
    assert.equal(s.achievements.filter(id => /^areaAtlas\d+$/.test(id)).length, 10);
    f.check(true);
    assert.equal(new Set(s.achievements).size, s.achievements.length);
    click(d, '[data-tab="achievements"]');
    change(w, '#titleSelect212', 'areaAtlas10');
    assert.equal(s.selectedTitle212, 'areaAtlas10');

    click(d, '[data-tab="monster"]');
    const last = d.querySelectorAll('.monster-row')[s.monsters.length - 1], rowId = last.id;
    const m = s.monsters.find(m => m.id === Number(last.dataset.id));
    d.getElementById('tabBody').scrollTop = 280;
    last.click();
    assert.equal(d.querySelector('#monsterDetailTitle').textContent, m.name + 'の育成カルテ');
    assert.equal(d.activeElement.id, 'modalClose');
    assert(!d.querySelector('#tabBody .management-card'));
    assert(d.querySelector('.app').inert);
    const body = d.getElementById('monsterDetailBody');
    body.scrollTop = 130;
    const xp = m.xp;
    click(d, '#monsterDetailBody [data-action="trainMonster"]');
    assert(m.xp > xp);
    assert.equal(body.scrollTop, 130);
    click(d, '#monsterDetailBody [data-v138-monster="favorite"]');
    assert(m.favorite138 && m.protected138);
    assert(d.querySelector('#monsterDetailBody [data-v171-action="partMonster"]').disabled);
    w.prompt = () => '名付けた子';
    click(d, '#monsterDetailBody [data-v18-action="renameMonster"]');
    assert.equal(d.querySelector('#monsterDetailTitle').textContent, '名付けた子の育成カルテ');
    w.dispatchEvent(new w.KeyboardEvent('keydown', {key:'Escape'}));
    assert(!d.getElementById('modal').classList.contains('show'));
    assert.equal(d.activeElement.id, rowId);
    assert.equal(d.getElementById('tabBody').scrollTop, 280);
    assert(!d.querySelector('.app').inert);

    for (let i = 0; i < 30; i++) click(d, '#zoomOut');
    assert.equal(d.getElementById('zoomLabel').textContent, '15%');
    assert(d.getElementById('zoomOut').disabled);
    click(d, '[data-action="centerMap"]');
    near(f.center().x, 11); near(f.center().y, 7.5);
    f.draw(2000);
    const cached = f.overview(), scenery = cached.scenery;
    f.draw(2001);
    assert.equal(cached.scenery, scenery);
    s.paths.push('2,2'); f.draw(2002);
    assert.notEqual(cached.scenery, scenery);
    const canvas = d.getElementById('game');
    canvas.getBoundingClientRect = () => ({left:0, top:0, width:704, height:480});
    const before = f.ground(390, 255);
    canvas.dispatchEvent(new w.WheelEvent('wheel', {clientX:390, clientY:255, deltaY:-100, bubbles:true}));
    const after = f.ground(390, 255);
    assert(Math.hypot(before.x - after.x, before.y - after.y) < .12);
    for (let i = 0; i < 55; i++) canvas.dispatchEvent(new w.WheelEvent('wheel', {clientX:352, clientY:240, deltaY:100}));
    assert.equal(d.getElementById('zoomLabel').textContent, '15%');
    for (let i = 0; i < 30; i++) click(d, '#zoomIn');
    assert.equal(d.getElementById('zoomLabel').textContent, '280%');
    assert(d.getElementById('zoomIn').disabled);
    click(d, '[data-action="zoomReset"]');
    assert.equal(d.getElementById('zoomLabel').textContent, '100%');
    f.save(true); saved = persist(w);
  } finally { game.close(); }

  const restarted = await openRanch('1.24.1', saved);
  try {
    assert.equal(restarted.f.state().selectedTitle212, 'areaAtlas10');
    assert.equal(restarted.f.state().achievements.filter(id => /^areaAtlas\d+$/.test(id)).length, 10);
    assert(restarted.f.state().monsters.some(m => m.name === '名付けた子' && m.protected138));
  } finally { restarted.close(); }
  console.log('PASS 1.24.0 saves, area rosters and filters, scoped NEW, 12 trophies and titles, monster sheet actions and return, map zoom and terrain refresh');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
