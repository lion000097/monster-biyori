'use strict';
const {assert,open,click,persist,KEY,clone}=require('./harness138.cjs');
const hooks='Object.assign(window.qa138,{allyStats,makeMonster,rollTalentIV,useTalentFruit,battlePartyHealth,adventureTick,openBarn,SPECIES});';
async function main(){
 const old=await open('1.13.22');let snapshot;
 try{const s=old.f.state();s.restingMonsters.push(s.monsters.pop());old.f.save(true);snapshot=persist(old.w)}finally{old.close()}
 const q=await open('1.13.23',snapshot,hooks);
 try{
  const {f,d,w}=q,s=f.state(),m=s.monsters[0],rest=s.restingMonsters[0];
  const all=[...s.monsters,rest];for(const a of all){for(const n of Object.values(a.iv))assert(Number.isInteger(n)&&n>=0&&n<=100)}
  const initialIV=all.map(a=>clone(a.iv));const retry=await open('1.13.23',snapshot,hooks);
  try{assert.deepEqual([...retry.f.state().monsters,...retry.f.state().restingMonsters].map(a=>clone(a.iv)),initialIV)}finally{retry.close()}
  assert.equal(f.rollTalentIV(()=>0),0);assert.equal(f.rollTalentIV(()=>.999999),100);
  assert.equal(f.SPECIES.find(x=>x.id==='shirogao').rarity,'とてもレア');
  let last;
  for(const rarity of ['ふつう','めずらしい','レア','とてもレア']){
   const kind=f.SPECIES.findIndex(x=>x.rarity===rarity);
   const stats=f.allyStats({...m,kind,lv:1,iv:{hp:50,attack:50,defense:50}});
   if(last)for(const k of Object.keys(stats))assert(stats[k]>last[k]);last=stats;
  }
  s.talentFruit=3;m.iv.hp=95;m.iv.attack=10;
  f.selectMonster(m.id);assert(d.querySelector('.talent-profile svg'));
  click(d,'[data-fruit-stat="hp"]');assert.equal(m.iv.hp,100);assert.equal(s.talentFruit,2);
  f.useTalentFruit(m.id,'hp');assert.equal(s.talentFruit,2);
  click(d,'[data-fruit-stat="attack"]');assert.equal(m.iv.attack,35);assert.equal(s.talentFruit,1);
  rest.iv.defense=4;f.openBarn(null);click(d,'[data-barn-side="rest"]');
  const detail=d.querySelector('#barnList details');detail.open=true;
  click(d,'#barnList [data-fruit-stat="defense"]');assert.equal(rest.iv.defense,29);assert.equal(s.talentFruit,0);
  click(d,'#modalClose');
  const saved=JSON.parse(persist(w)[KEY]);assert.equal(saved.restingMonsters[0].iv.defense,29);
  function round(iv){
   for(const ally of s.monsters){ally.iv={hp:iv,attack:iv,defense:iv};ally.lv=8}
   s.adventure.stage=1;s.battle=null;w.Math.random=()=>.5;f.startAdventure();
   const b=s.battle;b.foes=[{...b.foes[0],hp:10000,maxHp:10000,atk:200}];
   f.adventureTick(false);return [b.ourMax,10000-b.foes[0].hp,b.ourMax-b.ourHp];
  }
  const low=round(0),high=round(100);
  assert(high[0]>low[0]&&high[1]>low[1]&&high[2]<low[2]);
  for(const [stage,roll,expected] of [[5,.04999,1],[10,.05,0],[4,0,0]]){
   s.adventure.stage=stage;s.battle=null;f.startAdventure();s.battle.foes.forEach(x=>x.hp=0);
   const before=s.talentFruit;w.Math.random=()=>roll;f.adventureTick(false);
   assert.equal(s.talentFruit-before,expected);
  }
  console.log('PASS migration, all rarity tiers, IV bounds, chart and fruit controls, barn, persisted inventory, boss drop boundaries');
 }finally{q.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
