'use strict';
const {assert, open, persist, click, near} = require('./harness138.cjs');

async function main() {
  const old = await open('1.13.11');
  let storage;
  try {
    old.f.state().villageXp = 123.75;
    old.f.state().materialSeen211 = [0, 5, 27];
    old.f.save(true);
    storage = persist(old.w);
  } finally { old.close(); }
  const q = await open('1.13.12', storage, `
    Object.assign(window.qa138, {JOBS, B, workplaceType211, adventureTick, upgrade, villageThreshold,
      treeRequirementStatus193, treeCost193, expeditionStaffBoost135, STAFF_EGG_RATE139, STAFF_SPECIAL_RATE139});
  `);
  try {
    const {f,d,w} = q, s = f.state(), modal = d.getElementById('modal');
    const currentTab = () => modal.querySelector('[aria-selected="true"]');
    const activePages = () => [...modal.querySelectorAll('[role="tabpanel"]')].filter(p => !p.hidden);
    const key = k => d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true}));
    const displayedXP = new Map();

    click(d,'#helpBtn');
    assert.equal(currentTab().dataset.guideTab,'staff');
    const roles = Object.keys(f.JOBS), rows = [...d.querySelectorAll('.guide-job')];
    assert.equal(rows.length,roles.length);
    roles.forEach((role,i) => {
      assert(rows[i].querySelector('dt').textContent.includes(f.JOBS[role].label));
      assert(rows[i].querySelector('dd strong').textContent.includes(f.B[f.workplaceType211(role)].name));
    });
    assert.match(rows[1].textContent,/温室農園/);
    assert.match(rows[4].textContent,/冒険者ギルド/);
    s.staff.forEach(worker => {worker.job='explore';});
    near(f.expeditionStaffBoost135(),1+.08*Math.min(3,s.staff.length));
    assert.equal(f.STAFF_EGG_RATE139,.05); assert.equal(f.STAFF_SPECIAL_RATE139,.001);
    key('ArrowRight');
    assert.equal(activePages().length,1);
    assert.equal(activePages()[0].id,'help-page-tree');
    for (const row of d.querySelectorAll('.guide-rewards > div')) {
      displayedXP.set(row.firstElementChild.textContent, parseFloat(row.lastElementChild.textContent));
    }
    assert.equal(displayedXP.size,4);
    const example = d.querySelector('#help-page-tree aside').textContent;
    assert(example.includes(f.villageThreshold(1)+' XP'));
    for (const r of f.treeRequirementStatus193(2)) {
      assert(example.includes(f.B[r.type].name+' Lv.'+r.minLevel+'以上を'+r.need+'軒'));
    }
    assert(example.includes(f.treeCost193(1).coins+' G'));
    assert(example.includes('キラキラ'+f.treeCost193(1).magic+'個'));
    key('End'); assert.equal(activePages()[0].id,'help-page-basics');
    for (const action of ['export','import','reset']) assert(activePages()[0].querySelector('[data-action="'+action+'"]'));
    key('Escape'); assert(!modal.classList.contains('show')); assert.equal(d.activeElement.id,'helpBtn');
    click(d,'#treeHelpLink'); assert.equal(currentTab().dataset.guideTab,'tree');
    click(d,'#modalClose'); assert.equal(d.activeElement.id,'treeHelpLink');
    click(d,'[data-tab="staff"]'); click(d,'#staffHelpLink');
    assert.equal(currentTab().dataset.guideTab,'staff');
    f.render('staff'); click(d,'#modal'); assert.equal(d.activeElement.id,'staffHelpLink');
    assert.equal(s.villageXp,123.75); assert.equal(s.materialSeen211.join(','),'0,5,27');

    s.coins = 100_000;
    function checkGain(label,action) {
      const start = s.villageXp;
      action();
      near(s.villageXp-start,displayedXP.get(label));
    }
    f.render('staff');
    checkGain('職員を1人雇う',()=>click(d,'[data-action="hire"]'));
    checkGain('施設を1段階強化する',()=>f.upgrade(s.buildings.find(b=>b.type==='farm').id));
    s.adventure.auto = false;
    for (const [stage,label] of [[1,'冒険の通常戦に勝つ'],[5,'冒険のボス戦に勝つ']]) {
      s.adventure.stage = stage;
      f.startAdventure();
      assert.equal(s.battle.boss,stage===5);
      s.battle.foes.forEach(enemy=>{enemy.hp=0;});
      checkGain(label,()=>f.adventureTick(false));
      assert.equal(s.battle,null);
    }
    s.eggs=[]; const start=s.villageXp;
    f.tick(true);
    near(s.villageXp-start,(.58+s.monsters.length*.06)*.65);
    s.villageXp=300.5; s.magic=100;
    f.render('build');
    assert(d.querySelector('#treeGrow').hidden);
    for (const r of f.treeRequirementStatus193(2)) {
      const first=s.buildings.find(b=>b.type===r.type);
      first.level=r.minLevel;
      for(let i=1;i<r.need;i++) s.buildings.push({...first,id:s.nextId++,x:first.x+i*3});
    }
    f.render('build');
    assert(!d.querySelector('#treeGrow').hidden);
    click(d,'#treeGrow'); assert.equal(s.villageLv,2); near(s.villageXp,16.5);
    console.log('PASS five workplaces, guide entry points and keyboard controls, save compatibility, four XP rewards, hourly XP and level-up carryover');
  } finally { q.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
