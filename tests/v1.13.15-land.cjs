'use strict';

const {assert, open, persist, clone, near} = require('./harness138.cjs');
const release = '1.13.15';
const hooks = `Object.assign(window.qa138,{
  zones:ZONES, zoneId, zoneRequiredLevel, zoneOpenable, zonePrice, unlockZone, unlocked, place, canBuild,
  selectLandPoint:(x,y,z)=>{
    zoom=z;cameraX=x+.5-VW/(2*z);cameraY=y+.5-VH/(2*z);limitCamera();
    const rect=canvas.getBoundingClientRect();return {clientX:rect.left+rect.width*(x+.5-cameraX)*z/VW,
      clientY:rect.top+rect.height*(y+.5-cameraY)*z/VH};
  },
  selected:()=>selectedBuilding
});`;
const starter=[0,1,4,5];
const levels=[
  [20,15,9,12,16,19],
  [14,8,2,4,10,17],
  [9,2,1,1,3,11],
  [13,5,1,1,1,12],
  [18,11,3,6,7,15]
];

// The gameplay handlers consume Pointer Events. jsdom has MouseEvent and no native pointer capture.
function mapControls(d,w,f) {
  const canvas=d.querySelector('#game'), rect={left:12,top:26,width:336,height:229};
  canvas.getBoundingClientRect=()=>rect;
  let captured=null;
  canvas.setPointerCapture=id=>{captured=id};
  canvas.hasPointerCapture=id=>captured===id;
  canvas.releasePointerCapture=()=>{captured=null};
  function send(type,point,pointerType='mouse') {
    const event=new w.MouseEvent(type,{...point,button:0,bubbles:true,cancelable:true});
    Object.defineProperties(event,{pointerId:{value:32},pointerType:{value:pointerType}});
    canvas.dispatchEvent(event);
  }
  return {
    tap(x,y,device='mouse',zoom=1) {
      const point=f.selectLandPoint(x,y,zoom);
      send('pointerdown',point,device); send('pointerup',point,device);
    },
    drag(x,y) {
      const point=f.selectLandPoint(x,y,1.2);
      send('pointerdown',point,'touch');
      const end={clientX:point.clientX+25, clientY:point.clientY};
      send('pointermove',end,'touch'); send('pointerup',end,'touch');
    }
  };
}

