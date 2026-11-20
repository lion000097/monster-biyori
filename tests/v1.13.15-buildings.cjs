'use strict';

const {assert,open,click,near} = require('./harness138.cjs');
const hooks = `Object.assign(window.qa138,{
  facilities:B,costUpgrade,seasonInfo,weatherInfo,buildingLevel,
  showFacility:id=>{selectedMonster=null;selectedBuilding=id;tab='build';renderUI(true)}
});`;
const expectedRow = {
  farm:'畑全体のごはん',home:'お世話1回の対象上限',school:'仲間1匹の基礎経験値',shop:'販売単価倍率',
  park:'遊具によるごきげん回復',lab:'研究所のキラキラ',spring:'孵化進行',tower:'自動遠征への加算',
  cafe:'滞在できる旅人',inn:'滞在できる旅人',workshop:'おまもりの製作進行',clinic:'職員の疲労軽減',
  ranch:'素材生産量倍率',guild212:'仕事1回の遠征加算',greenhouse212:'温室のごはん',gallery212:'素材博物館の評判',
  sanctuary212:'仲間のごきげん回復',treasureMuseum213:'お宝展示枠',
  flowerbed211:'この装飾の人気度',bench211:'この装飾の人気度',lamp211:'この装飾の人気度',fountain211:'この装飾の人気度',
  palace:'強化時の報酬',hut:'強化時の報酬',stall:'強化時の報酬'
};

(async()=>{
  const q=await open('1.13.15',{},hooks);
  try {
    const {f,d}=q,s=f.state();
    s.speed=0; s.coins=1e7; s.quests=[]; s.villageLv=s.worldTreeLevel=20;
    const buildings=new Map();
    for(const type of Object.keys(f.facilities).filter(key=>key!=='worldtree')){
      let current=s.buildings.find(b=>b.type===type);
      if(!current){current={type,id:s.nextId++,x:2,y:2,level:1};s.buildings.push(current);}
      current.level=1;buildings.set(type,current);
    }
    assert.deepEqual([...buildings.keys()].sort(),Object.keys(expectedRow).sort());
    function select(type) {
      const b=buildings.get(type); f.showFacility(b.id);
      const button=d.querySelector('[data-action="upgrade"][data-id="'+b.id+'"]');
      const preview=button?.closest('.info-card')?.querySelector('.upgrade-preview');
      assert(preview,'upgrade preview for '+type);
      assert(button.compareDocumentPosition(preview)&d.defaultView.Node.DOCUMENT_POSITION_PRECEDING);
      return {b,button,text:preview.textContent,preview};
    }
    for(const [type,label] of Object.entries(expectedRow)){
      const {text}=select(type);
      assert(text.includes('Lv.1 → Lv.2')&&text.includes(label),type+' '+text);
      assert(text.includes('成長XP +13')&&text.includes('評判 +3'),type+' rewards');
    }
    assert(select('workshop').text.includes('0.7 → 1.4'));
    assert(select('ranch').text.includes('1倍 → 1.16倍'));
    assert(select('flowerbed211').text.includes('2pt → 2.5pt'));
    assert(select('shop').text.includes('5個 → 6個'));
    const home=buildings.get('home');home.level=2;
    assert(select('home').text.includes('3匹 → 3匹'));assert(select('home').text.includes('Lv.4'));
    const museum=buildings.get('treasureMuseum213');
    assert(select('treasureMuseum213').text.includes('3枠 → 3枠'));
    assert(select('treasureMuseum213').text.includes('Lv.3'));museum.level=2;
    assert(select('treasureMuseum213').text.includes('3枠 → 4枠'));
    const inn=buildings.get('inn');inn.level=10;
    assert(select('inn').text.includes('14人 → 14人'));
    const farm=buildings.get('farm');
    s.buildings.push({...farm,id:s.nextId++,level:4});s.research.farm=2;
    const multipleFarm=select('farm'),perHour=n=>Math.round(.78*n**.84*1.5*f.seasonInfo().food*f.weatherInfo().food*1000)/1000;
    assert(multipleFarm.text.includes(perHour(5)+'個 → '+perHour(6)+'個'));
    const cost=f.costUpgrade(farm),cash=s.coins,exp=s.villageXp,rep=s.fame;
    click(d,'[data-action="upgrade"][data-id="'+farm.id+'"]');
    assert.equal(farm.level,2);near(cash-s.coins,cost);near(s.villageXp-exp,13);near(s.fame-rep,3);
    assert(select('farm').text.includes('評判 +4'));
    s.villageLv=s.worldTreeLevel=1;farm.level=3;
    const limited=select('farm');assert(limited.button.disabled);assert(limited.text.includes('世界樹Lv.2'));
    farm.level=99;const final=select('farm');
    assert(final.button.disabled);assert(final.text.includes('Lv.99'));assert(!final.text.includes('100'));
    s.villageLv=s.worldTreeLevel=4; const tree=s.buildings.find(b=>b.type==='worldtree');
    d.querySelector('#treeBenefits').open=true; f.showFacility(tree.id);
    const benefits=d.querySelector('#treeBenefitsBody').textContent;
    assert.match(benefits,/おやすみ牧舎　5 → 10匹/); assert.match(benefits,/開拓できる区画/);
    assert.match(benefits,/新しい施設/);
    assert.equal(d.querySelector('.worldtree-panel193 .tree-benefits-list').textContent,benefits);
    f.render(); assert(d.querySelector('#treeBenefits').open);
    console.log('PASS 25 upgrades, display before payment, per-building and aggregate formulas, capped visitor count, stepped slots, real XP/fame awards and level caps');
  } finally { q.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
