'use strict';
const {assert, open, click, KEY} = require('./harness138.cjs');
const version = process.env.MONSTER_TEST_VERSION || '1.24.3';
const hooks = `Object.assign(window.qa138, {
  editing: () => ({mode:terrainMode, dragging:terrainDragging, pointer:terrainPointer, build:buildMode, clear:clearMode}),
  pointer(type,x,y) {
    const origin=mapScreenOrigin(), p=projectGround(x+.5,y+.5);
    canvas.getBoundingClientRect=()=>({left:0,top:0,width:VW*T,height:VH*T});
    const event=new MouseEvent(type,{bubbles:true,cancelable:true,clientX:origin.x+p.x*zoom,clientY:origin.y+p.y*zoom});
    Object.defineProperties(event,{pointerId:{value:1},pointerType:{value:'mouse'}});
    canvas.dispatchEvent(event);
  },
  prepare() {
    state.speed=0;state.coins=600;state.buildings=[];state.guests=[];state.paths=[];state.ponds=[];state.stoneTiles={};
    state.zones=[0,1,4,5];state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];
    state.clearedScenery=[];state.clearedPonds=[];
    for(let x=0;x<22;x++)for(let y=0;y<20;y++){
      state.clearedScenery.push(keyXY(x,y));state.clearedPonds.push(keyXY(x,y));
    }
    for(const actor of [...state.monsters,...state.staff])Object.assign(actor,{x:10,y:7,path:[]});
    renderUI(true);
  }
});`;

async function run() {
  const game=await open(version,{},hooks);
  try {
    const {d,w,f}=game,s=f.state(),canvas=d.getElementById('game'),captured=new Set();
    canvas.setPointerCapture=id=>captured.add(id);
    canvas.hasPointerCapture=id=>captured.has(id);
    canvas.releasePointerCapture=id=>captured.delete(id);
    const escape=()=>w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));
    f.prepare();
    for(const mode of ['road','stone','roadErase','pond','pondErase']) {
      click(d,'[data-v16-action="terrain"][data-id="'+mode+'"]');
      assert.equal(f.editing().mode,mode);
      escape();
      assert.equal(f.editing().mode,null,'Escape must leave '+mode+' mode');
      f.pointer('pointerdown',8,6);f.pointer('pointerup',8,6);
      assert.equal(s.coins,600,'A click after cancellation must not spend coins');
      assert.equal(s.paths.length+s.ponds.length+Object.keys(s.stoneTiles).length,0,'A click after cancellation must not edit terrain');
    }

    click(d,'[data-v16-action="terrain"][data-id="stone"]');
    f.pointer('pointerdown',8,6);
    assert.equal(s.coins,500);assert(s.stoneTiles['8,6']);
    assert(f.editing().dragging);assert(captured.has(1));
    escape();
    assert.equal(f.editing().mode,null);assert.equal(f.editing().dragging,false);
    assert.equal(f.editing().pointer,null);assert(!captured.has(1),'Cancellation releases pointer capture');
    const saved=JSON.parse(w.localStorage.getItem(KEY));
    assert(saved.stoneTiles['8,6']);assert.equal(saved.coins,500,'Already placed tiles and their price are saved');
    f.pointer('pointermove',9,6);f.pointer('pointerup',9,6);
    assert(!s.stoneTiles['9,6']);assert.equal(s.coins,500,'Remaining events from a cancelled stroke must do nothing');

    click(d,'[data-v16-action="terrain"][data-id="stone"]');
    f.pointer('pointerdown',9,6);
    assert(s.stoneTiles['9,6']);assert.equal(s.coins,400,'A new stroke still works after cancellation');
    click(d,'[data-v16-action="terrainOff"]');
    assert.equal(f.editing().mode,null);assert.equal(f.editing().dragging,false);
    assert.equal(f.editing().pointer,null);assert(!captured.has(1));
    f.pointer('pointermove',9,5);f.pointer('pointerup',9,5);
    assert(!s.stoneTiles['9,5']);assert.equal(s.coins,400);
    assert.equal(JSON.parse(w.localStorage.getItem(KEY)).coins,400);

    click(d,'[data-action="build"][data-id="farm"]');
    assert.equal(f.editing().build,'farm');escape();assert.equal(f.editing().build,null);
    click(d,'[data-action="toggleClear"]');
    assert(f.editing().clear);escape();assert.equal(f.editing().clear,false);
  } finally { game.close(); }
  console.log('PASS Escape and finish cancel all terrain tools, active paid strokes save and release capture, post-cancel clicks are harmless, editing can resume');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