async function testMap() {
  const q=await open(release,{},hooks);
  try {
    const {f,d,w}=q, s=f.state(), map=mapControls(d,w,f);
    s.speed=0;
    const worldLevel=level=>{s.worldTreeLevel=s.villageLv=level;};
    const lastNotice=()=>d.querySelector('#toasts').lastElementChild?.textContent||'';
    const all=Array.from(f.zones,(_,i)=>i);
    assert.deepEqual(clone(s.zones).sort((a,b)=>a-b),starter);
    assert.equal(all.length,30);
    for(const [id,z] of f.zones.entries()){
      const x=z.x*11,y=z.y*10;
      assert.equal(f.zoneId(x,y),id);
      assert.equal(f.zoneId(x+10,y+9),id);
      assert.equal(f.zoneRequiredLevel(id),levels[z.y+2][z.x+2]);
    }
    const thresholds=all.filter(id=>!starter.includes(id)).map(id=>f.zoneRequiredLevel(id));
    assert.deepEqual([...new Set(thresholds)].sort((a,b)=>a-b),Array.from({length:20},(_,i)=>i+1));
    for(const [x,y] of [[-23,0],[-22,-21],[44,0],[43,30],[-400,-400]]){
      assert.equal(f.zoneId(x,y),-1); assert.equal(f.unlocked(x,y),false);
    }
    let confirmations=[],accept=true;
    w.confirm=message=>{confirmations.push(message);return accept;};
    const north=f.zoneId(2,-4), west=f.zoneId(-3,2), corner=f.zoneId(-5,-4);
    assert.equal(north,20); assert.equal(west,25); assert.equal(corner,19);
    s.coins=25000; const initial=s.coins, northPrice=f.zonePrice(north), westPrice=f.zonePrice(west);
    worldLevel(20); assert(!f.zoneOpenable(corner)); map.tap(-5,-4);
    assert(!s.zones.includes(corner)); near(s.coins,initial); assert.deepEqual(confirmations,[]);
    assert.match(lastNotice(),/上下左右|隣/);
    worldLevel(1); assert(!f.zoneOpenable(north)); map.tap(2,-4,'touch',1.5);
    assert.match(lastNotice(),/世界樹Lv\.2/); assert.match(lastNotice(),/4,?200/);
    f.unlockZone(north); assert(!s.zones.includes(north)); near(s.coins,initial); assert.deepEqual(confirmations,[]);
    worldLevel(2); s.coins=northPrice-1;
    assert(f.zoneOpenable(north)); f.unlockZone(north); map.tap(2,-4,'touch',.85);
    assert(!s.zones.includes(north)); near(s.coins,northPrice-1); assert.deepEqual(confirmations,[]);
    assert.match(lastNotice(),/あと1G/);
    s.coins=initial; accept=false; map.tap(2,-4,'touch',1.5);
    assert.equal(confirmations.length,1); assert.match(confirmations[0],/世界樹Lv\.2/);
    assert(!s.zones.includes(north)); near(s.coins,initial);
    accept=true; map.drag(2,-4); assert.equal(confirmations.length,1);
    map.tap(2,-4,'touch',1.5); assert.equal(confirmations.length,2);
    assert.match(confirmations[1],new RegExp(northPrice.toLocaleString('ja-JP')+'|'+northPrice));
    assert(f.unlocked(0,-10)); assert(f.unlocked(10,-1)); assert(!f.unlocked(11,-1)); near(s.coins,initial-northPrice);
    const expense=s.economy.expense; f.unlockZone(north); assert.equal(s.zones.filter(id=>id===north).length,1);
    near(s.coins,initial-northPrice); near(s.economy.expense,expense);
    map.tap(-3,2,'mouse',.9); assert.equal(confirmations.length,3); assert(f.unlocked(-1,0));
    assert(f.unlocked(-11,9)); near(s.coins,initial-northPrice-westPrice);
    let cell;
    for(let y=0;y<=8 && !cell;y++)for(let x=-11;x<=-2;x++)if(f.canBuild(x,y,null,false,'farm')){cell={x,y};break;}
    assert(cell,'newly opened western parcel contains a placeable footprint');
    f.place('farm',cell.x,cell.y);
    const b=s.buildings.find(b=>b.type==='farm'&&b.x===cell.x&&b.y===cell.y); assert(b);
    map.tap(cell.x,cell.y,'touch',1.5); assert.equal(f.selected(),b.id);
    assert(f.save(true)); assert(f.load());
    assert(f.unlocked(0,-1)); assert(f.unlocked(-1,0)); assert(f.state().buildings.some(o=>o.id===b.id));
    const reloaded=f.state(); reloaded.worldTreeLevel=reloaded.villageLv=20; reloaded.coins=1e6;
    for(let round=0;round<all.length;round++){
      const id=all.find(i=>f.zoneOpenable(i)); if(id===undefined)break;
      const money=reloaded.coins; f.unlockZone(id); assert(reloaded.zones.includes(id));
      near(reloaded.coins,money-f.zonePrice(id));
    }
    assert.deepEqual(clone(reloaded.zones).sort((a,b)=>a-b),all);
    assert.equal(f.unlocked(-22,-20),true); assert.equal(f.unlocked(43,29),true);
    console.log('PASS all 30 signed parcel IDs, all 20 tree levels, north/west real touch and mouse purchases, cancellation, drag, wallet, adjacency, duplicate and map footprint');
  } finally {q.close();}
}

async function legacyOwnership(){
  const q=await open('1.13.14');let storage;
  try{
    const {f,w}=q,s=f.state();s.speed=0;s.coins=2345.75;s.zones.push(12,20,25);
    assert(f.save(true));storage=persist(w);
  }finally{q.close();}
  const current=await open(release,storage,hooks);
  try{
    const {f}=current,s=f.state();
    assert.equal(s.villageLv,1);near(s.coins,2345.75);
    assert.deepEqual(clone(s.zones).sort((a,b)=>a-b),[0,1,4,5,12,20,25]);
    assert(f.unlocked(-22,-20));assert(f.unlocked(1,-1));assert(f.unlocked(-1,0));
    assert(!f.zoneOpenable(12));assert(!f.zoneOpenable(20));assert(!f.zoneOpenable(25));
    assert(f.save(true)&&f.load());assert(f.unlocked(-22,-20));near(f.state().coins,2345.75);
    console.log('PASS grandfathered high-tier and negative-coordinate land survives .14 migration and reload at Lv.1');
  }finally{current.close();}
}

(async()=>{await testMap();await legacyOwnership();})().catch(err=>{console.error(err);process.exitCode=1;});
