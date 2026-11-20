'use strict';
const {assert, open, click, change, clone, persist} = require('./harness138.cjs');

const previousVersion = '1.13.9';
const currentVersion = '1.13.10';
const hooks = `
Object.assign(window.qa138, {
  staffLimit, hire, recoverBuilding, materialRarity211, materials:MATERIALS211, gatherMaterial211,
  ranchProduction200, canBuild, place, stepActors, spendMaterials211, pickVIPMaterial212
});`;
const hireButton = '[data-action="hire"]';
const visibleCards = d => [...d.querySelectorAll('.material-card')].filter(card => card.style.display !== 'none');
function openMaterials(d) {
  click(d, '[data-tab="bestiary"]');
  click(d, '[data-action="atlas"][data-id="material"]');
}
function placeRanch(f) {
  for (let y = 2; y < 19; y++) {
    for (let x = 2; x < 21; x++) {
      if (f.canBuild(x,y,null,false,'ranch')) {
        f.place('ranch', x, y);
        return;
      }
    }
  }
  assert.fail('no buildable ranch placement');
}
function withRolls(w, draws, action) {
  const previous = w.Math.random;
  let calls = 0;
  w.Math.random = () => {
    assert(calls < draws.length, 'unexpected extra draw');
    return draws[calls++];
  };
  try { action(); assert.equal(calls, draws.length); }
  finally { w.Math.random = previous; }
}

async function hiring() {
  const q = await open(currentVersion, {}, hooks);
  try {
    const {f,d} = q, s = f.state();
    s.coins = 900000;
    for (let level = 1; level <= 40; level++) {
      s.villageLv = level;
      assert.equal(f.staffLimit(), f.monsterLimit());
    }
    for (const [level, cap] of [[1,4],[5,12],[10,23],[15,34],[19,43],[20,45],[21,47]]) {
      s.villageLv = level;
      assert.equal(f.staffLimit(), cap);
    }
    s.villageLv = 1;
    f.render('staff');
    while (s.staff.length < 4) {
      const before = s.staff.length;
      click(d, hireButton);
      assert.equal(s.staff.length, before + 1);
    }
    assert(d.querySelector(hireButton).disabled);
    const home = s.buildings.find(b => b.type === 'home');
    f.recoverBuilding(home.id);
    assert(!s.buildings.includes(home));
    assert.equal(f.staffLimit(), 4);
    s.villageLv = 20;
    // Both groups can occupy their full complement at the same time.
    while (s.monsters.length < 45)
      s.monsters.push({...clone(s.monsters[0]), id:s.nextId++});
    f.render('staff');
    while (s.staff.length < 45) {
      const before = s.staff.length;
      assert(!d.querySelector(hireButton).disabled);
      click(d, hireButton);
      assert.equal(s.staff.length, before + 1);
    }
    assert.match(d.querySelector('#staffCount').textContent, /45 \/ 45/);
    assert.match(d.querySelector('#countInfo').textContent, /45 \/ 45/);
    assert.match(d.querySelector('#tabBody .info-card').textContent, /次のレベルで47人/);
    assert(d.querySelector(hireButton).disabled);
    const coins = s.coins;
    f.hire();
    assert.equal(s.staff.length, 45);
    assert.equal(s.coins, coins);
    f.save(true); assert(f.load());
    const saved = f.state();
    assert.equal(saved.staff.length, 45); assert.equal(saved.monsters.length, 45);
    saved.villageLv = 21;
    f.render('staff'); click(d, hireButton);
    assert.equal(saved.staff.length, 46);
    console.log('PASS staff and monsters have separate equal limits, all levels, actual 45th hire without housing, 46th blocked then unlocked, save/reload');
  } finally { q.close(); }
}

