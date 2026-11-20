'use strict';
const {createHash} = require('node:crypto');
const {assert, open, clone, backing, persist, click, change, wait} = require('./harness138.cjs');

const catalogueHooks = `Object.assign(window.qa138, {
  enemies: ENEMIES, species: SPECIES, encounter: stageEncounter,
  enemyArt: enemy17, friendArt: spriteMonsterHD
});`;
const battleHooks = `Object.assign(window.qa138, {
  combat: adventureTick, hatchEggs, newEgg, awardBattleEgg, validBackup213,
  eggLimit: EGG_LIMIT, takeEgg: chooseExploreEgg, areas: frontierAreas
});`;

async function openRanch(version, storage, hooks) {
  const game = await open(version, storage, hooks +
    'window.qa138.artReady = () => facilitySheetReady && villageSheetReady && treeDecorationReady;');
  for (let i = 0; i < 150 && !game.f.artReady(); i++) await wait(20);
  assert(game.f.artReady());
  return game;
}

function portrait(sprite) {
  const rgba = backing(sprite).getContext('2d').getImageData(0, 0, sprite.width, sprite.height).data;
  assert(rgba.some((v, i) => i % 4 === 3 && v > 0), 'the portrait contains visible pixels');
  return createHash('sha256').update(rgba).digest('hex');
}

function withRoll(window, value, action) {
  const original = window.Math.random;
  window.Math.random = () => value;
  try { return action(); } finally { window.Math.random = original; }
}

function clearBattle(game, roll) {
  const {f, w} = game, s = f.state(), before = s.adventure.clears;
  withRoll(w, roll, () => {
    for (let round = 0; s.battle && round < 100; round++) f.combat(true);
  });
  assert.equal(s.adventure.clears, before + 1, 'party cleared the battle');
  assert.equal(s.battle, null);
}

function hatch(game, enemy, shiny) {
  const {f} = game, s = f.state();
  assert.equal(s.eggs.length, 1, 'only the encountered species dropped an egg');
  const egg = s.eggs[0];
  assert.equal(egg.kind, enemy.allyId);
  assert.equal(egg.source139, 'battle');
  assert.equal(egg.shiny, shiny);
  for (let tick = 0; s.eggs.length && tick < 25; tick++) f.hatchEggs();
  const companion = s.monsters.at(-1);
  assert.equal(s.eggs.length, 0);
  assert.equal(companion.kind, enemy.allyId);
  assert.equal(companion.shiny, shiny);
  assert(s.catalog.friends.includes(companion.kind));
  if (shiny) assert(s.catalog.shinies.includes(companion.kind));
}

function identity(f) {
  return {
    allies: clone(f.species.map(s => s.id)),
    enemies: clone(f.enemies.map(e => e.name)),
    relics: clone(f.TREASURE_ITEMS.map(t => t.name))
  };
}

