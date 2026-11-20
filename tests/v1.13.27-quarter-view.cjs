'use strict';

const {assert, open, click, wait} = require('./harness138.cjs');
const hooks = `
Object.assign(window.qa138, {
  project: projectGround, inverse: unprojectGround, groundTile: groundArt,
  getZoom: () => zoom, point: screenGround, selected: () => selectedBuilding, readyPlots: () => facilitySheetReady,
  frame: spriteBuildingV161, draw: drawWorld, isRoad: isPath, isWater: isPond,
  camera(x,y,z) {zoom=z;cameraX=x-VW/(2*z);cameraY=y-VH/(2*z);limitCamera()},
  zoomAt(z,x,y) {setZoom(z,x/T,y/T)},
  coords(x,y) {const p=projectGround(x,y),o=mapScreenOrigin();return [o.x+p.x*zoom,o.y+p.y*zoom]},
  cell(x,y) {return canvasCell({clientX:x,clientY:y})},
  ghost(x,y) {hover={x,y};drawWorld(0);hover=null},
  pickRoof(b) {
    const {rect,art}=mapPickItems.find(item=>item.building===b);
    const {data}=art.getContext('2d').getImageData(0,0,art.width,art.height),o=mapScreenOrigin();
    for(let y=0;y<art.height;y++)for(let x=0;x<art.width;x++){
      if(data[(y*art.width+x)*4+3]!==255)continue;
      const px=rect.x+(x+.5)*rect.w/art.width,py=rect.y+(y+.5)*rect.h/art.height;
      if(py>=projectGround(b.x,b.y).y-2)continue;
      const picked=pickMapActorOrFacility({px,py});if(picked?.building===b)return [o.x+zoom*px,o.y+zoom*py];
    }
  },
  clean() {
    state.speed=0;state.buildings=[];state.paths=['1,1','2,3','2,6'];state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];
    state.villageLv=state.worldTreeLevel=20;state.coins=20000;
    for(let x=1;x<=11;x++)for(let y=1;y<=11;y++){state.clearedScenery.push(keyXY(x,y));state.clearedPonds.push(keyXY(x,y))}
    for(const a of [...state.monsters,...state.staff,...state.guests])Object.assign(a,{x:1,y:1,path:[]});
    selectedBuilding=null;selectedMonster=null;buildMode=null;moveMode=null;terrainMode=null;tab='build';renderUI(true);
  }
});`;
const pair = p => [p.x,p.y];
function near(a,b,tolerance=1e-7) {assert(Math.abs(a-b)<=tolerance,`${a} ≠ ${b}`)}
const facing = (d,dir) => click(d,'#facilityFacing [data-facing="'+dir+'"]');