async function production() {
  const q = await open(currentVersion, {}, hooks);
  try {
    const {w,d,f} = q, s = f.state();
    assert.equal(f.materials.length, 30);
    assert.equal(new Set(f.materials.map(m => m[0])).size, 30);
    const million = 1000000;
    for (const monster of [{kind:0,lv:1,gift212:0}, {kind:40,lv:99,gift212:2}]) {
      const hits = {SSR:0, UR:0};
      for (let ticket = 0; ticket < million; ticket++) {
        const grade = f.materialRarity211(monster, (ticket + .5) / million);
        if (grade in hits) hits[grade]++;
      }
      assert.deepEqual(hits, {SSR:10, UR:2});
      for (const [roll, expected] of [[0,'UR'],[(2-1e-6)/million,'UR'],[2/million,'SSR'],
        [(12-1e-6)/million,'SSR'],[12/million,monster.lv === 1 ? 'R' : 'SR']])
        assert.equal(f.materialRarity211(monster, roll), expected);
    }
    assert.equal(f.materialRarity211({lv:1}, .004), 'R');
    assert.equal(f.materialRarity211({lv:12,gift212:2}, .004), 'SR'); // legacy UR shortcut retired
    openMaterials(d);
    assert.equal(visibleCards(d).length, 30);
    assert.doesNotMatch(d.querySelector('.material-gallery').textContent, /在庫|未入手/);
    const card = visibleCards(d)[0];
    assert.equal(w.getComputedStyle(card).flexDirection, 'column');
    assert.equal(w.getComputedStyle(card.querySelector('.treasure-name')).writingMode, 'horizontal-tb');
    // Force each rarity and each slot through the game's real production and catalog code.
    for (const [rarity,roll] of [['N',.5],['R',.2],['SR',.03],['SSR',2/million],['UR',0]]) {
      const ids = f.materials.map((m,i) => m[3] === rarity ? i : -1).filter(i => i >= 0);
      for (const [slot,id] of ids.entries()) {
        const member = (slot + .25) / ids.length, before = s.materialStock211[id];
        const draws = rarity === 'UR' || rarity === 'SSR' ? [roll,member] : [roll,.9,member];
        withRolls(w, draws, () => f.gatherMaterial211({kind:0,lv:12,gift212:1}, 2));
        assert.equal(s.materialStock211[id], before + 2);
        assert(s.materialSeen211.includes(id));
      }
    }
    f.render('bestiary');
    assert.match(d.querySelector('.material-gallery').textContent, /発見 30 \/ 30種/);
    assert.doesNotMatch(d.querySelector('.material-gallery').textContent, /在庫/);
    assert.equal(d.querySelectorAll('.material-card .r-ssr').length, 3);
    assert.equal(d.querySelectorAll('.material-card .r-ur').length, 5);
    for (const [index, card] of visibleCards(d).entries())
      assert.equal(card.querySelector('.treasure-name').textContent, f.materials[index][1]);
    change(w, '[data-v137-atlas-filter]', 'new');
    assert.equal(visibleCards(d).length, 29);
    click(d, '[data-v137-read="material"]'); assert.equal(visibleCards(d).length, 0);
    change(w, '[data-v137-atlas-filter]', 'found'); assert.equal(visibleCards(d).length, 30);
    f.spendMaterials211(s.stock);
    assert.equal(s.stock, 0);
    const monster = s.monsters[0];
    monster.gift212 = 1; monster.lv = 1;
    placeRanch(f);
    withRolls(w, [0,.999], () => f.ranchProduction200(monster, true));
    const last = f.materials.length - 1;
    assert(s.materialStock211[last] >= 1);
    assert.equal(f.pickVIPMaterial212().id, last);
    s.vipOrder211 = {id:last,qty:1,expires:s.day+6,reward:175,fame:8,visitor:'素材の注文客'};
    const stock = s.stock;
    click(d,'[data-tab="management"]'); click(d,'[data-v211="deliver"]');
    assert.equal(s.stock, stock - 1);
    f.save(true); assert(f.load());
    assert.equal(f.state().materialSeen211.length, 30);
    assert.equal(f.state().materialStock211[last], stock - 1);
    console.log('PASS one million tickets per profile, exact boundaries, all 30 obtainable, quotas and filters, real ranch production, saleable VIP item and discovery after stock reaches zero');
  } finally { q.close(); }
}

