'use strict';
const {assert, change, click, clone, open, wait} = require('./harness138.cjs');
const version=process.env.MONSTER_TARGET_VERSION||'working';
const hooks=`Object.assign(window.qa138,{
  route:()=>workRoad,update:updateRoadCheck,draw:()=>drawWorld(performance.now()),
  inPlot:(w,door)=>plotWalks.set(w,{door}),
  release:w=>plotWalks.delete(w),
  layout(){
    state.speed=0;state.zones=[0,1,4,5];state.paths=['3,8','4,8','5,8','6,8','7,8','10,8'];
    state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];state.stoneTiles={'5,8':true};
    state.ponds=[];state.clearedPonds=[];state.clearedScenery=[];
    for(let x=0;x<=20;x++)for(let y=0;y<=16;y++){
      state.clearedScenery.push(keyXY(x,y));state.clearedPonds.push(keyXY(x,y));
    }
    const home=(id,x)=>({id,type:'home',x,y:6,w:2,h:2,level:1,facing:0});
    state.buildings=[home(201,6),home(202,10)];
    Object.assign(state.staff[0],{job:'keeper',x:3,y:8,path:[]});
    Object.assign(state.staff[1],{job:'study',x:10,y:8,path:[]});
  }
});`;
(async()=>{
  const g=await open(version,{},hooks);
  try{
    const {w,f,d}=g,s=f.state();f.layout();f.render('staff');
    const worker=s.staff[0],other=s.staff[1];
    const before=clone([s.coins,s.paths,worker]);
    click(d,'[data-road-worker="'+worker.id+'"]');await wait(5);
    assert(d.getElementById('roadCheck').open);assert.equal(d.getElementById('roadWorkplace').options.length,2);
    assert.deepEqual(clone(f.route().tiles),[[3,8],[4,8],[5,8],[6,8]]);
    f.draw();assert.deepEqual(clone([s.coins,s.paths,worker]),before);
    change(w,'#roadWorkplace','202');assert.match(d.querySelector('#roadStatus').textContent,/途切れ/);
    change(w,'#roadWorkplace','201');s.paths.splice(s.paths.indexOf('4,8'),1);f.render();
    assert.equal(f.route().tiles.length,0);s.paths.push('4,8');f.render();assert.equal(f.route().tiles.length,4);
    s.buildings[0].facing=2;f.render();assert.match(f.route().message,/正面/);
    s.buildings[0].facing=0;worker.x=6;f.render();assert.equal(f.route().tiles.length,1);
    f.inPlot(worker,[6,8]);worker.x=6.5;worker.y=6;f.update();
    assert.deepEqual(clone(f.route().tiles),[[6,8]]);f.release(worker);
    change(w,'#roadWorker',String(other.id));assert(d.querySelector('#roadWorkplace').disabled);
    assert.match(d.querySelector('#roadStatus').textContent,/研究所/);
    d.getElementById('roadCheck').open=false;await wait(5);assert.equal(f.route(),null);
    console.log('PASS worker and workplace selectors, road-only overlay, front entrance, live edits, in-facility worker and missing workplaces');
  }finally{g.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
