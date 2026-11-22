'use strict';
const {open,assert}=require('./harness138.cjs');

const hooks=`Object.assign(window.qa138,{
 treeRequirementStatus193,treeCost193,villageThreshold,facilityLevelCap193,
 renderPassive:()=>renderUI(false)
});`;

async function run(){
 const q=await open(process.argv[2]||'working',{},hooks);
 try{
  const {f,d}=q,s=f.state();
  const tree=s.buildings.find(b=>b.type==='worldtree');
  const panel=()=>{const el=d.querySelector('#managementTreeGrowth');assert(el,'current world-tree requirements in management');return el.textContent;};
  const setLevel=level=>{s.villageLv=s.worldTreeLevel=tree.level=level;};

  // The old pane showed obsolete milestone rows at Lv.1 and called Lv.10 the maximum.
  for(const level of [1,10,19]){
   setLevel(level);f.render('management');
   const text=panel();
   assert(text.includes('世界樹 Lv.'+level+' → Lv.'+(level+1)+' の成長条件'));
   assert(!d.querySelector('#tabBody').textContent.includes('最大レベルに到達'));
   for(const r of f.treeRequirementStatus193(level+1))
    assert(text.includes(r.label+'（'+r.value+'/'+r.need+'軒）'),r.type+' matches the actual gate at Lv.'+level);
   const cost=f.treeCost193(level);
   assert(text.includes(cost.coins.toLocaleString('ja-JP')+' G'),'current growth price');
   assert(text.includes(' / '+f.villageThreshold(level).toLocaleString('ja-JP')),'current XP threshold');
  }

  setLevel(3);
  const cap=f.facilityLevelCap193();
  for(const r of f.treeRequirementStatus193(4)){
   const sites=s.buildings.filter(b=>b.type===r.type);
   for(const b of sites)b.level=cap;
   for(let i=sites.length;i<r.count;i++)s.buildings.push({id:s.nextId++,type:r.type,x:3,y:7,level:cap,facing:0});
  }
  const extra={id:s.nextId++,type:'home',x:10,y:7,level:cap-1,facing:0};s.buildings.push(extra);
  s.buildings.push({id:s.nextId++,type:'flowerbed211',x:6,y:7,level:1,facing:0});
  const cost=f.treeCost193(3),needed=f.villageThreshold(3);
  s.villageXp=needed;s.coins=cost.coins;s.magic=cost.magic;
  f.render('management');
  const home=f.treeRequirementStatus193(4).find(r=>r.type==='home');
  assert(!home.ok&&home.need===s.buildings.filter(b=>b.type==='home').length);
  assert(panel().includes('▫️ '+home.label+'（'+home.value+'/'+home.need+'軒）'),'all placed homes must reach the cap');
  assert(d.querySelector('#treeGrow').hidden,'underleveled extra home prevents growth');
  assert(!panel().includes('お花畑 Lv.'),'decorations are not required');

  extra.level=cap;f.renderPassive();
  const complete=f.treeRequirementStatus193(4).find(r=>r.type==='home');
  assert(panel().includes('✅ '+complete.label+'（'+complete.value+'/'+complete.need+'軒）'),'passive pane refresh reflects upgrade');
  assert(!d.querySelector('#treeGrow').hidden,'the same conditions enable world-tree growth');
  for(const [field,label] of [['coins','おかね'],['magic','キラキラ'],['villageXp','成長XP']]){
   const previous=s[field];s[field]=previous-1;f.renderPassive();
   assert(panel().includes('▫️ '+label),'insufficient '+field+' is shown on passive refresh');
   assert(d.querySelector('#treeGrow').hidden,'insufficient '+field+' disables actual growth');
   s[field]=previous;f.renderPassive();
   assert(panel().includes('✅ '+label),'restored '+field+' is shown on passive refresh');
   assert(!d.querySelector('#treeGrow').hidden);
  }
  console.log('PASS management growth: current Lv.1/10/19 conditions, all placed buildings, decorations excluded, XP/G/magic gates and passive updates');
 }finally{q.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
