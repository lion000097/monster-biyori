'use strict';
const {assert,open,persist}=require('./harness138.cjs');
const hooks=`
Object.assign(window.qa138,{residentRoad,roadEdges,place,canBuild,putTerrain,hire,seek,stepActors,canMoveWorldTree195,
 move:(id,x,y)=>{moveMode=id;moveBuilding(x,y)},pathTo,setup:()=>{
  const s=state;
  s.buildings=[];s.paths=[];s.removedDefaultPaths=[...DEFAULT_PATH_KEYS];s.villageLv=20;s.coins=20000;
  for(let x=1;x<=9;x++)for(let y=1;y<=9;y++){s.clearedScenery.push(keyXY(x,y));s.clearedPonds.push(keyXY(x,y))}
 }});`;
async function main(){
 const old=await open('1.13.24');let snapshot;
 try{old.f.state().monsters[0].x=6;old.f.state().monsters[0].y=6;old.f.save(true);snapshot=persist(old.w)}finally{old.close()}
 const q=await open('1.13.25',snapshot,hooks),fresh=await open('1.13.25',{},hooks);
 try{
  const {f,d}=q,s=f.state();const onRoad=a=>f.residentRoad(Math.round(a.x),Math.round(a.y));
  assert([...s.monsters,...s.staff].every(onRoad));
  assert(fresh.f.state().buildings.every(b=>fresh.f.roadEdges(b.type,b.x,b.y).length));
  f.setup();const m=s.monsters[0],w=s.staff[0];s.monsters=[m];s.staff=[w];s.guests=[];
  const startCash=s.coins;
  s.paths=['2,2'];f.place('farm',3,3);assert.equal(s.buildings.length,0);assert.equal(s.coins,startCash);
  assert.equal(d.querySelector('#toasts').lastElementChild.textContent,'道に隣接してないと置けません');
  for(const key of ['3,2','5,3','4,5','2,4']){s.paths=[key];assert(f.canBuild(3,3,null,true,'farm'))}
  s.paths=['1,3','2,3','3,2','2,2','1,2','1,1'];Object.assign(m,{x:1,y:1,path:[]});Object.assign(w,{x:1,y:1,path:[],job:'gather',jobTarget211:null,jobCooldown211:0});
  f.place('farm',3,3);assert.equal(s.buildings.length,1);
  const b=s.buildings[0];f.move(b.id,6,6);assert.deepEqual([b.x,b.y],[3,3]);
  f.putTerrain('roadErase',3,2);f.putTerrain('roadErase',2,3);assert(f.residentRoad(2,3));
  f.seek(w,'gather');assert(w.jobTarget211);assert(w.path.every(p=>f.residentRoad(...p)));
  s.guests=[{name:'旅人',x:6,y:6,phase212:'arrive',entered211:true,route212:[[7,6],[8,6]]}];
  const guest=s.guests[0];for(let i=0;i<250;i++){f.stepActors(.032);assert(onRoad(m)&&onRoad(w))}
  assert(w.x>1||w.y>1);assert(guest.x>6);assert(!onRoad(guest));
  s.paths=['1,1','2,3'];assert.equal(f.pathTo(1,1,2,3,true).length,0);assert(f.pathTo(1,1,2,3).length);
  m.x=1;m.y=1;m.path=[[2,3]];f.stepActors(.1);assert.deepEqual([m.x,m.y],[1,1]);
  f.hire();assert(onRoad(s.staff.at(-1)));
  assert(!f.canMoveWorldTree195(1,1));
  console.log('PASS fresh/old ranch, four edges, diagonal notice, cost, movement, road removal, worker job, free-moving guest, disconnected roads and hire');
 }finally{q.close();fresh.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
