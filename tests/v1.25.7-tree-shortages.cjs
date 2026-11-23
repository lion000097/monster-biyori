'use strict';
const {assert,open}=require('./harness138.cjs');

(async()=>{
 const q=await open('working',{},`
  window.treeQa1257={status:treeGrowthStatus1257,summary:renderTreeSummary,
    menu:(b)=>renderBuildingMenu({building:b,direction:0}),
    needs:treeRequirementStatus193,cap:facilityLevelCap193,bulk:treeBulkUpgradePlan1255,
    targetRow:treeTargetRow,tab:(v)=>{tab=v;renderTab();},grow:growWorldTree193,
    ready:()=>!!(facilitySheetReady&&villageSheetReady&&treeDecorationReady&&expeditionOfficeSheet.complete)};
 `);
 try{
  const {w,d}=q,{state}=q.f,t=w.treeQa1257,s=state();
  for(let i=0;i<100&&!t.ready();i++)await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(t.ready(),true,'art callbacks complete');
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  const tree=s.buildings.find(b=>b.type==='worldtree');
  const cap=t.cap();
  // Mixed state: one facility type is already complete; another is absent in
  // part and also has a placed copy below cap. Keep real game IDs and renderer.
  for(const r of t.needs(s.villageLv+1)){
   const current=s.buildings.filter(b=>b.type===r.type);
   current.forEach(b=>b.level=cap);
  }
  const current=t.status(),kind=current.requirements.find(r=>r.type==='home')?.type;
  assert(kind);
  const homes=s.buildings.filter(b=>b.type===kind);
  assert(homes.length>=1);
  const unfinished=homes[0];unfinished.level=1;
  const homeNeed=current.requirements.find(r=>r.type===kind).need;
  const keep=new Set(homes.slice(0,Math.max(1,homeNeed-1)));
  s.buildings=s.buildings.filter(b=>b.type!==kind||keep.has(b));
  const {needed,cost}=t.status();
  s.villageXp=needed-12.1;s.coins=cost.coins-16.05;s.magic=cost.magic-1.001;
  const before=JSON.stringify(s);
  t.summary();
  assert.equal(JSON.stringify(s),before,'view never changes the save');
  const text=d.getElementById('treeGrowthNotice1257').textContent;
  for(const label of ['あと何が足りない？','13 XP','17 G','キラキラ：あと 2','施設の建設','施設の強化'])assert(text.includes(label),label);
  assert(d.querySelector('#treeTargets li:first-child [data-tree-target]'));
  const target=d.querySelector('#treeTargets [data-tree-target="home"]');
  for(const label of ['未建設 1軒','強化が必要 1軒','あと 2軒','強化先を見る'])assert(target.textContent.includes(label),label);
  assert(d.getElementById('treeGrow').hidden);
  const btn=d.querySelector('#treeBulkUpgrade1255 [data-tree-bulk-upgrade="review"]');
  assert(btn?.disabled,'bulk still has its own shared affordability check');
  t.tab('management');assert(d.querySelector('#managementTreeGrowth').textContent.includes('あと何が足りない？'));
  assert(d.querySelector('#managementTreeGrowth .tree-growth-facilities1257').firstElementChild.classList.contains('tree-growth-open1257'));
  t.menu(tree);assert.equal(d.getElementById('mapTreeGrowthNotice1257').hidden,false);
  assert(d.querySelector('#buildingMenuTools [data-v193=grow]').disabled);
  d.getElementById('buildingEffects').open=true;
  t.menu(tree);assert(d.querySelector('#buildingEffectsBody .tree-growth-facilities1257').textContent.includes('未建設 1軒'));
  t.menu(unfinished);assert.equal(d.getElementById('mapTreeGrowthNotice1257').hidden,true);
  // At exact threshold with all required buildings, no false missing item.
  for(const r of t.status().requirements){
   const placed=s.buildings.filter(b=>b.type===r.type);
   placed.forEach(b=>b.level=r.minLevel);
   for(let i=placed.length;i<r.need;i++)s.buildings.push({...placed[0],id:s.nextId++,type:r.type,level:r.minLevel});
  }
  s.villageXp=needed;s.coins=cost.coins;s.magic=cost.magic;
  t.summary();
  assert.equal(t.status().ready,true);
  assert(!d.getElementById('treeGrow').hidden);
  assert(d.getElementById('treeGrowthNotice1257').textContent.includes('成長条件がそろいました'));
  t.menu(tree);
  assert(!d.querySelector('#buildingMenuTools [data-v193=grow]').disabled);
  s.buildings=s.buildings.filter(b=>b!==tree);t.summary();
  assert(d.getElementById('treeGrow').hidden);
  assert(d.getElementById('treeGrowthNotice1257').textContent.includes('世界樹を設置する'));
  s.buildings.push(tree);
  const beforeLevel=s.villageLv;
  t.grow();assert.equal(s.villageLv,beforeLevel+1,'uses original growth gate, including exact costs');
  console.log('PASS multiple independent shortages, sorted actionable rows, management + menu, exact-ready, no-tree and real growth');
 } finally { q.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
