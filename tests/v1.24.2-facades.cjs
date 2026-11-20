'use strict';
const { createHash } = require('node:crypto');
const { assert, backing, click, clone, open, persist, wait } = require('./harness138.cjs');

const hooks = `Object.assign(window.qa138, {
  types: Object.keys(B), art: spriteBuildingV161,
  sheetsReady: () => facilitySheetReady && treeDecorationReady && villageSheetReady,
  selectBuilding(id) {
    const b = state.buildings.find(item => item.id === id);
    selectedBuilding = id; buildMode = null; moveMode = null; selectedMonster = null; tab = 'build';
    cameraX = b.x + 1 - VW / (2 * zoom); cameraY = b.y + 1 - VH / (2 * zoom);
    limitCamera(); renderUI(true);
  },
  mapArt(id) { drawWorld(0); return mapPickItems.find(item => item.building?.id === id)?.art; },
  frontRoads, previewFacing: () => placementFacing
});`;
async function loaded(version, storage) {
  const game = await open(version, storage, hooks);
  for (let i = 0; i < 200 && !game.f.sheetsReady(); i++) await wait(20);
  assert(game.f.sheetsReady(), 'The embedded facility, tree and village artwork decoded');
  return game;
}
function rgba(canvas) {
  return backing(canvas).getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
}
const hash = canvas => createHash('sha256').update(rgba(canvas)).digest('hex');

// These are the four regions occupied by the ceramic rim and bowl, in world-facing order.
// A unique image per direction alone also accepts the old blank roof or square sign.
function coffeeCup(canvas, dir) {
  const regions = [[24,41,58,63], [28,14,73,32], [59,14,99,32], [73,41,108,63]];
  const [left, top, right, bottom] = regions[dir], pixels = rgba(canvas);
  let ceramic = 0, coffee = 0;
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
    const i = (y * canvas.width + x) * 4;
    if (!pixels[i + 3]) continue;
    const [r,g,b] = pixels.subarray(i, i + 3);
    if (r > 208 && g > 174 && b > 118 && r - g < 65) ceramic++;
    if (r > 83 && r < 178 && g > 36 && g < 107 && b < 65 && r - g > 30) coffee++;
  }
  return ceramic > 170 && coffee > 20;
}
function buildingSnapshot(s) { return clone(s.buildings.map(b => [b.id, b.type, b.x, b.y, b.level, b.facing])); }
async function run() {
  const old = await loaded('1.24.1', {});
  let storage, id, oldBuildings, funds, party;
  try {
    const s = old.f.state();
    assert.equal(coffeeCup(old.f.art('cafe', 1, 3), 3), false, 'Reproduces the 1.24.1 right-facing cafe');
    s.speed = 0; s.villageLv = s.worldTreeLevel = 8; s.coins = 4321;
    id = s.nextId++;
    const cafe = { id, type: 'cafe', x: 3, y: 3, level: 2, facing: 3 };
    s.buildings = s.buildings.filter(b => b.type === 'worldtree');
    s.buildings[0].level = s.villageLv; s.buildings.push(cafe);
    for (let x = 1; x < 9; x++) for (let y = 1; y < 9; y++) {
      const key = `${x},${y}`; s.clearedScenery.push(key); s.clearedPonds.push(key);
    }
    s.paths = ['3,5','2,3','3,2','5,3']; s.ponds = [];
    old.f.save(true); storage = persist(old.w); oldBuildings = buildingSnapshot(s); funds = s.coins; party = clone(s.party);
  } finally { old.close(); }
  const game = await loaded('1.24.2', storage);
  let saved;
  try {
    const {f,d} = game, s = f.state(), cafe = s.buildings.find(b => b.id === id);
    assert.deepEqual(buildingSnapshot(s), oldBuildings); assert.equal(s.coins, funds); assert.deepEqual(clone(s.party), party);
    assert.equal(f.types.length, 26); let total = 0;
    for (const type of f.types) for (const level of type === 'worldtree' ? [1,5,8] : [1]) {
      const views = [0,1,2,3].map(dir => f.art(type, level, dir));
      assert.equal(new Set(views.map(hash)).size, 4, `${type} Lv.${level} has four distinct orientations`);
      for (const image of views) {
        assert.equal(image.width, image.height); const p = rgba(image), n = image.width;
        for (const offset of [0,n-1,n*(n-1),n*n-1]) assert.equal(p[offset*4+3], 0, type+' transparent corner');
        total++;
      }
    }
    assert.equal(total, 112);
    for (let dir = 0; dir < 4; dir++) {
      s.hour = 12; const stages = [8,10,15,20].map(lv => hash(f.art('worldtree', lv, dir)));
      s.hour = 22; stages.push(hash(f.art('worldtree', 20, dir))); assert.equal(new Set(stages).size, 5);
    }
    f.selectBuilding(id);
    for (const dir of [0,3,2,1]) {
      assert(f.frontRoads(cafe.type, cafe.x, cafe.y, dir).length, 'Accessible road at the selected face');
      click(d, `#facilityFacing [data-facing="${dir}"]`);
      assert.equal(cafe.facing, dir);
      const art = f.art('cafe', cafe.level, dir), picker = d.querySelector(`#facilityFacing [data-facing="${dir}"] canvas`);
      assert(coffeeCup(art, dir), 'Cup present facing '+dir);
      assert.equal(hash(picker), hash(art)); assert.equal(hash(f.mapArt(id)), hash(art));
    }
    click(d, '[data-action="build"][data-id="cafe"]');
    for (const dir of [0,1,2,3]) {
      click(d, `#facilityFacing [data-facing="${dir}"]`); assert.equal(f.previewFacing(), dir);
      assert.equal(cafe.facing, 1, 'New construction does not rotate the placed cafe');
      assert.equal(hash(d.querySelector(`#facilityFacing [data-facing="${dir}"] canvas`)), hash(f.art('cafe',1,dir)));
    }
    f.save(true); saved = persist(game.w);
  } finally { game.close(); }
  const reload = await loaded('1.24.2', saved);
  try { const b = reload.f.state().buildings.find(b => b.id === id); assert.deepEqual([b.x,b.y,b.level,b.facing], [3,3,2,1]); }
  finally { reload.close(); }
  console.log('PASS 112 views, four cafe cups, selected and preview art, world-tree growth and night, old save and persisted rotations');
}
run().catch(err => {console.error(err); process.exitCode = 1;});
