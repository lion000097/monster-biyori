'use strict';
const {open,assert}=require('./harness138.cjs');

function verifyStar(){
 const check=(ok,label)=>{if(!ok)throw Error(label);};
 let available=null;
 for(let day=1;day<=60&&!available;day++){
  state.day=day;state.hour=20;
  for(let i=0;i<100;i++){tickAccum=i/100;if(shootingStarFrame()){available={day,i};break;}}
 }
 check(available,'at least one clear night has a star');
 state.day=available.day;state.hour=20;tickAccum=available.i/100+.13;
 const star=shootingStarFrame();
 check(star&&star.t>=.4&&star.t<=.48,'same night reaches the readable middle of the trail');
 const m=state.monsters[0],timer=monsterWalkTimer139(m);
 m.path=[];
 const before=JSON.stringify(state),random=Math.random,original=ctx.fillRect,painted=[];
 try{
  Math.random=()=>{throw Error('ambient star must not use gameplay RNG');};
  ctx.fillRect=(...args)=>painted.push(args);
  drawShootingStar(star);
  check(painted.length>=16&&painted.every(([x,y])=>x>=0&&x<VW*T&&y>=0&&y<VH*T*.30),'trail draws visible pixels in upper map');
  check(JSON.stringify(shootingStarFrame())===JSON.stringify(star),'scene is deterministic across draws');
  check(shootingStarLook(m,timer,star,star.x)>.5,'awake nearby creature looks up');
  check(!shootingStarLook(m,timer,star,star.x+VW*T),'distant creature does not react');
  check(JSON.stringify(state)===before,'star rendering and pose do not change save state');
  m.path=[[1,1]];
  check(!shootingStarLook(m,timer,star,star.x),'travel keeps priority');
  m.path=[];m.indoorRest={buildingId:123};
  check(!shootingStarLook(m,timer,star,star.x),'sleep keeps priority');
  delete m.indoorRest;
  timer.pastime={kind:'duskSit'};
  check(shootingStarLook(m,timer,star,star.x)>0,'sitting continues while companion looks up');
  timer.pastime=null;
 }finally{Math.random=random;ctx.fillRect=original;}
 state.hour=12;
 check(!shootingStarFrame(),'no daytime star');
 state.hour=20;
 const weather=weatherInfo;
 try{weatherInfo=()=>({name:'雨'});check(!shootingStarFrame(),'no star when raining');}
 finally{weatherInfo=weather;}
 const savedTick=tickAccum;
 state.speed=0;
 animate(frameAt+100);
 check(tickAccum===savedTick&&JSON.stringify(shootingStarFrame())===JSON.stringify(star),'pause freezes the star window');
 tickAccum=.95;
 check(!shootingStarFrame(),'star ends in the same in-game hour');
 return true;
}

(async()=>{
 const q=await open('working',{},'window.verifyStar='+verifyStar.toString());
 try{assert(q.w.verifyStar());console.log('PASS clear-night shooting star, awake-nearby reaction, route priority, pause, no save or RNG effects');}
 finally{q.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