(async()=>{
  const game=await open('1.13.27',{},hooks);
  try {
    const {w,d,f}=game,canvas=d.getElementById('game'),s=f.state();
    for(let i=0;i<150&&!f.readyPlots();i++)await wait(25);
    assert(f.readyPlots());
    const width=canvas.width/3,height=canvas.height/3;
    const box={left:18,top:40,width:352,height:240};
    canvas.getBoundingClientRect=()=>box;
    let held=null;
    canvas.setPointerCapture=id=>{held=id};canvas.hasPointerCapture=id=>held===id;canvas.releasePointerCapture=()=>{held=null};
    const asClient=([x,y])=>[box.left+x*box.width/width,box.top+y*box.height/height];
    function pointer(type,screen) {
      const [clientX,clientY]=asClient(screen);
      const e=new w.MouseEvent(type,{clientX,clientY,button:0,bubbles:true,cancelable:true});
      Object.defineProperties(e,{pointerId:{value:7},pointerType:{value:'touch'}});
      canvas.dispatchEvent(e);
    }
    function tap(screen){pointer('pointerdown',screen);pointer('pointerup',screen)}
    const tile=(x,y)=>f.coords(x+.5,y+.5);
    assert.deepEqual(pair(f.project(1,0)),[32,16]);assert.deepEqual(pair(f.project(0,1)),[-32,16]);
    for(const [x,y] of [[-7.75,14.25],[0,0],[4.23,7.71],[23.125,51.875]]){
      const p=f.project(x,y),world=f.inverse(p.x,p.y);near(world.x,x);near(world.y,y);
    }
    for(const kind of ['grass','road','pond']){
      const tileArt=f.groundTile(4,5,'春',kind);
      assert.deepEqual([tileArt.width,tileArt.height],[64,32]);
      const data=tileArt.getContext('2d').getImageData(0,0,64,32).data;
      for(let y=0;y<32;y++)for(let x=0;x<64;x++){
        const margin=Math.abs(2*y+1-32);
        assert.equal(data[(y*64+x)*4+3],x>=margin&&x<64-margin?255:0,kind+' rhombus');
      }
    }
    for(const z of [.6,1,1.44,2.8]){
      f.camera(8.25,8.75,z);
      for(const [x,y] of [[3.19,4.73],[7.96,9.02],[-.24,12.51],[9.5,7.5]]){
        const hit=f.cell(...asClient(f.coords(x,y)));assert.deepEqual(pair(hit),[Math.floor(x),Math.floor(y)]);
      }
    }
    f.camera(10,8,1);
    const anchor=[width*.57,height*.42],before=f.point(...anchor);
    f.zoomAt(1.68,...anchor);
    const after=f.point(...anchor);near(after.x,before.x,.013);near(after.y,before.y,.013);
    pointer('pointerdown',anchor);pointer('pointermove',[anchor[0]+40,anchor[1]+20]);pointer('pointerup',[anchor[0]+40,anchor[1]+20]);
    const moved=f.point(anchor[0]+40,anchor[1]+20);near(moved.x,before.x,.07);near(moved.y,before.y,.07);

    f.clean();f.camera(5.5,5.5,1.44);
    click(d,'[data-action="build"][data-id="home"]');facing(d,1);
    const art=f.frame('home',1,1),ctx=canvas.getContext('2d'),requests=[],draw=ctx.drawImage.bind(ctx);
    try {
      ctx.drawImage=(image,...args)=>{if(image===art)requests.push(args);return draw(image,...args)};
      f.ghost(3,3);
    } finally {ctx.drawImage=draw}
    assert(requests.some(args=>args.join(',')==='-64,44,128,128'),'preview in its projected lot');
    tap(tile(7,7));assert.equal(s.buildings.length,0);assert.equal(s.coins,20000);
    assert.equal(d.querySelector('#toasts').lastElementChild.textContent,'道に隣接してないと置けません');
    tap(tile(3,3));const home=s.buildings.find(b=>b.type==='home'),cash=s.coins;assert(home);
    assert.deepEqual([home.x,home.y,home.facing],[3,3,1]);
    f.draw(0);tap(tile(8,8));assert.equal(f.selected(),null);
    const roof=f.pickRoof(home);assert(roof,'opaque roof above the model footprint');
    const roofGround=f.point(...roof);assert(roofGround.x<home.x||roofGround.y<home.y);
    tap(roof);assert.equal(f.selected(),home.id);
    const moveHome=()=>click(d,'[data-action="moveBuilding"][data-id="'+home.id+'"]');
    moveHome();facing(d,2);tap(tile(7,7));assert.deepEqual([home.x,home.y,home.facing],[3,3,1]);
    click(d,'[data-action="cancelMove"]');assert.equal(d.querySelector('#facilityFacing [aria-pressed="true"]').dataset.facing,'1');
    moveHome();facing(d,2);tap(tile(3,6));assert.deepEqual([home.x,home.y,home.facing,s.coins],[3,6,2,cash]);
    f.camera(7.5,6.5,1.2);
    click(d,'[data-v16-action="terrain"][data-id="road"]');
    pointer('pointerdown',tile(7,5));pointer('pointermove',tile(8,5));pointer('pointerup',tile(8,5));
    assert(f.isRoad(7,5)&&f.isRoad(8,5));assert(!f.isRoad(8,6));
    click(d,'[data-v16-action="terrain"][data-id="roadErase"]');tap(tile(8,5));assert(!f.isRoad(8,5));
    click(d,'[data-v16-action="terrain"][data-id="pond"]');tap(tile(8,6));assert(f.isWater(8,6));
    click(d,'[data-v16-action="terrain"][data-id="pondErase"]');tap(tile(8,6));assert(!f.isWater(8,6));
    console.log('PASS 64×32 ground and roads, camera, touch drag and zoom, roof hit, construction, rotation, relocation, road and pond tools on the projected grid');
  } finally {game.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
