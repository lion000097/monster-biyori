// The map is stable during one simulation or paint pass. Never reuse these
// snapshots across input events, save imports, undo, or a ranch switch.
const townGrid = (() => {
  const cols=W-MIN_X, cells=cols*(H-MIN_Y);
  const path=1, pond=2, tree=4, stone=8;
  const natural=new Uint8Array(cells), zones=new Int16Array(cells), keys=new Map();
  const slow={building:getBuildingAt, path:isPath, pond:isPond, scenery:sceneryAt, walk:isWalkable, unlocked};
  function index(x,y){return (y-MIN_Y)*cols+x-MIN_X;}
  function onMap(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=MIN_X&&y>=MIN_Y&&x<W&&y<H;}
  for(let y=MIN_Y;y<H;y++)for(let x=MIN_X;x<W;x++){
    const i=index(x,y),key=keyXY(x,y),feature=slow.scenery(x,y);
    keys.set(key,i); zones[i]=zoneId(x,y);
    natural[i]=(DEFAULT_PATH_KEYS.has(key)?path:0)|(DEFAULT_POND_KEYS.has(key)?pond:0)|
      (feature==='tree'?tree:feature==='stone'?stone:0);
  }
  function mark(bits,positions,flag,enable){
    for(const key of positions||[]){
      const i=keys.get(key);if(i===undefined)continue;
      if(enable)bits[i]|=flag;else bits[i]&=~flag;
    }
  }
  function snapshot(){
    const bits=natural.slice(), buildings=new Array(cells), open=new Uint8Array(ZONES.length);
    for(const z of state.zones)open[z]=1;
    mark(bits,state.removedDefaultPaths,path,false);mark(bits,state.paths,path,true);
    mark(bits,state.clearedPonds,pond,false);mark(bits,state.ponds,pond,true);
    mark(bits,state.clearedScenery,tree|stone,false);
    let treeFound=false;
    for(const b of state.buildings){
      const m=buildingOf(b);
      for(let y=Math.max(MIN_Y,Math.ceil(b.y));y<Math.min(H,b.y+m.h);y++)
        for(let x=Math.max(MIN_X,Math.ceil(b.x));x<Math.min(W,b.x+m.w);x++){
          const i=index(x,y);
          if(buildings[i]===undefined)buildings[i]=b;
        }
      if(b.type==='worldtree'&&!treeFound){
        treeFound=true;
        for(let y=Math.max(MIN_Y,Math.ceil(b.y));y<Math.min(H,b.y+6);y++)
          for(let x=Math.max(MIN_X,Math.ceil(b.x));x<Math.min(W,b.x+6);x++)bits[index(x,y)]&=~path;
      }
      if(onMap(b.x,b.y)&&townCatalog[b.type]?.role==='decor'&&!roadOrnament(b.type))
        bits[index(b.x,b.y)]&=~path;
    }
    return {buildings,bits,open,walk:new Uint8Array(cells)};
  }
  let active=null;
  function run(fn,args){
    if(active||!state)return fn(...args);
    active=snapshot();
    try{return fn(...args);}finally{active=null;}
  }
  getBuildingAt=function(x,y){
    return active&&onMap(x,y)?active.buildings[index(x,y)]:slow.building(x,y);
  };
  isPath=function(x,y){
    return active&&onMap(x,y)?!!(active.bits[index(x,y)]&path):slow.path(x,y);
  };
  isPond=function(x,y){
    return active&&onMap(x,y)?!!(active.bits[index(x,y)]&pond):slow.pond(x,y);
  };
  sceneryAt=function(x,y){
    if(!active||!onMap(x,y))return slow.scenery(x,y);
    const b=active.bits[index(x,y)];return b&tree?'tree':b&stone?'stone':null;
  };
  unlocked=function(x,y){
    return active&&onMap(x,y)?!!active.open[zones[index(x,y)]]:slow.unlocked(x,y);
  };
  isWalkable=function(x,y){
    if(!active||!onMap(x,y))return slow.walk(x,y);
    const i=index(x,y);
    if(!active.walk[i])active.walk[i]=slow.walk(x,y)?2:1;
    return active.walk[i]===2;
  };
  function scoped(fn){return (...args)=>run(fn,args);}
  stepActors=scoped(stepActors);drawWorld=scoped(drawWorld);pathTo=scoped(pathTo);
  return {run};
})();
