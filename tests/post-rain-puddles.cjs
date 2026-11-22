'use strict';
const {open,assert}=require('./harness138.cjs');

function checkPostRain(){
 const test=(condition,label)=>{if(!condition)throw Error(label);};
 const wetDay=Array.from({length:34},(_,i)=>i+1).find(d=>weatherInfo(d).name==='雨'&&weatherInfo(d+1).name!=='雨');
 test(wetDay,'rain followed by a dry day');
 const m=state.monsters[0],puddle=[...DEFAULT_PATH_KEYS].map(k=>k.split(',').map(Number))
   .find(p=>residentRoad(...p)&&rainPuddleAt(...p,wetDay)&&neighbors(...p).some(n=>residentRoad(...n)));
 const dry=neighbors(...puddle).find(n=>residentRoad(...n));
 const bounds={minX:MIN_X,maxX:W,minY:MIN_Y,maxY:H,left:-1e6,right:1e6,top:-1e6,bottom:1e6};
 const actual=drawRainPuddle,paints=[];
 drawRainPuddle=(g,x,y)=>paints.push({x,y,alpha:g.globalAlpha});
 function paint(){paints.length=0;drawPostRainPuddles(bounds);return paints.slice();}
 try{
  state.day=wetDay;state.hour=8;tickAccum=0;
  test(!paint().length,'no duplicate layer on an active rain day');
  ++state.day;
  const morning=paint();
  test(morning.some(({x,y})=>x===puddle[0]&&y===puddle[1]),'previous day’s paved puddle stays visible');
  const alpha=morning[0].alpha;
  state.hour=13;
  test(paint()[0].alpha<alpha,'puddles fade as the day advances');
  state.hour=14;
  test(!paint().length,'puddles have evaporated by 14:00');
  state.hour=8;

  [m.x,m.y]=dry;
  m.path=[puddle,dry];
  const route=m.path;
  stepPostRainHops(.08);
  test(!activePostRainHop(m),'no jump at first sight');
  [m.x,m.y]=puddle;
  const before=JSON.stringify(state);
  stepPostRainHops(.08);
  const hop=activePostRainHop(m);
  test(hop&&hop.x===m.x&&hop.y===m.y,'natural crossing begins cosmetic jump');
  test(JSON.stringify(state)===before&&m.path===route,'jump leaves save state and route untouched');
  stepPostRainHops(.4);
  test(activePostRainHop(m)?.elapsed===.4,'hop advances with simulated movement');
  const timer=monsterWalkTimer139(m);
  timer.visit={};
  test(!activePostRainHop(m),'a facility visit takes visual priority');
  timer.visit=null;
  stepPostRainHops(.4);
  test(!activePostRainHop(m),'hop expires');
  [m.x,m.y]=dry;stepPostRainHops(.08);
  [m.x,m.y]=puddle;stepPostRainHops(.08);
  test(!activePostRainHop(m),'the same actor does not hop on every repeated crossing');
  state.removedDefaultPaths.push(keyXY(...puddle));
  test(!paint().some(({x,y})=>x===puddle[0]&&y===puddle[1]),'erased road leaves no ghost puddle');
  return true;
 }finally{drawRainPuddle=actual;}
}

(async()=>{
 const q=await open('working',{},'window.checkPostRain='+checkPostRain.toString());
 try{assert(q.w.checkPostRain());console.log('PASS: residual puddles, route-safe hops, midday drying');}
 finally{q.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
