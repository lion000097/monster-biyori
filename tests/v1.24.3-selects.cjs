'use strict';
const {assert, open, click, change} = require('./harness138.cjs');
const version = process.env.MONSTER_TEST_VERSION || '1.24.3';
const hooks = `Object.assign(window.qa138, {refresh:(full=false)=>renderUI(full), locked:()=>inputLock});`;

async function run() {
  const game=await open(version,{},hooks);
  try {
    const {d,w,f}=game,s=f.state();s.speed=0;
    f.render('monster');
    let select=d.querySelector('[data-v137-sort="monster"]');
    select.focus();assert(f.locked());
    const monster=s.monsters[0],row=d.getElementById('monsterRow-'+monster.id);
    monster.lv=42;
    f.refresh();
    assert.equal(d.querySelector('[data-v137-sort="monster"]'),select,'A live focused select is not rebuilt by background refresh');
    assert.equal(d.getElementById('monsterRow-'+monster.id),row);
    change(w,select,'name');
    assert(!select.isConnected,'Sorting rebuilds the list and removes the original select');
    monster.lv=43;f.refresh();
    assert(!f.locked(),'A disconnected select cannot keep automatic updates locked');
    assert(d.getElementById('monsterRow-'+monster.id).textContent.includes('Lv.43'),'Monster details keep updating after sorting');

    f.render('staff');
    select=d.querySelector('[data-v137-sort="staff"]');select.focus();change(w,select,'name');
    assert(!select.isConnected);
    const worker=s.staff[0];worker.level=44;f.refresh();
    assert(!f.locked());
    assert(d.querySelector('[data-staff-sprite="'+worker.id+'"]').closest('.entity-row').textContent.includes('Lv.44'),'Staff details keep updating after sorting');

    click(d,'[data-tab="bestiary"]');click(d,'[data-action="atlas"][data-id="enemy"]');
    select=d.getElementById('enemyAtlasArea');select.focus();change(w,select,'7');
    const area=d.getElementById('enemyAtlasArea');
    assert.equal(area.value,'7');assert.equal(d.activeElement,area);
    f.refresh();assert.equal(d.getElementById('enemyAtlasArea'),area,'An active enemy area selector keeps its dropdown and focus');
    area.remove();f.refresh();
    assert(!f.locked());assert.equal(d.getElementById('enemyAtlasArea').value,'7','Area filter remains selected after recovering a stale lock');

    s.adventure.stage=41;f.render('adventure');
    for(const id of ['areaSelect213','frontierReplayStage']) {
      const active=d.getElementById(id);assert(active,id+' is present');
      active.focus();assert(f.locked());
      f.refresh(true);assert.equal(d.getElementById(id),active,id+' survives full refresh while focused');
      f.refresh();assert.equal(d.getElementById(id),active,id+' survives automatic refresh while focused');
      active.blur();f.refresh();assert(!f.locked());
    }
  } finally { game.close(); }
  console.log('PASS automatic monster/staff updates after sorting, stale filter lock recovery, live area and expedition dropdown focus preservation');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