async function run() {
  const old = await openRanch('1.23.29', {}, catalogueHooks);
  let oldIndex, save, existing;
  try {
    const f = old.f, s = f.state();
    f.registerRelics192(12);
    oldIndex = identity(f);
    s.speed = 0;
    s.villageLv = 35;
    s.worldTreeLevel = s.villageLv;
    s.buildings.find(b => b.type === 'worldtree').level = s.villageLv;
    s.adventure.stage = 31;
    s.eggs = [];
    s.research.battle = 20;
    for (const m of s.monsters) { m.lv = 99; m.equip = true; }
    s.catalog.enemies = [0, f.enemies.length - 1];
    s.catalog.defeated = [0];
    s.treasures = [0, f.RELIC_START192 + 12, f.RELIC_START192 + 19];
    s.bestiary.treasures = s.treasures;
    f.save(true);
    existing = clone(s);
    save = persist(old.w);
  } finally { old.close(); }

  const game = await openRanch('1.24.0', save, catalogueHooks + battleHooks);
  let newSave, savedMonsters;
  try {
    const {d, f, w} = game, s = f.state();
    assert.equal(s.adventure.stage, 31);
    for (const key of ['treasures', 'catalog', 'party', 'buildings']) {
      assert.deepEqual(clone(s[key]), existing[key], key + ' on upgrade');
    }
    f.registerRelics192(12);
    const current = identity(f);
    assert.deepEqual(current.allies.slice(0, oldIndex.allies.length), oldIndex.allies);
    assert.deepEqual(current.enemies.slice(0, oldIndex.enemies.length), oldIndex.enemies);
    assert.deepEqual(current.relics, oldIndex.relics);
    assert.equal(current.allies.length, oldIndex.allies.length + 8);
    assert.equal(current.enemies.length, oldIndex.enemies.length + 20);
    assert.equal(f.areas.length, 4);
    const portraits = new Set(), recruitable = [];
    for (const [i, area] of f.areas.entries()) {
      assert.equal(area.normal.length, 4);
      for (const [slot, id] of [...area.normal, area.boss].entries()) {
        const stage = 31 + i * 5 + slot, boss = slot === 4, enemy = f.enemies[id];
        assert.equal(s.adventure.stage, stage);
        f.render('adventure');
        const preview = f.encounter(stage);
        assert.equal(preview.foes[0].index, id);
        assert.equal(preview.boss, boss);
        assert(preview.foes.every(foe => boss ? foe.index === area.boss : area.normal.includes(foe.index)));
        assert.equal(enemy.biome, area.biome);
        assert(d.querySelector('.fight-banner').textContent.includes(enemy.name));
        assert(d.querySelector('.adventure-stage').textContent.includes(area.biome));
        const art = f.enemyArt(id);
        assert.equal(art.width, boss ? 96 : 64);
        portraits.add(portrait(art));
        click(d, '[data-action="adventureStart"]');
        assert.equal(s.battle.stage, stage);
        assert.deepEqual(clone(s.battle.foes.map(foe => foe.index)), clone(preview.foes.map(foe => foe.index)));
        assert(s.catalog.enemies.includes(id));
        const canRecruit = slot === 0 || boss;
        clearBattle(game, canRecruit ? .02 : .5);
        assert(s.catalog.defeated.includes(id));
        if (canRecruit) {
          assert.equal(f.species[enemy.allyId].wildEnemy, id);
          assert.notEqual(portrait(f.friendArt(enemy.allyId, false)), portrait(f.friendArt(enemy.allyId, true)));
          hatch(game, enemy, false);
          recruitable.push({stage, boss, enemy});
        } else {
          assert.equal(s.eggs.length, 0);
        }
      }
    }
    assert.equal(portraits.size, 20);
    assert.equal(s.adventure.stage, 51);
    for (const {stage, boss, enemy} of recruitable) {
      f.render('adventure');
      if (boss) {
        click(d, '[data-v192="fight"][data-stage="' + stage + '"]');
      } else {
        const select = change(w, '#frontierReplayStage', String(stage));
        assert.equal(select.options.length, 16);
        click(d, '[data-v192="revisit"]');
      }
      assert.equal(s.battle.stage, stage);
      clearBattle(game, .0001);
      hatch(game, enemy, true);
      assert.equal(s.adventure.stage, 51);
    }

    f.render('bestiary');
    for (const {enemy} of recruitable) {
      const card = d.querySelector('[data-v18-friend="' + enemy.allyId + '"]');
      assert.equal(card.dataset.v18FriendShiny, '1');
      assert(card.closest('.treasure-card').textContent.includes(enemy.name));
    }
    click(d, '[data-action="atlas"][data-id="enemy"]');
    for (const area of f.areas) for (const id of [...area.normal, area.boss]) {
      const card = d.querySelector('[data-v18-enemy="' + id + '"]');
      assert(card.closest('.treasure-card').textContent.includes(f.enemies[id].name));
    }

    for (const {stage, boss, enemy} of recruitable) {
      const battle = {stage, boss, foes: [{index: f.species[enemy.allyId].wildEnemy}]};
      const rate = boss ? .34 : .08;
      withRoll(w, rate, () => f.awardBattleEgg(battle));
      assert.equal(s.eggs.length, 0);
      withRoll(w, rate - .00001, () => f.awardBattleEgg(battle));
      assert.equal(s.eggs.pop().kind, enemy.allyId);
    }
    const last = recruitable.at(-1);
    for (let i = 0; i < f.eggLimit; i++) f.newEgg(true);
    withRoll(w, 0, () => f.awardBattleEgg({stage:last.stage, boss:true, foes:[{index:f.species[last.enemy.allyId].wildEnemy}]}));
    assert.equal(s.eggs.length, f.eggLimit);
    assert.equal(s.pendingExploreEgg.kind, last.enemy.allyId);
    assert(s.pendingExploreEgg.shiny && f.validBackup213(s));
    savedMonsters = clone(s.monsters.map(m => [m.id, m.kind, m.shiny]));
    f.save(true);
    newSave = persist(w);
  } finally { game.close(); }

  const restarted = await openRanch('1.24.0', newSave, battleHooks);
  try {
    const f = restarted.f, s = f.state(), offer = s.pendingExploreEgg;
    assert.deepEqual(clone(s.monsters.map(m => [m.id, m.kind, m.shiny])), savedMonsters);
    assert.equal(s.adventure.stage, 51);
    assert.equal(s.catalog.shinies.length, 8);
    assert(offer.shiny && offer.source139 === 'battle');
    assert(f.takeEgg('swap', s.eggs[0].id));
    assert.equal(s.pendingExploreEgg, null);
    assert(s.eggs.some(egg => egg.id === offer.id && egg.kind === offer.kind && egg.shiny));
  } finally { restarted.close(); }
  console.log('PASS 1.23.29 upgrade, 20 new encounters and portraits, 8 normal and 8 shiny hatches, replays, dex, full incubator and restart');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
