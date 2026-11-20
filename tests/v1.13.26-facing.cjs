'use strict';

const {createHash} = require('node:crypto');
const {assert, open, wait, click, persist, backing} = require('./harness138.cjs');
const hooks = `
Object.assign(window.qa138, {
  types: Object.keys(B), art: spriteBuildingV161, artReady: () => facilitySheetReady && treeDecorationReady,
  tap(x,y) {
    const canvas=$('game');
    canvas.getBoundingClientRect=()=>({left:0,top:0,width:VW*T,height:VH*T});
    onMapClick({clientX:(x+.5-cameraX)*T*zoom,clientY:(y+.5-cameraY)*T*zoom});
  },
  ghost(x,y) {hover={x,y};drawWorld(0);hover=null},
  clearPlots() {
    state.buildings=[];state.paths=['1,1','2,3','2,6'];state.removedDefaultPaths=[...DEFAULT_PATH_KEYS];
    state.villageLv=state.worldTreeLevel=20;state.coins=20000;
    for(let x=1;x<=10;x++)for(let y=1;y<=10;y++){
      state.clearedScenery.push(keyXY(x,y));state.clearedPonds.push(keyXY(x,y));
    }
    for(const a of [...state.monsters,...state.staff])Object.assign(a,{x:1,y:1,path:[]});
    selectedBuilding=null;buildMode=null;moveMode=null;tab='build';renderUI(true);
  }
});`;
const pixelData = element => backing(element).getContext('2d').getImageData(0,0,element.width,element.height).data;
const fingerprint = element => createHash('sha256').update(pixelData(element)).digest('hex');
const turn = (d, direction) => click(d,'#facilityFacing [data-facing="'+direction+'"]');

(async () => {
  const previous=await open('1.13.25');
  let snapshot, original;
  try {
    const s=previous.f.state(), home=s.buildings.find(b=>b.type==='home');
    s.speed=0;
    original={id:home.id,x:home.x,y:home.y,level:home.level,coins:s.coins};
    previous.f.save(true);snapshot=persist(previous.w);
  } finally {previous.close()}

  const q=await open('1.13.26',snapshot,hooks);
  try {
    const {d,f}=q, s=f.state();
    for(let i=0;i<80&&!f.artReady();i++)await wait(25);
    assert(f.artReady());assert.equal(f.types.length,26);
    for(const type of f.types) {
      const levels=type==='worldtree'?[1,5,8,10,15,20]:[1,2,4];
      for(const level of levels) {
        const frames=[0,1,2,3].map(dir=>f.art(type,level,dir));
        assert.equal(new Set(frames.map(fingerprint)).size,4,type+' Lv.'+level+' four different paintings');
        for(const img of frames) {
          const pixels=pixelData(img);
          for(let i=3;i<pixels.length;i+=4)assert.equal(pixels[i],255,type+' full footprint');
        }
      }
    }
    assert.equal(f.art('home',1,-1),f.art('home',1,0));
    assert.equal(f.art('home',1,'invalid'),f.art('home',1,0));
    const home=s.buildings.find(b=>b.id===original.id);
    const picker=d.querySelector('#facilityFacing');
    f.tap(home.x,home.y);
    assert.equal(picker.hidden,false);
    assert.equal(picker.querySelector('[aria-pressed="true"]').dataset.facing,'0');
    turn(d,3);
    assert.deepEqual([home.facing,home.x,home.y,home.level,s.coins],
      [3,original.x,original.y,original.level,original.coins]);
    for(const b of s.buildings.filter(b=>b.id!==home.id))assert.equal(b.facing??0,0);
    const tree=s.buildings.find(b=>b.type==='worldtree');
    f.tap(tree.x+2,tree.y+2);turn(d,1);
    assert.equal(fingerprint(d.querySelector('#treePortrait')),fingerprint(f.art('worldtree',tree.level,1)));
    assert.equal(d.querySelector('.worldtree-panel193 canvas').dataset.artFacing,'1');
    click(d,'.worldtree-panel193 [data-v195="moveWorldTree"]');turn(d,3);
    click(d,'[data-action="cancelMove"]');assert.equal(tree.facing,1);
    click(d,'.worldtree-panel193 [data-v195="moveWorldTree"]');turn(d,2);
    f.tap(tree.x,tree.y);assert.equal(tree.facing,2);
    snapshot=persist(q.w);

    f.clearPlots();
    click(d,'[data-action="build"][data-id="home"]');turn(d,1);
    assert.equal(d.querySelector('.build-option.selected canvas').dataset.artFacing,'1');
    const target=f.art('home',1,1), g=d.querySelector('#game').getContext('2d'), requested=[];
    const draw=g.drawImage.bind(g);g.drawImage=(img,...args)=>{if(img===target)requested.push(args);return draw(img,...args)};
    f.ghost(3,3);g.drawImage=draw;
    assert(requested.some(args=>args.join(',')==='96,96,64,64'),'matching map preview at full footprint');
    f.tap(7,7);
    assert.equal(s.buildings.length,0);assert.equal(s.coins,20000);
    assert.equal(d.querySelector('#toasts').lastElementChild.textContent,'道に隣接してないと置けません');
    f.tap(3,3);
    const placed=s.buildings.find(b=>b.type==='home'),cash=s.coins;
    assert.deepEqual([placed.facing,placed.x,placed.y],[1,3,3]);
    const startMove=()=>click(d,'[data-action="moveBuilding"][data-id="'+placed.id+'"]');
    startMove();turn(d,2);f.tap(7,7);
    assert.deepEqual([placed.facing,placed.x,placed.y],[1,3,3]);
    click(d,'[data-action="cancelMove"]');
    assert.equal(picker.querySelector('[aria-pressed="true"]').dataset.facing,'1');
    startMove();turn(d,2);f.tap(3,6);
    assert.deepEqual([placed.facing,placed.x,placed.y,s.coins],[2,3,6,cash]);
    startMove();turn(d,0);f.tap(3,6);
    assert.equal(placed.facing,0);
    assert.equal(JSON.parse(q.w.localStorage.getItem('monster_biyori_save_v1')).buildings.find(b=>b.id===placed.id).facing,0);
    click(d,'[data-action="build"][data-id="farm"]');
    assert.equal(picker.querySelector('[aria-pressed="true"]').dataset.facing,'0');
  } finally {q.close()}

  const again=await open('1.13.26',snapshot,hooks);
  try {
    const s=again.f.state();
    assert.equal(s.buildings.find(b=>b.id===original.id).facing,3);
    assert.equal(s.buildings.find(b=>b.type==='worldtree').facing,2);
    assert.equal(s.coins,original.coins);
    console.log('PASS all 26 facilities in four full-bleed views, growth stages, map and touch controls, previous save, rotation, preview, road validation, cancelled/confirmed relocation and reload');
  } finally {again.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
