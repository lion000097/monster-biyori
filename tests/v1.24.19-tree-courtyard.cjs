'use strict';
const {assert,open,wait}=require('./harness138.cjs');

const hook=`Object.assign(window.qa138,{
 assets:()=>facilitySheetReady&&villageSheetReady&&expeditionOfficeSheet.complete,
 run(){
  const check=(ok,label)=>{if(!ok)throw Error(label);};
  const tree=state.buildings.find(b=>b.type==='worldtree');
  Object.assign(tree,{x:4,y:4});
  state.zones=[0,1,4,5];state.buildings=[tree];state.paths=[];state.ponds=[];
  state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];
  const m=state.monsters[0],points=[];
  state.monsters=[m];
  const stats=[state.coins,state.food,state.magic,state.stock];
  for(let dir=0;dir<4;dir++){
   tree.facing=dir;
   for(const ratio of [1/12,11/12]){
    const door=frontPoint('worldtree',tree.x,tree.y,dir,ratio,.5).map(Math.floor);
    state.paths=[keyXY(...door)];state.clearedScenery=state.paths.slice();state.clearedPonds=state.paths.slice();
    Object.assign(m,{x:door[0],y:door[1],path:[],ranchTarget200:null});
    startFacilityVisit(m,tree,{pt:door,path:[]});
    let p=0;for(;plotWalks.get(m)?.phase!=='use'&&p<240;p++)advanceFacilityVisit(m,.1);
    check(plotWalks.get(m)?.phase==='use','arrived from facing '+dir);
    const x=m.x+.5-tree.x,y=m.y+.5-tree.y;
    check([x,y,6-x,6-y].every(v=>v>=1.25),'fully inside and not only on outer edge '+JSON.stringify({x,y,dir}));
    check(Math.abs(x-y)>1.9,'not directly behind trunk');
    check(worldTreeCourtyardContains(tree,m.x+.5,m.y+.5),'courtyard view uses foreground order');
    check(!m.indoorRest,'World Tree is not a bedroom');
    points.push([+x.toFixed(2),+y.toFixed(2)]);
    for(let i=0;plotWalks.get(m)&&i<240;i++)advanceFacilityVisit(m,.1);
    check(!plotWalks.get(m)&&m.x===door[0]&&m.y===door[1],'returns through original door');
   }
  }
  check(JSON.stringify(stats)===JSON.stringify([state.coins,state.food,state.magic,state.stock]),'no resource change');
  return points;
 }
});`;
(async()=>{
 const g=await open('working',{},hook);
 try{
  for(let i=0;i<150&&!g.f.assets();i++)await wait(20);
  assert(g.f.assets());
  const points=g.f.run();
  assert.equal(points.length,8);
  console.log('PASS world tree courtyard interior, visible trunk-side positions, four gates and original return roads');
 }finally{g.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
