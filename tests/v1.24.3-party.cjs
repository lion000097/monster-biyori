'use strict';

const {assert, open, click, near, clone, KEY} = require('./harness138.cjs');
const version = process.env.MONSTER_QA_VERSION || '1.24.3';
const hooks = `Object.assign(window.qa138, {crewParty, battlePartyHealth, toggleParty});`;

async function run() {
  const game = await open(version, {}, hooks);
  try {
    const {f,d,w} = game, s = f.state();
    s.speed = 0;
    s.monsters[0].lv = 99;
    s.monsters[1].lv = 1;
    s.monsters[2].lv = 20;
    const extra = {...s.monsters[2], id:s.nextId++, name:'編成確認', lv:50};
    s.monsters.push(extra);
    const [strong, weak, middle, fourth] = s.monsters.map(m => m.id);
    s.party = [strong];
    f.startAdventure();
    const battle = s.battle;
    battle.ourHp = battle.ourMax * .375;
    const enemies = clone(battle.foes), round = battle.round;
    f.render('adventure');

    const verifyHealth = label => {
      const expectedMax = f.battlePartyHealth(f.crewParty());
      assert.equal(s.battle, battle, label+' keeps the encounter');
      assert.equal(battle.ourMax, expectedMax, label+' uses the current party HP');
      near(battle.ourHp, expectedMax * .375);
      assert.deepEqual(clone(battle.foes), enemies, label+' preserves enemy damage');
      assert.equal(battle.round, round, label+' preserves the current round');
      const bar=d.querySelectorAll('.adventure-stage .battle-track > div')[1];
      assert(bar, 'friendly HP bar is shown');
      near(parseFloat(bar.style.width),37.5);
      const saved=JSON.parse(w.localStorage.getItem(KEY));
      assert.deepEqual(saved.party,clone(s.party));
      assert.equal(saved.battle.ourMax,expectedMax);
      near(saved.battle.ourHp,expectedMax*.375);
    };
    const choose = (id,label) => {
      click(d, '[data-action="toggleParty"][data-id="'+id+'"]');
      verifyHealth(label);
    };

    choose(weak,'adding a low-level companion');
    choose(strong,'removing the high-level companion');
    assert.deepEqual(clone(s.party),[weak]);
    choose(weak,'clearing manual selection');
    assert.deepEqual(clone(s.party),[]);
    assert.deepEqual(clone(f.crewParty().map(m=>m.id)),[strong,fourth,middle],
      'the empty selection uses the three highest-level companions');
    choose(middle,'switching from automatic to manual formation');
    choose(weak,'adding a second member');
    choose(fourth,'adding a third member');
    const full = clone(s.party), maximum=battle.ourMax, remaining=battle.ourHp;
    f.toggleParty(strong);
    assert.deepEqual(clone(s.party),full,'a fourth selection is rejected');
    assert.equal(battle.ourMax,maximum); assert.equal(battle.ourHp,remaining);
    choose(weak,'removing one of three members');

    s.battle=null;
    f.render('adventure');
    click(d,'[data-action="toggleParty"][data-id="'+middle+'"]');
    assert.equal(s.battle,null,'editing an idle formation does not start a battle');
    assert.deepEqual(clone(s.party),[fourth]);
    console.log('PASS live formation HP, preserved damage ratio, automatic fallback, party cap, saved state, HP bar and idle edits');
  } finally { game.close(); }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