async function arrival() {
  const q = await open(currentVersion, {}, hooks);
  try {
    const {f,w} = q, s = f.state(), monster = s.monsters[0];
    s.monsters = [monster]; s.staff = []; s.guests = []; s.speed = 1; s.hour = 10;
    placeRanch(f);
    monster.produce = 12;
    f.ranchProduction200(monster, false);
    const before = s.stock;
    const original = w.Math.random; w.Math.random = () => .000005;
    try {
      for (let step=0; step<800 && s.stock===before; step++) f.stepActors(.1);
    } finally { w.Math.random = original; }
    assert(s.stock > before);
    const firstSSR = f.materials.findIndex(m => m[3] === 'SSR');
    assert(s.materialStock211[firstSSR] > 0);
    assert(s.materialSeen211.includes(firstSSR));
    console.log('PASS a walking monster reaches the ranch, produces an SSR and registers it');
  } finally { q.close(); }
}

async function migration() {
  const old = await open(previousVersion, {}, 'Object.assign(window.qa138,{materials:MATERIALS211});');
  let baseline, storage;
  try {
    const {w,f} = old, s = f.state();
    s.villageLv = s.worldTreeLevel = 20;
    while (s.staff.length < 8) s.staff.push({...clone(s.staff[0]), id:s.nextId++, name:'探検係'+s.staff.length});
    s.materialStock211[11]=0; s.materialStock211[23]=7;
    s.materialSeen211=[0,11,23]; s.catalogSeen137.material=[0,11];
    s.stock=s.materialStock211.reduce((a,b)=>a+b,0);
    s.eggs=[{id:s.nextId++,name:'色違いのたまご',source139:'staff',kind:1,shiny:true,time:6,need:15}];
    s.vipOrder211={id:23,qty:1,expires:s.day+7,reward:135,fame:8,visitor:'旅人'};
    f.save(true); storage=persist(w);
    baseline=clone({materials:f.materials, stock:s.materialStock211, seen:s.materialSeen211,
      staff:s.staff.map(a=>[a.id,a.name,a.job]), eggs:s.eggs, vip:s.vipOrder211});
  } finally {old.close();}
  const q=await open(currentVersion,storage,hooks);
  try {
    const {w,d,f}=q;
    function check() {
      const s=f.state();
      assert.deepEqual(clone(f.materials.slice(0,24)),baseline.materials);
      assert.deepEqual(clone(s.staff.map(a=>[a.id,a.name,a.job])),baseline.staff);
      assert.deepEqual(clone(s.materialStock211),[...baseline.stock,0,0,0,0,0,0]);
      assert.deepEqual(clone(s.materialSeen211),baseline.seen);
      assert.deepEqual(clone(s.eggs),baseline.eggs); assert.deepEqual(clone(s.vipOrder211),baseline.vip);
      assert.equal(f.staffLimit(),45);
    }
    check(); openMaterials(d);
    change(w,'[data-v137-atlas-filter]','new');
    assert.deepEqual(visibleCards(d).map(card=>card.querySelector('.treasure-name').textContent),['世界樹の琥珀蜜']);
    change(w,'[data-v137-atlas-filter]','missing'); assert.equal(visibleCards(d).length,27);
    f.save(true); assert(f.load()); check();
    f.saveBackup213('manual'); f.state().staff.pop(); f.state().materialStock211[23]=0;
    f.restore213(0); check();
    console.log('PASS actual 1.13.9 save, stable material IDs, zero-stock discoveries, NEW, 8 staff, guaranteed egg, VIP order and backup restore');
  } finally {q.close();}
}

(async () => { await hiring(); await production(); await arrival(); await migration(); })()
  .catch(error => { console.error(error); process.exitCode=1; });
