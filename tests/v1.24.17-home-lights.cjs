const { open, assert, wait } = require('./harness138.cjs');

const hook = `
window.qaHomeLights={
 ready:()=>facilitySheetReady,
 verify(){
  const check=(ok,label)=>{if(!ok)throw Error(label);};
  const equal=(a,b,label)=>check(JSON.stringify(a)===JSON.stringify(b),label+': '+JSON.stringify(a));
  const home=state.buildings.find(b=>b.type==='home');
  check(!!home,'初期のこもれびハウス');
  const masks=[],pixels=[],signatures=[];
  for(let direction=0;direction<4;direction++){
    home.facing=direction;
    const art=spriteBuildingV161('home',home.level,direction),mask=bedroomWindowMask(art,home);
    const {data}=mask.getContext('2d').getImageData(0,0,mask.width,mask.height);
    let count=0;
    for(let i=3;i<data.length;i+=4)if(data[i])count++;
    check(count>=10,'正面 '+direction+' に窓の明かり');
    masks.push(mask);pixels.push(count);signatures.push(String(data));
  }
  check(new Set(signatures).size===4,'四方向別の窓の明かり');
  home.facing=0;
  state.speed=0;state.hour=22;
  const base=JSON.stringify(state);
  const alpha=[],samples=[];
  let clock=0;
  const original=ctx.drawImage,originalNow=performance.now;
  ctx.drawImage=function(image,...args){
    if(image===masks[0])alpha.push(Math.round(ctx.globalAlpha*10)/10);
    return original.call(this,image,...args);
  };
  performance.now=()=>clock;
  const drawAt=t=>{alpha.length=0;clock=t;drawWorld(t);samples.push([...alpha]);return [...alpha];};
  const [first,second]=state.monsters;
  const sleep=actor=>{
    actor.indoorRest={buildingId:home.id,remaining:1};
    plotWalks.set(actor,{site:home,phase:'use'});
  };
  const wake=actor=>{delete actor.indoorRest;plotWalks.delete(actor);};
  try{
    equal(drawAt(0),[],'空き家は夜も消灯');
    check(JSON.stringify(state)===base,'表示がセーブを更新しない');
    sleep(first);
    equal(drawAt(1),[],'最初の就寝で点灯開始');
    equal(drawAt(231),[.5],'点灯が滑らか');
    sleep(second);
    equal(drawAt(461),[1],'満点灯');
    wake(first);
    equal(drawAt(600),[1],'もう1匹寝ていれば点灯を維持');
    wake(second);
    equal(drawAt(680),[1],'最後が起きて消灯開始');
    equal(drawAt(910),[.5],'消灯が滑らか');
    equal(drawAt(1140),[],'最後が起きた家は消灯');
    state.hour=12;
    sleep(first);
    equal(drawAt(1300),[],'昼に寝ても点灯しない');
    check(state.speed===0,'停止中も表示時刻のフェードは完了');
  }finally{wake(first);wake(second);ctx.drawImage=original;performance.now=originalNow;}
  return {pixels,samples};
 }
};
`;

(async()=>{
 const game=await open('working',{},hook);
 try{
  for(let i=0;i<80&&!game.w.qaHomeLights.ready();i++)await wait(25);
  assert(game.w.qaHomeLights.ready(),'building atlas decoded');
  const results=game.w.qaHomeLights.verify();
  console.log('PASS occupancy, fade, pause, display-only state and four facings',JSON.stringify(results));
 }finally{game.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
